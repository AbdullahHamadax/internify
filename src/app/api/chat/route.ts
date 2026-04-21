// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { Pinecone } from "@pinecone-database/pinecone";
import { HfInference } from "@huggingface/inference";

// Initialize SDKs
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const hf = new HfInference(process.env.HF_TOKEN!);

interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let message: string = body.message;
    const userRole: string = body.userRole || "guest";
    const history: HistoryMessage[] = Array.isArray(body.history) ? body.history : [];

    // 1. Server-side validation
    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Valid message is required" },
        { status: 400 },
      );
    }
    
    // Sanitize and enforce maximum length (500 chars)
    message = message.trim().slice(0, 500);

    const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);

    // 2. Embed the user's incoming question
    const embeddingResponse = await hf.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: message,
    });

    // SAFETY CHECK
    if (!Array.isArray(embeddingResponse)) {
      console.error("HF Error:", embeddingResponse);
      return NextResponse.json(
        {
          error:
            "Failed to generate embedding (Hugging Face is likely loading).",
        },
        { status: 500 },
      );
    }

    const queryVector: number[] = Array.isArray(embeddingResponse[0])
      ? (embeddingResponse[0] as number[])
      : (embeddingResponse as number[]);

    // 3. Search Pinecone for relevant context
    const searchResults = await index.query({
      vector: queryVector,
      topK: 5,
      includeMetadata: true,
    });

    // 4. Extract the text from the Pinecone matches
    const contextText = searchResults.matches
      .map((match) => match.metadata?.text)
      .join("\n\n");

    // 5. Construct the specific Role-Aware System Prompt
    let roleSpecificInstructions = "";
    
    if (userRole === "student") {
      roleSpecificInstructions = `
      CRITICAL ROLE ENFORCEMENT: The user you are talking to is an authenticated STUDENT.
      - You MUST ONLY answer questions relevant to students (applying for tasks, building their profile, finding employers, etc.).
      - You MUST REFUSE to answer any questions that are specific to employers (such as how to post tasks, manage applicants, or review submissions).
      - IMPERSONATION DETECTION: If the user explicitly claims to be an employer, you MUST detect this and respond by saying: "I see you are logged in as a student. I can only assist you with student-related inquiries. If you are an employer, please log in to your employer account."
      `;
    } else if (userRole === "employer") {
      roleSpecificInstructions = `
      CRITICAL ROLE ENFORCEMENT: The user you are talking to is an authenticated EMPLOYER.
      - You MUST ONLY answer questions relevant to employers (posting tasks, reviewing applicants, reviewing submissions, finding talent, etc.).
      - You MUST REFUSE to answer any questions that are specific to students (such as how to apply for tasks, build a student profile, etc.).
      - IMPERSONATION DETECTION: If the user explicitly claims to be a student, you MUST detect this and respond by saying: "I see you are logged in as an employer. I can only assist you with employer-related inquiries. If you are a student, please log in to your student account."
      `;
    } else {
      roleSpecificInstructions = `
      ROLE STANCE: The user is a GUEST browsing the homepage and is not logged in.
      - You are free to answer general platform questions regarding both students and employers.
      - Explain the benefits of the platform for both sides.
      `;
    }

    const systemPrompt = `You are "Dalil" (دَلِيل), meaning "guide" in Arabic — the AI assistant for Internify, a two-sided learning-to-hiring platform connecting students with real employer tasks.

PERSONALITY:
- Friendly, concise, and encouraging.
- Use short bullet lists when listing steps or features.
- If unsure, say so honestly — never fabricate information.
- Keep answers to 2-3 short paragraphs maximum.

CONVERSATION AWARENESS:
- You have access to the conversation history above. Use it to provide contextual follow-ups.
- If the user refers to something they said earlier, check the conversation history.
- Don't repeat information you've already given unless specifically asked.

${roleSpecificInstructions}

KNOWLEDGE BASE (use this to answer accurately):
${contextText}

If the answer is not in the knowledge base above, say: "I don't have specific information about that yet. You can reach out to the Internify team for more details."`;

    // 6. Build conversation messages with history for multi-turn context
    const conversationHistory = history
      .slice(-10) // Keep last 10 messages to stay within context limits
      .filter(
        (msg) =>
          (msg.role === "user" || msg.role === "assistant") &&
          typeof msg.content === "string" &&
          msg.content.trim().length > 0,
      )
      .map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content.slice(0, 500),
      }));

    // 7. Stream Groq response via SSE
    const stream = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
        { role: "user", content: message },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 500,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`),
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          console.error("Stream error:", err);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ text: "\n\nSorry, an error occurred." })}\n\n`,
            ),
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}

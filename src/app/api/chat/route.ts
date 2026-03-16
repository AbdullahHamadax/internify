// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { Pinecone } from "@pinecone-database/pinecone";
import { HfInference } from "@huggingface/inference";

// Initialize SDKs
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const hf = new HfInference(process.env.HF_TOKEN!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let message: string = body.message;
    const userRole: string = body.userRole || "guest"; // Default to guest if not provided

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
      topK: 3,
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

    const systemPrompt = `You are "Dalil", a helpful AI platform assistant for "Internify", a two-sided learning-to-hiring platform. 
    Use the following retrieved context to accurately answer the user's question, but ALWAYS adhere strictly to your Role Enforcement instructions below.
    If the answer is not in the context, politely say you don't know and do not make up information.
    Keep your answers concise, well-structured, and helpful.
    
    ${roleSpecificInstructions}
    
    Context:
    ${contextText}`;

    // 6. Send context and user message to Groq
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
    });

    const reply =
      chatCompletion.choices[0]?.message?.content ||
      "I couldn't generate a response.";

    // 7. Return response to the frontend
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}

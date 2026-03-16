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
    const message: string = body.message;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);

    // 1. Embed the user's incoming question
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

    // 2. Search Pinecone for relevant context
    const searchResults = await index.query({
      vector: queryVector,
      topK: 3,
      includeMetadata: true,
    });

    // 3. Extract the text from the Pinecone matches
    const contextText = searchResults.matches
      .map((match) => match.metadata?.text)
      .join("\n\n");

    // 4. Construct the prompt for Groq
    const systemPrompt = `You are a helpful platform assistant. 
    Use the following context to answer the user's question. 
    If the answer is not in the context, politely say you don't know and do not make up information.
    
    Context:
    ${contextText}`;

    // 5. Send context and user message to Groq
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

    // 6. Return response to the frontend
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}

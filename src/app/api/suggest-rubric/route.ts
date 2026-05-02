// app/api/suggest-rubric/route.ts
import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const description: string = body.description;
    const category: string = body.category ?? "";
    const activeDimensions: string[] = body.activeDimensions ?? [];

    if (
      !description ||
      typeof description !== "string" ||
      !description.trim()
    ) {
      return NextResponse.json(
        { error: "A valid description is required." },
        { status: 400 },
      );
    }

    const trimmedDescription = description.trim().slice(0, 2000);

    const systemPrompt = `You are a rubric evaluation assistant. Your job is to read the task description provided and extract ONLY the main points, key deliverables, requirements, or measurable quality criteria that are explicitly stated or clearly implied in the text.

Rules:
- Every dimension you return MUST be grounded in a specific phrase, sentence, or concept from the description.
- Do NOT invent, generalize, or add dimensions that have no basis in the description text.
- Do NOT duplicate any dimension already listed in the active rubric.
- Each dimension label must be 2–6 words maximum.
- Return a maximum of 6 dimensions.
- If the description is too vague or short to extract meaningful dimensions, return an empty array.

Return ONLY a valid JSON array, no markdown, no preamble:
[
  {
    "id": "uuid-here",
    "label": "Short dimension label",
    "description": "One-line explanation tied to the description",
    "originPhrase": "The exact phrase from the description this came from"
  }
]`;

    const userPrompt = `Task Description:
"""
${trimmedDescription}
"""

${category ? `Category context: ${category}` : ""}

Active Rubric Dimensions (do NOT duplicate these): ${JSON.stringify(activeDimensions)}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      max_tokens: 600,
    });

    const raw = completion.choices[0]?.message?.content ?? "";

    // Extract JSON from the response — could be a top-level array or wrapped object
    const arrayMatch = raw.match(/\[[\s\S]*\]/);
    if (!arrayMatch) {
      console.error("[suggest-rubric] Failed to parse AI response:", raw);
      return NextResponse.json({ suggestions: [] }, { status: 200 });
    }

    const parsed = JSON.parse(arrayMatch[0]);

    // Validate and normalize
    const activeLower = new Set(
      (activeDimensions ?? []).map((d) => d.toLowerCase()),
    );

    const suggestions: {
      label: string;
      description: string;
      originPhrase: string;
    }[] = Array.isArray(parsed)
      ? parsed
          .filter(
            (s: { label?: string; description?: string }) =>
              typeof s.label === "string" &&
              s.label.trim().length > 0 &&
              !activeLower.has(s.label.trim().toLowerCase()),
          )
          .map(
            (s: {
              label: string;
              description?: string;
              originPhrase?: string;
            }) => ({
              label: s.label.trim(),
              description:
                typeof s.description === "string" ? s.description.trim() : "",
              originPhrase:
                typeof s.originPhrase === "string"
                  ? s.originPhrase.trim()
                  : "",
            }),
          )
          .slice(0, 6)
      : [];

    return NextResponse.json({ suggestions }, { status: 200 });
  } catch (error) {
    console.error("[suggest-rubric] Error:", error);
    return NextResponse.json({ suggestions: [] }, { status: 200 });
  }
}

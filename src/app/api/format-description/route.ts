import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { GROQ_MODEL, GROQ_REASONING_CONFIG } from "@/lib/groq";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

/**
 * POST /api/format-description
 *
 * Accepts { description: string } and uses Llama 3.3 70b to restructure messy
 * employer-written task descriptions into clean sections: a short summary
 * paragraph, requirements bullets, and deliverables bullets.
 *
 * Returns JSON: { summary: string | null, requirements: string[] | null, deliverables: string[] | null }
 *
 * The model is instructed to ONLY reorganize existing content — never invent
 * information that isn't present in the original text.
 */

const SYSTEM_PROMPT = `You are a task-description formatter for a hiring platform. Your job is to take a raw, potentially messy task description and reorganize it into clean structured sections.

RULES — follow these EXACTLY:
1. You MUST return valid JSON with this exact shape:
   { "summary": string | null, "requirements": string[] | null, "deliverables": string[] | null }
2. "summary" is a short 1-3 sentence overview of the task. Extract this from the description text.
3. "requirements" is an array of clear bullet-point strings listing what the student must do or implement. Each item should be a single, clean sentence.
4. "deliverables" is an array of clear bullet-point strings listing what the student must submit/produce.
5. If the description doesn't clearly contain requirements, set "requirements" to null.
6. If the description doesn't clearly contain deliverables, set "deliverables" to null.
7. ACCURACY IS PARAMOUNT: NEVER invent, add, or hallucinate information that is not present in the original text. Only reorganize and lightly rephrase what is already there.
8. Clean up formatting issues: fix spacing, remove duplicate content, normalize bullet styles.
9. Keep the original meaning and technical details 100% intact.
10. Return ONLY the JSON object — no markdown, no code fences, no explanation.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const description: string = body.description;

    if (
      !description ||
      typeof description !== "string" ||
      !description.trim()
    ) {
      return NextResponse.json(
        { error: "Valid description is required" },
        { status: 400 },
      );
    }

    // Cap at 5000 chars to stay within context limits
    const trimmed = description.trim().slice(0, 5000);

    // Very short descriptions don't need AI formatting
    if (trimmed.length < 80) {
      return NextResponse.json({
        summary: trimmed,
        requirements: null,
        deliverables: null,
      });
    }

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Format this task description:\n\n${trimmed}`,
        },
      ],
      model: GROQ_MODEL,
      ...GROQ_REASONING_CONFIG,
      temperature: 0,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json(
        { error: "Empty response from model" },
        { status: 502 },
      );
    }

    // Parse and validate the shape
    const parsed = JSON.parse(raw);
    const result = {
      summary:
        typeof parsed.summary === "string" ? parsed.summary : null,
      requirements: Array.isArray(parsed.requirements)
        ? parsed.requirements.filter(
            (r: unknown) => typeof r === "string" && r.trim(),
          )
        : null,
      deliverables: Array.isArray(parsed.deliverables)
        ? parsed.deliverables.filter(
            (d: unknown) => typeof d === "string" && d.trim(),
          )
        : null,
    };

    // Don't return empty arrays — treat as null
    if (result.requirements?.length === 0) result.requirements = null;
    if (result.deliverables?.length === 0) result.deliverables = null;

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Format-description API Error:", error);
    return NextResponse.json(
      { error: "Failed to format description" },
      { status: 500 },
    );
  }
}

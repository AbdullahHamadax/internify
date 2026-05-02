// app/api/detect-skills/route.ts
import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const description: string = body.description;
    const availableSkills: string[] = body.availableSkills;

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

    if (!Array.isArray(availableSkills) || availableSkills.length === 0) {
      return NextResponse.json(
        { error: "Available skills list is required." },
        { status: 400 },
      );
    }

    const trimmedDescription = description.trim().slice(0, 2000);

    const systemPrompt = `You are a precise skill-detection engine for a task-posting platform. Given a task description and a list of available skills, you must:

1. DETECT: Identify which skills from the "Available Skills" list are explicitly or implicitly required by the description. Be thorough but accurate — only match skills that are genuinely relevant.
2. SUGGEST: Recommend additional skills, frameworks, or technologies that are NOT in the available skills list but would be useful to complete the task. These should be specific and actionable (e.g. "Pandas", "NumPy", "Scikit-learn") — not vague categories.

RULES:
- Return ONLY valid JSON, no markdown, no explanation.
- "detected" must only contain exact strings from the Available Skills list.
- "suggested" must NOT contain any strings from the Available Skills list.
- "suggested" should have at most 8 items.
- Each suggested skill should be a properly capitalized technology/framework name.

Respond with this exact JSON structure:
{
  "detected": ["SkillA", "SkillB"],
  "suggested": ["FrameworkX", "LibraryY"]
}`;

    const userPrompt = `Available Skills: ${JSON.stringify(availableSkills)}

Task Description:
"""
${trimmedDescription}
"""`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_tokens: 400,
    });

    const raw = completion.choices[0]?.message?.content ?? "";

    // Extract JSON from the response (handle potential markdown wrapping)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[detect-skills] Failed to parse AI response:", raw);
      return NextResponse.json(
        { detected: [], suggested: [] },
        { status: 200 },
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate: only allow detected skills that are actually in the available pool
    const availableSet = new Set(
      availableSkills.map((s) => s.toLowerCase()),
    );
    const detected: string[] = Array.isArray(parsed.detected)
      ? parsed.detected.filter((s: string) =>
          availableSet.has(s.toLowerCase()),
        )
      : [];

    // Normalize detected to match exact casing from availableSkills
    const normalizedDetected = detected.map((d: string) => {
      const match = availableSkills.find(
        (a) => a.toLowerCase() === d.toLowerCase(),
      );
      return match ?? d;
    });

    const suggested: string[] = Array.isArray(parsed.suggested)
      ? parsed.suggested
          .filter(
            (s: string) =>
              typeof s === "string" &&
              s.trim().length > 0 &&
              !availableSet.has(s.toLowerCase()),
          )
          .slice(0, 8)
      : [];

    return NextResponse.json(
      { detected: normalizedDetected, suggested },
      { status: 200 },
    );
  } catch (error) {
    console.error("[detect-skills] Error:", error);
    return NextResponse.json(
      { detected: [], suggested: [] },
      { status: 200 },
    );
  }
}

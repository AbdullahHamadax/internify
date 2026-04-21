import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

function normalizeString(value: unknown) {
  if (typeof value !== "string") return undefined;

  const normalized = value.trim();
  if (!normalized || normalized.toLowerCase() === "null") {
    return undefined;
  }

  return normalized;
}

function normalizeUrl(value: unknown) {
  const normalized = normalizeString(value);
  if (!normalized) return undefined;

  if (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("mailto:")
  ) {
    return normalized;
  }

  if (/^(www\.)?[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(normalized)) {
    return `https://${normalized.replace(/^www\./i, "www.")}`;
  }

  return undefined;
}

function normalizeNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function normalizeSkills(value: unknown) {
  if (!Array.isArray(value)) return undefined;

  const deduped = Array.from(
    new Set(
      value
        .map((skill) => normalizeString(skill))
        .filter((skill): skill is string => Boolean(skill)),
    ),
  );

  return deduped.length > 0 ? deduped : undefined;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cvText = typeof body?.cvText === "string" ? body.cvText : "";

    if (cvText.trim().length < 50) {
      return NextResponse.json(
        {
          error:
            "We saved your CV, but couldn't extract enough text to auto-fill your profile.",
        },
        { status: 400 },
      );
    }

    const truncatedText = cvText.trim().slice(0, 12000);

    const systemPrompt = `You extract structured profile data from student CVs/resumes.

Rules:
- Return ONLY valid JSON.
- Use null for unknown values.
- Never invent facts that are not supported by the CV text.
- Keep "city" to the city name only when possible.
- Keep "location" as the most specific plain-text location shown in the CV.
- "description" should be a concise 1-2 sentence professional summary based only on the CV.
- "graduationYear" must be a number like 2026 or null.
- "gpa" must be a number like 3.6 or null.
- "skills" must be an array of unique strings.
- Keep URLs only when explicitly present in the CV.

Return JSON in this exact shape:
{
  "firstName": "string or null",
  "lastName": "string or null",
  "email": "string or null",
  "phone": "string or null",
  "city": "string or null",
  "location": "string or null",
  "title": "string or null",
  "description": "string or null",
  "portfolio": "string or null",
  "github": "string or null",
  "linkedin": "string or null",
  "skills": ["skill1", "skill2"],
  "university": "string or null",
  "degree": "string or null",
  "graduationYear": 2026,
  "gpa": 3.7
}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: truncatedText },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const rawReply = chatCompletion.choices[0]?.message?.content;
    if (!rawReply) {
      return NextResponse.json(
        { error: "We saved your CV, but couldn't auto-fill your profile." },
        { status: 500 },
      );
    }

    const parsed = JSON.parse(rawReply);
    const graduationYear = normalizeNumber(parsed?.graduationYear);
    const gpa = normalizeNumber(parsed?.gpa);

    return NextResponse.json({
      profile: {
        firstName: normalizeString(parsed?.firstName),
        lastName: normalizeString(parsed?.lastName),
        email: normalizeString(parsed?.email),
        phone: normalizeString(parsed?.phone),
        city: normalizeString(parsed?.city),
        location: normalizeString(parsed?.location),
        title: normalizeString(parsed?.title),
        description: normalizeString(parsed?.description),
        portfolio: normalizeUrl(parsed?.portfolio),
        github: normalizeUrl(parsed?.github),
        linkedin: normalizeUrl(parsed?.linkedin),
        skills: normalizeSkills(parsed?.skills),
        university: normalizeString(parsed?.university),
        degree: normalizeString(parsed?.degree),
        graduationYear:
          graduationYear != null &&
          graduationYear >= 1900 &&
          graduationYear <= 2100
            ? Math.trunc(graduationYear)
            : undefined,
        gpa:
          gpa != null && gpa >= 0 && gpa <= 5
            ? Number(gpa.toFixed(2))
            : undefined,
      },
    });
  } catch (error) {
    console.error("Parse CV Profile API Error:", error);
    return NextResponse.json(
      { error: "We saved your CV, but couldn't auto-fill your profile." },
      { status: 500 },
    );
  }
}

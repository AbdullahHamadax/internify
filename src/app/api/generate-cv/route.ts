import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

/**
 * POST /api/generate-cv
 *
 * Accepts raw student profile data, sends it to Llama 3 via Groq,
 * and returns a structured ATS-optimized CV as JSON.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fullName,
      email,
      title,
      location,
      description,
      academicStatus,
      fieldOfStudy,
      skills,
      portfolio,
      github,
      linkedin,
      completedTasks,
    } = body;

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Name and email are required to generate a CV." },
        { status: 400 }
      );
    }

    // Build a raw text representation of everything we know about this student
    const rawProfileText = `
STUDENT PROFILE DATA:
- Full Name: ${fullName}
- Email: ${email}
- Professional Title: ${title || "Not specified"}
- Location: ${location || "Not specified"}
- Academic Status: ${academicStatus || "Not specified"}
- Field of Study: ${fieldOfStudy || "Not specified"}
- Bio/Description: ${description || "Not provided"}
- Skills: ${skills?.length ? skills.join(", ") : "None listed"}
- Portfolio: ${portfolio || "None"}
- GitHub: ${github || "None"}
- LinkedIn: ${linkedin || "None"}

COMPLETED TASKS (work experience on the platform):
${
  completedTasks?.length
    ? completedTasks
        .map(
          (task: { title: string; companyName: string; completedDate: string; category: string; skillLevel: string; skills: string[] }) =>
            `- Task: "${task.title}" at ${task.companyName} (${task.category}, ${task.skillLevel}) — Completed: ${task.completedDate}. Skills used: ${task.skills?.join(", ") || "N/A"}`
        )
        .join("\n")
    : "No completed tasks yet."
}
    `.trim();

    const systemPrompt = `You are an expert CV writer specializing in ATS-optimized resumes. 
Your job is to take raw student profile data and transform it into a polished, professional CV.

RULES:
1. Write a compelling professional summary (2-3 sentences) using action verbs and relevant keywords.
2. For the experience section, transform each completed task into a professional experience entry with:
   - The company name as the employer
   - A relevant job title derived from the task category and skill level
   - The completion date formatted as "Month Year"
   - 2-3 bullet points describing what was accomplished, using strong action verbs (e.g., "Developed", "Implemented", "Designed", "Delivered")
3. For education, use the academic status and field of study to create a proper education entry.
4. For skills, organize them into categories (e.g., "Programming Languages", "Frameworks", "Tools") if possible.
5. Keep all content factual — do NOT invent information that wasn't provided.
6. If the student has no completed tasks, still produce a valid CV with the available information.

RESPOND WITH ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "summary": "Professional summary paragraph",
  "experience": [
    {
      "company": "Company Name",
      "jobTitle": "Derived Job Title",
      "date": "Month Year",
      "bullets": ["Achievement 1", "Achievement 2"]
    }
  ],
  "education": [
    {
      "institution": "University / Academic Program",
      "degree": "Degree or Status",
      "field": "Field of Study",
      "date": "Current or Expected Graduation"
    }
  ],
  "skills": {
    "Category Name": ["Skill1", "Skill2"]
  },
  "links": {
    "portfolio": "url or null",
    "github": "url or null",
    "linkedin": "url or null"
  }
}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: rawProfileText },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const rawReply = chatCompletion.choices[0]?.message?.content;
    if (!rawReply) {
      return NextResponse.json(
        { error: "AI failed to generate CV content." },
        { status: 500 }
      );
    }

    // Parse and validate the JSON response
    const cvData = JSON.parse(rawReply);

    return NextResponse.json({ cv: cvData });
  } catch (error) {
    console.error("Generate CV API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate CV. Please try again." },
      { status: 500 }
    );
  }
}

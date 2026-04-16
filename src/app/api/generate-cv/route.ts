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
      description,
      academicStatus,
      fieldOfStudy,
      skills,
      portfolio,
      github,
      linkedin,
      completedTasks,
      // New extended fields
      university,
      degree,
      graduationYear,
      gpa,
      phone,
      city,
    } = body;

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Name and email are required to generate a CV." },
        { status: 400 }
      );
    }

    const address = city ? `${city}, Egypt` : null;

    // Build a raw text representation of everything we know about this student
    const rawProfileText = `
STUDENT PROFILE DATA:
- Full Name: ${fullName}
- Email: ${email}
- Phone: ${phone || "Not provided"}
- Address: ${address || "Not specified"}
- Professional Title: ${title || "Not specified"}
- Academic Status: ${academicStatus || "Not specified"}
- University: ${university || "Not specified"}
- College / Faculty: Faculty of Computing and Information Technology
- Degree Name: ${degree || "Not specified"}
- Field of Study: ${fieldOfStudy || "Not specified"}
- Graduation Year: ${graduationYear || "Not specified"}
- GPA: ${gpa != null ? `${gpa} / 4.0` : "Not specified"}
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

    const systemPrompt = `You are an expert CV writer specializing in ATS-optimized resumes for Egyptian CS students.
Your job is to take raw student profile data and transform it into a polished, professional CV.

RULES:
1. Write a compelling professional summary (2-3 sentences) using action verbs and relevant keywords.
2. For the experience section, transform each completed task into a professional experience entry with:
   - The company name as the employer
   - A relevant job title derived from the task category and skill level
   - The completion date formatted as "Month Year"
   - 2-3 bullet points describing what was accomplished, using strong action verbs
3. For education, use the provided university, college ("Faculty of Computing and Information Technology"), degree name, field of study, and graduation year. Include GPA if provided.
4. For skills, organize them into categories (e.g., "Programming Languages", "Frameworks", "Tools") if possible.
5. Keep all content factual — do NOT invent information that wasn't provided.
6. If the student has no completed tasks, still produce a valid CV with the available information.
7. Include phone and address in the output exactly as provided.

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
      "institution": "University Name",
      "college": "Faculty of Computing and Information Technology",
      "degree": "Bachelor's Degree Name",
      "field": "Field of Study",
      "date": "Expected Graduation Year or 'Current'",
      "gpa": "GPA / 4.0 or null"
    }
  ],
  "skills": {
    "Category Name": ["Skill1", "Skill2"]
  },
  "links": {
    "portfolio": "url or null",
    "github": "url or null",
    "linkedin": "url or null"
  },
  "phone": "phone number or null",
  "address": "City, Egypt or null"
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

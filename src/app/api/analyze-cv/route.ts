import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

/**
 * POST /api/analyze-cv
 *
 * Accepts extracted CV text + the student's field of study,
 * sends it to Llama 3 via Groq for ATS analysis,
 * and returns an ATS score with field-specific recommendations.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cvText, fieldOfStudy } = body;

    if (!cvText || typeof cvText !== "string" || cvText.trim().length < 50) {
      return NextResponse.json(
        {
          error:
            "Could not extract enough text from the PDF. Please upload a text-based PDF (not a scanned image).",
        },
        { status: 400 }
      );
    }

    // Truncate to ~8000 chars to stay within context limits
    const truncatedText = cvText.trim().slice(0, 8000);
    const field = fieldOfStudy || "General";

    const systemPrompt = `You are an expert ATS (Applicant Tracking System) analyst and career coach specializing in the "${field}" field.

Your job is to analyze a CV/resume and provide:
1. An ATS compatibility score from 0-100
2. A breakdown of scoring criteria
3. Field-specific recommendations to improve the CV for the "${field}" industry

SCORING CRITERIA (evaluate each 0-100):
- **Formatting & Structure**: Single-column layout, standard headings (Experience, Education, Skills), no tables/graphics, consistent formatting
- **Keyword Optimization**: Relevant industry keywords for ${field}, action verbs, technical terms
- **Content Quality**: Quantified achievements, clear descriptions, relevant experience
- **Contact Information**: Complete and professional (name, email, phone, LinkedIn)
- **Skills Section**: Relevant skills listed, properly categorized for ${field}
- **Education**: Properly formatted, relevant to ${field}
- **Overall ATS Parsability**: Can an ATS robot correctly parse all sections?

RESPOND WITH ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "overallScore": 75,
  "breakdown": [
    { "criterion": "Formatting & Structure", "score": 80, "comment": "Brief explanation" },
    { "criterion": "Keyword Optimization", "score": 60, "comment": "Brief explanation" },
    { "criterion": "Content Quality", "score": 75, "comment": "Brief explanation" },
    { "criterion": "Contact Information", "score": 90, "comment": "Brief explanation" },
    { "criterion": "Skills Section", "score": 70, "comment": "Brief explanation" },
    { "criterion": "Education", "score": 85, "comment": "Brief explanation" },
    { "criterion": "ATS Parsability", "score": 65, "comment": "Brief explanation" }
  ],
  "strengths": [
    "Specific strength 1",
    "Specific strength 2",
    "Specific strength 3"
  ],
  "recommendations": [
    {
      "priority": "high",
      "title": "Short title",
      "description": "Detailed, actionable recommendation specific to the ${field} field"
    },
    {
      "priority": "medium",
      "title": "Short title",
      "description": "Detailed, actionable recommendation"
    },
    {
      "priority": "low",
      "title": "Short title",
      "description": "Detailed, actionable recommendation"
    }
  ],
  "missingKeywords": ["keyword1", "keyword2", "keyword3"],
  "summary": "2-3 sentence overall assessment of the CV for ${field} roles"
}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Analyze this CV for a ${field} position:\n\n${truncatedText}`,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const rawReply = chatCompletion.choices[0]?.message?.content;
    if (!rawReply) {
      return NextResponse.json(
        { error: "AI failed to analyze the CV." },
        { status: 500 }
      );
    }

    const analysis = JSON.parse(rawReply);
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("CV Analysis API Error:", error);
    return NextResponse.json(
      { error: "Failed to analyze CV. Please try again." },
      { status: 500 }
    );
  }
}

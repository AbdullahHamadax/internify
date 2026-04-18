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

    const systemPrompt = `You are an expert ATS (Applicant Tracking System) analyst and senior technical recruiter who specializes in hiring for "${field}" roles.

You are reading plain text that was extracted from a PDF resume. ATS systems parse resumes the same way — as raw text. Your analysis must reflect how well THIS TEXT would be parsed and ranked by real ATS software.

TASK: Analyze the resume text below and score it across 7 criteria. Each score must be independent and justified by specific evidence from the text.

SCORING CRITERIA (0-100 each, judge independently):

1. **Formatting & Structure**
   - Look at how the extracted text flows. Clear section headers like "Experience", "Education", "Skills"? Or is text jumbled, with columns merged, dates separated from job titles, or sections running together?
   - Well-structured single-column CVs extract cleanly with logical flow. Multi-column or graphical CVs produce chaotic, interleaved text.
   - Score 80+ only if text flows perfectly with clear headers. Score below 40 if text is jumbled or headers are missing/unclear.

2. **Keyword Optimization**
   - Does the resume contain specific technical keywords, tools, frameworks, and methodologies relevant to "${field}"?
   - Count actual matching keywords. 10+ relevant keywords = 80+. Under 5 = below 50.

3. **Content Quality**
   - Are bullet points quantified with specific numbers, percentages, dollar amounts, or metrics?
   - Vague descriptions like "helped improve sales" = low score. "Increased sales by 34% over 6 months" = high score.
   - Count how many bullet points have metrics. If fewer than 30% have numbers, score below 50.

4. **Contact Information**
   - Is there a name, email, phone number, and LinkedIn/portfolio URL clearly present?
   - All 4 present = 90+. Missing 1 = 70. Missing 2+ = below 50.

5. **Skills Section**
   - Is there a dedicated skills section? Are skills relevant to "${field}"?
   - Well-organized and relevant = 80+. Missing or irrelevant = below 40.

6. **Education**
   - Is education clearly listed with institution, degree, and dates?
   - Complete and relevant to ${field} = 80+. Incomplete = 50-70. Missing = below 30.

7. **ATS Parsability**
   - Overall: would an ATS robot correctly identify the candidate's name, current role, work history, and skills from this text?
   - If the text has random symbols, merged columns, or unintelligible sections, score below 40.

IMPORTANT RULES:
- Each criterion score must be justified with a specific quote or observation from the actual resume text.
- Do NOT use generic comments like "good formatting" or "could improve keywords". Reference what you actually see.
- Different resumes MUST get different scores. Evaluate what is actually in front of you.
- Provide 3-5 recommendations, each referencing specific content from the resume.

RESPOND WITH ONLY valid JSON (no markdown, no code fences):
{
  "breakdown": [
    { "criterion": "Formatting & Structure", "score": <number>, "comment": "<specific observation from the text>" },
    { "criterion": "Keyword Optimization", "score": <number>, "comment": "<list specific keywords found or missing>" },
    { "criterion": "Content Quality", "score": <number>, "comment": "<cite specific bullet points and whether they have metrics>" },
    { "criterion": "Contact Information", "score": <number>, "comment": "<list which contact details are present vs missing>" },
    { "criterion": "Skills Section", "score": <number>, "comment": "<name actual skills found and assess relevance>" },
    { "criterion": "Education", "score": <number>, "comment": "<cite the education details found>" },
    { "criterion": "ATS Parsability", "score": <number>, "comment": "<describe how cleanly or poorly the text parses>" }
  ],
  "strengths": [
    "<strength citing specific text from the resume>",
    "<another strength citing specific text>"
  ],
  "recommendations": [
    {
      "priority": "high",
      "title": "<specific actionable title>",
      "description": "<reference exact text from resume and explain how to improve it>"
    },
    {
      "priority": "medium",
      "title": "<specific actionable title>",
      "description": "<reference exact text from resume and explain how to improve it>"
    },
    {
      "priority": "low",
      "title": "<specific actionable title>",
      "description": "<reference exact text from resume and explain how to improve it>"
    }
  ],
  "missingKeywords": ["<actual missing ${field} keyword>", "<another>"],
  "summary": "<2-3 sentences referencing the candidate's actual name, background, and specific improvements needed for ${field} roles>"
}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Here is the raw text extracted from a PDF resume. Analyze it for a ${field} position. Remember: score each criterion independently based on evidence you find in the text.\n\n---BEGIN RESUME TEXT---\n${truncatedText}\n---END RESUME TEXT---`,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.4,
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

    // Compute overallScore server-side as the true average of breakdown scores
    // This removes the LLM's ability to anchor to any fixed number
    if (Array.isArray(analysis.breakdown)) {
      const scores = analysis.breakdown
        .map((b: { score?: number }) => b.score)
        .filter((s: unknown): s is number => typeof s === "number");
      analysis.overallScore =
        scores.length > 0
          ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
          : 0;
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("CV Analysis API Error:", error);
    return NextResponse.json(
      { error: "Failed to analyze CV. Please try again." },
      { status: 500 }
    );
  }
}

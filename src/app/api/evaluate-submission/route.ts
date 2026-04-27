import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

// ── Agent Routing ──

const CATEGORY_TO_AGENT: Record<string, string> = {
  "Web Development": "web",
  "Frontend Development": "web",
  "UI/UX Design": "web",
  "Backend Development": "fullstack",
  "Full Stack": "fullstack",
  "Full Stack Development": "fullstack",
  "Mobile Development": "fullstack",
  "AI/ML": "ai_ml",
  "Data Science": "ai_ml",
  "Machine Learning": "ai_ml",
  "Deep Learning": "ai_ml",
  "Software Engineering": "se",
  "DevOps": "se",
  "Cloud Computing": "se",
  "Database Administration": "se",
  "Networking": "se",
  "Embedded Systems": "se",
  "Game Development": "fullstack",
  "Blockchain": "fullstack",
  "Cybersecurity": "cybersec",
  "Security": "cybersec",
};

function resolveAgent(category: string): string {
  // Direct lookup
  if (CATEGORY_TO_AGENT[category]) return CATEGORY_TO_AGENT[category];
  // Case-insensitive partial match
  const lower = category.toLowerCase();
  for (const [key, agent] of Object.entries(CATEGORY_TO_AGENT)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return agent;
    }
  }
  return "se"; // Default fallback: Software Engineering
}

// ── Agent System Prompts & Rubrics ──

interface AgentConfig {
  role: string;
  dimensions: string[];
  extraInstructions?: string;
}

const AGENT_CONFIGS: Record<string, AgentConfig> = {
  web: {
    role: "expert Web Development evaluator specializing in frontend technologies",
    dimensions: [
      "Semantic HTML & Structure",
      "CSS Quality & Responsive Design",
      "JavaScript / Framework Correctness",
      "Accessibility (a11y)",
      "User Experience & Visual Design",
      "Code Organization & Best Practices",
    ],
  },
  ai_ml: {
    role: "expert AI/ML and Data Science evaluator",
    dimensions: [
      "Data Preprocessing & Cleaning",
      "Model Choice & Justification",
      "Evaluation Metrics & Validation",
      "Data Leakage Prevention",
      "Code Clarity & Documentation",
      "Results Interpretation",
    ],
  },
  fullstack: {
    role: "expert Full Stack Development evaluator",
    dimensions: [
      "API Design & RESTful Practices",
      "Database Schema & Queries",
      "Authentication & Authorization",
      "Error Handling & Edge Cases",
      "Separation of Concerns",
      "Code Quality & Maintainability",
    ],
  },
  se: {
    role: "expert Software Engineering evaluator",
    dimensions: [
      "Code Structure & Architecture",
      "Naming Conventions & Readability",
      "Testing & Test Coverage",
      "Design Patterns & SOLID Principles",
      "Documentation & Comments",
      "Error Handling & Robustness",
    ],
  },
  cybersec: {
    role: "expert Cybersecurity evaluator focused on defensive security",
    dimensions: [
      "OWASP Top 10 Compliance",
      "Input Validation & Sanitization",
      "Authentication & Session Management",
      "Secrets Management",
      "Threat Modeling Awareness",
      "Secure Coding Practices",
    ],
    extraInstructions: `CRITICAL SECURITY GUARDRAIL:
You evaluate DEFENSIVE security only. You identify vulnerabilities to help the student FIX them.
NEVER provide exploit code, attack instructions, working payloads, or step-by-step exploitation guides.
Output ALL findings as defensive recommendations only.
If the submission contains potentially malicious code, note it as a security concern but do NOT reproduce or enhance it.`,
  },
};

function buildSystemPrompt(agentType: string, taskDescription: string, taskSkills: string[]): string {
  const config = AGENT_CONFIGS[agentType] ?? AGENT_CONFIGS.se;
  const dimensionsList = config.dimensions.map((d, i) => `${i + 1}. **${d}** (0-100)`).join("\n");

  return `You are an ${config.role}.

${config.extraInstructions ?? ""}

TASK CONTEXT:
${taskDescription}

REQUIRED SKILLS: ${taskSkills.join(", ") || "General"}

YOUR JOB: Evaluate the student's submission against the following rubric dimensions. Each score must be independent and justified with specific evidence from the submitted code/content.

RUBRIC DIMENSIONS (score each 0-100):
${dimensionsList}

SCORING GUIDELINES:
- 90-100: Exceptional — exceeds expectations, professional quality
- 75-89: Good — meets requirements with minor issues
- 60-74: Satisfactory — functional but needs improvement
- 40-59: Needs Work — significant issues, partially meets requirements
- 20-39: Poor — major gaps, barely meets minimum requirements
- 0-19: Absent/Insufficient — content for this dimension is missing or completely inadequate

CRITICAL SCORING CALIBRATION (MANDATORY):
- If a dimension's content is COMPLETELY ABSENT (e.g., no tests at all, no documentation, no error handling), the score MUST be 0-15. You CANNOT give 60+ for something that doesn't exist.
- Your comment and score must be LOGICALLY CONSISTENT. If you write "no tests found", the score must be 0-15, NOT 60.
- A score of 60+ means the submission DEMONSTRABLY contains working content for that dimension.
- When in doubt, score LOWER. Students can resubmit to improve.

IMPORTANT RULES:
- Reference SPECIFIC code, patterns, or content from the submission in your comments
- Do NOT use generic feedback. Every comment must cite evidence from the actual submission
- Be constructive — frame weaknesses as growth opportunities with actionable advice
- The overall score is the weighted average you calculate from all dimensions
- The verdict must be one of: "Excellent", "Good", "Satisfactory", "Needs Improvement", "Insufficient"

RESPOND WITH ONLY valid JSON (no markdown, no code fences):
{
  "agentType": "${agentType}",
  "overallScore": <number 0-100>,
  "verdict": "<Excellent|Good|Satisfactory|Needs Improvement|Insufficient>",
  "scores": [
    { "dimension": "<dimension name>", "score": <number>, "comment": "<specific observation from the submission>" }
  ],
  "strengths": ["<strength citing specific code/content>", "<another strength>"],
  "improvements": ["<specific actionable improvement>", "<another improvement>"],
  "summary": "<2-3 sentence narrative summary of the evaluation, referencing specific aspects of the submission>"
}`;
}

// ── Content Extraction Helpers ──

async function extractTextFromUrl(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch file: ${response.status}`);
  return await response.text();
}

function extractFromIpynb(rawJson: string): string {
  try {
    const notebook = JSON.parse(rawJson);
    const cells: string[] = [];

    for (const cell of notebook.cells ?? []) {
      const source = Array.isArray(cell.source) ? cell.source.join("") : (cell.source ?? "");
      if (cell.cell_type === "code") {
        cells.push(`# [Code Cell]\n${source}`);
        // Extract text outputs
        if (Array.isArray(cell.outputs)) {
          for (const output of cell.outputs) {
            if (output.text) {
              const text = Array.isArray(output.text) ? output.text.join("") : output.text;
              cells.push(`# [Output]\n${text}`);
            }
            if (output.data?.["text/plain"]) {
              const text = Array.isArray(output.data["text/plain"])
                ? output.data["text/plain"].join("")
                : output.data["text/plain"];
              cells.push(`# [Output]\n${text}`);
            }
          }
        }
      } else if (cell.cell_type === "markdown") {
        cells.push(`# [Markdown Cell]\n${source}`);
      }
    }

    return cells.join("\n\n");
  } catch {
    return rawJson; // Fallback: return raw content
  }
}

async function extractFromGitHub(repoUrl: string): Promise<string> {
  // Parse GitHub URL: https://github.com/user/repo or https://github.com/user/repo/tree/branch
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) throw new Error("Invalid GitHub URL");

  const [, owner, repoRaw] = match;
  const repo = repoRaw.replace(/\.git$/, "");

  // Fetch the repo tree (recursive)
  const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`;
  let treeResponse = await fetch(treeUrl, {
    headers: { Accept: "application/vnd.github.v3+json" },
  });

  // Try 'master' branch if 'main' fails
  if (!treeResponse.ok) {
    const fallbackUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`;
    treeResponse = await fetch(fallbackUrl, {
      headers: { Accept: "application/vnd.github.v3+json" },
    });
  }

  if (!treeResponse.ok) {
    throw new Error(`Failed to fetch GitHub repo: ${treeResponse.status}`);
  }

  const tree = await treeResponse.json();

  // Filter for code files (not images, not node_modules, not .git)
  const codeExtensions = [
    ".py", ".js", ".ts", ".tsx", ".jsx", ".java", ".cpp", ".c", ".h",
    ".html", ".css", ".scss", ".json", ".md", ".sql", ".rb", ".go",
    ".rs", ".php", ".swift", ".kt", ".ipynb",
  ];
  const excludePaths = ["node_modules/", ".git/", "dist/", "build/", "__pycache__/", ".next/"];

  const codeFiles = (tree.tree ?? [])
    .filter((f: { type: string; path: string; size?: number }) => {
      if (f.type !== "blob") return false;
      if (excludePaths.some((ex) => f.path.includes(ex))) return false;
      // Allow larger .ipynb files (up to 500KB) since notebooks contain output data
      const sizeLimit = f.path.endsWith(".ipynb") ? 500_000 : 100_000;
      if ((f.size ?? 0) > sizeLimit) return false;
      return codeExtensions.some((ext) => f.path.endsWith(ext));
    })
    // Prioritize .ipynb files first (they contain the actual work for data science tasks)
    .sort((a: { path: string }, b: { path: string }) => {
      const aIsNb = a.path.endsWith(".ipynb") ? -1 : 0;
      const bIsNb = b.path.endsWith(".ipynb") ? -1 : 0;
      return aIsNb - bIsNb;
    })
    .slice(0, 15); // Limit to 15 files to stay within context

  const contents: string[] = [];
  for (const file of codeFiles) {
    try {
      const contentUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${file.path}`;
      const contentResponse = await fetch(contentUrl, {
        headers: { Accept: "application/vnd.github.v3.raw" },
      });
      if (contentResponse.ok) {
        const text = await contentResponse.text();
        // Parse .ipynb notebooks into readable code/markdown cells
        if (file.path.endsWith(".ipynb")) {
          contents.push(`// ── File: ${file.path} ──\n${extractFromIpynb(text)}`);
        } else {
          contents.push(`// ── File: ${file.path} ──\n${text}`);
        }
      }
    } catch {
      // Skip files that fail to fetch
    }
  }

  if (contents.length === 0) {
    throw new Error("Could not extract any code files from the repository");
  }

  return contents.join("\n\n");
}

async function extractFromZip(url: string): Promise<string> {
  // Dynamic import jszip
  const JSZip = (await import("jszip")).default;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch zip file: ${response.status}`);

  const buffer = await response.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);

  const codeExtensions = [
    ".py", ".js", ".ts", ".tsx", ".jsx", ".java", ".cpp", ".c", ".h",
    ".html", ".css", ".json", ".md", ".sql", ".ipynb",
  ];
  const excludePaths = ["node_modules/", ".git/", "__pycache__/", "__MACOSX/", ".DS_Store"];

  const contents: string[] = [];
  const entries = Object.entries(zip.files)
    .filter(([path, file]) => {
      if (file.dir) return false;
      if (excludePaths.some((ex) => path.includes(ex))) return false;
      return codeExtensions.some((ext) => path.endsWith(ext));
    })
    .slice(0, 20); // Limit to 20 files

  for (const [path, file] of entries) {
    try {
      const text = await file.async("text");
      if (text.length <= 100_000) {
        contents.push(`// ── File: ${path} ──\n${text}`);
      }
    } catch {
      // Skip binary or corrupt files
    }
  }

  if (contents.length === 0) {
    throw new Error("Could not extract any code files from the zip archive");
  }

  return contents.join("\n\n");
}

// ── Main Route Handler ──

interface FileInfo {
  url: string;
  name: string;
  type: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      taskDescription,
      taskCategory,
      taskSkills,
      files,
      githubUrl,
      plainText,
      submissionType,
    } = body as {
      taskDescription: string;
      taskCategory: string;
      taskSkills: string[];
      files?: FileInfo[];
      githubUrl?: string;
      plainText?: string;
      submissionType: string;
    };

    if (!taskDescription || !taskCategory) {
      return NextResponse.json(
        { error: "Task description and category are required" },
        { status: 400 },
      );
    }

    // ── Step 1: Extract Content ──
    let extractedContent = "";

    if (submissionType === "github_url" && githubUrl) {
      extractedContent = await extractFromGitHub(githubUrl);
    } else if (submissionType === "plain_text" && plainText) {
      extractedContent = plainText.trim();
    } else if (files && files.length > 0) {
      // Process uploaded files
      const fileParts: string[] = [];

      for (const file of files) {
        try {
          const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

          if (ext === "ipynb") {
            const raw = await extractTextFromUrl(file.url);
            fileParts.push(`// ── File: ${file.name} ──\n${extractFromIpynb(raw)}`);
          } else if (ext === "zip") {
            const zipContent = await extractFromZip(file.url);
            fileParts.push(zipContent);
          } else if (ext === "pdf") {
            // For PDFs, we'll extract what we can via fetch (text-based PDFs)
            // Full PDF parsing with pdfjs-dist requires Node runtime
            const raw = await extractTextFromUrl(file.url);
            // Check if it looks like readable text or binary PDF
            const printableRatio = raw.slice(0, 500).replace(/[^\x20-\x7E\n\r\t]/g, "").length / Math.min(raw.length, 500);
            if (printableRatio > 0.7) {
              fileParts.push(`// ── File: ${file.name} ──\n${raw}`);
            } else {
              fileParts.push(`// ── File: ${file.name} ── [PDF - binary content, text extraction limited]\nThis is a PDF document. The evaluator should note that full content extraction was limited.`);
            }
          } else {
            // Code files: .py, .js, .ts, .tsx, .java, .cpp, .c, .html, .css, etc.
            const text = await extractTextFromUrl(file.url);
            fileParts.push(`// ── File: ${file.name} ──\n${text}`);
          }
        } catch (err) {
          fileParts.push(`// ── File: ${file.name} ── [Extraction failed: ${err instanceof Error ? err.message : "unknown error"}]`);
        }
      }

      extractedContent = fileParts.join("\n\n");
    }

    if (!extractedContent || extractedContent.trim().length < 10) {
      return NextResponse.json(
        { error: "Could not extract meaningful content from the submission" },
        { status: 400 },
      );
    }

    // Truncate to ~12000 chars to stay within context limits
    const truncatedContent = extractedContent.slice(0, 12000);

    // ── Step 2: Route to Specialist Agent ──
    const agentType = resolveAgent(taskCategory);
    const systemPrompt = buildSystemPrompt(agentType, taskDescription, taskSkills ?? []);

    // ── Step 3: Call LLM ──
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Here is the student's submission. Evaluate it thoroughly against the rubric.\n\n---BEGIN SUBMISSION---\n${truncatedContent}\n---END SUBMISSION---`,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const rawReply = chatCompletion.choices[0]?.message?.content;
    if (!rawReply) {
      return NextResponse.json(
        { error: "AI failed to evaluate the submission" },
        { status: 500 },
      );
    }

    // ── Step 4: Parse & Validate Response ──
    const evaluation = JSON.parse(rawReply);

    // Recompute overall score as true average to prevent LLM anchoring
    if (Array.isArray(evaluation.scores)) {
      const scores = evaluation.scores
        .map((s: { score?: number }) => s.score)
        .filter((s: unknown): s is number => typeof s === "number");
      if (scores.length > 0) {
        evaluation.overallScore = Math.round(
          scores.reduce((a: number, b: number) => a + b, 0) / scores.length,
        );
      }
    }

    // Ensure verdict matches score
    const score = evaluation.overallScore ?? 0;
    if (score >= 90) evaluation.verdict = "Excellent";
    else if (score >= 75) evaluation.verdict = "Good";
    else if (score >= 60) evaluation.verdict = "Satisfactory";
    else if (score >= 40) evaluation.verdict = "Needs Improvement";
    else evaluation.verdict = "Insufficient";

    // Ensure agentType is set
    evaluation.agentType = agentType;

    return NextResponse.json({
      evaluation,
      rawResponse: rawReply,
    });
  } catch (error) {
    console.error("Submission Evaluation API Error:", error);
    return NextResponse.json(
      { error: "Failed to evaluate submission. Please try again." },
      { status: 500 },
    );
  }
}

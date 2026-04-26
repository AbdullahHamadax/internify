"use client";

import { useState, useRef, useCallback } from "react";
import {
  X,
  Upload,
  FileText,
  Trash2,
  Loader2,
  CheckCircle2,
  Clock,
  Github,
  FileCode,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Typography } from "@/components/ui/Typography";
import { useLiveNow } from "@/lib/useLiveNow";
import EvaluationResults, { type EvaluationData } from "./EvaluationResults";

interface SubmitTaskModalProps {
  open: boolean;
  applicationId: string;
  taskId: string;
  taskTitle: string;
  taskDescription: string;
  taskCategory: string;
  taskSkills: string[];
  companyName: string;
  deadline: number;
  hasSubmission: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

interface PendingFile {
  file: File;
  id: string;
}

type SubmitMode = "file_upload" | "github_url" | "plain_text";

const FILE_ACCEPT =
  ".py,.ipynb,.pdf,.zip,.js,.ts,.tsx,.jsx,.java,.cpp,.c,.h,.html,.css,.scss,.json,.md,.sql,.rb,.go,.rs,.php,.swift,.kt";

const MODE_TABS: { id: SubmitMode; label: string; icon: React.ReactNode }[] = [
  { id: "file_upload", label: "Files", icon: <Upload className="w-3.5 h-3.5" /> },
  { id: "github_url", label: "GitHub", icon: <Github className="w-3.5 h-3.5" /> },
  { id: "plain_text", label: "Text", icon: <FileCode className="w-3.5 h-3.5" /> },
];

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const codeExts = ["py", "js", "ts", "tsx", "jsx", "java", "cpp", "c", "h", "html", "css", "scss", "json", "sql", "rb", "go", "rs", "php", "swift", "kt"];
  if (ext === "ipynb") return "📓";
  if (ext === "pdf") return "📄";
  if (ext === "zip") return "📦";
  if (codeExts.includes(ext)) return "💻";
  return "📁";
}

export default function SubmitTaskModal({
  open,
  applicationId,
  taskId,
  taskTitle,
  taskDescription,
  taskCategory,
  taskSkills,
  companyName,
  deadline,
  hasSubmission,
  onClose,
  onSubmitted,
}: SubmitTaskModalProps) {
  const now = useLiveNow();
  const [mode, setMode] = useState<SubmitMode>("file_upload");
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [githubUrl, setGithubUrl] = useState("");
  const [plainText, setPlainText] = useState("");
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.tasks.generateUploadUrl);
  const submitTask = useMutation(api.tasks.submitTask);
  const storeEvaluation = useMutation(api.evaluations.storeEvaluation);
  const updateEvaluationStatus = useMutation(api.evaluations.updateEvaluationStatus);

  // Check for existing evaluation
  const existingEvaluation = useQuery(
    api.evaluations.getEvaluationByApplication,
    hasSubmission ? { applicationId: applicationId as Id<"applications"> } : "skip",
  );

  const isExpired = deadline <= now;

  if (!open) return null;

  // If showing evaluation results
  if (evaluationResult) {
    return (
      <EvaluationResults
        evaluation={evaluationResult}
        taskTitle={taskTitle}
        companyName={companyName}
        onClose={() => {
          setEvaluationResult(null);
          onClose();
        }}
      />
    );
  }

  // If existing evaluation is available and submission is complete
  if (hasSubmission && existingEvaluation) {
    return (
      <EvaluationResults
        evaluation={{
          agentType: existingEvaluation.agentType,
          overallScore: existingEvaluation.overallScore,
          verdict: existingEvaluation.verdict,
          scores: existingEvaluation.scores,
          strengths: existingEvaluation.strengths,
          improvements: existingEvaluation.improvements,
          summary: existingEvaluation.summary,
        }}
        taskTitle={taskTitle}
        companyName={companyName}
        onClose={onClose}
      />
    );
  }

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles: PendingFile[] = Array.from(files).map((file) => ({
      file,
      id: `${file.name}-${Date.now()}-${Math.random()}`,
    }));
    setPendingFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (id: string) => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const isGitHubUrlValid = (url: string) => {
    return /^https?:\/\/(www\.)?github\.com\/[^/]+\/[^/]+/.test(url.trim());
  };

  const canSubmit = () => {
    if (uploading || evaluating) return false;
    switch (mode) {
      case "file_upload":
        return pendingFiles.length > 0;
      case "github_url":
        return isGitHubUrlValid(githubUrl);
      case "plain_text":
        return plainText.trim().length >= 10;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;

    setUploading(true);
    setError(null);

    try {
      // ── Step 1: Upload files to Convex storage (if file mode) ──
      const uploadedFiles: { storageId: Id<"_storage">; name: string; type: string }[] = [];
      const fileUrls: { url: string; name: string; type: string }[] = [];

      if (mode === "file_upload") {
        for (const pf of pendingFiles) {
          const uploadUrl = await generateUploadUrl();
          const result = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": pf.file.type || "application/octet-stream" },
            body: pf.file,
          });

          if (!result.ok) throw new Error(`Failed to upload ${pf.file.name}`);
          const { storageId } = await result.json();
          uploadedFiles.push({
            storageId,
            name: pf.file.name,
            type: pf.file.type || "application/octet-stream",
          });
        }
      }

      // ── Step 2: Create submission in Convex ──
      const submissionId = await submitTask({
        applicationId: applicationId as Id<"applications">,
        files: uploadedFiles,
        note: note.trim() || undefined,
        submissionType: mode,
        githubUrl: mode === "github_url" ? githubUrl.trim() : undefined,
        plainText: mode === "plain_text" ? plainText.trim() : undefined,
      });

      setUploading(false);
      setEvaluating(true);

      // ── Step 3: Update status to evaluating ──
      await updateEvaluationStatus({
        submissionId: submissionId as Id<"submissions">,
        status: "evaluating",
      });

      // ── Step 4: Resolve file URLs for the API route ──
      if (mode === "file_upload" && uploadedFiles.length > 0) {
        // We need the actual download URLs for files
        // The API route will fetch content from these URLs
        // For Convex storage, we use the storage URL endpoint
        for (const file of uploadedFiles) {
          const url = `${process.env.NEXT_PUBLIC_CONVEX_SITE_URL ?? ""}/api/storage/${file.storageId}`;
          fileUrls.push({ url, name: file.name, type: file.type });
        }
      }

      // ── Step 5: Call evaluation API ──
      const evalResponse = await fetch("/api/evaluate-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskDescription,
          taskCategory,
          taskSkills,
          files: fileUrls,
          githubUrl: mode === "github_url" ? githubUrl.trim() : undefined,
          plainText: mode === "plain_text" ? plainText.trim() : undefined,
          submissionType: mode,
        }),
      });

      if (!evalResponse.ok) {
        const err = await evalResponse.json().catch(() => ({ error: "Evaluation failed" }));
        throw new Error(err.error || "Failed to evaluate submission");
      }

      const { evaluation, rawResponse } = await evalResponse.json();

      // ── Step 6: Store evaluation in Convex ──
      await storeEvaluation({
        submissionId: submissionId as Id<"submissions">,
        applicationId: applicationId as Id<"applications">,
        taskId: taskId as Id<"tasks">,
        agentType: evaluation.agentType ?? "se",
        overallScore: evaluation.overallScore ?? 0,
        verdict: evaluation.verdict ?? "Needs Improvement",
        scores: (evaluation.scores ?? []).map((s: { dimension?: string; score?: number; comment?: string }) => ({
          dimension: s.dimension ?? "Unknown",
          score: typeof s.score === "number" ? s.score : 0,
          comment: s.comment ?? "",
        })),
        strengths: Array.isArray(evaluation.strengths) ? evaluation.strengths : [],
        improvements: Array.isArray(evaluation.improvements) ? evaluation.improvements : [],
        summary: evaluation.summary ?? "",
        rawResponse: rawResponse,
      });

      // ── Step 7: Show results ──
      setEvaluationResult(evaluation);
      setEvaluating(false);
      onSubmitted();
    } catch (err: unknown) {
      // If evaluation fails, still mark submission as done (the upload succeeded)
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
      setUploading(false);
      setEvaluating(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ── Evaluating State ──
  if (evaluating) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full max-w-md bg-card border-4 border-black dark:border-white shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff] p-8 flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
            <Sparkles className="w-8 h-8 text-[#2563EB] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>

          <div className="text-center space-y-2">
            <Typography variant="h3" className="uppercase font-black tracking-tight">
              Evaluating Your Submission
            </Typography>
            <Typography variant="p" color="muted" className="text-sm">
              Our AI is analyzing your work against the task rubric.
              This usually takes 5-10 seconds...
            </Typography>
          </div>

          <div className="w-full space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Files uploaded successfully</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Submission recorded</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#2563EB] font-bold">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Running AI evaluation...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-card border-4 border-black dark:border-white shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b-4 border-black dark:border-white">
          <div className="min-w-0 flex-1 pr-4">
            <Typography variant="h3" className="uppercase font-black tracking-tight truncate">
              {hasSubmission
                ? "Submission Complete"
                : isExpired
                  ? "Deadline Passed"
                  : "Submit Work"}
            </Typography>
            <Typography variant="span" color="muted" className="text-sm truncate block mt-1">
              {taskTitle} • {companyName}
            </Typography>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 border-2 border-black dark:border-white bg-white dark:bg-black shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {hasSubmission ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 border-4 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
              </div>
              <Typography variant="h4" className="text-center font-black uppercase">
                Already Submitted
              </Typography>
              <Typography variant="p" color="muted" className="text-center text-sm max-w-xs">
                {existingEvaluation === undefined
                  ? "Loading evaluation..."
                  : existingEvaluation === null
                    ? "You have already submitted your work for this task. The AI evaluation may still be processing."
                    : "Your submission has been evaluated. Click below to view your results."}
              </Typography>
              {existingEvaluation === null && (
                <Typography variant="span" color="muted" className="text-xs">
                  The employer will review it soon.
                </Typography>
              )}
            </div>
          ) : isExpired ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="p-4 bg-red-100 dark:bg-red-900/30 border-4 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]">
                <Clock className="w-12 h-12 text-red-600 dark:text-red-400" />
              </div>
              <Typography variant="h4" className="text-center font-black uppercase">
                Submission Closed
              </Typography>
              <Typography variant="p" color="muted" className="text-center text-sm max-w-xs">
                This task deadline has passed, so new submissions are no longer accepted. It will be removed automatically after the grace period.
              </Typography>
            </div>
          ) : (
            <>
              {/* ── Submission Mode Tabs ── */}
              <div className="flex border-2 border-black dark:border-white">
                {MODE_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setMode(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-black uppercase tracking-widest transition-all ${
                      mode === tab.id
                        ? "bg-[#2563EB] text-white"
                        : "bg-card hover:bg-muted/50"
                    } ${tab.id !== "file_upload" ? "border-l-2 border-black dark:border-white" : ""}`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* ── File Upload Mode ── */}
              {mode === "file_upload" && (
                <>
                  <div
                    className="border-4 border-dashed border-black dark:border-white p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:bg-muted/50"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="p-3 bg-[#2563EB] border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-center">
                      <Typography variant="h4" className="font-black uppercase text-sm">
                        Click to upload files
                      </Typography>
                      <Typography variant="span" color="muted" className="text-xs">
                        .py, .ipynb, .pdf, .zip, .js, .ts, .html, .css and more
                      </Typography>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept={FILE_ACCEPT}
                      className="hidden"
                      onChange={handleFilesSelected}
                    />
                  </div>

                  {pendingFiles.length > 0 && (
                    <div className="space-y-2">
                      <Typography variant="h4" className="font-black uppercase text-xs tracking-widest">
                        Files ({pendingFiles.length})
                      </Typography>
                      {pendingFiles.map((pf) => (
                        <div
                          key={pf.id}
                          className="flex items-center gap-3 p-3 bg-muted/50 border-2 border-black dark:border-white"
                        >
                          <span className="text-lg shrink-0">{getFileIcon(pf.file.name)}</span>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-bold truncate block">{pf.file.name}</span>
                            <span className="text-xs text-muted-foreground">{formatSize(pf.file.size)}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(pf.id)}
                            className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 border-2 border-transparent hover:border-red-600 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ── GitHub URL Mode ── */}
              {mode === "github_url" && (
                <div className="space-y-3">
                  <div>
                    <Typography variant="h4" className="font-black uppercase text-xs tracking-widest mb-2">
                      Repository URL
                    </Typography>
                    <div className="relative">
                      <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="url"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/username/repo"
                        className="w-full pl-10 pr-3 py-3 bg-card border-2 border-black dark:border-white text-sm focus:outline-none focus:shadow-[4px_4px_0_0_#2563EB]"
                      />
                    </div>
                    {githubUrl && !isGitHubUrlValid(githubUrl) && (
                      <Typography variant="span" className="text-xs text-red-500 mt-1 block">
                        Please enter a valid GitHub repository URL
                      </Typography>
                    )}
                    {githubUrl && isGitHubUrlValid(githubUrl) && (
                      <div className="flex items-center gap-2 mt-2 p-2 bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-500 text-xs">
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                          {githubUrl.match(/github\.com\/([^/]+\/[^/]+)/)?.[1] ?? "Repository detected"}
                        </span>
                      </div>
                    )}
                  </div>
                  <Typography variant="p" color="muted" className="text-xs">
                    We&apos;ll pull the main source files from your repository and evaluate them against the task rubric.
                    Only public repositories are supported.
                  </Typography>
                </div>
              )}

              {/* ── Plain Text Mode ── */}
              {mode === "plain_text" && (
                <div className="space-y-3">
                  <div>
                    <Typography variant="h4" className="font-black uppercase text-xs tracking-widest mb-2">
                      Paste Your Code or Text
                    </Typography>
                    <textarea
                      value={plainText}
                      onChange={(e) => setPlainText(e.target.value)}
                      placeholder={`Paste your ${taskCategory.toLowerCase().includes("web") ? "HTML/CSS/JavaScript" : "code"} here...`}
                      className="w-full min-h-[200px] p-3 bg-card border-2 border-black dark:border-white text-sm font-mono resize-none focus:outline-none focus:shadow-[4px_4px_0_0_#2563EB]"
                    />
                    <div className="flex justify-between items-center mt-1">
                      <Typography variant="span" color="muted" className="text-xs">
                        Minimum 10 characters required
                      </Typography>
                      <Typography variant="span" color="muted" className="text-xs">
                        {plainText.length} chars
                      </Typography>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Note (all modes) ── */}
              <div>
                <Typography variant="h4" className="font-black uppercase text-xs tracking-widest mb-2">
                  Note (optional)
                </Typography>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add any notes about your submission..."
                  className="w-full min-h-[60px] p-3 bg-card border-2 border-black dark:border-white text-sm resize-none focus:outline-none focus:shadow-[4px_4px_0_0_#2563EB]"
                />
              </div>

              {/* AI Evaluation Notice */}
              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 border-2 border-[#2563EB]">
                <Sparkles className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                <Typography variant="p" color="muted" className="text-xs">
                  Your submission will be automatically evaluated by our AI agent specialized in{" "}
                  <strong className="text-foreground">{taskCategory}</strong>. You&apos;ll receive a
                  detailed feedback report with scores, strengths, and improvement suggestions.
                </Typography>
              </div>

              {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 border-2 border-red-600 text-red-700 dark:text-red-400 text-sm font-bold">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!hasSubmission && !isExpired && (
          <div className="p-5 border-t-4 border-black dark:border-white flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border-2 border-black dark:border-white font-black uppercase text-xs tracking-widest shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all bg-card"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit()}
              className="px-5 py-2.5 border-2 border-black dark:border-white font-black uppercase text-xs tracking-widest shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] dark:hover:shadow-[2px_2px_0_0_#fff] transition-all bg-[#2563EB] text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Submit & Evaluate
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

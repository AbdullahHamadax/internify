"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import FormattedTaskDescription from "./FormattedTaskDescription";

/**
 * AI-powered task description formatter. Shows the regex-based
 * `FormattedTaskDescription` instantly as a fallback, then upgrades to an
 * AI-structured version (Description / Requirements / Deliverables) once the
 * `/api/format-description` response arrives.
 *
 * Results are cached per task ID so reopening the same drawer never re-calls
 * the API.
 */

interface FormattedResult {
  summary: string | null;
  requirements: string[] | null;
  deliverables: string[] | null;
}

// Module-level cache so it persists across re-renders and unmounts.
const formatCache = new Map<string, FormattedResult>();

export default function AIFormattedDescription({
  taskId,
  description,
  enableAiFormat = true,
  className,
}: {
  taskId: string;
  description: string;
  enableAiFormat?: boolean;
  className?: string;
}) {
  const [aiResult, setAiResult] = useState<FormattedResult | null>(
    () => formatCache.get(taskId) ?? null,
  );
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchFormatted = useCallback(async () => {
    // Already cached
    if (formatCache.has(taskId)) {
      setAiResult(formatCache.get(taskId)!);
      return;
    }

    // AI format not enabled by employer
    if (!enableAiFormat) return;

    // Too short to bother
    if (description.trim().length < 80) return;

    setLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/format-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error("API error");

      const data: FormattedResult = await res.json();
      formatCache.set(taskId, data);
      setAiResult(data);
    } catch (err) {
      // Silently fail — the regex fallback is already visible
      if ((err as Error).name !== "AbortError") {
        console.warn("AI format failed, keeping regex fallback:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [taskId, description, enableAiFormat]);

  useEffect(() => {
    fetchFormatted();
    return () => abortRef.current?.abort();
  }, [fetchFormatted]);

  // ── Render AI-structured version ──
  if (aiResult && (aiResult.summary || aiResult.requirements || aiResult.deliverables)) {
    return (
      <div className={className ?? "space-y-5"}>
        {/* AI badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border-2 border-amber-500/60 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400">
            <Sparkles className="w-3 h-3" />
            AI Formatted
          </span>
          {loading && (
            <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Description / Summary */}
        {aiResult.summary && (
          <>
            <SectionHeading title="Description" />
            <p className="text-sm leading-relaxed text-foreground">
              {aiResult.summary}
            </p>
          </>
        )}

        {/* Requirements */}
        {aiResult.requirements && aiResult.requirements.length > 0 && (
          <>
            <SectionHeading title="Requirements" />
            <ul className="space-y-2">
              {aiResult.requirements.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground"
                >
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rotate-45 bg-foreground" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Deliverables */}
        {aiResult.deliverables && aiResult.deliverables.length > 0 && (
          <>
            <SectionHeading title="Deliverables" />
            <ul className="space-y-2">
              {aiResult.deliverables.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground"
                >
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rotate-45 bg-foreground" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    );
  }

  // ── Fallback: regex-based formatter (instant, zero-latency) ──
  return (
    <div className={className ?? "space-y-3"}>
      {loading && (
        <div className="flex items-center gap-2 mb-1">
          <Loader2 className="w-3 h-3 animate-spin text-amber-600 dark:text-amber-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
            Formatting with AI…
          </span>
        </div>
      )}
      <FormattedTaskDescription text={description} />
    </div>
  );
}

/** Brutalist section heading: yellow rotated diamond + uppercase title + horizontal rule */
function SectionHeading({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 pt-1.5">
      <span className="h-3 w-3 shrink-0 rotate-45 border-2 border-foreground bg-[#FDE68A]" />
      <span className="text-xs font-black uppercase tracking-widest text-foreground">
        {title}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

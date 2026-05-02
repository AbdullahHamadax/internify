"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { SKILL_CATALOG } from "@/lib/skillCatalog";

interface AiSkillResult {
  /** Skills detected from the available pool (to auto-select) */
  detected: string[];
  /** Skills suggested outside the pool */
  suggested: string[];
}

interface UseAiSkillDetectionReturn {
  /** AI-detected skills from the pool that should be auto-selected */
  detectedSkills: string[];
  /** AI-suggested skills outside the pool */
  suggestedSkills: string[];
  /** Whether the AI request is in-flight */
  isDetecting: boolean;
  /** Error message, if any */
  error: string | null;
  /** Trigger detection manually (e.g. on blur) */
  triggerDetection: (description: string) => void;
  /** Clear all AI results */
  clearResults: () => void;
  /** Set of skills the AI has auto-detected (for badge rendering) */
  aiDetectedSet: Set<string>;
}

const DEBOUNCE_MS = 600;

/**
 * Custom hook for AI-powered skill detection from task descriptions.
 *
 * Debounces calls to the `/api/detect-skills` route and returns
 * two lists: detected (from the SKILL_CATALOG pool) and suggested
 * (outside the pool).
 */
export function useAiSkillDetection(
  currentSkills: string[],
  onAutoSelect: (skills: string[]) => void,
): UseAiSkillDetectionReturn {
  const [detectedSkills, setDetectedSkills] = useState<string[]>([]);
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiDetectedSet, setAiDetectedSet] = useState<Set<string>>(new Set());

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastDescriptionRef = useRef<string>("");

  const clearResults = useCallback(() => {
    setDetectedSkills([]);
    setSuggestedSkills([]);
    setAiDetectedSet(new Set());
    setError(null);
  }, []);

  const runDetection = useCallback(
    async (description: string) => {
      // Skip if description is too short or same as last
      const trimmed = description.trim();
      if (trimmed.length < 20) {
        clearResults();
        return;
      }
      if (trimmed === lastDescriptionRef.current) return;
      lastDescriptionRef.current = trimmed;

      // Abort any previous in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsDetecting(true);
      setError(null);

      try {
        const res = await fetch("/api/detect-skills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: trimmed,
            availableSkills: [...SKILL_CATALOG],
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`API returned ${res.status}`);
        }

        const data: AiSkillResult = await res.json();

        // Only process if this is still the active request
        if (!controller.signal.aborted) {
          setDetectedSkills(data.detected);
          setSuggestedSkills(data.suggested);

          // Track which skills were AI-detected
          const newAiSet = new Set(data.detected);
          setAiDetectedSet(newAiSet);

          // Auto-select detected skills that aren't already selected
          if (data.detected.length > 0) {
            const currentSet = new Set(currentSkills);
            const toAdd = data.detected.filter((s) => !currentSet.has(s));
            if (toAdd.length > 0) {
              onAutoSelect([...currentSkills, ...toAdd]);
            }
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          // Request was aborted, ignore
          return;
        }
        console.error("[useAiSkillDetection] Error:", err);
        setError("Failed to detect skills. Try again.");
      } finally {
        if (!controller.signal.aborted) {
          setIsDetecting(false);
        }
      }
    },
    [currentSkills, onAutoSelect, clearResults],
  );

  const triggerDetection = useCallback(
    (description: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        runDetection(description);
      }, DEBOUNCE_MS);
    },
    [runDetection],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  return {
    detectedSkills,
    suggestedSkills,
    isDetecting,
    error,
    triggerDetection,
    clearResults,
    aiDetectedSet,
  };
}

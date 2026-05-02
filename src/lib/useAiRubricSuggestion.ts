"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface RubricSuggestion {
  label: string;
  description: string;
  originPhrase: string;
}

interface UseAiRubricSuggestionReturn {
  /** AI-suggested rubric dimensions extracted from the description */
  suggestedDimensions: RubricSuggestion[];
  /** Whether the AI request is in-flight */
  isSuggesting: boolean;
  /** Error message, if any */
  error: string | null;
  /** Whether the description is too short to extract dimensions */
  descriptionTooShort: boolean;
  /** Trigger suggestion manually */
  triggerSuggestion: (
    description: string,
    category: string,
    existingDimensions: string[],
  ) => void;
  /** Clear all suggestion results */
  clearSuggestions: () => void;
}

const DEBOUNCE_MS = 600;
const MIN_DESCRIPTION_LENGTH = 20;

/**
 * Custom hook for AI-powered rubric dimension extraction from descriptions.
 *
 * Debounces calls to the `/api/suggest-rubric` route and returns
 * an array of extracted dimensions with labels, descriptions, and origin phrases.
 *
 * The hook fires ONLY when the description field has meaningful content
 * (>= 20 characters). Category is passed as secondary context only.
 */
export function useAiRubricSuggestion(): UseAiRubricSuggestionReturn {
  const [suggestedDimensions, setSuggestedDimensions] = useState<
    RubricSuggestion[]
  >([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [descriptionTooShort, setDescriptionTooShort] = useState(false);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastKeyRef = useRef<string>("");

  const clearSuggestions = useCallback(() => {
    setSuggestedDimensions([]);
    setError(null);
    setDescriptionTooShort(false);
  }, []);

  const runSuggestion = useCallback(
    async (
      description: string,
      category: string,
      existingDimensions: string[],
    ) => {
      const trimmed = description.trim();

      // Description is the primary input — must be meaningful
      if (trimmed.length < MIN_DESCRIPTION_LENGTH) {
        setSuggestedDimensions([]);
        setError(null);
        setDescriptionTooShort(true);
        return;
      }

      setDescriptionTooShort(false);

      // Build a cache key to avoid redundant requests
      const key = `${trimmed}::${category}::${existingDimensions.sort().join(",")}`;
      if (key === lastKeyRef.current) return;
      lastKeyRef.current = key;

      // Abort any previous in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsSuggesting(true);
      setError(null);

      try {
        const res = await fetch("/api/suggest-rubric", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: trimmed,
            category,
            activeDimensions: existingDimensions,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`API returned ${res.status}`);
        }

        const data = await res.json();

        if (!controller.signal.aborted) {
          setSuggestedDimensions(
            Array.isArray(data.suggestions) ? data.suggestions : [],
          );
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        console.error("[useAiRubricSuggestion] Error:", err);
        setError("Could not extract dimensions. Please try again.");
      } finally {
        if (!controller.signal.aborted) {
          setIsSuggesting(false);
        }
      }
    },
    [],
  );

  const triggerSuggestion = useCallback(
    (
      description: string,
      category: string,
      existingDimensions: string[],
    ) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        runSuggestion(description, category, existingDimensions);
      }, DEBOUNCE_MS);
    },
    [runSuggestion],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  return {
    suggestedDimensions,
    isSuggesting,
    error,
    descriptionTooShort,
    triggerSuggestion,
    clearSuggestions,
  };
}

export type { RubricSuggestion };

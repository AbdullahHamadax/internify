"use client";

import { useState, useMemo, type DragEvent } from "react";
import {
  Sparkles,
  Loader2,
  AlertCircle,
  X,
  Plus,
  RotateCcw,
  GripVertical,
  GripHorizontal,
  Check,
  Lightbulb,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { RubricSuggestion } from "@/lib/useAiRubricSuggestion";

/* ── Rich Dimension Model ── */

export interface RubricDimension {
  id: string;
  label: string;
  type: "default" | "suggested" | "manual";
  source: "ai" | "manual";
}

/* ── Utility: generate a short stable id ── */
let _idCounter = 0;
function nextId(prefix: string): string {
  _idCounter += 1;
  return `${prefix}-${Date.now()}-${_idCounter}`;
}

/* ── Props ── */

interface RubricBuilderProps {
  /** Active rubric dimensions (ordered) */
  dimensions: RubricDimension[];
  /** Update the entire dimensions list */
  onDimensionsChange: (dims: RubricDimension[]) => void;
  /** The default AI labels for the current category */
  defaultLabels: string[];
  /** Labels that have been discarded by the user */
  discardedDefaults: string[];
  /** Callback to update discarded defaults */
  onDiscardedDefaultsChange: (discarded: string[]) => void;
  /** AI-suggested rubric dimensions */
  suggestedDimensions: RubricSuggestion[];
  /** Whether the AI is currently suggesting */
  isSuggesting: boolean;
  /** AI suggestion error */
  suggestionError: string | null;
  /** Whether the description is too short for extraction */
  descriptionTooShort: boolean;
  /** Agent type label for display */
  agentLabel: string;
}

export default function RubricBuilder({
  dimensions,
  onDimensionsChange,
  defaultLabels,
  discardedDefaults,
  onDiscardedDefaultsChange,
  suggestedDimensions,
  isSuggesting,
  suggestionError,
  descriptionTooShort,
  agentLabel,
}: RubricBuilderProps) {
  const [newDimInput, setNewDimInput] = useState("");
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [dragSourceId, setDragSourceId] = useState<string | null>(null);

  /* ── Derived state ── */

  const activeLabelSet = useMemo(
    () => new Set(dimensions.map((d) => d.label.toLowerCase())),
    [dimensions],
  );

  const hasDiscardedDefaults = discardedDefaults.length > 0;

  /* ── Actions ── */

  const removeDimension = (id: string) => {
    const dim = dimensions.find((d) => d.id === id);
    if (!dim) return;

    // If it's a default, track it as discarded
    if (dim.type === "default") {
      onDiscardedDefaultsChange([...discardedDefaults, dim.label]);
    }

    onDimensionsChange(dimensions.filter((d) => d.id !== id));
  };

  const resetDefaults = () => {
    // Remove existing defaults first
    const withoutDefaults = dimensions.filter((d) => d.type !== "default");
    // Re-add all default labels
    const newDefaults: RubricDimension[] = defaultLabels.map((label) => ({
      id: nextId("def"),
      label,
      type: "default",
      source: "ai",
    }));
    onDimensionsChange([...newDefaults, ...withoutDefaults]);
    onDiscardedDefaultsChange([]);
  };

  const addSuggestedDimension = (label: string) => {
    if (activeLabelSet.has(label.toLowerCase())) return;
    const newDim: RubricDimension = {
      id: nextId("sug"),
      label,
      type: "suggested",
      source: "ai",
    };
    onDimensionsChange([...dimensions, newDim]);
  };

  const addManualDimension = () => {
    const trimmed = newDimInput.trim();
    if (
      !trimmed ||
      activeLabelSet.has(trimmed.toLowerCase())
    )
      return;
    const newDim: RubricDimension = {
      id: nextId("man"),
      label: trimmed,
      type: "manual",
      source: "manual",
    };
    onDimensionsChange([...dimensions, newDim]);
    setNewDimInput("");
  };

  /* ── Drag & Drop (reorder within dimensions list) ── */

  const handleDragStart = (e: DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.setData("rubric-dim-id", id);
    e.dataTransfer.effectAllowed = "move";
    setDragSourceId(id);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIdx(idx);
  };

  const handleDragLeave = () => {
    setDragOverIdx(null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, targetIdx: number) => {
    e.preventDefault();
    setDragOverIdx(null);
    setDragSourceId(null);

    // Check if it's a reorder (internal dim id)
    const dimId = e.dataTransfer.getData("rubric-dim-id");
    if (dimId) {
      const sourceIdx = dimensions.findIndex((d) => d.id === dimId);
      if (sourceIdx === -1 || sourceIdx === targetIdx) return;
      const updated = [...dimensions];
      const [moved] = updated.splice(sourceIdx, 1);
      updated.splice(targetIdx, 0, moved);
      onDimensionsChange(updated);
      return;
    }

    // Check if it's a suggested dim label from the suggestion chips
    const label = e.dataTransfer.getData("text/plain");
    if (label && !activeLabelSet.has(label.toLowerCase())) {
      const newDim: RubricDimension = {
        id: nextId("sug"),
        label,
        type: "suggested",
        source: "ai",
      };
      const updated = [...dimensions];
      updated.splice(targetIdx, 0, newDim);
      onDimensionsChange(updated);
    }
  };

  const handleDragEnd = () => {
    setDragOverIdx(null);
    setDragSourceId(null);
  };

  /* ── Drop zone for the overall container (append) ── */

  const handleContainerDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleContainerDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Append to end if dropping on container background
    const label = e.dataTransfer.getData("text/plain");
    if (label && !activeLabelSet.has(label.toLowerCase())) {
      const newDim: RubricDimension = {
        id: nextId("sug"),
        label,
        type: "suggested",
        source: "ai",
      };
      onDimensionsChange([...dimensions, newDim]);
    }
  };

  /* ── Color helpers ── */

  const getDimColorClass = (type: RubricDimension["type"]) => {
    switch (type) {
      case "default":
        return "rubric-dim--default";
      case "suggested":
        return "rubric-dim--suggested";
      case "manual":
        return "rubric-dim--manual";
    }
  };

  const getBadgeLabel = (type: RubricDimension["type"]) => {
    switch (type) {
      case "default":
        return "Default";
      case "suggested":
        return "Suggested";
      default:
        return null;
    }
  };

  return (
    <div className="rubric-builder">
      {/* ── Active Dimensions ── */}
      <div
        className="rubric-builder__dims"
        onDragOver={handleContainerDragOver}
        onDrop={handleContainerDrop}
      >
        {dimensions.length === 0 && (
          <div className="rubric-builder__empty">
            No rubric dimensions yet. Select a category to auto-populate
            defaults, or add your own below.
          </div>
        )}

        {dimensions.map((dim, idx) => (
          <div
            key={dim.id}
            draggable
            className={`rubric-dim ${getDimColorClass(dim.type)}${dragOverIdx === idx ? " rubric-dim--drop-target" : ""}${dragSourceId === dim.id ? " rubric-dim--dragging" : ""}`}
            onDragStart={(e) => handleDragStart(e, dim.id)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, idx)}
            onDragEnd={handleDragEnd}
          >
            <GripVertical className="rubric-dim__grip" />
            <span className="rubric-dim__label">{dim.label}</span>
            {getBadgeLabel(dim.type) && (
              <span
                className={`rubric-dim__badge rubric-dim__badge--${dim.type}`}
              >
                {dim.type === "default" ? (
                  <Sparkles className="size-2" />
                ) : (
                  <Lightbulb className="size-2" />
                )}
                {getBadgeLabel(dim.type)}
              </span>
            )}
            <button
              type="button"
              className="rubric-dim__remove"
              onClick={() => removeDimension(dim.id)}
              aria-label={`Remove ${dim.label}`}
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
      </div>

      {/* ── Reset defaults button ── */}
      {hasDiscardedDefaults && (
        <button
          type="button"
          className="rubric-builder__reset"
          onClick={resetDefaults}
        >
          <RotateCcw className="size-3" />
          Reset to Default Dimensions
        </button>
      )}

      {/* ── Add manual dimension ── */}
      <div className="rubric-builder__add">
        <Input
          value={newDimInput}
          onChange={(e) => setNewDimInput(e.target.value)}
          placeholder="e.g. Mobile Responsiveness, API Error Handling..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && newDimInput.trim()) {
              e.preventDefault();
              addManualDimension();
            }
          }}
          className="rounded-none border-2 border-border shadow-[4px_4px_0_0_var(--border)] focus-visible:ring-0 focus-visible:shadow-[4px_4px_0_0_hsl(263,70%,50%)] dark:focus-visible:shadow-[4px_4px_0_0_hsl(290,70%,70%)] transition-all focus-visible:translate-x-[2px] focus-visible:translate-y-[2px] text-sm"
        />
        <Button
          type="button"
          onClick={addManualDimension}
          disabled={!newDimInput.trim()}
          className="rounded-none border-2 border-border bg-foreground text-card shadow-[4px_4px_0_0_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all shrink-0"
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {/* ── AI-Suggested Dimensions Panel ── */}
      {descriptionTooShort ? (
        <div className="rubric-suggestions">
          <div className="rubric-suggestions__header">
            <Lightbulb className="rubric-suggestions__icon" />
            <span className="rubric-suggestions__title">
              AI-Extracted Dimensions
            </span>
          </div>
          <div className="rubric-suggestions__empty">
            Write a description to extract rubric dimensions from your task.
          </div>
        </div>
      ) : (isSuggesting || suggestionError || suggestedDimensions.length > 0) ? (
        <div className="rubric-suggestions">
          <div className="rubric-suggestions__header">
            <Lightbulb className="rubric-suggestions__icon" />
            <span className="rubric-suggestions__title">
              AI-Extracted Dimensions
            </span>
            {isSuggesting && (
              <Loader2 className="rubric-suggestions__spinner" />
            )}
          </div>

          {/* Skeleton loading */}
          {isSuggesting && suggestedDimensions.length === 0 && (
            <div className="rubric-suggestions__loading">
              <div className="rubric-suggestions__skeleton" />
              <div className="rubric-suggestions__skeleton rubric-suggestions__skeleton--short" />
              <div className="rubric-suggestions__skeleton rubric-suggestions__skeleton--medium" />
            </div>
          )}

          {/* Error */}
          {suggestionError && (
            <div className="rubric-suggestions__error">
              <AlertCircle className="size-3.5" />
              <span>{suggestionError}</span>
            </div>
          )}

          {/* Suggestion chips */}
          {suggestedDimensions.length > 0 && (
            <div className="rubric-suggestions__chips">
              {suggestedDimensions.map((sug) => {
                const isAdded = activeLabelSet.has(sug.label.toLowerCase());
                const tooltipText = isAdded
                  ? `${sug.label} already added`
                  : sug.originPhrase
                    ? `Extracted from: "${sug.originPhrase}"`
                    : sug.description || `Click or drag to add "${sug.label}"`;
                return (
                  <button
                    key={sug.label}
                    type="button"
                    draggable={!isAdded}
                    className={`rubric-suggestion-chip${isAdded ? " rubric-suggestion-chip--added" : ""}`}
                    onClick={() => {
                      if (!isAdded) addSuggestedDimension(sug.label);
                    }}
                    onDragStart={(e) => {
                      if (!isAdded) {
                        e.dataTransfer.setData("text/plain", sug.label);
                        e.dataTransfer.effectAllowed = "copy";
                      }
                    }}
                    title={tooltipText}
                  >
                    {isAdded ? (
                      <Check className="size-3" />
                    ) : (
                      <GripHorizontal className="rubric-suggestion-chip__grip" />
                    )}
                    <span>{sug.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Empty state — description not detailed enough */}
          {!isSuggesting &&
            !suggestionError &&
            suggestedDimensions.length === 0 && (
              <div className="rubric-suggestions__empty">
                Add more detail to your description to extract dimension suggestions.
              </div>
            )}
        </div>
      ) : null}
    </div>
  );
}

export { nextId };

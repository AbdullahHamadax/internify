"use client";

import { useState, useRef, type DragEvent } from "react";
import { Sparkles, Loader2, AlertCircle, GripHorizontal, Check } from "lucide-react";

interface AiSuggestedSkillsProps {
  suggestedSkills: string[];
  isDetecting: boolean;
  error: string | null;
  /** Currently selected skills in the SkillPicker */
  selectedSkills: string[];
  /** Add a skill to the selected list */
  onAddSkill: (skill: string) => void;
  /** Ref to the drop target (SkillPicker container) — used for drag-and-drop */
  dropTargetRef?: React.RefObject<HTMLDivElement | null>;
}

export default function AiSuggestedSkills({
  suggestedSkills,
  isDetecting,
  error,
  selectedSkills,
  onAddSkill,
}: AiSuggestedSkillsProps) {
  const [draggingSkill, setDraggingSkill] = useState<string | null>(null);

  // Don't render if nothing to show and not loading
  if (!isDetecting && !error && suggestedSkills.length === 0) {
    return null;
  }

  const selectedSet = new Set(selectedSkills.map((s) => s.toLowerCase()));

  const handleDragStart = (e: DragEvent<HTMLButtonElement>, skill: string) => {
    e.dataTransfer.setData("text/plain", skill);
    e.dataTransfer.effectAllowed = "copy";
    setDraggingSkill(skill);
  };

  const handleDragEnd = () => {
    setDraggingSkill(null);
  };

  return (
    <div className="ai-suggestions">
      <div className="ai-suggestions__header">
        <Sparkles className="ai-suggestions__icon" />
        <span className="ai-suggestions__title">AI-Suggested Skills</span>
        {isDetecting && (
          <Loader2 className="ai-suggestions__spinner" />
        )}
      </div>

      {/* Loading state */}
      {isDetecting && suggestedSkills.length === 0 && (
        <div className="ai-suggestions__loading">
          <div className="ai-suggestions__skeleton" />
          <div className="ai-suggestions__skeleton ai-suggestions__skeleton--short" />
          <div className="ai-suggestions__skeleton ai-suggestions__skeleton--medium" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="ai-suggestions__error">
          <AlertCircle className="size-3.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Suggestions */}
      {suggestedSkills.length > 0 && (
        <div className="ai-suggestions__chips">
          {suggestedSkills.map((skill) => {
            const isAdded = selectedSet.has(skill.toLowerCase());
            return (
              <button
                key={skill}
                type="button"
                draggable={!isAdded}
                className={`ai-suggestion-chip${isAdded ? " ai-suggestion-chip--added" : ""}${draggingSkill === skill ? " ai-suggestion-chip--dragging" : ""}`}
                onClick={() => {
                  if (!isAdded) onAddSkill(skill);
                }}
                onDragStart={(e) => handleDragStart(e, skill)}
                onDragEnd={handleDragEnd}
                title={
                  isAdded
                    ? `${skill} already added`
                    : `Click or drag to add ${skill}`
                }
              >
                {isAdded ? (
                  <Check className="size-3" />
                ) : (
                  <GripHorizontal className="ai-suggestion-chip__grip" />
                )}
                <span>{skill}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

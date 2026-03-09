"use client";

import { useState, useRef, useMemo, type KeyboardEvent } from "react";
import { X, Tag, Plus, Search } from "lucide-react";
import deviconData from "devicon/devicon.json";

/* ── Curated skill catalog ── */
const SKILL_CATALOG = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "Csharp",
  "Go",
  "Rust",
  "PHP",
  "Ruby",
  "Swift",
  "Kotlin",
  "Dart",
  "React",
  "Nextjs",
  "Vue",
  "Angular",
  "Svelte",
  "HTML",
  "CSS",
  "Tailwindcss",
  "Sass",
  "Nodejs",
  "Express",
  "Django",
  "Flask",
  "Spring",
  "Laravel",
  "Rails",
  "Flutter",
  "React Native",
  "Docker",
  "Kubernetes",
  "AWS",
  "Azure",
  "GCP",
  "Git",
  "GitHub",
  "Linux",
  "PostgreSQL",
  "MongoDB",
  "MySQL",
  "Redis",
  "Firebase",
  "GraphQL",
  "Figma",
  "Photoshop",
  "Illustrator",
  "Blender",
  "Unity",
  "TensorFlow",
  "PyTorch",
];

/**
 * Get the devicon class name for a skill, if available.
 * Returns null if no matching devicon icon exists.
 */
const ICON_MAPPINGS: Record<string, string> = {
  "Vue": "vuejs",
  "HTML": "html5",
  "CSS": "css3",
  "Express": "express",
  "TensorFlow": "tensorFlow",
};

function getDeviconClass(skill: string): string | null {
  if (ICON_MAPPINGS[skill]) {
    return `devicon-${ICON_MAPPINGS[skill]}-plain colored`;
  }
  const normalized = skill.toLowerCase().replace(/[^a-z0-9]/g, "");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const match = (deviconData as any[]).find(
    (icon) => icon.name === normalized || icon.altnames?.includes(normalized),
  );
  return match ? `devicon-${match.name}-plain colored` : null;
}

/* ── Props ── */
interface SkillPickerProps {
  skills: string[];
  onChange: (skills: string[]) => void;
}

export default function SkillPicker({ skills, onChange }: SkillPickerProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  /* Normalize for comparison */
  const normalize = (s: string) => s.trim().toLowerCase();

  /* Filter catalog by query (case-insensitive substring match) */
  const filteredCatalog = useMemo(() => {
    const q = normalize(query);
    if (!q) return SKILL_CATALOG;
    return SKILL_CATALOG.filter((skill) => normalize(skill).includes(q));
  }, [query]);

  /* Does the user's query NOT match any catalog item? → show "add custom" */
  const trimmedQuery = query.trim();
  const queryNorm = normalize(trimmedQuery);
  const exactCatalogMatch = SKILL_CATALOG.some(
    (s) => normalize(s) === queryNorm,
  );
  const alreadySelected = skills.some((s) => normalize(s) === queryNorm);
  const showCustomAdd =
    trimmedQuery.length > 0 && !exactCatalogMatch && !alreadySelected;

  /* Formatted custom skill name (Title Case) */
  const customSkillName = trimmedQuery.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase(),
  );

  /* ── Handlers ── */

  const toggleSkill = (skill: string) => {
    if (skills.includes(skill)) {
      onChange(skills.filter((s) => s !== skill));
    } else {
      onChange([...skills, skill]);
    }
  };

  const addCustomSkill = () => {
    if (customSkillName && !skills.includes(customSkillName)) {
      onChange([...skills, customSkillName]);
    }
    setQuery("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (showCustomAdd) {
        addCustomSkill();
      } else if (filteredCatalog.length === 1) {
        // If filter narrowed to one, toggle it
        toggleSkill(filteredCatalog[0]);
        setQuery("");
      }
    }
    if (e.key === "Backspace" && !query && skills.length > 0) {
      onChange(skills.slice(0, -1));
    }
  };

  return (
    <div className="emp-skill-picker">
      {/* Selected skills (shown as tags above the input) */}
      {skills.length > 0 && (
        <div className="emp-skill-picker__selected">
          {skills.map((skill) => {
            const iconClass = getDeviconClass(skill);
            return (
              <span
                key={skill}
                className="emp-tag flex items-center pr-1 pl-2.5"
              >
                {iconClass ? (
                  <i className={`${iconClass} text-sm mr-1.5 opacity-90`}></i>
                ) : (
                  <Tag className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                )}
                {skill}
                <button
                  type="button"
                  className="emp-tag__remove ml-1"
                  onClick={() => toggleSkill(skill)}
                  aria-label={`Remove ${skill}`}
                >
                  <X className="size-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Search input */}
      <div className="emp-skill-picker__search">
        <Search className="emp-skill-picker__search-icon" />
        <input
          ref={inputRef}
          type="text"
          className="emp-skill-picker__input"
          placeholder="Search skills or type a custom one…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {/* Skill grid */}
      <div className="emp-skill-picker__list">
        {/* Custom "Add" button if query doesn't match catalog */}
        {showCustomAdd && (
          <button
            type="button"
            className="emp-skill-option emp-skill-option--custom"
            onClick={addCustomSkill}
          >
            <Plus className="size-3.5" />
            <span>Add &ldquo;{customSkillName}&rdquo;</span>
          </button>
        )}

        {filteredCatalog.map((skill) => {
          const isSelected = skills.includes(skill);
          const iconClass = getDeviconClass(skill);

          return (
            <button
              key={skill}
              type="button"
              className={`emp-skill-option${isSelected ? " emp-skill-option--selected" : ""}`}
              onClick={() => toggleSkill(skill)}
            >
              {iconClass ? (
                <i className={`${iconClass} text-sm`}></i>
              ) : (
                <Tag className="size-3.5 opacity-60" />
              )}
              <span>{skill}</span>
            </button>
          );
        })}

        {filteredCatalog.length === 0 && !showCustomAdd && (
          <div className="emp-skill-picker__empty">
            No matching skills found
          </div>
        )}
      </div>
    </div>
  );
}

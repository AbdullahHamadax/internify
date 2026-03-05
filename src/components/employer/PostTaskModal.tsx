"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { X, Plus, Save, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Task, TaskStatus } from "./TaskManagement";
import deviconData from "devicon/devicon.json";

export interface PostTaskData {
  title: string;
  category: string;
  skillLevel: "beginner" | "intermediate" | "advanced";
  description: string;
  skills: string[];
  deadline: number;
}
const CATEGORIES = [
  "Web Development",
  "Mobile Development",
  "Data Science",
  "Machine Learning",
  "UI/UX Design",
  "Marketing",
  "Content Writing",
  "Cybersecurity",
  "Cloud Computing",
  "DevOps",
];

const SKILL_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

interface PostTaskModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (task: PostTaskData) => Promise<void> | void;
  initialData?: Task | null;
}

export default function PostTaskModal({
  open,
  onClose,
  onSubmit,
  initialData,
}: PostTaskModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [skillLevel, setSkillLevel] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [deadline, setDeadline] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const skillInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setTitle(initialData.title);
        setCategory(initialData.category);
        setSkillLevel(initialData.skillLevel.toLowerCase());
        setDescription(initialData.description || "");
        setSkills(initialData.skills || []);
        
        if (initialData.deadline) {
          const d = new Date(initialData.deadline);
          const pad = (n: number) => n.toString().padStart(2, "0");
          setDeadline(
            `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
          );
        } else {
          setDeadline("");
        }
      } else {
        resetForm();
      }
    }
  }, [open, initialData]);

  if (!open) return null;

  const resetForm = () => {
    setTitle("");
    setCategory("");
    setSkillLevel("");
    setDescription("");
    setSkills([]);
    setSkillInput("");
    setDeadline("");
    setErrors({});
  };

  const normalizeSkill = (skill: string) => {
    const cleaned = skill.trim().replace(/[^a-zA-Z0-9 ]/g, "");
    return cleaned.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
    });
  };

  const addSkill = () => {
    const normalized = normalizeSkill(skillInput);
    if (normalized && !skills.includes(normalized)) {
      setSkills([...skills, normalized]);
      setSkillInput("");
    } else if (normalized) {
      // Already exists, just clear input
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSkillKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill();
    }
    if (e.key === "Backspace" && !skillInput && skills.length > 0) {
      setSkills(skills.slice(0, -1));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Title is required";
    if (!category) newErrors.category = "Category is required";
    if (!skillLevel) newErrors.skillLevel = "Skill level is required";
    if (!description.trim()) newErrors.description = "Description is required";
    if (!deadline) newErrors.deadline = "Deadline is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onSubmit({
      title: title.trim(),
      category,
      skillLevel: skillLevel as "beginner" | "intermediate" | "advanced",
      description: description.trim(),
      skills,
      deadline: new Date(deadline).getTime(),
    });

    resetForm();
    onClose();
  };

  /*
   * Shared select styles — matching the auth page pattern exactly.
   * We use position="popper" so the dropdown portals but positions near the trigger.
   * The SelectContent z-index must be above the modal overlay (z-100) → z-[200].
   */
  const selectTriggerClass =
    "h-11 w-full rounded-lg bg-white cursor-pointer transition-colors hover:bg-slate-50 dark:bg-gray-800 dark:hover:bg-gray-700";
  const selectContentClass =
    "z-[200] bg-white shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700";
  const selectItemClass =
    "cursor-pointer focus:bg-slate-100 dark:focus:bg-gray-700";

  return (
    <div className="emp-modal-overlay" onClick={onClose}>
      <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="emp-modal__header">
          <h2 className="emp-modal__header-title">
            {initialData ? "Edit Task" : "Post a New Task"}
          </h2>
          <button
            type="button"
            className="emp-icon-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="emp-modal__body">
          {/* Title */}
          <div className="emp-modal__field">
            <Label htmlFor="task-title">Task Title</Label>
            <Input
              id="task-title"
              placeholder="e.g. Build a Responsive Landing Page"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={!!errors.title}
            />
            {errors.title && (
              <span className="emp-modal__error">{errors.title}</span>
            )}
          </div>

          {/* Category */}
          <div className="emp-modal__field">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger
                className={selectTriggerClass}
                aria-invalid={!!errors.category}
              >
                <SelectValue placeholder="Select category…" />
              </SelectTrigger>
              <SelectContent
                position="popper"
                sideOffset={4}
                className={selectContentClass}
              >
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className={selectItemClass}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <span className="emp-modal__error">{errors.category}</span>
            )}
          </div>

          {/* Skill Level */}
          <div className="emp-modal__field">
            <Label>Skill Level</Label>
            <Select value={skillLevel} onValueChange={setSkillLevel}>
              <SelectTrigger
                className={selectTriggerClass}
                aria-invalid={!!errors.skillLevel}
              >
                <SelectValue placeholder="Select skill level…" />
              </SelectTrigger>
              <SelectContent
                position="popper"
                sideOffset={4}
                className={selectContentClass}
              >
                {SKILL_LEVELS.map((level) => (
                  <SelectItem
                    key={level.value}
                    value={level.value}
                    className={selectItemClass}
                  >
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.skillLevel && (
              <span className="emp-modal__error">{errors.skillLevel}</span>
            )}
          </div>

          {/* Description */}
          <div className="emp-modal__field">
            <Label htmlFor="task-description">Description</Label>
            <textarea
              id="task-description"
              className="emp-modal__textarea"
              placeholder="Describe the task requirements, deliverables, and what students will learn…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              aria-invalid={!!errors.description}
            />
            {errors.description && (
              <span className="emp-modal__error">{errors.description}</span>
            )}
          </div>

          {/* Skills tag input */}
          <div className="emp-modal__field">
            <Label>Required Skills</Label>
            <div
              className="emp-tags"
              onClick={() => skillInputRef.current?.focus()}
            >
              {skills.map((skill) => {
                // Determine icon for the skill
                const deviconName = skill.toLowerCase().replace(/[^a-z0-9]/g, "");
                
                // Check if the icon exists in devicon standard or altnames
                const hasIcon = (deviconData as any[]).some(
                  (icon) => icon.name === deviconName || icon.altnames.includes(deviconName)
                );
                
                return (
                  <span key={skill} className="emp-tag flex items-center pr-1 pl-2.5">
                    {hasIcon ? (
                      <i className={`devicon-${deviconName}-plain colored text-sm mr-1.5 opacity-90`}></i>
                    ) : (
                      <div className="mr-1.5 flex items-center justify-center opacity-70">
                        {/* Fallback generic tag icon */}
                        <Tag className="w-3.5 h-3.5" />
                      </div>
                    )}
                    {skill}
                    <button
                      type="button"
                      className="emp-tag__remove ml-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSkill(skill);
                      }}
                      aria-label={`Remove ${skill}`}
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                );
              })}
              <input
                ref={skillInputRef}
                type="text"
                className="emp-tags__input"
                placeholder={
                  skills.length === 0 ? "Type a skill and press Enter…" : ""
                }
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                onBlur={addSkill}
              />
            </div>
          </div>

          {/* Deadline */}
          <div className="emp-modal__field">
            <Label htmlFor="task-deadline">Deadline (Date & Time)</Label>
            <Input
              id="task-deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              aria-invalid={!!errors.deadline}
            />
            {errors.deadline && (
              <span className="emp-modal__error">{errors.deadline}</span>
            )}
          </div>
        </div>

        <div className="emp-modal__footer">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
          >
            {initialData ? (
              <>
                <Save className="size-4" />
                Save Changes
              </>
            ) : (
              <>
                <Plus className="size-4" />
                Publish Task
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useState, useEffect, useMemo, type ChangeEvent } from "react";
import { X, Plus, Save, Upload, Trash2, FileText, Loader2, Sparkles } from "lucide-react";
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
import type { Task } from "./TaskManagement";
import SkillPicker from "./SkillPicker";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Typography } from "@/components/ui/Typography";

export interface PostTaskData {
  title: string;
  category: string;
  skillLevel: "beginner" | "intermediate" | "advanced";
  description: string;
  skills: string[];
  deadline: number;
  maxApplicants?: number;
  imageStorageIds?: string[];
  attachments?: {
    storageId: string;
    name: string;
    type: string;
  }[];
  customRubric?: string[];
}

/** Matches convex/tasks.ts — deadlines must be future and at least this far ahead. */
const MIN_TASK_DEADLINE_LEAD_MS = 24 * 60 * 60 * 1000;

function toDatetimeLocalValue(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const CATEGORIES = [
  "AI/ML",
  "Backend Development",
  "Blockchain",
  "Cloud Computing",
  "Cybersecurity",
  "Data Science",
  "Database Administration",
  "DevOps",
  "Embedded Systems",
  "Full Stack Development",
  "Game Development",
  "Machine Learning",
  "Mobile Development",
  "Networking",
  "Software Engineering",
  "UI/UX Design",
  "Web Development",
];

const SKILL_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

// Default agent rubric dimensions per category (mirrors evaluate-submission route)
const CATEGORY_AGENT_MAP: Record<string, string> = {
  "Web Development": "web",
  "Frontend Development": "web",
  "UI/UX Design": "web",
  "Backend Development": "fullstack",
  "Full Stack Development": "fullstack",
  "Mobile Development": "fullstack",
  "Game Development": "fullstack",
  "Blockchain": "fullstack",
  "AI/ML": "ai_ml",
  "Data Science": "ai_ml",
  "Machine Learning": "ai_ml",
  "Software Engineering": "se",
  "DevOps": "se",
  "Cloud Computing": "se",
  "Database Administration": "se",
  "Networking": "se",
  "Embedded Systems": "se",
  "Cybersecurity": "cybersec",
};

const DEFAULT_RUBRICS: Record<string, string[]> = {
  web: [
    "Semantic HTML & Structure",
    "CSS Quality & Responsive Design",
    "JavaScript / Framework Correctness",
    "Accessibility (a11y)",
    "User Experience & Visual Design",
    "Code Organization & Best Practices",
  ],
  ai_ml: [
    "Data Preprocessing & Cleaning",
    "Model Choice & Justification",
    "Evaluation Metrics & Validation",
    "Data Leakage Prevention",
    "Code Clarity & Documentation",
    "Results Interpretation",
  ],
  fullstack: [
    "API Design & RESTful Practices",
    "Database Schema & Queries",
    "Authentication & Authorization",
    "Error Handling & Edge Cases",
    "Separation of Concerns",
    "Code Quality & Maintainability",
  ],
  se: [
    "Code Structure & Architecture",
    "Naming Conventions & Readability",
    "Testing & Test Coverage",
    "Design Patterns & SOLID Principles",
    "Documentation & Comments",
    "Error Handling & Robustness",
  ],
  cybersec: [
    "OWASP Top 10 Compliance",
    "Input Validation & Sanitization",
    "Authentication & Session Management",
    "Secrets Management",
    "Threat Modeling Awareness",
    "Secure Coding Practices",
  ],
};

function getDefaultRubric(cat: string): string[] {
  const agent = CATEGORY_AGENT_MAP[cat];
  return agent ? DEFAULT_RUBRICS[agent] ?? DEFAULT_RUBRICS.se : DEFAULT_RUBRICS.se;
}

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
  const [deadline, setDeadline] = useState("");
  const [maxApplicants, setMaxApplicants] = useState("");
  const [customRubric, setCustomRubric] = useState<string[]>([]);
  const [newRubricDim, setNewRubricDim] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imageStorageIds, setImageStorageIds] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<
    {
      storageId: string;
      name: string;
      type: string;
      url?: string;
    }[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const generateUploadUrl = useMutation(api.tasks.generateUploadUrl);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setTitle(initialData.title);
        setCategory(initialData.category);
        setSkillLevel(initialData.skillLevel.toLowerCase());
        setDescription(initialData.description || "");
        setSkills(initialData.skills || []);
        setImageStorageIds(initialData.imageStorageIds || []);
        setImageUrls(initialData.imageUrls || []);
        setAttachments(initialData.resolvedAttachments || []);
        setCustomRubric(initialData.customRubric || []);

        if (initialData.deadline) {
          const d = new Date(initialData.deadline);
          const pad = (n: number) => n.toString().padStart(2, "0");
          setDeadline(
            `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`,
          );
        } else {
          setDeadline("");
        }

        if (initialData.maxApplicants !== undefined) {
          setMaxApplicants(initialData.maxApplicants.toString());
        } else {
          setMaxApplicants("");
        }
      } else {
        resetForm();
      }
    }
  }, [open, initialData]);

  // Generate stable blob preview URLs and revoke them on cleanup
  const previewUrls = useMemo(() => {
    const urls = selectedFiles.map((file) => URL.createObjectURL(file));
    return urls;
  }, [selectedFiles]);

  // Revoke blob URLs when they change or component unmounts
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const minDeadlineInput = useMemo(
    () =>
      toDatetimeLocalValue(new Date(Date.now() + MIN_TASK_DEADLINE_LEAD_MS)),
    [open],
  );

  if (!open) return null;

  const resetForm = () => {
    setTitle("");
    setCategory("");
    setSkillLevel("");
    setDescription("");
    setSkills([]);
    setDeadline("");
    setMaxApplicants("");
    setErrors({});
    setSelectedFiles([]);
    setImageStorageIds([]);
    setImageUrls([]);
    setAttachments([]);
    setCustomRubric([]);
    setNewRubricDim("");
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Title is required";
    if (!category) newErrors.category = "Category is required";
    if (!skillLevel) newErrors.skillLevel = "Skill level is required";
    if (!description.trim()) newErrors.description = "Description is required";
    if (!deadline) newErrors.deadline = "Deadline is required";
    else {
      const ts = new Date(deadline).getTime();
      if (Number.isNaN(ts)) {
        newErrors.deadline = "Invalid date and time";
      } else {
        const now = Date.now();
        if (ts <= now) {
          newErrors.deadline = "Deadline cannot be in the past.";
        // Allow 1 minute tolerance since datetime-local has minute precision
        // and Date.now() advances between picking and validating
        } else if (ts - now < MIN_TASK_DEADLINE_LEAD_MS - 60_000) {
          newErrors.deadline =
            "Deadline must be at least 24 hours from now — shorter windows are not allowed.";
        }
      }
    }
    if (maxApplicants && isNaN(Number(maxApplicants)))
      newErrors.maxApplicants = "Must be a valid number";
    if (maxApplicants && Number(maxApplicants) < 1)
      newErrors.maxApplicants = "Must be at least 1";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const MAX_ATTACHMENTS = 10;

  const totalAttachments =
    imageUrls.length + attachments.length + selectedFiles.length;
  const isAtLimit = totalAttachments >= MAX_ATTACHMENTS;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const remaining = MAX_ATTACHMENTS - totalAttachments;
      const toAdd = filesArray.slice(0, Math.max(0, remaining));
      if (toAdd.length > 0) {
        setSelectedFiles((prev) => [...prev, ...toAdd]);
      }
    }
    // Reset the input value so the same file can be re-selected if removed
    e.target.value = "";
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setImageStorageIds((prev) => prev.filter((_, i) => i !== index));
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsUploading(true);
    const newStorageIds = [...imageStorageIds];
    const uploadedAttachments: {
      storageId: string;
      name: string;
      type: string;
    }[] = [];

    try {
      for (const file of selectedFiles) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = await result.json();
        uploadedAttachments.push({
          storageId,
          name: file.name,
          type: file.type,
        });
      }

      await onSubmit({
        title: title.trim(),
        category,
        skillLevel: skillLevel as "beginner" | "intermediate" | "advanced",
        description: description.trim(),
        skills,
        deadline: new Date(deadline).getTime(),
        maxApplicants: maxApplicants ? Number(maxApplicants) : undefined,
        imageStorageIds: newStorageIds,
        attachments: [
          ...attachments.map((a) => ({
            storageId: a.storageId,
            name: a.name,
            type: a.type,
          })),
          ...uploadedAttachments,
        ],
        customRubric: customRubric.length > 0 ? customRubric : undefined,
      });

      resetForm();
      onClose();
    } catch (e) {
      console.error("Failed to upload files:", e);
      setErrors({
        ...errors,
        submit: "Failed to upload files. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  /*
   * Shared select styles — matching the auth page pattern exactly.
   * We use position="popper" so the dropdown portals but positions near the trigger.
   * The SelectContent z-index must be above the modal overlay (z-100) → z-[200].
   */
  const selectTriggerClass =
    "h-11 w-full rounded-none border-2 border-border bg-white cursor-pointer transition-all focus:shadow-[4px_4px_0_0_hsl(263,70%,50%)] dark:bg-black dark:focus:shadow-[4px_4px_0_0_hsl(290,70%,70%)] shadow-[4px_4px_0_0_var(--border)] data-[state=open]:translate-x-[2px] data-[state=open]:translate-y-[2px] data-[state=open]:shadow-[2px_2px_0_0_var(--border)]";
  const selectContentClass =
    "z-[200] bg-white border-2 border-border shadow-[4px_4px_0_0_var(--border)] dark:bg-black rounded-none";
  const selectItemClass =
    "cursor-pointer focus:bg-black focus:text-white dark:focus:bg-white dark:focus:text-black rounded-none font-bold tracking-wide";

  return (
    <div className="emp-modal-overlay" onClick={onClose}>
      <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="emp-modal__header">
          <Typography variant="h2" className="emp-modal__header-title">
            {initialData ? "Edit Task" : "Post a New Task"}
          </Typography>
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
              className="rounded-none border-2 border-border shadow-[4px_4px_0_0_var(--border)] focus-visible:ring-0 focus-visible:shadow-[4px_4px_0_0_hsl(263,70%,50%)] dark:focus-visible:shadow-[4px_4px_0_0_hsl(290,70%,70%)] transition-all focus-visible:translate-x-[2px] focus-visible:translate-y-[2px]"
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

          {/* Skills picker */}
          <div className="emp-modal__field">
            <Label>Required Skills</Label>
            <SkillPicker skills={skills} onChange={setSkills} />
          </div>

          {/* Evaluation Rubric (optional) */}
          <div className="emp-modal__field">
            <Label className="flex items-center gap-2">
              <Sparkles className="size-4 text-[#2563EB]" />
              Evaluation Rubric (Optional)
            </Label>
            <p className="text-sm text-muted-foreground mb-3">
              The AI will evaluate submissions against default dimensions for the selected category.
              You can add your own custom criteria based on your task requirements.
            </p>

            {/* Default agent dimensions */}
            {category && (
              <div className="mb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2">
                  Default AI Dimensions ({CATEGORY_AGENT_MAP[category] ?? "se"})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {getDefaultRubric(category).map((dim) => (
                    <span
                      key={dim}
                      className="inline-flex items-center px-2 py-1 text-[10px] font-bold uppercase tracking-wide border-2 border-border bg-muted/50 text-muted-foreground"
                    >
                      {dim}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Custom rubric dimensions */}
            {customRubric.length > 0 && (
              <div className="mb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-foreground block mb-2">
                  Your Custom Dimensions
                </span>
                <div className="space-y-1.5">
                  {customRubric.map((dim, i) => (
                    <div
                      key={`rubric-${i}`}
                      className="flex items-center gap-2 p-2 border-2 border-[#2563EB] bg-blue-50 dark:bg-blue-950/30"
                    >
                      <Sparkles className="size-3 text-[#2563EB] shrink-0" />
                      <span className="text-xs font-bold flex-1">{dim}</span>
                      <button
                        type="button"
                        onClick={() => setCustomRubric((prev) => prev.filter((_, idx) => idx !== i))}
                        className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add new rubric dimension */}
            <div className="flex gap-2">
              <Input
                value={newRubricDim}
                onChange={(e) => setNewRubricDim(e.target.value)}
                placeholder="e.g. Mobile Responsiveness, API Error Handling..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newRubricDim.trim()) {
                    e.preventDefault();
                    const trimmed = newRubricDim.trim();
                    if (!customRubric.some((d) => d.toLowerCase() === trimmed.toLowerCase())) {
                      setCustomRubric((prev) => [...prev, trimmed]);
                    }
                    setNewRubricDim("");
                  }
                }}
                className="rounded-none border-2 border-border shadow-[4px_4px_0_0_var(--border)] focus-visible:ring-0 focus-visible:shadow-[4px_4px_0_0_hsl(263,70%,50%)] dark:focus-visible:shadow-[4px_4px_0_0_hsl(290,70%,70%)] transition-all focus-visible:translate-x-[2px] focus-visible:translate-y-[2px] text-sm"
              />
              <Button
                type="button"
                onClick={() => {
                  const trimmed = newRubricDim.trim();
                  if (trimmed && !customRubric.some((d) => d.toLowerCase() === trimmed.toLowerCase())) {
                    setCustomRubric((prev) => [...prev, trimmed]);
                    setNewRubricDim("");
                  }
                }}
                disabled={!newRubricDim.trim()}
                className="rounded-none border-2 border-border bg-[#2563EB] text-white shadow-[4px_4px_0_0_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all shrink-0"
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          {/* Deadline */}
          <div className="emp-modal__field">
            <Label htmlFor="task-deadline">Deadline (Date & Time)</Label>
            <p className="text-sm text-muted-foreground mb-1.5">
              Must be in the future, at least 24 hours from now. Earlier times are
              greyed out in the picker.
            </p>
            <Input
              id="task-deadline"
              type="datetime-local"
              min={minDeadlineInput}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              aria-invalid={!!errors.deadline}
              className="rounded-none border-2 border-border shadow-[4px_4px_0_0_var(--border)] focus-visible:ring-0 focus-visible:shadow-[4px_4px_0_0_hsl(263,70%,50%)] dark:focus-visible:shadow-[4px_4px_0_0_hsl(290,70%,70%)] transition-all focus-visible:translate-x-[2px] focus-visible:translate-y-[2px]"
            />
            {errors.deadline && (
              <span className="emp-modal__error">{errors.deadline}</span>
            )}
          </div>

          {/* Max Applicants */}
          <div className="emp-modal__field">
            <Label htmlFor="max-applicants">Max Applicants (Optional)</Label>
            <Input
              id="max-applicants"
              type="number"
              min="1"
              placeholder="e.g. 5 (Leave empty for no limit)"
              value={maxApplicants}
              onChange={(e) => setMaxApplicants(e.target.value)}
              aria-invalid={!!errors.maxApplicants}
              className="rounded-none border-2 border-border shadow-[4px_4px_0_0_var(--border)] focus-visible:ring-0 focus-visible:shadow-[4px_4px_0_0_hsl(263,70%,50%)] dark:focus-visible:shadow-[4px_4px_0_0_hsl(290,70%,70%)] transition-all focus-visible:translate-x-[2px] focus-visible:translate-y-[2px]"
            />
            {errors.maxApplicants && (
              <span className="emp-modal__error">{errors.maxApplicants}</span>
            )}
          </div>

          {/* Attachments */}
          <div className="emp-modal__field">
            <Label>Attachments (Optional)</Label>
            <div className="mt-1.5 text-sm text-muted-foreground mb-3">
              Upload images or PDF mockups related to this task.
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Legacy Images */}
              {imageUrls.map((url, i) => (
                <div
                  key={`existing-${i}`}
                  className="group relative aspect-square rounded-lg border bg-muted overflow-hidden"
                >
                  <Image
                    src={url}
                    alt={`Attachment ${i + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                    <button
                      type="button"
                      onClick={() => removeExistingImage(i)}
                      className="bg-red-500/90 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors shadow-sm"
                    >
                      <Trash2 className="size-4" />
                    </button>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-2 right-2 text-xs text-white bg-black/50 px-2 py-0.5 rounded hover:bg-black/70 transition-colors"
                    >
                      View
                    </a>
                  </div>
                </div>
              ))}

              {/* Resolved Attachments */}
              {attachments.map((att, i) => {
                const isImage = att.type.startsWith("image/");
                return (
                  <div
                    key={`attachment-${i}`}
                    className="group relative aspect-square rounded-lg border bg-muted flex flex-col items-center justify-center p-2 text-center overflow-hidden"
                  >
                    {isImage ? (
                      <Image
                        src={att.url || ""}
                        alt={att.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <>
                        <FileText className="size-8 text-purple-600 mb-2" />
                        <span className="text-xs truncate w-full px-1 z-10 relative">
                          {att.name}
                        </span>
                      </>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                      <button
                        type="button"
                        onClick={() => removeExistingAttachment(i)}
                        className="bg-red-500/90 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors shadow-sm"
                      >
                        <Trash2 className="size-4" />
                      </button>
                      {att.url && (
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute bottom-2 right-2 text-xs text-white bg-black/50 px-2 py-0.5 rounded hover:bg-black/70 transition-colors"
                        >
                          View
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Newly Selected Files */}
              {selectedFiles.map((file, i) => {
                const isImage = file.type.startsWith("image/");
                return (
                  <div
                    key={`new-${i}`}
                    className="group relative aspect-square rounded-lg border bg-muted flex flex-col items-center justify-center p-2 text-center overflow-hidden"
                  >
                    {isImage ? (
                      <Image
                        src={previewUrls[i]}
                        alt={file.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <>
                        <FileText className="size-8 text-purple-600 mb-2" />
                        <span className="text-xs truncate w-full px-1">
                          {file.name}
                        </span>
                      </>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => removeSelectedFile(i)}
                        className="bg-red-500/90 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors shadow-sm"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Upload Button Box - Full Width */}
            <Label
              className={`mt-3 w-full cursor-pointer rounded-none border-2 transition-all flex flex-col items-center justify-center py-8 ${
                isAtLimit
                  ? "border-red-500 bg-red-500/5 text-red-500 dark:border-red-400 dark:text-red-400 cursor-not-allowed shadow-[4px_4px_0_0_#ef4444]"
                  : "border-border shadow-[4px_4px_0_0_var(--border)] focus-within:shadow-[4px_4px_0_0_hsl(263,70%,50%)] hover:shadow-[4px_4px_0_0_hsl(263,70%,50%)] dark:hover:shadow-[4px_4px_0_0_hsl(290,70%,70%)] bg-card hover:-translate-x-[2px] hover:-translate-y-[2px] text-foreground"
              }`}
            >
              <Upload className="size-8 mb-3" />
              {isAtLimit ? (
                <>
                  <span className="text-sm font-semibold">
                    Maximum of 10 attachments per task reached
                  </span>
                  <span className="text-xs mt-1 opacity-70">
                    Remove an existing attachment to add a new one
                  </span>
                </>
              ) : (
                <>
                  <span className="text-sm font-medium">
                    Click to upload files
                  </span>
                  <span className="text-xs mt-1 opacity-70">
                    Images or PDF · {totalAttachments}/{MAX_ATTACHMENTS}{" "}
                    attachments
                  </span>
                </>
              )}
              <input
                type="file"
                className="hidden"
                multiple
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                disabled={isAtLimit}
              />
            </Label>
            {errors.submit && (
              <div className="mt-2 text-sm text-red-500 font-medium">
                {errors.submit}
              </div>
            )}
          </div>
        </div>

        <div className="emp-modal__footer">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isUploading}
            className="rounded-none border-2 border-border hover:bg-border hover:text-card shadow-[4px_4px_0_0_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isUploading}
            className="rounded-none bg-foreground text-card border-2 border-border shadow-[4px_4px_0_0_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all gap-1.5"
          >
            {isUploading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Uploading...
              </>
            ) : initialData ? (
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

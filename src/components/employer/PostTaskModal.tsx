"use client";

import Image from "next/image";
import { useState, useEffect, useMemo, type ChangeEvent } from "react";
import { X, Plus, Save, Upload, Trash2, FileText, Loader2 } from "lucide-react";
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
  imageStorageIds?: string[];
  attachments?: {
    storageId: string;
    name: string;
    type: string;
  }[];
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
  const [deadline, setDeadline] = useState("");
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

        if (initialData.deadline) {
          const d = new Date(initialData.deadline);
          const pad = (n: number) => n.toString().padStart(2, "0");
          setDeadline(
            `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`,
          );
        } else {
          setDeadline("");
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

  if (!open) return null;

  const resetForm = () => {
    setTitle("");
    setCategory("");
    setSkillLevel("");
    setDescription("");
    setSkills([]);
    setDeadline("");
    setErrors({});
    setSelectedFiles([]);
    setImageStorageIds([]);
    setImageUrls([]);
    setAttachments([]);
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
        imageStorageIds: newStorageIds,
        attachments: [
          ...attachments.map((a) => ({
            storageId: a.storageId,
            name: a.name,
            type: a.type,
          })),
          ...uploadedAttachments,
        ],
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
    "h-11 w-full rounded-lg bg-white cursor-pointer transition-colors hover:bg-slate-50 dark:bg-gray-800 dark:hover:bg-gray-700";
  const selectContentClass =
    "z-[200] bg-white shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700";
  const selectItemClass =
    "cursor-pointer focus:bg-slate-100 dark:focus:bg-gray-700";

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
              className={`mt-3 w-full cursor-pointer rounded-lg border-2 border-dashed transition-colors flex flex-col items-center justify-center py-8 ${
                isAtLimit
                  ? "border-red-500 bg-red-500/5 text-red-500 dark:border-red-400 dark:text-red-400 cursor-not-allowed"
                  : "border-muted-foreground/25 hover:border-purple-500 dark:hover:border-purple-500 bg-muted/20 hover:bg-muted/50 text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400"
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
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isUploading}
            className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
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

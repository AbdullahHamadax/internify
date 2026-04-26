"use client";


import { useState } from "react";
import { X, CalendarDays, Users, Trash2, Tag, FileText, Download, User, Sparkles } from "lucide-react";

import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Typography } from "@/components/ui/Typography";
import { Button } from "@/components/ui/button";
import type { Task } from "./TaskManagement";
import deviconData from "devicon/devicon.json";
import { useProfileModal } from "@/components/shared/ProfileModalContext";
import EvaluationResults, { type EvaluationData } from "@/components/student/EvaluationResults";

const ICON_MAPPINGS: Record<string, string> = {
  "Vue": "vuejs",
  "HTML": "html5",
  "CSS": "css3",
  "Express": "express",
  "TensorFlow": "tensorFlow",
};

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onDelete: (taskId: string) => void;
  onEdit: () => void;
}

export default function TaskDetailModal({
  task,
  open,
  onClose,
  onDelete,
  onEdit,
}: TaskDetailModalProps) {
  const { openProfile } = useProfileModal();
  const [selectedEvaluation, setSelectedEvaluation] = useState<{
    data: EvaluationData;
    studentName: string;
  } | null>(null);
  const submissions = useQuery(
    api.tasks.getTaskSubmissions,
    open && task ? { taskId: task.id as Id<"tasks"> } : "skip",
  );

  const evaluations = useQuery(
    api.evaluations.getEvaluationsByTask,
    open && task ? { taskId: task.id as Id<"tasks"> } : "skip",
  );

  // Build a map of studentId -> evaluation for quick lookup
  const evaluationMap = new Map(
    (evaluations ?? []).map((ev) => [ev.studentId, ev]),
  );

  if (!open || !task) return null;

  const handleDelete = () => {
    if (
      confirm(
        "Are you sure you want to delete this task? This action cannot be undone.",
      )
    ) {
      onDelete(task.id);
      onClose();
    }
  };

  const formattedDeadline = task.deadline
    ? new Date(task.deadline).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "No deadline";

  return (
    <div className="emp-modal-overlay" onClick={onClose}>
      <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="emp-modal__header">
          <Typography variant="h2" className="emp-modal__header-title">
            Task Details
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

        <div className="emp-modal__body space-y-6">
          {/* Header Info */}
          <div>
            <Typography variant="h3" className="text-xl font-bold mb-2">
              {task.title}
            </Typography>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="emp-cat-tag emp-cat-tag--default">
                {task.category}
              </span>
              <span className="font-medium text-foreground">
                {task.skillLevel}
              </span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
              <span className="flex items-center gap-1.5">
                <Users className="size-4" /> {task.applications} applicants
              </span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-4" /> {formattedDeadline}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <Typography variant="h4" className="font-semibold mb-2">
              Description
            </Typography>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap break-words leading-relaxed">
              {task.description || "No description provided."}
            </div>
          </div>

          {/* Skills */}
          {task.skills && task.skills.length > 0 && (
            <div>
              <Typography variant="h4" className="font-semibold mb-2">
                Required Skills
              </Typography>
              <div className="flex flex-wrap gap-2">
                {task.skills.map((skill) => {
                  const mappedKey = ICON_MAPPINGS[skill];
                  let deviconName = mappedKey;
                  let hasIcon = !!mappedKey;

                  if (!hasIcon) {
                    deviconName = skill.toLowerCase().replace(/[^a-z0-9]/g, "");
                    hasIcon = (
                      deviconData as Array<{ name: string; altnames: string[] }>
                    ).some(
                      (icon) =>
                        icon.name === deviconName ||
                        icon.altnames.includes(deviconName!),
                    );
                  }

                  return (
                    <span
                      key={skill}
                      className="emp-tag flex items-center pr-2 pl-2.5"
                    >
                      {hasIcon ? (
                        <i
                          className={`devicon-${deviconName}-plain colored text-sm mr-1.5 opacity-90`}
                        ></i>
                      ) : (
                        <div className="mr-1.5 flex items-center justify-center opacity-70">
                          <Tag className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {skill}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Attachments */}
          {((task.imageUrls && task.imageUrls.length > 0) ||
            (task.resolvedAttachments &&
              task.resolvedAttachments.length > 0)) && (
            <div>
              <Typography variant="h4" className="font-semibold mb-3">
                Attachments
              </Typography>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Legacy simple URLs */}
                {task.imageUrls?.map((url, i) => (
                  <a
                    key={`legacy-attachment-${i}`}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative aspect-square rounded-lg border bg-muted overflow-hidden block focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <Image
                      src={url}
                      alt={`Task attachment ${i + 1}`}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        const parent = (e.target as HTMLImageElement)
                          .parentElement;
                        if (
                          parent &&
                          !parent.querySelector(".emp-fallback-icon")
                        ) {
                          const fallback = document.createElement("div");
                          fallback.className =
                            "emp-fallback-icon absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-muted";
                          fallback.innerHTML =
                            '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text mb-2 text-purple-600"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg><span class="text-xs font-medium">Legacy File</span>';
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                    {/* Hover Overlay for legacy */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                      <span className="text-sm font-medium text-white flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                        <FileText className="size-4" /> View File
                      </span>
                    </div>
                  </a>
                ))}

                {/* Structured Attachments */}
                {task.resolvedAttachments?.map((att, i) => {
                  const isImage = att.type.startsWith("image/");
                  return (
                    <a
                      key={`attachment-${i}`}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative aspect-square rounded-lg border bg-muted flex flex-col items-center justify-center p-2 text-center overflow-hidden focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    >
                      {isImage ? (
                        <Image
                          src={att.url}
                          alt={att.name}
                          fill
                          unoptimized
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <>
                          <FileText className="size-8 text-purple-600 mb-2" />
                          <span className="text-xs truncate w-full px-1 z-10 relative font-medium text-muted-foreground">
                            {att.name}
                          </span>
                        </>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                        <span className="text-sm font-medium text-white flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                          <FileText className="size-4" /> View File
                        </span>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submissions */}
          {submissions && submissions.length > 0 && (
            <div>
              <Typography variant="h4" className="font-semibold mb-3">
                Submissions ({submissions.length})
              </Typography>
              <div className="space-y-4">
                {submissions.map((sub) => (
                  <div
                    key={sub._id}
                    className="border-2 border-black dark:border-white p-4 shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-[#2563EB] border border-black dark:border-white">
                        <User className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span
                        className="font-bold text-sm cursor-pointer hover:underline decoration-2 underline-offset-2 hover:text-[#2563EB] transition-colors"
                        onClick={() => openProfile(sub.studentId)}
                        title={`View ${sub.studentName}'s profile`}
                      >
                        {sub.studentName}
                      </span>
                      {/* AI Score Badge */}
                      {(() => {
                        const ev = evaluationMap.get(sub.studentId);
                        if (!ev) return null;
                        const scoreColor =
                          ev.overallScore >= 90 ? "#059669" :
                          ev.overallScore >= 75 ? "#2563EB" :
                          ev.overallScore >= 60 ? "#D97706" :
                          ev.overallScore >= 40 ? "#EA580C" : "#DC2626";
                        const scoreBg =
                          ev.overallScore >= 90 ? "#D1FAE5" :
                          ev.overallScore >= 75 ? "#DBEAFE" :
                          ev.overallScore >= 60 ? "#FEF3C7" :
                          ev.overallScore >= 40 ? "#FFEDD5" : "#FEE2E2";
                        return (
                          <span
                            className="inline-flex items-center gap-1 text-xs font-black px-2 py-0.5 border border-black dark:border-white"
                            style={{ backgroundColor: scoreBg, color: scoreColor }}
                            title={`AI Score: ${ev.overallScore}/100 — ${ev.verdict}`}
                          >
                            <Sparkles className="w-3 h-3" />
                            {ev.overallScore}
                          </span>
                        );
                      })()}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(sub.submittedAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {sub.note && (
                      <p className="text-sm text-muted-foreground mb-3 italic">
                        &ldquo;{sub.note}&rdquo;
                      </p>
                    )}

                    <div className="space-y-1.5">
                      {sub.files.map((file, fi) => (
                        <a
                          key={fi}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 bg-muted/50 hover:bg-muted border border-black/20 dark:border-white/20 transition-colors group"
                        >
                          <FileText className="w-4 h-4 text-[#2563EB] shrink-0" />
                          <span className="text-sm font-medium truncate flex-1">
                            {file.name}
                          </span>
                          <Download className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                        </a>
                      ))}
                    </div>

                    {/* View AI Report Button */}
                    {(() => {
                      const ev = evaluationMap.get(sub.studentId);
                      if (!ev) return null;
                      return (
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedEvaluation({
                              data: {
                                agentType: ev.agentType,
                                overallScore: ev.overallScore,
                                verdict: ev.verdict,
                                scores: ev.scores,
                                strengths: ev.strengths,
                                improvements: ev.improvements,
                                summary: ev.summary,
                              },
                              studentName: sub.studentName,
                            })
                          }
                          className="mt-3 w-full flex items-center justify-center gap-2 py-2 text-xs font-black uppercase tracking-widest border-2 border-black dark:border-white shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#000] dark:hover:shadow-[1px_1px_0_0_#fff] transition-all bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          View AI Report
                        </button>
                      );
                    })()}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status info */}
          <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground mb-1">
                Current Status
              </span>
              <span className={`emp-badge emp-badge--${task.status}`}>
                <span className="emp-badge__dot" />
                {task.status.replace("_", " ")}
              </span>
            </div>
            {task.status === "completed" && task.avgScore !== undefined && (
              <div className="flex flex-col items-end">
                <span className="text-sm text-muted-foreground mb-1">
                  Avg Score
                </span>
                <span className="font-semibold">{task.avgScore}%</span>
              </div>
            )}
          </div>
        </div>

        <div className="emp-modal__footer justify-between">
          <Button
            variant="ghost"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 font-medium"
            onClick={handleDelete}
          >
            <Trash2 className="size-4 mr-2" />
            Delete Task
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={onEdit}
            >
              Edit Task
            </Button>
          </div>
        </div>
      </div>

      {/* AI Evaluation Report Overlay */}
      {selectedEvaluation && (
        <EvaluationResults
          evaluation={selectedEvaluation.data}
          taskTitle={task.title}
          companyName={selectedEvaluation.studentName}
          onClose={() => setSelectedEvaluation(null)}
        />
      )}
    </div>
  );
}

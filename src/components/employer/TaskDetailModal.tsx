"use client";

import { X, CalendarDays, Clock, Users, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Task } from "./TaskManagement";
import deviconData from "devicon/devicon.json";

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
  if (!open || !task) return null;

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
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
          <h2 className="emp-modal__header-title">Task Details</h2>
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
            <h3 className="text-xl font-bold mb-2">{task.title}</h3>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="emp-cat-tag emp-cat-tag--default">
                {task.category}
              </span>
              <span className="font-medium text-foreground">{task.skillLevel}</span>
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
            <h4 className="font-semibold mb-2">Description</h4>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {task.description || "No description provided."}
            </div>
          </div>

          {/* Skills */}
          {task.skills && task.skills.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Required Skills</h4>
              <div className="flex flex-wrap gap-2">
                {task.skills.map((skill) => {
                  const deviconName = skill.toLowerCase().replace(/[^a-z0-9]/g, "");
                  const hasIcon = (deviconData as any[]).some(
                    (icon) => icon.name === deviconName || icon.altnames.includes(deviconName)
                  );

                  return (
                    <span
                      key={skill}
                      className="emp-tag flex items-center pr-2 pl-2.5"
                    >
                      {hasIcon ? (
                        <i className={`devicon-${deviconName}-plain colored text-sm mr-1.5 opacity-90`}></i>
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
          
          {/* Status info */}
          <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground mb-1">Current Status</span>
              <span className={`emp-badge emp-badge--${task.status}`}>
                <span className="emp-badge__dot" />
                {task.status.replace("_", " ")}
              </span>
            </div>
            {task.status === "completed" && task.avgScore !== undefined && (
              <div className="flex flex-col items-end">
                <span className="text-sm text-muted-foreground mb-1">Avg Score</span>
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
    </div>
  );
}

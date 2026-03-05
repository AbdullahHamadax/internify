"use client";

import { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Users,
  Clock,
  CalendarDays,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export type TaskStatus = "pending" | "in_progress" | "completed";

export interface Task {
  id: string;
  title: string;
  category: string;
  skillLevel: string;
  status: TaskStatus;
  applications: number;
  daysLeft?: number;
  deadline?: number;
  description?: string;
  skills?: string[];
  completedDate?: string;
  avgScore?: number;
}

interface TaskManagementProps {
  tasks: Task[];
  onViewTask: (task: Task) => void;
}

const STATUS_LABEL: Record<TaskStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

/* ── Map categories to color-coded tag classes ── */

function getCategoryClass(category: string): string {
  const lower = category.toLowerCase();
  if (
    lower.includes("web") ||
    lower.includes("e-commerce") ||
    lower.includes("cloud") ||
    lower.includes("devops")
  )
    return "emp-cat-tag--dev";
  if (lower.includes("mobile")) return "emp-cat-tag--mobile";
  if (
    lower.includes("data") ||
    lower.includes("machine") ||
    lower.includes("cyber")
  )
    return "emp-cat-tag--data";
  if (lower.includes("design") || lower.includes("ui"))
    return "emp-cat-tag--design";
  if (lower.includes("marketing")) return "emp-cat-tag--marketing";
  if (lower.includes("content") || lower.includes("writing"))
    return "emp-cat-tag--writing";
  return "emp-cat-tag--default";
}

function TaskRow({ task, onView }: { task: Task; onView: (task: Task) => void }) {
  return (
    <div className="emp-task-row">
      <div className="emp-task-row__info">
        <div className="emp-task-row__title">{task.title}</div>
        <div className="emp-task-row__meta">
          <span className={`emp-cat-tag ${getCategoryClass(task.category)}`}>
            {task.category}
          </span>
          <span className="emp-skill-tag-inline">{task.skillLevel}</span>

          {(task.status === "pending" || task.status === "in_progress") && (
            <>
              <span className="emp-task-row__meta-sep" />
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                <Users className="size-3.5" /> {task.applications}
              </span>
              {task.deadline !== undefined ? (
                <>
                  <span className="emp-task-row__meta-sep" />
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    <Clock className="size-3.5" />{" "}
                    {new Date(task.deadline).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </>
              ) : task.daysLeft !== undefined && (
                <>
                  <span className="emp-task-row__meta-sep" />
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    <Clock className="size-3.5" /> {task.daysLeft}d left
                  </span>
                </>
              )}
            </>
          )}

          {task.status === "completed" && (
            <>
              {task.avgScore !== undefined && (
                <>
                  <span className="emp-task-row__meta-sep" />
                  <span>Score: {task.avgScore}%</span>
                </>
              )}
              {task.completedDate && (
                <>
                  <span className="emp-task-row__meta-sep" />
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    <CalendarDays className="size-3.5" /> {task.completedDate}
                  </span>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="emp-task-row__actions">
        <span className={`emp-badge emp-badge--${task.status}`}>
          <span className="emp-badge__dot" />
          {STATUS_LABEL[task.status]}
        </span>
        <button type="button" className="emp-task-row__link" onClick={() => onView(task)}>
          {task.status === "completed" ? "Results" : "View"}
        </button>
      </div>
    </div>
  );
}

export default function TaskManagement({ tasks, onViewTask }: TaskManagementProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filterTasks = (status: TaskStatus) =>
    tasks
      .filter((t) => t.status === status)
      .filter(
        (t) =>
          !query ||
          t.title.toLowerCase().includes(query.toLowerCase()) ||
          t.category.toLowerCase().includes(query.toLowerCase()),
      );

  return (
    <div className="emp-tasks">
      <div className="emp-tasks__header">
        <span className="emp-tasks__title">Task Management</span>
        <div className="emp-tasks__header-actions">
          <button
            type="button"
            className="emp-icon-btn"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Search tasks"
          >
            <Search className="size-4" />
          </button>
          <button
            type="button"
            className="emp-icon-btn"
            aria-label="Filter tasks"
          >
            <SlidersHorizontal className="size-4" />
          </button>
        </div>
      </div>

      {searchOpen && (
        <input
          type="text"
          placeholder="Search tasks…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="emp-search-bar"
          autoFocus
        />
      )}

      <Tabs defaultValue="pending">
        <TabsList variant="line" className="emp-tasks__tabs-list">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        {(["pending", "in_progress", "completed"] as TaskStatus[]).map(
          (status) => (
            <TabsContent key={status} value={status}>
              {filterTasks(status).length === 0 ? (
                <div className="emp-task-empty">
                  No {STATUS_LABEL[status].toLowerCase()} tasks
                  {query ? ` matching "${query}"` : ""}
                </div>
              ) : (
                filterTasks(status).map((task) => (
                  <TaskRow key={task.id} task={task} onView={onViewTask} />
                ))
              )}
            </TabsContent>
          ),
        )}
      </Tabs>
    </div>
  );
}

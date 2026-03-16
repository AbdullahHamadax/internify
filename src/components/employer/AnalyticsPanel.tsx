"use client";

import { useMemo } from "react";
import { BarChart3, Inbox } from "lucide-react";
import type { Task } from "./TaskManagement";
import { Typography } from "@/components/ui/Typography";

interface AnalyticsPanelProps {
  tasks: Task[];
}

export default function AnalyticsPanel({ tasks }: AnalyticsPanelProps) {
  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const pending = tasks.filter((t) => t.status === "pending").length;

    const completionRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;
    const inProgressRate =
      total > 0 ? Math.round((inProgress / total) * 100) : 0;
    const pendingRate = total > 0 ? Math.round((pending / total) * 100) : 0;

    return [
      {
        label: "Task Completion Rate",
        value: completionRate,
        barColor: "emp-metric__fill--green",
      },
      {
        label: "In Progress",
        value: inProgressRate,
        barColor: "emp-metric__fill--blue",
      },
      {
        label: "Pending Tasks",
        value: pendingRate,
        barColor: "emp-metric__fill--violet",
      },
    ];
  }, [tasks]);

  /* ── Category breakdown ── */
  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of tasks) {
      counts[t.category] = (counts[t.category] || 0) + 1;
    }
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [tasks]);

  const maxCategoryCount = Math.max(...categoryBreakdown.map(([, c]) => c), 1);

  return (
    <aside className="emp-analytics">
      {/* Analytics metrics */}
      <div className="emp-analytics-card">
        <Typography variant="h4" className="emp-analytics-card__title">
          <div className="emp-analytics-card__icon">
            <BarChart3 className="size-4" strokeWidth={2} />
          </div>
          Analytics
        </Typography>

        {tasks.length === 0 ? (
          <div className="emp-analytics-empty">
            <Inbox
              className="size-8 mx-auto mb-2 opacity-40"
              strokeWidth={1.5}
            />
            <Typography variant="p" color="muted" className="text-sm text-center">
              Post your first task to see analytics
            </Typography>
          </div>
        ) : (
          metrics.map((m) => (
            <div key={m.label} className="emp-metric">
              <div className="emp-metric__head">
                <Typography variant="span" weight="bold" className="emp-metric__label">{m.label}</Typography>
                <Typography variant="span" weight="bold" className="emp-metric__value">{m.value}%</Typography>
              </div>
              <div className="emp-metric__bar">
                <div
                  className={`emp-metric__fill ${m.barColor}`}
                  style={{ width: `${m.value}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Category breakdown — real data */}
      <div className="emp-analytics-card">
        <Typography variant="h4" className="emp-analytics-card__title">Task Categories</Typography>

        {categoryBreakdown.length === 0 ? (
          <Typography variant="p" color="muted" className="text-sm py-4 text-center">
            No tasks yet
          </Typography>
        ) : (
          categoryBreakdown.map(([category, count]) => (
            <div key={category} className="emp-metric">
              <div className="emp-metric__head">
                <span className="emp-metric__label">{category}</span>
                <span className="emp-metric__value">{count}</span>
              </div>
              <div className="emp-metric__bar">
                <div
                  className="emp-metric__fill"
                  style={{
                    width: `${(count / maxCategoryCount) * 100}%`,
                    backgroundColor: "hsl(263 70% 50%)",
                    border: "2px solid var(--border)",
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}

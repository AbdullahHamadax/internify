"use client";

import { useMemo } from "react";
import { Clock, Users, CheckCircle2, BarChart3 } from "lucide-react";
import type { Task } from "./TaskManagement";
import { Typography } from "@/components/ui/Typography";

export interface DashboardStats {
  activeTasks: number;
  totalSubmissions: number;
  completedTasks: number;
  avgQualityScore: number;
}

interface StatsCardsProps {
  stats: DashboardStats;
  tasks: Task[];
}

/* ── Mini SVG sparkline ── */
function Sparkline({ points, color }: { points: number[]; color: string }) {
  const width = 64;
  const height = 24;

  if (points.length < 2) {
    // Not enough data — flat line
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        className="emp-stat-card__spark"
      >
        <line
          x1="0"
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeOpacity="0.35"
        />
      </svg>
    );
  }

  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;

  const path = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((p - min) / range) * (height - 4) - 2;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      className="emp-stat-card__spark"
    >
      <path
        d={path}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/**
 * Build a sparkline array from tasks by binning them into N buckets across
 * the full time range (earliest createdAt → now). Each bucket value is the
 * cumulative count of tasks that match the `filter` up to that bucket's end.
 */
function buildSparkline(
  tasks: Task[],
  buckets: number,
  filter?: (t: Task) => boolean,
): number[] {
  const filtered = filter ? tasks.filter(filter) : tasks;
  if (filtered.length === 0) return [0];

  const timestamps = filtered
    .map((t) => t.createdAt ?? 0)
    .filter((ts) => ts > 0)
    .sort((a, b) => a - b);

  if (timestamps.length === 0) return [0];

  const minTime = timestamps[0];
  const maxTime = Math.max(Date.now(), timestamps[timestamps.length - 1]);
  const span = maxTime - minTime || 1;

  const result: number[] = new Array(buckets).fill(0);

  for (const ts of timestamps) {
    const bucket = Math.min(
      Math.floor(((ts - minTime) / span) * buckets),
      buckets - 1,
    );
    result[bucket]++;
  }

  // Make cumulative
  for (let i = 1; i < result.length; i++) {
    result[i] += result[i - 1];
  }

  return result;
}

const STAT_CONFIG = [
  {
    key: "activeTasks" as const,
    label: "Active Tasks",
    icon: Clock,
    colorClass: "emp-stat-card__icon--blue",
    accentClass: "emp-stat-card--blue",
    sparkColor: "hsl(221 83% 53%)",
  },
  {
    key: "totalSubmissions" as const,
    label: "Total Submissions",
    icon: Users,
    colorClass: "emp-stat-card__icon--amber",
    accentClass: "emp-stat-card--amber",
    sparkColor: "hsl(38 92% 50%)",
  },
  {
    key: "completedTasks" as const,
    label: "Completed Tasks",
    icon: CheckCircle2,
    colorClass: "emp-stat-card__icon--emerald",
    accentClass: "emp-stat-card--emerald",
    sparkColor: "hsl(160 84% 39%)",
  },
  {
    key: "avgQualityScore" as const,
    label: "Avg Quality Score",
    icon: BarChart3,
    colorClass: "emp-stat-card__icon--violet",
    accentClass: "emp-stat-card--violet",
    suffix: "%",
    sparkColor: "hsl(263 70% 50%)",
  },
];

export default function StatsCards({ stats, tasks }: StatsCardsProps) {
  const sparklines = useMemo(() => {
    const BUCKETS = 7;
    return {
      activeTasks: buildSparkline(
        tasks,
        BUCKETS,
        (t) => t.status === "pending" || t.status === "in_progress",
      ),
      totalSubmissions: buildSparkline(tasks, BUCKETS), // All tasks as proxy
      completedTasks: buildSparkline(
        tasks,
        BUCKETS,
        (t) => t.status === "completed",
      ),
      avgQualityScore: buildSparkline(tasks, BUCKETS), // All tasks as proxy
    };
  }, [tasks]);

  return (
    <div className="emp-stats">
      {STAT_CONFIG.map(
        ({
          key,
          label,
          icon: Icon,
          colorClass,
          accentClass,
          suffix,
          sparkColor,
        }) => (
          <div key={key} className={`emp-stat-card ${accentClass}`}>
            <div className="emp-stat-card__info">
              <Typography variant="span" weight="bold" color="muted" className="emp-stat-card__label uppercase text-xs">{label}</Typography>
              <Typography variant="h2" className="emp-stat-card__value">
                {stats[key]}
                {suffix ?? ""}
              </Typography>
              <Sparkline points={sparklines[key]} color={sparkColor} />
            </div>
            <div className={`emp-stat-card__icon ${colorClass}`}>
              <Icon className="size-5" strokeWidth={1.75} />
            </div>
          </div>
        ),
      )}
    </div>
  );
}

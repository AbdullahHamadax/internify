"use client";

import { Clock, Users, CheckCircle2, BarChart3 } from "lucide-react";

export interface DashboardStats {
  activeTasks: number;
  totalSubmissions: number;
  completedTasks: number;
  avgQualityScore: number;
}

interface StatsCardsProps {
  stats: DashboardStats;
}

/* Mini SVG sparkline — provides visual movement without a charting library */
function Sparkline({ points, color }: { points: number[]; color: string }) {
  const width = 64;
  const height = 24;
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

const STAT_CONFIG = [
  {
    key: "activeTasks" as const,
    label: "Active Tasks",
    icon: Clock,
    colorClass: "emp-stat-card__icon--blue",
    accentClass: "emp-stat-card--blue",
    sparkColor: "hsl(221 83% 53%)",
    sparkData: [3, 5, 4, 7, 6, 8],
  },
  {
    key: "totalSubmissions" as const,
    label: "Total Submissions",
    icon: Users,
    colorClass: "emp-stat-card__icon--amber",
    accentClass: "emp-stat-card--amber",
    sparkColor: "hsl(38 92% 50%)",
    sparkData: [60, 75, 90, 85, 110, 124],
  },
  {
    key: "completedTasks" as const,
    label: "Completed Tasks",
    icon: CheckCircle2,
    colorClass: "emp-stat-card__icon--emerald",
    accentClass: "emp-stat-card--emerald",
    sparkColor: "hsl(160 84% 39%)",
    sparkData: [20, 28, 32, 35, 40, 45],
  },
  {
    key: "avgQualityScore" as const,
    label: "Avg Quality Score",
    icon: BarChart3,
    colorClass: "emp-stat-card__icon--violet",
    accentClass: "emp-stat-card--violet",
    suffix: "%",
    sparkColor: "hsl(263 70% 50%)",
    sparkData: [78, 82, 80, 85, 84, 87],
  },
];

export default function StatsCards({ stats }: StatsCardsProps) {
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
          sparkData,
        }) => (
          <div key={key} className={`emp-stat-card ${accentClass}`}>
            <div className="emp-stat-card__info">
              <div className="emp-stat-card__label">{label}</div>
              <div className="emp-stat-card__value">
                {stats[key]}
                {suffix ?? ""}
              </div>
              <Sparkline points={sparkData} color={sparkColor} />
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

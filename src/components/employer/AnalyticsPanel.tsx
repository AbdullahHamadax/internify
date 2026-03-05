"use client";

import { BarChart3 } from "lucide-react";

const METRICS = [
  {
    label: "Task Completion Rate",
    value: 84,
    barColor: "emp-metric__fill--red",
  },
  { label: "Avg Task Quality", value: 87, barColor: "emp-metric__fill--blue" },
  { label: "Response Rate", value: 92, barColor: "emp-metric__fill--violet" },
];

const TOP_STUDENTS = [
  {
    initials: "S",
    name: "Sarah Johnson",
    field: "Web Development",
    tasks: 15,
    avg: 94,
    color: "emp-student-avatar--purple",
  },
  {
    initials: "M",
    name: "Michael Chen",
    field: "Data Science",
    tasks: 12,
    avg: 91,
    color: "emp-student-avatar--indigo",
  },
  {
    initials: "E",
    name: "Emma Williams",
    field: "Design",
    tasks: 18,
    avg: 89,
    color: "emp-student-avatar--teal",
  },
];

export default function AnalyticsPanel() {
  return (
    <aside className="emp-analytics">
      <div className="emp-analytics-card">
        <div className="emp-analytics-card__title">
          <div className="emp-analytics-card__icon">
            <BarChart3 className="size-4" strokeWidth={2} />
          </div>
          Analytics
        </div>

        {METRICS.map((m) => (
          <div key={m.label} className="emp-metric">
            <div className="emp-metric__head">
              <span className="emp-metric__label">{m.label}</span>
              <span className="emp-metric__value">{m.value}%</span>
            </div>
            <div className="emp-metric__bar">
              <div
                className={`emp-metric__fill ${m.barColor}`}
                style={{ width: `${m.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="emp-analytics-card">
        <div className="emp-analytics-card__title">Top Performing Students</div>

        {TOP_STUDENTS.map((s) => (
          <div key={s.name} className="emp-student-row">
            <div className={`emp-student-avatar ${s.color}`}>{s.initials}</div>
            <div className="emp-student-info">
              <div className="emp-student-name">{s.name}</div>
              <div className="emp-student-field">{s.field}</div>
            </div>
            <div className="emp-student-score">
              {s.tasks} tasks · <strong>{s.avg}%</strong>
            </div>
          </div>
        ))}

        <div className="emp-find-more">
          <button type="button" className="emp-find-more__link">
            Find More Students
          </button>
        </div>
      </div>
    </aside>
  );
}

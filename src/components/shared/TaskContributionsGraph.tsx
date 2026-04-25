"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Typography } from "@/components/ui/Typography";

const WEEK_COUNT = 52;
const DAY_COUNT = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const ROW_LABEL_WIDTH = 28;
const LEGEND_CELL_SIZE = 12;
const MIN_WEEK_SPACING = 3;
const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const ROW_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""];
const LEGEND_CLASSES = [
  "bg-[#D1FAE5]",
  "bg-[#A7F3D0]",
  "bg-[#34D399]",
  "bg-[#10B981]",
];

type TooltipState = {
  text: string;
  left: number;
  top: number;
  placement: "top" | "bottom";
} | null;

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfWeekMonday(date: Date) {
  const next = startOfDay(date);
  const day = next.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + offset);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayDifference(start: Date, end: Date) {
  const startUtc = Date.UTC(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  );
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.floor((endUtc - startUtc) / MS_PER_DAY);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getContributionClass(count: number, isFuture: boolean) {
  if (isFuture) return "bg-transparent opacity-30";
  if (count >= 3) return "bg-[#10B981]";
  if (count === 2) return "bg-[#34D399]";
  if (count === 1) return "bg-[#A7F3D0]";
  return "bg-[#E5E7EB] dark:bg-[#374151]";
}

function formatTooltipText(date: Date, count: number) {
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (count === 0) {
    return `No tasks completed on ${formattedDate}`;
  }

  return `${count} task${count === 1 ? "" : "s"} completed on ${formattedDate}`;
}

export default function TaskContributionsGraph({
  studentId,
  className = "",
}: {
  studentId?: Id<"users"> | null;
  className?: string;
}) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const contributionData = useQuery(
    api.tasks.getStudentContributionDates,
    studentId ? { studentId } : "skip",
  );

  const today = useMemo(() => startOfDay(new Date()), []);
  const graph = useMemo(() => {
    const currentWeekStart = startOfWeekMonday(today);
    const graphStart = addDays(currentWeekStart, -(WEEK_COUNT - 1) * DAY_COUNT);
    const countsByCell = new Map<string, number>();

    for (const timestamp of contributionData?.completedTaskDates ?? []) {
      const completedDate = startOfDay(new Date(timestamp));
      const offset = dayDifference(graphStart, completedDate);

      if (
        offset < 0 ||
        offset >= WEEK_COUNT * DAY_COUNT ||
        completedDate.getTime() > today.getTime()
      ) {
        continue;
      }

      const weekIndex = Math.floor(offset / DAY_COUNT);
      const dayIndex = offset % DAY_COUNT;
      const key = `${weekIndex}-${dayIndex}`;
      countsByCell.set(key, (countsByCell.get(key) ?? 0) + 1);
    }

    const weeks = Array.from({ length: WEEK_COUNT }, (_, weekIndex) => {
      const weekStart = addDays(graphStart, weekIndex * DAY_COUNT);
      return {
        days: Array.from({ length: DAY_COUNT }, (_, dayIndex) => {
          const date = addDays(weekStart, dayIndex);
          return {
            date,
            key: dateKey(date),
            count: countsByCell.get(`${weekIndex}-${dayIndex}`) ?? 0,
            isFuture: date.getTime() > today.getTime(),
          };
        }),
      };
    });

    const rawMonthLabels = weeks
      .map((week, weekIndex) => {
        const firstDay = week.days[0].date;
        const previousWeek = weekIndex > 0 ? weeks[weekIndex - 1] : null;
        const isNewMonth =
          weekIndex === 0 ||
          firstDay.getMonth() !== previousWeek?.days[0].date.getMonth();

        return isNewMonth
          ? { label: MONTH_LABELS[firstDay.getMonth()], weekIndex }
          : null;
      })
      .filter(
        (item): item is { label: string; weekIndex: number } =>
          item !== null,
      );

    const monthLabels = rawMonthLabels.reduce<
      Array<{ label: string; weekIndex: number }>
    >((labels, label) => {
      const previous = labels.at(-1);

      if (
        previous &&
        label.weekIndex - previous.weekIndex < MIN_WEEK_SPACING
      ) {
        if (previous.weekIndex === 0) {
          labels[labels.length - 1] = label;
        }
        return labels;
      }

      labels.push(label);
      return labels;
    }, []);

    return { weeks, monthLabels };
  }, [contributionData?.completedTaskDates, today]);

  const isLoading = !studentId || contributionData === undefined;
  const total = contributionData?.total ?? 0;

  const showTooltip = (
    target: HTMLButtonElement,
    date: Date,
    count: number,
  ) => {
    const rect = target.getBoundingClientRect();
    const tooltipWidth = 240;
    const left = clamp(
      rect.left + rect.width / 2,
      tooltipWidth / 2 + 12,
      window.innerWidth - tooltipWidth / 2 - 12,
    );
    const showBelow = rect.top < 54;

    setTooltip({
      text: formatTooltipText(date, count),
      left,
      top: showBelow ? rect.bottom + 10 : rect.top - 10,
      placement: showBelow ? "bottom" : "top",
    });
  };

  return (
    <section
      className={`border-4 border-black bg-card p-5 shadow-[6px_6px_0_0_#000] dark:border-white dark:shadow-[6px_6px_0_0_#fff] ${className}`}
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Typography
            variant="span"
            className="block text-sm font-black uppercase tracking-widest text-muted-foreground"
          >
            Task Contributions
          </Typography>
          <Typography variant="h3" className="mt-1 uppercase">
            {isLoading
              ? "Loading task contributions..."
              : `${total} task${total === 1 ? "" : "s"} completed in the last year`}
          </Typography>
        </div>
      </div>

      <div className="pb-1">
        <div>
          {/* Month labels */}
          <div className="flex gap-2">
            <div style={{ width: ROW_LABEL_WIDTH, flexShrink: 0 }} />
            <div className="relative h-5 min-w-0 flex-1">
              {graph.monthLabels.map((month) => (
                <span
                  key={`${month.label}-${month.weekIndex}`}
                  className="absolute top-0 text-[10px] font-bold text-muted-foreground"
                  style={{ left: `${(month.weekIndex / WEEK_COUNT) * 100}%` }}
                >
                  {month.label}
                </span>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="flex gap-2">
            <div
              className="flex flex-col gap-[3px] pt-[3px] text-[10px] font-bold text-muted-foreground"
              style={{ width: ROW_LABEL_WIDTH, flexShrink: 0 }}
            >
              {ROW_LABELS.map((label, index) => (
                <div
                  key={`${label}-${index}`}
                  className="flex flex-1 items-center leading-none"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="flex min-w-0 flex-1 gap-[3px]">
              {graph.weeks.map((week, weekIndex) => (
                <div
                  key={`week-${weekIndex}`}
                  className="flex min-w-0 flex-1 flex-col gap-[3px]"
                >
                  {week.days.map((day) => (
                    <button
                      key={day.key}
                      type="button"
                      aria-label={formatTooltipText(day.date, day.count)}
                      onMouseEnter={(event) =>
                        showTooltip(event.currentTarget, day.date, day.count)
                      }
                      onMouseLeave={() => setTooltip(null)}
                      onFocus={(event) =>
                        showTooltip(event.currentTarget, day.date, day.count)
                      }
                      onBlur={() => setTooltip(null)}
                      className={`aspect-square w-full border border-black/10 transition-transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-[#047857] dark:border-white/10 ${getContributionClass(day.count, day.isFuture)}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-3 flex items-center justify-end gap-2 text-[11px] font-bold text-muted-foreground">
            <span>Less</span>
            {LEGEND_CLASSES.map((className) => (
              <span
                key={className}
                className={`border border-black/10 dark:border-white/10 ${className}`}
                style={{ width: LEGEND_CELL_SIZE, height: LEGEND_CELL_SIZE }}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>

      {typeof document !== "undefined" &&
        tooltip &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[9999] max-w-[240px] border-2 border-black bg-black px-3 py-2 text-center text-xs font-black uppercase tracking-wider text-white shadow-[3px_3px_0_0_#047857] dark:border-white"
            style={{
              left: tooltip.left,
              top: tooltip.top,
              transform:
                tooltip.placement === "top"
                  ? "translate(-50%, -100%)"
                  : "translate(-50%, 0)",
            }}
          >
            {tooltip.text}
          </div>,
          document.body,
        )}
    </section>
  );
}

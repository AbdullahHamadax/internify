import type { CSSProperties } from "react";

/**
 * Decorative, non-interactive backdrop of slowly-drifting brand shapes. Sits
 * behind a view's content (via the `.view-decor-host` stacking context) to give
 * otherwise-empty pages some life without becoming visual noise: a handful of
 * large, faint shapes parked around the edges, never in the reading area.
 */

type ShapeType = "square" | "diamond" | "circle" | "sparkle" | "plus" | "ring";

interface Shape {
  type: ShapeType;
  color: string;
  opacity: number;
  /** Position/size + animation vars (--r base rotation, --d duration, --delay). */
  style: CSSProperties;
}

const SPARKLE =
  "polygon(50% 0%, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0% 50%, 39% 39%)";
const PLUS =
  "polygon(36% 0, 64% 0, 64% 36%, 100% 36%, 100% 64%, 64% 64%, 64% 100%, 36% 100%, 36% 64%, 0 64%, 0 36%, 36% 36%)";

// Brand palette: blue (student), purple (employer), red, mint, amber.
// Parked in the extreme corners and bottom edge ONLY — never near the top
// (navbar) and never near the center (content panels). Shapes are large but
// very faint, acting as atmospheric texture rather than focal points.
const SHAPES: Shape[] = [
  // ── bottom-left corner ──
  {
    type: "square",
    color: "#2563EB",
    opacity: 0.12,
    style: cssVars({ bottom: "-28px", left: "-24px", width: 140, height: 140 }, "-12deg", "18s", "0s"),
  },
  // ── bottom-right corner ──
  {
    type: "ring",
    color: "#AB47BC",
    opacity: 0.1,
    style: cssVars({ bottom: "-20px", right: "-20px", width: 120, height: 120 }, "0deg", "16s", "0.8s"),
  },
  // ── small sparkle, bottom-left area ──
  {
    type: "sparkle",
    color: "#10B981",
    opacity: 0.15,
    style: cssVars({ bottom: "8%", left: "6%", width: 36, height: 36 }, "0deg", "12s", "1.5s"),
  },
  // ── small plus, bottom-right area ──
  {
    type: "plus",
    color: "#F59E0B",
    opacity: 0.14,
    style: cssVars({ bottom: "14%", right: "5%", width: 32, height: 32 }, "15deg", "14s", "0.4s"),
  },
  // ── faint diamond, far right edge, mid-low ──
  {
    type: "diamond",
    color: "#EA4335",
    opacity: 0.08,
    style: cssVars({ bottom: "30%", right: "-32px", width: 80, height: 80 }, "45deg", "20s", "1.2s"),
  },
  // ── faint sparkle, far left edge, mid-low ──
  {
    type: "sparkle",
    color: "#2563EB",
    opacity: 0.09,
    style: cssVars({ bottom: "35%", left: "-18px", width: 44, height: 44 }, "0deg", "15s", "2s"),
  },
];

function cssVars(
  base: CSSProperties,
  r: string,
  d: string,
  delay: string,
): CSSProperties {
  return {
    ...base,
    ["--r" as string]: r,
    ["--d" as string]: d,
    ["--delay" as string]: delay,
  };
}

export default function ViewBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-[1] overflow-hidden"
    >
      {SHAPES.map((s, i) => {
        const base: CSSProperties = {
          position: "absolute",
          opacity: s.opacity,
          animationName: "view-float",
          animationTimingFunction: "ease-in-out",
          animationIterationCount: "infinite",
          animationDuration: "var(--d, 13s)",
          animationDelay: "var(--delay, 0s)",
          ...s.style,
        };

        if (s.type === "sparkle" || s.type === "plus") {
          return (
            <span
              key={i}
              className="view-float-shape"
              style={{
                ...base,
                backgroundColor: s.color,
                clipPath: s.type === "sparkle" ? SPARKLE : PLUS,
              }}
            />
          );
        }

        return (
          <span
            key={i}
            className="view-float-shape"
            style={{
              ...base,
              border: `4px solid ${s.color}`,
              borderRadius:
                s.type === "circle" || s.type === "ring" ? "9999px" : 0,
              backgroundColor: "transparent",
            }}
          />
        );
      })}
    </div>
  );
}

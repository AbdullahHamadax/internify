"use client";

import { useMemo } from "react";

/* ═══════════════════════════════════════════════════════════
   FLOATING CELLS — ambient agar.io-style background blobs
   Blue = students · Purple = employers
   ═══════════════════════════════════════════════════════════ */

interface Cell {
  id: number;
  x: number;          // % from left
  y: number;          // % from top
  size: number;       // px
  color: string;
  opacity: number;
  duration: number;   // seconds
  delay: number;      // seconds
  driftX: number;     // px translate range
  driftY: number;     // px translate range
}

const BLUE = "#2563EB";
const PURPLE = "#9333EA";

function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function generateCells(count: number): Cell[] {
  const cells: Cell[] = [];

  for (let i = 0; i < count; i++) {
    const isBlue = i % 2 === 0;
    const r1 = seededRandom(i + 1);
    const r2 = seededRandom(i + 100);
    const r3 = seededRandom(i + 200);
    const r4 = seededRandom(i + 300);
    const r5 = seededRandom(i + 400);

    cells.push({
      id: i,
      x: r1 * 90 + 5,                     // 5–95%
      y: r2 * 85 + 5,                     // 5–90%
      size: 40 + r3 * 100,                // 40–140px
      color: isBlue ? BLUE : PURPLE,
      opacity: 0.08 + r4 * 0.14,          // 8–22%
      duration: 20 + r5 * 18,             // 20–38s
      delay: -(r1 * 20),                  // negative for instant start variety
      driftX: 30 + r3 * 50,               // 30–80px
      driftY: 20 + r4 * 40,               // 20–60px
    });
  }

  return cells;
}

export default function FloatingCells() {
  const cells = useMemo(() => generateCells(14), []);

  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {cells.map((cell) => (
        <div
          key={cell.id}
          className="absolute rounded-full cell-drift"
          style={{
            left: `${cell.x}%`,
            top: `${cell.y}%`,
            width: cell.size,
            height: cell.size,
            backgroundColor: cell.color,
            opacity: cell.opacity,
            filter: `blur(${cell.size * 0.25}px)`,
            animationDuration: `${cell.duration}s`,
            animationDelay: `${cell.delay}s`,
            // @ts-expect-error CSS custom properties for drift range
            "--drift-x": `${cell.driftX}px`,
            "--drift-y": `${cell.driftY}px`,
          }}
        />
      ))}
    </div>
  );
}

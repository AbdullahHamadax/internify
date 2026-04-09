"use client";

export type FloatingShape = {
  id: string;
  x: string;
  y: string;
  size: number;
  color: string;
  shape: "sparkle" | "burst" | "diamond";
  opacity?: number;
  duration?: number;
  delay?: number;
  driftX?: number;
  driftY?: number;
  rotate?: number;
};

const shapePoints: Record<FloatingShape["shape"], string> = {
  sparkle:
    "50,2 61,35 98,50 61,65 50,98 39,65 2,50 39,35",
  burst:
    "50,3 59,24 81,10 76,32 97,41 76,50 90,72 68,67 59,97 50,76 41,97 32,67 10,72 24,50 3,41 24,32 10,10 41,24",
  diamond: "50,4 95,50 50,96 5,50",
};

export default function FloatingCells({
  shapes,
  className = "",
}: {
  shapes: FloatingShape[];
  className?: string;
}) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`.trim()}
      aria-hidden="true"
    >
      {shapes.map((shape) => (
        <div
          key={shape.id}
          className="about-shape-float absolute"
          style={
            {
              left: shape.x,
              top: shape.y,
              width: `${shape.size}px`,
              height: `${shape.size}px`,
              opacity: shape.opacity ?? 0.95,
              animationDuration: `${shape.duration ?? 18}s`,
              animationDelay: `${shape.delay ?? 0}s`,
              "--drift-x": `${shape.driftX ?? 24}px`,
              "--drift-y": `${shape.driftY ?? 20}px`,
            } as React.CSSProperties
          }
        >
          <svg
            viewBox="0 0 100 100"
            className="about-shape-spin h-full w-full overflow-visible"
            style={
              {
                animationDuration: `${(shape.duration ?? 18) * 1.35}s`,
                animationDelay: `${shape.delay ?? 0}s`,
                "--base-rotate": `${shape.rotate ?? 0}deg`,
              } as React.CSSProperties
            }
          >
            <polygon
              points={shapePoints[shape.shape]}
              fill={shape.color}
              stroke="#0B0B0B"
              strokeWidth="6"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ))}
    </div>
  );
}

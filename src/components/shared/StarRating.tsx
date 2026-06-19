"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  /** Current value, 0–5 (supports halves for display). */
  value: number;
  /** When provided, the stars become interactive (1–5). */
  onChange?: (value: number) => void;
  /** Pixel size of each star. */
  size?: number;
  className?: string;
  disabled?: boolean;
}

/**
 * Star rating widget. Read-only when `onChange` is omitted (supports fractional
 * fill for averages); interactive 1–5 selector when `onChange` is provided.
 */
export default function StarRating({
  value,
  onChange,
  size = 18,
  className = "",
  disabled = false,
}: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);
  const interactive = !!onChange && !disabled;
  const shown = hover ?? value;

  return (
    <div className={`inline-flex items-center gap-0.5 ${className}`.trim()}>
      {[1, 2, 3, 4, 5].map((star) => {
        // Fractional fill for read-only averages (e.g. 4.3 → star 5 is 30% full).
        const fill = Math.max(0, Math.min(1, shown - (star - 1)));
        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => interactive && setHover(star)}
            onMouseLeave={() => interactive && setHover(null)}
            className={interactive ? "cursor-pointer transition-transform hover:scale-110" : "cursor-default"}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
          >
            <span
              className="relative inline-block"
              style={{ width: size, height: size }}
            >
              <Star
                className="absolute inset-0 text-amber-400"
                style={{ width: size, height: size }}
                strokeWidth={2}
              />
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star
                  className="text-amber-400 fill-amber-400"
                  style={{ width: size, height: size }}
                  strokeWidth={2}
                />
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

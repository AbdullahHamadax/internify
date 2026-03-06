// components/ui/password-requirements.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// ── Rule definitions ────────────────────────────────────────

interface Rule {
  key: string;
  label: string;
  test: (pw: string) => boolean;
}

const PASSWORD_RULES: Rule[] = [
  {
    key: "length",
    label: "At least 8 characters",
    test: (pw) => pw.length >= 8,
  },
  {
    key: "upper",
    label: "One uppercase letter",
    test: (pw) => /[A-Z]/.test(pw),
  },
  {
    key: "lower",
    label: "One lowercase letter",
    test: (pw) => /[a-z]/.test(pw),
  },
  { key: "number", label: "One number", test: (pw) => /[0-9]/.test(pw) },
  {
    key: "special",
    label: "One special character",
    test: (pw) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pw),
  },
];

// ── Icon components ─────────────────────────────────────────

/** Animated SVG checkmark — draws on via stroke-dashoffset transition */
function CheckIcon({ animate }: { animate: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className="h-3.5 w-3.5 shrink-0"
      aria-hidden
    >
      <path
        d="M3 8.5 L6.5 12 L13 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animate ? "animate-checkmark-draw" : ""}
        style={
          animate ? undefined : { strokeDasharray: 20, strokeDashoffset: 0 }
        }
      />
    </svg>
  );
}

/** Static ✕ icon */
function CrossIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className="h-3.5 w-3.5 shrink-0"
      aria-hidden
    >
      <path
        d="M4 4 L12 12 M12 4 L4 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Static dash / minus icon for idle state */
function DashIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className="h-3.5 w-3.5 shrink-0"
      aria-hidden
    >
      <path
        d="M4 8 H12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Requirement row ─────────────────────────────────────────

type RuleState = "idle" | "failing" | "passing";

function RequirementRow({
  label,
  state,
  shouldAnimate,
}: {
  label: string;
  state: RuleState;
  shouldAnimate: boolean;
}) {
  const colorClass =
    state === "passing"
      ? "text-emerald-600 dark:text-emerald-400"
      : state === "failing"
        ? "text-red-500 dark:text-red-400"
        : "text-muted-foreground";

  return (
    <li
      className={`flex items-center gap-2 text-xs transition-colors duration-300 ${colorClass}`}
    >
      <span className="transition-transform duration-300">
        {state === "passing" ? (
          <CheckIcon animate={shouldAnimate} />
        ) : state === "failing" ? (
          <CrossIcon />
        ) : (
          <DashIcon />
        )}
      </span>
      <span>{label}</span>
    </li>
  );
}

// ── Main component ──────────────────────────────────────────

interface PasswordRequirementsProps {
  password: string;
  isFocused: boolean;
}

export function PasswordRequirements({
  password,
  isFocused,
}: PasswordRequirementsProps) {
  // Track which rules just switched to passing so we can play the animation
  const prevResultsRef = useRef<Record<string, boolean>>({});
  const [justPassed, setJustPassed] = useState<Set<string>>(new Set());

  const results = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const rule of PASSWORD_RULES) {
      map[rule.key] = rule.test(password);
    }
    return map;
  }, [password]);

  const allPassing = useMemo(
    () => PASSWORD_RULES.every((r) => results[r.key]),
    [results],
  );

  const hasTyped = password.length > 0;

  // Detect newly-passing rules
  useEffect(() => {
    const newlyPassed = new Set<string>();
    for (const rule of PASSWORD_RULES) {
      const wasPassing = prevResultsRef.current[rule.key];
      const isPassing = results[rule.key];
      if (isPassing && !wasPassing) {
        newlyPassed.add(rule.key);
      }
    }

    if (newlyPassed.size > 0) {
      setJustPassed(newlyPassed);
      // Clear after animation completes
      const timer = setTimeout(() => setJustPassed(new Set()), 400);
      prevResultsRef.current = { ...results };
      return () => clearTimeout(timer);
    }

    prevResultsRef.current = { ...results };
  }, [results]);

  // Visibility: show when focused, OR when blurred but not all rules pass
  const isVisible = isFocused || (hasTyped && !allPassing);

  return (
    <div
      className={`overflow-hidden transition-all duration-300 ease-out ${
        isVisible
          ? "max-h-40 opacity-100 translate-y-0 mt-2"
          : "max-h-0 opacity-0 -translate-y-1 mt-0"
      }`}
      aria-live="polite"
    >
      <ul className="space-y-1.5 py-1">
        {PASSWORD_RULES.map((rule) => {
          const passing = results[rule.key];
          const state: RuleState = !hasTyped
            ? "idle"
            : passing
              ? "passing"
              : "failing";

          return (
            <RequirementRow
              key={rule.key}
              label={rule.label}
              state={state}
              shouldAnimate={justPassed.has(rule.key)}
            />
          );
        })}
      </ul>
    </div>
  );
}

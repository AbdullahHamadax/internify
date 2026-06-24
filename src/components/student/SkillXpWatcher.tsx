"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useConvexTokenReady } from "@/lib/convexAuth";
import { awardXp } from "@/lib/xp";

/**
 * Watches the signed-in student's per-skill XP (a reactive Convex query) and
 * fires the XP toast whenever a skill's XP goes up — which happens server-side
 * in `evaluations.ts` on task completion. This decouples the celebration from
 * *who* triggered completion: whenever the student's `skillXp` increases while
 * they're in the app, the bar plays for the gained skill(s).
 *
 * Renders nothing. Mount once inside the student dashboard.
 */
export default function SkillXpWatcher() {
  const tokenReady = useConvexTokenReady();
  const skillXp = useQuery(
    api.users.getStudentSkillXp,
    tokenReady ? {} : "skip",
  );
  // null until the first snapshot arrives; prevents firing for pre-existing XP.
  const prevRef = useRef<Map<string, number> | null>(null);

  useEffect(() => {
    if (!skillXp) return;

    const next = new Map(skillXp.map((entry) => [entry.skill, entry.xp]));
    const prev = prevRef.current;
    prevRef.current = next;

    // First load: record the baseline, don't celebrate existing XP.
    if (!prev) return;

    for (const [skill, xp] of next) {
      const before = prev.get(skill) ?? 0;
      if (xp > before) {
        awardXp({ skill, amount: xp - before, currentXp: before });
      }
    }
  }, [skillXp]);

  return null;
}

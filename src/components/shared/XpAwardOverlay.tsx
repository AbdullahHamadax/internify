"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Sparkles, ChevronsUp, Award } from "lucide-react";
import CountUp from "@/components/CountUp";
import { SkillIcon } from "@/lib/skillIcon";
import {
  awardXp,
  awardCertificate,
  onReward,
  type RewardEvent,
} from "@/lib/xp";

/** XP / reward gold — the documented `selective-amber` token. */
const XP_GOLD = "#FCD34D";
const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Floating reward toast (Skyrim-style). Mounted once near the app root; listens
 * on the reward bus, queues events, and plays one at a time:
 *  - XP:          slides up, fills the skill's tier bar, flashes on level-up.
 *  - Certificate: a one-shot milestone flash with the task title.
 * Then it fades.
 *
 * Test without any task — open the console and run `awardXp(150)` or
 * `awardCertificate("Build a REST API")`.
 */
export default function XpAwardOverlay() {
  const [queue, setQueue] = useState<RewardEvent[]>([]);
  const [current, setCurrent] = useState<RewardEvent | null>(null);
  const reduce = useReducedMotion();

  // Subscribe once; the updater form avoids stale-closure bugs.
  useEffect(() => onReward((event) => setQueue((q) => [...q, event])), []);

  // Pump the queue: show the next reward when nothing is on screen.
  useEffect(() => {
    if (current || queue.length === 0) return;
    setCurrent(queue[0]);
    setQueue((q) => q.slice(1));
  }, [current, queue]);

  // Auto-dismiss after the content has played.
  useEffect(() => {
    if (!current) return;
    const hold =
      current.kind === "certificate" ? 3600 : current.leveledUp ? 3400 : 2900;
    const timer = setTimeout(() => setCurrent(null), reduce ? 2200 : hold);
    return () => clearTimeout(timer);
  }, [current, reduce]);

  // Dev-only console triggers so you can test without earning anything.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const w = window as unknown as {
      awardXp?: typeof awardXp;
      awardCertificate?: typeof awardCertificate;
    };
    w.awardXp = awardXp;
    w.awardCertificate = awardCertificate;
    return () => {
      delete w.awardXp;
      delete w.awardCertificate;
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[200] flex justify-center px-4">
      <AnimatePresence mode="wait">
        {current && (
          <motion.div
            key={current.id}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: reduce ? 0.15 : 0.42, ease: EASE }}
            className="w-full max-w-sm border-2 border-black bg-card px-5 py-4 shadow-[6px_6px_0_0_#000] dark:border-white dark:shadow-[6px_6px_0_0_#fff]"
          >
            {current.kind === "xp" ? (
              <>
                {/* Header: gain + level */}
                <div className="flex items-end justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles
                      className="size-5 shrink-0"
                      style={{ color: XP_GOLD }}
                    />
                    <span
                      className="text-2xl font-black leading-none tracking-tight text-foreground"
                      style={{ fontFamily: "var(--font-sora)" }}
                    >
                      +
                      <CountUp to={current.amount} duration={reduce ? 0 : 0.9} />{" "}
                      XP
                    </span>
                  </div>

                  {current.leveledUp ? (
                    <span
                      className="inline-flex items-center gap-1 border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-black dark:border-white"
                      style={{ background: XP_GOLD }}
                    >
                      <ChevronsUp className="size-3" />
                      Level Up
                    </span>
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {current.level}
                    </span>
                  )}
                </div>

                {/* Skill name */}
                <div className="mt-2 flex items-center gap-1.5">
                  <SkillIcon
                    skill={current.skill}
                    className="shrink-0 text-base"
                  />
                  <span className="truncate text-[11px] font-black uppercase tracking-widest text-foreground">
                    {current.skill}
                  </span>
                </div>

                {/* Tier bar */}
                <div className="mt-2 h-3 w-full overflow-hidden border-2 border-black bg-muted dark:border-white">
                  <motion.div
                    className="h-full w-full origin-left"
                    style={{ background: XP_GOLD }}
                    initial={{ scaleX: current.fromPct }}
                    animate={{ scaleX: current.toPct }}
                    transition={{
                      delay: reduce ? 0 : 0.25,
                      duration: reduce ? 0 : 0.9,
                      ease: EASE,
                    }}
                  />
                </div>

                {/* Sub-label */}
                <p className="mt-2 text-[11px] font-bold text-muted-foreground">
                  {current.leveledUp
                    ? `Now ${current.level}`
                    : current.nextLabel}
                </p>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <span
                  className="flex size-10 shrink-0 items-center justify-center border-2 border-black dark:border-white"
                  style={{ background: XP_GOLD }}
                >
                  <Award className="size-6 text-black" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Certificate Earned
                  </p>
                  <p
                    className="truncate text-lg font-black leading-tight tracking-tight text-foreground"
                    style={{ fontFamily: "var(--font-sora)" }}
                    title={current.title}
                  >
                    {current.title}
                  </p>
                </div>
                {current.certificateId && (
                  <Link
                    href={`/verify/${current.certificateId}`}
                    onClick={() => setCurrent(null)}
                    className="pointer-events-auto shrink-0 border-2 border-black bg-foreground px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-background shadow-[2px_2px_0_0_#000] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none dark:border-white dark:shadow-[2px_2px_0_0_#fff]"
                  >
                    View
                  </Link>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

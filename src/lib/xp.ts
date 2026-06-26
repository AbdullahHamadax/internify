/**
 * Skill-XP award event bus + tier math.
 *
 * Internify already tracks per-skill XP on the student profile
 * (`studentProfiles.skillXp: [{ skill, xp }]`, 0–2000). The tier thresholds
 * here mirror StudentProfile's `getSkillLevel` / `getSkillProgress` exactly so
 * the floating XP toast and the profile cards never disagree:
 *
 *   Beginner      0 – 999    (fills toward 1000)
 *   Intermediate  1000 – 1499 (fills toward 1500)
 *   Advanced      1500 – 2000 (fills toward the 2000 cap)
 *
 * Anywhere in the app can call `awardXp(...)` and the <XpAwardOverlay /> mounted
 * near the root plays a Skyrim-style "+N XP · <skill>" bar that fills that
 * skill's current tier, flashes on a level-up, then fades. Wire it to the real
 * thing later by calling `awardXp({ skill, amount, currentXp })` after the
 * task-completion mutation resolves.
 */

export type SkillLevel = "Beginner" | "Intermediate" | "Advanced";

export const XP_MAX = 2000;

export function getSkillLevel(xp: number): SkillLevel {
  if (xp >= 1500) return "Advanced";
  if (xp >= 1000) return "Intermediate";
  return "Beginner";
}

type SkillTier = {
  /** Progress within the current tier, 0..1. */
  pct: number;
  xpToNext: number;
  nextLevel: SkillLevel | "Max" | null;
};

export function getSkillTier(xp: number): SkillTier {
  if (xp >= 1500) {
    return {
      pct: Math.min((xp - 1500) / 500, 1),
      xpToNext: Math.max(2000 - xp, 0),
      nextLevel: xp >= 2000 ? null : "Max",
    };
  }
  if (xp >= 1000) {
    return { pct: (xp - 1000) / 500, xpToNext: 1500 - xp, nextLevel: "Advanced" };
  }
  return { pct: xp / 1000, xpToNext: 1000 - xp, nextLevel: "Intermediate" };
}

export type XpReward = {
  kind: "xp";
  /** Unique per award, so the overlay re-animates on repeat triggers. */
  id: number;
  skill: string;
  amount: number;
  level: SkillLevel;
  /** Tier fill before / after, 0..1 (snaps to 1 on a level-up). */
  fromPct: number;
  toPct: number;
  leveledUp: boolean;
  /** e.g. "850 XP to Advanced" / "Max XP reached". */
  nextLabel: string;
};

export type CertificateReward = {
  kind: "certificate";
  id: number;
  title: string;
  /** Public verification id, used to build the `/verify/<id>` View link. */
  certificateId?: string;
};

export type RewardEvent = XpReward | CertificateReward;

export type AwardInput =
  | number
  | { amount: number; skill?: string; currentXp?: number };

type Listener = (event: RewardEvent) => void;

const listeners = new Set<Listener>();
/** Per-skill running total for demo/test mode (when no `currentXp` is given). */
const demoXp = new Map<string, number>();
let counter = 0;

const clamp = (n: number) => Math.max(0, Math.min(XP_MAX, n));

/**
 * Fire a skill-XP award.
 * - `awardXp(150)` → quick test against a running demo total.
 * - `awardXp({ skill: "React", amount: 175, currentXp: 920 })` → real award:
 *   pass the skill's XP *before* the gain so the bar fills from the right spot.
 */
export function awardXp(input: AwardInput): void {
  const amount = typeof input === "number" ? input : input.amount;
  if (!amount || amount <= 0) return;

  const skill = (typeof input === "object" && input.skill) || "Demo Skill";
  const isRealAward =
    typeof input === "object" && typeof input.currentXp === "number";

  const before = clamp(isRealAward ? (input.currentXp as number) : demoXp.get(skill) ?? 0);
  const after = clamp(before + amount);
  if (!isRealAward) demoXp.set(skill, after);

  const leveledUp = getSkillLevel(after) !== getSkillLevel(before);
  const beforeTier = getSkillTier(before);
  const afterTier = getSkillTier(after);

  const nextLabel =
    after >= XP_MAX
      ? "Max XP reached"
      : afterTier.nextLevel === "Max"
        ? `${afterTier.xpToNext.toLocaleString()} XP to max`
        : `${afterTier.xpToNext.toLocaleString()} XP to ${afterTier.nextLevel}`;

  const event: XpReward = {
    kind: "xp",
    id: ++counter,
    skill,
    amount: after - before, // actual XP gained after the 2000 cap
    level: getSkillLevel(after),
    fromPct: beforeTier.pct,
    toPct: leveledUp ? 1 : afterTier.pct,
    leveledUp,
    nextLabel,
  };

  listeners.forEach((listener) => listener(event));
}

/** Fire a certificate-earned celebration. Pass the task title (or an object). */
export function awardCertificate(
  input: string | { title: string; certificateId?: string },
): void {
  const title = (typeof input === "string" ? input : input.title)?.trim();
  if (!title) return;
  const event: CertificateReward = {
    kind: "certificate",
    id: ++counter,
    title,
    certificateId: typeof input === "object" ? input.certificateId : undefined,
  };
  listeners.forEach((listener) => listener(event));
}

/** Subscribe to reward events (XP or certificate); returns an unsubscribe fn. */
export function onReward(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

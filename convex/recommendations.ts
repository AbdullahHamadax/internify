import { query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { skillMatchKey } from "./recommendationHelpers";

/* ─────────────────────────────────────────────────────────────
   INTERNIFY — INTELLIGENT TASK RECOMMENDATION ENGINE v2
   
   Deep-search algorithm that matches students to tasks based on:
   1. Per-skill level eligibility (beginner→beginner, intermediate→beg+int, advanced→all)
   2. Weighted skill overlap scoring
   3. Level-fit bonus (sweet-spot matching)
   4. Category affinity from completed work
   5. Freshness boost for newer tasks
   6. Demand penalty for near-full tasks
   7. Multi-skill synergy bonus
   ───────────────────────────────────────────────────────────── */

/* ─── XP → Skill-Level Mapping ─── */
type SkillLevel = "beginner" | "intermediate" | "advanced";

const LEVEL_ORDER: Record<SkillLevel, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

/**
 * XP thresholds for skill levels.
 * 0–499     → beginner
 * 500–1199  → intermediate
 * 1200+     → advanced
 */
function xpToLevel(xp: number): SkillLevel {
  if (xp >= 1200) return "advanced";
  if (xp >= 500) return "intermediate";
  return "beginner";
}

/**
 * Level eligibility gate — the core rule:
 * - Beginner student   → beginner tasks only
 * - Intermediate student → beginner + intermediate
 * - Advanced student     → beginner + intermediate + advanced
 */
function isLevelEligible(
  studentLevel: SkillLevel,
  taskLevel: SkillLevel,
): boolean {
  return LEVEL_ORDER[studentLevel] >= LEVEL_ORDER[taskLevel];
}

/**
 * Level-fit score: how well the student's level matches the task.
 * Perfect match → 100, one level above → 70, two levels above → 40.
 * These are later normalized as part of the weighted scoring.
 */
function levelFitRaw(
  studentLevel: SkillLevel,
  taskLevel: SkillLevel,
): number {
  const diff = LEVEL_ORDER[studentLevel] - LEVEL_ORDER[taskLevel];
  if (diff === 0) return 100; // sweet-spot
  if (diff === 1) return 70;  // slightly above
  return 40;                   // way above
}

/* ─── Scoring Weights ─── */
const WEIGHTS = {
  skillOverlap: 0.35,     // How many required skills does the student have?
  levelFit: 0.25,         // How well does the student's level match the task?
  eligibility: 0.15,      // Are all matched skills level-eligible?
  categoryAffinity: 0.10, // Has the student completed work in this category?
  freshness: 0.08,        // How recently was the task posted?
  demand: 0.04,           // How many spots are still available?
  synergy: 0.03,          // Bonus for matching multiple skills
} as const;

/* ─── Types ─── */

export interface ScoredTask {
  taskId: string;
  title: string;
  description: string;
  category: string;
  skillLevel: SkillLevel;
  skills: string[];
  deadline: number;
  maxApplicants?: number;
  applicantCount?: number;
  createdAt: number;
  companyName: string;
  employerId: string;
  matchScore: number;
  matchedSkills: string[];
  unmatchedSkills: string[];
  skillLevelDetails: {
    skill: string;
    studentLevel: SkillLevel;
    taskLevel: SkillLevel;
    eligible: boolean;
    fitScore: number;
  }[];
  matchReason: string;
  matchTier: "perfect" | "strong" | "good" | "possible";
}

/* ─── Deep Scoring Engine ─── */

function scoreTask(
  task: Doc<"tasks"> & { companyName: string },
  studentSkillMap: Map<string, { xp: number; level: SkillLevel }>,
  completedCategoryCounts: Map<string, number>,
  now: number,
): ScoredTask | null {
  const taskLevel = task.skillLevel as SkillLevel;
  const matchedSkills: string[] = [];
  const unmatchedSkills: string[] = [];
  const skillLevelDetails: ScoredTask["skillLevelDetails"] = [];

  let eligibleCount = 0;
  let levelFitTotal = 0;

  // ─── Phase 1: Per-Skill Analysis ───
  for (const reqSkill of task.skills) {
    const norm = skillMatchKey(reqSkill);
    const studentData = studentSkillMap.get(norm);

    if (studentData) {
      matchedSkills.push(reqSkill);
      const eligible = isLevelEligible(studentData.level, taskLevel);
      const fit = levelFitRaw(studentData.level, taskLevel);

      skillLevelDetails.push({
        skill: reqSkill,
        studentLevel: studentData.level,
        taskLevel,
        eligible,
        fitScore: fit,
      });

      if (eligible) {
        eligibleCount += 1;
        levelFitTotal += fit;
      }
    } else {
      unmatchedSkills.push(reqSkill);
    }
  }

  // ─── Gate: Must have at least one matching & eligible skill ───
  if (matchedSkills.length === 0) return null;
  if (eligibleCount === 0) return null;

  // ─── Phase 2: Compute Sub-Scores (0–100 each) ───

  // 1. Skill overlap ratio
  const overlapScore = (matchedSkills.length / task.skills.length) * 100;

  // 2. Average level fit across eligible skills
  const avgLevelFit = eligibleCount > 0
    ? levelFitTotal / eligibleCount
    : 0;

  // 3. Eligibility ratio (what fraction of matched skills are level-eligible?)
  const eligibilityScore = matchedSkills.length > 0
    ? (eligibleCount / matchedSkills.length) * 100
    : 0;

  // 4. Category affinity
  const categoryKey = task.category.toLowerCase().trim();
  const catCount = completedCategoryCounts.get(categoryKey) ?? 0;
  const categoryScore = Math.min(catCount * 25, 100); // 4 completed → max

  // 5. Freshness: tasks posted in last 7 days get full score, decays over 30 days
  const ageMs = now - task.createdAt;
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  const freshnessScore = ageDays <= 7
    ? 100
    : ageDays <= 30
      ? 100 - ((ageDays - 7) / 23) * 80
      : 20;

  // 6. Demand: penalize nearly-full tasks
  let demandScore = 100;
  if (task.maxApplicants && task.maxApplicants > 0) {
    const fillRatio = (task.applicantCount ?? 0) / task.maxApplicants;
    demandScore = Math.max(0, (1 - fillRatio) * 100);
  }

  // 7. Synergy bonus: matching multiple skills is disproportionately better
  const synergyScore = matchedSkills.length >= 3
    ? 100
    : matchedSkills.length === 2
      ? 65
      : 30;

  // ─── Phase 3: Weighted Composite Score ───
  const rawScore =
    overlapScore * WEIGHTS.skillOverlap +
    avgLevelFit * WEIGHTS.levelFit +
    eligibilityScore * WEIGHTS.eligibility +
    categoryScore * WEIGHTS.categoryAffinity +
    freshnessScore * WEIGHTS.freshness +
    demandScore * WEIGHTS.demand +
    synergyScore * WEIGHTS.synergy;

  const matchScore = Math.min(Math.round(rawScore), 100);

  // ─── Phase 4: Determine Match Tier ───
  const matchTier: ScoredTask["matchTier"] =
    matchScore >= 85 ? "perfect" :
    matchScore >= 65 ? "strong" :
    matchScore >= 45 ? "good" :
    "possible";

  // ─── Phase 5: Human-Readable Reason ───
  const reasons: string[] = [];

  if (matchedSkills.length === task.skills.length) {
    reasons.push("Full skill match");
  } else {
    reasons.push(
      `${matchedSkills.length}/${task.skills.length} skills match`,
    );
  }

  if (eligibleCount === matchedSkills.length && matchedSkills.length > 0) {
    reasons.push("Level-appropriate");
  } else if (eligibleCount > 0) {
    reasons.push(`${eligibleCount} skill${eligibleCount > 1 ? "s" : ""} at your level`);
  }

  if (catCount > 0) {
    reasons.push(
      `${catCount} similar task${catCount > 1 ? "s" : ""} completed`,
    );
  }

  if (ageDays <= 3) {
    reasons.push("Just posted");
  }

  return {
    taskId: task._id,
    title: task.title,
    description: task.description,
    category: task.category,
    skillLevel: taskLevel,
    skills: task.skills,
    deadline: task.deadline,
    maxApplicants: task.maxApplicants,
    applicantCount: task.applicantCount,
    createdAt: task.createdAt,
    companyName: task.companyName,
    employerId: task.employerId,
    matchScore,
    matchedSkills,
    unmatchedSkills,
    skillLevelDetails,
    matchReason: reasons.join(" · "),
    matchTier,
  };
}

/* ─── Main Query ─── */

/**
 * getRecommendedTasks
 *
 * Deep-search recommendation engine for the current student.
 * - Per-skill XP-derived level matching
 * - Multi-factor weighted scoring (overlap, level-fit, category, freshness, demand, synergy)
 * - Strict level eligibility gates
 * - Excludes tasks the student already applied to
 * - Excludes expired and full tasks
 * - Returns top 30 ranked recommendations with full match metadata
 */
export const getRecommendedTasks = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user || user.role !== "student") return [];

    // 1. Get the student profile with skills and XP
    const profile = await ctx.db
      .query("studentProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!profile) return [];

    const skills = profile.skills ?? [];
    if (skills.length === 0) return [];

    // Build a normalized-skill → { xp, level } map
    const skillXpEntries = profile.skillXp ?? [];
    const studentSkillMap = new Map<
      string,
      { xp: number; level: SkillLevel }
    >();

    for (const skill of skills) {
      const norm = skillMatchKey(skill);
      const xpEntry = skillXpEntries.find(
        (e) => skillMatchKey(e.skill) === norm,
      );
      const xp = xpEntry?.xp ?? 0;
      studentSkillMap.set(norm, { xp, level: xpToLevel(xp) });
    }

    // 2. Get tasks the student already applied to (to exclude)
    const applications = await ctx.db
      .query("applications")
      .withIndex("by_studentId", (q) => q.eq("studentId", user._id))
      .collect();

    const appliedTaskIds = new Set(
      applications.map((a) => a.taskId.toString()),
    );

    // Build category affinity from completed tasks
    const completedCategoryCounts = new Map<string, number>();
    for (const app of applications) {
      if (app.status !== "completed") continue;
      const task = await ctx.db.get(app.taskId);
      if (!task) continue;
      const catKey = task.category.toLowerCase().trim();
      completedCategoryCounts.set(
        catKey,
        (completedCategoryCounts.get(catKey) ?? 0) + 1,
      );
    }

    // 3. Get all pending tasks
    const allPendingTasks = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const now = Date.now();

    // 4. Score each eligible task with the deep-search engine
    const scored: ScoredTask[] = [];

    for (const task of allPendingTasks) {
      // Skip expired tasks
      if (task.deadline <= now) continue;

      // Skip full tasks
      if (
        task.maxApplicants &&
        (task.applicantCount ?? 0) >= task.maxApplicants
      ) continue;

      // Skip already applied
      if (appliedTaskIds.has(task._id.toString())) continue;

      // Resolve employer company name
      const employerProfile = await ctx.db
        .query("employerProfiles")
        .withIndex("by_userId", (q) => q.eq("userId", task.employerId))
        .unique();

      const taskWithCompany = {
        ...task,
        companyName: employerProfile?.companyName ?? "Unknown Company",
      };

      const result = scoreTask(
        taskWithCompany,
        studentSkillMap,
        completedCategoryCounts,
        now,
      );

      if (result && result.matchScore >= 15) {
        scored.push(result);
      }
    }

    // 5. Sort by match score descending, then by newest first
    scored.sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      return b.createdAt - a.createdAt;
    });

    // Return top 30 recommendations
    return scored.slice(0, 30);
  },
});

/**
 * getStudentSkillLevels
 *
 * Returns the current student's skills with their XP and derived levels.
 * Used by the frontend to show the student's skill radar.
 */
export const getStudentSkillLevels = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user || user.role !== "student") return [];

    const profile = await ctx.db
      .query("studentProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!profile) return [];

    const skills = profile.skills ?? [];
    const skillXpEntries = profile.skillXp ?? [];

    return skills.map((skill) => {
      const norm = skillMatchKey(skill);
      const xpEntry = skillXpEntries.find(
        (e) => skillMatchKey(e.skill) === norm,
      );
      const xp = xpEntry?.xp ?? 0;
      return {
        skill,
        xp,
        level: xpToLevel(xp),
        maxXp: 2000,
      };
    });
  },
});

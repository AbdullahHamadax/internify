import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/** Minimum score required to pass and complete a task */
const PASSING_SCORE_THRESHOLD = 60;

/**
 * Store a new AI evaluation result for a submission.
 * Called from the client after the API route returns evaluation data.
 *
 * Score-gating logic:
 * - Score ≥ 60%: marks application + task as "completed", awards XP
 * - Score < 60%: keeps application as "in_progress", student can retry
 */
export const storeEvaluation = mutation({
  args: {
    submissionId: v.id("submissions"),
    applicationId: v.id("applications"),
    taskId: v.id("tasks"),
    agentType: v.string(),
    overallScore: v.number(),
    verdict: v.string(),
    scores: v.array(
      v.object({
        dimension: v.string(),
        score: v.number(),
        comment: v.string(),
      }),
    ),
    strengths: v.array(v.string()),
    improvements: v.array(v.string()),
    summary: v.string(),
    rawResponse: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user || user.role !== "student") {
      throw new Error("Unauthorized: Only students can store evaluations");
    }

    // Verify submission belongs to this student
    const submission = await ctx.db.get(args.submissionId);
    if (!submission || submission.studentId !== user._id) {
      throw new Error("Submission not found or unauthorized");
    }

    // If an old evaluation already exists for this submission, delete it
    // (this can happen in edge cases with rapid resubmission)
    const existing = await ctx.db
      .query("evaluations")
      .withIndex("by_submissionId", (q) =>
        q.eq("submissionId", args.submissionId),
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    }

    // Store the evaluation
    const evaluationId = await ctx.db.insert("evaluations", {
      submissionId: args.submissionId,
      applicationId: args.applicationId,
      studentId: user._id,
      taskId: args.taskId,
      agentType: args.agentType,
      overallScore: args.overallScore,
      verdict: args.verdict,
      scores: args.scores,
      strengths: args.strengths,
      improvements: args.improvements,
      summary: args.summary,
      rawResponse: args.rawResponse,
      evaluatedAt: Date.now(),
    });

    // Update submission status to completed
    await ctx.db.patch(args.submissionId, {
      evaluationStatus: "completed",
    });

    // ── Score-Gating: Only complete the task if score meets threshold ──
    const passed = args.overallScore >= PASSING_SCORE_THRESHOLD;

    if (passed) {
      const completedAt = Date.now();

      // Mark application as completed
      await ctx.db.patch(args.applicationId, {
        status: "completed",
        completedAt,
      });

      // Mark task as completed so it appears in the employer's Completed tab
      const task = await ctx.db.get(args.taskId);
      if (task) {
        await ctx.db.patch(args.taskId, {
          status: "completed",
          updatedAt: completedAt,
        });

        // ── Award Skill XP (only on passing score) ──
        const fallbackXp: Record<string, number> = {
          beginner: 65,
          intermediate: 115,
          advanced: 175,
        };
        const xpToAward = task.xpPerSkill ?? fallbackXp[task.skillLevel] ?? 65;
        const MAX_SKILL_XP = 2000;

        const studentProfile = await ctx.db
          .query("studentProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", user._id))
          .unique();

        if (studentProfile) {
          const taskSkills = task.skills ?? [];
          if (taskSkills.length > 0) {
            const existingXp = studentProfile.skillXp ?? [];
            const xpEntryMap = new Map(existingXp.map((entry) => [entry.skill, entry.xp]));

            for (const skill of taskSkills) {
              const current = xpEntryMap.get(skill) ?? 0;
              xpEntryMap.set(skill, Math.min(current + xpToAward, MAX_SKILL_XP));
            }

            for (const entry of existingXp) {
              if (!xpEntryMap.has(entry.skill)) {
                xpEntryMap.set(entry.skill, entry.xp);
              }
            }

            const updatedSkillXp = Array.from(xpEntryMap.entries()).map(([skill, xp]) => ({
              skill,
              xp,
            }));

            const currentSkills = studentProfile.skills ?? [];
            const skillSet = new Set(currentSkills);
            const newSkills = taskSkills.filter((s) => !skillSet.has(s));
            const updatedSkills = newSkills.length > 0
              ? [...currentSkills, ...newSkills]
              : currentSkills;

            await ctx.db.patch(studentProfile._id, {
              skillXp: updatedSkillXp,
              ...(newSkills.length > 0 ? { skills: updatedSkills } : {}),
            });
          }
        }
      }
    }
    // If score < threshold: application stays "in_progress", student can retry

    return evaluationId;
  },
});

/**
 * Delete a submission and its evaluation so the student can retry.
 * Only allowed when the score is below the passing threshold.
 */
export const deleteSubmissionForRetry = mutation({
  args: {
    applicationId: v.id("applications"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user || user.role !== "student") {
      throw new Error("Unauthorized");
    }

    const application = await ctx.db.get(args.applicationId);
    if (!application || application.studentId !== user._id) {
      throw new Error("Application not found or unauthorized");
    }

    // Block retry on already-completed (passing) tasks
    if (application.status === "completed") {
      throw new Error("Cannot retry a completed task");
    }

    // Find and delete the submission
    const submission = await ctx.db
      .query("submissions")
      .withIndex("by_applicationId", (q) =>
        q.eq("applicationId", args.applicationId),
      )
      .unique();

    if (submission) {
      // Delete associated evaluation first
      const evaluation = await ctx.db
        .query("evaluations")
        .withIndex("by_submissionId", (q) =>
          q.eq("submissionId", submission._id),
        )
        .unique();

      if (evaluation) {
        // Safety check: don't allow deleting passing evaluations
        if (evaluation.overallScore >= PASSING_SCORE_THRESHOLD) {
          throw new Error("Cannot retry — score meets the passing threshold");
        }
        await ctx.db.delete(evaluation._id);
      }

      await ctx.db.delete(submission._id);
    }

    // Ensure application is back to in_progress
    await ctx.db.patch(args.applicationId, { status: "in_progress" });
  },
});

/**
 * Update a submission's evaluation status (e.g. pending → evaluating → completed/failed).
 */
export const updateEvaluationStatus = mutation({
  args: {
    submissionId: v.id("submissions"),
    status: v.union(
      v.literal("pending"),
      v.literal("evaluating"),
      v.literal("completed"),
      v.literal("failed"),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) throw new Error("User not found");

    const submission = await ctx.db.get(args.submissionId);
    if (!submission || submission.studentId !== user._id) {
      throw new Error("Submission not found or unauthorized");
    }

    await ctx.db.patch(args.submissionId, {
      evaluationStatus: args.status,
    });
  },
});

/**
 * Get evaluation by application ID (used in student dashboard).
 */
export const getEvaluationByApplication = query({
  args: { applicationId: v.id("applications") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("evaluations")
      .withIndex("by_applicationId", (q) =>
        q.eq("applicationId", args.applicationId),
      )
      .unique();
  },
});

/**
 * Get evaluation by submission ID.
 */
export const getEvaluationBySubmission = query({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("evaluations")
      .withIndex("by_submissionId", (q) =>
        q.eq("submissionId", args.submissionId),
      )
      .unique();
  },
});

/**
 * Get all evaluations for the current student.
 */
export const getStudentEvaluations = query({
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

    const evaluations = await ctx.db
      .query("evaluations")
      .withIndex("by_studentId", (q) => q.eq("studentId", user._id))
      .order("desc")
      .take(50);

    // Enrich with task info
    const enriched = await Promise.all(
      evaluations.map(async (ev) => {
        const task = await ctx.db.get(ev.taskId);
        return {
          ...ev,
          taskTitle: task?.title ?? "Unknown Task",
          taskCategory: task?.category ?? "Unknown",
        };
      }),
    );

    return enriched;
  },
});

/**
 * Get evaluation for a task (employer view).
 */
export const getEvaluationsByTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("evaluations")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .take(50);
  },
});

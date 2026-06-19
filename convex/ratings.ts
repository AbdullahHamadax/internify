import { mutation, query, type QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";

/**
 * Resolve the authenticated user record, or null if unauthenticated.
 */
async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
}

/**
 * Convert a 0–100 AI score to the 0–5 star scale.
 */
function aiScoreToStars(score: number): number {
  return Math.max(0, Math.min(5, score / 20));
}

/**
 * Blend an AI score (0–100) with an optional employer star rating (1–5) into a
 * single 0–5 value. When the employer has rated the submission, their judgment
 * is weighted more heavily (60/40); otherwise the AI score stands alone — which
 * keeps the overall rating stable before many employer ratings exist.
 */
function blendRating(aiScore: number, employerStars: number | null): number {
  const aiStars = aiScoreToStars(aiScore);
  if (employerStars == null) return aiStars;
  return employerStars * 0.6 + aiStars * 0.4;
}

/**
 * MUTATION: rateSubmission
 * An employer rates a student's completed submission (1–5 stars + optional
 * comment). Upserts — calling again updates the existing rating. Only the
 * employer who posted the task may rate, and only once the task is completed.
 */
export const rateSubmission = mutation({
  args: {
    applicationId: v.id("applications"),
    stars: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.stars < 1 || args.stars > 5) {
      throw new Error("Rating must be between 1 and 5 stars");
    }

    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "employer") {
      throw new Error("Unauthorized: only employers can rate submissions");
    }

    const application = await ctx.db.get(args.applicationId);
    if (!application) throw new Error("Application not found");

    const task = await ctx.db.get(application.taskId);
    if (!task || task.employerId !== user._id) {
      throw new Error("Unauthorized: you can only rate your own tasks");
    }

    if (application.status !== "completed") {
      throw new Error("You can only rate a completed submission");
    }

    const now = Date.now();
    const comment = args.comment?.trim() || undefined;

    // Upsert: one rating per application.
    const existing = await ctx.db
      .query("ratings")
      .withIndex("by_applicationId", (q) =>
        q.eq("applicationId", args.applicationId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        stars: args.stars,
        comment,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("ratings", {
      applicationId: args.applicationId,
      taskId: application.taskId,
      studentId: application.studentId,
      employerId: user._id,
      stars: args.stars,
      comment,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * QUERY: getRatingsByTask
 * Returns the employer's ratings for a task, keyed for quick lookup by the
 * employer's submission view. Only the task owner can read them.
 */
export const getRatingsByTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const task = await ctx.db.get(args.taskId);
    if (!task || task.employerId !== user._id) return [];

    return await ctx.db
      .query("ratings")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .collect();
  },
});

/**
 * QUERY: getStudentRatingSummary
 * Computes a student's blended overall rating plus per-completed-task detail
 * (AI score, employer stars, comment, blended value). Defaults to the current
 * user when no studentId is provided.
 */
export const getStudentRatingSummary = query({
  args: { studentId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    let studentId: Id<"users"> | null = args.studentId ?? null;
    if (!studentId) {
      const user = await getCurrentUser(ctx);
      if (!user) return null;
      studentId = user._id;
    }

    // All completed applications for the student.
    const applications = await ctx.db
      .query("applications")
      .withIndex("by_studentId", (q) => q.eq("studentId", studentId!))
      .collect();
    const completed = applications.filter((a) => a.status === "completed");

    const items: {
      applicationId: Id<"applications">;
      taskId: Id<"tasks">;
      aiScore: number | null;
      stars: number | null;
      comment: string | null;
      blended: number;
    }[] = [];

    let blendedSum = 0;
    let blendedCount = 0;
    let employerRatingCount = 0;
    let employerStarsSum = 0;

    for (const app of completed) {
      const evaluation = await ctx.db
        .query("evaluations")
        .withIndex("by_applicationId", (q) => q.eq("applicationId", app._id))
        .unique();

      const rating = await ctx.db
        .query("ratings")
        .withIndex("by_applicationId", (q) => q.eq("applicationId", app._id))
        .unique();

      const aiScore = evaluation?.overallScore ?? null;
      const stars = rating?.stars ?? null;

      if (stars != null) {
        employerRatingCount += 1;
        employerStarsSum += stars;
      }

      // Only count tasks that have at least an AI score or an employer rating.
      if (aiScore != null || stars != null) {
        const blended = blendRating(aiScore ?? stars! * 20, stars);
        blendedSum += blended;
        blendedCount += 1;
        items.push({
          applicationId: app._id,
          taskId: app.taskId,
          aiScore,
          stars,
          comment: rating?.comment ?? null,
          blended,
        });
      }
    }

    const overall = blendedCount > 0 ? blendedSum / blendedCount : 0;

    return {
      overall: Math.round(overall * 10) / 10, // 0–5, one decimal
      blendedCount,
      employerRatingCount,
      employerAverage:
        employerRatingCount > 0
          ? Math.round((employerStarsSum / employerRatingCount) * 10) / 10
          : 0,
      items,
    };
  },
});

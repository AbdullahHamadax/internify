import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { v } from "convex/values";

/**
 * INTERNIFY — SAVED TASKS (BOOKMARKS)
 *
 * Browsing and committing are different decisions. A student can save a task
 * they are interested in and come back to it, instead of being forced to accept
 * it on the spot (accepting is a commitment: it enters their pipeline and the
 * task's applicant count goes up).
 *
 * A saved row exists only while the task is bookmarked; unsaving deletes it.
 */

/** Resolve the signed-in student, or null. Saving is a student-only action. */
async function currentStudent(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  const user = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (!user || user.role !== "student") return null;
  return user;
}

/**
 * Toggle a bookmark. Returns the resulting state so the UI can reflect it
 * immediately without a second round trip.
 */
export const toggleSaveTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const user = await currentStudent(ctx);
    if (!user) throw new Error("Only signed-in students can save tasks");

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    const existing = await ctx.db
      .query("savedTasks")
      .withIndex("by_studentId_taskId", (q) =>
        q.eq("studentId", user._id).eq("taskId", args.taskId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { saved: false };
    }

    await ctx.db.insert("savedTasks", {
      studentId: user._id,
      taskId: args.taskId,
      createdAt: Date.now(),
    });
    return { saved: true };
  },
});

/**
 * Just the ids the student has saved. Cheap enough to drive the bookmark
 * toggle on every card in a list without loading each task.
 */
export const getSavedTaskIds = query({
  args: {},
  handler: async (ctx) => {
    const user = await currentStudent(ctx);
    if (!user) return [];

    const rows = await ctx.db
      .query("savedTasks")
      .withIndex("by_studentId", (q) => q.eq("studentId", user._id))
      .collect();

    return rows.map((r) => r.taskId as string);
  },
});

/**
 * The saved tasks themselves, newest bookmark first, enriched for rendering.
 *
 * A bookmark outlives the task's availability, so each row carries the reason
 * it may no longer be actionable (expired / full / already applied). The UI
 * shows that state rather than silently dropping the task, which would look
 * like the bookmark was lost.
 */
export const getSavedTasks = query({
  args: {},
  handler: async (ctx) => {
    const user = await currentStudent(ctx);
    if (!user) return [];

    const rows = await ctx.db
      .query("savedTasks")
      .withIndex("by_studentId", (q) => q.eq("studentId", user._id))
      .collect();

    // Tasks the student already committed to.
    const applications = await ctx.db
      .query("applications")
      .withIndex("by_studentId", (q) => q.eq("studentId", user._id))
      .collect();
    const appliedTaskIds = new Set(applications.map((a) => a.taskId as string));

    const now = Date.now();

    const enriched = await Promise.all(
      rows.map(async (row) => {
        const task = await ctx.db.get(row.taskId);
        if (!task) return null; // task was deleted; drop the dangling bookmark

        const employerProfile = await ctx.db
          .query("employerProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", task.employerId))
          .unique();

        const isExpired = task.deadline <= now;
        const isFull =
          !!task.maxApplicants &&
          (task.applicantCount ?? 0) >= task.maxApplicants;
        const isApplied = appliedTaskIds.has(task._id as string);

        return {
          savedAt: row.createdAt,
          taskId: task._id as string,
          title: task.title,
          description: task.description,
          category: task.category,
          skillLevel: task.skillLevel,
          skills: task.skills ?? [],
          deadline: task.deadline,
          postedAt: task.createdAt,
          applicantCount: task.applicantCount ?? 0,
          maxApplicants: task.maxApplicants,
          employerId: task.employerId as string,
          companyName: employerProfile?.companyName ?? "Unknown Company",
          companyHiringStatus: employerProfile?.hiringStatus,
          isExpired,
          isFull,
          isApplied,
          /** Can the student still act on this bookmark? */
          isActionable: !isExpired && !isFull && !isApplied,
        };
      }),
    );

    return enriched
      .filter((t): t is NonNullable<typeof t> => t !== null)
      .sort((a, b) => b.savedAt - a.savedAt);
  },
});

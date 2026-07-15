import { internalMutation } from "./_generated/server";

/** How close a deadline must be before the student gets warned. */
const DEADLINE_WARNING_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Warn every student who has an accepted task due within the next 24 hours
 * and no submission yet. Runs hourly from crons.ts; the per-task dedupe
 * check keeps each student to a single warning per task.
 */
export const notifyApproachingDeadlines = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const applications = await ctx.db.query("applications").collect();
    let notified = 0;

    for (const application of applications) {
      if (application.status === "completed") continue;

      const task = await ctx.db.get(application.taskId);
      if (!task) continue;

      const remaining = task.deadline - now;
      if (remaining <= 0 || remaining > DEADLINE_WARNING_WINDOW_MS) continue;

      const submission = await ctx.db
        .query("submissions")
        .withIndex("by_applicationId", (q) =>
          q.eq("applicationId", application._id),
        )
        .first();
      if (submission) continue;

      const alreadyWarned = await ctx.db
        .query("notifications")
        .withIndex("by_userId", (q) => q.eq("userId", application.studentId))
        .filter((q) =>
          q.and(
            q.eq(q.field("type"), "deadline_approaching"),
            q.eq(q.field("relatedTaskId"), task._id),
          ),
        )
        .first();
      if (alreadyWarned) continue;

      const hoursLeft = Math.max(1, Math.round(remaining / 3_600_000));
      await ctx.db.insert("notifications", {
        userId: application.studentId,
        type: "deadline_approaching" as const,
        title: "Deadline Approaching",
        message: `"${task.title}" is due in about ${hoursLeft} hour${
          hoursLeft === 1 ? "" : "s"
        } and you haven't submitted your work yet.`,
        relatedTaskId: task._id,
        isRead: false,
        createdAt: now,
      });
      notified++;
    }

    return { notified };
  },
});

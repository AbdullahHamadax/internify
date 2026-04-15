import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { skillLevelValidator } from "./schema";

/**
 * Attachment validator — reused across createTask and updateTask.
 */
const attachmentValidator = v.array(
  v.object({
    storageId: v.id("_storage"),
    name: v.string(),
    type: v.string(),
  }),
);

/** Maximum number of attachments allowed per task. */
const MAX_ATTACHMENTS = 10;

/** Allowed MIME-type prefixes for attachments. */
const ALLOWED_MIME_PREFIXES = ["image/", "application/pdf"];

/**
 * Validates attachment constraints server-side.
 * Throws if too many attachments or if a file type is disallowed.
 */
function validateAttachments(
  attachments: { storageId: string; name: string; type: string }[] | undefined,
) {
  if (!attachments) return;

  if (attachments.length > MAX_ATTACHMENTS) {
    throw new Error(`Maximum ${MAX_ATTACHMENTS} attachments allowed per task.`);
  }

  for (const att of attachments) {
    const isAllowed = ALLOWED_MIME_PREFIXES.some((prefix) =>
      att.type.startsWith(prefix),
    );
    if (!isAllowed) {
      throw new Error(
        `File type "${att.type}" is not allowed. Only images and PDFs are accepted.`,
      );
    }
  }
}

/** Minimum window from posting time until deadline (not in the past; not “same-day rush”). */
const MIN_TASK_DEADLINE_LEAD_MS = 24 * 60 * 60 * 1000;
const EXPIRED_TASK_CLEANUP_GRACE_MS = 24 * 60 * 60 * 1000;

function validateTaskDeadline(deadline: number) {
  const now = Date.now();
  if (deadline <= now) {
    throw new Error("Deadline must be in the future.");
  }
  if (deadline - now < MIN_TASK_DEADLINE_LEAD_MS) {
    throw new Error(
      "Deadline must be at least 24 hours from now so students have reasonable time to complete the work.",
    );
  }
}

function isPastDeadline(deadline: number, now = Date.now()) {
  return deadline <= now;
}

function isPastCleanupWindow(deadline: number, now = Date.now()) {
  return deadline + EXPIRED_TASK_CLEANUP_GRACE_MS <= now;
}

async function deleteStorageIdSafely(
  ctx: MutationCtx,
  storageId: Id<"_storage">,
  seenStorageIds: Set<string>,
) {
  const key = storageId.toString();
  if (seenStorageIds.has(key)) {
    return;
  }

  seenStorageIds.add(key);

  try {
    await ctx.storage.delete(storageId);
  } catch (error) {
    console.warn(
      `[tasks] Skipping missing or already-deleted storage object ${key}.`,
      error,
    );
  }
}

async function deleteStorageIdsSafely(
  ctx: MutationCtx,
  storageIds: Iterable<Id<"_storage">>,
  seenStorageIds: Set<string>,
) {
  for (const storageId of storageIds) {
    await deleteStorageIdSafely(ctx, storageId, seenStorageIds);
  }
}

async function deleteSubmissionSafely(
  ctx: MutationCtx,
  submissionId: Id<"submissions">,
) {
  try {
    await ctx.db.delete(submissionId);
    return true;
  } catch (error) {
    console.warn(
      `[tasks] Skipping missing or already-deleted submission ${submissionId.toString()}.`,
      error,
    );
    return false;
  }
}

async function deleteApplicationSafely(
  ctx: MutationCtx,
  applicationId: Id<"applications">,
) {
  try {
    await ctx.db.delete(applicationId);
    return true;
  } catch (error) {
    console.warn(
      `[tasks] Skipping missing or already-deleted application ${applicationId.toString()}.`,
      error,
    );
    return false;
  }
}

async function deleteTaskCascade(ctx: MutationCtx, task: Doc<"tasks">) {
  const submissions = await ctx.db
    .query("submissions")
    .withIndex("by_taskId", (q) => q.eq("taskId", task._id))
    .collect();
  const seenStorageIds = new Set<string>();
  let deletedSubmissionCount = 0;

  for (const submission of submissions) {
    await deleteStorageIdsSafely(
      ctx,
      submission.files.map((file) => file.storageId),
      seenStorageIds,
    );
    if (await deleteSubmissionSafely(ctx, submission._id)) {
      deletedSubmissionCount += 1;
    }
  }

  const applications = await ctx.db
    .query("applications")
    .withIndex("by_taskId", (q) => q.eq("taskId", task._id))
    .collect();
  let deletedApplicationCount = 0;

  for (const application of applications) {
    if (await deleteApplicationSafely(ctx, application._id)) {
      deletedApplicationCount += 1;
    }
  }

  await deleteStorageIdsSafely(ctx, task.imageStorageIds ?? [], seenStorageIds);
  await deleteStorageIdsSafely(
    ctx,
    (task.attachments ?? []).map((att) => att.storageId),
    seenStorageIds,
  );

  try {
    await ctx.db.delete(task._id);
  } catch (error) {
    console.warn(
      `[tasks] Skipping missing or already-deleted task ${task._id.toString()}.`,
      error,
    );
  }

  return {
    deletedApplicationCount,
    deletedSubmissionCount,
  };
}

export const generateUploadUrl = mutation(async (ctx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }
  return await ctx.storage.generateUploadUrl();
});

export const createTask = mutation({
  args: {
    title: v.string(),
    category: v.string(),
    skillLevel: skillLevelValidator,
    description: v.string(),
    skills: v.array(v.string()),
    deadline: v.number(),
    maxApplicants: v.optional(v.number()),
    imageStorageIds: v.optional(v.array(v.id("_storage"))),
    attachments: v.optional(attachmentValidator),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user || user.role !== "employer") {
      throw new Error("Unauthorized: Only employers can create tasks");
    }

    // Server-side attachment validation
    validateAttachments(args.attachments);
    validateTaskDeadline(args.deadline);

    const now = Date.now();

    // Insert new task row for the currently authenticated employer
    const taskId = await ctx.db.insert("tasks", {
      employerId: user._id,
      title: args.title,
      category: args.category,
      skillLevel: args.skillLevel,
      description: args.description,
      skills: args.skills,
      deadline: args.deadline,
      maxApplicants: args.maxApplicants,
      applicantCount: 0,
      imageStorageIds: args.imageStorageIds,
      attachments: args.attachments,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    // Notify all students about the new task
    const employerProfile = await ctx.db
      .query("employerProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();
    const companyName = employerProfile?.companyName ?? "A company";

    const allUsers = await ctx.db.query("users").collect();
    const students = allUsers.filter(
      (u) => u.role === "student" && u._id !== user._id,
    );

    await Promise.all(
      students.map((student) =>
        ctx.db.insert("notifications", {
          userId: student._id,
          type: "new_task_posted" as const,
          title: "New Task Available",
          message: `${companyName} posted "${args.title}" — check it out!`,
          relatedTaskId: taskId,
          relatedUserId: user._id,
          relatedUserName: companyName,
          isRead: false,
          createdAt: Date.now(),
        }),
      ),
    );

    return taskId;
  },
});

/**
 * Public query: returns all pending tasks for the student marketplace.
 * Joins with employerProfiles to surface the company name.
 */
export const browseTasks = query({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .collect();

    // Get current user's accepted tasks if authenticated
    const identity = await ctx.auth.getUserIdentity();
    const acceptedTaskIds = new Set<string>();

    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_tokenIdentifier", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier),
        )
        .unique();

      if (user && user.role === "student") {
        const applications = await ctx.db
          .query("applications")
          .withIndex("by_studentId", (q) => q.eq("studentId", user._id))
          .collect();
        applications.forEach((app) => acceptedTaskIds.add(app.taskId));
      }
    }

    // Filter out tasks that are full or already accepted by the user
    const availableTasks = tasks.filter((task) => {
      if (isPastDeadline(task.deadline)) {
        return false;
      }
      if (
        task.maxApplicants &&
        (task.applicantCount ?? 0) >= task.maxApplicants
      ) {
        return false;
      }
      if (acceptedTaskIds.has(task._id)) {
        return false;
      }
      return true;
    });

    const enriched = await Promise.all(
      availableTasks.map(async (task) => {
        // Resolve the employer's company name
        const employerProfile = await ctx.db
          .query("employerProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", task.employerId))
          .unique();

        let resolvedAttachments: {
          storageId: string;
          name: string;
          type: string;
          url: string;
        }[] = [];

        if (task.attachments && task.attachments.length > 0) {
          const mappedAttachments = await Promise.all(
            task.attachments.map(async (att) => {
              const url = await ctx.storage.getUrl(att.storageId);
              return url
                ? {
                    storageId: att.storageId.toString(),
                    name: att.name,
                    type: att.type,
                    url,
                  }
                : null;
            }),
          );

          resolvedAttachments = mappedAttachments.filter(
            (
              att,
            ): att is {
              storageId: string;
              name: string;
              type: string;
              url: string;
            } => att !== null,
          );
        }

        return {
          _id: task._id,
          employerId: task.employerId,
          title: task.title,
          description: task.description,
          category: task.category,
          skillLevel: task.skillLevel,
          skills: task.skills,
          deadline: task.deadline,
          maxApplicants: task.maxApplicants,
          applicantCount: task.applicantCount,
          createdAt: task.createdAt,
          companyName: employerProfile?.companyName ?? "Unknown Company",
          resolvedAttachments,
        };
      }),
    );

    return enriched;
  },
});

export const getEmployerTasks = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      return [];
    }

    // Retrieve all tasks for the authenticated employer, displaying the latest first
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_employerId", (q) => q.eq("employerId", user._id))
      .order("desc") // Order by descending to show the latest first
      .collect();

    // Map over tasks to inject imageUrls and attachment URLs
    const tasksWithUrls = await Promise.all(
      tasks.map(async (task) => {
        let imageUrls: string[] = [];
        let resolvedAttachments: {
          storageId: string;
          name: string;
          type: string;
          url: string;
        }[] = [];

        const attachmentStorageIds = new Set(
          task.attachments?.map((a) => a.storageId as string) || [],
        );
        const filteredLegacyIds = (task.imageStorageIds || []).filter(
          (id) => !attachmentStorageIds.has(id as string),
        );

        if (filteredLegacyIds.length > 0) {
          imageUrls = (
            await Promise.all(
              filteredLegacyIds.map(async (id) => await ctx.storage.getUrl(id)),
            )
          ).filter((url): url is string => url !== null);
        }

        if (task.attachments && task.attachments.length > 0) {
          const mappedAttachments = await Promise.all(
            task.attachments.map(async (att) => {
              const url = await ctx.storage.getUrl(att.storageId);
              return url
                ? {
                    storageId: att.storageId.toString(),
                    name: att.name,
                    type: att.type,
                    url,
                  }
                : null;
            }),
          );

          resolvedAttachments = mappedAttachments.filter(
            (
              att,
            ): att is {
              storageId: string;
              name: string;
              type: string;
              url: string;
            } => att !== null,
          );
        }

        // Fetch accepted students
        const applications = await ctx.db
          .query("applications")
          .withIndex("by_taskId", (q) => q.eq("taskId", task._id))
          .collect();

        const acceptedByRaw = await Promise.all(
          applications.map(async (app) => {
            const student = await ctx.db.get(app.studentId);
            if (!student) return null;
            const name =
              [student.firstName, student.lastName].filter(Boolean).join(" ") ||
              "Student";
            return { id: student._id, name };
          }),
        );
        const acceptedBy = acceptedByRaw.filter((s) => s !== null);

        return {
          ...task,
          imageStorageIds: filteredLegacyIds, // Pass the filtered array to avoid resurrecting deleted attachments
          imageUrls,
          resolvedAttachments,
          acceptedBy,
        };
      }),
    );

    return tasksWithUrls;
  },
});

export const getEmployerStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        activeTasks: 0,
        totalSubmissions: 0,
        completedTasks: 0,
        avgQualityScore: 0,
      };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      return {
        activeTasks: 0,
        totalSubmissions: 0,
        completedTasks: 0,
        avgQualityScore: 0,
      };
    }

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_employerId", (q) => q.eq("employerId", user._id))
      .collect();

    // active tasks: let's treat "pending" and "in_progress" as active
    const activeTasks = tasks.filter(
      (t) => t.status === "pending" || t.status === "in_progress",
    ).length;

    const completedTasks = tasks.filter((t) => t.status === "completed").length;

    // Placeholder values — wire these up once the submissions feature is built
    const totalSubmissions = 0;
    const avgQualityScore = 0;

    return {
      activeTasks,
      totalSubmissions,
      completedTasks,
      avgQualityScore,
    };
  },
});

export const cleanupExpiredTaskData = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { deletedTasks: 0, deletedApplications: 0 };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      return { deletedTasks: 0, deletedApplications: 0 };
    }

    const now = Date.now();
    const tasksToInspect = new Map<string, Doc<"tasks">>();
    let deletedTasks = 0;
    let deletedApplications = 0;

    if (user.role === "employer") {
      const employerTasks = await ctx.db
        .query("tasks")
        .withIndex("by_employerId", (q) => q.eq("employerId", user._id))
        .collect();

      for (const task of employerTasks) {
        if (isPastCleanupWindow(task.deadline, now)) {
          tasksToInspect.set(task._id.toString(), task);
        }
      }
    } else {
      const applications = await ctx.db
        .query("applications")
        .withIndex("by_studentId", (q) => q.eq("studentId", user._id))
        .collect();

      for (const application of applications) {
        const task = await ctx.db.get(application.taskId);

        if (!task) {
          if (await deleteApplicationSafely(ctx, application._id)) {
            deletedApplications += 1;
          }
          continue;
        }

        if (isPastCleanupWindow(task.deadline, now)) {
          tasksToInspect.set(task._id.toString(), task);
        }
      }
    }

    for (const task of tasksToInspect.values()) {
      try {
        const latestTask = await ctx.db.get(task._id);
        if (!latestTask || !isPastCleanupWindow(latestTask.deadline, now)) {
          continue;
        }

        const submissions = await ctx.db
          .query("submissions")
          .withIndex("by_taskId", (q) => q.eq("taskId", latestTask._id))
          .collect();

        if (submissions.length === 0) {
          const result = await deleteTaskCascade(ctx, latestTask);
          deletedTasks += 1;
          deletedApplications += result.deletedApplicationCount;
          continue;
        }

        const submittedApplicationIds = new Set(
          submissions.map((submission) => submission.applicationId.toString()),
        );
        const applications = await ctx.db
          .query("applications")
          .withIndex("by_taskId", (q) => q.eq("taskId", latestTask._id))
          .collect();

        let removedForTask = 0;

        for (const application of applications) {
          if (
            application.status === "completed" ||
            submittedApplicationIds.has(application._id.toString())
          ) {
            continue;
          }

          if (await deleteApplicationSafely(ctx, application._id)) {
            removedForTask += 1;
          }
        }

        if (removedForTask > 0) {
          const refreshedTask = await ctx.db.get(latestTask._id);
          if (!refreshedTask) {
            continue;
          }

          const remainingApplications = applications.length - removedForTask;
          await ctx.db.patch(refreshedTask._id, {
            applicantCount: Math.max(0, remainingApplications),
            status:
              refreshedTask.status === "completed"
                ? "completed"
                : remainingApplications > 0
                  ? "in_progress"
                  : "pending",
            updatedAt: now,
          });
          deletedApplications += removedForTask;
        }
      } catch (error) {
        console.warn(
          `[tasks] Failed to clean up expired task ${task._id.toString()}; skipping it for now.`,
          error,
        );
      }
    }

    return { deletedTasks, deletedApplications };
  },
});

export const deleteTask = mutation({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user || user.role !== "employer") {
      throw new Error("Unauthorized: Only employers can manage tasks");
    }

    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    if (task.employerId !== user._id) {
      throw new Error("Unauthorized: You can only delete your own tasks");
    }

    await deleteTaskCascade(ctx, task);
  },
});

export const updateTask = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.string(),
    category: v.string(),
    skillLevel: skillLevelValidator,
    description: v.string(),
    skills: v.array(v.string()),
    deadline: v.number(),
    maxApplicants: v.optional(v.number()),
    imageStorageIds: v.optional(v.array(v.id("_storage"))),
    attachments: v.optional(attachmentValidator),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user || user.role !== "employer") {
      throw new Error("Unauthorized: Only employers can manage tasks");
    }

    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    if (task.employerId !== user._id) {
      throw new Error("Unauthorized: You can only edit your own tasks");
    }

    // Server-side attachment validation
    validateAttachments(args.attachments);
    validateTaskDeadline(args.deadline);

    // Clean up removed legacy image storage IDs
    const newLegacySet = new Set(
      (args.imageStorageIds ?? []).map((id) => id.toString()),
    );
    const seenRemovedStorageIds = new Set<string>();

    for (const oldId of task.imageStorageIds ?? []) {
      if (!newLegacySet.has(oldId.toString())) {
        await deleteStorageIdSafely(ctx, oldId, seenRemovedStorageIds);
      }
    }

    // Clean up removed attachments
    const newAttachmentSet = new Set(
      (args.attachments ?? []).map((a) => a.storageId.toString()),
    );
    for (const oldAtt of task.attachments ?? []) {
      if (!newAttachmentSet.has(oldAtt.storageId.toString())) {
        await deleteStorageIdSafely(
          ctx,
          oldAtt.storageId,
          seenRemovedStorageIds,
        );
      }
    }

    await ctx.db.patch(args.taskId, {
      title: args.title,
      category: args.category,
      skillLevel: args.skillLevel,
      description: args.description,
      skills: args.skills,
      deadline: args.deadline,
      maxApplicants: args.maxApplicants,
      imageStorageIds: args.imageStorageIds,
      attachments: args.attachments,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Accept a task as a student.
 * - Prevents duplicate applications
 * - Checks capacity (maxApplicants)
 * - Increments applicantCount on the task
 */
export const acceptTask = mutation({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user || user.role !== "student") {
      throw new Error("Unauthorized: Only students can accept tasks");
    }

    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    if (isPastDeadline(task.deadline)) {
      throw new Error("This task deadline has already passed");
    }

    if (task.status !== "pending") {
      throw new Error("This task is no longer accepting applications");
    }

    // Check if already accepted
    const existingApplication = await ctx.db
      .query("applications")
      .withIndex("by_studentId_taskId", (q) =>
        q.eq("studentId", user._id).eq("taskId", args.taskId),
      )
      .unique();

    if (existingApplication) {
      throw new Error("You have already accepted this task");
    }

    // Check capacity
    const currentCount = task.applicantCount ?? 0;
    if (task.maxApplicants && currentCount >= task.maxApplicants) {
      throw new Error("This task has reached its maximum number of applicants");
    }

    // Create the application record
    await ctx.db.insert("applications", {
      studentId: user._id,
      taskId: args.taskId,
      status: "accepted",
      createdAt: Date.now(),
    });

    // Increment applicant count on the task
    const newCount = currentCount + 1;
    const updates: Record<string, unknown> = {
      applicantCount: newCount,
      updatedAt: Date.now(),
    };

    // Auto-move to "in_progress" when max applicants reached
    if (task.maxApplicants && newCount >= task.maxApplicants) {
      updates.status = "in_progress";
    }

    await ctx.db.patch(args.taskId, updates);

    // Notify the employer that a student accepted their task
    const studentName =
      [user.firstName, user.lastName].filter(Boolean).join(" ") || "A student";
    await ctx.db.insert("notifications", {
      userId: task.employerId,
      type: "task_accepted",
      title: "New Applicant",
      message: `${studentName} accepted your task "${task.title}".`,
      relatedTaskId: args.taskId,
      relatedUserId: user._id,
      relatedUserName: studentName,
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

/**
 * Get all task IDs the current student has accepted.
 * Used in the explore page to disable duplicate applications.
 */
export const getStudentAcceptedTaskIds = query({
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

    if (!user) return [];

    const applications = await ctx.db
      .query("applications")
      .withIndex("by_studentId", (q) => q.eq("studentId", user._id))
      .collect();

    return applications.map((a) => a.taskId);
  },
});

/**
 * Get all applications for the current student with full task details.
 * Used in the student dashboard active pipeline.
 */
export const getStudentApplications = query({
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

    if (!user) return [];

    const applications = await ctx.db
      .query("applications")
      .withIndex("by_studentId", (q) => q.eq("studentId", user._id))
      .collect();

    const enriched = await Promise.all(
      applications.map(async (app) => {
        const task = await ctx.db.get(app.taskId);
        if (!task) return null;

        const employerProfile = await ctx.db
          .query("employerProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", task.employerId))
          .unique();

        const existingSubmission = await ctx.db
          .query("submissions")
          .withIndex("by_applicationId", (q) =>
            q.eq("applicationId", app._id),
          )
          .unique();

        return {
          _id: app._id,
          taskId: app.taskId,
          status: app.status,
          acceptedAt: app.createdAt,
          hasSubmission: !!existingSubmission,
          task: {
            title: task.title,
            description: task.description,
            category: task.category,
            skillLevel: task.skillLevel,
            skills: task.skills,
            deadline: task.deadline,
            status: task.status,
            companyName: employerProfile?.companyName ?? "Unknown Company",
          },
        };
      }),
    );

    return enriched.filter((item) => item !== null);
  },
});

/**
 * Submit files for a task (student).
 * Creates a submission record and marks the application as completed.
 */
export const submitTask = mutation({
  args: {
    applicationId: v.id("applications"),
    files: v.array(
      v.object({
        storageId: v.id("_storage"),
        name: v.string(),
        type: v.string(),
      }),
    ),
    note: v.optional(v.string()),
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
      throw new Error("Unauthorized: Only students can submit tasks");
    }

    const application = await ctx.db.get(args.applicationId);
    if (!application) throw new Error("Application not found");
    if (application.studentId !== user._id) {
      throw new Error("Unauthorized: This is not your application");
    }

    const task = await ctx.db.get(application.taskId);
    if (!task) throw new Error("Task not found");
    if (isPastDeadline(task.deadline)) {
      throw new Error("The deadline for this task has passed");
    }

    // Prevent duplicate submissions
    const existing = await ctx.db
      .query("submissions")
      .withIndex("by_applicationId", (q) =>
        q.eq("applicationId", args.applicationId),
      )
      .unique();
    if (existing) throw new Error("You have already submitted for this task");

    if (args.files.length === 0) {
      throw new Error("At least one file is required");
    }

    // Create submission
    await ctx.db.insert("submissions", {
      applicationId: args.applicationId,
      studentId: user._id,
      taskId: application.taskId,
      files: args.files,
      note: args.note,
      submittedAt: Date.now(),
    });

    // Mark application as completed
    await ctx.db.patch(args.applicationId, { status: "completed" });

    // Mark task as completed so it appears in the employer's Completed tab
    await ctx.db.patch(application.taskId, {
      status: "completed",
      updatedAt: Date.now(),
    });

    // Notify the employer about the submission
    const studentName =
      [user.firstName, user.lastName].filter(Boolean).join(" ") || "A student";
    await ctx.db.insert("notifications", {
      userId: task.employerId,
      type: "task_submitted",
      title: "New Submission",
      message: `${studentName} submitted work for "${task.title}".`,
      relatedTaskId: application.taskId,
      relatedUserId: user._id,
      relatedUserName: studentName,
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

/**
 * Get all submissions for a specific task (employer).
 * Returns student name, submission date, note, and resolved file URLs.
 */
export const getTaskSubmissions = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .collect();

    const enriched = await Promise.all(
      submissions.map(async (sub) => {
        const student = await ctx.db.get(sub.studentId);
        const studentName = student
          ? [student.firstName, student.lastName].filter(Boolean).join(" ") ||
            "Student"
          : "Unknown Student";

        const resolvedFiles = await Promise.all(
          sub.files.map(async (file) => {
            const url = await ctx.storage.getUrl(file.storageId);
            return url
              ? { storageId: file.storageId.toString(), name: file.name, type: file.type, url }
              : null;
          }),
        );

        return {
          _id: sub._id,
          studentId: sub.studentId,
          studentName,
          note: sub.note,
          submittedAt: sub.submittedAt,
          files: resolvedFiles.filter((f) => f !== null),
        };
      }),
    );

    return enriched;
  },
});

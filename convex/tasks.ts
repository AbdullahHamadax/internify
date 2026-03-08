import { mutation, query } from "./_generated/server";
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
      imageStorageIds: args.imageStorageIds,
      attachments: args.attachments,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

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

    const enriched = await Promise.all(
      tasks.map(async (task) => {
        // Resolve the employer's company name
        const employerProfile = await ctx.db
          .query("employerProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", task.employerId))
          .unique();

        return {
          _id: task._id,
          title: task.title,
          description: task.description,
          category: task.category,
          skillLevel: task.skillLevel,
          skills: task.skills,
          deadline: task.deadline,
          createdAt: task.createdAt,
          companyName: employerProfile?.companyName ?? "Unknown Company",
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

        return {
          ...task,
          imageStorageIds: filteredLegacyIds, // Pass the filtered array to avoid resurrecting deleted attachments
          imageUrls,
          resolvedAttachments,
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

    // Clean up stored files before deleting the task document
    for (const id of task.imageStorageIds ?? []) {
      await ctx.storage.delete(id);
    }
    for (const att of task.attachments ?? []) {
      await ctx.storage.delete(att.storageId);
    }

    await ctx.db.delete(args.taskId);
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

    // Clean up removed legacy image storage IDs
    const newLegacySet = new Set(
      (args.imageStorageIds ?? []).map((id) => id.toString()),
    );
    for (const oldId of task.imageStorageIds ?? []) {
      if (!newLegacySet.has(oldId.toString())) {
        await ctx.storage.delete(oldId);
      }
    }

    // Clean up removed attachments
    const newAttachmentSet = new Set(
      (args.attachments ?? []).map((a) => a.storageId.toString()),
    );
    for (const oldAtt of task.attachments ?? []) {
      if (!newAttachmentSet.has(oldAtt.storageId.toString())) {
        await ctx.storage.delete(oldAtt.storageId);
      }
    }

    await ctx.db.patch(args.taskId, {
      title: args.title,
      category: args.category,
      skillLevel: args.skillLevel,
      description: args.description,
      skills: args.skills,
      deadline: args.deadline,
      imageStorageIds: args.imageStorageIds,
      attachments: args.attachments,
      updatedAt: Date.now(),
    });
  },
});

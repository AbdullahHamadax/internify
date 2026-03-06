import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const createTask = mutation({
  args: {
    title: v.string(),
    category: v.string(),
    skillLevel: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced"),
    ),
    description: v.string(),
    skills: v.array(v.string()),
    deadline: v.number(),
    imageStorageIds: v.optional(v.array(v.id("_storage"))),
    attachments: v.optional(
      v.array(
        v.object({
          storageId: v.id("_storage"),
          name: v.string(),
          type: v.string(),
        }),
      ),
    ),
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
              // Ensure storageId is explicitly cast to string if needed, or rely on Convex's Id type being compatible
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

    // Simulated data as per instructions
    const totalSubmissions = 0; // simulated value
    const avgQualityScore = 0; // simulated value

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

    await ctx.db.delete(args.taskId);
  },
});

export const updateTask = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.string(),
    category: v.string(),
    skillLevel: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced"),
    ),
    description: v.string(),
    skills: v.array(v.string()),
    deadline: v.number(),
    imageStorageIds: v.optional(v.array(v.id("_storage"))),
    attachments: v.optional(
      v.array(
        v.object({
          storageId: v.id("_storage"),
          name: v.string(),
          type: v.string(),
        }),
      ),
    ),
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

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createTask = mutation({
  args: {
    title: v.string(),
    category: v.string(),
    skillLevel: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
    description: v.string(),
    skills: v.array(v.string()),
    deadline: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
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
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
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

    return tasks;
  },
});

export const getEmployerStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { activeTasks: 0, totalSubmissions: 0, completedTasks: 0, avgQualityScore: 0 };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      return { activeTasks: 0, totalSubmissions: 0, completedTasks: 0, avgQualityScore: 0 };
    }

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_employerId", (q) => q.eq("employerId", user._id))
      .collect();

    // active tasks: let's treat "pending" and "in_progress" as active
    const activeTasks = tasks.filter(t => t.status === "pending" || t.status === "in_progress").length;
    
    const completedTasks = tasks.filter(t => t.status === "completed").length;

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
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
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
    skillLevel: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
    description: v.string(),
    skills: v.array(v.string()),
    deadline: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
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
      updatedAt: Date.now(),
    });
  },
});

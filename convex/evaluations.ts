import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Store a new AI evaluation result for a submission.
 * Called from the client after the API route returns evaluation data.
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

    // Prevent duplicate evaluations
    const existing = await ctx.db
      .query("evaluations")
      .withIndex("by_submissionId", (q) =>
        q.eq("submissionId", args.submissionId),
      )
      .unique();
    if (existing) {
      throw new Error("Evaluation already exists for this submission");
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

    return evaluationId;
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

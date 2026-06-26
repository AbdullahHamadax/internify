import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";

/** Minimum score required to pass and complete a task */
const PASSING_SCORE_THRESHOLD = 60;

/**
 * Generates a unique, human-readable certificate ID for verification.
 * Format: INF-<year>-<6 chars>, e.g. "INF-2026-7K4QX9".
 * Uses an unambiguous alphabet (no 0/O/1/I) so IDs are easy to read and type.
 */
function generateCertificateId(completedAt: number): string {
  const year = new Date(completedAt).getFullYear();
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `INF-${year}-${suffix}`;
}

/**
 * Assert the request carries the server-only evaluation secret. This is what
 * makes scoring tamper-proof: only our backend (the /api/evaluate-submission
 * route, which holds EVAL_SERVER_SECRET) can call the functions below. A student
 * cannot reach them from the browser, so they cannot inject their own score.
 */
function assertServerSecret(secret: string) {
  const expected = process.env.EVAL_SERVER_SECRET;
  if (!expected) {
    throw new Error(
      "EVAL_SERVER_SECRET is not configured on the Convex deployment.",
    );
  }
  if (secret !== expected) {
    throw new Error("Forbidden: invalid server secret");
  }
}

/**
 * Read-only context the server needs to evaluate a submission: the task's
 * authoritative description/rubric and the stored submission content. Served
 * straight from the database so a student cannot substitute an easier task or a
 * different submission than the one they actually saved. Secret-gated.
 */
export const getEvaluationContext = query({
  args: {
    secret: v.string(),
    applicationId: v.id("applications"),
    submissionId: v.id("submissions"),
  },
  handler: async (ctx, args) => {
    assertServerSecret(args.secret);

    const application = await ctx.db.get(args.applicationId);
    if (!application) throw new Error("Application not found");

    const submission = await ctx.db.get(args.submissionId);
    if (!submission || submission.applicationId !== args.applicationId) {
      throw new Error("Submission does not belong to this application");
    }

    const task = await ctx.db.get(application.taskId);
    if (!task) throw new Error("Task not found");

    // Resolve storage URLs here (secret-gated) so the route never needs a
    // separate public file-URL endpoint.
    const files = await Promise.all(
      (submission.files ?? []).map(async (f) => ({
        storageId: f.storageId,
        name: f.name,
        type: f.type,
        url: await ctx.storage.getUrl(f.storageId),
      })),
    );

    return {
      taskDescription: task.description,
      taskCategory: task.category,
      taskSkills: task.skills ?? [],
      customRubric: task.customRubric ?? [],
      submissionType: submission.submissionType ?? "file_upload",
      githubUrl: submission.githubUrl ?? null,
      plainText: submission.plainText ?? null,
      files,
    };
  },
});

/**
 * Persist a server-computed evaluation. The score arrives ONLY from our backend
 * (proven by EVAL_SERVER_SECRET), never from the client — this is the fix for
 * the score-spoofing hole. The student identity is derived from the application,
 * not trusted from the caller.
 *
 * Score-gating logic:
 * - Score ≥ 60%: marks application + task as "completed", awards XP, mints cert
 * - Score < 60%: keeps application as "in_progress", student can retry
 */
export const storeServerEvaluation = mutation({
  args: {
    secret: v.string(),
    submissionId: v.id("submissions"),
    applicationId: v.id("applications"),
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
    assertServerSecret(args.secret);

    const application = await ctx.db.get(args.applicationId);
    if (!application) throw new Error("Application not found");

    const submission = await ctx.db.get(args.submissionId);
    if (!submission || submission.applicationId !== args.applicationId) {
      throw new Error("Submission does not belong to this application");
    }

    // Student identity comes from the application, never from the caller.
    const user = await ctx.db.get(application.studentId);
    if (!user) throw new Error("Student not found");
    const taskIdFromApplication = application.taskId;

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
      taskId: taskIdFromApplication,
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
      const task = await ctx.db.get(taskIdFromApplication);
      if (task) {
        await ctx.db.patch(taskIdFromApplication, {
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

    // ── Generate certificate when passing ──
    if (passed) {
      const studentUser = user;
      const studentName =
        [studentUser.firstName, studentUser.lastName].filter(Boolean).join(" ") || "Student";

      const task = await ctx.db.get(taskIdFromApplication);
      const taskTitle = task?.title ?? "Unknown Task";

      // Get employer profile for company name and logo
      let companyName = "Unknown Company";
      let companyLogoStorageId = undefined as undefined | Id<"_storage">;
      if (task) {
        const employerProfile = await ctx.db
          .query("employerProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", task.employerId))
          .unique();
        if (employerProfile) {
          companyName = employerProfile.companyName;
          companyLogoStorageId = employerProfile.logoStorageId;
        }
      }

      // Check if certificate already exists for this evaluation
      const existingCert = await ctx.db
        .query("certificates")
        .withIndex("by_evaluationId", (q) => q.eq("evaluationId", evaluationId))
        .unique();

      if (!existingCert) {
        const completedAt = Date.now();

        // Generate a unique certificate ID, retrying on the rare collision.
        let certificateId = generateCertificateId(completedAt);
        for (let attempt = 0; attempt < 5; attempt++) {
          const clash = await ctx.db
            .query("certificates")
            .withIndex("by_certificateId", (q) =>
              q.eq("certificateId", certificateId),
            )
            .unique();
          if (!clash) break;
          certificateId = generateCertificateId(completedAt);
        }

        await ctx.db.insert("certificates", {
          evaluationId,
          studentId: user._id,
          taskId: taskIdFromApplication,
          certificateId,
          studentName,
          taskTitle,
          companyName,
          companyLogoStorageId,
          finalScore: args.overallScore,
          completedAt,
          createdAt: completedAt,
        });
      }
    }

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

/**
 * Get certificate by evaluation ID.
 * Returns the certificate record if one exists (score >= 60), otherwise null.
 */
export const getCertificateByEvaluation = query({
  args: { evaluationId: v.id("evaluations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const cert = await ctx.db
      .query("certificates")
      .withIndex("by_evaluationId", (q) =>
        q.eq("evaluationId", args.evaluationId),
      )
      .unique();

    if (!cert) return null;

    // Resolve logo URL if there's a logo
    let companyLogoUrl: string | null = null;
    if (cert.companyLogoStorageId) {
      companyLogoUrl = await ctx.storage.getUrl(cert.companyLogoStorageId);
    }

    return {
      ...cert,
      companyLogoUrl,
    };
  },
});

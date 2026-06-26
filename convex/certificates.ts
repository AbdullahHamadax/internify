import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Normalize a user-entered certificate ID: trim, uppercase, collapse internal
 * whitespace. Lets "inf-2026-7k4qx9" or " INF-2026-7K4QX9 " resolve the same
 * certificate that was minted as "INF-2026-7K4QX9".
 */
function normalizeCertificateId(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

/**
 * PUBLIC QUERY: getCertificateByPublicId
 *
 * Resolves a certificate from its human-readable verification ID (e.g.
 * "INF-2026-7K4QX9"). Intentionally UNAUTHENTICATED — anyone holding a
 * certificate (an employer, a recruiter) must be able to verify it without an
 * Internify account. Returns only public-safe, snapshot fields; never email,
 * tokens, or internal IDs beyond what's needed to link to the public profile.
 *
 * Returns `{ found: false }` when no certificate matches, so the verify page can
 * distinguish "not a real certificate" from a still-loading state.
 */
export const getCertificateByPublicId = query({
  args: { certificateId: v.string() },
  handler: async (ctx, args) => {
    const normalized = normalizeCertificateId(args.certificateId);
    if (!normalized) return { found: false as const };

    const certificate = await ctx.db
      .query("certificates")
      .withIndex("by_certificateId", (q) =>
        q.eq("certificateId", normalized),
      )
      .unique();

    if (!certificate) return { found: false as const };

    const logoUrl = certificate.companyLogoStorageId
      ? await ctx.storage.getUrl(certificate.companyLogoStorageId)
      : null;

    return {
      found: true as const,
      certificateId: certificate.certificateId ?? normalized,
      studentId: certificate.studentId,
      studentName: certificate.studentName,
      taskTitle: certificate.taskTitle,
      companyName: certificate.companyName,
      finalScore: certificate.finalScore,
      completedAt: certificate.completedAt,
      logoUrl,
    };
  },
});

/**
 * PUBLIC QUERY: getCertificatesByStudent
 *
 * Lists a student's earned certificates for display on their public profile,
 * so an employer viewing a candidate sees their verified credentials in context
 * (each links out to the public /verify page). Public-safe snapshot fields only,
 * newest first. Skips legacy certificates that predate the public ID field,
 * since those can't be linked to a verification page.
 */
export const getCertificatesByStudent = query({
  args: { studentId: v.id("users") },
  handler: async (ctx, args) => {
    const certificates = await ctx.db
      .query("certificates")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .collect();

    const withLogos = await Promise.all(
      certificates
        .filter((c) => !!c.certificateId)
        .sort((a, b) => b.completedAt - a.completedAt)
        .map(async (c) => ({
          certificateId: c.certificateId!,
          taskId: c.taskId,
          studentName: c.studentName,
          taskTitle: c.taskTitle,
          companyName: c.companyName,
          finalScore: c.finalScore,
          completedAt: c.completedAt,
          logoUrl: c.companyLogoStorageId
            ? await ctx.storage.getUrl(c.companyLogoStorageId)
            : null,
        })),
    );

    return withLogos;
  },
});

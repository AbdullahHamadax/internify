import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const roleValidator = v.union(v.literal("student"), v.literal("employer"));

const academicStatusValidator = v.union(
  v.literal("undergraduate"),
  v.literal("graduate"),
);

const rankLevelValidator = v.union(
  v.literal("mid"),
  v.literal("senior"),
  v.literal("lead"),
  v.literal("manager"),
  v.literal("director"),
  v.literal("executive"),
);

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      return null;
    }

    if (user.role === "student") {
      const studentProfile = await ctx.db
        .query("studentProfiles")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .unique();
      return { user, studentProfile, employerProfile: null };
    }

    const employerProfile = await ctx.db
      .query("employerProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();
    return { user, studentProfile: null, employerProfile };
  },
});

export const upsertCurrentUser = mutation({
  args: {
    role: roleValidator,
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    studentProfile: v.optional(
      v.object({
        academicStatus: academicStatusValidator,
        fieldOfStudy: v.string(),
        cvFileName: v.optional(v.string()),
      }),
    ),
    employerProfile: v.optional(
      v.object({
        companyName: v.string(),
        position: v.string(),
        rankLevel: rankLevelValidator,
      }),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();
    const email = args.email ?? identity.email;

    if (!email) {
      throw new Error("No email was provided by Clerk.");
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    const userId = existingUser
      ? existingUser._id
      : await ctx.db.insert("users", {
          tokenIdentifier: identity.tokenIdentifier,
          clerkUserId: identity.subject,
          email,
          firstName: args.firstName ?? identity.givenName,
          lastName: args.lastName ?? identity.familyName,
          role: args.role,
          createdAt: now,
          updatedAt: now,
        });

    if (existingUser) {
      await ctx.db.patch(userId, {
        clerkUserId: identity.subject,
        email,
        firstName: args.firstName ?? identity.givenName,
        lastName: args.lastName ?? identity.familyName,
        role: args.role,
        updatedAt: now,
      });
    }

    if (args.role === "student") {
      if (!args.studentProfile) {
        throw new Error("Student profile data is required.");
      }

      const existingStudentProfile = await ctx.db
        .query("studentProfiles")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique();

      if (existingStudentProfile) {
        await ctx.db.patch(existingStudentProfile._id, {
          academicStatus: args.studentProfile.academicStatus,
          fieldOfStudy: args.studentProfile.fieldOfStudy,
          cvFileName: args.studentProfile.cvFileName,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("studentProfiles", {
          userId,
          academicStatus: args.studentProfile.academicStatus,
          fieldOfStudy: args.studentProfile.fieldOfStudy,
          cvFileName: args.studentProfile.cvFileName,
          updatedAt: now,
        });
      }
    }

    if (args.role === "employer") {
      if (!args.employerProfile) {
        throw new Error("Employer profile data is required.");
      }

      const existingEmployerProfile = await ctx.db
        .query("employerProfiles")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique();

      if (existingEmployerProfile) {
        await ctx.db.patch(existingEmployerProfile._id, {
          companyName: args.employerProfile.companyName,
          position: args.employerProfile.position,
          rankLevel: args.employerProfile.rankLevel,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("employerProfiles", {
          userId,
          companyName: args.employerProfile.companyName,
          position: args.employerProfile.position,
          rankLevel: args.employerProfile.rankLevel,
          updatedAt: now,
        });
      }
    }

    return { userId, role: args.role };
  },
});

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  roleValidator,
  academicStatusValidator,
  rankLevelValidator,
} from "./schema";
import { assertValidUserNameFields } from "./nameLimits";

/**
 * QUERY: currentUser
 * Use this to fetch the logged-in user's data to show on the screen.
 * Example: Showing "Welcome back, Sarah!" and her Major on the Dashboard.
 */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    // 1. Get the login info from Clerk
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null; // Not logged in
    }

    // 2. Find the user in our database using their unique Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      return null; // User is logged into Clerk but hasn't filled our signup form yet
    }

    // 3. If they are a student, get their student-specific info
    // Example: Getting their "Field of Study" (e.g., "Computer Science")
    if (user.role === "student") {
      const studentProfile = await ctx.db
        .query("studentProfiles")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .unique();
      return { user, studentProfile, employerProfile: null };
    }

    // 4. If they are an employer, get their company-specific info
    // Example: Getting their "Company Name" (e.g., "Google")
    const employerProfile = await ctx.db
      .query("employerProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();
    return { user, studentProfile: null, employerProfile };
  },
});

export const requireCurrentIdentity = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    return {
      email: identity.email ?? null,
      subject: identity.subject,
      tokenIdentifier: identity.tokenIdentifier,
    };
  },
});

/**
 * MUTATION: upsertCurrentUser
 * "Upsert" means "Update or Insert". This saves user info to the database.
 * Example: Creating a new account OR updating a profile when someone clicks "Save".
 */
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
        title: v.optional(v.string()),
        location: v.optional(v.string()),
        description: v.optional(v.string()),
        portfolio: v.optional(v.string()),
        github: v.optional(v.string()),
        linkedin: v.optional(v.string()),
        skills: v.optional(v.array(v.string())),
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

    const now = Date.now(); // Current timestamp
    const email = args.email ?? identity.email; // Use provided email or fallback to Clerk's email

    if (!email) {
      throw new Error("No email was provided by Clerk.");
    }

    const resolvedFirst = args.firstName ?? identity.givenName;
    const resolvedLast = args.lastName ?? identity.familyName;
    assertValidUserNameFields(resolvedFirst, resolvedLast);

    // Check if the user already exists in our database
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    // If they don't exist, CREATE them (Insert). If they do, get their ID.
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

    // If they already exist, UPDATE their info (Patch).
    // Example: User changed their email address in settings.
    if (existingUser) {
      // Role is immutable once set — prevents students from becoming employers (and vice versa).
      if (existingUser.role !== args.role) {
        throw new Error(
          `Role cannot be changed. This account is registered as a "${existingUser.role}".`,
        );
      }

      await ctx.db.patch(userId, {
        clerkUserId: identity.subject,
        email,
        firstName: args.firstName ?? identity.givenName,
        lastName: args.lastName ?? identity.familyName,
        updatedAt: now,
      });
    }

    /**
     * Handle Student Profiles
     * Example: Saving that "John is a Graduate student studying Art".
     */
    if (args.role === "student") {
      if (!args.studentProfile) {
        throw new Error("Student profile data is required.");
      }

      const existingStudentProfile = await ctx.db
        .query("studentProfiles")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique();

      if (existingStudentProfile) {
        // Update existing student info
        await ctx.db.patch(existingStudentProfile._id, {
          academicStatus: args.studentProfile.academicStatus,
          fieldOfStudy: args.studentProfile.fieldOfStudy,
          title: args.studentProfile.title,
          location: args.studentProfile.location,
          description: args.studentProfile.description,
          portfolio: args.studentProfile.portfolio,
          github: args.studentProfile.github,
          linkedin: args.studentProfile.linkedin,
          skills: args.studentProfile.skills,
          cvFileName: args.studentProfile.cvFileName,
          updatedAt: now,
        });
      } else {
        // Create new student info
        await ctx.db.insert("studentProfiles", {
          userId,
          academicStatus: args.studentProfile.academicStatus,
          fieldOfStudy: args.studentProfile.fieldOfStudy,
          title: args.studentProfile.title,
          location: args.studentProfile.location,
          description: args.studentProfile.description,
          portfolio: args.studentProfile.portfolio,
          github: args.studentProfile.github,
          linkedin: args.studentProfile.linkedin,
          skills: args.studentProfile.skills,
          cvFileName: args.studentProfile.cvFileName,
          updatedAt: now,
        });
      }
    }

    /**
     * Handle Employer Profiles
     * Example: Saving that "Jane works at Netflix as a Lead Recruiter".
     */
    if (args.role === "employer") {
      if (!args.employerProfile) {
        throw new Error("Employer profile data is required.");
      }

      const existingEmployerProfile = await ctx.db
        .query("employerProfiles")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique();

      if (existingEmployerProfile) {
        // Update existing employer info
        await ctx.db.patch(existingEmployerProfile._id, {
          companyName: args.employerProfile.companyName,
          position: args.employerProfile.position,
          rankLevel: args.employerProfile.rankLevel,
          updatedAt: now,
        });
      } else {
        // Create new employer info
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

/**
 * MUTATION: syncCurrentUserNames
 * Keeps Convex user names aligned with Clerk settings updates.
 */
export const syncCurrentUserNames = mutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
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

    if (!user) {
      throw new Error("User not found");
    }

    const nextFirst = args.firstName ?? identity.givenName ?? user.firstName;
    const nextLast = args.lastName ?? identity.familyName ?? user.lastName;
    assertValidUserNameFields(nextFirst, nextLast);

    await ctx.db.patch(user._id, {
      firstName: nextFirst,
      lastName: nextLast,
      email: args.email ?? identity.email ?? user.email,
      updatedAt: Date.now(),
    });
  },
});

/**
 * QUERY: getStudentsForEmployer
 * Fetches all student users and their profiles for the talent search.
 */
export const getStudentsForEmployer = query({
  args: {},
  handler: async (ctx) => {
    // 1. Ensure the user is authenticated
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // 2. We can enforce evaluating if caller is an employer, but for now just fetching all students
    const students = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier") // Using a valid index or full scan if necessary
      .filter((q) => q.eq(q.field("role"), "student"))
      .collect();

    // 3. For each student, get their profile
    const studentsWithProfiles = await Promise.all(
      students.map(async (student) => {
        const profile = await ctx.db
          .query("studentProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", student._id))
          .unique();

        return {
          user: student,
          profile: profile || null,
        };
      })
    );

    return studentsWithProfiles;
  },
});

/**
 * QUERY: getPublicProfile
 * Fetches any user's public-facing profile by their userId.
 * Used to show read-only profile modals when clicking avatars/names.
 */
export const getPublicProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const name =
      [user.firstName, user.lastName].filter(Boolean).join(" ") || "User";

    if (user.role === "student") {
      const profile = await ctx.db
        .query("studentProfiles")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .unique();
      const applications = await ctx.db
        .query("applications")
        .withIndex("by_studentId", (q) => q.eq("studentId", user._id))
        .collect();
      const completedTasks = applications.filter(
        (app) => app.status === "completed",
      ).length;
      const rating =
        completedTasks > 0 ? 4.5 + Math.min(completedTasks * 0.1, 0.5) : 0;

      return {
        userId: user._id,
        clerkUserId: user.clerkUserId,
        name,
        email: user.email,
        role: user.role as "student",
        memberSince: user.createdAt,
        rating,
        completedTasks,
        studentProfile: profile
          ? {
              title: profile.title,
              location: profile.location,
              description: profile.description,
              academicStatus: profile.academicStatus,
              fieldOfStudy: profile.fieldOfStudy,
              skills: profile.skills ?? [],
              portfolio: profile.portfolio,
              github: profile.github,
              linkedin: profile.linkedin,
            }
          : null,
        employerProfile: null,
      };
    }

    // Employer
    const profile = await ctx.db
      .query("employerProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    return {
      userId: user._id,
      clerkUserId: user.clerkUserId,
      name,
      email: user.email,
      role: user.role as "employer",
      memberSince: user.createdAt,
      studentProfile: null,
      employerProfile: profile
        ? {
            companyName: profile.companyName,
            position: profile.position,
            rankLevel: profile.rankLevel,
          }
        : null,
    };
  },
});

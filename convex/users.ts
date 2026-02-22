import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * VALIDATORS (The Rules)
 * These ensure the data sent from the frontend is correct.
 */

// Example: Only allows "student" or "employer".
const roleValidator = v.union(v.literal("student"), v.literal("employer"));

// Example: Only allows "undergraduate" or "graduate".
const academicStatusValidator = v.union(
  v.literal("undergraduate"),
  v.literal("graduate"),
);

// Example: Only allows levels like "mid", "manager", or "executive".
const rankLevelValidator = v.union(
  v.literal("mid"),
  v.literal("senior"),
  v.literal("lead"),
  v.literal("manager"),
  v.literal("director"),
  v.literal("executive"),
);

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
      await ctx.db.patch(userId, {
        clerkUserId: identity.subject,
        email,
        firstName: args.firstName ?? identity.givenName,
        lastName: args.lastName ?? identity.familyName,
        role: args.role,
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
          cvFileName: args.studentProfile.cvFileName,
          updatedAt: now,
        });
      } else {
        // Create new student info
        await ctx.db.insert("studentProfiles", {
          userId,
          academicStatus: args.studentProfile.academicStatus,
          fieldOfStudy: args.studentProfile.fieldOfStudy,
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
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  roleValidator,
  academicStatusValidator,
  rankLevelValidator,
  studentAvailabilityStatusValidator,
} from "./schema";
import { assertValidUserNameFields } from "./nameLimits";

const DEFAULT_STUDENT_AVAILABILITY_STATUS = "available_now" as const;

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
    if (user.role === "student") {
      const studentProfile = await ctx.db
        .query("studentProfiles")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .unique();
      return { user, studentProfile, employerProfile: null };
    }

    // 4. If they are an employer, get their company-specific info
    const employerProfile = await ctx.db
      .query("employerProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();
    return { user, studentProfile: null, employerProfile };
  },
});

/**
 * QUERY: getStudentSkillXp
 * Returns the current student's skillXp array for rendering skill levels and tooltips.
 */
export const getStudentSkillXp = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user || user.role !== "student") return null;

    const profile = await ctx.db
      .query("studentProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!profile) return null;

    return profile.skillXp ?? [];
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
        cvStorageId: v.optional(v.id("_storage")),
        cvFileName: v.optional(v.string()),
        // Extended education & contact fields
        university: v.optional(v.string()),
        degree: v.optional(v.string()),
        graduationYear: v.optional(v.number()),
        gpa: v.optional(v.number()),
        phone: v.optional(v.string()),
        city: v.optional(v.string()),
        availabilityStatus: v.optional(studentAvailabilityStatusValidator),
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

    // Check if the user already exists in our database
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    const now = Date.now(); // Current timestamp
    const email = args.email ?? identity.email ?? existingUser?.email;

    if (!email) {
      throw new Error(
        "No email was provided by Clerk or found in the existing user record.",
      );
    }

    const resolvedFirst =
      args.firstName ?? identity.givenName ?? existingUser?.firstName;
    const resolvedLast =
      args.lastName ?? identity.familyName ?? existingUser?.lastName;
    assertValidUserNameFields(resolvedFirst, resolvedLast);

    // If they don't exist, CREATE them (Insert). If they do, get their ID.
    const userId = existingUser
      ? existingUser._id
      : await ctx.db.insert("users", {
          tokenIdentifier: identity.tokenIdentifier,
          clerkUserId: identity.subject,
          email,
          firstName: resolvedFirst,
          lastName: resolvedLast,
          role: args.role,
          createdAt: now,
          updatedAt: now,
        });

    // If they already exist, UPDATE their info (Patch).
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
        firstName: resolvedFirst,
        lastName: resolvedLast,
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

      const studentProfileUpdate = {
        academicStatus: args.studentProfile.academicStatus,
        fieldOfStudy: args.studentProfile.fieldOfStudy,
        title: args.studentProfile.title,
        location: args.studentProfile.location,
        description: args.studentProfile.description,
        portfolio: args.studentProfile.portfolio,
        github: args.studentProfile.github,
        linkedin: args.studentProfile.linkedin,
        skills: args.studentProfile.skills,
        university: args.studentProfile.university,
        degree: args.studentProfile.degree,
        graduationYear: args.studentProfile.graduationYear,
        gpa: args.studentProfile.gpa,
        phone: args.studentProfile.phone,
        city: args.studentProfile.city,
        updatedAt: now,
        ...(args.studentProfile.cvStorageId !== undefined
          ? { cvStorageId: args.studentProfile.cvStorageId }
          : {}),
        ...(args.studentProfile.cvFileName !== undefined
          ? { cvFileName: args.studentProfile.cvFileName }
          : {}),
      };
      const availabilityStatusUpdate =
        args.studentProfile.availabilityStatus !== undefined
          ? { availabilityStatus: args.studentProfile.availabilityStatus }
          : {};

      if (existingStudentProfile) {
        // Sync skillXp: preserve XP for existing skills, add 0 XP for new skills, drop removed skills
        const newSkills = args.studentProfile.skills ?? [];
        const existingXpMap = new Map(
          (existingStudentProfile.skillXp ?? []).map((entry) => [entry.skill, entry.xp]),
        );
        const syncedSkillXp = newSkills.map((skill) => ({
          skill,
          xp: existingXpMap.get(skill) ?? 0,
        }));

        // Update existing student info
        await ctx.db.patch(existingStudentProfile._id, {
          ...studentProfileUpdate,
          ...availabilityStatusUpdate,
          skillXp: syncedSkillXp,
        });
      } else {
        // Create new student info — all skills start at 0 XP
        const initialSkillXp = (args.studentProfile.skills ?? []).map((skill) => ({
          skill,
          xp: 0,
        }));
        await ctx.db.insert("studentProfiles", {
          userId,
          ...studentProfileUpdate,
          availabilityStatus:
            args.studentProfile.availabilityStatus ??
            DEFAULT_STUDENT_AVAILABILITY_STATUS,
          skillXp: initialSkillXp,
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
 * MUTATION: updateStudentAvailabilityStatus
 * Lets the current student update their live hiring availability.
 */
export const updateStudentAvailabilityStatus = mutation({
  args: {
    availabilityStatus: studentAvailabilityStatusValidator,
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
      throw new Error("Only students can update availability.");
    }

    const profile = await ctx.db
      .query("studentProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!profile) {
      throw new Error("Student profile not found.");
    }

    await ctx.db.patch(profile._id, {
      availabilityStatus: args.availabilityStatus,
      updatedAt: Date.now(),
    });

    return args.availabilityStatus;
  },
});

/**
 * MUTATION: migrateStudentAvailabilityStatuses
 * One-time migration for existing student profiles that predate availabilityStatus.
 */
export const migrateStudentAvailabilityStatuses = mutation({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("studentProfiles").collect();
    let migrated = 0;
    let skipped = 0;

    for (const profile of profiles) {
      if (profile.availabilityStatus) {
        skipped += 1;
        continue;
      }

      await ctx.db.patch(profile._id, {
        availabilityStatus: DEFAULT_STUDENT_AVAILABILITY_STATUS,
      });
      migrated += 1;
    }

    return { migrated, skipped, total: profiles.length };
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

    // 2. Fetch all student users
    const students = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier")
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
              skillXp: profile.skillXp ?? [],
              availabilityStatus:
                profile.availabilityStatus ??
                DEFAULT_STUDENT_AVAILABILITY_STATUS,
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

/**
 * MUTATION: saveCvToProfile
 * Saves an uploaded CV file reference (storageId + fileName) to the student profile.
 * Optionally deletes the previous CV from storage to prevent orphaned files.
 */
export const saveCvToProfile = mutation({
  args: {
    storageId: v.id("_storage"),
    fileName: v.string(),
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
      throw new Error("Only students can upload CVs.");
    }

    const profile = await ctx.db
      .query("studentProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!profile) {
      throw new Error("Student profile not found. Complete signup first.");
    }

    // Delete previous CV file from storage to avoid orphans
    if (profile.cvStorageId) {
      try {
        await ctx.storage.delete(profile.cvStorageId);
      } catch {
        // File may already be gone — safe to ignore
      }
    }

    await ctx.db.patch(profile._id, {
      cvStorageId: args.storageId,
      cvFileName: args.fileName,
      updatedAt: Date.now(),
    });
  },
});

/**
 * QUERY: getCvDownloadUrl
 * Returns the download URL and metadata for the current user's stored CV.
 */
export const getCvDownloadUrl = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user || user.role !== "student") return null;

    const profile = await ctx.db
      .query("studentProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!profile || !profile.cvStorageId) return null;

    const url = await ctx.storage.getUrl(profile.cvStorageId);
    if (!url) return null;

    return {
      url,
      fileName: profile.cvFileName ?? "CV.pdf",
      storageId: profile.cvStorageId,
    };
  },
});

/**
 * QUERY: getPublicStudentProfileDetail
 * Fetches a richer read-only student profile for employer-facing profile pages.
 */
export const getPublicStudentProfileDetail = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db.get(args.userId);
    if (!user || user.role !== "student") return null;

    const profile = await ctx.db
      .query("studentProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    const applications = await ctx.db
      .query("applications")
      .withIndex("by_studentId", (q) => q.eq("studentId", user._id))
      .collect();

    const completedApplications = applications.filter(
      (app) => app.status === "completed",
    );

    const completedWork = (
      await Promise.all(
        completedApplications.map(async (app) => {
          const task = await ctx.db.get(app.taskId);
          if (!task) return null;

          const employerProfile = await ctx.db
            .query("employerProfiles")
            .withIndex("by_userId", (q) => q.eq("userId", task.employerId))
            .unique();
          const submission = await ctx.db
            .query("submissions")
            .withIndex("by_applicationId", (q) =>
              q.eq("applicationId", app._id),
            )
            .unique();

          return {
            applicationId: app._id,
            taskId: task._id,
            title: task.title,
            description: task.description,
            category: task.category,
            skillLevel: task.skillLevel,
            skills: task.skills,
            companyName: employerProfile?.companyName ?? "Unknown Company",
            recordedAt: app.completedAt ?? submission?.submittedAt ?? app.createdAt,
          };
        }),
      )
    )
      .filter((item) => item !== null)
      .sort((a, b) => b.recordedAt - a.recordedAt);

    const rating =
      completedApplications.length > 0
        ? 4.5 + Math.min(completedApplications.length * 0.1, 0.5)
        : 0;

    const cvUrl =
      profile?.cvStorageId !== undefined
        ? await ctx.storage.getUrl(profile.cvStorageId)
        : null;

    return {
      userId: user._id,
      clerkUserId: user.clerkUserId,
      name: [user.firstName, user.lastName].filter(Boolean).join(" ") || "User",
      email: user.email,
      role: user.role as "student",
      memberSince: user.createdAt,
      rating,
      completedTasks: completedApplications.length,
      studentProfile: profile
        ? {
            title: profile.title,
            location: profile.location,
            description: profile.description,
            academicStatus: profile.academicStatus,
            fieldOfStudy: profile.fieldOfStudy,
            skills: profile.skills ?? [],
            skillXp: profile.skillXp ?? [],
            availabilityStatus:
              profile.availabilityStatus ??
              DEFAULT_STUDENT_AVAILABILITY_STATUS,
            portfolio: profile.portfolio,
            github: profile.github,
            linkedin: profile.linkedin,
            university: profile.university,
            degree: profile.degree,
            graduationYear: profile.graduationYear,
            gpa: profile.gpa,
            phone: profile.phone,
            city: profile.city,
          }
        : null,
      cv: profile?.cvStorageId
        ? {
            url: cvUrl,
            fileName: profile.cvFileName ?? "CV.pdf",
          }
        : null,
      completedWork,
    };
  },
});

/**
 * MUTATION: deleteCvFromProfile
 * Removes the stored CV from both storage and the student profile record.
 */
export const deleteCvFromProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user || user.role !== "student") {
      throw new Error("Only students can manage CVs.");
    }

    const profile = await ctx.db
      .query("studentProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!profile) throw new Error("Student profile not found.");

    if (profile.cvStorageId) {
      try {
        await ctx.storage.delete(profile.cvStorageId);
      } catch {
        // Already gone
      }
    }

    await ctx.db.patch(profile._id, {
      cvStorageId: undefined,
      cvFileName: undefined,
      updatedAt: Date.now(),
    });
  },
});

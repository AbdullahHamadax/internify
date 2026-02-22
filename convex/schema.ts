import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/** 
 * ROLE VALIDATOR
 * This acts like a "Gatekeeper." It ensures the 'role' field is only one of these two words.
 * Example: If you try to save "admin", it will fail. It only accepts "student" or "employer".
 */
const roleValidator = v.union(v.literal("student"), v.literal("employer"));

/** 
 * ACADEMIC STATUS VALIDATOR
 * This limits the choice of education level.
 * Example: A user can be an "undergraduate" or a "graduate", but not a "highschooler".
 */
const academicStatusValidator = v.union(
  v.literal("undergraduate"),
  v.literal("graduate"),
);

/** 
 * RANK LEVEL VALIDATOR
 * This defines the seniority level for employers.
 * Example: Valid values include "mid" or "executive". If you type "junior", it won't work.
 */
const rankLevelValidator = v.union(
  v.literal("mid"),
  v.literal("senior"),
  v.literal("lead"),
  v.literal("manager"),
  v.literal("director"),
  v.literal("executive"),
);

export default defineSchema({
  /** 
   * USERS TABLE
   * This is the "Master List" of everyone who signs up.
   * Example row: { firstName: "Alice", email: "alice@uni.edu", role: "student" }
   */
  users: defineTable({
    tokenIdentifier: v.string(), // Example: A unique code from Clerk like "https://clerk.abc|123"
    clerkUserId: v.string(),     // Example: "user_2pXy..." (the ID Clerk gives this user)
    email: v.string(),           // Example: "hello@example.com"
    firstName: v.optional(v.string()), // Optional = can be left blank
    lastName: v.optional(v.string()),
    role: roleValidator,         // Must match the "student" or "employer" rule above
    createdAt: v.number(),       // Example: 1715856000 (the time the user was created)
    updatedAt: v.number(),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_clerkUserId", ["clerkUserId"]),

  /** 
   * STUDENT PROFILES TABLE
   * This holds extra data that only applies to students.
   * Example: A user named "Alice" has her main info in 'users' and her major here.
   */
  studentProfiles: defineTable({
    userId: v.id("users"), // Example: "jd769..." (This connects this profile to a ID in the 'users' table)
    academicStatus: academicStatusValidator, 
    fieldOfStudy: v.string(), // Example: "Computer Science"
    cvStorageId: v.optional(v.id("_storage")), // Example: A file ID for their uploaded PDF resume
    cvFileName: v.optional(v.string()),        // Example: "Alice_Resume_2024.pdf"
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  /** 
   * EMPLOYER PROFILES TABLE
   * This holds extra data that only applies to employers/bosses.
   * Example: A user named "Bob" might work at "Google" as a "Manager".
   */
  employerProfiles: defineTable({
    userId: v.id("users"),    // Connects this info to a specific person in the 'users' table
    companyName: v.string(),  // Example: "Tech Corp"
    position: v.string(),     // Example: "Hiring Manager"
    rankLevel: rankLevelValidator, // Must be one of the ranks like "mid" or "manager"
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),
});
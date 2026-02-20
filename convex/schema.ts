import { defineSchema, defineTable } from "convex/server";
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

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    clerkUserId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    role: roleValidator,
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_clerkUserId", ["clerkUserId"]),

  studentProfiles: defineTable({
    userId: v.id("users"),
    academicStatus: academicStatusValidator,
    fieldOfStudy: v.string(),
    cvStorageId: v.optional(v.id("_storage")),
    cvFileName: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  employerProfiles: defineTable({
    userId: v.id("users"),
    companyName: v.string(),
    position: v.string(),
    rankLevel: rankLevelValidator,
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),
});

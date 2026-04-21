import { mutation } from "./_generated/server";

/**
 * One-time migration: seed skillXp for all existing student profiles.
 *
 * For students WITH a CV uploaded (cvStorageId exists):
 *   → Each skill gets 200–400 random XP (represents "mentioned in CV")
 *
 * For students WITHOUT a CV:
 *   → Each skill gets 0 XP (Beginner)
 *
 * Skips profiles that already have skillXp populated.
 * Also ensures all profiles have the skillXp field so schema validation passes.
 */
export const seedAllStudentSkillXp = mutation({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("studentProfiles").collect();

    let seeded = 0;
    let skipped = 0;

    for (const profile of profiles) {
      // Skip profiles that already have skillXp populated
      if (profile.skillXp && profile.skillXp.length > 0) {
        skipped += 1;
        continue;
      }

      const skills = profile.skills ?? [];

      if (skills.length === 0) {
        // No skills — just ensure the field exists as empty array
        await ctx.db.patch(profile._id, { skillXp: [] });
        seeded += 1;
        continue;
      }

      const hasCv = !!profile.cvStorageId;

      const skillXp = skills.map((skill) => ({
        skill,
        xp: hasCv
          ? Math.floor(Math.random() * 201) + 200 // 200–400 XP for CV skills
          : 0, // 0 XP for non-CV skills
      }));

      await ctx.db.patch(profile._id, { skillXp });
      seeded += 1;
    }

    return { seeded, skipped, total: profiles.length };
  },
});

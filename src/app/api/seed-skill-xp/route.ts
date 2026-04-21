import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * POST /api/seed-skill-xp
 * One-time migration endpoint to seed skill XP for all existing student profiles.
 * Trigger manually once after deploying the schema change.
 */
export async function POST() {
  try {
    const result = await convex.mutation(api.seedSkillXp.seedAllStudentSkillXp);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Seed skill XP failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Migration failed" },
      { status: 500 },
    );
  }
}

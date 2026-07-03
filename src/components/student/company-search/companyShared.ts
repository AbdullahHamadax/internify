import type { FunctionReturnType } from "convex/server";
import type { api } from "../../../../convex/_generated/api";

/** A single company row from getCompaniesForStudent. */
export type Company = FunctionReturnType<
  typeof api.users.getCompaniesForStudent
>[number];

/** One open role nested inside a company. */
export type CompanyOpenRole = Company["openRoles"][number];

type SkillLevel = CompanyOpenRole["skillLevel"];

/**
 * Skill-level badge styling. Distinct hues per level (all paired with the
 * neobrutalist border so meaning never rides on color alone).
 */
export const LEVEL_META: Record<
  SkillLevel,
  { label: string; className: string }
> = {
  beginner: { label: "Beginner", className: "bg-[#A7F3D0] text-[#064E3B]" },
  intermediate: {
    label: "Intermediate",
    className: "bg-[#BFDBFE] text-[#1E3A8A]",
  },
  advanced: { label: "Advanced", className: "bg-[#FBCFE8] text-[#831843]" },
};

/**
 * Human-readable countdown to a deadline. `urgent` flags the last 48h (and
 * expired) so the UI can color it without re-deriving the threshold.
 */
export function formatDeadline(
  deadline: number,
  now = Date.now(),
): { label: string; urgent: boolean } {
  const ms = deadline - now;
  if (ms <= 0) return { label: "Expired", urgent: true };

  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor(ms / 3_600_000);

  if (days >= 14) return { label: `${Math.floor(days / 7)} weeks left`, urgent: false };
  if (days >= 1) return { label: `${days} day${days === 1 ? "" : "s"} left`, urgent: days <= 1 };
  return {
    label: hours <= 1 ? "Due within the hour" : `${hours} hours left`,
    urgent: true,
  };
}

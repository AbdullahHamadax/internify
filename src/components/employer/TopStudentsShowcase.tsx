"use client";

import { useId, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import {
  Sparkles,
  ArrowRight,
  Star,
  Code,
  PenTool,
  Database,
  Users,
  Loader2,
} from "lucide-react";
import { Typography } from "@/components/ui/Typography";
import { api } from "../../../convex/_generated/api";
import { useProfileModal } from "@/components/shared/ProfileModalContext";
import { skillMatchKey } from "@/lib/skillMatching";
import { SkillIcon } from "@/lib/skillIcon";
import type { Task } from "./TaskManagement";

import "./employer-showcase.css";

/* Card accent themes — cycled by rank. Kept from the original design. */
const THEMES = ["purple", "amber", "emerald", "blue"] as const;

/** Pick a role glyph from the student's title keywords. */
function getRoleIcon(role: string) {
  const r = role.toLowerCase();
  if (r.includes("design") || r.includes("ux") || r.includes("ui")) return PenTool;
  if (
    r.includes("data") ||
    r.includes("ml") ||
    r.includes("machine") ||
    r.includes("ai") ||
    r.includes("scien")
  )
    return Database;
  return Code;
}

function capitalize(str: string) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}

interface TopStudentsShowcaseProps {
  /** The employer's own tasks — their skills form the "posting history". */
  tasks: Task[];
  /** Dashboard navigation (e.g. to the talent search tab). */
  onNavigate: (id: string) => void;
  /** Start a conversation with a student and open Messages on it. */
  onInvite: (studentUserId: string) => Promise<void> | void;
}

export default function TopStudentsShowcase({
  tasks,
  onNavigate,
  onInvite,
}: TopStudentsShowcaseProps) {
  const sectionId = useId();
  const { openProfile } = useProfileModal();
  const students = useQuery(api.users.getStudentsForEmployer);
  const [invitingId, setInvitingId] = useState<string | null>(null);

  // The distinct set of skills this employer has asked for across all tasks.
  const postedSkillKeys = useMemo(() => {
    const set = new Set<string>();
    for (const t of tasks) {
      for (const s of t.skills ?? []) set.add(skillMatchKey(s));
    }
    return set;
  }, [tasks]);

  // Rank students by skill match against the posting history (when there is
  // one), then by blended rating and average AI score. Top 4 surface here.
  const topTalent = useMemo(() => {
    if (!students) return [];
    const hasHistory = postedSkillKeys.size > 0;

    return students
      .filter((s) => s.profile) // need a real profile to spotlight
      .map((s) => {
        const skills = s.profile?.skills ?? [];
        const overlap = skills.filter((sk) =>
          postedSkillKeys.has(skillMatchKey(sk)),
        ).length;
        const matchScore = hasHistory
          ? Math.round((overlap / postedSkillKeys.size) * 100)
          : null;

        const name =
          `${s.user.firstName ?? ""} ${s.user.lastName ?? ""}`.trim() ||
          "Anonymous Student";
        const role = s.profile?.title || "Student";
        const university = s.profile?.fieldOfStudy
          ? `${capitalize(s.profile.academicStatus || "")} in ${s.profile.fieldOfStudy}`.trim()
          : s.profile?.location || "Open to opportunities";

        // Match dominates ordering; rating then AI score break ties.
        const rankScore =
          (matchScore ?? 0) * 1000 +
          s.stats.rating * 100 +
          s.stats.avgScore;

        return {
          id: s.user._id,
          name,
          role,
          university,
          skills,
          matchScore,
          rating: s.stats.rating,
          ratedTaskCount: s.stats.ratedTaskCount,
          rankScore,
        };
      })
      .sort((a, b) => b.rankScore - a.rankScore)
      .slice(0, 4);
  }, [students, postedSkillKeys]);

  const handleInvite = async (userId: string) => {
    setInvitingId(userId);
    try {
      await onInvite(userId);
      // On success the dashboard switches to Messages and this unmounts.
    } catch (e) {
      console.error("Failed to start conversation:", e);
      setInvitingId(null);
    }
  };

  const isLoading = students === undefined;

  return (
    <section className="emp-showcase" aria-labelledby={`title-${sectionId}`}>
      {/* ── Header ── */}
      <div className="emp-showcase__header">
        <div className="emp-showcase__title-wrap">
          <div className="emp-showcase__icon-badge">
            <Sparkles className="size-5" />
          </div>
          <div>
            <Typography
              variant="h3"
              id={`title-${sectionId}`}
              className="emp-showcase__title"
            >
              Talent Spotlight
            </Typography>
            <Typography
              variant="p"
              color="muted"
              className="emp-showcase__subtitle"
            >
              {postedSkillKeys.size > 0
                ? "Top students matching the skills you post for."
                : "Top-performing students ready for your next task."}
            </Typography>
          </div>
        </div>

        <button
          type="button"
          className="emp-showcase__view-all"
          onClick={() => onNavigate("talent-search")}
        >
          <Typography variant="label" as="span">
            View Talent Directory
          </Typography>
          <ArrowRight className="size-4" />
        </button>
      </div>

      {/* ── States ── */}
      {isLoading ? (
        <div className="emp-showcase__empty">
          <Loader2 className="size-5 animate-spin" />
          <span>Finding your top matches…</span>
        </div>
      ) : topTalent.length === 0 ? (
        <div className="emp-showcase__empty">
          <Users className="size-5" />
          <span>
            No students to spotlight yet — they&apos;ll appear here as profiles
            fill out.
          </span>
        </div>
      ) : (
        /* ── Cards Grid ── */
        <div className="emp-showcase__grid">
          {topTalent.map((student, index) => {
            const Icon = getRoleIcon(student.role);
            const theme = THEMES[index % THEMES.length];
            const hasMatch =
              student.matchScore != null && student.matchScore > 0;
            const badgeLabel = hasMatch
              ? `${student.matchScore}% Match`
              : student.ratedTaskCount > 0
                ? `${student.rating.toFixed(1)} Rated`
                : "New Talent";

            return (
              <div
                key={student.id}
                className={`emp-talent-card emp-talent-card--${theme} cursor-pointer`}
                role="button"
                tabIndex={0}
                onClick={() => openProfile(student.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openProfile(student.id);
                  }
                }}
                title={`View ${student.name}'s profile`}
              >
                {/* Background gradient glow */}
                <div className="emp-talent-card__glow" />

                <div className="emp-talent-card__inner">
                  {/* Top Row: Avatar & Match/Rating badge */}
                  <div className="emp-talent-card__top">
                    <div className="emp-talent-card__avatar">
                      <span className="emp-talent-card__initials">
                        {student.name.charAt(0)}
                        {student.name.split(" ")[1]?.charAt(0)}
                      </span>
                    </div>

                    <div className="emp-talent-card__match">
                      <Star className="size-3.5 fill-current text-white" />
                      <Typography
                        variant="caption"
                        weight="bold"
                        className="text-white dark:text-white"
                      >
                        {badgeLabel}
                      </Typography>
                    </div>
                  </div>

                  {/* Middle: Details */}
                  <div className="emp-talent-card__details">
                    <Typography variant="h4" className="emp-talent-card__name">
                      {student.name}
                    </Typography>

                    <div className="emp-talent-card__role-row">
                      <Icon className="size-3.5 emp-talent-card__role-icon" />
                      <Typography
                        variant="span"
                        color="muted"
                        weight="medium"
                        className="emp-talent-card__role"
                      >
                        {student.role}
                      </Typography>
                    </div>

                    <Typography
                      variant="caption"
                      color="muted"
                      className="emp-talent-card__uni"
                    >
                      {student.university}
                    </Typography>
                  </div>

                  {/* Bottom: Skills & Action */}
                  <div className="emp-talent-card__bottom">
                    <div className="emp-talent-card__badges">
                      {student.skills.slice(0, 2).map((badge) => (
                        <span key={badge} className="emp-talent-card__badge">
                          <SkillIcon skill={badge} className="text-xs" />
                          {badge}
                        </span>
                      ))}
                      {student.skills.length > 2 && (
                        <span className="emp-talent-card__badge emp-talent-card__badge--more">
                          +{student.skills.length - 2}
                        </span>
                      )}
                      {student.skills.length === 0 && (
                        <span className="emp-talent-card__badge emp-talent-card__badge--more">
                          No skills listed
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="emp-talent-card__invite"
                      disabled={invitingId === student.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInvite(student.id);
                      }}
                    >
                      {invitingId === student.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        "Invite"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

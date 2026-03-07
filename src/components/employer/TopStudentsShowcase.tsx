"use client";

import { useId } from "react";
import {
  Sparkles,
  ArrowRight,
  Star,
  Code,
  PenTool,
  Database,
} from "lucide-react";
import { Typography } from "@/components/ui/Typography";

import "./employer-showcase.css";

/* ── Dummy Data ── */
const TOP_TALENT = [
  {
    id: "ts-1",
    name: "Sarah Johnson",
    role: "Full Stack Engineer",
    university: "Stanford University",
    matchScore: 98,
    badges: ["React", "Node.js", "System Design"],
    theme: "purple", // maps to css variables
    icon: Code,
  },
  {
    id: "ts-2",
    name: "Marcus Chen",
    role: "UI/UX Designer",
    university: "RISD",
    matchScore: 95,
    badges: ["Figma", "User Research", "Prototyping"],
    theme: "amber",
    icon: PenTool,
  },
  {
    id: "ts-3",
    name: "Elena Rodriguez",
    role: "Data Scientist",
    university: "MIT",
    matchScore: 94,
    badges: ["PyTorch", "Python", "ML Ops"],
    theme: "emerald",
    icon: Database,
  },
  {
    id: "ts-4",
    name: "David Kim",
    role: "Frontend Specialist",
    university: "UC Berkeley",
    matchScore: 91,
    badges: ["Next.js", "Three.js", "Animations"],
    theme: "blue",
    icon: Code,
  },
];

export default function TopStudentsShowcase() {
  const sectionId = useId();

  return (
    <section
      className="emp-showcase cursor-pointer"
      aria-labelledby={`title-${sectionId}`}
    >
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
              Top-performing students matching your posting history.
            </Typography>
          </div>
        </div>

        <button className="emp-showcase__view-all">
          <Typography variant="label" as="span">
            View Talent Directory
          </Typography>
          <ArrowRight className="size-4" />
        </button>
      </div>

      {/* ── Cards Grid ── */}
      <div className="emp-showcase__grid">
        {TOP_TALENT.map((student) => {
          const Icon = student.icon;
          return (
            <div
              key={student.id}
              className={`emp-talent-card emp-talent-card--${student.theme}`}
            >
              {/* Background gradient glow */}
              <div className="emp-talent-card__glow" />

              <div className="emp-talent-card__inner">
                {/* Top Row: Avatar & Match Score */}
                <div className="emp-talent-card__top">
                  <div className="emp-talent-card__avatar">
                    <span className="emp-talent-card__initials">
                      {student.name.charAt(0)}
                      {student.name.split(" ")[1]?.charAt(0)}
                    </span>
                  </div>

                  <div className="emp-talent-card__match">
                    <Star className="size-3.5 fill-current" />
                    <Typography variant="caption" weight="bold">
                      {student.matchScore}% Match
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
                    {student.badges.slice(0, 2).map((badge) => (
                      <span key={badge} className="emp-talent-card__badge">
                        {badge}
                      </span>
                    ))}
                    {student.badges.length > 2 && (
                      <span className="emp-talent-card__badge emp-talent-card__badge--more">
                        +{student.badges.length - 2}
                      </span>
                    )}
                  </div>

                  <button className="emp-talent-card__invite">Invite</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

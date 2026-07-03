"use client";

import {
  ArrowLeft,
  ArrowUpRight,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Layers,
  Users,
} from "lucide-react";
import { Typography } from "@/components/ui/Typography";
import { SkillIcon } from "@/lib/skillIcon";
import { getEmployerHiringMeta } from "@/lib/hiringStatus";
import {
  LEVEL_META,
  formatDeadline,
  type Company,
  type CompanyOpenRole,
} from "./companyShared";

interface CompanyDetailProps {
  company: Company;
  /** Task ids the student already applied to, for the "Applied" badge. */
  appliedTaskIds: Set<string>;
  /** Deep-links a single task: to Explore if new, to the dashboard if applied. */
  onOpenTask: (taskId: string) => void;
  onBack: () => void;
}

/**
 * Full company view inside the Companies tab (master → detail). Foregrounds the
 * company's actual open roles — the work itself, proof over claims — each of
 * which links straight into Explore so the student can act on it. No fabricated
 * "about us": the employer record carries no bio, so we show only real, derived
 * facts (status, the contact's position, engagement stats, and open roles).
 */
export default function CompanyDetail({
  company,
  appliedTaskIds,
  onOpenTask,
  onBack,
}: CompanyDetailProps) {
  const hiring = getEmployerHiringMeta(company.hiringStatus);
  const monogram = company.companyName.slice(0, 2).toUpperCase();
  const { openRoles, stats } = company;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 border-2 border-black bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-black shadow-[2px_2px_0_0_#000] transition-all hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_0_#000] dark:border-white dark:bg-black dark:text-white dark:shadow-[2px_2px_0_0_#fff] dark:hover:shadow-[4px_4px_0_0_#fff]"
      >
        <ArrowLeft className="size-4" strokeWidth={3} />
        All Companies
      </button>

      {/* ── Company header ── */}
      <header className="bg-card border-4 border-black dark:border-white p-6 sm:p-8 shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff]">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="size-24 shrink-0 border-4 border-black dark:border-white bg-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] overflow-hidden flex items-center justify-center">
            {company.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={company.logoUrl}
                alt={`${company.companyName} logo`}
                className="size-full object-contain"
              />
            ) : (
              <span className="text-3xl font-black uppercase text-[#2563EB]">
                {monogram}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <Typography
              variant="h1"
              className="text-3xl sm:text-4xl font-black uppercase tracking-tight leading-none m-0 break-words"
            >
              {company.companyName}
            </Typography>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center gap-2 border-2 border-black px-3 py-1 text-[11px] font-black uppercase tracking-widest shadow-[2px_2px_0_0_#000] dark:border-white dark:shadow-[2px_2px_0_0_#fff] ${hiring.badgeClassName}`}
              >
                <span
                  className={`size-2.5 border-2 border-black dark:border-white ${hiring.dotClassName}`}
                />
                {hiring.label}
              </span>
              {company.position && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <Briefcase className="size-4" />
                  {company.position}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stat strip */}
        <dl className="mt-8 grid grid-cols-3 border-t-4 border-black dark:border-white pt-6">
          <Stat
            icon={<Layers className="size-5 text-[#2563EB]" />}
            value={stats.openRoles}
            label="Available Tasks"
          />
          <Stat
            icon={<Users className="size-5 text-[#047857]" />}
            value={stats.hired}
            label="Talent Hired"
            divider
          />
          <Stat
            icon={<Briefcase className="size-5 text-foreground" />}
            value={stats.totalPosted}
            label="Total Posted"
          />
        </dl>
      </header>

      {/* ── Open roles ── */}
      <section className="mt-8">
        <Typography
          variant="h2"
          className="mb-4 inline-block bg-[#2563EB] px-3 py-1 text-lg font-black uppercase tracking-widest text-white border-2 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]"
        >
          Available Tasks
        </Typography>

        {openRoles.length === 0 ? (
          <div className="border-4 border-dashed border-[#C9D1DC] dark:border-zinc-700 bg-card p-10 text-center">
            <CalendarClock className="mx-auto mb-3 size-10 text-muted-foreground" />
            <Typography
              variant="p"
              className="font-black uppercase tracking-widest text-foreground m-0"
            >
              No available tasks right now
            </Typography>
            <Typography
              variant="p"
              className="mt-1 text-sm font-bold text-muted-foreground m-0"
            >
              Check back later — this company has posted{" "}
              {stats.totalPosted} task{stats.totalPosted === 1 ? "" : "s"} before.
            </Typography>
          </div>
        ) : (
          <ul className="space-y-4">
            {openRoles.map((role) => (
              <RoleRow
                key={role.id}
                role={role}
                applied={appliedTaskIds.has(String(role.id))}
                onOpen={() => onOpenTask(role.id)}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
  divider,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  divider?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-1 ${
        divider
          ? "border-x-2 border-black/15 dark:border-white/15"
          : ""
      }`}
    >
      {icon}
      <dd className="text-3xl font-black tabular-nums leading-none m-0">
        {value}
      </dd>
      <dt className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        {label}
      </dt>
    </div>
  );
}

/** A single open role — the whole row is the affordance into Explore. */
function RoleRow({
  role,
  applied,
  onOpen,
}: {
  role: CompanyOpenRole;
  applied: boolean;
  onOpen: () => void;
}) {
  const level = LEVEL_META[role.skillLevel];
  const deadline = formatDeadline(role.deadline);

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="group w-full text-left bg-card border-2 border-black dark:border-white p-5 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[7px_7px_0_0_#000] dark:hover:shadow-[7px_7px_0_0_#fff] focus-visible:outline-none focus-visible:-translate-x-1 focus-visible:-translate-y-1 focus-visible:shadow-[7px_7px_0_0_#2563EB]"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`border-2 border-black dark:border-white px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${level.className}`}
              >
                {level.label}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                {role.category}
              </span>
              {applied && (
                <span className="inline-flex items-center gap-1 border-2 border-black dark:border-white bg-[#047857] px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white">
                  <CheckCircle2 className="size-3" strokeWidth={3} />
                  Applied
                </span>
              )}
            </div>
            <Typography
              variant="h3"
              className="mt-2 text-lg font-black uppercase tracking-tight leading-tight m-0 break-words group-hover:text-[#2563EB] transition-colors"
            >
              {role.title}
            </Typography>
          </div>
          <ArrowUpRight
            className="size-6 shrink-0 text-muted-foreground transition-colors group-hover:text-[#2563EB]"
            strokeWidth={2.5}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          {role.skills.slice(0, 5).map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground/80"
            >
              <SkillIcon skill={skill} className="text-sm" />
              {skill}
            </span>
          ))}
          {role.skills.length > 5 && (
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              +{role.skills.length - 5}
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t-2 border-black/10 dark:border-white/10 pt-3 text-[11px] font-black uppercase tracking-widest">
          <span
            className={`inline-flex items-center gap-1.5 ${
              deadline.urgent
                ? "text-[#EA4335]"
                : "text-muted-foreground"
            }`}
          >
            <CalendarClock className="size-4" />
            {deadline.label}
          </span>
          {role.maxApplicants != null && (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Users className="size-4" />
              {role.applicantCount}/{role.maxApplicants} applied
            </span>
          )}
          <span className="ml-auto inline-flex items-center gap-1.5 text-[#2563EB]">
            <CheckCircle2 className="size-4" />
            View in Explore
          </span>
        </div>
      </button>
    </li>
  );
}

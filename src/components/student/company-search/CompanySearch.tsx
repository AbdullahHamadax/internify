"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import {
  ArrowUpRight,
  Briefcase,
  Building2,
  CalendarClock,
  CheckCircle2,
  Filter,
  Layers,
  Search,
  Users,
} from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { Typography } from "@/components/ui/Typography";
import { SkillIcon } from "@/lib/skillIcon";
import { SKILL_CATALOG } from "@/lib/skillCatalog";
import {
  entityMatchesSkillFilter,
  skillMatchKey,
} from "@/lib/skillMatching";
import {
  EMPLOYER_HIRING_OPTIONS,
  getEmployerHiringMeta,
  normalizeEmployerHiringStatus,
  type EmployerHiringStatus,
} from "@/lib/hiringStatus";
import CompanyDetail from "./CompanyDetail";
import { LEVEL_META, formatDeadline, type Company } from "./companyShared";

interface CompanySearchProps {
  /** Routes a focused task into the Explore tab (dashboard maps the prefix). */
  onNavigate: (id: string) => void;
}

// Companies with open roles rank above dormant ones; ties broken by hires.
function sortCompanies(a: Company, b: Company) {
  if (b.stats.openRoles !== a.stats.openRoles)
    return b.stats.openRoles - a.stats.openRoles;
  if (b.stats.hired !== a.stats.hired) return b.stats.hired - a.stats.hired;
  return a.companyName.localeCompare(b.companyName);
}

export default function CompanySearch({ onNavigate }: CompanySearchProps) {
  const companies = useQuery(api.users.getCompaniesForStudent);

  // Tasks this student already applied to. Used to badge them and to route a
  // click to the dashboard pipeline instead of an empty Explore focus view.
  const applications = useQuery(api.tasks.getStudentApplications);
  const appliedTaskIds = useMemo(
    () => new Set((applications ?? []).map((a) => String(a.taskId))),
    [applications],
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<
    EmployerHiringStatus[]
  >([]);
  const [skillSearchQuery, setSkillSearchQuery] = useState("");
  const [openOnly, setOpenOnly] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null,
  );

  const openTask = (taskId: string) =>
    onNavigate(
      appliedTaskIds.has(String(taskId))
        ? `dashboard-task:${taskId}`
        : `explore-task:${taskId}`,
    );

  // Master catalog + any extra skills companies actually hire for.
  const skillOptions = useMemo(() => {
    const byNorm = new Map<string, string>();
    for (const skill of SKILL_CATALOG) byNorm.set(skillMatchKey(skill), skill);
    for (const company of companies ?? [])
      for (const skill of company.skills) {
        const norm = skillMatchKey(skill);
        if (!byNorm.has(norm)) byNorm.set(norm, skill);
      }
    return Array.from(byNorm.values()).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
  }, [companies]);

  const filtered = useMemo(() => {
    if (!companies) return [];
    const q = searchQuery.trim().toLowerCase();
    return companies
      .filter((company) => {
        const matchesSearch =
          q === "" ||
          company.companyName.toLowerCase().includes(q) ||
          company.skills.some((s) => s.toLowerCase().includes(q)) ||
          company.categories.some((c) => c.toLowerCase().includes(q));
        const matchesSkills = entityMatchesSkillFilter(
          company.skills,
          selectedSkills,
        );
        const matchesStatus =
          selectedStatuses.length === 0 ||
          selectedStatuses.includes(
            normalizeEmployerHiringStatus(company.hiringStatus),
          );
        const matchesOpen = !openOnly || company.stats.openRoles > 0;
        return matchesSearch && matchesSkills && matchesStatus && matchesOpen;
      })
      .sort(sortCompanies);
  }, [companies, searchQuery, selectedSkills, selectedStatuses, openOnly]);

  const selectedCompany =
    selectedCompanyId != null
      ? (companies ?? []).find((c) => c.companyId === selectedCompanyId) ?? null
      : null;

  const toggleSkill = (skill: string) =>
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  const toggleStatus = (status: EmployerHiringStatus) =>
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  const clearAll = () => {
    setSearchQuery("");
    setSelectedSkills([]);
    setSelectedStatuses([]);
    setSkillSearchQuery("");
    setOpenOnly(false);
  };

  // Detail view takes over the whole tab (master → detail).
  if (selectedCompany) {
    return (
      <CompanyDetail
        company={selectedCompany}
        appliedTaskIds={appliedTaskIds}
        onOpenTask={openTask}
        onBack={() => setSelectedCompanyId(null)}
      />
    );
  }

  return (
    <div className="flex flex-col xl:flex-row gap-8 h-full animate-in fade-in duration-500">
      {/* ── Filter rail ── */}
      <aside className="w-full xl:w-72 shrink-0 space-y-6">
        <div className="bg-card dark:bg-zinc-900 border-4 border-border dark:border-zinc-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Filter className="w-5 h-5 text-foreground" />
            <Typography
              variant="h4"
              className="text-lg font-black uppercase tracking-widest m-0 px-2 bg-[#2563EB] text-white border-2 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]"
            >
              Filters
            </Typography>
          </div>

          <div className="space-y-6">
            {/* Open-roles toggle */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                className="sr-only"
                checked={openOnly}
                onChange={() => setOpenOnly((v) => !v)}
              />
              <div
                className={`size-5 flex items-center justify-center border-2 border-black shadow-[2px_2px_0_0_#000] transition-colors dark:border-white dark:shadow-[2px_2px_0_0_#fff] ${
                  openOnly
                    ? "bg-[#2563EB] text-white"
                    : "bg-white dark:bg-black group-hover:bg-[#DBEAFE]"
                }`}
              >
                {openOnly && <CheckCircle2 className="size-3" strokeWidth={4} />}
              </div>
              <span className="text-sm font-bold uppercase tracking-wider text-foreground/80 transition-colors group-hover:text-[#1D4ED8]">
                Has available tasks
              </span>
            </label>

            {/* Hiring status */}
            <div>
              <Typography
                variant="span"
                className="font-black mb-3 block text-foreground uppercase tracking-widest text-xs border-b-2 border-[#C9D1DC] dark:border-zinc-700 pb-1"
              >
                Hiring Status
              </Typography>
              <div className="space-y-3">
                {EMPLOYER_HIRING_OPTIONS.map((status) => {
                  const selected = selectedStatuses.includes(status.value);
                  return (
                    <label
                      key={status.value}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={selected}
                        onChange={() => toggleStatus(status.value)}
                      />
                      <div
                        className={`size-5 flex items-center justify-center border-2 border-black shadow-[2px_2px_0_0_#000] transition-colors dark:border-white dark:shadow-[2px_2px_0_0_#fff] ${
                          selected
                            ? status.badgeClassName
                            : "bg-white dark:bg-black group-hover:bg-[#DBEAFE]"
                        }`}
                      >
                        {selected && (
                          <CheckCircle2 className="size-3" strokeWidth={4} />
                        )}
                      </div>
                      <span className="text-sm font-bold uppercase tracking-wider text-foreground/80 transition-colors group-hover:text-[#1D4ED8]">
                        {status.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Skills they hire for */}
            <div className="flex flex-col">
              <Typography
                variant="span"
                className="font-black mb-3 block text-foreground uppercase tracking-widest text-xs border-b-2 border-[#C9D1DC] dark:border-zinc-700 pb-1"
              >
                Hires For
              </Typography>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-foreground" />
                <input
                  type="text"
                  placeholder="FIND A SKILL..."
                  value={skillSearchQuery}
                  onChange={(e) => setSkillSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-black border-2 border-black dark:border-white text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-0 transition-shadow shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] focus:shadow-[2px_2px_0_0_#000] dark:focus:shadow-[2px_2px_0_0_#fff]"
                />
              </div>
              <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto pr-1 pb-2">
                {(() => {
                  const visible = skillOptions.filter((s) =>
                    s.toLowerCase().includes(skillSearchQuery.toLowerCase()),
                  );
                  if (visible.length === 0)
                    return (
                      <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground py-4 text-center w-full border-2 border-dashed border-[#C9D1DC] dark:border-zinc-700 bg-white/60 dark:bg-zinc-950/40">
                        No skills found
                      </div>
                    );
                  return visible.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1 text-[11px] font-black uppercase tracking-wider border-2 border-black dark:border-white transition-colors duration-200 shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] focus:outline-none ${
                        selectedSkills.includes(skill)
                          ? "bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                          : "bg-white dark:bg-black text-foreground hover:bg-[#DBEAFE] hover:text-[#1D4ED8]"
                      }`}
                    >
                      {skill.toUpperCase()}
                    </button>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="relative mb-6 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="size-6 text-foreground" />
          </div>
          <input
            type="text"
            className="w-full pl-14 pr-4 py-4 bg-card border-4 border-border text-base md:text-lg font-black uppercase tracking-widest focus:outline-none focus:ring-0 transition-all shadow-[4px_4px_0_0_var(--border)] focus:shadow-[8px_8px_0_0_var(--border)] text-foreground placeholder-muted-foreground"
            placeholder="Search companies, skills, or fields..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="mb-6 flex items-center justify-between">
          <Typography
            variant="p"
            className="text-sm font-black uppercase tracking-widest text-muted-foreground m-0"
          >
            {companies === undefined ? (
              "Loading companies…"
            ) : (
              <>
                Showing{" "}
                <strong className="text-foreground">{filtered.length}</strong>{" "}
                {filtered.length === 1 ? "company" : "companies"}
              </>
            )}
          </Typography>
        </div>

        {companies === undefined ? (
          <CompanyGridSkeleton />
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center border-4 border-dashed border-black dark:border-white bg-card">
            <Building2 className="size-12 text-muted-foreground mx-auto mb-4" />
            <Typography
              variant="h3"
              className="text-2xl font-black uppercase tracking-widest text-foreground mb-2"
            >
              No companies found
            </Typography>
            <Typography
              variant="p"
              className="text-foreground/80 font-bold text-sm max-w-md mx-auto"
            >
              Try adjusting your filters or search to discover more companies.
            </Typography>
            <button
              type="button"
              onClick={clearAll}
              className="mt-6 px-6 py-3 bg-[#2563EB] text-white border-2 border-black dark:border-white font-black uppercase tracking-widest shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_0_#000] dark:hover:shadow-[6px_6px_0_0_#fff] transition-all"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pb-10">
            {filtered.map((company) => (
              <CompanyCard
                key={company.companyId}
                company={company}
                appliedTaskIds={appliedTaskIds}
                onOpen={() => setSelectedCompanyId(company.companyId)}
                onOpenTask={openTask}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CompanyCard({
  company,
  appliedTaskIds,
  onOpen,
  onOpenTask,
}: {
  company: Company;
  appliedTaskIds: Set<string>;
  onOpen: () => void;
  onOpenTask: (taskId: string) => void;
}) {
  const hiring = getEmployerHiringMeta(company.hiringStatus);
  const monogram = company.companyName.slice(0, 2).toUpperCase();
  const preview = company.openRoles.slice(0, 2);
  const { stats } = company;

  return (
    <div className="bg-card border-4 border-black dark:border-white p-6 shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff] transition-all duration-200 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0_0_#000] dark:hover:shadow-[12px_12px_0_0_#fff] flex flex-col group">
      {/* Header */}
      <div className="flex gap-4 items-start">
        <button
          type="button"
          onClick={onOpen}
          className="size-14 shrink-0 border-4 border-black dark:border-white bg-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] overflow-hidden flex items-center justify-center transition-transform hover:scale-[1.03]"
          title={`View ${company.companyName}`}
        >
          {company.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={company.logoUrl}
              alt={`${company.companyName} logo`}
              className="size-full object-contain"
            />
          ) : (
            <span className="text-lg font-black uppercase text-[#2563EB]">
              {monogram}
            </span>
          )}
        </button>
        <div className="min-w-0 flex-1 pt-0.5">
          <button
            type="button"
            onClick={onOpen}
            className="text-left block w-full"
          >
            <Typography
              variant="h3"
              className="text-xl font-black uppercase tracking-tight m-0 leading-none break-words group-hover:text-[#2563EB] transition-colors hover:underline decoration-2 underline-offset-2"
            >
              {company.companyName}
            </Typography>
          </button>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0_0_#000] dark:border-white dark:shadow-[2px_2px_0_0_#fff] ${hiring.badgeClassName}`}
            >
              <span
                className={`size-2 border border-black dark:border-white ${hiring.dotClassName}`}
              />
              {hiring.label}
            </span>
            {company.position && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate">
                {company.position}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stat strip */}
      <div className="mt-5 grid grid-cols-3 border-y-4 border-black dark:border-white py-3 text-center">
        <CardStat icon={<Layers className="size-4 text-[#2563EB]" />} value={stats.openRoles} label="Tasks" />
        <CardStat icon={<Users className="size-4 text-[#047857]" />} value={stats.hired} label="Hired" divider />
        <CardStat icon={<Briefcase className="size-4 text-foreground" />} value={stats.totalPosted} label="Posted" />
      </div>

      {/* Open-role preview — the hero of the card */}
      <div className="mt-5 flex-1">
        <Typography
          variant="span"
          className="text-[10px] font-black uppercase tracking-widest text-muted-foreground"
        >
          {stats.openRoles > 0 ? "Available Tasks" : "No available tasks"}
        </Typography>
        {preview.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {preview.map((role) => {
              const level = LEVEL_META[role.skillLevel];
              const deadline = formatDeadline(role.deadline);
              const applied = appliedTaskIds.has(String(role.id));
              return (
                <li key={role.id}>
                  <button
                    type="button"
                    onClick={() => onOpenTask(role.id)}
                    className="group/role w-full text-left flex items-center gap-3 border-2 border-black dark:border-white bg-white dark:bg-black px-3 py-2 shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] transition-all hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_0_#2563EB] focus-visible:outline-none focus-visible:shadow-[4px_4px_0_0_#2563EB]"
                  >
                    <span
                      className={`shrink-0 border-2 border-black dark:border-white px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${level.className}`}
                    >
                      {level.label[0]}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs font-black uppercase tracking-wide">
                      {role.title}
                    </span>
                    {applied ? (
                      <span className="shrink-0 inline-flex items-center gap-1 border-2 border-black dark:border-white bg-[#047857] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                        <CheckCircle2 className="size-3" strokeWidth={3} />
                        Applied
                      </span>
                    ) : (
                      <span
                        className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${
                          deadline.urgent ? "text-[#EA4335]" : "text-muted-foreground"
                        }`}
                      >
                        <CalendarClock className="size-3" />
                        {deadline.label}
                      </span>
                    )}
                    <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover/role:text-[#2563EB]" />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 text-xs font-bold text-muted-foreground border-2 border-dashed border-[#C9D1DC] dark:border-zinc-700 px-3 py-3">
            This company isn&apos;t hiring for tasks right now.
          </p>
        )}
      </div>

      {/* Skill tags */}
      {company.skills.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {company.skills.slice(0, 4).map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1.5 px-2 py-1 border-2 border-black dark:border-white bg-[#2563EB] text-white text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]"
            >
              <SkillIcon skill={skill} className="text-xs" />
              {skill}
            </span>
          ))}
          {company.skills.length > 4 && (
            <span className="inline-flex items-center px-2 py-1 border-2 border-dashed border-black dark:border-white bg-surface text-foreground text-[10px] font-black uppercase tracking-widest">
              +{company.skills.length - 4}
            </span>
          )}
        </div>
      )}

      {/* CTA */}
      <button
        type="button"
        onClick={onOpen}
        className="mt-5 w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white border-4 border-black dark:border-white font-black uppercase tracking-widest text-sm shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_0_#000] dark:hover:shadow-[6px_6px_0_0_#fff] transition-all"
      >
        {stats.openRoles > 0
          ? `View ${stats.openRoles} Task${stats.openRoles === 1 ? "" : "s"}`
          : "View Company"}
      </button>
    </div>
  );
}

function CardStat({
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
      className={`flex flex-col items-center gap-0.5 ${
        divider ? "border-x-2 border-black/15 dark:border-white/15" : ""
      }`}
    >
      {icon}
      <span className="text-lg font-black tabular-nums leading-none">
        {value}
      </span>
      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function CompanyGridSkeleton() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pb-10" aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-card border-4 border-[#C9D1DC] dark:border-zinc-700 p-6 animate-pulse"
        >
          <div className="flex gap-4">
            <div className="size-14 bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-5 w-2/3 bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3 w-1/3 bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
          <div className="mt-5 h-14 bg-zinc-100 dark:bg-zinc-900 border-y-4 border-zinc-200 dark:border-zinc-800" />
          <div className="mt-5 space-y-2">
            <div className="h-9 bg-zinc-100 dark:bg-zinc-900" />
            <div className="h-9 bg-zinc-100 dark:bg-zinc-900" />
          </div>
          <div className="mt-5 h-11 bg-zinc-200 dark:bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}

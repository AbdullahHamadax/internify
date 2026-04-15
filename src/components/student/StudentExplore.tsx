"use client";

import deviconData from "devicon/devicon.json";

const ICON_MAPPINGS: Record<string, string> = {
  Vue: "vuejs",
  HTML: "html5",
  CSS: "css3",
  Express: "express",
  TensorFlow: "tensorFlow",
};

function getDeviconClass(skillName: string) {
  if (ICON_MAPPINGS[skillName]) {
    return `devicon-${ICON_MAPPINGS[skillName]}-plain colored`;
  }
  const match = (
    deviconData as Array<{ name: string; altnames: string[] }>
  ).find(
    (icon) =>
      icon.name === skillName.toLowerCase() ||
      icon.altnames.includes(skillName.toLowerCase()),
  );
  return match ? `devicon-${match.name}-plain colored` : null;
}

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Filter,
  Clock,
  ChevronDown,
  Loader2,
  Inbox,
  X,
  FileText,
  CheckCircle2,
  Users,
  Download,
  Image as ImageIcon,
} from "lucide-react";
import { Typography } from "@/components/ui/Typography";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useProfileModal } from "@/components/shared/ProfileModalContext";
import { SKILL_CATALOG } from "@/lib/skillCatalog";
import { entityMatchesSkillFilter, skillMatchKey } from "@/lib/skillMatching";
import { useLiveNow } from "@/lib/useLiveNow";

// ── Helpers ──

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

function deadlineToDuration(deadline: number, now: number): string {
  const diff = deadline - now;
  if (diff <= 0) return "Expired";
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 7) return `${days} day${days !== 1 ? "s" : ""}`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks !== 1 ? "s" : ""}`;
  const months = Math.floor(days / 30);
  return `${months} month${months !== 1 ? "s" : ""}`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Animations ──

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

export type StudentExploreProps = {
  /** When set (e.g. from notifications), opens this task’s detail drawer once it appears in browse results. */
  focusTaskId?: string | null;
  onFocusTaskConsumed?: () => void;
};

export default function StudentExplore({
  focusTaskId = null,
  onFocusTaskConsumed,
}: StudentExploreProps = {}) {
  const now = useLiveNow();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSkillLevels, setActiveSkillLevels] = useState<string[]>([]);
  const [selectedCoreSkills, setSelectedCoreSkills] = useState<string[]>([]);
  const [skillSearchQuery, setSkillSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [showAcceptSuccess, setShowAcceptSuccess] = useState(false);

  const openTaskDetail = useCallback(
    (task: NonNullable<typeof selectedTask>) => {
      setShowAcceptSuccess(false);
      setSelectedTask(task);
    },
    [],
  );

  const closeTaskDetail = useCallback(() => {
    setSelectedTask(null);
    setShowAcceptSuccess(false);
  }, []);
  const [previewAttachment, setPreviewAttachment] = useState<{
    url: string;
    type: string;
    name: string;
  } | null>(null);

  const tasks = useQuery(api.tasks.browseTasks);
  const acceptTask = useMutation(api.tasks.acceptTask);
  const { openProfile } = useProfileModal();
  const activeTasks = useMemo(
    () => (tasks ?? []).filter((task) => task.deadline > now),
    [now, tasks],
  );
  const isSelectedTaskExpired =
    selectedTask !== null ? selectedTask.deadline <= now : false;

  useEffect(() => {
    if (!focusTaskId || tasks === undefined) return;
    const match = activeTasks.find((t) => String(t._id) === focusTaskId);
    if (match) {
      openTaskDetail(match);
    }
    onFocusTaskConsumed?.();
  }, [activeTasks, focusTaskId, onFocusTaskConsumed, openTaskDetail, tasks]);

  // Category filter groups — each maps to one or more DB categories
  const categoryFilters: { label: string; match: string[] }[] = [
    { label: "All", match: [] },
    {
      label: "Development",
      match: ["Web Development", "Mobile Development", "DevOps"],
    },
    { label: "Design", match: ["UI/UX Design"] },
    { label: "Data & AI", match: ["Data Science", "Machine Learning"] },
    { label: "Writing", match: ["Content Writing", "Marketing"] },
    { label: "Cloud & Security", match: ["Cloud Computing", "Cybersecurity"] },
  ];

  const toggleSkillLevel = (level: string) => {
    setActiveSkillLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level],
    );
  };

  const toggleCoreSkill = (skill: string) => {
    setSelectedCoreSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  };

  // Render master skills + any extra skills that currently exist in browse results.
  // Extras only show up if they're not already present in the master catalog.
  const skillOptionsSorted = useMemo(() => {
    const byNorm = new Map<string, string>();

    for (const skill of SKILL_CATALOG) {
      byNorm.set(skillMatchKey(skill), skill);
    }

    for (const task of activeTasks) {
      for (const skill of task.skills ?? []) {
        const norm = skillMatchKey(skill);
        if (!byNorm.has(norm)) byNorm.set(norm, skill);
      }
    }

    return Array.from(byNorm.values()).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
  }, [activeTasks]);

  // Apply client-side filtering + sorting
  const filteredTasks = activeTasks
    .filter((task) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        task.title.toLowerCase().includes(q) ||
        task.description.toLowerCase().includes(q) ||
        task.skills.some((s) => s.toLowerCase().includes(q)) ||
        task.companyName.toLowerCase().includes(q);

      const activeCat = categoryFilters.find((f) => f.label === activeCategory);
      const matchesCategory =
        activeCategory === "All" ||
        (activeCat?.match ?? []).some(
          (m) => task.category.toLowerCase() === m.toLowerCase(),
        );

      const matchesSkillLevel =
        activeSkillLevels.length === 0 ||
        activeSkillLevels.includes(task.skillLevel);

      const matchesCoreSkills = entityMatchesSkillFilter(
        task.skills,
        selectedCoreSkills,
      );

      return (
        matchesSearch &&
        matchesCategory &&
        matchesSkillLevel &&
        matchesCoreSkills
      );
    })
    .sort((a, b) =>
      sortOrder === "newest"
        ? b.createdAt - a.createdAt
        : a.createdAt - b.createdAt,
    );

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="min-h-[calc(100vh-4rem)] bg-zinc-50 dark:bg-zinc-950/50"
    >
      {/* Search Header */}
      <motion.div
        variants={itemVariants}
        className="max-w-7xl mx-auto px-6 md:px-12 pt-6"
      >
        <div className="stu-hero flex-col lg:flex-row w-full items-start lg:items-center gap-6 lg:gap-12">
          <Typography
            variant="h1"
            color="white"
            className="tracking-tight leading-none shrink-0 text-3xl md:text-5xl"
          >
            Find Your Next <br />
            <span className="stu-hero__accent inline-block mt-2">
              Opportunity.
            </span>
          </Typography>

          <div className="flex flex-col sm:flex-row gap-4 w-full flex-1 max-w-4xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by keywords, skills, or company..."
                className="w-full h-12 pl-10 pr-4 bg-background border-2 border-black dark:border-white text-foreground placeholder:text-muted-foreground rounded-none focus:outline-none focus:ring-0 transition-all shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#2563EB] text-sm font-bold"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="h-12 px-8 bg-black text-white dark:bg-white dark:text-black font-black uppercase tracking-widest text-sm rounded-none hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all shadow-[4px_4px_0_0_white] dark:shadow-[4px_4px_0_0_#2563EB] border-2 border-black dark:border-white flex items-center justify-center">
              Search
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Content Layout — aligned with employer Talent Search filter panel */}
      <div className="max-w-7xl mx-auto p-6 md:px-12 md:py-10 flex flex-col xl:flex-row gap-8">
        <motion.div
          variants={itemVariants}
          className="w-full xl:w-72 shrink-0"
          role="complementary"
          aria-label="Task filters"
        >
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
              <div>
                <Typography
                  variant="span"
                  className="font-black mb-3 block text-foreground uppercase tracking-widest text-xs border-b-2 border-[#C9D1DC] dark:border-zinc-700 pb-1"
                >
                  Category
                </Typography>
                <div className="space-y-2 mt-3">
                  {categoryFilters.map((f) => (
                    <button
                      key={f.label}
                      type="button"
                      onClick={() => setActiveCategory(f.label)}
                      className={`w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest transition-colors duration-200 border-2 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] ${
                        activeCategory === f.label
                          ? "bg-[#AB47BC] text-white hover:bg-[#8E24AA]"
                          : "bg-white dark:bg-black text-foreground hover:bg-[#F3E5F5] hover:text-[#7B1FA2] dark:hover:bg-zinc-800"
                      }`}
                    >
                      {f.label.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Typography
                  variant="span"
                  className="font-black mb-3 block text-foreground uppercase tracking-widest text-xs border-b-2 border-[#C9D1DC] dark:border-zinc-700 pb-1"
                >
                  Skill Level
                </Typography>
                <div className="space-y-3">
                  {(["beginner", "intermediate", "advanced"] as const).map(
                    (level) => {
                      const isChecked = activeSkillLevels.includes(level);
                      return (
                        <label
                          key={level}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={isChecked}
                            onChange={() => toggleSkillLevel(level)}
                          />
                          <div
                            className={`size-5 flex shrink-0 items-center justify-center border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] transition-colors ${
                              isChecked
                                ? "bg-[#2563EB] text-white group-hover:bg-[#1D4ED8]"
                                : "bg-white dark:bg-black group-hover:bg-[#DBEAFE]"
                            }`}
                          >
                            {isChecked && (
                              <CheckCircle2
                                className="size-3"
                                strokeWidth={4}
                              />
                            )}
                          </div>
                          <span className="text-sm font-bold uppercase tracking-wider text-foreground/80 group-hover:text-[#1D4ED8] transition-colors">
                            {level}
                          </span>
                        </label>
                      );
                    },
                  )}
                </div>
              </div>

              <div className="flex flex-col">
                <Typography
                  variant="span"
                  className="font-black mb-3 block text-foreground uppercase tracking-widest text-xs border-b-2 border-[#C9D1DC] dark:border-zinc-700 pb-1"
                >
                  Core Skills
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
                <div className="flex flex-wrap gap-2 max-h-[280px] overflow-y-auto pr-1 pb-2">
                  {skillOptionsSorted.filter((skill) =>
                    skill
                      .toLowerCase()
                      .includes(skillSearchQuery.toLowerCase()),
                  ).length === 0 ? (
                    <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground py-4 text-center w-full border-2 border-dashed border-[#C9D1DC] dark:border-zinc-700 bg-white/60 dark:bg-zinc-950/40">
                      No skills found
                    </div>
                  ) : (
                    skillOptionsSorted
                      .filter((skill) =>
                        skill
                          .toLowerCase()
                          .includes(skillSearchQuery.toLowerCase()),
                      )
                      .map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleCoreSkill(skill)}
                          className={`px-3 py-1 text-[11px] font-black uppercase tracking-wider border-2 border-black dark:border-white transition-colors duration-200 shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] focus:outline-none ${
                            selectedCoreSkills.includes(skill)
                              ? "bg-[#AB47BC] text-white hover:bg-[#8E24AA]"
                              : "bg-white dark:bg-black text-foreground hover:bg-[#F3E5F5] hover:text-[#7B1FA2]"
                          }`}
                        >
                          {skill.toUpperCase()}
                        </button>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Task Feed */}
        <div className="flex-1 min-w-0 space-y-6">
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-between mb-2"
          >
            <Typography variant="span" color="muted">
              {tasks === undefined
                ? "Loading tasks…"
                : `Showing ${filteredTasks.length} task${filteredTasks.length !== 1 ? "s" : ""}`}
            </Typography>
            <button
              onClick={() =>
                setSortOrder((o) => (o === "newest" ? "oldest" : "newest"))
              }
              className="text-sm font-black uppercase tracking-wider flex items-center gap-1 hover:underline decoration-2 transition-all"
            >
              Sort by: {sortOrder === "newest" ? "Newest" : "Oldest"}{" "}
              <ChevronDown
                className={`w-4 h-4 transition-transform ${sortOrder === "oldest" ? "rotate-180" : ""}`}
              />
            </button>
          </motion.div>

          {/* Loading State */}
          {tasks === undefined && (
            <motion.div
              variants={itemVariants}
              className="flex flex-col items-center justify-center py-20 text-muted-foreground"
            >
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <Typography variant="p" color="muted">
                Loading available tasks…
              </Typography>
            </motion.div>
          )}

          {/* Empty State */}
          {tasks !== undefined && filteredTasks.length === 0 && (
            <motion.div
              variants={itemVariants}
              className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-card border border-border rounded-xl"
            >
              <Inbox className="w-12 h-12 mb-4 opacity-40" />
              <Typography variant="h3" className="mb-2">
                No tasks available
              </Typography>
              <Typography variant="p" color="muted">
                {searchQuery ||
                activeCategory !== "All" ||
                activeSkillLevels.length > 0 ||
                selectedCoreSkills.length > 0
                  ? "Try adjusting your search or filters."
                  : "Check back later — new tasks are posted regularly."}
              </Typography>
              {(searchQuery ||
                activeCategory !== "All" ||
                activeSkillLevels.length > 0 ||
                selectedCoreSkills.length > 0) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("All");
                    setActiveSkillLevels([]);
                    setSelectedCoreSkills([]);
                    setSkillSearchQuery("");
                  }}
                  className="mt-6 px-6 py-3 bg-[#2563EB] text-white border-2 border-black dark:border-white font-black uppercase tracking-widest text-xs shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </motion.div>
          )}

          {/* Task Cards */}
          <div className="grid grid-cols-1 gap-4">
            {filteredTasks.map((task) => (
              <div
                key={task._id}
                onClick={() => openTaskDetail(task)}
                className="group w-full min-w-0 bg-white dark:bg-black border-2 border-black dark:border-white p-6 transition-all cursor-pointer shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#2563EB] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0_0_#000] dark:hover:shadow-[4px_4px_0_0_#2563EB] block"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] ${
                          task.skillLevel === "advanced"
                            ? "bg-[#E11D48] text-white"
                            : task.skillLevel === "intermediate"
                              ? "bg-[#AB47BC] text-white"
                              : "bg-[#2563EB] text-white"
                        }`}
                      >
                        {capitalize(task.skillLevel)}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Posted {timeAgo(task.createdAt)}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" /> {task.applicantCount || 0}
                        {task.maxApplicants ? `/${task.maxApplicants}` : ""}
                      </span>
                    </div>
                    <Typography
                      variant="h3"
                      className="group-hover:underline decoration-4 underline-offset-4 transition-all mb-2 truncate block w-full"
                    >
                      {task.title}
                    </Typography>
                    <Typography
                      variant="span"
                      className="font-medium mt-1 inline-block cursor-pointer hover:underline decoration-2 underline-offset-2 hover:text-[#2563EB] transition-colors"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        if (task.employerId) openProfile(task.employerId);
                      }}
                    >
                      {task.companyName}
                    </Typography>
                  </div>

                  <div className="flex flex-row sm:flex-col items-center sm:items-end gap-4 sm:gap-2 shrink-0">
                    <span className="text-[10px] font-black px-3 py-1 bg-black text-white dark:bg-white dark:text-black uppercase tracking-widest border-2 border-black dark:border-white">
                      {task.category}
                    </span>
                    <div
                      className={`flex items-center gap-1.5 text-sm font-black uppercase tracking-widest cursor-default border-2 border-black dark:border-white px-3 py-1 shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] ${
                        deadlineToDuration(task.deadline, now) === "Expired"
                          ? "bg-[#DC2626] text-white"
                          : ""
                      }`}
                      title={`Deadline: ${new Date(task.deadline).toLocaleString()}`}
                    >
                      <Clock className="w-4 h-4" />
                      {deadlineToDuration(task.deadline, now)}
                    </div>
                  </div>
                </div>

                <Typography
                  variant="p"
                  color="muted"
                  className="mb-6 line-clamp-2 wrap-break-word"
                >
                  {task.description}
                </Typography>

                <div className="flex flex-wrap items-center justify-between gap-4 border-t-4 border-black dark:border-white pt-6 mt-auto">
                  <div className="flex flex-wrap gap-2">
                    {task.skills.slice(0, 3).map((tag: string) => {
                      const devicon = getDeviconClass(tag);
                      return (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-black dark:border-white bg-[#2563EB] dark:bg-black text-[11px] font-black uppercase tracking-wider text-white dark:text-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#2563EB] transition-colors"
                        >
                          {devicon && (
                            <i className={`${devicon} text-[14px]`} />
                          )}
                          {tag}
                        </span>
                      );
                    })}
                    {task.skills.length > 3 && (
                      <span className="inline-flex items-center px-3 py-1.5 border-2 border-black dark:border-white text-[11px] font-black uppercase tracking-wider text-muted-foreground shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]">
                        +{task.skills.length - 3} skills
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openTaskDetail(task);
                    }}
                    className="px-6 py-3 bg-[#2563EB] text-white dark:bg-[#2563EB]  border-2 border-black dark:border-white font-black text-sm uppercase tracking-widest hover:translate-y-1 hover:translate-x-1 transition-all shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] hover:shadow-none"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* View & Apply Drawer */}
      <AnimatePresence>
        {selectedTask && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeTaskDetail}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-100"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-xl bg-background border-l-4 border-black dark:border-white z-101 flex flex-col shadow-[-8px_0_0_0_rgba(0,0,0,0.1)] overflow-hidden"
            >
              <div className="flex items-start justify-between p-6 border-b-4 border-black dark:border-white bg-[#2563EB] dark:bg-black text-white">
                <div className="flex-1 min-w-0 pr-4">
                  <Typography
                    variant="h2"
                    className="mb-3 font-black uppercase tracking-widest text-2xl text-white wrap-break-word"
                  >
                    {selectedTask.title}
                  </Typography>

                  {/* Company row */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-bold text-white/90">
                      {selectedTask.companyName}
                    </span>
                    {selectedTask.employerId && (
                      <button
                        onClick={() => openProfile(selectedTask.employerId)}
                        className="text-xs font-black uppercase tracking-wider px-2.5 py-1 border-2 border-white/60 hover:border-white hover:bg-white/10 transition-all"
                        title={`View ${selectedTask.companyName}'s profile`}
                      >
                        View Profile
                      </button>
                    )}
                  </div>

                  {/* Meta badges row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 border-2 border-white/50 bg-white/15">
                      {capitalize(selectedTask.skillLevel)}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 border-2 border-white/50 bg-white/15 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {selectedTask.applicantCount || 0}
                      {selectedTask.maxApplicants
                        ? `/${selectedTask.maxApplicants}`
                        : ""}{" "}
                      Applications
                    </span>
                  </div>
                </div>
                <button
                  onClick={closeTaskDetail}
                  className="p-2 border-2 border-white/60 hover:border-white transition-all hover:bg-white hover:text-[#2563EB] dark:hover:bg-white dark:hover:text-black shrink-0"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Details */}
                <section>
                  <Typography variant="h4" className="mb-3">
                    About the Task
                  </Typography>
                  <Typography
                    variant="p"
                    className="text-sm whitespace-pre-wrap wrap-break-word leading-relaxed text-foreground/80"
                  >
                    {selectedTask.description}
                  </Typography>
                </section>

                <section>
                  <Typography variant="h4" className="mb-3">
                    Required Skills
                  </Typography>
                  <div className="flex flex-wrap gap-2">
                    {selectedTask.skills.map((tag: string) => {
                      const devicon = getDeviconClass(tag);
                      return (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-black dark:border-white bg-[#2563EB] dark:bg-black text-[11px] font-black uppercase tracking-wider text-white dark:text-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#2563EB] transition-colors"
                        >
                          {devicon && (
                            <i className={`${devicon} text-[14px]`} />
                          )}
                          {tag}
                        </span>
                      );
                    })}
                  </div>
                </section>

                {selectedTask.resolvedAttachments &&
                  selectedTask.resolvedAttachments.length > 0 && (
                    <section>
                      <Typography variant="h4" className="mb-3">
                        Attachments
                      </Typography>
                      <div className="flex flex-col gap-2">
                        {selectedTask.resolvedAttachments.map(
                          (att: {
                            storageId: string;
                            name: string;
                            url: string;
                            type: string;
                          }) => {
                            const isImage = att.type.startsWith("image/");

                            return (
                              <button
                                key={att.storageId}
                                onClick={() => setPreviewAttachment(att)}
                                className="group flex flex-col sm:flex-row sm:items-center justify-between p-3 border-2 border-black dark:border-white bg-card hover:bg-muted transition-colors text-left"
                              >
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <div className="p-2 border-2 border-transparent group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors shrink-0">
                                    {isImage ? (
                                      <ImageIcon className="w-4 h-4" />
                                    ) : (
                                      <FileText className="w-4 h-4" />
                                    )}
                                  </div>
                                  <div className="flex flex-col overflow-hidden">
                                    <span className="text-sm font-bold truncate group-hover:underline decoration-2 underline-offset-2">
                                      {att.name}
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#2563EB] mt-0.5">
                                      {isImage
                                        ? "Image Preview"
                                        : "PDF Preview"}
                                    </span>
                                  </div>
                                </div>
                              </button>
                            );
                          },
                        )}
                      </div>
                    </section>
                  )}
              </div>

              <div className="p-6 border-t-4 border-black dark:border-white bg-card">
                {showAcceptSuccess ? (
                  <div className="space-y-4">
                    <div className="flex gap-3 p-4 border-4 border-black dark:border-white bg-[#A7F3D0] text-black shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]">
                      <CheckCircle2
                        className="w-8 h-8 shrink-0"
                        strokeWidth={2.5}
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <p className="font-black uppercase tracking-widest text-sm">
                          Task accepted
                        </p>
                        <p className="text-sm font-bold mt-1 leading-snug">
                          &ldquo;{selectedTask.title}&rdquo; is now yours. Open
                          your dashboard to track it in your active pipeline.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={closeTaskDetail}
                      className="w-full py-4 bg-black dark:bg-white text-white dark:text-black border-4 border-black dark:border-white font-black transition-all shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#fff] hover:-translate-y-1 hover:-translate-x-1 flex items-center justify-center gap-2 text-base uppercase tracking-widest"
                    >
                      Close
                    </button>
                  </div>
                ) : isSelectedTaskExpired ? (
                  <div className="w-full border-4 border-black dark:border-white bg-[#FCA5A5] p-4 text-center shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#fff]">
                    <p className="font-black uppercase tracking-widest text-sm">
                      Deadline passed
                    </p>
                    <p className="mt-1 text-sm font-bold leading-snug">
                      This task just expired, so it can no longer be accepted. It
                      will disappear from Explore automatically.
                    </p>
                  </div>
                ) : (
                  <button
                    disabled={isAccepting}
                    onClick={async () => {
                      if (!selectedTask) return;
                      if (selectedTask.deadline <= now) {
                        alert("This task deadline has already passed.");
                        return;
                      }

                      setIsAccepting(true);
                      try {
                        await acceptTask({ taskId: selectedTask._id });
                        setShowAcceptSuccess(true);
                      } catch (err: unknown) {
                        const message =
                          err instanceof Error
                            ? err.message
                            : "Failed to accept task";
                        alert(message);
                      } finally {
                        setIsAccepting(false);
                      }
                    }}
                    className="w-full py-4 bg-[#2563EB] hover:bg-[#2563EB] text-white border-4 border-black dark:border-white font-black transition-all shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#fff] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0_0_#000] dark:hover:shadow-[8px_8px_0_0_#fff] flex items-center justify-center gap-2 text-base uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAccepting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Accepting…
                      </>
                    ) : (
                      <>
                        <FileText className="w-5 h-5" /> Accept Task
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Attachment Preview Modal */}
      <AnimatePresence>
        {previewAttachment && (
          <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewAttachment(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-background border-4 border-black dark:border-white shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b-4 border-black dark:border-white bg-[#A7F3D0] text-black">
                <Typography
                  variant="h4"
                  className="truncate pr-4 font-black uppercase tracking-widest border-r-4 border-transparent"
                >
                  {previewAttachment.name}
                </Typography>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="hidden sm:inline-block text-xs font-black uppercase tracking-widest px-2 py-1 border-2 border-black shadow-[2px_2px_0_0_#000]">
                    Verified by Internify
                  </span>
                  <a
                    href={previewAttachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 border-2 border-black hover:bg-black hover:text-[#A7F3D0] transition-colors"
                    title="Download Original"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                  <button
                    onClick={() => setPreviewAttachment(null)}
                    className="p-1 border-2 border-black hover:bg-black hover:text-[#A7F3D0] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto bg-muted/50 p-4 sm:p-8 flex justify-center items-center">
                {previewAttachment.type.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewAttachment.url}
                    alt={previewAttachment.name}
                    className="max-w-full max-h-full object-contain border-4 border-black dark:border-white shadow-[4px_4px_0_0_#000]"
                  />
                ) : previewAttachment.type === "application/pdf" ? (
                  <iframe
                    src={`${previewAttachment.url}#toolbar=0`}
                    className="w-full h-full min-h-[60vh] border-4 border-black dark:border-white shadow-[4px_4px_0_0_#000]"
                    title={previewAttachment.name}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground w-full">
                    <FileText className="w-16 h-16 mb-4 opacity-50" />
                    <Typography variant="h3" className="mb-2 uppercase">
                      Preview Not Available
                    </Typography>
                    <Typography variant="p">
                      This file type cannot be previewed in the browser.
                    </Typography>
                    <a
                      href={previewAttachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 px-6 py-2 bg-black text-[#A7F3D0] hover:translate-x-[2px] hover:translate-y-[2px] transition-all border-4 border-black inline-flex items-center gap-2 font-black uppercase tracking-widest shadow-[4px_4px_0_0_#000] hover:shadow-none"
                    >
                      <Download className="w-4 h-4" /> Download File
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

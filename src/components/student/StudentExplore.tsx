"use client";

import deviconData from "devicon/devicon.json";

function getDeviconClass(skillName: string) {
  const match = (
    deviconData as Array<{ name: string; altnames: string[] }>
  ).find(
    (icon) =>
      icon.name === skillName.toLowerCase() ||
      icon.altnames.includes(skillName.toLowerCase()),
  );
  return match ? `devicon-${match.name}-plain colored` : null;
}

import { useState } from "react";
import { Search, Filter, Clock, ChevronDown, Loader2, Inbox } from "lucide-react";
import { Typography } from "@/components/ui/Typography";
import { motion, Variants } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

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

function deadlineToDuration(deadline: number): string {
  const diff = deadline - Date.now();
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

export default function StudentExplore() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSkillLevels, setActiveSkillLevels] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const tasks = useQuery(api.tasks.browseTasks);

  // Category filter groups — each maps to one or more DB categories
  const categoryFilters: { label: string; match: string[] }[] = [
    { label: "All", match: [] },
    { label: "Development", match: ["Web Development", "Mobile Development", "DevOps"] },
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

  // Apply client-side filtering + sorting
  const filteredTasks = (tasks ?? [])
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

      return matchesSearch && matchesCategory && matchesSkillLevel;
    })
    .sort((a, b) =>
      sortOrder === "newest" ? b.createdAt - a.createdAt : a.createdAt - b.createdAt,
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
        className="max-w-6xl mx-auto px-6 md:px-12 pt-6"
      >
        <div className="stu-hero flex-col lg:flex-row w-full items-start lg:items-center gap-6 lg:gap-12">
          <Typography
            variant="h1"
            className="tracking-tight leading-none shrink-0 text-3xl md:text-5xl"
          >
            Find Your Next <br />
            <span className="stu-hero__accent">Opportunity.</span>
          </Typography>

          <div className="flex flex-col sm:flex-row gap-4 w-full flex-1 max-w-4xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by keywords, skills, or company..."
                className="w-full h-11 pl-12 pr-4 bg-card border border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all shadow-sm text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="h-11 px-8 bg-foreground text-background font-bold uppercase tracking-widest text-sm rounded-xl hover:bg-primary/90 hover:text-primary-foreground transition-colors shrink-0 shadow-sm flex items-center justify-center">
              Search
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Content Layout */}
      <div className="max-w-6xl mx-auto p-6 md:px-12 md:py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <motion.div variants={itemVariants} className="lg:col-span-1 space-y-8">
          <div>
            <Typography
              variant="label"
              className="uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2"
            >
              <Filter className="w-4 h-4" /> Category
            </Typography>
            <div className="space-y-1 mt-4">
              {categoryFilters.map((f) => (
                <button
                  key={f.label}
                  onClick={() => setActiveCategory(f.label)}
                  className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors rounded-lg ${
                    activeCategory === f.label
                      ? "bg-emerald-50 text-emerald-900 border border-emerald-200 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
                      : "border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-border/50">
            <Typography
              variant="label"
              className="uppercase tracking-widest text-muted-foreground mb-4 block"
            >
              Skill Level
            </Typography>
            <div className="space-y-3 mt-4">
              {(["beginner", "intermediate", "advanced"] as const).map((level) => {
                const isChecked = activeSkillLevels.includes(level);
                return (
                  <button
                    key={level}
                    onClick={() => toggleSkillLevel(level)}
                    className="flex items-center gap-3 cursor-pointer group w-full text-left"
                  >
                    <div
                      className={`w-5 h-5 border-2 rounded transition-colors flex items-center justify-center ${
                        isChecked
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-muted-foreground group-hover:border-emerald-500"
                      }`}
                    >
                      {isChecked && (
                        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                          <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm group-hover:text-foreground transition-colors capitalize">
                      {level}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Task Feed */}
        <div className="lg:col-span-3 space-y-6">
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
              onClick={() => setSortOrder((o) => (o === "newest" ? "oldest" : "newest"))}
              className="text-sm font-bold flex items-center gap-1 hover:text-emerald-500 transition-colors"
            >
              Sort by: {sortOrder === "newest" ? "Newest" : "Oldest"} <ChevronDown className={`w-4 h-4 transition-transform ${sortOrder === "oldest" ? "rotate-180" : ""}`} />
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
                {searchQuery || activeCategory !== "All" || activeSkillLevels.length > 0
                  ? "Try adjusting your search or filters."
                  : "Check back later — new tasks are posted regularly."}
              </Typography>
            </motion.div>
          )}

          {/* Task Cards */}
          <div className="grid grid-cols-1 gap-4">
            {filteredTasks.map((task, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 24, delay: index * 0.08 }}
                key={task._id}
                className="group bg-card border border-border rounded-xl p-6 hover:border-blue-500/50 transition-all cursor-pointer shadow-sm hover:shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${
                          task.skillLevel === "advanced"
                            ? "bg-red-600/10 text-red-700 dark:bg-red-500/20 dark:text-red-500"
                            : task.skillLevel === "intermediate"
                              ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {capitalize(task.skillLevel)}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">
                        Posted {timeAgo(task.createdAt)}
                      </span>
                    </div>
                    <Typography
                      variant="h3"
                      className="group-hover:text-blue-500 transition-colors"
                    >
                      {task.title}
                    </Typography>
                    <Typography
                      variant="span"
                      className="font-medium mt-1 inline-block"
                    >
                      {task.companyName}
                    </Typography>
                  </div>

                  <div className="flex flex-row sm:flex-col items-center sm:items-end gap-4 sm:gap-2 shrink-0">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      {task.category}
                    </span>
                    <div
                      className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium cursor-default"
                      title={`Deadline: ${new Date(task.deadline).toLocaleString()}`}
                    >
                      <Clock className="w-4 h-4" />
                      {deadlineToDuration(task.deadline)}
                    </div>
                  </div>
                </div>

                <Typography
                  variant="p"
                  color="muted"
                  className="mb-6 line-clamp-2"
                >
                  {task.description}
                </Typography>

                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/50 pt-4">
                  <div className="flex flex-wrap gap-2">
                    {task.skills.map((tag) => {
                      const devicon = getDeviconClass(tag);
                      return (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-muted/60 text-xs font-medium text-foreground/80 dark:bg-muted/40 transition-colors hover:bg-muted/80 hover:border-foreground/20"
                        >
                          {devicon && (
                            <i className={`${devicon} text-[14px]`} />
                          )}
                          {tag}
                        </span>
                      );
                    })}
                  </div>
                  <button className="px-6 py-2 bg-foreground text-background rounded-lg font-bold text-sm uppercase tracking-wider hover:bg-emerald-500 hover:text-black transition-colors">
                    View & Apply
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

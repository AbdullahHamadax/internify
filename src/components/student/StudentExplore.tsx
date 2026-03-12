"use client";

import Image from "next/image";

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

import { useState } from "react";
import {
  Search,
  Filter,
  Clock,
  ChevronDown,
  Loader2,
  Inbox,
  X,
  UploadCloud,
  FileText,
} from "lucide-react";
import { Typography } from "@/components/ui/Typography";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  const { user } = useUser();

  const tasks = useQuery(api.tasks.browseTasks);

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
        className="max-w-6xl mx-auto px-6 md:px-12 pt-6"
      >
        <div className="stu-hero flex-col lg:flex-row w-full items-start lg:items-center gap-6 lg:gap-12">
          <Typography
            variant="h1"
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
                className="w-full h-12 pl-12 pr-4 bg-background border-2 border-black dark:border-white text-foreground placeholder:text-muted-foreground rounded-none focus:outline-none focus:ring-0 transition-all shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#3B82F6] text-sm font-bold"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="h-12 px-8 bg-black text-[#3B82F6] dark:bg-white dark:text-black font-black uppercase tracking-widest text-sm rounded-none hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all shadow-[4px_4px_0_0_#3B82F6] dark:shadow-[4px_4px_0_0_#3B82F6] border-2 border-black dark:border-white flex items-center justify-center">
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
              <Filter className="w-5 h-5" strokeWidth={2.5} /> CATEGORY
            </Typography>
            <div className="space-y-1 mt-4">
              {categoryFilters.map((f) => (
                <button
                  key={f.label}
                  onClick={() => setActiveCategory(f.label)}
                  className={`w-full text-left px-4 py-3 text-sm font-black uppercase tracking-wider transition-all border-2 ${
                    activeCategory === f.label
                      ? "bg-[#3B82F6] text-white border-black dark:bg-[#3B82F6] shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]"
                      : "bg-white dark:bg-black text-black dark:text-white border-black dark:border-white hover:bg-gray-100 dark:hover:bg-gray-900"
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
              className="uppercase tracking-widest text-muted-foreground mb-4 block font-black"
            >
              Skill Level
            </Typography>
            <div className="space-y-3 mt-4">
              {(["beginner", "intermediate", "advanced"] as const).map(
                (level) => {
                  const isChecked = activeSkillLevels.includes(level);
                  return (
                    <button
                      key={level}
                      onClick={() => toggleSkillLevel(level)}
                      className="flex items-center gap-3 cursor-pointer group w-full text-left"
                    >
                      <div
                        className={`w-6 h-6 border-2 transition-colors flex items-center justify-center rounded-none ${
                          isChecked
                            ? "bg-[#3B82F6] border-black text-white dark:bg-[#3B82F6] dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]"
                            : "bg-white dark:bg-black border-black dark:border-white"
                        }`}
                      >
                        {isChecked && (
                          <svg
                            className="w-3 h-3"
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <path
                              d="M2.5 6L5 8.5L9.5 3.5"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm font-black uppercase tracking-wider group-hover:underline decoration-2 transition-all">
                        {level}
                      </span>
                    </button>
                  );
                },
              )}
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
                activeSkillLevels.length > 0
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
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 24,
                  delay: index * 0.08,
                }}
                key={task._id}
                onClick={() => setSelectedTask(task)}
                className="group bg-white dark:bg-black border-2 border-black dark:border-white p-6 transition-all cursor-pointer shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#3B82F6] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0_0_#000] dark:hover:shadow-[4px_4px_0_0_#3B82F6] block"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] ${
                          task.skillLevel === "advanced"
                            ? "bg-[#FF0055] text-white"
                            : task.skillLevel === "intermediate"
                              ? "bg-[#AB47BC] text-white"
                              : "bg-[#3B82F6] text-white"
                        }`}
                      >
                        {capitalize(task.skillLevel)}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Posted {timeAgo(task.createdAt)}
                      </span>
                    </div>
                    <Typography
                      variant="h3"
                      className="group-hover:underline decoration-4 underline-offset-4 transition-all mb-2"
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
                    <span className="text-[10px] font-black px-3 py-1 bg-black text-white dark:bg-white dark:text-black uppercase tracking-widest border-2 border-black dark:border-white">
                      {task.category}
                    </span>
                    <div
                      className={`flex items-center gap-1.5 text-sm font-black uppercase tracking-widest cursor-default border-2 border-black dark:border-white px-3 py-1 shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] ${
                        deadlineToDuration(task.deadline) === "Expired"
                          ? "bg-[#DC2626] text-white"
                          : ""
                      }`}
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
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-black dark:border-white bg-[#3B82F6] dark:bg-black text-[11px] font-black uppercase tracking-wider text-white dark:text-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#3B82F6] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
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
                      setSelectedTask(task);
                    }}
                    className="px-6 py-3 bg-[#3B82F6] text-white dark:bg-[#3B82F6]  border-2 border-black dark:border-white font-black text-sm uppercase tracking-widest hover:translate-y-1 hover:translate-x-1 transition-all shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] hover:shadow-none"
                  >
                    View
                  </button>
                </div>
              </motion.div>
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
              onClick={() => setSelectedTask(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-xl bg-background border-l-4 border-black dark:border-white z-[101] flex flex-col shadow-[-8px_0_0_0_rgba(0,0,0,0.1)] overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b-4 border-black dark:border-white bg-[#3B82F6] dark:bg-black text-white">
                <div>
                  <Typography
                    variant="h2"
                    className="mb-1 font-black uppercase tracking-widest text-2xl text-white"
                  >
                    {selectedTask.title}
                  </Typography>
                  <Typography variant="p" className="text-sm m-0 text-white/80">
                    {selectedTask.companyName} •{" "}
                    {capitalize(selectedTask.skillLevel)}
                  </Typography>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-2 border-2 border-black dark:border-white transition-all hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black shrink-0"
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
                    className="text-sm whitespace-pre-wrap break-words leading-relaxed text-foreground/80"
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
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-black dark:border-white bg-[#3B82F6] dark:bg-black text-[11px] font-black uppercase tracking-wider text-white dark:text-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#3B82F6] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
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

                <hr className="border-t-4 border-black dark:border-white" />

                {/* Apply Section */}
                <section className="bg-white dark:bg-black border-4 border-black dark:border-white p-5 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]">
                  <Typography
                    variant="h3"
                    className="mb-4 text-[#FF3D00] dark:text-[#FF3D00] font-black uppercase tracking-wider"
                  >
                    Your Application
                  </Typography>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-black border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]">
                      <div className="w-10 h-10 border-2 border-black dark:border-white bg-[#3B82F6] flex items-center justify-center shrink-0">
                        {user?.imageUrl ? (
                          <Image
                            src={user.imageUrl}
                            alt="Profile"
                            width={40}
                            height={40}
                            className="w-10 h-10 object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="text-black font-bold">
                            {user?.firstName?.[0] || "S"}
                          </div>
                        )}
                      </div>
                      <div>
                        <Typography
                          variant="p"
                          className="font-semibold text-sm m-0"
                        >
                          {user?.fullName || "Student User"}
                        </Typography>
                        <Typography
                          variant="p"
                          className="text-xs text-muted-foreground m-0"
                        >
                          {user?.primaryEmailAddress?.emailAddress ||
                            "student@university.edu"}
                        </Typography>
                      </div>
                    </div>

                    <div>
                      <Typography
                        variant="label"
                        className="block text-sm font-medium mb-1.5 text-foreground/80"
                      >
                        CV / Resume (Optional)
                      </Typography>
                      <button className="w-full flex items-center justify-center gap-2 py-4 border-4 border-dashed border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors font-bold uppercase tracking-wider text-sm shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]">
                        <UploadCloud className="w-5 h-5" />
                        Upload PDF or Word Document
                      </button>
                    </div>

                    <div>
                      <Typography
                        variant="label"
                        className="block text-sm font-medium mb-1.5 text-foreground/80"
                      >
                        Message to Employer (Optional)
                      </Typography>
                      <textarea
                        rows={3}
                        className="w-full p-3 bg-transparent border-2 border-black dark:border-white text-sm focus:outline-none focus:ring-4 focus:ring-[#3B82F6] resize-y"
                        placeholder="Why are you a great fit for this task?"
                      ></textarea>
                    </div>
                  </div>
                </section>
              </div>

              <div className="p-6 border-t-4 border-black dark:border-white bg-card">
                <button
                  onClick={() => {
                    alert("Application submitted! (Mock)");
                    setSelectedTask(null);
                  }}
                  className="w-full py-4 bg-[#3B82F6] hover:bg-[#2563EB] text-white border-4 border-black dark:border-white font-black transition-all shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#fff] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0_0_#000] dark:hover:shadow-[8px_8px_0_0_#fff] flex items-center justify-center gap-2 text-base uppercase tracking-widest"
                >
                  <FileText className="w-5 h-5" />
                  Accept Task
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

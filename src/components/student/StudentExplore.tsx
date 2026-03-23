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

import { useState } from "react";
import {
  Search,
  Filter,
  Clock,
  ChevronDown,
  Loader2,
  Inbox,
  X,
  FileText,
  Users,
  Download,
  Image as ImageIcon,
} from "lucide-react";
import { Typography } from "@/components/ui/Typography";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useProfileModal } from "@/components/shared/ProfileModalContext";

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
  const [isAccepting, setIsAccepting] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<{
    url: string;
    type: string;
    name: string;
  } | null>(null);

  const tasks = useQuery(api.tasks.browseTasks);
  const acceptTask = useMutation(api.tasks.acceptTask);
  const { openProfile } = useProfileModal();

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
                      ? "bg-[#AB47BC] text-white border-black dark:bg-[#2563EB] shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]"
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
                            ? "bg-[#AB47BC] border-black text-white dark:bg-[#AB47BC] dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]"
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
            {filteredTasks.map((task) => (
              <div
                key={task._id}
                onClick={() => setSelectedTask(task)}
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
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-black dark:border-white bg-[#2563EB] dark:bg-black text-[11px] font-black uppercase tracking-wider text-white dark:text-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#2563EB] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
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
              onClick={() => setSelectedTask(null)}
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
                  onClick={() => setSelectedTask(null)}
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
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-black dark:border-white bg-[#2563EB] dark:bg-black text-[11px] font-black uppercase tracking-wider text-white dark:text-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#2563EB] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
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
                <button
                  disabled={isAccepting}
                  onClick={async () => {
                    if (!selectedTask) return;
                    setIsAccepting(true);
                    try {
                      await acceptTask({ taskId: selectedTask._id });
                      setSelectedTask(null);
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

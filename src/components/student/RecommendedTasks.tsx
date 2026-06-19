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

import { useState, useMemo } from "react";
import {
  Sparkles,
  Clock,
  Users,
  Loader2,
  Inbox,
  TrendingUp,
  Zap,
  Target,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { Typography } from "@/components/ui/Typography";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useProfileModal } from "@/components/shared/ProfileModalContext";
import { useLiveNow } from "@/lib/useLiveNow";
import { useConvexTokenReady } from "@/lib/convexAuth";

/* ── Helpers ── */

function deadlineToDuration(deadline: number, now: number): string {
  const diff = deadline - now;
  if (diff <= 0) return "Expired";
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 7) return `${days}d left`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w left`;
  const months = Math.floor(days / 30);
  return `${months}mo left`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getMatchColor(score: number): string {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 65) return "bg-[#2563EB]";
  if (score >= 45) return "bg-[#AB47BC]";
  return "bg-zinc-500";
}

function getMatchLabel(score: number): string {
  if (score >= 85) return "Perfect Match";
  if (score >= 65) return "Strong Match";
  if (score >= 45) return "Good Match";
  return "Possible Match";
}

function getMatchIcon(score: number) {
  if (score >= 85) return <Zap className="w-3 h-3" />;
  if (score >= 65) return <Target className="w-3 h-3" />;
  return <TrendingUp className="w-3 h-3" />;
}

/* ── Animations ── */

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 26 },
  },
};

const cardHover = {
  rest: { y: 0, boxShadow: "8px 8px 0px 0px #000" },
  hover: { y: -4, boxShadow: "12px 12px 0px 0px #000" },
};

/* ── Types ── */

interface RecommendedTask {
  taskId: string;
  title: string;
  description: string;
  category: string;
  skillLevel: "beginner" | "intermediate" | "advanced";
  skills: string[];
  deadline: number;
  maxApplicants?: number;
  applicantCount?: number;
  createdAt: number;
  companyName: string;
  employerId: string;
  matchScore: number;
  matchedSkills: string[];
  unmatchedSkills: string[];
  skillLevelDetails: {
    skill: string;
    studentLevel: "beginner" | "intermediate" | "advanced";
    taskLevel: "beginner" | "intermediate" | "advanced";
    eligible: boolean;
    fitScore: number;
  }[];
  matchReason: string;
  matchTier: "perfect" | "strong" | "good" | "possible";
}

export type RecommendedTasksProps = {
  onNavigate?: (id: string) => void;
};

export default function RecommendedTasks({ onNavigate }: RecommendedTasksProps) {
  const now = useLiveNow();
  const isConvexTokenReady = useConvexTokenReady();
  const recommendations = useQuery(
    api.recommendations.getRecommendedTasks,
    isConvexTokenReady ? {} : "skip",
  ) as RecommendedTask[] | undefined;
  const acceptTask = useMutation(api.tasks.acceptTask);
  const { openProfile } = useProfileModal();

  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "perfect" | "strong" | "good">("all");

  const filteredRecs = useMemo(() => {
    if (!recommendations) return [];
    return recommendations.filter((rec) => {
      if (filter === "all") return true;
      if (filter === "perfect") return rec.matchScore >= 85;
      if (filter === "strong") return rec.matchScore >= 65;
      return rec.matchScore >= 45;
    });
  }, [recommendations, filter]);

  const handleAccept = async (taskId: string) => {
    try {
      setAcceptingId(taskId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await acceptTask({ taskId: taskId as any });
      setAcceptedIds((prev) => new Set(prev).add(taskId));
    } catch (err) {
      console.error("Failed to accept task:", err);
    } finally {
      setAcceptingId(null);
    }
  };

  const perfectCount = recommendations?.filter((r) => r.matchScore >= 85).length ?? 0;
  const strongCount = recommendations?.filter((r) => r.matchScore >= 65 && r.matchScore < 85).length ?? 0;

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="min-h-[calc(100vh-4rem)] bg-zinc-50 dark:bg-zinc-950/50"
    >
      {/* Hero Header */}
      <motion.div variants={itemVariants} className="max-w-7xl mx-auto px-6 md:px-12 pt-6">
        <div className="stu-hero flex-col lg:flex-row w-full items-start lg:items-center gap-6 lg:gap-12">
          <div className="flex-1">
            <Typography
              variant="h1"
              color="white"
              className="tracking-tight leading-none text-3xl md:text-5xl"
            >
              Curated <br />
              <span className="stu-hero__accent inline-block mt-2">For You.</span>
            </Typography>
            <Typography
              variant="p"
              className="text-white/90 text-sm md:text-base leading-relaxed mt-3 max-w-xl"
            >
              Tasks matched to your skills and experience level — powered by our intelligent
              recommendation engine.
            </Typography>
          </div>
          {recommendations && recommendations.length > 0 && (
            <div className="flex gap-3 shrink-0">
              {perfectCount > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white border-2 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]">
                  <Zap className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-widest">
                    {perfectCount} Perfect
                  </span>
                </div>
              )}
              {strongCount > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white border-2 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]">
                  <Target className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-widest">
                    {strongCount} Strong
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6 md:px-12 md:py-10">
        {/* Filter Bar */}
        {recommendations && recommendations.length > 0 && (
          <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3 mb-8">
            {(
              [
                { key: "all", label: "All Matches", count: recommendations.length },
                { key: "perfect", label: "Perfect", count: perfectCount },
                { key: "strong", label: "Strong+", count: recommendations.filter((r) => r.matchScore >= 65).length },
                { key: "good", label: "Good+", count: recommendations.filter((r) => r.matchScore >= 45).length },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 text-xs font-black uppercase tracking-widest border-2 border-black dark:border-white transition-all shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_#000] dark:hover:shadow-[2px_2px_0_0_#fff] ${
                  filter === f.key
                    ? "bg-[#2563EB] text-white"
                    : "bg-white dark:bg-black text-foreground"
                }`}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </motion.div>
        )}

        {/* Loading */}
        {recommendations === undefined && (
          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center justify-center py-24 text-muted-foreground"
          >
            <div className="relative mb-6">
              <div className="w-16 h-16 border-4 border-black dark:border-white flex items-center justify-center bg-[#2563EB] shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#fff]">
                <Sparkles className="w-8 h-8 text-white animate-pulse" />
              </div>
            </div>
            <Typography variant="h3" className="mb-2">
              Analyzing your skills...
            </Typography>
            <Typography variant="p" color="muted">
              Finding the best task matches for your profile
            </Typography>
            <Loader2 className="w-6 h-6 animate-spin mt-4 text-[#2563EB]" />
          </motion.div>
        )}

        {/* Empty State */}
        {recommendations !== undefined && recommendations.length === 0 && (
          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-20 h-20 border-4 border-black dark:border-white flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#fff] mb-6">
              <Inbox className="w-10 h-10 text-muted-foreground" />
            </div>
            <Typography variant="h3" className="mb-2">
              No recommendations yet
            </Typography>
            <Typography variant="p" color="muted" className="max-w-md mb-6">
              Make sure your profile has skills listed so we can match you with the right tasks.
              You can also browse all available tasks.
            </Typography>
            <button
              onClick={() => onNavigate?.("explore")}
              className="px-8 py-3 bg-[#2563EB] text-white border-2 border-black dark:border-white font-black uppercase tracking-widest text-xs shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none flex items-center gap-2"
            >
              Browse All Tasks
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* No filter results */}
        {recommendations !== undefined &&
          recommendations.length > 0 &&
          filteredRecs.length === 0 && (
            <motion.div
              variants={itemVariants}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <Typography variant="h4" className="mb-2">
                No matches at this filter level
              </Typography>
              <Typography variant="p" color="muted" className="mb-4">
                Try a broader filter to see more recommendations.
              </Typography>
              <button
                onClick={() => setFilter("all")}
                className="px-6 py-2 bg-[#2563EB] text-white border-2 border-black dark:border-white font-black uppercase tracking-widest text-xs shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_#000]"
              >
                Show All
              </button>
            </motion.div>
          )}

        {/* Recommendation Cards */}
        <AnimatePresence mode="popLayout">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {filteredRecs.map((rec, idx) => {
              const isAccepted = acceptedIds.has(rec.taskId);
              const isAccepting = acceptingId === rec.taskId;

              return (
                <motion.div
                  key={rec.taskId}
                  variants={itemVariants}
                  initial="rest"
                  whileHover="hover"
                  layout
                  className="relative group"
                >
                  {/* Rank badge for top 3 */}
                  {idx < 3 && filter === "all" && (
                    <div className="absolute -top-3 -left-3 z-10 w-8 h-8 bg-[#FCD34D] border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] flex items-center justify-center">
                      <span className="text-xs font-black text-black">#{idx + 1}</span>
                    </div>
                  )}

                  <motion.div
                    variants={cardHover}
                    className="bg-white dark:bg-black border-2 border-black dark:border-white p-6 flex flex-col h-full transition-colors shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#2563EB]"
                  >
                    {/* Top row: match badge + category */}
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] ${getMatchColor(rec.matchScore)}`}
                      >
                        {getMatchIcon(rec.matchScore)}
                        {rec.matchScore}% — {getMatchLabel(rec.matchScore)}
                      </div>
                      <span className="text-[10px] font-black px-2.5 py-1 bg-black text-white dark:bg-white dark:text-black uppercase tracking-widest border-2 border-black dark:border-white">
                        {rec.category}
                      </span>
                    </div>

                    {/* Title + Company */}
                    <Typography
                      variant="h3"
                      className="mb-1 leading-tight group-hover:text-[#2563EB] transition-colors line-clamp-2"
                    >
                      {rec.title}
                    </Typography>
                    <Typography
                      variant="span"
                      className="font-medium text-sm mb-3 cursor-pointer hover:underline decoration-2 underline-offset-2 hover:text-[#2563EB] transition-colors inline-block"
                      onClick={() => rec.employerId && openProfile(rec.employerId)}
                    >
                      {rec.companyName}
                    </Typography>

                    {/* Description */}
                    <Typography
                      variant="p"
                      color="muted"
                      className="text-sm mb-4 line-clamp-2 flex-1"
                    >
                      {rec.description}
                    </Typography>

                    {/* Match reason */}
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#2563EB] dark:text-[#60A5FA] uppercase tracking-wider mb-4 px-2 py-1.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                      <Sparkles className="w-3 h-3 shrink-0" />
                      <span className="truncate">{rec.matchReason}</span>
                    </div>

                    {/* Skills (highlight matched) */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {rec.skills.slice(0, 4).map((skill) => {
                        const isMatched = rec.matchedSkills.includes(skill);
                        const devicon = getDeviconClass(skill);
                        return (
                          <span
                            key={skill}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] transition-colors ${
                              isMatched
                                ? "bg-[#2563EB] text-white"
                                : "bg-zinc-100 dark:bg-zinc-900 text-foreground/60"
                            }`}
                          >
                            {devicon && <i className={`${devicon} text-[12px]`} />}
                            {skill}
                          </span>
                        );
                      })}
                      {rec.skills.length > 4 && (
                        <span className="inline-flex items-center px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border-2 border-black dark:border-white text-muted-foreground">
                          +{rec.skills.length - 4}
                        </span>
                      )}
                    </div>

                    {/* Bottom row: meta + action */}
                    <div className="flex items-center justify-between pt-4 border-t-2 border-black dark:border-white mt-auto">
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] ${
                            rec.skillLevel === "advanced"
                              ? "bg-[#E11D48] text-white"
                              : rec.skillLevel === "intermediate"
                                ? "bg-[#AB47BC] text-white"
                                : "bg-[#2563EB] text-white"
                          }`}
                        >
                          {capitalize(rec.skillLevel)}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {deadlineToDuration(rec.deadline, now)}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {rec.applicantCount || 0}
                          {rec.maxApplicants ? `/${rec.maxApplicants}` : ""}
                        </span>
                      </div>

                      {isAccepted ? (
                        <span className="px-4 py-2 bg-emerald-500 text-white border-2 border-black dark:border-white font-black text-xs uppercase tracking-widest">
                          ✓ Accepted
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAccept(rec.taskId)}
                          disabled={isAccepting}
                          className="px-4 py-2 bg-[#2563EB] text-white border-2 border-black dark:border-white font-black text-xs uppercase tracking-widest shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5"
                        >
                          {isAccepting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                          {isAccepting ? "Accepting..." : "Accept"}
                        </button>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Explore All CTA */}
        {recommendations && recommendations.length > 0 && (
          <motion.div variants={itemVariants} className="mt-10 flex justify-center">
            <button
              onClick={() => onNavigate?.("explore")}
              className="group px-8 py-3 bg-black dark:bg-white text-white dark:text-black border-4 border-black dark:border-white font-black text-sm uppercase tracking-widest shadow-[8px_8px_0_0_#2563EB] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#2563EB] transition-all flex items-center gap-2"
            >
              Browse All Tasks
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

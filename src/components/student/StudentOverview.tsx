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

import { useUser } from "@clerk/nextjs";
import { motion, Variants } from "framer-motion";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowRight,
  Star,
  Eye,
} from "lucide-react";

import { Typography } from "@/components/ui/Typography";

const MOCK_STATS = {
  activeApplications: 3,
  completedTasks: 12,
  successRate: "94%",
  profileViews: 48,
};

const MOCK_RECOMMENDATIONS = [
  {
    id: "r1",
    title: "React Native UI Overhaul",
    company: "TechNova",
    duration: "2 weeks",
    tags: ["React Native", "UI/UX", "Tailwind"],
    matchScore: 98,
  },
  {
    id: "r2",
    title: "Next.js Authentication Integration",
    company: "SecureShare",
    duration: "1 week",
    tags: ["Next.js", "Clerk", "TypeScript"],
    matchScore: 92,
  },
  {
    id: "r3",
    title: "PostgreSQL Database Migration",
    company: "DataFlow",
    duration: "3 weeks",
    tags: ["SQL", "PostgreSQL", "Backend"],
    matchScore: 85,
  },
];

const MOCK_ACTIVE_PIPELINE = [
  {
    id: "p1",
    title: "Frontend Development for E-commerce",
    company: "ShopifyPlus",
    status: "in_progress",
    deadline: "Tomorrow",
    progress: 75,
  },
  {
    id: "p2",
    title: "API Endpoint Optimization",
    company: "FastAPI Solutions",
    status: "review",
    deadline: "2 days ago",
    progress: 100,
  },
];

// Motion Variants
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

export default function StudentOverview({ onNavigate }: { onNavigate?: (id: string) => void }) {
  const { user } = useUser();
  const firstName = user?.firstName || "there";

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="space-y-8"
    >
      {/* Hero Section */}
      <motion.div variants={itemVariants} className="stu-hero">
        <div className="stu-hero__text">
          <Typography variant="h1">
            Hello, <span className="stu-hero__accent">{firstName}</span> 👋
          </Typography>
          <Typography variant="p">
            Here is your command center. You have{" "}
            {MOCK_STATS.activeApplications} active applications and{" "}
            {MOCK_RECOMMENDATIONS.length} new high-match opportunities waiting
            for you today.
          </Typography>
        </div>
      </motion.div>

      {/* STATS WIDGETS */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="stu-stat-card stu-stat-card--blue">
          <div className="flex items-center gap-3 mb-3 text-muted-foreground">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Briefcase className="w-5 h-5" />
            </div>
            <Typography
              variant="span"
              className="font-semibold uppercase tracking-wider"
            >
              Active
            </Typography>
          </div>
          <Typography variant="h2" className="tracking-tighter">
            {MOCK_STATS.activeApplications}
          </Typography>
        </div>

        <div className="stu-stat-card stu-stat-card--emerald">
          <div className="flex items-center gap-3 mb-3 text-muted-foreground">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <Typography
              variant="span"
              className="font-semibold uppercase tracking-wider"
            >
              Done
            </Typography>
          </div>
          <Typography variant="h2" className="tracking-tighter">
            {MOCK_STATS.completedTasks}
          </Typography>
        </div>

        <div className="stu-stat-card stu-stat-card--amber">
          <div className="flex items-center gap-3 mb-3 text-muted-foreground">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <TrendingUp className="w-5 h-5" />
            </div>
            <Typography
              variant="span"
              className="font-semibold uppercase tracking-wider"
            >
              Success
            </Typography>
          </div>
          <Typography variant="h2" className="tracking-tighter">
            {MOCK_STATS.successRate}
          </Typography>
        </div>

        <div className="stu-stat-card stu-stat-card--indigo">
          <div className="flex items-center gap-3 mb-3 text-muted-foreground">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
              <Eye className="w-5 h-5" />
            </div>
            <Typography
              variant="span"
              className="font-semibold uppercase tracking-wider"
            >
              Views
            </Typography>
          </div>
          <Typography variant="h2" className="tracking-tighter">
            {MOCK_STATS.profileViews}
          </Typography>
        </div>
      </motion.div>

      {/* MAIN OVERVIEW SPLIT */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10"
      >
        {/* LEFT: Active Pipeline (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <Typography variant="h3">Active Pipeline</Typography>
          </div>

          <div className="space-y-4">
            {MOCK_ACTIVE_PIPELINE.map((item) => (
              <div
                key={item.id}
                className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex-1 space-y-1 mb-4 sm:mb-0">
                  <Typography
                    variant="h4"
                    className="group-hover:text-blue-500 transition-colors"
                  >
                    {item.title}
                  </Typography>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="font-medium">{item.company}</span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Due {item.deadline}
                    </span>
                  </div>
                </div>

                <div className="w-full sm:w-auto flex flex-col items-end gap-2 shrink-0">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                      item.status === "in_progress"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                    }`}
                  >
                    {item.status === "in_progress"
                      ? "In Progress"
                      : "Under Review"}
                  </span>
                  <div className="w-full sm:w-32 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        item.status === "in_progress"
                          ? "bg-amber-500"
                          : "bg-blue-500"
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {MOCK_ACTIVE_PIPELINE.length === 0 && (
            <div className="p-8 text-center bg-card rounded-xl border border-dashed border-border">
              <Typography variant="p" color="muted">
                No active tasks. Time to explore!
              </Typography>
            </div>
          )}
        </div>

        {/* RIGHT: Recommended For You (1/3) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <Typography variant="h3" className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              Top Matches
            </Typography>
          </div>

          <div className="space-y-3">
            {MOCK_RECOMMENDATIONS.map((rec) => (
              <div
                key={rec.id}
                className="group block p-4 bg-card border border-border rounded-xl shadow-sm hover:shadow-md hover:border-blue-500/50 transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    {rec.matchScore}% Match
                  </span>
                </div>

                <Typography
                  variant="h4"
                  className="mb-1 leading-tight group-hover:text-blue-500 transition-colors"
                >
                  {rec.title}
                </Typography>

                <Typography
                  variant="span"
                  color="muted"
                  className="flex items-center gap-2 mb-3"
                >
                  {rec.company} • {rec.duration}
                </Typography>

                <div className="flex flex-wrap gap-2">
                  {rec.tags.map((tag) => {
                    const devicon = getDeviconClass(tag);
                    return (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-muted/60 text-xs font-medium text-foreground/80 dark:bg-muted/40"
                      >
                        {devicon && <i className={`${devicon} text-[14px]`} />}
                        {tag}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => onNavigate?.("explore")} className="w-full group py-3 mt-4 flex items-center justify-center gap-2 bg-card border border-border rounded-xl hover:bg-muted hover:text-foreground transition-all font-bold text-sm uppercase tracking-wider">
            Explore All Tasks
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

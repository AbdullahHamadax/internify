"use client";

import { useState } from "react";

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

import { useUser } from "@clerk/nextjs";
import { motion, Variants } from "framer-motion";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  ArrowRight,
  Star,
  Loader2,
} from "lucide-react";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

import { Typography } from "@/components/ui/Typography";
import SubmitTaskModal from "./SubmitTaskModal";
import { useLiveNow } from "@/lib/useLiveNow";

function deadlineToDuration(deadline: number, now: number): string {
  const diff = Math.max(0, deadline - now);
  if (diff === 0) return "Expired";
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 7) return `${days} day${days !== 1 ? "s" : ""}`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks !== 1 ? "s" : ""}`;
  const months = Math.floor(days / 30);
  return `${months} month${months !== 1 ? "s" : ""}`;
}

// Mock stats removed

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

export default function StudentOverview({
  onNavigate,
}: {
  onNavigate?: (id: string) => void;
}) {
  const now = useLiveNow();
  type SelectedApplication = {
    _id: string;
    taskId: string;
    hasSubmission: boolean;
    task: {
      title: string;
      description: string;
      category: string;
      skills: string[];
      companyName: string;
      deadline: number;
    };
  };

  const { user } = useUser();
  const firstName = user?.firstName || "there";

  const [selectedApp, setSelectedApp] = useState<SelectedApplication | null>(
    null,
  );

  const applications = useQuery(api.tasks.getStudentApplications);
  const activeCount = applications
    ? applications.filter(
        (app) => app.status === "in_progress" || app.status === "accepted",
      ).length
    : 0;

  const completedCount = applications
    ? applications.filter((app) => app.status === "completed").length
    : 0;

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
          <Typography variant="h1" className="text-white">
            Hello, <span className="stu-hero__accent">{firstName}</span>
          </Typography>
          <Typography
            variant="p"
            className="text-white opacity-95 text-sm md:text-base leading-relaxed mt-2"
          >
            This is your command center. You have{" "}
            <span className="inline-flex items-center justify-center font-black text-black bg-white px-2 py-0.5 mx-0.5 border-2 border-black shadow-[2px_2px_0_0_#000] -rotate-2 text-xl md:text-2xl">
              {activeCount}
            </span>{" "}
            active applications and{" "}
            <span className="inline-flex items-center justify-center font-black text-black bg-[#FCD34D] px-2 py-0.5 mx-0.5 border-2 border-black shadow-[2px_2px_0_0_#000] rotate-2 text-xl md:text-2xl">
              {MOCK_RECOMMENDATIONS.length}
            </span>{" "}
            new high-match opportunities waiting for you today.
          </Typography>
        </div>
      </motion.div>

      {/* STATS WIDGETS */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
        <div className="stu-stat-card stu-stat-card--blue">
          <div className="flex items-center gap-3 mb-3 text-muted-foreground">
            <div className="p-2 border-2 border-black dark:border-white bg-[#BFDBFE] dark:bg-[#1E3A8A] text-[#1D4ED8] dark:text-[#93C5FD] shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]">
              <Briefcase className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <Typography
              variant="span"
              className="font-semibold uppercase tracking-wider"
            >
              Active Tasks
            </Typography>
          </div>
          <Typography variant="h2" className="tracking-tighter">
            {activeCount}
          </Typography>
        </div>

        <div className="stu-stat-card stu-stat-card--emerald">
          <div className="flex items-center gap-3 mb-3 text-muted-foreground">
            <div className="p-2 border-2 border-black dark:border-white bg-[#A7F3D0] dark:bg-[#064E3B] text-[#047857] dark:text-[#A7F3D0] shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]">
              <CheckCircle2 className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <Typography
              variant="span"
              className="font-semibold uppercase tracking-wider"
            >
              Completed Tasks
            </Typography>
          </div>
          <Typography variant="h2" className="tracking-tighter">
            {completedCount}
          </Typography>
        </div>
      </motion.div>

      {/* MAIN OVERVIEW SPLIT */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10"
      >
        {/* LEFT: Active Pipeline (2/3) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <Typography variant="h3">Active Pipeline</Typography>
          </div>

          <div className="space-y-4">
            {applications === undefined ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : applications.length === 0 ? (
              <div className="p-8 text-center bg-[#AB47BC] text-white border-4 border-black dark:border-white shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff]">
                <Typography
                  variant="h4"
                  color="white"
                  className="uppercase font-black"
                >
                  No active tasks. Time to explore!
                </Typography>
              </div>
            ) : (
              applications.map((app) => (
                <div
                  key={app._id}
                  className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-card border-2 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none min-h-[100px] w-full min-w-0 cursor-pointer"
                  onClick={() => setSelectedApp(app)}
                >
                  <div className="flex-1 w-full space-y-1 mb-4 sm:mb-0 min-w-0 pr-0 sm:pr-4">
                    <Typography
                      variant="h4"
                      className="group-hover:text-blue-600 transition-colors truncate block w-full"
                    >
                      {app.task.title}
                    </Typography>
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 text-sm text-muted-foreground min-w-0 w-full">
                      <Typography
                        variant="span"
                        className="font-medium truncate"
                      >
                        {app.task.companyName}
                      </Typography>
                      <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-border shrink-0" />
                      <Typography
                        variant="span"
                        className={`flex items-center gap-1.5 shrink-0 whitespace-nowrap ${deadlineToDuration(app.task.deadline, now) === "Expired" ? "text-red-600 dark:text-red-400 font-black tracking-wide" : ""}`}
                      >
                        <Clock
                          className="w-3.5 h-3.5 mb-[2px]"
                          strokeWidth={2.5}
                        />
                        Due {deadlineToDuration(app.task.deadline, now)}
                      </Typography>
                    </div>
                  </div>

                  <div className="w-full sm:w-auto flex flex-col items-end gap-2 shrink-0">
                    <span
                      className={`text-xs font-black uppercase tracking-widest border-2 border-black dark:border-white px-3 py-1 shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] ${
                        app.status === "in_progress"
                          ? "bg-[#1E40AF] text-white"
                          : app.status === "completed"
                            ? "bg-emerald-600 text-white"
                            : "bg-[#2563EB] text-white"
                      }`}
                    >
                      {app.status === "in_progress"
                        ? "In Progress"
                        : app.status === "completed"
                          ? "Completed"
                          : "Under Review"}
                    </span>
                    <div className="w-full sm:w-32 h-2 bg-muted border border-black dark:border-white overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-1000"
                        style={{
                          width: `${app.status === "in_progress" ? 50 : app.status === "completed" ? 100 : 25}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: Recommended For You (1/3) */}
        <div className="space-y-4">
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
                className="group block p-4 bg-card border-2 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] transition-all cursor-pointer hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white bg-[#2563EB] px-2 py-1 border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]">
                    {rec.matchScore}% Match
                  </span>
                </div>

                <Typography
                  variant="h4"
                  className="mb-1 leading-tight group-hover:text-blue-600 transition-colors"
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
                  {rec.tags.slice(0, 3).map((tag) => {
                    const devicon = getDeviconClass(tag);
                    return (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 border-2 border-black dark:border-white bg-white dark:bg-black text-[10px] font-black uppercase tracking-widest text-foreground transition-colors group-hover:bg-[#AB47BC] group-hover:text-white"
                      >
                        {devicon && <i className={`${devicon} text-[14px]`} />}
                        {tag}
                      </span>
                    );
                  })}
                  {rec.tags.length > 3 && (
                    <span className="inline-flex items-center px-2.5 py-1 border-2 border-black dark:border-white bg-white dark:bg-black text-[10px] font-black uppercase tracking-widest text-foreground transition-colors">
                      +{rec.tags.length - 3}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigate?.("explore")}
            className="w-full group py-3 mt-4 flex items-center justify-center gap-2 bg-[#2563EB] text-white border-4 border-black dark:border-white shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#000] dark:hover:shadow-[4px_4px_0_0_#fff] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none font-black text-sm uppercase tracking-wider"
          >
            Explore All Tasks
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.div>

      {/* Submit Task Modal */}
      {selectedApp && (
        <SubmitTaskModal
          open={!!selectedApp}
          applicationId={selectedApp._id}
          taskId={selectedApp.taskId}
          taskTitle={selectedApp.task.title}
          taskDescription={selectedApp.task.description}
          taskCategory={selectedApp.task.category}
          taskSkills={selectedApp.task.skills}
          companyName={selectedApp.task.companyName}
          deadline={selectedApp.task.deadline}
          hasSubmission={selectedApp.hasSubmission}
          onClose={() => setSelectedApp(null)}
          onSubmitted={() => setSelectedApp(null)}
        />
      )}
    </motion.div>
  );
}

"use client";

import { useState } from "react";
import { Search, Send, Award, Briefcase, Bot, ShieldCheck } from "lucide-react";
import CardSwap, { Card } from "@/components/CardSwap";
import AnimateIn from "@/components/AnimateIn";
import { motion } from "motion/react";
import { Typography } from "@/components/ui/Typography";

const studentSteps = [
  {
    num: 1,
    icon: Search,
    title: "Browse Real Tasks",
    desc: "Explore challenges posted by leading employers across various industries and skill levels.",
    accent: "from-[#00BCD4] to-[#1565C0]",
  },
  {
    num: 2,
    icon: Send,
    title: "Submit Your Work",
    desc: "Complete the task at your own pace and get instant AI-powered feedback on your submission.",
    accent: "from-[#1565C0] to-[#7B1FA2]",
  },
  {
    num: 3,
    icon: Award,
    title: "Earn Your Certificate",
    desc: "Receive a verified, company-branded credential that proves your skills to future employers.",
    accent: "from-[#7B1FA2] to-[#00BCD4]",
  },
];

const employerSteps = [
  {
    num: 1,
    icon: Briefcase,
    title: "Post a Challenge",
    desc: "Create verified tasks based on your company's actual real-world projects and requirements.",
    accent: "from-[#7B1FA2] to-[#AB47BC]",
  },
  {
    num: 2,
    icon: Bot,
    title: "AI Evaluates Submissions",
    desc: "Our AI engine automatically scores and gives detailed feedback on all student work at scale.",
    accent: "from-[#00BCD4] to-[#1565C0]",
  },
  {
    num: 3,
    icon: ShieldCheck,
    title: "Hire Proven Talent",
    desc: "Access a pre-screened pool of candidates who have already proven they can do the job.",
    accent: "from-[#1565C0] to-[#7B1FA2]",
  },
];

export default function HowItWorks() {
  const [activeTab, setActiveTab] = useState<"students" | "employers">(
    "students",
  );
  const steps = activeTab === "students" ? studentSteps : employerSteps;

  return (
    <section
      id="how-it-works"
      className="relative z-10 py-20 sm:py-28 overflow-hidden"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <AnimateIn className="text-center max-w-2xl mx-auto">
          <Typography variant="h2">How Internify Works</Typography>

          <Typography variant="p" color="muted" className="mt-4 text-lg">
            {activeTab === "students"
              ? "Three steps from student to certified professional."
              : "Three steps to hire proven, pre-vetted talent."}
          </Typography>
        </AnimateIn>

        {/* Custom Animated Toggle */}
        <AnimateIn delay={0.1} className="mt-10 flex justify-center">
          <div className="relative flex rounded-full bg-gray-100/80 dark:bg-gray-800/50 p-1 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
            <button
              onClick={() => setActiveTab("students")}
              className={`relative z-10 px-6 sm:px-8 py-2.5 text-sm font-semibold transition-colors outline-none ${
                activeTab === "students"
                  ? "text-gray-900 dark:text-white"
                  : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              For Students
              {activeTab === "students" && (
                <motion.div
                  layoutId="how-it-works-toggle"
                  className="absolute inset-0 -z-10 rounded-full bg-white dark:bg-gray-700 shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab("employers")}
              className={`relative z-10 px-6 sm:px-8 py-2.5 text-sm font-semibold transition-colors outline-none ${
                activeTab === "employers"
                  ? "text-gray-900 dark:text-white"
                  : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              For Employers
              {activeTab === "employers" && (
                <motion.div
                  layoutId="how-it-works-toggle"
                  className="absolute inset-0 -z-10 rounded-full bg-white dark:bg-gray-700 shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          </div>
        </AnimateIn>

        {/* Centered CardSwap */}
        <AnimateIn delay={0.2} className="mt-16 sm:mt-24 flex justify-center">
          {/* Wrapper to maintain height and position */}
          <div className="relative h-[420px] w-full max-w-[420px]">
            {/* Soft background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#00BCD4]/8 via-[#1565C0]/6 to-[#7B1FA2]/10 blur-[100px] dark:from-[#00BCD4]/12 dark:via-[#1565C0]/10 dark:to-[#7B1FA2]/12 pointer-events-none" />

            {/* CardSwap visually centered. Changing key forces remount/restart of animation */}
            <CardSwap
              key={activeTab}
              cardDistance={50}
              verticalDistance={40}
              delay={3500}
              pauseOnHover
              width={400}
              height={320}
              easing="elastic"
            >
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <Card
                    key={step.num}
                    className="flex flex-col justify-center p-8 sm:p-10 !border-gray-200 !bg-white !shadow-xl !shadow-gray-200/70 dark:!border-gray-800 dark:!bg-gray-900 dark:!shadow-black/50"
                  >
                    <div
                      className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${step.accent} shadow-lg mb-6`}
                    >
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-brand-gradient text-sm font-bold tracking-wide uppercase">
                        Step {step.num}
                      </span>
                    </div>
                    <Typography variant="h3">{step.title}</Typography>
                    <Typography
                      variant="p"
                      color="muted"
                      className="mt-3 text-sm sm:text-base leading-relaxed"
                    >
                      {step.desc}
                    </Typography>
                  </Card>
                );
              })}
            </CardSwap>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}

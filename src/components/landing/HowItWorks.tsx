"use client";

import { useState } from "react";
import { Search, Briefcase, Bot, ShieldCheck, User, Send, Award, FileUp } from "lucide-react";
import AnimateIn from "@/components/AnimateIn";
import { motion } from "motion/react";
import { Typography } from "@/components/ui/Typography";

const StudentMockup1 = () => (
  <div className="w-48 h-48 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 relative overflow-hidden flex flex-col z-10 mx-auto">
    <div className="bg-gray-50 dark:bg-gray-800/50 flex-1 relative p-3 flex flex-col gap-2">
      {/* Search Bar */}
      <div className="w-full h-7 bg-white dark:bg-gray-800 rounded-full flex items-center px-2.5 border border-gray-100 dark:border-gray-700 shadow-sm mb-1">
        <Search className="w-3 h-3 text-gray-400 dark:text-gray-500" />
        <div className="ml-2 h-1.5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      </div>
      
      {/* Task Card 1 */}
      <div className="bg-white dark:bg-gray-900 p-2.5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col gap-2">
        <div className="flex gap-2 items-center">
          <div className="w-6 h-6 rounded bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
            <Briefcase className="w-3 h-3 text-blue-500 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <div className="h-1.5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full mb-1"></div>
            <div className="h-1 w-12 bg-gray-100 dark:bg-gray-800 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Task Card 2 */}
      <div className="bg-white dark:bg-gray-900 p-2.5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col gap-2">
        <div className="flex gap-2 items-center">
          <div className="w-6 h-6 rounded bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
            <Briefcase className="w-3 h-3 text-purple-500 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <div className="h-1.5 w-14 bg-gray-200 dark:bg-gray-700 rounded-full mb-1"></div>
            <div className="h-1 w-10 bg-gray-100 dark:bg-gray-800 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const StudentMockup2 = () => (
  <div className="w-48 h-48 relative flex items-center justify-center z-10 mx-auto">
    <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 rounded-2xl rotate-6 scale-90 opacity-50 border border-gray-200 dark:border-gray-700"></div>
    <div className="absolute inset-0 bg-gray-50 dark:bg-gray-800/80 rounded-2xl -rotate-3 scale-95 opacity-80 border border-gray-200 dark:border-gray-700"></div>
    <div className="relative w-44 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 p-3.5 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <User className="w-3 h-3 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="h-1.5 w-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        </div>
        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-2 py-4 shadow-inner">
        <FileUp className="w-5 h-5 text-gray-400 dark:text-gray-500" />
        <div className="h-1.5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      </div>
      
      <button className="w-full h-8 bg-blue-500 hover:bg-blue-600 transition-colors rounded-lg flex items-center justify-center gap-1.5 text-white text-[10px] font-bold mt-1">
        <Send className="w-3 h-3" />
        Submit Work
      </button>
    </div>
  </div>
);

const StudentMockup3 = () => (
  <div className="w-48 h-48 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 relative overflow-hidden flex flex-col z-10 mx-auto justify-center items-center">
    {/* Decorative background flare */}
    <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-blue-500/10 to-transparent dark:from-blue-500/20"></div>
    
    <div className="relative z-10 flex flex-col items-center w-full px-4 text-center mt-2">
      <div className="w-14 h-14 rounded-full border-4 border-white dark:border-gray-900 bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shadow-md mb-3">
        <Award className="w-6 h-6 text-blue-500 dark:text-blue-400" />
      </div>
      
      <div className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold text-[8px] rounded-full uppercase tracking-widest mb-3 border border-emerald-200 dark:border-emerald-800/50">
        Certified
      </div>
      
      <div className="w-20 h-2 bg-gray-800 dark:bg-gray-200 rounded-full mb-2"></div>
      <div className="w-14 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mb-4"></div>
      
      <div className="w-full h-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800 flex flex-col justify-center items-center gap-1.5">
        <div className="flex gap-1.5">
           <div className="w-12 h-1 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
           <div className="w-6 h-1 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        </div>
      </div>
    </div>
  </div>
);

const EmployerMockup1 = () => (
  <div className="relative w-48 h-48 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col p-4 z-10 mx-auto">
    <div className="flex gap-2 mb-4">
      <div className="w-6 h-6 rounded bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
        <Briefcase className="w-3 h-3 text-purple-600 dark:text-purple-400" />
      </div>
      <div className="flex-1 mt-1">
        <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mb-1.5" />
        <div className="w-10 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full" />
      </div>
    </div>
    <div className="space-y-2 mt-auto">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full border border-gray-200 dark:border-gray-700" />
        <div className="w-24 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full" />
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-blue-500 flex items-center justify-center">
          <div className="w-1 h-1 bg-white rounded-full" />
        </div>
        <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full border border-gray-200 dark:border-gray-700" />
        <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full" />
      </div>
    </div>
  </div>
);

const EmployerMockup2 = () => (
  <div className="relative w-48 h-48 flex items-center justify-center z-10 mx-auto">
    <div className="absolute w-44 h-44 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-xl opacity-50" />
    <div className="relative w-40 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-4">
      <div className="flex justify-between items-start mb-4">
        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 rounded text-[9px] font-bold text-blue-600 dark:text-blue-400">
          AI SCORE
        </div>
      </div>
      <div className="flex items-end gap-2 mb-3">
        <Typography variant="h2" className="leading-none tracking-tighter m-0">
          94
        </Typography>
        <span className="text-[10px] text-muted-foreground font-medium mb-1 border-t border-border pt-0.5">
          / 100
        </span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className="w-[94%] h-full bg-blue-500 rounded-full" />
      </div>
    </div>
  </div>
);

const EmployerMockup3 = () => (
  <div className="relative w-48 h-48 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center p-4 z-10 mx-auto">
    <div className="flex -space-x-3 mb-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`w-10 h-10 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center shadow-sm z-[${4 - i}] ${i === 1 ? "bg-blue-100" : i === 2 ? "bg-purple-100" : "bg-emerald-100"}`}
        >
          <div className="w-3 h-4 rounded-t-full bg-black/10" />
        </div>
      ))}
    </div>
    <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-2" />
    <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full mb-4" />

    <div className="w-full h-8 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400">
      <ShieldCheck className="w-3.5 h-3.5" />
      <span className="text-[10px] font-bold uppercase tracking-wider">
        Hired
      </span>
    </div>
  </div>
);

const studentSteps = [
  {
    num: 1,
    title: "Browse Real Tasks",
    desc: "Explore challenges posted by leading employers across various industries and skill levels.",
    Mockup: StudentMockup1,
  },
  {
    num: 2,
    title: "Submit Your Work",
    desc: "Complete the task at your own pace and get instant AI-powered feedback on your submission.",
    Mockup: StudentMockup2,
  },
  {
    num: 3,
    title: "Earn Your Certificate",
    desc: "Receive a verified, company-branded credential that proves your skills to future employers.",
    Mockup: StudentMockup3,
  },
];

const employerSteps = [
  {
    num: 1,
    title: "Post a Challenge",
    desc: "Create verified tasks based on your company's actual real-world projects and requirements.",
    Mockup: EmployerMockup1,
  },
  {
    num: 2,
    title: "AI Evaluates Submissions",
    desc: "Our AI engine automatically scores and gives detailed feedback on all student work at scale.",
    Mockup: EmployerMockup2,
  },
  {
    num: 3,
    title: "Hire Proven Talent",
    desc: "Access a pre-screened pool of candidates who have already proven they can do the job.",
    Mockup: EmployerMockup3,
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
      className="relative z-10 py-20 sm:py-28 overflow-hidden bg-white dark:bg-gray-950"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
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
        <AnimateIn
          delay={0.1}
          className="mt-10 mb-16 sm:mb-24 flex justify-center"
        >
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

        {/* 3-Step Grid Content */}
        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8">
          {steps.map((step, index) => {
            const MockupComponent = step.Mockup;
            return (
              <AnimateIn
                key={`${activeTab}-${step.num}`} // Force re-render on tab switch
                delay={0.2 + index * 0.15}
                className="relative flex flex-col items-center text-center z-10 group"
              >
                {/* Visual Mockup Container */}
                <div className="mb-10 w-full flex justify-center transform transition-transform duration-500 ease-out group-hover:-translate-y-2 relative z-10">
                  <MockupComponent />
                </div>

                <div className="relative w-full">
                  {/* Step Badge */}
                  <span className="absolute -top-14 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white dark:bg-gray-[950] border-2 border-gray-100 dark:border-gray-800 flex items-center justify-center text-sm font-bold text-gray-500 dark:text-gray-400 z-20">
                    {step.num}
                  </span>

                  {/* Text Content */}
                  <Typography variant="h3" className="mb-3 text-2xl font-bold">
                    {step.title}
                  </Typography>
                  <Typography
                    variant="p"
                    color="muted"
                    className="max-w-xs mx-auto text-lg leading-relaxed text-[#4A4D55] dark:text-gray-400"
                  >
                    {step.desc}
                  </Typography>
                </div>
              </AnimateIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}

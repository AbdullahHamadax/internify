"use client";

import { useState } from "react";
import {
  Search,
  Briefcase,
  Bot,
  ShieldCheck,
  User,
  Send,
  Award,
  FileUp,
} from "lucide-react";
import AnimateIn from "@/components/AnimateIn";
import { motion } from "motion/react";
import { Typography } from "@/components/ui/Typography";

const StudentMockup1 = () => (
  <div className="w-48 h-48 bg-white dark:bg-gray-950 rounded-xl border-2 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] relative overflow-hidden flex flex-col z-10 mx-auto">
    <div className="bg-gray-100 dark:bg-gray-900 flex-1 relative p-3 flex flex-col gap-3">
      {/* Search Bar */}
      <div className="w-full h-8 bg-white dark:bg-black rounded-none flex items-center px-2 border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]">
        <Search
          className="w-3.5 h-3.5 text-black dark:text-white"
          strokeWidth={3}
        />
        <div className="ml-2 h-2 w-16 bg-black dark:bg-white"></div>
      </div>

      {/* Task Card 1 */}
      <div className="bg-white dark:bg-black p-2 rounded-none border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] flex flex-col gap-2">
        <div className="flex gap-2 items-center">
          <div className="w-7 h-7 bg-[#2563EB] border-2 border-black dark:border-white flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-black" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <div className="h-2 w-16 bg-black dark:bg-white mb-1.5"></div>
            <div className="h-1.5 w-12 bg-gray-300 dark:bg-gray-700"></div>
          </div>
        </div>
      </div>

      {/* Task Card 2 */}
      <div className="bg-white dark:bg-black p-2 rounded-none border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] flex flex-col gap-2">
        <div className="flex gap-2 items-center">
          <div className="w-7 h-7 bg-[#AB47BC] border-2 border-black dark:border-white flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-black" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <div className="h-2 w-14 bg-black dark:bg-white mb-1.5"></div>
            <div className="h-1.5 w-10 bg-gray-300 dark:bg-gray-700"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const StudentMockup2 = () => (
  <div className="w-48 h-48 relative flex items-center justify-center z-10 mx-auto">
    <div className="absolute inset-0 bg-[#2563EB] border-2 border-black dark:border-white rounded-none rotate-6 opacity-100 translate-x-2 translate-y-2"></div>
    <div className="relative w-44 bg-white dark:bg-gray-950 rounded-none border-2 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] p-3.5 flex flex-col gap-3">
      <div className="flex justify-between items-center border-b-2 border-black dark:border-white pb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-black dark:bg-white flex items-center justify-center">
            <User className="w-4 h-4 text-white dark:text-black" />
          </div>
          <div className="h-2 w-12 bg-black dark:bg-white"></div>
        </div>
        <div className="w-3 h-3 bg-[#2563EB] border-2 border-black dark:border-white"></div>
      </div>

      <div className="bg-gray-100 dark:bg-gray-900 p-3 border-2 border-dashed border-black dark:border-white flex flex-col items-center justify-center gap-2 py-4">
        <FileUp
          className="w-6 h-6 text-black dark:text-white"
          strokeWidth={2}
        />
        <div className="h-2 w-16 bg-black dark:bg-white"></div>
      </div>

      <button className="w-full h-9 bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-white dark:text-black text-[11px] font-black uppercase tracking-widest border-2 border-black dark:border-white shadow-[2px_2px_0_0_#2563EB]">
        <Send className="w-3.5 h-3.5" />
        Submit
      </button>
    </div>
  </div>
);

const StudentMockup3 = () => (
  <div className="w-48 h-48 bg-white dark:bg-gray-950 rounded-none border-2 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] relative overflow-hidden flex flex-col z-10 mx-auto justify-center items-center">
    {/* Stark Banner Stripe */}
    <div className="absolute top-0 inset-x-0 h-10 bg-[#2563EB] border-b-2 border-black dark:border-white"></div>

    <div className="relative z-10 flex flex-col items-center w-full px-4 text-center mt-6">
      <div className="w-14 h-14 bg-white dark:bg-black border-2 border-black dark:border-white flex items-center justify-center shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] mb-4 rotate-3">
        <Award
          className="w-7 h-7 text-black dark:text-white"
          strokeWidth={2.5}
        />
      </div>

      <div className="px-3 py-1 bg-black text-white dark:bg-white dark:text-black font-black text-[9px] uppercase tracking-[0.2em] mb-3 border-2 border-black dark:border-white shadow-[2px_2px_0_0_#2563EB]">
        Certified
      </div>

      <div className="w-20 h-2 bg-black dark:bg-white mb-2"></div>
      <div className="w-14 h-1.5 bg-gray-400 dark:bg-gray-600 mb-4"></div>

      <div className="w-full h-8 bg-gray-100 dark:bg-gray-900 border-2 border-black dark:border-white flex flex-col justify-center items-center">
        <div className="flex gap-2">
          <div className="w-12 h-1.5 bg-black dark:bg-white"></div>
          <div className="w-6 h-1.5 bg-gray-400 dark:bg-gray-600"></div>
        </div>
      </div>
    </div>
  </div>
);

const EmployerMockup1 = () => (
  <div className="relative w-48 h-48 bg-white dark:bg-gray-950 rounded-none border-2 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] overflow-hidden flex flex-col p-4 z-10 mx-auto">
    <div className="flex gap-3 mb-5 border-b-2 border-black dark:border-white pb-3">
      <div className="w-8 h-8 bg-[#AB47BC] border-2 border-black dark:border-white flex items-center justify-center shadow-[2px_2px_0_0_#000]">
        <Briefcase className="w-4 h-4 text-white" strokeWidth={2.5} />
      </div>
      <div className="flex-1 mt-1">
        <div className="w-16 h-2 bg-black dark:bg-white mb-2" />
        <div className="w-10 h-1.5 bg-gray-400 dark:bg-gray-600" />
      </div>
    </div>
    <div className="space-y-3 mt-auto">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 border-2 border-black dark:border-white" />
        <div className="w-24 h-2 bg-gray-300 dark:bg-gray-700" />
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-black dark:bg-white border-2 border-black dark:border-white" />
        <div className="w-20 h-2 bg-black dark:bg-white" />
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 border-2 border-black dark:border-white" />
        <div className="w-16 h-2 bg-gray-300 dark:bg-gray-700" />
      </div>
    </div>
  </div>
);

const EmployerMockup2 = () => (
  <div className="relative w-48 h-48 flex items-center justify-center z-10 mx-auto">
    <div className="absolute w-44 h-44 bg-[#AB47BC] -rotate-6 translate-x-2 translate-y-3 border-2 border-black dark:border-white" />
    <div className="relative w-40 bg-white dark:bg-gray-950 rounded-none border-2 border-black dark:border-white shadow-[4px_4px_0_0_#000] p-4">
      <div className="flex justify-between items-start mb-4 border-b-2 border-black dark:border-white pb-3">
        <div className="w-8 h-8 bg-black dark:bg-white flex items-center justify-center">
          <Bot className="w-5 h-5 text-white dark:text-black" />
        </div>
        <div className="px-2 py-1 bg-black text-white dark:bg-white dark:text-black border-2 border-black dark:border-white text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0_0_#2563EB]">
          AI
        </div>
      </div>
      <div className="flex items-end gap-2 mb-3">
        <Typography
          variant="h2"
          className="leading-none tracking-tighter m-0 font-black"
        >
          94
        </Typography>
        <span className="text-[12px] text-black dark:text-white font-black mb-1 border-b-2 border-black dark:border-white pb-0.5">
          / 100
        </span>
      </div>
      <div className="w-full h-3 border-2 border-black dark:border-white bg-gray-200 dark:bg-gray-800">
        <div className="w-[94%] h-full bg-[#2563EB] border-r-2 border-black dark:border-white" />
      </div>
    </div>
  </div>
);

const EmployerMockup3 = () => (
  <div className="relative w-48 h-48 bg-white dark:bg-gray-950 rounded-none border-2 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] flex flex-col items-center justify-center p-4 z-10 mx-auto">
    <div className="flex -space-x-3 mb-6">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`w-10 h-10 border-2 border-black dark:border-white flex items-center justify-center shadow-[2px_2px_0_0_#000] z-[${4 - i}] ${i === 1 ? "bg-[#2563EB]" : i === 2 ? "bg-[#AB47BC]" : "bg-[#2563EB]"} ${i === 2 ? "-translate-y-2" : ""}`}
        >
          <div className="w-4 h-4 rounded-none bg-black dark:bg-white mix-blend-overlay" />
        </div>
      ))}
    </div>
    <div className="w-20 h-2 bg-black dark:bg-white mb-2" />
    <div className="w-16 h-1.5 bg-gray-400 dark:bg-gray-600 mb-6" />

    <div className="w-full h-10 border-2 border-black dark:border-white bg-black dark:bg-white flex items-center justify-center gap-2 text-white dark:text-black shadow-[2px_2px_0_0_#2563EB]">
      <ShieldCheck className="w-4 h-4" />
      <span className="text-[11px] font-black uppercase tracking-widest">
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
      className="relative z-10 py-20 sm:py-28 overflow-hidden"
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
          <div className="relative flex bg-white dark:bg-black p-1 border-2 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]">
            <button
              onClick={() => setActiveTab("students")}
              className={`relative z-10 px-6 sm:px-8 py-2.5 text-sm font-black tracking-widest uppercase transition-colors outline-none border-2 border-transparent ${
                activeTab === "students"
                  ? "text-white dark:text-white"
                  : "text-gray-500 hover:text-black dark:hover:text-white"
              }`}
            >
              For Students
              {activeTab === "students" && (
                <motion.div
                  layoutId="how-it-works-toggle"
                  className="absolute inset-0 -z-10 bg-[#2563EB] border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab("employers")}
              className={`relative z-10 px-6 sm:px-8 py-2.5 text-sm font-black tracking-widest uppercase transition-colors outline-none border-2 border-transparent ${
                activeTab === "employers"
                  ? "text-white dark:text-white"
                  : "text-gray-500 hover:text-black dark:hover:text-white"
              }`}
            >
              For Employers
              {activeTab === "employers" && (
                <motion.div
                  layoutId="how-it-works-toggle"
                  className="absolute inset-0 -z-10 bg-[#AB47BC] border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          </div>
        </AnimateIn>

        {/* 3-Step Grid Content */}
        <div className="relative">
          {/* Large Background Rectangle Behind Grid */}
          <div
            className={`absolute -top-8 -bottom-8 -left-4 -right-4 md:-left-8 md:-right-8 border-4 border-black dark:border-white shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff] transition-colors duration-500 z-0 ${
              activeTab === "students" ? "bg-[#2563EB]" : "bg-[#AB47BC]"
            }`}
          />
          <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8 bg-white dark:bg-gray-950 border-4 border-black dark:border-white p-8 sm:p-12 z-10">
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

                  <div className="relative w-full z-20">
                    {/* Step Badge */}
                    <span
                      className={`absolute -top-14 left-1/2 -translate-x-1/2 w-10 h-10 border-2 border-black dark:border-white flex items-center justify-center text-sm font-black text-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] transition-colors duration-500 ${
                        activeTab === "students"
                          ? "bg-[#2563EB]"
                          : "bg-[#AB47BC]"
                      }`}
                    >
                      {step.num}
                    </span>

                    {/* Text Content */}
                    <Typography
                      variant="h3"
                      className="mb-3 text-2xl font-bold"
                    >
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
      </div>
    </section>
  );
}

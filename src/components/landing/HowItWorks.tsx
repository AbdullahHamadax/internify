"use client";

import { Search, Send, Award } from "lucide-react";
import CardSwap, { Card } from "@/components/CardSwap";

const steps = [
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

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative z-10 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            How Internify Works
          </h2>
          <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
            Three steps from student to certified professional
          </p>
        </div>

        {/* Two-column layout: steps list + card swap */}
        <div className="mt-16 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — steps list */}
          <div className="space-y-8">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.num} className="flex gap-5">
                  {/* Number circle */}
                  <div className="shrink-0">
                    <div className="bg-brand-gradient flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-lg shadow-blue-500/15">
                      {step.num}
                    </div>
                  </div>
                  {/* Content */}
                  <div>
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {step.title}
                      </h3>
                    </div>
                    <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-md">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right — CardSwap visual (floating, overflows beneath next section) */}
          <div className="relative hidden h-[420px] lg:block">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#00BCD4]/8 via-[#1565C0]/6 to-[#7B1FA2]/10 blur-[100px] dark:from-[#00BCD4]/12 dark:via-[#1565C0]/10 dark:to-[#7B1FA2]/12 pointer-events-none" />
            <CardSwap
              cardDistance={50}
              verticalDistance={50}
              delay={3000}
              pauseOnHover
              width={380}
              height={280}
              easing="elastic"
            >
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <Card
                    key={step.num}
                    className="flex flex-col justify-center p-8 !border-gray-200 !bg-white !shadow-lg !shadow-gray-200/70 dark:!border-gray-800 dark:!bg-gray-900 dark:!shadow-black/30"
                  >
                    <div
                      className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${step.accent} shadow-lg mb-5`}
                    >
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-brand-gradient text-sm font-bold">
                        Step {step.num}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                      {step.desc}
                    </p>
                  </Card>
                );
              })}
            </CardSwap>
          </div>
        </div>
      </div>
    </section>
  );
}

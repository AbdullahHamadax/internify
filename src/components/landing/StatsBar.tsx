"use client";

import { Users, Building2, ClipboardList, Bot } from "lucide-react";
import CountUp from "@/components/CountUp";
import AnimateIn from "@/components/AnimateIn";

const stats = [
  {
    value: 10000,
    suffix: "+",
    label: "Students",
    icon: Users,
    duration: 0.9,
    accent: "from-[#00BCD4] to-[#1565C0]",
    glow: "shadow-cyan-500/20 dark:shadow-cyan-400/10",
  },
  {
    value: 50,
    suffix: "+",
    label: "Partner Companies",
    icon: Building2,
    duration: 0.7,
    accent: "from-[#1565C0] to-[#3B82F6]",
    glow: "shadow-blue-500/20 dark:shadow-blue-400/10",
  },
  {
    value: 500,
    suffix: "+",
    label: "Tasks Posted",
    icon: ClipboardList,
    duration: 0.8,
    accent: "from-[#7B1FA2] to-[#AB47BC]",
    glow: "shadow-purple-500/20 dark:shadow-purple-400/10",
  },
  {
    value: "AI",
    label: "Powered Feedback",
    icon: Bot,
    accent: "from-[#00BCD4] to-[#7B1FA2]",
    glow: "shadow-violet-500/20 dark:shadow-violet-400/10",
  },
];

export default function StatsBar() {
  return (
    <section className="relative py-16 sm:py-20 overflow-hidden">
      {/* Floating gradient accent — sits behind the cards */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Asymmetric grid — first card spans 2 cols on large screens for visual weight */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            // Alternate vertical offsets for asymmetry on desktop
            const offsetClass =
              i % 2 === 1 ? "lg:translate-y-3" : "lg:-translate-y-1";

            return (
              <AnimateIn key={i} delay={i * 0.1}>
                <div
                  className={`group relative rounded-2xl border border-gray-100 dark:border-gray-800/60 bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm p-6 shadow-lg ${stat.glow} transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${offsetClass}`}
                >
                  {/* Gradient accent bar at top */}
                  <div
                    className={`absolute top-0 left-6 right-6 h-[2px] rounded-full bg-gradient-to-r ${stat.accent} opacity-60 group-hover:opacity-100 transition-opacity`}
                  />

                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 text-center sm:text-left">
                    {/* Icon with gradient background */}
                    <div
                      className={`shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.accent} shadow-lg`}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-none">
                        {typeof stat.value === "number" ? (
                          <>
                            <CountUp
                              from={0}
                              to={stat.value}
                              separator=","
                              direction="up"
                              duration={stat.duration}
                              className="tabular-nums"
                              startCounting
                            />
                            {stat.suffix}
                          </>
                        ) : (
                          stat.value
                        )}
                      </p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                </div>
              </AnimateIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}

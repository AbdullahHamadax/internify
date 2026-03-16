"use client";

import { Users, Building2, ClipboardList, Bot } from "lucide-react";
import CountUp from "@/components/CountUp";
import AnimateIn from "@/components/AnimateIn";
import { Typography } from "@/components/ui/Typography";

const stats = [
  {
    value: 10000,
    suffix: "+",
    label: "Students",
    icon: Users,
    duration: 0.9,
    accent: "bg-[#AB47BC]",
    glow: "shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#AB47BC] border-2 border-black dark:border-[#AB47BC]",
  },
  {
    value: 50,
    suffix: "+",
    label: "Partner Companies",
    icon: Building2,
    duration: 0.7,
    accent: "bg-[#2563EB]",
    glow: "shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#2563EB] border-2 border-black dark:border-[#2563EB]",
  },
  {
    value: 500,
    suffix: "+",
    label: "Tasks Posted",
    icon: ClipboardList,
    duration: 0.8,
    accent: "bg-[#AB47BC]",
    glow: "shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#AB47BC] border-2 border-black dark:border-[#AB47BC]",
  },
  {
    value: "AI",
    label: "Powered Feedback",
    icon: Bot,
    accent: "bg-[#2563EB]",
    glow: "shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#2563EB] border-2 border-black dark:border-[#2563EB]",
  },
];

export default function StatsBar() {
  return (
    <section className="relative py-16 sm:py-20 overflow-hidden">
      {/* Floating gradient accent — sits behind the cards */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Asymmetric grid — first card spans 2 cols on large screens for visual weight */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            // Alternate vertical offsets for asymmetry on desktop
            const offsetClass =
              i % 2 === 1 ? "lg:translate-y-3" : "lg:-translate-y-1";

            return (
              <AnimateIn key={i} delay={i * 0.1}>
                <div
                  className={`group relative rounded-none bg-white dark:bg-gray-950 p-6 ${stat.glow} transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] dark:hover:shadow-[2px_2px_0_0_currentColor] ${offsetClass}`}
                >
                  <div className={`absolute top-0 left-0 right-0 h-2 rounded-none border-b-2 border-black dark:border-white ${stat.accent}`} />

                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 text-center sm:text-left">
                    {/* Icon with gradient background */}
                    <div
                      className={`shrink-0 flex h-14 w-14 items-center justify-center rounded-none ${stat.accent} border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] transition-transform group-hover:scale-105`}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </div>

                    <div className="min-w-0">
                      <Typography variant="h3" as="p" className="leading-none">
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
                      </Typography>
                      <Typography variant="span" color="muted" className="mt-1">
                        {stat.label}
                      </Typography>
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

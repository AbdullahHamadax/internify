"use client";

import { Users, Building2, ClipboardList, Cpu } from "lucide-react";
import CountUp from "@/components/CountUp";

const stats = [
  { value: 10000, suffix: "+", label: "Students", icon: Users, duration: 0.9 },
  { value: 50, suffix: "+", label: "Partner Companies", icon: Building2, duration: 0.7 },
  { value: 500, suffix: "+", label: "Tasks Posted", icon: ClipboardList, duration: 0.8 },
  { value: "AI", label: "Powered Feedback", icon: Cpu },
];

export default function StatsBar() {
  return (
    <section className="bg-[#F8FAFC] dark:bg-gray-900/50 py-14 border-y border-gray-100 dark:border-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#00BCD4]/10 to-[#7B1FA2]/10 dark:from-[#00BCD4]/20 dark:to-[#7B1FA2]/20">
                  <Icon className="h-5 w-5 text-[#1565C0] dark:text-[#42A5F5]" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
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
            );
          })}
        </div>
      </div>
    </section>
  );
}

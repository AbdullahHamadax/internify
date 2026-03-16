"use client";

import { CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import AnimateIn from "@/components/AnimateIn";
import { Typography } from "@/components/ui/Typography";

const studentBullets = [
  "Work on real tasks from top companies",
  "Get instant AI feedback on your submissions",
  "Earn tamper-proof verified certificates",
  "Auto-generate your CV and portfolio",
];

const employerBullets = [
  "Post challenges to attract skilled candidates",
  "AI evaluates submissions at scale",
  "Build your employer brand with students",
  "Hire from a pre-screened talent pool",
];

export default function AudienceSection() {
  return (
    <section className="relative z-10 isolate py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          {/* FOR STUDENTS */}
          <AnimateIn direction="left" delay={0.1}>
            <div
              id="for-students"
              className="rounded-none border-4 border-black dark:border-white bg-[#2563EB] dark:bg-gray-900 p-8 sm:p-10 shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#2563EB] scroll-mt-20"
            >
              <span className="inline-block rounded-none border-2 border-black dark:border-white bg-white dark:bg-black px-4 py-1.5 text-xs font-black text-black dark:text-white uppercase tracking-widest shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]">
                For Students
              </span>
              <Typography variant="h3" className="mt-5 text-white">
                Turn Learning Into a Career
              </Typography>
              <ul className="mt-6 space-y-4">
                {studentBullets.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-white dark:text-[#2563EB]" />
                    <Typography
                      variant="span"
                      color="default"
                      className="leading-relaxed font-bold text-white dark:text-white"
                    >
                      {item}
                    </Typography>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-8 inline-flex items-center gap-2 bg-black text-white dark:bg-[#2563EB] dark:text-black border-4 border-black dark:border-white rounded-none px-6 py-3 text-sm font-black uppercase tracking-widest shadow-[4px_4px_0_0_#AB47BC] transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
              >
                Start Learning Free
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </AnimateIn>

          {/* FOR EMPLOYERS */}
          <AnimateIn direction="right" delay={0.15}>
            <div
              id="for-employers"
              className="rounded-none border-4 border-black dark:border-white bg-[#AB47BC] dark:bg-gray-900 p-8 sm:p-10 shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#AB47BC] scroll-mt-20"
            >
              <span className="inline-block rounded-none border-2 border-black dark:border-white bg-white dark:bg-black px-4 py-1.5 text-xs font-black text-black dark:text-white uppercase tracking-widest shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]">
                For Employers
              </span>
              <Typography variant="h3" className="mt-5 text-white">
                Find Talent Before Anyone Else
              </Typography>
              <ul className="mt-6 space-y-4">
                {employerBullets.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-white dark:text-[#AB47BC]" />
                    <Typography
                      variant="span"
                      color="default"
                      className="leading-relaxed font-bold text-white dark:text-white"
                    >
                      {item}
                    </Typography>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-8 inline-flex items-center gap-2 bg-black text-white dark:bg-[#AB47BC] dark:text-white border-4 border-black dark:border-white rounded-none px-6 py-3 text-sm font-black uppercase tracking-widest shadow-[4px_4px_0_0_#2563EB] transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
              >
                Post a Challenge
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </AnimateIn>
        </div>
      </div>
    </section>
  );
}

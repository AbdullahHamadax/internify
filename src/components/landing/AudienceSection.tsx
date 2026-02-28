"use client";

import { CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

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
    <section className="py-20 sm:py-28 bg-[#F8FAFC] dark:bg-gray-900/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          {/* FOR STUDENTS */}
          <div
            id="for-students"
            className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 sm:p-10 scroll-mt-20"
          >
            <span className="inline-block rounded-full bg-blue-50 dark:bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
              For Students
            </span>
            <h3 className="mt-5 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Turn Learning Into a Career
            </h3>
            <ul className="mt-6 space-y-4">
              {studentBullets.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#00BCD4]" />
                  <span className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="mt-8 inline-flex items-center gap-2 bg-brand-gradient rounded-xl px-6 py-3 text-sm font-semibold text-white transition-transform hover:scale-105"
            >
              Start Learning Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* FOR EMPLOYERS */}
          <div
            id="for-employers"
            className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 sm:p-10 scroll-mt-20"
          >
            <span className="inline-block rounded-full bg-purple-50 dark:bg-purple-500/10 px-4 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wide">
              For Employers
            </span>
            <h3 className="mt-5 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Find Talent Before Anyone Else
            </h3>
            <ul className="mt-6 space-y-4">
              {employerBullets.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#7B1FA2]" />
                  <span className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="mt-8 inline-flex items-center gap-2 rounded-xl border-2 border-[#7B1FA2] px-6 py-3 text-sm font-semibold text-[#7B1FA2] dark:text-purple-400 transition-colors hover:bg-[#7B1FA2]/5"
            >
              Post a Challenge
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

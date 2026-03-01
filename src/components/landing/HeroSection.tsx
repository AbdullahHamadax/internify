"use client";

import { ArrowRight, Building2, Star } from "lucide-react";
import Link from "next/link";
import AnimateIn from "@/components/AnimateIn";

export default function HeroSection() {
  return (
    <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 overflow-hidden">
      {/* Subtle gradient blob decoration */}
      <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-gradient-to-br from-[#00BCD4]/8 via-[#1565C0]/6 to-[#7B1FA2]/8 dark:from-[#00BCD4]/15 dark:via-[#1565C0]/10 dark:to-[#7B1FA2]/15 rounded-full blur-3xl translate-x-1/3 -translate-y-1/4" />
      <div className="absolute bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-gradient-to-tr from-[#7B1FA2]/5 to-[#00BCD4]/5 dark:from-[#7B1FA2]/10 dark:to-[#00BCD4]/10 rounded-full blur-3xl -translate-x-1/3 translate-y-1/4" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left content */}
          <div className="max-w-xl">
            <AnimateIn delay={0}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
                <span className="text-gray-900 dark:text-white">
                  Build Skills That
                </span>
                <br />
                <span className="text-brand-gradient">Get You Hired.</span>
              </h1>
            </AnimateIn>

            <AnimateIn delay={0.1}>
              <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                Internify connects students with real employer challenges.
                Complete tasks, earn verified certificates, and land your first
                job faster.
              </p>
            </AnimateIn>

            <AnimateIn delay={0.2}>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/signup"
                  className="bg-brand-gradient inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/25"
                >
                  Start for Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-7 py-3.5 text-sm font-semibold text-gray-700 dark:text-gray-300 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700 hover:shadow-md dark:hover:border-purple-500/40 dark:hover:bg-gray-700 dark:hover:text-purple-300"
                >
                  Post a Task
                </Link>
              </div>
            </AnimateIn>
          </div>

          {/* Right – floating task card */}
          <AnimateIn
            direction="right"
            delay={0.15}
            className="relative flex justify-center lg:justify-end"
          >
            <div className="relative">
              {/* Glow behind the card */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#00BCD4]/20 via-[#1565C0]/15 to-[#7B1FA2]/20 rounded-3xl blur-2xl scale-105" />

              <div className="relative w-[320px] sm:w-[360px] rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-2xl animate-card-tilt">
                {/* Company row */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      TechCorp Inc.
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Software Engineering
                    </p>
                  </div>
                </div>

                {/* Task body */}
                <div className="mt-5">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Build a REST API
                  </h3>
                  <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    Design and implement a RESTful API for a task management
                    application with authentication.
                  </p>
                </div>

                {/* Badges */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-green-50 dark:bg-green-500/10 px-3 py-1 text-xs font-medium text-green-700 dark:text-green-400">
                    Intermediate
                  </span>
                  <span className="rounded-full bg-blue-50 dark:bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-400">
                    Backend
                  </span>
                  <span className="rounded-full bg-purple-50 dark:bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-700 dark:text-purple-400">
                    Node.js
                  </span>
                </div>

                {/* Footer */}
                <div className="mt-5 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-xs font-semibold">4.8</span>
                  </div>
                  <button className="bg-brand-gradient rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                    View Task
                  </button>
                </div>
              </div>
            </div>
          </AnimateIn>
        </div>
      </div>
    </section>
  );
}

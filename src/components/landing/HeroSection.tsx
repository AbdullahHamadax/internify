"use client";

import { ArrowRight, Building2, Star } from "lucide-react";
import Link from "next/link";
import AnimateIn from "@/components/AnimateIn";
import { Typography } from "@/components/ui/Typography";

export default function HeroSection() {
  return (
    <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 overflow-hidden">
      {/* Brutalist Grid Background overlay */}
      <div
        className="absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      ></div>
      <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-[#3B82F6] rounded-none translate-x-1/3 -translate-y-1/4 rotate-12 border-4 border-black dark:border-white shadow-[16px_16px_0_0_#AB47BC]" />
      <div className="absolute bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-[#AB47BC] rounded-none -translate-x-1/3 translate-y-1/4 -rotate-6 border-4 border-black dark:border-white shadow-[16px_16px_0_0_#3B82F6]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left content */}
          <div className="max-w-xl">
            <AnimateIn delay={0}>
              <Typography variant="h1">
                Build Skills That
                <br />
                <Typography
                  as="span"
                  variant="h1"
                  className="bg-[#AB47BC] text-white px-2 mt-2 inline-block border-4 border-black dark:border-white shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#3B82F6]"
                >
                  Get You Hired.
                </Typography>
              </Typography>
            </AnimateIn>

            <AnimateIn delay={0.1}>
              <Typography
                variant="p"
                color="muted"
                className="mt-6 text-lg leading-relaxed"
              >
                Internify connects students with real employer challenges.
                Complete tasks, earn verified certificates, and land your first
                job faster.
              </Typography>
            </AnimateIn>

            <AnimateIn delay={0.2}>
              <div className="mt-8 flex flex-wrap gap-4 relative z-10 pointer-events-auto">
                <Link
                  href="/signup"
                  className="bg-[#3B82F6] text-white border-4 border-black inline-flex items-center gap-2 rounded-none px-8 py-4 text-sm font-black uppercase tracking-widest shadow-[8px_8px_0_0_#000] transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#000] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none"
                >
                  Start for Free
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/signup"
                  className="bg-white text-black dark:bg-black dark:text-white border-4 border-black dark:border-white inline-flex items-center gap-2 rounded-none px-8 py-4 text-sm font-black uppercase tracking-widest shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#3B82F6] transition-all duration-200 hover:-translate-y-0 hover:bg-[#AB47BC] hover:text-white hover:border-black dark:hover:border-white hover:shadow-[4px_4px_0_0_#000] dark:hover:shadow-[4px_4px_0_0_#3B82F6] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none"
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
              {/* Glow behind the card removed for brutalism */}
              <div className="absolute inset-0 bg-[#AB47BC] rounded-none scale-105 translate-x-6 translate-y-6 border-4 border-black dark:border-white" />

              <div className="relative w-[320px] sm:w-[360px] rounded-none border-4 border-black dark:border-white bg-white dark:bg-black p-6 shadow-none">
                {/* Company row */}
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-none border-2 border-black dark:border-white bg-[#3B82F6] text-white shadow-[4px_4px_0_0_#000]">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <Typography variant="span" weight="semibold">
                      TechCorp Inc.
                    </Typography>
                    <Typography variant="caption" color="muted">
                      Software Engineering
                    </Typography>
                  </div>
                </div>

                {/* Task body */}
                <div className="mt-5">
                  <Typography variant="h4" as="h3" className="text-base">
                    Build a REST API
                  </Typography>
                  <Typography
                    variant="span"
                    color="muted"
                    className="mt-1.5 leading-relaxed"
                  >
                    Design and implement a RESTful API for a task management
                    application with authentication.
                  </Typography>
                </div>

                {/* Badges */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-none border-2 border-black dark:border-white bg-[#FF0055] px-3 py-1 text-xs font-black uppercase tracking-widest text-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]">
                    Intermediate
                  </span>
                  <span className="rounded-none border-2 border-black dark:border-white bg-[#3B82F6] px-3 py-1 text-xs font-black uppercase tracking-widest text-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]">
                    Backend
                  </span>
                  <span className="rounded-none border-2 border-black dark:border-white bg-[#AB47BC] px-3 py-1 text-xs font-black uppercase tracking-widest text-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]">
                    Node.js
                  </span>
                </div>

                {/* Footer */}
                <div className="mt-5 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-white bg-[#3B82F6] px-2 py-1 border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]">
                    <Star className="h-4 w-4 fill-current text-yellow-500" />
                    <span className="text-xs font-black ">4.8</span>
                  </div>
                  <button className="bg-black text-white dark:bg-white dark:text-black border-2 border-transparent px-4 py-2 text-xs font-black uppercase tracking-widest shadow-[4px_4px_0_0_#000] transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
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

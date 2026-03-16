"use client";

import { Zap, ChevronRight } from "lucide-react";
import Link from "next/link";
import AnimateIn from "@/components/AnimateIn";
import { Typography } from "@/components/ui/Typography";

export default function CtaSection() {
  return (
    <section className="relative py-20 sm:py-28 overflow-hidden border-y-8 border-black dark:border-white">
      {/* Accent box instead of gradient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[400px] bg-[#AB47BC] rounded-none border-8 border-white dark:border-black transform -rotate-2 -z-10" />

      <AnimateIn className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center bg-white dark:bg-black border-4 border-black dark:border-white p-12 shadow-[16px_16px_0_0_#2563EB] dark:shadow-[16px_16px_0_0_#AB47BC] transform rotate-1">
        <Zap className="mx-auto h-10 w-10 text-[#2563EB] mb-6" />
        <Typography variant="h2" color="default" className="text-black dark:text-white">
          Ready to start building your career?
        </Typography>
        <Typography
          variant="p"
          color="default"
          className="mt-6 text-xl max-w-xl mx-auto font-bold"
        >
          Join thousands of students completing real tasks and getting hired.
        </Typography>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/signup"
            className="bg-[#2563EB] text-white border-4 border-black inline-flex items-center gap-2 rounded-none px-8 py-4 text-sm font-black uppercase tracking-widest shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff] transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
          >
            Browse Tasks
            <ChevronRight className="h-5 w-5" />
          </Link>
          <Link
            href="#how-it-works"
            className="bg-white text-black dark:bg-black dark:text-white border-4 border-black dark:border-white inline-flex items-center gap-2 rounded-none px-8 py-4 text-sm font-black uppercase tracking-widest shadow-[8px_8px_0_0_#AB47BC] transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
          >
            Learn More
          </Link>
        </div>
      </AnimateIn>
    </section>
  );
}

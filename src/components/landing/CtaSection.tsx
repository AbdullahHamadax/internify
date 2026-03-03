"use client";

import { Zap, ChevronRight } from "lucide-react";
import Link from "next/link";
import AnimateIn from "@/components/AnimateIn";
import { Typography } from "@/components/ui/Typography";

export default function CtaSection() {
  return (
    <section className="noise-overlay relative bg-[#0F172A] py-20 sm:py-28 overflow-hidden">
      {/* Accent gradient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-[#00BCD4]/15 via-[#1565C0]/10 to-[#7B1FA2]/15 rounded-full blur-3xl" />

      <AnimateIn className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        <Zap className="mx-auto h-10 w-10 text-[#00BCD4] mb-6" />
        <Typography variant="h2" color="white">
          Ready to start building your career?
        </Typography>
        <Typography
          variant="p"
          color="muted"
          className="mt-4 text-lg max-w-xl mx-auto"
        >
          Join thousands of students completing real tasks and getting hired.
        </Typography>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/signup"
            className="bg-brand-gradient inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/25"
          >
            Browse Tasks
            <ChevronRight className="h-4 w-4" />
          </Link>
          <Link
            href="#how-it-works"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-7 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-white/35 hover:bg-white/10"
          >
            Learn More
          </Link>
        </div>
      </AnimateIn>
    </section>
  );
}

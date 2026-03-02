"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";

export default function NotFound() {
  // Apply the user's persisted theme on mount
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (
      stored === "dark" ||
      (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
    }
  }, []);
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-950 overflow-hidden px-4">
      {/* Gradient blobs */}
      <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-gradient-to-br from-[#00BCD4]/10 via-[#1565C0]/8 to-[#7B1FA2]/10 dark:from-[#00BCD4]/20 dark:via-[#1565C0]/15 dark:to-[#7B1FA2]/20 rounded-full blur-3xl translate-x-1/4 -translate-y-1/4" />
      <div className="absolute bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-gradient-to-tr from-[#7B1FA2]/8 to-[#00BCD4]/8 dark:from-[#7B1FA2]/15 dark:to-[#00BCD4]/15 rounded-full blur-3xl -translate-x-1/4 translate-y-1/4" />

      {/* Noise texture */}
      <div className="noise-overlay absolute inset-0 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 text-center max-w-lg">
        {/* Big 404 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <h1 className="text-[10rem] sm:text-[13rem] font-bold leading-none tracking-tighter text-brand-gradient select-none">
            404
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Page Not Found
          </h2>
          <p className="mt-3 text-base text-gray-500 dark:text-gray-400 leading-relaxed max-w-md mx-auto">
            Looks like this page got lost on its way to the interview.
            Let&apos;s get you back on track.
          </p>
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="mt-10 flex flex-wrap justify-center gap-4"
        >
          <Link
            href="/"
            className="bg-brand-gradient inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/25"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
        </motion.div>
      </div>

      {/* Decorative grid lines */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.03] dark:opacity-[0.06]"
        style={{
          backgroundImage: `linear-gradient(rgba(99, 102, 241, 0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.6) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}

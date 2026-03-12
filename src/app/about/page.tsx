"use client";

import {
  Target,
  Lightbulb,
  Bot,
  ShieldCheck,
  Handshake,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import AnimateIn from "@/components/AnimateIn";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import CtaSection from "@/components/landing/CtaSection";
import { Typography } from "@/components/ui/Typography";

/* ═══════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════ */

const problemPoints = [
  {
    icon: GraduationCap,
    title: "Theory Without Practice",
    text: "University curricula teach fundamentals, but graduates often lack hands-on experience with real business problems and modern tooling.",
  },
  {
    icon: Briefcase,
    title: "Hiring Is a Gamble",
    text: "Employers spend months screening candidates only to discover that degrees and GPAs don\u0027t reliably predict on-the-job performance.",
  },
  {
    icon: Target,
    title: "The First-Job Paradox",
    text: '"Need experience to get experience." Students are trapped in a loop where every entry-level role demands skills they never had the chance to prove.',
  },
];

const values = [
  {
    icon: Lightbulb,
    title: "Real-World Skills",
    desc: "Every task on Internify is authored by a real employer and mirrors actual work. No toy projects — only challenges that build genuine competence.",
    accent: "bg-blue-600",
  },
  {
    icon: Bot,
    title: "AI-Powered Fairness",
    desc: "Our AI evaluation engine scores submissions objectively and instantly, removing bias and giving every student an equal shot.",
    accent: "bg-purple-500",
  },
  {
    icon: ShieldCheck,
    title: "Verified Credentials",
    desc: "Certificates earned on Internify are tamper-proof and company-branded. Employers trust them because they represent proven ability.",
    accent: "bg-emerald-500",
  },
  {
    icon: Handshake,
    title: "Industry Partnerships",
    desc: "We partner directly with companies to create challenges that reflect their hiring needs, so students train on what actually matters.",
    accent: "bg-blue-600",
  },
];

/* ═══════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════ */

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar />

      {/* ─── HERO ─── */}
      <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-20 overflow-hidden">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <AnimateIn>
            <span className="inline-block rounded-none border-2 border-black dark:border-white bg-blue-100 dark:bg-blue-900/50 px-5 py-2 text-xs font-black text-blue-700 dark:text-blue-300 uppercase tracking-widest mb-6 shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]">
              Our Story
            </span>
            <Typography variant="h1">
              <Typography as="span" variant="h1">
                Why We Built{" "}
              </Typography>
              <Typography as="span" variant="h1" className="text-blue-600 dark:text-blue-600">
                Internify
              </Typography>
            </Typography>
          </AnimateIn>

          <AnimateIn delay={0.1}>
            <Typography
              variant="p"
              color="muted"
              className="mt-6 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto"
            >
              Internify is an AI-powered, two-sided learning-to-hiring platform
              that closes the gap between university training and industry needs
              by hosting employer-authored, real-world challenges.
            </Typography>
          </AnimateIn>
        </div>
      </section>

      {/* ─── THE PROBLEM ─── */}
      <section className="dot-pattern relative z-10 isolate py-20 sm:py-28 bg-[#F8FAFC] dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateIn className="text-center max-w-2xl mx-auto">
            <Typography variant="h2">The Problem We Saw</Typography>
            <Typography variant="p" color="muted" className="mt-4 text-lg">
              The bridge between education and employment is broken — and
              everyone pays the price.
            </Typography>
          </AnimateIn>

          <div className="mt-14 grid md:grid-cols-3 gap-6 lg:gap-8">
            {problemPoints.map((item, i) => {
              const Icon = item.icon;
              return (
                <AnimateIn key={item.title} delay={i * 0.1}>
                  <div className="rounded-2xl border-2 border-black dark:border-white bg-white dark:bg-gray-900 p-8 h-full transition-transform duration-300 hover:-translate-y-1 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <Typography variant="h4" as="h3" className="mt-5">
                      {item.title}
                    </Typography>
                    <Typography
                      variant="span"
                      color="muted"
                      className="mt-3 leading-relaxed"
                    >
                      {item.text}
                    </Typography>
                  </div>
                </AnimateIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── OUR SOLUTION ─── */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <AnimateIn className="text-center max-w-2xl mx-auto">
            <Typography variant="h2">Our Solution</Typography>
            <Typography variant="p" color="muted" className="mt-4 text-lg">
              We flipped the script: instead of guessing who&apos;s job-ready,
              let them prove it.
            </Typography>
          </AnimateIn>

          <AnimateIn delay={0.15}>
            <div className="mt-14 rounded-2xl border-2 border-black dark:border-white bg-white dark:bg-gray-900 p-8 sm:p-10 shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff]">
              <div className="space-y-6 text-gray-600 dark:text-gray-400 leading-relaxed text-base">
                <Typography variant="p">
                  Internify is a{" "}
                  <strong className="text-gray-900 dark:text-white">
                    two-sided marketplace
                  </strong>{" "}
                  where{" "}
                  <strong className="text-gray-900 dark:text-white">
                    employers post real-world challenges
                  </strong>{" "}
                  and{" "}
                  <strong className="text-gray-900 dark:text-white">
                    students solve them
                  </strong>{" "}
                  to prove their skills. Think of it as an internship experience
                  condensed into focused, bite-sized tasks.
                </Typography>
                <Typography variant="p">
                  Every submission is evaluated by our{" "}
                  <strong className="text-gray-900 dark:text-white">
                    AI-powered engine
                  </strong>
                  , providing instant, objective, and detailed feedback — no
                  waiting weeks for a human reviewer. Students who pass earn{" "}
                  <strong className="text-gray-900 dark:text-white">
                    verified, tamper-proof certificates
                  </strong>{" "}
                  branded by the employer, turning every completed challenge
                  into a concrete portfolio piece.
                </Typography>
                <Typography variant="p">
                  For employers, this means access to a{" "}
                  <strong className="text-gray-900 dark:text-white">
                    pre-screened talent pool
                  </strong>{" "}
                  of candidates who have already demonstrated they can do the
                  work — reducing time-to-hire and eliminating the guesswork
                  from entry-level recruitment.
                </Typography>
              </div>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* ─── VALUES / WHAT SETS US APART ─── */}
      <section className="noise-overlay relative py-20 sm:py-28 bg-[#F8FAFC] dark:bg-gray-950 overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateIn className="text-center max-w-2xl mx-auto">
            <Typography variant="h2">What Sets Us Apart</Typography>
            <Typography variant="p" color="muted" className="mt-4 text-lg">
              Built on principles that put students and employers first.
            </Typography>
          </AnimateIn>

          <div className="mt-14 grid sm:grid-cols-2 gap-6 lg:gap-8">
            {values.map((val, i) => {
              const Icon = val.icon;
              return (
                <AnimateIn key={val.title} delay={i * 0.1}>
                  <div className="group rounded-2xl border-2 border-black dark:border-white bg-white dark:bg-gray-900 p-8 h-full transition-transform duration-300 hover:-translate-y-1 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]">
                    <div
                      className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${val.accent} border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <Typography variant="h4" as="h3" className="mt-5">
                      {val.title}
                    </Typography>
                    <Typography
                      variant="span"
                      color="muted"
                      className="mt-3 leading-relaxed"
                    >
                      {val.desc}
                    </Typography>
                  </div>
                </AnimateIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <CtaSection />

      <Footer />
    </div>
  );
}

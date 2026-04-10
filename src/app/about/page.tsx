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
import FloatingCells from "@/components/about/FloatingCells";
import Chatbot from "@/components/Chatbot";

/* ═══════════════════════════════════════════════════════════
   PALETTE
   ═══════════════════════════════════════════════════════════ */

const RED = "#EA4335";
const MINT = "#A7F3D0";
const MINT_DARK = "#34D399"; // readable on dark backgrounds
const STUDENT_BLUE = "#2563EB";
const EMPLOYER_PURPLE = "#A855F7";

const heroShapes = [
  {
    id: "hero-blue-burst",
    x: "6%",
    y: "16%",
    size: 54,
    color: STUDENT_BLUE,
    shape: "burst" as const,
    duration: 20,
    delay: -6,
    driftX: 20,
    driftY: 16,
    rotate: -12,
    opacity: 0.94,
  },
  {
    id: "hero-purple-sparkle",
    x: "88%",
    y: "12%",
    size: 62,
    color: EMPLOYER_PURPLE,
    shape: "sparkle" as const,
    duration: 24,
    delay: -12,
    driftX: 24,
    driftY: 18,
    rotate: 10,
    opacity: 0.92,
  },
  {
    id: "hero-blue-diamond",
    x: "14%",
    y: "72%",
    size: 28,
    color: STUDENT_BLUE,
    shape: "diamond" as const,
    duration: 18,
    delay: -4,
    driftX: 16,
    driftY: 12,
    rotate: 16,
    opacity: 0.82,
  },
  {
    id: "hero-purple-diamond",
    x: "79%",
    y: "78%",
    size: 34,
    color: EMPLOYER_PURPLE,
    shape: "diamond" as const,
    duration: 19,
    delay: -9,
    driftX: 18,
    driftY: 14,
    rotate: -14,
    opacity: 0.8,
  },
];

const problemShapes = [
  {
    id: "problem-left-sparkle",
    x: "4%",
    y: "17%",
    size: 56,
    color: RED,
    shape: "sparkle" as const,
    duration: 22,
    delay: -7,
    driftX: 18,
    driftY: 16,
    rotate: -10,
    opacity: 0.95,
  },
  {
    id: "problem-right-burst",
    x: "89%",
    y: "10%",
    size: 60,
    color: RED,
    shape: "burst" as const,
    duration: 25,
    delay: -11,
    driftX: 22,
    driftY: 18,
    rotate: 12,
    opacity: 0.94,
  },
  {
    id: "problem-bottom-diamond",
    x: "18%",
    y: "80%",
    size: 30,
    color: RED,
    shape: "diamond" as const,
    duration: 17,
    delay: -5,
    driftX: 14,
    driftY: 12,
    rotate: -18,
    opacity: 0.82,
  },
];

const solutionShapes = [
  {
    id: "solution-left-burst",
    x: "9%",
    y: "12%",
    size: 56,
    color: MINT_DARK,
    shape: "burst" as const,
    duration: 23,
    delay: -8,
    driftX: 20,
    driftY: 16,
    rotate: -16,
    opacity: 0.94,
  },
  {
    id: "solution-right-sparkle",
    x: "87%",
    y: "64%",
    size: 66,
    color: MINT_DARK,
    shape: "sparkle" as const,
    duration: 27,
    delay: -13,
    driftX: 24,
    driftY: 20,
    rotate: 10,
    opacity: 0.92,
  },
  {
    id: "solution-top-diamond",
    x: "73%",
    y: "18%",
    size: 28,
    color: MINT_DARK,
    shape: "diamond" as const,
    duration: 16,
    delay: -3,
    driftX: 12,
    driftY: 10,
    rotate: 18,
    opacity: 0.8,
  },
];

const valuesShapes = [
  {
    id: "values-blue-diamond",
    x: "6%",
    y: "18%",
    size: 32,
    color: STUDENT_BLUE,
    shape: "diamond" as const,
    duration: 18,
    delay: -4,
    driftX: 12,
    driftY: 10,
    rotate: -12,
    opacity: 0.76,
  },
  {
    id: "values-purple-diamond",
    x: "92%",
    y: "68%",
    size: 36,
    color: EMPLOYER_PURPLE,
    shape: "diamond" as const,
    duration: 20,
    delay: -9,
    driftX: 14,
    driftY: 12,
    rotate: 12,
    opacity: 0.76,
  },
];

/* ═══════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════ */

const problemPoints = [
  {
    icon: GraduationCap,
    title: "Theory Without Practice",
    text: "University curricula teach fundamentals, but graduates often lack hands-on experience with real business problems and modern tooling.",
    tilt: "-1.5deg",
  },
  {
    icon: Briefcase,
    title: "Hiring Is a Gamble",
    text: "Employers spend months screening candidates only to discover that degrees and GPAs don\u0027t reliably predict on-the-job performance.",
    tilt: "1deg",
  },
  {
    icon: Target,
    title: "The First-Job Paradox",
    text: '"Need experience to get experience." Students are trapped in a loop where every entry-level role demands skills they never had the chance to prove.',
    tilt: "-0.5deg",
  },
];

const values = [
  {
    icon: Lightbulb,
    title: "Real-World Skills",
    desc: "Every task on Internify is authored by a real employer and mirrors actual work. No toy projects — only challenges that build genuine competence.",
    accent: "bg-blue-600",
    color: "#2563EB",
  },
  {
    icon: Bot,
    title: "AI-Powered Fairness",
    desc: "Our AI evaluation engine scores submissions objectively and instantly, removing bias and giving every student an equal shot.",
    accent: "bg-purple-500",
    color: "#A855F7",
  },
  {
    icon: ShieldCheck,
    title: "Verified Credentials",
    desc: "Certificates earned on Internify are tamper-proof and company-branded. Employers trust them because they represent proven ability.",
    accent: "bg-emerald-500",
    color: "#10B981",
  },
  {
    icon: Handshake,
    title: "Industry Partnerships",
    desc: "We partner directly with companies to create challenges that reflect their hiring needs, so students train on what actually matters.",
    accent: "bg-blue-600",
    color: "#2563EB",
  },
];

/* ═══════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════ */

export default function AboutPage() {
  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-950">
      {/* ── Line-grid background ── */}
      <div
        className="fixed inset-0 z-0 opacity-[0.07] pointer-events-none dark:opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        <Navbar />

        {/* ─── HERO ─── */}
        <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-20 overflow-hidden">
          <FloatingCells shapes={heroShapes} className="z-[1]" />
          <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <AnimateIn>
              <span className="inline-block rounded-none border-2 border-black dark:border-white bg-blue-100 dark:bg-blue-900/50 px-5 py-2 text-xs font-black text-blue-700 dark:text-blue-300 uppercase tracking-widest mb-6 shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]">
                Our Story
              </span>
              <Typography variant="h1">
                <Typography as="span" variant="h1">
                  Why We Built{" "}
                </Typography>
                <Typography
                  as="span"
                  variant="h1"
                  className="text-blue-600 dark:text-blue-600"
                >
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

        {/* ─────────────────────────────────────────────────────
            THE PROBLEM — Red / Tension Treatment
            ───────────────────────────────────────────────────── */}
        <section className="relative z-10 isolate py-20 sm:py-28 overflow-hidden">
          <FloatingCells shapes={problemShapes} className="z-[1]" />
          {/* Red-tinted background band */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, transparent 0%, ${RED}08 15%, ${RED}0D 50%, ${RED}08 85%, transparent 100%)`,
            }}
            aria-hidden="true"
          />
          {/* Diagonal scratch lines — "broken system" texture */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.04]"
            style={{
              backgroundImage: `repeating-linear-gradient(
                -45deg,
                ${RED},
                ${RED} 1px,
                transparent 1px,
                transparent 24px
              )`,
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimateIn className="text-center max-w-2xl mx-auto">
              <Typography variant="h2">The Problem We Saw</Typography>
              <Typography variant="p" color="muted" className="mt-4 text-lg">
                The bridge between education and employment is broken — and
                everyone pays the price.
              </Typography>
            </AnimateIn>

            {/* Cracked divider */}
            <div className="mt-10 mb-14 flex items-center justify-center gap-2">
              <div
                className="h-[3px] w-16 rounded-full"
                style={{ background: RED }}
              />
              <div
                className="h-[3px] w-8 rounded-full opacity-50"
                style={{ background: RED }}
              />
              <div
                className="h-[3px] w-4 rounded-full opacity-25"
                style={{ background: RED }}
              />
            </div>

            {/* Offset / tilted problem cards */}
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {problemPoints.map((item, i) => {
                const Icon = item.icon;
                return (
                  <AnimateIn key={item.title} delay={i * 0.12}>
                    <div
                      className="relative rounded-2xl bg-white dark:bg-gray-900 p-8 h-full transition-all duration-500 hover:rotate-0 hover:-translate-y-1 group"
                      style={{
                        transform: `rotate(${item.tilt})`,
                        borderLeft: `4px solid ${RED}`,
                        borderTop: "1px solid #fecaca",
                        borderRight: "1px solid #fecaca",
                        borderBottom: "1px solid #fecaca",
                        boxShadow: `0 4px 16px ${RED}15, 0 1px 3px rgba(0,0,0,0.06)`,
                      }}
                    >
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]"
                        style={{ backgroundColor: RED }}
                      >
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

        {/* ─────────────────────────────────────────────────────
            TRANSITION — Red → Mint gradient band
            ───────────────────────────────────────────────────── */}
        <div className="relative z-10 -my-1">
          <div
            className="h-1 w-full"
            style={{
              background: `linear-gradient(90deg, ${RED} 0%, ${RED}80 25%, ${MINT_DARK}80 75%, ${MINT_DARK} 100%)`,
            }}
            aria-hidden="true"
          />
        </div>

        {/* ─────────────────────────────────────────────────────
            OUR SOLUTION — Mint / Relief Treatment
            ───────────────────────────────────────────────────── */}
        <section className="relative py-20 sm:py-28 overflow-hidden">
          <FloatingCells shapes={solutionShapes} className="z-[1]" />
          {/* Mint-tinted background band */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, transparent 0%, ${MINT}15 15%, ${MINT}22 50%, ${MINT}15 85%, transparent 100%)`,
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <AnimateIn className="text-center max-w-2xl mx-auto">
              <Typography variant="h2">Our Solution</Typography>
              <Typography variant="p" color="muted" className="mt-4 text-lg">
                We flipped the script: instead of guessing who&apos;s job-ready,
                let them prove it.
              </Typography>
            </AnimateIn>

            {/* Mint divider — calm, continuous */}
            <div className="mt-10 mb-14 flex items-center justify-center">
              <div
                className="h-[3px] w-32 rounded-full"
                style={{ background: MINT_DARK, opacity: 0.5 }}
              />
            </div>

            <AnimateIn delay={0.15}>
              <div
                className="relative rounded-2xl p-8 sm:p-10 overflow-hidden"
                style={{
                  borderLeft: `4px solid ${MINT_DARK}`,
                  borderTop: `1px solid ${MINT}`,
                  borderRight: `1px solid ${MINT}`,
                  borderBottom: `1px solid ${MINT}`,
                  background: `linear-gradient(135deg, rgba(167,243,208,0.08) 0%, rgba(52,211,153,0.04) 100%)`,
                  boxShadow: `0 4px 16px rgba(52,211,153,0.08), 0 1px 3px rgba(0,0,0,0.04)`,
                }}
              >
                {/* Subtle mint glow bottom-right */}
                <div
                  className="absolute bottom-0 right-0 w-40 h-40 rounded-tl-full pointer-events-none opacity-[0.08]"
                  style={{ background: MINT }}
                  aria-hidden="true"
                />

                <div className="relative space-y-6 text-gray-600 dark:text-gray-400 leading-relaxed text-base">
                  <Typography variant="p">
                    Internify is a{" "}
                    <strong
                      className="text-gray-900 dark:text-white"
                      style={{
                        borderBottom: `2px solid ${MINT_DARK}`,
                        paddingBottom: 2,
                      }}
                    >
                      two-sided marketplace
                    </strong>{" "}
                    where{" "}
                    <strong
                      className="text-gray-900 dark:text-white"
                      style={{
                        borderBottom: `2px solid ${MINT_DARK}`,
                        paddingBottom: 2,
                      }}
                    >
                      employers post real-world challenges
                    </strong>{" "}
                    and{" "}
                    <strong
                      className="text-gray-900 dark:text-white"
                      style={{
                        borderBottom: `2px solid ${MINT_DARK}`,
                        paddingBottom: 2,
                      }}
                    >
                      students solve them
                    </strong>{" "}
                    to prove their skills. Think of it as an internship
                    experience condensed into focused, bite-sized tasks.
                  </Typography>
                  <Typography variant="p">
                    Every submission is evaluated by our{" "}
                    <strong
                      className="text-gray-900 dark:text-white"
                      style={{
                        borderBottom: `2px solid ${MINT_DARK}`,
                        paddingBottom: 2,
                      }}
                    >
                      AI-powered engine
                    </strong>
                    , providing instant, objective, and detailed feedback — no
                    waiting weeks for a human reviewer. Students who pass earn{" "}
                    <strong
                      className="text-gray-900 dark:text-white"
                      style={{
                        borderBottom: `2px solid ${MINT_DARK}`,
                        paddingBottom: 2,
                      }}
                    >
                      verified, tamper-proof certificates
                    </strong>{" "}
                    branded by the employer, turning every completed challenge
                    into a concrete portfolio piece.
                  </Typography>
                  <Typography variant="p">
                    For employers, this means access to a{" "}
                    <strong
                      className="text-gray-900 dark:text-white"
                      style={{
                        borderBottom: `2px solid ${MINT_DARK}`,
                        paddingBottom: 2,
                      }}
                    >
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
        <section className="relative py-20 sm:py-28 overflow-hidden">
          <FloatingCells shapes={valuesShapes} className="z-[1]" />
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
                    <div
                      className="relative group rounded-2xl bg-white dark:bg-gray-900 p-8 h-full transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                      style={{
                        borderLeft: `4px solid ${val.color}`,
                        borderTop: "1px solid #e2e8f0",
                        borderRight: "1px solid #e2e8f0",
                        borderBottom: "1px solid #e2e8f0",
                        boxShadow: `0 2px 8px rgba(0,0,0,0.06)`,
                      }}
                    >
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
        <Chatbot userRole="guest" />
      </div>
    </div>
  );
}

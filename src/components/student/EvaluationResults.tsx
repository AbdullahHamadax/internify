"use client";

import { motion, Variants } from "motion/react";
import {
  X,
  Trophy,
  TrendingUp,
  Lightbulb,
  ChevronRight,
  Sparkles,
  Shield,
  Code2,
  Brain,
  Globe,
  Layers,
} from "lucide-react";
import { Typography } from "@/components/ui/Typography";

interface ScoreDimension {
  dimension: string;
  score: number;
  comment: string;
}

export interface EvaluationData {
  agentType: string;
  overallScore: number;
  verdict: string;
  scores: ScoreDimension[];
  strengths: string[];
  improvements: string[];
  summary: string;
}

interface EvaluationResultsProps {
  evaluation: EvaluationData;
  taskTitle: string;
  companyName: string;
  onClose: () => void;
}

// Agent display metadata
const AGENT_META: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  web: { label: "Web Development", icon: <Globe className="w-4 h-4" />, color: "#2563EB", bg: "#DBEAFE" },
  ai_ml: { label: "AI / Machine Learning", icon: <Brain className="w-4 h-4" />, color: "#7C3AED", bg: "#EDE9FE" },
  fullstack: { label: "Full Stack", icon: <Layers className="w-4 h-4" />, color: "#059669", bg: "#D1FAE5" },
  se: { label: "Software Engineering", icon: <Code2 className="w-4 h-4" />, color: "#D97706", bg: "#FEF3C7" },
  cybersec: { label: "Cybersecurity", icon: <Shield className="w-4 h-4" />, color: "#DC2626", bg: "#FEE2E2" },
};

function getScoreColor(score: number): string {
  if (score >= 90) return "#059669";
  if (score >= 75) return "#2563EB";
  if (score >= 60) return "#D97706";
  if (score >= 40) return "#EA580C";
  return "#DC2626";
}

function getScoreBg(score: number): string {
  if (score >= 90) return "#D1FAE5";
  if (score >= 75) return "#DBEAFE";
  if (score >= 60) return "#FEF3C7";
  if (score >= 40) return "#FFEDD5";
  return "#FEE2E2";
}

function getVerdictEmoji(verdict: string): string {
  switch (verdict) {
    case "Excellent": return "🏆";
    case "Good": return "✨";
    case "Satisfactory": return "👍";
    case "Needs Improvement": return "📝";
    case "Insufficient": return "⚠️";
    default: return "📊";
  }
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

// ── Animated Score Gauge ──
function ScoreGauge({ score }: { score: number }) {
  const color = getScoreColor(score);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-36 h-36 md:w-44 md:h-44">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        {/* Background ring */}
        <circle
          cx="60" cy="60" r="54"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/30"
        />
        {/* Score ring */}
        <motion.circle
          cx="60" cy="60" r="54"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="square"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        />
      </svg>
      {/* Center score text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl md:text-5xl font-black tracking-tighter"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
        >
          {score}
        </motion.span>
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
          / 100
        </span>
      </div>
    </div>
  );
}

// ── Dimension Score Bar ──
function DimensionBar({ dimension, score, comment, index }: ScoreDimension & { index: number }) {
  const color = getScoreColor(score);
  const bg = getScoreBg(score);

  return (
    <motion.div
      variants={itemVariants}
      className="p-4 bg-card border-2 border-black dark:border-white shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_#fff]"
    >
      <div className="flex items-center justify-between mb-2">
        <Typography variant="h4" className="text-sm font-black uppercase tracking-wide">
          {dimension}
        </Typography>
        <span
          className="text-sm font-black px-2.5 py-0.5 border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]"
          style={{ backgroundColor: bg, color }}
        >
          {score}
        </span>
      </div>

      {/* Score bar */}
      <div className="w-full h-2.5 bg-muted border border-black dark:border-white overflow-hidden mb-3">
        <motion.div
          className="h-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, delay: 0.2 + index * 0.1, ease: "easeOut" }}
        />
      </div>

      <Typography variant="p" color="muted" className="text-xs leading-relaxed">
        {comment}
      </Typography>
    </motion.div>
  );
}

// ── Main Component ──
export default function EvaluationResults({
  evaluation,
  taskTitle,
  companyName,
  onClose,
}: EvaluationResultsProps) {
  const agentMeta = AGENT_META[evaluation.agentType] ?? AGENT_META.se;
  const scoreColor = getScoreColor(evaluation.overallScore);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        className="relative w-full max-w-2xl bg-card border-4 border-black dark:border-white shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between p-5 border-b-4 border-black dark:border-white">
          <div className="min-w-0 flex-1 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <Typography variant="h3" className="uppercase font-black tracking-tight">
                AI Evaluation Report
              </Typography>
            </div>
            <Typography variant="span" color="muted" className="text-sm truncate block">
              {taskTitle} • {companyName}
            </Typography>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 border-2 border-black dark:border-white bg-white dark:bg-black shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <motion.div
            initial="hidden"
            animate="show"
            variants={containerVariants}
            className="space-y-6"
          >
            {/* Agent Badge */}
            <motion.div variants={itemVariants} className="flex items-center gap-3">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-widest border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]"
                style={{ backgroundColor: agentMeta.bg, color: agentMeta.color }}
              >
                {agentMeta.icon}
                {agentMeta.label} Agent
              </span>
            </motion.div>

            {/* ── Score Hero ── */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center gap-6 p-6 border-4 border-black dark:border-white shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#fff]"
              style={{
                background: `linear-gradient(135deg, ${getScoreBg(evaluation.overallScore)}88, transparent)`,
              }}
            >
              <ScoreGauge score={evaluation.overallScore} />

              <div className="flex-1 text-center sm:text-left space-y-3">
                <div className="flex items-center justify-center sm:justify-start gap-3">
                  <span className="text-3xl">{getVerdictEmoji(evaluation.verdict)}</span>
                  <Typography
                    variant="h2"
                    className="tracking-tight"
                    style={{ color: scoreColor }}
                  >
                    {evaluation.verdict}
                  </Typography>
                </div>

                <Typography variant="p" color="muted" className="text-sm leading-relaxed">
                  {evaluation.summary}
                </Typography>
              </div>
            </motion.div>

            {/* ── Rubric Breakdown ── */}
            <motion.div variants={itemVariants}>
              <Typography variant="h3" className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5" style={{ color: scoreColor }} />
                Rubric Breakdown
              </Typography>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {evaluation.scores.map((s, i) => (
                  <DimensionBar key={s.dimension} {...s} index={i} />
                ))}
              </div>
            </motion.div>

            {/* ── Strengths ── */}
            {evaluation.strengths.length > 0 && (
              <motion.div variants={itemVariants}>
                <Typography variant="h3" className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  Strengths
                </Typography>

                <div className="space-y-2">
                  {evaluation.strengths.map((strength, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-600 dark:border-emerald-500"
                    >
                      <ChevronRight className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <Typography variant="p" className="text-sm">
                        {strength}
                      </Typography>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Improvements ── */}
            {evaluation.improvements.length > 0 && (
              <motion.div variants={itemVariants}>
                <Typography variant="h3" className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  Suggested Improvements
                </Typography>

                <div className="space-y-2">
                  {evaluation.improvements.map((improvement, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-500 dark:border-amber-400"
                    >
                      <ChevronRight className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <Typography variant="p" className="text-sm">
                        {improvement}
                      </Typography>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* ── Footer ── */}
        <div className="p-5 border-t-4 border-black dark:border-white flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 border-2 border-black dark:border-white font-black uppercase text-xs tracking-widest shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] dark:hover:shadow-[2px_2px_0_0_#fff] transition-all bg-[#2563EB] text-white"
          >
            Close Report
          </button>
        </div>
      </motion.div>
    </div>
  );
}

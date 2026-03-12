"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Typography } from "@/components/ui/Typography";

type Role = "student" | "employer";
type Mode = "login" | "signup";
type RoleKey = Role | "default";

type HeroCopy = {
  title: string;
  accent: string;
  description: string;
  trustTitle: string;
  trustSubtitle: string;
  accentColor: string;
};

const HERO_COPY: {
  signup: Record<RoleKey, HeroCopy>;
  login: Record<Role, HeroCopy>;
} = {
  signup: {
    default: {
      title: "Join us",
      accent: "Today",
      description:
        "The bridge between academic theory and industry reality. Join the future of hiring.",
      trustTitle: "Trusted by Leaders",
      trustSubtitle: "Students | Employers | Training Partners",
      accentColor: "text-blue-600",
    },
    student: {
      title: "Launch your",
      accent: "Career",
      description:
        "Solve real challenges, build your portfolio, and stand out to top employers.",
      trustTitle: "Built for Students",
      trustSubtitle: "Learn | Practice | Get Hired",
      accentColor: "text-blue-600",
    },
    employer: {
      title: "Build your",
      accent: "Team",
      description:
        "Post practical challenges, evaluate talent objectively, and hire with confidence.",
      trustTitle: "Built for Hiring Teams",
      trustSubtitle: "Screen Faster | Hire Better",
      accentColor: "text-purple-500",
    },
  },
  login: {
    student: {
      title: "Welcome",
      accent: "Back!",
      description:
        "Pick up your progress, continue solving tasks, and grow your profile.",
      trustTitle: "Student Workspace",
      trustSubtitle: "Tasks | Portfolio | Certificates",
      accentColor: "text-blue-600",
    },
    employer: {
      title: "Welcome",
      accent: "Back!",
      description:
        "Review submissions, manage challenges, and move your hiring pipeline forward.",
      trustTitle: "Employer Workspace",
      trustSubtitle: "Challenges | Reviews | Hiring",
      accentColor: "text-purple-500",
    },
  },
};

function parseRole(value: string | null): Role | null {
  return value === "student" || value === "employer" ? value : null;
}

export function AuthHero() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const mode: Mode = pathname.includes("/login") ? "login" : "signup";
  const role = parseRole(searchParams.get("role"));
  const content =
    mode === "login"
      ? HERO_COPY.login[role ?? "student"]
      : HERO_COPY.signup[role ?? "default"];

  const isEmployer = role === "employer";

  return (
    <>
      {/* Dynamic Brutalist Background Shapes */}
      <div 
        className={`absolute top-1/4 -right-20 w-[600px] h-[600px] ${isEmployer ? 'bg-[#AB47BC]' : 'bg-[#2563EB]'} rotate-12 z-0 border-4 border-black box-content shadow-[16px_16px_0_0_rgba(0,0,0,1)] dark:border-white dark:shadow-[16px_16px_0_0_rgba(255,255,255,1)] transition-colors duration-500`} 
      />
      <div 
        className={`absolute bottom-10 left-10 w-64 h-64 ${isEmployer ? 'bg-[#2563EB]' : 'bg-[#AB47BC]'} -rotate-6 z-0 border-4 border-black shadow-[12px_12px_0_0_rgba(0,0,0,1)] dark:border-white dark:shadow-[12px_12px_0_0_rgba(255,255,255,1)] transition-colors duration-500`} 
      />

      <div className="relative z-10 max-w-md">
        <Typography
          variant="h1"
          className="mb-6 text-6xl leading-tight font-black uppercase tracking-widest text-black dark:text-white"
        >
          {content.title} <br />
          <span className={`inline-block border-4 border-black dark:border-white px-2 mt-2 bg-white dark:bg-black shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff] transition-colors duration-500 ${content.accentColor}`}>
            {content.accent}
          </span>
        </Typography>

        <Typography
          variant="p"
          className="mb-10 text-xl font-bold uppercase tracking-widest text-black dark:text-white max-w-sm"
        >
          {content.description}
        </Typography>

        <div className="flex items-center gap-4 border-4 border-black dark:border-white bg-white dark:bg-black p-4 shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff]">
          <div className="flex -space-x-3">
            {[
              { letter: "S", color: "bg-[#2563EB]" },
              { letter: "E", color: "bg-[#AB47BC]" },
              { letter: "T", color: "bg-[#10B981]" },
            ].map((avatar) => (
              <div
                key={avatar.letter}
                className={`flex h-10 w-10 items-center justify-center ${avatar.color} text-sm font-black text-white border-2 border-black dark:border-white`}
              >
                {avatar.letter}
              </div>
            ))}
          </div>
          <div className="text-sm">
            <Typography variant="span" className="block font-black uppercase tracking-widest text-black dark:text-white text-base">
              {content.trustTitle}
            </Typography>
            <Typography variant="caption" className="block font-bold uppercase tracking-widest text-black dark:text-white opacity-80 mt-1">
              {content.trustSubtitle}
            </Typography>
          </div>
        </div>
      </div>
    </>
  );
}

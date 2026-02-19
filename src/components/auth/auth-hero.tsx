"use client";

import { usePathname, useSearchParams } from "next/navigation";

type Role = "student" | "employer";
type Mode = "login" | "signup";
type RoleKey = Role | "default";

type HeroCopy = {
  title: string;
  accent: string;
  description: string;
  trustTitle: string;
  trustSubtitle: string;
  accentGradient: string;
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
      trustSubtitle: "Microsoft | IBM | ITI",
      accentGradient: "from-cyan-200 to-fuchsia-200",
    },
    student: {
      title: "Launch your",
      accent: "Career",
      description:
        "Solve real challenges, build your portfolio, and stand out to top employers.",
      trustTitle: "Built for Students",
      trustSubtitle: "Learn | Practice | Get Hired",
      accentGradient: "from-cyan-200 to-white",
    },
    employer: {
      title: "Build your",
      accent: "Team",
      description:
        "Post practical challenges, evaluate talent objectively, and hire with confidence.",
      trustTitle: "Built for Hiring Teams",
      trustSubtitle: "Screen Faster | Hire Better",
      accentGradient: "from-fuchsia-200 to-white",
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
      accentGradient: "from-cyan-200 to-white",
    },
    employer: {
      title: "Welcome",
      accent: "Back!",
      description:
        "Review submissions, manage challenges, and move your hiring pipeline forward.",
      trustTitle: "Employer Workspace",
      trustSubtitle: "Challenges | Reviews | Hiring",
      accentGradient: "from-fuchsia-200 to-white",
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

  return (
    <div className="relative z-10 max-w-md">
      <h1 className="mb-6 text-5xl font-extrabold leading-tight drop-shadow-sm">
        {content.title} <br />
        <span
          className={`bg-gradient-to-r bg-clip-text text-transparent ${content.accentGradient}`}
        >
          {content.accent}
        </span>
      </h1>

      <p className="mb-8 text-lg font-medium text-blue-50">
        {content.description}
      </p>

      <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-md">
        <div className="flex -space-x-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-9 w-9 rounded-full bg-slate-200 ring-2 ring-white/20"
            />
          ))}
        </div>
        <div className="text-sm">
          <p className="font-bold text-white">{content.trustTitle}</p>
          <p className="text-xs text-cyan-200 opacity-90">
            {content.trustSubtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

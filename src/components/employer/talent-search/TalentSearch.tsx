"use client";

import { useState } from "react";
import {
  Search,
  Filter,
  MapPin,
  Briefcase,
  GraduationCap,
  Github,
  Linkedin,
  CheckCircle2,
  Star,
  ListChecks,
  Trophy,
  Tag,
} from "lucide-react";
import { Typography } from "@/components/ui/Typography";
import deviconData from "devicon/devicon.json";

function getDeviconClass(skill: string): string | null {
  const normalized = skill.toLowerCase().replace(/[^a-z0-9]/g, "");
  const match = (deviconData as any[]).find(
    (icon) => icon.name === normalized || icon.altnames?.includes(normalized),
  );
  return match ? `devicon-${match.name}-plain colored` : null;
}

const DUMMY_TALENT = [
  {
    id: "1",
    name: "Alex Johnson",
    role: "Full Stack Developer",
    university: "Stanford University",
    location: "San Francisco, CA",
    status: "Available now",
    skills: ["React", "Node.js", "TypeScript", "PostgreSQL"],
    bio: "Passionate CS junior building scalable web applications. Previously interned at a YC startup. Looking for challenging backend or full-stack roles.",
    avatar: "AJ",
    matchScore: 94,
    rating: 4.8,
    tasksDone: 15,
    avgScore: 94,
  },
  {
    id: "2",
    name: "Sarah Chen",
    role: "Product Designer",
    university: "RISD",
    location: "New York, NY",
    status: "Available now",
    skills: ["Figma", "UI/UX", "Prototyping", "User Research"],
    bio: "Design student focusing on accessible and intuitive digital experiences. Strong background in user psychology and interaction design.",
    avatar: "SC",
    matchScore: 88,
    rating: 4.5,
    tasksDone: 12,
    avgScore: 91,
  },
  {
    id: "3",
    name: "Michael Torres",
    role: "Data Scientist",
    university: "MIT",
    location: "Remote",
    status: "Actively interviewing",
    skills: ["Python", "TensorFlow", "SQL", "Pandas"],
    bio: "Mathematics and Machine Learning double major. Built predictive models for campus energy usage. Looking for applied AI roles.",
    avatar: "MT",
    matchScore: 82,
    rating: 4.2,
    tasksDone: 8,
    avgScore: 87,
  },
  {
    id: "4",
    name: "Emily Wong",
    role: "Frontend Engineer",
    university: "UC Berkeley",
    location: "San Jose, CA",
    status: "Available now",
    skills: ["Vue.js", "CSS Animations", "JavaScript", "HTML5"],
    bio: "Creative coder with an eye for detail. I love bringing static designs to life with fluid animations. Open to frontend and creative development roles.",
    avatar: "EW",
    matchScore: 79,
    rating: 4.6,
    tasksDone: 10,
    avgScore: 92,
  },
  {
    id: "5",
    name: "David Kim",
    role: "Backend Engineer",
    university: "University of Washington",
    location: "Seattle, WA",
    status: "Available now",
    skills: ["Go", "Docker", "Kubernetes", "AWS"],
    bio: "Systems enthusiast. Optimizing databases and designing microservices architectures. Looking for backend or infrastructure roles.",
    avatar: "DK",
    matchScore: 91,
    rating: 4.9,
    tasksDone: 20,
    avgScore: 96,
  },
];

const SKILL_CATEGORIES = Array.from(
  new Set(DUMMY_TALENT.flatMap((t) => t.skills)),
).sort();

const STATUS_FILTERS = [
  "Available now",
  "Actively interviewing",
  "Not looking",
];

export default function TalentSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [skillSearchQuery, setSkillSearchQuery] = useState("");

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  const filteredTalent = DUMMY_TALENT.filter((talent) => {
    const matchesSearch =
      talent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      talent.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      talent.skills.some((s) =>
        s.toLowerCase().includes(searchQuery.toLowerCase()),
      );

    const matchesSkills =
      selectedSkills.length === 0 ||
      selectedSkills.some((skill) => talent.skills.includes(skill));

    const matchesStatus =
      selectedStatuses.length === 0 || selectedStatuses.includes(talent.status);

    return matchesSearch && matchesSkills && matchesStatus;
  });

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full animate-in fade-in duration-500">
      {/* Sidebar Filters */}
      <aside className="w-full md:w-64 flex-shrink-0 space-y-6">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-foreground">
            <Filter className="size-4" />
            <Typography
              variant="h4"
              className="text-base font-semibold m-0 border-none pb-0"
            >
              Filters
            </Typography>
          </div>

          <div className="space-y-4">
            {/* Status Filter */}
            <div>
              <Typography
                variant="span"
                className="font-semibold mb-2 block text-muted-foreground uppercase tracking-wider text-xs"
              >
                Availability
              </Typography>
              <div className="space-y-2">
                {STATUS_FILTERS.map((status) => (
                  <label
                    key={status}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <div
                      className={`size-4 rounded border flex items-center justify-center transition-colors ${selectedStatuses.includes(status) ? "bg-primary border-primary text-primary-foreground" : "border-input group-hover:border-primary/50"}`}
                    >
                      {selectedStatuses.includes(status) && (
                        <CheckCircle2 className="size-3" />
                      )}
                    </div>
                    <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">
                      {status}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="h-px bg-border/50 my-4" />

            {/* Skills Filter */}
            <div className="flex flex-col h-full">
              <Typography
                variant="span"
                className="font-semibold mb-2 block text-muted-foreground uppercase tracking-wider text-xs"
              >
                Core Skills
              </Typography>
              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Find a skill..."
                  value={skillSearchQuery}
                  onChange={(e) => setSkillSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
              <div className="flex flex-wrap gap-2 max-h-[280px] overflow-y-auto pr-1 pb-2">
                {SKILL_CATEGORIES.filter((skill) =>
                  skill.toLowerCase().includes(skillSearchQuery.toLowerCase()),
                ).length === 0 ? (
                  <div className="text-xs text-muted-foreground py-2 text-center w-full">
                    No skills found
                  </div>
                ) : (
                  SKILL_CATEGORIES.filter((skill) =>
                    skill
                      .toLowerCase()
                      .includes(skillSearchQuery.toLowerCase()),
                  ).map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-2.5 py-1 text-xs rounded-full border transition-all duration-200 ${
                        selectedSkills.includes(skill)
                          ? "bg-primary/10 border-primary/30 text-primary font-medium dark:bg-primary/20"
                          : "bg-transparent border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                      }`}
                    >
                      {skill}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Search Bar */}
        <div className="relative mb-6 group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="size-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm text-foreground placeholder-muted-foreground"
            placeholder="Search by role, name, or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Results Info */}
        <div className="mb-4 flex items-center justify-between">
          <Typography variant="p" className="text-sm text-muted-foreground m-0">
            Showing{" "}
            <strong className="text-foreground">{filteredTalent.length}</strong>{" "}
            top candidates
          </Typography>
        </div>

        {/* Talent Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredTalent.length === 0 ? (
            <div className="col-span-full py-20 text-center border border-dashed border-border rounded-xl bg-card/50">
              <Search className="size-10 text-muted-foreground/50 mx-auto mb-3" />
              <Typography
                variant="h3"
                className="text-lg font-medium text-foreground"
              >
                No matches found
              </Typography>
              <Typography
                variant="p"
                className="text-muted-foreground text-sm mt-1"
              >
                Try adjusting your filters or search query to find more talent.
              </Typography>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedSkills([]);
                  setSelectedStatuses([]);
                }}
                className="mt-4 px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            filteredTalent.map((talent) => (
              <div
                key={talent.id}
                className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 hover:shadow-md transition-all duration-300 group flex flex-col"
              >
                {/* Card Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4">
                    <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20 flex-shrink-0">
                      {talent.avatar}
                    </div>
                    <div>
                      <Typography
                        variant="h3"
                        className="text-base font-semibold m-0 border-none pb-0 group-hover:text-primary transition-colors"
                      >
                        {talent.name}
                      </Typography>
                      <Typography
                        variant="p"
                        className="text-sm text-muted-foreground font-medium m-0"
                      >
                        {talent.role}
                      </Typography>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-semibold">
                      {talent.matchScore}% Match
                    </span>
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <GraduationCap className="size-4" />
                    <Typography variant="span" color="muted" className="m-0">
                      {talent.university}
                    </Typography>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="size-4" />
                    <Typography variant="span" color="muted" className="m-0">
                      {talent.location}
                    </Typography>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Briefcase className="size-4" />
                    <Typography
                      variant="span"
                      color="muted"
                      className="flex items-center gap-1.5 m-0"
                    >
                      <span
                        className={`size-1.5 rounded-full ${talent.status.includes("now") ? "bg-green-500" : "bg-amber-500"}`}
                      />
                      {talent.status}
                    </Typography>
                  </div>
                </div>

                {/* Bio */}
                <Typography
                  variant="p"
                  className="text-sm text-foreground/80 line-clamp-2 m-0 mb-4"
                >
                  "{talent.bio}"
                </Typography>

                {/* Stats Row */}
                <div className="flex items-center gap-5 mb-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Star className="size-3.5 text-amber-500 fill-amber-500" />
                    <Typography
                      variant="span"
                      weight="semibold"
                      className="m-0"
                    >
                      {talent.rating}
                    </Typography>
                    <Typography variant="caption" color="muted" className="m-0">
                      Rating
                    </Typography>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ListChecks className="size-3.5 text-primary" />
                    <Typography
                      variant="span"
                      weight="semibold"
                      className="m-0"
                    >
                      {talent.tasksDone}
                    </Typography>
                    <Typography variant="caption" color="muted" className="m-0">
                      Tasks
                    </Typography>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Trophy className="size-3.5 text-emerald-500" />
                    <Typography
                      variant="span"
                      weight="semibold"
                      className="m-0"
                    >
                      {talent.avgScore}%
                    </Typography>
                    <Typography variant="caption" color="muted" className="m-0">
                      Avg Score
                    </Typography>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-auto pt-4 border-t border-border space-y-3">
                  {/* Skill Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {talent.skills.slice(0, 3).map((skill) => {
                      const iconClass = getDeviconClass(skill);
                      return (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-muted/60 text-xs font-medium text-foreground/80 dark:bg-muted/40"
                        >
                          {iconClass ? (
                            <i className={`${iconClass} text-sm`}></i>
                          ) : (
                            <Tag className="size-3 opacity-50" />
                          )}
                          {skill}
                        </span>
                      );
                    })}
                    {talent.skills.length > 3 && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-border bg-muted/60 text-xs font-medium text-muted-foreground dark:bg-muted/40">
                        +{talent.skills.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="flex-1 text-sm font-semibold bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-sm text-center"
                    >
                      View Profile
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                      >
                        <Github className="size-4" />
                      </button>
                      <button
                        type="button"
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                      >
                        <Linkedin className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

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
} from "lucide-react";
import { Typography } from "@/components/ui/Typography";
import deviconData from "devicon/devicon.json";

const ICON_MAPPINGS: Record<string, string> = {
  Vue: "vuejs",
  HTML: "html5",
  CSS: "css3",
  Express: "express",
  TensorFlow: "tensorFlow",
};

function getDeviconClass(skill: string): string | null {
  if (ICON_MAPPINGS[skill]) {
    return `devicon-${ICON_MAPPINGS[skill]}-plain colored`;
  }
  const normalized = skill.toLowerCase().replace(/[^a-z0-9]/g, "");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    <div className="flex flex-col xl:flex-row gap-8 h-full animate-in fade-in duration-500">
      {/* Sidebar Filters */}
      <aside className="w-full xl:w-72 shrink-0 space-y-6">
        <div className="bg-card border-4 border-black dark:border-white p-6 shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff]">
          <div className="flex items-center gap-3 mb-6">
            <Filter className="w-5 h-5 text-foreground" />
            <Typography
              variant="h4"
              className="text-lg font-black uppercase tracking-widest m-0 px-2 bg-[#AB47BC] text-white border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]"
            >
              Filters
            </Typography>
          </div>

          <div className="space-y-6">
            {/* Status Filter */}
            <div>
              <Typography
                variant="span"
                className="font-black mb-3 block text-foreground uppercase tracking-widest text-xs border-b-2 border-black dark:border-white pb-1"
              >
                Availability
              </Typography>
              <div className="space-y-3">
                {STATUS_FILTERS.map((status) => (
                  <label
                    key={status}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <div
                      className={`size-5 flex items-center justify-center transition-all ${
                        selectedStatuses.includes(status)
                          ? "bg-[#AB47BC] border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] text-white"
                          : "bg-white dark:bg-black border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:shadow-none"
                      }`}
                    >
                      {selectedStatuses.includes(status) && (
                        <CheckCircle2 className="size-3" strokeWidth={4} />
                      )}
                    </div>
                    <span className="text-sm font-bold uppercase tracking-wider text-foreground/80 group-hover:text-foreground transition-colors">
                      {status}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Skills Filter */}
            <div className="flex flex-col h-full">
              <Typography
                variant="span"
                className="font-black mb-3 block text-foreground uppercase tracking-widest text-xs border-b-2 border-black dark:border-white pb-1"
              >
                Core Skills
              </Typography>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-foreground" />
                <input
                  type="text"
                  placeholder="FIND A SKILL..."
                  value={skillSearchQuery}
                  onChange={(e) => setSkillSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-transparent border-2 border-black dark:border-white text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-0 focus:-translate-y-0.5 focus:-translate-x-0.5 focus:shadow-[4px_4px_0_0_#000] dark:focus:shadow-[4px_4px_0_0_#fff] transition-all shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]"
                />
              </div>
              <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto pr-1 pb-2">
                {SKILL_CATEGORIES.filter((skill) =>
                  skill.toLowerCase().includes(skillSearchQuery.toLowerCase()),
                ).length === 0 ? (
                  <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground py-4 text-center w-full border-2 border-dashed border-black dark:border-white">
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
                      className={`px-3 py-1 text-[11px] font-black uppercase tracking-wider border-2 border-black dark:border-white transition-all duration-200 shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] focus:outline-none ${
                        selectedSkills.includes(skill)
                          ? "bg-[#AB47BC] text-white hover:bg-[#8E24AA] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-none"
                          : "bg-surface text-foreground hover:bg-[#AB47BC] hover:text-white hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-none"
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
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="size-6 text-foreground" />
          </div>
          <input
            type="text"
            className="w-full pl-14 pr-4 py-4 bg-card border-4 border-black dark:border-white text-base md:text-lg font-black uppercase tracking-widest focus:outline-none focus:ring-0 focus:-translate-y-1 focus:-translate-x-1 focus:shadow-[8px_8px_0_0_#000] dark:focus:shadow-[8px_8px_0_0_#fff] transition-all shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] text-foreground placeholder-muted-foreground"
            placeholder="Search by role, name, or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Results Info */}
        <div className="mb-6 flex items-center justify-between">
          <Typography
            variant="p"
            className="text-sm font-black uppercase tracking-widest text-muted-foreground m-0"
          >
            Showing{" "}
            <strong className="text-foreground">{filteredTalent.length}</strong>{" "}
            candidates
          </Typography>
        </div>

        {/* Talent Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pb-10">
          {filteredTalent.length === 0 ? (
            <div className="col-span-full py-20 text-center border-4 border-dashed border-black dark:border-white bg-card">
              <Search className="size-12 text-muted-foreground mx-auto mb-4" />
              <Typography
                variant="h3"
                className="text-2xl font-black uppercase tracking-widest text-foreground mb-2"
              >
                No matches found
              </Typography>
              <Typography
                variant="p"
                className="text-foreground/80 font-bold text-sm max-w-md mx-auto"
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
                className="mt-6 px-6 py-3 bg-[#AB47BC] text-white border-2 border-black dark:border-white font-black uppercase tracking-widest shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_0_#000] dark:hover:shadow-[6px_6px_0_0_#fff] transition-all"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            filteredTalent.map((talent) => (
              <div
                key={talent.id}
                className="bg-card border-4 border-black dark:border-white p-6 shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff] hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[12px_12px_0_0_#000] dark:hover:shadow-[12px_12px_0_0_#fff] transition-all duration-200 flex flex-col group relative"
              >
                {/* Match Badge (Absolute Top Right) */}
                <div className="absolute -top-4 -right-4 bg-[#AB47BC] text-white border-4 border-black dark:border-white px-3 py-1 font-black text-xs uppercase tracking-widest shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] z-10 rotate-3 group-hover:rotate-6 transition-transform">
                  {talent.matchScore}% Match
                </div>

                {/* Card Header & Avatar */}
                <div className="flex gap-4 items-start mb-5">
                  <div className="size-14 bg-[#AB47BC] text-white border-4 border-black dark:border-white flex items-center justify-center font-black text-xl uppercase shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] shrink-0">
                    {talent.avatar}
                  </div>
                  <div className="pt-1">
                    <Typography
                      variant="h3"
                      className="text-xl font-black uppercase tracking-widest m-0 border-none pb-1 group-hover:text-[#AB47BC] transition-colors leading-none"
                    >
                      {talent.name}
                    </Typography>
                    <Typography
                      variant="p"
                      className="text-sm font-bold text-foreground/80 m-0 uppercase tracking-widest leading-none mt-1"
                    >
                      {talent.role}
                    </Typography>
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-3 mb-5">
                  <div className="flex items-center gap-3 text-sm font-bold text-foreground/80">
                    <GraduationCap className="size-5 text-[#AB47BC]" />
                    <span className="uppercase tracking-wider">
                      {talent.university}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold text-foreground/80">
                    <MapPin className="size-5 text-[#AB47BC]" />
                    <span className="uppercase tracking-wider">
                      {talent.location}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold text-foreground/80">
                    <Briefcase className="size-5 text-[#AB47BC]" />
                    <span className="flex items-center gap-2 uppercase tracking-wider">
                      <span
                        className={`size-2.5 border-2 border-black dark:border-white ${
                          talent.status.includes("now")
                            ? "bg-green-500"
                            : "bg-amber-500"
                        }`}
                      />
                      {talent.status}
                    </span>
                  </div>
                </div>

                {/* Bio */}
                <Typography
                  variant="p"
                  className="text-sm font-bold text-foreground italic border-l-4 border-[#AB47BC] pl-4 py-2 bg-[#AB47BC]/5 dark:bg-[#AB47BC]/10 m-0 mb-5 line-clamp-2"
                >
                  &quot;{talent.bio}&quot;
                </Typography>

                {/* Stats Row */}
                <div className="flex items-center justify-between border-y-4 border-black dark:border-white py-3 mb-5 text-sm font-black uppercase tracking-widest">
                  <div className="flex flex-col items-center">
                    <span className="flex items-center gap-1 text-xl text-black dark:text-white">
                      <Star className="size-5 fill-amber-500" />
                      {talent.rating}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Rating
                    </span>
                  </div>
                  <div className="w-1 h-8 bg-black dark:bg-white opacity-20"></div>
                  <div className="flex flex-col items-center">
                    <span className="flex items-center gap-1 text-xl text-primary">
                      {talent.tasksDone}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Tasks
                    </span>
                  </div>
                  <div className="w-1 h-8 bg-black dark:bg-white opacity-20"></div>
                  <div className="flex flex-col items-center">
                    <span className="flex items-center gap-1 text-xl text-green-600 dark:text-green-500">
                      {talent.avgScore}%
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Score
                    </span>
                  </div>
                </div>

                {/* Footer Component */}
                <div className="mt-auto flex flex-col gap-5">
                  {/* Skill Tags */}
                  <div className="flex flex-wrap gap-2">
                    {talent.skills.slice(0, 4).map((skill) => {
                      const iconClass = getDeviconClass(skill);
                      return (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1.5 px-2 py-1 border-2 border-black dark:border-white bg-[#3B82F6] text-white text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]"
                        >
                          {iconClass && (
                            <i className={`${iconClass} text-xs`}></i>
                          )}
                          {skill}
                        </span>
                      );
                    })}
                    {talent.skills.length > 4 && (
                      <span className="inline-flex items-center px-2 py-1 border-2 border-dashed border-black dark:border-white bg-surface text-foreground text-[10px] font-black uppercase tracking-widest">
                        +{talent.skills.length - 4}
                      </span>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="flex-1 py-3 bg-[#AB47BC] hover:bg-[#8E24AA] text-white border-4 border-black dark:border-white font-black uppercase tracking-widest shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_0_#000] dark:hover:shadow-[6px_6px_0_0_#fff] transition-all text-sm"
                    >
                      View Profile
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="p-3 border-4 border-black dark:border-white bg-[#333] hover:bg-[#111] text-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_0_#000] dark:hover:shadow-[6px_6px_0_0_#fff] transition-all"
                        aria-label="GitHub Profile"
                      >
                        <Github className="size-5" />
                      </button>
                      <button
                        type="button"
                        className="p-3 border-4 border-black dark:border-white bg-[#0A66C2] hover:bg-[#004182] text-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_0_#000] dark:hover:shadow-[6px_6px_0_0_#fff] transition-all"
                        aria-label="LinkedIn Profile"
                      >
                        <Linkedin className="size-5" />
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

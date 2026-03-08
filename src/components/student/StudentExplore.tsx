"use client";

import { useState } from "react";
import { Search, Filter, Clock, ChevronDown, Zap } from "lucide-react";
import { Typography } from "@/components/ui/Typography";
import { motion, Variants } from "framer-motion";

const MOCK_MARKETPLACE_TASKS = [
  {
    id: "t1",
    title: "Full Stack Next.js & Supabase MVP",
    company: "BuildFast Inc",
    duration: "4 weeks",
    xpReward: "1200",
    tags: ["Next.js", "Supabase", "Tailwind"],
    description: "Looking for an ambitious student to help build the V1 of our analytics dashboard. You will own the full stack implementation from wireframes.",
    skillLevel: "Advanced",
    postedAt: "2 hours ago"
  },
  {
    id: "t2",
    title: "Figma UI/UX Restyle",
    company: "DesignStudio",
    duration: "1 week",
    xpReward: "300",
    tags: ["Figma", "UI/UX", "Prototyping"],
    description: "We need a fresh set of eyes on our mobile app wireframes. Redesign 5 core screens following our new brand guidelines.",
    skillLevel: "Intermediate",
    postedAt: "5 hours ago"
  },
  {
    id: "t3",
    title: "Python Data Scraping Script",
    company: "DataMetrics",
    duration: "3 days",
    xpReward: "150",
    tags: ["Python", "BeautifulSoup", "Data"],
    description: "Write a reliable web scraper to collect public real estate market data and output it to a clean CSV format daily.",
    skillLevel: "Beginner",
    postedAt: "1 day ago"
  },
  {
    id: "t4",
    title: "React Native Payment Integration",
    company: "FinApp",
    duration: "2 weeks",
    xpReward: "800",
    tags: ["React Native", "Stripe", "iOS/Android"],
    description: "Integrate Stripe payment sheets into our existing React Native application. Must handle 3D secure authentication.",
    skillLevel: "Advanced",
    postedAt: "2 days ago"
  },
  {
    id: "t5",
    title: "Technical Documentation Writer",
    company: "OpenSourceLabs",
    duration: "1 week",
    xpReward: "200",
    tags: ["Markdown", "API Design", "Writing"],
    description: "Review our Node.js API and write comprehensive API documentation using Swagger/OpenAPI spec.",
    skillLevel: "Beginner",
    postedAt: "3 days ago"
  }
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export default function StudentExplore() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const filters = ["All", "Development", "Design", "Data", "Writing"];

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="min-h-[calc(100vh-4rem)] bg-zinc-50 dark:bg-zinc-950/50"
    >
      
      {/* Search Header */}
      <motion.div variants={itemVariants} className="max-w-6xl mx-auto px-6 md:px-12 pt-6">
        <div className="stu-hero flex-col lg:flex-row w-full items-start lg:items-center gap-6 lg:gap-12">
          <Typography variant="h1" className="tracking-tight leading-none shrink-0 text-3xl md:text-5xl">
            Find Your Next <br />
            <span className="stu-hero__accent">Opportunity.</span>
          </Typography>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full flex-1 max-w-4xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search by keywords, skills, or company..." 
                className="w-full h-14 pl-12 pr-4 bg-card border border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:outline-none focus:border-blue-500 transition-colors shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="h-14 px-8 bg-foreground text-background font-bold uppercase tracking-widest text-sm rounded-xl hover:bg-blue-600 hover:text-white transition-colors shrink-0 shadow-sm">
              Search
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Content Layout */}
      <div className="max-w-6xl mx-auto p-6 md:px-12 md:py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Filters */}
        <motion.div variants={itemVariants} className="lg:col-span-1 space-y-8">
          <div>
            <Typography variant="label" className="uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filters
            </Typography>
            <div className="space-y-2 mt-4">
              {filters.map(f => (
                <button 
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors rounded-lg ${
                    activeFilter === f 
                      ? "bg-emerald-50 text-emerald-900 border border-emerald-200 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400" 
                      : "border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-border/50">
            <Typography variant="label" className="uppercase tracking-widest text-muted-foreground mb-4 block">
              Skill Level
            </Typography>
            <div className="space-y-3 mt-4">
              {["Beginner", "Intermediate", "Advanced"].map(level => (
                <label key={level} className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-5 h-5 border-2 border-muted-foreground rounded group-hover:border-emerald-500 transition-colors flex items-center justify-center">
                    {/* Fake Checkbox styling */}
                  </div>
                  <span className="text-sm group-hover:text-foreground transition-colors">{level}</span>
                </label>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Task Feed */}
        <div className="lg:col-span-3 space-y-6">
          <motion.div variants={itemVariants} className="flex items-center justify-between mb-2">
            <Typography variant="span" color="muted">
              Showing {MOCK_MARKETPLACE_TASKS.length} tasks
            </Typography>
            <button className="text-sm font-bold flex items-center gap-1 hover:text-emerald-500 transition-colors">
              Sort by: Newest <ChevronDown className="w-4 h-4" />
            </button>
          </motion.div>

          <div className="grid grid-cols-1 gap-4">
            {MOCK_MARKETPLACE_TASKS.map(task => (
              <motion.div 
                variants={itemVariants}
                key={task.id} 
                className="group bg-card border border-border rounded-xl p-6 hover:border-blue-500/50 transition-all cursor-pointer shadow-sm hover:shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${
                        task.skillLevel === "Advanced" ? "bg-red-600/10 text-red-700 dark:bg-red-500/20 dark:text-red-500" :
                        task.skillLevel === "Intermediate" ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" :
                        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      }`}>
                        {task.skillLevel}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">
                        Posted {task.postedAt}
                      </span>
                    </div>
                    <Typography variant="h3" className="group-hover:text-blue-500 transition-colors">
                      {task.title}
                    </Typography>
                    <Typography variant="span" className="font-medium mt-1 inline-block">
                      {task.company}
                    </Typography>
                  </div>
                  
                  <div className="flex flex-row sm:flex-col items-center sm:items-end gap-4 sm:gap-2 shrink-0">
                    <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold text-lg">
                      <Zap className="w-5 h-5 fill-amber-600/20" />
                      {task.xpReward} XP
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground font-medium">
                      <Clock className="w-4 h-4" />
                      {task.duration}
                    </div>
                  </div>
                </div>

                <Typography variant="p" color="muted" className="mb-6 line-clamp-2">
                  {task.description}
                </Typography>

                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/50 pt-4">
                  <div className="flex flex-wrap gap-2">
                    {task.tags.map(tag => (
                      <span key={tag} className="text-xs font-semibold px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button className="px-6 py-2 bg-foreground text-background rounded-lg font-bold text-sm uppercase tracking-wider hover:bg-emerald-500 hover:text-black transition-colors">
                    View & Apply
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </motion.div>
  );
}

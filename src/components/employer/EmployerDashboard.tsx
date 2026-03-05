"use client";

import { useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useClerk } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import {
  Plus,
  Bell,
  GraduationCap,
  LayoutDashboard,
  FileEdit,
  Search,
  MessageSquare,
  Menu,
  X,
  LogOut,
  User,
  Settings,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { api } from "../../../convex/_generated/api";
import ThemeToggle from "@/components/ThemeToggle";

import StatsCards, { type DashboardStats } from "./StatsCards";
import TaskManagement, { type Task, type TaskStatus } from "./TaskManagement";
import AnalyticsPanel from "./AnalyticsPanel";
import PostTaskModal from "./PostTaskModal";

import "./employer-dashboard.css";

/* ── Mock data ── */

const MOCK_TASKS: Task[] = [
  {
    id: "1",
    title: "Build a Responsive Landing Page",
    category: "Web Development",
    skillLevel: "Intermediate",
    status: "pending",
    applications: 23,
    daysLeft: 5,
  },
  {
    id: "2",
    title: "Social Media Marketing Strategy",
    category: "Marketing",
    skillLevel: "Beginner",
    status: "pending",
    applications: 15,
    daysLeft: 7,
  },
  {
    id: "3",
    title: "Mobile App Prototype",
    category: "Mobile Development",
    skillLevel: "Advanced",
    status: "in_progress",
    applications: 8,
    daysLeft: 12,
  },
  {
    id: "4",
    title: "Content Writing Campaign",
    category: "Content Writing",
    skillLevel: "Beginner",
    status: "completed",
    applications: 12,
    avgScore: 89,
    completedDate: "Nov 15, 2025",
  },
  {
    id: "5",
    title: "E-commerce Platform Development",
    category: "Web Development",
    skillLevel: "Advanced",
    status: "completed",
    applications: 6,
    avgScore: 92,
    completedDate: "Nov 10, 2025",
  },
];

const INITIAL_STATS: DashboardStats = {
  activeTasks: 8,
  totalSubmissions: 124,
  completedTasks: 45,
  avgQualityScore: 87,
};

/* ── Nav Links ── */

const NAV_LINKS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "post-task", label: "Post Task", icon: FileEdit },
  { id: "talent-search", label: "Talent Search", icon: Search },
  { id: "messages", label: "Messages", icon: MessageSquare },
];

/* ── Top Navbar ── */

function EmployerNavbar({
  activeNav,
  onNavigate,
  onPostTask,
}: {
  activeNav: string;
  onNavigate: (id: string) => void;
  onPostTask: () => void;
}) {
  const { signOut } = useClerk();
  const { user } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = (user?.firstName?.charAt(0) ?? "E").toUpperCase();

  return (
    <nav className="emp-navbar">
      <div className="emp-navbar__left">
        {/* Brand */}
        <div className="emp-navbar__brand">
          <div className="emp-navbar__brand-icon">
            <GraduationCap className="size-[1.125rem]" />
          </div>
          <span className="emp-navbar__brand-text">Internify</span>
        </div>
      </div>

      {/* Desktop nav links - centered via grid */}
      <div className="emp-navbar__nav">
        {NAV_LINKS.map((link) => (
          <button
            key={link.id}
            type="button"
            className={`emp-navbar__link${
              activeNav === link.id ? " emp-navbar__link--active" : ""
            }`}
            onClick={() => {
              if (link.id === "post-task") {
                onPostTask();
              } else {
                onNavigate(link.id);
              }
            }}
          >
            {link.label}
          </button>
        ))}
      </div>

      <div className="emp-navbar__right">
        <ThemeToggle />

        <button
          type="button"
          className="emp-navbar__icon-btn"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
          <span className="emp-navbar__notif-dot" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div
              className="emp-navbar__avatar cursor-pointer"
              title={user?.fullName ?? "Profile"}
            >
              {initials}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 size-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 size-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut()}
              className="cursor-pointer text-red-600 focus:text-red-600"
            >
              <LogOut className="mr-2 size-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="emp-navbar__icon-btn emp-mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "var(--card)",
            borderBottom: "1px solid var(--border)",
            padding: "0.5rem 1rem 1rem",
            zIndex: 50,
          }}
        >
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              className={`emp-navbar__link${
                activeNav === link.id ? " emp-navbar__link--active" : ""
              }`}
              style={{ display: "block", width: "100%", textAlign: "left" }}
              onClick={() => {
                if (link.id === "post-task") {
                  onPostTask();
                } else {
                  onNavigate(link.id);
                }
                setMobileOpen(false);
              }}
            >
              {link.label}
            </button>
          ))}
          <button
            type="button"
            className="emp-navbar__link"
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              color: "hsl(0 72% 51%)",
              marginTop: "0.5rem",
            }}
            onClick={() => signOut()}
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}

/* ── Main Dashboard ── */

export default function EmployerDashboard() {
  const { user } = useUser();
  const currentUser = useQuery(api.users.currentUser);

  const [activeNav, setActiveNav] = useState("dashboard");
  const [modalOpen, setModalOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [stats, setStats] = useState<DashboardStats>(INITIAL_STATS);

  const firstName = currentUser?.user?.firstName || user?.firstName || "there";

  const handleNavigate = useCallback((id: string) => {
    setActiveNav(id);
  }, []);

  const handlePostTask = useCallback(
    (newTask: Omit<Task, "id" | "applications" | "daysLeft">) => {
      const task: Task = {
        ...newTask,
        id: crypto.randomUUID(),
        applications: 0,
        daysLeft: 14,
      };
      setTasks((prev) => [task, ...prev]);
      setStats((prev) => ({
        ...prev,
        activeTasks: prev.activeTasks + 1,
      }));
    },
    [],
  );

  // Get time-aware greeting
  const hour = new Date().getHours();
  const timeGreeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="emp-dashboard">
      <EmployerNavbar
        activeNav={activeNav}
        onNavigate={handleNavigate}
        onPostTask={() => setModalOpen(true)}
      />

      <main className="emp-main">
        {activeNav === "talent-search" && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-6">
              <Search className="size-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-2xl font-semibold mb-3">Talent Search</h2>
            <p className="text-muted-foreground max-w-md">
              Browse top verified students, filter by skills, and invite them
              directly to your tasks. (Coming soon)
            </p>
          </div>
        )}

        {activeNav === "messages" && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6">
              <MessageSquare className="size-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-semibold mb-3">Messages & Inbox</h2>
            <p className="text-muted-foreground max-w-md">
              Communicate with task applicants, share files, and negotiate terms
              all in one place. (Coming soon)
            </p>
          </div>
        )}

        {activeNav === "dashboard" && (
          <>
            {/* Hero header with personality */}
            <div className="emp-hero">
              <div className="emp-hero__text">
                <h1>
                  {timeGreeting},{" "}
                  <span className="emp-hero__accent">{firstName}</span> 👋
                </h1>
                <p>
                  Your tasks have received{" "}
                  <strong>{stats.totalSubmissions} submissions</strong> this
                  month. {stats.activeTasks} tasks are actively seeking talented
                  students.
                </p>
              </div>
              <button
                type="button"
                className="emp-post-btn"
                onClick={() => setModalOpen(true)}
              >
                <Plus className="size-4" />
                Post New Task
              </button>
            </div>

            {/* Stats Row */}
            <StatsCards stats={stats} />

            {/* Body: Task Management + Analytics */}
            <div className="emp-body">
              <TaskManagement tasks={tasks} />
              <AnalyticsPanel />
            </div>
          </>
        )}
      </main>

      {/* Post‑task modal */}
      <PostTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handlePostTask}
      />
    </div>
  );
}

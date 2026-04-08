"use client";

import { useState, useCallback, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useClerk } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
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
import { Id } from "../../../convex/_generated/dataModel";
import ThemeToggle from "@/components/ThemeToggle";

import StatsCards, { type DashboardStats } from "./StatsCards";
import TaskManagement, { type Task, type TaskStatus } from "./TaskManagement";
import { Typography } from "@/components/ui/Typography";
import AnalyticsPanel from "./AnalyticsPanel";
import TopStudentsShowcase from "./TopStudentsShowcase";
import PostTaskModal, { type PostTaskData } from "./PostTaskModal";
import TaskDetailModal from "./TaskDetailModal";
import TalentSearch from "./talent-search/TalentSearch";
import Messages from "@/components/shared/Messages";
import Notifications from "@/components/shared/Notifications";
import EmployerProfile from "./EmployerProfile";
import SettingsPage from "@/components/shared/Settings";
import Footer from "@/components/landing/Footer";
import { useConvexTokenReady } from "@/lib/convexAuth";

import "./employer-dashboard.css";

/* ── Nav Links ── */

/* ── Top Navbar ── */

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
  const isConvexTokenReady = useConvexTokenReady();
  const unreadCount =
    useQuery(
      api.notifications.getUnreadCount,
      isConvexTokenReady ? {} : "skip",
    ) ?? 0;
  const handleSignOut = useCallback(async () => {
    await signOut({ redirectUrl: "/login?role=employer" });
  }, [signOut]);

  const initials = (user?.firstName?.charAt(0) ?? "E").toUpperCase();

  return (
    <nav className="emp-navbar">
      <div className="emp-navbar__left">
        {/* Brand */}
        <div className="emp-navbar__brand">
          <div className="emp-navbar__brand-icon">
            <GraduationCap className="size-4.5 text-white" />
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
        {/* Hidden on mobile, shown on md screens */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />

          <button
            type="button"
            className="emp-navbar__icon-btn"
            aria-label="Notifications"
            onClick={() => onNavigate("notifications")}
          >
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  minWidth: "1.125rem",
                  height: "1.125rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.625rem",
                  fontWeight: 900,
                  background: "#ef4444",
                  color: "#fff",
                  border: "2px solid var(--foreground)",
                  padding: "0 3px",
                }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="emp-navbar__avatar cursor-pointer"
              title={user?.fullName ?? "Profile"}
            >
              {initials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => onNavigate("profile")}
            >
              <User className="mr-2 size-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => onNavigate("settings")}
            >
              <Settings className="mr-2 size-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => void handleSignOut()}
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
            padding: "1rem",
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {/* Mobile Actions: Theme & Notifications */}
          <div className="flex items-center justify-between mb-2 pb-3 border-b border-border md:hidden">
            <span className="text-sm font-medium text-muted-foreground">
              Appearance
            </span>
            <ThemeToggle />
          </div>

          <div className="flex items-center justify-between mb-2 pb-3 border-b border-border md:hidden">
            <span className="text-sm font-medium text-muted-foreground">
              Notifications
            </span>
            <button
              type="button"
              className="emp-navbar__icon-btn"
              aria-label="Notifications"
              onClick={() => {
                onNavigate("notifications");
                setMobileOpen(false);
              }}
            >
              <Bell className="size-4" />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    minWidth: "1.125rem",
                    height: "1.125rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.625rem",
                    fontWeight: 900,
                    background: "#ef4444",
                    color: "#fff",
                    border: "2px solid var(--foreground)",
                    padding: "0 3px",
                  }}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          </div>

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
            onClick={() => void handleSignOut()}
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
  const isConvexTokenReady = useConvexTokenReady();
  const currentUser = useQuery(
    api.users.currentUser,
    isConvexTokenReady ? {} : "skip",
  );

  const employerTasks = useQuery(
    api.tasks.getEmployerTasks,
    isConvexTokenReady ? {} : "skip",
  );
  const employerStats = useQuery(
    api.tasks.getEmployerStats,
    isConvexTokenReady ? {} : "skip",
  );
  const createTask = useMutation(api.tasks.createTask);
  const deleteTask = useMutation(api.tasks.deleteTask);
  const updateTask = useMutation(api.tasks.updateTask);

  const [activeNav, setActiveNav] = useState("dashboard");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [now] = useState(() => Date.now());

  const tasks: Task[] = useMemo(
    () =>
      employerTasks?.map((t) => ({
        id: t._id,
        title: t.title,
        category: t.category,
        skillLevel:
          t.skillLevel.charAt(0).toUpperCase() + t.skillLevel.slice(1),
        status: t.status as TaskStatus,
        applications: t.applicantCount || 0,
        maxApplicants: t.maxApplicants,
        daysLeft: Math.max(
          0,
          Math.ceil((t.deadline - now) / (1000 * 60 * 60 * 24)),
        ),
        deadline: t.deadline,
        createdAt: t.createdAt,
        description: t.description,
        skills: t.skills,
        imageStorageIds: t.imageStorageIds,
        imageUrls: t.imageUrls,
        resolvedAttachments: t.resolvedAttachments,
        acceptedBy: t.acceptedBy,
      })) || [],
    [employerTasks, now],
  );

  const stats: DashboardStats = employerStats || {
    activeTasks: 0,
    totalSubmissions: 0,
    completedTasks: 0,
    avgQualityScore: 0,
  };

  const firstName = currentUser?.user?.firstName || user?.firstName || "there";

  const handleNavigate = useCallback(
    (id: string) => {
      if (id.startsWith("task:")) {
        const taskId = id.slice("task:".length);
        const targetTask = tasks.find((t) => t.id === taskId);
        setActiveNav("dashboard");
        if (targetTask) {
          setSelectedTask(targetTask);
        }
        return;
      }
      setActiveNav(id);
    },
    [tasks],
  );

  const handleViewTask = useCallback((task: Task) => {
    setSelectedTask(task);
  }, []);

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      try {
        await deleteTask({ taskId: taskId as Id<"tasks"> });
      } catch (error) {
        console.error("Failed to delete task:", error);
      }
    },
    [deleteTask],
  );

  const handlePostTask = useCallback(
    async (taskData: PostTaskData) => {
      try {
        if (editingTask) {
          await updateTask({
            taskId: editingTask.id as Id<"tasks">,
            title: taskData.title,
            category: taskData.category,
            skillLevel: taskData.skillLevel,
            description: taskData.description,
            skills: taskData.skills,
            deadline: taskData.deadline,
            maxApplicants: taskData.maxApplicants,
            imageStorageIds: taskData.imageStorageIds as
              | Id<"_storage">[]
              | undefined,
            attachments: taskData.attachments as
              | {
                  storageId: Id<"_storage">;
                  name: string;
                  type: string;
                }[]
              | undefined,
          });
          setEditingTask(null);
        } else {
          await createTask({
            title: taskData.title,
            category: taskData.category,
            skillLevel: taskData.skillLevel,
            description: taskData.description,
            skills: taskData.skills,
            deadline: taskData.deadline,
            maxApplicants: taskData.maxApplicants,
            imageStorageIds: taskData.imageStorageIds as
              | Id<"_storage">[]
              | undefined,
            attachments: taskData.attachments as
              | {
                  storageId: Id<"_storage">;
                  name: string;
                  type: string;
                }[]
              | undefined,
          });
        }
        setModalOpen(false);
      } catch (error) {
        console.error("Failed to save task:", error);
      }
    },
    [createTask, updateTask, editingTask],
  );

  // Get time-aware greeting
  const hour = new Date().getHours();
  const timeGreeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  if (!isConvexTokenReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="emp-dashboard">
      <EmployerNavbar
        activeNav={activeNav}
        onNavigate={handleNavigate}
        onPostTask={() => setModalOpen(true)}
      />

      <main className="emp-main">
        {activeNav === "talent-search" && <TalentSearch />}
        {activeNav === "messages" && <Messages role="employer" />}
        {activeNav === "profile" && <EmployerProfile />}
        {activeNav === "settings" && <SettingsPage />}
        {activeNav === "notifications" && <Notifications role="employer" onNavigate={handleNavigate} />}

        {activeNav === "dashboard" && (
          <>
            {/* Hero header with personality */}
            <div className="emp-hero">
              <div className="emp-hero__text">
                <Typography variant="h1" className="text-white">
                  {timeGreeting},{" "}
                  <span className="emp-hero__accent">{firstName}</span>
                </Typography>
                <Typography
                  variant="p"
                  className="text-white opacity-90 text-sm md:text-base leading-relaxed mt-2"
                >
                  Your tasks have received{" "}
                  <span className="inline-flex items-center justify-center font-black text-black bg-white px-2 py-0.5 mx-0.5 border-2 border-black shadow-[2px_2px_0_0_#000] -rotate-2 text-xl md:text-2xl">
                    {stats.totalSubmissions} submissions
                  </span>{" "}
                  this month.{" "}
                  <span className="inline-flex items-center justify-center font-black text-black bg-[#FCD34D] px-2 py-0.5 mx-0.5 border-2 border-black shadow-[2px_2px_0_0_#000] rotate-2 text-xl md:text-2xl">
                    {stats.activeTasks}
                  </span>{" "}
                  tasks are still looking for talented students.
                </Typography>
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
            <StatsCards stats={stats} tasks={tasks} />

            {/* Body: Task Management + Analytics */}
            <div className="emp-body">
              <TaskManagement tasks={tasks} onViewTask={handleViewTask} />
              <AnalyticsPanel tasks={tasks} />
            </div>

            {/* Showcase */}
            <TopStudentsShowcase />
          </>
        )}
      </main>

      {/* Post-task modal */}
      <PostTaskModal
        open={modalOpen}
        initialData={editingTask}
        onClose={() => {
          setModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handlePostTask}
      />

      {/* Task Detail modal */}
      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onDelete={handleDeleteTask}
        onEdit={() => {
          setEditingTask(selectedTask);
          setSelectedTask(null);
          setModalOpen(true);
        }}
      />
      <Footer />
    </div>
  );
}

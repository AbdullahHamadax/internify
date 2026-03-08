"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import {
  Bell,
  GraduationCap,
  LayoutDashboard,
  Search,
  MessageSquare,
  Menu,
  X,
  User,
  Settings,
  LogOut,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ThemeToggle from "@/components/ThemeToggle";

// Sub-components to be implemented
import StudentOverview from "./StudentOverview";
import StudentExplore from "./StudentExplore";

import "./student-dashboard.css";

/* ── Nav Links ── */
const NAV_LINKS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "explore", label: "Explore Tasks", icon: Search },
  { id: "messages", label: "Messages", icon: MessageSquare },
];

/* ── Top Navbar ── */
function StudentNavbar({
  activeNav,
  onNavigate,
}: {
  activeNav: string;
  onNavigate: (id: string) => void;
}) {
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = (user?.firstName?.charAt(0) ?? "S").toUpperCase();

  return (
    <nav className="stu-navbar">
      <div className="stu-navbar__left">
        {/* Brand */}
        <div className="stu-navbar__brand">
          <div className="stu-navbar__brand-icon">
            <GraduationCap className="size-[1.125rem]" />
          </div>
          <span className="stu-navbar__brand-text">Internify</span>
        </div>
      </div>

      {/* Desktop nav links */}
      <div className="stu-navbar__nav">
        {NAV_LINKS.map((link) => (
          <button
            key={link.id}
            type="button"
            className={`stu-navbar__link${
              activeNav === link.id ? " stu-navbar__link--active" : ""
            }`}
            onClick={() => onNavigate(link.id)}
          >
            {link.label}
          </button>
        ))}
      </div>

      <div className="stu-navbar__right">
        {/* Hidden on mobile, shown on md screens */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />

          <button
            type="button"
            className="stu-navbar__icon-btn"
            aria-label="Notifications"
            // onClick={() => router.push("/student/notifications")}
          >
            <Bell className="size-4" />
            {/* <span className="stu-navbar__notif-dot" /> */}
          </button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div
              className="stu-navbar__avatar cursor-pointer"
              title={user?.fullName ?? "Profile"}
            >
              {initials}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2">
            <DropdownMenuLabel>Student Account</DropdownMenuLabel>
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
          className="stu-navbar__icon-btn stu-mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="stu-navbar__mobile-menu">
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
              className="stu-navbar__icon-btn"
              aria-label="Notifications"
            >
              <Bell className="size-4" />
            </button>
          </div>

          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              className={`stu-navbar__link${
                activeNav === link.id ? " stu-navbar__link--active" : ""
              }`}
              style={{ display: "block", width: "100%", textAlign: "left" }}
              onClick={() => {
                onNavigate(link.id);
                setMobileOpen(false);
              }}
            >
              {link.label}
            </button>
          ))}
          <button
            type="button"
            className="stu-navbar__link"
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

/* ── Main Dashboard Container ── */
export default function StudentDashboard() {
  const [activeNav, setActiveNav] = useState("dashboard");

  return (
    <div className="stu-dashboard">
      <StudentNavbar 
        activeNav={activeNav} 
        onNavigate={(id) => setActiveNav(id)} 
      />

      <main className="stu-main">
        {activeNav === "dashboard" && <StudentOverview onNavigate={(id) => setActiveNav(id)} />}
        {activeNav === "explore" && <StudentExplore />}
        {activeNav === "messages" && (
          <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground">
            Messages feature coming soon.
          </div>
        )}
      </main>
    </div>
  );
}

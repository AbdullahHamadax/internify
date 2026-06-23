"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
  House,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Messages from "@/components/shared/Messages";
import Notifications from "@/components/shared/Notifications";

import HomeButton from "@/components/shared/HomeButton";
import AccountAvatar from "@/components/shared/AccountAvatar";
import { api } from "../../../convex/_generated/api";

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
import StudentProfile from "./StudentProfile";
import SettingsPage from "@/components/shared/Settings";
import Footer from "@/components/landing/Footer";
import { useConvexTokenReady } from "@/lib/convexAuth";

import "./student-dashboard.css";

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
  const { signOut } = useClerk();
  const { user } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const isConvexTokenReady = useConvexTokenReady();
  const unreadCount =
    useQuery(
      api.notifications.getUnreadCount,
      isConvexTokenReady ? {} : "skip",
    ) ?? 0;
  const handleSignOut = useCallback(async () => {
    await signOut({ redirectUrl: "/login?role=student" });
  }, [signOut]);

  // Close the compact menu once the viewport grows back to the desktop layout,
  // otherwise the open menu's leftover items strand on-screen after resize.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1152px)");
    const handle = (e: MediaQueryListEvent) => {
      if (e.matches) setMobileOpen(false);
    };
    if (mq.matches) setMobileOpen(false);
    mq.addEventListener("change", handle);
    return () => mq.removeEventListener("change", handle);
  }, []);

  // Dismiss the compact menu on outside click or Escape.
  useEffect(() => {
    if (!mobileOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  return (
    <nav className="stu-navbar" ref={navRef}>
      <div className="stu-navbar__left">
        {/* Brand */}
        <div className="stu-navbar__brand" aria-hidden="true">
          <div className="stu-navbar__brand-icon">
            <GraduationCap className="size-4.5 text-white" />
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
        {/* Hidden on mobile, shown on wide screens (matches nav collapse at 1152px) */}
        <div className="hidden min-[1152px]:flex items-center gap-2">
          <HomeButton href="/" />
          <ThemeToggle />

          <button
            type="button"
            className="stu-navbar__icon-btn"
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
              className="inline-flex items-center justify-center border-0 bg-transparent p-0 align-middle leading-none"
              title={user?.fullName ?? "Profile"}
              aria-label="Open student account menu"
            >
              <AccountAvatar
                role="student"
                name={user?.firstName ?? user?.fullName}
                imageUrl={user?.hasImage ? user.imageUrl : null}
                interactive
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2">
            <DropdownMenuLabel>Student Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => onNavigate("dashboard")}
            >
              <House className="mr-2 size-4" />
              <span>Dashboard</span>
            </DropdownMenuItem>
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
          className="stu-navbar__icon-btn stu-mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="stu-mobile-menu"
        >
          {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="stu-navbar__mobile-menu" id="stu-mobile-menu">
          {/* Utility strip: Home + theme + notifications */}
          <div className="stu-menu-utility">
            <HomeButton href="/" className="flex-1 justify-center" />
            <ThemeToggle />
            <button
              type="button"
              className="stu-navbar__icon-btn"
              aria-label={
                unreadCount > 0
                  ? `Notifications, ${unreadCount} unread`
                  : "Notifications"
              }
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

          <div className="stu-menu-divider" />

          {/* Primary nav as brutalist blocks */}
          {NAV_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.id}
                type="button"
                className={`stu-menu-link${
                  activeNav === link.id ? " stu-menu-link--active" : ""
                }`}
                aria-current={activeNav === link.id ? "page" : undefined}
                onClick={() => {
                  onNavigate(link.id);
                  setMobileOpen(false);
                }}
              >
                <Icon className="stu-menu-link__icon" />
                {link.label}
              </button>
            );
          })}

          <button
            type="button"
            className="stu-menu-link stu-menu-link--danger"
            onClick={() => void handleSignOut()}
          >
            <LogOut className="stu-menu-link__icon" />
            Log Out
          </button>
        </div>
      )}
    </nav>
  );
}

/* ── Main Dashboard Container ── */
export default function StudentDashboard() {
  const isConvexTokenReady = useConvexTokenReady();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeTab = searchParams.get("tab");
  const initialConversationId = searchParams.get("conversationId");
  const normalizedRouteTab =
    routeTab &&
    ["dashboard", "explore", "profile", "settings", "messages", "notifications"].includes(
      routeTab,
    )
      ? routeTab
      : "dashboard";
  const [activeNav, setActiveNav] = useState(normalizedRouteTab);
  const [exploreFocusTaskId, setExploreFocusTaskId] = useState<string | null>(
    null,
  );

  const handleNavigate = useCallback((id: string) => {
    if (id.startsWith("explore-task:")) {
      setExploreFocusTaskId(id.slice("explore-task:".length));
      setActiveNav("explore");
      return;
    }
    setExploreFocusTaskId(null);
    setActiveNav(id);
  }, []);

  useEffect(() => {
    setActiveNav(normalizedRouteTab);
  }, [normalizedRouteTab]);

  useEffect(() => {
    const currentTab = searchParams.get("tab");
    const nextTab = activeNav === "dashboard" ? null : activeNav;

    if (currentTab === nextTab || (!currentTab && nextTab === null)) {
      return;
    }

    const nextUrl = nextTab ? `${pathname}?tab=${nextTab}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [activeNav, pathname, router, searchParams]);

  if (!isConvexTokenReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="stu-dashboard">
      <StudentNavbar activeNav={activeNav} onNavigate={handleNavigate} />

      <main className="stu-main">
        {activeNav === "dashboard" && (
          <StudentOverview onNavigate={handleNavigate} />
        )}
        {activeNav === "explore" && (
          <StudentExplore
            focusTaskId={exploreFocusTaskId}
            onFocusTaskConsumed={() => setExploreFocusTaskId(null)}
          />
        )}
        {activeNav === "profile" && <StudentProfile />}
        {activeNav === "settings" && <SettingsPage />}
        {activeNav === "messages" && (
          <Messages
            role="student"
            initialConversationId={initialConversationId}
          />
        )}
        {activeNav === "notifications" && (
          <Notifications role="student" onNavigate={handleNavigate} />
        )}
      </main>
      <Footer />
    </div>
  );
}

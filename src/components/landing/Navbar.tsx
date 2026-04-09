"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import ThemeToggle from "@/components/ThemeToggle";
import AccountAvatar from "@/components/shared/AccountAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Typography } from "@/components/ui/Typography";
import { api } from "../../../convex/_generated/api";

const navLinks = [
  { label: "How it Works", href: "/#how-it-works" },
  { label: "For Students", href: "/#for-students" },
  { label: "For Employers", href: "/#for-employers" },
  { label: "About", href: "/about" },
];

type NavbarProps = {
  authenticatedRole?: "student" | "employer";
};

function resolveRoleFromMetadata(
  value: unknown,
): "student" | "employer" | undefined {
  return value === "student" || value === "employer" ? value : undefined;
}

export default function Navbar({ authenticatedRole }: NavbarProps) {
  const { signOut } = useClerk();
  const { isLoaded, isSignedIn, user } = useUser();
  const currentUser = useQuery(api.users.currentUser);
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeHash, setActiveHash] = useState(() =>
    typeof window !== "undefined" ? window.location.hash : "",
  );

  const metadataRole =
    resolveRoleFromMetadata(user?.publicMetadata?.role) ??
    resolveRoleFromMetadata(user?.unsafeMetadata?.role);
  const accountRole =
    authenticatedRole ?? currentUser?.user.role ?? metadataRole ?? "student";
  const isAuthenticated = Boolean(isLoaded && isSignedIn);

  useEffect(() => {
    const onHashChange = () => setActiveHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);

    return () => {
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  const handleNavClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      if (!href.startsWith("/#")) {
        setMobileOpen(false);
        return;
      }

      const id = href.slice(2);
      if (pathname === "/") {
        e.preventDefault();
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          window.history.pushState(null, "", href);
          setActiveHash(href.slice(1));
        }
      }

      setMobileOpen(false);
    },
    [pathname],
  );

  const handleDashboardNavigation = useCallback(
    (tab?: "profile" | "settings") => {
      const target = tab ? `/dashboard?tab=${tab}` : "/dashboard";
      setMobileOpen(false);
      router.push(target);
    },
    [router],
  );

  const handleSignOut = useCallback(async () => {
    setMobileOpen(false);
    await signOut({ redirectUrl: "/" });
  }, [signOut]);

  return (
    <nav
      className="fixed left-0 right-0 top-0 z-50 border-b-4 border-black bg-white shadow-[0_4px_0_0_#000] transition-all duration-300 dark:border-white dark:bg-black dark:shadow-[0_4px_0_0_#fff]"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="rounded-none border-2 border-black bg-[#2563EB] p-1.5 shadow-[2px_2px_0_0_#000] dark:border-white">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <Typography
              variant="span"
              className="text-xl tracking-tight"
              weight="bold"
            >
              Internify
            </Typography>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`rounded-none border-2 border-transparent px-4 py-2 text-sm font-black uppercase tracking-widest transition-all hover:-translate-x-px hover:-translate-y-px hover:border-black hover:bg-[#AB47BC] hover:text-white hover:shadow-[2px_2px_0_0_#000] dark:hover:border-white dark:hover:shadow-[2px_2px_0_0_#fff] ${
                  pathname === link.href ||
                  (pathname === "/" &&
                    link.href.startsWith("/#") &&
                    activeHash === link.href.slice(1))
                    ? "border-black bg-[#2563EB] text-white shadow-[4px_4px_0_0_#000] -translate-x-[2px] -translate-y-[2px] dark:border-white dark:shadow-[4px_4px_0_0_#fff]"
                    : "text-black dark:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            {isAuthenticated ? (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center border-0 bg-transparent p-0 align-middle leading-none"
                    aria-label="Open account menu"
                    title={user?.fullName ?? "Account"}
                  >
                    <AccountAvatar
                      role={accountRole}
                      name={user?.firstName ?? user?.fullName}
                      imageUrl={user?.hasImage ? user.imageUrl : null}
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="mt-2 w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => handleDashboardNavigation()}
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => handleDashboardNavigation("profile")}
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => handleDashboardNavigation("settings")}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    onClick={() => void handleSignOut()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link
                  href="/login"
                  className="border-2 border-black bg-white px-5 py-2.5 text-sm font-black uppercase tracking-widest text-black shadow-[4px_4px_0_0_#000] transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none dark:border-white dark:bg-black dark:text-white dark:shadow-[4px_4px_0_0_#fff]"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="border-2 border-black bg-[#2563EB] px-5 py-2.5 text-sm font-black uppercase tracking-widest text-white shadow-[4px_4px_0_0_#000] transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none dark:border-white dark:shadow-[4px_4px_0_0_#fff]"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="rounded-none border-2 border-black bg-white p-2 text-black shadow-[2px_2px_0_0_#000] transition-all hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_0_#000] dark:border-white dark:bg-black dark:text-white dark:shadow-[2px_2px_0_0_#fff] dark:hover:shadow-[4px_4px_0_0_#fff]"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-b-4 border-black bg-white px-4 pb-6 shadow-[0_8px_0_0_#000] dark:border-white dark:bg-black dark:shadow-[0_8px_0_0_#fff] md:hidden">
          <div className="flex flex-col gap-3 pt-3">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`rounded-none border-2 border-black px-4 py-3 text-sm font-black uppercase tracking-widest transition-all shadow-[4px_4px_0_0_#000] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] dark:border-white dark:shadow-[4px_4px_0_0_#fff] dark:hover:shadow-[6px_6px_0_0_#fff] ${
                  pathname === link.href ||
                  (pathname === "/" &&
                    link.href.startsWith("/#") &&
                    activeHash === link.href.slice(1))
                    ? "bg-[#2563EB] text-white"
                    : "bg-white text-black hover:bg-[#AB47BC] hover:text-white dark:bg-black dark:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {isAuthenticated ? (
              <div className="mt-4 flex flex-col gap-3 border-t-4 border-black pt-4 dark:border-white">
                <div className="flex items-center gap-3 border-2 border-black bg-white p-3 shadow-[4px_4px_0_0_#000] dark:border-white dark:bg-black dark:shadow-[4px_4px_0_0_#fff]">
                  <AccountAvatar
                    role={accountRole}
                    name={user?.firstName ?? user?.fullName}
                    imageUrl={user?.hasImage ? user.imageUrl : null}
                  />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black uppercase tracking-widest text-black dark:text-white">
                      {user?.firstName ?? user?.fullName ?? "Account"}
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      {accountRole}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDashboardNavigation()}
                  className="border-2 border-black bg-[#2563EB] px-5 py-3 text-center text-sm font-black uppercase tracking-widest text-white shadow-[4px_4px_0_0_#000] transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none dark:border-white dark:shadow-[4px_4px_0_0_#fff]"
                >
                  Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => handleDashboardNavigation("profile")}
                  className="border-2 border-black bg-white px-5 py-3 text-center text-sm font-black uppercase tracking-widest text-black shadow-[4px_4px_0_0_#000] transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none dark:border-white dark:bg-black dark:text-white dark:shadow-[4px_4px_0_0_#fff]"
                >
                  Profile
                </button>
                <button
                  type="button"
                  onClick={() => handleDashboardNavigation("settings")}
                  className="border-2 border-black bg-white px-5 py-3 text-center text-sm font-black uppercase tracking-widest text-black shadow-[4px_4px_0_0_#000] transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none dark:border-white dark:bg-black dark:text-white dark:shadow-[4px_4px_0_0_#fff]"
                >
                  Settings
                </button>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="border-2 border-black bg-[#FF3366] px-5 py-3 text-center text-sm font-black uppercase tracking-widest text-white shadow-[4px_4px_0_0_#000] transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none dark:border-white dark:shadow-[4px_4px_0_0_#fff]"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="border-2 border-black bg-white px-5 py-3 text-center text-sm font-black uppercase tracking-widest text-black shadow-[4px_4px_0_0_#000] transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none dark:border-white dark:bg-black dark:text-white dark:shadow-[4px_4px_0_0_#fff]"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="border-2 border-black bg-[#2563EB] px-5 py-3 text-center text-sm font-black uppercase tracking-widest text-white shadow-[4px_4px_0_0_#000] transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none dark:border-white dark:shadow-[4px_4px_0_0_#fff]"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

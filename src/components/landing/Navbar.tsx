"use client";

import ThemeToggle from "@/components/ThemeToggle";
import { GraduationCap, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Typography } from "@/components/ui/Typography";

const navLinks = [
  { label: "How it Works", href: "/#how-it-works" },
  { label: "For Students", href: "/#for-students" },
  { label: "For Employers", href: "/#for-employers" },
  { label: "About", href: "/about" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNavClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      // Hash links like "/#how-it-works"
      if (href.startsWith("/#")) {
        const id = href.slice(2);
        // If already on the homepage, smooth-scroll to the section
        if (pathname === "/") {
          e.preventDefault();
          const el = document.getElementById(id);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
        // Otherwise let the browser navigate to /#section naturally
        setMobileOpen(false);
      }
    },
    [pathname],
  );

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 dark:bg-gray-950/95 backdrop-blur-md shadow-sm border-b border-gray-100 dark:border-gray-800"
          : "bg-white dark:bg-gray-950"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="bg-brand-gradient rounded-lg p-1.5">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <Typography
              variant="span"
              className="text-xl tracking-tight"
              weight="bold"
            >
              Internify
            </Typography>
          </Link>

          {/* Center links – desktop */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="rounded-md px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right actions – desktop */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="bg-brand-gradient rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
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

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 pb-4">
          <div className="flex flex-col gap-2 pt-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              <Link
                href="/login"
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-center text-sm font-semibold text-gray-700 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="bg-brand-gradient rounded-lg px-5 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

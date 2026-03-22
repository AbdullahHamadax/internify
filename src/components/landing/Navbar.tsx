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
  const [activeHash, setActiveHash] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    
    // eslint-disable-next-line
    setActiveHash(window.location.hash);
    const onHashChange = () => setActiveHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("hashchange", onHashChange);
    };
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
            window.history.pushState(null, "", href);
            setActiveHash(href.slice(1));
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
          ? "bg-white dark:bg-black shadow-[0_4px_0_0_#000] dark:shadow-[0_4px_0_0_#fff] border-b-4 border-black dark:border-white"
          : "bg-white dark:bg-black border-b-4 border-transparent dark:border-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="bg-[#2563EB] rounded-none border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] p-1.5">
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

          {/* Center links – desktop */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`rounded-none px-4 py-2 text-sm font-black uppercase tracking-widest transition-all border-2 border-transparent hover:border-black dark:hover:border-white hover:bg-[#AB47BC] hover:text-white hover:shadow-[2px_2px_0_0_#000] dark:hover:shadow-[2px_2px_0_0_#fff] hover:-translate-y-px hover:-translate-x-px ${
                  pathname === link.href ||
                  (pathname === "/" &&
                    link.href.startsWith("/#") &&
                    activeHash === link.href.slice(1))
                    ? "bg-[#2563EB] text-white border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] -translate-y-[2px] -translate-x-[2px]"
                    : "text-black dark:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right actions – desktop */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="bg-white text-black dark:bg-black dark:text-white border-2 border-black dark:border-white px-5 py-2.5 text-sm font-black uppercase tracking-widest shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="bg-[#2563EB] text-white border-2 border-black dark:border-white px-5 py-2.5 text-sm font-black uppercase tracking-widest shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-none border-2 border-black dark:border-white p-2 text-black dark:text-white bg-white dark:bg-black transition-all shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] hover:-translate-y-px hover:-translate-x-px hover:shadow-[4px_4px_0_0_#000] dark:hover:shadow-[4px_4px_0_0_#fff]"
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
        <div className="md:hidden border-b-4 border-black dark:border-white bg-white dark:bg-black px-4 pb-6 shadow-[0_8px_0_0_#000] dark:shadow-[0_8px_0_0_#fff]">
          <div className="flex flex-col gap-3 pt-3">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`rounded-none border-2 border-black dark:border-white px-4 py-3 text-sm font-black uppercase tracking-widest transition-all shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_0_#000] dark:hover:shadow-[6px_6px_0_0_#fff] ${
                  pathname === link.href ||
                  (pathname === "/" &&
                    link.href.startsWith("/#") &&
                    activeHash === link.href.slice(1))
                    ? "bg-[#2563EB] text-white"
                    : "bg-white text-black dark:bg-black dark:text-white hover:bg-[#AB47BC] hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-3">
              <Link
                href="/login"
                className="bg-white text-black dark:bg-black dark:text-white border-2 border-black dark:border-white px-5 py-3 text-center text-sm font-black uppercase tracking-widest shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="bg-[#2563EB] text-white border-2 border-black dark:border-white px-5 py-3 text-center text-sm font-black uppercase tracking-widest shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
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

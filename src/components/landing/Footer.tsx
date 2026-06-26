"use client";

import { Typography } from "@/components/ui/Typography";
import { Logo } from "@/components/ui/Logo";

const footerColumns = [
  {
    title: "Platform",
    links: [
      { label: "Browse Tasks", href: "#" },
      { label: "How it Works", href: "#how-it-works" },
      { label: "Verify Certificate", href: "/verify" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative border-t-4 border-black dark:border-white text-black dark:text-white pb-2">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 text-center sm:text-left">
          {/* Brand */}
          <div className="flex flex-col items-center sm:items-start">
            <Logo />
            <Typography
              variant="span"
              className="mt-6 leading-relaxed max-w-xs font-bold"
            >
              Bridging education and industry. Empowering students to build
              real-world skills and launch their careers.
            </Typography>
          </div>

          {/* Link columns */}
          {footerColumns.map((col) => (
            <div key={col.title} className="flex flex-col items-center sm:items-start">
              <Typography
                variant="span"
                className="font-black uppercase tracking-widest text-lg"
              >
                {col.title}
              </Typography>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm font-bold tracking-widest uppercase hover:underline decoration-2 underline-offset-4 transition-all"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t-4 border-black dark:border-white pt-8 flex justify-center">
          <Typography
            variant="span"
            className="text-center text-xs text-muted-foreground"
          >
            &copy; 2026 Internify Platform. All rights reserved.
          </Typography>
        </div>
      </div>
    </footer>
  );
}

"use client";

import { GraduationCap } from "lucide-react";

const footerColumns = [
  {
    title: "Platform",
    links: [
      { label: "Browse Tasks", href: "#" },
      { label: "How it Works", href: "#how-it-works" },
      { label: "Pricing", href: "#" },
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
    <footer className="bg-[#0F172A] border-t border-white/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <div className="bg-brand-gradient rounded-lg p-1.5">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Internify</span>
            </div>
            <p className="mt-4 text-sm text-gray-400 leading-relaxed max-w-xs">
              Bridging education and industry. Empowering students to build
              real-world skills and launch their careers.
            </p>
          </div>

          {/* Link columns */}
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-white">{col.title}</h4>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-gray-400 transition-colors hover:text-white"
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
        <div className="mt-12 border-t border-white/10 pt-8">
          <p className="text-center text-sm text-gray-500">
            &copy; 2026 Internify Platform. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

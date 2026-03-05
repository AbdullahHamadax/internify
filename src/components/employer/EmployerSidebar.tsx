"use client";

import { useClerk } from "@clerk/nextjs";
import {
  LayoutDashboard,
  FileEdit,
  Search,
  Bell,
  LogOut,
  GraduationCap,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

type NavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
};

const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="size-[1.125rem]" />,
  },
  {
    id: "post-task",
    label: "Post Task",
    icon: <FileEdit className="size-[1.125rem]" />,
  },
  {
    id: "search-students",
    label: "Search Students",
    icon: <Search className="size-[1.125rem]" />,
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: <Bell className="size-[1.125rem]" />,
  },
];

interface EmployerSidebarProps {
  activeItem: string;
  onNavigate: (id: string) => void;
}

function SidebarContent({
  activeItem,
  onNavigate,
  onClose,
}: EmployerSidebarProps & { onClose?: () => void }) {
  const { signOut } = useClerk();

  return (
    <>
      <div>
        {/* Brand */}
        <div className="emp-sidebar__brand">
          <div className="emp-sidebar__brand-icon">
            <GraduationCap className="size-[1.125rem]" />
          </div>
          <div>
            <div className="emp-sidebar__brand-text">Internify</div>
            <div className="emp-sidebar__brand-role">Employer</div>
          </div>
        </div>

        <div className="emp-sidebar__divider" />

        {/* Navigation */}
        <div className="emp-sidebar__section-label">Menu</div>
        <nav className="emp-sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`emp-sidebar__link${
                activeItem === item.id ? " emp-sidebar__link--active" : ""
              }`}
              onClick={() => {
                onNavigate(item.id);
                onClose?.();
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Bottom */}
      <div>
        <div className="emp-sidebar__divider" />
        <button
          type="button"
          className="emp-sidebar__link emp-sidebar__link--danger"
          onClick={() => signOut()}
        >
          <LogOut className="size-[1.125rem]" />
          Logout
        </button>
      </div>
    </>
  );
}

export default function EmployerSidebar({
  activeItem,
  onNavigate,
}: EmployerSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="emp-sidebar">
        <SidebarContent activeItem={activeItem} onNavigate={onNavigate} />
      </aside>

      {/* Mobile top bar */}
      <div className="emp-mobile-bar">
        <div className="emp-sidebar__brand" style={{ marginBottom: 0 }}>
          <div className="emp-sidebar__brand-icon">
            <GraduationCap className="size-[1.125rem]" />
          </div>
          <div>
            <div className="emp-sidebar__brand-text">Internify</div>
          </div>
        </div>
        <button
          type="button"
          className="emp-icon-btn"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="emp-mobile-overlay emp-mobile-overlay--open"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="emp-mobile-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: "0.5rem",
              }}
            >
              <button
                type="button"
                className="emp-icon-btn"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>
            <SidebarContent
              activeItem={activeItem}
              onNavigate={onNavigate}
              onClose={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import {
  Bell,
  Check,
  MessageSquare,
  Briefcase,
  UserPlus,
  Info,
  ArrowLeft,
} from "lucide-react";
import { Typography } from "@/components/ui/Typography";
import { useRouter } from "next/navigation";

// Type definitions for dummy data
type NotificationType = "message" | "application" | "system" | "task";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  link?: string;
}

const DUMMY_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "application",
    title: "New Application Received",
    message: "Alex Johnson applied for your 'Full Stack Developer' task.",
    time: "10 minutes ago",
    read: false,
    link: "/employer?tab=dashboard",
  },
  {
    id: "n2",
    type: "message",
    title: "New Message",
    message: "Sarah Chen sent you a message regarding her portfolio.",
    time: "1 hour ago",
    read: false,
    link: "/employer?tab=messages",
  },
  {
    id: "n3",
    type: "task",
    title: "Task Expiring Soon",
    message: "Your task 'Backend API Optimization' expires in 2 days.",
    time: "2 hours ago",
    read: true,
  },
  {
    id: "n4",
    type: "system",
    title: "Platform Update",
    message: "We've added new features to the Talent Search! Check them out.",
    time: "Yesterday",
    read: true,
    link: "/employer?tab=talent-search",
  },
  {
    id: "n5",
    type: "application",
    title: "Application Withdrawn",
    message: "David Kim withdrew their application for 'Data Science Intern'.",
    time: "Yesterday",
    read: true,
  },
];

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] =
    useState<Notification[]>(DUMMY_NOTIFICATIONS);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = (id: string, link?: string) => {
    // Mark as read
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );

    // Navigate to link if provided
    if (link) {
      router.push(link);
    }
  };

  const filteredNotifications = notifications.filter((n) =>
    filter === "all" ? true : !n.read,
  );

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case "message":
        return <MessageSquare className="size-5 text-blue-500" />;
      case "application":
        return <UserPlus className="size-5 text-green-500" />;
      case "task":
        return <Briefcase className="size-5 text-amber-500" />;
      case "system":
        return <Info className="size-5 text-purple-500" />;
    }
  };

  const getBgForType = (type: NotificationType) => {
    switch (type) {
      case "message":
        return "bg-blue-500/10 border-blue-500/20";
      case "application":
        return "bg-green-500/10 border-green-500/20";
      case "task":
        return "bg-amber-500/10 border-amber-500/20";
      case "system":
        return "bg-purple-500/10 border-purple-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="size-5" />
            </button>
            <div className="flex items-center gap-2">
              <Typography
                variant="h2"
                className="text-xl font-bold m-0 tracking-tight"
              >
                Notifications
              </Typography>
              {unreadCount > 0 && (
                <span className="bg-primary text-primary-foreground text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex bg-secondary p-1 rounded-lg">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === "all" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === "unread" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Unread
              </button>
            </div>

            <button
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                unreadCount > 0
                  ? "bg-primary/10 text-primary hover:bg-primary/20"
                  : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
              }`}
            >
              <Check className="size-4" />
              <span className="hidden sm:inline">Mark all as read</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile Filter Toggle */}
        <div className="flex sm:hidden bg-secondary p-1 rounded-lg mb-6 w-full">
          <button
            onClick={() => setFilter("all")}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${filter === "all" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${filter === "unread" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Unread
          </button>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden animate-in fade-in duration-500">
          {filteredNotifications.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center">
              <div className="size-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                <Bell className="size-8 text-muted-foreground/50" />
              </div>
              <Typography
                variant="h3"
                className="text-lg font-medium text-foreground mb-1"
              >
                You&apos;re all caught up!
              </Typography>
              <Typography variant="p" className="text-muted-foreground text-sm">
                Check back later for new notifications.
              </Typography>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() =>
                    handleNotificationClick(notification.id, notification.link)
                  }
                  className={`p-4 sm:p-5 flex gap-4 transition-all duration-200 ${
                    notification.link ? "cursor-pointer hover:bg-muted/50" : ""
                  } ${!notification.read ? "bg-primary/5 hover:bg-primary/10" : ""}`}
                >
                  <div
                    className={`mt-1 size-10 flex-shrink-0 rounded-full flex items-center justify-center border ${getBgForType(notification.type)}`}
                  >
                    {getIconForType(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4 mb-1">
                      <Typography
                        variant="p"
                        className={`font-semibold text-base m-0 ${!notification.read ? "text-foreground" : "text-foreground/80"}`}
                      >
                        {notification.title}
                      </Typography>
                      <span className="text-xs font-medium text-muted-foreground whitespace-nowrap pt-1">
                        {notification.time}
                      </span>
                    </div>

                    <Typography
                      variant="p"
                      className={`text-sm m-0 ${!notification.read ? "text-foreground/90 font-medium" : "text-muted-foreground"}`}
                    >
                      {notification.message}
                    </Typography>

                    {notification.link && (
                      <div className="mt-3">
                        <span className="text-xs font-medium text-primary hover:underline">
                          View details &rarr;
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Unread Indicator dot */}
                  {!notification.read && (
                    <div className="flex items-center self-center flex-shrink-0 ml-2">
                      <div className="size-2.5 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

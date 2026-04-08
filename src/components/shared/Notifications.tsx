"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import {
  BellOff,
  UserCheck,
  FileUp,
  MessageSquare,
  CheckCircle,
  Megaphone,
  Clock,
  Check,
} from "lucide-react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useProfileModal } from "./ProfileModalContext";

import "./notifications.css";

type NotificationType =
  | "task_accepted"
  | "task_submitted"
  | "new_message"
  | "task_completed"
  | "new_task_posted"
  | "deadline_approaching";

const ICON_MAP: Record<
  NotificationType,
  { icon: typeof MessageSquare; className: string }
> = {
  task_accepted: { icon: UserCheck, className: "notif-icon--accepted" },
  task_submitted: { icon: FileUp, className: "notif-icon--submitted" },
  new_message: { icon: MessageSquare, className: "notif-icon--message" },
  task_completed: { icon: CheckCircle, className: "notif-icon--completed" },
  new_task_posted: { icon: Megaphone, className: "notif-icon--new-task" },
  deadline_approaching: { icon: Clock, className: "notif-icon--deadline" },
};

const ACTION_MAP: Record<
  NotificationType,
  { label: string; className: string }
> = {
  task_accepted: { label: "View Applicant", className: "notif-action--green" },
  task_submitted: {
    label: "Review Submission",
    className: "notif-action--blue",
  },
  new_message: { label: "Reply", className: "notif-action--orange" },
  task_completed: { label: "View Task", className: "notif-action--purple" },
  new_task_posted: { label: "View Task", className: "notif-action--orange" },
  deadline_approaching: {
    label: "View Task",
    className: "notif-action--red",
  },
};

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} minute${mins > 1 ? "s" : ""} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return new Date(timestamp).toLocaleDateString();
}

type TabFilter = "all" | "unread";

export default function Notifications({
  role,
  onNavigate,
}: {
  role: "student" | "employer";
  onNavigate?: (id: string) => void;
}) {
  const notifications = useQuery(api.notifications.getUserNotifications);
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const { openProfile } = useProfileModal();

  const [activeTab, setActiveTab] = useState<TabFilter>("all");

  const isLoading = notifications === undefined;
  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;
  const totalCount = notifications?.length ?? 0;

  const filteredNotifications =
    activeTab === "unread"
      ? notifications?.filter((n) => !n.isRead)
      : notifications;

  const handleMarkRead = (
    e: React.MouseEvent,
    id: Id<"notifications">,
    isRead: boolean,
  ) => {
    e.stopPropagation();
    if (!isRead) {
      markAsRead({ notificationId: id });
    }
  };


  const handleActionClick = (
    e: React.MouseEvent,
    notif: NonNullable<typeof notifications>[number],
  ) => {
    e.stopPropagation();
    // Mark as read
    if (!notif.isRead) {
      markAsRead({ notificationId: notif._id });
    }

    const type = notif.type as NotificationType;

    if (type === "new_message" && onNavigate) {
      onNavigate("messages");
    } else if (type === "task_accepted" && notif.relatedUserId) {
      openProfile(notif.relatedUserId as Id<"users">);
    } else if (type === "task_submitted" && onNavigate) {
      if (notif.relatedTaskId) {
        onNavigate(`task:${notif.relatedTaskId}`);
      } else {
        onNavigate("dashboard");
      }
    } else if (
      (type === "new_task_posted" ||
        type === "task_completed" ||
        type === "deadline_approaching") &&
      onNavigate
    ) {
      if (role === "student") {
        if (notif.relatedTaskId) {
          onNavigate(`explore-task:${notif.relatedTaskId}`);
        } else {
          onNavigate("explore");
        }
      } else {
        onNavigate("dashboard");
      }
    }
  };

  const handleProfileClick = (
    e: React.MouseEvent,
    userId?: Id<"users">,
  ) => {
    e.stopPropagation();
    if (userId) {
      openProfile(userId);
    }
  };

  const handleCardClick = (id: Id<"notifications">, isRead: boolean) => {
    if (!isRead) {
      markAsRead({ notificationId: id });
    }
  };

  return (
    <div className="notif-container">
      {/* Header */}
      <div className="notif-header">
        <div className="notif-header__left">
          <h2 className="notif-header__title">
            Notifications
            {unreadCount > 0 && (
              <span className="notif-header__badge">{unreadCount} new</span>
            )}
          </h2>
          <p className="notif-header__subtitle">
            Stay updated with your tasks and{" "}
            {role === "student" ? "employer" : "student"} activity
          </p>
        </div>
        <button
          type="button"
          className="notif-mark-all-btn"
          disabled={unreadCount === 0}
          onClick={() => markAllAsRead({})}
        >
          <Check className="size-3.5" />
          Mark all as read
        </button>
      </div>

      {/* Tab filters */}
      <div className="notif-tabs">
        <button
          type="button"
          className={`notif-tab ${activeTab === "all" ? `notif-tab--active notif-tab--active-${role}` : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All Notifications ({totalCount})
        </button>
        <button
          type="button"
          className={`notif-tab ${activeTab === "unread" ? `notif-tab--active notif-tab--active-${role}` : ""}`}
          onClick={() => setActiveTab("unread")}
        >
          Unread ({unreadCount})
        </button>
        <div className="notif-tabs__spacer" />
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="notif-loading">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="notif-skeleton" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (filteredNotifications?.length ?? 0) === 0 && (
        <div className="notif-empty">
          <div className="notif-empty__icon">
            <BellOff className="size-5" />
          </div>
          <p className="notif-empty__title">
            {activeTab === "unread"
              ? "All caught up!"
              : "No notifications yet"}
          </p>
          <p className="notif-empty__sub">
            {activeTab === "unread"
              ? "You have no unread notifications."
              : role === "student"
                ? "You'll be notified when new tasks are posted or employers respond."
                : "You'll be notified when students accept or submit tasks."}
          </p>
        </div>
      )}

      {/* Notification list */}
      {!isLoading && (filteredNotifications?.length ?? 0) > 0 && (
        <div className="notif-list">
          {filteredNotifications?.map((notif) => {
            const type = notif.type as NotificationType;
            const typeConfig = ICON_MAP[type] ?? ICON_MAP.new_message;
            const actionConfig = ACTION_MAP[type];
            const Icon = typeConfig.icon;

            return (
              <div
                key={notif._id}
                className={`notif-card ${
                  notif.isRead
                    ? "notif-card--read"
                    : `notif-card--unread notif-card--${role}`
                }`}
                onClick={() => handleCardClick(notif._id, notif.isRead)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleCardClick(notif._id, notif.isRead);
                  }
                }}
              >
                {/* Icon */}
                <div
                  className={`notif-icon ${typeConfig.className} ${notif.relatedUserId ? "notif-icon--clickable" : ""}`}
                  onClick={(e) =>
                    handleProfileClick(
                      e,
                      notif.relatedUserId as Id<"users"> | undefined,
                    )
                  }
                  title={
                    notif.relatedUserName
                      ? `View ${notif.relatedUserName}'s profile`
                      : undefined
                  }
                >
                  <Icon className="size-4" />
                </div>

                {/* Content */}
                <div className="notif-content">
                  <div className="notif-content__top">
                    <p className="notif-content__title">
                      {notif.title}
                      {!notif.isRead && (
                        <span
                          className={`notif-unread-dot notif-unread-dot--${role}`}
                        />
                      )}
                    </p>
                    <div className="notif-content__actions">
                      {!notif.isRead && (
                        <button
                          type="button"
                          className="notif-action-icon"
                          title="Mark as read"
                          onClick={(e) =>
                            handleMarkRead(e, notif._id, notif.isRead)
                          }
                        >
                          <Check className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="notif-content__message">
                    {notif.relatedUserName && notif.relatedUserId ? (
                      <>
                        <span
                          className="notif-user-link"
                          onClick={(e) =>
                            handleProfileClick(
                              e,
                              notif.relatedUserId as
                                | Id<"users">
                                | undefined,
                            )
                          }
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              handleProfileClick(
                                e as unknown as React.MouseEvent,
                                notif.relatedUserId as
                                  | Id<"users">
                                  | undefined,
                              );
                            }
                          }}
                        >
                          {notif.relatedUserName}
                        </span>
                        {/* Strip name once; keep a visual space before the rest (trimStart alone removed it) */}
                        {" "}
                        {notif.message
                          .replace(notif.relatedUserName, "")
                          .trimStart()}
                      </>
                    ) : (
                      notif.message
                    )}
                  </p>
                  <div className="notif-content__bottom">
                    <p className="notif-content__time">
                      📅 {timeAgo(notif.createdAt)}
                    </p>
                    {actionConfig && (
                      <button
                        type="button"
                        className={`notif-action-btn ${actionConfig.className}`}
                        onClick={(e) => handleActionClick(e, notif)}
                      >
                        {actionConfig.label}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

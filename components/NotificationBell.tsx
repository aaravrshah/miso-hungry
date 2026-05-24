"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useNotifications } from "@/components/NotificationProvider";

export function NotificationBell({ className = "" }: { className?: string }) {
  const { unreadCount } = useNotifications();

  return (
    <Link
      aria-label={unreadCount ? `${unreadCount} unread notifications` : "Notifications"}
      className={`relative grid h-10 w-10 place-items-center rounded-lg border border-stone-200 bg-white/82 text-stone-700 shadow-sm transition hover:text-[var(--tomato)] ${className}`}
      href="/notifications"
    >
      <Bell aria-hidden="true" className="h-5 w-5" />
      {unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[var(--tomato)] px-1.5 py-0.5 text-center text-[0.65rem] font-bold leading-none text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}

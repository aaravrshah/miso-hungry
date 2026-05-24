"use client";

import { Bell, CheckCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { useNotifications } from "@/components/NotificationProvider";
import type { AppNotification } from "@/lib/firebase/schema";

function formatNotificationTime(value?: unknown) {
  if (!value) {
    return "Just now";
  }

  const date =
    typeof value === "object" && "toDate" in value && typeof value.toDate === "function"
      ? value.toDate()
      : new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  }).format(date);
}

export function NotificationsClient() {
  const {
    error,
    isLoading,
    markAllRead,
    markRead,
    notifications,
    refreshNotifications,
    unreadCount,
  } = useNotifications();

  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-5">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="hidden text-sm font-bold uppercase tracking-[0.18em] text-[var(--tomato)] sm:block">
            Notifications
          </p>
          <h1 className="font-serif text-2xl leading-tight text-stone-950 sm:text-5xl">
            What happened lately
          </h1>
          <p className="mt-1 text-sm font-semibold text-stone-500">
            {unreadCount} unread update{unreadCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm font-bold text-stone-700 shadow-sm sm:min-h-10"
            onClick={refreshNotifications}
            type="button"
          >
            {isLoading ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
            Refresh
          </button>
          <button
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-[var(--tomato)] px-3 text-sm font-bold text-white shadow-sm sm:min-h-10"
            onClick={markAllRead}
            type="button"
          >
            <CheckCheck aria-hidden="true" className="h-4 w-4" />
            Mark read
          </button>
        </div>
      </section>

      {error ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}

      {isLoading && notifications.length === 0 ? (
        <p className="rounded-lg border border-stone-200 bg-white/72 p-4 text-sm font-semibold text-stone-600 shadow-sm">
          Loading notifications...
        </p>
      ) : null}

      {!isLoading && notifications.length === 0 ? (
        <section className="rounded-lg border border-dashed border-stone-300 bg-white/60 p-6 text-center shadow-sm">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-[#fff4e4] text-[var(--tomato)]">
            <Bell aria-hidden="true" className="h-6 w-6" />
          </span>
          <h2 className="mt-3 font-serif text-2xl text-stone-950">Quiet for now</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Friend requests, recipe activity, collaboration updates, and reminders will land here.
          </p>
        </section>
      ) : null}

      <div className="space-y-3">
        {notifications.map((notification) => (
          <NotificationRow
            key={notification.id}
            notification={notification}
            onRead={() => markRead(notification.id)}
          />
        ))}
      </div>
    </div>
  );
}

function NotificationRow({
  notification,
  onRead,
}: {
  notification: AppNotification;
  onRead: () => void;
}) {
  const content = (
    <article
      className={`flex gap-3 rounded-lg border p-3 shadow-sm transition sm:p-4 ${
        notification.isRead
          ? "border-stone-200 bg-white/68"
          : "border-orange-200 bg-[#fff8ed]"
      }`}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-lg shadow-sm ring-1 ring-stone-200 sm:h-11 sm:w-11 sm:text-xl">
        {notification.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-serif text-lg leading-tight text-stone-950 sm:text-xl">
              {notification.title}
            </h2>
            <p className="mt-1 text-sm leading-6 text-stone-600">{notification.body}</p>
          </div>
          {!notification.isRead ? (
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--tomato)]" />
          ) : null}
        </div>
        <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-stone-400">
          {formatNotificationTime(notification.createdAt)}
        </p>
      </div>
    </article>
  );

  if (!notification.href) {
    return (
      <button className="block w-full text-left" onClick={onRead} type="button">
        {content}
      </button>
    );
  }

  return (
    <Link className="block" href={notification.href} onClick={onRead}>
      {content}
    </Link>
  );
}

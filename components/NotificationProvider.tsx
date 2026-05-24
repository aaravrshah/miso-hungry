"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/AuthProvider";
import type { AppNotification } from "@/lib/firebase/schema";
import {
  fetchNotifications,
  markAllNotificationsRead as markAllNotificationsReadService,
  markNotificationRead as markNotificationReadService,
} from "@/lib/services/notificationService";

type NotificationContextValue = {
  error?: string;
  isLoading: boolean;
  markAllRead: () => Promise<void>;
  markRead: (notificationId: string) => Promise<void>;
  notifications: AppNotification[];
  refreshNotifications: () => Promise<void>;
  unreadCount: number;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const refreshNotifications = useCallback(async () => {
    if (!profile) {
      setNotifications([]);
      return;
    }

    setIsLoading(true);
    setError(undefined);

    try {
      setNotifications(await fetchNotifications(profile.id));
    } catch (notificationError) {
      setError(
        notificationError instanceof Error
          ? notificationError.message
          : "Unable to load notifications.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    window.queueMicrotask(() => {
      refreshNotifications();
    });
  }, [refreshNotifications]);

  const markRead = useCallback(
    async (notificationId: string) => {
      setError(undefined);

      try {
        await markNotificationReadService(notificationId);
        setNotifications((currentNotifications) =>
          currentNotifications.map((notification) =>
            notification.id === notificationId
              ? { ...notification, isRead: true }
              : notification,
          ),
        );
      } catch (notificationError) {
        setError(
          notificationError instanceof Error
            ? notificationError.message
            : "Unable to update notification.",
        );
      }
    },
    [],
  );

  const markAllRead = useCallback(async () => {
    if (!profile) {
      return;
    }

    setError(undefined);

    try {
      await markAllNotificationsReadService(profile.id);
      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) => ({ ...notification, isRead: true })),
      );
    } catch (notificationError) {
      setError(
        notificationError instanceof Error
          ? notificationError.message
          : "Unable to update notifications.",
      );
    }
  }, [profile]);

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  const value = useMemo(
    () => ({
      error,
      isLoading,
      markAllRead,
      markRead,
      notifications,
      refreshNotifications,
      unreadCount,
    }),
    [
      error,
      isLoading,
      markAllRead,
      markRead,
      notifications,
      refreshNotifications,
      unreadCount,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotifications must be used inside NotificationProvider");
  }

  return context;
}

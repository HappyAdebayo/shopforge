"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./useAuth";
import { notificationService } from "@/lib/api/notification";
import {
  getNotificationSocket,
  joinNotificationUserRoom,
  joinNotificationAdminRoom,
} from "@/lib/notificationSocket";
import type { Notification } from "@/types";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [toastNotification, setToastNotification] = useState<Notification | null>(
    null
  );

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await notificationService.getNotifications({ limit: 15 });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.warn("[Notification Provider] Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const markAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("[Notification Provider] Failed to mark as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("[Notification Provider] Failed to mark all as read:", err);
    }
  };

  // Initial fetch on login
  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, fetchNotifications]);

  // Connect socket and listen for real-time notifications
  useEffect(() => {
    if (!user) return;

    const socket = getNotificationSocket();

    const joinRooms = () => {
      joinNotificationUserRoom(user.id);
      if (user.role === "admin") {
        joinNotificationAdminRoom();
      }
    };

    joinRooms();
    socket.on("connect", joinRooms);

    const handleNewNotification = (notif: Notification) => {
      console.log("[Notification Hook] New notification received:", notif);
      setNotifications((prev) => [notif, ...prev.filter((n) => n.id !== notif.id)]);
      setUnreadCount((prev) => prev + 1);

      // Show toast alert briefly
      setToastNotification(notif);
      setTimeout(() => {
        setToastNotification((curr) => (curr?.id === notif.id ? null : curr));
      }, 5000);
    };

    socket.on("new-notification", handleNewNotification);

    return () => {
      socket.off("connect", joinRooms);
      socket.off("new-notification", handleNewNotification);
    };
  }, [user]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
      {/* Real-time Floating Notification Toast */}
      {toastNotification && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700 flex items-start gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0 animate-pulse" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
              {toastNotification.title}
            </p>
            <p className="text-sm text-slate-200 mt-0.5 leading-snug">
              {toastNotification.message}
            </p>
          </div>
          <button
            onClick={() => setToastNotification(null)}
            className="text-slate-400 hover:text-white text-xs p-1"
          >
            ✕
          </button>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

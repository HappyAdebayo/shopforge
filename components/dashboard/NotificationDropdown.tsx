"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bell,
  CheckCheck,
  Phone,
  PhoneIncoming,
  PhoneCall,
  PhoneOff,
  PhoneMissed,
  Store,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
} from "lucide-react";
import { useNotification } from "@/hooks/useNotification";
import type { Notification, NotificationType } from "@/types";

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "incoming_call":
      return <PhoneIncoming size={16} className="text-indigo-600" />;
    case "call_outgoing":
      return <Phone size={16} className="text-indigo-600" />;
    case "call_accepted":
      return <PhoneCall size={16} className="text-emerald-600" />;
    case "call_rejected":
      return <PhoneOff size={16} className="text-rose-600" />;
    case "call_missed":
      return <PhoneMissed size={16} className="text-amber-600" />;
    case "call_ended":
      return <Phone size={16} className="text-slate-500" />;
    case "vendor_application_submitted":
      return <FileText size={16} className="text-blue-600" />;
    case "vendor_application_approved":
      return <CheckCircle2 size={16} className="text-emerald-600" />;
    case "vendor_application_rejected":
      return <XCircle size={16} className="text-rose-600" />;
    default:
      return <Bell size={16} className="text-indigo-600" />;
  }
};

const formatTimeAgo = (dateStr?: string) => {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return "Just now";
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, fetchNotifications } =
    useNotification();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen((prev) => !prev);
  };

  const handleItemClick = (notif: Notification) => {
    if (!notif.isRead) {
      markAsRead(notif.id);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={handleToggle}
        aria-label="Notifications"
        className={`relative p-2 rounded-full transition-colors ${
          isOpen
            ? "bg-indigo-50 text-indigo-600"
            : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        }`}
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-800">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="text-[11px] font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 transition-colors"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
                  <Bell size={20} />
                </div>
                <p className="text-sm font-semibold text-slate-700">No notifications yet</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  When you receive calls or updates, they’ll show up here.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-slate-50 ${
                    !notif.isRead ? "bg-indigo-50/40" : "bg-white"
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`text-xs font-semibold truncate ${
                          !notif.isRead ? "text-slate-900" : "text-slate-700"
                        }`}
                      >
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5 flex-shrink-0">
                        <Clock size={10} />
                        {formatTimeAgo(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <div className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0 mt-2" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

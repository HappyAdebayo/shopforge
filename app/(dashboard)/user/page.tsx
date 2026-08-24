"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { vendorService } from "@/lib/api/vendor";
import Link from "next/link";
import {
  Store,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  User as UserIcon,
  RefreshCw,
} from "lucide-react";
import type { VendorStatus } from "@/types";

export default function UserDashboardPage() {
  const { user, updateUser } = useAuth();
  const [syncing, setSyncing] = useState(true);

  // Sync real-time vendor status from backend
  useEffect(() => {
    if (!user) return;

    const checkLiveStatus = async () => {
      try {
        const res = await vendorService.getApplications(1, 100);
        const apps = res?.data?.applications ?? [];
        const myApp = apps.find((a) => a.userId === user.id);

        let newStatus: VendorStatus = "none";
        if (myApp) {
          newStatus = myApp.status === "approved" ? "approved" : "pending";
        } else {
          // If no application exists in DB
          if (user.vendorStatus === "pending") {
            // It was pending before, but now gone -> admin rejected it (backend destroys rejected records)
            newStatus = "rejected";
          } else if (user.vendorStatus === "approved") {
            newStatus = "approved";
          } else if (user.vendorStatus === "rejected") {
            newStatus = "rejected";
          } else {
            newStatus = "none";
          }
        }

        if (newStatus !== user.vendorStatus) {
          updateUser({ ...user, vendorStatus: newStatus });
        }
      } catch (err) {
        console.error("Could not sync live application status:", err);
      } finally {
        setSyncing(false);
      }
    };

    checkLiveStatus();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null;

  const status: VendorStatus = user.vendorStatus ?? "none";

  const statusConfig = {
    none: {
      icon: <Store size={22} className="text-indigo-600" />,
      bg: "bg-indigo-50 border-indigo-200",
      badge: "bg-indigo-100 text-indigo-700",
      title: "Become a Vendor",
      description:
        "Start selling on ShopForge. Apply today and our admin team will review your application.",
      cta: { label: "Apply Now", href: "/user/apply" },
    },
    pending: {
      icon: <Clock size={22} className="text-amber-600" />,
      bg: "bg-amber-50 border-amber-200",
      badge: "bg-amber-100 text-amber-700",
      title: "Application Under Review",
      description:
        "Your vendor application is currently being reviewed by our admin team. We will update you once processed.",
      cta: null,
    },
    approved: {
      icon: <CheckCircle size={22} className="text-emerald-600" />,
      bg: "bg-emerald-50 border-emerald-200",
      badge: "bg-emerald-100 text-emerald-700",
      title: "You're a Vendor! 🎉",
      description:
        "Congratulations! Your vendor account is active. Head to your vendor dashboard to manage your store.",
      cta: { label: "Go to Store", href: "/vendor" },
    },
    rejected: {
      icon: <XCircle size={22} className="text-red-600" />,
      bg: "bg-red-50 border-red-200",
      badge: "bg-red-100 text-red-700",
      title: "Application Rejected",
      description:
        "Your previous vendor application was rejected by the admin. You can submit a new application with updated business details.",
      cta: { label: "Apply Again", href: "/user/apply" },
    },
  };

  const config = statusConfig[status];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-sm">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold uppercase">
            {user.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold">Welcome, {user.name}!</h2>
            <p className="text-indigo-200 text-sm">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <UserIcon size={16} className="text-slate-400" />
            <p className="text-sm text-slate-500">Account Role</p>
          </div>
          <p className="text-2xl font-bold text-indigo-600 capitalize">
            {user.role}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Store size={16} className="text-slate-400" />
              <p className="text-sm text-slate-500">Vendor Status</p>
            </div>
            {syncing && (
              <RefreshCw size={12} className="text-slate-400 animate-spin" />
            )}
          </div>
          <p
            className={`text-2xl font-bold capitalize ${
              status === "approved"
                ? "text-emerald-600"
                : status === "pending"
                ? "text-amber-600"
                : status === "rejected"
                ? "text-red-600"
                : "text-slate-400"
            }`}
          >
            {status === "none" ? "Not Applied" : status}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">Member Since</p>
          <p className="text-2xl font-bold text-slate-700">
            {user.createdAt
              ? new Date(user.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })
              : "—"}
          </p>
        </div>
      </div>

      {/* Vendor status card */}
      <div className={`rounded-2xl border p-6 ${config.bg} shadow-sm`}>
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0">
            {config.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-slate-800">{config.title}</h3>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${config.badge}`}
              >
                {status}
              </span>
            </div>
            <p className="text-sm text-slate-600 mb-4">{config.description}</p>
            {config.cta && (
              <Link
                href={config.cta.href}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
              >
                {config.cta.label}
                <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

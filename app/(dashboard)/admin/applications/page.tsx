"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, RefreshCw, Inbox, AlertCircle } from "lucide-react";
import ApplicationCard from "@/components/dashboard/ApplicationCard";
import type { VendorApplication } from "@/types";
import { vendorService } from "@/lib/api/vendor";

type Filter = "all" | "pending" | "approved";

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<VendorApplication[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await vendorService.getApplications(1, 100);
      const apps = res?.data?.applications ?? [];
      setApplications(Array.isArray(apps) ? apps : []);
    } catch (err: unknown) {
      console.error("Failed to load applications from API:", err);
      // Fallback: check localStorage
      try {
        const raw = localStorage.getItem("shopforge_applications");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setApplications(parsed);
            return;
          }
        }
      } catch {
        // ignore fallback parse error
      }
      let msg = "Failed to load applications";
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        if (axiosErr.response?.data?.message) {
          msg = axiosErr.response.data.message;
        }
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleUpdate = (id: number, action: "approve" | "reject") => {
    setApplications((prev) =>
      action === "approve"
        ? prev.map((a) =>
            a.id === id ? { ...a, status: "approved" as const } : a
          )
        : prev.filter((a) => a.id !== id)
    );

    // Also sync localStorage if present
    const raw = localStorage.getItem("shopforge_applications");
    if (raw) {
      try {
        const all: VendorApplication[] = JSON.parse(raw);
        const updated =
          action === "approve"
            ? all.map((a) =>
                a.id === id ? { ...a, status: "approved" as const } : a
              )
            : all.filter((a) => a.id !== id);
        localStorage.setItem("shopforge_applications", JSON.stringify(updated));
      } catch {
        /* ignore */
      }
    }
  };

  const safeApplications = Array.isArray(applications) ? applications : [];

  const filtered = safeApplications.filter((a) => {
    const matchFilter = filter === "all" || a.status === filter;
    const matchSearch =
      !search ||
      a.businessName?.toLowerCase().includes(search.toLowerCase()) ||
      a.description?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const pendingCount = safeApplications.filter((a) => a.status === "pending").length;
  const approvedCount = safeApplications.filter((a) => a.status === "approved").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Vendor Applications
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {pendingCount} pending · {approvedCount} approved · {safeApplications.length} total
          </p>
        </div>
        <button
          onClick={fetchApplications}
          disabled={loading}
          className="flex items-center gap-2 text-sm px-3.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-50 transition-colors bg-white font-medium shadow-sm"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search business name or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
        </div>
        <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white shadow-sm">
          {(["all", "pending", "approved"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? "bg-indigo-600 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f}
              {f === "pending" && pendingCount > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
                  filter === "pending" ? "bg-indigo-500 text-white" : "bg-amber-100 text-amber-700"
                }`}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Error state if any */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm flex items-center gap-3">
          <AlertCircle size={18} className="flex-shrink-0 text-red-500" />
          <div className="flex-1">
            <p className="font-medium">Failed to fetch applications from server</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
          <button
            onClick={fetchApplications}
            className="text-xs bg-red-100 hover:bg-red-200 text-red-800 font-medium px-2.5 py-1 rounded"
          >
            Retry
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading applications...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3 bg-white rounded-2xl border border-slate-200">
          <Inbox size={44} strokeWidth={1.5} className="text-slate-300" />
          <p className="text-sm font-medium text-slate-600">
            {search
              ? "No applications match your search"
              : filter === "all"
              ? "No vendor applications submitted yet"
              : `No ${filter} applications found`}
          </p>
          <p className="text-xs text-slate-400">
            When users apply to become vendors from their dashboard, they will appear here.
          </p>
          {filter !== "all" && (
            <button
              onClick={() => setFilter("all")}
              className="text-indigo-600 text-xs font-medium hover:underline mt-1"
            >
              Show all applications
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

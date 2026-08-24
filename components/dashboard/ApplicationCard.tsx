"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Building2, FileText, Link as LinkIcon, Loader2 } from "lucide-react";
import { vendorService } from "@/lib/api/vendor";
import type { VendorApplication } from "@/types";
import { cn } from "@/lib/utils";

interface ApplicationCardProps {
  application: VendorApplication;
  onUpdate: (id: number, action: "approve" | "reject") => void;
}

export default function ApplicationCard({
  application,
  onUpdate,
}: ApplicationCardProps) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handle = async (action: "approve" | "reject") => {
    setLoading(action);
    setError(null);
    try {
      if (action === "approve") {
        await vendorService.approveApplication(application.id);
      } else {
        await vendorService.rejectApplication(application.id);
      }
      onUpdate(application.id, action);
    } catch (err: unknown) {
      let msg = "Something went wrong";
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        if (axiosErr.response?.data?.message) {
          msg = axiosErr.response.data.message;
        }
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          {application.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={application.logoUrl}
              alt={application.businessName}
              className="w-12 h-12 rounded-xl object-cover border border-slate-200"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Building2 size={22} className="text-indigo-600" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">
              {application.businessName}
            </h3>
            <p className="text-xs text-slate-400">Application #{application.id}</p>
          </div>
        </div>
        <span
          className={cn(
            "text-xs font-semibold px-2.5 py-1 rounded-full",
            application.status === "pending"
              ? "bg-amber-100 text-amber-700"
              : "bg-emerald-100 text-emerald-700"
          )}
        >
          {application.status}
        </span>
      </div>

      {/* Description */}
      <div className="flex items-start gap-2 mb-3">
        <FileText size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
          {application.description}
        </p>
      </div>

      {/* Logo URL */}
      {application.logoUrl && (
        <div className="flex items-center gap-2 mb-3">
          <LinkIcon size={14} className="text-slate-400 flex-shrink-0" />
          <a
            href={application.logoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-600 hover:underline truncate"
          >
            {application.logoUrl}
          </a>
        </div>
      )}

      {/* Meta */}
      <p className="text-xs text-slate-400 mb-4">
        Submitted: {application.createdAt
          ? new Date(application.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "—"}
      </p>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">
          {error}
        </p>
      )}

      {/* Actions */}
      {application.status === "pending" && (
        <div className="flex gap-2">
          <button
            onClick={() => handle("approve")}
            disabled={!!loading}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg transition-colors"
          >
            {loading === "approve" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <CheckCircle size={14} />
            )}
            Approve
          </button>
          <button
            onClick={() => handle("reject")}
            disabled={!!loading}
            className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg transition-colors"
          >
            {loading === "reject" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <XCircle size={14} />
            )}
            Reject
          </button>
        </div>
      )}

      {application.status === "approved" && (
        <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
          <CheckCircle size={16} />
          <span>Approved</span>
        </div>
      )}
    </div>
  );
}

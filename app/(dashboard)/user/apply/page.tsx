"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { vendorService } from "@/lib/api/vendor";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, Building2, FileText, Image, AlertCircle } from "lucide-react";
import type { VendorApplyFormData, VendorApplication } from "@/types";

const schema = z.object({
  businessName: z
    .string()
    .trim()
    .min(2, "Business name must be at least 2 characters"),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters"),
  logoUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

export default function VendorApplyPage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [hasPendingApplication, setHasPendingApplication] = useState(false);

  // Check live status on mount
  useEffect(() => {
    if (!user) return;

    const syncStatus = async () => {
      try {
        const res = await vendorService.getApplications(1, 100);
        const apps = res?.data?.applications ?? [];
        const myApp = apps.find((a) => a.userId === user.id);

        if (myApp && myApp.status === "pending") {
          setHasPendingApplication(true);
          if (user.vendorStatus !== "pending") {
            updateUser({ ...user, vendorStatus: "pending" });
          }
        } else if (myApp && myApp.status === "approved") {
          if (user.vendorStatus !== "approved") {
            updateUser({ ...user, vendorStatus: "approved" });
          }
          router.push("/vendor");
        } else {
          // No pending application in DB
          setHasPendingApplication(false);
          if (user.vendorStatus === "pending") {
            updateUser({ ...user, vendorStatus: "rejected" });
          }
        }
      } catch (err) {
        console.error("Failed to check existing application status:", err);
      } finally {
        setCheckingStatus(false);
      }
    };

    syncStatus();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  if (checkingStatus) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Checking application status...</p>
      </div>
    );
  }

  // Already approved
  if (user?.vendorStatus === "approved") {
    router.push("/vendor");
    return null;
  }

  // Truly pending
  if (hasPendingApplication) {
    return (
      <div className="max-w-lg mx-auto mt-10">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 size={28} className="text-amber-600 animate-spin" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">
            Application Under Review
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            You have a pending vendor application submitted. Our admin team will
            review it shortly.
          </p>
          <button
            onClick={() => router.push("/user")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto mt-10">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-emerald-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">
            Application Submitted!
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            Your vendor application has been submitted to the admin for review.
          </p>
          <button
            onClick={() => router.push("/user")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      const payload: VendorApplyFormData = {
        businessName: data.businessName,
        description: data.description,
        ...(data.logoUrl ? { logoUrl: data.logoUrl } : {}),
      };

      const res = await vendorService.apply(payload);

      // Save application
      const newApp: VendorApplication = {
        id: res.data?.application?.id ?? Date.now(),
        userId: user?.id ?? 0,
        businessName: payload.businessName,
        description: payload.description,
        logoUrl: payload.logoUrl ?? null,
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      try {
        const existing = JSON.parse(
          localStorage.getItem("shopforge_applications") ?? "[]"
        ) as VendorApplication[];
        localStorage.setItem(
          "shopforge_applications",
          JSON.stringify([...existing.filter((a) => a.id !== newApp.id), newApp])
        );
      } catch {
        // ignore localStorage error
      }

      // Update user vendorStatus locally
      if (user) {
        updateUser({ ...user, vendorStatus: "pending" });
      }

      setSubmitted(true);
    } catch (err: unknown) {
      let msg = "Failed to submit application. Please try again.";
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        if (axiosErr.response?.data?.message) {
          msg = axiosErr.response.data.message;
        }
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setServerError(msg);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Building2 size={24} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Apply to Become a Vendor
            </h2>
            <p className="text-sm text-slate-500">
              Tell us about your business and start selling
            </p>
          </div>
        </div>

        {user?.vendorStatus === "rejected" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3 text-sm text-red-700">
            <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Previous Application Rejected</p>
              <p className="text-xs text-red-600 mt-0.5">
                You can revise your information and submit a new application below.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Business Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Building2 size={14} />
                Business Name *
              </span>
            </label>
            <input
              {...register("businessName")}
              placeholder="e.g. Acme Supplies"
              className={`w-full px-4 py-2.5 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.businessName
                  ? "border-red-400 bg-red-50"
                  : "border-slate-300 bg-white"
              }`}
            />
            {errors.businessName && (
              <p className="mt-1 text-xs text-red-600">
                {errors.businessName.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                <FileText size={14} />
                Business Description *
              </span>
            </label>
            <textarea
              {...register("description")}
              rows={4}
              placeholder="Describe what your business sells, your product categories, etc."
              className={`w-full px-4 py-2.5 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${
                errors.description
                  ? "border-red-400 bg-red-50"
                  : "border-slate-300 bg-white"
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Logo URL */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Image size={14} />
                Logo URL{" "}
                <span className="text-slate-400 font-normal">(optional)</span>
              </span>
            </label>
            <input
              {...register("logoUrl")}
              type="url"
              placeholder="https://example.com/logo.png"
              className={`w-full px-4 py-2.5 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.logoUrl
                  ? "border-red-400 bg-red-50"
                  : "border-slate-300 bg-white"
              }`}
            />
            {errors.logoUrl && (
              <p className="mt-1 text-xs text-red-600">
                {errors.logoUrl.message}
              </p>
            )}
          </div>

          {/* Server error */}
          {serverError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
              {serverError}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium py-3 rounded-lg text-sm transition-colors shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Submitting…
              </>
            ) : user?.vendorStatus === "rejected" ? (
              "Re-submit Vendor Application"
            ) : (
              "Submit Application"
            )}
          </button>
        </form>
      </div>

      {/* Info note */}
      <p className="text-xs text-slate-400 text-center mt-4">
        Your application will be reviewed by an admin. You will see updates on your dashboard.
      </p>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { vendorService } from "@/lib/api/vendor";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  CheckCircle,
  Building2,
  FileText,
  Image,
  AlertCircle,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Globe2,
} from "lucide-react";
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

export default function BecomeAVendorPage() {
  const { user, updateUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [existingApp, setExistingApp] = useState<VendorApplication | null>(null);

  // Sync current user's application status on mount
  useEffect(() => {
    if (!user) {
      setCheckingStatus(false);
      return;
    }

    const checkStatus = async () => {
      try {
        let app: VendorApplication | null = null;
        try {
          const res = await vendorService.getMyApplication();
          app = res?.data?.application ?? null;
        } catch {
          try {
            const raw = localStorage.getItem("shopforge_applications");
            if (raw) {
              const apps = JSON.parse(raw) as VendorApplication[];
              app = apps.find((a) => a.userId === user.id) ?? null;
            }
          } catch {
            /* ignore */
          }
        }

        setExistingApp(app);

        if (app?.status === "approved" && user.vendorStatus !== "approved") {
          updateUser({ ...user, vendorStatus: "approved" });
        } else if (app?.status === "pending" && user.vendorStatus !== "pending") {
          updateUser({ ...user, vendorStatus: "pending" });
        } else if (app?.status === "rejected" && user.vendorStatus !== "rejected") {
          updateUser({ ...user, vendorStatus: "rejected" });
        }
      } catch (err) {
        console.error("Failed to check application status:", err);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkStatus();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      const payload: VendorApplyFormData = {
        businessName: data.businessName,
        description: data.description,
        ...(data.logoUrl ? { logoUrl: data.logoUrl } : {}),
      };

      const res = await vendorService.apply(payload);

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
        /* ignore */
      }

      if (user) {
        updateUser({ ...user, vendorStatus: "pending" });
      }

      setExistingApp(newApp);
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

  if (authLoading || checkingStatus) {
    return (
      <div className="flex flex-col items-center justify-center py-28 gap-3">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Checking seller account status...</p>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-sm">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-5">
            <Building2 size={32} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
            Sell on ShopForge
          </h1>
          <p className="text-slate-600 max-w-md mx-auto mb-8 text-sm sm:text-base">
            Reach thousands of active shoppers, grow your business, and manage your inventory with our comprehensive vendor tools.
          </p>
          <Link
            href="/login?redirect=/become-a-vendor"
            className="inline-flex items-center gap-2 bg-[#febd69] hover:bg-[#f3a847] text-slate-900 font-bold px-8 py-3 rounded-lg text-sm transition-colors shadow-sm"
          >
            Sign In to Start Selling
          </Link>
          <p className="text-xs text-slate-400 mt-4">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-indigo-600 font-semibold hover:underline">
              Create a free account
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // Already approved vendor
  if (user.role === "vendor" || user.vendorStatus === "approved" || existingApp?.status === "approved") {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            You are an Approved Vendor!
          </h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Your vendor account is active. You can now access your dedicated Vendor Dashboard to list products and manage orders.
          </p>
          <button
            onClick={() => router.push("/vendor")}
            className="bg-[#febd69] hover:bg-[#f3a847] text-slate-900 font-bold text-sm px-6 py-3 rounded-lg transition-colors shadow-sm"
          >
            Go to Vendor Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Pending application
  if (existingApp?.status === "pending" || user.vendorStatus === "pending") {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 size={32} className="text-amber-600 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Application Under Review
          </h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            We have received your vendor application for <strong>{existingApp?.businessName || "your store"}</strong>. Our team will review your business information shortly.
          </p>
          <Link
            href="/"
            className="inline-block bg-[#131921] hover:bg-[#232f3e] text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            Return to Store
          </Link>
        </div>
      </div>
    );
  }

  // Newly submitted
  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Application Submitted!
          </h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Your vendor application has been sent for admin review. Once approved, you will be able to manage your store from the Vendor Dashboard.
          </p>
          <Link
            href="/"
            className="inline-block bg-[#febd69] hover:bg-[#f3a847] text-slate-900 font-bold text-sm px-6 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Intro hero box */}
      <div className="bg-[#131921] text-white rounded-2xl p-6 sm:p-10 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
            <Sparkles size={13} /> Seller Central
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Become a ShopForge Seller
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Sell directly to thousands of customers. Take advantage of our low fees, high-speed fulfillment, and integrated payment processing.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 shrink-0 text-xs">
          <div className="bg-white/10 p-3 rounded-xl flex items-center gap-2">
            <TrendingUp size={16} className="text-amber-400" />
            <span>High Sales Volume</span>
          </div>
          <div className="bg-white/10 p-3 rounded-xl flex items-center gap-2">
            <ShieldCheck size={16} className="text-amber-400" />
            <span>Protected Payouts</span>
          </div>
          <div className="bg-white/10 p-3 rounded-xl flex items-center gap-2">
            <Globe2 size={16} className="text-amber-400" />
            <span>Nationwide Reach</span>
          </div>
          <div className="bg-white/10 p-3 rounded-xl flex items-center gap-2">
            <Building2 size={16} className="text-amber-400" />
            <span>Fast Approval</span>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 font-bold">
            <Building2 size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Vendor Application
            </h2>
            <p className="text-xs text-slate-500">
              Complete the details below to submit your store for review
            </p>
          </div>
        </div>

        {user.vendorStatus === "rejected" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3 text-sm text-red-700">
            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
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
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Business / Store Name *
            </label>
            <input
              {...register("businessName")}
              placeholder="e.g. Acme Superstore"
              className={`w-full px-4 py-2.5 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                errors.businessName
                  ? "border-red-400 bg-red-50"
                  : "border-slate-300 bg-white"
              }`}
            />
            {errors.businessName && (
              <p className="mt-1 text-xs text-red-600">{errors.businessName.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Business Description *
            </label>
            <textarea
              {...register("description")}
              rows={4}
              placeholder="What kind of products do you sell? Tell us about your catalog, target audience, and experience."
              className={`w-full px-4 py-2.5 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none ${
                errors.description
                  ? "border-red-400 bg-red-50"
                  : "border-slate-300 bg-white"
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Logo URL */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Logo or Banner Image URL <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              {...register("logoUrl")}
              type="url"
              placeholder="https://example.com/logo.png"
              className={`w-full px-4 py-2.5 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                errors.logoUrl
                  ? "border-red-400 bg-red-50"
                  : "border-slate-300 bg-white"
              }`}
            />
            {errors.logoUrl && (
              <p className="mt-1 text-xs text-red-600">{errors.logoUrl.message}</p>
            )}
          </div>

          {/* Server Error */}
          {serverError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
              {serverError}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-[#febd69] hover:bg-[#f3a847] disabled:opacity-60 text-slate-900 font-bold py-3.5 rounded-lg text-sm transition-colors shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Submitting Application…
              </>
            ) : user.vendorStatus === "rejected" ? (
              "Re-submit Application"
            ) : (
              "Submit Vendor Application"
            )}
          </button>
        </form>

        <p className="text-xs text-slate-400 text-center mt-4">
          By applying, you agree to ShopForge&apos;s Seller Terms of Service. Applications are typically processed within 24–48 hours.
        </p>
      </div>
    </div>
  );
}

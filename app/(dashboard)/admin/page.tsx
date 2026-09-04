"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { vendorService } from "@/lib/api/vendor";
import { categoryService } from "@/lib/api/category";
import { productService } from "@/lib/api/product";
import type { VendorApplication } from "@/types";
import Link from "next/link";
import {
  Users,
  Clock,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  FolderTree,
} from "lucide-react";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<{
    pending: number;
    approved: number;
    total: number;
    categories: number;
    products: number;
  }>({ pending: 0, approved: 0, total: 0, categories: 0, products: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && user?.role !== "admin") {
      router.push("/user");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === "admin") {
      Promise.allSettled([
        vendorService.getApplications(1, 100),
        categoryService.getAll(),
        productService.getProductCount(),
      ])
        .then(([appRes, catRes, prodRes]) => {
          let pending = 0;
          let approved = 0;
          let total = 0;
          let categories = 0;
          let products = 0;

          if (appRes.status === "fulfilled") {
            const apps: VendorApplication[] = appRes.value?.data?.applications ?? [];
            pending = apps.filter((a) => a.status === "pending").length;
            approved = apps.filter((a) => a.status === "approved").length;
            total = appRes.value?.data?.pagination?.total ?? apps.length;
          }

          if (catRes.status === "fulfilled") {
            categories = catRes.value?.length ?? 0;
          }

          if (prodRes.status === "fulfilled") {
            products = prodRes.value ?? 0;
          }

          setStats({ pending, approved, total, categories, products });
        })
        .catch((err) => {
          console.error("Failed to load admin stats:", err);
        })
        .finally(() => {
          setLoadingStats(false);
        });
    }
  }, [user]);

  if (loading || !user) return null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Welcome */}
      <div className="bg-[#131921] border border-[#232f3e] rounded-2xl p-6 lg:p-8 text-white shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#febd69] text-slate-900 flex items-center justify-center flex-shrink-0 font-black shadow-sm">
            <ShieldCheck size={30} className="text-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight">Admin Dashboard</h2>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                Platform Admin
              </span>
            </div>
            <p className="text-slate-300 text-sm">
              Welcome back, {user.name} ({user.email}). Manage platform vendors, product categories, and applications.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={16} className="text-amber-500" />
            <p className="text-sm font-medium text-slate-500">Pending Applications</p>
          </div>
          <p className="text-3xl font-bold text-amber-600 mt-1">
            {loadingStats ? "..." : stats.pending}
          </p>
          <p className="text-xs text-slate-400 mt-1">Awaiting your approval</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={16} className="text-emerald-500" />
            <p className="text-sm font-medium text-slate-500">Active Vendors</p>
          </div>
          <p className="text-3xl font-bold text-emerald-600 mt-1">
            {loadingStats ? "..." : stats.approved}
          </p>
          <p className="text-xs text-slate-400 mt-1">Approved seller accounts</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <FolderTree size={16} className="text-indigo-500" />
            <p className="text-sm font-medium text-slate-500">Categories</p>
          </div>
          <p className="text-3xl font-bold text-indigo-600 mt-1">
            {loadingStats ? "..." : stats.categories}
          </p>
          <p className="text-xs text-slate-400 mt-1">Product classifications</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag size={16} className="text-purple-500" />
            <p className="text-sm font-medium text-slate-500">Total Products</p>
          </div>
          <p className="text-3xl font-bold text-purple-600 mt-1">
            {loadingStats ? "..." : stats.products}
          </p>
          <p className="text-xs text-slate-400 mt-1">Listed in catalog</p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="font-semibold text-slate-700 mb-4">Management Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/admin/applications"
            className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition-all group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                <Users size={22} />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm group-hover:text-amber-600 transition-colors">
                  Vendor Applications
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {stats.pending} pending review
                </p>
              </div>
            </div>
            <ArrowRight size={18} className="text-slate-400 group-hover:text-amber-600 transition-colors" />
          </Link>

          <Link
            href="/admin/categories"
            className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                <FolderTree size={22} />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">
                  Categories
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Create and manage catalog tags
                </p>
              </div>
            </div>
            <ArrowRight size={18} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </Link>

          <Link
            href="/admin/products"
            className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-purple-400 hover:bg-purple-50/50 transition-all group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                <ShoppingBag size={22} />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm group-hover:text-purple-600 transition-colors">
                  All Products
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inspect full product catalog
                </p>
              </div>
            </div>
            <ArrowRight size={18} className="text-slate-400 group-hover:text-purple-600 transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}

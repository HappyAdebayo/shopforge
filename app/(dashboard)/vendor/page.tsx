"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Globe,
  CheckCircle,
  Package,
  Plus,
  ArrowRight,
  ShoppingBag,
  Store,
} from "lucide-react";
import { productService } from "@/lib/api/product";

export default function VendorDashboardPage() {
  const { user } = useAuth();
  const [productCount, setProductCount] = useState<number>(0);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    productService
      .getMyProducts({ page: 1, limit: 1 })
      .then((res) => {
        setProductCount(res?.pagination?.totalItems ?? res?.products?.length ?? 0);
      })
      .catch((err) => console.error("Could not load vendor products count:", err))
      .finally(() => setLoadingProducts(false));
  }, []);

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Banner */}
      <div className="bg-[#131921] border border-[#232f3e] rounded-2xl p-6 lg:p-8 text-white shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#febd69] text-slate-900 flex items-center justify-center flex-shrink-0 font-black shadow-sm">
            <Building2 size={30} className="text-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight">Vendor Dashboard</h2>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400/20 text-[#febd69] border border-amber-400/30">
                Verified Store
              </span>
            </div>
            <p className="text-slate-300 text-sm">
              Welcome back, {user.name} — your store is active and live on ShopForge
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Package size={16} className="text-amber-500" />
            <p className="text-sm font-medium text-slate-500">Products Listed</p>
          </div>
          <p className="text-3xl font-bold text-amber-600">
            {loadingProducts ? "..." : productCount}
          </p>
          <p className="text-xs text-slate-400 mt-1">Active in your catalog</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Globe size={16} className="text-indigo-500" />
            <p className="text-sm font-medium text-slate-500">Store Status</p>
          </div>
          <p className="text-3xl font-bold text-emerald-600">Active</p>
          <p className="text-xs text-slate-400 mt-1">Visible to all marketplace shoppers</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={16} className="text-emerald-500" />
            <p className="text-sm font-medium text-slate-500">Admin Approval</p>
          </div>
          <p className="text-3xl font-bold text-emerald-600">Verified</p>
          <p className="text-xs text-slate-400 mt-1">Vendor credentials verified</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="font-semibold text-slate-700 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/vendor/products/new"
            className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Plus size={20} />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm group-hover:text-amber-600 transition-colors">
                  Add Product
                </p>
                <p className="text-xs text-slate-400">List a new item</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-slate-400 group-hover:text-amber-600 transition-colors" />
          </Link>

          <Link
            href="/vendor/products"
            className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <Package size={20} />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">
                  My Inventory
                </p>
                <p className="text-xs text-slate-400">Manage listings</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </Link>

          <Link
            href="/"
            className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <ShoppingBag size={20} />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm group-hover:text-amber-700 transition-colors">
                  Storefront
                </p>
                <p className="text-xs text-slate-400">Browse public store</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-slate-400 group-hover:text-amber-700 transition-colors" />
          </Link>
        </div>
      </div>

      {/* Vendor Profile Info */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Store size={16} className="text-slate-400" />
          Store Profile
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs text-slate-400 mb-1">Account Email</p>
            <p className="text-sm font-medium text-slate-700 truncate">{user.email}</p>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs text-slate-400 mb-1">Vendor Status</p>
            <div className="flex items-center gap-1.5">
              <CheckCircle size={14} className="text-emerald-500" />
              <p className="text-sm font-medium text-emerald-600 capitalize">
                {user.vendorStatus}
              </p>
            </div>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs text-slate-400 mb-1">Account Role</p>
            <p className="text-sm font-medium text-slate-700 capitalize">
              {user.role}
            </p>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs text-slate-400 mb-1">Vendor ID</p>
            <p className="text-sm font-medium text-slate-700">#{user.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

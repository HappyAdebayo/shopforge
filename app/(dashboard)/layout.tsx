"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";

const titleMap: Record<string, string> = {
  "/admin": "Admin Overview",
  "/admin/applications": "Vendor Applications",
  "/admin/categories": "Category Management",
  "/admin/products": "All Products",
  "/user": "My Dashboard",
  "/user/apply": "Become a Vendor",
  "/user/products": "Marketplace Catalog",
  "/vendor": "Store Overview",
  "/vendor/products": "My Products Inventory",
  "/vendor/products/new": "Add New Product",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Guard admin routes
  useEffect(() => {
    if (!loading && user) {
      if (pathname.startsWith("/admin") && user.role !== "admin") {
        router.push("/user");
      }
      if (pathname.startsWith("/vendor") && user.vendorStatus !== "approved" && user.role !== "admin") {
        router.push("/user");
      }
    }
  }, [user, loading, pathname, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  const title = titleMap[pathname] ?? "ShopForge";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          title={title}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

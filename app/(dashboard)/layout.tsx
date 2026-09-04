"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import { CallProvider } from "@/hooks/useCall";
import { NotificationProvider } from "@/hooks/useNotification";
import IncomingCallModal from "@/components/call/IncomingCallModal";
import ActiveCallModal from "@/components/call/ActiveCallModal";

const titleMap: Record<string, string> = {
  "/admin": "Admin Overview",
  "/admin/applications": "Vendor Applications",
  "/admin/categories": "Category Management",
  "/admin/products": "All Products",
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

  // Redirect unauthenticated users back to login, preserving destination
  useEffect(() => {
    if (!loading && !user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, loading, router, pathname]);

  // Guard dashboard routes - only admin and approved vendors are allowed
  useEffect(() => {
    if (!loading && user) {
      const isVendor = user.role === "vendor" || user.vendorStatus === "approved";
      const isAdmin = user.role === "admin";

      if (!isAdmin && !isVendor) {
        // Regular customers have no dashboard, redirect to storefront
        router.push("/");
        return;
      }

      if (pathname.startsWith("/admin") && !isAdmin) {
        router.push("/vendor");
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
    <NotificationProvider>
      <CallProvider>
        <div className="flex h-screen overflow-hidden bg-[#eaeded]">
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Header
              onMenuClick={() => setSidebarOpen(true)}
              title={title}
            />
            <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
          </div>
          {/* Real-time incoming & active call overlays */}
          <IncomingCallModal />
          <ActiveCallModal />
        </div>
      </CallProvider>
    </NotificationProvider>
  );
}

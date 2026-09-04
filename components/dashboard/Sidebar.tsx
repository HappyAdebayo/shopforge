"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Store,
  FolderTree,
  PlusCircle,
  ChevronRight,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
}

const navItems: NavItem[] = [
  // Admin Links
  {
    label: "Overview",
    href: "/admin",
    icon: <LayoutDashboard size={18} />,
    roles: ["admin"],
  },
  {
    label: "Applications",
    href: "/admin/applications",
    icon: <Users size={18} />,
    roles: ["admin"],
  },
  {
    label: "Categories",
    href: "/admin/categories",
    icon: <FolderTree size={18} />,
    roles: ["admin"],
  },
  {
    label: "All Products",
    href: "/admin/products",
    icon: <ShoppingBag size={18} />,
    roles: ["admin"],
  },

  // Vendor Links
  {
    label: "Store Overview",
    href: "/vendor",
    icon: <LayoutDashboard size={18} />,
    roles: ["vendor"],
  },
  {
    label: "My Products",
    href: "/vendor/products",
    icon: <ShoppingBag size={18} />,
    roles: ["vendor"],
  },
  {
    label: "Add Product",
    href: "/vendor/products/new",
    icon: <PlusCircle size={18} />,
    roles: ["vendor"],
  },

  // Shared Link to Storefront
  // {
  //   label: "Customer Storefront",
  //   href: "/",
  //   icon: <Store size={18} />,
  //   roles: ["admin", "vendor"],
  // },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuth();
  const pathname = usePathname();

  const effectiveRole =
    user?.role === "admin"
      ? "admin"
      : user?.vendorStatus === "approved"
      ? "vendor"
      : "user";

  const filtered = navItems.filter((item) =>
    item.roles.includes(effectiveRole)
  );

  return (
    <>
      {/* Backdrop (mobile) */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-[#131921] text-white z-30 flex flex-col border-r border-[#232f3e] transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:static lg:z-auto"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#232f3e]">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#febd69] rounded-lg flex items-center justify-center font-black text-slate-900 text-sm shadow-sm">
              SF
            </div>
            <span className="font-bold text-lg tracking-tight text-white flex items-center">
              ShopForge
              <span className="text-[#febd69] text-xs ml-0.5">.com</span>
            </span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Role badge */}
        <div className="px-6 py-3">
          <span
            className={cn(
              "text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md",
              effectiveRole === "admin" &&
                "bg-red-500/20 text-red-300 border border-red-500/30",
              effectiveRole === "vendor" &&
                "bg-amber-400/20 text-[#febd69] border border-amber-400/30",
              effectiveRole === "user" &&
                "bg-slate-700 text-slate-300 border border-slate-600"
            )}
          >
            {effectiveRole} panel
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {filtered.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" &&
                item.href !== "/user" &&
                item.href !== "/vendor" &&
                pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[#232f3e] text-[#febd69] font-bold border-l-4 border-[#febd69] shadow-sm"
                    : "text-slate-300 hover:bg-[#232f3e] hover:text-white"
                )}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight size={14} />}
              </Link>
            );
          })}
        </nav>

        {/* User info at bottom */}
        {user && (
          <div className="px-4 py-4 border-t border-[#232f3e] bg-[#0c1017]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#febd69] text-slate-900 flex items-center justify-center text-sm font-black uppercase">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

"use client";

import { Menu, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import NotificationDropdown from "./NotificationDropdown";

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
}

export default function Header({ onMenuClick, title }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-[#131921] border-b border-[#232f3e] flex items-center justify-between px-4 lg:px-6 text-white shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md text-slate-300 hover:bg-white/10 hover:text-white"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-bold text-white tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <NotificationDropdown />

        <div className="flex items-center gap-2 pl-3 border-l border-[#232f3e]">
          <div className="w-8 h-8 rounded-full bg-[#febd69] flex items-center justify-center text-slate-900 text-xs font-black uppercase shadow-sm">
            {user?.name?.charAt(0) ?? "U"}
          </div>
          <span className="hidden sm:block text-sm font-medium text-slate-200">
            {user?.name}
          </span>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-[#febd69] px-2.5 py-1.5 rounded-md hover:bg-white/10 transition-colors font-medium"
        >
          <LogOut size={16} />
          <span className="hidden sm:block">Logout</span>
        </button>
      </div>
    </header>
  );
}

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
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md text-slate-500 hover:bg-slate-100"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <NotificationDropdown />

        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold uppercase">
            {user?.name?.charAt(0) ?? "U"}
          </div>
          <span className="hidden sm:block text-sm font-medium text-slate-700">
            {user?.name}
          </span>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 px-2 py-1.5 rounded-md hover:bg-red-50 transition-colors"
        >
          <LogOut size={16} />
          <span className="hidden sm:block">Logout</span>
        </button>
      </div>
    </header>
  );
}

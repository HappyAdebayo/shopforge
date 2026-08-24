import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: ReactNode;
  color?: "indigo" | "green" | "amber" | "red" | "blue";
}

const colorMap = {
  indigo: {
    bg: "bg-indigo-50",
    icon: "bg-indigo-600 text-white",
    text: "text-indigo-700",
  },
  green: {
    bg: "bg-emerald-50",
    icon: "bg-emerald-600 text-white",
    text: "text-emerald-700",
  },
  amber: {
    bg: "bg-amber-50",
    icon: "bg-amber-500 text-white",
    text: "text-amber-700",
  },
  red: {
    bg: "bg-red-50",
    icon: "bg-red-600 text-white",
    text: "text-red-700",
  },
  blue: {
    bg: "bg-blue-50",
    icon: "bg-blue-600 text-white",
    text: "text-blue-700",
  },
};

export default function StatsCard({
  title,
  value,
  description,
  icon,
  color = "indigo",
}: StatsCardProps) {
  const colors = colorMap[color];

  return (
    <div
      className={cn(
        "rounded-2xl p-5 flex items-start gap-4 shadow-sm border border-slate-100",
        colors.bg
      )}
    >
      <div
        className={cn(
          "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
          colors.icon
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500 truncate">{title}</p>
        <p className={cn("text-2xl font-bold mt-0.5", colors.text)}>{value}</p>
        {description && (
          <p className="text-xs text-slate-400 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}

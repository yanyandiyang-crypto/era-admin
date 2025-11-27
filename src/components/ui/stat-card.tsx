import type { LucideIcon } from "lucide-react";
import { shadows } from "@/styles/theme";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "blue" | "red" | "green" | "amber" | "purple";
  onClick?: () => void;
  loading?: boolean;
}

const colorClasses = {
  blue: {
    bg: "bg-blue-500",
    lightBg: "bg-blue-50",
    text: "text-blue-600",
    gradient: "from-blue-500 to-blue-600",
  },
  red: {
    bg: "bg-red-500",
    lightBg: "bg-red-50",
    text: "text-red-600",
    gradient: "from-red-500 to-red-600",
  },
  green: {
    bg: "bg-green-500",
    lightBg: "bg-green-50",
    text: "text-green-600",
    gradient: "from-green-500 to-green-600",
  },
  amber: {
    bg: "bg-amber-500",
    lightBg: "bg-amber-50",
    text: "text-amber-600",
    gradient: "from-amber-500 to-amber-600",
  },
  purple: {
    bg: "bg-purple-500",
    lightBg: "bg-purple-50",
    text: "text-purple-600",
    gradient: "from-purple-500 to-purple-600",
  },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color = "blue",
  onClick,
  loading,
}: StatCardProps) {
  const colors = colorClasses[color];

  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden bg-white rounded-xl border border-gray-200
        transition-all duration-200
        ${onClick ? "cursor-pointer hover:shadow-lg hover:-translate-y-1" : ""}
        ${shadows.md}
      `}
    >
      {/* Background gradient decoration */}
      <div
        className={`absolute top-0 right-0 w-32 h-32 bg-linear-to-br ${colors.gradient} opacity-5 rounded-full -mr-16 -mt-16`}
      />

      <div className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            {loading ? (
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
            ) : (
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
                {trend && (
                  <span
                    className={`text-sm font-medium ${
                      trend.isPositive ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {trend.isPositive ? "+" : ""}
                    {trend.value}%
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Icon */}
          <div className={`p-3 rounded-lg ${colors.lightBg}`}>
            <Icon className={`h-6 w-6 ${colors.text}`} />
          </div>
        </div>

        {/* Progress bar (optional) */}
        {trend && (
          <div className="mt-4">
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${colors.bg} transition-all duration-500`}
                style={{ width: `${Math.min(Math.abs(trend.value), 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  alert?: {
    message: string;
    severity: "info" | "warning" | "error";
  };
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBgColor,
  iconColor,
  trend,
  alert,
}: MetricCardProps) {
  const alertColors = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    error: "bg-red-50 border-red-200 text-red-800",
  };

  return (
    <div className="group relative bg-linear-to-br from-white to-gray-50 rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-br from-transparent via-transparent to-gray-50/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
            <p className="text-4xl font-bold bg-linear-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent mt-3">{value}</p>
            {subtitle && (
              <p className="text-sm text-gray-600 mt-2 font-medium">{subtitle}</p>
            )}
          </div>
          <div className={`h-14 w-14 ${iconBgColor} rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`h-7 w-7 ${iconColor}`} />
          </div>
        </div>

        {trend && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${trend.isPositive ? 'bg-green-50' : 'bg-red-50'}`}>
              {trend.isPositive ? (
                <TrendingUp className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-red-600" />
              )}
              <span className={`text-xs font-bold ${trend.isPositive ? 'text-green-700' : 'text-red-700'}`}>
                {trend.value > 0 ? '+' : ''}{trend.value}%
              </span>
            </div>
            <span className="text-xs text-gray-500 font-medium">{trend.label}</span>
          </div>
        )}

        {alert && (
          <div className={`mt-3 p-3 rounded-lg border text-xs font-medium ${alertColors[alert.severity]} backdrop-blur-sm`}>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
              {alert.message}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

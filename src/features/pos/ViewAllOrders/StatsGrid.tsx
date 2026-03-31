import React from "react";
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  LucideIcon,
} from "lucide-react";

interface StatCardProps {
  bgColor?: string;
  iconColor?: string;
  borderColor?: string;
  gridColor?: string;
  icon?: LucideIcon;
  value?: string;
  label?: string;
  trendIcon?: LucideIcon;
  blurPosition?: { x: number; y: number };
}

const StatCard: React.FC<StatCardProps> = ({
  bgColor = "bg-green-50",
  iconColor = "bg-green-500",
  borderColor = "border-green-400",
  gridColor = "rgba(34, 197, 94, 0.4)",
  icon: Icon = Package,
  value = "0",
  label = "Label",
  trendIcon: TrendIcon = TrendingUp,
  blurPosition = { x: 70, y: 100 },
}) => {
  return (
    <div className={`${bgColor} rounded-lg p-6 relative overflow-hidden h-30`}>
      {/* Grid background with blur effect around number */}
      <div className="absolute inset-0">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
            radial-gradient(circle at 0px 0px, ${gridColor} 2px, transparent 2px),
            linear-gradient(${gridColor.replace(
              "0.4",
              "0.15",
            )} 1px, transparent 1px),
            linear-gradient(90deg, ${gridColor.replace(
              "0.4",
              "0.15",
            )} 1px, transparent 1px)
          `,
            backgroundSize: "24px 24px",
            mask: `radial-gradient(circle at ${blurPosition.x}px ${blurPosition.y}px, transparent 50px, rgba(0,0,0,0.2) 80px, rgba(0,0,0,0.6) 120px)`,
            WebkitMask: `radial-gradient(circle at ${blurPosition.x}px ${blurPosition.y}px, transparent 50px, rgba(0,0,0,0.2) 80px, rgba(0,0,0,0.6) 120px)`,
          }}
        ></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 h-full flex flex-col justify-between">
        <div className="flex items-center gap-3 mb-3">
          <div className={`${iconColor} p-2 rounded-md`}>
            <Icon className="size-5 text-white" />
          </div>
          <span className="text-3xl font-bold text-gray-800">{value}</span>
        </div>

        {/* Label */}
        <p className="text-gray-600 text-base font-medium mt-auto">{label}</p>

        {/* Trend indicator in top right */}
        <div className="absolute top-0 right-0">
          <div
            className={`w-10 h-10 rounded-full border-2 ${borderColor} flex items-center justify-center`}
          >
            <TrendIcon
              className={`w-5 h-5 ${iconColor.replace("bg-", "text-")}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatData {
  bgColor?: string;
  iconColor?: string;
  borderColor?: string;
  gridColor?: string;
  icon?: LucideIcon;
  value?: string;
  label?: string;
  trendIcon?: LucideIcon;
  blurPosition?: { x: number; y: number };
}

interface StatsGridProps {
  stats?: StatData[];
  columns?: 1 | 2 | 3 | 4 | 5;
}

const StatsGrid: React.FC<StatsGridProps> = ({ stats, columns = 5 }) => {
  const defaultStatsData: StatData[] = [
    {
      bgColor: "bg-green-50",
      iconColor: "bg-green-500",
      borderColor: "border-green-400",
      gridColor: "rgba(34, 197, 94, 0.4)",
      icon: Package,
      value: "150",
      label: "Total No of Items",
      trendIcon: TrendingUp,
    },
    {
      bgColor: "bg-yellow-50",
      iconColor: "bg-yellow-500",
      borderColor: "border-yellow-400",
      gridColor: "rgba(234, 179, 8, 0.4)",
      icon: Package,
      value: "23",
      label: "Total Expiring Items",
      trendIcon: TrendingUp,
    },
    {
      bgColor: "bg-red-50",
      iconColor: "bg-red-500",
      borderColor: "border-red-400",
      gridColor: "rgba(239, 68, 68, 0.4)",
      icon: Package,
      value: "10",
      label: "Total Expired Items",
      trendIcon: TrendingUp,
    },
    {
      bgColor: "bg-purple-50",
      iconColor: "bg-purple-500",
      borderColor: "border-purple-400",
      gridColor: "rgba(168, 85, 247, 0.4)",
      icon: Package,
      value: "100",
      label: "Low In-stock Items",
      trendIcon: AlertTriangle,
    },
    {
      bgColor: "bg-gray-50",
      iconColor: "bg-gray-500",
      borderColor: "border-gray-400",
      gridColor: "rgba(107, 114, 128, 0.4)",
      icon: Package,
      value: "23",
      label: "Out of Stock Items",
      trendIcon: TrendingDown,
    },
  ];

  const statsData = stats || defaultStatsData;

  const gridColsClass = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
  }[columns];

  return (
    <div className={`grid ${gridColsClass} gap-4 mb-6 flex-shrink-0`}>
      {statsData.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export { StatCard, StatsGrid };
export default StatsGrid;

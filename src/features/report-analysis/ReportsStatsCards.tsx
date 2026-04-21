type StatsCardProp = {
  label: string;
  value: string;
  bgColor: string;
  iconColor: string;
  image: string;
};
type StatsCardsProps = {
  reportsStats: StatsCardProp[];
};
const ReportsStatsCards = ({ reportsStats }: StatsCardsProps) => {
  return (
    <div className="grid grid-cols-4 gap-4">
      {reportsStats.map((stats, index) => (
        <div
          key={index}
          className="relative p-6 px-3 rounded-xl overflow-hidden"
          style={{ backgroundColor: stats.bgColor }}
        >
          {/* Gradient highlight */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle_at_80%_50%, ${stats.iconColor} 0%, transparent 65%)`,
            }}
          />

          {/* Grid pattern */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage: `
                      linear-gradient(to right, ${stats.iconColor} 1px, transparent 1px),
                      linear-gradient(to bottom, ${stats.iconColor} 1px, transparent 1px)
                    `,
              backgroundSize: "36px 36px",
            }}
          />

          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center justify-center gap-3">
                {/* Icon container */}
                <div
                  className="size-10 rounded-sm flex justify-center items-center p-2"
                  style={{ background: stats.iconColor }}
                >
                  <img
                    src={stats.image}
                    className="size-9"
                    alt="Customer icon"
                  />
                </div>

                <span className="text-4xl sm:text-3xl font-bold text-[#1C1B20]">
                  {stats.value}
                </span>
              </div>
            </div>

            <p className="text-base sm:text-lg text-gray-900">{stats.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReportsStatsCards;

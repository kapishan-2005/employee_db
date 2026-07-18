/**
 * WorkforceGrowthChart Component
 * 
 * Displays employee growth over the last 6 months as a line chart
 */

import { TrendingUp } from 'lucide-react';

const WorkforceGrowthChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-indigo-300" />
          Workforce Growth
        </h3>
        <div className="text-center py-12 text-white/40 text-sm">
          No workforce growth data available yet.
        </div>
      </div>
    );
  }

  // Calculate max value for scaling
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const chartHeight = 200;

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
      <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
        <TrendingUp size={18} className="text-indigo-300" />
        Workforce Growth (Last 6 Months)
      </h3>

      <div className="relative" style={{ height: chartHeight + 60 }}>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-12 flex flex-col justify-between text-xs text-white/40 w-8">
          <span>{maxCount}</span>
          <span>{Math.floor(maxCount / 2)}</span>
          <span>0</span>
        </div>

        {/* Chart area */}
        <div className="ml-10 relative" style={{ height: chartHeight }}>
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="border-t border-white/5" />
            ))}
          </div>

          {/* Line chart */}
          <svg
            className="absolute inset-0 w-full h-full overflow-visible"
            viewBox={`0 0 100 ${chartHeight}`}
            preserveAspectRatio="none"
          >
            {/* Area fill */}
            <defs>
              <linearGradient id="growthGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Area path */}
            {data.length > 0 && (
              <path
                d={`
                  M 0 ${chartHeight}
                  ${data.map((item, i) => {
                    const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 50;
                    const y = chartHeight - (item.count / maxCount) * chartHeight;
                    return `L ${x} ${y}`;
                  }).join(' ')}
                  L 100 ${chartHeight}
                  Z
                `}
                fill="url(#growthGradient)"
                vectorEffect="non-scaling-stroke"
              />
            )}

            {/* Line path */}
            {data.length > 0 && (
              <path
                d={data.map((item, i) => {
                  const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 50;
                  const y = chartHeight - (item.count / maxCount) * chartHeight;
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ')}
                fill="none"
                stroke="rgb(99, 102, 241)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            )}

            {/* Data points */}
            {data.map((item, i) => {
              const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 50;
              const y = chartHeight - (item.count / maxCount) * chartHeight;
              return (
                <g key={i}>
                  <circle
                    cx={x}
                    cy={y}
                    r="1.5"
                    fill="rgb(99, 102, 241)"
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r="3"
                    fill="rgb(99, 102, 241)"
                    fillOpacity="0.2"
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* X-axis labels */}
        <div className="ml-10 mt-3 flex justify-between text-xs text-white/40">
          {data.map((item, i) => (
            <span key={i} className="text-center" style={{ width: `${100 / data.length}%` }}>
              {item.label}
            </span>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
        <div>
          <p className="text-xs text-white/40 mb-1">Total Hired (6 months)</p>
          <p className="text-xl font-bold text-white">
            {data.reduce((sum, item) => sum + item.count, 0)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/40 mb-1">Current Month</p>
          <p className="text-xl font-bold text-indigo-300">
            {data[data.length - 1]?.count || 0}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WorkforceGrowthChart;

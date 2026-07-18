/**
 * DepartmentDistributionChart Component
 * 
 * Displays employee distribution across departments as a bar chart
 */

import { Building2 } from 'lucide-react';

const DepartmentDistributionChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Building2 size={18} className="text-violet-300" />
          Department Distribution
        </h3>
        <div className="text-center py-12 text-white/40 text-sm">
          No departments created yet.
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d.employeeCount), 1);
  const totalEmployees = data.reduce((sum, d) => sum + d.employeeCount, 0);

  // Color palette for bars
  const colors = [
    'rgb(99, 102, 241)',    // indigo
    'rgb(139, 92, 246)',    // violet
    'rgb(236, 72, 153)',    // pink
    'rgb(34, 197, 94)',     // emerald
    'rgb(251, 146, 60)',    // orange
    'rgb(14, 165, 233)',    // sky
  ];

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
      <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
        <Building2 size={18} className="text-violet-300" />
        Department Distribution
      </h3>

      <div className="space-y-4">
        {data.map((dept, index) => {
          const percentage = maxCount > 0 ? (dept.employeeCount / maxCount) * 100 : 0;
          const employeePercentage = totalEmployees > 0 
            ? Math.round((dept.employeeCount / totalEmployees) * 100) 
            : 0;
          const color = colors[index % colors.length];

          return (
            <div key={dept.departmentId}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/90 font-medium">
                  {dept.departmentName}
                </span>
                <span className="text-xs text-white/60">
                  {dept.employeeCount} {dept.employeeCount === 1 ? 'employee' : 'employees'} ({employeePercentage}%)
                </span>
              </div>

              {/* Bar */}
              <div className="h-8 bg-white/5 rounded-lg overflow-hidden relative">
                <div
                  className="h-full rounded-lg transition-all duration-500 ease-out flex items-center justify-end px-3"
                  style={{
                    width: `${percentage}%`,
                    background: `linear-gradient(90deg, ${color}, ${color}dd)`,
                  }}
                >
                  {dept.employeeCount > 0 && (
                    <span className="text-xs font-bold text-white">
                      {dept.employeeCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
        <div>
          <p className="text-xs text-white/40 mb-1">Total Departments</p>
          <p className="text-xl font-bold text-white">{data.length}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/40 mb-1">Total Employees</p>
          <p className="text-xl font-bold text-violet-300">{totalEmployees}</p>
        </div>
      </div>
    </div>
  );
};

export default DepartmentDistributionChart;

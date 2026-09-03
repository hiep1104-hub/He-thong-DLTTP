import React from 'react';
import { Customer, StaffKPIRecord, Task, User } from '../../types';
import { Award, CheckCircle2, Clock, AlertTriangle, UserCheck, TrendingUp, ShieldAlert, BarChart2, Lock } from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import { PermissionService } from '../../utils/permissions';

interface KPIStaffViewProps {
  staffKPIs: StaffKPIRecord[];
  users: User[];
  tasks: Task[];
  currentUser?: User;
}

export const KPIStaffView: React.FC<KPIStaffViewProps> = ({
  staffKPIs,
  users,
  tasks,
  currentUser,
}) => {
  const canViewAllKPIs = PermissionService.canViewAllKPIs(currentUser);
  const visibleKPIs = canViewAllKPIs || !currentUser 
    ? staffKPIs 
    : staffKPIs.filter(k => k.staffId === currentUser.id);

  // Sort staff by composite score
  const sortedKPIs = [...visibleKPIs].sort((a, b) => b.compositeKPIScore - a.compositeKPIScore);

  const totalAssignedAll = visibleKPIs.reduce((s, k) => s + k.totalAssigned, 0);
  const totalCompletedAll = visibleKPIs.reduce((s, k) => s + k.completedCount, 0);
  const totalOverdueAll = visibleKPIs.reduce((s, k) => s + k.overdueCount, 0);
  const avgCompletionRate = totalAssignedAll > 0 ? Math.round((totalCompletedAll / totalAssignedAll) * 100) : 0;

  return (
    <div className="space-y-6 pb-8">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-amber-500" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Đánh Giá Năng Suất, Tiến Độ & Điểm KPI Nhân Sự
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tính toán tự động theo: Khối lượng công việc giao • Tỷ lệ hoàn thành • Tỷ lệ đúng hạn • Điểm trừ trễ hạn
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-bold border border-blue-200">
            Kỳ đánh giá: Tháng 08/2026
          </span>
        </div>
      </div>

      {/* Summary KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Tổng Công Việc Phân Bổ</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalAssignedAll} việc</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Phân bổ cho {staffKPIs.length} nhân sự</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Tổng Đã Hoàn Thành</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{totalCompletedAll} việc</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">Tỷ lệ chung: {avgCompletionRate}%</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Công Việc Quá Hạn</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{totalOverdueAll} việc</div>
          <div className="text-[11px] text-red-700 font-medium mt-0.5">Bị trừ điểm KPI</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Điểm KPI Bình Quân</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {Math.round(staffKPIs.reduce((s, k) => s + k.compositeKPIScore, 0) / (staffKPIs.length || 1))}/100
          </div>
          <div className="text-[11px] text-blue-700 font-medium mt-0.5">Hiệu suất ổn định</div>
        </div>
      </div>

      {/* Staff Ranking & Detailed Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800 dark:text-slate-200">
            Bảng Xếp Hạng & Báo Cáo Hiệu Suất Từng Nhân Viên
          </span>
          <span className="text-slate-400">Dữ liệu tính toán thời gian thực</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Hạng</th>
                <th className="py-3 px-4 min-w-[200px]">Nhân viên & Vị trí</th>
                <th className="py-3 px-4 w-32 text-center">Tải việc (Giao)</th>
                <th className="py-3 px-4 w-32 text-center">Đã hoàn thành</th>
                <th className="py-3 px-4 w-32 text-center">Quá hạn</th>
                <th className="py-3 px-4 w-36 text-center">Tỷ lệ đúng hạn</th>
                <th className="py-3 px-4 w-36 text-right">Điểm KPI Tổng Hợp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedKPIs.map((kpi, idx) => (
                <tr key={kpi.userId} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3.5 px-4 text-center font-bold">
                    <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs ${
                      idx === 0 ? 'bg-amber-100 text-amber-800 font-extrabold ring-1 ring-amber-400' :
                      idx === 1 ? 'bg-slate-200 text-slate-800 font-bold' :
                      idx === 2 ? 'bg-orange-100 text-orange-800 font-bold' :
                      'text-slate-500'
                    }`}>
                      {idx + 1}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 dark:text-white">{kpi.userName}</div>
                    <div className="text-[11px] text-slate-400">{kpi.position}</div>
                  </td>

                  <td className="py-3.5 px-4 text-center font-semibold text-slate-800 dark:text-slate-200">
                    {kpi.totalAssigned} việc
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span className="font-bold text-emerald-600">{kpi.completedCount}</span>
                    <span className="text-[11px] text-slate-400"> ({kpi.completionRate}%)</span>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    {kpi.overdueCount > 0 ? (
                      <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold">
                        {kpi.overdueCount} việc
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-medium">0</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-center font-bold text-indigo-600 dark:text-indigo-400">
                    {kpi.onTimeRate}%
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <span className={`text-base font-extrabold ${
                      kpi.compositeKPIScore >= 85 ? 'text-emerald-600' :
                      kpi.compositeKPIScore >= 70 ? 'text-blue-600' : 'text-amber-600'
                    }`}>
                      {kpi.compositeKPIScore}
                    </span>
                    <span className="text-xs text-slate-400">/100</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

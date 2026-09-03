import React from 'react';
import { Task } from '../../types';
import { Calendar, CheckCircle2, Clock, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

interface TaxObligationMiniRadarProps {
  tasks: Task[];
  onNavigateToTasks: (preset?: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const TaxObligationMiniRadar: React.FC<TaxObligationMiniRadarProps> = ({
  tasks,
  onNavigateToTasks,
  onNavigateToTab,
}) => {
  const vatTasks = tasks.filter(t => t.taxType === 'GTGT');
  const pitTasks = tasks.filter(t => t.taxType === 'TNCN');
  const citTasks = tasks.filter(t => t.taxType === 'TNDN_TAM_TINH');
  const insTasks = tasks.filter(t => t.taxType === 'BHXH');
  const bctcTasks = tasks.filter(t => t.taxType === 'BCTC');

  const getTaxStatus = (list: Task[], deadlineText: string, taxName: string) => {
    const total = list.length;
    const completed = list.filter(t => t.status === 'HOAN_THANH').length;
    const pending = total - completed;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 100;
    
    return {
      taxName,
      deadlineText,
      total,
      completed,
      pending,
      percent,
    };
  };

  const taxRows = [
    getTaxStatus(vatTasks, '20/08/2026', 'Tờ khai Thuế GTGT (Tháng 7)'),
    getTaxStatus(pitTasks, '20/08/2026', 'Tờ khai Thuế TNCN (Tháng 7)'),
    getTaxStatus(citTasks, '30/10/2026', 'Tạm tính Thuế TNDN (Quý 3)'),
    getTaxStatus(insTasks, '25/08/2026', 'Báo cáo trích nộp BHXH (Mẫu D02-LT)'),
    getTaxStatus(bctcTasks, '30/03/2027', 'Báo Cáo Tài Chính Năm'),
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Lịch Thuế & Deadline Nghĩa Vụ
          </h2>
        </div>
        {onNavigateToTab && (
          <button
            type="button"
            onClick={() => onNavigateToTab('TASKS_TAX')}
            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center space-x-0.5"
          >
            <span>Lịch chi tiết</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="space-y-3 text-xs">
        {taxRows.slice(0, 4).map((row, idx) => (
          <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850/70 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white truncate">{row.taxName}</span>
              <span className="text-[11px] font-mono font-bold text-orange-600 dark:text-orange-400 shrink-0">
                Hạn: {row.deadlineText}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    row.percent === 100 ? 'bg-emerald-500' :
                    row.percent > 50 ? 'bg-blue-600' : 'bg-orange-500'
                  }`}
                  style={{ width: `${row.percent}%` }}
                />
              </div>
              <span className="text-[10px] font-bold font-mono text-slate-600 dark:text-slate-300 shrink-0">
                {row.completed}/{row.total} ({row.percent}%)
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-1">
        <button
          type="button"
          onClick={() => onNavigateToTasks('TAX_OBLIGATION')}
          className="w-full py-2 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
        >
          Lọc toàn bộ tờ khai thuế đến hạn &rarr;
        </button>
      </div>
    </div>
  );
};

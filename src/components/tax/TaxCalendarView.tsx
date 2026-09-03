import React, { useState } from 'react';
import { Customer, Task } from '../../types';
import { 
  CalendarRange
} from 'lucide-react';
import { CURRENT_SYSTEM_DATE } from '../../services/storageService';
import { formatDate, STATUS_LABELS } from '../../utils/formatters';

interface TaxCalendarViewProps {
  tasks: Task[];
  customers: Customer[];
  onSelectTask: (task: Task) => void;
}

export const TaxCalendarView: React.FC<TaxCalendarViewProps> = ({
  tasks,
  customers,
  onSelectTask,
}) => {
  const [selectedMonth] = useState<string>('2026-08');

  // Filter tasks in current month
  const monthTasks = tasks.filter(t => t.dueDate.startsWith(selectedMonth));

  // Group tasks by due date
  const tasksByDate = monthTasks.reduce((acc, task) => {
    if (!acc[task.dueDate]) acc[task.dueDate] = [];
    acc[task.dueDate].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <div className="space-y-6 pb-8">
      
      {/* Calendar Header */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <CalendarRange className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Lịch Hạn Nộp Thuế & Deadline
            </h2>
            <p className="text-xs text-slate-500">
              Hạn nộp tờ khai GTGT, TNCN, TNDN và nghĩa vụ cơ quan thuế
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Tháng <span className="font-mono text-sm text-blue-600">08/2026</span>
          </div>
        </div>
      </div>

      {/* Daily Tax Tasks Schedule */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            Danh Mục Công Việc Theo Từng Ngày Trong Tháng 08/2026 ({monthTasks.length} việc)
          </span>
          <span className="text-xs text-blue-600 font-semibold">
            Ngày hôm nay: {formatDate(CURRENT_SYSTEM_DATE)}
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {Object.keys(tasksByDate).sort().map((date) => {
            const dateTasks = tasksByDate[date];
            const isToday = date === CURRENT_SYSTEM_DATE;
            const isOverdue = date < CURRENT_SYSTEM_DATE && dateTasks.some(t => t.status !== 'HOAN_THANH');

            return (
              <div
                key={date}
                className={`p-4 sm:p-5 transition-colors ${
                  isToday
                    ? 'bg-blue-50/40 dark:bg-blue-950/20 border-l-4 border-blue-600'
                    : isOverdue
                    ? 'bg-red-50/30 dark:bg-red-950/10'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-850/50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-extrabold ${isToday ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>
                      {formatDate(date)}
                    </span>
                    {isToday && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold">
                        HÔM NAY
                      </span>
                    )}
                    {isOverdue && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-600 text-white font-bold">
                        CÓ VIỆC TRỄ HẠN
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {dateTasks.length} công việc cần hoàn thành
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {dateTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 cursor-pointer shadow-xs transition-all text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{task.code}</span>
                        <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold border ${STATUS_LABELS[task.status]?.bg} ${STATUS_LABELS[task.status]?.text}`}>
                          {STATUS_LABELS[task.status]?.label}
                        </span>
                      </div>
                      <div className="font-bold text-slate-900 dark:text-white mt-1 leading-snug">
                        {task.title}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 dark:border-slate-750">
                        <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                          {task.customerName || 'Nội bộ'}
                        </span>
                        <span>Phụ trách: <strong>{task.assigneeName}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

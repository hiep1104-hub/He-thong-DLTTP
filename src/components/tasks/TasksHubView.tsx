import React, { useState } from 'react';
import { Customer, Task, User, ChecklistTemplate, AdHocServiceItem } from '../../types';
import { TaskList } from './TaskList';
import { TaskKanban } from './TaskKanban';
import { TaxCalendarView } from '../tax/TaxCalendarView';
import { TemplatesView } from '../templates/TemplatesView';
import { AutoDispatchPeriodicModal } from '../templates/AutoDispatchPeriodicModal';
import { WeeklyTaskReportModal } from './WeeklyTaskReportModal';
import { 
  CheckSquare, 
  Kanban, 
  CalendarRange, 
  Plus, 
  AlertTriangle,
  Zap,
  Layers,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';

interface TasksHubViewProps {
  tasks: Task[];
  customers: Customer[];
  users: User[];
  templates: ChecklistTemplate[];
  currentUser: User;
  onSelectTask: (task: Task) => void;
  onSelectCustomer?: (customer: Customer) => void;
  onOpenCreateTaskForCustomer?: (customer: Customer) => void;
  onOpenCreateTask: () => void;
  onSelectTemplateToCreateTask: (template: ChecklistTemplate) => void;
  onSelectAdHocServiceToCreateTask: (service: AdHocServiceItem) => void;
  filterPreset?: string;
  onClearFilterPreset?: () => void;
  onDataReload?: () => void;
}

export type TasksSubTab = 'LIST' | 'KANBAN' | 'CALENDAR' | 'TEMPLATES';

export const TasksHubView: React.FC<TasksHubViewProps> = ({
  tasks,
  customers,
  users,
  templates,
  currentUser,
  onSelectTask,
  onSelectCustomer,
  onOpenCreateTaskForCustomer,
  onOpenCreateTask,
  onSelectTemplateToCreateTask,
  onSelectAdHocServiceToCreateTask,
  filterPreset,
  onClearFilterPreset,
  onDataReload,
}) => {
  const [subTab, setSubTab] = useState<TasksSubTab>('LIST');
  const [isAutoDispatchModalOpen, setIsAutoDispatchModalOpen] = useState(false);
  const [isWeeklyReportModalOpen, setIsWeeklyReportModalOpen] = useState(false);

  const urgentCount = tasks.filter(t => {
    return t.priority === 'KHAN_CAP' || t.status === 'QUA_HAN' || t.riskLevel === 'RUI_RO_THUE_PHAP_LY';
  }).length;

  const packageCustomersCount = customers.filter(c => c.contractStatus !== 'DA_HUY').length;

  return (
    <div className="space-y-4">
      {/* Sub Header & Switcher Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2.5 sm:p-3 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        {/* Left: Sub-Tabs */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-850 p-1 rounded-xl overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSubTab('LIST')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              subTab === 'LIST'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            <span>Danh sách</span>
            <span className="text-[10px] bg-slate-200 dark:bg-slate-600 px-1.5 py-0.2 rounded-full font-mono">
              {tasks.length}
            </span>
          </button>

          <button
            onClick={() => setSubTab('KANBAN')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              subTab === 'KANBAN'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Kanban className="h-3.5 w-3.5" />
            <span>Bảng Kanban</span>
          </button>

          <button
            onClick={() => setSubTab('CALENDAR')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              subTab === 'CALENDAR'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CalendarRange className="h-3.5 w-3.5" />
            <span>Lịch hạn nộp</span>
          </button>

          <button
            onClick={() => setSubTab('TEMPLATES')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              subTab === 'TEMPLATES'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-indigo-500" />
            <span>Quy trình mẫu & Gói</span>
          </button>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center space-x-2 flex-wrap">
          {/* Weekly Report Button Chuẩn Nghị Định 30 */}
          <button
            type="button"
            onClick={() => setIsWeeklyReportModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all shadow-xs shrink-0 cursor-pointer"
            title="Xuất báo cáo định kỳ tuần (.doc) chuẩn Nghị định 30 gửi Ban Giám Đốc"
          >
            <FileText className="h-3.5 w-3.5 text-blue-600" />
            <span>Báo cáo tuần (.doc)</span>
          </button>

          {/* Special Auto-Dispatch Periodic Button */}
          <button
            type="button"
            onClick={() => setIsAutoDispatchModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/25 hover:bg-amber-500/20 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
            title="Xem trước, đối soát hoặc chủ động phát sinh việc định kỳ theo Gói dịch vụ"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Đối soát gói</span>
          </button>

          <button
            onClick={onOpenCreateTask}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Giao việc mới</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab Contents */}
      {subTab === 'LIST' && (
        <TaskList
          tasks={tasks}
          customers={customers}
          users={users}
          currentUser={currentUser}
          onSelectTask={onSelectTask}
          onSelectCustomer={onSelectCustomer}
          onOpenCreateTaskForCustomer={onOpenCreateTaskForCustomer}
          onOpenCreateTask={onOpenCreateTask}
          filterPreset={filterPreset}
          onClearFilterPreset={onClearFilterPreset}
        />
      )}

      {subTab === 'KANBAN' && (
        <TaskKanban
          tasks={tasks}
          customers={customers}
          users={users}
          currentUser={currentUser}
          onSelectTask={onSelectTask}
          onSelectCustomer={onSelectCustomer}
          onOpenCreateTask={onOpenCreateTask}
        />
      )}

      {subTab === 'CALENDAR' && (
        <TaxCalendarView
          tasks={tasks}
          customers={customers}
          onSelectTask={onSelectTask}
        />
      )}

      {subTab === 'TEMPLATES' && (
        <TemplatesView
          templates={templates}
          customers={customers}
          users={users}
          currentUser={currentUser}
          onSelectTemplateToCreateTask={onSelectTemplateToCreateTask}
          onSelectAdHocServiceToCreateTask={onSelectAdHocServiceToCreateTask}
          onDataReload={onDataReload}
        />
      )}

      {/* Modal Auto-dispatch trigger */}
      {isAutoDispatchModalOpen && (
        <AutoDispatchPeriodicModal
          isOpen={isAutoDispatchModalOpen}
          onClose={() => setIsAutoDispatchModalOpen(false)}
          customers={customers}
          templates={templates}
          currentUser={currentUser}
          onSuccess={() => {
            if (onDataReload) {
              onDataReload();
            }
          }}
        />
      )}

      {/* Modal Báo Cáo Tuần Chuẩn Nghị Định 30 */}
      {isWeeklyReportModalOpen && (
        <WeeklyTaskReportModal
          isOpen={isWeeklyReportModalOpen}
          onClose={() => setIsWeeklyReportModalOpen(false)}
          tasks={tasks}
          customers={customers}
          users={users}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};


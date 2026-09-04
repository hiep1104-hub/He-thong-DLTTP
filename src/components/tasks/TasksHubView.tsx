import React, { useState, useMemo, useEffect } from 'react';

import { storageService, CURRENT_SYSTEM_DATE } from '../../services/storageService';
import { 
  formatDate, 
  PRIORITY_LABELS, 
  RISK_LABELS, 
  STATUS_LABELS, 
  DEPARTMENT_LABELS, 
  getTaskNature, 
  TaskNature, 
  TASK_NATURE_LABELS,
  formatCurrency 
} from '../../utils/formatters';
import { PermissionService } from '../../utils/permissions';
import { TaskStatus, TaskPriority, TaskRiskLevel, Department } from '../../types';

import { Customer, Task, User, ChecklistTemplate, AdHocServiceItem } from '../../types';
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
  Search,
  Filter,
  LayoutList,
  Calendar as CalendarIcon,
  Building,
  Building2,
  UserCheck,
  Clock,
  CheckCircle2,
  ChevronRight,
  Paperclip,
  Calendar,
  Tag,
  ExternalLink,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  Maximize2,
  Minimize2,
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



// --- START OF
interface TaskListProps {
  tasks: Task[];
  customers: Customer[];
  users: User[];
  currentUser: User;
  onSelectTask: (task: Task) => void;
  onSelectCustomer?: (customer: Customer) => void;
  onOpenCreateTaskForCustomer?: (customer: Customer) => void;
  onOpenCreateTask: () => void;
  filterPreset?: string;
  onClearFilterPreset?: () => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  customers,
  users,
  currentUser,
  onSelectTask,
  onSelectCustomer,
  onOpenCreateTaskForCustomer,
  onOpenCreateTask,
  filterPreset,
  onClearFilterPreset,
}) => {
  const canViewAllTasks = PermissionService.canViewAllTasks(currentUser);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNature, setSelectedNature] = useState<'ALL' | 'PERIODIC' | 'ADHOC'>('ALL');
  const [viewGrouping, setViewGrouping] = useState<'BY_CUSTOMER' | 'GROUPED_NATURE' | 'UNIFIED'>('BY_CUSTOMER');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('ALL');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [deadlineFilter, setDeadlineFilter] = useState<string>(filterPreset || 'ALL');
  const [userScopeTab, setUserScopeTab] = useState<'MY_TASKS' | 'ALL_TASKS'>('ALL_TASKS');
  const scopeTab = !canViewAllTasks ? 'MY_TASKS' : userScopeTab;
  const setScopeTab = setUserScopeTab;
  const [sortBy, setSortBy] = useState<'DUE_DATE' | 'PRIORITY' | 'RISK' | 'CODE'>('DUE_DATE');
  const [isWeeklyReportOpen, setIsWeeklyReportOpen] = useState(false);

  // Total tasks assigned to or involving currentUser
  const myAssignedTasksCount = useMemo(() => {
    if (!currentUser) return 0;
    return tasks.filter(t => t.assigneeId === currentUser.id || t.reviewerId === currentUser.id || t.approverId === currentUser.id).length;
  }, [tasks, currentUser]);

  // Overall counts by Nature
  const allPeriodicTasks = useMemo(() => tasks.filter(t => getTaskNature(t) === 'PERIODIC'), [tasks]);
  const allAdHocTasks = useMemo(() => tasks.filter(t => getTaskNature(t) === 'ADHOC'), [tasks]);

  // Periodic metrics
  const periodicCompletedCount = allPeriodicTasks.filter(t => t.status === 'HOAN_THANH').length;
  const periodicOverdueCount = allPeriodicTasks.filter(t => storageService.getTaskDeadlineStatus(t).isOverdue).length;
  const periodicInProgressCount = allPeriodicTasks.filter(t => t.status === 'DANG_THUC_HIEN').length;

  // AdHoc metrics
  const adHocCompletedCount = allAdHocTasks.filter(t => t.status === 'HOAN_THANH').length;
  const adHocTotalFees = allAdHocTasks.reduce((sum, t) => sum + (t.serviceTotalFee || t.serviceFee || 0), 0);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Nature filter (Periodic vs Ad-hoc)
      if (selectedNature !== 'ALL') {
        const nature = getTaskNature(task);
        if (nature !== selectedNature) return false;
      }

      // Role scope filter (Việc tôi phụ trách vs Toàn bộ)
      if (scopeTab === 'MY_TASKS') {
        if (task.assigneeId !== currentUser.id && task.reviewerId !== currentUser.id && task.approverId !== currentUser.id) {
          return false;
        }
      }

      // Department filter
      if (selectedDepartment !== 'ALL' && task.department !== selectedDepartment) {
        return false;
      }

      // Customer filter
      if (selectedCustomer !== 'ALL' && task.customerId !== selectedCustomer) {
        return false;
      }

      // Assignee filter
      if (selectedAssignee !== 'ALL' && task.assigneeId !== selectedAssignee) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'ALL' && task.status !== selectedStatus) {
        return false;
      }

      // Priority filter
      if (selectedPriority !== 'ALL' && task.priority !== selectedPriority) {
        return false;
      }

      // Risk filter
      if (selectedRisk !== 'ALL' && task.riskLevel !== selectedRisk) {
        return false;
      }

      // Deadline filter
      if (deadlineFilter !== 'ALL') {
        const deadlineStatus = storageService.getTaskDeadlineStatus(task);
        if (deadlineFilter === 'TODAY' && deadlineStatus.bucket !== 'TODAY') return false;
        if (deadlineFilter === 'OVERDUE' && !deadlineStatus.isOverdue) return false;
        if (deadlineFilter === 'IN_PROGRESS' && task.status !== 'DANG_THUC_HIEN') return false;
        if (deadlineFilter === 'PENDING_APPROVAL' && task.status !== 'CHO_PHE_DUYET' && task.status !== 'CHO_KIEM_TRA') return false;
        if (deadlineFilter === 'TAX_RISK' && !deadlineStatus.isHighRiskTax) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(term);
        const matchCode = task.code.toLowerCase().includes(term);
        const matchCustomer = task.customerName?.toLowerCase().includes(term);
        const matchAssignee = task.assigneeName.toLowerCase().includes(term);
        const matchTax = task.customerTaxCode?.includes(term);
        const matchService = task.serviceCode?.toLowerCase().includes(term) || task.serviceName?.toLowerCase().includes(term);
        if (!matchTitle && !matchCode && !matchCustomer && !matchAssignee && !matchTax && !matchService) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'DUE_DATE') {
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (sortBy === 'PRIORITY') {
        const weights: Record<string, number> = { KHAN_CAP: 4, CAO: 3, TRUNG_BINH: 2, THAP: 1 };
        return (weights[b.priority] || 0) - (weights[a.priority] || 0);
      }
      if (sortBy === 'RISK') {
        const weights: Record<string, number> = { RUI_RO_THUE_PHAP_LY: 4, CAO: 3, TRUNG_BINH: 2, BINH_THUONG: 1 };
        return (weights[b.riskLevel] || 0) - (weights[a.riskLevel] || 0);
      }
      return b.code.localeCompare(a.code);
    });
  }, [
    tasks, 
    selectedNature,
    scopeTab, 
    currentUser, 
    selectedDepartment, 
    selectedCustomer, 
    selectedAssignee, 
    selectedStatus, 
    selectedPriority, 
    selectedRisk, 
    deadlineFilter, 
    searchTerm, 
    sortBy
  ]);

  // Split filtered tasks into Periodic and Ad-hoc
  const periodicFilteredTasks = useMemo(() => filteredTasks.filter(t => getTaskNature(t) === 'PERIODIC'), [filteredTasks]);
  const adhocFilteredTasks = useMemo(() => filteredTasks.filter(t => getTaskNature(t) === 'ADHOC'), [filteredTasks]);

  // Helper to render Task Rows in Table
  const renderTaskRow = (task: Task) => {
    const nature = getTaskNature(task);
    const deadlineInfo = storageService.getTaskDeadlineStatus(task);
    const completedSteps = task.workflowSteps.filter(s => s.isCompleted).length;
    const totalSteps = task.workflowSteps.length;
    const completedChecklist = task.checklist.filter(c => c.isCompleted).length;
    const totalChecklist = task.checklist.length;

    return (
      <tr
        key={task.id}
        onClick={() => onSelectTask(task)}
        className="hover:bg-blue-50/50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
      >
        {/* Code & Nature & Priority */}
        <td className="py-3 px-4 align-top">
          <div className="font-mono font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
            <span>{task.code}</span>
          </div>

          <div className="mt-1 flex flex-wrap gap-1 items-center">
            {nature === 'PERIODIC' ? (
              <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.2 rounded font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <Calendar className="h-2.5 w-2.5" />
                <span>Định kỳ</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                <Zap className="h-2.5 w-2.5" />
                <span>Phát sinh</span>
              </span>
            )}

            <span className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold ${PRIORITY_LABELS[task.priority]?.badgeClass}`}>
              {PRIORITY_LABELS[task.priority]?.label}
            </span>
          </div>
        </td>

        {/* Title, Customer, Department */}
        <td className="py-3 px-4 align-top">
          <div className="font-bold text-slate-900 dark:text-white leading-snug">
            {task.title}
          </div>
          
          <div className="flex items-center space-x-3 mt-1.5 text-slate-500 dark:text-slate-400 flex-wrap gap-y-1">
            <span 
              onClick={(e) => {
                if (onSelectCustomer && task.customerId) {
                  const matched = customers.find(c => c.id === task.customerId);
                  if (matched) {
                    e.stopPropagation();
                    onSelectCustomer(matched);
                  }
                }
              }}
              className={`flex items-center space-x-1 font-semibold text-slate-700 dark:text-slate-300 ${
                onSelectCustomer && task.customerId ? 'hover:text-blue-600 dark:hover:text-blue-400 hover:underline cursor-pointer' : ''
              }`}
              title={onSelectCustomer && task.customerId ? 'Click để mở hồ sơ 360° Khách hàng' : undefined}
            >
              <Building className="h-3 w-3 text-slate-400" />
              <span>{task.customerName || 'Nội bộ'}</span>
              {task.customerTaxCode && (
                <span className="text-[10px] text-slate-400 font-mono">({task.customerTaxCode})</span>
              )}
            </span>
            
            <span className={`text-[10px] px-1.5 py-0.2 rounded border font-semibold ${DEPARTMENT_LABELS[task.department]?.color}`}>
              {DEPARTMENT_LABELS[task.department]?.short}
            </span>

            {nature === 'PERIODIC' && task.taxPeriod && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800">
                Kỳ: {task.taxPeriod}
              </span>
            )}

            {task.workflowClassification === 'KE_TOAN_HOA_DON_THUONG_XUYEN' && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800" title="Kế toán & Hóa đơn thực hiện hàng tháng">
                📋 Kế toán tháng
              </span>
            )}

            {task.workflowClassification === 'KE_KHAI_THUE_THEO_LUAT' && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800" title={task.revenueBracketNote || 'Kê khai thuế theo luật'}>
                ⚖️ {task.taxAllocationRule === 'KHAI_THUE_THANG_TREN_50_TY' ? 'Thuế >50T (Tháng)' : task.taxAllocationRule === 'KHAI_THUE_QUY_DUOI_50_TY' ? 'Thuế ≤50T (Quý)' : 'Thuế luật định'}
              </span>
            )}

            {nature === 'ADHOC' && (task.serviceCode || task.serviceFeeDisplay) && (
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                <Tag className="h-2.5 w-2.5" />
                <span>{task.serviceCode ? `${task.serviceCode} • ` : ''}{task.serviceFeeDisplay || (task.serviceTotalFee ? formatCurrency(task.serviceTotalFee) : 'Phí DV')}</span>
              </span>
            )}

            {task.attachments.length > 0 && (
              <span className="flex items-center space-x-0.5 text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                <Paperclip className="h-3 w-3" />
                <span>{task.attachments.length} file</span>
              </span>
            )}
          </div>
        </td>

        {/* Staff Roles */}
        <td className="py-3 px-4 align-top text-[11px]">
          <div>
            <span className="text-slate-400">Làm:</span>{' '}
            <strong className="text-slate-800 dark:text-slate-200">{task.assigneeName}</strong>
          </div>
          <div className="text-slate-500 mt-0.5">
            <span className="text-slate-400">Duyệt:</span> {task.approverName}
          </div>
        </td>

        {/* Deadline & Warning Color */}
        <td className="py-3 px-4 align-top">
          <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>{formatDate(task.dueDate)}</span>
          </div>
          <div className="mt-1">
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold inline-block ${
              deadlineInfo.alertColor === 'DARK_RED' ? 'bg-red-900 text-white font-extrabold animate-pulse' :
              deadlineInfo.alertColor === 'RED' ? 'bg-red-100 text-red-800 font-bold' :
              deadlineInfo.alertColor === 'ORANGE' ? 'bg-orange-100 text-orange-800 font-semibold' :
              deadlineInfo.alertColor === 'YELLOW' ? 'bg-yellow-100 text-yellow-800' :
              'bg-emerald-50 text-emerald-700'
            }`}>
              {deadlineInfo.labelText}
            </span>
          </div>
        </td>

        {/* Risk Level */}
        <td className="py-3 px-4 align-top text-center">
          <span className={`text-[10px] px-2 py-0.5 rounded border inline-block font-semibold ${RISK_LABELS[task.riskLevel]?.badgeClass}`}>
            {RISK_LABELS[task.riskLevel]?.label}
          </span>
        </td>

        {/* Workflow & Checklist Progress */}
        <td className="py-3 px-4 align-top text-center">
          <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            Bước {completedSteps}/{totalSteps}
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-1 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${nature === 'PERIODIC' ? 'bg-blue-600' : 'bg-amber-500'}`}
              style={{ width: `${totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0}%` }}
            ></div>
          </div>
          {totalChecklist > 0 && (
            <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-center space-x-1">
              <CheckSquare className="h-3 w-3" />
              <span>{completedChecklist}/{totalChecklist}</span>
            </div>
          )}
        </td>

        {/* Status */}
        <td className="py-3 px-4 align-top text-center">
          <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold border inline-block ${STATUS_LABELS[task.status]?.bg} ${STATUS_LABELS[task.status]?.text} ${STATUS_LABELS[task.status]?.border}`}>
            {STATUS_LABELS[task.status]?.label}
          </span>
        </td>

        <td className="py-3 px-2 align-middle text-right">
          <div className="p-1.5 rounded-lg text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 dark:group-hover:bg-slate-800 transition-colors inline-flex items-center" title="Mở bảng xử lý & checklist công việc">
            <ChevronRight className="h-4 w-4" />
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* 0. SCOPE SELECTION TABS (Việc tôi phụ trách vs Toàn bộ công việc công ty) */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => {
              setScopeTab('MY_TASKS');
              setSelectedAssignee('ALL');
            }}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              scopeTab === 'MY_TASKS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <UserCheck className="h-4 w-4" />
            <span>Công việc tôi được phân công / liên quan</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-black ${
              scopeTab === 'MY_TASKS'
                ? 'bg-white/20 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {myAssignedTasksCount}
            </span>
          </button>

          {canViewAllTasks && (
            <button
              type="button"
              onClick={() => setScopeTab('ALL_TASKS')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                scopeTab === 'ALL_TASKS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Building className="h-4 w-4" />
              <span>Toàn bộ công việc công ty</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-black ${
                scopeTab === 'ALL_TASKS'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {tasks.length}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FILTER & SEARCH BAR */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
        
        {/* Top: Search & Quick Status Filter Presets */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm việc, khách hàng, MST, nhân viên, mã dịch vụ..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Filter Presets */}
          <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar">
            <button
              onClick={() => { setDeadlineFilter('ALL'); if (onClearFilterPreset) onClearFilterPreset(); }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                deadlineFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Tất cả ({tasks.length})
            </button>
            <button
              onClick={() => setDeadlineFilter('TODAY')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                deadlineFilter === 'TODAY'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Hôm nay
            </button>
            <button
              onClick={() => setDeadlineFilter('OVERDUE')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                deadlineFilter === 'OVERDUE'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
              }`}
            >
              Quá hạn ({tasks.filter(t => storageService.getTaskDeadlineStatus(t).isOverdue).length})
            </button>
            <button
              onClick={() => setDeadlineFilter('TAX_RISK')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                deadlineFilter === 'TAX_RISK'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800'
              }`}
            >
              Rủi ro Thuế
            </button>
            <button
              onClick={() => setDeadlineFilter('PENDING_APPROVAL')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                deadlineFilter === 'PENDING_APPROVAL'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
              }`}
            >
              Chờ duyệt
            </button>
          </div>
        </div>

        {/* Bottom: Filter Selectors & View Grouping Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Nature Selector Dropdown */}
            <select
              value={selectedNature}
              onChange={(e: any) => setSelectedNature(e.target.value)}
              className="px-2.5 py-1.5 bg-blue-50/70 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-900 dark:text-blue-200 focus:outline-none text-xs font-bold"
            >
              <option value="ALL">Phân loại việc: Tất cả ({tasks.length})</option>
              <option value="PERIODIC">📅 Định kỳ theo Gói ({allPeriodicTasks.length})</option>
              <option value="ADHOC">⚡ Phát sinh ngoài Gói ({allAdHocTasks.length})</option>
            </select>

            {/* Department */}
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none text-xs font-medium"
            >
              <option value="ALL">Phòng ban: Tất cả</option>
              <option value="KE_TOAN_THUE">Kế Toán – Thuế</option>
              <option value="HANH_CHINH_NHAN_SU">Hành Chính – Nhân Sự</option>
              <option value="KINH_DOANH_CSKH">Kinh Doanh – CSKH</option>
              <option value="BAN_GIAM_DOC">Ban Giám Đốc</option>
            </select>

            {/* Assignee */}
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none text-xs font-medium"
            >
              <option value="ALL">Phụ trách: Tất cả</option>
              {users.filter(u => u.role !== 'ADMIN' && u.id !== 'USR-030' && !u.name.includes('Quản Trị')).map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>

            {/* Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none text-xs font-medium"
            >
              <option value="ALL">Trạng thái: Tất cả</option>
              <option value="MOI_TAO">Mới tạo</option>
              <option value="DA_PHAN_CONG">Đã phân công</option>
              <option value="DANG_THUC_HIEN">Đang thực hiện</option>
              <option value="CHO_CHUNG_TU">Chờ chứng từ</option>
              <option value="CHO_KHACH_HANG">Chờ khách hàng</option>
              <option value="CHO_KIEM_TRA">Chờ kiểm tra</option>
              <option value="CHO_PHE_DUYET">Chờ phê duyệt</option>
              <option value="HOAN_THANH">Hoàn thành</option>
              <option value="QUA_HAN">Quá hạn</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Mode Toggle when viewing ALL */}
            {selectedNature === 'ALL' && (
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setViewGrouping('BY_CUSTOMER')}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    viewGrouping === 'BY_CUSTOMER'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="Gom nhóm và quản lý công việc theo từng Khách hàng / Doanh nghiệp"
                >
                  <Building2 className="h-3.5 w-3.5" />
                  <span>Theo Khách hàng</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewGrouping('GROUPED_NATURE')}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    viewGrouping === 'GROUPED_NATURE'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="Tách riêng 2 khối Công việc Định kỳ & Phát sinh"
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Tách 2 nhóm</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${
                    viewGrouping === 'GROUPED_NATURE' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    {periodicFilteredTasks.length} | {adhocFilteredTasks.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewGrouping('UNIFIED')}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    viewGrouping === 'UNIFIED'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="Xem toàn bộ danh sách trong 1 bảng gộp"
                >
                  <LayoutList className="h-3.5 w-3.5" />
                  <span>Bảng gộp</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${
                    viewGrouping === 'UNIFIED' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    {filteredTasks.length}
                  </span>
                </button>
              </div>
            )}

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none text-xs font-medium"
            >
              <option value="DUE_DATE">Hạn nộp</option>
              <option value="PRIORITY">Độ ưu tiên</option>
              <option value="RISK">Mức độ rủi ro</option>
              <option value="CODE">Mã công việc</option>
            </select>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* OPTION 1: CUSTOMER GROUPED VIEW (Theo Khách hàng / Doanh Nghiệp) */}
      {/* ========================================================================= */}
      {selectedNature === 'ALL' && viewGrouping === 'BY_CUSTOMER' && (
        <CustomerGroupedTaskList
          tasks={filteredTasks}
          customers={customers}
          users={users}
          currentUser={currentUser}
          onSelectTask={onSelectTask}
          onSelectCustomer={onSelectCustomer}
          onOpenCreateTaskForCustomer={onOpenCreateTaskForCustomer}
          onOpenCreateTask={onOpenCreateTask}
        />
      )}

      {/* ========================================================================= */}
      {/* OPTION 2: GROUPED NATURE VIEW (Tách riêng 2 nhóm Định kỳ & Phát sinh) */}
      {/* ========================================================================= */}
      {selectedNature === 'ALL' && viewGrouping === 'GROUPED_NATURE' && (
        <div className="space-y-6">
          
          {/* SECTION 1: CÔNG VIỆC ĐỊNH KỲ THEO GÓI */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-blue-200/80 dark:border-blue-900/60 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-blue-100 dark:border-blue-900/50 bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-white dark:from-slate-850 dark:to-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Khối Công Việc Định Kỳ (Theo Gói Dịch Vụ)
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[11px] font-black border border-blue-200 dark:border-blue-800">
                      {periodicFilteredTasks.length} VIỆC
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Nghiệp vụ Thuế GTGT, TNCN, TNDN tạm tính, Bảng lương BHXH, Khóa sổ kế toán & Quyết toán BCTC
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  Hoàn thành: <strong className="text-emerald-600 font-bold">{periodicFilteredTasks.filter(t => t.status === 'HOAN_THANH').length}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  Đang làm: <strong className="text-blue-600 font-bold">{periodicFilteredTasks.filter(t => t.status === 'DANG_THUC_HIEN').length}</strong>
                </span>
              </div>
            </div>

            {/* Periodic Tasks Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-850 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4 w-28">Mã việc</th>
                    <th className="py-2.5 px-4 min-w-[280px]">Nội dung & Khách hàng</th>
                    <th className="py-2.5 px-4 w-36">Phụ trách & Duyệt</th>
                    <th className="py-2.5 px-4 w-36">Hạn nộp pháp lý</th>
                    <th className="py-2.5 px-4 w-28 text-center">Rủi ro thuế</th>
                    <th className="py-2.5 px-4 w-32 text-center">Tiến độ</th>
                    <th className="py-2.5 px-4 w-32 text-center">Trạng thái</th>
                    <th className="py-2.5 px-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {periodicFilteredTasks.map(renderTaskRow)}
                  {periodicFilteredTasks.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                        Không có công việc định kỳ nào trong tiêu chí lọc hiện tại.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 2: CÔNG VIỆC PHÁT SINH THEO YÊU CẦU */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200/80 dark:border-amber-900/60 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-amber-100 dark:border-amber-900/50 bg-gradient-to-r from-amber-50/80 via-orange-50/40 to-white dark:from-slate-850 dark:to-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-amber-500 text-slate-950 rounded-xl shadow-xs">
                  <Zap className="h-4 w-4 fill-slate-950" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Khối Công Việc Phát Sinh (Theo Yêu Cầu & 49 Dịch Vụ)
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 text-[11px] font-black border border-amber-200 dark:border-amber-800">
                      {adhocFilteredTasks.length} VIỆC
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Thủ tục thành lập / thay đổi ĐKKD, hồ sơ BHXH lần đầu, giải trình kiểm tra thuế, hoàn thuế & dịch vụ vụ việc
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  Hoàn thành: <strong className="text-emerald-600 font-bold">{adhocFilteredTasks.filter(t => t.status === 'HOAN_THANH').length}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  Đang làm: <strong className="text-amber-600 font-bold">{adhocFilteredTasks.filter(t => t.status === 'DANG_THUC_HIEN').length}</strong>
                </span>
              </div>
            </div>

            {/* Adhoc Tasks Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-850 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4 w-28">Mã việc</th>
                    <th className="py-2.5 px-4 min-w-[280px]">Dịch vụ phát sinh & Khách hàng</th>
                    <th className="py-2.5 px-4 w-36">Phụ trách & Duyệt</th>
                    <th className="py-2.5 px-4 w-36">Hạn hoàn thành</th>
                    <th className="py-2.5 px-4 w-28 text-center">Rủi ro pháp lý</th>
                    <th className="py-2.5 px-4 w-32 text-center">Tiến độ</th>
                    <th className="py-2.5 px-4 w-32 text-center">Trạng thái</th>
                    <th className="py-2.5 px-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {adhocFilteredTasks.map(renderTaskRow)}
                  {adhocFilteredTasks.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                        Không có công việc phát sinh nào trong tiêu chí lọc hiện tại.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* OPTION B: UNIFIED TABLE VIEW (Khi chọn Lọc Định kỳ riêng, Phát sinh riêng, hoặc Bảng Gộp) */}
      {/* ========================================================================= */}
      {(selectedNature !== 'ALL' || viewGrouping === 'UNIFIED') && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          
          <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
            <div className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <span>
                {selectedNature === 'PERIODIC' ? 'Danh Sách Công Việc Định Kỳ (Theo Gói Dịch Vụ)' :
                 selectedNature === 'ADHOC' ? 'Danh Sách Công Việc Phát Sinh (Theo Yêu Cầu / 49 Dịch Vụ)' :
                 'Danh Sách Toàn Bộ Công Việc Nghiệp Vụ'}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                selectedNature === 'PERIODIC' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                selectedNature === 'ADHOC' ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300' :
                'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
              }`}>
                {filteredTasks.length} VIỆC
              </span>
            </div>

            <button
              type="button"
              onClick={() => setScopeTab(prev => prev === 'MY_TASKS' ? 'ALL_TASKS' : 'MY_TASKS')}
              className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                scopeTab === 'MY_TASKS'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 border border-blue-300 dark:border-blue-700'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>{scopeTab === 'MY_TASKS' ? 'Đang lọc: Việc của tôi' : 'Xem việc của tôi'}</span>
            </button>
          </div>

          {/* Task Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-850 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 w-28">Mã việc</th>
                  <th className="py-2.5 px-4 min-w-[280px]">Nội dung & Khách hàng</th>
                  <th className="py-2.5 px-4 w-36">Phụ trách & Duyệt</th>
                  <th className="py-2.5 px-4 w-36">Hạn xử lý</th>
                  <th className="py-2.5 px-4 w-28 text-center">Rủi ro thuế</th>
                  <th className="py-2.5 px-4 w-32 text-center">Tiến độ</th>
                  <th className="py-2.5 px-4 w-32 text-center">Trạng thái</th>
                  <th className="py-2.5 px-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTasks.map(renderTaskRow)}

                {filteredTasks.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                      <AlertTriangle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <span>Không tìm thấy công việc nào thỏa mãn tiêu chí lọc.</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* Modal Báo Cáo Tuần Chuẩn Nghị Định 30 */}
      {isWeeklyReportOpen && (
        <WeeklyTaskReportModal
          isOpen={isWeeklyReportOpen}
          onClose={() => setIsWeeklyReportOpen(false)}
          tasks={tasks}
          customers={customers}
          users={users}
          currentUser={currentUser}
        />
      )}

    </div>
  );
};


// --- START OF
interface TaskKanbanProps {
  tasks: Task[];
  customers?: Customer[];
  users?: User[];
  currentUser?: User;
  onSelectTask: (task: Task) => void;
  onSelectCustomer?: (customer: Customer) => void;
  onOpenCreateTask: () => void;
}

interface KanbanColumn {
  id: string;
  title: string;
  statuses: TaskStatus[];
  color: string;
  badgeBg: string;
  badgeText: string;
  dotColor: string;
  description: string;
}

export const TaskKanban: React.FC<TaskKanbanProps> = ({
  tasks,
  customers = [],
  users = [],
  currentUser,
  onSelectTask,
  onSelectCustomer,
  onOpenCreateTask,
}) => {
  const [selectedNature, setSelectedNature] = useState<'ALL' | 'PERIODIC' | 'ADHOC'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('ALL');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Column definitions with clear status mapping
  const columns: KanbanColumn[] = [
    {
      id: 'COL_TODO',
      title: 'Chờ thực hiện',
      statuses: ['MOI_TAO', 'DA_PHAN_CONG', 'CHO_CHUNG_TU', 'CHO_KHACH_HANG'],
      color: 'border-t-blue-500',
      badgeBg: 'bg-blue-100 dark:bg-blue-950/80',
      badgeText: 'text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800',
      dotColor: 'bg-blue-500',
      description: 'Mới tạo, đã phân công, chờ chứng từ & chờ KH',
    },
    {
      id: 'COL_IN_PROGRESS',
      title: 'Đang xử lý',
      statuses: ['DANG_THUC_HIEN'],
      color: 'border-t-indigo-500',
      badgeBg: 'bg-indigo-100 dark:bg-indigo-950/80',
      badgeText: 'text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800',
      dotColor: 'bg-indigo-500',
      description: 'Chuyên viên đang hạch toán & soạn hồ sơ',
    },
    {
      id: 'COL_REVIEW',
      title: 'Chờ duyệt & Quá hạn',
      statuses: ['CHO_KIEM_TRA', 'CHO_PHE_DUYET', 'QUA_HAN'],
      color: 'border-t-amber-500',
      badgeBg: 'bg-amber-100 dark:bg-amber-950/80',
      badgeText: 'text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800',
      dotColor: 'bg-amber-500',
      description: 'KTT soát xét, BGD duyệt & cảnh báo rủi ro',
    },
    {
      id: 'COL_DONE',
      title: 'Đã hoàn thành',
      statuses: ['HOAN_THANH'],
      color: 'border-t-emerald-500',
      badgeBg: 'bg-emerald-100 dark:bg-emerald-950/80',
      badgeText: 'text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800',
      dotColor: 'bg-emerald-500',
      description: 'Đã nộp CQT thành công & bàn giao hồ sơ',
    },
  ];

  // Filter tasks by nature, search query, priority, assignee
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Nature filter
      if (selectedNature !== 'ALL' && getTaskNature(task) !== selectedNature) {
        return false;
      }
      // Priority filter
      if (selectedPriority !== 'ALL' && task.priority !== selectedPriority) {
        return false;
      }
      // Assignee filter
      if (selectedAssignee !== 'ALL' && task.assigneeId !== selectedAssignee) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (task.title || '').toLowerCase().includes(q);
        const matchCode = (task.code || '').toLowerCase().includes(q);
        const matchCustomer = (task.customerName || '').toLowerCase().includes(q);
        const matchTaxCode = (task.customerTaxCode || '').toLowerCase().includes(q);
        const matchAssignee = (task.assigneeName || '').toLowerCase().includes(q);
        if (!matchTitle && !matchCode && !matchCustomer && !matchTaxCode && !matchAssignee) {
          return false;
        }
      }
      return true;
    });
  }, [tasks, selectedNature, selectedPriority, selectedAssignee, searchQuery]);

  // Counts for each category
  const counts = useMemo(() => {
    const todo = tasks.filter(t => ['MOI_TAO', 'DA_PHAN_CONG', 'CHO_CHUNG_TU', 'CHO_KHACH_HANG'].includes(t.status)).length;
    const inProgress = tasks.filter(t => t.status === 'DANG_THUC_HIEN').length;
    const review = tasks.filter(t => ['CHO_KIEM_TRA', 'CHO_PHE_DUYET', 'QUA_HAN'].includes(t.status)).length;
    const done = tasks.filter(t => t.status === 'HOAN_THANH').length;
    const periodic = tasks.filter(t => getTaskNature(t) === 'PERIODIC').length;
    const adhoc = tasks.filter(t => getTaskNature(t) === 'ADHOC').length;

    return {
      total: tasks.length,
      todo,
      inProgress,
      review,
      done,
      periodic,
      adhoc,
    };
  }, [tasks]);

  // Quick move task status
  const handleQuickStatusChange = (e: React.MouseEvent, task: Task, newStatus: TaskStatus) => {
    e.stopPropagation();
    const updated = {
      ...task,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    storageService.updateTask(updated);
    window.location.reload(); // Simple sync
  };

  return (
    <div 
      id="kanban-main-wrapper" 
      className={`transition-all duration-200 ${
        isFullscreen 
          ? 'fixed inset-0 z-50 bg-slate-100 dark:bg-slate-950 p-4 md:p-6 flex flex-col overflow-hidden' 
          : 'space-y-4 w-full'
      }`}
    >
      {/* Top Header Controls */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 shrink-0">
        
        {/* Row 1: Nature filter pills, Search input, Fullscreen toggle, Create Button */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Left: Nature Filter Switcher */}
          <div className="flex items-center space-x-1.5 flex-wrap">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setSelectedNature('ALL')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectedNature === 'ALL'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Tất cả ({counts.total})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedNature('PERIODIC')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectedNature === 'PERIODIC'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-blue-600'
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>Định kỳ theo Gói ({counts.periodic})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedNature('ADHOC')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectedNature === 'ADHOC'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-amber-600'
                }`}
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Phát sinh / 49 DV ({counts.adhoc})</span>
              </button>
            </div>
          </div>

          {/* Right: Search, Priority filter, Fullscreen toggle & Create button */}
          <div className="flex items-center space-x-2 flex-wrap ml-auto">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm mã việc, tên cty, MST, chuyên viên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl w-52 sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 placeholder-slate-400"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">Mọi mức độ ưu tiên</option>
              <option value="KHAN_CAP">🔥 Khẩn cấp</option>
              <option value="CAO">⚡ Cao</option>
              <option value="TRUNG_BINH">🔹 Trung bình</option>
              <option value="THAP">⚪ Thấp</option>
            </select>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`p-1.5 rounded-xl border transition-all text-xs font-bold flex items-center space-x-1 cursor-pointer ${
                isFullscreen
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
              title={isFullscreen ? 'Thu nhỏ về khung xem thông thường' : 'Mở rộng Bảng Kanban toàn màn hình (Full Screen)'}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Thu nhỏ</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Toàn màn hình</span>
                </>
              )}
            </button>

            {/* Create Task Button */}
            <button
              type="button"
              onClick={onOpenCreateTask}
              className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Giao việc mới</span>
            </button>
          </div>

        </div>

        {/* Row 2: Distribution Visualizer Bar (Phân bổ chuẩn: 51 | 4 | 2 | 1) */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span className="font-bold text-slate-800 dark:text-slate-100">Phân bổ Kanban:</span>
            <div className="flex items-center space-x-3 flex-wrap text-xs">
              <span className="flex items-center space-x-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500 inline-block" />
                <span className="text-slate-700 dark:text-slate-200 font-medium">Chờ thực hiện:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-900">{counts.todo}</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 inline-block" />
                <span className="text-slate-700 dark:text-slate-200 font-medium">Đang xử lý:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.2 rounded border border-indigo-200 dark:border-indigo-900">{counts.inProgress}</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block" />
                <span className="text-slate-700 dark:text-slate-200 font-medium">Chờ duyệt & Quá hạn:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-900">{counts.review}</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
                <span className="text-slate-700 dark:text-slate-200 font-medium">Đã hoàn thành:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-900">{counts.done}</span>
              </span>
            </div>
          </div>

          {/* Mini progress bar strip */}
          <div className="hidden lg:flex items-center space-x-1 w-64 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shrink-0">
            <div style={{ width: `${(counts.todo / counts.total) * 100}%` }} className="h-full bg-blue-500" title={`Chờ thực hiện: ${counts.todo}`} />
            <div style={{ width: `${(counts.inProgress / counts.total) * 100}%` }} className="h-full bg-indigo-500" title={`Đang xử lý: ${counts.inProgress}`} />
            <div style={{ width: `${(counts.review / counts.total) * 100}%` }} className="h-full bg-amber-500" title={`Chờ duyệt & Quá hạn: ${counts.review}`} />
            <div style={{ width: `${(counts.done / counts.total) * 100}%` }} className="h-full bg-emerald-500" title={`Đã hoàn thành: ${counts.done}`} />
          </div>
        </div>

      </div>

      {/* 4-COLUMN RESPONSIVE FULL-SCREEN KANBAN GRID */}
      <div 
        className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full ${
          isFullscreen 
            ? 'flex-1 min-h-0' 
            : 'h-[calc(100vh-210px)] min-h-[640px]'
        }`}
      >
        {columns.map((col) => {
          const colTasks = filteredTasks.filter(t => col.statuses.includes(t.status));

          return (
            <div
              key={col.id}
              className={`bg-slate-100/80 dark:bg-slate-900/70 rounded-2xl border border-slate-200/90 dark:border-slate-800 border-t-4 ${col.color} p-3.5 flex flex-col min-h-0 shadow-xs h-full`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-2.5 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <div className="flex items-center space-x-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${col.dotColor}`} />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-100">
                    {col.title}
                  </h3>
                </div>

                <div className="flex items-center space-x-1.5">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-black ${col.badgeBg} ${col.badgeText}`}>
                    {colTasks.length}
                  </span>
                </div>
              </div>

              {/* Column Subtitle / Description */}
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5 px-0.5 truncate shrink-0">
                {col.description}
              </div>

              {/* Scrollable Task Cards List */}
              <div className="space-y-3 flex-1 overflow-y-auto pr-1 pb-2 custom-scrollbar">
                {colTasks.map((task) => {
                  const nature = getTaskNature(task);
                  const deadlineInfo = storageService.getTaskDeadlineStatus(task);
                  const completedSteps = (task.workflowSteps || []).filter(s => s.isCompleted).length;
                  const totalSteps = (task.workflowSteps || []).length;
                  const completedChecklists = (task.checklist || []).filter(c => c.isCompleted).length;
                  const totalChecklists = (task.checklist || []).length;

                  return (
                    <div
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-750 shadow-xs hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-all space-y-2.5 group relative"
                    >
                      {/* Top Header: Code, Nature tag, Priority badge */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center space-x-1.5 min-w-0">
                          <span className="font-mono text-[11px] font-black text-blue-600 dark:text-blue-400 shrink-0">
                            {task.code}
                          </span>
                          {nature === 'PERIODIC' ? (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
                              Định kỳ
                            </span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-black bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
                              Phát sinh
                            </span>
                          )}
                        </div>

                        <span className={`text-[9px] px-1.5 py-0.2 rounded border font-bold shrink-0 ${PRIORITY_LABELS[task.priority]?.badgeClass}`}>
                          {PRIORITY_LABELS[task.priority]?.label}
                        </span>
                      </div>

                      {/* Task Title */}
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                        {task.title}
                      </h4>

                      {/* Customer Info & Tax Code */}
                      <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                        <div 
                          onClick={(e) => {
                            if (onSelectCustomer && task.customerId) {
                              const matched = customers.find(c => c.id === task.customerId);
                              if (matched) {
                                e.stopPropagation();
                                onSelectCustomer(matched);
                              }
                            }
                          }}
                          className={`flex items-center space-x-1.5 min-w-0 ${
                            onSelectCustomer && task.customerId ? 'hover:text-blue-600 dark:hover:text-blue-400 hover:underline cursor-pointer' : ''
                          }`}
                          title={onSelectCustomer && task.customerId ? 'Click để mở hồ sơ khách hàng' : undefined}
                        >
                          <Building className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[170px]">
                            {task.customerName || 'Nội bộ công ty'}
                          </span>
                        </div>
                        {task.customerTaxCode && (
                          <span className="text-[9px] font-mono text-slate-400 shrink-0">
                            {task.customerTaxCode}
                          </span>
                        )}
                      </div>

                      {/* Tax Type / Period Badge (if applicable) */}
                      {(task.taxPeriod || task.taxType) && (
                        <div className="flex items-center gap-1.5 text-[9px] flex-wrap">
                          {task.taxType && (
                            <span className="px-1.5 py-0.2 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800">
                              Thuế {task.taxType}
                            </span>
                          )}
                          {task.taxPeriod && (
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                              {task.taxPeriod}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Risk & Deadline Badges */}
                      <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-750">
                        <div className="flex items-center justify-between text-[10px] gap-1">
                          <span className={`px-1.5 py-0.5 rounded border font-semibold ${RISK_LABELS[task.riskLevel]?.badgeClass}`}>
                            {RISK_LABELS[task.riskLevel]?.label}
                          </span>
                          
                          <span className={`px-1.5 py-0.5 rounded font-bold ${
                            deadlineInfo.alertColor === 'DARK_RED' ? 'bg-red-900 text-white font-extrabold' :
                            deadlineInfo.alertColor === 'RED' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' :
                            deadlineInfo.alertColor === 'ORANGE' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}>
                            {deadlineInfo.labelText}
                          </span>
                        </div>

                        {/* Progress Bars / Steps info */}
                        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
                          <span>Quy trình: {completedSteps}/{totalSteps || 3} bước</span>
                          {(task.attachments || []).length > 0 && (
                            <span className="flex items-center space-x-0.5 text-blue-600 dark:text-blue-400 font-bold">
                              <Paperclip className="h-3 w-3" />
                              <span>{task.attachments.length}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Assignee & Due Date Footer */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-750 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                        <div className="flex items-center space-x-1.5 min-w-0">
                          <UserCheck className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[130px]">
                            {task.assigneeName || 'Chưa giao'}
                          </span>
                        </div>
                        <span className="font-mono text-slate-400 shrink-0">
                          {formatDate(task.dueDate)}
                        </span>
                      </div>

                      {/* Quick Move Action Buttons (hover effect) */}
                      <div className="pt-1.5 flex items-center justify-end space-x-1 text-[10px] border-t border-slate-100 dark:border-slate-750/80">
                        {col.id === 'COL_TODO' && (
                          <button
                            type="button"
                            onClick={(e) => handleQuickStatusChange(e, task, 'DANG_THUC_HIEN')}
                            className="text-[10px] px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:hover:bg-indigo-900 dark:text-indigo-300 rounded font-bold flex items-center space-x-1 transition-all"
                            title="Chuyển sang Đang xử lý"
                          >
                            <span>Bắt đầu xử lý</span>
                            <ArrowRight className="h-2.5 w-2.5" />
                          </button>
                        )}
                        {col.id === 'COL_IN_PROGRESS' && (
                          <button
                            type="button"
                            onClick={(e) => handleQuickStatusChange(e, task, 'CHO_KIEM_TRA')}
                            className="text-[10px] px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950 dark:hover:bg-amber-900 dark:text-amber-300 rounded font-bold flex items-center space-x-1 transition-all"
                            title="Gửi Kế toán trưởng kiểm tra"
                          >
                            <span>Gửi kiểm tra</span>
                            <ArrowRight className="h-2.5 w-2.5" />
                          </button>
                        )}
                        {col.id === 'COL_REVIEW' && (
                          <button
                            type="button"
                            onClick={(e) => handleQuickStatusChange(e, task, 'HOAN_THANH')}
                            className="text-[10px] px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:hover:bg-emerald-900 dark:text-emerald-300 rounded font-bold flex items-center space-x-1 transition-all"
                            title="Duyệt và hoàn thành"
                          >
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            <span>Duyệt & Nộp thuế</span>
                          </button>
                        )}
                        {col.id === 'COL_DONE' && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Đã hoàn thành</span>
                          </span>
                        )}
                      </div>

                    </div>
                  );
                })}

                {colTasks.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white/40 dark:bg-slate-800/40">
                    <CheckSquare className="h-6 w-6 mx-auto mb-1.5 opacity-40" />
                    <span>Không có công việc nào</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};


// --- START OF
interface CustomerGroupedTaskListProps {
  tasks: Task[];
  customers: Customer[];
  users: User[];
  currentUser: User;
  onSelectTask: (task: Task) => void;
  onSelectCustomer?: (customer: Customer) => void;
  onOpenCreateTaskForCustomer?: (customer: Customer) => void;
  onOpenCreateTask: () => void;
}

interface CustomerTaskGroup {
  customerId: string;
  customer: Customer | null;
  customerName: string;
  customerTaxCode: string;
  tasks: Task[];
  periodicTasks: Task[];
  adhocTasks: Task[];
  totalCount: number;
  completedCount: number;
  inProgressCount: number;
  overdueCount: number;
  urgentCount: number;
  taxRiskCount: number;
  progressPercent: number;
  assignedStaffName: string;
  reviewerStaffName: string;
  servicePackage: string;
  taxDeclarationCycle?: string;
  industry?: string;
  riskLevel?: string;
}

export const CustomerGroupedTaskList: React.FC<CustomerGroupedTaskListProps> = ({
  tasks,
  customers,
  users,
  currentUser,
  onSelectTask,
  onSelectCustomer,
  onOpenCreateTaskForCustomer,
  onOpenCreateTask,
}) => {
  // Track open/collapsed state for each customer group
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [customerFilter, setCustomerFilter] = useState<'ALL' | 'OVERDUE_ONLY' | 'TAX_RISK_ONLY' | 'IN_PROGRESS_ONLY'>('ALL');
  const [customerSearch, setCustomerSearch] = useState('');

  // Group filtered tasks by customer
  const rawCustomerGroups = useMemo(() => {
    const map = new Map<string, Task[]>();

    // Put tasks into buckets
    tasks.forEach(task => {
      const key = task.customerId || 'INTERNAL';
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(task);
    });

    const groups: CustomerTaskGroup[] = [];

    map.forEach((taskList, customerId) => {
      const customer = customers.find(c => c.id === customerId) || null;
      const periodicTasks = taskList.filter(t => getTaskNature(t) === 'PERIODIC');
      const adhocTasks = taskList.filter(t => getTaskNature(t) === 'ADHOC');

      const completedCount = taskList.filter(t => t.status === 'HOAN_THANH').length;
      const inProgressCount = taskList.filter(t => t.status === 'DANG_THUC_HIEN').length;
      
      let overdueCount = 0;
      let urgentCount = 0;
      let taxRiskCount = 0;

      taskList.forEach(t => {
        const dStat = storageService.getTaskDeadlineStatus(t);
        if (dStat.isOverdue) overdueCount++;
        if (t.priority === 'KHAN_CAP') urgentCount++;
        if (t.riskLevel === 'RUI_RO_THUE_PHAP_LY' || dStat.isHighRiskTax) taxRiskCount++;
      });

      const totalCount = taskList.length;
      const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

      const customerName = customer ? customer.name : (taskList[0]?.customerName || (customerId === 'INTERNAL' ? 'Nội bộ công ty & Hành chính' : 'Khách hàng khác'));
      const customerTaxCode = customer?.taxCode || taskList[0]?.customerTaxCode || '';
      const assignedStaffName = customer?.assignedStaffName || taskList[0]?.assigneeName || 'Chưa gán';
      const reviewerStaffName = customer?.reviewerStaffName || taskList[0]?.approverName || 'Chưa gán';
      const servicePackage = customer?.servicePackage || 'Gói Dịch Vụ Doanh Nghiệp';
      const taxDeclarationCycle = customer?.taxDeclarationCycle || 'QUY';
      const industry = customer?.industry || '';
      const riskLevel = customer?.riskLevel || 'BINH_THUONG';

      groups.push({
        customerId,
        customer,
        customerName,
        customerTaxCode,
        tasks: taskList,
        periodicTasks,
        adhocTasks,
        totalCount,
        completedCount,
        inProgressCount,
        overdueCount,
        urgentCount,
        taxRiskCount,
        progressPercent,
        assignedStaffName,
        reviewerStaffName,
        servicePackage,
        taxDeclarationCycle,
        industry,
        riskLevel,
      });
    });

    // Sort customer groups (overdue/urgent first, INTERNAL at bottom)
    return groups.sort((a, b) => {
      if (a.customerId === 'INTERNAL') return 1;
      if (b.customerId === 'INTERNAL') return -1;
      if (b.overdueCount !== a.overdueCount) return b.overdueCount - a.overdueCount;
      if (b.taxRiskCount !== a.taxRiskCount) return b.taxRiskCount - a.taxRiskCount;
      if (b.urgentCount !== a.urgentCount) return b.urgentCount - a.urgentCount;
      return a.progressPercent - b.progressPercent;
    });
  }, [tasks, customers]);

  // Filtered customer groups based on quick customer filter & customer search
  const customerGroups = useMemo(() => {
    return rawCustomerGroups.filter(g => {
      if (customerFilter === 'OVERDUE_ONLY' && g.overdueCount === 0) return false;
      if (customerFilter === 'TAX_RISK_ONLY' && g.taxRiskCount === 0) return false;
      if (customerFilter === 'IN_PROGRESS_ONLY' && g.inProgressCount === 0) return false;

      if (customerSearch.trim()) {
        const q = customerSearch.toLowerCase();
        const matchName = g.customerName.toLowerCase().includes(q);
        const matchTax = g.customerTaxCode.includes(q);
        const matchStaff = g.assignedStaffName.toLowerCase().includes(q) || g.reviewerStaffName.toLowerCase().includes(q);
        const matchTask = g.tasks.some(t => t.title.toLowerCase().includes(q) || t.code.toLowerCase().includes(q));
        if (!matchName && !matchTax && !matchStaff && !matchTask) return false;
      }
      return true;
    });
  }, [rawCustomerGroups, customerFilter, customerSearch]);

  // Expand all / collapse all handlers
  const handleToggleExpand = (id: string) => {
    setExpandedGroups(prev => {
      const current = prev[id] !== undefined ? prev[id] : true; // Default is open
      return { ...prev, [id]: !current };
    });
  };

  const handleExpandAll = () => {
    const allOpen: Record<string, boolean> = {};
    customerGroups.forEach(g => {
      allOpen[g.customerId] = true;
    });
    setExpandedGroups(allOpen);
  };

  const handleCollapseAll = () => {
    const allClosed: Record<string, boolean> = {};
    customerGroups.forEach(g => {
      allClosed[g.customerId] = false;
    });
    setExpandedGroups(allClosed);
  };

  // Helper to render Task Rows in Sub-Tables
  const renderTaskRow = (task: Task, isPeriodic: boolean) => {
    const deadlineInfo = storageService.getTaskDeadlineStatus(task);
    const completedSteps = task.workflowSteps.filter(s => s.isCompleted).length;
    const totalSteps = task.workflowSteps.length;
    const completedChecklist = task.checklist.filter(c => c.isCompleted).length;
    const totalChecklist = task.checklist.length;

    return (
      <tr
        key={task.id}
        onClick={() => onSelectTask(task)}
        className="hover:bg-blue-50/70 dark:hover:bg-slate-800/80 cursor-pointer transition-colors group"
      >
        {/* Code & Priority */}
        <td className="py-2.5 px-3 align-top w-28">
          <div className="font-mono font-bold text-blue-600 dark:text-blue-400 group-hover:underline text-[11px] flex items-center gap-1">
            <span>{task.code}</span>
          </div>
          <div className="mt-1 flex items-center gap-1">
            <span className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold ${PRIORITY_LABELS[task.priority]?.badgeClass}`}>
              {PRIORITY_LABELS[task.priority]?.label}
            </span>
          </div>
        </td>

        {/* Task Title & Specific Meta */}
        <td className="py-2.5 px-3 align-top min-w-[260px]">
          <div className="font-bold text-slate-900 dark:text-white leading-snug text-xs group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {task.title}
          </div>

          <div className="flex items-center space-x-2 mt-1 text-slate-500 dark:text-slate-400 flex-wrap gap-y-1 text-[10px]">
            {isPeriodic ? (
              <>
                {task.taxPeriod && (
                  <span className="px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                    Kỳ: {task.taxPeriod}
                  </span>
                )}
                {task.workflowClassification === 'KE_TOAN_HOA_DON_THUONG_XUYEN' && (
                  <span className="px-1.5 py-0.2 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800">
                    Kế toán hàng tháng
                  </span>
                )}
                {task.workflowClassification === 'KE_KHAI_THUE_THEO_LUAT' && (
                  <span className="px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800">
                    Kê khai thuế luật định
                  </span>
                )}
              </>
            ) : (
              <>
                {(task.serviceCode || task.serviceFeeDisplay || task.serviceTotalFee) && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                    <Tag className="h-2.5 w-2.5" />
                    <span>{task.serviceCode ? `${task.serviceCode} • ` : ''}{task.serviceFeeDisplay || (task.serviceTotalFee ? formatCurrency(task.serviceTotalFee) : 'Dịch vụ')}</span>
                  </span>
                )}
              </>
            )}

            {task.attachments && task.attachments.length > 0 && (
              <span className="flex items-center space-x-0.5 text-blue-600 dark:text-blue-400 font-semibold">
                <Paperclip className="h-2.5 w-2.5" />
                <span>{task.attachments.length} file</span>
              </span>
            )}
          </div>
        </td>

        {/* Assigned Staff */}
        <td className="py-2.5 px-3 align-top text-[11px] w-36">
          <div className="flex items-center space-x-1">
            <span className="text-slate-400 text-[10px]">Làm:</span>
            <strong className="text-slate-800 dark:text-slate-200 truncate">{task.assigneeName}</strong>
          </div>
          <div className="text-slate-500 text-[10px] mt-0.5 truncate">
            <span className="text-slate-400">Duyệt:</span> {task.approverName}
          </div>
        </td>

        {/* Deadline & Warning */}
        <td className="py-2.5 px-3 align-top w-36">
          <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1 text-xs">
            <Clock className="h-3 w-3 text-slate-400" />
            <span>{formatDate(task.dueDate)}</span>
          </div>
          <div className="mt-0.5">
            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold inline-block ${
              deadlineInfo.alertColor === 'DARK_RED' ? 'bg-red-900 text-white font-black animate-pulse' :
              deadlineInfo.alertColor === 'RED' ? 'bg-red-100 text-red-800 font-bold dark:bg-red-950 dark:text-red-300' :
              deadlineInfo.alertColor === 'ORANGE' ? 'bg-orange-100 text-orange-800 font-semibold dark:bg-orange-950 dark:text-orange-300' :
              deadlineInfo.alertColor === 'YELLOW' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300' :
              'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
            }`}>
              {deadlineInfo.labelText}
            </span>
          </div>
        </td>

        {/* Risk Level */}
        <td className="py-2.5 px-3 align-top text-center w-28">
          <span className={`text-[9px] px-1.5 py-0.5 rounded border inline-block font-semibold ${RISK_LABELS[task.riskLevel]?.badgeClass}`}>
            {RISK_LABELS[task.riskLevel]?.label}
          </span>
        </td>

        {/* Progress */}
        <td className="py-2.5 px-3 align-top text-center w-28">
          <div className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
            Bước {completedSteps}/{totalSteps}
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-1 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isPeriodic ? 'bg-blue-600' : 'bg-amber-500'}`}
              style={{ width: `${totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0}%` }}
            ></div>
          </div>
          {totalChecklist > 0 && (
            <div className="text-[9px] text-slate-400 mt-0.5 flex items-center justify-center space-x-0.5">
              <CheckSquare className="h-2.5 w-2.5" />
              <span>{completedChecklist}/{totalChecklist}</span>
            </div>
          )}
        </td>

        {/* Status */}
        <td className="py-2.5 px-3 align-top text-center w-28">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border inline-block ${STATUS_LABELS[task.status]?.bg} ${STATUS_LABELS[task.status]?.text} ${STATUS_LABELS[task.status]?.border}`}>
            {STATUS_LABELS[task.status]?.label}
          </span>
        </td>

        {/* Quick Action */}
        <td className="py-2.5 px-2 align-middle text-right w-12">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectTask(task);
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
            title="Mở bảng kiểm soát và thực hiện công việc"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </td>
      </tr>
    );
  };

  const totalPeriodicInGroups = rawCustomerGroups.reduce((s, g) => s + g.periodicTasks.length, 0);
  const totalAdhocInGroups = rawCustomerGroups.reduce((s, g) => s + g.adhocTasks.length, 0);
  const totalOverdueInGroups = rawCustomerGroups.reduce((s, g) => s + g.overdueCount, 0);
  const totalTaxRiskInGroups = rawCustomerGroups.reduce((s, g) => s + g.taxRiskCount, 0);

  return (
    <div className="space-y-3.5">
      {/* 1. SUMMARY METRIC STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Doanh nghiệp có việc</div>
            <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">{rawCustomerGroups.length} <span className="text-xs font-normal text-slate-500">khách hàng</span></div>
          </div>
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Building2 className="h-4 w-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Khối Việc Định Kỳ</div>
            <div className="text-base font-black text-blue-600 dark:text-blue-400 mt-0.5">{totalPeriodicInGroups} <span className="text-xs font-normal text-slate-500">nhiệm vụ gói</span></div>
          </div>
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Calendar className="h-4 w-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Khối Việc Phát Sinh</div>
            <div className="text-base font-black text-amber-600 dark:text-amber-400 mt-0.5">{totalAdhocInGroups} <span className="text-xs font-normal text-slate-500">việc dịch vụ</span></div>
          </div>
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Zap className="h-4 w-4 fill-amber-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cần chú ý / Quá hạn</div>
            <div className="text-base font-black text-red-600 dark:text-red-400 mt-0.5">{totalOverdueInGroups} <span className="text-xs font-normal text-slate-500">việc quá hạn</span></div>
          </div>
          <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* 2. CUSTOMER QUICK FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 dark:bg-slate-850/80 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar text-xs">
          <button
            type="button"
            onClick={() => setCustomerFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              customerFilter === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            Tất cả doanh nghiệp ({rawCustomerGroups.length})
          </button>

          {totalOverdueInGroups > 0 && (
            <button
              type="button"
              onClick={() => setCustomerFilter('OVERDUE_ONLY')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                customerFilter === 'OVERDUE_ONLY'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900'
              }`}
            >
              🚨 Có việc quá hạn ({rawCustomerGroups.filter(g => g.overdueCount > 0).length})
            </button>
          )}

          {totalTaxRiskInGroups > 0 && (
            <button
              type="button"
              onClick={() => setCustomerFilter('TAX_RISK_ONLY')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                customerFilter === 'TAX_RISK_ONLY'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-900'
              }`}
            >
              ⚖️ Có rủi ro thuế ({rawCustomerGroups.filter(g => g.taxRiskCount > 0).length})
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative w-full sm:w-64">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Lọc tên KH, MST, nhân viên..."
              className="w-full pl-8 pr-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
            />
            {customerSearch && (
              <button 
                onClick={() => setCustomerSearch('')} 
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-slate-500 shrink-0">
            <button
              type="button"
              onClick={handleExpandAll}
              className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium cursor-pointer hover:underline"
            >
              Mở hết
            </button>
            <span>/</span>
            <button
              type="button"
              onClick={handleCollapseAll}
              className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium cursor-pointer hover:underline"
            >
              Thu hết
            </button>
          </div>
        </div>
      </div>

      {/* 3. CUSTOMER ACCORDION / GROUP CARDS */}
      <div className="space-y-3">
        {customerGroups.map((group) => {
          const isExpanded = expandedGroups[group.customerId] !== undefined ? expandedGroups[group.customerId] : true;
          const isInternal = group.customerId === 'INTERNAL';

          return (
            <div
              key={group.customerId}
              className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all shadow-xs overflow-hidden ${
                group.overdueCount > 0 
                  ? 'border-red-300 dark:border-red-900/60 ring-1 ring-red-200 dark:ring-red-900/30' 
                  : group.taxRiskCount > 0
                  ? 'border-orange-300 dark:border-orange-900/60'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Customer Card Header Bar */}
              <div 
                onClick={() => handleToggleExpand(group.customerId)}
                className={`p-3 sm:p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 cursor-pointer select-none transition-colors ${
                  isExpanded 
                    ? 'bg-gradient-to-r from-slate-50 via-blue-50/20 to-white dark:from-slate-850 dark:via-slate-850 dark:to-slate-900 border-b border-slate-200/80 dark:border-slate-800' 
                    : 'hover:bg-slate-50/70 dark:hover:bg-slate-850/50'
                }`}
              >
                {/* Left: Customer Info */}
                <div className="flex items-start space-x-3 min-w-0">
                  <div className={`p-2 rounded-xl shrink-0 mt-0.5 shadow-xs ${
                    isInternal 
                      ? 'bg-slate-800 text-white'
                      : group.overdueCount > 0 
                      ? 'bg-red-600 text-white' 
                      : group.taxRiskCount > 0
                      ? 'bg-orange-500 text-white'
                      : 'bg-blue-600 text-white'
                  }`}>
                    {isInternal ? <Layers className="h-4 w-4" /> : <Building className="h-4 w-4" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 
                        onClick={(e) => {
                          if (group.customer && onSelectCustomer) {
                            e.stopPropagation();
                            onSelectCustomer(group.customer);
                          }
                        }}
                        className={`text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight ${
                          group.customer && onSelectCustomer ? 'hover:text-blue-600 dark:hover:text-blue-400 hover:underline' : ''
                        }`}
                        title={group.customer ? "Bấm để mở hồ sơ 360° Khách hàng" : undefined}
                      >
                        {group.customerName}
                      </h3>

                      {group.customerTaxCode && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[11px] font-bold">
                          MST: {group.customerTaxCode}
                        </span>
                      )}

                      {!isInternal && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold border border-blue-200 dark:border-blue-800">
                          {group.servicePackage}
                        </span>
                      )}

                      {!isInternal && group.taxDeclarationCycle && (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold border border-indigo-200 dark:border-indigo-800">
                          Kỳ: {group.taxDeclarationCycle === 'THANG' ? 'Tháng' : 'Quý'}
                        </span>
                      )}
                    </div>

                    {/* Staff & Reviewer sub-line */}
                    <div className="flex items-center gap-3 mt-1 text-slate-500 dark:text-slate-400 text-xs flex-wrap">
                      <span className="flex items-center space-x-1">
                        <span className="text-slate-400">Phụ trách:</span>
                        <strong className="text-slate-800 dark:text-slate-200 font-semibold">{group.assignedStaffName}</strong>
                      </span>

                      <span className="text-slate-300 dark:text-slate-700">•</span>

                      <span className="flex items-center space-x-1">
                        <span className="text-slate-400">Soát xét:</span>
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{group.reviewerStaffName}</span>
                      </span>

                      {group.industry && (
                        <>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span className="text-slate-500 italic text-[11px]">{group.industry}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Metrics Badges & Direct Actions */}
                <div className="flex items-center space-x-2.5 flex-wrap justify-between lg:justify-end shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                  
                  {/* Progress & Badge metrics */}
                  <div className="flex items-center space-x-2">
                    {/* Periodic count */}
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-black">
                      <Calendar className="h-3 w-3" />
                      <span>{group.periodicTasks.length} Định kỳ</span>
                    </span>

                    {/* Ad-hoc count */}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black border ${
                      group.adhocTasks.length > 0
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-slate-200 dark:border-slate-700'
                    }`}>
                      <Zap className="h-3 w-3 fill-amber-500" />
                      <span>{group.adhocTasks.length} Phát sinh</span>
                    </span>

                    {/* Overdue alert if any */}
                    {group.overdueCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800 text-xs font-black animate-pulse">
                        <AlertTriangle className="h-3 w-3" />
                        <span>{group.overdueCount} Quá hạn</span>
                      </span>
                    )}

                    {/* Completion status */}
                    <div className="hidden sm:flex flex-col items-end min-w-[90px]">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {group.completedCount}/{group.totalCount} xong ({group.progressPercent}%)
                      </span>
                      <div className="w-20 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-0.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            group.progressPercent === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${group.progressPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                    {group.customer && onSelectCustomer && (
                      <button
                        type="button"
                        onClick={() => onSelectCustomer(group.customer!)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all shadow-xs flex items-center space-x-1 cursor-pointer"
                        title="Xem Hồ sơ 360° Doanh nghiệp & Lịch sử Thuế"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span className="hidden sm:inline">Hồ sơ 360°</span>
                      </button>
                    )}

                    {group.customer && onOpenCreateTaskForCustomer && (
                      <button
                        type="button"
                        onClick={() => onOpenCreateTaskForCustomer(group.customer!)}
                        className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/80 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold transition-all shadow-xs flex items-center space-x-1 cursor-pointer"
                        title="Thêm công việc hoặc dịch vụ phát sinh cho khách hàng này"
                      >
                        <Plus className="h-3 w-3" />
                        <span className="hidden sm:inline">+ Việc mới</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleToggleExpand(group.customerId)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                      title={isExpanded ? 'Thu gọn' : 'Mở rộng'}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>

                </div>
              </div>

              {/* Customer Tasks Content (Expanded) */}
              {isExpanded && (
                <div className="p-3 sm:p-3.5 space-y-3.5 bg-white dark:bg-slate-900">
                  
                  {/* SUB-SECTION A: KHỐI CÔNG VIỆC ĐỊNH KỲ (THEO GÓI) */}
                  {group.periodicTasks.length > 0 && (
                    <div className="rounded-xl border border-blue-100 dark:border-blue-900/50 overflow-hidden shadow-2xs">
                      <div className="px-3.5 py-2 bg-gradient-to-r from-blue-50/90 via-blue-50/40 to-white dark:from-slate-850 dark:to-slate-900 border-b border-blue-100 dark:border-blue-900/40 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="p-1 bg-blue-600 text-white rounded-md">
                            <Calendar className="h-3.5 w-3.5" />
                          </div>
                          <h4 className="text-xs font-black text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                            Khối Công Việc Định Kỳ (Theo Gói Dịch Vụ)
                          </h4>
                          <span className="px-2 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-mono font-bold text-[10px]">
                            {group.periodicTasks.length} VIỆC
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Xong: <strong className="text-emerald-600 font-bold">{group.periodicTasks.filter(t => t.status === 'HOAN_THANH').length}</strong> / {group.periodicTasks.length}
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-50/80 dark:bg-slate-850 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                            <tr>
                              <th className="py-2 px-3 w-28">Mã việc</th>
                              <th className="py-2 px-3 min-w-[240px]">Nội dung nhiệm vụ & Kỳ thuế</th>
                              <th className="py-2 px-3 w-32">Phụ trách & Duyệt</th>
                              <th className="py-2 px-3 w-36">Hạn nộp pháp lý</th>
                              <th className="py-2 px-3 w-24 text-center">Rủi ro thuế</th>
                              <th className="py-2 px-3 w-28 text-center">Tiến độ</th>
                              <th className="py-2 px-3 w-28 text-center">Trạng thái</th>
                              <th className="py-2 px-2 w-10"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {group.periodicTasks.map(t => renderTaskRow(t, true))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* SUB-SECTION B: KHỐI CÔNG VIỆC PHÁT SINH (THEO YÊU CẦU & 49 DỊCH VỤ) */}
                  {group.adhocTasks.length > 0 && (
                    <div className="rounded-xl border border-amber-200/80 dark:border-amber-900/50 overflow-hidden shadow-2xs">
                      <div className="px-3.5 py-2 bg-gradient-to-r from-amber-50/90 via-orange-50/40 to-white dark:from-slate-850 dark:to-slate-900 border-b border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="p-1 bg-amber-500 text-slate-950 rounded-md">
                            <Zap className="h-3.5 w-3.5 fill-slate-950" />
                          </div>
                          <h4 className="text-xs font-black text-amber-950 dark:text-amber-200 uppercase tracking-wider">
                            Khối Công Việc Phát Sinh (Theo Yêu Cầu & 49 Dịch Vụ)
                          </h4>
                          <span className="px-2 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 font-mono font-bold text-[10px]">
                            {group.adhocTasks.length} VIỆC
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Xong: <strong className="text-emerald-600 font-bold">{group.adhocTasks.filter(t => t.status === 'HOAN_THANH').length}</strong> / {group.adhocTasks.length}
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-50/80 dark:bg-slate-850 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                            <tr>
                              <th className="py-2 px-3 w-28">Mã việc</th>
                              <th className="py-2 px-3 min-w-[240px]">Dịch vụ phát sinh & Phí</th>
                              <th className="py-2 px-3 w-32">Phụ trách & Duyệt</th>
                              <th className="py-2 px-3 w-36">Hạn hoàn thành</th>
                              <th className="py-2 px-3 w-24 text-center">Rủi ro pháp lý</th>
                              <th className="py-2 px-3 w-28 text-center">Tiến độ</th>
                              <th className="py-2 px-3 w-28 text-center">Trạng thái</th>
                              <th className="py-2 px-2 w-10"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {group.adhocTasks.map(t => renderTaskRow(t, false))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Empty state within customer if no tasks */}
                  {group.periodicTasks.length === 0 && group.adhocTasks.length === 0 && (
                    <div className="py-6 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-850/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                      Không có công việc nào đang chờ thực hiện cho khách hàng này.
                    </div>
                  )}

                  {/* Helpful Quick Footer Note */}
                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                    <div className="flex items-center space-x-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Bấm vào từng dòng việc để mở bảng chi tiết, checklist kiểm soát & bằng chứng hoàn thành.</span>
                    </div>

                    {group.customer && onOpenCreateTaskForCustomer && (
                      <button
                        type="button"
                        onClick={() => onOpenCreateTaskForCustomer(group.customer!)}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                      >
                        + Giao thêm việc cho {group.customer.name}
                      </button>
                    )}
                  </div>

                </div>
              )}

            </div>
          );
        })}

        {customerGroups.length === 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
            <AlertTriangle className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Không tìm thấy khách hàng hoặc công việc nào</h4>
            <p className="text-xs text-slate-400 mt-1">Vui lòng điều chỉnh tiêu chí tìm kiếm hoặc bộ lọc trạng thái để xem dữ liệu.</p>
          </div>
        )}
      </div>
    </div>
  );
};

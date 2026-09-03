import React, { useState, useMemo, useEffect } from 'react';
import { Customer, Task, User, TaskStatus, TaskPriority, TaskRiskLevel, Department } from '../../types';
import { 
  Search, 
  Filter, 
  LayoutList, 
  Kanban, 
  Calendar as CalendarIcon, 
  Building, 
  Building2,
  UserCheck, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Plus, 
  ArrowUpDown,
  ChevronRight,
  ShieldAlert,
  Paperclip,
  CheckSquare,
  Zap,
  Calendar,
  Layers,
  DollarSign,
  Tag,
  FileSpreadsheet,
  ListFilter,
  Users
} from 'lucide-react';
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
import { WeeklyTaskReportModal } from './WeeklyTaskReportModal';
import { PermissionService } from '../../utils/permissions';
import { CustomerGroupedTaskList } from './CustomerGroupedTaskList';

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

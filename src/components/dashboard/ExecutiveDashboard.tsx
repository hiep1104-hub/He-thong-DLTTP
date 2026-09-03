import React, { useState, useMemo, useEffect } from 'react';
import { Customer, Task, User, StaffKPIRecord } from '../../types';
import { 
  Building, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  FileText, 
  UserCheck, 
  ArrowRight,
  TrendingUp,
  AlertCircle,
  FileCheck,
  Zap,
  Users2,
  Calendar,
  DollarSign,
  Briefcase,
  Layers,
  ChevronRight,
  Sparkles,
  PieChart,
  Activity,
  Award,
  ShieldCheck,
  FileSpreadsheet,
  ArrowUpRight,
  BellRing,
  RefreshCw,
  KeyRound,
  Receipt,
  Scale,
  Search,
  Filter,
  Check,
  Plus
} from 'lucide-react';
import { storageService, CURRENT_SYSTEM_DATE } from '../../services/storageService';
import { formatCurrency, formatDate, RISK_LABELS, STATUS_LABELS } from '../../utils/formatters';
import { PermissionService } from '../../utils/permissions';
import { WorkbenchHeader, WorkbenchArchetype } from './WorkbenchHeader';
import { RoleMetricCards } from './RoleMetricCards';
import { TaxObligationMiniRadar } from './TaxObligationMiniRadar';
import { DailyQuickNotes } from './DailyQuickNotes';
import { QuickLeaveAndTripModal } from './QuickLeaveAndTripModal';

interface ExecutiveDashboardProps {
  tasks: Task[];
  customers: Customer[];
  users: User[];
  staffKPIs: StaffKPIRecord[];
  currentUser?: User;
  onSelectTask: (task: Task) => void;
  onSelectCustomer: (customer: Customer) => void;
  onNavigateToTasks: (filterPreset?: string) => void;
  onNavigateToTab?: (tab: string) => void;
  onOpenRenewalCenter?: () => void;
  onOpenCreateTask?: () => void;
  onDataReload?: () => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  tasks,
  customers,
  users,
  staffKPIs,
  currentUser,
  onSelectTask,
  onSelectCustomer,
  onNavigateToTasks,
  onNavigateToTab,
  onOpenRenewalCenter,
  onOpenCreateTask,
  onDataReload,
}) => {
  // Determine default archetype based on role, department, and position
  const defaultArchetype: WorkbenchArchetype = useMemo(() => {
    if (!currentUser) return 'EXECUTIVE';
    if (currentUser.role === 'BAN_GIAM_DOC' || currentUser.role === 'ADMIN') return 'EXECUTIVE';
    if (currentUser.role === 'TRUONG_PHONG' || currentUser.role === 'TRUONG_NHOM') {
      if (currentUser.department === 'HANH_CHINH_NHAN_SU') return 'HR_PAYROLL';
      if (currentUser.department === 'KINH_DOANH_CSKH') return 'SALES_DEBT';
      return 'MANAGER_REVIEWER';
    }
    
    // NHAN_VIEN
    const pos = (currentUser.position || '').toLowerCase();
    const dept = currentUser.department;
    if (dept === 'HANH_CHINH_NHAN_SU' || pos.includes('nhân sự') || pos.includes('tiền lương') || pos.includes('bhxh') || pos.includes('c&b')) {
      return 'HR_PAYROLL';
    }
    if (pos.includes('pháp lý') || pos.includes('đkkd') || pos.includes('giấy phép')) {
      return 'LEGAL';
    }
    if (dept === 'KINH_DOANH_CSKH' || pos.includes('kinh doanh') || pos.includes('sales') || pos.includes('cskh') || pos.includes('công nợ')) {
      return 'SALES_DEBT';
    }
    if (pos.includes('chữ ký số') || pos.includes('token') || pos.includes('văn thư')) {
      return 'TOKEN_ARCHIVE';
    }
    return 'TAX_SPECIALIST';
  }, [currentUser]);

  const [activeArchetype, setActiveArchetype] = useState<WorkbenchArchetype>(defaultArchetype);
  const [taskFilterTab, setTaskFilterTab] = useState<'PRIORITY' | 'PENDING_REVIEW' | 'MY_TASKS' | 'TAX_TASKS'>('PRIORITY');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLeaveAndTripModalOpen, setIsLeaveAndTripModalOpen] = useState(false);
  const [hrSyncVersion, setHrSyncVersion] = useState(0);

  // Subscribe to realtime sync for HR & Leave/Trip data updates
  useEffect(() => {
    const unsub = storageService.subscribeToSync(() => {
      setHrSyncVersion(v => v + 1);
    });
    return () => unsub();
  }, []);

  // Check permissions
  const canSeeFinancials = PermissionService.canViewFinancials(currentUser);
  const canViewAllCustomers = PermissionService.canViewAllCustomers(currentUser);
  const canViewAllProfiles = PermissionService.canViewAllProfiles(currentUser);
  const canSwitchPerspective = currentUser?.role === 'ADMIN' || currentUser?.role === 'BAN_GIAM_DOC' || currentUser?.role === 'TRUONG_PHONG';
  const canReviewLeave = PermissionService.canReviewLeave(currentUser) || canSwitchPerspective;

  // Load HR data synchronized with hrSyncVersion
  const allEmployees = useMemo(() => storageService.getEmployees(), [hrSyncVersion]);
  const employees = useMemo(() => canViewAllProfiles ? allEmployees : allEmployees.filter(e => e.id === currentUser?.id), [canViewAllProfiles, allEmployees, currentUser?.id]);
  const leaveRequests = useMemo(() => canViewAllProfiles ? storageService.getLeaveRequests() : storageService.getLeaveRequests().filter(l => l.employeeId === currentUser?.id), [canViewAllProfiles, currentUser?.id, hrSyncVersion]);
  const businessTrips = useMemo(() => canViewAllProfiles ? storageService.getBusinessTrips() : storageService.getBusinessTrips().filter(t => t.employeeId === currentUser?.id), [canViewAllProfiles, currentUser?.id, hrSyncVersion]);
  const payrollRecords = useMemo(() => canSeeFinancials ? storageService.getPayrollRecords() : [], [canSeeFinancials, hrSyncVersion]);

  // Unified stats & Count for quick action button: Nghỉ phép & Công tác
  const leaveAndTripStats = useMemo(() => {
    return storageService.getLeaveAndTripStats(currentUser);
  }, [currentUser, hrSyncVersion]);

  const leaveAndTripCount = leaveAndTripStats.effectiveBadgeCount;

  // Filter Tasks & Customers for current user
  const myTasks = useMemo(() => {
    if (!currentUser) return tasks;
    return tasks.filter(t => 
      t.assigneeId === currentUser.id || 
      t.reviewerId === currentUser.id || 
      t.approverId === currentUser.id
    );
  }, [tasks, currentUser]);

  const myCustomers = useMemo(() => {
    if (!currentUser) return customers;
    
    // Direct assigned accountant, reviewer, support team, or customer involved in user's tasks
    const directAssigned = customers.filter(c => 
      c.assignedStaffId === currentUser.id || 
      c.reviewerStaffId === currentUser.id || 
      (c.supportStaffIds && c.supportStaffIds.includes(currentUser.id)) ||
      tasks.some(t => t.customerId === c.id && (
        t.assigneeId === currentUser.id || 
        t.reviewerId === currentUser.id || 
        t.approverId === currentUser.id
      ))
    );

    // If user has view-all administrative privileges (BOD, Admin, Manager) and doesn't have a direct 1-1 assignment,
    // show active customer portfolio so metrics & workspace cards reflect company data
    if (directAssigned.length === 0 && (
      currentUser.role === 'ADMIN' || 
      currentUser.role === 'BAN_GIAM_DOC' || 
      currentUser.role === 'TRUONG_PHONG'
    )) {
      return customers;
    }

    return directAssigned;
  }, [customers, currentUser, tasks]);

  // Expiring cycles
  const rawCycles = storageService.getAllSystemExpiringCycles();
  const allCycles = PermissionService.filterExpiringCycles(rawCycles, currentUser, storageService.getCustomers());
  const urgentCycles = allCycles.filter(c => c.status === 'EXPIRED' || c.status === 'CRITICAL_15' || c.status === 'WARNING_30');
  const expiredCycles = allCycles.filter(c => c.status === 'EXPIRED');
  const criticalCycles = allCycles.filter(c => c.status === 'CRITICAL_15');
  const warningCycles = allCycles.filter(c => c.status === 'WARNING_30');

  // Filtered task queue & scope
  const isSpecialistOrStaff = activeArchetype === 'TAX_SPECIALIST' || currentUser?.role === 'NHAN_VIEN';
  const taskScope = isSpecialistOrStaff ? myTasks : tasks;

  const overdueCount = taskScope.filter(t => t.status !== 'HOAN_THANH' && t.status !== 'HUY' && storageService.getTaskDeadlineStatus(t).isOverdue).length;
  const pendingReviewCount = taskScope.filter(t => t.status === 'CHO_KIEM_TRA' || t.status === 'CHO_PHE_DUYET').length;
  const approvedTasksCount = taskScope.filter(t => t.status === 'HOAN_THANH' || t.approvalDecision === 'APPROVED').length;
  const modificationTasksCount = taskScope.filter(t => t.approvalDecision === 'MODIFICATION_REQUESTED' || (t.status === 'DANG_THUC_HIEN' && Boolean(t.approvalNotes))).length;
  const urgentCount = taskScope.filter(t => (t.priority === 'KHAN_CAP' || t.priority === 'CAO') && t.status !== 'HOAN_THANH').length;

  // HR events (leave & trips)
  const myLeavesList = leaveRequests.filter(l => l.employeeId === currentUser?.id);
  const myTripsList = businessTrips.filter(t => t.employeeId === currentUser?.id);
  const myPendingHREvents = myLeavesList.filter(l => l.status === 'CHO_DUYET').length + myTripsList.filter(t => t.status === 'CHO_DUYET').length;
  const myApprovedHREvents = myLeavesList.filter(l => l.status === 'DA_DUYET').length + myTripsList.filter(t => t.status === 'DA_DUYET' || t.status === 'HOAN_THANH').length;
  const relevantHREvents = isSpecialistOrStaff 
    ? [...myLeavesList.map(l => ({ ...l, itemType: 'LEAVE' as const })), ...myTripsList.map(t => ({ ...t, itemType: 'TRIP' as const }))]
    : [...leaveRequests.map(l => ({ ...l, itemType: 'LEAVE' as const })), ...businessTrips.map(t => ({ ...t, itemType: 'TRIP' as const }))];

  const searchedHREvents = useMemo(() => {
    if (!searchQuery.trim()) return relevantHREvents;
    const q = searchQuery.toLowerCase();
    return relevantHREvents.filter(item => {
      const desc = item.itemType === 'LEAVE' ? (item as any).reason : (item as any).purpose;
      return (
        (item.employeeName && item.employeeName.toLowerCase().includes(q)) ||
        (desc && desc.toLowerCase().includes(q))
      );
    });
  }, [relevantHREvents, searchQuery]);

  const filteredTasks = useMemo(() => {
    let list = tasks;
    
    // In specialist mode, default to my tasks
    if (activeArchetype === 'TAX_SPECIALIST') {
      list = myTasks;
    }

    if (taskFilterTab === 'PRIORITY') {
      list = list.filter(t => {
        if (t.status === 'HOAN_THANH' || t.status === 'HUY') return false;
        const deadline = storageService.getTaskDeadlineStatus(t);
        return deadline.isOverdue || t.priority === 'KHAN_CAP' || t.priority === 'CAO' || t.status === 'CHO_PHE_DUYET' || t.status === 'CHO_KIEM_TRA';
      });
    } else if (taskFilterTab === 'PENDING_REVIEW') {
      // Gôm tất cả hồ sơ: Chờ duyệt, Đã duyệt & Yêu cầu sửa vào cùng 1 tab
      list = list.filter(t => 
        t.status === 'CHO_KIEM_TRA' || 
        t.status === 'CHO_PHE_DUYET' || 
        t.status === 'HOAN_THANH' || 
        t.approvalDecision === 'APPROVED' || 
        t.approvalDecision === 'MODIFICATION_REQUESTED' ||
        (t.status === 'DANG_THUC_HIEN' && Boolean(t.approvalNotes))
      );
    } else if (taskFilterTab === 'MY_TASKS') {
      list = myTasks.filter(t => t.status !== 'HOAN_THANH' && t.status !== 'HUY');
    } else if (taskFilterTab === 'TAX_TASKS') {
      list = list.filter(t => t.isTaxObligation);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t => 
        t.title.toLowerCase().includes(q) || 
        t.code.toLowerCase().includes(q) || 
        (t.customerName && t.customerName.toLowerCase().includes(q))
      );
    }

    return list;
  }, [tasks, myTasks, activeArchetype, taskFilterTab, searchQuery]);

  const totalDossierCount = useMemo(() => {
    return filteredTasks.length + relevantHREvents.length;
  }, [filteredTasks.length, relevantHREvents.length]);

  const highRiskCustomers = customers.filter(c => c.riskLevel === 'CAO' || c.riskLevel === 'NGUY_CO_PHAP_LY');
  const activeCustomers = customers.filter(c => c.contractStatus === 'HIEU_LUC');

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. WORKBENCH HEADER & ROLE CONTEXT BANNER */}
      <WorkbenchHeader
        currentUser={currentUser}
        activeArchetype={activeArchetype}
        onSelectArchetype={setActiveArchetype}
        urgentTasksCount={urgentCount}
        overdueTasksCount={overdueCount}
        pendingReviewCount={pendingReviewCount}
        myCustomersCount={myCustomers.length}
        onOpenCreateTask={onOpenCreateTask}
        onNavigateToTab={onNavigateToTab}
        onOpenRenewalCenter={onOpenRenewalCenter}
        canSwitchPerspective={canSwitchPerspective}
        onOpenLeaveAndTripModal={() => setIsLeaveAndTripModalOpen(true)}
        leaveAndTripCount={leaveAndTripCount}
      />

      {/* 2. TOP 4 DYNAMIC METRIC CARDS TAILORED FOR ACTIVE POSITION */}
      <RoleMetricCards
        archetype={activeArchetype}
        tasks={tasks}
        myTasks={myTasks}
        customers={customers}
        myCustomers={myCustomers}
        employees={employees}
        leaveRequests={leaveRequests}
        businessTrips={businessTrips}
        payrollRecords={payrollRecords}
        allCycles={allCycles}
        canSeeFinancials={canSeeFinancials}
        onNavigateToTasks={onNavigateToTasks}
        onNavigateToTab={onNavigateToTab}
        onOpenRenewalCenter={onOpenRenewalCenter}
      />

      {/* 3. MAIN WORK QUEUE & ACTION CENTER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT 2 COLS: HÀNG ĐỢI CÔNG VIỆC TỐI ƯU HÓA CHO VỊ TRÍ */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          
          {/* Header & Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {activeArchetype === 'TAX_SPECIALIST' ? 'Hàng Đợi Công Việc Cá Nhân' : 'Hàng Đợi Công Việc & Phê Duyệt'}
                </h2>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                  {filteredTasks.length} việc
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeArchetype === 'TAX_SPECIALIST' 
                  ? 'Ưu tiên xử lý các việc khẩn cấp, quá hạn và hồ sơ khách hàng được phân công'
                  : 'Theo dõi các đầu việc trọng điểm, tờ khai thuế đến hạn và hồ sơ chờ kiểm duyệt'}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => onNavigateToTasks()}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center space-x-1"
              >
                <span>Toàn bộ kho việc</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
              <button
                type="button"
                onClick={() => setTaskFilterTab('PRIORITY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  taskFilterTab === 'PRIORITY'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                ⚡ Ưu tiên & Khẩn cấp
              </button>

              <button
                type="button"
                onClick={() => setTaskFilterTab('PENDING_REVIEW')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                  taskFilterTab === 'PENDING_REVIEW'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>🔍 Tất cả hồ sơ</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                  {totalDossierCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTaskFilterTab('MY_TASKS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  taskFilterTab === 'MY_TASKS'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                👤 Việc của tôi ({myTasks.filter(t => t.status !== 'HOAN_THANH').length})
              </button>

              <button
                type="button"
                onClick={() => setTaskFilterTab('TAX_TASKS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  taskFilterTab === 'TAX_TASKS'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                📅 Tờ khai thuế
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm nhanh theo tên, MST, mã việc..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-56 pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Unified Dossier Indicator when PENDING_REVIEW is active */}
          {taskFilterTab === 'PENDING_REVIEW' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-purple-50/70 dark:bg-purple-950/25 border border-purple-100 dark:border-purple-900/40 rounded-xl text-xs">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded-lg font-bold bg-purple-600 text-white shadow-xs">
                  Tất cả hồ sơ ({totalDossierCount})
                </span>
                <span className="text-[11px] text-purple-800 dark:text-purple-300">
                  Tổng hợp toàn bộ việc chờ duyệt, đã chấp thuận & đơn từ công tác
                </span>
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-orange-600 dark:text-orange-400">{pendingReviewCount} chờ duyệt</span>
                <span>•</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{approvedTasksCount} đã duyệt</span>
                {relevantHREvents.length > 0 && (
                  <>
                    <span>•</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{relevantHREvents.length} đơn từ</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Task Items / HR Event List */}
          <div className="space-y-2.5 pt-1">
            {taskFilterTab === 'PENDING_REVIEW' ? (
              /* Unified List of All Dossier Records: Tasks + HR Events */
              <>
                {/* 1. Tasks in Dossier */}
                {filteredTasks.slice(0, 8).map(t => {
                  const deadlineInfo = storageService.getTaskDeadlineStatus(t);
                  const isApproved = t.status === 'HOAN_THANH' || t.approvalDecision === 'APPROVED';
                  const isPendingApprover = t.status === 'CHO_PHE_DUYET';
                  const isPendingReviewer = t.status === 'CHO_KIEM_TRA';
                  const isModRequired = t.approvalDecision === 'MODIFICATION_REQUESTED';

                  return (
                    <div
                      key={t.id}
                      onClick={() => onSelectTask(t)}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 hover:bg-blue-50/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 shrink-0">{t.code}</span>
                          <span className="font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {t.title}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-500 dark:text-slate-400 text-[11px] mt-1.5">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {t.customerName || 'Nội bộ công ty'}
                          </span>
                          <span>•</span>
                          <span>Phụ trách: <strong>{t.assigneeName}</strong></span>
                          {t.reviewerName && (
                            <>
                              <span>•</span>
                              <span>Kiểm soát: {t.reviewerName}</span>
                            </>
                          )}
                          <span>•</span>
                          <span className={deadlineInfo.isOverdue ? 'text-red-600 font-bold' : 'text-slate-600 dark:text-slate-400'}>
                            Hạn: {formatDate(t.dueDate)}
                          </span>
                        </div>

                        {/* Approval / Review Notice line for Employee */}
                        {isApproved && (
                          <div className="mt-1.5 flex items-center space-x-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50/80 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60 w-fit">
                            <CheckCircle2 className="h-3 w-3 shrink-0" />
                            <span>Sếp đã chấp thuận & Nghiệm thu: {t.approvedByName || t.approverName || 'Ban Giám Đốc'}</span>
                            {t.approvalNotes && <span className="text-slate-500 dark:text-slate-400 font-normal italic">("{t.approvalNotes}")</span>}
                          </div>
                        )}

                        {isPendingApprover && (
                          <div className="mt-1.5 flex items-center space-x-1.5 text-[11px] text-orange-700 dark:text-orange-400 font-semibold bg-orange-50/80 dark:bg-orange-950/40 px-2 py-0.5 rounded-md border border-orange-200/60 dark:border-orange-800/60 w-fit">
                            <Clock className="h-3 w-3 shrink-0" />
                            <span>Đang trình Ban Giám Đốc ký duyệt ({t.approverName || 'Ban Giám Đốc'})</span>
                          </div>
                        )}

                        {isPendingReviewer && (
                          <div className="mt-1.5 flex items-center space-x-1.5 text-[11px] text-purple-700 dark:text-purple-400 font-semibold bg-purple-50/80 dark:bg-purple-950/40 px-2 py-0.5 rounded-md border border-purple-200/60 dark:border-purple-800/60 w-fit">
                            <FileCheck className="h-3 w-3 shrink-0" />
                            <span>Đang chờ soát xét ({t.reviewerName || 'Kiểm soát viên'})</span>
                          </div>
                        )}

                        {isModRequired && (
                          <div className="mt-1.5 flex items-center space-x-1.5 text-[11px] text-rose-700 dark:text-rose-400 font-semibold bg-rose-50/80 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200/60 dark:border-rose-800/60 w-fit">
                            <AlertTriangle className="h-3 w-3 shrink-0" />
                            <span>Sếp yêu cầu sửa: "{t.approvalNotes || 'Kiểm tra lại số liệu'}"</span>
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 flex items-center space-x-2 self-end sm:self-center">
                        {t.priority === 'KHAN_CAP' && (
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                            Khẩn cấp
                          </span>
                        )}

                        <span className={`text-[10px] px-2.5 py-0.5 rounded font-bold ${
                          isApproved ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' :
                          t.status === 'CHO_PHE_DUYET' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300' :
                          t.status === 'CHO_KIEM_TRA' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                        }`}>
                          {isApproved ? 'Đã Chấp Thuận' : (STATUS_LABELS[t.status]?.label || t.status)}
                        </span>

                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  );
                })}

                {/* 2. HR Events in Dossier */}
                {searchedHREvents.slice(0, 6).map((item, idx) => (
                  <div
                    key={`hr-${idx}`}
                    onClick={() => setIsLeaveAndTripModalOpen(true)}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 hover:bg-blue-50/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          item.itemType === 'LEAVE' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                        }`}>
                          {item.itemType === 'LEAVE' ? 'Nghỉ phép' : 'Công tác'}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white truncate">
                          {item.itemType === 'LEAVE' ? (item as any).reason : (item as any).purpose}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-500 dark:text-slate-400 text-[11px] mt-1.5">
                        <span>Nhân sự: <strong>{item.employeeName}</strong></span>
                        <span>•</span>
                        <span>Thời gian: {formatDate(item.startDate)} → {formatDate(item.endDate)}</span>
                        {item.status === 'DA_DUYET' && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              Sếp đã chấp thuận {item.approvedByName ? `(Bởi: ${item.approvedByName})` : ''}
                            </span>
                          </>
                        )}
                        {item.rejectionReason && (
                          <>
                            <span>•</span>
                            <span className="text-rose-600 font-semibold">
                              Lý do: "{item.rejectionReason}"
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center space-x-2 self-end sm:self-center">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded font-bold ${
                        item.status === 'DA_DUYET'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                          : item.status === 'CHO_DUYET'
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                      }`}>
                        {item.status === 'DA_DUYET' ? '✅ Sếp đã duyệt' : item.status === 'CHO_DUYET' ? '⏳ Chờ sếp duyệt' : '❌ Từ chối'}
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                ))}

                {/* Empty State when both are 0 */}
                {filteredTasks.length === 0 && searchedHREvents.length === 0 && (
                  <div className="py-8 px-4 text-center text-xs bg-slate-50 dark:bg-slate-850/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div className="max-w-md mx-auto space-y-1">
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                        Hiện không có hồ sơ nào chờ kiểm duyệt hoặc cần xử lý!
                      </div>
                      <div className="text-slate-500">
                        Tất cả các hồ sơ trình duyệt, đơn từ công tác và phê duyệt đã được giải quyết hoặc chưa phát sinh mới.
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => onOpenCreateTask ? onOpenCreateTask() : onNavigateToTasks()}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-xs transition-all cursor-pointer flex items-center space-x-1.5"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Tạo & Trình duyệt hồ sơ mới</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Standard Task List */
              <>
                {filteredTasks.slice(0, 6).map(t => {
                  const deadlineInfo = storageService.getTaskDeadlineStatus(t);
                  const isApproved = t.status === 'HOAN_THANH' || t.approvalDecision === 'APPROVED';
                  const isPendingApprover = t.status === 'CHO_PHE_DUYET';
                  const isPendingReviewer = t.status === 'CHO_KIEM_TRA';
                  const isModRequired = t.approvalDecision === 'MODIFICATION_REQUESTED';

                  return (
                    <div
                      key={t.id}
                      onClick={() => onSelectTask(t)}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 hover:bg-blue-50/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 shrink-0">{t.code}</span>
                          <span className="font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {t.title}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-500 dark:text-slate-400 text-[11px] mt-1.5">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {t.customerName || 'Nội bộ công ty'}
                          </span>
                          <span>•</span>
                          <span>Phụ trách: <strong>{t.assigneeName}</strong></span>
                          {t.reviewerName && (
                            <>
                              <span>•</span>
                              <span>Kiểm soát: {t.reviewerName}</span>
                            </>
                          )}
                          <span>•</span>
                          <span className={deadlineInfo.isOverdue ? 'text-red-600 font-bold' : 'text-slate-600 dark:text-slate-400'}>
                            Hạn: {formatDate(t.dueDate)}
                          </span>
                        </div>

                        {/* Approval / Review Notice line for Employee */}
                        {isApproved && (
                          <div className="mt-1.5 flex items-center space-x-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50/80 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60 w-fit">
                            <CheckCircle2 className="h-3 w-3 shrink-0" />
                            <span>Sếp đã chấp thuận & Nghiệm thu: {t.approvedByName || t.approverName || 'Ban Giám Đốc'}</span>
                            {t.approvalNotes && <span className="text-slate-500 dark:text-slate-400 font-normal italic">("{t.approvalNotes}")</span>}
                          </div>
                        )}

                        {isPendingApprover && (
                          <div className="mt-1.5 flex items-center space-x-1.5 text-[11px] text-orange-700 dark:text-orange-400 font-semibold bg-orange-50/80 dark:bg-orange-950/40 px-2 py-0.5 rounded-md border border-orange-200/60 dark:border-orange-800/60 w-fit">
                            <Clock className="h-3 w-3 shrink-0" />
                            <span>Đang trình Ban Giám Đốc ký duyệt ({t.approverName || 'Ban Giám Đốc'})</span>
                          </div>
                        )}

                        {isPendingReviewer && (
                          <div className="mt-1.5 flex items-center space-x-1.5 text-[11px] text-purple-700 dark:text-purple-400 font-semibold bg-purple-50/80 dark:bg-purple-950/40 px-2 py-0.5 rounded-md border border-purple-200/60 dark:border-purple-800/60 w-fit">
                            <FileCheck className="h-3 w-3 shrink-0" />
                            <span>Đang chờ soát xét ({t.reviewerName || 'Kiểm soát viên'})</span>
                          </div>
                        )}

                        {isModRequired && (
                          <div className="mt-1.5 flex items-center space-x-1.5 text-[11px] text-rose-700 dark:text-rose-400 font-semibold bg-rose-50/80 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200/60 dark:border-rose-800/60 w-fit">
                            <AlertTriangle className="h-3 w-3 shrink-0" />
                            <span>Sếp yêu cầu sửa: "{t.approvalNotes || 'Kiểm tra lại số liệu'}"</span>
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 flex items-center space-x-2 self-end sm:self-center">
                        {t.priority === 'KHAN_CAP' && (
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                            Khẩn cấp
                          </span>
                        )}

                        <span className={`text-[10px] px-2.5 py-0.5 rounded font-bold ${
                          isApproved ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' :
                          t.status === 'CHO_PHE_DUYET' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300' :
                          t.status === 'CHO_KIEM_TRA' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                        }`}>
                          {isApproved ? 'Đã Chấp Thuận' : (STATUS_LABELS[t.status]?.label || t.status)}
                        </span>

                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  );
                })}

                {filteredTasks.length === 0 && (
                  <div className="py-8 px-4 text-center text-xs bg-slate-50 dark:bg-slate-850/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div className="max-w-md mx-auto space-y-1">
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                        Không có công việc nào trong danh mục này!
                      </div>
                      <div className="text-slate-500">
                        Tất cả các đầu việc đã được giải quyết hoặc chưa phát sinh nhiệm vụ mới.
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => onOpenCreateTask ? onOpenCreateTask() : onNavigateToTasks()}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-xs transition-all cursor-pointer flex items-center space-x-1.5"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Tạo công việc mới</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* RIGHT 1 COL: WIDGETS THEO ĐẶC THÙ VỊ TRÍ */}
        <div className="space-y-6">
          
          {/* Widget 1: My Portfolio or Team Workload */}
          {activeArchetype === 'TAX_SPECIALIST' ? (
            /* Chuyên viên: Danh sách khách hàng tôi phụ trách */
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Khách Hàng Tôi Quản Lý ({myCustomers.length})
                  </h2>
                </div>
                {onNavigateToTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateToTab('CUSTOMERS')}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Xem tất cả &rarr;
                  </button>
                )}
              </div>

              <div className="space-y-2.5 text-xs">
                {myCustomers.slice(0, 4).map(cust => (
                  <div
                    key={cust.id}
                    onClick={() => onSelectCustomer(cust)}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white truncate">{cust.name}</span>
                      <span className={`text-[10px] px-2 py-0.2 rounded font-bold ${
                        cust.riskLevel === 'CAO' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' :
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {RISK_LABELS[cust.riskLevel]?.label || cust.riskLevel}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>MST: <strong>{cust.taxCode}</strong></span>
                      {canSeeFinancials ? (
                        <span className="text-blue-600 dark:text-blue-400 font-semibold">{formatVND(cust.monthlyFee)}/tháng</span>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Gói: {cust.servicePackage}</span>
                      )}
                    </div>
                  </div>
                ))}

                {myCustomers.length === 0 && (
                  <div className="py-6 text-center text-xs text-slate-400">
                    Bạn chưa được phân công phụ trách doanh nghiệp nào.
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Ban Giám Đốc / Trưởng phòng: Phân bổ tải trọng 30 nhân sự */
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <Scale className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Tải Trọng 30 Nhân Sự
                  </h2>
                </div>
                {onNavigateToTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateToTab('OPERATIONS')}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    San tải &rarr;
                  </button>
                )}
              </div>

              {/* Workload Mini Stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50">
                  <div className="text-[10px] text-rose-600 font-bold uppercase">Quá tải</div>
                  <div className="text-base font-black text-rose-700 dark:text-rose-300 mt-0.5">
                    {storageService.getStaffWorkloadSummaries().filter(w => w.status === 'OVERLOAD').length}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
                  <div className="text-[10px] text-emerald-600 font-bold uppercase">Tối ưu</div>
                  <div className="text-base font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
                    {storageService.getStaffWorkloadSummaries().filter(w => w.status === 'OPTIMAL').length}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
                  <div className="text-[10px] text-blue-600 font-bold uppercase">Trống</div>
                  <div className="text-base font-black text-blue-700 dark:text-blue-300 mt-0.5">
                    {storageService.getStaffWorkloadSummaries().filter(w => w.status === 'AVAILABLE').length}
                  </div>
                </div>
              </div>

              <div className="space-y-2 mt-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Khách hàng rủi ro thuế cao ({highRiskCustomers.length})
                </div>
                {highRiskCustomers.slice(0, 3).map(cust => (
                  <div
                    key={cust.id}
                    onClick={() => onSelectCustomer(cust)}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all cursor-pointer text-xs"
                  >
                    <div className="font-bold text-slate-900 dark:text-white truncate">{cust.name}</div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                      <span>MST: {cust.taxCode}</span>
                      {canSeeFinancials ? (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">{formatVND(cust.monthlyFee)}/tháng</span>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Gói: {cust.servicePackage}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Widget 2: Tax Obligation Mini Radar */}
          <TaxObligationMiniRadar
            tasks={tasks}
            onNavigateToTasks={onNavigateToTasks}
            onNavigateToTab={onNavigateToTab}
          />

          {/* Widget 3: Daily Quick Notes & Scratchpad */}
          <DailyQuickNotes currentUser={currentUser} />

        </div>
      </div>

      {/* 4. RADAR CẢNH BÁO CHU KỲ HOẠT ĐỘNG & TÁI KÝ HỢP ĐỒNG HỆ THỐNG */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Cảnh Báo Chu Kỳ Hoạt Động & Tái Ký Hợp Đồng Hệ Thống
                </h2>
                {urgentCycles.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-bold text-[10px]">
                    {urgentCycles.length} chu kỳ cần hành động
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Chủ động phát hiện hợp đồng dịch vụ, chữ ký số CKS, hóa đơn điện tử & hợp đồng nhân sự sắp hết hạn
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {onOpenRenewalCenter && (
              <button
                type="button"
                onClick={onOpenRenewalCenter}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Mở Trung Tâm Tái Ký (Toàn diện)</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Urgency Counter Mini-Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-xl bg-red-50/70 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-red-600 font-bold uppercase">Đã Quá Hạn</div>
              <div className="text-lg font-black text-red-700 dark:text-red-400">{expiredCycles.length} mục</div>
            </div>
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>

          <div className="p-2.5 rounded-xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-orange-600 font-bold uppercase">Khẩn Cấp (&lt;15 Ngày)</div>
              <div className="text-lg font-black text-orange-700 dark:text-orange-400">{criticalCycles.length} mục</div>
            </div>
            <Clock className="h-5 w-5 text-orange-500" />
          </div>

          <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-amber-600 font-bold uppercase">Cảnh Báo (&lt;30 Ngày)</div>
              <div className="text-lg font-black text-amber-700 dark:text-amber-400">{warningCycles.length} mục</div>
            </div>
            <BellRing className="h-5 w-5 text-amber-500" />
          </div>

          <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-blue-600 font-bold uppercase">Tổng Chu Kỳ Quản Trị</div>
              <div className="text-lg font-black text-blue-700 dark:text-blue-400">{allCycles.length} chu kỳ</div>
            </div>
            <ShieldCheck className="h-5 w-5 text-blue-500" />
          </div>
        </div>

        {/* Urgent Cycles List */}
        <div className="space-y-2 pt-1">
          {urgentCycles.slice(0, 5).map(cycle => {
            const matchedCustomer = customers.find(c => c.id === cycle.entityId);
            return (
              <div
                key={cycle.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className={`p-2 rounded-lg shrink-0 ${
                    cycle.category === 'CUSTOMER_CONTRACT' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                    cycle.category === 'DIGITAL_SIGNATURE' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' :
                    cycle.category === 'EINVOICE_PACKAGE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' :
                    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                  }`}>
                    {cycle.category === 'CUSTOMER_CONTRACT' && <FileText className="h-4 w-4" />}
                    {cycle.category === 'DIGITAL_SIGNATURE' && <KeyRound className="h-4 w-4" />}
                    {cycle.category === 'EINVOICE_PACKAGE' && <Receipt className="h-4 w-4" />}
                    {(cycle.category === 'HR_LABOR_CONTRACT' || cycle.category === 'HR_PROBATION') && <Users2 className="h-4 w-4" />}
                    {cycle.category === 'BUSINESS_LICENSE' && <ShieldCheck className="h-4 w-4" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] px-2 py-0.2 rounded font-bold border ${cycle.badgeClass}`}>
                        {cycle.statusLabel}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white truncate">
                        {cycle.entityName}
                      </span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">
                      {cycle.title} • Hết hạn: <strong className="text-slate-800 dark:text-slate-200">{formatDate(cycle.endDate || '')}</strong> ({cycle.actionRequired})
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                  {matchedCustomer && (
                    <button
                      type="button"
                      onClick={() => onSelectCustomer(matchedCustomer)}
                      className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-semibold cursor-pointer"
                    >
                      Xem KH
                    </button>
                  )}
                  {onOpenRenewalCenter && (
                    <button
                      type="button"
                      onClick={onOpenRenewalCenter}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold shadow-xs flex items-center space-x-1 cursor-pointer"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Tái ký ngay</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {urgentCycles.length === 0 && (
            <div className="py-5 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-850/50 rounded-xl">
              <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-1" />
              <span>Tất cả các chu kỳ hợp đồng, CKS và hóa đơn điện tử đều đang trong trạng thái an toàn.</span>
            </div>
          )}
        </div>
      </div>

      {/* QUICK LEAVE AND BUSINESS TRIP MODAL */}
      {currentUser && (
        <QuickLeaveAndTripModal
          isOpen={isLeaveAndTripModalOpen}
          onClose={() => setIsLeaveAndTripModalOpen(false)}
          currentUser={currentUser}
          customers={customers && customers.length > 0 ? customers : storageService.getCustomers()}
          users={users && users.length > 0 ? users : storageService.getEmployees()}
          onNavigateToHR={() => {
            if (onNavigateToTab) onNavigateToTab('OPERATIONS');
          }}
          onDataReload={() => {
            setHrSyncVersion(v => v + 1);
            if (onDataReload) onDataReload();
          }}
        />
      )}

    </div>
  );
};

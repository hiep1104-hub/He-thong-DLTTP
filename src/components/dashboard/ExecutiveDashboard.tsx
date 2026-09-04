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
  Plus,
  Plane,
  CreditCard,
  Trash2,
  StickyNote,
  Circle,
} from 'lucide-react';
import { storageService, CURRENT_SYSTEM_DATE } from '../../services/storageService';
import { formatCurrency, formatDate, RISK_LABELS, STATUS_LABELS } from '../../utils/formatters';
import { PermissionService } from '../../utils/permissions';
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



// --- START OF
export type WorkbenchArchetype = 
  | 'EXECUTIVE'             // Ban Giám Đốc / Lãnh Đạo / Admin
  | 'MANAGER_REVIEWER'      // Kế Toán Trưởng / Trưởng Phòng / Trưởng Nhóm
  | 'TAX_SPECIALIST'        // Chuyên Viên Kế Toán Thuế / Kế Toán Viên
  | 'HR_PAYROLL'            // Chuyên Viên HCNS, Tiền Lương & BHXH
  | 'LEGAL'                 // Chuyên Viên Pháp Lý Doanh Nghiệp & ĐKKD
  | 'SALES_DEBT'            // Chuyên Viên Kinh Doanh, CSKH & Thu Hồi Nợ
  | 'TOKEN_ARCHIVE';        // Chuyên Viên Chữ Ký Số & Lưu Trữ

export interface WorkbenchHeaderProps {
  currentUser?: User;
  activeArchetype: WorkbenchArchetype;
  onSelectArchetype?: (archetype: WorkbenchArchetype) => void;
  urgentTasksCount: number;
  overdueTasksCount: number;
  pendingReviewCount: number;
  myCustomersCount: number;
  onOpenCreateTask?: () => void;
  onNavigateToTab?: (tab: string) => void;
  onOpenRenewalCenter?: () => void;
  canSwitchPerspective?: boolean;
  onOpenLeaveAndTripModal?: () => void;
  leaveAndTripCount?: number;
}

export const ARCHETYPE_CONFIG: Record<WorkbenchArchetype, {
  label: string;
  title: string;
  subTitle: string;
  badge: string;
  badgeColor: string;
  icon: any;
}> = {
  EXECUTIVE: {
    label: 'Ban Giám Đốc (BOD)',
    title: 'Bàn Điều Hành & Chỉ Huy Toàn Diện (Executive Cockpit)',
    subTitle: 'Tổng quan bức tranh doanh thu, nợ đọng, rủi ro thuế và năng định phân bổ 30 nhân sự',
    badge: 'Ban Giám Đốc',
    badgeColor: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    icon: Sparkles,
  },
  MANAGER_REVIEWER: {
    label: 'Trưởng Phòng / Trưởng Nhóm',
    title: 'Bàn Điều Phối Tiến Độ & Kiểm Soát Chất Lượng (Quality Hub)',
    subTitle: 'Hàng đợi soát xét cấp 1 & cấp 2, điều chuyển công việc, cảnh báo tiến độ và phân bổ chuyên viên',
    badge: 'Quản Lý & Soát Xét',
    badgeColor: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    icon: Layers,
  },
  TAX_SPECIALIST: {
    label: 'Chuyên Viên Kế Toán Thuế',
    title: 'Bàn Tác Nghiệp Cá Nhân & Khách Hàng Phụ Trách (Action Desk)',
    subTitle: 'Công việc cần xử lý hôm nay, tiến độ tờ khai thuế danh mục và theo dõi Chữ ký số Token',
    badge: 'Kế Toán Thuế',
    badgeColor: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    icon: FileText,
  },
  HR_PAYROLL: {
    label: 'Chuyên Viên HCNS & Tiền Lương',
    title: 'Bàn Quản Trị Nhân Sự, Bảng Lương & BHXH (HR & C&B Desk)',
    subTitle: 'Duyệt đơn nghỉ phép, theo dõi hợp đồng lao động/thử việc, chốt công tính lương và báo tăng giảm BHXH',
    badge: 'Hành Chính - Nhân Sự',
    badgeColor: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    icon: UserCheck,
  },
  LEGAL: {
    label: 'Chuyên Viên Pháp Lý & ĐKKD',
    title: 'Bàn Hồ Sơ Pháp Lý & Đăng Ký Kinh Doanh (Legal Desk)',
    subTitle: 'Tiến độ cấp mới/thay đổi giấy phép ĐKKD, nộp hồ sơ Sở KH&ĐT và bàn giao con dấu/kết quả',
    badge: 'Pháp Lý Doanh Nghiệp',
    badgeColor: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    icon: ShieldCheck,
  },
  SALES_DEBT: {
    label: 'Kinh Doanh & Thu Hồi Nợ',
    title: 'Bàn Quản Trị Hợp Đồng, Tái Ký & Thu Hồi Nợ (Sales & CSKH)',
    subTitle: 'Danh mục hợp đồng đến hạn tái ký (30-60 ngày), thu hồi nợ đọng dịch vụ và tiếp nhận yêu cầu mới',
    badge: 'Sales & Thu Hồi Nợ',
    badgeColor: 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
    icon: RefreshCw,
  },
  TOKEN_ARCHIVE: {
    label: 'Quản Lý CKS & Lưu Trữ',
    title: 'Bàn Quản Trị Chữ Ký Số, Token & Văn Thư Lưu Trữ (CKS Desk)',
    subTitle: 'Theo dõi hạn dùng Token CKS khách hàng, mượn trả thiết bị ký số và bàn giao hồ sơ vật lý',
    badge: 'Văn Thư & CKS',
    badgeColor: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    icon: Clock,
  },
};

export const WorkbenchHeader: React.FC<WorkbenchHeaderProps> = ({
  currentUser,
  activeArchetype,
  onSelectArchetype,
  urgentTasksCount,
  overdueTasksCount,
  pendingReviewCount,
  myCustomersCount,
  onOpenCreateTask,
  onNavigateToTab,
  onOpenRenewalCenter,
  canSwitchPerspective,
  onOpenLeaveAndTripModal,
  leaveAndTripCount = 0,
}) => {
  const currentConfig = ARCHETYPE_CONFIG[activeArchetype] || ARCHETYPE_CONFIG.EXECUTIVE;
  const Icon = currentConfig.icon;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
      {/* Top row: Greeting, role badge & Perspective selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* User identification */}
        <div className="flex items-start sm:items-center space-x-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'TC'}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                {currentUser?.name || 'Cán Bộ Hệ Thống'}
              </h1>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${currentConfig.badgeColor}`}>
                {currentUser?.position || currentConfig.badge}
              </span>
              <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                Mã: {currentUser?.code || 'NV-001'}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center space-x-1.5 truncate">
              <span className="font-medium">{currentConfig.title}</span>
              <span>•</span>
              <span>Ngày: {formatDate(CURRENT_SYSTEM_DATE)}</span>
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onOpenCreateTask && (
            <button
              type="button"
              onClick={onOpenCreateTask}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Tạo việc mới</span>
            </button>
          )}

          {/* Quick Button: Nghỉ phép & Công tác */}
          {onOpenLeaveAndTripModal && (
            <button
              type="button"
              onClick={onOpenLeaveAndTripModal}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer hover:shadow-xs"
              title="Đăng ký nhanh Nghỉ phép, Lệnh đi công tác hoặc Duyệt đơn chờ"
            >
              <Plane className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Nghỉ phép & Công tác ({leaveAndTripCount})</span>
            </button>
          )}

          {onNavigateToTab && (
            <button
              type="button"
              onClick={() => onNavigateToTab('CUSTOMER_PORTAL')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
              <span className="hidden sm:inline">Cổng eTax</span>
            </button>
          )}

          {onOpenRenewalCenter && (
            <button
              type="button"
              onClick={onOpenRenewalCenter}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5 text-amber-600" />
              <span>Tái ký</span>
            </button>
          )}
        </div>
      </div>

      {/* Operational Highlights Pill Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
        <div className="flex items-center space-x-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
          <Clock className="h-4 w-4 text-orange-500 shrink-0" />
          <div className="min-w-0 flex-1 truncate">
            <span className="text-slate-500 text-[11px]">Hạn nộp T7: </span>
            <span className="font-bold text-slate-800 dark:text-slate-200">20/08 (GTGT, TNCN)</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
          <BellRing className={`h-4 w-4 ${overdueTasksCount > 0 ? 'text-red-500' : 'text-slate-400'} shrink-0`} />
          <div className="min-w-0 flex-1 truncate">
            <span className="text-slate-500 text-[11px]">Việc quá hạn: </span>
            <span className={`font-bold ${overdueTasksCount > 0 ? 'text-red-600' : 'text-slate-700 dark:text-slate-300'}`}>
              {overdueTasksCount} việc
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
          <CheckCircle2 className="h-4 w-4 text-purple-500 shrink-0" />
          <div className="min-w-0 flex-1 truncate">
            <span className="text-slate-500 text-[11px]">Chờ kiểm duyệt: </span>
            <span className="font-bold text-purple-600 dark:text-purple-400">{pendingReviewCount} hồ sơ</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
          <Briefcase className="h-4 w-4 text-blue-500 shrink-0" />
          <div className="min-w-0 flex-1 truncate">
            <span className="text-slate-500 text-[11px]">KH phụ trách: </span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{myCustomersCount} doanh nghiệp</span>
          </div>
        </div>
      </div>
    </div>
  );
};



// --- START OF
interface RoleMetricCardsProps {
  archetype: WorkbenchArchetype;
  tasks: Task[];
  myTasks: Task[];
  customers: Customer[];
  myCustomers: Customer[];
  employees: EmployeeProfile[];
  leaveRequests: LeaveRequest[];
  businessTrips?: BusinessTrip[];
  payrollRecords: PayrollRecord[];
  allCycles: SystemExpiringCycleItem[];
  canSeeFinancials: boolean;
  onNavigateToTasks: (preset?: string) => void;
  onNavigateToTab?: (tab: string) => void;
  onOpenRenewalCenter?: () => void;
}

export const RoleMetricCards: React.FC<RoleMetricCardsProps> = ({
  archetype,
  tasks,
  myTasks,
  customers,
  myCustomers,
  employees,
  leaveRequests,
  businessTrips = [],
  payrollRecords,
  allCycles,
  canSeeFinancials,
  onNavigateToTasks,
  onNavigateToTab,
  onOpenRenewalCenter,
}) => {
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Common calculations
  const activeCustomers = customers.filter(c => c.contractStatus === 'HIEU_LUC');
  const totalMonthlyRevenue = activeCustomers.reduce((sum, c) => sum + (c.monthlyFee || 0), 0);
  const totalDebt = customers.reduce((sum, c) => sum + (c.debtAmount || 0), 0);
  const highRiskCustomers = customers.filter(c => c.riskLevel === 'CAO' || c.riskLevel === 'NGUY_CO_PHAP_LY');

  const pendingApprovalTasks = tasks.filter(t => t.status === 'CHO_PHE_DUYET');
  const pendingReviewTasks = tasks.filter(t => t.status === 'CHO_KIEM_TRA');
  const overdueTasks = tasks.filter(t => t.status !== 'HOAN_THANH' && t.status !== 'HUY' && new Date(t.dueDate) < new Date());

  const myOverdueTasks = myTasks.filter(t => t.status !== 'HOAN_THANH' && t.status !== 'HUY' && new Date(t.dueDate) < new Date());
  const myUrgentTasks = myTasks.filter(t => t.priority === 'KHAN_CAP' || t.priority === 'CAO');
  const myPendingTasks = myTasks.filter(t => t.status === 'DANG_XU_LY' || t.status === 'TIEP_NHAN');

  // Tax calculations
  const totalTaxTasks = tasks.filter(t => t.isTaxObligation);
  const completedTaxTasks = totalTaxTasks.filter(t => t.status === 'HOAN_THANH');
  const taxComplianceRate = totalTaxTasks.length > 0 ? Math.round((completedTaxTasks.length / totalTaxTasks.length) * 100) : 100;

  const myTaxTasks = myTasks.filter(t => t.isTaxObligation);
  const myCompletedTaxTasks = myTaxTasks.filter(t => t.status === 'HOAN_THANH');
  const myTaxComplianceRate = myTaxTasks.length > 0 ? Math.round((myCompletedTaxTasks.length / myTaxTasks.length) * 100) : 100;

  // Capacity calculations
  const totalCapacity = employees.reduce((sum, e) => sum + (e.maxCustomerCapacity || 0), 0);
  const totalManagedCustomers = employees.reduce((sum, e) => sum + (e.managedCustomersCount || 0), 0);
  const companyCapacityRate = totalCapacity > 0 ? Math.round((totalManagedCustomers / totalCapacity) * 100) : 0;

  // Cycles
  const urgentCycles = allCycles.filter(c => c.status === 'EXPIRED' || c.status === 'CRITICAL_15' || c.status === 'WARNING_30');
  const tokenCycles = allCycles.filter(c => c.category === 'DIGITAL_SIGNATURE');
  const urgentTokenCycles = tokenCycles.filter(c => c.status === 'EXPIRED' || c.status === 'CRITICAL_15' || c.status === 'WARNING_30');
  const contractCycles = allCycles.filter(c => c.category === 'CUSTOMER_CONTRACT');
  const hrCycles = allCycles.filter(c => c.category === 'HR_LABOR_CONTRACT' || c.category === 'HR_PROBATION');

  // Pending leaves & trips
  const pendingLeaves = leaveRequests.filter(l => l.status === 'CHO_DUYET');
  const pendingTrips = businessTrips.filter(t => t.status === 'CHO_DUYET');
  const totalPendingLeavesAndTrips = pendingLeaves.length + pendingTrips.length;
  const totalLeavesAndTrips = leaveRequests.length + businessTrips.length;

  // 1. BAN GIÁM ĐỐC / EXECUTIVE
  if (archetype === 'EXECUTIVE') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Doanh Thu & Công Nợ */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Doanh Thu Hợp Đồng & Nợ</span>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {canSeeFinancials ? formatVND(totalMonthlyRevenue) : `${customers.length} Doanh Nghiệp`}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>{activeCustomers.length} KH đang hiệu lực</span>
            {canSeeFinancials ? (
              <span className="text-amber-600 font-semibold">Nợ: {formatVND(totalDebt)}</span>
            ) : (
              <span className="text-blue-600 font-semibold">{highRiskCustomers.length} rủi ro cao</span>
            )}
          </div>
        </div>

        {/* Card 2: Hồ Sơ Cần Duyệt Cấp Giám Đốc */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Hồ Sơ Chờ Giám Đốc Duyệt</span>
            <Zap className="h-4 w-4 text-orange-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl sm:text-2xl font-black text-orange-600">
              {pendingApprovalTasks.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">chờ phê duyệt</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="text-red-600 font-semibold">{overdueTasks.length} việc quá hạn</span>
            <button 
              type="button"
              onClick={() => onNavigateToTasks('PENDING_APPROVAL')}
              className="text-blue-600 font-bold hover:underline cursor-pointer"
            >
              Duyệt ngay &rarr;
            </button>
          </div>
        </div>

        {/* Card 3: Tiến Độ Tuân Thủ Thuế */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Tiến Độ Kê Khai Thuế Vĩ Mô</span>
            <Calendar className="h-4 w-4 text-blue-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl sm:text-2xl font-black text-blue-600">
              {completedTaxTasks.length}/{totalTaxTasks.length}
            </span>
            <span className="text-xs text-emerald-600 font-semibold">({taxComplianceRate}%)</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Hạn nộp T7: <strong>20/08</strong></span>
            <span className="text-slate-600 dark:text-slate-400">{totalTaxTasks.length} tờ khai</span>
          </div>
        </div>

        {/* Card 4: Năng Định Phân Bổ 30 Nhân Sự */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Năng Định 30 Nhân Sự</span>
            <Users2 className="h-4 w-4 text-purple-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {companyCapacityRate}%
            </span>
            <span className="text-xs text-slate-500">tải hệ thống</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>{totalManagedCustomers}/{totalCapacity} KH</span>
            <span className="text-emerald-600 font-semibold font-mono">+{totalCapacity - totalManagedCustomers} dư địa</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. TRƯỞNG PHÒNG / TRƯỞNG NHÓM / SOÁT XÉT (QA)
  if (archetype === 'MANAGER_REVIEWER') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Hàng Đợi Kiểm Tra Cấp 1 & 2 */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Hàng Đợi Soát Xét Cấp 1 & 2</span>
            <FileCheck className="h-4 w-4 text-purple-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl sm:text-2xl font-black text-purple-600">
              {pendingReviewTasks.length + pendingApprovalTasks.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">hồ sơ chờ duyệt</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>{pendingReviewTasks.length} chờ kiểm tra</span>
            <button 
              type="button"
              onClick={() => onNavigateToTasks('PENDING_REVIEW')}
              className="text-purple-600 font-bold hover:underline cursor-pointer"
            >
              Soát xét ngay &rarr;
            </button>
          </div>
        </div>

        {/* Card 2: Deadline Khẩn Cấp & Quá Hạn Trong Tổ */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Cảnh Báo Deadline & Quá Hạn</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl sm:text-2xl font-black text-rose-600">
              {overdueTasks.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">việc quá hạn</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="text-orange-600 font-semibold">{tasks.filter(t => t.priority === 'KHAN_CAP').length} việc khẩn cấp</span>
            <button 
              type="button"
              onClick={() => onNavigateToTasks('OVERDUE')}
              className="text-red-600 font-bold hover:underline cursor-pointer"
            >
              Xử lý gấp &rarr;
            </button>
          </div>
        </div>

        {/* Card 3: Tiến Độ Kê Khai Thuế Của Nhóm */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Tiến Độ Kê Khai Của Nhóm</span>
            <Calendar className="h-4 w-4 text-blue-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl sm:text-2xl font-black text-blue-600">
              {completedTaxTasks.length}/{totalTaxTasks.length}
            </span>
            <span className="text-xs text-emerald-600 font-semibold">({taxComplianceRate}%)</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Hạn nộp T7: <strong>20/08</strong></span>
            <span className="text-blue-600 font-semibold">Còn {totalTaxTasks.length - completedTaxTasks.length} tờ khai</span>
          </div>
        </div>

        {/* Card 4: Khách Hàng Rủi Ro Thuế Cần Giám Sát */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Khách Hàng Rủi Ro Thuế Cao</span>
            <ShieldAlert className="h-4 w-4 text-amber-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl sm:text-2xl font-black text-amber-600">
              {highRiskCustomers.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">doanh nghiệp rủi ro</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Giám sát chuyên sâu</span>
            <span className="text-slate-500">{customers.length} tổng KH</span>
          </div>
        </div>
      </div>
    );
  }

  // 3. CHUYÊN VIÊN KẾ TOÁN THUẾ (ACTION DESK)
  if (archetype === 'TAX_SPECIALIST') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Việc Hôm Nay Của Tôi */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Công Việc Hôm Nay Của Tôi</span>
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl sm:text-2xl font-black text-blue-600">
              {myTasks.filter(t => t.status !== 'HOAN_THANH').length}
            </span>
            <span className="text-xs text-slate-500 font-medium">việc đang phụ trách</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className={myOverdueTasks.length > 0 ? 'text-red-600 font-bold' : 'text-slate-500'}>
              {myOverdueTasks.length} quá hạn
            </span>
            <span className="text-orange-600 font-semibold">{myUrgentTasks.length} khẩn cấp</span>
          </div>
        </div>

        {/* Card 2: Khách Hàng Tôi Quản Lý */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Doanh Nghiệp Tôi Quản Lý</span>
            <Building className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl sm:text-2xl font-black text-indigo-600">
              {myCustomers.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">khách hàng</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Định biên: {myCustomers.length}/10 KH</span>
            <span className="text-amber-600 font-semibold">
              {myCustomers.filter(c => c.riskLevel === 'CAO').length} rủi ro thuế
            </span>
          </div>
        </div>

        {/* Card 3: Tiến Độ Kê Khai Thuế Của Tôi */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Tiến Độ Thuế Của Khách Tôi</span>
            <Calendar className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-600">
              {myCompletedTaxTasks.length}/{myTaxTasks.length || myCustomers.length || 1}
            </span>
            <span className="text-xs text-emerald-600 font-semibold">({myTaxComplianceRate}%)</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Hạn nộp T7: <strong>20/08</strong></span>
            <span className="text-slate-500">Tờ khai GTGT/TNCN</span>
          </div>
        </div>

        {/* Card 4: Tình Trạng Chữ Ký Số / Token CKS Khách Tôi */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Chữ Ký Số & Token CKS</span>
            <KeyRound className="h-4 w-4 text-amber-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl sm:text-2xl font-black text-amber-600">
              {urgentTokenCycles.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">CKS cần chú ý</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="text-emerald-600 font-semibold">Sẵn sàng ký số</span>
            <span className="text-slate-500">{tokenCycles.length} CKS tổng</span>
          </div>
        </div>
      </div>
    );
  }

  // 4. CHUYÊN VIÊN HCNS & TIỀN LƯƠNG
  if (archetype === 'HR_PAYROLL') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Đơn Nghỉ Phép & Công Tác Chờ Duyệt */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Nghỉ Phép & Công Tác Chờ Duyệt</span>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-600">
              {totalPendingLeavesAndTrips}
            </span>
            <span className="text-xs text-slate-500 font-medium">đơn chờ xử lý</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Nghỉ phép & Công tác</span>
            <span className="text-blue-600 font-semibold">{totalLeavesAndTrips} tổng đơn</span>
          </div>
        </div>

        {/* Card 2: HĐLĐ & Thử Việc Đến Hạn */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>HĐLĐ & Thử Việc Đến Hạn</span>
            <Clock className="h-4 w-4 text-orange-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl sm:text-2xl font-black text-orange-600">
              {hrCycles.filter(c => c.status !== 'SAFE').length}
            </span>
            <span className="text-xs text-slate-500 font-medium">cần tái ký / đánh giá</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>11 nhân sự cơ quan</span>
            <span className="text-emerald-600 font-semibold">Chuẩn SLA NĐ 145</span>
          </div>
        </div>

        {/* Card 3: Kỳ Lương & Chốt Công Tháng */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Kỳ Lương & Chốt Công T7/2026</span>
            <CreditCard className="h-4 w-4 text-purple-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl sm:text-2xl font-black text-purple-600">
              11/11
            </span>
            <span className="text-xs text-slate-500 font-medium">phiếu lương sẵn sàng</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Đã chốt công 31/07</span>
            <span className="text-emerald-600 font-semibold">TT 87/2026</span>
          </div>
        </div>

        {/* Card 4: Hồ Sơ BHXH & Phúc Lợi */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Bảo Hiểm Xã Hội (Mẫu D02-LT)</span>
            <ShieldCheck className="h-4 w-4 text-blue-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl sm:text-2xl font-black text-blue-600">
              100%
            </span>
            <span className="text-xs text-slate-500 font-medium">đã đối soát C12</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Trích nộp 32% (10.5% + 21.5%)</span>
            <span className="text-emerald-600 font-semibold">Luật BHXH 2024</span>
          </div>
        </div>
      </div>
    );
  }

  // 5. PHÁP LÝ DOANH NGHIỆP & ĐKKD
  if (archetype === 'LEGAL') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Hồ Sơ ĐKKD Đang Xử Lý */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Hồ Sơ ĐKKD & Thành Lập Mới</span>
            <FileText className="h-4 w-4 text-amber-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl sm:text-2xl font-black text-amber-600">
              {tasks.filter(t => t.category === 'DANG_KY_KINH_DOANH' || t.title.toLowerCase().includes('đkkd') || t.title.toLowerCase().includes('pháp lý')).length || 3}
            </span>
            <span className="text-xs text-slate-500 font-medium">hồ sơ đang xử lý</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Cổng DKKD quốc gia</span>
            <span className="text-emerald-600 font-semibold">Đúng hạn 3 ngày</span>
          </div>
        </div>

        {/* Card 2: Kết Quả GPKD & Con Dấu */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Giấy Phép & Con Dấu Chờ Trả</span>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-600">
              2
            </span>
            <span className="text-xs text-slate-500 font-medium">kết quả sẵn sàng</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Bàn giao khách hàng</span>
            <span className="text-blue-600 font-semibold">Kèm biên bản giao nhận</span>
          </div>
        </div>

        {/* Card 3: Khách Hàng Pháp Lý Mới */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Khách Hàng Pháp Lý Mới</span>
            <Building className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {customers.filter(c => c.type === 'CONG_TY' || !c.type).length} DN
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Thay đổi ĐKKD & Thành lập</span>
            <span className="text-slate-500">Phòng ĐKKD - Sở KH&ĐT</span>
          </div>
        </div>

        {/* Card 4: Nhiệm Vụ Quá Hạn & Khẩn Cấp */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Tiến Độ Xử Lý Thủ Tục</span>
            <Clock className="h-4 w-4 text-purple-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl sm:text-2xl font-black text-purple-600">
              100%
            </span>
            <span className="text-xs text-slate-500 font-medium">hồ sơ đúng hạn</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Theo dõi tiếp nhận & bổ sung</span>
            <span className="text-emerald-600 font-semibold">SLA chuẩn</span>
          </div>
        </div>
      </div>
    );
  }

  // 6. SALES, CSKH & THU HỒI NỢ
  if (archetype === 'SALES_DEBT') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Hợp Đồng Đến Hạn Tái Ký (30-60 ngày) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Hợp Đồng Đến Hạn Tái Ký</span>
            <RefreshCw className="h-4 w-4 text-cyan-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl sm:text-2xl font-black text-cyan-600">
              {contractCycles.filter(c => c.status !== 'SAFE').length}
            </span>
            <span className="text-xs text-slate-500 font-medium">HĐ cần chăm sóc</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>30-60 ngày tới</span>
            {onOpenRenewalCenter && (
              <button 
                type="button"
                onClick={onOpenRenewalCenter}
                className="text-cyan-600 font-bold hover:underline cursor-pointer"
              >
                Mở Tái Ký &rarr;
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Nợ Đọng Cần Thu Hồi */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Khách Hàng Nợ Đọng Dịch Vụ</span>
            <DollarSign className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600">
            {formatVND(totalDebt)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>{customers.filter(c => (c.debtAmount || 0) > 0).length} KH phát sinh nợ</span>
            <span className="text-rose-600 font-semibold">Gửi thông báo nợ</span>
          </div>
        </div>

        {/* Card 3: Yêu Cầu Hỗ Trợ & Dịch Vụ Mới */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Yêu Cầu Hỗ Trợ Khách Hàng</span>
            <Users2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-600">
              {tasks.filter(t => t.category === 'CSKH_HOP_DONG' || t.title.toLowerCase().includes('tiếp nhận') || t.title.toLowerCase().includes('cskh')).length || 2}
            </span>
            <span className="text-xs text-slate-500 font-medium">yêu cầu mới</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Tư vấn hóa đơn, chữ ký số</span>
            <span className="text-emerald-600 font-semibold">CSKH 24/7</span>
          </div>
        </div>

        {/* Card 4: Khách Hàng Đang Hoạt Động */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Tổng Doanh Nghiệp Đang Ký</span>
            <Building className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {activeCustomers.length} Doanh Nghiệp
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Gói định kỳ: {activeCustomers.filter(c => c.serviceType === 'DINH_KY').length} KH</span>
            <span className="text-blue-600 font-semibold">Vụ việc: {activeCustomers.filter(c => c.serviceType === 'PHAT_SINH').length} KH</span>
          </div>
        </div>
      </div>
    );
  }

  // 7. QUẢN LÝ CKS & LƯU TRỮ (TOKEN & ARCHIVES)
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Token CKS Sắp Hết Hạn */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
          <span>Token CKS Cần Gia Hạn</span>
          <KeyRound className="h-4 w-4 text-indigo-500" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-xl sm:text-2xl font-black text-indigo-600">
            {urgentTokenCycles.length}
          </span>
          <span className="text-xs text-slate-500 font-medium">chữ ký số &lt;30 ngày</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span>{tokenCycles.length} tổng thiết bị</span>
          {onOpenRenewalCenter && (
            <button 
              type="button"
              onClick={onOpenRenewalCenter}
              className="text-indigo-600 font-bold hover:underline cursor-pointer"
            >
              Gia hạn ngay &rarr;
            </button>
          )}
        </div>
      </div>

      {/* Card 2: Thiết Bị Đang Cho Mượn / Bàn Giao */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
          <span>Thiết Bị Token Bàn Giao</span>
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-xl sm:text-2xl font-black text-emerald-600">
            {customers.filter(c => c.digitalSignatures && c.digitalSignatures.length > 0).length}
          </span>
          <span className="text-xs text-slate-500 font-medium">USB Token bảo quản</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span>Két bảo mật văn thư</span>
          <span className="text-emerald-600 font-semibold">Có mã PIN quản lý</span>
        </div>
      </div>

      {/* Card 3: Biên Bản Giao Nhận Hồ Sơ & Hóa Đơn */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
          <span>Biên Bản Giao Nhận Chứng Từ</span>
          <FileText className="h-4 w-4 text-blue-500" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-xl sm:text-2xl font-black text-blue-600">
            100%
          </span>
          <span className="text-xs text-slate-500 font-medium">đầy đủ biên bản</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span>Hồ sơ thuế & BCTC</span>
          <span className="text-blue-600 font-semibold">Lưu trữ 10 năm</span>
        </div>
      </div>

      {/* Card 4: Gói Hóa Đơn Điện Tử */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
          <span>Gói Hóa Đơn Điện Tử Hết Số</span>
          <Receipt className="h-4 w-4 text-amber-500" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-xl sm:text-2xl font-black text-amber-600">
            {allCycles.filter(c => c.category === 'EINVOICE_PACKAGE' && c.status !== 'SAFE').length}
          </span>
          <span className="text-xs text-slate-500 font-medium">gói sắp hết số</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span>Cảnh báo &lt;50 số</span>
          <span className="text-slate-500">M-Invoice / VNPT / Viettel</span>
        </div>
      </div>
    </div>
  );
};



// --- START OF
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



// --- START OF
interface DailyQuickNotesProps {
  currentUser?: User;
}

interface QuickTodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export const DailyQuickNotes: React.FC<DailyQuickNotesProps> = ({ currentUser }) => {
  const storageKey = `taxcore_workbench_notes_${currentUser?.id || 'guest'}`;
  
  const [note, setNote] = useState<string>(() => {
    return localStorage.getItem(`${storageKey}_text`) || '';
  });

  const [todos, setTodos] = useState<QuickTodoItem[]>(() => {
    const saved = localStorage.getItem(`${storageKey}_todos`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [
      { id: '1', text: 'Đối chiếu hóa đơn đầu vào 5 công ty phụ trách', completed: true },
      { id: '2', text: 'Nhắc khách hàng nộp tờ khai GTGT T7 trước ngày 20', completed: false },
      { id: '3', text: 'Kiểm tra gia hạn Token CKS cho công ty Minh Anh', completed: false },
    ];
  });

  const [newTodoText, setNewTodoText] = useState('');

  useEffect(() => {
    localStorage.setItem(`${storageKey}_text`, note);
  }, [note, storageKey]);

  useEffect(() => {
    localStorage.setItem(`${storageKey}_todos`, JSON.stringify(todos));
  }, [todos, storageKey]);

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;
    const newItem: QuickTodoItem = {
      id: Date.now().toString(),
      text: newTodoText.trim(),
      completed: false,
    };
    setTodos([...todos, newItem]);
    setNewTodoText('');
  };

  const handleToggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleDeleteTodo = (id: string) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <StickyNote className="h-4 w-4 text-amber-500" />
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Ghi Chú Nhanh Bàn Làm Việc
          </h2>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">Lưu tự động</span>
      </div>

      {/* Quick Checklist */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Mục tiêu hôm nay ({todos.filter(t => t.completed).length}/{todos.length})
        </div>

        <form onSubmit={handleAddTodo} className="flex gap-2">
          <input
            type="text"
            placeholder="Thêm mục tiêu cá nhân..."
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newTodoText.trim()}
            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
          </button>
        </form>

        <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar pt-1">
          {todos.map(item => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 text-xs group"
            >
              <button
                type="button"
                onClick={() => handleToggleTodo(item.id)}
                className="flex items-center space-x-2 text-left flex-1 min-w-0 cursor-pointer"
              >
                {item.completed ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-slate-400 shrink-0" />
                )}
                <span className={`truncate ${item.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'}`}>
                  {item.text}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDeleteTodo(item.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-1 transition-opacity cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Freeform Note */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
          Nhật ký tác nghiệp / Số hotline cần gọi
        </label>
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Viết ghi chú ngắn cho ca làm việc hôm nay..."
          className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
        />
      </div>
    </div>
  );
};

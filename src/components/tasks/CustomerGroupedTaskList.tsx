import React, { useState, useMemo } from 'react';
import { Customer, Task, User, TaskStatus, TaskPriority, TaskRiskLevel, Department } from '../../types';
import { 
  Building, 
  Building2,
  Calendar, 
  Zap, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  Paperclip, 
  CheckSquare, 
  Tag, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  ExternalLink,
  UserCheck,
  Filter,
  Layers,
  ArrowUpDown,
  Search,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { 
  formatDate, 
  PRIORITY_LABELS, 
  RISK_LABELS, 
  STATUS_LABELS, 
  DEPARTMENT_LABELS, 
  getTaskNature, 
  formatCurrency 
} from '../../utils/formatters';

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

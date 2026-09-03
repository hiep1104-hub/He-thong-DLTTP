import React from 'react';
import { Customer, Task, User, StaffKPIRecord, EmployeeProfile, LeaveRequest, BusinessTrip, PayrollRecord, SystemExpiringCycleItem } from '../../types';
import { 
  Building, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  FileText, 
  UserCheck, 
  TrendingUp, 
  AlertCircle,
  FileCheck,
  Zap,
  Users2,
  Calendar,
  DollarSign,
  Briefcase,
  Layers,
  Sparkles,
  Award,
  ShieldCheck,
  RefreshCw,
  KeyRound,
  Receipt,
  Scale,
  CreditCard,
  UserPlus
} from 'lucide-react';
import { WorkbenchArchetype } from './WorkbenchHeader';
import { formatCurrency, formatDate } from '../../utils/formatters';

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

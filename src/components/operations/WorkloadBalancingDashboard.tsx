import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Scale, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  ArrowRightLeft, 
  Filter, 
  Building2, 
  ChevronRight, 
  Check, 
  Sparkles,
  Info,
  Clock,
  Briefcase,
  ShieldAlert,
  UserPlus
} from 'lucide-react';
import { StaffWorkloadSummary, User, Customer } from '../../types';
import { storageService } from '../../services/storageService';
import { PermissionService } from '../../utils/permissions';

interface WorkloadBalancingDashboardProps {
  currentUser: User;
  onSelectCustomer?: (customer: Customer) => void;
  onRefresh?: () => void;
}

export const WorkloadBalancingDashboard: React.FC<WorkloadBalancingDashboardProps> = ({
  currentUser,
  onSelectCustomer,
  onRefresh
}) => {
  const [workloads, setWorkloads] = useState<StaffWorkloadSummary[]>(() => storageService.getStaffWorkloadSummaries());
  const [filterDepartment, setFilterDepartment] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedStaff, setSelectedStaff] = useState<StaffWorkloadSummary | null>(null);

  // Rebalance modal state
  const [isRebalanceModalOpen, setIsRebalanceModalOpen] = useState(false);
  const [sourceStaff, setSourceStaff] = useState<StaffWorkloadSummary | null>(null);
  const [targetStaffId, setTargetStaffId] = useState<string>('');
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [reassignActiveTasks, setReassignActiveTasks] = useState<boolean>(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const reloadData = () => {
    const fresh = storageService.getStaffWorkloadSummaries();
    setWorkloads(fresh);
    if (selectedStaff) {
      const updated = fresh.find(s => s.userId === selectedStaff.userId);
      setSelectedStaff(updated || null);
    }
    if (onRefresh) onRefresh();
  };

  useEffect(() => {
    const unsubscribe = storageService.subscribeToSync(() => {
      reloadData();
    });
    return () => unsubscribe();
  }, []);

  const canViewAllProfiles = PermissionService.canViewAllProfiles(currentUser);

  // KPIs
  const displayedWorkloads = useMemo(() => {
    if (canViewAllProfiles) return workloads;
    return workloads.filter(w => w.userId === currentUser.id);
  }, [workloads, canViewAllProfiles, currentUser]);

  const totalStaff = displayedWorkloads.length;
  const overloadCount = displayedWorkloads.filter(w => w.status === 'OVERLOAD').length;
  const optimalCount = displayedWorkloads.filter(w => w.status === 'OPTIMAL').length;
  const availableCount = displayedWorkloads.filter(w => w.status === 'AVAILABLE').length;
  const newStaffCount = displayedWorkloads.filter(w => w.isNewEmployee).length;
  const totalAssignedCustomers = displayedWorkloads.reduce((sum, w) => sum + w.assignedCustomersCount, 0);
  const avgCustomersPerStaff = totalStaff > 0 ? (totalAssignedCustomers / totalStaff).toFixed(1) : '0';

  const filteredWorkloads = useMemo(() => {
    return displayedWorkloads.filter(w => {
      if (filterDepartment !== 'ALL' && w.department !== filterDepartment) return false;
      if (filterStatus !== 'ALL' && w.status !== filterStatus) return false;
      return true;
    });
  }, [displayedWorkloads, filterDepartment, filterStatus]);

  const handleOpenRebalance = (staff: StaffWorkloadSummary) => {
    setSourceStaff(staff);
    setSelectedCustomerIds([]);
    setReassignActiveTasks(true);
    // Tìm nhân sự có tải trọng thấp nhất để gợi ý sẵn
    const availableStaffList = workloads.filter(w => w.userId !== staff.userId && w.status === 'AVAILABLE');
    if (availableStaffList.length > 0) {
      setTargetStaffId(availableStaffList[0].userId);
    } else {
      const otherStaff = workloads.filter(w => w.userId !== staff.userId);
      setTargetStaffId(otherStaff.length > 0 ? otherStaff[0].userId : '');
    }
    setIsRebalanceModalOpen(true);
  };

  const handleToggleSelectCustomer = (customerId: string) => {
    setSelectedCustomerIds(prev => 
      prev.includes(customerId) ? prev.filter(id => id !== customerId) : [...prev, customerId]
    );
  };

  const handleSelectAllCustomers = () => {
    if (!sourceStaff) return;
    if (selectedCustomerIds.length === sourceStaff.assignedCustomers.length) {
      setSelectedCustomerIds([]);
    } else {
      setSelectedCustomerIds(sourceStaff.assignedCustomers.map(c => c.id));
    }
  };

  const handleExecuteRebalance = () => {
    if (!sourceStaff || !targetStaffId || selectedCustomerIds.length === 0) return;
    const targetUser = workloads.find(w => w.userId === targetStaffId);
    if (!targetUser) return;

    const success = storageService.reassignCustomerBatch(
      selectedCustomerIds,
      targetStaffId,
      currentUser.name,
      reassignActiveTasks
    );

    if (success) {
      setSuccessMessage(`Đã điều phối và san tải thành công ${selectedCustomerIds.length} khách hàng sang chuyên viên ${targetUser.userName}!`);
      setIsRebalanceModalOpen(false);
      reloadData();
      setTimeout(() => setSuccessMessage(null), 4500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl border border-indigo-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="p-2 bg-indigo-600/30 border border-indigo-400/30 rounded-xl text-indigo-300">
                <Scale className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Trung Tâm Cân Bằng Tải Trọng & San Tải Khách Hàng</h2>
                <p className="text-xs sm:text-sm text-indigo-200/80">
                  Tối ưu hóa năng lực 30 nhân sự / 300 khách hàng — Triệt tiêu nguy cơ quá tải và nghẽn tiến độ kỳ thuế
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={reloadData}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-md transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span>Quét Lại Định Mức Tải</span>
            </button>
          </div>
        </div>

        {/* 4 Metrics Highlight */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 backdrop-blur-xs">
            <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
              <span>Quy mô Nhân sự</span>
              <Users className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-extrabold">{totalStaff}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Phụ trách {totalAssignedCustomers} khách hàng</div>
          </div>

          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 backdrop-blur-xs">
            <div className="flex items-center justify-between text-xs text-rose-300 mb-1">
              <span>Đang Quá Tải (&gt;15 KH)</span>
              <AlertTriangle className="h-4 w-4 text-rose-400" />
            </div>
            <div className="text-2xl font-extrabold text-rose-300">{overloadCount}</div>
            <div className="text-[11px] text-rose-200/70 mt-0.5">Cần ưu tiên san tải ngay</div>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 backdrop-blur-xs">
            <div className="flex items-center justify-between text-xs text-emerald-300 mb-1">
              <span>Tải Trọng Chuẩn (9-15 KH)</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-300">{optimalCount}</div>
            <div className="text-[11px] text-emerald-200/70 mt-0.5">Hoạt động trong định mức</div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3.5 backdrop-blur-xs">
            <div className="flex items-center justify-between text-xs text-blue-300 mb-1">
              <span>Dung Lượng Còn Trống (&le;8)</span>
              <TrendingUp className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-2xl font-extrabold text-blue-300">{availableCount}</div>
            <div className="text-[11px] text-blue-200/70 mt-0.5">Sẵn sàng nhận bàn giao thêm</div>
          </div>
        </div>
      </div>

      {/* Alert toast if rebalanced */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-sm font-medium flex items-center space-x-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <Check className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Filter and Control Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-semibold mr-1">
            <Filter className="h-4 w-4" />
            <span>Lọc trạng thái:</span>
          </div>

          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterStatus === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            Tất cả ({workloads.length})
          </button>
          <button
            onClick={() => setFilterStatus('OVERLOAD')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterStatus === 'OVERLOAD'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400'
            }`}
          >
            Quá tải ({overloadCount})
          </button>
          <button
            onClick={() => setFilterStatus('OPTIMAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterStatus === 'OPTIMAL'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400'
            }`}
          >
            Tối ưu ({optimalCount})
          </button>
          <button
            onClick={() => setFilterStatus('AVAILABLE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterStatus === 'AVAILABLE'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400'
            }`}
          >
            Còn trống ({availableCount})
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Định mức chuẩn: <span className="font-bold text-slate-700 dark:text-slate-300">12 Doanh nghiệp / Chuyên viên</span> (Bình quân hiện tại: {avgCustomersPerStaff} KH)
        </div>
      </div>

      {/* Main Staff Workload Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredWorkloads.map(staff => {
          const isOverloaded = staff.status === 'OVERLOAD';
          const isAvailable = staff.status === 'AVAILABLE';

          return (
            <div
              key={staff.userId}
              className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all p-5 flex flex-col justify-between relative shadow-xs hover:shadow-md ${
                isOverloaded
                  ? 'border-rose-300 dark:border-rose-800/80 bg-gradient-to-b from-rose-50/20 to-white dark:from-rose-950/10'
                  : isAvailable
                  ? 'border-blue-300 dark:border-blue-800/80 bg-gradient-to-b from-blue-50/20 to-white dark:from-blue-950/10'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div>
                {/* Staff Top Info */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-sm shrink-0">
                      {staff.avatar ? (
                        <img src={staff.avatar} alt={staff.userName} className="w-full h-full rounded-xl object-cover" />
                      ) : (
                        staff.userName.split(' ').map(n => n[0]).slice(-2).join('')
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm hover:underline cursor-pointer" onClick={() => setSelectedStaff(staff)}>
                          {staff.userName}
                        </h3>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {staff.userCode}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {staff.position} • {staff.department}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold border shrink-0 ${staff.statusBadge}`}>
                    {staff.status === 'OVERLOAD' ? 'Quá tải' : staff.status === 'AVAILABLE' ? 'Dung lượng trống' : 'Cân bằng'}
                  </span>
                </div>

                {/* Capacity Progress Bar */}
                <div className="mt-4 mb-3">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Khách hàng: <span className="font-bold text-slate-900 dark:text-white text-sm">{staff.assignedCustomersCount}</span> / {staff.customerCapacity} định mức
                      </span>
                      {staff.isNewEmployee && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
                          Mới onboard
                        </span>
                      )}
                    </div>
                    <span className={`font-mono font-bold ${
                      isOverloaded ? 'text-rose-600' : isAvailable ? 'text-blue-600' : 'text-emerald-600'
                    }`}>
                      {staff.capacityUsageRate}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOverloaded
                          ? 'bg-rose-500'
                          : isAvailable
                          ? 'bg-blue-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, staff.capacityUsageRate)}%` }}
                    />
                  </div>
                </div>

                {/* Risk Distribution Tag Bar */}
                {staff.riskDistribution && staff.assignedCustomersCount > 0 && (
                  <div className="flex items-center space-x-1.5 text-[10px] mb-2 px-2 py-1 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 font-medium">Rủi ro thuế:</span>
                    {staff.riskDistribution.high > 0 && (
                      <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold">
                        {staff.riskDistribution.high} Cao
                      </span>
                    )}
                    {staff.riskDistribution.medium > 0 && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-bold">
                        {staff.riskDistribution.medium} TB
                      </span>
                    )}
                    <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold">
                      {staff.riskDistribution.low} Thấp
                    </span>
                  </div>
                )}

                {/* Sub Metrics (Active Tasks, Overdue, Cho Duyet) */}
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 dark:border-slate-800/80 text-center my-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl">
                  <div>
                    <div className="text-[10px] text-slate-500">Đầu việc mở</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {staff.activeTasksCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-amber-600 dark:text-amber-400">Chờ duyệt</div>
                    <div className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                      {staff.pendingReviewCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-rose-600 dark:text-rose-400">Quá hạn</div>
                    <div className={`text-sm font-bold mt-0.5 ${staff.overdueTasksCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                      {staff.overdueTasksCount}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setSelectedStaff(staff)}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <Building2 className="h-3.5 w-3.5" />
                  <span>Xem {staff.assignedCustomersCount} KH</span>
                </button>

                {isOverloaded ? (
                  <button
                    onClick={() => handleOpenRebalance(staff)}
                    className="py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-1 cursor-pointer animate-pulse"
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                    <span>San Tải Ngay</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenRebalance(staff)}
                    className="py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/50 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                    <span>Điều Phối</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Customer List Drawer for Selected Staff */}
      {selectedStaff && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl p-6 flex flex-col justify-between overflow-hidden">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center">
                    {selectedStaff.userName.split(' ').map(n => n[0]).slice(-2).join('')}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">{selectedStaff.userName}</h3>
                    <p className="text-xs text-slate-500">Danh sách {selectedStaff.assignedCustomersCount} khách hàng đang phụ trách</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStaff(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Customer List */}
              <div className="mt-4 max-h-[calc(100vh-220px)] overflow-y-auto space-y-2.5 pr-1">
                {selectedStaff.assignedCustomers.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    Chuyên viên hiện chưa được phân công khách hàng nào.
                  </div>
                ) : (
                  selectedStaff.assignedCustomers.map(cust => (
                    <div
                      key={cust.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-slate-50/50 dark:bg-slate-800/40 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-white text-xs truncate">
                          {cust.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          MST: {cust.taxCode} • Gói: {cust.servicePackage || 'Chuẩn'}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                            cust.taxRiskScore === 'BAO_DONG' ? 'bg-rose-100 text-rose-700' :
                            cust.taxRiskScore === 'CAO' ? 'bg-amber-100 text-amber-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            Rủi ro thuế: {cust.taxRiskScore || 'THAP'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Hạn HĐ: {cust.contractEndDate || '2026-12-31'}
                          </span>
                        </div>
                      </div>

                      {onSelectCustomer && (
                        <button
                          onClick={() => {
                            onSelectCustomer(cust);
                            setSelectedStaff(null);
                          }}
                          className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold shrink-0 cursor-pointer flex items-center space-x-1"
                        >
                          <span>Hồ sơ</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <button
                onClick={() => {
                  handleOpenRebalance(selectedStaff);
                  setSelectedStaff(null);
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
              >
                <ArrowRightLeft className="h-4 w-4" />
                <span>Mở Công Cụ San Tải Cho {selectedStaff.userName}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rebalance Modal (Điều phối & San tải nhiều khách hàng) */}
      {isRebalanceModalOpen && sourceStaff && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <span className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 rounded-xl">
                  <ArrowRightLeft className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Điều Phối & San Tải Khách Hàng
                  </h3>
                  <p className="text-xs text-slate-500">
                    Chuyển giao khách hàng từ <span className="font-bold text-rose-600">{sourceStaff.userName}</span> ({sourceStaff.assignedCustomersCount} KH) sang nhân sự khác
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRebalanceModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Select Target Staff */}
            <div className="mt-4 p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/60">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Chọn Chuyên viên tiếp nhận bàn giao:
              </label>
              <select
                value={targetStaffId}
                onChange={e => setTargetStaffId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-hidden cursor-pointer"
              >
                <option value="">-- Chọn nhân sự tiếp nhận --</option>
                {workloads
                  .filter(w => w.userId !== sourceStaff.userId)
                  .map(target => (
                    <option key={target.userId} value={target.userId}>
                      {target.userName} ({target.position}) — Đang gánh: {target.assignedCustomersCount}/{target.customerCapacity} KH ({target.status === 'AVAILABLE' ? 'Còn nhiều chỗ' : target.status === 'OPTIMAL' ? 'Cân bằng' : 'Đã đầy'})
                    </option>
                  ))}
              </select>
            </div>

            {/* Select Customers to Transfer */}
            <div className="mt-4 flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Chọn khách hàng cần chuyển giao ({selectedCustomerIds.length}/{sourceStaff.assignedCustomers.length}):
                </span>
                <button
                  type="button"
                  onClick={handleSelectAllCustomers}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                >
                  {selectedCustomerIds.length === sourceStaff.assignedCustomers.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
              </div>

              <div className="overflow-y-auto space-y-2 pr-1 max-h-64">
                {sourceStaff.assignedCustomers.map(cust => {
                  const isChecked = selectedCustomerIds.includes(cust.id);
                  return (
                    <div
                      key={cust.id}
                      onClick={() => handleToggleSelectCustomer(cust.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isChecked
                          ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center text-white text-xs ${
                          isChecked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'
                        }`}>
                          {isChecked && <Check className="h-3.5 w-3.5" />}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white text-xs">{cust.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">MST: {cust.taxCode} • Phí: {(cust.monthlyFee || 2500000).toLocaleString('vi-VN')} đ/tháng</div>
                        </div>
                      </div>

                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                        {cust.taxRiskScore || 'THAP'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Task Auto-Sync Toggle Option */}
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reassignActiveTasks}
                  onChange={(e) => setReassignActiveTasks(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span>Tự động đồng bộ và chuyển giao toàn bộ Công việc (Tasks) đang mở sang chuyên viên mới</span>
              </label>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsRebalanceModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={selectedCustomerIds.length === 0 || !targetStaffId}
                onClick={handleExecuteRebalance}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
              >
                <ArrowRightLeft className="h-4 w-4" />
                <span>Xác Nhận Chuyển Giao ({selectedCustomerIds.length} KH)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

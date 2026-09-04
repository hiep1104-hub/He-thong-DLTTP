import React, { useState, useMemo } from 'react';
import { User, LeaveRequest, LeaveType, BusinessTrip, BusinessTripType, BusinessTripTimeSlot, BusinessTripTransport, Customer } from '../../types';
import { storageService, CURRENT_SYSTEM_DATE } from '../../services/storageService';
import { PermissionService } from '../../utils/permissions';
import { formatDate } from '../../utils/formatters';
import {
  X,
  Calendar,
  Clock,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Plus,
  Send,
  Building2,
  Users,
  MapPin,
  Car,
  FileText,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  Check,
  Ban,
  Navigation,
  ArrowRight,
  ExternalLink,
  Layers,
  Sparkles,
  Plane,
  Trash2
} from 'lucide-react';

interface QuickLeaveAndTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  customers?: Customer[];
  users?: User[];
  onNavigateToHR?: () => void;
  onDataReload?: () => void;
}

const LEAVE_TYPE_CONFIG: Record<LeaveType, { label: string; desc: string; color: string; badge: string }> = {
  PHEP_NAM: {
    label: 'Nghỉ phép năm',
    desc: 'Hưởng 100% lương theo quỹ phép năm quy định (12-14 ngày/năm)',
    color: 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300',
    badge: 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300',
  },
  NGHI_OM: {
    label: 'Nghỉ ốm (Hưởng BHXH)',
    desc: 'Hưởng 75% mức lương đóng BHXH theo quy định chế độ ốm đau',
    color: 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300',
    badge: 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300',
  },
  VIEC_RIENG: {
    label: 'Việc riêng hưởng lương',
    desc: 'Kết hôn (3 ngày), con kết hôn (1 ngày), tang chế tứ thân phụ mẫu (3 ngày)',
    color: 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300',
    badge: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300',
  },
  THAI_SAN: {
    label: 'Nghỉ thai sản / Khám thai',
    desc: 'Theo chế độ thai sản Luật BHXH (Nghỉ sinh 6 tháng hoặc khám thai)',
    color: 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300',
    badge: 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300',
  },
  NGHI_KHONG_LUONG: {
    label: 'Nghỉ không hưởng lương',
    desc: 'Thỏa thuận nghỉ việc riêng không hưởng lương theo nhu cầu cá nhân',
    color: 'border-slate-400 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300',
    badge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
  },
  CONG_TAC_KHACH_HANG: {
    label: 'Công tác tại khách hàng / Cơ quan',
    desc: 'Đã chuyển sang tab Lệnh Đi Công Tác',
    color: 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300',
    badge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300',
  },
};

const AVAILABLE_LEAVE_TYPES: LeaveType[] = [
  'PHEP_NAM',
  'NGHI_OM',
  'VIEC_RIENG',
  'THAI_SAN',
  'NGHI_KHONG_LUONG',
];

const TRIP_TYPE_CONFIG: Record<BusinessTripType, { label: string; icon: any; color: string }> = {
  CO_QUAN_THUE: { label: 'Chi Cục / Cục Thuế', icon: Building2, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800' },
  KHACH_HANG: { label: 'Trụ sở Doanh nghiệp', icon: Briefcase, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800' },
  BHXH_DKKD: { label: 'Sở KH&ĐT / Cơ quan BHXH', icon: ShieldCheck, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800' },
  NGAN_HANG_TOA_AN: { label: 'Ngân Hàng / Công Chứng', icon: FileText, color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800' },
  KHAO_SAT_THUC_DIA: { label: 'Khảo sát hiện trường', icon: MapPin, color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800' },
  LIEN_TINH: { label: 'Công tác liên tỉnh', icon: Navigation, color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800' },
  KHAC: { label: 'Địa điểm khác', icon: Layers, color: 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700' },
};

export const QuickLeaveAndTripModal: React.FC<QuickLeaveAndTripModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  customers = [],
  users = [],
  onNavigateToHR,
  onDataReload,
}) => {
  const [activeTab, setActiveTab] = useState<'LEAVE' | 'TRIP' | 'MY_HISTORY' | 'PENDING_APPROVAL'>('LEAVE');
  
  // Safe Fallback for customers and users from storage if props are empty
  const allCustomers = useMemo(() => {
    const fromStorage = storageService.getCustomers();
    if (fromStorage && fromStorage.length > 0) return fromStorage;
    if (customers && customers.length > 0) return customers;
    return [];
  }, [customers]);

  const allUsers = useMemo(() => {
    const fromStorage = storageService.getEmployees();
    if (fromStorage && fromStorage.length > 0) return fromStorage;
    if (users && users.length > 0) return users;
    return [];
  }, [users]);

  // Data lists from storage
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => storageService.getLeaveRequests());
  const [businessTrips, setBusinessTrips] = useState<BusinessTrip[]>(() => storageService.getBusinessTrips());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const canReview = PermissionService.canReviewLeave(currentUser) || 
                    currentUser.role === 'ADMIN' || 
                    currentUser.role === 'BAN_GIAM_DOC' || 
                    currentUser.role === 'TRUONG_PHONG';

  const refreshLocalData = () => {
    setLeaveRequests(storageService.getLeaveRequests());
    setBusinessTrips(storageService.getBusinessTrips());
    if (onDataReload) onDataReload();
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Delete confirmation state for "Đơn Của Tôi"
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'LEAVE' | 'TRIP';
    id: string;
    title: string;
    subText?: string;
  } | null>(null);

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'LEAVE') {
      storageService.deleteLeaveRequest(itemToDelete.id, currentUser);
      showToast('Đã xoá đơn xin nghỉ phép thành công!');
    } else {
      storageService.deleteBusinessTrip(itemToDelete.id, currentUser);
      showToast('Đã xoá hồ sơ đi công tác thành công!');
    }
    setItemToDelete(null);
    refreshLocalData();
  };

  // --- LEAVE FORM STATE ---
  const [leaveType, setLeaveType] = useState<LeaveType>('PHEP_NAM');
  const [leaveStartDate, setLeaveStartDate] = useState(CURRENT_SYSTEM_DATE);
  const [leaveEndDate, setLeaveEndDate] = useState(CURRENT_SYSTEM_DATE);
  const [leaveDaysCount, setLeaveDaysCount] = useState(1);
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveHandoverStaff, setLeaveHandoverStaff] = useState('');

  // --- BUSINESS TRIP FORM STATE ---
  const [tripType, setTripType] = useState<BusinessTripType>('CO_QUAN_THUE');
  const [tripTitle, setTripTitle] = useState('Làm việc Thuế cơ sở - Giải trình số liệu tờ khai');
  const [tripCustomerId, setTripCustomerId] = useState<string>(() => allCustomers[0]?.id || '');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isCustomerSelectorExpanded, setIsCustomerSelectorExpanded] = useState(false);
  const [tripDestination, setTripDestination] = useState('Thuế cơ sở 2 TP. Hồ Chí Minh');
  const [tripStartDate, setTripStartDate] = useState(CURRENT_SYSTEM_DATE);
  const [tripEndDate, setTripEndDate] = useState(CURRENT_SYSTEM_DATE);
  const [tripTimeSlot, setTripTimeSlot] = useState<BusinessTripTimeSlot>('SANG');
  const [tripTransport, setTripTransport] = useState<BusinessTripTransport>('XE_MAY_CA_NHAN');
  const [tripPurpose, setTripPurpose] = useState('');
  const [tripAdvance, setTripAdvance] = useState<number>(0);
  const [tripTasks, setTripTasks] = useState<string[]>(['Bàn giao văn bản giải trình và hồ sơ kèm theo', 'Lấy biên nhận tiếp nhận hồ sơ từ cán bộ tiếp dân']);
  const [newTaskInput, setNewTaskInput] = useState('');

  // Selected customer
  const selectedCustomer = useMemo(() => {
    return allCustomers.find(c => c.id === tripCustomerId);
  }, [allCustomers, tripCustomerId]);

  // Filtered customer list for search
  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) return allCustomers;
    const q = customerSearchQuery.toLowerCase().trim();
    return allCustomers.filter(c => 
      c.name.toLowerCase().includes(q) ||
      (c.taxCode && c.taxCode.toLowerCase().includes(q)) ||
      (c.shortName && c.shortName.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q)) ||
      (c.taxDepartment && c.taxDepartment.toLowerCase().includes(q)) ||
      (c.legalRepresentative && c.legalRepresentative.toLowerCase().includes(q))
    );
  }, [allCustomers, customerSearchQuery]);

  // Handler for selecting customer
  const handleSelectCustomer = (cId: string) => {
    setTripCustomerId(cId);
    setIsCustomerSelectorExpanded(false);
    if (!cId) return;

    const c = allCustomers.find(item => item.id === cId);
    if (c) {
      if (tripType === 'KHACH_HANG') {
        setTripDestination(c.address || `Trụ sở ${c.name}`);
        setTripTitle(`Làm việc tại trụ sở ${c.name}`);
      } else if (tripType === 'CO_QUAN_THUE') {
        if (c.taxDepartment) {
          setTripDestination(c.taxDepartment);
        }
        setTripTitle(`Làm việc cơ quan Thuế về hồ sơ ${c.name}`);
      } else if (tripType === 'BHXH_DKKD') {
        setTripTitle(`Thủ tục ĐKKD / BHXH cho ${c.name}`);
      }
    }
  };

  // Pending counts
  const pendingLeaves = useMemo(() => leaveRequests.filter(l => l.status === 'CHO_DUYET'), [leaveRequests]);
  const pendingTrips = useMemo(() => businessTrips.filter(t => t.status === 'CHO_DUYET'), [businessTrips]);
  const totalPendingForReview = pendingLeaves.length + pendingTrips.length;

  const myLeaves = useMemo(() => leaveRequests.filter(l => l.employeeId === currentUser.id), [leaveRequests, currentUser.id]);
  const myTrips = useMemo(() => businessTrips.filter(t => t.employeeId === currentUser.id), [businessTrips, currentUser.id]);

  // Handle Leave Submission
  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason.trim()) {
      alert('Vui lòng nhập lý do xin nghỉ phép');
      return;
    }

    storageService.createLeaveRequest({
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      department: currentUser.department || 'KE_TOAN_THUE',
      leaveType,
      startDate: leaveStartDate,
      endDate: leaveEndDate,
      daysCount: Math.max(1, leaveDaysCount),
      reason: leaveHandoverStaff ? `${leaveReason} (Bàn giao: ${leaveHandoverStaff})` : leaveReason,
      destinationOrClient: leaveType === 'CONG_TAC_KHACH_HANG' ? 'Khách hàng / Thực địa' : undefined,
    }, currentUser);

    refreshLocalData();
    showToast('Đã gửi đơn xin nghỉ phép thành công! Quản lý sẽ nhận được thông báo xét duyệt.');
    setLeaveReason('');
    setActiveTab('MY_HISTORY');
  };

  // Handle Business Trip Submission
  const handleSubmitTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripTitle.trim()) {
      alert('Vui lòng nhập tiêu đề chuyến công tác');
      return;
    }

    const selectedCust = allCustomers.find(c => c.id === tripCustomerId);

    storageService.createBusinessTrip({
      title: tripTitle.trim(),
      tripType,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      department: currentUser.department || 'KE_TOAN_THUE',
      position: currentUser.position || 'Chuyên viên',
      customerId: selectedCust?.id,
      customerName: selectedCust?.name,
      customerTaxCode: selectedCust?.taxCode,
      destination: tripDestination.trim(),
      startDate: tripStartDate,
      endDate: tripEndDate,
      timeSlot: tripTimeSlot,
      estimatedDuration: tripTimeSlot === 'CA_NGAY' ? '1 ngày' : '1 buổi (3-4 giờ)',
      transportation: tripTransport,
      purpose: tripPurpose.trim() || tripTitle.trim(),
      advanceAmount: tripAdvance,
      tasks: tripTasks.map((t, idx) => ({ id: `T${idx+1}`, title: t, isCompleted: false })),
    }, currentUser);

    refreshLocalData();
    showToast('Đã đăng ký lệnh đi công tác thành công! Phiếu công tác đã được gửi lên hệ thống.');
    setTripPurpose('');
    setActiveTab('MY_HISTORY');
  };

  // Quick Approval Handlers
  const handleApproveLeave = (leaveId: string, isApproved: boolean) => {
    storageService.approveLeaveRequest(
      leaveId,
      isApproved ? 'DA_DUYET' : 'TU_CHOI',
      isApproved ? undefined : 'Yêu cầu sắp xếp lại thời gian hoặc người bàn giao công việc',
      currentUser
    );
    refreshLocalData();
    showToast(isApproved ? 'Đã phê duyệt đơn nghỉ phép!' : 'Đã từ chối đơn nghỉ phép!');
  };

  const handleApproveTrip = (tripId: string, isApproved: boolean) => {
    storageService.approveBusinessTrip(
      tripId,
      isApproved ? 'DA_DUYET' : 'TU_CHOI',
      isApproved ? undefined : 'Chưa phù hợp kế hoạch công tác hiện tại',
      currentUser
    );
    refreshLocalData();
    showToast(isApproved ? 'Đã phê duyệt lệnh đi công tác!' : 'Đã từ chối lệnh đi công tác!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/70 backdrop-blur-sm flex justify-end">
      <div className="bg-white dark:bg-slate-900 shadow-2xl w-full max-w-4xl h-full flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 border-l border-slate-200 dark:border-slate-800">
        
        {/* MODAL HEADER */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shadow-xs shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Tác Nghiệp Nhanh: Nghỉ Phép & Lịch Công Tác
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Dùng Thường Xuyên
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Cán bộ làm đơn: <strong className="text-slate-200">{currentUser.name}</strong> • Vị trí: <strong className="text-slate-200">{currentUser.position || 'Chuyên viên'}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* TOAST ALERT */}
        {toastMessage && (
          <div className="bg-emerald-500 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between shadow-xs animate-in slide-in-from-top-2">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white">✕</button>
          </div>
        )}

        {/* NAVIGATION TABS */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-4 sm:px-6 pt-3 gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('LEAVE')}
            className={`pb-3 px-3 text-xs font-extrabold border-b-2 flex items-center space-x-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'LEAVE'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Đăng Ký Nghỉ Phép</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TRIP')}
            className={`pb-3 px-3 text-xs font-extrabold border-b-2 flex items-center space-x-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'TRIP'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Car className="h-4 w-4" />
            <span>Lịch Đi Công Tác (Check-in)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MY_HISTORY')}
            className={`pb-3 px-3 text-xs font-extrabold border-b-2 flex items-center space-x-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'MY_HISTORY'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Đơn Của Tôi ({myLeaves.length + myTrips.length})</span>
          </button>

          {canReview && (
            <button
              type="button"
              onClick={() => setActiveTab('PENDING_APPROVAL')}
              className={`pb-3 px-3 text-xs font-extrabold border-b-2 flex items-center space-x-1.5 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'PENDING_APPROVAL'
                  ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Duyệt Đơn Chờ ({totalPendingForReview})</span>
              {totalPendingForReview > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-black">
                  {totalPendingForReview}
                </span>
              )}
            </button>
          )}
        </div>

        {/* MODAL BODY */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">

          {/* TAB 1: ĐĂNG KÝ NGHỈ PHÉP */}
          {activeTab === 'LEAVE' && (
            <form onSubmit={handleSubmitLeave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  1. Chọn Loại Nghỉ Phép (Theo quy định Bộ luật Lao động 2019):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {AVAILABLE_LEAVE_TYPES.map(key => {
                    const cfg = LEAVE_TYPE_CONFIG[key];
                    const isSelected = leaveType === key;
                    return (
                      <div
                        key={key}
                        onClick={() => setLeaveType(key)}
                        className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? `${cfg.color} shadow-xs font-semibold`
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold">{cfg.label}</span>
                          {isSelected && <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          {cfg.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Date selection & Days count */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Từ Ngày
                  </label>
                  <input
                    type="date"
                    value={leaveStartDate}
                    onChange={e => setLeaveStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Đến Ngày
                  </label>
                  <input
                    type="date"
                    value={leaveEndDate}
                    onChange={e => setLeaveEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Tổng Số Ngày Nghỉ
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min={0.5}
                      step={0.5}
                      value={leaveDaysCount}
                      onChange={e => setLeaveDaysCount(parseFloat(e.target.value) || 1)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-emerald-600"
                      required
                    />
                    <span className="text-xs text-slate-500 font-medium">ngày</span>
                  </div>
                </div>
              </div>

              {/* Handover staff */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nhân Sự Thay Thế / Phụ Trách Hồ Sơ Khách Hàng Tạm Thời:
                </label>
                <select
                  value={leaveHandoverStaff}
                  onChange={e => setLeaveHandoverStaff(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium"
                >
                  <option value="">-- Chọn nhân sự bàn giao (hoặc để trống) --</option>
                  {allUsers.filter(u => u.id !== currentUser.id).map(u => (
                    <option key={u.id} value={`${u.name} (${u.code})`}>
                      {u.name} - {u.position || 'Chuyên viên'} ({u.department})
                    </option>
                  ))}
                </select>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Lý Do Xin Nghỉ Phép <span className="text-rose-500">*</span>:
                </label>
                <textarea
                  rows={2}
                  value={leaveReason}
                  onChange={e => setLeaveReason(e.target.value)}
                  placeholder="Ví dụ: Giải quyết việc gia đình cá nhân, đã hoàn tất nộp tờ khai thuế GTGT tháng 7..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                  required
                />
              </div>

              {/* Submit button */}
              <div className="flex items-center justify-between pt-2">
                <p className="text-[11px] text-slate-500">
                  ⚡ Đơn sẽ được tự động chuyển đến Trưởng phòng duyệt và ghi nhận vào bảng chấm công tháng.
                </p>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>Gửi Đơn Xin Nghỉ Phép</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: ĐĂNG KÝ LỊCH CÔNG TÁC */}
          {activeTab === 'TRIP' && (
            <form onSubmit={handleSubmitTrip} className="space-y-4">
              
              {/* Trip type selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  1. Mục Đích / Nơi Đến Công Tác:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.keys(TRIP_TYPE_CONFIG) as BusinessTripType[]).map(key => {
                    const cfg = TRIP_TYPE_CONFIG[key];
                    const Icon = cfg.icon;
                    const isSelected = tripType === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setTripType(key);
                          const c = selectedCustomer || allCustomers.find(item => item.id === tripCustomerId);
                          if (key === 'CO_QUAN_THUE') {
                            setTripTitle(c ? `Làm việc Thuế cơ sở về hồ sơ ${c.name}` : 'Làm việc Thuế cơ sở - Giải trình số liệu tờ khai');
                            setTripDestination(c?.taxDepartment || 'Thuế cơ sở 2 TP. Hồ Chí Minh');
                          } else if (key === 'KHACH_HANG') {
                            setTripTitle(c ? `Làm việc tại trụ sở ${c.name}` : 'Làm việc tại trụ sở Doanh nghiệp');
                            setTripDestination(c?.address || 'Trụ sở khách hàng');
                          } else if (key === 'BHXH_DKKD') {
                            setTripTitle(c ? `Nộp hồ sơ BHXH / Đổi ĐKKD cho ${c.name}` : 'Nộp hồ sơ BHXH / Đổi giấy phép ĐKKD Sở KH&ĐT');
                            setTripDestination('Sở Kế hoạch và Đầu tư TP. Hồ Chí Minh (32 Lê Thánh Tôn, Q.1)');
                          } else if (key === 'NGAN_HANG_TOA_AN') {
                            setTripTitle(c ? `Mở tài khoản / Công chứng hồ sơ ${c.name}` : 'Giao dịch Ngân hàng & Văn phòng Công chứng');
                            setTripDestination('Ngân hàng Thương mại / Văn phòng Công chứng');
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-left flex items-center space-x-2 transition-all cursor-pointer ${
                          isSelected
                            ? `${cfg.color} ring-2 ring-blue-500/20 font-bold`
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="text-[11px] truncate">{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Customer Selector with Search & Quick Chips */}
              <div className="p-4 bg-slate-50 dark:bg-slate-850/80 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    2. Khách Hàng / Doanh Nghiệp Liên Quan ({allCustomers.length} Doanh nghiệp):
                  </label>
                  {tripCustomerId && (
                    <button
                      type="button"
                      onClick={() => handleSelectCustomer('')}
                      className="text-[11px] text-slate-500 hover:text-rose-600 font-semibold cursor-pointer"
                    >
                      ✕ Bỏ chọn khách hàng
                    </button>
                  )}
                </div>

                {/* Search Bar & Select Dropdown */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-5 relative">
                    <input
                      type="text"
                      placeholder="🔍 Tìm nhanh: MST, Tên Cty, Thuế cơ sở..."
                      value={customerSearchQuery}
                      onChange={e => setCustomerSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500/20"
                    />
                    {customerSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setCustomerSearchQuery('')}
                        className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="sm:col-span-7">
                    <select
                      value={tripCustomerId}
                      onChange={e => handleSelectCustomer(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="">-- Chọn Doanh nghiệp từ danh sách ({filteredCustomers.length} kết quả) --</option>
                      {filteredCustomers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.taxCode ? `(MST: ${c.taxCode})` : ''} {c.taxDepartment ? `- [${c.taxDepartment}]` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Title & Destination */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tiêu Đề Công Tác / Công Lệnh <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="text"
                    value={tripTitle}
                    onChange={e => setTripTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Địa Chỉ Điểm Đến / Cơ Quan Làm Việc <span className="text-rose-500">*</span>:
                  </label>
                  <div className="relative">
                    <MapPin className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={tripDestination}
                      onChange={e => setTripDestination(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Time & Transportation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Ngày Đi
                  </label>
                  <input
                    type="date"
                    value={tripStartDate}
                    onChange={e => setTripStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Khung Giờ
                  </label>
                  <select
                    value={tripTimeSlot}
                    onChange={e => setTripTimeSlot(e.target.value as BusinessTripTimeSlot)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                  >
                    <option value="SANG">Buổi Sáng (08:00 - 12:00)</option>
                    <option value="CHIEU">Buổi Chiều (13:30 - 17:30)</option>
                    <option value="CA_NGAY">Cả Ngày Làm Việc</option>
                    <option value="NHIEU_NGAY">Nhiều Ngày Liên Tiếp</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Phương Tiện
                  </label>
                  <select
                    value={tripTransport}
                    onChange={e => setTripTransport(e.target.value as BusinessTripTransport)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                  >
                    <option value="XE_MAY_CA_NHAN">Xe Máy Cá Nhân (Khoán xăng)</option>
                    <option value="GRAB_TAXI">Grab / Taxi (Thanh toán hóa đơn)</option>
                    <option value="XE_CONG_TY">Xe Ô Tô Công Ty</option>
                    <option value="MAY_BAY_TAU_XE">Máy Bay / Tàu Xe</option>
                  </select>
                </div>
              </div>

              {/* Task checklist to complete on site */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Đầu Việc Cần Thực Hiện Tại Hiện Trường:
                </label>
                <div className="space-y-1.5">
                  {tripTasks.map((t, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-700 dark:text-slate-300">{index + 1}. {t}</span>
                      <button
                        type="button"
                        onClick={() => setTripTasks(tripTasks.filter((_, i) => i !== index))}
                        className="text-rose-500 hover:text-rose-700 text-xs px-2"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="text"
                      placeholder="+ Thêm đầu việc cần làm tại hiện trường..."
                      value={newTaskInput}
                      onChange={e => setNewTaskInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newTaskInput.trim()) {
                          e.preventDefault();
                          setTripTasks([...tripTasks, newTaskInput.trim()]);
                          setNewTaskInput('');
                        }
                      }}
                      className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newTaskInput.trim()) {
                          setTripTasks([...tripTasks, newTaskInput.trim()]);
                          setNewTaskInput('');
                        }
                      }}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold"
                    >
                      Thêm
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit button */}
              <div className="flex items-center justify-between pt-2">
                <p className="text-[11px] text-slate-500">
                  🚗 Hệ thống hỗ trợ Check-in GPS & In Giấy Đi Đường / Công Lệnh tự động.
                </p>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>Đăng Ký Lệnh Công Tác</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: ĐƠN CỦA TÔI & TIẾN ĐỘ */}
          {activeTab === 'MY_HISTORY' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Lịch Sử Đơn Nghỉ Phép & Công Tác Của Tôi ({myLeaves.length + myTrips.length})
                </h3>
              </div>

              {myLeaves.length === 0 && myTrips.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <Calendar className="h-8 w-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Bạn chưa tạo đơn xin nghỉ phép hoặc lệnh công tác nào gần đây
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Nhấp vào các tab trên để tạo đơn xin nghỉ phép hoặc đăng ký lịch đi công tác ngay.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* Leaves */}
                  {myLeaves.map(leave => {
                    const cfg = LEAVE_TYPE_CONFIG[leave.leaveType] || LEAVE_TYPE_CONFIG.PHEP_NAM;
                    return (
                      <div
                        key={leave.id}
                        className="p-3.5 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start space-x-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shrink-0">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                                {cfg.label}
                              </span>
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                {leave.daysCount} ngày ({formatDate(leave.startDate)} → {formatDate(leave.endDate)})
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                              Lý do: {leave.reason}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          {leave.status === 'CHO_DUYET' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>Đang chờ duyệt</span>
                            </span>
                          )}
                          {leave.status === 'DA_DUYET' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-1">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Đã duyệt ({leave.approverName || 'Trưởng phòng'})</span>
                            </span>
                          )}
                          {leave.status === 'TU_CHOI' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center space-x-1">
                              <Ban className="h-3 w-3" />
                              <span>Bị từ chối</span>
                            </span>
                          )}

                          {/* Nút Xoá đơn nghỉ phép */}
                          <button
                            type="button"
                            onClick={() => setItemToDelete({
                              type: 'LEAVE',
                              id: leave.id,
                              title: `${cfg.label} (${leave.daysCount} ngày)`,
                              subText: `Thời gian: ${formatDate(leave.startDate)} → ${formatDate(leave.endDate)} • Lý do: ${leave.reason}`,
                            })}
                            className="flex items-center space-x-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/70 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                            title="Xoá đơn xin nghỉ phép này"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Xoá</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Trips */}
                  {myTrips.map(trip => {
                    const cfg = TRIP_TYPE_CONFIG[trip.tripType] || TRIP_TYPE_CONFIG.KHAC;
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={trip.id}
                        className="p-3.5 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start space-x-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center shrink-0">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600">
                                {trip.code}
                              </span>
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                {trip.title}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                              <span className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span>{trip.destination} ({formatDate(trip.startDate)})</span>
                              </span>
                              {trip.customerName && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50">
                                  🏢 {trip.customerName} {trip.customerTaxCode ? `(MST: ${trip.customerTaxCode})` : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          {trip.status === 'CHO_DUYET' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>Chờ lệnh duyệt</span>
                            </span>
                          )}
                          {trip.status === 'DA_DUYET' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-1">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Đã có công lệnh</span>
                            </span>
                          )}
                          {trip.status === 'DANG_DI' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center space-x-1">
                              <Car className="h-3 w-3" />
                              <span>Đang tại hiện trường</span>
                            </span>
                          )}
                          {trip.status === 'HOAN_THANH' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center space-x-1">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Đã báo cáo xong</span>
                            </span>
                          )}

                          {/* Nút Xoá hồ sơ công tác */}
                          <button
                            type="button"
                            onClick={() => setItemToDelete({
                              type: 'TRIP',
                              id: trip.id,
                              title: `Lệnh công tác: ${trip.title} (${trip.code})`,
                              subText: `Địa điểm: ${trip.destination} • Ngày: ${formatDate(trip.startDate)}`,
                            })}
                            className="flex items-center space-x-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/70 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                            title="Xoá hồ sơ công tác này"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Xoá</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PHÊ DUYỆT ĐƠN CHỜ DUYỆT (CHO QUẢN LÝ / TRƯỞNG PHÒNG) */}
          {activeTab === 'PENDING_APPROVAL' && canReview && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Hàng Đợi Phê Duyệt Nghỉ Phép & Lịch Công Tác ({totalPendingForReview} yêu cầu)
                </h3>
              </div>

              {totalPendingForReview === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Tuyệt vời! Không có đơn xin nghỉ phép hay lịch công tác nào đang tồn đọng
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Pending leaves */}
                  {pendingLeaves.map(leave => {
                    const cfg = LEAVE_TYPE_CONFIG[leave.leaveType] || LEAVE_TYPE_CONFIG.PHEP_NAM;
                    return (
                      <div
                        key={leave.id}
                        className="p-4 bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-black text-slate-900 dark:text-white">
                              {leave.employeeName}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                              {cfg.label}
                            </span>
                            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                              {leave.daysCount} ngày ({formatDate(leave.startDate)} → {formatDate(leave.endDate)})
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                            Lý do: {leave.reason}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleApproveLeave(leave.id, true)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center space-x-1 cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Duyệt</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApproveLeave(leave.id, false)}
                            className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/60 text-rose-700 dark:text-rose-200 rounded-xl text-xs font-bold cursor-pointer"
                          >
                            <Ban className="h-3.5 w-3.5" />
                            <span>Từ chối</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Pending Trips */}
                  {pendingTrips.map(trip => (
                    <div
                      key={trip.id}
                      className="p-4 bg-blue-50/60 dark:bg-blue-950/20 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            {trip.employeeName}
                          </span>
                          <span className="text-[10px] font-mono bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-bold">
                            {trip.code}
                          </span>
                          <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                            {trip.title}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300 mt-1">
                          <span className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            <span>{trip.destination} • {formatDate(trip.startDate)} ({trip.timeSlot})</span>
                          </span>
                          {trip.customerName && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
                              🏢 {trip.customerName} {trip.customerTaxCode ? `(MST: ${trip.customerTaxCode})` : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleApproveTrip(trip.id, true)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center space-x-1 cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Cấp Công Lệnh</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApproveTrip(trip.id, false)}
                          className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/60 text-rose-700 dark:text-rose-200 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          <Ban className="h-3.5 w-3.5" />
                          <span>Từ chối</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          {onNavigateToHR && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToHR();
              }}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>Mở Phân Hệ Quản Trị Nhân Sự & Lương Toàn Diện</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}

          <div className="flex items-center space-x-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>

      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {itemToDelete && (
        <div className="fixed inset-0 z-70 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-850 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-gradient-to-r from-rose-600 to-red-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Trash2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Xác Nhận Xoá Đơn</h4>
                  <p className="text-[11px] text-rose-100">
                    {itemToDelete.type === 'LEAVE' ? 'Đơn xin nghỉ phép' : 'Lịch trình / Hồ sơ công tác'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-700 dark:text-slate-300">
                Bạn có chắc chắn muốn xoá đơn này khỏi danh sách <strong>"Đơn Của Tôi"</strong> không?
              </p>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white text-xs">
                  {itemToDelete.title}
                </div>
                {itemToDelete.subText && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {itemToDelete.subText}
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Sau khi xoá, đơn sẽ được thu hồi hoàn toàn khỏi hệ thống và không còn hiển thị trong hàng đợi xét duyệt.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex items-center space-x-1.5 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Xác nhận xoá</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { 
  BusinessTrip, 
  BusinessTripExpenseItem, 
  BusinessTripStatus, 
  User, 
  Customer 
} from '../../types';
import { storageService, CURRENT_SYSTEM_DATE } from '../../services/storageService';
import { formatDate, formatDateTime, formatVND } from '../../utils/formatters';
import { PermissionService } from '../../utils/permissions';
import { BusinessTripTravelOrderModal } from './BusinessTripTravelOrderModal';
import { 
  X, 
  Building, 
  Building2, 
  MapPin, 
  Calendar, 
  Clock, 
  Car, 
  DollarSign, 
  Users, 
  CheckSquare, 
  CheckCircle2, 
  AlertCircle, 
  Check, 
  Printer, 
  FileText, 
  Sparkles, 
  Briefcase, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Compass, 
  Send,
  Ban,
  ArrowRight
} from 'lucide-react';

interface BusinessTripDetailModalProps {
  trip: BusinessTrip;
  customer?: Customer;
  currentUser: User;
  onClose: () => void;
  onUpdate: () => void;
}

const TRIP_TYPE_LABELS: Record<string, { label: string; bg: string; icon: any }> = {
  CO_QUAN_THUE: { label: 'Cơ quan Thuế', bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800', icon: Building2 },
  KHACH_HANG: { label: 'Trụ sở Khách hàng', bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800', icon: Building },
  BHXH_DKKD: { label: 'BHXH & Sở KH&ĐT', bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800', icon: Briefcase },
  NGAN_HANG_TOA_AN: { label: 'Ngân hàng / Tòa án', bg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800', icon: ShieldCheck },
  KHAO_SAT_THUC_DIA: { label: 'Khảo sát thực địa', bg: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800', icon: MapPin },
  LIEN_TINH: { label: 'Công tác liên tỉnh', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800', icon: Car },
  KHAC: { label: 'Mục đích khác', bg: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700', icon: FileText },
};

const STATUS_BADGES: Record<BusinessTripStatus, { label: string; bg: string; text: string }> = {
  CHO_DUYET: { label: 'Chờ phê duyệt', bg: 'bg-amber-100 dark:bg-amber-950/80 border-amber-300 text-amber-800 dark:text-amber-300', text: 'Chờ duyệt' },
  DA_DUYET: { label: 'Đã duyệt • Sẵn sàng', bg: 'bg-blue-100 dark:bg-blue-950/80 border-blue-300 text-blue-800 dark:text-blue-300', text: 'Đã duyệt' },
  DANG_DI: { label: 'Đang thực địa', bg: 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-300 text-emerald-800 dark:text-emerald-300', text: 'Đang đi' },
  HOAN_THANH: { label: 'Đã hoàn thành & Báo cáo', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-700 dark:text-emerald-300', text: 'Hoàn thành' },
  TU_CHOI: { label: 'Bị từ chối', bg: 'bg-rose-100 dark:bg-rose-950/80 border-rose-300 text-rose-800 dark:text-rose-300', text: 'Từ chối' },
  DA_HUY: { label: 'Đã hủy lịch', bg: 'bg-slate-100 dark:bg-slate-800 border-slate-300 text-slate-600 dark:text-slate-400', text: 'Đã hủy' },
};

export const BusinessTripDetailModal: React.FC<BusinessTripDetailModalProps> = ({
  trip,
  customer,
  currentUser,
  onClose,
  onUpdate,
}) => {
  const [currentTrip, setCurrentTrip] = useState<BusinessTrip>(trip);
  const [showTravelOrder, setShowTravelOrder] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TASKS' | 'EXPENSES' | 'REPORT'>('OVERVIEW');

  // Approval / Rejection States
  const [isRejecting, setIsRejecting] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // Report & Outcome Submission States
  const [reportResult, setReportResult] = useState<string>(currentTrip.resultSummary || '');
  const [deliverablesInput, setDeliverablesInput] = useState<string>(currentTrip.deliverables ? currentTrip.deliverables.join('\n') : '');
  const [actualTotalCost, setActualTotalCost] = useState<number>(currentTrip.actualTotalCost || currentTrip.advanceAmount || 0);
  
  // Expense items
  const [expenses, setExpenses] = useState<BusinessTripExpenseItem[]>(currentTrip.expenses || [
    { id: 'E-1', category: 'XANG_XE_DI_LAI', description: 'Cước di chuyển thực tế', amount: currentTrip.advanceAmount || 0 }
  ]);
  const [newExpDesc, setNewExpDesc] = useState<string>('');
  const [newExpAmount, setNewExpAmount] = useState<number>(0);
  const [newExpCat, setNewExpCat] = useState<BusinessTripExpenseItem['category']>('XANG_XE_DI_LAI');

  // RBAC permissions
  const canApprove = currentUser.role === 'ADMIN' || currentUser.role === 'BAN_GIAM_DOC' || currentUser.role === 'TRUONG_PHONG' || PermissionService.canReviewLeave(currentUser);
  const isTripOwner = currentTrip.employeeId === currentUser.id || (currentTrip.companionStaffIds && currentTrip.companionStaffIds.includes(currentUser.id));

  // Toggle Task Completion
  const handleToggleTask = (taskId: string) => {
    const updatedTasks = currentTrip.tasks.map(t => t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t);
    const updated = { ...currentTrip, tasks: updatedTasks };
    setCurrentTrip(updated);
    storageService.updateBusinessTrip(updated, currentUser);
    onUpdate();
  };

  // Approve / Reject Handlers
  const handleApprove = () => {
    storageService.approveBusinessTrip(currentTrip.id, 'DA_DUYET', undefined, currentUser);
    setCurrentTrip(prev => ({ ...prev, status: 'DA_DUYET', approverId: currentUser.id, approverName: currentUser.name, approvedAt: CURRENT_SYSTEM_DATE }));
    onUpdate();
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert('Vui lòng nhập lý do từ chối chuyến công tác');
      return;
    }
    storageService.approveBusinessTrip(currentTrip.id, 'TU_CHOI', rejectionReason.trim(), currentUser);
    setCurrentTrip(prev => ({ ...prev, status: 'TU_CHOI', rejectionReason: rejectionReason.trim() }));
    setIsRejecting(false);
    onUpdate();
  };

  // Check-in / Start trip handler
  const handleCheckin = () => {
    storageService.checkinBusinessTrip(currentTrip.id, currentTrip.destination, currentUser);
    setCurrentTrip(prev => ({ ...prev, status: 'DANG_DI', checkinAt: new Date().toISOString() }));
    onUpdate();
  };

  // Complete and Submit Report
  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportResult.trim()) {
      alert('Vui lòng nhập tóm tắt kết quả công tác thực tế');
      return;
    }

    const delivList = deliverablesInput
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const totalExp = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

    storageService.completeBusinessTripWithReport(currentTrip.id, {
      resultSummary: reportResult.trim(),
      deliverables: delivList,
      actualTotalCost: totalExp,
      expenses,
      tasks: currentTrip.tasks,
    }, currentUser);

    setCurrentTrip(prev => ({
      ...prev,
      status: 'HOAN_THANH',
      resultSummary: reportResult.trim(),
      deliverables: delivList,
      actualTotalCost: totalExp,
      expenses,
      checkoutAt: new Date().toISOString(),
    }));

    onUpdate();
    alert('Đã nộp báo cáo hoàn thành công tác & quyết toán chi phí thành công!');
  };

  const handleAddExpense = () => {
    if (!newExpDesc.trim() || newExpAmount <= 0) return;
    const newExp: BusinessTripExpenseItem = {
      id: `EXP-${Date.now()}`,
      category: newExpCat,
      description: newExpDesc.trim(),
      amount: Number(newExpAmount) || 0,
    };
    setExpenses(prev => [...prev, newExp]);
    setNewExpDesc('');
    setNewExpAmount(0);
  };

  const handleRemoveExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const currentTypeInfo = TRIP_TYPE_LABELS[currentTrip.tripType] || TRIP_TYPE_LABELS.KHAC;
  const statusInfo = STATUS_BADGES[currentTrip.status] || STATUS_BADGES.CHO_DUYET;
  const completedTasksCount = currentTrip.tasks ? currentTrip.tasks.filter(t => t.isCompleted).length : 0;
  const totalTasksCount = currentTrip.tasks ? currentTrip.tasks.length : 0;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
        <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
          
          {/* Header Banner */}
          <div className="px-6 py-4 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/30">
                <Briefcase className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                    {currentTrip.code}
                  </span>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${statusInfo.bg}`}>
                    {statusInfo.label}
                  </span>
                </div>
                <h2 className="text-base font-black tracking-tight text-white mt-1">
                  {currentTrip.title}
                </h2>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowTravelOrder(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
                title="Xem và in Giấy Đi Đường / Lệnh Điều Động"
              >
                <Printer className="h-4 w-4 text-amber-400" />
                <span className="hidden sm:inline">Giấy Đi Đường (Mẫu C06)</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center px-6 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 shrink-0 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
                activeTab === 'OVERVIEW'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              1. Tổng quan & Lộ trình
            </button>
            <button
              onClick={() => setActiveTab('TASKS')}
              className={`py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                activeTab === 'TASKS'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>2. Nghiệp vụ & Hồ sơ</span>
              <span className="px-1.5 py-0.2 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-full text-[10px] font-bold">
                {completedTasksCount}/{totalTasksCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('EXPENSES')}
              className={`py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
                activeTab === 'EXPENSES'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              3. Tạm ứng & Chi phí
            </button>
            <button
              onClick={() => setActiveTab('REPORT')}
              className={`py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                activeTab === 'REPORT'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>4. Báo cáo kết quả & Nghiệm thu</span>
              {currentTrip.status === 'HOAN_THANH' && (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              )}
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-900 dark:text-slate-100">
            
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'OVERVIEW' && (
              <div className="space-y-6">
                
                {/* Rejection Alert if rejected */}
                {currentTrip.status === 'TU_CHOI' && currentTrip.rejectionReason && (
                  <div className="bg-rose-50 dark:bg-rose-950/40 p-4 rounded-2xl border border-rose-200 dark:border-rose-800 flex items-start space-x-3 text-rose-800 dark:text-rose-300 text-xs">
                    <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
                    <div>
                      <strong className="font-bold">Chuyến công tác đã bị từ chối phê duyệt:</strong>
                      <p className="mt-0.5">{currentTrip.rejectionReason}</p>
                    </div>
                  </div>
                )}

                {/* Grid of Key Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Card 1: People in charge */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase text-slate-500 flex items-center space-x-1.5">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span>Cán bộ & Đoàn công tác</span>
                    </h4>

                    <div>
                      <span className="text-xs text-slate-400">Cán bộ phụ trách chính:</span>
                      <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2 mt-0.5">
                        <span>{currentTrip.employeeName}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 rounded font-semibold">
                          {currentTrip.position || 'Chuyên viên'}
                        </span>
                      </div>
                    </div>

                    {currentTrip.companionStaffNames && currentTrip.companionStaffNames.length > 0 && (
                      <div>
                        <span className="text-xs text-slate-400">Đồng nghiệp cùng đi:</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {currentTrip.companionStaffNames.map((name, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-medium">
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentTrip.approverName && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                        <span className="text-slate-400">Người phê duyệt:</span>{' '}
                        <strong className="text-emerald-600 dark:text-emerald-400">{currentTrip.approverName}</strong>
                        {currentTrip.approvedAt && ` (${formatDate(currentTrip.approvedAt)})`}
                      </div>
                    )}
                  </div>

                  {/* Card 2: Destination & Customer */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase text-slate-500 flex items-center space-x-1.5">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span>Địa điểm & Doanh nghiệp</span>
                    </h4>

                    <div>
                      <span className="text-xs text-slate-400">Loại hình:</span>
                      <div className="mt-1">
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-bold border inline-flex items-center space-x-1.5 ${currentTypeInfo.bg}`}>
                          <currentTypeInfo.icon className="h-3.5 w-3.5" />
                          <span>{currentTypeInfo.label}</span>
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-slate-400">Địa chỉ / Cơ quan:</span>
                      <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                        {currentTrip.destination}
                      </p>
                    </div>

                    {currentTrip.customerName && (
                      <div>
                        <span className="text-xs text-slate-400">Khách hàng liên quan:</span>
                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                          {currentTrip.customerName} (MST: {currentTrip.customerTaxCode})
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Card 3: Time & Transport */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase text-slate-500 flex items-center space-x-1.5">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span>Thời gian & Phương tiện</span>
                    </h4>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400">Từ ngày:</span>
                        <p className="font-bold">{formatDate(currentTrip.startDate)}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Đến ngày:</span>
                        <p className="font-bold">{formatDate(currentTrip.endDate)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400">Khung giờ:</span>
                        <p className="font-semibold">
                          {currentTrip.timeSlot === 'SANG' ? 'Buổi sáng (08:00 - 12:00)' :
                           currentTrip.timeSlot === 'CHIEU' ? 'Buổi chiều (13:30 - 17:30)' :
                           currentTrip.timeSlot === 'CA_NGAY' ? 'Cả ngày' : 'Nhiều ngày'}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400">Phương tiện:</span>
                        <p className="font-semibold">
                          {currentTrip.transportation === 'XE_MAY_CA_NHAN' ? 'Xe máy cá nhân' :
                           currentTrip.transportation === 'GRAB_TAXI' ? 'Grab / Taxi' :
                           currentTrip.transportation === 'XE_CONG_TY' ? 'Xe công ty' : 'Khác'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Purpose & Budget */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase text-slate-500 flex items-center space-x-1.5">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                      <span>Mục đích & Dự toán tạm ứng</span>
                    </h4>

                    <div>
                      <span className="text-xs text-slate-400">Tạm ứng công tác phí:</span>
                      <p className="text-base font-black font-mono text-blue-600 dark:text-blue-400">
                        {formatVND(currentTrip.advanceAmount)}
                      </p>
                    </div>

                    <div>
                      <span className="text-xs text-slate-400">Nội dung công việc:</span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
                        {currentTrip.purpose}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: TASKS & DELIVERABLES CHECKLIST */}
            {activeTab === 'TASKS' && (
              <div className="space-y-4">
                <div className="bg-blue-50/50 dark:bg-blue-950/30 p-4 rounded-2xl border border-blue-200 dark:border-blue-900 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200">
                      Danh Mục Nghiệp Vụ & Hồ Sơ Chứng Từ Cần Thu Thập
                    </h4>
                    <p className="text-[11px] text-blue-700 dark:text-blue-300">
                      Đánh dấu các đầu việc đã hoàn tất khi làm việc tại Chi cục Thuế hoặc Trụ sở khách hàng.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-blue-700 dark:text-blue-300">
                      {completedTasksCount}/{totalTasksCount} việc hoàn thành ({totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0}%)
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {currentTrip.tasks && currentTrip.tasks.map((task, idx) => (
                    <div
                      key={task.id || idx}
                      onClick={() => handleToggleTask(task.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        task.isCompleted
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`h-5 w-5 rounded-md flex items-center justify-center border transition-colors ${
                          task.isCompleted
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-400 bg-white dark:bg-slate-700'
                        }`}>
                          {task.isCompleted && <Check className="h-3.5 w-3.5" />}
                        </div>
                        <span className={`text-xs font-semibold ${task.isCompleted ? 'line-through opacity-80' : ''}`}>
                          {task.title}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {task.isCompleted ? 'Đã xong' : 'Chưa xong'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: EXPENSES & REIMBURSEMENT */}
            {activeTab === 'EXPENSES' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] text-slate-400 uppercase font-bold">Số tiền đã tạm ứng</span>
                    <p className="text-lg font-black font-mono text-blue-600 dark:text-blue-400 mt-1">
                      {formatVND(currentTrip.advanceAmount)}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] text-slate-400 uppercase font-bold">Chi phí thực tế kê khai</span>
                    <p className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                      {formatVND(expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0))}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] text-slate-400 uppercase font-bold">Chênh lệch quyết toán</span>
                    {(() => {
                      const diff = (currentTrip.advanceAmount || 0) - expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
                      return (
                        <p className={`text-lg font-black font-mono mt-1 ${diff > 0 ? 'text-amber-600' : diff < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                          {diff > 0 ? `Thừa hoàn lại quỹ: ${formatVND(diff)}` : diff < 0 ? `Chi bù thêm: ${formatVND(Math.abs(diff))}` : 'Cân đối đủ 100%'}
                        </p>
                      );
                    })()}
                  </div>
                </div>

                {/* Expenses List */}
                <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <h4 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                    Bảng Kê Chi Phí & Hóa Đơn Chứng Từ Đi Đường
                  </h4>

                  <div className="space-y-2">
                    {expenses.map((exp, idx) => (
                      <div
                        key={exp.id || idx}
                        className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 dark:text-white">{exp.description}</span>
                          <div className="text-[11px] text-slate-400">
                            Loại: {exp.category === 'XANG_XE_DI_LAI' ? 'Xăng xe / Taxi' : exp.category === 'LE_PHI_HO_SO' ? 'Lệ phí hồ sơ' : exp.category === 'AN_UONG_CONG_TAC_PHI' ? 'Ăn uống công tác' : 'Khác'}
                            {exp.invoiceNumber && ` • HĐ số: ${exp.invoiceNumber}`}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                            {formatVND(exp.amount)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveExpense(exp.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add New Expense Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <select
                      value={newExpCat}
                      onChange={e => setNewExpCat(e.target.value as any)}
                      className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                    >
                      <option value="XANG_XE_DI_LAI">Xăng xe / Đi lại</option>
                      <option value="LE_PHI_HO_SO">Lệ phí hồ sơ / Công chứng</option>
                      <option value="AN_UONG_CONG_TAC_PHI">Công tác phí / Ăn uống</option>
                      <option value="LUU_TRU">Lưu trú / Khách sạn</option>
                      <option value="KHAC">Chi phí khác</option>
                    </select>

                    <input
                      type="text"
                      value={newExpDesc}
                      onChange={e => setNewExpDesc(e.target.value)}
                      placeholder="Mô tả khoản chi..."
                      className="sm:col-span-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                    />

                    <div className="flex items-center space-x-1.5">
                      <input
                        type="number"
                        step={10000}
                        min={0}
                        value={newExpAmount || ''}
                        onChange={e => setNewExpAmount(Number(e.target.value))}
                        placeholder="Số tiền"
                        className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                      />
                      <button
                        type="button"
                        onClick={handleAddExpense}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Thêm</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: REPORT & RESULTS */}
            {activeTab === 'REPORT' && (
              <form onSubmit={handleSubmitReport} className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tóm tắt kết quả làm việc thực tế & Kết luận <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      value={reportResult}
                      onChange={e => setReportResult(e.target.value)}
                      placeholder="VD: Đã làm việc với Cán bộ thuế Nguyễn Văn A, hồ sơ giải trình chi phí công nghệ đã được chấp thuận 100%. Cán bộ hẹn ngày 05/09 trả Quyết định hoàn thuế..."
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Danh mục hồ sơ / chứng từ gốc đã thu thập (Mỗi mục 1 dòng)
                    </label>
                    <textarea
                      rows={3}
                      value={deliverablesInput}
                      onChange={e => setDeliverablesInput(e.target.value)}
                      placeholder="VD:&#10;- Biên bản làm việc có chữ ký Cán bộ thuế&#10;- Giấy biên nhận hồ sơ hoàn thuế số 441/BN&#10;- Hóa đơn xăng xe và vé cầu đường..."
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-end pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center space-x-2 cursor-pointer"
                    >
                      <Send className="h-4 w-4" />
                      <span>Nộp Báo Cáo Kết Quả & Hoàn Tất Chuyến Đi</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Footer Action Controls Bar */}
          <div className="p-4 bg-slate-100 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
            
            {/* Left side actions */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowTravelOrder(true)}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5 text-blue-500" />
                <span>In Giấy Đi Đường</span>
              </button>

              {/* Start trip / Check-in button */}
              {currentTrip.status === 'DA_DUYET' && (
                <button
                  type="button"
                  onClick={handleCheckin}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <Compass className="h-3.5 w-3.5" />
                  <span>Bắt Đầu Đi Công Tác (Check-in)</span>
                </button>
              )}
            </div>

            {/* Right side actions (Approval / Close) */}
            <div className="flex items-center space-x-2">
              {/* Approval controls for managers */}
              {currentTrip.status === 'CHO_DUYET' && canApprove && !isRejecting && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsRejecting(true)}
                    className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1"
                  >
                    <Ban className="h-3.5 w-3.5" />
                    <span>Từ Chối</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center space-x-1"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Phê Duyệt Lịch Công Tác</span>
                  </button>
                </>
              )}

              {/* Rejection input box */}
              {isRejecting && (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder="Nhập lý do từ chối..."
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-rose-300 rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleReject}
                    className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold"
                  >
                    Xác nhận
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRejecting(false)}
                    className="px-2.5 py-1.5 text-slate-500 hover:text-slate-700 text-xs"
                  >
                    Hủy
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Travel Order Printable Modal */}
      {showTravelOrder && (
        <BusinessTripTravelOrderModal
          trip={currentTrip}
          customer={customer}
          currentUser={currentUser}
          onClose={() => setShowTravelOrder(false)}
        />
      )}
    </>
  );
};

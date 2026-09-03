import React, { useState, useMemo } from 'react';
import { Customer, User, SystemExpiringCycleItem, EmployeeContractType } from '../../types';
import { storageService, CURRENT_SYSTEM_DATE } from '../../services/storageService';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { PermissionService } from '../../utils/permissions';
import { 
  X, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  KeyRound, 
  Receipt, 
  Users, 
  RefreshCw, 
  Search, 
  BellRing, 
  ShieldCheck, 
  Building,
  Briefcase
} from 'lucide-react';

interface CycleRenewalCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
  onSelectCustomer?: (customer: Customer) => void;
  onOpenCustomer?: (customer: Customer) => void;
  onDataChanged?: () => void;
}

export const CycleRenewalCenterModal: React.FC<CycleRenewalCenterModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectCustomer,
  onOpenCustomer,
  onDataChanged,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [activeUrgency, setActiveUrgency] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected item for Renewal Action Popup
  const [renewingItem, setRenewingItem] = useState<SystemExpiringCycleItem | null>(null);

  // Form states for Contract Renewal
  const [renewStartDate, setRenewStartDate] = useState('');
  const [renewEndDate, setRenewEndDate] = useState('');
  const [renewMonthlyFee, setRenewMonthlyFee] = useState<number>(0);
  const [renewPackageName, setRenewPackageName] = useState('');
  const [renewNotes, setRenewNotes] = useState('');

  // Form states for CKS Renewal
  const [renewCksExpiryDate, setRenewCksExpiryDate] = useState('');
  const [renewCksProvider, setRenewCksProvider] = useState('Viettel-CA');

  // Form states for HR Labor Contract Renewal
  const [renewHrContractType, setRenewHrContractType] = useState<EmployeeContractType>('XAC_DINH_1_NAM');
  const [renewHrStartDate, setRenewHrStartDate] = useState('');
  const [renewHrEndDate, setRenewHrEndDate] = useState('');
  const [renewHrSalary, setRenewHrSalary] = useState<number>(0);

  // Success toast message
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Master customer & employee data
  const customers = useMemo(() => storageService.getCustomers(), [actionSuccessMsg]);
  const employees = useMemo(() => storageService.getEmployees(), [actionSuccessMsg]);

  // Fetch live cycle items scoped to user's permissions and assigned portfolio
  const cycleItems: SystemExpiringCycleItem[] = useMemo(() => {
    const raw = storageService.getAllSystemExpiringCycles();
    return PermissionService.filterExpiringCycles(raw, currentUser, customers);
  }, [actionSuccessMsg, currentUser, customers]);

  // Urgency Counts
  const counts = useMemo(() => {
    const expired = cycleItems.filter(i => i.status === 'EXPIRED').length;
    const critical = cycleItems.filter(i => i.status === 'CRITICAL_15').length;
    const warning = cycleItems.filter(i => i.status === 'WARNING_30').length;
    const upcoming = cycleItems.filter(i => i.status === 'NOTICE_60').length;
    const valid = cycleItems.filter(i => i.status === 'VALID').length;

    const contracts = cycleItems.filter(i => i.category === 'CUSTOMER_CONTRACT').length;
    const cks = cycleItems.filter(i => i.category === 'DIGITAL_SIGNATURE').length;
    const invoices = cycleItems.filter(i => i.category === 'EINVOICE_PACKAGE').length;
    const hr = cycleItems.filter(i => i.category === 'HR_LABOR_CONTRACT' || i.category === 'HR_PROBATION').length;
    const licenses = cycleItems.filter(i => i.category === 'BUSINESS_LICENSE').length;

    return {
      total: cycleItems.length,
      expired,
      critical,
      warning,
      upcoming,
      valid,
      urgentActionCount: expired + critical + warning,
      contracts,
      cks,
      invoices,
      hr,
      licenses,
    };
  }, [cycleItems]);

  // Filter items
  const filteredItems = useMemo(() => {
    return cycleItems.filter(item => {
      if (activeCategory !== 'ALL') {
        if (activeCategory === 'HR_ALL') {
          if (item.category !== 'HR_LABOR_CONTRACT' && item.category !== 'HR_PROBATION') return false;
        } else if (item.category !== activeCategory) {
          return false;
        }
      }

      if (activeUrgency === 'URGENT' && item.status !== 'EXPIRED' && item.status !== 'CRITICAL_15' && item.status !== 'WARNING_30') return false;
      if (activeUrgency === 'EXPIRED' && item.status !== 'EXPIRED') return false;
      if (activeUrgency === 'CRITICAL_15' && item.status !== 'CRITICAL_15') return false;
      if (activeUrgency === 'WARNING_30' && item.status !== 'WARNING_30') return false;
      if (activeUrgency === 'NOTICE_60' && item.status !== 'NOTICE_60') return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(term);
        const matchEntity = item.entityName.toLowerCase().includes(term);
        const matchCode = (item.code || '').toLowerCase().includes(term);
        const matchStaff = (item.responsiblePerson || '').toLowerCase().includes(term);
        const matchExtra = (item.extraInfo || '').toLowerCase().includes(term);
        if (!matchTitle && !matchEntity && !matchCode && !matchStaff && !matchExtra) return false;
      }

      return true;
    });
  }, [cycleItems, activeCategory, activeUrgency, searchTerm]);

  // Open Action Renewal Popup
  const handleOpenRenewPopup = (item: SystemExpiringCycleItem) => {
    setRenewingItem(item);
    setActionSuccessMsg(null);

    if (item.category === 'CUSTOMER_CONTRACT') {
      const cust = customers.find(c => c.id === item.entityId);
      const startDate = cust?.contractEndDate || CURRENT_SYSTEM_DATE;
      const end = new Date(startDate);
      end.setFullYear(end.getFullYear() + 1);
      end.setDate(end.getDate() - 1);

      setRenewStartDate(startDate);
      setRenewEndDate(end.toISOString().split('T')[0]);
      setRenewMonthlyFee(cust?.monthlyFee || 0);
      setRenewPackageName(cust?.servicePackage || 'Đại lý thuế trọn gói');
      setRenewNotes(`Tái ký gia hạn hợp đồng dịch vụ đại lý thuế 1 năm (Niên độ ${new Date(startDate).getFullYear()} - ${end.getFullYear()}).`);
    } else if (item.category === 'DIGITAL_SIGNATURE') {
      const cust = customers.find(c => c.id === item.entityId);
      const curExpiry = cust?.digitalSignatureExpiry || CURRENT_SYSTEM_DATE;
      const nextExp = new Date(curExpiry);
      nextExp.setFullYear(nextExp.getFullYear() + 1);

      setRenewCksExpiryDate(nextExp.toISOString().split('T')[0]);
      setRenewCksProvider(cust?.digitalSignatureProvider || 'Viettel-CA');
    } else if (item.category === 'HR_LABOR_CONTRACT' || item.category === 'HR_PROBATION') {
      const emp = employees.find(e => e.id === item.entityId);
      const curEnd = emp?.contractEndDate || CURRENT_SYSTEM_DATE;
      const nextEnd = new Date(curEnd);
      nextEnd.setFullYear(nextEnd.getFullYear() + 1);

      setRenewHrContractType(emp?.contractType === 'THU_VIEC' ? 'XAC_DINH_1_NAM' : 'XAC_DINH_3_NAM');
      setRenewHrStartDate(curEnd);
      setRenewHrEndDate(nextEnd.toISOString().split('T')[0]);
      setRenewHrSalary(emp?.actualSalary || 12000000);
    }
  };

  // Submit Contract Renewal
  const handleSubmitContractRenewal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewingItem) return;

    const result = storageService.renewCustomerContract({
      customerId: renewingItem.entityId,
      startDate: renewStartDate,
      endDate: renewEndDate,
      monthlyFee: Number(renewMonthlyFee),
      servicePackage: renewPackageName,
      notes: renewNotes,
      actor: currentUser || undefined,
    });

    if (result.success) {
      setActionSuccessMsg(result.message);
      setRenewingItem(null);
      if (onDataChanged) onDataChanged();
    }
  };

  // Submit CKS Renewal
  const handleSubmitCksRenewal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewingItem) return;

    const result = storageService.renewDigitalSignature({
      customerId: renewingItem.entityId,
      newExpiryDate: renewCksExpiryDate,
      provider: renewCksProvider,
      actor: currentUser || undefined,
    });

    if (result.success) {
      setActionSuccessMsg(result.message);
      setRenewingItem(null);
      if (onDataChanged) onDataChanged();
    }
  };

  // Submit HR Renewal
  const handleSubmitHrRenewal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewingItem) return;

    const result = storageService.renewEmployeeLaborContract({
      employeeId: renewingItem.entityId,
      newContractType: renewHrContractType,
      startDate: renewHrStartDate,
      endDate: renewHrEndDate,
      newSalary: Number(renewHrSalary),
      actor: currentUser || undefined,
    });

    if (result.success) {
      setActionSuccessMsg(result.message);
      setRenewingItem(null);
      if (onDataChanged) onDataChanged();
    }
  };

  if (!isOpen) return null;

  return (
    <div id="cycle-renewal-center-modal" className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-850 flex items-start justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-xs">
              <BellRing className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Trung Tâm Cảnh Báo Chu Kỳ & Tái Ký Hợp Đồng Toàn Hệ Thống
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-bold text-[10px]">
                  {counts.urgentActionCount} mục cần xử lý
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Rà soát chu kỳ hiệu lực hợp đồng dịch vụ, chữ ký số (CKS), hóa đơn điện tử, hợp đồng lao động & giấy phép con
              </p>
            </div>
          </div>

          <button
            id="close-renewal-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scoped Security Notice for Regular Staff */}
        {currentUser?.role === 'NHAN_VIEN' && !PermissionService.canViewAllCustomers(currentUser) && (
          <div className="px-5 py-2 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/50 flex items-center space-x-2 text-[11px] text-amber-800 dark:text-amber-300 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <span>Phân quyền chuyên viên: Hệ thống chỉ hiển thị chu kỳ hoạt động của các khách hàng bạn trực tiếp phụ trách và hợp đồng của chính bạn.</span>
          </div>
        )}

        {/* Success Banner */}
        {actionSuccessMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border-b border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center justify-between px-6 text-xs font-semibold animate-in slide-in-from-top-1">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>{actionSuccessMsg}</span>
            </div>
            <button
              onClick={() => setActionSuccessMsg(null)}
              className="text-emerald-600 hover:underline text-[11px] cursor-pointer"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Top 4 Urgency Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-850/50 border-b border-slate-200 dark:border-slate-800 text-xs">
          
          <button
            onClick={() => setActiveUrgency(activeUrgency === 'EXPIRED' ? 'ALL' : 'EXPIRED')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeUrgency === 'EXPIRED'
                ? 'bg-red-50 dark:bg-red-950/60 border-red-400 ring-2 ring-red-400'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-red-300'
            }`}
          >
            <div className="flex items-center justify-between text-red-600 font-bold">
              <span>ĐÃ QUÁ HẠN</span>
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-red-600 mt-1">
              {counts.expired}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Cần tái ký / gia hạn ngay lập tức</div>
          </button>

          <button
            onClick={() => setActiveUrgency(activeUrgency === 'CRITICAL_15' ? 'ALL' : 'CRITICAL_15')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeUrgency === 'CRITICAL_15'
                ? 'bg-orange-50 dark:bg-orange-950/60 border-orange-400 ring-2 ring-orange-400'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-orange-300'
            }`}
          >
            <div className="flex items-center justify-between text-orange-600 font-bold">
              <span>KHẨN CẤP (&le;15 NGÀY)</span>
              <Clock className="h-4 w-4" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-orange-600 mt-1">
              {counts.critical}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Hết hạn trong 2 tuần tới</div>
          </button>

          <button
            onClick={() => setActiveUrgency(activeUrgency === 'WARNING_30' ? 'ALL' : 'WARNING_30')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeUrgency === 'WARNING_30'
                ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 ring-2 ring-amber-400'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between text-amber-600 font-bold">
              <span>CẢNH BÁO (&le;30 NGÀY)</span>
              <BellRing className="h-4 w-4" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-600 mt-1">
              {counts.warning}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Gửi đề xuất tái ký trước 1 tháng</div>
          </button>

          <button
            onClick={() => setActiveUrgency(activeUrgency === 'NOTICE_60' ? 'ALL' : 'NOTICE_60')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeUrgency === 'NOTICE_60'
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-400 ring-2 ring-blue-400'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center justify-between text-blue-600 font-bold">
              <span>SẮP TỚI (&le;60 NGÀY)</span>
              <Calendar className="h-4 w-4" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-blue-600 mt-1">
              {counts.upcoming}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Theo dõi lịch đàm phán hợp đồng</div>
          </button>

        </div>

        {/* Filter & Search Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          
          {/* Category Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'ALL', label: `Tất cả (${counts.total})` },
              { id: 'CUSTOMER_CONTRACT', label: `HĐ Dịch Vụ (${counts.contracts})` },
              { id: 'DIGITAL_SIGNATURE', label: `Chữ Ký Số CKS (${counts.cks})` },
              { id: 'EINVOICE_PACKAGE', label: `Hóa Đơn ĐT (${counts.invoices})` },
              { id: 'HR_ALL', label: `HĐ Lao Động (${counts.hr})` },
              { id: 'BUSINESS_LICENSE', label: `Giấy Phép (${counts.licenses})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo MST, tên DN, nhân viên..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
            />
          </div>

        </div>

        {/* List of Cycle Items */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          
          {filteredItems.map((item) => {
            const customerObj = customers.find(c => c.id === item.entityId);
            const employeeObj = employees.find(e => e.id === item.entityId);

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  item.status === 'EXPIRED'
                    ? 'bg-red-50/60 dark:bg-red-950/20 border-red-300 dark:border-red-800/80'
                    : item.status === 'CRITICAL_15'
                    ? 'bg-orange-50/50 dark:bg-orange-950/20 border-orange-300 dark:border-orange-800/80'
                    : item.status === 'WARNING_30'
                    ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80'
                    : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-start space-x-3 min-w-0 flex-1">
                  <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                    item.category === 'CUSTOMER_CONTRACT' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                    item.category === 'DIGITAL_SIGNATURE' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' :
                    item.category === 'EINVOICE_PACKAGE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' :
                    (item.category === 'HR_LABOR_CONTRACT' || item.category === 'HR_PROBATION') ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' :
                    'bg-slate-100 text-slate-700 dark:bg-slate-800'
                  }`}>
                    {item.category === 'CUSTOMER_CONTRACT' && <FileText className="h-4 w-4" />}
                    {item.category === 'DIGITAL_SIGNATURE' && <KeyRound className="h-4 w-4" />}
                    {item.category === 'EINVOICE_PACKAGE' && <Receipt className="h-4 w-4" />}
                    {(item.category === 'HR_LABOR_CONTRACT' || item.category === 'HR_PROBATION') && <Users className="h-4 w-4" />}
                    {item.category === 'BUSINESS_LICENSE' && <ShieldCheck className="h-4 w-4" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${item.badgeClass}`}>
                        {item.statusLabel}
                      </span>
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {item.entityName}
                      </span>
                      {item.code && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          ({item.code})
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">
                      {item.title}
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center space-x-3 flex-wrap gap-y-1">
                      <span>Thời hạn: <strong className="text-slate-700 dark:text-slate-300">{formatDate(item.endDate || '')}</strong></span>
                      {item.responsiblePerson && (
                        <>
                          <span>•</span>
                          <span>Phụ trách: <strong className="text-slate-700 dark:text-slate-300">{item.responsiblePerson}</strong></span>
                        </>
                      )}
                      {item.extraInfo && (
                        <>
                          <span>•</span>
                          <span className="text-slate-600 dark:text-slate-400">{item.extraInfo}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                  {customerObj && (
                    <button
                      onClick={() => {
                        onClose();
                        if (onSelectCustomer) onSelectCustomer(customerObj);
                        else if (onOpenCustomer) onOpenCustomer(customerObj);
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1"
                    >
                      <Building className="h-3 w-3 text-slate-500" />
                      <span>Hồ sơ KH</span>
                    </button>
                  )}

                  {item.category === 'CUSTOMER_CONTRACT' && (
                    <button
                      onClick={() => handleOpenRenewPopup(item)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Tái Ký Hợp Đồng (+1 Năm)</span>
                    </button>
                  )}

                  {item.category === 'DIGITAL_SIGNATURE' && (
                    <button
                      onClick={() => handleOpenRenewPopup(item)}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      <span>Gia Hạn Token CKS</span>
                    </button>
                  )}

                  {(item.category === 'HR_LABOR_CONTRACT' || item.category === 'HR_PROBATION') && (
                    <button
                      onClick={() => handleOpenRenewPopup(item)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <Users className="h-3.5 w-3.5" />
                      <span>Tái Ký HĐ Lao Động</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="p-10 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
              <div className="font-bold text-slate-700 dark:text-slate-300">Tất cả chu kỳ đều đang an toàn!</div>
              <p className="text-xs text-slate-500 mt-1">Không có mục nào trong tình trạng quá hạn hoặc sắp hết hạn cần xử lý theo bộ lọc này.</p>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Ngày rà soát hệ thống: <strong className="text-slate-800 dark:text-slate-200">{formatDate(CURRENT_SYSTEM_DATE)}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold cursor-pointer"
          >
            Đóng cửa sổ
          </button>
        </div>

      </div>

      {/* SUB-MODAL 1: 1-CLICK CONTRACT RENEWAL POPUP */}
      {renewingItem && renewingItem.category === 'CUSTOMER_CONTRACT' && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-blue-50/80 dark:bg-blue-950/40 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300 font-bold text-sm">
                <RefreshCw className="h-4 w-4" />
                <span>Tái Ký & Gia Hạn Hợp Đồng Dịch Vụ Mới</span>
              </div>
              <button onClick={() => setRenewingItem(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitContractRenewal} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  {renewingItem.entityName}
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  MST: {customers.find(c => c.id === renewingItem.entityId)?.taxCode} • Gói hiện tại: {customers.find(c => c.id === renewingItem.entityId)?.servicePackage}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ngày Bắt Đầu Chu Kỳ Mới <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={renewStartDate}
                    onChange={(e) => setRenewStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ngày Kết Thúc (Tái ký 1 năm) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={renewEndDate}
                    onChange={(e) => setRenewEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-blue-400 dark:border-blue-600 rounded-lg font-bold text-blue-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Phí Dịch Vụ Mới (VNĐ/tháng)
                </label>
                <input
                  type="number"
                  value={renewMonthlyFee}
                  onChange={(e) => setRenewMonthlyFee(Number(e.target.value))}
                  step={100000}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-emerald-600 text-sm"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  {formatCurrency(renewMonthlyFee)} / tháng
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Gói Dịch Vụ Ký Kết
                </label>
                <input
                  type="text"
                  value={renewPackageName}
                  onChange={(e) => setRenewPackageName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ghi Chú Đợt Tái Ký
                </label>
                <textarea
                  value={renewNotes}
                  onChange={(e) => setRenewNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRenewingItem(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-md flex items-center space-x-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Xác Nhận Tái Ký Hợp Đồng</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL 2: CKS RENEWAL POPUP */}
      {renewingItem && renewingItem.category === 'DIGITAL_SIGNATURE' && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-purple-50/80 dark:bg-purple-950/40 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-purple-700 dark:text-purple-300 font-bold text-sm">
                <KeyRound className="h-4 w-4" />
                <span>Gia Hạn Token Chữ Ký Số (CKS)</span>
              </div>
              <button onClick={() => setRenewingItem(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitCksRenewal} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  {renewingItem.entityName}
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  MST: {customers.find(c => c.id === renewingItem.entityId)?.taxCode}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nhà Cung Cấp Token CKS
                </label>
                <select
                  value={renewCksProvider}
                  onChange={(e) => setRenewCksProvider(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold"
                >
                  <option value="Viettel-CA">Viettel-CA</option>
                  <option value="VNPT-CA">VNPT-CA</option>
                  <option value="FPT-CA">FPT-CA</option>
                  <option value="BKAV-CA">BKAV-CA</option>
                  <option value="EasyCA">EasyCA</option>
                  <option value="MISA-CA">MISA eSign</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Hạn Dùng Mới Sau Gia Hạn <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={renewCksExpiryDate}
                  onChange={(e) => setRenewCksExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-purple-400 rounded-lg font-bold text-purple-700"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRenewingItem(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-md flex items-center space-x-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Xác Nhận Gia Hạn CKS</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL 3: HR LABOR CONTRACT RENEWAL */}
      {renewingItem && (renewingItem.category === 'HR_LABOR_CONTRACT' || renewingItem.category === 'HR_PROBATION') && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-indigo-50/80 dark:bg-indigo-950/40 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                <Users className="h-4 w-4" />
                <span>Tái Ký Hợp Đồng Lao Động Nhân Sự</span>
              </div>
              <button onClick={() => setRenewingItem(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitHrRenewal} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  {renewingItem.entityName}
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  Vị trí: {employees.find(e => e.id === renewingItem.entityId)?.position} • Phòng: {employees.find(e => e.id === renewingItem.entityId)?.department}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Loại Hợp Đồng Mới
                </label>
                <select
                  value={renewHrContractType}
                  onChange={(e) => setRenewHrContractType(e.target.value as EmployeeContractType)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold"
                >
                  <option value="XAC_DINH_1_NAM">HĐ Xác định thời hạn (1 năm)</option>
                  <option value="XAC_DINH_3_NAM">HĐ Xác định thời hạn (3 năm)</option>
                  <option value="KHONG_XAC_DINH_THOI_HAN">HĐ Không xác định thời hạn (Chính thức vô thời hạn)</option>
                  <option value="THU_VIEC">Hợp đồng thử việc</option>
                  <option value="CONG_TAC_VIEN">Hợp đồng cộng tác viên</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ngày Hiệu Lực Mới
                  </label>
                  <input
                    type="date"
                    value={renewHrStartDate}
                    onChange={(e) => setRenewHrStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ngày Hết Hạn Mới
                  </label>
                  <input
                    type="date"
                    value={renewHrEndDate}
                    onChange={(e) => setRenewHrEndDate(e.target.value)}
                    disabled={renewHrContractType === 'KHONG_XAC_DINH_THOI_HAN'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-indigo-400 rounded-lg font-semibold disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mức Lương Thực Nhận Sau Tái Ký (VNĐ)
                </label>
                <input
                  type="number"
                  value={renewHrSalary}
                  onChange={(e) => setRenewHrSalary(Number(e.target.value))}
                  step={500000}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-emerald-600 text-sm"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  {formatCurrency(renewHrSalary)}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRenewingItem(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md flex items-center space-x-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Xác Nhận Tái Ký HĐLĐ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

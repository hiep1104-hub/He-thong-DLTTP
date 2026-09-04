import React, { useState, useMemo } from 'react';
import { Customer, User, BillingCycle, DebtAgingGroup, VatType } from '../../types';
import { 
  DollarSign, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  CreditCard, 
  Edit3, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Receipt, 
  Send, 
  Copy, 
  Check, 
  ExternalLink, 
  Info, 
  TrendingUp, 
  Building, 
  Users, 
  Settings, 
  History,
  X,
  FileText,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { 
  formatCurrency, 
  formatDate, 
  formatDateTime,
  BILLING_CYCLE_LABELS, 
  DEBT_AGING_LABELS, 
  DEBT_STATUS_LABELS,
  RISK_LABELS 
} from '../../utils/formatters';
import { storageService, CURRENT_SYSTEM_DATE } from '../../services/storageService';

interface CustomerDebtReportViewProps {
  customers: Customer[];
  currentUser?: User | null;
  onUpdateCustomer?: (updatedCustomer: Customer) => void;
  onDataReload?: () => void;
}

export const CustomerDebtReportView: React.FC<CustomerDebtReportViewProps> = ({
  customers,
  currentUser,
  onUpdateCustomer,
  onDataReload,
}) => {
  // Filters state
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCycle, setSelectedCycle] = useState<string>('ALL');
  const [selectedAgingGroup, setSelectedAgingGroup] = useState<string>('ALL');
  const [debtOnly, setDebtOnly] = useState(false);

  // Modals state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [modalType, setModalType] = useState<'CYCLE_EDIT' | 'PAYMENT_RECORD' | 'DEBT_ADJUST' | 'REMINDER_NOTICE' | 'HISTORY_VIEW' | null>(null);

  // Form State: Cycle Edit
  const [editCycle, setEditCycle] = useState<BillingCycle>('HANG_THANG');
  const [editDueDay, setEditDueDay] = useState<number>(10);
  const [editTermDays, setEditTermDays] = useState<number>(10);
  const [editCreditLimit, setEditCreditLimit] = useState<number>(15000000);
  const [editPaymentMethod, setEditPaymentMethod] = useState<string>('Chuyển khoản VCB');
  const [editDiscountPolicy, setEditDiscountPolicy] = useState<string>('');
  const [editPaymentNotes, setEditPaymentNotes] = useState<string>('');
  const [editMonthlyFee, setEditMonthlyFee] = useState<number>(0);
  const [editVatType, setEditVatType] = useState<VatType>('CHUA_VAT');

  // Form State: Record Payment
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(CURRENT_SYSTEM_DATE);
  const [paymentMethodChoice, setPaymentMethodChoice] = useState<string>('Chuyển khoản VCB');
  const [paymentReceiptNumber, setPaymentReceiptNumber] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  // Form State: Debt Adjust
  const [adjustDebtAmount, setAdjustDebtAmount] = useState<number>(0);
  const [adjustDueDate, setAdjustDueDate] = useState<string>(CURRENT_SYSTEM_DATE);
  const [adjustReason, setAdjustReason] = useState<string>('');

  // Form State: Reminder Notice
  const [reminderType, setReminderType] = useState<'EMAIL' | 'ZALO' | 'OFFICIAL_LETTER' | 'CALL'>('ZALO');
  const [copiedReminder, setCopiedReminder] = useState(false);

  // Feedback Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Compute Debt Statistics
  const debtStats = useMemo(() => {
    return storageService.getDebtAgingStatistics();
  }, [customers]);

  // Enhanced customers with calculated debt aging info
  const enhancedCustomers = useMemo(() => {
    return customers.map(c => {
      const agingInfo = storageService.calculateCustomerDebtAging(c);
      return {
        ...c,
        calculatedAging: agingInfo,
      };
    });
  }, [customers]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return enhancedCustomers.filter(c => {
      // Search filter
      const matchesSearch = 
        !searchKeyword ||
        c.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        c.taxCode.includes(searchKeyword) ||
        (c.code && c.code.toLowerCase().includes(searchKeyword.toLowerCase())) ||
        (c.assignedStaffName && c.assignedStaffName.toLowerCase().includes(searchKeyword.toLowerCase()));

      // Cycle filter
      const cycle = c.billingCycle || 'HANG_THANG';
      const matchesCycle = selectedCycle === 'ALL' || cycle === selectedCycle;

      // Aging filter
      const aging = c.calculatedAging.agingGroup;
      const matchesAging = 
        selectedAgingGroup === 'ALL' ||
        (selectedAgingGroup === 'HAS_DEBT' && (c.debtAmount || 0) > 0) ||
        aging === selectedAgingGroup;

      // Debt only toggle
      const matchesDebtOnly = !debtOnly || (c.debtAmount || 0) > 0;

      return matchesSearch && matchesCycle && matchesAging && matchesDebtOnly;
    });
  }, [enhancedCustomers, searchKeyword, selectedCycle, selectedAgingGroup, debtOnly]);

  // Open Cycle Edit Modal
  const handleOpenCycleEdit = (c: Customer) => {
    setSelectedCustomer(c);
    setEditCycle(c.billingCycle || 'HANG_THANG');
    setEditDueDay(c.paymentDueDay || 10);
    setEditTermDays(c.paymentTermDays || 10);
    setEditCreditLimit(c.creditLimit || 15000000);
    setEditPaymentMethod(c.preferredPaymentMethod || 'Chuyển khoản VCB');
    setEditDiscountPolicy(c.paymentDiscountPolicy || '');
    setEditPaymentNotes(c.paymentNotes || '');
    setEditMonthlyFee(c.monthlyFee || 0);
    setEditVatType(c.vatType || 'CHUA_VAT');
    setModalType('CYCLE_EDIT');
  };

  // Submit Cycle Edit
  const handleSaveCycle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    const result = storageService.updateCustomerPaymentCycle(
      selectedCustomer.id,
      {
        billingCycle: editCycle,
        paymentDueDay: Number(editDueDay),
        paymentTermDays: Number(editTermDays),
        creditLimit: Number(editCreditLimit),
        preferredPaymentMethod: editPaymentMethod,
        paymentDiscountPolicy: editDiscountPolicy,
        paymentNotes: editPaymentNotes,
        monthlyFee: Number(editMonthlyFee),
        vatType: editVatType,
      },
      currentUser || undefined
    );

    if (result.success && result.serverEntity) {
      showToast(`Đã điều chỉnh Chu kỳ thanh toán cho khách hàng "${result.serverEntity.name}" thành công!`);
      if (onUpdateCustomer) onUpdateCustomer(result.serverEntity);
      if (onDataReload) onDataReload();
      setModalType(null);
    } else {
      showToast(result.message || 'Lỗi khi cập nhật chu kỳ thanh toán');
    }
  };

  // Open Payment Modal
  const handleOpenPaymentModal = (c: Customer) => {
    setSelectedCustomer(c);
    setPaymentAmount(c.debtAmount > 0 ? c.debtAmount : (c.monthlyFee || 0));
    setPaymentDate(CURRENT_SYSTEM_DATE);
    setPaymentMethodChoice(c.preferredPaymentMethod || 'Chuyển khoản VCB');
    setPaymentReceiptNumber(`PT-${new Date().getFullYear()}/${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`);
    setPaymentNotes(`Thu phí dịch vụ ${BILLING_CYCLE_LABELS[c.billingCycle || 'HANG_THANG']?.short || 'kỳ'} cho MST: ${c.taxCode}`);
    setModalType('PAYMENT_RECORD');
  };

  // Submit Record Payment
  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    if (paymentAmount <= 0) {
      showToast('Vui lòng nhập số tiền thanh toán hợp lệ (> 0đ)');
      return;
    }

    const result = storageService.recordCustomerPayment(
      selectedCustomer.id,
      {
        amount: Number(paymentAmount),
        paymentDate,
        paymentMethod: paymentMethodChoice,
        receiptNumber: paymentReceiptNumber,
        notes: paymentNotes,
      },
      currentUser || undefined
    );

    if (result.success && result.serverEntity) {
      showToast(`Đã ghi nhận thanh toán ${formatCurrency(paymentAmount)} từ "${result.serverEntity.name}"!`);
      if (onUpdateCustomer) onUpdateCustomer(result.serverEntity);
      if (onDataReload) onDataReload();
      setModalType(null);
    } else {
      showToast(result.message || 'Lỗi khi ghi nhận thanh toán');
    }
  };

  // Open Debt Adjust Modal
  const handleOpenDebtAdjust = (c: Customer) => {
    setSelectedCustomer(c);
    setAdjustDebtAmount(c.debtAmount || 0);
    setAdjustDueDate(c.debtDueDate || CURRENT_SYSTEM_DATE);
    setAdjustReason('');
    setModalType('DEBT_ADJUST');
  };

  // Submit Debt Adjust
  const handleSaveDebtAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    const result = storageService.adjustCustomerDebt(
      selectedCustomer.id,
      {
        newDebtAmount: Number(adjustDebtAmount),
        dueDate: adjustDueDate,
        reason: adjustReason,
      },
      currentUser || undefined
    );

    if (result.success && result.serverEntity) {
      showToast(`Đã điều chỉnh số dư công nợ của "${result.serverEntity.name}" thành ${formatCurrency(adjustDebtAmount)}!`);
      if (onUpdateCustomer) onUpdateCustomer(result.serverEntity);
      if (onDataReload) onDataReload();
      setModalType(null);
    } else {
      showToast(result.message || 'Lỗi khi cập nhật công nợ');
    }
  };

  // Open Reminder Template Modal
  const handleOpenReminder = (c: Customer) => {
    const aging = storageService.calculateCustomerDebtAging(c);
    setSelectedCustomer(c);
    setReminderType(aging.overdueDays > 60 ? 'OFFICIAL_LETTER' : (aging.overdueDays > 30 ? 'EMAIL' : 'ZALO'));
    setCopiedReminder(false);
    setModalType('REMINDER_NOTICE');
  };

  // Generate Reminder Template Text
  const getReminderContent = (c: Customer, type: string) => {
    const aging = storageService.calculateCustomerDebtAging(c);
    const overdueDays = aging.overdueDays;
    const debt = formatCurrency(c.debtAmount || 0);
    const cycleText = BILLING_CYCLE_LABELS[c.billingCycle || 'HANG_THANG']?.short || 'tháng';

    if (type === 'ZALO') {
      return `[ĐẠI LÝ THUẾ THÀNH PHỐ - THÔNG BÁO PHÍ VÀ ĐỐI SOÁT CÔNG NỢ]
Kính gửi Quý Doanh nghiệp: ${c.name} (MST: ${c.taxCode})
Kế toán phụ trách: ${c.assignedStaffName || 'Ban Chuyên Môn'}

Đại Lý Thuế Thành Phố trân trọng thông báo số dư phí dịch vụ kế toán - thuế (${cycleText}) của Quý Công ty:
• Gói dịch vụ: ${c.servicePackage}
• Số tiền công nợ hiện hành: ${debt}
• Hạn thanh toán theo chu kỳ: Ngày ${c.paymentDueDay || 10} hàng kỳ
• Số ngày quá hạn: ${overdueDays > 0 ? `${overdueDays} ngày` : 'Trong hạn'}

Thông tin thanh toán:
- Tên tài khoản: CÔNG TY TNHH ĐẠI LÝ THUẾ THÀNH PHỐ
- Số tài khoản: 1903 8888 9999 (Techcombank) / 0011 000 888 999 (Vietcombank)
- Nội dung: ${c.taxCode} THANH TOAN PHI DICH VU

Kính đề nghị Quý Doanh nghiệp hoàn tất thanh toán để đảm bảo tiến độ nộp tờ khai và phát hành hóa đơn không bị gián đoạn. Trân trọng cảm ơn!`;
    }

    if (type === 'EMAIL') {
      return `Kính gửi Ban Giám Đốc & Phòng Kế toán ${c.name},

Đại Lý Thuế Thành Phố xin gửi lời chào trân trọng và lời chúc sức khỏe, thành công đến Quý Doanh nghiệp.

Căn cứ Hợp đồng dịch vụ số ${c.contractNumber || `HĐ-${c.taxCode}`} ký kết giữa Đại Lý Thuế Thành Phố và Quý Công ty, chúng tôi xin gửi bảng tổng hợp tình hình công nợ dịch vụ kế toán & đại lý thuế định kỳ:
1. Doanh nghiệp: ${c.name}
2. Mã số thuế: ${c.taxCode}
3. Gói dịch vụ: ${c.servicePackage}
4. Chu kỳ thanh toán áp dụng: ${BILLING_CYCLE_LABELS[c.billingCycle || 'HANG_THANG']?.label}
5. Số tiền cần thanh toán: ${debt}
6. Tình trạng nợ: ${overdueDays > 0 ? `Đã quá hạn ${overdueDays} ngày kể từ ngày chốt kỳ` : 'Đang trong hạn thanh toán'}

Kính đề nghị Quý Công ty đối chiếu và thu xếp chuyển khoản phí dịch vụ theo thông tin tài khoản ngân hàng của Đại Lý Thuế Thành Phố trong vòng 03 ngày làm việc.

Mọi thắc mắc về số liệu hóa đơn, xin liên hệ trực tiếp chuyên viên phụ trách: ${c.assignedStaffName || '024 3999 8888'}.

Trân trọng,
BAN TÀI CHÍNH & CÔNG NỢ - ĐẠI LÝ THUẾ THÀNH PHỐ`;
    }

    return `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
---o0o---

CÔNG VĂN ĐÔN ĐỐC & TẠM NGƯNG THỰC HIỆN NGHĨA VỤ THUẾ DO QUÁ HẠN CÔNG NỢ
Số: 26/CV-DLTTP/2026

Kính gửi: BAN GIÁM ĐỐC CÔNG TY ${c.name.toUpperCase()}
Mã số thuế: ${c.taxCode}
Địa chỉ: ${c.address}

Đại Lý Thuế Thành Phố trân trọng thông báo:
Khoản công nợ phí dịch vụ kế toán thuế của Quý Công ty tính đến ngày ${formatDate(CURRENT_SYSTEM_DATE)} là: ${debt}.
Khoản nợ này đã quá hạn ${overdueDays} ngày so với thỏa thuận tại Hợp đồng dịch vụ.

Căn cứ quy chế cung cấp dịch vụ, Đại Lý Thuế Thành Phố trân trọng thông báo:
1. Yêu cầu Quý Công ty hoàn tất thanh toán số tiền ${debt} trước 17h00 ngày ${formatDate(CURRENT_SYSTEM_DATE)}.
2. Quá thời hạn trên, Đại Lý Thuế Thành Phố sẽ chính thức TẠM DỪNG việc ký số nộp tờ khai thuế, báo cáo tài chính và xử lý hóa đơn điện tử cho Quý Doanh nghiệp. Mọi trách nhiệm phạt vi phạm hành chính về thuế do chậm nộp tờ khai sẽ do Quý Doanh nghiệp chịu trách nhiệm.

Trân trọng thông báo!
GIÁM ĐỐC ĐIỀU HÀNH ĐẠI LÝ THUẾ THÀNH PHỐ`;
  };

  // Copy Reminder to Clipboard & Log
  const handleCopyAndLogReminder = () => {
    if (!selectedCustomer) return;
    const text = getReminderContent(selectedCustomer, reminderType);
    navigator.clipboard.writeText(text);
    setCopiedReminder(true);

    storageService.logCustomerDebtReminder(
      selectedCustomer.id,
      {
        reminderType,
        content: text.substring(0, 200) + '...',
        status: 'SENT',
      },
      currentUser || undefined
    );

    showToast(`Đã sao chép nội dung nhắc nợ và ghi nhật ký đôn đốc cho khách hàng "${selectedCustomer.name}"!`);
    setTimeout(() => setCopiedReminder(false), 2500);
  };

  // Open History View
  const handleOpenHistory = (c: Customer) => {
    setSelectedCustomer(c);
    setModalType('HISTORY_VIEW');
  };

  // Quick select payment amount helper
  const setQuickPayment = (multiplier: number) => {
    if (!selectedCustomer) return;
    if (multiplier === 0) {
      setPaymentAmount(selectedCustomer.debtAmount || 0);
    } else {
      setPaymentAmount((selectedCustomer.monthlyFee || 0) * multiplier);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white dark:bg-emerald-600 dark:text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-200">
          <Sparkles className="h-4 w-4 text-emerald-400 dark:text-white shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* 1. Header & Quick Controls */}
      <div className="bg-gradient-to-r from-amber-900/10 via-amber-800/5 to-transparent dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900 p-5 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl">
                <Receipt className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <span>4. Báo Cáo Tình Hình Khách Hàng & Quản Trị Chu Kỳ Công Nợ</span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold border border-amber-300 dark:border-amber-800">
                    Chu Kỳ Tùy Chỉnh Theo KH
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Theo dõi 5 nhóm tuổi nợ (Aging Brackets), điều chỉnh chu kỳ thanh toán, ngày thu phí, hạn mức tín dụng và ghi nhận thanh toán trực tiếp
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const csvContent = [
                  ['Mã KH', 'Tên Khách Hàng', 'MST', 'Gói Dịch Vụ', 'Tổng Phí (VNĐ)', 'Tổng Nợ (VNĐ)', 'Hạn Thu Cuối', 'Trạng Thái', 'Chu Kỳ', 'Liên Hệ'].join(','),
                  ...filteredCustomers.map(c => [
                    c.code,
                    `"${c.name}"`,
                    c.taxCode,
                    `"${c.servicePackage}"`,
                    c.monthlyFee,
                    c.debtAmount,
                    c.debtDueDate,
                    `"${DEBT_AGING_LABELS[c.debtAgingGroup || 'IN_GRACE']?.label}"`,
                    `"${BILLING_CYCLE_LABELS[c.billingCycle || 'HANG_THANG']?.label}"`,
                    `"${c.contactPhone} - ${c.contactName}"`
                  ].join(','))
                ].join('\n');
                const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Bao_Cao_Cong_No_${formatDate(CURRENT_SYSTEM_DATE).replace(/\//g, '_')}.csv`;
                a.click();
                URL.revokeObjectURL(url);
                showToast('Đã kết xuất báo cáo công nợ thành công');
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Kết Xuất CSV</span>
            </button>
            <button
              onClick={() => {
                setSearchKeyword('');
                setSelectedCycle('ALL');
                setSelectedAgingGroup('ALL');
                setDebtOnly(false);
              }}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all"
            >
              Đặt lại bộ lọc
            </button>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium hidden sm:inline">
              Hệ thống: {formatDate(CURRENT_SYSTEM_DATE)}
            </span>
          </div>
        </div>

        {/* 2. Top Summary KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-5">
          {/* Card 1: Tổng công nợ */}
          <div className="bg-white dark:bg-slate-900/90 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Tổng Công Nợ
              </span>
              <DollarSign className="h-4 w-4 text-red-500" />
            </div>
            <div className="text-lg font-black text-red-600 dark:text-red-400 mt-1.5">
              {formatCurrency(debtStats.totalDebt)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
              <span>{debtStats.totalCustomersWithDebt}/{debtStats.totalCustomers} doanh nghiệp</span>
              <span className="font-semibold text-red-600 dark:text-red-400">
                {Math.round((debtStats.totalCustomersWithDebt / (debtStats.totalCustomers || 1)) * 100)}% có nợ
              </span>
            </div>
          </div>

          {/* Card 2: Nợ trong hạn */}
          <div className="bg-white dark:bg-slate-900/90 p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-950 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                🟢 Trong Hạn / Tín Dụng
              </span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1.5">
              {formatCurrency(debtStats.inGracePeriodAmount)}
            </div>
            <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-1 flex items-center justify-between">
              <span>{debtStats.inGracePeriodCount} doanh nghiệp</span>
              <span className="font-semibold">Chu kỳ an toàn</span>
            </div>
          </div>

          {/* Card 3: Quá hạn 1 - 30 ngày */}
          <div className="bg-white dark:bg-slate-900/90 p-4 rounded-xl border border-amber-200/80 dark:border-amber-950 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                🟡 Quá Hạn 1 - 30 Ngày
              </span>
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-1.5">
              {formatCurrency(debtStats.overdue1To30Amount)}
            </div>
            <div className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-1 flex items-center justify-between">
              <span>{debtStats.overdue1To30Count} doanh nghiệp</span>
              <span className="font-semibold">Cấp 1: Nhắc mềm</span>
            </div>
          </div>

          {/* Card 4: Quá hạn 31 - 60 ngày */}
          <div className="bg-white dark:bg-slate-900/90 p-4 rounded-xl border border-orange-200/80 dark:border-orange-950 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange-700 dark:text-orange-400">
                🟠 Quá Hạn 31 - 60 Ngày
              </span>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </div>
            <div className="text-lg font-black text-orange-600 dark:text-orange-400 mt-1.5">
              {formatCurrency(debtStats.overdue31To60Amount)}
            </div>
            <div className="text-[11px] text-orange-700/80 dark:text-orange-400/80 mt-1 flex items-center justify-between">
              <span>{debtStats.overdue31To60Count} doanh nghiệp</span>
              <span className="font-semibold">Cấp 2: Công văn đôn đốc</span>
            </div>
          </div>

          {/* Card 5: Quá hạn > 60 ngày (Khó đòi) */}
          <div className="bg-white dark:bg-slate-900/90 p-4 rounded-xl border border-rose-200/80 dark:border-rose-950 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                🔴 Nợ Xấu &gt; 60 Ngày
              </span>
              <ShieldAlert className="h-4 w-4 text-rose-600" />
            </div>
            <div className="text-lg font-black text-rose-600 dark:text-rose-400 mt-1.5">
              {formatCurrency(debtStats.overdue61To90Amount + debtStats.overdueOver90Amount)}
            </div>
            <div className="text-[11px] text-rose-700/80 dark:text-rose-400/80 mt-1 flex items-center justify-between">
              <span>{debtStats.overdue61To90Count + debtStats.overdueOver90Count} doanh nghiệp</span>
              <span className="font-semibold">Tạm ngưng dịch vụ</span>
            </div>
          </div>
        </div>

        {/* 3. Debt Aging Breakdown Visual Bar */}
        <div className="mt-4 pt-4 border-t border-amber-200/50 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 mb-2">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span>Phân Bổ Tuổi Nợ Theo Chu Kỳ Hệ Thống:</span>
            </span>
            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                <span>Trong hạn ({formatCurrency(debtStats.inGracePeriodAmount)})</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                <span>1-30d ({formatCurrency(debtStats.overdue1To30Amount)})</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
                <span>31-60d ({formatCurrency(debtStats.overdue31To60Amount)})</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block"></span>
                <span>&gt;60d ({formatCurrency(debtStats.overdue61To90Amount + debtStats.overdueOver90Amount)})</span>
              </span>
            </div>
          </div>

          {/* Stacked Progress Bar */}
          <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
            {debtStats.totalDebt > 0 ? (
              <>
                <div 
                  style={{ width: `${(debtStats.inGracePeriodAmount / debtStats.totalDebt) * 100}%` }} 
                  className="bg-emerald-500 h-full transition-all" 
                  title={`Trong hạn: ${formatCurrency(debtStats.inGracePeriodAmount)}`}
                />
                <div 
                  style={{ width: `${(debtStats.overdue1To30Amount / debtStats.totalDebt) * 100}%` }} 
                  className="bg-amber-400 h-full transition-all" 
                  title={`Quá hạn 1-30 ngày: ${formatCurrency(debtStats.overdue1To30Amount)}`}
                />
                <div 
                  style={{ width: `${(debtStats.overdue31To60Amount / debtStats.totalDebt) * 100}%` }} 
                  className="bg-orange-500 h-full transition-all" 
                  title={`Quá hạn 31-60 ngày: ${formatCurrency(debtStats.overdue31To60Amount)}`}
                />
                <div 
                  style={{ width: `${((debtStats.overdue61To90Amount + debtStats.overdueOver90Amount) / debtStats.totalDebt) * 100}%` }} 
                  className="bg-rose-600 h-full transition-all" 
                  title={`Quá hạn >60 ngày: ${formatCurrency(debtStats.overdue61To90Amount + debtStats.overdueOver90Amount)}`}
                />
              </>
            ) : (
              <div className="w-full bg-emerald-500 h-full flex items-center justify-center text-[10px] text-white font-bold">
                100% Không có nợ đọng
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Filter Toolbar & Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Tìm theo tên doanh nghiệp, MST, phụ trách..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:text-white"
          />
          {searchKeyword && (
            <button
              onClick={() => setSearchKeyword('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Billing Cycle Filter */}
          <div className="flex items-center space-x-1 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">Chu kỳ:</span>
            <select
              value={selectedCycle}
              onChange={(e) => setSelectedCycle(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:text-white"
            >
              <option value="ALL">Tất cả chu kỳ thanh toán</option>
              <option value="HANG_THANG">Hàng tháng (1 tháng/kỳ)</option>
              <option value="HANG_QUY">Hàng quý (3 tháng/kỳ)</option>
              <option value="SAU_THANG">Bán niên (6 tháng/kỳ)</option>
              <option value="HANG_NAM">Hàng năm (12 tháng/kỳ)</option>
              <option value="THEO_VU_VIEC">Theo vụ việc / Hồ sơ</option>
            </select>
          </div>

          {/* Aging Group Filter */}
          <div className="flex items-center space-x-1 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">Tuổi nợ:</span>
            <select
              value={selectedAgingGroup}
              onChange={(e) => setSelectedAgingGroup(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:text-white"
            >
              <option value="ALL">Tất cả nhóm tuổi nợ</option>
              <option value="HAS_DEBT">Chỉ xem KH có nợ đọng</option>
              <option value="TRONG_HAN">🟢 Trong hạn tín dụng</option>
              <option value="QUA_HAN_1_30">🟡 Quá hạn 1 - 30 ngày (Nhắc mềm)</option>
              <option value="QUA_HAN_31_60">🟠 Quá hạn 31 - 60 ngày (Cảnh báo)</option>
              <option value="QUA_HAN_61_90">🔴 Quá hạn 61 - 90 ngày (Tạm ngưng)</option>
              <option value="QUA_HAN_TREN_90">🟣 Quá hạn &gt; 90 ngày (Nợ khó đòi)</option>
            </select>
          </div>

          {/* Toggle has debt only */}
          <button
            onClick={() => setDebtOnly(!debtOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
              debtOnly
                ? 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
                : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
            }`}
          >
            {debtOnly ? '✓ Đang lọc: Có Nợ' : 'Chỉ hiện có nợ'}
          </button>
        </div>
      </div>

      {/* 5. Main Customer Debt & Payment Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">
              Danh Sách Khách Hàng, Chu Kỳ Thanh Toán & Tuổi Nợ Chi Tiết ({filteredCustomers.length})
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            Click nút ⚙️ trên từng dòng để điều chỉnh Chu kỳ thanh toán cho khách hàng đó
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-3.5 min-w-[220px]">Khách Hàng & MST</th>
                <th className="py-3 px-3 min-w-[130px]">Phụ Trách</th>
                <th className="py-3 px-3 min-w-[190px]">
                  <div className="flex items-center space-x-1 text-blue-700 dark:text-blue-400">
                    <Settings className="h-3.5 w-3.5" />
                    <span>Chu Kỳ Thanh Toán (Tùy Chỉnh)</span>
                  </div>
                </th>
                <th className="py-3 px-3 text-right min-w-[140px]">Phí & Đã Thu</th>
                <th className="py-3 px-3.5 min-w-[180px]">Tuổi Nợ & Trạng Thái</th>
                <th className="py-3 px-3 text-right min-w-[130px]">Công Nợ</th>
                <th className="py-3 px-3.5 text-center min-w-[150px]">Xử Lý Nghiệp Vụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 dark:text-slate-500">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-xs">Không tìm thấy khách hàng phù hợp với bộ lọc</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(c => {
                  const aging = c.calculatedAging;
                  const cycleInfo = BILLING_CYCLE_LABELS[c.billingCycle || 'HANG_THANG'] || BILLING_CYCLE_LABELS.HANG_THANG;
                  const agingLabel = DEBT_AGING_LABELS[aging.agingGroup] || DEBT_AGING_LABELS.TRONG_HAN;
                  const hasDebt = (c.debtAmount || 0) > 0;

                  return (
                    <tr 
                      key={c.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all ${
                        aging.agingGroup === 'QUA_HAN_61_90' || aging.agingGroup === 'QUA_HAN_TREN_90'
                          ? 'bg-rose-50/20 dark:bg-rose-950/10'
                          : ''
                      }`}
                    >
                      {/* 1. Customer Name & Tax Code */}
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900 dark:text-white leading-tight">
                          {c.name}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="font-mono text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded border border-blue-200/60 dark:border-blue-900">
                            MST: {c.taxCode}
                          </span>
                          {c.code && (
                            <span className="text-[10px] text-slate-400">
                              {c.code}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1" title={c.servicePackage}>
                          📦 {c.servicePackage}
                        </div>
                      </td>

                      {/* 2. Staff */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                          {c.assignedStaffName || 'Chưa gán'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          KS: {c.reviewerStaffName || 'Mai TT'}
                        </div>
                      </td>

                      {/* 3. Configurable Payment Cycle */}
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-1.5">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${cycleInfo.badgeClass}`}>
                            {cycleInfo.short}
                          </span>
                          <button
                            onClick={() => handleOpenCycleEdit(c)}
                            title="Điều chỉnh Chu kỳ thanh toán cho khách hàng này"
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-md transition-all"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 space-y-0.5">
                          <div>
                            • Thu ngày: <span className="font-bold text-slate-900 dark:text-white">Ngày {c.paymentDueDay || 10}</span> (Hạn nợ: {c.paymentTermDays || 10} ngày)
                          </div>
                          <div>
                            • Hạn mức: <span className="font-semibold text-slate-700 dark:text-slate-300">{c.creditLimit ? formatCurrency(c.creditLimit) : 'Không giới hạn'}</span>
                          </div>
                          {c.paymentDiscountPolicy && (
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium line-clamp-1" title={c.paymentDiscountPolicy}>
                              ★ {c.paymentDiscountPolicy}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 4. Fee & Last Payment */}
                      <td className="py-3 px-3 text-right">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {formatCurrency(c.monthlyFee || 0)}
                          <span className="text-[10px] text-slate-400 font-normal">/kỳ</span>
                        </div>
                        {c.lastPaymentDate ? (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                            Đã đóng: {formatDate(c.lastPaymentDate)}
                            {c.lastPaymentAmount && (
                              <div className="text-[10px] text-slate-400">
                                ({formatCurrency(c.lastPaymentAmount)})
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 mt-1">Chưa có phiếu thu</div>
                        )}
                      </td>

                      {/* 5. Debt Aging Status */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center space-x-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${agingLabel.badgeClass}`}>
                            {agingLabel.label}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 space-y-0.5">
                          {hasDebt ? (
                            <>
                              <div>
                                • Quá hạn: <span className={`font-bold ${aging.overdueDays > 30 ? 'text-red-600 dark:text-red-400' : 'text-amber-600'}`}>
                                  {aging.overdueDays > 0 ? `${aging.overdueDays} ngày` : 'Chưa quá hạn'}
                                </span>
                              </div>
                              {aging.dueDate && (
                                <div>• Hạn: {formatDate(aging.dueDate)}</div>
                              )}
                              {aging.isOverCreditLimit && (
                                <div className="text-[10px] text-red-600 font-bold flex items-center space-x-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span>Vượt hạn mức tín dụng!</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-emerald-600 dark:text-emerald-400 font-medium">
                              ✓ Thanh toán đúng hạn
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 6. Debt Amount */}
                      <td className="py-3 px-3 text-right">
                        <div className={`text-sm font-black ${hasDebt ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {hasDebt ? formatCurrency(c.debtAmount) : '0 ₫'}
                        </div>
                        {hasDebt && (
                          <button
                            onClick={() => handleOpenDebtAdjust(c)}
                            className="text-[10px] text-blue-600 hover:underline mt-0.5"
                          >
                            Điều chỉnh nợ
                          </button>
                        )}
                      </td>

                      {/* 7. Action Operations */}
                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {/* Quick Edit Cycle */}
                          <button
                            onClick={() => handleOpenCycleEdit(c)}
                            title="Điều chỉnh Chu kỳ thanh toán"
                            className="p-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-lg transition-all"
                          >
                            <Settings className="h-4 w-4" />
                          </button>

                          {/* Record Payment */}
                          <button
                            onClick={() => handleOpenPaymentModal(c)}
                            title="Ghi nhận thanh toán / Thu phí"
                            className="p-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 rounded-lg transition-all"
                          >
                            <CreditCard className="h-4 w-4" />
                          </button>

                          {/* Reminder */}
                          {hasDebt && (
                            <button
                              onClick={() => handleOpenReminder(c)}
                              title="Tạo thông báo & Nhắc nợ Zalo/Email"
                              className="p-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 hover:bg-amber-100 rounded-lg transition-all"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                          )}

                          {/* History */}
                          <button
                            onClick={() => handleOpenHistory(c)}
                            title="Xem lịch sử thanh toán & Nhật ký"
                            className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 rounded-lg transition-all"
                          >
                            <History className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: EDIT PAYMENT CYCLE & CREDIT TERMS FOR INDIVIDUAL CUSTOMER */}
      {/* ========================================================================= */}
      {modalType === 'CYCLE_EDIT' && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <div>
                  <h4 className="font-bold text-sm">Điều Chỉnh Chu Kỳ Thanh Toán & Điều Khoản Tín Dụng</h4>
                  <p className="text-[11px] text-blue-100">{selectedCustomer.name} (MST: {selectedCustomer.taxCode})</p>
                </div>
              </div>
              <button 
                onClick={() => setModalType(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveCycle} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Chu Kỳ Thanh Toán Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  1. Chu Kỳ Thanh Toán Áp Dụng Cho Khách Hàng Này *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(['HANG_THANG', 'HANG_QUY', 'SAU_THANG', 'HANG_NAM', 'THEO_VU_VIEC'] as BillingCycle[]).map(cycleKey => {
                    const info = BILLING_CYCLE_LABELS[cycleKey];
                    const isSelected = editCycle === cycleKey;
                    return (
                      <div
                        key={cycleKey}
                        onClick={() => setEditCycle(cycleKey)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-white'}`}>
                            {info.label}
                          </span>
                          {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                          {info.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Phí dịch vụ định kỳ, Tùy chọn VAT & Ngày thanh toán */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phí Dịch Vụ Định Kỳ (VNĐ) *
                  </label>
                  <input
                    type="number"
                    value={editMonthlyFee}
                    onChange={(e) => setEditMonthlyFee(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Định mức: {formatCurrency(editMonthlyFee)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tùy Chọn Thuế VAT *
                  </label>
                  <select
                    value={editVatType}
                    onChange={(e) => setEditVatType(e.target.value as VatType)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="CHUA_VAT">Chưa gồm VAT (+10%)</option>
                    <option value="DA_CO_VAT">Đã có VAT (10%)</option>
                    <option value="KHONG_VAT">Không VAT (0%)</option>
                  </select>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 block font-mono">
                    {editVatType === 'CHUA_VAT' ? `Xuất HĐ: ${formatCurrency(editMonthlyFee * 1.1)}` : editVatType === 'DA_CO_VAT' ? `Gồm 10% VAT` : `0% VAT`}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ngày Chốt & Đến Hạn Định Kỳ
                  </label>
                  <select
                    value={editDueDay}
                    onChange={(e) => setEditDueDay(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value={5}>Ngày 05 (Đầu kỳ/tháng)</option>
                    <option value={10}>Ngày 10 (Chuẩn hóa)</option>
                    <option value={15}>Ngày 15 (Giữa kỳ)</option>
                    <option value={20}>Ngày 20 (Cùng kỳ nộp tờ khai GTGT)</option>
                    <option value={25}>Ngày 25</option>
                    <option value={30}>Ngày cuối tháng / kỳ</option>
                  </select>
                </div>
              </div>

              {/* Thời hạn thanh toán (Hạn nợ) & Hạn mức nợ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Thời Hạn Tín Dụng / Hạn Nợ (Grace Period)
                  </label>
                  <select
                    value={editTermDays}
                    onChange={(e) => setEditTermDays(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value={0}>0 ngày (Thanh toán ngay khi xuất báo phí)</option>
                    <option value={5}>5 ngày kể từ ngày chốt phí</option>
                    <option value={7}>7 ngày (1 tuần làm việc)</option>
                    <option value={10}>10 ngày</option>
                    <option value={15}>15 ngày (Mặc định)</option>
                    <option value={30}>30 ngày (Dành cho KH lớn/FDI)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hạn Mức Công Nợ Cho Phép (Credit Limit)
                  </label>
                  <input
                    type="number"
                    value={editCreditLimit}
                    onChange={(e) => setEditCreditLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {formatCurrency(editCreditLimit)}
                  </span>
                </div>
              </div>

              {/* Phương thức thanh toán ưu tiên & Chính sách chiết khấu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phương Thức Thanh Toán Ưu Tiên
                  </label>
                  <select
                    value={editPaymentMethod}
                    onChange={(e) => setEditPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="Chuyển khoản VCB">Chuyển khoản Vietcombank</option>
                    <option value="Chuyển khoản Techcombank">Chuyển khoản Techcombank</option>
                    <option value="Chuyển khoản MB Bank">Chuyển khoản MB Bank</option>
                    <option value="Chuyển khoản BIDV">Chuyển khoản BIDV</option>
                    <option value="Tiền mặt">Tiền mặt tại văn phòng</option>
                    <option value="Cấn trừ công nợ">Cấn trừ hợp đồng đối tác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Chính Sách Chiết Khấu / Ưu Đãi
                  </label>
                  <input
                    type="text"
                    value={editDiscountPolicy}
                    onChange={(e) => setEditDiscountPolicy(e.target.value)}
                    placeholder="vd: Chiết khấu 8% khi đóng theo năm"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Ghi chú thỏa thuận công nợ */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ghi Chú Thỏa Thuận Thanh Toán Riêng
                </label>
                <textarea
                  rows={2}
                  value={editPaymentNotes}
                  onChange={(e) => setEditPaymentNotes(e.target.value)}
                  placeholder="Ghi chú điều khoản thanh toán riêng, người liên hệ xác nhận công nợ của khách hàng..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5"
                >
                  <Check className="h-4 w-4" />
                  <span>Lưu Cài Đặt Chu Kỳ</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: RECORD PAYMENT / THU TIỀN DỊCH VỤ */}
      {/* ========================================================================= */}
      {modalType === 'PAYMENT_RECORD' && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <div>
                  <h4 className="font-bold text-sm">Ghi Nhận Thu Phí & Giảm Trừ Công Nợ</h4>
                  <p className="text-[11px] text-emerald-100">{selectedCustomer.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setModalType(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSavePayment} className="p-5 space-y-4">
              
              {/* Quick Summary Info */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Dư nợ hiện hành:</span>
                  <span className="font-extrabold text-red-600 dark:text-red-400 text-sm">
                    {formatCurrency(selectedCustomer.debtAmount || 0)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Phí định kỳ ({BILLING_CYCLE_LABELS[selectedCustomer.billingCycle || 'HANG_THANG']?.short}):</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {formatCurrency(selectedCustomer.monthlyFee || 0)}
                  </span>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Số Tiền Thực Thu (VNĐ) *
                </label>
                <input
                  type="number"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-black text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                
                {/* Quick amount shortcuts */}
                <div className="flex items-center space-x-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setQuickPayment(0)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-slate-700 dark:text-slate-300 text-[11px] font-semibold"
                  >
                    Thu hết nợ ({formatCurrency(selectedCustomer.debtAmount || 0)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickPayment(1)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-slate-700 dark:text-slate-300 text-[11px] font-semibold"
                  >
                    Thu 1 kỳ phí ({formatCurrency(selectedCustomer.monthlyFee || 0)})
                  </button>
                </div>
              </div>

              {/* Date & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ngày Thu Tiền *
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hình Thức Thu *
                  </label>
                  <select
                    value={paymentMethodChoice}
                    onChange={(e) => setPaymentMethodChoice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="Chuyển khoản VCB">Chuyển khoản Vietcombank</option>
                    <option value="Chuyển khoản Techcombank">Chuyển khoản Techcombank</option>
                    <option value="Chuyển khoản MB Bank">Chuyển khoản MB Bank</option>
                    <option value="Chuyển khoản BIDV">Chuyển khoản BIDV</option>
                    <option value="Tiền mặt">Tiền mặt</option>
                  </select>
                </div>
              </div>

              {/* Receipt Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Số Phiếu Thu / Mã Giao Dịch Ngân Hàng
                </label>
                <input
                  type="text"
                  value={paymentReceiptNumber}
                  onChange={(e) => setPaymentReceiptNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ghi Chú Hạch Toán / Diễn Giải
                </label>
                <textarea
                  rows={2}
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5"
                >
                  <Receipt className="h-4 w-4" />
                  <span>Xác Nhận & Tạo Phiếu Thu</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADJUST DEBT BALANCE */}
      {/* ========================================================================= */}
      {modalType === 'DEBT_ADJUST' && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-red-600 to-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <div>
                  <h4 className="font-bold text-sm">Điều Chỉnh Dư Nợ Công Nợ</h4>
                  <p className="text-[11px] text-red-100">{selectedCustomer.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setModalType(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveDebtAdjust} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Số Tiền Dư Nợ Mới (VNĐ) *
                </label>
                <input
                  type="number"
                  required
                  value={adjustDebtAmount}
                  onChange={(e) => setAdjustDebtAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-black text-red-600 dark:text-red-400 focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Bằng chữ: {formatCurrency(adjustDebtAmount)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hạn Thanh Toán Khoản Nợ Mới
                </label>
                <input
                  type="date"
                  value={adjustDueDate}
                  onChange={(e) => setAdjustDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lý Do Điều Chỉnh (Bắt buộc)
                </label>
                <textarea
                  rows={2}
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="vd: Phát sinh phí quyết toán thuế năm 2025, điều chỉnh giảm do chiết khấu hợp đồng..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Cập Nhật Dư Nợ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: DEBT REMINDER TEMPLATE NOTICE */}
      {/* ========================================================================= */}
      {modalType === 'REMINDER_NOTICE' && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Send className="h-5 w-5" />
                <div>
                  <h4 className="font-bold text-sm">Mẫu Thông Báo & Nhắc Nợ Chu Kỳ</h4>
                  <p className="text-[11px] text-amber-100">{selectedCustomer.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setModalType(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {/* Reminder Type Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 text-xs">
                <button
                  onClick={() => setReminderType('ZALO')}
                  className={`pb-2 px-3 font-bold border-b-2 transition-all ${
                    reminderType === 'ZALO'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Tin Nhắn Zalo / SMS
                </button>
                <button
                  onClick={() => setReminderType('EMAIL')}
                  className={`pb-2 px-3 font-bold border-b-2 transition-all ${
                    reminderType === 'EMAIL'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Thư Điện Tử (Email)
                </button>
                <button
                  onClick={() => setReminderType('OFFICIAL_LETTER')}
                  className={`pb-2 px-3 font-bold border-b-2 transition-all ${
                    reminderType === 'OFFICIAL_LETTER'
                      ? 'border-red-600 text-red-600 dark:text-red-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Công Văn Đôn Đốc (Khẩn)
                </button>
              </div>

              {/* Template Preview */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nội Dung Mẫu (Đã được điền tự động theo chu kỳ thanh toán & tuổi nợ):
                </label>
                <textarea
                  readOnly
                  rows={9}
                  value={getReminderContent(selectedCustomer, reminderType)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-hidden"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Khoản nợ: <strong className="text-red-600">{formatCurrency(selectedCustomer.debtAmount)}</strong> (Quá hạn {selectedCustomer.calculatedAging.overdueDays} ngày)
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopyAndLogReminder}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all"
                  >
                    {copiedReminder ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span>{copiedReminder ? 'Đã Sao Chép & Ghi Log!' : 'Sao Chép & Ghi Nhật Ký'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: PAYMENT HISTORY & AUDIT LOGS */}
      {/* ========================================================================= */}
      {modalType === 'HISTORY_VIEW' && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <History className="h-5 w-5 text-blue-400" />
                <div>
                  <h4 className="font-bold text-sm">Nhật Ký Thanh Toán & Lịch Sử Nhắc Nợ</h4>
                  <p className="text-[11px] text-slate-400">{selectedCustomer.name} (MST: {selectedCustomer.taxCode})</p>
                </div>
              </div>
              <button 
                onClick={() => setModalType(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
              
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">Chu kỳ:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {BILLING_CYCLE_LABELS[selectedCustomer.billingCycle || 'HANG_THANG']?.short}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">Dư nợ hiện tại:</span>
                  <span className="font-extrabold text-red-600 dark:text-red-400">
                    {formatCurrency(selectedCustomer.debtAmount || 0)}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">Lần đóng gần nhất:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {selectedCustomer.lastPaymentDate ? formatDate(selectedCustomer.lastPaymentDate) : 'Chưa có'}
                  </span>
                </div>
              </div>

              {/* Lịch Sử Các Lần Thanh Toán */}
              <div>
                <h5 className="font-bold text-xs text-slate-800 dark:text-white mb-2 flex items-center space-x-1.5">
                  <Receipt className="h-4 w-4 text-emerald-600" />
                  <span>1. Lịch Sử Ghi Nhận Phiếu Thu & Thanh Toán</span>
                </h5>

                {(!selectedCustomer.paymentHistory || selectedCustomer.paymentHistory.length === 0) ? (
                  <p className="text-xs text-slate-400 italic py-2">Chưa có bản ghi phiếu thu nào.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedCustomer.paymentHistory.map(p => (
                      <div key={p.id} className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/50 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-emerald-800 dark:text-emerald-300">
                            {formatCurrency(p.amount)} • {p.paymentMethod}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Số PT: <span className="font-mono font-semibold">{p.receiptNumber}</span> • {p.notes || 'Thanh toán phí dịch vụ'}
                          </div>
                        </div>
                        <div className="text-right text-[11px] text-slate-400">
                          <div>{formatDate(p.paymentDate)}</div>
                          <div>Thu bởi: {p.recordedByName || 'Kế toán'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Lịch Sử Nhắc Nợ */}
              <div>
                <h5 className="font-bold text-xs text-slate-800 dark:text-white mb-2 flex items-center space-x-1.5">
                  <Send className="h-4 w-4 text-amber-600" />
                  <span>2. Nhật Ký Gửi Thông Báo Đôn Đốc Nợ</span>
                </h5>

                {(!selectedCustomer.debtReminders || selectedCustomer.debtReminders.length === 0) ? (
                  <p className="text-xs text-slate-400 italic py-2">Chưa có thông báo nhắc nợ nào được gửi.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedCustomer.debtReminders.map(r => (
                      <div key={r.id} className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                          <span className="flex items-center space-x-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px]">
                              {r.reminderType}
                            </span>
                            <span>Nhắc nợ: {formatCurrency(r.debtAmount)} (Quá hạn {r.overdueDays}d)</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {formatDateTime(r.sentAt)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                          {r.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setModalType(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

import React, { useState } from 'react';
import { Customer, Task, User, CustomerRiskLevel, BillingCycle, VatType } from '../../types';
import { 
  X, 
  Building, 
  Phone, 
  Mail, 
  MapPin, 
  KeyRound, 
  FileText, 
  CreditCard, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ShieldAlert, 
  UserCheck, 
  Edit3, 
  Save, 
  DollarSign, 
  Maximize2, 
  Minimize2, 
  Check, 
  Sparkles, 
  Settings, 
  History, 
  Send, 
  Zap,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Copy,
  FileX2,
  AlertOctagon,
  RotateCcw,
  FileCheck2
} from 'lucide-react';
import { 
  formatCurrency, 
  formatDate, 
  RISK_LABELS, 
  STATUS_LABELS, 
  PRIORITY_LABELS, 
  BILLING_CYCLE_LABELS, 
  DEBT_AGING_LABELS, 
  CUSTOMER_TYPE_LABELS, 
  TAX_DECLARATION_CYCLE_LABELS, 
  HOUSEHOLD_BUSINESS_GROUP_LABELS, 
  CUSTOMER_SERVICE_TYPE_LABELS,
  CONTRACT_STATUS_LABELS,
  CUSTOMER_CONTRACT_TERMINATION_REASONS
} from '../../utils/formatters';
import { SERVICE_PACKAGES, ServicePackageItem } from '../../data/servicePackages';
import { storageService, CURRENT_SYSTEM_DATE } from '../../services/storageService';
import { PermissionService } from '../../utils/permissions';
import { RefreshCw, Receipt } from 'lucide-react';
import { AutoDispatchPeriodicModal } from '../templates/AutoDispatchPeriodicModal';

interface CustomerDetailModalProps {
  customer: Customer;
  tasks: Task[];
  users: User[];
  currentUser?: User | null;
  onClose: () => void;
  onSelectTask: (task: Task) => void;
  onOpenCreateTaskForCustomer: (customer: Customer) => void;
  onUpdateCustomer: (updatedCustomer: Customer) => void;
  onEditCustomer?: (customer: Customer) => void;
  onTasksChanged?: () => void;
  onOpenPortalForCustomer?: (taxCode: string) => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customer,
  tasks,
  users,
  currentUser,
  onClose,
  onSelectTask,
  onOpenCreateTaskForCustomer,
  onUpdateCustomer,
  onEditCustomer,
  onTasksChanged,
  onOpenPortalForCustomer,
}) => {
  const [activeTab, setActiveTab] = useState<'TASKS' | 'TAX_INFO' | 'CONTRACT' | 'PAYMENT_CYCLE_DEBT'>('TASKS');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditingDebt, setIsEditingDebt] = useState(false);
  const [newDebtAmount, setNewDebtAmount] = useState(customer.debtAmount || 0);

  // Payment Cycle Settings in Customer Modal
  const [isEditingPaymentCycle, setIsEditingPaymentCycle] = useState(false);
  const [cycleType, setCycleType] = useState<BillingCycle>(customer.billingCycle || 'HANG_THANG');
  const [cycleDueDay, setCycleDueDay] = useState<number>(customer.paymentDueDay || 10);
  const [cycleTermDays, setCycleTermDays] = useState<number>(customer.paymentTermDays || 10);
  const [cycleCreditLimit, setCycleCreditLimit] = useState<number>(customer.creditLimit || 15000000);
  const [cyclePaymentMethod, setCyclePaymentMethod] = useState<string>(customer.preferredPaymentMethod || 'Chuyển khoản VCB');
  const [cycleDiscount, setCycleDiscount] = useState<string>(customer.paymentDiscountPolicy || '');
  const [cycleNotes, setCycleNotes] = useState<string>(customer.paymentNotes || '');

  // Quick Payment Receipt
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [quickPayAmount, setQuickPayAmount] = useState<number>(customer.debtAmount > 0 ? customer.debtAmount : (customer.monthlyFee || 0));
  const [quickPayDate, setQuickPayDate] = useState<string>(CURRENT_SYSTEM_DATE);
  const [quickPayMethod, setQuickPayMethod] = useState<string>(customer.preferredPaymentMethod || 'Chuyển khoản VCB');
  const [quickPayNotes, setQuickPayNotes] = useState<string>('Thu phí dịch vụ định kỳ');

  // Editing Contract State
  const [isEditingContract, setIsEditingContract] = useState(false);
  const [editPackageName, setEditPackageName] = useState(customer.servicePackage);
  const [editMonthlyFee, setEditMonthlyFee] = useState(customer.monthlyFee || 0);
  const [editVatType, setEditVatType] = useState<VatType>(customer.vatType || 'CHUA_VAT');
  const [editServiceStartDate, setEditServiceStartDate] = useState(customer.serviceStartDate || '2026-01-01');
  const [editContractEndDate, setEditContractEndDate] = useState(customer.contractEndDate || '2026-12-31');
  const [editBillingCycle, setEditBillingCycle] = useState<BillingCycle>(customer.billingCycle || 'HANG_THANG');
  const [autoDispatchOnPackageChange, setAutoDispatchOnPackageChange] = useState(false);

  // Quick Renewal Dialog State inside Detail Modal
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [renewStartDate, setRenewStartDate] = useState(customer.contractEndDate || CURRENT_SYSTEM_DATE);
  const [renewEndDate, setRenewEndDate] = useState(() => {
    const d = new Date(customer.contractEndDate || CURRENT_SYSTEM_DATE);
    d.setFullYear(d.getFullYear() + 1);
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  });
  const [renewFee, setRenewFee] = useState(customer.monthlyFee || 0);
  const [renewVatType, setRenewVatType] = useState<VatType>(customer.vatType || 'CHUA_VAT');
  const [renewPkg, setRenewPkg] = useState(customer.servicePackage);
  const [renewNote, setRenewNote] = useState('');

  // Quick CKS Renewal Dialog State
  const [isCksModalOpen, setIsCksModalOpen] = useState(false);
  const [cksExpiry, setCksExpiry] = useState(() => {
    const d = new Date(customer.digitalSignatureExpiry || CURRENT_SYSTEM_DATE);
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });
  const [cksProvider, setCksProvider] = useState(customer.digitalSignatureProvider || 'Viettel-CA');

  // Contract Termination & Liquidation Modal State
  const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);
  const [terminationDate, setTerminationDate] = useState<string>(CURRENT_SYSTEM_DATE);
  const [terminationReason, setTerminationReason] = useState<string>(CUSTOMER_CONTRACT_TERMINATION_REASONS[0]);
  const [customTerminationReason, setCustomTerminationReason] = useState<string>('');
  const [terminationDecisionNo, setTerminationDecisionNo] = useState<string>(() => `TLHĐ-${new Date().getFullYear()}/${customer.code || customer.taxCode || '01'}`);
  const [terminationSettlementAmount, setTerminationSettlementAmount] = useState<number>(customer.debtAmount || 0);
  const [terminationHandoverNotes, setTerminationHandoverNotes] = useState<string>(
    `Đã hoàn tất kiểm kê và bàn giao toàn bộ chứng từ kế toán, sổ sách khai thuế và bàn giao lại thiết bị Token CKS cho đại diện công ty ${customer.name}.`
  );
  const [returnToken, setReturnToken] = useState(true);
  const [finalizeDocs, setFinalizeDocs] = useState(true);
  const [settleDebt, setSettleDebt] = useState(true);
  const [closeActiveTasks, setCloseActiveTasks] = useState(true);

  const [isAutoDispatchModalOpen, setIsAutoDispatchModalOpen] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Workload and active users for reassignment (excluding Admin/USR-030 from daily operational assignments)
  const allWorkloadSummaries = storageService.getStaffWorkloadSummaries();
  const allActiveUsers = storageService.getUsers().filter(u => 
    u.active !== false && 
    u.role !== 'ADMIN' && 
    u.id !== 'USR-030' && 
    !u.name.includes('Quản Trị')
  );

  // Staff Reassignment Modal State
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [reassignNewStaffId, setReassignNewStaffId] = useState<string>(() => {
    if (customer.assignedStaffId && customer.assignedStaffId !== 'USR-030') {
      return customer.assignedStaffId;
    }
    return allActiveUsers[0]?.id || '';
  });
  const [reassignNewReviewerId, setReassignNewReviewerId] = useState<string>(() => {
    if (customer.reviewerStaffId && customer.reviewerStaffId !== 'USR-030') {
      return customer.reviewerStaffId;
    }
    return allActiveUsers[1]?.id || allActiveUsers[0]?.id || '';
  });
  const [reassignActiveTasks, setReassignActiveTasks] = useState(true);
  const [reassignHandoverNote, setReassignHandoverNote] = useState('');

  const handleExecuteReassign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignNewStaffId) return;

    try {
      const res = storageService.reassignCustomerStaffAndReviewer(
        customer.id,
        {
          newStaffId: reassignNewStaffId,
          newReviewerId: reassignNewReviewerId,
          reassignActiveTasks,
          handoverNote: reassignHandoverNote,
        },
        currentUser || undefined
      );

      if (res.success) {
        onUpdateCustomer(res.customer);
        setNotificationMsg(res.message);
        setIsReassignModalOpen(false);
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi khi điều chuyển nhân sự phụ trách');
    }
  };

  // Permission gates
  const canViewSensitiveData = PermissionService.canViewCustomerSensitiveData(currentUser, customer);
  const canViewFinancials = PermissionService.canViewCustomerFinancials(currentUser);
  const canEditContract = canViewFinancials && (currentUser?.role === 'ADMIN' || currentUser?.role === 'BAN_GIAM_DOC' || currentUser?.role === 'TRUONG_PHONG' || currentUser?.department === 'KINH_DOANH_CSKH');
  const canEditCustomer = PermissionService.canEditCustomer(currentUser, customer);
  const canManageDebt = currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'BAN_GIAM_DOC' || currentUser.role === 'TRUONG_PHONG' || PermissionService.can(currentUser, 'contract:manage_debt'));
  const [showSensitivePasswords, setShowSensitivePasswords] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldKey: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const matchedPkg = SERVICE_PACKAGES.find(p => p.name === customer.servicePackage) || 
                     SERVICE_PACKAGES.find(p => customer.servicePackage.toLowerCase().includes(p.name.toLowerCase()));

  const customerTasks = tasks.filter(t => t.customerId === customer.id);
  const activeTasks = customerTasks.filter(t => t.status !== 'HOAN_THANH' && t.status !== 'HUY');
  const completedTasks = customerTasks.filter(t => t.status === 'HOAN_THANH');

  // Contract expiry calculations
  const contractExpiryInfo = (() => {
    if (!customer.contractEndDate) return null;
    const now = new Date(CURRENT_SYSTEM_DATE);
    const end = new Date(customer.contractEndDate);
    const daysDiff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 3600 * 24));
    return {
      endDate: customer.contractEndDate,
      daysDiff,
      isExpired: daysDiff < 0,
      isCritical: daysDiff >= 0 && daysDiff <= 15,
      isWarning: daysDiff > 15 && daysDiff <= 30,
      isSafe: daysDiff > 30,
    };
  })();

  const handleExecuteContractRenewal = (e: React.FormEvent) => {
    e.preventDefault();
    const result = storageService.renewCustomerContract({
      customerId: customer.id,
      startDate: renewStartDate,
      endDate: renewEndDate,
      monthlyFee: Number(renewFee),
      vatType: renewVatType,
      servicePackage: renewPkg,
      notes: renewNote,
      actor: currentUser || undefined,
    });
    if (result.success && result.customer) {
      onUpdateCustomer(result.customer);
      setNotificationMsg(result.message);
      setIsRenewModalOpen(false);
    }
  };

  const handleExecuteCksRenewal = (e: React.FormEvent) => {
    e.preventDefault();
    const result = storageService.renewDigitalSignature({
      customerId: customer.id,
      newExpiryDate: cksExpiry,
      provider: cksProvider,
      actor: currentUser || undefined,
    });
    if (result.success && result.customer) {
      onUpdateCustomer(result.customer);
      setNotificationMsg(result.message);
      setIsCksModalOpen(false);
    }
  };

  const handleOpenTerminationModal = () => {
    setTerminationDate(CURRENT_SYSTEM_DATE);
    setTerminationReason(CUSTOMER_CONTRACT_TERMINATION_REASONS[0]);
    setCustomTerminationReason('');
    setTerminationDecisionNo(`TLHĐ-${new Date().getFullYear()}/${customer.code || customer.taxCode || '01'}`);
    setTerminationSettlementAmount(customer.debtAmount || 0);
    setTerminationHandoverNotes(
      `Đã hoàn tất kiểm kê và bàn giao toàn bộ chứng từ kế toán, sổ sách khai thuế và bàn giao lại thiết bị Token CKS cho đại diện công ty ${customer.name}.`
    );
    setReturnToken(true);
    setFinalizeDocs(true);
    setSettleDebt(true);
    setCloseActiveTasks(true);
    setIsTerminateModalOpen(true);
  };

  const handleExecuteContractTermination = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = terminationReason === 'Lý do khác theo biên bản thanh lý hợp đồng dịch vụ' && customTerminationReason.trim()
      ? customTerminationReason.trim()
      : terminationReason;

    const result = storageService.terminateCustomerContract({
      customerId: customer.id,
      terminationDate,
      terminationReason: finalReason,
      terminationDecisionNo,
      terminationSettlementAmount: Number(terminationSettlementAmount),
      terminationHandoverNotes,
      returnDigitalSignatureToken: returnToken,
      finalizeTaxDocs: finalizeDocs,
      settleDebtFinal: settleDebt,
      closeActiveTasks,
      actor: currentUser || undefined,
    });

    if (result.success && result.customer) {
      onUpdateCustomer(result.customer);
      setNotificationMsg(result.message);
      setIsTerminateModalOpen(false);
    }
  };

  const handleReactivateContract = () => {
    if (!window.confirm(`Bạn có chắc chắn muốn tái kích hoạt hợp đồng dịch vụ cho khách hàng "${customer.name}"?`)) {
      return;
    }
    const result = storageService.reactivateCustomerContract(customer.id, currentUser || undefined);
    if (result.success && result.customer) {
      onUpdateCustomer(result.customer);
      setNotificationMsg(result.message);
    }
  };

  const handleSaveDebt = () => {
    onUpdateCustomer({
      ...customer,
      debtAmount: Number(newDebtAmount),
    });
    setIsEditingDebt(false);
  };

  const handleQuickAutoDispatch = () => {
    const res = storageService.autoDispatchPeriodicTasksForPackageCustomers({
      customerId: customer.id,
      targetPackage: customer.servicePackage,
      periodMonth: new Date().getMonth() + 1,
      periodYear: new Date().getFullYear(),
      periodQuarter: Math.ceil((new Date().getMonth() + 1) / 3),
      cycleType: 'ALL',
      overwriteExisting: false,
      actor: currentUser || undefined,
    });
    onTasksChanged?.();
    setNotificationMsg(`⚡ Tự động giao việc theo gói "${customer.servicePackage}": Đã tạo ${res.totalCreated} công việc định kỳ mới (Đã có ${res.totalSkipped} việc)!`);
  };

  const handleOpenEditContract = () => {
    setEditPackageName(customer.servicePackage);
    setEditMonthlyFee(customer.monthlyFee || 0);
    setEditVatType(customer.vatType || 'CHUA_VAT');
    setEditServiceStartDate(customer.serviceStartDate || '2026-01-01');
    setEditContractEndDate(customer.contractEndDate || '2026-12-31');
    setEditBillingCycle(customer.billingCycle || 'HANG_THANG');
    setIsEditingContract(true);
  };

  const handleSaveContract = () => {
    const updatedCustomer: Customer = {
      ...customer,
      servicePackage: editPackageName,
      monthlyFee: Number(editMonthlyFee) || 0,
      vatType: editVatType,
      serviceStartDate: editServiceStartDate || customer.serviceStartDate || '2026-01-01',
      contractEndDate: editContractEndDate || customer.contractEndDate,
      billingCycle: editBillingCycle || customer.billingCycle || 'HANG_THANG',
    };
    onUpdateCustomer(updatedCustomer);
    setIsEditingContract(false);

    if (autoDispatchOnPackageChange) {
      const res = storageService.autoDispatchPeriodicTasksForPackageCustomers({
        customerId: customer.id,
        targetPackage: editPackageName,
        periodMonth: new Date().getMonth() + 1,
        periodYear: new Date().getFullYear(),
        periodQuarter: Math.ceil((new Date().getMonth() + 1) / 3),
        cycleType: 'ALL',
        overwriteExisting: false,
        actor: currentUser || undefined,
      });
      onTasksChanged?.();
      setNotificationMsg(`Đã cập nhật hợp đồng, phí ${formatCurrency(editMonthlyFee)}/tháng & tự động giao ${res.totalCreated} việc định kỳ thành công!`);
    } else {
      setNotificationMsg(`Đã cập nhật thông tin hợp đồng, phí dịch vụ ${formatCurrency(editMonthlyFee)}/tháng & ngày áp dụng chu kỳ (${formatDate(editServiceStartDate)}) thành công!`);
    }
  };

  const handlePackageSelectInModal = (pkgId: string) => {
    if (pkgId === 'CUSTOM') return;
    const pkg = SERVICE_PACKAGES.find(p => p.id === pkgId);
    if (pkg) {
      setEditPackageName(pkg.name);
      setEditMonthlyFee(pkg.defaultMonthlyFee);
    }
  };

  const handleUpdateRisk = (newRisk: CustomerRiskLevel) => {
    onUpdateCustomer({
      ...customer,
      riskLevel: newRisk,
    });
  };

  const handleSavePaymentCycle = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = storageService.updateCustomerPaymentCycle(
      customer.id,
      {
        billingCycle: cycleType,
        paymentDueDay: Number(cycleDueDay),
        paymentTermDays: Number(cycleTermDays),
        creditLimit: Number(cycleCreditLimit),
        preferredPaymentMethod: cyclePaymentMethod,
        paymentDiscountPolicy: cycleDiscount,
        paymentNotes: cycleNotes,
      },
      currentUser || undefined
    );
    if (updated) {
      onUpdateCustomer(updated);
      setNotificationMsg('Đã cập nhật cấu hình chu kỳ thanh toán khách hàng thành công!');
      setIsEditingPaymentCycle(false);
    }
  };

  const handleRecordPaymentReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickPayAmount <= 0) return;
    const res = storageService.recordCustomerPayment(
      customer.id,
      {
        amount: Number(quickPayAmount),
        paymentDate: quickPayDate,
        paymentMethod: quickPayMethod,
        notes: quickPayNotes,
      },
      currentUser || undefined
    );
    if (res.serverEntity) {
      onUpdateCustomer(res.serverEntity);
      setNotificationMsg(`Đã ghi nhận phiếu thu ${formatCurrency(quickPayAmount)} thành công!`);
      setIsAddingPayment(false);
    }
  };

  const handleSendReminderFromModal = (channel: 'EMAIL' | 'ZALO' | 'CALL') => {
    const channelName = channel === 'EMAIL' ? 'Email' : channel === 'ZALO' ? 'Zalo OA' : 'Điện thoại';
    const res = storageService.logCustomerDebtReminder(
      customer.id,
      {
        reminderType: channel,
        content: `Kính gửi ${customer.name}, số nợ phí dịch vụ tính đến ${CURRENT_SYSTEM_DATE} là ${formatCurrency(customer.debtAmount)}. Vui lòng thanh toán theo hạn mức.`,
        status: 'SENT',
      },
      currentUser || undefined
    );
    if (res.serverEntity) {
      onUpdateCustomer(res.serverEntity);
      setNotificationMsg(`Đã gửi thông báo nhắc nợ qua ${channelName}!`);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-2 sm:p-4'}`}>
      <div className={`bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden transition-all duration-150 ${
        isFullscreen
          ? 'w-screen h-screen max-w-none max-h-none rounded-none'
          : 'w-full max-w-[98vw] 2xl:max-w-7xl max-h-[96vh] h-[92vh] rounded-2xl border border-slate-200 dark:border-slate-800'
      }`}>
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                MST: {customer.taxCode}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${RISK_LABELS[customer.riskLevel]?.badgeClass}`}>
                {RISK_LABELS[customer.riskLevel]?.label}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold">
                {customer.servicePackage}
              </span>

              {/* Service Type Badge (Định kỳ / Phát sinh / Hỗn hợp) */}
              {(() => {
                const sType = customer.serviceType || (customer.billingCycle === 'THEO_VU_VIEC' ? 'PHAT_SINH' : 'DINH_KY');
                const info = CUSTOMER_SERVICE_TYPE_LABELS[sType] || CUSTOMER_SERVICE_TYPE_LABELS.DINH_KY;
                return (
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${info.badgeClass} ${info.badgeBorder}`}>
                    {info.icon} {info.label}
                  </span>
                );
              })()}

              {/* Legal Type Badge */}
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                customer.type === 'HO_KINH_DOANH'
                  ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                  : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700'
              }`}>
                {CUSTOMER_TYPE_LABELS[customer.type || 'CONG_TY']?.label}
              </span>

              {/* Household Business Group Badge (If HKD) */}
              {customer.type === 'HO_KINH_DOANH' && customer.householdGroup && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-900/60 text-orange-900 dark:text-orange-200 font-extrabold border border-orange-400">
                  {HOUSEHOLD_BUSINESS_GROUP_LABELS[customer.householdGroup]?.shortLabel} ({HOUSEHOLD_BUSINESS_GROUP_LABELS[customer.householdGroup]?.revenueRange})
                </span>
              )}

              {/* Tax Declaration Cycle Badge */}
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                customer.taxDeclarationCycle === 'THANG'
                  ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 border-purple-300'
                  : 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-300'
              }`}>
                {customer.taxDeclarationCycle === 'THANG' ? '🗓️ Kê khai theo Tháng' : '📅 Kê khai theo Quý'}
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1.5 leading-snug">
              {customer.name}
            </h2>

            <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500 flex-wrap gap-y-1">
              <span>{customer.taxDepartment}</span>
              <span>•</span>
              <span>LH: {customer.contactPerson} ({customer.phone})</span>
              <span>•</span>
              <span>Email: {customer.email}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {onOpenPortalForCustomer && (
              <button
                type="button"
                onClick={() => onOpenPortalForCustomer(customer.taxCode)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                title="Xem giao diện Cổng tra cứu của khách hàng này"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Cổng Tra Cứu</span>
              </button>
            )}
            {onEditCustomer && canEditCustomer && (
              <button
                type="button"
                onClick={() => onEditCustomer(customer)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                title="Chỉnh sửa toàn bộ thông tin khách hàng, hợp đồng và phân công"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sửa Thông Tin</span>
              </button>
            )}
            <button
              onClick={() => onOpenCreateTaskForCustomer(customer)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-xs transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Giao Việc Mới</span>
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title={isFullscreen ? 'Thu nhỏ giao diện' : 'Mở rộng toàn màn hình'}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800"
              title="Đóng cửa sổ"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 4 Pillar Quick Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-100/50 dark:bg-slate-850/40 border-b border-slate-200 dark:border-slate-800 text-xs">
          <div className="relative group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Kế Toán Phụ Trách:</span>
              {canEditCustomer && (
                <button
                  type="button"
                  onClick={() => {
                    setReassignNewStaffId(customer.assignedStaffId || '');
                    setReassignNewReviewerId(customer.reviewerStaffId || '');
                    setIsReassignModalOpen(true);
                  }}
                  className="text-[10px] text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold hover:underline flex items-center space-x-0.5 cursor-pointer"
                  title="Điều chuyển kế toán phụ trách"
                >
                  <Edit3 className="h-2.5 w-2.5" />
                  <span>Đổi</span>
                </button>
              )}
            </div>
            <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1 mt-0.5">
              <UserCheck className="h-3.5 w-3.5 text-blue-600" />
              <span className="truncate">{customer.assignedStaffName || 'Chưa phân công'}</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Kiểm Soát Viên:</span>
              {canEditCustomer && (
                <button
                  type="button"
                  onClick={() => {
                    setReassignNewStaffId(customer.assignedStaffId || '');
                    setReassignNewReviewerId(customer.reviewerStaffId || '');
                    setIsReassignModalOpen(true);
                  }}
                  className="text-[10px] text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-semibold hover:underline flex items-center space-x-0.5 cursor-pointer"
                  title="Điều chuyển kiểm soát viên"
                >
                  <Edit3 className="h-2.5 w-2.5" />
                  <span>Đổi</span>
                </button>
              )}
            </div>
            <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1 mt-0.5">
              <ShieldAlert className="h-3.5 w-3.5 text-indigo-600" />
              <span className="truncate">{customer.reviewerStaffName || 'Chưa phân công'}</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Phí Dịch Vụ Tháng:</span>
            <div className="font-bold mt-0.5">
              {canViewFinancials ? (
                <span className="text-emerald-600">{formatCurrency(customer.monthlyFee)}</span>
              ) : (
                <span className="text-slate-400 font-mono flex items-center space-x-1">
                  <Lock className="h-3 w-3 text-amber-500 inline" />
                  <span>Bảo mật</span>
                </span>
              )}
            </div>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Công Nợ Phí Dịch Vụ:</span>
            <div className="flex items-center space-x-1.5 mt-0.5">
              {!canViewFinancials ? (
                <span className="text-slate-400 font-mono flex items-center space-x-1">
                  <Lock className="h-3 w-3 text-amber-500 inline" />
                  <span>Bảo mật</span>
                </span>
              ) : isEditingDebt && canManageDebt ? (
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    value={newDebtAmount}
                    onChange={(e) => setNewDebtAmount(Number(e.target.value))}
                    className="w-24 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-xs"
                  />
                  <button onClick={handleSaveDebt} className="text-emerald-600 font-bold">Lưu</button>
                </div>
              ) : (
                <>
                  <span className={`font-bold ${customer.debtAmount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {customer.debtAmount > 0 ? formatCurrency(customer.debtAmount) : '0đ (Đã thanh toán)'}
                  </span>
                  {canManageDebt && (
                    <button onClick={() => setIsEditingDebt(true)} className="text-slate-400 hover:text-slate-600 cursor-pointer" title="Cập nhật nợ">
                      <Edit3 className="h-3 w-3" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 space-x-2 text-xs bg-white dark:bg-slate-900 overflow-x-auto">
          <button
            onClick={() => setActiveTab('TASKS')}
            className={`py-3 px-3 border-b-2 font-bold whitespace-nowrap transition-all ${
              activeTab === 'TASKS'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Hồ Sơ Công Việc Thuế ({activeTasks.length} đang làm / {completedTasks.length} đã xong)
          </button>
          <button
            onClick={() => setActiveTab('TAX_INFO')}
            className={`py-3 px-3 border-b-2 font-bold whitespace-nowrap transition-all ${
              activeTab === 'TAX_INFO'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Thông Tin Thuế & Chữ Ký Số (Token)
          </button>
          <button
            onClick={() => setActiveTab('CONTRACT')}
            className={`py-3 px-3 border-b-2 font-bold whitespace-nowrap transition-all ${
              activeTab === 'CONTRACT'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Hợp Đồng & Quản Trị Rủi Ro
          </button>
          <button
            onClick={() => setActiveTab('PAYMENT_CYCLE_DEBT')}
            className={`py-3 px-3 border-b-2 font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              activeTab === 'PAYMENT_CYCLE_DEBT'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>Chu Kỳ Thanh Toán & Công Nợ</span>
            {customer.debtAmount > 0 && (
              <span className="px-1.5 py-0.2 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 rounded-full font-bold text-[10px]">
                {formatCurrency(customer.debtAmount)}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-xs space-y-4">
          
          {/* TAB 1: TASKS */}
          {activeTab === 'TASKS' && (
            <div className="space-y-3">
              <div className="font-bold text-slate-800 dark:text-slate-200">
                Công việc đang thực hiện ({activeTasks.length})
              </div>

              {activeTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => { onClose(); onSelectTask(task); }}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 cursor-pointer transition-all flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{task.code}</span>
                      <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold border ${STATUS_LABELS[task.status]?.bg} ${STATUS_LABELS[task.status]?.text}`}>
                        {STATUS_LABELS[task.status]?.label}
                      </span>
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white mt-1">{task.title}</div>
                    <div className="text-[11px] text-slate-400 mt-1">Phụ trách: {task.assigneeName} • Hạn nộp: {formatDate(task.dueDate)}</div>
                  </div>
                  <span className="text-blue-600 font-semibold text-[11px]">Xem chi tiết &rarr;</span>
                </div>
              ))}

              {activeTasks.length === 0 && (
                <div className="p-6 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                  Không có công việc nào đang xử lý.
                </div>
              )}

              {completedTasks.length > 0 && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    Lịch sử công việc đã hoàn thành ({completedTasks.length})
                  </div>
                  {completedTasks.map(task => (
                    <div
                      key={task.id}
                      onClick={() => { onClose(); onSelectTask(task); }}
                      className="p-2.5 bg-emerald-50/30 dark:bg-emerald-950/10 rounded-lg border border-emerald-100 dark:border-emerald-900/40 text-slate-600 dark:text-slate-300 hover:border-emerald-300 cursor-pointer transition-all flex items-center justify-between"
                    >
                      <span>{task.title}</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium">Hoàn thành ({formatDate(task.completedAt || task.dueDate)})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TAX & TOKEN INFO */}
          {activeTab === 'TAX_INFO' && (
            <div className="space-y-4">
              {/* Classification & Accounting Standards */}
              <div className="p-4 bg-gradient-to-br from-indigo-50/70 to-blue-50/50 dark:from-indigo-950/30 dark:to-blue-950/20 rounded-xl border border-indigo-200/80 dark:border-indigo-800/60">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-200 mb-3 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Chế Độ Thuế & Chu Kỳ Kê Khai Pháp Định
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Hình Thức Pháp Nhân</div>
                    <div className="font-bold text-slate-900 dark:text-white mt-1 text-sm">
                      {CUSTOMER_TYPE_LABELS[customer.type || 'CONG_TY']?.label}
                    </div>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Kỳ Kê Khai Thuế GTGT/TNCN</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`inline-flex items-center text-xs font-black px-2 py-0.5 rounded ${
                        customer.taxDeclarationCycle === 'THANG'
                          ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                          : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                      }`}>
                        {TAX_DECLARATION_CYCLE_LABELS[customer.taxDeclarationCycle || 'QUY']?.label}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {TAX_DECLARATION_CYCLE_LABELS[customer.taxDeclarationCycle || 'QUY']?.deadlineDescription}
                    </div>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Chế Độ Kế Toán Áp Dụng</div>
                    <div className="font-bold text-slate-900 dark:text-white mt-1 text-sm">
                      {customer.accountingStandard || (customer.type === 'HO_KINH_DOANH' ? 'TT 152/2025/TT-BTC' : 'TT 133/2016/TT-BTC')}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {customer.type === 'HO_KINH_DOANH' ? 'Chế độ kế toán Hộ kinh doanh' : 'Chế độ kế toán Doanh nghiệp vừa và nhỏ'}
                    </div>
                  </div>
                </div>

                {/* Phân nhóm hộ kinh doanh nếu có */}
                {customer.type === 'HO_KINH_DOANH' && customer.householdGroup && (
                  <div className="mt-3 p-3 bg-amber-500/10 dark:bg-amber-950/30 rounded-lg border border-amber-300 dark:border-amber-700/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="font-bold text-amber-900 dark:text-amber-200">
                        Phân Nhóm Doanh Thu: {HOUSEHOLD_BUSINESS_GROUP_LABELS[customer.householdGroup]?.name} ({HOUSEHOLD_BUSINESS_GROUP_LABELS[customer.householdGroup]?.revenueRange})
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Security & Credentials Section */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <KeyRound className="h-4 w-4 text-purple-600" />
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      Tài Khoản Thuế Điện Tử & Chữ Ký Số (Token CKS)
                    </span>
                  </div>

                  {canViewSensitiveData ? (
                    <button
                      type="button"
                      onClick={() => setShowSensitivePasswords(!showSensitivePasswords)}
                      className="flex items-center space-x-1 text-xs text-purple-600 hover:text-purple-700 font-bold cursor-pointer"
                    >
                      {showSensitivePasswords ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      <span>{showSensitivePasswords ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}</span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
                      <Lock className="h-3 w-3" />
                      <span>Bảo mật phân quyền</span>
                    </span>
                  )}
                </div>

                {!canViewSensitiveData ? (
                  <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
                    <div className="flex items-center space-x-1.5 font-bold">
                      <Lock className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>Thông tin đăng nhập thuế & mã PIN được bảo mật</span>
                    </div>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                      Để tránh rủi ro ký khống hoặc rò rỉ bảo mật khách hàng, mật khẩu eTax và mã PIN chữ ký số chỉ hiển thị cho <strong>Kế toán trực tiếp phụ trách ({customer.assignedStaffName || 'Kế toán viên'})</strong> và Ban Giám Đốc.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    {/* eTax Account */}
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="text-slate-400 text-[10px] uppercase font-bold">Tài khoản eTax (Thuế ĐT)</div>
                      <div className="font-mono font-bold text-slate-900 dark:text-white mt-1 flex items-center justify-between">
                        <span>{customer.taxCode}-QL</span>
                        <button
                          onClick={() => handleCopy(`${customer.taxCode}-QL`, 'etax_user')}
                          className="text-slate-400 hover:text-blue-600 p-0.5"
                          title="Sao chép"
                        >
                          {copiedField === 'etax_user' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      <div className="text-slate-400 text-[10px] uppercase font-bold mt-2">Mật khẩu nộp tờ khai</div>
                      <div className="font-mono font-bold text-purple-700 dark:text-purple-300 mt-0.5 flex items-center justify-between">
                        <span>{showSensitivePasswords ? (customer.etaxPassword || 'TaxCore@2026') : '••••••••••••'}</span>
                        <button
                          onClick={() => handleCopy(customer.etaxPassword || 'TaxCore@2026', 'etax_pwd')}
                          className="text-slate-400 hover:text-blue-600 p-0.5"
                          title="Sao chép"
                        >
                          {copiedField === 'etax_pwd' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Token PIN */}
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="text-slate-400 text-[10px] uppercase font-bold">Nhà Cung Cấp Token</div>
                      <div className="font-bold text-slate-900 dark:text-white mt-1">{customer.digitalSignatureProvider || 'Viettel-CA'}</div>
                      <div className="text-slate-400 text-[10px] uppercase font-bold mt-2">Mã PIN Ký Thuế (CKS)</div>
                      <div className="font-mono font-bold text-purple-700 dark:text-purple-300 mt-0.5 flex items-center justify-between">
                        <span>{showSensitivePasswords ? (customer.digitalSignaturePin || '12345678') : '••••••••'}</span>
                        <button
                          onClick={() => handleCopy(customer.digitalSignaturePin || '12345678', 'pin_pwd')}
                          className="text-slate-400 hover:text-blue-600 p-0.5"
                          title="Sao chép PIN"
                        >
                          {copiedField === 'pin_pwd' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Physical Token Location */}
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="text-slate-400 text-[10px] uppercase font-bold">Vị Trí Cất Giữ Token Vật Lý</div>
                      <div className="font-bold text-emerald-700 dark:text-emerald-400 mt-1 flex items-center space-x-1">
                        <ShieldCheck className="h-4 w-4 shrink-0" />
                        <span>Tủ két B-04 / Ngăn ký số</span>
                      </div>
                      <div className="text-slate-400 text-[10px] uppercase font-bold mt-2">Hạn sử dụng chứng thư</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 font-mono">
                        {formatDate(customer.digitalSignatureExpiry || '2027-12-31')}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Mã Số Thuế</div>
                  <div className="font-mono text-sm font-bold text-slate-900 dark:text-white mt-0.5">{customer.taxCode}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Cơ Quan Thuế Trực Tiếp Quản Lý</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">{customer.taxDepartment}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Nhà Cung Cấp Chữ Ký Số (Token)</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">{customer.digitalSignatureProvider || 'Viettel-CA'}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Hạn Dùng Chữ Ký Số</div>
                  <div className="font-bold text-amber-600 mt-0.5">{formatDate(customer.digitalSignatureExpiry || '2027-12-31')}</div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Địa Chỉ Trụ Sở Đăng Ký</div>
                  <div className="font-medium text-slate-900 dark:text-white mt-0.5">{customer.address}</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONTRACT & RISK */}
          {activeTab === 'CONTRACT' && (
            !canViewFinancials ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 mx-auto flex items-center justify-center">
                  <Lock className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Dữ Liệu Hợp Đồng & Biểu Phí Được Bảo Vệ</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Thông tin giá trị hợp đồng dịch vụ, biểu phí và thời hạn tái ký thuộc quyền quản lý của <strong>Ban Giám Đốc</strong>, <strong>Kế Toán Trưởng</strong> và <strong>Bộ phận CSKH</strong>. Nhân viên phụ trách chỉ thao tác nghiệp vụ hồ sơ công việc thuế.
                </p>
              </div>
            ) : (
            <div className="space-y-4">
              
              {/* 1. CONTRACT LIFECYCLE & RENEWAL / TERMINATION BANNER */}
              {customer.contractStatus === 'DA_CHAM_DUT' || customer.contractStatus === 'DA_HUY' ? (
                <div className="p-5 rounded-2xl border-2 border-rose-300 dark:border-rose-800 bg-rose-50/90 dark:bg-rose-950/50 text-rose-900 dark:text-rose-100 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start space-x-3.5">
                      <div className="p-2.5 rounded-xl bg-rose-600 text-white shrink-0 shadow-sm">
                        <AlertOctagon className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="font-bold text-base text-rose-950 dark:text-rose-100">
                            Hợp Đồng Dịch Vụ Đã Chấm Dứt & Thanh Lý
                          </span>
                          <span className="text-[11px] px-2.5 py-0.5 rounded-full font-extrabold bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100 border border-rose-300">
                            ĐÃ CHẤM DỨT
                          </span>
                        </div>
                        <p className="text-xs text-rose-800 dark:text-rose-300 mt-1 leading-relaxed">
                          Hợp đồng kế toán - thuế đối với khách hàng này đã chính thức thanh lý và ngừng phát sinh các nghĩa vụ dịch vụ định kỳ.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={handleReactivateContract}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-1.5 transition-all"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Tái Kích Hoạt / Ký Lại HĐ</span>
                      </button>
                    </div>
                  </div>

                  {/* Termination Key Metadata Box */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-rose-200/80 dark:border-rose-800/80 text-xs">
                    <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-rose-200 dark:border-rose-900">
                      <div className="text-[10px] text-rose-600 dark:text-rose-400 uppercase font-bold">Ngày Chấm Dứt / Thanh Lý</div>
                      <div className="font-bold text-slate-900 dark:text-white mt-0.5 font-mono">
                        {formatDate(customer.terminationDate || customer.updatedAt || CURRENT_SYSTEM_DATE)}
                      </div>
                    </div>

                    <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-rose-200 dark:border-rose-900">
                      <div className="text-[10px] text-rose-600 dark:text-rose-400 uppercase font-bold">Số Biên Bản / Quyết Định</div>
                      <div className="font-bold text-slate-900 dark:text-white mt-0.5 font-mono">
                        {customer.terminationDecisionNo || '---'}
                      </div>
                    </div>

                    <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-rose-200 dark:border-rose-900">
                      <div className="text-[10px] text-rose-600 dark:text-rose-400 uppercase font-bold">Quyết Toán / Công Nợ Cuối</div>
                      <div className="font-bold text-rose-700 dark:text-rose-300 mt-0.5 font-mono">
                        {formatCurrency(customer.terminationSettlementAmount ?? customer.debtAmount ?? 0)}
                      </div>
                    </div>

                    <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-rose-200 dark:border-rose-900">
                      <div className="text-[10px] text-rose-600 dark:text-rose-400 uppercase font-bold">Người Lập Thanh Lý</div>
                      <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                        {customer.terminationByStaffName || 'Ban Quản Lý'}
                      </div>
                    </div>
                  </div>

                  {/* Handover & Liquidation Details */}
                  <div className="p-3.5 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-rose-200 dark:border-rose-900 space-y-2 text-xs">
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                      <FileCheck2 className="h-4 w-4 text-rose-600" />
                      <span>Biên bản bàn giao & Căn cứ chấm dứt</span>
                    </div>

                    <div className="text-slate-700 dark:text-slate-300">
                      <strong>Lý do chấm dứt:</strong> {customer.terminationReason || 'Hai bên thỏa thuận chấm dứt dịch vụ trước thời hạn.'}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center space-x-1 ${
                        customer.returnDigitalSignatureToken !== false
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-50 text-amber-700 border-amber-300'
                      }`}>
                        <span>{customer.returnDigitalSignatureToken !== false ? '✓' : '!'}</span>
                        <span>Bàn giao Token CKS: {customer.returnDigitalSignatureToken !== false ? 'Đã bàn giao đại diện DN' : 'Chưa bàn giao'}</span>
                      </span>

                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center space-x-1 ${
                        customer.finalizeTaxDocs !== false
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-50 text-amber-700 border-amber-300'
                      }`}>
                        <span>{customer.finalizeTaxDocs !== false ? '✓' : '!'}</span>
                        <span>Sổ sách & Chứng từ thuế: {customer.finalizeTaxDocs !== false ? 'Đã bàn giao đầy đủ' : 'Chưa bàn giao'}</span>
                      </span>
                    </div>

                    {customer.terminationHandoverNotes && (
                      <div className="text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 mt-2">
                        {customer.terminationHandoverNotes}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  contractExpiryInfo?.isExpired
                    ? 'bg-red-50/80 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
                    : contractExpiryInfo?.isCritical
                    ? 'bg-orange-50/80 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800 text-orange-900 dark:text-orange-200'
                    : contractExpiryInfo?.isWarning
                    ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                    : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                }`}>
                  <div className="flex items-start space-x-3">
                    <div className={`p-2.5 rounded-xl text-white shrink-0 ${
                      contractExpiryInfo?.isExpired ? 'bg-red-600' :
                      contractExpiryInfo?.isCritical ? 'bg-orange-600' :
                      contractExpiryInfo?.isWarning ? 'bg-amber-600' : 'bg-emerald-600'
                    }`}>
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm">
                          Thời Hạn Hiệu Lực Hợp Đồng Dịch Vụ
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          contractExpiryInfo?.isExpired ? 'bg-red-200 border-red-400 text-red-800' :
                          contractExpiryInfo?.isCritical ? 'bg-orange-200 border-orange-400 text-orange-800 animate-pulse' :
                          contractExpiryInfo?.isWarning ? 'bg-amber-200 border-amber-400 text-amber-800' :
                          'bg-emerald-200 border-emerald-400 text-emerald-800'
                        }`}>
                          {contractExpiryInfo?.isExpired ? `ĐÃ HẾT HẠN (${Math.abs(contractExpiryInfo.daysDiff)} NGÀY)` :
                           contractExpiryInfo?.isCritical ? `KHẨN CẤP: CÒN ${contractExpiryInfo.daysDiff} NGÀY` :
                           contractExpiryInfo?.isWarning ? `CẢNH BÁO TÁI KÝ: CÒN ${contractExpiryInfo.daysDiff} NGÀY` :
                           `ĐANG HIỆU LỰC (CÒN ${contractExpiryInfo?.daysDiff} NGÀY)`}
                        </span>
                      </div>

                      <div className="text-xs mt-1 space-x-2">
                        <span>Bắt đầu: <strong>{formatDate(customer.serviceStartDate || '2026-01-01')}</strong></span>
                        <span>&rarr;</span>
                        <span>Kết thúc: <strong>{formatDate(customer.contractEndDate || '2026-12-31')}</strong></span>
                        <span>(Thời hạn: {customer.contractDurationMonths || 12} tháng)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => {
                        const curEnd = customer.contractEndDate || CURRENT_SYSTEM_DATE;
                        const nextEnd = new Date(curEnd);
                        nextEnd.setFullYear(nextEnd.getFullYear() + 1);
                        nextEnd.setDate(nextEnd.getDate() - 1);

                        setRenewStartDate(curEnd);
                        setRenewEndDate(nextEnd.toISOString().split('T')[0]);
                        setRenewFee(customer.monthlyFee || 0);
                        setRenewPkg(customer.servicePackage);
                        setRenewNote(`Tái ký hợp đồng dịch vụ mới niên độ ${new Date(curEnd).getFullYear()} - ${nextEnd.getFullYear()}`);
                        setIsRenewModalOpen(true);
                      }}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-1.5 transition-all"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Tái Ký Hợp Đồng</span>
                    </button>

                    <button
                      onClick={handleOpenTerminationModal}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-1.5 transition-all"
                      title="Chấm dứt & thanh lý hợp đồng dịch vụ cho khách hàng này"
                    >
                      <FileX2 className="h-3.5 w-3.5" />
                      <span>Chấm Dứt Hợp Đồng</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 2. CHỮ KÝ SỐ (CKS) & HÓA ĐƠN ĐIỆN TỬ RADAR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* CKS Token Box */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-purple-700 dark:text-purple-300 font-bold text-xs">
                      <KeyRound className="h-4 w-4" />
                      <span>Chữ Ký Số (Token CKS Khai Thuế)</span>
                    </div>
                    <button
                      onClick={() => setIsCksModalOpen(true)}
                      className="text-[11px] text-purple-600 hover:underline font-bold"
                    >
                      + Gia hạn Token
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Nhà Mạng CA</span>
                      <div className="font-bold text-slate-800 dark:text-slate-200">{customer.digitalSignatureProvider || 'Viettel-CA'}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Hạn Dùng Token</span>
                      <div className="font-bold text-purple-700 dark:text-purple-300 font-mono">
                        {formatDate(customer.digitalSignatureExpiry || '2027-12-31')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* E-Invoice Box */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                      <Receipt className="h-4 w-4" />
                      <span>Hóa Đơn Điện Tử (HĐĐT)</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                      {customer.eInvoiceRemaining !== undefined ? `${customer.eInvoiceRemaining} số còn lại` : 'Đang sử dụng'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Nhà Phát Hành</span>
                      <div className="font-bold text-slate-800 dark:text-slate-200">MISA meInvoice / VNPT</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Cảnh Báo Quota</span>
                      <div className="text-slate-600 dark:text-slate-300">Cảnh báo khi &le; 50 số</div>
                    </div>
                  </div>
                </div>

              </div>

              {/* 3. CONTRACT HISTORY TIMELINE */}
              {customer.contractHistory && customer.contractHistory.length > 0 && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200 font-bold text-xs">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span>Lịch Sử Các Lần Ký & Tái Ký Hợp Đồng ({customer.contractHistory.length})</span>
                  </div>

                  <div className="space-y-2">
                    {customer.contractHistory.map((hist, hIdx) => (
                      <div
                        key={hist.id || hIdx}
                        className="p-3 bg-white dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-700/80 text-xs flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-blue-600 dark:text-blue-400">{hist.servicePackage}</span>
                            {canViewFinancials ? (
                              <span className="font-mono text-emerald-600 font-bold">{formatCurrency(hist.monthlyFee)}/tháng</span>
                            ) : (
                              <span className="text-slate-400 font-mono text-[10px]">🔒 Phí: Bảo mật</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Thời hạn: {formatDate(hist.startDate)} &rarr; {formatDate(hist.endDate)} • Ký ngày: {formatDate(hist.renewedAt)} bởi {hist.renewedByName}
                          </div>
                          {hist.notes && (
                            <div className="text-[10.5px] text-slate-400 italic mt-0.5">{hist.notes}</div>
                          )}
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold shrink-0">
                          HĐ Đã Lưu
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contract Package Details Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-blue-600 shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Thông Tin Hợp Đồng & Biểu Phí Dịch Vụ Chu Kỳ</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          Thay đổi linh hoạt theo chu kỳ
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        Cho phép điều chỉnh Phí dịch vụ hàng tháng và Ngày ký / Bắt đầu dịch vụ bất kỳ lúc nào khớp với chu kỳ kinh doanh thực tế
                      </p>
                    </div>
                  </div>

                  {canEditContract && !isEditingContract ? (
                    <button
                      onClick={handleOpenEditContract}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-bold transition-all shrink-0 self-start sm:self-auto cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Chỉnh Sửa Biểu Phí & Chu Kỳ HĐ</span>
                    </button>
                  ) : isEditingContract ? (
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => setIsEditingContract(false)}
                        className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleSaveContract}
                        className="flex items-center space-x-1 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                      >
                        <Save className="h-3.5 w-3.5" />
                        <span>Lưu Thay Đổi</span>
                      </button>
                    </div>
                  ) : null}
                </div>

                {!isEditingContract ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                    {/* Card 1: Gói Dịch Vụ */}
                    <div className="p-3 bg-white dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-between group hover:border-blue-300 transition-all">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Gói Dịch Vụ Áp Dụng</span>
                          {canEditContract && (
                            <button
                              onClick={handleOpenEditContract}
                              className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center space-x-0.5 cursor-pointer"
                            >
                              <Edit3 className="h-2.5 w-2.5" />
                              <span>Đổi</span>
                            </button>
                          )}
                        </div>
                        <div className="font-bold text-blue-700 dark:text-blue-400 text-sm mt-1 leading-snug">
                          {customer.servicePackage}
                        </div>
                      </div>
                      <div className="text-[10.5px] text-slate-400 mt-2">
                        Quy cách công việc định kỳ
                      </div>
                    </div>

                    {/* Card 2: Phí Dịch Vụ Thu Hàng Tháng */}
                    <div className="p-3 bg-white dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-between group hover:border-emerald-300 transition-all">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Phí Thu Hàng Tháng</span>
                          {canViewFinancials && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                              customer.vatType === 'DA_CO_VAT' 
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' 
                                : customer.vatType === 'KHONG_VAT'
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                            }`}>
                              {customer.vatType === 'DA_CO_VAT' ? 'Đã có VAT' : customer.vatType === 'KHONG_VAT' ? '0% VAT' : 'Chưa gồm VAT'}
                            </span>
                          )}
                        </div>
                        {canViewFinancials ? (
                          <>
                            <div className="font-bold text-emerald-600 dark:text-emerald-400 text-base mt-1 flex items-baseline gap-1">
                              <span>{formatCurrency(customer.monthlyFee || 0)}</span>
                              <span className="text-[11px] font-normal text-slate-400">/tháng</span>
                            </div>
                            {customer.vatType === 'CHUA_VAT' && (
                              <div className="text-[10.5px] font-normal text-slate-500 dark:text-slate-400">
                                Xuất HĐ (+10%): {formatCurrency((customer.monthlyFee || 0) * 1.1)}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-slate-400 font-medium text-xs mt-2 flex items-center space-x-1">
                            <Lock className="h-3.5 w-3.5 text-amber-500" />
                            <span>🔒 Bảo mật tài chính</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold">
                          Chu kỳ: {BILLING_CYCLE_LABELS[customer.billingCycle || 'HANG_THANG']?.label || 'Hàng Tháng'}
                        </span>
                        {canEditContract && (
                          <button
                            onClick={handleOpenEditContract}
                            className="text-[10.5px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center space-x-0.5 cursor-pointer"
                          >
                            <Edit3 className="h-2.5 w-2.5" />
                            <span>Đổi phí</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Card 3: Ngày Ký / Bắt Đầu Dịch Vụ */}
                    <div className="p-3 bg-white dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-between group hover:border-blue-300 transition-all">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Ngày Ký / Bắt Đầu Dịch Vụ</span>
                          {canEditContract && (
                            <button
                              onClick={handleOpenEditContract}
                              className="text-[10.5px] text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center space-x-0.5 cursor-pointer"
                            >
                              <Edit3 className="h-2.5 w-2.5" />
                              <span>Đổi ngày</span>
                            </button>
                          )}
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm mt-1">
                          {formatDate(customer.serviceStartDate || '2026-01-01')}
                        </div>
                      </div>
                      <div className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-2 flex items-center space-x-1">
                        <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>Mốc bắt đầu tính phí chu kỳ</span>
                      </div>
                    </div>

                    {/* Card 4: Ngày Kết Thúc / Thời Hạn HĐ */}
                    <div className="p-3 bg-white dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-between group hover:border-purple-300 transition-all">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Thời Hạn / Kết Thúc HĐ</span>
                          {canEditContract && (
                            <button
                              onClick={handleOpenEditContract}
                              className="text-[10.5px] text-purple-600 dark:text-purple-400 hover:underline font-bold flex items-center space-x-0.5 cursor-pointer"
                            >
                              <Edit3 className="h-2.5 w-2.5" />
                              <span>Sửa</span>
                            </button>
                          )}
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm mt-1">
                          {customer.contractEndDate ? formatDate(customer.contractEndDate) : 'Không thời hạn'}
                        </div>
                      </div>
                      <div className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-2">
                        Thời hạn: {customer.contractDurationMonths || 12} tháng
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800 space-y-3">
                    <div className="text-xs font-bold text-blue-900 dark:text-blue-300 pb-1 border-b border-blue-200 dark:border-blue-800 flex items-center justify-between">
                      <span>✏️ Chỉnh Sửa Thông Tin Hợp Đồng, Biểu Phí & Chu Kỳ Dịch Vụ</span>
                      <span className="text-[11px] font-normal text-slate-600 dark:text-slate-400">
                        Cập nhật tức thời cho hồ sơ khách hàng
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      {/* Gói Dịch Vụ */}
                      <div className="sm:col-span-6">
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                          Chọn Gói Dịch Vụ Từ Danh Mục Chuẩn
                        </label>
                        <select
                          onChange={(e) => handlePackageSelectInModal(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-slate-900 dark:text-white text-xs"
                          defaultValue=""
                        >
                          <option value="" disabled>-- Chọn gói dịch vụ chuẩn --</option>
                          <optgroup label="1. ĐẠI LÝ THUẾ & KẾ TOÁN TRỌN GÓI">
                            {SERVICE_PACKAGES.filter(p => p.category === 'KE_TOAN_THUE_TRON_GOI').map(p => (
                              <option key={p.id} value={p.id}>{p.name} — {p.feeDisplay}</option>
                            ))}
                          </optgroup>
                          <optgroup label="2. KẾ TOÁN – THUẾ & GIẢI TRÌNH THANH TRA">
                            {SERVICE_PACKAGES.filter(p => p.category === 'KE_TOAN_THUE_PHAT_SINH').map(p => (
                              <option key={p.id} value={p.id}>{p.name} — {p.feeDisplay}</option>
                            ))}
                          </optgroup>
                          <optgroup label="3. TIỀN LƯƠNG, BHXH & LAO ĐỘNG">
                            {SERVICE_PACKAGES.filter(p => p.category === 'TIEN_LUONG_BHXH_PHAT_SINH').map(p => (
                              <option key={p.id} value={p.id}>{p.name} — {p.feeDisplay}</option>
                            ))}
                          </optgroup>
                          <optgroup label="4. PHÁP LÝ DOANH NGHIỆP & GIẤY PHÉP">
                            {SERVICE_PACKAGES.filter(p => p.category === 'PHAP_LY_DOANH_NGHIEP_PHAT_SINH').map(p => (
                              <option key={p.id} value={p.id}>{p.name} — {p.feeDisplay}</option>
                            ))}
                          </optgroup>
                          <optgroup label="5. KHAI THUẾ CHO THUÊ TÀI SẢN & PHẦN MỀM KẾ TOÁN">
                            {SERVICE_PACKAGES.filter(p => p.category === 'CHO_THUE_TAI_SAN_PHAN_MEM').map(p => (
                              <option key={p.id} value={p.id}>{p.name} — {p.feeDisplay}</option>
                            ))}
                          </optgroup>
                        </select>

                        <div className="mt-2">
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                            Tên hiển thị trên hợp đồng:
                          </label>
                          <input
                            type="text"
                            value={editPackageName}
                            onChange={(e) => setEditPackageName(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold"
                          />
                        </div>
                      </div>

                      {/* Phí Dịch Vụ */}
                      <div className="sm:col-span-3">
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                          Phí Dịch Vụ (VNĐ/tháng) *
                        </label>
                        <input
                          type="number"
                          value={editMonthlyFee}
                          onChange={(e) => setEditMonthlyFee(Number(e.target.value))}
                          step={100000}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-emerald-600 text-xs"
                        />
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          {formatCurrency(editMonthlyFee || 0)}/tháng
                        </span>
                      </div>

                      {/* Tùy Chọn Thuế VAT */}
                      <div className="sm:col-span-3">
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                          Tùy Chọn Thuế VAT *
                        </label>
                        <select
                          value={editVatType}
                          onChange={(e) => setEditVatType(e.target.value as VatType)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-slate-900 dark:text-white text-xs"
                        >
                          <option value="CHUA_VAT">Chưa gồm VAT (+10%)</option>
                          <option value="DA_CO_VAT">Đã có VAT (Đã gồm 10%)</option>
                          <option value="KHONG_VAT">Không VAT (0%)</option>
                        </select>
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          {editVatType === 'CHUA_VAT' && `Xuất HĐ: ${formatCurrency(editMonthlyFee * 1.1)}`}
                          {editVatType === 'DA_CO_VAT' && `Trước thuế: ${formatCurrency(Math.round(editMonthlyFee / 1.1))}`}
                          {editVatType === 'KHONG_VAT' && '0% thuế GTGT'}
                        </span>
                      </div>

                      {/* Chu Kỳ Thu Phí */}
                      <div className="sm:col-span-4">
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                          Chu Kỳ Thu Phí Định Kỳ *
                        </label>
                        <select
                          value={editBillingCycle}
                          onChange={(e) => setEditBillingCycle(e.target.value as BillingCycle)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-slate-900 dark:text-white text-xs"
                        >
                          <option value="HANG_THANG">Hàng Tháng (1 tháng / lần)</option>
                          <option value="HANG_QUY">Hàng Quý (3 tháng / lần)</option>
                          <option value="SAU_THANG">6 Tháng / Lần (Bán niên)</option>
                          <option value="HANG_NAM">Hàng Năm (12 tháng / lần)</option>
                        </select>
                      </div>

                      {/* Ngày Ký / Bắt Đầu Dịch Vụ */}
                      <div className="sm:col-span-4">
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center justify-between">
                          <span>Ngày Ký / Bắt Đầu Dịch Vụ *</span>
                          <span className="text-[10px] text-blue-600 font-normal">Thay đổi tự do</span>
                        </label>
                        <input
                          type="date"
                          value={editServiceStartDate}
                          onChange={(e) => setEditServiceStartDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white text-xs font-bold"
                        />
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          Mốc chu kỳ tính phí: {formatDate(editServiceStartDate)}
                        </span>
                      </div>

                      {/* Ngày Kết Thúc Hợp Đồng */}
                      <div className="sm:col-span-4">
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                          Ngày Kết Thúc / Thời Hạn HĐ
                        </label>
                        <input
                          type="date"
                          value={editContractEndDate}
                          onChange={(e) => setEditContractEndDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white text-xs"
                        />
                        <div className="mt-1 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const d = new Date(editServiceStartDate || CURRENT_SYSTEM_DATE);
                              d.setFullYear(d.getFullYear() + 1);
                              d.setDate(d.getDate() - 1);
                              setEditContractEndDate(d.toISOString().split('T')[0]);
                            }}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-300"
                          >
                            +1 Năm
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const d = new Date(editServiceStartDate || CURRENT_SYSTEM_DATE);
                              d.setMonth(d.getMonth() + 6);
                              d.setDate(d.getDate() - 1);
                              setEditContractEndDate(d.toISOString().split('T')[0]);
                            }}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-300"
                          >
                            +6 Tháng
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Automation Checkbox */}
                    <div className="p-2.5 bg-amber-500/10 dark:bg-amber-950/30 rounded-lg border border-amber-300 dark:border-amber-800/60 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          ⚡ Tự động giao các công việc định kỳ theo gói mới ngay khi Lưu
                        </span>
                      </div>
                      <label className="flex items-center space-x-1.5 cursor-pointer bg-white dark:bg-slate-800 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800/80 shadow-2xs">
                        <input
                          type="checkbox"
                          checked={autoDispatchOnPackageChange}
                          onChange={(e) => setAutoDispatchOnPackageChange(e.target.checked)}
                          className="rounded text-amber-600 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Kích hoạt</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Scope of Work of matched package */}
                {matchedPkg && (
                  <div className="bg-white dark:bg-slate-850 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs space-y-2.5">
                    <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center space-x-1.5 text-blue-700 dark:text-blue-400">
                        <Sparkles className="h-4 w-4" />
                        <span className="text-xs font-bold">{matchedPkg.name}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 rounded-md text-[10px]">
                        Khung phí chuẩn: {matchedPkg.feeRange || matchedPkg.feeDisplay}
                      </span>
                    </div>

                    {matchedPkg.targetCustomerDesc && (
                      <div className="p-2 bg-blue-50/70 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900/40 text-[11px] text-slate-700 dark:text-slate-300">
                        <span className="font-bold text-blue-900 dark:text-blue-200">Khách hàng áp dụng: </span>
                        <span>{matchedPkg.targetCustomerDesc}</span>
                      </div>
                    )}

                    {matchedPkg.modules && matchedPkg.modules.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                        {matchedPkg.modules.map((mod, mIdx) => (
                          <div key={mIdx} className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-md border border-slate-200/80 dark:border-slate-700/60">
                            <div className="font-bold text-blue-800 dark:text-blue-300 mb-1 flex items-center space-x-1 text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                              <span>{mod.name}</span>
                            </div>
                            <ul className="space-y-0.5 pl-1">
                              {mod.tasks.map((task, tIdx) => (
                                <li key={tIdx} className="flex items-start space-x-1 text-[10.5px] text-slate-600 dark:text-slate-300">
                                  <Check className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                                  <span>{task}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                        {matchedPkg.scopeOfWork.map((item, idx) => (
                          <div key={idx} className="flex items-start space-x-1.5 text-slate-700 dark:text-slate-300 text-[11px]">
                            <Check className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Adjust Risk Level */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">Điều Chỉnh Mức Độ Rủi Ro Khách Hàng</div>
                <div className="flex gap-2 flex-wrap">
                  {(['BINH_THUONG', 'TRUNG_BINH', 'CAO', 'NGUY_CO_PHAP_LY'] as CustomerRiskLevel[]).map(risk => (
                    <button
                      key={risk}
                      onClick={() => handleUpdateRisk(risk)}
                      className={`px-3 py-1.5 rounded-lg font-bold border transition-all text-xs ${
                        customer.riskLevel === risk
                          ? `${RISK_LABELS[risk]?.badgeClass} ring-2 ring-blue-500`
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {RISK_LABELS[risk]?.label}
                    </button>
                  ))}
                </div>
              </div>

              {customer.notes && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs">
                  <div className="font-bold mb-1">Ghi chú rủi ro & lịch sử:</div>
                  <p>{customer.notes}</p>
                </div>
              )}
            </div>
            )
          )}

          {/* TAB 4: PAYMENT CYCLE & DEBT */}
          {activeTab === 'PAYMENT_CYCLE_DEBT' && (
            !canViewFinancials ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 mx-auto flex items-center justify-center">
                  <Lock className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Dữ Liệu Công Nợ & Thu Phí Được Bảo Vệ</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Thông tin dư nợ, lịch sử thu phí và chính sách thanh toán thuộc quyền quản lý của <strong>Kế Toán Trưởng</strong>, <strong>Thủ Quỹ</strong> và <strong>Ban Giám Đốc</strong>.
                </p>
              </div>
            ) : (() => {
            const aging = storageService.calculateCustomerDebtAging(customer);
            const cycleCfg = BILLING_CYCLE_LABELS[customer.billingCycle || 'HANG_THANG'];
            const agingCfg = DEBT_AGING_LABELS[aging.agingGroup];

            return (
              <div className="space-y-4">
                {/* 1. Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Chu Kỳ Thu Phí</span>
                    <div className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                      {cycleCfg?.label || 'Hàng tháng'}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Ngày thu: <strong>Mùng {customer.paymentDueDay || 10}</strong> hàng kỳ
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Hạn Mức & Phí Kỳ</span>
                    <div className="font-bold text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                      {formatCurrency(customer.monthlyFee || 0)}/tháng
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Hạn nợ tối đa: <strong>{formatCurrency(customer.creditLimit || 15000000)}</strong>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Dư Nợ Hiện Tại</span>
                    <div className={`font-bold text-sm mt-1 ${customer.debtAmount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {customer.debtAmount > 0 ? formatCurrency(customer.debtAmount) : '0đ (Không nợ)'}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Ân hạn nợ: <strong>{customer.paymentTermDays || 10} ngày</strong>
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl border ${agingCfg?.badgeClass || 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-[10px] font-bold uppercase text-slate-500">Phân Loại Tuổi Nợ</span>
                    <div className="font-bold text-sm mt-1">
                      {agingCfg?.label}
                    </div>
                    <div className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mt-0.5">
                      {aging.overdueDays > 0 ? `Quá hạn ${aging.overdueDays} ngày` : 'Thanh toán đúng hạn'}
                    </div>
                  </div>
                </div>

                {/* 2. Billing Cycle Config Editor */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Settings className="h-4 w-4 text-blue-600" />
                      <span className="font-bold text-slate-900 dark:text-white text-xs">
                        Điều Chỉnh & Thiết Lập Chu Kỳ Thanh Toán
                      </span>
                    </div>
                    {!isEditingPaymentCycle ? (
                      <button
                        onClick={() => {
                          setCycleType(customer.billingCycle || 'HANG_THANG');
                          setCycleDueDay(customer.paymentDueDay || 10);
                          setCycleTermDays(customer.paymentTermDays || 10);
                          setCycleCreditLimit(customer.creditLimit || 15000000);
                          setCyclePaymentMethod(customer.preferredPaymentMethod || 'Chuyển khoản VCB');
                          setCycleDiscount(customer.paymentDiscountPolicy || '');
                          setCycleNotes(customer.paymentNotes || '');
                          setIsEditingPaymentCycle(true);
                        }}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center space-x-1"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span>Sửa Thiết Lập</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsEditingPaymentCycle(false)}
                        className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold"
                      >
                        Hủy
                      </button>
                    )}
                  </div>

                  {isEditingPaymentCycle ? (
                    <form onSubmit={handleSavePaymentCycle} className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Chu Kỳ Thu Phí
                          </label>
                          <select
                            value={cycleType}
                            onChange={(e) => setCycleType(e.target.value as BillingCycle)}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                          >
                            <option value="HANG_THANG">Hàng tháng (Tháng nào thu tháng đó)</option>
                            <option value="HANG_QUY">Hàng quý (3 tháng/lần)</option>
                            <option value="SAU_THANG">6 tháng / Nửa năm</option>
                            <option value="HANG_NAM">Hàng năm (12 tháng/lần)</option>
                            <option value="THEO_VU_VIEC">Theo vụ việc / Hoàn thành hồ sơ</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Ngày Xuất Hóa Đơn / Thu Phí (1 - 31)
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={31}
                            value={cycleDueDay}
                            onChange={(e) => setCycleDueDay(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Thời Gian Cho Phép Nợ (Số ngày)
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={90}
                            value={cycleTermDays}
                            onChange={(e) => setCycleTermDays(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Hạn Mức Nợ Tối Đa (VNĐ)
                          </label>
                          <input
                            type="number"
                            step={500000}
                            value={cycleCreditLimit}
                            onChange={(e) => setCycleCreditLimit(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Phương Thức Thanh Toán Ưu Tiên
                          </label>
                          <input
                            type="text"
                            value={cyclePaymentMethod}
                            onChange={(e) => setCyclePaymentMethod(e.target.value)}
                            placeholder="Ví dụ: Chuyển khoản Vietcombank"
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Chính Sách Chiết Khấu / Ưu Đãi
                          </label>
                          <input
                            type="text"
                            value={cycleDiscount}
                            onChange={(e) => setCycleDiscount(e.target.value)}
                            placeholder="Ví dụ: Giảm 10% nếu trả trước 1 năm"
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                        >
                          Lưu Cập Nhật Chu Kỳ
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Phương thức</span>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{customer.preferredPaymentMethod || 'Chuyển khoản'}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Chiết khấu</span>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{customer.paymentDiscountPolicy || 'Không có'}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Ngày thanh toán gần nhất</span>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{customer.lastPaymentDate ? formatDate(customer.lastPaymentDate) : 'Chưa có'}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Thao tác nhanh</span>
                        <div className="flex gap-1 mt-0.5">
                          <button
                            onClick={() => handleSendReminderFromModal('EMAIL')}
                            className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-semibold text-[10px] hover:bg-blue-100"
                          >
                            Nhắc Email
                          </button>
                          <button
                            onClick={() => handleSendReminderFromModal('ZALO')}
                            className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded font-semibold text-[10px] hover:bg-sky-100"
                          >
                            Nhắc Zalo
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Action: Record Payment Receipt */}
                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                      <Receipt className="h-4 w-4" />
                      <span>Thu Tiền / Ghi Nhận Thanh Toán Phí Dịch Vụ</span>
                    </div>
                    {!isAddingPayment && (
                      <button
                        onClick={() => setIsAddingPayment(true)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center space-x-1"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Tạo Phiếu Thu Phí</span>
                      </button>
                    )}
                  </div>

                  {isAddingPayment && (
                    <form onSubmit={handleRecordPaymentReceipt} className="space-y-3 pt-2 border-t border-emerald-200 dark:border-emerald-800/60">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Số Tiền Thanh Toán (VNĐ)
                          </label>
                          <input
                            type="number"
                            step={100000}
                            value={quickPayAmount}
                            onChange={(e) => setQuickPayAmount(Number(e.target.value))}
                            required
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-emerald-600 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Ngày Nộp Tiền
                          </label>
                          <input
                            type="date"
                            value={quickPayDate}
                            onChange={(e) => setQuickPayDate(e.target.value)}
                            required
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Hình Thức
                          </label>
                          <select
                            value={quickPayMethod}
                            onChange={(e) => setQuickPayMethod(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                          >
                            <option value="Chuyển khoản Vietcombank">Chuyển khoản VCB</option>
                            <option value="Chuyển khoản MBBank">Chuyển khoản MB</option>
                            <option value="Chuyển khoản Techcombank">Chuyển khoản TCB</option>
                            <option value="Tiền mặt tại VP">Tiền mặt tại VP</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Nội Dung / Diễn Giải
                        </label>
                        <input
                          type="text"
                          value={quickPayNotes}
                          onChange={(e) => setQuickPayNotes(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </div>

                      <div className="flex justify-end space-x-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsAddingPayment(false)}
                          className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold"
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                        >
                          Xác Nhận Thu Tiền
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* 4. Payment History Log */}
                {customer.paymentHistory && customer.paymentHistory.length > 0 && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200 font-bold text-xs">
                      <History className="h-4 w-4 text-blue-600" />
                      <span>Lịch Sử Các Lần Thu Phí & Thanh Toán ({customer.paymentHistory.length})</span>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {customer.paymentHistory.map((p, idx) => (
                        <div key={p.id || idx} className="py-2 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                              <span className="text-emerald-600 font-mono">+{formatCurrency(p.amount)}</span>
                              <span className="text-slate-400 font-normal">({p.paymentMethod})</span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Ngày: {formatDate(p.paymentDate)} • Người thu: {p.recordedByName}
                              {p.notes ? ` • ${p.notes}` : ''}
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold">
                            Đã ghi sổ
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })())}

        </div>

        {/* NOTIFICATION TOAST */}
        {notificationMsg && (
          <div className="absolute top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center space-x-2 text-xs font-bold animate-bounce">
            <CheckCircle2 className="h-4 w-4" />
            <span>{notificationMsg}</span>
            <button onClick={() => setNotificationMsg(null)} className="ml-2 text-emerald-200 hover:text-white">&times;</button>
          </div>
        )}

        {/* 1-CLICK CONTRACT RENEWAL MODAL OVERLAY */}
        {isRenewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2 text-blue-600">
                  <RefreshCw className="h-5 w-5" />
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Tái Ký / Gia Hạn Hợp Đồng Dịch Vụ
                  </h3>
                </div>
                <button
                  onClick={() => setIsRenewModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleExecuteContractRenewal} className="space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-xs space-y-1">
                  <div className="font-bold text-blue-900 dark:text-blue-200">{customer.name}</div>
                  <div className="text-slate-600 dark:text-slate-400">MST: {customer.taxCode}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Ngày Bắt Đầu Chu Kỳ Mới
                    </label>
                    <input
                      type="date"
                      value={renewStartDate}
                      onChange={(e) => setRenewStartDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Ngày Hết Hạn Chu Kỳ Mới
                    </label>
                    <input
                      type="date"
                      value={renewEndDate}
                      onChange={(e) => setRenewEndDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Gói Dịch Vụ Áp Dụng
                  </label>
                  <input
                    type="text"
                    value={renewPkg}
                    onChange={(e) => setRenewPkg(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Phí Dịch Vụ Mới (VNĐ/tháng) *
                    </label>
                    <input
                      type="number"
                      value={renewFee}
                      onChange={(e) => setRenewFee(Number(e.target.value))}
                      step={100000}
                      required
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Tùy Chọn Thuế VAT *
                    </label>
                    <select
                      value={renewVatType}
                      onChange={(e) => setRenewVatType(e.target.value as VatType)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200"
                    >
                      <option value="CHUA_VAT">Chưa gồm VAT (+10%)</option>
                      <option value="DA_CO_VAT">Đã có VAT (10%)</option>
                      <option value="KHONG_VAT">Không VAT (0%)</option>
                    </select>
                  </div>
                </div>

                <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-[11px] font-mono text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                  <span>{renewVatType === 'CHUA_VAT' ? 'Tổng HĐ: ' + formatCurrency(renewFee * 1.1) : renewVatType === 'DA_CO_VAT' ? 'Đã gồm VAT: ' + formatCurrency(renewFee) : 'Không chịu thuế VAT: ' + formatCurrency(renewFee)}</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{renewVatType === 'CHUA_VAT' ? '(VAT 10%: +' + formatCurrency(renewFee * 0.1) + ')' : renewVatType === 'DA_CO_VAT' ? '(Trước thuế: ' + formatCurrency(Math.round(renewFee / 1.1)) + ')' : '(0% VAT)'}</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ghi Chú Điều Khoản / Phụ Lục
                  </label>
                  <textarea
                    value={renewNote}
                    onChange={(e) => setRenewNote(e.target.value)}
                    rows={2}
                    placeholder="Ghi chú số phụ lục hợp đồng, ưu đãi, thay đổi điều khoản..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsRenewModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md"
                  >
                    Xác Nhận Tái Ký & Lưu Lịch Sử
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 1-CLICK CKS RENEWAL MODAL OVERLAY */}
        {isCksModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2 text-purple-600">
                  <KeyRound className="h-5 w-5" />
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Gia Hạn Chữ Ký Số (Token CA)
                  </h3>
                </div>
                <button
                  onClick={() => setIsCksModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleExecuteCksRenewal} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nhà Cung Cấp Chứng Thư Số
                  </label>
                  <select
                    value={cksProvider}
                    onChange={(e) => setCksProvider(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold"
                  >
                    <option value="Viettel-CA">Viettel-CA</option>
                    <option value="VNPT-CA">VNPT-CA</option>
                    <option value="FPT-CA">FPT-CA</option>
                    <option value="MISA eSign">MISA eSign</option>
                    <option value="BKAV-CA">BKAV-CA</option>
                    <option value="EasyCA">EasyCA</option>
                    <option value="NC-CA">NC-CA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Thời Hạn Mới Của Token
                  </label>
                  <input
                    type="date"
                    value={cksExpiry}
                    onChange={(e) => setCksExpiry(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCksModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md"
                  >
                    Cập Nhật Hạn Token
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CONTRACT TERMINATION & LIQUIDATION MODAL OVERLAY */}
        {isTerminateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2 text-rose-600">
                  <FileX2 className="h-5 w-5" />
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Chấm Dứt & Thanh Lý Hợp Đồng Dịch Vụ Kế Toán
                  </h3>
                </div>
                <button
                  onClick={() => setIsTerminateModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleExecuteContractTermination} className="space-y-4">
                {/* Enterprise quick summary banner */}
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-xs space-y-1.5 border border-rose-200 dark:border-rose-900">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-950 dark:text-rose-200 text-sm">{customer.name}</span>
                    <span className="font-mono font-bold text-slate-600 dark:text-slate-400">MST: {customer.taxCode}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 pt-1 border-t border-rose-100 dark:border-rose-900/60 text-[11.5px]">
                    <span>Gói dịch vụ: <strong>{customer.servicePackage}</strong> {canViewFinancials ? `(${formatCurrency(customer.monthlyFee || 0)}/tháng)` : ''}</span>
                    <span>Công nợ tồn: {canViewFinancials ? <strong className={customer.debtAmount ? 'text-rose-600 font-bold' : 'text-emerald-600'}>{formatCurrency(customer.debtAmount || 0)}</strong> : <span className="text-slate-400">🔒 Bảo mật</span>}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Ngày Chấm Dứt / Thanh Lý (*)
                    </label>
                    <input
                      type="date"
                      value={terminationDate}
                      onChange={(e) => setTerminationDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Số Biên Bản / Quyết Định
                    </label>
                    <input
                      type="text"
                      value={terminationDecisionNo}
                      onChange={(e) => setTerminationDecisionNo(e.target.value)}
                      placeholder="VD: TLHĐ-2026/01"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Căn Cứ / Lý Do Chấm Dứt Hợp Đồng (*)
                  </label>
                  <select
                    value={terminationReason}
                    onChange={(e) => setTerminationReason(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium"
                  >
                    {CUSTOMER_CONTRACT_TERMINATION_REASONS.map((r, idx) => (
                      <option key={idx} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {terminationReason === 'Lý do khác theo biên bản thanh lý hợp đồng dịch vụ' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Chi Tiết Lý Do Khác
                    </label>
                    <input
                      type="text"
                      value={customTerminationReason}
                      onChange={(e) => setCustomTerminationReason(e.target.value)}
                      placeholder="Nhập cụ thể lý do chấm dứt..."
                      required
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Số Tiền Quyết Toán / Chốt Công Nợ Cuối Cùng (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={terminationSettlementAmount}
                    onChange={(e) => setTerminationSettlementAmount(Number(e.target.value))}
                    step={100000}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-rose-600"
                  />
                  <div className="text-[11px] text-slate-500 mt-1">
                    Số tiền: <strong>{formatCurrency(terminationSettlementAmount)}</strong> (Mặc định bằng số nợ tồn đọng của khách hàng)
                  </div>
                </div>

                {/* Handover Checklist */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Thủ Tục Bàn Giao & Xử Lý Dữ Liệu
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={returnToken}
                        onChange={(e) => setReturnToken(e.target.checked)}
                        className="rounded text-rose-600 focus:ring-rose-500"
                      />
                      <span>Đã bàn giao lại thiết bị Chữ ký số (Token CKS) cho đại diện khách hàng</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={finalizeDocs}
                        onChange={(e) => setFinalizeDocs(e.target.checked)}
                        className="rounded text-rose-600 focus:ring-rose-500"
                      />
                      <span>Đã hoàn tất in ấn, đóng quyển sổ sách kế toán & bàn giao chứng từ gốc</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settleDebt}
                        onChange={(e) => setSettleDebt(e.target.checked)}
                        className="rounded text-rose-600 focus:ring-rose-500"
                      />
                      <span>Đã lập biên bản đối chiếu và chốt số dư công nợ dịch vụ</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={closeActiveTasks}
                        onChange={(e) => setCloseActiveTasks(e.target.checked)}
                        className="rounded text-rose-600 focus:ring-rose-500"
                      />
                      <span>Tự động hủy các công việc thuế định kỳ đang mở của khách hàng này</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ghi Chú Bàn Giao & Điều Khoản Thanh Lý
                  </label>
                  <textarea
                    value={terminationHandoverNotes}
                    onChange={(e) => setTerminationHandoverNotes(e.target.value)}
                    rows={2}
                    placeholder="Ghi chú chi tiết thành phần hồ sơ bàn giao, người nhận bàn giao, cam kết trách nhiệm..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsTerminateModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-1.5"
                  >
                    <FileX2 className="h-4 w-4" />
                    <span>Xác Nhận Chấm Dứt Hợp Đồng</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Auto Dispatch Periodic Tasks Modal */}
        {isAutoDispatchModalOpen && (
          <AutoDispatchPeriodicModal
            isOpen={isAutoDispatchModalOpen}
            onClose={() => setIsAutoDispatchModalOpen(false)}
            customers={[customer]}
            templates={storageService.getTemplates()}
            currentUser={currentUser || users[0]}
            preselectedCustomerId={customer.id}
            preselectedPackageId={customer.servicePackage}
            onSuccess={(res) => {
              setNotificationMsg(`Đã tự động khởi tạo ${res.totalCreated} công việc định kỳ theo gói dịch vụ cho ${customer.name}!`);
            }}
          />
        )}

        {/* Reassign Accountant & Reviewer Modal */}
        {isReassignModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      Điều Chuyển Kế Toán & Kiểm Soát Viên
                    </h3>
                    <p className="text-xs text-slate-500">
                      Khách hàng: {customer.name} (MST: {customer.taxCode})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReassignModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleExecuteReassign} className="space-y-3.5">
                <div className="p-3 bg-blue-50/60 dark:bg-slate-800/60 border border-blue-100 dark:border-slate-700/60 rounded-xl text-xs space-y-1">
                  <div className="font-bold text-blue-900 dark:text-blue-300 flex items-center space-x-1.5">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <span>Tự động liên kết tải trọng & Nhân sự SOP</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    Hệ thống sẽ tự động cập nhật tải trọng của nhân sự tiếp nhận và ghi nhận nhật ký điều chuyển (Audit Log) theo chuẩn ISO.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kế Toán Viên Phụ Trách Mới <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={reassignNewStaffId}
                    onChange={(e) => setReassignNewStaffId(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold"
                    required
                  >
                    {allActiveUsers.map(u => {
                      const summary = allWorkloadSummaries.find(w => w.userId === u.id);
                      const count = summary?.assignedCustomersCount ?? 0;
                      const cap = summary?.customerCapacity ?? 7;
                      const isAvail = count === 0 || count < cap * 0.7;
                      const isOver = count > cap;
                      const statusTxt = isOver ? `[${count}/${cap} KH - Quá tải]` : isAvail ? `[${count}/${cap} KH - Còn trống]` : `[${count}/${cap} KH - Tối ưu]`;
                      return (
                        <option key={u.id} value={u.id}>
                          {u.name} • {statusTxt} ({u.position || u.role})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kiểm Soát Viên Phụ Trách (Trưởng phòng / KTT / BGĐ) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={reassignNewReviewerId}
                    onChange={(e) => setReassignNewReviewerId(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold"
                    required
                  >
                    {allActiveUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.position || u.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-1">
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reassignActiveTasks}
                      onChange={(e) => setReassignActiveTasks(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span>Tự động chuyển giao toàn bộ công việc (Tasks) đang mở sang Kế toán mới</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ghi Chú Bàn Giao / Lý Do Điều Chuyển
                  </label>
                  <textarea
                    value={reassignHandoverNote}
                    onChange={(e) => setReassignHandoverNote(e.target.value)}
                    rows={2}
                    placeholder="Lý do điều chuyển, tình trạng chứng từ bàn giao, lưu ý đặc thù..."
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsReassignModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Check className="h-4 w-4" />
                    <span>Lưu & Đồng Bộ Ngay</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { Customer, ChecklistTemplate, User, AutoDispatchOptions, AutoDispatchResult } from '../../types';
import { storageService } from '../../services/storageService';
import { 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Calendar, 
  Layers, 
  UserCheck, 
  ShieldCheck, 
  AlertTriangle, 
  X, 
  Play, 
  ChevronRight, 
  CheckSquare, 
  FileText, 
  RotateCcw,
  Zap,
  Info
} from 'lucide-react';
import { SERVICE_PACKAGES } from '../../data/servicePackages';

interface AutoDispatchPeriodicModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  templates: ChecklistTemplate[];
  currentUser: User;
  onSuccess: (result: AutoDispatchResult) => void;
  preselectedCustomerId?: string;
  preselectedPackageId?: string;
}

export const AutoDispatchPeriodicModal: React.FC<AutoDispatchPeriodicModalProps> = ({
  isOpen,
  onClose,
  customers,
  templates,
  currentUser,
  onSuccess,
  preselectedCustomerId,
  preselectedPackageId,
}) => {
  // Form configuration state
  const [cycleType, setCycleType] = useState<'THANG' | 'QUY' | 'NAM' | 'ALL'>('THANG');
  const [periodMonth, setPeriodMonth] = useState<number>(8); // August
  const [periodYear, setPeriodYear] = useState<number>(2026);
  const [periodQuarter, setPeriodQuarter] = useState<number>(3); // Q3
  const [targetPackage, setTargetPackage] = useState<string>(preselectedPackageId || 'ALL');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(preselectedCustomerId || 'ALL');
  const [overwriteExisting, setOverwriteExisting] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [resultData, setResultData] = useState<AutoDispatchResult | null>(null);

  // Template selections
  const [selectedTemplateCodes, setSelectedTemplateCodes] = useState<string[]>([
    'TMPL-GTGT-THANG',
    'TMPL-TNCN-THANG',
    'TMPL-KETOAN-KHOASO-THANG',
    'TMPL-BHXH-TANG-GIAM',
    'TMPL-TNDN-QUY',
    'TMPL-BCTC-NAM',
  ]);

  if (!isOpen) return null;

  // Filter eligible customers with packages
  const eligibleCustomers = useMemo(() => {
    return customers.filter(c => {
      if (c.contractStatus === 'DA_HUY') return false;
      if (selectedCustomerId !== 'ALL' && c.id !== selectedCustomerId) return false;
      if (targetPackage !== 'ALL') {
        const pkg = (c.servicePackage || '').toLowerCase();
        const target = targetPackage.toLowerCase();
        const match = pkg.includes(target) || 
          (target === 'pkg-a' && pkg.includes('gói a')) ||
          (target === 'pkg-b' && pkg.includes('gói b')) ||
          (target === 'pkg-c' && pkg.includes('gói c')) ||
          (target === 'pkg-d' && pkg.includes('gói d'));
        if (!match) return false;
      }
      return true;
    });
  }, [customers, selectedCustomerId, targetPackage]);

  // Derived period labels and tax law deadlines
  const monthStr = `Tháng ${periodMonth.toString().padStart(2, '0')}/${periodYear}`;
  const quarterStr = `Quý ${periodQuarter}/${periodYear}`;
  const yearStr = `Năm ${periodYear}`;

  let nextMonth = periodMonth + 1;
  let nextYear = periodYear;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }
  const monthlyTaxDueFormatted = `20/${nextMonth.toString().padStart(2, '0')}/${nextYear}`;
  const monthlyClosingDueFormatted = `25/${nextMonth.toString().padStart(2, '0')}/${nextYear}`;
  const monthlyPayrollDueFormatted = `15/${nextMonth.toString().padStart(2, '0')}/${nextYear}`;

  let quarterlyTaxDueFormatted = `30/04/${periodYear}`;
  if (periodQuarter === 2) quarterlyTaxDueFormatted = `31/07/${periodYear}`;
  else if (periodQuarter === 3) quarterlyTaxDueFormatted = `31/10/${periodYear}`;
  else if (periodQuarter === 4) quarterlyTaxDueFormatted = `31/01/${periodYear + 1}`;

  const annualBCTCDueFormatted = `31/03/${periodYear + 1}`;

  // Estimate tasks count per customer
  const estimatedTasksPerCustomer = useMemo(() => {
    let count = 0;
    if (cycleType === 'THANG' || cycleType === 'ALL') {
      if (selectedTemplateCodes.includes('TMPL-GTGT-THANG')) count++;
      if (selectedTemplateCodes.includes('TMPL-TNCN-THANG')) count++;
      if (selectedTemplateCodes.includes('TMPL-KETOAN-KHOASO-THANG')) count++;
      if (selectedTemplateCodes.includes('TMPL-BHXH-TANG-GIAM')) count++;
    }
    if (cycleType === 'QUY' || cycleType === 'ALL') {
      if (selectedTemplateCodes.includes('TMPL-TNDN-QUY')) count++;
    }
    if (cycleType === 'NAM' || cycleType === 'ALL') {
      if (selectedTemplateCodes.includes('TMPL-BCTC-NAM')) count++;
    }
    return count;
  }, [cycleType, selectedTemplateCodes]);

  const totalEstimatedTasks = eligibleCustomers.length * estimatedTasksPerCustomer;

  const handleToggleTemplate = (code: string) => {
    if (selectedTemplateCodes.includes(code)) {
      setSelectedTemplateCodes(selectedTemplateCodes.filter(c => c !== code));
    } else {
      setSelectedTemplateCodes([...selectedTemplateCodes, code]);
    }
  };

  const handleExecuteAutoDispatch = () => {
    setIsProcessing(true);
    try {
      const selectedTemplateObjs = templates.filter(t => selectedTemplateCodes.includes(t.code));
      const selectedTemplateIds = selectedTemplateObjs.map(t => t.id);

      const options: AutoDispatchOptions = {
        periodMonth,
        periodYear,
        periodQuarter,
        cycleType,
        targetPackage: targetPackage === 'ALL' ? undefined : targetPackage,
        customerId: selectedCustomerId === 'ALL' ? undefined : selectedCustomerId,
        overwriteExisting,
        selectedTemplateIds,
        actor: currentUser,
      };

      const result = storageService.autoDispatchPeriodicTasksForPackageCustomers(options);
      setResultData(result);
      onSuccess(result);
    } catch (err) {
      console.error('Error during auto dispatch', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        id="auto-dispatch-modal"
        className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-white/15 backdrop-blur-xs">
              <Zap className="h-5 w-5 text-amber-300 fill-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>Phát Sinh Công Việc Định Kỳ Theo GÓI Dịch Vụ</span>
                <span className="text-[10px] uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full font-mono">
                  Đại lý thuế & Kế toán
                </span>
              </h2>
              <p className="text-xs text-blue-100 mt-0.5">
                Tự động phát sinh và phân công toàn bộ nghiệp vụ Thuế, Kế toán, BHXH và BCTC theo thời gian quy định
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {resultData ? (
            /* Result Summary View */
            <div className="space-y-5">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-start space-x-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                    Đã Phát Sinh Công Việc Định Kỳ Thành Công!
                  </h3>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">
                    {resultData.message}
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Công việc đã tạo mới</div>
                  <div className="text-2xl font-black text-blue-700 dark:text-blue-300 font-mono mt-1">
                    {resultData.totalCreated}
                  </div>
                </div>
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
                  <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Bỏ qua (đã có sẵn)</div>
                  <div className="text-2xl font-black text-amber-700 dark:text-amber-300 font-mono mt-1">
                    {resultData.totalSkipped}
                  </div>
                </div>
                <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800">
                  <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">Doanh nghiệp đã lập lịch</div>
                  <div className="text-2xl font-black text-indigo-700 dark:text-indigo-300 font-mono mt-1">
                    {resultData.dispatchedCustomersCount}
                  </div>
                </div>
              </div>

              {/* Breakdown by customer */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Chi Tiết Phân Công Từng Doanh Nghiệp ({resultData.summaryByCustomer.length})
                </h4>
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {resultData.summaryByCustomer.map((cust) => (
                    <div
                      key={cust.customerId}
                      className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {cust.customerName}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            ({cust.customerTaxCode})
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded font-semibold">
                            {cust.package}
                          </span>
                        </div>
                      </div>

                      {/* Revenue and Statutory Rule Indicator */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px] bg-slate-100 dark:bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-600 dark:text-slate-400">
                          Doanh thu: <strong className="text-slate-800 dark:text-slate-200">{cust.annualRevenue ? `${(cust.annualRevenue / 1000000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tỷ VNĐ/năm` : 'Chưa cập nhật'}</strong>
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                          cust.taxDeclarationCycle === 'THANG'
                            ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300'
                            : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                        }`}>
                          {cust.taxDeclarationCycle === 'THANG' ? '⚡ Thuế >50 tỷ: Khai THÁNG' : '✓ Thuế ≤50 tỷ: Khai QUÝ'}
                        </span>
                        <div className="ml-auto flex items-center space-x-2 text-[10px]">
                          <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                            📋 Kế toán: <strong>{cust.accountingTasksCount || 0} việc (tháng)</strong>
                          </span>
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">
                            ⚖️ Thuế: <strong>{cust.taxFilingTasksCount || 0} việc</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200 dark:border-slate-700 pt-2">
                        <div className="flex items-center space-x-1.5">
                          <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                          <span>Kế toán: <strong className="text-slate-700 dark:text-slate-300">{cust.assigneeName}</strong></span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                          <span>Kiểm soát: <strong className="text-slate-700 dark:text-slate-300">{cust.reviewerName}</strong></span>
                        </div>
                      </div>

                      {cust.tasksCreated.length > 0 && (
                        <div className="space-y-1 pt-1">
                          {cust.tasksCreated.map(t => (
                            <div key={t.id} className="text-xs flex items-center justify-between bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                              <span className="text-slate-800 dark:text-slate-200 font-medium truncate mr-2">
                                • {t.title}
                              </span>
                              <span className="text-[10px] text-red-600 dark:text-red-400 font-mono font-bold shrink-0">
                                Hạn nộp: {t.dueDate}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {cust.tasksSkipped.length > 0 && (
                        <div className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/30 p-2 rounded-lg">
                          ⚠️ Bỏ qua {cust.tasksSkipped.length} công việc do đã tồn tại trong kỳ.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Setup Parameters View */
            <div className="space-y-5">
              {/* Step 1: Period Selection */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span>1. Chọn Kỳ Giao Việc & Hạn Nộp Pháp Lý</span>
                  </h3>
                  <div className="flex items-center space-x-1">
                    {(['THANG', 'QUY', 'NAM', 'ALL'] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setCycleType(type)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          cycleType === type
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {type === 'THANG' ? 'Hàng Tháng' : type === 'QUY' ? 'Hàng Quý' : type === 'NAM' ? 'Năm' : 'Toàn Bộ'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Tháng kê khai
                    </label>
                    <select
                      value={periodMonth}
                      onChange={(e) => setPeriodMonth(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <option key={m} value={m}>Tháng {m.toString().padStart(2, '0')}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Quý kê khai
                    </label>
                    <select
                      value={periodQuarter}
                      onChange={(e) => setPeriodQuarter(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                    >
                      <option value={1}>Quý 1 (T1-T3)</option>
                      <option value={2}>Quý 2 (T4-T6)</option>
                      <option value={3}>Quý 3 (T7-T9)</option>
                      <option value={4}>Quý 4 (T10-T12)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Năm tài chính
                    </label>
                    <select
                      value={periodYear}
                      onChange={(e) => setPeriodYear(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                    >
                      <option value={2025}>Năm 2025</option>
                      <option value={2026}>Năm 2026</option>
                      <option value={2027}>Năm 2027</option>
                    </select>
                  </div>
                </div>

                {/* Statutory Tax Deadlines Callout */}
                <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-900 dark:text-blue-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>Hạn nộp luật định sẽ tự động gắn cho các công việc:</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                    <div>• GTGT/TNCN Tháng: <strong className="text-red-600 dark:text-red-400">{monthlyTaxDueFormatted}</strong></div>
                    <div>• Lương & BHXH: <strong>{monthlyPayrollDueFormatted}</strong></div>
                    <div>• TNDN Quý: <strong className="text-red-600 dark:text-red-400">{quarterlyTaxDueFormatted}</strong></div>
                    <div>• BCTC Năm: <strong className="text-red-600 dark:text-red-400">{annualBCTCDueFormatted}</strong></div>
                  </div>
                </div>
              </div>

              {/* Step 2: Target Service Package & Customers */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <span>2. Đối Tượng Doanh Nghiệp & Gói Dịch Vụ Áp Dụng</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Phạm vi Gói dịch vụ
                    </label>
                    <select
                      value={targetPackage}
                      onChange={(e) => setTargetPackage(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                    >
                      <option value="ALL">Tất cả khách hàng dùng Gói dịch vụ ({customers.length} DN)</option>
                      <option value="PKG-A">GÓI A – CƠ BẢN (Đại lý thuế & Kế toán trọn gói)</option>
                      <option value="PKG-B">GÓI B – TRUNG BÌNH (Đại lý thuế & Kế toán trọn gói)</option>
                      <option value="PKG-C">GÓI C – PHỨC TẠP (Đại lý thuế & Kế toán trọn gói)</option>
                      <option value="PKG-D">GÓI D – ĐẶC BIỆT & HOÀN THUẾ</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Chỉ định doanh nghiệp (Tùy chọn)
                    </label>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                    >
                      <option value="ALL">Tất cả {eligibleCustomers.length} doanh nghiệp phù hợp</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.code} - {c.name} ({c.servicePackage})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Danh Sách Khách Hàng & Phân Công Tự Động 100% */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Đối Soát Phân Công Nhân Sự Tự Động 100% ({eligibleCustomers.length} Khách hàng)</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold">
                      ✓ Đảm bảo 100% chính xác từng khách hàng
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                    {eligibleCustomers.map((cust) => {
                      const isOver50B = (cust.annualRevenue || 0) > 50000000000;
                      const staffName = cust.assignedStaffName || 'Lê Hoàng Nam';
                      const reviewerName = cust.reviewerStaffName || 'Trần Thị Mai';

                      return (
                        <div key={cust.id} className="p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {cust.name}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono shrink-0">
                                ({cust.taxCode})
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                              <span className="truncate max-w-[200px] text-indigo-600 dark:text-indigo-400 font-medium">
                                {cust.servicePackage}
                              </span>
                              <span>•</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                isOver50B
                                  ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              }`}>
                                {isOver50B ? 'Khai Thuế THÁNG (>50 tỷ)' : 'Khai Thuế QUÝ (≤50 tỷ)'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0 text-xs">
                            <div className="px-2 py-1 bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/60 rounded-lg text-left">
                              <div className="text-[9px] text-blue-600 dark:text-blue-400 font-medium">Chuyên viên phụ trách:</div>
                              <div className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1">
                                <UserCheck className="h-3 w-3 text-blue-600" />
                                <span>{staffName}</span>
                              </div>
                            </div>
                            <div className="px-2 py-1 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/60 rounded-lg text-left">
                              <div className="text-[9px] text-amber-600 dark:text-amber-400 font-medium">Soát xét / KTT:</div>
                              <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3 text-amber-600" />
                                <span>{reviewerName}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Step 3: Quy trình mẫu định kỳ theo 2 phân nhánh công việc */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Layers className="h-4 w-4 text-blue-600" />
                    <span>3. Phân Bổ Danh Mục Quy Trình Theo Bản Chất & Luật Thuế</span>
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Tách bạch Kế toán thường xuyên vs Thuế theo Doanh thu
                  </span>
                </div>

                {/* Nhóm 1: Nghiệp vụ Kế toán & Hóa đơn Chứng từ - Thường xuyên hàng tháng */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 uppercase">
                      Phân nhánh 1: Kế Toán & Hóa Đơn Thường Xuyên
                    </span>
                    <span className="text-[11px] text-indigo-600 dark:text-indigo-300 font-medium">
                      (Thực hiện HÀNG THÁNG cho 100% Khách hàng)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      {
                        code: 'TMPL-KETOAN-KHOASO-THANG',
                        title: 'Hạch toán Kế toán, Đối chiếu Ngân hàng & Khóa sổ',
                        sub: 'Khớp sổ phụ TK 112, công nợ 131/331, khấu hao 214, phân bổ 242, CĐTK, soát xét HĐ ≥ 5tr có UNC',
                        cycle: 'Hàng tháng',
                      },
                      {
                        code: 'TMPL-BHXH-TANG-GIAM',
                        title: 'Lập Bảng Lương & Hồ sơ BHXH điện tử',
                        sub: 'Chốt công, tính lương, đóng BHXH/BHYT/BHTN, báo tăng giảm lao động thường xuyên',
                        cycle: 'Hàng tháng',
                      },
                    ].map((item) => {
                      const isSelected = selectedTemplateCodes.includes(item.code);
                      return (
                        <div
                          key={item.code}
                          onClick={() => handleToggleTemplate(item.code)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start space-x-2.5 ${
                            isSelected
                              ? 'bg-white dark:bg-slate-900 border-indigo-500 dark:border-indigo-600 shadow-xs ring-1 ring-indigo-400'
                              : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-60'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="mt-0.5 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                {item.title}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold">
                                {item.cycle}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                              {item.sub}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Nhóm 2: Kê khai & Quyết toán Thuế theo Luật định */}
                <div className="space-y-2 pt-1 border-t border-slate-200/80 dark:border-slate-700/80">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 uppercase">
                      Phân nhánh 2: Kê Khai Thuế Theo Luật Định
                    </span>
                    <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                      (Phân bổ theo Doanh thu: &gt; 50 tỷ khai Tháng | ≤ 50 tỷ khai Quý)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      {
                        code: 'TMPL-GTGT-THANG',
                        title: 'Kê khai thuế GTGT (01/GTGT)',
                        sub: 'Tự động phân bổ: >50 tỷ giao theo Tháng (hạn 20); ≤50 tỷ & HKD giao theo Quý (hạn 30/31)',
                        cycle: '>50T: Tháng | ≤50T: Quý',
                      },
                      {
                        code: 'TMPL-TNCN-THANG',
                        title: 'Kê khai thuế TNCN (05/KK-TNCN)',
                        sub: 'Tự động phân bổ: >50 tỷ giao theo Tháng (hạn 20); ≤50 tỷ & HKD giao theo Quý (hạn 30/31)',
                        cycle: '>50T: Tháng | ≤50T: Quý',
                      },
                      {
                        code: 'TMPL-TNDN-QUY',
                        title: 'Tạm tính Thuế TNDN Quý & Kế hoạch thuế',
                        sub: 'Bóc tách chi phí B4 không UNC ≥ 5 triệu, tạm nộp tối thiểu 80% năm cho toàn bộ DN',
                        cycle: 'Hàng quý',
                      },
                      {
                        code: 'TMPL-BCTC-NAM',
                        title: 'Báo Cáo Tài Chính & Quyết Toán Thuế Năm',
                        sub: 'BCTC TT200/133, QTT TNDN (03/TNDN), QTT TNCN (05/QTT-TNCN), hạn nộp 31/03 năm sau',
                        cycle: 'Hàng năm',
                      },
                    ].map((item) => {
                      const isSelected = selectedTemplateCodes.includes(item.code);
                      return (
                        <div
                          key={item.code}
                          onClick={() => handleToggleTemplate(item.code)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start space-x-2.5 ${
                            isSelected
                              ? 'bg-white dark:bg-slate-900 border-amber-500 dark:border-amber-600 shadow-xs ring-1 ring-amber-400'
                              : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-60'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="mt-0.5 h-4 w-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                {item.title}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold">
                                {item.cycle}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                              {item.sub}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Overwrite option */}
                <div className="pt-2 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="overwrite-option"
                    checked={overwriteExisting}
                    onChange={(e) => setOverwriteExisting(e.target.checked)}
                    className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="overwrite-option" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    Ghi đè nếu công việc cùng kỳ đã tồn tại (Mặc định: Tự động bỏ qua công việc đã có để chống trùng lặp)
                  </label>
                </div>
              </div>

              {/* Preview summary banner */}
              <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <span>Dự kiến tự động giao: <strong>{totalEstimatedTasks} công việc</strong> cho <strong>{eligibleCustomers.length} doanh nghiệp</strong></span>
                  </div>
                  <div className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">
                    Kỳ: <strong>{monthStr}</strong> • Quý: <strong>{quarterStr}</strong> • Tự động gắn Kế toán viên & Kế toán trưởng
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
          {resultData ? (
            <div className="w-full flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setResultData(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Giao Thêm Kỳ Khác</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Hoàn Thành & Xem Bảng Công Việc</span>
              </button>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 rounded-xl text-xs font-bold"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isProcessing || eligibleCustomers.length === 0}
                onClick={handleExecuteAutoDispatch}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center space-x-2 transition-all ${
                  isProcessing || eligibleCustomers.length === 0
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25 cursor-pointer'
                }`}
              >
                {isProcessing ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang Tự Động Phân Công...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 text-amber-300 fill-amber-300" />
                    <span>⚡ Phát Sinh Công Việc Định Kỳ ({totalEstimatedTasks} việc)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

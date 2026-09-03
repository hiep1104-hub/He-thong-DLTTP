import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  FileText, 
  Receipt, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Phone, 
  Mail, 
  Download, 
  Send, 
  ShieldCheck, 
  FileCheck, 
  ExternalLink,
  HelpCircle,
  Sparkles,
  Calendar,
  Layers,
  FileSpreadsheet,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import { Customer, CustomerPortalData, CustomerSupportRequest, Task } from '../../types';
import { storageService } from '../../services/storageService';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { BrandLogo } from '../common/BrandLogo';

interface CustomerPortalViewProps {
  customers?: Customer[];
  initialTaxCode?: string;
  onSelectCustomer?: (customer: Customer) => void;
  onSelectTask?: (task: Task) => void;
}

export const CustomerPortalView: React.FC<CustomerPortalViewProps> = ({
  customers: propCustomers,
  initialTaxCode = '',
  onSelectCustomer,
  onSelectTask,
}) => {
  const allCustomers = propCustomers || storageService.getCustomers();
  const [searchTaxCode, setSearchTaxCode] = useState(initialTaxCode);
  const [portalData, setPortalData] = useState<CustomerPortalData | null>(() => 
    initialTaxCode ? storageService.getCustomerPortalData(initialTaxCode) : null
  );
  const [activeSubTab, setActiveSubTab] = useState<'FILINGS' | 'PAYMENT_SLIPS' | 'CONTRACT_DEBT' | 'SUPPORT'>('FILINGS');
  
  // Support request form state
  const [supportCategory, setSupportCategory] = useState<'TAI_LIEU' | 'GIAI_TRINH_THUE' | 'HOA_DON' | 'HOI_DAP' | 'YEU_CAU_KHAC'>('HOA_DON');
  const [supportSenderName, setSupportSenderName] = useState('');
  const [supportSenderPhone, setSupportSenderPhone] = useState('');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportContent, setSupportContent] = useState('');
  const [supportSuccess, setSupportSuccess] = useState(false);
  const [isCustomerSelectorOpen, setIsCustomerSelectorOpen] = useState(false);

  useEffect(() => {
    if (initialTaxCode && initialTaxCode !== searchTaxCode) {
      setSearchTaxCode(initialTaxCode);
      const data = storageService.getCustomerPortalData(initialTaxCode);
      setPortalData(data);
    }
  }, [initialTaxCode]);

  // Search execution
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchTaxCode.trim()) return;
    const data = storageService.getCustomerPortalData(searchTaxCode.trim());
    setPortalData(data);
  };

  const handleSelectCustomerItem = (cust: Customer) => {
    setSearchTaxCode(cust.taxCode);
    const data = storageService.getCustomerPortalData(cust.taxCode);
    setPortalData(data);
    setIsCustomerSelectorOpen(false);
  };

  const handleRefresh = () => {
    if (searchTaxCode.trim()) {
      const data = storageService.getCustomerPortalData(searchTaxCode.trim());
      setPortalData(data);
    }
  };

  const handleSendSupport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalData || !supportSubject.trim() || !supportContent.trim()) return;

    storageService.addSupportRequest({
      customerId: portalData.customer.id,
      customerName: portalData.customer.name,
      taxCode: portalData.customer.taxCode,
      senderName: supportSenderName.trim() || portalData.customer.contactPerson || 'Đại diện Doanh nghiệp',
      senderPhone: supportSenderPhone.trim() || portalData.customer.phone || '',
      senderEmail: portalData.customer.email || '',
      category: supportCategory,
      subject: supportSubject.trim(),
      content: supportContent.trim(),
    });

    setSupportSuccess(true);
    setSupportSubject('');
    setSupportContent('');
    setTimeout(() => setSupportSuccess(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Search Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-6 sm:p-8 rounded-2xl border border-blue-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <BrandLogo size="lg" textColor="white" />
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleRefresh}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
                title="Đồng bộ lại dữ liệu mới nhất"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Đồng bộ</span>
              </button>
              <span className="px-2.5 py-1 bg-blue-500/20 border border-blue-400/30 rounded-lg text-blue-300 text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Cổng Tra Cứu Khách Hàng 24/7</span>
              </span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Tra Cứu Tờ Khai, Giấy Nộp Tiền & Tiến Độ Thuế
          </h1>
          <p className="text-xs sm:text-sm text-blue-200/80 mt-2 leading-relaxed">
            Dành cho Chủ Doanh nghiệp & Kế toán nội bộ tự giám sát trạng thái nộp tờ khai Tổng cục Thuế, biên nhận eTax, tình trạng chứng từ Kho bạc Nhà nước và yêu cầu nghiệp vụ 24/7.
          </p>

          {/* Quick Search & Select Form */}
          <form onSubmit={handleSearch} className="mt-6 flex flex-col sm:flex-row gap-2 max-w-xl">
            <div className="relative flex-1">
              <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Nhập Mã số thuế hoặc Tên doanh nghiệp..."
                value={searchTaxCode}
                onChange={e => setSearchTaxCode(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 dark:bg-slate-900/60 border border-white/20 rounded-xl text-white placeholder-blue-200/50 text-xs sm:text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-400 backdrop-blur-md"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
              >
                <Search className="h-4 w-4" />
                <span>Tra Cứu</span>
              </button>

              {/* Quick Select from all system customers */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCustomerSelectorOpen(!isCustomerSelectorOpen)}
                  className="px-3 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-semibold transition-all flex items-center space-x-1 shrink-0 cursor-pointer"
                  title="Chọn nhanh từ danh sách khách hàng"
                >
                  <span className="hidden sm:inline">Chọn nhanh</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {isCustomerSelectorOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 max-h-72 overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-1.5 divide-y divide-slate-800">
                    <div className="px-2 py-1 text-[11px] font-bold text-slate-400">
                      Danh sách khách hàng ({allCustomers.length})
                    </div>
                    {allCustomers.map(cust => (
                      <button
                        key={cust.id}
                        type="button"
                        onClick={() => handleSelectCustomerItem(cust)}
                        className="w-full text-left p-2 hover:bg-blue-600/30 rounded-lg transition-colors flex flex-col cursor-pointer"
                      >
                        <span className="text-xs font-bold text-white truncate">{cust.name}</span>
                        <span className="text-[11px] text-blue-300 font-mono">MST: {cust.taxCode}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </form>

          {/* Quick Preset Tags */}
          <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-blue-200/70">
            <span>Gợi ý nhanh:</span>
            {allCustomers.slice(0, 3).map((c, idx) => (
              <React.Fragment key={c.id}>
                {idx > 0 && <span>•</span>}
                <button
                  type="button"
                  onClick={() => handleSelectCustomerItem(c)}
                  className="underline hover:text-white cursor-pointer font-mono"
                >
                  {c.taxCode} ({c.shortName || c.name.split(' ').slice(0, 3).join(' ')})
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {!portalData ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800">
          <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Không tìm thấy thông tin doanh nghiệp</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Vui lòng kiểm tra lại Mã số thuế hoặc liên hệ trực tiếp với Đại Lý Thuế Thành Phố để được hỗ trợ cấp mã truy cập.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Customer Profile & Dedicated Staff Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Customer Info */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
                  <Building2 className="h-4 w-4" />
                  <span>Hồ Sơ Khách Hàng Doanh Nghiệp</span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                  {portalData.customer.name}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 mt-3 text-xs text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="text-slate-400">Mã số thuế:</span> <span className="font-mono font-bold text-slate-900 dark:text-white">{portalData.customer.taxCode}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Đại diện pháp luật:</span> <span className="font-semibold text-slate-900 dark:text-white">{portalData.customer.contactPerson || 'Ông/Bà Giám Đốc'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Cơ quan thuế quản lý:</span> <span className="font-semibold text-slate-900 dark:text-white">{portalData.customer.taxDepartment || 'Chi cục Thuế Quận'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Gói dịch vụ:</span> <span className="font-semibold text-blue-600 dark:text-blue-400">{portalData.serviceContract.servicePackage}</span>
                  </div>
                </div>
              </div>

              {/* Status Chips */}
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 font-semibold flex items-center space-x-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Hợp đồng dịch vụ: Có hiệu lực ({formatDate(portalData.serviceContract.endDate)})</span>
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-medium">
                  HĐĐT: Còn {portalData.eInvoiceStatus.remaining} / {portalData.eInvoiceStatus.totalQuota} số
                </span>
              </div>
            </div>

            {/* Dedicated Accountant In Charge Card */}
            <div className="bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/30 dark:from-slate-800 dark:to-slate-900 p-6 rounded-2xl border border-indigo-200/80 dark:border-slate-700 shadow-xs flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Chuyên Viên Thuế Phụ Trách Trực Tiếp</span>
                </div>

                <div className="flex items-center space-x-3 mt-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-base shadow-sm">
                    {portalData.assignedStaff.name.split(' ').map(n => n[0]).slice(-2).join('')}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {portalData.assignedStaff.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {portalData.assignedStaff.position}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mt-4 text-xs">
                  <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                    <Phone className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    <span className="font-mono">{portalData.assignedStaff.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                    <Mail className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    <span>{portalData.assignedStaff.email}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-indigo-100 dark:border-slate-800">
                <button
                  onClick={() => setActiveSubTab('SUPPORT')}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Gửi Yêu Cầu / Câu Hỏi Nghiệp Vụ</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 sm:space-x-4 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveSubTab('FILINGS')}
              className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === 'FILINGS'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FileCheck className="h-4 w-4" />
              <span>Tờ Khai & Biên Nhận CQT ({portalData.taxFilings.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('PAYMENT_SLIPS')}
              className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === 'PAYMENT_SLIPS'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Receipt className="h-4 w-4" />
              <span>Giấy Nộp Tiền eTax ({portalData.paymentSlips.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('CONTRACT_DEBT')}
              className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === 'CONTRACT_DEBT'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <DollarSign className="h-4 w-4" />
              <span>Công Nợ & Hợp Đồng Dịch Vụ</span>
            </button>

            <button
              onClick={() => setActiveSubTab('SUPPORT')}
              className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === 'SUPPORT'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <HelpCircle className="h-4 w-4" />
              <span>Gửi Yêu Cầu Hỗ Trợ</span>
            </button>
          </div>

          {/* TAB 1: TAX FILINGS & E-TAX RECEIPTS */}
          {activeSubTab === 'FILINGS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Lịch Sử Kê Khai Thuế Điện Tử (Cổng Tổng cục Thuế)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Minh bạch tình trạng nộp tờ khai, mã giao dịch điện tử và thời điểm cơ quan thuế tiếp nhận
                  </p>
                </div>
              </div>

              {portalData.taxFilings.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                  Chưa có tờ khai điện tử nào được lưu trữ cho kỳ này.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {portalData.taxFilings.map(filing => (
                    <div
                      key={filing.id}
                      className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-[11px] font-mono">
                            {filing.taxType}
                          </span>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                            Kỳ: {filing.period}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            filing.status === 'CQT_CHAP_NHAN' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' :
                            filing.status === 'DA_NOP_CQT' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {filing.status === 'CQT_CHAP_NHAN' ? '✓ CQT Đã Chấp Nhận' : '⏳ Đang Xử Lý CQT'}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {filing.taxTypeName}
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500">
                          <div>
                            Mã Giao dịch eTax: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{filing.receiptNumber || 'Đang cập nhật'}</span>
                          </div>
                          <div>
                            Thời gian nộp: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatDateTime(filing.submissionDate)}</span>
                          </div>
                          {filing.taxPayableAmount > 0 && (
                            <div className="text-rose-600 dark:text-rose-400 font-semibold sm:col-span-2">
                              Số thuế phát sinh phải nộp: <span className="font-mono font-bold">{filing.taxPayableAmount.toLocaleString('vi-VN')} VNĐ</span>
                            </div>
                          )}
                        </div>

                        {filing.notes && (
                          <p className="text-[11px] text-slate-400 italic pt-1">
                            Ghi chú: {filing.notes}
                          </p>
                        )}
                      </div>

                      {/* Download Receipt Button */}
                      <div className="shrink-0 flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => alert(`Đã tải xuống Thông báo chấp nhận hồ sơ khai thuế điện tử (Mã: ${filing.receiptNumber || filing.id})`)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Tải Thông Báo CQT</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PAYMENT SLIPS (GIẤY NỘP TIỀN VÀO KBNN) */}
          {activeSubTab === 'PAYMENT_SLIPS' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Giấy Nộp Tiền Thuế Điện Tử (KBNN & Ngân Hàng Ủy Nhiệm Thu)
                </h3>
                <p className="text-xs text-slate-500">
                  Theo dõi trạng thái tiền nộp vào Ngân sách Nhà nước và tải chứng từ thanh toán
                </p>
              </div>

              {portalData.paymentSlips.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                  Chưa có Giấy nộp tiền thuế nào được tạo trong kỳ này.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {portalData.paymentSlips.map(slip => (
                    <div
                      key={slip.id}
                      className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                            {slip.slipCode}
                          </span>
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                            slip.status === 'DA_NOP_KBNN'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
                          }`}>
                            {slip.status === 'DA_NOP_KBNN' ? '✓ Đã Hạch Toán KBNN' : '⚠️ Chưa Thanh Toán'}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {slip.taxType}
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500">
                          <div>
                            KBNN thụ hưởng: <span className="font-semibold text-slate-700 dark:text-slate-300">{slip.treasuryName}</span>
                          </div>
                          <div>
                            Ngân hàng ủy nhiệm: <span className="font-semibold text-slate-700 dark:text-slate-300">{slip.collectingBank}</span>
                          </div>
                          <div>
                            Tiểu mục thuế: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{slip.subItemCode}</span> (Chương: {slip.chapterCode})
                          </div>
                          {slip.treasuryReceiptNumber && (
                            <div>
                              Số CT Kho bạc: <span className="font-mono font-bold text-emerald-600">{slip.treasuryReceiptNumber}</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-1 text-sm font-extrabold text-slate-900 dark:text-white">
                          Số tiền: <span className="text-blue-600 dark:text-blue-400 font-mono">{slip.amount.toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => alert(`Đang mở Giấy nộp tiền vào NSNN điện tử: ${slip.slipCode}`)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs transition-colors"
                        >
                          <Receipt className="h-3.5 w-3.5" />
                          <span>Xem Giấy Nộp Tiền</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CONTRACT & DEBT INFO */}
          {activeSubTab === 'CONTRACT_DEBT' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Contract Card */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 uppercase">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Hợp Đồng Dịch Vụ Đại Lý Thuế</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Số hợp đồng:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{portalData.serviceContract.contractNumber}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Gói dịch vụ:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{portalData.serviceContract.servicePackage}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Thời hạn hợp đồng:</span>
                    <span className="font-medium text-slate-900 dark:text-white">{formatDate(portalData.serviceContract.startDate)} đến {formatDate(portalData.serviceContract.endDate)}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Phí dịch vụ hàng tháng:</span>
                    <span className="font-mono font-bold text-blue-600 text-sm">{portalData.serviceContract.monthlyFee.toLocaleString('vi-VN')} đ/tháng</span>
                  </div>
                </div>
              </div>

              {/* Debt & Invoicing Card */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center space-x-2 text-xs font-bold text-emerald-600 uppercase">
                  <DollarSign className="h-4 w-4" />
                  <span>Tình Trạng Công Nợ Phí Dịch Vụ</span>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-center">
                  <div className="text-xs text-slate-500">Số dư nợ phí dịch vụ hiện tại</div>
                  <div className={`text-2xl font-extrabold font-mono mt-1 ${
                    portalData.debtInfo.currentDebt > 0 ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {portalData.debtInfo.currentDebt.toLocaleString('vi-VN')} VNĐ
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {portalData.debtInfo.currentDebt > 0 ? 'Có hóa đơn dịch vụ đến hạn thanh toán' : 'Quý khách đã thanh toán đầy đủ phí dịch vụ'}
                  </div>
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                  <div>• Chu kỳ thanh toán: <span className="font-semibold text-slate-700 dark:text-slate-300">{portalData.debtInfo.billingCycle}</span></div>
                  <div>• Xuất hóa đơn VAT đại lý thuế định kỳ hàng quý.</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SUPPORT & INQUIRIES */}
          {activeSubTab === 'SUPPORT' && (
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Gửi Yêu Cầu Hỗ Trợ & Trao Đổi Nghiệp Vụ
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Yêu cầu của bạn sẽ được gửi trực tiếp đến chuyên viên {portalData.assignedStaff.name} và Ban Kiểm soát chất lượng
                </p>
              </div>

              {supportSuccess && (
                <div className="mb-4 p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span>Yêu cầu đã được gửi thành công! Chuyên viên phụ trách sẽ phản hồi trong vòng 2 giờ làm việc.</span>
                </div>
              )}

              <form onSubmit={handleSendSupport} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phân loại yêu cầu:
                  </label>
                  <select
                    value={supportCategory}
                    onChange={e => setSupportCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="HOA_DON">Kiểm tra tính hợp lệ của hóa đơn / chứng từ</option>
                    <option value="TAI_LIEU">Bổ sung hồ sơ / tài liệu giải trình</option>
                    <option value="GIAI_TRINH_THUE">Hỗ trợ giải trình số liệu với cơ quan thuế</option>
                    <option value="HOI_DAP">Tư vấn chính sách thuế / tiền lương mới</option>
                    <option value="YEU_CAU_KHAC">Yêu cầu khác</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Họ tên người gửi:
                    </label>
                    <input
                      type="text"
                      placeholder="vd: Nguyễn Văn A (Kế toán nội bộ)"
                      value={supportSenderName}
                      onChange={e => setSupportSenderName(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Số điện thoại liên hệ:
                    </label>
                    <input
                      type="text"
                      placeholder="vd: 0901234567"
                      value={supportSenderPhone}
                      onChange={e => setSupportSenderPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tiêu đề yêu cầu:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="vd: Nhờ kiểm tra hóa đơn đầu vào số HD-0091..."
                    value={supportSubject}
                    onChange={e => setSupportSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nội dung chi tiết:
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Mô tả cụ thể thắc mắc hoặc thông tin cần đại lý thuế hỗ trợ..."
                    value={supportContent}
                    onChange={e => setSupportContent(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>Gửi Yêu Cầu Cho Đại Lý Thuế</span>
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

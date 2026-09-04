import React, { useState, useMemo } from 'react';
import { Customer, Task, User, CustomerServiceType } from '../../types';
import { storageService, CURRENT_SYSTEM_DATE } from '../../services/storageService';
import { PermissionService } from '../../utils/permissions';
import { 
  Building, 
  Search, 
  Plus, 
  AlertTriangle, 
  ShieldAlert, 
  Phone, 
  Mail, 
  UserCheck, 
  FileText, 
  ChevronRight,
  CreditCard,
  Briefcase,
  Clock,
  Layers,
  Calendar,
  Zap,
  RefreshCw,
  Sparkles,
  SlidersHorizontal,
  Lock,
  Star,
  Edit3,
  Eye,
  Trash2,
  CheckCircle2,
  X
} from 'lucide-react';
import { 
  formatCurrency, 
  formatDate, 
  RISK_LABELS,
  CUSTOMER_TYPE_LABELS,
  TAX_DECLARATION_CYCLE_LABELS,
  HOUSEHOLD_BUSINESS_GROUP_LABELS,
  CUSTOMER_SERVICE_TYPE_LABELS
} from '../../utils/formatters';

interface CustomerListProps {
  customers: Customer[];
  tasks: Task[];
  users: User[];
  currentUser?: User;
  onSelectCustomer: (customer: Customer) => void;
  onOpenCreateCustomer: () => void;
  onEditCustomer?: (customer: Customer) => void;
  onDeleteCustomer?: (customerId: string) => void;
  onOpenCreateTaskForCustomer: (customer: Customer) => void;
  onOpenPortalForCustomer?: (taxCode: string) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  tasks,
  users,
  currentUser,
  onSelectCustomer,
  onOpenCreateCustomer,
  onEditCustomer,
  onDeleteCustomer,
  onOpenCreateTaskForCustomer,
  onOpenPortalForCustomer,
}) => {
  const canViewAllCustomers = PermissionService.canViewAllCustomers(currentUser);
  const canViewFinancials = PermissionService.canViewCustomerFinancials(currentUser);
  const canCreateCustomer = PermissionService.canCreateCustomer(currentUser);
  const canEditCustomer = PermissionService.canEditCustomer(currentUser);
  const canDeleteCustomer = PermissionService.canDeleteCustomer(currentUser);

  // Modal delete confirmation state & toast
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleConfirmDeleteCustomer = (customer: Customer) => {
    if (onDeleteCustomer) {
      onDeleteCustomer(customer.id);
    } else {
      storageService.deleteCustomer(customer.id, currentUser || undefined);
    }
    setCustomerToDelete(null);
    setToastMessage(`Đã xóa thành công khách hàng "${customer.name}"`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Default to MY_CUSTOMERS for regular specialists, or ALL for management
  const [scopeTab, setScopeTab] = useState<'MY_CUSTOMERS' | 'ALL_CUSTOMERS'>(
    !canViewAllCustomers ? 'MY_CUSTOMERS' : 'ALL_CUSTOMERS'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceTypeTab, setServiceTypeTab] = useState<'ALL' | 'DINH_KY' | 'PHAT_SINH' | 'HON_HOP'>('ALL');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [selectedStaff, setSelectedStaff] = useState<string>('ALL');
  const [selectedTaxDept, setSelectedTaxDept] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedCycle, setSelectedCycle] = useState<string>('ALL');

  // Count assigned to current user
  const myAssignedCustomersCount = useMemo(() => {
    if (!currentUser) return 0;
    return customers.filter(c => 
      c.assignedStaffId === currentUser.id || 
      c.reviewerStaffId === currentUser.id ||
      tasks.some(t => t.customerId === c.id && (t.assigneeId === currentUser.id || t.reviewerId === currentUser.id))
    ).length;
  }, [customers, currentUser, tasks]);

  // Stats calculation
  const stats = useMemo(() => {
    let periodicCount = 0;
    let periodicMRR = 0;
    let adhocCount = 0;
    let bothCount = 0;
    let totalDebt = 0;

    customers.forEach(c => {
      const sType = c.serviceType || (c.billingCycle === 'THEO_VU_VIEC' ? 'PHAT_SINH' : 'DINH_KY');
      if (sType === 'DINH_KY') {
        periodicCount++;
        periodicMRR += (c.monthlyFee || 0);
      } else if (sType === 'PHAT_SINH') {
        adhocCount++;
      } else if (sType === 'HON_HOP') {
        bothCount++;
        periodicMRR += (c.monthlyFee || 0);
      }
      totalDebt += (c.debtAmount || 0);
    });

    return {
      total: customers.length,
      periodicCount,
      periodicMRR,
      adhocCount,
      bothCount,
      totalDebt,
    };
  }, [customers]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      // Scope filter: My customers vs All
      if (scopeTab === 'MY_CUSTOMERS' && currentUser) {
        const isAssigned = c.assignedStaffId === currentUser.id || c.reviewerStaffId === currentUser.id;
        const hasMyTask = tasks.some(t => t.customerId === c.id && (t.assigneeId === currentUser.id || t.reviewerId === currentUser.id));
        if (!isAssigned && !hasMyTask) return false;
      }

      const sType = c.serviceType || (c.billingCycle === 'THEO_VU_VIEC' ? 'PHAT_SINH' : 'DINH_KY');
      
      // Tab filter
      if (serviceTypeTab !== 'ALL' && sType !== serviceTypeTab) return false;

      // Dropdown filters
      if (selectedRisk !== 'ALL' && c.riskLevel !== selectedRisk) return false;
      if (selectedStaff !== 'ALL' && c.assignedStaffId !== selectedStaff) return false;
      if (selectedTaxDept !== 'ALL' && !c.taxDepartment.includes(selectedTaxDept)) return false;
      if (selectedType !== 'ALL' && (c.type || 'CONG_TY') !== selectedType) return false;
      if (selectedCycle !== 'ALL' && (c.taxDeclarationCycle || 'QUY') !== selectedCycle) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = c.name.toLowerCase().includes(term);
        const matchTax = c.taxCode.toLowerCase().includes(term);
        const matchContact = c.contactPerson.toLowerCase().includes(term);
        const matchPhone = c.phone.includes(term);
        const matchPkg = (c.servicePackage || '').toLowerCase().includes(term);
        if (!matchName && !matchTax && !matchContact && !matchPhone && !matchPkg) return false;
      }

      return true;
    });
  }, [customers, scopeTab, currentUser, tasks, serviceTypeTab, selectedRisk, selectedStaff, selectedTaxDept, selectedType, selectedCycle, searchTerm]);

  return (
    <div className="space-y-3.5">

      {/* Scope Selector for Specialists vs All */}
      <div className="bg-white dark:bg-slate-900 p-2 sm:p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setScopeTab('MY_CUSTOMERS')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              scopeTab === 'MY_CUSTOMERS' || !canViewAllCustomers
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Star className="h-3.5 w-3.5" />
            <span>Khách hàng tôi phụ trách ({myAssignedCustomersCount})</span>
          </button>

          {canViewAllCustomers && (
            <button
              type="button"
              onClick={() => setScopeTab('ALL_CUSTOMERS')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                scopeTab === 'ALL_CUSTOMERS'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building className="h-3.5 w-3.5" />
              <span>Toàn bộ danh bạ ({customers.length})</span>
            </button>
          )}
        </div>

        {/* Security badge & Financial brief */}
        <div className="flex items-center space-x-3 text-xs px-2">
          {canViewFinancials ? (
            <>
              <div className="flex items-center space-x-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                <span className="text-slate-400">MRR:</span>
                <span className="font-bold">{formatCurrency(stats.periodicMRR)}/tháng</span>
              </div>
              {stats.totalDebt > 0 && (
                <div className="flex items-center space-x-1.5 text-red-600 dark:text-red-400 font-semibold border-l border-slate-200 dark:border-slate-700 pl-3">
                  <span className="text-slate-400">Nợ đọng:</span>
                  <span className="font-bold">{formatCurrency(stats.totalDebt)}</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 font-medium">
              <Lock className="h-3.5 w-3.5 text-amber-500" />
              <span>Chế độ bảo mật: Bí mật doanh thu & thông tin tài chính được bảo vệ</span>
            </div>
          )}
        </div>
      </div>
      
      {/* 1. Compact Service Classification Segment Tabs */}
      <div className="bg-white dark:bg-slate-900 p-2 sm:p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        
        {/* Classification Segment Tabs */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setServiceTypeTab('ALL')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              serviceTypeTab === 'ALL'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building className="h-3.5 w-3.5" />
            <span>Tất cả ({stats.total})</span>
          </button>

          <button
            type="button"
            onClick={() => setServiceTypeTab('DINH_KY')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              serviceTypeTab === 'DINH_KY'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <RefreshCw className="h-3.5 w-3.5 text-emerald-600" />
            <span>Định kỳ trọn gói ({stats.periodicCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setServiceTypeTab('PHAT_SINH')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              serviceTypeTab === 'PHAT_SINH'
                ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap className="h-3.5 w-3.5 text-amber-600" />
            <span>Vụ việc / Phát sinh ({stats.adhocCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setServiceTypeTab('HON_HOP')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              serviceTypeTab === 'HON_HOP'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            <span>Hỗn hợp ({stats.bothCount})</span>
          </button>
        </div>
      </div>

      {/* 2. Top Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
        
        {/* Search Row & Add Customer Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên công ty, mã số thuế (MST), người liên hệ, gói dịch vụ..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {canCreateCustomer && (
            <button
              onClick={onOpenCreateCustomer}
              className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm Khách Hàng</span>
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium focus:outline-none text-xs"
          >
            <option value="ALL">Loại hình: Tất cả</option>
            <option value="CONG_TY">🏢 Doanh nghiệp</option>
            <option value="HO_KINH_DOANH">🏪 Hộ kinh doanh</option>
            <option value="CA_NHAN">👤 Cá nhân</option>
          </select>

          <select
            value={selectedCycle}
            onChange={(e) => setSelectedCycle(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium focus:outline-none text-xs"
          >
            <option value="ALL">Kỳ kê khai: Tất cả</option>
            <option value="QUY">📅 Kê khai Quý</option>
            <option value="THANG">🗓️ Kê khai Tháng</option>
          </select>

          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none text-xs"
          >
            <option value="ALL">Rủi ro thuế: Tất cả</option>
            <option value="NGUY_CO_PHAP_LY">Nguy cơ pháp lý</option>
            <option value="CAO">Rủi ro cao</option>
            <option value="TRUNG_BINH">Rủi ro trung bình</option>
            <option value="BINH_THUONG">Bình thường</option>
          </select>

          <select
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none text-xs"
          >
            <option value="ALL">Phụ trách: Tất cả</option>
            {users.filter(u => u.role !== 'ADMIN' && u.id !== 'USR-030' && !u.name.includes('Quản Trị')).map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>

        </div>
      </div>

      {/* 3. Customer Cards / Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Table Banner Header */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/80 dark:bg-slate-850 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-900 dark:text-white">
              Danh Sách Khách Hàng Doanh Nghiệp & Hộ Kinh Doanh ({filteredCustomers.length})
            </span>
            {serviceTypeTab !== 'ALL' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
                Đang lọc: {serviceTypeTab === 'DINH_KY' ? '🔄 Dịch vụ Định kỳ' : serviceTypeTab === 'PHAT_SINH' ? '⚡ Dịch vụ Phát sinh' : '🌟 Định kỳ & Phát sinh'}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-4 text-slate-500">
            {canViewFinancials && (
              <span>
                Tổng nợ đọng: <strong className="text-red-600 font-bold">{formatCurrency(filteredCustomers.reduce((s, c) => s + (c.debtAmount || 0), 0))}</strong>
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4 min-w-[280px]">Doanh nghiệp / HKD & MST</th>
                <th className="py-3 px-3 w-36">Phân Loại Dịch Vụ</th>
                <th className="py-3 px-4 w-44">Phụ trách & KSV</th>
                <th className="py-3 px-4 min-w-[200px]">Gói Dịch Vụ & Biểu Phí</th>
                <th className="py-3 px-3 w-28 text-center">Rủi ro thuế</th>
                <th className="py-3 px-3 w-28 text-center">Việc đang làm</th>
                <th className="py-3 px-4 w-32 text-right">Công nợ phí</th>
                <th className="py-3 px-3 min-w-[150px] text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCustomers.map((cust) => {
                const customerTasks = tasks.filter(t => t.customerId === cust.id);
                const activeTasks = customerTasks.filter(t => t.status !== 'HOAN_THANH' && t.status !== 'HUY');
                const overdueCustTasks = activeTasks.filter(t => {
                  const s = storageService.getTaskDeadlineStatus(t);
                  return s.isOverdue;
                });

                // Determine service type
                const sType: CustomerServiceType = cust.serviceType || (cust.billingCycle === 'THEO_VU_VIEC' ? 'PHAT_SINH' : 'DINH_KY');
                const serviceInfo = CUSTOMER_SERVICE_TYPE_LABELS[sType] || CUSTOMER_SERVICE_TYPE_LABELS.DINH_KY;

                return (
                  <tr
                    key={cust.id}
                    onClick={() => onSelectCustomer(cust)}
                    className="hover:bg-blue-50/50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                  >
                    {/* 1. Company info & Tax code & Business Group */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white leading-snug">
                          {cust.name}
                        </span>

                        {/* Legal Type Tag */}
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          cust.type === 'HO_KINH_DOANH'
                            ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                            : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300'
                        }`}>
                          {CUSTOMER_TYPE_LABELS[cust.type || 'CONG_TY']?.label}
                        </span>

                        {/* HKD Group Tag */}
                        {cust.type === 'HO_KINH_DOANH' && cust.householdGroup && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-100 dark:bg-orange-900/60 text-orange-900 dark:text-orange-200 font-extrabold border border-orange-300">
                            {HOUSEHOLD_BUSINESS_GROUP_LABELS[cust.householdGroup]?.shortLabel} ({HOUSEHOLD_BUSINESS_GROUP_LABELS[cust.householdGroup]?.revenueRange})
                          </span>
                        )}

                        {/* Tax Cycle Tag */}
                        {cust.taxDeclarationCycle && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                            cust.taxDeclarationCycle === 'THANG'
                              ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                              : 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                          }`}>
                            {cust.taxDeclarationCycle === 'THANG' ? '🗓️ Theo Tháng' : '📅 Theo Quý'}
                          </span>
                        )}

                        {/* Contract Terminated Tag */}
                        {(cust.contractStatus === 'DA_CHAM_DUT' || cust.contractStatus === 'DA_HUY') && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-extrabold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800">
                            Đã chấm dứt HĐ
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 mt-1 text-slate-500 flex-wrap gap-y-1">
                        <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                          MST: {cust.taxCode}
                        </span>
                        <span>•</span>
                        <span>{cust.taxDepartment}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center space-x-2">
                        <span>LH: {cust.contactPerson} ({cust.phone})</span>
                      </div>
                    </td>

                    {/* 2. Service Classification Badge (Định kỳ vs Phát sinh) */}
                    <td className="py-3.5 px-3 align-top">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-md text-[10.5px] font-bold border ${serviceInfo.badgeClass} ${serviceInfo.badgeBorder}`}>
                        <span>{serviceInfo.icon}</span>
                        <span>{serviceInfo.short}</span>
                      </span>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {sType === 'DINH_KY' && 'Trọn gói theo kỳ'}
                        {sType === 'PHAT_SINH' && 'Hồ sơ theo vụ việc'}
                        {sType === 'HON_HOP' && 'Trọn gói + Vụ việc'}
                      </div>
                    </td>

                    {/* 3. Staff Assigned */}
                    <td className="py-3.5 px-4 align-top text-[11px]">
                      <div>
                        <span className="text-slate-400">Phụ trách:</span>{' '}
                        <strong className="text-slate-800 dark:text-slate-200">{cust.assignedStaffName}</strong>
                      </div>
                      <div className="text-slate-500 mt-0.5">
                        <span className="text-slate-400">KSV:</span> {cust.reviewerStaffName}
                      </div>
                    </td>

                    {/* 4. Service package & fee */}
                    <td className="py-3.5 px-4 align-top text-[11px]">
                      <div className="font-bold text-slate-800 dark:text-slate-200 line-clamp-2">
                        {cust.servicePackage}
                      </div>
                      <div className="mt-1 flex items-center space-x-2 flex-wrap">
                        {!canViewFinancials ? (
                          <span className="text-slate-400 font-mono text-[10px]">🔒 Bảo mật nội bộ</span>
                        ) : sType === 'PHAT_SINH' ? (
                          <span className="text-amber-700 dark:text-amber-300 font-bold text-[11px] bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                            ⚡ Thu theo từng vụ việc
                          </span>
                        ) : (
                          <div className="flex items-center space-x-1.5">
                            <span className="text-emerald-600 font-bold">
                              {formatCurrency(cust.monthlyFee)}/tháng
                            </span>
                            <span className={`text-[9px] px-1 py-0.2 rounded font-semibold ${
                              cust.vatType === 'DA_CO_VAT'
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800'
                                : cust.vatType === 'KHONG_VAT'
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800'
                            }`}>
                              {cust.vatType === 'DA_CO_VAT' ? 'Đã gồm VAT' : cust.vatType === 'KHONG_VAT' ? '0% VAT' : 'Chưa VAT'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Contract cycle status pill */}
                      {cust.contractEndDate && sType !== 'PHAT_SINH' && (
                        <div className="mt-1">
                          {(() => {
                            const now = new Date(CURRENT_SYSTEM_DATE);
                            const end = new Date(cust.contractEndDate);
                            const daysDiff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 3600 * 24));

                            if (daysDiff < 0) {
                              return (
                                <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-[9.5px] font-bold border border-red-200 dark:border-red-900">
                                  <AlertTriangle className="h-2.5 w-2.5" />
                                  <span>HĐ hết hạn ({Math.abs(daysDiff)} ngày trước)</span>
                                </span>
                              );
                            } else if (daysDiff <= 15) {
                              return (
                                <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 text-[9.5px] font-bold border border-orange-200 dark:border-orange-900 animate-pulse">
                                  <Clock className="h-2.5 w-2.5" />
                                  <span>HĐ còn {daysDiff} ngày</span>
                                </span>
                              );
                            } else if (daysDiff <= 30) {
                              return (
                                <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[9.5px] font-bold border border-amber-200 dark:border-amber-900">
                                  <span>Tái ký sau {daysDiff} ngày</span>
                                </span>
                              );
                            } else {
                              return (
                                <span className="text-[10px] text-slate-400">
                                  Hạn HĐ: {formatDate(cust.contractEndDate)}
                                </span>
                              );
                            }
                          })()}
                        </div>
                      )}
                    </td>

                    {/* 5. Tax Risk Badge */}
                    <td className="py-3.5 px-3 align-top text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded border inline-block font-semibold ${RISK_LABELS[cust.riskLevel]?.badgeClass}`}>
                        {RISK_LABELS[cust.riskLevel]?.label}
                      </span>
                    </td>

                    {/* 6. Active Tasks */}
                    <td className="py-3.5 px-3 align-top text-center">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {activeTasks.length} việc
                      </div>
                      {overdueCustTasks.length > 0 && (
                        <div className="text-[10px] font-bold text-red-600 mt-0.5">
                          {overdueCustTasks.length} quá hạn!
                        </div>
                      )}
                    </td>

                    {/* 7. Debt amount */}
                    <td className="py-3.5 px-4 align-top text-right">
                      {!canViewFinancials ? (
                        <span className="text-slate-400 text-[10px]">🔒 Kế toán trưởng/BGĐ</span>
                      ) : cust.debtAmount > 0 ? (
                        <span className="font-bold text-red-600">
                          {formatCurrency(cust.debtAmount)}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-medium">Đã thanh toán</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 align-middle text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center space-x-1.5 whitespace-nowrap">
                        {/* Nút Xoá */}
                        <button
                          type="button"
                          id={`btn-delete-cust-${cust.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCustomerToDelete(cust);
                          }}
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-[11px] font-bold shadow-2xs transition-all cursor-pointer hover:border-rose-300"
                          title={`Xóa khách hàng ${cust.name} khỏi hệ thống`}
                        >
                          <Trash2 className="h-3 w-3 text-rose-600 dark:text-rose-400" />
                          <span>Xoá</span>
                        </button>

                        <span className="text-slate-300 dark:text-slate-700 font-semibold select-none">|</span>

                        {/* Nút Sửa */}
                        <button
                          type="button"
                          id={`btn-edit-cust-${cust.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onEditCustomer) {
                              onEditCustomer(cust);
                            } else {
                              onSelectCustomer(cust);
                            }
                          }}
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-[11px] font-bold shadow-2xs transition-all cursor-pointer hover:border-blue-300"
                          title={`Sửa thông tin khách hàng ${cust.name}`}
                        >
                          <Edit3 className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                          <span>Sửa</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    <Building className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <span>Không tìm thấy khách hàng nào thỏa mãn điều kiện lọc.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modal Xác Nhận Xoá Khách Hàng */}
      {customerToDelete && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 bg-rose-50/80 dark:bg-rose-950/40 border-b border-rose-100 dark:border-rose-900/50 flex items-center justify-between">
              <div className="flex items-center space-x-2.5 text-rose-700 dark:text-rose-400">
                <div className="p-2 bg-rose-100 dark:bg-rose-900/60 rounded-xl">
                  <Trash2 className="h-5 w-5 text-rose-600 dark:text-rose-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Xác Nhận Xoá Khách Hàng</h3>
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">Xóa vĩnh viễn hồ sơ khỏi danh mục theo dõi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  {customerToDelete.name}
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300 text-[11px]">
                  <div>Mã số thuế: <strong className="font-mono text-blue-600 dark:text-blue-400">{customerToDelete.taxCode}</strong></div>
                  <div>Phân loại: <strong>{CUSTOMER_TYPE_LABELS[customerToDelete.type || 'CONG_TY']?.label}</strong></div>
                  <div>Chuyên viên phụ trách: <strong>{customerToDelete.assignedStaffName || 'Chưa phân công'}</strong></div>
                  <div>Công nợ hiện tại: <strong className={customerToDelete.debtAmount > 0 ? 'text-red-600' : 'text-emerald-600'}>{formatCurrency(customerToDelete.debtAmount || 0)}</strong></div>
                </div>
              </div>

              {/* Warning of related tasks and logs */}
              {(() => {
                const custTasks = tasks.filter(t => t.customerId === customerToDelete.id);
                const activeTasks = custTasks.filter(t => t.status !== 'HOAN_THANH' && t.status !== 'HUY');
                return (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start space-x-2.5 text-amber-800 dark:text-amber-300 text-[11.5px]">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-bold">Cảnh báo hệ thống:</div>
                      <div>Khách hàng này hiện có <strong>{custTasks.length}</strong> công việc ({activeTasks.length} việc đang xử lý). Khi xóa, hồ sơ khách hàng sẽ bị gỡ khỏi danh sách và hệ thống sẽ tự động ghi vết Audit Log.</div>
                    </div>
                  </div>
                );
              })()}

              <p className="text-slate-500 dark:text-slate-400 text-[11.5px] leading-relaxed">
                Bạn có chắc chắn muốn xóa khách hàng <strong className="text-slate-800 dark:text-slate-200">"{customerToDelete.name}"</strong> không? Thao tác này không thể hoàn tác.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                id="btn-confirm-delete-customer"
                onClick={() => handleConfirmDeleteCustomer(customerToDelete)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Xác Nhận Xoá</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 p-4 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-2xl shadow-xl flex items-center space-x-3 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 text-slate-400 hover:text-white dark:hover:text-slate-900 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

    </div>
  );
};


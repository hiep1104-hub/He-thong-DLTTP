import React, { useState, useMemo } from 'react';
import { 
  Customer, 
  User, 
  CustomerRiskLevel, 
  BillingCycle, 
  CustomerType, 
  TaxDeclarationCycle, 
  HouseholdBusinessGroup,
  Task,
  TaskPriority,
  TaskRiskLevel,
  Department,
  VatType
} from '../../types';
import { 
  X, 
  Building, 
  UserCheck, 
  CheckCircle2, 
  FileText, 
  Check, 
  AlertTriangle,
  Calendar,
  Clock,
  KeyRound,
  BellRing,
  Layers,
  Briefcase,
  Zap,
  Tag,
  CreditCard,
  FolderCheck,
  ListChecks,
  Scale,
  Sparkles,
  HelpCircle,
  Phone,
  Mail,
  MapPin,
  FileCheck,
  Plus,
  Trash2,
  Search,
  ChevronDown,
  ChevronUp,
  PackagePlus,
  ShoppingBag,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { CURRENT_SYSTEM_DATE, storageService } from '../../services/storageService';
import { SERVICE_PACKAGES } from '../../data/servicePackages';
import { AD_HOC_SERVICES, AD_HOC_SERVICE_GROUPS } from '../../data/adHocServices';
import { 
  formatDate, 
  formatCurrency, 
  CUSTOMER_TYPE_LABELS, 
  HOUSEHOLD_BUSINESS_GROUP_LABELS 
} from '../../utils/formatters';
import { PermissionService } from '../../utils/permissions';

export type IntakeServiceNature = 'PERIODIC' | 'ADHOC' | 'BOTH';

export interface SelectedAdHocServiceEntry {
  id: string; // Unique id for the line item
  code: string;
  name: string;
  group: string;
  groupName: string;
  department: Department;
  unitFee: number;
  quantity: number;
  thirdPartyFee: number;
  dueDate: string;
  priority: TaskPriority;
  defaultRiskLevel?: TaskRiskLevel;
  description: string;
  feeDisplay: string;
  suggestedWorkflow: { name: string; isMandatory: boolean; requiredEvidence: boolean }[];
  suggestedChecklist: { title: string; required: boolean }[];
}

interface CustomerCreateModalProps {
  users: User[];
  currentUser?: User;
  editingCustomer?: Customer | null;
  onClose: () => void;
  onCreateCustomer: (newCustomer: Customer) => void;
  onUpdateCustomer?: (updatedCustomer: Customer) => void;
}

import { COMMON_TAX_DEPARTMENTS } from '../../data/taxDepartments';

export const CustomerCreateModal: React.FC<CustomerCreateModalProps> = ({
  users,
  currentUser,
  editingCustomer,
  onClose,
  onCreateCustomer,
  onUpdateCustomer,
}) => {
  const isEditing = Boolean(editingCustomer);
  const canViewFinancials = PermissionService.canViewCustomerFinancials(currentUser);

  // =========================================================================
  // 0. NATURE OF SERVICE INTAKE (Phân loại dịch vụ tiếp nhận)
  // =========================================================================
  const [intakeNature, setIntakeNature] = useState<IntakeServiceNature>(() => {
    if (editingCustomer) {
      if (editingCustomer.serviceType === 'PHAT_SINH' || editingCustomer.billingCycle === 'THEO_VU_VIEC') return 'ADHOC';
      if (editingCustomer.serviceType === 'HON_HOP') return 'BOTH';
      return 'PERIODIC';
    }
    return 'PERIODIC';
  });

  // =========================================================================
  // 1. COMMON CUSTOMER INFORMATION (Thông tin chung khách hàng)
  // =========================================================================
  const [name, setName] = useState(editingCustomer?.name || '');
  const [taxCode, setTaxCode] = useState(editingCustomer?.taxCode || '');
  const [address, setAddress] = useState(editingCustomer?.address || '');
  const [contactPerson, setContactPerson] = useState(editingCustomer?.contactPerson || '');
  const [phone, setPhone] = useState(editingCustomer?.phone || '');
  const [email, setEmail] = useState(editingCustomer?.email || '');
  const [taxDepartment, setTaxDepartment] = useState(editingCustomer?.taxDepartment || 'Thuế cơ sở 2 TP. Hồ Chí Minh');

  // Staff assignment & Risk
  const workloadSummaries = useMemo(() => {
    return storageService.getStaffWorkloadSummaries();
  }, []);

  const allAvailableUsers = useMemo(() => {
    const list = storageService.getUsers().filter(u => 
      u.active !== false && 
      u.role !== 'ADMIN' && 
      u.id !== 'USR-030' && 
      !u.name.includes('Quản Trị')
    );
    return list.length > 0 ? list : users.filter(u => u.role !== 'ADMIN' && u.id !== 'USR-030');
  }, [users]);

  // Sắp xếp danh sách chuyên viên kế toán ưu tiên người có tải trọng thấp / nhân sự mới
  const sortedAssignees = useMemo(() => {
    return [...allAvailableUsers].sort((a, b) => {
      const summaryA = workloadSummaries.find(w => w.userId === a.id);
      const summaryB = workloadSummaries.find(w => w.userId === b.id);
      const countA = summaryA?.assignedCustomersCount ?? 0;
      const countB = summaryB?.assignedCustomersCount ?? 0;
      return countA - countB;
    });
  }, [allAvailableUsers, workloadSummaries]);

  // Sắp xếp danh sách kiểm soát viên (Trưởng phòng / Trưởng nhóm / KTT / BGĐ)
  const sortedReviewers = useMemo(() => {
    const qualified = allAvailableUsers.filter(u => 
      u.role === 'TRUONG_PHONG' || 
      u.role === 'TRUONG_NHOM' || 
      u.role === 'BAN_GIAM_DOC' || 
      u.position?.toLowerCase().includes('trưởng') ||
      u.position?.toLowerCase().includes('kế toán trưởng') ||
      u.position?.toLowerCase().includes('kiểm soát') ||
      u.position?.toLowerCase().includes('giám đốc') ||
      u.position?.toLowerCase().includes('phó phòng')
    );
    return qualified.length > 0 ? qualified : allAvailableUsers;
  }, [allAvailableUsers]);

  const [assignedStaffId, setAssignedStaffId] = useState<string>(() => {
    if (editingCustomer?.assignedStaffId && editingCustomer.assignedStaffId !== 'USR-030') {
      return editingCustomer.assignedStaffId;
    }
    return sortedAssignees[0]?.id || '';
  });

  const [reviewerStaffId, setReviewerStaffId] = useState<string>(() => {
    if (editingCustomer?.reviewerStaffId && editingCustomer.reviewerStaffId !== 'USR-030') {
      return editingCustomer.reviewerStaffId;
    }
    return sortedReviewers[0]?.id || '';
  });

  const [riskLevel, setRiskLevel] = useState<CustomerRiskLevel>(editingCustomer?.riskLevel || 'BINH_THUONG');
  const [notes, setNotes] = useState(editingCustomer?.notes || '');

  // =========================================================================
  // 2. PERIODIC SPECIFIC STATES (Dành riêng cho Dịch vụ Định kỳ)
  // =========================================================================
  const [customerType, setCustomerType] = useState<CustomerType>(editingCustomer?.type || 'CONG_TY');
  const [householdGroup, setHouseholdGroup] = useState<HouseholdBusinessGroup>(editingCustomer?.householdGroup || 'NHOM_2');
  const [taxDeclarationCycle, setTaxDeclarationCycle] = useState<TaxDeclarationCycle>(editingCustomer?.taxDeclarationCycle || 'QUY');
  const [annualRevenue, setAnnualRevenue] = useState<number>(editingCustomer?.annualRevenue || 2500000000);
  const [accountingStandard, setAccountingStandard] = useState<string>(editingCustomer?.accountingStandard || 'Thông tư 133/2016/TT-BTC');

  // Package & Billing
  const matchedInitialPkg = SERVICE_PACKAGES.find(p => p.name === editingCustomer?.servicePackage);
  const [selectedPackageId, setSelectedPackageId] = useState<string>(
    matchedInitialPkg ? matchedInitialPkg.id : (editingCustomer?.servicePackage ? 'CUSTOM' : 'PKG-A')
  );
  const [servicePackage, setServicePackage] = useState(
    editingCustomer?.servicePackage || SERVICE_PACKAGES[0]?.name || 'GÓI A – CƠ BẢN (Đại lý thuế & Kế toán trọn gói)'
  );
  const [isCustomPackage, setIsCustomPackage] = useState(!matchedInitialPkg && Boolean(editingCustomer?.servicePackage));
  const [monthlyFee, setMonthlyFee] = useState<number>(
    editingCustomer?.monthlyFee !== undefined ? editingCustomer.monthlyFee : (SERVICE_PACKAGES[0]?.defaultMonthlyFee || 3000000)
  );
  const [vatType, setVatType] = useState<VatType>(editingCustomer?.vatType || 'CHUA_VAT');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(editingCustomer?.billingCycle || 'HANG_THANG');
  const [autoDispatchPeriodicTasks, setAutoDispatchPeriodicTasks] = useState(!isEditing);

  // Contract Duration & Renewal
  const [contractNumber, setContractNumber] = useState(editingCustomer?.contractNumber || '');
  const [serviceStartDate, setServiceStartDate] = useState(editingCustomer?.serviceStartDate || CURRENT_SYSTEM_DATE);
  const [contractDurationMonths, setContractDurationMonths] = useState<number>(editingCustomer?.contractDurationMonths || 12);

  const initialEndDate = useMemo(() => {
    if (editingCustomer?.contractEndDate) return editingCustomer.contractEndDate;
    const start = new Date(CURRENT_SYSTEM_DATE);
    start.setFullYear(start.getFullYear() + 1);
    start.setDate(start.getDate() - 1);
    return start.toISOString().split('T')[0];
  }, [editingCustomer]);

  const [contractEndDate, setContractEndDate] = useState(editingCustomer?.contractEndDate || initialEndDate);
  const [renewalNoticeDays, setRenewalNoticeDays] = useState<number>(editingCustomer?.renewalNoticeDays || 30);
  const [contractAutoRenew, setContractAutoRenew] = useState(editingCustomer?.contractAutoRenew ?? true);

  // Digital Signature & E-Invoice
  const [digitalSignatureProvider, setDigitalSignatureProvider] = useState(editingCustomer?.digitalSignatureProvider || 'Viettel-CA');
  const [digitalSignatureExpiry, setDigitalSignatureExpiry] = useState(editingCustomer?.digitalSignatureExpiry || '2028-06-30');
  const [eInvoiceProvider, setEInvoiceProvider] = useState(editingCustomer?.eInvoiceProvider || 'Viettel Sinvoice');
  const [eInvoiceTotalQuota, setEInvoiceTotalQuota] = useState<number>(editingCustomer?.eInvoiceTotalQuota || 500);
  const [businessLicenseName, setBusinessLicenseName] = useState(editingCustomer?.businessLicenseName || '');
  const [businessLicenseExpiry, setBusinessLicenseExpiry] = useState(editingCustomer?.businessLicenseExpiry || '');

  // =========================================================================
  // 3. AD-HOC SPECIFIC STATES (Dành riêng cho Dịch vụ Phát sinh / Vụ việc) - MULTI SERVICE
  // =========================================================================
  const defaultDueDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  }, []);

  // Initialize with the first service
  const [selectedAdHocList, setSelectedAdHocList] = useState<SelectedAdHocServiceEntry[]>(() => {
    const first = AD_HOC_SERVICES[0];
    if (!first) return [];
    return [{
      id: `adhoc-${first.code}-${Date.now()}`,
      code: first.code,
      name: first.name,
      group: first.group,
      groupName: first.groupName,
      department: first.department || 'KE_TOAN_THUE',
      unitFee: first.fee,
      quantity: 1,
      thirdPartyFee: 0,
      dueDate: defaultDueDate,
      priority: first.defaultPriority || 'CAO',
      defaultRiskLevel: first.defaultRiskLevel || 'TRUNG_BINH',
      description: first.description,
      feeDisplay: first.feeDisplay,
      suggestedWorkflow: first.suggestedWorkflow,
      suggestedChecklist: first.suggestedChecklist,
    }];
  });

  const [adHocGroupFilter, setAdHocGroupFilter] = useState<string>('ALL');
  const [adHocSearchTerm, setAdHocSearchTerm] = useState<string>('');
  const [expandedPreviewCode, setExpandedPreviewCode] = useState<string | null>(null);

  // Deposit & Financial info
  const [adHocDeposit, setAdHocDeposit] = useState<number>(1000000);

  // Live duplicate customer detection
  const duplicateWarning = useMemo(() => {
    if (!taxCode && !name) return null;
    return storageService.checkDuplicateCustomer(taxCode, name);
  }, [taxCode, name]);

  // Handler for customer type change (Periodic)
  const handleCustomerTypeChange = (type: CustomerType) => {
    setCustomerType(type);
    if (type === 'HO_KINH_DOANH') {
      handleHouseholdGroupChange(householdGroup || 'NHOM_2');
    } else if (type === 'CONG_TY') {
      setAccountingStandard(annualRevenue > 50000000000 ? 'Thông tư 200/2014/TT-BTC' : 'Thông tư 133/2016/TT-BTC');
      if (selectedPackageId === 'PKG-HKD') {
        setSelectedPackageId('PKG-A');
        setMonthlyFee(3000000);
        setServicePackage('GÓI A – CƠ BẢN (Đại lý thuế & Kế toán trọn gói)');
      }
    } else {
      setAccountingStandard('Biểu thuế TNCN lũy tiến từng phần');
      setTaxDeclarationCycle('QUY');
    }
  };

  const handleHouseholdGroupChange = (group: HouseholdBusinessGroup) => {
    setHouseholdGroup(group);
    setCustomerType('HO_KINH_DOANH');
    setIsCustomPackage(false);
    setSelectedPackageId('PKG-HKD');

    if (group === 'NHOM_1') {
      setAnnualRevenue(800000000);
      setAccountingStandard('Chế độ kế toán rút gọn (2 mẫu sổ cơ bản)');
      setTaxDeclarationCycle('QUY');
      setMonthlyFee(1200000);
      setServicePackage('Gói Kế toán & Đại lý thuế HKD - Nhóm 1 (< 1 tỷ/năm)');
    } else if (group === 'NHOM_2') {
      setAnnualRevenue(2000000000);
      setAccountingStandard('Thông tư 152/2025/TT-BTC (4 mẫu sổ KT chuẩn)');
      setTaxDeclarationCycle('QUY');
      setMonthlyFee(1500000);
      setServicePackage('Gói Kế toán & Đại lý thuế HKD - Nhóm 2 (1 - 3 tỷ/năm)');
    } else if (group === 'NHOM_3') {
      setAnnualRevenue(15000000000);
      setAccountingStandard('Thông tư 152/2025/TT-BTC (Trọn bộ 7 mẫu sổ kế toán)');
      setTaxDeclarationCycle('QUY');
      setMonthlyFee(2500000);
      setServicePackage('Gói Kế toán & Đại lý thuế HKD - Nhóm 3 (3 - 30 tỷ/năm)');
    } else if (group === 'NHOM_4') {
      setAnnualRevenue(35000000000);
      setAccountingStandard('Thông tư 152/2025/TT-BTC (Quy mô tương đương Doanh nghiệp)');
      setTaxDeclarationCycle('THANG');
      setMonthlyFee(3500000);
      setServicePackage('Gói Kế toán & Đại lý thuế HKD - Nhóm 4 (> 30 tỷ/năm)');
    }
  };

  const handleDurationChange = (months: number) => {
    setContractDurationMonths(months);
    if (!serviceStartDate) return;
    const start = new Date(serviceStartDate);
    start.setMonth(start.getMonth() + months);
    start.setDate(start.getDate() - 1);
    setContractEndDate(start.toISOString().split('T')[0]);
  };

  const handleStartDateChange = (newStart: string) => {
    setServiceStartDate(newStart);
    if (contractDurationMonths > 0 && newStart) {
      const start = new Date(newStart);
      start.setMonth(start.getMonth() + contractDurationMonths);
      start.setDate(start.getDate() - 1);
      setContractEndDate(start.toISOString().split('T')[0]);
    }
  };

  const handlePeriodicPackageChange = (pkgId: string) => {
    if (pkgId === 'CUSTOM') {
      setIsCustomPackage(true);
      setSelectedPackageId('CUSTOM');
      return;
    }
    setIsCustomPackage(false);
    setSelectedPackageId(pkgId);
    const found = SERVICE_PACKAGES.find(p => p.id === pkgId);
    if (found) {
      setServicePackage(found.name);
      setMonthlyFee(found.defaultMonthlyFee);
    }
  };

  // Renewal Alert Date text
  const renewalAlertDateText = useMemo(() => {
    if (!contractEndDate) return 'Chưa xác định';
    const end = new Date(contractEndDate);
    end.setDate(end.getDate() - renewalNoticeDays);
    return formatDate(end.toISOString().split('T')[0]);
  }, [contractEndDate, renewalNoticeDays]);

  // =========================================================================
  // MULTI AD-HOC SERVICES MANAGEMENT
  // =========================================================================

  // Filtered Ad-hoc services for picking
  const filteredAvailableServices = useMemo(() => {
    return AD_HOC_SERVICES.filter(s => {
      const matchesGroup = adHocGroupFilter === 'ALL' || s.group === adHocGroupFilter;
      const matchesSearch = !adHocSearchTerm.trim() || 
        s.code.toLowerCase().includes(adHocSearchTerm.toLowerCase()) ||
        s.name.toLowerCase().includes(adHocSearchTerm.toLowerCase()) ||
        s.description.toLowerCase().includes(adHocSearchTerm.toLowerCase()) ||
        s.groupName.toLowerCase().includes(adHocSearchTerm.toLowerCase());
      return matchesGroup && matchesSearch;
    });
  }, [adHocGroupFilter, adHocSearchTerm]);

  // Check if a service code is already selected
  const isServiceSelected = (code: string) => {
    return selectedAdHocList.some(item => item.code === code);
  };

  // Add a service to the selected list
  const handleAddService = (service: typeof AD_HOC_SERVICES[0]) => {
    if (isServiceSelected(service.code)) {
      // Toggle off if already selected
      handleRemoveService(service.code);
      return;
    }
    const newEntry: SelectedAdHocServiceEntry = {
      id: `adhoc-${service.code}-${Date.now()}`,
      code: service.code,
      name: service.name,
      group: service.group,
      groupName: service.groupName,
      department: service.department || 'KE_TOAN_THUE',
      unitFee: service.fee,
      quantity: 1,
      thirdPartyFee: 0,
      dueDate: defaultDueDate,
      priority: service.defaultPriority || 'CAO',
      defaultRiskLevel: service.defaultRiskLevel || 'TRUNG_BINH',
      description: service.description,
      feeDisplay: service.feeDisplay,
      suggestedWorkflow: service.suggestedWorkflow,
      suggestedChecklist: service.suggestedChecklist,
    };
    setSelectedAdHocList(prev => [...prev, newEntry]);
  };

  // Remove a service from selected list
  const handleRemoveService = (code: string) => {
    setSelectedAdHocList(prev => prev.filter(item => item.code !== code));
  };

  // Update specific field in selected service entry
  const handleUpdateServiceField = <K extends keyof SelectedAdHocServiceEntry>(
    code: string,
    field: K,
    value: SelectedAdHocServiceEntry[K]
  ) => {
    setSelectedAdHocList(prev => prev.map(item => {
      if (item.code === code) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // Quick Combo presets
  const applyQuickCombo = (comboName: string, serviceCodes: string[]) => {
    const itemsToAdd: SelectedAdHocServiceEntry[] = [];
    serviceCodes.forEach(code => {
      const s = AD_HOC_SERVICES.find(srv => srv.code === code);
      if (s && !selectedAdHocList.some(x => x.code === code)) {
        itemsToAdd.push({
          id: `adhoc-${s.code}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          code: s.code,
          name: s.name,
          group: s.group,
          groupName: s.groupName,
          department: s.department || 'KE_TOAN_THUE',
          unitFee: s.fee,
          quantity: 1,
          thirdPartyFee: 0,
          dueDate: defaultDueDate,
          priority: s.defaultPriority || 'CAO',
          defaultRiskLevel: s.defaultRiskLevel || 'TRUNG_BINH',
          description: s.description,
          feeDisplay: s.feeDisplay,
          suggestedWorkflow: s.suggestedWorkflow,
          suggestedChecklist: s.suggestedChecklist,
        });
      }
    });
    if (itemsToAdd.length > 0) {
      setSelectedAdHocList(prev => [...prev, ...itemsToAdd]);
    }
  };

  // Financial totals calculation
  const totalServiceFee = useMemo(() => {
    return selectedAdHocList.reduce((sum, item) => sum + (item.unitFee * item.quantity), 0);
  }, [selectedAdHocList]);

  const totalThirdPartyFee = useMemo(() => {
    return selectedAdHocList.reduce((sum, item) => sum + (item.thirdPartyFee || 0), 0);
  }, [selectedAdHocList]);

  const grandTotalAdHocFee = useMemo(() => {
    return totalServiceFee + totalThirdPartyFee;
  }, [totalServiceFee, totalThirdPartyFee]);

  const remainingAdHocDebt = useMemo(() => {
    return Math.max(0, grandTotalAdHocFee - adHocDeposit);
  }, [grandTotalAdHocFee, adHocDeposit]);

  // =========================================================================
  // SUBMIT HANDLER
  // =========================================================================
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const assignedStaff = users.find(u => u.id === assignedStaffId);
    const reviewerStaff = users.find(u => u.id === reviewerStaffId);
    const effectiveTaxCode = taxCode.trim() || `TMP-${Date.now().toString().slice(-6)}`;
    const custId = isEditing && editingCustomer ? editingCustomer.id : `CUST-${Date.now()}`;

    let calculatedRevenueBracket = '';
    if (customerType === 'HO_KINH_DOANH') {
      calculatedRevenueBracket = HOUSEHOLD_BUSINESS_GROUP_LABELS[householdGroup]?.name || '';
    } else if (annualRevenue > 50000000000) {
      calculatedRevenueBracket = 'Doanh thu > 50 tỷ VNĐ/năm (Kê khai theo Tháng)';
    } else {
      calculatedRevenueBracket = 'Doanh thu ≤ 50 tỷ VNĐ/năm (Kê khai theo Quý)';
    }

    const generatedContractNum = contractNumber.trim() || `HĐ-${new Date().getFullYear()}/${effectiveTaxCode.slice(-4)}`;
    const isAdHocOnly = intakeNature === 'ADHOC';

    // Summary service package description
    let adHocPackageName = 'Dịch vụ phát sinh';
    if (selectedAdHocList.length === 1) {
      adHocPackageName = `VỤ VIỆC: [${selectedAdHocList[0].code}] ${selectedAdHocList[0].name}`;
    } else if (selectedAdHocList.length > 1) {
      adHocPackageName = `VỤ VIỆC (${selectedAdHocList.length} DV): ${selectedAdHocList.map(s => `[${s.code}] ${s.name}`).join('; ')}`;
    }

    const newCustomer: Customer = {
      ...(isEditing && editingCustomer ? editingCustomer : {}),
      id: custId,
      code: isEditing && editingCustomer ? editingCustomer.code : undefined,
      name: name.trim(),
      taxCode: effectiveTaxCode,
      type: isAdHocOnly ? (customerType || 'CONG_TY') : customerType,
      serviceType: intakeNature === 'PERIODIC' ? 'DINH_KY' : (intakeNature === 'ADHOC' ? 'PHAT_SINH' : 'HON_HOP'),
      householdGroup: (!isAdHocOnly && customerType === 'HO_KINH_DOANH') ? householdGroup : undefined,
      taxDeclarationCycle: isAdHocOnly ? undefined : taxDeclarationCycle,
      annualRevenue: isAdHocOnly ? 0 : (Number(annualRevenue) || 0),
      annualRevenueBracket: isAdHocOnly ? undefined : calculatedRevenueBracket,
      accountingStandard: isAdHocOnly ? undefined : accountingStandard.trim(),

      address: address.trim(),
      taxDepartment: taxDepartment.trim(),
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      email: email.trim(),

      // Contract and Cycle Timeline
      contractNumber: isAdHocOnly ? `VV-${new Date().getFullYear()}/${effectiveTaxCode.slice(-4)}` : generatedContractNum,
      serviceStartDate: isAdHocOnly ? CURRENT_SYSTEM_DATE : (serviceStartDate || CURRENT_SYSTEM_DATE),
      contractEndDate: isAdHocOnly ? undefined : contractEndDate,
      contractDurationMonths: isAdHocOnly ? 0 : contractDurationMonths,
      billingCycle: isAdHocOnly ? 'THEO_VU_VIEC' : billingCycle,
      contractStatus: isEditing && editingCustomer?.contractStatus ? editingCustomer.contractStatus : 'HIEU_LUC',
      contractAutoRenew: isAdHocOnly ? false : contractAutoRenew,
      renewalNoticeDays: isAdHocOnly ? 0 : renewalNoticeDays,

      servicePackage: isAdHocOnly 
        ? adHocPackageName
        : (servicePackage.trim() || 'Đại lý thuế trọn gói'),
      monthlyFee: isAdHocOnly ? 0 : (Number(monthlyFee) || 0),
      vatType: isAdHocOnly ? undefined : vatType,
      debtAmount: isEditing && editingCustomer 
        ? (editingCustomer.debtAmount || 0) 
        : (isAdHocOnly ? remainingAdHocDebt : (Number(monthlyFee) || 0) + remainingAdHocDebt),
      paymentDueDay: isEditing && editingCustomer?.paymentDueDay ? editingCustomer.paymentDueDay : 10,
      paymentTermDays: isEditing && editingCustomer?.paymentTermDays ? editingCustomer.paymentTermDays : 10,
      creditLimit: isEditing && editingCustomer?.creditLimit ? editingCustomer.creditLimit : 15000000,
      preferredPaymentMethod: isEditing && editingCustomer?.preferredPaymentMethod ? editingCustomer.preferredPaymentMethod : 'Chuyển khoản VCB',

      // Assigned Staff
      assignedStaffId: assignedStaff?.id || (isEditing && editingCustomer?.assignedStaffId ? editingCustomer.assignedStaffId : 'USR-003'),
      assignedStaffName: assignedStaff?.name || (isEditing && editingCustomer?.assignedStaffName ? editingCustomer.assignedStaffName : 'Lê Hoàng Nam'),
      reviewerStaffId: reviewerStaff?.id || (isEditing && editingCustomer?.reviewerStaffId ? editingCustomer.reviewerStaffId : 'USR-003'),
      reviewerStaffName: reviewerStaff?.name || (isEditing && editingCustomer?.reviewerStaffName ? editingCustomer.reviewerStaffName : 'Trần Thị Mai'),
      riskLevel,

      // Token CKS & E-Invoice (for periodic or if provided)
      digitalSignatureProvider: digitalSignatureProvider || undefined,
      digitalSignatureExpiry: digitalSignatureExpiry || undefined,
      eInvoiceProvider: eInvoiceProvider || undefined,
      eInvoiceTotalQuota: isAdHocOnly ? undefined : (Number(eInvoiceTotalQuota) || 500),

      // Business Sub-License
      businessLicenseName: businessLicenseName.trim() || undefined,
      businessLicenseExpiry: businessLicenseExpiry.trim() || undefined,

      notes: notes.trim() +
        (!isEditing && selectedAdHocList.length > 0 ? `\n[Danh sách ${selectedAdHocList.length} dịch vụ phát sinh]:\n` + selectedAdHocList.map(s => `• [${s.code}] ${s.name} (Phí: ${formatCurrency(s.unitFee * s.quantity)}, Lệ phí: ${formatCurrency(s.thirdPartyFee)})`).join('\n') : ''),
    };

    // Save or Update Customer
    if (isEditing && onUpdateCustomer) {
      onUpdateCustomer(newCustomer);
    } else {
      onCreateCustomer(newCustomer);
    }

    // If Periodic or Both: Automatically dispatch all periodic tasks matching the selected service package!
    if ((intakeNature === 'PERIODIC' || intakeNature === 'BOTH') && autoDispatchPeriodicTasks) {
      storageService.autoDispatchPeriodicTasksForPackageCustomers({
        customerId: custId,
        targetPackage: selectedPackageId === 'CUSTOM' ? servicePackage : (selectedPackageId || 'ALL'),
        periodMonth: new Date().getMonth() + 1,
        periodYear: new Date().getFullYear(),
        periodQuarter: Math.ceil((new Date().getMonth() + 1) / 3),
        cycleType: 'ALL',
        overwriteExisting: true,
        actor: currentUser || undefined,
      });
    }

    // If Ad-Hoc or Both: automatically create corresponding task for EACH selected service with workflow & checklist!
    if ((intakeNature === 'ADHOC' || intakeNature === 'BOTH') && selectedAdHocList.length > 0) {
      selectedAdHocList.forEach((srv, idx) => {
        const taskTitle = `[${srv.code}] ${srv.name} - ${name.trim()}`;
        const totalFeeForTask = (srv.unitFee * srv.quantity) + srv.thirdPartyFee;
        
        const newTask: Task = {
          id: `TSK-${Date.now()}-${idx}`,
          code: `TASK-${Math.floor(1000 + Math.random() * 9000)}`,
          title: taskTitle,
          description: `${srv.description}\n\n• Biểu phí dịch vụ: ${formatCurrency(srv.unitFee)} x ${srv.quantity} = ${formatCurrency(srv.unitFee * srv.quantity)}\n• Lệ phí bên thứ 3/nhà nước: ${formatCurrency(srv.thirdPartyFee)}\n• Tổng chi phí mục này: ${formatCurrency(totalFeeForTask)}`,
          customerId: custId,
          customerName: name.trim(),
          customerTaxCode: effectiveTaxCode,
          department: srv.department || 'KE_TOAN_THUE',
          category: 'THUE_KE_TOAN',
          createdById: currentUser?.id || 'USR-030',
          createdByName: currentUser?.name || 'Quản Trị Hệ Thống (Admin)',
          assigneeId: assignedStaff?.id || 'USR-003',
          assigneeName: assignedStaff?.name || 'Lê Hoàng Nam',
          reviewerId: reviewerStaff?.id || 'USR-003',
          reviewerName: reviewerStaff?.name || 'Trần Thị Mai',
          approverId: 'USR-030',
          approverName: 'Quản Trị Hệ Thống (Admin)',
          createdAt: new Date().toISOString(),
          dueDate: srv.dueDate || defaultDueDate,
          dueTime: '17:00',
          priority: srv.priority || 'CAO',
          riskLevel: srv.defaultRiskLevel || 'TRUNG_BINH',
          status: 'MOI_TAO',
          workflowSteps: srv.suggestedWorkflow.map((step, sIdx) => ({
            id: `step-${Date.now()}-${idx}-${sIdx}`,
            order: sIdx + 1,
            name: step.name,
            isCompleted: false,
            isMandatory: step.isMandatory,
            requiredEvidence: step.requiredEvidence,
          })),
          checklist: srv.suggestedChecklist.map((item, cIdx) => ({
            id: `chk-${Date.now()}-${idx}-${cIdx}`,
            title: item.title,
            isCompleted: false,
            required: item.required,
          })),
          attachments: [],
          comments: [],
          isRecurring: false,
          isTaxObligation: false,
          serviceCode: srv.code,
          serviceName: srv.name,
          serviceFee: srv.unitFee,
          serviceFeeDisplay: srv.feeDisplay,
          serviceQuantity: srv.quantity,
          serviceTotalFee: totalFeeForTask,
          tags: [srv.code, 'PHAT_SINH_VU_VIEC', srv.group],
          updatedAt: new Date().toISOString(),
        };

        storageService.createTask(newTask, currentUser || undefined);
      });
    }

    onClose();
  };

  const hasPermission = isEditing
    ? PermissionService.canEditCustomer(currentUser, editingCustomer || undefined)
    : PermissionService.canCreateCustomer(currentUser);

  if (!hasPermission) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-2xl w-full max-w-md p-6 text-center space-y-4 animate-in fade-in zoom-in-95">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Quyền Hạn Bị Giới Hạn</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              {isEditing 
                ? 'Nhân viên và Trưởng nhóm không có thẩm quyền sửa đổi hồ sơ khách hàng, hợp đồng dịch vụ và phân công nhân sự. Vui lòng liên hệ Trưởng phòng hoặc Ban Giám Đốc.'
                : 'Chỉ có Ban Giám Đốc hoặc Trưởng Phòng mới có quyền tạo mới hồ sơ khách hàng.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Đóng Cửa Sổ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-end">
      <div className="bg-white dark:bg-slate-900 shadow-2xl w-full max-w-4xl h-full flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 border-l border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-850 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl text-white shadow-xs ${
              intakeNature === 'PERIODIC' ? 'bg-blue-600' : intakeNature === 'ADHOC' ? 'bg-amber-600' : 'bg-indigo-600'
            }`}>
              {intakeNature === 'PERIODIC' ? <Calendar className="h-5 w-5" /> : intakeNature === 'ADHOC' ? <Zap className="h-5 w-5" /> : <Layers className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{isEditing ? `Sửa Thông Tin Khách Hàng: ${name || editingCustomer?.name}` : 'Tiếp Nhận & Tạo Hồ Sơ Khách Hàng Mới'}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  intakeNature === 'PERIODIC' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                  intakeNature === 'ADHOC' ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300' :
                  'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                }`}>
                  {isEditing ? 'Chế độ chỉnh sửa' : (intakeNature === 'PERIODIC' ? 'Gói Định Kỳ' : intakeNature === 'ADHOC' ? `Vụ Việc (${selectedAdHocList.length} DV)` : `Gói + ${selectedAdHocList.length} Vụ Việc`)}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isEditing ? 'Cập nhật thông tin pháp nhân, hợp đồng dịch vụ, phân công nhân sự và thiết lập thuế - kế toán' : 'Thiết lập thông tin pháp nhân, lựa chọn nhiều dịch vụ phát sinh hoặc hợp đồng đại lý thuế trọn gói'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
          
          {/* ========================================================================= */}
          {/* SECTION 0: BỘ CHỌN LOẠI HÌNH DỊCH VỤ TIẾP NHẬN */}
          {/* ========================================================================= */}
          <div className="p-3.5 bg-gradient-to-r from-slate-50 via-slate-100/70 to-slate-50 dark:from-slate-800/80 dark:via-slate-850 dark:to-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-2 text-xs">
                <SlidersHorizontal className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>1. Phân Loại Hình Thức Dịch Vụ Tiếp Nhận Khách Hàng:</span>
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Chọn loại hình để tự động tối ưu hóa các trường dữ liệu</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: PERIODIC */}
              <button
                type="button"
                onClick={() => setIntakeNature('PERIODIC')}
                className={`p-3.5 rounded-xl text-left border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  intakeNature === 'PERIODIC'
                    ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-600 shadow-md ring-2 ring-blue-400/30'
                    : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-blue-700 dark:text-blue-400 flex items-center space-x-1.5">
                      <Calendar className="h-4 w-4" />
                      <span>DỊCH VỤ ĐỊNH KỲ</span>
                    </span>
                    {intakeNature === 'PERIODIC' && <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />}
                  </div>
                  <div className="mt-1 font-bold text-slate-800 dark:text-slate-200 text-xs">
                    Hợp đồng Kế toán & Đại lý thuế trọn gói
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500 leading-relaxed">
                    Kê khai thuế Tháng/Quý, BCTC, sổ sách kế toán, hợp đồng dài hạn (1-3 năm), cảnh báo tái ký.
                  </p>
                </div>
              </button>

              {/* Option 2: ADHOC */}
              <button
                type="button"
                onClick={() => setIntakeNature('ADHOC')}
                className={`p-3.5 rounded-xl text-left border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  intakeNature === 'ADHOC'
                    ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-600 shadow-md ring-2 ring-amber-400/30'
                    : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700 hover:border-amber-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-amber-700 dark:text-amber-400 flex items-center space-x-1.5">
                      <Zap className="h-4 w-4" />
                      <span>DỊCH VỤ PHÁT SINH (VỤ VIỆC)</span>
                    </span>
                    {intakeNature === 'ADHOC' && <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />}
                  </div>
                  <div className="mt-1 font-bold text-slate-800 dark:text-slate-200 text-xs">
                    49 Dịch vụ chuẩn từng lần (Chọn nhiều DV)
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500 leading-relaxed">
                    ĐKKD, BHXH, Quyết toán giải trình thuế, Mua CKS, HĐĐT... Phí theo vụ việc, tạm ứng và deadline bàn giao.
                  </p>
                </div>
              </button>

              {/* Option 3: BOTH */}
              <button
                type="button"
                onClick={() => setIntakeNature('BOTH')}
                className={`p-3.5 rounded-xl text-left border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  intakeNature === 'BOTH'
                    ? 'bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-600 shadow-md ring-2 ring-indigo-400/30'
                    : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-indigo-700 dark:text-indigo-400 flex items-center space-x-1.5">
                      <Layers className="h-4 w-4" />
                      <span>KẾT HỢP (ĐỊNH KỲ + VỤ VIỆC)</span>
                    </span>
                    {intakeNature === 'BOTH' && <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />}
                  </div>
                  <div className="mt-1 font-bold text-slate-800 dark:text-slate-200 text-xs">
                    Ký gói dài hạn kèm các dịch vụ ban đầu
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500 leading-relaxed">
                    Vừa ký trọn gói kế toán vừa thực hiện combo dịch vụ mở đầu (mua CKS, đăng ký HĐĐT, làm giấy phép con...).
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* DUPLICATE WARNING ALERT */}
          {duplicateWarning && duplicateWarning.isDuplicate && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border-l-4 border-red-500 rounded-r-xl text-red-800 dark:text-red-300 flex items-start space-x-2.5">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-bold">Cảnh báo trùng lặp hồ sơ: </span>
                <span>{duplicateWarning.warningMessage}</span>
                {duplicateWarning.existingCustomer && (
                  <span className="block mt-0.5 text-[10px] opacity-90 font-medium">
                    (Khách hàng hiện có: <strong className="underline">{duplicateWarning.existingCustomer.name}</strong> - Phụ trách: {duplicateWarning.existingCustomer.assignedStaffName || 'N/A'})
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 1: THÔNG TIN PHÁP NHÂN & LIÊN HỆ TIẾP NHẬN */}
          {/* ========================================================================= */}
          <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center space-x-1.5 font-bold text-slate-900 dark:text-white text-xs">
              <Building className="h-4 w-4 text-blue-600" />
              <span>2. Thông Tin Khách Hàng & Pháp Nhân Tiếp Nhận</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tên Khách Hàng / Công Ty / Hộ Kinh Doanh <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={intakeNature === 'ADHOC' ? "Ví dụ: Nguyễn Văn An (Thành lập DN mới) hoặc CÔNG TY TNHH ABC..." : "CÔNG TY TNHH XÂY DỰNG & THƯƠNG MẠI MINH ĐỨC..."}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mã Số Thuế (MST) / CCCD {intakeNature === 'PERIODIC' && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={taxCode}
                  onChange={(e) => setTaxCode(e.target.value.trim().toUpperCase())}
                  placeholder={intakeNature === 'ADHOC' ? "MST hoặc CCCD đại diện..." : "0108999888..."}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-blue-600 dark:text-blue-400"
                  required={intakeNature === 'PERIODIC'}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Địa Chỉ Trụ Sở ĐKKD / Địa Chỉ Giao Dịch <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Tầng 5, Tòa nhà Licogi 13, 164 Khuất Duy Tiến, Thanh Xuân, Hà Nội..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cơ Quan Thuế Quản Lý
                </label>
                <input
                  type="text"
                  list="tax-departments-list"
                  value={taxDepartment}
                  onChange={(e) => setTaxDepartment(e.target.value)}
                  placeholder="Chọn hoặc nhập tên Thuế cơ sở/Cục Thuế..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                />
                <datalist id="tax-departments-list">
                  {COMMON_TAX_DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Người Liên Hệ Chính / Giám Đốc <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Ông/Bà..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Số Điện Thoại / Zalo <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912 345 678..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Nhận Báo Cáo / Hóa Đơn
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ketoan@doanhnghiep.vn..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono"
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BRANCH A: NẾU CÓ DỊCH VỤ ĐỊNH KỲ (HỢP ĐỒNG TRỌN GÓI) - ĐƠN GIẢN HÓA TRỰC QUAN */}
          {/* ========================================================================= */}
          {(intakeNature === 'PERIODIC' || intakeNature === 'BOTH') && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* SECTION A1: CHỌN GÓI ĐỊNH KỲ THÔNG MINH 1-CLICK */}
              <div className="p-4 bg-gradient-to-b from-blue-50/80 to-slate-50/60 dark:from-blue-950/30 dark:to-slate-900/50 rounded-2xl border border-blue-200/80 dark:border-blue-900/50 shadow-xs space-y-3.5">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-blue-100 dark:border-blue-900/40">
                  <div className="flex items-center space-x-2 text-blue-900 dark:text-blue-200">
                    <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-xs">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-extrabold text-xs">
                        3. Chọn Gói Dịch Vụ Định Kỳ (1-Click Tự Động Thiết Lập)
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Chọn gói tiêu chuẩn để hệ thống tự động điền đơn giá, kỳ thuế và chuẩn kế toán
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100/80 dark:bg-blue-900/50 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                      Gói: {isCustomPackage ? 'Tùy chỉnh' : selectedPackageId}
                    </span>
                  </div>
                </div>

                {/* VISUAL PACKAGE CARDS (4 LỰA CHỌN GÓI TINH GỌN, TỐI GIẢN) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  
                  {/* GÓI A - CƠ BẢN */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomPackage(false);
                      setSelectedPackageId('PKG-A');
                      setServicePackage('GÓI A – CƠ BẢN (Đại lý thuế & Kế toán trọn gói)');
                      setMonthlyFee(3000000);
                      setCustomerType('CONG_TY');
                      setTaxDeclarationCycle('QUY');
                      setAnnualRevenue(2500000000);
                      setAccountingStandard('Thông tư 133/2016/TT-BTC');
                    }}
                    className={`p-3 rounded-xl text-left border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      selectedPackageId === 'PKG-A' && !isCustomPackage
                        ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-600 shadow-sm ring-1 ring-blue-400/40'
                        : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700/80 hover:border-blue-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          GÓI A • CƠ BẢN
                        </span>
                        {selectedPackageId === 'PKG-A' && !isCustomPackage ? (
                          <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border border-slate-300 dark:border-slate-600" />
                        )}
                      </div>

                      <div className="mt-2 text-base font-extrabold text-blue-700 dark:text-blue-400 font-mono">
                        3.000.000 đ<span className="text-[10px] font-normal text-slate-500">/tháng</span>
                      </div>

                      <div className="mt-0.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                        Doanh nghiệp siêu nhỏ
                      </div>

                      <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-blue-500 font-bold">•</span>
                          <span>Dưới 80 hóa đơn / tháng</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-blue-500 font-bold">•</span>
                          <span>Kê khai Quý • Chuẩn TT 133</span>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* GÓI B - TIÊU CHUẨN */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomPackage(false);
                      setSelectedPackageId('PKG-B');
                      setServicePackage('GÓI B – TRUNG BÌNH (Đại lý thuế & Kế toán trọn gói)');
                      setMonthlyFee(5000000);
                      setCustomerType('CONG_TY');
                      setTaxDeclarationCycle('QUY');
                      setAnnualRevenue(15000000000);
                      setAccountingStandard('Thông tư 133/2016/TT-BTC');
                    }}
                    className={`p-3 rounded-xl text-left border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      selectedPackageId === 'PKG-B' && !isCustomPackage
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-600 shadow-sm ring-1 ring-emerald-400/40'
                        : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700/80 hover:border-emerald-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          GÓI B • TIÊU CHUẨN
                        </span>
                        {selectedPackageId === 'PKG-B' && !isCustomPackage ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border border-slate-300 dark:border-slate-600" />
                        )}
                      </div>

                      <div className="mt-2 text-base font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">
                        5.000.000 đ<span className="text-[10px] font-normal text-slate-500">/tháng</span>
                      </div>

                      <div className="mt-0.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                        Doanh nghiệp vừa & nhỏ
                      </div>

                      <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>Dưới 300 hóa đơn / tháng</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>Lương, BHXH • Chuẩn TT 133</span>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* GÓI C - TOÀN DIỆN */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomPackage(false);
                      setSelectedPackageId('PKG-C');
                      setServicePackage('GÓI C – TOÀN DIỆN (Đại lý thuế & Kế toán trọn gói)');
                      setMonthlyFee(8500000);
                      setCustomerType('CONG_TY');
                      setTaxDeclarationCycle('THANG');
                      setAnnualRevenue(55000000000);
                      setAccountingStandard('Thông tư 200/2014/TT-BTC');
                    }}
                    className={`p-3 rounded-xl text-left border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      selectedPackageId === 'PKG-C' && !isCustomPackage
                        ? 'bg-purple-50/70 dark:bg-purple-950/40 border-purple-600 shadow-sm ring-1 ring-purple-400/40'
                        : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700/80 hover:border-purple-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                          GÓI C • TOÀN DIỆN
                        </span>
                        {selectedPackageId === 'PKG-C' && !isCustomPackage ? (
                          <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border border-slate-300 dark:border-slate-600" />
                        )}
                      </div>

                      <div className="mt-2 text-base font-extrabold text-purple-700 dark:text-purple-400 font-mono">
                        8.500.000 đ<span className="text-[10px] font-normal text-slate-500">/tháng</span>
                      </div>

                      <div className="mt-0.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                        Doanh nghiệp lớn / Sản xuất
                      </div>

                      <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-purple-500 font-bold">•</span>
                          <span>Trên 300 hóa đơn / tháng</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-purple-500 font-bold">•</span>
                          <span>Kê khai Tháng • Chuẩn TT 200</span>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* GÓI HỘ KINH DOANH - TỐI GIẢN CHỌN 4 NHÓM TT 152/2025 */}
                  <div
                    onClick={() => {
                      handleHouseholdGroupChange(householdGroup || 'NHOM_2');
                    }}
                    className={`p-3 rounded-xl text-left border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      customerType === 'HO_KINH_DOANH' && !isCustomPackage
                        ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-500 shadow-sm ring-1 ring-amber-400/40'
                        : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700/80 hover:border-amber-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center space-x-1">
                          <span>🏪</span>
                          <span>HỘ KINH DOANH</span>
                        </span>
                        {customerType === 'HO_KINH_DOANH' && !isCustomPackage ? (
                          <CheckCircle2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border border-slate-300 dark:border-slate-600" />
                        )}
                      </div>

                      <div className="mt-2 text-base font-extrabold text-amber-700 dark:text-amber-400 font-mono">
                        {householdGroup === 'NHOM_1' ? '1.200.000 đ' :
                         householdGroup === 'NHOM_2' ? '1.500.000 đ' :
                         householdGroup === 'NHOM_3' ? '2.500.000 đ' : '3.500.000 đ'}
                        <span className="text-[10px] font-normal text-slate-500">/tháng</span>
                      </div>

                      <div className="mt-0.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                        Cửa hàng, HKD cá thể
                      </div>

                      {/* DROPDOWN CHỌN NHANH 4 NHÓM */}
                      <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={householdGroup}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleHouseholdGroupChange(e.target.value as HouseholdBusinessGroup);
                          }}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-md text-[11px] font-bold text-amber-900 dark:text-amber-200 focus:ring-1 focus:ring-amber-500 cursor-pointer"
                        >
                          <option value="NHOM_1">Nhóm 1 (&lt; 1 tỷ) — 1.2 tr</option>
                          <option value="NHOM_2">Nhóm 2 (1 - 3 tỷ) — 1.5 tr</option>
                          <option value="NHOM_3">Nhóm 3 (3 - 30 tỷ) — 2.5 tr</option>
                          <option value="NHOM_4">Nhóm 4 (&gt; 30 tỷ) — 3.5 tr</option>
                        </select>
                      </div>
                    </div>
                  </div>

                </div>

                {/* TÙY CHỌN RIÊNG DROPDOWN / CUSTOM NAME */}
                <div className="pt-2 flex items-center justify-between gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomPackage(!isCustomPackage);
                      if (!isCustomPackage) {
                        setSelectedPackageId('CUSTOM');
                      } else {
                        setSelectedPackageId('PKG-A');
                        setServicePackage('GÓI A – CƠ BẢN (Đại lý thuế & Kế toán trọn gói)');
                      }
                    }}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <span>{isCustomPackage ? '← Quay lại chọn gói tiêu chuẩn' : '⚙️ Tự nhập tên gói dịch vụ hoặc chọn gói khác trong danh mục'}</span>
                  </button>
                  {isCustomPackage && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                      Chế độ tùy chỉnh tự do
                    </span>
                  )}
                </div>

                {isCustomPackage && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 bg-white dark:bg-slate-850 p-3 rounded-xl border border-blue-300 dark:border-blue-700">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                        Tên Gói Dịch Vụ Hợp Đồng <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={servicePackage}
                        onChange={(e) => setServicePackage(e.target.value)}
                        placeholder="Ví dụ: Gói Kế Toán Thương Mại Điện Tử & Shopee..."
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                        Chọn Gói Tham Chiếu Từ Danh Mục
                      </label>
                      <select
                        value={selectedPackageId}
                        onChange={(e) => handlePeriodicPackageChange(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-medium"
                      >
                        {SERVICE_PACKAGES.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} — {p.feeDisplay}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* THÔNG SỐ ĐƠN GIÁ, THUẾ VAT & KỲ THUẾ */}
                <div className={`grid grid-cols-1 gap-3 pt-2 ${canViewFinancials ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2'}`}>
                  
                  {/* Phí hàng tháng */}
                  {canViewFinancials && (
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                        Phí Dịch Vụ Định Kỳ (VNĐ/tháng) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={monthlyFee}
                          onChange={(e) => setMonthlyFee(Number(e.target.value))}
                          step={100000}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-sm focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                          đ/tháng
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Lựa chọn VAT Dropdown */}
                  {canViewFinancials && (
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                        Tùy Chọn Thuế VAT <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={vatType}
                        onChange={(e) => setVatType(e.target.value as VatType)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="CHUA_VAT">Chưa gồm VAT (+10% VAT)</option>
                        <option value="DA_CO_VAT">Đã có VAT (Đã gồm 10%)</option>
                        <option value="KHONG_VAT">Không VAT (Không chịu thuế)</option>
                      </select>
                    </div>
                  )}

                  {/* Kỳ kê khai thuế */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                      Kỳ Kê Khai Thuế Định Kỳ <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setTaxDeclarationCycle('QUY')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                          taxDeclarationCycle === 'QUY'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        📅 Theo Quý
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaxDeclarationCycle('THANG')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                          taxDeclarationCycle === 'THANG'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        🗓️ Theo Tháng
                      </button>
                    </div>
                  </div>

                  {/* Loại hình pháp nhân */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                      Loại Hình Doanh Nghiệp / Pháp Nhân
                    </label>
                    <select
                      value={customerType}
                      onChange={(e) => handleCustomerTypeChange(e.target.value as CustomerType)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="CONG_TY">🏢 Doanh nghiệp / Công ty</option>
                      <option value="HO_KINH_DOANH">🏪 Hộ kinh doanh (TT 152)</option>
                      <option value="CA_NHAN">👤 Cá nhân / Thuê tài sản</option>
                    </select>
                  </div>

                </div>

                {/* Tính toán hiển thị chi tiết giá trị thanh toán & tiền thuế VAT */}
                {canViewFinancials && (
                  <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 text-xs">
                    <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300 font-medium">
                      {vatType === 'CHUA_VAT' && (
                        <span>🏷️ Giá trước thuế: <strong>{formatCurrency(monthlyFee)}</strong>/tháng</span>
                      )}
                      {vatType === 'DA_CO_VAT' && (
                        <span>🏷️ Giá trọn gói đã gồm VAT: <strong>{formatCurrency(monthlyFee)}</strong>/tháng</span>
                      )}
                      {vatType === 'KHONG_VAT' && (
                        <span>🏷️ Giá trọn gói không chịu thuế GTGT: <strong>{formatCurrency(monthlyFee)}</strong>/tháng</span>
                      )}
                    </div>
                    <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {vatType === 'CHUA_VAT' && (
                        <span>Tổng xuất hóa đơn: <strong>{formatCurrency(monthlyFee * 1.1)}</strong>/tháng <span className="text-[11px] font-normal text-emerald-600 dark:text-emerald-400/80">(VAT 10%: +{formatCurrency(monthlyFee * 0.1)})</span></span>
                      )}
                      {vatType === 'DA_CO_VAT' && (
                        <span>Tiền trước thuế: {formatCurrency(Math.round(monthlyFee / 1.1))} <span className="text-[11px] font-normal text-emerald-600 dark:text-emerald-400/80">(VAT 10%: {formatCurrency(monthlyFee - Math.round(monthlyFee / 1.1))})</span></span>
                      )}
                      {vatType === 'KHONG_VAT' && (
                        <span>Tổng thu: <strong>{formatCurrency(monthlyFee)}</strong>/tháng (0% VAT)</span>
                      )}
                    </div>
                  </div>
                )}

              </div>

              {/* SECTION A2: THỜI HẠN HỢP ĐỒNG & CẢNH BÁO TÁI KÝ (TINH GỌN) */}
              <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-xs">
                    <Calendar className="h-4 w-4 text-amber-600" />
                    <span>4. Thời Hạn Hợp Đồng & Cơ Chế Tái Ký</span>
                  </div>
                  
                  {/* Duration Presets */}
                  <div className="flex items-center space-x-1 bg-slate-200/70 dark:bg-slate-700/70 p-1 rounded-xl">
                    {[
                      { label: '6 Tháng', months: 6 },
                      { label: '1 Năm (Khuyên dùng)', months: 12 },
                      { label: '2 Năm', months: 24 },
                      { label: '3 Năm', months: 36 },
                    ].map((item) => (
                      <button
                        key={item.months}
                        type="button"
                        onClick={() => handleDurationChange(item.months)}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                          contractDurationMonths === item.months
                            ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                      Số Hợp Đồng
                    </label>
                    <input
                      type="text"
                      value={contractNumber}
                      onChange={(e) => setContractNumber(e.target.value)}
                      placeholder={`HĐ-${new Date().getFullYear()}/...`}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                      Ngày Bắt Đầu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={serviceStartDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                      Ngày Kết Thúc <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={contractEndDate}
                      onChange={(e) => {
                        setContractEndDate(e.target.value);
                        setContractDurationMonths(0);
                      }}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg text-xs font-bold text-amber-700 dark:text-amber-300"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                      Báo Tái Ký Trước
                    </label>
                    <select
                      value={renewalNoticeDays}
                      onChange={(e) => setRenewalNoticeDays(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium"
                    >
                      <option value={15}>Báo trước 15 ngày</option>
                      <option value={30}>Báo trước 30 ngày (Khuyên dùng)</option>
                      <option value={45}>Báo trước 45 ngày</option>
                      <option value={60}>Báo trước 60 ngày</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION A3: THIẾT BỊ THUẾ & CHỮ KÝ SỐ (GỌN NHẸ MẶC ĐỊNH SẴN) */}
              <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-slate-900 dark:text-white font-bold text-xs">
                  <span className="flex items-center space-x-1.5">
                    <KeyRound className="h-4 w-4 text-blue-600" />
                    <span>5. Công Cụ Kê Khai Thuế (Chữ Ký Số & Hóa Đơn Điện Tử)</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Đã điền thông số mặc định, có thể chỉnh sửa nếu cần
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                      Token Chữ Ký Số (CKS)
                    </label>
                    <select
                      value={digitalSignatureProvider}
                      onChange={(e) => setDigitalSignatureProvider(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium"
                    >
                      <option value="Viettel-CA">Viettel-CA (Khuyên dùng)</option>
                      <option value="VNPT-CA">VNPT-CA</option>
                      <option value="FPT-CA">FPT-CA</option>
                      <option value="BKAV-CA">BKAV-CA</option>
                      <option value="MISA-CA">MISA eSign</option>
                      <option value="EasyCA">EasyCA</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                      Hạn Dùng Chữ Ký Số <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={digitalSignatureExpiry}
                      onChange={(e) => setDigitalSignatureExpiry(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                      Hóa Đơn Điện Tử
                    </label>
                    <input
                      type="text"
                      value={eInvoiceProvider}
                      onChange={(e) => setEInvoiceProvider(e.target.value)}
                      placeholder="Viettel Sinvoice / MISA meInvoice..."
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* BRANCH B: NẾU LÀ DỊCH VỤ PHÁT SINH (HOẶC KẾT HỢP) - MULTI SERVICE SELECTION */}
          {/* ========================================================================= */}
          {(intakeNature === 'ADHOC' || intakeNature === 'BOTH') && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* SECTION B1: CHỌN NHIỀU DỊCH VỤ TRONG 49 DỊCH VỤ CHUẨN */}
              <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200/80 dark:border-amber-900/50 space-y-4">
                
                {/* Header & Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 text-amber-900 dark:text-amber-300 font-bold text-xs">
                    <Zap className="h-4 w-4 text-amber-600" />
                    <span>
                      {intakeNature === 'BOTH' ? '7. Lựa Chọn Dịch Vụ Phát Sinh Kèm Theo Ban Đầu' : '3. Lựa Chọn Dịch Vụ Vụ Việc Phát Sinh (Trong 49 Dịch Vụ Chuẩn)'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50 px-2.5 py-1 rounded-full flex items-center space-x-1 border border-amber-300 dark:border-amber-800">
                      <ShoppingBag className="h-3.5 w-3.5 text-amber-600" />
                      <span>Đã chọn: <strong>{selectedAdHocList.length}</strong> dịch vụ</span>
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      (Tổng 49 dịch vụ quy chuẩn)
                    </span>
                  </div>
                </div>

                {/* Quick Combo Presets */}
                <div className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-amber-200 dark:border-amber-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      <span>Gợi Ý Gói Combo Nghiệp Vụ Thường Gặp (Bấm để thêm nhanh):</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Hỗ trợ chọn cùng lúc nhiều dịch vụ</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyQuickCombo('Combo Thành lập DN mới', ['PL-01', 'PL-12', 'PM-01', 'PM-03'])}
                      className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 rounded-lg text-[11px] font-bold border border-amber-300 dark:border-amber-800 flex items-center space-x-1 transition-all cursor-pointer"
                    >
                      <Plus className="h-3 w-3 text-amber-600" />
                      <span>🚀 Combo Thành Lập Doanh Nghiệp (ĐKKD + BHXH + CKS + HĐĐT)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyQuickCombo('Combo Thay đổi ĐKKD', ['PL-01', 'PL-02', 'PL-05'])}
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-900 dark:text-blue-200 rounded-lg text-[11px] font-bold border border-blue-300 dark:border-blue-800 flex items-center space-x-1 transition-all cursor-pointer"
                    >
                      <Plus className="h-3 w-3 text-blue-600" />
                      <span>🏢 Combo Thay Đổi ĐKKD (Địa chỉ + ĐDTPL + Đổi tên)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyQuickCombo('Combo Quyết toán & Thanh tra', ['KT-03', 'KT-04', 'KT-05'])}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 rounded-lg text-[11px] font-bold border border-emerald-300 dark:border-emerald-800 flex items-center space-x-1 transition-all cursor-pointer"
                    >
                      <Plus className="h-3 w-3 text-emerald-600" />
                      <span>⚖️ Combo Quyết Toán Thuế Năm (TNCN + TNDN + Chốt nghĩa vụ)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyQuickCombo('Combo Công cụ Thuế', ['PM-01', 'PM-03'])}
                      className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-purple-900 dark:text-purple-200 rounded-lg text-[11px] font-bold border border-purple-300 dark:border-purple-800 flex items-center space-x-1 transition-all cursor-pointer"
                    >
                      <Plus className="h-3 w-3 text-purple-600" />
                      <span>💻 Combo Thiết Bị Thuế (Chữ Ký Số + Hóa Đơn Điện Tử)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyQuickCombo('Combo Cho Thuê Tài Sản', ['TS-01', 'TS-02'])}
                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-900 dark:text-rose-200 rounded-lg text-[11px] font-bold border border-rose-300 dark:border-rose-800 flex items-center space-x-1 transition-all cursor-pointer"
                    >
                      <Plus className="h-3 w-3 text-rose-600" />
                      <span>🏠 Combo Cho Thuê BĐS / Tài Sản</span>
                    </button>
                  </div>
                </div>

                {/* Filter group pills & Search Bar */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    {/* Search Input */}
                    <div className="relative w-full sm:w-72 shrink-0">
                      <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={adHocSearchTerm}
                        onChange={(e) => setAdHocSearchTerm(e.target.value)}
                        placeholder="Tìm theo mã PL-01, tên DV, từ khóa..."
                        className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                      />
                      {adHocSearchTerm && (
                        <button
                          type="button"
                          onClick={() => setAdHocSearchTerm('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Group Pills Scrollable */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar w-full">
                      {AD_HOC_SERVICE_GROUPS.map((grp) => (
                        <button
                          key={grp.key}
                          type="button"
                          onClick={() => setAdHocGroupFilter(grp.key)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                            adHocGroupFilter === grp.key
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-slate-700'
                          }`}
                        >
                          {grp.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Available Services Selector Box */}
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 max-h-56 overflow-y-auto">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400 pb-1 border-b border-slate-100 dark:border-slate-800">
                    <span>Danh mục dịch vụ chuẩn ({filteredAvailableServices.length} kết quả):</span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400">Click vào dịch vụ để thêm / bỏ chọn</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {filteredAvailableServices.map((service) => {
                      const isSelected = isServiceSelected(service.code);
                      return (
                        <div
                          key={service.code}
                          onClick={() => handleAddService(service)}
                          className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-start justify-between space-x-2 ${
                            isSelected
                              ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-500 ring-1 ring-amber-400/40 shadow-xs'
                              : 'bg-slate-50/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-amber-300 hover:bg-amber-50/30'
                          }`}
                        >
                          <div className="flex items-start space-x-2">
                            <div className={`mt-0.5 shrink-0 w-4 h-4 rounded flex items-center justify-center border ${
                              isSelected
                                ? 'bg-amber-600 border-amber-600 text-white'
                                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'
                            }`}>
                              {isSelected && <Check className="h-3 w-3" />}
                            </div>

                            <div>
                              <div className="flex items-center space-x-1.5 flex-wrap">
                                <span className="font-mono font-bold text-[11px] text-amber-700 dark:text-amber-400">
                                  [{service.code}]
                                </span>
                                <span className="font-bold text-xs text-slate-900 dark:text-white">
                                  {service.name}
                                </span>
                              </div>
                              <div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                                {service.description}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400 block font-mono">
                              {service.feeDisplay}
                            </span>
                            <span className="text-[9px] text-slate-400">
                              {service.groupName.split('.')[0] || 'Dịch vụ'}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {filteredAvailableServices.length === 0 && (
                      <div className="col-span-2 text-center py-6 text-slate-400">
                        Không tìm thấy dịch vụ nào phù hợp với từ khóa "{adHocSearchTerm}"
                      </div>
                    )}
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* LIST OF SELECTED SERVICES (DANH SÁCH DỊCH VỤ ĐÃ CHỌN CHO KHÁCH HÀNG NÀY) */}
                {/* ========================================================================= */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center space-x-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Danh Sách Dịch Vụ Tiếp Nhận Cho Khách Hàng Này ({selectedAdHocList.length} dịch vụ):</span>
                    </span>
                    {selectedAdHocList.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedAdHocList([])}
                        className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold"
                      >
                        Xóa tất cả ({selectedAdHocList.length})
                      </button>
                    )}
                  </div>

                  {selectedAdHocList.length === 0 ? (
                    <div className="p-6 bg-white dark:bg-slate-850 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
                      <ShoppingBag className="h-8 w-8 text-slate-400 mx-auto" />
                      <p className="font-bold text-slate-600 dark:text-slate-300 text-xs">
                        Chưa chọn dịch vụ phát sinh nào
                      </p>
                      <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                        Vui lòng click vào các dịch vụ ở danh mục phía trên hoặc bấm chọn nhanh một gói Combo để tiếp nhận cho khách hàng.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedAdHocList.map((item, index) => {
                        const itemSubtotal = (item.unitFee * item.quantity) + (item.thirdPartyFee || 0);
                        const isExpanded = expandedPreviewCode === item.code;

                        return (
                          <div
                            key={item.id || item.code}
                            className="p-3.5 bg-white dark:bg-slate-850 rounded-xl border border-amber-300 dark:border-amber-800/80 shadow-xs space-y-3"
                          >
                            {/* Line Item Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                              <div className="flex items-center space-x-2">
                                <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold text-[10px] flex items-center justify-center">
                                  {index + 1}
                                </span>
                                <span className="font-mono font-bold text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                                  {item.code}
                                </span>
                                <span className="font-bold text-xs text-slate-900 dark:text-white">
                                  {item.name}
                                </span>
                                <span className="text-[10px] text-slate-400 hidden sm:inline">
                                  • {item.groupName}
                                </span>
                              </div>

                              <div className="flex items-center space-x-2">
                                <button
                                  type="button"
                                  onClick={() => setExpandedPreviewCode(isExpanded ? null : item.code)}
                                  className="text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold flex items-center space-x-1"
                                >
                                  <span>{isExpanded ? 'Ẩn quy trình' : 'Xem quy trình & checklist'}</span>
                                  {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveService(item.code)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                                  title="Xóa dịch vụ này"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            {/* Service Editable Fields Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-1">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                  Đơn Giá Dịch Vụ (VNĐ) <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="number"
                                  value={item.unitFee}
                                  onChange={(e) => handleUpdateServiceField(item.code, 'unitFee', Number(e.target.value))}
                                  step={100000}
                                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs"
                                  required
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                  Số Lượng
                                </label>
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateServiceField(item.code, 'quantity', Math.max(1, Number(e.target.value)))}
                                  min={1}
                                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-slate-900 dark:text-white text-xs text-center"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                  Lệ Phí Nhà Nước (VNĐ)
                                </label>
                                <input
                                  type="number"
                                  value={item.thirdPartyFee}
                                  onChange={(e) => handleUpdateServiceField(item.code, 'thirdPartyFee', Number(e.target.value))}
                                  step={50000}
                                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-700 dark:text-slate-300 text-xs"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                  Hạn Bàn Giao (Deadline)
                                </label>
                                <input
                                  type="date"
                                  value={item.dueDate}
                                  onChange={(e) => handleUpdateServiceField(item.code, 'dueDate', e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-bold text-xs"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                  Thành Tiền Mục Này
                                </label>
                                <div className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-900/60 font-mono font-extrabold text-amber-800 dark:text-amber-300 text-xs text-right">
                                  {formatCurrency(itemSubtotal)}
                                </div>
                              </div>
                            </div>

                            {/* Collapsible Workflow & Checklist Preview */}
                            {isExpanded && (
                              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] animate-in fade-in duration-150">
                                <div>
                                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5 mb-1.5">
                                    <FolderCheck className="h-3.5 w-3.5 text-blue-600" />
                                    <span>Quy trình các bước thực hiện chuẩn:</span>
                                  </div>
                                  <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                                    {item.suggestedWorkflow.map((step, sIdx) => (
                                      <li key={sIdx} className="flex items-start space-x-1.5">
                                        <span className="font-mono text-slate-400 text-[10px]">{sIdx + 1}.</span>
                                        <span>{step.name}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <div>
                                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5 mb-1.5">
                                    <ListChecks className="h-3.5 w-3.5 text-amber-600" />
                                    <span>Hồ sơ & Checklist kiểm tra:</span>
                                  </div>
                                  <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                                    {item.suggestedChecklist.map((chk, cIdx) => (
                                      <li key={cIdx} className="flex items-start space-x-1.5">
                                        <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                                        <span>{chk.title}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

              {/* SECTION B2: TỔNG HỢP CHI PHÍ VỤ VIỆC & TẠM ỨNG */}
              <div className="p-4 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 font-bold text-slate-900 dark:text-white text-xs">
                    <CreditCard className="h-4 w-4 text-emerald-600" />
                    <span>
                      {intakeNature === 'BOTH' ? '8. Tổng Hợp Chi Phí Vụ Việc & Tạm Ứng' : '4. Tổng Hợp Chi Phí Vụ Việc & Tạm Ứng'}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                    Tự động tạo {selectedAdHocList.length} công việc & checklist chuẩn
                  </span>
                </div>

                {/* Financial Summary Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-medium">Tổng Phí Dịch Vụ:</span>
                    <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(totalServiceFee)}
                    </span>
                    <span className="text-[9px] text-slate-400 block">{selectedAdHocList.length} dịch vụ đã chọn</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block font-medium">Tổng Lệ Phí Bên Thứ 3:</span>
                    <span className="text-sm font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {formatCurrency(totalThirdPartyFee)}
                    </span>
                    <span className="text-[9px] text-slate-400 block">Lệ phí nhà nước, phôi dấu</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block font-medium">Số Tiền Khách Đã Tạm Ứng:</span>
                    <input
                      type="number"
                      value={adHocDeposit}
                      onChange={(e) => setAdHocDeposit(Number(e.target.value))}
                      step={100000}
                      className="w-full mt-0.5 px-2 py-1 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 rounded font-mono font-bold text-blue-600 dark:text-blue-400 text-xs"
                    />
                  </div>

                  <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-800">
                    <span className="text-[10px] text-amber-800 dark:text-amber-300 block font-bold">Còn Lại Phải Thu (Công nợ):</span>
                    <span className="text-sm font-mono font-extrabold text-amber-700 dark:text-amber-400">
                      {formatCurrency(remainingAdHocDebt)}
                    </span>
                    <span className="text-[9px] text-amber-600/80 block">Tổng: {formatCurrency(grandTotalAdHocFee)}</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* COMMON SECTION: PHÂN CÔNG NHÂN SỰ & MỨC ĐỘ RỦI RO */}
          {/* ========================================================================= */}
          <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-1.5 font-bold text-slate-900 dark:text-white text-xs">
                <UserCheck className="h-4 w-4 text-blue-600" />
                <span>
                  {intakeNature === 'BOTH' ? '9. Phân Công Nhân Sự Phụ Trách & Mức Độ Rủi Ro' : intakeNature === 'ADHOC' ? '5. Phân Công Chuyên Viên Thực Hiện & Mức Độ Ưu Tiên' : '7. Phân Công Kế Toán Phụ Trách & Mức Độ Rủi Ro Thuế'}
                </span>
              </div>
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Tự động đồng bộ Workload & Nhân sự</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {intakeNature === 'ADHOC' ? 'Chuyên Viên Thực Hiện Chính' : 'Kế Toán Viên Phụ Trách Chính'} <span className="text-red-500">*</span>
                </label>
                <select
                  value={assignedStaffId}
                  onChange={(e) => setAssignedStaffId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-xs"
                >
                  {sortedAssignees.map(u => {
                    const workload = workloadSummaries.find(w => w.userId === u.id);
                    const count = workload?.assignedCustomersCount ?? 0;
                    const cap = workload?.customerCapacity ?? 7;
                    const isAvail = count === 0 || count < cap * 0.7;
                    const isOver = count > cap;
                    const statusText = isOver ? `[${count}/${cap} KH - Quá tải]` : isAvail ? `[${count}/${cap} KH - Còn trống]` : `[${count}/${cap} KH - Tối ưu]`;
                    return (
                      <option key={u.id} value={u.id}>
                        {u.name} • {statusText} ({u.position || u.role})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kiểm Soát Viên (Trưởng phòng / Trưởng nhóm / KTT) <span className="text-red-500">*</span>
                </label>
                <select
                  value={reviewerStaffId}
                  onChange={(e) => setReviewerStaffId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-xs"
                >
                  {sortedReviewers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.position || u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Đánh Giá Rủi Ro / Mức Độ Ưu Tiên
                </label>
                <select
                  value={riskLevel}
                  onChange={(e) => setRiskLevel(e.target.value as CustomerRiskLevel)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-xs"
                >
                  <option value="THAP">Thấp (DN / Vụ việc đơn giản)</option>
                  <option value="BINH_THUONG">Bình thường (Đạt chuẩn)</option>
                  <option value="TRUNG_BINH">Trung bình (Cần theo dõi sát)</option>
                  <option value="CAO">Cao (Cần duyệt kỹ trước khi nộp)</option>
                  <option value="NGUY_CO_PHAP_LY">Nguy cơ pháp lý / Gấp</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ghi Chú Đặc Thù Hoạt Động & Yêu Cầu Của Khách Hàng
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Lưu ý về chính sách thuế, ưu đãi, lịch hẹn giao nhận chứng từ hoặc yêu cầu đặc biệt của khách hàng..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className={`px-6 py-2.5 text-white rounded-xl font-bold shadow-md flex items-center space-x-2 transition-all cursor-pointer ${
                intakeNature === 'PERIODIC' ? 'bg-blue-600 hover:bg-blue-500' :
                intakeNature === 'ADHOC' ? 'bg-amber-600 hover:bg-amber-500' :
                'bg-indigo-600 hover:bg-indigo-500'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {isEditing 
                  ? 'Lưu Thay Đổi Thông Tin Khách Hàng' 
                  : (intakeNature === 'PERIODIC' ? 'Tiếp Nhận Hợp Đồng Gói Định Kỳ' :
                     intakeNature === 'ADHOC' ? `Tiếp Nhận Hồ Sơ & ${selectedAdHocList.length} Dịch Vụ Vụ Việc` :
                     `Tiếp Nhận Hồ Sơ Kết Hợp (${selectedAdHocList.length} DV Vụ Việc)`)}
              </span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

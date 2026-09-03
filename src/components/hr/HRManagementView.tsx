import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  DollarSign, 
  Calendar, 
  Calculator, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Briefcase, 
  ArrowRight, 
  Building, 
  Award, 
  BookOpen, 
  UserCheck, 
  X, 
  Check, 
  TrendingUp,
  FileSpreadsheet,
  Download,
  Eye,
  Filter,
  Phone,
  Mail,
  Edit3,
  Sliders,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Coins,
  HelpCircle,
  Info,
  Layers,
  RefreshCw,
  UserX,
  AlertOctagon,
  ArrowRightLeft,
  ShieldAlert,
  Undo2,
  CheckSquare,
  FileCheck,
  Trash2,
  LayoutGrid,
  Table as TableIcon,
  KeyRound,
  ShieldOff
} from 'lucide-react';
import { 
  EmployeeProfile, 
  LeaveRequest, 
  BusinessTrip,
  PayrollRecord, 
  HRWorkflowSOP, 
  User, 
  UserRole,
  Customer,
  LeaveType,
  EmployeeContractType,
  Department,
  EmployeeStatus
} from '../../types';
import { storageService, CURRENT_SYSTEM_DATE } from '../../services/storageService';
import { PermissionService } from '../../utils/permissions';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { BusinessTripManager } from './BusinessTripManager';
import { 
  STANDARD_POSITION_GROUPS, 
  ALL_STANDARD_POSITIONS, 
  findPositionByName 
} from '../../constants/positions';

interface HRManagementViewProps {
  currentUser: User;
  users?: User[];
  customers?: Customer[];
  onOpenCreateTaskWithSOP?: (sop: HRWorkflowSOP) => void;
  onSelectCustomer?: (customerId: string) => void;
}

type HRTab = 'STAFF_DIRECTORY' | 'PAYROLL_SHEET' | 'LEAVE_MANAGEMENT' | 'SOP_WORKFLOWS' | 'SALARY_CALCULATOR';

const CONTRACT_TYPE_LABELS: Record<EmployeeContractType, { label: string; color: string }> = {
  THU_VIEC: { label: 'Thử việc (2 tháng)', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
  XAC_DINH_1_NAM: { label: 'HĐ 1 năm', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' },
  XAC_DINH_3_NAM: { label: 'HĐ 3 năm', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' },
  KHONG_XAC_DINH_THOI_HAN: { label: 'Không xác định thời hạn', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
  CONG_TAC_VIEN: { label: 'Cộng tác viên', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' },
  THUC_TAP_SINH: { label: 'Thực tập sinh', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' },
};

const EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, { label: string; color: string; badge: string }> = {
  DANG_LAM_VIEC: { label: 'Đang làm việc', color: 'text-emerald-700 dark:text-emerald-300', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  THU_VIEC: { label: 'Đang thử việc', color: 'text-blue-700 dark:text-blue-300', badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
  TAM_HOAN_HD: { label: 'Tạm hoãn HĐ', color: 'text-amber-700 dark:text-amber-300', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  DA_NGHI_VIEC: { label: 'Đã chấm dứt HĐ', color: 'text-rose-700 dark:text-rose-300', badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800' },
};

const TERMINATION_REASONS = [
  'Hai bên thỏa thuận chấm dứt hợp đồng lao động (Khoản 3 Điều 34 BLLĐ 2019)',
  'Hết hạn hợp đồng lao động và không tiếp tục tái ký (Khoản 1 Điều 34 BLLĐ 2019)',
  'Người lao động đơn phương chấm dứt hợp đồng hợp pháp (Điều 35 BLLĐ 2019)',
  'Doanh nghiệp thay đổi cơ cấu tổ chức, tinh gọn nhân sự (Điều 42 BLLĐ 2019)',
  'Hết thời gian thử việc không đạt yêu cầu chuyên môn',
  'Chuyển nơi cư trú / Định cư / Lý do sức khỏe cá nhân',
  'Xử lý kỷ luật sa thải theo nội quy lao động (Điều 125 BLLĐ 2019)',
];

const LEAVE_TYPE_LABELS: Record<LeaveType, { label: string; bg: string }> = {
  PHEP_NAM: { label: 'Nghỉ phép năm', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  NGHI_OM: { label: 'Nghỉ ốm (hưởng BHXH)', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
  THAI_SAN: { label: 'Nghỉ thai sản', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
  VIEC_RIENG: { label: 'Nghỉ việc riêng có lương', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CONG_TAC_KHACH_HANG: { label: 'Công tác tại khách hàng', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  NGHI_KHONG_LUONG: { label: 'Nghỉ không hưởng lương', bg: 'bg-slate-50 text-slate-700 border-slate-200' },
};

export const HRManagementView: React.FC<HRManagementViewProps> = ({
  currentUser,
  users: propUsers,
  customers: propCustomers,
  onOpenCreateTaskWithSOP,
  onSelectCustomer,
}) => {
  // RBAC Permission checks
  const canViewAllProfiles = PermissionService.canViewAllProfiles(currentUser);
  const canViewAllPayroll = PermissionService.canViewAllPayroll(currentUser);
  const canManagePayroll = PermissionService.canManagePayroll(currentUser);
  const canApprovePayroll = PermissionService.canApprovePayroll(currentUser);
  const canCreateEditStaff = currentUser.role === 'ADMIN' || currentUser.role === 'BAN_GIAM_DOC' || currentUser.role === 'TRUONG_PHONG' || PermissionService.can(currentUser, 'hr:edit_profile');
  const canReviewLeave = PermissionService.canReviewLeave(currentUser);

  const [activeTab, setActiveTab] = useState<HRTab>('STAFF_DIRECTORY');
  
  // Data state
  const [employees, setEmployees] = useState<EmployeeProfile[]>(() => storageService.getEmployees());
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => storageService.getLeaveRequests());
  const [businessTrips, setBusinessTrips] = useState<BusinessTrip[]>(() => storageService.getBusinessTrips());
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(() => storageService.getPayrollRecords());
  const sops = storageService.getHRWorkflowSOPs();

  // Leave & Business Trip Sub Navigation & Filters
  const [leaveSubTab, setLeaveSubTab] = useState<'LEAVE_REQUESTS' | 'BUSINESS_TRIPS'>('LEAVE_REQUESTS');
  const [leaveFilterStatus, setLeaveFilterStatus] = useState<'ALL' | 'CHO_DUYET' | 'DA_DUYET' | 'TU_CHOI'>('ALL');
  const [leaveSearch, setLeaveSearch] = useState<string>('');

  // Unified stats synchronized across Dashboard & HR
  const leaveAndTripStats = useMemo(() => {
    return storageService.getLeaveAndTripStats(currentUser);
  }, [currentUser, leaveRequests, businessTrips]);

  // Effective users and customers for subcomponents
  const effectiveUsers: User[] = useMemo(() => {
    if (propUsers && propUsers.length > 0) {
      return propUsers.filter(u => u.role !== 'ADMIN' && u.id !== 'USR-030' && !u.name.includes('Quản Trị'));
    }
    return employees
      .filter(e => e.role !== 'ADMIN' && e.id !== 'USR-030' && !e.name.includes('Quản Trị'))
      .map(e => ({
        id: e.id,
        name: e.name,
        email: e.email,
        role: e.role,
        department: e.department,
        position: e.position,
        phone: e.phone,
        status: 'ACTIVE' as const,
      }));
  }, [propUsers, employees]);

  const effectiveCustomers: Customer[] = useMemo(() => {
    if (propCustomers && propCustomers.length > 0) return propCustomers;
    return storageService.getCustomers();
  }, [propCustomers]);

  // Filtered leave requests
  const filteredLeaveRequests = useMemo(() => {
    return leaveRequests.filter(req => {
      if (leaveFilterStatus !== 'ALL' && req.status !== leaveFilterStatus) return false;
      if (leaveSearch.trim()) {
        const q = leaveSearch.toLowerCase();
        const matchEmp = req.employeeName.toLowerCase().includes(q);
        const matchReason = req.reason.toLowerCase().includes(q);
        const matchDest = (req.destinationOrClient || '').toLowerCase().includes(q);
        if (!matchEmp && !matchReason && !matchDest) return false;
      }
      return true;
    });
  }, [leaveRequests, leaveFilterStatus, leaveSearch]);

  // Scoped employee list according to RBAC (Admin is a system account, does not sign labor contracts or have payroll)
  const visibleEmployees = useMemo(() => {
    const regularEmployees = employees.filter(e => e.role !== 'ADMIN' && e.id !== 'USR-030' && !e.name.includes('Quản Trị'));
    if (canViewAllProfiles) return regularEmployees;
    const own = regularEmployees.filter(e => 
      e.id === currentUser.id || 
      (e.email && currentUser.email && e.email.toLowerCase() === currentUser.email.toLowerCase()) ||
      (e.name && currentUser.name && e.name.toLowerCase() === currentUser.name.toLowerCase())
    );
    return own.length > 0 ? own : regularEmployees.filter(e => e.id === currentUser.id);
  }, [employees, canViewAllProfiles, currentUser]);

  // Modals & Details
  const [selectedSOP, setSelectedSOP] = useState<HRWorkflowSOP | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeProfile | null>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);

  // Termination & Detail Modal State
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [showTerminationModal, setShowTerminationModal] = useState<boolean>(false);
  const [terminatingEmployee, setTerminatingEmployee] = useState<EmployeeProfile | null>(null);
  const [terminationForm, setTerminationForm] = useState({
    terminationDate: CURRENT_SYSTEM_DATE,
    terminationReason: TERMINATION_REASONS[0],
    terminationDecisionNo: '',
    handoverStaffId: '',
    terminationNote: '',
    notifyBHXH: true,
    finalizeTax: true,
    returnDocs: true,
    revokeAccess: true,
  });
  const [staffStatusFilter, setStaffStatusFilter] = useState<'ALL' | 'ACTIVE' | 'TERMINATED'>('ALL');
  const [viewMode, setViewMode] = useState<'CARD' | 'TABLE'>('CARD');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Deletion Modal State
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deletingEmployee, setDeletingEmployee] = useState<EmployeeProfile | null>(null);
  const [deleteHandoverStaffId, setDeleteHandoverStaffId] = useState<string>('');

  // Monthly Payroll Period & Allowance / KPI Adjustments State
  const [selectedPayrollMonth, setSelectedPayrollMonth] = useState<number>(8);
  const [selectedPayrollYear, setSelectedPayrollYear] = useState<number>(2026);
  const [showAdjustModal, setShowAdjustModal] = useState<boolean>(false);
  const [adjustingRecord, setAdjustingRecord] = useState<PayrollRecord | null>(null);
  const [adjustForm, setAdjustForm] = useState({
    positionAllowance: 0,
    lunchAllowance: 0,
    phoneAllowance: 0,
    performanceBonus: 0,
    actualSalary: 0,
    bonusReason: '',
    adjustmentNotes: '',
  });

  // Search & Filters
  const [sopFilter, setSopFilter] = useState<string>('ALL');
  const [staffSearch, setStaffSearch] = useState<string>('');

  // Salary Calculator State
  const [calcGross, setCalcGross] = useState<number>(20000000);
  const [calcDependents, setCalcDependents] = useState<number>(0);
  const [calcInsSalary, setCalcInsSalary] = useState<number>(8000000);
  const [customCalcResult, setCustomCalcResult] = useState(() => 
    storageService.calculateNetSalary(20000000, 0, 8000000)
  );

  // New Leave Form State
  const [newLeaveEmployeeId, setNewLeaveEmployeeId] = useState(employees[0]?.id || '');
  const [newLeaveType, setNewLeaveType] = useState<LeaveType>('PHEP_NAM');
  const [newLeaveStart, setNewLeaveStart] = useState(CURRENT_SYSTEM_DATE);
  const [newLeaveEnd, setNewLeaveEnd] = useState(CURRENT_SYSTEM_DATE);
  const [newLeaveDays, setNewLeaveDays] = useState(1);
  const [newLeaveReason, setNewLeaveReason] = useState('');

  // New Employee Form State
  const [isCustomPosition, setIsCustomPosition] = useState(false);
  const [empForm, setEmpForm] = useState<Partial<EmployeeProfile>>({
    name: '',
    email: '',
    phone: '',
    department: 'KE_TOAN_THUE',
    position: 'Nhân viên Kế toán Thuế',
    role: 'NHAN_VIEN',
    contractType: 'XAC_DINH_1_NAM',
    contractStartDate: CURRENT_SYSTEM_DATE,
    baseSalary: 7000000,
    actualSalary: 14000000,
    positionAllowance: 500000,
    lunchAllowance: 800000,
    phoneAllowance: 300000,
    taxDependents: 0,
    maxCustomerCapacity: 7,
    status: 'DANG_LAM_VIEC',
    qualifications: ['Cử nhân Kế toán'],
  });

  const refreshData = () => {
    setEmployees(storageService.getEmployees());
    setLeaveRequests(storageService.getLeaveRequests());
    setBusinessTrips(storageService.getBusinessTrips());
    setPayrollRecords(storageService.getPayrollRecords());
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = storageService.subscribeToSync(() => {
      refreshData();
    });
    return () => unsubscribe();
  }, []);

  const handleApproveLeave = (id: string, status: 'DA_DUYET' | 'TU_CHOI') => {
    storageService.approveLeaveRequest(id, status, status === 'TU_CHOI' ? 'Yêu cầu sắp xếp lại lịch phụ trách tờ khai' : undefined, currentUser);
    refreshData();
  };

  const handleDeleteLeave = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đơn xin nghỉ phép này không?')) {
      storageService.deleteLeaveRequest(id, currentUser);
      refreshData();
    }
  };

  const handleCreateLeave = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === newLeaveEmployeeId);
    if (!emp) return;

    storageService.createLeaveRequest({
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      leaveType: newLeaveType,
      startDate: newLeaveStart,
      endDate: newLeaveEnd,
      daysCount: Number(newLeaveDays) || 1,
      reason: newLeaveReason,
    }, currentUser);

    setShowLeaveModal(false);
    setNewLeaveReason('');
    refreshData();
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empForm.name || !empForm.email) return;

    storageService.saveEmployee({
      id: empForm.id || '',
      code: empForm.code || '',
      name: empForm.name || '',
      email: empForm.email || '',
      phone: empForm.phone || '',
      department: empForm.department as Department || 'KE_TOAN_THUE',
      position: empForm.position || 'Chuyên viên',
      role: empForm.role as UserRole || 'NHAN_VIEN',
      dateOfJoining: empForm.dateOfJoining || CURRENT_SYSTEM_DATE,
      contractType: empForm.contractType as EmployeeContractType || 'XAC_DINH_1_NAM',
      contractStartDate: empForm.contractStartDate || CURRENT_SYSTEM_DATE,
      contractEndDate: empForm.contractEndDate,
      status: empForm.status || 'DANG_LAM_VIEC',
      baseSalary: Number(empForm.baseSalary) || 6000000,
      actualSalary: Number(empForm.actualSalary) || 12000000,
      positionAllowance: Number(empForm.positionAllowance) || 0,
      lunchAllowance: Number(empForm.lunchAllowance) || 800000,
      phoneAllowance: Number(empForm.phoneAllowance) || 300000,
      taxDependents: Number(empForm.taxDependents) || 0,
      taxCode: empForm.taxCode,
      socialInsuranceNumber: empForm.socialInsuranceNumber,
      idCardNumber: empForm.idCardNumber,
      bankAccount: empForm.bankAccount,
      bankName: empForm.bankName,
      qualifications: typeof empForm.qualifications === 'string' 
        ? (empForm.qualifications as string).split(',').map(s => s.trim()) 
        : (empForm.qualifications || ['Cử nhân Kế toán']),
      maxCustomerCapacity: Number(empForm.maxCustomerCapacity) || 7,
      notes: empForm.notes,
    }, currentUser);

    setShowEmployeeModal(false);
    setSelectedEmployee(null);
    refreshData();
  };

  const handleRunCalculator = (gross: number, dependents: number, insBase: number) => {
    setCalcGross(gross);
    setCalcDependents(dependents);
    setCalcInsSalary(insBase);
    setCustomCalcResult(storageService.calculateNetSalary(gross, dependents, insBase));
  };

  const handleOpenAdjustModal = (record: PayrollRecord) => {
    setAdjustingRecord(record);
    setAdjustForm({
      positionAllowance: record.positionAllowance,
      lunchAllowance: record.lunchAllowance,
      phoneAllowance: record.phoneAllowance,
      performanceBonus: record.performanceBonus,
      actualSalary: record.actualSalary,
      bonusReason: record.bonusReason || '',
      adjustmentNotes: record.adjustmentNotes || '',
    });
    setShowAdjustModal(true);
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingRecord) return;

    storageService.updatePayrollRecord(
      adjustingRecord.id,
      {
        positionAllowance: Number(adjustForm.positionAllowance) || 0,
        lunchAllowance: Number(adjustForm.lunchAllowance) || 0,
        phoneAllowance: Number(adjustForm.phoneAllowance) || 0,
        performanceBonus: Number(adjustForm.performanceBonus) || 0,
        actualSalary: Number(adjustForm.actualSalary) || adjustingRecord.actualSalary,
        bonusReason: adjustForm.bonusReason.trim(),
        adjustmentNotes: adjustForm.adjustmentNotes.trim(),
      },
      currentUser
    );

    setShowAdjustModal(false);
    setAdjustingRecord(null);
    refreshData();
  };

  const handleGenerateMonthPayroll = () => {
    storageService.generatePayrollForMonth(selectedPayrollMonth, selectedPayrollYear, currentUser);
    refreshData();
  };

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const canManageHR = PermissionService.canManageHR(currentUser);

  const filteredSOPs = sopFilter === 'ALL' 
    ? sops 
    : sops.filter(s => s.category === sopFilter);

  const handleOpenTerminateModal = (emp: EmployeeProfile) => {
    setTerminatingEmployee(emp);
    const otherStaff = employees.find(e => e.id !== emp.id && e.status !== 'DA_NGHI_VIEC');
    setTerminationForm({
      terminationDate: CURRENT_SYSTEM_DATE,
      terminationReason: TERMINATION_REASONS[0],
      terminationDecisionNo: `QĐ-08/2026/QĐ-TGD-${emp.code}`,
      handoverStaffId: otherStaff?.id || '',
      terminationNote: `Biên bản bàn giao công việc & hoàn tất thanh lý HĐLĐ của ${emp.name} (${emp.code}) ngày ${formatDate(CURRENT_SYSTEM_DATE)}.`,
      notifyBHXH: true,
      finalizeTax: true,
      returnDocs: true,
      revokeAccess: true,
    });
    setShowTerminationModal(true);
  };

  const handleConfirmTermination = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminatingEmployee) return;

    const handoverStaff = employees.find(e => e.id === terminationForm.handoverStaffId);

    const result = storageService.terminateEmployeeContract(
      terminatingEmployee.id,
      {
        terminationDate: terminationForm.terminationDate,
        terminationReason: terminationForm.terminationReason,
        terminationDecisionNo: terminationForm.terminationDecisionNo,
        handoverStaffId: terminationForm.handoverStaffId,
        handoverStaffName: handoverStaff?.name,
        terminationNote: terminationForm.terminationNote,
      },
      currentUser
    );

    setShowTerminationModal(false);
    if (selectedEmployee?.id === terminatingEmployee.id) {
      setSelectedEmployee(result.employee);
    }
    setTerminatingEmployee(null);
    refreshData();

    setSuccessToast(
      `Đã chấm dứt hợp đồng lao động thành công cho nhân viên ${result.employee.name} (${result.employee.code}).` +
      (result.reassignedCustomersCount > 0 || result.reassignedTasksCount > 0
        ? ` Đã tự động chuyển giao ${result.reassignedCustomersCount} khách hàng và ${result.reassignedTasksCount} công việc cho chuyên viên ${handoverStaff?.name}.`
        : '')
    );
    setTimeout(() => setSuccessToast(null), 6000);
  };

  const handleReactivateContract = (emp: EmployeeProfile) => {
    if (window.confirm(`Xác nhận tái kích hoạt hợp đồng lao động cho nhân viên ${emp.name} (${emp.code})? Trạng thái sẽ chuyển về "Đang làm việc".`)) {
      const updated = storageService.reactivateEmployeeContract(emp.id, currentUser);
      refreshData();
      if (selectedEmployee?.id === emp.id) {
        setSelectedEmployee(updated);
      }
      setSuccessToast(`Đã tái kích hoạt hợp đồng lao động cho nhân viên ${emp.name} thành công.`);
      setTimeout(() => setSuccessToast(null), 5000);
    }
  };

  const handleOpenDeleteModal = (emp: EmployeeProfile) => {
    setDeletingEmployee(emp);
    const otherStaff = employees.find(e => e.id !== emp.id && e.status !== 'DA_NGHI_VIEC');
    setDeleteHandoverStaffId(otherStaff?.id || '');
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletingEmployee) return;

    const handoverStaff = employees.find(e => e.id === deleteHandoverStaffId);
    const result = storageService.deleteEmployee(
      deletingEmployee.id,
      currentUser,
      deleteHandoverStaffId || undefined,
      handoverStaff?.name
    );

    setShowDeleteModal(false);
    if (selectedEmployee?.id === deletingEmployee.id) {
      setSelectedEmployee(null);
      setShowDetailModal(false);
    }
    setDeletingEmployee(null);
    refreshData();

    if (result.success) {
      setSuccessToast(
        `Đã xoá vĩnh viễn hồ sơ nhân sự ${deletingEmployee.name} (${deletingEmployee.code}). ` +
        `Đã tự động thu hồi thông tin đăng nhập tài khoản & giải phóng quyền hạn.` +
        (result.reassignedCustomersCount > 0
          ? ` Đã chuyển giao ${result.reassignedCustomersCount} khách hàng sang chuyên viên ${handoverStaff?.name}.`
          : ' Toàn bộ khách hàng phụ trách đã được giải phóng về trạng thái Chưa phân công.')
      );
      setTimeout(() => setSuccessToast(null), 6000);
    }
  };

  const activeEmployeesCount = visibleEmployees.filter(e => e.status !== 'DA_NGHI_VIEC').length;
  const terminatedEmployeesCount = visibleEmployees.filter(e => e.status === 'DA_NGHI_VIEC').length;

  const filteredEmployees = visibleEmployees.filter(e => {
    const matchText = 
      e.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
      e.position.toLowerCase().includes(staffSearch.toLowerCase()) ||
      e.code.toLowerCase().includes(staffSearch.toLowerCase()) ||
      e.department.toLowerCase().includes(staffSearch.toLowerCase());
    
    if (!matchText) return false;
    if (staffStatusFilter === 'ACTIVE') return e.status !== 'DA_NGHI_VIEC';
    if (staffStatusFilter === 'TERMINATED') return e.status === 'DA_NGHI_VIEC';
    return true;
  });

  return (
    <div className="space-y-4 pb-8">
      
      {/* OPERATIONAL HEADER BAR */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <span>{canViewAllProfiles ? 'Quản Lý Nhân Sự & Tiền Lương' : 'Hồ Sơ Nhân Sự & Chế Độ Cá Nhân'}</span>
              <span className="text-[11px] font-mono bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold">
                {canViewAllProfiles ? `${employees.length} nhân sự` : `${visibleEmployees.length} cán bộ`}
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              {canViewAllProfiles 
                ? 'Hồ sơ hợp đồng, bảng lương thực nhận, bảo hiểm xã hội và duyệt phép' 
                : 'Hồ sơ hợp đồng lao động cá nhân, thông tin định biên và chế độ bảo hiểm'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap self-end sm:self-auto">
          {canCreateEditStaff && (
            <button
              onClick={() => {
                setEmpForm({
                  name: '',
                  email: '',
                  phone: '',
                  department: 'KE_TOAN_THUE',
                  position: 'Nhân viên Kế toán Thuế',
                  role: 'NHAN_VIEN',
                  contractType: 'XAC_DINH_1_NAM',
                  contractStartDate: CURRENT_SYSTEM_DATE,
                  baseSalary: 7000000,
                  actualSalary: 14000000,
                  positionAllowance: 500000,
                  lunchAllowance: 800000,
                  phoneAllowance: 300000,
                  taxDependents: 0,
                  maxCustomerCapacity: 7,
                  status: 'DANG_LAM_VIEC',
                  qualifications: ['Cử nhân Kế toán'],
                });
                setIsCustomPosition(false);
                setShowEmployeeModal(true);
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm nhân sự</span>
            </button>
          )}
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-1 overflow-x-auto no-scrollbar pb-0.5">
        <button
          onClick={() => setActiveTab('STAFF_DIRECTORY')}
          className={`flex items-center space-x-1.5 py-2 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'STAFF_DIRECTORY'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>{canViewAllProfiles ? `Hồ sơ nhân viên (${employees.length})` : `Hồ sơ cá nhân (${visibleEmployees.length})`}</span>
        </button>

        <button
          onClick={() => setActiveTab('PAYROLL_SHEET')}
          className={`flex items-center space-x-1.5 py-2 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'PAYROLL_SHEET'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <DollarSign className="h-3.5 w-3.5" />
          <span>Bảng lương & BHXH</span>
        </button>

        <button
          onClick={() => setActiveTab('LEAVE_MANAGEMENT')}
          className={`flex items-center space-x-1.5 py-2 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'LEAVE_MANAGEMENT'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Nghỉ phép & Công tác ({leaveAndTripStats.effectiveBadgeCount})</span>
          {leaveAndTripStats.totalPending > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-amber-500 text-white text-[10px] font-black rounded-full animate-pulse leading-none">
              {leaveAndTripStats.totalPending}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('SOP_WORKFLOWS')}
          className={`flex items-center space-x-1.5 py-2 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'SOP_WORKFLOWS'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>Quy trình mẫu ({sops.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('SALARY_CALCULATOR')}
          className={`flex items-center space-x-1.5 py-2 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'SALARY_CALCULATOR'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Calculator className="h-3.5 w-3.5" />
          <span>Tính lương Gross - Net</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SOP WORKFLOWS */}
      {/* ========================================================================= */}
      {activeTab === 'SOP_WORKFLOWS' && (
        <div className="space-y-6">
          {/* Filter chips */}
          <div className="flex items-center justify-between gap-4 flex-wrap bg-white dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
              <span className="text-xs font-bold text-slate-500 mr-2 flex items-center">
                <Filter className="h-3.5 w-3.5 mr-1" /> Phân Loại:
              </span>
              {[
                { id: 'ALL', label: 'Tất cả (8 Quy trình)' },
                { id: 'ONBOARDING', label: 'Tiếp nhận & Khai trình' },
                { id: 'BHXH_CHE_DO', label: 'BHXH & Chế độ' },
                { id: 'TIEN_LUONG_THUE', label: 'Tiền lương & Thuế TNCN' },
                { id: 'THANG_BANG_LUONG', label: 'Thang bảng lương & Nội quy' },
                { id: 'OFFBOARDING', label: 'Nghỉ việc & Quyết toán' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSopFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    sopFilter === tab.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-500 font-medium">
              Hiển thị <strong className="text-slate-800 dark:text-slate-200">{filteredSOPs.length}</strong> quy trình
            </span>
          </div>

          {/* SOP Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSOPs.map(sop => (
              <div
                key={sop.id}
                className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                      {sop.code}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Thời lượng: ~{sop.estimatedDays} ngày làm việc
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {sop.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {sop.description}
                  </p>

                  <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                    <strong className="text-slate-800 dark:text-slate-200">Căn cứ pháp luật:</strong> {sop.legalBasis}
                  </div>

                  {/* Steps preview */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Các bước thực hiện ({sop.steps.length} bước):</div>
                    <div className="space-y-1">
                      {sop.steps.slice(0, 3).map((step, idx) => (
                        <div key={idx} className="flex items-start space-x-2 text-xs text-slate-700 dark:text-slate-300">
                          <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {step.order}
                          </span>
                          <span className="line-clamp-1">{step.name}</span>
                        </div>
                      ))}
                      {sop.steps.length > 3 && (
                        <div className="text-[11px] text-slate-400 pl-6 italic">
                          +{sop.steps.length - 3} bước chi tiết khác...
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedSOP(sop)}
                    className="flex items-center space-x-1 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 p-1.5"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Xem Chi Tiết Quy Trình</span>
                  </button>

                  <button
                    onClick={() => {
                      if (onOpenCreateTaskWithSOP) {
                        onOpenCreateTaskWithSOP(sop);
                      }
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-xs transition-all"
                  >
                    <span>Khởi Tạo Giao Việc</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STAFF DIRECTORY & CAPACITY */}
      {/* ========================================================================= */}
      {activeTab === 'STAFF_DIRECTORY' && (
        <div className="space-y-6">
          {/* Toast Notification Banner */}
          {successToast && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-medium text-emerald-900 dark:text-emerald-200 flex items-center justify-between shadow-xs animate-fade-in">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{successToast}</span>
              </div>
              <button onClick={() => setSuccessToast(null)} className="text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-200">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Search bar & Status Filters */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                placeholder="Tìm nhân sự theo tên, vị trí, mã nhân viên..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2.5 overflow-x-auto pb-1 md:pb-0">
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setStaffStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    staffStatusFilter === 'ALL'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Tất cả ({visibleEmployees.length})
                </button>
                <button
                  onClick={() => setStaffStatusFilter('ACTIVE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    staffStatusFilter === 'ACTIVE'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Đang làm việc ({activeEmployeesCount})
                </button>
                <button
                  onClick={() => setStaffStatusFilter('TERMINATED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                    staffStatusFilter === 'TERMINATED'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <UserX className="h-3 w-3" />
                  <span>Đã chấm dứt HĐ ({terminatedEmployeesCount})</span>
                </button>
              </div>

              {/* View Mode Toggle: Card View vs Table View */}
              <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('CARD')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'CARD'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  title="Chế độ xem dạng thẻ"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Dạng Thẻ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('TABLE')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'TABLE'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  title="Chế độ xem dạng bảng"
                >
                  <TableIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Dạng Bảng</span>
                </button>
              </div>
            </div>
          </div>

          {!canViewAllProfiles && (
            <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-medium text-blue-900 dark:text-blue-200 flex items-center space-x-2.5">
              <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Chế độ xem cá nhân: Bạn chỉ có quyền truy cập hồ sơ lao động & quyền lợi của chính mình. Danh bạ toàn thể nhân sự được bảo mật theo quy chế bảo vệ dữ liệu nội bộ.</span>
            </div>
          )}

          {filteredEmployees.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 space-y-2">
              <Users className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600" />
              <div className="font-bold text-sm text-slate-700 dark:text-slate-300">Không tìm thấy nhân sự phù hợp</div>
              <p className="text-xs text-slate-400">Vui lòng thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc trạng thái làm việc.</p>
            </div>
          ) : viewMode === 'CARD' ? (
            /* Employee Cards (Card View) */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEmployees.map(emp => {
                const isTerminated = emp.status === 'DA_NGHI_VIEC';
                const capacityPercent = Math.round(((emp.managedCustomersCount || 0) / emp.maxCustomerCapacity) * 100);
                const isOverloaded = capacityPercent > 100;
                const isNearLimit = capacityPercent >= 80 && !isOverloaded;

                return (
                  <div
                    key={emp.id}
                    className={`bg-white dark:bg-slate-850 rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 ${
                      isTerminated 
                        ? 'border-rose-200/80 dark:border-rose-900/60 bg-gradient-to-b from-rose-50/20 to-transparent' 
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full font-bold flex items-center justify-center text-sm shadow-xs text-white ${
                          isTerminated 
                            ? 'bg-gradient-to-tr from-slate-500 to-rose-600' 
                            : 'bg-gradient-to-tr from-blue-600 to-indigo-600'
                        }`}>
                          {emp.name.split(' ').slice(-1)[0][0]}
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{emp.name}</h4>
                            <span className="font-mono text-[10px] text-slate-400">({emp.code})</span>
                          </div>
                          <div className="text-xs text-slate-500 font-medium">{emp.position}</div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end space-y-1">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${EMPLOYEE_STATUS_LABELS[emp.status || 'DANG_LAM_VIEC']?.badge}`}>
                          {EMPLOYEE_STATUS_LABELS[emp.status || 'DANG_LAM_VIEC']?.label}
                        </span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${CONTRACT_TYPE_LABELS[emp.contractType]?.color}`}>
                          {CONTRACT_TYPE_LABELS[emp.contractType]?.label}
                        </span>
                      </div>
                    </div>

                    {/* Contact & Date */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center space-x-1 truncate">
                        <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate">{emp.email}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>{emp.phone}</span>
                      </div>
                      <div className="col-span-2 flex items-center justify-between text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-800">
                        <span>Ngày vào làm: <strong>{formatDate(emp.dateOfJoining)}</strong></span>
                        <span>{emp.taxDependents > 0 ? `${emp.taxDependents} NPT` : 'Không có NPT'}</span>
                      </div>
                    </div>

                    {/* Termination Details Banner if Terminated */}
                    {isTerminated ? (
                      <div className="bg-rose-50/80 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-800 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between font-bold text-[11px] text-rose-700 dark:text-rose-300">
                          <span className="flex items-center space-x-1">
                            <AlertOctagon className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                            <span>Đã chấm dứt HĐLĐ</span>
                          </span>
                          <span className="font-mono">{formatDate(emp.terminationDate)}</span>
                        </div>
                        {emp.terminationDecisionNo && (
                          <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                            Số QĐ: <strong className="text-slate-800 dark:text-slate-200">{emp.terminationDecisionNo}</strong>
                          </div>
                        )}
                        <div className="text-[11px] text-slate-700 dark:text-slate-300 line-clamp-2">
                          <span className="font-semibold text-rose-800 dark:text-rose-300">Lý do: </span>
                          {emp.terminationReason || 'Thỏa thuận chấm dứt hợp đồng lao động'}
                        </div>
                        {emp.terminationHandoverToStaffName && (
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center space-x-1 pt-1 border-t border-rose-200/60 dark:border-rose-800/60">
                            <ArrowRightLeft className="h-3 w-3 text-rose-500 shrink-0" />
                            <span>Bàn giao cho: <strong className="text-slate-900 dark:text-white">{emp.terminationHandoverToStaffName}</strong></span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* Qualifications */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Chứng chỉ & Bằng cấp:</span>
                          <div className="flex flex-wrap gap-1">
                            {emp.qualifications.map((q, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-medium"
                              >
                                {q}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Capacity & Workload Meter */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 dark:text-slate-300 font-medium flex items-center space-x-1">
                              <Building className="h-3 w-3 text-slate-400" />
                              <span>Định mức khách hàng:</span>
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {emp.managedCustomersCount || 0} / {emp.maxCustomerCapacity} KH ({capacityPercent}%)
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isOverloaded
                                  ? 'bg-red-500'
                                  : isNearLimit
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(capacityPercent, 100)}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>Đang xử lý: <strong className="text-blue-600">{emp.activeTasksCount || 0} công việc</strong></span>
                            {isOverloaded ? (
                              <span className="text-red-600 font-bold flex items-center">
                                <AlertTriangle className="h-3 w-3 mr-0.5" /> Quá tải
                              </span>
                            ) : (
                              <span className="text-emerald-600 font-medium">Sẵn sàng nhận thêm</span>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions Toolbar */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 flex-wrap">
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => {
                          setSelectedEmployee(emp);
                          setShowDetailModal(true);
                        }}
                        className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                        title={isTerminated ? "Chi tiết thanh lý" : "Chi tiết hồ sơ"}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Chi tiết</span>
                      </button>

                      {/* Cặp nút trực tiếp [Sửa] & [Xoá] nổi bật */}
                      <button
                        onClick={() => {
                          setSelectedEmployee(emp);
                          setEmpForm(emp);
                          setIsCustomPosition(!findPositionByName(emp.position));
                          setShowEmployeeModal(true);
                        }}
                        className="flex items-center space-x-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                        title="Chỉnh sửa hồ sơ nhân sự"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Sửa</span>
                      </button>

                      <button
                        onClick={() => handleOpenDeleteModal(emp)}
                        className="flex items-center space-x-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                        title="Xoá nhân sự & phân bổ lại khách hàng"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Xoá</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-1">
                      {isTerminated ? (
                        <button
                          onClick={() => handleReactivateContract(emp)}
                          className="flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          title="Tái kích hoạt hợp đồng lao động"
                        >
                          <Undo2 className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Tái ký</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenTerminateModal(emp)}
                          className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                          title="Chấm dứt hợp đồng lao động & bàn giao khách hàng/công việc"
                        >
                          <UserX className="h-3.5 w-3.5" />
                          <span className="hidden xl:inline">Chấm dứt HĐ</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ================= TABLE VIEW ================= */
          <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5">Mã & Nhân Sự</th>
                    <th className="px-4 py-3.5">Chức Danh & Phòng Ban</th>
                    <th className="px-4 py-3.5">Loại Hợp Đồng</th>
                    <th className="px-4 py-3.5">Trạng Thái</th>
                    <th className="px-4 py-3.5">Mức Lương Thỏa Thuận</th>
                    <th className="px-4 py-3.5">Định Mức KH & Việc</th>
                    <th className="px-4 py-3.5 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredEmployees.map(emp => {
                    const isTerminated = emp.status === 'DA_NGHI_VIEC';
                    const capacityPercent = Math.round(((emp.managedCustomersCount || 0) / emp.maxCustomerCapacity) * 100);
                    return (
                      <tr 
                        key={emp.id}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                          isTerminated ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''
                        }`}
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center space-x-2.5">
                            <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs text-white shrink-0 shadow-xs ${
                              isTerminated 
                                ? 'bg-gradient-to-tr from-slate-500 to-rose-600' 
                                : 'bg-gradient-to-tr from-blue-600 to-indigo-600'
                            }`}>
                              {emp.name.split(' ').slice(-1)[0][0]}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                                <span>{emp.name}</span>
                                <span className="font-mono text-[10px] text-slate-400 font-normal">({emp.code})</span>
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center space-x-2">
                                <span>{emp.email}</span>
                                <span>&bull;</span>
                                <span>{emp.phone}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-medium text-slate-900 dark:text-white">{emp.position}</div>
                          <div className="text-[11px] text-slate-500">{emp.department}</div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${CONTRACT_TYPE_LABELS[emp.contractType]?.color}`}>
                            {CONTRACT_TYPE_LABELS[emp.contractType]?.label}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Vào làm: {formatDate(emp.dateOfJoining)}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${EMPLOYEE_STATUS_LABELS[emp.status || 'DANG_LAM_VIEC']?.badge}`}>
                            {EMPLOYEE_STATUS_LABELS[emp.status || 'DANG_LAM_VIEC']?.label}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-mono font-bold text-slate-900 dark:text-white">
                            {formatVND(emp.actualSalary)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            BHXH: {formatVND(emp.baseSalary)}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {emp.managedCustomersCount || 0}/{emp.maxCustomerCapacity} DN
                            </span>
                            <span className="text-[10px] text-slate-400">({capacityPercent}%)</span>
                          </div>
                          <div className="w-24 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                capacityPercent > 100 ? 'bg-red-500' : capacityPercent >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(capacityPercent, 100)}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5 font-medium">
                            {emp.activeTasksCount || 0} việc đang xử lý
                          </div>
                        </td>

                        {/* Actions Column: Chi Tiết | Sửa | Xoá */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-center space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setSelectedEmployee(emp);
                                setShowDetailModal(true);
                              }}
                              className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                              title="Xem chi tiết hồ sơ nhân sự"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Chi Tiết</span>
                            </button>

                            <button
                              onClick={() => {
                                setSelectedEmployee(emp);
                                setEmpForm(emp);
                                setIsCustomPosition(!findPositionByName(emp.position));
                                setShowEmployeeModal(true);
                              }}
                              className="flex items-center space-x-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                              title="Chỉnh sửa thông tin nhân sự"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              <span>Sửa</span>
                            </button>

                            <button
                              onClick={() => handleOpenDeleteModal(emp)}
                              className="flex items-center space-x-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                              title="Xóa nhân sự & phân bổ lại khách hàng"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Xoá</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )}

      {/* ========================================================================= */}
      {/* TAB 3: PAYROLL SHEET */}
      {/* ========================================================================= */}
      {activeTab === 'PAYROLL_SHEET' && (
        <div className="space-y-4">
          {/* Month Period Switcher and Header Toolbar */}
          <div className="bg-white dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <span>Bảng Thanh Toán Tiền Lương & Trích Nộp BHXH</span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-black">
                      Tháng {selectedPayrollMonth.toString().padStart(2, '0')}/{selectedPayrollYear}
                    </span>
                  </h3>
                  {!canViewAllPayroll && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border border-blue-300">
                      Phiếu Lương Cá Nhân
                    </span>
                  )}
                  {canViewAllPayroll && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300">
                      Toàn Công Ty ({payrollRecords.filter(r => r.month === selectedPayrollMonth && r.year === selectedPayrollYear).length} Nhân Sự)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Bảng thanh toán lương nhân sự, tính thuế TNCN và các khoản trích nộp BHXH theo lương thực nhận & KPI.
                </p>
              </div>

              {/* Month Picker Controls */}
              <div className="flex items-center space-x-2 flex-wrap">
                <div className="flex items-center space-x-1 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => {
                      if (selectedPayrollMonth === 1) {
                        setSelectedPayrollMonth(12);
                        setSelectedPayrollYear(prev => prev - 1);
                      } else {
                        setSelectedPayrollMonth(prev => prev - 1);
                      }
                    }}
                    title="Tháng trước"
                    className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <select
                    value={selectedPayrollMonth}
                    onChange={(e) => setSelectedPayrollMonth(Number(e.target.value))}
                    className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 px-2 py-1 focus:outline-hidden cursor-pointer"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m} className="bg-white dark:bg-slate-900">
                        Tháng {m.toString().padStart(2, '0')}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedPayrollYear}
                    onChange={(e) => setSelectedPayrollYear(Number(e.target.value))}
                    className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 px-2 py-1 focus:outline-hidden cursor-pointer"
                  >
                    {[2025, 2026, 2027].map(y => (
                      <option key={y} value={y} className="bg-white dark:bg-slate-900">
                        Năm {y}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      if (selectedPayrollMonth === 12) {
                        setSelectedPayrollMonth(1);
                        setSelectedPayrollYear(prev => prev + 1);
                      } else {
                        setSelectedPayrollMonth(prev => prev + 1);
                      }
                    }}
                    title="Tháng sau"
                    className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <button
                  onClick={() => alert('Xuất bảng lương Excel thành công!')}
                  className="flex items-center space-x-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>Xuất Excel</span>
                </button>
              </div>
            </div>

            {/* Quick KPI & Allowance Summary Highlights */}
            {(() => {
              const monthRecords = payrollRecords.filter(r => r.month === selectedPayrollMonth && r.year === selectedPayrollYear);
              if (monthRecords.length === 0) return null;
              const totalAllowance = monthRecords.reduce((s, r) => s + (r.positionAllowance + r.lunchAllowance + r.phoneAllowance), 0);
              const totalKPIBonus = monthRecords.reduce((s, r) => s + r.performanceBonus, 0);
              const totalNet = monthRecords.reduce((s, r) => s + r.netSalary, 0);

              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40">
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Nhân sự kỳ lương</div>
                    <div className="text-base font-extrabold text-blue-700 dark:text-blue-300 mt-0.5">
                      {monthRecords.length} người
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/40">
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>Tổng phụ cấp tháng</span>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">Theo tháng</span>
                    </div>
                    <div className="text-base font-extrabold text-amber-700 dark:text-amber-300 mt-0.5 font-mono">
                      {formatVND(totalAllowance)}
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>Tổng thưởng KPI tháng</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Linh hoạt</span>
                    </div>
                    <div className="text-base font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5 font-mono">
                      {formatVND(totalKPIBonus)}
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Tổng lương Net thực chi</div>
                    <div className="text-base font-extrabold text-indigo-700 dark:text-indigo-300 mt-0.5 font-mono">
                      {formatVND(totalNet)}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {!canViewAllPayroll && (
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-300 flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
              <span>Chế độ bảo mật tiền lương: Bạn đang xem phiếu lương của cá nhân. Dữ liệu lương toàn công ty được phân quyền cho Chuyên Viên Hành Chính – Nhân Sự & BHXH, Kế Toán Trưởng và Ban Giám Đốc.</span>
            </div>
          )}

          {/* Table / Empty State */}
          {(() => {
            const currentRecords = payrollRecords.filter(r => r.month === selectedPayrollMonth && r.year === selectedPayrollYear);
            const filteredRecords = currentRecords.filter(pr => {
              if (!canViewAllPayroll) {
                return pr.employeeName.toLowerCase().includes(currentUser.name.toLowerCase().split(' ').slice(-1)[0]);
              }
              return true;
            });

            if (currentRecords.length === 0) {
              return (
                <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 mx-auto flex items-center justify-center">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      Chưa có dữ liệu bảng lương Tháng {selectedPayrollMonth.toString().padStart(2, '0')}/{selectedPayrollYear}
                    </h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                      Bạn có thể khởi tạo bảng thanh toán tiền lương và các khoản trích theo lương tháng này dựa trên hồ sơ nhân sự hiện tại, sau đó điều chỉnh phụ cấp và thưởng KPI theo từng người.
                    </p>
                  </div>
                  {canViewAllPayroll && (
                    <button
                      onClick={handleGenerateMonthPayroll}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer inline-flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Khởi Tạo Bảng Lương Tháng {selectedPayrollMonth.toString().padStart(2, '0')}/{selectedPayrollYear}</span>
                    </button>
                  )}
                </div>
              );
            }

            return (
              <div className="bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                      <th className="py-3 px-3">Nhân Viên</th>
                      <th className="py-3 px-2 text-right">Lương Cơ Bản</th>
                      <th className="py-3 px-2 text-right">Phụ Cấp Tháng</th>
                      <th className="py-3 px-2 text-right">Thưởng KPI</th>
                      <th className="py-3 px-2 text-right font-bold text-slate-900 dark:text-white">Tổng Thu Nhập (Gross)</th>
                      <th className="py-3 px-2 text-right text-rose-600">BHXH 10.5% NLĐ</th>
                      <th className="py-3 px-2 text-right text-purple-600">Thuế TNCN</th>
                      <th className="py-3 px-3 text-right font-extrabold text-emerald-600">Thực Lĩnh (Net)</th>
                      <th className="py-3 px-3 text-right text-blue-700 dark:text-blue-300">Tổng Chi Phí DN</th>
                      <th className="py-3 px-3 text-center">Trạng Thái</th>
                      {canViewAllPayroll && <th className="py-3 px-3 text-center">Thao Tác</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredRecords.map(pr => {
                      const totalAllowance = pr.positionAllowance + pr.lunchAllowance + pr.phoneAllowance;
                      return (
                        <tr key={pr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900 dark:text-white">{pr.employeeName}</div>
                            <div className="text-[11px] text-slate-400">{pr.position}</div>
                          </td>
                          <td className="py-3 px-2 text-right font-mono text-slate-600 dark:text-slate-300">
                            {formatVND(pr.baseSalary)}
                          </td>
                          <td className="py-3 px-2 text-right font-mono text-slate-600 dark:text-slate-300">
                            <div className="font-semibold">{formatVND(totalAllowance)}</div>
                            <div className="text-[10px] text-slate-400">
                              (CV: {(pr.positionAllowance/1000).toFixed(0)}k, Ăn: {(pr.lunchAllowance/1000).toFixed(0)}k, ĐT: {(pr.phoneAllowance/1000).toFixed(0)}k)
                            </div>
                          </td>
                          <td className="py-3 px-2 text-right font-mono text-emerald-600 font-medium">
                            <div className="font-bold">+{formatVND(pr.performanceBonus)}</div>
                            {pr.bonusReason && (
                              <span className="inline-block text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mt-0.5">
                                {pr.bonusReason}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {formatVND(pr.grossIncome)}
                          </td>
                          <td className="py-3 px-2 text-right font-mono text-rose-600">
                            -{formatVND(pr.totalInsuranceDeduction)}
                          </td>
                          <td className="py-3 px-2 text-right font-mono text-purple-600">
                            -{formatVND(pr.personalIncomeTax)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 text-sm">
                            {formatVND(pr.netSalary)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-semibold text-blue-700 dark:text-blue-300">
                            {formatVND(pr.totalEmployerCost)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              {pr.status === 'DA_DUYET' ? 'Đã Duyệt Chi' : pr.status}
                            </span>
                          </td>
                          {canViewAllPayroll && (
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => handleOpenAdjustModal(pr)}
                                className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold transition-all border border-blue-200 dark:border-blue-800 cursor-pointer flex items-center space-x-1 mx-auto"
                                title="Điều chỉnh Phụ Cấp & Thưởng KPI Tháng này"
                              >
                                <Sliders className="h-3 w-3" />
                                <span>Điều chỉnh</span>
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 dark:bg-slate-900/80 font-bold border-t-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
                      <td className="py-3 px-3">TỔNG CỘNG ({filteredRecords.length} nhân sự)</td>
                      <td className="py-3 px-2 text-right font-mono">
                        {formatVND(filteredRecords.reduce((s, r) => s + r.baseSalary, 0))}
                      </td>
                      <td className="py-3 px-2 text-right font-mono">
                        {formatVND(filteredRecords.reduce((s, r) => s + (r.positionAllowance + r.lunchAllowance + r.phoneAllowance), 0))}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-emerald-600">
                        +{formatVND(filteredRecords.reduce((s, r) => s + r.performanceBonus, 0))}
                      </td>
                      <td className="py-3 px-2 text-right font-mono">
                        {formatVND(filteredRecords.reduce((s, r) => s + r.grossIncome, 0))}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-rose-600">
                        -{formatVND(filteredRecords.reduce((s, r) => s + r.totalInsuranceDeduction, 0))}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-purple-600">
                        -{formatVND(filteredRecords.reduce((s, r) => s + r.personalIncomeTax, 0))}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-600 text-sm">
                        {formatVND(filteredRecords.reduce((s, r) => s + r.netSalary, 0))}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-blue-700 dark:text-blue-300">
                        {formatVND(filteredRecords.reduce((s, r) => s + r.totalEmployerCost, 0))}
                      </td>
                      <td></td>
                      {canViewAllPayroll && <td></td>}
                    </tr>
                  </tfoot>
                </table>
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: UNIFIED LEAVE & BUSINESS TRIP MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'LEAVE_MANAGEMENT' && (
        <div className="space-y-4">
          {/* Sub Navigation Bar for Leave & Business Trip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-850 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl flex-wrap gap-y-1">
              <button
                type="button"
                onClick={() => setLeaveSubTab('LEAVE_REQUESTS')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  leaveSubTab === 'LEAVE_REQUESTS'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>Nghỉ Phép & Vắng Mặt ({leaveRequests.length})</span>
                {leaveAndTripStats.pendingLeavesCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-amber-500 text-white rounded-full text-[10px] font-black leading-none">
                    {leaveAndTripStats.pendingLeavesCount} chờ
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setLeaveSubTab('BUSINESS_TRIPS')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  leaveSubTab === 'BUSINESS_TRIPS'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Briefcase className="h-3.5 w-3.5" />
                <span>Lệnh Đi Công Tác & Ngoại Kiểm ({businessTrips.length})</span>
                {leaveAndTripStats.pendingTripsCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-amber-500 text-white rounded-full text-[10px] font-black leading-none">
                    {leaveAndTripStats.pendingTripsCount} chờ
                  </span>
                )}
              </button>
            </div>

            {leaveSubTab === 'LEAVE_REQUESTS' && (
              <button
                onClick={() => setShowLeaveModal(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Tạo Đơn Xin Nghỉ Phép</span>
              </button>
            )}
          </div>

          {/* SUB-VIEW 1: LEAVE REQUESTS */}
          {leaveSubTab === 'LEAVE_REQUESTS' && (
            <div className="space-y-4">
              {/* Summary Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Tổng Số Đơn Nghỉ</div>
                  <div className="text-xl font-black text-slate-900 dark:text-white">{leaveRequests.length}</div>
                  <div className="text-[10px] text-slate-400">Nghỉ phép năm & ốm đau, việc riêng</div>
                </div>
                <div className="bg-amber-50/60 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-200 dark:border-amber-800/60 shadow-xs space-y-1">
                  <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">Đang Chờ Phê Duyệt</div>
                  <div className="text-xl font-black text-amber-700 dark:text-amber-300">{leaveAndTripStats.pendingLeavesCount}</div>
                  <div className="text-[10px] text-amber-600 dark:text-amber-400">Cần Trưởng phòng / BGĐ duyệt</div>
                </div>
                <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 shadow-xs space-y-1">
                  <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">Đã Chấp Thuận</div>
                  <div className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                    {leaveRequests.filter(l => l.status === 'DA_DUYET').length}
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400">Được hưởng chế độ theo quy định</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-1">
                  <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Từ Chối / Hoãn</div>
                  <div className="text-xl font-black text-slate-700 dark:text-slate-300">
                    {leaveRequests.filter(l => l.status === 'TU_CHOI').length}
                  </div>
                  <div className="text-[10px] text-slate-400">Yêu cầu sắp xếp lại lịch</div>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="bg-white dark:bg-slate-850 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={leaveSearch}
                    onChange={(e) => setLeaveSearch(e.target.value)}
                    placeholder="Tìm theo tên nhân sự, lý do nghỉ..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>

                <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto">
                  {(['ALL', 'CHO_DUYET', 'DA_DUYET', 'TU_CHOI'] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => setLeaveFilterStatus(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        leaveFilterStatus === st
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {st === 'ALL' && `Tất cả (${leaveRequests.length})`}
                      {st === 'CHO_DUYET' && `Chờ duyệt (${leaveRequests.filter(l => l.status === 'CHO_DUYET').length})`}
                      {st === 'DA_DUYET' && `Đã duyệt (${leaveRequests.filter(l => l.status === 'DA_DUYET').length})`}
                      {st === 'TU_CHOI' && `Từ chối (${leaveRequests.filter(l => l.status === 'TU_CHOI').length})`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Leave Requests List */}
              <div className="space-y-3">
                {filteredLeaveRequests.length === 0 ? (
                  <div className="bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-2">
                    <Calendar className="h-8 w-8 text-slate-400 mx-auto" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Không tìm thấy đơn xin nghỉ phép nào</p>
                    <p className="text-xs text-slate-400">Không có dữ liệu phù hợp với bộ lọc tìm kiếm hiện tại.</p>
                  </div>
                ) : (
                  filteredLeaveRequests.map(req => (
                    <div
                      key={req.id}
                      className="bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-blue-300 dark:hover:border-blue-700"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">
                            {req.employeeName}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${LEAVE_TYPE_LABELS[req.leaveType]?.bg || 'bg-slate-100 text-slate-700'}`}>
                            {LEAVE_TYPE_LABELS[req.leaveType]?.label || req.leaveType}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            req.status === 'DA_DUYET' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                            req.status === 'TU_CHOI' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                            'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {req.status === 'DA_DUYET' ? '✓ Đã Phê Duyệt' : req.status === 'TU_CHOI' ? '✕ Từ Chối' : '⏳ Chờ Duyệt'}
                          </span>
                        </div>

                        <div className="text-xs text-slate-600 dark:text-slate-300">
                          <strong>Lý do:</strong> {req.reason}
                        </div>

                        <div className="text-[11px] text-slate-400">
                          Thời gian: <strong>{formatDate(req.startDate)} &rarr; {formatDate(req.endDate)}</strong> ({req.daysCount} ngày) • Ngày tạo: {formatDate(req.createdAt)}
                          {req.approverName && ` • Người duyệt: ${req.approverName}`}
                          {req.rejectionReason && ` • Lý do từ chối: "${req.rejectionReason}"`}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 shrink-0">
                        {req.status === 'CHO_DUYET' && canReviewLeave && (
                          <>
                            <button
                              onClick={() => handleApproveLeave(req.id, 'DA_DUYET')}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Chấp Thuận</span>
                            </button>
                            <button
                              onClick={() => handleApproveLeave(req.id, 'TU_CHOI')}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-950 dark:hover:text-rose-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                              <span>Từ Chối</span>
                            </button>
                          </>
                        )}
                        {(canReviewLeave || req.employeeId === currentUser?.id) && (
                          <button
                            onClick={() => handleDeleteLeave(req.id)}
                            className="flex items-center space-x-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                            title="Xóa đơn xin nghỉ phép"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Xóa</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* SUB-VIEW 2: BUSINESS TRIPS & FIELD MISSIONS */}
          {leaveSubTab === 'BUSINESS_TRIPS' && (
            <BusinessTripManager
              currentUser={currentUser}
              users={effectiveUsers}
              customers={effectiveCustomers}
            />
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: GROSS - NET CALCULATOR */}
      {/* ========================================================================= */}
      {activeTab === 'SALARY_CALCULATOR' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-850 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Công Cụ Mô Phỏng & Tính Lương Net &harr; Gross & Thuế TNCN
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tính toán chi tiết các khoản lương Gross, Net, trích nộp BHXH bắt buộc và biểu thuế lũy tiến từng phần.
                </p>
              </div>

              <div className="flex items-center space-x-2 text-xs bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Giảm trừ bản thân:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">15.500.000 đ</span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500 font-medium">NPT:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">6.200.000 đ/người</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Inputs */}
              <div className="space-y-4 bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">
                  1. Thông số thu nhập
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Lương Thỏa Thuận (Gross / tháng)
                  </label>
                  <input
                    type="number"
                    value={calcGross}
                    step={500000}
                    onChange={(e) => handleRunCalculator(Number(e.target.value), calcDependents, calcInsSalary)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-blue-600 focus:outline-hidden"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">{formatVND(calcGross)}</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mức Lương Đóng BHXH (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={calcInsSalary}
                    step={500000}
                    onChange={(e) => handleRunCalculator(calcGross, calcDependents, Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-hidden"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">{formatVND(calcInsSalary)}</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Số Người Phụ Thuộc (6.200.000đ / người)
                  </label>
                  <select
                    value={calcDependents}
                    onChange={(e) => handleRunCalculator(calcGross, Number(e.target.value), calcInsSalary)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-hidden cursor-pointer"
                  >
                    {[0, 1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>{n} người ({formatVND(n * 6200000)})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Deductions Breakdown */}
              <div className="space-y-3 bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">2. Khoản Trích & Giảm Trừ</h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>BHXH (8%):</span>
                    <span className="font-mono text-rose-600 font-bold">-{formatVND(customCalcResult.employeeInsurance.bhxh)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>BHYT (1.5%):</span>
                    <span className="font-mono text-rose-600 font-bold">-{formatVND(customCalcResult.employeeInsurance.bhyt)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>BHTN (1%):</span>
                    <span className="font-mono text-rose-600 font-bold">-{formatVND(customCalcResult.employeeInsurance.bhtn)}</span>
                  </div>
                  <div className="flex justify-between text-slate-800 dark:text-slate-200 font-bold pt-1 border-t border-slate-200 dark:border-slate-800">
                    <span>Tổng BHXH NLĐ (10.5%):</span>
                    <span className="font-mono text-rose-600">-{formatVND(customCalcResult.employeeInsurance.total)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300 pt-2">
                    <span>Giảm trừ bản thân:</span>
                    <span className="font-mono">-{formatVND(customCalcResult.personalDeduction)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Giảm trừ NPT ({calcDependents} người):</span>
                    <span className="font-mono">-{formatVND(customCalcResult.dependentsDeduction)}</span>
                  </div>
                  <div className="flex justify-between text-slate-800 dark:text-slate-200 font-semibold pt-1 border-t border-slate-200 dark:border-slate-800">
                    <span>Thu nhập tính thuế:</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{formatVND(customCalcResult.taxableIncome)}</span>
                  </div>
                  <div className="flex justify-between text-purple-700 dark:text-purple-300 font-bold pt-1 border-t border-slate-200 dark:border-slate-800">
                    <span>Thuế TNCN phải nộp (7 bậc):</span>
                    <span className="font-mono">-{formatVND(customCalcResult.personalIncomeTax)}</span>
                  </div>
                </div>
              </div>

              {/* Take-Home Net & Employer Total */}
              <div className="space-y-4 bg-emerald-50 dark:bg-emerald-950/40 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase">3. Kết Quả Thực Lĩnh & Chi Phí</h4>
                  
                  <div className="mt-4 text-center p-4 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-300 dark:border-emerald-800 shadow-xs">
                    <span className="text-xs text-slate-500 block uppercase font-semibold">Lương Thực Lĩnh (NET):</span>
                    <div className="text-2xl font-black text-emerald-600 mt-1">
                      {formatVND(customCalcResult.netSalary)}
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    <div className="font-bold text-slate-900 dark:text-white">Chi phí NSDLĐ trích nộp (23.5%):</div>
                    <div className="flex justify-between text-[11px]">
                      <span>BHXH DN (17.5%):</span>
                      <span className="font-mono">{formatVND(customCalcResult.employerCosts.bhxh)}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span>BHYT DN (3%):</span>
                      <span className="font-mono">{formatVND(customCalcResult.employerCosts.bhyt)}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span>BHTN DN (1%):</span>
                      <span className="font-mono">{formatVND(customCalcResult.employerCosts.bhtn)}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span>Kinh phí Công đoàn (2%):</span>
                      <span className="font-mono">{formatVND(customCalcResult.employerCosts.tradeUnion)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-blue-700 dark:text-blue-400 pt-2 border-t border-emerald-200 dark:border-emerald-800">
                      <span>Tổng chi phí Doanh nghiệp:</span>
                      <span className="font-mono">{formatVND(customCalcResult.employerCosts.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 7 TAX BRACKETS BREAKDOWN TABLE */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Chi Tiết Phân Bổ Biểu Thuế Lũy Tiến Từng Phần (7 Bậc)
                  </h4>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                      <th className="py-2.5 px-3 text-center w-16">Bậc</th>
                      <th className="py-2.5 px-3">Khung Thu Nhập Tính Thuế / Tháng</th>
                      <th className="py-2.5 px-3 text-center w-24">Thuế Suất</th>
                      <th className="py-2.5 px-3 text-right">Thu Nhập Tính Thuế Bậc Này</th>
                      <th className="py-2.5 px-3 text-right font-extrabold text-purple-700 dark:text-purple-300">Thuế Từng Bậc</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(customCalcResult.taxBrackets || []).map((tb) => {
                      const isActive = tb.taxableInBracket > 0;
                      return (
                        <tr 
                          key={tb.bracket} 
                          className={`transition-colors ${
                            isActive 
                              ? 'bg-purple-50/50 dark:bg-purple-950/20 font-medium' 
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          <td className="py-2 px-3 text-center font-bold">
                            <span className={`inline-block w-6 h-6 rounded-full text-center leading-6 text-[11px] ${
                              isActive 
                                ? 'bg-purple-600 text-white font-black' 
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}>
                              {tb.bracket}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">
                            {tb.thresholdLabel}
                          </td>
                          <td className="py-2 px-3 text-center font-black">
                            <span className={`px-2 py-0.5 rounded text-[11px] ${
                              isActive 
                                ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' 
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}>
                              {tb.taxRate}%
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono">
                            {formatVND(tb.taxableInBracket)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-purple-700 dark:text-purple-300">
                            {formatVND(tb.taxAmount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 dark:bg-slate-900 font-black text-xs border-t-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
                      <td colSpan={3} className="py-3 px-3 uppercase text-right">
                        Tổng cộng Thuế TNCN phải nộp:
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-indigo-600 dark:text-indigo-400">
                        {formatVND(customCalcResult.taxableIncome)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-purple-700 dark:text-purple-300 text-sm">
                        {formatVND(customCalcResult.personalIncomeTax)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SOP DETAIL */}
      {/* ========================================================================= */}
      {selectedSOP && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-200">
                  {selectedSOP.code}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {selectedSOP.title}
                </h3>
              </div>
              <button onClick={() => setSelectedSOP(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {selectedSOP.description}
            </p>

            <div className="p-3 bg-blue-50/60 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 text-xs">
              <strong className="text-blue-900 dark:text-blue-300">Căn cứ pháp lý:</strong> {selectedSOP.legalBasis}
            </div>

            {/* Step list */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">Chuỗi các bước thực hiện chi tiết:</h4>
              <div className="space-y-2">
                {selectedSOP.steps.map((step) => (
                  <div key={step.order} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                      <span>Bước {step.order}: {step.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        {step.role}
                      </span>
                    </div>
                    {step.requiredDocument && (
                      <div className="text-[11px] text-slate-500 italic">
                        Bằng chứng / Hồ sơ bắt buộc: {step.requiredDocument}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">Checklist kiểm soát chất lượng & pháp lý:</h4>
              <div className="space-y-1.5">
                {selectedSOP.checklist.map((c, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
              <button
                onClick={() => setSelectedSOP(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  const sop = selectedSOP;
                  setSelectedSOP(null);
                  if (onOpenCreateTaskWithSOP) {
                    onOpenCreateTaskWithSOP(sop);
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-xs"
              >
                Khởi Tạo Giao Việc Quy Trình Này
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT EMPLOYEE */}
      {/* ========================================================================= */}
      {showEmployeeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {empForm.id ? 'Cập Nhật Hồ Sơ Nhân Viên' : 'Thêm Nhân Sự Mới'}
              </h3>
              <button onClick={() => setShowEmployeeModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    value={empForm.name || ''}
                    onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email công vụ *</label>
                  <input
                    type="email"
                    required
                    value={empForm.email || ''}
                    onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={empForm.phone || ''}
                    onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>

                {/* Chức danh / Vị trí */}
                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Chức danh / Vị trí <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={
                      isCustomPosition
                        ? 'CUSTOM'
                        : (findPositionByName(empForm.position)?.id || (empForm.position ? 'CUSTOM' : 'TAX_STAFF'))
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'CUSTOM') {
                        setIsCustomPosition(true);
                      } else {
                        setIsCustomPosition(false);
                        const posDef = ALL_STANDARD_POSITIONS.find((p) => p.id === val);
                        if (posDef) {
                          setEmpForm((prev) => ({
                            ...prev,
                            position: posDef.name,
                            department: posDef.department,
                            role: posDef.defaultRole,
                            positionAllowance: posDef.defaultAllowance ?? prev.positionAllowance,
                            maxCustomerCapacity:
                              posDef.defaultCapacity !== undefined
                                ? posDef.defaultCapacity
                                : prev.maxCustomerCapacity,
                          }));
                        }
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                  >
                    {STANDARD_POSITION_GROUPS.map((group) => (
                      <optgroup key={group.groupName} label={`❖ ${group.groupName}`}>
                        {group.positions.map((pos) => (
                          <option key={pos.id} value={pos.id}>
                            {pos.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                    <optgroup label="❖ Tùy chọn khác">
                      <option value="CUSTOM">Khác (Tự nhập chức danh tùy chỉnh...)</option>
                    </optgroup>
                  </select>

                  {/* Role & Responsibility Description Note */}
                  {!isCustomPosition && findPositionByName(empForm.position)?.description && (
                    <div className="mt-1.5 flex items-start space-x-1.5 text-[11px] text-slate-600 dark:text-slate-300 bg-blue-50/70 dark:bg-blue-950/40 p-2 rounded-lg border border-blue-200/60 dark:border-blue-800/60">
                      <Info className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-blue-800 dark:text-blue-300">Phạm vi công việc & Trách nhiệm: </span>
                        <span>{findPositionByName(empForm.position)?.description}</span>
                      </div>
                    </div>
                  )}

                  {/* Custom Position Name Input if Selected */}
                  {isCustomPosition && (
                    <div className="mt-2 p-2.5 bg-amber-50/60 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                      <label className="block font-semibold text-[11px] text-amber-800 dark:text-amber-300 mb-1">
                        Nhập chức danh tùy chỉnh <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: Chuyên viên Tư vấn Thuế Quốc tế..."
                        value={empForm.position || ''}
                        onChange={(e) => setEmpForm({ ...empForm, position: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Phòng ban</label>
                  <select
                    value={empForm.department}
                    onChange={(e) => setEmpForm({ ...empForm, department: e.target.value as Department })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="KE_TOAN_THUE">Kế Toán Thuế & Đại Lý Thuế</option>
                    <option value="HANH_CHINH_NHAN_SU">Hành Chính - Nhân Sự & BHXH</option>
                    <option value="KINH_DOANH_CSKH">Kinh Doanh & Pháp Lý CSKH</option>
                    <option value="BAN_GIAM_DOC">Ban Giám Đốc</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Cấp bậc phân quyền</label>
                  <select
                    value={empForm.role || 'NHAN_VIEN'}
                    onChange={(e) => setEmpForm({ ...empForm, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium"
                  >
                    <option value="NHAN_VIEN">Nhân viên / Chuyên viên</option>
                    <option value="TRUONG_NHOM">Trưởng nhóm / Giám sát tổ</option>
                    <option value="TRUONG_PHONG">Trưởng phòng / Kế toán trưởng</option>
                    <option value="BAN_GIAM_DOC">Ban Giám Đốc / Ban Lãnh Đạo</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Phụ cấp chức vụ (VNĐ)</label>
                  <input
                    type="number"
                    step={100000}
                    value={empForm.positionAllowance || 0}
                    onChange={(e) => setEmpForm({ ...empForm, positionAllowance: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Loại Hợp Đồng Lao Động</label>
                  <select
                    value={empForm.contractType}
                    onChange={(e) => setEmpForm({ ...empForm, contractType: e.target.value as EmployeeContractType })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="THU_VIEC">Hợp đồng thử việc</option>
                    <option value="XAC_DINH_1_NAM">Hợp đồng xác định thời hạn 1 năm</option>
                    <option value="XAC_DINH_3_NAM">Hợp đồng xác định thời hạn 3 năm</option>
                    <option value="KHONG_XAC_DINH_THOI_HAN">Hợp đồng không xác định thời hạn</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Lương Cơ Bản Đóng BHXH (VNĐ)</label>
                  <input
                    type="number"
                    step={500000}
                    value={empForm.baseSalary || 0}
                    onChange={(e) => setEmpForm({ ...empForm, baseSalary: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Lương Thỏa Thuận Thực Tế (Gross VNĐ)</label>
                  <input
                    type="number"
                    step={500000}
                    value={empForm.actualSalary || 0}
                    onChange={(e) => setEmpForm({ ...empForm, actualSalary: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Số Người Phụ Thuộc (NPT)</label>
                  <input
                    type="number"
                    min={0}
                    value={empForm.taxDependents || 0}
                    onChange={(e) => setEmpForm({ ...empForm, taxDependents: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Định Mức Phụ Trách KH Tối Đa</label>
                  <input
                    type="number"
                    min={1}
                    value={empForm.maxCustomerCapacity || 7}
                    onChange={(e) => setEmpForm({ ...empForm, maxCustomerCapacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bằng cấp, Chứng chỉ hành nghề (phân cách bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  value={Array.isArray(empForm.qualifications) ? empForm.qualifications.join(', ') : empForm.qualifications || ''}
                  onChange={(e) => setEmpForm({ ...empForm, qualifications: e.target.value.split(',').map(s => s.trim()) })}
                  placeholder="Chứng chỉ Đại lý Thuế, Cử nhân Kế toán..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
                {empForm.id && empForm.status !== 'DA_NGHI_VIEC' ? (
                  <button
                    type="button"
                    onClick={() => {
                      const empToTerminate = employees.find(e => e.id === empForm.id);
                      setShowEmployeeModal(false);
                      if (empToTerminate) {
                        handleOpenTerminateModal(empToTerminate);
                      }
                    }}
                    className="flex items-center space-x-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    <UserX className="h-3.5 w-3.5" />
                    <span>Chấm dứt hợp đồng lao động</span>
                  </button>
                ) : <div />}

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowEmployeeModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Lưu Hồ Sơ Nhân Sự
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE LEAVE / FIELD ASSIGNMENT REQUEST */}
      {/* ========================================================================= */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Đăng Ký Nghỉ Phép
              </h3>
              <button onClick={() => setShowLeaveModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLeave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nhân sự thực hiện *</label>
                <select
                  value={newLeaveEmployeeId}
                  onChange={(e) => setNewLeaveEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.position})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Loại hình</label>
                <select
                  value={newLeaveType}
                  onChange={(e) => setNewLeaveType(e.target.value as LeaveType)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                >
                  <option value="PHEP_NAM">Nghỉ phép năm (hưởng 100% lương)</option>
                  <option value="NGHI_OM">Nghỉ ốm (hưởng chế độ BHXH)</option>
                  <option value="THAI_SAN">Nghỉ thai sản / khám thai</option>
                  <option value="VIEC_RIENG">Nghỉ việc riêng có lương</option>
                  <option value="NGHI_KHONG_LUONG">Nghỉ không hưởng lương</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Từ ngày</label>
                  <input
                    type="date"
                    value={newLeaveStart}
                    onChange={(e) => setNewLeaveStart(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Đến ngày</label>
                  <input
                    type="date"
                    value={newLeaveEnd}
                    onChange={(e) => setNewLeaveEnd(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Lý do xin nghỉ phép *</label>
                <textarea
                  rows={3}
                  required
                  value={newLeaveReason}
                  onChange={(e) => setNewLeaveReason(e.target.value)}
                  placeholder="Mô tả chi tiết lý do xin nghỉ phép..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Gửi Đơn Duyệt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADJUST MONTHLY ALLOWANCES & KPI BONUS */}
      {/* ========================================================================= */}
      {showAdjustModal && adjustingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <Sliders className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <span>Điều Chỉnh Phụ Cấp & Thưởng KPI</span>
                    <span className="px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 text-xs font-black">
                      Tháng {adjustingRecord.month.toString().padStart(2, '0')}/{adjustingRecord.year}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Nhân sự: <strong className="text-slate-800 dark:text-slate-200">{adjustingRecord.employeeName}</strong> ({adjustingRecord.position})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowAdjustModal(false);
                  setAdjustingRecord(null);
                }} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Live Calculation Preview Calculation */}
            {(() => {
              const emp = employees.find(e => e.id === adjustingRecord.employeeId);
              const depCount = emp?.taxDependents ?? 0;
              const grossLive = (Number(adjustForm.actualSalary) || adjustingRecord.actualSalary) +
                (Number(adjustForm.positionAllowance) || 0) +
                (Number(adjustForm.lunchAllowance) || 0) +
                (Number(adjustForm.phoneAllowance) || 0) +
                (Number(adjustForm.performanceBonus) || 0);

              const liveNet = storageService.calculateNetSalary(grossLive, depCount, adjustingRecord.baseSalary);

              return (
                <form onSubmit={handleSaveAdjustment} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                    
                    {/* Left Column: Form Inputs */}
                    <div className="md:col-span-7 space-y-3.5">
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-semibold">
                          <span>Lương cơ bản đóng BHXH:</span>
                          <span className="font-mono text-slate-900 dark:text-white font-bold">{formatVND(adjustingRecord.baseSalary)}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-semibold">
                          <span>Số người phụ thuộc (NPT):</span>
                          <span className="font-mono text-slate-900 dark:text-white font-bold">{depCount} người</span>
                        </div>
                      </div>

                      {/* Phụ Cấp Chức Vụ */}
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Phụ Cấp Trách Nhiệm / Chức Vụ (VNĐ/tháng)
                        </label>
                        <input
                          type="number"
                          step={100000}
                          min={0}
                          value={adjustForm.positionAllowance}
                          onChange={(e) => setAdjustForm({ ...adjustForm, positionAllowance: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold"
                        />
                      </div>

                      {/* Phụ Cấp Ăn Trưa */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-semibold text-slate-700 dark:text-slate-300">
                            Phụ Cấp Ăn Trưa (VNĐ/tháng)
                          </label>
                          <span className="text-[10px] text-slate-400">Định mức chuẩn: 800.000 đ</span>
                        </div>
                        <input
                          type="number"
                          step={50000}
                          min={0}
                          value={adjustForm.lunchAllowance}
                          onChange={(e) => setAdjustForm({ ...adjustForm, lunchAllowance: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold"
                        />
                      </div>

                      {/* Phụ Cấp Điện Thoại & Xăng Xe */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-semibold text-slate-700 dark:text-slate-300">
                            Phụ Cấp Điện Thoại & Xăng Xe / Đi Lại (VNĐ/tháng)
                          </label>
                          <span className="text-[10px] text-slate-400">Định mức chuẩn: 300.000 - 500.000 đ</span>
                        </div>
                        <input
                          type="number"
                          step={50000}
                          min={0}
                          value={adjustForm.phoneAllowance}
                          onChange={(e) => setAdjustForm({ ...adjustForm, phoneAllowance: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold"
                        />
                      </div>

                      {/* Thưởng KPI Tháng */}
                      <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center space-x-1.5">
                            <Sparkles className="h-4 w-4 text-emerald-600" />
                            <span>Thưởng Hiệu Quả & Năng Suất KPI Tháng (VNĐ)</span>
                          </label>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/80 px-2 py-0.5 rounded-full">
                            Điều chỉnh theo tháng
                          </span>
                        </div>
                        <input
                          type="number"
                          step={100000}
                          min={0}
                          value={adjustForm.performanceBonus}
                          onChange={(e) => setAdjustForm({ ...adjustForm, performanceBonus: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-300"
                        />

                        {/* Quick Presets for KPI Bonus */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span className="text-[10px] text-slate-500 font-medium">Chọn nhanh:</span>
                          {[
                            { label: '0 đ', val: 0 },
                            { label: '+500k', val: 500000 },
                            { label: '+1.0M', val: 1000000 },
                            { label: '+1.5M', val: 1500000 },
                            { label: '+2.0M', val: 2000000 },
                            { label: '+3.0M', val: 3000000 },
                          ].map(preset => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => setAdjustForm({ ...adjustForm, performanceBonus: preset.val })}
                              className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                                adjustForm.performanceBonus === preset.val
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950'
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Lý do thưởng KPI */}
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Căn Cứ / Lý Do Thưởng KPI & Điều Chỉnh
                        </label>
                        <input
                          type="text"
                          value={adjustForm.bonusReason}
                          onChange={(e) => setAdjustForm({ ...adjustForm, bonusReason: e.target.value })}
                          placeholder="Ví dụ: Vượt 120% chỉ tiêu KPI tờ khai tháng hoặc Thưởng quyết toán thuế sớm..."
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                        />
                        <div className="flex items-center gap-1 flex-wrap mt-1.5">
                          {[
                            'Đạt 100% KPI tháng',
                            'Vượt 120% chỉ tiêu KPI',
                            'Hoàn thành sớm quyết toán thuế',
                            'Tư vấn thêm khách hàng mới',
                            'Nhân viên xuất sắc tháng',
                          ].map(reason => (
                            <button
                              key={reason}
                              type="button"
                              onClick={() => setAdjustForm({ ...adjustForm, bonusReason: reason })}
                              className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
                            >
                              + {reason}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Ghi chú */}
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Ghi Chú Kế Toán / Nhân Sự
                        </label>
                        <textarea
                          rows={2}
                          value={adjustForm.adjustmentNotes}
                          onChange={(e) => setAdjustForm({ ...adjustForm, adjustmentNotes: e.target.value })}
                          placeholder="Ghi chú nội bộ cho kỳ lương..."
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    {/* Right Column: Live Calculated Salary Breakdown */}
                    <div className="md:col-span-5 bg-gradient-to-b from-slate-50 to-slate-100/70 dark:from-slate-800/80 dark:to-slate-900/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                          <h4 className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                            <Calculator className="h-4 w-4 text-blue-600" />
                            <span>Bảng Tính Tự Động Tức Thời</span>
                          </h4>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                            TT 87/2026
                          </span>
                        </div>

                        <div className="mt-3 space-y-2 text-xs">
                          <div className="flex justify-between text-slate-600 dark:text-slate-300">
                            <span>Lương thỏa thuận cơ sở:</span>
                            <span className="font-mono">{formatVND(adjustingRecord.actualSalary)}</span>
                          </div>

                          <div className="flex justify-between text-slate-600 dark:text-slate-300">
                            <span>(+) Tổng phụ cấp tháng:</span>
                            <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                              +{formatVND(adjustForm.positionAllowance + adjustForm.lunchAllowance + adjustForm.phoneAllowance)}
                            </span>
                          </div>

                          <div className="flex justify-between text-emerald-700 dark:text-emerald-300 font-semibold">
                            <span>(+) Thưởng KPI tháng:</span>
                            <span className="font-mono font-bold">
                              +{formatVND(adjustForm.performanceBonus)}
                            </span>
                          </div>

                          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-slate-900 dark:text-white">
                            <span>(=) Tổng Thu Nhập Gross:</span>
                            <span className="font-mono text-sm">{formatVND(grossLive)}</span>
                          </div>

                          <div className="pt-2 space-y-1 text-[11px] text-slate-500">
                            <div className="flex justify-between text-rose-600 dark:text-rose-400">
                              <span>(-) BHXH, BHYT, BHTN NLĐ (10.5%):</span>
                              <span className="font-mono">-{formatVND(liveNet.employeeInsurance.total)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>(-) Giảm trừ bản thân (TT 87):</span>
                              <span className="font-mono">-15.500.000 đ</span>
                            </div>
                            {depCount > 0 && (
                              <div className="flex justify-between">
                                <span>(-) Giảm trừ {depCount} NPT (6.2tr/người):</span>
                                <span className="font-mono">-{formatVND(liveNet.dependentsDeduction)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-purple-600 dark:text-purple-400 font-semibold">
                              <span>(-) Thuế TNCN khấu trừ (7 bậc):</span>
                              <span className="font-mono">-{formatVND(liveNet.personalIncomeTax)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Net Result Highlight Box */}
                        <div className="mt-4 p-3.5 rounded-xl bg-emerald-600 text-white shadow-md space-y-1 text-center">
                          <div className="text-[11px] font-medium text-emerald-100">
                            LƯƠNG THỰC LĨNH THÁNG {adjustingRecord.month.toString().padStart(2, '0')}/{adjustingRecord.year} (NET)
                          </div>
                          <div className="text-xl font-extrabold font-mono tracking-tight">
                            {formatVND(liveNet.netSalary)}
                          </div>
                        </div>

                        {/* Employer Cost */}
                        <div className="mt-3 p-2.5 rounded-xl bg-slate-200/60 dark:bg-slate-800/80 text-[11px] text-slate-600 dark:text-slate-300 flex justify-between">
                          <span>Tổng chi phí Doanh Nghiệp:</span>
                          <span className="font-mono font-bold text-blue-700 dark:text-blue-300">
                            {formatVND(liveNet.employerCosts.total)}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAdjustModal(false);
                            setAdjustingRecord(null);
                          }}
                          className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-300 cursor-pointer"
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center space-x-1.5"
                        >
                          <Check className="h-4 w-4" />
                          <span>Lưu Điều Chỉnh Tháng</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONTRACT TERMINATION & HANDOVER */}
      {/* ========================================================================= */}
      {showTerminationModal && terminatingEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-rose-200 dark:border-rose-900/60 space-y-5 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                  <UserX className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <span>Chấm Dứt Hợp Đồng Lao Động & Bàn Giao</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Quyết định thôi việc, chốt chế độ bảo hiểm và tự động chuyển giao công việc
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowTerminationModal(false);
                  setTerminatingEmployee(null);
                }} 
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Warning / Summary Info Box */}
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-200">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 flex items-center justify-center font-bold text-xs">
                    {terminatingEmployee.name.split(' ').slice(-1)[0][0]}
                  </span>
                  <span>{terminatingEmployee.name} ({terminatingEmployee.code}) - {terminatingEmployee.position}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-200/80 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-[10px] font-bold">
                  {CONTRACT_TYPE_LABELS[terminatingEmployee.contractType]?.label}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-amber-200/60 dark:border-amber-800/60 text-slate-700 dark:text-slate-300 text-[11px]">
                <div>Ngày vào làm: <strong>{formatDate(terminatingEmployee.dateOfJoining)}</strong></div>
                <div>Đang quản lý: <strong className="text-blue-600 dark:text-blue-400">{terminatingEmployee.managedCustomersCount || 0} Doanh nghiệp</strong></div>
                <div>Công việc đang xử lý: <strong className="text-amber-600 dark:text-amber-400">{terminatingEmployee.activeTasksCount || 0} Việc</strong></div>
              </div>
            </div>

            <form onSubmit={handleConfirmTermination} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Ngày Chấm Dứt HĐLĐ (Ngày làm việc cuối) *
                  </label>
                  <input
                    type="date"
                    required
                    value={terminationForm.terminationDate}
                    onChange={(e) => setTerminationForm({ ...terminationForm, terminationDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium text-xs focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Số Quyết Định Thôi Việc / Thanh Lý HĐLĐ
                  </label>
                  <input
                    type="text"
                    value={terminationForm.terminationDecisionNo}
                    onChange={(e) => setTerminationForm({ ...terminationForm, terminationDecisionNo: e.target.value })}
                    placeholder="VD: QĐ-08/2026/QĐ-TGD-..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Căn cứ & Lý do chấm dứt hợp đồng lao động *
                </label>
                <select
                  value={terminationForm.terminationReason}
                  onChange={(e) => setTerminationForm({ ...terminationForm, terminationReason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                >
                  {TERMINATION_REASONS.map((r, idx) => (
                    <option key={idx} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Handover Section */}
              <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800/80 space-y-2.5">
                <div className="flex items-center space-x-1.5 font-bold text-blue-900 dark:text-blue-200 text-xs">
                  <ArrowRightLeft className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>Tự Động Bàn Giao Khách Hàng & Công Việc Phụ Trách</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Hệ thống sẽ tự động chuyển giao toàn bộ {terminatingEmployee.managedCustomersCount || 0} khách hàng đại lý thuế và các công việc chưa hoàn tất sang nhân sự được chỉ định dưới đây:
                </p>
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1 text-[11px]">
                    Nhân viên tiếp nhận bàn giao:
                  </label>
                  <select
                    value={terminationForm.handoverStaffId}
                    onChange={(e) => setTerminationForm({ ...terminationForm, handoverStaffId: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 rounded-lg text-xs font-semibold"
                  >
                    <option value="">-- Không chỉ định bàn giao (để trống) --</option>
                    {employees
                      .filter(e => e.id !== terminatingEmployee.id && e.status !== 'DA_NGHI_VIEC')
                      .map(e => (
                        <option key={e.id} value={e.id}>
                          {e.name} ({e.code} - {e.position} - Đang giữ {e.managedCustomersCount || 0}/{e.maxCustomerCapacity} KH)
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Legal & Administrative Checklists */}
              <div className="space-y-2 pt-1">
                <label className="block font-bold text-slate-800 dark:text-slate-200 text-xs">
                  Thủ tục hành chính bắt buộc khi chấm dứt HĐLĐ (Tuân thủ BLLĐ 2019):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px]">
                  <label className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={terminationForm.notifyBHXH}
                      onChange={(e) => setTerminationForm({ ...terminationForm, notifyBHXH: e.target.checked })}
                      className="rounded text-rose-600"
                    />
                    <span>Báo giảm BHXH (Mẫu D02-LT) & Chốt sổ BHXH</span>
                  </label>
                  <label className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={terminationForm.finalizeTax}
                      onChange={(e) => setTerminationForm({ ...terminationForm, finalizeTax: e.target.checked })}
                      className="rounded text-rose-600"
                    />
                    <span>Quyết toán thuế TNCN & Cấp chứng từ khấu trừ thuế</span>
                  </label>
                  <label className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={terminationForm.returnDocs}
                      onChange={(e) => setTerminationForm({ ...terminationForm, returnDocs: e.target.checked })}
                      className="rounded text-rose-600"
                    />
                    <span>Thanh toán lương ngày công còn lại & phép năm tồn</span>
                  </label>
                  <label className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={terminationForm.revokeAccess}
                      onChange={(e) => setTerminationForm({ ...terminationForm, revokeAccess: e.target.checked })}
                      className="rounded text-rose-600"
                    />
                    <span>Thu hồi USB Token CKS, Email và Tài khoản hệ thống</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Biên bản bàn giao & Ghi chú thanh lý hợp đồng
                </label>
                <textarea
                  rows={2}
                  value={terminationForm.terminationNote}
                  onChange={(e) => setTerminationForm({ ...terminationForm, terminationNote: e.target.value })}
                  placeholder="Ghi chú chi tiết về tình trạng hồ sơ sổ sách, chứng từ kế toán và tài sản công ty đã bàn giao..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowTerminationModal(false);
                    setTerminatingEmployee(null);
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer"
                >
                  <UserX className="h-4 w-4" />
                  <span>Xác Nhận Chấm Dứt Hợp Đồng Lao Động</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EMPLOYEE FULL PROFILE & CONTRACT DETAILS */}
      {/* ========================================================================= */}
      {showDetailModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
              <div className="flex items-center space-x-3.5">
                <div className={`w-12 h-12 rounded-full font-bold flex items-center justify-center text-lg text-white shadow-md ${
                  selectedEmployee.status === 'DA_NGHI_VIEC'
                    ? 'bg-gradient-to-tr from-slate-500 to-rose-600'
                    : 'bg-gradient-to-tr from-blue-600 to-indigo-600'
                }`}>
                  {selectedEmployee.name.split(' ').slice(-1)[0][0]}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {selectedEmployee.name}
                    </h3>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                      {selectedEmployee.code}
                    </span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${EMPLOYEE_STATUS_LABELS[selectedEmployee.status || 'DANG_LAM_VIEC']?.badge}`}>
                      {EMPLOYEE_STATUS_LABELS[selectedEmployee.status || 'DANG_LAM_VIEC']?.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedEmployee.position} &bull; Phòng: <span className="font-medium text-slate-700 dark:text-slate-300">{selectedEmployee.department}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedEmployee(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Termination Banner if DA_NGHI_VIEC */}
            {selectedEmployee.status === 'DA_NGHI_VIEC' && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/50 rounded-xl border border-rose-200 dark:border-rose-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-rose-800 dark:text-rose-300">
                  <span className="flex items-center space-x-1.5 text-sm">
                    <AlertOctagon className="h-4 w-4 text-rose-600" />
                    <span>Hợp đồng lao động đã chấm dứt</span>
                  </span>
                  <span className="font-mono">Ngày thôi việc: {formatDate(selectedEmployee.terminationDate)}</span>
                </div>
                {selectedEmployee.terminationDecisionNo && (
                  <div className="font-mono text-slate-700 dark:text-slate-300 text-xs">
                    Số Quyết Định: <strong>{selectedEmployee.terminationDecisionNo}</strong>
                  </div>
                )}
                <div className="text-slate-700 dark:text-slate-300">
                  <strong>Căn cứ / Lý do chấm dứt:</strong> {selectedEmployee.terminationReason}
                </div>
                {selectedEmployee.terminationHandoverToStaffName && (
                  <div className="text-slate-700 dark:text-slate-300 flex items-center space-x-1 pt-1 border-t border-rose-200 dark:border-rose-800/60">
                    <ArrowRightLeft className="h-3.5 w-3.5 text-rose-600" />
                    <span>Nhân sự tiếp nhận bàn giao: <strong>{selectedEmployee.terminationHandoverToStaffName}</strong></span>
                  </div>
                )}
                {selectedEmployee.terminationNote && (
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 italic bg-white/60 dark:bg-slate-900/60 p-2 rounded-lg border border-rose-100 dark:border-rose-900/40">
                    &ldquo;{selectedEmployee.terminationNote}&rdquo;
                  </div>
                )}
              </div>
            )}

            {/* General Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Contract & Administrative */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5 text-xs pb-1.5 border-b border-slate-200 dark:border-slate-700">
                  <FileText className="h-3.5 w-3.5 text-blue-600" />
                  <span>Hợp Đồng & Thông Tin Hành Chính</span>
                </h4>
                <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span>Loại hợp đồng:</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${CONTRACT_TYPE_LABELS[selectedEmployee.contractType]?.color}`}>
                      {CONTRACT_TYPE_LABELS[selectedEmployee.contractType]?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ngày vào làm:</span>
                    <strong className="text-slate-900 dark:text-white">{formatDate(selectedEmployee.dateOfJoining)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Ngày bắt đầu HĐ:</span>
                    <strong className="text-slate-900 dark:text-white">{formatDate(selectedEmployee.contractStartDate)}</strong>
                  </div>
                  {selectedEmployee.contractEndDate && (
                    <div className="flex justify-between">
                      <span>Ngày kết thúc HĐ:</span>
                      <strong className="text-slate-900 dark:text-white">{formatDate(selectedEmployee.contractEndDate)}</strong>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Email công vụ:</span>
                    <span className="font-mono text-slate-900 dark:text-white">{selectedEmployee.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Điện thoại:</span>
                    <span className="font-mono text-slate-900 dark:text-white">{selectedEmployee.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Người phụ thuộc (NPT):</span>
                    <strong className="text-slate-900 dark:text-white">{selectedEmployee.taxDependents || 0} người</strong>
                  </div>
                </div>
              </div>

              {/* Salary & Capacity */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5 text-xs pb-1.5 border-b border-slate-200 dark:border-slate-700">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Mức Lương & Định Mức Khách Hàng</span>
                </h4>
                <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span>Lương cơ bản (đóng BHXH):</span>
                    <strong className="font-mono text-blue-700 dark:text-blue-300">{formatVND(selectedEmployee.baseSalary)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Lương Gross thực tế:</span>
                    <strong className="font-mono text-emerald-700 dark:text-emerald-300">{formatVND(selectedEmployee.actualSalary)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Phụ cấp ăn trưa:</span>
                    <span className="font-mono">{formatVND(selectedEmployee.lunchAllowance || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phụ cấp điện thoại & xăng xe:</span>
                    <span className="font-mono">{formatVND(selectedEmployee.phoneAllowance || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phụ cấp trách nhiệm / chức vụ:</span>
                    <span className="font-mono">{formatVND(selectedEmployee.positionAllowance || 0)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700">
                    <span>Định mức khách hàng tối đa:</span>
                    <strong className="text-slate-900 dark:text-white">{selectedEmployee.managedCustomersCount || 0} / {selectedEmployee.maxCustomerCapacity} KH</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Qualifications */}
            <div className="space-y-1.5 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">Chứng chỉ chuyên môn & Bằng cấp:</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedEmployee.qualifications.map((q, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-medium text-xs"
                  >
                    {q}
                  </span>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
              {selectedEmployee.status === 'DA_NGHI_VIEC' ? (
                <button
                  type="button"
                  onClick={() => {
                    handleReactivateContract(selectedEmployee);
                    setShowDetailModal(false);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  <Undo2 className="h-4 w-4" />
                  <span>Tái Kích Hoạt Hợp Đồng Lao Động</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowDetailModal(false);
                    handleOpenTerminateModal(selectedEmployee);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  <UserX className="h-4 w-4" />
                  <span>Chấm Dứt Hợp Đồng Lao Động</span>
                </button>
              )}

              <div className="flex items-center space-x-2 ml-auto">
                <button
                  type="button"
                  onClick={() => {
                    const emp = selectedEmployee;
                    setShowDetailModal(false);
                    handleOpenDeleteModal(emp);
                  }}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-2xs"
                  title="Xoá nhân sự vĩnh viễn và phân bổ lại dữ liệu"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Xoá Nhân Sự</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowDetailModal(false);
                    setEmpForm(selectedEmployee);
                    setIsCustomPosition(!findPositionByName(selectedEmployee.position));
                    setShowEmployeeModal(true);
                  }}
                  className="px-4 py-2 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-bold hover:bg-blue-100 cursor-pointer flex items-center space-x-1"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Chỉnh Sửa Hồ Sơ</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedEmployee(null);
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SAFE DELETE CONFIRMATION MODAL (CỬA SỔ XÁC NHẬN XÓA AN TOÀN) */}
      {/* ========================================================================= */}
      {showDeleteModal && deletingEmployee && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-850 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-rose-600 to-red-700 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-white/20 rounded-xl">
                  <Trash2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">Xác Nhận Xóa Nhân Sự</h3>
                  <p className="text-xs text-rose-100 mt-0.5">Quy trình xóa an toàn & phân bổ lại khách hàng</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingEmployee(null);
                }}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Employee Summary Card */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-rose-600 to-red-600 font-bold flex items-center justify-center text-lg text-white shrink-0 shadow-xs">
                  {deletingEmployee.name.split(' ').slice(-1)[0][0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {deletingEmployee.name}
                    </span>
                    <span className="text-xs font-mono text-slate-400">({deletingEmployee.code})</span>
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {deletingEmployee.position} &bull; {deletingEmployee.department}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    {deletingEmployee.email}
                  </div>
                </div>
              </div>

              {/* Safety Warnings & Impact Analysis */}
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-200 space-y-1">
                  <div className="font-bold flex items-center space-x-1.5 text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>Thu hồi tài khoản & thông tin đăng nhập</span>
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                    Hệ thống sẽ tự động vô hiệu hóa và thu hồi thông tin đăng nhập tài khoản người dùng liên kết, giải nén định nghĩa và thu hồi toàn bộ quyền truy cập nội bộ.
                  </p>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-blue-900 dark:text-blue-200 space-y-1">
                  <div className="font-bold flex items-center space-x-1.5 text-blue-800 dark:text-blue-300">
                    <ArrowRightLeft className="h-4 w-4 shrink-0 text-blue-600" />
                    <span>Dữ liệu Doanh nghiệp & Công việc đang phụ trách</span>
                  </div>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
                    Hiện nhân sự đang phụ trách <strong className="font-bold text-blue-900 dark:text-blue-100">{deletingEmployee.managedCustomersCount || 0} doanh nghiệp</strong> và <strong className="font-bold text-blue-900 dark:text-blue-100">{deletingEmployee.activeTasksCount || 0} công việc</strong>. Vui lòng chỉ định nhân viên tiếp nhận bên dưới để tự động phân bổ lại, tránh gián đoạn dịch vụ thuế cho khách hàng.
                  </p>
                </div>
              </div>

              {/* Handover Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Chỉ định nhân sự tiếp nhận bàn giao Khách hàng & Công việc:
                </label>
                <select
                  value={deleteHandoverStaffId}
                  onChange={(e) => setDeleteHandoverStaffId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                >
                  <option value="">-- Để trống (Chưa bàn giao ngay, đưa vào diện chờ điều phối) --</option>
                  {employees
                    .filter(e => e.id !== deletingEmployee.id && e.status !== 'DA_NGHI_VIEC')
                    .map(e => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({e.code}) - {e.position} ({e.managedCustomersCount || 0}/{e.maxCustomerCapacity} DN)
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Nếu chọn nhân sự tiếp nhận, toàn bộ khách hàng và công việc đang xử lý sẽ tự động chuyển sang nhân sự mới.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingEmployee(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                <span>Xác Nhận Xóa Nhân Sự</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

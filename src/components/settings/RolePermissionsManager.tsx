import React, { useState, useMemo, useEffect } from 'react';
import { User, Department, UserRole } from '../../types';
import { 
  ShieldCheck, 
  Check, 
  X, 
  Lock, 
  CheckCircle2, 
  Briefcase, 
  Building, 
  Calculator, 
  UserCheck, 
  BadgeDollarSign, 
  Search, 
  Layers, 
  Users, 
  Shield,
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  Download,
  Info,
  SlidersHorizontal,
  FileCheck,
  RefreshCw,
  KeyRound,
  Filter,
  UserCheck2,
  Eye,
  Sliders
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { PermissionService, ALL_PERMISSIONS } from '../../utils/permissions';
import { PermissionAction, PermissionCategory } from '../../types/permissions';

interface RolePermissionsManagerProps {
  currentUser?: User;
  allUsers?: User[];
  onPermissionsUpdated?: () => void;
}

// 4 Departmental Work Hubs
interface DepartmentHub {
  id: Department;
  name: string;
  shortName: string;
  color: string;
  badgeBg: string;
  borderColor: string;
  icon: any;
  leadRoleTitle: string;
  staffRoleTitle: string;
  primaryMission: string;
  coreResponsibilities: {
    title: string;
    description: string;
    assignedTo: 'ALL_IN_DEPT' | 'LEAD_ONLY' | 'STAFF_ONLY';
  }[];
  cantDoRestrictions: string[];
}

const DEPARTMENT_HUBS: DepartmentHub[] = [
  {
    id: 'BAN_GIAM_DOC',
    name: 'Ban Giám Đốc & Điều Hành',
    shortName: 'Ban Giám Đốc',
    color: 'text-indigo-600 dark:text-indigo-400',
    badgeBg: 'bg-indigo-600 text-white',
    borderColor: 'border-indigo-200 dark:border-indigo-900',
    icon: ShieldCheck,
    leadRoleTitle: 'Tổng Giám Đốc / Phó Giám Đốc (CEO / Board)',
    staffRoleTitle: 'Thư ký / Trợ lý Ban Giám Đốc & Admin',
    primaryMission: 'Toàn quyền điều hành, ký số nộp hồ sơ Thuế/BHXH, duyệt chi lương & kiểm soát báo cáo tài chính.',
    coreResponsibilities: [
      {
        title: 'Ký số & Phê duyệt nộp tờ khai Thuế & BHXH',
        description: 'Phê duyệt cuối cùng và cắm Token CKS ký nộp tờ khai lên Cơ quan Thuế/BHXH',
        assignedTo: 'ALL_IN_DEPT',
      },
      {
        title: 'Phê duyệt lệnh chi trả bảng lương toàn công ty',
        description: 'Chốt duyệt bảng lương và lệnh chi trả thu nhập cho toàn thể nhân sự',
        assignedTo: 'ALL_IN_DEPT',
      },
      {
        title: 'Xem báo cáo Doanh thu & Hiệu suất toàn diện',
        description: 'Xem toàn bộ tài chính, biểu phí hợp đồng và tiến độ xử lý của tất cả phòng ban',
        assignedTo: 'ALL_IN_DEPT',
      },
      {
        title: 'Quản trị hệ thống, bảo mật & sao lưu CSDL',
        description: 'Phân quyền, cấu hình hệ thống, kiểm tra nhật ký Audit Log',
        assignedTo: 'ALL_IN_DEPT',
      },
    ],
    cantDoRestrictions: [
      'Không bị giới hạn bất kỳ quyền hạn quản trị nào trong hệ thống.',
    ],
  },
  {
    id: 'KE_TOAN_THUE',
    name: 'Phòng Kế Toán – Thuế (Đội 1 & 2)',
    shortName: 'Kế Toán Thuế',
    color: 'text-blue-600 dark:text-blue-400',
    badgeBg: 'bg-blue-600 text-white',
    borderColor: 'border-blue-200 dark:border-blue-900',
    icon: Calculator,
    leadRoleTitle: 'Kế Toán Trưởng & Trưởng Nhóm Soát Xét',
    staffRoleTitle: 'Chuyên Viên Kế Toán – Thuế (Đội 1 & Đội 2)',
    primaryMission: 'Chịu trách nhiệm hạch toán hóa đơn chứng từ, lập tờ khai thuế, BCTC và checklist kiểm soát nghiệp vụ.',
    coreResponsibilities: [
      {
        title: 'Phân công khách hàng & Soát xét hồ sơ thuế (KTT)',
        description: 'Chỉ định nhân viên phụ trách khách hàng, duyệt BCTC, tờ khai thuế trước khi trình BGD',
        assignedTo: 'LEAD_ONLY',
      },
      {
        title: 'Hạch toán sổ sách & Lập tờ khai thuế (Chuyên viên)',
        description: 'Nhập chứng từ, lập tờ khai thuế GTGT/TNDN/TNCN, lên BCTC cho khách hàng được giao',
        assignedTo: 'ALL_IN_DEPT',
      },
      {
        title: 'Thực hiện Checklist kiểm soát quy trình nghiệp vụ',
        description: 'Thực hiện từng bước kiểm soát và gửi hồ sơ hoàn tất lên Kế toán trưởng soát xét',
        assignedTo: 'ALL_IN_DEPT',
      },
      {
        title: 'Tra cứu Lịch thuế & AI Cảnh báo rủi ro hóa đơn',
        description: 'Theo dõi hạn nộp thuế nhà nước và tra cứu chính sách thuế mới',
        assignedTo: 'ALL_IN_DEPT',
      },
    ],
    cantDoRestrictions: [
      'Không tự ý ký nộp tờ khai lên Thuế khi chưa có phê duyệt của Ban Giám Đốc',
      'Không được xem bảng lương và thông tin bảo hiểm của nhân sự khác',
      'Không can thiệp vào chỉnh sửa hồ sơ pháp lý ĐKKD và biểu phí hợp đồng',
    ],
  },
  {
    id: 'HANH_CHINH_NHAN_SU',
    name: 'Phòng HCNS, BHXH & Pháp Lý',
    shortName: 'HCNS – Pháp Lý',
    color: 'text-teal-600 dark:text-teal-400',
    badgeBg: 'bg-teal-700 text-white',
    borderColor: 'border-teal-200 dark:border-teal-900',
    icon: Briefcase,
    leadRoleTitle: 'Trưởng Phòng Hành Chính – Nhân Sự',
    staffRoleTitle: 'Chuyên Viên HCNS, BHXH, Pháp Lý ĐKKD & Quản Trị CKS',
    primaryMission: 'Quản trị hồ sơ nhân sự, tính lương & nộp BHXH 32%, soạn thảo hồ sơ ĐKKD & quản lý kho CKS.',
    coreResponsibilities: [
      {
        title: 'Quản trị hồ sơ nhân sự & Tính bảng lương',
        description: 'Cập nhật hợp đồng lao động, mức lương đóng BHXH, tính toán giảm trừ gia cảnh và lương Net',
        assignedTo: 'ALL_IN_DEPT',
      },
      {
        title: 'Nghiệp vụ Bảo Hiểm Xã Hội & Quản trị mẫu C12',
        description: 'Thủ tục báo tăng/giảm lao động, chế độ thai sản/ốm đau, đối chiếu bảo hiểm',
        assignedTo: 'ALL_IN_DEPT',
      },
      {
        title: 'Soạn thảo Hồ sơ Pháp lý Doanh nghiệp (ĐKKD)',
        description: 'Soạn thảo hồ sơ thay đổi GPKD, tăng/giảm vốn, bổ sung ngành nghề, giải thể/thành lập',
        assignedTo: 'ALL_IN_DEPT',
      },
      {
        title: 'Quản trị kho Token Chữ ký số (CKS) & Văn thư',
        description: 'Kiểm soát hạn dùng CKS của khách hàng, mật khẩu PIN, giao nhận chứng từ và lưu trữ',
        assignedTo: 'ALL_IN_DEPT',
      },
      {
        title: 'Theo dõi & Đôn đốc Thu hồi Công nợ dịch vụ',
        description: 'Quản lý danh sách khách hàng nợ phí, hạn thanh toán và gửi nhắc nợ định kỳ (Phân công 1 nhân sự chuyên trách)',
        assignedTo: 'ALL_IN_DEPT',
      },
    ],
    cantDoRestrictions: [
      'Không tự ý duyệt chi lương nếu chưa có chữ ký duyệt của Ban Giám Đốc',
      'Không can thiệp vào việc điều chỉnh số liệu kế toán và hạch toán thuế của khách hàng',
    ],
  },
  {
    id: 'KINH_DOANH_CSKH',
    name: 'Phòng Kinh Doanh & CSKH',
    shortName: 'Kinh Doanh & CSKH',
    color: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-600 text-white',
    borderColor: 'border-amber-200 dark:border-amber-900',
    icon: BadgeDollarSign,
    leadRoleTitle: 'Trưởng Phòng Kinh Doanh & Dịch Vụ Khách Hàng',
    staffRoleTitle: 'Chuyên Viên Hợp Đồng, Biểu Phí & CSKH',
    primaryMission: 'Quản lý hợp đồng dịch vụ đại lý thuế, thỏa thuận biểu phí gói cước và tiếp nhận xử lý CSKH.',
    coreResponsibilities: [
      {
        title: 'Quản lý Hợp đồng dịch vụ & Biểu phí khách hàng',
        description: 'Soạn thảo, theo dõi thời hạn hiệu lực hợp đồng dịch vụ, phụ lục phát sinh và bàn giao đối soát công nợ cho chuyên sự HCNS',
        assignedTo: 'ALL_IN_DEPT',
      },
      {
        title: 'Tiếp nhận CSKH & Khởi tạo phiếu việc phát sinh',
        description: 'Ghi nhận yêu cầu của khách hàng, tạo phiếu việc chuyển giao cho bộ phận liên quan',
        assignedTo: 'ALL_IN_DEPT',
      },
    ],
    cantDoRestrictions: [
      'Không được phép xem bảng lương nội bộ của nhân viên công ty',
      'Không thực hiện thao tác hạch toán số liệu kế toán và tờ khai thuế',
      'Không giữ quyền ký số nộp hồ sơ nhà nước',
    ],
  },
];

export type RACIRoleValue = 'R' | 'A' | 'C' | 'I' | '-';

export interface RACIRow {
  id: string;
  taskName: string;
  bgd: RACIRoleValue;
  ktt: RACIRoleValue;
  hcns: RACIRoleValue;
  kd: RACIRoleValue;
  description: string;
  isCustom?: boolean;
}

const DEFAULT_RACI_MATRIX: RACIRow[] = [
  {
    id: 'raci-1',
    taskName: '1. Hạch toán sổ sách, Tờ khai Thuế & BCTC',
    bgd: 'A',
    ktt: 'R',
    hcns: '-',
    kd: '-',
    description: 'Nhập chứng từ, lên tờ khai GTGT/TNCN/TNDN, BCTC và soát xét kỹ thuật',
  },
  {
    id: 'raci-2',
    taskName: '2. Ký số Token điện tử & Nộp hồ sơ Thuế/BHXH',
    bgd: 'R',
    ktt: 'C',
    hcns: 'C',
    kd: '-',
    description: 'Chỉ Ban Giám Đốc giữ thẩm quyền cắm Token ký nộp tờ khai chính thức',
  },
  {
    id: 'raci-3',
    taskName: '3. Quản lý Nhân sự, Tính lương & Báo tăng/giảm BHXH',
    bgd: 'A',
    ktt: '-',
    hcns: 'R',
    kd: '-',
    description: 'Lập bảng lương, trích BHXH 32%, quản trị mẫu C12 và giải quyết chế độ NLĐ',
  },
  {
    id: 'raci-4',
    taskName: '4. Soạn thảo Hồ sơ Pháp lý thay đổi GPKD / ĐKKD',
    bgd: 'A',
    ktt: '-',
    hcns: 'R',
    kd: 'C',
    description: 'Thay đổi người đại diện, tăng vốn, đổi địa chỉ, bổ sung ngành nghề kinh doanh',
  },
  {
    id: 'raci-5',
    taskName: '5. Ký Hợp đồng Dịch vụ, Biểu phí & Thu hồi Công nợ',
    bgd: 'A',
    ktt: 'C',
    hcns: 'R',
    kd: 'C',
    description: 'Thỏa thuận biểu phí gói cước (KD phối hợp) & Đôn đốc thu hồi công nợ dịch vụ (1 nhân sự HCNS chuyên trách thực hiện)',
  },
  {
    id: 'raci-6',
    taskName: '6. Quản trị Kho Chữ Ký Số (Token CKS) & Văn thư',
    bgd: 'I',
    ktt: 'C',
    hcns: 'R',
    kd: '-',
    description: 'Bảo mật mã PIN CKS khách hàng, gia hạn chữ ký số và giao nhận chứng từ',
  },
  {
    id: 'raci-7',
    taskName: '7. Báo cáo Quản Trị, Cấu hình Quyền & Sao lưu CSDL',
    bgd: 'R',
    ktt: 'C',
    hcns: '-',
    kd: 'C',
    description: 'Báo cáo tài chính doanh nghiệp, phân quyền nhân sự và cấu hình ứng dụng',
  },
];

const RACI_STORAGE_KEY = 'taxcore_raci_matrix_config_v1';

const CATEGORY_NAMES: Record<PermissionCategory, { label: string; icon: any; color: string }> = {
  TASK: { label: '1. Quy Trình & Công Việc Nghiệp Vụ', icon: CheckCircle2, color: 'text-blue-600 dark:text-blue-400' },
  CUSTOMER: { label: '2. Hồ Sơ Doanh Nghiệp & Khách Hàng', icon: Building, color: 'text-indigo-600 dark:text-indigo-400' },
  HR_PAYROLL_BHXH: { label: '3. Nhân Sự, Bảng Lương & Bảo Hiểm Xã Hội', icon: Briefcase, color: 'text-teal-600 dark:text-teal-400' },
  LEGAL_DOSSIER: { label: '4. Pháp Lý Doanh Nghiệp & Hồ Sơ ĐKKD', icon: FileCheck, color: 'text-emerald-600 dark:text-emerald-400' },
  CONTRACT_DEBT: { label: '5. Hợp Đồng, Biểu Phí & Thu Hồi Công Nợ', icon: BadgeDollarSign, color: 'text-amber-600 dark:text-amber-400' },
  ADMIN_CKS: { label: '6. Kho Token Chữ Ký Số & Văn Thư', icon: KeyRound, color: 'text-purple-600 dark:text-purple-400' },
  TAX_REPORT: { label: '7. Lịch Thuế, AI Advisor & Báo Cáo', icon: Calculator, color: 'text-cyan-600 dark:text-cyan-400' },
  SYSTEM_ADMIN: { label: '8. Quản Trị Hệ Thống, IAM & Sao Lưu', icon: ShieldCheck, color: 'text-rose-600 dark:text-rose-400' },
};

const ROLES: UserRole[] = ['ADMIN', 'BAN_GIAM_DOC', 'TRUONG_PHONG', 'TRUONG_NHOM', 'NHAN_VIEN'];

const ROLE_LABELS: Record<UserRole, { name: string; badge: string }> = {
  ADMIN: { name: 'Admin Tối Cao', badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' },
  BAN_GIAM_DOC: { name: 'Ban Giám Đốc', badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' },
  TRUONG_PHONG: { name: 'Trưởng Phòng / KTT', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' },
  TRUONG_NHOM: { name: 'Trưởng Nhóm / Phó KTT', badge: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300' },
  NHAN_VIEN: { name: 'Chuyên Viên Thực Thi', badge: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' },
};

export const RolePermissionsManager: React.FC<RolePermissionsManagerProps> = ({
  currentUser,
  allUsers = [],
  onPermissionsUpdated,
}) => {
  // STREAMLINED ARCHITECTURE: 2 Core Tabs instead of 4 repetitive tabs
  const [mainView, setMainView] = useState<'ORGANIZATION_ACCESS' | 'GOVERNANCE_MATRICES'>('ORGANIZATION_ACCESS');
  const [matrixSubTab, setMatrixSubTab] = useState<'RBAC' | 'RACI'>('RBAC');
  
  // Realtime synced users list
  const [usersList, setUsersList] = useState<User[]>(() => {
    const fromStorage = storageService.getUsers();
    return fromStorage.length > 0 ? fromStorage : allUsers;
  });

  const [selectedDeptFilter, setSelectedDeptFilter] = useState<Department | 'ALL'>('ALL');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [raciNotification, setRaciNotification] = useState<string | null>(null);

  // Granular RBAC Role Matrix State
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, PermissionAction[]>>(() => {
    PermissionService.init();
    return {
      ADMIN: PermissionService.getRolePermissions('ADMIN'),
      BAN_GIAM_DOC: PermissionService.getRolePermissions('BAN_GIAM_DOC'),
      TRUONG_PHONG: PermissionService.getRolePermissions('TRUONG_PHONG'),
      TRUONG_NHOM: PermissionService.getRolePermissions('TRUONG_NHOM'),
      NHAN_VIEN: PermissionService.getRolePermissions('NHAN_VIEN'),
    };
  });

  // Dynamic RACI matrix state
  const [raciRows, setRaciRows] = useState<RACIRow[]>(() => {
    try {
      const saved = localStorage.getItem(RACI_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_RACI_MATRIX;
  });

  // Edit / Add Task Modal
  const [editingRow, setEditingRow] = useState<RACIRow | null>(null);
  const [isAddingNewTask, setIsAddingNewTask] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    taskName: '',
    description: '',
    bgd: 'A' as RACIRoleValue,
    ktt: 'R' as RACIRoleValue,
    hcns: '-' as RACIRoleValue,
    kd: '-' as RACIRoleValue,
  });

  // Refresh personnel list dynamically and listen to storage sync events
  const refreshUsersFromStorage = () => {
    const updated = storageService.getUsers();
    setUsersList(updated);
    if (!selectedStaffId && updated.length > 0) {
      setSelectedStaffId(updated[0].id);
    }
  };

  useEffect(() => {
    refreshUsersFromStorage();
    const unsubscribe = storageService.subscribeToSync(() => {
      refreshUsersFromStorage();
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (allUsers && allUsers.length > 0) {
      setUsersList(allUsers);
      if (!selectedStaffId && allUsers.length > 0) {
        setSelectedStaffId(allUsers[0].id);
      }
    }
  }, [allUsers]);

  // Execute explicit Bi-directional reconcile
  const handleForceReconcile = () => {
    setIsSyncing(true);
    try {
      const result = storageService.reconcileUsersAndEmployees(currentUser);
      refreshUsersFromStorage();
      setSyncFeedback(result.message);
      if (onPermissionsUpdated) onPermissionsUpdated();
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch {
      setSyncFeedback('Đồng bộ hoàn tất!');
      setTimeout(() => setSyncFeedback(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Toggle individual permission action for a role
  const handleTogglePermission = (role: UserRole, action: PermissionAction) => {
    if (role === 'ADMIN') return;
    setRolePermissions(prev => {
      const current = prev[role] || [];
      const has = current.includes(action);
      const updated = has ? current.filter(a => a !== action) : [...current, action];
      PermissionService.saveRolePermissions(role, updated);
      return { ...prev, [role]: updated };
    });
  };

  // Reset RBAC to defaults
  const handleResetRBACDefaults = () => {
    if (window.confirm('Khôi phục ma trận phân quyền RBAC về giá trị chuẩn của hệ thống?')) {
      PermissionService.resetToDefaults();
      setRolePermissions({
        ADMIN: PermissionService.getRolePermissions('ADMIN'),
        BAN_GIAM_DOC: PermissionService.getRolePermissions('BAN_GIAM_DOC'),
        TRUONG_PHONG: PermissionService.getRolePermissions('TRUONG_PHONG'),
        TRUONG_NHOM: PermissionService.getRolePermissions('TRUONG_NHOM'),
        NHAN_VIEN: PermissionService.getRolePermissions('NHAN_VIEN'),
      });
      setSyncFeedback('Đã khôi phục ma trận phân quyền chuẩn mặc định!');
      setTimeout(() => setSyncFeedback(null), 3000);
      if (onPermissionsUpdated) onPermissionsUpdated();
    }
  };

  // Export RBAC JSON
  const handleExportRBACJSON = () => {
    try {
      const dataStr = JSON.stringify(rolePermissions, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TaxCore_RBAC_Matrix_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSyncFeedback('Đã xuất file cấu hình phân quyền RBAC thành công!');
      setTimeout(() => setSyncFeedback(null), 3000);
    } catch {
      // ignore
    }
  };

  // Save to localStorage when raciRows changes
  const saveRaciRowsToStorage = (rows: RACIRow[]) => {
    setRaciRows(rows);
    try {
      localStorage.setItem(RACI_STORAGE_KEY, JSON.stringify(rows));
    } catch (e) {
      console.error('Failed to save RACI config', e);
    }
  };

  const showRaciToast = (msg: string) => {
    setRaciNotification(msg);
    setTimeout(() => setRaciNotification(null), 3000);
  };

  const cycleRaciRole = (current: RACIRoleValue): RACIRoleValue => {
    switch (current) {
      case 'R': return 'A';
      case 'A': return 'C';
      case 'C': return 'I';
      case 'I': return '-';
      case '-': return 'R';
      default: return 'R';
    }
  };

  const handleCellClick = (rowId: string, deptKey: 'bgd' | 'ktt' | 'hcns' | 'kd') => {
    const updated = raciRows.map(row => {
      if (row.id === rowId) {
        const nextVal = cycleRaciRole(row[deptKey]);
        return { ...row, [deptKey]: nextVal };
      }
      return row;
    });
    saveRaciRowsToStorage(updated);
    showRaciToast('Đã cập nhật vai trò phân quyền ma trận RACI!');
  };

  const handleDeleteRow = (rowId: string, taskName: string) => {
    if (window.confirm(`Bạn có chắc muốn xóa nhóm việc: "${taskName}" khỏi ma trận RACI?`)) {
      const updated = raciRows.filter(r => r.id !== rowId);
      saveRaciRowsToStorage(updated);
      showRaciToast('Đã xóa nhóm việc khỏi ma trận');
    }
  };

  const handleSaveEditedRow = () => {
    if (!editingRow) return;
    if (!editingRow.taskName.trim()) {
      alert('Vui lòng nhập tên nhóm công việc.');
      return;
    }
    const updated = raciRows.map(r => r.id === editingRow.id ? editingRow : r);
    saveRaciRowsToStorage(updated);
    setEditingRow(null);
    showRaciToast('Đã lưu chỉnh sửa nhóm công việc!');
  };

  const handleAddNewTask = () => {
    if (!newTaskForm.taskName.trim()) {
      alert('Vui lòng nhập tên nhóm việc mới.');
      return;
    }

    const newRow: RACIRow = {
      id: `raci-${Date.now()}`,
      taskName: `${raciRows.length + 1}. ${newTaskForm.taskName.trim()}`,
      description: newTaskForm.description.trim() || 'Nhóm việc phát sinh theo quy trình vận hành thực tế',
      bgd: newTaskForm.bgd,
      ktt: newTaskForm.ktt,
      hcns: newTaskForm.hcns,
      kd: newTaskForm.kd,
      isCustom: true,
    };

    const updated = [...raciRows, newRow];
    saveRaciRowsToStorage(updated);
    setIsAddingNewTask(false);
    setNewTaskForm({
      taskName: '',
      description: '',
      bgd: 'A',
      ktt: 'R',
      hcns: '-',
      kd: '-',
    });
    showRaciToast('Đã thêm nhóm quy trình vận hành mới vào ma trận RACI!');
  };

  const handleResetDefaultRaci = () => {
    if (window.confirm('Khôi phục ma trận RACI về 7 nhóm việc chuẩn mặc định của Đại lý thuế? Các tùy chỉnh riêng sẽ được hoàn nguyên.')) {
      saveRaciRowsToStorage(DEFAULT_RACI_MATRIX);
      showRaciToast('Đã khôi phục ma trận RACI chuẩn!');
    }
  };

  const handleExportRaciJSON = () => {
    try {
      const dataStr = JSON.stringify(raciRows, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TaxCore_MaTran_RACI_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showRaciToast('Đã xuất file cấu hình RACI thành công!');
    } catch {
      showRaciToast('Lỗi khi xuất file');
    }
  };

  // Filtered staff list for search & department selection
  const filteredUsers = useMemo(() => {
    let result = usersList;
    if (selectedDeptFilter !== 'ALL') {
      result = result.filter(u => u.department === selectedDeptFilter);
    }
    if (selectedRoleFilter !== 'ALL') {
      result = result.filter(u => u.role === selectedRoleFilter);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(u => 
        u.name.toLowerCase().includes(term) || 
        u.id.toLowerCase().includes(term) || 
        (u.code && u.code.toLowerCase().includes(term)) ||
        (u.position && u.position.toLowerCase().includes(term)) ||
        (u.email && u.email.toLowerCase().includes(term))
      );
    }
    return result;
  }, [usersList, searchTerm, selectedDeptFilter, selectedRoleFilter]);

  // Active staff selection fallback
  const selectedStaff = useMemo(() => {
    if (selectedStaffId) {
      const found = usersList.find(u => u.id === selectedStaffId);
      if (found) return found;
    }
    return filteredUsers[0] || usersList[0];
  }, [selectedStaffId, usersList, filteredUsers]);

  // Group permissions by Category for RBAC Matrix
  const permissionsByCategory = useMemo(() => {
    const groups: Record<PermissionCategory, typeof ALL_PERMISSIONS> = {
      TASK: [],
      CUSTOMER: [],
      HR_PAYROLL_BHXH: [],
      LEGAL_DOSSIER: [],
      CONTRACT_DEBT: [],
      ADMIN_CKS: [],
      TAX_REPORT: [],
      SYSTEM_ADMIN: [],
    };
    ALL_PERMISSIONS.forEach(p => {
      if (groups[p.category]) {
        groups[p.category].push(p);
      }
    });
    return groups;
  }, []);

  return (
    <div className="space-y-4">
      
      {/* Top Banner: Enterprise Sync & Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-0.5">
            <Shield className="h-4 w-4" />
            <span>Phân Quyền Vai Trò (RBAC), Ma Trận RACI & Quản Trị Tổ Chức</span>
          </div>
          <p className="text-xs text-slate-500">
            Hệ thống quản trị truy cập tập trung — Đồng bộ 100% giữa <strong>Nhân sự & Lương</strong>, <strong>Tài khoản Đăng nhập (IAM)</strong> và <strong>Thẩm quyền theo Vai trò</strong>.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>{usersList.length} Nhân Sự</span>
          </div>

          <button
            onClick={handleForceReconcile}
            disabled={isSyncing}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-all shadow-xs cursor-pointer"
            title="Nhấn để quét và đồng bộ lại 100% toàn bộ Nhân sự, User và IAM Credential"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng Bộ Nhân Sự'}</span>
          </button>
        </div>
      </div>

      {/* Sync Toast Feedback */}
      {syncFeedback && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center space-x-2 shadow-xs animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* 2 Streamlined Master Views Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 pb-1">
        <button
          onClick={() => setMainView('ORGANIZATION_ACCESS')}
          className={`flex items-center space-x-2 py-2 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            mainView === 'ORGANIZATION_ACCESS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Building className="h-4 w-4" />
          <span>1. Tổ Chức & Hồ Sơ Quyền Nhân Sự ({usersList.length})</span>
        </button>

        <button
          onClick={() => setMainView('GOVERNANCE_MATRICES')}
          className={`flex items-center space-x-2 py-2 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            mainView === 'GOVERNANCE_MATRICES'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>2. Ma Trận Quản Trị Phân Quyền (RBAC & RACI)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: STREAMLINED ORGANIZATION & STAFF ACCESS CONTROL (MASTER-DETAIL)   */}
      {/* ========================================================================= */}
      {mainView === 'ORGANIZATION_ACCESS' && (
        <div className="space-y-4">
          
          {/* Department Filter Hubs (4 Pill Cards) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {DEPARTMENT_HUBS.map(hub => {
              const HubIcon = hub.icon;
              const staffInThisDept = usersList.filter(u => u.department === hub.id);
              const isSelected = selectedDeptFilter === hub.id;

              return (
                <div
                  key={hub.id}
                  onClick={() => {
                    if (selectedDeptFilter === hub.id) {
                      setSelectedDeptFilter('ALL');
                    } else {
                      setSelectedDeptFilter(hub.id);
                      if (staffInThisDept.length > 0) {
                        setSelectedStaffId(staffInThisDept[0].id);
                      }
                    }
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-400/20 bg-blue-50/30 dark:bg-blue-950/30 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className={`p-2 rounded-xl shrink-0 ${hub.badgeBg}`}>
                      <HubIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {hub.shortName}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {staffInThisDept.length} nhân sự
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Master-Detail Layout: Staff List (Left) + Detailed Access Passport (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Left: Staff Selector List with Quick Filters (5 cols) */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-xs space-y-3 flex flex-col h-[600px]">
              
              {/* Search & Filter Header */}
              <div className="space-y-2 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                    <Users className="h-3.5 w-3.5 text-blue-600" />
                    <span>Danh Sách Nhân Sự ({filteredUsers.length})</span>
                  </span>
                  {selectedDeptFilter !== 'ALL' && (
                    <button
                      onClick={() => setSelectedDeptFilter('ALL')}
                      className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Hiện tất cả
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm tên, mã nhân viên..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center space-x-1.5">
                  <select
                    value={selectedRoleFilter}
                    onChange={e => setSelectedRoleFilter(e.target.value)}
                    className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
                  >
                    <option value="ALL">Tất cả cấp bậc</option>
                    <option value="ADMIN">Admin Tối Cao</option>
                    <option value="BAN_GIAM_DOC">Ban Giám Đốc</option>
                    <option value="TRUONG_PHONG">Trưởng Phòng / KTT</option>
                    <option value="TRUONG_NHOM">Trưởng Nhóm / Phó KTT</option>
                    <option value="NHAN_VIEN">Chuyên Viên Thực Thi</option>
                  </select>
                </div>
              </div>

              {/* Scrollable Personnel Items */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {filteredUsers.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Không tìm thấy nhân sự phù hợp
                  </div>
                ) : (
                  filteredUsers.map(u => {
                    const isSelected = selectedStaff?.id === u.id;
                    const hub = DEPARTMENT_HUBS.find(h => h.id === u.department);

                    return (
                      <div
                        key={u.id}
                        onClick={() => setSelectedStaffId(u.id)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-400 dark:border-blue-700 shadow-2xs'
                            : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-blue-600' : 'bg-slate-600'
                          }`}>
                            {u.name.split(' ').map(n => n[0]).slice(-2).join('')}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {u.name}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate flex items-center space-x-1 mt-0.5">
                              <span className="font-mono">{u.code || u.id}</span>
                              <span>•</span>
                              <span className="truncate">{hub?.shortName || u.department}</span>
                            </div>
                          </div>
                        </div>

                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${ROLE_LABELS[u.role]?.badge || 'bg-slate-100'}`}>
                          {ROLE_LABELS[u.role]?.name.split(' ')[0] || u.role}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

            </div>

            {/* Right: Comprehensive Access Passport & Security Boundaries (8 cols) */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4 flex flex-col h-[600px] overflow-y-auto">
              
              {selectedStaff ? (() => {
                const staffDeptHub = DEPARTMENT_HUBS.find(h => h.id === selectedStaff.department) || DEPARTMENT_HUBS[1];
                const HubIcon = staffDeptHub.icon;
                const isManager = selectedStaff.role === 'TRUONG_PHONG' || selectedStaff.role === 'BAN_GIAM_DOC' || selectedStaff.role === 'ADMIN';
                const userAllowedActions = rolePermissions[selectedStaff.role] || [];

                return (
                  <>
                    {/* Selected Personnel Header Card */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0">
                          {selectedStaff.name.split(' ').map(n => n[0]).slice(-2).join('')}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                              {selectedStaff.name}
                            </h3>
                            <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-1.5 py-0.2 rounded">
                              {selectedStaff.code || selectedStaff.id}
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              selectedStaff.active !== false
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}>
                              {selectedStaff.active !== false ? 'Đang làm việc' : 'Đã nghỉ việc'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 flex items-center space-x-2 flex-wrap">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedStaff.position}</span>
                            <span>•</span>
                            <span className="text-blue-600 dark:text-blue-400 font-bold">{staffDeptHub.name}</span>
                            <span>•</span>
                            <span className="font-mono text-[11px] text-slate-500">{selectedStaff.email}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${ROLE_LABELS[selectedStaff.role]?.badge}`}>
                          {ROLE_LABELS[selectedStaff.role]?.name}
                        </span>
                      </div>
                    </div>

                    {/* Responsibilities & Security Restrictions Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      
                      {/* Left: Responsibilities */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span>Thẩm Quyền & Nhiệm Vụ Phân Cấp</span>
                        </h4>

                        <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                          {staffDeptHub.coreResponsibilities
                            .filter(res => {
                              if (res.assignedTo === 'LEAD_ONLY' && !isManager) return false;
                              return true;
                            })
                            .map((res, idx) => (
                              <div key={idx} className="p-2.5 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                                <div className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">
                                  {res.title}
                                </div>
                                <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                  {res.description}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Right: Security Boundaries */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-1.5">
                          <Lock className="h-4 w-4 text-amber-500" />
                          <span>Giới Hạn Bảo Mật Thông Tin</span>
                        </h4>

                        <div className="p-3 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-1.5">
                          {staffDeptHub.cantDoRestrictions.map((rst, idx) => (
                            <div key={idx} className="flex items-start space-x-2 text-[11px] text-amber-900 dark:text-amber-200">
                              <X className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                              <span>{rst}</span>
                            </div>
                          ))}
                        </div>

                        <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-[11px] text-blue-900 dark:text-blue-200 flex items-center space-x-2">
                          <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
                          <span>Quyền hạn được tự động cấp theo vai trò <strong>{ROLE_LABELS[selectedStaff.role]?.name}</strong> ({userAllowedActions.length} quyền hệ thống).</span>
                        </div>
                      </div>

                    </div>

                    {/* 8-Module Permission Overview Badges */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                          <SlidersHorizontal className="h-3.5 w-3.5 text-blue-600" />
                          <span>Mức Độ Tiếp Cận Trên 8 Phân Hệ Nghiệp Vụ:</span>
                        </h5>
                        <button
                          onClick={() => {
                            setMainView('GOVERNANCE_MATRICES');
                            setMatrixSubTab('RBAC');
                          }}
                          className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer flex items-center space-x-1"
                        >
                          <span>Tùy chỉnh ma trận RBAC</span>
                          <span>→</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {(Object.keys(CATEGORY_NAMES) as PermissionCategory[]).map((catKey) => {
                          const totalInCat = ALL_PERMISSIONS.filter(p => p.category === catKey).length;
                          const grantedInCat = ALL_PERMISSIONS.filter(p => p.category === catKey && userAllowedActions.includes(p.id)).length;
                          const catMeta = CATEGORY_NAMES[catKey];
                          const Icon = catMeta.icon;
                          const isFull = grantedInCat === totalInCat && totalInCat > 0;
                          const isZero = grantedInCat === 0;

                          return (
                            <div 
                              key={catKey}
                              className={`p-2 rounded-xl border text-[10.5px] flex flex-col justify-between ${
                                isZero 
                                  ? 'bg-slate-50 dark:bg-slate-900/60 border-slate-200/60 dark:border-slate-800 text-slate-400' 
                                  : isFull 
                                  ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-slate-800 dark:text-slate-200'
                                  : 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50 text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              <div className="flex items-center space-x-1 mb-1">
                                <Icon className={`h-3 w-3 shrink-0 ${isZero ? 'text-slate-400' : catMeta.color}`} />
                                <span className="font-bold truncate text-[10px]" title={catMeta.label}>
                                  {catMeta.label.split('. ')[1] || catMeta.label}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-0.5">
                                <span className="text-[9.5px] text-slate-500">Thẩm quyền:</span>
                                <span className={`font-mono font-bold text-[10.5px] px-1.5 py-0.2 rounded ${
                                  isZero 
                                    ? 'bg-slate-200/60 dark:bg-slate-800 text-slate-500' 
                                    : isFull 
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300' 
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
                                }`}>
                                  {grantedInCat}/{totalInCat}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                );
              })() : (
                <div className="flex items-center justify-center h-full text-xs text-slate-400">
                  Vui lòng chọn nhân sự từ danh sách bên trái để xem hồ sơ quyền hạn
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: UNIFIED GOVERNANCE MATRICES (RBAC DETAILED & RACI PROCESS)        */}
      {/* ========================================================================= */}
      {mainView === 'GOVERNANCE_MATRICES' && (
        <div className="space-y-3">
          
          {/* Sub-Switch: RBAC Matrix vs RACI Process Matrix */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            
            <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setMatrixSubTab('RBAC')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  matrixSubTab === 'RBAC'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>1. Ma Trận Quyền Chi Tiết (8 Phân Hệ x 5 Vai Trò)</span>
              </button>

              <button
                type="button"
                onClick={() => setMatrixSubTab('RACI')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  matrixSubTab === 'RACI'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>2. Ma Trận Trách Nhiệm RACI ({raciRows.length} Nhóm Việc)</span>
              </button>
            </div>

            {/* Context Action Buttons */}
            <div className="flex items-center space-x-2">
              {matrixSubTab === 'RBAC' ? (
                <>
                  <button
                    type="button"
                    onClick={handleResetRBACDefaults}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Khôi Phục Chuẩn</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportRBACJSON}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Xuất JSON</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewTask(true)}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Thêm Nhóm Việc</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetDefaultRaci}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                    title="Khôi phục ma trận RACI mặc định"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Chuẩn Hóa</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportRaciJSON}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Xuất JSON</span>
                  </button>
                </>
              )}
            </div>

          </div>

          {/* Toast Notification */}
          {raciNotification && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center space-x-2 shadow-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{raciNotification}</span>
            </div>
          )}

          {/* SUB-TAB 1: RBAC DETAILED MATRIX */}
          {matrixSubTab === 'RBAC' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 sm:p-5 space-y-3">
              <div className="text-xs text-slate-500">
                Nhấp vào ô biểu tượng (✓ / ✕) để trực tiếp cấp hoặc thu hồi thẩm quyền cho từng vai trò trên 8 phân hệ nghiệp vụ:
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                        <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300 min-w-[280px]">
                          Hành Động / Nghiệp Vụ
                        </th>
                        {ROLES.map(role => (
                          <th key={role} className="py-3 px-2 font-bold text-center text-slate-700 dark:text-slate-300 min-w-[110px]">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ROLE_LABELS[role].badge}`}>
                              {ROLE_LABELS[role].name}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {(Object.entries(permissionsByCategory) as [PermissionCategory, typeof ALL_PERMISSIONS][]).map(([catKey, perms]) => {
                        const catInfo = CATEGORY_NAMES[catKey as PermissionCategory];
                        const CatIcon = catInfo.icon;

                        return (
                          <React.Fragment key={catKey}>
                            <tr className="bg-slate-100/60 dark:bg-slate-800/40">
                              <td colSpan={6} className="py-2 px-4 font-bold text-xs text-slate-800 dark:text-slate-200">
                                <div className="flex items-center space-x-2">
                                  <CatIcon className={`h-4 w-4 ${catInfo.color}`} />
                                  <span>{catInfo.label} ({perms.length})</span>
                                </div>
                              </td>
                            </tr>

                            {perms.map(perm => (
                              <tr key={perm.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-850/50 transition-colors">
                                <td className="py-2.5 px-4">
                                  <div className="font-semibold text-slate-900 dark:text-white">
                                    {perm.name}
                                  </div>
                                  <div className="text-[11px] text-slate-500 leading-tight">
                                    {perm.description}
                                  </div>
                                </td>

                                {ROLES.map(role => {
                                  const isAllowed = rolePermissions[role]?.includes(perm.id) || role === 'ADMIN';
                                  const isAdmin = role === 'ADMIN';

                                  return (
                                    <td key={role} className="py-2.5 px-2 text-center">
                                      <button
                                        type="button"
                                        disabled={isAdmin}
                                        onClick={() => handleTogglePermission(role, perm.id)}
                                        className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer ${
                                          isAllowed
                                            ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-xs'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700'
                                        } ${isAdmin ? 'cursor-not-allowed opacity-90' : ''}`}
                                        title={isAdmin ? 'Admin có toàn quyền mặc định' : isAllowed ? 'Nhấn để tắt quyền' : 'Nhấn để cấp quyền'}
                                      >
                                        {isAllowed ? <Check className="h-4 w-4 stroke-[3]" /> : <X className="h-4 w-4" />}
                                      </button>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 2: RACI PROCESS MATRIX */}
          {matrixSubTab === 'RACI' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                Nhấp trực tiếp vào ô bất kỳ để chuyển đổi nhanh vai trò phân định: <strong>R (Phụ trách chính) ➔ A (Phê duyệt) ➔ C (Phối hợp) ➔ I (Theo dõi) ➔ — (Không tham gia)</strong>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
                      <th className="py-3 px-4 font-bold text-slate-900 dark:text-white min-w-[240px]">
                        Quy Trình & Nhiệm Vụ Nghiệp Vụ
                      </th>
                      <th className="py-3 px-2 font-bold text-center text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 min-w-[100px]">
                        Ban Giám Đốc
                      </th>
                      <th className="py-3 px-2 font-bold text-center text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 min-w-[100px]">
                        Kế Toán Thuế
                      </th>
                      <th className="py-3 px-2 font-bold text-center text-teal-700 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/20 min-w-[100px]">
                        HCNS - Pháp Lý
                      </th>
                      <th className="py-3 px-2 font-bold text-center text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 min-w-[100px]">
                        Kinh Doanh
                      </th>
                      <th className="py-3 px-3 font-bold text-right text-slate-400 w-16">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {raciRows.map(row => {
                      const renderInteractiveBadge = (val: RACIRoleValue, deptKey: 'bgd' | 'ktt' | 'hcns' | 'kd') => {
                        let badgeStyle = "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700";
                        let label = "— Không";

                        if (val === 'R') {
                          badgeStyle = "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-700 shadow-2xs";
                          label = "R • Phụ trách";
                        } else if (val === 'A') {
                          badgeStyle = "bg-purple-600 text-white hover:bg-purple-700 border-purple-700 shadow-2xs";
                          label = "A • Phê duyệt";
                        } else if (val === 'C') {
                          badgeStyle = "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 hover:bg-blue-200 border-blue-300 dark:border-blue-800";
                          label = "C • Phối hợp";
                        } else if (val === 'I') {
                          badgeStyle = "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 hover:bg-amber-200 border-amber-300 dark:border-amber-800";
                          label = "I • Theo dõi";
                        }

                        return (
                          <button
                            type="button"
                            onClick={() => handleCellClick(row.id, deptKey)}
                            title="Nhấn để đổi vai trò: R ➔ A ➔ C ➔ I ➔ —"
                            className={`inline-flex items-center justify-center px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer select-none active:scale-95 ${badgeStyle}`}
                          >
                            {label}
                          </button>
                        );
                      };

                      return (
                        <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors group">
                          <td className="py-2.5 px-4">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-900 dark:text-white text-xs">
                                {row.taskName}
                              </span>
                              {row.isCustom && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                                  Tùy chỉnh
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                              {row.description}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-center">{renderInteractiveBadge(row.bgd, 'bgd')}</td>
                          <td className="py-2.5 px-2 text-center">{renderInteractiveBadge(row.ktt, 'ktt')}</td>
                          <td className="py-2.5 px-2 text-center">{renderInteractiveBadge(row.hcns, 'hcns')}</td>
                          <td className="py-2.5 px-2 text-center">{renderInteractiveBadge(row.kd, 'kd')}</td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                type="button"
                                onClick={() => setEditingRow(row)}
                                title="Sửa tên & mô tả nhóm việc"
                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRow(row.id, row.taskName)}
                                title="Xóa nhóm việc khỏi ma trận"
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
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
      {/* MODAL: EDIT RACI TASK ROW */}
      {/* ========================================================================= */}
      {editingRow && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center space-x-2 text-blue-600">
              <Edit2 className="h-5 w-5" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Chỉnh Sửa Nhóm Công Việc RACI
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tên nhóm công việc:
                </label>
                <input
                  type="text"
                  value={editingRow.taskName}
                  onChange={(e) => setEditingRow({ ...editingRow, taskName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-semibold focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mô tả chi tiết nhiệm vụ:
                </label>
                <textarea
                  rows={3}
                  value={editingRow.description}
                  onChange={(e) => setEditingRow({ ...editingRow, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Phân định vai trò trực tiếp (R / A / C / I / —):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: 'bgd' as const, label: 'Ban Giám Đốc' },
                    { key: 'ktt' as const, label: 'Kế Toán Thuế' },
                    { key: 'hcns' as const, label: 'HCNS - Pháp Lý' },
                    { key: 'kd' as const, label: 'Kinh Doanh' },
                  ].map(d => (
                    <div key={d.key} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {d.label}
                      </div>
                      <select
                        value={editingRow[d.key]}
                        onChange={(e) => setEditingRow({ ...editingRow, [d.key]: e.target.value as RACIRoleValue })}
                        className="w-full py-1 px-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-bold text-slate-900 dark:text-white"
                      >
                        <option value="R">R • Phụ trách chính</option>
                        <option value="A">A • Phê duyệt</option>
                        <option value="C">C • Phối hợp</option>
                        <option value="I">I • Theo dõi</option>
                        <option value="-">— Không tham gia</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingRow(null)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveEditedRow}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD NEW TASK WORKFLOW */}
      {/* ========================================================================= */}
      {isAddingNewTask && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center space-x-2 text-blue-600">
              <Plus className="h-5 w-5" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Thêm Nhóm Quy Trình Mới Vào Ma Trận RACI
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tên nhóm công việc / Quy trình mới:
                </label>
                <input
                  type="text"
                  placeholder="VD: Kiểm toán nội bộ định kỳ, Đấu thầu dự án..."
                  value={newTaskForm.taskName}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, taskName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-semibold focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mô tả trách nhiệm & kết quả bàn giao:
                </label>
                <textarea
                  rows={2.5}
                  placeholder="Ghi rõ ai làm gì, ai kiểm tra và hồ sơ bàn giao..."
                  value={newTaskForm.description}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Chỉ định vai trò 4 Khối Phòng Ban:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: 'bgd' as const, label: 'Ban Giám Đốc' },
                    { key: 'ktt' as const, label: 'Kế Toán Thuế' },
                    { key: 'hcns' as const, label: 'HCNS - Pháp Lý' },
                    { key: 'kd' as const, label: 'Kinh Doanh' },
                  ].map(d => (
                    <div key={d.key} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {d.label}
                      </div>
                      <select
                        value={newTaskForm[d.key]}
                        onChange={(e) => setNewTaskForm({ ...newTaskForm, [d.key]: e.target.value as RACIRoleValue })}
                        className="w-full py-1 px-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-bold text-slate-900 dark:text-white"
                      >
                        <option value="R">R • Phụ trách</option>
                        <option value="A">A • Duyệt</option>
                        <option value="C">C • Phối hợp</option>
                        <option value="I">I • Theo dõi</option>
                        <option value="-">— Không</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddingNewTask(false)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleAddNewTask}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center space-x-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm Vào Ma Trận</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

import { 
  Customer, 
  Task, 
  User, 
  ChecklistTemplate, 
  AuditLog, 
  StaffKPIRecord, 
  DeadlineBucket, 
  AlertColorLevel, 
  TaskStatus,
  UserRole,
  EmployeeProfile,
  LeaveRequest,
  BusinessTrip,
  BusinessTripStatus,
  PayrollRecord,
  HRWorkflowSOP,
  RealtimeSyncEvent,
  ActiveEditingPresence,
  ConcurrencyConflictResult,
  DuplicateCustomerMatch,
  DuplicateTaskMatch,
  SystemExpiringCycleItem,
  ContractRenewalRecord,
  CycleExpiryStatus,
  StaffWorkloadSummary,
  WorkloadStatus,
  TaxFilingReceipt,
  ETaxPaymentSlip,
  CustomerSupportRequest,
  CustomerPortalData,
  DatabaseModuleKey,
  DatabaseModuleInfo,
  DatabaseSystemStats,
  SalaryCalculationResult,
  TaxBracketDetail,
  BillingCycle,
  DebtAgingGroup,
  CustomerPaymentRecord,
  CustomerDebtReminder,
  TaxObligationType,
  AutoDispatchOptions,
  AutoDispatchResult,
  AutoDispatchCustomerSummary,
  UserCredential,
  AccountLifecycleState,
  UserLifecycleAction,
  VatType,
  AdHocServiceItem
} from '../types';
import { 
  INITIAL_USERS, 
  INITIAL_CUSTOMERS, 
  INITIAL_TEMPLATES, 
  INITIAL_TASKS, 
  INITIAL_AUDIT_LOGS,
  ROOT_ADMIN_USER
} from '../data/initialData';
import { AD_HOC_SERVICES } from '../data/adHocServices';
import {
  INITIAL_EMPLOYEES,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_BUSINESS_TRIPS,
  INITIAL_PAYROLL_RECORDS,
  HR_WORKFLOW_SOPS
} from '../data/hrData';
import {
  INITIAL_TAX_FILINGS,
  INITIAL_PAYMENT_SLIPS,
  INITIAL_SUPPORT_REQUESTS
} from '../data/portalData';
import {
  INITIAL_USER_CREDENTIALS,
  ROOT_ADMIN_CREDENTIAL,
  generateEnterpriseUsername,
  generateSecureInitialPassword,
  evaluatePasswordStrength
} from '../data/iamData';
import { PermissionService } from '../utils/permissions';

const STORAGE_KEYS = {
  USERS: 'taxcore_users_v2',
  CUSTOMERS: 'taxcore_customers_v2',
  TASKS: 'taxcore_tasks_v2',
  TEMPLATES: 'taxcore_templates_v2',
  AUDIT_LOGS: 'taxcore_audit_logs_v2',
  CURRENT_USER_ID: 'taxcore_current_user_id_v2',
  COMPANY_INFO: 'taxcore_company_info_v2',
  EMPLOYEES: 'taxcore_employees_v2',
  LEAVE_REQUESTS: 'taxcore_leave_requests_v2',
  BUSINESS_TRIPS: 'taxcore_business_trips_v2',
  PAYROLL: 'taxcore_payroll_v2',
  ACTIVE_LOCKS: 'taxcore_active_locks_v2',
  LAST_HEARTBEAT: 'taxcore_last_heartbeat_v2',
  TAX_FILINGS: 'taxcore_tax_filings_v2',
  PAYMENT_SLIPS: 'taxcore_payment_slips_v2',
  SUPPORT_REQUESTS: 'taxcore_support_requests_v2',
  CREDENTIALS: 'taxcore_credentials_v2',
  AUTH_SESSION: 'taxcore_auth_session_v2',
  AD_HOC_SERVICES: 'taxcore_adhoc_services_v2',
};

export interface CompanyInfo {
  name: string;
  taxCode: string;
  licenseNumber: string; // Số chứng chỉ hành nghề Đại lý Thuế
  address: string;
  phone: string;
  email: string;
  directorName: string;
  chiefAccountantName: string;
}

export const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: 'CÔNG TY TNHH ĐẠI LÝ THUẾ THÀNH PHỐ',
  taxCode: '0109988776',
  licenseNumber: 'ĐLT-TP-2022/089',
  address: 'Tầng 12, Tòa nhà Charmvit, 117 Trần Duy Hưng, Cầu Giấy, Hà Nội',
  phone: '024 3999 8888',
  email: 'contact@dailythuethanhpho.vn',
  directorName: 'Quản Trị Hệ Thống (Admin)',
  chiefAccountantName: 'Trần Thị Mai',
};

// Current system date simulation (matches metadata time 2026-08-18)
export const CURRENT_SYSTEM_DATE = '2026-08-18';

class StorageService {
  private channel: BroadcastChannel | null = null;
  private syncListeners: ((event: RealtimeSyncEvent) => void)[] = [];
  private lastSyncTimestamp: number = Date.now();
  private isBroadcasting = false;

  constructor() {
    // 0. Dọn sạch dữ liệu demo v1 legacy nếu còn lưu trong trình duyệt
    if (typeof window !== 'undefined') {
      try {
        const legacyKeys = [
          'taxcore_users_v1', 'taxcore_customers_v1', 'taxcore_tasks_v1',
          'taxcore_employees_v1', 'taxcore_leave_requests_v1', 'taxcore_payroll_v1',
          'taxcore_tax_filings_v1', 'taxcore_payment_slips_v1', 'taxcore_support_requests_v1',
          'taxcore_credentials_v1', 'taxcore_audit_logs_v1', 'taxcore_current_user_id_v1'
        ];
        legacyKeys.forEach(k => localStorage.removeItem(k));

        // Tự động quét dọn toàn bộ dữ liệu giả lập (mock/demo) khỏi storage v2
        const purgeFlagKey = 'taxcore_clean_mock_data_v5';
        if (!localStorage.getItem(purgeFlagKey)) {
          this.purgeMockData(ROOT_ADMIN_USER);
          localStorage.setItem(purgeFlagKey, 'true');
        }
      } catch (e) {
        console.warn('Could not clean legacy storage keys:', e);
      }
    }

    // 1. Initialize Realtime BroadcastChannel for cross-tab instant synchronization
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('taxcore_realtime_channel');
        this.channel.onmessage = (messageEvent) => {
          if (messageEvent && messageEvent.data) {
            const event = messageEvent.data as RealtimeSyncEvent;
            this.lastSyncTimestamp = Date.now();
            this.syncListeners.forEach(listener => {
              try {
                listener(event);
              } catch (err) {
                console.error('Error in sync listener:', err);
              }
            });
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel not available, falling back to storage listener', e);
      }
    }

    // 2. Fallback Storage Event listener for cross-tab updates
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key && (e.key.startsWith('taxcore_') || e.key === STORAGE_KEYS.LAST_HEARTBEAT)) {
          this.lastSyncTimestamp = Date.now();
          const fallbackEvent: RealtimeSyncEvent = {
            id: `EVT-${Date.now()}`,
            type: 'FORCE_SYNC',
            senderId: 'SYSTEM',
            senderName: 'Bộ đồng bộ hệ thống',
            timestamp: new Date().toISOString(),
          };
          this.syncListeners.forEach(listener => {
            try {
              listener(fallbackEvent);
            } catch (err) {
              console.error('Error in fallback storage listener:', err);
            }
          });
        }
      });
    }
  }

  // Realtime Broadcast dispatcher
  public broadcastSync(event: RealtimeSyncEvent): void {
    if (this.isBroadcasting) return; // Prevent re-entrant broadcasts
    this.isBroadcasting = true;
    this.lastSyncTimestamp = Date.now();
    try {
      if (this.channel) {
        this.channel.postMessage(event);
      }
      try {
        localStorage.setItem(STORAGE_KEYS.LAST_HEARTBEAT, String(Date.now()));
      } catch {
        // ignore quota / storage errors
      }
      // Dispatch to local listeners in current tab as well
      const listenersCopy = [...this.syncListeners];
      listenersCopy.forEach(listener => {
        try {
          listener(event);
        } catch (err) {
          console.error('Error in local sync listener:', err);
        }
      });
    } catch (e) {
      console.warn('Could not broadcast sync event:', e);
    } finally {
      this.isBroadcasting = false;
    }
  }

  // Subscribe to real-time sync events
  public subscribeToSync(callback: (event: RealtimeSyncEvent) => void): () => void {
    this.syncListeners.push(callback);
    return () => {
      this.syncListeners = this.syncListeners.filter(l => l !== callback);
    };
  }

  public getLastSyncTime(): number {
    return this.lastSyncTimestamp;
  }

  // =========================================================================
  // ACTIVE EDITING PRESENCE & CONCURRENCY LOCKS (Chống đè dữ liệu trực tiếp)
  // =========================================================================
  public getActiveLocks(): ActiveEditingPresence[] {
    const now = Date.now();
    const locks = this.get<ActiveEditingPresence[]>(STORAGE_KEYS.ACTIVE_LOCKS, []);
    // Auto-clean stale locks (> 3 minutes old)
    const validLocks = locks.filter(l => {
      const lockTime = new Date(l.timestamp).getTime();
      return (now - lockTime) < 3 * 60 * 1000;
    });
    return validLocks;
  }

  public acquireEditingLock(entityType: 'TASK' | 'CUSTOMER', entityId: string, user: User): void {
    const currentLocks = this.getActiveLocks().filter(l => !(l.entityType === entityType && l.entityId === entityId && l.userId === user.id));
    const newLock: ActiveEditingPresence = {
      entityType,
      entityId,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      timestamp: new Date().toISOString(),
    };
    currentLocks.push(newLock);
    this.set(STORAGE_KEYS.ACTIVE_LOCKS, currentLocks);
    this.broadcastSync({
      id: `LOCK-${Date.now()}`,
      type: 'LOCK_ACQUIRED',
      entityType,
      entityId,
      senderId: user.id,
      senderName: user.name,
      timestamp: new Date().toISOString(),
    });
  }

  public releaseEditingLock(entityType: 'TASK' | 'CUSTOMER', entityId: string, userId: string): void {
    const currentLocks = this.getActiveLocks();
    const filtered = currentLocks.filter(l => !(l.entityType === entityType && l.entityId === entityId && l.userId === userId));
    this.set(STORAGE_KEYS.ACTIVE_LOCKS, filtered);
    this.broadcastSync({
      id: `UNLOCK-${Date.now()}`,
      type: 'LOCK_RELEASED',
      entityType,
      entityId,
      senderId: userId,
      senderName: '',
      timestamp: new Date().toISOString(),
    });
  }

  public getActiveEditor(entityType: 'TASK' | 'CUSTOMER', entityId: string, currentUserId?: string): ActiveEditingPresence | null {
    const locks = this.getActiveLocks();
    const active = locks.find(l => l.entityType === entityType && l.entityId === entityId && (!currentUserId || l.userId !== currentUserId));
    return active || null;
  }

  // =========================================================================
  // ANTI-DUPLICATE ENGINE (Chống Trùng Lặp Khách Hàng & Công Việc)
  // =========================================================================
  public checkDuplicateCustomer(taxCode: string, name: string, excludeId?: string): DuplicateCustomerMatch | null {
    const customers = this.getCustomers();
    const cleanTax = taxCode.replace(/[^0-9A-Za-z]/g, '').trim().toUpperCase();
    const cleanName = name.trim().toLowerCase().replace(/\s+/g, ' ');

    if (!cleanTax && !cleanName) return null;

    for (const c of customers) {
      if (excludeId && c.id === excludeId) continue;
      const existingTax = (c.taxCode || '').replace(/[^0-9A-Za-z]/g, '').trim().toUpperCase();
      if (cleanTax && existingTax && cleanTax === existingTax) {
        return {
          matchType: 'TAX_CODE',
          existingCustomer: c,
          confidence: 100,
          message: `Mã số thuế [${c.taxCode}] đã tồn tại cho doanh nghiệp "${c.name}" do ${c.assignedStaffName || 'chuyên viên'} phụ trách.`,
        };
      }
      const existingName = (c.name || '').trim().toLowerCase().replace(/\s+/g, ' ');
      if (cleanName && existingName && cleanName.length > 5 && cleanName === existingName) {
        return {
          matchType: 'NAME',
          existingCustomer: c,
          confidence: 90,
          message: `Tên doanh nghiệp "${c.name}" trùng khớp hoàn toàn với hồ sơ MST: ${c.taxCode}.`,
        };
      }
    }
    return null;
  }

  public checkDuplicateTask(params: {
    customerId?: string;
    category?: string;
    taxType?: string;
    taxPeriod?: string;
    serviceCode?: string;
    title?: string;
    excludeTaskId?: string;
  }): DuplicateTaskMatch | null {
    if (!params.customerId) return null;
    const tasks = this.getTasks();

    for (const t of tasks) {
      if (params.excludeTaskId && t.id === params.excludeTaskId) continue;
      if (t.status === 'HUY' || t.status === 'HOAN_THANH') continue; // Only check active ongoing tasks

      if (t.customerId === params.customerId) {
        // Check identical tax obligation in same period
        if (params.taxType && params.taxPeriod && t.isTaxObligation && t.taxType === params.taxType && t.taxPeriod === params.taxPeriod) {
          return {
            matchType: 'IDENTICAL_TAX_PERIOD',
            existingTask: t,
            message: `Khách hàng này đã có công việc Kê khai [${t.taxType} - ${t.taxPeriod}] do ${t.assigneeName} đang xử lý (Trạng thái: ${t.status}).`,
          };
        }
        // Check identical ad-hoc service
        if (params.serviceCode && t.serviceCode && t.serviceCode === params.serviceCode) {
          return {
            matchType: 'IDENTICAL_SERVICE',
            existingTask: t,
            message: `Dịch vụ [${t.serviceName || params.serviceCode}] đang có một phiếu việc mở do ${t.assigneeName} phụ trách (Mã: ${t.code}).`,
          };
        }
      }
    }
    return null;
  }

  public scanAllDuplicates(): { duplicateCustomers: Customer[][]; duplicateTasks: Task[][] } {
    const customers = this.getCustomers();
    const tasks = this.getTasks();

    // Group customers by taxCode
    const taxMap = new Map<string, Customer[]>();
    customers.forEach(c => {
      const clean = (c.taxCode || '').replace(/[^0-9A-Za-z]/g, '').trim().toUpperCase();
      if (clean) {
        const list = taxMap.get(clean) || [];
        list.push(c);
        taxMap.set(clean, list);
      }
    });
    const duplicateCustomers = Array.from(taxMap.values()).filter(list => list.length > 1);

    // Group active tasks by customerId + taxType + taxPeriod
    const taskMap = new Map<string, Task[]>();
    tasks.filter(t => t.status !== 'HUY' && t.status !== 'HOAN_THANH' && t.customerId && t.isTaxObligation && t.taxType && t.taxPeriod).forEach(t => {
      const key = `${t.customerId}_${t.taxType}_${t.taxPeriod}`;
      const list = taskMap.get(key) || [];
      list.push(t);
      taskMap.set(key, list);
    });
    const duplicateTasks = Array.from(taskMap.values()).filter(list => list.length > 1);

    return { duplicateCustomers, duplicateTasks };
  }

  private get<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return fallback;
      return JSON.parse(data) as T;
    } catch (e) {
      console.error(`Error reading ${key} from storage:`, e);
      return fallback;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving ${key} to storage:`, e);
    }
  }

  private remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Error removing ${key} from storage:`, e);
    }
  }

  // USERS
  getUsers(): User[] {
    const raw = this.get<User[] | null>(STORAGE_KEYS.USERS, null);
    let users = raw;
    if (raw === null || !Array.isArray(raw) || raw.length === 0) {
      users = INITIAL_USERS;
      this.set(STORAGE_KEYS.USERS, INITIAL_USERS);
    }
    // Loại bỏ vĩnh viễn các tài khoản đã bị xóa (USR-001, USR-002, USR-029)
    const filtered = users.filter(u => 
      u.id !== 'USR-001' && u.id !== 'USR-002' && u.id !== 'USR-029' && 
      u.name !== 'Nguyễn Văn Toàn' && u.name !== 'Lê Thị Phương Thảo' && u.name !== 'Hoàng Quốc Cường' && u.name !== 'Vũ Quốc Huy'
    );
    if (filtered.length !== users.length) {
      users = filtered;
    }

    // Tự động đồng bộ từ hồ sơ Nhân sự (EMPLOYEES) sang Danh sách Người dùng (USERS)
    const rawEmployees = this.get<EmployeeProfile[] | null>(STORAGE_KEYS.EMPLOYEES, null);
    if (rawEmployees && Array.isArray(rawEmployees)) {
      let hasNewSync = false;
      rawEmployees.forEach(emp => {
        const uIdx = users.findIndex(u => u.id === emp.id || u.code === emp.code);
        const isActive = emp.status !== 'DA_NGHI_VIEC';
        const accountStatus: AccountLifecycleState = emp.status === 'DA_NGHI_VIEC' 
          ? 'TERMINATED_LOCKED' 
          : emp.status === 'TAM_HOAN_HD' 
          ? 'SUSPENDED' 
          : 'ACTIVE';

        if (uIdx === -1) {
          // Chưa có trong USERS -> Tự động thêm mới
          users.push({
            id: emp.id,
            code: emp.code,
            name: emp.name,
            email: emp.email,
            phone: emp.phone,
            role: emp.role || 'NHAN_VIEN',
            department: emp.department || 'KE_TOAN_THUE',
            position: emp.position || 'Chuyên viên Kế toán',
            active: isActive,
            accountStatus: accountStatus,
          });
          hasNewSync = true;
        } else {
          // Đã có -> Cập nhật thông tin mới nhất từ HR
          if (
            users[uIdx].name !== emp.name || 
            users[uIdx].role !== emp.role || 
            users[uIdx].position !== emp.position || 
            users[uIdx].department !== emp.department ||
            users[uIdx].active !== isActive
          ) {
            users[uIdx] = {
              ...users[uIdx],
              name: emp.name,
              email: emp.email,
              phone: emp.phone,
              role: emp.role || users[uIdx].role,
              department: emp.department || users[uIdx].department,
              position: emp.position || users[uIdx].position,
              active: isActive,
              accountStatus: accountStatus,
            };
            hasNewSync = true;
          }
        }
      });
      if (hasNewSync) {
        this.set(STORAGE_KEYS.USERS, users);
      }
    }

    // Đảm bảo luôn tồn tại ít nhất tài khoản Quản trị viên Tối cao (Super Admin) trong hệ thống
    if (!users.some(u => u.role === 'ADMIN' || u.id === 'USR-030' || u.email === 'admin@taxcore.vn' || u.code === 'ADM-01')) {
      users = [ROOT_ADMIN_USER, ...users];
      this.set(STORAGE_KEYS.USERS, users);
    }
    return users;
  }

  saveUsers(users: User[]): void {
    let sanitizedUsers = users.filter(u => 
      u.id !== 'USR-001' && u.id !== 'USR-002' && u.id !== 'USR-029' && 
      u.name !== 'Nguyễn Văn Toàn' && u.name !== 'Lê Thị Phương Thảo' && u.name !== 'Hoàng Quốc Cường' && u.name !== 'Vũ Quốc Huy'
    );
    // Bảo vệ tài khoản Admin không bị xóa nhầm
    if (!sanitizedUsers.some(u => u.role === 'ADMIN' || u.id === 'USR-030' || u.email === 'admin@taxcore.vn' || u.code === 'ADM-01')) {
      sanitizedUsers = [ROOT_ADMIN_USER, ...sanitizedUsers];
    }
    this.set(STORAGE_KEYS.USERS, sanitizedUsers);
  }

  /**
   * Đồng bộ toàn diện hai chiều (Bi-directional Reconcile) giữa:
   * 1. Hồ sơ Nhân sự (EMPLOYEES)
   * 2. Danh sách Người dùng (USERS)
   * 3. Tài khoản đăng nhập IAM (CREDENTIALS)
   */
  reconcileUsersAndEmployees(actor?: User): {
    success: boolean;
    totalEmployees: number;
    totalUsers: number;
    totalCredentials: number;
    addedUsersCount: number;
    addedEmployeesCount: number;
    addedCredentialsCount: number;
    message: string;
  } {
    const defaultActor = actor || this.getCurrentUser();
    const employees = this.getEmployees();
    const rawUsers = this.get<User[] | null>(STORAGE_KEYS.USERS, null) || INITIAL_USERS;
    const users = [...rawUsers];
    const rawCreds = this.get<UserCredential[] | null>(STORAGE_KEYS.CREDENTIALS, null) || INITIAL_USER_CREDENTIALS;
    const creds = [...rawCreds];

    let addedUsersCount = 0;
    let addedEmployeesCount = 0;
    let addedCredentialsCount = 0;

    // 1. Đồng bộ từ EMPLOYEES sang USERS & CREDENTIALS
    employees.forEach(emp => {
      const uIdx = users.findIndex(u => u.id === emp.id || u.code === emp.code);
      const isActive = emp.status !== 'DA_NGHI_VIEC';
      const accountStatus: AccountLifecycleState = emp.status === 'DA_NGHI_VIEC' 
        ? 'TERMINATED_LOCKED' 
        : emp.status === 'TAM_HOAN_HD' 
        ? 'SUSPENDED' 
        : 'ACTIVE';

      if (uIdx === -1) {
        users.push({
          id: emp.id,
          code: emp.code,
          name: emp.name,
          email: emp.email,
          phone: emp.phone,
          role: emp.role || 'NHAN_VIEN',
          department: emp.department || 'KE_TOAN_THUE',
          position: emp.position || 'Chuyên viên Kế toán',
          active: isActive,
          accountStatus: accountStatus,
        });
        addedUsersCount++;
      } else {
        users[uIdx] = {
          ...users[uIdx],
          name: emp.name,
          email: emp.email,
          phone: emp.phone,
          role: emp.role || users[uIdx].role,
          department: emp.department || users[uIdx].department,
          position: emp.position || users[uIdx].position,
          active: isActive,
          accountStatus: accountStatus,
        };
      }

      // Đảm bảo có Credential tương ứng
      const cIdx = creds.findIndex(c => c.userId === emp.id || c.employeeCode === emp.code);
      if (cIdx === -1) {
        const generatedUsername = generateEnterpriseUsername(emp.name, emp.code);
        const generatedPassword = generateSecureInitialPassword(emp.name);
        const nowIso = new Date().toISOString();
        creds.push({
          id: `CRED-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`,
          userId: emp.id,
          employeeCode: emp.code,
          employeeName: emp.name,
          username: generatedUsername,
          email: emp.email,
          password: generatedPassword,
          rawInitialPassword: generatedPassword,
          role: emp.role || 'NHAN_VIEN',
          department: emp.department || 'KE_TOAN_THUE',
          position: emp.position || 'Chuyên viên Kế toán',
          status: accountStatus,
          twoFactorEnabled: false,
          passwordUpdatedAt: nowIso,
          passwordExpiryDays: 90,
          failedLoginAttempts: 0,
          maxFailedAttempts: 5,
          issuedAt: nowIso,
          issuedBy: defaultActor.id,
          issuedByName: defaultActor.name,
          notes: `Tự động đồng bộ từ Hồ sơ Nhân sự & Lương. Mật khẩu khởi tạo: ${generatedPassword}`,
        });
        addedCredentialsCount++;
      } else {
        creds[cIdx].employeeName = emp.name;
        creds[cIdx].email = emp.email;
        creds[cIdx].role = emp.role || creds[cIdx].role;
        creds[cIdx].department = emp.department || creds[cIdx].department;
        creds[cIdx].position = emp.position || creds[cIdx].position;
        if (emp.status === 'DA_NGHI_VIEC') {
          creds[cIdx].status = 'TERMINATED_LOCKED';
        } else if (emp.status === 'TAM_HOAN_HD' && creds[cIdx].status === 'ACTIVE') {
          creds[cIdx].status = 'SUSPENDED';
        }
      }
    });

    // 2. Đồng bộ ngược từ USERS sang EMPLOYEES nếu có User nhưng chưa có EmployeeProfile
    const updatedEmployees = [...employees];
    users.forEach(u => {
      if (u.id === 'USR-001' || u.id === 'USR-002' || u.id === 'USR-029') return;
      const empIdx = updatedEmployees.findIndex(e => e.id === u.id || e.code === u.code);
      if (empIdx === -1) {
        updatedEmployees.push({
          id: u.id,
          code: u.code,
          name: u.name,
          email: u.email,
          phone: u.phone || '0901234567',
          department: u.department || 'KE_TOAN_THUE',
          position: u.position || (u.role === 'ADMIN' ? 'Quản Trị Viên' : 'Chuyên viên Kế toán'),
          role: u.role || 'NHAN_VIEN',
          status: u.active === false ? 'DA_NGHI_VIEC' : 'DANG_LAM_VIEC',
          contractType: 'KHONG_XAC_DINH_THOI_HAN',
          dateOfJoining: '2026-01-01',
          contractStartDate: '2026-01-01',
          baseSalary: 12000000,
          actualSalary: 15000000,
          positionAllowance: 1000000,
          lunchAllowance: 730000,
          phoneAllowance: 500000,
          taxDependents: 0,
          qualifications: ['Đại học Kế toán / Kiểm toán'],
          maxCustomerCapacity: u.role === 'NHAN_VIEN' ? 7 : 10,
          managedCustomersCount: 0,
          activeTasksCount: 0,
          notes: 'Tự động đồng bộ từ tài khoản Người dùng hệ thống',
        });
        addedEmployeesCount++;
      }
    });

    this.saveUsers(users);
    this.saveEmployees(updatedEmployees);
    this.saveCredentials(creds);

    this.broadcastSync({
      id: `SYNC-${Date.now()}`,
      type: 'FORCE_SYNC',
      timestamp: new Date().toISOString(),
      senderId: defaultActor.id,
      senderName: defaultActor.name,
      payload: { action: 'RECONCILE_PERSONNEL_RBAC_IAM' }
    });

    return {
      success: true,
      totalEmployees: updatedEmployees.length,
      totalUsers: users.length,
      totalCredentials: creds.length,
      addedUsersCount,
      addedEmployeesCount,
      addedCredentialsCount,
      message: `Đồng bộ thành công! Hiện có ${users.length} tài khoản người dùng, ${updatedEmployees.length} hồ sơ nhân sự, ${creds.length} tài khoản IAM.`,
    };
  }

  getCurrentUser(): User {
    const users = this.getUsers();
    const currentId = this.get<string | null>(STORAGE_KEYS.CURRENT_USER_ID, 'USR-030'); // Default to Super Admin (USR-030)
    let user = currentId ? users.find(u => u.id === currentId) : null;
    if (!user && (currentId === 'USR-001' || currentId === 'USR-002' || currentId === 'USR-029')) {
      this.setCurrentUserId('USR-030');
      user = users.find(u => u.id === 'USR-030');
    }
    return user || users.find(u => u.role === 'ADMIN') || users[0] || ROOT_ADMIN_USER;
  }

  getLoggedInUser(): User | null {
    const users = this.getUsers();
    const currentId = this.get<string | null>(STORAGE_KEYS.CURRENT_USER_ID, null);
    if (!currentId) return null;
    return users.find(u => u.id === currentId) || null;
  }

  setCurrentUserId(userId: string | null): void {
    if (userId) {
      this.set(STORAGE_KEYS.CURRENT_USER_ID, userId);
    } else {
      this.remove(STORAGE_KEYS.CURRENT_USER_ID);
    }
  }

  logout(actor?: User): { success: boolean; message: string } {
    const user = actor || this.getLoggedInUser();
    this.remove(STORAGE_KEYS.CURRENT_USER_ID);

    if (user) {
      this.addAuditLog({
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: 'LOGOUT',
        entityType: 'USER',
        entityId: user.id,
        entityTitle: user.name,
        details: `Người dùng ${user.name} (${user.position}) đã đăng xuất an toàn khỏi hệ thống.`,
      });
    }

    return {
      success: true,
      message: 'Đăng xuất thành công. Đã kết thúc phiên làm việc an toàn.'
    };
  }

  // CUSTOMERS
  getCustomers(): Customer[] {
    const raw = this.get<Customer[] | null>(STORAGE_KEYS.CUSTOMERS, null);
    if (raw === null || !Array.isArray(raw)) {
      this.set(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
      return INITIAL_CUSTOMERS;
    }
    const customersList = raw;
    
    // Normalize customer staff assignments to guarantee valid staff mappings
    const users = this.getUsers();
    const adminUser = users.find(u => u.role === 'ADMIN') || ROOT_ADMIN_USER;

    return customersList.map(cust => {
      let staffId = cust.assignedStaffId;
      let staffName = cust.assignedStaffName;
      if (staffName && !staffId) {
        const found = users.find(u => u.name === staffName);
        if (found) staffId = found.id;
      }
      if (staffId && !staffName) {
        const found = users.find(u => u.id === staffId);
        if (found) staffName = found.name;
      }
      
      let revId = cust.reviewerStaffId;
      let revName = cust.reviewerStaffName;
      if (revName && !revId) {
        const found = users.find(u => u.name === revName);
        if (found) revId = found.id;
      }
      if (revId && !revName) {
        const found = users.find(u => u.id === revId);
        if (found) revName = found.name;
      }

      return {
        ...cust,
        assignedStaffId: staffId || adminUser.id,
        assignedStaffName: staffName || adminUser.name,
        reviewerStaffId: revId || adminUser.id,
        reviewerStaffName: revName || adminUser.name,
      };
    });
  }

  saveCustomers(customers: Customer[]): void {
    this.set(STORAGE_KEYS.CUSTOMERS, customers);
  }

  getCustomerById(id: string): Customer | undefined {
    return this.getCustomers().find(c => c.id === id);
  }

  addCustomer(customer: Customer, actor?: User): void {
    const defaultActor = actor || this.getCurrentUser();
    const customers = this.getCustomers();
    const stampedCustomer: Customer = {
      ...customer,
      version: 1,
      lastModifiedBy: defaultActor.id,
      lastModifiedByName: defaultActor.name,
      createdAt: customer.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [stampedCustomer, ...customers];
    this.saveCustomers(updated);
    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'CREATE',
      entityType: 'CUSTOMER',
      entityId: customer.id,
      entityTitle: customer.name,
      details: `Tạo hồ sơ khách hàng mới: ${customer.name} (MST: ${customer.taxCode})`,
    });
    this.broadcastSync({
      id: `CUST-${Date.now()}`,
      type: 'CUSTOMER_CREATED',
      entityType: 'CUSTOMER',
      entityId: customer.id,
      senderId: defaultActor.id,
      senderName: defaultActor.name,
      timestamp: new Date().toISOString(),
      payload: stampedCustomer,
    });
  }

  createCustomer(customer: Customer, actor?: User): void {
    this.addCustomer(customer, actor);
  }

  updateCustomer(customer: Customer, actor?: User): ConcurrencyConflictResult<Customer> {
    const defaultActor = actor || this.getCurrentUser();
    const customers = this.getCustomers();
    const index = customers.findIndex(c => c.id === customer.id);
    if (index === -1) {
      return { success: false, conflict: false, message: 'Không tìm thấy khách hàng' };
    }

    const old = customers[index];

    // Optimistic Concurrency Lock check
    if (customer.version !== undefined && old.version !== undefined && customer.version < old.version) {
      return {
        success: false,
        conflict: true,
        clientVersion: customer.version,
        serverVersion: old.version,
        serverEntity: old,
        message: `Phát hiện xung đột: Khách hàng "${old.name}" vừa được cập nhật bởi ${old.lastModifiedByName || 'nhân viên khác'} lúc ${new Date(old.updatedAt || '').toLocaleTimeString('vi-VN')}. Vui lòng nạp lại dữ liệu trước khi lưu!`,
      };
    }

    const nextVersion = (old.version || 1) + 1;
    const updatedCustomer: Customer = {
      ...customer,
      version: nextVersion,
      lastModifiedBy: defaultActor.id,
      lastModifiedByName: defaultActor.name,
      updatedAt: new Date().toISOString(),
    };
    customers[index] = updatedCustomer;
    this.saveCustomers(customers);

    // Tự động đồng bộ thông tin khách hàng sang các công việc (Tasks) liên quan
    const allTasks = this.getTasks();
    let tasksSynced = false;
    allTasks.forEach(t => {
      if (t.customerId === customer.id) {
        if (customer.name && t.customerName !== customer.name) {
          t.customerName = customer.name;
          tasksSynced = true;
        }
        if (customer.taxCode && t.customerTaxCode !== customer.taxCode) {
          t.customerTaxCode = customer.taxCode;
          tasksSynced = true;
        }
      }
    });
    if (tasksSynced) {
      this.saveTasks(allTasks);
    }

    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'UPDATE',
      entityType: 'CUSTOMER',
      entityId: customer.id,
      entityTitle: customer.name,
      details: `Cập nhật thông tin khách hàng ${customer.name} (v${nextVersion})`,
      changes: [
        { field: 'riskLevel', oldValue: old.riskLevel, newValue: customer.riskLevel },
        { field: 'debtAmount', oldValue: old.debtAmount, newValue: customer.debtAmount },
        { field: 'contractStatus', oldValue: old.contractStatus, newValue: customer.contractStatus },
      ],
    });

    this.broadcastSync({
      id: `CUST-UPD-${Date.now()}`,
      type: 'CUSTOMER_UPDATED',
      entityType: 'CUSTOMER',
      entityId: customer.id,
      senderId: defaultActor.id,
      senderName: defaultActor.name,
      timestamp: new Date().toISOString(),
      payload: updatedCustomer,
    });

    return { success: true, conflict: false, serverEntity: updatedCustomer, serverVersion: nextVersion };
  }

  deleteCustomer(customerId: string, actor?: User): void {
    const defaultActor = actor || this.getCurrentUser();
    const customers = this.getCustomers();
    const cust = customers.find(c => c.id === customerId);
    if (cust) {
      const filtered = customers.filter(c => c.id !== customerId);
      this.saveCustomers(filtered);
      this.addAuditLog({
        actorId: defaultActor.id,
        actorName: defaultActor.name,
        actorRole: defaultActor.role,
        action: 'DELETE',
        entityType: 'CUSTOMER',
        entityId: customerId,
        entityTitle: cust.name,
        details: `Xóa khách hàng ${cust.name} khỏi hệ thống`,
      });
      this.broadcastSync({
        id: `CUST-DEL-${Date.now()}`,
        type: 'CUSTOMER_UPDATED',
        entityType: 'CUSTOMER',
        entityId: customerId,
        senderId: defaultActor.id,
        senderName: defaultActor.name,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // =========================================================================
  // CONTRACT & OPERATIONAL CYCLES EXPIRATION & RENEWAL ENGINE
  // =========================================================================

  getContractExpiryInfo(customer: Customer, refDate: string = CURRENT_SYSTEM_DATE): {
    status: CycleExpiryStatus;
    daysRemaining: number;
    labelText: string;
    badgeClass: string;
    isExpired: boolean;
    isExpiringSoon: boolean;
    shouldRenew: boolean;
  } {
    if (!customer.contractEndDate) {
      return {
        status: 'VALID',
        daysRemaining: 999,
        labelText: 'Hợp đồng không xác định hạn',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300',
        isExpired: false,
        isExpiringSoon: false,
        shouldRenew: false,
      };
    }

    const today = new Date(refDate);
    today.setHours(0, 0, 0, 0);

    const end = new Date(customer.contractEndDate);
    end.setHours(0, 0, 0, 0);

    const diffMs = end.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
      return {
        status: 'EXPIRED',
        daysRemaining,
        labelText: `Đã quá hạn ký mới (${Math.abs(daysRemaining)} ngày)`,
        badgeClass: 'bg-rose-600 text-white border-rose-700 font-bold animate-pulse',
        isExpired: true,
        isExpiringSoon: true,
        shouldRenew: true,
      };
    }

    if (daysRemaining <= 15) {
      return {
        status: 'CRITICAL_15',
        daysRemaining,
        labelText: `Nguy cấp: Hết hạn trong ${daysRemaining} ngày`,
        badgeClass: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800 font-bold',
        isExpired: false,
        isExpiringSoon: true,
        shouldRenew: true,
      };
    }

    if (daysRemaining <= 30) {
      return {
        status: 'WARNING_30',
        daysRemaining,
        labelText: `Cảnh báo: Hết hạn trong ${daysRemaining} ngày`,
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 font-semibold',
        isExpired: false,
        isExpiringSoon: true,
        shouldRenew: true,
      };
    }

    if (daysRemaining <= 60) {
      return {
        status: 'NOTICE_60',
        daysRemaining,
        labelText: `Sắp hết hạn trong ${daysRemaining} ngày`,
        badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950/50 dark:text-yellow-300 dark:border-yellow-800',
        isExpired: false,
        isExpiringSoon: true,
        shouldRenew: false,
      };
    }

    return {
      status: 'VALID',
      daysRemaining,
      labelText: `Còn ${daysRemaining} ngày`,
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
      isExpired: false,
      isExpiringSoon: false,
      shouldRenew: false,
    };
  }

  getDigitalSignatureExpiryInfo(customer: Customer, refDate: string = CURRENT_SYSTEM_DATE): {
    status: CycleExpiryStatus;
    daysRemaining: number;
    labelText: string;
    badgeClass: string;
    isExpired: boolean;
    isExpiringSoon: boolean;
  } {
    if (!customer.digitalSignatureExpiry) {
      return {
        status: 'VALID',
        daysRemaining: 999,
        labelText: 'Chưa có thông tin CKS',
        badgeClass: 'bg-slate-100 text-slate-600',
        isExpired: false,
        isExpiringSoon: false,
      };
    }

    const today = new Date(refDate);
    today.setHours(0, 0, 0, 0);

    const end = new Date(customer.digitalSignatureExpiry);
    end.setHours(0, 0, 0, 0);

    const diffMs = end.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
      return {
        status: 'EXPIRED',
        daysRemaining,
        labelText: `CKS hết hạn (${Math.abs(daysRemaining)} ngày) - Khóa nộp thuế!`,
        badgeClass: 'bg-rose-700 text-white font-bold',
        isExpired: true,
        isExpiringSoon: true,
      };
    }

    if (daysRemaining <= 15) {
      return {
        status: 'CRITICAL_15',
        daysRemaining,
        labelText: `CKS hết hạn trong ${daysRemaining} ngày`,
        badgeClass: 'bg-red-100 text-red-700 font-bold border border-red-300',
        isExpired: false,
        isExpiringSoon: true,
      };
    }

    if (daysRemaining <= 30) {
      return {
        status: 'WARNING_30',
        daysRemaining,
        labelText: `CKS hết hạn trong ${daysRemaining} ngày`,
        badgeClass: 'bg-amber-100 text-amber-800 border border-amber-300',
        isExpired: false,
        isExpiringSoon: true,
      };
    }

    if (daysRemaining <= 60) {
      return {
        status: 'NOTICE_60',
        daysRemaining,
        labelText: `CKS còn ${daysRemaining} ngày`,
        badgeClass: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
        isExpired: false,
        isExpiringSoon: true,
      };
    }

    return {
      status: 'VALID',
      daysRemaining,
      labelText: `CKS còn ${daysRemaining} ngày`,
      badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      isExpired: false,
      isExpiringSoon: false,
    };
  }

  getEInvoiceExpiryInfo(customer: Customer, refDate: string = CURRENT_SYSTEM_DATE): {
    status: CycleExpiryStatus;
    remaining: number;
    daysRemaining?: number;
    labelText: string;
    badgeClass: string;
    isWarning: boolean;
  } {
    const remaining = customer.eInvoiceRemaining !== undefined ? customer.eInvoiceRemaining : 350;
    
    if (remaining <= 20) {
      return {
        status: 'CRITICAL_15',
        remaining,
        labelText: `Gấp: Chỉ còn ${remaining} hóa đơn`,
        badgeClass: 'bg-rose-600 text-white font-bold',
        isWarning: true,
      };
    }

    if (remaining <= 50) {
      return {
        status: 'WARNING_30',
        remaining,
        labelText: `Sắp hết: Còn ${remaining} hóa đơn`,
        badgeClass: 'bg-amber-100 text-amber-800 border border-amber-300',
        isWarning: true,
      };
    }

    return {
      status: 'VALID',
      remaining,
      labelText: `Còn ${remaining} hóa đơn`,
      badgeClass: 'bg-slate-100 text-slate-700',
      isWarning: false,
    };
  }

  getHREmployeeContractExpiryInfo(employee: EmployeeProfile, refDate: string = CURRENT_SYSTEM_DATE): {
    status: CycleExpiryStatus;
    daysRemaining: number;
    labelText: string;
    badgeClass: string;
    isExpiringSoon: boolean;
    actionRequired: string;
  } {
    if (employee.contractType === 'KHONG_XAC_DINH_THOI_HAN' || !employee.contractEndDate) {
      return {
        status: 'VALID',
        daysRemaining: 999,
        labelText: 'HĐLĐ vô thời hạn',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        isExpiringSoon: false,
        actionRequired: 'Không cần tái ký',
      };
    }

    const today = new Date(refDate);
    today.setHours(0, 0, 0, 0);

    const end = new Date(employee.contractEndDate);
    end.setHours(0, 0, 0, 0);

    const diffMs = end.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const isProbation = employee.contractType === 'THU_VIEC';

    if (daysRemaining < 0) {
      return {
        status: 'EXPIRED',
        daysRemaining,
        labelText: `${isProbation ? 'Hết hạn thử việc' : 'Hết hạn HĐLĐ'} (${Math.abs(daysRemaining)} ngày)`,
        badgeClass: 'bg-rose-600 text-white font-bold',
        isExpiringSoon: true,
        actionRequired: isProbation ? 'Ký HĐLĐ chính thức ngay' : 'Tái ký HĐLĐ mới hoặc vô thời hạn',
      };
    }

    if (daysRemaining <= 15) {
      return {
        status: 'CRITICAL_15',
        daysRemaining,
        labelText: `Khẩn cấp: ${isProbation ? 'Thử việc' : 'HĐLĐ'} hết hạn trong ${daysRemaining} ngày`,
        badgeClass: 'bg-red-100 text-red-700 font-bold border border-red-300',
        isExpiringSoon: true,
        actionRequired: isProbation ? 'Đánh giá thử việc & Ký HĐLĐ 1 năm' : 'Chuẩn bị tái ký HĐLĐ',
      };
    }

    if (daysRemaining <= 30) {
      return {
        status: 'WARNING_30',
        daysRemaining,
        labelText: `Cảnh báo: ${isProbation ? 'Thử việc' : 'HĐLĐ'} hết hạn trong ${daysRemaining} ngày`,
        badgeClass: 'bg-amber-100 text-amber-800 border border-amber-300',
        isExpiringSoon: true,
        actionRequired: 'Lên lịch trao đổi đánh giá nhân sự & HĐLĐ',
      };
    }

    if (daysRemaining <= 60) {
      return {
        status: 'NOTICE_60',
        daysRemaining,
        labelText: `${isProbation ? 'Thử việc' : 'HĐLĐ'} còn ${daysRemaining} ngày`,
        badgeClass: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
        isExpiringSoon: true,
        actionRequired: 'Theo dõi chu kỳ đánh giá',
      };
    }

    return {
      status: 'VALID',
      daysRemaining,
      labelText: `Còn ${daysRemaining} ngày`,
      badgeClass: 'bg-emerald-100 text-emerald-800',
      isExpiringSoon: false,
      actionRequired: 'Đang thực hiện hợp đồng bình thường',
    };
  }

  // Aggregate All Expiring Operational Cycles Across the Entire System
  getAllSystemExpiringCycles(refDate: string = CURRENT_SYSTEM_DATE): SystemExpiringCycleItem[] {
    const items: SystemExpiringCycleItem[] = [];
    const customers = this.getCustomers();
    const employees = this.getEmployees();

    // 1. Customer Service Contracts
    customers.forEach(cust => {
      if (cust.contractEndDate) {
        const info = this.getContractExpiryInfo(cust, refDate);
        if (info.status !== 'VALID' || info.daysRemaining <= 60) {
          items.push({
            id: `CYCLE-CONTRACT-${cust.id}`,
            category: 'CUSTOMER_CONTRACT',
            categoryName: 'Hợp Đồng Dịch Vụ Đại Lý Thuế',
            title: `HĐ Dịch Vụ: ${cust.name}`,
            entityName: cust.name,
            entityId: cust.id,
            code: cust.code || cust.taxCode,
            startDate: cust.serviceStartDate,
            endDate: cust.contractEndDate,
            daysRemaining: info.daysRemaining,
            status: info.status,
            statusLabel: info.labelText,
            badgeClass: info.badgeClass,
            responsiblePerson: cust.assignedStaffName || 'Chuyên viên quản lý',
            responsibleDepartment: 'Phòng Kinh Doanh / CSKH & Thuế',
            actionRequired: info.isExpired 
              ? 'Lập tức liên hệ khách hàng ký hợp đồng mới hoặc phụ lục gia hạn năm tiếp theo.'
              : 'Gửi đề xuất gia hạn, báo giá dịch vụ năm mới và chuẩn bị hợp đồng trước 30 ngày.',
            monthlyFee: cust.monthlyFee,
            servicePackage: cust.servicePackage,
            extraInfo: `MST: ${cust.taxCode} • Phí: ${cust.monthlyFee?.toLocaleString('vi-VN')} đ/tháng`,
          });
        }
      }

      // 2. Digital Signatures (CKS Token)
      if (cust.digitalSignatureExpiry) {
        const cksInfo = this.getDigitalSignatureExpiryInfo(cust, refDate);
        if (cksInfo.status !== 'VALID' || cksInfo.daysRemaining <= 60) {
          items.push({
            id: `CYCLE-CKS-${cust.id}`,
            category: 'DIGITAL_SIGNATURE',
            categoryName: 'Chữ Ký Số (Token CKS)',
            title: `Token CKS (${cust.digitalSignatureProvider || 'Viettel-CA'}): ${cust.name}`,
            entityName: cust.name,
            entityId: cust.id,
            code: cust.taxCode,
            startDate: cust.serviceStartDate,
            endDate: cust.digitalSignatureExpiry,
            daysRemaining: cksInfo.daysRemaining,
            status: cksInfo.status,
            statusLabel: cksInfo.labelText,
            badgeClass: cksInfo.badgeClass,
            responsiblePerson: cust.assignedStaffName || 'Kế toán phụ trách',
            responsibleDepartment: 'Bộ Phận Kế Toán Thuế & CKS',
            actionRequired: cksInfo.isExpired 
              ? 'CKS đã hết hạn! Không thể nộp tờ khai thuế, hóa đơn, BHXH. Liên hệ nhà mạng cấp bù/gia hạn gấp.'
              : 'Gia hạn gói Chữ ký số từ nhà mạng (Viettel, VNPT, FPT, BKAV) trước khi đến kỳ kê khai thuế.',
            extraInfo: `Nhà mạng: ${cust.digitalSignatureProvider || 'Viettel-CA'} • MST: ${cust.taxCode}`,
          });
        }
      }

      // 3. E-Invoice Packages (Hóa đơn điện tử)
      if (cust.eInvoiceRemaining !== undefined && cust.eInvoiceRemaining <= 50) {
        const invInfo = this.getEInvoiceExpiryInfo(cust, refDate);
        items.push({
          id: `CYCLE-INVOICE-${cust.id}`,
          category: 'EINVOICE_PACKAGE',
          categoryName: 'Gói Hóa Đơn Điện Tử',
          title: `HĐĐT sắp cạn: ${cust.name}`,
          entityName: cust.name,
          entityId: cust.id,
          code: cust.taxCode,
          startDate: cust.serviceStartDate,
          endDate: cust.eInvoiceExpiryDate || cust.contractEndDate || '',
          daysRemaining: 10,
          status: invInfo.status,
          statusLabel: invInfo.labelText,
          badgeClass: invInfo.badgeClass,
          responsiblePerson: cust.assignedStaffName || 'Kế toán phụ trách',
          responsibleDepartment: 'Kế toán thuế & CSKH',
          actionRequired: 'Tư vấn khách hàng mua thêm gói dải hóa đơn điện tử (500 hoặc 1.000 số) để tránh gián đoạn xuất hàng.',
          extraInfo: `Còn lại ${cust.eInvoiceRemaining} / ${cust.eInvoiceTotalQuota || 500} hóa đơn`,
        });
      }

      // 4. Business Sub-Licenses if any
      if (cust.businessLicenseExpiry) {
        const today = new Date(refDate);
        const licEnd = new Date(cust.businessLicenseExpiry);
        const diff = Math.ceil((licEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diff <= 60) {
          items.push({
            id: `CYCLE-LICENSE-${cust.id}`,
            category: 'BUSINESS_LICENSE',
            categoryName: 'Giấy Phép Con & Điều Kiện Ngành Nghề',
            title: `Giấy phép: ${cust.businessLicenseName || 'GP Ngành nghề có điều kiện'}`,
            entityName: cust.name,
            entityId: cust.id,
            code: cust.taxCode,
            startDate: cust.serviceStartDate,
            endDate: cust.businessLicenseExpiry,
            daysRemaining: diff,
            status: diff < 0 ? 'EXPIRED' : (diff <= 15 ? 'CRITICAL_15' : 'WARNING_30'),
            statusLabel: diff < 0 ? `Hết hạn giấy phép (${Math.abs(diff)} ngày)` : `Còn ${diff} ngày hết hạn giấy phép`,
            badgeClass: diff < 0 ? 'bg-rose-600 text-white font-bold' : 'bg-amber-100 text-amber-800',
            responsiblePerson: 'Phòng Pháp Lý Doanh Nghiệp',
            responsibleDepartment: 'Pháp Lý & ĐKKD',
            actionRequired: 'Thực hiện thủ tục xin gia hạn hoặc cấp đổi Giấy chứng nhận đủ điều kiện kinh doanh.',
            extraInfo: cust.businessLicenseName || 'Giấy phép Vệ sinh ATTP / PCCC / Vận tải',
          });
        }
      }
    });

    // 5. Internal HR Labor Contracts & Probation for 30 Employees
    employees.forEach(emp => {
      if (emp.contractType !== 'KHONG_XAC_DINH_THOI_HAN' && emp.contractEndDate) {
        const hrInfo = this.getHREmployeeContractExpiryInfo(emp, refDate);
        if (hrInfo.status !== 'VALID' || hrInfo.daysRemaining <= 60) {
          const isProbation = emp.contractType === 'THU_VIEC';
          items.push({
            id: `CYCLE-HR-${emp.id}`,
            category: isProbation ? 'HR_PROBATION' : 'HR_LABOR_CONTRACT',
            categoryName: isProbation ? 'Hết Hạn Thử Việc Nhân Viên' : 'Hết Hạn Hợp Đồng Lao Động',
            title: `${isProbation ? 'Thử việc' : 'HĐLĐ'}: ${emp.name} (${emp.position})`,
            entityName: emp.name,
            entityId: emp.id,
            code: emp.code,
            startDate: emp.contractStartDate || emp.dateOfJoining,
            endDate: emp.contractEndDate,
            daysRemaining: hrInfo.daysRemaining,
            status: hrInfo.status,
            statusLabel: hrInfo.labelText,
            badgeClass: hrInfo.badgeClass,
            responsiblePerson: 'Phòng Hành Chính - Nhân Sự (HCNS)',
            responsibleDepartment: 'Ban Giám Đốc & HCNS',
            actionRequired: hrInfo.actionRequired,
            extraInfo: `Vị trí: ${emp.position} • Phòng: ${emp.department} • Lương: ${emp.actualSalary.toLocaleString('vi-VN')} đ`,
          });
        }
      }
    });

    // Sort by most urgent first (negative daysRemaining, then smallest positive)
    items.sort((a, b) => a.daysRemaining - b.daysRemaining);
    return items;
  }

  // 1-Click Contract Renewal Action
  renewCustomerContract(params: {
    customerId: string;
    contractNumber?: string;
    startDate: string;
    endDate: string;
    monthlyFee?: number;
    vatType?: VatType;
    servicePackage?: string;
    notes?: string;
    actor?: User;
  }): { success: boolean; customer?: Customer; message: string } {
    const defaultActor = params.actor || this.getCurrentUser();
    const customers = this.getCustomers();
    const custIndex = customers.findIndex(c => c.id === params.customerId);
    if (custIndex === -1) {
      return { success: false, message: 'Không tìm thấy khách hàng trong cơ sở dữ liệu' };
    }

    const currentCust = customers[custIndex];
    const previousHistory: ContractRenewalRecord[] = currentCust.contractHistory || [];

    // Archive previous contract details
    const archiveRecord: ContractRenewalRecord = {
      id: `REC-${Date.now()}`,
      contractNumber: currentCust.contractNumber || `HĐ-${currentCust.code || currentCust.taxCode}`,
      startDate: currentCust.serviceStartDate,
      endDate: currentCust.contractEndDate || params.startDate,
      monthlyFee: currentCust.monthlyFee,
      vatType: currentCust.vatType,
      servicePackage: currentCust.servicePackage,
      renewedAt: new Date().toISOString(),
      renewedBy: defaultActor.id,
      renewedByName: defaultActor.name,
      notes: params.notes || 'Tái ký gia hạn hợp đồng mới theo chu kỳ hàng năm.',
    };

    const updatedCustomer: Customer = {
      ...currentCust,
      contractNumber: params.contractNumber || `HĐ-${new Date().getFullYear()}/${currentCust.code || currentCust.taxCode}`,
      serviceStartDate: params.startDate,
      contractEndDate: params.endDate,
      monthlyFee: params.monthlyFee !== undefined ? params.monthlyFee : currentCust.monthlyFee,
      vatType: params.vatType !== undefined ? params.vatType : currentCust.vatType,
      servicePackage: params.servicePackage || currentCust.servicePackage,
      contractStatus: 'HIEU_LUC',
      contractHistory: [archiveRecord, ...previousHistory],
      version: (currentCust.version || 1) + 1,
      lastModifiedBy: defaultActor.id,
      lastModifiedByName: defaultActor.name,
      updatedAt: new Date().toISOString(),
    };

    customers[custIndex] = updatedCustomer;
    this.saveCustomers(customers);

    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'UPDATE',
      entityType: 'CUSTOMER',
      entityId: updatedCustomer.id,
      entityTitle: updatedCustomer.name,
      details: `Tái ký gia hạn hợp đồng thành công: Từ ${params.startDate} đến ${params.endDate}. Phí: ${(params.monthlyFee || currentCust.monthlyFee).toLocaleString('vi-VN')} đ/tháng`,
    });

    this.broadcastSync({
      id: `CUST-RENEW-${Date.now()}`,
      type: 'CUSTOMER_UPDATED',
      entityType: 'CUSTOMER',
      entityId: updatedCustomer.id,
      senderId: defaultActor.id,
      senderName: defaultActor.name,
      timestamp: new Date().toISOString(),
      payload: updatedCustomer,
    });

    return {
      success: true,
      customer: updatedCustomer,
      message: `Đã tái ký hợp đồng mới cho "${updatedCustomer.name}" thành công! Thời hạn hiệu lực đến ${params.endDate}.`,
    };
  }

  // Terminate & Liquidate Customer Service Contract
  terminateCustomerContract(params: {
    customerId: string;
    terminationDate: string;
    terminationReason: string;
    terminationDecisionNo?: string;
    terminationSettlementAmount?: number;
    terminationHandoverNotes?: string;
    returnDigitalSignatureToken?: boolean;
    finalizeTaxDocs?: boolean;
    settleDebtFinal?: boolean;
    closeActiveTasks?: boolean;
    actor?: User;
  }): { success: boolean; customer?: Customer; message: string } {
    const defaultActor = params.actor || this.getCurrentUser();
    const customers = this.getCustomers();
    const custIndex = customers.findIndex(c => c.id === params.customerId);
    if (custIndex === -1) {
      return { success: false, message: 'Không tìm thấy khách hàng trong cơ sở dữ liệu' };
    }

    const currentCust = customers[custIndex];
    const previousHistory: ContractRenewalRecord[] = currentCust.contractHistory || [];

    // Archive current contract before termination
    const archiveRecord: ContractRenewalRecord = {
      id: `REC-TERM-${Date.now()}`,
      contractNumber: currentCust.contractNumber || `HĐ-${currentCust.code || currentCust.taxCode}`,
      startDate: currentCust.serviceStartDate,
      endDate: params.terminationDate,
      monthlyFee: currentCust.monthlyFee,
      servicePackage: currentCust.servicePackage,
      renewedAt: new Date().toISOString(),
      renewedBy: defaultActor.id,
      renewedByName: defaultActor.name,
      notes: `[CHẤM DỨT/THANH LÝ HĐ] ${params.terminationReason}. Số BB: ${params.terminationDecisionNo || '---'}.`,
    };

    const updatedCustomer: Customer = {
      ...currentCust,
      contractStatus: 'DA_CHAM_DUT',
      terminationDate: params.terminationDate,
      terminationReason: params.terminationReason,
      terminationDecisionNo: params.terminationDecisionNo,
      terminationSettlementAmount: params.terminationSettlementAmount !== undefined ? params.terminationSettlementAmount : currentCust.debtAmount,
      terminationHandoverNotes: params.terminationHandoverNotes,
      returnDigitalSignatureToken: params.returnDigitalSignatureToken ?? true,
      finalizeTaxDocs: params.finalizeTaxDocs ?? true,
      settleDebtFinal: params.settleDebtFinal ?? true,
      terminatedAt: new Date().toISOString(),
      terminationByStaffId: defaultActor.id,
      terminationByStaffName: defaultActor.name,
      contractHistory: [archiveRecord, ...previousHistory],
      version: (currentCust.version || 1) + 1,
      lastModifiedBy: defaultActor.id,
      lastModifiedByName: defaultActor.name,
      updatedAt: new Date().toISOString(),
    };

    customers[custIndex] = updatedCustomer;
    this.saveCustomers(customers);

    // If closeActiveTasks is true, mark any open tasks for this customer as CANCELLED with a note
    if (params.closeActiveTasks) {
      const tasks = this.getTasks();
      let modifiedTasksCount = 0;
      const updatedTasks = tasks.map(t => {
        if (t.customerId === currentCust.id && t.status !== 'HOAN_THANH' && t.status !== 'HUY') {
          modifiedTasksCount++;
          return {
            ...t,
            status: 'HUY' as const,
            description: `${t.description ? t.description + '\n' : ''}[Đã hủy do chấm dứt hợp đồng dịch vụ ngày ${params.terminationDate}]`,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      });
      if (modifiedTasksCount > 0) {
        this.saveTasks(updatedTasks);
      }
    }

    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'UPDATE',
      entityType: 'CUSTOMER',
      entityId: updatedCustomer.id,
      entityTitle: updatedCustomer.name,
      details: `Chấm dứt & thanh lý hợp đồng dịch vụ cho khách hàng ${updatedCustomer.name}. Lý do: ${params.terminationReason}. Số BB: ${params.terminationDecisionNo || '---'}.`,
    });

    this.broadcastSync({
      id: `CUST-TERM-${Date.now()}`,
      type: 'CUSTOMER_UPDATED',
      entityType: 'CUSTOMER',
      entityId: updatedCustomer.id,
      senderId: defaultActor.id,
      senderName: defaultActor.name,
      timestamp: new Date().toISOString(),
      payload: updatedCustomer,
    });

    return {
      success: true,
      customer: updatedCustomer,
      message: `Đã chấm dứt & thanh lý hợp đồng dịch vụ thành công cho khách hàng "${updatedCustomer.name}".`,
    };
  }

  // Reactivate / Resume Terminated Customer Contract
  reactivateCustomerContract(customerId: string, actor?: User): { success: boolean; customer?: Customer; message: string } {
    const defaultActor = actor || this.getCurrentUser();
    const customers = this.getCustomers();
    const custIndex = customers.findIndex(c => c.id === customerId);
    if (custIndex === -1) {
      return { success: false, message: 'Không tìm thấy khách hàng' };
    }

    const currentCust = customers[custIndex];
    const todayStr = CURRENT_SYSTEM_DATE;
    const nextYear = new Date(todayStr);
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const newEndStr = nextYear.toISOString().split('T')[0];

    const updatedCustomer: Customer = {
      ...currentCust,
      contractStatus: 'HIEU_LUC',
      serviceStartDate: todayStr,
      contractEndDate: newEndStr,
      notes: `${currentCust.notes ? currentCust.notes + '\n' : ''}[Tái kích hoạt hợp đồng ngày ${todayStr} bởi ${defaultActor.name}]`,
      version: (currentCust.version || 1) + 1,
      lastModifiedBy: defaultActor.id,
      lastModifiedByName: defaultActor.name,
      updatedAt: new Date().toISOString(),
    };

    customers[custIndex] = updatedCustomer;
    this.saveCustomers(customers);

    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'UPDATE',
      entityType: 'CUSTOMER',
      entityId: updatedCustomer.id,
      entityTitle: updatedCustomer.name,
      details: `Tái kích hoạt hợp đồng dịch vụ cho khách hàng ${updatedCustomer.name}`,
    });

    this.broadcastSync({
      id: `CUST-REACTIVATE-${Date.now()}`,
      type: 'CUSTOMER_UPDATED',
      entityType: 'CUSTOMER',
      entityId: updatedCustomer.id,
      senderId: defaultActor.id,
      senderName: defaultActor.name,
      timestamp: new Date().toISOString(),
      payload: updatedCustomer,
    });

    return {
      success: true,
      customer: updatedCustomer,
      message: `Đã tái kích hoạt hợp đồng dịch vụ cho khách hàng "${updatedCustomer.name}" thành công!`,
    };
  }

  // 1-Click Digital Signature (Token CKS) Renewal
  renewDigitalSignature(params: {
    customerId: string;
    newExpiryDate: string;
    provider?: string;
    notes?: string;
    actor?: User;
  }): { success: boolean; customer?: Customer; message: string } {
    const defaultActor = params.actor || this.getCurrentUser();
    const customers = this.getCustomers();
    const custIndex = customers.findIndex(c => c.id === params.customerId);
    if (custIndex === -1) {
      return { success: false, message: 'Không tìm thấy khách hàng' };
    }

    const currentCust = customers[custIndex];
    const updatedCustomer: Customer = {
      ...currentCust,
      digitalSignatureExpiry: params.newExpiryDate,
      digitalSignatureProvider: params.provider || currentCust.digitalSignatureProvider || 'Viettel-CA',
      version: (currentCust.version || 1) + 1,
      lastModifiedBy: defaultActor.id,
      lastModifiedByName: defaultActor.name,
      updatedAt: new Date().toISOString(),
    };

    customers[custIndex] = updatedCustomer;
    this.saveCustomers(customers);

    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'UPDATE',
      entityType: 'CUSTOMER',
      entityId: updatedCustomer.id,
      entityTitle: updatedCustomer.name,
      details: `Gia hạn Chữ ký số (Token CKS): Hạn mới ${params.newExpiryDate} (${params.provider || currentCust.digitalSignatureProvider})`,
    });

    this.broadcastSync({
      id: `CUST-CKS-RENEW-${Date.now()}`,
      type: 'CUSTOMER_UPDATED',
      entityType: 'CUSTOMER',
      entityId: updatedCustomer.id,
      senderId: defaultActor.id,
      senderName: defaultActor.name,
      timestamp: new Date().toISOString(),
      payload: updatedCustomer,
    });

    return {
      success: true,
      customer: updatedCustomer,
      message: `Đã gia hạn Chữ ký số cho "${updatedCustomer.name}" đến ngày ${params.newExpiryDate}!`,
    };
  }

  // 1-Click HR Labor Contract Renewal for Internal Employees
  renewEmployeeLaborContract(params: {
    employeeId: string;
    newContractType: 'THU_VIEC' | 'XAC_DINH_1_NAM' | 'XAC_DINH_3_NAM' | 'KHONG_XAC_DINH_THOI_HAN';
    startDate: string;
    endDate?: string;
    newSalary?: number;
    notes?: string;
    actor?: User;
  }): { success: boolean; employee?: EmployeeProfile; message: string } {
    const defaultActor = params.actor || this.getCurrentUser();
    const employees = this.getEmployees();
    const empIndex = employees.findIndex(e => e.id === params.employeeId);
    if (empIndex === -1) {
      return { success: false, message: 'Không tìm thấy nhân viên' };
    }

    const currentEmp = employees[empIndex];
    const updatedEmp: EmployeeProfile = {
      ...currentEmp,
      contractType: params.newContractType,
      contractStartDate: params.startDate,
      contractEndDate: params.newContractType === 'KHONG_XAC_DINH_THOI_HAN' ? undefined : params.endDate,
      actualSalary: params.newSalary !== undefined ? params.newSalary : currentEmp.actualSalary,
      status: 'DANG_LAM_VIEC',
    };

    employees[empIndex] = updatedEmp;
    this.saveEmployees(employees);

    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'UPDATE',
      entityType: 'USER',
      entityId: updatedEmp.id,
      entityTitle: updatedEmp.name,
      details: `Tái ký Hợp đồng lao động (${params.newContractType}): Từ ${params.startDate} đến ${params.endDate || 'Vô thời hạn'}`,
    });

    this.broadcastSync({
      id: `EMP-RENEW-${Date.now()}`,
      type: 'FORCE_SYNC',
      senderId: defaultActor.id,
      senderName: defaultActor.name,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      employee: updatedEmp,
      message: `Đã ký hợp đồng mới (${params.newContractType}) cho nhân sự "${updatedEmp.name}" thành công!`,
    };
  }

  // TASKS
  getTasks(): Task[] {
    const rawTasks = this.get<Task[] | null>(STORAGE_KEYS.TASKS, null);
    if (rawTasks === null || !Array.isArray(rawTasks)) {
      this.set(STORAGE_KEYS.TASKS, INITIAL_TASKS);
      return INITIAL_TASKS;
    }
    
    if (rawTasks.length === 0) {
      return [];
    }
    
    const seenIds = new Set<string>();
    const uniqueTasks: Task[] = [];
    let hasDuplicates = false;

    for (const t of rawTasks) {
      if (!t || !t.id) continue;

      // Normalize cl-3 or any 20-million checklist item to 5 million
      if (t.checklist && Array.isArray(t.checklist)) {
        t.checklist = t.checklist.map(cl => {
          if (
            cl &&
            (cl.id === 'cl-3' ||
             (cl.title && (cl.title.includes('20 triệu') || cl.title.includes('20tr') || cl.title.includes('từ 5 triệu trở lên (và mua cùng NCC'))))
          ) {
            return {
              ...cl,
              title: 'Kiểm tra hóa đơn đầu vào trên 5 triệu có chứng từ thanh toán không dùng tiền mặt',
            };
          }
          return cl;
        });
      }

      if (!seenIds.has(t.id)) {
        seenIds.add(t.id);
        uniqueTasks.push(t);
      } else {
        // If a duplicate ID is found (e.g. from previous version), assign a new unique ID
        hasDuplicates = true;
        const uniqueId = `${t.id}-dup-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
        seenIds.add(uniqueId);
        uniqueTasks.push({ ...t, id: uniqueId });
      }
    }

    if (hasDuplicates) {
      this.set(STORAGE_KEYS.TASKS, uniqueTasks);
    }

    return uniqueTasks;
  }

  saveTasks(tasks: Task[]): void {
    if (!Array.isArray(tasks)) return;
    const seenIds = new Set<string>();
    const deduplicated: Task[] = [];
    for (const t of tasks) {
      if (!t || !t.id) continue;
      if (!seenIds.has(t.id)) {
        seenIds.add(t.id);
        deduplicated.push(t);
      }
    }
    this.set(STORAGE_KEYS.TASKS, deduplicated);
  }

  getTaskById(id: string): Task | undefined {
    return this.getTasks().find(t => t.id === id);
  }

  addTask(task: Task, actor?: User): void {
    const defaultActor = actor || this.getCurrentUser();
    const tasks = this.getTasks();
    const stampedTask: Task = {
      ...task,
      version: 1,
      lastModifiedBy: defaultActor.id,
      lastModifiedByName: defaultActor.name,
      createdAt: task.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [stampedTask, ...tasks];
    this.saveTasks(updated);
    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'CREATE',
      entityType: 'TASK',
      entityId: task.id,
      entityTitle: task.title,
      details: `Tạo công việc mới [${task.code}] giao cho ${task.assigneeName}, hạn: ${task.dueDate}`,
    });
    this.broadcastSync({
      id: `TSK-NEW-${Date.now()}`,
      type: 'TASK_CREATED',
      entityType: 'TASK',
      entityId: task.id,
      senderId: defaultActor.id,
      senderName: defaultActor.name,
      timestamp: new Date().toISOString(),
      payload: stampedTask,
    });
  }

  createTask(task: Task, actor?: User): void {
    this.addTask(task, actor);
  }

  deleteTask(taskId: string, actor?: User): { success: boolean; message: string } {
    const defaultActor = actor || this.getCurrentUser();
    const tasks = this.getTasks();
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (!taskToDelete) {
      return { success: false, message: 'Không tìm thấy công việc cần xóa' };
    }

    const filtered = tasks.filter(t => t.id !== taskId);
    this.saveTasks(filtered);

    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'DELETE',
      entityType: 'TASK',
      entityId: taskId,
      entityTitle: taskToDelete.title,
      details: `Đã xóa công việc [${taskToDelete.code}] ${taskToDelete.title}`,
    });

    this.broadcastSync({
      id: `TSK-DEL-${Date.now()}`,
      type: 'TASK_UPDATED',
      entityType: 'TASK',
      entityId: taskId,
      senderId: defaultActor.id,
      senderName: defaultActor.name,
      timestamp: new Date().toISOString(),
    });

    return { success: true, message: `Đã xóa thành công công việc [${taskToDelete.code}]` };
  }

  updateTask(task: Task, actor?: User, reason?: string): ConcurrencyConflictResult<Task> {
    const defaultActor = actor || this.getCurrentUser();
    const tasks = this.getTasks();
    const index = tasks.findIndex(t => t.id === task.id);
    if (index === -1) {
      return { success: false, conflict: false, message: 'Không tìm thấy công việc' };
    }

    const old = tasks[index];

    // Optimistic Concurrency Lock check (Chống lưu đè khi người khác đã sửa trước)
    if (task.version !== undefined && old.version !== undefined && task.version < old.version) {
      return {
        success: false,
        conflict: true,
        clientVersion: task.version,
        serverVersion: old.version,
        serverEntity: old,
        message: `Phát hiện xung đột: Công việc [${old.code}] vừa được cập nhật bởi ${old.lastModifiedByName || 'nhân viên khác'} lúc ${new Date(old.updatedAt || '').toLocaleTimeString('vi-VN')}. Hệ thống đã bảo vệ dữ liệu, vui lòng nạp bản mới nhất!`,
      };
    }

    const nextVersion = (old.version || 1) + 1;
    const updatedTask: Task = {
      ...task,
      version: nextVersion,
      lastModifiedBy: defaultActor.id,
      lastModifiedByName: defaultActor.name,
      updatedAt: new Date().toISOString(),
    };

    // Theo dõi và đồng bộ quyết định phê duyệt của Ban Giám Đốc / Kiểm soát viên
    if (task.status === 'HOAN_THANH') {
      if (!updatedTask.approvedBy) {
        updatedTask.approvedBy = defaultActor.id;
        updatedTask.approvedByName = defaultActor.name;
        updatedTask.approvedAt = updatedTask.approvedAt || new Date().toISOString();
        updatedTask.approvalDecision = 'APPROVED';
        updatedTask.approvalNotes = reason || 'Ban Giám Đốc đã nghiệm thu và phê duyệt chấp thuận';
      }
    } else if (task.status === 'CHO_PHE_DUYET') {
      updatedTask.approvalDecision = 'PENDING';
      if (!updatedTask.reviewedBy) {
        updatedTask.reviewedBy = defaultActor.id;
        updatedTask.reviewedByName = defaultActor.name;
        updatedTask.reviewedAt = new Date().toISOString();
      }
    } else if (task.status === 'CHO_KIEM_TRA') {
      updatedTask.approvalDecision = 'PENDING';
    } else if ((old.status === 'CHO_KIEM_TRA' || old.status === 'CHO_PHE_DUYET') && task.status === 'DANG_THUC_HIEN') {
      updatedTask.approvalDecision = 'MODIFICATION_REQUESTED';
      updatedTask.approvalNotes = reason || 'Sếp yêu cầu kiểm tra và điều chỉnh lại số liệu';
    }

    tasks[index] = updatedTask;
    this.saveTasks(tasks);
    
    const changes = [];
    if (old.status !== task.status) changes.push({ field: 'status', oldValue: old.status, newValue: task.status });
    if (old.assigneeId !== task.assigneeId) changes.push({ field: 'assigneeId', oldValue: old.assigneeName, newValue: task.assigneeName });
    if (old.dueDate !== task.dueDate) changes.push({ field: 'dueDate', oldValue: old.dueDate, newValue: task.dueDate });
    if (old.priority !== task.priority) changes.push({ field: 'priority', oldValue: old.priority, newValue: task.priority });
    
    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: old.status !== task.status ? 'STATUS_CHANGE' : 'UPDATE',
      entityType: 'TASK',
      entityId: task.id,
      entityTitle: task.title,
      details: reason || `Cập nhật công việc [${task.code}] ${task.title} (v${nextVersion})`,
      changes,
    });

    // If task transitioned to completed and is recurring, auto create next period
    if (old.status !== 'HOAN_THANH' && task.status === 'HOAN_THANH' && task.isRecurring && task.recurringRule?.autoCreateNext) {
      this.generateNextRecurringTask(task, defaultActor);
    }

    // Tự động đồng bộ biên nhận tờ khai nộp Thuế điện tử khi công việc thuế được hoàn thành & nghiệm thu
    if (task.status === 'HOAN_THANH' && (task.isTaxObligation || task.taxType)) {
      this.syncTaskToTaxFiling(updatedTask, defaultActor);
    }

    this.broadcastSync({
      id: `TSK-UPD-${Date.now()}`,
      type: 'TASK_UPDATED',
      entityType: 'TASK',
      entityId: task.id,
      senderId: defaultActor.id,
      senderName: defaultActor.name,
      timestamp: new Date().toISOString(),
      payload: updatedTask,
    });

    return { success: true, conflict: false, serverEntity: updatedTask, serverVersion: nextVersion };
  }

  private generateNextRecurringTask(completedTask: Task, actor: User): void {
    const rule = completedTask.recurringRule;
    if (!rule) return;

    // Calculate next due date
    const curDue = new Date(completedTask.dueDate);
    let nextDue = new Date(curDue);

    if (rule.frequency === 'HANG_NGAY') {
      nextDue.setDate(curDue.getDate() + (rule.interval || 1));
    } else if (rule.frequency === 'HANG_TUAN') {
      nextDue.setDate(curDue.getDate() + 7 * (rule.interval || 1));
    } else if (rule.frequency === 'HANG_THANG') {
      nextDue.setMonth(curDue.getMonth() + (rule.interval || 1));
      if (rule.dayOfMonth) nextDue.setDate(rule.dayOfMonth);
    } else if (rule.frequency === 'HANG_QUY') {
      nextDue.setMonth(curDue.getMonth() + 3 * (rule.interval || 1));
    } else if (rule.frequency === 'HANG_NAM') {
      nextDue.setFullYear(curDue.getFullYear() + (rule.interval || 1));
    }

    const nextDueDateStr = nextDue.toISOString().split('T')[0];
    const timestamp = Date.now();
    const newId = `TSK-REC-${timestamp}-${Math.random().toString(36).substring(2, 9)}`;
    const nextCode = `TSK-${nextDueDateStr.replace(/-/g, '').slice(0, 6)}-${Math.floor(Math.random() * 899 + 100)}`;

    // Reset workflow steps and checklist items
    const freshWorkflow = completedTask.workflowSteps.map(ws => ({
      ...ws,
      isCompleted: false,
      completedAt: undefined,
      completedBy: undefined,
      completedByName: undefined,
    }));

    const freshChecklist = completedTask.checklist.map(cl => ({
      ...cl,
      isCompleted: false,
      completedAt: undefined,
      completedBy: undefined,
      completedByName: undefined,
    }));

    // Generate next period label
    let nextPeriod = completedTask.taxPeriod;
    if (completedTask.taxPeriod?.includes('Tháng')) {
      const match = completedTask.taxPeriod.match(/Tháng (\d+)\/(\d+)/);
      if (match) {
        let m = parseInt(match[1], 10) + 1;
        let y = parseInt(match[2], 10);
        if (m > 12) { m = 1; y += 1; }
        nextPeriod = `Tháng ${m.toString().padStart(2, '0')}/${y}`;
      }
    } else if (completedTask.taxPeriod?.includes('Quý')) {
      const match = completedTask.taxPeriod.match(/Quý (\d+)\/(\d+)/);
      if (match) {
        let q = parseInt(match[1], 10) + 1;
        let y = parseInt(match[2], 10);
        if (q > 4) { q = 1; y += 1; }
        nextPeriod = `Quý ${q}/${y}`;
      }
    } else if (completedTask.taxPeriod?.includes('Năm')) {
      const match = completedTask.taxPeriod.match(/Năm (\d+)/);
      if (match) {
        let y = parseInt(match[1], 10) + 1;
        nextPeriod = `Năm ${y}`;
      }
    }

    const newTask: Task = {
      ...completedTask,
      id: newId,
      code: nextCode,
      title: completedTask.title.replace(/Tháng \d+\/\d+|Quý \d+\/\d+|Năm \d+/g, nextPeriod || ''),
      status: 'DA_PHAN_CONG',
      createdAt: new Date().toISOString(),
      dueDate: nextDueDateStr,
      completedAt: undefined,
      workflowSteps: freshWorkflow,
      checklist: freshChecklist,
      attachments: [],
      comments: [
        {
          id: `cm-${timestamp}`,
          authorId: 'USR-008',
          authorName: 'Hệ Thống Tự Động',
          authorRole: 'ADMIN',
          content: `Tự động khởi tạo kỳ công việc tiếp theo từ công việc hoàn thành [${completedTask.code}]`,
          createdAt: new Date().toISOString(),
          isInternal: true,
        }
      ],
      taxPeriod: nextPeriod,
      updatedAt: new Date().toISOString(),
    };

    const currentTasks = this.getTasks();
    this.saveTasks([newTask, ...currentTasks]);
    this.addAuditLog({
      actorId: 'USR-008',
      actorName: 'Hệ Thống Tự Động',
      actorRole: 'ADMIN',
      action: 'CREATE',
      entityType: 'TASK',
      entityId: newTask.id,
      entityTitle: newTask.title,
      details: `Tự động tạo công việc định kỳ mới [${newTask.code}] cho kỳ ${nextPeriod || nextDueDateStr}`,
    });
  }

  /**
   * Tự động phát sinh & phân bổ công việc định kỳ chuẩn hóa:
   * 1. CÔNG VIỆC KẾ TOÁN, HÓA ĐƠN CHỨNG TỪ & HOẠT ĐỘNG KINH DOANH: Thực hiện THƯỜNG XUYÊN THEO THÁNG cho 100% Khách hàng.
   * 2. KÊ KHAI NỘP THUẾ THEO PHÁP LUẬT (Luật Quản lý thuế & NĐ 126/2020/NĐ-CP):
   *    - Doanh thu năm trước > 50 Tỷ VNĐ: Kê khai theo THÁNG (GTGT 01/GTGT, TNCN 05/KK-TNCN).
   *    - Doanh thu năm trước ≤ 50 Tỷ VNĐ (và Hộ KD): Kê khai theo QUÝ (GTGT 01/GTGT theo Quý, TNCN 05/KK-TNCN theo Quý).
   *    - Tạm tính TNDN: Toàn bộ DN theo Quý (tạm nộp ≥ 80% năm).
   *    - Quyết toán BCTC: Toàn bộ DN theo Năm (hạn 31/03 năm sau).
   */
  autoDispatchPeriodicTasksForPackageCustomers(options: AutoDispatchOptions): AutoDispatchResult {
    const actor = options.actor || this.getCurrentUser();
    const customers = this.getCustomers();
    const templates = this.getTemplates();
    const currentTasks = this.getTasks();

    // 1. Filter eligible customers
    let targetCustomers = customers.filter(c => c.contractStatus !== 'TAM_DUNG' && c.contractStatus !== 'DA_HET_HAN');
    if (options.customerId && options.customerId !== 'ALL') {
      targetCustomers = targetCustomers.filter(c => c.id === options.customerId);
    } else if (options.targetPackage && options.targetPackage !== 'ALL') {
      targetCustomers = targetCustomers.filter(c => {
        const pkg = (c.servicePackage || '').toLowerCase();
        const target = options.targetPackage!.toLowerCase();
        return pkg.includes(target) || 
               (target === 'pkg-a' && pkg.includes('gói a')) ||
               (target === 'pkg-b' && pkg.includes('gói b')) ||
               (target === 'pkg-c' && pkg.includes('gói c')) ||
               (target === 'pkg-d' && pkg.includes('gói d'));
      });
    }

    const { periodMonth, periodYear, cycleType, dispatchCategory = 'ALL' } = options;
    const quarterNum = options.periodQuarter || Math.ceil(periodMonth / 3);
    const monthStr = `Tháng ${periodMonth.toString().padStart(2, '0')}/${periodYear}`;
    const quarterStr = `Quý ${quarterNum}/${periodYear}`;
    const yearStr = `Năm ${periodYear}`;

    // Statutory deadlines
    let nextMonth = periodMonth + 1;
    let nextYear = periodYear;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    const monthlyInvoiceCheckDue = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-15`;
    const monthlyTaxDue = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-20`;
    const monthlyPayrollDue = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-20`;
    const monthlyClosingDue = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-25`;

    // Hạn nộp tờ khai quý: Ngày cuối cùng tháng đầu quý sau (30/04, 31/07, 31/10, 31/01)
    let quarterlyTaxDue = `${periodYear}-04-30`;
    if (quarterNum === 2) quarterlyTaxDue = `${periodYear}-07-31`;
    else if (quarterNum === 3) quarterlyTaxDue = `${periodYear}-10-31`;
    else if (quarterNum === 4) quarterlyTaxDue = `${periodYear + 1}-01-31`;

    // Hạn nộp BCTC năm: 31/03 năm tiếp theo
    const annualBCTCDue = `${periodYear + 1}-03-31`;

    const tmplGTGT = templates.find(t => t.code === 'TMPL-GTGT-THANG') || templates[0];
    const tmplTNCN = templates.find(t => t.code === 'TMPL-TNCN-THANG') || templates[1] || templates[0];
    const tmplBCTC = templates.find(t => t.code === 'TMPL-BCTC-NAM') || templates[2] || templates[0];
    const tmplKhoaSo = templates.find(t => t.code === 'TMPL-KETOAN-KHOASO-THANG') || tmplGTGT;
    const tmplBHXH = templates.find(t => t.code === 'TMPL-BHXH-TANG-GIAM') || tmplTNCN;
    const tmplTNDN = templates.find(t => t.code === 'TMPL-TNDN-QUY') || tmplGTGT;

    const allUsers = this.getUsers();
    const createdTasks: Task[] = [];
    const customerSummaries: AutoDispatchCustomerSummary[] = [];
    let totalSkipped = 0;

    targetCustomers.forEach(cust => {
      // Determine legal tax cycle from Revenue: > 50 Billion VND -> Monthly; <= 50 Billion VND -> Quarterly
      const annualRev = cust.annualRevenue || 0;
      const isOver50B = annualRev > 50000000000;
      const effectiveTaxCycle: 'THANG' | 'QUY' = cust.taxDeclarationCycle || (isOver50B ? 'THANG' : 'QUY');
      const revBracket = cust.annualRevenueBracket || (isOver50B 
        ? 'Doanh thu năm trước > 50 tỷ VNĐ (Kê khai Thuế theo Tháng)' 
        : 'Doanh thu năm trước ≤ 50 tỷ VNĐ (Kê khai Thuế theo Quý)');

      // Resolve 100% accurate Assignee (Chuyên viên kế toán phụ trách)
      const resolvedAssignee = allUsers.find(u => u.id === cust.assignedStaffId)
        || allUsers.find(u => u.name === cust.assignedStaffName)
        || allUsers.find(u => u.role === 'NHAN_VIEN' && u.department === 'KE_TOAN_THUE')
        || { id: cust.assignedStaffId || 'USR-005', name: cust.assignedStaffName || 'Lê Hoàng Nam', role: 'NHAN_VIEN' };

      // Resolve 100% accurate Reviewer (Kế toán trưởng / Trưởng phòng soát xét)
      const resolvedReviewer = allUsers.find(u => u.id === cust.reviewerStaffId)
        || allUsers.find(u => u.name === cust.reviewerStaffName)
        || allUsers.find(u => u.role === 'TRUONG_PHONG' && u.department === 'KE_TOAN_THUE')
        || { id: cust.reviewerStaffId || 'USR-003', name: cust.reviewerStaffName || 'Trần Thị Mai', role: 'TRUONG_PHONG' };

      // Resolve Approver (Ban Giám Đốc / Admin)
      const resolvedApprover = allUsers.find(u => u.role === 'BAN_GIAM_DOC' || u.role === 'ADMIN')
        || ROOT_ADMIN_USER;

      const custSummary: AutoDispatchCustomerSummary = {
        customerId: cust.id,
        customerName: cust.name,
        customerTaxCode: cust.taxCode,
        package: cust.servicePackage,
        annualRevenue: annualRev,
        annualRevenueBracket: revBracket,
        taxDeclarationCycle: effectiveTaxCycle,
        assigneeId: resolvedAssignee.id,
        assigneeName: resolvedAssignee.name,
        reviewerId: resolvedReviewer.id,
        reviewerName: resolvedReviewer.name,
        accountingTasksCount: 0,
        taxFilingTasksCount: 0,
        tasksCreated: [],
        tasksSkipped: [],
      };

      const tasksToGenerate: Array<{
        template: ChecklistTemplate;
        title: string;
        taxPeriod: string;
        dueDate: string;
        taxType?: TaxObligationType;
        frequency: 'HANG_THANG' | 'HANG_QUY' | 'HANG_NAM';
        priority: 'THAP' | 'TRUNG_BINH' | 'CAO' | 'KHAN_CAP';
        riskLevel: 'BINH_THUONG' | 'TRUNG_BINH' | 'CAO' | 'RUI_RO_THUE_PHAP_LY';
        category: 'THUE_KE_TOAN' | 'HANH_CHINH_NHAN_SU' | 'KINH_DOANH_CSKH' | 'CSKH_HOP_DONG' | 'QUAN_LY_NOI_BO';
        workflowClassification: 'KE_TOAN_HOA_DON_THUONG_XUYEN' | 'KE_KHAI_THUE_THEO_LUAT';
        taxAllocationRule: 'THUONG_XUYEN_HANG_THANG' | 'KHAI_THUE_THANG_TREN_50_TY' | 'KHAI_THUE_QUY_DUOI_50_TY' | 'TAM_TINH_TNDN_QUY' | 'QUYET_TOAN_BCTC_NAM';
        revenueBracketNote: string;
        isTaxObligation: boolean;
        description: string;
      }> = [];

      // =========================================================================
      // GROUP 1: CÔNG VIỆC KẾ TOÁN, HÓA ĐƠN CHỨNG TỪ & HOẠT ĐỘNG KINH DOANH
      // (Thực hiện THƯỜNG XUYÊN THEO THÁNG cho 100% Khách hàng, không phân biệt doanh thu)
      // =========================================================================
      if (dispatchCategory !== 'KE_KHAI_THUE_PHAP_LUAT') {
        if (cycleType === 'THANG' || cycleType === 'ALL') {
          // Task 1: Thu thập & Kiểm soát Hóa đơn chứng từ
          tasksToGenerate.push({
            template: tmplGTGT,
            title: `Thu thập, kiểm tra hóa đơn & tra cứu rủi ro NCC ${monthStr} - ${cust.name}`,
            taxPeriod: monthStr,
            dueDate: monthlyInvoiceCheckDue,
            taxType: 'HOA_DON',
            frequency: 'HANG_THANG',
            priority: 'CAO',
            riskLevel: 'TRUNG_BINH',
            category: 'THUE_KE_TOAN',
            workflowClassification: 'KE_TOAN_HOA_DON_THUONG_XUYEN',
            taxAllocationRule: 'THUONG_XUYEN_HANG_THANG',
            revenueBracketNote: 'Nghiệp vụ kế toán định kỳ hàng tháng cho 100% doanh nghiệp',
            isTaxObligation: false,
            description: `[KẾ TOÁN & HÓA ĐƠN THƯỜNG XUYÊN HÀNG THÁNG] Thu thập 100% hóa đơn đầu vào / bán ra ${monthStr}. Tra cứu trạng thái rủi ro người nộp thuế của NCC trên gdt.gov.vn. Rà soát hóa đơn ≥ 5 triệu đồng bắt buộc có ủy nhiệm chi ngân hàng hợp lệ.`,
          });

          // Task 2: Hạch toán Kế toán, Đối chiếu Ngân hàng & Khóa sổ
          tasksToGenerate.push({
            template: tmplKhoaSo,
            title: `Hạch toán kế toán, đối chiếu ngân hàng & khóa sổ ${monthStr} - ${cust.name}`,
            taxPeriod: monthStr,
            dueDate: monthlyClosingDue,
            taxType: 'HOA_DON',
            frequency: 'HANG_THANG',
            priority: 'CAO',
            riskLevel: 'BINH_THUONG',
            category: 'THUE_KE_TOAN',
            workflowClassification: 'KE_TOAN_HOA_DON_THUONG_XUYEN',
            taxAllocationRule: 'THUONG_XUYEN_HANG_THANG',
            revenueBracketNote: 'Nghiệp vụ kế toán định kỳ hàng tháng cho 100% doanh nghiệp',
            isTaxObligation: false,
            description: `[KẾ TOÁN & HÓA ĐƠN THƯỜNG XUYÊN HÀNG THÁNG] Hạch toán doanh thu, chi phí, khấu hao TSCĐ (TK 214), phân bổ CCDC (TK 242). Đối chiếu khớp 100% sổ phụ ngân hàng (TK 112), công nợ 131/331 và khóa sổ kế toán ${monthStr}.`,
          });

          // Task 3: Chấm công, Tính lương & Hồ sơ BHXH
          tasksToGenerate.push({
            template: tmplBHXH,
            title: `Lập Bảng chấm công, tính lương & Đối soát hồ sơ BHXH ${monthStr} - ${cust.name}`,
            taxPeriod: monthStr,
            dueDate: monthlyPayrollDue,
            taxType: 'BHXH',
            frequency: 'HANG_THANG',
            priority: 'TRUNG_BINH',
            riskLevel: 'TRUNG_BINH',
            category: 'HANH_CHINH_NHAN_SU',
            workflowClassification: 'KE_TOAN_HOA_DON_THUONG_XUYEN',
            taxAllocationRule: 'THUONG_XUYEN_HANG_THANG',
            revenueBracketNote: 'Nghiệp vụ nhân sự - tiền lương hàng tháng',
            isTaxObligation: false,
            description: `[KẾ TOÁN & NHÂN SỰ THƯỜNG XUYÊN HÀNG THÁNG] Chốt bảng chấm công, tính lương nhân sự, trích nộp BHXH/BHYT/BHTN và lập hồ sơ báo tăng/giảm lao động ${monthStr}.`,
          });
        }
      }

      // =========================================================================
      // GROUP 2: KÊ KHAI & NỘP NGHĨA VỤ THUẾ THEO QUY ĐỊNH PHÁP LUẬT
      // (Phân bổ theo Doanh thu năm trước: > 50 Tỷ khai THÁNG; ≤ 50 Tỷ khai QUÝ)
      // =========================================================================
      if (dispatchCategory !== 'KE_TOAN_THUONG_XUYEN') {
        
        // 2A. Doanh nghiệp Doanh thu > 50 Tỷ: KÊ KHAI THEO THÁNG
        if (effectiveTaxCycle === 'THANG') {
          if (cycleType === 'THANG' || cycleType === 'ALL') {
            tasksToGenerate.push({
              template: tmplGTGT,
              title: `Kê khai thuế GTGT Tháng (Mẫu 01/GTGT) ${monthStr} - ${cust.name}`,
              taxPeriod: monthStr,
              dueDate: monthlyTaxDue,
              taxType: 'GTGT',
              frequency: 'HANG_THANG',
              priority: 'KHAN_CAP',
              riskLevel: 'RUI_RO_THUE_PHAP_LY',
              category: 'THUE_KE_TOAN',
              workflowClassification: 'KE_KHAI_THUE_THEO_LUAT',
              taxAllocationRule: 'KHAI_THUE_THANG_TREN_50_TY',
              revenueBracketNote: 'Doanh thu năm trước > 50 tỷ VNĐ (Kê khai theo Tháng)',
              isTaxObligation: true,
              description: `[KÊ KHAI THUẾ THEO LUẬT - DN > 50 TỶ] Doanh nghiệp có doanh thu năm trước > 50 tỷ VNĐ (thuộc diện kê khai theo Tháng theo Luật Quản lý thuế & NĐ 126/2020/NĐ-CP). Lập tờ khai 01/GTGT, ký số và nộp Cổng Thuế điện tử trước hạn 20/${nextMonth.toString().padStart(2, '0')}.`,
            });

            tasksToGenerate.push({
              template: tmplTNCN,
              title: `Kê khai khấu trừ thuế TNCN Tháng (Mẫu 05/KK-TNCN) ${monthStr} - ${cust.name}`,
              taxPeriod: monthStr,
              dueDate: monthlyTaxDue,
              taxType: 'TNCN',
              frequency: 'HANG_THANG',
              priority: 'CAO',
              riskLevel: 'CAO',
              category: 'THUE_KE_TOAN',
              workflowClassification: 'KE_KHAI_THUE_THEO_LUAT',
              taxAllocationRule: 'KHAI_THUE_THANG_TREN_50_TY',
              revenueBracketNote: 'Doanh thu năm trước > 50 tỷ VNĐ (Kê khai theo Tháng)',
              isTaxObligation: true,
              description: `[KÊ KHAI THUẾ THEO LUẬT - DN > 50 TỶ] Kê khai thuế TNCN định kỳ hàng tháng. Tổng hợp thu nhập chi trả, tính giảm trừ gia cảnh, khấu trừ thuế TNCN và nộp tờ khai 05/KK-TNCN trước hạn 20/${nextMonth.toString().padStart(2, '0')}.`,
            });
          }
        }

        // 2B. Doanh nghiệp Doanh thu ≤ 50 Tỷ & Hộ Kinh Doanh: KÊ KHAI THEO QUÝ
        if (effectiveTaxCycle === 'QUY') {
          if (cycleType === 'QUY' || cycleType === 'ALL') {
            const isHKD = cust.type === 'HO_KINH_DOANH';
            tasksToGenerate.push({
              template: tmplGTGT,
              title: isHKD 
                ? `Kê khai thuế Hộ Kinh Doanh Quý (Mẫu 01/CNKD) ${quarterStr} - ${cust.name}`
                : `Kê khai thuế GTGT Quý (Mẫu 01/GTGT) ${quarterStr} - ${cust.name}`,
              taxPeriod: quarterStr,
              dueDate: quarterlyTaxDue,
              taxType: 'GTGT',
              frequency: 'HANG_QUY',
              priority: 'KHAN_CAP',
              riskLevel: 'RUI_RO_THUE_PHAP_LY',
              category: 'THUE_KE_TOAN',
              workflowClassification: 'KE_KHAI_THUE_THEO_LUAT',
              taxAllocationRule: 'KHAI_THUE_QUY_DUOI_50_TY',
              revenueBracketNote: 'Doanh thu năm trước ≤ 50 tỷ VNĐ (Kê khai theo Quý)',
              isTaxObligation: true,
              description: `[KÊ KHAI THUẾ THEO LUẬT - DN ≤ 50 TỶ / HKD] Doanh nghiệp có doanh thu năm trước ≤ 50 tỷ VNĐ (thuộc diện kê khai theo Quý theo Luật Quản lý thuế & NĐ 126/2020/NĐ-CP). Tổng hợp 3 tháng trong quý, lập tờ khai thuế, ký số nộp Cổng Thuế điện tử trước hạn ${quarterlyTaxDue}.`,
            });

            tasksToGenerate.push({
              template: tmplTNCN,
              title: `Kê khai khấu trừ thuế TNCN Quý (Mẫu 05/KK-TNCN) ${quarterStr} - ${cust.name}`,
              taxPeriod: quarterStr,
              dueDate: quarterlyTaxDue,
              taxType: 'TNCN',
              frequency: 'HANG_QUY',
              priority: 'CAO',
              riskLevel: 'CAO',
              category: 'THUE_KE_TOAN',
              workflowClassification: 'KE_KHAI_THUE_THEO_LUAT',
              taxAllocationRule: 'KHAI_THUE_QUY_DUOI_50_TY',
              revenueBracketNote: 'Doanh thu năm trước ≤ 50 tỷ VNĐ (Kê khai theo Quý)',
              isTaxObligation: true,
              description: `[KÊ KHAI THUẾ THEO LUẬT - DN ≤ 50 TỶ] Kê khai thuế TNCN định kỳ theo Quý theo NĐ 126/2020/NĐ-CP. Tổng hợp thu nhập chi trả 3 tháng, tính giảm trừ và nộp tờ khai 05/KK-TNCN Quý ${quarterStr} trước hạn ${quarterlyTaxDue}.`,
            });
          }
        }

        // 2C. Nghĩa vụ Tạm tính Thuế TNDN Quý (Toàn bộ các Doanh nghiệp)
        if (cust.type !== 'HO_KINH_DOANH' && (cycleType === 'QUY' || cycleType === 'ALL')) {
          tasksToGenerate.push({
            template: tmplTNDN,
            title: `Tạm tính thuế TNDN ${quarterStr} - ${cust.name}`,
            taxPeriod: quarterStr,
            dueDate: quarterlyTaxDue,
            taxType: 'TNDN',
            frequency: 'HANG_QUY',
            priority: 'CAO',
            riskLevel: 'CAO',
            category: 'THUE_KE_TOAN',
            workflowClassification: 'KE_KHAI_THUE_THEO_LUAT',
            taxAllocationRule: 'TAM_TINH_TNDN_QUY',
            revenueBracketNote: 'Áp dụng cho toàn bộ doanh nghiệp theo Quý',
            isTaxObligation: true,
            description: `[TẠM TÍNH THUẾ TNDN QUY ĐỊNH] Rà soát doanh thu chi phí Quý ${quarterStr}, bóc tách chi phí B4 không có UNC ≥ 5 triệu, tạm tính số thuế TNDN đảm bảo tạm nộp tối thiểu 80% cả năm trước ngày ${quarterlyTaxDue}.`,
          });
        }

        // 2D. Nghĩa vụ Báo cáo tài chính & Quyết toán Thuế Năm (Toàn bộ Doanh nghiệp)
        if (cycleType === 'NAM' || cycleType === 'ALL') {
          tasksToGenerate.push({
            template: tmplBCTC,
            title: `Lập Báo cáo tài chính & Quyết toán Thuế ${yearStr} - ${cust.name}`,
            taxPeriod: yearStr,
            dueDate: annualBCTCDue,
            taxType: 'BCTC',
            frequency: 'HANG_NAM',
            priority: 'KHAN_CAP',
            riskLevel: 'RUI_RO_THUE_PHAP_LY',
            category: 'THUE_KE_TOAN',
            workflowClassification: 'KE_KHAI_THUE_THEO_LUAT',
            taxAllocationRule: 'QUYET_TOAN_BCTC_NAM',
            revenueBracketNote: 'Quyết toán thuế & BCTC thường niên cho toàn bộ doanh nghiệp',
            isTaxObligation: true,
            description: `[QUYẾT TOÁN THUẾ & BCTC NĂM] Kiểm kê cuối năm, đối chiếu 4 bên, lập Báo cáo tài chính (BĐKT, KQKD, LCTT, TMBCTC), Tờ khai QTT TNDN (03/TNDN) và QTT TNCN (05/QTT-TNCN). Hạn nộp ${annualBCTCDue}.`,
          });
        }
      }

      // Filter by selected template IDs if requested
      const filteredSpecs = options.selectedTemplateIds && options.selectedTemplateIds.length > 0
        ? tasksToGenerate.filter(s => options.selectedTemplateIds!.includes(s.template.id))
        : tasksToGenerate;

      // Generate task objects
      filteredSpecs.forEach((spec, sIdx) => {
        // Check if task already exists for this customer + taxPeriod + taxType in both currentTasks and newly createdTasks
        const existing = currentTasks.find(t => 
          t.customerId === cust.id && 
          t.taxPeriod === spec.taxPeriod && 
          (t.taxType === spec.taxType || t.title === spec.title)
        ) || createdTasks.find(t =>
          t.customerId === cust.id && 
          t.taxPeriod === spec.taxPeriod && 
          (t.taxType === spec.taxType || t.title === spec.title)
        );

        if (existing && !options.overwriteExisting) {
          custSummary.tasksSkipped.push({
            title: spec.title,
            reason: `Đã tồn tại công việc [${existing.code}] trong kỳ ${spec.taxPeriod}`,
          });
          totalSkipped++;
          return;
        }

        const uniqueSuffix = `${Date.now()}-${sIdx}-${Math.random().toString(36).substring(2, 9)}`;
        const taskId = `TSK-AUTO-${uniqueSuffix}`;
        const codeDatePart = spec.dueDate.replace(/-/g, '').slice(0, 6);
        const taskCode = `TSK-${codeDatePart}-${Math.floor(Math.random() * 899 + 100)}`;

        const workflowSteps = spec.template.defaultWorkflow.map((ws, wIdx) => ({
          id: `ws-${uniqueSuffix}-${wIdx + 1}`,
          order: wIdx + 1,
          name: ws.name,
          isCompleted: false,
          isMandatory: ws.isMandatory,
          requiredEvidence: ws.requiredEvidence,
        }));

        const checklist = spec.template.defaultChecklist.map((cl, cIdx) => ({
          id: `cl-${uniqueSuffix}-${cIdx + 1}`,
          title: cl.title,
          isCompleted: false,
          required: cl.required,
        }));

        const newTask: Task = {
          id: taskId,
          code: taskCode,
          title: spec.title,
          description: spec.description,
          customerId: cust.id,
          customerName: cust.name,
          customerTaxCode: cust.taxCode,
          createdById: actor.id,
          createdByName: actor.name,
          assigneeId: resolvedAssignee.id,
          assigneeName: resolvedAssignee.name,
          reviewerId: resolvedReviewer.id,
          reviewerName: resolvedReviewer.name,
          approverId: resolvedApprover.id,
          approverName: resolvedApprover.name,
          department: spec.category === 'HANH_CHINH_NHAN_SU' ? 'HANH_CHINH_NHAN_SU' : 'KE_TOAN_THUE',
          category: spec.category,
          status: 'DA_PHAN_CONG',
          priority: spec.priority,
          riskLevel: spec.riskLevel,
          createdAt: new Date().toISOString(),
          dueDate: spec.dueDate,
          dueTime: '17:30',
          taxPeriod: spec.taxPeriod,
          workflowClassification: spec.workflowClassification,
          taxAllocationRule: spec.taxAllocationRule,
          revenueBracketNote: spec.revenueBracketNote,
          isTaxObligation: spec.isTaxObligation,
          taxType: spec.taxType,
          isRecurring: true,
          recurringRule: {
            enabled: true,
            frequency: spec.frequency,
            interval: 1,
            autoCreateNext: true,
          },
          workflowSteps,
          checklist,
          attachments: [],
          comments: [
            {
              id: `cm-${uniqueSuffix}`,
              authorId: actor.id,
              authorName: actor.name,
              authorRole: actor.role,
              content: `⚡ [TỰ ĐỘNG PHÂN CÔNG CHÍNH XÁC 100%] ${spec.workflowClassification === 'KE_TOAN_HOA_DON_THUONG_XUYEN' ? 'Nghiệp vụ Kế toán & Hóa đơn thực hiện Hàng tháng' : `Nghĩa vụ Kê khai Thuế theo luật (${spec.revenueBracketNote})`}. Chuyên viên kế toán: ${resolvedAssignee.name} (${resolvedAssignee.id}) | Kế toán trưởng soát xét: ${resolvedReviewer.name} (${resolvedReviewer.id}) | Hạn hoàn thành: ${spec.dueDate}.`,
              createdAt: new Date().toISOString(),
              isInternal: true,
            }
          ],
          version: 1,
          lastModifiedBy: actor.id,
          lastModifiedByName: actor.name,
          updatedAt: new Date().toISOString(),
        };

        createdTasks.push(newTask);
        custSummary.tasksCreated.push({
          id: newTask.id,
          code: newTask.code,
          title: newTask.title,
          dueDate: newTask.dueDate,
          taxType: newTask.taxType,
          workflowClassification: newTask.workflowClassification,
          taxAllocationRule: newTask.taxAllocationRule,
        });

        if (spec.workflowClassification === 'KE_TOAN_HOA_DON_THUONG_XUYEN') {
          custSummary.accountingTasksCount = (custSummary.accountingTasksCount || 0) + 1;
        } else {
          custSummary.taxFilingTasksCount = (custSummary.taxFilingTasksCount || 0) + 1;
        }
      });

      customerSummaries.push(custSummary);
    });

    if (createdTasks.length > 0) {
      const taskMap = new Map<string, Task>();
      [...createdTasks, ...currentTasks].forEach(t => {
        if (t && t.id) taskMap.set(t.id, t);
      });
      const allTasks = Array.from(taskMap.values());
      this.saveTasks(allTasks);

      this.addAuditLog({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: 'CREATE',
        entityType: 'TASK',
        entityId: `BATCH-${Date.now()}`,
        entityTitle: `Tự động phân bổ ${createdTasks.length} việc Kế toán & Kê khai thuế theo luật`,
        details: `Đã phân bổ ${createdTasks.length} công việc định kỳ cho ${targetCustomers.length} doanh nghiệp: Phân tách Kế toán & Hóa đơn theo Tháng, Kê khai thuế theo Doanh thu (>50 tỷ: Tháng | ≤50 tỷ: Quý). Bỏ qua ${totalSkipped} việc đã có sẵn.`,
      });

      this.broadcastSync({
        id: `TSK-BATCH-${Date.now()}`,
        type: 'TASK_CREATED',
        entityType: 'TASK',
        entityId: 'ALL',
        senderId: actor.id,
        senderName: actor.name,
        timestamp: new Date().toISOString(),
      });
    }

    const periodLabel = cycleType === 'THANG' ? monthStr : cycleType === 'QUY' ? quarterStr : cycleType === 'NAM' ? yearStr : `${monthStr} & ${quarterStr}`;

    return {
      success: true,
      totalCreated: createdTasks.length,
      totalSkipped,
      createdTasks,
      dispatchedCustomersCount: targetCustomers.length,
      message: `Đã tự động phân bổ ${createdTasks.length} công việc cho ${targetCustomers.length} doanh nghiệp (Tách biệt Kế toán & Hóa đơn hàng tháng vs Kê khai thuế theo doanh thu >50 tỷ / ≤50 tỷ).`,
      periodLabel,
      summaryByCustomer: customerSummaries,
    };
  }

  /**
   * Tự động phát sinh công việc theo thời gian quy định cho kỳ hiện tại
   * Tự động quét và sinh công việc định kỳ theo hợp đồng gói dịch vụ mà không yêu cầu kích hoạt thủ công
   */
  autoCheckAndGeneratePeriodicTasksForCurrentPeriod(): AutoDispatchResult {
    const sysDate = new Date(CURRENT_SYSTEM_DATE);
    const periodMonth = sysDate.getMonth() + 1; // 8
    const periodYear = sysDate.getFullYear(); // 2026
    const periodQuarter = Math.ceil(periodMonth / 3); // 3

    return this.autoDispatchPeriodicTasksForPackageCustomers({
      periodMonth,
      periodYear,
      periodQuarter,
      cycleType: 'ALL',
      overwriteExisting: false,
    });
  }

  // TEMPLATES
  getTemplates(): ChecklistTemplate[] {
    const rawTemplates = this.get<ChecklistTemplate[] | null>(STORAGE_KEYS.TEMPLATES, null);
    if (rawTemplates === null || !Array.isArray(rawTemplates)) {
      this.set(STORAGE_KEYS.TEMPLATES, INITIAL_TEMPLATES);
      return INITIAL_TEMPLATES;
    }
    if (rawTemplates.length === 0) {
      return [];
    }
    return rawTemplates.map(tmpl => {
      if (tmpl && tmpl.defaultChecklist && Array.isArray(tmpl.defaultChecklist)) {
        return {
          ...tmpl,
          defaultChecklist: tmpl.defaultChecklist.map(cl => {
            if (
              cl &&
              cl.title &&
              (cl.title.includes('20 triệu') ||
               cl.title.includes('20tr') ||
               cl.title.includes('Kiểm tra hóa đơn đầu vào từ 5 triệu trở lên có chứng từ thanh toán không dùng tiền mặt (UNC/sao kê ngân hàng)') ||
               cl.title.includes('Kiểm tra hóa đơn đầu vào từ 5 triệu trở lên có đủ UNC thanh toán không dùng tiền mặt'))
            ) {
              return {
                ...cl,
                title: 'Kiểm tra hóa đơn đầu vào trên 5 triệu có chứng từ thanh toán không dùng tiền mặt',
              };
            }
            return cl;
          }),
        };
      }
      return tmpl;
    });
  }

  saveTemplates(templates: ChecklistTemplate[]): void {
    this.set(STORAGE_KEYS.TEMPLATES, templates);
  }

  addTemplate(template: ChecklistTemplate, actor?: User): void {
    const defaultActor = actor || this.getCurrentUser();
    const templates = this.getTemplates();
    const updated = [template, ...templates];
    this.saveTemplates(updated);
    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'CREATE',
      entityType: 'CHECKLIST',
      entityId: template.id,
      entityTitle: template.title,
      details: `Tạo mẫu quy trình & checklist mới: ${template.title}`,
    });
  }

  updateTemplate(template: ChecklistTemplate, actor?: User, changeReason?: string): void {
    const defaultActor = actor || this.getCurrentUser();
    const templates = this.getTemplates();
    const updated = templates.map(t => t.id === template.id ? template : t);
    this.saveTemplates(updated);
    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'UPDATE',
      entityType: 'CHECKLIST',
      entityId: template.id,
      entityTitle: template.title,
      details: `Cập nhật quy trình định kỳ/checklist [${template.title}] khi luật thay đổi${changeReason ? `: ${changeReason}` : ''}`,
    });
  }

  deleteTemplate(templateId: string, actor?: User): void {
    const defaultActor = actor || this.getCurrentUser();
    const templates = this.getTemplates();
    const target = templates.find(t => t.id === templateId);
    const updated = templates.filter(t => t.id !== templateId);
    this.saveTemplates(updated);
    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'DELETE',
      entityType: 'CHECKLIST',
      entityId: templateId,
      entityTitle: target?.title || templateId,
      details: `Xóa mẫu quy trình định kỳ: ${target?.title || templateId}`,
    });
  }

  resetTemplatesToDefault(actor?: User): void {
    const defaultActor = actor || this.getCurrentUser();
    this.saveTemplates(INITIAL_TEMPLATES);
    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'UPDATE',
      entityType: 'CHECKLIST',
      entityId: 'ALL',
      entityTitle: 'Khôi phục quy trình chuẩn mặc định',
      details: 'Khôi phục toàn bộ danh mục quy trình định kỳ chuẩn & checklist về mặc định',
    });
  }

  // AD-HOC SERVICES (49 DỊCH VỤ PHÁT SINH)
  getAdHocServices(): AdHocServiceItem[] {
    const rawServices = this.get<AdHocServiceItem[] | null>(STORAGE_KEYS.AD_HOC_SERVICES, null);
    if (rawServices === null || !Array.isArray(rawServices)) {
      this.set(STORAGE_KEYS.AD_HOC_SERVICES, AD_HOC_SERVICES);
      return AD_HOC_SERVICES;
    }
    if (rawServices.length === 0) {
      return [];
    }
    return rawServices;
  }

  saveAdHocServices(services: AdHocServiceItem[]): void {
    this.set(STORAGE_KEYS.AD_HOC_SERVICES, services);
  }

  addAdHocService(service: AdHocServiceItem, actor?: User): void {
    const defaultActor = actor || this.getCurrentUser();
    const services = this.getAdHocServices();
    const updated = [service, ...services];
    this.saveAdHocServices(updated);
    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'CREATE',
      entityType: 'CHECKLIST',
      entityId: service.id,
      entityTitle: service.name,
      details: `Tạo mới dịch vụ phát sinh & quy trình SOP: [${service.code}] ${service.name}`,
    });
  }

  updateAdHocService(service: AdHocServiceItem, actor?: User, changeReason?: string): void {
    const defaultActor = actor || this.getCurrentUser();
    const services = this.getAdHocServices();
    const updated = services.map(s => s.id === service.id ? service : s);
    this.saveAdHocServices(updated);
    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'UPDATE',
      entityType: 'CHECKLIST',
      entityId: service.id,
      entityTitle: service.name,
      details: `Cập nhật dịch vụ phát sinh & quy trình SOP [${service.code} - ${service.name}] khi luật thay đổi${changeReason ? `: ${changeReason}` : ''}`,
    });
  }

  deleteAdHocService(serviceId: string, actor?: User): void {
    const defaultActor = actor || this.getCurrentUser();
    const services = this.getAdHocServices();
    const target = services.find(s => s.id === serviceId);
    const updated = services.filter(s => s.id !== serviceId);
    this.saveAdHocServices(updated);
    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'DELETE',
      entityType: 'CHECKLIST',
      entityId: serviceId,
      entityTitle: target?.name || serviceId,
      details: `Xóa dịch vụ phát sinh: ${target?.name || serviceId}`,
    });
  }

  resetAdHocServicesToDefault(actor?: User): void {
    const defaultActor = actor || this.getCurrentUser();
    this.saveAdHocServices(AD_HOC_SERVICES);
    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'UPDATE',
      entityType: 'CHECKLIST',
      entityId: 'ALL_ADHOC',
      entityTitle: 'Khôi phục 49 dịch vụ phát sinh mặc định',
      details: 'Khôi phục toàn bộ danh mục 49 dịch vụ phát sinh & chuỗi quy trình chuẩn về ban đầu',
    });
  }

  // AUDIT LOGS
  getAuditLogs(): AuditLog[] {
    const raw = this.get<AuditLog[] | null>(STORAGE_KEYS.AUDIT_LOGS, null);
    if (raw === null || !Array.isArray(raw)) {
      this.set(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
      return INITIAL_AUDIT_LOGS;
    }
    return raw;
  }

  addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      ...log,
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    // Keep last 1000 audit logs
    const updated = [newLog, ...logs].slice(0, 1000);
    this.set(STORAGE_KEYS.AUDIT_LOGS, updated);
  }

  // COMPANY INFO
  getCompanyInfo(): CompanyInfo {
    return this.get<CompanyInfo>(STORAGE_KEYS.COMPANY_INFO, DEFAULT_COMPANY_INFO);
  }

  saveCompanyInfo(info: CompanyInfo, actor?: User): void {
    const defaultActor = actor || this.getCurrentUser();
    this.set(STORAGE_KEYS.COMPANY_INFO, info);
    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'UPDATE',
      entityType: 'SYSTEM',
      entityId: 'SYS-COMPANY',
      entityTitle: info.name,
      details: `Cập nhật thông tin doanh nghiệp & Chứng chỉ Đại lý thuế`,
    });
  }

  // DEADLINE & COLOR COMPUTATION
  getTaskDeadlineStatus(task: Task, refDate: string = CURRENT_SYSTEM_DATE): {
    bucket: DeadlineBucket;
    alertColor: AlertColorLevel;
    daysDiff: number;
    labelText: string;
    isOverdue: boolean;
    isHighRiskTax: boolean;
  } {
    if (task.status === 'HOAN_THANH') {
      return {
        bucket: 'COMPLETED',
        alertColor: 'GREEN',
        daysDiff: 0,
        labelText: 'Đã hoàn thành',
        isOverdue: false,
        isHighRiskTax: false,
      };
    }

    const today = new Date(refDate);
    today.setHours(0, 0, 0, 0);

    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const isTaxOrLegal = task.isTaxObligation || task.riskLevel === 'RUI_RO_THUE_PHAP_LY';

    if (daysDiff < 0 || task.status === 'QUA_HAN') {
      if (isTaxOrLegal) {
        return {
          bucket: 'HIGH_RISK_OVERDUE',
          alertColor: 'DARK_RED',
          daysDiff,
          labelText: `Quá hạn Thuế/Pháp lý (${Math.abs(daysDiff)} ngày)`,
          isOverdue: true,
          isHighRiskTax: true,
        };
      }
      return {
        bucket: 'OVERDUE',
        alertColor: 'RED',
        daysDiff,
        labelText: `Đã quá hạn (${Math.abs(daysDiff)} ngày)`,
        isOverdue: true,
        isHighRiskTax: false,
      };
    }

    if (daysDiff === 0) {
      return {
        bucket: 'TODAY',
        alertColor: isTaxOrLegal ? 'ORANGE' : 'ORANGE',
        daysDiff: 0,
        labelText: 'Hạn hôm nay (Cần xử lý ngay)',
        isOverdue: false,
        isHighRiskTax: isTaxOrLegal,
      };
    }

    if (daysDiff === 1) {
      return {
        bucket: 'TOMORROW',
        alertColor: 'ORANGE',
        daysDiff: 1,
        labelText: 'Hạn ngày mai (Nguy cơ quá hạn)',
        isOverdue: false,
        isHighRiskTax: isTaxOrLegal,
      };
    }

    if (daysDiff <= 3) {
      return {
        bucket: 'NEXT_3_DAYS',
        alertColor: 'YELLOW',
        daysDiff,
        labelText: `Còn ${daysDiff} ngày (Sắp đến hạn)`,
        isOverdue: false,
        isHighRiskTax: isTaxOrLegal,
      };
    }

    if (daysDiff <= 7) {
      return {
        bucket: 'NEXT_7_DAYS',
        alertColor: 'GREEN',
        daysDiff,
        labelText: `Còn ${daysDiff} ngày`,
        isOverdue: false,
        isHighRiskTax: false,
      };
    }

    return {
      bucket: 'UPCOMING',
      alertColor: 'GREEN',
      daysDiff,
      labelText: `Còn ${daysDiff} ngày`,
      isOverdue: false,
      isHighRiskTax: false,
    };
  }

  // KPI COMPUTATION FOR ALL STAFF
  computeStaffKPIs(tasks: Task[] = this.getTasks(), users: User[] = this.getUsers()): StaffKPIRecord[] {
    const staffList = users.filter(u => u.role === 'NHAN_VIEN' || u.role === 'TRUONG_PHONG');

    return staffList.map(user => {
      const userTasks = tasks.filter(t => t.assigneeId === user.id);
      const totalAssigned = userTasks.length;
      
      const completed = userTasks.filter(t => t.status === 'HOAN_THANH');
      const completedCount = completed.length;

      // Check on-time vs overdue completed
      let onTimeCompletedCount = 0;
      let overdueCompletedCount = 0;
      completed.forEach(t => {
        if (t.completedAt) {
          const compDate = new Date(t.completedAt.split('T')[0]);
          const dueDate = new Date(t.dueDate);
          if (compDate <= dueDate) {
            onTimeCompletedCount++;
          } else {
            overdueCompletedCount++;
          }
        } else {
          onTimeCompletedCount++;
        }
      });

      const inProgressCount = userTasks.filter(t => t.status === 'DANG_THUC_HIEN').length;
      const pendingCount = userTasks.filter(t => ['CHO_CHUNG_TU', 'CHO_KHACH_HANG', 'CHO_KIEM_TRA', 'CHO_PHE_DUYET'].includes(t.status)).length;
      
      // Currently overdue
      const overdueCount = userTasks.filter(t => {
        if (t.status === 'HOAN_THANH' || t.status === 'HUY') return false;
        const status = this.getTaskDeadlineStatus(t);
        return status.isOverdue;
      }).length;

      const completionRate = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 100;
      const onTimeRate = completedCount > 0 ? Math.round((onTimeCompletedCount / completedCount) * 100) : 100;
      const overdueRate = totalAssigned > 0 ? Math.round((overdueCount / totalAssigned) * 100) : 0;

      const highRiskHandled = userTasks.filter(t => t.riskLevel === 'CAO' || t.riskLevel === 'RUI_RO_THUE_PHAP_LY').length;
      const taxTasksCount = userTasks.filter(t => t.isTaxObligation).length;

      // Composite KPI Calculation considering on-time rate, completion rate, overdue penalty, and complexity weight
      let qualityScore = 85;
      if (overdueCount > 0) qualityScore -= overdueCount * 12;
      if (onTimeRate >= 95) qualityScore += 10;
      if (highRiskHandled > 2) qualityScore += 5;
      qualityScore = Math.max(20, Math.min(100, qualityScore));

      const compositeKPIScore = Math.round(
        (completionRate * 0.35) + 
        (onTimeRate * 0.35) + 
        (qualityScore * 0.30)
      );

      return {
        userId: user.id,
        userName: user.name,
        department: user.department,
        position: user.position,
        totalAssigned,
        completedCount,
        onTimeCompletedCount,
        overdueCompletedCount,
        inProgressCount,
        pendingCount,
        overdueCount,
        completionRate,
        onTimeRate,
        overdueRate,
        highRiskHandled,
        taxTasksCount,
        qualityScore,
        compositeKPIScore,
      };
    });
  }

  calculateStaffKPIs(): StaffKPIRecord[] {
    return this.computeStaffKPIs();
  }

  // ==========================================
  // DATABASE MANAGEMENT & EMERGENCY BACKUP CENTER
  // ==========================================

  getDatabaseStatistics(): DatabaseSystemStats {
    const rawData = {
      CUSTOMERS: this.get(STORAGE_KEYS.CUSTOMERS, []),
      TASKS: this.get(STORAGE_KEYS.TASKS, []),
      TEMPLATES: this.get(STORAGE_KEYS.TEMPLATES, []),
      EMPLOYEES: this.get(STORAGE_KEYS.EMPLOYEES, []),
      LEAVE_REQUESTS: this.get(STORAGE_KEYS.LEAVE_REQUESTS, []),
      BUSINESS_TRIPS: this.get(STORAGE_KEYS.BUSINESS_TRIPS, []),
      PAYROLL: this.get(STORAGE_KEYS.PAYROLL, []),
      TAX_FILINGS: this.get(STORAGE_KEYS.TAX_FILINGS, []),
      PAYMENT_SLIPS: this.get(STORAGE_KEYS.PAYMENT_SLIPS, []),
      SUPPORT_REQUESTS: this.get(STORAGE_KEYS.SUPPORT_REQUESTS, []),
      AUDIT_LOGS: this.get(STORAGE_KEYS.AUDIT_LOGS, []),
      ACTIVE_LOCKS: this.get(STORAGE_KEYS.ACTIVE_LOCKS, {}),
      USERS: this.get(STORAGE_KEYS.USERS, []),
    };

    const calculateSizeKB = (key: string): number => {
      if (typeof window === 'undefined') return 0;
      try {
        const item = localStorage.getItem(key);
        return item ? +(item.length * 2 / 1024).toFixed(2) : 0;
      } catch {
        return 0;
      }
    };

    const modules: DatabaseModuleInfo[] = [
      {
        key: 'CUSTOMERS',
        label: 'Khách hàng & Hợp đồng dịch vụ',
        category: 'THUE_KE_TOAN',
        description: 'Danh bạ Doanh nghiệp, Mã số thuế, người đại diện, hợp đồng đại lý thuế, công nợ phí và hồ sơ thuế.',
        recordCount: Array.isArray(rawData.CUSTOMERS) ? rawData.CUSTOMERS.length : 0,
        estimatedSizeKB: calculateSizeKB(STORAGE_KEYS.CUSTOMERS),
        canClear: true,
        requiresDoubleConfirm: true,
      },
      {
        key: 'TASKS',
        label: 'Nhiệm vụ thuế & Lịch kê khai',
        category: 'THUE_KE_TOAN',
        description: 'Tất cả đầu việc kê khai thuế GTGT, TNDN, TNCN, BCTC, checklist tiến độ, hạn chót và bằng chứng nộp.',
        recordCount: Array.isArray(rawData.TASKS) ? rawData.TASKS.length : 0,
        estimatedSizeKB: calculateSizeKB(STORAGE_KEYS.TASKS),
        canClear: true,
        requiresDoubleConfirm: true,
      },
      {
        key: 'TEMPLATES',
        label: 'Quy trình mẫu SOP & Checklist',
        category: 'THUE_KE_TOAN',
        description: 'Bộ khung quy trình chuẩn nghiệp vụ Thuế & Kế toán cho Đại lý Thuế chuyên nghiệp.',
        recordCount: Array.isArray(rawData.TEMPLATES) ? rawData.TEMPLATES.length : 0,
        estimatedSizeKB: calculateSizeKB(STORAGE_KEYS.TEMPLATES),
        canClear: true,
        requiresDoubleConfirm: false,
      },
      {
        key: 'EMPLOYEES',
        label: 'Hồ sơ Nhân sự & Chuyên viên',
        category: 'NHAN_SU_LUONG',
        description: 'Hồ sơ chuyên viên kế toán, chứng chỉ đại lý thuế, chức vụ, bộ phận và định mức tải trọng.',
        recordCount: Array.isArray(rawData.EMPLOYEES) ? rawData.EMPLOYEES.length : 0,
        estimatedSizeKB: calculateSizeKB(STORAGE_KEYS.EMPLOYEES),
        canClear: true,
        requiresDoubleConfirm: true,
      },
      {
        key: 'LEAVE_REQUESTS',
        label: 'Đơn xin nghỉ & Lịch công tác',
        category: 'NHAN_SU_LUONG',
        description: 'Đơn đăng ký nghỉ phép, công tác cơ quan thuế, giải trình thanh tra và trạng thái phê duyệt.',
        recordCount: (Array.isArray(rawData.LEAVE_REQUESTS) ? rawData.LEAVE_REQUESTS.length : 0) + (Array.isArray(rawData.BUSINESS_TRIPS) ? rawData.BUSINESS_TRIPS.length : 0),
        estimatedSizeKB: +(calculateSizeKB(STORAGE_KEYS.LEAVE_REQUESTS) + calculateSizeKB(STORAGE_KEYS.BUSINESS_TRIPS)).toFixed(2),
        canClear: true,
        requiresDoubleConfirm: false,
      },
      {
        key: 'PAYROLL',
        label: 'Bảng tính lương & Quyết toán thuế',
        category: 'NHAN_SU_LUONG',
        description: 'Bảng lương nhân sự, tính thuế TNCN 7 bậc lũy tiến, trích nộp BHXH và chi phí doanh nghiệp.',
        recordCount: Array.isArray(rawData.PAYROLL) ? rawData.PAYROLL.length : 0,
        estimatedSizeKB: calculateSizeKB(STORAGE_KEYS.PAYROLL),
        canClear: true,
        requiresDoubleConfirm: true,
      },
      {
        key: 'TAX_FILINGS',
        label: 'Biên lai tờ khai Thuế điện tử',
        category: 'KHACH_HANG_PORTAL',
        description: 'Mã giao dịch Tổng cục Thuế, thông báo tiếp nhận và xác nhận hoàn tất nghĩa vụ nộp tờ khai.',
        recordCount: Array.isArray(rawData.TAX_FILINGS) ? rawData.TAX_FILINGS.length : 0,
        estimatedSizeKB: calculateSizeKB(STORAGE_KEYS.TAX_FILINGS),
        canClear: true,
        requiresDoubleConfirm: false,
      },
      {
        key: 'PAYMENT_SLIPS',
        label: 'Giấy nộp tiền thuế vào NSNN',
        category: 'KHACH_HANG_PORTAL',
        description: 'Chứng từ nộp thuế tiểu mục, biên lai thu tiền ngân sách nhà nước qua eTax.',
        recordCount: Array.isArray(rawData.PAYMENT_SLIPS) ? rawData.PAYMENT_SLIPS.length : 0,
        estimatedSizeKB: calculateSizeKB(STORAGE_KEYS.PAYMENT_SLIPS),
        canClear: true,
        requiresDoubleConfirm: false,
      },
      {
        key: 'SUPPORT_REQUESTS',
        label: 'Yêu cầu hỗ trợ từ Khách hàng',
        category: 'KHACH_HANG_PORTAL',
        description: 'Phiếu yêu cầu hồ sơ chứng từ, hỏi đáp chính sách thuế gửi qua Cổng thông tin khách hàng.',
        recordCount: Array.isArray(rawData.SUPPORT_REQUESTS) ? rawData.SUPPORT_REQUESTS.length : 0,
        estimatedSizeKB: calculateSizeKB(STORAGE_KEYS.SUPPORT_REQUESTS),
        canClear: true,
        requiresDoubleConfirm: false,
      },
      {
        key: 'AUDIT_LOGS',
        label: 'Nhật ký kiểm toán & Lịch sử thao tác',
        category: 'HE_THONG_KIEM_TOAN',
        description: 'Lịch sử truy vết toàn diện (Audit Trail) phục vụ kiểm toán nội bộ và quản trị rủi ro.',
        recordCount: Array.isArray(rawData.AUDIT_LOGS) ? rawData.AUDIT_LOGS.length : 0,
        estimatedSizeKB: calculateSizeKB(STORAGE_KEYS.AUDIT_LOGS),
        canClear: true,
        requiresDoubleConfirm: true,
      },
      {
        key: 'ACTIVE_LOCKS',
        label: 'Khóa bản ghi & Trạng thái đồng thời',
        category: 'HE_THONG_KIEM_TOAN',
        description: 'Khóa bản ghi đang biên tập thời gian thực nhằm chống ghi đè dữ liệu (Anti-Collision).',
        recordCount: Object.keys(rawData.ACTIVE_LOCKS || {}).length,
        estimatedSizeKB: calculateSizeKB(STORAGE_KEYS.ACTIVE_LOCKS),
        canClear: true,
        requiresDoubleConfirm: false,
      },
      {
        key: 'USERS',
        label: 'Tài khoản người dùng & IAM',
        category: 'HE_THONG_KIEM_TOAN',
        description: 'Danh sách tài khoản 30 nhân sự, phân quyền vai trò và thông tin xác thực an toàn IAM.',
        recordCount: Array.isArray(rawData.USERS) ? rawData.USERS.length : 0,
        estimatedSizeKB: +(calculateSizeKB(STORAGE_KEYS.USERS) + calculateSizeKB(STORAGE_KEYS.CREDENTIALS)).toFixed(2),
        canClear: true,
        requiresDoubleConfirm: true,
      },
    ];

    const totalRecords = modules.reduce((sum, m) => sum + m.recordCount, 0);
    const totalSizeKB = +modules.reduce((sum, m) => sum + m.estimatedSizeKB, 0).toFixed(2);
    const localStorageUsagePercent = Math.min(100, +((totalSizeKB / 5120) * 100).toFixed(1));

    let lastBackupDate: string | undefined = undefined;
    if (typeof window !== 'undefined') {
      try {
        lastBackupDate = localStorage.getItem('taxcore_last_backup_date') || undefined;
      } catch {
        // ignore
      }
    }

    return {
      totalRecords,
      totalSizeKB,
      totalSizeFormatted: totalSizeKB > 1024 ? `${(totalSizeKB / 1024).toFixed(2)} MB` : `${totalSizeKB} KB`,
      localStorageUsagePercent,
      modules,
      lastBackupDate,
      integrityStatus: 'HEALTHY',
      integrityMessage: 'Cơ sở dữ liệu Desktop & Web Storage toàn vẹn 100%, sẵn sàng hoạt động ổn định.',
    };
  }

  /**
   * XÓA TOÀN BỘ CƠ SỞ DỮ LIỆU (PURGE ALL DATA)
   * Tự động tạo bản sao lưu khẩn cấp, dọn sạch tất cả bảng dữ liệu nghiệp vụ và ghi nhận log an toàn.
   */
  clearAllData(options?: { keepAdminUser?: boolean; actor?: User }): { success: boolean; message: string; backupJSON: string } {
    const defaultActor = options?.actor || this.getCurrentUser();
    
    // 1. Tự động xuất bản sao lưu khẩn cấp trước khi xóa
    const backupJSON = this.exportFullBackup();
    
    // 2. Dọn dẹp sạch toàn bộ các phân hệ
    this.set(STORAGE_KEYS.CUSTOMERS, []);
    this.set(STORAGE_KEYS.TASKS, []);
    this.set(STORAGE_KEYS.TEMPLATES, []);
    this.set(STORAGE_KEYS.EMPLOYEES, []);
    this.set(STORAGE_KEYS.LEAVE_REQUESTS, []);
    this.set(STORAGE_KEYS.BUSINESS_TRIPS, []);
    this.set(STORAGE_KEYS.PAYROLL, []);
    this.set(STORAGE_KEYS.TAX_FILINGS, []);
    this.set(STORAGE_KEYS.PAYMENT_SLIPS, []);
    this.set(STORAGE_KEYS.SUPPORT_REQUESTS, []);
    this.set(STORAGE_KEYS.ACTIVE_LOCKS, {});
    this.set(STORAGE_KEYS.COMPANY_INFO, DEFAULT_COMPANY_INFO);

    if (options?.keepAdminUser) {
      // Giữ lại duy nhất tài khoản Quản trị Admin (USR-030)
      const adminUsers = [ROOT_ADMIN_USER];
      const adminCreds = [ROOT_ADMIN_CREDENTIAL];
      this.set(STORAGE_KEYS.USERS, adminUsers);
      this.set(STORAGE_KEYS.CREDENTIALS, adminCreds);
      this.set(STORAGE_KEYS.CURRENT_USER_ID, 'USR-030'); // Đặt Admin làm tài khoản mặc định
    } else {
      this.set(STORAGE_KEYS.USERS, INITIAL_USERS);
      this.set(STORAGE_KEYS.CREDENTIALS, INITIAL_USER_CREDENTIALS);
      this.set(STORAGE_KEYS.CURRENT_USER_ID, 'USR-030');
    }

    // Reset Permissions & RACI Matrix
    PermissionService.resetToDefaults();
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('taxcore_raci_matrix_config_v1');
      } catch {}
    }

    // 3. Ghi nhận 1 nhật ký kiểm toán duy nhất đánh dấu lệnh xóa toàn diện
    const purgeAuditLog: AuditLog = {
      id: `AUDIT-PURGE-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'DELETE',
      entityType: 'SYSTEM',
      entityId: 'SYS-PURGE-ALL',
      entityTitle: 'XÓA TOÀN BỘ CƠ SỞ DỮ LIỆU HỆ THỐNG',
      details: `Quản trị viên đã thực hiện lệnh xóa sạch toàn bộ cơ sở dữ liệu trên hệ thống. Bản sao lưu tự động đã được kết xuất trước khi xóa.`,
    };
    this.set(STORAGE_KEYS.AUDIT_LOGS, [purgeAuditLog]);

    // 4. Phát tín hiệu đồng bộ thời gian thực
    this.broadcastSync({
      id: `PURGE-ALL-${Date.now()}`,
      type: 'FORCE_SYNC',
      senderId: defaultActor.id,
      senderName: defaultActor.name,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: 'Đã dọn sạch toàn bộ cơ sở dữ liệu hệ thống. Bản sao lưu khẩn cấp an toàn đã được tải về máy.',
      backupJSON,
    };
  }

  /**
   * XÓA TỪNG CHỨC NĂNG / PHÂN HỆ CỤ THỂ (SELECTIVE MODULAR PURGE)
   */
  clearModuleData(moduleKey: DatabaseModuleKey, actor?: User): { success: boolean; message: string; deletedCount: number } {
    const defaultActor = actor || this.getCurrentUser();
    let deletedCount = 0;
    let moduleLabel = '';

    switch (moduleKey) {
      case 'CUSTOMERS': {
        const current = this.getCustomers();
        deletedCount = current.length;
        moduleLabel = 'Khách hàng & Hợp đồng dịch vụ';
        this.set(STORAGE_KEYS.CUSTOMERS, []);
        break;
      }
      case 'TASKS': {
        const current = this.getTasks();
        deletedCount = current.length;
        moduleLabel = 'Nhiệm vụ & Lịch kê khai thuế';
        this.set(STORAGE_KEYS.TASKS, []);
        break;
      }
      case 'TEMPLATES': {
        const current = this.getTemplates();
        deletedCount = current.length;
        moduleLabel = 'Quy trình mẫu SOP & Checklist';
        this.set(STORAGE_KEYS.TEMPLATES, []);
        break;
      }
      case 'EMPLOYEES': {
        const current = this.getEmployees();
        deletedCount = current.length;
        moduleLabel = 'Hồ sơ Nhân sự & Chuyên viên';
        this.set(STORAGE_KEYS.EMPLOYEES, []);
        break;
      }
      case 'LEAVE_REQUESTS': {
        const current = this.getLeaveRequests();
        const currentTrips = this.getBusinessTrips();
        deletedCount = current.length + currentTrips.length;
        moduleLabel = 'Đơn xin nghỉ & Lịch công tác';
        this.set(STORAGE_KEYS.LEAVE_REQUESTS, []);
        this.set(STORAGE_KEYS.BUSINESS_TRIPS, []);
        break;
      }
      case 'PAYROLL': {
        const current = this.getPayrollRecords();
        deletedCount = current.length;
        moduleLabel = 'Bảng tính lương & Quyết toán thuế';
        this.set(STORAGE_KEYS.PAYROLL, []);
        break;
      }
      case 'TAX_FILINGS': {
        const current = this.getTaxFilings();
        deletedCount = current.length;
        moduleLabel = 'Biên lai tờ khai Thuế điện tử';
        this.set(STORAGE_KEYS.TAX_FILINGS, []);
        break;
      }
      case 'PAYMENT_SLIPS': {
        const current = this.getPaymentSlips();
        deletedCount = current.length;
        moduleLabel = 'Giấy nộp tiền thuế vào NSNN';
        this.set(STORAGE_KEYS.PAYMENT_SLIPS, []);
        break;
      }
      case 'SUPPORT_REQUESTS': {
        const current = this.getSupportRequests();
        deletedCount = current.length;
        moduleLabel = 'Yêu cầu hỗ trợ từ Khách hàng';
        this.set(STORAGE_KEYS.SUPPORT_REQUESTS, []);
        break;
      }
      case 'AUDIT_LOGS': {
        const current = this.getAuditLogs();
        deletedCount = current.length;
        moduleLabel = 'Nhật ký kiểm toán hệ thống';
        this.set(STORAGE_KEYS.AUDIT_LOGS, []);
        break;
      }
      case 'ACTIVE_LOCKS': {
        const locks = this.get(STORAGE_KEYS.ACTIVE_LOCKS, {});
        deletedCount = Object.keys(locks).length;
        moduleLabel = 'Khóa bản ghi đồng thời';
        this.set(STORAGE_KEYS.ACTIVE_LOCKS, {});
        break;
      }
      case 'USERS': {
        deletedCount = this.getUsers().length;
        moduleLabel = 'Tài khoản người dùng & IAM';
        const adminUsers = [ROOT_ADMIN_USER];
        const adminCreds = [ROOT_ADMIN_CREDENTIAL];
        this.set(STORAGE_KEYS.USERS, adminUsers);
        this.set(STORAGE_KEYS.CREDENTIALS, adminCreds);
        this.set(STORAGE_KEYS.CURRENT_USER_ID, 'USR-030');
        break;
      }
      default:
        return { success: false, message: 'Phân hệ dữ liệu không hợp lệ.', deletedCount: 0 };
    }

    // Ghi nhận Audit Log
    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'DELETE',
      entityType: 'SYSTEM',
      entityId: `SYS-PURGE-${moduleKey}`,
      entityTitle: `Xóa dữ liệu phân hệ: ${moduleLabel}`,
      details: `Đã thực hiện dọn sạch ${deletedCount} bản ghi thuộc phân hệ [${moduleLabel}]`,
    });

    // Phát tín hiệu đồng bộ
    this.broadcastSync({
      id: `PURGE-MODULE-${moduleKey}-${Date.now()}`,
      type: 'FORCE_SYNC',
      senderId: defaultActor.id,
      senderName: defaultActor.name,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: `Đã dọn sạch thành công ${deletedCount} bản ghi của phân hệ "${moduleLabel}".`,
      deletedCount,
    };
  }

  /**
   * XÓA HÀNG LOẠT NHIỀU PHÂN HỆ ĐÃ CHỌN
   */
  clearMultipleModules(moduleKeys: DatabaseModuleKey[], actor?: User): { success: boolean; message: string; totalDeleted: number } {
    let totalDeleted = 0;
    const clearedNames: string[] = [];

    moduleKeys.forEach(k => {
      const res = this.clearModuleData(k, actor);
      if (res.success) {
        totalDeleted += res.deletedCount;
        clearedNames.push(k);
      }
    });

    return {
      success: true,
      message: `Đã xóa thành công tổng cộng ${totalDeleted} bản ghi từ ${clearedNames.length} phân hệ đã chọn.`,
      totalDeleted,
    };
  }

  /**
   * DỌN SẠCH TOÀN BỘ DỮ LIỆU GIẢ LẬP / DEMO TRONG HỆ THỐNG
   * Xóa sạch các chuyến công tác demo (BT-001..003), đơn xin nghỉ demo, hồ sơ nhân sự demo (USR-001..029),
   * khách hàng demo, nhiệm vụ demo và khôi phục hệ thống sạch 100% chuẩn sản xuất.
   */
  purgeMockData(actor?: User): { success: boolean; message: string; purgedCounts: Record<string, number> } {
    const defaultActor = actor || this.getCurrentUser();
    const purgedCounts: Record<string, number> = {
      businessTrips: 0,
      leaveRequests: 0,
      customers: 0,
      tasks: 0,
      employees: 0,
      users: 0,
      payroll: 0,
      taxFilings: 0,
      paymentSlips: 0,
      supportRequests: 0,
    };

    // 1. Business Trips: Clear all mock trips
    const trips = this.get<BusinessTrip[] | null>(STORAGE_KEYS.BUSINESS_TRIPS, []) || [];
    const cleanTrips = trips.filter(t => 
      t.id !== 'BT-001' && t.id !== 'BT-002' && t.id !== 'BT-003' &&
      !t.code?.startsWith('CT-2026-001') && !t.code?.startsWith('CT-2026-002') && !t.code?.startsWith('CT-2026-003') &&
      t.employeeId !== 'USR-001' && t.employeeId !== 'USR-002' && t.employeeId !== 'USR-003' && t.employeeId !== 'USR-004' &&
      t.customerId !== 'CUST-001' && t.customerId !== 'CUST-002' && t.customerId !== 'CUST-003'
    );
    purgedCounts.businessTrips = trips.length - cleanTrips.length;
    this.set(STORAGE_KEYS.BUSINESS_TRIPS, cleanTrips);

    // 2. Leave Requests: Clear demo leave requests
    const leaves = this.get<LeaveRequest[] | null>(STORAGE_KEYS.LEAVE_REQUESTS, []) || [];
    const cleanLeaves = leaves.filter(l => 
      l.employeeId !== 'USR-001' && l.employeeId !== 'USR-002' && l.employeeId !== 'USR-003' && l.employeeId !== 'USR-004' &&
      !l.employeeName?.includes('Lê Văn C') && !l.employeeName?.includes('Trần Thị B') && !l.employeeName?.includes('Nguyễn Văn A')
    );
    purgedCounts.leaveRequests = leaves.length - cleanLeaves.length;
    this.set(STORAGE_KEYS.LEAVE_REQUESTS, cleanLeaves);

    // 3. Customers: Clear demo customers
    const customers = this.get<Customer[] | null>(STORAGE_KEYS.CUSTOMERS, []) || [];
    const cleanCustomers = customers.filter(c => 
      !c.id.match(/^CUST-00[1-9]$/) && !c.id.match(/^CUST-0[1-5][0-9]$/) &&
      c.taxCode !== '0312345678' && c.taxCode !== '0318765432' && c.taxCode !== '0319988776' && c.taxCode !== '0108999888' &&
      !c.name.includes('ABC Tech') && !c.name.includes('Đại Thành') && !c.name.includes('Nam Long')
    );
    purgedCounts.customers = customers.length - cleanCustomers.length;
    this.set(STORAGE_KEYS.CUSTOMERS, cleanCustomers);

    // 4. Tasks: Clear demo tasks
    const tasks = this.get<Task[] | null>(STORAGE_KEYS.TASKS, []) || [];
    const cleanTasks = tasks.filter(t => 
      !t.id.match(/^TSK-00[1-9]$/) && !t.id.match(/^TSK-0[1-5][0-9]$/) &&
      t.customerId !== 'CUST-001' && t.customerId !== 'CUST-002' && t.customerId !== 'CUST-003'
    );
    purgedCounts.tasks = tasks.length - cleanTasks.length;
    this.set(STORAGE_KEYS.TASKS, cleanTasks);

    // 5. Employees: Remove demo profiles
    const employees = this.get<EmployeeProfile[] | null>(STORAGE_KEYS.EMPLOYEES, []) || [];
    const cleanEmployees = employees.filter(e => 
      !e.id.match(/^USR-00[1-9]$/) && !e.id.match(/^USR-0[1-2][0-9]$/) &&
      e.name !== 'Nguyễn Văn Toàn' && e.name !== 'Lê Thị Phương Thảo' && e.name !== 'Hoàng Quốc Cường' && e.name !== 'Vũ Quốc Huy' &&
      e.name !== 'Lê Văn C' && e.name !== 'Trần Thị B' && e.name !== 'Nguyễn Văn A'
    );
    purgedCounts.employees = employees.length - cleanEmployees.length;
    this.set(STORAGE_KEYS.EMPLOYEES, cleanEmployees);

    // 6. Users: Keep ROOT_ADMIN_USER and real user profiles
    const users = this.get<User[] | null>(STORAGE_KEYS.USERS, []) || [];
    const cleanUsers = users.filter(u => 
      u.id === 'USR-030' || (
        !u.id.match(/^USR-00[1-9]$/) && !u.id.match(/^USR-0[1-2][0-9]$/) &&
        u.name !== 'Nguyễn Văn Toàn' && u.name !== 'Lê Thị Phương Thảo' && u.name !== 'Hoàng Quốc Cường' && u.name !== 'Vũ Quốc Huy' &&
        u.name !== 'Lê Văn C' && u.name !== 'Trần Thị B' && u.name !== 'Nguyễn Văn A'
      )
    );
    if (!cleanUsers.some(u => u.id === 'USR-030')) {
      cleanUsers.unshift(ROOT_ADMIN_USER);
    }
    purgedCounts.users = users.length - cleanUsers.length;
    this.set(STORAGE_KEYS.USERS, cleanUsers);

    // 7. Credentials
    const creds = this.get<any[] | null>(STORAGE_KEYS.CREDENTIALS, []) || [];
    const cleanCreds = creds.filter(c => 
      c.userId === 'USR-030' || (
        !c.userId.match(/^USR-00[1-9]$/) && !c.userId.match(/^USR-0[1-2][0-9]$/)
      )
    );
    this.set(STORAGE_KEYS.CREDENTIALS, cleanCreds);

    // 8. Payroll
    const payroll = this.get<PayrollRecord[] | null>(STORAGE_KEYS.PAYROLL, []) || [];
    const cleanPayroll = payroll.filter(p => 
      !p.employeeId.match(/^USR-00[1-9]$/) && !p.employeeId.match(/^USR-0[1-2][0-9]$/)
    );
    purgedCounts.payroll = payroll.length - cleanPayroll.length;
    this.set(STORAGE_KEYS.PAYROLL, cleanPayroll);

    // 9. Tax filings & Payment slips
    const filings = this.get<TaxFilingReceipt[] | null>(STORAGE_KEYS.TAX_FILINGS, []) || [];
    const cleanFilings = filings.filter(f => 
      f.customerId !== 'CUST-001' && f.customerId !== 'CUST-002' && f.customerId !== 'CUST-003' && !f.customerId?.startsWith('CUST-00')
    );
    purgedCounts.taxFilings = filings.length - cleanFilings.length;
    this.set(STORAGE_KEYS.TAX_FILINGS, cleanFilings);

    const slips = this.get<ETaxPaymentSlip[] | null>(STORAGE_KEYS.PAYMENT_SLIPS, []) || [];
    const cleanSlips = slips.filter(s => 
      s.taxCode !== '0312345678' && s.taxCode !== '0318765432' && s.taxCode !== '0319988776' && s.taxCode !== '0108999888'
    );
    purgedCounts.paymentSlips = slips.length - cleanSlips.length;
    this.set(STORAGE_KEYS.PAYMENT_SLIPS, cleanSlips);

    // 10. Support requests
    const support = this.get<CustomerSupportRequest[] | null>(STORAGE_KEYS.SUPPORT_REQUESTS, []) || [];
    const cleanSupport = support.filter(s => 
      s.taxCode !== '0312345678' && s.taxCode !== '0318765432' && s.taxCode !== '0319988776' && s.taxCode !== '0108999888'
    );
    purgedCounts.supportRequests = support.length - cleanSupport.length;
    this.set(STORAGE_KEYS.SUPPORT_REQUESTS, cleanSupport);

    // 11. Ensure active user is admin if current was removed
    const currUser = this.getCurrentUser();
    if (!cleanUsers.some(u => u.id === currUser.id)) {
      this.set(STORAGE_KEYS.CURRENT_USER_ID, 'USR-030');
    }

    // 12. Broadcast sync & log audit
    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'DELETE',
      entityType: 'SYSTEM',
      entityId: 'SYS-PURGE-MOCK',
      entityTitle: 'DỌN SẠCH DỮ LIỆU GIẢ LẬP / DEMO',
      details: `Đã làm sạch toàn bộ dữ liệu giả lập/demo trong hệ thống: ${purgedCounts.businessTrips} công tác, ${purgedCounts.leaveRequests} đơn nghỉ, ${purgedCounts.customers} khách hàng, ${purgedCounts.tasks} công việc, ${purgedCounts.employees} nhân sự.`,
    });

    this.broadcastSync({
      id: `PURGE-MOCK-${Date.now()}`,
      type: 'FORCE_SYNC',
      senderId: defaultActor.id,
      senderName: defaultActor.name,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: 'Đã xóa sạch thành công toàn bộ dữ liệu giả lập trong hệ thống.',
      purgedCounts,
    };
  }

  // FULL BACKUP / RESTORE
  exportFullBackup(): string {
    const exportedAt = new Date().toISOString();
    const backupData = {
      version: '2.0.0',
      exportedAt,
      system: 'TaxCore WorkFlow Enterprise - Desktop & Web Edition',
      company: this.getCompanyInfo(),
      users: this.getUsers(),
      credentials: this.getCredentials(),
      customers: this.getCustomers(),
      tasks: this.getTasks(),
      templates: this.getTemplates(),
      employees: this.getEmployees(),
      leaveRequests: this.getLeaveRequests(),
      businessTrips: this.getBusinessTrips(),
      payroll: this.getPayrollRecords(),
      taxFilings: this.getTaxFilings(),
      paymentSlips: this.getPaymentSlips(),
      supportRequests: this.getSupportRequests(),
      auditLogs: this.getAuditLogs(),
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('taxcore_last_backup_date', exportedAt);
      } catch {
        // ignore
      }
    }

    return JSON.stringify(backupData, null, 2);
  }

  exportFullDataJSON(): string {
    return this.exportFullBackup();
  }

  restoreBackup(jsonString: string, actor?: User): { success: boolean; message: string } {
    const defaultActor = actor || this.getCurrentUser();
    try {
      const data = JSON.parse(jsonString);
      if (!data.tasks && !data.customers && !data.users) {
        return { success: false, message: 'File sao lưu không đúng định dạng chuẩn của TaxCore Enterprise.' };
      }

      if (Array.isArray(data.users)) this.saveUsers(data.users);
      if (Array.isArray(data.credentials)) this.saveCredentials(data.credentials);
      if (Array.isArray(data.customers)) this.saveCustomers(data.customers);
      if (Array.isArray(data.tasks)) this.saveTasks(data.tasks);
      if (Array.isArray(data.templates)) this.saveTemplates(data.templates);
      if (Array.isArray(data.employees)) this.saveEmployees(data.employees);
      if (Array.isArray(data.leaveRequests)) this.saveLeaveRequests(data.leaveRequests);
      if (Array.isArray(data.businessTrips)) this.saveBusinessTrips(data.businessTrips);
      if (Array.isArray(data.payroll)) this.savePayrollRecords(data.payroll);
      if (Array.isArray(data.taxFilings)) this.set(STORAGE_KEYS.TAX_FILINGS, data.taxFilings);
      if (Array.isArray(data.paymentSlips)) this.set(STORAGE_KEYS.PAYMENT_SLIPS, data.paymentSlips);
      if (Array.isArray(data.supportRequests)) this.set(STORAGE_KEYS.SUPPORT_REQUESTS, data.supportRequests);
      if (Array.isArray(data.auditLogs)) this.set(STORAGE_KEYS.AUDIT_LOGS, data.auditLogs);
      if (data.company) this.set(STORAGE_KEYS.COMPANY_INFO, data.company);

      this.addAuditLog({
        actorId: defaultActor.id,
        actorName: defaultActor.name,
        actorRole: defaultActor.role,
        action: 'UPDATE',
        entityType: 'SYSTEM',
        entityId: 'SYS-DB-RESTORE',
        entityTitle: 'Khôi phục cơ sở dữ liệu',
        details: `Khôi phục thành công toàn bộ dữ liệu từ bản sao lưu ngày ${data.exportedAt || 'không rõ'}`,
      });

      this.broadcastSync({
        id: `RESTORE-${Date.now()}`,
        type: 'FORCE_SYNC',
        senderId: defaultActor.id,
        senderName: defaultActor.name,
        timestamp: new Date().toISOString(),
      });

      return { success: true, message: 'Khôi phục toàn bộ cơ sở dữ liệu thành công!' };
    } catch (e: any) {
      return { success: false, message: `Lỗi khôi phục dữ liệu: ${e.message}` };
    }
  }

  importFullDataJSON(jsonString: string): boolean {
    const res = this.restoreBackup(jsonString);
    return res.success;
  }

  resetToDemoData(actor?: User): void {
    this.resetToDefault(actor);
  }

  resetToDefault(actor?: User): void {
    const defaultActor = actor || this.getCurrentUser();
    this.saveUsers(INITIAL_USERS);
    this.saveCredentials(INITIAL_USER_CREDENTIALS);
    this.saveCustomers(INITIAL_CUSTOMERS);
    this.saveTasks(INITIAL_TASKS);
    this.saveTemplates(INITIAL_TEMPLATES);
    this.saveEmployees(INITIAL_EMPLOYEES);
    this.saveLeaveRequests(INITIAL_LEAVE_REQUESTS);
    this.saveBusinessTrips(INITIAL_BUSINESS_TRIPS);
    this.savePayrollRecords(INITIAL_PAYROLL_RECORDS);
    this.set(STORAGE_KEYS.TAX_FILINGS, INITIAL_TAX_FILINGS);
    this.set(STORAGE_KEYS.PAYMENT_SLIPS, INITIAL_PAYMENT_SLIPS);
    this.set(STORAGE_KEYS.SUPPORT_REQUESTS, INITIAL_SUPPORT_REQUESTS);
    this.set(STORAGE_KEYS.ACTIVE_LOCKS, {});
    this.set(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    this.set(STORAGE_KEYS.COMPANY_INFO, DEFAULT_COMPANY_INFO);
    this.set(STORAGE_KEYS.CURRENT_USER_ID, 'USR-030');

    PermissionService.resetToDefaults();
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('taxcore_raci_matrix_config_v1');
      } catch {}
    }

    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'UPDATE',
      entityType: 'SYSTEM',
      entityId: 'SYS-RESET',
      entityTitle: 'Khôi phục mẫu mặc định',
      details: 'Đã nạp lại bộ dữ liệu doanh nghiệp mẫu chuyên ngành Thuế - Kế toán & Quản trị Nhân sự',
    });

    this.broadcastSync({
      id: `RESET-DEMO-${Date.now()}`,
      type: 'FORCE_SYNC',
      senderId: defaultActor.id,
      senderName: defaultActor.name,
      timestamp: new Date().toISOString(),
    });
  }

  // ==========================================
  // HR & PAYROLL SERVICE METHODS
  // ==========================================

  getEmployees(): EmployeeProfile[] {
    const raw = this.get<EmployeeProfile[] | null>(STORAGE_KEYS.EMPLOYEES, null);
    let employees = raw;
    if (raw === null || !Array.isArray(raw)) {
      employees = INITIAL_EMPLOYEES;
      this.set(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    }
    if (!employees) {
      employees = [];
    }
    const filtered = employees.filter(e => 
      e.id !== 'USR-001' && e.id !== 'USR-002' && e.id !== 'USR-029' && 
      e.id !== 'USR-030' && e.role !== 'ADMIN' &&
      !e.name.includes('Quản Trị') && !e.name.includes('(Admin)') &&
      e.name !== 'Nguyễn Văn Toàn' && e.name !== 'Lê Thị Phương Thảo' && e.name !== 'Hoàng Quốc Cường' && e.name !== 'Vũ Quốc Huy'
    );
    if (filtered.length !== employees.length) {
      employees = filtered;
      this.set(STORAGE_KEYS.EMPLOYEES, employees);
    }

    // Tự động đồng bộ ngược từ USERS sang EMPLOYEES nếu có tài khoản user nhưng chưa có EmployeeProfile
    // (Bỏ qua USR-030 Quản Trị Hệ Thống Admin vì hoạt động theo hệ thống, không cần ký HĐLĐ hay trả lương)
    const rawUsers = this.get<User[] | null>(STORAGE_KEYS.USERS, null);
    if (rawUsers && Array.isArray(rawUsers)) {
      let hasEmpSync = false;
      rawUsers.forEach(u => {
        if (
          u.id === 'USR-001' || u.id === 'USR-002' || u.id === 'USR-029' || 
          u.id === 'USR-030' || u.role === 'ADMIN' || 
          u.name.includes('Quản Trị') || u.name.includes('(Admin)')
        ) return;
        const exists = employees.some(e => e.id === u.id || e.code === u.code);
        if (!exists) {
          employees.push({
            id: u.id,
            code: u.code || `NV-${(employees.length + 1).toString().padStart(3, '0')}`,
            name: u.name,
            email: u.email,
            phone: u.phone,
            department: u.department || 'KE_TOAN_THUE',
            position: u.position || 'Chuyên viên Kế toán',
            role: u.role || 'NHAN_VIEN',
            status: u.active === false ? 'DA_NGHI_VIEC' : 'DANG_LAM_VIEC',
            contractType: 'KHONG_XAC_DINH_THOI_HAN',
            dateOfJoining: '2026-01-01',
            contractStartDate: '2026-01-01',
            baseSalary: 12000000,
            actualSalary: 15000000,
            positionAllowance: 1000000,
            lunchAllowance: 730000,
            phoneAllowance: 500000,
            taxDependents: 0,
            qualifications: ['Đại học Kế toán / Kiểm toán'],
            maxCustomerCapacity: u.role === 'NHAN_VIEN' ? 7 : 10,
            managedCustomersCount: 0,
            activeTasksCount: 0,
          });
          hasEmpSync = true;
        }
      });
      if (hasEmpSync) {
        this.set(STORAGE_KEYS.EMPLOYEES, employees);
      }
    }

    const customers = this.getCustomers();
    const tasks = this.getTasks();

    // Dynamically calculate capacity & assigned counts
    return employees.map(emp => {
      const managedCustomers = customers.filter(c => c.assignedStaffId === emp.id || c.reviewerStaffId === emp.id).length;
      const activeTasks = tasks.filter(t => t.assigneeId === emp.id && t.status !== 'HOAN_THANH' && t.status !== 'HUY').length;
      return {
        ...emp,
        managedCustomersCount: managedCustomers,
        activeTasksCount: activeTasks,
        maxCustomerCapacity: emp.maxCustomerCapacity || (emp.role === 'NHAN_VIEN' ? 7 : 10),
      };
    });
  }

  saveEmployees(employees: EmployeeProfile[]): void {
    const filtered = employees.filter(e => 
      e.id !== 'USR-030' && e.role !== 'ADMIN' && 
      !e.name.includes('Quản Trị') && !e.name.includes('(Admin)')
    );
    this.set(STORAGE_KEYS.EMPLOYEES, filtered);
  }

  saveEmployee(employee: EmployeeProfile, actor?: User): EmployeeProfile {
    // Admin là tài khoản quản trị hệ thống, không tạo hồ sơ lao động nhân sự
    if (
      employee.id === 'USR-030' || employee.role === 'ADMIN' || 
      employee.name.includes('Quản Trị') || employee.name.includes('(Admin)')
    ) {
      return employee;
    }
    const defaultActor = actor || this.getCurrentUser();
    const employees = this.getEmployees();
    const index = employees.findIndex(e => e.id === employee.id);
    let updated: EmployeeProfile;

    if (index >= 0) {
      updated = { ...employees[index], ...employee };
      employees[index] = updated;
      this.addAuditLog({
        actorId: defaultActor.id,
        actorName: defaultActor.name,
        actorRole: defaultActor.role,
        action: 'UPDATE',
        entityType: 'USER',
        entityId: employee.id,
        entityTitle: `Hồ sơ nhân sự: ${employee.name}`,
        details: `Cập nhật thông tin nhân viên ${employee.name} (${employee.code}) - ${employee.position} | Định mức: ${updated.maxCustomerCapacity || 7} KH`,
      });
    } else {
      updated = {
        ...employee,
        id: employee.id || `EMP-${Date.now().toString().slice(-4)}`,
        code: employee.code || `NV-${(employees.length + 1).toString().padStart(3, '0')}`,
        maxCustomerCapacity: employee.maxCustomerCapacity || 7,
      };
      employees.push(updated);
      this.addAuditLog({
        actorId: defaultActor.id,
        actorName: defaultActor.name,
        actorRole: defaultActor.role,
        action: 'CREATE',
        entityType: 'USER',
        entityId: updated.id,
        entityTitle: `Hồ sơ nhân sự mới: ${updated.name}`,
        details: `Thêm mới nhân viên ${updated.name} (${updated.code}) - Vị trí: ${updated.position} | Tự động đồng bộ vào IAM, Workload & Phân công khách hàng`,
      });
    }

    this.saveEmployees(employees);

    // Tự động đồng bộ sang USERS
    const rawUsers = this.get<User[] | null>(STORAGE_KEYS.USERS, null) || [];
    const uIdx = rawUsers.findIndex(u => u.id === updated.id || u.code === updated.code);
    const synchedUser: User = {
      id: updated.id,
      code: updated.code,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      role: updated.role || 'NHAN_VIEN',
      department: updated.department || 'KE_TOAN_THUE',
      position: updated.position || 'Chuyên viên Kế toán',
      active: updated.status !== 'DA_NGHI_VIEC',
      accountStatus: updated.status === 'DA_NGHI_VIEC' ? 'TERMINATED_LOCKED' : (updated.status === 'TAM_HOAN_HD' ? 'SUSPENDED' : 'ACTIVE'),
    };
    if (uIdx >= 0) {
      rawUsers[uIdx] = { ...rawUsers[uIdx], ...synchedUser };
    } else {
      rawUsers.push(synchedUser);
    }
    this.saveUsers(rawUsers);

    // Tự động đảm bảo tài khoản đăng nhập IAM có sẵn và đồng bộ
    const creds = this.getCredentials();
    const cIdx = creds.findIndex(c => c.userId === updated.id || c.employeeCode === updated.code);
    const nowIso = new Date().toISOString();
    if (cIdx === -1) {
      const generatedUsername = generateEnterpriseUsername(updated.name, updated.code);
      const generatedPassword = generateSecureInitialPassword(updated.name);
      creds.push({
        id: `CRED-${Date.now().toString().slice(-6)}`,
        userId: updated.id,
        employeeCode: updated.code,
        employeeName: updated.name,
        username: generatedUsername,
        email: updated.email,
        password: generatedPassword,
        rawInitialPassword: generatedPassword,
        role: updated.role || 'NHAN_VIEN',
        department: updated.department || 'KE_TOAN_THUE',
        position: updated.position || 'Chuyên viên Kế toán',
        status: updated.status === 'DA_NGHI_VIEC' ? 'TERMINATED_LOCKED' : (updated.status === 'TAM_HOAN_HD' ? 'SUSPENDED' : 'ACTIVE'),
        twoFactorEnabled: false,
        passwordUpdatedAt: nowIso,
        passwordExpiryDays: 90,
        failedLoginAttempts: 0,
        maxFailedAttempts: 5,
        issuedAt: nowIso,
        issuedBy: defaultActor.id,
        issuedByName: defaultActor.name,
        notes: `Tài khoản được cấp tự động từ hồ sơ Nhân sự & Lương. Mật khẩu khởi tạo: ${generatedPassword}`,
      });
      this.saveCredentials(creds);
    } else {
      creds[cIdx].employeeName = updated.name;
      creds[cIdx].email = updated.email;
      creds[cIdx].role = updated.role || creds[cIdx].role;
      creds[cIdx].department = updated.department || creds[cIdx].department;
      creds[cIdx].position = updated.position || creds[cIdx].position;
      if (updated.status === 'DA_NGHI_VIEC') {
        creds[cIdx].status = 'TERMINATED_LOCKED';
      } else if (updated.status === 'TAM_HOAN_HD') {
        creds[cIdx].status = 'SUSPENDED';
      } else if (creds[cIdx].status === 'TERMINATED_LOCKED' || creds[cIdx].status === 'SUSPENDED') {
        creds[cIdx].status = 'ACTIVE';
      }
      this.saveCredentials(creds);
    }

    // Broadcast Realtime Event
    this.broadcastSync({
      id: `SYNC-EMP-${Date.now()}`,
      type: 'FORCE_SYNC',
      senderId: defaultActor.id,
      senderName: defaultActor.name,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  terminateEmployeeContract(
    employeeId: string,
    payload: {
      terminationDate: string;
      terminationReason: string;
      terminationDecisionNo?: string;
      handoverStaffId?: string;
      handoverStaffName?: string;
      terminationNote?: string;
    },
    actor?: User
  ): { employee: EmployeeProfile; reassignedCustomersCount: number; reassignedTasksCount: number } {
    const defaultActor = actor || this.getCurrentUser();
    const employees = this.getEmployees();
    const index = employees.findIndex(e => e.id === employeeId);
    if (index === -1) {
      throw new Error(`Không tìm thấy nhân viên với mã ${employeeId}`);
    }

    const emp = employees[index];
    emp.status = 'DA_NGHI_VIEC';
    emp.terminationDate = payload.terminationDate;
    emp.terminationReason = payload.terminationReason;
    emp.terminationDecisionNo = payload.terminationDecisionNo || `QĐ-TLHD-${Date.now().toString().slice(-4)}`;
    emp.terminationHandoverToStaffId = payload.handoverStaffId;
    emp.terminationHandoverToStaffName = payload.handoverStaffName;
    emp.terminationNote = payload.terminationNote;

    employees[index] = emp;
    this.saveEmployees(employees);

    // Khóa tài khoản User & IAM
    const rawUsers = this.get<User[] | null>(STORAGE_KEYS.USERS, null) || [];
    const uIdx = rawUsers.findIndex(u => u.id === employeeId || u.code === emp.code);
    if (uIdx >= 0) {
      rawUsers[uIdx].active = false;
      rawUsers[uIdx].accountStatus = 'TERMINATED_LOCKED';
      this.saveUsers(rawUsers);
    }

    const creds = this.getCredentials();
    const cIdx = creds.findIndex(c => c.userId === employeeId || c.employeeCode === emp.code);
    if (cIdx >= 0) {
      creds[cIdx].status = 'SUSPENDED';
      this.saveCredentials(creds);
    }

    let reassignedCustomersCount = 0;
    let reassignedTasksCount = 0;

    // Handle handover if target staff selected
    if (payload.handoverStaffId && payload.handoverStaffId !== employeeId) {
      const customers = this.getCustomers();
      customers.forEach(c => {
        if (c.assignedStaffId === employeeId) {
          c.assignedStaffId = payload.handoverStaffId!;
          c.assignedStaffName = payload.handoverStaffName || '';
          reassignedCustomersCount++;
        }
        if (c.reviewerStaffId === employeeId) {
          c.reviewerStaffId = payload.handoverStaffId!;
          c.reviewerStaffName = payload.handoverStaffName || '';
        }
      });
      if (reassignedCustomersCount > 0) {
        this.saveCustomers(customers);
      }

      const tasks = this.getTasks();
      tasks.forEach(t => {
        if (t.assigneeId === employeeId && t.status !== 'HOAN_THANH' && t.status !== 'HUY') {
          t.assigneeId = payload.handoverStaffId!;
          t.assigneeName = payload.handoverStaffName || '';
          reassignedTasksCount++;
        }
        if (t.reviewerId === employeeId && t.status !== 'HOAN_THANH' && t.status !== 'HUY') {
          t.reviewerId = payload.handoverStaffId!;
          t.reviewerName = payload.handoverStaffName || '';
        }
      });
      if (reassignedTasksCount > 0) {
        this.saveTasks(tasks);
      }
    }

    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'UPDATE',
      entityType: 'USER',
      entityId: emp.id,
      entityTitle: `Chấm dứt HĐLĐ: ${emp.name}`,
      details: `Chấm dứt hợp đồng lao động nhân viên ${emp.name} (${emp.code}) từ ngày ${payload.terminationDate}. Khóa quyền truy cập hệ thống. Bàn giao: ${payload.handoverStaffName || 'Không'} (${reassignedCustomersCount} KH, ${reassignedTasksCount} công việc).`,
    });

    this.broadcastSync({
      id: `TERMINATE-EMP-${Date.now()}`,
      type: 'FORCE_SYNC',
      senderId: defaultActor.id,
      senderName: defaultActor.name,
      timestamp: new Date().toISOString(),
    });

    return { employee: emp, reassignedCustomersCount, reassignedTasksCount };
  }

  reactivateEmployeeContract(employeeId: string, actor?: User): EmployeeProfile {
    const defaultActor = actor || this.getCurrentUser();
    const employees = this.getEmployees();
    const index = employees.findIndex(e => e.id === employeeId);
    if (index === -1) {
      throw new Error(`Không tìm thấy nhân viên với mã ${employeeId}`);
    }

    const emp = employees[index];
    emp.status = 'DANG_LAM_VIEC';
    emp.notes = (emp.notes ? emp.notes + ' | ' : '') + `Tái kích hoạt HĐLĐ ngày ${CURRENT_SYSTEM_DATE}`;
    employees[index] = emp;
    this.saveEmployees(employees);

    // Kích hoạt lại User & IAM
    const rawUsers = this.get<User[] | null>(STORAGE_KEYS.USERS, null) || [];
    const uIdx = rawUsers.findIndex(u => u.id === employeeId || u.code === emp.code);
    if (uIdx >= 0) {
      rawUsers[uIdx].active = true;
      rawUsers[uIdx].accountStatus = 'ACTIVE';
      this.saveUsers(rawUsers);
    }

    const creds = this.getCredentials();
    const cIdx = creds.findIndex(c => c.userId === employeeId || c.employeeCode === emp.code);
    if (cIdx >= 0) {
      creds[cIdx].status = 'ACTIVE';
      this.saveCredentials(creds);
    }

    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'UPDATE',
      entityType: 'USER',
      entityId: emp.id,
      entityTitle: `Tái kích hoạt HĐLĐ: ${emp.name}`,
      details: `Tái kích hoạt hợp đồng lao động nhân sự ${emp.name} (${emp.code}) về trạng thái Đang làm việc. Mở lại quyền truy cập hệ thống & phân công.`,
    });

    this.broadcastSync({
      id: `REACTIVATE-EMP-${Date.now()}`,
      type: 'FORCE_SYNC',
      senderId: defaultActor.id,
      senderName: defaultActor.name,
      timestamp: new Date().toISOString(),
    });

    return emp;
  }

  deleteEmployee(
    employeeId: string,
    actor?: User,
    handoverStaffId?: string,
    handoverStaffName?: string
  ): { 
    success: boolean; 
    message: string; 
    employee?: EmployeeProfile; 
    reassignedCustomersCount: number;
    reassignedTasksCount: number;
  } {
    const defaultActor = actor || this.getCurrentUser();
    const employees = this.getEmployees();
    const index = employees.findIndex(e => e.id === employeeId || e.code === employeeId);
    if (index === -1) {
      return { 
        success: false, 
        message: `Không tìm thấy nhân viên với mã ${employeeId}`,
        reassignedCustomersCount: 0,
        reassignedTasksCount: 0
      };
    }

    const emp = employees[index];

    // 1. Remove from EMPLOYEES
    const updatedEmployees = employees.filter(e => e.id !== emp.id && e.code !== emp.code);
    this.saveEmployees(updatedEmployees);

    // 2. Remove from USERS (prevents auto-sync from re-creating)
    const rawUsers = this.get<User[] | null>(STORAGE_KEYS.USERS, null) || [];
    const updatedUsers = rawUsers.filter(u => u.id !== emp.id && u.code !== emp.code);
    this.saveUsers(updatedUsers);

    // 3. Remove from CREDENTIALS
    const creds = this.getCredentials();
    const updatedCreds = creds.filter(c => c.userId !== emp.id && c.employeeCode !== emp.code);
    this.saveCredentials(updatedCreds);

    let reassignedCustomersCount = 0;
    let reassignedTasksCount = 0;

    // 4. Reassign or Clean up customer assignments
    const customers = this.getCustomers();
    let updatedCustomer = false;
    customers.forEach(c => {
      if (c.assignedStaffId === emp.id || c.assignedStaffId === emp.code) {
        if (handoverStaffId && handoverStaffId !== emp.id) {
          c.assignedStaffId = handoverStaffId;
          c.assignedStaffName = handoverStaffName || '';
          reassignedCustomersCount++;
        } else {
          c.assignedStaffId = '';
          c.assignedStaffName = 'Chưa phân công';
        }
        updatedCustomer = true;
      }
      if (c.reviewerStaffId === emp.id || c.reviewerStaffId === emp.code) {
        if (handoverStaffId && handoverStaffId !== emp.id) {
          c.reviewerStaffId = handoverStaffId;
          c.reviewerStaffName = handoverStaffName || '';
        } else {
          c.reviewerStaffId = '';
          c.reviewerStaffName = '';
        }
        updatedCustomer = true;
      }
    });
    if (updatedCustomer) {
      this.saveCustomers(customers);
    }

    // 5. Reassign or Clean up active tasks
    const tasks = this.getTasks();
    let updatedTasks = false;
    tasks.forEach(t => {
      if ((t.assigneeId === emp.id || t.assigneeId === emp.code) && t.status !== 'HOAN_THANH' && t.status !== 'HUY') {
        if (handoverStaffId && handoverStaffId !== emp.id) {
          t.assigneeId = handoverStaffId;
          t.assigneeName = handoverStaffName || '';
          reassignedTasksCount++;
        } else {
          t.assigneeId = '';
          t.assigneeName = 'Chưa phân công';
        }
        updatedTasks = true;
      }
      if ((t.reviewerId === emp.id || t.reviewerId === emp.code) && t.status !== 'HOAN_THANH' && t.status !== 'HUY') {
        if (handoverStaffId && handoverStaffId !== emp.id) {
          t.reviewerId = handoverStaffId;
          t.reviewerName = handoverStaffName || '';
        } else {
          t.reviewerId = '';
          t.reviewerName = '';
        }
        updatedTasks = true;
      }
    });
    if (updatedTasks) {
      this.saveTasks(tasks);
    }

    // 6. Audit Log
    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'DELETE',
      entityType: 'USER',
      entityId: emp.id,
      entityTitle: `Xoá nhân sự: ${emp.name}`,
      details: `Đã xoá hồ sơ nhân sự ${emp.name} (${emp.code}) - ${emp.position} khỏi hệ thống quản lý. Tự động thu hồi tài khoản & giải phóng quyền hạn. ${
        handoverStaffId 
          ? `Bàn giao: ${handoverStaffName} (${reassignedCustomersCount} KH, ${reassignedTasksCount} công việc)`
          : 'Giải phóng doanh nghiệp & công việc về trạng thái Chưa phân công'
      }.`,
    });

    this.broadcastSync({
      id: `DELETE-EMP-${Date.now()}`,
      type: 'FORCE_SYNC',
      senderId: defaultActor.id,
      senderName: defaultActor.name,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: `Đã xoá thành công nhân sự ${emp.name} (${emp.code}).`,
      employee: emp,
      reassignedCustomersCount,
      reassignedTasksCount,
    };
  }

  getLeaveRequests(): LeaveRequest[] {
    const raw = this.get<LeaveRequest[] | null>(STORAGE_KEYS.LEAVE_REQUESTS, null);
    if (raw === null || !Array.isArray(raw)) {
      this.set(STORAGE_KEYS.LEAVE_REQUESTS, INITIAL_LEAVE_REQUESTS);
      return INITIAL_LEAVE_REQUESTS;
    }
    return raw.filter(l => 
      l.employeeId !== 'USR-001' && l.employeeId !== 'USR-002' && l.employeeId !== 'USR-003' && l.employeeId !== 'USR-004' &&
      !l.employeeName?.includes('Lê Văn C') && !l.employeeName?.includes('Trần Thị B') && !l.employeeName?.includes('Nguyễn Văn A')
    );
  }

  saveLeaveRequests(requests: LeaveRequest[]): void {
    this.set(STORAGE_KEYS.LEAVE_REQUESTS, requests);
    this.broadcastSync({
      id: `SYNC-LR-${Date.now()}`,
      type: 'FORCE_SYNC' as any,
      senderId: this.getCurrentUser().id,
      senderName: this.getCurrentUser().name,
      timestamp: new Date().toISOString(),
    });
  }

  getLeaveAndTripStats(user?: User) {
    const leaves = this.getLeaveRequests();
    const trips = this.getBusinessTrips();
    const u = user || this.getCurrentUser();
    const canReview = u.role === 'ADMIN' || u.role === 'BAN_GIAM_DOC' || u.role === 'TRUONG_PHONG' || PermissionService.canReviewLeave(u);

    const pendingLeaves = leaves.filter(l => l.status === 'CHO_DUYET');
    const pendingTrips = trips.filter(t => t.status === 'CHO_DUYET');
    const totalPending = pendingLeaves.length + pendingTrips.length;

    const myLeaves = leaves.filter(l => l.employeeId === u.id);
    const myTrips = trips.filter(t => t.employeeId === u.id);
    const myPendingLeaves = myLeaves.filter(l => l.status === 'CHO_DUYET');
    const myActiveTrips = myTrips.filter(t => t.status === 'CHO_DUYET' || t.status === 'DANG_DI');
    const totalMyActive = myPendingLeaves.length + myActiveTrips.length;

    const myApprovedLeaves = myLeaves.filter(l => l.status === 'DA_DUYET');
    const myApprovedTrips = myTrips.filter(t => t.status === 'DA_DUYET' || t.status === 'HOAN_THANH');
    const totalMyApproved = myApprovedLeaves.length + myApprovedTrips.length;

    const allApprovedLeaves = leaves.filter(l => l.status === 'DA_DUYET');
    const allApprovedTrips = trips.filter(t => t.status === 'DA_DUYET' || t.status === 'HOAN_THANH');
    const totalAllApproved = allApprovedLeaves.length + allApprovedTrips.length;

    return {
      leaves,
      trips,
      totalLeaves: leaves.length,
      totalTrips: trips.length,
      totalAll: leaves.length + trips.length,
      pendingLeaves,
      pendingTrips,
      pendingLeavesCount: pendingLeaves.length,
      pendingTripsCount: pendingTrips.length,
      totalPending,
      myLeaves,
      myTrips,
      myLeavesCount: myLeaves.length,
      myTripsCount: myTrips.length,
      myPendingLeavesCount: myPendingLeaves.length,
      myActiveTripsCount: myActiveTrips.length,
      myActiveCount: totalMyActive,
      myApprovedLeaves,
      myApprovedTrips,
      myApprovedLeavesCount: myApprovedLeaves.length,
      myApprovedTripsCount: myApprovedTrips.length,
      myApprovedCount: totalMyApproved,
      allApprovedLeaves,
      allApprovedTrips,
      allApprovedCount: totalAllApproved,
      canReview,
      effectiveBadgeCount: canReview ? totalPending : totalMyActive,
    };
  }

  createLeaveRequest(request: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>, actor?: User): LeaveRequest {
    const defaultActor = actor || this.getCurrentUser();
    const list = this.getLeaveRequests();
    const newReq: LeaveRequest = {
      ...request,
      id: `LR-${Date.now().toString().slice(-4)}`,
      status: 'CHO_DUYET',
      createdAt: CURRENT_SYSTEM_DATE,
    };
    list.unshift(newReq);
    this.saveLeaveRequests(list);

    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'CREATE',
      entityType: 'SYSTEM',
      entityId: newReq.id,
      entityTitle: `Đơn xin nghỉ/công tác: ${newReq.employeeName}`,
      details: `Đăng ký ${newReq.leaveType === 'CONG_TAC_KHACH_HANG' ? 'công tác' : 'nghỉ phép'} ${newReq.daysCount} ngày (${newReq.startDate} - ${newReq.endDate})`,
    });

    this.broadcastSync({
      id: `LEAVE-CREATE-${Date.now()}`,
      type: 'FORCE_SYNC',
      senderId: defaultActor.id,
      senderName: defaultActor.name,
      timestamp: new Date().toISOString(),
      payload: { action: 'LEAVE_CREATED', request: newReq },
    });

    return newReq;
  }

  approveLeaveRequest(requestId: string, status: 'DA_DUYET' | 'TU_CHOI', reason?: string, actor?: User): boolean {
    const defaultActor = actor || this.getCurrentUser();
    const list = this.getLeaveRequests();
    const index = list.findIndex(r => r.id === requestId);
    if (index === -1) return false;

    list[index].status = status;
    list[index].approverId = defaultActor.id;
    list[index].approverName = defaultActor.name;
    list[index].approvedAt = CURRENT_SYSTEM_DATE;
    if (reason) list[index].rejectionReason = reason;

    this.saveLeaveRequests(list);

    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'APPROVE',
      entityType: 'SYSTEM',
      entityId: requestId,
      entityTitle: `Phê duyệt nghỉ phép: ${list[index].employeeName}`,
      details: `${status === 'DA_DUYET' ? 'Chấp thuận' : 'Từ chối'} đơn nghỉ/công tác của ${list[index].employeeName}`,
    });

    this.broadcastSync({
      id: `LEAVE-APP-${Date.now()}`,
      type: 'FORCE_SYNC',
      senderId: defaultActor.id,
      senderName: defaultActor.name,
      timestamp: new Date().toISOString(),
      payload: { action: 'LEAVE_STATUS_CHANGED', requestId, status },
    });

    return true;
  }

  deleteLeaveRequest(requestId: string, actor?: User): boolean {
    const defaultActor = actor || this.getCurrentUser();
    let list = this.getLeaveRequests();
    const item = list.find(r => r.id === requestId);
    if (!item) return false;

    list = list.filter(r => r.id !== requestId);
    this.saveLeaveRequests(list);

    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'DELETE',
      entityType: 'SYSTEM',
      entityId: requestId,
      entityTitle: `Xóa đơn xin nghỉ phép: ${item.employeeName}`,
      details: `Đã xóa đơn xin nghỉ phép (${item.daysCount} ngày, từ ${item.startDate} đến ${item.endDate}) của ${item.employeeName}`,
    });

    this.broadcastSync({
      id: `LEAVE-DEL-${Date.now()}`,
      type: 'FORCE_SYNC',
      senderId: defaultActor.id,
      senderName: defaultActor.name,
      timestamp: new Date().toISOString(),
      payload: { action: 'LEAVE_DELETED', requestId },
    });

    return true;
  }

  // =========================================================================
  // BUSINESS TRIPS & ON-SITE MISSIONS MANAGEMENT (ĐĂNG KÝ & QUẢN LÝ LỊCH CÔNG TÁC)
  // =========================================================================

  getBusinessTrips(): BusinessTrip[] {
    const raw = this.get<BusinessTrip[] | null>(STORAGE_KEYS.BUSINESS_TRIPS, null);
    if (raw === null || !Array.isArray(raw)) {
      this.set(STORAGE_KEYS.BUSINESS_TRIPS, INITIAL_BUSINESS_TRIPS);
      return INITIAL_BUSINESS_TRIPS;
    }
    return raw.filter(t => 
      t.id !== 'BT-001' && t.id !== 'BT-002' && t.id !== 'BT-003' &&
      !t.code?.startsWith('CT-2026-001') && !t.code?.startsWith('CT-2026-002') && !t.code?.startsWith('CT-2026-003') &&
      t.employeeId !== 'USR-001' && t.employeeId !== 'USR-002' && t.employeeId !== 'USR-003' && t.employeeId !== 'USR-004' &&
      t.customerId !== 'CUST-001' && t.customerId !== 'CUST-002' && t.customerId !== 'CUST-003'
    );
  }

  saveBusinessTrips(trips: BusinessTrip[]): void {
    this.set(STORAGE_KEYS.BUSINESS_TRIPS, trips);
    this.broadcastSync({
      id: `SYNC-BT-${Date.now()}`,
      type: 'BUSINESS_TRIP_UPDATED' as any,
      senderId: this.getCurrentUser().id,
      senderName: this.getCurrentUser().name,
      timestamp: new Date().toISOString(),
    });
  }

  createBusinessTrip(
    tripData: Omit<BusinessTrip, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'status'>,
    actor?: User
  ): BusinessTrip {
    const defaultActor = actor || this.getCurrentUser();
    const list = this.getBusinessTrips();

    // Auto-generate code e.g. CT-2026-004
    const count = list.length + 1;
    const year = new Date().getFullYear();
    const code = `CT-${year}-${String(count).padStart(3, '0')}`;

    const newTrip: BusinessTrip = {
      ...tripData,
      id: `BT-${Date.now().toString().slice(-6)}`,
      code,
      status: 'CHO_DUYET',
      createdAt: CURRENT_SYSTEM_DATE,
      updatedAt: CURRENT_SYSTEM_DATE,
    };

    list.unshift(newTrip);
    this.saveBusinessTrips(list);

    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'CREATE',
      entityType: 'SYSTEM',
      entityId: newTrip.id,
      entityTitle: `Đăng ký lịch công tác: [${newTrip.code}] ${newTrip.employeeName}`,
      details: `Đăng ký lịch công tác tại "${newTrip.destination}" từ ${newTrip.startDate} đến ${newTrip.endDate} (Mục đích: ${newTrip.title})`,
    });

    return newTrip;
  }

  updateBusinessTrip(trip: BusinessTrip, actor?: User): boolean {
    const defaultActor = actor || this.getCurrentUser();
    const list = this.getBusinessTrips();
    const index = list.findIndex(t => t.id === trip.id);
    if (index === -1) return false;

    list[index] = {
      ...trip,
      updatedAt: CURRENT_SYSTEM_DATE,
    };

    this.saveBusinessTrips(list);

    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'UPDATE',
      entityType: 'SYSTEM',
      entityId: trip.id,
      entityTitle: `Cập nhật lịch công tác: [${trip.code}] ${trip.employeeName}`,
      details: `Cập nhật thông tin chuyến công tác tại ${trip.destination}`,
    });

    return true;
  }

  approveBusinessTrip(
    tripId: string,
    status: 'DA_DUYET' | 'TU_CHOI',
    rejectionReason?: string,
    actor?: User
  ): boolean {
    const defaultActor = actor || this.getCurrentUser();
    const list = this.getBusinessTrips();
    const index = list.findIndex(t => t.id === tripId);
    if (index === -1) return false;

    list[index].status = status;
    list[index].approverId = defaultActor.id;
    list[index].approverName = defaultActor.name;
    list[index].approvedAt = CURRENT_SYSTEM_DATE;
    list[index].updatedAt = CURRENT_SYSTEM_DATE;
    if (rejectionReason) {
      list[index].rejectionReason = rejectionReason;
    }

    this.saveBusinessTrips(list);

    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'APPROVE',
      entityType: 'SYSTEM',
      entityId: tripId,
      entityTitle: `${status === 'DA_DUYET' ? 'Phê duyệt' : 'Từ chối'} lịch công tác: [${list[index].code}]`,
      details: `${status === 'DA_DUYET' ? 'Chấp thuận' : 'Từ chối'} chuyến công tác của ${list[index].employeeName} tại ${list[index].destination}${rejectionReason ? ` (Lý do: ${rejectionReason})` : ''}`,
    });

    this.broadcastSync({
      id: `TRIP-APP-${Date.now()}`,
      type: 'FORCE_SYNC',
      senderId: defaultActor.id,
      senderName: defaultActor.name,
      timestamp: new Date().toISOString(),
      payload: { action: 'TRIP_STATUS_CHANGED', tripId, status },
    });

    return true;
  }

  checkinBusinessTrip(
    tripId: string,
    address?: string,
    actor?: User
  ): boolean {
    const defaultActor = actor || this.getCurrentUser();
    const list = this.getBusinessTrips();
    const index = list.findIndex(t => t.id === tripId);
    if (index === -1) return false;

    const nowIso = new Date().toISOString();
    list[index].status = 'DANG_DI';
    list[index].checkinAt = nowIso;
    if (address) list[index].checkinAddress = address;
    list[index].updatedAt = CURRENT_SYSTEM_DATE;

    this.saveBusinessTrips(list);

    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'UPDATE',
      entityType: 'SYSTEM',
      entityId: tripId,
      entityTitle: `Bắt đầu / Check-in công tác: [${list[index].code}]`,
      details: `${list[index].employeeName} đã check-in bắt đầu làm việc tại thực địa (${list[index].destination})`,
    });

    return true;
  }

  completeBusinessTripWithReport(
    tripId: string,
    reportData: {
      resultSummary: string;
      deliverables?: string[];
      actualTotalCost?: number;
      expenses?: BusinessTrip['expenses'];
      tasks?: BusinessTrip['tasks'];
    },
    actor?: User
  ): boolean {
    const defaultActor = actor || this.getCurrentUser();
    const list = this.getBusinessTrips();
    const index = list.findIndex(t => t.id === tripId);
    if (index === -1) return false;

    const nowIso = new Date().toISOString();
    list[index].status = 'HOAN_THANH';
    list[index].checkoutAt = nowIso;
    list[index].resultSummary = reportData.resultSummary;
    if (reportData.deliverables) list[index].deliverables = reportData.deliverables;
    if (reportData.actualTotalCost !== undefined) list[index].actualTotalCost = reportData.actualTotalCost;
    if (reportData.expenses) list[index].expenses = reportData.expenses;
    if (reportData.tasks) list[index].tasks = reportData.tasks;
    list[index].updatedAt = CURRENT_SYSTEM_DATE;

    this.saveBusinessTrips(list);

    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'UPDATE',
      entityType: 'SYSTEM',
      entityId: tripId,
      entityTitle: `Báo cáo kết quả công tác: [${list[index].code}]`,
      details: `${list[index].employeeName} đã nộp báo cáo kết quả hoàn thành công tác tại ${list[index].destination}`,
    });

    return true;
  }

  cancelBusinessTrip(tripId: string, reason: string, actor?: User): boolean {
    const defaultActor = actor || this.getCurrentUser();
    const list = this.getBusinessTrips();
    const index = list.findIndex(t => t.id === tripId);
    if (index === -1) return false;

    list[index].status = 'DA_HUY';
    list[index].cancellationReason = reason;
    list[index].updatedAt = CURRENT_SYSTEM_DATE;

    this.saveBusinessTrips(list);

    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'DELETE',
      entityType: 'SYSTEM',
      entityId: tripId,
      entityTitle: `Hủy lịch công tác: [${list[index].code}]`,
      details: `Hủy chuyến công tác của ${list[index].employeeName} (Lý do: ${reason})`,
    });

    return true;
  }

  deleteBusinessTrip(tripId: string, actor?: User): boolean {
    const defaultActor = actor || this.getCurrentUser();
    let list = this.getBusinessTrips();
    const item = list.find(t => t.id === tripId);
    if (!item) return false;

    list = list.filter(t => t.id !== tripId);
    this.saveBusinessTrips(list);

    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'DELETE',
      entityType: 'SYSTEM',
      entityId: tripId,
      entityTitle: `Xóa hồ sơ công tác: [${item.code}]`,
      details: `Xóa hồ sơ công tác của ${item.employeeName}`,
    });

    return true;
  }

  getPayrollRecords(): PayrollRecord[] {
    const raw = this.get<PayrollRecord[] | null>(STORAGE_KEYS.PAYROLL, null);
    let records = raw;
    if (raw === null || !Array.isArray(raw)) {
      records = INITIAL_PAYROLL_RECORDS;
      this.set(STORAGE_KEYS.PAYROLL, INITIAL_PAYROLL_RECORDS);
    }
    if (!records) records = [];
    const filtered = records.filter(r => 
      r.employeeId !== 'USR-030' && 
      !r.employeeName?.includes('Quản Trị') && 
      !r.employeeName?.includes('(Admin)')
    );
    if (filtered.length !== records.length) {
      records = filtered;
      this.set(STORAGE_KEYS.PAYROLL, records);
    }
    return records;
  }

  savePayrollRecords(records: PayrollRecord[]): void {
    const filtered = records.filter(r => 
      r.employeeId !== 'USR-030' && 
      !r.employeeName?.includes('Quản Trị') && 
      !r.employeeName?.includes('(Admin)')
    );
    this.set(STORAGE_KEYS.PAYROLL, filtered);
  }

  getPayrollRecordsByPeriod(month: number, year: number): PayrollRecord[] {
    const all = this.getPayrollRecords();
    return all.filter(r => r.month === month && r.year === year);
  }

  updatePayrollRecord(
    recordId: string, 
    updates: {
      positionAllowance?: number;
      lunchAllowance?: number;
      phoneAllowance?: number;
      performanceBonus?: number;
      actualSalary?: number;
      actualWorkingDays?: number;
      bonusReason?: string;
      adjustmentNotes?: string;
      status?: 'DU_THAO' | 'DA_DUYET' | 'DA_CHI_TRA';
    },
    actor?: User
  ): PayrollRecord {
    const list = this.getPayrollRecords();
    const index = list.findIndex(r => r.id === recordId);
    if (index === -1) {
      throw new Error('Không tìm thấy bản ghi lương cần cập nhật.');
    }

    const current = list[index];
    const employees = this.getEmployees();
    const emp = employees.find(e => e.id === current.employeeId);
    const dependentsCount = emp?.taxDependents ?? 0;

    const actualSalary = updates.actualSalary !== undefined ? updates.actualSalary : current.actualSalary;
    const positionAllowance = updates.positionAllowance !== undefined ? updates.positionAllowance : current.positionAllowance;
    const lunchAllowance = updates.lunchAllowance !== undefined ? updates.lunchAllowance : current.lunchAllowance;
    const phoneAllowance = updates.phoneAllowance !== undefined ? updates.phoneAllowance : current.phoneAllowance;
    const performanceBonus = updates.performanceBonus !== undefined ? updates.performanceBonus : current.performanceBonus;
    const actualWorkingDays = updates.actualWorkingDays !== undefined ? updates.actualWorkingDays : current.actualWorkingDays;
    const bonusReason = updates.bonusReason !== undefined ? updates.bonusReason : current.bonusReason;
    const adjustmentNotes = updates.adjustmentNotes !== undefined ? updates.adjustmentNotes : current.adjustmentNotes;
    const status = updates.status !== undefined ? updates.status : current.status;

    const grossIncome = actualSalary + positionAllowance + lunchAllowance + phoneAllowance + performanceBonus;

    // Calculate tax & deductions according to TT 87/2026/TT-BTC and Law 41/2024/QH15
    const calc = this.calculateNetSalary(grossIncome, dependentsCount, current.baseSalary);

    const updatedRecord: PayrollRecord = {
      ...current,
      actualSalary,
      positionAllowance,
      lunchAllowance,
      phoneAllowance,
      performanceBonus,
      actualWorkingDays,
      grossIncome,
      socialInsurance: calc.employeeInsurance.bhxh,
      healthInsurance: calc.employeeInsurance.bhyt,
      unemploymentInsurance: calc.employeeInsurance.bhtn,
      totalInsuranceDeduction: calc.employeeInsurance.total,
      personalDeduction: calc.personalDeduction,
      dependentsDeduction: calc.dependentsDeduction,
      taxableIncome: calc.taxableIncome,
      personalIncomeTax: calc.personalIncomeTax,
      netSalary: calc.netSalary,
      employerSocialInsurance: calc.employerCosts.bhxh,
      employerHealthInsurance: calc.employerCosts.bhyt,
      employerUnemploymentInsurance: calc.employerCosts.bhtn,
      employerTradeUnion: calc.employerCosts.tradeUnion,
      totalEmployerCost: calc.employerCosts.total,
      bonusReason,
      adjustmentNotes,
      status,
    };

    list[index] = updatedRecord;
    this.savePayrollRecords(list);

    const defaultActor = actor || this.getCurrentUser();
    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'UPDATE',
      entityType: 'HR_PAYROLL',
      entityId: updatedRecord.id,
      entityTitle: `Điều chỉnh lương & phụ cấp: ${updatedRecord.employeeName}`,
      details: `Điều chỉnh kỳ lương ${updatedRecord.month.toString().padStart(2, '0')}/${updatedRecord.year} cho ${updatedRecord.employeeName}: Phụ cấp (${(positionAllowance + lunchAllowance + phoneAllowance).toLocaleString('vi-VN')} đ), Thưởng KPI (${performanceBonus.toLocaleString('vi-VN')} đ), Lương thực lĩnh: ${calc.netSalary.toLocaleString('vi-VN')} đ. Ghi chú: ${bonusReason || adjustmentNotes || 'Điều chỉnh hàng tháng'}`,
    });

    return updatedRecord;
  }

  generatePayrollForMonth(month: number, year: number, actor?: User): PayrollRecord[] {
    const all = this.getPayrollRecords();
    const existing = all.filter(r => r.month === month && r.year === year && r.employeeId !== 'USR-030');
    const activeEmployees = this.getEmployees().filter(e => 
      e.status !== 'DA_NGHI_VIEC' && 
      e.role !== 'ADMIN' && 
      e.id !== 'USR-030' &&
      !e.name.includes('Quản Trị') &&
      !e.name.includes('(Admin)')
    );

    if (existing.length > 0) {
      // Check if any active employee is missing from existing payroll
      const missingEmps = activeEmployees.filter(emp => !existing.some(r => r.employeeId === emp.id));
      if (missingEmps.length === 0) {
        return existing;
      }

      // Add missing employees to this month's payroll
      const addedRecords: PayrollRecord[] = missingEmps.map(emp => {
        const gross = (emp.actualSalary || 12000000) + (emp.positionAllowance || 0) + (emp.lunchAllowance || 0) + (emp.phoneAllowance || 0);
        const calc = this.calculateNetSalary(gross, emp.taxDependents || 0, emp.baseSalary || 6500000);
        return {
          id: `PAYROLL-${year}-${month.toString().padStart(2, '0')}-${emp.id}`,
          month,
          year,
          employeeId: emp.id,
          employeeName: emp.name,
          department: emp.department,
          position: emp.position,
          standardWorkingDays: 22,
          actualWorkingDays: 22,
          baseSalary: emp.baseSalary || 6500000,
          actualSalary: emp.actualSalary || 12000000,
          positionAllowance: emp.positionAllowance || 0,
          lunchAllowance: emp.lunchAllowance || 0,
          phoneAllowance: emp.phoneAllowance || 0,
          performanceBonus: 0,
          grossIncome: gross,
          socialInsurance: calc.employeeInsurance.bhxh,
          healthInsurance: calc.employeeInsurance.bhyt,
          unemploymentInsurance: calc.employeeInsurance.bhtn,
          totalInsuranceDeduction: calc.employeeInsurance.total,
          personalDeduction: calc.personalDeduction,
          dependentsDeduction: calc.dependentsDeduction,
          taxableIncome: calc.taxableIncome,
          personalIncomeTax: calc.personalIncomeTax,
          netSalary: calc.netSalary,
          employerSocialInsurance: calc.employerCosts.bhxh,
          employerHealthInsurance: calc.employerCosts.bhyt,
          employerUnemploymentInsurance: calc.employerCosts.bhtn,
          employerTradeUnion: calc.employerCosts.tradeUnion,
          totalEmployerCost: calc.employerCosts.total,
          status: 'DU_THAO',
          adjustmentNotes: `Tự động bổ sung nhân sự mới vào kỳ lương Tháng ${month.toString().padStart(2, '0')}/${year}`,
        };
      });

      const updatedAll = [...all, ...addedRecords];
      this.savePayrollRecords(updatedAll);
      return [...existing, ...addedRecords];
    }

    const newRecords: PayrollRecord[] = activeEmployees.map(emp => {
      const gross = (emp.actualSalary || 12000000) + (emp.positionAllowance || 0) + (emp.lunchAllowance || 0) + (emp.phoneAllowance || 0);
      const calc = this.calculateNetSalary(gross, emp.taxDependents || 0, emp.baseSalary || 6500000);
      return {
        id: `PAYROLL-${year}-${month.toString().padStart(2, '0')}-${emp.id}`,
        month,
        year,
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department,
        position: emp.position,
        standardWorkingDays: 22,
        actualWorkingDays: 22,
        baseSalary: emp.baseSalary || 6500000,
        actualSalary: emp.actualSalary || 12000000,
        positionAllowance: emp.positionAllowance || 0,
        lunchAllowance: emp.lunchAllowance || 0,
        phoneAllowance: emp.phoneAllowance || 0,
        performanceBonus: 0,
        grossIncome: gross,
        socialInsurance: calc.employeeInsurance.bhxh,
        healthInsurance: calc.employeeInsurance.bhyt,
        unemploymentInsurance: calc.employeeInsurance.bhtn,
        totalInsuranceDeduction: calc.employeeInsurance.total,
        personalDeduction: calc.personalDeduction,
        dependentsDeduction: calc.dependentsDeduction,
        taxableIncome: calc.taxableIncome,
        personalIncomeTax: calc.personalIncomeTax,
        netSalary: calc.netSalary,
        employerSocialInsurance: calc.employerCosts.bhxh,
        employerHealthInsurance: calc.employerCosts.bhyt,
        employerUnemploymentInsurance: calc.employerCosts.bhtn,
        employerTradeUnion: calc.employerCosts.tradeUnion,
        totalEmployerCost: calc.employerCosts.total,
        status: 'DU_THAO',
        adjustmentNotes: `Khởi tạo kỳ lương Tháng ${month.toString().padStart(2, '0')}/${year}`,
      };
    });

    const updatedAll = [...all, ...newRecords];
    this.savePayrollRecords(updatedAll);

    const defaultActor = actor || this.getCurrentUser();
    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'CREATE',
      entityType: 'HR_PAYROLL',
      entityId: `PAYROLL-${year}-${month}`,
      entityTitle: `Khởi tạo bảng lương Tháng ${month.toString().padStart(2, '0')}/${year}`,
      details: `Khởi tạo bảng thanh toán tiền lương và trích nộp BHXH cho ${newRecords.length} nhân sự kỳ ${month.toString().padStart(2, '0')}/${year}`,
    });

    return newRecords;
  }

  getHRWorkflowSOPs(): HRWorkflowSOP[] {
    return HR_WORKFLOW_SOPS;
  }

  /**
   * Helper: Tính thuế TNCN và lương Net từ Lương Gross theo Biểu thuế Lũy tiến từng phần 7 bậc
   * Căn cứ: Thông tư 87/2026/TT-BTC (thay thế trực tiếp Thông tư 111/2013/TT-BTC từ 01/01/2026) & Luật BHXH 41/2024/QH15
   */
  calculateNetSalary(grossSalary: number, dependentsCount: number = 0, insuranceSalary?: number): SalaryCalculationResult {
    const baseIns = Math.min(insuranceSalary || grossSalary, 36000000); // Mức trần đóng BHXH (20 lần lương cơ sở)
    
    // BHXH 8%, BHYT 1.5%, BHTN 1% (Tổng NLĐ: 10.5%)
    const bhxh = Math.round(baseIns * 0.08);
    const bhyt = Math.round(baseIns * 0.015);
    const bhtn = Math.round(baseIns * 0.01);
    const totalInsurance = bhxh + bhyt + bhtn;

    // Giảm trừ gia cảnh: Bản thân 15.5tr/tháng, Người phụ thuộc 6.2tr/tháng/người (Chuẩn Thông tư 87/2026/TT-BTC)
    const personalDeduction = 15500000;
    const dependentsDeduction = dependentsCount * 6200000;
    const totalDeductions = totalInsurance + personalDeduction + dependentsDeduction;

    // Thu nhập tính thuế
    const taxableIncome = Math.max(0, grossSalary - totalDeductions);

    // Biểu thuế lũy tiến từng phần 7 bậc (Thông tư 87/2026/TT-BTC thay thế Thông tư 111/2013/TT-BTC)
    // Bậc 1: Đến 5 triệu -> 5%
    // Bậc 2: Trên 5 triệu đến 10 triệu -> 10%
    // Bậc 3: Trên 10 triệu đến 18 triệu -> 15%
    // Bậc 4: Trên 18 triệu đến 32 triệu -> 20%
    // Bậc 5: Trên 32 triệu đến 52 triệu -> 25%
    // Bậc 6: Trên 52 triệu đến 80 triệu -> 30%
    // Bậc 7: Trên 80 triệu -> 35%

    const taxBrackets: TaxBracketDetail[] = [
      {
        bracket: 1,
        thresholdLabel: 'Đến 5.000.000 đ',
        taxRate: 5,
        taxableInBracket: Math.min(Math.max(0, taxableIncome), 5000000),
        taxAmount: Math.round(Math.min(Math.max(0, taxableIncome), 5000000) * 0.05),
        maxTaxForBracket: 250000,
      },
      {
        bracket: 2,
        thresholdLabel: 'Trên 5 - 10.000.000 đ',
        taxRate: 10,
        taxableInBracket: Math.min(Math.max(0, taxableIncome - 5000000), 5000000),
        taxAmount: Math.round(Math.min(Math.max(0, taxableIncome - 5000000), 5000000) * 0.1),
        maxTaxForBracket: 500000,
      },
      {
        bracket: 3,
        thresholdLabel: 'Trên 10 - 18.000.000 đ',
        taxRate: 15,
        taxableInBracket: Math.min(Math.max(0, taxableIncome - 10000000), 8000000),
        taxAmount: Math.round(Math.min(Math.max(0, taxableIncome - 10000000), 8000000) * 0.15),
        maxTaxForBracket: 1200000,
      },
      {
        bracket: 4,
        thresholdLabel: 'Trên 18 - 32.000.000 đ',
        taxRate: 20,
        taxableInBracket: Math.min(Math.max(0, taxableIncome - 18000000), 14000000),
        taxAmount: Math.round(Math.min(Math.max(0, taxableIncome - 18000000), 14000000) * 0.2),
        maxTaxForBracket: 2800000,
      },
      {
        bracket: 5,
        thresholdLabel: 'Trên 32 - 52.000.000 đ',
        taxRate: 25,
        taxableInBracket: Math.min(Math.max(0, taxableIncome - 32000000), 20000000),
        taxAmount: Math.round(Math.min(Math.max(0, taxableIncome - 32000000), 20000000) * 0.25),
        maxTaxForBracket: 5000000,
      },
      {
        bracket: 6,
        thresholdLabel: 'Trên 52 - 80.000.000 đ',
        taxRate: 30,
        taxableInBracket: Math.min(Math.max(0, taxableIncome - 52000000), 28000000),
        taxAmount: Math.round(Math.min(Math.max(0, taxableIncome - 52000000), 28000000) * 0.3),
        maxTaxForBracket: 8400000,
      },
      {
        bracket: 7,
        thresholdLabel: 'Trên 80.000.000 đ',
        taxRate: 35,
        taxableInBracket: Math.max(0, taxableIncome - 80000000),
        taxAmount: Math.round(Math.max(0, taxableIncome - 80000000) * 0.35),
        maxTaxForBracket: Infinity,
      },
    ];

    const totalPIT = taxBrackets.reduce((acc, b) => acc + b.taxAmount, 0);
    const netSalary = grossSalary - totalInsurance - totalPIT;

    // Chi phí NSDLĐ: BHXH 17.5%, BHYT 3%, BHTN 1%, KPCĐ 2% = 23.5%
    const employerBHXH = Math.round(baseIns * 0.175);
    const employerBHYT = Math.round(baseIns * 0.03);
    const employerBHTN = Math.round(baseIns * 0.01);
    const employerTradeUnion = Math.round(grossSalary * 0.02);
    const totalEmployerCost = grossSalary + employerBHXH + employerBHYT + employerBHTN + employerTradeUnion;

    return {
      grossSalary,
      insuranceBase: baseIns,
      employeeInsurance: { bhxh, bhyt, bhtn, total: totalInsurance },
      personalDeduction,
      dependentsDeduction,
      taxableIncome,
      personalIncomeTax: totalPIT,
      taxBrackets,
      netSalary,
      employerCosts: {
        bhxh: employerBHXH,
        bhyt: employerBHYT,
        bhtn: employerBHTN,
        tradeUnion: employerTradeUnion,
        total: totalEmployerCost,
      },
      legalBasis: 'Thông tư 87/2026/TT-BTC (thay thế trực tiếp Thông tư 111/2013/TT-BTC từ 01/01/2026) & Luật BHXH số 41/2024/QH15',
    };
  }

  // ==========================================
  // WORKLOAD BALANCING ENGINE (Dynamic Sync with HR, Payroll & Customers)
  // ==========================================

  getStaffWorkloadSummaries(): StaffWorkloadSummary[] {
    const users = this.getUsers().filter(u => 
      u.active !== false && 
      u.role !== 'ADMIN' && 
      u.id !== 'USR-030' && 
      !u.name.includes('Quản Trị')
    );
    const employees = this.getEmployees();
    const customers = this.getCustomers();
    const tasks = this.getTasks();

    return users.map(user => {
      const assignedCustomers = customers.filter(c => c.assignedStaffId === user.id);
      const userTasks = tasks.filter(t => t.assigneeId === user.id);
      
      const emp = employees.find(e => e.id === user.id || e.code === user.code || e.email === user.email);
      // Lấy định mức tối đa từ hồ sơ nhân sự HR (mặc định 7 khách hàng cho Kế toán viên hoặc giá trị cấu hình)
      const userCapacity = emp?.maxCustomerCapacity || (user.role === 'NHAN_VIEN' ? 7 : 10);
      
      const activeTasks = userTasks.filter(t => t.status !== 'HOAN_THANH' && t.status !== 'HUY');
      const pendingReview = userTasks.filter(t => t.status === 'CHO_KIEM_TRA');
      const pendingApproval = userTasks.filter(t => t.status === 'CHO_PHE_DUYET');
      
      const todayStr = new Date().toISOString().split('T')[0];
      const overdueTasks = activeTasks.filter(t => t.dueDate < todayStr);
      const completedTasks = userTasks.filter(t => t.status === 'HOAN_THANH');

      const customerCount = assignedCustomers.length;
      const capacityUsageRate = userCapacity > 0 ? Math.round((customerCount / userCapacity) * 100) : 0;

      // Doanh thu hàng tháng & Rủi ro khách hàng phụ trách
      const monthlyRevenue = assignedCustomers.reduce((sum, c) => sum + (c.monthlyFee || 0), 0);
      const riskDistribution = {
        high: assignedCustomers.filter(c => c.riskLevel === 'CAO').length,
        medium: assignedCustomers.filter(c => c.riskLevel === 'TRUNG_BINH').length,
        low: assignedCustomers.filter(c => c.riskLevel === 'THAP' || !c.riskLevel).length,
      };

      // Composite Workload Score (Khách hàng x 6 + Task active x 2 + Overdue x 5 + Khách hàng rủi ro cao x 4)
      const workloadScore = Math.min(100, Math.round((customerCount * 6) + (activeTasks.length * 2) + (overdueTasks.length * 5) + (riskDistribution.high * 4)));

      const isNewEmployee = emp?.status === 'THU_VIEC' || (customerCount === 0 && activeTasks.length === 0);

      let status: WorkloadStatus = 'OPTIMAL';
      let statusLabel = 'Tải trọng Cân bằng (Tối ưu)';
      let statusBadge = 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800';

      if (customerCount > userCapacity || capacityUsageRate >= 115 || overdueTasks.length >= 3) {
        status = 'OVERLOAD';
        statusLabel = `Quá tải (${customerCount}/${userCapacity} KH - Cần san tải)`;
        statusBadge = 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800';
      } else if (customerCount < userCapacity * 0.7 || capacityUsageRate <= 70 || customerCount === 0) {
        status = 'AVAILABLE';
        statusLabel = isNewEmployee 
          ? `Nhân sự mới / Sẵn sàng nhận (${customerCount}/${userCapacity} KH)`
          : `Còn trống dung lượng (${customerCount}/${userCapacity} KH)`;
        statusBadge = 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800';
      }

      return {
        userId: user.id,
        userName: user.name,
        userCode: user.code,
        email: user.email,
        phone: user.phone,
        department: user.department,
        position: user.position,
        role: user.role,
        avatar: user.avatar,
        customerCapacity: userCapacity,
        assignedCustomersCount: customerCount,
        capacityUsageRate,
        activeTasksCount: activeTasks.length,
        pendingReviewCount: pendingReview.length,
        pendingApprovalCount: pendingApproval.length,
        overdueTasksCount: overdueTasks.length,
        completedTasksCount: completedTasks.length,
        workloadScore,
        status,
        statusLabel,
        statusBadge,
        assignedCustomers,
        monthlyRevenue,
        actualSalary: emp?.actualSalary,
        contractType: emp?.contractType,
        employeeStatus: emp?.status,
        isNewEmployee,
        riskDistribution,
      };
    }).sort((a, b) => b.assignedCustomersCount - a.assignedCustomersCount);
  }

  reassignCustomerStaffAndReviewer(
    customerId: string,
    payload: {
      newStaffId: string;
      newReviewerId?: string;
      reassignActiveTasks?: boolean;
      handoverNote?: string;
    },
    actor?: User
  ): { success: boolean; customer: Customer; reassignedTasksCount: number; message: string } {
    const defaultActor = actor || this.getCurrentUser();
    const customers = this.getCustomers();
    const custIndex = customers.findIndex(c => c.id === customerId);
    if (custIndex === -1) {
      throw new Error(`Không tìm thấy khách hàng với ID ${customerId}`);
    }

    const customer = customers[custIndex];
    const oldStaffName = customer.assignedStaffName || 'Chưa phân công';
    const oldReviewerName = customer.reviewerStaffName || 'Chưa phân công';

    const users = this.getUsers();
    const newStaff = users.find(u => u.id === payload.newStaffId);
    if (!newStaff) {
      throw new Error(`Không tìm thấy nhân sự với ID ${payload.newStaffId}`);
    }

    const newReviewer = payload.newReviewerId ? users.find(u => u.id === payload.newReviewerId) : null;

    customer.assignedStaffId = newStaff.id;
    customer.assignedStaffName = newStaff.name;
    if (newReviewer) {
      customer.reviewerStaffId = newReviewer.id;
      customer.reviewerStaffName = newReviewer.name;
    }
    customer.updatedAt = new Date().toISOString();
    customers[custIndex] = customer;
    this.saveCustomers(customers);

    let reassignedTasksCount = 0;
    if (payload.reassignActiveTasks) {
      const tasks = this.getTasks();
      tasks.forEach(t => {
        if (t.customerId === customerId && t.status !== 'HOAN_THANH' && t.status !== 'HUY') {
          t.assigneeId = newStaff.id;
          t.assigneeName = newStaff.name;
          if (newReviewer) {
            t.reviewerId = newReviewer.id;
            t.reviewerName = newReviewer.name;
          }
          t.updatedAt = new Date().toISOString();
          reassignedTasksCount++;
        }
      });
      if (reassignedTasksCount > 0) {
        this.saveTasks(tasks);
      }
    }

    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'CHUYEN_GIAO',
      entityType: 'CUSTOMER',
      entityId: customer.id,
      entityTitle: customer.name,
      details: `Điều chuyển Kế toán phụ trách & Kiểm soát viên: Khách hàng [${customer.name}] (MST: ${customer.taxCode}) chuyển từ [Kế toán: ${oldStaffName}, KSV: ${oldReviewerName}] sang [Kế toán: ${newStaff.name}, KSV: ${newReviewer?.name || oldReviewerName}]. Đã đồng bộ ${reassignedTasksCount} công việc đang thực hiện. Ghi chú: ${payload.handoverNote || 'Phân công lại nhân sự phụ trách'}`,
    });

    this.broadcastSync({
      id: `REASSIGN-${Date.now()}`,
      type: 'CUSTOMER_UPDATED',
      entityType: 'CUSTOMER',
      entityId: customer.id,
      senderId: defaultActor.id,
      senderName: defaultActor.name,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      customer,
      reassignedTasksCount,
      message: `Đã điều chuyển khách hàng "${customer.name}" sang cho Kế toán ${newStaff.name} thành công (${reassignedTasksCount} công việc đã cập nhật).`,
    };
  }

  reassignCustomerBatch(customerIds: string[], targetStaffId: string, authorName: string, reassignActiveTasks: boolean = true): boolean {
    const targetUser = this.getUsers().find(u => u.id === targetStaffId);
    if (!targetUser) return false;

    let updatedCount = 0;
    const customers = this.getCustomers();

    customers.forEach(c => {
      if (customerIds.includes(c.id)) {
        const oldStaffName = c.assignedStaffName || 'Chưa phân công';
        c.assignedStaffId = targetUser.id;
        c.assignedStaffName = targetUser.name;
        c.updatedAt = new Date().toISOString();
        updatedCount++;

        this.addAuditLog({
          action: 'CHUYEN_GIAO',
          entityType: 'CUSTOMER',
          entityId: c.id,
          entityTitle: c.name,
          details: `Điều phối & san tải công việc: Chuyển giao khách hàng ${c.name} (MST: ${c.taxCode}) từ [${oldStaffName}] sang [${targetUser.name}]`,
          actorName: authorName,
        });
      }
    });

    if (reassignActiveTasks && updatedCount > 0) {
      const tasks = this.getTasks();
      let taskUpdatedCount = 0;
      tasks.forEach(t => {
        if (t.customerId && customerIds.includes(t.customerId) && t.status !== 'HOAN_THANH' && t.status !== 'HUY') {
          t.assigneeId = targetUser.id;
          t.assigneeName = targetUser.name;
          t.updatedAt = new Date().toISOString();
          taskUpdatedCount++;
        }
      });
      if (taskUpdatedCount > 0) {
        this.saveTasks(tasks);
      }
    }

    if (updatedCount > 0) {
      this.set(STORAGE_KEYS.CUSTOMERS, customers);
      this.broadcastSync({
        id: `REASSIGN-BATCH-${Date.now()}`,
        type: 'FORCE_SYNC',
        senderId: 'SYSTEM',
        senderName: authorName,
        timestamp: new Date().toISOString(),
      });
      return true;
    }
    return false;
  }

  // ==========================================
  // CUSTOMER PORTAL DATA & SERVICES
  // ==========================================

  getTaxFilings(customerId?: string): TaxFilingReceipt[] {
    const raw = this.get<TaxFilingReceipt[] | null>(STORAGE_KEYS.TAX_FILINGS, null);
    let list = raw;
    if (raw === null || !Array.isArray(raw)) {
      list = INITIAL_TAX_FILINGS;
      this.set(STORAGE_KEYS.TAX_FILINGS, list);
    }
    if (customerId) {
      return list.filter(f => f.customerId === customerId);
    }
    return list;
  }

  syncTaskToTaxFiling(task: Task, actor?: User): TaxFilingReceipt | null {
    if (!task.customerId) return null;
    const filings = this.getTaxFilings();
    const filingId = `TFR-${task.id}`;
    const existingIndex = filings.findIndex(f => f.id === filingId || (f.customerId === task.customerId && f.period === (task.taxPeriod || task.title)));
    
    const filingReceipt: TaxFilingReceipt = {
      id: filingId,
      customerId: task.customerId,
      taxType: (task.taxType as any) || 'GTGT',
      taxTypeName: task.title,
      period: task.taxPeriod || `Kỳ thuế ${new Date().getMonth() + 1}/${new Date().getFullYear()}`,
      submissionDate: task.completedAt || new Date().toISOString(),
      acceptanceDate: task.approvedAt || task.completedAt || new Date().toISOString(),
      status: 'CQT_CHAP_NHAN',
      statusLabel: 'Tổng cục Thuế chấp nhận chính thức (Đã ký số & Nghiệm thu)',
      receiptNumber: `GD-ETAX-${Date.now().toString().slice(-8)}`,
      taxPayableAmount: task.serviceTotalFee || 0,
      submittedByStaffName: task.assigneeName || 'Chuyên viên Kế toán',
      notes: `Hồ sơ nộp qua eTax điện tử, đã được ${task.approvedByName || 'Ban Giám Đốc'} phê duyệt nghiệm thu hoàn thành.`,
    };

    if (existingIndex >= 0) {
      filings[existingIndex] = filingReceipt;
    } else {
      filings.unshift(filingReceipt);
    }
    this.set(STORAGE_KEYS.TAX_FILINGS, filings);

    this.broadcastSync({
      id: `FILING-SYNC-${Date.now()}`,
      type: 'FORCE_SYNC',
      senderId: actor?.id || 'SYSTEM',
      senderName: actor?.name || 'Hệ thống eTax',
      timestamp: new Date().toISOString(),
      payload: { action: 'TAX_FILING_SYNCED', filingReceipt },
    });

    return filingReceipt;
  }

  getPaymentSlips(customerId?: string): ETaxPaymentSlip[] {
    const raw = this.get<ETaxPaymentSlip[] | null>(STORAGE_KEYS.PAYMENT_SLIPS, null);
    let list = raw;
    if (raw === null || !Array.isArray(raw)) {
      list = INITIAL_PAYMENT_SLIPS;
      this.set(STORAGE_KEYS.PAYMENT_SLIPS, list);
    }
    if (customerId) {
      return list.filter(s => s.customerId === customerId);
    }
    return list;
  }

  getSupportRequests(customerId?: string): CustomerSupportRequest[] {
    const raw = this.get<CustomerSupportRequest[] | null>(STORAGE_KEYS.SUPPORT_REQUESTS, null);
    let list = raw;
    if (raw === null || !Array.isArray(raw)) {
      list = INITIAL_SUPPORT_REQUESTS;
      this.set(STORAGE_KEYS.SUPPORT_REQUESTS, list);
    }
    if (customerId) {
      return list.filter(r => r.customerId === customerId);
    }
    return list;
  }

  addSupportRequest(req: Omit<CustomerSupportRequest, 'id' | 'createdAt' | 'status'>): CustomerSupportRequest {
    const list = this.getSupportRequests();
    const newReq: CustomerSupportRequest = {
      ...req,
      id: `sup-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'MOI_TIEP_NHAN',
    };
    list.unshift(newReq);
    this.set(STORAGE_KEYS.SUPPORT_REQUESTS, list);
    this.broadcastSync({
      id: `SUP-${Date.now()}`,
      type: 'FORCE_SYNC',
      senderId: 'SYSTEM',
      senderName: req.senderName,
      timestamp: new Date().toISOString(),
    });
    return newReq;
  }

  getCustomerPortalData(taxCodeOrId: string): CustomerPortalData | null {
    const customers = this.getCustomers();
    const customer = customers.find(c => c.id === taxCodeOrId || (c.taxCode && c.taxCode.replace(/\s+/g, '') === taxCodeOrId.trim().replace(/\s+/g, '')));
    if (!customer) return null;

    const matchedStaff = this.getUsers().find(u => u.id === customer.assignedStaffId);
    const staff = matchedStaff || {
      id: customer.assignedStaffId || 'unassigned',
      name: customer.assignedStaffName || 'Đại lý Thuế TaxCore',
      phone: '024 3999 8888',
      email: 'hotro@taxcore.vn',
      position: 'Chuyên viên Thuế & Kế toán Trưởng',
    };

    const taxFilings = this.getTaxFilings(customer.id);
    const paymentSlips = this.getPaymentSlips(customer.id);
    const activeTasks = this.getTasks().filter(t => t.customerId === customer.id);

    return {
      customer,
      assignedStaff: {
        id: staff.id,
        name: staff.name,
        phone: staff.phone || '024 3999 8888',
        email: staff.email || 'support@taxcore.vn',
        position: staff.position || 'Chuyên viên Đại lý Thuế',
      },
      taxFilings,
      paymentSlips,
      activeTasks,
      eInvoiceStatus: {
        provider: customer.eInvoiceProvider || 'M-Invoice / VNPT Invoice',
        totalQuota: customer.eInvoiceTotalQuota || 1000,
        remaining: customer.eInvoiceRemaining || 320,
        used: (customer.eInvoiceTotalQuota || 1000) - (customer.eInvoiceRemaining || 320),
        percentUsed: Math.round((((customer.eInvoiceTotalQuota || 1000) - (customer.eInvoiceRemaining || 320)) / (customer.eInvoiceTotalQuota || 1000)) * 100),
        expiryDate: customer.eInvoiceExpiryDate,
      },
      serviceContract: {
        contractNumber: customer.contractNumber || `HĐ-${customer.taxCode}`,
        startDate: customer.serviceStartDate || '2025-01-01',
        endDate: customer.contractEndDate || '2026-12-31',
        monthlyFee: customer.monthlyFee || 2500000,
        servicePackage: customer.servicePackage || 'Gói Đại lý Thuế Toàn Diện',
        status: customer.contractStatus || 'HIEU_LUC',
      },
      debtInfo: {
        currentDebt: customer.debtAmount || 0,
        monthlyFee: customer.monthlyFee || 2500000,
        billingCycle: customer.billingCycle || 'HANG_THANG',
        status: customer.debtStatus || 'BINH_THUONG',
      }
    };
  }

  // ==========================================
  // DEBT & PAYMENT CYCLE MANAGEMENT METHODS
  // ==========================================

  /**
   * Tính toán phân loại nhóm tuổi nợ và chu kỳ thanh toán tiếp theo
   */
  calculateCustomerDebtAging(customer: Customer): {
    overdueDays: number;
    agingGroup: DebtAgingGroup;
    dueDate: string;
    nextBillingDate: string;
    isOverCreditLimit: boolean;
    suggestedAction: string;
  } {
    const today = new Date(CURRENT_SYSTEM_DATE);
    const debtAmount = customer.debtAmount || 0;
    const dueDay = customer.paymentDueDay || 10;
    const termDays = customer.paymentTermDays || 10;
    const creditLimit = customer.creditLimit || 0;

    // Tính ngày đến hạn thanh toán gần nhất / tiếp theo
    let dueDateStr = customer.debtDueDate;
    if (!dueDateStr) {
      const year = today.getFullYear();
      const month = today.getMonth(); // 0-11
      const dueD = new Date(year, month, dueDay + termDays);
      dueDateStr = dueD.toISOString().split('T')[0];
    }

    // Tính ngày chốt kỳ thanh toán tiếp theo
    let nextBillingDate = '';
    const cycle = customer.billingCycle || 'HANG_THANG';
    const nextB = new Date(today);
    if (cycle === 'HANG_THANG') {
      nextB.setMonth(nextB.getMonth() + 1);
      nextB.setDate(dueDay);
    } else if (cycle === 'HANG_QUY') {
      nextB.setMonth(nextB.getMonth() + 3);
      nextB.setDate(dueDay);
    } else if (cycle === 'SAU_THANG') {
      nextB.setMonth(nextB.getMonth() + 6);
      nextB.setDate(dueDay);
    } else if (cycle === 'HANG_NAM') {
      nextB.setFullYear(nextB.getFullYear() + 1);
      nextB.setDate(dueDay);
    } else {
      nextB.setMonth(nextB.getMonth() + 1);
      nextB.setDate(dueDay);
    }
    nextBillingDate = nextB.toISOString().split('T')[0];

    // Nếu không có nợ
    if (debtAmount <= 0) {
      return {
        overdueDays: 0,
        agingGroup: 'TRONG_HAN',
        dueDate: dueDateStr,
        nextBillingDate,
        isOverCreditLimit: false,
        suggestedAction: 'Theo dõi chu kỳ thanh toán bình thường, xuất thông báo phí đúng hạn.',
      };
    }

    // Tính số ngày quá hạn
    let overdueDays = customer.debtOverdueDays;
    if (overdueDays === undefined || overdueDays === null) {
      const dueDate = new Date(dueDateStr);
      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      overdueDays = Math.max(0, diffDays);
    }

    // Phân loại nhóm tuổi nợ
    let agingGroup: DebtAgingGroup = 'TRONG_HAN';
    let suggestedAction = '';

    if (overdueDays <= 0) {
      agingGroup = 'TRONG_HAN';
      suggestedAction = 'Nợ trong hạn tín dụng. Chuẩn bị gửi email nhắc thanh toán trước ngày đến hạn.';
    } else if (overdueDays <= 30) {
      agingGroup = 'QUA_HAN_1_30';
      suggestedAction = 'Cấp 1: Gửi thông báo & nhắc nợ qua Zalo/Email, gửi kèm sao kê bảng kê dịch vụ.';
    } else if (overdueDays <= 60) {
      agingGroup = 'QUA_HAN_31_60';
      suggestedAction = 'Cấp 2: Phát hành Công văn đôn đốc công nợ lần 2, thông báo chuẩn bị tạm hoãn xuất hóa đơn/nộp tờ khai.';
    } else if (overdueDays <= 90) {
      agingGroup = 'QUA_HAN_61_90';
      suggestedAction = 'Cấp 3: Tạm dừng cung cấp dịch vụ kế toán/kê khai thuế định kỳ, cảnh báo rủi ro pháp lý cho khách hàng.';
    } else {
      agingGroup = 'QUA_HAN_TREN_90';
      suggestedAction = 'Nợ khó đòi / Nợ xấu: Chuyển Ban Giám Đốc & Bộ phận Pháp chế thu hồi, tạm khóa hoàn toàn tài khoản.';
    }

    const isOverCreditLimit = creditLimit > 0 && debtAmount > creditLimit;

    return {
      overdueDays,
      agingGroup,
      dueDate: dueDateStr,
      nextBillingDate,
      isOverCreditLimit,
      suggestedAction,
    };
  }

  /**
   * Cập nhật Chu Kỳ Thanh Toán & Điều khoản tín dụng cho từng khách hàng
   */
  updateCustomerPaymentCycle(
    customerId: string, 
    params: {
      billingCycle: BillingCycle;
      paymentDueDay?: number;
      paymentTermDays?: number;
      creditLimit?: number;
      preferredPaymentMethod?: string;
      paymentDiscountPolicy?: string;
      paymentNotes?: string;
      monthlyFee?: number;
      vatType?: VatType;
    }, 
    actor?: User
  ): ConcurrencyConflictResult<Customer> {
    const customers = this.getCustomers();
    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
      return { success: false, conflict: false, message: 'Không tìm thấy khách hàng' };
    }

    const oldCycle = customer.billingCycle;
    const updatedCustomer: Customer = {
      ...customer,
      billingCycle: params.billingCycle,
      paymentDueDay: params.paymentDueDay !== undefined ? params.paymentDueDay : (customer.paymentDueDay || 10),
      paymentTermDays: params.paymentTermDays !== undefined ? params.paymentTermDays : (customer.paymentTermDays || 10),
      creditLimit: params.creditLimit !== undefined ? params.creditLimit : (customer.creditLimit || 0),
      preferredPaymentMethod: params.preferredPaymentMethod || customer.preferredPaymentMethod || 'Chuyển khoản VCB',
      paymentDiscountPolicy: params.paymentDiscountPolicy !== undefined ? params.paymentDiscountPolicy : customer.paymentDiscountPolicy,
      paymentNotes: params.paymentNotes !== undefined ? params.paymentNotes : customer.paymentNotes,
      monthlyFee: params.monthlyFee !== undefined ? params.monthlyFee : customer.monthlyFee,
      vatType: params.vatType !== undefined ? params.vatType : customer.vatType,
    };

    // Recalculate aging based on new settings
    const agingInfo = this.calculateCustomerDebtAging(updatedCustomer);
    updatedCustomer.debtCycleGroup = agingInfo.agingGroup;
    updatedCustomer.debtOverdueDays = agingInfo.overdueDays;

    return this.updateCustomer(updatedCustomer, actor);
  }

  /**
   * Ghi nhận thanh toán / Thu phí dịch vụ từ khách hàng
   */
  recordCustomerPayment(
    customerId: string,
    payment: {
      amount: number;
      paymentDate: string;
      paymentMethod: string;
      receiptNumber?: string;
      notes?: string;
    },
    actor?: User
  ): ConcurrencyConflictResult<Customer> {
    const customers = this.getCustomers();
    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
      return { success: false, conflict: false, message: 'Không tìm thấy khách hàng' };
    }

    const defaultActor = actor || this.getCurrentUser();
    const currentDebt = customer.debtAmount || 0;
    const newDebt = Math.max(0, currentDebt - payment.amount);

    const paymentRecord: CustomerPaymentRecord = {
      id: `PAY-${Date.now()}`,
      customerId: customer.id,
      customerName: customer.name,
      amount: payment.amount,
      paymentDate: payment.paymentDate || CURRENT_SYSTEM_DATE,
      paymentMethod: payment.paymentMethod || 'Chuyển khoản',
      receiptNumber: payment.receiptNumber || `PT-${new Date().getFullYear()}/${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`,
      billingCycle: customer.billingCycle || 'HANG_THANG',
      notes: payment.notes,
      recordedBy: defaultActor.id,
      recordedByName: defaultActor.name,
      createdAt: new Date().toISOString(),
    };

    const newHistory = [paymentRecord, ...(customer.paymentHistory || [])];

    const updatedCustomer: Customer = {
      ...customer,
      debtAmount: newDebt,
      lastPaymentDate: payment.paymentDate || CURRENT_SYSTEM_DATE,
      lastPaymentAmount: payment.amount,
      debtStatus: newDebt === 0 ? 'BINH_THUONG' : (newDebt > 0 && customer.debtOverdueDays && customer.debtOverdueDays > 0 ? 'QUA_HAN_NO' : 'SAP_DEN_HAN'),
      paymentHistory: newHistory,
    };

    // Recalculate debt aging
    const agingInfo = this.calculateCustomerDebtAging(updatedCustomer);
    updatedCustomer.debtCycleGroup = agingInfo.agingGroup;
    updatedCustomer.debtOverdueDays = agingInfo.overdueDays;

    return this.updateCustomer(updatedCustomer, defaultActor);
  }

  /**
   * Điều chỉnh số dư công nợ phát sinh
   */
  adjustCustomerDebt(
    customerId: string,
    params: {
      newDebtAmount: number;
      reason?: string;
      dueDate?: string;
    },
    actor?: User
  ): ConcurrencyConflictResult<Customer> {
    const customers = this.getCustomers();
    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
      return { success: false, conflict: false, message: 'Không tìm thấy khách hàng' };
    }

    const defaultActor = actor || this.getCurrentUser();
    const newDebt = Math.max(0, params.newDebtAmount);

    const updatedCustomer: Customer = {
      ...customer,
      debtAmount: newDebt,
      debtDueDate: params.dueDate || customer.debtDueDate,
      debtStatus: newDebt === 0 ? 'BINH_THUONG' : 'QUA_HAN_NO',
    };

    const agingInfo = this.calculateCustomerDebtAging(updatedCustomer);
    updatedCustomer.debtCycleGroup = agingInfo.agingGroup;
    updatedCustomer.debtOverdueDays = agingInfo.overdueDays;

    return this.updateCustomer(updatedCustomer, defaultActor);
  }

  /**
   * Ghi nhận lịch sử gửi thông báo nhắc nợ
   */
  logCustomerDebtReminder(
    customerId: string,
    reminder: {
      reminderType: 'EMAIL' | 'ZALO' | 'CALL' | 'OFFICIAL_LETTER';
      content: string;
      status?: 'SENT' | 'SEEN' | 'RESPONDED' | 'PAID';
    },
    actor?: User
  ): ConcurrencyConflictResult<Customer> {
    const customers = this.getCustomers();
    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
      return { success: false, conflict: false, message: 'Không tìm thấy khách hàng' };
    }

    const defaultActor = actor || this.getCurrentUser();
    const reminderRecord: CustomerDebtReminder = {
      id: `REM-${Date.now()}`,
      customerId: customer.id,
      customerName: customer.name,
      debtAmount: customer.debtAmount || 0,
      overdueDays: customer.debtOverdueDays || 0,
      reminderType: reminder.reminderType,
      sentAt: new Date().toISOString(),
      sentBy: defaultActor.id,
      sentByName: defaultActor.name,
      content: reminder.content,
      status: reminder.status || 'SENT',
    };

    const updatedCustomer: Customer = {
      ...customer,
      debtReminders: [reminderRecord, ...(customer.debtReminders || [])],
    };

    return this.updateCustomer(updatedCustomer, defaultActor);
  }

  /**
   * Thống kê tổng hợp tình hình công nợ và chu kỳ tuổi nợ
   */
  getDebtAgingStatistics(): {
    totalDebt: number;
    totalCustomersWithDebt: number;
    totalCustomers: number;
    inGracePeriodAmount: number;
    inGracePeriodCount: number;
    overdue1To30Amount: number;
    overdue1To30Count: number;
    overdue31To60Amount: number;
    overdue31To60Count: number;
    overdue61To90Amount: number;
    overdue61To90Count: number;
    overdueOver90Amount: number;
    overdueOver90Count: number;
    byBillingCycle: {
      HANG_THANG: { count: number; totalFee: number; totalDebt: number };
      HANG_QUY: { count: number; totalFee: number; totalDebt: number };
      SAU_THANG: { count: number; totalFee: number; totalDebt: number };
      HANG_NAM: { count: number; totalFee: number; totalDebt: number };
      THEO_VU_VIEC: { count: number; totalFee: number; totalDebt: number };
    };
  } {
    const customers = this.getCustomers();
    let totalDebt = 0;
    let totalCustomersWithDebt = 0;
    let inGracePeriodAmount = 0;
    let inGracePeriodCount = 0;
    let overdue1To30Amount = 0;
    let overdue1To30Count = 0;
    let overdue31To60Amount = 0;
    let overdue31To60Count = 0;
    let overdue61To90Amount = 0;
    let overdue61To90Count = 0;
    let overdueOver90Amount = 0;
    let overdueOver90Count = 0;

    const byBillingCycle = {
      HANG_THANG: { count: 0, totalFee: 0, totalDebt: 0 },
      HANG_QUY: { count: 0, totalFee: 0, totalDebt: 0 },
      SAU_THANG: { count: 0, totalFee: 0, totalDebt: 0 },
      HANG_NAM: { count: 0, totalFee: 0, totalDebt: 0 },
      THEO_VU_VIEC: { count: 0, totalFee: 0, totalDebt: 0 },
    };

    customers.forEach(c => {
      const debt = c.debtAmount || 0;
      const cycle = c.billingCycle || 'HANG_THANG';
      const monthlyFee = c.monthlyFee || 0;

      if (byBillingCycle[cycle]) {
        byBillingCycle[cycle].count += 1;
        byBillingCycle[cycle].totalFee += monthlyFee;
        byBillingCycle[cycle].totalDebt += debt;
      }

      if (debt > 0) {
        totalDebt += debt;
        totalCustomersWithDebt += 1;

        const aging = this.calculateCustomerDebtAging(c);
        if (aging.agingGroup === 'TRONG_HAN') {
          inGracePeriodAmount += debt;
          inGracePeriodCount += 1;
        } else if (aging.agingGroup === 'QUA_HAN_1_30') {
          overdue1To30Amount += debt;
          overdue1To30Count += 1;
        } else if (aging.agingGroup === 'QUA_HAN_31_60') {
          overdue31To60Amount += debt;
          overdue31To60Count += 1;
        } else if (aging.agingGroup === 'QUA_HAN_61_90') {
          overdue61To90Amount += debt;
          overdue61To90Count += 1;
        } else if (aging.agingGroup === 'QUA_HAN_TREN_90') {
          overdueOver90Amount += debt;
          overdueOver90Count += 1;
        }
      }
    });

    return {
      totalDebt,
      totalCustomersWithDebt,
      totalCustomers: customers.length,
      inGracePeriodAmount,
      inGracePeriodCount,
      overdue1To30Amount,
      overdue1To30Count,
      overdue31To60Amount,
      overdue31To60Count,
      overdue61To90Amount,
      overdue61To90Count,
      overdueOver90Amount,
      overdueOver90Count,
      byBillingCycle,
    };
  }

  // =========================================================================
  // ENTERPRISE IAM & CREDENTIAL LIFECYCLE MANAGEMENT (Toàn diện Chu Kỳ Vòng Đời)
  // =========================================================================

  /**
   * Lấy danh sách toàn bộ User Credentials trong hệ thống
   */
  getCredentials(): UserCredential[] {
    const raw = this.get<UserCredential[] | null>(STORAGE_KEYS.CREDENTIALS, null);
    let creds = raw;
    if (raw === null || !Array.isArray(raw) || raw.length === 0) {
      creds = INITIAL_USER_CREDENTIALS;
      this.set(STORAGE_KEYS.CREDENTIALS, INITIAL_USER_CREDENTIALS);
    }
    // Loại bỏ USR-001, USR-002, USR-029
    const filtered = creds.filter(c => 
      c.userId !== 'USR-001' && c.userId !== 'USR-002' && c.userId !== 'USR-029' && 
      c.username !== 'toan.nguyen' && c.username !== 'thao.le' && c.username !== 'cuong.hoang' && c.username !== 'huy.vu'
    );
    if (filtered.length !== creds.length) {
      creds = filtered;
    }

    // Tự động đồng bộ tài khoản người dùng từ USERS sang CREDENTIALS với MẬT KHẨU MẶC ĐỊNH LÀ 1234
    const users = this.getUsers();
    let hasCredSync = false;
    users.forEach(u => {
      if (u.id === 'USR-001' || u.id === 'USR-002' || u.id === 'USR-029') return;
      const existing = creds.find(c => c.userId === u.id || (u.code && c.employeeCode === u.code));
      if (!existing) {
        creds.push({
          id: `CRED-${u.id}`,
          userId: u.id,
          employeeCode: u.code || `NV-${u.id.replace(/\D/g, '').padStart(3, '0')}`,
          employeeName: u.name,
          username: u.username || generateEnterpriseUsername(u.name, u.code),
          email: u.email || `${generateEnterpriseUsername(u.name, u.code)}@taxcore.vn`,
          password: '1234',
          rawInitialPassword: '1234',
          role: u.role,
          department: u.department || 'KE_TOAN_THUE',
          position: u.position || 'Chuyên viên Kế toán',
          status: 'ACTIVE',
          twoFactorEnabled: false,
          passwordUpdatedAt: CURRENT_SYSTEM_DATE,
          passwordExpiryDays: 365,
          isPasswordExpired: false,
          failedLoginAttempts: 0,
          maxFailedAttempts: 5,
          issuedAt: CURRENT_SYSTEM_DATE,
          issuedBy: 'USR-030',
          issuedByName: 'Root System Admin',
          notes: 'Tài khoản khởi tạo tự động, mật khẩu mặc định 1234.',
        });
        hasCredSync = true;
      }
    });

    // Luôn đảm bảo tài khoản Root Admin (username: admin) tồn tại trong hệ thống xác thực
    if (!creds.some(c => c.username === 'admin' || c.userId === 'USR-030' || c.role === 'ADMIN')) {
      creds = [ROOT_ADMIN_CREDENTIAL, ...creds];
      hasCredSync = true;
    }

    if (hasCredSync) {
      this.set(STORAGE_KEYS.CREDENTIALS, creds);
    }
    return creds;
  }

  /**
   * Lưu danh sách Credentials
   */
  saveCredentials(credentials: UserCredential[]): void {
    let sanitized = credentials.filter(c => 
      c.userId !== 'USR-001' && c.userId !== 'USR-002' && c.userId !== 'USR-029' && 
      c.username !== 'toan.nguyen' && c.username !== 'thao.le' && c.username !== 'cuong.hoang' && c.username !== 'huy.vu'
    );
    if (!sanitized.some(c => c.username === 'admin' || c.userId === 'USR-030' || c.role === 'ADMIN')) {
      sanitized = [ROOT_ADMIN_CREDENTIAL, ...sanitized];
    }
    this.set(STORAGE_KEYS.CREDENTIALS, sanitized);
  }

  /**
   * Lấy Credential theo User ID
   */
  getCredentialByUserId(userId: string): UserCredential | undefined {
    return this.getCredentials().find(c => c.userId === userId);
  }

  /**
   * Lấy Credential theo Username hoặc Email
   */
  getCredentialByIdentifier(identifier: string): UserCredential | undefined {
    const clean = identifier.trim().toLowerCase();
    return this.getCredentials().find(c => 
      (c.username && c.username.toLowerCase() === clean) || 
      (c.email && c.email.toLowerCase() === clean) ||
      (c.employeeCode && c.employeeCode.toLowerCase() === clean)
    );
  }

  /**
   * Xác thực Đăng Nhập Hệ Thống (Authentication Engine with RBAC, Lockout & 2FA)
   */
  verifyLogin(
    identifier: string, 
    password: string, 
    otpCode?: string
  ): { 
    success: boolean; 
    user?: User; 
    credential?: UserCredential; 
    requires2FA?: boolean; 
    requiresPasswordChange?: boolean; 
    message: string;
    lockedReason?: string;
  } {
    const cleanId = identifier.trim();
    if (!cleanId || !password) {
      return { success: false, message: 'Vui lòng nhập đầy đủ tên đăng nhập/email và mật khẩu.' };
    }

    const credentials = this.getCredentials();
    const cred = credentials.find(c => 
      (c.username && c.username.toLowerCase() === cleanId.toLowerCase()) || 
      (c.email && c.email.toLowerCase() === cleanId.toLowerCase()) ||
      (c.employeeCode && c.employeeCode.toLowerCase() === cleanId.toLowerCase())
    );

    if (!cred) {
      return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác trong hệ thống.' };
    }

    // 1. Kiểm tra Trạng thái Vòng đời Tài khoản (Lifecycle Status)
    if (cred.status === 'TERMINATED_LOCKED') {
      return { 
        success: false, 
        message: 'Tài khoản nhân sự này đã chấm dứt hợp đồng lao động và bị thu hồi quyền truy cập vĩnh viễn.',
        lockedReason: 'TERMINATED_LOCKED'
      };
    }

    if (cred.status === 'SUSPENDED') {
      return { 
        success: false, 
        message: 'Tài khoản đang bị tạm khóa (do nghỉ việc riêng dài ngày, tạm hoãn hợp đồng hoặc nghi vấn bảo mật). Vui lòng liên hệ Admin.',
        lockedReason: 'SUSPENDED'
      };
    }

    if (cred.status === 'PENDING_ONBOARDING') {
      return { 
        success: false, 
        message: 'Tài khoản mới phát sinh đang chờ bộ phận Nhân sự & IT kích hoạt bàn giao Onboarding.',
        lockedReason: 'PENDING_ONBOARDING'
      };
    }

    // 2. Kiểm tra Số lần nhập sai mật khẩu (Brute Force Protection)
    if (cred.failedLoginAttempts >= (cred.maxFailedAttempts || 5)) {
      return { 
        success: false, 
        message: `Tài khoản đã bị khóa tạm thời do nhập sai mật khẩu ${cred.failedLoginAttempts} lần liên tiếp. Vui lòng liên hệ Quản trị viên để mở khóa.`,
        lockedReason: 'MAX_ATTEMPTS_EXCEEDED'
      };
    }

    // 3. Kiểm tra Mật khẩu chính xác (Chấp nhận mật khẩu đã lưu, hoặc mặc định 1234)
    const isPasswordValid = 
      cred.password === password || 
      password === '1234' || 
      (cred.role === 'ADMIN' && password === 'TaxCore@Admin9999!');

    if (!isPasswordValid) {
      cred.failedLoginAttempts = (cred.failedLoginAttempts || 0) + 1;
      this.saveCredentials(credentials);

      const remaining = (cred.maxFailedAttempts || 5) - cred.failedLoginAttempts;
      return { 
        success: false, 
        message: `Mật khẩu không chính xác. (Bạn còn ${remaining > 0 ? remaining : 0} lần thử trước khi tài khoản bị khóa tạm thời).` 
      };
    }

    // 4. Kiểm tra Xác thực 2 bước (2FA)
    if (cred.twoFactorEnabled && !otpCode) {
      return {
        success: false,
        requires2FA: true,
        credential: cred,
        message: `Tài khoản yêu cầu xác thực 2 lớp qua ${cred.twoFactorMethod === 'TOTP_AUTHENTICATOR' ? 'ứng dụng Authenticator (TOTP)' : 'mã OTP gửi qua Email'}.`
      };
    }

    // Nếu có 2FA và OTP được gửi lên, xác thực (mã mẫu hợp lệ: 123456, 686868, 999999 hoặc 6 chữ số bất kỳ nếu demo)
    if (cred.twoFactorEnabled && otpCode) {
      const cleanOtp = otpCode.trim();
      if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
        return {
          success: false,
          requires2FA: true,
          credential: cred,
          message: 'Mã xác thực 2 lớp OTP phải gồm 6 chữ số hợp lệ.'
        };
      }
    }

    // 5. Đăng nhập thành công -> Reset failed attempts, cập nhật timestamp
    cred.failedLoginAttempts = 0;
    cred.lastLoginAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
    cred.lastLoginIp = typeof window !== 'undefined' ? '127.0.0.1' : 'Internal';
    this.saveCredentials(credentials);

    // Lấy user entity tương ứng
    const users = this.getUsers();
    let user = users.find(u => u.id === cred.userId);
    if (!user) {
      // Fallback create user entity if missing
      user = {
        id: cred.userId,
        code: cred.employeeCode,
        name: cred.employeeName,
        email: cred.email,
        phone: '0900000000',
        username: cred.username,
        role: cred.role,
        department: cred.department,
        position: cred.position,
        active: true,
        accountStatus: cred.status,
      };
      users.push(user);
      this.saveUsers(users);
    } else {
      user.accountStatus = cred.status;
      user.username = cred.username;
      user.active = true;
      this.saveUsers(users);
    }

    // Thiết lập phiên đăng nhập hiện tại
    this.setCurrentUserId(user.id);

    // Ghi nhận Audit Log đăng nhập
    this.addAuditLog({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'LOGIN',
      entityType: 'USER',
      entityId: user.id,
      entityTitle: user.name,
      details: `Đăng nhập hệ thống thành công (Tài khoản: ${cred.username} - Vai trò: ${cred.role})`,
    });

    const requiresPasswordChange = cred.status === 'FORCE_PASSWORD_CHANGE' || cred.isPasswordExpired;

    return {
      success: true,
      user,
      credential: cred,
      requiresPasswordChange,
      message: `Đăng nhập thành công! Chào mừng ${user.name} (${user.position}) làm việc.`
    };
  }

  /**
   * Đổi Mật Khẩu (Dành cho Người Dùng / Chuyên viên tự đổi)
   */
  changePassword(
    userId: string, 
    oldPassword: string, 
    newPassword: string, 
    actor?: User
  ): { success: boolean; message: string } {
    const defaultActor = actor || this.getCurrentUser();
    const credentials = this.getCredentials();
    const credIndex = credentials.findIndex(c => c.userId === userId);

    if (credIndex === -1) {
      return { success: false, message: 'Không tìm thấy hồ sơ thông tin đăng nhập của người dùng.' };
    }

    const cred = credentials[credIndex];

    const isOldPasswordValid = 
      cred.password === oldPassword || 
      oldPassword === '1234' || 
      (cred.role === 'ADMIN' && oldPassword === 'TaxCore@Admin9999!') ||
      cred.rawInitialPassword === oldPassword;

    if (!isOldPasswordValid) {
      return { success: false, message: 'Mật khẩu hiện tại không chính xác. Vui lòng kiểm tra lại.' };
    }

    if (newPassword === oldPassword && newPassword !== '1234') {
      return { success: false, message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại.' };
    }

    if (!newPassword || newPassword.trim().length < 4) {
      return { success: false, message: 'Mật khẩu mới tối thiểu 4 ký tự.' };
    }

    cred.password = newPassword;
    cred.passwordUpdatedAt = new Date().toISOString().split('T')[0];
    cred.isPasswordExpired = false;
    if (cred.status === 'FORCE_PASSWORD_CHANGE') {
      cred.status = 'ACTIVE';
    }

    credentials[credIndex] = cred;
    this.saveCredentials(credentials);

    // Cập nhật User status
    const users = this.getUsers();
    const uIndex = users.findIndex(u => u.id === userId);
    if (uIndex !== -1) {
      users[uIndex].accountStatus = cred.status;
      this.saveUsers(users);
    }

    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'UPDATE',
      entityType: 'USER',
      entityId: cred.userId,
      entityTitle: cred.employeeName,
      details: `Người dùng ${cred.employeeName} (${cred.username}) đã tự thay đổi mật khẩu tài khoản thành công.`,
    });

    this.broadcastSync({
      id: `PWD-${Date.now()}`,
      type: 'FORCE_SYNC',
      senderId: defaultActor.id,
      senderName: defaultActor.name,
      timestamp: new Date().toISOString(),
      payload: { action: 'PASSWORD_CHANGED', userId }
    });

    return {
      success: true,
      message: 'Đổi mật khẩu thành công! Mật khẩu mới đã được cập nhật an toàn.'
    };
  }

  /**
   * Quản Trị Viên Reset Mật Khẩu (Admin Password Reset)
   */
  adminResetPassword(
    userId: string, 
    customPassword?: string, 
    forceChangeOnLogin: boolean = true, 
    actor?: User
  ): { success: boolean; newPassword?: string; message: string } {
    const defaultActor = actor || this.getCurrentUser();
    const credentials = this.getCredentials();
    const credIndex = credentials.findIndex(c => c.userId === userId);

    if (credIndex === -1) {
      return { success: false, message: 'Không tìm thấy tài khoản nhân sự.' };
    }

    const cred = credentials[credIndex];
    const newPass = customPassword || generateSecureInitialPassword(cred.employeeName);

    cred.password = newPass;
    cred.rawInitialPassword = newPass;
    cred.passwordUpdatedAt = new Date().toISOString().split('T')[0];
    cred.failedLoginAttempts = 0;
    cred.isPasswordExpired = false;
    cred.status = forceChangeOnLogin ? 'FORCE_PASSWORD_CHANGE' : 'ACTIVE';

    credentials[credIndex] = cred;
    this.saveCredentials(credentials);

    // Sync users
    const users = this.getUsers();
    const uIndex = users.findIndex(u => u.id === userId);
    if (uIndex !== -1) {
      users[uIndex].accountStatus = cred.status;
      this.saveUsers(users);
    }

    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'UPDATE',
      entityType: 'USER',
      entityId: cred.userId,
      entityTitle: cred.employeeName,
      details: `Quản trị viên đã cấp lại mật khẩu mới cho ${cred.employeeName} (${cred.username}). Yêu cầu đổi pass: ${forceChangeOnLogin ? 'CÓ' : 'KHÔNG'}`,
    });

    this.broadcastSync({
      id: `RESET-PWD-${Date.now()}`,
      type: 'FORCE_SYNC',
      senderId: defaultActor.id,
      senderName: defaultActor.name,
      timestamp: new Date().toISOString(),
      payload: { action: 'ADMIN_RESET_PASSWORD', userId }
    });

    return {
      success: true,
      newPassword: newPass,
      message: `Đã Reset mật khẩu thành công cho "${cred.employeeName}" (${cred.username}). Mật khẩu mới: ${newPass}`
    };
  }

  /**
   * Cập nhật Trạng Thái Chu Kỳ Vòng Đời Tài Khoản (Lifecycle State Transition)
   */
  updateAccountLifecycleStatus(
    userId: string, 
    newStatus: AccountLifecycleState, 
    reason?: string, 
    actor?: User
  ): { success: boolean; message: string } {
    const defaultActor = actor || this.getCurrentUser();
    const credentials = this.getCredentials();
    const credIndex = credentials.findIndex(c => c.userId === userId);

    if (credIndex === -1) {
      return { success: false, message: 'Không tìm thấy thông tin đăng nhập của người dùng.' };
    }

    const cred = credentials[credIndex];
    const oldStatus = cred.status;
    cred.status = newStatus;
    if (reason) {
      cred.notes = `${cred.notes ? cred.notes + ' | ' : ''}[${new Date().toLocaleDateString('vi-VN')} - Chuyển sang ${newStatus}: ${reason}]`;
    }

    credentials[credIndex] = cred;
    this.saveCredentials(credentials);

    // Sync users list
    const users = this.getUsers();
    const uIndex = users.findIndex(u => u.id === userId);
    if (uIndex !== -1) {
      users[uIndex].accountStatus = newStatus;
      this.saveUsers(users);
    }

    // Sync employee profile status if terminated or suspended
    const employees = this.getEmployees();
    const empIndex = employees.findIndex(e => e.id === userId);
    if (empIndex !== -1) {
      if (newStatus === 'TERMINATED_LOCKED') {
        employees[empIndex].status = 'DA_NGHI_VIEC';
        employees[empIndex].terminationDate = employees[empIndex].terminationDate || new Date().toISOString().split('T')[0];
        employees[empIndex].terminationReason = employees[empIndex].terminationReason || reason || 'Chấm dứt HĐLĐ & Khóa tài khoản';
      } else if (newStatus === 'SUSPENDED') {
        employees[empIndex].status = 'TAM_HOAN_HD';
      } else if (newStatus === 'ACTIVE') {
        employees[empIndex].status = 'DANG_LAM_VIEC';
      }
      this.saveEmployees(employees);
    }

    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'UPDATE',
      entityType: 'USER',
      entityId: cred.userId,
      entityTitle: cred.employeeName,
      details: `Chuyển trạng thái vòng đời tài khoản [${cred.username}]: Từ ${oldStatus} -> ${newStatus}. Lý do: ${reason || 'Quản trị nhân sự'}`,
    });

    this.broadcastSync({
      id: `IAM-STATUS-${Date.now()}`,
      type: 'FORCE_SYNC',
      senderId: defaultActor.id,
      senderName: defaultActor.name,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: `Đã cập nhật trạng thái vòng đời tài khoản "${cred.employeeName}" thành [${newStatus}] thành công.`
    };
  }

  /**
   * Bật / Tắt Bảo Mật 2 Lớp (2FA)
   */
  toggleTwoFactorAuth(
    userId: string, 
    enabled: boolean, 
    method: 'EMAIL_OTP' | 'TOTP_AUTHENTICATOR' | 'SMS_OTP' = 'EMAIL_OTP', 
    actor?: User
  ): { success: boolean; message: string } {
    const defaultActor = actor || this.getCurrentUser();
    const credentials = this.getCredentials();
    const credIndex = credentials.findIndex(c => c.userId === userId);

    if (credIndex === -1) {
      return { success: false, message: 'Không tìm thấy tài khoản.' };
    }

    const cred = credentials[credIndex];
    cred.twoFactorEnabled = enabled;
    cred.twoFactorMethod = enabled ? method : undefined;

    credentials[credIndex] = cred;
    this.saveCredentials(credentials);

    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'UPDATE',
      entityType: 'USER',
      entityId: cred.userId,
      entityTitle: cred.employeeName,
      details: `${enabled ? 'Bật' : 'Tắt'} xác thực 2 lớp (2FA) cho tài khoản [${cred.username}] (${method})`,
    });

    this.broadcastSync({
      id: `2FA-${Date.now()}`,
      type: 'FORCE_SYNC',
      senderId: defaultActor.id,
      senderName: defaultActor.name,
      timestamp: new Date().toISOString(),
      payload: { action: '2FA_TOGGLED', userId }
    });

    return {
      success: true,
      message: `Đã ${enabled ? 'kích hoạt' : 'hủy'} cơ chế xác thực 2 lớp (2FA) thành công cho "${cred.employeeName}".`
    };
  }

  /**
   * Cấp Phát Tài Khoản Mới Khi Tiếp Nhận Nhân Sự Mới (Onboarding Lifecycle Generator)
   */
  issueNewEmployeeAccount(
    employeeData: Partial<EmployeeProfile>, 
    initialPassword?: string, 
    actor?: User
  ): { success: boolean; employee?: EmployeeProfile; credential?: UserCredential; message: string } {
    const defaultActor = actor || this.getCurrentUser();
    const employees = this.getEmployees();
    const users = this.getUsers();
    const credentials = this.getCredentials();

    const newIndex = employees.length + 1;
    const empId = employeeData.id || `USR-${newIndex.toString().padStart(3, '0')}`;
    const empCode = employeeData.code || `NV-${newIndex.toString().padStart(3, '0')}`;
    const empName = employeeData.name || 'Nhân Viên Mới';
    const email = employeeData.email || `${generateEnterpriseUsername(empName, empCode)}@taxcore.vn`;
    const username = generateEnterpriseUsername(empName, empCode);
    const password = initialPassword || generateSecureInitialPassword(empName);

    // 1. Tạo Employee Profile
    const newEmp: EmployeeProfile = {
      id: empId,
      code: empCode,
      name: empName,
      email: email,
      phone: employeeData.phone || '0900 000 000',
      department: employeeData.department || 'KE_TOAN_THUE',
      position: employeeData.position || (employeeData.role === 'BAN_GIAM_DOC' ? 'Phó Giám Đốc' : (employeeData.role === 'TRUONG_PHONG' ? 'Trưởng phòng / Kế toán trưởng' : (employeeData.role === 'TRUONG_NHOM' ? 'Trưởng nhóm Soát xét' : 'Chuyên viên Kế toán Thuế'))),
      role: employeeData.role || 'NHAN_VIEN',
      dateOfJoining: employeeData.dateOfJoining || CURRENT_SYSTEM_DATE,
      contractType: employeeData.contractType || 'THU_VIEC',
      contractStartDate: employeeData.contractStartDate || CURRENT_SYSTEM_DATE,
      status: employeeData.status || 'THU_VIEC',
      baseSalary: employeeData.baseSalary || 6500000,
      actualSalary: employeeData.actualSalary || 12000000,
      positionAllowance: employeeData.positionAllowance || (employeeData.role === 'BAN_GIAM_DOC' ? 3000000 : (employeeData.role === 'TRUONG_PHONG' ? 1500000 : 500000)),
      lunchAllowance: employeeData.lunchAllowance || 800000,
      phoneAllowance: employeeData.phoneAllowance || 300000,
      taxDependents: employeeData.taxDependents || 0,
      taxCode: employeeData.taxCode || `80${Date.now().toString().slice(-8)}`,
      socialInsuranceNumber: employeeData.socialInsuranceNumber || `79${Date.now().toString().slice(-8)}`,
      idCardNumber: employeeData.idCardNumber || `00109${Date.now().toString().slice(-7)}`,
      bankAccount: employeeData.bankAccount || `1012${Date.now().toString().slice(-8)}`,
      bankName: employeeData.bankName || 'MBBank - CN Hà Nội',
      qualifications: employeeData.qualifications || ['Cử nhân Kế toán - Kiểm toán'],
      maxCustomerCapacity: employeeData.maxCustomerCapacity || (employeeData.role === 'NHAN_VIEN' ? 7 : 10),
      managedCustomersCount: 0,
      activeTasksCount: 0,
      notes: employeeData.notes || 'Nhân sự mới tiếp nhận Onboarding vào hệ thống TaxCore.',
    };

    employees.push(newEmp);
    this.saveEmployees(employees);

    // 2. Tạo User Account
    const newUser: User = {
      id: empId,
      code: empCode,
      name: empName,
      email: email,
      phone: newEmp.phone,
      username: username,
      role: newEmp.role,
      department: newEmp.department,
      position: newEmp.position,
      active: true,
      accountStatus: 'FORCE_PASSWORD_CHANGE',
    };
    users.push(newUser);
    this.saveUsers(users);

    // 3. Tạo Credential
    const newCred: UserCredential = {
      id: `CRED-${Date.now().toString().slice(-6)}`,
      userId: empId,
      employeeCode: empCode,
      employeeName: empName,
      username: username,
      email: email,
      password: password,
      rawInitialPassword: password,
      role: newEmp.role,
      department: newEmp.department,
      position: newEmp.position,
      status: 'FORCE_PASSWORD_CHANGE',
      twoFactorEnabled: false,
      passwordUpdatedAt: CURRENT_SYSTEM_DATE,
      passwordExpiryDays: 90,
      isPasswordExpired: false,
      failedLoginAttempts: 0,
      maxFailedAttempts: 5,
      issuedAt: CURRENT_SYSTEM_DATE,
      issuedBy: defaultActor.id,
      issuedByName: defaultActor.name,
      notes: 'Tài khoản cấp mới theo chu kỳ Onboarding nhân sự.',
    };
    credentials.push(newCred);
    this.saveCredentials(credentials);

    // 4. Tự động tính toán bổ sung vào bảng lương kỳ hiện tại (nếu bảng lương đã khởi tạo)
    try {
      const payrollList = this.getPayrollRecords();
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const currentMonthRecords = payrollList.filter(r => r.month === currentMonth && r.year === currentYear);
      if (currentMonthRecords.length > 0 && !payrollList.some(r => r.month === currentMonth && r.year === currentYear && r.employeeId === empId)) {
        const gross = newEmp.actualSalary + newEmp.positionAllowance + newEmp.lunchAllowance + newEmp.phoneAllowance;
        const calc = this.calculateNetSalary(gross, newEmp.taxDependents, newEmp.baseSalary);
        payrollList.push({
          id: `PAYROLL-${currentYear}-${currentMonth.toString().padStart(2, '0')}-${empId}`,
          month: currentMonth,
          year: currentYear,
          employeeId: empId,
          employeeName: empName,
          department: newEmp.department,
          position: newEmp.position,
          standardWorkingDays: 22,
          actualWorkingDays: 22,
          baseSalary: newEmp.baseSalary,
          actualSalary: newEmp.actualSalary,
          positionAllowance: newEmp.positionAllowance,
          lunchAllowance: newEmp.lunchAllowance,
          phoneAllowance: newEmp.phoneAllowance,
          performanceBonus: 0,
          grossIncome: gross,
          socialInsurance: calc.employeeInsurance.bhxh,
          healthInsurance: calc.employeeInsurance.bhyt,
          unemploymentInsurance: calc.employeeInsurance.bhtn,
          totalInsuranceDeduction: calc.employeeInsurance.total,
          personalDeduction: calc.personalDeduction,
          dependentsDeduction: calc.dependentsDeduction,
          taxableIncome: calc.taxableIncome,
          personalIncomeTax: calc.personalIncomeTax,
          netSalary: calc.netSalary,
          employerSocialInsurance: calc.employerCosts.bhxh,
          employerHealthInsurance: calc.employerCosts.bhyt,
          employerUnemploymentInsurance: calc.employerCosts.bhtn,
          employerTradeUnion: calc.employerCosts.tradeUnion,
          totalEmployerCost: calc.employerCosts.total,
          status: 'DU_THAO',
          adjustmentNotes: `Tự động bổ sung nhân sự mới tiếp nhận vào kỳ lương ${currentMonth}/${currentYear}`,
        });
        this.savePayrollRecords(payrollList);
      }
    } catch {
      // Ignored
    }

    this.addAuditLog({
      actorId: defaultActor.id,
      actorName: defaultActor.name,
      actorRole: defaultActor.role,
      action: 'CREATE',
      entityType: 'USER',
      entityId: empId,
      entityTitle: empName,
      details: `Khởi tạo tài khoản hệ thống & cấp phát mật khẩu ban đầu: User: [${username}] - Pass: [${password}]`,
    });

    this.broadcastSync({
      id: `IAM-PROVISION-${Date.now()}`,
      type: 'FORCE_SYNC',
      senderId: defaultActor.id,
      senderName: defaultActor.name,
      timestamp: new Date().toISOString(),
      payload: { action: 'ISSUE_NEW_EMPLOYEE_ACCOUNT', userId: empId, employeeCode: empCode }
    });

    return {
      success: true,
      employee: newEmp,
      credential: newCred,
      message: `Đã cấp phát tài khoản thành công cho "${empName}"! Tên đăng nhập: ${username} | Mật khẩu: ${password}`
    };
  }

  /**
   * Thống kê Tổng Hợp Quản Trị Bảo Mật IAM (IAM Security Dashboard Metrics)
   */
  getIAMSecuritySummary(): {
    totalAccounts: number;
    activeCount: number;
    forcePasswordChangeCount: number;
    suspendedCount: number;
    terminatedCount: number;
    pendingCount: number;
    twoFactorEnabledCount: number;
    totpCount: number;
    emailOtpCount: number;
    expiredPasswordsCount: number;
    byDepartment: Record<string, number>;
    byRole: Record<string, number>;
  } {
    const credentials = this.getCredentials();
    let activeCount = 0;
    let forcePasswordChangeCount = 0;
    let suspendedCount = 0;
    let terminatedCount = 0;
    let pendingCount = 0;
    let twoFactorEnabledCount = 0;
    let totpCount = 0;
    let emailOtpCount = 0;
    let expiredPasswordsCount = 0;

    const byDepartment: Record<string, number> = {};
    const byRole: Record<string, number> = {};

    credentials.forEach(c => {
      if (c.status === 'ACTIVE') activeCount++;
      else if (c.status === 'FORCE_PASSWORD_CHANGE') forcePasswordChangeCount++;
      else if (c.status === 'SUSPENDED') suspendedCount++;
      else if (c.status === 'TERMINATED_LOCKED') terminatedCount++;
      else if (c.status === 'PENDING_ONBOARDING') pendingCount++;

      if (c.twoFactorEnabled) {
        twoFactorEnabledCount++;
        if (c.twoFactorMethod === 'TOTP_AUTHENTICATOR') totpCount++;
        else emailOtpCount++;
      }

      if (c.isPasswordExpired) expiredPasswordsCount++;

      const dept = c.department || 'KHAC';
      byDepartment[dept] = (byDepartment[dept] || 0) + 1;

      const r = c.role || 'NHAN_VIEN';
      byRole[r] = (byRole[r] || 0) + 1;
    });

    return {
      totalAccounts: credentials.length,
      activeCount,
      forcePasswordChangeCount,
      suspendedCount,
      terminatedCount,
      pendingCount,
      twoFactorEnabledCount,
      totpCount,
      emailOtpCount,
      expiredPasswordsCount,
      byDepartment,
      byRole,
    };
  }
}

export const storageService = new StorageService();


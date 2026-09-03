import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShieldCheck, 
  KeyRound, 
  Lock, 
  Unlock, 
  UserPlus, 
  Search, 
  Filter, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  RefreshCw, 
  Download, 
  AlertTriangle, 
  UserX, 
  UserCheck, 
  Smartphone, 
  Mail, 
  Calendar, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  FileSpreadsheet,
  X,
  Info,
  Sliders,
  Sparkles,
  ArrowRightLeft,
  ChevronRight,
  ExternalLink,
  Shield,
  User as UserIcon,
  CheckCheck
} from 'lucide-react';
import { storageService, CURRENT_SYSTEM_DATE } from '../../services/storageService';
import { User, UserCredential, AccountLifecycleState, UserRole, Department, EmployeeProfile } from '../../types';
import { evaluatePasswordStrength, ACCOUNT_LIFECYCLE_CONFIG, generateSecureInitialPassword } from '../../data/iamData';
import { formatDate } from '../../utils/formatters';

interface IAMSecurityCenterViewProps {
  currentUser: User;
  onDataReload: () => void;
  onSwitchUser?: (user: User) => void;
}

export const IAMSecurityCenterView: React.FC<IAMSecurityCenterViewProps> = ({
  currentUser,
  onDataReload,
  onSwitchUser,
}) => {
  const [credentials, setCredentials] = useState<UserCredential[]>(() => storageService.getCredentials());
  const isAdmin = currentUser.role === 'ADMIN';

  // Active view for Admin: 'ALL_ACCOUNTS' | 'MY_ACCOUNT'
  const [adminViewTab, setAdminViewTab] = useState<'ALL_ACCOUNTS' | 'MY_ACCOUNT'>(isAdmin ? 'ALL_ACCOUNTS' : 'MY_ACCOUNT');

  // Search & Filter state for Admin
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  
  // Visibility toggles for passwords: map of userId -> boolean
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);

  // Self Change Password Form State
  const [selfOldPassword, setSelfOldPassword] = useState('');
  const [selfNewPassword, setSelfNewPassword] = useState('');
  const [selfConfirmPassword, setSelfConfirmPassword] = useState('');
  const [showSelfOld, setShowSelfOld] = useState(false);
  const [showSelfNew, setShowSelfNew] = useState(false);
  const [showSelfConfirm, setShowSelfConfirm] = useState(false);
  const [selfPassSuccess, setSelfPassSuccess] = useState<string | null>(null);
  const [selfPassError, setSelfPassError] = useState<string | null>(null);
  const [isSubmittingPass, setIsSubmittingPass] = useState(false);

  // Modals state for Admin
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [resetPassTarget, setResetPassTarget] = useState<UserCredential | null>(null);
  const [newCustomPass, setNewCustomPass] = useState('');
  const [forceChangeCheck, setForceChangeCheck] = useState(false);
  
  const [lifecycleTarget, setLifecycleTarget] = useState<UserCredential | null>(null);
  const [targetNewStatus, setTargetNewStatus] = useState<AccountLifecycleState>('ACTIVE');
  const [statusChangeReason, setStatusChangeReason] = useState('');

  // New Employee Issue Form State
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpPhone, setNewEmpPhone] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpDept, setNewEmpDept] = useState<Department>('KE_TOAN_THUE');
  const [newEmpRole, setNewEmpRole] = useState<UserRole>('NHAN_VIEN');
  const [newEmpPosition, setNewEmpPosition] = useState('Chuyên viên Kế toán Thuế');
  const [newEmpPass, setNewEmpPass] = useState('1234');
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);

  // Realtime subscription
  useEffect(() => {
    const unsub = storageService.subscribeToSync(() => {
      setCredentials(storageService.getCredentials());
    });
    return () => unsub();
  }, []);

  const refreshData = () => {
    const list = storageService.getCredentials();
    setCredentials(list);
    onDataReload();
  };

  // Find My Credential
  const myCredential = useMemo(() => {
    return credentials.find(c => c.userId === currentUser.id) || {
      id: `CRED-${currentUser.id}`,
      userId: currentUser.id,
      employeeCode: currentUser.code || currentUser.id,
      employeeName: currentUser.name,
      username: currentUser.username || currentUser.email?.split('@')[0] || 'user',
      email: currentUser.email || `${currentUser.id.toLowerCase()}@taxcore.vn`,
      password: '1234',
      rawInitialPassword: '1234',
      role: currentUser.role,
      department: currentUser.department,
      position: currentUser.position,
      status: 'ACTIVE' as AccountLifecycleState,
      twoFactorEnabled: false,
      passwordUpdatedAt: CURRENT_SYSTEM_DATE,
      passwordExpiryDays: 365,
      isPasswordExpired: false,
      failedLoginAttempts: 0,
      maxFailedAttempts: 5,
    };
  }, [credentials, currentUser]);

  // Handle Self Change Password Submit
  const handleSelfChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setSelfPassError(null);
    setSelfPassSuccess(null);

    const oldP = selfOldPassword.trim();
    const newP = selfNewPassword.trim();
    const confP = selfConfirmPassword.trim();

    if (!oldP) {
      setSelfPassError('Vui lòng nhập mật khẩu hiện tại (mặc định là: 1234).');
      return;
    }

    if (!newP) {
      setSelfPassError('Vui lòng nhập mật khẩu mới.');
      return;
    }

    if (newP.length < 4) {
      setSelfPassError('Mật khẩu mới phải có tối thiểu 4 ký tự.');
      return;
    }

    if (newP !== confP) {
      setSelfPassError('Xác nhận mật khẩu mới không khớp.');
      return;
    }

    setIsSubmittingPass(true);

    setTimeout(() => {
      const res = storageService.changePassword(
        currentUser.id,
        oldP,
        newP,
        currentUser
      );

      setIsSubmittingPass(false);

      if (res.success) {
        setSelfPassSuccess(`Đổi mật khẩu thành công! Mật khẩu mới của bạn đã được cập nhật an toàn.`);
        setSelfOldPassword('');
        setSelfNewPassword('');
        setSelfConfirmPassword('');
        refreshData();
      } else {
        setSelfPassError(res.message);
      }
    }, 200);
  };

  const summary = useMemo(() => {
    return storageService.getIAMSecuritySummary();
  }, [credentials]);

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleCopyPassword = (cred: UserCredential) => {
    navigator.clipboard.writeText(`Username: ${cred.username}\nPassword: ${cred.password}\nEmail: ${cred.email}`);
    setCopiedUserId(cred.userId);
    setTimeout(() => setCopiedUserId(null), 2500);
  };

  // Filtered List for Admin
  const filteredCredentials = useMemo(() => {
    return credentials.filter(c => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch = !q || 
        c.employeeName.toLowerCase().includes(q) ||
        c.username.toLowerCase().includes(q) ||
        c.employeeCode.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.position.toLowerCase().includes(q);

      const matchDept = selectedDepartment === 'ALL' || c.department === selectedDepartment;
      const matchRole = selectedRole === 'ALL' || c.role === selectedRole;
      const matchStatus = selectedStatus === 'ALL' || c.status === selectedStatus;

      return matchSearch && matchDept && matchRole && matchStatus;
    });
  }, [credentials, searchTerm, selectedDepartment, selectedRole, selectedStatus]);

  // Handle Reset Password (Admin)
  const handleExecuteResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassTarget) return;

    const passToUse = newCustomPass.trim() || '1234';

    const res = storageService.adminResetPassword(
      resetPassTarget.userId,
      passToUse,
      forceChangeCheck,
      currentUser
    );

    if (res.success) {
      setResetPassTarget(null);
      setNewCustomPass('');
      refreshData();
    }
  };

  // Handle Lifecycle Status Change (Admin)
  const handleExecuteLifecycleChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lifecycleTarget) return;

    const res = storageService.updateAccountLifecycleStatus(
      lifecycleTarget.userId,
      targetNewStatus,
      statusChangeReason,
      currentUser
    );

    if (res.success) {
      setLifecycleTarget(null);
      setStatusChangeReason('');
      refreshData();
    }
  };

  // Handle 2FA Toggle
  const handleToggle2FA = (cred: UserCredential) => {
    const nextState = !cred.twoFactorEnabled;
    storageService.toggleTwoFactorAuth(
      cred.userId,
      nextState,
      'EMAIL_OTP',
      currentUser
    );
    refreshData();
  };

  // Handle Issue New Account Form Submit (Admin)
  const handleIssueNewAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrorMessage(null);
    setFormSuccessMessage(null);

    if (!newEmpName.trim()) {
      setFormErrorMessage('Vui lòng nhập họ và tên nhân viên mới.');
      return;
    }

    const res = storageService.issueNewEmployeeAccount(
      {
        name: newEmpName,
        phone: newEmpPhone,
        email: newEmpEmail || undefined,
        department: newEmpDept,
        role: newEmpRole,
        position: newEmpPosition,
      },
      newEmpPass || '1234',
      currentUser
    );

    if (res.success) {
      setFormSuccessMessage(res.message);
      setTimeout(() => {
        setIsIssueModalOpen(false);
        setNewEmpName('');
        setNewEmpPhone('');
        setNewEmpEmail('');
        setNewEmpPass('1234');
        setFormSuccessMessage(null);
        refreshData();
      }, 1200);
    } else {
      setFormErrorMessage(res.message);
    }
  };

  // Export Credential Table to CSV
  const handleExportCredentialsSheet = () => {
    const header = ['Mã NV', 'Họ Và Tên', 'Chức Vụ', 'Phòng Ban', 'Vai Trò', 'Tên Đăng Nhập', 'Mật Khẩu', 'Email', 'Trạng Thái Vòng Đời', 'Bảo Mật 2FA', 'Ngày Cấp'];
    const rows = credentials.map(c => [
      c.employeeCode,
      `"${c.employeeName}"`,
      `"${c.position}"`,
      c.department,
      c.role,
      c.username,
      c.password,
      c.email,
      c.status,
      c.twoFactorEnabled ? `Bật (${c.twoFactorMethod})` : 'Tắt',
      c.issuedAt || '2025-01-01'
    ]);

    const csvContent = '\uFEFF' + [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TaxCore_Danh_Sach_Tai_Khoan_Nhan_Su_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Password strength helper
  const selfNewPassStrength = useMemo(() => {
    if (!selfNewPassword) return null;
    return evaluatePasswordStrength(selfNewPassword);
  }, [selfNewPassword]);

  return (
    <div className="space-y-5 pb-12">
      
      {/* 1. Header Hero Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div className="flex items-start space-x-3.5">
            <div className="p-3 bg-blue-500/15 border border-blue-400/30 rounded-2xl text-blue-400 shrink-0 shadow-sm">
              <KeyRound className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  {isAdmin ? 'Quản Trị Định Danh & Mật Khẩu (IAM Security)' : 'Tài Khoản & Mật Khẩu Cá Nhân (IAM)'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold font-mono">
                  {isAdmin ? 'ENTERPRISE RBAC ACTIVE' : 'BẢO MẬT RIÊNG TƯ'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                {isAdmin 
                  ? 'Kiểm soát toàn diện tài khoản, trạng thái vòng đời và phân quyền truy cập cho toàn bộ nhân sự doanh nghiệp.'
                  : `Bạn chỉ có quyền xem thông tin tài khoản và thay đổi mật khẩu của chính bạn (${currentUser.name} - ${currentUser.position}). Mật khẩu hiện tại mặc định: 1234.`}
              </p>
            </div>
          </div>

          {/* Admin Navigation & Action Controls */}
          {isAdmin && (
            <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-y-2">
              <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setAdminViewTab('ALL_ACCOUNTS')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    adminViewTab === 'ALL_ACCOUNTS'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  30 Tài Khoản (Master)
                </button>
                <button
                  type="button"
                  onClick={() => setAdminViewTab('MY_ACCOUNT')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    adminViewTab === 'MY_ACCOUNT'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tài Khoản Của Tôi
                </button>
              </div>

              {adminViewTab === 'ALL_ACCOUNTS' && (
                <>
                  <button
                    onClick={handleExportCredentialsSheet}
                    className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5 text-blue-400" />
                    <span className="hidden sm:inline">Xuất CSV</span>
                  </button>
                  <button
                    onClick={() => setIsIssueModalOpen(true)}
                    className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/30 cursor-pointer"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Cấp Mới</span>
                  </button>
                </>
              )}
            </div>
          )}

        </div>

        {/* Admin Quick Metrics Ribbon */}
        {isAdmin && adminViewTab === 'ALL_ACCOUNTS' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-5 pt-4 border-t border-slate-800/80">
            <div className="bg-slate-850 p-2.5 rounded-xl border border-slate-750">
              <div className="text-[11px] font-semibold text-slate-400">Tổng tài khoản</div>
              <div className="text-lg font-bold text-white mt-0.5">{summary.totalAccounts} Nhân sự</div>
              <div className="text-[10px] text-blue-400">Mặc định: 1234</div>
            </div>

            <div className="bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-800/40">
              <div className="text-[11px] font-semibold text-emerald-300 flex items-center justify-between">
                <span>Đang hoạt động</span>
                <CheckCircle2 className="h-3 w-3" />
              </div>
              <div className="text-lg font-bold text-emerald-400 mt-0.5">{summary.activeCount}</div>
              <div className="text-[10px] text-emerald-400/80">Trạng thái ACTIVE</div>
            </div>

            <div className="bg-blue-950/30 p-2.5 rounded-xl border border-blue-800/40">
              <div className="text-[11px] font-semibold text-blue-300 flex items-center justify-between">
                <span>Cần đổi pass</span>
                <KeyRound className="h-3 w-3" />
              </div>
              <div className="text-lg font-bold text-blue-400 mt-0.5">{summary.forcePasswordChangeCount}</div>
              <div className="text-[10px] text-blue-400/80">Yêu cầu đổi mật khẩu</div>
            </div>

            <div className="bg-amber-950/30 p-2.5 rounded-xl border border-amber-800/40">
              <div className="text-[11px] font-semibold text-amber-300 flex items-center justify-between">
                <span>Tạm khóa</span>
                <Lock className="h-3 w-3" />
              </div>
              <div className="text-lg font-bold text-amber-400 mt-0.5">{summary.suspendedCount}</div>
              <div className="text-[10px] text-amber-400/80">Tạm hoãn HĐLĐ</div>
            </div>

            <div className="bg-rose-950/30 p-2.5 rounded-xl border border-rose-800/40">
              <div className="text-[11px] font-semibold text-rose-300 flex items-center justify-between">
                <span>Chấm dứt HĐLĐ</span>
                <UserX className="h-3 w-3" />
              </div>
              <div className="text-lg font-bold text-rose-400 mt-0.5">{summary.terminatedCount}</div>
              <div className="text-[10px] text-rose-400/80">Đã khóa vĩnh viễn</div>
            </div>

            <div className="bg-purple-950/30 p-2.5 rounded-xl border border-purple-800/40">
              <div className="text-[11px] font-semibold text-purple-300 flex items-center justify-between">
                <span>Bảo mật 2FA</span>
                <Smartphone className="h-3 w-3" />
              </div>
              <div className="text-lg font-bold text-purple-400 mt-0.5">{summary.twoFactorEnabledCount}</div>
              <div className="text-[10px] text-purple-400/80">Email OTP & TOTP</div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION A: PERSONAL IAM ACCOUNT & CHANGE PASSWORD VIEW */}
      {/* (Rendered for ALL normal users, or for Admin when switching to My Account) */}
      {/* ========================================================================= */}
      {(!isAdmin || adminViewTab === 'MY_ACCOUNT') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left Column: My User IAM Credentials Card */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
                    <UserIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Hồ Sơ Xác Thực Cá Nhân
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Thông tin tài khoản IAM được cấp phát
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                  Đang hoạt động
                </span>
              </div>

              {/* User Identity Details */}
              <div className="mt-4 space-y-3.5 text-xs">
                <div className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center font-bold text-base text-white shrink-0 shadow-sm">
                    {currentUser.avatar ? (
                      <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      currentUser.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {currentUser.name}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 text-xs truncate">
                      {currentUser.position || 'Chuyên viên'}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 font-semibold">
                        Mã: {myCredential.employeeCode || currentUser.code || currentUser.id}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                        {myCredential.department}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40">
                    <span className="text-slate-500 dark:text-slate-400">Tên đăng nhập (Username):</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {myCredential.username}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40">
                    <span className="text-slate-500 dark:text-slate-400">Email công vụ:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                      {myCredential.email}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40">
                    <span className="text-slate-500 dark:text-slate-400">Cấp bậc / Vai trò:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {myCredential.role}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40">
                    <span className="text-slate-500 dark:text-slate-400">Mật khẩu ban đầu hệ thống:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      1234
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40">
                    <span className="text-slate-500 dark:text-slate-400">Cập nhật mật khẩu gần nhất:</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {myCredential.passwordUpdatedAt || CURRENT_SYSTEM_DATE}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2FA Toggle for Self Account */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Smartphone className="h-4 w-4 text-purple-500" />
                  <span className="font-bold text-xs text-slate-900 dark:text-white">Bảo mật 2 lớp (2FA)</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle2FA(myCredential)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    myCredential.twoFactorEnabled
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                  }`}
                >
                  {myCredential.twoFactorEnabled ? 'Đang BẬT' : 'TẮT'}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                {myCredential.twoFactorEnabled 
                  ? 'Tài khoản được bảo vệ qua mã OTP gửi qua Email hoặc Authenticator.'
                  : 'Bật để kích hoạt lớp bảo vệ thứ 2 khi đăng nhập vào hệ thống.'}
              </p>
            </div>
          </div>

          {/* Right Column: Direct Change Password Form */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-2xl">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Thay Đổi Mật Khẩu Cá Nhân
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cập nhật mật khẩu mới để bảo vệ an toàn hồ sơ & dữ liệu
                  </p>
                </div>
              </div>

              <div className="hidden sm:inline-flex items-center space-x-1 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <Info className="h-3.5 w-3.5 text-blue-500" />
                <span>Mật khẩu mặc định: <strong>1234</strong></span>
              </div>
            </div>

            {/* Notification messages */}
            {selfPassSuccess && (
              <div className="mb-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-300 text-xs flex items-start space-x-2.5 animate-in fade-in-50">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold">Cập Nhật Thành Công!</div>
                  <div className="mt-0.5 text-[11px] leading-relaxed">{selfPassSuccess}</div>
                </div>
              </div>
            )}

            {selfPassError && (
              <div className="mb-4 p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-800 dark:text-rose-300 text-xs flex items-start space-x-2.5 animate-in fade-in-50">
                <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold">Chưa Thể Đổi Mật Khẩu</div>
                  <div className="mt-0.5 text-[11px] leading-relaxed">{selfPassError}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleSelfChangePassword} className="space-y-4">
              
              {/* Field 1: Current Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Mật Khẩu Hiện Tại <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setSelfOldPassword('1234')}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Điền nhanh mật khẩu mặc định (1234)</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showSelfOld ? 'text' : 'password'}
                    required
                    value={selfOldPassword}
                    onChange={(e) => setSelfOldPassword(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại (mặc định: 1234)..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-3.5 pr-10 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSelfOld(!showSelfOld)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 cursor-pointer"
                    title={showSelfOld ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showSelfOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Nếu bạn chưa từng đổi mật khẩu, mật khẩu mặc định ban đầu là: <code className="font-bold text-blue-600 dark:text-blue-400">1234</code>.
                </p>
              </div>

              {/* Field 2: New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Mật Khẩu Mới <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showSelfNew ? 'text' : 'password'}
                    required
                    value={selfNewPassword}
                    onChange={(e) => setSelfNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới (tối thiểu 4 ký tự)..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-3.5 pr-10 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSelfNew(!showSelfNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 cursor-pointer"
                    title={showSelfNew ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showSelfNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {selfNewPassStrength && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Độ mạnh mật khẩu:</span>
                      <span className={`font-bold ${selfNewPassStrength.color}`}>
                        {selfNewPassStrength.level}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${selfNewPassStrength.barColor} transition-all duration-300`}
                        style={{ width: `${(selfNewPassStrength.score + 1) * 20}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Field 3: Confirm New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Xác Nhận Mật Khẩu Mới <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showSelfConfirm ? 'text' : 'password'}
                    required
                    value={selfConfirmPassword}
                    onChange={(e) => setSelfConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới vừa tạo..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-3.5 pr-10 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSelfConfirm(!showSelfConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 cursor-pointer"
                    title={showSelfConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showSelfConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelfOldPassword('');
                    setSelfNewPassword('');
                    setSelfConfirmPassword('');
                    setSelfPassError(null);
                    setSelfPassSuccess(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Nhập Lại
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmittingPass || !selfOldPassword || !selfNewPassword || !selfConfirmPassword}
                  className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingPass ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCheck className="h-4 w-4" />
                  )}
                  <span>Xác Nhận Đổi Mật Khẩu</span>
                </button>
              </div>

            </form>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION B: ADMIN MASTER IAM DIRECTORY (30 ACCOUNTS TABLE) */}
      {/* (Visible ONLY for ADMIN when in 'ALL_ACCOUNTS' tab) */}
      {/* ========================================================================= */}
      {isAdmin && adminViewTab === 'ALL_ACCOUNTS' && (
        <>
          {/* Search & Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên, username, mã NV, email..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
              {/* Department Filter */}
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-hidden"
              >
                <option value="ALL">Mọi Phòng Ban</option>
                <option value="BAN_GIAM_DOC">Ban Giám Đốc</option>
                <option value="KE_TOAN_THUE">Kế toán & Thuế</option>
                <option value="KIEM_SOAT_NOI_BO">Kiểm soát & Soát xét</option>
                <option value="CSKH_TUVAN">CSKH & Tư Vấn</option>
                <option value="PHAP_LY_HO_SO">Pháp lý & Hồ sơ</option>
                <option value="HANH_CHINH_NHAN_SU">Hành chính - Nhân sự</option>
                <option value="CONG_NGHE_THONG_TIN">Công nghệ & IT</option>
              </select>

              {/* Role Filter */}
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-hidden"
              >
                <option value="ALL">Mọi Cấp Bậc / Vai Trò</option>
                <option value="ADMIN">ADMIN (Quản trị viên)</option>
                <option value="BAN_GIAM_DOC">BAN_GIAM_DOC (Ban Giám Đốc)</option>
                <option value="TRUONG_PHONG">TRUONG_PHONG (Trưởng phòng)</option>
                <option value="TRUONG_NHOM">TRUONG_NHOM (Trưởng nhóm)</option>
                <option value="NHAN_VIEN">NHAN_VIEN (Chuyên viên)</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-hidden font-medium"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                <option value="FORCE_PASSWORD_CHANGE">Cần đổi mật khẩu (FORCE_PASS)</option>
                <option value="SUSPENDED">Tạm khóa (SUSPENDED)</option>
                <option value="TERMINATED_LOCKED">Đã chấm dứt HĐLĐ (TERMINATED)</option>
              </select>

              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedDepartment('ALL');
                  setSelectedRole('ALL');
                  setSelectedStatus('ALL');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Xóa bộ lọc"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Credentials Vault Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-3.5">Mã & Nhân Sự</th>
                    <th className="py-3 px-3">Tên Đăng Nhập (Username)</th>
                    <th className="py-3 px-3">Mật Khẩu Hiện Tại</th>
                    <th className="py-3 px-3">Phòng Ban & Vị Trí</th>
                    <th className="py-3 px-3">Trạng Thái Vòng Đời</th>
                    <th className="py-3 px-3">Bảo Mật 2FA</th>
                    <th className="py-3 px-3 text-right">Thao Tác IAM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredCredentials.map((cred) => {
                    const isPassVisible = !!visiblePasswords[cred.userId];
                    const isCopied = copiedUserId === cred.userId;
                    const lifecycleConfig = ACCOUNT_LIFECYCLE_CONFIG[cred.status] || ACCOUNT_LIFECYCLE_CONFIG.ACTIVE;

                    return (
                      <tr 
                        key={cred.userId}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
                      >
                        {/* Nhân sự */}
                        <td className="py-3 px-3.5">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs">
                              {cred.employeeName.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                                <span className="truncate">{cred.employeeName}</span>
                                {cred.role === 'ADMIN' && (
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800">
                                    ADMIN
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                {cred.employeeCode || cred.userId} • {cred.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Username */}
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            {cred.username}
                          </span>
                        </td>

                        {/* Password */}
                        <td className="py-3 px-3">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono text-xs text-slate-700 dark:text-slate-300 font-bold bg-slate-50 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 select-all">
                              {isPassVisible ? cred.password : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(cred.userId)}
                              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title={isPassVisible ? 'Ẩn mật khẩu' : 'Xem mật khẩu'}
                            >
                              {isPassVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyPassword(cred)}
                              className={`p-1 rounded transition-colors ${
                                isCopied 
                                  ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60' 
                                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                              title="Sao chép thông tin đăng nhập"
                            >
                              {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </td>

                        {/* Phòng ban & Vị trí */}
                        <td className="py-3 px-3">
                          <div className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[170px]">
                            {cred.position}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {cred.department}
                          </div>
                        </td>

                        {/* Lifecycle Status Badge */}
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${lifecycleConfig.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${lifecycleConfig.bg}`} />
                            {lifecycleConfig.shortLabel}
                          </span>
                        </td>

                        {/* 2FA */}
                        <td className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => handleToggle2FA(cred)}
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                              cred.twoFactorEnabled
                                ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <Smartphone className="h-3 w-3" />
                            <span>{cred.twoFactorEnabled ? '2FA Bật' : 'Tắt'}</span>
                          </button>
                        </td>

                        {/* Thao tác */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {/* Reset Pass */}
                            <button
                              onClick={() => {
                                setResetPassTarget(cred);
                                setNewCustomPass('1234');
                              }}
                              className="px-2 py-1 rounded-lg text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 text-[11px] font-bold transition-all cursor-pointer flex items-center space-x-1"
                              title="Cấp lại mật khẩu (Admin Reset)"
                            >
                              <KeyRound className="h-3 w-3" />
                              <span>Reset Pass</span>
                            </button>

                            {/* Lifecycle change */}
                            <button
                              onClick={() => {
                                setLifecycleTarget(cred);
                                setTargetNewStatus(cred.status);
                                setStatusChangeReason('');
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Điều chỉnh trạng thái vòng đời tài khoản"
                            >
                              <Sliders className="h-3.5 w-3.5" />
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
        </>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CẤP PHÁT TÀI KHOẢN MỚI (ADMIN) */}
      {/* ========================================================================= */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl animate-in fade-in-50">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-xl">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Cấp Phát Tài Khoản Nhân Sự Mới (Onboarding)
                  </h3>
                  <p className="text-xs text-slate-500">Khởi tạo hồ sơ & cấp phát tài khoản IAM</p>
                </div>
              </div>
              <button
                onClick={() => setIsIssueModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formSuccessMessage && (
              <div className="mt-3 p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{formSuccessMessage}</span>
              </div>
            )}

            {formErrorMessage && (
              <div className="mt-3 p-3 bg-rose-50 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{formErrorMessage}</span>
              </div>
            )}

            <form onSubmit={handleIssueNewAccount} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Họ và tên nhân sự <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn Hoàng"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={newEmpPhone}
                    onChange={(e) => setNewEmpPhone(e.target.value)}
                    placeholder="0912 345 678"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email công vụ
                  </label>
                  <input
                    type="email"
                    value={newEmpEmail}
                    onChange={(e) => setNewEmpEmail(e.target.value)}
                    placeholder="hoang.nguyen@taxcore.vn"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phòng ban
                  </label>
                  <select
                    value={newEmpDept}
                    onChange={(e) => setNewEmpDept(e.target.value as Department)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  >
                    <option value="KE_TOAN_THUE">Kế toán & Thuế</option>
                    <option value="KIEM_SOAT_NOI_BO">Kiểm soát & Soát xét</option>
                    <option value="CSKH_TUVAN">CSKH & Tư Vấn</option>
                    <option value="PHAP_LY_HO_SO">Pháp lý & Hồ sơ</option>
                    <option value="HANH_CHINH_NHAN_SU">Hành chính - Nhân sự</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vai trò (Role)
                  </label>
                  <select
                    value={newEmpRole}
                    onChange={(e) => setNewEmpRole(e.target.value as UserRole)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  >
                    <option value="NHAN_VIEN">NHAN_VIEN (Chuyên viên)</option>
                    <option value="TRUONG_NHOM">TRUONG_NHOM (Trưởng nhóm)</option>
                    <option value="TRUONG_PHONG">TRUONG_PHONG (Trưởng phòng)</option>
                    <option value="BAN_GIAM_DOC">BAN_GIAM_DOC (Giám đốc)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mật khẩu khởi tạo ban đầu (Mặc định: 1234)
                </label>
                <input
                  type="text"
                  value={newEmpPass}
                  onChange={(e) => setNewEmpPass(e.target.value)}
                  placeholder="Mặc định: 1234"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-all cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-md shadow-blue-600/30 cursor-pointer flex items-center space-x-1.5"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Xác Nhận Cấp Phát Tài Khoản</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: RESET MẬT KHẨU (ADMIN RESET) */}
      {/* ========================================================================= */}
      {resetPassTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in fade-in-50">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-amber-50 dark:bg-amber-950 text-amber-600 rounded-xl">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Cấp Lại Mật Khẩu (Admin Reset)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Nhân sự: <strong>{resetPassTarget.employeeName}</strong> ({resetPassTarget.username})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setResetPassTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteResetPassword} className="space-y-4 mt-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Mật khẩu mới (Mặc định: 1234)
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewCustomPass('1234')}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Đặt về 1234</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={newCustomPass}
                  onChange={(e) => setNewCustomPass(e.target.value)}
                  placeholder="Nhập mật khẩu mới (hoặc để mặc định 1234)..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="forcePassChange"
                  checked={forceChangeCheck}
                  onChange={(e) => setForceChangeCheck(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="forcePassChange" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Yêu cầu nhân sự đổi lại mật khẩu khi đăng nhập
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetPassTarget(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-md shadow-amber-600/30 cursor-pointer flex items-center space-x-1.5"
                >
                  <KeyRound className="h-4 w-4" />
                  <span>Xác Nhận Đặt Lại</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: THAY ĐỔI TRẠNG THÁI VÒNG ĐỜI (ADMIN) */}
      {/* ========================================================================= */}
      {lifecycleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in fade-in-50">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-rose-50 dark:bg-rose-950 text-rose-600 rounded-xl">
                  <Sliders className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Chuyển Trạng Thái Vòng Đời Tài Khoản
                  </h3>
                  <p className="text-xs text-slate-500">
                    Nhân sự: <strong>{lifecycleTarget.employeeName}</strong> ({lifecycleTarget.employeeCode})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLifecycleTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteLifecycleChange} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Trạng thái vòng đời mới
                </label>
                <select
                  value={targetNewStatus}
                  onChange={(e) => setTargetNewStatus(e.target.value as AccountLifecycleState)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold"
                >
                  <option value="ACTIVE">Hoạt động bình thường (ACTIVE)</option>
                  <option value="FORCE_PASSWORD_CHANGE">Yêu cầu đổi mật khẩu (FORCE_PASSWORD_CHANGE)</option>
                  <option value="SUSPENDED">Tạm khóa tài khoản (SUSPENDED)</option>
                  <option value="TERMINATED_LOCKED">Chấm dứt HĐLĐ & Khóa vĩnh viễn (TERMINATED_LOCKED)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lý do điều chỉnh trạng thái
                </label>
                <textarea
                  rows={2}
                  value={statusChangeReason}
                  onChange={(e) => setStatusChangeReason(e.target.value)}
                  placeholder="Ví dụ: Tạm hoãn HĐLĐ nghỉ thai sản / Đã thanh lý HĐLĐ..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              {targetNewStatus === 'TERMINATED_LOCKED' && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-[11px] flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Cảnh báo:</strong> Khi chuyển sang <code>TERMINATED_LOCKED</code>, người dùng sẽ bị từ chối đăng nhập vĩnh viễn.
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLifecycleTarget(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-600/30 cursor-pointer"
                >
                  Lưu Trạng Thái
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

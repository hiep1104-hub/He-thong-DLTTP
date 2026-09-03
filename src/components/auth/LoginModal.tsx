import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User as UserIcon, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  RefreshCw, 
  Smartphone,
  ChevronDown,
  Search,
  Check,
  Building2,
  X
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { User, UserCredential } from '../../types';
import { BrandLogo } from '../common/BrandLogo';
import { evaluatePasswordStrength } from '../../data/iamData';

interface LoginModalProps {
  isOpen: boolean;
  onLoginSuccess: (user: User) => void;
  onClose?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onLoginSuccess,
  onClose
}) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [is2FAStage, setIs2FAStage] = useState(false);
  const [pendingCred, setPendingCred] = useState<UserCredential | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Dropdown Nhân sự / Mã NV selector state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');

  // Change Password Modal Stage if required
  const [isChangePassStage, setIsChangePassStage] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);

  // Danh sách nhân sự đang hoạt động
  const allUsers = useMemo(() => {
    return storageService.getUsers().filter(u => u.active !== false);
  }, []);

  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => {
      if (deptFilter !== 'ALL' && u.department !== deptFilter) return false;
      if (searchFilter.trim()) {
        const query = searchFilter.toLowerCase();
        return (
          u.name.toLowerCase().includes(query) ||
          (u.code && u.code.toLowerCase().includes(query)) ||
          (u.position && u.position.toLowerCase().includes(query)) ||
          (u.email && u.email.toLowerCase().includes(query)) ||
          (u.username && u.username.toLowerCase().includes(query))
        );
      }
      return true;
    }).sort((a, b) => {
      if (a.role === 'ADMIN') return -1;
      if (b.role === 'ADMIN') return 1;
      return (a.code || '').localeCompare(b.code || '');
    });
  }, [allUsers, deptFilter, searchFilter]);

  if (!isOpen) return null;

  const handleSelectStaff = (user: User) => {
    setSelectedUser(user);
    setIdentifier(user.code || user.username || user.email);
    setIsDropdownOpen(false);
    setErrorMessage(null);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const result = storageService.verifyLogin(
        identifier.trim(), 
        password, 
        is2FAStage ? otpCode : undefined
      );

      setIsLoading(false);

      if (!result.success) {
        if (result.requires2FA && result.credential) {
          setIs2FAStage(true);
          setPendingCred(result.credential);
          setErrorMessage(null);
          setSuccessMessage(`Đã kích hoạt bảo mật 2 lớp! Vui lòng nhập mã xác thực OTP 6 số.`);
          return;
        }
        setErrorMessage(result.message);
        return;
      }

      if (result.user) {
        if (result.requiresPasswordChange) {
          setIsChangePassStage(true);
          setLoggedInUser(result.user);
          setSuccessMessage('Vui lòng đổi mật khẩu mới trong lần đầu đăng nhập theo chính sách an toàn.');
        } else {
          setSuccessMessage(result.message);
          setTimeout(() => {
            onLoginSuccess(result.user!);
          }, 350);
        }
      }
    }, 250);
  };

  const handleForceChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInUser) return;

    if (newPassword !== confirmPassword) {
      setErrorMessage('Xác nhận mật khẩu mới không trùng khớp.');
      return;
    }

    const strength = evaluatePasswordStrength(newPassword);
    if (strength.score < 2) {
      setErrorMessage(`Mật khẩu quá yếu: ${strength.feedback.join('. ')}`);
      return;
    }

    const res = storageService.changePassword(loggedInUser.id, password, newPassword, loggedInUser);
    if (!res.success) {
      setErrorMessage(res.message);
      return;
    }

    setSuccessMessage('Đổi mật khẩu thành công! Đang chuyển hướng vào hệ thống...');
    setTimeout(() => {
      onLoginSuccess(loggedInUser);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative transition-all">
        
        {/* Close Button if modal overlay */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer z-20"
            title="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div className="p-6 sm:p-8 space-y-5">
          
          {/* Brand Header */}
          <div className="text-center space-y-1.5">
            <div className="flex justify-center">
              <BrandLogo size="lg" textColor="dark" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {isChangePassStage 
                  ? 'Đổi Mật Khẩu Lần Đầu' 
                  : is2FAStage 
                  ? 'Xác Thực Hai Yếu Tố (2FA)' 
                  : 'Đăng Nhập Hệ Thống'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isChangePassStage 
                  ? 'Thiết lập mật khẩu an toàn cho tài khoản'
                  : is2FAStage
                  ? 'Nhập mã xác thực để tiếp tục phiên làm việc'
                  : 'Hệ thống Quản trị & Điều hành Dịch vụ Thuế'}
              </p>
            </div>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start space-x-2 animate-in fade-in-50">
              <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-start space-x-2 animate-in fade-in-50">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* STAGE 1: Standard Username / Staff Selection & Password Form */}
          {!is2FAStage && !isChangePassStage && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              
              {/* Mã NV & Tên Nhân Viên Selector with Dropdown */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Mã Nhân Viên / Tên Đăng Nhập
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center space-x-1 cursor-pointer"
                  >
                    <span>{isDropdownOpen ? 'Đóng danh sách' : 'Chọn từ danh bạ NV'}</span>
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (selectedUser && e.target.value !== selectedUser.code && e.target.value !== selectedUser.username) {
                        setSelectedUser(null);
                      }
                    }}
                    placeholder="Chọn từ danh sách hoặc nhập Mã NV, Email..."
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                {/* Selected Staff Badge indicator */}
                {selectedUser && (
                  <div className="mt-1.5 flex items-center justify-between px-2.5 py-1.5 bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 rounded-lg text-xs text-blue-900 dark:text-blue-300">
                    <div className="flex items-center space-x-2 truncate">
                      <span className="font-bold">{selectedUser.name}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">({selectedUser.position})</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 font-semibold text-blue-700 dark:text-blue-300">
                      {selectedUser.code || 'ADM'}
                    </span>
                  </div>
                )}

                {/* Dropdown List of Employees (Strictly NO passwords shown) */}
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-30 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
                    {/* Search & Department Filters */}
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="relative">
                        <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          autoFocus
                          value={searchFilter}
                          onChange={(e) => setSearchFilter(e.target.value)}
                          placeholder="Tìm nhanh theo Tên, Mã NV, Chức vụ..."
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar text-[10px]">
                        {[
                          { id: 'ALL', label: 'Tất cả' },
                          { id: 'BAN_GIAM_DOC', label: 'Ban Giám Đốc' },
                          { id: 'KE_TOAN_THUE', label: 'Kế Toán Thuế' },
                          { id: 'HANH_CHINH_NHAN_SU', label: 'HCNS' },
                          { id: 'KINH_DOANH_CSKH', label: 'Sales / CSKH' },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setDeptFilter(tab.id)}
                            className={`px-2 py-0.5 rounded-md font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                              deptFilter === tab.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Employee List Items */}
                    <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-1">
                      {filteredUsers.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">
                          Không tìm thấy nhân sự phù hợp
                        </div>
                      ) : (
                        filteredUsers.map((user) => {
                          const isCurrent = identifier === user.code || identifier === user.username || identifier === user.email;
                          const isAdmin = user.role === 'ADMIN';

                          return (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => handleSelectStaff(user)}
                              className={`w-full p-2 rounded-xl text-left transition-colors flex items-center justify-between cursor-pointer group ${
                                isCurrent
                                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200'
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              <div className="flex items-center space-x-2.5 min-w-0">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                                  isAdmin ? 'bg-purple-600' : 'bg-blue-600'
                                }`}>
                                  {user.avatar ? (
                                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-lg" />
                                  ) : (
                                    user.name.slice(0, 1)
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center space-x-1.5">
                                    <span className="font-bold text-xs truncate">{user.name}</span>
                                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                      {user.code || 'ADM-01'}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                    {user.position}
                                  </div>
                                </div>
                              </div>

                              <div className="shrink-0 pl-2">
                                {isCurrent ? (
                                  <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                ) : (
                                  <span className="text-[10px] text-slate-400 group-hover:text-blue-500 font-semibold">
                                    Chọn
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mật Khẩu Cá Nhân
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu truy cập của bạn..."
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || !identifier.trim() || !password}
                  className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Đang xác thực thông tin...</span>
                    </>
                  ) : (
                    <>
                      <span>Đăng Nhập Vào Hệ Thống</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STAGE 2: 2FA OTP Confirmation */}
          {is2FAStage && !isChangePassStage && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl text-xs text-blue-700 dark:text-blue-300 flex items-center space-x-2.5">
                <Smartphone className="h-5 w-5 text-blue-500 shrink-0" />
                <div>
                  <div className="font-bold">Yêu cầu xác thực 2 bước (2FA)</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Tài khoản <strong>{pendingCred?.employeeName}</strong> đang kích hoạt xác thực 2 lớp bảo mật ({pendingCred?.twoFactorMethod}).
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nhập mã OTP (6 chữ số)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-center text-lg font-mono font-bold tracking-widest text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIs2FAStage(false);
                    setOtpCode('');
                  }}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 px-3 rounded-xl text-xs transition-all cursor-pointer"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={isLoading || otpCode.length !== 6}
                  className="w-2/3 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <span>Xác Nhận Đăng Nhập</span>}
                </button>
              </div>
            </form>
          )}

          {/* STAGE 3: Force Password Change */}
          {isChangePassStage && loggedInUser && (
            <form onSubmit={handleForceChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)..."
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    title={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới..."
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    title={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Cập Nhật Mật Khẩu & Đăng Nhập</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}

          {/* Clean Security Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Bảo mật dữ liệu chuẩn ISO 27001</span>
            </span>
            <span className="font-mono text-[10px] text-slate-400">TaxCore Enterprise</span>
          </div>

        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, Task, Customer } from '../../types';
import { 
  Building2, 
  Plus, 
  Search, 
  CalendarDays, 
  Clock, 
  ChevronDown, 
  RefreshCw, 
  CopyCheck, 
  AlertTriangle,
  FileText,
  UserPlus,
  CheckSquare,
  KeyRound,
  ShieldCheck,
  LogIn,
  LogOut,
  Check,
  Users,
  Shield
} from 'lucide-react';
import { storageService, CURRENT_SYSTEM_DATE } from '../../services/storageService';
import { formatDate } from '../../utils/formatters';
import { BrandLogo } from './BrandLogo';
import { PermissionService } from '../../utils/permissions';

interface HeaderProps {
  currentUser: User;
  allUsers: User[];
  onSwitchUser: (user: User) => void;
  urgentTasksCount: number;
  pendingReviewCount: number;
  pendingApprovalCount: number;
  onOpenUrgentTasks: () => void;
  onOpenCreateTask: () => void;
  onOpenCreateCustomer?: () => void;
  onOpenDuplicateScanner?: () => void;
  onForceSync?: () => void;
  onOpenSearch?: () => void;
  onOpenLoginModal?: () => void;
  onOpenIAMVault?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  allUsers,
  onSwitchUser,
  urgentTasksCount,
  pendingReviewCount,
  pendingApprovalCount,
  onOpenUrgentTasks,
  onOpenCreateTask,
  onOpenCreateCustomer,
  onOpenDuplicateScanner,
  onForceSync,
  onOpenSearch,
  onOpenLoginModal,
  onOpenIAMVault,
  onLogout,
}) => {
  const [syncTimeDisplay, setSyncTimeDisplay] = useState<string>('vừa xong');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setIsActionMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const unsubscribe = storageService.subscribeToSync(() => {
      setSyncTimeDisplay('vừa xong');
    });

    const timer = setInterval(() => {
      const diffSec = Math.floor((Date.now() - storageService.getLastSyncTime()) / 1000);
      if (diffSec < 10) {
        setSyncTimeDisplay('vừa xong');
      } else if (diffSec < 60) {
        setSyncTimeDisplay(`${diffSec}s trước`);
      } else {
        setSyncTimeDisplay(`${Math.floor(diffSec / 60)}m trước`);
      }
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  const handleManualSync = () => {
    setIsSyncing(true);
    storageService.broadcastSync({
      id: `SYNC-${Date.now()}`,
      type: 'FORCE_SYNC',
      senderId: currentUser.id,
      senderName: currentUser.name,
      timestamp: new Date().toISOString(),
    });
    if (onForceSync) onForceSync();
    setTimeout(() => setIsSyncing(false), 400);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return { label: 'Admin', color: 'bg-purple-500/20 text-purple-200 border-purple-500/40' };
      case 'BAN_GIAM_DOC':
        return { label: 'Giám Đốc', color: 'bg-indigo-500/20 text-indigo-200 border-indigo-500/40' };
      case 'TRUONG_PHONG':
        return { label: 'Trưởng Phòng', color: 'bg-blue-500/20 text-blue-200 border-blue-500/40' };
      case 'TRUONG_NHOM':
        return { label: 'Trưởng Nhóm', color: 'bg-teal-500/20 text-teal-200 border-teal-500/40' };
      default:
        return { label: 'Chuyên Viên', color: 'bg-slate-700/60 text-slate-200 border-slate-600/40' };
    }
  };

  const currentUserBadge = getRoleBadge(currentUser.role);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md backdrop-blur-md bg-slate-900/95">
      <div className="w-full px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 gap-2">
          
          {/* Left: Brand + ONLINE Status Pill */}
          <div className="flex items-center space-x-3 shrink-0">
            <BrandLogo size="md" textColor="white" />
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-extrabold text-[10px] tracking-wider shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>ONLINE</span>
            </div>
          </div>

          {/* Center: Precision Telemetry & Calendar Bar */}
          <div className="hidden lg:flex items-center bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 shadow-xs rounded-xl p-1 text-xs transition-colors">
            {/* System Date */}
            <div className="flex items-center space-x-1.5 px-3 py-1 text-slate-200 font-semibold">
              <CalendarDays className="h-3.5 w-3.5 text-blue-400 shrink-0" />
              <span>{formatDate(CURRENT_SYSTEM_DATE)}</span>
            </div>

            {/* Divider */}
            <div className="h-4 w-px bg-slate-700 mx-0.5" />

            {/* Tax Deadline */}
            <div className="flex items-center space-x-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300 font-bold">
              <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>Hạn T7: <strong className="text-white font-extrabold">20/08</strong></span>
            </div>

            {/* Divider */}
            <div className="h-4 w-px bg-slate-700 mx-0.5" />

            {/* Realtime Cloud Sync */}
            <button
              type="button"
              onClick={handleManualSync}
              className="flex items-center space-x-1.5 px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-700/60 rounded-lg transition-all cursor-pointer group"
              title="Nhấn để đồng bộ dữ liệu đám mây tức thời"
            >
              <RefreshCw className={`h-3 w-3 text-cyan-400 ${isSyncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              <span className="font-mono text-[11px] text-slate-300 group-hover:text-cyan-200">{syncTimeDisplay}</span>
            </button>
          </div>

          {/* Right: Consolidated Controls (Urgent Alert, Quick Action, User Card, Logout) */}
          <div className="flex items-center space-x-2 shrink-0">
            
            {/* 1. Urgent Alert Pill */}
            {urgentTasksCount > 0 && (
              <button
                id="header-urgent-alert-btn"
                onClick={onOpenUrgentTasks}
                className="flex items-center space-x-1.5 bg-gradient-to-r from-red-600/30 to-rose-600/20 hover:from-red-600/40 hover:to-rose-600/30 text-red-200 border border-red-500/50 hover:border-red-400 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shadow-sm shadow-red-950/40 cursor-pointer transform hover:-translate-y-0.5"
                title="Lọc các việc khẩn cấp / quá hạn cần xử lý gấp"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                <span className="font-mono font-black text-white bg-red-600 px-1.5 py-0.2 rounded text-[11px] shadow-xs">
                  {urgentTasksCount}
                </span>
                <span className="hidden sm:inline text-[11px] tracking-wide font-black">VIỆC GẤP</span>
              </button>
            )}

            {/* 2. Quick Action Dropdown Button */}
            <div className="relative" ref={actionMenuRef}>
              <button
                id="header-create-menu-btn"
                onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
                className="flex items-center space-x-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shadow-sm shadow-blue-500/20 border border-blue-400/30 cursor-pointer transform hover:-translate-y-0.5"
              >
                <Plus className="h-3.5 w-3.5 stroke-[3]" />
                <span>Thao tác</span>
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isActionMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isActionMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
                    Thao Tác Nhanh
                  </div>

                  <button
                    onClick={() => {
                      setIsActionMenuOpen(false);
                      onOpenCreateTask();
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-left text-xs text-white hover:bg-blue-600 transition-colors font-medium cursor-pointer"
                  >
                    <CheckSquare className="h-4 w-4 text-blue-400" />
                    <span>Giao việc mới</span>
                  </button>

                  {onOpenCreateCustomer && PermissionService.can(currentUser, 'customer:create') && (
                    <button
                      onClick={() => {
                        setIsActionMenuOpen(false);
                        onOpenCreateCustomer();
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-left text-xs text-white hover:bg-blue-600 transition-colors font-medium cursor-pointer"
                    >
                      <UserPlus className="h-4 w-4 text-emerald-400" />
                      <span>Thêm khách hàng</span>
                    </button>
                  )}

                  {onOpenDuplicateScanner && (currentUser.role === 'ADMIN' || currentUser.role === 'BAN_GIAM_DOC' || currentUser.role === 'TRUONG_PHONG' || currentUser.role === 'TRUONG_NHOM') && (
                    <button
                      onClick={() => {
                        setIsActionMenuOpen(false);
                        onOpenDuplicateScanner();
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-left text-xs text-white hover:bg-blue-600 transition-colors font-medium cursor-pointer border-t border-slate-800 mt-1 pt-2"
                    >
                      <CopyCheck className="h-4 w-4 text-amber-400" />
                      <span>Quét trùng lặp dữ liệu</span>
                    </button>
                  )}

                  {onForceSync && (
                    <button
                      onClick={() => {
                        setIsActionMenuOpen(false);
                        handleManualSync();
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-left text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors font-medium cursor-pointer"
                    >
                      <RefreshCw className="h-4 w-4 text-slate-400" />
                      <span>Đồng bộ tức thời</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 3. User Card Pill & Fast Switcher */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/90 hover:border-slate-600 px-2.5 py-1.5 rounded-xl cursor-pointer transition-all text-left shadow-2xs group"
              >
                {/* Avatar with online dot */}
                <div className="relative w-7 h-7 rounded-xl overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-xs text-white shrink-0 shadow-sm ring-1 ring-white/10">
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    currentUser.name.slice(0, 2).toUpperCase()
                  )}
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border-2 border-slate-900" />
                </div>

                {/* Name & Role */}
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-extrabold text-white leading-tight truncate max-w-[120px]">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 leading-none mt-0.5">
                    {currentUserBadge.label}
                  </span>
                </div>

                <ChevronDown className={`h-3 w-3 text-slate-400 group-hover:text-white transition-transform duration-200 shrink-0 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in-50 zoom-in-95 duration-150 p-4 space-y-3.5">
                  {/* Active User Profile Header */}
                  <div className="flex items-start space-x-3 pb-3 border-b border-slate-800">
                    <div className="relative w-11 h-11 rounded-2xl overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-sm text-white shrink-0 ring-2 ring-blue-500/30">
                      {currentUser.avatar ? (
                        <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                      ) : (
                        currentUser.name.slice(0, 2).toUpperCase()
                      )}
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-extrabold text-sm text-white truncate">{currentUser.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-slate-800 text-slate-300 border border-slate-700">
                          {currentUser.code || currentUser.id}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 truncate mt-0.5">{currentUser.position}</div>
                      <div className="flex items-center space-x-2 mt-1.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${currentUserBadge.color}`}>
                          {currentUserBadge.label}
                        </span>
                        <span className="text-[10px] text-emerald-400 flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Đang trực tuyến</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Account Information Details */}
                  <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Tài khoản đăng nhập:</span>
                      <span className="font-mono font-bold text-slate-200">{currentUser.email || currentUser.username || currentUser.code}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Phòng ban phụ trách:</span>
                      <span className="font-semibold text-slate-200">{currentUser.department || 'Đại Lý Thuế'}</span>
                    </div>
                  </div>

                  {/* Account Actions */}
                  <div className="space-y-2 pt-1">
                    {onOpenIAMVault && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenIAMVault();
                        }}
                        className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold text-amber-300 hover:text-white bg-amber-500/10 hover:bg-amber-600/30 border border-amber-500/20 transition-all cursor-pointer"
                      >
                        <KeyRound className="h-3.5 w-3.5 text-amber-400" />
                        <span>Đổi Mật Khẩu (IAM)</span>
                      </button>
                    )}

                    {onLogout && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-300 hover:text-white bg-rose-500/15 hover:bg-rose-600/30 border border-rose-500/30 transition-all cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5 text-rose-400" />
                        <span>Đăng Xuất Khỏi Hệ Thống</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Standalone Header Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-700/50 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                title={`Đăng xuất khỏi tài khoản ${currentUser.name}`}
              >
                <LogOut className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                <span className="hidden xl:inline">Đăng xuất</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};


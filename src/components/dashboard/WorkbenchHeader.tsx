import React from 'react';
import { User, UserRole, Department } from '../../types';
import { 
  Briefcase, 
  Sparkles, 
  Plus, 
  Calendar, 
  ShieldCheck, 
  RefreshCw, 
  Scale, 
  Clock, 
  CheckCircle2, 
  FileText, 
  UserCheck, 
  ChevronDown,
  Layers,
  BellRing,
  Plane
} from 'lucide-react';
import { CURRENT_SYSTEM_DATE } from '../../services/storageService';
import { formatDate } from '../../utils/formatters';

export type WorkbenchArchetype = 
  | 'EXECUTIVE'             // Ban Giám Đốc / Lãnh Đạo / Admin
  | 'MANAGER_REVIEWER'      // Kế Toán Trưởng / Trưởng Phòng / Trưởng Nhóm
  | 'TAX_SPECIALIST'        // Chuyên Viên Kế Toán Thuế / Kế Toán Viên
  | 'HR_PAYROLL'            // Chuyên Viên HCNS, Tiền Lương & BHXH
  | 'LEGAL'                 // Chuyên Viên Pháp Lý Doanh Nghiệp & ĐKKD
  | 'SALES_DEBT'            // Chuyên Viên Kinh Doanh, CSKH & Thu Hồi Nợ
  | 'TOKEN_ARCHIVE';        // Chuyên Viên Chữ Ký Số & Lưu Trữ

export interface WorkbenchHeaderProps {
  currentUser?: User;
  activeArchetype: WorkbenchArchetype;
  onSelectArchetype?: (archetype: WorkbenchArchetype) => void;
  urgentTasksCount: number;
  overdueTasksCount: number;
  pendingReviewCount: number;
  myCustomersCount: number;
  onOpenCreateTask?: () => void;
  onNavigateToTab?: (tab: string) => void;
  onOpenRenewalCenter?: () => void;
  canSwitchPerspective?: boolean;
  onOpenLeaveAndTripModal?: () => void;
  leaveAndTripCount?: number;
}

export const ARCHETYPE_CONFIG: Record<WorkbenchArchetype, {
  label: string;
  title: string;
  subTitle: string;
  badge: string;
  badgeColor: string;
  icon: any;
}> = {
  EXECUTIVE: {
    label: 'Ban Giám Đốc (BOD)',
    title: 'Bàn Điều Hành & Chỉ Huy Toàn Diện (Executive Cockpit)',
    subTitle: 'Tổng quan bức tranh doanh thu, nợ đọng, rủi ro thuế và năng định phân bổ 30 nhân sự',
    badge: 'Ban Giám Đốc',
    badgeColor: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    icon: Sparkles,
  },
  MANAGER_REVIEWER: {
    label: 'Trưởng Phòng / Trưởng Nhóm',
    title: 'Bàn Điều Phối Tiến Độ & Kiểm Soát Chất Lượng (Quality Hub)',
    subTitle: 'Hàng đợi soát xét cấp 1 & cấp 2, điều chuyển công việc, cảnh báo tiến độ và phân bổ chuyên viên',
    badge: 'Quản Lý & Soát Xét',
    badgeColor: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    icon: Layers,
  },
  TAX_SPECIALIST: {
    label: 'Chuyên Viên Kế Toán Thuế',
    title: 'Bàn Tác Nghiệp Cá Nhân & Khách Hàng Phụ Trách (Action Desk)',
    subTitle: 'Công việc cần xử lý hôm nay, tiến độ tờ khai thuế danh mục và theo dõi Chữ ký số Token',
    badge: 'Kế Toán Thuế',
    badgeColor: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    icon: FileText,
  },
  HR_PAYROLL: {
    label: 'Chuyên Viên HCNS & Tiền Lương',
    title: 'Bàn Quản Trị Nhân Sự, Bảng Lương & BHXH (HR & C&B Desk)',
    subTitle: 'Duyệt đơn nghỉ phép, theo dõi hợp đồng lao động/thử việc, chốt công tính lương và báo tăng giảm BHXH',
    badge: 'Hành Chính - Nhân Sự',
    badgeColor: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    icon: UserCheck,
  },
  LEGAL: {
    label: 'Chuyên Viên Pháp Lý & ĐKKD',
    title: 'Bàn Hồ Sơ Pháp Lý & Đăng Ký Kinh Doanh (Legal Desk)',
    subTitle: 'Tiến độ cấp mới/thay đổi giấy phép ĐKKD, nộp hồ sơ Sở KH&ĐT và bàn giao con dấu/kết quả',
    badge: 'Pháp Lý Doanh Nghiệp',
    badgeColor: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    icon: ShieldCheck,
  },
  SALES_DEBT: {
    label: 'Kinh Doanh & Thu Hồi Nợ',
    title: 'Bàn Quản Trị Hợp Đồng, Tái Ký & Thu Hồi Nợ (Sales & CSKH)',
    subTitle: 'Danh mục hợp đồng đến hạn tái ký (30-60 ngày), thu hồi nợ đọng dịch vụ và tiếp nhận yêu cầu mới',
    badge: 'Sales & Thu Hồi Nợ',
    badgeColor: 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
    icon: RefreshCw,
  },
  TOKEN_ARCHIVE: {
    label: 'Quản Lý CKS & Lưu Trữ',
    title: 'Bàn Quản Trị Chữ Ký Số, Token & Văn Thư Lưu Trữ (CKS Desk)',
    subTitle: 'Theo dõi hạn dùng Token CKS khách hàng, mượn trả thiết bị ký số và bàn giao hồ sơ vật lý',
    badge: 'Văn Thư & CKS',
    badgeColor: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    icon: Clock,
  },
};

export const WorkbenchHeader: React.FC<WorkbenchHeaderProps> = ({
  currentUser,
  activeArchetype,
  onSelectArchetype,
  urgentTasksCount,
  overdueTasksCount,
  pendingReviewCount,
  myCustomersCount,
  onOpenCreateTask,
  onNavigateToTab,
  onOpenRenewalCenter,
  canSwitchPerspective,
  onOpenLeaveAndTripModal,
  leaveAndTripCount = 0,
}) => {
  const currentConfig = ARCHETYPE_CONFIG[activeArchetype] || ARCHETYPE_CONFIG.EXECUTIVE;
  const Icon = currentConfig.icon;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
      {/* Top row: Greeting, role badge & Perspective selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* User identification */}
        <div className="flex items-start sm:items-center space-x-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'TC'}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                {currentUser?.name || 'Cán Bộ Hệ Thống'}
              </h1>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${currentConfig.badgeColor}`}>
                {currentUser?.position || currentConfig.badge}
              </span>
              <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                Mã: {currentUser?.code || 'NV-001'}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center space-x-1.5 truncate">
              <span className="font-medium">{currentConfig.title}</span>
              <span>•</span>
              <span>Ngày: {formatDate(CURRENT_SYSTEM_DATE)}</span>
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onOpenCreateTask && (
            <button
              type="button"
              onClick={onOpenCreateTask}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Tạo việc mới</span>
            </button>
          )}

          {/* Quick Button: Nghỉ phép & Công tác */}
          {onOpenLeaveAndTripModal && (
            <button
              type="button"
              onClick={onOpenLeaveAndTripModal}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer hover:shadow-xs"
              title="Đăng ký nhanh Nghỉ phép, Lệnh đi công tác hoặc Duyệt đơn chờ"
            >
              <Plane className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Nghỉ phép & Công tác ({leaveAndTripCount})</span>
            </button>
          )}

          {onNavigateToTab && (
            <button
              type="button"
              onClick={() => onNavigateToTab('CUSTOMER_PORTAL')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
              <span className="hidden sm:inline">Cổng eTax</span>
            </button>
          )}

          {onOpenRenewalCenter && (
            <button
              type="button"
              onClick={onOpenRenewalCenter}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5 text-amber-600" />
              <span>Tái ký</span>
            </button>
          )}
        </div>
      </div>

      {/* Operational Highlights Pill Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
        <div className="flex items-center space-x-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
          <Clock className="h-4 w-4 text-orange-500 shrink-0" />
          <div className="min-w-0 flex-1 truncate">
            <span className="text-slate-500 text-[11px]">Hạn nộp T7: </span>
            <span className="font-bold text-slate-800 dark:text-slate-200">20/08 (GTGT, TNCN)</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
          <BellRing className={`h-4 w-4 ${overdueTasksCount > 0 ? 'text-red-500' : 'text-slate-400'} shrink-0`} />
          <div className="min-w-0 flex-1 truncate">
            <span className="text-slate-500 text-[11px]">Việc quá hạn: </span>
            <span className={`font-bold ${overdueTasksCount > 0 ? 'text-red-600' : 'text-slate-700 dark:text-slate-300'}`}>
              {overdueTasksCount} việc
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
          <CheckCircle2 className="h-4 w-4 text-purple-500 shrink-0" />
          <div className="min-w-0 flex-1 truncate">
            <span className="text-slate-500 text-[11px]">Chờ kiểm duyệt: </span>
            <span className="font-bold text-purple-600 dark:text-purple-400">{pendingReviewCount} hồ sơ</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
          <Briefcase className="h-4 w-4 text-blue-500 shrink-0" />
          <div className="min-w-0 flex-1 truncate">
            <span className="text-slate-500 text-[11px]">KH phụ trách: </span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{myCustomersCount} doanh nghiệp</span>
          </div>
        </div>
      </div>
    </div>
  );
};

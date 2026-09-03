import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  SlidersHorizontal,
  ShieldCheck
} from 'lucide-react';
import { UserRole } from '../../types';

export type ActiveTabType = 
  | 'COCKPIT'
  | 'TASKS_TAX'
  | 'CUSTOMERS'
  | 'CUSTOMER_PORTAL'
  | 'OPERATIONS'
  // Legacy aliases
  | 'DASHBOARD'
  | 'TASKS'
  | 'HR_MANAGEMENT'
  | 'TAX_CALENDAR'
  | 'KPI_STAFF'
  | 'TEMPLATES'
  | 'REPORTS'
  | 'AUDIT_LOGS'
  | 'SETTINGS';

interface NavigationTabsProps {
  activeTab: ActiveTabType;
  onTabChange: (tab: ActiveTabType) => void;
  userRole: UserRole;
  counts: {
    urgentTasks: number;
    pendingReview: number;
    pendingApproval: number;
    totalActiveTasks: number;
    totalCustomers: number;
  };
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onTabChange,
  userRole,
  counts,
}) => {
  const normalizedTab: 'COCKPIT' | 'TASKS_TAX' | 'CUSTOMERS' | 'CUSTOMER_PORTAL' | 'OPERATIONS' = 
    activeTab === 'DASHBOARD' ? 'COCKPIT' :
    activeTab === 'TASKS' || activeTab === 'TAX_CALENDAR' || activeTab === 'TEMPLATES' ? 'TASKS_TAX' :
    activeTab === 'CUSTOMERS' ? 'CUSTOMERS' :
    activeTab === 'CUSTOMER_PORTAL' ? 'CUSTOMER_PORTAL' :
    activeTab === 'HR_MANAGEMENT' || activeTab === 'KPI_STAFF' || activeTab === 'REPORTS' || activeTab === 'AUDIT_LOGS' || activeTab === 'SETTINGS' ? 'OPERATIONS' :
    (activeTab as any);

  const mainTabs = [
    {
      id: 'COCKPIT' as ActiveTabType,
      label: userRole === 'BAN_GIAM_DOC' || userRole === 'ADMIN' ? 'Tổng Quan & Điều Hành' : 'Bàn Làm Việc',
      icon: LayoutDashboard,
      badge: counts.urgentTasks > 0 ? { count: counts.urgentTasks, color: 'bg-red-500 text-white' } : undefined,
    },
    {
      id: 'TASKS_TAX' as ActiveTabType,
      label: 'Quản Lý Công Việc & Lịch Thuế',
      icon: CheckSquare,
      badge: counts.totalActiveTasks > 0 ? { count: counts.totalActiveTasks, color: 'bg-blue-600 text-white' } : undefined,
    },
    {
      id: 'CUSTOMERS' as ActiveTabType,
      label: 'Khách Hàng & Hợp Đồng',
      icon: Users,
      badge: { count: counts.totalCustomers, color: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300' },
    },
    {
      id: 'OPERATIONS' as ActiveTabType,
      label: 'Vận Hành & Nhân Sự',
      icon: SlidersHorizontal,
    },
    {
      id: 'CUSTOMER_PORTAL' as ActiveTabType,
      label: 'Cổng Tra Cứu Khách Hàng',
      icon: ShieldCheck,
      badge: { count: 'eTax', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300' },
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs sticky top-15 z-30">
      <div className="w-full px-3 sm:px-6 lg:px-8">
        <div className="flex space-x-1.5 sm:space-x-2 overflow-x-auto py-2 no-scrollbar">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = normalizedTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id.toLowerCase()}`}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg transition-all whitespace-nowrap text-xs sm:text-sm font-semibold cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono ${
                    isActive ? 'bg-white/25 text-white' : tab.badge.color
                  }`}>
                    {tab.badge.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

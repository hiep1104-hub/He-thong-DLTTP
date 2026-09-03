import React, { useState, useEffect, useMemo } from 'react';
import { Customer, Task, User, StaffKPIRecord, AuditLog, HRWorkflowSOP } from '../../types';
import { HRManagementView } from '../hr/HRManagementView';
import { KPIStaffView } from '../kpi/KPIStaffView';
import { ReportsView } from '../reports/ReportsView';
import { SettingsView } from '../settings/SettingsView';
import { AuditLogsView } from '../audit/AuditLogsView';
import { WorkloadBalancingDashboard } from './WorkloadBalancingDashboard';
import { PermissionService } from '../../utils/permissions';
import { 
  Briefcase, 
  Award, 
  BarChart3, 
  History, 
  ShieldCheck,
  Scale,
  Lock
} from 'lucide-react';

interface OperationsHubViewProps {
  currentUser: User;
  users: User[];
  tasks: Task[];
  customers: Customer[];
  staffKPIs: StaffKPIRecord[];
  auditLogs: AuditLog[];
  onDataReload: () => void;
  onOpenCreateTaskWithSOP?: (sop: HRWorkflowSOP) => void;
  onSelectCustomer?: (customer: Customer) => void;
  onSwitchUser?: (user: User) => void;
}

export type OperationsSubTab = 'WORKLOAD' | 'HR' | 'KPI' | 'REPORTS' | 'RBAC_SETTINGS' | 'AUDIT';

export const OperationsHubView: React.FC<OperationsHubViewProps> = ({
  currentUser,
  users,
  tasks,
  customers,
  staffKPIs,
  auditLogs,
  onDataReload,
  onOpenCreateTaskWithSOP,
  onSelectCustomer,
  onSwitchUser,
}) => {
  // Available tabs for current user based on RBAC
  const availableTabs = useMemo(() => {
    const tabs: { key: OperationsSubTab; label: string; icon: any }[] = [
      { key: 'WORKLOAD', label: 'Phân Bổ Tải Trọng (Workload)', icon: Scale },
    ];

    if (PermissionService.canAccessOperationsSubTab(currentUser, 'HR')) {
      tabs.push({ key: 'HR', label: 'Nhân sự & Lương', icon: Briefcase });
    }

    if (PermissionService.canAccessOperationsSubTab(currentUser, 'KPI')) {
      tabs.push({ key: 'KPI', label: 'KPI & Năng suất', icon: Award });
    }

    if (PermissionService.canAccessOperationsSubTab(currentUser, 'REPORTS')) {
      tabs.push({ key: 'REPORTS', label: 'Báo cáo doanh thu', icon: BarChart3 });
    }

    if (PermissionService.canAccessOperationsSubTab(currentUser, 'RBAC_SETTINGS')) {
      tabs.push({ key: 'RBAC_SETTINGS', label: 'Cài đặt & Phân quyền', icon: ShieldCheck });
    }

    if (PermissionService.canAccessOperationsSubTab(currentUser, 'AUDIT')) {
      tabs.push({ key: 'AUDIT', label: 'Nhật ký', icon: History });
    }

    return tabs;
  }, [currentUser]);

  const [selectedSubTab, setSelectedSubTab] = useState<OperationsSubTab>('WORKLOAD');

  // Derive effective tab safely
  const effectiveSubTab: OperationsSubTab = useMemo(() => {
    if (availableTabs.some(t => t.key === selectedSubTab)) {
      return selectedSubTab;
    }
    return availableTabs[0]?.key || 'WORKLOAD';
  }, [availableTabs, selectedSubTab]);

  return (
    <div className="space-y-4">
      {/* Sub Header & Tab Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2.5 sm:p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-850 p-1 rounded-xl overflow-x-auto no-scrollbar">
          {availableTabs.map((tabItem) => {
            const Icon = tabItem.icon;
            const isActive = effectiveSubTab === tabItem.key;
            return (
              <button
                key={tabItem.key}
                onClick={() => setSelectedSubTab(tabItem.key)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tabItem.label}</span>
              </button>
            );
          })}
        </div>

        {(currentUser.role === 'NHAN_VIEN' || currentUser.role === 'TRUONG_NHOM') && (
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 px-2 font-medium">
            <Lock className="h-3 w-3 text-amber-500" />
            <span>Phân quyền chuyên môn: Đã thiết lập quyền hạn chuẩn theo chức năng & vị trí công việc</span>
          </div>
        )}
      </div>

      {/* Sub-Tab Contents */}
      {effectiveSubTab === 'WORKLOAD' && (
        <WorkloadBalancingDashboard
          currentUser={currentUser}
          onSelectCustomer={onSelectCustomer}
          onRefresh={onDataReload}
        />
      )}

      {effectiveSubTab === 'HR' && PermissionService.canAccessOperationsSubTab(currentUser, 'HR') && (
        <HRManagementView
          currentUser={currentUser}
          users={users}
          customers={customers}
          onOpenCreateTaskWithSOP={onOpenCreateTaskWithSOP}
          onSelectCustomer={(cId) => {
            const cust = customers.find(c => c.id === cId);
            if (cust && onSelectCustomer) onSelectCustomer(cust);
          }}
        />
      )}

      {effectiveSubTab === 'KPI' && PermissionService.canAccessOperationsSubTab(currentUser, 'KPI') && (
        <KPIStaffView
          staffKPIs={staffKPIs}
          users={users}
          tasks={tasks}
          currentUser={currentUser}
        />
      )}

      {effectiveSubTab === 'REPORTS' && PermissionService.canAccessOperationsSubTab(currentUser, 'REPORTS') && (
        <ReportsView
          tasks={tasks}
          customers={customers}
          users={users}
          staffKPIs={staffKPIs}
          currentUser={currentUser}
          onDataReload={onDataReload}
          onUpdateCustomer={(updated) => {
            if (onSelectCustomer) onSelectCustomer(updated);
            onDataReload();
          }}
        />
      )}

      {effectiveSubTab === 'RBAC_SETTINGS' && PermissionService.canAccessOperationsSubTab(currentUser, 'RBAC_SETTINGS') && (
        <SettingsView
          currentUser={currentUser}
          allUsers={users}
          onDataReload={onDataReload}
          onSwitchUser={onSwitchUser}
          initialTab="IAM_SECURITY"
        />
      )}

      {effectiveSubTab === 'AUDIT' && PermissionService.canAccessOperationsSubTab(currentUser, 'AUDIT') && (
        <AuditLogsView
          auditLogs={auditLogs}
          currentUser={currentUser}
          users={users}
          tasks={tasks}
        />
      )}
    </div>
  );
};

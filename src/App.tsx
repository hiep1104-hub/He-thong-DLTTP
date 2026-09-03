import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Customer, Task, User, ChecklistTemplate, AuditLog, StaffKPIRecord, UserRole, AdHocServiceItem, HRWorkflowSOP } from './types';
import { storageService, CURRENT_SYSTEM_DATE } from './services/storageService';
import { PermissionService } from './utils/permissions';
import { Header } from './components/common/Header';
import { DuplicateScannerModal } from './components/common/DuplicateScannerModal';
import { NavigationTabs, ActiveTabType } from './components/common/NavigationTabs';
import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard';
import { TasksHubView } from './components/tasks/TasksHubView';
import { TaskDetailModal } from './components/tasks/TaskDetailModal';
import { TaskCreateModal } from './components/tasks/TaskCreateModal';
import { CustomerList } from './components/customers/CustomerList';
import { CustomerDetailModal } from './components/customers/CustomerDetailModal';
import { CustomerCreateModal } from './components/customers/CustomerCreateModal';
import { OperationsHubView } from './components/operations/OperationsHubView';
import { CycleRenewalCenterModal } from './components/renewals/CycleRenewalCenterModal';
import { CustomerPortalView } from './components/customers/CustomerPortalView';
import { LoginModal } from './components/auth/LoginModal';
import { IAMSecurityCenterView } from './components/iam/IAMSecurityCenterView';
import { AlertCircle, X } from 'lucide-react';

export default function App() {
  // Master state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [staffKPIs, setStaffKPIs] = useState<StaffKPIRecord[]>([]);

  // Current logged in user / persona for RBAC
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return storageService.getLoggedInUser() || storageService.getCurrentUser();
  });

  // Active view tab (5 Core Pillars: COCKPIT | TASKS_TAX | CUSTOMERS | OPERATIONS | CUSTOMER_PORTAL)
  const [activeTab, setActiveTab] = useState<ActiveTabType>('COCKPIT');

  // Modals & Selected states
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateCustomerOpen, setIsCreateCustomerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isDuplicateScannerOpen, setIsDuplicateScannerOpen] = useState(false);
  const [isRenewalCenterOpen, setIsRenewalCenterOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isIAMVaultOpen, setIsIAMVaultOpen] = useState(false);
  const [conflictAlert, setConflictAlert] = useState<string | null>(null);
  const [taskFilterPreset, setTaskFilterPreset] = useState<string | undefined>(undefined);
  const [preselectedCustomerForTask, setPreselectedCustomerForTask] = useState<Customer | undefined>(undefined);
  const [preselectedAdHocServiceForTask, setPreselectedAdHocServiceForTask] = useState<AdHocServiceItem | undefined>(undefined);
  const [preselectedHRWorkflowForTask, setPreselectedHRWorkflowForTask] = useState<HRWorkflowSOP | undefined>(undefined);
  const [portalTaxCode, setPortalTaxCode] = useState<string>('');

  // Load state from storageService
  const reloadData = useCallback(() => {
    const loadedTasks = storageService.getTasks();
    const loadedCustomers = storageService.getCustomers();
    const loadedUsers = storageService.getUsers();
    const loadedTemplates = storageService.getTemplates();
    const loadedAuditLogs = storageService.getAuditLogs();
    const loadedKPIs = storageService.calculateStaffKPIs();

    setTasks(loadedTasks);
    setCustomers(loadedCustomers);
    setUsers(loadedUsers);
    setTemplates(loadedTemplates);
    setAuditLogs(loadedAuditLogs);
    setStaffKPIs(loadedKPIs);

    setCurrentUser((prevUser) => {
      const savedUser = storageService.getLoggedInUser();
      if (savedUser) {
        if (!prevUser || prevUser.id !== savedUser.id) {
          return savedUser;
        }
        return prevUser;
      }
      return prevUser;
    });
  }, []);

  useEffect(() => {
    // Tự động phát sinh công việc theo thời gian quy định cho kỳ hiện tại
    storageService.autoCheckAndGeneratePeriodicTasksForCurrentPeriod();
    reloadData();
    // Realtime live sync across all staff browser tabs
    const unsubscribe = storageService.subscribeToSync((evt) => {
      if (evt && (evt.type === 'LOCK_ACQUIRED' || evt.type === 'LOCK_RELEASED')) {
        return; // Ignore presence lock notifications
      }
      reloadData();
    });
    return () => unsubscribe();
  }, [reloadData]);

  // Handle Switch User (Persona switcher for RBAC testing)
  const handleSwitchUser = (userOrId: User | string) => {
    const user = typeof userOrId === 'string' ? users.find(u => u.id === userOrId) : userOrId;
    if (!user) return;
    storageService.setCurrentUserId(user.id);
    setCurrentUser(user);
  };

  // Handle Logout
  const handleLogout = () => {
    if (currentUser) {
      storageService.logout(currentUser);
    }
    setCurrentUser(null);
    setIsLoginModalOpen(false);
  };

  // Task CRUD operations with Optimistic Concurrency Protection
  const handleCreateTask = (newTask: Task) => {
    storageService.createTask(newTask, currentUser || undefined);
    reloadData();
  };

  const handleUpdateTask = (updatedTask: Task, reason?: string) => {
    const result = storageService.updateTask(updatedTask, currentUser || undefined, reason);
    if (result.conflict) {
      setConflictAlert(result.message || 'Phát hiện xung đột: Dữ liệu vừa được nhân viên khác cập nhật!');
      reloadData();
      return;
    }
    setSelectedTask(result.serverEntity || updatedTask);
    reloadData();
  };

  // Customer CRUD operations with Optimistic Concurrency Protection
  const handleCreateCustomer = (newCustomer: Customer) => {
    storageService.createCustomer(newCustomer, currentUser || undefined);
    reloadData();
  };

  const handleUpdateCustomer = (updatedCustomer: Customer) => {
    const result = storageService.updateCustomer(updatedCustomer, currentUser || undefined);
    if (result.conflict) {
      setConflictAlert(result.message || 'Phát hiện xung đột: Khách hàng vừa được cập nhật bởi nhân viên khác!');
      reloadData();
      return;
    }
    setSelectedCustomer(result.serverEntity || updatedCustomer);
    reloadData();
  };

  const handleDeleteCustomer = (customerId: string) => {
    storageService.deleteCustomer(customerId, currentUser || undefined);
    if (selectedCustomer?.id === customerId) {
      setSelectedCustomer(null);
    }
    reloadData();
  };

  // Navigation shortcuts from dashboard
  const handleNavigateToTasksWithFilter = (filterPreset?: string) => {
    setTaskFilterPreset(filterPreset);
    setActiveTab('TASKS_TAX');
  };

  const handleOpenCreateTaskForCustomer = (cust: Customer) => {
    setPreselectedCustomerForTask(cust);
    setIsCreateTaskOpen(true);
  };

  const handleSelectTemplateToCreateTask = (template: ChecklistTemplate) => {
    setPreselectedCustomerForTask(undefined);
    setPreselectedAdHocServiceForTask(undefined);
    setPreselectedHRWorkflowForTask(undefined);
    setIsCreateTaskOpen(true);
  };

  const handleSelectAdHocServiceToCreateTask = (service: AdHocServiceItem) => {
    setPreselectedAdHocServiceForTask(service);
    setPreselectedCustomerForTask(undefined);
    setPreselectedHRWorkflowForTask(undefined);
    setIsCreateTaskOpen(true);
  };

  const handleSelectHRWorkflowToCreateTask = (sop: HRWorkflowSOP) => {
    setPreselectedHRWorkflowForTask(sop);
    setPreselectedCustomerForTask(undefined);
    setPreselectedAdHocServiceForTask(undefined);
    setIsCreateTaskOpen(true);
  };

  // Data visibility scoping: Strict isolation for specialist staff
  const canViewAllTasks = PermissionService.canViewAllTasks(currentUser);
  const canViewAllCustomers = PermissionService.canViewAllCustomers(currentUser);

  // Filtered tasks visible to the current user (only assigned / involved tasks if not authorized for all)
  const scopedTasks = useMemo(() => {
    if (!currentUser) return tasks;
    if (canViewAllTasks) return tasks;
    return tasks.filter(t => 
      t.assigneeId === currentUser.id || 
      t.reviewerId === currentUser.id || 
      t.approverId === currentUser.id
    );
  }, [tasks, canViewAllTasks, currentUser]);

  // Filtered customers visible to the current user (only assigned portfolio if not authorized for all)
  const scopedCustomers = useMemo(() => {
    if (!currentUser) return customers;
    if (canViewAllCustomers) return customers;
    return customers.filter(c => 
      c.assignedStaffId === currentUser.id || 
      c.reviewerStaffId === currentUser.id || 
      (c.supportStaffIds && c.supportStaffIds.includes(currentUser.id)) ||
      tasks.some(t => t.customerId === c.id && (t.assigneeId === currentUser.id || t.reviewerId === currentUser.id))
    );
  }, [customers, canViewAllCustomers, currentUser, tasks]);

  // Calculated alert counts based strictly on visible scoped data
  const urgentTasksCount = scopedTasks.filter(t => {
    const s = storageService.getTaskDeadlineStatus(t);
    return s.isOverdue || s.alertColor === 'RED' || s.alertColor === 'DARK_RED' || t.priority === 'KHAN_CAP';
  }).length;

  const pendingReviewCount = scopedTasks.filter(t => t.status === 'CHO_KIEM_TRA' || t.status === 'CHO_PHE_DUYET').length;
  const pendingApprovalCount = scopedTasks.filter(t => t.status === 'CHO_PHE_DUYET').length;
  const totalActiveTasksCount = scopedTasks.filter(t => t.status !== 'HOAN_THANH' && t.status !== 'HUY').length;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-center items-center p-4 relative">
        <LoginModal
          isOpen={true}
          onLoginSuccess={(user) => {
            storageService.setCurrentUserId(user.id);
            setCurrentUser(user);
            reloadData();
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col selection:bg-blue-500 selection:text-white">
      
      {/* 1. Unified Master Header with Realtime Status, Quick Create & Persona Switcher */}
      <Header
        currentUser={currentUser}
        allUsers={users}
        onSwitchUser={handleSwitchUser}
        urgentTasksCount={urgentTasksCount}
        pendingReviewCount={pendingReviewCount}
        pendingApprovalCount={pendingApprovalCount}
        onOpenUrgentTasks={() => handleNavigateToTasksWithFilter('OVERDUE')}
        onOpenCreateTask={() => { setPreselectedCustomerForTask(undefined); setIsCreateTaskOpen(true); }}
        onOpenCreateCustomer={() => setIsCreateCustomerOpen(true)}
        onOpenDuplicateScanner={() => setIsDuplicateScannerOpen(true)}
        onForceSync={reloadData}
        onOpenSearch={() => setActiveTab('TASKS_TAX')}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenIAMVault={() => setIsIAMVaultOpen(true)}
        onLogout={handleLogout}
      />

      {/* Concurrency Conflict Protection Toast */}
      {conflictAlert && (
        <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-between text-xs font-bold shadow-md animate-in slide-in-from-top-1 z-30">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{conflictAlert}</span>
          </div>
          <button
            onClick={() => setConflictAlert(null)}
            className="px-2.5 py-0.5 bg-white text-red-600 rounded text-[11px] font-bold hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Đã hiểu & Tải lại
          </button>
        </div>
      )}

      {/* 2. Sleek Core Navigation Tabs */}
      <NavigationTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userRole={currentUser.role}
        counts={{
          urgentTasks: urgentTasksCount,
          pendingReview: pendingReviewCount,
          pendingApproval: pendingApprovalCount,
          totalActiveTasks: totalActiveTasksCount,
          totalCustomers: scopedCustomers.length,
        }}
      />

      {/* 3. Main Workspace Container */}
      <main className="flex-1 w-full px-3 sm:px-6 lg:px-8 py-4">
        
        {/* PILLAR 1: COCKPIT / TỔNG QUAN & ĐIỀU HÀNH */}
        {(activeTab === 'COCKPIT' || activeTab === 'DASHBOARD') && (
          <ExecutiveDashboard
            tasks={scopedTasks}
            customers={scopedCustomers}
            users={users}
            staffKPIs={staffKPIs}
            currentUser={currentUser}
            onSelectTask={setSelectedTask}
            onSelectCustomer={setSelectedCustomer}
            onNavigateToTasks={handleNavigateToTasksWithFilter}
            onOpenRenewalCenter={() => setIsRenewalCenterOpen(true)}
            onOpenCreateTask={() => setIsCreateTaskOpen(true)}
            onNavigateToTab={(tab) => {
              if (tab === 'TASKS' || tab === 'TAX_CALENDAR' || tab === 'TEMPLATES') setActiveTab('TASKS_TAX');
              else if (tab === 'CUSTOMERS') setActiveTab('CUSTOMERS');
              else if (tab === 'HR_MANAGEMENT' || tab === 'KPI_STAFF' || tab === 'REPORTS' || tab === 'SETTINGS') setActiveTab('OPERATIONS');
              else setActiveTab(tab as ActiveTabType);
            }}
          />
        )}

        {/* PILLAR 2: TASKS & TAX HUB / CÔNG VIỆC & LỊCH THUẾ */}
        {(activeTab === 'TASKS_TAX' || activeTab === 'TASKS' || activeTab === 'TAX_CALENDAR' || activeTab === 'TEMPLATES') && (
          <TasksHubView
            tasks={scopedTasks}
            customers={scopedCustomers}
            users={users}
            templates={templates}
            currentUser={currentUser}
            onSelectTask={setSelectedTask}
            onSelectCustomer={setSelectedCustomer}
            onOpenCreateTaskForCustomer={handleOpenCreateTaskForCustomer}
            onOpenCreateTask={() => {
              setPreselectedCustomerForTask(undefined);
              setPreselectedAdHocServiceForTask(undefined);
              setPreselectedHRWorkflowForTask(undefined);
              setIsCreateTaskOpen(true);
            }}
            onSelectTemplateToCreateTask={handleSelectTemplateToCreateTask}
            onSelectAdHocServiceToCreateTask={handleSelectAdHocServiceToCreateTask}
            filterPreset={taskFilterPreset}
            onClearFilterPreset={() => setTaskFilterPreset(undefined)}
            onDataReload={reloadData}
          />
        )}

        {/* PILLAR 3: CUSTOMER 360 & DEBT / HỒ SƠ KHÁCH HÀNG & CÔNG NỢ */}
        {activeTab === 'CUSTOMERS' && (
          <CustomerList
            customers={scopedCustomers}
            tasks={scopedTasks}
            users={users}
            currentUser={currentUser}
            onSelectCustomer={setSelectedCustomer}
            onOpenCreateCustomer={() => {
              setEditingCustomer(null);
              setIsCreateCustomerOpen(true);
            }}
            onEditCustomer={(cust) => {
              setEditingCustomer(cust);
            }}
            onDeleteCustomer={handleDeleteCustomer}
            onOpenCreateTaskForCustomer={handleOpenCreateTaskForCustomer}
            onOpenPortalForCustomer={(taxCode) => {
              setPortalTaxCode(taxCode);
              setActiveTab('CUSTOMER_PORTAL');
            }}
          />
        )}

        {/* PILLAR 4: OPERATIONS & HR / VẬN HÀNH & NHÂN SỰ */}
        {(activeTab === 'OPERATIONS' || activeTab === 'HR_MANAGEMENT' || activeTab === 'KPI_STAFF' || activeTab === 'REPORTS' || activeTab === 'AUDIT_LOGS' || activeTab === 'SETTINGS') && (
          <OperationsHubView
            currentUser={currentUser}
            users={users}
            tasks={scopedTasks}
            customers={scopedCustomers}
            staffKPIs={staffKPIs}
            auditLogs={auditLogs}
            onDataReload={reloadData}
            onOpenCreateTaskWithSOP={handleSelectHRWorkflowToCreateTask}
            onSelectCustomer={setSelectedCustomer}
            onSwitchUser={handleSwitchUser}
          />
        )}

        {/* PILLAR 5: CUSTOMER PORTAL / CỔNG TRA CỨU KHÁCH HÀNG */}
        {activeTab === 'CUSTOMER_PORTAL' && (
          <CustomerPortalView 
            customers={scopedCustomers}
            initialTaxCode={portalTaxCode}
            onSelectCustomer={setSelectedCustomer}
            onSelectTask={setSelectedTask}
          />
        )}

      </main>

      {/* MODAL 1: TASK DETAIL & WORKFLOW EXECUTOR */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          customer={customers.find(c => c.id === selectedTask.customerId)}
          currentUser={currentUser}
          allUsers={users}
          onClose={() => setSelectedTask(null)}
          onUpdateTask={handleUpdateTask}
          onOpenCustomerDetail={(cust) => {
            setSelectedTask(null);
            setSelectedCustomer(cust);
          }}
        />
      )}

      {/* MODAL 2: TASK CREATE MODAL */}
      {isCreateTaskOpen && (
        <TaskCreateModal
          customers={customers}
          users={users}
          templates={templates}
          currentUser={currentUser}
          onClose={() => {
            setIsCreateTaskOpen(false);
            setPreselectedCustomerForTask(undefined);
            setPreselectedAdHocServiceForTask(undefined);
            setPreselectedHRWorkflowForTask(undefined);
          }}
          onCreateTask={handleCreateTask}
          preselectedCustomer={preselectedCustomerForTask}
          preselectedAdHocService={preselectedAdHocServiceForTask}
          preselectedHRWorkflow={preselectedHRWorkflowForTask}
        />
      )}

      {/* MODAL 3: CUSTOMER DETAIL & 360 PROFILE */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          tasks={tasks}
          users={users}
          currentUser={currentUser}
          onClose={() => setSelectedCustomer(null)}
          onSelectTask={(task) => {
            setSelectedCustomer(null);
            setSelectedTask(task);
          }}
          onOpenCreateTaskForCustomer={handleOpenCreateTaskForCustomer}
          onUpdateCustomer={handleUpdateCustomer}
          onEditCustomer={(cust) => {
            setEditingCustomer(cust);
          }}
          onTasksChanged={reloadData}
          onOpenPortalForCustomer={(taxCode) => {
            setSelectedCustomer(null);
            setPortalTaxCode(taxCode);
            setActiveTab('CUSTOMER_PORTAL');
          }}
        />
      )}

      {/* MODAL 4: CUSTOMER CREATE & EDIT MODAL */}
      {(isCreateCustomerOpen || editingCustomer) && (
        <CustomerCreateModal
          users={users}
          currentUser={currentUser}
          editingCustomer={editingCustomer}
          onClose={() => {
            setIsCreateCustomerOpen(false);
            setEditingCustomer(null);
          }}
          onCreateCustomer={(newCust) => {
            handleCreateCustomer(newCust);
            setIsCreateCustomerOpen(false);
          }}
          onUpdateCustomer={(updatedCust) => {
            handleUpdateCustomer(updatedCust);
            setEditingCustomer(null);
          }}
        />
      )}

      {/* MODAL 5: DUPLICATE SCANNER & DATA INTEGRITY ENGINE */}
      {isDuplicateScannerOpen && (
        <DuplicateScannerModal
          isOpen={isDuplicateScannerOpen}
          onClose={() => setIsDuplicateScannerOpen(false)}
          currentUser={currentUser}
          onOpenCustomer={(cust) => {
            setIsDuplicateScannerOpen(false);
            setSelectedCustomer(cust);
          }}
          onOpenTask={(tsk) => {
            setIsDuplicateScannerOpen(false);
            setSelectedTask(tsk);
          }}
          onDataChanged={reloadData}
        />
      )}

      {/* MODAL 6: CYCLE EXPIRATION & RENEWAL RADAR CENTER */}
      {isRenewalCenterOpen && (
        <CycleRenewalCenterModal
          isOpen={isRenewalCenterOpen}
          onClose={() => setIsRenewalCenterOpen(false)}
          currentUser={currentUser}
          onDataChanged={reloadData}
          onSelectCustomer={(cust) => {
            setIsRenewalCenterOpen(false);
            setSelectedCustomer(cust);
          }}
        />
      )}

      {/* MODAL 7: ENTERPRISE LOGIN & AUTHENTICATION MODAL */}
      {isLoginModalOpen && (
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setIsLoginModalOpen(false);
            reloadData();
          }}
        />
      )}

      {/* MODAL 8: IAM CREDENTIALS & SECURITY LIFECYCLE MODAL */}
      {isIAMVaultOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-6xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-4 sm:p-6 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Trung Tâm Quản Trị Bảo Mật & Vòng Đời Tài Khoản (30 Nhân Sự)
              </span>
              <button
                onClick={() => setIsIAMVaultOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <IAMSecurityCenterView
              currentUser={currentUser}
              onDataReload={reloadData}
              onSwitchUser={(u) => {
                handleSwitchUser(u);
                setIsIAMVaultOpen(false);
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
}

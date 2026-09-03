import { User, UserRole, Department, Task, Customer } from './index';

export type PermissionAction =
  // Task & Workflow Permissions
  | 'task:view_all'
  | 'task:view_assigned'
  | 'task:create'
  | 'task:edit'
  | 'task:delete'
  | 'task:execute_step'
  | 'task:submit_review'
  | 'task:review_approve'
  | 'task:final_approve'
  | 'task:reassign'

  // Customer & Business Profile Permissions
  | 'customer:view_all'
  | 'customer:view_assigned'
  | 'customer:create'
  | 'customer:edit'
  | 'customer:delete'
  | 'customer:view_financials'

  // HR, Payroll, BHXH & Labor Permissions
  | 'hr:view_all_profiles'
  | 'hr:edit_profile'
  | 'hr:view_all_payroll'
  | 'hr:view_own_payroll'
  | 'hr:manage_payroll'
  | 'hr:approve_payroll'
  | 'hr:manage_bhxh_records'
  | 'hr:manage_sops'
  | 'hr:request_leave'
  | 'hr:review_leave'
  | 'hr:approve_leave'

  // Legal & Enterprise Registration (ĐKKD)
  | 'legal:view_all_dossiers'
  | 'legal:create_dossier'
  | 'legal:review_dossier'

  // Sales, Contract & Debt Recovery
  | 'contract:view_all'
  | 'contract:create_edit'
  | 'contract:manage_debt'
  | 'cskh:receive_requests'

  // Administrative, Archives & Digital Signatures (CKS)
  | 'admin:manage_digital_signatures'
  | 'admin:manage_archives'

  // Tax & AI Reports
  | 'tax:view_calendar'
  | 'tax:use_ai_advisor'
  | 'report:view_executive'
  | 'report:export'

  // System & Security
  | 'system:view_audit_logs'
  | 'system:manage_settings'
  | 'system:backup_restore'
  | 'system:manage_permissions'

  // Templates, SOP & Service Packages (Quy trình mẫu & Gói)
  | 'template:view'
  | 'template:manage';

export type PermissionCategory = 
  | 'TASK' 
  | 'CUSTOMER' 
  | 'HR_PAYROLL_BHXH' 
  | 'LEGAL_DOSSIER'
  | 'CONTRACT_DEBT' 
  | 'ADMIN_CKS'
  | 'TAX_REPORT' 
  | 'SYSTEM_ADMIN';

export interface PermissionDefinition {
  id: PermissionAction;
  category: PermissionCategory;
  name: string;
  description: string;
  defaultRoles: UserRole[];
  relevantDepartments?: Department[];
}

export interface RolePermissionConfig {
  role: UserRole;
  name: string;
  description: string;
  badgeColor: string;
  allowedActions: PermissionAction[];
}

export interface DepartmentPermissionConfig {
  departmentKey: string;
  department: Department;
  name: string;
  positionTitle: string;
  description: string;
  iconName: string;
  badgeColor: string;
  allowedActions: PermissionAction[];
}


/**
 * Core Type Definitions for TaxCore WorkFlow Management System
 * Hệ thống Quản lý Công việc & Quy trình cho Doanh nghiệp Dịch vụ Thuế - Kế toán - HCNS
 */

export type Department = 
  | 'BAN_GIAM_DOC' 
  | 'KE_TOAN_THUE' 
  | 'HANH_CHINH_NHAN_SU' 
  | 'KINH_DOANH_CSKH';

export type UserRole = 
  | 'ADMIN' 
  | 'BAN_GIAM_DOC' 
  | 'TRUONG_PHONG' 
  | 'TRUONG_NHOM'
  | 'NHAN_VIEN';

export interface User {
  id: string;
  code: string;
  name: string;
  email: string;
  username?: string;
  password?: string;
  phone: string;
  avatar?: string;
  role: UserRole;
  department: Department;
  position: string;
  active: boolean;
  accountStatus?: AccountLifecycleState;
}

// ==========================================
// IAM & EMPLOYEE CREDENTIAL LIFECYCLE TYPES (Quản trị Vòng Đời Tài Khoản & Mật Khẩu IAM)
// ==========================================

export type AccountLifecycleState = 
  | 'PENDING_ONBOARDING'     // 1. Mới phát sinh (Đang tiếp nhận / Onboarding - Chờ kích hoạt tài khoản)
  | 'ACTIVE'                 // 2. Đang hoạt động (Thử việc / HĐ chính thức - Quyền truy cập bình thường)
  | 'FORCE_PASSWORD_CHANGE'  // 3. Yêu cầu đổi mật khẩu lần đầu (Sau cấp mới / Reset bảo mật)
  | 'SUSPENDED'              // 4. Tạm khóa bảo mật (Tạm hoãn HĐ, nghỉ dài ngày, cảnh báo an toàn)
  | 'TERMINATED_LOCKED';     // 5. Đã chấm dứt / Thu hồi quyền (Kết thúc HĐLĐ, đã bàn giao, khóa vĩnh viễn)

export interface UserCredential {
  id: string;
  userId: string; // Map to User.id / Employee.id
  employeeCode: string;
  employeeName: string;
  username: string; // Tên đăng nhập (VD: toan.nguyen, mai.tran, admin, etc.)
  email: string;
  password: string; // Mật khẩu hiện tại
  rawInitialPassword?: string; // Mật khẩu ban đầu được sinh ra để HR bàn giao cho NV
  role: UserRole;
  department: Department;
  position: string;
  status: AccountLifecycleState;
  twoFactorEnabled: boolean;
  twoFactorMethod?: 'TOTP_AUTHENTICATOR' | 'EMAIL_OTP' | 'SMS_OTP';
  twoFactorSecret?: string;
  passwordUpdatedAt: string;
  passwordExpiryDays: number; // Mặc định 90 ngày theo chuẩn ISO 27001
  isPasswordExpired?: boolean;
  failedLoginAttempts: number;
  maxFailedAttempts: number;
  lastLoginAt?: string;
  lastLoginIp?: string;
  issuedAt: string;
  issuedBy: string;
  issuedByName: string;
  revokedAt?: string;
  revocationReason?: string;
  notes?: string;
}

export type UserLifecycleAction = 
  | 'CREATE_CREDENTIAL' 
  | 'RESET_PASSWORD' 
  | 'FORCE_PASSWORD_CHANGE' 
  | 'SUSPEND_ACCOUNT' 
  | 'REACTIVATE_ACCOUNT' 
  | 'TERMINATE_REVOKE' 
  | 'TOGGLE_2FA';

export type CustomerType = 'CONG_TY' | 'HO_KINH_DOANH' | 'CA_NHAN';

// Phân loại hình thức dịch vụ của khách hàng: Định kỳ trọn gói vs. Vụ việc phát sinh vs. Hỗn hợp
export type CustomerServiceType = 'DINH_KY' | 'PHAT_SINH' | 'HON_HOP';

// Kỳ kê khai thuế GTGT, TNCN, Báo cáo thuế (Theo Tháng hoặc Theo Quý)
export type TaxDeclarationCycle = 'THANG' | 'QUY';

// Phân loại 4 nhóm Hộ kinh doanh cá thể theo quy mô doanh thu & chế độ kế toán
export type HouseholdBusinessGroup = 
  | 'NHOM_1'   // Nhóm 1: Doanh thu dưới 1 tỷ VNĐ/năm
  | 'NHOM_2'   // Nhóm 2: Doanh thu trên 1 tỷ đến 3 tỷ VNĐ/năm (TT 152/2025/TT-BTC)
  | 'NHOM_3'   // Nhóm 3: Doanh thu trên 3 tỷ đến 30 tỷ VNĐ/năm (TT 152/2025/TT-BTC)
  | 'NHOM_4';  // Nhóm 4: Doanh thu trên 30 tỷ VNĐ/năm (TT 152/2025/TT-BTC / Quy mô DN)

export type CustomerRisk = 'BINH_THUONG' | 'THAP' | 'TRUNG_BINH' | 'CAO' | 'NGUY_CO_PHAP_LY';
export type CustomerRiskLevel = CustomerRisk;

export type ContractStatus = 'HIEU_LUC' | 'SAP_HET_HAN' | 'DA_HET_HAN' | 'TAM_DUNG' | 'DA_CHAM_DUT' | 'DA_HUY';

export type DebtStatus = 'BINH_THUONG' | 'SAP_DEN_HAN' | 'QUA_HAN_NO' | 'NO_KHO_DOI';

export type BillingCycle = 'HANG_THANG' | 'HANG_QUY' | 'SAU_THANG' | 'HANG_NAM' | 'THEO_VU_VIEC';

// Phân loại thuế VAT cho phí dịch vụ
export type VatType = 
  | 'CHUA_VAT'   // Chưa bao gồm VAT (+10% VAT khi xuất hóa đơn)
  | 'DA_CO_VAT'  // Đã bao gồm 10% VAT
  | 'KHONG_VAT'; // Không chịu thuế VAT / Không có VAT (0%)

export type DebtAgingGroup = 
  | 'TRONG_HAN'        // Trong hạn (0 ngày quá hạn / Không nợ)
  | 'QUA_HAN_1_30'     // Quá hạn 1 - 30 ngày (Nhắc nhở cấp 1)
  | 'QUA_HAN_31_60'    // Quá hạn 31 - 60 ngày (Cảnh báo cấp 2 / Giới hạn dịch vụ)
  | 'QUA_HAN_61_90'    // Quá hạn 61 - 90 ngày (Tạm ngưng dịch vụ cấp 3)
  | 'QUA_HAN_TREN_90'; // Quá hạn > 90 ngày (Nợ khó đòi / Chuyển pháp chế)

export interface CustomerPaymentRecord {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  receiptNumber?: string;
  billingCycle: BillingCycle;
  notes?: string;
  recordedBy?: string;
  recordedByName?: string;
  createdAt: string;
}

export interface CustomerDebtReminder {
  id: string;
  customerId: string;
  customerName: string;
  debtAmount: number;
  overdueDays: number;
  reminderType: 'EMAIL' | 'ZALO' | 'CALL' | 'OFFICIAL_LETTER';
  sentAt: string;
  sentBy: string;
  sentByName: string;
  content: string;
  status: 'SENT' | 'SEEN' | 'RESPONDED' | 'PAID';
}

export type TaxObligationType = 'GTGT' | 'TNCN' | 'TNDN' | 'HOA_DON' | 'BCTC' | 'BHXH' | 'MON_BAI';

export interface ContractRenewalRecord {
  id: string;
  contractNumber?: string;
  startDate: string;
  endDate: string;
  monthlyFee: number;
  vatType?: VatType;
  servicePackage: string;
  renewedAt: string;
  renewedBy: string;
  renewedByName: string;
  notes?: string;
}

export type CycleExpiryStatus = 'EXPIRED' | 'CRITICAL_15' | 'WARNING_30' | 'NOTICE_60' | 'VALID';

export type CycleCategory = 
  | 'CUSTOMER_CONTRACT' 
  | 'DIGITAL_SIGNATURE' 
  | 'EINVOICE_PACKAGE' 
  | 'HR_LABOR_CONTRACT' 
  | 'HR_PROBATION' 
  | 'BUSINESS_LICENSE';

export interface SystemExpiringCycleItem {
  id: string;
  category: CycleCategory;
  categoryName: string;
  title: string;
  entityName: string; // Tên công ty hoặc tên nhân viên
  entityId: string; // Customer ID hoặc Employee ID
  code?: string;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  status: CycleExpiryStatus;
  statusLabel: string;
  badgeClass: string;
  responsiblePerson: string;
  responsibleDepartment: string;
  actionRequired: string;
  extraInfo?: string;
  monthlyFee?: number;
  servicePackage?: string;
}

export interface Customer {
  id: string;
  code?: string;
  name: string;
  taxCode: string; // MST
  type?: CustomerType;
  serviceType?: CustomerServiceType; // DINH_KY (Định kỳ trọn gói) | PHAT_SINH (Theo vụ việc) | HON_HOP (Cả hai)
  householdGroup?: HouseholdBusinessGroup; // Nhóm 1, 2, 3, 4 nếu là Hộ kinh doanh
  taxDeclarationCycle?: TaxDeclarationCycle; // Kỳ kê khai thuế: THANG hoặc QUY
  annualRevenue?: number; // Doanh thu năm ước tính / thực tế (VNĐ)
  annualRevenueBracket?: string; // Khung doanh thu
  accountingStandard?: string; // Chế độ kế toán (TT 152/2025/TT-BTC thay thế TT 88/2021, TT 133, TT 200)
  industry?: string; // Ngành nghề
  legalRepresentative?: string; // Đại diện pháp luật
  contactPerson?: string;
  address: string;
  phone: string;
  email: string;
  taxDepartment?: string;
  assignedStaffId: string; // Nhân viên phụ trách chính
  assignedStaffName?: string;
  reviewerStaffId?: string; // Người kiểm soát/kiểm tra
  reviewerStaffName?: string;
  
  // Contract & Service Lifecycle
  contractNumber?: string; // Số hợp đồng (vd: HĐ-ĐLT-2026/08)
  serviceStartDate: string; // Ngày bắt đầu dịch vụ
  contractEndDate?: string; // Ngày kết thúc hợp đồng
  contractDurationMonths?: number; // Thời hạn hợp đồng: 6, 12, 24, 36 tháng
  billingCycle?: BillingCycle;
  contractStatus: ContractStatus;
  contractAutoRenew?: boolean; // Tự động nhắc gia hạn
  renewalNoticeDays?: number; // Cảnh báo trước bao nhiêu ngày (15, 30, 45, 60 ngày)
  contractHistory?: ContractRenewalRecord[]; // Lịch sử các lần ký & tái ký

  // Termination & Liquidation Data (Chấm dứt & Thanh lý hợp đồng)
  terminationDate?: string; // Ngày chấm dứt / thanh lý hợp đồng
  terminationReason?: string; // Căn cứ & Lý do chấm dứt hợp đồng
  terminationDecisionNo?: string; // Số biên bản thanh lý / Quyết định chấm dứt HĐ
  terminationSettlementAmount?: number; // Số tiền quyết toán / công nợ thanh lý
  terminationHandoverNotes?: string; // Ghi chú bàn giao sổ sách, Token CKS, tài khoản
  returnDigitalSignatureToken?: boolean; // Đã bàn giao lại Token CKS
  finalizeTaxDocs?: boolean; // Đã bàn giao sổ sách hóa đơn chứng từ
  settleDebtFinal?: boolean; // Đã chốt và đối soát công nợ
  terminatedAt?: string; // Thời gian ghi nhận chấm dứt
  terminationByStaffId?: string; // Người thực hiện
  terminationByStaffName?: string; // Tên người thực hiện

  servicePackage: string; // Gói dịch vụ
  monthlyFee: number; // Phí dịch vụ hàng tháng (VNĐ)
  vatType?: VatType; // Tùy chọn thuế VAT: CHUA_VAT (Chưa gồm VAT) | DA_CO_VAT (Đã gồm VAT) | KHONG_VAT (Không VAT)
  
  // Chu Kỳ Thanh Toán & Quản Trị Công Nợ (Configurable Payment Cycle & Debt Tracking)
  debtStatus?: DebtStatus;
  debtAmount: number; // Số tiền công nợ (VNĐ)
  paymentDueDay?: number; // Ngày thanh toán định kỳ trong kỳ (vd: Ngày 5, 10, 15, 20, 25, 30)
  paymentTermDays?: number; // Thời hạn thanh toán / Hạn nợ (Grace period: 0, 7, 15, 30, 45 ngày)
  creditLimit?: number; // Hạn mức công nợ tối đa cho phép (VNĐ)
  preferredPaymentMethod?: string; // Phương thức thanh toán ưu tiên (Chuyển khoản VCB, TCB, Tiền mặt...)
  paymentDiscountPolicy?: string; // Chính sách chiết khấu / ưu đãi đóng trước
  lastPaymentDate?: string; // Ngày thanh toán gần nhất
  lastPaymentAmount?: number; // Số tiền thanh toán gần nhất
  debtStartDate?: string; // Ngày bắt đầu phát sinh nợ
  debtDueDate?: string; // Ngày đến hạn thanh toán nợ
  debtOverdueDays?: number; // Số ngày quá hạn nợ
  debtCycleGroup?: DebtAgingGroup; // Nhóm phân loại tuổi nợ
  paymentNotes?: string; // Ghi chú chính sách thanh toán riêng
  paymentHistory?: CustomerPaymentRecord[]; // Lịch sử các lần thanh toán
  debtReminders?: CustomerDebtReminder[]; // Nhật ký gửi nhắc nợ

  riskLevel: CustomerRisk;
  taxObligations?: TaxObligationType[];

  // Token Chữ ký số (CKS)
  digitalSignatureProvider?: string;
  digitalSignatureExpiry?: string;
  digitalSignaturePin?: string;

  // Hóa đơn điện tử (HĐĐT)
  eInvoiceProvider?: string; // Viettel Sinvoice, VNPT, MISA, BKAV, v.v.
  eInvoiceTotalQuota?: number; // Tổng số hóa đơn đã mua
  eInvoiceRemaining?: number; // Số lượng hóa đơn còn lại
  eInvoiceExpiryDate?: string; // Hạn dùng gói HĐĐT

  // Giấy phép con / Ngành nghề
  businessLicenseName?: string;
  businessLicenseExpiry?: string;

  notes?: string;
  version?: number; // Concurrency lock version (1, 2, 3...)
  lastModifiedBy?: string;
  lastModifiedByName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type TaskStatus =
  | 'MOI_TAO'           // 1. Mới tạo
  | 'DA_PHAN_CONG'       // 2. Đã phân công
  | 'DANG_THUC_HIEN'     // 3. Đang thực hiện
  | 'CHO_CHUNG_TU'       // 4. Chờ chứng từ
  | 'CHO_KHACH_HANG'     // 5. Chờ khách hàng
  | 'CHO_KIEM_TRA'       // 6. Chờ kiểm tra
  | 'CHO_PHE_DUYET'      // 7. Chờ phê duyệt
  | 'HOAN_THANH'         // 8. Hoàn thành
  | 'QUA_HAN'            // 9. Quá hạn
  | 'HUY';               // 10. Hủy

export type TaskPriority = 'THAP' | 'TRUNG_BINH' | 'CAO' | 'KHAN_CAP';

export type TaskRiskLevel = 'BINH_THUONG' | 'TRUNG_BINH' | 'CAO' | 'RUI_RO_THUE_PHAP_LY';

export type TaskCategory = 
  | 'THUE_KE_TOAN' 
  | 'HANH_CHINH_NHAN_SU' 
  | 'KINH_DOANH_CSKH' 
  | 'CSKH_HOP_DONG'
  | 'QUAN_LY_NOI_BO';

export type TaskWorkflowClassification = 
  | 'KE_TOAN_HOA_DON_THUONG_XUYEN' // Kế toán, Hóa đơn chứng từ & Hoạt động kinh doanh (Thực hiện thường xuyên Hàng tháng)
  | 'KE_KHAI_THUE_THEO_LUAT';       // Kê khai nộp thuế theo luật định (> 50 tỷ: Tháng | <= 50 tỷ: Quý)

export type TaxLawAllocationRule =
  | 'THUONG_XUYEN_HANG_THANG'       // Kế toán, hóa đơn, sổ phụ ngân hàng, khóa sổ, lương/BHXH (Hàng tháng cho 100% DN)
  | 'KHAI_THUE_THANG_TREN_50_TY'   // Kê khai thuế GTGT/TNCN Tháng (Doanh thu năm trước > 50 tỷ VNĐ)
  | 'KHAI_THUE_QUY_DUOI_50_TY'     // Kê khai thuế GTGT/TNCN Quý (Doanh thu năm trước <= 50 tỷ VNĐ & Hộ KD)
  | 'TAM_TINH_TNDN_QUY'            // Tạm tính thuế TNDN Quý (Toàn bộ DN)
  | 'QUYET_TOAN_BCTC_NAM';         // Quyết toán thuế & BCTC Năm (Toàn bộ DN)

export interface WorkflowStep {
  id: string;
  order: number;
  name: string;
  isCompleted: boolean;
  completedAt?: string;
  completedBy?: string;
  completedByName?: string;
  isMandatory: boolean;
  requiredEvidence?: boolean;
  note?: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  isCompleted: boolean;
  completedAt?: string;
  completedBy?: string;
  completedByName?: string;
  required: boolean;
  notes?: string;
}

export type AttachmentCategory = 
  | 'TO_KHAI_THUE' 
  | 'CHUNG_TU_NOP_TIEN' 
  | 'HOA_DON' 
  | 'SAO_KE_NGAN_HANG' 
  | 'BCTC' 
  | 'HOP_DONG' 
  | 'BIEN_BAN' 
  | 'HO_SO_PHAP_LY' 
  | 'KHAC';

export interface TaskAttachment {
  id: string;
  name: string;
  url?: string;
  thumbnailUrl?: string;
  fileType: string;
  size: number;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  version: number;
  category: AttachmentCategory;
  isCompletionEvidence?: boolean;
  isImage?: boolean;
  notes?: string;
  dimensions?: { width: number; height: number };
}

export interface TaskComment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  content: string;
  createdAt: string;
  isInternal: boolean;
}

export type RecurringFrequency = 
  | 'HANG_NGAY' 
  | 'HANG_TUAN' 
  | 'HANG_THANG' 
  | 'HANG_QUY' 
  | 'HANG_NAM';

export interface RecurringRule {
  enabled: boolean;
  frequency: RecurringFrequency;
  interval: number;
  dayOfMonth?: number;
  dayOfWeek?: number;
  autoCreateNext: boolean;
  nextDueDate?: string;
}

export interface Task {
  id: string;
  code: string;
  title: string;
  description: string;
  customerId?: string;
  customerName?: string;
  customerTaxCode?: string;
  department: Department;
  category: TaskCategory;
  createdById: string;
  createdByName: string;
  assigneeId: string;
  assigneeName: string;
  reviewerId: string;
  reviewerName: string;
  approverId: string;
  approverName: string;
  createdAt: string;
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // HH:mm
  completedAt?: string;
  priority: TaskPriority;
  riskLevel: TaskRiskLevel;
  status: TaskStatus;
  workflowSteps: WorkflowStep[];
  checklist: ChecklistItem[];
  attachments: TaskAttachment[];
  comments: TaskComment[];
  isRecurring: boolean;
  recurringRule?: RecurringRule;
  isTaxObligation: boolean;
  taxType?: TaxObligationType;
  taxPeriod?: string;
  workflowClassification?: TaskWorkflowClassification;
  taxAllocationRule?: TaxLawAllocationRule;
  revenueBracketNote?: string;
  tags?: string[];
  serviceCode?: string;
  serviceName?: string;
  serviceExecutionType?: string;
  serviceFee?: number;
  serviceFeeDisplay?: string;
  serviceQuantity?: number;
  serviceTotalFee?: number;
  // Approval Decision & Boss Confirmation Tracking
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  approvalDecision?: 'PENDING' | 'APPROVED' | 'MODIFICATION_REQUESTED' | 'REJECTED';
  approvalNotes?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewedNotes?: string;
  version?: number; // Concurrency lock version (1, 2, 3...)
  lastModifiedBy?: string;
  lastModifiedByName?: string;
  isBeingEditedBy?: {
    userId: string;
    userName: string;
    timestamp: string;
  };
  updatedAt: string;
}

export type AdHocServiceGroup =
  | 'PHAP_LY_DOANH_NGHIEP'
  | 'BHXH_NHAN_SU'
  | 'THUE_THANH_TRA_RUI_RO'
  | 'PHAN_MEM_KE_TOAN'
  | 'THUE_CHO_THUE_TAI_SAN'
  | 'DICH_VU_KHAC';

export interface AdHocServiceItem {
  id: string;
  code: string;
  name: string;
  group: AdHocServiceGroup;
  groupName: string;
  executionType: string;
  fee: number; // in VNĐ, 0 if custom
  feeDisplay: string;
  department: Department;
  defaultRiskLevel: TaskRiskLevel;
  defaultPriority: TaskPriority;
  description: string;
  suggestedWorkflow: { name: string; isMandatory: boolean; requiredEvidence: boolean }[];
  suggestedChecklist: { title: string; required: boolean }[];
}

export interface ChecklistTemplate {
  id: string;
  code: string;
  title: string;
  department: Department;
  category: TaskCategory;
  description: string;
  defaultPriority: TaskPriority;
  defaultRiskLevel: TaskRiskLevel;
  isTaxObligation: boolean;
  taxType?: TaxObligationType;
  defaultWorkflow: { name: string; isMandatory: boolean; requiredEvidence: boolean }[];
  defaultChecklist: { title: string; required: boolean }[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  userRole?: UserRole;
  actorId?: string;
  actorName?: string;
  actorRole?: UserRole;
  action: string;
  entityType?: 'TASK' | 'CUSTOMER' | 'USER' | 'CHECKLIST' | 'SYSTEM' | 'HR_PAYROLL' | 'HR_EMPLOYEE';
  entityId?: string;
  entityTitle?: string;
  details?: string;
  description?: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

export interface StaffKPIRecord {
  userId: string;
  userName: string;
  department: Department;
  position: string;
  totalAssigned: number;
  completedCount: number;
  onTimeCompletedCount: number;
  overdueCompletedCount: number;
  inProgressCount: number;
  pendingCount: number;
  overdueCount: number;
  completionRate: number; // %
  onTimeRate: number; // %
  overdueRate: number; // %
  highRiskHandled: number;
  taxTasksCount: number;
  qualityScore: number; // 0 - 100
  compositeKPIScore: number; // 0 - 100
}

export type DeadlineBucket = 
  | 'TODAY' 
  | 'TOMORROW' 
  | 'NEXT_3_DAYS' 
  | 'NEXT_7_DAYS' 
  | 'OVERDUE' 
  | 'HIGH_RISK_OVERDUE' 
  | 'UPCOMING' 
  | 'COMPLETED';

export type AlertColorLevel = 
  | 'GREEN'      // Hoàn thành
  | 'YELLOW'     // Sắp đến hạn (<= 3 ngày)
  | 'ORANGE'     // Có nguy cơ quá hạn (<= 1 ngày)
  | 'RED'        // Đã quá hạn
  | 'DARK_RED';   // Quá hạn liên quan nghĩa vụ thuế / pháp lý

// ==========================================
// HR & PAYROLL MANAGEMENT TYPES
// ==========================================

export type EmployeeContractType = 
  | 'THU_VIEC' 
  | 'XAC_DINH_1_NAM' 
  | 'XAC_DINH_3_NAM' 
  | 'KHONG_XAC_DINH_THOI_HAN' 
  | 'CONG_TAC_VIEN' 
  | 'THUC_TAP_SINH';

export type EmployeeStatus = 
  | 'DANG_LAM_VIEC' 
  | 'THU_VIEC' 
  | 'TAM_HOAN_HD' 
  | 'DA_NGHI_VIEC';

export interface EmployeeProfile {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  department: Department;
  position: string;
  role: UserRole;
  dateOfJoining: string;
  contractType: EmployeeContractType;
  contractStartDate: string;
  contractEndDate?: string;
  status: EmployeeStatus;
  
  // Compensation & Tax & Insurance
  baseSalary: number; // Lương cơ bản đóng BHXH (VNĐ)
  actualSalary: number; // Lương thỏa thuận / thực tế (VNĐ)
  positionAllowance: number; // Phụ cấp trách nhiệm / chức vụ
  lunchAllowance: number; // Phụ cấp ăn trưa
  phoneAllowance: number; // Phụ cấp điện thoại / đi lại
  taxDependents: number; // Số người phụ thuộc giảm trừ gia cảnh
  taxCode?: string; // MST cá nhân
  socialInsuranceNumber?: string; // Số sổ BHXH
  idCardNumber?: string; // Số CCCD
  bankAccount?: string; // Số TK Ngân hàng
  bankName?: string; // Ngân hàng
  
  // Professional Credentials
  qualifications: string[]; // Bằng cấp & Chứng chỉ (CPA, Đại lý thuế, KTT...)
  
  // Workload & Capacity Management
  maxCustomerCapacity: number; // Số khách hàng tối đa nên phụ trách
  managedCustomersCount?: number; // Số khách hàng đang phụ trách thực tế
  activeTasksCount?: number; // Số việc đang xử lý
  notes?: string;

  // Contract Termination & Handover
  terminationDate?: string; // Ngày làm việc cuối cùng / Ngày chấm dứt HĐ
  terminationReason?: string; // Lý do chấm dứt HĐLĐ
  terminationDecisionNo?: string; // Số Quyết định thôi việc / thanh lý
  terminationHandoverToStaffId?: string; // Nhân sự tiếp nhận bàn giao khách hàng & công việc
  terminationHandoverToStaffName?: string;
  terminationNote?: string; // Ghi chú thanh lý & biên bản bàn giao
}

export type LeaveType = 
  | 'PHEP_NAM' 
  | 'NGHI_OM' 
  | 'THAI_SAN' 
  | 'VIEC_RIENG' 
  | 'CONG_TAC_KHACH_HANG' 
  | 'NGHI_KHONG_LUONG';

export type LeaveStatus = 'CHO_DUYET' | 'DA_DUYET' | 'TU_CHOI';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: Department;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  destinationOrClient?: string; // Nếu đi công tác tại khách hàng
  status: LeaveStatus;
  approverId?: string;
  approverName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export type BusinessTripType =
  | 'KHACH_HANG' // Trụ sở Doanh nghiệp / Khách hàng
  | 'CO_QUAN_THUE' // Thuế cơ sở / Cục Thuế
  | 'BHXH_DKKD' // Cơ quan BHXH / Sở KH&ĐT (ĐKKD)
  | 'NGAN_HANG_TOA_AN' // Ngân hàng / Tín dụng / Tòa án / Công chứng
  | 'KHAO_SAT_THUC_DIA' // Khảo sát hiện trường / Thẩm định doanh nghiệp
  | 'LIEN_TINH' // Công tác liên tỉnh / Chi nhánh xa
  | 'KHAC'; // Mục đích khác

export type BusinessTripTimeSlot =
  | 'SANG' // Buổi sáng (08:00 - 12:00)
  | 'CHIEU' // Buổi chiều (13:30 - 17:30)
  | 'CA_NGAY' // Cả ngày làm việc
  | 'NHIEU_NGAY'; // Nhiều ngày liên tiếp

export type BusinessTripTransport =
  | 'XE_MAY_CA_NHAN'
  | 'XE_CONG_TY'
  | 'GRAB_TAXI'
  | 'MAY_BAY_TAU_XE'
  | 'KHAC';

export type BusinessTripStatus =
  | 'CHO_DUYET' // Chờ quản lý/BGĐ phê duyệt
  | 'DA_DUYET' // Đã phê duyệt - Lên lịch công tác
  | 'DANG_DI' // Đang thực địa / Đang đi công tác
  | 'HOAN_THANH' // Đã hoàn thành & Đã nộp báo cáo kết quả
  | 'TU_CHOI' // Bị từ chối duyệt
  | 'DA_HUY'; // Đã hủy chuyến

export interface BusinessTripTaskItem {
  id: string;
  title: string;
  isCompleted: boolean;
  notes?: string;
}

export interface BusinessTripExpenseItem {
  id: string;
  category: 'XANG_XE_DI_LAI' | 'LUU_TRU' | 'AN_UONG_CONG_TAC_PHI' | 'LE_PHI_HO_SO' | 'TIEP_KHACH' | 'KHAC';
  description: string;
  amount: number;
  invoiceNumber?: string;
}

export interface BusinessTrip {
  id: string;
  code: string; // CT-2026-001
  title: string; // Mục đích chuyến công tác
  tripType: BusinessTripType;
  employeeId: string;
  employeeName: string;
  department: Department;
  position?: string;
  companionStaffIds?: string[];
  companionStaffNames?: string[];
  customerId?: string;
  customerName?: string;
  customerTaxCode?: string;
  destination: string; // Địa điểm cụ thể (Địa chỉ / Tên Thuế cơ sở)
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  timeSlot: BusinessTripTimeSlot;
  estimatedDuration?: string; // Ví dụ: "1 buổi", "1 ngày", "2 ngày"
  transportation: BusinessTripTransport;
  purpose: string; // Chi tiết mục đích công tác & nội dung làm việc
  tasks: BusinessTripTaskItem[]; // Danh mục công việc / tài liệu cần giải quyết
  advanceAmount: number; // Tiền xin tạm ứng công tác phí (VND)
  actualTotalCost?: number; // Tổng chi phí thực tế phát sinh (VND)
  expenses?: BusinessTripExpenseItem[]; // Bảng kê chi phí thực tế
  status: BusinessTripStatus;
  approverId?: string;
  approverName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  checkinAt?: string;
  checkoutAt?: string;
  checkinAddress?: string;
  resultSummary?: string; // Báo cáo tóm tắt kết quả công tác
  deliverables?: string[]; // Danh mục chứng từ / hồ sơ đã thu thập
  attachments?: Array<{
    id: string;
    name: string;
    url?: string;
    type?: string;
    size?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollRecord {
  id: string;
  month: number;
  year: number;
  employeeId: string;
  employeeName: string;
  department: Department;
  position: string;
  standardWorkingDays: number;
  actualWorkingDays: number;
  
  // Earnings
  baseSalary: number;
  actualSalary: number;
  positionAllowance: number;
  lunchAllowance: number;
  phoneAllowance: number;
  performanceBonus: number;
  grossIncome: number;
  
  // Mandatory Deductions (Employee: 10.5%)
  socialInsurance: number; // 8%
  healthInsurance: number; // 1.5%
  unemploymentInsurance: number; // 1%
  totalInsuranceDeduction: number; // 10.5%
  
  // Personal Income Tax (TNCN - TT 87/2026/TT-BTC)
  personalDeduction: number; // 15,500,000 VNĐ
  dependentsDeduction: number; // 6,200,000 VNĐ * số người
  taxableIncome: number; // Thu nhập tính thuế
  personalIncomeTax: number; // Thuế TNCN phải nộp
  
  // Take-home
  netSalary: number;
  
  // Employer Statutory Costs (NSDLĐ: 21.5% + 2% KPCĐ)
  employerSocialInsurance: number; // 17.5%
  employerHealthInsurance: number; // 3%
  employerUnemploymentInsurance: number; // 1%
  employerTradeUnion: number; // 2%
  totalEmployerCost: number; // Tổng chi phí doanh nghiệp
  
  status: 'DU_THAO' | 'DA_DUYET' | 'DA_CHI_TRA';
  paidAt?: string;
  adjustmentNotes?: string;
  bonusReason?: string;
}

export interface TaxBracketDetail {
  bracket: number;
  thresholdLabel: string;
  taxRate: number; // e.g. 5, 10, 15, 20, 25, 30, 35
  taxableInBracket: number;
  taxAmount: number;
  maxTaxForBracket: number;
}

export interface SalaryCalculationResult {
  grossSalary: number;
  insuranceBase: number;
  employeeInsurance: {
    bhxh: number;
    bhyt: number;
    bhtn: number;
    total: number;
  };
  personalDeduction: number;
  dependentsDeduction: number;
  taxableIncome: number;
  personalIncomeTax: number;
  taxBrackets: TaxBracketDetail[];
  netSalary: number;
  employerCosts: {
    bhxh: number;
    bhyt: number;
    bhtn: number;
    tradeUnion: number;
    total: number;
  };
  legalBasis: string;
}

export interface HRWorkflowSOP {
  id: string;
  code: string;
  title: string;
  category: 'ONBOARDING' | 'TIEN_LUONG_THUE' | 'BHXH_CHE_DO' | 'THANG_BANG_LUONG' | 'OFFBOARDING';
  categoryName: string;
  description: string;
  legalBasis: string; // Căn cứ pháp luật (Bộ luật Lao động 2019, Luật BHXH, Nghị định 145...)
  estimatedDays: number;
  steps: {
    order: number;
    name: string;
    role: string;
    isMandatory: boolean;
    requiredDocument?: string;
  }[];
  checklist: string[];
  requiredForms: string[];
}

export interface ActiveEditingPresence {
  entityType: 'TASK' | 'CUSTOMER';
  entityId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  timestamp: string;
}

export interface ConcurrencyConflictResult<T> {
  success: boolean;
  conflict: boolean;
  message?: string;
  serverEntity?: T;
  clientVersion?: number;
  serverVersion?: number;
}

export interface DuplicateCustomerMatch {
  matchType: 'TAX_CODE' | 'NAME' | 'EMAIL' | 'PHONE';
  existingCustomer: Customer;
  confidence: number;
  message: string;
}

export interface DuplicateTaskMatch {
  matchType: 'IDENTICAL_TAX_PERIOD' | 'IDENTICAL_SERVICE' | 'SAME_TITLE';
  existingTask: Task;
  message: string;
}

export interface RealtimeSyncEvent {
  id: string;
  type: 'TASK_UPDATED' | 'TASK_CREATED' | 'TASK_DELETED' | 'CUSTOMER_UPDATED' | 'CUSTOMER_CREATED' | 'LOCK_ACQUIRED' | 'LOCK_RELEASED' | 'FORCE_SYNC';
  entityType?: 'TASK' | 'CUSTOMER';
  entityId?: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  payload?: any;
}

export type ContractType = EmployeeContractType;
export type Employee = EmployeeProfile;

// ==========================================
// WORKLOAD BALANCING TYPES
// ==========================================

export type WorkloadStatus = 'OVERLOAD' | 'OPTIMAL' | 'AVAILABLE';

export interface StaffWorkloadSummary {
  userId: string;
  userName: string;
  userCode: string;
  email: string;
  phone: string;
  department: Department;
  position: string;
  role: UserRole;
  avatar?: string;
  
  // Capacities & Counts
  customerCapacity: number;
  assignedCustomersCount: number;
  capacityUsageRate: number; // Percentage, e.g. 120%
  
  // Task metrics
  activeTasksCount: number;
  pendingReviewCount: number;
  pendingApprovalCount: number;
  overdueTasksCount: number;
  completedTasksCount: number;
  
  // Composite score & Status
  workloadScore: number; // 0 - 100+
  status: WorkloadStatus;
  statusLabel: string;
  statusBadge: string;
  
  // Associated entities for fast rebalance
  assignedCustomers: Customer[];

  // HR & Financial Integration
  monthlyRevenue?: number;
  actualSalary?: number;
  contractType?: EmployeeContractType;
  employeeStatus?: EmployeeStatus;
  isNewEmployee?: boolean;
  riskDistribution?: {
    high: number;
    medium: number;
    low: number;
  };
}

// ==========================================
// CUSTOMER PORTAL & E-TAX TRANSPARENCY TYPES
// ==========================================

export type TaxFilingStatus = 'CHO_XU_LY' | 'DA_NOP_CQT' | 'CQT_CHAP_NHAN' | 'TU_CHOI';

export interface TaxFilingReceipt {
  id: string;
  customerId: string;
  taxType: string; // 'GTGT', 'TNCN', 'TNDN', 'BCTC', 'HOA_DON', 'MON_BAI'
  taxTypeName: string; // 'Tờ khai thuế GTGT (01/GTGT)', 'Quyết toán thuế TNDN (03/TNDN)'
  period: string; // 'Tháng 07/2026', 'Quý 2/2026', 'Năm 2025'
  submissionDate: string;
  acceptanceDate?: string;
  status: TaxFilingStatus;
  statusLabel: string;
  receiptNumber?: string; // Mã giao dịch điện tử Tổng cục Thuế
  taxPayableAmount: number; // Số thuế phát sinh phải nộp (VNĐ)
  submittedByStaffName?: string;
  notes?: string;
}

export type PaymentSlipStatus = 'CHUA_NOP' | 'DA_NOP_KBNN' | 'DANG_XU_LY';

export interface ETaxPaymentSlip {
  id: string;
  customerId: string;
  customerName: string;
  taxCode: string;
  slipCode: string; // Vd: GNT-20260819-0088
  createdDate: string;
  paidDate?: string;
  treasuryName: string; // Kho bạc Nhà nước tiếp nhận (vd: KBNN Q. Cầu Giấy)
  collectingBank: string; // Ngân hàng ủy nhiệm thu (vd: Vietcombank - CN Thăng Long)
  taxType: string; // Tên sắc thuế (Thuế GTGT, Thuế TNDN tạm nộp...)
  chapterCode: string; // Mã chương (vd: 754, 554)
  subItemCode: string; // Mã tiểu mục (vd: 1701 - Thuế GTGT, 1052 - Thuế TNDN)
  amount: number; // Số tiền nộp (VNĐ)
  status: PaymentSlipStatus;
  statusLabel: string;
  treasuryReceiptNumber?: string; // Số chứng từ Kho bạc
  notes?: string;
}

export interface CustomerSupportRequest {
  id: string;
  customerId: string;
  customerName: string;
  taxCode: string;
  senderName: string;
  senderPhone: string;
  senderEmail: string;
  subject: string;
  content: string;
  category: 'TAI_LIEU' | 'GIAI_TRINH_THUE' | 'HOA_DON' | 'HOI_DAP' | 'YEU_CAU_KHAC';
  createdAt: string;
  status: 'MOI_TIEP_NHAN' | 'DANG_XU_LY' | 'DA_PHAN_HOI';
  response?: string;
  respondedBy?: string;
  respondedAt?: string;
}

export interface CustomerPortalData {
  customer: Customer;
  assignedStaff: {
    id: string;
    name: string;
    phone: string;
    email: string;
    position: string;
  };
  taxFilings: TaxFilingReceipt[];
  paymentSlips: ETaxPaymentSlip[];
  activeTasks: Task[];
  eInvoiceStatus: {
    provider: string;
    totalQuota: number;
    remaining: number;
    used: number;
    percentUsed: number;
    expiryDate?: string;
  };
  serviceContract: {
    contractNumber: string;
    startDate: string;
    endDate: string;
    monthlyFee: number;
    servicePackage: string;
    status: ContractStatus;
  };
  debtInfo: {
    currentDebt: number;
    monthlyFee: number;
    billingCycle: string;
    status: DebtStatus;
  };
}

export type DatabaseModuleKey = 
  | 'CUSTOMERS'
  | 'TASKS'
  | 'TEMPLATES'
  | 'EMPLOYEES'
  | 'LEAVE_REQUESTS'
  | 'PAYROLL'
  | 'TAX_FILINGS'
  | 'PAYMENT_SLIPS'
  | 'SUPPORT_REQUESTS'
  | 'AUDIT_LOGS'
  | 'ACTIVE_LOCKS'
  | 'USERS';

export interface DatabaseModuleInfo {
  key: DatabaseModuleKey;
  label: string;
  category: 'THUE_KE_TOAN' | 'NHAN_SU_LUONG' | 'KHACH_HANG_PORTAL' | 'HE_THONG_KIEM_TOAN';
  description: string;
  recordCount: number;
  estimatedSizeKB: number;
  lastUpdated?: string;
  canClear: boolean;
  requiresDoubleConfirm?: boolean;
}

export interface DatabaseSystemStats {
  totalRecords: number;
  totalSizeKB: number;
  totalSizeFormatted: string;
  localStorageUsagePercent: number;
  modules: DatabaseModuleInfo[];
  lastBackupDate?: string;
  integrityStatus: 'HEALTHY' | 'WARNING' | 'CORRUPTED';
  integrityMessage: string;
}

export interface AutoDispatchOptions {
  periodMonth: number; // 1-12
  periodYear: number; // e.g. 2026
  cycleType: 'THANG' | 'QUY' | 'NAM' | 'ALL';
  periodQuarter?: number; // 1-4
  targetPackage?: string; // e.g. 'ALL' or 'PKG-A' or 'PKG-B' or 'PKG-C' or 'PKG-D'
  customerId?: string; // If dispatching for a single customer
  overwriteExisting?: boolean;
  selectedTemplateIds?: string[];
  dispatchCategory?: 'ALL' | 'KE_TOAN_THUONG_XUYEN' | 'KE_KHAI_THUE_PHAP_LUAT';
  actor?: User;
}

export interface AutoDispatchCustomerSummary {
  customerId: string;
  customerName: string;
  customerTaxCode: string;
  package: string;
  annualRevenue?: number;
  annualRevenueBracket?: string;
  taxDeclarationCycle?: TaxDeclarationCycle;
  assigneeId?: string;
  assigneeName: string;
  reviewerId?: string;
  reviewerName: string;
  accountingTasksCount?: number;
  taxFilingTasksCount?: number;
  tasksCreated: Array<{
    id: string;
    code: string;
    title: string;
    dueDate: string;
    taxType?: string;
    workflowClassification?: TaskWorkflowClassification;
    taxAllocationRule?: TaxLawAllocationRule;
  }>;
  tasksSkipped: Array<{
    title: string;
    reason: string;
  }>;
}

export interface AutoDispatchResult {
  success: boolean;
  totalCreated: number;
  totalSkipped: number;
  createdTasks: Task[];
  dispatchedCustomersCount: number;
  message: string;
  periodLabel: string;
  summaryByCustomer: AutoDispatchCustomerSummary[];
}


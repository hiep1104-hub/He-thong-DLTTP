import { User, UserRole, Department, Task, Customer, SystemExpiringCycleItem } from '../types';
import { 
  PermissionAction, 
  PermissionDefinition, 
  RolePermissionConfig,
  DepartmentPermissionConfig 
} from '../types/permissions';

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  // 1. Task Actions
  {
    id: 'task:view_all',
    category: 'TASK',
    name: 'Xem toàn bộ công việc',
    description: 'Xem tất cả công việc của toàn thể công ty và các phòng ban',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC', 'TRUONG_PHONG', 'TRUONG_NHOM'],
  },
  {
    id: 'task:view_assigned',
    category: 'TASK',
    name: 'Xem công việc được phân công',
    description: 'Chỉ xem các công việc cá nhân được giao xử lý hoặc hỗ trợ',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC', 'TRUONG_PHONG', 'TRUONG_NHOM', 'NHAN_VIEN'],
  },
  {
    id: 'task:create',
    category: 'TASK',
    name: 'Tạo công việc / Dịch vụ mới',
    description: 'Khởi tạo công việc theo mẫu định kỳ, thủ tục phát sinh hoặc quy trình SOP',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC', 'TRUONG_PHONG', 'TRUONG_NHOM', 'NHAN_VIEN'],
  },
  {
    id: 'task:edit',
    category: 'TASK',
    name: 'Sửa thông tin & thời hạn công việc',
    description: 'Điều chỉnh hạn chót deadline, mức độ ưu tiên, rủi ro và nội dung',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC', 'TRUONG_PHONG', 'TRUONG_NHOM'],
  },
  {
    id: 'task:execute_step',
    category: 'TASK',
    name: 'Thực hiện bước & Checklist',
    description: 'Tích hoàn thành các bước nghiệp vụ và danh mục kiểm soát trong hồ sơ',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC', 'TRUONG_PHONG', 'TRUONG_NHOM', 'NHAN_VIEN'],
  },
  {
    id: 'task:submit_review',
    category: 'TASK',
    name: 'Gửi kiểm tra / Soát xét',
    description: 'Chuyển trạng thái công việc sang Chờ Kiểm Tra sau khi hoàn thành các bước',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC', 'TRUONG_PHONG', 'TRUONG_NHOM', 'NHAN_VIEN'],
  },
  {
    id: 'task:review_approve',
    category: 'TASK',
    name: 'Trưởng phòng / KTT soát xét hồ sơ',
    description: 'Kiểm soát tính hợp lệ của hóa đơn/chứng từ, duyệt hoặc trả về yêu cầu sửa',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC', 'TRUONG_PHONG', 'TRUONG_NHOM'],
  },
  {
    id: 'task:final_approve',
    category: 'TASK',
    name: 'Giám Đốc ký duyệt & nộp tờ khai',
    description: 'Phê duyệt cuối cùng, ký số điện tử và nộp hồ sơ lên Cơ quan Thuế/BHXH',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC'],
  },
  {
    id: 'task:reassign',
    category: 'TASK',
    name: 'Điều chuyển nhân sự phụ trách',
    description: 'Phân công lại chuyên viên xử lý hoặc người kiểm soát cho công việc',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC', 'TRUONG_PHONG', 'TRUONG_NHOM'],
  },
  {
    id: 'task:delete',
    category: 'TASK',
    name: 'Hủy bỏ / Xóa công việc',
    description: 'Hủy bỏ hoặc xóa hẳn công việc khỏi hệ thống',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC'],
  },

  // 2. Customer Actions
  {
    id: 'customer:view_all',
    category: 'CUSTOMER',
    name: 'Xem toàn bộ danh sách khách hàng',
    description: 'Xem tất cả hồ sơ doanh nghiệp khách hàng trong cơ sở dữ liệu',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC', 'TRUONG_PHONG', 'TRUONG_NHOM'],
  },
  {
    id: 'customer:view_assigned',
    category: 'CUSTOMER',
    name: 'Xem khách hàng được giao phụ trách',
    description: 'Chỉ xem các khách hàng mình được chỉ định làm chuyên viên phụ trách',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC', 'TRUONG_PHONG', 'TRUONG_NHOM', 'NHAN_VIEN'],
  },
  {
    id: 'customer:create',
    category: 'CUSTOMER',
    name: 'Thêm mới khách hàng',
    description: 'Tạo mới hồ sơ doanh nghiệp, cấu hình gói dịch vụ và chữ ký số',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC', 'TRUONG_PHONG'],
  },
  {
    id: 'customer:edit',
    category: 'CUSTOMER',
    name: 'Chỉnh sửa hồ sơ khách hàng',
    description: 'Cập nhật thông tin pháp lý, token chữ ký số và phân công nhân sự',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC', 'TRUONG_PHONG'],
  },
  {
    id: 'customer:delete',
    category: 'CUSTOMER',
    name: 'Xóa hồ sơ khách hàng',
    description: 'Xóa doanh nghiệp khách hàng khỏi hệ thống dữ liệu',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC', 'TRUONG_PHONG'],
  },
  {
    id: 'customer:view_financials',
    category: 'CUSTOMER',
    name: 'Xem phí dịch vụ & Công nợ',
    description: 'Xem thông tin tài chính nhạy cảm: mức phí dịch vụ hàng tháng và công nợ',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC', 'TRUONG_PHONG'],
    relevantDepartments: ['HANH_CHINH_NHAN_SU', 'KINH_DOANH_CSKH', 'BAN_GIAM_DOC', 'KE_TOAN_THUE'],
  },

  // 3. HR, Payroll, BHXH & Labor Actions
  {
    id: 'hr:view_all_profiles',
    category: 'HR_PAYROLL_BHXH',
    name: 'Xem hồ sơ toàn bộ nhân sự',
    description: 'Xem thông tin liên hệ, bằng cấp, hợp đồng, định mức khách hàng của 30 nhân sự',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC', 'TRUONG_PHONG'],
    relevantDepartments: ['HANH_CHINH_NHAN_SU', 'BAN_GIAM_DOC'],
  },
  {
    id: 'hr:edit_profile',
    category: 'HR_PAYROLL_BHXH',
    name: 'Thêm & Chỉnh sửa hồ sơ nhân sự',
    description: 'Cập nhật mức lương đóng BHXH, lương thực tế, định mức khách hàng',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC'],
    relevantDepartments: ['HANH_CHINH_NHAN_SU', 'BAN_GIAM_DOC'],
  },
  {
    id: 'hr:view_all_payroll',
    category: 'HR_PAYROLL_BHXH',
    name: 'Xem Bảng lương toàn công ty',
    description: 'Xem chi tiết bảng thanh toán tiền lương, trích nộp BHXH & Thuế TNCN toàn bộ nhân viên',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC', 'TRUONG_PHONG'],
    relevantDepartments: ['HANH_CHINH_NHAN_SU', 'BAN_GIAM_DOC'],
  },
  {
    id: 'hr:view_own_payroll',
    category: 'HR_PAYROLL_BHXH',
    name: 'Xem Phiếu lương cá nhân',
    description: 'Chỉ xem phiếu lương và các khoản giảm trừ của chính bản thân',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC', 'TRUONG_PHONG', 'TRUONG_NHOM', 'NHAN_VIEN'],
  },
  {
    id: 'hr:manage_payroll',
    category: 'HR_PAYROLL_BHXH',
    name: 'Tính toán & Điều chỉnh bảng lương',
    description: 'Nhập thưởng KPI, tính toán thuế TNCN, trích nộp bảo hiểm (10.5% & 21.5%)',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC', 'TRUONG_PHONG'],
    relevantDepartments: ['HANH_CHINH_NHAN_SU', 'BAN_GIAM_DOC'],
  },
  {
    id: 'hr:approve_payroll',
    category: 'HR_PAYROLL_BHXH',
    name: 'Phê duyệt chi bảng lương',
    description: 'Chốt duyệt và ký lệnh chi trả lương hàng tháng',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC'],
    relevantDepartments: ['BAN_GIAM_DOC'],
  },
  {
    id: 'hr:manage_bhxh_records',
    category: 'HR_PAYROLL_BHXH',
    name: 'Quản lý Nghiệp vụ & Hồ sơ BHXH',
    description: 'Lập thủ tục báo tăng/giảm lao động, thai sản, ốm đau, chốt sổ, đối chiếu thông báo C12 BHXH',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC', 'TRUONG_PHONG'],
    relevantDepartments: ['HANH_CHINH_NHAN_SU', 'BAN_GIAM_DOC'],
  },
  {
    id: 'hr:manage_sops',
    category: 'HR_PAYROLL_BHXH',
    name: 'Kích hoạt & Quản lý SOP Nhân sự',
    description: 'Khởi tạo quy trình chuẩn hóa: Tuyển dụng, Onboarding, Đăng ký thang bảng lương, Nội quy LĐ',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC', 'TRUONG_PHONG'],
    relevantDepartments: ['HANH_CHINH_NHAN_SU', 'BAN_GIAM_DOC'],
  },
  {
    id: 'hr:request_leave',
    category: 'HR_PAYROLL_BHXH',
    name: 'Đăng ký Nghỉ phép / Đi công tác',
    description: 'Tạo đơn xin nghỉ phép năm, nghỉ ốm hoặc đăng ký lịch làm việc tại cơ quan thuế/khách hàng',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC', 'TRUONG_PHONG', 'TRUONG_NHOM', 'NHAN_VIEN'],
  },
  {
    id: 'hr:review_leave',
    category: 'HR_PAYROLL_BHXH',
    name: 'Sơ duyệt Đơn xin nghỉ phép / Công tác',
    description: 'Kiểm tra ngày phép, xác nhận phân công thay thế trước khi trình Lãnh đạo',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC', 'TRUONG_PHONG', 'TRUONG_NHOM'],
    relevantDepartments: ['HANH_CHINH_NHAN_SU', 'BAN_GIAM_DOC'],
  },
  {
    id: 'hr:approve_leave',
    category: 'HR_PAYROLL_BHXH',
    name: 'Phê duyệt chính thức Đơn nghỉ phép',
    description: 'Quyết định duyệt hoặc từ chối đơn xin nghỉ phép/công tác của nhân sự',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC', 'TRUONG_PHONG'],
    relevantDepartments: ['BAN_GIAM_DOC', 'HANH_CHINH_NHAN_SU', 'KE_TOAN_THUE', 'KINH_DOANH_CSKH'],
  },

  // 4. Legal & Enterprise Registration (ĐKKD)
  {
    id: 'legal:view_all_dossiers',
    category: 'LEGAL_DOSSIER',
    name: 'Xem toàn bộ Hồ sơ Pháp lý & ĐKKD',
    description: 'Theo dõi hồ sơ thành lập, thay đổi GPKD, vốn điều lệ, ngành nghề, con dấu',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC', 'TRUONG_PHONG'],
    relevantDepartments: ['HANH_CHINH_NHAN_SU', 'BAN_GIAM_DOC'],
  },
  {
    id: 'legal:create_dossier',
    category: 'LEGAL_DOSSIER',
    name: 'Soạn thảo & Nộp hồ sơ ĐKKD',
    description: 'Soạn thảo hồ sơ pháp lý, nộp Cổng thông tin quốc gia về ĐKKD',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC', 'TRUONG_PHONG'],
    relevantDepartments: ['HANH_CHINH_NHAN_SU', 'BAN_GIAM_DOC'],
  },
  {
    id: 'legal:review_dossier',
    category: 'LEGAL_DOSSIER',
    name: 'Soát xét tính chuẩn xác hồ sơ pháp lý',
    description: 'Kiểm tra tính pháp lý của hồ sơ doanh nghiệp trước khi nộp cơ quan chức năng',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC', 'TRUONG_PHONG'],
    relevantDepartments: ['HANH_CHINH_NHAN_SU', 'BAN_GIAM_DOC'],
  },

  // 5. Sales, Contract & Debt Recovery
  {
    id: 'contract:view_all',
    category: 'CONTRACT_DEBT',
    name: 'Xem toàn bộ Hợp đồng Dịch vụ',
    description: 'Theo dõi tình trạng hợp đồng đại lý thuế, phụ lục, thời hạn hiệu lực của khách hàng',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC', 'TRUONG_PHONG'],
    relevantDepartments: ['KINH_DOANH_CSKH', 'HANH_CHINH_NHAN_SU', 'BAN_GIAM_DOC'],
  },
  {
    id: 'contract:create_edit',
    category: 'CONTRACT_DEBT',
    name: 'Soạn thảo & Cập nhật Hợp đồng dịch vụ',
    description: 'Lập hợp đồng dịch vụ mới, gia hạn gói cước, điều chỉnh biểu phí khách hàng',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC', 'TRUONG_PHONG'],
    relevantDepartments: ['KINH_DOANH_CSKH', 'BAN_GIAM_DOC'],
  },
  {
    id: 'contract:manage_debt',
    category: 'CONTRACT_DEBT',
    name: 'Quản lý & Đôn đốc Thu hồi Công nợ',
    description: 'Theo dõi công nợ quá hạn, ghi nhận phiếu thu/chuyển khoản, gửi email nhắc nợ',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC', 'TRUONG_PHONG'],
    relevantDepartments: ['KINH_DOANH_CSKH', 'HANH_CHINH_NHAN_SU', 'BAN_GIAM_DOC'],
  },
  {
    id: 'cskh:receive_requests',
    category: 'CONTRACT_DEBT',
    name: 'Tiếp nhận Yêu cầu & Tạo việc Ad-hoc',
    description: 'Tiếp nhận phản hồi khách hàng, tạo phiếu việc phát sinh cho các phòng ban',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC', 'TRUONG_PHONG', 'TRUONG_NHOM', 'NHAN_VIEN'],
    relevantDepartments: ['KINH_DOANH_CSKH', 'HANH_CHINH_NHAN_SU', 'KE_TOAN_THUE'],
  },

  // 5. Admin & Digital Signatures (CKS)
  {
    id: 'admin:manage_digital_signatures',
    category: 'ADMIN_CKS',
    name: 'Quản trị Kho Token & Hạn dùng Chữ ký số (CKS)',
    description: 'Quản lý thiết bị Token CKS vật lý, mật khẩu PIN, theo dõi hạn dùng CKS tránh trễ tờ khai',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC', 'TRUONG_PHONG'],
    relevantDepartments: ['HANH_CHINH_NHAN_SU', 'BAN_GIAM_DOC'],
  },
  {
    id: 'admin:manage_archives',
    category: 'ADMIN_CKS',
    name: 'Quản lý Văn thư & Lưu trữ Hồ sơ',
    description: 'Quản lý bàn giao tài liệu, sổ sách kế toán in ấn và lưu trữ hồ sơ vật lý',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC', 'TRUONG_PHONG', 'TRUONG_NHOM', 'NHAN_VIEN'],
    relevantDepartments: ['HANH_CHINH_NHAN_SU', 'BAN_GIAM_DOC'],
  },

  // 6. Tax & AI Reports
  {
    id: 'tax:view_calendar',
    category: 'TAX_REPORT',
    name: 'Xem Lịch thuế & Hạn nộp',
    description: 'Theo dõi lịch các nghĩa vụ thuế GTGT, TNCN, TNDN, BCTC, BHXH',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC', 'TRUONG_PHONG', 'TRUONG_NHOM', 'NHAN_VIEN'],
  },
  {
    id: 'tax:use_ai_advisor',
    category: 'TAX_REPORT',
    name: 'Sử dụng Trợ lý AI Thuế',
    description: 'Gọi AI Gemini phân tích rủi ro tờ khai và tối ưu chi phí thuế',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC', 'TRUONG_PHONG', 'TRUONG_NHOM', 'NHAN_VIEN'],
  },
  {
    id: 'report:view_executive',
    category: 'TAX_REPORT',
    name: 'Xem Báo cáo Quản trị Doanh thu',
    description: 'Xem báo cáo tài chính, tổng doanh thu dịch vụ, năng suất và công nợ',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC', 'TRUONG_PHONG'],
  },
  {
    id: 'report:export',
    category: 'TAX_REPORT',
    name: 'Xuất file Báo cáo (Excel/PDF)',
    description: 'Tải các bảng biểu thống kê ra định dạng Excel hoặc PDF',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC', 'TRUONG_PHONG'],
  },

  // 7. System & Security
  {
    id: 'system:view_audit_logs',
    category: 'SYSTEM_ADMIN',
    name: 'Xem Nhật ký Audit truy vết',
    description: 'Theo dõi lịch sử thay đổi, đăng nhập và các hành động nhạy cảm trong hệ thống',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC'],
  },
  {
    id: 'system:manage_settings',
    category: 'SYSTEM_ADMIN',
    name: 'Cấu hình thông tin hệ thống',
    description: 'Chỉnh sửa thông tin đại lý thuế, thông số vận hành',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC'],
  },
  {
    id: 'system:backup_restore',
    category: 'SYSTEM_ADMIN',
    name: 'Sao lưu & Khôi phục dữ liệu',
    description: 'Xuất và nhập file JSON sao lưu toàn bộ cơ sở dữ liệu hệ thống',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC'],
  },
  {
    id: 'system:manage_permissions',
    category: 'SYSTEM_ADMIN',
    name: 'Quản trị Phân quyền RBAC',
    description: 'Tùy biến ma trận phân quyền cho các vai trò và tài khoản',
    defaultRoles: ['ADMIN'],
  },

  // 8. Templates, SOP & Service Packages (Quy trình mẫu & Gói)
  {
    id: 'template:view',
    category: 'TASK',
    name: 'Xem Thư viện Quy trình mẫu & Gói dịch vụ',
    description: 'Tra cứu danh mục 49 dịch vụ phát sinh, chuỗi bước SOP, tiêu chuẩn checklist và biểu phí dịch vụ niêm yết',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC', 'TRUONG_PHONG', 'TRUONG_NHOM', 'NHAN_VIEN'],
  },
  {
    id: 'template:manage',
    category: 'TASK',
    name: 'Quản trị & Ban hành Quy trình mẫu & Gói (Chỉ Ban Giám Đốc)',
    description: 'Thêm mới, sửa đổi chuỗi bước SOP, checklist kiểm soát chất lượng, biểu phí dịch vụ và cấu hình gói dịch vụ',
    defaultRoles: ['ADMIN', 'BAN_GIAM_DOC'],
  },
];

export const ROLE_CONFIGS: Record<UserRole, RolePermissionConfig> = {
  ADMIN: {
    role: 'ADMIN',
    name: 'Quản Trị Viên Toàn Quyền (System Administrator)',
    description: 'Toàn quyền cấu hình hệ thống, quản trị phân quyền người dùng, xem nhật ký truy vết và toàn bộ dữ liệu nghiệp vụ.',
    badgeColor: 'bg-red-600 text-white',
    allowedActions: ALL_PERMISSIONS.map(p => p.id),
  },
  BAN_GIAM_DOC: {
    role: 'BAN_GIAM_DOC',
    name: 'Ban Giám Đốc / Tổng Giám Đốc (Executive Director)',
    description: 'Ký số & phê duyệt nộp tờ khai lên Cơ quan Thuế/BHXH, xem báo cáo doanh thu, duyệt bảng lương và phê duyệt nghỉ phép.',
    badgeColor: 'bg-indigo-700 text-white',
    allowedActions: ALL_PERMISSIONS
      .filter(p => p.defaultRoles.includes('BAN_GIAM_DOC'))
      .map(p => p.id),
  },
  TRUONG_PHONG: {
    role: 'TRUONG_PHONG',
    name: 'Trưởng Phòng / Kế Toán Trưởng (Department Head)',
    description: 'Kiểm soát & soát xét chuyên môn hóa đơn/chứng từ, phân công công việc, kiểm tra bảng lương trước khi trình Giám đốc, duyệt nghỉ phép cấp phòng.',
    badgeColor: 'bg-purple-700 text-white',
    allowedActions: ALL_PERMISSIONS
      .filter(p => p.defaultRoles.includes('TRUONG_PHONG'))
      .map(p => p.id),
  },
  TRUONG_NHOM: {
    role: 'TRUONG_NHOM',
    name: 'Trưởng Nhóm / Giám Sát Tổ (Team Leader / Supervisor)',
    description: 'Điều phối & phân công nội bộ tổ nhóm, soát xét sơ bộ (Cấp 1) chứng từ/tờ khai, giám sát tiến độ và sơ duyệt đơn nghỉ phép của thành viên trong nhóm.',
    badgeColor: 'bg-emerald-600 text-white',
    allowedActions: ALL_PERMISSIONS
      .filter(p => p.defaultRoles.includes('TRUONG_NHOM'))
      .map(p => p.id),
  },
  NHAN_VIEN: {
    role: 'NHAN_VIEN',
    name: 'Chuyên Viên Nghiệp Vụ (Staff / Specialist)',
    description: 'Thực hiện công việc & khách hàng được giao phụ trách theo chuyên môn (Kế toán, HCNS, BHXH, Pháp lý, Kinh doanh, CSKH, CKS).',
    badgeColor: 'bg-blue-600 text-white',
    allowedActions: ALL_PERMISSIONS
      .filter(p => p.defaultRoles.includes('NHAN_VIEN'))
      .map(p => p.id),
  },
};

/**
 * Department-Specific Functional Permission Profiles
 * Cấu hình phân quyền chuyên biệt cho từng bộ phận trong doanh nghiệp
 */
export const DEPARTMENT_CONFIGS: DepartmentPermissionConfig[] = [
  {
    departmentKey: 'KE_TOAN_THUE_KTT',
    department: 'KE_TOAN_THUE',
    name: 'Kế Toán Trưởng & Soát Xét Thuế',
    positionTitle: 'Kế toán trưởng / Phó phòng kỹ thuật thuế',
    description: 'Soát xét tờ khai, kiểm tra cân đối BCTC, phân công hồ sơ kế toán, giám sát chất lượng.',
    iconName: 'Calculator',
    badgeColor: 'bg-emerald-600 text-white',
    allowedActions: [
      'task:view_all', 'task:create', 'task:edit', 'task:execute_step', 'task:submit_review',
      'task:review_approve', 'task:reassign',
      'customer:view_all', 'customer:create', 'customer:edit', 'customer:view_financials',
      'hr:view_own_payroll', 'hr:request_leave', 'hr:approve_leave',
      'tax:view_calendar', 'tax:use_ai_advisor', 'report:view_executive', 'report:export',
    ],
  },
  {
    departmentKey: 'KE_TOAN_THUE_STAFF',
    department: 'KE_TOAN_THUE',
    name: 'Chuyên Viên Kế Toán - Thuế (Đội 1 & Đội 2)',
    positionTitle: 'Chuyên viên hạch toán, kê khai thuế & BCTC',
    description: 'Hạch toán chứng từ, lập tờ khai GTGT/TNCN/TNDN, lập BCTC, tích checklist, nộp KTT soát xét.',
    iconName: 'FileSpreadsheet',
    badgeColor: 'bg-blue-600 text-white',
    allowedActions: [
      'task:view_assigned', 'task:create', 'task:execute_step', 'task:submit_review',
      'customer:view_assigned',
      'hr:view_own_payroll', 'hr:request_leave',
      'tax:view_calendar', 'tax:use_ai_advisor',
    ],
  },
  {
    departmentKey: 'HCNS_BHXH_LEADER',
    department: 'HANH_CHINH_NHAN_SU',
    name: 'Trưởng Phòng Tiền Lương & BHXH',
    positionTitle: 'Trưởng phòng Tiền lương & BHXH',
    description: 'Toàn quyền kiểm soát hồ sơ nhân sự, bảng lương công ty, duyệt thủ tục BHXH, duyệt nghỉ phép.',
    iconName: 'Users',
    badgeColor: 'bg-teal-700 text-white',
    allowedActions: [
      'task:view_all', 'task:create', 'task:edit', 'task:execute_step', 'task:submit_review', 'task:review_approve', 'task:reassign',
      'customer:view_all', 'customer:edit', 'customer:view_financials',
      'contract:view_all', 'contract:manage_debt',
      'hr:view_all_profiles', 'hr:edit_profile', 'hr:view_all_payroll', 'hr:view_own_payroll',
      'hr:manage_payroll', 'hr:manage_bhxh_records', 'hr:manage_sops', 'hr:request_leave', 'hr:review_leave', 'hr:approve_leave',
      'admin:manage_archives', 'tax:view_calendar', 'report:view_executive', 'report:export',
    ],
  },
  {
    departmentKey: 'HCNS_BHXH_STAFF',
    department: 'HANH_CHINH_NHAN_SU',
    name: 'Chuyên Viên Hành Chính – Nhân Sự & BHXH',
    positionTitle: 'Chuyên viên thủ tục BHXH, Thai sản, Chốt sổ, Tiền lương',
    description: 'Quản lý hồ sơ nhân sự 30 nhân sự & khách hàng, tính toán bảng lương, xử lý thủ tục BHXH (báo tăng/giảm, ốm đau, thai sản, chốt sổ, đối chiếu C12), sơ duyệt đơn nghỉ phép.',
    iconName: 'UserCheck',
    badgeColor: 'bg-cyan-600 text-white',
    allowedActions: [
      'task:view_all', 'task:create', 'task:edit', 'task:execute_step', 'task:submit_review',
      'customer:view_all',
      'contract:view_all',
      'hr:view_all_profiles', 'hr:edit_profile', 'hr:view_all_payroll', 'hr:view_own_payroll',
      'hr:manage_payroll', 'hr:manage_bhxh_records', 'hr:manage_sops', 'hr:request_leave', 'hr:review_leave',
      'admin:manage_archives', 'tax:view_calendar', 'tax:use_ai_advisor',
    ],
  },
  {
    departmentKey: 'PHAP_LY_DOANH_NGHIEP',
    department: 'HANH_CHINH_NHAN_SU',
    name: 'Bộ Phận Pháp Lý & Đăng Ký Kinh Doanh',
    positionTitle: 'Trưởng phòng & Chuyên viên Pháp lý Doanh nghiệp',
    description: 'Soạn thảo và nộp hồ sơ thành lập, thay đổi GPKD, vốn, ngành nghề, cấp phép con, giải thể.',
    iconName: 'Scale',
    badgeColor: 'bg-indigo-600 text-white',
    allowedActions: [
      'task:view_all', 'task:create', 'task:execute_step', 'task:submit_review',
      'customer:view_all', 'customer:create', 'customer:edit',
      'contract:view_all',
      'legal:view_all_dossiers', 'legal:create_dossier', 'legal:review_dossier',
      'hr:view_own_payroll', 'hr:request_leave',
      'tax:view_calendar',
    ],
  },
  {
    departmentKey: 'KINH_DOANH_CONG_NO',
    department: 'KINH_DOANH_CSKH',
    name: 'Bộ Phận Kinh Doanh, Hợp Đồng & Thu Hồi Công Nợ',
    positionTitle: 'Trưởng phòng KD & Chuyên viên Hợp đồng / Công nợ',
    description: 'Quản lý hợp đồng dịch vụ, biểu phí, theo dõi hạn thanh toán và đôn đốc thu hồi công nợ khách hàng.',
    iconName: 'BadgeDollarSign',
    badgeColor: 'bg-amber-600 text-white',
    allowedActions: [
      'task:view_all', 'task:create', 'task:execute_step', 'task:submit_review',
      'customer:view_all', 'customer:create', 'customer:edit', 'customer:view_financials',
      'contract:view_all', 'contract:create_edit', 'contract:manage_debt', 'cskh:receive_requests',
      'hr:view_own_payroll', 'hr:request_leave',
      'tax:view_calendar', 'report:view_executive', 'report:export',
    ],
  },
  {
    departmentKey: 'CSKH_TIEP_NHAN',
    department: 'KINH_DOANH_CSKH',
    name: 'Bộ Phận Chăm Sóc Khách Hàng (CSKH)',
    positionTitle: 'Chuyên viên CSKH & Tiếp nhận yêu cầu phát sinh',
    description: 'Tiếp nhận phản hồi, lắng nghe nhu cầu phát sinh, khởi tạo phiếu việc Ad-hoc chuyển giao.',
    iconName: 'Headphones',
    badgeColor: 'bg-violet-600 text-white',
    allowedActions: [
      'task:view_all', 'task:create', 'task:execute_step', 'task:submit_review',
      'customer:view_all', 'customer:view_assigned',
      'cskh:receive_requests', 'contract:view_all',
      'hr:view_own_payroll', 'hr:request_leave',
      'tax:view_calendar',
    ],
  },
  {
    departmentKey: 'HANH_CHINH_CKS_VAN_THU',
    department: 'HANH_CHINH_NHAN_SU',
    name: 'Bộ Phận Hành Chính & Quản Trị Chữ Ký Số (CKS)',
    positionTitle: 'Chuyên viên Hành chính, Lưu trữ & CKS',
    description: 'Quản lý kho Token CKS vật lý, hạn dùng CKS, giao nhận chứng từ và lưu trữ hồ sơ công ty.',
    iconName: 'KeyRound',
    badgeColor: 'bg-rose-600 text-white',
    allowedActions: [
      'task:view_all', 'task:create', 'task:execute_step', 'task:submit_review',
      'customer:view_all', 'customer:edit',
      'contract:view_all',
      'admin:manage_digital_signatures', 'admin:manage_archives',
      'hr:view_own_payroll', 'hr:request_leave',
      'tax:view_calendar',
    ],
  },
  {
    departmentKey: 'BAN_GIAM_DOC_EXEC',
    department: 'BAN_GIAM_DOC',
    name: 'Ban Giám Đốc & Lãnh Đạo Cấp Cao',
    positionTitle: 'Tổng Giám Đốc / Phó Tổng Giám Đốc',
    description: 'Ký số tờ khai Thuế/BHXH, duyệt chi lương, duyệt hợp đồng, quản trị toàn diện doanh nghiệp.',
    iconName: 'ShieldCheck',
    badgeColor: 'bg-slate-900 text-white',
    allowedActions: [
      'task:view_all', 'task:create', 'task:edit', 'task:execute_step', 'task:submit_review', 'task:review_approve', 'task:final_approve', 'task:reassign', 'task:delete',
      'customer:view_all', 'customer:create', 'customer:edit', 'customer:delete', 'customer:view_financials',
      'hr:view_all_profiles', 'hr:edit_profile', 'hr:view_all_payroll', 'hr:view_own_payroll', 'hr:manage_payroll', 'hr:approve_payroll', 'hr:manage_bhxh_records', 'hr:manage_sops', 'hr:request_leave', 'hr:review_leave', 'hr:approve_leave',
      'legal:view_all_dossiers', 'legal:create_dossier', 'legal:review_dossier',
      'contract:view_all', 'contract:create_edit', 'contract:manage_debt', 'cskh:receive_requests',
      'admin:manage_digital_signatures', 'admin:manage_archives',
      'tax:view_calendar', 'tax:use_ai_advisor', 'report:view_executive', 'report:export',
      'system:view_audit_logs', 'system:manage_settings', 'system:backup_restore',
    ],
  },
];

const STORAGE_KEY_PERMISSIONS = 'taxcore_role_permissions_v4';

export class PermissionService {
  private static roleMatrix: Record<UserRole, PermissionAction[]> = {
    ADMIN: [...ROLE_CONFIGS.ADMIN.allowedActions],
    BAN_GIAM_DOC: [...ROLE_CONFIGS.BAN_GIAM_DOC.allowedActions],
    TRUONG_PHONG: [...ROLE_CONFIGS.TRUONG_PHONG.allowedActions],
    TRUONG_NHOM: [...ROLE_CONFIGS.TRUONG_NHOM.allowedActions],
    NHAN_VIEN: [...ROLE_CONFIGS.NHAN_VIEN.allowedActions],
  };

  static init() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PERMISSIONS);
      if (stored) {
        this.roleMatrix = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not load custom permissions, using defaults', e);
    }
  }

  static getRolePermissions(role: UserRole): PermissionAction[] {
    return this.roleMatrix[role] || ROLE_CONFIGS[role]?.allowedActions || [];
  }

  static saveRolePermissions(role: UserRole, actions: PermissionAction[]) {
    this.roleMatrix[role] = actions;
    try {
      localStorage.setItem(STORAGE_KEY_PERMISSIONS, JSON.stringify(this.roleMatrix));
    } catch (e) {
      console.error('Failed to save permissions to localStorage', e);
    }
  }

  static resetToDefaults() {
    this.roleMatrix = {
      ADMIN: [...ROLE_CONFIGS.ADMIN.allowedActions],
      BAN_GIAM_DOC: [...ROLE_CONFIGS.BAN_GIAM_DOC.allowedActions],
      TRUONG_PHONG: [...ROLE_CONFIGS.TRUONG_PHONG.allowedActions],
      TRUONG_NHOM: [...ROLE_CONFIGS.TRUONG_NHOM.allowedActions],
      NHAN_VIEN: [...ROLE_CONFIGS.NHAN_VIEN.allowedActions],
    };
    try {
      localStorage.removeItem(STORAGE_KEY_PERMISSIONS);
    } catch (e) {
      // ignore
    }
  }

  /**
   * Universal permission checker evaluated against Role + Department + Position
   */
  static can(user: User | null | undefined, action: PermissionAction): boolean {
    if (!user) return false;
    
    // 1. System Admin has all permissions
    if (user.role === 'ADMIN') return true;

    // 2. Ban Giam Doc has almost all operational permissions
    if (user.role === 'BAN_GIAM_DOC') {
      if (action === 'system:manage_permissions' || action === 'customer:delete') {
        return false;
      }
      return true;
    }

    // 3. Check custom/configured base role permissions
    const permissions = this.getRolePermissions(user.role);
    if (permissions.includes(action)) return true;

    // 4. Department & Position-Specific Functional Privileges:
    const pos = (user.position || '').toLowerCase();
    const dept = user.department;

    // A. CHUYÊN VIÊN HÀNH CHÍNH - NHÂN SỰ & BHXH & TIỀN LƯƠNG
    if (dept === 'HANH_CHINH_NHAN_SU' && (user.role === 'TRUONG_PHONG' || pos.includes('nhân sự') || pos.includes('bhxh') || pos.includes('tiền lương'))) {
      const hrSpecialistActions: PermissionAction[] = [
        'hr:view_all_profiles',
        'hr:edit_profile',
        'hr:view_all_payroll',
        'hr:manage_payroll',
        'hr:manage_bhxh_records',
        'hr:manage_sops',
        'hr:review_leave',
        'hr:request_leave',
        'admin:manage_archives',
        'task:view_all',
        'customer:view_all',
      ];
      if (hrSpecialistActions.includes(action)) return true;
    }

    // B. BỘ PHẬN PHÁP LÝ DOANH NGHIỆP & ĐKKD
    if (pos.includes('pháp lý') || pos.includes('đkkd') || pos.includes('gpkd')) {
      const legalActions: PermissionAction[] = [
        'legal:view_all_dossiers',
        'legal:create_dossier',
        'legal:review_dossier',
        'customer:view_all',
        'task:view_all',
      ];
      if (legalActions.includes(action)) return true;
    }

    // C. BỘ PHẬN KINH DOANH, HỢP ĐỒNG & THU HỒI CÔNG NỢ & CSKH
    if (dept === 'KINH_DOANH_CSKH' || pos.includes('kinh doanh') || pos.includes('hợp đồng') || pos.includes('công nợ') || pos.includes('cskh')) {
      const salesDebtActions: PermissionAction[] = [
        'contract:view_all',
        'contract:create_edit',
        'contract:manage_debt',
        'customer:view_all',
        'customer:view_financials',
        'cskh:receive_requests',
        'task:view_all',
      ];
      if (user.role === 'TRUONG_PHONG' || pos.includes('trưởng phòng')) {
        salesDebtActions.push('customer:create', 'customer:edit');
      }
      if (salesDebtActions.includes(action)) return true;
    }

    // D. BỘ PHẬN QUẢN TRỊ CHỮ KÝ SỐ (CKS) & VĂN THƯ
    if (pos.includes('cks') || pos.includes('chữ ký số') || pos.includes('lưu trữ') || pos.includes('văn thư')) {
      const cksActions: PermissionAction[] = [
        'admin:manage_digital_signatures',
        'admin:manage_archives',
        'customer:view_all',
        'task:view_all',
      ];
      if (cksActions.includes(action)) return true;
    }

    // E. TRƯỞNG PHÒNG / KẾ TOÁN TRƯỞNG
    if (user.role === 'TRUONG_PHONG') {
      const leaderActions: PermissionAction[] = [
        'task:view_all',
        'task:create',
        'task:edit',
        'task:review_approve',
        'task:reassign',
        'customer:view_all',
        'customer:create',
        'customer:edit',
        'customer:view_financials',
        'hr:approve_leave',
        'report:view_executive',
        'report:export',
      ];
      if (leaderActions.includes(action)) return true;
    }

    // F. TRƯỞNG NHÓM / GIÁM SÁT TỔ (Chỉ giám sát nghiệp vụ kỹ thuật & tiến độ công việc, không sửa thông tin khách hàng, không xem tài chính, không xem hồ sơ nhân sự khác)
    if (user.role === 'TRUONG_NHOM') {
      const teamLeadActions: PermissionAction[] = [
        'task:view_all',
        'task:create',
        'task:edit',
        'task:execute_step',
        'task:submit_review',
        'task:review_approve',
        'task:reassign',
        'customer:view_all',
        'hr:review_leave',
        'hr:request_leave',
        'hr:view_own_payroll',
        'tax:view_calendar',
        'tax:use_ai_advisor',
        'cskh:receive_requests',
        'admin:manage_archives',
      ];
      if (teamLeadActions.includes(action)) return true;
    }

    return false;
  }

  // Domain-Specific Shortcut Checkers

  static canManageHR(user: User | null | undefined): boolean {
    return this.can(user, 'hr:view_all_profiles') || this.can(user, 'hr:edit_profile');
  }

  static canManageBHXH(user: User | null | undefined): boolean {
    return this.can(user, 'hr:manage_bhxh_records');
  }

  static canManagePayroll(user: User | null | undefined): boolean {
    return this.can(user, 'hr:manage_payroll') || this.can(user, 'hr:view_all_payroll');
  }

  static canApprovePayroll(user: User | null | undefined): boolean {
    return this.can(user, 'hr:approve_payroll');
  }

  static canReviewLeave(user: User | null | undefined): boolean {
    return this.can(user, 'hr:review_leave') || this.can(user, 'hr:approve_leave');
  }

  static canApproveLeave(user: User | null | undefined): boolean {
    return this.can(user, 'hr:approve_leave');
  }

  static canManageContracts(user: User | null | undefined): boolean {
    return this.can(user, 'contract:create_edit') || this.can(user, 'contract:view_all');
  }

  static canManageDebt(user: User | null | undefined): boolean {
    return this.can(user, 'contract:manage_debt');
  }

  static canManageDigitalSignatures(user: User | null | undefined): boolean {
    return this.can(user, 'admin:manage_digital_signatures');
  }

  static canManageIAM(user: User | null | undefined): boolean {
    if (!user) return false;
    return user.role === 'ADMIN' || user.role === 'BAN_GIAM_DOC';
  }

  /**
   * Check if user can create, edit, delete or reset SOP templates, ad-hoc services & packages
   * Strictly restricted to Ban Giám Đốc and Admin. All other roles only have read-only view.
   */
  static canManageTemplates(user: User | null | undefined): boolean {
    if (!user) return false;
    if (user.role === 'ADMIN' || user.role === 'BAN_GIAM_DOC') return true;
    return this.can(user, 'template:manage');
  }

  /**
   * Check if user can view a specific task
   */
  static canViewTask(user: User | null | undefined, task: Task): boolean {
    if (!user) return false;
    if (this.can(user, 'task:view_all')) return true;
    return task.assigneeId === user.id || task.reviewerId === user.id || task.approverId === user.id;
  }

  /**
   * Check if user can perform specific workflow state transition on a task
   */
  static canSubmitTaskForReview(user: User | null | undefined, task: Task): boolean {
    if (!user) return false;
    if (user.role === 'ADMIN' || user.role === 'BAN_GIAM_DOC' || user.role === 'TRUONG_PHONG' || user.role === 'TRUONG_NHOM') return true;
    return task.assigneeId === user.id && this.can(user, 'task:submit_review');
  }

  static canReviewTask(user: User | null | undefined, task: Task): boolean {
    if (!user) return false;
    if (user.role === 'ADMIN' || user.role === 'BAN_GIAM_DOC') return true;
    return (user.role === 'TRUONG_PHONG' || user.role === 'TRUONG_NHOM' || task.reviewerId === user.id) && this.can(user, 'task:review_approve');
  }

  static canFinalApproveTask(user: User | null | undefined, task: Task): boolean {
    if (!user) return false;
    return (user.role === 'ADMIN' || user.role === 'BAN_GIAM_DOC' || task.approverId === user.id) && this.can(user, 'task:final_approve');
  }

  /**
   * Check if user can view financial details of a customer (Fee, Contract, Debt, Billing)
   * Strictly restricted to: Admin, Ban Giam Doc, Truong Phong (KTT / KD), or Business/Sales Dept
   */
  static canViewCustomerFinancials(user: User | null | undefined): boolean {
    if (!user) return false;
    if (user.role === 'ADMIN' || user.role === 'BAN_GIAM_DOC') return true;
    if (user.role === 'TRUONG_PHONG' && user.department === 'HANH_CHINH_NHAN_SU') return true;
    return false;
  }

  /**
   * General alias for financial permissions check across dashboards and customer profiles
   */
  static canViewFinancials(user: User | null | undefined): boolean {
    return this.canViewCustomerFinancials(user);
  }

  /**
   * Check if user can view high-security sensitive credentials of a customer
   * (eTax password, BHXH password, Token PIN, Physical Token storage location)
   * Need-to-know basis: Only Admin, Director, KTT, assigned direct specialist, or CKS admin
   */
  static canViewCustomerSensitiveData(user: User | null | undefined, customer: Customer): boolean {
    if (!user) return false;
    if (user.role === 'ADMIN' || user.role === 'BAN_GIAM_DOC') return true;
    if (user.role === 'TRUONG_PHONG' && (user.department === 'KE_TOAN_THUE' || user.department === 'HANH_CHINH_NHAN_SU')) return true;
    // Direct assigned staff or reviewer
    if (customer.assignedStaffId === user.id || customer.reviewerStaffId === user.id) return true;
    // CKS / Archives staff
    const pos = (user.position || '').toLowerCase();
    if (pos.includes('cks') || pos.includes('chữ ký số') || pos.includes('văn thư') || pos.includes('lưu trữ')) return true;
    return false;
  }

  /**
   * Check if user can create a new customer
   * Strictly restricted to: Admin, Ban Giam Doc, or Truong Phong.
   * Regular staff (NHAN_VIEN) and Team Leads (TRUONG_NHOM) are strictly FORBIDDEN.
   */
  static canCreateCustomer(user: User | null | undefined): boolean {
    if (!user) return false;
    if (user.role === 'NHAN_VIEN' || user.role === 'TRUONG_NHOM') return false;
    if (user.role === 'ADMIN' || user.role === 'BAN_GIAM_DOC') return true;
    if (user.role === 'TRUONG_PHONG') return true;
    return this.can(user, 'customer:create');
  }

  /**
   * Check if user can edit a customer profile
   * Strictly restricted to: Admin, Ban Giam Doc, or Truong Phong.
   * Regular staff (NHAN_VIEN) and Team Leads (TRUONG_NHOM) are strictly FORBIDDEN.
   */
  static canEditCustomer(user: User | null | undefined, customer?: Customer): boolean {
    if (!user) return false;
    if (user.role === 'NHAN_VIEN' || user.role === 'TRUONG_NHOM') return false;
    if (user.role === 'ADMIN' || user.role === 'BAN_GIAM_DOC' || user.role === 'TRUONG_PHONG') return true;
    return false;
  }

  /**
   * Check if user can delete a customer (Admin, Ban Giam Doc, Truong Phong)
   */
  static canDeleteCustomer(user: User | null | undefined): boolean {
    if (!user) return false;
    if (user.role === 'ADMIN' || user.role === 'BAN_GIAM_DOC' || user.role === 'TRUONG_PHONG') return true;
    return this.can(user, 'customer:delete');
  }

  /**
   * Check if user can view a customer overview
   */
  static canViewCustomer(user: User | null | undefined, customer: Customer): boolean {
    if (!user) return false;
    if (this.can(user, 'customer:view_all')) return true;
    return customer.assignedStaffId === user.id || customer.reviewerStaffId === user.id;
  }

  /**
   * Check if user can view all tasks across the company
   */
  static canViewAllTasks(user: User | null | undefined): boolean {
    if (!user) return false;
    if (user.role === 'ADMIN' || user.role === 'BAN_GIAM_DOC' || user.role === 'TRUONG_PHONG' || user.role === 'TRUONG_NHOM') return true;
    return this.can(user, 'task:view_all');
  }

  /**
   * Check if user can view all customers across the company
   */
  static canViewAllCustomers(user: User | null | undefined): boolean {
    if (!user) return false;
    if (user.role === 'ADMIN' || user.role === 'BAN_GIAM_DOC' || user.role === 'TRUONG_PHONG' || user.role === 'TRUONG_NHOM') return true;
    return this.can(user, 'customer:view_all');
  }

  /**
   * Check if user can view all employee profiles
   * Strictly restricted to: Admin, Ban Giam Doc, or HR Department Head/Specialist.
   * Staff and Team Leads only see their own profile.
   */
  static canViewAllProfiles(user: User | null | undefined): boolean {
    if (!user) return false;
    if (user.role === 'ADMIN' || user.role === 'BAN_GIAM_DOC') return true;
    if (user.role === 'TRUONG_PHONG' && user.department === 'HANH_CHINH_NHAN_SU') return true;
    if (user.department === 'HANH_CHINH_NHAN_SU' && ((user.position || '').toLowerCase().includes('nhân sự') || (user.position || '').toLowerCase().includes('bhxh'))) return true;
    return false;
  }

  /**
   * Check if user can view all payroll records
   * Strictly restricted to: Admin, Ban Giam Doc, or HR Department Head/Payroll Specialist.
   * Staff and Team Leads only see their own payroll slip.
   */
  static canViewAllPayroll(user: User | null | undefined): boolean {
    if (!user) return false;
    if (user.role === 'ADMIN' || user.role === 'BAN_GIAM_DOC') return true;
    if (user.role === 'TRUONG_PHONG' && user.department === 'HANH_CHINH_NHAN_SU') return true;
    if (user.department === 'HANH_CHINH_NHAN_SU' && (user.position || '').toLowerCase().includes('tiền lương')) return true;
    return false;
  }

  /**
   * Check if user can view all staff KPIs
   */
  static canViewAllKPIs(user: User | null | undefined): boolean {
    if (!user) return false;
    if (user.role === 'ADMIN' || user.role === 'BAN_GIAM_DOC' || user.role === 'TRUONG_PHONG') return true;
    return false;
  }

  /**
   * Check if user can access specific Operations Hub sub-tabs
   */
  static canAccessOperationsSubTab(user: User | null | undefined, subTab: 'WORKLOAD' | 'HR' | 'KPI' | 'REPORTS' | 'RBAC_SETTINGS' | 'AUDIT'): boolean {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    if (user.role === 'BAN_GIAM_DOC') return true;

    switch (subTab) {
      case 'WORKLOAD':
        // All staff can view workload: management sees full rebalancing, staff sees their personal workload & assignments
        return true;
      case 'HR':
        // All staff can access HR to view SOPs, their own profile, request leave and view own payroll
        return true;
      case 'KPI':
        // All staff can view KPI dashboard (management sees full rankings, staff sees their own KPI report)
        return true;
      case 'REPORTS':
        return user.role === 'TRUONG_PHONG' || user.department === 'KINH_DOANH_CSKH' || this.can(user, 'report:view_executive');
      case 'RBAC_SETTINGS':
        return false;
      case 'AUDIT':
        return false;
      default:
        return false;
    }
  }

  /**
   * Check if a user has permission to view a specific system expiring cycle alert
   */
  static canViewExpiringCycle(user: User | null | undefined, cycle: SystemExpiringCycleItem, customer?: Customer): boolean {
    if (!user) return false;
    if (user.role === 'ADMIN' || user.role === 'BAN_GIAM_DOC' || user.role === 'TRUONG_PHONG' || user.role === 'TRUONG_NHOM') return true;

    // 1. Internal HR Labor Contract & Probation
    if (cycle.category === 'HR_PROBATION' || cycle.category === 'HR_LABOR_CONTRACT') {
      if (this.can(user, 'hr:view_all_profiles')) return true;
      // Only view own labor contract / probation expiry
      return cycle.entityId === user.id;
    }

    // 2. Global permissions by department role
    if (cycle.category === 'CUSTOMER_CONTRACT' && (this.canManageContracts(user) || this.can(user, 'customer:view_all'))) {
      return true;
    }
    if (cycle.category === 'DIGITAL_SIGNATURE' && (this.canManageDigitalSignatures(user) || this.can(user, 'customer:view_all'))) {
      return true;
    }
    if (cycle.category === 'BUSINESS_LICENSE' && (this.can(user, 'legal:view_all_dossiers') || this.can(user, 'customer:view_all'))) {
      return true;
    }
    if (cycle.category === 'EINVOICE_PACKAGE' && this.can(user, 'customer:view_all')) {
      return true;
    }

    // 3. Customer Portfolio Scope: Non-management staff only see cycles for customers they are directly assigned to
    if (customer) {
      return customer.assignedStaffId === user.id || 
             customer.reviewerStaffId === user.id;
    }

    return false;
  }

  /**
   * Filter a list of system expiring cycles strictly based on the user's role and assigned portfolio
   */
  static filterExpiringCycles(
    cycles: SystemExpiringCycleItem[], 
    user: User | null | undefined, 
    customers: Customer[]
  ): SystemExpiringCycleItem[] {
    if (!user) return [];
    if (user.role === 'ADMIN' || user.role === 'BAN_GIAM_DOC' || user.role === 'TRUONG_PHONG' || user.role === 'TRUONG_NHOM') {
      return cycles;
    }

    const customerMap = new Map<string, Customer>();
    customers.forEach(c => customerMap.set(c.id, c));

    return cycles.filter(cycle => {
      const cust = customerMap.get(cycle.entityId);
      return this.canViewExpiringCycle(user, cycle, cust);
    });
  }
}

// Initialize on module load
PermissionService.init();

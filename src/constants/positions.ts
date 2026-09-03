import { Department, UserRole } from '../types';

export interface PositionDefinition {
  id: string;
  name: string;
  department: Department;
  defaultRole: UserRole;
  group: string;
  description?: string;
  defaultAllowance?: number;
  defaultCapacity?: number;
}

export interface PositionGroup {
  groupName: string;
  department: Department;
  positions: PositionDefinition[];
}

export const STANDARD_POSITION_GROUPS: PositionGroup[] = [
  {
    groupName: 'Ban Giám Đốc & Lãnh Đạo Cấp Cao',
    department: 'BAN_GIAM_DOC',
    positions: [
      {
        id: 'CEO_DIRECTOR',
        name: 'Ban Giám Đốc - Tổng Giám Đốc / Giám Đốc Điều Hành (CEO)',
        department: 'BAN_GIAM_DOC',
        defaultRole: 'BAN_GIAM_DOC',
        group: 'Ban Giám Đốc',
        description: 'Chỉ đạo toàn diện hoạt động điều hành, chiến lược và ký duyệt cao nhất',
        defaultAllowance: 5000000,
        defaultCapacity: 0,
      },
      {
        id: 'VICE_DIRECTOR_OPS',
        name: 'Ban Giám Đốc - Phó Giám Đốc Nghiệp Vụ',
        department: 'BAN_GIAM_DOC',
        defaultRole: 'BAN_GIAM_DOC',
        group: 'Ban Giám Đốc',
        description: 'Phụ trách chất lượng nghiệp vụ Đại lý thuế, Kế toán & Kiểm soát rủi ro',
        defaultAllowance: 3500000,
        defaultCapacity: 0,
      },
      {
        id: 'VICE_DIRECTOR_BD',
        name: 'Ban Giám Đốc - Phó Giám Đốc Kinh Doanh',
        department: 'BAN_GIAM_DOC',
        defaultRole: 'BAN_GIAM_DOC',
        group: 'Ban Giám Đốc',
        description: 'Phụ trách mở rộng thị trường, mạng lưới khách hàng & đối tác chiến lược',
        defaultAllowance: 3500000,
        defaultCapacity: 0,
      },
      {
        id: 'CHIEF_ACCOUNTANT',
        name: 'Kế Toán Trưởng / Giám Đốc Tài Chính (CFO)',
        department: 'BAN_GIAM_DOC',
        defaultRole: 'BAN_GIAM_DOC',
        group: 'Ban Giám Đốc',
        description: 'Chủ trì công tác tài chính, soát xét thuế chuyên sâu & ký duyệt hồ sơ',
        defaultAllowance: 3000000,
        defaultCapacity: 5,
      },
    ],
  },
  {
    groupName: 'Phòng Kế Toán Thuế & Đại Lý Thuế',
    department: 'KE_TOAN_THUE',
    positions: [
      {
        id: 'TAX_HEAD',
        name: 'Trưởng phòng Kế toán Thuế',
        department: 'KE_TOAN_THUE',
        defaultRole: 'TRUONG_PHONG',
        group: 'Kế Toán Thuế',
        description: 'Quản lý toàn bộ tiến độ, phân bổ khách hàng & phê duyệt báo cáo thuế',
        defaultAllowance: 2500000,
        defaultCapacity: 10,
      },
      {
        id: 'TAX_DEPUTY_HEAD',
        name: 'Phó Trưởng phòng Kế toán Thuế',
        department: 'KE_TOAN_THUE',
        defaultRole: 'TRUONG_PHONG',
        group: 'Kế Toán Thuế',
        description: 'Hỗ trợ điều hành phòng thuế, kiểm soát rủi ro hồ sơ trọng điểm',
        defaultAllowance: 1800000,
        defaultCapacity: 10,
      },
      {
        id: 'TAX_TEAM_LEADER',
        name: 'Trưởng nhóm Kế toán Thuế',
        department: 'KE_TOAN_THUE',
        defaultRole: 'TRUONG_NHOM',
        group: 'Kế Toán Thuế',
        description: 'Phụ trách một tổ chuyên viên thuế, soát xét cấp 1 tờ khai & tiến độ',
        defaultAllowance: 1200000,
        defaultCapacity: 8,
      },
      {
        id: 'TAX_STAFF',
        name: 'Nhân viên Kế toán Thuế',
        department: 'KE_TOAN_THUE',
        defaultRole: 'NHAN_VIEN',
        group: 'Kế Toán Thuế',
        description: 'Trực tiếp hạch toán sổ sách, lập tờ khai thuế GTGT, TNCN, TNDN & BCTC',
        defaultAllowance: 500000,
        defaultCapacity: 7,
      },
      {
        id: 'TAX_REVIEWER_QA',
        name: 'Chuyên viên Soát xét & Kiểm soát Chất lượng Hồ sơ (QA/QC)',
        department: 'KE_TOAN_THUE',
        defaultRole: 'NHAN_VIEN',
        group: 'Kế Toán Thuế',
        description: 'Thẩm tra độc lập số liệu, soát xét rủi ro hóa đơn và cảnh báo thuế',
        defaultAllowance: 1000000,
        defaultCapacity: 12,
      },
      {
        id: 'TAX_CONSULTANT',
        name: 'Chuyên viên Tư vấn Thuế & Quyết toán Thuế Doanh nghiệp',
        department: 'KE_TOAN_THUE',
        defaultRole: 'NHAN_VIEN',
        group: 'Kế Toán Thuế',
        description: 'Tư vấn chính sách thuế, giải trình thanh tra kiểm tra thuế chuyên sâu',
        defaultAllowance: 1000000,
        defaultCapacity: 6,
      },
      {
        id: 'TAX_ASSISTANT_INTERN',
        name: 'Trợ lý / Thực tập sinh Kế toán Thuế',
        department: 'KE_TOAN_THUE',
        defaultRole: 'NHAN_VIEN',
        group: 'Kế Toán Thuế',
        description: 'Hỗ trợ thu thập, sắp xếp chứng từ hóa đơn, nhập liệu ban đầu',
        defaultAllowance: 0,
        defaultCapacity: 3,
      },
    ],
  },
  {
    groupName: 'Phòng Hành Chính - Nhân Sự & BHXH',
    department: 'HANH_CHINH_NHAN_SU',
    positions: [
      {
        id: 'HR_HEAD',
        name: 'Trưởng phòng HCNS/BHXH',
        department: 'HANH_CHINH_NHAN_SU',
        defaultRole: 'TRUONG_PHONG',
        group: 'Hành Chính - Nhân Sự',
        description: 'Quản trị nhân sự nội bộ, tính lương, BHXH toàn cơ quan & SOP quy trình',
        defaultAllowance: 2000000,
        defaultCapacity: 0,
      },
      {
        id: 'HR_DEPUTY_HEAD',
        name: 'Phó Trưởng phòng HCNS/BHXH',
        department: 'HANH_CHINH_NHAN_SU',
        defaultRole: 'TRUONG_PHONG',
        group: 'Hành Chính - Nhân Sự',
        description: 'Hỗ trợ điều hành công tác nhân sự, tiền lương và hồ sơ pháp lý',
        defaultAllowance: 1500000,
        defaultCapacity: 0,
      },
      {
        id: 'HR_TEAM_LEADER',
        name: 'Trưởng nhóm HCNS/BHXH',
        department: 'HANH_CHINH_NHAN_SU',
        defaultRole: 'TRUONG_NHOM',
        group: 'Hành Chính - Nhân Sự',
        description: 'Điều phối mảng BHXH, tiền lương và chế độ người lao động',
        defaultAllowance: 1000000,
        defaultCapacity: 0,
      },
      {
        id: 'HR_STAFF',
        name: 'Nhân viên HCNS/BHXH',
        department: 'HANH_CHINH_NHAN_SU',
        defaultRole: 'NHAN_VIEN',
        group: 'Hành Chính - Nhân Sự',
        description: 'Thực hiện hồ sơ tăng giảm BHXH, hợp đồng lao động, chấm công nội bộ',
        defaultAllowance: 300000,
        defaultCapacity: 0,
      },
      {
        id: 'HR_CB_SPECIALIST',
        name: 'Chuyên viên Tiền lương, Chế độ & BHXH (C&B)',
        department: 'HANH_CHINH_NHAN_SU',
        defaultRole: 'NHAN_VIEN',
        group: 'Hành Chính - Nhân Sự',
        description: 'Chuyên trách tính bảng lương, thuế TNCN và các chế độ thai sản, ốm đau',
        defaultAllowance: 600000,
        defaultCapacity: 0,
      },
      {
        id: 'HR_RECRUITMENT_TRAINER',
        name: 'Chuyên viên Tuyển dụng & Đào tạo Nội bộ',
        department: 'HANH_CHINH_NHAN_SU',
        defaultRole: 'NHAN_VIEN',
        group: 'Hành Chính - Nhân Sự',
        description: 'Tuyển dụng nhân sự kế toán, đào tạo hội nhập & chuẩn hóa kỹ năng',
        defaultAllowance: 400000,
        defaultCapacity: 0,
      },
      {
        id: 'HR_ADMIN_CLERK',
        name: 'Nhân viên Văn thư, Hành chính & Lễ tân',
        department: 'HANH_CHINH_NHAN_SU',
        defaultRole: 'NHAN_VIEN',
        group: 'Hành Chính - Nhân Sự',
        description: 'Quản lý văn thư lưu trữ, con dấu, tài sản cơ quan và tiếp đón khách hàng',
        defaultAllowance: 200000,
        defaultCapacity: 0,
      },
    ],
  },
  {
    groupName: 'Phòng Kinh Doanh & Dịch Vụ Khách Hàng (Sales & CSKH) & Pháp Lý',
    department: 'KINH_DOANH_CSKH',
    positions: [
      {
        id: 'SALES_HEAD',
        name: 'Trưởng phòng Sales',
        department: 'KINH_DOANH_CSKH',
        defaultRole: 'TRUONG_PHONG',
        group: 'Kinh Doanh & CSKH',
        description: 'Chỉ đạo kế hoạch doanh số, phát triển gói dịch vụ & quản lý hợp đồng',
        defaultAllowance: 2200000,
        defaultCapacity: 0,
      },
      {
        id: 'SALES_DEPUTY_HEAD',
        name: 'Phó Trưởng phòng Sales',
        department: 'KINH_DOANH_CSKH',
        defaultRole: 'TRUONG_PHONG',
        group: 'Kinh Doanh & CSKH',
        description: 'Hỗ trợ điều hành mạng lưới kinh doanh và phát triển đối tác liên kết',
        defaultAllowance: 1600000,
        defaultCapacity: 0,
      },
      {
        id: 'SALES_TEAM_LEADER',
        name: 'Trưởng nhóm Sales',
        department: 'KINH_DOANH_CSKH',
        defaultRole: 'TRUONG_NHOM',
        group: 'Kinh Doanh & CSKH',
        description: 'Dẫn dắt đội ngũ tư vấn, phân bổ chỉ tiêu doanh số và đôn đốc hợp đồng',
        defaultAllowance: 1200000,
        defaultCapacity: 0,
      },
      {
        id: 'SALES_STAFF',
        name: 'Nhân viên Sales',
        department: 'KINH_DOANH_CSKH',
        defaultRole: 'NHAN_VIEN',
        group: 'Kinh Doanh & CSKH',
        description: 'Tìm kiếm khách hàng, tư vấn dịch vụ kế toán thuế & đàm phán hợp đồng',
        defaultAllowance: 500000,
        defaultCapacity: 0,
      },
      {
        id: 'CSKH_SPECIALIST',
        name: 'Chuyên viên Chăm sóc Khách hàng & CRM (CSKH)',
        department: 'KINH_DOANH_CSKH',
        defaultRole: 'NHAN_VIEN',
        group: 'Kinh Doanh & CSKH',
        description: 'Khảo sát hài lòng, tiếp nhận phản ánh, duy trì và tái ký hợp đồng dịch vụ',
        defaultAllowance: 500000,
        defaultCapacity: 0,
      },
      {
        id: 'LEGAL_SPECIALIST',
        name: 'Chuyên viên Pháp lý Doanh nghiệp & Thủ tục ĐKKD',
        department: 'KINH_DOANH_CSKH',
        defaultRole: 'NHAN_VIEN',
        group: 'Kinh Doanh & CSKH',
        description: 'Thực hiện dịch vụ thành lập DN, thay đổi GPKD, giải thể & pháp lý liên quan',
        defaultAllowance: 800000,
        defaultCapacity: 0,
      },
    ],
  },
  {
    groupName: 'Khối Công Nghệ & Quản Trị Hệ Thống (IT & Operations)',
    department: 'HANH_CHINH_NHAN_SU',
    positions: [
      {
        id: 'IT_SYS_ADMIN',
        name: 'Chuyên viên CNTT & Quản trị Hệ thống Phần mềm',
        department: 'HANH_CHINH_NHAN_SU',
        defaultRole: 'NHAN_VIEN',
        group: 'Hệ Thống & CNTT',
        description: 'Bảo mật dữ liệu, quản trị máy chủ kế toán, chữ ký số & hỗ trợ kỹ thuật',
        defaultAllowance: 800000,
        defaultCapacity: 0,
      },
    ],
  },
];

// Flat list of all predefined position names for quick validation and matching
export const ALL_STANDARD_POSITIONS: PositionDefinition[] = STANDARD_POSITION_GROUPS.flatMap(g => g.positions);

export const STANDARD_POSITION_NAMES: string[] = ALL_STANDARD_POSITIONS.map(p => p.name);

/**
 * Find position definition by exact name or normalized title or id
 */
export function findPositionByName(name: string | undefined | null): PositionDefinition | undefined {
  if (!name) return undefined;
  const clean = name.trim().toLowerCase();
  
  // Exact match
  const exact = ALL_STANDARD_POSITIONS.find(p => p.name.toLowerCase() === clean || p.id.toLowerCase() === clean);
  if (exact) return exact;

  // Fuzzy match
  return ALL_STANDARD_POSITIONS.find(p => {
    const pName = p.name.toLowerCase();
    return pName.includes(clean) || clean.includes(pName);
  });
}

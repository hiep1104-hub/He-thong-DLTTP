/**
 * Formatters and helper utilities for TaxCore WorkFlow
 */

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

export function formatVND(amount: number): string {
  return formatCurrency(amount);
}

export function formatDate(dateString?: string | number | Date | null): string {
  if (!dateString) return '---';
  try {
    if (typeof dateString === 'string') {
      const trimmed = dateString.trim();
      // Handle YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        const [year, month, day] = trimmed.split('-');
        return `${day}/${month}/${year}`;
      }
      // Handle YYYY-MM-DDTHH:mm:ss
      if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
        const datePart = trimmed.split('T')[0].split(' ')[0];
        const [year, month, day] = datePart.split('-');
        if (year && month && day) {
          return `${day}/${month}/${year}`;
        }
      }
    }
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return String(dateString);
  }
}

export function formatDateTime(isoString?: string | number | Date | null): string {
  if (!isoString) return '---';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return String(isoString);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes} ${day}/${month}/${year}`;
  } catch {
    return String(isoString);
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const STATUS_LABELS: Record<string, { label: string; bg: string; text: string; border: string }> = {
  MOI_TAO: { label: 'Mới tạo', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-300 dark:border-slate-700' },
  DA_PHAN_CONG: { label: 'Đã phân công', bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
  DANG_THUC_HIEN: { label: 'Đang thực hiện', bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800' },
  CHO_CHUNG_TU: { label: 'Chờ chứng từ', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  CHO_KHACH_HANG: { label: 'Chờ khách hàng', bg: 'bg-yellow-50 dark:bg-yellow-950/40', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-200 dark:border-yellow-800' },
  CHO_KIEM_TRA: { label: 'Chờ kiểm tra', bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
  CHO_PHE_DUYET: { label: 'Chờ phê duyệt', bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' },
  HOAN_THANH: { label: 'Hoàn thành', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  QUA_HAN: { label: 'Quá hạn', bg: 'bg-red-50 dark:bg-red-950/40', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-800' },
  HUY: { label: 'Đã hủy', bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-300 dark:border-gray-700' },
};

export const PRIORITY_LABELS: Record<string, { label: string; color: string; badgeClass: string }> = {
  THAP: { label: 'Thấp', color: 'text-slate-600', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' },
  TRUNG_BINH: { label: 'Trung bình', color: 'text-blue-600', badgeClass: 'bg-blue-100 text-blue-800 border-blue-200' },
  CAO: { label: 'Cao', color: 'text-amber-600', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200' },
  KHAN_CAP: { label: 'Khẩn cấp', color: 'text-red-600', badgeClass: 'bg-red-100 text-red-800 border-red-200 font-semibold' },
};

export const RISK_LABELS: Record<string, { label: string; badgeClass: string; iconColor: string }> = {
  BINH_THUONG: { label: 'Bình thường', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', iconColor: 'text-emerald-600' },
  THAP: { label: 'Rủi ro thấp', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200', iconColor: 'text-blue-600' },
  TRUNG_BINH: { label: 'Rủi ro trung bình', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200', iconColor: 'text-amber-600' },
  CAO: { label: 'Rủi ro cao', badgeClass: 'bg-orange-50 text-orange-700 border-orange-200', iconColor: 'text-orange-600' },
  RUI_RO_THUE_PHAP_LY: { label: 'Rủi ro Thuế / Pháp lý', badgeClass: 'bg-red-100 text-red-900 border-red-300 font-bold animate-pulse', iconColor: 'text-red-600' },
  NGUY_CO_PHAP_LY: { label: 'Nguy cơ pháp lý nghiêm trọng', badgeClass: 'bg-red-100 text-red-900 border-red-300 font-bold', iconColor: 'text-red-600' },
};

export const DEPARTMENT_LABELS: Record<string, { label: string; short: string; color: string }> = {
  BAN_GIAM_DOC: { label: 'Ban Giám Đốc', short: 'BGĐ', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  KE_TOAN_THUE: { label: 'Phòng Kế Toán – Thuế', short: 'Kế Toán', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  HANH_CHINH_NHAN_SU: { label: 'Phòng Hành Chính – Nhân Sự', short: 'HCNS', color: 'bg-teal-100 text-teal-800 border-teal-200' },
  KINH_DOANH_CSKH: { label: 'Phòng Kinh Doanh & CSKH', short: 'Kinh Doanh', color: 'bg-amber-100 text-amber-800 border-amber-200' },
};

export const ROLE_LABELS: Record<string, { label: string; badge: string }> = {
  ADMIN: { label: 'Quản Trị Hệ Thống', badge: 'bg-gray-800 text-white' },
  BAN_GIAM_DOC: { label: 'Ban Giám Đốc', badge: 'bg-purple-700 text-white' },
  TRUONG_PHONG: { label: 'Trưởng Phòng', badge: 'bg-blue-700 text-white' },
  NHAN_VIEN: { label: 'Chuyên Viên / Nhân Viên', badge: 'bg-slate-600 text-white' },
};

export const BILLING_CYCLE_LABELS: Record<string, { label: string; short: string; badgeClass: string; intervalMonths: number; description: string }> = {
  HANG_THANG: { 
    label: 'Hàng tháng (1 tháng/kỳ)', 
    short: 'Hàng tháng', 
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800', 
    intervalMonths: 1, 
    description: 'Xuất thông báo phí và thu tiền hàng tháng vào ngày chốt định kỳ' 
  },
  HANG_QUY: { 
    label: 'Hàng quý (3 tháng/kỳ)', 
    short: 'Hàng quý', 
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800', 
    intervalMonths: 3, 
    description: 'Thu gộp 3 tháng/lần vào đầu mỗi quý hoạt động' 
  },
  SAU_THANG: { 
    label: 'Bán niên (6 tháng/kỳ)', 
    short: '6 tháng', 
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800', 
    intervalMonths: 6, 
    description: 'Thanh toán 6 tháng/lần, chiết khấu hoặc ưu đãi kèm theo' 
  },
  HANG_NAM: { 
    label: 'Hàng năm (12 tháng/kỳ)', 
    short: 'Hàng năm', 
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800', 
    intervalMonths: 12, 
    description: 'Thanh toán trọn gói 1 năm, giảm 5-10% hoặc tặng tháng dịch vụ' 
  },
  THEO_VU_VIEC: { 
    label: 'Theo vụ việc / Hồ sơ phát sinh', 
    short: 'Vụ việc', 
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800', 
    intervalMonths: 0, 
    description: 'Thanh toán theo từng đợt quyết toán thuế, giải thể, thành lập hoặc hoàn thuế' 
  },
};

export const DEBT_AGING_LABELS: Record<string, { label: string; range: string; badgeClass: string; actionText: string; level: number; color: string }> = {
  TRONG_HAN: { 
    label: 'Trong hạn', 
    range: '0 ngày quá hạn', 
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300', 
    actionText: 'Theo dõi chu kỳ thanh toán bình thường',
    level: 0,
    color: '#10B981'
  },
  QUA_HAN_1_30: { 
    label: 'Quá hạn 1 - 30 ngày', 
    range: '1 - 30 ngày', 
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300', 
    actionText: 'Cấp 1: Gửi thông báo & nhắc nợ mềm qua Zalo/Email',
    level: 1,
    color: '#F59E0B'
  },
  QUA_HAN_31_60: { 
    label: 'Quá hạn 31 - 60 ngày', 
    range: '31 - 60 ngày', 
    badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-300 font-semibold', 
    actionText: 'Cấp 2: Gửi công văn đôn đốc công nợ, chuẩn bị hạn chế dịch vụ',
    level: 2,
    color: '#F97316'
  },
  QUA_HAN_61_90: { 
    label: 'Quá hạn 61 - 90 ngày', 
    range: '61 - 90 ngày', 
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 font-bold', 
    actionText: 'Cấp 3: Tạm dừng nộp tờ khai/hạch toán, phát thư thông báo chính thức',
    level: 3,
    color: '#E11D48'
  },
  QUA_HAN_TREN_90: { 
    label: 'Quá hạn > 90 ngày (Nợ khó đòi)', 
    range: '> 90 ngày', 
    badgeClass: 'bg-red-200 text-red-900 dark:bg-red-950 dark:text-red-200 border-red-400 font-black animate-pulse', 
    actionText: 'Nợ xấu: Chuyển Ban Giám Đốc & Pháp chế thu hồi, tạm khóa hồ sơ',
    level: 4,
    color: '#991B1B'
  },
};

export const DEBT_STATUS_LABELS: Record<string, { label: string; badgeClass: string }> = {
  BINH_THUONG: { label: 'Bình thường', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' },
  SAP_DEN_HAN: { label: 'Sắp đến hạn', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800' },
  QUA_HAN_NO: { label: 'Quá hạn', badgeClass: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800 font-semibold' },
  NO_KHO_DOI: { label: 'Nợ khó đòi', badgeClass: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-200 dark:border-red-800 font-bold' },
};

export const CUSTOMER_TYPE_LABELS: Record<string, { label: string; short: string; badgeClass: string }> = {
  CONG_TY: { 
    label: 'Doanh Nghiệp / Công Ty', 
    short: 'Doanh Nghiệp', 
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800' 
  },
  HO_KINH_DOANH: { 
    label: 'Hộ Kinh Doanh Cá Thể (TT 152/2025)', 
    short: 'Hộ Kinh Doanh', 
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
  },
  CA_NHAN: { 
    label: 'Cá Nhân Kinh Doanh / Freelancer', 
    short: 'Cá Nhân', 
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800' 
  },
};

export const CUSTOMER_SERVICE_TYPE_LABELS: Record<string, {
  label: string;
  short: string;
  badgeClass: string;
  badgeBorder: string;
  icon: string;
  tagColor: string;
  description: string;
}> = {
  DINH_KY: {
    label: 'Dịch vụ Định kỳ (Trọn gói)',
    short: 'Định Kỳ',
    badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800',
    icon: '🔄',
    tagColor: 'text-emerald-600 dark:text-emerald-400',
    description: 'Hợp đồng trọn gói định kỳ hàng tháng / quý / năm (Kê khai thuế, BCTC, BHXH)',
  },
  PHAT_SINH: {
    label: 'Dịch vụ Phát sinh (Theo vụ việc)',
    short: 'Vụ Việc / Phát Sinh',
    badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
    badgeBorder: 'border-amber-200 dark:border-amber-800',
    icon: '⚡',
    tagColor: 'text-amber-600 dark:text-amber-400',
    description: 'Hợp đồng theo từng vụ việc đơn lẻ (Thành lập DN, Đổi ĐKKD, Mua CKS/HĐĐT, Quyết toán, Giải thể)',
  },
  HON_HOP: {
    label: 'Hỗn hợp (Định kỳ & Phát sinh vụ việc)',
    short: 'Định kỳ & Phát sinh',
    badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
    badgeBorder: 'border-blue-200 dark:border-blue-800',
    icon: '🌟',
    tagColor: 'text-blue-600 dark:text-blue-400',
    description: 'Khách hàng vừa ký hợp đồng trọn gói định kỳ, vừa phát sinh các gói dịch vụ vụ việc bổ sung',
  },
};

export const TAX_DECLARATION_CYCLE_LABELS: Record<string, { 
  label: string; 
  short: string; 
  badgeClass: string; 
  deadlineDescription: string;
  legalCondition: string;
}> = {
  THANG: { 
    label: 'Kê khai theo Tháng', 
    short: 'Theo Tháng', 
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800 font-semibold', 
    deadlineDescription: 'Hạn nộp tờ khai và tiền thuế: Chậm nhất ngày 20 của tháng tiếp theo',
    legalCondition: 'Doanh nghiệp có tổng doanh thu năm trước liền kề > 50 tỷ đồng hoặc tự nguyện đăng ký nộp theo tháng (Nghị định 126/2020/NĐ-CP).'
  },
  QUY: { 
    label: 'Kê khai theo Quý', 
    short: 'Theo Quý', 
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800 font-semibold', 
    deadlineDescription: 'Hạn nộp tờ khai và tiền thuế: Chậm nhất ngày cuối cùng của tháng đầu quý tiếp theo (30/04, 31/07, 31/10, 31/01)',
    legalCondition: 'Doanh nghiệp mới thành lập, Doanh nghiệp có doanh thu năm trước liền kề ≤ 50 tỷ đồng, hoặc Hộ kinh doanh nộp thuế theo phương pháp kê khai (Nghị định 126/2020/NĐ-CP).'
  },
};

export const HOUSEHOLD_BUSINESS_GROUP_LABELS: Record<string, {
  groupCode: string;
  name: string;
  shortLabel: string;
  revenueRange: string;
  thresholdNote: string;
  accountingStandard: string;
  badgeClass: string;
  badgeBorder: string;
  accentColor: string;
  requiredBooks: string[];
  cashlessRule: string;
  invoiceRequirement: string;
  description: string;
}> = {
  NHOM_1: {
    groupCode: 'NHOM_1',
    name: 'Nhóm 1 (Doanh thu dưới 1 tỷ VNĐ/năm)',
    shortLabel: 'Nhóm 1 (< 1 tỷ)',
    revenueRange: 'Dưới 1 tỷ VNĐ/năm',
    thresholdNote: 'Doanh thu < 1 tỷ VNĐ',
    accountingStandard: 'Chế độ kế toán rút gọn / Hộ khoán',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    badgeBorder: 'border-emerald-300 dark:border-emerald-800',
    accentColor: '#10B981',
    requiredBooks: ['Sổ doanh thu bán hàng', 'Sổ quỹ tiền mặt'],
    cashlessRule: 'Khuyến khích chuyển khoản ngân hàng, kiểm soát doanh thu không vượt ngưỡng 1 tỷ',
    invoiceRequirement: 'Hóa đơn điện tử từng lần phát sinh hoặc HĐĐT có mã cơ quan thuế',
    description: 'Quy mô siêu nhỏ: Doanh thu < 1 tỷ. Phù hợp hộ khoán chuyển đổi hoặc hộ kê khai đơn giản, thủ tục tối thiểu.'
  },
  NHOM_2: {
    groupCode: 'NHOM_2',
    name: 'Nhóm 2 (Doanh thu trên 1 tỷ đến 3 tỷ VNĐ/năm)',
    shortLabel: 'Nhóm 2 (1 - 3 tỷ)',
    revenueRange: 'Từ > 1 tỷ đến 3 tỷ VNĐ/năm',
    thresholdNote: 'Doanh thu 1 tỷ – 3 tỷ VNĐ',
    accountingStandard: 'Thông tư 152/2025/TT-BTC (Cơ bản)',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300 dark:border-blue-800',
    badgeBorder: 'border-blue-300 dark:border-blue-800',
    accentColor: '#3B82F6',
    requiredBooks: ['Sổ chi tiết doanh thu (Mẫu S1-HKD)', 'Sổ chi tiết vật liệu/hàng hóa (Mẫu S2-HKD)', 'Sổ chi phí (Mẫu S3-HKD)', 'Sổ quỹ tiền mặt/TGNH (Mẫu S4-HKD)'],
    cashlessRule: 'Áp dụng quy tắc thanh toán không dùng tiền mặt với giao dịch mua vào giá trị lớn',
    invoiceRequirement: 'Bắt buộc sử dụng Hóa đơn điện tử có mã hoặc HĐĐT khởi tạo từ máy tính tiền',
    description: 'Quy mô nhỏ: Doanh thu 1 - 3 tỷ. Bắt buộc áp dụng chế độ kế toán theo TT 152/2025/TT-BTC (thay thế TT 88/2021), lập 4 mẫu sổ kế toán cơ bản, đối chiếu doanh thu theo quý.'
  },
  NHOM_3: {
    groupCode: 'NHOM_3',
    name: 'Nhóm 3 (Doanh thu trên 3 tỷ đến 30 tỷ VNĐ/năm)',
    shortLabel: 'Nhóm 3 (3 - 30 tỷ)',
    revenueRange: 'Từ > 3 tỷ đến 30 tỷ VNĐ/năm',
    thresholdNote: 'Doanh thu 3 tỷ – 30 tỷ VNĐ',
    accountingStandard: 'Thông tư 152/2025/TT-BTC (Nâng cao đầy đủ)',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-semibold',
    badgeBorder: 'border-amber-300 dark:border-amber-800',
    accentColor: '#F59E0B',
    requiredBooks: ['Đầy đủ 7 mẫu sổ kế toán theo TT 152/2025/TT-BTC (S1 đến S7: Doanh thu, Hàng hóa, Chi phí, Quỹ, TGNH, Tiền lương, Nghĩa vụ thuế)'],
    cashlessRule: 'Bắt buộc chứng từ thanh toán không dùng tiền mặt (Ủy nhiệm chi / Sao kê ngân hàng) cho hóa đơn từ 5 triệu đồng trở lên',
    invoiceRequirement: '100% Hóa đơn điện tử có mã của cơ quan thuế / máy tính tiền kết nối dữ liệu thuế',
    description: 'Quy mô vừa: Doanh thu 3 - 30 tỷ. Quy trình quản lý kế toán chặt chẽ theo TT 152/2025/TT-BTC, kiểm soát chi phí đầu vào, rà soát nhà cung cấp rủi ro và tuân thủ hạn mức 5 triệu không dùng tiền mặt.'
  },
  NHOM_4: {
    groupCode: 'NHOM_4',
    name: 'Nhóm 4 (Doanh thu trên 30 tỷ VNĐ/năm)',
    shortLabel: 'Nhóm 4 (> 30 tỷ)',
    revenueRange: 'Trên 30 tỷ VNĐ/năm',
    thresholdNote: 'Doanh thu > 30 tỷ VNĐ',
    accountingStandard: 'Thông tư 152/2025/TT-BTC',
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-300 dark:border-purple-800 font-bold',
    badgeBorder: 'border-purple-300 dark:border-purple-800',
    accentColor: '#8B5CF6',
    requiredBooks: ['Hệ thống sổ sách hoàn chỉnh tương đương doanh nghiệp', 'Bảng cân đối tài sản và dòng tiền ngân hàng'],
    cashlessRule: 'Kiểm soát 100% dòng tiền ngân hàng, bóc tách nghiêm ngặt giao dịch cá nhân và hoạt động kinh doanh',
    invoiceRequirement: 'HĐĐT tích hợp hệ thống POS/ERP, lưu trữ chứng từ điện tử',
    description: 'Quy mô lớn: Doanh thu > 30 tỷ. Thuộc nhóm hộ kinh doanh trọng điểm ngành thuế kiểm tra; khuyến nghị tư vấn nâng cấp thành lập Doanh nghiệp (TNHH/CP).'
  },
};

export const CONTRACT_STATUS_LABELS: Record<string, { label: string; badge: string; text: string; bg: string }> = {
  HIEU_LUC: {
    label: 'Đang hiệu lực',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
  },
  SAP_HET_HAN: {
    label: 'Sắp hết hạn',
    badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
  },
  DA_HET_HAN: {
    label: 'Đã hết hạn',
    badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    text: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
  },
  TAM_DUNG: {
    label: 'Tạm dừng dịch vụ',
    badge: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    text: 'text-slate-700 dark:text-slate-300',
    bg: 'bg-slate-100 dark:bg-slate-800',
  },
  DA_CHAM_DUT: {
    label: 'Đã chấm dứt HĐ',
    badge: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800 font-bold',
    text: 'text-rose-800 dark:text-rose-200',
    bg: 'bg-rose-100 dark:bg-rose-950',
  },
  DA_HUY: {
    label: 'Đã hủy hợp đồng',
    badge: 'bg-gray-200 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
    text: 'text-gray-700 dark:text-gray-300',
    bg: 'bg-gray-200 dark:bg-gray-800',
  },
};

export const CUSTOMER_CONTRACT_TERMINATION_REASONS = [
  'Hai bên thỏa thuận chấm dứt hợp đồng dịch vụ trước thời hạn',
  'Doanh nghiệp tạm ngừng hoạt động kinh doanh (đã nộp mẫu 01/ĐK-TNDN)',
  'Doanh nghiệp làm thủ tục giải thể / phá sản / đóng mã số thuế',
  'Doanh nghiệp chuyển đổi mô hình, tự tổ chức bộ máy kế toán nội bộ',
  'Doanh nghiệp chuyển sang đơn vị dịch vụ kế toán - đại lý thuế khác',
  'Hết hạn hợp đồng dịch vụ và doanh nghiệp không có nhu cầu gia hạn',
  'Chấm dứt do vi phạm nghĩa vụ thanh toán công nợ kéo dài (quá 90 ngày)',
  'Thay đổi người đại diện pháp luật / tái cấu trúc không tiếp tục dịch vụ',
  'Lý do khác theo biên bản thanh lý hợp đồng dịch vụ',
] as const;

export type TaskNature = 'PERIODIC' | 'ADHOC';

export function getTaskNature(task: {
  isRecurring?: boolean;
  recurringRule?: { enabled?: boolean };
  isTaxObligation?: boolean;
  taxPeriod?: string;
  id?: string;
  serviceCode?: string;
  title?: string;
}): TaskNature {
  if (task.serviceCode && !task.isRecurring) {
    return 'ADHOC';
  }
  if (task.isRecurring || task.recurringRule?.enabled) {
    return 'PERIODIC';
  }
  if (task.isTaxObligation && task.taxPeriod) {
    return 'PERIODIC';
  }
  if (task.id && (task.id.startsWith('TSK-AUTO-') || task.id.startsWith('TSK-REC-'))) {
    return 'PERIODIC';
  }
  return 'ADHOC';
}

export const TASK_NATURE_LABELS: Record<TaskNature, {
  label: string;
  shortLabel: string;
  badgeClass: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  description: string;
}> = {
  PERIODIC: {
    label: 'Công việc Định kỳ (Gói dịch vụ)',
    shortLabel: 'Định kỳ (Gói)',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300 dark:border-blue-800',
    bgClass: 'bg-blue-50 dark:bg-blue-950/40',
    textClass: 'text-blue-700 dark:text-blue-300',
    borderClass: 'border-blue-200 dark:border-blue-800',
    description: 'Nghĩa vụ Thuế, Kế toán, BHXH & BCTC định kỳ theo Hợp đồng Gói dịch vụ',
  },
  ADHOC: {
    label: 'Công việc Phát sinh (Vụ việc / 49 DV)',
    shortLabel: 'Phát sinh (Vụ việc)',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40',
    textClass: 'text-amber-700 dark:text-amber-300',
    borderClass: 'border-amber-200 dark:border-amber-800',
    description: '49 Dịch vụ phát sinh ngoài gói (ĐKKD, BHXH lần đầu, Giải trình hóa đơn, Hoàn thuế, Rà soát sổ sách...)',
  },
};

export const ATTACHMENT_CATEGORY_LABELS: Record<string, { label: string; badgeClass: string; iconColor: string }> = {
  TO_KHAI_THUE: { label: 'Tờ khai thuế & Thông báo CQT', badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200', iconColor: 'text-blue-600' },
  CHUNG_TU_NOP_TIEN: { label: 'Giấy nộp tiền / UNC Ngân hàng', badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200', iconColor: 'text-emerald-600' },
  HOA_DON: { label: 'Hóa đơn / Bảng kê', badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200', iconColor: 'text-amber-600' },
  SAO_KE_NGAN_HANG: { label: 'Sao kê ngân hàng', badgeClass: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-200', iconColor: 'text-cyan-600' },
  BCTC: { label: 'Báo cáo tài chính & Sổ cái', badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200', iconColor: 'text-purple-600' },
  HOP_DONG: { label: 'Hợp đồng dịch vụ', badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200', iconColor: 'text-indigo-600' },
  BIEN_BAN: { label: 'Biên bản nghiệm thu / Bàn giao', badgeClass: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-200', iconColor: 'text-teal-600' },
  HO_SO_PHAP_LY: { label: 'Hồ sơ pháp lý / ĐKKD', badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200', iconColor: 'text-rose-600' },
  KHAC: { label: 'Chứng từ khác', badgeClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200', iconColor: 'text-slate-600' },
};




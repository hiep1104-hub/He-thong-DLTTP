import { UserCredential, AccountLifecycleState } from '../types';

/**
 * Enterprise IAM & Credential Lifecycle Master Data
 * Chu kỳ từ phát sinh -> Kích hoạt -> Thử việc -> Chính thức -> Tạm khóa -> Chấm dứt/Thu hồi
 */

export const ACCOUNT_LIFECYCLE_CONFIG: Record<AccountLifecycleState, {
  label: string;
  shortLabel: string;
  badge: string;
  bg: string;
  text: string;
  border: string;
  description: string;
  allowLogin: boolean;
}> = {
  PENDING_ONBOARDING: {
    label: '1. Mới phát sinh (Chờ kích hoạt Onboarding)',
    shortLabel: 'Mới phát sinh',
    badge: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800',
    bg: 'bg-purple-500',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300',
    description: 'Hồ sơ nhân sự mới tiếp nhận, tài khoản đã khởi tạo nhưng chưa bàn giao kích hoạt.',
    allowLogin: false,
  },
  ACTIVE: {
    label: '2. Đang hoạt động (Toàn quyền theo vai trò)',
    shortLabel: 'Đang hoạt động',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800',
    bg: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-300',
    description: 'Tài khoản hoạt động bình thường trong thời hạn hợp đồng lao động & chu kỳ mật khẩu.',
    allowLogin: true,
  },
  FORCE_PASSWORD_CHANGE: {
    label: '3. Yêu cầu đổi mật khẩu lần đầu (First Login)',
    shortLabel: 'Yêu cầu đổi pass',
    badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800',
    bg: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-300',
    description: 'Tài khoản vừa được cấp phát ban đầu hoặc Admin vừa Reset mật khẩu an toàn.',
    allowLogin: true,
  },
  SUSPENDED: {
    label: '4. Tạm khóa truy cập (Tạm hoãn HĐLĐ / Bảo mật)',
    shortLabel: 'Tạm khóa',
    badge: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/80 dark:text-orange-300 dark:border-orange-800',
    bg: 'bg-orange-500',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-300',
    description: 'Tạm khóa quyền đăng nhập do nghỉ không lương dài ngày, tạm hoãn HĐLĐ hoặc nghi vấn bảo mật.',
    allowLogin: false,
  },
  TERMINATED_LOCKED: {
    label: '5. Đã chấm dứt & Thu hồi quyền (Offboarding)',
    shortLabel: 'Đã khóa vĩnh viễn',
    badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800',
    bg: 'bg-rose-500',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-300',
    description: 'Chấm dứt HĐLĐ, đã hoàn tất bàn giao khách hàng & công việc, thu hồi toàn bộ quyền truy cập.',
    allowLogin: false,
  },
};

export const ROOT_ADMIN_CREDENTIAL: UserCredential = {
  id: 'CRED-030',
  userId: 'USR-030',
  employeeCode: 'ADM-01',
  employeeName: 'Quản Trị Hệ Thống (Admin)',
  username: 'admin',
  email: 'admin@taxcore.vn',
  password: 'TaxCore@Admin9999!',
  rawInitialPassword: 'TaxCore@Admin9999!',
  role: 'ADMIN',
  department: 'BAN_GIAM_DOC',
  position: 'Quản trị viên Hệ thống Điều hành (Super Admin)',
  status: 'ACTIVE',
  twoFactorEnabled: false,
  twoFactorMethod: 'TOTP_AUTHENTICATOR',
  passwordUpdatedAt: '2026-08-01',
  passwordExpiryDays: 365,
  isPasswordExpired: false,
  failedLoginAttempts: 0,
  maxFailedAttempts: 10,
  lastLoginAt: '2026-08-26 08:40:00',
  lastLoginIp: '127.0.0.1',
  issuedAt: '2020-01-01',
  issuedBy: 'USR-030',
  issuedByName: 'Root System Admin',
  notes: 'Tài khoản Super Administrator - Toàn quyền cấu hình bảo mật, phân quyền RBAC và quản lý cơ sở dữ liệu.',
};

/**
 * Danh sách tài khoản hệ thống (Chỉ giữ lại tài khoản Quản trị viên Super Admin)
 */
export const INITIAL_USER_CREDENTIALS: UserCredential[] = [
  ROOT_ADMIN_CREDENTIAL
];

/**
 * Helper: Tạo Tên Đăng Nhập Chuẩn Enterprise (vd: nguyen.van.toan -> toan.nguyen)
 */
export function generateEnterpriseUsername(fullName: string, code?: string): string {
  const clean = fullName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();

  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return code ? code.toLowerCase().replace(/[^a-z0-9]/g, '') : `user${Date.now().toString().slice(-4)}`;
  }
  if (parts.length === 1) return parts[0];

  const lastName = parts[parts.length - 1]; // Tên chính (vd: toan)
  const firstName = parts[0]; // Họ (vd: nguyen)
  return `${lastName}.${firstName}`;
}

/**
 * Helper: Tạo Mật Khẩu Khởi Tạo An Toàn (Đạt chuẩn 12 ký tự: Hoa, Thường, Số, Ký tự đặc biệt)
 */
export function generateSecureInitialPassword(employeeName?: string): string {
  const specials = ['@', '#', '$', '!', '&', '*'];
  const randomSpecial = specials[Math.floor(Math.random() * specials.length)];
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  
  if (employeeName) {
    const clean = employeeName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-zA-Z]/g, '');
    const capitalized = clean.charAt(0).toUpperCase() + clean.slice(1, 6).toLowerCase();
    return `TaxCore@${capitalized}${randomNum}!`;
  }

  return `TaxCore${randomSpecial}${randomNum}!`;
}

/**
 * Helper: Đánh giá Độ mạnh mật khẩu (Password Strength Checker)
 */
export function evaluatePasswordStrength(password: string): {
  score: number; // 0 to 4
  level: 'YẾU' | 'TRUNG_BÌNH' | 'MẠNH' | 'RẤT_MẠNH';
  color: string;
  barColor: string;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (!password || password.length < 8) {
    feedback.push('Mật khẩu tối thiểu 8 ký tự');
  } else {
    score += 1;
  }

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Cần ít nhất 1 chữ in hoa (A-Z)');

  if (/[0-9]/.test(password)) score += 1;
  else feedback.push('Cần ít nhất 1 chữ số (0-9)');

  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score += 1;
  else feedback.push('Cần ít nhất 1 ký tự đặc biệt (@, #, $, !)');

  if (password.length >= 12 && score === 4) {
    return {
      score: 4,
      level: 'RẤT_MẠNH',
      color: 'text-emerald-600 dark:text-emerald-400',
      barColor: 'bg-emerald-500',
      feedback: ['Mật khẩu đạt tiêu chuẩn an toàn thông tin ISO/IEC 27001'],
    };
  }

  if (score >= 3) {
    return {
      score: 3,
      level: 'MẠNH',
      color: 'text-blue-600 dark:text-blue-400',
      barColor: 'bg-blue-500',
      feedback: feedback.length > 0 ? feedback : ['Mật khẩu an toàn'],
    };
  }

  if (score === 2) {
    return {
      score: 2,
      level: 'TRUNG_BÌNH',
      color: 'text-amber-600 dark:text-amber-400',
      barColor: 'bg-amber-500',
      feedback,
    };
  }

  return {
    score: 1,
    level: 'YẾU',
    color: 'text-rose-600 dark:text-rose-400',
    barColor: 'bg-rose-500',
    feedback,
  };
}

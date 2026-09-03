import React, { useState, useMemo } from 'react';
import { AuditLog, User, Task, Department } from '../../types';
import { 
  History, 
  Search, 
  ShieldCheck, 
  Clock, 
  Calendar,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Users,
  Activity,
  Download,
  Moon,
  Zap,
  Filter,
  Building,
  CheckCircle,
  FileCheck,
  Flame,
  ArrowRight,
  Info,
  Award,
  Eye,
  FileText,
  HelpCircle,
  ChevronRight,
  CheckSquare,
  Sparkles,
  XCircle,
  X
} from 'lucide-react';
import { formatDateTime, formatDate } from '../../utils/formatters';

interface AuditLogsViewProps {
  auditLogs: AuditLog[];
  currentUser?: User;
  users?: User[];
  tasks?: Task[];
}

export type TimeFilterPeriod = 'LAST_7_DAYS' | 'THIS_WEEK' | 'PREVIOUS_WEEK' | 'ALL_TIME';

export type SubstanceBehaviorType = 
  | 'HIGH_SUBSTANCE'        // 💎 Thực chất & Năng suất cao
  | 'NORMAL_PRODUCTIVE'     // 🟢 Thực chất & Hoạt động đều đặn
  | 'SUPERFICIAL_SUSPECTED' // ⚠️ Nghi vấn vào cho có / Treo máy hình thức
  | 'DORMANT_INACTIVE'      // 🛑 Không hoạt động / Bỏ bê hệ thống
  | 'OFF_HOURS_OVERTIME';   // 🌙 Làm việc ngoài giờ

interface StaffWeeklyActivitySummary {
  userId: string;
  userName: string;
  userCode: string;
  department: Department;
  position: string;
  avatar?: string;
  totalActiveMinutes: number;
  totalActiveHoursFormatted: string;
  totalActionsCount: number;
  
  // Tiêu chí đo lường thực chất (Substance Criteria Metrics)
  substantiveActionsCount: number;      // Số thao tác tạo giá trị thực (Hạch toán, ký số, checklist, upload, đổi trạng thái)
  superficialActionsCount: number;      // Số thao tác thụ động / lướt xem (VIEW_ONLY, LOGIN, IDLE)
  substanceRatioPercent: number;        // Tỷ lệ thao tác thực chất %
  substanceScore: number;               // Điểm thực chất tổng hợp (0 - 100)
  behaviorType: SubstanceBehaviorType;  // Phân loại hành vi
  
  // Sản phẩm & Kết quả đầu ra cụ thể
  totalTasksTouchedCount: number;       // Số hồ sơ có tương tác
  tasksMovedForwardCount: number;       // Số hồ sơ thực sự được đẩy trạng thái/ký duyệt
  filesUploadedCount: number;           // Số file đính kèm/XML tờ khai
  checklistItemsVerifiedCount: number;  // Số mục checklist soát xét đã tích
  actionDensityPerHour: number;         // Mật độ thao tác hữu ích trên mỗi giờ online
  
  lastActiveTimestamp?: string;
  offHoursActionsCount: number;
  actionsByType: Record<string, number>;
  dailyMinutes: Record<string, number>;
  dailyActions: Record<string, number>;
  
  warningStatus: 'NORMAL' | 'LOW_ENGAGEMENT' | 'OFF_HOURS_OVERTIME' | 'HIGH_PRODUCTIVITY' | 'SUPERFICIAL_ACTIVITY';
  warningMessage: string;
  detectionDetails: string[];           // Chi tiết các dấu hiệu nhận diện
}

interface WeeklyWarningItem {
  id: string;
  type: 'CRITICAL' | 'WARNING' | 'NOTICE' | 'PRAISE';
  title: string;
  description: string;
  targetUser?: string;
  targetDept?: string;
  relatedCount?: number;
  timestamp?: string;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ 
  auditLogs, 
  currentUser, 
  users = [], 
  tasks = [] 
}) => {
  const [period, setPeriod] = useState<TimeFilterPeriod>('LAST_7_DAYS');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('ALL');
  const [filterBehavior, setFilterBehavior] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'STAFF_STATS' | 'CRITERIA_GUIDE' | 'ALERTS' | 'RAW_LOGS'>('DASHBOARD');
  const [selectedStaffForDrilldown, setSelectedStaffForDrilldown] = useState<StaffWeeklyActivitySummary | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);

  // Reference now date (Aug 22, 2026 or current date)
  const now = useMemo(() => {
    if (auditLogs.length > 0) {
      const dates = auditLogs
        .map(l => new Date(l.timestamp).getTime())
        .filter(t => !isNaN(t));
      if (dates.length > 0) {
        return new Date(Math.max(...dates));
      }
    }
    return new Date();
  }, [auditLogs]);

  // Compute start and end dates based on selected period
  const dateRange = useMemo(() => {
    const end = new Date(now.getTime());
    end.setHours(23, 59, 59, 999);

    const start = new Date(now.getTime());
    start.setHours(0, 0, 0, 0);

    if (period === 'LAST_7_DAYS') {
      start.setDate(start.getDate() - 6);
    } else if (period === 'THIS_WEEK') {
      const day = start.getDay();
      const diff = (day === 0 ? -6 : 1) - day;
      start.setDate(start.getDate() + diff);
    } else if (period === 'PREVIOUS_WEEK') {
      const day = start.getDay();
      const diff = (day === 0 ? -6 : 1) - day - 7;
      start.setDate(start.getDate() + diff);
      end.setDate(start.getDate() + 6);
    } else {
      start.setFullYear(2020, 0, 1);
    }

    return { start, end };
  }, [period, now]);

  // Filter logs by date range
  const periodLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      if (isNaN(logDate.getTime())) return false;
      if (period === 'ALL_TIME') return true;
      return logDate >= dateRange.start && logDate <= dateRange.end;
    });
  }, [auditLogs, dateRange, period]);

  // Calculate 7-day array of dates (formatted strings YYYY-MM-DD)
  const last7DaysList = useMemo(() => {
    const days: { dateStr: string; displayLabel: string; shortWeekday: string; isToday: boolean }[] = [];
    const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime());
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayOfWeek = d.getDay();
      days.push({
        dateStr,
        displayLabel: `${d.getDate()}/${d.getMonth() + 1}`,
        shortWeekday: weekdays[dayOfWeek],
        isToday: i === 0,
      });
    }
    return days;
  }, [now]);

  // =========================================================================
  // CORE ENGINE: SUBSTANCE VS. SUPERFICIAL ENGAGEMENT EVALUATION
  // =========================================================================
  const staffActivitySummaries = useMemo<StaffWeeklyActivitySummary[]>(() => {
    const userLogsMap = new Map<string, AuditLog[]>();
    
    // Seed initial users if available
    users.forEach(u => {
      userLogsMap.set(u.id, []);
    });

    periodLogs.forEach(log => {
      const uid = log.userId || log.actorId || log.userName || 'Hệ thống';
      if (!userLogsMap.has(uid)) {
        userLogsMap.set(uid, []);
      }
      userLogsMap.get(uid)!.push(log);
    });

    const summaries: StaffWeeklyActivitySummary[] = [];

    userLogsMap.forEach((logs, uid) => {
      const matchedUser = users.find(u => u.id === uid || u.name === uid);
      const userName = matchedUser?.name || logs[0]?.userName || logs[0]?.actorName || uid;
      const userCode = matchedUser?.code || uid;
      const department: Department = matchedUser?.department || 'KE_TOAN_THUE';
      const position = matchedUser?.position || 'Chuyên viên nghiệp vụ';
      const avatar = matchedUser?.avatar;

      // Group logs by day to estimate working time (clustering consecutive actions within 30 mins)
      const logsByDate = new Map<string, AuditLog[]>();
      logs.forEach(l => {
        const dStr = l.timestamp.slice(0, 10);
        if (!logsByDate.has(dStr)) logsByDate.set(dStr, []);
        logsByDate.get(dStr)!.push(l);
      });

      let totalActiveMinutes = 0;
      let offHoursActionsCount = 0;
      const actionsByType: Record<string, number> = {};
      const dailyMinutes: Record<string, number> = {};
      const dailyActions: Record<string, number> = {};
      const touchedTasksSet = new Set<string>();

      let substantiveActionsCount = 0;
      let superficialActionsCount = 0;
      let tasksMovedForwardCount = 0;
      let filesUploadedCount = 0;
      let checklistItemsVerifiedCount = 0;

      logsByDate.forEach((dayLogs, dStr) => {
        dayLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        dailyActions[dStr] = dayLogs.length;

        let dayMinutes = 0;
        let sessionStartTime: number | null = null;
        let sessionLastTime: number | null = null;

        dayLogs.forEach(l => {
          const t = new Date(l.timestamp).getTime();
          const hour = new Date(l.timestamp).getHours();

          // Off-hours detection (after 21:00 or before 07:00)
          if (hour >= 21 || hour < 7) {
            offHoursActionsCount++;
          }

          const act = (l.action || 'UPDATE').toUpperCase();
          actionsByType[act] = (actionsByType[act] || 0) + 1;

          if (l.entityId) {
            touchedTasksSet.add(l.entityId);
          }

          // Tiêu chí 1: Phân loại hành động Thực chất vs. Hình thức / Thụ động
          const isSuperficial = 
            act === 'VIEW_ONLY' || 
            act === 'LOGIN' || 
            act === 'IDLE' || 
            act === 'PING' ||
            (l.description && (l.description.includes('Mở xem') || l.description.includes('thụ động')));

          const isSubstantive = 
            act === 'CREATE' || 
            act === 'UPDATE' || 
            act.includes('STATUS') || 
            act === 'APPROVE' || 
            act === 'UPLOAD' || 
            act.includes('CHECKLIST') || 
            act === 'TASK_COMPLETED';

          if (isSuperficial) {
            superficialActionsCount++;
          } else if (isSubstantive) {
            substantiveActionsCount++;
          } else {
            substantiveActionsCount++;
          }

          // Tiêu chí 2: Sản phẩm đầu ra cụ thể
          if (act.includes('STATUS') || act === 'APPROVE' || act === 'TASK_COMPLETED') {
            tasksMovedForwardCount++;
          }
          if (act === 'UPLOAD' || (l.description && (l.description.includes('Đính kèm') || l.description.includes('Tải lên')))) {
            filesUploadedCount++;
          }
          if (act.includes('CHECKLIST') || (l.description && l.description.includes('Checklist'))) {
            checklistItemsVerifiedCount++;
          }

          if (sessionStartTime === null) {
            sessionStartTime = t;
            sessionLastTime = t;
            dayMinutes += 15;
          } else {
            const gapMinutes = (t - (sessionLastTime || t)) / (1000 * 60);
            if (gapMinutes <= 30) {
              dayMinutes += Math.max(5, gapMinutes);
              sessionLastTime = t;
            } else {
              dayMinutes += 15;
              sessionStartTime = t;
              sessionLastTime = t;
            }
          }
        });

        dayMinutes = Math.min(dayMinutes, 720);
        dailyMinutes[dStr] = Math.round(dayMinutes);
        totalActiveMinutes += Math.round(dayMinutes);
      });

      const sortedLogs = [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const lastActiveTimestamp = sortedLogs[0]?.timestamp;

      const hours = Math.floor(totalActiveMinutes / 60);
      const mins = totalActiveMinutes % 60;
      const totalActiveHoursFormatted = `${hours}h ${mins}m`;

      const totalRecordedActions = logs.length;
      const totalHoursNumeric = Math.max(0.1, totalActiveMinutes / 60);
      const actionDensityPerHour = Number((substantiveActionsCount / totalHoursNumeric).toFixed(1));

      // Tỷ lệ thực chất (%)
      const substanceRatioPercent = totalRecordedActions > 0 
        ? Math.round((substantiveActionsCount / totalRecordedActions) * 100)
        : 0;

      // =====================================================================
      // CÔNG THỨC TÍNH ĐIỂM THỰC CHẤT (SUBSTANCE SCORE 0 - 100)
      // 1. Tỷ lệ thao tác thực chất (Trọng số 40%)
      // 2. Chuyển biến hồ sơ & kết quả đầu ra (Trọng số 30%)
      // 3. Mật độ thao tác hữu ích theo giờ (Trọng số 20%)
      // 4. Nhịp độ tham gia (Trọng số 10%)
      // =====================================================================
      let substanceScore = 0;
      const detectionDetails: string[] = [];

      if (totalRecordedActions === 0 || totalActiveMinutes < 30) {
        substanceScore = 0;
        detectionDetails.push('Không có tương tác nào đáng kể trong suốt tuần (<30 phút online).');
      } else {
        // Factor 1: Substance Action Ratio (0 - 40 pts)
        const f1 = (substanceRatioPercent / 100) * 40;

        // Factor 2: Concrete Deliverables (0 - 30 pts)
        const outputPoints = Math.min(30, (tasksMovedForwardCount * 10) + (filesUploadedCount * 8) + (checklistItemsVerifiedCount * 6) + (touchedTasksSet.size * 4));
        
        // Factor 3: Density per hour (0 - 20 pts)
        const densityPoints = Math.min(20, (actionDensityPerHour / 5) * 20);

        // Factor 4: Activity Volume (0 - 10 pts)
        const volumePoints = Math.min(10, (substantiveActionsCount / 8) * 10);

        substanceScore = Math.round(Math.min(100, f1 + outputPoints + densityPoints + volumePoints));
      }

      // =====================================================================
      // PHÂN LOẠI HÀNH VI (BEHAVIORAL CLASSIFICATION & WARNING REASONS)
      // =====================================================================
      let behaviorType: SubstanceBehaviorType = 'NORMAL_PRODUCTIVE';
      let warningStatus: 'NORMAL' | 'LOW_ENGAGEMENT' | 'OFF_HOURS_OVERTIME' | 'HIGH_PRODUCTIVITY' | 'SUPERFICIAL_ACTIVITY' = 'NORMAL';
      let warningMessage = 'Hoạt động thực chất, tuân thủ đúng quy trình';

      if (totalRecordedActions === 0 || totalActiveMinutes < 60) {
        behaviorType = 'DORMANT_INACTIVE';
        warningStatus = 'LOW_ENGAGEMENT';
        warningMessage = 'Ít đăng nhập hoặc bỏ bê hệ thống (< 1 giờ / tuần)';
        detectionDetails.push('Thời gian online quá thấp, cần kiểm tra phân công khối lượng công việc.');
      } else if (
        (superficialActionsCount > 0 && substantiveActionsCount <= 1) || 
        (totalActiveMinutes >= 120 && tasksMovedForwardCount === 0 && filesUploadedCount === 0 && checklistItemsVerifiedCount === 0) ||
        (substanceRatioPercent < 40 && totalRecordedActions >= 2) ||
        (actionDensityPerHour < 0.5 && totalActiveMinutes >= 180)
      ) {
        // CẢNH BÁO: NGHI VẤN VÀO PHẦN MỀM CHO CÓ / TREO MÁY
        behaviorType = 'SUPERFICIAL_SUSPECTED';
        warningStatus = 'SUPERFICIAL_ACTIVITY';
        warningMessage = 'Cảnh báo: Có dấu hiệu vào phần mềm hình thức / Treo tài khoản';

        if (superficialActionsCount > substantiveActionsCount) {
          detectionDetails.push(`Phát hiện ${superficialActionsCount} lượt chỉ mở xem hoặc click chuyển trang mà không hạch toán/đính kèm file.`);
        }
        if (tasksMovedForwardCount === 0 && filesUploadedCount === 0) {
          detectionDetails.push('Đăng nhập vào hệ thống nhưng không tạo ra bất kỳ sản phẩm đầu ra nào (0 file đính kèm, 0 hồ sơ chuyển trạng thái).');
        }
        if (actionDensityPerHour < 0.5) {
          detectionDetails.push(`Mật độ thao tác cực loãng (${actionDensityPerHour} thao tác/giờ online), dấu hiệu mở tab rồi để đó.`);
        }
      } else if (offHoursActionsCount >= 2) {
        behaviorType = 'OFF_HOURS_OVERTIME';
        warningStatus = 'OFF_HOURS_OVERTIME';
        warningMessage = `Thao tác ngoài giờ hành chính (${offHoursActionsCount} lượt sau 21h00)`;
        detectionDetails.push(`Đã ghi nhận ${offHoursActionsCount} lượt thao tác vào ban đêm.`);
      } else if (substanceScore >= 80 || (substantiveActionsCount >= 6 && touchedTasksSet.size >= 2)) {
        behaviorType = 'HIGH_SUBSTANCE';
        warningStatus = 'HIGH_PRODUCTIVITY';
        warningMessage = 'Năng suất cao: Thao tác thực chất & hoàn thành nhiều hồ sơ';
        detectionDetails.push(`Đã xử lý ${touchedTasksSet.size} hồ sơ, tạo ${substantiveActionsCount} thao tác nghiệp vụ có giá trị cao.`);
      } else {
        behaviorType = 'NORMAL_PRODUCTIVE';
        warningStatus = 'NORMAL';
        warningMessage = 'Hoạt động ổn định trong định mức';
        detectionDetails.push('Thao tác nghiệp vụ phân bổ đều, tuân thủ đúng tiến độ kiểm soát.');
      }

      summaries.push({
        userId: uid,
        userName,
        userCode,
        department,
        position,
        avatar,
        totalActiveMinutes,
        totalActiveHoursFormatted,
        totalActionsCount: logs.length,
        substantiveActionsCount,
        superficialActionsCount,
        substanceRatioPercent,
        substanceScore,
        behaviorType,
        totalTasksTouchedCount: touchedTasksSet.size,
        tasksMovedForwardCount,
        filesUploadedCount,
        checklistItemsVerifiedCount,
        actionDensityPerHour,
        lastActiveTimestamp,
        offHoursActionsCount,
        actionsByType,
        dailyMinutes,
        dailyActions,
        warningStatus,
        warningMessage,
        detectionDetails,
      });
    });

    // Sort: Superficial and High Productivity to the top for easy manager review
    return summaries.sort((a, b) => {
      if (a.behaviorType === 'SUPERFICIAL_SUSPECTED' && b.behaviorType !== 'SUPERFICIAL_SUSPECTED') return -1;
      if (b.behaviorType === 'SUPERFICIAL_SUSPECTED' && a.behaviorType !== 'SUPERFICIAL_SUSPECTED') return 1;
      return b.substantiveActionsCount - a.substantiveActionsCount;
    });
  }, [periodLogs, users]);

  // Overall Weekly Executive Metrics
  const weeklyMetrics = useMemo(() => {
    const totalMinutes = staffActivitySummaries.reduce((acc, s) => acc + s.totalActiveMinutes, 0);
    const totalHours = (totalMinutes / 60).toFixed(1);
    const totalActions = periodLogs.length;
    
    const uniqueTasks = new Set<string>();
    periodLogs.forEach(l => {
      if (l.entityId) uniqueTasks.add(l.entityId);
    });

    const activeStaffCount = staffActivitySummaries.filter(s => s.totalActionsCount > 0).length;
    const offHoursActionsTotal = staffActivitySummaries.reduce((acc, s) => acc + s.offHoursActionsCount, 0);

    const superficialStaff = staffActivitySummaries.filter(s => s.behaviorType === 'SUPERFICIAL_SUSPECTED');
    const highSubstanceStaff = staffActivitySummaries.filter(s => s.behaviorType === 'HIGH_SUBSTANCE');
    const dormantStaff = staffActivitySummaries.filter(s => s.behaviorType === 'DORMANT_INACTIVE' && s.userId.startsWith('USR-'));

    // Company-wide average substance score
    const totalScore = staffActivitySummaries.reduce((acc, s) => acc + s.substanceScore, 0);
    const avgSubstanceScore = staffActivitySummaries.length > 0 
      ? Math.round(totalScore / staffActivitySummaries.length) 
      : 0;

    return {
      totalMinutes,
      totalHours,
      totalActions,
      uniqueTasksCount: uniqueTasks.size,
      activeStaffCount,
      totalStaffCount: users.length || staffActivitySummaries.length,
      offHoursActionsTotal,
      superficialCount: superficialStaff.length,
      highSubstanceCount: highSubstanceStaff.length,
      dormantCount: dormantStaff.length,
      avgSubstanceScore,
    };
  }, [staffActivitySummaries, periodLogs, users]);

  // Daily Chart Aggregation (Last 7 Days)
  const dailyChartData = useMemo(() => {
    return last7DaysList.map(day => {
      let minutes = 0;
      let substantiveActions = 0;
      let superficialActions = 0;
      let totalActions = 0;
      const activeUsers = new Set<string>();

      periodLogs.forEach(log => {
        if (log.timestamp.slice(0, 10) === day.dateStr) {
          totalActions++;
          if (log.userId) activeUsers.add(log.userId);

          const act = (log.action || '').toUpperCase();
          if (act === 'VIEW_ONLY' || act === 'LOGIN' || act === 'IDLE') {
            superficialActions++;
          } else {
            substantiveActions++;
          }
        }
      });

      staffActivitySummaries.forEach(s => {
        minutes += s.dailyMinutes[day.dateStr] || 0;
      });

      const hours = Number((minutes / 60).toFixed(1));

      return {
        ...day,
        actions: totalActions,
        substantiveActions,
        superficialActions,
        minutes,
        hours,
        activeUsersCount: activeUsers.size,
      };
    });
  }, [last7DaysList, periodLogs, staffActivitySummaries]);

  // Weekly Warnings & Anomalies Generator
  const weeklyWarnings = useMemo<WeeklyWarningItem[]>(() => {
    const list: WeeklyWarningItem[] = [];

    // 1. CẢNH BÁO ĐẶC BIỆT: NGHI VẤN VÀO PHẦN MỀM CHO CÓ / TREO MÁY
    const superficialStaff = staffActivitySummaries.filter(s => s.behaviorType === 'SUPERFICIAL_SUSPECTED');
    if (superficialStaff.length > 0) {
      superficialStaff.forEach(s => {
        list.push({
          id: `warn-superficial-${s.userId}`,
          type: 'CRITICAL',
          title: `Phát hiện nghi vấn vào phần mềm cho có: ${s.userName} (${s.userCode})`,
          description: `Ghi nhận ${s.totalActiveHoursFormatted} thời gian mở hệ thống nhưng chỉ có ${s.substantiveActionsCount} thao tác thực chất, 0 hồ sơ hoàn thành và ${s.superficialActionsCount} lượt xem thụ động. Điểm thực chất chỉ đạt ${s.substanceScore}/100. Đề xuất Trưởng phòng kiểm tra trực tiếp nhật ký làm việc.`,
          targetUser: s.userName,
          targetDept: s.department,
        });
      });
    }

    // 2. Cảnh báo nhân sự bỏ bê / không tương tác
    const dormantStaff = staffActivitySummaries.filter(s => s.behaviorType === 'DORMANT_INACTIVE' && s.userId.startsWith('USR-'));
    if (dormantStaff.length > 0) {
      list.push({
        id: 'warn-dormant-staff',
        type: 'WARNING',
        title: `Cảnh báo ${dormantStaff.length} nhân sự chưa phát sinh hoạt động trong tuần`,
        description: `Các nhân sự (${dormantStaff.map(s => s.userName).slice(0, 3).join(', ')}${dormantStaff.length > 3 ? '...' : ''}) có dưới 1 giờ hoạt động ghi nhận trên hệ thống. Cần đốc thúc cập nhật tờ khai & sổ sách.`,
        relatedCount: dormantStaff.length,
      });
    }

    // 3. Cảnh báo thao tác ngoài giờ
    const offHoursStaff = staffActivitySummaries.filter(s => s.offHoursActionsCount > 0);
    if (offHoursStaff.length > 0) {
      const totalOff = offHoursStaff.reduce((a, b) => a + b.offHoursActionsCount, 0);
      list.push({
        id: 'warn-off-hours',
        type: 'NOTICE',
        title: `Phát hiện ${totalOff} lượt thao tác ngoài giờ hành chính (>21:00)`,
        description: `Ghi nhận thao tác ngoài giờ từ ${offHoursStaff.map(s => `${s.userName} (${s.offHoursActionsCount} lượt)`).join(', ')}. Đề xuất Ban Giám Đốc rà soát để cân bằng tải và tính phụ cấp ngoài giờ.`,
        relatedCount: totalOff,
      });
    }

    // 4. Vinh danh nhân sự làm việc thực chất & năng suất cao
    const topPerformers = staffActivitySummaries.filter(s => s.behaviorType === 'HIGH_SUBSTANCE');
    if (topPerformers.length > 0) {
      const top1 = topPerformers[0];
      list.push({
        id: 'praise-top',
        type: 'PRAISE',
        title: `Ghi nhận hiệu quả thực chất: ${top1.userName} dẫn đầu năng suất tuần`,
        description: `Đạt Điểm Thực Chất ${top1.substanceScore}/100 với ${top1.substantiveActionsCount} thao tác tạo giá trị, trực tiếp xử lý ${top1.totalTasksTouchedCount} hồ sơ và hoàn thành ${top1.tasksMovedForwardCount} công việc.`,
        targetUser: top1.userName,
      });
    }

    return list;
  }, [staffActivitySummaries]);

  // Filtered Staff for Table
  const filteredStaffSummaries = useMemo(() => {
    return staffActivitySummaries.filter(staff => {
      // Behavior filter
      if (filterBehavior !== 'ALL') {
        if (filterBehavior === 'SUPERFICIAL' && staff.behaviorType !== 'SUPERFICIAL_SUSPECTED') return false;
        if (filterBehavior === 'HIGH' && staff.behaviorType !== 'HIGH_SUBSTANCE') return false;
        if (filterBehavior === 'NORMAL' && staff.behaviorType !== 'NORMAL_PRODUCTIVE') return false;
        if (filterBehavior === 'DORMANT' && staff.behaviorType !== 'DORMANT_INACTIVE') return false;
        if (filterBehavior === 'OFF_HOURS' && staff.offHoursActionsCount === 0) return false;
      }

      // Department filter
      if (filterDept !== 'ALL' && staff.department !== filterDept) return false;

      // Search query
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        return (
          staff.userName.toLowerCase().includes(term) ||
          staff.userCode.toLowerCase().includes(term) ||
          staff.position.toLowerCase().includes(term)
        );
      }

      return true;
    });
  }, [staffActivitySummaries, filterBehavior, filterDept, searchTerm]);

  // Filtered Logs for Raw Ledger Table
  const filteredLogs = useMemo(() => {
    return periodLogs.filter(log => {
      if (filterAction !== 'ALL' && log.action !== filterAction) return false;

      if (selectedStaffFilter !== 'ALL') {
        const uid = log.userId || log.actorId || log.userName;
        if (uid !== selectedStaffFilter) return false;
      }

      if (filterDept !== 'ALL') {
        const matchedUser = users.find(u => u.id === log.userId || u.name === log.userName);
        if (matchedUser && matchedUser.department !== filterDept) return false;
      }

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const actorName = (log.actorName || log.userName || '').toLowerCase();
        const detailText = (log.details || log.description || '').toLowerCase();
        const entityId = (log.entityId || '').toLowerCase();
        const entityTitle = (log.entityTitle || '').toLowerCase();

        return (
          actorName.includes(term) ||
          detailText.includes(term) ||
          entityId.includes(term) ||
          entityTitle.includes(term)
        );
      }

      return true;
    });
  }, [periodLogs, filterAction, selectedStaffFilter, filterDept, searchTerm, users]);

  // Export Weekly Audit & Substance Report
  const handleExportWeeklyReport = () => {
    try {
      const exportData = {
        period,
        generatedAt: new Date().toISOString(),
        overview: weeklyMetrics,
        criteriaFramework: {
          metric1: 'Tỷ lệ Thao tác Tạo Giá Trị Nghiệp Vụ (Substantive Value-Add Ratio - SVR)',
          metric2: 'Chỉ Số Chuyển Biến Hồ Sơ & Kết Quả Đầu Ra (Task Progression & Output Index - TPI)',
          metric3: 'Mật Độ Thao Tác Nghiệp Vụ Theo Giờ (Action Density per Hour - ADH)',
          metric4: 'Tỷ Lệ Hoàn Thành Checklist Soát Xét Bắt Buộc',
        },
        staffPerformance: staffActivitySummaries.map(s => ({
          userId: s.userId,
          userName: s.userName,
          userCode: s.userCode,
          position: s.position,
          department: s.department,
          totalActiveHours: s.totalActiveHoursFormatted,
          substanceScore: `${s.substanceScore}/100`,
          substanceRatio: `${s.substanceRatioPercent}%`,
          behaviorClassification: s.behaviorType,
          substantiveActions: s.substantiveActionsCount,
          superficialActions: s.superficialActionsCount,
          tasksTouched: s.totalTasksTouchedCount,
          tasksMovedForward: s.tasksMovedForwardCount,
          filesUploaded: s.filesUploadedCount,
          checklistVerified: s.checklistItemsVerifiedCount,
          actionDensityPerHour: s.actionDensityPerHour,
          offHoursActions: s.offHoursActionsCount,
          warningStatus: s.warningStatus,
          warningMessage: s.warningMessage,
        })),
        auditLogs: periodLogs.slice(0, 100),
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TaxCore_Audit_Substance_Report_${period}_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setCopiedNotification('Đã xuất toàn bộ Báo cáo Kiểm toán Thực chất & Hoạt động tuần thành công!');
      setTimeout(() => setCopiedNotification(null), 3000);
    } catch {
      setCopiedNotification('Lỗi khi xuất báo cáo.');
    }
  };

  return (
    <div className="space-y-4 pb-8">
      
      {/* Toast Notification */}
      {copiedNotification && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center space-x-2 shadow-xs transition-all">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* Header & Controls Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Kiểm Soát Thực Chất & Nhật Ký Hoạt Động (Substantive Audit Trail)
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  AI Anti-Ghosting Framework
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Period Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          
          <button
            onClick={() => setShowCriteriaModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-xl border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer shadow-xs"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Tiêu Chí Nhận Diện</span>
          </button>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setPeriod('LAST_7_DAYS')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                period === 'LAST_7_DAYS'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              7 Ngày Qua
            </button>
            <button
              onClick={() => setPeriod('THIS_WEEK')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                period === 'THIS_WEEK'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tuần Này
            </button>
            <button
              onClick={() => setPeriod('PREVIOUS_WEEK')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                period === 'PREVIOUS_WEEK'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tuần Trước
            </button>
            <button
              onClick={() => setPeriod('ALL_TIME')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                period === 'ALL_TIME'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tất Cả
            </button>
          </div>

          <button
            onClick={handleExportWeeklyReport}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Xuất Báo Cáo</span>
          </button>

        </div>
      </div>

      {/* 4 Executive Metric Cards for Substance & Participation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Metric 1: Overall Substance Health Score */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Chỉ Số Thực Chất Hệ Thống</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-baseline space-x-1.5">
              <span>{weeklyMetrics.avgSubstanceScore}</span>
              <span className="text-sm font-semibold text-slate-400">/ 100 điểm</span>
            </div>
            <div className="flex items-center space-x-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
              <Sparkles className="h-3 w-3" />
              <span>{weeklyMetrics.highSubstanceCount} nhân sự đạt xuất sắc • {weeklyMetrics.totalHours}h tổng giờ</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Superficial Activity Warning Alert Card */}
        <div className={`p-4 rounded-2xl border shadow-xs flex flex-col justify-between transition-all ${
          weeklyMetrics.superficialCount > 0
            ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Nghi Vấn Vào Cho Có / Treo Máy</span>
            <div className={`p-2 rounded-xl ${
              weeklyMetrics.superficialCount > 0 
                ? 'bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}>
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className={`text-xl sm:text-2xl font-bold ${
              weeklyMetrics.superficialCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
            }`}>
              {weeklyMetrics.superficialCount} <span className="text-sm font-semibold text-slate-400">nhân sự</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              {weeklyMetrics.superficialCount > 0 ? 'Có giờ online nhưng thiếu sản phẩm đầu ra' : 'Không phát hiện hiện tượng treo máy'}
            </div>
          </div>
        </div>

        {/* Metric 3: Substantive Operations Output */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Thao Tác Tạo Giá Trị Nghiệp Vụ</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {periodLogs.filter(l => !['VIEW_ONLY', 'LOGIN', 'IDLE'].includes((l.action || '').toUpperCase())).length} <span className="text-sm font-semibold text-slate-400">/ {weeklyMetrics.totalActions} lượt</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              Tác động trực tiếp lên <strong>{weeklyMetrics.uniqueTasksCount}</strong> hồ sơ kế toán/thuế
            </div>
          </div>
        </div>

        {/* Metric 4: Active Rate vs. Dormant */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Tỷ Lệ Tương Tác Đều Đặn</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {weeklyMetrics.activeStaffCount}/{weeklyMetrics.totalStaffCount} <span className="text-sm font-semibold text-slate-400">nhân sự</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              {weeklyMetrics.dormantCount > 0 ? `${weeklyMetrics.dormantCount} nhân sự bỏ bê không tương tác` : '100% nhân sự duy trì tiến độ'}
            </div>
          </div>
        </div>

      </div>

      {/* Sub Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-1 pb-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('DASHBOARD')}
          className={`flex items-center space-x-1.5 py-1.5 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
            activeTab === 'DASHBOARD'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <BarChartIcon className="h-3.5 w-3.5" />
          <span>1. Biểu Đồ 7 Ngày & Cơ Cấu Thực Chất</span>
        </button>

        <button
          onClick={() => setActiveTab('STAFF_STATS')}
          className={`flex items-center space-x-1.5 py-1.5 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
            activeTab === 'STAFF_STATS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>2. Bảng Đánh Giá Thực Chất Nhân Sự ({staffActivitySummaries.length})</span>
          {weeklyMetrics.superficialCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
              {weeklyMetrics.superficialCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('CRITERIA_GUIDE')}
          className={`flex items-center space-x-1.5 py-1.5 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
            activeTab === 'CRITERIA_GUIDE'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <FileCheck className="h-3.5 w-3.5" />
          <span>3. Quy Chuẩn & Ma Trận 5 Tiêu Chí Nhận Diện</span>
        </button>

        <button
          onClick={() => setActiveTab('ALERTS')}
          className={`flex items-center space-x-1.5 py-1.5 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
            activeTab === 'ALERTS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <AlertCircle className="h-3.5 w-3.5" />
          <span>4. Trung Tâm Cảnh Báo Bất Thường ({weeklyWarnings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('RAW_LOGS')}
          className={`flex items-center space-x-1.5 py-1.5 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
            activeTab === 'RAW_LOGS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <History className="h-3.5 w-3.5" />
          <span>5. Lịch Sử Truy Vết Bất Biến ({filteredLogs.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: 7-DAY DASHBOARD & SUBSTANCE BREAKDOWN */}
      {/* ========================================================================= */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-4">
          {/* 7-Day Chart & Daily Activity Matrix */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <Activity className="h-4 w-4 text-indigo-600" />
                  <span>Biểu Đồ Khối Lượng Thao Tác Thực Chất vs. Thụ Động Theo Ngày</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Phân tích mức độ tạo ra giá trị nghiệp vụ thực tế qua từng ngày trong 1 tuần
                </p>
              </div>

              <div className="flex items-center space-x-3 text-[11px]">
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>
                  <span className="text-slate-600 dark:text-slate-400 font-semibold">Thực chất (Hạch toán/Upload/Ký)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded bg-amber-400 inline-block"></span>
                  <span className="text-slate-600 dark:text-slate-400 font-semibold">Thụ động (Chỉ xem/Treo)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded bg-indigo-600 inline-block"></span>
                  <span className="text-slate-600 dark:text-slate-400 font-semibold">Tổng giờ (h)</span>
                </div>
              </div>
            </div>

            {/* Daily Visual Bars (7 Days) */}
            <div className="grid grid-cols-7 gap-2 pt-2">
              {dailyChartData.map((d) => {
                const maxActions = Math.max(...dailyChartData.map(x => x.actions), 10);
                const subHeight = Math.min(100, Math.round((d.substantiveActions / maxActions) * 100));
                const supHeight = Math.min(100, Math.round((d.superficialActions / maxActions) * 100));

                return (
                  <div 
                    key={d.dateStr}
                    className={`p-2.5 rounded-2xl flex flex-col justify-between items-center text-center transition-all ${
                      d.isToday
                        ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/80 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    <div className="space-y-0.5 mb-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        d.isToday ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}>
                        {d.shortWeekday}
                      </span>
                      <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {d.displayLabel}
                      </div>
                    </div>

                    {/* Stacked Bars */}
                    <div className="h-28 w-full flex items-end justify-center space-x-1 px-1 py-1">
                      {/* Substantive bar */}
                      <div className="flex-1 flex flex-col items-center justify-end h-full">
                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                          {d.substantiveActions}
                        </span>
                        <div 
                          style={{ height: `${Math.max(8, subHeight)}%` }}
                          className="w-full rounded-t-md bg-emerald-500 dark:bg-emerald-400 transition-all"
                        ></div>
                      </div>

                      {/* Superficial bar */}
                      <div className="flex-1 flex flex-col items-center justify-end h-full">
                        <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 mb-1">
                          {d.superficialActions}
                        </span>
                        <div 
                          style={{ height: `${Math.max(4, supHeight)}%` }}
                          className="w-full rounded-t-md bg-amber-400 dark:bg-amber-500 transition-all"
                        ></div>
                      </div>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-slate-200 dark:border-slate-800 w-full text-[10px] text-slate-500">
                      <strong>{d.hours}h</strong> • {d.activeUsersCount} online
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* 2-Columns: Concrete Output Stats & Action Type Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left: Concrete Business Deliverables in 1 Week */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-1.5">
                <FileCheck className="h-4 w-4 text-emerald-600" />
                <span>Sản Phẩm Đầu Ra Nghiệp Vụ Cụ Thể Trong Tuần</span>
              </h4>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800">
                  <div className="text-slate-500 text-[11px]">Hồ sơ có chuyển biến tiến độ</div>
                  <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                    {staffActivitySummaries.reduce((a, b) => a + b.tasksMovedForwardCount, 0)} hồ sơ
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800">
                  <div className="text-slate-500 text-[11px]">Chứng từ / File XML tải lên</div>
                  <div className="text-lg font-bold text-teal-600 dark:text-teal-400 mt-1">
                    {staffActivitySummaries.reduce((a, b) => a + b.filesUploadedCount, 0)} tệp tin
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800">
                  <div className="text-slate-500 text-[11px]">Mục Checklist đã soát xét</div>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {staffActivitySummaries.reduce((a, b) => a + b.checklistItemsVerifiedCount, 0)} bước
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800">
                  <div className="text-slate-500 text-[11px]">Lượt Ký số CKS / Duyệt chi</div>
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {periodLogs.filter(l => l.action === 'APPROVE').length} lần ký
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Behavioral Distribution of Personnel */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-1.5">
                <Users className="h-4 w-4 text-indigo-600" />
                <span>Phân Bổ Phân Loại Động Thái Làm Việc</span>
              </h4>

              <div className="space-y-2 text-xs">
                {[
                  { 
                    label: '💎 Thực chất & Năng suất cao', 
                    count: staffActivitySummaries.filter(s => s.behaviorType === 'HIGH_SUBSTANCE').length, 
                    color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' 
                  },
                  { 
                    label: '🟢 Thực chất & Ổn định', 
                    count: staffActivitySummaries.filter(s => s.behaviorType === 'NORMAL_PRODUCTIVE').length, 
                    color: 'text-blue-700 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' 
                  },
                  { 
                    label: '⚠️ Nghi vấn vào cho có / Treo máy', 
                    count: staffActivitySummaries.filter(s => s.behaviorType === 'SUPERFICIAL_SUSPECTED').length, 
                    color: 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800' 
                  },
                  { 
                    label: '🛑 Không hoạt động / Bỏ bê', 
                    count: staffActivitySummaries.filter(s => s.behaviorType === 'DORMANT_INACTIVE').length, 
                    color: 'text-slate-700 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' 
                  },
                ].map((item, idx) => (
                  <div key={idx} className={`p-2.5 rounded-xl border flex items-center justify-between font-semibold ${item.color}`}>
                    <span>{item.label}</span>
                    <span className="text-sm font-bold">{item.count} nhân sự</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STAFF DETAILED SUBSTANCE AUDIT LEADERBOARD */}
      {/* ========================================================================= */}
      {activeTab === 'STAFF_STATS' && (
        <div className="space-y-3">
          
          {/* Controls Bar: Search & Behavior Filter */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm nhân sự theo tên, mã nhân viên, chức vụ..."
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden"
              />
            </div>

            <select
              value={filterBehavior}
              onChange={(e) => setFilterBehavior(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400"
            >
              <option value="ALL">Tất cả phân loại hành vi</option>
              <option value="SUPERFICIAL">⚠️ Nghi vấn vào cho có ({weeklyMetrics.superficialCount})</option>
              <option value="HIGH">💎 Thực chất cao ({weeklyMetrics.highSubstanceCount})</option>
              <option value="NORMAL">🟢 Hoạt động bình thường</option>
              <option value="DORMANT">🛑 Không hoạt động</option>
              <option value="OFF_HOURS">🌙 Làm ngoài giờ</option>
            </select>

            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">Tất cả phòng ban</option>
              <option value="KE_TOAN_THUE">Kế toán - Thuế</option>
              <option value="HANH_CHINH_NHAN_SU">HCNS - Pháp lý</option>
              <option value="KINH_DOANH_CSKH">Kinh doanh</option>
              <option value="BAN_GIAM_DOC">Ban Giám Đốc</option>
            </select>
          </div>

          {/* Staff Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold uppercase tracking-wider text-[10.5px]">
                    <th className="py-3 px-4">Nhân sự & Chức danh</th>
                    <th className="py-3 px-3 text-center">Giờ online tuần</th>
                    <th className="py-3 px-3 text-center">Điểm Thực Chất</th>
                    <th className="py-3 px-3 text-center">Thao tác Thực / Thụ động</th>
                    <th className="py-3 px-3 text-center">Kết quả đầu ra (Files/Checklist/Tasks)</th>
                    <th className="py-3 px-3 text-center">Mật độ/giờ</th>
                    <th className="py-3 px-3 text-center">Phân loại & Cảnh báo</th>
                    <th className="py-3 px-4 text-center">Minh chứng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStaffSummaries.map((staff) => {
                    return (
                      <tr 
                        key={staff.userId} 
                        className={`transition-colors ${
                          staff.behaviorType === 'SUPERFICIAL_SUSPECTED'
                            ? 'bg-rose-50/30 dark:bg-rose-950/20 hover:bg-rose-50/60 dark:hover:bg-rose-950/40'
                            : 'hover:bg-slate-50/80 dark:hover:bg-slate-850/50'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2.5">
                            <div className={`w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs ${
                              staff.behaviorType === 'SUPERFICIAL_SUSPECTED' 
                                ? 'bg-rose-600' 
                                : staff.behaviorType === 'HIGH_SUBSTANCE' 
                                ? 'bg-emerald-600' 
                                : 'bg-indigo-600'
                            }`}>
                              {staff.userName.split(' ').map(n => n[0]).slice(-2).join('')}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center space-x-1">
                                <span>{staff.userName}</span>
                                {staff.behaviorType === 'SUPERFICIAL_SUSPECTED' && (
                                  <span className="text-[10px] text-rose-600 font-bold">⚠️</span>
                                )}
                              </div>
                              <div className="text-[10.5px] text-slate-500">
                                {staff.position} ({staff.userCode})
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                            {staff.totalActiveHoursFormatted}
                          </span>
                        </td>

                        {/* Điểm thực chất Score Bar */}
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex flex-col items-center">
                            <div className="flex items-center space-x-1">
                              <span className={`text-xs font-bold ${
                                staff.substanceScore >= 80 
                                  ? 'text-emerald-600 dark:text-emerald-400' 
                                  : staff.substanceScore >= 50 
                                  ? 'text-blue-600 dark:text-blue-400' 
                                  : 'text-rose-600 dark:text-rose-400'
                              }`}>
                                {staff.substanceScore}
                              </span>
                              <span className="text-[10px] text-slate-400">/100</span>
                            </div>
                            <div className="w-16 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-1 overflow-hidden">
                              <div 
                                className={`h-full ${
                                  staff.substanceScore >= 80 
                                    ? 'bg-emerald-500' 
                                    : staff.substanceScore >= 50 
                                    ? 'bg-blue-500' 
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${staff.substanceScore}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>

                        {/* Thao tác Thực / Thụ động */}
                        <td className="py-3 px-3 text-center">
                          <div className="text-xs">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {staff.substantiveActionsCount} thực
                            </span>
                            <span className="text-slate-400 mx-1">/</span>
                            <span className={`font-semibold ${staff.superficialActionsCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
                              {staff.superficialActionsCount} thụ động
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            {staff.substanceRatioPercent}% thực chất
                          </div>
                        </td>

                        {/* Deliverables / Outputs */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center space-x-1.5 text-[11px] font-semibold">
                            <span title="Hồ sơ chuyển tiến độ" className="text-indigo-600 dark:text-indigo-400 font-bold">
                              {staff.tasksMovedForwardCount} tasks
                            </span>
                            <span className="text-slate-300">•</span>
                            <span title="File đính kèm/XML" className="text-teal-600 dark:text-teal-400 font-bold">
                              {staff.filesUploadedCount} files
                            </span>
                            <span className="text-slate-300">•</span>
                            <span title="Checklist kiểm soát" className="text-emerald-600 dark:text-emerald-400 font-bold">
                              {staff.checklistItemsVerifiedCount} checks
                            </span>
                          </div>
                        </td>

                        {/* Action Density */}
                        <td className="py-3 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                          <span className={staff.actionDensityPerHour < 0.5 && staff.totalActiveMinutes > 60 ? 'text-rose-600 font-bold' : ''}>
                            {staff.actionDensityPerHour}/h
                          </span>
                        </td>

                        {/* Behavior Badge */}
                        <td className="py-3 px-3 text-center">
                          {staff.behaviorType === 'SUPERFICIAL_SUSPECTED' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800 inline-flex items-center space-x-1">
                              <AlertTriangle className="h-3 w-3 shrink-0" />
                              <span>Nghi vấn vào cho có</span>
                            </span>
                          )}
                          {staff.behaviorType === 'HIGH_SUBSTANCE' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 inline-flex items-center space-x-1">
                              <Sparkles className="h-3 w-3 shrink-0" />
                              <span>Thực chất cao</span>
                            </span>
                          )}
                          {staff.behaviorType === 'NORMAL_PRODUCTIVE' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              ✓ Ổn định
                            </span>
                          )}
                          {staff.behaviorType === 'DORMANT_INACTIVE' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                              🛑 Không tương tác
                            </span>
                          )}
                          {staff.behaviorType === 'OFF_HOURS_OVERTIME' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              🌙 Ngoài giờ
                            </span>
                          )}
                        </td>

                        {/* Audit Drilldown Button */}
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setSelectedStaffForDrilldown(staff)}
                            className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300 text-[11px] font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer inline-flex items-center space-x-1"
                          >
                            <Eye className="h-3 w-3" />
                            <span>Soi Chi Tiết</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CRITERIA RULEBOOK & METHODOLOGY (MA TRẬN TIÊU CHÍ NHẬN DIỆN) */}
      {/* ========================================================================= */}
      {activeTab === 'CRITERIA_GUIDE' && (
        <div className="space-y-4">
          
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-indigo-600 text-white">
                <FileCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Ma Trận & 5 Tiêu Chí Nhận Diện "Làm Việc Thực Chất" vs. "Vào Cho Có / Treo Máy"
                </h3>
                <p className="text-xs text-slate-500">
                  Hệ thống kiểm toán tự động của TaxCore áp dụng tiêu chuẩn kép giữa thời gian truy cập và khối lượng dữ liệu nghiệp vụ sinh ra
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Criteria 1 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">1</span>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Tỷ Lệ Thao Tác Tạo Giá Trị Nghiệp Vụ (Substantive Value-Add Ratio - SVR)
                </h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Đếm số thao tác làm thay đổi dữ liệu (hạch toán, cập nhật sổ cái, ký số, tải lên tờ khai, tick checklist) so với thao tác thụ động (chỉ mở xem, login rồi để nguyên trang).
              </p>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 text-[11px] space-y-1">
                <div className="text-emerald-600 dark:text-emerald-400 font-bold">🟢 Thực chất: Tỷ lệ SVR ≥ 60%</div>
                <div className="text-rose-600 dark:text-rose-400 font-bold">🔴 Nghi vấn vào cho có: SVR &lt; 30% hoặc 0 thao tác hạch toán</div>
              </div>
            </div>

            {/* Criteria 2 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">2</span>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Chỉ Số Chuyển Biến Hồ Sơ & Sản Phẩm Đầu Ra (Task & Deliverable Output)
                </h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Đo lường sản phẩm bàn giao cụ thể: Có chuyển trạng thái hồ sơ từ đang làm sang chờ duyệt không? Có đính kèm file XML/PDF chứng từ không?
              </p>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 text-[11px] space-y-1">
                <div className="text-emerald-600 dark:text-emerald-400 font-bold">🟢 Thực chất: Có ít nhất 1 hồ sơ chuyển trạng thái hoặc file upload/tuần</div>
                <div className="text-rose-600 dark:text-rose-400 font-bold">🔴 Nghi vấn vào cho có: Online nhiều giờ nhưng 0 file, 0 checklist, 0 task tiến triển</div>
              </div>
            </div>

            {/* Criteria 3 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">3</span>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Mật Độ Thao Tác Nghiệp Vụ Theo Giờ (Action Density per Hour - ADH)
                </h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Tỷ số giữa tổng thao tác thực tế trên tổng số giờ mở phiên làm việc. Tránh trường hợp mở trình duyệt đầu giờ sáng rồi bỏ đi làm việc riêng cả ngày.
              </p>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 text-[11px] space-y-1">
                <div className="text-emerald-600 dark:text-emerald-400 font-bold">🟢 Thực chất: 3 - 15 thao tác hữu ích / giờ online</div>
                <div className="text-rose-600 dark:text-rose-400 font-bold">🔴 Nghi vấn vào cho có: &lt; 0.5 thao tác / giờ online (Treo tài khoản)</div>
              </div>
            </div>

            {/* Criteria 4 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">4</span>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Tỷ Lệ Hoàn Thành Checklist Soát Xét Bắt Buộc (Audit Checklist Fulfillment)
                </h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Nghiệp vụ đại lý thuế bắt buộc đối chiếu từng bước (kiểm tra MST, kiểm tra thuế GTGT 133, sao kê ngân hàng...). Nhân viên làm việc thật sẽ tích lũy dấu vết soát xét trên checklist.
              </p>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 text-[11px] space-y-1">
                <div className="text-emerald-600 dark:text-emerald-400 font-bold">🟢 Thực chất: Các mục checklist của hồ sơ được tích xác nhận đầy đủ</div>
                <div className="text-rose-600 dark:text-rose-400 font-bold">🔴 Nghi vấn vào cho có: Bỏ qua kiểm soát chất lượng</div>
              </div>
            </div>

          </div>

          {/* Explanation on Substance Score Formula */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-xs space-y-2">
            <h4 className="font-bold text-indigo-900 dark:text-indigo-200">
              Công Thức Tính Điểm Thực Chất (Substance Score 0 - 100):
            </h4>
            <p className="text-slate-600 dark:text-slate-300 font-mono text-[11px] bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900">
              Điểm Thực Chất = (Tỷ lệ SVR × 40%) + (Điểm Sản Phẩm Đầu Ra × 30%) + (Mật Độ Thao Tác/h × 20%) + (Khối Lượng Thao Tác × 10%)
            </p>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SMART WARNINGS & ANOMALIES CENTER */}
      {/* ========================================================================= */}
      {activeTab === 'ALERTS' && (
        <div className="space-y-3">
          
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Trung Tâm Cảnh Báo Bất Thường & Rủi Ro Hoạt Động Tuần
                </h3>
                <p className="text-xs text-slate-500">
                  Tự động phát hiện dấu hiệu vào phần mềm hình thức, treo máy, và các trường hợp bỏ bê công việc
                </p>
              </div>
            </div>

            <span className="text-xs font-bold px-3 py-1 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl">
              {weeklyWarnings.length} Cảnh Báo Ghi Nhận
            </span>
          </div>

          <div className="space-y-2.5">
            {weeklyWarnings.map(warn => {
              let borderCol = 'border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20';
              let icon = <Info className="h-5 w-5 text-blue-600" />;
              
              if (warn.type === 'CRITICAL') {
                borderCol = 'border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/30';
                icon = <AlertTriangle className="h-5 w-5 text-rose-600" />;
              } else if (warn.type === 'WARNING') {
                borderCol = 'border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/30';
                icon = <AlertCircle className="h-5 w-5 text-amber-600" />;
              } else if (warn.type === 'PRAISE') {
                borderCol = 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/30';
                icon = <CheckCircle className="h-5 w-5 text-emerald-600" />;
              }

              return (
                <div key={warn.id} className={`p-4 rounded-2xl border ${borderCol} flex items-start space-x-3.5 shadow-xs`}>
                  <div className="shrink-0 mt-0.5">
                    {icon}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {warn.title}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {warn.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {warn.description}
                    </p>
                  </div>
                </div>
              );
            })}

            {weeklyWarnings.length === 0 && (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <span>Không có cảnh báo rủi ro hoặc bất thường nào trong tuần này. Toàn bộ hệ thống vận hành đúng quy chuẩn.</span>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: IMMUTABLE AUDIT TRAIL LOGS */}
      {/* ========================================================================= */}
      {activeTab === 'RAW_LOGS' && (
        <div className="space-y-3">
          
          {/* Search & Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo người thực hiện, mã công việc, nội dung..."
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden"
              />
            </div>

            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">Tất cả hành động</option>
              <option value="CREATE">Tạo mới (CREATE)</option>
              <option value="UPDATE">Cập nhật & Hạch toán (UPDATE)</option>
              <option value="STATUS_CHANGE">Chuyển trạng thái</option>
              <option value="APPROVE">Phê duyệt & Ký số (APPROVE)</option>
              <option value="UPLOAD">Đính kèm chứng từ</option>
              <option value="CHECKLIST_ITEM">Tick Checklist</option>
              <option value="VIEW_ONLY">Chỉ xem (VIEW_ONLY)</option>
              <option value="DEADLINE_ALERT">Cảnh báo hạn nộp</option>
            </select>

            <select
              value={selectedStaffFilter}
              onChange={(e) => setSelectedStaffFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400"
            >
              <option value="ALL">Tất cả nhân sự</option>
              {staffActivitySummaries.map(s => (
                <option key={s.userId} value={s.userId}>
                  {s.userName} ({s.totalActionsCount} logs)
                </option>
              ))}
            </select>
          </div>

          {/* Logs Stream */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Chi Tiết Lịch Sử Truy Vết Bất Biến ({filteredLogs.length} bản ghi)
              </span>
              <span className="text-slate-400 text-[11px]">Tuân thủ tiêu chuẩn kiểm toán</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map((log) => {
                const hour = new Date(log.timestamp).getHours();
                const isOffHour = hour >= 21 || hour < 7;
                const act = (log.action || '').toUpperCase();
                const isSuperficial = act === 'VIEW_ONLY' || act === 'LOGIN' || act === 'IDLE';

                return (
                  <div key={log.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-xs flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                        isSuperficial 
                          ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600' 
                          : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600'
                      }`}>
                        <ShieldCheck className="h-4 w-4" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {log.actorName || log.userName || 'Hệ thống'}
                          </span>
                          <span className={`text-[10px] px-2 py-0.2 rounded font-mono font-bold ${
                            isSuperficial 
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}>
                            {log.action}
                          </span>
                          {log.entityId && (
                            <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 font-bold">
                              [{log.entityId}]
                            </span>
                          )}
                          {isOffHour && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center space-x-1">
                              <Moon className="h-2.5 w-2.5" />
                              <span>Ngoài giờ</span>
                            </span>
                          )}
                        </div>

                        {log.entityTitle && (
                          <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            {log.entityTitle}
                          </div>
                        )}

                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                          {log.details || log.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-slate-400 shrink-0">
                      {formatDateTime(log.timestamp)}
                    </div>
                  </div>
                );
              })}

              {filteredLogs.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <span>Không tìm thấy bản ghi nhật ký nào trong khoảng thời gian đã chọn.</span>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* AUDIT DRILLDOWN MODAL (SOI MINH CHỨNG CHI TIẾT TỪNG NHÂN SỰ) */}
      {/* ========================================================================= */}
      {selectedStaffForDrilldown && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-2xl text-white font-bold text-sm flex items-center justify-center shadow-xs ${
                  selectedStaffForDrilldown.behaviorType === 'SUPERFICIAL_SUSPECTED' 
                    ? 'bg-rose-600' 
                    : selectedStaffForDrilldown.behaviorType === 'HIGH_SUBSTANCE' 
                    ? 'bg-emerald-600' 
                    : 'bg-indigo-600'
                }`}>
                  {selectedStaffForDrilldown.userName.split(' ').map(n => n[0]).slice(-2).join('')}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <span>{selectedStaffForDrilldown.userName}</span>
                    <span className="text-xs font-mono font-semibold text-slate-500">
                      ({selectedStaffForDrilldown.userCode})
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedStaffForDrilldown.position}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStaffForDrilldown(null)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              
              {/* Substance Score Highlight */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                selectedStaffForDrilldown.behaviorType === 'SUPERFICIAL_SUSPECTED'
                  ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
                  : selectedStaffForDrilldown.behaviorType === 'HIGH_SUBSTANCE'
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                  : 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800'
              }`}>
                <div>
                  <span className="font-bold text-slate-500 dark:text-slate-400 block text-[11px]">
                    ĐIỂM ĐÁNH GIÁ THỰC CHẤT
                  </span>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedStaffForDrilldown.substanceScore} <span className="text-sm font-normal text-slate-400">/ 100 điểm</span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mt-1">
                    {selectedStaffForDrilldown.warningMessage}
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="text-[11px] text-slate-500">Giờ online ghi nhận</div>
                  <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {selectedStaffForDrilldown.totalActiveHoursFormatted}
                  </div>
                </div>
              </div>

              {/* 4 Pillars Matrix Breakdown */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10.5px] text-slate-500">1. Tỷ lệ Thao tác Thực chất</span>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {selectedStaffForDrilldown.substanceRatioPercent}% ({selectedStaffForDrilldown.substantiveActionsCount}/{selectedStaffForDrilldown.totalActionsCount} logs)
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10.5px] text-slate-500">2. Mật độ Thao tác/Giờ</span>
                  <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {selectedStaffForDrilldown.actionDensityPerHour} thao tác/giờ
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10.5px] text-slate-500">3. Hồ sơ Đẩy tiến độ</span>
                  <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                    {selectedStaffForDrilldown.tasksMovedForwardCount} hồ sơ
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10.5px] text-slate-500">4. Chứng từ & Checklist</span>
                  <div className="text-sm font-bold text-teal-600 dark:text-teal-400 mt-1">
                    {selectedStaffForDrilldown.filesUploadedCount} files • {selectedStaffForDrilldown.checklistItemsVerifiedCount} checks
                  </div>
                </div>
              </div>

              {/* Specific Detection Findings */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 space-y-2">
                <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10.5px] block">
                  Căn Cứ Nhận Diện & Đánh Giá Của Hệ Thống:
                </span>
                <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                  {selectedStaffForDrilldown.detectionDetails.map((detail, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex justify-end space-x-2">
              <button
                onClick={() => setSelectedStaffForDrilldown(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CRITERIA EXPLANATION POPUP MODAL */}
      {/* ========================================================================= */}
      {showCriteriaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Tiêu Chuẩn Nhận Diện Làm Việc Thực Chất vs. Hình Thức
                </h3>
              </div>
              <button
                onClick={() => setShowCriteriaModal(false)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3.5 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">1. Thao tác Tạo Giá Trị (Trọng số 40%):</span>
                <p className="text-slate-600 dark:text-slate-400">
                  Hạch toán chứng từ, sửa số liệu thuế, phê duyệt lệnh chi, ký số CKS, đính kèm file XML/PDF.
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">2. Kết Quả Đầu Ra Hồ Sơ (Trọng số 30%):</span>
                <p className="text-slate-600 dark:text-slate-400">
                  Phải có ít nhất 1 hồ sơ chuyển trạng thái tiến độ hoặc hoàn thành checklist trong tuần.
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">3. Mật Độ Thao Tác Hữu Ích (Trọng số 20%):</span>
                <p className="text-slate-600 dark:text-slate-400">
                  Tối thiểu 2 - 5 thao tác hữu ích trên mỗi giờ online để loại trừ hiện tượng đăng nhập rồi để máy đó.
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">4. Thao tác Thụ Động Bị Trừ Điểm:</span>
                <p className="text-slate-600 dark:text-slate-400">
                  Chỉ click qua lại giữa các tab, đăng nhập rồi không sửa đổi gì (VIEW_ONLY, IDLE).
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex justify-end">
              <button
                onClick={() => setShowCriteriaModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

// Mini internal icon helper
function BarChartIcon(props: any) {
  return (
    <svg 
      {...props} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

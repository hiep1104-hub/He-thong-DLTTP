import React, { useState, useMemo, useEffect } from 'react';
import { Task, Customer, User } from '../../types';
import { 
  FileText, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  X, 
  Calendar, 
  UserCheck, 
  Building, 
  Filter, 
  ShieldAlert, 
  Settings2, 
  AlertTriangle,
  FileSpreadsheet,
  HelpCircle,
  Eye,
  Building2
} from 'lucide-react';
import { formatDate, STATUS_LABELS, RISK_LABELS, PRIORITY_LABELS, getTaskNature } from '../../utils/formatters';
import { generateDecree30WeeklyDocHtml, downloadDecree30DocFile, WeeklyReportOptions } from '../../services/docExportService';
import { storageService } from '../../services/storageService';
import { PermissionService } from '../../utils/permissions';

interface WeeklyTaskReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  customers: Customer[];
  users: User[];
  currentUser: User;
}

export const WeeklyTaskReportModal: React.FC<WeeklyTaskReportModalProps> = ({
  isOpen,
  onClose,
  tasks,
  customers,
  users,
  currentUser,
}) => {
  // Load dynamic company info from system settings
  const systemCompanyInfo = useMemo(() => {
    return storageService.getCompanyInfo();
  }, []);

  // Current date helpers
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  // Initial week calculation (Last 7 days or current week)
  const defaultStartDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const defaultEndDate = today.toISOString().split('T')[0];

  // Options state
  const [companyName, setCompanyName] = useState(systemCompanyInfo?.name || 'CÔNG TY TNHH ĐẠI LÝ THUẾ THÀNH PHỐ');
  const [departmentName, setDepartmentName] = useState('PHÒNG NGHIỆP VỤ KẾ TOÁN - THUẾ');
  const [weekTitle, setWeekTitle] = useState(`Tuần ${Math.ceil(currentDay / 7)} Tháng ${currentMonth}/${currentYear}`);
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [reportNumber, setReportNumber] = useState(`${String(Math.ceil(currentDay / 7)).padStart(2, '0')}/BC-DLTTP`);
  const [reportDate, setReportDate] = useState(`Hà Nội, ngày ${currentDay} tháng ${currentMonth} năm ${currentYear}`);
  const canViewAllTasks = PermissionService.canViewAllTasks(currentUser);
  const [selectedStaffId, setSelectedStaffId] = useState<string>(!canViewAllTasks && currentUser ? currentUser.id : 'ALL');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('ALL');

  useEffect(() => {
    if (!canViewAllTasks && currentUser) {
      setSelectedStaffId(currentUser.id);
    }
  }, [canViewAllTasks, currentUser]);

  // Staff roles for signatures - dynamically synced with system settings
  const [reporterName, setReporterName] = useState(currentUser?.name || 'Chuyên viên Kế toán');
  const [reporterTitle, setReporterTitle] = useState('NGƯỜI LẬP BÁO CÁO');
  const [reviewerName, setReviewerName] = useState(systemCompanyInfo?.chiefAccountantName || 'Trần Thị Mai');
  const [reviewerTitle, setReviewerTitle] = useState('TRƯỞNG PHÒNG NGHIỆP VỤ / KTT');
  const [approverName, setApproverName] = useState(systemCompanyInfo?.directorName || 'Quản Trị Hệ Thống (Admin)');
  const [approverTitle, setApproverTitle] = useState('BAN GIÁM ĐỐC PHÊ DUYỆT');

  // Sync if system company info changes
  useEffect(() => {
    if (systemCompanyInfo) {
      if (systemCompanyInfo.name) setCompanyName(systemCompanyInfo.name);
      if (systemCompanyInfo.directorName) setApproverName(systemCompanyInfo.directorName);
      if (systemCompanyInfo.chiefAccountantName) setReviewerName(systemCompanyInfo.chiefAccountantName);
    }
  }, [systemCompanyInfo]);

  const [executiveProposal, setExecutiveProposal] = useState(
    `1. Đề nghị Ban Giám đốc phê duyệt cử thêm 01 nhân sự hỗ trợ đôn đốc thu thập chứng từ ngân hàng, hóa đơn đầu vào/đầu ra cho các khách hàng trọng điểm.\n` +
    `2. Ban hành thông báo đôn đốc chính thức đối với các doanh nghiệp, hộ kinh doanh có dấu hiệu chậm chuyển chứng từ hoặc chậm phối hợp chốt số liệu.\n` +
    `3. Phê duyệt bổ sung nguồn lực hỗ trợ khẩn cấp đối với các hồ sơ dịch vụ phát sinh và các việc cận hạn trong tuần tới.`
  );

  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'PREVIEW' | 'SETTINGS'>('PREVIEW');

  // Filtered tasks for preview calculation
  const targetTasks = useMemo(() => {
    return tasks.filter(t => {
      if (selectedStaffId !== 'ALL' && t.assigneeId !== selectedStaffId) return false;
      if (selectedCustomerId !== 'ALL' && t.customerId !== selectedCustomerId) return false;
      return true;
    });
  }, [tasks, selectedStaffId, selectedCustomerId]);

  const totalTasks = targetTasks.length;
  const completedTasks = targetTasks.filter(t => t.status === 'HOAN_THANH').length;
  const inProgressTasks = targetTasks.filter(t => t.status === 'DANG_THUC_HIEN' || t.status === 'DA_PHAN_CONG').length;
  const pendingReviewTasks = targetTasks.filter(t => t.status === 'CHO_KIEM_TRA' || t.status === 'CHO_PHE_DUYET').length;
  const waitingDocTasks = targetTasks.filter(t => t.status === 'CHO_CHUNG_TU' || t.status === 'CHO_KHACH_HANG').length;
  const overdueTasks = targetTasks.filter(t => t.status === 'QUA_HAN' || (t.status !== 'HOAN_THANH' && t.dueDate < new Date().toISOString().split('T')[0])).length;
  const onTimeRate = totalTasks > 0 ? Math.round(((totalTasks - overdueTasks) / totalTasks) * 100) : 100;

  // Group by staff
  const staffGroups = useMemo(() => {
    const groups: { staff: User; tasks: Task[] }[] = [];
    const assignedStaffIds: string[] = Array.from(new Set(targetTasks.map(t => t.assigneeId || 'UNASSIGNED')));

    assignedStaffIds.forEach(staffId => {
      const staffUser: User = users.find(u => u.id === staffId) || {
        id: staffId,
        code: 'NV-' + String(staffId).slice(0, 4),
        name: targetTasks.find(t => t.assigneeId === staffId)?.assigneeName || 'Chuyên viên kế toán',
        role: 'NHAN_VIEN',
        email: '',
        phone: '',
        department: 'KE_TOAN_THUE',
        position: 'Chuyên viên Kế toán - Thuế',
        active: true,
      };
      const staffTaskList = targetTasks.filter(t => (t.assigneeId || 'UNASSIGNED') === staffId);
      groups.push({ staff: staffUser, tasks: staffTaskList });
    });
    return groups;
  }, [targetTasks, users]);

  // Critical & Overdue tasks
  const criticalOverdueTasks = useMemo(() => {
    return targetTasks.filter(t => 
      t.status === 'QUA_HAN' || 
      (t.status !== 'HOAN_THANH' && t.dueDate < new Date().toISOString().split('T')[0]) ||
      t.riskLevel === 'RUI_RO_THUE_PHAP_LY'
    );
  }, [targetTasks]);

  const reportOptions: WeeklyReportOptions = {
    weekTitle,
    startDate,
    endDate,
    reportNumber,
    reportDate,
    companyName,
    departmentName,
    reporterName,
    reporterTitle,
    reviewerName,
    reviewerTitle,
    approverName,
    approverTitle,
    selectedStaffId,
    selectedCustomerId,
    executiveProposal,
    tasks,
    customers,
    users,
  };

  const handleDownloadDoc = () => {
    downloadDecree30DocFile(reportOptions);
  };

  const handlePrint = () => {
    const html = generateDecree30WeeklyDocHtml(reportOptions);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    }
  };

  const handleCopy = () => {
    const html = generateDecree30WeeklyDocHtml(reportOptions);
    navigator.clipboard.writeText(html).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-4 bg-white dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Xuất Báo Cáo Định Kỳ Tuần Cho Ban Giám Đốc
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black border border-emerald-300 dark:border-emerald-800">
                  Chuẩn Nghị định 30/2020/NĐ-CP
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Báo cáo chi tiết công việc từng nhân viên thực hiện cho từng khách hàng, tiến độ, công việc quá hạn & kiến nghị chỉ đạo
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('PREVIEW')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'PREVIEW'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Xem văn bản A4</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('SETTINGS')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'SETTINGS'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Settings2 className="h-3.5 w-3.5" />
                <span>Tùy chỉnh & Bộ lọc</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/50 flex flex-wrap items-center justify-between gap-2.5 shrink-0 text-xs">
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-blue-600" />
              <span>{weekTitle}</span>
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-600 dark:text-slate-300">
              Tổng số việc: <strong className="text-blue-700 dark:text-blue-300">{totalTasks}</strong> (Đã xong: {completedTasks} | Quá hạn: <strong className="text-red-600">{overdueTasks}</strong> | Tỷ lệ: <strong className="text-emerald-600">{onTimeRate}%</strong>)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition-all shadow-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>In / PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadDoc}
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black transition-all shadow-xs cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>📥 Tải File Word (.doc) Chuẩn NĐ 30</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          
          {/* TAB 1: SETTINGS / FILTER FORM */}
          {activeTab === 'SETTINGS' && (
            <div className="space-y-5 max-w-3xl mx-auto bg-white dark:bg-slate-850 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-blue-600" />
                  <span>Tham Số Báo Cáo & Phân Loại</span>
                </h3>
                <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  Tự động đồng bộ từ Cài đặt Hệ thống
                </span>
              </div>

              {/* Company & Department Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-750">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tên Công Ty / Đơn Vị Ban Hành:
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="VD: CÔNG TY TNHH ĐẠI LÝ THUẾ THÀNH PHỐ"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phòng Ban / Đơn Vị Soạn Thảo:
                  </label>
                  <input
                    type="text"
                    value={departmentName}
                    onChange={(e) => setDepartmentName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="VD: PHÒNG NGHIỆP VỤ KẾ TOÁN - THUẾ"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Địa danh & Ngày lập báo cáo:
                  </label>
                  <input
                    type="text"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="VD: Hà Nội, ngày 24 tháng 08 năm 2026"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tiêu đề tuần báo cáo:
                  </label>
                  <input
                    type="text"
                    value={weekTitle}
                    onChange={(e) => setWeekTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="VD: Tuần 4 Tháng 08/2026..."
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Số hiệu văn bản (NĐ 30):
                  </label>
                  <input
                    type="text"
                    value={reportNumber}
                    onChange={(e) => setReportNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="VD: 34/BC-DLTTP"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Từ ngày:
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Đến ngày:
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Lọc theo nhân sự phụ trách:
                  </label>
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    disabled={!canViewAllTasks}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {canViewAllTasks && <option value="ALL">Toàn bộ chuyên viên kế toán</option>}
                    {users
                      .filter(u => (canViewAllTasks || u.id === currentUser?.id) && u.role !== 'ADMIN' && u.id !== 'USR-030' && !u.name.includes('Quản Trị'))
                      .map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.position || u.role})</option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Lọc theo khách hàng:
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="ALL">Toàn bộ khách hàng doanh nghiệp & HKD</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.taxCode})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Proposals */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                  Ý kiến đề xuất & Kiến nghị trình Ban Giám Đốc (Phần IV):
                </label>
                <textarea
                  rows={4}
                  value={executiveProposal}
                  onChange={(e) => setExecutiveProposal(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-normal focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Nhập các nội dung đề xuất, kiến nghị chỉ đạo..."
                />
              </div>

              {/* Signatures Settings */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                  Thông tin ký duyệt văn bản (Thể thức NĐ 30)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-500 text-[11px] mb-1">Người lập báo cáo:</label>
                    <input
                      type="text"
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[11px] mb-1">Trưởng phòng / KTT duyệt:</label>
                    <input
                      type="text"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[11px] mb-1">Ban Giám Đốc phê duyệt:</label>
                    <input
                      type="text"
                      value={approverName}
                      onChange={(e) => setApproverName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('PREVIEW')}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  Xác Nhận & Xem Văn Bản A4
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE PREVIEW THEO CHUẨN NGHỊ ĐỊNH 30/2020/NĐ-CP */}
          {activeTab === 'PREVIEW' && (
            <div className="max-w-4xl mx-auto bg-white text-slate-950 p-8 sm:p-12 rounded-2xl shadow-xl border border-slate-300 font-serif leading-relaxed text-sm">
              
              {/* Header */}
              <div className="flex justify-between items-start border-b-0 pb-4 text-center">
                <div className="w-[45%] text-center">
                  <div className="font-bold text-xs uppercase text-slate-900 leading-tight">
                    {companyName.toUpperCase()}
                  </div>
                  <div className="font-bold text-xs uppercase text-slate-800 mt-0.5">
                    {departmentName.toUpperCase()}
                  </div>
                  <div className="w-16 h-0.5 bg-slate-900 mx-auto my-1"></div>
                  <div className="text-xs text-slate-700 mt-1">
                    Số: <strong>{reportNumber}</strong>
                  </div>
                </div>

                <div className="w-[50%] text-center">
                  <div className="font-bold text-xs uppercase text-slate-900 leading-tight">
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                  </div>
                  <div className="font-bold text-xs text-slate-900 mt-0.5">
                    Độc lập - Tự do - Hạnh phúc
                  </div>
                  <div className="w-24 h-0.5 bg-slate-900 mx-auto my-1"></div>
                  <div className="text-xs italic text-slate-700 mt-1">
                    {reportDate}
                  </div>
                </div>
              </div>

              {/* Report Title */}
              <div className="text-center my-6">
                <h1 className="text-base sm:text-lg font-bold uppercase tracking-wider text-slate-900">
                  BÁO CÁO ĐỊNH KỲ TUẦN
                </h1>
                <p className="text-xs font-bold italic text-slate-700 mt-1 max-w-xl mx-auto">
                  V/v Tình hình thực hiện công việc, tiến độ phục vụ từng khách hàng và kiểm soát rủi ro thuế của nhân sự kế toán ({weekTitle})
                </p>
                <div className="mt-4 font-bold text-xs text-slate-800">
                  Kính gửi: Ban Giám đốc {companyName}
                </div>
              </div>

              {/* Intro */}
              <p className="text-xs text-justify indent-6 mb-4 text-slate-800 leading-normal">
                Căn cứ quy chế hoạt động nghiệp vụ, hợp đồng cung cấp dịch vụ đại lý thuế, kế toán trọn gói và dịch vụ doanh nghiệp; {departmentName} kính báo cáo Ban Giám đốc tình hình thực hiện công việc tuần từ ngày <strong>{formatDate(startDate)}</strong> đến ngày <strong>{formatDate(endDate)}</strong>, tiến độ phụ trách khách hàng của từng nhân sự và các nội dung trọng điểm cần chỉ đạo như sau:
              </p>

              {/* Section I */}
              <div className="mb-6">
                <h3 className="font-bold text-xs uppercase text-slate-900 mb-2">
                  I. TỔNG QUAN TÌNH HÌNH THỰC HIỆN CÔNG VIỆC TRONG TUẦN
                </h3>
                
                <table className="w-full border-collapse border border-slate-900 text-xs">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-900 p-2 text-center w-12">STT</th>
                      <th className="border border-slate-900 p-2 text-left">Chỉ tiêu theo dõi</th>
                      <th className="border border-slate-900 p-2 text-center w-36">Số lượng công việc</th>
                      <th className="border border-slate-900 p-2 text-center w-32">Tỷ lệ</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-900 p-2 text-center">1</td>
                      <td className="border border-slate-900 p-2 font-bold">Tổng số đầu việc phân công thực hiện</td>
                      <td className="border border-slate-900 p-2 text-center font-bold">{totalTasks} việc</td>
                      <td className="border border-slate-900 p-2 text-center font-bold">100%</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 p-2 text-center">2</td>
                      <td className="border border-slate-900 p-2">Công việc đã hoàn thành đúng chuẩn</td>
                      <td className="border border-slate-900 p-2 text-center font-bold text-emerald-700">{completedTasks} việc</td>
                      <td className="border border-slate-900 p-2 text-center text-emerald-700">{totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0}%</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 p-2 text-center">3</td>
                      <td className="border border-slate-900 p-2">Công việc đang thực hiện trong hạn</td>
                      <td className="border border-slate-900 p-2 text-center font-bold text-blue-700">{inProgressTasks} việc</td>
                      <td className="border border-slate-900 p-2 text-center">{totalTasks > 0 ? ((inProgressTasks / totalTasks) * 100).toFixed(1) : 0}%</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 p-2 text-center">4</td>
                      <td className="border border-slate-900 p-2">Công việc chờ KTT / Trưởng phòng soát xét duyệt</td>
                      <td className="border border-slate-900 p-2 text-center font-bold text-purple-700">{pendingReviewTasks} việc</td>
                      <td className="border border-slate-900 p-2 text-center">{totalTasks > 0 ? ((pendingReviewTasks / totalTasks) * 100).toFixed(1) : 0}%</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 p-2 text-center">5</td>
                      <td className="border border-slate-900 p-2">Công việc chờ chứng từ / hóa đơn từ khách hàng</td>
                      <td className="border border-slate-900 p-2 text-center font-bold text-amber-700">{waitingDocTasks} việc</td>
                      <td className="border border-slate-900 p-2 text-center">{totalTasks > 0 ? ((waitingDocTasks / totalTasks) * 100).toFixed(1) : 0}%</td>
                    </tr>
                    <tr className="bg-red-50/50">
                      <td className="border border-slate-900 p-2 text-center font-bold text-red-700">6</td>
                      <td className="border border-slate-900 p-2 font-bold text-red-700">Công việc quá hạn / Chậm tiến độ</td>
                      <td className="border border-slate-900 p-2 text-center font-bold text-red-700">{overdueTasks} việc</td>
                      <td className="border border-slate-900 p-2 text-center font-bold text-red-700">{totalTasks > 0 ? ((overdueTasks / totalTasks) * 100).toFixed(1) : 0}%</td>
                    </tr>
                    <tr className="bg-emerald-50/50">
                      <td className="border border-slate-900 p-2 text-center font-bold text-emerald-800">7</td>
                      <td className="border border-slate-900 p-2 font-bold text-emerald-800" colSpan={2}>Tỷ lệ hoàn thành & kiểm soát đúng hạn chung</td>
                      <td className="border border-slate-900 p-2 text-center font-bold text-emerald-800 text-sm">{onTimeRate}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section II */}
              <div className="mb-6">
                <h3 className="font-bold text-xs uppercase text-slate-900 mb-2">
                  II. BẢNG TỔNG HỢP CHI TIẾT CÔNG VIỆC TỪNG NHÂN VIÊN THỰC HIỆN CHO TỪNG KHÁCH HÀNG
                </h3>

                {staffGroups.map((group, groupIdx) => {
                  const staffTotal = group.tasks.length;
                  const staffCompleted = group.tasks.filter(t => t.status === 'HOAN_THANH').length;
                  const staffOverdue = group.tasks.filter(t => t.status === 'QUA_HAN' || (t.status !== 'HOAN_THANH' && t.dueDate < new Date().toISOString().split('T')[0])).length;
                  const staffOnTime = staffTotal > 0 ? Math.round(((staffTotal - staffOverdue) / staffTotal) * 100) : 100;

                  return (
                    <div key={group.staff.id} className="mb-4">
                      <div className="font-bold text-xs text-slate-900 mb-1.5 flex items-center justify-between">
                        <span>
                          {groupIdx + 1}. Nhân sự: <strong>{group.staff.name}</strong> ({group.staff.position || 'Chuyên viên Kế toán'})
                        </span>
                        <span className="text-[11px] font-normal text-slate-600">
                          Tổng số: <strong>{staffTotal}</strong> việc (Xong: <strong className="text-emerald-700">{staffCompleted}</strong> | Quá hạn: <strong className="text-red-700">{staffOverdue}</strong> | Tỷ lệ: <strong>{staffOnTime}%</strong>)
                        </span>
                      </div>

                      <table className="w-full border-collapse border border-slate-900 text-xs">
                        <thead>
                          <tr className="bg-slate-100 text-[11px]">
                            <th className="border border-slate-900 p-1.5 text-center w-8">STT</th>
                            <th className="border border-slate-900 p-1.5 text-center w-24">Mã việc</th>
                            <th className="border border-slate-900 p-1.5 text-left w-48">Khách hàng (MST)</th>
                            <th className="border border-slate-900 p-1.5 text-left">Nội dung công việc</th>
                            <th className="border border-slate-900 p-1.5 text-center w-20">Hạn nộp</th>
                            <th className="border border-slate-900 p-1.5 text-center w-24">Tiến độ</th>
                            <th className="border border-slate-900 p-1.5 text-center w-24">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.tasks.map((task, taskIdx) => {
                            const nature = getTaskNature(task);
                            const isOverdue = task.status === 'QUA_HAN' || (task.status !== 'HOAN_THANH' && task.dueDate < new Date().toISOString().split('T')[0]);
                            const completedSteps = task.workflowSteps.filter(s => s.isCompleted).length;
                            const totalSteps = task.workflowSteps.length;
                            const percent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : (task.status === 'HOAN_THANH' ? 100 : 0);

                            return (
                              <tr key={task.id} className={isOverdue ? 'bg-red-50/40' : ''}>
                                <td className="border border-slate-900 p-1.5 text-center">{taskIdx + 1}</td>
                                <td className="border border-slate-900 p-1.5 text-center font-mono font-bold">{task.code}</td>
                                <td className="border border-slate-900 p-1.5">
                                  <strong>{task.customerName || 'Nội bộ'}</strong>
                                  <div className="text-[10px] text-slate-500 font-mono">MST: {task.customerTaxCode || '---'}</div>
                                </td>
                                <td className="border border-slate-900 p-1.5">
                                  <div>{task.title}</div>
                                  <div className="text-[10px] text-blue-700 font-sans font-medium">
                                    {nature === 'PERIODIC' ? '• Định kỳ Gói' : '• Phát sinh vụ việc'}
                                    {task.taxPeriod ? ` (Kỳ: ${task.taxPeriod})` : ''}
                                  </div>
                                </td>
                                <td className={`border border-slate-900 p-1.5 text-center ${isOverdue ? 'text-red-700 font-bold' : ''}`}>
                                  {formatDate(task.dueDate)}
                                </td>
                                <td className="border border-slate-900 p-1.5 text-center text-[11px]">
                                  {percent}% ({completedSteps}/{totalSteps})
                                </td>
                                <td className={`border border-slate-900 p-1.5 text-center text-[11px] font-medium ${isOverdue ? 'text-red-700 font-bold' : ''}`}>
                                  {STATUS_LABELS[task.status]?.label || task.status}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>

              {/* Section III */}
              <div className="mb-6">
                <h3 className="font-bold text-xs uppercase text-slate-900 mb-2">
                  III. DANH MỤC CÔNG VIỆC QUÁ HẠN, CHẬM TIẾN ĐỘ & CẢNH BÁO RỦI RO THUẾ
                </h3>

                {criticalOverdueTasks.length > 0 ? (
                  <table className="w-full border-collapse border border-slate-900 text-xs">
                    <thead>
                      <tr className="bg-red-50 text-[11px]">
                        <th className="border border-slate-900 p-1.5 text-center w-8">STT</th>
                        <th className="border border-slate-900 p-1.5 text-center w-24">Mã việc</th>
                        <th className="border border-slate-900 p-1.5 text-left w-40">Khách hàng</th>
                        <th className="border border-slate-900 p-1.5 text-left">Nội dung việc & Cảnh báo</th>
                        <th className="border border-slate-900 p-1.5 text-left w-28">Nhân sự / KTT</th>
                        <th className="border border-slate-900 p-1.5 text-center w-24">Hạn chót</th>
                        <th className="border border-slate-900 p-1.5 text-left w-48">Nguyên nhân & Hướng xử lý</th>
                      </tr>
                    </thead>
                    <tbody>
                      {criticalOverdueTasks.map((t, idx) => {
                        const isOverdue = t.status === 'QUA_HAN' || (t.status !== 'HOAN_THANH' && t.dueDate < new Date().toISOString().split('T')[0]);
                        return (
                          <tr key={t.id} className="bg-red-50/30">
                            <td className="border border-slate-900 p-1.5 text-center">{idx + 1}</td>
                            <td className="border border-slate-900 p-1.5 text-center font-mono font-bold">{t.code}</td>
                            <td className="border border-slate-900 p-1.5">
                              <strong>{t.customerName || 'Nội bộ'}</strong>
                              <div className="text-[10px] text-slate-500 font-mono">MST: {t.customerTaxCode}</div>
                            </td>
                            <td className="border border-slate-900 p-1.5">
                              <div>{t.title}</div>
                              <div className="text-[10px] text-red-700 font-bold">
                                [{RISK_LABELS[t.riskLevel]?.label || 'Rủi ro'}]
                              </div>
                            </td>
                            <td className="border border-slate-900 p-1.5 text-[11px]">
                              <div>{t.assigneeName}</div>
                              <div className="text-slate-500">Duyệt: {t.reviewerName || 'KTT'}</div>
                            </td>
                            <td className="border border-slate-900 p-1.5 text-center font-bold text-red-700">
                              {formatDate(t.dueDate)}
                            </td>
                            <td className="border border-slate-900 p-1.5 text-[11px]">
                              {t.status === 'CHO_CHUNG_TU' 
                                ? 'Khách hàng chậm gửi chứng từ gốc. Đã gửi thông báo đôn đốc lần 2.' 
                                : isOverdue 
                                ? 'Hồ sơ bị quá hạn thực tế, đang tập trung hỗ trợ xử lý khẩn cấp.'
                                : 'Cần đối soát thanh toán không dùng tiền mặt hóa đơn trên 5 triệu.'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-xs italic text-emerald-700 indent-6">
                    (Không có công việc nào rơi vào tình trạng quá hạn nghiêm trọng hoặc phát sinh rủi ro thuế ngoài tầm kiểm soát).
                  </p>
                )}
              </div>

              {/* Section IV */}
              <div className="mb-8">
                <h3 className="font-bold text-xs uppercase text-slate-900 mb-2">
                  IV. ĐỀ XUẤT, KIẾN NGHỊ BAN GIÁM ĐỐC CHỈ ĐẠO
                </h3>
                <div className="text-xs space-y-1.5 indent-6 text-slate-800 text-justify">
                  {executiveProposal.split('\n').map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>
                <p className="text-xs text-justify indent-6 mt-3 text-slate-800">
                  Kính trình Ban Giám đốc xem xét, cho ý kiến chỉ đạo thực hiện./.
                </p>
              </div>

              {/* Signatures */}
              <div className="flex justify-between items-start text-center pt-4 border-t-0">
                <div className="w-[35%] text-left text-[11px] leading-relaxed">
                  <div className="font-bold italic underline mb-1">Nơi nhận:</div>
                  <div>- Như Kính gửi (để b/c);</div>
                  <div>- {departmentName} (để t/h);</div>
                  <div>- Phòng HC-NS & CSKH (để p/h);</div>
                  <div>- Lưu: VT, HS.</div>
                </div>

                <div className="w-[30%] text-center">
                  <div className="font-bold text-xs uppercase">{reviewerTitle}</div>
                  <div className="italic text-[11px] text-slate-500 mb-12">(Ký, họ và tên)</div>
                  <div className="font-bold text-xs">{reviewerName}</div>
                </div>

                <div className="w-[35%] text-center">
                  <div className="font-bold text-xs uppercase">{approverTitle}</div>
                  <div className="italic text-[11px] text-slate-500 mb-12">(Ký, đóng dấu, họ và tên)</div>
                  <div className="font-bold text-xs">{approverName}</div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-white dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Định dạng Word `.doc` tương thích 100% Microsoft Word, LibreOffice & Google Docs</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
            >
              Đóng
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
            >
              {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{isCopied ? 'Đã sao chép' : 'Sao chép văn bản'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadDoc}
              className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>📥 Tải Báo Cáo (.doc) Chuẩn NĐ 30</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

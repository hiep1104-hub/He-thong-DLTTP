import React, { useState } from 'react';
import { Customer, Task, User, StaffKPIRecord } from '../../types';
import { 
  BarChart3, 
  Download, 
  FileSpreadsheet, 
  Printer, 
  Building, 
  UserCheck, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert,
  Calendar,
  Receipt
} from 'lucide-react';
import { 
  formatCurrency, 
  formatDate, 
  RISK_LABELS, 
  STATUS_LABELS,
  BILLING_CYCLE_LABELS,
  DEBT_AGING_LABELS 
} from '../../utils/formatters';
import { storageService, CURRENT_SYSTEM_DATE } from '../../services/storageService';
import { CustomerDebtReportView } from './CustomerDebtReportView';
import { WeeklyTaskReportModal } from '../tasks/WeeklyTaskReportModal';
import { PermissionService } from '../../utils/permissions';
import { FileText } from 'lucide-react';

interface ReportsViewProps {
  tasks: Task[];
  customers: Customer[];
  users: User[];
  staffKPIs: StaffKPIRecord[];
  currentUser?: User | null;
  onUpdateCustomer?: (customer: Customer) => void;
  onDataReload?: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  tasks,
  customers,
  users,
  staffKPIs,
  currentUser,
  onUpdateCustomer,
  onDataReload,
}) => {
  const canViewFinancials = PermissionService.canViewCustomerFinancials(currentUser);
  const [reportType, setReportType] = useState<'EXECUTIVE_SUMMARY' | 'OVERDUE_RISK' | 'STAFF_PRODUCTIVITY' | 'CUSTOMER_DEBT'>('EXECUTIVE_SUMMARY');
  const [isWeeklyDocModalOpen, setIsWeeklyDocModalOpen] = useState(false);

  // Export CSV simulation
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    if (reportType === 'EXECUTIVE_SUMMARY' || reportType === 'OVERDUE_RISK') {
      csvContent += 'Mã việc,Tên công việc,Khách hàng,MST,Phụ trách,Hạn xử lý,Trạng thái,Rủi ro\n';
      const exportList = reportType === 'OVERDUE_RISK' 
        ? tasks.filter(t => storageService.getTaskDeadlineStatus(t).isOverdue || t.riskLevel === 'RUI_RO_THUE_PHAP_LY')
        : tasks;

      exportList.forEach(t => {
        csvContent += `"${t.code}","${t.title}","${t.customerName || 'Nội bộ'}","${t.customerTaxCode || ''}","${t.assigneeName}","${formatDate(t.dueDate)}","${STATUS_LABELS[t.status]?.label}","${RISK_LABELS[t.riskLevel]?.label}"\n`;
      });
    } else if (reportType === 'STAFF_PRODUCTIVITY') {
      csvContent += 'Tên nhân sự,Vị trí,Tổng việc giao,Đã xong,Quá hạn,Tỷ lệ đúng hạn,Điểm KPI\n';
      staffKPIs.forEach(k => {
        csvContent += `"${k.userName}","${k.position}",${k.totalAssigned},${k.completedCount},${k.overdueCount},"${k.onTimeRate}%",${k.compositeKPIScore}\n`;
      });
    } else {
      csvContent += 'Tên khách hàng,MST,Kế toán phụ trách,Gói dịch vụ,Chu kỳ thanh toán,Ngày thu phí kỳ,Hạn nợ (ngày),Hạn mức nợ,Phí định kỳ,Công nợ,Nhóm tuổi nợ,Số ngày quá hạn\n';
      customers.forEach(c => {
        const aging = storageService.calculateCustomerDebtAging(c);
        const cycleLabel = BILLING_CYCLE_LABELS[c.billingCycle || 'HANG_THANG']?.label || 'Hàng tháng';
        const agingLabel = DEBT_AGING_LABELS[aging.agingGroup]?.label || 'Trong hạn';
        csvContent += `"${c.name}","${c.taxCode}","${c.assignedStaffName || ''}","${c.servicePackage}","${cycleLabel}",Ngày ${c.paymentDueDay || 10},${c.paymentTermDays || 10},${c.creditLimit || 0},${c.monthlyFee || 0},${c.debtAmount || 0},"${agingLabel}",${aging.overdueDays}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bao_Cao_${reportType}_${CURRENT_SYSTEM_DATE}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Report Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Trung Tâm Báo Cáo Quản Trị & Xuất Dữ Liệu
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tổng hợp dữ liệu điều hành gửi Ban Giám Đốc, phục vụ họp giao ban tuần và kiểm soát rủi ro
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <button
            type="button"
            onClick={() => setIsWeeklyDocModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer"
            title="Xuất báo cáo định kỳ tuần (.doc) chuẩn Nghị định 30 gửi Ban Giám Đốc"
          >
            <FileText className="h-4 w-4" />
            <span>📥 Xuất Báo Cáo Tuần (.doc) Chuẩn NĐ 30</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            <Download className="h-4 w-4" />
            <span>Xuất File Excel (CSV)</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold"
          >
            <Printer className="h-4 w-4" />
            <span>In Báo Cáo</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 text-xs overflow-x-auto no-scrollbar">
        <button
          onClick={() => setReportType('EXECUTIVE_SUMMARY')}
          className={`py-3 px-4 rounded-t-xl font-bold transition-all border-b-2 ${
            reportType === 'EXECUTIVE_SUMMARY'
              ? 'bg-blue-50 text-blue-700 border-blue-600 dark:bg-blue-950/40 dark:text-blue-200'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          1. Báo Cáo Tổng Hợp Tiến Độ Toàn Công Ty
        </button>

        <button
          onClick={() => setReportType('OVERDUE_RISK')}
          className={`py-3 px-4 rounded-t-xl font-bold transition-all border-b-2 ${
            reportType === 'OVERDUE_RISK'
              ? 'bg-red-50 text-red-700 border-red-600 dark:bg-red-950/40 dark:text-red-200'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          2. Báo Cáo Điểm Nóng Quá Hạn & Rủi Ro Thuế
        </button>

        <button
          onClick={() => setReportType('STAFF_PRODUCTIVITY')}
          className={`py-3 px-4 rounded-t-xl font-bold transition-all border-b-2 ${
            reportType === 'STAFF_PRODUCTIVITY'
              ? 'bg-indigo-50 text-indigo-700 border-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-200'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          3. Báo Cáo Hiệu Suất & Tải Việc Nhân Sự
        </button>

        {canViewFinancials && (
          <button
            onClick={() => setReportType('CUSTOMER_DEBT')}
            className={`py-3 px-4 rounded-t-xl font-bold transition-all border-b-2 ${
              reportType === 'CUSTOMER_DEBT'
                ? 'bg-amber-50 text-amber-700 border-amber-600 dark:bg-amber-950/40 dark:text-amber-200'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            4. Báo Cáo Tình Hình Khách Hàng & Công Nợ
          </button>
        )}
      </div>

      {/* Report Render Body */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
        
        {/* REPORT 1: EXECUTIVE SUMMARY */}
        {reportType === 'EXECUTIVE_SUMMARY' && (
          <div className="space-y-4">
            <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white uppercase">
                BÁO CÁO TIẾN ĐỘ THỰC HIỆN CÔNG VIỆC KỲ THÁNG 08/2026
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Thời điểm trích xuất dữ liệu: {formatDate(CURRENT_SYSTEM_DATE)} 17:00
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Mã</th>
                    <th className="py-2.5 px-3">Nội dung</th>
                    <th className="py-2.5 px-3">Khách hàng</th>
                    <th className="py-2.5 px-3">Phụ trách</th>
                    <th className="py-2.5 px-3">Hạn xử lý</th>
                    <th className="py-2.5 px-3 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {tasks.map(t => (
                    <tr key={t.id}>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{t.code}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{t.title}</td>
                      <td className="py-2.5 px-3">{t.customerName || 'Nội bộ'}</td>
                      <td className="py-2.5 px-3 font-semibold">{t.assigneeName}</td>
                      <td className="py-2.5 px-3">{formatDate(t.dueDate)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${STATUS_LABELS[t.status]?.bg} ${STATUS_LABELS[t.status]?.text}`}>
                          {STATUS_LABELS[t.status]?.label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORT 2: OVERDUE & TAX RISK */}
        {reportType === 'OVERDUE_RISK' && (
          <div className="space-y-4">
            <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-red-700 dark:text-red-400 uppercase">
                BÁO CÁO CÔNG VIỆC QUÁ HẠN & CÓ NGUY CƠ RỦI RO THUẾ
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Danh sách hồ sơ cần Ban Giám Đốc can thiệp và chỉ đạo trực tiếp
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200 font-semibold border-b border-red-200 dark:border-red-800">
                  <tr>
                    <th className="py-2.5 px-3">Mã</th>
                    <th className="py-2.5 px-3">Nội dung vi phạm / Nguy cơ</th>
                    <th className="py-2.5 px-3">Khách hàng</th>
                    <th className="py-2.5 px-3">Phụ trách</th>
                    <th className="py-2.5 px-3">Hạn nộp</th>
                    <th className="py-2.5 px-3 text-center">Mức độ rủi ro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {tasks
                    .filter(t => storageService.getTaskDeadlineStatus(t).isOverdue || t.riskLevel === 'RUI_RO_THUE_PHAP_LY')
                    .map(t => (
                      <tr key={t.id} className="bg-red-50/30 dark:bg-red-950/10">
                        <td className="py-2.5 px-3 font-mono font-bold text-red-600">{t.code}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{t.title}</td>
                        <td className="py-2.5 px-3">{t.customerName}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">{t.assigneeName}</td>
                        <td className="py-2.5 px-3 font-bold text-red-600">{formatDate(t.dueDate)}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${RISK_LABELS[t.riskLevel]?.badgeClass}`}>
                            {RISK_LABELS[t.riskLevel]?.label}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORT 3: STAFF PRODUCTIVITY */}
        {reportType === 'STAFF_PRODUCTIVITY' && (
          <div className="space-y-4">
            <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white uppercase">
                BẢNG TỔNG HỢP HIỆU SUẤT & ĐIỂM KPI NHÂN SỰ
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Nhân sự</th>
                    <th className="py-2.5 px-3">Vị trí</th>
                    <th className="py-2.5 px-3 text-center">Việc giao</th>
                    <th className="py-2.5 px-3 text-center">Đã hoàn thành</th>
                    <th className="py-2.5 px-3 text-center">Quá hạn</th>
                    <th className="py-2.5 px-3 text-center">Tỷ lệ đúng hạn</th>
                    <th className="py-2.5 px-3 text-right">Điểm KPI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {staffKPIs.map(k => (
                    <tr key={k.userId}>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{k.userName}</td>
                      <td className="py-2.5 px-3 text-slate-500">{k.position}</td>
                      <td className="py-2.5 px-3 text-center">{k.totalAssigned}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-600">{k.completedCount}</td>
                      <td className="py-2.5 px-3 text-center text-red-600 font-bold">{k.overdueCount}</td>
                      <td className="py-2.5 px-3 text-center font-semibold text-blue-600">{k.onTimeRate}%</td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-blue-700 dark:text-blue-300">{k.compositeKPIScore}/100</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORT 4: CUSTOMER DEBT */}
        {reportType === 'CUSTOMER_DEBT' && (
          <CustomerDebtReportView
            customers={customers}
            currentUser={currentUser}
            onUpdateCustomer={onUpdateCustomer}
            onDataReload={onDataReload}
          />
        )}

      </div>

      {/* Modal Báo Cáo Tuần Chuẩn Nghị Định 30 */}
      {isWeeklyDocModalOpen && (
        <WeeklyTaskReportModal
          isOpen={isWeeklyDocModalOpen}
          onClose={() => setIsWeeklyDocModalOpen(false)}
          tasks={tasks}
          customers={customers}
          users={users}
          currentUser={currentUser || users[0]}
        />
      )}

    </div>
  );
};

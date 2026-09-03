import { Task, Customer, User } from '../types';
import { formatDate, STATUS_LABELS, RISK_LABELS, PRIORITY_LABELS, getTaskNature } from '../utils/formatters';

export interface WeeklyReportOptions {
  weekTitle: string;
  startDate: string;
  endDate: string;
  reportNumber: string;
  reportDate: string; // e.g. "Hà Nội, ngày 24 tháng 08 năm 2026"
  companyName?: string; // Loaded dynamically from system company info
  departmentName?: string; // e.g. "Phòng Nghiệp Vụ Kế Toán - Thuế"
  reporterName: string;
  reporterTitle: string;
  reviewerName: string;
  reviewerTitle: string;
  approverName: string;
  approverTitle: string;
  selectedStaffId: string; // 'ALL' or user id
  selectedCustomerId: string; // 'ALL' or customer id
  executiveProposal: string;
  tasks: Task[];
  customers: Customer[];
  users: User[];
}

/**
 * Generate Microsoft Word (.doc) document adhering strictly to Vietnam's Decree 30/2020/NĐ-CP
 */
export function generateDecree30WeeklyDocHtml(options: WeeklyReportOptions): string {
  const {
    weekTitle,
    startDate,
    endDate,
    reportNumber,
    reportDate,
    companyName = 'CÔNG TY TNHH ĐẠI LÝ THUẾ THÀNH PHỐ',
    departmentName = 'PHÒNG NGHIỆP VỤ KẾ TOÁN - THUẾ',
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
  } = options;

  // Filter tasks based on options
  const targetTasks = tasks.filter(t => {
    if (selectedStaffId !== 'ALL' && t.assigneeId !== selectedStaffId) return false;
    if (selectedCustomerId !== 'ALL' && t.customerId !== selectedCustomerId) return false;
    return true;
  });

  // Calculate statistics
  const totalTasks = targetTasks.length;
  const completedTasks = targetTasks.filter(t => t.status === 'HOAN_THANH').length;
  const inProgressTasks = targetTasks.filter(t => t.status === 'DANG_THUC_HIEN' || t.status === 'DA_PHAN_CONG').length;
  const pendingReviewTasks = targetTasks.filter(t => t.status === 'CHO_KIEM_TRA' || t.status === 'CHO_PHE_DUYET').length;
  const waitingDocTasks = targetTasks.filter(t => t.status === 'CHO_CHUNG_TU' || t.status === 'CHO_KHACH_HANG').length;
  const overdueTasks = targetTasks.filter(t => t.status === 'QUA_HAN' || (t.status !== 'HOAN_THANH' && t.dueDate < new Date().toISOString().split('T')[0])).length;
  const highRiskTasks = targetTasks.filter(t => t.riskLevel === 'RUI_RO_THUE_PHAP_LY' || t.priority === 'KHAN_CAP').length;

  const onTimeRate = totalTasks > 0 ? Math.round(((totalTasks - overdueTasks) / totalTasks) * 100) : 100;

  // Group tasks by Assignee
  const staffGroups: { staff: User; tasks: Task[] }[] = [];
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
    staffGroups.push({ staff: staffUser, tasks: staffTaskList });
  });

  // List of overdue or critical tasks for Section III
  const criticalOverdueTasks = targetTasks.filter(t => 
    t.status === 'QUA_HAN' || 
    (t.status !== 'HOAN_THANH' && t.dueDate < new Date().toISOString().split('T')[0]) ||
    t.riskLevel === 'RUI_RO_THUE_PHAP_LY'
  );

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:w="urn:schemas-microsoft-com:office:word" 
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>Báo Cáo Công Việc Tuần Chuẩn Nghị Định 30</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page WordSection1 {
          size: 210mm 297mm; /* A4 */
          margin: 20mm 15mm 20mm 25mm; /* Nghị định 30: Trên 20-25, Dưới 20-25, Trái 30-35, Phải 15-20 */
          mso-header-margin: 36.0pt;
          mso-footer-margin: 36.0pt;
          mso-paper-source: 0;
        }
        div.WordSection1 {
          page: WordSection1;
          font-family: "Times New Roman", Times, serif;
          font-size: 13pt;
          line-height: 1.35;
          color: #000000;
        }
        body {
          font-family: "Times New Roman", Times, serif;
          font-size: 13pt;
          line-height: 1.35;
          color: #000000;
          background-color: #ffffff;
        }
        p, div, td, th {
          font-family: "Times New Roman", Times, serif;
          font-size: 13pt;
          line-height: 1.35;
        }
        .header-table {
          width: 100%;
          border-collapse: collapse;
          border: none;
          margin-bottom: 18pt;
        }
        .header-table td {
          border: none;
          padding: 0;
          vertical-align: top;
        }
        .org-name {
          font-size: 12pt;
          font-weight: bold;
          text-transform: uppercase;
          text-align: center;
        }
        .org-sub {
          font-size: 12pt;
          font-weight: bold;
          text-transform: uppercase;
          text-align: center;
        }
        .doc-number {
          font-size: 12pt;
          text-align: center;
          margin-top: 4pt;
        }
        .national-title {
          font-size: 12pt;
          font-weight: bold;
          text-transform: uppercase;
          text-align: center;
        }
        .national-motto {
          font-size: 13pt;
          font-weight: bold;
          text-align: center;
        }
        .location-date {
          font-size: 13pt;
          font-style: italic;
          text-align: center;
          margin-top: 6pt;
        }
        .divider-short {
          width: 35%;
          height: 1px;
          background-color: #000000;
          margin: 4pt auto 0 auto;
        }
        .divider-motto {
          width: 50%;
          height: 1px;
          background-color: #000000;
          margin: 4pt auto 0 auto;
        }
        .report-title-box {
          text-align: center;
          margin-top: 14pt;
          margin-bottom: 14pt;
        }
        .main-title {
          font-size: 15pt;
          font-weight: bold;
          text-transform: uppercase;
          margin-bottom: 4pt;
        }
        .sub-title {
          font-size: 13pt;
          font-weight: bold;
          font-style: italic;
        }
        .recipient-box {
          margin-top: 10pt;
          margin-bottom: 14pt;
          text-align: center;
          font-size: 13pt;
          font-weight: bold;
        }
        .section-heading {
          font-size: 13pt;
          font-weight: bold;
          text-transform: uppercase;
          margin-top: 14pt;
          margin-bottom: 6pt;
        }
        .subsection-heading {
          font-size: 13pt;
          font-weight: bold;
          margin-top: 8pt;
          margin-bottom: 4pt;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8pt;
          margin-bottom: 12pt;
        }
        .data-table th, .data-table td {
          border: 1px solid #000000;
          padding: 5pt 6pt;
          font-size: 11pt;
          vertical-align: middle;
        }
        .data-table th {
          background-color: #f2f2f2;
          font-weight: bold;
          text-align: center;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .font-bold { font-weight: bold; }
        .font-italic { font-style: italic; }
        .highlight-overdue {
          color: #b91c1c;
          font-weight: bold;
        }
        .highlight-warning {
          color: #c2410c;
          font-weight: bold;
        }
        .highlight-ok {
          color: #15803d;
          font-weight: bold;
        }
        .signature-table {
          width: 100%;
          border-collapse: collapse;
          border: none;
          margin-top: 20pt;
          page-break-inside: avoid;
        }
        .signature-table td {
          border: none;
          padding: 0;
          vertical-align: top;
          text-align: center;
        }
        .recipients-col {
          text-align: left !important;
          font-size: 11pt;
          line-height: 1.25;
        }
        .sign-title {
          font-weight: bold;
          font-size: 12pt;
          text-transform: uppercase;
          margin-bottom: 2pt;
        }
        .sign-sub {
          font-style: italic;
          font-size: 11pt;
          margin-bottom: 45pt;
        }
        .sign-name {
          font-weight: bold;
          font-size: 12pt;
        }
      </style>
    </head>
    <body>
      <div class="WordSection1">
        <!-- HEADER THEO NGHỊ ĐỊNH 30/2020/NĐ-CP -->
        <table class="header-table">
          <tr>
            <td style="width: 48%;">
              <div class="org-name">${companyName.toUpperCase()}</div>
              <div class="org-sub">${departmentName.toUpperCase()}</div>
              <div class="divider-short"></div>
              <div class="doc-number">Số: ${reportNumber}</div>
            </td>
            <td style="width: 52%;">
              <div class="national-title">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              <div class="national-motto">Độc lập - Tự do - Hạnh phúc</div>
              <div class="divider-motto"></div>
              <div class="location-date">${reportDate}</div>
            </td>
          </tr>
        </table>

        <!-- TIÊU ĐỀ BÁO CÁO -->
        <div class="report-title-box">
          <div class="main-title">BÁO CÁO ĐỊNH KỲ TUẦN</div>
          <div class="sub-title">V/v Tình hình thực hiện công việc, tiến độ phục vụ từng khách hàng và kiểm soát rủi ro thuế của nhân sự kế toán (${weekTitle})</div>
        </div>

        <div class="recipient-box">
          Kính gửi: Ban Giám đốc ${companyName}
        </div>

        <p style="text-indent: 24pt; text-align: justify;">
          Căn cứ quy chế hoạt động nghiệp vụ, hợp đồng cung cấp dịch vụ đại lý thuế, kế toán trọn gói và dịch vụ doanh nghiệp; ${departmentName} kính báo cáo Ban Giám đốc tình hình thực hiện công việc tuần, tiến độ phụ trách khách hàng của từng nhân sự và các nội dung trọng điểm cần chỉ đạo như sau:
        </p>

        <!-- PHẦN I: TỔNG QUAN -->
        <div class="section-heading">I. TỔNG QUAN TÌNH HÌNH THỰC HIỆN CÔNG VIỆC TRONG TUẦN</div>
        
        <p style="text-indent: 24pt; text-align: justify;">
          Trong kỳ báo cáo từ ngày <strong>${formatDate(startDate)}</strong> đến ngày <strong>${formatDate(endDate)}</strong>, toàn hệ thống ghi nhận tổng số <strong>${totalTasks} công việc</strong> đang được theo dõi, xử lý và kiểm soát chất lượng cho các khách hàng doanh nghiệp và hộ kinh doanh. Cụ thể:
        </p>

        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 8%;">STT</th>
              <th style="width: 42%;">Chỉ tiêu theo dõi</th>
              <th style="width: 25%;">Số lượng công việc</th>
              <th style="width: 25%;">Tỷ lệ / Đánh giá</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="text-center">1</td>
              <td><strong>Tổng số đầu việc phân công thực hiện</strong></td>
              <td class="text-center font-bold">${totalTasks} việc</td>
              <td class="text-center">100%</td>
            </tr>
            <tr>
              <td class="text-center">2</td>
              <td>Công việc đã hoàn thành đúng chuẩn hồ sơ</td>
              <td class="text-center font-bold highlight-ok">${completedTasks} việc</td>
              <td class="text-center highlight-ok">${totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0}%</td>
            </tr>
            <tr>
              <td class="text-center">3</td>
              <td>Công việc đang thực hiện (trong hạn xử lý)</td>
              <td class="text-center font-bold">${inProgressTasks} việc</td>
              <td class="text-center">${totalTasks > 0 ? ((inProgressTasks / totalTasks) * 100).toFixed(1) : 0}%</td>
            </tr>
            <tr>
              <td class="text-center">4</td>
              <td>Công việc đang chờ KTT / Trưởng phòng soát xét duyệt</td>
              <td class="text-center font-bold">${pendingReviewTasks} việc</td>
              <td class="text-center">${totalTasks > 0 ? ((pendingReviewTasks / totalTasks) * 100).toFixed(1) : 0}%</td>
            </tr>
            <tr>
              <td class="text-center">5</td>
              <td>Công việc chờ chứng từ / hóa đơn từ phía khách hàng</td>
              <td class="text-center font-bold highlight-warning">${waitingDocTasks} việc</td>
              <td class="text-center">${totalTasks > 0 ? ((waitingDocTasks / totalTasks) * 100).toFixed(1) : 0}%</td>
            </tr>
            <tr>
              <td class="text-center">6</td>
              <td><strong>Công việc quá hạn / Chậm tiến độ</strong></td>
              <td class="text-center font-bold highlight-overdue">${overdueTasks} việc</td>
              <td class="text-center highlight-overdue">${totalTasks > 0 ? ((overdueTasks / totalTasks) * 100).toFixed(1) : 0}%</td>
            </tr>
            <tr>
              <td class="text-center">7</td>
              <td>Hồ sơ cảnh báo rủi ro Thuế / Pháp lý cao cần lưu ý</td>
              <td class="text-center font-bold highlight-overdue">${highRiskTasks} việc</td>
              <td class="text-center">Đang kiểm soát</td>
            </tr>
            <tr>
              <td class="text-center">8</td>
              <td><strong>Tỷ lệ hoàn thành & kiểm soát đúng hạn chung</strong></td>
              <td class="text-center font-bold highlight-ok" colspan="2"><strong>${onTimeRate}%</strong></td>
            </tr>
          </tbody>
        </table>

        <!-- PHẦN II: CHI TIẾT TỪNG NHÂN VIÊN THỰC HIỆN CHO TỪNG KHÁCH HÀNG -->
        <div class="section-heading">II. BẢNG TỔNG HỢP CHI TIẾT CÔNG VIỆC TỪNG NHÂN VIÊN THỰC HIỆN CHO TỪNG KHÁCH HÀNG</div>
        <p style="text-indent: 24pt; text-align: justify;">
          Dưới đây là chi tiết phân công công việc 100% tự động và tiến độ hoàn thành của từng chuyên viên kế toán đối với từng doanh nghiệp, hộ kinh doanh phụ trách:
        </p>

        ${staffGroups.map((group, groupIdx) => {
          const staffTotal = group.tasks.length;
          const staffCompleted = group.tasks.filter(t => t.status === 'HOAN_THANH').length;
          const staffOverdue = group.tasks.filter(t => t.status === 'QUA_HAN' || (t.status !== 'HOAN_THANH' && t.dueDate < new Date().toISOString().split('T')[0])).length;
          const staffOnTime = staffTotal > 0 ? Math.round(((staffTotal - staffOverdue) / staffTotal) * 100) : 100;

          return `
            <div class="subsection-heading">
              ${groupIdx + 1}. Nhân sự: <strong>${group.staff.name}</strong> (${group.staff.position || 'Chuyên viên Kế toán'}) - Tổng số: ${staffTotal} việc (Đã xong: ${staffCompleted} | Quá hạn: <span class="${staffOverdue > 0 ? 'highlight-overdue' : ''}">${staffOverdue}</span> | Tỷ lệ: ${staffOnTime}%)
            </div>

            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 5%;">STT</th>
                  <th style="width: 12%;">Mã việc</th>
                  <th style="width: 24%;">Khách hàng (MST)</th>
                  <th style="width: 25%;">Nội dung công việc & Phân loại</th>
                  <th style="width: 10%;">Hạn nộp</th>
                  <th style="width: 12%;">Tiến độ</th>
                  <th style="width: 12%;">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                ${group.tasks.map((task, taskIdx) => {
                  const nature = getTaskNature(task);
                  const isOverdue = task.status === 'QUA_HAN' || (task.status !== 'HOAN_THANH' && task.dueDate < new Date().toISOString().split('T')[0]);
                  const completedSteps = task.workflowSteps.filter(s => s.isCompleted).length;
                  const totalSteps = task.workflowSteps.length;
                  const percent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : (task.status === 'HOAN_THANH' ? 100 : 0);

                  return `
                    <tr>
                      <td class="text-center">${taskIdx + 1}</td>
                      <td class="text-center font-bold">${task.code}</td>
                      <td>
                        <strong>${task.customerName || 'Nội bộ'}</strong><br/>
                        <span style="font-size: 10pt; color: #555555;">MST: ${task.customerTaxCode || '---'}</span>
                      </td>
                      <td>
                        <strong>${task.title}</strong><br/>
                        <span style="font-size: 10pt; color: #0284c7;">
                          ${nature === 'PERIODIC' ? '[Định kỳ theo Gói]' : '[Phát sinh dịch vụ vụ việc]'}
                          ${task.taxPeriod ? ` - Kỳ: ${task.taxPeriod}` : ''}
                        </span>
                      </td>
                      <td class="text-center ${isOverdue ? 'highlight-overdue' : ''}">
                        ${formatDate(task.dueDate)}
                      </td>
                      <td class="text-center">
                        ${percent}% (${completedSteps}/${totalSteps} bước)
                      </td>
                      <td class="text-center ${isOverdue ? 'highlight-overdue' : ''}">
                        ${STATUS_LABELS[task.status]?.label || task.status}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          `;
        }).join('')}

        <!-- PHẦN III: DANH MỤC CÔNG VIỆC QUÁ HẠN & CẢNH BÁO RỦI RO -->
        <div class="section-heading">III. DANH MỤC CÔNG VIỆC QUÁ HẠN, CHẬM TIẾN ĐỘ & CẢNH BÁO RỦI RO THUẾ</div>
        <p style="text-indent: 24pt; text-align: justify;">
          Danh sách các hồ sơ công việc đang chậm tiến độ, phát sinh rủi ro thuế pháp lý hoặc chờ khách hàng phối hợp cung cấp tài liệu cần Ban Giám Đốc lưu ý chỉ đạo:
        </p>

        ${criticalOverdueTasks.length > 0 ? `
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 5%;">STT</th>
                <th style="width: 10%;">Mã việc</th>
                <th style="width: 20%;">Khách hàng (MST)</th>
                <th style="width: 22%;">Nội dung việc & Rủi ro</th>
                <th style="width: 13%;">Nhân sự / KTT</th>
                <th style="width: 10%;">Hạn chót</th>
                <th style="width: 20%;">Nguyên nhân & Đề xuất xử lý</th>
              </tr>
            </thead>
            <tbody>
              ${criticalOverdueTasks.map((t, idx) => {
                const isOverdue = t.status === 'QUA_HAN' || (t.status !== 'HOAN_THANH' && t.dueDate < new Date().toISOString().split('T')[0]);
                return `
                  <tr>
                    <td class="text-center">${idx + 1}</td>
                    <td class="text-center font-bold">${t.code}</td>
                    <td>
                      <strong>${t.customerName || 'Nội bộ'}</strong><br/>
                      <span style="font-size: 10pt; color: #555555;">MST: ${t.customerTaxCode || '---'}</span>
                    </td>
                    <td>
                      <strong>${t.title}</strong><br/>
                      <span class="highlight-overdue" style="font-size: 10pt;">
                        [${RISK_LABELS[t.riskLevel]?.label || 'Rủi ro cao'}] - ${PRIORITY_LABELS[t.priority]?.label || 'Ưu tiên'}
                      </span>
                    </td>
                    <td>
                      ${t.assigneeName}<br/>
                      <span style="font-size: 10pt; color: #555555;">Duyệt: ${t.reviewerName || 'KTT'}</span>
                    </td>
                    <td class="text-center highlight-overdue">
                      ${formatDate(t.dueDate)}<br/>
                      <span style="font-size: 9pt;">${isOverdue ? '(Đã quá hạn)' : '(Cận hạn)'}</span>
                    </td>
                    <td style="font-size: 10.5pt;">
                      ${t.status === 'CHO_CHUNG_TU' 
                        ? 'Khách hàng chưa bàn giao đủ hóa đơn chứng từ đầu vào/đầu ra. Đã phát công văn/thông báo nhắc nhở.' 
                        : t.status === 'CHO_KIEM_TRA' 
                        ? 'Chuyên viên đã lập xong tờ khai/báo cáo, đang chờ Kế toán trưởng kiểm tra soát xét tính hợp lệ.' 
                        : isOverdue 
                        ? 'Hồ sơ bị chậm tiến độ thực tế, đã kích hoạt quy trình hỗ trợ nghiệp vụ khẩn cấp.'
                        : 'Phát sinh hóa đơn có dấu hiệu rủi ro thuế, cần đối soát tài khoản thanh toán không dùng tiền mặt.'}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        ` : `
          <p style="text-indent: 24pt; font-style: italic; color: #15803d;">
            (Ghi nhận: Trong tuần không có công việc nào rơi vào tình trạng quá hạn nghiêm trọng hoặc phát sinh rủi ro thuế không kiểm soát được).
          </p>
        `}

        <!-- PHẦN IV: ĐỀ XUẤT KIẾN NGHỊ -->
        <div class="section-heading">IV. ĐỀ XUẤT, KIẾN NGHỊ BAN GIÁM ĐỐC CHỈ ĐẠO</div>
        <p style="text-indent: 24pt; text-align: justify;">
          Để đảm bảo tiến độ phục vụ khách hàng tuần tiếp theo đạt chất lượng tốt nhất, Phòng Nghiệp vụ Kế toán - Thuế trân trọng đề xuất Ban Giám Đốc chỉ đạo:
        </p>
        <div style="margin-left: 24pt; text-align: justify; font-style: normal; line-height: 1.4;">
          ${executiveProposal.split('\n').map(p => p.trim()).filter(Boolean).map(line => `<p style="margin-bottom: 4pt;">- ${line}</p>`).join('')}
        </div>

        <p style="text-indent: 24pt; text-align: justify; margin-top: 10pt;">
          Kính trình Ban Giám đốc xem xét, cho ý kiến chỉ đạo thực hiện./.
        </p>

        <!-- NƠI NHẬN & CHỮ KÝ THEO NGHỊ ĐỊNH 30/2020/NĐ-CP -->
        <table class="signature-table">
          <tr>
            <td class="recipients-col" style="width: 38%;">
              <div style="font-weight: bold; font-style: italic; text-decoration: underline; margin-bottom: 3pt;">Nơi nhận:</div>
              <div>- Như Kính gửi (để b/c);</div>
              <div>- ${departmentName} (để t/h);</div>
              <div>- Phòng HC-NS & CSKH (để p/h);</div>
              <div>- Lưu: VT, HS.${reportNumber.split('/')[0] || ''}.</div>
            </td>
            <td style="width: 31%;">
              <div class="sign-title">${reviewerTitle}</div>
              <div class="sign-sub">(Ký, họ và tên)</div>
              <div class="sign-name">${reviewerName}</div>
            </td>
            <td style="width: 31%;">
              <div class="sign-title">${approverTitle}</div>
              <div class="sign-sub">(Ký, đóng dấu, họ và tên)</div>
              <div class="sign-name">${approverName}</div>
            </td>
          </tr>
        </table>

      </div>
    </body>
    </html>
  `;
}

/**
 * Trigger download of the generated HTML as a .doc (Microsoft Word Document) file
 */
export function downloadDecree30DocFile(options: WeeklyReportOptions): void {
  const htmlContent = generateDecree30WeeklyDocHtml(options);
  const blob = new Blob(['\ufeff' + htmlContent], {
    type: 'application/msword;charset=utf-8',
  });
  
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  
  const sanitizedTitle = options.weekTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStamp = new Date().toISOString().split('T')[0];
  downloadLink.download = `Bao_Cao_Tuan_Ban_Giam_Doc_ND30_${sanitizedTitle}_${dateStamp}.doc`;
  
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
}

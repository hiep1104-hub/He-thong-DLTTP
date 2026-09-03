import React, { useState, useMemo } from 'react';
import { Customer, Task, User, ChecklistTemplate, Department, TaskPriority, TaskRiskLevel, TaxObligationType, RecurringFrequency, AdHocServiceItem, HRWorkflowSOP } from '../../types';
import { X, Plus, Sparkles, Calendar, UserCheck, ShieldAlert, CheckCircle2, ChevronDown, ChevronUp, Layers, Tag, AlertTriangle } from 'lucide-react';
import { AD_HOC_SERVICES } from '../../data/adHocServices';
import { formatCurrency } from '../../utils/formatters';
import { storageService } from '../../services/storageService';

interface TaskCreateModalProps {
  customers: Customer[];
  users: User[];
  templates: ChecklistTemplate[];
  currentUser: User;
  onClose: () => void;
  onCreateTask: (newTask: Task) => void;
  preselectedCustomer?: Customer;
  preselectedAdHocService?: AdHocServiceItem;
  preselectedHRWorkflow?: HRWorkflowSOP;
}

export const TaskCreateModal: React.FC<TaskCreateModalProps> = ({
  customers,
  users,
  templates,
  currentUser,
  onClose,
  onCreateTask,
  preselectedCustomer,
  preselectedAdHocService,
  preselectedHRWorkflow,
}) => {
  // Preset source: NONE, ADHOC, TEMPLATE
  const [selectedServiceCode, setSelectedServiceCode] = useState<string>(preselectedAdHocService?.code || '');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Form states
  const initialTitle = preselectedHRWorkflow
    ? `${preselectedHRWorkflow.title} - ${preselectedCustomer?.name || '[Khách hàng]'}`
    : preselectedAdHocService 
    ? `${preselectedAdHocService.name} - ${preselectedCustomer?.name || '[Khách hàng]'}` 
    : '';

  const initialDesc = preselectedHRWorkflow
    ? `${preselectedHRWorkflow.description}\nCăn cứ pháp lý: ${preselectedHRWorkflow.legalBasis}`
    : preselectedAdHocService?.description || '';

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDesc);
  const [customerId, setCustomerId] = useState<string>(preselectedCustomer?.id || (customers[0]?.id || ''));
  const [department, setDepartment] = useState<Department>(
    preselectedHRWorkflow ? 'HANH_CHINH_NHAN_SU' : (preselectedAdHocService?.department || 'KE_TOAN_THUE')
  );
  
  // Operational assignees (excluding Admin/USR-030 as Admin is a system account)
  const operationalUsers = useMemo(() => {
    return users.filter(u => u.role !== 'ADMIN' && u.id !== 'USR-030' && u.active !== false);
  }, [users]);

  const approverCandidates = useMemo(() => {
    const bgd = users.filter(u => u.role === 'BAN_GIAM_DOC' && u.active !== false);
    if (bgd.length > 0) return bgd;
    const tp = users.filter(u => u.role === 'TRUONG_PHONG' && u.active !== false);
    if (tp.length > 0) return tp;
    return operationalUsers;
  }, [users, operationalUsers]);

  // Assignees
  const [assigneeId, setAssigneeId] = useState<string>(() => {
    if (preselectedHRWorkflow) return 'USR-005';
    if (preselectedCustomer?.assignedStaffId && preselectedCustomer.assignedStaffId !== 'USR-030') {
      return preselectedCustomer.assignedStaffId;
    }
    return operationalUsers[0]?.id || 'USR-003';
  });

  const [reviewerId, setReviewerId] = useState<string>(() => {
    if (preselectedCustomer?.reviewerStaffId && preselectedCustomer.reviewerStaffId !== 'USR-030') {
      return preselectedCustomer.reviewerStaffId;
    }
    const lead = operationalUsers.find(u => u.role === 'TRUONG_PHONG' || u.role === 'TRUONG_NHOM');
    return lead?.id || operationalUsers[0]?.id || 'USR-003';
  });

  const [approverId, setApproverId] = useState<string>(() => {
    return approverCandidates[0]?.id || 'USR-003';
  });

  // Time & Priority
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [priority, setPriority] = useState<TaskPriority>(preselectedAdHocService?.defaultPriority || 'CAO');
  const [riskLevel, setRiskLevel] = useState<TaskRiskLevel>(preselectedAdHocService?.defaultRiskLevel || 'TRUNG_BINH');

  // Tax & Recurring
  const [isTaxObligation, setIsTaxObligation] = useState<boolean>(true);
  const [taxType, setTaxType] = useState<TaxObligationType>('GTGT');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurringFrequency, setRecurringFrequency] = useState<RecurringFrequency>('HANG_THANG');

  // Live Duplicate Check
  const duplicateTaskWarning = useMemo(() => {
    return storageService.checkDuplicateTask({
      customerId,
      taxType: isTaxObligation ? taxType : undefined,
      taxPeriod: isTaxObligation ? `T${new Date().getMonth() + 1}/${new Date().getFullYear()}` : undefined,
      serviceCode: selectedServiceCode || undefined,
      title,
    });
  }, [customerId, isTaxObligation, taxType, selectedServiceCode, title]);

  // Handle Quick Service Template Change
  const handleServiceSelect = (serviceCode: string) => {
    setSelectedServiceCode(serviceCode);
    setSelectedTemplateId('');
    if (!serviceCode) return;

    const service = AD_HOC_SERVICES.find(s => s.code === serviceCode);
    if (!service) return;

    const cust = customers.find(c => c.id === customerId);
    const custName = cust ? cust.name : '[Khách hàng]';

    setTitle(`${service.name} - ${custName}`);
    setDescription(service.description);
    setDepartment(service.department);
    setPriority(service.defaultPriority);
    setRiskLevel(service.defaultRiskLevel);
    setIsTaxObligation(service.group === 'THUE_THANH_TRA_RUI_RO' || service.group === 'THUE_CHO_THUE_TAI_SAN');
  };

  // Handle Periodic Template Change
  const handleTemplateSelect = (tmplId: string) => {
    setSelectedTemplateId(tmplId);
    setSelectedServiceCode('');
    if (!tmplId) return;

    const tmpl = templates.find(t => t.id === tmplId);
    if (!tmpl) return;

    const cust = customers.find(c => c.id === customerId);
    const custName = cust ? cust.name : '[Khách hàng]';

    setTitle(`${tmpl.title} - ${custName}`);
    setDescription(tmpl.description);
    setDepartment(tmpl.department);
    setPriority(tmpl.defaultPriority);
    setRiskLevel(tmpl.defaultRiskLevel);
    setIsTaxObligation(tmpl.isTaxObligation);
    if (tmpl.taxType) setTaxType(tmpl.taxType);
    setIsRecurring(true);
  };

  // Handle Customer Change
  const handleCustomerChange = (newCustId: string) => {
    setCustomerId(newCustId);
    const cust = customers.find(c => c.id === newCustId);
    if (cust) {
      if (cust.assignedStaffId) setAssigneeId(cust.assignedStaffId);
      if (cust.reviewerStaffId) setReviewerId(cust.reviewerStaffId);

      if (title.includes('[Khách hàng]')) {
        setTitle(title.replace('[Khách hàng]', cust.name));
      } else if (!title) {
        setTitle(`Nghiệp vụ thuế - ${cust.name}`);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const selectedCust = customers.find(c => c.id === customerId);
    const selectedAssignee = users.find(u => u.id === assigneeId);
    const selectedReviewer = users.find(u => u.id === reviewerId);
    const selectedApprover = users.find(u => u.id === approverId);
    const selectedService = AD_HOC_SERVICES.find(s => s.code === selectedServiceCode);
    const tmpl = templates.find(t => t.id === selectedTemplateId);

    const timestamp = Date.now();
    const taskCode = `TSK-${dueDate.replace(/-/g, '').slice(0, 6)}-${Math.floor(Math.random() * 899 + 100)}`;

    // Generate workflow steps
    let workflowSteps = [];
    if (preselectedHRWorkflow) {
      workflowSteps = preselectedHRWorkflow.steps.map((w, idx) => ({
        id: `ws-${timestamp}-${idx}`,
        order: w.order,
        name: w.name,
        isCompleted: false,
        isMandatory: true,
        requiredEvidence: Boolean(w.requiredDocument),
      }));
    } else if (selectedService) {
      workflowSteps = selectedService.suggestedWorkflow.map((w, idx) => ({
        id: `ws-${timestamp}-${idx}`,
        order: idx + 1,
        name: w.name,
        isCompleted: false,
        isMandatory: w.isMandatory,
        requiredEvidence: w.requiredEvidence,
      }));
    } else if (tmpl) {
      workflowSteps = tmpl.defaultWorkflow.map((w, idx) => ({
        id: `ws-${timestamp}-${idx}`,
        order: idx + 1,
        name: w.name,
        isCompleted: false,
        isMandatory: w.isMandatory,
        requiredEvidence: w.requiredEvidence,
      }));
    } else {
      workflowSteps = [
        { id: `ws-${timestamp}-1`, order: 1, name: '1. Tiếp nhận & Thu thập hồ sơ chứng từ', isCompleted: false, isMandatory: true },
        { id: `ws-${timestamp}-2`, order: 2, name: '2. Xử lý nghiệp vụ & Lập báo cáo/tờ khai', isCompleted: false, isMandatory: true },
        { id: `ws-${timestamp}-3`, order: 3, name: '3. Kế toán trưởng kiểm soát', isCompleted: false, isMandatory: true },
        { id: `ws-${timestamp}-4`, order: 4, name: '4. Giám đốc duyệt & Ký số nộp CQT/Cơ quan', isCompleted: false, isMandatory: true, requiredEvidence: true },
        { id: `ws-${timestamp}-5`, order: 5, name: '5. Hoàn tất & Trả kết quả cho khách hàng', isCompleted: false, isMandatory: true, requiredEvidence: true },
      ];
    }

    // Generate checklist
    let checklist = [];
    if (preselectedHRWorkflow) {
      checklist = preselectedHRWorkflow.checklist.map((c, idx) => ({
        id: `cl-${timestamp}-${idx}`,
        title: c,
        isCompleted: false,
        required: true,
      }));
    } else if (selectedService) {
      checklist = selectedService.suggestedChecklist.map((c, idx) => ({
        id: `cl-${timestamp}-${idx}`,
        title: c.title,
        isCompleted: false,
        required: c.required,
      }));
    } else if (tmpl) {
      checklist = tmpl.defaultChecklist.map((c, idx) => ({
        id: `cl-${timestamp}-${idx}`,
        title: c.title,
        isCompleted: false,
        required: c.required,
      }));
    } else {
      checklist = [
        { id: `cl-${timestamp}-1`, title: 'Thu thập đầy đủ hồ sơ pháp lý / hóa đơn gốc', isCompleted: false, required: true },
        { id: `cl-${timestamp}-2`, title: 'Kiểm tra tính hợp lệ, hợp lý của chứng từ', isCompleted: false, required: true },
        { id: `cl-${timestamp}-3`, title: 'Lưu bằng chứng xác nhận nộp thành công', isCompleted: false, required: true },
      ];
    }

    const newTask: Task = {
      id: `TSK-${timestamp}`,
      code: taskCode,
      title: title.trim(),
      description: description.trim(),
      customerId: selectedCust?.id,
      customerName: selectedCust?.name,
      customerTaxCode: selectedCust?.taxCode,
      department,
      category: department === 'KE_TOAN_THUE' ? 'THUE_KE_TOAN' :
                department === 'HANH_CHINH_NHAN_SU' ? 'HANH_CHINH_NHAN_SU' :
                department === 'KINH_DOANH_CSKH' ? 'CSKH_HOP_DONG' : 'QUAN_LY_NOI_BO',
      createdById: currentUser.id,
      createdByName: currentUser.name,
      assigneeId: selectedAssignee?.id || currentUser.id,
      assigneeName: selectedAssignee?.name || currentUser.name,
      reviewerId: selectedReviewer?.id || 'USR-003',
      reviewerName: selectedReviewer?.name || 'Trần Thị Mai',
      approverId: selectedApprover?.id || 'USR-030',
      approverName: selectedApprover?.name || 'Quản Trị Hệ Thống (Admin)',
      createdAt: new Date().toISOString(),
      dueDate,
      dueTime: '17:00',
      priority,
      riskLevel,
      status: 'DA_PHAN_CONG',
      workflowSteps,
      checklist,
      attachments: [],
      comments: [],
      isRecurring,
      recurringRule: isRecurring ? {
        enabled: true,
        frequency: recurringFrequency,
        interval: 1,
        dayOfMonth: 20,
        autoCreateNext: true,
      } : undefined,
      isTaxObligation,
      taxType: isTaxObligation ? taxType : undefined,
      taxPeriod: isTaxObligation ? 'Tháng 08/2026' : undefined,
      serviceCode: selectedService?.code,
      serviceName: selectedService?.name,
      serviceExecutionType: selectedService?.executionType,
      serviceFee: selectedService?.fee,
      serviceFeeDisplay: selectedService?.feeDisplay,
      tags: selectedService ? ['DỊCH VỤ PHÁT SINH', selectedService.groupName] : undefined,
      updatedAt: new Date().toISOString(),
    };

    onCreateTask(newTask);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Giao Việc & Phân Công Nhanh
              </h2>
              <p className="text-xs text-slate-500">
                Nhập nhanh thông tin hoặc chọn mẫu quy trình/dịch vụ có sẵn
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto max-h-[82vh]">
          
          {/* Live Anti-Duplicate Task Warning */}
          {duplicateTaskWarning && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700/60 rounded-xl text-amber-900 dark:text-amber-200 flex items-start space-x-2.5 animate-in fade-in slide-in-from-top-1">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold text-xs">Phát Hiện Phiếu Việc Trùng Lặp</div>
                <div className="mt-0.5 text-[11px] text-amber-800 dark:text-amber-300">{duplicateTaskWarning.message}</div>
              </div>
            </div>
          )}

          {/* Quick Select: Template or Ad-Hoc Service */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50">
            <div>
              <label className="block font-bold text-blue-900 dark:text-blue-300 mb-1 flex items-center space-x-1">
                <Tag className="h-3.5 w-3.5 text-blue-600" />
                <span>Chọn từ 49 Dịch vụ phát sinh:</span>
              </label>
              <select
                value={selectedServiceCode}
                onChange={(e) => handleServiceSelect(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg text-xs font-semibold focus:outline-none"
              >
                <option value="">-- Tự nhập việc hoặc chọn dịch vụ --</option>
                <optgroup label="I. PHÁP LÝ DOANH NGHIỆP & BHXH (18 THỦ TỤC)">
                  {AD_HOC_SERVICES.filter(s => s.code.startsWith('PL-')).map(s => (
                    <option key={s.code} value={s.code}>
                      [{s.code}] {s.name} ({s.feeDisplay})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="II. KẾ TOÁN – THUẾ & GIẢI TRÌNH THANH TRA (31 DỊCH VỤ)">
                  {AD_HOC_SERVICES.filter(s => s.code.startsWith('KT-')).map(s => (
                    <option key={s.code} value={s.code}>
                      [{s.code}] {s.name} ({s.feeDisplay})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block font-bold text-indigo-900 dark:text-indigo-300 mb-1 flex items-center space-x-1">
                <Layers className="h-3.5 w-3.5 text-indigo-600" />
                <span>Hoặc Quy trình mẫu định kỳ:</span>
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 rounded-lg text-xs font-semibold focus:outline-none"
              >
                <option value="">-- Chọn quy trình mẫu (GTGT, TNCN, BCTC...) --</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 1: Customer & Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Khách hàng / Doanh nghiệp <span className="text-red-500">*</span>
              </label>
              <select
                value={customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} (MST: {c.taxCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Chuyên viên thực hiện <span className="text-red-500">*</span>
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                {operationalUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Title */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tên công việc / Yêu cầu <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Lập và nộp tờ khai thuế GTGT Tháng 07/2026"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          {/* Row 3: Deadline, Priority, Department */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Hạn nộp (Deadline) <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Mức độ ưu tiên
              </label>
              <select
                value={priority}
                onChange={(e: any) => setPriority(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none"
              >
                <option value="THAP">Thấp</option>
                <option value="TRUNG_BINH">Trung bình</option>
                <option value="CAO">Cao</option>
                <option value="KHAN_CAP">Khẩn cấp</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Phòng ban
              </label>
              <select
                value={department}
                onChange={(e: any) => setDepartment(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none"
              >
                <option value="KE_TOAN_THUE">Kế Toán – Thuế</option>
                <option value="HANH_CHINH_NHAN_SU">Hành Chính – Nhân Sự</option>
                <option value="KINH_DOANH_CSKH">Kinh Doanh – CSKH</option>
                <option value="BAN_GIAM_DOC">Ban Giám Đốc</option>
              </select>
            </div>
          </div>

          {/* Row 4: Description */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Ghi chú / Hướng dẫn thực hiện
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ghi chú hồ sơ cần chuẩn bị, thỏa thuận phí, yêu cầu kiểm tra..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Collapsible Advanced Settings (Reviewer, Approver, Tax & Recurring) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-bold cursor-pointer"
            >
              {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              <span>{showAdvanced ? 'Ẩn tùy chọn nâng cao' : 'Hiện tùy chọn nâng cao (Người kiểm tra, Phê duyệt, Nghĩa vụ thuế, Lặp lại)'}</span>
            </button>

            {showAdvanced && (
              <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 space-y-3 animate-in fade-in duration-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Người kiểm tra (KTT / Trưởng nhóm)
                    </label>
                    <select
                      value={reviewerId}
                      onChange={(e) => setReviewerId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                    >
                      {operationalUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Người phê duyệt (Giám đốc)
                    </label>
                    <select
                      value={approverId}
                      onChange={(e) => setApproverId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                    >
                      {approverCandidates.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="space-y-1.5">
                    <label className="flex items-center space-x-2 font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isTaxObligation}
                        onChange={(e) => setIsTaxObligation(e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span>Nghĩa vụ thuế bắt buộc</span>
                    </label>
                    {isTaxObligation && (
                      <select
                        value={taxType}
                        onChange={(e: any) => setTaxType(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      >
                        <option value="GTGT">Thuế GTGT</option>
                        <option value="TNCN">Thuế TNCN</option>
                        <option value="TNDN">Thuế TNDN</option>
                        <option value="HOA_DON">Hóa đơn điện tử</option>
                        <option value="BCTC">BCTC & Quyết toán</option>
                        <option value="BHXH">Bảo hiểm xã hội</option>
                      </select>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center space-x-2 font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isRecurring}
                        onChange={(e) => setIsRecurring(e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span>Lặp lại định kỳ</span>
                    </label>
                    {isRecurring && (
                      <select
                        value={recurringFrequency}
                        onChange={(e: any) => setRecurringFrequency(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      >
                        <option value="HANG_THANG">Hàng tháng (Ngày 20 hàng tháng)</option>
                        <option value="HANG_QUY">Hàng quý</option>
                        <option value="HANG_NAM">Hàng năm</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition-all flex items-center space-x-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Giao Việc Ngay</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

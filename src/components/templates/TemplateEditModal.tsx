import React, { useState, useEffect } from 'react';
import { ChecklistTemplate, Department, TaskCategory, TaskPriority, TaskRiskLevel, TaxObligationType, User } from '../../types';
import { storageService } from '../../services/storageService';
import { 
  X, 
  Save, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  ShieldAlert, 
  Scale, 
  CheckSquare, 
  Sparkles, 
  FileText, 
  Layers, 
  AlertCircle,
  HelpCircle,
  Gavel,
  RefreshCw,
  FileCheck2,
  Paperclip,
  Lock,
  Eye
} from 'lucide-react';
import { DEPARTMENT_LABELS, RISK_LABELS, PRIORITY_LABELS } from '../../utils/formatters';
import { PermissionService } from '../../utils/permissions';

interface TemplateEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  template?: ChecklistTemplate | null;
  currentUser?: User;
  onSaved: (savedTemplate: ChecklistTemplate) => void;
  onDeleted?: (deletedTemplateId: string) => void;
}

export const TemplateEditModal: React.FC<TemplateEditModalProps> = ({
  isOpen,
  onClose,
  template,
  currentUser,
  onSaved,
  onDeleted,
}) => {
  const isNew = !template;
  const canManage = PermissionService.canManageTemplates(currentUser);

  // Form State
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState<Department>('KE_TOAN_THUE');
  const [category, setCategory] = useState<TaskCategory>('KE_KHAI_THUE');
  const [description, setDescription] = useState('');
  const [defaultPriority, setDefaultPriority] = useState<TaskPriority>('TRUNG_BINH');
  const [defaultRiskLevel, setDefaultRiskLevel] = useState<TaskRiskLevel>('TRUNG_BINH');
  const [isTaxObligation, setIsTaxObligation] = useState(true);
  const [taxType, setTaxType] = useState<TaxObligationType>('GTGT');
  const [changeReason, setChangeReason] = useState('');

  // Workflow steps
  const [workflowSteps, setWorkflowSteps] = useState<{ name: string; isMandatory: boolean; requiredEvidence: boolean }[]>([]);

  // Checklist items
  const [checklistItems, setChecklistItems] = useState<{ title: string; required: boolean }[]>([]);

  // Error message
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize or reset form
  useEffect(() => {
    if (template) {
      setCode(template.code || '');
      setTitle(template.title || '');
      setDepartment(template.department || 'KE_TOAN_THUE');
      setCategory(template.category || 'KE_KHAI_THUE');
      setDescription(template.description || '');
      setDefaultPriority(template.defaultPriority || 'TRUNG_BINH');
      setDefaultRiskLevel(template.defaultRiskLevel || 'TRUNG_BINH');
      setIsTaxObligation(template.isTaxObligation !== undefined ? template.isTaxObligation : true);
      setTaxType(template.taxType || 'GTGT');
      setChangeReason('');
      setWorkflowSteps(template.defaultWorkflow ? [...template.defaultWorkflow] : []);
      setChecklistItems(template.defaultChecklist ? [...template.defaultChecklist] : []);
    } else {
      // Default new template
      setCode(`TMPL_NEW_${Math.floor(100 + Math.random() * 900)}`);
      setTitle('');
      setDepartment('KE_TOAN_THUE');
      setCategory('KE_KHAI_THUE');
      setDescription('');
      setDefaultPriority('TRUNG_BINH');
      setDefaultRiskLevel('TRUNG_BINH');
      setIsTaxObligation(true);
      setTaxType('GTGT');
      setChangeReason('Ban hành quy trình chuẩn mới theo quy định pháp luật');
      setWorkflowSteps([
        { name: 'Thu thập & Kiểm tra tính hợp lệ của chứng từ, hóa đơn', isMandatory: true, requiredEvidence: true },
        { name: 'Nhập liệu, xử lý nghiệp vụ trên phần mềm kế toán', isMandatory: true, requiredEvidence: false },
        { name: 'Kế toán trưởng kiểm soát, đối chiếu và duyệt số liệu', isMandatory: true, requiredEvidence: true },
        { name: 'Ký số tờ khai / Báo cáo và nộp đến cơ quan quản lý', isMandatory: true, requiredEvidence: true },
        { name: 'Lưu trữ thông báo tiếp nhận / kết quả và bàn giao khách hàng', isMandatory: true, requiredEvidence: true },
      ]);
      setChecklistItems([
        { title: 'Kiểm tra hóa đơn đầu vào trên 5 triệu có chứng từ thanh toán không dùng tiền mặt', required: true },
        { title: 'Đối chiếu doanh thu trên tờ khai với dữ liệu hóa đơn điện tử Tổng cục Thuế', required: true },
        { title: 'Rà soát danh sách nhà cung cấp cảnh báo rủi ro thuế / ngưng hoạt động', required: true },
        { title: 'Lưu biên lai nộp tiền thuế / Thông báo chấp nhận tờ khai của CQT', required: true },
      ]);
    }
    setErrorMessage(null);
  }, [template, isOpen]);

  if (!isOpen) return null;

  // Workflow Handlers
  const handleAddWorkflowStep = () => {
    setWorkflowSteps([
      ...workflowSteps,
      { name: `Bước ${workflowSteps.length + 1}: Kiểm soát & xử lý nghiệp vụ`, isMandatory: true, requiredEvidence: false },
    ]);
  };

  const handleUpdateWorkflowStep = (index: number, field: 'name' | 'isMandatory' | 'requiredEvidence', value: any) => {
    const updated = [...workflowSteps];
    updated[index] = { ...updated[index], [field]: value };
    setWorkflowSteps(updated);
  };

  const handleRemoveWorkflowStep = (index: number) => {
    setWorkflowSteps(workflowSteps.filter((_, i) => i !== index));
  };

  const handleMoveWorkflowStep = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === workflowSteps.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...workflowSteps];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setWorkflowSteps(updated);
  };

  // Checklist Handlers
  const handleAddChecklistItem = () => {
    setChecklistItems([
      ...checklistItems,
      { title: '', required: true },
    ]);
  };

  const handleUpdateChecklistItem = (index: number, field: 'title' | 'required', value: any) => {
    const updated = [...checklistItems];
    updated[index] = { ...updated[index], [field]: value };
    setChecklistItems(updated);
  };

  const handleRemoveChecklistItem = (index: number) => {
    setChecklistItems(checklistItems.filter((_, i) => i !== index));
  };

  // Quick Legal Update Presets
  const applyLegalPreset = (presetType: 'VAT_5M' | 'E_INVOICE' | 'CIT_EXPENSES' | 'PIT_DEPENDENT' | 'HIGH_RISK_CHECK') => {
    if (presetType === 'VAT_5M') {
      const itemTitle = 'Kiểm tra hóa đơn đầu vào trên 5 triệu có chứng từ thanh toán không dùng tiền mặt (UNC/sao kê)';
      if (!checklistItems.some(i => i.title.includes('5 triệu') || i.title.includes('không dùng tiền mặt'))) {
        setChecklistItems([{ title: itemTitle, required: true }, ...checklistItems]);
      }
      setChangeReason('Bổ sung tiêu chuẩn kiểm tra chứng từ thanh toán không dùng tiền mặt ngưỡng 5 triệu đồng theo luật mới');
    } else if (presetType === 'E_INVOICE') {
      const itemTitle = 'Tra cứu & đối chiếu dữ liệu hóa đơn điện tử trực tiếp trên Cổng thông tin Tổng cục Thuế';
      if (!checklistItems.some(i => i.title.includes('Cổng thông tin') || i.title.includes('Tổng cục Thuế'))) {
        setChecklistItems([{ title: itemTitle, required: true }, ...checklistItems]);
      }
      setChangeReason('Cập nhật quy trình kiểm soát hóa đơn điện tử Nghị định 123/2020 và Thông tư 78/2021');
    } else if (presetType === 'HIGH_RISK_CHECK') {
      const itemTitle = 'Tra cứu tình trạng doanh nghiệp phát hành hóa đơn (DN bỏ địa chỉ KD, tạm ngừng, có rủi ro cao)';
      if (!checklistItems.some(i => i.title.includes('bỏ địa chỉ') || i.title.includes('rủi ro cao'))) {
        setChecklistItems([{ title: itemTitle, required: true }, ...checklistItems]);
      }
      setChangeReason('Cập nhật cảnh báo rủi ro thuế và doanh nghiệp không hoạt động tại địa chỉ đăng ký');
    } else if (presetType === 'PIT_DEPENDENT') {
      const itemTitle = 'Rà soát hồ sơ giảm trừ gia cảnh người phụ thuộc, hợp đồng lao động và cam kết thuế TNCN';
      if (!checklistItems.some(i => i.title.includes('người phụ thuộc') || i.title.includes('giảm trừ gia cảnh'))) {
        setChecklistItems([{ title: itemTitle, required: true }, ...checklistItems]);
      }
      setChangeReason('Cập nhật quy định kiểm tra giảm trừ gia cảnh và quyết toán thuế TNCN');
    } else if (presetType === 'CIT_EXPENSES') {
      const itemTitle = 'Kiểm tra điều kiện chi phí hợp lý được trừ khi tính thuế TNDN (chứng từ thanh toán, định mức, thực tế phát sinh)';
      if (!checklistItems.some(i => i.title.includes('chi phí hợp lý') || i.title.includes('được trừ'))) {
        setChecklistItems([{ title: itemTitle, required: true }, ...checklistItems]);
      }
      setChangeReason('Cập nhật tiêu chí xác định chi phí hợp lý được trừ theo Luật Thuế TNDN');
    }
  };

  // Submit Handler
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Vui lòng nhập tên quy trình / công việc');
      return;
    }
    if (!code.trim()) {
      setErrorMessage('Vui lòng nhập mã quy trình');
      return;
    }
    if (workflowSteps.length === 0) {
      setErrorMessage('Vui lòng thiết lập ít nhất 1 bước quy trình thực hiện');
      return;
    }
    if (workflowSteps.some(s => !s.name.trim())) {
      setErrorMessage('Vui lòng nhập đầy đủ tên cho tất cả các bước quy trình');
      return;
    }
    const validChecklist = checklistItems.filter(item => item.title.trim().length > 0);
    if (validChecklist.length === 0) {
      setErrorMessage('Vui lòng nhập ít nhất 1 mục checklist kiểm tra chất lượng & pháp lý');
      return;
    }

    const payload: ChecklistTemplate = {
      id: template?.id || `tmpl_${Date.now()}`,
      code: code.trim().toUpperCase(),
      title: title.trim(),
      department,
      category,
      description: description.trim() || `Quy trình thực hiện: ${title.trim()}`,
      defaultPriority,
      defaultRiskLevel,
      isTaxObligation,
      taxType: isTaxObligation ? taxType : undefined,
      defaultWorkflow: workflowSteps.map(s => ({
        name: s.name.trim(),
        isMandatory: !!s.isMandatory,
        requiredEvidence: !!s.requiredEvidence,
      })),
      defaultChecklist: validChecklist.map(c => ({
        title: c.title.trim(),
        required: !!c.required,
      })),
    };

    try {
      if (!canManage) {
        setErrorMessage('Chỉ Ban Giám Đốc mới có thẩm quyền ban hành hoặc cập nhật quy trình mẫu.');
        return;
      }
      if (isNew) {
        storageService.addTemplate(payload, currentUser);
      } else {
        storageService.updateTemplate(payload, currentUser, changeReason);
      }
      onSaved(payload);
      onClose();
    } catch (err: any) {
      setErrorMessage(`Lỗi khi lưu quy trình: ${err.message || err}`);
    }
  };

  // Delete Handler
  const handleDelete = () => {
    if (!template) return;
    if (!canManage) {
      setErrorMessage('Chỉ Ban Giám Đốc mới có thẩm quyền xóa mẫu quy trình.');
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa mẫu quy trình "${template.title}" khỏi hệ thống?`)) {
      storageService.deleteTemplate(template.id, currentUser);
      if (onDeleted) {
        onDeleted(template.id);
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850/70">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-2xl text-white shadow-md ${
              !canManage ? 'bg-indigo-600 shadow-indigo-500/20' : isNew ? 'bg-blue-600 shadow-blue-500/20' : 'bg-blue-600 shadow-blue-500/20'
            }`}>
              {!canManage ? <Eye className="h-5 w-5" /> : isNew ? <Plus className="h-5 w-5" /> : <Gavel className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {!canManage 
                    ? 'Xem Chi Tiết Quy Trình Chuẩn (Ban Giám Đốc Ban Hành)'
                    : isNew 
                      ? 'Thêm Quy Trình / Công Việc Định Kỳ Mới' 
                      : 'Chỉnh Sửa Quy Trình (Cập Nhật Khi Luật Thay Đổi)'}
                </h2>
                {!isNew && (
                  <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold rounded-md">
                    Tuân thủ pháp lý
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {!canManage 
                  ? 'Tra cứu chuỗi bước SOP, tiêu chuẩn kiểm soát chất lượng và checklist bắt buộc áp dụng'
                  : 'Thiết lập chuỗi bước SOP, tiêu chuẩn kiểm soát chất lượng và checklist bắt buộc áp dụng khi giao việc'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Read-only notification banner for staff */}
        {!canManage && (
          <div className="px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center space-x-2 text-xs text-amber-900 dark:text-amber-200">
            <Lock className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              <strong>Chế độ xem tra cứu:</strong> Quy trình chuẩn do <strong>Ban Giám Đốc</strong> phê chuẩn ban hành. Nhân sự các cấp chỉ có quyền xem và thực thi theo mẫu.
            </span>
          </div>
        )}

        {/* Quick Legal Update Presets Strip (Only for Ban Giám Đốc) */}
        {canManage && (
          <div className="px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar text-xs">
            <div className="flex items-center space-x-1.5 shrink-0 text-amber-800 dark:text-amber-300 font-bold">
              <Scale className="h-3.5 w-3.5" />
              <span className="text-[11px]">Gợi ý cập nhật luật nhanh:</span>
            </div>
            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                type="button"
                onClick={() => applyLegalPreset('VAT_5M')}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700/50 hover:bg-amber-50 dark:hover:bg-slate-700 rounded-lg text-[11px] font-semibold text-slate-800 dark:text-slate-200 transition-all cursor-pointer"
              >
                + Ngưỡng 5tr không dùng tiền mặt
              </button>
              <button
                type="button"
                onClick={() => applyLegalPreset('E_INVOICE')}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700/50 hover:bg-amber-50 dark:hover:bg-slate-700 rounded-lg text-[11px] font-semibold text-slate-800 dark:text-slate-200 transition-all cursor-pointer"
              >
                + HĐĐT NĐ 123 & TCT
              </button>
              <button
                type="button"
                onClick={() => applyLegalPreset('HIGH_RISK_CHECK')}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700/50 hover:bg-amber-50 dark:hover:bg-slate-700 rounded-lg text-[11px] font-semibold text-slate-800 dark:text-slate-200 transition-all cursor-pointer"
              >
                + Rà soát DN rủi ro cao
              </button>
              <button
                type="button"
                onClick={() => applyLegalPreset('CIT_EXPENSES')}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700/50 hover:bg-amber-50 dark:hover:bg-slate-700 rounded-lg text-[11px] font-semibold text-slate-800 dark:text-slate-200 transition-all cursor-pointer"
              >
                + Chi phí hợp lý TNDN
              </button>
            </div>
          </div>
        )}

        {/* Modal Body Form */}
        <form id="templateEditForm" onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl flex items-center space-x-2 text-xs text-red-700 dark:text-red-300 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Basic Information & Legal Basis */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
              <FileText className="h-3.5 w-3.5 text-blue-600" />
              <span>1. Thông Tin Định Danh & Căn Cứ Pháp Lý</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
              
              {/* Template Code */}
              <div className="md:col-span-4 space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Mã Quy Trình <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={!canManage}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="VD: TMPL_VAT_Q, TMPL_CIT..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>

              {/* Template Title */}
              <div className="md:col-span-8 space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tên Quy Trình / Công Việc <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={!canManage}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Kê khai Thuế Giá Trị Gia Tăng định kỳ theo Quý..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>

              {/* Department */}
              <div className="md:col-span-4 space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Phòng Ban Phụ Trách
                </label>
                <select
                  disabled={!canManage}
                  value={department}
                  onChange={(e) => setDepartment(e.target.value as Department)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <option value="KE_TOAN_THUE">Kế toán dịch vụ & Thuế</option>
                  <option value="HANH_CHINH_NHAN_SU">Hành chính - Nhân sự & Tiền lương</option>
                  <option value="BAN_GIAM_DOC">Ban Giám Đốc</option>
                  <option value="KINH_DOANH_CSKH">Kinh Doanh & CSKH</option>
                </select>
              </div>

              {/* Task Category */}
              <div className="md:col-span-4 space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Phân Loại Nghiệp Vụ
                </label>
                <select
                  disabled={!canManage}
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TaskCategory)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <option value="KE_KHAI_THUE">Kê khai thuế</option>
                  <option value="BAO_CAO_TAI_CHINH">Báo cáo tài chính & Quyết toán</option>
                  <option value="TIEN_LUONG_BHXH">Tiền lương & Bảo hiểm xã hội</option>
                  <option value="KHOA_SO_KE_TOAN">Khóa sổ kế toán</option>
                  <option value="HOA_DON_CHUNG_TU">Hóa đơn chứng từ</option>
                  <option value="TONG_HOP">Tổng hợp & Nghiệp vụ khác</option>
                </select>
              </div>

              {/* Risk Level */}
              <div className="md:col-span-4 space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Mức Độ Rủi Ro Mặc Định
                </label>
                <select
                  disabled={!canManage}
                  value={defaultRiskLevel}
                  onChange={(e) => setDefaultRiskLevel(e.target.value as TaskRiskLevel)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <option value="BINH_THUONG">Bình thường (Rủi ro thấp)</option>
                  <option value="TRUNG_BINH">Trung bình</option>
                  <option value="CAO">Cao (Cần kiểm soát chặt)</option>
                  <option value="RUI_RO_THUE_PHAP_LY">Đặc biệt nguy hiểm / Rủi ro thuế</option>
                </select>
              </div>

              {/* Tax Obligation Switch & Tax Type */}
              <div className="md:col-span-6 p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Là Hạn Nộp Pháp Lý Bắt Buộc
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Gắn nhãn thời hạn luật định và tính toán tự động rủi ro quá hạn
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    disabled={!canManage}
                    checked={isTaxObligation}
                    onChange={(e) => setIsTaxObligation(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
                  />
                </div>

                {isTaxObligation && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center space-x-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                      Loại Nghĩa Vụ:
                    </label>
                    <select
                      disabled={!canManage}
                      value={taxType}
                      onChange={(e) => setTaxType(e.target.value as TaxObligationType)}
                      className="flex-1 px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      <option value="GTGT">Thuế GTGT (Giá trị gia tăng)</option>
                      <option value="TNCN">Thuế TNCN (Thu nhập cá nhân)</option>
                      <option value="TNDN">Thuế TNDN (Thu nhập doanh nghiệp)</option>
                      <option value="BCTC">BCTC (Báo cáo tài chính & Quyết toán năm)</option>
                      <option value="HOA_DON">Hóa đơn điện tử & Báo cáo tình hình sử dụng</option>
                      <option value="BHXH">BHXH & Báo cáo lao động tiền lương</option>
                      <option value="MON_BAI">Lệ phí môn bài</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Priority */}
              <div className="md:col-span-6 p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Độ Ưu Tiên Mặc Định
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Mức độ cấp bách khi công việc được tự động phát sinh
                  </p>
                </div>
                <select
                  disabled={!canManage}
                  value={defaultPriority}
                  onChange={(e) => setDefaultPriority(e.target.value as TaskPriority)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <option value="THAP">Thấp</option>
                  <option value="TRUNG_BINH">Trung bình</option>
                  <option value="CAO">Cao</option>
                  <option value="KHAN_CAP">Khẩn cấp</option>
                </select>
              </div>

              {/* Legal Reference & Description */}
              <div className="md:col-span-12 space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Mô Tả Nghiệp Vụ & Căn Cứ Pháp Lý Điều Chỉnh
                </label>
                <textarea
                  rows={2}
                  disabled={!canManage}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="VD: Căn cứ Luật Quản lý Thuế số 38/2019/QH14, Nghị định 123/2020/NĐ-CP, Thông tư 80/2021/TT-BTC..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none leading-relaxed disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>

              {/* Reason for Legal Adjustment */}
              {!isNew && canManage && (
                <div className="md:col-span-12 space-y-1">
                  <label className="block text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center space-x-1.5">
                    <Scale className="h-3.5 w-3.5" />
                    <span>Lý Do Điều Chỉnh Khi Luật / Quy Định Thay Đổi (Lưu vết Audit Log)</span>
                  </label>
                  <input
                    type="text"
                    value={changeReason}
                    onChange={(e) => setChangeReason(e.target.value)}
                    placeholder="VD: Cập nhật điều kiện thanh toán không dùng tiền mặt > 5tr; bổ sung bước rà soát hóa đơn rủi ro..."
                    className="w-full px-3 py-2 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800/60 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              )}

            </div>
          </div>

          {/* Section 2: Workflow Steps (SOP Chuỗi quy trình) */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                  <Layers className="h-3.5 w-3.5 text-blue-600" />
                  <span>2. Chuỗi Quy Trình Thực Hiện SOP ({workflowSteps.length} bước)</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Trình tự các bước thực hiện tự động gắn vào công việc khi giao cho nhân sự
                </p>
              </div>

              {canManage && (
                <button
                  type="button"
                  onClick={handleAddWorkflowStep}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold border border-blue-200 dark:border-blue-800 transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Thêm Bước</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              {workflowSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center space-x-2 flex-1">
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 w-5 shrink-0">
                      {idx + 1}.
                    </span>
                    <input
                      type="text"
                      required
                      disabled={!canManage}
                      value={step.name}
                      onChange={(e) => handleUpdateWorkflowStep(idx, 'name', e.target.value)}
                      placeholder="Tên bước thực hiện..."
                      className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-3 shrink-0">
                    {/* Mandatory checkbox */}
                    <label className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={!canManage}
                        checked={step.isMandatory}
                        onChange={(e) => handleUpdateWorkflowStep(idx, 'isMandatory', e.target.checked)}
                        className="rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span>Bắt buộc</span>
                    </label>

                    {/* Required Evidence checkbox */}
                    <label className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={!canManage}
                        checked={step.requiredEvidence}
                        onChange={(e) => handleUpdateWorkflowStep(idx, 'requiredEvidence', e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span>Đính kèm file</span>
                    </label>

                    {/* Order buttons & Remove button - only for authorized managers */}
                    {canManage && (
                      <>
                        <div className="flex items-center space-x-0.5 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveWorkflowStep(idx, 'up')}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                            title="Di chuyển lên"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === workflowSteps.length - 1}
                            onClick={() => handleMoveWorkflowStep(idx, 'down')}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                            title="Di chuyển xuống"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveWorkflowStep(idx)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer"
                          title="Xóa bước này"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Checklist Items (Tiêu chuẩn kiểm soát & Pháp lý) */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                  <CheckSquare className="h-3.5 w-3.5 text-emerald-600" />
                  <span>3. Checklist Kiểm Soát Chất Lượng & Pháp Lý ({checklistItems.length} mục)</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Các tiêu chí nghiệp vụ và điều kiện pháp luật mà nhân sự bắt buộc phải tích chọn kiểm tra
                </p>
              </div>

              {canManage && (
                <button
                  type="button"
                  onClick={handleAddChecklistItem}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Thêm Mục Kiểm Tra</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              {checklistItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center space-x-2.5 flex-1">
                    <CheckSquare className="h-4 w-4 text-emerald-600 shrink-0" />
                    <input
                      type="text"
                      required
                      disabled={!canManage}
                      value={item.title}
                      onChange={(e) => handleUpdateChecklistItem(idx, 'title', e.target.value)}
                      placeholder="Nội dung tiêu chuẩn kiểm tra (VD: Kiểm tra hóa đơn trên 5 triệu...)"
                      className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <label className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={!canManage}
                        checked={item.required}
                        onChange={(e) => handleUpdateChecklistItem(idx, 'required', e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span>Bắt buộc kiểm</span>
                    </label>

                    {canManage && (
                      <button
                        type="button"
                        onClick={() => handleRemoveChecklistItem(idx)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer"
                        title="Xóa mục kiểm tra này"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </form>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/70 flex items-center justify-between gap-3">
          <div>
            {!isNew && canManage && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-2 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Xóa Mẫu Quy Trình</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {!canManage ? (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-200 dark:bg-slate-750 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Đóng
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  form="templateEditForm"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold shadow-md shadow-blue-500/20 flex items-center space-x-2 transition-all cursor-pointer transform hover:-translate-y-0.5"
                >
                  <Save className="h-4 w-4" />
                  <span>{isNew ? 'Lưu Quy Trình Mới' : 'Cập Nhật Quy Trình & Luật Mới'}</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { AdHocServiceItem, AdHocServiceGroup, Department, TaskPriority, TaskRiskLevel, User } from '../../types';
import { storageService } from '../../services/storageService';
import { 
  X, 
  Save, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Scale, 
  CheckSquare, 
  FileText, 
  Layers, 
  AlertCircle,
  Gavel,
  DollarSign,
  Tag,
  Briefcase,
  Lock,
  Eye
} from 'lucide-react';
import { AD_HOC_SERVICE_GROUPS } from '../../data/adHocServices';
import { formatCurrency } from '../../utils/formatters';
import { PermissionService } from '../../utils/permissions';

interface AdHocServiceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  service?: AdHocServiceItem | null;
  currentUser?: User;
  onSaved: (savedService: AdHocServiceItem) => void;
  onDeleted?: (deletedServiceId: string) => void;
}

const GROUP_OPTIONS: { key: AdHocServiceGroup; name: string }[] = [
  { key: 'PHAP_LY_DOANH_NGHIEP', name: 'I. Pháp lý doanh nghiệp' },
  { key: 'BHXH_NHAN_SU', name: 'I. BHXH & Lao động' },
  { key: 'THUE_THANH_TRA_RUI_RO', name: 'II. Kế toán, Thuế & Thanh tra' },
  { key: 'PHAN_MEM_KE_TOAN', name: 'II. Phần mềm kế toán' },
  { key: 'THUE_CHO_THUE_TAI_SAN', name: 'II. Cho thuê tài sản' },
  { key: 'DICH_VU_KHAC', name: 'II. Dịch vụ khác' },
];

export const AdHocServiceEditModal: React.FC<AdHocServiceEditModalProps> = ({
  isOpen,
  onClose,
  service,
  currentUser,
  onSaved,
  onDeleted,
}) => {
  const isNew = !service;
  const canManage = PermissionService.canManageTemplates(currentUser);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [group, setGroup] = useState<AdHocServiceGroup>('PHAP_LY_DOANH_NGHIEP');
  const [fee, setFee] = useState<number>(1000000);
  const [feeDisplay, setFeeDisplay] = useState('1.000.000 đ');
  const [isNegotiableFee, setIsNegotiableFee] = useState(false);
  const [executionType, setExecutionType] = useState('Phát sinh từng lần');
  const [department, setDepartment] = useState<Department>('HANH_CHINH_NHAN_SU');
  const [defaultPriority, setDefaultPriority] = useState<TaskPriority>('TRUNG_BINH');
  const [defaultRiskLevel, setDefaultRiskLevel] = useState<TaskRiskLevel>('TRUNG_BINH');
  const [description, setDescription] = useState('');
  const [changeReason, setChangeReason] = useState('');

  // Workflow steps
  const [workflowSteps, setWorkflowSteps] = useState<{ name: string; isMandatory: boolean; requiredEvidence: boolean }[]>([]);

  // Checklist items
  const [checklistItems, setChecklistItems] = useState<{ title: string; required: boolean }[]>([]);

  // Error message
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize or reset form
  useEffect(() => {
    if (service) {
      setCode(service.code || '');
      setName(service.name || '');
      setGroup(service.group || 'PHAP_LY_DOANH_NGHIEP');
      setFee(service.fee || 0);
      setFeeDisplay(service.feeDisplay || (service.fee ? `${service.fee.toLocaleString('vi-VN')} đ` : 'Theo thỏa thuận'));
      setIsNegotiableFee(service.fee === 0 || service.feeDisplay.toLowerCase().includes('thỏa thuận'));
      setExecutionType(service.executionType || 'Phát sinh từng lần');
      setDepartment(service.department || 'HANH_CHINH_NHAN_SU');
      setDefaultPriority(service.defaultPriority || 'TRUNG_BINH');
      setDefaultRiskLevel(service.defaultRiskLevel || 'TRUNG_BINH');
      setDescription(service.description || '');
      setChangeReason('');
      setWorkflowSteps(service.suggestedWorkflow ? [...service.suggestedWorkflow] : []);
      setChecklistItems(service.suggestedChecklist ? [...service.suggestedChecklist] : []);
    } else {
      // Default new ad-hoc service
      setCode(`DV-${Math.floor(10 + Math.random() * 90)}`);
      setName('');
      setGroup('PHAP_LY_DOANH_NGHIEP');
      setFee(1500000);
      setFeeDisplay('1.500.000 đ');
      setIsNegotiableFee(false);
      setExecutionType('Phát sinh từng lần');
      setDepartment('HANH_CHINH_NHAN_SU');
      setDefaultPriority('CAO');
      setDefaultRiskLevel('CAO');
      setDescription('');
      setChangeReason('Ban hành dịch vụ phát sinh & quy trình SOP chuẩn mới');
      setWorkflowSteps([
        { name: '1. Tiếp nhận yêu cầu khách hàng & thu thập hồ sơ pháp lý liên quan', isMandatory: true, requiredEvidence: false },
        { name: '2. Soạn thảo văn bản, biểu mẫu & hướng dẫn khách hàng ký đóng dấu', isMandatory: true, requiredEvidence: true },
        { name: '3. Nộp hồ sơ đến cơ quan nhà nước có thẩm quyền (Cổng thông tin/Trực tiếp)', isMandatory: true, requiredEvidence: true },
        { name: '4. Theo dõi tiến độ, nhận kết quả & bàn giao cho khách hàng', isMandatory: true, requiredEvidence: true },
        { name: '5. Lưu trữ hồ sơ điện tử & cập nhật dữ liệu quản lý', isMandatory: true, requiredEvidence: false },
      ]);
      setChecklistItems([
        { title: 'Kiểm tra tính hợp lệ của CCCD/Hộ chiếu người đại diện và hồ sơ pháp lý', required: true },
        { title: 'Kiểm tra biểu mẫu, quyết định họp đúng quy định Luật Doanh nghiệp hiện hành', required: true },
        { title: 'Biên lai/Giấy tiếp nhận hồ sơ hợp lệ từ cơ quan có thẩm quyền', required: true },
        { title: 'Biên bản bàn giao kết quả và hóa đơn dịch vụ đã xuất cho khách hàng', required: true },
      ]);
    }
    setErrorMessage(null);
  }, [service, isOpen]);

  if (!isOpen) return null;

  // Fee Change Handler
  const handleFeeNumberChange = (num: number) => {
    setFee(num);
    if (num > 0) {
      setFeeDisplay(`${num.toLocaleString('vi-VN')} đ`);
    } else {
      setFeeDisplay('Theo thỏa thuận');
    }
  };

  // Workflow Handlers
  const handleAddWorkflowStep = () => {
    setWorkflowSteps([
      ...workflowSteps,
      { name: `${workflowSteps.length + 1}. Thực hiện nghiệp vụ & kiểm soát chất lượng`, isMandatory: true, requiredEvidence: false },
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
  const applyLegalPreset = (presetType: 'ENTERPRISE_LAW' | 'VAT_5M' | 'E_INVOICE_123' | 'LABOR_INSURANCE' | 'TAX_EXPLANATION') => {
    if (presetType === 'ENTERPRISE_LAW') {
      const itemTitle = 'Kiểm tra hồ sơ biểu mẫu chuẩn theo Luật Doanh nghiệp 2020 & Nghị định 01/2021/NĐ-CP';
      if (!checklistItems.some(i => i.title.includes('Luật Doanh nghiệp') || i.title.includes('01/2021'))) {
        setChecklistItems([{ title: itemTitle, required: true }, ...checklistItems]);
      }
      setChangeReason('Cập nhật quy định hồ sơ đăng ký doanh nghiệp theo Luật Doanh nghiệp và NĐ 01/2021');
    } else if (presetType === 'VAT_5M') {
      const itemTitle = 'Kiểm tra hóa đơn đầu vào trên 5 triệu có chứng từ thanh toán không dùng tiền mặt (UNC/sao kê ngân hàng)';
      if (!checklistItems.some(i => i.title.includes('5 triệu') || i.title.includes('không dùng tiền mặt'))) {
        setChecklistItems([{ title: itemTitle, required: true }, ...checklistItems]);
      }
      setChangeReason('Bổ sung tiêu chuẩn kiểm soát chứng từ thanh toán không dùng tiền mặt ngưỡng 5 triệu');
    } else if (presetType === 'E_INVOICE_123') {
      const itemTitle = 'Tra cứu hóa đơn điện tử hợp pháp trên Cổng thông tin Tổng cục Thuế (NĐ 123/2020)';
      if (!checklistItems.some(i => i.title.includes('Cổng thông tin') || i.title.includes('123/2020'))) {
        setChecklistItems([{ title: itemTitle, required: true }, ...checklistItems]);
      }
      setChangeReason('Cập nhật quy trình kiểm soát hóa đơn điện tử theo Nghị định 123/2020 và Thông tư 78/2021');
    } else if (presetType === 'LABOR_INSURANCE') {
      const itemTitle = 'Rà soát hợp đồng lao động, mức lương đóng BHXH không thấp hơn mức lương tối thiểu vùng quy định';
      if (!checklistItems.some(i => i.title.includes('lương tối thiểu') || i.title.includes('BHXH'))) {
        setChecklistItems([{ title: itemTitle, required: true }, ...checklistItems]);
      }
      setChangeReason('Cập nhật quy định tiền lương tối thiểu vùng và tỷ lệ trích nộp BHXH/BHYT/BHTN');
    } else if (presetType === 'TAX_EXPLANATION') {
      const itemTitle = 'Kiểm tra văn bản giải trình đối chiếu số liệu và rà soát nhà cung cấp có rủi ro cao về thuế';
      if (!checklistItems.some(i => i.title.includes('giải trình') || i.title.includes('rủi ro cao'))) {
        setChecklistItems([{ title: itemTitle, required: true }, ...checklistItems]);
      }
      setChangeReason('Cập nhật tiêu chí giải trình thanh tra thuế và cảnh báo rủi ro hóa đơn');
    }
  };

  // Submit Handler
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Vui lòng nhập tên dịch vụ phát sinh');
      return;
    }
    if (!code.trim()) {
      setErrorMessage('Vui lòng nhập mã dịch vụ (VD: PL-01, KT-05...)');
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

    const groupMeta = GROUP_OPTIONS.find(g => g.key === group);
    const groupName = groupMeta ? groupMeta.name : 'I. Pháp lý doanh nghiệp';

    const payload: AdHocServiceItem = {
      id: service?.id || `ADHOC_${code.trim().toUpperCase()}_${Date.now()}`,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      group,
      groupName,
      executionType: executionType.trim() || 'Phát sinh từng lần',
      fee: isNegotiableFee ? 0 : Number(fee) || 0,
      feeDisplay: isNegotiableFee ? 'Theo thỏa thuận' : (feeDisplay.trim() || `${(Number(fee) || 0).toLocaleString('vi-VN')} đ`),
      department,
      defaultRiskLevel,
      defaultPriority,
      description: description.trim() || `Dịch vụ phát sinh: ${name.trim()}`,
      suggestedWorkflow: workflowSteps.map(s => ({
        name: s.name.trim(),
        isMandatory: !!s.isMandatory,
        requiredEvidence: !!s.requiredEvidence,
      })),
      suggestedChecklist: validChecklist.map(c => ({
        title: c.title.trim(),
        required: !!c.required,
      })),
    };

    try {
      if (!canManage) {
        setErrorMessage('Chỉ Ban Giám Đốc mới có quyền tạo mới hoặc chỉnh sửa biểu phí & quy trình.');
        return;
      }
      if (isNew) {
        storageService.addAdHocService(payload, currentUser);
      } else {
        storageService.updateAdHocService(payload, currentUser, changeReason);
      }
      onSaved(payload);
      onClose();
    } catch (err: any) {
      setErrorMessage(`Lỗi khi lưu dịch vụ phát sinh: ${err.message || err}`);
    }
  };

  // Delete Handler
  const handleDelete = () => {
    if (!canManage) {
      setErrorMessage('Chỉ Ban Giám Đốc mới có quyền xóa dịch vụ.');
      return;
    }
    if (!service) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa dịch vụ phát sinh "${service.code} - ${service.name}" khỏi hệ thống?`)) {
      storageService.deleteAdHocService(service.id, currentUser);
      if (onDeleted) {
        onDeleted(service.id);
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
            <div className={`p-2.5 rounded-2xl text-white shadow-md ${!canManage ? 'bg-amber-600 shadow-amber-500/20' : 'bg-blue-600 shadow-blue-500/20'}`}>
              {!canManage ? <Eye className="h-5 w-5" /> : (isNew ? <Plus className="h-5 w-5" /> : <Gavel className="h-5 w-5" />)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {!canManage 
                    ? 'Xem Chi Tiết Biểu Phí & Quy Trình Dịch Vụ Phát Sinh' 
                    : (isNew ? 'Thêm Dịch Vụ Phát Sinh & Quy Trình Mới' : 'Chỉnh Sửa Dịch Vụ Phát Sinh (Cập Nhật Khi Luật Thay Đổi)')}
                </h2>
                {!canManage ? (
                  <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded-md flex items-center space-x-1">
                    <Lock className="h-2.5 w-2.5" />
                    <span>Chế độ chỉ xem</span>
                  </span>
                ) : !isNew ? (
                  <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold rounded-md">
                    Tuân thủ pháp lý
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {!canManage 
                  ? 'Quyền hạn: Chỉ Ban Giám Đốc mới có quyền chỉnh sửa biểu phí niêm yết và quy trình dịch vụ'
                  : 'Thiết lập biểu phí niêm yết, chuỗi quy trình SOP và tiêu chuẩn kiểm soát chất lượng khi thực hiện dịch vụ'}
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

        {/* Read-Only Warning Banner */}
        {!canManage && (
          <div className="px-6 py-2.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 flex items-center space-x-2 text-xs text-amber-800 dark:text-amber-300 font-medium">
            <Lock className="h-4 w-4 shrink-0 text-amber-600" />
            <span>Chỉ <strong>Ban Giám Đốc</strong> mới có quyền chỉnh sửa và thêm mới biểu phí, gói dịch vụ & quy trình. Bạn đang xem ở chế độ đọc.</span>
          </div>
        )}

        {/* Quick Legal Update Presets Strip */}
        {canManage && (
          <div className="px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar text-xs">
            <div className="flex items-center space-x-1.5 shrink-0 text-amber-800 dark:text-amber-300 font-bold">
              <Scale className="h-3.5 w-3.5" />
              <span className="text-[11px]">Gợi ý cập nhật luật nhanh:</span>
            </div>
            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                type="button"
                onClick={() => applyLegalPreset('ENTERPRISE_LAW')}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700/50 hover:bg-amber-50 dark:hover:bg-slate-700 rounded-lg text-[11px] font-semibold text-slate-800 dark:text-slate-200 transition-all cursor-pointer"
              >
                + Luật Doanh nghiệp & NĐ 01/2021
              </button>
              <button
                type="button"
                onClick={() => applyLegalPreset('VAT_5M')}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700/50 hover:bg-amber-50 dark:hover:bg-slate-700 rounded-lg text-[11px] font-semibold text-slate-800 dark:text-slate-200 transition-all cursor-pointer"
              >
                + Ngưỡng 5tr không tiền mặt
              </button>
              <button
                type="button"
                onClick={() => applyLegalPreset('E_INVOICE_123')}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700/50 hover:bg-amber-50 dark:hover:bg-slate-700 rounded-lg text-[11px] font-semibold text-slate-800 dark:text-slate-200 transition-all cursor-pointer"
              >
                + HĐĐT NĐ 123/2020
              </button>
              <button
                type="button"
                onClick={() => applyLegalPreset('LABOR_INSURANCE')}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700/50 hover:bg-amber-50 dark:hover:bg-slate-700 rounded-lg text-[11px] font-semibold text-slate-800 dark:text-slate-200 transition-all cursor-pointer"
              >
                + Lương tối thiểu & BHXH
              </button>
              <button
                type="button"
                onClick={() => applyLegalPreset('TAX_EXPLANATION')}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700/50 hover:bg-amber-50 dark:hover:bg-slate-700 rounded-lg text-[11px] font-semibold text-slate-800 dark:text-slate-200 transition-all cursor-pointer"
              >
                + Giải trình rủi ro thuế
              </button>
            </div>
          </div>
        )}

        {/* Modal Body Form */}
        <form id="adHocServiceEditForm" onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl flex items-center space-x-2 text-xs text-red-700 dark:text-red-300 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Service Identity, Group & Pricing */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
              <Tag className="h-3.5 w-3.5 text-blue-600" />
              <span>1. Thông Tin Dịch Vụ, Nhóm & Biểu Phí Niêm Yết</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
              
              {/* Service Code */}
              <div className="md:col-span-3 space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Mã Dịch Vụ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={!canManage}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="VD: PL-01, KT-10..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>

              {/* Service Name */}
              <div className="md:col-span-9 space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tên Dịch Vụ Phát Sinh <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={!canManage}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Thay đổi địa chỉ trụ sở, Đăng ký thang bảng lương..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>

              {/* Service Group */}
              <div className="md:col-span-6 space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nhóm Dịch Vụ Phát Sinh
                </label>
                <select
                  disabled={!canManage}
                  value={group}
                  onChange={(e) => setGroup(e.target.value as AdHocServiceGroup)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {GROUP_OPTIONS.map(g => (
                    <option key={g.key} value={g.key}>{g.name}</option>
                  ))}
                </select>
              </div>

              {/* Execution Type */}
              <div className="md:col-span-6 space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Hình Thức Thực Hiện
                </label>
                <input
                  type="text"
                  disabled={!canManage}
                  value={executionType}
                  onChange={(e) => setExecutionType(e.target.value)}
                  placeholder="VD: Phát sinh từng lần, Theo hồ sơ, Trọn gói..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>

              {/* Fee and Negotiable Checkbox */}
              <div className="md:col-span-6 p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Mức Phí Dịch Vụ Niêm Yết
                  </span>
                  <label className="flex items-center space-x-1.5 text-[11px] text-slate-600 dark:text-slate-400 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!canManage}
                      checked={isNegotiableFee}
                      onChange={(e) => {
                        setIsNegotiableFee(e.target.checked);
                        if (e.target.checked) {
                          setFee(0);
                          setFeeDisplay('Theo thỏa thuận');
                        } else {
                          setFee(1000000);
                          setFeeDisplay('1.000.000 đ');
                        }
                      }}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <span>Theo thỏa thuận</span>
                  </label>
                </div>

                {!isNegotiableFee ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Số tiền (VNĐ):</label>
                      <input
                        type="number"
                        disabled={!canManage}
                        min="0"
                        step="50000"
                        value={fee}
                        onChange={(e) => handleFeeNumberChange(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-400 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Chuỗi hiển thị:</label>
                      <input
                        type="text"
                        disabled={!canManage}
                        value={feeDisplay}
                        onChange={(e) => setFeeDisplay(e.target.value)}
                        placeholder="VD: 2.000.000 đ"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-xs font-bold text-amber-600 dark:text-amber-400 py-1">
                    Báo giá linh hoạt theo quy mô và độ phức tạp của từng khách hàng
                  </div>
                )}
              </div>

              {/* Department */}
              <div className="md:col-span-6 space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Phòng Ban Thực Hiện
                </label>
                <select
                  disabled={!canManage}
                  value={department}
                  onChange={(e) => setDepartment(e.target.value as Department)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <option value="HANH_CHINH_NHAN_SU">Hành chính - Nhân sự & Pháp lý ĐKKD</option>
                  <option value="KE_TOAN_THUE">Kế toán dịch vụ & Thuế</option>
                  <option value="BAN_GIAM_DOC">Ban Giám Đốc</option>
                  <option value="KINH_DOANH_CSKH">Kinh Doanh & CSKH</option>
                </select>
              </div>

              {/* Risk Level & Priority */}
              <div className="md:col-span-6 space-y-1">
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
                  <option value="RUI_RO_THUE_PHAP_LY">Đặc biệt nguy hiểm / Rủi ro pháp lý & thuế</option>
                </select>
              </div>

              <div className="md:col-span-6 space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Độ Ưu Tiên Mặc Định
                </label>
                <select
                  disabled={!canManage}
                  value={defaultPriority}
                  onChange={(e) => setDefaultPriority(e.target.value as TaskPriority)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <option value="THAP">Thấp</option>
                  <option value="TRUNG_BINH">Trung bình</option>
                  <option value="CAO">Cao</option>
                  <option value="KHAN_CAP">Khẩn cấp</option>
                </select>
              </div>

              {/* Description */}
              <div className="md:col-span-12 space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Mô Tả Chi Tiết & Phạm Vi Công Việc
                </label>
                <textarea
                  rows={2}
                  disabled={!canManage}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="VD: Thủ tục thay đổi người đại diện theo pháp luật, soạn thảo điều lệ, nộp hồ sơ Sở KH&ĐT..."
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
                    placeholder="VD: Cập nhật mẫu biểu theo NĐ 01/2021; bổ sung bước đối chiếu Cổng thông tin TCT..."
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
                  Trình tự các bước thực hiện tự động gắn vào công việc phát sinh khi phân công cho nhân sự
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

                    {/* Order buttons & Remove - only for managers */}
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
                  <span>3. Tiêu Chí Kiểm Soát Chất Lượng & Pháp Lý ({checklistItems.length} mục)</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Các tiêu chí nghiệp vụ và điều kiện pháp lý bắt buộc nhân sự phải rà soát và tích chọn khi thực hiện
                </p>
              </div>

              {canManage && (
                <button
                  type="button"
                  onClick={handleAddChecklistItem}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Thêm Tiêu Chí Kiểm</span>
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
                      placeholder="Nội dung tiêu chuẩn kiểm tra pháp lý..."
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
                        title="Xóa tiêu chí này"
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
                <span className="hidden sm:inline">Xóa Dịch Vụ Này</span>
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
                  form="adHocServiceEditForm"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold shadow-md shadow-blue-500/20 flex items-center space-x-2 transition-all cursor-pointer transform hover:-translate-y-0.5"
                >
                  <Save className="h-4 w-4" />
                  <span>{isNew ? 'Lưu Dịch Vụ Mới' : 'Cập Nhật Dịch Vụ & Luật Mới'}</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

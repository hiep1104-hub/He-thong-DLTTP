import React, { useState } from 'react';
import { Task, TaskAttachment, AttachmentCategory, User } from '../../types';
import { 
  CheckCircle2, 
  X, 
  ShieldAlert, 
  ShieldCheck, 
  Upload, 
  Image as ImageIcon, 
  Sparkles, 
  AlertCircle, 
  Star, 
  FileCheck, 
  FileText,
  Clock,
  ArrowRight,
  CheckSquare
} from 'lucide-react';
import { 
  compressImageFile, 
  isImageFile, 
  createSampleEvidenceImage 
} from '../../utils/imageUtils';
import { formatDateTime, formatFileSize, ATTACHMENT_CATEGORY_LABELS } from '../../utils/formatters';

interface CompletionEvidenceModalProps {
  task: Task;
  currentUser: User;
  onClose: () => void;
  onConfirmComplete: (params: {
    completionNotes?: string;
    newAttachment?: TaskAttachment;
    designatedAttachmentId?: string;
    autoCompleteChecklist?: boolean;
    autoCompleteWorkflow?: boolean;
  }) => void;
}

export const CompletionEvidenceModal: React.FC<CompletionEvidenceModalProps> = ({
  task,
  currentUser,
  onClose,
  onConfirmComplete,
}) => {
  // Existing completion attachments
  const existingCompletionProofs = task.attachments.filter(a => a.isCompletionEvidence);
  const otherAttachments = task.attachments.filter(a => !a.isCompletionEvidence);

  // Selected proof option: 'EXISTING' | 'NEW_UPLOAD' | 'GENERATE_SAMPLE'
  const [selectedProofOption, setSelectedProofOption] = useState<'EXISTING' | 'NEW_UPLOAD' | 'GENERATE_SAMPLE'>(
    existingCompletionProofs.length > 0 ? 'EXISTING' : 'NEW_UPLOAD'
  );

  const [selectedExistingId, setSelectedExistingId] = useState<string>(
    existingCompletionProofs[0]?.id || otherAttachments[0]?.id || ''
  );

  // New File Upload State
  const [newFileDataUrl, setNewFileDataUrl] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [newFileCategory, setNewFileCategory] = useState<AttachmentCategory>('TO_KHAI_THUE');
  const [newFileSize, setNewFileSize] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Completion Form Inputs
  const [completionNotes, setCompletionNotes] = useState(
    `Đã hoàn thành toàn bộ nghiệp vụ [${task.title}]. Đã kiểm tra đối chiếu số liệu và lưu trữ bằng chứng hoàn thành.`
  );
  const [autoCompleteChecklist, setAutoCompleteChecklist] = useState(true);
  const [autoCompleteWorkflow, setAutoCompleteWorkflow] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Incomplete items stats
  const incompleteSteps = task.workflowSteps.filter(s => !s.isCompleted);
  const incompleteChecklist = task.checklist.filter(c => !c.isCompleted);
  const isTaxOrHighRisk = task.isTaxObligation || task.riskLevel === 'RUI_RO_THUE_PHAP_LY' || task.priority === 'KHAN_CAP';

  const handleProcessUpload = async (file: File | Blob) => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const fileName = file instanceof File ? file.name : `Bang_Chung_Hoan_Thanh_${Date.now()}.webp`;
      const result = await compressImageFile(file, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.8,
        fileName,
      });

      setNewFileDataUrl(result.dataUrl);
      setNewFileName(fileName.replace(/\.[^/.]+$/, "") + '.webp');
      setNewFileSize(result.size);
    } catch (err: any) {
      setErrorMessage('Lỗi xử lý ảnh: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateSample = (type: 'THONG_BAO_THUE' | 'UNC_NGAN_HANG' | 'KY_SO_TOKEN' | 'BIEN_BAN_HOAN_THANH') => {
    const sample = createSampleEvidenceImage(type, {
      customerName: task.customerName,
      taxCode: task.customerTaxCode || '0108923456',
      taskTitle: task.title,
      period: task.taxPeriod || 'Kỳ quyết toán',
      signerName: currentUser.name,
    });

    setNewFileDataUrl(sample.dataUrl);
    setNewFileName(sample.name);
    setNewFileCategory(sample.category);
    setNewFileSize(sample.size);
    setSelectedProofOption('NEW_UPLOAD');
  };

  const handleConfirm = () => {
    setErrorMessage(null);

    let finalNewAttachment: TaskAttachment | undefined = undefined;
    let finalDesignatedId: string | undefined = undefined;

    // Check Evidence Requirement
    if (selectedProofOption === 'NEW_UPLOAD') {
      if (!newFileDataUrl) {
        if (isTaxOrHighRisk) {
          setErrorMessage('Công việc thuộc diện Nghĩa Vụ Thuế / Rủi Ro Cao: Bắt buộc tải lên hoặc tạo 01 ảnh bằng chứng hoàn thành (Thông báo CQT, Giấy nộp tiền hoặc Ký số Token)!');
          return;
        }
      } else {
        finalNewAttachment = {
          id: `att-comp-${Date.now()}`,
          name: newFileName.trim() || `Bang_Chung_Hoan_Thanh_${Date.now()}.webp`,
          url: newFileDataUrl,
          thumbnailUrl: newFileDataUrl,
          fileType: 'image/webp',
          size: newFileSize || 95000,
          uploadedBy: currentUser.id,
          uploadedByName: currentUser.name,
          uploadedAt: new Date().toISOString(),
          version: task.attachments.length + 1,
          category: newFileCategory,
          isCompletionEvidence: true,
          isImage: true,
          notes: 'Bằng chứng nghiệm thu hoàn thành',
        };
      }
    } else if (selectedProofOption === 'EXISTING') {
      if (!selectedExistingId && isTaxOrHighRisk && task.attachments.length === 0) {
        setErrorMessage('Chưa có bằng chứng nào trong hồ sơ. Vui lòng tải lên ảnh bằng chứng mới!');
        return;
      }
      finalDesignatedId = selectedExistingId;
    }

    onConfirmComplete({
      completionNotes: completionNotes.trim(),
      newAttachment: finalNewAttachment,
      designatedAttachmentId: finalDesignatedId,
      autoCompleteChecklist,
      autoCompleteWorkflow,
    });
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-start justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-xs text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold">Nghiệm Thu & Hoàn Thành Công Việc</h2>
              <p className="text-xs text-emerald-100 mt-0.5">
                Xác thực bằng chứng ảnh, đối soát bước quy trình và phê duyệt hoàn thành hồ sơ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">

          {/* Task Summary Banner */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                {task.code}
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                Khách hàng: <strong className="text-slate-800 dark:text-slate-200">{task.customerName}</strong>
              </span>
            </div>
            <div className="font-bold text-sm text-slate-900 dark:text-white">
              {task.title}
            </div>
            {task.taxPeriod && (
              <div className="text-[11px] text-slate-500">
                Kỳ thuế: <span className="font-semibold text-slate-700 dark:text-slate-300">{task.taxPeriod}</span>
              </div>
            )}
          </div>

          {/* Error / Validation Warning */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="font-semibold leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* SECTION 1: COMPLETION EVIDENCE ATTACHMENT */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                <ImageIcon className="h-4 w-4 text-emerald-600" />
                <span>Bằng Chứng Nghiệm Thu Hoàn Thành (Ảnh nhẹ WebP/PNG)</span>
                {isTaxOrHighRisk && <span className="text-red-500 font-black">*</span>}
              </label>

              {/* Toggle proof source */}
              {task.attachments.length > 0 && (
                <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setSelectedProofOption('NEW_UPLOAD')}
                    className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                      selectedProofOption === 'NEW_UPLOAD' 
                        ? 'bg-emerald-600 text-white' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Tải ảnh mới / Tạo mẫu
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedProofOption('EXISTING')}
                    className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                      selectedProofOption === 'EXISTING' 
                        ? 'bg-emerald-600 text-white' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Chọn từ tệp có sẵn ({task.attachments.length})
                  </button>
                </div>
              )}
            </div>

            {/* Option A: Pick from existing attachments */}
            {selectedProofOption === 'EXISTING' && (
              <div className="space-y-2">
                <div className="text-[11px] text-slate-500">
                  Chọn 01 tệp đã tải lên trước đó để chỉ định làm Bằng Chứng Hoàn Thành chính thức:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {task.attachments.map((att) => (
                    <div
                      key={att.id}
                      onClick={() => setSelectedExistingId(att.id)}
                      className={`p-2.5 rounded-xl border cursor-pointer flex items-center space-x-2.5 transition-all ${
                        selectedExistingId === att.id
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="h-9 w-9 rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                        {att.url ? (
                          <img src={att.url} alt={att.name} className="h-full w-full object-cover" />
                        ) : (
                          <FileText className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 dark:text-white truncate">{att.name}</div>
                        <div className="text-[10px] text-slate-400">{formatFileSize(att.size)} • {ATTACHMENT_CATEGORY_LABELS[att.category]?.label || att.category}</div>
                      </div>
                      {selectedExistingId === att.id && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Option B: Upload new or Generate Sample */}
            {selectedProofOption === 'NEW_UPLOAD' && (
              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                
                {/* 1-Click Sample Generator buttons */}
                <div>
                  <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Tạo nhanh ảnh bằng chứng mẫu chuẩn CQT / Ngân hàng (1-Click Demo):</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleGenerateSample('THONG_BAO_THUE')}
                      className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 text-left font-semibold text-[11px] transition-colors"
                    >
                      ✔ Thông báo CQT
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenerateSample('UNC_NGAN_HANG')}
                      className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-left font-semibold text-[11px] transition-colors"
                    >
                      ✔ Giấy nộp tiền VCB
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenerateSample('KY_SO_TOKEN')}
                      className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200 text-left font-semibold text-[11px] transition-colors"
                    >
                      ✔ Ký số USB Token
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenerateSample('BIEN_BAN_HOAN_THANH')}
                      className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 text-left font-semibold text-[11px] transition-colors"
                    >
                      ✔ Biên bản nghiệm thu
                    </button>
                  </div>
                </div>

                {/* Upload or Preview Box */}
                {!newFileDataUrl ? (
                  <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 text-center bg-white dark:bg-slate-800/40 space-y-2">
                    <input
                      type="file"
                      id="complete-file-input"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleProcessUpload(e.target.files[0]);
                        }
                      }}
                      accept="image/*,.pdf,.xml"
                      className="hidden"
                    />
                    <label
                      htmlFor="complete-file-input"
                      className="cursor-pointer inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Chọn Ảnh Từ Máy Tính</span>
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Hoặc bấm <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono font-bold">Ctrl + V</kbd> để dán ảnh chụp màn hình
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-emerald-300 dark:border-emerald-700 flex items-center justify-between gap-3 animate-in fade-in">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="h-12 w-12 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600 shrink-0 bg-slate-100">
                        <img src={newFileDataUrl} alt="Preview" className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white truncate">{newFileName}</div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-2 mt-0.5">
                          <span>{formatFileSize(newFileSize)} (Đã nén WebP)</span>
                          <span>•</span>
                          <span>{ATTACHMENT_CATEGORY_LABELS[newFileCategory]?.label || newFileCategory}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setNewFileDataUrl(null);
                        setNewFileName('');
                      }}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold"
                    >
                      Đổi ảnh
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 2: CHECKLIST & WORKFLOW AUTO-COMPLETION CHECKBOXES */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="font-bold text-slate-800 dark:text-slate-200">
              Kiểm Soát Tiến Độ Nghiệp Vụ:
            </div>

            {incompleteSteps.length > 0 && (
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoCompleteWorkflow}
                  onChange={(e) => setAutoCompleteWorkflow(e.target.checked)}
                  className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <span className="text-slate-700 dark:text-slate-300">
                  Tự động tích hoàn thành <strong>{incompleteSteps.length} bước quy trình</strong> còn lại
                </span>
              </label>
            )}

            {incompleteChecklist.length > 0 && (
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoCompleteChecklist}
                  onChange={(e) => setAutoCompleteChecklist(e.target.checked)}
                  className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <span className="text-slate-700 dark:text-slate-300">
                  Tự động tích hoàn thành <strong>{incompleteChecklist.length} mục checklist soát xét</strong>
                </span>
              </label>
            )}
          </div>

          {/* SECTION 3: COMPLETION NOTES */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 dark:text-slate-200 block">
              Ghi Chú Kết Quả / Bàn Giao Hồ Sơ:
            </label>
            <textarea
              rows={3}
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="Nhập chi tiết bàn giao kết quả cho khách hàng hoặc lưu ý thanh toán..."
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

        </div>

        {/* Footer Action Buttons */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-1.5"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Xác Nhận & Hoàn Thành Công Việc</span>
          </button>
        </div>

      </div>
    </div>
  );
};

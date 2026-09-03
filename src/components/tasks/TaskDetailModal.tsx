import React, { useState, useEffect } from 'react';
import { Customer, Task, User, TaskStatus, TaskPriority, TaskRiskLevel, TaskAttachment, AttachmentCategory, ActiveEditingPresence } from '../../types';
import { 
  X, 
  Building, 
  Calendar, 
  Clock, 
  ShieldAlert, 
  UserCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Paperclip, 
  Send, 
  Sparkles, 
  FileText, 
  Upload, 
  Trash2, 
  Edit3, 
  Save, 
  CheckSquare, 
  History,
  FileCheck,
  ChevronRight,
  Download,
  AlertCircle,
  Maximize2,
  Minimize2,
  Users
} from 'lucide-react';
import { storageService, CURRENT_SYSTEM_DATE } from '../../services/storageService';
import { formatDate, formatDateTime, formatFileSize, PRIORITY_LABELS, RISK_LABELS, STATUS_LABELS, DEPARTMENT_LABELS } from '../../utils/formatters';
import { EvidenceManager } from './EvidenceManager';
import { CompletionEvidenceModal } from './CompletionEvidenceModal';

interface TaskDetailModalProps {
  task: Task;
  customer?: Customer;
  currentUser: User;
  allUsers: User[];
  onClose: () => void;
  onUpdateTask: (updatedTask: Task, reason?: string) => void;
  onOpenCustomerDetail?: (customer: Customer) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  customer,
  currentUser,
  allUsers,
  onClose,
  onUpdateTask,
  onOpenCustomerDetail,
}) => {
  // Tabs inside modal
  const [activeTab, setActiveTab] = useState<'WORKFLOW' | 'CHECKLIST' | 'EVIDENCE' | 'COMMENTS' | 'AI_ADVISOR'>('WORKFLOW');

  // Comment input
  const [newComment, setNewComment] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);

  // Active Peer Editor Presence state
  const [otherEditor, setOtherEditor] = useState<ActiveEditingPresence | null>(null);


  useEffect(() => {
    if (!currentUser) return;
    // Acquire Presence lock on mount
    storageService.acquireEditingLock('TASK', task.id, currentUser);
    setOtherEditor(storageService.getActiveEditor('TASK', task.id, currentUser.id));

    const unsubscribe = storageService.subscribeToSync((evt) => {
      if (evt.entityType === 'TASK' && evt.entityId === task.id) {
        const latest = storageService.getActiveEditor('TASK', task.id, currentUser.id);
        setOtherEditor(prev => {
          if (prev?.userId === latest?.userId) return prev;
          return latest;
        });
      }
    });

    return () => {
      // Release lock on unmount
      storageService.releaseEditingLock('TASK', task.id, currentUser.id);
      unsubscribe();
    };
  }, [task.id, currentUser?.id]);

  // AI Advisor state
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // New checklist item input
  const [newChecklistTitle, setNewChecklistTitle] = useState('');

  // New file simulation state
  const [simulatedFileName, setSimulatedFileName] = useState('');
  const [simulatedCategory, setSimulatedCategory] = useState<AttachmentCategory>('TO_KHAI_THUE');

  // Validation warning
  const [validationError, setValidationError] = useState<string | null>(null);

  const deadlineInfo = storageService.getTaskDeadlineStatus(task);

  // Workflow step toggle
  const handleToggleStep = (stepId: string) => {
    const updatedSteps = task.workflowSteps.map(step => {
      if (step.id === stepId) {
        const nextState = !step.isCompleted;
        return {
          ...step,
          isCompleted: nextState,
          completedAt: nextState ? new Date().toISOString() : undefined,
          completedBy: nextState ? currentUser.id : undefined,
          completedByName: nextState ? currentUser.name : undefined,
        };
      }
      return step;
    });

    onUpdateTask({
      ...task,
      workflowSteps: updatedSteps,
    }, `Cập nhật tiến độ bước quy trình`);
  };

  // Checklist item toggle
  const handleToggleChecklist = (itemId: string) => {
    const updatedChecklist = task.checklist.map(item => {
      if (item.id === itemId) {
        const nextState = !item.isCompleted;
        return {
          ...item,
          isCompleted: nextState,
          completedAt: nextState ? new Date().toISOString() : undefined,
          completedBy: nextState ? currentUser.id : undefined,
          completedByName: nextState ? currentUser.name : undefined,
        };
      }
      return item;
    });

    onUpdateTask({
      ...task,
      checklist: updatedChecklist,
    }, `Cập nhật checklist: ${itemId}`);
  };

  // Add new checklist item
  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistTitle.trim()) return;

    const newItem = {
      id: `cl-custom-${Date.now()}`,
      title: newChecklistTitle.trim(),
      isCompleted: false,
      required: true,
    };

    onUpdateTask({
      ...task,
      checklist: [...task.checklist, newItem],
    }, `Thêm mục kiểm tra: ${newChecklistTitle.trim()}`);

    setNewChecklistTitle('');
  };

  // Add Comment
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment = {
      id: `cm-${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      content: newComment.trim(),
      createdAt: new Date().toISOString(),
      isInternal: true,
    };

    onUpdateTask({
      ...task,
      comments: [...task.comments, comment],
    }, `Thêm trao đổi/ghi chú tiến độ`);

    setNewComment('');
  };

  // Update attachments from EvidenceManager
  const handleUpdateAttachments = (updatedAttachments: TaskAttachment[], auditReason?: string) => {
    onUpdateTask({
      ...task,
      attachments: updatedAttachments,
    }, auditReason || 'Cập nhật danh sách bằng chứng / chứng từ');
  };

  // Dedicated completion workflow confirmation
  const handleConfirmCompletionFlow = (params: {
    completionNotes?: string;
    newAttachment?: TaskAttachment;
    designatedAttachmentId?: string;
    autoCompleteChecklist?: boolean;
    autoCompleteWorkflow?: boolean;
  }) => {
    let finalAttachments = [...task.attachments];
    if (params.newAttachment) {
      finalAttachments = [params.newAttachment, ...finalAttachments];
    }
    if (params.designatedAttachmentId) {
      finalAttachments = finalAttachments.map(a => {
        if (a.id === params.designatedAttachmentId) {
          return { ...a, isCompletionEvidence: true };
        }
        return a;
      });
    }

    const finalWorkflow = params.autoCompleteWorkflow
      ? task.workflowSteps.map(s => ({
          ...s,
          isCompleted: true,
          completedAt: s.completedAt || new Date().toISOString(),
          completedBy: s.completedBy || currentUser.id,
          completedByName: s.completedByName || currentUser.name,
        }))
      : task.workflowSteps;

    const finalChecklist = params.autoCompleteChecklist
      ? task.checklist.map(c => ({
          ...c,
          isCompleted: true,
          completedAt: c.completedAt || new Date().toISOString(),
          completedBy: c.completedBy || currentUser.id,
          completedByName: c.completedByName || currentUser.name,
        }))
      : task.checklist;

    const newComments = [...task.comments];
    if (params.completionNotes) {
      newComments.push({
        id: `cm-comp-${Date.now()}`,
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorRole: currentUser.role,
        content: `[NGHIỆM THU HOÀN THÀNH]: ${params.completionNotes}`,
        createdAt: new Date().toISOString(),
        isInternal: false,
      });
    }

    onUpdateTask({
      ...task,
      status: 'HOAN_THANH',
      completedAt: new Date().toISOString(),
      attachments: finalAttachments,
      workflowSteps: finalWorkflow,
      checklist: finalChecklist,
      comments: newComments,
    }, `Nghiệm thu và xác nhận hoàn thành công việc kèm bằng chứng`);

    setIsCompletionModalOpen(false);
  };

  // Status transition with strict compliance checks
  const handleStatusChange = (newStatus: TaskStatus) => {
    setValidationError(null);

    // If trying to complete the task, prompt completion evidence modal
    if (newStatus === 'HOAN_THANH') {
      setIsCompletionModalOpen(true);
      return;
    }

    onUpdateTask({
      ...task,
      status: newStatus,
      completedAt: undefined,
    }, `Chuyển trạng thái công việc sang [${STATUS_LABELS[newStatus]?.label}]`);
  };

  // AI Tax Risk Analysis trigger
  const runAiAdvisor = async () => {
    setIsAnalyzing(true);
    setAiAnalysis(null);
    try {
      const res = await fetch('/api/ai/tax-risk-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskTitle: task.title,
          taskDescription: task.description,
          customerName: task.customerName,
          taxType: task.taxType,
          dueDate: task.dueDate,
          currentStatus: STATUS_LABELS[task.status]?.label,
          checklist: task.checklist,
          attachments: task.attachments,
        }),
      });
      const data = await res.json();
      if (data.analysis) {
        setAiAnalysis(data.analysis);
      } else if (data.error) {
        setAiAnalysis(`Thông báo hệ thống: ${data.error}`);
      } else {
        setAiAnalysis('Không nhận được dữ liệu phản hồi.');
      }
    } catch (e: any) {
      setAiAnalysis(`Lỗi kết nối dịch vụ AI: ${e.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-2 sm:p-4'}`}>
      <div className={`bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden transition-all duration-150 ${
        isFullscreen
          ? 'w-screen h-screen max-w-none max-h-none rounded-none'
          : 'w-full max-w-[98vw] 2xl:max-w-7xl max-h-[96vh] h-[92vh] rounded-2xl border border-slate-200 dark:border-slate-800'
      }`}>
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                {task.code}
              </span>
              <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${STATUS_LABELS[task.status]?.bg} ${STATUS_LABELS[task.status]?.text} ${STATUS_LABELS[task.status]?.border}`}>
                {STATUS_LABELS[task.status]?.label}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${PRIORITY_LABELS[task.priority]?.badgeClass}`}>
                Ưu tiên: {PRIORITY_LABELS[task.priority]?.label}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${RISK_LABELS[task.riskLevel]?.badgeClass}`}>
                {RISK_LABELS[task.riskLevel]?.label}
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1.5 leading-snug">
              {task.title}
            </h2>

            {/* Customer & Dept Link */}
            <div className="flex items-center space-x-4 mt-2 text-xs text-slate-600 dark:text-slate-300 flex-wrap gap-y-1">
              {task.customerName && (
                <button
                  onClick={() => customer && onOpenCustomerDetail && onOpenCustomerDetail(customer)}
                  className="flex items-center space-x-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Building className="h-3.5 w-3.5" />
                  <span>{task.customerName}</span>
                  {task.customerTaxCode && <span className="font-mono text-slate-400 font-normal">(MST: {task.customerTaxCode})</span>}
                </button>
              )}

              <span className="text-slate-400">•</span>
              <span>{DEPARTMENT_LABELS[task.department]?.label}</span>

              {task.taxPeriod && (
                <>
                  <span className="text-slate-400">•</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Kỳ thuế: {task.taxPeriod}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title={isFullscreen ? 'Thu nhỏ giao diện' : 'Mở rộng toàn màn hình'}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Đóng cửa sổ"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Peer Presence Alert Banner (Anti-Overwrite Protection) */}
        {otherEditor && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span>
                <strong>{otherEditor.userName}</strong> ({otherEditor.userRole}) cũng đang mở xem/chỉnh sửa công việc này.
              </span>
            </div>
            <span className="text-[10px] text-amber-300/80 font-mono hidden sm:inline">
              Khóa đồng bộ phiên bản v{task.version || 1} đang áp dụng
            </span>
          </div>
        )}

        {/* Validation Warning Notice */}
        {validationError && (
          <div className="bg-red-100 dark:bg-red-950/60 border-l-4 border-red-600 p-3 mx-4 mt-3 rounded text-xs text-red-900 dark:text-red-200 flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">{validationError}</div>
          </div>
        )}

        {/* Accountability & Due Date Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-100/50 dark:bg-slate-850/40 border-b border-slate-200 dark:border-slate-800 text-xs">
          
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Người Thực Hiện:</span>
            <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1">
              <UserCheck className="h-3.5 w-3.5 text-blue-600" />
              <span>{task.assigneeName}</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Người Kiểm Tra:</span>
            <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1">
              <FileCheck className="h-3.5 w-3.5 text-indigo-600" />
              <span>{task.reviewerName}</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Người Phê Duyệt:</span>
            <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1">
              <ShieldAlert className="h-3.5 w-3.5 text-purple-600" />
              <span>{task.approverName}</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Hạn Hoàn Thành:</span>
            <div className="flex items-center space-x-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              <span className="font-bold text-slate-900 dark:text-white">{formatDate(task.dueDate)} {task.dueTime}</span>
            </div>
            <div className="text-[10px] font-bold text-red-600">
              {deadlineInfo.labelText}
            </div>
          </div>

        </div>

        {/* Official Boss Approval & Review Status Banner */}
        {task.status === 'HOAN_THANH' || task.approvalDecision === 'APPROVED' ? (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800/80 px-4 py-3 flex items-start space-x-3 text-xs">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-emerald-800 dark:text-emerald-200 uppercase tracking-wider text-[11px]">
                  Hồ Sơ Đã Được Phê Duyệt & Nghiệm Thu Chính Thức
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-200/80 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold text-[10px]">
                  Sếp Chấp Thuận
                </span>
              </div>
              <div className="text-slate-600 dark:text-slate-300 mt-1">
                Cấp phê duyệt: <strong>{task.approvedByName || task.approverName || 'Ban Giám Đốc'}</strong>
                {task.approvedAt && <span> • Thời điểm: {new Date(task.approvedAt).toLocaleString('vi-VN')}</span>}
              </div>
              {task.approvalNotes && (
                <div className="mt-1.5 p-2 rounded-lg bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-200 font-medium italic text-[11px]">
                  Ý kiến phê duyệt: "{task.approvalNotes}"
                </div>
              )}
            </div>
          </div>
        ) : task.status === 'CHO_PHE_DUYET' ? (
          <div className="bg-orange-50 dark:bg-orange-950/40 border-b border-orange-200 dark:border-orange-800/80 px-4 py-3 flex items-start space-x-3 text-xs">
            <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-900/60 text-orange-700 dark:text-orange-300 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-orange-800 dark:text-orange-200 uppercase tracking-wider text-[11px]">
                  Hồ Sơ Đang Chờ Ban Giám Đốc Phê Duyệt & Ký Số
                </span>
                <span className="px-2 py-0.5 rounded-full bg-orange-200/80 dark:bg-orange-900 text-orange-800 dark:text-orange-200 font-bold text-[10px]">
                  Chờ Duyệt
                </span>
              </div>
              <div className="text-slate-600 dark:text-slate-300 mt-1">
                Người phụ trách <strong>{task.assigneeName}</strong> đã nộp hồ sơ. Đang chờ cấp phê duyệt: <strong>{task.approverName || 'Ban Giám Đốc'}</strong> xem xét nghiệm thu.
              </div>
            </div>
          </div>
        ) : task.status === 'CHO_KIEM_TRA' ? (
          <div className="bg-purple-50 dark:bg-purple-950/40 border-b border-purple-200 dark:border-purple-800/80 px-4 py-3 flex items-start space-x-3 text-xs">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 shrink-0">
              <FileCheck className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-purple-800 dark:text-purple-200 uppercase tracking-wider text-[11px]">
                  Hồ Sơ Đang Chờ Kế Toán Trưởng / Kiểm Soát Viên Soát Xét
                </span>
                <span className="px-2 py-0.5 rounded-full bg-purple-200/80 dark:bg-purple-900 text-purple-800 dark:text-purple-200 font-bold text-[10px]">
                  Chờ Soát Xét
                </span>
              </div>
              <div className="text-slate-600 dark:text-slate-300 mt-1">
                Đang chờ người kiểm tra: <strong>{task.reviewerName || 'Kiểm soát viên'}</strong> kiểm tra số liệu, hóa đơn chứng từ trước khi chuyển lên Sếp ký duyệt.
              </div>
            </div>
          </div>
        ) : task.approvalDecision === 'MODIFICATION_REQUESTED' ? (
          <div className="bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-800/80 px-4 py-3 flex items-start space-x-3 text-xs">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-rose-800 dark:text-rose-200 uppercase tracking-wider text-[11px]">
                  Sếp Yêu Cầu Kiểm Tra & Điều Chỉnh Lại Hồ Sơ
                </span>
                <span className="px-2 py-0.5 rounded-full bg-rose-200/80 dark:bg-rose-900 text-rose-800 dark:text-rose-200 font-bold text-[10px]">
                  Yêu Cầu Sửa
                </span>
              </div>
              <div className="text-rose-700 dark:text-rose-300 mt-1 font-medium">
                Ý kiến chỉ đạo của Sếp: "{task.approvalNotes || 'Vui lòng kiểm tra lại số liệu'}"
              </div>
            </div>
          </div>
        ) : null}

        {/* Ad-Hoc Service Fee & Details Banner */}
        {task.serviceCode && (
          <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-850 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded font-mono font-bold bg-blue-600 text-white text-[10px]">
                {task.serviceCode}
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                Dịch vụ phát sinh: {task.serviceName || task.title}
              </span>
              {task.serviceExecutionType && (
                <span className="text-slate-500 font-normal">
                  ({task.serviceExecutionType})
                </span>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {task.serviceQuantity && task.serviceQuantity > 1 && (
                <span className="text-slate-600 dark:text-slate-300">
                  Số lượng: <strong>{task.serviceQuantity}</strong>
                </span>
              )}
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Biểu phí dịch vụ</span>
                <span className="text-xs sm:text-sm font-extrabold text-blue-600 dark:text-blue-400">
                  {task.serviceFeeDisplay || (task.serviceTotalFee ? `${task.serviceTotalFee.toLocaleString('vi-VN')} đ` : 'Theo thỏa thuận')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Workflow Classification & Statutory Tax Allocation Rule Banner */}
        {task.workflowClassification && (
          <div className={`px-4 py-2.5 border-b text-xs flex flex-wrap items-center justify-between gap-2 ${
            task.workflowClassification === 'KE_TOAN_HOA_DON_THUONG_XUYEN'
              ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60 text-indigo-950 dark:text-indigo-200'
              : 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-950 dark:text-amber-200'
          }`}>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                task.workflowClassification === 'KE_TOAN_HOA_DON_THUONG_XUYEN'
                  ? 'bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200'
                  : 'bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
              }`}>
                {task.workflowClassification === 'KE_TOAN_HOA_DON_THUONG_XUYEN'
                  ? '📋 Kế Toán & Hóa Đơn Thường Xuyên'
                  : '⚖️ Kê Khai Thuế Theo Luật Quản Lý Thuế'}
              </span>
              <span className="font-semibold text-[11px]">
                {task.workflowClassification === 'KE_TOAN_HOA_DON_THUONG_XUYEN'
                  ? 'Thực hiện định kỳ Hàng Tháng phục vụ liên tục hoạt động kinh doanh'
                  : task.revenueBracketNote || (task.taxAllocationRule === 'KHAI_THUE_THANG_TREN_50_TY' ? 'Doanh thu năm trước > 50 tỷ: Kê khai theo Tháng' : 'Doanh thu năm trước ≤ 50 tỷ: Kê khai theo Quý')}
              </span>
            </div>
            {task.isTaxObligation && (
              <span className="text-[10px] font-mono font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/60 px-2 py-0.5 rounded">
                Hạn nộp pháp lý: {formatDate(task.dueDate)}
              </span>
            )}
          </div>
        )}

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 space-x-2 bg-white dark:bg-slate-900 text-xs overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('WORKFLOW')}
            className={`py-3 px-3 border-b-2 font-bold transition-all whitespace-nowrap ${
              activeTab === 'WORKFLOW'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Quy Trình Xử Lý ({task.workflowSteps.filter(s => s.isCompleted).length}/{task.workflowSteps.length})
          </button>
          
          <button
            onClick={() => setActiveTab('CHECKLIST')}
            className={`py-3 px-3 border-b-2 font-bold transition-all whitespace-nowrap ${
              activeTab === 'CHECKLIST'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Checklist Nghiệp Vụ ({task.checklist.filter(c => c.isCompleted).length}/{task.checklist.length})
          </button>

          <button
            onClick={() => setActiveTab('EVIDENCE')}
            className={`py-3 px-3 border-b-2 font-bold transition-all whitespace-nowrap ${
              activeTab === 'EVIDENCE'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Hồ Sơ & Bằng Chứng ({task.attachments.length})
          </button>

          <button
            onClick={() => setActiveTab('COMMENTS')}
            className={`py-3 px-3 border-b-2 font-bold transition-all whitespace-nowrap ${
              activeTab === 'COMMENTS'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Trao Đổi / Ghi Chú ({task.comments.length})
          </button>

          <button
            onClick={() => { setActiveTab('AI_ADVISOR'); if (!aiAnalysis) runAiAdvisor(); }}
            className={`py-3 px-3 border-b-2 font-bold transition-all whitespace-nowrap flex items-center space-x-1 ${
              activeTab === 'AI_ADVISOR'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-purple-500 hover:text-purple-700'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Soát Xét Rủi Ro AI</span>
          </button>
        </div>

        {/* Modal Tab Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: WORKFLOW EXECUTION */}
          {activeTab === 'WORKFLOW' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-500">
                Tuân thủ quy trình chuẩn: <strong className="text-slate-700 dark:text-slate-300">Tiếp nhận → Kiểm tra → Đối chiếu → Xử lý sai sót → Lập tờ khai → Kiểm soát → Phê duyệt → Nộp → Lưu chứng từ → Hoàn thành</strong>.
              </div>

              <div className="space-y-2">
                {task.workflowSteps.map((step, idx) => (
                  <div
                    key={step.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                      step.isCompleted
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start space-x-3 flex-1">
                      <button
                        onClick={() => handleToggleStep(step.id)}
                        className={`mt-0.5 h-5 w-5 rounded-md flex items-center justify-center border transition-all ${
                          step.isCompleted
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'border-slate-300 dark:border-slate-600 hover:border-blue-500'
                        }`}
                      >
                        {step.isCompleted && <CheckCircle2 className="h-3.5 w-3.5" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs font-bold ${step.isCompleted ? 'text-emerald-900 dark:text-emerald-200 line-through' : 'text-slate-900 dark:text-white'}`}>
                            {step.name}
                          </span>
                          {step.isMandatory && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-100 text-red-700 font-semibold">
                              Bắt buộc
                            </span>
                          )}
                          {step.requiredEvidence && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 font-semibold">
                              Cần file đính kèm
                            </span>
                          )}
                        </div>

                        {step.isCompleted && step.completedByName && (
                          <div className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1">
                            Xong bởi: <strong>{step.completedByName}</strong> lúc {formatDateTime(step.completedAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: CHECKLIST */}
          {activeTab === 'CHECKLIST' && (
            <div className="space-y-4">
              <div className="space-y-2">
                {task.checklist.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border flex items-start justify-between gap-3 text-xs ${
                      item.isCompleted
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start space-x-3 flex-1">
                      <button
                        onClick={() => handleToggleChecklist(item.id)}
                        className={`mt-0.5 h-4 w-4 rounded flex items-center justify-center border transition-all ${
                          item.isCompleted
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'border-slate-400 hover:border-blue-500'
                        }`}
                      >
                        {item.isCompleted && <CheckCircle2 className="h-3 w-3" />}
                      </button>
                      <div className="flex-1">
                        <span className={item.isCompleted ? 'line-through text-slate-500' : 'font-medium text-slate-900 dark:text-white'}>
                          {item.title}
                        </span>
                        {item.notes && (
                          <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                            Ghi chú: {item.notes}
                          </div>
                        )}
                        {item.isCompleted && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Hoàn thành bởi: {item.completedByName || currentUser.name} ({formatDateTime(item.completedAt)})
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add checklist item */}
              <form onSubmit={handleAddChecklist} className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={newChecklistTitle}
                  onChange={(e) => setNewChecklistTitle(e.target.value)}
                  placeholder="Thêm mục kiểm tra chi tiết mới..."
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
                >
                  Thêm mục
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: EVIDENCE & ATTACHMENTS */}
          {activeTab === 'EVIDENCE' && (
            <EvidenceManager
              task={task}
              currentUser={currentUser}
              onUpdateAttachments={handleUpdateAttachments}
              onRequestCompletion={() => setIsCompletionModalOpen(true)}
            />
          )}

          {/* TAB 4: COMMENTS & PROGRESS NOTES */}
          {activeTab === 'COMMENTS' && (
            <div className="space-y-4">
              <div className="space-y-3">
                {task.comments.map((comment) => (
                  <div key={comment.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {comment.authorName} <span className="font-normal text-slate-400">({comment.authorRole})</span>
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDateTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                ))}

                {task.comments.length === 0 && (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    <span>Chưa có ghi chú nào. Hãy để lại trao đổi hoặc lưu ý nội bộ.</span>
                  </div>
                )}
              </div>

              {/* Add comment */}
              <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Nhập ghi chú tiến độ, báo vướng mắc chứng từ..."
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Gửi</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: AI TAX RISK ADVISOR */}
          {activeTab === 'AI_ADVISOR' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <h3 className="text-xs font-bold text-purple-900 dark:text-purple-300">
                    Trợ Lý AI Phân Tích Rủi Ro Thuế & Soát Xét Hồ Sơ
                  </h3>
                </div>
                <button
                  onClick={runAiAdvisor}
                  disabled={isAnalyzing}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                >
                  {isAnalyzing ? 'Đang phân tích...' : 'Phân tích lại'}
                </button>
              </div>

              {isAnalyzing && (
                <div className="p-8 text-center text-xs text-purple-600 space-y-2">
                  <div className="animate-spin h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
                  <p>AI đang đối soát dữ liệu với quy định Luật Quản lý Thuế và Nghị định 123...</p>
                </div>
              )}

              {aiAnalysis && !isAnalyzing && (
                <div className="p-4 bg-purple-50/70 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800 text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {aiAnalysis}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer: Role-Based Workflow Action Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          
          {/* Left: Role-Specific Action Controls */}
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            
            {/* 1. ASSIGNEE ACTIONS */}
            {(task.assigneeId === currentUser.id || currentUser.role === 'ADMIN') && (
              <>
                {(task.status === 'MOI_TAO' || task.status === 'DA_PHAN_CONG') && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange('DANG_THUC_HIEN')}
                    className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <span>▶️ Bắt đầu xử lý</span>
                  </button>
                )}

                {task.status === 'DANG_THUC_HIEN' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleStatusChange('CHO_KIEM_TRA')}
                      className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-xs transition-all cursor-pointer"
                    >
                      <span>🚀 Gửi Trưởng phòng soát xét</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange('CHO_CHUNG_TU')}
                      className="flex items-center space-x-1.5 px-3 py-2 bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 rounded-xl font-semibold transition-all cursor-pointer"
                    >
                      <span>⏸️ Chờ chứng từ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange('CHO_KHACH_HANG')}
                      className="flex items-center space-x-1.5 px-3 py-2 bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 rounded-xl font-semibold transition-all cursor-pointer"
                    >
                      <span>⏸️ Chờ khách hàng</span>
                    </button>
                  </>
                )}

                {(task.status === 'CHO_CHUNG_TU' || task.status === 'CHO_KHACH_HANG') && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange('DANG_THUC_HIEN')}
                    className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <span>▶️ Đã có chứng từ, tiếp tục xử lý</span>
                  </button>
                )}
              </>
            )}

            {/* 2. REVIEWER / KTT ACTIONS */}
            {(task.reviewerId === currentUser.id || currentUser.role === 'TRUONG_PHONG' || currentUser.role === 'TRUONG_NHOM' || currentUser.role === 'ADMIN' || currentUser.role === 'BAN_GIAM_DOC') && (
              <>
                {task.status === 'CHO_KIEM_TRA' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleStatusChange('CHO_PHE_DUYET')}
                      className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-xs transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>✅ Duyệt soát xét & Trình Giám Đốc</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange('DANG_THUC_HIEN')}
                      className="flex items-center space-x-1.5 px-3 py-2 bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/30 hover:bg-red-500/30 rounded-xl font-semibold transition-all cursor-pointer"
                    >
                      <span>↩️ Trả lại yêu cầu sửa</span>
                    </button>
                  </>
                )}
              </>
            )}

            {/* 3. BAN GIÁM ĐỐC / APPROVER ACTIONS */}
            {(task.approverId === currentUser.id || currentUser.role === 'BAN_GIAM_DOC' || currentUser.role === 'ADMIN') && (
              <>
                {task.status === 'CHO_PHE_DUYET' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleStatusChange('HOAN_THANH')}
                      className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-xs transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>🏆 Ký số & Nghiệm thu hoàn thành</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange('CHO_KIEM_TRA')}
                      className="flex items-center space-x-1.5 px-3 py-2 bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 rounded-xl font-semibold transition-all cursor-pointer"
                    >
                      <span>↩️ Yêu cầu soát xét lại</span>
                    </button>
                  </>
                )}
              </>
            )}

            {/* Direct Status Selector: Only for Admin & Director */}
            {(currentUser.role === 'ADMIN' || currentUser.role === 'BAN_GIAM_DOC') && (
              <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-300 dark:border-slate-700">
                <span className="text-slate-500 font-semibold text-[11px]">Đổi trực tiếp:</span>
                <select
                  value={task.status}
                  onChange={(e: any) => handleStatusChange(e.target.value)}
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="MOI_TAO">1. Mới tạo</option>
                  <option value="DA_PHAN_CONG">2. Đã phân công</option>
                  <option value="DANG_THUC_HIEN">3. Đang thực hiện</option>
                  <option value="CHO_CHUNG_TU">4. Chờ chứng từ</option>
                  <option value="CHO_KHACH_HANG">5. Chờ khách hàng</option>
                  <option value="CHO_KIEM_TRA">6. Chờ kiểm tra</option>
                  <option value="CHO_PHE_DUYET">7. Chờ phê duyệt</option>
                  <option value="HOAN_THANH">8. Hoàn thành</option>
                  <option value="QUA_HAN">9. Quá hạn</option>
                  <option value="HUY">10. Hủy</option>
                </select>
              </div>
            )}

          </div>

          {/* Right: Completion / Close */}
          <div className="flex items-center space-x-2 shrink-0">
            {task.status !== 'HOAN_THANH' && (currentUser.role === 'ADMIN' || currentUser.role === 'BAN_GIAM_DOC') && (
              <button
                type="button"
                onClick={() => handleStatusChange('HOAN_THANH')}
                className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-xs transition-all cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Nghiệm thu nhanh</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-semibold transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>

        </div>

      </div>

      {/* Completion Evidence & Handover Modal */}
      {isCompletionModalOpen && (
        <CompletionEvidenceModal
          task={task}
          currentUser={currentUser}
          onClose={() => setIsCompletionModalOpen(false)}
          onConfirmComplete={handleConfirmCompletionFlow}
        />
      )}
    </div>
  );
};

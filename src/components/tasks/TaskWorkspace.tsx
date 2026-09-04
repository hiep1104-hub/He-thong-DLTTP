import React, { useState, useMemo, useEffect, useRef } from 'react';

import { storageService, CURRENT_SYSTEM_DATE } from '../../services/storageService';
import { 
  formatDate, 
  PRIORITY_LABELS, 
  RISK_LABELS, 
  STATUS_LABELS, 
  DEPARTMENT_LABELS, 
  getTaskNature, 
  TaskNature, 
  TASK_NATURE_LABELS,
  formatCurrency 
} from '../../utils/formatters';
import { PermissionService } from '../../utils/permissions';
import { TaskStatus, TaskPriority, TaskRiskLevel, Department, ChecklistTemplate, AdHocServiceItem, ChecklistItem } from '../../types';

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
  Users,
  Calendar as CalendarIcon,
  Plus,
  Layers,
  Tag,
  Image,
  File,
  Link,
  Check,
  ShieldCheck,
  Settings,
  ChevronUp,
  ChevronDown,
  Eye,
} from 'lucide-react';
import { storageService, CURRENT_SYSTEM_DATE } from '../../services/storageService';
import { formatDate, formatDateTime, formatFileSize, PRIORITY_LABELS, RISK_LABELS, STATUS_LABELS, DEPARTMENT_LABELS } from '../../utils/formatters';

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
    <div className={`fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-end`}>
      <div className={`bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 border-l border-slate-200 dark:border-slate-800 ${
        isFullscreen
          ? 'w-full h-full'
          : 'w-full max-w-5xl h-full'
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


// --- START OF
interface EvidenceManagerProps {
  task: Task;
  currentUser: User;
  onUpdateAttachments: (attachments: TaskAttachment[], auditReason?: string) => void;
  onRequestCompletion?: () => void;
}

export const EvidenceManager: React.FC<EvidenceManagerProps> = ({
  task,
  currentUser,
  onUpdateAttachments,
  onRequestCompletion,
}) => {
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);

  // Upload Form State
  const [customFileName, setCustomFileName] = useState('');
  const [category, setCategory] = useState<AttachmentCategory>('TO_KHAI_THUE');
  const [isCompletionEvidence, setIsCompletionEvidence] = useState(true);
  const [notes, setNotes] = useState('');
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [compressedStats, setCompressedStats] = useState<{ size: number; width: number; height: number } | null>(null);

  // Lightbox Modal State
  const [lightboxImage, setLightboxImage] = useState<TaskAttachment | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Sample presets generator open
  const [showSampleMenu, setShowSampleMenu] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  // Global & Local Clipboard Paste Listener for quick Screenshots
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            e.preventDefault();
            handleProcessFile(blob, `Anh_Chup_Man_Hinh_${Date.now()}.png`);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleProcessFile = async (file: File | Blob, suggestedName?: string) => {
    setIsProcessing(true);
    setProcessingStatus('Đang tối ưu & nén ảnh nhẹ...');
    try {
      const fileName = suggestedName || (file instanceof File ? file.name : `evidence_${Date.now()}.webp`);
      if (isImageFile(file.type, fileName)) {
        // Compress image using HTML5 Canvas
        const result = await compressImageFile(file, {
          maxWidth: 1600,
          maxHeight: 1600,
          quality: 0.8,
          preferredMime: 'image/webp',
          fileName,
        });

        setPreviewDataUrl(result.dataUrl);
        setCustomFileName(fileName.replace(/\.[^/.]+$/, "") + '.webp');
        setCompressedStats({
          size: result.size,
          width: result.width,
          height: result.height,
        });
        if (file instanceof File) {
          setPendingFile(file);
        }
      } else {
        // Normal non-image file
        const reader = new FileReader();
        reader.onload = (ev) => {
          setPreviewDataUrl(ev.target?.result as string);
          setCustomFileName(fileName);
          setCompressedStats({
            size: file.size,
            width: 0,
            height: 0,
          });
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      console.error('Error processing image:', err);
      alert('Không thể xử lý tệp tin: ' + err.message);
    } finally {
      setIsProcessing(false);
      setProcessingStatus(null);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleSaveAttachment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!previewDataUrl) return;

    const fileName = customFileName.trim() || `Bang_Chung_${Date.now()}.webp`;
    const newAtt: TaskAttachment = {
      id: `att-${Date.now()}`,
      name: fileName,
      url: previewDataUrl,
      thumbnailUrl: previewDataUrl,
      fileType: previewDataUrl.startsWith('data:image/') ? 'image/webp' : 'application/octet-stream',
      size: compressedStats ? compressedStats.size : 120000,
      uploadedBy: currentUser.id,
      uploadedByName: currentUser.name,
      uploadedAt: new Date().toISOString(),
      version: task.attachments.length + 1,
      category,
      isCompletionEvidence,
      isImage: isImageFile(undefined, fileName) || previewDataUrl.startsWith('data:image/'),
      notes: notes.trim() || undefined,
      dimensions: compressedStats && compressedStats.width > 0 ? { width: compressedStats.width, height: compressedStats.height } : undefined,
    };

    const updated = [newAtt, ...task.attachments];
    onUpdateAttachments(updated, `Đính kèm bằng chứng ảnh: ${newAtt.name} (${ATTACHMENT_CATEGORY_LABELS[category]?.label || category})`);

    // Reset Form
    setPreviewDataUrl(null);
    setPendingFile(null);
    setCompressedStats(null);
    setCustomFileName('');
    setNotes('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteAttachment = (attId: string, attName: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa bằng chứng "${attName}" không?`)) {
      const updated = task.attachments.filter(a => a.id !== attId);
      onUpdateAttachments(updated, `Xóa bằng chứng: ${attName}`);
      if (lightboxImage?.id === attId) {
        setLightboxImage(null);
      }
    }
  };

  const handleToggleCompletionEvidence = (attId: string) => {
    const updated = task.attachments.map(a => {
      if (a.id === attId) {
        return { ...a, isCompletionEvidence: !a.isCompletionEvidence };
      }
      return a;
    });
    onUpdateAttachments(updated, `Cập nhật trạng thái bằng chứng hoàn thành`);
  };

  const handleGenerateSample = (type: 'THONG_BAO_THUE' | 'UNC_NGAN_HANG' | 'KY_SO_TOKEN' | 'BIEN_BAN_HOAN_THANH') => {
    const sample = createSampleEvidenceImage(type, {
      customerName: task.customerName,
      taxCode: task.customerTaxCode || '0108923456',
      taskTitle: task.title,
      period: task.taxPeriod || 'Kỳ hiện tại',
      signerName: currentUser.name,
    });

    const newAtt: TaskAttachment = {
      id: `att-sample-${Date.now()}`,
      name: sample.name,
      url: sample.dataUrl,
      thumbnailUrl: sample.dataUrl,
      fileType: 'image/png',
      size: sample.size,
      uploadedBy: currentUser.id,
      uploadedByName: currentUser.name,
      uploadedAt: new Date().toISOString(),
      version: task.attachments.length + 1,
      category: sample.category,
      isCompletionEvidence: true,
      isImage: true,
      dimensions: sample.dimensions,
      notes: 'Bằng chứng mẫu điện tử hợp lệ theo quy chuẩn CQT & Đại lý thuế',
    };

    const updated = [newAtt, ...task.attachments];
    onUpdateAttachments(updated, `Tạo bằng chứng điện tử mẫu: ${sample.name}`);
    setShowSampleMenu(false);
  };

  // Stats
  const imageCount = task.attachments.filter(a => a.isImage || isImageFile(a.fileType, a.name) || (a.url && a.url.startsWith('data:image/'))).length;
  const completionEvidenceCount = task.attachments.filter(a => a.isCompletionEvidence).length;
  const totalBytes = task.attachments.reduce((acc, curr) => acc + (curr.size || 0), 0);

  return (
    <div className="space-y-4">
      
      {/* Top Banner: Status & Capacity overview */}
      <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/80 dark:to-indigo-950/40 rounded-xl border border-blue-200/80 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs">
            <ImageIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <span>Lưu Trữ Bằng Chứng Siêu Nhẹ (Ảnh Nén WebP / PNG)</span>
              {completionEvidenceCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] flex items-center space-x-1 border border-emerald-300 dark:border-emerald-800">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Đã có {completionEvidenceCount} bằng chứng hoàn thành</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold text-[10px] flex items-center space-x-1 border border-amber-300 dark:border-amber-800">
                  <AlertCircle className="h-3 w-3" />
                  <span>Chưa có bằng chứng hoàn thành</span>
                </span>
              )}
            </div>
            <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 flex items-center space-x-2">
              <span>Tổng cộng: <strong className="text-slate-800 dark:text-slate-200">{task.attachments.length} tệp</strong> ({imageCount} ảnh)</span>
              <span>•</span>
              <span>Dung lượng: <strong className="text-slate-800 dark:text-slate-200">{formatFileSize(totalBytes)}</strong></span>
              <span>•</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-medium">Hỗ trợ Ctrl+V chụp màn hình & Kéo thả</span>
            </div>
          </div>
        </div>

        {/* View toggle & Sample Generator button */}
        <div className="flex items-center space-x-2 self-end sm:self-center">
          <div className="relative">
            <button
              onClick={() => setShowSampleMenu(!showSampleMenu)}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              <span>Tạo Bằng Chứng Mẫu</span>
            </button>

            {showSampleMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-72 bg-white dark:bg-slate-850 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-30 space-y-1 animate-in fade-in zoom-in-95">
                <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Chọn mẫu bằng chứng nghiệp vụ
                </div>
                <button
                  onClick={() => handleGenerateSample('THONG_BAO_THUE')}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs flex items-center space-x-2"
                >
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <div>
                    <div className="font-bold">1. Thông báo tiếp nhận thuế CQT</div>
                    <div className="text-[10px] text-slate-400">eTax thuedientu.gdt.gov.vn</div>
                  </div>
                </button>
                <button
                  onClick={() => handleGenerateSample('UNC_NGAN_HANG')}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs flex items-center space-x-2"
                >
                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                  <div>
                    <div className="font-bold">2. Giấy nộp tiền NSNN (Vietcombank)</div>
                    <div className="text-[10px] text-slate-400">Chứng từ nộp thuế thành công</div>
                  </div>
                </button>
                <button
                  onClick={() => handleGenerateSample('KY_SO_TOKEN')}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs flex items-center space-x-2"
                >
                  <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                  <div>
                    <div className="font-bold">3. Xác nhận Ký số USB Token CKS</div>
                    <div className="text-[10px] text-slate-400">Chữ ký điện tử RSA-2048</div>
                  </div>
                </button>
                <button
                  onClick={() => handleGenerateSample('BIEN_BAN_HOAN_THANH')}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-teal-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs flex items-center space-x-2"
                >
                  <div className="h-2 w-2 rounded-full bg-teal-500"></div>
                  <div>
                    <div className="font-bold">4. Biên bản nghiệm thu bàn giao</div>
                    <div className="text-[10px] text-slate-400">Xác nhận 2 bên hoàn thành 100%</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <div className="flex bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('GRID')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'GRID' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-900'}`}
              title="Xem dạng Lưới ảnh (Gallery)"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('LIST')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'LIST' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-900'}`}
              title="Xem dạng Danh sách chi tiết"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Upload Dropzone & Live Image Processor */}
      <div 
        ref={dropzoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`p-4 rounded-2xl border-2 transition-all ${
          isDragging 
            ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 scale-[0.99]' 
            : previewDataUrl 
              ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-950/20' 
              : 'border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-50'
        }`}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept="image/*,.pdf,.xml,.xlsx,.docx"
          className="hidden"
        />

        {isProcessing && (
          <div className="py-8 text-center space-y-2">
            <div className="animate-spin h-7 w-7 border-3 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400">{processingStatus}</p>
          </div>
        )}

        {!isProcessing && !previewDataUrl && (
          <div className="text-center py-4 space-y-3">
            <div className="flex justify-center items-center space-x-2">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full">
                <Upload className="h-6 w-6" />
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-full">
                <ImageIcon className="h-6 w-6" />
              </div>
            </div>
            
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Kéo thả ảnh chứng từ vào đây hoặc{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-bold"
                >
                  chọn file từ máy tính
                </button>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Mẹo: Bấm <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px] font-mono font-bold">Ctrl + V</kbd> bất kỳ đâu để dán nhanh ảnh chụp màn hình nộp tờ khai thuế / ủy nhiệm chi ngân hàng!
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center space-x-1.5"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Tải Ảnh Bằng Chứng</span>
              </button>
              <button
                type="button"
                onClick={() => handleGenerateSample('THONG_BAO_THUE')}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                <span>Tạo Mẫu CQT Nhanh</span>
              </button>
            </div>
          </div>
        )}

        {/* Live Image Preview & Metadata Form before confirming upload */}
        {previewDataUrl && !isProcessing && (
          <div className="space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Ảnh đã được nén tối ưu (<span className="text-emerald-600 font-mono">{formatFileSize(compressedStats?.size || 0)}</span>)
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPreviewDataUrl(null);
                  setPendingFile(null);
                  setCompressedStats(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              {/* Thumbnail preview */}
              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black/5 dark:bg-black/40 group aspect-video sm:aspect-auto sm:h-36 flex items-center justify-center">
                {previewDataUrl.startsWith('data:image/') ? (
                  <img 
                    src={previewDataUrl} 
                    alt="Preview" 
                    className="max-h-full max-w-full object-contain cursor-pointer"
                    onClick={() => setLightboxImage({
                      id: 'preview',
                      name: customFileName || 'Ảnh xem trước',
                      url: previewDataUrl,
                      fileType: 'image/webp',
                      size: compressedStats?.size || 0,
                      uploadedBy: currentUser.id,
                      uploadedByName: currentUser.name,
                      uploadedAt: new Date().toISOString(),
                      version: 1,
                      category,
                    })}
                  />
                ) : (
                  <div className="p-4 text-center text-slate-500">
                    <FileText className="h-10 w-10 mx-auto text-blue-500 mb-1" />
                    <span className="text-[11px] font-bold">{customFileName}</span>
                  </div>
                )}
                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-mono">
                  {compressedStats?.width ? `${compressedStats.width}x${compressedStats.height}` : 'Tệp dữ liệu'}
                </div>
              </div>

              {/* Form details */}
              <div className="md:col-span-2 space-y-2.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tên bằng chứng / Chứng từ:
                  </label>
                  <input
                    type="text"
                    value={customFileName}
                    onChange={(e) => setCustomFileName(e.target.value)}
                    placeholder="Ví dụ: Thong_Bao_Tiep_Nhan_Thue_T07_2026.webp"
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Phân loại chứng từ:
                    </label>
                    <select
                      value={category}
                      onChange={(e: any) => setCategory(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-semibold focus:outline-none"
                    >
                      <option value="TO_KHAI_THUE">Tờ khai thuế & Thông báo CQT</option>
                      <option value="CHUNG_TU_NOP_TIEN">Giấy nộp tiền / UNC Ngân hàng</option>
                      <option value="HOA_DON">Hóa đơn chứng từ / Bảng kê</option>
                      <option value="SAO_KE_NGAN_HANG">Sao kê ngân hàng</option>
                      <option value="BCTC">Báo cáo tài chính & Sổ cái</option>
                      <option value="HOP_DONG">Hợp đồng dịch vụ</option>
                      <option value="BIEN_BAN">Biên bản nghiệm thu / Bàn giao</option>
                      <option value="HO_SO_PHAP_LY">Hồ sơ pháp lý / ĐKKD</option>
                      <option value="KHAC">Chứng từ khác</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Ghi chú thêm:
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Mã giao dịch, số tờ khai, lưu ý..."
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCompletionEvidence}
                      onChange={(e) => setIsCompletionEvidence(e.target.checked)}
                      className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                    />
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      ⭐ Đánh dấu là Bằng chứng nghiệm thu hoàn thành (Completion Proof)
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewDataUrl(null);
                      setPendingFile(null);
                      setCompressedStats(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 font-semibold"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveAttachment()}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-xs flex items-center space-x-1"
                  >
                    <Check className="h-4 w-4" />
                    <span>Lưu Bằng Chứng Vào Hồ Sơ</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* List / Gallery of Attached Evidence */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
          <span>Danh Sách Hồ Sơ & Bằng Chứng Đã Đính Kèm ({task.attachments.length})</span>
          {onRequestCompletion && task.status !== 'HOAN_THANH' && (
            <button
              onClick={onRequestCompletion}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center space-x-1"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Đi đến Nghiệm Thu & Hoàn Thành</span>
            </button>
          )}
        </div>

        {task.attachments.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-850">
            <ImageIcon className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="font-bold text-slate-600 dark:text-slate-400">Chưa có ảnh bằng chứng hay chứng từ nào được đính kèm.</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Hãy bấm "Tải Ảnh Bằng Chứng" hoặc chọn "Tạo Bằng Chứng Mẫu" để bổ sung chứng từ hoàn thành công việc.
            </p>
          </div>
        )}

        {/* GRID VIEW */}
        {viewMode === 'GRID' && task.attachments.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {task.attachments.map((file) => {
              const isImg = file.isImage || isImageFile(file.fileType, file.name) || (file.url && file.url.startsWith('data:image/'));
              const catInfo = ATTACHMENT_CATEGORY_LABELS[file.category] || { label: file.category, badgeClass: 'bg-slate-100 text-slate-800 border-slate-200' };

              return (
                <div
                  key={file.id}
                  className={`group relative rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                    file.isCompletionEvidence
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 shadow-xs'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  {/* Completion Star Ribbon */}
                  {file.isCompletionEvidence && (
                    <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-bold shadow-xs flex items-center space-x-1">
                      <Star className="h-2.5 w-2.5 fill-current" />
                      <span>Bằng chứng hoàn thành</span>
                    </div>
                  )}

                  {/* Thumbnail Container */}
                  <div 
                    onClick={() => {
                      if (file.url) {
                        setLightboxImage(file);
                        setZoomLevel(1);
                        setRotation(0);
                      }
                    }}
                    className="relative w-full h-36 bg-slate-100 dark:bg-slate-900 flex items-center justify-center cursor-pointer overflow-hidden border-b border-slate-200/80 dark:border-slate-700/80"
                  >
                    {file.url ? (
                      <img 
                        src={file.url} 
                        alt={file.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                    ) : (
                      <div className="text-center p-3">
                        <FileText className="h-10 w-10 text-blue-500 mx-auto mb-1 opacity-70" />
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          {file.fileType?.split('/')[1] || 'FILE'}
                        </span>
                      </div>
                    )}

                    {/* Hover Overlay with Quick Actions */}
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {file.url && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightboxImage(file);
                            setZoomLevel(1);
                            setRotation(0);
                          }}
                          className="p-2 rounded-xl bg-white/90 dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-white shadow-lg transition-transform hover:scale-110"
                          title="Phóng to ảnh"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      {file.url && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadDataUrl(file.url!, file.name);
                          }}
                          className="p-2 rounded-xl bg-white/90 dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-white shadow-lg transition-transform hover:scale-110"
                          title="Tải ảnh về máy"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAttachment(file.id, file.name);
                        }}
                        className="p-2 rounded-xl bg-red-600/90 text-white hover:bg-red-600 shadow-lg transition-transform hover:scale-110"
                        title="Xóa bằng chứng"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white text-[9px] font-mono font-semibold">
                      {formatFileSize(file.size)}
                    </div>
                  </div>

                  {/* Card Content Details */}
                  <div className="p-3 text-xs flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white truncate" title={file.name}>
                        {file.name}
                      </div>

                      <div className="mt-1 flex items-center justify-between gap-1 flex-wrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${catInfo.badgeClass}`}>
                          {catInfo.label}
                        </span>
                      </div>

                      {file.notes && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic line-clamp-2">
                          "{file.notes}"
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                      <div>
                        <span>Bởi: <strong>{file.uploadedByName}</strong></span>
                        <div className="text-[9px]">{formatDateTime(file.uploadedAt)}</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleCompletionEvidence(file.id)}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                          file.isCompletionEvidence
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                        title="Đổi trạng thái Bằng chứng hoàn thành"
                      >
                        {file.isCompletionEvidence ? '✔ Bằng chứng HT' : 'Đặt làm BC'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* LIST VIEW */}
        {viewMode === 'LIST' && task.attachments.length > 0 && (
          <div className="space-y-2">
            {task.attachments.map((file) => {
              const catInfo = ATTACHMENT_CATEGORY_LABELS[file.category] || { label: file.category, badgeClass: 'bg-slate-100 text-slate-800' };

              return (
                <div
                  key={file.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                    file.isCompletionEvidence
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div 
                      onClick={() => file.url && setLightboxImage(file)}
                      className="h-10 w-10 rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center shrink-0 cursor-pointer border border-slate-300 dark:border-slate-600"
                    >
                      {file.url ? (
                        <img src={file.url} alt={file.name} className="h-full w-full object-cover" />
                      ) : (
                        <FileText className="h-5 w-5 text-blue-600" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 dark:text-white truncate">{file.name}</span>
                        {file.isCompletionEvidence && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-600 text-white text-[9px] font-bold shrink-0">
                            ★ Hoàn thành
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center space-x-2 mt-0.5">
                        <span className="font-mono">{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>Bởi {file.uploadedByName}</span>
                        <span>•</span>
                        <span>{formatDateTime(file.uploadedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${catInfo.badgeClass}`}>
                      {catInfo.label}
                    </span>

                    {file.url && (
                      <button
                        type="button"
                        onClick={() => setLightboxImage(file)}
                        className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-blue-600 hover:text-white transition-colors"
                        title="Xem ảnh"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {file.url && (
                      <button
                        type="button"
                        onClick={() => downloadDataUrl(file.url!, file.name)}
                        className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-emerald-600 hover:text-white transition-colors"
                        title="Tải về"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteAttachment(file.id, file.name)}
                      className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-red-600 hover:text-white transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* LIGHTBOX MODAL: FULL RESOLUTION IMAGE VIEWER */}
      {lightboxImage && lightboxImage.url && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col animate-in fade-in">
          {/* Top Bar */}
          <div className="p-3 sm:p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-white text-xs">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="p-2 rounded-lg bg-blue-600/30 text-blue-400">
                <ImageIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="font-bold truncate">{lightboxImage.name}</div>
                <div className="text-[10px] text-slate-400 flex items-center space-x-2">
                  <span>{formatFileSize(lightboxImage.size)}</span>
                  <span>•</span>
                  <span>Đăng bởi {lightboxImage.uploadedByName}</span>
                  <span>•</span>
                  <span>{formatDateTime(lightboxImage.uploadedAt)}</span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                title="Thu nhỏ"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-[11px] font-mono w-12 text-center text-slate-300">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                title="Phóng to"
              >
                <ZoomIn className="h-4 w-4" />
              </button>

              <button
                onClick={() => setRotation(prev => (prev + 90) % 360)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                title="Xoay 90 độ"
              >
                <RotateCw className="h-4 w-4" />
              </button>

              <button
                onClick={() => downloadDataUrl(lightboxImage.url!, lightboxImage.name)}
                className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center space-x-1"
                title="Tải ảnh về máy"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Tải về</span>
              </button>

              <button
                onClick={() => setLightboxImage(null)}
                className="p-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white"
                title="Đóng (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Canvas stage */}
          <div 
            onClick={() => setLightboxImage(null)}
            className="flex-1 overflow-auto flex items-center justify-center p-4 cursor-zoom-out select-none"
          >
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="transition-transform duration-150 ease-out cursor-default max-w-full max-h-full flex items-center justify-center"
              style={{
                transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
              }}
            >
              <img 
                src={lightboxImage.url} 
                alt={lightboxImage.name} 
                className="max-w-[90vw] max-h-[82vh] object-contain rounded-lg shadow-2xl bg-white"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};


// --- START OF
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


// --- START OF
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
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-end">
      <div className="bg-white dark:bg-slate-900 shadow-2xl w-full max-w-2xl h-full overflow-hidden animate-in slide-in-from-right duration-300 flex flex-col border-l border-slate-200 dark:border-slate-800">
        
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

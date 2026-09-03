import React, { useState, useMemo } from 'react';
import { Customer, Task, User, TaskStatus } from '../../types';
import { 
  Building, 
  Clock, 
  Paperclip, 
  CheckSquare, 
  UserCheck, 
  AlertTriangle, 
  ShieldAlert, 
  Plus, 
  FileCheck, 
  Calendar, 
  Zap, 
  Layers, 
  Filter, 
  Search, 
  Maximize2, 
  Minimize2, 
  ArrowRight, 
  CheckCircle2, 
  RotateCcw, 
  Flame, 
  ShieldCheck, 
  SlidersHorizontal,
  ChevronRight,
  Info
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { formatDate, PRIORITY_LABELS, RISK_LABELS, STATUS_LABELS, getTaskNature } from '../../utils/formatters';

interface TaskKanbanProps {
  tasks: Task[];
  customers?: Customer[];
  users?: User[];
  currentUser?: User;
  onSelectTask: (task: Task) => void;
  onSelectCustomer?: (customer: Customer) => void;
  onOpenCreateTask: () => void;
}

interface KanbanColumn {
  id: string;
  title: string;
  statuses: TaskStatus[];
  color: string;
  badgeBg: string;
  badgeText: string;
  dotColor: string;
  description: string;
}

export const TaskKanban: React.FC<TaskKanbanProps> = ({
  tasks,
  customers = [],
  users = [],
  currentUser,
  onSelectTask,
  onSelectCustomer,
  onOpenCreateTask,
}) => {
  const [selectedNature, setSelectedNature] = useState<'ALL' | 'PERIODIC' | 'ADHOC'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('ALL');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Column definitions with clear status mapping
  const columns: KanbanColumn[] = [
    {
      id: 'COL_TODO',
      title: 'Chờ thực hiện',
      statuses: ['MOI_TAO', 'DA_PHAN_CONG', 'CHO_CHUNG_TU', 'CHO_KHACH_HANG'],
      color: 'border-t-blue-500',
      badgeBg: 'bg-blue-100 dark:bg-blue-950/80',
      badgeText: 'text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800',
      dotColor: 'bg-blue-500',
      description: 'Mới tạo, đã phân công, chờ chứng từ & chờ KH',
    },
    {
      id: 'COL_IN_PROGRESS',
      title: 'Đang xử lý',
      statuses: ['DANG_THUC_HIEN'],
      color: 'border-t-indigo-500',
      badgeBg: 'bg-indigo-100 dark:bg-indigo-950/80',
      badgeText: 'text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800',
      dotColor: 'bg-indigo-500',
      description: 'Chuyên viên đang hạch toán & soạn hồ sơ',
    },
    {
      id: 'COL_REVIEW',
      title: 'Chờ duyệt & Quá hạn',
      statuses: ['CHO_KIEM_TRA', 'CHO_PHE_DUYET', 'QUA_HAN'],
      color: 'border-t-amber-500',
      badgeBg: 'bg-amber-100 dark:bg-amber-950/80',
      badgeText: 'text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800',
      dotColor: 'bg-amber-500',
      description: 'KTT soát xét, BGD duyệt & cảnh báo rủi ro',
    },
    {
      id: 'COL_DONE',
      title: 'Đã hoàn thành',
      statuses: ['HOAN_THANH'],
      color: 'border-t-emerald-500',
      badgeBg: 'bg-emerald-100 dark:bg-emerald-950/80',
      badgeText: 'text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800',
      dotColor: 'bg-emerald-500',
      description: 'Đã nộp CQT thành công & bàn giao hồ sơ',
    },
  ];

  // Filter tasks by nature, search query, priority, assignee
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Nature filter
      if (selectedNature !== 'ALL' && getTaskNature(task) !== selectedNature) {
        return false;
      }
      // Priority filter
      if (selectedPriority !== 'ALL' && task.priority !== selectedPriority) {
        return false;
      }
      // Assignee filter
      if (selectedAssignee !== 'ALL' && task.assigneeId !== selectedAssignee) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (task.title || '').toLowerCase().includes(q);
        const matchCode = (task.code || '').toLowerCase().includes(q);
        const matchCustomer = (task.customerName || '').toLowerCase().includes(q);
        const matchTaxCode = (task.customerTaxCode || '').toLowerCase().includes(q);
        const matchAssignee = (task.assigneeName || '').toLowerCase().includes(q);
        if (!matchTitle && !matchCode && !matchCustomer && !matchTaxCode && !matchAssignee) {
          return false;
        }
      }
      return true;
    });
  }, [tasks, selectedNature, selectedPriority, selectedAssignee, searchQuery]);

  // Counts for each category
  const counts = useMemo(() => {
    const todo = tasks.filter(t => ['MOI_TAO', 'DA_PHAN_CONG', 'CHO_CHUNG_TU', 'CHO_KHACH_HANG'].includes(t.status)).length;
    const inProgress = tasks.filter(t => t.status === 'DANG_THUC_HIEN').length;
    const review = tasks.filter(t => ['CHO_KIEM_TRA', 'CHO_PHE_DUYET', 'QUA_HAN'].includes(t.status)).length;
    const done = tasks.filter(t => t.status === 'HOAN_THANH').length;
    const periodic = tasks.filter(t => getTaskNature(t) === 'PERIODIC').length;
    const adhoc = tasks.filter(t => getTaskNature(t) === 'ADHOC').length;

    return {
      total: tasks.length,
      todo,
      inProgress,
      review,
      done,
      periodic,
      adhoc,
    };
  }, [tasks]);

  // Quick move task status
  const handleQuickStatusChange = (e: React.MouseEvent, task: Task, newStatus: TaskStatus) => {
    e.stopPropagation();
    const updated = {
      ...task,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    storageService.updateTask(updated);
    window.location.reload(); // Simple sync
  };

  return (
    <div 
      id="kanban-main-wrapper" 
      className={`transition-all duration-200 ${
        isFullscreen 
          ? 'fixed inset-0 z-50 bg-slate-100 dark:bg-slate-950 p-4 md:p-6 flex flex-col overflow-hidden' 
          : 'space-y-4 w-full'
      }`}
    >
      {/* Top Header Controls */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 shrink-0">
        
        {/* Row 1: Nature filter pills, Search input, Fullscreen toggle, Create Button */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Left: Nature Filter Switcher */}
          <div className="flex items-center space-x-1.5 flex-wrap">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setSelectedNature('ALL')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectedNature === 'ALL'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Tất cả ({counts.total})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedNature('PERIODIC')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectedNature === 'PERIODIC'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-blue-600'
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>Định kỳ theo Gói ({counts.periodic})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedNature('ADHOC')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectedNature === 'ADHOC'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-amber-600'
                }`}
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Phát sinh / 49 DV ({counts.adhoc})</span>
              </button>
            </div>
          </div>

          {/* Right: Search, Priority filter, Fullscreen toggle & Create button */}
          <div className="flex items-center space-x-2 flex-wrap ml-auto">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm mã việc, tên cty, MST, chuyên viên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl w-52 sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 placeholder-slate-400"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">Mọi mức độ ưu tiên</option>
              <option value="KHAN_CAP">🔥 Khẩn cấp</option>
              <option value="CAO">⚡ Cao</option>
              <option value="TRUNG_BINH">🔹 Trung bình</option>
              <option value="THAP">⚪ Thấp</option>
            </select>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`p-1.5 rounded-xl border transition-all text-xs font-bold flex items-center space-x-1 cursor-pointer ${
                isFullscreen
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
              title={isFullscreen ? 'Thu nhỏ về khung xem thông thường' : 'Mở rộng Bảng Kanban toàn màn hình (Full Screen)'}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Thu nhỏ</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Toàn màn hình</span>
                </>
              )}
            </button>

            {/* Create Task Button */}
            <button
              type="button"
              onClick={onOpenCreateTask}
              className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Giao việc mới</span>
            </button>
          </div>

        </div>

        {/* Row 2: Distribution Visualizer Bar (Phân bổ chuẩn: 51 | 4 | 2 | 1) */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span className="font-bold text-slate-800 dark:text-slate-100">Phân bổ Kanban:</span>
            <div className="flex items-center space-x-3 flex-wrap text-xs">
              <span className="flex items-center space-x-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500 inline-block" />
                <span className="text-slate-700 dark:text-slate-200 font-medium">Chờ thực hiện:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-900">{counts.todo}</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 inline-block" />
                <span className="text-slate-700 dark:text-slate-200 font-medium">Đang xử lý:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.2 rounded border border-indigo-200 dark:border-indigo-900">{counts.inProgress}</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block" />
                <span className="text-slate-700 dark:text-slate-200 font-medium">Chờ duyệt & Quá hạn:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-900">{counts.review}</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
                <span className="text-slate-700 dark:text-slate-200 font-medium">Đã hoàn thành:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-900">{counts.done}</span>
              </span>
            </div>
          </div>

          {/* Mini progress bar strip */}
          <div className="hidden lg:flex items-center space-x-1 w-64 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shrink-0">
            <div style={{ width: `${(counts.todo / counts.total) * 100}%` }} className="h-full bg-blue-500" title={`Chờ thực hiện: ${counts.todo}`} />
            <div style={{ width: `${(counts.inProgress / counts.total) * 100}%` }} className="h-full bg-indigo-500" title={`Đang xử lý: ${counts.inProgress}`} />
            <div style={{ width: `${(counts.review / counts.total) * 100}%` }} className="h-full bg-amber-500" title={`Chờ duyệt & Quá hạn: ${counts.review}`} />
            <div style={{ width: `${(counts.done / counts.total) * 100}%` }} className="h-full bg-emerald-500" title={`Đã hoàn thành: ${counts.done}`} />
          </div>
        </div>

      </div>

      {/* 4-COLUMN RESPONSIVE FULL-SCREEN KANBAN GRID */}
      <div 
        className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full ${
          isFullscreen 
            ? 'flex-1 min-h-0' 
            : 'h-[calc(100vh-210px)] min-h-[640px]'
        }`}
      >
        {columns.map((col) => {
          const colTasks = filteredTasks.filter(t => col.statuses.includes(t.status));

          return (
            <div
              key={col.id}
              className={`bg-slate-100/80 dark:bg-slate-900/70 rounded-2xl border border-slate-200/90 dark:border-slate-800 border-t-4 ${col.color} p-3.5 flex flex-col min-h-0 shadow-xs h-full`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-2.5 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <div className="flex items-center space-x-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${col.dotColor}`} />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-100">
                    {col.title}
                  </h3>
                </div>

                <div className="flex items-center space-x-1.5">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-black ${col.badgeBg} ${col.badgeText}`}>
                    {colTasks.length}
                  </span>
                </div>
              </div>

              {/* Column Subtitle / Description */}
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5 px-0.5 truncate shrink-0">
                {col.description}
              </div>

              {/* Scrollable Task Cards List */}
              <div className="space-y-3 flex-1 overflow-y-auto pr-1 pb-2 custom-scrollbar">
                {colTasks.map((task) => {
                  const nature = getTaskNature(task);
                  const deadlineInfo = storageService.getTaskDeadlineStatus(task);
                  const completedSteps = (task.workflowSteps || []).filter(s => s.isCompleted).length;
                  const totalSteps = (task.workflowSteps || []).length;
                  const completedChecklists = (task.checklist || []).filter(c => c.isCompleted).length;
                  const totalChecklists = (task.checklist || []).length;

                  return (
                    <div
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-750 shadow-xs hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-all space-y-2.5 group relative"
                    >
                      {/* Top Header: Code, Nature tag, Priority badge */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center space-x-1.5 min-w-0">
                          <span className="font-mono text-[11px] font-black text-blue-600 dark:text-blue-400 shrink-0">
                            {task.code}
                          </span>
                          {nature === 'PERIODIC' ? (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
                              Định kỳ
                            </span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-black bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
                              Phát sinh
                            </span>
                          )}
                        </div>

                        <span className={`text-[9px] px-1.5 py-0.2 rounded border font-bold shrink-0 ${PRIORITY_LABELS[task.priority]?.badgeClass}`}>
                          {PRIORITY_LABELS[task.priority]?.label}
                        </span>
                      </div>

                      {/* Task Title */}
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                        {task.title}
                      </h4>

                      {/* Customer Info & Tax Code */}
                      <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                        <div 
                          onClick={(e) => {
                            if (onSelectCustomer && task.customerId) {
                              const matched = customers.find(c => c.id === task.customerId);
                              if (matched) {
                                e.stopPropagation();
                                onSelectCustomer(matched);
                              }
                            }
                          }}
                          className={`flex items-center space-x-1.5 min-w-0 ${
                            onSelectCustomer && task.customerId ? 'hover:text-blue-600 dark:hover:text-blue-400 hover:underline cursor-pointer' : ''
                          }`}
                          title={onSelectCustomer && task.customerId ? 'Click để mở hồ sơ khách hàng' : undefined}
                        >
                          <Building className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[170px]">
                            {task.customerName || 'Nội bộ công ty'}
                          </span>
                        </div>
                        {task.customerTaxCode && (
                          <span className="text-[9px] font-mono text-slate-400 shrink-0">
                            {task.customerTaxCode}
                          </span>
                        )}
                      </div>

                      {/* Tax Type / Period Badge (if applicable) */}
                      {(task.taxPeriod || task.taxType) && (
                        <div className="flex items-center gap-1.5 text-[9px] flex-wrap">
                          {task.taxType && (
                            <span className="px-1.5 py-0.2 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800">
                              Thuế {task.taxType}
                            </span>
                          )}
                          {task.taxPeriod && (
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                              {task.taxPeriod}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Risk & Deadline Badges */}
                      <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-750">
                        <div className="flex items-center justify-between text-[10px] gap-1">
                          <span className={`px-1.5 py-0.5 rounded border font-semibold ${RISK_LABELS[task.riskLevel]?.badgeClass}`}>
                            {RISK_LABELS[task.riskLevel]?.label}
                          </span>
                          
                          <span className={`px-1.5 py-0.5 rounded font-bold ${
                            deadlineInfo.alertColor === 'DARK_RED' ? 'bg-red-900 text-white font-extrabold' :
                            deadlineInfo.alertColor === 'RED' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' :
                            deadlineInfo.alertColor === 'ORANGE' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}>
                            {deadlineInfo.labelText}
                          </span>
                        </div>

                        {/* Progress Bars / Steps info */}
                        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
                          <span>Quy trình: {completedSteps}/{totalSteps || 3} bước</span>
                          {(task.attachments || []).length > 0 && (
                            <span className="flex items-center space-x-0.5 text-blue-600 dark:text-blue-400 font-bold">
                              <Paperclip className="h-3 w-3" />
                              <span>{task.attachments.length}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Assignee & Due Date Footer */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-750 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                        <div className="flex items-center space-x-1.5 min-w-0">
                          <UserCheck className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[130px]">
                            {task.assigneeName || 'Chưa giao'}
                          </span>
                        </div>
                        <span className="font-mono text-slate-400 shrink-0">
                          {formatDate(task.dueDate)}
                        </span>
                      </div>

                      {/* Quick Move Action Buttons (hover effect) */}
                      <div className="pt-1.5 flex items-center justify-end space-x-1 text-[10px] border-t border-slate-100 dark:border-slate-750/80">
                        {col.id === 'COL_TODO' && (
                          <button
                            type="button"
                            onClick={(e) => handleQuickStatusChange(e, task, 'DANG_THUC_HIEN')}
                            className="text-[10px] px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:hover:bg-indigo-900 dark:text-indigo-300 rounded font-bold flex items-center space-x-1 transition-all"
                            title="Chuyển sang Đang xử lý"
                          >
                            <span>Bắt đầu xử lý</span>
                            <ArrowRight className="h-2.5 w-2.5" />
                          </button>
                        )}
                        {col.id === 'COL_IN_PROGRESS' && (
                          <button
                            type="button"
                            onClick={(e) => handleQuickStatusChange(e, task, 'CHO_KIEM_TRA')}
                            className="text-[10px] px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950 dark:hover:bg-amber-900 dark:text-amber-300 rounded font-bold flex items-center space-x-1 transition-all"
                            title="Gửi Kế toán trưởng kiểm tra"
                          >
                            <span>Gửi kiểm tra</span>
                            <ArrowRight className="h-2.5 w-2.5" />
                          </button>
                        )}
                        {col.id === 'COL_REVIEW' && (
                          <button
                            type="button"
                            onClick={(e) => handleQuickStatusChange(e, task, 'HOAN_THANH')}
                            className="text-[10px] px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:hover:bg-emerald-900 dark:text-emerald-300 rounded font-bold flex items-center space-x-1 transition-all"
                            title="Duyệt và hoàn thành"
                          >
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            <span>Duyệt & Nộp thuế</span>
                          </button>
                        )}
                        {col.id === 'COL_DONE' && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Đã hoàn thành</span>
                          </span>
                        )}
                      </div>

                    </div>
                  );
                })}

                {colTasks.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white/40 dark:bg-slate-800/40">
                    <CheckSquare className="h-6 w-6 mx-auto mb-1.5 opacity-40" />
                    <span>Không có công việc nào</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

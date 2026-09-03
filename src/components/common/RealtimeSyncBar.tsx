import React, { useState, useEffect } from 'react';
import { User, Task, Customer, RealtimeSyncEvent } from '../../types';
import { storageService } from '../../services/storageService';
import { 
  Wifi, 
  Users, 
  RefreshCw, 
  ShieldCheck, 
  CheckCircle, 
  Clock, 
  Zap, 
  UserCheck, 
  Filter,
  Flame,
  ArrowRight
} from 'lucide-react';

interface RealtimeSyncBarProps {
  currentUser: User;
  tasks: Task[];
  customers: Customer[];
  onSelectMyTasks: () => void;
  onSelectPendingReview: () => void;
  onOpenDuplicateScanner: () => void;
  onForceSync: () => void;
  activeFilter?: string;
}

export const RealtimeSyncBar: React.FC<RealtimeSyncBarProps> = ({
  currentUser,
  tasks,
  customers,
  onSelectMyTasks,
  onSelectPendingReview,
  onOpenDuplicateScanner,
  onForceSync,
  activeFilter,
}) => {
  const [syncTimeDisplay, setSyncTimeDisplay] = useState<string>('vừa xong');
  const [lastEvent, setLastEvent] = useState<RealtimeSyncEvent | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = storageService.subscribeToSync((evt) => {
      setLastEvent(evt);
      setSyncTimeDisplay('vừa xong');
    });

    const timer = setInterval(() => {
      const diffSec = Math.floor((Date.now() - storageService.getLastSyncTime()) / 1000);
      if (diffSec < 5) {
        setSyncTimeDisplay('vừa xong');
      } else if (diffSec < 60) {
        setSyncTimeDisplay(`${diffSec}s trước`);
      } else {
        setSyncTimeDisplay(`${Math.floor(diffSec / 60)}m trước`);
      }
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  const handleManualSync = () => {
    setIsSyncing(true);
    storageService.broadcastSync({
      id: `SYNC-${Date.now()}`,
      type: 'FORCE_SYNC',
      senderId: currentUser.id,
      senderName: currentUser.name,
      timestamp: new Date().toISOString(),
    });
    onForceSync();
    setTimeout(() => setIsSyncing(false), 500);
  };

  // Calculate my daily workload
  const myAssignedTasks = tasks.filter(t => t.assigneeId === currentUser.id && t.status !== 'HOAN_THANH' && t.status !== 'HUY');
  const myReviewTasks = tasks.filter(t => (t.reviewerId === currentUser.id || t.approverId === currentUser.id) && (t.status === 'CHO_KIEM_TRA' || t.status === 'CHO_PHE_DUYET'));
  const myOverdueTasks = myAssignedTasks.filter(t => {
    const s = storageService.getTaskDeadlineStatus(t);
    return s.isOverdue || s.alertColor === 'RED' || s.alertColor === 'DARK_RED';
  });

  return (
    <div className="bg-slate-900 text-white border-b border-slate-800 px-3 sm:px-6 py-2">
      <div className="flex flex-col md:flex-row items-center justify-between gap-2.5">
        
        {/* Left: Online Status & 30 Staff Live Connection */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700 px-2.5 py-1 rounded-lg text-xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-emerald-400">ONLINE</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300 text-[11px] flex items-center space-x-1">
              <Users className="h-3 w-3 text-blue-400" />
              <span><strong>30</strong> nhân sự</span>
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-[10px] text-slate-400 font-mono">Đồng bộ: {syncTimeDisplay}</span>
          </div>

          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-all cursor-pointer"
            title="Bấm để đồng bộ dữ liệu tức thì"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>

        {/* Center: Live Action Minimalist Strip for Daily 30-Staff Ops */}
        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-center">
          
          {/* Quick Focus Button: My Tasks */}
          <button
            onClick={onSelectMyTasks}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border ${
              activeFilter === 'MY_TASKS'
                ? 'bg-blue-600 border-blue-400 text-white shadow-md'
                : 'bg-slate-800 hover:bg-slate-700/80 border-slate-700 text-slate-200'
            }`}
          >
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span>Việc Của Tôi</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
              myAssignedTasks.length > 0 ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'
            }`}>
              {myAssignedTasks.length}
            </span>
            {myOverdueTasks.length > 0 && (
              <span className="px-1 py-0.2 rounded text-[9px] font-black bg-red-600 text-white animate-pulse" title="Việc quá hạn">
                !{myOverdueTasks.length}
              </span>
            )}
          </button>

          {/* Quick Focus Button: Pending My Review / Approval */}
          {(currentUser.role === 'BAN_GIAM_DOC' || currentUser.role === 'TRUONG_PHONG' || currentUser.role === 'TRUONG_NHOM' || myReviewTasks.length > 0) && (
            <button
              onClick={onSelectPendingReview}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border ${
                activeFilter === 'PENDING_REVIEW'
                  ? 'bg-amber-600 border-amber-400 text-white shadow-md'
                  : 'bg-slate-800 hover:bg-slate-700/80 border-slate-700 text-slate-200'
              }`}
            >
              <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Chờ Tôi Duyệt</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                myReviewTasks.length > 0 ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300'
              }`}>
                {myReviewTasks.length}
              </span>
            </button>
          )}

          {/* Anti-Duplicate & Anti-Collision Engine Tool */}
          <button
            onClick={onOpenDuplicateScanner}
            className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 flex items-center space-x-1.5 cursor-pointer"
            title="Kiểm tra & Ngăn chặn dữ liệu trùng lặp / xung đột lưu đè"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
            <span className="hidden sm:inline">Chống Trùng Lặp & Ghi Đè</span>
            <span className="sm:hidden">Chống Trùng</span>
          </button>
        </div>

        {/* Right: Live Event Notification Ticker */}
        {lastEvent && (
          <div className="hidden lg:flex items-center space-x-2 text-[11px] text-slate-300 bg-slate-800/60 px-2.5 py-1 rounded-md border border-slate-700 max-w-xs truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></span>
            <span className="truncate">
              <strong>{lastEvent.senderName || 'Đồng nghiệp'}:</strong>{' '}
              {lastEvent.type === 'TASK_CREATED' && 'vừa tạo công việc mới'}
              {lastEvent.type === 'TASK_UPDATED' && 'vừa cập nhật tiến độ công việc'}
              {lastEvent.type === 'CUSTOMER_CREATED' && 'vừa thêm khách hàng mới'}
              {lastEvent.type === 'CUSTOMER_UPDATED' && 'vừa cập nhật hồ sơ khách hàng'}
              {lastEvent.type === 'FORCE_SYNC' && 'vừa đồng bộ hệ thống'}
              {lastEvent.type === 'LOCK_ACQUIRED' && 'đang mở chỉnh sửa'}
            </span>
          </div>
        )}

      </div>
    </div>
  );
};

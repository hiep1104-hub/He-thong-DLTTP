import React, { useState } from 'react';
import { Customer, Task, User } from '../../types';
import { storageService } from '../../services/storageService';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  Eye, 
  Layers, 
  X, 
  RefreshCw,
  Search,
  Building2,
  FileText
} from 'lucide-react';

interface DuplicateScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onOpenCustomer: (customer: Customer) => void;
  onOpenTask: (task: Task) => void;
  onDataChanged: () => void;
}

export const DuplicateScannerModal: React.FC<DuplicateScannerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenCustomer,
  onOpenTask,
  onDataChanged,
}) => {
  const [activeTab, setActiveTab] = useState<'CUSTOMERS' | 'TASKS'>('CUSTOMERS');
  const [isScanning, setIsScanning] = useState(false);

  if (!isOpen) return null;

  const { duplicateCustomers, duplicateTasks } = storageService.scanAllDuplicates();

  const handleResolveDuplicateCustomer = (keepCustomer: Customer, removeCustomer: Customer) => {
    if (window.confirm(`Bạn có chắc chắn muốn giữ lại hồ sơ [${keepCustomer.code || keepCustomer.name}] và xóa bỏ bản ghi trùng [${removeCustomer.code || removeCustomer.name}]?`)) {
      storageService.deleteCustomer(removeCustomer.id, currentUser);
      onDataChanged();
    }
  };

  const handleResolveDuplicateTask = (keepTask: Task, cancelTask: Task) => {
    if (window.confirm(`Bạn có chắc chắn muốn hủy phiếu việc trùng [${cancelTask.code}] để giữ lại phiếu [${keepTask.code}]?`)) {
      storageService.updateTask({ ...cancelTask, status: 'HUY' }, currentUser, 'Hủy bỏ do phát hiện tạo trùng lặp với phiếu việc ' + keepTask.code);
      onDataChanged();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-black uppercase tracking-tight">
                  Công Cụ Kiểm Soát & Chống Trùng Lặp Dữ Liệu
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  Real-time Anti-Duplicate
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Bảo vệ toàn vẹn dữ liệu cho 30 nhân sự, phát hiện và xử lý trùng lặp MST, trùng tờ khai và chống ghi đè
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher & Stats */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('CUSTOMERS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'CUSTOMERS'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Building2 className="h-4 w-4" />
              <span>Trùng Lặp Khách Hàng (MST)</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                duplicateCustomers.length > 0 ? 'bg-red-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {duplicateCustomers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('TASKS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'TASKS'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Trùng Lặp Công Việc / Tờ Khai</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                duplicateTasks.length > 0 ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {duplicateTasks.length}
              </span>
            </button>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Tự động quét khi tạo/sửa trên toàn hệ thống</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'CUSTOMERS' && (
            <div>
              {duplicateCustomers.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="h-16 w-16 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Không phát hiện trùng lặp Mã Số Thuế!
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                    Toàn bộ hồ sơ doanh nghiệp và mã số thuế trong hệ thống đều là duy nhất. Cơ chế chống trùng tự động đang hoạt động chuẩn xác.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 rounded-xl text-xs text-red-800 dark:text-red-300 flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <strong>Cảnh báo trùng lặp:</strong> Phát hiện {duplicateCustomers.length} nhóm doanh nghiệp có cùng mã số thuế. Bạn nên giữ lại hồ sơ đầy đủ nhất và loại bỏ bản ghi thừa.
                    </div>
                  </div>

                  {duplicateCustomers.map((group, gIdx) => (
                    <div key={gIdx} className="bg-slate-50 dark:bg-slate-800/40 border border-red-200 dark:border-red-900/40 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-black text-red-600 dark:text-red-400 text-sm">
                            MST: {group[0].taxCode}
                          </span>
                          <span className="text-xs text-slate-500">
                            ({group.length} bản ghi trùng)
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {group.map((cust, cIdx) => (
                          <div key={cust.id} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-2">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                                  {cust.name}
                                </span>
                                <span className="text-[10px] font-mono bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded">
                                  {cust.code || cust.id}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-1 space-y-0.5">
                                <div>Phụ trách: <strong>{cust.assignedStaffName || 'Chưa gán'}</strong></div>
                                <div>Địa chỉ: <span className="truncate">{cust.address}</span></div>
                                <div>Gói: {cust.servicePackage}</div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                              <button
                                onClick={() => onOpenCustomer(cust)}
                                className="flex-1 py-1 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-[11px] font-bold flex items-center justify-center space-x-1 cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Xem</span>
                              </button>
                              {cIdx > 0 && (
                                <button
                                  onClick={() => handleResolveDuplicateCustomer(group[0], cust)}
                                  className="py-1 px-2.5 bg-red-600 hover:bg-red-500 text-white rounded text-[11px] font-bold flex items-center space-x-1 cursor-pointer"
                                  title="Xóa bản ghi trùng này"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Xóa trùng</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'TASKS' && (
            <div>
              {duplicateTasks.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="h-16 w-16 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Không phát hiện phiếu việc kê khai trùng lặp!
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                    Không có nhân viên nào bị giao trùng cùng 1 loại tờ khai / kỳ thuế cho cùng 1 khách hàng.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <strong>Cảnh báo công việc trùng:</strong> Phát hiện {duplicateTasks.length} nhóm công việc có cùng loại tờ khai & kỳ thuế cho cùng một khách hàng.
                    </div>
                  </div>

                  {duplicateTasks.map((group, gIdx) => (
                    <div key={gIdx} className="bg-slate-50 dark:bg-slate-800/40 border border-amber-200 dark:border-amber-900/40 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            {group[0].customerName} (MST: {group[0].customerTaxCode})
                          </div>
                          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                            Tờ khai: {group[0].taxType} • Kỳ thuế: {group[0].taxPeriod}
                          </div>
                        </div>
                        <span className="text-xs bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded font-bold">
                          {group.length} phiếu việc trùng
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {group.map((t, tIdx) => (
                          <div key={t.id} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-2">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                                  [{t.code}] {t.title}
                                </span>
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                  {t.status}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-1 space-y-0.5">
                                <div>Người thực hiện: <strong>{t.assigneeName}</strong></div>
                                <div>Hạn hoàn thành: <strong>{formatDate(t.dueDate)}</strong></div>
                                <div>Phiên bản: v{t.version || 1} • Cập nhật: {formatDateTime(t.updatedAt)}</div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                              <button
                                onClick={() => onOpenTask(t)}
                                className="flex-1 py-1 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-[11px] font-bold flex items-center justify-center space-x-1 cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Xem việc</span>
                              </button>
                              {tIdx > 0 && (
                                <button
                                  onClick={() => handleResolveDuplicateTask(group[0], t)}
                                  className="py-1 px-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-bold flex items-center space-x-1 cursor-pointer"
                                  title="Hủy phiếu việc trùng này"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  <span>Hủy trùng</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            Hệ thống khóa đồng thời (Optimistic Concurrency Lock) tự động ngăn chặn ghi đè khi có 30 nhân viên cùng thao tác.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-bold cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};

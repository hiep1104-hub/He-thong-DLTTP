import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  HardDrive, 
  FileText, 
  Users, 
  Calendar, 
  DollarSign, 
  FileCheck2, 
  Receipt, 
  MessageSquare, 
  History, 
  Lock,
  Building,
  Info
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { User, DatabaseModuleKey, DatabaseModuleInfo, DatabaseSystemStats } from '../../types';
import { formatDateTime } from '../../utils/formatters';

interface DatabaseEmergencyCenterProps {
  currentUser?: User;
  onDataReload: () => void;
}

export const DatabaseEmergencyCenter: React.FC<DatabaseEmergencyCenterProps> = ({
  currentUser,
  onDataReload,
}) => {
  const [stats, setStats] = useState<DatabaseSystemStats>(() => storageService.getDatabaseStatistics());
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Single Module Purge Modal
  const [moduleToPurge, setModuleToPurge] = useState<DatabaseModuleInfo | null>(null);
  const [moduleConfirmText, setModuleConfirmText] = useState('');

  // Nuclear Full Reset Modal
  const [isNuclearWipeOpen, setIsNuclearWipeOpen] = useState(false);
  const [nuclearConfirmText, setNuclearConfirmText] = useState('');

  const refreshStats = () => {
    setStats(storageService.getDatabaseStatistics());
  };

  useEffect(() => {
    refreshStats();
  }, []);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // 1. Export Backup JSON
  const handleExportBackup = () => {
    try {
      const dataStr = storageService.exportFullDataJSON();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      a.download = `TaxCore_CSDL_Backup_${timestamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
      refreshStats();
      showNotification('success', 'Đã tải về tệp sao lưu khẩn cấp JSON thành công!');
    } catch (err: any) {
      showNotification('error', `Lỗi sao lưu: ${err.message}`);
    }
  };

  // 2. Import Restore from JSON
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonStr = event.target?.result as string;
        const res = storageService.restoreBackup(jsonStr, currentUser);
        if (res.success) {
          refreshStats();
          onDataReload();
          showNotification('success', 'Đã khôi phục toàn bộ CSDL từ bản sao lưu thành công!');
        } else {
          showNotification('error', res.message || 'Tệp sao lưu không hợp lệ.');
        }
      } catch (err: any) {
        showNotification('error', `Lỗi khôi phục: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 3. Purge Single Module
  const handleConfirmPurgeSingleModule = () => {
    if (!moduleToPurge) return;
    const result = storageService.clearModuleData(moduleToPurge.key, currentUser);
    if (result.success) {
      refreshStats();
      onDataReload();
      showNotification('success', result.message);
    } else {
      showNotification('error', result.message);
    }
    setModuleToPurge(null);
    setModuleConfirmText('');
  };

  // 4. Nuclear Wipe
  const handleExecuteNuclearWipe = () => {
    if (nuclearConfirmText.trim().toUpperCase() !== 'XAC NHAN XOA') {
      showNotification('error', 'Vui lòng gõ chính xác "XAC NHAN XOA".');
      return;
    }

    try {
      const res = storageService.clearAllData({
        keepAdminUser: true,
        actor: currentUser,
      });

      if (res.backupJSON) {
        const blob = new Blob([res.backupJSON], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `TaxCore_AUTO_BACKUP_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }

      setIsNuclearWipeOpen(false);
      setNuclearConfirmText('');
      refreshStats();
      onDataReload();
      showNotification('success', res.message);
    } catch (err: any) {
      showNotification('error', `Lỗi xóa dữ liệu: ${err.message}`);
    }
  };

  // 5. Purge Mock Data only
  const handlePurgeMockData = () => {
    try {
      const res = storageService.purgeMockData(currentUser);
      refreshStats();
      onDataReload();
      showNotification('success', res.message);
    } catch (err: any) {
      showNotification('error', `Lỗi dọn dữ liệu giả lập: ${err.message}`);
    }
  };

  const getModuleIcon = (key: DatabaseModuleKey) => {
    switch (key) {
      case 'CUSTOMERS': return <Building className="h-4 w-4 text-blue-600" />;
      case 'TASKS': return <FileText className="h-4 w-4 text-emerald-600" />;
      case 'TEMPLATES': return <FileCheck2 className="h-4 w-4 text-purple-600" />;
      case 'EMPLOYEES': return <Users className="h-4 w-4 text-indigo-600" />;
      case 'LEAVE_REQUESTS': return <Calendar className="h-4 w-4 text-amber-600" />;
      case 'PAYROLL': return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'TAX_FILINGS': return <Receipt className="h-4 w-4 text-teal-600" />;
      case 'PAYMENT_SLIPS': return <DollarSign className="h-4 w-4 text-blue-600" />;
      case 'SUPPORT_REQUESTS': return <MessageSquare className="h-4 w-4 text-rose-600" />;
      case 'AUDIT_LOGS': return <History className="h-4 w-4 text-slate-600" />;
      case 'ACTIVE_LOCKS': return <Lock className="h-4 w-4 text-amber-600" />;
      case 'USERS': return <Users className="h-4 w-4 text-cyan-600" />;
      default: return <Database className="h-4 w-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between shadow-xs ${
          notification.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-800 dark:text-emerald-200' :
          notification.type === 'error' ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 text-rose-800 dark:text-rose-200' :
          'bg-blue-50 dark:bg-blue-950/60 border-blue-300 text-blue-800 dark:text-blue-200'
        }`}>
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-rose-600" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">×</button>
        </div>
      )}

      {/* Top 2 Core Actions: Export, Import */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        
        {/* 1. Export Backup */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 mb-1">
              <Download className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Sao Lưu Dữ Liệu</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Xuất File CSDL (.JSON)</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Tải toàn bộ dữ liệu nghiệp vụ về máy tính để lưu trữ an toàn.</p>
          </div>
          <button
            onClick={handleExportBackup}
            className="mt-3 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Tải Bản Sao Lưu JSON</span>
          </button>
        </div>

        {/* 2. Import Restore */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 mb-1">
              <Upload className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Khôi Phục CSDL</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Nhập Từ Bản Sao Lưu</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Nạp lại dữ liệu từ tệp tin JSON đã sao lưu trước đó.</p>
          </div>
          <label className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer">
            <Upload className="h-3.5 w-3.5" />
            <span>Chọn Tệp JSON Khôi Phục</span>
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>
        </div>

      </div>

      {/* Database Storage Overview & Table Metrics */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        
        {/* Header Bar */}
        <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-850">
          <div className="flex items-center space-x-2">
            <HardDrive className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Cơ Sở Dữ Liệu Các Phân Hệ ({(stats.totalRecords ?? 0).toLocaleString()} bản ghi • {stats.totalSizeFormatted || '0 KB'})
            </span>
          </div>

          <div className="flex items-center space-x-3 text-[11px] text-slate-500">
            <span>Đồng bộ: <strong className="text-slate-800 dark:text-slate-200">{formatDateTime(stats.lastBackupDate || new Date().toISOString())}</strong></span>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {stats.modules?.map(mod => (
            <div
              key={mod.key}
              className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex items-center justify-between hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                  {getModuleIcon(mod.key)}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {mod.label}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {(mod.recordCount ?? 0).toLocaleString()} bản ghi
                  </div>
                </div>
              </div>

              {mod.key !== 'USERS' && (
                <button
                  type="button"
                  title="Xóa trắng bảng này"
                  onClick={() => {
                    setModuleToPurge(mod);
                    setModuleConfirmText('');
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Safe Danger Zone Footer */}
        <div className="p-3 bg-rose-50/40 dark:bg-rose-950/20 border-t border-rose-100 dark:border-rose-900/40 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center space-x-2 text-rose-800 dark:text-rose-300">
            <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
            <span>Khu vực bảo trì CSDL: Dọn sạch dữ liệu giả lập hoặc khởi tạo lại hệ thống</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePurgeMockData}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center space-x-1.5"
              title="Xóa toàn bộ các bản ghi giả lập/demo còn lưu trong trình duyệt"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Xóa Dữ Liệu Giả Lập</span>
            </button>

            <button
              onClick={() => {
                setIsNuclearWipeOpen(true);
                setNuclearConfirmText('');
              }}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs transition-all shadow-xs cursor-pointer"
            >
              Xóa Trắng CSDL
            </button>
          </div>
        </div>

      </div>

      {/* Modal: Single Module Purge */}
      {moduleToPurge && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center space-x-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Xác Nhận Làm Sạch Phân Hệ: {moduleToPurge.label}
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Thao tác này sẽ xóa <strong>{(moduleToPurge.recordCount ?? 0).toLocaleString()} bản ghi</strong> trong bảng {moduleToPurge.label}. Hệ thống sẽ tự động sao lưu bản snapshot trước khi xóa.
            </p>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setModuleToPurge(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmPurgeSingleModule}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nuclear Wipe */}
      {isNuclearWipeOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-300 dark:border-rose-800 p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2 text-rose-600">
              <ShieldAlert className="h-6 w-6" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Xóa Trắng Toàn Bộ CSDL
              </h3>
            </div>

            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-xs text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-900 space-y-1">
              <div>⚠️ <strong>Cảnh báo nghiêm trọng:</strong> Tất cả dữ liệu công việc, khách hàng, hợp đồng, bảng lương sẽ bị xóa trắng. Hệ thống sẽ tải về tệp sao lưu tự động trước khi thực hiện.</div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                🛡️ Tài khoản <strong>Quản Trị Hệ Thống (Admin - USR-030)</strong> và Tổng Giám Đốc sẽ luôn được bảo tồn để quản trị tiếp tục.
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Gõ chính xác cụm từ <span className="font-mono text-rose-600 font-extrabold">XAC NHAN XOA</span>:
              </label>
              <input
                type="text"
                value={nuclearConfirmText}
                onChange={(e) => setNuclearConfirmText(e.target.value)}
                placeholder="XAC NHAN XOA"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsNuclearWipeOpen(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleExecuteNuclearWipe}
                disabled={nuclearConfirmText.trim().toUpperCase() !== 'XAC NHAN XOA'}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Tiến Hành Xóa
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

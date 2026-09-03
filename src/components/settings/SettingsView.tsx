import React, { useState } from 'react';
import { Settings, Database, Building, ShieldCheck, KeyRound, CheckCircle2 } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { User } from '../../types';
import { RolePermissionsManager } from './RolePermissionsManager';
import { DatabaseEmergencyCenter } from './DatabaseEmergencyCenter';
import { IAMSecurityCenterView } from '../iam/IAMSecurityCenterView';

interface SettingsViewProps {
  currentUser?: User;
  allUsers?: User[];
  onDataReload: () => void;
  onSwitchUser?: (user: User) => void;
  initialTab?: 'IAM_SECURITY' | 'RBAC' | 'COMPANY' | 'DATABASE';
}

export const SettingsView: React.FC<SettingsViewProps> = ({ 
  currentUser, 
  allUsers = [], 
  onDataReload,
  onSwitchUser,
  initialTab = 'IAM_SECURITY'
}) => {
  const [activeTab, setActiveTab] = useState<'IAM_SECURITY' | 'RBAC' | 'DATABASE' | 'COMPANY'>(initialTab);
  const [companyName, setCompanyName] = useState('CÔNG TY TNHH ĐẠI LÝ THUẾ THÀNH PHỐ');
  const [taxCode, setTaxCode] = useState('0108998877');
  const [directorName, setDirectorName] = useState('Quản Trị Hệ Thống (Admin)');
  const [address, setAddress] = useState('Tầng 12, Tòa nhà Charmvit, 117 Trần Duy Hưng, Cầu Giấy, TP. Hà Nội');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fallbackUser: User = currentUser || {
    id: 'USR-030',
    code: 'ADM-01',
    name: 'Quản Trị Hệ Thống (Admin)',
    email: 'admin@taxcore.vn',
    role: 'ADMIN',
    department: 'BAN_GIAM_DOC',
    position: 'Quản Trị Viên Tối Cao',
    active: true,
  };

  const usersList = allUsers.length > 0 ? allUsers : storageService.getUsers();

  const handleSaveCompanyInfo = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-4 pb-8">
      
      {/* Top Header & Tab Navigation Bar */}
      <div className="bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Cài Đặt Hệ Thống & Quản Trị Bảo Mật IAM
            </h2>
            <p className="text-xs text-slate-500">
              Kiểm soát User & Password 30 nhân sự, phân quyền RBAC và sao lưu cơ sở dữ liệu
            </p>
          </div>
        </div>

        {/* Minimalist Sub-Tab Navigation */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('IAM_SECURITY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'IAM_SECURITY'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <KeyRound className="h-4 w-4" />
            <span>Tài Khoản & Mật Khẩu (IAM)</span>
          </button>

          <button
            onClick={() => setActiveTab('RBAC')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'RBAC'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Phân Quyền Vai Trò (RBAC)</span>
          </button>

          <button
            onClick={() => setActiveTab('DATABASE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'DATABASE'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Database className="h-4 w-4" />
            <span>CSDL & Sao Lưu</span>
          </button>

          <button
            onClick={() => setActiveTab('COMPANY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'COMPANY'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building className="h-4 w-4" />
            <span>Thông Tin Công Ty</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ENTERPRISE IAM & CREDENTIAL LIFECYCLE MANAGEMENT */}
      {activeTab === 'IAM_SECURITY' && (
        <IAMSecurityCenterView
          currentUser={fallbackUser}
          onDataReload={onDataReload}
          onSwitchUser={onSwitchUser}
        />
      )}

      {/* TAB 2: RBAC PERMISSIONS */}
      {activeTab === 'RBAC' && (
        <RolePermissionsManager
          currentUser={fallbackUser}
          allUsers={usersList}
          onPermissionsUpdated={onDataReload}
        />
      )}

      {/* TAB 3: DATABASE & EMERGENCY BACKUP CENTER */}
      {activeTab === 'DATABASE' && (
        <DatabaseEmergencyCenter
          currentUser={fallbackUser}
          onDataReload={onDataReload}
        />
      )}

      {/* TAB 3: COMPANY INFO */}
      {activeTab === 'COMPANY' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4 max-w-2xl">
          <div className="flex items-center space-x-2 font-bold text-slate-900 dark:text-white text-sm border-b border-slate-100 dark:border-slate-800 pb-3">
            <Building className="h-4 w-4 text-blue-600" />
            <span>Thông Tin Doanh Nghiệp / Công Ty Đại Lý Thuế</span>
          </div>

          {savedSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-200 rounded-xl flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Đã lưu thông tin cấu hình công ty thành công!</span>
            </div>
          )}

          <form onSubmit={handleSaveCompanyInfo} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tên Công Ty / Đơn Vị</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mã Số Thuế (MST)</label>
                <input
                  type="text"
                  value={taxCode}
                  onChange={(e) => setTaxCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Đại Diện Pháp Luật (BGD)</label>
                <input
                  type="text"
                  value={directorName}
                  onChange={(e) => setDirectorName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Trụ Sở Chính</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-xs cursor-pointer text-xs flex items-center space-x-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Lưu Cấu Hình Doanh Nghiệp</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};


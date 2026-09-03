import React, { useState } from 'react';
import { ChecklistTemplate, AdHocServiceItem, Customer, User, AutoDispatchResult } from '../../types';
import { FileSpreadsheet, CheckSquare, Plus, ArrowRight, ShieldAlert, Sparkles, CheckCircle2, Tag, Search, DollarSign, Layers, ArrowUpRight, Check, Zap, Calendar, Users, ShieldCheck, Building2, HelpCircle, Edit3, Gavel, Scale, RotateCcw, Eye, Lock } from 'lucide-react';
import { DEPARTMENT_LABELS, RISK_LABELS, PRIORITY_LABELS, formatCurrency } from '../../utils/formatters';
import { AD_HOC_SERVICE_GROUPS } from '../../data/adHocServices';
import { SERVICE_PACKAGES } from '../../data/servicePackages';
import { AutoDispatchPeriodicModal } from './AutoDispatchPeriodicModal';
import { TemplateEditModal } from './TemplateEditModal';
import { AdHocServiceEditModal } from './AdHocServiceEditModal';
import { storageService } from '../../services/storageService';
import { PermissionService } from '../../utils/permissions';

interface TemplatesViewProps {
  templates: ChecklistTemplate[];
  customers?: Customer[];
  users?: User[];
  currentUser?: User;
  onSelectTemplateToCreateTask?: (template: ChecklistTemplate) => void;
  onSelectAdHocServiceToCreateTask?: (service: AdHocServiceItem) => void;
  onDataReload?: () => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({
  templates,
  customers = [],
  users = [],
  currentUser,
  onSelectTemplateToCreateTask,
  onSelectAdHocServiceToCreateTask,
  onDataReload,
}) => {
  const [viewTab, setViewTab] = useState<'ADHOC' | 'PERIODIC'>('PERIODIC');
  
  // Ad-hoc state
  const [adHocServices, setAdHocServices] = useState<AdHocServiceItem[]>(() => storageService.getAdHocServices());
  const [adhocGroup, setAdhocGroup] = useState<string>('ALL');
  const [adhocSearch, setAdhocSearch] = useState<string>('');
  const [selectedAdHoc, setSelectedAdHoc] = useState<AdHocServiceItem>(() => {
    const list = storageService.getAdHocServices();
    return list[0] || ({} as AdHocServiceItem);
  });
  const [isAdHocEditModalOpen, setIsAdHocEditModalOpen] = useState(false);
  const [editingAdHocService, setEditingAdHocService] = useState<AdHocServiceItem | null>(null);

  // Periodic template state
  const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate>(templates[0]);
  const [isAutoDispatchModalOpen, setIsAutoDispatchModalOpen] = useState(false);
  const [lastDispatchResult, setLastDispatchResult] = useState<AutoDispatchResult | null>(null);

  // Template Edit & Add Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null);

  // RBAC Permission Check: Only Ban Giám Đốc and Admin can edit/add/delete templates
  const canManageTemplates = PermissionService.canManageTemplates(currentUser);

  // Filter adhoc services
  const filteredAdHocServices = adHocServices.filter(service => {
    const matchSearch = (service.name || '').toLowerCase().includes(adhocSearch.toLowerCase()) ||
                        (service.code || '').toLowerCase().includes(adhocSearch.toLowerCase()) ||
                        (service.executionType || '').toLowerCase().includes(adhocSearch.toLowerCase());
    const matchGroup = adhocGroup === 'ALL' || service.group === adhocGroup;
    return matchSearch && matchGroup;
  });

  const packageCustomersCount = customers.filter(c => c.contractStatus !== 'DA_HUY').length;

  const handleOpenCreateTemplate = () => {
    setEditingTemplate(null);
    setIsEditModalOpen(true);
  };

  const handleOpenEditTemplate = (tmpl?: ChecklistTemplate) => {
    setEditingTemplate(tmpl || selectedTemplate);
    setIsEditModalOpen(true);
  };

  const handleTemplateSaved = (saved: ChecklistTemplate) => {
    setSelectedTemplate(saved);
    if (onDataReload) {
      onDataReload();
    }
  };

  const handleTemplateDeleted = (deletedId: string) => {
    const remaining = templates.filter(t => t.id !== deletedId);
    if (remaining.length > 0) {
      setSelectedTemplate(remaining[0]);
    }
    if (onDataReload) {
      onDataReload();
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Khôi phục toàn bộ 8 quy trình định kỳ chuẩn & checklist ban đầu theo quy định pháp luật mới nhất?')) {
      storageService.resetTemplatesToDefault(currentUser);
      if (onDataReload) {
        onDataReload();
      }
    }
  };

  // Ad-hoc Handlers
  const handleOpenCreateAdHoc = () => {
    setEditingAdHocService(null);
    setIsAdHocEditModalOpen(true);
  };

  const handleOpenEditAdHoc = (srv?: AdHocServiceItem) => {
    setEditingAdHocService(srv || selectedAdHoc);
    setIsAdHocEditModalOpen(true);
  };

  const handleAdHocSaved = (saved: AdHocServiceItem) => {
    const updated = storageService.getAdHocServices();
    setAdHocServices(updated);
    setSelectedAdHoc(saved);
    if (onDataReload) {
      onDataReload();
    }
  };

  const handleAdHocDeleted = (deletedId: string) => {
    const updated = storageService.getAdHocServices();
    setAdHocServices(updated);
    if (updated.length > 0) {
      setSelectedAdHoc(updated[0]);
    }
    if (onDataReload) {
      onDataReload();
    }
  };

  const handleResetAdHocDefaults = () => {
    if (window.confirm('Khôi phục toàn bộ danh mục 49 dịch vụ phát sinh & quy trình chuẩn về mặc định ban đầu theo quy định pháp luật mới?')) {
      storageService.resetAdHocServicesToDefault(currentUser);
      const updated = storageService.getAdHocServices();
      setAdHocServices(updated);
      if (updated.length > 0) {
        setSelectedAdHoc(updated[0]);
      }
      if (onDataReload) {
        onDataReload();
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Thư Viện Biểu Phí & Mẫu Quy Trình Định Kỳ
            </h2>
            <p className="text-xs text-slate-500">
              Tự động phát sinh công việc theo thời gian quy định cho các GÓI Đại lý thuế & Kế toán trọn gói, 49 dịch vụ phát sinh
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl space-x-1 shrink-0">
          <button
            onClick={() => setViewTab('PERIODIC')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewTab === 'PERIODIC'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Quy trình định kỳ & Phát sinh theo GÓI</span>
          </button>

          <button
            onClick={() => setViewTab('ADHOC')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewTab === 'ADHOC'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Tag className="h-3.5 w-3.5" />
            <span>49 Dịch vụ phát sinh</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: 49 AD-HOC SERVICES CATALOG & PRICE BOOK */}
      {/* ========================================================= */}
      {viewTab === 'ADHOC' && (
        <div className="space-y-4">
          
          {/* Action Header: Add New Adhoc & Reset */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Danh Mục Dịch Vụ Phát Sinh Chuẩn ({adHocServices.length} dịch vụ)
                </h3>
                {!canManageTemplates && (
                  <span className="flex items-center space-x-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-[10px] font-semibold border border-slate-200 dark:border-slate-700">
                    <Lock className="h-3 w-3 text-amber-500" />
                    <span>Chỉ xem (Ban Giám Đốc quản trị)</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Tra cứu biểu phí niêm yết, chuẩn hóa quy trình SOP và checklist kiểm soát chất lượng khi luật thay đổi
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {canManageTemplates ? (
                <>
                  <button
                    type="button"
                    onClick={handleResetAdHocDefaults}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                    title="Khôi phục toàn bộ danh mục dịch vụ phát sinh về mặc định ban đầu"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Khôi Phục Mặc Định</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenCreateAdHoc}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold shadow-sm shadow-blue-500/20 transition-all cursor-pointer transform hover:-translate-y-0.5"
                  >
                    <Plus className="h-4 w-4" />
                    <span>+ Thêm Dịch Vụ / Quy Trình Mới</span>
                  </button>
                </>
              ) : (
                <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-medium border border-amber-200 dark:border-amber-800/50">
                  <Lock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span>Quyền Ban Giám Đốc để thêm/sửa dịch vụ</span>
                </div>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* Category pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
              {AD_HOC_SERVICE_GROUPS.map((g) => (
                <button
                  key={g.key}
                  onClick={() => setAdhocGroup(g.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    adhocGroup === g.key
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {g.name}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative min-w-[260px]">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={adhocSearch}
                onChange={(e) => setAdhocSearch(e.target.value)}
                placeholder="Tìm dịch vụ, mã, từ khóa..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

          </div>

          {/* Main Grid: Left Service List (5 cols) | Right Service Details (7 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: 49 Services List */}
            <div className="lg:col-span-5 space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
              {filteredAdHocServices.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                  Không tìm thấy dịch vụ nào phù hợp
                </div>
              ) : (
                filteredAdHocServices.map((service) => {
                  const isSelected = selectedAdHoc?.id === service.id;
                  return (
                    <div
                      key={service.id}
                      onClick={() => setSelectedAdHoc(service)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 shadow-sm ring-1 ring-blue-400'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {service.code}
                            </span>
                            <span className="text-[10px] text-slate-500 font-semibold truncate">
                              {service.groupName}
                            </span>
                          </div>
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-1 leading-snug">
                            {service.name}
                          </h3>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-blue-600 dark:text-blue-400 block">
                            {service.feeDisplay}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {service.executionType}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {service.description}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        <span className={`px-1.5 py-0.2 rounded font-semibold ${RISK_LABELS[service.defaultRiskLevel]?.badgeClass}`}>
                          {RISK_LABELS[service.defaultRiskLevel]?.label}
                        </span>
                        <span>{service.suggestedWorkflow.length} bước • {service.suggestedChecklist.length} tiêu chí</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Column: In-depth Service Procedure & Price Breakdown */}
            <div className="lg:col-span-7 space-y-4">
              {selectedAdHoc && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-5">
                  
                  {/* Service Header Info */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                          {selectedAdHoc.code}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${DEPARTMENT_LABELS[selectedAdHoc.department]?.color}`}>
                          {DEPARTMENT_LABELS[selectedAdHoc.department]?.label}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${RISK_LABELS[selectedAdHoc.defaultRiskLevel]?.badgeClass}`}>
                          {RISK_LABELS[selectedAdHoc.defaultRiskLevel]?.label}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mt-2">
                        {selectedAdHoc.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {selectedAdHoc.description}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditAdHoc(selectedAdHoc)}
                        className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs ${
                          canManageTemplates
                            ? 'bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                        title={canManageTemplates ? "Chỉnh sửa chuỗi quy trình SOP và checklist theo quy định luật mới" : "Xem chi tiết quy trình SOP, căn cứ pháp lý & checklist"}
                      >
                        {canManageTemplates ? (
                          <>
                            <Gavel className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                            <span>Chỉnh Sửa Quy Trình (Cập Nhật Luật Mới)</span>
                          </>
                        ) : (
                          <>
                            <Eye className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                            <span>Xem Chi Tiết Quy Trình & Pháp Lý</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Price & Execution Banner */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-semibold">Phí dịch vụ niêm yết</span>
                      <span className="text-base font-black text-blue-600 dark:text-blue-400">
                        {selectedAdHoc.feeDisplay}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-semibold">Hình thức thực hiện</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {selectedAdHoc.executionType}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-semibold">Mức độ ưu tiên</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {PRIORITY_LABELS[selectedAdHoc.defaultPriority]?.label}
                      </span>
                    </div>
                  </div>

                  {/* Workflow Steps Sequence */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                      <span>1. Chuỗi Quy Trình Thực Hiện ({selectedAdHoc.suggestedWorkflow.length} bước)</span>
                      <span className="text-[10px] font-normal text-slate-400">Tự động gắn vào công việc khi phân công</span>
                    </h4>
                    <div className="space-y-2">
                      {selectedAdHoc.suggestedWorkflow.map((step, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center space-x-2.5">
                            <span className="h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-white">{step.name}</span>
                          </div>

                          <div className="flex items-center space-x-1.5 shrink-0">
                            {step.isMandatory && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold border border-red-200">
                                Bắt buộc
                              </span>
                            )}
                            {step.requiredEvidence && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200">
                                Bằng chứng/File
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Checklist Items */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2.5">
                      2. Tiêu Chí Kiểm Soát Chất Lượng & Pháp Lý ({selectedAdHoc.suggestedChecklist.length} mục)
                    </h4>
                    <div className="space-y-2">
                      {selectedAdHoc.suggestedChecklist.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center space-x-2.5 text-xs text-slate-800 dark:text-slate-200"
                        >
                          <CheckSquare className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>{item.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: PERIODIC STANDARD TEMPLATES */}
      {/* ========================================================= */}
      {viewTab === 'PERIODIC' && (
        <div className="space-y-6">
          {/* Grid Layout: Template Selection List & Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column (5 cols): Template Selection List */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Danh Mục Quy Trình Định Kỳ Chuẩn ({templates.length})
                  </h3>
                  {!canManageTemplates && (
                    <span className="flex items-center space-x-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-[10px] font-semibold border border-slate-200 dark:border-slate-700">
                      <Lock className="h-3 w-3 text-amber-500" />
                      <span>Chỉ xem</span>
                    </span>
                  )}
                </div>
                
                {canManageTemplates && (
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={handleResetDefaults}
                      className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs transition-colors cursor-pointer"
                      title="Khôi phục 8 mẫu chuẩn ban đầu"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleOpenCreateTemplate}
                      className="flex items-center space-x-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20 transition-all cursor-pointer transform hover:-translate-y-0.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Thêm Quy Trình Mới</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2.5">
                {templates.map((tmpl) => {
                  const isSelected = selectedTemplate?.id === tmpl.id;
                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => setSelectedTemplate(tmpl)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 shadow-sm ring-1 ring-blue-400'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className={`text-[10px] px-2 py-0.2 rounded border font-semibold ${DEPARTMENT_LABELS[tmpl.department]?.color}`}>
                              {DEPARTMENT_LABELS[tmpl.department]?.label}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-slate-400">
                              {tmpl.code}
                            </span>
                          </div>
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-1.5 leading-snug">
                            {tmpl.title}
                          </h3>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold shrink-0 ${RISK_LABELS[tmpl.defaultRiskLevel]?.badgeClass}`}>
                          {RISK_LABELS[tmpl.defaultRiskLevel]?.label}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {tmpl.description}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="font-medium text-slate-600 dark:text-slate-400">
                          {tmpl.defaultWorkflow.length} bước quy trình
                        </span>
                        <span className="font-medium text-slate-600 dark:text-slate-400">
                          {tmpl.defaultChecklist.length} mục kiểm tra
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column (7 cols): Selected Template In-depth Breakdown */}
            <div className="lg:col-span-7 space-y-6">
              {selectedTemplate && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-5">
                  
                  {/* Selected Template Header & Action Buttons */}
                  <div className="pb-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono font-bold rounded">
                          {selectedTemplate.code}
                        </span>
                        {selectedTemplate.isTaxObligation && (
                          <span className="text-[10px] px-2 py-0.5 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold rounded">
                            Hạn Nộp Pháp Lý {selectedTemplate.taxType ? `(${selectedTemplate.taxType})` : ''}
                          </span>
                        )}
                        <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${RISK_LABELS[selectedTemplate.defaultRiskLevel]?.badgeClass}`}>
                          {RISK_LABELS[selectedTemplate.defaultRiskLevel]?.label}
                        </span>
                      </div>

                      {/* Action Buttons: Edit Template for Legal Changes */}
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditTemplate(selectedTemplate)}
                          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs border ${
                            canManageTemplates
                              ? 'bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/60'
                              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                          title={canManageTemplates ? "Điều chỉnh quy trình SOP, tiêu chuẩn kiểm tra checklist khi luật thuế & kế toán thay đổi" : "Xem chi tiết quy trình SOP, căn cứ pháp lý & checklist"}
                        >
                          {canManageTemplates ? (
                            <>
                              <Gavel className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                              <span>Chỉnh Sửa Quy Trình (Cập Nhật Luật Mới)</span>
                            </>
                          ) : (
                            <>
                              <Eye className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                              <span>Xem Chi Tiết Quy Trình & Pháp Lý</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                        {selectedTemplate.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                        {selectedTemplate.description}
                      </p>
                    </div>
                  </div>

                  {/* Workflow Steps Sequence */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                      <span>1. Chuỗi Quy Trình Thực Hiện ({selectedTemplate.defaultWorkflow.length} bước)</span>
                      <span className="text-[10px] font-normal text-slate-400">Tự động gắn vào công việc khi phân công</span>
                    </h4>
                    <div className="space-y-2">
                      {selectedTemplate.defaultWorkflow.map((step, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center space-x-2.5">
                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                              {idx + 1}.
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-white">{step.name}</span>
                          </div>

                          <div className="flex items-center space-x-1.5">
                            {step.isMandatory && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-100 text-red-700 font-bold">
                                Bắt buộc
                              </span>
                            )}
                            {step.requiredEvidence && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 font-bold">
                                Đính kèm file
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Checklist Items */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                      <span>2. Checklist Kiểm Soát Chi Tiết ({selectedTemplate.defaultChecklist.length} mục)</span>
                      <span className="text-[10px] font-normal text-slate-400">Tiêu chuẩn chất lượng & Pháp lý</span>
                    </h4>
                    <div className="space-y-2">
                      {selectedTemplate.defaultChecklist.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-800 dark:text-slate-200"
                        >
                          <div className="flex items-center space-x-2.5">
                            <CheckSquare className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span className="font-medium">{item.title}</span>
                          </div>
                          {item.required && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold shrink-0">
                              Bắt buộc kiểm
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Auto Dispatch Modal */}
      {isAutoDispatchModalOpen && (
        <AutoDispatchPeriodicModal
          isOpen={isAutoDispatchModalOpen}
          onClose={() => setIsAutoDispatchModalOpen(false)}
          customers={customers}
          templates={templates}
          currentUser={currentUser || users[0]}
          onSuccess={(result) => {
            setLastDispatchResult(result);
            if (onDataReload) {
              onDataReload();
            }
          }}
        />
      )}

      {/* Template Edit & Add Modal */}
      {isEditModalOpen && (
        <TemplateEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          template={editingTemplate}
          currentUser={currentUser || users[0]}
          onSaved={handleTemplateSaved}
          onDeleted={handleTemplateDeleted}
        />
      )}

      {/* Ad-Hoc Service Edit & Add Modal */}
      {isAdHocEditModalOpen && (
        <AdHocServiceEditModal
          isOpen={isAdHocEditModalOpen}
          onClose={() => setIsAdHocEditModalOpen(false)}
          service={editingAdHocService}
          currentUser={currentUser || users[0]}
          onSaved={handleAdHocSaved}
          onDeleted={handleAdHocDeleted}
        />
      )}

    </div>
  );
};


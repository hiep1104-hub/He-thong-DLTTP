import React, { useState, useMemo } from 'react';
import { 
  BusinessTrip, 
  BusinessTripType, 
  BusinessTripStatus, 
  User, 
  Customer 
} from '../../types';
import { storageService, CURRENT_SYSTEM_DATE } from '../../services/storageService';
import { formatDate, formatVND } from '../../utils/formatters';
import { PermissionService } from '../../utils/permissions';
import { BusinessTripCreateModal } from './BusinessTripCreateModal';
import { BusinessTripDetailModal } from './BusinessTripDetailModal';
import { BusinessTripTravelOrderModal } from './BusinessTripTravelOrderModal';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  Building, 
  Building2, 
  Car, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  Clock3, 
  Users, 
  FileText, 
  ChevronRight, 
  Printer, 
  Check, 
  Ban, 
  Compass, 
  Sparkles, 
  CalendarDays, 
  LayoutGrid, 
  ListFilter,
  Layers,
  ArrowUpRight,
  Trash2
} from 'lucide-react';

interface BusinessTripManagerProps {
  currentUser: User;
  users: User[];
  customers: Customer[];
}

const TRIP_TYPE_CONFIG: Record<BusinessTripType, { label: string; badgeClass: string; icon: any }> = {
  CO_QUAN_THUE: { label: 'Cơ quan Thuế', badgeClass: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800', icon: Building2 },
  KHACH_HANG: { label: 'Trụ sở Khách hàng', badgeClass: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800', icon: Building },
  BHXH_DKKD: { label: 'BHXH & ĐKKD', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800', icon: Briefcase },
  NGAN_HANG_TOA_AN: { label: 'Ngân hàng / Tòa án', badgeClass: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800', icon: FileText },
  KHAO_SAT_THUC_DIA: { label: 'Khảo sát thực địa', badgeClass: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800', icon: MapPin },
  LIEN_TINH: { label: 'Công tác liên tỉnh', badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800', icon: Car },
  KHAC: { label: 'Khác', badgeClass: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700', icon: FileText },
};

const STATUS_CONFIG: Record<BusinessTripStatus, { label: string; dotClass: string; badgeClass: string }> = {
  CHO_DUYET: { label: 'Chờ phê duyệt', dotClass: 'bg-amber-500', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' },
  DA_DUYET: { label: 'Đã duyệt • Sẵn sàng', dotClass: 'bg-blue-500', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800' },
  DANG_DI: { label: 'Đang thực địa', dotClass: 'bg-emerald-500 animate-pulse', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800' },
  HOAN_THANH: { label: 'Đã hoàn thành', dotClass: 'bg-slate-400', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' },
  TU_CHOI: { label: 'Từ chối', dotClass: 'bg-rose-500', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800' },
  DA_HUY: { label: 'Đã hủy', dotClass: 'bg-slate-400', badgeClass: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700' },
};

export const BusinessTripManager: React.FC<BusinessTripManagerProps> = ({
  currentUser,
  users,
  customers,
}) => {
  // Trips Data from storage
  const [trips, setTrips] = useState<BusinessTrip[]>(() => storageService.getBusinessTrips());

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedTrip, setSelectedTrip] = useState<BusinessTrip | null>(null);
  const [quickPrintTrip, setQuickPrintTrip] = useState<BusinessTrip | null>(null);

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'LIST' | 'GRID' | 'TIMELINE' | 'BY_CUSTOMER'>('LIST');

  // Reload handler
  const reloadTrips = () => {
    setTrips(storageService.getBusinessTrips());
  };

  // RBAC Permission Check
  const canApprove = currentUser.role === 'ADMIN' || currentUser.role === 'BAN_GIAM_DOC' || currentUser.role === 'TRUONG_PHONG' || PermissionService.canReviewLeave(currentUser);

  // Quick Inline Approve
  const handleQuickApprove = (e: React.MouseEvent, tripId: string) => {
    e.stopPropagation();
    storageService.approveBusinessTrip(tripId, 'DA_DUYET', undefined, currentUser);
    reloadTrips();
  };

  // Quick Inline Check-in
  const handleQuickCheckin = (e: React.MouseEvent, trip: BusinessTrip) => {
    e.stopPropagation();
    storageService.checkinBusinessTrip(trip.id, trip.destination, currentUser);
    reloadTrips();
  };

  // Delete Business Trip
  const handleDeleteTrip = (e: React.MouseEvent, trip: BusinessTrip) => {
    e.stopPropagation();
    if (window.confirm(`Bạn có chắc chắn muốn xóa hồ sơ công tác "${trip.title}" (${trip.code}) không?`)) {
      storageService.deleteBusinessTrip(trip.id, currentUser);
      reloadTrips();
    }
  };

  // Filtered Trips Calculation
  const filteredTrips = useMemo(() => {
    return trips.filter(trip => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = trip.code?.toLowerCase().includes(q);
        const matchTitle = trip.title?.toLowerCase().includes(q);
        const matchStaff = trip.employeeName?.toLowerCase().includes(q);
        const matchDest = trip.destination?.toLowerCase().includes(q);
        const matchCustomer = trip.customerName?.toLowerCase().includes(q);
        const matchPurpose = trip.purpose?.toLowerCase().includes(q);
        if (!matchCode && !matchTitle && !matchStaff && !matchDest && !matchCustomer && !matchPurpose) {
          return false;
        }
      }

      // Type
      if (selectedTypeFilter !== 'ALL' && trip.tripType !== selectedTypeFilter) {
        return false;
      }

      // Status
      if (selectedStatusFilter !== 'ALL' && trip.status !== selectedStatusFilter) {
        return false;
      }

      // Staff
      if (selectedStaffFilter !== 'ALL') {
        const isMain = trip.employeeId === selectedStaffFilter;
        const isCompanion = trip.companionStaffIds && trip.companionStaffIds.includes(selectedStaffFilter);
        if (!isMain && !isCompanion) return false;
      }

      return true;
    });
  }, [trips, searchQuery, selectedTypeFilter, selectedStatusFilter, selectedStaffFilter]);

  // Statistics Cards
  const stats = useMemo(() => {
    const total = trips.length;
    const pending = trips.filter(t => t.status === 'CHO_DUYET').length;
    const activeToday = trips.filter(t => {
      if (t.status === 'DANG_DI') return true;
      if (t.status === 'DA_DUYET' && t.startDate <= CURRENT_SYSTEM_DATE && t.endDate >= CURRENT_SYSTEM_DATE) return true;
      return false;
    }).length;
    const completed = trips.filter(t => t.status === 'HOAN_THANH').length;
    const totalAdvance = trips.reduce((sum, t) => sum + (Number(t.advanceAmount) || 0), 0);
    const totalActualCost = trips.reduce((sum, t) => sum + (Number(t.actualTotalCost) || 0), 0);

    return { total, pending, activeToday, completed, totalAdvance, totalActualCost };
  }, [trips]);

  // Grouped by Customer for 'BY_CUSTOMER' view
  const groupedByCustomer = useMemo(() => {
    const map = new Map<string, BusinessTrip[]>();
    filteredTrips.forEach(trip => {
      const key = trip.customerName || (trip.tripType === 'CO_QUAN_THUE' ? 'Cơ quan Thuế & Nhà nước' : 'Công tác Nội bộ & Khác');
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(trip);
    });
    return Array.from(map.entries());
  }, [filteredTrips]);

  return (
    <div className="space-y-6">
      
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-blue-600/30 rounded-2xl border border-blue-400/30 backdrop-blur-md">
            <Briefcase className="h-7 w-7 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Nghiệp vụ Thực địa & Đại lý Thuế
              </span>
              <span className="text-xs text-slate-400">• Mẫu C06-HD Chuẩn BTC</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
              Đăng Ký & Quản Lý Lịch Công Tác Thực Địa
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Điều phối làm việc tại Thuế cơ sở, Khách hàng, BHXH, cấp Giấy đi đường và quyết toán chi phí công tác
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold shadow-lg hover:shadow-blue-500/25 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Đăng Ký Lịch Công Tác Mới</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* Card 1: Total Trips */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Tổng chuyến công tác</span>
            <div className="p-1.5 bg-blue-50 dark:bg-blue-950/50 rounded-lg text-blue-600">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {stats.total}
          </p>
          <span className="text-[10px] text-slate-400">Tất cả hồ sơ điều động</span>
        </div>

        {/* Card 2: Active Today */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 uppercase">Đang thực địa hôm nay</span>
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg text-emerald-600">
              <Compass className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {stats.activeToday}
          </p>
          <span className="text-[10px] text-slate-400">Tại cơ quan thuế / Khách hàng</span>
        </div>

        {/* Card 3: Pending Approval */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 uppercase">Chờ phê duyệt</span>
            <div className="p-1.5 bg-amber-50 dark:bg-amber-950/50 rounded-lg text-amber-600">
              <Clock3 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
            {stats.pending}
          </p>
          <span className="text-[10px] text-slate-400">Cần trưởng phòng duyệt</span>
        </div>

        {/* Card 4: Completed */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-600 uppercase">Đã hoàn thành</span>
            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg text-indigo-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
            {stats.completed}
          </p>
          <span className="text-[10px] text-slate-400">Đã nộp báo cáo kết quả</span>
        </div>

        {/* Card 5: Total Advance Budget */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Tạm ứng & Quyết toán</span>
            <div className="p-1.5 bg-purple-50 dark:bg-purple-950/50 rounded-lg text-purple-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="text-lg font-black font-mono text-purple-600 dark:text-purple-400 truncate">
            {formatVND(stats.totalAdvance)}
          </p>
          <span className="text-[10px] text-slate-400">Đã quyết toán: {formatVND(stats.totalActualCost)}</span>
        </div>
      </div>

      {/* Filter & View Mode Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã [CT-...], cán bộ, khách hàng, địa điểm, mục đích..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            
            {/* Type Filter */}
            <select
              value={selectedTypeFilter}
              onChange={e => setSelectedTypeFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tất cả loại hình công tác</option>
              <option value="CO_QUAN_THUE">🏢 Cơ quan Thuế</option>
              <option value="KHACH_HANG">🏭 Trụ sở Khách hàng</option>
              <option value="BHXH_DKKD">📋 BHXH & ĐKKD</option>
              <option value="NGAN_HANG_TOA_AN">🏛️ Ngân hàng / Tòa án</option>
              <option value="KHAO_SAT_THUC_DIA">🔍 Khảo sát thực địa</option>
              <option value="LIEN_TINH">🚗 Công tác liên tỉnh</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={e => setSelectedStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="CHO_DUYET">⏳ Chờ phê duyệt</option>
              <option value="DA_DUYET">✅ Đã duyệt</option>
              <option value="DANG_DI">📍 Đang thực địa</option>
              <option value="HOAN_THANH">🏆 Đã hoàn thành</option>
              <option value="TU_CHOI">❌ Từ chối</option>
            </select>

            {/* Staff Filter */}
            <select
              value={selectedStaffFilter}
              onChange={e => setSelectedStaffFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tất cả nhân sự</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.position || 'Chuyên viên'})
                </option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('LIST')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'LIST' ? 'bg-white dark:bg-slate-700 shadow-2xs text-blue-600 dark:text-blue-400' : 'text-slate-500'
                }`}
                title="Dạng danh sách bảng"
              >
                <ListFilter className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('GRID')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'GRID' ? 'bg-white dark:bg-slate-700 shadow-2xs text-blue-600 dark:text-blue-400' : 'text-slate-500'
                }`}
                title="Dạng thẻ lưới"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('BY_CUSTOMER')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'BY_CUSTOMER' ? 'bg-white dark:bg-slate-700 shadow-2xs text-blue-600 dark:text-blue-400' : 'text-slate-500'
                }`}
                title="Gom nhóm theo Khách hàng & Cơ quan Thuế"
              >
                <Layers className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Trips List / Grid View */}
      {filteredTrips.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="h-14 w-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
            <Briefcase className="h-7 w-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Không tìm thấy chuyến công tác nào phù hợp
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Hãy thử điều chỉnh bộ lọc hoặc tạo mới một lịch công tác thực địa cho nhân sự.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Đăng ký chuyến đi mới</span>
          </button>
        </div>
      ) : viewMode === 'LIST' ? (
        
        /* TABLE LIST VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 text-[11px]">
                <tr>
                  <th className="py-3 px-4">Mã & Loại hình</th>
                  <th className="py-3 px-4">Cán bộ & Đoàn</th>
                  <th className="py-3 px-4">Khách hàng & Điểm đến</th>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4">Nhiệm vụ & Tạm ứng</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
                {filteredTrips.map(trip => {
                  const typeInfo = TRIP_TYPE_CONFIG[trip.tripType] || TRIP_TYPE_CONFIG.KHAC;
                  const statusInfo = STATUS_CONFIG[trip.status] || STATUS_CONFIG.CHO_DUYET;
                  const completedTasks = trip.tasks ? trip.tasks.filter(t => t.isCompleted).length : 0;
                  const totalTasks = trip.tasks ? trip.tasks.length : 0;

                  return (
                    <tr
                      key={trip.id}
                      onClick={() => setSelectedTrip(trip)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      {/* Code & Type */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1">
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                            {trip.code}
                          </span>
                          <div className="pt-0.5">
                            <span className={`inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${typeInfo.badgeClass}`}>
                              <typeInfo.icon className="h-3 w-3" />
                              <span>{typeInfo.label}</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Staff & Companions */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                          <Users className="h-3.5 w-3.5 text-slate-400" />
                          <span>{trip.employeeName}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {trip.position || 'Chuyên viên'}
                        </div>
                        {trip.companionStaffNames && trip.companionStaffNames.length > 0 && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                            +{trip.companionStaffNames.length} cán bộ cùng đi
                          </div>
                        )}
                      </td>

                      {/* Customer & Destination */}
                      <td className="py-3.5 px-4 align-top max-w-xs">
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {trip.title}
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-start space-x-1 mt-0.5">
                          <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{trip.destination}</span>
                        </div>
                        {trip.customerName && (
                          <div className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                            🏢 {trip.customerName}
                          </div>
                        )}
                      </td>

                      {/* Date & Time Slot */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <div className="font-bold">
                          {formatDate(trip.startDate)}
                          {trip.startDate !== trip.endDate && ` → ${formatDate(trip.endDate)}`}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {trip.timeSlot === 'SANG' ? 'Buổi sáng (8h-12h)' :
                           trip.timeSlot === 'CHIEU' ? 'Buổi chiều (13h30-17h30)' :
                           trip.timeSlot === 'CA_NGAY' ? 'Cả ngày' : 'Nhiều ngày'}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center space-x-1 mt-1">
                          <Car className="h-3 w-3" />
                          <span>{trip.transportation === 'XE_MAY_CA_NHAN' ? 'Xe máy' : trip.transportation === 'GRAB_TAXI' ? 'Grab/Taxi' : 'Xe Cty'}</span>
                        </div>
                      </td>

                      {/* Tasks & Advance */}
                      <td className="py-3.5 px-4 align-top">
                        {totalTasks > 0 ? (
                          <div className="flex items-center space-x-1 text-[11px]">
                            <span className={`font-bold ${completedTasks === totalTasks ? 'text-emerald-600' : 'text-blue-600'}`}>
                              {completedTasks}/{totalTasks} việc xong
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Không có checklist</span>
                        )}
                        {trip.advanceAmount > 0 && (
                          <div className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 mt-1">
                            Tạm ứng: <span className="text-blue-600 dark:text-blue-400">{formatVND(trip.advanceAmount)}</span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 align-top text-center">
                        <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusInfo.badgeClass}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dotClass}`}></span>
                          <span>{statusInfo.label}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5" onClick={e => e.stopPropagation()}>
                          
                          {/* Quick Approve Button for Managers */}
                          {trip.status === 'CHO_DUYET' && canApprove && (
                            <button
                              onClick={e => handleQuickApprove(e, trip.id)}
                              className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg text-xs font-bold transition-colors"
                              title="Phê duyệt nhanh"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {/* Quick Check-in Button */}
                          {trip.status === 'DA_DUYET' && (
                            <button
                              onClick={e => handleQuickCheckin(e, trip)}
                              className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-bold transition-colors"
                              title="Bắt đầu đi công tác (Check-in)"
                            >
                              <Compass className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {/* Print Travel Order */}
                          <button
                            onClick={() => setQuickPrintTrip(trip)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="In Giấy đi đường (Mẫu C06)"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>

                          {/* Delete Trip */}
                          {(canApprove || trip.employeeId === currentUser?.id) && (
                            <button
                              onClick={e => handleDeleteTrip(e, trip)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                              title="Xóa hồ sơ công tác"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {/* Detail Arrow */}
                          <button
                            onClick={() => setSelectedTrip(trip)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      ) : viewMode === 'GRID' ? (

        /* CARD GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTrips.map(trip => {
            const typeInfo = TRIP_TYPE_CONFIG[trip.tripType] || TRIP_TYPE_CONFIG.KHAC;
            const statusInfo = STATUS_CONFIG[trip.status] || STATUS_CONFIG.CHO_DUYET;
            const completedTasks = trip.tasks ? trip.tasks.filter(t => t.isCompleted).length : 0;
            const totalTasks = trip.tasks ? trip.tasks.length : 0;

            return (
              <div
                key={trip.id}
                onClick={() => setSelectedTrip(trip)}
                className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top row */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                      {trip.code}
                    </span>
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.badgeClass}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dotClass}`}></span>
                      <span>{statusInfo.label}</span>
                    </span>
                  </div>

                  {/* Title & Type */}
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2">
                      {trip.title}
                    </h3>
                    <div className="mt-1.5">
                      <span className={`inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${typeInfo.badgeClass}`}>
                        <typeInfo.icon className="h-3 w-3" />
                        <span>{typeInfo.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* Destination & Customer */}
                  <div className="space-y-1 text-xs">
                    <div className="flex items-start space-x-1.5 text-slate-600 dark:text-slate-300">
                      <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 font-medium">{trip.destination}</span>
                    </div>
                    {trip.customerName && (
                      <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 pl-5">
                        🏢 {trip.customerName}
                      </div>
                    )}
                  </div>

                  {/* Staff Info */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Cán bộ phụ trách:</span>
                      <strong className="text-slate-900 dark:text-white">{trip.employeeName}</strong>
                    </div>
                    {trip.companionStaffNames && trip.companionStaffNames.length > 0 && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Đoàn công tác:</span>
                        <span className="text-slate-600 dark:text-slate-300 font-medium">
                          +{trip.companionStaffNames.length} đồng nghiệp
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400">Thời gian:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {formatDate(trip.startDate)} {trip.startDate !== trip.endDate ? `→ ${formatDate(trip.endDate)}` : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Footer info */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    {trip.advanceAmount > 0 ? (
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {formatVND(trip.advanceAmount)}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Không tạm ứng</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 text-slate-400 hover:text-blue-600 font-bold text-xs">
                    <span>Xem chi tiết</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      ) : (

        /* GROUPED BY CUSTOMER VIEW */
        <div className="space-y-6">
          {groupedByCustomer.map(([groupName, groupTrips]) => (
            <div key={groupName} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <h3 className="font-black text-xs uppercase tracking-wide text-slate-900 dark:text-white">
                    {groupName} ({groupTrips.length} chuyến công tác)
                  </h3>
                </div>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 p-2">
                {groupTrips.map(trip => {
                  const statusInfo = STATUS_CONFIG[trip.status] || STATUS_CONFIG.CHO_DUYET;
                  return (
                    <div
                      key={trip.id}
                      onClick={() => setSelectedTrip(trip)}
                      className="p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                            {trip.code}
                          </span>
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {trip.title}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center space-x-3">
                          <span>Cán bộ: <strong>{trip.employeeName}</strong></span>
                          <span>•</span>
                          <span>Ngày: <strong>{formatDate(trip.startDate)}</strong></span>
                          <span>•</span>
                          <span>Nơi đến: {trip.destination}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.badgeClass}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dotClass}`}></span>
                          <span>{statusInfo.label}</span>
                        </span>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <BusinessTripCreateModal
          currentUser={currentUser}
          users={users}
          customers={customers}
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newTrip) => {
            setShowCreateModal(false);
            reloadTrips();
            setSelectedTrip(newTrip);
          }}
        />
      )}

      {selectedTrip && (
        <BusinessTripDetailModal
          trip={selectedTrip}
          customer={customers.find(c => c.id === selectedTrip.customerId)}
          currentUser={currentUser}
          onClose={() => setSelectedTrip(null)}
          onUpdate={() => {
            reloadTrips();
          }}
        />
      )}

      {quickPrintTrip && (
        <BusinessTripTravelOrderModal
          trip={quickPrintTrip}
          customer={customers.find(c => c.id === quickPrintTrip.customerId)}
          currentUser={currentUser}
          onClose={() => setQuickPrintTrip(null)}
        />
      )}
    </div>
  );
};

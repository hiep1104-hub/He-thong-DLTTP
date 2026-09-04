import React, { useState, useMemo } from 'react';
import { 
  BusinessTrip, 
  BusinessTripType, 
  BusinessTripTimeSlot, 
  BusinessTripTransport, 
  User, 
  Customer,
  Department
} from '../../types';
import { storageService, CURRENT_SYSTEM_DATE } from '../../services/storageService';
import { formatVND } from '../../utils/formatters';
import { 
  X, 
  Plus, 
  Trash2, 
  Building, 
  Building2, 
  MapPin, 
  Calendar, 
  Clock, 
  Car, 
  DollarSign, 
  Users, 
  CheckSquare, 
  Sparkles, 
  Briefcase, 
  FileText,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';

interface BusinessTripCreateModalProps {
  currentUser: User;
  users: User[];
  customers: Customer[];
  preselectedCustomer?: Customer;
  onClose: () => void;
  onSuccess: (newTrip: BusinessTrip) => void;
}

const TRIP_TYPE_OPTIONS: Array<{ value: BusinessTripType; label: string; description: string; icon: any }> = [
  { 
    value: 'CO_QUAN_THUE', 
    label: 'Cơ quan Thuế (Chi cục / Cục Thuế)', 
    description: 'Giải trình quyết toán, kiểm tra thuế, hoàn thuế, hủy hóa đơn, đối chiếu nợ thuế',
    icon: Building2 
  },
  { 
    value: 'KHACH_HANG', 
    label: 'Trụ sở Doanh nghiệp / Khách hàng', 
    description: 'Thu thập chứng từ, kiểm kê kho/quỹ, bàn giao sổ sách BCTC, đào tạo kế toán nội bộ',
    icon: Building 
  },
  { 
    value: 'BHXH_DKKD', 
    label: 'Cơ quan BHXH & Sở KH&ĐT (ĐKKD)', 
    description: 'Thủ tục cấp đổi ĐKKD, giấy phép con, chốt sổ BHXH, nộp hồ sơ chế độ thai sản/ốm đau',
    icon: Briefcase 
  },
  { 
    value: 'NGAN_HANG_TOA_AN', 
    label: 'Ngân hàng / Tín dụng / Tòa án', 
    description: 'Mở tài khoản, sao kê sổ phụ ngân hàng, công chứng ủy quyền, thủ tục pháp lý',
    icon: ShieldCheck 
  },
  { 
    value: 'KHAO_SAT_THUC_DIA', 
    label: 'Khảo sát hiện trường / Thẩm định', 
    description: 'Thực địa kiểm tra tài sản, nhà máy xưởng sản xuất, địa điểm kinh doanh mới',
    icon: MapPin 
  },
  { 
    value: 'LIEN_TINH', 
    label: 'Công tác liên tỉnh / Chi nhánh xa', 
    description: 'Làm việc dài ngày tại chi nhánh, nhà xưởng tỉnh thành khác',
    icon: Car 
  },
  { 
    value: 'KHAC', 
    label: 'Mục đích khác', 
    description: 'Hội thảo nghiệp vụ, tập huấn chính sách thuế, các công tác đột xuất khác',
    icon: FileText 
  },
];

const QUICK_TASK_PRESETS: Record<BusinessTripType, string[]> = {
  CO_QUAN_THUE: [
    'Giải trình quyết toán thuế TNDN & chi phí hợp lý',
    'Nộp hồ sơ xin hoàn thuế GTGT dự án đầu tư',
    'Đối chiếu số liệu nợ đọng thuế và tiền chậm nộp trên eTax',
    'Làm việc với cán bộ quản lý thu về hóa đơn rủi ro',
    'Nộp hồ sơ hủy hóa đơn điện tử và xác nhận nghĩa vụ thuế'
  ],
  KHACH_HANG: [
    'Thu thập toàn bộ hóa đơn, chứng từ gốc & sổ phụ ngân hàng',
    'Chứng kiến và lập Biên bản kiểm kê quỹ tiền mặt & hàng tồn kho',
    'Bàn giao bộ Báo cáo tài chính năm đã ký đóng dấu & in ấn',
    'Cài đặt Token chữ ký số mới & kiểm tra kết nối phần mềm kế toán',
    'Họp tư vấn quản trị tài chính & tối ưu thuế với Ban Giám đốc'
  ],
  BHXH_DKKD: [
    'Nộp hồ sơ thay đổi ĐKKD, tăng vốn, bổ sung ngành nghề tại Sở KH&ĐT',
    'Nhận Giấy chứng nhận ĐKKD mới và khắc dấu pháp nhân',
    'Nộp hồ sơ chốt sổ BHXH và nhận kết quả C12-TS tại Cơ quan BHXH',
    'Giải quyết vướng mắc đóng trùng BHXH hoặc cấp thẻ BHYT'
  ],
  NGAN_HANG_TOA_AN: [
    'Mở tài khoản ngân hàng doanh nghiệp và đăng ký nộp thuế điện tử',
    'Lấy xác nhận số dư tài khoản ngân hàng tại thời điểm khóa sổ',
    'Sao y công chứng hồ sơ pháp lý phục vụ đấu thầu / vay vốn'
  ],
  KHAO_SAT_THUC_DIA: [
    'Khảo sát hiện trạng nhà xưởng và máy móc thiết bị phục vụ trích khấu hao',
    'Xác minh địa điểm đặt trụ sở chính và chi nhánh theo quy định',
    'Chụp ảnh hiện trường, lập biên bản ghi nhận hiện trạng doanh nghiệp'
  ],
  LIEN_TINH: [
    'Rà soát toàn bộ sổ sách chi nhánh tỉnh và hợp nhất số liệu',
    'Làm việc với Cục Thuế địa phương về chính sách ưu đãi thuế địa bàn khó khăn',
    'Đào tạo nhân viên kế toán nhà máy tỉnh'
  ],
  KHAC: [
    'Tham gia khóa tập huấn chính sách thuế mới của Hiệp hội Doanh nghiệp',
    'Họp trao đổi hợp tác cung cấp dịch vụ kế toán'
  ]
};

export const BusinessTripCreateModal: React.FC<BusinessTripCreateModalProps> = ({
  currentUser,
  users,
  customers,
  preselectedCustomer,
  onClose,
  onSuccess,
}) => {
  // Form States
  const [tripType, setTripType] = useState<BusinessTripType>('CO_QUAN_THUE');
  const [employeeId, setEmployeeId] = useState<string>(currentUser.id);
  const [selectedCompanions, setSelectedCompanions] = useState<string[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(preselectedCustomer?.id || '');
  const [destination, setDestination] = useState<string>(preselectedCustomer?.address || '');
  const [title, setTitle] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(CURRENT_SYSTEM_DATE);
  const [endDate, setEndDate] = useState<string>(CURRENT_SYSTEM_DATE);
  const [timeSlot, setTimeSlot] = useState<BusinessTripTimeSlot>('SANG');
  const [transportation, setTransportation] = useState<BusinessTripTransport>('XE_MAY_CA_NHAN');
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  
  // Tasks Checklist
  const [taskList, setTaskList] = useState<Array<{ id: string; title: string; isCompleted: boolean }>>([
    { id: '1', title: 'Thu thập chứng từ, hóa đơn & biên bản làm việc', isCompleted: false }
  ]);
  const [newTaskInput, setNewTaskInput] = useState<string>('');

  // Selected Employee object
  const selectedEmployee = useMemo(() => {
    return users.find(u => u.id === employeeId) || currentUser;
  }, [users, employeeId, currentUser]);

  // Handle Customer Selection
  const handleCustomerChange = (cId: string) => {
    setSelectedCustomerId(cId);
    if (!cId) return;
    const cust = customers.find(c => c.id === cId);
    if (cust) {
      if (!destination || tripType === 'KHACH_HANG') {
        setDestination(cust.address || `Trụ sở ${cust.name}`);
      }
      if (!title) {
        if (tripType === 'CO_QUAN_THUE') {
          setTitle(`Làm việc Thuế cơ sở về hồ sơ ${cust.name}`);
        } else if (tripType === 'KHACH_HANG') {
          setTitle(`Công tác thực địa & thu thập chứng từ tại ${cust.name}`);
        } else if (tripType === 'BHXH_DKKD') {
          setTitle(`Thủ tục ĐKKD / BHXH cho ${cust.name}`);
        }
      }
    }
  };

  // Quick Preset Add
  const handleAddPresetTask = (taskText: string) => {
    if (taskList.some(t => t.title.toLowerCase() === taskText.toLowerCase())) return;
    setTaskList(prev => [...prev, { id: `T-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, title: taskText, isCompleted: false }]);
  };

  const handleAddTask = () => {
    if (!newTaskInput.trim()) return;
    setTaskList(prev => [...prev, { id: `T-${Date.now()}`, title: newTaskInput.trim(), isCompleted: false }]);
    setNewTaskInput('');
  };

  const handleRemoveTask = (taskId: string) => {
    setTaskList(prev => prev.filter(t => t.id !== taskId));
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Vui lòng nhập tên / mục đích chính của chuyến công tác');
      return;
    }
    if (!destination.trim()) {
      alert('Vui lòng nhập địa điểm / cơ quan đến công tác');
      return;
    }
    if (!purpose.trim()) {
      alert('Vui lòng nhập nội dung chi tiết công tác');
      return;
    }

    const cust = customers.find(c => c.id === selectedCustomerId);
    const companionUsers = users.filter(u => selectedCompanions.includes(u.id));

    const durationText = startDate === endDate 
      ? (timeSlot === 'SANG' ? '1 buổi sáng' : timeSlot === 'CHIEU' ? '1 buổi chiều' : '1 ngày')
      : 'Nhiều ngày';

    const newTrip = storageService.createBusinessTrip({
      title: title.trim(),
      tripType,
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.name,
      department: selectedEmployee.department || 'KE_TOAN_THUE',
      position: selectedEmployee.position || 'Chuyên viên Kế toán',
      companionStaffIds: selectedCompanions,
      companionStaffNames: companionUsers.map(u => u.name),
      customerId: cust?.id,
      customerName: cust?.name,
      customerTaxCode: cust?.taxCode,
      destination: destination.trim(),
      startDate,
      endDate,
      timeSlot,
      estimatedDuration: durationText,
      transportation,
      purpose: purpose.trim(),
      tasks: taskList,
      advanceAmount: Number(advanceAmount) || 0,
    }, currentUser);

    onSuccess(newTrip);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end">
      <div className="relative w-full max-w-3xl h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <Briefcase className="h-6 w-6 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">
                Đăng Ký Lịch Công Tác Thực Địa & Cơ Quan Thuế
              </h3>
              <p className="text-xs text-blue-100">
                Lập kế hoạch làm việc tại Thuế cơ sở, Khách hàng, Cơ quan BHXH & Xin cấp Giấy đi đường
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-900 dark:text-slate-100">
          
          {/* Section 1: Trip Type Selection */}
          <div className="space-y-2.5">
            <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300">
              1. Loại hình công tác & Địa bàn thực địa <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {TRIP_TYPE_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const isSelected = tripType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setTripType(opt.value);
                      if (!title && selectedCustomerId) {
                        const c = customers.find(x => x.id === selectedCustomerId);
                        if (c) {
                          if (opt.value === 'CO_QUAN_THUE') setTitle(`Làm việc Thuế cơ sở về hồ sơ ${c.name}`);
                          else if (opt.value === 'KHACH_HANG') setTitle(`Công tác thực địa & kiểm tra chứng từ tại ${c.name}`);
                        }
                      }
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50/50 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-xs">{opt.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                      {opt.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Basic Info (Personnel, Customer, Title) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            
            {/* Personnel In Charge */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Cán bộ phụ trách đi công tác <span className="text-rose-500">*</span>
              </label>
              <select
                value={employeeId}
                onChange={e => setEmployeeId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.position || u.role} - {u.department === 'KE_TOAN_THUE' ? 'Kế toán' : 'Hành chính'})
                  </option>
                ))}
              </select>
            </div>

            {/* Companion Staff */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Đồng nghiệp cùng đi (Đoàn công tác)
              </label>
              <select
                multiple
                value={selectedCompanions}
                onChange={e => {
                  const values = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
                  setSelectedCompanions(values);
                }}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 h-[68px]"
              >
                {users.filter(u => u.id !== employeeId).map(u => (
                  <option key={u.id} value={u.id}>
                    + {u.name} ({u.position || 'Nhân viên'})
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400">Giữ phím Ctrl/Cmd để chọn nhiều nhân sự cùng đi</span>
            </div>

            {/* Customer Association */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Khách hàng / Doanh nghiệp liên quan
              </label>
              <select
                value={selectedCustomerId}
                onChange={e => handleCustomerChange(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Không gắn khách hàng cụ thể (Nội bộ / Chung) --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} (MST: {c.taxCode})
                  </option>
                ))}
              </select>
            </div>

            {/* Destination Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Địa điểm / Cơ quan đến công tác <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={destination}
                onChange={e => setDestination(e.target.value)}
                placeholder="VD: Thuế cơ sở 2 TP. Hồ Chí Minh / Trụ sở Công ty ABC..."
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Title / Summary */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Mục đích / Tên chuyến công tác <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="VD: Làm việc với Đội Kiểm tra Thuế số 2 về hoàn thuế GTGT dự án đầu tư..."
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Section 3: Time, Transportation & Advance Allowance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Ngày bắt đầu <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  if (e.target.value > endDate) setEndDate(e.target.value);
                }}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Ngày kết thúc <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                min={startDate}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Khung giờ công tác
              </label>
              <select
                value={timeSlot}
                onChange={e => setTimeSlot(e.target.value as BusinessTripTimeSlot)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500"
              >
                <option value="SANG">Buổi sáng (08:00 - 12:00)</option>
                <option value="CHIEU">Buổi chiều (13:30 - 17:30)</option>
                <option value="CA_NGAY">Cả ngày làm việc</option>
                <option value="NHIEU_NGAY">Nhiều ngày liên tiếp</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Phương tiện di chuyển
              </label>
              <select
                value={transportation}
                onChange={e => setTransportation(e.target.value as BusinessTripTransport)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500"
              >
                <option value="XE_MAY_CA_NHAN">Xe máy cá nhân (Khoán xăng)</option>
                <option value="GRAB_TAXI">Grab / Taxi công nghệ</option>
                <option value="XE_CONG_TY">Xe ô tô công ty</option>
                <option value="MAY_BAY_TAU_XE">Máy bay / Tàu xe liên tỉnh</option>
                <option value="KHAC">Khác</option>
              </select>
            </div>
          </div>

          {/* Advance Allowance and Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tạm ứng công tác phí (VND)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step={50000}
                  min={0}
                  value={advanceAmount}
                  onChange={e => setAdvanceAmount(Number(e.target.value))}
                  placeholder="0"
                  className="w-full pl-3 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">đ</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Khoản tạm ứng xăng xe, cước taxi, lệ phí hồ sơ, ăn ở...
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nội dung chi tiết & Kế hoạch làm việc <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                placeholder="Mô tả cụ thể nội dung trao đổi với Thuế cơ sở / Khách hàng, các tài liệu cần thu thập..."
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Section 4: Tasks / Documents Checklist */}
          <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                  <CheckSquare className="h-4 w-4 text-blue-600" />
                  <span>Danh mục hồ sơ & nhiệm vụ cần hoàn tất tại hiện trường ({taskList.length})</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Cán bộ thực địa sẽ tick chọn hoàn tất và bàn giao chứng từ khi nộp báo cáo kết quả.
                </p>
              </div>
            </div>

            {/* Quick Presets based on Trip Type */}
            {QUICK_TASK_PRESETS[tripType] && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center space-x-1">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  <span>Gợi ý nhanh theo nghiệp vụ:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_TASK_PRESETS[tripType].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddPresetTask(preset)}
                      className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-300 hover:text-blue-600 rounded-lg text-[11px] border border-slate-200 dark:border-slate-700 transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="h-3 w-3 text-blue-500" />
                      <span>{preset}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Current Tasks List */}
            <div className="space-y-2 pt-2">
              {taskList.map((task, index) => (
                <div
                  key={task.id}
                  className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs"
                >
                  <span className="text-xs font-mono font-bold text-slate-400 w-5 text-center">
                    {index + 1}.
                  </span>
                  <input
                    type="text"
                    value={task.title}
                    onChange={e => {
                      const val = e.target.value;
                      setTaskList(prev => prev.map(t => t.id === task.id ? { ...t, title: val } : t));
                    }}
                    className="flex-1 text-xs font-medium bg-transparent border-none focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveTask(task.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {/* Add Custom Task Input */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="text"
                  value={newTaskInput}
                  onChange={e => setNewTaskInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTask();
                    }
                  }}
                  placeholder="Nhập thêm hạng mục nghiệp vụ / chứng từ cần xử lý và nhấn Enter..."
                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddTask}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 text-blue-600 font-bold rounded-xl text-xs border border-slate-200 dark:border-slate-700 transition-colors flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Thêm</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center space-x-2 cursor-pointer"
            >
              <CheckSquare className="h-4 w-4" />
              <span>Gửi Đăng Ký Lịch Công Tác</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

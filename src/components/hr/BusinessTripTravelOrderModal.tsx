import React from 'react';
import { BusinessTrip, User, Customer } from '../../types';
import { formatDate, formatVND } from '../../utils/formatters';
import { storageService, CURRENT_SYSTEM_DATE } from '../../services/storageService';
import { Printer, X, Download, ShieldCheck, Building2, Calendar, MapPin, CheckCircle2 } from 'lucide-react';

interface BusinessTripTravelOrderModalProps {
  trip: BusinessTrip;
  customer?: Customer;
  currentUser: User;
  onClose: () => void;
}

export const BusinessTripTravelOrderModal: React.FC<BusinessTripTravelOrderModalProps> = ({
  trip,
  customer,
  currentUser,
  onClose,
}) => {
  const company = storageService.getCompanyInfo();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden print:border-none print:shadow-none print:max-w-none print:rounded-none">
        
        {/* Top Action Bar (Hidden in print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800 text-white print:hidden">
          <div className="flex items-center space-x-3">
            <ShieldCheck className="h-5 w-5 text-blue-400" />
            <div>
              <h3 className="text-sm font-black uppercase tracking-wide">
                Giấy Đi Đường & Lệnh Điều Động Công Tác (Mẫu C06-HD)
              </h3>
              <p className="text-[11px] text-slate-300">
                Mã hồ sơ: <span className="font-mono font-bold text-amber-300">{trip.code}</span> • Trạng thái: {trip.status === 'DA_DUYET' ? 'Đã duyệt' : trip.status === 'HOAN_THANH' ? 'Đã hoàn thành' : 'Lưu hành nội bộ'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>In Giấy Đi Đường</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 sm:p-12 text-slate-900 dark:text-slate-100 print:text-black print:p-8 bg-white dark:bg-slate-900 print:bg-white text-[13px] leading-relaxed">
          
          {/* Header */}
          <div className="grid grid-cols-2 gap-4 pb-6 border-b border-slate-300 dark:border-slate-700">
            <div>
              <div className="font-black text-sm uppercase">{company.name}</div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 print:text-slate-600">
                MST: {company.taxCode} • CCHN: {company.licenseNumber}
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 print:text-slate-600">
                Địa chỉ: {company.address}
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 print:text-slate-600">
                Bộ phận: {trip.department === 'KE_TOAN_THUE' ? 'Phòng Dịch Vụ Kế Toán & Đại Lý Thuế' : 'Phòng Hành Chính & Nghiệp Vụ'}
              </div>
            </div>

            <div className="text-right">
              <div className="font-bold text-[12px] uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              <div className="text-[11px] italic font-semibold">Độc lập - Tự do - Hạnh phúc</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 print:text-slate-500 mt-2">
                Mẫu số: C06-HD / C16-HD (Ban hành theo TT 200/2014/TT-BTC & TT 133/2016/TT-BTC)
              </div>
              <div className="text-[11px] font-mono font-bold mt-1 text-slate-700 dark:text-slate-300">
                Số: {trip.code}/GĐĐ-TC
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center py-6">
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-slate-900 dark:text-white print:text-black">
              GIẤY ĐI ĐƯỜNG & LỆNH ĐIỀU ĐỘNG CÔNG TÁC
            </h1>
            <p className="text-xs italic text-slate-500 dark:text-slate-400 print:text-slate-500 mt-1">
              (Căn cứ Quyết định cử cán bộ đi công tác và giải quyết công việc theo yêu cầu nghiệp vụ)
            </p>
          </div>

          {/* Officer Details */}
          <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 print:bg-transparent p-4 rounded-2xl border border-slate-200 dark:border-slate-700 print:border-slate-400">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-slate-500 dark:text-slate-400 print:text-slate-600 font-medium">Họ và tên cán bộ công tác:</span>{' '}
                <strong className="text-slate-900 dark:text-white print:text-black text-sm">{trip.employeeName}</strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 print:text-slate-600 font-medium">Chức vụ / Vị trí:</span>{' '}
                <strong>{trip.position || 'Chuyên viên Kế toán Thuế'}</strong>
              </div>
            </div>

            {trip.companionStaffNames && trip.companionStaffNames.length > 0 && (
              <div>
                <span className="text-slate-500 dark:text-slate-400 print:text-slate-600 font-medium">Đoàn cán bộ cùng đi:</span>{' '}
                <strong>{trip.companionStaffNames.join(', ')}</strong>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-slate-500 dark:text-slate-400 print:text-slate-600 font-medium">Doanh nghiệp / Khách hàng:</span>{' '}
                <strong>{trip.customerName ? `${trip.customerName} (MST: ${trip.customerTaxCode})` : 'Nghiệp vụ cơ quan nhà nước'}</strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 print:text-slate-600 font-medium">Nơi đến công tác:</span>{' '}
                <strong>{trip.destination}</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-slate-500 dark:text-slate-400 print:text-slate-600 font-medium">Thời gian:</span>{' '}
                <strong>{formatDate(trip.startDate)} {trip.startDate !== trip.endDate ? `đến ${formatDate(trip.endDate)}` : ''}</strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 print:text-slate-600 font-medium">Khung giờ:</span>{' '}
                <strong>
                  {trip.timeSlot === 'SANG' ? 'Buổi sáng (08:00 - 12:00)' :
                   trip.timeSlot === 'CHIEU' ? 'Buổi chiều (13:30 - 17:30)' :
                   trip.timeSlot === 'CA_NGAY' ? 'Cả ngày' : 'Nhiều ngày'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 print:text-slate-600 font-medium">Phương tiện:</span>{' '}
                <strong>
                  {trip.transportation === 'XE_MAY_CA_NHAN' ? 'Xe máy cá nhân' :
                   trip.transportation === 'XE_CONG_TY' ? 'Xe công ty' :
                   trip.transportation === 'GRAB_TAXI' ? 'Grab / Taxi' :
                   trip.transportation === 'MAY_BAY_TAU_XE' ? 'Máy bay / Tàu xe' : 'Khác'}
                </strong>
              </div>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 print:text-slate-600 font-medium">Mục đích & Nội dung làm việc:</span>{' '}
              <span className="font-semibold">{trip.purpose}</span>
            </div>

            {trip.advanceAmount > 0 && (
              <div>
                <span className="text-slate-500 dark:text-slate-400 print:text-slate-600 font-medium">Tạm ứng công tác phí:</span>{' '}
                <strong className="text-blue-600 dark:text-blue-400 print:text-black">{formatVND(trip.advanceAmount)}</strong>
              </div>
            )}
          </div>

          {/* Section 2: Table of Checklist & Arrival / Departure Confirmations */}
          <div className="mt-6 space-y-3">
            <h4 className="font-bold text-xs uppercase text-slate-800 dark:text-slate-200 print:text-black">
              I. Lịch trình di chuyển và xác nhận của cơ quan / khách hàng nơi đến
            </h4>

            <table className="w-full border-collapse border border-slate-300 dark:border-slate-700 print:border-slate-400 text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 print:bg-slate-100 font-bold text-center">
                  <th className="border border-slate-300 dark:border-slate-700 print:border-slate-400 p-2 w-1/4">Nơi đi & Nơi đến</th>
                  <th className="border border-slate-300 dark:border-slate-700 print:border-slate-400 p-2 w-1/6">Ngày đi / Đến</th>
                  <th className="border border-slate-300 dark:border-slate-700 print:border-slate-400 p-2 w-1/6">Phương tiện</th>
                  <th className="border border-slate-300 dark:border-slate-700 print:border-slate-400 p-2">Xác nhận, ký tên & đóng dấu của nơi đến</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 dark:border-slate-700 print:border-slate-400 p-2.5">
                    <strong>Đi:</strong> Trụ sở Công ty TaxCore<br />
                    <strong>Đến:</strong> {trip.destination}
                  </td>
                  <td className="border border-slate-300 dark:border-slate-700 print:border-slate-400 p-2.5 text-center">
                    {formatDate(trip.startDate)}
                  </td>
                  <td className="border border-slate-300 dark:border-slate-700 print:border-slate-400 p-2.5 text-center">
                    {trip.transportation === 'GRAB_TAXI' ? 'Taxi/Grab' : trip.transportation === 'XE_MAY_CA_NHAN' ? 'Xe máy' : 'Xe công ty'}
                  </td>
                  <td className="border border-slate-300 dark:border-slate-700 print:border-slate-400 p-2.5 h-20 align-top text-[11px] text-slate-400 italic">
                    (Ký, ghi rõ họ tên & đóng dấu xác nhận của Chi cục Thuế / Khách hàng)
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 dark:border-slate-700 print:border-slate-400 p-2.5">
                    <strong>Về:</strong> Trụ sở Công ty TaxCore
                  </td>
                  <td className="border border-slate-300 dark:border-slate-700 print:border-slate-400 p-2.5 text-center">
                    {formatDate(trip.endDate)}
                  </td>
                  <td className="border border-slate-300 dark:border-slate-700 print:border-slate-400 p-2.5 text-center">
                    {trip.transportation === 'GRAB_TAXI' ? 'Taxi/Grab' : trip.transportation === 'XE_MAY_CA_NHAN' ? 'Xe máy' : 'Xe công ty'}
                  </td>
                  <td className="border border-slate-300 dark:border-slate-700 print:border-slate-400 p-2.5 h-20 align-top text-[11px] text-slate-400 italic">
                    (Xác nhận cán bộ đã hoàn tất nhiệm vụ và trở về đơn vị)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 3: Tasks Checklist & Results */}
          {trip.tasks && trip.tasks.length > 0 && (
            <div className="mt-6 space-y-2">
              <h4 className="font-bold text-xs uppercase text-slate-800 dark:text-slate-200 print:text-black">
                II. Danh mục hồ sơ, chứng từ & nghiệp vụ cần hoàn tất
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {trip.tasks.map((task, idx) => (
                  <div
                    key={task.id || idx}
                    className="flex items-start space-x-2 text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 print:bg-transparent border border-slate-200 dark:border-slate-700 print:border-slate-300"
                  >
                    <div className="h-4 w-4 rounded-sm border border-slate-400 dark:border-slate-500 flex items-center justify-center shrink-0 mt-0.5">
                      {task.isCompleted ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : null}
                    </div>
                    <span>{task.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Result summary if completed */}
          {trip.resultSummary && (
            <div className="mt-6 space-y-2">
              <h4 className="font-bold text-xs uppercase text-slate-800 dark:text-slate-200 print:text-black">
                III. Kết quả công tác thực tế & Hồ sơ bàn giao
              </h4>
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 print:bg-transparent rounded-xl border border-emerald-200 dark:border-emerald-800 print:border-slate-300 text-xs">
                <p className="font-medium text-slate-800 dark:text-slate-200 print:text-black">{trip.resultSummary}</p>
                {trip.deliverables && trip.deliverables.length > 0 && (
                  <div className="mt-2 text-[11px]">
                    <strong>Hồ sơ, chứng từ đã thu thập:</strong> {trip.deliverables.join('; ')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Signatures */}
          <div className="mt-10 grid grid-cols-3 gap-4 text-center text-xs">
            <div>
              <div className="font-bold uppercase">NGƯỜI ĐI CÔNG TÁC</div>
              <div className="text-[11px] text-slate-400 italic">(Ký, ghi rõ họ tên)</div>
              <div className="h-16 flex items-end justify-center font-bold text-slate-900 dark:text-white print:text-black">
                {trip.employeeName}
              </div>
            </div>

            <div>
              <div className="font-bold uppercase">PHỤ TRÁCH BỘ PHẬN</div>
              <div className="text-[11px] text-slate-400 italic">(Ký, duyệt kế hoạch)</div>
              <div className="h-16 flex items-end justify-center font-bold text-slate-900 dark:text-white print:text-black">
                {trip.approverName || 'Nguyễn Văn A'}
              </div>
            </div>

            <div>
              <div className="font-bold uppercase">THỦ TRƯỞNG ĐƠN VỊ</div>
              <div className="text-[11px] text-slate-400 italic">(Ký tên, đóng dấu)</div>
              <div className="h-16 flex items-end justify-center font-bold text-slate-900 dark:text-white print:text-black">
                {company.directorName || 'Ban Giám Đốc'}
              </div>
            </div>
          </div>

          <div className="mt-8 text-[11px] text-slate-400 text-center italic border-t border-slate-200 dark:border-slate-800 pt-3">
            Hồ sơ công tác được lưu trữ và quản lý số hóa trên Hệ thống Quản trị Đại lý Thuế & Kế toán TaxCore Enterprise.
          </div>
        </div>
      </div>
    </div>
  );
};

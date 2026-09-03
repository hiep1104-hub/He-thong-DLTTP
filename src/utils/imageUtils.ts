/**
 * Image Processing & Evidence Optimization Utilities
 * Tối ưu hóa lưu trữ ảnh bằng chứng, nén ảnh nhẹ WebP/JPEG, hỗ trợ Paste/Kéo thả/Tạo ảnh mẫu
 */

import { AttachmentCategory } from '../types';

export interface CompressedImageResult {
  dataUrl: string;
  size: number;
  width: number;
  height: number;
  originalName: string;
  mimeType: string;
}

/**
 * Kiểm tra xem file có phải là file ảnh hay không
 */
export function isImageFile(fileType?: string, fileName?: string): boolean {
  if (fileType && fileType.startsWith('image/')) return true;
  if (fileName) {
    const ext = fileName.toLowerCase().split('.').pop();
    return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp'].includes(ext || '');
  }
  return false;
}

/**
 * Nén ảnh tự động trên client bằng HTML5 Canvas để tối ưu dung lượng lưu trữ siêu nhẹ (< 150KB)
 */
export async function compressImageFile(
  file: File | Blob,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    preferredMime?: 'image/webp' | 'image/jpeg';
    fileName?: string;
  } = {}
): Promise<CompressedImageResult> {
  const {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.8,
    preferredMime = 'image/webp',
    fileName = (file instanceof File ? file.name : `evidence_${Date.now()}.webp`),
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc tệp tin'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Không thể tải dữ liệu ảnh'));
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Tính toán tỷ lệ co giãn giữ nguyên aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Không khởi tạo được Canvas 2D'));
          return;
        }

        // Vẽ nền trắng để tránh PNG trong suốt bị đen khi chuyển sang JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Vẽ ảnh với chế độ khử răng cưa chất lượng cao
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        let mime = preferredMime;
        let dataUrl = canvas.toDataURL(mime, quality);

        // Fallback sang JPEG nếu WebP không được hỗ trợ hoặc dung lượng bị lỗi
        if (!dataUrl.startsWith(`data:${mime}`)) {
          mime = 'image/jpeg';
          dataUrl = canvas.toDataURL(mime, quality);
        }

        // Tính kích thước xấp xỉ từ base64 (3/4 chiều dài chuỗi base64 trừ header)
        const base64Content = dataUrl.split(',')[1] || '';
        const approxSize = Math.round((base64Content.length * 3) / 4);

        resolve({
          dataUrl,
          size: approxSize,
          width,
          height,
          originalName: fileName,
          mimeType: mime,
        });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Tải ảnh trực tiếp từ Data URL về máy tính người dùng
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Tạo ảnh bằng chứng nghiệp vụ mẫu sắc nét, dung lượng siêu nhẹ dạng SVG Data URL
 * Phục vụ thử nghiệm và demo thực tế quy trình nộp thuế, chứng từ ngân hàng, ký số CKS
 */
export function createSampleEvidenceImage(
  type: 'THONG_BAO_THUE' | 'UNC_NGAN_HANG' | 'KY_SO_TOKEN' | 'BIEN_BAN_HOAN_THANH',
  params: {
    customerName?: string;
    taxCode?: string;
    taskTitle?: string;
    period?: string;
    signerName?: string;
    amount?: string;
  } = {}
): {
  dataUrl: string;
  name: string;
  category: AttachmentCategory;
  fileType: string;
  size: number;
  dimensions: { width: number; height: number };
} {
  const customerName = params.customerName || 'CÔNG TY TNHH THƯƠNG MẠI & DỊCH VỤ MINH ĐỨC';
  const taxCode = params.taxCode || '0109887766';
  const taskTitle = params.taskTitle || 'Tờ khai thuế GTGT Mẫu 01/GTGT';
  const period = params.period || 'Quý 2/2026';
  const signerName = params.signerName || 'Lê Hoàng Nam (Chuyên viên Kế toán Thuế)';
  const amount = params.amount || '45.200.000 VNĐ';
  const dateStr = new Date().toLocaleDateString('vi-VN');
  const timeStr = new Date().toLocaleTimeString('vi-VN');

  let svgContent = '';
  let filename = '';
  let category: AttachmentCategory = 'TO_KHAI_THUE';

  if (type === 'THONG_BAO_THUE') {
    filename = `TB_Tiep_Nhan_Thue_Dien_Tu_${taxCode}_${Date.now()}.png`;
    category = 'TO_KHAI_THUE';
    svgContent = `
      <svg width="800" height="520" viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="headerGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#0f3959" />
            <stop offset="100%" stop-color="#1e5f8a" />
          </linearGradient>
          <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.1" />
          </filter>
        </defs>
        
        <!-- Background Sheet -->
        <rect width="800" height="520" fill="#f8fafc" />
        <rect x="20" y="20" width="760" height="480" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" filter="url(#shadow)" />
        
        <!-- Header Banner -->
        <rect x="20" y="20" width="760" height="85" rx="12" fill="url(#headerGrad)" />
        <text x="400" y="52" fill="#ffffff" font-size="15" font-family="system-ui, sans-serif" font-weight="bold" text-anchor="middle">TỔNG CỤC THUẾ - HỆ THỐNG THUẾ ĐIỆN TỬ (eTax)</text>
        <text x="400" y="76" fill="#93c5fd" font-size="12" font-family="system-ui, sans-serif" text-anchor="middle">CỔNG THÔNG TIN ĐIỆN TỬ DÀNH CHO DOANH NGHIỆP THUEDIENTU.GDT.GOV.VN</text>
        
        <!-- Official Badge -->
        <rect x="50" y="125" width="700" height="40" rx="6" fill="#ecfdf5" stroke="#10b981" stroke-width="1" />
        <circle cx="75" cy="145" r="10" fill="#10b981" />
        <path d="M 70 145 L 74 149 L 81 141" stroke="#ffffff" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="95" y="150" fill="#065f46" font-size="13" font-family="system-ui, sans-serif" font-weight="bold">THÔNG BÁO TIẾP NHẬN HỒ SƠ KHAI THUẾ ĐIỆN TỬ THÀNH CÔNG</text>
        
        <!-- Body Content -->
        <text x="50" y="200" fill="#64748b" font-size="12" font-family="system-ui, sans-serif">Người nộp thuế:</text>
        <text x="180" y="200" fill="#0f172a" font-size="13" font-family="system-ui, sans-serif" font-weight="bold">${customerName}</text>
        
        <text x="50" y="230" fill="#64748b" font-size="12" font-family="system-ui, sans-serif">Mã số thuế:</text>
        <text x="180" y="230" fill="#0f172a" font-size="13" font-family="system-ui, sans-serif" font-weight="bold">${taxCode}</text>
        
        <text x="50" y="260" fill="#64748b" font-size="12" font-family="system-ui, sans-serif">Hồ sơ khai thuế:</text>
        <text x="180" y="260" fill="#2563eb" font-size="13" font-family="system-ui, sans-serif" font-weight="bold">${taskTitle} - Kỳ: ${period}</text>
        
        <text x="50" y="290" fill="#64748b" font-size="12" font-family="system-ui, sans-serif">Thời điểm tiếp nhận:</text>
        <text x="180" y="290" fill="#0f172a" font-size="12" font-family="system-ui, sans-serif">${timeStr} ngày ${dateStr}</text>
        
        <text x="50" y="320" fill="#64748b" font-size="12" font-family="system-ui, sans-serif">Mã giao dịch điện tử:</text>
        <text x="180" y="320" fill="#0f172a" font-size="12" font-family="monospace" font-weight="bold">1102026${Date.now().toString().slice(-8)}TAX</text>
        
        <!-- Stamp & Signature Box -->
        <rect x="480" y="350" width="270" height="120" rx="8" fill="#f8fafc" stroke="#e2e8f0" stroke-dasharray="4" />
        <rect x="500" y="365" width="230" height="30" rx="4" fill="#fee2e2" stroke="#ef4444" stroke-width="1" />
        <text x="615" y="384" fill="#991b1b" font-size="11" font-family="system-ui, sans-serif" font-weight="bold" text-anchor="middle">✔ ĐÃ KÝ SỐ TỔNG CỤC THUẾ</text>
        <text x="510" y="415" fill="#475569" font-size="10" font-family="system-ui, sans-serif">Ký bởi: Cổng Thông tin điện tử TCT</text>
        <text x="510" y="432" fill="#475569" font-size="10" font-family="system-ui, sans-serif">Thời gian ký: ${timeStr} ${dateStr}</text>
        <text x="510" y="450" fill="#16a34a" font-size="10" font-family="system-ui, sans-serif" font-weight="bold">Trạng thái: Hợp lệ theo NĐ 123/2020</text>
        
        <text x="50" y="465" fill="#94a3b8" font-size="11" font-family="system-ui, sans-serif">TaxCore Smart Proof System • Bằng chứng hoàn thành nghĩa vụ số #EP-${Date.now().toString().slice(-6)}</text>
      </svg>
    `;
  } else if (type === 'UNC_NGAN_HANG') {
    filename = `Giay_Nop_Tien_NSNN_Ngan_Hang_${taxCode}_${Date.now()}.png`;
    category = 'CHUNG_TU_NOP_TIEN';
    svgContent = `
      <svg width="800" height="520" viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg">
        <rect width="800" height="520" fill="#f8fafc" />
        <rect x="20" y="20" width="760" height="480" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
        
        <rect x="20" y="20" width="760" height="75" rx="12" fill="#047857" />
        <text x="400" y="48" fill="#ffffff" font-size="15" font-family="system-ui, sans-serif" font-weight="bold" text-anchor="middle">NGÂN HÀNG THƯƠNG MẠI CỔ PHẦN NGOẠI THƯƠNG VIỆT NAM (VIETCOMBANK)</text>
        <text x="400" y="70" fill="#a7f3d0" font-size="12" font-family="system-ui, sans-serif" text-anchor="middle">GIẤY NỘP TIỀN VÀO NGÂN SÁCH NHÀ NƯỚC (CHUYỂN KHOẢN ĐIỆN TỬ)</text>
        
        <rect x="50" y="115" width="700" height="35" rx="6" fill="#f0fdf4" stroke="#86efac" />
        <text x="70" y="138" fill="#166534" font-size="13" font-family="system-ui, sans-serif" font-weight="bold">GIAO DỊCH THÀNH CÔNG - ĐÃ TRỪ TÀI KHOẢN VÀ HẠCH TOÁN KHO BẠC</text>
        
        <text x="50" y="180" fill="#64748b" font-size="12" font-family="system-ui, sans-serif">Đơn vị nộp thuế:</text>
        <text x="200" y="180" fill="#0f172a" font-size="13" font-family="system-ui, sans-serif" font-weight="bold">${customerName}</text>
        
        <text x="50" y="210" fill="#64748b" font-size="12" font-family="system-ui, sans-serif">Mã số thuế:</text>
        <text x="200" y="210" fill="#0f172a" font-size="13" font-family="system-ui, sans-serif" font-weight="bold">${taxCode}</text>
        
        <text x="50" y="240" fill="#64748b" font-size="12" font-family="system-ui, sans-serif">Nộp vào NSNN tại:</text>
        <text x="200" y="240" fill="#0f172a" font-size="12" font-family="system-ui, sans-serif">Kho bạc Nhà nước Quận Cầu Giấy (TK 7111)</text>
        
        <text x="50" y="270" fill="#64748b" font-size="12" font-family="system-ui, sans-serif">Nội dung nộp NSNN:</text>
        <text x="200" y="270" fill="#1e40af" font-size="13" font-family="system-ui, sans-serif" font-weight="bold">Nộp thuế GTGT & TNDN tạm tính - ${period}</text>
        
        <text x="50" y="305" fill="#64748b" font-size="12" font-family="system-ui, sans-serif">Số tiền thanh toán:</text>
        <text x="200" y="308" fill="#b91c1c" font-size="18" font-family="system-ui, sans-serif" font-weight="black">${amount}</text>
        
        <!-- Stamp -->
        <circle cx="630" cy="380" r="55" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="3 3" />
        <circle cx="630" cy="380" r="48" fill="none" stroke="#dc2626" stroke-width="1.5" />
        <text x="630" y="365" fill="#dc2626" font-size="10" font-family="system-ui, sans-serif" font-weight="bold" text-anchor="middle">NGÂN HÀNG VCB</text>
        <text x="630" y="382" fill="#dc2626" font-size="12" font-family="system-ui, sans-serif" font-weight="black" text-anchor="middle">ĐÃ THANH TOÁN</text>
        <text x="630" y="398" fill="#dc2626" font-size="9" font-family="system-ui, sans-serif" text-anchor="middle">${dateStr}</text>
        
        <text x="50" y="460" fill="#94a3b8" font-size="11" font-family="system-ui, sans-serif">Mã giao dịch UNC: VCB-TAX-${Date.now().toString().slice(-8)} • Chứng từ kế toán lưu trữ vĩnh viễn</text>
      </svg>
    `;
  } else if (type === 'KY_SO_TOKEN') {
    filename = `Xac_Nhan_Ky_So_CKS_${taxCode}_${Date.now()}.png`;
    category = 'TO_KHAI_THUE';
    svgContent = `
      <svg width="800" height="520" viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg">
        <rect width="800" height="520" fill="#f8fafc" />
        <rect x="20" y="20" width="760" height="480" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
        
        <rect x="20" y="20" width="760" height="75" rx="12" fill="#4338ca" />
        <text x="400" y="48" fill="#ffffff" font-size="15" font-family="system-ui, sans-serif" font-weight="bold" text-anchor="middle">CHỨNG THƯ SỐ DOANH NGHIỆP (USB TOKEN CKS)</text>
        <text x="400" y="70" fill="#c7d2fe" font-size="12" font-family="system-ui, sans-serif" text-anchor="middle">XÁC NHẬN CHỮ KÝ ĐIỆN TỬ HỢP CHUẨN TRÊN HỆ THỐNG KẾ TOÁN</text>
        
        <rect x="50" y="115" width="700" height="40" rx="6" fill="#eef2ff" stroke="#6366f1" />
        <text x="70" y="140" fill="#3730a3" font-size="13" font-family="system-ui, sans-serif" font-weight="bold">KHÓA BẢO MẬT HỢP LỆ - ĐÃ KÝ ĐÓNG DẤU ĐIỆN TỬ VÀO HỒ SƠ</text>
        
        <text x="50" y="185" fill="#64748b" font-size="12" font-family="system-ui, sans-serif">Chủ thể chứng thư:</text>
        <text x="210" y="185" fill="#0f172a" font-size="13" font-family="system-ui, sans-serif" font-weight="bold">${customerName}</text>
        
        <text x="50" y="215" fill="#64748b" font-size="12" font-family="system-ui, sans-serif">Nhà cung cấp CKS:</text>
        <text x="210" y="215" fill="#0f172a" font-size="12" font-family="system-ui, sans-serif">VIETTEL-CA / VNPT-CA (Đang hoạt động)</text>
        
        <text x="50" y="245" fill="#64748b" font-size="12" font-family="system-ui, sans-serif">Tài liệu đã ký:</text>
        <text x="210" y="245" fill="#4338ca" font-size="13" font-family="system-ui, sans-serif" font-weight="bold">${taskTitle}</text>
        
        <text x="50" y="275" fill="#64748b" font-size="12" font-family="system-ui, sans-serif">Người thực hiện ký:</text>
        <text x="210" y="275" fill="#0f172a" font-size="12" font-family="system-ui, sans-serif">${signerName}</text>
        
        <text x="50" y="305" fill="#64748b" font-size="12" font-family="system-ui, sans-serif">Thời gian ký số:</text>
        <text x="210" y="305" fill="#0f172a" font-size="12" font-family="system-ui, sans-serif">${timeStr} ngày ${dateStr}</text>
        
        <rect x="50" y="340" width="700" height="90" rx="8" fill="#f1f5f9" stroke="#cbd5e1" />
        <text x="70" y="365" fill="#475569" font-size="11" font-family="monospace">Mã băm SHA-256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069</text>
        <text x="70" y="390" fill="#475569" font-size="11" font-family="system-ui, sans-serif">Số Serial Token: 54 04 2b 8a 91 cd 0a f1 22 90</text>
        <text x="70" y="415" fill="#15803d" font-size="11" font-family="system-ui, sans-serif" font-weight="bold">Thuật toán ký: RSA-2048 (Chữ ký điện tử có giá trị pháp lý tương đương con dấu doanh nghiệp)</text>
        
        <text x="50" y="465" fill="#94a3b8" font-size="11" font-family="system-ui, sans-serif">Hệ thống TaxCore WorkFlow • Nhật ký ký số an toàn cấp độ 3</text>
      </svg>
    `;
  } else {
    filename = `Bien_Ban_Nghiem_Thu_Dich_Vu_${taxCode}_${Date.now()}.png`;
    category = 'BIEN_BAN';
    svgContent = `
      <svg width="800" height="520" viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg">
        <rect width="800" height="520" fill="#f8fafc" />
        <rect x="20" y="20" width="760" height="480" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
        
        <rect x="20" y="20" width="760" height="75" rx="12" fill="#0056b3" />
        <text x="400" y="48" fill="#ffffff" font-size="15" font-family="system-ui, sans-serif" font-weight="bold" text-anchor="middle">BIÊN BẢN NGHIỆM THU HOÀN THÀNH HỒ SƠ & BÀN GIAO KẾT QUẢ</text>
        <text x="400" y="70" fill="#bae6fd" font-size="12" font-family="system-ui, sans-serif" text-anchor="middle">CÔNG TY TNHH ĐẠI LÝ THUẾ THÀNH PHỐ - ĐỒNG HÀNH PHÁP LÝ DOANH NGHIỆP</text>
        
        <rect x="50" y="115" width="700" height="35" rx="6" fill="#f0f9ff" stroke="#7dd3fc" />
        <text x="70" y="138" fill="#0369a1" font-size="13" font-family="system-ui, sans-serif" font-weight="bold">KẾT LUẬN: ĐÃ HOÀN THÀNH 100% CÔNG VIỆC THEO HỢP ĐỒNG DỊCH VỤ</text>
        
        <text x="50" y="180" fill="#64748b" font-size="12" font-family="system-ui, sans-serif">Khách hàng nghiệm thu:</text>
        <text x="210" y="180" fill="#0f172a" font-size="13" font-family="system-ui, sans-serif" font-weight="bold">${customerName}</text>
        
        <text x="50" y="210" fill="#64748b" font-size="12" font-family="system-ui, sans-serif">Công việc hoàn thành:</text>
        <text x="210" y="210" fill="#0056b3" font-size="13" font-family="system-ui, sans-serif" font-weight="bold">${taskTitle} (${period})</text>
        
        <text x="50" y="240" fill="#64748b" font-size="12" font-family="system-ui, sans-serif">Chuyên viên phụ trách:</text>
        <text x="210" y="240" fill="#0f172a" font-size="12" font-family="system-ui, sans-serif">${signerName}</text>
        
        <text x="50" y="270" fill="#64748b" font-size="12" font-family="system-ui, sans-serif">Tình trạng kiểm soát:</text>
        <text x="210" y="270" fill="#15803d" font-size="12" font-family="system-ui, sans-serif" font-weight="bold">✔ Đã kiểm tra đối chiếu sổ cái và nộp tờ khai đúng thời hạn</text>
        
        <!-- Dual Signatures Box -->
        <rect x="50" y="310" width="330" height="120" rx="8" fill="#f8fafc" stroke="#e2e8f0" />
        <text x="215" y="335" fill="#334155" font-size="12" font-family="system-ui, sans-serif" font-weight="bold" text-anchor="middle">ĐẠI DIỆN ĐẠI LÝ THUẾ THÀNH PHỐ</text>
        <text x="215" y="375" fill="#2563eb" font-style="italic" font-size="14" font-family="cursive" text-anchor="middle">${signerName}</text>
        <text x="215" y="415" fill="#64748b" font-size="10" font-family="system-ui, sans-serif" text-anchor="middle">Đã nghiệm thu nội bộ • Ngày ${dateStr}</text>
        
        <rect x="420" y="310" width="330" height="120" rx="8" fill="#f8fafc" stroke="#e2e8f0" />
        <text x="585" y="335" fill="#334155" font-size="12" font-family="system-ui, sans-serif" font-weight="bold" text-anchor="middle">ĐẠI DIỆN KHÁCH HÀNG</text>
        <text x="585" y="375" fill="#059669" font-style="italic" font-size="14" font-family="cursive" text-anchor="middle">Ban Giám Đốc Doanh Nghiệp</text>
        <text x="585" y="415" fill="#64748b" font-size="10" font-family="system-ui, sans-serif" text-anchor="middle">Đã nhận kết quả & hồ sơ thuế</text>
        
        <text x="50" y="465" fill="#94a3b8" font-size="11" font-family="system-ui, sans-serif">Hệ thống Điều hành Nghiệp vụ Đại Lý Thuế Thành Phố • Bằng chứng lưu trữ điện tử</text>
      </svg>
    `;
  }

  const encodedSvg = encodeURIComponent(svgContent.trim());
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;

  return {
    dataUrl,
    name: filename,
    category,
    fileType: 'image/png',
    size: Math.round(encodedSvg.length * 0.75),
    dimensions: { width: 800, height: 520 },
  };
}

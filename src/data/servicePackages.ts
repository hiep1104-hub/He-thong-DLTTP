export interface ServicePackageModule {
  name: string;
  tasks: string[];
}

export interface ServicePackageItem {
  id: string;
  name: string;
  code: string;
  category: string;
  categoryName: string;
  defaultMonthlyFee: number;
  feeDisplay: string;
  feeRange: string;
  targetCustomerDesc: string;
  targetCriteria: string[];
  description: string;
  modules: ServicePackageModule[];
  scopeOfWork: string[];
  notes?: string;
}

export const SERVICE_PACKAGES: ServicePackageItem[] = [
  // =========================================================================
  // NHÓM 1: ĐẠI LÝ THUẾ & KẾ TOÁN TRỌN GÓI (4 GÓI CHUẨN CÔNG TY)
  // =========================================================================
  {
    id: 'PKG-A',
    name: 'GÓI A – CƠ BẢN (Đại lý thuế & Kế toán trọn gói)',
    code: 'GOI_A_CO_BAN',
    category: 'KE_TOAN_THUE_TRON_GOI',
    categoryName: '1. Đại lý thuế & Kế toán trọn gói',
    defaultMonthlyFee: 3000000,
    feeRange: '3.000.000 – 4.500.000 VNĐ/tháng',
    feeDisplay: '3.000.000 – 4.500.000 đ/tháng',
    targetCustomerDesc: 'Doanh nghiệp thương mại, dịch vụ, sản xuất quy mô siêu nhỏ; dưới 80 hóa đơn/tháng; dưới 10 lao động; không sản xuất; 01 kho.',
    targetCriteria: [
      'Doanh nghiệp thương mại, dịch vụ, sản xuất quy mô siêu nhỏ',
      'Dưới 80 hóa đơn/tháng',
      'Dưới 10 lao động',
      'Không sản xuất',
      '01 kho hàng',
    ],
    description: 'Trọn gói kê khai thuế GTGT, TNCN, hạch toán doanh thu chi phí, tiền lương cơ bản, theo dõi 1 kho và báo cáo định kỳ cho DN quy mô siêu nhỏ.',
    modules: [
      {
        name: '1. Thuế',
        tasks: [
          'Tiếp nhận hóa đơn đầu vào, đầu ra',
          'Kiểm tra tính hợp lệ của hóa đơn',
          'Kê khai thuế GTGT',
          'Kê khai thuế TNCN',
          'Nộp tờ khai và hồ sơ thuế điện tử',
          'Theo dõi thông báo từ cơ quan thuế',
        ],
      },
      {
        name: '2. Kế toán',
        tasks: [
          'Hạch toán doanh thu',
          'Hạch toán chi phí',
          'Hạch toán tiền mặt và ngân hàng',
          'Hạch toán công nợ phải thu, phải trả',
          'Ghi sổ kế toán và khóa sổ cuối tháng',
        ],
      },
      {
        name: '3. Tiền lương & BHXH',
        tasks: [
          'Hướng dẫn lập bảng chấm công',
          'Hướng dẫn lập bảng lương',
          'Tính lương phải trả',
          'Tính thuế TNCN từ tiền lương',
          'Lập hồ sơ BHXH phát sinh cơ bản (tăng/giảm lao động)',
        ],
      },
      {
        name: '4. Kho',
        tasks: [
          'Ghi nhận nhập kho',
          'Ghi nhận xuất kho',
          'Theo dõi tồn kho cuối tháng',
        ],
      },
      {
        name: '5. Báo cáo',
        tasks: [
          'Báo cáo doanh thu',
          'Báo cáo chi phí',
          'Báo cáo lợi nhuận',
          'Báo cáo công nợ tổng hợp',
        ],
      },
    ],
    scopeOfWork: [
      '[Thuế] Tiếp nhận, kiểm tra hóa đơn đầu vào, đầu ra',
      '[Thuế] Kê khai thuế GTGT, TNCN & nộp tờ khai điện tử',
      '[Thuế] Theo dõi tiếp nhận thông báo từ cơ quan thuế',
      '[Kế toán] Hạch toán doanh thu, chi phí, tiền mặt và ngân hàng',
      '[Kế toán] Hạch toán công nợ phải thu, phải trả và khóa sổ cuối tháng',
      '[Tiền lương & BHXH] Hướng dẫn chấm công, lập bảng lương, tính thuế TNCN',
      '[Tiền lương & BHXH] Lập hồ sơ BHXH phát sinh cơ bản (tăng/giảm)',
      '[Kho] Ghi nhận nhập kho, xuất kho và theo dõi tồn kho cuối tháng',
      '[Báo cáo] Báo cáo doanh thu, chi phí, lợi nhuận và công nợ tổng hợp',
    ],
  },

  {
    id: 'PKG-B',
    name: 'GÓI B – TRUNG BÌNH (Đại lý thuế & Kế toán trọn gói)',
    code: 'GOI_B_TRUNG_BINH',
    category: 'KE_TOAN_THUE_TRON_GOI',
    categoryName: '1. Đại lý thuế & Kế toán trọn gói',
    defaultMonthlyFee: 5000000,
    feeRange: '5.000.000 – 8.500.000 VNĐ/tháng',
    feeDisplay: '5.000.000 – 8.500.000 đ/tháng',
    targetCustomerDesc: 'Doanh nghiệp thương mại, dịch vụ, sản xuất nhỏ và vừa; dưới 300 hóa đơn/tháng; dưới 30 lao động; 01–02 kho.',
    targetCriteria: [
      'Doanh nghiệp thương mại, dịch vụ, sản xuất nhỏ và vừa',
      'Dưới 300 hóa đơn/tháng',
      'Dưới 30 lao động',
      '01 – 02 kho hàng',
    ],
    description: 'Kiểm tra hóa đơn rủi ro, đối chiếu doanh thu, tính khấu hao TSCĐ, phân bổ chi phí, bảng lương chi tiết BHXH và kiểm soát tồn kho âm.',
    modules: [
      {
        name: '1. Thuế',
        tasks: [
          'Kiểm tra trạng thái hoạt động của nhà cung cấp',
          'Kiểm tra hóa đơn rủi ro',
          'Đối chiếu doanh thu hóa đơn với doanh thu kế toán',
          'Kê khai GTGT, TNCN và các sắc thuế phát sinh',
          'Theo dõi số thuế phải nộp',
          'Xử lý điều chỉnh hóa đơn thông thường',
        ],
      },
      {
        name: '2. Kế toán',
        tasks: [
          'Hạch toán đầy đủ doanh thu, chi phí, tiền, ngân hàng',
          'Hạch toán công nợ chi tiết từng khách hàng, nhà cung cấp',
          'Hạch toán tài sản cố định',
          'Phân bổ chi phí trả trước',
          'Tính khấu hao tài sản cố định',
          'Đối chiếu ngân hàng',
          'Đối chiếu công nợ',
          'Lập bảng cân đối tài khoản',
        ],
      },
      {
        name: '3. Tiền lương & BHXH',
        tasks: [
          'Lập bảng lương hàng tháng',
          'Tính lương, phụ cấp, tăng ca',
          'Tính thuế TNCN tiền lương',
          'Tính các khoản BHXH, BHYT, BHTN',
          'Lập hồ sơ tăng/giảm lao động',
          'Lập hồ sơ điều chỉnh lương BHXH',
          'Đối chiếu công nợ BHXH',
        ],
      },
      {
        name: '4. Kho',
        tasks: [
          'Đối chiếu nhập – xuất – tồn',
          'Kiểm tra tồn kho theo từng mặt hàng',
          'Kiểm tra tồn kho âm',
          'Kiểm tra giá vốn hàng bán',
          'Lập báo cáo nhập xuất tồn',
        ],
      },
      {
        name: '5. Báo cáo',
        tasks: [
          'Báo cáo doanh thu theo khách hàng',
          'Báo cáo chi phí theo nhóm',
          'Báo cáo lợi nhuận gộp',
          'Báo cáo dòng tiền cơ bản',
          'Báo cáo công nợ phải thu, phải trả',
          'Báo cáo tồn kho chi tiết',
        ],
      },
    ],
    scopeOfWork: [
      '[Thuế] Kiểm tra NCC rủi ro, đối chiếu doanh thu, kê khai các sắc thuế phát sinh',
      '[Kế toán] Hạch toán chi tiết, phân bổ chi phí, tính khấu hao TSCĐ, đối chiếu ngân hàng & lập Bảng CĐTK',
      '[Tiền lương & BHXH] Lập bảng lương, tính phụ cấp/tăng ca, hồ sơ tăng giảm & đối chiếu công nợ BHXH',
      '[Kho] Đối chiếu nhập-xuất-tồn, kiểm tra tồn kho âm & kiểm soát giá vốn hàng bán',
      '[Báo cáo] Báo cáo doanh thu theo KH, chi phí theo nhóm, lợi nhuận gộp, dòng tiền cơ bản & tồn kho chi tiết',
    ],
  },

  {
    id: 'PKG-C',
    name: 'GÓI C – PHỨC TẠP (Đại lý thuế & Kế toán trọn gói)',
    code: 'GOI_C_PHUC_TAP',
    category: 'KE_TOAN_THUE_TRON_GOI',
    categoryName: '1. Đại lý thuế & Kế toán trọn gói',
    defaultMonthlyFee: 9000000,
    feeRange: '9.000.000 – 18.000.000 VNĐ/tháng',
    feeDisplay: '9.000.000 – 18.000.000 đ/tháng',
    targetCustomerDesc: 'Sản xuất, xây dựng, logistics, TMĐT, xuất nhập khẩu; nhiều kho; trên 300 hóa đơn/tháng.',
    targetCriteria: [
      'Doanh nghiệp sản xuất, xây dựng, logistics, TMĐT, xuất nhập khẩu',
      'Nhiều kho hàng',
      'Trên 300 hóa đơn/tháng',
    ],
    description: 'Tính giá thành sản xuất/công trình, giá vốn FIFO/Bình quân, đối chiếu sàn TMĐT/cổng thanh toán, kế hoạch thuế, giải trình CQT và Dashboard quản trị.',
    modules: [
      {
        name: '1. Thuế',
        tasks: [
          'Rà soát toàn bộ hồ sơ thuế',
          'Đối chiếu doanh thu – hóa đơn – ngân hàng',
          'Theo dõi thuế GTGT, TNCN, TNDN',
          'Lập kế hoạch nghĩa vụ thuế',
          'Tư vấn chi phí hợp lệ',
          'Chuẩn bị hồ sơ giải trình thông báo thuế',
          'Hỗ trợ làm việc với cơ quan thuế trong các vấn đề phát sinh thông thường',
        ],
      },
      {
        name: '2. Kế toán',
        tasks: [
          'Hạch toán toàn bộ nghiệp vụ phát sinh',
          'Hạch toán theo công trình, dự án hoặc đơn hàng',
          'Tính giá vốn theo FIFO/Bình quân',
          'Tính giá thành sản xuất',
          'Theo dõi nhiều kho',
          'Đối chiếu sàn TMĐT và cổng thanh toán',
          'Đối chiếu ngân hàng nâng cao',
          'Lập báo cáo quản trị theo bộ phận',
        ],
      },
      {
        name: '3. Tiền lương & BHXH',
        tasks: [
          'Quản lý hồ sơ lao động',
          'Lập bảng lương',
          'Tính lương, thưởng, hoa hồng',
          'Tính BHXH, BHYT, BHTN',
          'Lập hồ sơ tăng/giảm/điều chỉnh BHXH',
          'Lập hồ sơ ốm đau, thai sản, nghỉ việc',
          'Đối chiếu cơ quan BHXH',
          'Lập báo cáo lao động định kỳ',
        ],
      },
      {
        name: '4. Kho',
        tasks: [
          'Quản lý nhiều kho',
          'Kiểm tra chuyển kho',
          'Kiểm tra định mức vật tư',
          'Kiểm tra hao hụt',
          'Phân tích tồn kho chậm luân chuyển',
          'Phân tích vòng quay tồn kho',
        ],
      },
      {
        name: '5. Báo cáo',
        tasks: [
          'Báo cáo kết quả kinh doanh',
          'Báo cáo dòng tiền chi tiết',
          'Báo cáo lợi nhuận theo sản phẩm',
          'Báo cáo lợi nhuận theo công trình',
          'Báo cáo hiệu quả tồn kho',
          'Dashboard quản trị hàng tháng',
        ],
      },
    ],
    scopeOfWork: [
      '[Thuế] Lập kế hoạch thuế, tư vấn chi phí hợp lệ, giải trình thông báo CQT',
      '[Kế toán] Tính giá thành sản xuất/công trình, giá vốn FIFO, đối chiếu sàn TMĐT & cổng thanh toán',
      '[Tiền lương & BHXH] Tính lương thưởng/hoa hồng, giải quyết chế độ ốm đau/thai sản & báo cáo lao động',
      '[Kho] Quản lý nhiều kho, kiểm soát định mức vật tư, hao hụt & phân tích vòng quay tồn kho',
      '[Báo cáo] Báo cáo KQKD, dòng tiền chi tiết, lợi nhuận theo sản phẩm/công trình & Dashboard quản trị',
    ],
  },

  {
    id: 'PKG-D',
    name: 'GÓI D – ĐẶC BIỆT (Đại lý thuế & Kế toán trọn gói)',
    code: 'GOI_D_DAC_BIET',
    category: 'KE_TOAN_THUE_TRON_GOI',
    categoryName: '1. Đại lý thuế & Kế toán trọn gói',
    defaultMonthlyFee: 20000000,
    feeRange: 'Từ 20.000.000 VNĐ/tháng',
    feeDisplay: 'Từ 20.000.000 đ/tháng',
    targetCustomerDesc: 'FDI, nhiều chi nhánh, hợp nhất báo cáo; trên 1.000 hóa đơn/tháng.',
    targetCriteria: [
      'Doanh nghiệp FDI, đa chi nhánh, tập đoàn',
      'Hợp nhất báo cáo tài chính',
      'Trên 1.000 hóa đơn/tháng',
    ],
    description: 'Quản trị toàn bộ hệ thống thuế, tái cấu trúc & giao dịch liên kết, chuẩn hóa ERP kế toán, hợp nhất BCTC đa chi nhánh, quản trị ngân sách và dòng tiền cấp cao.',
    modules: [
      {
        name: '1. Thuế',
        tasks: [
          'Quản trị toàn bộ hệ thống thuế doanh nghiệp',
          'Rà soát thuế định kỳ',
          'Lập kế hoạch thuế',
          'Chuẩn bị hồ sơ quyết toán thuế',
          'Đại diện giải trình với cơ quan thuế',
          'Tư vấn tái cấu trúc thuế và giao dịch liên kết',
        ],
      },
      {
        name: '2. Kế toán',
        tasks: [
          'Tổ chức và chuẩn hóa hệ thống kế toán',
          'Hợp nhất báo cáo tài chính',
          'Chuẩn hóa quy trình kế toán',
          'Thiết lập ERP kế toán',
          'Quản trị ngân sách',
          'Quản trị dòng tiền',
          'Phân tích hiệu quả tài chính doanh nghiệp',
        ],
      },
      {
        name: '3. Tiền lương & BHXH',
        tasks: [
          'Quản lý toàn bộ hồ sơ lao động',
          'Lập bảng lương nhiều đơn vị',
          'Quản lý BHXH toàn hệ thống',
          'Quyết toán thuế TNCN năm',
          'Xây dựng chính sách tiền lương và KPI',
          'Hỗ trợ thanh tra BHXH',
        ],
      },
      {
        name: '4. Kho',
        tasks: [
          'Kiểm soát nhiều kho và nhiều chi nhánh',
          'Kiểm kê định kỳ',
          'Kiểm soát định mức',
          'Kiểm soát hao hụt',
          'Kiểm soát vòng quay vốn lưu động',
        ],
      },
      {
        name: '5. Báo cáo',
        tasks: [
          'Bộ báo cáo tài chính quản trị',
          'Báo cáo theo chi nhánh',
          'Báo cáo theo phòng ban',
          'Báo cáo theo dự án',
          'Dự báo dòng tiền',
          'Dự báo lợi nhuận',
          'Báo cáo trình Ban Giám đốc',
        ],
      },
    ],
    scopeOfWork: [
      '[Thuế] Quản trị toàn bộ hệ thống thuế, tái cấu trúc & giao dịch liên kết, đại diện giải trình CQT',
      '[Kế toán] Tổ chức hệ thống kế toán, hợp nhất BCTC, thiết lập ERP, quản trị ngân sách & dòng tiền',
      '[Tiền lương & BHXH] Bảng lương đa chi nhánh, quản lý BHXH toàn hệ thống, chính sách lương & KPI',
      '[Kho] Kiểm soát đa kho, đa chi nhánh, kiểm kê định kỳ & vòng quay vốn lưu động',
      '[Báo cáo] Bộ BCTC quản trị, báo cáo theo chi nhánh/phòng ban/dự án, dự báo dòng tiền & trình BGĐ',
    ],
  },

  {
    id: 'PKG-HKD',
    name: 'Gói Kế toán & Đại lý thuế Hộ kinh doanh (Thông tư 152/2025/TT-BTC)',
    code: 'GOI_HO_KINH_DOANH',
    category: 'KE_TOAN_THUE_TRON_GOI',
    categoryName: '1. Đại lý thuế & Kế toán trọn gói',
    defaultMonthlyFee: 1500000,
    feeRange: '1.200.000 – 3.500.000 VNĐ/tháng',
    feeDisplay: '1.500.000 đ/tháng (Phân nhóm 1-4)',
    targetCustomerDesc: 'Cửa hàng bán lẻ, hộ kinh doanh cá thể, chuỗi ăn uống, dịch vụ nộp thuế theo phương pháp kê khai hoặc chuyển đổi từ hộ khoán theo TT 152/2025/TT-BTC.',
    targetCriteria: [
      'Hộ kinh doanh cá thể, cửa hàng nộp thuế theo phương pháp kê khai',
      'Tuân thủ Thông tư 152/2025/TT-BTC (thay thế TT 88/2021)',
      'Phân loại 4 nhóm doanh thu: < 1 tỷ, 1 - 3 tỷ, 3 - 30 tỷ, > 30 tỷ',
      'Hóa đơn điện tử máy tính tiền / có mã cơ quan thuế',
    ],
    description: 'Trọn gói kê khai thuế định kỳ Quý/Tháng, lập hệ thống 4 - 7 mẫu sổ kế toán theo TT 152/2025/TT-BTC, theo dõi doanh thu thực tế, rà soát chứng từ không dùng tiền mặt và quyết toán nghĩa vụ thuế.',
    modules: [
      {
        name: '1. Kê khai thuế HKD',
        tasks: [
          'Kiểm tra hóa đơn đầu vào, đầu ra HĐĐT máy tính tiền',
          'Lập tờ khai thuế môn bài / thuế GTGT & TNCN theo Quý/Tháng',
          'Theo dõi nộp thuế điện tử qua eTax Mobile / Cổng Dịch vụ công',
          'Rà soát ngưỡng doanh thu theo từng nhóm quy định',
        ],
      },
      {
        name: '2. Sổ sách kế toán TT 152/2025/TT-BTC',
        tasks: [
          'Lập Sổ chi tiết doanh thu bán hàng hóa, dịch vụ (Mẫu S1-HKD)',
          'Lập Sổ chi tiết vật liệu, dụng cụ, sản phẩm, hàng hóa (Mẫu S2-HKD)',
          'Lập Sổ chi phí sản xuất, kinh doanh (Mẫu S3-HKD)',
          'Lập Sổ theo dõi tình hình thực hiện nghĩa vụ thuế (Mẫu S4-HKD)',
          'Lập Sổ theo dõi tiền lương/nhân công & tiền gửi ngân hàng (với Nhóm 3, 4)',
        ],
      },
      {
        name: '3. Hóa đơn & Tuân thủ pháp lý',
        tasks: [
          'Đối chiếu chứng từ thanh toán không dùng tiền mặt > 5 triệu đồng',
          'Kiểm soát nhà cung cấp rủi ro & hợp lệ hóa đơn',
          'Lưu trữ hồ sơ chứng từ kế toán HKD theo quy định',
        ],
      },
    ],
    scopeOfWork: [
      '[Thuế] Kê khai thuế GTGT, TNCN theo Quý/Tháng và thông báo số thuế phải nộp qua eTax Mobile',
      '[Sổ sách] Lập hoàn chỉnh hệ thống sổ kế toán theo TT 152/2025/TT-BTC tương ứng nhóm doanh thu',
      '[Hóa đơn] Kiểm soát HĐĐT khởi tạo từ máy tính tiền & đối chiếu hạn mức không dùng tiền mặt',
    ],
  },

  // =========================================================================
  // NHÓM 2: KẾ TOÁN – THUẾ & GIẢI TRÌNH THANH TRA (THEO BẢNG GIÁ PHÁT SINH)
  // =========================================================================
  {
    id: 'PKG-KT-01',
    name: 'Kê khai bổ sung nhiều kỳ & Điều chỉnh BCTC',
    code: 'KE_KHAI_BO_SUNG_BCTC',
    category: 'KE_TOAN_THUE_PHAT_SINH',
    categoryName: '2. Kế toán – Thuế & Giải trình thanh tra',
    defaultMonthlyFee: 5000000,
    feeRange: '5.000.000 – 6.000.000 VNĐ/vụ việc (năm)',
    feeDisplay: '5.000.000 đ/vụ việc',
    targetCustomerDesc: 'Doanh nghiệp phát hiện sai sót số liệu thuế các kỳ trước hoặc cần nộp lại Báo cáo tài chính năm.',
    targetCriteria: ['Phát sinh sai sót tờ khai thuế', 'Cần điều chỉnh BCTC'],
    description: 'Kê khai bổ sung KHBS tờ khai GTGT/TNCN/TNDN nhiều kỳ, lập lại BCTC điều chỉnh và nộp cơ quan thuế.',
    modules: [
      {
        name: 'Hạng mục thực hiện',
        tasks: [
          'Rà soát xác định nguyên nhân và quy mô chênh lệch số liệu thuế',
          'Lập hồ sơ khai bổ sung KHBS kèm bản giải trình từng kỳ',
          'Lập lại bộ Báo cáo tài chính điều chỉnh theo thông tư kế toán hiện hành',
          'Nộp hồ sơ điện tử và hướng dẫn nộp tiền phạt chậm nộp (nếu có)',
        ],
      },
    ],
    scopeOfWork: [
      'Kê khai bổ sung nhiều kỳ (5.000.000 đ/vụ việc)',
      'Điều chỉnh Báo cáo tài chính (6.000.000 đ/năm)',
      'Lập bản giải trình khai bổ sung KHBS và tính tiền nộp chậm',
    ],
    notes: 'Giá áp dụng cho doanh nghiệp dưới 300 hóa đơn/tháng. Trường hợp nhiều năm/nhiều kho sẽ báo giá riêng.',
  },

  {
    id: 'PKG-KT-02',
    name: 'Quyết toán thuế TNDN, TNCN năm & Hoàn tất nghĩa vụ thuế',
    code: 'QUYET_TOAN_NAM',
    category: 'KE_TOAN_THUE_PHAT_SINH',
    categoryName: '2. Kế toán – Thuế & Giải trình thanh tra',
    defaultMonthlyFee: 6000000,
    feeRange: '3.000.000 – 8.000.000 VNĐ',
    feeDisplay: '6.000.000 đ/năm',
    targetCustomerDesc: 'Doanh nghiệp quyết toán năm hoặc đóng cửa/chuyển đổi cần chốt toàn bộ nghĩa vụ thuế.',
    targetCriteria: ['Quyết toán thuế năm', 'Chốt nghĩa vụ thuế'],
    description: 'Lập hồ sơ Quyết toán thuế TNDN, Quyết toán thuế TNCN cuối năm và hồ sơ hoàn tất nghĩa vụ thuế với CQT.',
    modules: [
      {
        name: 'Hạng mục thực hiện',
        tasks: [
          'Quyết toán thuế TNCN năm (3.000.000 đ/năm)',
          'Quyết toán thuế TNDN năm (6.000.000 đ/năm)',
          'Hoàn tất nghĩa vụ thuế (8.000.000 đ/vụ việc)',
          'Xin xác nhận không nợ thuế (1.000.000 đ) & Hoàn thành NV thuế (2.000.000 đ)',
        ],
      },
    ],
    scopeOfWork: [
      'Quyết toán thuế TNCN năm: 3.000.000 đ/năm',
      'Quyết toán thuế TNDN năm: 6.000.000 đ/năm',
      'Hoàn tất nghĩa vụ thuế: 8.000.000 đ/vụ việc',
      'Xin xác nhận không nợ thuế: 1.000.000 đ/hồ sơ',
      'Xin xác nhận hoàn thành nghĩa vụ thuế: 2.000.000 đ/hồ sơ',
    ],
    notes: 'Giá chưa bao gồm phí bên thứ ba.',
  },

  {
    id: 'PKG-KT-03',
    name: 'Xử lý Mã số thuế bị đóng, Cưỡng chế & Khóa hóa đơn điện tử',
    code: 'XU_LY_RUI_RO_THUE',
    category: 'KE_TOAN_THUE_PHAT_SINH',
    categoryName: '2. Kế toán – Thuế & Giải trình thanh tra',
    defaultMonthlyFee: 10000000,
    feeRange: '8.000.000 – 15.000.000 VNĐ/vụ việc',
    feeDisplay: '10.000.000 đ/vụ việc',
    targetCustomerDesc: 'Doanh nghiệp bị cơ quan thuế khóa MST, cưỡng chế tài khoản hoặc tạm chặn quyền xuất HĐĐT.',
    targetCriteria: ['Bị đóng MST', 'Bị chặn HĐĐT', 'Bị cưỡng chế thuế'],
    description: 'Xử lý mở lại MST do bỏ địa chỉ, giải tỏa cưỡng chế thuế tài khoản ngân hàng và mở lại quyền xuất hóa đơn.',
    modules: [
      {
        name: 'Hạng mục xử lý',
        tasks: [
          'Mở mã số thuế bị đóng do bỏ địa chỉ (10.000.000 đ/vụ việc)',
          'Mở quyền sử dụng hóa đơn điện tử (8.000.000 đ/vụ việc)',
          'Xử lý chặn hóa đơn điện tử (15.000.000 đ/vụ việc)',
          'Xử lý cưỡng chế thuế tài khoản/hóa đơn (15.000.000 đ/vụ việc)',
          'Xử lý hóa đơn sai sót điều chỉnh/thay thế (1.500.000 đ/hóa đơn)',
        ],
      },
    ],
    scopeOfWork: [
      'Mở mã số thuế bị đóng do bỏ địa chỉ: 10.000.000 đ/vụ việc',
      'Mở quyền sử dụng hóa đơn điện tử: 8.000.000 đ/vụ việc',
      'Xử lý chặn hóa đơn điện tử: 15.000.000 đ/vụ việc',
      'Xử lý cưỡng chế thuế: 15.000.000 đ/vụ việc',
      'Xử lý hóa đơn sai sót (điều chỉnh/thay thế): 1.500.000 đ/hóa đơn',
    ],
  },

  {
    id: 'PKG-KT-04',
    name: 'Giải trình Thanh tra Thuế, Hóa đơn rủi ro & Dịch vụ Hoàn thuế GTGT',
    code: 'THANH_TRA_HOAN_THUE',
    category: 'KE_TOAN_THUE_PHAT_SINH',
    categoryName: '2. Kế toán – Thuế & Giải trình thanh tra',
    defaultMonthlyFee: 20000000,
    feeRange: '15.000.000 – 20.000.000 VNĐ (Hoàn thuế: 5–8%)',
    feeDisplay: '20.000.000 đ/vụ việc',
    targetCustomerDesc: 'Doanh nghiệp nhận thông báo giải trình hóa đơn rủi ro, quyết định thanh tra hoặc làm hồ sơ hoàn thuế.',
    targetCriteria: ['Thanh tra thuế', 'Hóa đơn rủi ro', 'Hoàn thuế GTGT'],
    description: 'Chuyên gia Đại lý thuế trực tiếp bảo vệ số liệu thanh tra, giải trình hóa đơn NCC rủi ro và làm hồ sơ hoàn thuế GTGT.',
    modules: [
      {
        name: 'Hạng mục thực hiện',
        tasks: [
          'Giải trình thanh tra, kiểm tra thuế tại trụ sở (20.000.000 đ/vụ việc)',
          'Giải trình hóa đơn rủi ro theo thông báo CQT (15.000.000 đ/vụ việc)',
          'Dịch vụ Hoàn thuế GTGT xuất khẩu/dự án đầu tư (5–8% giá trị hoàn)',
        ],
      },
    ],
    scopeOfWork: [
      'Giải trình thanh tra, kiểm tra thuế: 20.000.000 đ/vụ việc',
      'Giải trình hóa đơn rủi ro: 15.000.000 đ/vụ việc',
      'Hoàn thuế GTGT: 5–8% giá trị hoàn',
    ],
  },

  // =========================================================================
  // NHÓM 3: TIỀN LƯƠNG, BHXH & LAO ĐỘNG (THEO BẢNG GIÁ PHÁT SINH)
  // =========================================================================
  {
    id: 'PKG-NS-01',
    name: 'Thủ tục BHXH, Chốt sổ, Thai sản & Quyết toán Thanh tra BHXH',
    code: 'THU_TUC_BHXH_PHAT_SINH',
    category: 'TIEN_LUONG_BHXH_PHAT_SINH',
    categoryName: '3. Tiền lương, BHXH & Lao động',
    defaultMonthlyFee: 2000000,
    feeRange: '150.000 – 10.000.000 VNĐ/thủ tục',
    feeDisplay: 'Theo biểu phí từng thủ tục',
    targetCustomerDesc: 'Doanh nghiệp đăng ký mới BHXH, báo tăng/giảm nhân sự, giải quyết chế độ ốm đau/thai sản hoặc thanh tra BHXH.',
    targetCriteria: ['Đăng ký mới BHXH', 'Thủ tục tăng giảm BHXH', 'Thanh tra BHXH'],
    description: 'Trọn gói thủ tục hồ sơ bảo hiểm xã hội điện tử, chốt sổ, chế độ ốm đau thai sản và đại diện làm việc khi thanh tra BHXH.',
    modules: [
      {
        name: 'Chi tiết biểu phí thủ tục BHXH',
        tasks: [
          'Đăng ký mới BHXH cho doanh nghiệp: 2.000.000 đ/lần',
          'Tăng lao động BHXH: 150.000 đ/người/lần',
          'Giảm lao động BHXH: 150.000 đ/người/lần',
          'Điều chỉnh mức đóng BHXH: 300.000 đ/lần',
          'Chốt sổ BHXH: 500.000 đ/người/lần',
          'Hồ sơ thai sản, ốm đau, dưỡng sức: 500.000 đ/hồ sơ',
          'Quyết toán BHXH khi thanh tra: 10.000.000 đ/vụ việc',
        ],
      },
    ],
    scopeOfWork: [
      'Đăng ký mới BHXH cho doanh nghiệp: 2.000.000 đ (phát sinh từng lần)',
      'Tăng lao động BHXH: 150.000 đ/người/lần',
      'Giảm lao động BHXH: 150.000 đ/người/lần',
      'Điều chỉnh mức đóng BHXH: 300.000 đ/lần',
      'Chốt sổ BHXH: 500.000 đ/người/lần',
      'Hồ sơ thai sản, ốm đau, dưỡng sức: 500.000 đ/hồ sơ',
      'Quyết toán BHXH khi thanh tra: 10.000.000 đ/vụ việc',
    ],
    notes: 'Giá chưa bao gồm phí bên thứ ba và tiền đóng bảo hiểm theo luật định.',
  },

  // =========================================================================
  // NHÓM 4: PHÁP LÝ DOANH NGHIỆP & ĐĂNG KÝ KINH DOANH (THEO BẢNG GIÁ PHÁT SINH)
  // =========================================================================
  {
    id: 'PKG-PL-01',
    name: 'Thay đổi Đăng ký kinh doanh (Địa chỉ, ĐDPL, Vốn, Ngành nghề, Tên)',
    code: 'THAY_DOI_DKKD_TRON_GOI',
    category: 'PHAP_LY_DOANH_NGHIEP_PHAT_SINH',
    categoryName: '4. Pháp lý doanh nghiệp & Giấy phép',
    defaultMonthlyFee: 2000000,
    feeRange: '2.000.000 – 2.500.000 VNĐ/lần',
    feeDisplay: '2.000.000 đ/lần',
    targetCustomerDesc: 'Doanh nghiệp thay đổi địa chỉ, giám đốc/ĐDPL, tăng/giảm vốn điều lệ, đổi tên hoặc ngành nghề.',
    targetCriteria: ['Thay đổi thông tin ĐKKD', 'Đổi tên/địa chỉ/vốn/ngành nghề'],
    description: 'Soạn thảo hồ sơ, nộp Sở KH&ĐT, nhận Giấy chứng nhận ĐKDN mới và cập nhật cơ quan Thuế.',
    modules: [
      {
        name: 'Biểu phí thay đổi ĐKKD',
        tasks: [
          'Thay đổi địa chỉ trụ sở: 2.000.000 đ/lần',
          'Thay đổi người đại diện pháp luật: 2.000.000 đ/lần',
          'Thay đổi vốn điều lệ: 2.000.000 đ/lần',
          'Bổ sung/thay đổi ngành nghề kinh doanh: 2.000.000 đ/lần',
          'Thay đổi tên doanh nghiệp: 2.500.000 đ/lần',
        ],
      },
    ],
    scopeOfWork: [
      'Thay đổi địa chỉ trụ sở: 2.000.000 đ (phát sinh từng lần)',
      'Thay đổi người đại diện pháp luật: 2.000.000 đ (phát sinh từng lần)',
      'Thay đổi vốn điều lệ: 2.000.000 đ (phát sinh từng lần)',
      'Bổ sung/thay đổi ngành nghề kinh doanh: 2.000.000 đ (phát sinh từng lần)',
      'Thay đổi tên doanh nghiệp: 2.500.000 đ (phát sinh từng lần)',
    ],
    notes: 'Giá chưa bao gồm phí nhà nước, công bố thông tin, phí chữ ký số, hóa đơn điện tử.',
  },

  {
    id: 'PKG-PL-02',
    name: 'Chi nhánh, Địa điểm kinh doanh, Tạm ngừng & Giải thể Doanh nghiệp',
    code: 'CHI_NHANH_GIAI_THE_DN',
    category: 'PHAP_LY_DOANH_NGHIEP_PHAT_SINH',
    categoryName: '4. Pháp lý doanh nghiệp & Giấy phép',
    defaultMonthlyFee: 3500000,
    feeRange: '2.000.000 – 15.000.000 VNĐ/thủ tục',
    feeDisplay: 'Theo biểu phí từng thủ tục',
    targetCustomerDesc: 'Doanh nghiệp mở rộng/thu hẹp mạng lưới hoặc giải thể, tạm ngừng kinh doanh.',
    targetCriteria: ['Thành lập chi nhánh/ĐĐKD', 'Đóng chi nhánh', 'Giải thể DN'],
    description: 'Thành lập & đóng chi nhánh/địa điểm kinh doanh, thủ tục tạm ngừng/hoạt động trở lại và giải thể DN trọn gói.',
    modules: [
      {
        name: 'Biểu phí thủ tục tổ chức DN',
        tasks: [
          'Thành lập chi nhánh: 3.500.000 đ/lần',
          'Thành lập địa điểm kinh doanh: 2.000.000 đ/lần',
          'Đóng chi nhánh/địa điểm kinh doanh: 3.000.000 đ/lần',
          'Tạm ngừng hoạt động doanh nghiệp: 2.000.000 đ/lần',
          'Hoạt động trở lại: 2.000.000 đ/lần',
          'Giải thể doanh nghiệp (thủ tục pháp lý): 15.000.000 đ/lần',
        ],
      },
    ],
    scopeOfWork: [
      'Thành lập chi nhánh: 3.500.000 đ/lần',
      'Thành lập địa điểm kinh doanh: 2.000.000 đ/lần',
      'Đóng chi nhánh/địa điểm kinh doanh: 3.000.000 đ/lần',
      'Tạm ngừng hoạt động doanh nghiệp: 2.000.000 đ/lần',
      'Hoạt động trở lại: 2.000.000 đ/lần',
      'Giải thể doanh nghiệp (thủ tục pháp lý): 15.000.000 đ/lần',
    ],
  },

  // =========================================================================
  // NHÓM 5: KHAI THUẾ CHO THUÊ TÀI SẢN & THIẾT LẬP PHẦN MỀM KẾ TOÁN
  // =========================================================================
  {
    id: 'PKG-TS-01',
    name: 'Kê khai Thuế Cho thuê Tài sản (Nhà, Xưởng, Kho bãi, Đất & Máy móc)',
    code: 'KHAI_THUE_CHO_THUE_TAI_SAN',
    category: 'CHO_THUE_TAI_SAN_PHAN_MEM',
    categoryName: '5. Khai thuế Cho thuê tài sản & Thiết lập phần mềm',
    defaultMonthlyFee: 1500000,
    feeRange: '1.000.000 – 3.000.000 VNĐ/hồ sơ',
    feeDisplay: '1.500.000 đ/hồ sơ',
    targetCustomerDesc: 'Cá nhân, hộ gia đình hoặc tổ chức có tài sản cho thuê (nhà, văn phòng, xưởng, kho, đất, máy móc, phương tiện).',
    targetCriteria: ['Cho thuê nhà/xưởng/mặt bằng', 'Cho thuê phương tiện/máy móc'],
    description: 'Kê khai thuế GTGT, TNCN cho thuê tài sản theo từng hợp đồng, hồ sơ điều chỉnh, chấm dứt hợp đồng và giải trình thuế.',
    modules: [
      {
        name: 'Biểu phí dịch vụ thuế cho thuê tài sản',
        tasks: [
          'Khai thuế cho thuê nhà/căn hộ (01 hợp đồng, 01 năm): 1.000.000 đ/hồ sơ',
          'Khai thuế cho thuê văn phòng, nhà xưởng, kho bãi: 1.500.000 đ/hồ sơ',
          'Khai thuế cho thuê đất, mặt bằng kinh doanh: 1.500.000 đ/hồ sơ',
          'Khai thuế cho thuê phương tiện, máy móc, thiết bị: 1.500.000 đ/hồ sơ',
          'Khai thuế nhiều hợp đồng cho thuê (từ 02–05 hợp đồng): 2.000.000 đ/hồ sơ',
          'Khai thuế trên 05 hợp đồng cho thuê: Báo giá riêng theo hồ sơ',
          'Kê khai bổ sung/điều chỉnh hồ sơ cho thuê tài sản: 1.000.000 đ/hồ sơ',
          'Chấm dứt hợp đồng cho thuê và điều chỉnh nghĩa vụ thuế: 1.000.000 đ/hồ sơ',
          'Giải trình hồ sơ thuế cho thuê tài sản với CQT: 3.000.000 đ/vụ việc',
          'Xin hoàn thuế hoặc xử lý nộp thừa thuế cho thuê tài sản: 3.000.000 đ/hồ sơ',
        ],
      },
    ],
    scopeOfWork: [
      'Khai thuế cho thuê nhà/căn hộ (01 HĐ, 01 năm): 1.000.000 đ/hồ sơ',
      'Khai thuế cho thuê VP, nhà xưởng, kho bãi: 1.500.000 đ/hồ sơ',
      'Khai thuế cho thuê đất, mặt bằng kinh doanh: 1.500.000 đ/hồ sơ',
      'Khai thuế cho thuê phương tiện, máy móc: 1.500.000 đ/hồ sơ',
      'Khai thuế từ 02–05 hợp đồng: 2.000.000 đ/hồ sơ',
      'Kê khai bổ sung/điều chỉnh hồ sơ: 1.000.000 đ/hồ sơ',
      'Chấm dứt HĐ & điều chỉnh nghĩa vụ thuế: 1.000.000 đ/hồ sơ',
      'Giải trình hồ sơ thuế cho thuê tài sản: 3.000.000 đ/vụ việc',
      'Xin hoàn thuế / xử lý nộp thừa: 3.000.000 đ/hồ sơ',
    ],
    notes: 'Phí áp dụng cho hồ sơ thông thường. Trường hợp có yếu tố nước ngoài, đồng sở hữu, ủy quyền nhiều bên sẽ báo giá riêng.',
  },

  {
    id: 'PKG-PM-01',
    name: 'Thiết lập Hệ thống Kế toán, Phần mềm & Chuyển đổi Số dư',
    code: 'THIET_LAP_PHAN_MEM_KETOAN',
    category: 'CHO_THUE_TAI_SAN_PHAN_MEM',
    categoryName: '5. Khai thuế Cho thuê tài sản & Thiết lập phần mềm',
    defaultMonthlyFee: 3000000,
    feeRange: '1.500.000 – 3.000.000 VNĐ/doanh nghiệp',
    feeDisplay: '3.000.000 đ/doanh nghiệp',
    targetCustomerDesc: 'Doanh nghiệp bắt đầu sử dụng phần mềm kế toán mới (MISA, Fast, Bravo...) hoặc cần chuyển giao dữ liệu.',
    targetCriteria: ['Triển khai phần mềm kế toán mới', 'Chuyển đổi số dư kế toán'],
    description: 'Khởi tạo hệ thống tài khoản kế toán, danh mục hạch toán, nhập số dư đầu kỳ, chuẩn hóa quy trình hóa đơn và rà soát dữ liệu.',
    modules: [
      {
        name: 'Hạng mục triển khai phần mềm',
        tasks: [
          'Thiết lập hệ thống tài khoản kế toán: 2.000.000 đ/doanh nghiệp',
          'Thiết lập danh mục hạch toán trên phần mềm: 1.500.000 đ/doanh nghiệp',
          'Chuyển số dư đầu kỳ vào phần mềm kế toán: 3.000.000 đ/doanh nghiệp',
          'Thiết lập quy trình hóa đơn – kế toán – thuế trên phần mềm: 3.000.000 đ/doanh nghiệp',
          'Rà soát dữ liệu sau khi chuyển đổi phần mềm: 3.000.000 đ/doanh nghiệp',
        ],
      },
    ],
    scopeOfWork: [
      'Thiết lập hệ thống tài khoản kế toán: 2.000.000 đ/doanh nghiệp',
      'Thiết lập danh mục hạch toán trên phần mềm: 1.500.000 đ/doanh nghiệp',
      'Chuyển số dư đầu kỳ vào phần mềm kế toán: 3.000.000 đ/doanh nghiệp',
      'Thiết lập quy trình hóa đơn – kế toán – thuế: 3.000.000 đ/doanh nghiệp',
      'Rà soát dữ liệu sau khi chuyển đổi phần mềm: 3.000.000 đ/doanh nghiệp',
    ],
  },
];

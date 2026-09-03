import { EmployeeProfile, LeaveRequest, PayrollRecord, HRWorkflowSOP, BusinessTrip } from '../types';

/**
 * Danh sách Nhân Sự Nội Bộ của Công Ty Đại Lý Thuế & Dịch Vụ Kế Toán (Sạch, không có dữ liệu demo)
 */
export const INITIAL_EMPLOYEES: EmployeeProfile[] = [];

/**
 * 8 Quy Trình Quản Trị & Nghiệp Vụ Nhân Sự - Tiền Lương - BHXH Chuẩn Hóa
 */
export const HR_WORKFLOW_SOPS: HRWorkflowSOP[] = [
  {
    id: 'HR-SOP-01',
    code: 'QT-NS-01',
    title: 'Quy trình Tiếp nhận nhân sự mới (Onboarding)',
    category: 'ONBOARDING',
    categoryName: '1. Tiếp Nhận & Khai Trình Lao Động',
    description: 'Quy trình chuẩn từ khi ứng viên trúng tuyển, ký hợp đồng thử việc/HĐLĐ, thu thập hồ sơ nhân sự đến đăng ký MST cá nhân và khai trình sử dụng lao động với Sở/Phòng LĐ-TB&XH.',
    legalBasis: 'Điều 12, 13, 20 Bộ luật Lao động 2019 số 45/2019/QH14 & Nghị định 145/2020/NĐ-CP',
    estimatedDays: 3,
    steps: [
      { order: 1, name: 'Thu thập & Kiểm tra tính hợp lệ của Hồ sơ nhân sự (CCCD, Sơ yếu lý lịch, Bằng cấp, Giấy khám sức khỏe)', role: 'Chuyên viên HCNS', isMandatory: true, requiredDocument: 'File scan CCCD & Bằng cấp' },
      { order: 2, name: 'Soạn thảo & Trình ký Hợp đồng thử việc hoặc Hợp đồng lao động chính thức', role: 'Chuyên viên HCNS', isMandatory: true, requiredDocument: 'HĐLĐ đã ký 2 bên' },
      { order: 3, name: 'Kê khai & Đăng ký Mã số thuế cá nhân mới (nếu chưa có MST)', role: 'Kế toán viên', isMandatory: true, requiredDocument: 'Thông báo cấp MST của CQT' },
      { order: 4, name: 'Cập nhật danh sách trích ngang & Khai trình sử dụng lao động định kỳ', role: 'Chuyên viên HCNS', isMandatory: true, requiredDocument: 'Mẫu 01/PLI-NĐ145' },
      { order: 5, name: 'Bàn giao tài khoản hệ thống, bàn làm việc, nội quy công ty & Thẻ nhân viên', role: 'Phụ trách bộ phận', isMandatory: true },
    ],
    checklist: [
      'Đã đối chiếu CCCD gắn chip trùng khớp thông tin cá nhân',
      'Đã xác nhận đầy đủ chữ ký trên HĐLĐ và Bảng cam kết bảo mật',
      'Đã cấp địa chỉ email công vụ và phân quyền phần mềm kế toán',
      'Đã phổ biến Nội quy lao động và Thỏa ước lao động tập thể',
    ],
    requiredForms: ['Hợp đồng lao động (Mẫu chuẩn NĐ 145)', 'Bản cam kết bảo mật thông tin (NDA)', 'Tờ khai đăng ký MST cá nhân Mẫu 05-ĐK-TCT'],
  },
  {
    id: 'HR-SOP-02',
    code: 'QT-NS-02',
    title: 'Quy trình Báo tăng / Báo giảm BHXH & Chốt sổ BHXH',
    category: 'BHXH_CHE_DO',
    categoryName: '2. Bảo Hiểm Xã Hội (BHXH - BHYT - BHTN)',
    description: 'Quy trình lập hồ sơ điện tử báo tăng lao động mới tham gia BHXH hoặc báo giảm khi chấm dứt HĐLĐ, điều chỉnh mức đóng và hoàn tất thủ tục chốt sổ BHXH.',
    legalBasis: 'Luật Bảo hiểm xã hội số 41/2024/QH15, Quyết định 595/QĐ-BHXH & Quyết định 505/QĐ-BHXH',
    estimatedDays: 5,
    steps: [
      { order: 1, name: 'Rà soát danh sách nhân sự phát sinh tăng/giảm trong tháng & Thu thập mã số BHXH', role: 'Chuyên viên BHXH', isMandatory: true },
      { order: 2, name: 'Lập Danh sách lao động tham gia BHXH, BHYT, BHTN (Mẫu D02-LT) trên phần mềm kê khai BHXH (VssID/eBH/VNPT)', role: 'Chuyên viên BHXH', isMandatory: true, requiredDocument: 'File XML/PDF Mẫu D02-LT' },
      { order: 3, name: 'Ký số Token và nộp hồ sơ điện tử lên Cơ quan BHXH Quận/Huyện phụ trách', role: 'Kế toán trưởng', isMandatory: true, requiredDocument: 'Giấy tiếp nhận hồ sơ số điện tử' },
      { order: 4, name: 'Theo dõi tiếp nhận và nhận Thông báo kết quả đóng BHXH (Mẫu C12-TS)', role: 'Chuyên viên BHXH', isMandatory: true, requiredDocument: 'Thông báo kết quả C12-TS' },
      { order: 5, name: 'Thực hiện thủ tục chốt sổ và in tờ rời BHXH bàn giao cho người lao động (nếu báo giảm)', role: 'Chuyên viên BHXH', isMandatory: true, requiredDocument: 'Tờ rời chốt sổ BHXH' },
    ],
    checklist: [
      'Đúng thời hạn báo tăng trước ngày 20 của tháng phát sinh',
      'Đúng mức lương đóng BHXH không thấp hơn mức lương tối thiểu vùng',
      'Đã thu hồi thẻ BHYT cũ hoặc cập nhật mã KCB mới',
      'Đã lưu biên bản bàn giao sổ BHXH cho người lao động nghỉ việc',
    ],
    requiredForms: ['Mẫu D02-LT: Danh sách lao động tham gia BHXH', 'Mẫu TK1-TS: Tờ khai tham gia BHXH của NLĐ', 'Mẫu D01-TS: Bảng kê chứng từ'],
  },
  {
    id: 'HR-SOP-03',
    code: 'QT-NS-03',
    title: 'Quy trình Lập bảng lương, Trích nộp BHXH & Chi trả thu nhập',
    category: 'TIEN_LUONG_THUE',
    categoryName: '3. Tính Lương & Trích Nộp Nghĩa Vụ',
    description: 'Quy trình chốt bảng chấm công, tính toán lương cơ bản, các khoản phụ cấp miễn thuế, trích BHXH 10.5% NLĐ và 21.5% NSDLĐ, duyệt chi lương và phát hành phiếu lương bảo mật.',
    legalBasis: 'Điều 90-104 Bộ luật Lao động 2019 & Thông tư 87/2026/TT-BTC (thay thế TT 111/2013/TT-BTC từ 01/01/2026)',
    estimatedDays: 4,
    steps: [
      { order: 1, name: 'Tổng hợp và chốt Bảng chấm công, Đơn xin nghỉ phép, Giấy công tác', role: 'Chuyên viên HCNS', isMandatory: true, requiredDocument: 'Bảng chấm công có chữ ký duyệt' },
      { order: 2, name: 'Lập Bảng thanh toán tiền lương, tính các khoản trích theo lương & Thuế TNCN tạm tính', role: 'Kế toán tiền lương', isMandatory: true, requiredDocument: 'Bảng lương chi tiết Excel' },
      { order: 3, name: 'Kế toán trưởng kiểm soát, đối chiếu số liệu đóng BHXH và thuế TNCN', role: 'Kế toán trưởng', isMandatory: true },
      { order: 4, name: 'Ban Giám Đốc ký phê duyệt chi trả lương và ký ủy nhiệm chi ngân hàng', role: 'Ban Giám Đốc', isMandatory: true, requiredDocument: 'Ủy nhiệm chi ngân hàng' },
      { order: 5, name: 'Gửi Phiếu lương điện tử (Payslip) riêng tư cho từng nhân sự & Trích nộp tiền BHXH vào TK cơ quan BHXH', role: 'Kế toán viên', isMandatory: true, requiredDocument: 'UNC nộp tiền BHXH' },
    ],
    checklist: [
      'Đã đối chiếu mức lương đóng BHXH đúng hợp đồng lao động',
      'Đã khấu trừ chính xác 8% BHXH, 1.5% BHYT, 1% BHTN',
      'Đã miễn thuế đối với phụ cấp ăn trưa (tối đa 730k/tháng), điện thoại, trang phục hợp lý',
      'Đã lưu trữ ủy nhiệm chi nộp BHXH và chi trả lương đúng hạn hợp đồng',
    ],
    requiredForms: ['Bảng thanh toán tiền lương mẫu chuẩn', 'Phiếu chi / Ủy nhiệm chi chi lương', 'Phiếu lương điện tử cá nhân (Payslip)'],
  },
  {
    id: 'HR-SOP-04',
    code: 'QT-NS-04',
    title: 'Quy trình Khấu trừ, Kê khai Thuế TNCN & Đăng ký Người phụ thuộc',
    category: 'TIEN_LUONG_THUE',
    categoryName: '4. Thuế TNCN & Người Phụ Thuộc',
    description: 'Quy trình thu thập hồ sơ chứng minh người phụ thuộc, đăng ký MST người phụ thuộc mẫu 07/ĐK-NPT-TNCN và lập Tờ khai khấu trừ thuế TNCN mẫu 05/KK-TNCN tháng/quý.',
    legalBasis: 'Luật Thuế Thu nhập cá nhân, Thông tư 87/2026/TT-BTC (thay thế trực tiếp Thông tư 111/2013/TT-BTC từ 01/01/2026) & Thông tư 80/2021/TT-BTC',
    estimatedDays: 3,
    steps: [
      { order: 1, name: 'Tiếp nhận hồ sơ chứng minh người phụ thuộc (Giấy khai sinh, CCCD, Xác nhận không có thu nhập)', role: 'Kế toán viên', isMandatory: true, requiredDocument: 'Bộ hồ sơ chứng minh NPT' },
      { order: 2, name: 'Lập Tờ khai đăng ký người phụ thuộc Mẫu 07/ĐK-NPT-TNCN và nộp điện tử qua Thuedientu.gdt.gov.vn', role: 'Kế toán viên', isMandatory: true, requiredDocument: 'Thông báo chấp nhận NPT của CQT' },
      { order: 3, name: 'Tổng hợp thu nhập chịu thuế, tính toán mức giảm trừ gia cảnh (15.5tr bản thân + 6.2tr/NPT chuẩn TT 87/2026/TT-BTC)', role: 'Kế toán viên', isMandatory: true },
      { order: 4, name: 'Lập Tờ khai khấu trừ thuế TNCN Mẫu 05/KK-TNCN (kỳ tháng hoặc quý)', role: 'Kế toán viên', isMandatory: true, requiredDocument: 'File XML Tờ khai 05/KK-TNCN' },
      { order: 5, name: 'Kế toán trưởng ký duyệt và nộp tờ khai + Lập chứng từ nộp thuế TNCN (nếu có phát sinh)', role: 'Kế toán trưởng', isMandatory: true, requiredDocument: 'Giấy nộp tiền vào NSNN' },
    ],
    checklist: [
      'Đảm bảo người phụ thuộc chưa từng được đăng ký trùng tại tổ chức chi trả khác',
      'Đã tính thuế TNCN theo Biểu thuế lũy tiến từng phần 7 bậc đối với lao động ký HĐLĐ từ 3 tháng trở lên',
      'Khấu trừ 10% tại nguồn đối với lao động thời vụ / thử việc có thu nhập từ 2.000.000đ/lần trở lên (nếu không làm cam kết 08/CK-TNCN)',
      'Lưu trữ hồ sơ chứng minh NPT đủ 10 năm theo quy định thanh tra thuế',
    ],
    requiredForms: ['Mẫu 07/ĐK-NPT-TNCN: Đăng ký người phụ thuộc', 'Mẫu 05/KK-TNCN: Tờ khai khấu trừ thuế TNCN', 'Mẫu 08/CK-TNCN: Bản cam kết thu nhập'],
  },
  {
    id: 'HR-SOP-05',
    code: 'QT-NS-05',
    title: 'Quy trình Giải quyết Chế độ Thai sản, Ốm đau & Dưỡng sức BHXH',
    category: 'BHXH_CHE_DO',
    categoryName: '5. Giải Quyết Chế Độ BHXH',
    description: 'Quy trình thu thập chứng từ viện phí, giấy ra viện, giấy chứng sinh, lập hồ sơ đề nghị hưởng chế độ BHXH Mẫu 01B-HSB và chi trả tiền trợ cấp từ cơ quan BHXH đến NLĐ.',
    legalBasis: 'Luật Bảo hiểm xã hội số 41/2024/QH15 & Quyết định 166/QĐ-BHXH',
    estimatedDays: 7,
    steps: [
      { order: 1, name: 'Tiếp nhận chứng từ y tế gốc (Giấy chứng sinh/Giấy khai sinh con, Giấy ra viện, Giấy chứng nhận nghỉ việc hưởng BHXH)', role: 'Chuyên viên BHXH', isMandatory: true, requiredDocument: 'Bản sao công chứng Giấy khai sinh/Giấy ra viện' },
      { order: 2, name: 'Kiểm tra điều kiện hưởng (Ví dụ: Thai sản phải đóng đủ 6 tháng BHXH trong vòng 12 tháng trước khi sinh)', role: 'Chuyên viên BHXH', isMandatory: true },
      { order: 3, name: 'Lập Danh sách đề nghị giải quyết chế độ ốm đau, thai sản, DSPHSK (Mẫu 01B-HSB) trên phần mềm BHXH điện tử', role: 'Chuyên viên BHXH', isMandatory: true, requiredDocument: 'File hồ sơ điện tử 01B-HSB' },
      { order: 4, name: 'Ký số và gửi hồ sơ đến Cơ quan BHXH trong vòng 45 ngày kể từ ngày NLĐ trở lại làm việc', role: 'Kế toán trưởng', isMandatory: true, requiredDocument: 'Biên lai nộp hồ sơ' },
      { order: 5, name: 'Theo dõi tiền trợ cấp do BHXH chuyển về TK công ty hoặc TK cá nhân của NLĐ và lập phiếu xác nhận', role: 'Kế toán viên', isMandatory: true, requiredDocument: 'Ủy nhiệm chi trả trợ cấp' },
    ],
    checklist: [
      'Đủ điều kiện thời gian tham gia BHXH theo quy định',
      'Nộp hồ sơ trong thời hạn 45 ngày kể từ ngày NLĐ đi làm lại',
      'Đúng số tài khoản ngân hàng chính chủ của người lao động',
    ],
    requiredForms: ['Mẫu 01B-HSB: Danh sách đề nghị giải quyết hưởng chế độ', 'Giấy ra viện / Giấy chứng nhận nghỉ việc hưởng BHXH'],
  },
  {
    id: 'HR-SOP-06',
    code: 'QT-NS-06',
    title: 'Quy trình Xây dựng Thang Bảng Lương & Nội Quy Lao Động',
    category: 'THANG_BANG_LUONG',
    categoryName: '6. Thang Bảng Lương & Quy Chế Lao Động',
    description: 'Quy trình tư vấn, xây dựng hệ thống thang bảng lương, quy chế lương thưởng, thỏa ước lao động và soạn thảo - đăng ký Nội quy lao động với Cơ quan quản lý nhà nước về lao động.',
    legalBasis: 'Điều 93, 118-121 Bộ luật Lao động 2019 & Nghị định 145/2020/NĐ-CP',
    estimatedDays: 10,
    steps: [
      { order: 1, name: 'Khảo sát cơ cấu chức danh, vị trí việc làm và mức lương tối thiểu vùng hiện hành', role: 'Chuyên viên HCNS', isMandatory: true },
      { order: 2, name: 'Xây dựng dự thảo Hệ thống Thang lương, Bảng lương và Quy chế trả lương, thưởng', role: 'Kế toán trưởng', isMandatory: true, requiredDocument: 'Bộ Thang bảng lương dự thảo' },
      { order: 3, name: 'Soạn thảo Nội quy lao động (Thời giờ làm việc, Kỷ luật lao động, Trách nhiệm vật chất, An toàn lao động)', role: 'Chuyên viên Pháp lý', isMandatory: true, requiredDocument: 'Dự thảo Nội quy lao động' },
      { order: 4, name: 'Lấy ý kiến của Tổ chức đại diện người lao động tại cơ sở (Công đoàn) và tham vấn NLĐ', role: 'Ban Giám Đốc', isMandatory: true, requiredDocument: 'Biên bản lấy ý kiến Công đoàn' },
      { order: 5, name: 'Ban hành Quyết định áp dụng, Niêm yết công khai tại nơi làm việc và Đăng ký Nội quy lao động với Sở/Phòng LĐ-TB&XH (đối với DN trên 10 lao động)', role: 'Ban Giám Đốc', isMandatory: true, requiredDocument: 'Biên nhận nộp Nội quy lao động' },
    ],
    checklist: [
      'Mức lương bậc 1 không thấp hơn mức lương tối thiểu vùng',
      'Đầy đủ các nội dung bắt buộc trong Nội quy lao động theo Điều 118 BLLĐ 2019',
      'Đã niêm yết công khai tại văn phòng và gửi thông báo đến 100% nhân viên',
      'Lưu trữ hồ sơ tại trụ sở doanh nghiệp để phục vụ thanh tra lao động',
    ],
    requiredForms: ['Hệ thống thang lương, bảng lương', 'Quy chế trả lương, thưởng', 'Nội quy lao động', 'Văn bản đăng ký nội quy lao động'],
  },
  {
    id: 'HR-SOP-07',
    code: 'QT-NS-07',
    title: 'Quy trình Đánh giá Hiệu suất (KPI), Khen thưởng & Đào tạo',
    category: 'TIEN_LUONG_THUE',
    categoryName: '7. Đánh Giá KPI & Đào Tạo',
    description: 'Quy trình đo lường năng suất làm việc của chuyên viên kế toán - thuế hàng tháng, tỷ lệ đúng hạn tờ khai, điểm chất lượng soát xét, tính thưởng năng suất và kế hoạch đào tạo cập nhật chính sách thuế mới.',
    legalBasis: 'Quy chế Quản lý Nội bộ & Đánh giá Hiệu suất TaxCore WorkFlow',
    estimatedDays: 3,
    steps: [
      { order: 1, name: 'Trích xuất dữ liệu tự động từ TaxCore System: Tỷ lệ hoàn thành đúng hạn, số việc quá hạn, số lỗi kiểm soát', role: 'Hệ thống tự động', isMandatory: true },
      { order: 2, name: 'Nhân viên tự đánh giá (Self-review) và ghi nhận kết quả đóng góp trong kỳ', role: 'Chuyên viên thực hiện', isMandatory: true },
      { order: 3, name: 'Trưởng phòng Kế toán / KTT đánh giá chất lượng hồ sơ, thái độ phục vụ khách hàng và chấm điểm KPI', role: 'Trưởng phòng', isMandatory: true, requiredDocument: 'Bảng đánh giá KPI có nhận xét' },
      { order: 4, name: 'Họp bình xét thi đua tháng, đề xuất mức thưởng KPI cộng thêm vào bảng lương', role: 'Ban Giám Đốc', isMandatory: true },
      { order: 5, name: 'Lập kế hoạch đào tạo bồi dưỡng chuyên môn nghiệp vụ / cập nhật văn bản thuế mới cho nhân viên', role: 'Kế toán trưởng', isMandatory: false },
    ],
    checklist: [
      'Minh bạch tiêu chí đánh giá dựa trên dữ liệu thời gian thực',
      'Kịp thời khen thưởng nhân sự đạt 100% đúng hạn và không có sai sót thuế',
      'Có kế hoạch hỗ trợ nhân sự có dấu hiệu quá tải công việc',
    ],
    requiredForms: ['Bảng chỉ số KPI nhân sự', 'Quyết định khen thưởng hiệu suất tháng'],
  },
  {
    id: 'HR-SOP-08',
    code: 'QT-NS-08',
    title: 'Quy trình Chấm dứt HĐLĐ, Bàn giao & Quyết toán nghỉ việc (Offboarding)',
    category: 'OFFBOARDING',
    categoryName: '8. Thôi Việc & Quyết Toán Nghỉ Việc',
    description: 'Quy trình tiếp nhận đơn xin nghỉ việc, kiểm tra thời hạn báo trước, lập biên bản bàn giao hồ sơ chứng từ khách hàng, quyết toán tiền lương, ngày phép còn lại, chốt sổ BHXH và phát hành Chứng từ khấu trừ thuế TNCN.',
    legalBasis: 'Điều 34-48 Bộ luật Lao động 2019, Luật BHXH 41/2024/QH15 & Thông tư 87/2026/TT-BTC',
    estimatedDays: 7,
    steps: [
      { order: 1, name: 'Tiếp nhận Đơn xin thôi việc & Kiểm tra thời hạn báo trước (45 ngày HĐ không thời hạn, 30 ngày HĐ xác định thời hạn)', role: 'Trưởng phòng', isMandatory: true, requiredDocument: 'Đơn xin thôi việc có phê duyệt' },
      { order: 2, name: 'Lập Biên bản bàn giao toàn bộ Hồ sơ kế toán, Chữ ký số, Dữ liệu khách hàng và Tài sản công ty', role: 'Chuyên viên bàn giao', isMandatory: true, requiredDocument: 'Biên bản bàn giao công việc có đủ chữ ký' },
      { order: 3, name: 'Ban hành Quyết định chấm dứt hợp đồng lao động', role: 'Ban Giám Đốc', isMandatory: true, requiredDocument: 'Quyết định thôi việc ký đóng dấu' },
      { order: 4, name: 'Quyết toán các chế độ: Tiền lương đến ngày nghỉ, thanh toán tiền phép năm chưa nghỉ, báo giảm và chốt sổ BHXH', role: 'Kế toán & HCNS', isMandatory: true, requiredDocument: 'Bảng quyết toán tiền lương thôi việc' },
      { order: 5, name: 'Cấp Chứng từ khấu trừ thuế TNCN điện tử và Thư xác nhận thu nhập trong năm', role: 'Kế toán viên', isMandatory: true, requiredDocument: 'Chứng từ khấu trừ thuế TNCN' },
    ],
    checklist: [
      'Đã thu hồi 100% hồ sơ, chứng từ gốc, token chữ ký số của khách hàng',
      'Đã thu hồi quyền truy cập email công vụ và tài khoản phần mềm kế toán',
      'Đã thanh toán đầy đủ lương và các chế độ trong vòng 14 ngày kể từ ngày chấm dứt HĐLĐ',
      'Đã hoàn tất chốt sổ và trả tờ rời BHXH cho người lao động',
    ],
    requiredForms: ['Quyết định chấm dứt HĐLĐ', 'Biên bản bàn giao công việc và tài sản', 'Bảng quyết toán chi trả thôi việc', 'Chứng từ khấu trừ thuế TNCN'],
  },
];

/**
 * Danh sách Đơn Nghỉ Phép (Sạch, không có dữ liệu demo)
 */
export const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [];

/**
 * Danh sách Lịch Công Tác Thực Địa & Làm Việc Khách Hàng / Cơ Quan Thuế (Sạch, không có dữ liệu demo)
 */
export const INITIAL_BUSINESS_TRIPS: BusinessTrip[] = [];

/**
 * Bảng Lương Tháng (Sạch, không có dữ liệu demo)
 */
export const INITIAL_PAYROLL_RECORDS: PayrollRecord[] = [];


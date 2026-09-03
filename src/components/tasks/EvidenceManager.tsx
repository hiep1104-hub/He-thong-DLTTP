import React, { useState, useRef, useEffect } from 'react';
import { Task, TaskAttachment, AttachmentCategory, User } from '../../types';
import { 
  FileText, 
  Upload, 
  Trash2, 
  Image as ImageIcon, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  CheckCircle2, 
  Sparkles, 
  Star, 
  Eye, 
  X, 
  Maximize2, 
  FileCheck, 
  AlertCircle,
  Clock,
  Layers,
  LayoutGrid,
  List,
  Plus,
  ShieldCheck,
  Check
} from 'lucide-react';
import { 
  compressImageFile, 
  isImageFile, 
  downloadDataUrl, 
  createSampleEvidenceImage 
} from '../../utils/imageUtils';
import { formatDateTime, formatFileSize, ATTACHMENT_CATEGORY_LABELS } from '../../utils/formatters';

interface EvidenceManagerProps {
  task: Task;
  currentUser: User;
  onUpdateAttachments: (attachments: TaskAttachment[], auditReason?: string) => void;
  onRequestCompletion?: () => void;
}

export const EvidenceManager: React.FC<EvidenceManagerProps> = ({
  task,
  currentUser,
  onUpdateAttachments,
  onRequestCompletion,
}) => {
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);

  // Upload Form State
  const [customFileName, setCustomFileName] = useState('');
  const [category, setCategory] = useState<AttachmentCategory>('TO_KHAI_THUE');
  const [isCompletionEvidence, setIsCompletionEvidence] = useState(true);
  const [notes, setNotes] = useState('');
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [compressedStats, setCompressedStats] = useState<{ size: number; width: number; height: number } | null>(null);

  // Lightbox Modal State
  const [lightboxImage, setLightboxImage] = useState<TaskAttachment | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Sample presets generator open
  const [showSampleMenu, setShowSampleMenu] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  // Global & Local Clipboard Paste Listener for quick Screenshots
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            e.preventDefault();
            handleProcessFile(blob, `Anh_Chup_Man_Hinh_${Date.now()}.png`);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleProcessFile = async (file: File | Blob, suggestedName?: string) => {
    setIsProcessing(true);
    setProcessingStatus('Đang tối ưu & nén ảnh nhẹ...');
    try {
      const fileName = suggestedName || (file instanceof File ? file.name : `evidence_${Date.now()}.webp`);
      if (isImageFile(file.type, fileName)) {
        // Compress image using HTML5 Canvas
        const result = await compressImageFile(file, {
          maxWidth: 1600,
          maxHeight: 1600,
          quality: 0.8,
          preferredMime: 'image/webp',
          fileName,
        });

        setPreviewDataUrl(result.dataUrl);
        setCustomFileName(fileName.replace(/\.[^/.]+$/, "") + '.webp');
        setCompressedStats({
          size: result.size,
          width: result.width,
          height: result.height,
        });
        if (file instanceof File) {
          setPendingFile(file);
        }
      } else {
        // Normal non-image file
        const reader = new FileReader();
        reader.onload = (ev) => {
          setPreviewDataUrl(ev.target?.result as string);
          setCustomFileName(fileName);
          setCompressedStats({
            size: file.size,
            width: 0,
            height: 0,
          });
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      console.error('Error processing image:', err);
      alert('Không thể xử lý tệp tin: ' + err.message);
    } finally {
      setIsProcessing(false);
      setProcessingStatus(null);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleSaveAttachment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!previewDataUrl) return;

    const fileName = customFileName.trim() || `Bang_Chung_${Date.now()}.webp`;
    const newAtt: TaskAttachment = {
      id: `att-${Date.now()}`,
      name: fileName,
      url: previewDataUrl,
      thumbnailUrl: previewDataUrl,
      fileType: previewDataUrl.startsWith('data:image/') ? 'image/webp' : 'application/octet-stream',
      size: compressedStats ? compressedStats.size : 120000,
      uploadedBy: currentUser.id,
      uploadedByName: currentUser.name,
      uploadedAt: new Date().toISOString(),
      version: task.attachments.length + 1,
      category,
      isCompletionEvidence,
      isImage: isImageFile(undefined, fileName) || previewDataUrl.startsWith('data:image/'),
      notes: notes.trim() || undefined,
      dimensions: compressedStats && compressedStats.width > 0 ? { width: compressedStats.width, height: compressedStats.height } : undefined,
    };

    const updated = [newAtt, ...task.attachments];
    onUpdateAttachments(updated, `Đính kèm bằng chứng ảnh: ${newAtt.name} (${ATTACHMENT_CATEGORY_LABELS[category]?.label || category})`);

    // Reset Form
    setPreviewDataUrl(null);
    setPendingFile(null);
    setCompressedStats(null);
    setCustomFileName('');
    setNotes('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteAttachment = (attId: string, attName: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa bằng chứng "${attName}" không?`)) {
      const updated = task.attachments.filter(a => a.id !== attId);
      onUpdateAttachments(updated, `Xóa bằng chứng: ${attName}`);
      if (lightboxImage?.id === attId) {
        setLightboxImage(null);
      }
    }
  };

  const handleToggleCompletionEvidence = (attId: string) => {
    const updated = task.attachments.map(a => {
      if (a.id === attId) {
        return { ...a, isCompletionEvidence: !a.isCompletionEvidence };
      }
      return a;
    });
    onUpdateAttachments(updated, `Cập nhật trạng thái bằng chứng hoàn thành`);
  };

  const handleGenerateSample = (type: 'THONG_BAO_THUE' | 'UNC_NGAN_HANG' | 'KY_SO_TOKEN' | 'BIEN_BAN_HOAN_THANH') => {
    const sample = createSampleEvidenceImage(type, {
      customerName: task.customerName,
      taxCode: task.customerTaxCode || '0108923456',
      taskTitle: task.title,
      period: task.taxPeriod || 'Kỳ hiện tại',
      signerName: currentUser.name,
    });

    const newAtt: TaskAttachment = {
      id: `att-sample-${Date.now()}`,
      name: sample.name,
      url: sample.dataUrl,
      thumbnailUrl: sample.dataUrl,
      fileType: 'image/png',
      size: sample.size,
      uploadedBy: currentUser.id,
      uploadedByName: currentUser.name,
      uploadedAt: new Date().toISOString(),
      version: task.attachments.length + 1,
      category: sample.category,
      isCompletionEvidence: true,
      isImage: true,
      dimensions: sample.dimensions,
      notes: 'Bằng chứng mẫu điện tử hợp lệ theo quy chuẩn CQT & Đại lý thuế',
    };

    const updated = [newAtt, ...task.attachments];
    onUpdateAttachments(updated, `Tạo bằng chứng điện tử mẫu: ${sample.name}`);
    setShowSampleMenu(false);
  };

  // Stats
  const imageCount = task.attachments.filter(a => a.isImage || isImageFile(a.fileType, a.name) || (a.url && a.url.startsWith('data:image/'))).length;
  const completionEvidenceCount = task.attachments.filter(a => a.isCompletionEvidence).length;
  const totalBytes = task.attachments.reduce((acc, curr) => acc + (curr.size || 0), 0);

  return (
    <div className="space-y-4">
      
      {/* Top Banner: Status & Capacity overview */}
      <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/80 dark:to-indigo-950/40 rounded-xl border border-blue-200/80 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs">
            <ImageIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <span>Lưu Trữ Bằng Chứng Siêu Nhẹ (Ảnh Nén WebP / PNG)</span>
              {completionEvidenceCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] flex items-center space-x-1 border border-emerald-300 dark:border-emerald-800">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Đã có {completionEvidenceCount} bằng chứng hoàn thành</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold text-[10px] flex items-center space-x-1 border border-amber-300 dark:border-amber-800">
                  <AlertCircle className="h-3 w-3" />
                  <span>Chưa có bằng chứng hoàn thành</span>
                </span>
              )}
            </div>
            <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 flex items-center space-x-2">
              <span>Tổng cộng: <strong className="text-slate-800 dark:text-slate-200">{task.attachments.length} tệp</strong> ({imageCount} ảnh)</span>
              <span>•</span>
              <span>Dung lượng: <strong className="text-slate-800 dark:text-slate-200">{formatFileSize(totalBytes)}</strong></span>
              <span>•</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-medium">Hỗ trợ Ctrl+V chụp màn hình & Kéo thả</span>
            </div>
          </div>
        </div>

        {/* View toggle & Sample Generator button */}
        <div className="flex items-center space-x-2 self-end sm:self-center">
          <div className="relative">
            <button
              onClick={() => setShowSampleMenu(!showSampleMenu)}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              <span>Tạo Bằng Chứng Mẫu</span>
            </button>

            {showSampleMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-72 bg-white dark:bg-slate-850 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-30 space-y-1 animate-in fade-in zoom-in-95">
                <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Chọn mẫu bằng chứng nghiệp vụ
                </div>
                <button
                  onClick={() => handleGenerateSample('THONG_BAO_THUE')}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs flex items-center space-x-2"
                >
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <div>
                    <div className="font-bold">1. Thông báo tiếp nhận thuế CQT</div>
                    <div className="text-[10px] text-slate-400">eTax thuedientu.gdt.gov.vn</div>
                  </div>
                </button>
                <button
                  onClick={() => handleGenerateSample('UNC_NGAN_HANG')}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs flex items-center space-x-2"
                >
                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                  <div>
                    <div className="font-bold">2. Giấy nộp tiền NSNN (Vietcombank)</div>
                    <div className="text-[10px] text-slate-400">Chứng từ nộp thuế thành công</div>
                  </div>
                </button>
                <button
                  onClick={() => handleGenerateSample('KY_SO_TOKEN')}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs flex items-center space-x-2"
                >
                  <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                  <div>
                    <div className="font-bold">3. Xác nhận Ký số USB Token CKS</div>
                    <div className="text-[10px] text-slate-400">Chữ ký điện tử RSA-2048</div>
                  </div>
                </button>
                <button
                  onClick={() => handleGenerateSample('BIEN_BAN_HOAN_THANH')}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-teal-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs flex items-center space-x-2"
                >
                  <div className="h-2 w-2 rounded-full bg-teal-500"></div>
                  <div>
                    <div className="font-bold">4. Biên bản nghiệm thu bàn giao</div>
                    <div className="text-[10px] text-slate-400">Xác nhận 2 bên hoàn thành 100%</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <div className="flex bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('GRID')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'GRID' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-900'}`}
              title="Xem dạng Lưới ảnh (Gallery)"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('LIST')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'LIST' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-900'}`}
              title="Xem dạng Danh sách chi tiết"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Upload Dropzone & Live Image Processor */}
      <div 
        ref={dropzoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`p-4 rounded-2xl border-2 transition-all ${
          isDragging 
            ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 scale-[0.99]' 
            : previewDataUrl 
              ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-950/20' 
              : 'border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-50'
        }`}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept="image/*,.pdf,.xml,.xlsx,.docx"
          className="hidden"
        />

        {isProcessing && (
          <div className="py-8 text-center space-y-2">
            <div className="animate-spin h-7 w-7 border-3 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400">{processingStatus}</p>
          </div>
        )}

        {!isProcessing && !previewDataUrl && (
          <div className="text-center py-4 space-y-3">
            <div className="flex justify-center items-center space-x-2">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full">
                <Upload className="h-6 w-6" />
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-full">
                <ImageIcon className="h-6 w-6" />
              </div>
            </div>
            
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Kéo thả ảnh chứng từ vào đây hoặc{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-bold"
                >
                  chọn file từ máy tính
                </button>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Mẹo: Bấm <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px] font-mono font-bold">Ctrl + V</kbd> bất kỳ đâu để dán nhanh ảnh chụp màn hình nộp tờ khai thuế / ủy nhiệm chi ngân hàng!
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center space-x-1.5"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Tải Ảnh Bằng Chứng</span>
              </button>
              <button
                type="button"
                onClick={() => handleGenerateSample('THONG_BAO_THUE')}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                <span>Tạo Mẫu CQT Nhanh</span>
              </button>
            </div>
          </div>
        )}

        {/* Live Image Preview & Metadata Form before confirming upload */}
        {previewDataUrl && !isProcessing && (
          <div className="space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Ảnh đã được nén tối ưu (<span className="text-emerald-600 font-mono">{formatFileSize(compressedStats?.size || 0)}</span>)
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPreviewDataUrl(null);
                  setPendingFile(null);
                  setCompressedStats(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              {/* Thumbnail preview */}
              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black/5 dark:bg-black/40 group aspect-video sm:aspect-auto sm:h-36 flex items-center justify-center">
                {previewDataUrl.startsWith('data:image/') ? (
                  <img 
                    src={previewDataUrl} 
                    alt="Preview" 
                    className="max-h-full max-w-full object-contain cursor-pointer"
                    onClick={() => setLightboxImage({
                      id: 'preview',
                      name: customFileName || 'Ảnh xem trước',
                      url: previewDataUrl,
                      fileType: 'image/webp',
                      size: compressedStats?.size || 0,
                      uploadedBy: currentUser.id,
                      uploadedByName: currentUser.name,
                      uploadedAt: new Date().toISOString(),
                      version: 1,
                      category,
                    })}
                  />
                ) : (
                  <div className="p-4 text-center text-slate-500">
                    <FileText className="h-10 w-10 mx-auto text-blue-500 mb-1" />
                    <span className="text-[11px] font-bold">{customFileName}</span>
                  </div>
                )}
                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-mono">
                  {compressedStats?.width ? `${compressedStats.width}x${compressedStats.height}` : 'Tệp dữ liệu'}
                </div>
              </div>

              {/* Form details */}
              <div className="md:col-span-2 space-y-2.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tên bằng chứng / Chứng từ:
                  </label>
                  <input
                    type="text"
                    value={customFileName}
                    onChange={(e) => setCustomFileName(e.target.value)}
                    placeholder="Ví dụ: Thong_Bao_Tiep_Nhan_Thue_T07_2026.webp"
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Phân loại chứng từ:
                    </label>
                    <select
                      value={category}
                      onChange={(e: any) => setCategory(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-semibold focus:outline-none"
                    >
                      <option value="TO_KHAI_THUE">Tờ khai thuế & Thông báo CQT</option>
                      <option value="CHUNG_TU_NOP_TIEN">Giấy nộp tiền / UNC Ngân hàng</option>
                      <option value="HOA_DON">Hóa đơn chứng từ / Bảng kê</option>
                      <option value="SAO_KE_NGAN_HANG">Sao kê ngân hàng</option>
                      <option value="BCTC">Báo cáo tài chính & Sổ cái</option>
                      <option value="HOP_DONG">Hợp đồng dịch vụ</option>
                      <option value="BIEN_BAN">Biên bản nghiệm thu / Bàn giao</option>
                      <option value="HO_SO_PHAP_LY">Hồ sơ pháp lý / ĐKKD</option>
                      <option value="KHAC">Chứng từ khác</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Ghi chú thêm:
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Mã giao dịch, số tờ khai, lưu ý..."
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCompletionEvidence}
                      onChange={(e) => setIsCompletionEvidence(e.target.checked)}
                      className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                    />
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      ⭐ Đánh dấu là Bằng chứng nghiệm thu hoàn thành (Completion Proof)
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewDataUrl(null);
                      setPendingFile(null);
                      setCompressedStats(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 font-semibold"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveAttachment()}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-xs flex items-center space-x-1"
                  >
                    <Check className="h-4 w-4" />
                    <span>Lưu Bằng Chứng Vào Hồ Sơ</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* List / Gallery of Attached Evidence */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
          <span>Danh Sách Hồ Sơ & Bằng Chứng Đã Đính Kèm ({task.attachments.length})</span>
          {onRequestCompletion && task.status !== 'HOAN_THANH' && (
            <button
              onClick={onRequestCompletion}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center space-x-1"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Đi đến Nghiệm Thu & Hoàn Thành</span>
            </button>
          )}
        </div>

        {task.attachments.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-850">
            <ImageIcon className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="font-bold text-slate-600 dark:text-slate-400">Chưa có ảnh bằng chứng hay chứng từ nào được đính kèm.</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Hãy bấm "Tải Ảnh Bằng Chứng" hoặc chọn "Tạo Bằng Chứng Mẫu" để bổ sung chứng từ hoàn thành công việc.
            </p>
          </div>
        )}

        {/* GRID VIEW */}
        {viewMode === 'GRID' && task.attachments.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {task.attachments.map((file) => {
              const isImg = file.isImage || isImageFile(file.fileType, file.name) || (file.url && file.url.startsWith('data:image/'));
              const catInfo = ATTACHMENT_CATEGORY_LABELS[file.category] || { label: file.category, badgeClass: 'bg-slate-100 text-slate-800 border-slate-200' };

              return (
                <div
                  key={file.id}
                  className={`group relative rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                    file.isCompletionEvidence
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 shadow-xs'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  {/* Completion Star Ribbon */}
                  {file.isCompletionEvidence && (
                    <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-bold shadow-xs flex items-center space-x-1">
                      <Star className="h-2.5 w-2.5 fill-current" />
                      <span>Bằng chứng hoàn thành</span>
                    </div>
                  )}

                  {/* Thumbnail Container */}
                  <div 
                    onClick={() => {
                      if (file.url) {
                        setLightboxImage(file);
                        setZoomLevel(1);
                        setRotation(0);
                      }
                    }}
                    className="relative w-full h-36 bg-slate-100 dark:bg-slate-900 flex items-center justify-center cursor-pointer overflow-hidden border-b border-slate-200/80 dark:border-slate-700/80"
                  >
                    {file.url ? (
                      <img 
                        src={file.url} 
                        alt={file.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                    ) : (
                      <div className="text-center p-3">
                        <FileText className="h-10 w-10 text-blue-500 mx-auto mb-1 opacity-70" />
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          {file.fileType?.split('/')[1] || 'FILE'}
                        </span>
                      </div>
                    )}

                    {/* Hover Overlay with Quick Actions */}
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {file.url && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightboxImage(file);
                            setZoomLevel(1);
                            setRotation(0);
                          }}
                          className="p-2 rounded-xl bg-white/90 dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-white shadow-lg transition-transform hover:scale-110"
                          title="Phóng to ảnh"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      {file.url && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadDataUrl(file.url!, file.name);
                          }}
                          className="p-2 rounded-xl bg-white/90 dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-white shadow-lg transition-transform hover:scale-110"
                          title="Tải ảnh về máy"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAttachment(file.id, file.name);
                        }}
                        className="p-2 rounded-xl bg-red-600/90 text-white hover:bg-red-600 shadow-lg transition-transform hover:scale-110"
                        title="Xóa bằng chứng"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white text-[9px] font-mono font-semibold">
                      {formatFileSize(file.size)}
                    </div>
                  </div>

                  {/* Card Content Details */}
                  <div className="p-3 text-xs flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white truncate" title={file.name}>
                        {file.name}
                      </div>

                      <div className="mt-1 flex items-center justify-between gap-1 flex-wrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${catInfo.badgeClass}`}>
                          {catInfo.label}
                        </span>
                      </div>

                      {file.notes && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic line-clamp-2">
                          "{file.notes}"
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                      <div>
                        <span>Bởi: <strong>{file.uploadedByName}</strong></span>
                        <div className="text-[9px]">{formatDateTime(file.uploadedAt)}</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleCompletionEvidence(file.id)}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                          file.isCompletionEvidence
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                        title="Đổi trạng thái Bằng chứng hoàn thành"
                      >
                        {file.isCompletionEvidence ? '✔ Bằng chứng HT' : 'Đặt làm BC'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* LIST VIEW */}
        {viewMode === 'LIST' && task.attachments.length > 0 && (
          <div className="space-y-2">
            {task.attachments.map((file) => {
              const catInfo = ATTACHMENT_CATEGORY_LABELS[file.category] || { label: file.category, badgeClass: 'bg-slate-100 text-slate-800' };

              return (
                <div
                  key={file.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                    file.isCompletionEvidence
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div 
                      onClick={() => file.url && setLightboxImage(file)}
                      className="h-10 w-10 rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center shrink-0 cursor-pointer border border-slate-300 dark:border-slate-600"
                    >
                      {file.url ? (
                        <img src={file.url} alt={file.name} className="h-full w-full object-cover" />
                      ) : (
                        <FileText className="h-5 w-5 text-blue-600" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 dark:text-white truncate">{file.name}</span>
                        {file.isCompletionEvidence && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-600 text-white text-[9px] font-bold shrink-0">
                            ★ Hoàn thành
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center space-x-2 mt-0.5">
                        <span className="font-mono">{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>Bởi {file.uploadedByName}</span>
                        <span>•</span>
                        <span>{formatDateTime(file.uploadedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${catInfo.badgeClass}`}>
                      {catInfo.label}
                    </span>

                    {file.url && (
                      <button
                        type="button"
                        onClick={() => setLightboxImage(file)}
                        className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-blue-600 hover:text-white transition-colors"
                        title="Xem ảnh"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {file.url && (
                      <button
                        type="button"
                        onClick={() => downloadDataUrl(file.url!, file.name)}
                        className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-emerald-600 hover:text-white transition-colors"
                        title="Tải về"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteAttachment(file.id, file.name)}
                      className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-red-600 hover:text-white transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* LIGHTBOX MODAL: FULL RESOLUTION IMAGE VIEWER */}
      {lightboxImage && lightboxImage.url && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col animate-in fade-in">
          {/* Top Bar */}
          <div className="p-3 sm:p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-white text-xs">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="p-2 rounded-lg bg-blue-600/30 text-blue-400">
                <ImageIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="font-bold truncate">{lightboxImage.name}</div>
                <div className="text-[10px] text-slate-400 flex items-center space-x-2">
                  <span>{formatFileSize(lightboxImage.size)}</span>
                  <span>•</span>
                  <span>Đăng bởi {lightboxImage.uploadedByName}</span>
                  <span>•</span>
                  <span>{formatDateTime(lightboxImage.uploadedAt)}</span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                title="Thu nhỏ"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-[11px] font-mono w-12 text-center text-slate-300">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                title="Phóng to"
              >
                <ZoomIn className="h-4 w-4" />
              </button>

              <button
                onClick={() => setRotation(prev => (prev + 90) % 360)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                title="Xoay 90 độ"
              >
                <RotateCw className="h-4 w-4" />
              </button>

              <button
                onClick={() => downloadDataUrl(lightboxImage.url!, lightboxImage.name)}
                className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center space-x-1"
                title="Tải ảnh về máy"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Tải về</span>
              </button>

              <button
                onClick={() => setLightboxImage(null)}
                className="p-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white"
                title="Đóng (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Canvas stage */}
          <div 
            onClick={() => setLightboxImage(null)}
            className="flex-1 overflow-auto flex items-center justify-center p-4 cursor-zoom-out select-none"
          >
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="transition-transform duration-150 ease-out cursor-default max-w-full max-h-full flex items-center justify-center"
              style={{
                transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
              }}
            >
              <img 
                src={lightboxImage.url} 
                alt={lightboxImage.name} 
                className="max-w-[90vw] max-h-[82vh] object-contain rounded-lg shadow-2xl bg-white"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

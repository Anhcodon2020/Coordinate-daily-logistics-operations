import React, { useState } from 'react';
import {
  FileSpreadsheet,
  X,
  PlusCircle,
  Link2,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Table
} from 'lucide-react';
import { GoogleSheetConfig, DispatchTask, Employee, DockDoor } from '../types';
import {
  createWarehouseSpreadsheet,
  writeAllDataToSheet,
  fetchSheetData,
  extractSpreadsheetId
} from '../services/googleSheets';

interface SheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string | null;
  sheetConfig: GoogleSheetConfig | null;
  onSaveConfig: (config: GoogleSheetConfig) => void;
  tasks: DispatchTask[];
  employees: Employee[];
  docks: DockDoor[];
  onDataImported: (data: { tasks: DispatchTask[]; employees: Employee[]; docks: DockDoor[] }) => void;
  onRequestConfirmSync: (action: 'push' | 'pull' | 'create') => void;
}

export const SheetSyncModal: React.FC<SheetSyncModalProps> = ({
  isOpen,
  onClose,
  accessToken,
  sheetConfig,
  onSaveConfig,
  tasks,
  employees,
  docks,
  onDataImported,
  onRequestConfirmSync,
}) => {
  const [inputUrl, setInputUrl] = useState<string>(sheetConfig?.spreadsheetUrl || '');
  const [sheetTitle, setSheetTitle] = useState<string>(
    `Điều Phối Lao Động Kho - ${new Date().toLocaleDateString('vi-VN')}`
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleCreateNewSheet = async () => {
    if (!accessToken) {
      setStatusMessage({
        type: 'error',
        text: 'Vui lòng Đăng nhập bằng Google trước khi tạo bảng tính!',
      });
      return;
    }

    onRequestConfirmSync('create');
  };

  const handleConnectExisting = async () => {
    if (!accessToken) {
      setStatusMessage({
        type: 'error',
        text: 'Vui lòng Đăng nhập bằng Google trước khi kết nối!',
      });
      return;
    }

    const id = extractSpreadsheetId(inputUrl);
    if (!id || id.length < 10) {
      setStatusMessage({
        type: 'error',
        text: 'Vui lòng nhập đường link Google Sheet hoặc Spreadsheet ID hợp lệ!',
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage({ type: 'info', text: 'Đang kiểm tra quyền truy cập và cấu trúc bảng tính...' });

    try {
      const data = await fetchSheetData(accessToken, id);
      const newConfig: GoogleSheetConfig = {
        spreadsheetId: id,
        spreadsheetUrl: inputUrl.startsWith('http')
          ? inputUrl
          : `https://docs.google.com/spreadsheets/d/${id}/edit`,
        title: 'Bảng Điều Phối Lao Động',
        lastSyncedAt: new Date().toISOString(),
        autoSync: true,
        sheetsConfigured: true,
      };

      onSaveConfig(newConfig);

      if (data && (data.tasks.length > 0 || data.employees.length > 0)) {
        onDataImported(data);
        setStatusMessage({
          type: 'success',
          text: `Kết nối thành công! Đã tải về ${data.tasks.length} công việc, ${data.employees.length} nhân viên, ${data.docks.length} cửa dock.`,
        });
      } else {
        setStatusMessage({
          type: 'success',
          text: 'Kết nối thành công! Bảng tính chưa có sẵn dữ liệu mẫu. Bạn có thể nhấn nút "Ghi đè dữ liệu lên Sheet" để đồng bộ.',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Không thể kết nối bảng tính: ${err.message || 'Lỗi phân quyền hoặc ID không tồn tại'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Kết Nối & Đồng Bộ Google Sheets</h2>
              <p className="text-xs text-slate-400">
                Đồng bộ 2 chiều các tab: <span className="text-emerald-400 font-mono">congviec</span>, <span className="text-blue-400 font-mono">nhanvien</span>, <span className="text-amber-400 font-mono">socua</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                statusMessage.type === 'error'
                  ? 'bg-rose-950/40 border border-rose-500/30 text-rose-200'
                  : statusMessage.type === 'success'
                  ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-200'
                  : 'bg-blue-950/40 border border-blue-500/30 text-blue-200'
              }`}
            >
              {statusMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              ) : (
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              )}
              <div className="flex-1 leading-relaxed">{statusMessage.text}</div>
            </div>
          )}

          {!accessToken && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-center justify-between">
              <span>Bạn cần đăng nhập Google để cấp quyền truy cập Google Sheets.</span>
            </div>
          )}

          {/* Current Connection Status */}
          {sheetConfig?.spreadsheetId && (
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Bảng tính đang liên kết
                </span>
                <a
                  href={sheetConfig.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  Mở trên Google Drive <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Table className="w-5 h-5 text-emerald-400" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">
                    {sheetConfig.title}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 truncate">
                    ID: {sheetConfig.spreadsheetId}
                  </div>
                </div>
              </div>

              {/* Sync Actions */}
              <div className="pt-2 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onRequestConfirmSync('push')}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Ghi đè App lên Sheet
                </button>
                <button
                  type="button"
                  onClick={() => onRequestConfirmSync('pull')}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-slate-600"
                >
                  <Download className="w-3.5 h-3.5" />
                  Tải dữ liệu từ Sheet về
                </button>
              </div>
            </div>
          )}

          {/* Tab structure description */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-2">
            <div className="font-semibold text-slate-300">Cấu trúc 3 bảng dữ liệu chuẩn:</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="font-bold text-emerald-400 font-mono">1. congviec</div>
                <div className="text-slate-400 mt-1">
                  Mã CV, Nhân viên, Vị trí, Giờ bắt đầu, Trạng thái, Loại (Inbound/Outbound/Putaway/Inspection)
                </div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="font-bold text-blue-400 font-mono">2. nhanvien</div>
                <div className="text-slate-400 mt-1">
                  Mã NV, Tên nhân viên, Chức danh, Ca làm việc, Trạng thái, Sản lượng
                </div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="font-bold text-amber-400 font-mono">3. socua</div>
                <div className="text-slate-400 mt-1">
                  Mã cửa, Tên cửa, Loại cửa, Trạng thái, Biển số xe/Cont, Phụ trách
                </div>
              </div>
            </div>
          </div>

          {/* Section: Create New Spreadsheet */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/80 space-y-3">
            <div className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-white">
                Cách 1: Tự động khởi tạo Google Sheet mới
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Hệ thống sẽ tạo 1 Google Spreadsheet trên Google Drive của bạn với đầy đủ 3 tab <span className="text-slate-200">congviec</span>, <span className="text-slate-200">nhanvien</span>, <span className="text-slate-200">socua</span> và định dạng tiêu đề chuẩn.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={sheetTitle}
                onChange={(e) => setSheetTitle(e.target.value)}
                placeholder="Tên file bảng tính..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleCreateNewSheet}
                disabled={isLoading || !accessToken}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm shrink-0"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
                Tạo Bảng Tính Mới
              </button>
            </div>
          </div>

          {/* Section: Connect Existing Spreadsheet */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/80 space-y-3">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold text-white">
                Cách 2: Kết nối Bảng tính đã có
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Dán đường link chia sẻ hoặc ID của Google Spreadsheet đã có sẵn trên Drive của bạn.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdB.../edit"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleConnectExisting}
                disabled={isLoading || !inputUrl || !accessToken}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm shrink-0"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                Liên Kết
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

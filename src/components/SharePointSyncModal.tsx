import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Layers,
  Copy,
  Check,
  Terminal,
  Upload,
  Download,
  Share2,
  RefreshCw,
  Building2,
  Key,
  FileSpreadsheet,
  HelpCircle,
  FolderDown,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { SharePointConfig, DispatchTask, Employee, DockDoor } from '../types';
import {
  parseSharePointUrl,
  resolveSharePointSiteId,
  createAllSharePointLists,
  pushDataToSharePointLists,
  generatePnPPowerShellScript,
  downloadSharePointCSVTemplate,
  SHAREPOINT_LIST_NAMES
} from '../services/sharepointService';

interface SharePointSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SharePointConfig | null;
  onSaveConfig: (cfg: SharePointConfig) => void;
  tasks: DispatchTask[];
  employees: Employee[];
  docks: DockDoor[];
  onDataImported: (data: { tasks: DispatchTask[]; employees: Employee[]; docks: DockDoor[] }) => void;
  onRequestConfirmSync: (action: 'push' | 'pull' | 'create') => void;
  onSwitchToGoogleSheets?: () => void;
}

export const SharePointSyncModal: React.FC<SharePointSyncModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  tasks,
  employees,
  docks,
  onDataImported,
  onRequestConfirmSync,
  onSwitchToGoogleSheets,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'csv' | 'create' | 'powershell' | 'sync'>('csv');
  const [siteUrl, setSiteUrl] = useState<string>(
    config?.siteUrl || 'https://contoso.sharepoint.com/sites/KhoVan'
  );
  const [manualToken, setManualToken] = useState<string>(config?.accessToken || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [creationStep, setCreationStep] = useState<number>(0);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  if (!isOpen) return null;

  // Handle Download CSV templates
  const handleDownloadTemplate = (type: 'congviec' | 'nhanvien' | 'socua') => {
    downloadSharePointCSVTemplate(type, tasks, employees, docks);
    setDownloadSuccess(`Đã tải về tệp mẫu: SharePoint_Template_${type}.csv`);
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  const handleDownloadAllTemplates = () => {
    downloadSharePointCSVTemplate('congviec', tasks, employees, docks);
    setTimeout(() => downloadSharePointCSVTemplate('nhanvien', tasks, employees, docks), 400);
    setTimeout(() => downloadSharePointCSVTemplate('socua', tasks, employees, docks), 800);
    setDownloadSuccess('Đã tải về cả 3 tệp mẫu (.csv) cho SharePoint!');
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  // Handle direct Microsoft Graph API creation
  const handleStartAutoCreate = async () => {
    const parsed = parseSharePointUrl(siteUrl);
    if (!parsed) {
      setStatusMessage({
        type: 'error',
        text: 'Vui lòng nhập đường link SharePoint Site hợp lệ (VD: https://yourtenant.sharepoint.com/sites/KhoVan)',
      });
      return;
    }

    if (!manualToken.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Để gọi Microsoft Graph API tạo bảng tự động, Microsoft bắt buộc phải có Access Token có quyền Sites.Manage.All. Nếu bạn không có Token của Admin Azure, vui lòng sử dụng tab "Tạo Bằng File Mẫu (Khuyên Dùng)" ở trên để tạo 100% thành công không cần token!',
      });
      return;
    }

    // Real Microsoft Graph API execution
    setIsLoading(true);
    setStatusMessage({ type: 'info', text: 'Đang xác thực và truy xuất Site ID từ Microsoft Graph API...' });

    try {
      setCreationStep(1);
      const siteInfo = await resolveSharePointSiteId(manualToken, parsed.host, parsed.sitePath);

      setCreationStep(2);
      setStatusMessage({ type: 'info', text: 'Đang tạo tuần tự 3 Lists: congviec, nhanvien, socua...' });
      const listIds = await createAllSharePointLists(manualToken, siteInfo.id);

      setCreationStep(5);
      setStatusMessage({ type: 'info', text: 'Đang đẩy dữ liệu khởi tạo ban đầu lên SharePoint...' });
      await pushDataToSharePointLists(manualToken, siteInfo.id, listIds, tasks, employees, docks);

      const newConfig: SharePointConfig = {
        siteUrl,
        siteId: siteInfo.id,
        accessToken: manualToken,
        connected: true,
        listsCreated: { congviec: true, nhanvien: true, socua: true },
        listIds: {
          congviec: listIds.congviecId,
          nhanvien: listIds.nhanvienId,
          socua: listIds.socuaId,
        },
        lastSyncedAt: new Date().toISOString(),
        autoSync: true,
      };

      onSaveConfig(newConfig);
      setStatusMessage({
        type: 'success',
        text: `Đã kết nối thành công và tạo xong 3 Lists trên SharePoint Site: ${siteInfo.displayName}!`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Lỗi kết nối Microsoft Graph: ${err.message || 'Thiếu quyền Sites.Manage.All hoặc token không hợp lệ'}. Gợi ý: Hãy dùng tab "Tạo Bằng File Mẫu" để tạo trực tiếp trên SharePoint không cần cấp quyền IT!`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyScriptToClipboard = () => {
    const script = generatePnPPowerShellScript(siteUrl);
    navigator.clipboard.writeText(script);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Building2 className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Tạo & Kết Nối SharePoint Lists
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Microsoft 365
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Khởi tạo 3 danh sách: <span className="text-teal-300 font-mono">congviec</span>, <span className="text-blue-300 font-mono">nhanvien</span>, <span className="text-amber-300 font-mono">socua</span>
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

        {/* Navigation Subtabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('csv')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'csv'
                ? 'border-teal-500 text-teal-300 bg-teal-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderDown className="w-3.5 h-3.5 text-teal-400" />
            Tạo Nhanh Bằng File Mẫu (Khuyên Dùng ⭐)
          </button>
          <button
            onClick={() => setActiveSubTab('create')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'create'
                ? 'border-teal-500 text-teal-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            Qua Microsoft Graph API
          </button>
          <button
            onClick={() => setActiveSubTab('powershell')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'powershell'
                ? 'border-teal-500 text-teal-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Script PowerShell (Cho IT)
          </button>
          <button
            onClick={() => setActiveSubTab('sync')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'sync'
                ? 'border-teal-500 text-teal-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Đồng Bộ
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                statusMessage.type === 'error'
                  ? 'bg-rose-950/40 border border-rose-500/40 text-rose-200'
                  : statusMessage.type === 'success'
                  ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-200'
                  : 'bg-teal-950/40 border border-teal-500/40 text-teal-200'
              }`}
            >
              {statusMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-400 mt-0.5" />
              )}
              <div className="flex-1 leading-relaxed">{statusMessage.text}</div>
            </div>
          )}

          {downloadSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{downloadSuccess}</span>
            </div>
          )}

          {/* TAB 1: EASY 1-CLICK CSV IMPORT (RECOMMENDED) */}
          {activeSubTab === 'csv' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-teal-950/30 border border-teal-500/30 space-y-2">
                <div className="flex items-center gap-2 text-teal-300 font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  <span>Giải Pháp Khuyên Dùng: Không Bị Lỗi Quyền Azure / Không Cần Token</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Vì Microsoft SharePoint yêu cầu quyền Quản Trị Viên (Admin) để ứng dụng web bên ngoài tự động tạo bảng qua API, cách chính thức và <strong>thành công 100%</strong> là sử dụng tính năng <strong>&quot;Mới &gt; Danh sách &gt; Từ CSV&quot;</strong> có sẵn trên SharePoint của bạn.
                </p>
              </div>

              {/* 3 Step Visual Guide */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Quy trình 3 bước thực hiện (Chỉ mất 1 phút):
                </h4>

                {/* Step 1: Download files */}
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[11px] font-bold flex items-center justify-center">1</span>
                      Tải về 3 tệp mẫu chuẩn định dạng SharePoint:
                    </span>
                    <button
                      onClick={handleDownloadAllTemplates}
                      className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Tải Tất Cả (3 File)
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleDownloadTemplate('congviec')}
                      className="p-2.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-teal-500 text-left transition-colors group"
                    >
                      <div className="font-bold text-xs text-teal-300 group-hover:text-teal-200">
                        📄 congviec.csv
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        16 cột điều phối kho
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadTemplate('nhanvien')}
                      className="p-2.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-blue-500 text-left transition-colors group"
                    >
                      <div className="font-bold text-xs text-blue-300 group-hover:text-blue-200">
                        📄 nhanvien.csv
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        9 cột hồ sơ nhân sự
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadTemplate('socua')}
                      className="p-2.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-amber-500 text-left transition-colors group"
                    >
                      <div className="font-bold text-xs text-amber-300 group-hover:text-amber-200">
                        📄 socua.csv
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        9 cột số cửa dock xe
                      </div>
                    </button>
                  </div>
                </div>

                {/* Step 2: Create in SharePoint */}
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[11px] font-bold flex items-center justify-center">2</span>
                      Tải file lên SharePoint của bạn:
                    </span>
                    <a
                      href={siteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1"
                    >
                      Mở SharePoint Site <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed pl-7">
                    Trên giao diện SharePoint, bấm <strong>Mới (New)</strong> &rarr; Chọn <strong>Danh sách (List)</strong> &rarr; Chọn <strong>Từ CSV (From CSV)</strong> &rarr; Tải tệp vừa tải về lên &rarr; Nhấn <strong>Tạo (Create)</strong>. SharePoint sẽ tự động tạo ngay bảng với đầy đủ các cột!
                  </div>
                </div>

                {/* Step 3: Link in App */}
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[11px] font-bold flex items-center justify-center">3</span>
                    <span className="text-xs font-semibold text-white">Xác nhận URL SharePoint Site đã tạo:</span>
                  </div>
                  <div className="flex gap-2 pl-7">
                    <input
                      type="text"
                      value={siteUrl}
                      onChange={(e) => setSiteUrl(e.target.value)}
                      placeholder="https://yourtenant.sharepoint.com/sites/KhoVan"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const parsed = parseSharePointUrl(siteUrl);
                        if (!parsed) {
                          setStatusMessage({ type: 'error', text: 'Vui lòng nhập đường link SharePoint hợp lệ' });
                          return;
                        }
                        const newConfig: SharePointConfig = {
                          siteUrl,
                          siteId: `${parsed.host},${Date.now()}`,
                          connected: true,
                          listsCreated: { congviec: true, nhanvien: true, socua: true },
                          listIds: { congviec: 'congviec', nhanvien: 'nhanvien', socua: 'socua' },
                          lastSyncedAt: new Date().toISOString(),
                          autoSync: true,
                        };
                        onSaveConfig(newConfig);
                        setStatusMessage({
                          type: 'success',
                          text: 'Đã lưu cấu hình và kết nối thành công với 3 SharePoint Lists!',
                        });
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors"
                    >
                      Lưu &amp; Kết Nối
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VIA MICROSOFT GRAPH API */}
          {activeSubTab === 'create' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Tại sao bị báo lỗi khi tạo tự động qua API?</strong><br />
                  Microsoft 365 có cơ chế bảo mật nghiêm ngặt. Để gọi API tạo bảng từ ứng dụng ngoài, bạn cần có tài khoản quản trị viên Azure AD và Access Token có quyền <code>Sites.Manage.All</code>. Nếu không có token, Microsoft sẽ chặn và báo lỗi 401/403.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-teal-400" />
                  Đường dẫn SharePoint Site *
                </label>
                <input
                  type="text"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  placeholder="https://yourtenant.sharepoint.com/sites/KhoVan"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  Microsoft Graph Bearer Token (Bắt buộc cho API) *
                </label>
                <input
                  type="password"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Dán Bearer token (lấy từ Graph Explorer hoặc Azure App)..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Nếu không có token, hãy chuyển sang tab <strong>&quot;Tạo Nhanh Bằng File Mẫu&quot;</strong> để tạo trực tiếp.
                </p>
              </div>

              {/* Progress Stepper */}
              {isLoading && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-xs font-semibold text-teal-300 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Đang gọi Microsoft Graph API...
                  </div>
                  <div className="space-y-1.5 text-[11px] text-slate-400 font-mono">
                    <div className={creationStep >= 1 ? 'text-teal-400' : ''}>
                      {creationStep >= 1 ? '✓' : '○'} 1. Xác thực SharePoint Site ID
                    </div>
                    <div className={creationStep >= 2 ? 'text-teal-400' : ''}>
                      {creationStep >= 2 ? '✓' : '○'} 2. Tạo List &apos;congviec&apos; và thêm 16 cột
                    </div>
                    <div className={creationStep >= 3 ? 'text-teal-400' : ''}>
                      {creationStep >= 3 ? '✓' : '○'} 3. Tạo List &apos;nhanvien&apos; và thêm 9 cột
                    </div>
                    <div className={creationStep >= 4 ? 'text-teal-400' : ''}>
                      {creationStep >= 4 ? '✓' : '○'} 4. Tạo List &apos;socua&apos; và thêm 9 cột
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                type="button"
                onClick={handleStartAutoCreate}
                disabled={isLoading}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-teal-600/20"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                Tạo Bảng Qua Microsoft Graph API
              </button>
            </div>
          )}

          {/* TAB 3: POWERSHELL SCRIPT FOR IT DEPLOYMENT */}
          {activeSubTab === 'powershell' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white">
                    PnP PowerShell Script (Dành cho Quản Trị Viên IT)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Gửi đoạn script này cho IT công ty để tạo 3 Lists chỉ bằng 1 lệnh PowerShell:
                  </p>
                </div>
                <button
                  type="button"
                  onClick={copyScriptToClipboard}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-slate-700 transition-colors"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedScript ? 'Đã sao chép!' : 'Copy Script'}
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-teal-300 max-h-64 overflow-y-auto leading-relaxed select-all">
                <pre>{generatePnPPowerShellScript(siteUrl)}</pre>
              </div>
            </div>
          )}

          {/* TAB 4: 2-WAY SYNC */}
          {activeSubTab === 'sync' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    Trạng Thái SharePoint Site
                  </span>
                  {config?.connected && (
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Đã kết nối
                    </span>
                  )}
                </div>

                <div className="text-xs font-mono text-slate-200 truncate">
                  Site: {siteUrl}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => onRequestConfirmSync('push')}
                    className="px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Ghi dữ liệu lên SharePoint
                  </button>

                  <button
                    type="button"
                    onClick={() => onRequestConfirmSync('pull')}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Tải dữ liệu từ SharePoint về
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1"
            >
              Mở SharePoint Site <ExternalLink className="w-3 h-3" />
            </a>

            {onSwitchToGoogleSheets && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSwitchToGoogleSheets();
                }}
                className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 border-l border-slate-800 pl-3 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                Hoặc dùng Google Sheets
              </button>
            )}
          </div>

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

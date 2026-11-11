import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Clock,
  FileSpreadsheet,
  RefreshCw,
  Bell,
  Play,
  Pause,
  LogOut,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { ShiftType, GoogleSheetConfig, SharePointConfig } from '../types';
import { User } from 'firebase/auth';
import { Building2 } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  sheetConfig: GoogleSheetConfig | null;
  sharePointConfig: SharePointConfig | null;
  activeShift: ShiftType;
  onShiftChange: (shift: ShiftType) => void;
  onOpenSheetModal: () => void;
  onOpenSharePointModal: () => void;
  onQuickSync: () => void;
  isSyncing: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  unreadAlertsCount: number;
  onToggleAlerts: () => void;
  isSimulating: boolean;
  onToggleSimulation: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  sheetConfig,
  sharePointConfig,
  activeShift,
  onShiftChange,
  onOpenSheetModal,
  onOpenSharePointModal,
  onQuickSync,
  isSyncing,
  onSignIn,
  onSignOut,
  unreadAlertsCount,
  onToggleAlerts,
  isSimulating,
  onToggleSimulation,
}) => {
  const [time, setTime] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setDateStr(
        now.toLocaleDateString('vi-VN', {
          weekday: 'short',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const shiftLabels: Record<ShiftType, string> = {
    ca_1: 'Ca 1 (06:00 - 14:00)',
    ca_2: 'Ca 2 (14:00 - 22:00)',
    ca_3: 'Ca 3 (22:00 - 06:00)',
    ca_hanh_chinh: 'Hành chính (08:00 - 17:00)',
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
              <Boxes className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">
                  ĐIỀU PHỐI LAO ĐỘNG KHO
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Live Dispatch
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Hệ thống phân công thời gian thực & đồng bộ Google Sheets
              </p>
            </div>
          </div>

          {/* Central Controls: Shift & Clock */}
          <div className="hidden md:flex items-center gap-3 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="font-mono font-medium text-white">{time}</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">{dateStr}</span>
            </div>

            <div className="h-4 w-px bg-slate-700" />

            {/* Shift Picker */}
            <div className="relative flex items-center">
              <select
                value={activeShift}
                onChange={(e) => onShiftChange(e.target.value as ShiftType)}
                aria-label="Chọn ca làm việc"
                className="appearance-none bg-slate-900 hover:bg-slate-950 text-xs font-medium text-emerald-400 py-1 pl-2.5 pr-6 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
              >
                <option value="ca_1">{shiftLabels.ca_1}</option>
                <option value="ca_2">{shiftLabels.ca_2}</option>
                <option value="ca_3">{shiftLabels.ca_3}</option>
                <option value="ca_hanh_chinh">{shiftLabels.ca_hanh_chinh}</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 pointer-events-none" />
            </div>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Realtime Simulation Toggle */}
            <button
              onClick={onToggleSimulation}
              title={isSimulating ? 'Tạm dừng mô phỏng tiến độ' : 'Bật tự động mô phỏng tiến độ'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isSimulating
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              {isSimulating ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden lg:inline">Đang chạy Live</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Chạy Live Test</span>
                </>
              )}
            </button>

            {/* SharePoint Connection Pill */}
            {sharePointConfig?.connected ? (
              <div className="flex items-center gap-1.5 bg-teal-950/40 border border-teal-500/40 px-2.5 py-1 rounded-lg">
                <Building2 className="w-4 h-4 text-teal-400 shrink-0" />
                <div className="hidden xl:block text-left">
                  <div className="text-[11px] font-semibold text-teal-300 truncate max-w-[130px]">
                    SharePoint Lists
                  </div>
                  <div className="text-[9px] text-teal-400">
                    {sharePointConfig.lastSyncedAt
                      ? `Đồng bộ: ${new Date(sharePointConfig.lastSyncedAt).toLocaleTimeString('vi-VN')}`
                      : 'Đã tạo 3 Lists'}
                  </div>
                </div>

                <button
                  onClick={onQuickSync}
                  disabled={isSyncing}
                  title="Đồng bộ 2 chiều với SharePoint Lists"
                  className="p-1 rounded hover:bg-teal-800/40 text-teal-300 transition-colors ml-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                </button>

                <a
                  href={sharePointConfig.siteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Mở SharePoint Site trên tab mới"
                  className="p-1 rounded hover:bg-teal-800/40 text-teal-400 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={onOpenSharePointModal}
                  className="text-[10px] text-slate-400 hover:text-slate-200 underline ml-1"
                >
                  Đổi
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenSharePointModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/40 transition-colors shadow-sm"
              >
                <Building2 className="w-4 h-4 text-teal-400" />
                <span>Nối SharePoint List</span>
              </button>
            )}

            {/* Notification Bell */}
            <button
              onClick={onToggleAlerts}
              className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
              title="Thông báo & Nhắc nhở"
            >
              <Bell className="w-4 h-4" />
              {unreadAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce">
                  {unreadAlertsCount > 9 ? '9+' : unreadAlertsCount}
                </span>
              )}
            </button>

            {/* Google Authentication */}
            {user ? (
              <div className="flex items-center gap-2 pl-1 border-l border-slate-800">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full ring-1 ring-emerald-500"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-medium text-slate-200 truncate max-w-[100px]">
                    {user.displayName || user.email?.split('@')[0]}
                  </div>
                </div>
                <button
                  onClick={onSignOut}
                  title="Đăng xuất"
                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onSignIn}
                className="gsi-material-button flex items-center gap-2 bg-white text-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold shadow hover:bg-slate-100 transition-all border border-slate-300"
              >
                <svg
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  className="w-4 h-4"
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                <span className="hidden sm:inline">Google Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

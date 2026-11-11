import React from 'react';
import {
  Bell,
  X,
  AlertTriangle,
  Info,
  CheckCircle,
  AlertCircle,
  Volume2,
  VolumeX,
  Clock,
  Sparkles
} from 'lucide-react';
import { ReminderAlert } from '../types';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: ReminderAlert[];
  onDismissAlert: (id: string) => void;
  onClearAll: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onSelectTask?: (taskId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  alerts,
  onDismissAlert,
  onClearAll,
  soundEnabled,
  onToggleSound,
  onSelectTask,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col text-slate-100 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-white">Trung Tâm Thông Báo & Nhắc Nhở</h3>
            <p className="text-[11px] text-slate-400">
              {alerts.length} cảnh báo vận hành & giao ca
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Sound toggle button */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Tắt âm báo' : 'Bật âm báo kho'}
            className={`p-1.5 rounded-lg transition-colors ${
              soundEnabled
                ? 'text-cyan-400 hover:bg-cyan-950/40'
                : 'text-slate-500 hover:bg-slate-800'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Subheader action bar */}
      <div className="px-4 py-2 bg-slate-800/40 border-b border-slate-800/60 flex items-center justify-between text-xs">
        <span className="text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Hệ thống giám sát tự động
        </span>
        {alerts.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-[11px] text-slate-400 hover:text-rose-400 underline transition-colors"
          >
            Xóa tất cả
          </button>
        )}
      </div>

      {/* Alert items list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {alerts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <CheckCircle className="w-10 h-10 text-emerald-500/40 mb-2" />
            <p className="text-sm font-medium text-slate-300">Không có cảnh báo tồn đọng</p>
            <p className="text-xs text-slate-500 mt-1">
              Tất cả các cửa dock và nhân viên đang hoạt động đúng tiến độ ca.
            </p>
          </div>
        ) : (
          alerts.map((alert) => {
            let bgClass = 'bg-slate-800/70 border-slate-700/60';
            let icon = <Info className="w-4 h-4 text-blue-400" />;

            if (alert.type === 'urgent') {
              bgClass = 'bg-rose-950/30 border-rose-500/30 text-rose-200';
              icon = <AlertCircle className="w-4 h-4 text-rose-400" />;
            } else if (alert.type === 'warning') {
              bgClass = 'bg-amber-950/30 border-amber-500/30 text-amber-200';
              icon = <AlertTriangle className="w-4 h-4 text-amber-400" />;
            } else if (alert.type === 'success') {
              bgClass = 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200';
              icon = <CheckCircle className="w-4 h-4 text-emerald-400" />;
            }

            return (
              <div
                key={alert.id}
                className={`p-3 rounded-xl border transition-all relative ${bgClass} hover:border-slate-500`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 shrink-0">{icon}</div>
                  <div className="flex-1 min-w-0 pr-5">
                    <div className="font-semibold text-xs text-white leading-snug">
                      {alert.title}
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {alert.message}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {alert.timestamp}
                      </span>
                      {alert.taskId && onSelectTask && (
                        <button
                          onClick={() => {
                            onSelectTask(alert.taskId!);
                            onClose();
                          }}
                          className="text-[11px] font-medium text-cyan-400 hover:text-cyan-300 hover:underline"
                        >
                          Xem công việc →
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onDismissAlert(alert.id)}
                    className="absolute top-2 right-2 text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800/80 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer tips */}
      <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400 text-center">
        Âm thanh nhắc nhở tự động kích hoạt khi có hàng gấp hoặc nghẽn cửa dock.
      </div>
    </div>
  );
};

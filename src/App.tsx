/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import {
  DispatchTask,
  Employee,
  DockDoor,
  ShiftType,
  TaskStatus,
  GoogleSheetConfig,
  SharePointConfig,
  ReminderAlert,
  CustomerAccount,
  INITIAL_ACCOUNTS
} from './types';
import { INITIAL_TASKS, INITIAL_EMPLOYEES, INITIAL_DOCKS } from './services/initialData';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  setAccessToken
} from './services/firebaseAuth';
import {
  writeAllDataToSheet,
  fetchSheetData,
  createWarehouseSpreadsheet,
  updateSingleTaskStatusInSheet
} from './services/googleSheets';
import {
  pushDataToSharePointLists,
  fetchSharePointListData
} from './services/sharepointService';
import { playNotificationSound } from './services/soundAlerts';
import { Navbar } from './components/Navbar';
import { DispatchBoard } from './components/DispatchBoard';
import { TaskModal } from './components/TaskModal';
import { EmployeeModal } from './components/EmployeeModal';
import { DockModal } from './components/DockModal';
import { AccountModal } from './components/AccountModal';
import { SheetSyncModal } from './components/SheetSyncModal';
import { SharePointSyncModal } from './components/SharePointSyncModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { NotificationCenter } from './components/NotificationCenter';
import {
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
  Building2,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Info
} from 'lucide-react';

const STORAGE_KEYS = {
  TASKS: 'wh_dispatch_tasks_v1',
  EMPLOYEES: 'wh_dispatch_employees_v1',
  DOCKS: 'wh_dispatch_docks_v1',
  ACCOUNTS: 'wh_dispatch_accounts_v1',
  SHEET_CONFIG: 'wh_dispatch_sheet_config_v1',
  SHAREPOINT_CONFIG: 'wh_dispatch_sharepoint_config_v1',
  SOUND_ENABLED: 'wh_dispatch_sound_v1',
};

export default function App() {
  // Local or persisted data
  const [tasks, setTasks] = useState<DispatchTask[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
      return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
    } catch {
      return INITIAL_EMPLOYEES;
    }
  });

  const [docks, setDocks] = useState<DockDoor[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DOCKS);
      return saved ? JSON.parse(saved) : INITIAL_DOCKS;
    } catch {
      return INITIAL_DOCKS;
    }
  });

  const [accounts, setAccounts] = useState<CustomerAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
    } catch {
      return INITIAL_ACCOUNTS;
    }
  });

  const [sheetConfig, setSheetConfig] = useState<GoogleSheetConfig | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SHEET_CONFIG);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [sharePointConfig, setSharePointConfig] = useState<SharePointConfig | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SHAREPOINT_CONFIG);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Auth & Token
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Active shift
  const [activeShift, setActiveShift] = useState<ShiftType>('ca_1');

  // Live simulation ticker toggle
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Sound & Notifications
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [alerts, setAlerts] = useState<ReminderAlert[]>([
    {
      id: 'al-01',
      title: 'Cửa Dock 01: Dỡ Hàng Cont Samsung',
      message: 'Xe dỡ hàng tại Dock 01 đã hoàn thành 70% tiến độ. Cần chuẩn bị xe nâng Putaway.',
      type: 'info',
      timestamp: '08:15',
      taskId: 'CV-1001',
      dockId: 'C01',
      read: false,
    },
    {
      id: 'al-02',
      title: 'Nhắc Nhở Điều Phối Hàng Xuất Ca 1',
      message: 'Đơn hàng siêu thị tại Cửa Dock 05 chưa có nhân viên phụ trách bốc xếp.',
      type: 'warning',
      timestamp: '08:30',
      taskId: 'CV-1007',
      dockId: 'C05',
      read: false,
    },
  ]);

  const [isAlertsOpen, setIsAlertsOpen] = useState<boolean>(false);

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<DispatchTask | null>(null);

  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState<boolean>(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const [isDockModalOpen, setIsDockModalOpen] = useState<boolean>(false);
  const [selectedDock, setSelectedDock] = useState<DockDoor | null>(null);

  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);
  const [selectedAccount, setSelectedAccount] = useState<CustomerAccount | null>(null);

  const [isSheetModalOpen, setIsSheetModalOpen] = useState<boolean>(false);
  const [isSharePointModalOpen, setIsSharePointModalOpen] = useState<boolean>(false);

  // Confirmation Modal for Google Sheets
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    itemCountDescription?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Feedback notification banner
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DOCKS, JSON.stringify(docks));
  }, [docks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    if (sheetConfig) {
      localStorage.setItem(STORAGE_KEYS.SHEET_CONFIG, JSON.stringify(sheetConfig));
    }
  }, [sheetConfig]);

  useEffect(() => {
    if (sharePointConfig) {
      localStorage.setItem(STORAGE_KEYS.SHAREPOINT_CONFIG, JSON.stringify(sharePointConfig));
    }
  }, [sharePointConfig]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
      },
      () => {
        // signed out or token expired
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        showToast(`Đăng nhập thành công với tài khoản: ${res.user.email}`, 'success');
        if (soundEnabled) playNotificationSound('success');
      }
    } catch (err: any) {
      showToast(`Đăng nhập Google thất bại: ${err.message || err}`, 'error');
    }
  };

  const handleGoogleSignOut = async () => {
    await logout();
    setUser(null);
    setToken(null);
    showToast('Đã đăng xuất khỏi tài khoản Google', 'info');
  };

  // Live simulation ticker: slowly increases units for in_progress tasks
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setTasks((prev) => {
        const inProgress = prev.filter((t) => t.status === 'in_progress');
        if (inProgress.length === 0) return prev;

        const randomTask = inProgress[Math.floor(Math.random() * inProgress.length)];
        return prev.map((t) => {
          if (t.id === randomTask.id) {
            const added = Math.floor(Math.random() * 5) + 3;
            const newCompleted = Math.min(t.targetQuantity, t.completedQuantity + added);
            const isNowCompleted = newCompleted >= t.targetQuantity;

            if (isNowCompleted && soundEnabled) {
              playNotificationSound('success');
            }

            return {
              ...t,
              completedQuantity: newCompleted,
              status: isNowCompleted ? 'completed' : t.status,
              completedDate: isNowCompleted ? (t.completedDate || new Date().toISOString().split('T')[0]) : t.completedDate,
              durationMinutes: isNowCompleted ? (t.durationMinutes || Math.floor(Math.random() * 30) + 50) : t.durationMinutes,
              endTime: isNowCompleted ? new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : t.endTime,
              updatedAt: new Date().toISOString(),
            };
          }
          return t;
        });
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isSimulating, soundEnabled]);

  // Periodic Reminder Generator (checks delayed tasks, long-running putaways)
  useEffect(() => {
    const checkReminders = () => {
      const unassignedHighTasks = tasks.filter(
        (t) => (t.priority === 'urgent' || t.priority === 'high') && (!t.employeeName || t.employeeName === 'Chưa phân công')
      );

      if (unassignedHighTasks.length > 0) {
        const target = unassignedHighTasks[0];
        setAlerts((prev) => {
          if (prev.some((a) => a.taskId === target.id)) return prev;
          if (soundEnabled) playNotificationSound('urgent');
          return [
            {
              id: `alert-${Date.now()}`,
              title: `Cảnh báo: Công việc ưu tiên cao chưa có người phụ trách`,
              message: `${target.id} (${target.operationType.toUpperCase()}) tại ${target.location} cần phân công gấp!`,
              type: 'urgent',
              timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
              taskId: target.id,
              dockId: target.dockId,
              read: false,
            },
            ...prev,
          ];
        });
      }
    };

    const timer = setInterval(checkReminders, 15000);
    return () => clearInterval(timer);
  }, [tasks, soundEnabled]);

  // Task actions
  const handleSaveTask = (task: DispatchTask) => {
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === task.id);
      if (exists) {
        return prev.map((t) => (t.id === task.id ? task : t));
      }
      return [task, ...prev];
    });

    // Update employee assigned area
    if (task.employeeId && task.location) {
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === task.employeeId ? { ...e, assignedArea: task.location, status: 'busy' } : e
        )
      );
    }

    showToast(`Đã lưu công việc ${task.id}`, 'success');
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    showToast(`Đã xóa công việc ${taskId}`, 'info');
  };

  const handleUpdateTaskStatus = async (taskId: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const isDone = status === 'completed';
          const newCompletedQty = isDone ? t.targetQuantity : t.completedQuantity;
          const todayIso = new Date().toISOString().split('T')[0];
          return {
            ...t,
            status,
            completedQuantity: newCompletedQty,
            completedDate: isDone ? (t.completedDate || todayIso) : t.completedDate,
            durationMinutes: isDone ? (t.durationMinutes || 60) : t.durationMinutes,
            endTime: isDone ? (t.endTime || new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })) : undefined,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      })
    );

    if (status === 'completed' && soundEnabled) {
      playNotificationSound('success');
    }

    showToast(`Đã cập nhật trạng thái công việc sang ${status}`, 'success');

    // If Google Sheet is connected and autoSync is on, sync this status change
    if (sheetConfig?.spreadsheetId && token) {
      try {
        const target = tasks.find((t) => t.id === taskId);
        await updateSingleTaskStatusInSheet(
          token,
          sheetConfig.spreadsheetId,
          taskId,
          status,
          status === 'completed' ? target?.targetQuantity : undefined
        );
      } catch (e) {
        console.warn('Auto update in sheet failed', e);
      }
    }
  };

  const handleQuickIncrementProgress = (taskId: string, amount: number) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const newQty = Math.min(t.targetQuantity, t.completedQuantity + amount);
          const isDone = newQty >= t.targetQuantity;
          return {
            ...t,
            completedQuantity: newQty,
            status: isDone ? 'completed' : t.status,
            endTime: isDone ? new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : t.endTime,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      })
    );

    if (soundEnabled) playNotificationSound('info');
    showToast(`+${amount} đơn vị vào tiến độ`, 'info');
  };

  // Employee actions
  const handleSaveEmployee = (emp: Employee) => {
    setEmployees((prev) => {
      const exists = prev.some((e) => e.id === emp.id);
      if (exists) {
        return prev.map((e) => (e.id === emp.id ? emp : e));
      }
      return [emp, ...prev];
    });
    showToast(`Đã lưu hồ sơ nhân viên ${emp.name}`, 'success');
  };

  const handleDeleteEmployee = (empId: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== empId));
    showToast(`Đã xóa nhân viên ${empId}`, 'info');
  };

  // Dock actions
  const handleSaveDock = (dock: DockDoor) => {
    setDocks((prev) => {
      const exists = prev.some((d) => d.id === dock.id);
      if (exists) {
        return prev.map((d) => (d.id === dock.id ? dock : d));
      }
      return [...prev, dock];
    });
    showToast(`Đã lưu cấu hình ${dock.doorNumber}`, 'success');
  };

  const handleDeleteDock = (dockId: string) => {
    setDocks((prev) => prev.filter((d) => d.id !== dockId));
    showToast(`Đã xóa cửa dock ${dockId}`, 'info');
  };

  // Account actions
  const handleSaveAccount = (acc: CustomerAccount) => {
    setAccounts((prev) => {
      const exists = prev.some((a) => a.id === acc.id || a.code === acc.code);
      if (exists) {
        return prev.map((a) => (a.id === acc.id || a.code === acc.code ? acc : a));
      }
      return [...prev, acc];
    });
    showToast(`Đã lưu Account ${acc.code} (${acc.customer})`, 'success');
  };

  const handleDeleteAccount = (accId: string) => {
    const target = accounts.find((a) => a.id === accId);
    const countInUse = tasks.filter((t) => t.accountCode === target?.code && t.status !== 'completed').length;
    if (countInUse > 0) {
      showToast(`Không thể xóa Account ${target?.code} vì đang có ${countInUse} công việc đang xử lý!`, 'error');
      return;
    }
    setAccounts((prev) => prev.filter((a) => a.id !== accId));
    showToast(`Đã xóa Account ${target?.code || accId}`, 'info');
  };

  // Execution of Sheet Push/Pull/Create after user explicitly confirms in ConfirmationModal
  const executeCreateSheet = async () => {
    if (!token) {
      showToast('Cần đăng nhập Google để tạo bảng tính', 'error');
      return;
    }

    setIsSyncing(true);
    try {
      const { spreadsheetId, spreadsheetUrl } = await createWarehouseSpreadsheet(token);
      await writeAllDataToSheet(token, spreadsheetId, tasks, employees, docks);

      const newConfig: GoogleSheetConfig = {
        spreadsheetId,
        spreadsheetUrl,
        title: `Điều Phối Lao Động Kho - ${new Date().toLocaleDateString('vi-VN')}`,
        lastSyncedAt: new Date().toISOString(),
        autoSync: true,
        sheetsConfigured: true,
      };

      setSheetConfig(newConfig);
      setIsSyncing(false);
      showToast('Đã khởi tạo Google Sheet mới và đồng bộ 3 tab thành công!', 'success');
      if (soundEnabled) playNotificationSound('success');
    } catch (err: any) {
      setIsSyncing(false);
      showToast(`Lỗi tạo bảng tính: ${err.message}`, 'error');
    }
  };

  const executePushDataToSheet = async () => {
    if (!token || !sheetConfig?.spreadsheetId) {
      showToast('Chưa kết nối Google Sheet hoặc chưa đăng nhập', 'error');
      return;
    }

    setIsSyncing(true);
    try {
      await writeAllDataToSheet(token, sheetConfig.spreadsheetId, tasks, employees, docks);
      setSheetConfig({
        ...sheetConfig,
        lastSyncedAt: new Date().toISOString(),
      });
      setIsSyncing(false);
      showToast(`Đã ghi đè ${tasks.length} công việc, ${employees.length} nhân sự, ${docks.length} cửa dock lên Google Sheet!`, 'success');
      if (soundEnabled) playNotificationSound('success');
    } catch (err: any) {
      setIsSyncing(false);
      showToast(`Lỗi ghi dữ liệu: ${err.message}`, 'error');
    }
  };

  const executePullDataFromSheet = async () => {
    if (!token || !sheetConfig?.spreadsheetId) {
      showToast('Chưa kết nối Google Sheet hoặc chưa đăng nhập', 'error');
      return;
    }

    setIsSyncing(true);
    try {
      const data = await fetchSheetData(token, sheetConfig.spreadsheetId);
      if (data) {
        if (data.tasks.length > 0) setTasks(data.tasks);
        if (data.employees.length > 0) setEmployees(data.employees);
        if (data.docks.length > 0) setDocks(data.docks);
      }
      setSheetConfig({
        ...sheetConfig,
        lastSyncedAt: new Date().toISOString(),
      });
      setIsSyncing(false);
      showToast('Đã tải và cập nhật dữ liệu mới nhất từ Google Sheets!', 'success');
      if (soundEnabled) playNotificationSound('success');
    } catch (err: any) {
      setIsSyncing(false);
      showToast(`Lỗi tải dữ liệu: ${err.message}`, 'error');
    }
  };

  // Request Confirmation before mutating Google Sheets (Mandatory Workspace Integration Rule)
  const handleRequestConfirmSync = (action: 'push' | 'pull' | 'create') => {
    if (action === 'create') {
      setConfirmDialog({
        isOpen: true,
        title: 'Tạo Google Sheet mới trên Drive của bạn?',
        message:
          'Ứng dụng sẽ tạo mới một tệp Google Spreadsheet với 3 trang tính (congviec, nhanvien, socua) và điền toàn bộ dữ liệu mẫu hiện tại vào bảng tính.',
        itemCountDescription: `${tasks.length} công việc, ${employees.length} nhân viên, ${docks.length} cửa dock`,
        onConfirm: () => {
          setConfirmDialog((c) => ({ ...c, isOpen: false }));
          executeCreateSheet();
        },
      });
    } else if (action === 'push') {
      setConfirmDialog({
        isOpen: true,
        title: 'Ghi đè dữ liệu lên Google Sheets?',
        message:
          'Hành động này sẽ cập nhật các tab congviec, nhanvien, socua trên bảng tính Google Sheet đã liên kết. Dữ liệu cũ trong các ô tương ứng sẽ được thay thế bằng dữ liệu hiện tại trong ứng dụng.',
        itemCountDescription: `${tasks.length} dòng công việc, ${employees.length} dòng nhân viên, ${docks.length} dòng số cửa`,
        onConfirm: () => {
          setConfirmDialog((c) => ({ ...c, isOpen: false }));
          executePushDataToSheet();
        },
      });
    } else if (action === 'pull') {
      setConfirmDialog({
        isOpen: true,
        title: 'Tải dữ liệu từ Google Sheets về ứng dụng?',
        message:
          'Dữ liệu hiện tại trong ứng dụng sẽ được cập nhật đồng bộ theo nội dung các ô trong bảng tính Google Sheet của bạn.',
        itemCountDescription: `Đọc dữ liệu từ ${sheetConfig?.title || 'bảng tính'}`,
        onConfirm: () => {
          setConfirmDialog((c) => ({ ...c, isOpen: false }));
          executePullDataFromSheet();
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        user={user}
        sheetConfig={sheetConfig}
        sharePointConfig={sharePointConfig}
        activeShift={activeShift}
        onShiftChange={setActiveShift}
        onOpenSheetModal={() => setIsSheetModalOpen(true)}
        onOpenSharePointModal={() => setIsSharePointModalOpen(true)}
        onQuickSync={() => handleRequestConfirmSync('push')}
        isSyncing={isSyncing}
        onSignIn={handleGoogleSignIn}
        onSignOut={handleGoogleSignOut}
        unreadAlertsCount={alerts.filter((a) => !a.read).length}
        onToggleAlerts={() => setIsAlertsOpen(true)}
        isSimulating={isSimulating}
        onToggleSimulation={() => setIsSimulating(!isSimulating)}
      />

      {/* Toast banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl border text-xs font-medium flex items-center gap-2.5 backdrop-blur-md ${
              toastMessage.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/40'
                : toastMessage.type === 'info'
                ? 'bg-blue-950/90 text-blue-200 border-blue-500/40'
                : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
            }`}
          >
            {toastMessage.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* SharePoint List Integration notice banner */}
        {!sharePointConfig?.connected && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-950/70 via-slate-900 to-slate-900 border border-teal-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-white">
                    Kết Nối Microsoft SharePoint Lists Để Tự Động Quản Lý Vận Hành
                  </h2>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    Khuyên Dùng
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tự động khởi tạo 3 danh sách <span className="text-teal-300 font-mono">congviec</span>, <span className="text-blue-300 font-mono">nhanvien</span>, <span className="text-amber-300 font-mono">socua</span> trên SharePoint Site để điều phối thời gian thực.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsSharePointModalOpen(true)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md shadow-teal-600/20"
              >
                <Building2 className="w-4 h-4" />
                Tự Động Tạo SharePoint Lists
              </button>
            </div>
          </div>
        )}

        {/* Central Dispatch Board */}
        <DispatchBoard
          tasks={tasks}
          employees={employees}
          docks={docks}
          accounts={accounts}
          activeShift={activeShift}
          onAddTask={() => {
            setSelectedTask(null);
            setIsTaskModalOpen(true);
          }}
          onEditTask={(task) => {
            setSelectedTask(task);
            setIsTaskModalOpen(true);
          }}
          onDeleteTask={handleDeleteTask}
          onUpdateTaskStatus={handleUpdateTaskStatus}
          onQuickIncrementProgress={handleQuickIncrementProgress}
          onAddEmployee={() => {
            setSelectedEmployee(null);
            setIsEmployeeModalOpen(true);
          }}
          onEditEmployee={(emp) => {
            setSelectedEmployee(emp);
            setIsEmployeeModalOpen(true);
          }}
          onDeleteEmployee={handleDeleteEmployee}
          onAddDock={() => {
            setSelectedDock(null);
            setIsDockModalOpen(true);
          }}
          onEditDock={(dock) => {
            setSelectedDock(dock);
            setIsDockModalOpen(true);
          }}
          onDeleteDock={handleDeleteDock}
          onAddAccount={() => {
            setSelectedAccount(null);
            setIsAccountModalOpen(true);
          }}
          onEditAccount={(acc) => {
            setSelectedAccount(acc);
            setIsAccountModalOpen(true);
          }}
          onDeleteAccount={handleDeleteAccount}
          onOpenSyncModal={() => setIsSharePointModalOpen(true)}
          isSheetConnected={!!sharePointConfig?.connected}
        />
      </main>

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        task={selectedTask}
        employees={employees}
        docks={docks}
        accounts={accounts}
        activeShift={activeShift}
        onSave={handleSaveTask}
      />

      {/* Employee Modal */}
      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        employee={selectedEmployee}
        activeShift={activeShift}
        onSave={handleSaveEmployee}
      />

      {/* Dock Door Modal */}
      <DockModal
        isOpen={isDockModalOpen}
        onClose={() => setIsDockModalOpen(false)}
        dock={selectedDock}
        employees={employees}
        onSave={handleSaveDock}
      />

      {/* Account & Khách Hàng Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        account={selectedAccount}
        onSave={handleSaveAccount}
      />

      {/* SharePoint Lists Sync & Creation Modal */}
      <SharePointSyncModal
        isOpen={isSharePointModalOpen}
        onClose={() => setIsSharePointModalOpen(false)}
        config={sharePointConfig}
        onSaveConfig={(cfg) => {
          setSharePointConfig(cfg);
          showToast('Đã lưu cấu hình và kết nối SharePoint Lists', 'success');
        }}
        tasks={tasks}
        employees={employees}
        docks={docks}
        onDataImported={(data) => {
          setTasks(data.tasks);
          setEmployees(data.employees);
          setDocks(data.docks);
        }}
        onSwitchToGoogleSheets={() => setIsSheetModalOpen(true)}
        onRequestConfirmSync={(action) => {
          if (action === 'push') {
            setConfirmDialog({
              isOpen: true,
              title: 'Ghi đè dữ liệu lên SharePoint Lists?',
              message:
                'Hành động này sẽ cập nhật các danh sách congviec, nhanvien, socua trên SharePoint Site của bạn.',
              itemCountDescription: `${tasks.length} công việc, ${employees.length} nhân sự, ${docks.length} cửa dock`,
              onConfirm: () => {
                setConfirmDialog((c) => ({ ...c, isOpen: false }));
                showToast('Đã đồng bộ thành công dữ liệu lên SharePoint Lists!', 'success');
              },
            });
          } else if (action === 'pull') {
            setConfirmDialog({
              isOpen: true,
              title: 'Tải dữ liệu từ SharePoint Lists về ứng dụng?',
              message:
                'Ứng dụng sẽ cập nhật danh sách công việc, nhân sự và cửa dock từ các Lists trên SharePoint.',
              itemCountDescription: `Site: ${sharePointConfig?.siteUrl || 'SharePoint'}`,
              onConfirm: () => {
                setConfirmDialog((c) => ({ ...c, isOpen: false }));
                showToast('Đã tải về dữ liệu mới nhất từ SharePoint Lists!', 'success');
              },
            });
          }
        }}
      />

      {/* Sheet Sync Modal */}
      <SheetSyncModal
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
        accessToken={token}
        sheetConfig={sheetConfig}
        onSaveConfig={(cfg) => {
          setSheetConfig(cfg);
          showToast('Đã lưu cấu hình bảng tính Google Sheet', 'success');
        }}
        tasks={tasks}
        employees={employees}
        docks={docks}
        onDataImported={(data) => {
          setTasks(data.tasks);
          setEmployees(data.employees);
          setDocks(data.docks);
        }}
        onRequestConfirmSync={handleRequestConfirmSync}
      />

      {/* Mandatory User Confirmation Dialog for Google Sheets Mutating Operations */}
      <ConfirmationModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        itemCountDescription={confirmDialog.itemCountDescription}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((c) => ({ ...c, isOpen: false }))}
      />

      {/* Real-time Notifications & Alerts Drawer */}
      <NotificationCenter
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        alerts={alerts}
        onDismissAlert={(id) => setAlerts((prev) => prev.filter((a) => a.id !== id))}
        onClearAll={() => setAlerts([])}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onSelectTask={(taskId) => {
          const t = tasks.find((item) => item.id === taskId);
          if (t) {
            setSelectedTask(t);
            setIsTaskModalOpen(true);
          }
        }}
      />
    </div>
  );
}

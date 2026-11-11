import React, { useState } from 'react';
import {
  DispatchTask,
  Employee,
  DockDoor,
  OperationType,
  TaskStatus,
  ShiftType,
  WAREHOUSE_ZONES,
  COMMON_ACCOUNTS,
  CustomerAccount
} from '../types';
import {
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  Truck,
  ArrowDownLeft,
  ArrowUpRight,
  PackageCheck,
  ShieldCheck,
  Edit2,
  Trash2,
  UserCheck,
  PlayCircle,
  CheckCheck,
  RotateCcw,
  Sparkles,
  History,
  BarChart3,
  Box,
  Boxes,
  PackageOpen,
  Building2,
  Phone,
  Mail,
  User,
  Users,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { ProductivityAnalytics } from './ProductivityAnalytics';
import { TaskHistory } from './TaskHistory';
import { ProductivityReport } from './ProductivityReport';

interface DispatchBoardProps {
  tasks: DispatchTask[];
  employees: Employee[];
  docks: DockDoor[];
  accounts: CustomerAccount[];
  activeShift: ShiftType;
  isSheetConnected?: boolean;
  onAddTask: () => void;
  onEditTask: (task: DispatchTask) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
  onQuickIncrementProgress: (taskId: string, amount: number) => void;
  onAddEmployee: () => void;
  onEditEmployee: (emp: Employee) => void;
  onDeleteEmployee: (empId: string) => void;
  onAddDock: () => void;
  onEditDock: (dock: DockDoor) => void;
  onDeleteDock: (dockId: string) => void;
  onAddAccount: () => void;
  onEditAccount: (acc: CustomerAccount) => void;
  onDeleteAccount: (accId: string) => void;
  onOpenSyncModal: () => void;
}

export const DispatchBoard: React.FC<DispatchBoardProps> = ({
  tasks,
  employees,
  docks,
  accounts,
  activeShift,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onUpdateTaskStatus,
  onQuickIncrementProgress,
  onAddEmployee,
  onEditEmployee,
  onDeleteEmployee,
  onAddDock,
  onEditDock,
  onDeleteDock,
  onAddAccount,
  onEditAccount,
  onDeleteAccount,
  onOpenSyncModal,
  isSheetConnected,
}) => {
  const [activeTab, setActiveTab] = useState<'dispatch' | 'docks' | 'employees' | 'accounts' | 'reports' | 'analytics' | 'history'>(
    'dispatch'
  );
  const [selectedOperation, setSelectedOperation] = useState<OperationType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'all'>('all');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [accountSearchQuery, setAccountSearchQuery] = useState<string>('');

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    // Operation filter
    if (selectedOperation !== 'all' && t.operationType !== selectedOperation) return false;
    // Status filter
    if (selectedStatus !== 'all' && t.status !== selectedStatus) return false;
    // Zone filter
    if (selectedZone !== 'all' && t.warehouseZone !== selectedZone) return false;
    // Account filter
    if (selectedAccount !== 'all' && t.accountCode !== selectedAccount) return false;
    // Search query filter (employee, location, task ID, notes, zone, account, customer, cont)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchEmp = t.employeeName.toLowerCase().includes(q);
      const matchLoc = t.location.toLowerCase().includes(q);
      const matchId = t.id.toLowerCase().includes(q);
      const matchNotes = (t.notes || '').toLowerCase().includes(q);
      const matchZone = (t.warehouseZone || '').toLowerCase().includes(q);
      const matchAcc = (t.accountCode || '').toLowerCase().includes(q);
      const matchCust = (t.customerName || '').toLowerCase().includes(q);
      const matchCont = (t.containerOrTruckNo || '').toLowerCase().includes(q);
      if (!matchEmp && !matchLoc && !matchId && !matchNotes && !matchZone && !matchAcc && !matchCust && !matchCont) {
        return false;
      }
    }
    return true;
  });

  // Filtered accounts
  const filteredAccounts = accounts.filter((a) => {
    if (!accountSearchQuery.trim()) return true;
    const q = accountSearchQuery.toLowerCase();
    const matchCode = a.code.toLowerCase().includes(q);
    const matchCust = a.customer.toLowerCase().includes(q);
    const matchZone = a.defaultZone.toLowerCase().includes(q);
    const matchContact = (a.contactPerson || '').toLowerCase().includes(q);
    const matchPhone = (a.contactPhone || '').toLowerCase().includes(q);
    const matchNotes = (a.notes || '').toLowerCase().includes(q);
    return matchCode || matchCust || matchZone || matchContact || matchPhone || matchNotes;
  });

  // Employee filter states
  const [selectedEmpZone, setSelectedEmpZone] = useState<string>('all');
  const [selectedEmpRole, setSelectedEmpRole] = useState<string>('all');
  const [selectedEmpStatus, setSelectedEmpStatus] = useState<string>('all');
  const [empSearchQuery, setEmpSearchQuery] = useState<string>('');

  // Warehouse workforce statistics (Tallymen, xe nâng, đang làm việc, chưa làm việc)
  const warehouseStats = WAREHOUSE_ZONES.map((zone) => {
    const zoneEmps = employees.filter((e) => (e.warehouseZone || WAREHOUSE_ZONES[0]) === zone);
    const forkliftBusy = zoneEmps.filter((e) => e.role === 'forklift_driver' && e.status === 'busy').length;
    const forkliftIdle = zoneEmps.filter((e) => e.role === 'forklift_driver' && e.status !== 'busy').length;
    const forkliftTotal = forkliftBusy + forkliftIdle;

    const tallymanBusy = zoneEmps.filter((e) => e.role === 'tallyman' && e.status === 'busy').length;
    const tallymanIdle = zoneEmps.filter((e) => e.role === 'tallyman' && e.status !== 'busy').length;
    const tallymanTotal = tallymanBusy + tallymanIdle;

    const totalBusy = zoneEmps.filter((e) => e.status === 'busy').length;
    const totalIdle = zoneEmps.filter((e) => e.status !== 'busy').length;
    const totalEmps = zoneEmps.length;

    return {
      zone,
      totalEmps,
      totalBusy,
      totalIdle,
      forklift: {
        busy: forkliftBusy,
        idle: forkliftIdle,
        total: forkliftTotal,
      },
      tallyman: {
        busy: tallymanBusy,
        idle: tallymanIdle,
        total: tallymanTotal,
      },
    };
  });

  // Overall totals across all warehouses
  const overallStats = {
    totalEmps: employees.length,
    totalBusy: employees.filter((e) => e.status === 'busy').length,
    totalIdle: employees.filter((e) => e.status !== 'busy').length,
    forklift: {
      busy: employees.filter((e) => e.role === 'forklift_driver' && e.status === 'busy').length,
      idle: employees.filter((e) => e.role === 'forklift_driver' && e.status !== 'busy').length,
      total: employees.filter((e) => e.role === 'forklift_driver').length,
    },
    tallyman: {
      busy: employees.filter((e) => e.role === 'tallyman' && e.status === 'busy').length,
      idle: employees.filter((e) => e.role === 'tallyman' && e.status !== 'busy').length,
      total: employees.filter((e) => e.role === 'tallyman').length,
    },
  };

  // Filtered employees for table
  const filteredEmployees = employees.filter((e) => {
    const empZone = e.warehouseZone || WAREHOUSE_ZONES[0];
    if (selectedEmpZone !== 'all' && empZone !== selectedEmpZone) return false;
    if (selectedEmpRole !== 'all' && e.role !== selectedEmpRole) return false;
    if (selectedEmpStatus !== 'all') {
      if (selectedEmpStatus === 'busy' && e.status !== 'busy') return false;
      if (selectedEmpStatus === 'not_busy' && e.status === 'busy') return false;
      if (selectedEmpStatus !== 'busy' && selectedEmpStatus !== 'not_busy' && e.status !== selectedEmpStatus) return false;
    }
    if (empSearchQuery.trim()) {
      const q = empSearchQuery.toLowerCase();
      const matchName = e.name.toLowerCase().includes(q);
      const matchId = e.id.toLowerCase().includes(q);
      const matchPhone = (e.phone || '').toLowerCase().includes(q);
      const matchArea = (e.assignedArea || '').toLowerCase().includes(q);
      const matchZone = (e.warehouseZone || '').toLowerCase().includes(q);
      if (!matchName && !matchId && !matchPhone && !matchArea && !matchZone) {
        return false;
      }
    }
    return true;
  });

  const getOpBadge = (op: OperationType) => {
    switch (op) {
      case 'inbound':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <ArrowDownLeft className="w-3 h-3 text-blue-400" />
            Inbound
          </span>
        );
      case 'outbound':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <ArrowUpRight className="w-3 h-3 text-emerald-400" />
            Outbound
          </span>
        );
      case 'putaway':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <PackageCheck className="w-3 h-3 text-purple-400" />
            Putaway
          </span>
        );
      case 'inspection':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <ShieldCheck className="w-3 h-3 text-amber-400" />
            Inspection
          </span>
        );
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <CheckCircle className="w-3 h-3" />
            Hoàn thành
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            Đang thực hiện
          </span>
        );
      case 'delayed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <AlertCircle className="w-3 h-3" />
            Chậm tiến độ
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-700/60 text-slate-300 border border-slate-600">
            <Clock className="w-3 h-3 text-slate-400" />
            Chờ thực hiện
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Tab Bar & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('dispatch')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'dispatch'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Bảng Điều Phối ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('docks')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'docks'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            Cửa Dock - socua ({docks.length})
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'employees'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Nhân Sự - nhanvien ({employees.length})
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'accounts'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-amber-300" />
            Khách Hàng - account ({accounts.length})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'reports'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-blue-300" />
            Báo Cáo Năng Suất
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'analytics'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Chỉ Số Vận Hành
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <History className="w-3.5 h-3.5 text-cyan-300" />
            Lịch Sử Công Việc ({tasks.filter((t) => t.status === 'completed').length})
          </button>
        </div>

        {/* Action Button depending on current tab */}
        <div className="flex items-center gap-2">
          {activeTab === 'dispatch' && (
            <button
              onClick={onAddTask}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-lg shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" />
              Thêm Công Việc Điều Phối
            </button>
          )}
          {activeTab === 'docks' && (
            <button
              onClick={onAddDock}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" />
              Thêm Số Cửa Dock (socua)
            </button>
          )}
          {activeTab === 'employees' && (
            <button
              onClick={onAddEmployee}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-lg shadow-purple-600/20"
            >
              <Plus className="w-4 h-4" />
              Thêm Nhân Viên (nhanvien)
            </button>
          )}
          {activeTab === 'accounts' && (
            <button
              onClick={onAddAccount}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-lg shadow-amber-600/20"
            >
              <Plus className="w-4 h-4" />
              Thêm Khách Hàng / Account
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: DISPATCH BOARD */}
      {activeTab === 'dispatch' && (
        <div className="space-y-4">
          {/* Filters & Search Toolbar */}
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm nhân viên, vị trí, mã việc, số cont xe, account..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Operation Type Quick Filter */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {(
                [
                  { id: 'all', label: 'Tất cả loại' },
                  { id: 'inbound', label: 'Inbound' },
                  { id: 'outbound', label: 'Outbound' },
                  { id: 'putaway', label: 'Putaway' },
                  { id: 'inspection', label: 'Inspection' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedOperation(f.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    selectedOperation === f.id
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 font-semibold'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Phân Kho Filter */}
            <div className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-cyan-400 mr-0.5" />
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                aria-label="Lọc theo phân kho"
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
              >
                <option value="all">Tất cả phân kho</option>
                {WAREHOUSE_ZONES.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>

            {/* Account Filter */}
            <div className="flex items-center gap-1">
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                aria-label="Lọc theo Account"
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
              >
                <option value="all">Tất cả Account</option>
                {accounts.map((a) => (
                  <option key={a.id || a.code} value={a.code}>
                    {a.code} ({a.customer.split(' ')[0]})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                aria-label="Lọc theo trạng thái công việc"
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="in_progress">Đang thực hiện</option>
                <option value="pending">Chờ thực hiện</option>
                <option value="completed">Đã hoàn thành</option>
                <option value="delayed">Chậm tiến độ</option>
              </select>
            </div>

            {/* Reset Filters */}
            {(selectedOperation !== 'all' || selectedStatus !== 'all' || selectedZone !== 'all' || selectedAccount !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedOperation('all');
                  setSelectedStatus('all');
                  setSelectedZone('all');
                  setSelectedAccount('all');
                  setSearchQuery('');
                }}
                className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 px-2 py-1 rounded bg-slate-800"
              >
                <RotateCcw className="w-3 h-3" />
                Đặt lại
              </button>
            )}
          </div>

          {/* Core Dispatch Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Mã CV</th>
                    <th className="py-3 px-4">Tên Nhân Viên</th>
                    <th className="py-3 px-4">Phân Kho / Account / Cont Xe</th>
                    <th className="py-3 px-4">Vị Trí & Cửa</th>
                    <th className="py-3 px-4">Thời Gian Bắt Đầu</th>
                    <th className="py-3 px-4">Loại Vận Hành</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4">Quy Cách & CBM / Pallet</th>
                    <th className="py-3 px-4">Tiến Độ</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        Không tìm thấy công việc nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((t) => {
                      const progressPct =
                        t.targetQuantity > 0
                          ? Math.min(100, Math.round((t.completedQuantity / t.targetQuantity) * 100))
                          : 0;

                      return (
                        <tr
                          key={t.id}
                          className="hover:bg-slate-800/40 transition-colors group"
                        >
                          {/* Mã CV */}
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-400 whitespace-nowrap">
                            {t.id}
                            {t.priority === 'urgent' && (
                              <span className="block text-[9px] font-sans font-bold text-rose-400 uppercase tracking-wider">
                                Khẩn cấp
                              </span>
                            )}
                          </td>

                          {/* Tên Nhân Viên (Required Column) */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-white flex items-center gap-1.5 whitespace-nowrap">
                              {t.employeeName}
                            </div>
                            {t.notes && (
                              <div className="text-[11px] text-slate-400 truncate max-w-[180px]" title={t.notes}>
                                {t.notes}
                              </div>
                            )}
                          </td>

                          {/* Phân Kho, Account, Khách Hàng Nhập, Số Cont Xe */}
                          <td className="py-3.5 px-4 min-w-[200px]">
                            {t.warehouseZone && (
                              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-cyan-300 border border-cyan-500/20 mb-1">
                                <Building2 className="w-2.5 h-2.5 text-cyan-400" />
                                <span>{t.warehouseZone.split(' - ')[0]}</span>
                              </div>
                            )}

                            {(t.accountCode || t.customerName) && (
                              <div className="text-[11px] font-semibold text-white truncate max-w-[220px]" title={`${t.accountCode} - ${t.customerName}`}>
                                {t.accountCode && (
                                  <span className="text-amber-300 font-mono text-[10px] mr-1.5 px-1 py-0.2 bg-amber-500/10 rounded border border-amber-500/20">
                                    {t.accountCode}
                                  </span>
                                )}
                                <span className="text-slate-300">{t.customerName}</span>
                              </div>
                            )}

                            {t.containerOrTruckNo && (
                              <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 mt-0.5">
                                <Truck className="w-3 h-3 text-slate-500 shrink-0" />
                                <span className="truncate max-w-[190px]" title={t.containerOrTruckNo}>{t.containerOrTruckNo}</span>
                              </div>
                            )}
                          </td>

                          {/* Vị Trí & Cửa Dock (Required Column) */}
                          <td className="py-3.5 px-4 font-medium text-slate-300 whitespace-nowrap">
                            <div>{t.location}</div>
                            {t.dockId && (
                              <span className="inline-block mt-0.5 font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                {t.dockId}
                              </span>
                            )}
                          </td>

                          {/* Thời Gian Bắt Đầu (Required Column) */}
                          <td className="py-3.5 px-4 font-mono text-cyan-300 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-cyan-400" />
                              <span>{t.startTime}</span>
                              {t.endTime && (
                                <span className="text-[10px] text-slate-400">
                                  → {t.endTime}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Loại Vận Hành (Inbound, Outbound, Putway, Inspection) */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {getOpBadge(t.operationType)}
                          </td>

                          {/* Trạng Thái Hoàn Thành (Required Column) */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {getStatusBadge(t.status)}
                          </td>

                          {/* Quy Cách Hàng Hóa & Thể Tích CBM / Pallet / San Hàng */}
                          <td className="py-3.5 px-4 min-w-[170px]">
                            {/* Mode 1: Carton to CBM */}
                            {t.cargoUnitType === 'carton_to_cbm' && (
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 text-blue-300 font-semibold">
                                  <Box className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                  <span>{t.cartonCount ?? t.targetQuantity} Thùng Carton</span>
                                </div>
                                <div className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 inline-block">
                                  ~ {t.cbmCount ?? 0} CBM (m³)
                                </div>
                              </div>
                            )}

                            {/* Mode 2: Pallet Only (NO CBM) */}
                            {t.cargoUnitType === 'pallet_only' && (
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                                  <Boxes className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  <span>{t.palletCount ?? t.targetQuantity} Pallet</span>
                                </div>
                                <div className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded inline-block">
                                  Không cần CBM
                                </div>
                              </div>
                            )}

                            {/* Mode 3: San Hàng (Carton to Putaway Pallet) */}
                            {t.cargoUnitType === 'carton_to_pallet_putaway' && (
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1 text-purple-300 font-semibold text-[11px]">
                                  <PackageOpen className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                  <span>{t.cartonCount ?? t.targetQuantity} Thùng</span>
                                  <span className="text-slate-400">➔</span>
                                  <span className="text-purple-200 font-bold">{t.putawayPalletCount ?? 0} Pl Putaway</span>
                                </div>
                                <div className="text-[10px] text-purple-400 font-mono">
                                  ({t.cartonsPerPallet || 50} thùng/pallet)
                                </div>
                              </div>
                            )}

                            {/* Default / Unspecified */}
                            {!t.cargoUnitType && (
                              <span className="text-slate-400 text-xs">
                                {t.targetQuantity} {t.unit}
                              </span>
                            )}
                          </td>

                          {/* Tiến độ sản lượng */}
                          <td className="py-3.5 px-4 min-w-[130px]">
                            <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                              <span className="text-white font-semibold">
                                {t.completedQuantity}/{t.targetQuantity}
                              </span>
                              <span className="text-slate-400">{t.unit}</span>
                            </div>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  t.status === 'completed'
                                    ? 'bg-emerald-500'
                                    : t.status === 'delayed'
                                    ? 'bg-rose-500'
                                    : 'bg-blue-500'
                                }`}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </td>

                          {/* Quick Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Quick increment progress button */}
                              {t.status !== 'completed' && (
                                <button
                                  type="button"
                                  onClick={() => onQuickIncrementProgress(t.id, 10)}
                                  title="Ghi nhận thêm +10 đơn vị"
                                  className="p-1 px-1.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[10px] font-bold border border-slate-700 transition-colors"
                                >
                                  +10
                                </button>
                              )}

                              {/* Toggle completed button */}
                              {t.status !== 'completed' ? (
                                <button
                                  type="button"
                                  onClick={() => onUpdateTaskStatus(t.id, 'completed')}
                                  title="Đánh dấu hoàn thành"
                                  className="p-1.5 rounded bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 transition-colors"
                                >
                                  <CheckCheck className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onUpdateTaskStatus(t.id, 'in_progress')}
                                  title="Mở lại công việc"
                                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => onEditTask(t)}
                                title="Chỉnh sửa chi tiết"
                                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => onDeleteTask(t.id)}
                                title="Xóa"
                                className="p-1.5 rounded bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Summary */}
            <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
              <div>
                Đang hiển thị <span className="font-semibold text-white">{filteredTasks.length}</span> / {tasks.length} công việc
              </div>
              <div className="flex items-center gap-4">
                <span>Inbound: <strong className="text-blue-400">{tasks.filter(t => t.operationType === 'inbound').length}</strong></span>
                <span>Outbound: <strong className="text-emerald-400">{tasks.filter(t => t.operationType === 'outbound').length}</strong></span>
                <span>Putaway: <strong className="text-purple-400">{tasks.filter(t => t.operationType === 'putaway').length}</strong></span>
                <span>Inspection: <strong className="text-amber-400">{tasks.filter(t => t.operationType === 'inspection').length}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DOCK DOORS (socua) */}
      {activeTab === 'docks' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {docks.map((dock) => {
              let statusColor = 'border-slate-700 bg-slate-900';
              let statusText = 'Sẵn sàng / Trống';
              let statusBadge = 'bg-slate-800 text-slate-300';

              if (dock.status === 'docked_unloading') {
                statusColor = 'border-blue-500/40 bg-blue-950/20';
                statusText = 'Đang dỡ hàng (Inbound)';
                statusBadge = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
              } else if (dock.status === 'docked_loading') {
                statusColor = 'border-emerald-500/40 bg-emerald-950/20';
                statusText = 'Đang bốc hàng (Outbound)';
                statusBadge = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
              } else if (dock.status === 'waiting_truck') {
                statusColor = 'border-amber-500/40 bg-amber-950/20';
                statusText = 'Đang chờ xe cập';
                statusBadge = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
              } else if (dock.status === 'maintenance') {
                statusColor = 'border-rose-500/40 bg-rose-950/20';
                statusText = 'Bảo trì sàn nâng';
                statusBadge = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
              }

              return (
                <div
                  key={dock.id}
                  className={`border rounded-2xl p-4 transition-all relative ${statusColor} shadow-lg`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white">{dock.doorNumber}</h4>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {dock.id}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 capitalize">
                        Loại cửa: <strong className="text-white">{dock.type}</strong>
                      </span>
                    </div>

                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${statusBadge}`}>
                      {statusText}
                    </span>
                  </div>

                  <div className="mt-3.5 space-y-2 text-xs border-t border-slate-800/80 pt-3">
                    {dock.assignedTruck ? (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Biển số / Cont:</span>
                        <span className="font-mono font-semibold text-white bg-slate-800 px-2 py-0.5 rounded">
                          {dock.assignedTruck}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-slate-500 italic">
                        <span>Chưa có xe cập</span>
                        <span>--</span>
                      </div>
                    )}

                    {dock.carrierName && (
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Hãng vận tải:</span>
                        <span className="text-slate-200">{dock.carrierName}</span>
                      </div>
                    )}

                    {dock.eta && (
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Giờ dự kiến (ETA):</span>
                        <span className="font-mono text-cyan-300">{dock.eta}</span>
                      </div>
                    )}

                    {/* Assigned Personnel */}
                    <div className="pt-1">
                      <span className="text-slate-400 text-[11px] block mb-1">
                        Nhân viên trực cửa:
                      </span>
                      {dock.assignedEmployeeIds && dock.assignedEmployeeIds.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {dock.assignedEmployeeIds.map((empId) => {
                            const emp = employees.find((e) => e.id === empId);
                            return (
                              <span
                                key={empId}
                                className="px-2 py-0.5 rounded bg-slate-800 text-emerald-300 text-[10px] font-medium border border-emerald-500/20"
                              >
                                {emp ? emp.name : empId}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">Chưa phân công nhân viên</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-2 border-t border-slate-800/80 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onEditDock(dock)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                      Sửa Cửa
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteDock(dock.id)}
                      className="p-1 rounded hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: EMPLOYEES (nhanvien) */}
      {activeTab === 'employees' && (
        <div className="space-y-5">
          {/* PHẦN 1: THỐNG KÊ NHÂN SỰ THEO TỪNG KHO (TALLYMEN, XE NÂNG, ĐANG LÀM VIỆC, CHƯA LÀM VIỆC) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Thống Kê Nhân Sự Theo Từng Kho
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Tallymen & Xe Nâng
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Số lượng nhân viên đang làm việc và chưa làm việc phân theo từng kho hàng
                  </p>
                </div>
              </div>

              {/* Quick Overall Summary Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Tổng nhân sự:</span>
                  <span className="font-bold text-white">{overallStats.totalEmps}</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-800/40 flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                  <span className="text-cyan-300">Đang làm việc:</span>
                  <span className="font-bold text-cyan-200">{overallStats.totalBusy}</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="text-emerald-300">Chưa làm việc / Sẵn sàng:</span>
                  <span className="font-bold text-emerald-200">{overallStats.totalIdle}</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-800/40 flex items-center gap-2 text-xs">
                  <span className="text-amber-300 font-medium">🚜 Xe nâng:</span>
                  <span className="font-bold text-amber-200">{overallStats.forklift.total}</span>
                  <span className="text-[10px] text-amber-400/80">({overallStats.forklift.busy} bận / {overallStats.forklift.idle} rảnh)</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-blue-950/40 border border-blue-800/40 flex items-center gap-2 text-xs">
                  <span className="text-blue-300 font-medium">📋 Tallymen:</span>
                  <span className="font-bold text-blue-200">{overallStats.tallyman.total}</span>
                  <span className="text-[10px] text-blue-400/80">({overallStats.tallyman.busy} bận / {overallStats.tallyman.idle} rảnh)</span>
                </div>
              </div>
            </div>

            {/* 3 Warehouse Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {warehouseStats.map((stat, idx) => {
                const isCFS = stat.zone.includes('CFS');
                const isBonded = stat.zone.includes('Ngoại Quan');
                const isDC = stat.zone.includes('DC');

                const borderAccent = isCFS
                  ? 'border-cyan-500/30 hover:border-cyan-500/60'
                  : isBonded
                  ? 'border-purple-500/30 hover:border-purple-500/60'
                  : 'border-emerald-500/30 hover:border-emerald-500/60';

                const badgeBg = isCFS
                  ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                  : isBonded
                  ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';

                const busyPercent = stat.totalEmps > 0 ? Math.round((stat.totalBusy / stat.totalEmps) * 100) : 0;

                return (
                  <div
                    key={stat.zone}
                    className={`bg-slate-950/70 border ${borderAccent} rounded-2xl p-4.5 transition-all shadow-md hover:shadow-lg flex flex-col justify-between`}
                  >
                    <div>
                      {/* Warehouse Title & Total Count */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-slate-300" />
                            <h4 className="text-xs font-bold text-white uppercase tracking-wide">
                              {stat.zone}
                            </h4>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Khu vực lưu trữ & xử lý hàng
                          </p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${badgeBg}`}>
                          {stat.totalEmps} NV
                        </span>
                      </div>

                      {/* Progress bar of working vs not working */}
                      <div className="mb-4 bg-slate-900/90 rounded-xl p-2.5 border border-slate-800">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                            Đang làm: <strong className="text-cyan-300">{stat.totalBusy}</strong>
                          </span>
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                            Chưa làm: <strong className="text-slate-200">{stat.totalIdle}</strong>
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden flex">
                          <div
                            className="bg-cyan-500 h-2 transition-all duration-300"
                            style={{ width: `${busyPercent}%` }}
                          />
                          <div
                            className="bg-slate-700 h-2 transition-all duration-300"
                            style={{ width: `${100 - busyPercent}%` }}
                          />
                        </div>
                        <div className="text-right text-[10px] text-slate-400 mt-1">
                          Hiệu suất hoạt động: {busyPercent}%
                        </div>
                      </div>

                      {/* DETAILED STATS: XE NÂNG & TALLYMEN */}
                      <div className="space-y-2.5">
                        {/* 1. XE NÂNG (FORKLIFT) */}
                        <div className="bg-slate-900/80 border border-amber-500/20 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                              <span>🚜 Lái Xe Nâng</span>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Tổng: {stat.forklift.total}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2 flex items-center justify-between">
                              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                                Đang làm:
                              </span>
                              <span className="font-bold text-cyan-300 font-mono">
                                {stat.forklift.busy}
                              </span>
                            </div>
                            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2 flex items-center justify-between">
                              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                                Chưa làm:
                              </span>
                              <span className="font-bold text-slate-300 font-mono">
                                {stat.forklift.idle}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 2. TALLYMEN (KIỂM ĐẾM) */}
                        <div className="bg-slate-900/80 border border-blue-500/20 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-300">
                              <span>📋 Kiểm Đếm (Tallymen)</span>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              Tổng: {stat.tallyman.total}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2 flex items-center justify-between">
                              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                                Đang làm:
                              </span>
                              <span className="font-bold text-cyan-300 font-mono">
                                {stat.tallyman.busy}
                              </span>
                            </div>
                            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2 flex items-center justify-between">
                              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                                Chưa làm:
                              </span>
                              <span className="font-bold text-slate-300 font-mono">
                                {stat.tallyman.idle}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Filter by this zone quick action */}
                    <div className="mt-3.5 pt-3 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedEmpZone === stat.zone) {
                            setSelectedEmpZone('all');
                          } else {
                            setSelectedEmpZone(stat.zone);
                          }
                        }}
                        className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                          selectedEmpZone === stat.zone
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        <Filter className="w-3.5 h-3.5" />
                        {selectedEmpZone === stat.zone ? 'Đang lọc kho này (Bấm bỏ lọc)' : 'Lọc danh sách nhân viên kho này'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PHẦN 2: BỘ LỌC VÀ TÌM KIẾM NHÂN SỰ */}
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* Search query */}
              <div className="relative min-w-[220px] max-w-sm flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={empSearchQuery}
                  onChange={(e) => setEmpSearchQuery(e.target.value)}
                  placeholder="Tìm tên, mã NV, SĐT, khu vực phụ trách..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Filter by Warehouse Zone */}
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedEmpZone}
                  onChange={(e) => setSelectedEmpZone(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="all">Tất cả các kho ({employees.length})</option>
                  {WAREHOUSE_ZONES.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone} ({employees.filter((e) => (e.warehouseZone || WAREHOUSE_ZONES[0]) === zone).length})
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter by Role */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedEmpRole}
                  onChange={(e) => setSelectedEmpRole(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="all">Tất cả vị trí</option>
                  <option value="forklift_driver">🚜 Lái xe nâng (Forklift)</option>
                  <option value="tallyman">📋 Kiểm đếm (Tallyman)</option>
                  <option value="qc_inspector">Kiểm hàng KCS (QC)</option>
                  <option value="warehouse_worker">Bốc xếp / Dỡ hàng</option>
                  <option value="packer">Đóng gói / Xuất hàng</option>
                  <option value="supervisor">Trưởng ca / Điều phối</option>
                </select>
              </div>

              {/* Filter by Status */}
              <div className="flex items-center gap-1.5">
                <select
                  value={selectedEmpStatus}
                  onChange={(e) => setSelectedEmpStatus(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="busy">Đang làm việc</option>
                  <option value="not_busy">Chưa làm việc / Sẵn sàng</option>
                  <option value="off_duty">Nghỉ ca</option>
                </select>
              </div>

              {(selectedEmpZone !== 'all' || selectedEmpRole !== 'all' || selectedEmpStatus !== 'all' || empSearchQuery.trim()) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEmpZone('all');
                    setSelectedEmpRole('all');
                    setSelectedEmpStatus('all');
                    setEmpSearchQuery('');
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Bỏ lọc
                </button>
              )}
            </div>

            <div className="text-xs text-slate-400">
              Hiển thị <span className="font-bold text-white">{filteredEmployees.length}</span> / {employees.length} nhân viên
            </div>
          </div>

          {/* PHẦN 3: TABLE NHÂN SỰ VỚI CỘT PHÂN THUỘC KHO */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Mã NV</th>
                    <th className="py-3 px-4">Họ Và Tên</th>
                    <th className="py-3 px-4">Vị Trí Chuyên Môn</th>
                    <th className="py-3 px-4">Phân Thuộc Kho</th>
                    <th className="py-3 px-4">Ca Làm Việc</th>
                    <th className="py-3 px-4">Khu Vực Phụ Trách</th>
                    <th className="py-3 px-4">SĐT / Bộ Đàm</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4">Đã Xong Hôm Nay</th>
                    <th className="py-3 px-4">Tổng Sản Lượng</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400 text-xs">
                        Không tìm thấy nhân viên phù hợp với tiêu chí lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const zone = emp.warehouseZone || WAREHOUSE_ZONES[0];
                      const isCFS = zone.includes('CFS');
                      const isBonded = zone.includes('Ngoại Quan');

                      return (
                        <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-400">{emp.id}</td>
                          <td className="py-3.5 px-4 font-semibold text-white">{emp.name}</td>
                          <td className="py-3.5 px-4">
                            {emp.role === 'forklift_driver' ? (
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                🚜 Lái xe nâng (Forklift)
                              </span>
                            ) : emp.role === 'tallyman' ? (
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                                📋 Kiểm đếm (Tallyman)
                              </span>
                            ) : emp.role === 'qc_inspector' ? (
                              <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                Kiểm hàng KCS (QC)
                              </span>
                            ) : emp.role === 'supervisor' ? (
                              <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                                Trưởng ca / Dispatcher
                              </span>
                            ) : emp.role === 'packer' ? (
                              <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                                Đóng gói
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                Bốc xếp / Dỡ hàng
                              </span>
                            )}
                          </td>
                          {/* CỘT PHÂN THUỘC KHO */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-1 rounded-md text-[11px] font-medium border flex items-center gap-1.5 w-fit ${
                                isCFS
                                  ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                                  : isBonded
                                  ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              }`}
                            >
                              <Building2 className="w-3 h-3" />
                              {zone}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-emerald-400 uppercase">
                            {emp.shift.replace('_', ' ')}
                          </td>
                          <td className="py-3.5 px-4 text-slate-300">{emp.assignedArea || 'Khu chung'}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-400">{emp.phone || '-'}</td>
                          <td className="py-3.5 px-4">
                            {emp.status === 'busy' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 w-fit">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                                Đang làm việc
                              </span>
                            ) : emp.status === 'available' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                Sẵn sàng
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400">
                                Nghỉ ca
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-semibold text-white">
                            {emp.completedTasksToday} việc
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                            {emp.totalUnitsToday} đơn vị
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => onEditEmployee(emp)}
                                title="Chỉnh sửa nhân viên"
                                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteEmployee(emp.id)}
                                title="Xóa nhân viên"
                                className="p-1.5 rounded hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ACCOUNTS & KHÁCH HÀNG (account) */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          {/* Summary / Search Header */}
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={accountSearchQuery}
                onChange={(e) => setAccountSearchQuery(e.target.value)}
                placeholder="Tìm mã Account, tên khách hàng, người liên hệ..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span>
                Đang hiển thị <strong className="text-white">{filteredAccounts.length}</strong> / {accounts.length} đối tác
              </span>
              <button
                onClick={onAddAccount}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-md shadow-amber-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm Account
              </button>
            </div>
          </div>

          {/* Accounts Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Mã Account</th>
                    <th className="py-3 px-4">Tên Khách Hàng / Shipper</th>
                    <th className="py-3 px-4">Phân Kho Mặc Định</th>
                    <th className="py-3 px-4">Người Liên Hệ & Hotline</th>
                    <th className="py-3 px-4">Đơn Hàng Đang Chạy</th>
                    <th className="py-3 px-4">Ghi Chú Vận Hành</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        Không tìm thấy Account nào phù hợp với từ khóa tìm kiếm.
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map((acc) => {
                      const activeTasks = tasks.filter(
                        (t) => t.accountCode === acc.code && t.status !== 'completed'
                      ).length;

                      return (
                        <tr key={acc.id || acc.code} className="hover:bg-slate-800/40 transition-colors">
                          {/* Mã Account */}
                          <td className="py-3.5 px-4 font-mono font-bold text-amber-300 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                              {acc.code}
                            </span>
                          </td>

                          {/* Tên Khách Hàng */}
                          <td className="py-3.5 px-4 font-semibold text-white whitespace-nowrap">
                            {acc.customer}
                          </td>

                          {/* Phân Kho Mặc Định */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-cyan-300 border border-cyan-500/20">
                              <Building2 className="w-3 h-3 text-cyan-400" />
                              {acc.defaultZone}
                            </span>
                          </td>

                          {/* Người Liên Hệ */}
                          <td className="py-3.5 px-4 min-w-[180px]">
                            {acc.contactPerson ? (
                              <div>
                                <div className="font-medium text-slate-200 flex items-center gap-1">
                                  <User className="w-3 h-3 text-blue-400" />
                                  <span>{acc.contactPerson}</span>
                                </div>
                                {acc.contactPhone && (
                                  <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 mt-0.5">
                                    <Phone className="w-2.5 h-2.5" />
                                    <span>{acc.contactPhone}</span>
                                  </div>
                                )}
                                {acc.email && (
                                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                                    <Mail className="w-2.5 h-2.5" />
                                    <span>{acc.email}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">Chưa cập nhật</span>
                            )}
                          </td>

                          {/* Đơn Hàng Đang Xử Lý */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {activeTasks > 0 ? (
                              <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                {activeTasks} đơn đang chạy
                              </span>
                            ) : (
                              <span className="text-slate-500 italic text-[11px]">0 đơn</span>
                            )}
                          </td>

                          {/* Ghi Chú */}
                          <td className="py-3.5 px-4 text-xs text-slate-400 max-w-xs truncate" title={acc.notes}>
                            {acc.notes || <span className="text-slate-600 italic">--</span>}
                          </td>

                          {/* Thao Tác (Edit, Delete) */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => onEditAccount(acc)}
                                title="Chỉnh sửa Account"
                                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteAccount(acc.id)}
                                title="Xóa Account"
                                className="p-1.5 rounded hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div>
                Tổng số đối tác: <strong className="text-white">{accounts.length}</strong>
              </div>
              <div className="text-[11px] text-slate-500">
                Các Account được liên kết trực tiếp vào form điều phối công việc và bộ lọc kho
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RECHARTS PRODUCTIVITY REPORT */}
      {activeTab === 'reports' && (
        <ProductivityReport tasks={tasks} employees={employees} activeShift={activeShift} />
      )}

      {/* TAB 5: AUTOMATED OPERATIONAL ANALYTICS */}
      {activeTab === 'analytics' && (
        <ProductivityAnalytics tasks={tasks} employees={employees} docks={docks} />
      )}

      {/* TAB 5: COMPLETED TASK HISTORY */}
      {activeTab === 'history' && (
        <TaskHistory
          tasks={tasks}
          employees={employees}
          docks={docks}
          onOpenSyncModal={onOpenSyncModal}
          isSheetConnected={isSheetConnected}
        />
      )}
    </div>
  );
};

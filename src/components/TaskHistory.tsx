import React, { useState, useMemo } from 'react';
import {
  DispatchTask,
  Employee,
  DockDoor,
  OperationType,
  ShiftType,
  WAREHOUSE_ZONES,
  COMMON_ACCOUNTS
} from '../types';
import {
  Calendar,
  Clock,
  Search,
  Filter,
  Download,
  ArrowDownLeft,
  ArrowUpRight,
  PackageCheck,
  ShieldCheck,
  Award,
  CheckCircle2,
  TrendingUp,
  FileSpreadsheet,
  RotateCcw,
  Layers,
  ChevronRight,
  Building2,
  Truck,
  Box,
  Boxes,
  PackageOpen
} from 'lucide-react';

interface TaskHistoryProps {
  tasks: DispatchTask[];
  employees: Employee[];
  docks: DockDoor[];
  onOpenSyncModal?: () => void;
  isSheetConnected?: boolean;
}

type DatePreset = 'all' | 'today' | 'yesterday' | 'last7days' | 'custom';

export const TaskHistory: React.FC<TaskHistoryProps> = ({
  tasks,
  employees,
  docks,
  onOpenSyncModal,
  isSheetConnected,
}) => {
  // Local dates calculation based on current date (2026-11-08)
  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  }, []);

  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);

  // Filter states
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customDate, setCustomDate] = useState<string>(todayStr);
  const [selectedOperation, setSelectedOperation] = useState<OperationType | 'all'>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedShift, setSelectedShift] = useState<ShiftType | 'all'>('all');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract completed date helper
  const getTaskDate = (task: DispatchTask): string => {
    if (task.completedDate) return task.completedDate;
    if (task.updatedAt) return task.updatedAt.split('T')[0];
    return todayStr;
  };

  // Only consider completed tasks
  const completedTasks = useMemo(() => {
    return tasks.filter((t) => t.status === 'completed');
  }, [tasks]);

  // Filtered completed tasks
  const filteredCompletedTasks = useMemo(() => {
    return completedTasks.filter((t) => {
      const taskDate = getTaskDate(t);

      // Date filtering
      if (datePreset === 'today') {
        if (taskDate !== todayStr) return false;
      } else if (datePreset === 'yesterday') {
        if (taskDate !== yesterdayStr) return false;
      } else if (datePreset === 'last7days') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        const limitStr = d.toISOString().split('T')[0];
        if (taskDate < limitStr) return false;
      } else if (datePreset === 'custom') {
        if (customDate && taskDate !== customDate) return false;
      }

      // Operation filter
      if (selectedOperation !== 'all' && t.operationType !== selectedOperation) {
        return false;
      }

      // Employee filter
      if (selectedEmployee !== 'all') {
        if (
          t.employeeId !== selectedEmployee &&
          !t.employeeName.toLowerCase().includes(selectedEmployee.toLowerCase())
        ) {
          return false;
        }
      }

      // Shift filter
      if (selectedShift !== 'all' && t.shift !== selectedShift) {
        return false;
      }

      // Warehouse zone filter
      if (selectedZone !== 'all' && t.warehouseZone !== selectedZone) {
        return false;
      }

      // Account filter
      if (selectedAccount !== 'all' && t.accountCode !== selectedAccount) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = t.employeeName.toLowerCase().includes(q);
        const matchLoc = t.location.toLowerCase().includes(q);
        const matchId = t.id.toLowerCase().includes(q);
        const matchNotes = (t.notes || '').toLowerCase().includes(q);
        const matchZone = (t.warehouseZone || '').toLowerCase().includes(q);
        const matchAcc = (t.accountCode || '').toLowerCase().includes(q);
        const matchCust = (t.customerName || '').toLowerCase().includes(q);
        const matchCont = (t.containerOrTruckNo || '').toLowerCase().includes(q);
        if (!matchName && !matchLoc && !matchId && !matchNotes && !matchZone && !matchAcc && !matchCust && !matchCont) return false;
      }

      return true;
    });
  }, [
    completedTasks,
    datePreset,
    customDate,
    selectedOperation,
    selectedEmployee,
    selectedShift,
    selectedZone,
    selectedAccount,
    searchQuery,
    todayStr,
    yesterdayStr,
  ]);

  // Historical Analytics KPIs for the filtered range
  const totalFilteredTasks = filteredCompletedTasks.length;
  const totalCompletedUnits = filteredCompletedTasks.reduce(
    (sum, t) => sum + (t.completedQuantity || t.targetQuantity || 0),
    0
  );

  // Calculate average duration in minutes
  const totalDuration = filteredCompletedTasks.reduce((sum, t) => {
    if (t.durationMinutes) return sum + t.durationMinutes;
    // Estimate from startTime and endTime if available
    if (t.startTime && t.endTime) {
      const [sh, sm] = t.startTime.split(':').map(Number);
      const [eh, em] = t.endTime.split(':').map(Number);
      if (!isNaN(sh) && !isNaN(sm) && !isNaN(eh) && !isNaN(em)) {
        const diff = (eh * 60 + em) - (sh * 60 + sm);
        return sum + (diff > 0 ? diff : 60);
      }
    }
    return sum + 60;
  }, 0);

  const avgDurationMinutes =
    totalFilteredTasks > 0 ? Math.round(totalDuration / totalFilteredTasks) : 0;

  // Breakdown by Operation
  const opCounts = {
    inbound: filteredCompletedTasks.filter((t) => t.operationType === 'inbound').length,
    outbound: filteredCompletedTasks.filter((t) => t.operationType === 'outbound').length,
    putaway: filteredCompletedTasks.filter((t) => t.operationType === 'putaway').length,
    inspection: filteredCompletedTasks.filter((t) => t.operationType === 'inspection').length,
  };

  // Find top performer in filtered history
  const performerMap: Record<string, { name: string; units: number; tasks: number }> = {};
  filteredCompletedTasks.forEach((t) => {
    const key = t.employeeId || t.employeeName;
    if (!performerMap[key]) {
      performerMap[key] = { name: t.employeeName, units: 0, tasks: 0 };
    }
    performerMap[key].units += t.completedQuantity || 0;
    performerMap[key].tasks += 1;
  });

  const topPerformer = Object.values(performerMap).sort((a, b) => b.units - a.units)[0] || null;

  // Export to CSV with UTF-8 BOM for Excel
  const handleExportCSV = () => {
    const headers = [
      'Mã công việc',
      'Ngày hoàn thành',
      'Thời gian bắt đầu',
      'Thời gian hoàn thành',
      'Thời lượng (phút)',
      'Tên nhân viên',
      'Vị trí làm việc',
      'Loại vận hành',
      'Phân kho',
      'Mã Account',
      'Khách hàng nhập',
      'Số Cont Xe',
      'Quy cách hàng',
      'Số Carton',
      'Số CBM (m3)',
      'Số Pallet',
      'Pallet Putaway',
      'SL Hoàn thành',
      'SL Kế hoạch',
      'Đơn vị tính',
      'Cửa Dock',
      'Ca làm việc',
      'Ghi chú',
    ];

    const rows = filteredCompletedTasks.map((t) => {
      let quyCachStr = 'Tiêu chuẩn';
      if (t.cargoUnitType === 'carton_to_cbm') quyCachStr = 'Thùng Carton tính CBM';
      else if (t.cargoUnitType === 'pallet_only') quyCachStr = 'Nguyên Pallet (Không CBM)';
      else if (t.cargoUnitType === 'carton_to_pallet_putaway') quyCachStr = 'San hàng Carton ra Pallet Putaway';

      return [
        t.id,
        getTaskDate(t),
        t.startTime,
        t.endTime || '',
        t.durationMinutes || avgDurationMinutes,
        `"${t.employeeName.replace(/"/g, '""')}"`,
        `"${t.location.replace(/"/g, '""')}"`,
        t.operationType,
        `"${(t.warehouseZone || '').replace(/"/g, '""')}"`,
        t.accountCode || '',
        `"${(t.customerName || '').replace(/"/g, '""')}"`,
        `"${(t.containerOrTruckNo || '').replace(/"/g, '""')}"`,
        `"${quyCachStr}"`,
        t.cartonCount ?? '',
        t.cbmCount ?? '',
        t.palletCount ?? '',
        t.putawayPalletCount ?? '',
        t.completedQuantity,
        t.targetQuantity,
        t.unit,
        t.dockId || '',
        t.shift,
        `"${(t.notes || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Lich_Su_Cong_Viec_Kho_${datePreset}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  const resetFilters = () => {
    setDatePreset('all');
    setSelectedOperation('all');
    setSelectedEmployee('all');
    setSelectedShift('all');
    setSelectedZone('all');
    setSelectedAccount('all');
    setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white">
              Lịch Sử Công Việc & Năng Suất Đã Hoàn Thành
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tra cứu dữ liệu các tác vụ kho đã nghiệm thu, phân tích thời gian và sản lượng theo từng ngày
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Xuất Báo Cáo CSV</span>
          </button>

          {/* Sync to Sheet button */}
          {onOpenSyncModal && (
            <button
              onClick={onOpenSyncModal}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{isSheetConnected ? 'Xem Google Sheet' : 'Nối Google Sheet'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Historical Performance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Finished Tasks */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Việc Đã Hoàn Thành</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{totalFilteredTasks}</span>
            <span className="text-xs text-emerald-400 font-medium">công việc</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Trong phạm vi lọc đã chọn
          </div>
        </div>

        {/* Total Units Handled */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Tổng Sản Lượng Nghiệm Thu</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">
              {totalCompletedUnits.toLocaleString('vi-VN')}
            </span>
            <span className="text-xs text-slate-400">kiện / pallet / mẫu</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Đạt 100% mục tiêu kế hoạch
          </div>
        </div>

        {/* Average Duration */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Thời Gian Xử Lý Bình Quân</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{avgDurationMinutes}</span>
            <span className="text-xs text-slate-400">phút / công việc</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Hiệu quả đúng chuẩn SLA kho
          </div>
        </div>

        {/* Top Performer */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Nhân Viên Năng Suất Nhất</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 truncate">
            <span className="text-base font-bold text-amber-300">
              {topPerformer ? topPerformer.name : '--'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            {topPerformer
              ? `${topPerformer.units.toLocaleString('vi-VN')} đơn vị (${topPerformer.tasks} việc)`
              : 'Chưa có dữ liệu'}
          </div>
        </div>
      </div>

      {/* Comprehensive Filter Toolbar with Date Presets & Calendar Picker */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3.5 shadow-md">
        {/* Row 1: Date Filter Presets and Specific Date Picker */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1 mr-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              Lọc Theo Ngày:
            </span>

            {(
              [
                { id: 'all', label: 'Tất cả các ngày' },
                { id: 'today', label: 'Hôm nay' },
                { id: 'yesterday', label: 'Hôm qua' },
                { id: 'last7days', label: '7 ngày gần nhất' },
                { id: 'custom', label: 'Chọn ngày cụ thể' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                onClick={() => setDatePreset(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  datePreset === p.id
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Date Picker (enabled if custom or handy) */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Ngày chọn:</span>
            <input
              type="date"
              value={customDate}
              onChange={(e) => {
                setCustomDate(e.target.value);
                setDatePreset('custom');
              }}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>

        {/* Row 2: Secondary Filters (Operation, Zone, Account, Employee, Shift, Search, Reset) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Operation Type */}
            <select
              value={selectedOperation}
              onChange={(e) => setSelectedOperation(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="all">Tất cả loại vận hành</option>
              <option value="inbound">Inbound (Nhập hàng)</option>
              <option value="outbound">Outbound (Xuất hàng)</option>
              <option value="putaway">Putaway (Cất kệ)</option>
              <option value="inspection">Inspection (Kiểm định QC)</option>
            </select>

            {/* Phân Kho Filter */}
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              aria-label="Lọc theo phân kho"
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="all">Tất cả phân kho</option>
              {WAREHOUSE_ZONES.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>

            {/* Account Filter */}
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              aria-label="Lọc theo Account"
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="all">Tất cả Account</option>
              {COMMON_ACCOUNTS.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.code} ({a.customer.split(' ')[0]})
                </option>
              ))}
            </select>

            {/* Employee Filter */}
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="all">Tất cả nhân viên</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.id})
                </option>
              ))}
            </select>

            {/* Shift Filter */}
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="all">Tất cả ca làm việc</option>
              <option value="ca_1">Ca 1 (06:00 - 14:00)</option>
              <option value="ca_2">Ca 2 (14:00 - 22:00)</option>
              <option value="ca_3">Ca 3 (22:00 - 06:00)</option>
              <option value="ca_hanh_chinh">Hành chính</option>
            </select>

            {/* Reset button */}
            {(datePreset !== 'all' ||
              selectedOperation !== 'all' ||
              selectedZone !== 'all' ||
              selectedAccount !== 'all' ||
              selectedEmployee !== 'all' ||
              selectedShift !== 'all' ||
              searchQuery) && (
              <button
                onClick={resetFilters}
                className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Đặt lại bộ lọc
              </button>
            )}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo nhân viên, phân kho, cont xe, account..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Main Historical Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Mã CV</th>
                <th className="py-3 px-4">Ngày Hoàn Thành</th>
                <th className="py-3 px-4">Khung Giờ</th>
                <th className="py-3 px-4">Thời Lượng</th>
                <th className="py-3 px-4">Tên Nhân Viên</th>
                <th className="py-3 px-4">Phân Kho / Account / Cont</th>
                <th className="py-3 px-4">Vị Trí & Cửa</th>
                <th className="py-3 px-4">Loại Vận Hành</th>
                <th className="py-3 px-4">Quy Cách & CBM / Pallet</th>
                <th className="py-3 px-4">Sản Lượng Hoàn Tất</th>
                <th className="py-3 px-4">Ca</th>
                <th className="py-3 px-4">Ghi Chú Vận Hành</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredCompletedTasks.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <Calendar className="w-10 h-10 text-slate-600 mb-2" />
                      <p className="text-sm font-medium text-slate-300">
                        Không có công việc hoàn thành nào trong khoảng thời gian đã chọn
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Hãy thử chọn &quot;Tất cả các ngày&quot; hoặc chọn ngày khác trên thanh công cụ phía trên.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCompletedTasks.map((t) => {
                  const taskDate = getTaskDate(t);
                  const duration = t.durationMinutes || avgDurationMinutes;

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Mã CV */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-400 whitespace-nowrap">
                        {t.id}
                      </td>

                      {/* Ngày Hoàn Thành */}
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-200 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>{taskDate}</span>
                        </div>
                      </td>

                      {/* Khung Giờ (Start -> End) */}
                      <td className="py-3.5 px-4 font-mono text-cyan-300 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          <span>{t.startTime}</span>
                          <span className="text-slate-500">→</span>
                          <span className="text-emerald-400 font-semibold">{t.endTime || '12:00'}</span>
                        </div>
                      </td>

                      {/* Thời Lượng */}
                      <td className="py-3.5 px-4 font-mono text-slate-300 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {duration} phút
                        </span>
                      </td>

                      {/* Tên Nhân Viên */}
                      <td className="py-3.5 px-4 font-semibold text-white whitespace-nowrap">
                        {t.employeeName}
                      </td>

                      {/* Phân Kho, Account, Khách Hàng, Số Cont Xe */}
                      <td className="py-3.5 px-4 min-w-[180px]">
                        {t.warehouseZone && (
                          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-cyan-300 border border-cyan-500/20 mb-0.5">
                            <Building2 className="w-2.5 h-2.5 text-cyan-400" />
                            <span>{t.warehouseZone.split(' - ')[0]}</span>
                          </div>
                        )}
                        {(t.accountCode || t.customerName) && (
                          <div className="text-[11px] font-semibold text-white truncate max-w-[180px]" title={`${t.accountCode} - ${t.customerName}`}>
                            {t.accountCode && <span className="text-amber-300 font-mono text-[10px] mr-1">{t.accountCode}</span>}
                            <span className="text-slate-300">{t.customerName}</span>
                          </div>
                        )}
                        {t.containerOrTruckNo && (
                          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 mt-0.5">
                            <Truck className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate max-w-[160px]">{t.containerOrTruckNo}</span>
                          </div>
                        )}
                      </td>

                      {/* Vị Trí & Cửa Dock */}
                      <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                        <div>{t.location}</div>
                        {t.dockId && (
                          <span className="inline-block mt-0.5 font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            {t.dockId}
                          </span>
                        )}
                      </td>

                      {/* Loại Vận Hành */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getOpBadge(t.operationType)}
                      </td>

                      {/* Quy Cách Hàng Hóa & Thể Tích CBM / Pallet Putaway */}
                      <td className="py-3.5 px-4 min-w-[160px]">
                        {t.cargoUnitType === 'carton_to_cbm' && (
                          <div>
                            <div className="text-blue-300 font-semibold flex items-center gap-1">
                              <Box className="w-3 h-3 text-blue-400" />
                              <span>{t.cartonCount ?? t.completedQuantity} Thùng</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-emerald-400">
                              ~ {t.cbmCount ?? 0} CBM
                            </span>
                          </div>
                        )}
                        {t.cargoUnitType === 'pallet_only' && (
                          <div>
                            <div className="text-emerald-300 font-semibold flex items-center gap-1">
                              <Boxes className="w-3 h-3 text-emerald-400" />
                              <span>{t.palletCount ?? t.completedQuantity} Pallet</span>
                            </div>
                            <span className="text-[10px] text-slate-400">Không CBM</span>
                          </div>
                        )}
                        {t.cargoUnitType === 'carton_to_pallet_putaway' && (
                          <div>
                            <div className="text-purple-300 font-semibold text-[11px] flex items-center gap-1">
                              <PackageOpen className="w-3 h-3 text-purple-400" />
                              <span>{t.cartonCount ?? t.completedQuantity} Thùng ➔ {t.putawayPalletCount} Pallet</span>
                            </div>
                            <span className="text-[10px] text-purple-400 font-mono">
                              ({t.cartonsPerPallet || 50} th/pl)
                            </span>
                          </div>
                        )}
                        {!t.cargoUnitType && (
                          <span className="text-slate-400 text-xs">
                            {t.completedQuantity} {t.unit}
                          </span>
                        )}
                      </td>

                      {/* Sản Lượng Hoàn Tất */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-mono font-bold text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>
                            {t.completedQuantity} / {t.targetQuantity} {t.unit}
                          </span>
                        </div>
                      </td>

                      {/* Cửa Dock */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {t.dockId ? (
                          <span className="font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                            {t.dockId}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">--</span>
                        )}
                      </td>

                      {/* Ca làm việc */}
                      <td className="py-3.5 px-4 uppercase text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {t.shift.replace('_', ' ')}
                      </td>

                      {/* Ghi Chú */}
                      <td className="py-3.5 px-4 text-slate-400 text-xs max-w-xs truncate" title={t.notes}>
                        {t.notes || <span className="text-slate-600 italic">Không có ghi chú</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Statistics */}
        <div className="p-3.5 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
          <div>
            Hiển thị <span className="font-semibold text-white">{filteredCompletedTasks.length}</span> / {completedTasks.length} công việc đã nghiệm thu
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Inbound: <strong className="text-blue-400">{opCounts.inbound}</strong> việc</span>
            <span>Outbound: <strong className="text-emerald-400">{opCounts.outbound}</strong> việc</span>
            <span>Putaway: <strong className="text-purple-400">{opCounts.putaway}</strong> việc</span>
            <span>Inspection: <strong className="text-amber-400">{opCounts.inspection}</strong> việc</span>
          </div>
        </div>
      </div>
    </div>
  );
};

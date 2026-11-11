import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Clock,
  User,
  MapPin,
  Truck,
  Box,
  Building2,
  PackageOpen,
  Boxes,
  HelpCircle,
  Calculator,
  ArrowRight
} from 'lucide-react';
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

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: DispatchTask | null;
  employees: Employee[];
  docks: DockDoor[];
  accounts?: CustomerAccount[];
  activeShift: ShiftType;
  onSave: (task: DispatchTask) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  task,
  employees,
  docks,
  accounts,
  activeShift,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<DispatchTask>>({
    employeeName: '',
    employeeId: '',
    location: '',
    startTime: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    status: 'pending',
    operationType: 'inbound',
    dockId: '',
    targetQuantity: 100,
    completedQuantity: 0,
    unit: 'Thùng carton',
    priority: 'normal',
    notes: '',
    shift: activeShift,
    warehouseZone: WAREHOUSE_ZONES[0],
    accountCode: '',
    customerName: '',
    containerOrTruckNo: '',
    cargoUnitType: 'carton_to_cbm',
    cartonCount: 100,
    cbmCount: 4.5,
    palletCount: 10,
    cartonsPerPallet: 50,
    putawayPalletCount: 2,
  });

  // Coefficient CBM per carton (m3/thùng), default 0.045
  const [cbmPerCarton, setCbmPerCarton] = useState<number>(0.045);

  useEffect(() => {
    if (task) {
      setFormData({ ...task });
      if (task.cartonCount && task.cbmCount) {
        const calculatedRate = Number((task.cbmCount / task.cartonCount).toFixed(4));
        if (calculatedRate > 0) setCbmPerCarton(calculatedRate);
      }
    } else {
      setFormData({
        employeeName: '',
        employeeId: '',
        location: 'Cửa Dock 01',
        startTime: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        status: 'pending',
        operationType: 'inbound',
        dockId: 'C01',
        targetQuantity: 200,
        completedQuantity: 0,
        unit: 'Thùng carton',
        priority: 'normal',
        notes: '',
        shift: activeShift,
        warehouseZone: WAREHOUSE_ZONES[0],
        accountCode: COMMON_ACCOUNTS[0].code,
        customerName: COMMON_ACCOUNTS[0].customer,
        containerOrTruckNo: 'TCLU-921840-2 (Cont 40ft)',
        cargoUnitType: 'carton_to_cbm',
        cartonCount: 200,
        cbmCount: 9.0,
        palletCount: 10,
        cartonsPerPallet: 50,
        putawayPalletCount: 4,
      });
      setCbmPerCarton(0.045);
    }
  }, [task, isOpen, activeShift]);

  if (!isOpen) return null;

  const handleEmployeeChange = (empId: string) => {
    if (!empId) {
      setFormData((prev) => ({ ...prev, employeeId: '', employeeName: 'Chưa phân công' }));
      return;
    }
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setFormData((prev) => ({
        ...prev,
        employeeId: emp.id,
        employeeName: emp.name,
      }));
    }
  };

  const handleDockChange = (dockId: string) => {
    const dock = docks.find((d) => d.id === dockId);
    if (dock) {
      setFormData((prev) => ({
        ...prev,
        dockId,
        location: dock.doorNumber,
        containerOrTruckNo: prev.containerOrTruckNo || dock.assignedTruck || '',
      }));
    } else {
      setFormData((prev) => ({ ...prev, dockId: '' }));
    }
  };

  const availableAccounts = accounts && accounts.length > 0 ? accounts : COMMON_ACCOUNTS;

  // Handle Account Selection Auto-fill
  const handleAccountSelect = (code: string) => {
    const acc = availableAccounts.find((a) => a.code === code);
    if (acc) {
      setFormData((prev) => ({
        ...prev,
        accountCode: acc.code,
        customerName: acc.customer,
        warehouseZone: acc.defaultZone || prev.warehouseZone,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        accountCode: code,
      }));
    }
  };

  // Rule 1: Carton => CBM
  const handleCartonCountChange = (cartons: number) => {
    const validCartons = Math.max(0, cartons);
    const newCbm = parseFloat((validCartons * cbmPerCarton).toFixed(2));
    const isSanHang = formData.cargoUnitType === 'carton_to_pallet_putaway';
    const perPallet = formData.cartonsPerPallet || 50;
    const newPutawayPallets = Math.ceil(validCartons / perPallet);

    setFormData((prev) => ({
      ...prev,
      cartonCount: validCartons,
      cbmCount: newCbm,
      putawayPalletCount: newPutawayPallets,
      targetQuantity: validCartons,
      unit: isSanHang ? 'Thùng (san pallet)' : 'Thùng carton',
    }));
  };

  // Change CBM per carton rate
  const handleRateChange = (rate: number) => {
    const validRate = Math.max(0.001, rate);
    setCbmPerCarton(validRate);
    const cartons = formData.cartonCount || 0;
    const newCbm = parseFloat((cartons * validRate).toFixed(2));
    setFormData((prev) => ({
      ...prev,
      cbmCount: newCbm,
    }));
  };

  // Direct CBM edit
  const handleDirectCbmChange = (cbm: number) => {
    setFormData((prev) => ({
      ...prev,
      cbmCount: Math.max(0, cbm),
    }));
  };

  // Rule 2: Pallet => NO CBM
  const handlePalletCountChange = (pallets: number) => {
    const validPallets = Math.max(0, pallets);
    setFormData((prev) => ({
      ...prev,
      palletCount: validPallets,
      cbmCount: undefined, // "nếu số pallet không cần số cbm"
      targetQuantity: validPallets,
      unit: 'Pallet tiêu chuẩn',
    }));
  };

  // Rule 3: San hàng => Carton san ra Pallet Putaway
  const handleCartonsPerPalletChange = (cpp: number) => {
    const validCpp = Math.max(1, cpp);
    const cartons = formData.cartonCount || 0;
    const newPutawayPallets = Math.ceil(cartons / validCpp);

    setFormData((prev) => ({
      ...prev,
      cartonsPerPallet: validCpp,
      putawayPalletCount: newPutawayPallets,
    }));
  };

  // Switching cargo unit type mode
  const handleCargoUnitTypeChange = (type: 'carton_to_cbm' | 'pallet_only' | 'carton_to_pallet_putaway') => {
    if (type === 'carton_to_cbm') {
      const cartons = formData.cartonCount || 100;
      const cbm = parseFloat((cartons * cbmPerCarton).toFixed(2));
      setFormData((prev) => ({
        ...prev,
        cargoUnitType: type,
        cartonCount: cartons,
        cbmCount: cbm,
        targetQuantity: cartons,
        unit: 'Thùng carton',
      }));
    } else if (type === 'pallet_only') {
      const pallets = formData.palletCount || 10;
      setFormData((prev) => ({
        ...prev,
        cargoUnitType: type,
        palletCount: pallets,
        cbmCount: undefined, // Rule: pallet không cần CBM
        targetQuantity: pallets,
        unit: 'Pallet tiêu chuẩn',
      }));
    } else if (type === 'carton_to_pallet_putaway') {
      const cartons = formData.cartonCount || 200;
      const perPallet = formData.cartonsPerPallet || 50;
      const putaway = Math.ceil(cartons / perPallet);
      setFormData((prev) => ({
        ...prev,
        cargoUnitType: type,
        cartonCount: cartons,
        cartonsPerPallet: perPallet,
        putawayPalletCount: putaway,
        targetQuantity: cartons,
        unit: 'Thùng (san pallet)',
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalTask: DispatchTask = {
      id: task ? task.id : `CV-${Math.floor(1000 + Math.random() * 9000)}`,
      employeeId: formData.employeeId || undefined,
      employeeName: formData.employeeName || 'Chưa phân công',
      location: formData.location || 'Khu chung',
      startTime: formData.startTime || '08:00',
      endTime:
        formData.status === 'completed'
          ? formData.endTime ||
            new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
          : undefined,
      status: (formData.status as TaskStatus) || 'pending',
      operationType: (formData.operationType as OperationType) || 'inbound',
      dockId: formData.dockId || undefined,
      targetQuantity: Number(formData.targetQuantity) || 100,
      completedQuantity: Number(formData.completedQuantity) || 0,
      unit: formData.unit || 'Kiện',
      priority: formData.priority || 'normal',
      notes: formData.notes || '',
      shift: formData.shift || activeShift,

      // Logistics & WMS fields
      warehouseZone: formData.warehouseZone || WAREHOUSE_ZONES[0],
      accountCode: formData.accountCode || undefined,
      customerName: formData.customerName || undefined,
      containerOrTruckNo: formData.containerOrTruckNo || undefined,
      cargoUnitType: formData.cargoUnitType || 'carton_to_cbm',
      cartonCount: formData.cartonCount,
      cbmCount: formData.cargoUnitType === 'pallet_only' ? undefined : formData.cbmCount,
      palletCount: formData.palletCount,
      cartonsPerPallet: formData.cartonsPerPallet,
      putawayPalletCount: formData.putawayPalletCount,

      updatedAt: new Date().toISOString(),
    };

    onSave(finalTask);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <Box className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-white">
                {task ? `Chỉnh Sửa Công Việc #${task.id}` : 'Thêm Mới Công Việc Điều Phối Kho'}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Phân kho, Account, Khách hàng nhập, Số cont/xe và quy cách tính toán CBM / Pallet / San hàng Putaway
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Operation Type Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              1. Loại Vận Hành (Operation Type) *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { id: 'inbound', label: 'Inbound', sub: 'Nhập hàng', color: 'border-blue-500/40 bg-blue-500/10 text-blue-300' },
                  { id: 'outbound', label: 'Outbound', sub: 'Xuất hàng', color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' },
                  { id: 'putaway', label: 'Putaway', sub: 'Cất kệ/Pallet', color: 'border-purple-500/40 bg-purple-500/10 text-purple-300' },
                  { id: 'inspection', label: 'Inspection', sub: 'Kiểm định QC', color: 'border-amber-500/40 bg-amber-500/10 text-amber-300' },
                ] as const
              ).map((op) => (
                <button
                  type="button"
                  key={op.id}
                  onClick={() => setFormData({ ...formData, operationType: op.id })}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    formData.operationType === op.id
                      ? `${op.color} ring-1 ring-white/20 font-semibold shadow-md`
                      : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-bold uppercase">{op.label}</div>
                  <div className="text-[10px] opacity-80">{op.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Section: Phân Kho, Account, Khách Hàng Nhập & Số Cont/Xe */}
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/70 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300 uppercase tracking-wide">
              <Building2 className="w-3.5 h-3.5" />
              <span>2. Thông Tin Kho, Khách Hàng & Vận Tải</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Phân Kho */}
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Phân Kho Lưu Trữ *
                </label>
                <select
                  value={formData.warehouseZone || WAREHOUSE_ZONES[0]}
                  onChange={(e) => setFormData({ ...formData, warehouseZone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  {WAREHOUSE_ZONES.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Số Cont / Xe Tải */}
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <Truck className="w-3 h-3 text-cyan-400" />
                  Số Cont Xe / Biển Số Xe Tải
                </label>
                <input
                  type="text"
                  value={formData.containerOrTruckNo || ''}
                  onChange={(e) => setFormData({ ...formData, containerOrTruckNo: e.target.value })}
                  placeholder="VD: TCLU-921840-2 (Cont 40ft), 29C-882.14..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              {/* Account Dropdown */}
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Mã Account Đối Tác
                </label>
                <div className="flex gap-1.5">
                  <select
                    value={formData.accountCode || ''}
                    onChange={(e) => handleAccountSelect(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">-- Tùy chọn Account --</option>
                    {availableAccounts.map((acc) => (
                      <option key={acc.id || acc.code} value={acc.code}>
                        {acc.code} ({acc.customer})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Khách Hàng Nhập */}
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Khách Hàng Nhập (Shipper / Chủ Hàng)
                </label>
                <input
                  type="text"
                  value={formData.customerName || ''}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="VD: Samsung Electronics VN, Unilever..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Section: Quy Cách Hàng Hóa & Tự Động Tính CBM / Pallet / San Hàng */}
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-blue-500/30 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-300 uppercase tracking-wide">
                <Calculator className="w-3.5 h-3.5 text-blue-400" />
                <span>3. Quy Cách Hàng Hóa & Công Thức Tính Tự Động</span>
              </div>
              <span className="text-[10px] text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                WMS Standard
              </span>
            </div>

            {/* 3 Modes Selector Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Mode 1: Carton => CBM */}
              <button
                type="button"
                onClick={() => handleCargoUnitTypeChange('carton_to_cbm')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  formData.cargoUnitType === 'carton_to_cbm'
                    ? 'border-blue-500 bg-blue-500/20 text-white shadow-md ring-1 ring-blue-500/50'
                    : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Box className="w-3.5 h-3.5 text-blue-400" />
                  <span>Số Carton ➔ CBM</span>
                </div>
                <div className="text-[10px] text-slate-300 mt-0.5">
                  Đo thùng và tính thể tích m³
                </div>
              </button>

              {/* Mode 2: Pallet => NO CBM */}
              <button
                type="button"
                onClick={() => handleCargoUnitTypeChange('pallet_only')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  formData.cargoUnitType === 'pallet_only'
                    ? 'border-emerald-500 bg-emerald-500/20 text-white shadow-md ring-1 ring-emerald-500/50'
                    : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Boxes className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Số Pallet (Không CBM)</span>
                </div>
                <div className="text-[10px] text-slate-300 mt-0.5">
                  Chỉ đếm pallet, không tính CBM
                </div>
              </button>

              {/* Mode 3: San Hàng => Carton to Putaway Pallet */}
              <button
                type="button"
                onClick={() => handleCargoUnitTypeChange('carton_to_pallet_putaway')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  formData.cargoUnitType === 'carton_to_pallet_putaway'
                    ? 'border-purple-500 bg-purple-500/20 text-white shadow-md ring-1 ring-purple-500/50'
                    : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <PackageOpen className="w-3.5 h-3.5 text-purple-400" />
                  <span>San Hàng ➔ Putaway</span>
                </div>
                <div className="text-[10px] text-slate-300 mt-0.5">
                  Dỡ cont carton san ra pallet
                </div>
              </button>
            </div>

            {/* Dynamic Input Block based on chosen mode */}
            {/* MODE 1: Carton => CBM */}
            {formData.cargoUnitType === 'carton_to_cbm' && (
              <div className="p-3 bg-slate-950/70 border border-blue-500/30 rounded-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-blue-300 mb-1">
                      Số Thùng Carton *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.cartonCount || ''}
                      onChange={(e) => handleCartonCountChange(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Hệ Số CBM / Thùng
                    </label>
                    <input
                      type="number"
                      step="0.005"
                      min="0.001"
                      value={cbmPerCarton}
                      onChange={(e) => handleRateChange(parseFloat(e.target.value) || 0.045)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-cyan-300 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-300 mb-1">
                      Tổng Thể Tích (Số CBM) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.cbmCount ?? 0}
                      onChange={(e) => handleDirectCbmChange(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-emerald-500/50 rounded-lg px-3 py-1.5 text-xs text-emerald-400 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-300 bg-blue-950/30 px-3 py-1.5 rounded-lg border border-blue-500/20">
                  <span>
                    Công thức: <strong>{formData.cartonCount || 0} thùng</strong> × {cbmPerCarton} m³ =
                  </span>
                  <span className="font-mono font-bold text-emerald-400 text-xs">
                    {formData.cbmCount || 0} CBM (m³)
                  </span>
                </div>
              </div>
            )}

            {/* MODE 2: Pallet Only (NO CBM) */}
            {formData.cargoUnitType === 'pallet_only' && (
              <div className="p-3 bg-slate-950/70 border border-emerald-500/30 rounded-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-300 mb-1">
                      Số Lượng Pallet *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.palletCount || ''}
                      onChange={(e) => handlePalletCountChange(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono font-bold"
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Hàng Pallet: <strong>Không cần tính số CBM</strong></span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 italic">
                  * Hệ thống tự động bỏ qua chỉ số CBM theo đúng quy định điều phối cho hàng nguyên kiện Pallet.
                </p>
              </div>
            )}

            {/* MODE 3: San Hàng (Carton to Putaway Pallet) */}
            {formData.cargoUnitType === 'carton_to_pallet_putaway' && (
              <div className="p-3 bg-slate-950/70 border border-purple-500/30 rounded-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-purple-300 mb-1">
                      Số Carton Dỡ Ra *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.cartonCount || ''}
                      onChange={(e) => handleCartonCountChange(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Quy Cách (Thùng / Pallet) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.cartonsPerPallet || 50}
                      onChange={(e) => handleCartonsPerPalletChange(parseInt(e.target.value, 10) || 1)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-cyan-300 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-purple-300 mb-1">
                      Số Pallet Putaway Cất Kệ
                    </label>
                    <div className="w-full bg-purple-950/40 border border-purple-500/40 rounded-lg px-3 py-1.5 text-xs text-purple-200 font-mono font-bold flex items-center justify-between">
                      <span>{formData.putawayPalletCount || 0}</span>
                      <span className="text-[10px] text-purple-300">Pallet cất kệ</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-300 bg-purple-950/30 px-3 py-1.5 rounded-lg border border-purple-500/20">
                  <span className="flex items-center gap-1.5">
                    <strong>{formData.cartonCount || 0} carton</strong>
                    <ArrowRight className="w-3 h-3 text-purple-400" />
                    quy cách {formData.cartonsPerPallet || 50} thùng/pallet =
                  </span>
                  <span className="font-mono font-bold text-purple-300 text-xs">
                    {formData.putawayPalletCount || 0} Pallet Putaway
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section: Nhân Viên, Cửa Dock & Vị Trí */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" />
                Tên Nhân Viên Phụ Trách *
              </label>
              <select
                value={formData.employeeId || ''}
                onChange={(e) => handleEmployeeChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Chưa phân công --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.id}) - {emp.role === 'forklift_driver' ? 'Lái xe nâng' : emp.role === 'qc_inspector' ? 'Kiểm KCS' : 'Nhân viên'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-emerald-400" />
                Số Cửa Dock (socua)
              </label>
              <select
                value={formData.dockId || ''}
                onChange={(e) => handleDockChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Không gắn cửa cụ thể --</option>
                {docks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.doorNumber} ({d.type.toUpperCase()}) {d.assignedTruck ? `- [${d.assignedTruck}]` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location & Start Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                Vị Trí Làm Việc Cụ Thể *
              </label>
              <input
                type="text"
                required
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="VD: Cửa Dock 01, Kệ Rack B-04, Khu QC..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Thời Gian Bắt Đầu (Start Time) *
              </label>
              <input
                type="time"
                required
                value={formData.startTime || ''}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Trạng Thái Hoàn Thành *
              </label>
              <select
                value={formData.status || 'pending'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="pending">Chờ thực hiện (Pending)</option>
                <option value="in_progress">Đang thực hiện (In Progress)</option>
                <option value="completed">Đã hoàn thành (Completed)</option>
                <option value="delayed">Chậm tiến độ (Delayed)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Mức Độ Ưu Tiên
              </label>
              <select
                value={formData.priority || 'normal'}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="low">Thấp</option>
                <option value="normal">Bình thường</option>
                <option value="high">Cao</option>
                <option value="urgent">Khẩn cấp (Ưu tiên xe rời)</option>
              </select>
            </div>
          </div>

          {/* Quantities: Target vs Completed */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                SL Kế Hoạch *
              </label>
              <input
                type="number"
                min="1"
                value={formData.targetQuantity || ''}
                onChange={(e) => setFormData({ ...formData, targetQuantity: parseInt(e.target.value, 10) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                SL Đã Hoàn Thành
              </label>
              <input
                type="number"
                min="0"
                value={formData.completedQuantity || 0}
                onChange={(e) => setFormData({ ...formData, completedQuantity: parseInt(e.target.value, 10) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-emerald-400 font-semibold font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Đơn Vị Tính
              </label>
              <input
                type="text"
                value={formData.unit || 'Kiện'}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Ghi Chú Vận Hành / Hướng Dẫn
            </label>
            <textarea
              rows={2}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="VD: Kiểm tra niêm phong seal cont, hàng dễ vỡ, quét mã barcode pallet..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-md"
          >
            <Check className="w-4 h-4" />
            Lưu Công Việc
          </button>
        </div>
      </div>
    </div>
  );
};


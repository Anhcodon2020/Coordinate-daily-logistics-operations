import React, { useState, useEffect } from 'react';
import { X, Check, Truck, User, Clock, AlertTriangle } from 'lucide-react';
import { DockDoor, DockStatus, Employee } from '../types';

interface DockModalProps {
  isOpen: boolean;
  onClose: () => void;
  dock: DockDoor | null;
  employees: Employee[];
  onSave: (dock: DockDoor) => void;
}

export const DockModal: React.FC<DockModalProps> = ({
  isOpen,
  onClose,
  dock,
  employees,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<DockDoor>>({
    doorNumber: '',
    type: 'inbound',
    status: 'available',
    assignedTruck: '',
    carrierName: '',
    assignedEmployeeIds: [],
    eta: '',
  });

  useEffect(() => {
    if (dock) {
      setFormData({ ...dock });
    } else {
      setFormData({
        doorNumber: '',
        type: 'inbound',
        status: 'available',
        assignedTruck: '',
        carrierName: '',
        assignedEmployeeIds: [],
        eta: '',
      });
    }
  }, [dock, isOpen]);

  if (!isOpen) return null;

  const handleToggleEmployee = (empId: string) => {
    const current = formData.assignedEmployeeIds || [];
    if (current.includes(empId)) {
      setFormData({
        ...formData,
        assignedEmployeeIds: current.filter((id) => id !== empId),
      });
    } else {
      setFormData({
        ...formData,
        assignedEmployeeIds: [...current, empId],
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.doorNumber?.trim()) return;

    const saved: DockDoor = {
      id: dock ? dock.id : `C0${Math.floor(10 + Math.random() * 90)}`,
      doorNumber: formData.doorNumber.trim(),
      type: formData.type || 'inbound',
      status: (formData.status as DockStatus) || 'available',
      assignedTruck: formData.assignedTruck || undefined,
      carrierName: formData.carrierName || undefined,
      assignedEmployeeIds: formData.assignedEmployeeIds || [],
      currentTaskId: formData.currentTaskId || undefined,
      eta: formData.eta || undefined,
    };

    onSave(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div>
            <h2 className="text-base font-bold text-white">
              {dock ? `Cập Nhật Cửa Dock #${dock.id}` : 'Thêm Cửa Dock Mới (socua)'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Quản lý số cửa, xe container cập bến và đội bốc xếp
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-blue-400" />
                Tên / Số Cửa *
              </label>
              <input
                type="text"
                required
                value={formData.doorNumber || ''}
                onChange={(e) => setFormData({ ...formData, doorNumber: e.target.value })}
                placeholder="VD: Cửa Dock 07"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Loại Cửa</label>
              <select
                value={formData.type || 'inbound'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
              >
                <option value="inbound">Inbound (Nhập hàng)</option>
                <option value="outbound">Outbound (Xuất hàng)</option>
                <option value="hybrid">Đa năng (In & Out)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Trạng Thái Cửa Dock Hiện Tại
            </label>
            <select
              value={formData.status || 'available'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as DockStatus })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
            >
              <option value="available">Cửa trống / Sẵn sàng</option>
              <option value="docked_unloading">Xe đã cập - Đang dỡ hàng (Inbound)</option>
              <option value="docked_loading">Xe đã cập - Đang bốc hàng (Outbound)</option>
              <option value="waiting_truck">Đang chờ xe cập bến</option>
              <option value="maintenance">Tạm khóa bảo trì sàn nâng</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Biển Số Xe / Số Cont
              </label>
              <input
                type="text"
                value={formData.assignedTruck || ''}
                onChange={(e) => setFormData({ ...formData, assignedTruck: e.target.value })}
                placeholder="29C-123.45 (Cont 40ft)"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Hãng Vận Tải / Đối Tác
              </label>
              <input
                type="text"
                value={formData.carrierName || ''}
                onChange={(e) => setFormData({ ...formData, carrierName: e.target.value })}
                placeholder="GHN, Kerry, Viettel..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Giờ Xe Đến / Rời Dự Kiến (ETA)
            </label>
            <input
              type="text"
              value={formData.eta || ''}
              onChange={(e) => setFormData({ ...formData, eta: e.target.value })}
              placeholder="VD: 09:30 hoặc 14:00"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>

          {/* Assign Personnel */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              Gán Nhân Viên Phụ Trách Cửa (Chọn nhiều)
            </label>
            <div className="max-h-28 overflow-y-auto space-y-1 bg-slate-800/60 p-2 rounded-lg border border-slate-700">
              {employees.map((emp) => {
                const isSelected = (formData.assignedEmployeeIds || []).includes(emp.id);
                return (
                  <button
                    type="button"
                    key={emp.id}
                    onClick={() => handleToggleEmployee(emp.id)}
                    className={`w-full flex items-center justify-between p-1.5 rounded text-xs transition-colors ${
                      isSelected
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                        : 'hover:bg-slate-700/60 text-slate-300'
                    }`}
                  >
                    <span>{emp.name} ({emp.id})</span>
                    <span className="text-[10px] text-slate-400">{emp.assignedArea || 'Chưa gán'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-md"
            >
              <Check className="w-4 h-4" />
              Lưu Cửa Dock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

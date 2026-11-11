import React, { useState, useEffect } from 'react';
import { X, Check, User, Phone, Briefcase, Clock, MapPin, Building2 } from 'lucide-react';
import { Employee, EmployeeRole, ShiftType, WAREHOUSE_ZONES } from '../types';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  activeShift: ShiftType;
  onSave: (emp: Employee) => void;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  employee,
  activeShift,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<Employee>>({
    name: '',
    role: 'forklift_driver',
    shift: activeShift,
    phone: '',
    status: 'available',
    assignedArea: '',
    warehouseZone: WAREHOUSE_ZONES[0],
    completedTasksToday: 0,
    totalUnitsToday: 0,
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        ...employee,
        warehouseZone: employee.warehouseZone || WAREHOUSE_ZONES[0],
      });
    } else {
      setFormData({
        name: '',
        role: 'forklift_driver',
        shift: activeShift,
        phone: '',
        status: 'available',
        assignedArea: '',
        warehouseZone: WAREHOUSE_ZONES[0],
        completedTasksToday: 0,
        totalUnitsToday: 0,
      });
    }
  }, [employee, isOpen, activeShift]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    const saved: Employee = {
      id: employee ? employee.id : `NV-${Math.floor(100 + Math.random() * 900)}`,
      name: formData.name.trim(),
      role: (formData.role as EmployeeRole) || 'forklift_driver',
      shift: (formData.shift as ShiftType) || activeShift,
      phone: formData.phone || '',
      status: formData.status || 'available',
      assignedArea: formData.assignedArea || 'Khu chung',
      warehouseZone: formData.warehouseZone || WAREHOUSE_ZONES[0],
      completedTasksToday: formData.completedTasksToday || 0,
      totalUnitsToday: formData.totalUnitsToday || 0,
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
              {employee ? `Cập Nhật Nhân Viên #${employee.id}` : 'Thêm Nhân Viên Mới (nhanvien)'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Hồ sơ nhân sự, phân ca và khu vực phụ trách
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
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-400" />
              Họ Và Tên Nhân Viên *
            </label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: Nguyễn Văn An"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                Vị Trí Chuyên Môn
              </label>
              <select
                value={formData.role || 'warehouse_worker'}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as EmployeeRole })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
              >
                <option value="forklift_driver">Lái xe nâng (Forklift)</option>
                <option value="tallyman">Kiểm đếm (Tallyman)</option>
                <option value="qc_inspector">Kiểm hàng KCS (QC)</option>
                <option value="warehouse_worker">Bốc xếp / Dỡ hàng</option>
                <option value="packer">Đóng gói / Xuất hàng</option>
                <option value="supervisor">Trưởng ca / Điều phối</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Ca Phân Công
              </label>
              <select
                value={formData.shift || activeShift}
                onChange={(e) => setFormData({ ...formData, shift: e.target.value as ShiftType })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
              >
                <option value="ca_1">Ca 1 (06:00 - 14:00)</option>
                <option value="ca_2">Ca 2 (14:00 - 22:00)</option>
                <option value="ca_3">Ca 3 (22:00 - 06:00)</option>
                <option value="ca_hanh_chinh">Ca Hành chính</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                SĐT / Bộ Đàm
              </label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="09xx hoặc Kênh 04"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Trạng Thái Hiện Tại
              </label>
              <select
                value={formData.status || 'available'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
              >
                <option value="available">Sẵn sàng (Available)</option>
                <option value="busy">Đang làm việc (Busy)</option>
                <option value="on_break">Nghỉ giữa ca (Break)</option>
                <option value="off_duty">Hết ca (Off Duty)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                Phân Thuộc Kho *
              </label>
              <select
                value={formData.warehouseZone || WAREHOUSE_ZONES[0]}
                onChange={(e) => setFormData({ ...formData, warehouseZone: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                {WAREHOUSE_ZONES.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                Khu Vực / Cửa Phụ Trách
              </label>
              <input
                type="text"
                value={formData.assignedArea || ''}
                onChange={(e) => setFormData({ ...formData, assignedArea: e.target.value })}
                placeholder="VD: Cửa Dock 01, Kệ Rack A..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-md"
            >
              <Check className="w-4 h-4" />
              Lưu Nhân Viên
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

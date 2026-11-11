import React from 'react';
import {
  TrendingUp,
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  PackageCheck,
  ShieldCheck,
  Layers,
  BarChart3,
  Truck
} from 'lucide-react';
import { DispatchTask, Employee, DockDoor, OperationType } from '../types';

interface ProductivityAnalyticsProps {
  tasks: DispatchTask[];
  employees: Employee[];
  docks: DockDoor[];
}

export const ProductivityAnalytics: React.FC<ProductivityAnalyticsProps> = ({
  tasks,
  employees,
  docks,
}) => {
  // Calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const delayedTasks = tasks.filter((t) => t.status === 'delayed').length;
  const pendingTasks = tasks.filter((t) => t.status === 'pending').length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalTargetUnits = tasks.reduce((sum, t) => sum + (t.targetQuantity || 0), 0);
  const totalCompletedUnits = tasks.reduce((sum, t) => sum + (t.completedQuantity || 0), 0);
  const unitsProgressRate = totalTargetUnits > 0 ? Math.round((totalCompletedUnits / totalTargetUnits) * 100) : 0;

  // By Operation
  const opStats: Record<OperationType, { target: number; completed: number; taskCount: number; completedCount: number }> = {
    inbound: { target: 0, completed: 0, taskCount: 0, completedCount: 0 },
    outbound: { target: 0, completed: 0, taskCount: 0, completedCount: 0 },
    putaway: { target: 0, completed: 0, taskCount: 0, completedCount: 0 },
    inspection: { target: 0, completed: 0, taskCount: 0, completedCount: 0 },
  };

  tasks.forEach((t) => {
    if (opStats[t.operationType]) {
      opStats[t.operationType].target += t.targetQuantity || 0;
      opStats[t.operationType].completed += t.completedQuantity || 0;
      opStats[t.operationType].taskCount += 1;
      if (t.status === 'completed') {
        opStats[t.operationType].completedCount += 1;
      }
    }
  });

  // Calculate top performers
  const employeePerformance = employees.map((emp) => {
    // Find all tasks assigned to this employee
    const empTasks = tasks.filter(
      (t) => t.employeeId === emp.id || t.employeeName.toLowerCase().includes(emp.name.toLowerCase())
    );
    const completedTasksCount = empTasks.filter((t) => t.status === 'completed').length;
    const completedUnits = empTasks.reduce((sum, t) => sum + (t.completedQuantity || 0), 0);

    return {
      employee: emp,
      completedTasksCount,
      completedUnits,
      rate: empTasks.length > 0 ? Math.round((completedTasksCount / empTasks.length) * 100) : 0,
    };
  });

  employeePerformance.sort((a, b) => b.completedUnits - a.completedUnits);

  // Dock utilization rate
  const activeDocks = docks.filter(
    (d) => d.status === 'docked_loading' || d.status === 'docked_unloading'
  ).length;
  const dockUtilization = docks.length > 0 ? Math.round((activeDocks / docks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Level KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Completion Rate */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Tiến Độ Công Việc Hôm Nay</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{completionRate}%</span>
            <span className="text-xs text-slate-400">
              ({completedTasks}/{totalTasks} công việc)
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Units Processed */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Tổng Sản Lượng Đã Xử Lý</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">
              {totalCompletedUnits.toLocaleString('vi-VN')}
            </span>
            <span className="text-xs text-slate-400">/ {totalTargetUnits.toLocaleString('vi-VN')} đơn vị</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${unitsProgressRate}%` }}
            />
          </div>
        </div>

        {/* Dock Utilization */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Hiệu Suất Cửa Dock (socua)</span>
            <Truck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{dockUtilization}%</span>
            <span className="text-xs text-slate-400">
              ({activeDocks}/{docks.length} cửa đang bốc/dỡ)
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-cyan-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${dockUtilization}%` }}
            />
          </div>
        </div>

        {/* Bottle-neck / Delayed alert */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Nghẽn / Chậm Tiến Độ</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400 font-mono">{delayedTasks}</span>
            <span className="text-xs text-slate-400">công việc cần can thiệp</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-ping mr-1" />
            Đang thực hiện: {inProgressTasks} | Chờ: {pendingTasks}
          </div>
        </div>
      </div>

      {/* Grid: Operation Breakdown & Employee Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Operation Type Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <h3 className="font-semibold text-sm text-white">Năng Suất Theo Loại Vận Hành</h3>
            </div>
            <span className="text-[11px] text-slate-400">4 Nhóm nghiệp vụ kho</span>
          </div>

          <div className="space-y-4">
            {/* Inbound */}
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-blue-400 flex items-center gap-1.5">
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  Inbound (Dỡ & Nhập Hàng)
                </span>
                <span className="font-mono text-white font-medium">
                  {opStats.inbound.completed} / {opStats.inbound.target} kiện ({opStats.inbound.target > 0 ? Math.round((opStats.inbound.completed / opStats.inbound.target) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all"
                  style={{
                    width: `${opStats.inbound.target > 0 ? (opStats.inbound.completed / opStats.inbound.target) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>{opStats.inbound.completedCount}/{opStats.inbound.taskCount} việc đã xong</span>
                <span>Kiểm đếm tại cửa dock Inbound</span>
              </div>
            </div>

            {/* Outbound */}
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Outbound (Đóng Gói & Xuất Xe)
                </span>
                <span className="font-mono text-white font-medium">
                  {opStats.outbound.completed} / {opStats.outbound.target} kiện ({opStats.outbound.target > 0 ? Math.round((opStats.outbound.completed / opStats.outbound.target) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{
                    width: `${opStats.outbound.target > 0 ? (opStats.outbound.completed / opStats.outbound.target) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>{opStats.outbound.completedCount}/{opStats.outbound.taskCount} việc đã xong</span>
                <span>Bàn giao tài xế & niêm chì xe</span>
              </div>
            </div>

            {/* Putaway */}
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-purple-400 flex items-center gap-1.5">
                  <PackageCheck className="w-3.5 h-3.5" />
                  Putaway (Cất Pallet Vào Kệ Rack)
                </span>
                <span className="font-mono text-white font-medium">
                  {opStats.putaway.completed} / {opStats.putaway.target} pallet ({opStats.putaway.target > 0 ? Math.round((opStats.putaway.completed / opStats.putaway.target) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-purple-500 h-full rounded-full transition-all"
                  style={{
                    width: `${opStats.putaway.target > 0 ? (opStats.putaway.completed / opStats.putaway.target) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>{opStats.putaway.completedCount}/{opStats.putaway.taskCount} việc đã xong</span>
                <span>Xe nâng Reach truck & Staging</span>
              </div>
            </div>

            {/* Inspection */}
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Inspection (Kiểm Định KCS & QC)
                </span>
                <span className="font-mono text-white font-medium">
                  {opStats.inspection.completed} / {opStats.inspection.target} mẫu ({opStats.inspection.target > 0 ? Math.round((opStats.inspection.completed / opStats.inspection.target) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all"
                  style={{
                    width: `${opStats.inspection.target > 0 ? (opStats.inspection.completed / opStats.inspection.target) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>{opStats.inspection.completedCount}/{opStats.inspection.taskCount} việc đã xong</span>
                <span>Kiểm tra lỗi ngoại quan & hạn sử dụng</span>
              </div>
            </div>
          </div>
        </div>

        {/* Employee Leaderboard */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <h3 className="font-semibold text-sm text-white">Bảng Xếp Hạng Năng Suất (nhanvien)</h3>
            </div>
            <span className="text-[11px] text-slate-400">Xếp theo sản lượng thực tế</span>
          </div>

          <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
            {employeePerformance.map((item, index) => {
              const medalColors = [
                'bg-amber-500 text-slate-950 font-bold',
                'bg-slate-300 text-slate-900 font-bold',
                'bg-amber-700 text-white font-bold',
              ];

              return (
                <div
                  key={item.employee.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        index < 3 ? medalColors[index] : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-2">
                        <span>{item.employee.name}</span>
                        <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-slate-700 text-slate-300">
                          {item.employee.role === 'forklift_driver'
                            ? 'Lái nâng'
                            : item.employee.role === 'qc_inspector'
                            ? 'QC'
                            : item.employee.role === 'packer'
                            ? 'Đóng gói'
                            : 'Bốc xếp'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {item.employee.assignedArea || 'Chưa gán vị trí'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-400 font-mono">
                      {item.completedUnits.toLocaleString('vi-VN')} đơn vị
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {item.completedTasksCount} việc hoàn tất
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

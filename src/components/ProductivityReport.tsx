import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  TooltipProps
} from 'recharts';
import { DispatchTask, Employee, ShiftType, OperationType } from '../types';
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  CheckCircle2,
  Clock,
  Filter,
  Sparkles,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  PackageCheck,
  ShieldCheck,
  Radio
} from 'lucide-react';

interface ProductivityReportProps {
  tasks: DispatchTask[];
  employees: Employee[];
  activeShift: ShiftType;
}

const BAR_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#8b5cf6', // Purple
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#6366f1', // Indigo
  '#14b8a6', // Teal
];

export const ProductivityReport: React.FC<ProductivityReportProps> = ({
  tasks,
  employees,
  activeShift,
}) => {
  const [metricType, setMetricType] = useState<'tasks' | 'units'>('tasks');
  const [filterShift, setFilterShift] = useState<ShiftType | 'all'>('all');
  const [filterOperation, setFilterOperation] = useState<OperationType | 'all'>('all');

  // Filter tasks based on selected controls
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filterShift !== 'all' && t.shift !== filterShift) return false;
      if (filterOperation !== 'all' && t.operationType !== filterOperation) return false;
      return true;
    });
  }, [tasks, filterShift, filterOperation]);

  // Calculate completed tasks & units for each employee
  const employeeData = useMemo(() => {
    const data = employees.map((emp, index) => {
      // Find tasks assigned to this employee
      const empTasks = filteredTasks.filter(
        (t) =>
          t.employeeId === emp.id ||
          t.employeeName.toLowerCase().trim() === emp.name.toLowerCase().trim()
      );

      const completedTasks = empTasks.filter((t) => t.status === 'completed').length;
      const inProgressTasks = empTasks.filter((t) => t.status === 'in_progress').length;
      const totalTasks = empTasks.length;

      const completedUnits = empTasks
        .filter((t) => t.status === 'completed')
        .reduce((sum, t) => sum + (t.completedQuantity || t.targetQuantity || 0), 0);

      const inProgressUnits = empTasks
        .filter((t) => t.status === 'in_progress')
        .reduce((sum, t) => sum + (t.completedQuantity || 0), 0);

      const roleLabel =
        emp.role === 'forklift_driver'
          ? 'Lái xe nâng'
          : emp.role === 'qc_inspector'
          ? 'Kiểm KCS'
          : emp.role === 'packer'
          ? 'Đóng gói'
          : emp.role === 'supervisor'
          ? 'Trưởng ca'
          : 'Bốc dỡ';

      return {
        id: emp.id,
        name: emp.name,
        shortName: emp.name.split(' ').slice(-2).join(' '), // Last 2 words for crisp chart axis
        role: roleLabel,
        shift: emp.shift,
        completedTasks,
        inProgressTasks,
        totalTasks,
        completedUnits,
        inProgressUnits,
        color: BAR_COLORS[index % BAR_COLORS.length],
      };
    });

    // Sort descending by selected metric
    if (metricType === 'tasks') {
      return data.sort((a, b) => b.completedTasks - a.completedTasks);
    } else {
      return data.sort((a, b) => b.completedUnits - a.completedUnits);
    }
  }, [employees, filteredTasks, metricType]);

  // Summary KPIs
  const totalCompletedTasks = employeeData.reduce((sum, d) => sum + d.completedTasks, 0);
  const totalCompletedUnits = employeeData.reduce((sum, d) => sum + d.completedUnits, 0);
  const avgCompletedPerEmp =
    employeeData.length > 0 ? (totalCompletedTasks / employeeData.length).toFixed(1) : '0';
  const topPerformer = employeeData[0] || null;

  // Breakdown by Operation for the Pie Chart
  const operationBreakdown = useMemo(() => {
    const ops: Record<OperationType, { name: string; value: number; color: string }> = {
      inbound: { name: 'Inbound (Nhập)', value: 0, color: '#3b82f6' },
      outbound: { name: 'Outbound (Xuất)', value: 0, color: '#10b981' },
      putaway: { name: 'Putaway (Cất kệ)', value: 0, color: '#8b5cf6' },
      inspection: { name: 'Inspection (KCS)', value: 0, color: '#f59e0b' },
    };

    filteredTasks
      .filter((t) => t.status === 'completed')
      .forEach((t) => {
        if (ops[t.operationType]) {
          ops[t.operationType].value += 1;
        }
      });

    return Object.values(ops).filter((o) => o.value > 0);
  }, [filteredTasks]);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs backdrop-blur-md">
          <div className="font-bold text-white text-sm mb-1">{data.name}</div>
          <div className="text-slate-400 mb-2 flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
              {data.role}
            </span>
            <span className="text-[10px] uppercase font-mono text-emerald-400">
              {data.shift.replace('_', ' ')}
            </span>
          </div>
          <div className="space-y-1 font-mono">
            <div className="text-emerald-400 flex items-center justify-between gap-4">
              <span>Đã hoàn thành:</span>
              <span className="font-bold">
                {metricType === 'tasks'
                  ? `${data.completedTasks} công việc`
                  : `${data.completedUnits.toLocaleString('vi-VN')} đơn vị`}
              </span>
            </div>
            <div className="text-cyan-400 flex items-center justify-between gap-4">
              <span>Đang thực hiện:</span>
              <span>
                {metricType === 'tasks'
                  ? `${data.inProgressTasks} công việc`
                  : `${data.inProgressUnits.toLocaleString('vi-VN')} đơn vị`}
              </span>
            </div>
            <div className="text-slate-400 pt-1 border-t border-slate-800 flex items-center justify-between gap-4">
              <span>Tổng số việc gán:</span>
              <span>{data.totalTasks} việc</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 text-white shadow-md shadow-blue-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Báo Cáo Năng Suất Nhân Viên Theo Thời Gian Thực
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Recharts
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Biểu đồ so sánh trực quan khối lượng công việc và sản lượng hoàn tất của từng nhân sự
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Metric Selector (Tasks vs Units) */}
          <div className="flex items-center p-1 bg-slate-800 border border-slate-700 rounded-xl">
            <button
              onClick={() => setMetricType('tasks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                metricType === 'tasks'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Số Việc Hoàn Thành
            </button>
            <button
              onClick={() => setMetricType('units')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                metricType === 'units'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Sản Lượng (Kiện/Pallet)
            </button>
          </div>

          {/* Shift Filter */}
          <select
            value={filterShift}
            onChange={(e) => setFilterShift(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">Tất cả các ca</option>
            <option value="ca_1">Ca 1 (06:00 - 14:00)</option>
            <option value="ca_2">Ca 2 (14:00 - 22:00)</option>
            <option value="ca_3">Ca 3 (22:00 - 06:00)</option>
            <option value="ca_hanh_chinh">Ca Hành chính</option>
          </select>

          {/* Operation Filter */}
          <select
            value={filterOperation}
            onChange={(e) => setFilterOperation(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">Tất cả vận hành</option>
            <option value="inbound">Inbound (Nhập)</option>
            <option value="outbound">Outbound (Xuất)</option>
            <option value="putaway">Putaway (Cất kệ)</option>
            <option value="inspection">Inspection (KCS)</option>
          </select>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks Done */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Tổng Việc Hoàn Thành</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{totalCompletedTasks}</span>
            <span className="text-xs text-emerald-400 font-medium">công việc</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Theo bộ lọc thời gian thực
          </div>
        </div>

        {/* Total Units Done */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Tổng Sản Lượng Nghiệm Thu</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">
              {totalCompletedUnits.toLocaleString('vi-VN')}
            </span>
            <span className="text-xs text-slate-400">kiện / pallet</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Hoàn tất trong ngày
          </div>
        </div>

        {/* Average per Worker */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Năng Suất Bình Quân / Người</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{avgCompletedPerEmp}</span>
            <span className="text-xs text-slate-400">việc / nhân viên</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Trên tổng số {employeeData.length} nhân sự
          </div>
        </div>

        {/* Top Performer */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Nhân Viên Dẫn Đầu</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 truncate">
            <span className="text-base font-bold text-amber-300">
              {topPerformer ? topPerformer.name : '--'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            {topPerformer
              ? `${topPerformer.completedTasks} việc (${topPerformer.completedUnits.toLocaleString('vi-VN')} đơn vị)`
              : 'Chưa có dữ liệu'}
          </div>
        </div>
      </div>

      {/* Main Bar Chart: Recharts Column Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              Biểu Đồ Cột So Sánh Năng Suất Từng Nhân Viên
            </h3>
            <p className="text-xs text-slate-400">
              {metricType === 'tasks'
                ? 'So sánh số lượng công việc đã hoàn thành vs đang thực hiện'
                : 'So sánh tổng sản lượng đơn vị (kiện/pallet/mẫu) đã hoàn thành'}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
              Đã hoàn thành
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-3 h-3 rounded bg-blue-500/50 inline-block" />
              Đang thực hiện
            </span>
          </div>
        </div>

        {/* Recharts Container */}
        <div className="h-80 w-full pt-2">
          {employeeData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              Không có dữ liệu nhân viên nào phù hợp bộ lọc.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={employeeData}
                margin={{ top: 10, right: 20, left: -10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis
                  dataKey="shortName"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: 10, fontSize: 12 }}
                  formatter={(value) => (
                    <span className="text-slate-300 text-xs">
                      {value === 'completedTasks' || value === 'completedUnits'
                        ? 'Đã hoàn thành'
                        : 'Đang thực hiện'}
                    </span>
                  )}
                />
                {metricType === 'tasks' ? (
                  <>
                    <Bar
                      dataKey="completedTasks"
                      name="completedTasks"
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                      barSize={28}
                    >
                      {employeeData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 0 ? '#10b981' : '#059669'}
                        />
                      ))}
                    </Bar>
                    <Bar
                      dataKey="inProgressTasks"
                      name="inProgressTasks"
                      fill="#3b82f6"
                      opacity={0.6}
                      radius={[6, 6, 0, 0]}
                      barSize={28}
                    />
                  </>
                ) : (
                  <>
                    <Bar
                      dataKey="completedUnits"
                      name="completedUnits"
                      fill="#3b82f6"
                      radius={[6, 6, 0, 0]}
                      barSize={28}
                    >
                      {employeeData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 0 ? '#3b82f6' : '#2563eb'}
                        />
                      ))}
                    </Bar>
                    <Bar
                      dataKey="inProgressUnits"
                      name="inProgressUnits"
                      fill="#06b6d4"
                      opacity={0.6}
                      radius={[6, 6, 0, 0]}
                      barSize={28}
                    />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Grid: Secondary Visuals (Pie Chart by Operation & Real-time Ranking Table) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart: Proportion by Operation */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-semibold text-sm text-white">Tỷ Trọng Theo Loại Vận Hành</h3>
            <p className="text-xs text-slate-400">Các công việc đã hoàn thành nghiệm thu</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            {operationBreakdown.length === 0 ? (
              <div className="text-xs text-slate-500">Chưa có công việc hoàn thành</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={operationBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    label={(entry) => `${entry.value} việc`}
                    labelLine={false}
                  >
                    {operationBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Operation Legend Chips */}
          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
              <span>Inbound (Nhập)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span>Outbound (Xuất)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
              <span>Putaway (Cất kệ)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <span>Inspection (KCS)</span>
            </div>
          </div>
        </div>

        {/* Detailed Table Ranking */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-semibold text-sm text-white">Bảng Xếp Hạng Chi Tiết Từng Nhân Viên</h3>
              <p className="text-xs text-slate-400">Dữ liệu được cập nhật tự động khi nhân viên hoàn thành việc</p>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              Thời gian thực
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Hạng</th>
                  <th className="py-2.5 px-3">Nhân Viên</th>
                  <th className="py-2.5 px-3">Chức Danh</th>
                  <th className="py-2.5 px-3 text-center">Việc Xong</th>
                  <th className="py-2.5 px-3 text-center">Đang Làm</th>
                  <th className="py-2.5 px-3 text-right">Tổng Sản Lượng</th>
                  <th className="py-2.5 px-3 text-right">Đánh Giá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {employeeData.map((emp, index) => {
                  let ratingBadge = (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Xuất Sắc
                    </span>
                  );
                  if (emp.completedTasks === 0) {
                    ratingBadge = (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400">
                        Đang Chờ Việc
                      </span>
                    );
                  } else if (emp.completedTasks < 3) {
                    ratingBadge = (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        Đạt Chuẩn
                      </span>
                    );
                  }

                  return (
                    <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono">
                        <span
                          className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[11px] font-bold ${
                            index === 0
                              ? 'bg-amber-500 text-slate-950'
                              : index === 1
                              ? 'bg-slate-300 text-slate-900'
                              : index === 2
                              ? 'bg-amber-700 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-white">
                        {emp.name}
                      </td>
                      <td className="py-3 px-3 text-slate-400">{emp.role}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-emerald-400">
                        {emp.completedTasks}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-cyan-300">
                        {emp.inProgressTasks}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-white">
                        {emp.completedUnits.toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3 px-3 text-right">{ratingBadge}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

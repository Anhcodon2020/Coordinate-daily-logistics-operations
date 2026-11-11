export type OperationType = 'inbound' | 'outbound' | 'putaway' | 'inspection';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'delayed';

export type ShiftType = 'ca_1' | 'ca_2' | 'ca_3' | 'ca_hanh_chinh';

export type EmployeeRole = 'forklift_driver' | 'tallyman' | 'warehouse_worker' | 'qc_inspector' | 'supervisor' | 'packer';

export type DockStatus = 'available' | 'docked_loading' | 'docked_unloading' | 'maintenance' | 'waiting_truck';

export interface Employee {
  id: string; // NV001, etc.
  name: string; // Tên nhân viên
  role: EmployeeRole; // Chức vụ / Vai trò: Lái xe nâng, Tallyman kiểm đếm, QC...
  shift: ShiftType; // Ca làm việc
  phone?: string; // Số điện thoại / Bộ đàm
  status: 'available' | 'busy' | 'on_break' | 'off_duty'; // Trạng thái làm việc
  assignedArea?: string; // Vị trí / Cửa đang phụ trách
  warehouseZone?: string; // Phân thuộc kho nào (Kho 1 - Hàng CFS, Kho 2, Kho 3...)
  completedTasksToday: number; // Số việc đã xong
  totalUnitsToday: number; // Tổng kiện/pallet đã xử lý hôm nay
}

export interface DockDoor {
  id: string; // C01, C02...
  doorNumber: string; // "Cửa Dock 01"
  type: 'inbound' | 'outbound' | 'hybrid'; // Loại cửa
  status: DockStatus; // Trạng thái cửa
  assignedTruck?: string; // Biển số xe / Số Cont
  carrierName?: string; // Đơn vị vận chuyển (e.g., GHN, Kerry, ViettelPost, Hapag-Lloyd)
  assignedEmployeeIds: string[]; // Nhân viên đang phụ trách cửa
  currentTaskId?: string; // Mã công việc đang chạy tại cửa
  eta?: string; // Giờ xe đến dự kiến
}

export interface DispatchTask {
  id: string; // CV-1001
  employeeId?: string; // ID nhân viên
  employeeName: string; // Tên nhân viên (cột bắt buộc)
  location: string; // Vị trí (cột bắt buộc: Cửa Dock, Kệ Rack, QC Zone, v.v.)
  startTime: string; // Thời gian bắt đầu (cột bắt buộc: HH:mm)
  endTime?: string; // Thời gian hoàn thành
  status: TaskStatus; // Trạng thái hoàn thành (cột bắt buộc)
  operationType: OperationType; // Loại vận hành (cột bắt buộc: Inbound, Outbound, Putway, Inspection)
  dockId?: string; // Liên kết số cửa (socua)
  targetQuantity: number; // SL kế hoạch (kiện / pallet / thùng)
  completedQuantity: number; // SL đã hoàn thành
  unit: string; // Kiện, Pallet, Thùng, Đơn
  priority: 'low' | 'normal' | 'high' | 'urgent';
  notes?: string; // Ghi chú hàng dễ vỡ, cont lạnh, v.v.
  shift: ShiftType; // Ca

  // WMS / 3PL Inbound & Dispatch specific fields
  warehouseZone?: string; // Phân kho: Kho A, Kho B, Kho Mát, Kho Tổng...
  accountCode?: string; // Mã Account: ACC-SAMSUNG, ACC-UNILEVER...
  customerName?: string; // Khách hàng nhập (Shipper / Client)
  containerOrTruckNo?: string; // Số cont xe: TCLU-921840-2 (Cont 40ft), 29C-882.14...
  cargoUnitType?: 'carton_to_cbm' | 'pallet_only' | 'carton_to_pallet_putaway'; // Quy cách vận hành
  cartonCount?: number; // Số carton
  cbmCount?: number; // Số CBM (thể tích m3) - chỉ dùng khi là carton
  palletCount?: number; // Số pallet (không cần số CBM)
  cartonsPerPallet?: number; // Quy cách san hàng: số thùng/pallet
  putawayPalletCount?: number; // Nếu san hàng: số carton san ra số pallet putaway

  completedDate?: string; // Ngày hoàn thành (YYYY-MM-DD) dùng để tra cứu lịch sử
  durationMinutes?: number; // Thời gian thực hiện (phút)
  updatedAt: string;
}

export const WAREHOUSE_ZONES = [
  'Kho 1 - Hàng CFS',
  'Kho 2 - Hàng kho Ngoại Quan (Bonded)',
  'Kho 3 - Kho hàng phân phối (DC)',
  
];

export interface CustomerAccount {
  id: string; // e.g. "ACC-01"
  code: string; // e.g. "ACC-SAMSUNG"
  customer: string; // Tên khách hàng / Shipper
  defaultZone: string; // Phân kho mặc định
  contactPerson?: string; // Người liên hệ
  contactPhone?: string; // SĐT liên hệ
  email?: string; // Email liên hệ
  notes?: string; // Ghi chú đặc thù (hàng dễ vỡ, cont lạnh...)
  createdAt?: string;
}

export const INITIAL_ACCOUNTS: CustomerAccount[] = [
  {
    id: 'ACC-01',
    code: 'ACC-SAMSUNG',
    customer: 'Samsung Electronics VN',
    defaultZone: 'Kho 1 - Hàng CFS',
    contactPerson: 'Nguyễn Văn Minh (Logistics Lead)',
    contactPhone: '0912-345-678',
    email: 'minh.nguyen@samsung-vn.com',
    notes: 'Linh kiện điện tử cao cấp, kiểm tra seal cont trước khi dỡ hàng',
  },
  {
    id: 'ACC-02',
    code: 'ACC-UNILEVER',
    customer: 'Unilever Việt Nam',
    defaultZone: 'Kho 3 - Kho hàng phân phối (DC)',
    contactPerson: 'Trần Thị Thu (Supply Chain)',
    contactPhone: '0988-765-432',
    email: 'thu.tran@unilever.com',
    notes: 'Hàng tiêu dùng nhanh FMCG, pallet chuẩn 1.2m',
  },
  {
    id: 'ACC-03',
    code: 'ACC-LOCKNLOCK',
    customer: 'Lock&Lock Living',
    defaultZone: 'Kho 2 - Hàng kho Ngoại Quan (Bonded)',
    contactPerson: 'Lê Hoàng Hải (Kho Vận)',
    contactPhone: '0903-888-999',
    email: 'hai.le@locknlock.vn',
    notes: 'Đồ gia dụng, san thùng ra pallet tiêu chuẩn cất tầng 3',
  },
  {
    id: 'ACC-04',
    code: 'ACC-AQUA',
    customer: 'Điện Máy Aqua VN',
    defaultZone: 'Kho 1 - Hàng CFS',
    contactPerson: 'Phạm Tuấn Anh (Điều Phối)',
    contactPhone: '0934-555-666',
    email: 'tuananh@aqua.com.vn',
    notes: 'Điện máy gia dụng nguyên cont, kẹp bốc cẩn thận',
  },
  {
    id: 'ACC-05',
    code: 'ACC-MEGAMARKET',
    customer: 'Mega Market Distribution',
    defaultZone: 'Kho 3 - Kho hàng phân phối (DC)',
    contactPerson: 'Đỗ Hồng Quân (Quản lý giao nhận)',
    contactPhone: '0977-111-222',
    email: 'quan.do@mmvietnam.com',
    notes: 'Thực phẩm mát bảo quản 18-25°C, xuất nhanh trước 11h',
  },
  {
    id: 'ACC-06',
    code: 'ACC-SHOPEE',
    customer: 'Shopee Express Hub',
    defaultZone: 'Kho 1 - Hàng CFS',
    contactPerson: 'Vũ Thị Hạnh (Ops Inbound)',
    contactPhone: '0966-333-444',
    email: 'hanh.vu@shopee.com',
    notes: 'Kiện hàng thương mại điện tử, phân loại theo mã vùng',
  },
];

export const COMMON_ACCOUNTS = INITIAL_ACCOUNTS;

export interface ProductivitySummary {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  delayedTasks: number;
  completionRate: number; // %
  totalUnitsProcessed: number;
  unitsPerHour: number;
  byOperation: {
    inbound: number;
    outbound: number;
    putaway: number;
    inspection: number;
  };
  topPerformers: {
    employeeName: string;
    completedUnits: number;
    completedTasks: number;
    ratePerHour: number;
  }[];
}

export interface ReminderAlert {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'info' | 'urgent' | 'success';
  timestamp: string;
  taskId?: string;
  dockId?: string;
  read: boolean;
}

export interface SharePointConfig {
  siteUrl: string; // e.g. https://yourcompany.sharepoint.com/sites/KhoVan
  siteId?: string; // Resolved Graph Site ID
  tenantId?: string;
  clientId?: string;
  accessToken?: string;
  connected: boolean;
  listsCreated: {
    congviec: boolean;
    nhanvien: boolean;
    socua: boolean;
  };
  listIds?: {
    congviec?: string;
    nhanvien?: string;
    socua?: string;
  };
  lastSyncedAt?: string;
  autoSync: boolean;
}

export interface GoogleSheetConfig {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  lastSyncedAt?: string;
  syncIntervalMinutes?: number;
  autoSync: boolean;
  sheetsConfigured: boolean;
}


import { DispatchTask, Employee, DockDoor } from '../types';

export const TASK_SHEET_NAME = 'congviec';
export const EMPLOYEE_SHEET_NAME = 'nhanvien';
export const DOCK_SHEET_NAME = 'socua';

export const TASK_HEADERS = [
  'Mã công việc',
  'Tên nhân viên',
  'Vị trí',
  'Thời gian bắt đầu',
  'Thời gian kết thúc',
  'Trạng thái hoàn thành',
  'Loại vận hành',
  'Số cửa',
  'Phân kho',
  'Mã Account',
  'Khách hàng nhập',
  'Số Cont Xe',
  'Quy cách hàng',
  'Số Carton',
  'Số CBM',
  'Số Pallet',
  'Pallet Putaway',
  'SL Kế hoạch',
  'SL Đã xong',
  'Đơn vị tính',
  'Độ ưu tiên',
  'Ghi chú',
  'Ca làm việc',
  'Ngày hoàn thành',
  'Thời lượng (phút)',
  'Cập nhật lúc'
];

export const EMPLOYEE_HEADERS = [
  'Mã nhân viên',
  'Tên nhân viên',
  'Chức danh',
  'Phân thuộc kho',
  'Ca làm việc',
  'Số điện thoại',
  'Trạng thái',
  'Vị trí phụ trách',
  'Số việc đã xong',
  'Tổng sản lượng'
];

export const DOCK_HEADERS = [
  'Mã cửa',
  'Tên số cửa',
  'Loại cửa',
  'Trạng thái cửa',
  'Biển số xe / Cont',
  'Hãng vận tải',
  'Nhân viên phụ trách',
  'Mã công việc hiện tại',
  'Giờ dự kiến (ETA)'
];

export const extractSpreadsheetId = (input: string): string => {
  const clean = input.trim();
  const match = clean.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return clean;
};

export const createWarehouseSpreadsheet = async (
  accessToken: string,
  title = `Điều Phối Lao Động Kho Vận - ${new Date().toLocaleDateString('vi-VN')}`
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> => {
  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: TASK_SHEET_NAME,
            gridProperties: { rowCount: 150, columnCount: 30, frozenRowCount: 1 },
          },
        },
        {
          properties: {
            title: EMPLOYEE_SHEET_NAME,
            gridProperties: { rowCount: 50, columnCount: 15, frozenRowCount: 1 },
          },
        },
        {
          properties: {
            title: DOCK_SHEET_NAME,
            gridProperties: { rowCount: 50, columnCount: 15, frozenRowCount: 1 },
          },
        },
      ],
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Lỗi tạo Google Sheet (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return { spreadsheetId, spreadsheetUrl };
};

export const writeAllDataToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  tasks: DispatchTask[],
  employees: Employee[],
  docks: DockDoor[]
): Promise<void> => {
  // Convert tasks to rows
  const taskRows = [
    TASK_HEADERS,
    ...tasks.map((t) => [
      t.id,
      t.employeeName || 'Chưa phân công',
      t.location,
      t.startTime,
      t.endTime || '',
      t.status,
      t.operationType,
      t.dockId || '',
      t.warehouseZone || '',
      t.accountCode || '',
      t.customerName || '',
      t.containerOrTruckNo || '',
      t.cargoUnitType || '',
      (t.cartonCount ?? '').toString(),
      (t.cbmCount ?? '').toString(),
      (t.palletCount ?? '').toString(),
      (t.putawayPalletCount ?? '').toString(),
      t.targetQuantity.toString(),
      t.completedQuantity.toString(),
      t.unit,
      t.priority,
      t.notes || '',
      t.shift,
      t.completedDate || '',
      (t.durationMinutes || '').toString(),
      t.updatedAt,
    ]),
  ];

  // Convert employees to rows
  const employeeRows = [
    EMPLOYEE_HEADERS,
    ...employees.map((e) => [
      e.id,
      e.name,
      e.role,
      e.warehouseZone || '',
      e.shift,
      e.phone || '',
      e.status,
      e.assignedArea || '',
      e.completedTasksToday.toString(),
      e.totalUnitsToday.toString(),
    ]),
  ];

  // Convert docks to rows
  const dockRows = [
    DOCK_HEADERS,
    ...docks.map((d) => [
      d.id,
      d.doorNumber,
      d.type,
      d.status,
      d.assignedTruck || '',
      d.carrierName || '',
      (d.assignedEmployeeIds || []).join(', '),
      d.currentTaskId || '',
      d.eta || '',
    ]),
  ];

  const valueRanges = [
    {
      range: `${TASK_SHEET_NAME}!A1:Z${taskRows.length}`,
      values: taskRows,
    },
    {
      range: `${EMPLOYEE_SHEET_NAME}!A1:I${employeeRows.length}`,
      values: employeeRows,
    },
    {
      range: `${DOCK_SHEET_NAME}!A1:I${dockRows.length}`,
      values: dockRows,
    },
  ];

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: valueRanges,
      }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Lỗi đồng bộ dữ liệu lên Google Sheets (${res.status}): ${errorText}`);
  }
};

export const fetchSheetData = async (
  accessToken: string,
  spreadsheetId: string
): Promise<{ tasks: DispatchTask[]; employees: Employee[]; docks: DockDoor[] } | null> => {
  // First, fetch spreadsheet metadata to check if required tabs exist
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!metaRes.ok) {
    const errText = await metaRes.text();
    throw new Error(`Không thể đọc metadata bảng tính (${metaRes.status}): ${errText}`);
  }

  const metaData = await metaRes.json();
  const existingSheetTitles: string[] = (metaData.sheets || []).map(
    (s: any) => s.properties?.title
  );

  // Read data from available tabs
  const rangesToFetch: string[] = [];
  const hasTaskSheet = existingSheetTitles.includes(TASK_SHEET_NAME);
  const hasEmpSheet = existingSheetTitles.includes(EMPLOYEE_SHEET_NAME);
  const hasDockSheet = existingSheetTitles.includes(DOCK_SHEET_NAME);

  if (hasTaskSheet) rangesToFetch.push(`${TASK_SHEET_NAME}!A1:Q150`);
  if (hasEmpSheet) rangesToFetch.push(`${EMPLOYEE_SHEET_NAME}!A1:I100`);
  if (hasDockSheet) rangesToFetch.push(`${DOCK_SHEET_NAME}!A1:I100`);

  if (rangesToFetch.length === 0) {
    return null;
  }

  const queryParams = rangesToFetch.map((r) => `ranges=${encodeURIComponent(r)}`).join('&');
  const valuesRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${queryParams}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!valuesRes.ok) {
    const err = await valuesRes.text();
    throw new Error(`Lỗi tải dữ liệu các tab (${valuesRes.status}): ${err}`);
  }

  const valuesData = await valuesRes.json();
  const valueRanges = valuesData.valueRanges || [];

  const parsedTasks: DispatchTask[] = [];
  const parsedEmployees: Employee[] = [];
  const parsedDocks: DockDoor[] = [];

  valueRanges.forEach((rangeObj: any) => {
    const rangeName = rangeObj.range || '';
    const rows: string[][] = rangeObj.values || [];
    if (rows.length <= 1) return; // Only header or empty

    const dataRows = rows.slice(1);

    if (rangeName.includes(TASK_SHEET_NAME)) {
      dataRows.forEach((row, idx) => {
        if (!row[0] && !row[1]) return;
        parsedTasks.push({
          id: row[0] || `CV-${1000 + idx}`,
          employeeName: row[1] || 'Chưa phân công',
          location: row[2] || 'Khu vực chung',
          startTime: row[3] || '08:00',
          endTime: row[4] || undefined,
          status: (row[5] as any) || 'pending',
          operationType: (row[6] as any) || 'inbound',
          dockId: row[7] || undefined,
          targetQuantity: parseInt(row[8] || '0', 10) || 100,
          completedQuantity: parseInt(row[9] || '0', 10) || 0,
          unit: row[10] || 'Kiện',
          priority: (row[11] as any) || 'normal',
          notes: row[12] || '',
          shift: (row[13] as any) || 'ca_1',
          completedDate: row[14] || undefined,
          durationMinutes: row[15] ? parseInt(row[15], 10) : undefined,
          updatedAt: row[16] || row[14] || new Date().toISOString(),
        });
      });
    } else if (rangeName.includes(EMPLOYEE_SHEET_NAME)) {
      dataRows.forEach((row, idx) => {
        if (!row[0] && !row[1]) return;
        parsedEmployees.push({
          id: row[0] || `NV-${100 + idx}`,
          name: row[1] || 'Nhân viên',
          role: (row[2] as any) || 'warehouse_worker',
          shift: (row[3] as any) || 'ca_1',
          phone: row[4] || '',
          status: (row[5] as any) || 'available',
          assignedArea: row[6] || '',
          completedTasksToday: parseInt(row[7] || '0', 10) || 0,
          totalUnitsToday: parseInt(row[8] || '0', 10) || 0,
        });
      });
    } else if (rangeName.includes(DOCK_SHEET_NAME)) {
      dataRows.forEach((row, idx) => {
        if (!row[0] && !row[1]) return;
        parsedDocks.push({
          id: row[0] || `C0${idx + 1}`,
          doorNumber: row[1] || `Cửa Dock ${idx + 1}`,
          type: (row[2] as any) || 'inbound',
          status: (row[3] as any) || 'available',
          assignedTruck: row[4] || undefined,
          carrierName: row[5] || undefined,
          assignedEmployeeIds: row[6] ? row[6].split(',').map((s) => s.trim()) : [],
          currentTaskId: row[7] || undefined,
          eta: row[8] || undefined,
        });
      });
    }
  });

  return {
    tasks: parsedTasks,
    employees: parsedEmployees,
    docks: parsedDocks,
  };
};

export const updateSingleTaskStatusInSheet = async (
  accessToken: string,
  spreadsheetId: string,
  taskId: string,
  status: string,
  completedQty?: number
): Promise<boolean> => {
  // Read task IDs to find row index
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${TASK_SHEET_NAME}!A:F`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok) return false;

  const data = await res.json();
  const rows: string[][] = data.values || [];
  const rowIndex = rows.findIndex((r) => r[0] === taskId);

  if (rowIndex === -1) return false;

  const rowNum = rowIndex + 1;
  // Column F is index 5 (status)
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${TASK_SHEET_NAME}!F${rowNum}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [[status]],
      }),
    }
  );

  if (completedQty !== undefined) {
    // Column J is index 9 (completed qty)
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${TASK_SHEET_NAME}!J${rowNum}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [[completedQty.toString()]],
        }),
      }
    );
  }

  return true;
};

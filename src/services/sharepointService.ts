import { DispatchTask, Employee, DockDoor, SharePointConfig } from '../types';

export const SHAREPOINT_LIST_NAMES = {
  TASKS: 'congviec',
  EMPLOYEES: 'nhanvien',
  DOCKS: 'socua',
};

export const parseSharePointUrl = (url: string): { host: string; sitePath: string } | null => {
  try {
    const cleanUrl = url.trim().replace(/\/$/, '');
    const parsed = new URL(cleanUrl);
    const host = parsed.hostname; // e.g. "tenant.sharepoint.com"
    const sitePath = parsed.pathname; // e.g. "/sites/KhoVan"
    return { host, sitePath };
  } catch {
    return null;
  }
};

/**
 * Resolves a SharePoint Site ID via Microsoft Graph API
 */
export const resolveSharePointSiteId = async (
  token: string,
  host: string,
  sitePath: string
): Promise<{ id: string; displayName: string; webUrl: string }> => {
  const endpoint = `https://graph.microsoft.com/v1.0/sites/${host}:${sitePath}`;
  const res = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Không thể tìm thấy Site SharePoint (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return {
    id: data.id, // Format: "hostname,sited-guid,web-guid"
    displayName: data.displayName || 'SharePoint Site',
    webUrl: data.webUrl,
  };
};

/**
 * Automatically creates the 3 required SharePoint Lists with full schema columns
 */
export const createAllSharePointLists = async (
  token: string,
  siteId: string
): Promise<{ congviecId: string; nhanvienId: string; socuaId: string }> => {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // 1. Definition for congviec
  const taskColumns = [
    { name: 'TaskID', text: {} },
    { name: 'EmployeeName', text: {} },
    { name: 'Location', text: {} },
    { name: 'StartTime', text: {} },
    { name: 'EndTime', text: {} },
    {
      name: 'Status',
      choice: { choices: ['pending', 'in_progress', 'completed', 'delayed'] },
    },
    {
      name: 'OperationType',
      choice: { choices: ['inbound', 'outbound', 'putaway', 'inspection'] },
    },
    { name: 'DockID', text: {} },
    { name: 'TargetQuantity', number: {} },
    { name: 'CompletedQuantity', number: {} },
    { name: 'Unit', text: {} },
    {
      name: 'Priority',
      choice: { choices: ['low', 'normal', 'high', 'urgent'] },
    },
    { name: 'Notes', text: {} },
    { name: 'Shift', text: {} },
    { name: 'CompletedDate', text: {} },
    { name: 'DurationMinutes', number: {} },
  ];

  // 2. Definition for nhanvien
  const empColumns = [
    { name: 'EmployeeID', text: {} },
    { name: 'FullName', text: {} },
    { name: 'Role', text: {} },
    { name: 'Shift', text: {} },
    { name: 'Phone', text: {} },
    {
      name: 'Status',
      choice: { choices: ['available', 'busy', 'on_break', 'off_duty'] },
    },
    { name: 'AssignedArea', text: {} },
    { name: 'WarehouseZone', text: {} },
    { name: 'CompletedTasksToday', number: {} },
    { name: 'TotalUnitsToday', number: {} },
  ];

  // 3. Definition for socua
  const dockColumns = [
    { name: 'DoorID', text: {} },
    { name: 'DoorNumber', text: {} },
    {
      name: 'Type',
      choice: { choices: ['inbound', 'outbound', 'hybrid'] },
    },
    {
      name: 'Status',
      choice: { choices: ['available', 'docked_unloading', 'docked_loading', 'waiting_truck', 'maintenance'] },
    },
    { name: 'AssignedTruck', text: {} },
    { name: 'CarrierName', text: {} },
    { name: 'AssignedPersonnel', text: {} },
    { name: 'CurrentTaskId', text: {} },
    { name: 'ETA', text: {} },
  ];

  // Helper to create base list, then add columns sequentially
  const createListWithColumns = async (displayName: string, description: string, columns: any[]) => {
    // Check if list already exists
    const checkRes = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${displayName}`,
      { headers }
    );

    let listId = '';
    if (checkRes.ok) {
      const existing = await checkRes.json();
      listId = existing.id;
    } else {
      // Create list without columns first
      const createRes = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          displayName,
          description,
          list: { template: 'genericList' },
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.text();
        throw new Error(`Lỗi tạo bảng ${displayName} (${createRes.status}): ${err}`);
      }

      const created = await createRes.json();
      listId = created.id;
    }

    // Add columns one by one
    for (const col of columns) {
      try {
        await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/columns`, {
          method: 'POST',
          headers,
          body: JSON.stringify(col),
        });
      } catch (e) {
        // Ignore if column already exists
      }
    }

    return listId;
  };

  const congviecId = await createListWithColumns(
    SHAREPOINT_LIST_NAMES.TASKS,
    'Bảng điều phối công việc hàng ngày kho vận',
    taskColumns
  );
  const nhanvienId = await createListWithColumns(
    SHAREPOINT_LIST_NAMES.EMPLOYEES,
    'Bảng danh sách nhân sự kho vận',
    empColumns
  );
  const socuaId = await createListWithColumns(
    SHAREPOINT_LIST_NAMES.DOCKS,
    'Bảng quản lý số cửa dock bốc dỡ hàng',
    dockColumns
  );

  return { congviecId, nhanvienId, socuaId };
};

/**
 * Generates and triggers download of CSV template for SharePoint's "New List -> From CSV"
 */
export const downloadSharePointCSVTemplate = (
  type: 'congviec' | 'nhanvien' | 'socua',
  tasks: DispatchTask[] = [],
  employees: Employee[] = [],
  docks: DockDoor[] = []
) => {
  let headers: string[] = [];
  let rows: (string | number)[][] = [];
  let fileName = '';

  if (type === 'congviec') {
    fileName = 'SharePoint_Template_congviec.csv';
    headers = [
      'TaskID',
      'EmployeeName',
      'Location',
      'StartTime',
      'EndTime',
      'Status',
      'OperationType',
      'DockID',
      'WarehouseZone',
      'AccountCode',
      'CustomerName',
      'ContainerOrTruckNo',
      'CargoUnitType',
      'CartonCount',
      'CBMCount',
      'PalletCount',
      'PutawayPalletCount',
      'TargetQuantity',
      'CompletedQuantity',
      'Unit',
      'Priority',
      'Notes',
      'Shift',
      'CompletedDate',
      'DurationMinutes',
    ];

    rows = tasks.map((t) => [
      t.id,
      `"${t.employeeName.replace(/"/g, '""')}"`,
      `"${t.location.replace(/"/g, '""')}"`,
      t.startTime,
      t.endTime || '',
      t.status,
      t.operationType,
      t.dockId || '',
      `"${(t.warehouseZone || '').replace(/"/g, '""')}"`,
      t.accountCode || '',
      `"${(t.customerName || '').replace(/"/g, '""')}"`,
      `"${(t.containerOrTruckNo || '').replace(/"/g, '""')}"`,
      t.cargoUnitType || '',
      t.cartonCount ?? '',
      t.cbmCount ?? '',
      t.palletCount ?? '',
      t.putawayPalletCount ?? '',
      t.targetQuantity,
      t.completedQuantity,
      t.unit,
      t.priority,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
      t.shift,
      t.completedDate || '',
      t.durationMinutes || 60,
    ]);
  } else if (type === 'nhanvien') {
    fileName = 'SharePoint_Template_nhanvien.csv';
    headers = [
      'EmployeeID',
      'FullName',
      'Role',
      'WarehouseZone',
      'Shift',
      'Phone',
      'Status',
      'AssignedArea',
      'CompletedTasksToday',
      'TotalUnitsToday',
    ];

    rows = employees.map((e) => [
      e.id,
      `"${e.name.replace(/"/g, '""')}"`,
      e.role,
      `"${(e.warehouseZone || '').replace(/"/g, '""')}"`,
      e.shift,
      e.phone || '',
      e.status,
      `"${(e.assignedArea || '').replace(/"/g, '""')}"`,
      e.completedTasksToday,
      e.totalUnitsToday,
    ]);
  } else {
    fileName = 'SharePoint_Template_socua.csv';
    headers = [
      'DoorID',
      'DoorNumber',
      'Type',
      'Status',
      'AssignedTruck',
      'CarrierName',
      'AssignedPersonnel',
      'CurrentTaskId',
      'ETA',
    ];

    rows = docks.map((d) => [
      d.id,
      `"${d.doorNumber.replace(/"/g, '""')}"`,
      d.type,
      d.status,
      `"${(d.assignedTruck || '').replace(/"/g, '""')}"`,
      `"${(d.carrierName || '').replace(/"/g, '""')}"`,
      `"${(d.assignedEmployeeIds || []).join(', ')}"`,
      d.currentTaskId || '',
      d.eta || '',
    ]);
  }

  const csvContent =
    '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Pushes items into the created SharePoint lists
 */
export const pushDataToSharePointLists = async (
  token: string,
  siteId: string,
  listIds: { congviecId: string; nhanvienId: string; socuaId: string },
  tasks: DispatchTask[],
  employees: Employee[],
  docks: DockDoor[]
): Promise<void> => {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Push tasks
  for (const t of tasks) {
    await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listIds.congviecId}/items`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        fields: {
          Title: t.id,
          TaskID: t.id,
          EmployeeName: t.employeeName,
          Location: t.location,
          StartTime: t.startTime,
          EndTime: t.endTime || '',
          Status: t.status,
          OperationType: t.operationType,
          DockID: t.dockId || '',
          TargetQuantity: t.targetQuantity,
          CompletedQuantity: t.completedQuantity,
          Unit: t.unit,
          Priority: t.priority,
          Notes: t.notes || '',
          Shift: t.shift,
          CompletedDate: t.completedDate || '',
          DurationMinutes: t.durationMinutes || 60,
        },
      }),
    });
  }

  // Push employees
  for (const e of employees) {
    await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listIds.nhanvienId}/items`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        fields: {
          Title: e.name,
          EmployeeID: e.id,
          FullName: e.name,
          Role: e.role,
          WarehouseZone: e.warehouseZone || '',
          Shift: e.shift,
          Phone: e.phone || '',
          Status: e.status,
          AssignedArea: e.assignedArea || '',
          CompletedTasksToday: e.completedTasksToday,
          TotalUnitsToday: e.totalUnitsToday,
        },
      }),
    });
  }

  // Push docks
  for (const d of docks) {
    await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listIds.socuaId}/items`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        fields: {
          Title: d.doorNumber,
          DoorID: d.id,
          DoorNumber: d.doorNumber,
          Type: d.type,
          Status: d.status,
          AssignedTruck: d.assignedTruck || '',
          CarrierName: d.carrierName || '',
          AssignedPersonnel: (d.assignedEmployeeIds || []).join(', '),
          CurrentTaskId: d.currentTaskId || '',
          ETA: d.eta || '',
        },
      }),
    });
  }
};

/**
 * Reads all data from SharePoint Lists
 */
export const fetchSharePointListData = async (
  token: string,
  siteId: string,
  listIds: { congviecId: string; nhanvienId: string; socuaId: string }
): Promise<{ tasks: DispatchTask[]; employees: Employee[]; docks: DockDoor[] }> => {
  const headers = { Authorization: `Bearer ${token}` };

  const [tasksRes, empsRes, docksRes] = await Promise.all([
    fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listIds.congviecId}/items?expand=fields`, { headers }),
    fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listIds.nhanvienId}/items?expand=fields`, { headers }),
    fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listIds.socuaId}/items?expand=fields`, { headers }),
  ]);

  const tasksData = tasksRes.ok ? await tasksRes.json() : { value: [] };
  const empsData = empsRes.ok ? await empsRes.json() : { value: [] };
  const docksData = docksRes.ok ? await docksRes.json() : { value: [] };

  const parsedTasks: DispatchTask[] = (tasksData.value || []).map((item: any) => {
    const f = item.fields || {};
    return {
      id: f.TaskID || f.Title || `CV-${item.id}`,
      employeeName: f.EmployeeName || 'Chưa phân công',
      location: f.Location || 'Khu chung',
      startTime: f.StartTime || '08:00',
      endTime: f.EndTime || undefined,
      status: f.Status || 'pending',
      operationType: f.OperationType || 'inbound',
      dockId: f.DockID || undefined,
      targetQuantity: Number(f.TargetQuantity) || 100,
      completedQuantity: Number(f.CompletedQuantity) || 0,
      unit: f.Unit || 'Kiện',
      priority: f.Priority || 'normal',
      notes: f.Notes || '',
      shift: f.Shift || 'ca_1',
      completedDate: f.CompletedDate || undefined,
      durationMinutes: f.DurationMinutes ? Number(f.DurationMinutes) : undefined,
      updatedAt: item.lastModifiedDateTime || new Date().toISOString(),
    };
  });

  const parsedEmployees: Employee[] = (empsData.value || []).map((item: any) => {
    const f = item.fields || {};
    return {
      id: f.EmployeeID || `NV-${item.id}`,
      name: f.FullName || f.Title || 'Nhân viên',
      role: f.Role || 'warehouse_worker',
      warehouseZone: f.WarehouseZone || undefined,
      shift: f.Shift || 'ca_1',
      phone: f.Phone || '',
      status: f.Status || 'available',
      assignedArea: f.AssignedArea || '',
      completedTasksToday: Number(f.CompletedTasksToday) || 0,
      totalUnitsToday: Number(f.TotalUnitsToday) || 0,
    };
  });

  const parsedDocks: DockDoor[] = (docksData.value || []).map((item: any) => {
    const f = item.fields || {};
    return {
      id: f.DoorID || `C0${item.id}`,
      doorNumber: f.DoorNumber || f.Title || 'Cửa Dock',
      type: f.Type || 'inbound',
      status: f.Status || 'available',
      assignedTruck: f.AssignedTruck || undefined,
      carrierName: f.CarrierName || undefined,
      assignedEmployeeIds: f.AssignedPersonnel ? f.AssignedPersonnel.split(',').map((s: string) => s.trim()) : [],
      currentTaskId: f.CurrentTaskId || undefined,
      eta: f.ETA || undefined,
    };
  });

  return {
    tasks: parsedTasks,
    employees: parsedEmployees,
    docks: parsedDocks,
  };
};

/**
 * Generates an automated PowerShell script (using PnP.PowerShell)
 * so that an IT Administrator can create the 3 SharePoint Lists with a single command
 */
export const generatePnPPowerShellScript = (siteUrl: string): string => {
  return `# ==============================================================
# SCRIPT TỰ ĐỘNG TẠO 3 BẢNG SHAREPOINT LISTS CHO HỆ THỐNG ĐIỀU PHỐI KHO
# Chạy trên Windows PowerShell với module PnP.PowerShell
# ==============================================================

# 1. Kết nối tới SharePoint Site của bạn
$SiteUrl = "${siteUrl || 'https://yourcompany.sharepoint.com/sites/KhoVan'}"
Connect-PnPOnline -Url $SiteUrl -Interactive

Write-Host ">>> Đang kết nối tới: $SiteUrl..." -ForegroundColor Cyan

# 2. Tạo List: congviec (Danh sách công việc điều phối)
Write-Host ">>> Đang tạo bảng: congviec..." -ForegroundColor Green
$taskListName = "congviec"
if (-not (Get-PnPList -Identity $taskListName -ErrorAction SilentlyContinue)) {
    New-PnPList -Title $taskListName -Template GenericList -EnableVersioning
    Add-PnPField -List $taskListName -DisplayName "TaskID" -InternalName "TaskID" -Type Text -AddToDefaultView
    Add-PnPField -List $taskListName -DisplayName "EmployeeName" -InternalName "EmployeeName" -Type Text -AddToDefaultView
    Add-PnPField -List $taskListName -DisplayName "Location" -InternalName "Location" -Type Text -AddToDefaultView
    Add-PnPField -List $taskListName -DisplayName "StartTime" -InternalName "StartTime" -Type Text -AddToDefaultView
    Add-PnPField -List $taskListName -DisplayName "EndTime" -InternalName "EndTime" -Type Text -AddToDefaultView
    Add-PnPField -List $taskListName -DisplayName "Status" -InternalName "Status" -Type Choice -Choices "pending","in_progress","completed","delayed" -AddToDefaultView
    Add-PnPField -List $taskListName -DisplayName "OperationType" -InternalName "OperationType" -Type Choice -Choices "inbound","outbound","putaway","inspection" -AddToDefaultView
    Add-PnPField -List $taskListName -DisplayName "DockID" -InternalName "DockID" -Type Text -AddToDefaultView
    Add-PnPField -List $taskListName -DisplayName "TargetQuantity" -InternalName "TargetQuantity" -Type Number -AddToDefaultView
    Add-PnPField -List $taskListName -DisplayName "CompletedQuantity" -InternalName "CompletedQuantity" -Type Number -AddToDefaultView
    Add-PnPField -List $taskListName -DisplayName "Unit" -InternalName "Unit" -Type Text -AddToDefaultView
    Add-PnPField -List $taskListName -DisplayName "Priority" -InternalName "Priority" -Type Choice -Choices "low","normal","high","urgent" -AddToDefaultView
    Add-PnPField -List $taskListName -DisplayName "Notes" -InternalName "Notes" -Type Note -AddToDefaultView
    Add-PnPField -List $taskListName -DisplayName "Shift" -InternalName "Shift" -Type Text -AddToDefaultView
    Add-PnPField -List $taskListName -DisplayName "CompletedDate" -InternalName "CompletedDate" -Type Text -AddToDefaultView
    Add-PnPField -List $taskListName -DisplayName "DurationMinutes" -InternalName "DurationMinutes" -Type Number -AddToDefaultView
}

# 3. Tạo List: nhanvien (Hồ sơ nhân sự)
Write-Host ">>> Đang tạo bảng: nhanvien..." -ForegroundColor Green
$empListName = "nhanvien"
if (-not (Get-PnPList -Identity $empListName -ErrorAction SilentlyContinue)) {
    New-PnPList -Title $empListName -Template GenericList -EnableVersioning
    Add-PnPField -List $empListName -DisplayName "EmployeeID" -InternalName "EmployeeID" -Type Text -AddToDefaultView
    Add-PnPField -List $empListName -DisplayName "FullName" -InternalName "FullName" -Type Text -AddToDefaultView
    Add-PnPField -List $empListName -DisplayName "Role" -InternalName "Role" -Type Text -AddToDefaultView
    Add-PnPField -List $empListName -DisplayName "Shift" -InternalName "Shift" -Type Text -AddToDefaultView
    Add-PnPField -List $empListName -DisplayName "Phone" -InternalName "Phone" -Type Text -AddToDefaultView
    Add-PnPField -List $empListName -DisplayName "Status" -InternalName "Status" -Type Choice -Choices "available","busy","on_break","off_duty" -AddToDefaultView
    Add-PnPField -List $empListName -DisplayName "AssignedArea" -InternalName "AssignedArea" -Type Text -AddToDefaultView
    Add-PnPField -List $empListName -DisplayName "CompletedTasksToday" -InternalName "CompletedTasksToday" -Type Number -AddToDefaultView
    Add-PnPField -List $empListName -DisplayName "TotalUnitsToday" -InternalName "TotalUnitsToday" -Type Number -AddToDefaultView
}

# 4. Tạo List: socua (Quản lý cửa dock)
Write-Host ">>> Đang tạo bảng: socua..." -ForegroundColor Green
$dockListName = "socua"
if (-not (Get-PnPList -Identity $dockListName -ErrorAction SilentlyContinue)) {
    New-PnPList -Title $dockListName -Template GenericList -EnableVersioning
    Add-PnPField -List $dockListName -DisplayName "DoorID" -InternalName "DoorID" -Type Text -AddToDefaultView
    Add-PnPField -List $dockListName -DisplayName "DoorNumber" -InternalName "DoorNumber" -Type Text -AddToDefaultView
    Add-PnPField -List $dockListName -DisplayName "Type" -InternalName "Type" -Type Choice -Choices "inbound","outbound","hybrid" -AddToDefaultView
    Add-PnPField -List $dockListName -DisplayName "Status" -InternalName "Status" -Type Choice -Choices "available","docked_unloading","docked_loading","waiting_truck","maintenance" -AddToDefaultView
    Add-PnPField -List $dockListName -DisplayName "AssignedTruck" -InternalName "AssignedTruck" -Type Text -AddToDefaultView
    Add-PnPField -List $dockListName -DisplayName "CarrierName" -InternalName "CarrierName" -Type Text -AddToDefaultView
    Add-PnPField -List $dockListName -DisplayName "AssignedPersonnel" -InternalName "AssignedPersonnel" -Type Text -AddToDefaultView
    Add-PnPField -List $dockListName -DisplayName "CurrentTaskId" -InternalName "CurrentTaskId" -Type Text -AddToDefaultView
    Add-PnPField -List $dockListName -DisplayName "ETA" -InternalName "ETA" -Type Text -AddToDefaultView
}

Write-Host ">>> HOÀN TẤT! Đã tạo xong 3 Lists trên SharePoint: congviec, nhanvien, socua!" -ForegroundColor Yellow
`;
};

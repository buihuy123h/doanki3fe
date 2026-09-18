// Base URL của backend ASP.NET Core (profile "http" trong launchSettings.json).
// Ghi đè bằng biến môi trường VITE_API_URL khi deploy (VD: VITE_API_URL=https://api.example.com).
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5105';

export interface LoginApiResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    accountType: 'Employee' | 'Customer';
  };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Gọi POST /api/auth/login trên backend, trả về token + thông tin user. */
export async function loginRequest(email: string, password: string): Promise<LoginApiResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new ApiError('network');
  }

  let body: { token?: string; user?: LoginApiResponse['user']; error?: string } | null = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok || !body?.token || !body.user) {
    throw new ApiError(body?.error ?? `http_${response.status}`, response.status);
  }

  return body as LoginApiResponse;
}

// ==================== EMPLOYEE APIS ====================

export async function updateEmployeeApi(id: string, data: {
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  department: string;
  storeId?: string;
  retailShopAssigned?: string;
  status: string;
  dateOfJoining?: string;
  password?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/api/admin/employee/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Lỗi cập nhật nhân viên (HTTP ${res.status})`);
  }
  return await res.json();
}

export async function createEmployeeApi(data: {
  employeeCode?: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  department: string;
  storeId?: string;
  retailShopAssigned?: string;
  status: string;
  dateOfJoining?: string;
  password?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/api/admin/employee`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Lỗi thêm mới nhân viên (HTTP ${res.status})`);
  }
  return await res.json();
}

// ==================== INVENTORY / STOCK APIS ====================

export async function updateInventoryItemApi(id: string, data: {
  itemCode?: string;
  name: string;
  category: string;
  stockQuantity: number;
  reorderLevel: number;
  unitCost: number;
  location?: string;
  vendorId?: string;
  supplier?: string;
  status?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/api/admin/inventory/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Lỗi cập nhật vật tư kho (HTTP ${res.status})`);
  }
  return await res.json();
}

export async function restockInventoryItemApi(id: string, quantity: number, note?: string) {
  const res = await fetch(`${API_BASE_URL}/api/admin/inventory/${encodeURIComponent(id)}/restock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity, note }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Lỗi nhập thêm hàng vào kho (HTTP ${res.status})`);
  }
  return await res.json();
}

export async function createInventoryItemApi(data: {
  itemCode?: string;
  name: string;
  category: string;
  stockQuantity: number;
  reorderLevel: number;
  unitCost: number;
  location?: string;
  vendorId?: string;
  supplier?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/api/admin/inventory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Lỗi tạo vật tư kho (HTTP ${res.status})`);
  }
  return await res.json();
}

// ==================== EQUIPMENT APIS ====================

export async function createEquipmentApi(data: {
  equipmentId?: string;
  serialNumber?: string;
  macAddress?: string;
  deviceModel: string;
  deviceType: string;
  vendorId?: string;
  storeId?: string;
  status?: string;
  firmwareVersion?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/api/Technical/equipment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      equipmentId: data.equipmentId || `EQ-${Date.now().toString().slice(-8)}`,
      serialNumber: data.serialNumber,
      macAddress: data.macAddress,
      deviceModel: data.deviceModel,
      deviceType: data.deviceType,
      vendorId: data.vendorId || 'vnd-02',
      storeId: data.storeId,
      status: data.status || 'In Stock',
      firmwareVersion: data.firmwareVersion || 'v1.0.0',
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Lỗi đăng ký thiết bị vào CSDL (HTTP ${res.status})`);
  }
  return await res.json();
}

// ==================== CONNECTIONS APIS ====================

export async function fetchConnectionsApi() {
  const res = await fetch(`${API_BASE_URL}/api/Technical/connections`);
  if (!res.ok) {
    throw new Error(`Lỗi tải danh sách kết nối (HTTP ${res.status})`);
  }
  return await res.json();
}

export async function createOrUpdateConnectionApi(data: {
  accountId: string;
  orderId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  installationAddress?: string;
  connectionType?: string;
  planName?: string;
  monthlyRental?: number;
  securityDeposit?: number;
  status?: string;
  ipAddress?: string;
  portNumber?: string;
  equipmentId?: string;
  assignedDeviceSerial?: string;
  assignedDeviceModel?: string;
  installedDate?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/api/Technical/connections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Lỗi lưu kết nối vào CSDL (HTTP ${res.status})`);
  }
  return await res.json();
}

// ==================== BILLING & INVOICE APIS ====================

export async function fetchBillsApi() {
  const res = await fetch(`${API_BASE_URL}/api/billing/bills`);
  if (!res.ok) {
    throw new Error(`Lỗi tải danh sách hóa đơn (HTTP ${res.status})`);
  }
  return await res.json();
}

export async function createBillApi(data: {
  accountId: string;
  billingMonth: string;
  securityDeposit: number;
  monthlyRental: number;
  hourlyCharges?: number;
  discountPercent?: number;
  discountAmount?: number;
  subtotal?: number;
  serviceTaxRate?: number;
  serviceTaxAmount?: number;
  totalAmount?: number;
  invoiceNumber?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/api/billing/bills`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Lỗi phát hành hóa đơn vào CSDL (HTTP ${res.status})`);
  }
  return await res.json();
}

export async function recordPaymentApi(data: {
  invoiceNumber?: string;
  billId?: string;
  amountPaid: number;
  paymentMode: string;
  referenceNumber?: string;
  recordedBy?: string;
  notes?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/api/billing/bills/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Lỗi ghi nhận thanh toán vào CSDL (HTTP ${res.status})`);
  }
  return await res.json();
}


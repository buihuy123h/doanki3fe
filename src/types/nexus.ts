// Nexus Service Marketing System - Core Type Definitions

export type RoleType = 'admin' | 'retail' | 'technical' | 'accounts' | 'user';

export type ConnectionType = 'Broadband' | 'Dial-Up' | 'Landline';

export type OrderStatus = 'Pending' | 'Feasible' | 'Not Feasible' | 'Connection Provided';

export type ConnectionStatus = 'Active' | 'Temporarily Inactive' | 'Permanently Inactive';

export type BillStatus = 'Paid' | 'Partially Paid' | 'Unpaid';

export type EquipmentStatus = 'In Service' | 'In Stock' | 'Maintenance' | 'Faulty';

// 1. Service Plans
export interface Plan {
  id: string;
  name: string;
  type: ConnectionType;
  speedOrBandwidth: string; // e.g., "100 Mbps", "56 Kbps V.92", "Unlimited Local"
  monthlyRental: number; // e.g., 49.99
  hourlyCharge?: number; // for dial-up or metered
  securityDeposit: number; // e.g., 50.00
  dataLimit?: string; // e.g., "Unlimited" or "100 GB"
  status: 'Active' | 'Archived';
  description: string;
}

// 2. Employees (Admin Management)
export interface Employee {
  id: string;
  employeeCode: string; // e.g., "EMP-1001"
  name: string;
  email: string;
  phone: string;
  role: 'Manager' | 'Retail Staff' | 'Field Engineer' | 'Senior Accountant' | 'Support Agent';
  department: 'Administration' | 'Retail Outlets' | 'Technical Operations' | 'Finance & Accounts';
  retailShopAssigned?: string; // e.g., "Downtown Flagship (SH-01)"
  status: 'Active' | 'Inactive';
  dateOfJoining: string;
}

// 3. Vendors (Admin Management)
export interface Vendor {
  id: string;
  vendorCode: string; // e.g., "VND-401"
  companyName: string;
  contactPerson: string;
  category: 'Fiber Optics & Cabling' | 'Modems & Routers' | 'Telecom Switches' | 'Field Tooling';
  phone: string;
  email: string;
  address: string;
  rating: number; // 1-5
  status: 'Active' | 'Pending Review' | 'Terminated';
}

// 4. Retail Shops / Outlets (Admin Management)
export interface RetailShop {
  id: string;
  shopCode: string; // e.g., "SH-01"
  name: string;
  city: string;
  address: string;
  managerName: string;
  phone: string;
  operatingHours: string;
  activeEmployeesCount: number;
  totalSubscribersServed: number;
}

// 5. Stock / Inventory (Admin & Technical)
export interface InventoryItem {
  id: string;
  itemCode: string; // e.g., "EQ-FBR-01"
  name: string;
  category: 'Modem' | 'Router' | 'Fiber ONT' | 'Splitter' | 'Patch Cord' | 'VoIP Adapter';
  stockQuantity: number;
  reorderLevel: number;
  unitCost: number;
  location: string;
  supplier: string;
}

// 6. Orders (Retail & Technical Feasibility)
export interface Order {
  id: string; // 11-digit alphanumeric (e.g., "D0000000001", "B0000000002", "L0000000003")
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  installationAddress: string;
  idProofType: 'National ID Card' | 'Passport' | "Driver's License";
  idProofNumber: string;
  connectionType: ConnectionType;
  planId: string;
  planName: string;
  retailOutletCode: string;
  retailEmployeeName: string;
  createdAt: string;
  status: OrderStatus;
  feasibilityNotes?: string;
  cableDistanceMeters?: number;
  dpBoxCapacity?: string;
  signalLossDbm?: number;
  assignedAccountId?: string; // 16-digit Account ID generated on connection provided
}

// 7. Customer Connections (Technical & Retail)
export interface Connection {
  accountId: string; // 16-digit formatted: "XXXX-XXXX-XXXX-XXXX"
  orderId: string; // 11-digit order
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  installationAddress: string;
  connectionType: ConnectionType;
  planName: string;
  monthlyRental: number;
  securityDeposit: number;
  status: ConnectionStatus;
  ipAddress?: string;
  portNumber?: string;
  assignedDeviceSerial?: string;
  assignedDeviceModel?: string;
  installedDate: string;
  lastUpdated: string;
  lastStatusReason?: string;
}

// 8. Equipment / Product Details (Technical Staff)
export interface Equipment {
  id: string;
  serialNumber: string; // e.g., "NX-HW-992810"
  macAddress: string; // e.g., "BC:A9:93:21:44:8E"
  deviceModel: string; // e.g., "Nexus GigaFiber Dual-Band WiFi-6 ONT"
  deviceType: 'Fiber ONT Modem' | 'VDSL2/ADSL Modem' | 'Gigabit Router' | 'Analog Telephone Adapter';
  assignedAccountId?: string; // 16-digit Account ID if deployed
  assignedCustomerName?: string;
  firmwareVersion: string;
  status: EquipmentStatus;
  assignedTechnician?: string;
  installedDate?: string;
}

// 9. Billing & Invoices (Accounts Department)
export interface BillLineItem {
  description: string;
  amount: number;
}

export interface PaymentRecord {
  paymentId: string;
  paymentDate: string;
  amountPaid: number;
  paymentMode: 'Cash' | 'Cheque' | 'Credit/Debit Card' | 'Bank Transfer/NEFT' | 'UPI/Digital Wallet';
  referenceNumber: string;
  recordedBy: string;
}

export interface Bill {
  id: string;
  invoiceNumber: string; // e.g., "NEX-INV-2025-001"
  accountId: string; // 16-digit
  customerName: string;
  billingMonth: string; // e.g., "September 2026"
  billingDate: string;
  dueDate: string;
  planName: string;
  connectionType: ConnectionType;
  
  // Financial Breakdowns
  securityDeposit: number;
  monthlyRental: number;
  hourlyCharges: number;
  subtotal: number; // securityDeposit + monthlyRental + hourlyCharges
  serviceTaxRate: number; // 12.24%
  serviceTaxAmount: number; // subtotal * 12.24%
  totalAmount: number; // subtotal + serviceTaxAmount
  
  // Payment Status Tracking
  amountPaid: number;
  dueAmount: number; // totalAmount - amountPaid
  status: BillStatus;
  paymentHistory: PaymentRecord[];
}

// 10. Charge & System Settings
export interface SystemSettings {
  serviceTaxRate: number; // default 12.24
  latePaymentFeePercent: number; // e.g. 5%
  defaultSecurityDeposits: {
    Broadband: number;
    'Dial-Up': number;
    Landline: number;
  };
  installationGracePeriodDays: number;
}


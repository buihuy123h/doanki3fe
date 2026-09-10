// Nexus Service Marketing System - Core Type Definitions

export type RoleType = 'admin' | 'retail' | 'technical' | 'accounts' | 'user';

// "Landline" is the spec's "only telephone connection" (Account/Order ID prefix = T).
export type ConnectionType = 'Broadband' | 'Dial-Up' | 'Landline';

// Order ID prefix per spec: D = Dial-Up, B = Broadband, T = Telephone-only (Landline).
export const CONNECTION_TYPE_LETTER: Record<ConnectionType, 'D' | 'B' | 'T'> = {
  'Dial-Up': 'D',
  Broadband: 'B',
  Landline: 'T',
};

export type OrderStatus = 'Pending' | 'Feasible' | 'Not Feasible' | 'Connection Provided';

// Bulk / corporate scheme: discount on the advance (first rental) and the security
// deposit, based on how many connections the order covers.
//   10–15 => 25%   15–25 => 50%   25–50 => 75%   >50 => 100%
export function getBulkDiscountPercent(connectionCount: number): number {
  const n = Math.max(1, Math.floor(connectionCount || 1));
  if (n > 50) return 100;
  if (n >= 25) return 75;
  if (n >= 15) return 50;
  if (n >= 10) return 25;
  return 0;
}

export type ConnectionStatus = 'Active' | 'Temporarily Inactive' | 'Permanently Inactive';

export type BillStatus = 'Paid' | 'Partially Paid' | 'Unpaid';

export type EquipmentStatus = 'In Service' | 'In Stock' | 'Maintenance' | 'Faulty';

// 1. Service Plans
export type PlanBillingCycle =
  | 'Hourly Pack'
  | 'Monthly'
  | 'Quarterly'
  | 'Half-Yearly'
  | 'Yearly';

export interface Plan {
  id: string;
  name: string;
  type: ConnectionType;
  speedOrBandwidth: string; // e.g., "56 Kbps", "128 Kbps", "PSTN Voice"
  monthlyRental: number; // headline charge for the plan's billing cycle / pack price
  hourlyCharge?: number; // for dial-up or metered
  securityDeposit: number; // 500 Broadband / 325 Dial-Up / 250 Landline (spec)
  dataLimit?: string; // e.g., "Unlimited" or "60 Hours"
  status: 'Active' | 'Archived';
  description: string;
  billingCycle?: PlanBillingCycle; // spec pricing tables are per cycle
  validity?: string; // e.g., "1 Month", "6 Months", "1 Year"
  includedHours?: number; // hourly dial-up / broadband packs
  callRates?: string; // landline call charges summary (per spec)
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
  cityCode: string; // 3-digit numeric code of the city, used inside the Account ID
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
  id: string; // 11-char alphanumeric: prefix D/B/T + 10-digit serial (e.g. "D0000000001")
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
  assignedAccountId?: string; // 16-char Account ID issued once the line is Feasible

  // Bulk / corporate scheme
  bulkConnectionsCount: number; // connections covered by this order (>= 1)
  bulkDiscountPercent: number; // derived from getBulkDiscountPercent()

  // Dial-Up: feasibility is checked for BOTH the landline and the internet leg,
  // unless the customer already holds a Nexus landline (then internet only).
  existingLandlineAccountId?: string;
  landlineFeasible?: boolean;
  internetFeasible?: boolean;
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
  discountPercent: number; // bulk / corporate scheme discount
  discountAmount: number; // applied to (securityDeposit + monthlyRental)
  subtotal: number; // securityDeposit + monthlyRental + hourlyCharges - discountAmount
  serviceTaxRate: number; // 12.24%
  serviceTaxAmount: number; // subtotal * 12.24%
  totalAmount: number; // subtotal + serviceTaxAmount
  
  // Payment Status Tracking
  amountPaid: number;
  dueAmount: number; // totalAmount - amountPaid
  status: BillStatus;
  paymentHistory: PaymentRecord[];
}

// 10. Customer Feedback (collected per functional requirement #2)
export type FeedbackCategory =
  | 'Service Quality'
  | 'Installation'
  | 'Billing'
  | 'Support'
  | 'Other';

export interface Feedback {
  id: string;
  accountId?: string; // 16-char Account ID, if the connection is live
  orderId?: string;
  customerName: string;
  rating: number; // 1..5
  category: FeedbackCategory;
  message: string;
  createdAt: string;
  response?: string; // reply from the admin / retail outlet
  respondedBy?: string;
  respondedAt?: string;
}

// 11. Charge & System Settings
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


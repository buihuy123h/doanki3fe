import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  Plan,
  Employee,
  Vendor,
  RetailShop,
  InventoryItem,
  Order,
  Connection,
  Equipment,
  Bill,
  PaymentRecord,
  SystemSettings,
  OrderStatus,
  ConnectionStatus,
  RoleType,
} from '../types/nexus';

// Helper to generate 11-digit Alphanumeric Order ID (e.g. D0000000001)
// eslint-disable-next-line react-refresh/only-export-components
export function generateOrderId(type: 'Broadband' | 'Dial-Up' | 'Landline', count: number): string {
  const prefix = type === 'Dial-Up' ? 'D' : type === 'Broadband' ? 'B' : 'L';
  const numPart = String(count).padStart(10, '0');
  return `${prefix}${numPart}`;
}

// Helper to generate 16-digit formatted Account ID (e.g. 8820-4102-9931-1005)
// eslint-disable-next-line react-refresh/only-export-components
export function generateAccountId(): string {
  const part = () => Math.floor(1000 + Math.random() * 9000).toString();
  return `${part()}-${part()}-${part()}-${part()}`;
}

interface NexusContextType {
  // Active Role
  currentRole: RoleType;
  setCurrentRole: (role: RoleType) => void;

  // Plans
  plans: Plan[];
  addPlan: (plan: Omit<Plan, 'id'>) => void;
  updatePlan: (id: string, plan: Partial<Plan>) => void;
  deletePlan: (id: string) => void;

  // Employees
  employees: Employee[];
  addEmployee: (emp: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, emp: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  // Vendors
  vendors: Vendor[];
  addVendor: (vendor: Omit<Vendor, 'id'>) => void;
  updateVendor: (id: string, vendor: Partial<Vendor>) => void;
  deleteVendor: (id: string) => void;

  // Retail Shops
  retailShops: RetailShop[];
  addRetailShop: (shop: Omit<RetailShop, 'id'>) => void;

  // Stock / Inventory
  inventory: InventoryItem[];
  updateInventoryStock: (id: string, delta: number) => void;
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;

  // Orders
  orders: Order[];
  placeOrder: (orderData: Omit<Order, 'id' | 'createdAt' | 'status'>) => Order;
  updateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    feasibilityNotes?: string,
    cableDistanceMeters?: number,
    dpBoxCapacity?: string,
    signalLossDbm?: number
  ) => void;
  provisionConnectionForOrder: (orderId: string, assignedDeviceSerial: string) => Connection | null;

  // Connections
  connections: Connection[];
  updateConnectionStatus: (accountId: string, status: ConnectionStatus, reason?: string) => void;

  // Equipments
  equipments: Equipment[];
  addEquipment: (eq: Omit<Equipment, 'id'>) => void;
  updateEquipment: (id: string, eq: Partial<Equipment>) => void;

  // Billing
  bills: Bill[];
  generateBill: (
    accountId: string,
    securityDeposit: number,
    monthlyRental: number,
    hourlyCharges: number,
    billingMonth: string
  ) => Bill;
  recordPayment: (
    invoiceNumber: string,
    amountPaid: number,
    paymentMode: 'Cash' | 'Cheque' | 'Credit/Debit Card' | 'Bank Transfer/NEFT' | 'UPI/Digital Wallet',
    referenceNumber: string,
    recordedBy: string
  ) => Bill | null;

  // Settings
  settings: SystemSettings;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
}

const NexusContext = createContext<NexusContextType | undefined>(undefined);

// INITIAL MOCK DATA
const INITIAL_PLANS: Plan[] = [
  {
    id: 'plan-bb-01',
    name: 'Broadband Fiber Ultra Giga',
    type: 'Broadband',
    speedOrBandwidth: '300 Mbps Fiber Symmetrical',
    monthlyRental: 79.99,
    securityDeposit: 75.0,
    dataLimit: 'Unlimited High-Speed',
    status: 'Active',
    description: 'Ultra-low latency FTTH broadband ideal for enterprises, power users, and multi-device streaming.',
  },
  {
    id: 'plan-bb-02',
    name: 'Broadband Home Starter',
    type: 'Broadband',
    speedOrBandwidth: '100 Mbps Fiber',
    monthlyRental: 49.99,
    securityDeposit: 50.0,
    dataLimit: 'Unlimited',
    status: 'Active',
    description: 'High-speed fiber connection suited for standard family households and remote working.',
  },
  {
    id: 'plan-du-01',
    name: 'Dial-Up Heritage Connect',
    type: 'Dial-Up',
    speedOrBandwidth: '56 Kbps V.92 / V.44',
    monthlyRental: 14.99,
    hourlyCharge: 0.75,
    securityDeposit: 20.0,
    dataLimit: 'Metered Dial-Up',
    status: 'Active',
    description: 'Reliable PSTN modem dial-up backup channel for point-of-sale terminals and legacy SCADA systems.',
  },
  {
    id: 'plan-du-02',
    name: 'Dial-Up Classic Unlimited',
    type: 'Dial-Up',
    speedOrBandwidth: '56 Kbps Unthrottled',
    monthlyRental: 24.99,
    securityDeposit: 25.0,
    dataLimit: 'Unlimited Hours',
    status: 'Active',
    description: 'Flat-rate dial-up internet access with nationwide toll-free POP access numbers.',
  },
  {
    id: 'plan-ll-01',
    name: 'Landline Crystal Fiber Voice',
    type: 'Landline',
    speedOrBandwidth: 'HD VoIP Digital Audio',
    monthlyRental: 19.99,
    securityDeposit: 30.0,
    dataLimit: 'Unlimited Domestic Voice',
    status: 'Active',
    description: 'Crystal-clear digital VoIP fixed-line phone with caller ID, call waiting, and 3-way conference.',
  },
  {
    id: 'plan-ll-02',
    name: 'Landline Standard Copper PSTN',
    type: 'Landline',
    speedOrBandwidth: 'Standard POTS Copper',
    monthlyRental: 11.99,
    securityDeposit: 20.0,
    dataLimit: '100 Free Call Minutes',
    status: 'Active',
    description: 'Traditional analog copper wire telephone connection with power-outage lifeline reliability.',
  },
];

const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-01',
    employeeCode: 'EMP-1001',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@nexus.telecom',
    phone: '+1 (555) 234-8901',
    role: 'Manager',
    department: 'Administration',
    status: 'Active',
    dateOfJoining: '2022-03-15',
  },
  {
    id: 'emp-02',
    employeeCode: 'EMP-1042',
    name: 'David Chen',
    email: 'david.chen@nexus.telecom',
    phone: '+1 (555) 456-1123',
    role: 'Retail Staff',
    department: 'Retail Outlets',
    retailShopAssigned: 'Downtown Flagship (SH-01)',
    status: 'Active',
    dateOfJoining: '2023-06-10',
  },
  {
    id: 'emp-03',
    employeeCode: 'EMP-1077',
    name: 'Marcus Ramirez',
    email: 'marcus.ramirez@nexus.telecom',
    phone: '+1 (555) 789-3344',
    role: 'Field Engineer',
    department: 'Technical Operations',
    status: 'Active',
    dateOfJoining: '2021-11-04',
  },
  {
    id: 'emp-04',
    employeeCode: 'EMP-1090',
    name: 'Elena Rostova',
    email: 'elena.rostova@nexus.telecom',
    phone: '+1 (555) 901-5567',
    role: 'Senior Accountant',
    department: 'Finance & Accounts',
    status: 'Active',
    dateOfJoining: '2020-08-20',
  },
  {
    id: 'emp-05',
    employeeCode: 'EMP-1105',
    name: 'Aiden Brooks',
    email: 'aiden.brooks@nexus.telecom',
    phone: '+1 (555) 345-6789',
    role: 'Retail Staff',
    department: 'Retail Outlets',
    retailShopAssigned: 'Metro Uptown Hub (SH-02)',
    status: 'Active',
    dateOfJoining: '2024-01-15',
  },
];

const INITIAL_VENDORS: Vendor[] = [
  {
    id: 'vnd-01',
    vendorCode: 'VND-401',
    companyName: 'Corning Optical Systems Ltd',
    contactPerson: 'Gregory Vance',
    category: 'Fiber Optics & Cabling',
    phone: '+1 (800) 522-6789',
    email: 'sales@corning-telecom.com',
    address: '800 Corning Way, Hickory, NC',
    rating: 5,
    status: 'Active',
  },
  {
    id: 'vnd-02',
    vendorCode: 'VND-402',
    companyName: 'Cisco Systems Commercial Hardware',
    contactPerson: 'Linda Morrison',
    category: 'Modems & Routers',
    phone: '+1 (800) 553-6387',
    email: 'enterprise-hw@cisco.com',
    address: '170 West Tasman Dr, San Jose, CA',
    rating: 5,
    status: 'Active',
  },
  {
    id: 'vnd-03',
    vendorCode: 'VND-403',
    companyName: 'Zyxel Communications Corp',
    contactPerson: 'Kenji Sato',
    category: 'Modems & Routers',
    phone: '+1 (714) 632-0882',
    email: 'support-b2b@zyxel.com',
    address: '1130 North Miller St, Anaheim, CA',
    rating: 4,
    status: 'Active',
  },
  {
    id: 'vnd-04',
    vendorCode: 'VND-404',
    companyName: 'Amphenol Telecom Assemblies',
    contactPerson: 'Rachel Ward',
    category: 'Telecom Switches',
    phone: '+1 (203) 265-8900',
    email: 'supply@amphenol-rf.com',
    address: '358 Hall Avenue, Wallingford, CT',
    rating: 4,
    status: 'Active',
  },
];

const INITIAL_RETAIL_SHOPS: RetailShop[] = [
  {
    id: 'sh-01',
    shopCode: 'SH-01',
    name: 'Downtown Nexus Flagship Store',
    city: 'New York',
    address: '452 Broadway, Manhattan, NY 10013',
    managerName: 'David Chen',
    phone: '+1 (212) 555-0144',
    operatingHours: 'Mon-Sat: 08:30 - 20:00, Sun: 10:00 - 18:00',
    activeEmployeesCount: 6,
    totalSubscribersServed: 1420,
  },
  {
    id: 'sh-02',
    shopCode: 'SH-02',
    name: 'Metro Uptown Tech Hub',
    city: 'New York',
    address: '2190 Broadway, Upper West Side, NY 10024',
    managerName: 'Aiden Brooks',
    phone: '+1 (212) 555-0189',
    operatingHours: 'Mon-Sat: 09:00 - 19:30',
    activeEmployeesCount: 4,
    totalSubscribersServed: 980,
  },
  {
    id: 'sh-03',
    shopCode: 'SH-03',
    name: 'Queens Central Service Center',
    city: 'Queens',
    address: '70-20 Austin St, Forest Hills, NY 11375',
    managerName: 'Kavita Patel',
    phone: '+1 (718) 555-0199',
    operatingHours: 'Mon-Fri: 09:00 - 18:00, Sat: 09:00 - 15:00',
    activeEmployeesCount: 3,
    totalSubscribersServed: 750,
  },
  {
    id: 'sh-04',
    shopCode: 'SH-04',
    name: 'Brooklyn Nexus Connect Depot',
    city: 'Brooklyn',
    address: '320 Atlantic Ave, Boerum Hill, NY 11201',
    managerName: 'Robert Gomez',
    phone: '+1 (718) 555-0210',
    operatingHours: 'Mon-Sat: 09:00 - 19:00',
    activeEmployeesCount: 5,
    totalSubscribersServed: 1120,
  },
];

const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-01',
    itemCode: 'EQ-ONT-FBR',
    name: 'Huawei EchoLife HG8245H5 GPON ONT',
    category: 'Fiber ONT',
    stockQuantity: 145,
    reorderLevel: 25,
    unitCost: 55.0,
    location: 'Central Depot Bay 4A',
    supplier: 'Cisco Systems Commercial Hardware',
  },
  {
    id: 'inv-02',
    itemCode: 'EQ-RTR-AX',
    name: 'Nexus Wi-Fi 6 AX3000 Dual-Band Router',
    category: 'Router',
    stockQuantity: 88,
    reorderLevel: 20,
    unitCost: 65.0,
    location: 'Central Depot Bay 2B',
    supplier: 'Zyxel Communications Corp',
  },
  {
    id: 'inv-03',
    itemCode: 'EQ-MDM-V92',
    name: 'USRobotics 56K V.92 Faxmodem USB/PSTN',
    category: 'Modem',
    stockQuantity: 18,
    reorderLevel: 10,
    unitCost: 32.0,
    location: 'Central Depot Bay 7C',
    supplier: 'Amphenol Telecom Assemblies',
  },
  {
    id: 'inv-04',
    itemCode: 'EQ-ATA-VOIP',
    name: 'Grandstream HT802 2-Port Analog VoIP Adapter',
    category: 'VoIP Adapter',
    stockQuantity: 42,
    reorderLevel: 15,
    unitCost: 28.0,
    location: 'Central Depot Bay 3C',
    supplier: 'Amphenol Telecom Assemblies',
  },
  {
    id: 'inv-05',
    itemCode: 'EQ-SPL-1X8',
    name: 'Corning 1x8 PLC Optical Fiber Splitter',
    category: 'Splitter',
    stockQuantity: 9, // Low stock indicator
    reorderLevel: 15,
    unitCost: 14.5,
    location: 'Central Depot Bay 1A',
    supplier: 'Corning Optical Systems Ltd',
  },
];

const INITIAL_ORDERS: Order[] = [
  {
    id: 'D0000000001',
    customerName: 'Arthur Pendelton',
    customerPhone: '+1 (555) 902-1844',
    customerEmail: 'arthur.p@classiccorp.net',
    installationAddress: '144 West 82nd St, Apt 4B, New York, NY 10024',
    idProofType: 'National ID Card',
    idProofNumber: 'ID-US-9918231',
    connectionType: 'Dial-Up',
    planId: 'plan-du-01',
    planName: 'Dial-Up Heritage Connect',
    retailOutletCode: 'SH-02',
    retailEmployeeName: 'David Chen',
    createdAt: '2026-09-04 10:30',
    status: 'Pending',
    cableDistanceMeters: 420,
    dpBoxCapacity: 'Port 6 Available / DP-B12',
    signalLossDbm: -18.5,
  },
  {
    id: 'B0000000002',
    customerName: 'Samantha Vance',
    customerPhone: '+1 (555) 301-4477',
    customerEmail: 'samantha.vance@gmail.com',
    installationAddress: '78 Mercer St, Soho, New York, NY 10012',
    idProofType: 'Passport',
    idProofNumber: 'P-98827419',
    connectionType: 'Broadband',
    planId: 'plan-bb-01',
    planName: 'Broadband Fiber Ultra Giga',
    retailOutletCode: 'SH-01',
    retailEmployeeName: 'David Chen',
    createdAt: '2026-09-04 14:15',
    status: 'Feasible',
    feasibilityNotes: 'Fiber termination box available within 85m. Signal strength -16.2 dBm (Excellent). Line tested OK.',
    cableDistanceMeters: 85,
    dpBoxCapacity: 'Port 2 Available / DP-S04',
    signalLossDbm: -16.2,
  },
  {
    id: 'L0000000003',
    customerName: 'Highline Consulting LLC',
    customerPhone: '+1 (555) 777-8899',
    customerEmail: 'office@highlineconsulting.com',
    installationAddress: '55 Hudson Yards, Fl 18, New York, NY 10001',
    idProofType: "Driver's License",
    idProofNumber: 'DL-NY-2940192',
    connectionType: 'Landline',
    planId: 'plan-ll-01',
    planName: 'Landline Crystal Fiber Voice',
    retailOutletCode: 'SH-01',
    retailEmployeeName: 'David Chen',
    createdAt: '2026-09-02 09:00',
    status: 'Connection Provided',
    assignedAccountId: '8820-4102-9931-1001',
    feasibilityNotes: 'Optical loop line deployed. Fiber ATA installed and tested. Audio quality verified.',
    cableDistanceMeters: 120,
    dpBoxCapacity: 'Port 8 Dedicated',
    signalLossDbm: -15.1,
  },
  {
    id: 'B0000000004',
    customerName: 'Robert Lewandowski',
    customerPhone: '+1 (555) 621-9988',
    customerEmail: 'robert.lewan@yahoo.com',
    installationAddress: '89-12 Far Rockaway Blvd, Queens, NY 11693',
    idProofType: 'National ID Card',
    idProofNumber: 'ID-US-8827391',
    connectionType: 'Broadband',
    planId: 'plan-bb-02',
    planName: 'Broadband Home Starter',
    retailOutletCode: 'SH-03',
    retailEmployeeName: 'Aiden Brooks',
    createdAt: '2026-09-03 11:45',
    status: 'Not Feasible',
    feasibilityNotes: 'Distance to nearest fiber distribution box exceeds 1,150 meters. Severe optical attenuation (-34 dBm). Requires main trunk extension.',
    cableDistanceMeters: 1150,
    dpBoxCapacity: 'No Spare Ports',
    signalLossDbm: -34.0,
  },
];

const INITIAL_CONNECTIONS: Connection[] = [
  {
    accountId: '8820-4102-9931-1001',
    orderId: 'L0000000003',
    customerName: 'Highline Consulting LLC',
    customerPhone: '+1 (555) 777-8899',
    customerEmail: 'office@highlineconsulting.com',
    installationAddress: '55 Hudson Yards, Fl 18, New York, NY 10001',
    connectionType: 'Landline',
    planName: 'Landline Crystal Fiber Voice',
    monthlyRental: 19.99,
    securityDeposit: 30.0,
    status: 'Active',
    ipAddress: '198.51.100.42',
    portNumber: 'VOIP-ETH-1',
    assignedDeviceSerial: 'NX-ATA-881920',
    assignedDeviceModel: 'Grandstream HT802 2-Port Analog VoIP Adapter',
    installedDate: '2026-09-02',
    lastUpdated: '2026-09-02 16:30',
  },
  {
    accountId: '8820-4102-9931-1002',
    orderId: 'B0000000005',
    customerName: 'Victoria Sterling',
    customerPhone: '+1 (555) 441-2099',
    customerEmail: 'v.sterling@apexlegal.org',
    installationAddress: '120 E 64th St, Manhattan, NY 10065',
    connectionType: 'Broadband',
    planName: 'Broadband Fiber Ultra Giga',
    monthlyRental: 79.99,
    securityDeposit: 75.0,
    status: 'Active',
    ipAddress: '203.0.113.88',
    portNumber: 'GPON-0/1/4',
    assignedDeviceSerial: 'NX-HW-992810',
    assignedDeviceModel: 'Huawei EchoLife HG8245H5 GPON ONT',
    installedDate: '2026-08-15',
    lastUpdated: '2026-08-15 11:20',
  },
  {
    accountId: '8820-4102-9931-1003',
    orderId: 'D0000000006',
    customerName: 'Retro Arcade Lounge LLC',
    customerPhone: '+1 (555) 332-9011',
    customerEmail: 'manager@retroarcadeny.com',
    installationAddress: '31 St Marks Pl, East Village, NY 10003',
    connectionType: 'Dial-Up',
    planName: 'Dial-Up Classic Unlimited',
    monthlyRental: 24.99,
    securityDeposit: 25.0,
    status: 'Temporarily Inactive',
    ipAddress: '192.0.2.14',
    portNumber: 'PSTN-LINE-4',
    assignedDeviceSerial: 'NX-MD-110294',
    assignedDeviceModel: 'USRobotics 56K V.92 Faxmodem USB/PSTN',
    installedDate: '2026-07-10',
    lastUpdated: '2026-09-01 09:15',
    lastStatusReason: 'Customer requested seasonal suspension during venue renovation.',
  },
  {
    accountId: '8820-4102-9931-1004',
    orderId: 'B0000000007',
    customerName: 'Jonathan Meyer',
    customerPhone: '+1 (555) 881-2300',
    customerEmail: 'j.meyer@brooklynloft.io',
    installationAddress: '175 Water St, Dumbo, Brooklyn, NY 11201',
    connectionType: 'Broadband',
    planName: 'Broadband Home Starter',
    monthlyRental: 49.99,
    securityDeposit: 50.0,
    status: 'Permanently Inactive',
    assignedDeviceSerial: 'NX-HW-992811',
    assignedDeviceModel: 'Nexus Wi-Fi 6 AX3000 Dual-Band Router',
    installedDate: '2026-05-18',
    lastUpdated: '2026-08-30 17:00',
    lastStatusReason: 'Tenant relocated outside coverage zone; equipment returned and de-provisioned.',
  },
];

const INITIAL_EQUIPMENTS: Equipment[] = [
  {
    id: 'eq-01',
    serialNumber: 'NX-HW-992810',
    macAddress: 'BC:A9:93:21:44:8E',
    deviceModel: 'Huawei EchoLife HG8245H5 GPON ONT',
    deviceType: 'Fiber ONT Modem',
    assignedAccountId: '8820-4102-9931-1002',
    assignedCustomerName: 'Victoria Sterling',
    firmwareVersion: 'V500R019C20SPC120',
    status: 'In Service',
    assignedTechnician: 'Marcus Ramirez',
    installedDate: '2026-08-15',
  },
  {
    id: 'eq-02',
    serialNumber: 'NX-ATA-881920',
    macAddress: '00:0B:82:76:D4:11',
    deviceModel: 'Grandstream HT802 2-Port Analog VoIP Adapter',
    deviceType: 'Analog Telephone Adapter',
    assignedAccountId: '8820-4102-9931-1001',
    assignedCustomerName: 'Highline Consulting LLC',
    firmwareVersion: '1.0.35.3',
    status: 'In Service',
    assignedTechnician: 'Marcus Ramirez',
    installedDate: '2026-09-02',
  },
  {
    id: 'eq-03',
    serialNumber: 'NX-MD-110294',
    macAddress: 'F8:E4:FB:99:A2:03',
    deviceModel: 'USRobotics 56K V.92 Faxmodem USB/PSTN',
    deviceType: 'VDSL2/ADSL Modem',
    assignedAccountId: '8820-4102-9931-1003',
    assignedCustomerName: 'Retro Arcade Lounge LLC',
    firmwareVersion: 'v2.1.8-PSTN',
    status: 'In Service',
    assignedTechnician: 'Marcus Ramirez',
    installedDate: '2026-07-10',
  },
  {
    id: 'eq-04',
    serialNumber: 'NX-HW-992811',
    macAddress: '00:1A:2B:3C:4D:5E',
    deviceModel: 'Nexus Wi-Fi 6 AX3000 Dual-Band Router',
    deviceType: 'Gigabit Router',
    firmwareVersion: 'v3.2.4-BUILD-921',
    status: 'In Stock',
  },
  {
    id: 'eq-05',
    serialNumber: 'NX-HW-992812',
    macAddress: '54:AF:97:88:B1:00',
    deviceModel: 'Huawei EchoLife HG8245H5 GPON ONT',
    deviceType: 'Fiber ONT Modem',
    firmwareVersion: 'V500R019C20SPC120',
    status: 'In Stock',
  },
  {
    id: 'eq-06',
    serialNumber: 'NX-HW-992813',
    macAddress: 'A0:B1:C2:D3:E4:F5',
    deviceModel: 'Nexus Wi-Fi 6 AX3000 Dual-Band Router',
    deviceType: 'Gigabit Router',
    firmwareVersion: 'v3.2.4-BUILD-921',
    status: 'In Stock',
  },
];

const INITIAL_BILLS: Bill[] = [
  {
    id: 'bill-01',
    invoiceNumber: 'NEX-INV-2026-001',
    accountId: '8820-4102-9931-1002',
    customerName: 'Victoria Sterling',
    billingMonth: 'August 2026',
    billingDate: '2026-08-15',
    dueDate: '2026-09-05',
    planName: 'Broadband Fiber Ultra Giga',
    connectionType: 'Broadband',
    securityDeposit: 75.0,
    monthlyRental: 79.99,
    hourlyCharges: 0.0,
    subtotal: 154.99, // 75.0 + 79.99
    serviceTaxRate: 12.24,
    serviceTaxAmount: 18.97, // 154.99 * 0.1224 = 18.97
    totalAmount: 173.96, // 154.99 + 18.97
    amountPaid: 173.96,
    dueAmount: 0.0,
    status: 'Paid',
    paymentHistory: [
      {
        paymentId: 'PAY-89201',
        paymentDate: '2026-08-20',
        amountPaid: 173.96,
        paymentMode: 'Credit/Debit Card',
        referenceNumber: 'TXN-VISA-994821',
        recordedBy: 'Elena Rostova',
      },
    ],
  },
  {
    id: 'bill-02',
    invoiceNumber: 'NEX-INV-2026-002',
    accountId: '8820-4102-9931-1001',
    customerName: 'Highline Consulting LLC',
    billingMonth: 'September 2026',
    billingDate: '2026-09-02',
    dueDate: '2026-09-22',
    planName: 'Landline Crystal Fiber Voice',
    connectionType: 'Landline',
    securityDeposit: 30.0,
    monthlyRental: 19.99,
    hourlyCharges: 0.0,
    subtotal: 49.99, // 30.0 + 19.99
    serviceTaxRate: 12.24,
    serviceTaxAmount: 6.12, // 49.99 * 0.1224 = 6.118776 -> 6.12
    totalAmount: 56.11, // 49.99 + 6.12
    amountPaid: 30.0,
    dueAmount: 26.11,
    status: 'Partially Paid',
    paymentHistory: [
      {
        paymentId: 'PAY-89205',
        paymentDate: '2026-09-03',
        amountPaid: 30.0,
        paymentMode: 'Bank Transfer/NEFT',
        referenceNumber: 'ACH-CITI-449102',
        recordedBy: 'Elena Rostova',
      },
    ],
  },
];

const INITIAL_SETTINGS: SystemSettings = {
  serviceTaxRate: 12.24, // As explicitly specified: Service Tax (12.24%)
  latePaymentFeePercent: 5.0,
  defaultSecurityDeposits: {
    Broadband: 75.0,
    'Dial-Up': 20.0,
    Landline: 30.0,
  },
  installationGracePeriodDays: 7,
};

export const NexusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Persistence in LocalStorage
  const [currentRole, setCurrentRole] = useState<RoleType>('admin');

  const [plans, setPlans] = useState<Plan[]>(() => {
    const saved = localStorage.getItem('nexus_plans');
    return saved ? JSON.parse(saved) : INITIAL_PLANS;
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('nexus_employees');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });

  const [vendors, setVendors] = useState<Vendor[]>(() => {
    const saved = localStorage.getItem('nexus_vendors');
    return saved ? JSON.parse(saved) : INITIAL_VENDORS;
  });

  const [retailShops, setRetailShops] = useState<RetailShop[]>(() => {
    const saved = localStorage.getItem('nexus_retailShops');
    return saved ? JSON.parse(saved) : INITIAL_RETAIL_SHOPS;
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('nexus_inventory');
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('nexus_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [connections, setConnections] = useState<Connection[]>(() => {
    const saved = localStorage.getItem('nexus_connections');
    return saved ? JSON.parse(saved) : INITIAL_CONNECTIONS;
  });

  const [equipments, setEquipments] = useState<Equipment[]>(() => {
    const saved = localStorage.getItem('nexus_equipments');
    return saved ? JSON.parse(saved) : INITIAL_EQUIPMENTS;
  });

  const [bills, setBills] = useState<Bill[]>(() => {
    const saved = localStorage.getItem('nexus_bills');
    return saved ? JSON.parse(saved) : INITIAL_BILLS;
  });

  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('nexus_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem('nexus_plans', JSON.stringify(plans));
  }, [plans]);
  useEffect(() => {
    localStorage.setItem('nexus_employees', JSON.stringify(employees));
  }, [employees]);
  useEffect(() => {
    localStorage.setItem('nexus_vendors', JSON.stringify(vendors));
  }, [vendors]);
  useEffect(() => {
    localStorage.setItem('nexus_retailShops', JSON.stringify(retailShops));
  }, [retailShops]);
  useEffect(() => {
    localStorage.setItem('nexus_inventory', JSON.stringify(inventory));
  }, [inventory]);
  useEffect(() => {
    localStorage.setItem('nexus_orders', JSON.stringify(orders));
  }, [orders]);
  useEffect(() => {
    localStorage.setItem('nexus_connections', JSON.stringify(connections));
  }, [connections]);
  useEffect(() => {
    localStorage.setItem('nexus_equipments', JSON.stringify(equipments));
  }, [equipments]);
  useEffect(() => {
    localStorage.setItem('nexus_bills', JSON.stringify(bills));
  }, [bills]);
  useEffect(() => {
    localStorage.setItem('nexus_settings', JSON.stringify(settings));
  }, [settings]);

  // Plan Handlers
  const addPlan = (plan: Omit<Plan, 'id'>) => {
    const newPlan: Plan = {
      ...plan,
      id: `plan-${Date.now()}`,
    };
    setPlans((prev) => [newPlan, ...prev]);
  };

  const updatePlan = (id: string, updated: Partial<Plan>) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
  };

  const deletePlan = (id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
  };

  // Employee Handlers
  const addEmployee = (emp: Omit<Employee, 'id'>) => {
    const newEmp: Employee = {
      ...emp,
      id: `emp-${Date.now()}`,
    };
    setEmployees((prev) => [newEmp, ...prev]);
  };

  const updateEmployee = (id: string, updated: Partial<Employee>) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
  };

  const deleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  };

  // Vendor Handlers
  const addVendor = (vendor: Omit<Vendor, 'id'>) => {
    const newVendor: Vendor = {
      ...vendor,
      id: `vnd-${Date.now()}`,
    };
    setVendors((prev) => [newVendor, ...prev]);
  };

  const updateVendor = (id: string, updated: Partial<Vendor>) => {
    setVendors((prev) => prev.map((v) => (v.id === id ? { ...v, ...updated } : v)));
  };

  const deleteVendor = (id: string) => {
    setVendors((prev) => prev.filter((v) => v.id !== id));
  };

  // Retail Shop Handlers
  const addRetailShop = (shop: Omit<RetailShop, 'id'>) => {
    const newShop: RetailShop = {
      ...shop,
      id: `sh-${Date.now()}`,
    };
    setRetailShops((prev) => [newShop, ...prev]);
  };

  // Inventory Handlers
  const updateInventoryStock = (id: string, delta: number) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, stockQuantity: Math.max(0, item.stockQuantity + delta) } : item
      )
    );
  };

  const addInventoryItem = (item: Omit<InventoryItem, 'id'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: `inv-${Date.now()}`,
    };
    setInventory((prev) => [newItem, ...prev]);
  };

  // Order Handlers
  const placeOrder = (orderData: Omit<Order, 'id' | 'createdAt' | 'status'>): Order => {
    const nextCount = orders.length + 1;
    const newId = generateOrderId(orderData.connectionType, nextCount);
    const now = new Date();
    const formattedDate = `${now.toISOString().slice(0, 10)} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newOrder: Order = {
      ...orderData,
      id: newId,
      status: 'Pending',
      createdAt: formattedDate,
      cableDistanceMeters: Math.floor(60 + Math.random() * 400),
      dpBoxCapacity: 'Port available / DP-Scan',
      signalLossDbm: -(14 + Math.random() * 8),
    };

    setOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  };

  const updateOrderStatus = (
    orderId: string,
    status: OrderStatus,
    feasibilityNotes?: string,
    cableDistanceMeters?: number,
    dpBoxCapacity?: string,
    signalLossDbm?: number
  ) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          return {
            ...ord,
            status,
            ...(feasibilityNotes !== undefined && { feasibilityNotes }),
            ...(cableDistanceMeters !== undefined && { cableDistanceMeters }),
            ...(dpBoxCapacity !== undefined && { dpBoxCapacity }),
            ...(signalLossDbm !== undefined && { signalLossDbm }),
          };
        }
        return ord;
      })
    );
  };

  const provisionConnectionForOrder = (orderId: string, assignedDeviceSerial: string): Connection | null => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return null;

    const plan = plans.find((p) => p.id === order.planId);
    const monthlyRate = plan ? plan.monthlyRental : 49.99;
    const deposit = plan ? plan.securityDeposit : 50.0;

    const newAccountId = generateAccountId();
    const now = new Date().toISOString().slice(0, 10);

    const device = equipments.find((eq) => eq.serialNumber === assignedDeviceSerial);

    const newConnection: Connection = {
      accountId: newAccountId,
      orderId: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      installationAddress: order.installationAddress,
      connectionType: order.connectionType,
      planName: order.planName,
      monthlyRental: monthlyRate,
      securityDeposit: deposit,
      status: 'Active',
      ipAddress: `198.51.${Math.floor(10 + Math.random() * 90)}.${Math.floor(2 + Math.random() * 250)}`,
      portNumber: `ETH-PORT-${Math.floor(1 + Math.random() * 8)}`,
      assignedDeviceSerial,
      assignedDeviceModel: device?.deviceModel || 'Nexus Standard CPE',
      installedDate: now,
      lastUpdated: `${now} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    };

    // Update the order status
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'Connection Provided', assignedAccountId: newAccountId } : o))
    );

    // Add connection
    setConnections((prev) => [newConnection, ...prev]);

    // Update equipment status
    if (assignedDeviceSerial) {
      setEquipments((prev) =>
        prev.map((eq) =>
          eq.serialNumber === assignedDeviceSerial
            ? {
                ...eq,
                status: 'In Service',
                assignedAccountId: newAccountId,
                assignedCustomerName: order.customerName,
                installedDate: now,
              }
            : eq
        )
      );
    }

    return newConnection;
  };

  // Connection Status Update
  const updateConnectionStatus = (accountId: string, status: ConnectionStatus, reason?: string) => {
    const now = `${new Date().toISOString().slice(0, 10)} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    setConnections((prev) =>
      prev.map((conn) =>
        conn.accountId === accountId
          ? {
              ...conn,
              status,
              lastUpdated: now,
              lastStatusReason: reason || conn.lastStatusReason,
            }
          : conn
      )
    );
  };

  // Equipment Handlers
  const addEquipment = (eq: Omit<Equipment, 'id'>) => {
    const newEq: Equipment = {
      ...eq,
      id: `eq-${Date.now()}`,
    };
    setEquipments((prev) => [newEq, ...prev]);
  };

  const updateEquipment = (id: string, updated: Partial<Equipment>) => {
    setEquipments((prev) => prev.map((eq) => (eq.id === id ? { ...eq, ...updated } : eq)));
  };

  // Billing Handlers
  const generateBill = (
    accountId: string,
    securityDeposit: number,
    monthlyRental: number,
    hourlyCharges: number,
    billingMonth: string
  ): Bill => {
    const conn = connections.find((c) => c.accountId === accountId);
    const customerName = conn ? conn.customerName : 'Nexus Valued Subscriber';
    const planName = conn ? conn.planName : 'Telecommunications Plan';
    const connectionType = conn ? conn.connectionType : 'Broadband';

    const subtotal = Number((securityDeposit + monthlyRental + hourlyCharges).toFixed(2));
    const taxRate = settings.serviceTaxRate; // 12.24%
    const serviceTaxAmount = Number(((subtotal * taxRate) / 100).toFixed(2));
    const totalAmount = Number((subtotal + serviceTaxAmount).toFixed(2));

    const invoiceNum = `NEX-INV-${new Date().getFullYear()}-${String(bills.length + 1).padStart(3, '0')}`;
    const today = new Date().toISOString().slice(0, 10);
    const due = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const newBill: Bill = {
      id: `bill-${Date.now()}`,
      invoiceNumber: invoiceNum,
      accountId,
      customerName,
      billingMonth,
      billingDate: today,
      dueDate: due,
      planName,
      connectionType,
      securityDeposit,
      monthlyRental,
      hourlyCharges,
      subtotal,
      serviceTaxRate: taxRate,
      serviceTaxAmount,
      totalAmount,
      amountPaid: 0,
      dueAmount: totalAmount,
      status: 'Unpaid',
      paymentHistory: [],
    };

    setBills((prev) => [newBill, ...prev]);
    return newBill;
  };

  const recordPayment = (
    invoiceNumber: string,
    amountPaid: number,
    paymentMode: 'Cash' | 'Cheque' | 'Credit/Debit Card' | 'Bank Transfer/NEFT' | 'UPI/Digital Wallet',
    referenceNumber: string,
    recordedBy: string
  ): Bill | null => {
    let updatedBill: Bill | null = null;

    setBills((prev) =>
      prev.map((bill) => {
        if (bill.invoiceNumber === invoiceNumber) {
          const newTotalPaid = Number((bill.amountPaid + amountPaid).toFixed(2));
          const newDue = Number(Math.max(0, bill.totalAmount - newTotalPaid).toFixed(2));
          const status = newDue <= 0.01 ? 'Paid' : newTotalPaid > 0 ? 'Partially Paid' : 'Unpaid';

          const newPayment: PaymentRecord = {
            paymentId: `PAY-${Date.now().toString().slice(-5)}`,
            paymentDate: new Date().toISOString().slice(0, 10),
            amountPaid,
            paymentMode,
            referenceNumber,
            recordedBy,
          };

          updatedBill = {
            ...bill,
            amountPaid: newTotalPaid,
            dueAmount: newDue,
            status,
            paymentHistory: [newPayment, ...bill.paymentHistory],
          };
          return updatedBill;
        }
        return bill;
      })
    );

    return updatedBill;
  };

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return (
    <NexusContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        plans,
        addPlan,
        updatePlan,
        deletePlan,
        employees,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        vendors,
        addVendor,
        updateVendor,
        deleteVendor,
        retailShops,
        addRetailShop,
        inventory,
        updateInventoryStock,
        addInventoryItem,
        orders,
        placeOrder,
        updateOrderStatus,
        provisionConnectionForOrder,
        connections,
        updateConnectionStatus,
        equipments,
        addEquipment,
        updateEquipment,
        bills,
        generateBill,
        recordPayment,
        settings,
        updateSettings,
      }}
    >
      {children}
    </NexusContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useNexus = (): NexusContextType => {
  const context = useContext(NexusContext);
  if (!context) {
    throw new Error('useNexus must be used within a NexusProvider');
  }
  return context;
};

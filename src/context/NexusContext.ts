import { writable, get } from 'svelte/store';
import {
  CONNECTION_TYPE_LETTER,
  getBulkDiscountPercent,
  type Customer,
  type Plan,
  type Employee,
  type Vendor,
  type RetailShop,
  type InventoryItem,
  type Order,
  type Connection,
  type Equipment,
  type Bill,
  type PaymentRecord,
  type Feedback,
  type SystemSettings,
  type OrderStatus,
  type ConnectionStatus,
  type ConnectionType,
  type RoleType,
} from '../types/nexus';

export { getBulkDiscountPercent };

// 11-char Order ID: prefix D/B/T + 10-digit serial (e.g. D0000000001)
export function generateOrderId(type: ConnectionType, count: number): string {
  const prefix = CONNECTION_TYPE_LETTER[type];
  return `${prefix}${String(count).padStart(10, '0')}`;
}

// Display form: T064-000000000001
export function formatAccountId(raw: string): string {
  const s = (raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return s.length > 4 ? `${s.slice(0, 4)}-${s.slice(4)}` : s;
}

// 16-char Account ID per spec: [type letter D/B/T][3-digit city code][12-digit serial]
// Returned in the canonical dashed display form (T064-000000000001).
export function generateAccountId(type: ConnectionType, cityCode: string, serial: number): string {
  const letter = CONNECTION_TYPE_LETTER[type];
  const city = (cityCode || '999').replace(/\D/g, '').padStart(3, '0').slice(0, 3);
  return formatAccountId(`${letter}${city}${String(serial).padStart(12, '0')}`);
}

// Bare comparison key (drops the dash) so lookups are format-agnostic.
export function accountIdKey(raw: string): string {
  return (raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// ============ INITIAL MOCK DATA (identical to React version) ============

// Security deposit by connection type (spec): Dial-Up 325 / Broadband 500 / Landline 250
const DEPOSIT = { 'Dial-Up': 325, Broadband: 500, Landline: 250 } as const;

// Tariff catalogue transcribed from the spec's Financial pricing tables.
const INITIAL_PLANS: Plan[] = [
  // ---- Dial-Up ----
  {
    id: 'plan-du-h10',
    name: 'Dial-Up Hourly 10 Hrs',
    type: 'Dial-Up',
    speedOrBandwidth: '56 Kbps V.92',
    monthlyRental: 50,
    securityDeposit: DEPOSIT['Dial-Up'],
    dataLimit: '10 Hours',
    status: 'Active',
    billingCycle: 'Hourly Pack',
    validity: '1 Month',
    includedHours: 10,
    description: 'Prepaid 10-hour dial-up pack, valid for one month.',
  },
  {
    id: 'plan-du-h30',
    name: 'Dial-Up Hourly 30 Hrs',
    type: 'Dial-Up',
    speedOrBandwidth: '56 Kbps V.92',
    monthlyRental: 130,
    securityDeposit: DEPOSIT['Dial-Up'],
    dataLimit: '30 Hours',
    status: 'Active',
    billingCycle: 'Hourly Pack',
    validity: '3 Months',
    includedHours: 30,
    description: 'Prepaid 30-hour dial-up pack, valid for three months.',
  },
  {
    id: 'plan-du-h60',
    name: 'Dial-Up Hourly 60 Hrs',
    type: 'Dial-Up',
    speedOrBandwidth: '56 Kbps V.92',
    monthlyRental: 260,
    securityDeposit: DEPOSIT['Dial-Up'],
    dataLimit: '60 Hours',
    status: 'Active',
    billingCycle: 'Hourly Pack',
    validity: '6 Months',
    includedHours: 60,
    description: 'Prepaid 60-hour dial-up pack, valid for six months.',
  },
  {
    id: 'plan-du-28',
    name: 'Dial-Up Unlimited 28 Kbps',
    type: 'Dial-Up',
    speedOrBandwidth: '28 Kbps',
    monthlyRental: 75,
    securityDeposit: DEPOSIT['Dial-Up'],
    dataLimit: 'Unlimited',
    status: 'Active',
    billingCycle: 'Monthly',
    validity: '1 Month',
    description: 'Unlimited dial-up access at 28 Kbps. Quarterly billing also available at $150.',
  },
  {
    id: 'plan-du-56',
    name: 'Dial-Up Unlimited 56 Kbps',
    type: 'Dial-Up',
    speedOrBandwidth: '56 Kbps',
    monthlyRental: 100,
    securityDeposit: DEPOSIT['Dial-Up'],
    dataLimit: 'Unlimited',
    status: 'Active',
    billingCycle: 'Monthly',
    validity: '1 Month',
    description: 'Unlimited dial-up access at 56 Kbps. Quarterly billing also available at $180.',
  },
  // ---- Broadband ----
  {
    id: 'plan-bb-h30',
    name: 'Broadband Hourly 30 Hrs',
    type: 'Broadband',
    speedOrBandwidth: 'Broadband',
    monthlyRental: 175,
    securityDeposit: DEPOSIT.Broadband,
    dataLimit: '30 Hours',
    status: 'Active',
    billingCycle: 'Hourly Pack',
    validity: '1 Month',
    includedHours: 30,
    description: 'Prepaid 30-hour broadband pack, valid for one month.',
  },
  {
    id: 'plan-bb-h60',
    name: 'Broadband Hourly 60 Hrs',
    type: 'Broadband',
    speedOrBandwidth: 'Broadband',
    monthlyRental: 315,
    securityDeposit: DEPOSIT.Broadband,
    dataLimit: '60 Hours',
    status: 'Active',
    billingCycle: 'Hourly Pack',
    validity: '6 Months',
    includedHours: 60,
    description: 'Prepaid 60-hour broadband pack, valid for six months.',
  },
  {
    id: 'plan-bb-64',
    name: 'Broadband Unlimited 64 Kbps',
    type: 'Broadband',
    speedOrBandwidth: '64 Kbps',
    monthlyRental: 225,
    securityDeposit: DEPOSIT.Broadband,
    dataLimit: 'Unlimited',
    status: 'Active',
    billingCycle: 'Monthly',
    validity: '1 Month',
    description: 'Unlimited broadband at 64 Kbps. Quarterly billing also available at $400.',
  },
  {
    id: 'plan-bb-128',
    name: 'Broadband Unlimited 128 Kbps',
    type: 'Broadband',
    speedOrBandwidth: '128 Kbps',
    monthlyRental: 350,
    securityDeposit: DEPOSIT.Broadband,
    dataLimit: 'Unlimited',
    status: 'Active',
    billingCycle: 'Monthly',
    validity: '1 Month',
    description: 'Unlimited broadband at 128 Kbps. Quarterly billing also available at $445.',
  },
  // ---- Landline (telephone only) ----
  {
    id: 'plan-ll-local-y',
    name: 'Landline Local — Unlimited (Yearly)',
    type: 'Landline',
    speedOrBandwidth: 'PSTN Voice',
    monthlyRental: 75,
    securityDeposit: DEPOSIT.Landline,
    dataLimit: 'Unlimited Local',
    status: 'Active',
    billingCycle: 'Yearly',
    validity: '1 Year',
    callRates: 'Local: 55¢/min',
    description: 'Local plan, yearly rental. Call charges billed on top of the rental.',
  },
  {
    id: 'plan-ll-local-m',
    name: 'Landline Local — Monthly',
    type: 'Landline',
    speedOrBandwidth: 'PSTN Voice',
    monthlyRental: 35,
    securityDeposit: DEPOSIT.Landline,
    dataLimit: 'Local Calling',
    status: 'Active',
    billingCycle: 'Monthly',
    validity: '1 Month',
    callRates: 'Local: 75¢/min',
    description: 'Local plan, monthly rental. Call charges billed on top of the rental.',
  },
  {
    id: 'plan-ll-std-m',
    name: 'Landline STD — Monthly',
    type: 'Landline',
    speedOrBandwidth: 'PSTN Voice',
    monthlyRental: 125,
    securityDeposit: DEPOSIT.Landline,
    dataLimit: 'Local + STD',
    status: 'Active',
    billingCycle: 'Monthly',
    validity: '1 Month',
    callRates: 'Local: 70¢/min · STD: $2.25/min · SMS to mobile: $1.00/min',
    description: 'STD plan, monthly rental with local, STD and mobile-messaging call charges.',
  },
  {
    id: 'plan-ll-std-h',
    name: 'Landline STD — Half-Yearly',
    type: 'Landline',
    speedOrBandwidth: 'PSTN Voice',
    monthlyRental: 420,
    securityDeposit: DEPOSIT.Landline,
    dataLimit: 'Local + STD',
    status: 'Active',
    billingCycle: 'Half-Yearly',
    validity: '6 Months',
    callRates: 'Local: 60¢/min · STD: $2.00/min · SMS to mobile: $1.15/min',
    description: 'STD plan, half-yearly rental with reduced call charges.',
  },
  {
    id: 'plan-ll-std-y',
    name: 'Landline STD — Yearly',
    type: 'Landline',
    speedOrBandwidth: 'PSTN Voice',
    monthlyRental: 780,
    securityDeposit: DEPOSIT.Landline,
    dataLimit: 'Local + STD',
    status: 'Active',
    billingCycle: 'Yearly',
    validity: '1 Year',
    callRates: 'Local: 60¢/min · STD: $1.75/min · SMS to mobile: $1.25/min',
    description: 'STD plan, yearly rental with the lowest call charges.',
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

// 3-digit numeric code assigned to each city within the territory (used in Account IDs).
export const CITY_CODES: Record<string, string> = {
  'New York': '064',
  Queens: '072',
  Brooklyn: '081',
  Manhattan: '064',
};

export function cityCodeFor(city: string): string {
  return CITY_CODES[city] ?? '999';
}

const INITIAL_RETAIL_SHOPS: RetailShop[] = [
  {
    id: 'sh-01',
    shopCode: 'SH-01',
    name: 'Downtown Nexus Flagship Store',
    city: 'New York',
    cityCode: '064',
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
    cityCode: '064',
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
    cityCode: '072',
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
    cityCode: '081',
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

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-01',
    fullName: 'Arthur Pendelton',
    phone: '+1 (555) 902-1844',
    email: 'arthur.p@classiccorp.net',
    installationAddress: '144 West 82nd St, Apt 4B, New York, NY 10024',
    idProofType: 'National ID Card',
    idProofNumber: 'ID-US-9918231',
    createdAt: '2026-09-04 10:30',
  },
  {
    id: 'cust-02',
    fullName: 'Samantha Vance',
    phone: '+1 (555) 301-4477',
    email: 'samantha.vance@gmail.com',
    installationAddress: '78 Mercer St, Soho, New York, NY 10012',
    idProofType: 'Passport',
    idProofNumber: 'P-98827419',
    createdAt: '2026-09-04 14:15',
  },
  {
    id: 'cust-03',
    fullName: 'Highline Consulting LLC',
    phone: '+1 (555) 777-8899',
    email: 'office@highlineconsulting.com',
    installationAddress: '55 Hudson Yards, Fl 18, New York, NY 10001',
    idProofType: "Driver's License",
    idProofNumber: 'DL-NY-2940192',
    createdAt: '2026-09-02 09:00',
  },
  {
    id: 'cust-04',
    fullName: 'Robert Lewandowski',
    phone: '+1 (555) 621-9988',
    email: 'robert.lewan@yahoo.com',
    installationAddress: '89-12 Far Rockaway Blvd, Queens, NY 11693',
    idProofType: 'National ID Card',
    idProofNumber: 'ID-US-8827391',
    createdAt: '2026-09-03 11:45',
  },
  {
    id: 'cust-05',
    fullName: 'Victoria Sterling',
    phone: '+1 (555) 441-2099',
    email: 'v.sterling@apexlegal.org',
    installationAddress: '120 E 64th St, Manhattan, NY 10065',
    idProofType: 'Passport',
    idProofNumber: 'P-11928472',
    createdAt: '2026-08-14 09:00',
  },
  {
    id: 'cust-06',
    fullName: 'Retro Arcade Lounge LLC',
    phone: '+1 (555) 332-9011',
    email: 'manager@retroarcadeny.com',
    installationAddress: '31 St Marks pl, East Village, NY 10003',
    idProofType: "Driver's License",
    idProofNumber: 'DL-NY-8829101',
    createdAt: '2026-07-09 14:00',
  },
  {
    id: 'cust-07',
    fullName: 'Jonathan Meyer',
    phone: '+1 (555) 881-2300',
    email: 'j.meyer@brooklynloft.io',
    installationAddress: '175 Water St, Dumbo, Brooklyn, NY 11201',
    idProofType: 'National ID Card',
    idProofNumber: 'ID-US-5544129',
    createdAt: '2026-05-17 11:00',
  },
];

const INITIAL_ORDERS: Order[] = [
  {
    id: 'D0000000001',
    customerId: 'cust-01',
    customerName: 'Arthur Pendelton',
    customerPhone: '+1 (555) 902-1844',
    customerEmail: 'arthur.p@classiccorp.net',
    installationAddress: '144 West 82nd St, Apt 4B, New York, NY 10024',
    idProofType: 'National ID Card',
    idProofNumber: 'ID-US-9918231',
    connectionType: 'Dial-Up',
    planId: 'plan-du-56',
    planName: 'Dial-Up Unlimited 56 Kbps',
    retailOutletCode: 'SH-02',
    retailEmployeeName: 'David Chen',
    createdAt: '2026-09-04 10:30',
    status: 'Pending',
    cableDistanceMeters: 420,
    dpBoxCapacity: 'Port 6 Available / DP-B12',
    signalLossDbm: -18.5,
    bulkConnectionsCount: 1,
    bulkDiscountPercent: 0,
  },
  {
    id: 'B0000000002',
    customerId: 'cust-02',
    customerName: 'Samantha Vance',
    customerPhone: '+1 (555) 301-4477',
    customerEmail: 'samantha.vance@gmail.com',
    installationAddress: '78 Mercer St, Soho, New York, NY 10012',
    idProofType: 'Passport',
    idProofNumber: 'P-98827419',
    connectionType: 'Broadband',
    planId: 'plan-bb-128',
    planName: 'Broadband Unlimited 128 Kbps',
    retailOutletCode: 'SH-01',
    retailEmployeeName: 'David Chen',
    createdAt: '2026-09-04 14:15',
    status: 'Feasible',
    assignedAccountId: 'B064-000000000005',
    feasibilityNotes: 'Fiber termination box available within 85m. Signal strength -16.2 dBm (Excellent). Line tested OK.',
    cableDistanceMeters: 85,
    dpBoxCapacity: 'Port 2 Available / DP-S04',
    signalLossDbm: -16.2,
    bulkConnectionsCount: 1,
    bulkDiscountPercent: 0,
    internetFeasible: true,
  },
  {
    id: 'T0000000003',
    customerId: 'cust-03',
    customerName: 'Highline Consulting LLC',
    customerPhone: '+1 (555) 777-8899',
    customerEmail: 'office@highlineconsulting.com',
    installationAddress: '55 Hudson Yards, Fl 18, New York, NY 10001',
    idProofType: "Driver's License",
    idProofNumber: 'DL-NY-2940192',
    connectionType: 'Landline',
    planId: 'plan-ll-std-m',
    planName: 'Landline STD — Monthly',
    retailOutletCode: 'SH-01',
    retailEmployeeName: 'David Chen',
    createdAt: '2026-09-02 09:00',
    status: 'Connection Provided',
    assignedAccountId: 'T064-000000000001',
    feasibilityNotes: 'Copper loop line deployed. Line tested and audio quality verified.',
    cableDistanceMeters: 120,
    dpBoxCapacity: 'Port 8 Dedicated',
    signalLossDbm: -15.1,
    bulkConnectionsCount: 12, // corporate order — 12 lines => 25% scheme discount
    bulkDiscountPercent: 25,
    landlineFeasible: true,
  },
  {
    id: 'B0000000004',
    customerId: 'cust-04',
    customerName: 'Robert Lewandowski',
    customerPhone: '+1 (555) 621-9988',
    customerEmail: 'robert.lewan@yahoo.com',
    installationAddress: '89-12 Far Rockaway Blvd, Queens, NY 11693',
    idProofType: 'National ID Card',
    idProofNumber: 'ID-US-8827391',
    connectionType: 'Broadband',
    planId: 'plan-bb-64',
    planName: 'Broadband Unlimited 64 Kbps',
    retailOutletCode: 'SH-03',
    retailEmployeeName: 'Aiden Brooks',
    createdAt: '2026-09-03 11:45',
    status: 'Not Feasible',
    feasibilityNotes: 'Distance to nearest fiber distribution box exceeds 1,150 meters. Severe optical attenuation (-34 dBm). Requires main trunk extension.',
    cableDistanceMeters: 1150,
    dpBoxCapacity: 'No Spare Ports',
    signalLossDbm: -34.0,
    bulkConnectionsCount: 1,
    bulkDiscountPercent: 0,
    internetFeasible: false,
  },
];

const INITIAL_CONNECTIONS: Connection[] = [
  {
    accountId: 'T064-000000000001',
    orderId: 'T0000000003',
    customerId: 'cust-03',
    customerName: 'Highline Consulting LLC',
    customerPhone: '+1 (555) 777-8899',
    customerEmail: 'office@highlineconsulting.com',
    installationAddress: '55 Hudson Yards, Fl 18, New York, NY 10001',
    connectionType: 'Landline',
    planName: 'Landline STD — Monthly',
    monthlyRental: 125,
    securityDeposit: 250,
    status: 'Active',
    ipAddress: '198.51.100.42',
    portNumber: 'VOIP-ETH-1',
    assignedDeviceSerial: 'NX-ATA-881920',
    assignedDeviceModel: 'Grandstream HT802 2-Port Analog VoIP Adapter',
    installedDate: '2026-09-02',
    lastUpdated: '2026-09-02 16:30',
  },
  {
    accountId: 'B064-000000000002',
    orderId: 'B0000000005',
    customerId: 'cust-05',
    customerName: 'Victoria Sterling',
    customerPhone: '+1 (555) 441-2099',
    customerEmail: 'v.sterling@apexlegal.org',
    installationAddress: '120 E 64th St, Manhattan, NY 10065',
    connectionType: 'Broadband',
    planName: 'Broadband Unlimited 64 Kbps',
    monthlyRental: 225,
    securityDeposit: 500,
    status: 'Active',
    ipAddress: '203.0.113.88',
    portNumber: 'GPON-0/1/4',
    assignedDeviceSerial: 'NX-HW-992810',
    assignedDeviceModel: 'Huawei EchoLife HG8245H5 GPON ONT',
    installedDate: '2026-08-15',
    lastUpdated: '2026-08-15 11:20',
  },
  {
    accountId: 'D064-000000000003',
    orderId: 'D0000000006',
    customerId: 'cust-06',
    customerName: 'Retro Arcade Lounge LLC',
    customerPhone: '+1 (555) 332-9011',
    customerEmail: 'manager@retroarcadeny.com',
    installationAddress: '31 St Marks pl, East Village, NY 10003',
    connectionType: 'Dial-Up',
    planName: 'Dial-Up Unlimited 56 Kbps',
    monthlyRental: 100,
    securityDeposit: 325,
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
    accountId: 'B081-000000000004',
    orderId: 'B0000000007',
    customerId: 'cust-07',
    customerName: 'Jonathan Meyer',
    customerPhone: '+1 (555) 881-2300',
    customerEmail: 'j.meyer@brooklynloft.io',
    installationAddress: '175 Water St, Dumbo, Brooklyn, NY 11201',
    connectionType: 'Broadband',
    planName: 'Broadband Unlimited 64 Kbps',
    monthlyRental: 225,
    securityDeposit: 500,
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
    assignedAccountId: 'B064-000000000002',
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
    assignedAccountId: 'T064-000000000001',
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
    assignedAccountId: 'D064-000000000003',
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
    accountId: 'B064-000000000002',
    customerName: 'Victoria Sterling',
    billingMonth: 'August 2026',
    billingDate: '2026-08-15',
    dueDate: '2026-09-05',
    planName: 'Broadband Unlimited 64 Kbps',
    connectionType: 'Broadband',
    securityDeposit: 500,
    monthlyRental: 225,
    hourlyCharges: 0,
    discountPercent: 0,
    discountAmount: 0,
    subtotal: 725, // 500 + 225 - 0
    serviceTaxRate: 12.24,
    serviceTaxAmount: 88.74, // 725 * 0.1224
    totalAmount: 813.74, // 725 + 88.74
    amountPaid: 813.74,
    dueAmount: 0,
    status: 'Paid',
    paymentHistory: [
      {
        paymentId: 'PAY-89201',
        paymentDate: '2026-08-20',
        amountPaid: 813.74,
        paymentMode: 'Credit/Debit Card',
        referenceNumber: 'TXN-VISA-994821',
        recordedBy: 'Elena Rostova',
        recordedByEmployeeId: 'emp-04',
      },
    ],
  },
  {
    id: 'bill-02',
    invoiceNumber: 'NEX-INV-2026-002',
    accountId: 'T064-000000000001',
    customerName: 'Highline Consulting LLC',
    billingMonth: 'September 2026',
    billingDate: '2026-09-02',
    dueDate: '2026-09-22',
    planName: 'Landline STD — Monthly',
    connectionType: 'Landline',
    securityDeposit: 250,
    monthlyRental: 125,
    hourlyCharges: 0,
    discountPercent: 25, // 12-line corporate order
    discountAmount: 93.75, // 25% of (250 + 125)
    subtotal: 281.25, // 250 + 125 - 93.75
    serviceTaxRate: 12.24,
    serviceTaxAmount: 34.43, // 281.25 * 0.1224
    totalAmount: 315.68, // 281.25 + 34.43
    amountPaid: 100,
    dueAmount: 215.68,
    status: 'Partially Paid',
    paymentHistory: [
      {
        paymentId: 'PAY-89205',
        paymentDate: '2026-09-03',
        amountPaid: 100,
        paymentMode: 'Bank Transfer/NEFT',
        referenceNumber: 'ACH-CITI-449102',
        recordedBy: 'Elena Rostova',
        recordedByEmployeeId: 'emp-04',
      },
    ],
  },
];

const INITIAL_FEEDBACKS: Feedback[] = [
  {
    id: 'fb-01',
    accountId: 'B064-000000000002',
    orderId: 'B0000000005',
    customerName: 'Victoria Sterling',
    rating: 5,
    category: 'Installation',
    message: 'Field engineer arrived on time and the fibre line was live within an hour. Very smooth.',
    createdAt: '2026-08-16 09:12',
    response: 'Thank you for the kind words — we have shared this with the SH-01 install team.',
    respondedBy: 'Sarah Jenkins',
    respondedAt: '2026-08-16 15:40',
  },
  {
    id: 'fb-02',
    accountId: 'D064-000000000003',
    orderId: 'D0000000006',
    customerName: 'Retro Arcade Lounge LLC',
    rating: 3,
    category: 'Support',
    message: 'Took two calls to get the seasonal suspension applied. Please make this self-service.',
    createdAt: '2026-09-01 11:05',
  },
];

const INITIAL_SETTINGS: SystemSettings = {
  serviceTaxRate: 12.24, // As explicitly specified: Service Tax (12.24%)
  latePaymentFeePercent: 5.0,
  defaultSecurityDeposits: {
    Broadband: 500,
    'Dial-Up': 325,
    Landline: 250,
  },
  installationGracePeriodDays: 7,
};

// ============ SVELTE STORE ============

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function persist(key: string) {
  return <T,>(value: T) => {
    localStorage.setItem(key, JSON.stringify(value));
  };
}

// ============ STORE CREATION ============

function createNexusStore() {
  // Bumped when the seed schema changes so stale localStorage is not reloaded.
  const V = '_v2';
  const currentRole = writable<RoleType>('admin');
  const customers = writable<Customer[]>(loadFromStorage('nexus_customers' + V, INITIAL_CUSTOMERS));
  const plans = writable<Plan[]>(loadFromStorage('nexus_plans' + V, INITIAL_PLANS));
  const employees = writable<Employee[]>(loadFromStorage('nexus_employees' + V, INITIAL_EMPLOYEES));
  const vendors = writable<Vendor[]>(loadFromStorage('nexus_vendors' + V, INITIAL_VENDORS));
  const retailShops = writable<RetailShop[]>(loadFromStorage('nexus_retailShops' + V, INITIAL_RETAIL_SHOPS));
  const inventory = writable<InventoryItem[]>(loadFromStorage('nexus_inventory' + V, INITIAL_INVENTORY));
  const orders = writable<Order[]>(loadFromStorage('nexus_orders' + V, INITIAL_ORDERS));
  const connections = writable<Connection[]>(loadFromStorage('nexus_connections' + V, INITIAL_CONNECTIONS));
  const equipments = writable<Equipment[]>(loadFromStorage('nexus_equipments' + V, INITIAL_EQUIPMENTS));
  const bills = writable<Bill[]>(loadFromStorage('nexus_bills' + V, INITIAL_BILLS));
  const feedbacks = writable<Feedback[]>(loadFromStorage('nexus_feedbacks' + V, INITIAL_FEEDBACKS));
  const settings = writable<SystemSettings>(loadFromStorage('nexus_settings' + V, INITIAL_SETTINGS));

  // Auto-persist to localStorage on every change (mirrors React useEffect persistence)
  customers.subscribe(persist('nexus_customers' + V));
  plans.subscribe(persist('nexus_plans' + V));
  employees.subscribe(persist('nexus_employees' + V));
  vendors.subscribe(persist('nexus_vendors' + V));
  retailShops.subscribe(persist('nexus_retailShops' + V));
  inventory.subscribe(persist('nexus_inventory' + V));
  orders.subscribe(persist('nexus_orders' + V));
  connections.subscribe(persist('nexus_connections' + V));
  equipments.subscribe(persist('nexus_equipments' + V));
  bills.subscribe(persist('nexus_bills' + V));
  feedbacks.subscribe(persist('nexus_feedbacks' + V));
  settings.subscribe(persist('nexus_settings' + V));

  // ---- Plan Handlers ----
  const addPlan = (plan: Omit<Plan, 'id'>) => {
    plans.update((prev) => [{ ...plan, id: `plan-${Date.now()}` }, ...prev]);
  };
  const updatePlan = (id: string, updated: Partial<Plan>) => {
    plans.update((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
  };
  const deletePlan = (id: string) => {
    plans.update((prev) => prev.filter((p) => p.id !== id));
  };

  // ---- Employee Handlers ----
  const addEmployee = (emp: Omit<Employee, 'id'>) => {
    employees.update((prev) => [{ ...emp, id: `emp-${Date.now()}` }, ...prev]);
  };
  const updateEmployee = (id: string, updated: Partial<Employee>) => {
    employees.update((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
  };
  const deleteEmployee = (id: string) => {
    employees.update((prev) => prev.filter((e) => e.id !== id));
  };

  // ---- Vendor Handlers ----
  const addVendor = (vendor: Omit<Vendor, 'id'>) => {
    vendors.update((prev) => [{ ...vendor, id: `vnd-${Date.now()}` }, ...prev]);
  };
  const updateVendor = (id: string, updated: Partial<Vendor>) => {
    vendors.update((prev) => prev.map((v) => (v.id === id ? { ...v, ...updated } : v)));
  };
  const deleteVendor = (id: string) => {
    vendors.update((prev) => prev.filter((v) => v.id !== id));
  };

  // ---- Retail Shop Handlers ----
  const addRetailShop = (shop: Omit<RetailShop, 'id'>) => {
    retailShops.update((prev) => [{ ...shop, id: `sh-${Date.now()}` }, ...prev]);
  };

  // ---- Inventory Handlers ----
  const updateInventoryStock = (id: string, delta: number) => {
    inventory.update((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, stockQuantity: Math.max(0, item.stockQuantity + delta) } : item
      )
    );
  };
  const addInventoryItem = (item: Omit<InventoryItem, 'id'>) => {
    inventory.update((prev) => [{ ...item, id: `inv-${Date.now()}` }, ...prev]);
  };

  // ---- Order Handlers ----
  type PlaceOrderInput = Omit<
    Order,
    | 'id'
    | 'customerId'
    | 'createdAt'
    | 'status'
    | 'cableDistanceMeters'
    | 'dpBoxCapacity'
    | 'signalLossDbm'
    | 'bulkConnectionsCount'
    | 'bulkDiscountPercent'
    | 'landlineFeasible'
    | 'internetFeasible'
    | 'orderGroupId'
    | 'orderGroupIndex'
  > & {
    customerId?: string;
    bulkConnectionsCount?: number;
  };

  const placeOrder = (orderData: PlaceOrderInput): Order => {
    const bulkConnectionsCount = Math.max(1, Math.floor(orderData.bulkConnectionsCount || 1));
    const bulkDiscountPercent = getBulkDiscountPercent(bulkConnectionsCount);
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const createdAt = `${dateStr} ${timeStr}`;

    // Normalize customer: look up by ID number or phone, or create a new customer record.
    let targetCustomerId = orderData.customerId;
    if (!targetCustomerId) {
      const currentCustomers = get(customers);
      const existing = currentCustomers.find(
        (c) =>
          (orderData.idProofNumber && c.idProofNumber === orderData.idProofNumber) ||
          (orderData.customerPhone && c.phone === orderData.customerPhone)
      );
      if (existing) {
        targetCustomerId = existing.id;
      } else {
        targetCustomerId = `cust-${Date.now()}`;
        const newCustomer: Customer = {
          id: targetCustomerId,
          fullName: orderData.customerName,
          phone: orderData.customerPhone || '',
          email: orderData.customerEmail || '',
          installationAddress: orderData.installationAddress || '',
          idProofType: orderData.idProofType || 'National ID Card',
          idProofNumber: orderData.idProofNumber || '',
          createdAt,
        };
        customers.update((prev) => [newCustomer, ...prev]);
      }
    }

    // When bulk > 1, generate a shared orderGroupId and create N individual orders.
    const orderGroupId = bulkConnectionsCount > 1 ? `GRP-${Date.now()}` : undefined;
    const count = bulkConnectionsCount > 1 ? bulkConnectionsCount : 1;
    const newOrders: Order[] = [];

    for (let i = 0; i < count; i++) {
      const currentOrders = get(orders);
      const nextCount = currentOrders.length + newOrders.length + 1;
      const newId = generateOrderId(orderData.connectionType, nextCount);

      const newOrder: Order = {
        ...orderData,
        customerId: targetCustomerId,
        bulkConnectionsCount,
        bulkDiscountPercent,
        id: newId,
        status: 'Pending',
        createdAt,
        cableDistanceMeters: Math.floor(60 + Math.random() * 400),
        dpBoxCapacity: 'Port available / DP-Scan',
        signalLossDbm: Number(-(14 + Math.random() * 8).toFixed(1)),
        ...(orderGroupId ? { orderGroupId, orderGroupIndex: i + 1 } : {}),
      };
      newOrders.push(newOrder);
    }

    orders.update((prev) => [...newOrders, ...prev]);
    // Return the first order (used for receipt display).
    return newOrders[0];
  };

  // Account ID serial: 1 + number of IDs already issued anywhere.
  const nextAccountIdSerial = (): number => {
    const used = new Set<string>();
    get(connections).forEach((c) => used.add(accountIdKey(c.accountId)));
    get(orders).forEach((o) => o.assignedAccountId && used.add(accountIdKey(o.assignedAccountId)));
    return used.size + 1;
  };

  const cityCodeForOrder = (ord: Order): string => {
    const shop = get(retailShops).find((s) => s.shopCode === ord.retailOutletCode);
    return shop?.cityCode ?? '999';
  };

  const updateOrderStatus = (
    orderId: string,
    status: OrderStatus,
    feasibilityNotes?: string,
    cableDistanceMeters?: number,
    dpBoxCapacity?: string,
    signalLossDbm?: number,
    // Dial-Up: which of the two feasibility legs passed. Omit for non-Dial-Up.
    feasibilityLegs?: { landline?: boolean; internet?: boolean }
  ): Order | null => {
    let updatedOrder: Order | null = null;

    orders.update((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          // The 16-char Account ID is issued the moment technical confirms the
          // line is feasible — it is the customer's only sign-in credential.
          const assignedAccountId =
            status === 'Feasible' && !ord.assignedAccountId
              ? generateAccountId(ord.connectionType, cityCodeForOrder(ord), nextAccountIdSerial())
              : ord.assignedAccountId;

          // Dial-Up needs BOTH legs; if the customer already holds a Nexus
          // landline, the landline leg is considered satisfied.
          const landlineFeasible =
            feasibilityLegs?.landline ??
            (ord.existingLandlineAccountId ? true : ord.landlineFeasible);
          const internetFeasible = feasibilityLegs?.internet ?? ord.internetFeasible;

          updatedOrder = {
            ...ord,
            status,
            ...(assignedAccountId !== undefined && { assignedAccountId }),
            ...(feasibilityNotes !== undefined && { feasibilityNotes }),
            ...(cableDistanceMeters !== undefined && { cableDistanceMeters }),
            ...(dpBoxCapacity !== undefined && { dpBoxCapacity }),
            ...(signalLossDbm !== undefined && { signalLossDbm }),
            ...(ord.connectionType === 'Dial-Up' && { landlineFeasible, internetFeasible }),
            ...(ord.connectionType !== 'Dial-Up' &&
              status === 'Feasible' && { internetFeasible: true }),
            ...(ord.connectionType !== 'Dial-Up' &&
              status === 'Not Feasible' && { internetFeasible: false }),
          };
          return updatedOrder;
        }
        return ord;
      })
    );

    return updatedOrder;
  };

  // ---- Connection Provisioning ----
  const provisionConnectionForOrder = (orderId: string, assignedDeviceSerial: string): Connection | null => {
    const order = get(orders).find((o) => o.id === orderId);
    if (!order) return null;

    const plan = get(plans).find((p) => p.id === order.planId);
    const monthlyRate = plan ? plan.monthlyRental : 100;
    const deposit = plan ? plan.securityDeposit : 250;

    // Keep the Account ID the customer already signs in with; only mint one if missing.
    const newAccountId =
      order.assignedAccountId ||
      generateAccountId(order.connectionType, cityCodeForOrder(order), nextAccountIdSerial());
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const device = get(equipments).find((eq) => eq.serialNumber === assignedDeviceSerial);

    const newConnection: Connection = {
      accountId: newAccountId,
      orderId: order.id,
      customerId: order.customerId || 'cust-01',
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
      installedDate: dateStr,
      lastUpdated: `${dateStr} ${timeStr}`,
    };

    // Mark order as fulfilled
    orders.update((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'Connection Provided', assignedAccountId: newAccountId } : o))
    );

    connections.update((prev) => [newConnection, ...prev]);

    // Bind equipment to the new subscriber
    if (assignedDeviceSerial) {
      equipments.update((prev) =>
        prev.map((eq) =>
          eq.serialNumber === assignedDeviceSerial
            ? {
                ...eq,
                status: 'In Service',
                assignedAccountId: newAccountId,
                assignedCustomerName: order.customerName,
                installedDate: dateStr,
              }
            : eq
        )
      );
    }

    return newConnection;
  };

  // ---- Connection Handlers ----
  const updateConnectionStatus = (accountId: string, status: ConnectionStatus, reason?: string) => {
    const now = new Date();
    const stamp = `${now.toISOString().slice(0, 10)} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    connections.update((prev) =>
      prev.map((conn) =>
        conn.accountId === accountId
          ? {
              ...conn,
              status,
              lastUpdated: stamp,
              lastStatusReason: reason || conn.lastStatusReason,
            }
          : conn
      )
    );
  };

  // ---- Equipment Handlers ----
  const addEquipment = (eq: Omit<Equipment, 'id'>) => {
    equipments.update((prev) => [{ ...eq, id: `eq-${Date.now()}` }, ...prev]);
  };
  const updateEquipment = (id: string, updated: Partial<Equipment>) => {
    equipments.update((prev) => prev.map((eq) => (eq.id === id ? { ...eq, ...updated } : eq)));
  };

  // ---- Billing Handlers ----
  const generateBill = (
    accountId: string,
    securityDeposit: number,
    monthlyRental: number,
    hourlyCharges: number,
    billingMonth: string,
    // Bulk / corporate scheme discount on (securityDeposit + monthlyRental).
    discountPercent = 0
  ): Bill => {
    const conn = get(connections).find((c) => accountIdKey(c.accountId) === accountIdKey(accountId));
    const customerName = conn ? conn.customerName : 'Nexus Valued Subscriber';
    const planName = conn ? conn.planName : 'Telecommunications Plan';
    const connectionType = conn ? conn.connectionType : 'Broadband';

    const pct = Math.min(100, Math.max(0, discountPercent || 0));
    const discountAmount = Number((((securityDeposit + monthlyRental) * pct) / 100).toFixed(2));
    const subtotal = Number(
      (securityDeposit + monthlyRental + hourlyCharges - discountAmount).toFixed(2)
    );
    const taxRate = get(settings).serviceTaxRate; // 12.24%
    const serviceTaxAmount = Number(((subtotal * taxRate) / 100).toFixed(2));
    const totalAmount = Number((subtotal + serviceTaxAmount).toFixed(2));

    const currentBills = get(bills);
    const invoiceNum = `NEX-INV-${new Date().getFullYear()}-${String(currentBills.length + 1).padStart(3, '0')}`;
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
      discountPercent: pct,
      discountAmount,
      subtotal,
      serviceTaxRate: taxRate,
      serviceTaxAmount,
      totalAmount,
      amountPaid: 0,
      dueAmount: totalAmount,
      status: 'Unpaid',
      paymentHistory: [],
    };

    bills.update((prev) => [newBill, ...prev]);
    return newBill;
  };

  const recordPayment = (
    invoiceNumber: string,
    amountPaid: number,
    paymentMode: PaymentRecord['paymentMode'],
    referenceNumber: string,
    recordedBy: string
  ): Bill | null => {
    let updatedBill: Bill | null = null;

    bills.update((prev) =>
      prev.map((bill) => {
        if (bill.invoiceNumber === invoiceNumber) {
          const newTotalPaid = Number((bill.amountPaid + amountPaid).toFixed(2));
          const newDue = Number(Math.max(0, bill.totalAmount - newTotalPaid).toFixed(2));
          const status: Bill['status'] = newDue <= 0.01 ? 'Paid' : newTotalPaid > 0 ? 'Partially Paid' : 'Unpaid';

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

  // ---- Feedback Handlers (functional requirement #2) ----
  const addFeedback = (fb: Omit<Feedback, 'id' | 'createdAt'>): Feedback => {
    const now = new Date();
    const created: Feedback = {
      ...fb,
      id: `fb-${Date.now()}`,
      createdAt: `${now.toISOString().slice(0, 10)} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    };
    feedbacks.update((prev) => [created, ...prev]);
    return created;
  };

  const respondFeedback = (id: string, response: string, respondedBy: string) => {
    const now = new Date();
    feedbacks.update((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              response,
              respondedBy,
              respondedAt: `${now.toISOString().slice(0, 10)} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            }
          : f
      )
    );
  };

  // ---- Settings Handlers ----
  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    settings.update((prev) => ({ ...prev, ...newSettings }));
  };



  return {
    currentRole,
    customers,
    plans,
    employees,
    vendors,
    retailShops,
    inventory,
    orders,
    connections,
    equipments,
    bills,
    feedbacks,
    settings,
    addPlan,
    updatePlan,
    deletePlan,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    addVendor,
    updateVendor,
    deleteVendor,
    addRetailShop,
    updateInventoryStock,
    addInventoryItem,
    placeOrder,
    updateOrderStatus,
    provisionConnectionForOrder,
    updateConnectionStatus,
    addEquipment,
    updateEquipment,
    generateBill,
    recordPayment,
    addFeedback,
    respondFeedback,
    updateSettings,
  };
}

export const nexusStore = createNexusStore();



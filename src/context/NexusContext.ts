import { writable, get } from 'svelte/store';
import {
  CONNECTION_TYPE_LETTER,
  getBulkDiscountPercent,
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
import {
  planService,
  employeeService,
  retailShopService,
  vendorService,
  inventoryService,
} from '../api';

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

// Mock data removed. State is hydrated directly from Backend API.

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
    if (!saved) return fallback;
    const sanitized = saved
      .replace(/Ã¢â‚¬â€œ/g, '-')
      .replace(/Ã¢â‚¬â€/g, '-')
      .replace(/â€”/g, '-')
      .replace(/â€“/g, '-');
    return JSON.parse(sanitized);
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
  // Version tag: bumped to clear any obsolete mock data stored in localStorage
  const V = '_v4_clean';
  if (typeof window !== 'undefined') {
    // Clear obsolete mock caches
    ['nexus_plans_v3', 'nexus_employees_v3', 'nexus_vendors_v3', 'nexus_retailShops_v3', 
     'nexus_inventory_v3', 'nexus_orders_v3', 'nexus_connections_v3', 'nexus_equipments_v3', 
     'nexus_bills_v3', 'nexus_feedbacks_v3'].forEach(k => localStorage.removeItem(k));
  }

  const currentRole = writable<RoleType>('admin');
  const dbConnected = writable<boolean>(false);
  const dbInfo = writable<{
    status: string;
    server: string;
    database: string;
    tableCount: number;
    planCount: number;
    orderCount: number;
  } | null>(null);
  const isSyncing = writable<boolean>(false);

  // Clean empty state ready for real API data
  const plans = writable<Plan[]>(loadFromStorage('nexus_plans' + V, []));
  const employees = writable<Employee[]>(loadFromStorage('nexus_employees' + V, []));
  const vendors = writable<Vendor[]>(loadFromStorage('nexus_vendors' + V, []));
  const retailShops = writable<RetailShop[]>(loadFromStorage('nexus_retailShops' + V, []));
  const inventory = writable<InventoryItem[]>(loadFromStorage('nexus_inventory' + V, []));
  const orders = writable<Order[]>(loadFromStorage('nexus_orders' + V, []));
  const connections = writable<Connection[]>(loadFromStorage('nexus_connections' + V, []));
  const equipments = writable<Equipment[]>(loadFromStorage('nexus_equipments' + V, []));
  const bills = writable<Bill[]>(loadFromStorage('nexus_bills' + V, []));
  const feedbacks = writable<Feedback[]>(loadFromStorage('nexus_feedbacks' + V, []));
  const settings = writable<SystemSettings>(loadFromStorage('nexus_settings' + V, INITIAL_SETTINGS));

  // Auto-persist to localStorage on every change
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
  const updateRetailShop = (id: string, updated: Partial<RetailShop>) => {
    retailShops.update((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
  };
  const deleteRetailShop = (id: string) => {
    retailShops.update((prev) => prev.filter((s) => s.id !== id));
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
  const updateInventoryItem = (id: string, updated: Partial<InventoryItem>) => {
    inventory.update((prev) => prev.map((item) => (item.id === id ? { ...item, ...updated } : item)));
  };
  const deleteInventoryItem = (id: string) => {
    inventory.update((prev) => prev.filter((item) => item.id !== id));
  };

  // ---- Order Handlers ----
  type PlaceOrderInput = Omit<
    Order,
    | 'id'
    | 'createdAt'
    | 'status'
    | 'cableDistanceMeters'
    | 'dpBoxCapacity'
    | 'signalLossDbm'
    | 'bulkConnectionsCount'
    | 'bulkDiscountPercent'
    | 'landlineFeasible'
    | 'internetFeasible'
  > & { bulkConnectionsCount?: number };

  const nextOrderIdSerial = (): number => {
    const currentOrders = get(orders);
    let maxSerial = 0;
    for (const o of currentOrders) {
      const num = parseInt(o.id.slice(1), 10);
      if (!isNaN(num) && num > maxSerial) {
        maxSerial = num;
      }
    }
    return Math.max(currentOrders.length, maxSerial) + 1;
  };

  const placeOrder = (orderData: PlaceOrderInput): Order => {
    const newId = generateOrderId(orderData.connectionType, nextOrderIdSerial());
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const bulkConnectionsCount = Math.max(1, Math.floor(orderData.bulkConnectionsCount ?? 50));

    const newOrder: Order = {
      ...orderData,
      bulkConnectionsCount,
      bulkDiscountPercent: getBulkDiscountPercent(bulkConnectionsCount),
      id: newId,
      status: 'Pending',
      createdAt: `${dateStr} ${timeStr}`,
      cableDistanceMeters: Math.floor(60 + Math.random() * 400),
      dpBoxCapacity: 'Port available / DP-Scan',
      signalLossDbm: Number(-(14 + Math.random() * 8).toFixed(1)),
    };

    orders.update((prev) => [newOrder, ...prev]);
    return newOrder;
  };

  // Account ID serial: next strictly increasing number across all connections and orders
  const nextAccountIdSerial = (): number => {
    let maxSerial = 0;
    const checkSerial = (rawId: string | undefined) => {
      if (!rawId) return;
      const clean = accountIdKey(rawId);
      // Format: [type(1)][city(3)][serial(12)] -> last 12 digits
      if (clean.length >= 16) {
        const serialNum = parseInt(clean.slice(4), 10);
        if (!isNaN(serialNum) && serialNum > maxSerial) {
          maxSerial = serialNum;
        }
      }
    };
    get(connections).forEach((c) => checkSerial(c.accountId));
    get(orders).forEach((o) => checkSerial(o.assignedAccountId));
    return Math.max(get(connections).length, maxSerial) + 1;
  };

  const cityCodeForOrder = (ord: Order): string => {
    const shop = get(retailShops).find((s) => s.shopCode === ord.retailOutletCode);
    return shop?.cityCode ?? '064';
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
          // line is feasible â€” it is the customer's only sign-in credential.
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

    const existingForOrder = get(connections).filter((c) => c.orderId === orderId);
    const nextIndex = existingForOrder.length + 1;
    const totalRequired = Math.max(1, order.bulkConnectionsCount || 1);

    // If order.assignedAccountId exists and hasn't been taken by an existing connection yet, use it for Line #1;
    // otherwise generate a brand new unique Account ID for each subsequent connection.
    const isFirstIdAvailable =
      order.assignedAccountId &&
      !get(connections).some((c) => c.accountId === order.assignedAccountId);

    const newAccountId = isFirstIdAvailable
      ? order.assignedAccountId!
      : generateAccountId(order.connectionType, cityCodeForOrder(order), nextAccountIdSerial());

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const device = get(equipments).find((eq) => eq.serialNumber === assignedDeviceSerial);

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
      portNumber: `ETH-PORT-${nextIndex}`,
      assignedDeviceSerial,
      assignedDeviceModel: device?.deviceModel || 'Nexus Standard CPE',
      installedDate: dateStr,
      lastUpdated: `${dateStr} ${timeStr}`,
    };

    // Mark order as fulfilled only when ALL required bulk connections have been provisioned!
    const isAllFulfilled = nextIndex >= totalRequired;

    orders.update((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: isAllFulfilled ? 'Connection Provided' : o.status,
              assignedAccountId: o.assignedAccountId || newAccountId,
            }
          : o
      )
    );

    connections.update((prev) => [newConnection, ...prev]);

    // Bind equipment to this specific connection (1 connection = 1 router)
    if (assignedDeviceSerial) {
      equipments.update((prev) =>
        prev.map((eq) =>
          eq.serialNumber === assignedDeviceSerial
            ? {
                ...eq,
                status: 'In Service',
                assignedAccountId: newAccountId,
                assignedCustomerName: totalRequired > 1
                  ? `${order.customerName} (Line #${nextIndex})`
                  : order.customerName,
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

    // SPEC: "Chá»‰ postpaid: bill Ä‘Æ°á»£c sinh ra, vÃ  tráº¡ng thÃ¡i káº¿t ná»‘i phá»¥ thuá»™c vÃ o bill"
    // When bill is settled in full, automatically restore any Temporarily Inactive connection to Active.
    if (updatedBill && (updatedBill as Bill).status === 'Paid') {
      const targetAcc = (updatedBill as Bill).accountId;
      const now = new Date();
      const stamp = `${now.toISOString().slice(0, 10)} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      connections.update((prev) =>
        prev.map((conn) =>
          accountIdKey(conn.accountId) === accountIdKey(targetAcc) && conn.status === 'Temporarily Inactive'
            ? {
                ...conn,
                status: 'Active' as ConnectionStatus,
                lastUpdated: stamp,
                lastStatusReason: `CÃ´ng ná»£ hÃ³a Ä‘Æ¡n ${(updatedBill as Bill).invoiceNumber} Ä‘Ã£ Ä‘Æ°á»£c thanh toÃ¡n toÃ n bá»™ â€” Tá»± Ä‘á»™ng kÃ­ch hoáº¡t láº¡i Ä‘Æ°á»ng truyá»n`,
              }
            : conn
        )
      );
    }

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

  // ---- ASP.NET Core Web API & SQL Server Sync ----
  const syncWithDatabase = async (): Promise<boolean> => {
    isSyncing.set(true);
    try {
      // 1. Thá»­ gá»i trá»±c tiáº¿p cÃ¡c REST API cá»§a ASP.NET Core
      try {
        const [apiPlans, apiEmployees, apiShops, apiVendors, apiInventory] = await Promise.allSettled([
          planService.getPlans(),
          employeeService.getEmployees(),
          retailShopService.getRetailShops(),
          vendorService.getVendors(),
          inventoryService.getInventory(),
        ]);

        let hasApiData = false;

        if (apiPlans.status === 'fulfilled' && Array.isArray(apiPlans.value) && apiPlans.value.length > 0) {
          plans.set(apiPlans.value);
          hasApiData = true;
        }
        if (apiEmployees.status === 'fulfilled' && Array.isArray(apiEmployees.value) && apiEmployees.value.length > 0) {
          employees.set(apiEmployees.value);
          hasApiData = true;
        }
        if (apiShops.status === 'fulfilled' && Array.isArray(apiShops.value) && apiShops.value.length > 0) {
          retailShops.set(apiShops.value);
          hasApiData = true;
        }
        if (apiVendors.status === 'fulfilled' && Array.isArray(apiVendors.value) && apiVendors.value.length > 0) {
          vendors.set(apiVendors.value);
          hasApiData = true;
        }
        if (apiInventory.status === 'fulfilled' && Array.isArray(apiInventory.value) && apiInventory.value.length > 0) {
          inventory.set(apiInventory.value);
          hasApiData = true;
        }

        if (hasApiData) {
          dbConnected.set(true);
          const currentPlans = get(plans);
          const currentOrders = get(orders);
          dbInfo.set({
            status: 'Connected',
            server: 'ASP.NET Core Web API (http://localhost:5105)',
            database: 'NexusSystem',
            tableCount: 14,
            planCount: currentPlans.length,
            orderCount: currentOrders ? currentOrders.length : 0,
          });
          console.log('[Nexus] Successfully connected to ASP.NET Core API at http://localhost:5105');
          return true;
        }
      } catch (apiErr) {
        console.warn('[Nexus] ASP.NET Core API not reachable, trying SQL bridge fallback:', apiErr);
      }

      // 2. Fallback sang Vite SQL Server bridge middleware (/api/nexus/all)
      const res = await fetch('/api/nexus/all');
      if (res.ok) {
        const data = await res.json();
        if (data && data.plans && data.plans.length > 0) {
          plans.set(data.plans);
          if (data.retailShops && data.retailShops.length > 0) retailShops.set(data.retailShops);
          if (data.employees && data.employees.length > 0) employees.set(data.employees);
          if (data.vendors && data.vendors.length > 0) vendors.set(data.vendors);
          if (data.inventory && data.inventory.length > 0) inventory.set(data.inventory);
          if (data.orders && data.orders.length > 0) orders.set(data.orders);
          if (data.connections && data.connections.length > 0) connections.set(data.connections);
          if (data.equipments && data.equipments.length > 0) equipments.set(data.equipments);
          if (data.bills && data.bills.length > 0) bills.set(data.bills);
          if (data.feedbacks && data.feedbacks.length > 0) feedbacks.set(data.feedbacks);
          if (data.settings) settings.set(data.settings);

          dbConnected.set(true);
          dbInfo.set({
            status: 'Connected',
            server: data.server || '(localdb)\\MSSQLLocalDB',
            database: data.database || 'NexusSystem',
            tableCount: 14,
            planCount: data.plans.length,
            orderCount: data.orders ? data.orders.length : 7,
          });
          console.log('[Nexus] Successfully hydrated state from Microsoft SQL Server [NexusSystem]');
          return true;
        }
      }
    } catch (err) {
      console.warn('[Nexus] Could not reach backend API or SQL Server bridge, using local storage state:', err);
    } finally {
      isSyncing.set(false);
    }
    return false;
  };

  // Auto-trigger sync on browser startup
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      syncWithDatabase();
    }, 150);
  }

  // ---- Settings Handlers ----
  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    settings.update((prev) => ({ ...prev, ...newSettings }));
  };

  return {
    currentRole,
    dbConnected,
    dbInfo,
    isSyncing,
    syncWithDatabase,
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
    updateRetailShop,
    deleteRetailShop,
    updateInventoryStock,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
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



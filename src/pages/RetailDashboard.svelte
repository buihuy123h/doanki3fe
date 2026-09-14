<script lang="ts">
  // Mirrors pages/RetailDashboard.tsx of the React original.
  // NOTE: the React source declares duplicate navItems (hardcoded VI + i18n);
  // here we keep only the i18n entries (intended behavior).
  import { nexusStore } from "../context/NexusContext";
  import { languageStore } from "../context/LanguageContext";
  import DashboardLayout from "../components/layout/DashboardLayout.svelte";
  import SettingsView from "../components/common/SettingsView.svelte";
  import ProfileView from "../components/common/ProfileView.svelte";
  import type { NavItem } from "../components/layout/DashboardLayout.svelte";
  import {
    ShoppingBag,
    Search,
    CheckCircle2,
    Clock,
    Wifi,
    Radio,
    Phone,
    FileText,
    CreditCard,
    User,
    Copy,
    Receipt,
    ArrowRight,
    Sparkles,
    Plus,
    Settings,
    X,
    ChevronDown,
    ChevronUp,
    Filter,
    AlertTriangle,
    XCircle,
    Server,
    HardDrive,
    Activity,
    RefreshCw,
  } from "lucide-svelte";
  import type {
    ConnectionType,
    ConnectionStatus,
    Connection,
    Order,
    Bill,
    PaymentRecord,
  } from "../types/nexus";
  import { getBulkDiscountPercent } from "../context/NexusContext";
  import { toast } from "svelte-sonner";
  import { queryParam, activeTabOverride } from "../lib/router";
  import {
    getPlanName,
    getPlanDescription,
    getPlanSpeedOrBandwidth,
  } from "../lib/planI18n";

  type RetailTab =
    | "new-order"
    | "order-tracking"
    | "connection-details"
    | "payment-records"
    | "settings"
    | "profile";

  const { plans, placeOrder, orders, connections, bills, recordPayment } =
    nexusStore;
  const { t, language } = languageStore;

  // Active navigation tab
  let activeTab = $state<RetailTab>("new-order");

  // Reactively respond to tab overrides from router / notifications
  $effect(() => {
    const override = $activeTabOverride;
    const validTabs: RetailTab[] = [
      "new-order",
      "order-tracking",
      "connection-details",
      "payment-records",
      "settings",
      "profile",
    ];
    if (override && override.path === "/retail") {
      if (validTabs.includes(override.tab as RetailTab)) {
        activeTab = override.tab as RetailTab;
      }
    } else {
      const qTab = queryParam("tab");
      if (qTab && validTabs.includes(qTab as RetailTab)) {
        activeTab = qTab as RetailTab;
      }
    }
  });

  // FORM STATE: PLACE ORDER
  let customerName = $state("");
  let customerPhone = $state("");
  let customerEmail = $state("");
  let installationAddress = $state("");
  let idProofType = $state<Order["idProofType"]>("National ID Card");
  let idProofNumber = $state("");
  let connectionType = $state<ConnectionType>("Broadband");
  let selectedPlanId = $state("");
  // Bulk / corporate scheme + Dial-Up existing landline (default 50 connections = 50 routers)
  let bulkConnectionsCount = $state(50);
  let hasExistingLandline = $state(false);
  let existingLandlineAccountId = $state("");
  const bulkDiscountPercent = $derived(
    getBulkDiscountPercent(bulkConnectionsCount),
  );

  // Success Modal for newly generated Order
  let placedOrder = $state<Order | null>(null);

  // STATE: ORDER TRACKING (11-char Order ID) — matching Technical Registry pattern
  let orderSearchQuery = $state("");
  let orderStatusFilter = $state<"All" | Order["status"]>("All");
  let orderTypeFilter = $state<"All" | ConnectionType>("All");
  let expandedOrderId = $state<string | null>("D0000000001");

  const filteredTrackedOrders = $derived(
    $orders.filter((o) => {
      const q = orderSearchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
        o.customerEmail.toLowerCase().includes(q) ||
        o.installationAddress.toLowerCase().includes(q) ||
        (o.assignedAccountId && o.assignedAccountId.toLowerCase().includes(q));
      const matchesStatus =
        orderStatusFilter === "All" || o.status === orderStatusFilter;
      const matchesType =
        orderTypeFilter === "All" || o.connectionType === orderTypeFilter;
      return matchesSearch && matchesStatus && matchesType;
    }),
  );

  const toggleOrderDropdown = (orderId: string) => {
    if (expandedOrderId === orderId) {
      expandedOrderId = null;
    } else {
      expandedOrderId = orderId;
    }
  };

  const handleQuickTrackOrder = () => {
    const q = orderSearchQuery.trim().toLowerCase();
    if (!q) {
      toast.info(
        $language === "vi"
          ? "Vui lòng nhập Mã đơn hoặc tên khách hàng."
          : "Please enter an Order ID or customer name.",
      );
      return;
    }
    const found = $orders.find(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q),
    );
    if (found) {
      expandedOrderId = found.id;
      toast.success(
        $language === "vi"
          ? `Đã mở chi tiết đơn hàng #${found.id}`
          : `Opened details for Order #${found.id}`,
      );
    } else {
      toast.error(
        $language === "vi"
          ? "Không tìm thấy đơn hàng phù hợp."
          : "Order not found in registry.",
      );
    }
  };

  // STATE: CONNECTION DETAILS (16-char Account ID) — matching Technical Registry pattern
  let connSearchQuery = $state("");
  let connStatusFilter = $state<"All" | string>("All");
  let connTypeFilter = $state<"All" | string>("All");
  let expandedConnAccountId = $state<string | null>("T064-000000000001");

  const filteredTrackedConnections = $derived(
    $connections.filter((c) => {
      const q = connSearchQuery.trim().toLowerCase();
      const cleanQ = q.replace(/-/g, "");
      const matchesSearch =
        !q ||
        c.accountId.toLowerCase().includes(q) ||
        c.accountId.replace(/-/g, "").toLowerCase().includes(cleanQ) ||
        c.customerName.toLowerCase().includes(q) ||
        c.customerPhone.replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
        c.customerEmail.toLowerCase().includes(q) ||
        c.installationAddress.toLowerCase().includes(q) ||
        (c.portNumber && c.portNumber.toLowerCase().includes(q)) ||
        (c.assignedDeviceSerial && c.assignedDeviceSerial.toLowerCase().includes(q)) ||
        (c.ipAddress && c.ipAddress.toLowerCase().includes(q));
      const matchesStatus =
        connStatusFilter === "All" || c.status === connStatusFilter;
      const matchesType =
        connTypeFilter === "All" || c.connectionType === connTypeFilter;
      return matchesSearch && matchesStatus && matchesType;
    }),
  );

  const toggleConnDropdown = (accountId: string) => {
    if (expandedConnAccountId === accountId) {
      expandedConnAccountId = null;
    } else {
      expandedConnAccountId = accountId;
    }
  };

  const handleQuickTrackConnection = () => {
    const q = connSearchQuery.trim().replace(/-/g, "").toLowerCase();
    if (!q) {
      toast.info(
        $language === "vi"
          ? "Vui lòng nhập Mã tài khoản hoặc tên khách hàng."
          : "Please enter an Account ID or customer name.",
      );
      return;
    }
    const found = $connections.find(
      (c) =>
        c.accountId.replace(/-/g, "").toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(connSearchQuery.trim().toLowerCase()),
    );
    if (found) {
      expandedConnAccountId = found.accountId;
      toast.success(
        $language === "vi"
          ? `Đã mở chi tiết hồ sơ tài khoản #${found.accountId}`
          : `Retrieved connection profile #${found.accountId}`,
      );
    } else {
      toast.error(
        $language === "vi"
          ? "Không tìm thấy Mã tài khoản trong hệ thống."
          : "Account ID not found in connection registry.",
      );
    }
  };

  // STATE: PAYMENT RECORDS SEARCH
  let paymentAccountQuery = $state("");

  // Payment Modal State for Retail Counter (Cập nhật lịch sử thanh toán vào hệ thống)
  let isPaymentModalOpen = $state(false);
  let targetBillForPayment = $state<Bill | null>(null);
  let retailPaymentAmount = $state(0);
  let retailPaymentMode = $state<PaymentRecord["paymentMode"]>("Cash");
  let retailPaymentRef = $state("");

  const handleOpenRetailPayment = (bill: Bill) => {
    targetBillForPayment = bill;
    retailPaymentAmount = bill.dueAmount;
    retailPaymentRef = `REC-POS-${Date.now().toString().slice(-6)}`;
    isPaymentModalOpen = true;
  };

  const handleConfirmRetailPayment = (e: SubmitEvent) => {
    e.preventDefault();
    if (!targetBillForPayment) return;
    if (retailPaymentAmount <= 0) {
      toast.error(
        $language === "vi"
          ? "Số tiền thanh toán phải lớn hơn 0."
          : "Payment amount must be greater than zero.",
      );
      return;
    }

    const updated = recordPayment(
      targetBillForPayment.invoiceNumber,
      retailPaymentAmount,
      retailPaymentMode,
      retailPaymentRef.trim() || `REC-POS-${Date.now().toString().slice(-6)}`,
      "Retail Counter Cashier",
    );

    if (updated) {
      toast.success(
        $language === "vi"
          ? `Đã cập nhật thanh toán $${retailPaymentAmount.toFixed(2)} cho hóa đơn ${updated.invoiceNumber}. Còn nợ: $${updated.dueAmount.toFixed(2)}`
          : `Payment of $${retailPaymentAmount.toFixed(2)} recorded for ${updated.invoiceNumber}. Remaining: $${updated.dueAmount.toFixed(2)}`,
      );
      isPaymentModalOpen = false;
      targetBillForPayment = null;
    }
  };

  // Due amount and bills helpers for connection search (Spec §9)
  const getConnectionDueAmount = (accId: string): number => {
    if (!accId) return 0;
    const cleanId = accId.replace(/-/g, "").toUpperCase();
    return $bills
      .filter((b) => b.accountId.replace(/-/g, "").toUpperCase() === cleanId)
      .reduce((sum, b) => sum + (b.dueAmount || 0), 0);
  };

  const totalDueAmountAllConnections = $derived(
    $connections.reduce(
      (sum, c) => sum + getConnectionDueAmount(c.accountId),
      0,
    ),
  );

  const getBillsForConnection = (accId: string): Bill[] => {
    if (!accId) return [];
    const cleanId = accId.replace(/-/g, "").toUpperCase();
    return $bills.filter(
      (b) => b.accountId.replace(/-/g, "").toUpperCase() === cleanId,
    );
  };

  // Filter available plans according to selected Connection Type
  const availablePlans = $derived(
    $plans.filter((p) => p.type === connectionType && p.status === "Active"),
  );
  const currentPlan = $derived(
    $plans.find((p) => p.id === selectedPlanId) || availablePlans[0],
  );

  // Default the plan to the first one available for the chosen connection type.
  $effect(() => {
    if (!availablePlans.some((p) => p.id === selectedPlanId)) {
      selectedPlanId = availablePlans[0]?.id ?? "";
    }
  });

  // FORM SUBMISSION LOGIC: PLACE ORDER
  const handlePlaceOrderSubmit = (e: SubmitEvent) => {
    e.preventDefault();

    if (
      !customerName.trim() ||
      !customerPhone.trim() ||
      !installationAddress.trim()
    ) {
      toast.error("Please enter all required customer information.");
      return;
    }

    if (!idProofNumber.trim()) {
      toast.error("Please enter customer ID proof verification number.");
      return;
    }

    if (!currentPlan) {
      toast.error("Please select an active service plan.");
      return;
    }

    const newOrder = placeOrder({
      customerName,
      customerPhone,
      customerEmail:
        customerEmail ||
        `${customerName.toLowerCase().replace(/\s+/g, ".")}@client.nexus`,
      installationAddress,
      idProofType,
      idProofNumber,
      connectionType,
      planId: currentPlan.id,
      planName: currentPlan.name,
      retailOutletCode: "SH-01",
      retailEmployeeName: "David Chen",
      bulkConnectionsCount: Math.max(1, bulkConnectionsCount || 50),
      ...(connectionType === "Dial-Up" &&
      hasExistingLandline &&
      existingLandlineAccountId.trim()
        ? { existingLandlineAccountId: existingLandlineAccountId.trim() }
        : {}),
    });

    placedOrder = newOrder;
    toast.success(`Order ${newOrder.id} successfully created!`);

    // Reset Form for next retail customer
    customerName = "";
    customerPhone = "";
    customerEmail = "";
    installationAddress = "";
    idProofNumber = "";
    bulkConnectionsCount = 50;
    hasExistingLandline = false;
    existingLandlineAccountId = "";
  };

  // ORDER TRACKING SEARCH HANDLER
  const handleSearchOrder = (idToSearch?: string) => {
    const targetId = (idToSearch || orderSearchQuery).trim().toUpperCase();
    const found = $orders.find((o) => o.id.toUpperCase() === targetId);
    if (found) {
      orderSearchQuery = found.id;
      expandedOrderId = found.id;
      toast.success(`Found Order ${found.id}`);
    } else {
      toast.error(
        `No order found matching ID "${targetId}". Must be an 11-character ID (e.g. D0000000001)`,
      );
    }
  };

  // CONNECTION DETAILS SEARCH HANDLER
  const handleSearchConnection = (idToSearch?: string) => {
    const targetId = (idToSearch || connSearchQuery).trim();
    const cleanTarget = targetId.replace(/-/g, "").toUpperCase();
    const found = $connections.find(
      (c) => c.accountId.replace(/-/g, "").toUpperCase() === cleanTarget,
    );
    if (found) {
      connSearchQuery = found.accountId;
      expandedConnAccountId = found.accountId;
      toast.success(`Retrieved Account ${found.accountId}`);
    } else {
      toast.error(`No connection found for Account ID "${targetId}"`);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label}: ${text}`);
  };

  // Calculate order progress index
  const getStageIndex = (status: Order["status"]) => {
    switch (status) {
      case "Pending":
        return 1;
      case "Feasible":
        return 2;
      case "Connection Provided":
        return 4;
      case "Not Feasible":
        return -1;
      default:
        return 1;
    }
  };

  const selectConnectionType = (type: ConnectionType) => {
    connectionType = type;
    // Auto select first plan of this type
    const firstPlan = $plans.find((p) => p.type === type);
    if (firstPlan) selectedPlanId = firstPlan.id;
  };

  const fillDemoCustomer = () => {
    customerName = "Eleanor Vance";
    customerPhone = "+1 (555) 712-4490";
    customerEmail = "eleanor.vance@brooklynart.org";
    installationAddress = "240 Bedford Ave, Apt 3A, Williamsburg, NY 11211";
    idProofType = "National ID Card";
    idProofNumber = "ID-NY-9920194";
    connectionType = "Broadband";
    selectedPlanId =
      $plans.find((p) => p.type === "Broadband" && p.status === "Active")?.id ??
      "";
    toast.info("Form pre-filled with demo walk-in customer data");
  };

  const trackThisOrder = () => {
    const id = placedOrder!.id;
    placedOrder = null;
    activeTab = "order-tracking";
    orderSearchQuery = id;
    expandedOrderId = id;
  };

  const connectionTypeCards: {
    type: ConnectionType;
    icon: typeof Wifi;
    desc: string;
    descVi: string;
    labelVi: string;
  }[] = [
    {
      type: "Broadband",
      icon: Wifi,
      desc: "High-Speed Fiber FTTH",
      descVi: "Cáp quang tốc độ cao FTTH",
      labelVi: "Cáp quang (Broadband)",
    },
    {
      type: "Dial-Up",
      icon: Radio,
      desc: "56k Analog PSTN Modem",
      descVi: "Modem quay số tương tự 56k",
      labelVi: "Quay số (Dial-Up)",
    },
    {
      type: "Landline",
      icon: Phone,
      desc: "Fixed Voice / VoIP Phone",
      descVi: "Điện thoại cố định / Thoại VoIP",
      labelVi: "Cố định (Landline)",
    },
  ];

  const stepperStages = [
    {
      step: 1,
      label: "Order Logged",
      labelVi: "Đã ghi nhận đơn",
      sub: "Retail Counter",
      subVi: "Quầy bán lẻ",
    },
    {
      step: 2,
      label: "Feasibility Checked",
      labelVi: "Kiểm tra khả thi",
      sub: "Field Telemetry",
      subVi: "Đo lường hiện trường",
    },
    {
      step: 3,
      label: "Tech Dispatch",
      labelVi: "Điều phối kỹ thuật",
      sub: "CPE & Port Bind",
      subVi: "Gắn cổng & CPE",
    },
    {
      step: 4,
      label: "Connection Live",
      labelVi: "Đường truyền hoạt động",
      sub: "16-char Account",
      subVi: "Mã tài khoản 16 ký tự",
    },
  ];

  const retailNavItems: NavItem[] = $derived([
    { id: "new-order", label: $t.retailNav.newOrder, icon: ShoppingBag },
    {
      id: "order-tracking",
      label: $t.retailNav.orderTracking,
      icon: Clock,
      badge: $orders.length,
    },
    {
      id: "connection-details",
      label: $t.retailNav.connectionDetails,
      icon: Wifi,
      badge: $connections.length,
    },
    {
      id: "payment-records",
      label: $t.retailNav.paymentRecords,
      icon: CreditCard,
      badge: $bills.length,
    },
    { id: "settings", label: $t.retailNav.settings, icon: Settings },
  ]);
</script>

<DashboardLayout
  {activeTab}
  onTabChange={(tab) => (activeTab = tab as RetailTab)}
  navItems={retailNavItems}
  roleBadgeTitle={$t.roles.retail}
  pageTitle={retailNavItems.find((n) => n.id === activeTab)?.label}
  primaryAction={{
    label: $t.actions.newOrder,
    onClick: () => (activeTab = "new-order"),
    icon: Plus,
  }}
>
  <!-- TAB 1: PLACE ORDER FORM -->
  {#if activeTab === "new-order"}
    <div class="tab-content-animate grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Place Order Form -->
      <form
        onsubmit={handlePlaceOrderSubmit}
        class="lg:col-span-2 space-y-6 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
      >
        <!-- SECTION A: Customer Personal Details -->
        <div>
          <div
            class="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-2 mb-4"
          >
            <User class="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3
              class="font-semibold text-sm uppercase tracking-wider text-slate-900 dark:text-white"
            >
              {$language === "vi"
                ? "Bước 1: Thông tin cá nhân khách hàng"
                : "Step 1: Customer Personal Details"}
            </h3>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                {$language === "vi"
                  ? "Họ và tên đầy đủ *"
                  : "Full Legal Name *"}
              </label>
              <input
                type="text"
                required
                placeholder={$language === "vi"
                  ? "Ví dụ: Nguyễn Văn Nam"
                  : "e.g. Julian Thorne"}
                bind:value={customerName}
                class="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label
                class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                {$language === "vi"
                  ? "Số điện thoại liên hệ *"
                  : "Contact Phone *"}
              </label>
              <input
                type="tel"
                required
                placeholder={$language === "vi"
                  ? "+84 912 345 678"
                  : "+1 (555) 000-0000"}
                bind:value={customerPhone}
                class="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label
                class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                {$language === "vi"
                  ? "Địa chỉ Email (Tùy chọn)"
                  : "Email Address (Optional)"}
              </label>
              <input
                type="email"
                placeholder="nam.nguyen@example.com"
                bind:value={customerEmail}
                class="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label
                class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                {$language === "vi"
                  ? "Giấy tờ tùy thân xác thực *"
                  : "Identity Proof Document *"}
              </label>
              <div class="grid grid-cols-2 gap-2">
                <select
                  bind:value={idProofType}
                  class="px-2 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="National ID Card"
                    >{$language === "vi"
                      ? "CCCD / CMND"
                      : "National ID"}</option
                  >
                  <option value="Passport"
                    >{$language === "vi" ? "Hộ chiếu" : "Passport"}</option
                  >
                  <option value="Driver's License"
                    >{$language === "vi"
                      ? "Giấy phép lái xe"
                      : "Driver's Lic."}</option
                  >
                </select>
                <input
                  type="text"
                  required
                  placeholder={$language === "vi"
                    ? "Số giấy tờ #"
                    : "Document #"}
                  bind:value={idProofNumber}
                  class="px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div class="sm:col-span-2">
              <label
                class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                {$language === "vi"
                  ? "Địa chỉ lắp đặt thực tế *"
                  : "Physical Installation Address *"}
              </label>
              <input
                type="text"
                required
                placeholder={$language === "vi"
                  ? "Số nhà, đường phố, phường/xã, quận/huyện, tỉnh/thành phố"
                  : "Street address, Apt/Suite, City, Postal Code"}
                bind:value={installationAddress}
                class="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        <!-- SECTION B: Connection Type Selection -->
        <div>
          <div
            class="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-2 mb-4"
          >
            <Wifi class="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3
              class="font-semibold text-sm uppercase tracking-wider text-slate-900 dark:text-white"
            >
              {$language === "vi"
                ? "Bước 2: Loại kết nối mạng"
                : "Step 2: Connection Type"}
            </h3>
          </div>

          <div class="grid grid-cols-3 gap-3">
            {#each connectionTypeCards as item (item.type)}
              {@const isSelected = connectionType === item.type}
              <button
                type="button"
                onclick={() => selectConnectionType(item.type)}
                class="p-3 rounded-xl border text-left transition flex flex-col justify-between {isSelected
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-slate-900 dark:text-white ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'}"
              >
                <div class="flex items-center justify-between mb-2">
                  <item.icon
                    class="h-5 w-5 {isSelected
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400'}"
                  />
                  {#if isSelected}
                    <CheckCircle2
                      class="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                    />
                  {/if}
                </div>
                <div>
                  <div class="font-bold text-sm">
                    {$language === "vi" ? item.labelVi : item.type}
                  </div>
                  <div class="text-[11px] text-slate-500 dark:text-slate-400">
                    {$language === "vi" ? item.descVi : item.desc}
                  </div>
                </div>
              </button>
            {/each}
          </div>
        </div>

        <!-- SECTION C: Plan Selection -->
        <div>
          <div
            class="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-2 mb-4"
          >
            <FileText class="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3
              class="font-semibold text-sm uppercase tracking-wider text-slate-900 dark:text-white"
            >
              {$language === "vi"
                ? `Bước 3: Chọn gói cước (${connectionType === "Broadband" ? "Cáp quang" : connectionType === "Dial-Up" ? "Quay số" : "Cố định"})`
                : `Step 3: Plan Selection (${connectionType})`}
            </h3>
          </div>

          <div class="space-y-2">
            {#each availablePlans as plan (plan.id)}
              {@const isSelected = selectedPlanId === plan.id}
              <div
                onclick={() => (selectedPlanId = plan.id)}
                class="p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between {isSelected
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-1 ring-emerald-500'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'}"
              >
                <div class="space-y-1">
                  <div class="flex items-center space-x-2">
                    <span
                      class="font-semibold text-sm text-slate-900 dark:text-white"
                      >{getPlanName(plan, $language)}</span
                    >
                    <span
                      class="text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono"
                    >
                      {getPlanSpeedOrBandwidth(
                        plan.speedOrBandwidth,
                        $language,
                      )}
                    </span>
                  </div>
                  <p class="text-xs text-slate-500 dark:text-slate-400">
                    {getPlanDescription(plan, $language)}
                  </p>
                </div>

                <div class="text-right shrink-0 pl-4">
                  <div
                    class="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono"
                  >
                    ${plan.monthlyRental.toFixed(2)}<span
                      class="text-xs font-normal text-slate-400"
                      >/{$language === "vi" ? "th" : "mo"}</span
                    >
                  </div>
                  <div class="text-[11px] text-slate-400 font-mono">
                    {$language === "vi" ? "Cọc:" : "Deposit:"} ${plan.securityDeposit.toFixed(
                      2,
                    )}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- SECTION D: Bulk scheme & Dial-Up existing landline -->
        <div>
          <div
            class="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-2 mb-4"
          >
            <FileText class="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3
              class="font-semibold text-sm uppercase tracking-wider text-slate-900 dark:text-white"
            >
              {$language === "vi"
                ? `Bước 4: Gói doanh nghiệp${connectionType === "Dial-Up" ? " & Đường dây cố định" : ""}`
                : `Step 4: Bulk Scheme${connectionType === "Dial-Up" ? " & Landline" : ""}`}
            </h3>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                {$language === "vi"
                  ? "Số lượng kết nối (mặc định 50 kết nối / 50 router thiết bị)"
                  : "Number of connections (default 50 connections / 50 routers)"}
              </label>
              <input
                type="number"
                min="1"
                bind:value={bulkConnectionsCount}
                class="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p class="text-[11px] text-slate-500 mt-1">
                {bulkDiscountPercent > 0
                  ? `${$language === "vi" ? "1 connection = 1 router thiết bị · Chiết khấu" : "1 connection = 1 router device · Scheme discount"}: −${bulkDiscountPercent}% ${$language === "vi" ? "(cước ứng trước + tiền cọc)" : "(advance + deposit)"}`
                  : $language === "vi"
                    ? "1 connection = 1 router thiết bị. Mặc định 50 kết nối (chiết khấu 75%)."
                    : "1 connection = 1 router device. Default 50 lines (75% discount)."}
              </p>
            </div>
            {#if connectionType === "Dial-Up"}
              <div>
                <label
                  class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  {$language === "vi"
                    ? "Đã có landline Nexus?"
                    : "Existing Nexus landline?"}
                </label>
                <label
                  class="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-300 py-1.5"
                >
                  <input
                    type="checkbox"
                    bind:checked={hasExistingLandline}
                    class="h-4 w-4 rounded"
                  />
                  <span
                    >{$language === "vi"
                      ? "Chỉ kiểm tra khả thi phần internet"
                      : "Only the internet leg needs a feasibility check"}</span
                  >
                </label>
                {#if hasExistingLandline}
                  <input
                    type="text"
                    placeholder={$language === "vi"
                      ? "Mã tài khoản landline (nếu có)"
                      : "Landline Account ID (optional)"}
                    bind:value={existingLandlineAccountId}
                    class="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                {/if}
              </div>
            {/if}
          </div>
        </div>

        <!-- Submit Action -->
        <div
          class="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between"
        >
          <div class="text-xs text-slate-500 max-w-md">
            {$language === "vi"
              ? "Khi gửi đơn, hệ thống sẽ cấp Mã đơn hàng 11 ký tự (D/B/T + sê-ri) và chuyển đến đội Kỹ thuật kiểm tra khả thi."
              : "Submitting generates an official 11-character Order ID (D/B/T + serial) and routes to Tech Feasibility."}
          </div>
          <button
            type="submit"
            class="px-6 py-2.5 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-md flex items-center space-x-2"
          >
            <span
              >{$language === "vi"
                ? "Tạo đơn & Cấp mã"
                : "Place Order & Generate ID"}</span
            >
            <ArrowRight class="h-4 w-4" />
          </button>
        </div>
      </form>

      <!-- Order Summary & Fast Entry Assist -->
      <div class="space-y-4">
        <div
          class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4"
        >
          <h3
            class="font-semibold text-sm uppercase tracking-wider text-slate-900 dark:text-white flex items-center space-x-2"
          >
            <Receipt class="h-4 w-4 text-emerald-500" />
            <span
              >{$language === "vi"
                ? "Tóm tắt chi phí đơn hàng"
                : "Order Cost Summary"}</span
            >
          </h3>

          {#if currentPlan}
            {@const base =
              currentPlan.monthlyRental + currentPlan.securityDeposit}
            {@const disc = (base * bulkDiscountPercent) / 100}
            {@const taxed = (base - disc) * 1.1224}
            <div class="space-y-3 text-xs">
              <div
                class="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2"
              >
                <div class="flex justify-between">
                  <span class="text-slate-500"
                    >{$language === "vi"
                      ? "Gói cước đã chọn:"
                      : "Selected Plan:"}</span
                  >
                  <span
                    class="font-semibold text-slate-900 dark:text-white text-right"
                    >{getPlanName(currentPlan, $language)}</span
                  >
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500"
                    >{$language === "vi" ? "Băng thông:" : "Bandwidth:"}</span
                  >
                  <span class="font-mono text-slate-700 dark:text-slate-300"
                    >{getPlanSpeedOrBandwidth(
                      currentPlan.speedOrBandwidth,
                      $language,
                    )}</span
                  >
                </div>
              </div>

              <div class="space-y-1.5 pt-1">
                <div
                  class="flex justify-between text-slate-600 dark:text-slate-400"
                >
                  <span
                    >{$language === "vi"
                      ? "Cước thuê tháng đầu:"
                      : "First Month Rental:"}</span
                  >
                  <span class="font-mono tabular-nums"
                    >${currentPlan.monthlyRental.toFixed(2)}</span
                  >
                </div>
                <div
                  class="flex justify-between text-slate-600 dark:text-slate-400"
                >
                  <span
                    >{$language === "vi"
                      ? "Tiền đặt cọc (hoàn lại):"
                      : "Refundable Security Deposit:"}</span
                  >
                  <span class="font-mono tabular-nums"
                    >${currentPlan.securityDeposit.toFixed(2)}</span
                  >
                </div>
                {#if bulkDiscountPercent > 0}
                  <div
                    class="flex justify-between text-emerald-600 dark:text-emerald-400"
                  >
                    <span>
                      {$language === "vi"
                        ? `Ưu đãi số lượng (${bulkConnectionsCount} kết nối) −${bulkDiscountPercent}%:`
                        : `Bulk scheme (${bulkConnectionsCount} conns) −${bulkDiscountPercent}%:`}
                    </span>
                    <span class="font-mono tabular-nums"
                      >−${disc.toFixed(2)}</span
                    >
                  </div>
                {/if}
                <div
                  class="flex justify-between text-slate-600 dark:text-slate-400"
                >
                  <span
                    >{$language === "vi"
                      ? "Thuế dịch vụ (12.24%):"
                      : "Est. Service Tax (12.24%):"}</span
                  >
                  <span class="font-mono tabular-nums"
                    >${(((base - disc) * 12.24) / 100).toFixed(2)}</span
                  >
                </div>
                <div
                  class="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between font-bold text-sm text-slate-900 dark:text-white"
                >
                  <span
                    >{$language === "vi"
                      ? "Tổng thanh toán tại quầy:"
                      : "Initial Due at Counter:"}</span
                  >
                  <span
                    class="font-mono text-emerald-600 dark:text-emerald-400 tabular-nums"
                  >
                    ${taxed.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          {:else}
            <div class="text-xs text-slate-400">
              {$language === "vi"
                ? "Vui lòng chọn một gói cước để xem chi tiết chi phí."
                : "Please select a plan to view cost breakdown."}
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}

  <!-- TAB 2: ORDER TRACKING -->
  {#if activeTab === "order-tracking"}
    <div class="space-y-6">
      <!-- 1. KPI Summary Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <!-- Total Orders -->
        <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div class="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>{$language === "vi" ? "Tổng số đơn hàng" : "Total Orders"}</span>
            <ShoppingBag class="h-3.5 w-3.5 text-slate-400" />
          </div>
          <div class="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1.5">
            {$orders.length}
            <span class="text-xs font-normal text-slate-400 ml-1">{$language === "vi" ? "đơn" : "orders"}</span>
          </div>
          <div class="text-[10px] text-slate-500 mt-1">
            {$language === "vi" ? "Cập nhật thời gian thực" : "Real-time sync"}
          </div>
        </div>

        <!-- Connection Provided -->
        <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/40 shadow-sm">
          <div class="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center justify-between">
            <span>{$language === "vi" ? "Đã cấp kết nối" : "Provided"}</span>
            <CheckCircle2 class="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <div class="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1.5">
            {$orders.filter((o) => o.status === "Connection Provided").length}
            <span class="text-xs font-normal text-emerald-600/70 ml-1">{$language === "vi" ? "hoàn tất" : "active"}</span>
          </div>
          <div class="text-[10px] text-emerald-600/80 dark:text-emerald-500 mt-1">
            {$language === "vi" ? "Đã phát hành Account ID" : "Account ID issued"}
          </div>
        </div>

        <!-- Feasible -->
        <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-900/40 shadow-sm">
          <div class="text-[11px] font-mono text-sky-600 dark:text-sky-400 uppercase tracking-wider flex items-center justify-between">
            <span>{$language === "vi" ? "Khảo sát khả thi" : "Feasible"}</span>
            <Activity class="h-3.5 w-3.5 text-sky-500" />
          </div>
          <div class="text-2xl font-bold font-mono text-sky-600 dark:text-sky-400 mt-1.5">
            {$orders.filter((o) => o.status === "Feasible").length}
            <span class="text-xs font-normal text-sky-600/70 ml-1">{$language === "vi" ? "khả thi" : "ready"}</span>
          </div>
          <div class="text-[10px] text-sky-600/80 dark:text-sky-500 mt-1">
            {$language === "vi" ? "Chờ kỹ thuật đấu nối" : "Ready for dispatch"}
          </div>
        </div>

        <!-- Pending -->
        <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 shadow-sm">
          <div class="text-[11px] font-mono text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center justify-between">
            <span>{$language === "vi" ? "Chờ xử lý" : "Pending"}</span>
            <Clock class="h-3.5 w-3.5 text-amber-500" />
          </div>
          <div class="text-2xl font-bold font-mono text-amber-700 dark:text-amber-400 mt-1.5">
            {$orders.filter((o) => o.status === "Pending").length}
            <span class="text-xs font-normal text-amber-600/70 ml-1">{$language === "vi" ? "chờ duyệt" : "queued"}</span>
          </div>
          <div class="text-[10px] text-amber-600/80 dark:text-amber-500 mt-1">
            {$language === "vi" ? "Chờ phân tích đo kiểm" : "Awaiting telemetry"}
          </div>
        </div>

        <!-- Not Feasible -->
        <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 shadow-sm col-span-2 sm:col-span-1">
          <div class="text-[11px] font-mono text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center justify-between">
            <span>{$language === "vi" ? "Không khả thi" : "Not Feasible"}</span>
            <XCircle class="h-3.5 w-3.5 text-rose-500" />
          </div>
          <div class="text-2xl font-bold font-mono text-rose-700 dark:text-rose-400 mt-1.5">
            {$orders.filter((o) => o.status === "Not Feasible").length}
            <span class="text-xs font-normal text-rose-600/70 ml-1">{$language === "vi" ? "từ chối" : "rejected"}</span>
          </div>
          <div class="text-[10px] text-rose-600/80 dark:text-rose-500 mt-1">
            {$language === "vi" ? "Vượt cự ly / Hết cổng" : "Distance / Out of ports"}
          </div>
        </div>
      </div>

      <!-- 2. Search & Filter Bar -->
      <div class="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div class="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <!-- Search input -->
          <div class="relative flex-1">
            <Search class="absolute left-3.5 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder={$language === "vi"
                ? "Tra cứu theo Mã đơn hàng (11 ký tự), tên khách hàng, SĐT, email, địa chỉ..."
                : "Search by 11-char Order ID, customer name, phone, email, address..."}
              bind:value={orderSearchQuery}
              class="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 font-mono"
            />
          </div>

          <div class="flex items-center gap-2">
            <button
              onclick={handleQuickTrackOrder}
              class="px-4 py-2.5 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow flex items-center justify-center space-x-1.5 whitespace-nowrap"
            >
              <ShoppingBag class="h-4 w-4" />
              <span>{$language === "vi" ? "Tra cứu & Mở chi tiết" : "Track & Open Details"}</span>
            </button>
          </div>
        </div>

        <!-- Filter rows: Status & Connection Type -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
          <!-- Status Filter Pills (Horizontal row) -->
          <div class="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap pb-1 max-w-full">
            <button
              onclick={() => (orderStatusFilter = "All")}
              class="px-2.5 py-1 text-xs font-medium rounded-lg transition {orderStatusFilter === 'All'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}"
            >
              {$language === "vi" ? "Tất cả" : "All"} ({$orders.length})
            </button>
            <button
              onclick={() => (orderStatusFilter = "Connection Provided")}
              class="px-2.5 py-1 text-xs font-medium rounded-lg transition {orderStatusFilter === 'Connection Provided'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}"
            >
              {$language === "vi" ? "Đã cấp kết nối" : "Provided"} ({$orders.filter((o) => o.status === "Connection Provided").length})
            </button>
            <button
              onclick={() => (orderStatusFilter = "Feasible")}
              class="px-2.5 py-1 text-xs font-medium rounded-lg transition {orderStatusFilter === 'Feasible'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}"
            >
              {$language === "vi" ? "Khảo sát khả thi" : "Feasible"} ({$orders.filter((o) => o.status === "Feasible").length})
            </button>
            <button
              onclick={() => (orderStatusFilter = "Pending")}
              class="px-2.5 py-1 text-xs font-medium rounded-lg transition {orderStatusFilter === 'Pending'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}"
            >
              {$language === "vi" ? "Chờ xử lý" : "Pending"} ({$orders.filter((o) => o.status === "Pending").length})
            </button>
            <button
              onclick={() => (orderStatusFilter = "Not Feasible")}
              class="px-2.5 py-1 text-xs font-medium rounded-lg transition {orderStatusFilter === 'Not Feasible'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}"
            >
              {$language === "vi" ? "Không khả thi" : "Not Feasible"} ({$orders.filter((o) => o.status === "Not Feasible").length})
            </button>
          </div>

          <!-- Connection Type Filter -->
          <div class="flex items-center space-x-2 text-xs">
            <span class="text-slate-500 dark:text-slate-400 whitespace-nowrap">
              {$language === "vi" ? "Loại kết nối:" : "Connection Type:"}
            </span>
            <select
              bind:value={orderTypeFilter}
              class="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
            >
              <option value="All">{$language === "vi" ? "Tất cả loại kết nối" : "All Types"}</option>
              <option value="Broadband">Broadband (Cáp quang)</option>
              <option value="Landline">Landline (Cố định)</option>
              <option value="Dial-Up">Dial-Up (Quay số)</option>
            </select>
          </div>
        </div>

        <!-- Fast Pick Tags -->
        <div class="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
          <span class="text-[11px]">{$language === "vi" ? "Mã đơn hàng mới nhất:" : "Latest Orders:"}</span>
          {#each $orders.slice(0, 8) as o (o.id)}
            <button
              onclick={() => {
                orderSearchQuery = o.id;
                expandedOrderId = o.id;
              }}
              class="px-2 py-0.5 rounded border transition font-semibold text-[11px] {expandedOrderId === o.id
                ? 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-400 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-400'
                : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-400'}"
            >
              {o.id}
            </button>
          {/each}
        </div>
      </div>

      <!-- 3. Orders Table List with Dropdown Accordion -->
      <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div class="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/50">
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <ShoppingBag class="h-5 w-5 text-emerald-600" />
              <span>{$language === "vi" ? "Danh sách theo dõi tiến độ đơn hàng" : "Order Tracking & Fulfillment Registry"}</span>
              <span class="ml-2 px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                {filteredTrackedOrders.length} {$language === "vi" ? "đơn hàng" : "orders"}
              </span>
            </h3>
          </div>

          {#if expandedOrderId}
            <button
              onclick={() => (expandedOrderId = null)}
              class="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 transition bg-white dark:bg-slate-900 flex items-center gap-1 self-start sm:self-auto"
            >
              <X class="h-3.5 w-3.5" />
              <span>{$language === "vi" ? "Thu gọn tất cả chi tiết" : "Collapse All Details"}</span>
            </button>
          {/if}
        </div>

        {#if filteredTrackedOrders.length === 0}
          <div class="py-16 text-center space-y-3">
            <ShoppingBag class="h-10 w-10 text-slate-400 mx-auto opacity-50" />
            <div class="text-sm font-semibold text-slate-700 dark:text-slate-300 font-mono">
              {$language === "vi" ? "Không tìm thấy đơn hàng nào khớp với bộ lọc." : "No orders match the current filter criteria."}
            </div>
            <button
              onclick={() => {
                orderSearchQuery = "";
                orderStatusFilter = "All";
                orderTypeFilter = "All";
              }}
              class="px-4 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
            >
              {$language === "vi" ? "Đặt lại bộ lọc" : "Reset Filters"}
            </button>
          </div>
        {:else}
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm border-collapse">
              <thead class="bg-slate-50 dark:bg-slate-950/80 text-[11px] font-mono text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th class="px-4 py-3.5">{$language === "vi" ? "MÃ ĐƠN HÀNG" : "ORDER ID"}</th>
                  <th class="px-4 py-3.5">{$language === "vi" ? "KHÁCH HÀNG & ĐỊA CHỈ" : "CUSTOMER & ADDRESS"}</th>
                  <th class="px-4 py-3.5">{$language === "vi" ? "LOẠI KẾT NỐI & GÓI CƯỚC" : "CONNECTION & PLAN"}</th>
                  <th class="px-4 py-3.5">{$language === "vi" ? "ĐIỆN THOẠI & XÁC MINH" : "PHONE & ID PROOF"}</th>
                  <th class="px-4 py-3.5">{$language === "vi" ? "TRẠNG THÁI TIẾN ĐỘ" : "FULFILLMENT STATUS"}</th>
                  <th class="px-4 py-3.5 text-right">{$language === "vi" ? "THAO TÁC" : "ACTIONS"}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                {#each filteredTrackedOrders as o (o.id)}
                  {@const isExpanded = expandedOrderId === o.id}
                  <!-- Main Table Row -->
                  <tr
                    class="transition-colors hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 {isExpanded
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/30'
                      : ''}"
                  >
                    <!-- Col 1: Order ID -->
                    <td class="px-4 py-4 align-top">
                      <div class="flex items-center space-x-1.5">
                        <span class="font-mono font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                          {o.id}
                        </span>
                        <button
                          onclick={() => copyToClipboard(o.id, "Order ID")}
                          class="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                          title={$language === "vi" ? "Sao chép mã đơn" : "Copy Order ID"}
                        >
                          <Copy class="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div class="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                        {o.createdAt}
                      </div>
                    </td>

                    <!-- Col 2: Customer & Address -->
                    <td class="px-4 py-4 align-top">
                      <div class="font-semibold text-slate-900 dark:text-white">
                        {o.customerName}
                      </div>
                      <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {o.installationAddress}
                      </div>
                    </td>

                    <!-- Col 3: Connection & Plan -->
                    <td class="px-4 py-4 align-top">
                      <div class="flex items-center space-x-1.5">
                        {#if o.connectionType === "Broadband"}
                          <span class="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            <Wifi class="h-3 w-3" />
                            <span>Broadband</span>
                          </span>
                        {:else if o.connectionType === "Landline"}
                          <span class="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            <Phone class="h-3 w-3" />
                            <span>Landline</span>
                          </span>
                        {:else}
                          <span class="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Radio class="h-3 w-3" />
                            <span>Dial-Up</span>
                          </span>
                        {/if}
                      </div>
                      <div class="text-xs font-medium text-slate-800 dark:text-slate-200 mt-1">
                        {getPlanName({ name: o.planName }, $language)}
                      </div>
                    </td>

                    <!-- Col 4: Phone & ID Proof -->
                    <td class="px-4 py-4 align-top">
                      <div class="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {o.customerPhone}
                      </div>
                      <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[170px]">
                        {o.customerEmail}
                      </div>
                      <div class="text-[10px] text-slate-400 font-mono mt-0.5">
                        {o.idProofType}: {o.idProofNumber}
                      </div>
                    </td>

                    <!-- Col 5: Fulfillment Status -->
                    <td class="px-4 py-4 align-top">
                      <span
                        class="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider {o.status ===
                        'Connection Provided'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                          : o.status === 'Feasible'
                            ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-700'
                            : o.status === 'Not Feasible'
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'}"
                      >
                        <span
                          class="h-2 w-2 rounded-full {o.status === 'Connection Provided'
                            ? 'bg-emerald-500 animate-pulse'
                            : o.status === 'Feasible'
                              ? 'bg-sky-500'
                              : o.status === 'Not Feasible'
                                ? 'bg-rose-500'
                                : 'bg-amber-500'}"
                        ></span>
                        <span>
                          {$language === "vi"
                            ? o.status === "Connection Provided"
                              ? "Đã cấp kết nối"
                              : o.status === "Feasible"
                                ? "Khảo sát khả thi"
                                : o.status === "Not Feasible"
                                  ? "Không khả thi"
                                  : "Chờ xử lý"
                            : o.status}
                        </span>
                      </span>
                    </td>

                    <!-- Col 6: Action Button -->
                    <td class="px-4 py-4 align-top text-right whitespace-nowrap">
                      <button
                        onclick={() => toggleOrderDropdown(o.id)}
                        class="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs {isExpanded
                          ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-950 hover:text-emerald-800 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700'}"
                      >
                        <span>{$language === "vi" ? (isExpanded ? "Thu gọn" : "Chi tiết") : (isExpanded ? "Collapse" : "Details")}</span>
                        <ChevronDown
                          class="h-4 w-4 transition-transform duration-200 {isExpanded ? 'rotate-180' : ''}"
                        />
                      </button>
                    </td>
                  </tr>

                  <!-- DROPDOWN BOX CHI TIẾT TIẾN ĐỘ ĐƠN HÀNG -->
                  {#if isExpanded}
                    <tr class="bg-gradient-to-b from-emerald-50/50 to-slate-50 dark:from-emerald-950/20 dark:to-slate-950/40 border-b-2 border-emerald-400 dark:border-emerald-600/60">
                      <td colspan="6" class="p-4 sm:p-6">
                        <div class="space-y-6 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-md">
                          <!-- Box Header -->
                          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                            <div class="flex items-start sm:items-center space-x-3">
                              <div class="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                                <ShoppingBag class="h-6 w-6" />
                              </div>
                              <div>
                                <div class="flex items-center space-x-3">
                                  <h4 class="text-lg font-bold font-mono text-slate-900 dark:text-white">
                                    {$language === "vi" ? "Mã đơn hàng:" : "Order ID:"}
                                    <span class="text-emerald-600 dark:text-emerald-400 font-extrabold">{o.id}</span>
                                  </h4>
                                  <span
                                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider {o.status ===
                                    'Connection Provided'
                                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                                      : o.status === 'Feasible'
                                        ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-700'
                                        : o.status === 'Not Feasible'
                                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                                          : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'}"
                                  >
                                    {$language === "vi"
                                      ? o.status === "Connection Provided"
                                        ? "Đã cấp kết nối"
                                        : o.status === "Feasible"
                                          ? "Khảo sát khả thi"
                                          : o.status === "Not Feasible"
                                            ? "Không khả thi"
                                            : "Chờ xử lý"
                                      : o.status}
                                  </span>
                                </div>
                                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                  {$language === "vi"
                                    ? `Đăng ký lúc ${o.createdAt} bởi ${o.retailEmployeeName} (${o.retailOutletCode})`
                                    : `Submitted at ${o.createdAt} by ${o.retailEmployeeName} (${o.retailOutletCode})`}
                                </p>
                              </div>
                            </div>

                            <!-- Header Actions -->
                            <div class="flex flex-wrap items-center gap-2">
                              <button
                                onclick={() => copyToClipboard(o.id, "Order ID")}
                                class="inline-flex items-center space-x-1 text-xs border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition font-medium"
                              >
                                <Copy class="h-3.5 w-3.5" />
                                <span>{$language === "vi" ? "Sao chép mã đơn" : "Copy Order ID"}</span>
                              </button>

                              {#if o.assignedAccountId}
                                <button
                                  onclick={() => {
                                    activeTab = "connection-details";
                                    connSearchQuery = o.assignedAccountId!;
                                    expandedConnAccountId = o.assignedAccountId!;
                                  }}
                                  class="inline-flex items-center space-x-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-semibold transition shadow-xs"
                                >
                                  <Wifi class="h-3.5 w-3.5" />
                                  <span>{$language === "vi" ? "Mở chi tiết thuê bao" : "View Connection"}</span>
                                </button>
                              {/if}

                              <button
                                onclick={() => (expandedOrderId = null)}
                                class="inline-flex items-center space-x-1 text-xs border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                title={$language === "vi" ? "Đóng hộp chi tiết" : "Close details"}
                              >
                                <X class="h-3.5 w-3.5" />
                                <span>{$language === "vi" ? "Đóng" : "Close"}</span>
                              </button>
                            </div>
                          </div>

                          <!-- 4-Stage Visual Progress Stepper -->
                          <div class="py-2">
                            <div class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-5 flex items-center space-x-2">
                              <Clock class="h-3.5 w-3.5 text-emerald-600" />
                              <span>{$language === "vi" ? "Quy trình xử lý đơn hàng" : "Fulfillment Lifecycle Stepper"}</span>
                            </div>

                            <div class="grid grid-cols-4 gap-2 relative">
                              {#each stepperStages as st (st.step)}
                                {@const stageIdx = getStageIndex(o.status)}
                                {@const isComplete = stageIdx >= st.step}
                                {@const isFailed = o.status === "Not Feasible" && st.step >= 2}
                                <div class="text-center space-y-2">
                                  <div
                                    class="h-10 w-10 mx-auto rounded-full flex items-center justify-center font-bold text-xs transition-colors {isFailed
                                      ? 'bg-rose-500 text-white'
                                      : isComplete
                                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}"
                                  >
                                    {#if isFailed}
                                      !
                                    {:else if isComplete}
                                      <CheckCircle2 class="h-5 w-5" />
                                    {:else}
                                      {st.step}
                                    {/if}
                                  </div>
                                  <div>
                                    <div class="text-xs font-bold text-slate-900 dark:text-white">
                                      {$language === "vi" ? st.labelVi : st.label}
                                    </div>
                                    <div class="text-[11px] text-slate-500 dark:text-slate-400">
                                      {$language === "vi" ? st.subVi : st.sub}
                                    </div>
                                  </div>
                                </div>
                              {/each}
                            </div>
                          </div>

                          <!-- Details Grid (3 Sections) -->
                          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <!-- Box 1: Customer Profile -->
                            <div class="space-y-2.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                              <h5 class="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                                <User class="h-3.5 w-3.5 text-emerald-600" />
                                <span>{$language === "vi" ? "Hồ sơ khách hàng" : "Customer Profile"}</span>
                              </h5>
                              <div class="space-y-1.5 text-xs">
                                <div>
                                  <span class="text-slate-500">{$language === "vi" ? "Họ tên:" : "Name:"}</span>
                                  <strong class="text-slate-900 dark:text-white ml-1">{o.customerName}</strong>
                                </div>
                                <div>
                                  <span class="text-slate-500">{$language === "vi" ? "Điện thoại:" : "Phone:"}</span>
                                  <span class="font-mono font-semibold text-slate-800 dark:text-slate-200 ml-1">{o.customerPhone}</span>
                                </div>
                                <div>
                                  <span class="text-slate-500">{$language === "vi" ? "Email:" : "Email:"}</span>
                                  <span class="text-slate-800 dark:text-slate-200 ml-1">{o.customerEmail}</span>
                                </div>
                                <div>
                                  <span class="text-slate-500">{$language === "vi" ? "Xác minh ID:" : "ID Proof:"}</span>
                                  <span class="font-mono text-slate-700 dark:text-slate-300 ml-1">{o.idProofType} ({o.idProofNumber})</span>
                                </div>
                                <div>
                                  <span class="text-slate-500">{$language === "vi" ? "Địa chỉ:" : "Address:"}</span>
                                  <span class="text-slate-800 dark:text-slate-200 ml-1">{o.installationAddress}</span>
                                </div>
                              </div>
                            </div>

                            <!-- Box 2: Service & Technical Data -->
                            <div class="space-y-2.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                              <h5 class="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                                <Server class="h-3.5 w-3.5 text-emerald-600" />
                                <span>{$language === "vi" ? "Dữ liệu dịch vụ & Kỹ thuật" : "Service & Technical"}</span>
                              </h5>
                              <div class="space-y-1.5 text-xs">
                                <div>
                                  <span class="text-slate-500">{$language === "vi" ? "Gói cước:" : "Plan:"}</span>
                                  <strong class="text-slate-900 dark:text-white ml-1">{getPlanName({ name: o.planName }, $language)}</strong>
                                </div>
                                <div>
                                  <span class="text-slate-500">{$language === "vi" ? "Loại kết nối:" : "Type:"}</span>
                                  <span class="font-semibold text-slate-800 dark:text-slate-200 ml-1">{o.connectionType}</span>
                                </div>
                                <div>
                                  <span class="text-slate-500">{$language === "vi" ? "Khoảng cách cáp:" : "Cable Distance:"}</span>
                                  <span class="font-mono font-semibold text-slate-800 dark:text-slate-200 ml-1">{o.cableDistanceMeters || 120} m</span>
                                </div>
                                <div>
                                  <span class="text-slate-500">{$language === "vi" ? "Hộp chia DP:" : "DP Box:"}</span>
                                  <span class="text-slate-800 dark:text-slate-200 ml-1">{o.dpBoxCapacity || ($language === "vi" ? "Còn cổng khả dụng" : "Port Available")}</span>
                                </div>
                                {#if o.feasibilityNotes}
                                  <div class="text-amber-600 dark:text-amber-400 pt-1">
                                    <span class="font-semibold">{$language === "vi" ? "Ghi chú kỹ thuật:" : "Tech Notes:"}</span>
                                    <p class="text-[11px] mt-0.5">{o.feasibilityNotes}</p>
                                  </div>
                                {/if}
                              </div>
                            </div>

                            <!-- Box 3: Fulfillment & Issued Account -->
                            <div class="space-y-2.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                              <h5 class="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                                <CheckCircle2 class="h-3.5 w-3.5 text-emerald-600" />
                                <span>{$language === "vi" ? "Cấp phát tài khoản & Điểm giao dịch" : "Issued Account & Retail Outlet"}</span>
                              </h5>
                              <div class="space-y-2 text-xs">
                                {#if o.assignedAccountId}
                                  <div class="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                                    <span class="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold block">
                                      {$language === "vi" ? "Mã tài khoản 16 ký tự đã cấp:" : "Issued 16-char Account ID:"}
                                    </span>
                                    <div class="flex items-center justify-between mt-1">
                                      <span class="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-300">
                                        {o.assignedAccountId}
                                      </span>
                                      <button
                                        onclick={() => copyToClipboard(o.assignedAccountId!, "Account ID")}
                                        class="p-1 rounded hover:bg-emerald-200 dark:hover:bg-emerald-800 text-emerald-600 dark:text-emerald-400 transition"
                                        title={$language === "vi" ? "Sao chép mã tài khoản" : "Copy Account ID"}
                                      >
                                        <Copy class="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                {:else}
                                  <div class="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400">
                                    <span class="text-xs font-medium">
                                      {$language === "vi" ? "Chưa cấp Account ID (Đang chờ kỹ thuật phê duyệt hoặc khảo sát)" : "Awaiting technician provisioning to generate Account ID."}
                                    </span>
                                  </div>
                                {/if}

                                <div>
                                  <span class="text-slate-500">{$language === "vi" ? "Điểm quầy bán lẻ:" : "Retail Outlet:"}</span>
                                  <span class="font-mono font-semibold text-slate-800 dark:text-slate-200 ml-1">{o.retailOutletCode}</span>
                                </div>
                                <div>
                                  <span class="text-slate-500">{$language === "vi" ? "Nhân viên tiếp nhận:" : "Staff:"}</span>
                                  <span class="text-slate-800 dark:text-slate-200 ml-1">{o.retailEmployeeName}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  {/if}
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <!-- TAB 3: CONNECTION DETAILS -->
  {#if activeTab === "connection-details"}
    <div class="space-y-6">
      <!-- 1. KPI Summary Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <!-- Managed Accounts -->
        <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div class="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>{$language === "vi" ? "Thuê bao quản lý" : "Managed Accounts"}</span>
            <Wifi class="h-3.5 w-3.5 text-slate-400" />
          </div>
          <div class="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1.5">
            {$connections.length}
            <span class="text-xs font-normal text-slate-400 ml-1">{$language === "vi" ? "tài khoản" : "circuits"}</span>
          </div>
          <div class="text-[10px] text-slate-500 mt-1">
            {$language === "vi" ? "16 ký tự chuẩn ISO" : "16-char ISO standard"}
          </div>
        </div>

        <!-- Active -->
        <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/40 shadow-sm">
          <div class="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center justify-between">
            <span>{$language === "vi" ? "Đang hoạt động" : "Active Circuits"}</span>
            <CheckCircle2 class="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <div class="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1.5">
            {$connections.filter((c) => c.status === "Active").length}
            <span class="text-xs font-normal text-emerald-600/70 ml-1">{$language === "vi" ? "trực tuyến" : "online"}</span>
          </div>
          <div class="text-[10px] text-emerald-600/80 dark:text-emerald-500 mt-1">
            {$language === "vi" ? "Đường truyền thông suốt" : "Stable traffic flow"}
          </div>
        </div>

        <!-- Temporarily Inactive -->
        <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 shadow-sm">
          <div class="text-[11px] font-mono text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center justify-between">
            <span>{$language === "vi" ? "Tạm khóa dịch vụ" : "Temporarily Inactive"}</span>
            <AlertTriangle class="h-3.5 w-3.5 text-amber-500" />
          </div>
          <div class="text-2xl font-bold font-mono text-amber-700 dark:text-amber-400 mt-1.5">
            {$connections.filter((c) => c.status === "Temporarily Inactive").length}
            <span class="text-xs font-normal text-amber-600/70 ml-1">{$language === "vi" ? "tạm khóa" : "on hold"}</span>
          </div>
          <div class="text-[10px] text-amber-600/80 dark:text-amber-500 mt-1">
            {$language === "vi" ? "Nợ cước / Tạm ngưng" : "Overdue / Suspended"}
          </div>
        </div>

        <!-- Permanently Inactive -->
        <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 shadow-sm">
          <div class="text-[11px] font-mono text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center justify-between">
            <span>{$language === "vi" ? "Khóa vĩnh viễn" : "Cut Off"}</span>
            <XCircle class="h-3.5 w-3.5 text-rose-500" />
          </div>
          <div class="text-2xl font-bold font-mono text-rose-700 dark:text-rose-400 mt-1.5">
            {$connections.filter((c) => c.status === "Permanently Inactive").length}
            <span class="text-xs font-normal text-rose-600/70 ml-1">{$language === "vi" ? "đã cắt" : "terminated"}</span>
          </div>
          <div class="text-[10px] text-rose-600/80 dark:text-rose-500 mt-1">
            {$language === "vi" ? "Đã thu hồi cổng CPE" : "CPE & Port reclaimed"}
          </div>
        </div>

        <!-- Total Outstanding Due Balance -->
        <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/40 shadow-sm col-span-2 sm:col-span-1">
          <div class="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center justify-between">
            <span>{$language === "vi" ? "Tổng nợ cước" : "Outstanding Balance"}</span>
            <Receipt class="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <div class="text-2xl font-bold font-mono {totalDueAmountAllConnections > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'} mt-1.5">
            ${totalDueAmountAllConnections.toFixed(2)}
          </div>
          <div class="text-[10px] text-slate-500 mt-1">
            {$language === "vi" ? "Hỗ trợ thu ngân tại quầy" : "Payable at counter POS"}
          </div>
        </div>
      </div>

      <!-- 2. Search & Filter Bar -->
      <div class="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div class="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <!-- Search input -->
          <div class="relative flex-1">
            <Search class="absolute left-3.5 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder={$language === "vi"
                ? "Tra cứu theo Mã tài khoản (16 ký tự), tên thuê bao, địa chỉ, SĐT, cổng NOC, IP..."
                : "Search by 16-char Account ID, subscriber name, address, phone, NOC port, IP..."}
              bind:value={connSearchQuery}
              class="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 font-mono"
            />
          </div>

          <div class="flex items-center gap-2">
            <button
              onclick={handleQuickTrackConnection}
              class="px-4 py-2.5 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow flex items-center justify-center space-x-1.5 whitespace-nowrap"
            >
              <Wifi class="h-4 w-4" />
              <span>{$language === "vi" ? "Tải hồ sơ & Mở chi tiết" : "Retrieve & Open Details"}</span>
            </button>
          </div>
        </div>

        <!-- Filter rows: Status & Connection Type -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
          <!-- Status Filter Pills (Horizontal row) -->
          <div class="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap pb-1 max-w-full">
            <button
              onclick={() => (connStatusFilter = "All")}
              class="px-2.5 py-1 text-xs font-medium rounded-lg transition {connStatusFilter === 'All'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}"
            >
              {$language === "vi" ? "Tất cả" : "All"} ({$connections.length})
            </button>
            <button
              onclick={() => (connStatusFilter = "Active")}
              class="px-2.5 py-1 text-xs font-medium rounded-lg transition {connStatusFilter === 'Active'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}"
            >
              {$language === "vi" ? "Hoạt động" : "Active"} ({$connections.filter((c) => c.status === "Active").length})
            </button>
            <button
              onclick={() => (connStatusFilter = "Temporarily Inactive")}
              class="px-2.5 py-1 text-xs font-medium rounded-lg transition {connStatusFilter === 'Temporarily Inactive'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}"
            >
              {$language === "vi" ? "Tạm khóa" : "Inactive"} ({$connections.filter((c) => c.status === "Temporarily Inactive").length})
            </button>
            <button
              onclick={() => (connStatusFilter = "Permanently Inactive")}
              class="px-2.5 py-1 text-xs font-medium rounded-lg transition {connStatusFilter === 'Permanently Inactive'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}"
            >
              {$language === "vi" ? "Khóa vĩnh viễn" : "Cut Off"} ({$connections.filter((c) => c.status === "Permanently Inactive").length})
            </button>
          </div>

          <!-- Connection Type Filter -->
          <div class="flex items-center space-x-2 text-xs">
            <span class="text-slate-500 dark:text-slate-400 whitespace-nowrap">
              {$language === "vi" ? "Loại dịch vụ:" : "Service Type:"}
            </span>
            <select
              bind:value={connTypeFilter}
              class="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
            >
              <option value="All">{$language === "vi" ? "Tất cả loại dịch vụ" : "All Types"}</option>
              <option value="Broadband">Broadband (Cáp quang)</option>
              <option value="Landline">Landline (Cố định)</option>
              <option value="Dial-Up">Dial-Up (Quay số)</option>
            </select>
          </div>
        </div>

        <!-- Fast Pick Tags -->
        <div class="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
          <span class="text-[11px]">{$language === "vi" ? "Mã tài khoản mới nhất:" : "Latest Accounts:"}</span>
          {#each $connections as c (c.accountId)}
            <button
              onclick={() => {
                connSearchQuery = c.accountId;
                expandedConnAccountId = c.accountId;
              }}
              class="px-2 py-0.5 rounded border transition font-semibold text-[11px] {expandedConnAccountId === c.accountId
                ? 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-400 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-400'
                : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-400'}"
            >
              {c.accountId}
            </button>
          {/each}
        </div>
      </div>

      <!-- 3. Connections Table List with Dropdown Accordion -->
      <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div class="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/50">
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Wifi class="h-5 w-5 text-emerald-600" />
              <span>{$language === "vi" ? "Danh sách chi tiết thuê bao & hồ sơ đường truyền" : "Subscriber Connection Registry & Profiles"}</span>
              <span class="ml-2 px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                {filteredTrackedConnections.length} {$language === "vi" ? "thuê bao" : "subscribers"}
              </span>
            </h3>
          </div>

          {#if expandedConnAccountId}
            <button
              onclick={() => (expandedConnAccountId = null)}
              class="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 transition bg-white dark:bg-slate-900 flex items-center gap-1 self-start sm:self-auto"
            >
              <X class="h-3.5 w-3.5" />
              <span>{$language === "vi" ? "Thu gọn tất cả chi tiết" : "Collapse All Details"}</span>
            </button>
          {/if}
        </div>

        {#if filteredTrackedConnections.length === 0}
          <div class="py-16 text-center space-y-3">
            <Wifi class="h-10 w-10 text-slate-400 mx-auto opacity-50" />
            <div class="text-sm font-semibold text-slate-700 dark:text-slate-300 font-mono">
              {$language === "vi" ? "Không tìm thấy thuê bao nào khớp với bộ lọc." : "No accounts match the current filter criteria."}
            </div>
            <button
              onclick={() => {
                connSearchQuery = "";
                connStatusFilter = "All";
                connTypeFilter = "All";
              }}
              class="px-4 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
            >
              {$language === "vi" ? "Đặt lại bộ lọc" : "Reset Filters"}
            </button>
          </div>
        {:else}
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm border-collapse">
              <thead class="bg-slate-50 dark:bg-slate-950/80 text-[11px] font-mono text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th class="px-4 py-3.5">{$language === "vi" ? "MÃ TÀI KHOẢN (16 KÝ TỰ)" : "ACCOUNT ID (16-CHAR)"}</th>
                  <th class="px-4 py-3.5">{$language === "vi" ? "THUÊ BAO & ĐỊA CHỈ" : "SUBSCRIBER & LOCATION"}</th>
                  <th class="px-4 py-3.5">{$language === "vi" ? "LOẠI DỊCH VỤ & GÓI CƯỚC" : "SERVICE & PLAN"}</th>
                  <th class="px-4 py-3.5">{$language === "vi" ? "CỔNG NOC & IP" : "NOC PORT & IP"}</th>
                  <th class="px-4 py-3.5">{$language === "vi" ? "DƯ NỢ CƯỚC ($)" : "OUTSTANDING DUE ($)"}</th>
                  <th class="px-4 py-3.5">{$language === "vi" ? "TRẠNG THÁI" : "STATUS"}</th>
                  <th class="px-4 py-3.5 text-right">{$language === "vi" ? "THAO TÁC" : "ACTIONS"}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                {#each filteredTrackedConnections as conn (conn.accountId)}
                  {@const isExpanded = expandedConnAccountId === conn.accountId}
                  {@const due = getConnectionDueAmount(conn.accountId)}
                  <!-- Main Table Row -->
                  <tr
                    class="transition-colors hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 {isExpanded
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/30'
                      : ''}"
                  >
                    <!-- Col 1: Account ID -->
                    <td class="px-4 py-4 align-top">
                      <div class="flex items-center space-x-1.5">
                        <span class="font-mono font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                          {conn.accountId}
                        </span>
                        <button
                          onclick={() => copyToClipboard(conn.accountId, "Account ID")}
                          class="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                          title={$language === "vi" ? "Sao chép mã tài khoản" : "Copy Account ID"}
                        >
                          <Copy class="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div class="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1 flex items-center space-x-1">
                        <span>{$language === "vi" ? "Đơn gốc:" : "Order:"}</span>
                        <span class="text-slate-700 dark:text-slate-300">#{conn.orderId}</span>
                      </div>
                    </td>

                    <!-- Col 2: Subscriber & Location -->
                    <td class="px-4 py-4 align-top">
                      <div class="font-semibold text-slate-900 dark:text-white">
                        {conn.customerName}
                      </div>
                      <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {conn.installationAddress}
                      </div>
                      <div class="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                        {conn.customerPhone}
                      </div>
                    </td>

                    <!-- Col 3: Service Type & Plan -->
                    <td class="px-4 py-4 align-top">
                      <div class="flex items-center space-x-1.5">
                        {#if conn.connectionType === "Broadband"}
                          <span class="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            <Wifi class="h-3 w-3" />
                            <span>Broadband</span>
                          </span>
                        {:else if conn.connectionType === "Landline"}
                          <span class="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            <Phone class="h-3 w-3" />
                            <span>Landline</span>
                          </span>
                        {:else}
                          <span class="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Radio class="h-3 w-3" />
                            <span>Dial-Up</span>
                          </span>
                        {/if}
                      </div>
                      <div class="text-xs font-medium text-slate-800 dark:text-slate-200 mt-1">
                        {conn.planName}
                      </div>
                      <div class="text-[11px] font-mono text-slate-500">
                        ${conn.monthlyRental.toFixed(2)}/{$language === "vi" ? "tháng" : "mo"}
                      </div>
                    </td>

                    <!-- Col 4: NOC Port & IP -->
                    <td class="px-4 py-4 align-top font-mono text-xs">
                      <div class="font-bold text-slate-800 dark:text-slate-200">
                        {conn.portNumber || "PON-01/04"}
                      </div>
                      <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        IP: {conn.ipAddress || "198.51.100.42"}
                      </div>
                      <div class="text-[10px] text-slate-400 truncate max-w-[140px] mt-0.5">
                        CPE: {conn.assignedDeviceSerial || "Chưa gán"}
                      </div>
                    </td>

                    <!-- Col 5: Outstanding Due -->
                    <td class="px-4 py-4 align-top">
                      <div class="font-mono text-base font-bold {due > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}">
                        ${due.toFixed(2)}
                      </div>
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold mt-1 {due === 0 ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'}">
                        {due === 0 ? ($language === "vi" ? "Đã quyết toán" : "Paid in Full") : ($language === "vi" ? "Còn dư nợ" : "Unpaid Balance")}
                      </span>
                    </td>

                    <!-- Col 6: Status -->
                    <td class="px-4 py-4 align-top">
                      <span
                        class="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider {conn.status ===
                        'Active'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                          : conn.status === 'Temporarily Inactive'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                            : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700'}"
                      >
                        <span
                          class="h-2 w-2 rounded-full {conn.status === 'Active'
                            ? 'bg-emerald-500 animate-pulse'
                            : conn.status === 'Temporarily Inactive'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'}"
                        ></span>
                        <span>
                          {$language === "vi"
                            ? conn.status === "Active"
                              ? "Hoạt động"
                              : conn.status === "Temporarily Inactive"
                                ? "Tạm khóa"
                                : "Khóa vĩnh viễn"
                            : conn.status}
                        </span>
                      </span>
                    </td>

                    <!-- Col 7: Action Button -->
                    <td class="px-4 py-4 align-top text-right whitespace-nowrap">
                      <button
                        onclick={() => toggleConnDropdown(conn.accountId)}
                        class="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs {isExpanded
                          ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-950 hover:text-emerald-800 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700'}"
                      >
                        <span>{$language === "vi" ? (isExpanded ? "Thu gọn" : "Chi tiết") : (isExpanded ? "Collapse" : "Details")}</span>
                        <ChevronDown
                          class="h-4 w-4 transition-transform duration-200 {isExpanded ? 'rotate-180' : ''}"
                        />
                      </button>
                    </td>
                  </tr>

                  <!-- DROPDOWN BOX CHI TIẾT CỦA MÃ TÀI KHOẢN -->
                  {#if isExpanded}
                    {@const connBills = getBillsForConnection(conn.accountId)}
                    <tr class="bg-gradient-to-b from-emerald-50/50 to-slate-50 dark:from-emerald-950/20 dark:to-slate-950/40 border-b-2 border-emerald-400 dark:border-emerald-600/60">
                      <td colspan="7" class="p-4 sm:p-6">
                        <div class="space-y-6 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-md">
                          <!-- Box Header -->
                          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                            <div class="flex items-start sm:items-center space-x-3">
                              <div class="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                                <Wifi class="h-6 w-6" />
                              </div>
                              <div>
                                <div class="flex items-center space-x-3">
                                  <h4 class="text-lg font-bold font-mono text-slate-900 dark:text-white">
                                    {$language === "vi" ? "Mã tài khoản:" : "Account ID:"}
                                    <span class="text-emerald-600 dark:text-emerald-400 font-extrabold">{conn.accountId}</span>
                                  </h4>
                                  <span
                                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider {conn.status ===
                                    'Active'
                                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                                      : conn.status === 'Temporarily Inactive'
                                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                                        : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700'}"
                                  >
                                    {$language === "vi"
                                      ? conn.status === "Active"
                                        ? "Hoạt động bình thường"
                                        : conn.status === "Temporarily Inactive"
                                          ? "Tạm khóa dịch vụ"
                                          : "Khóa vĩnh viễn"
                                      : conn.status}
                                  </span>
                                </div>
                                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                  {$language === "vi" ? "Thuê bao:" : "Subscriber:"}
                                  <strong class="text-slate-700 dark:text-slate-300">{conn.customerName}</strong>
                                  • {$language === "vi" ? "Kích hoạt ngày" : "Activated on"} {conn.installedDate}
                                  • {$language === "vi" ? "Điện thoại:" : "Phone:"} {conn.customerPhone}
                                </p>
                              </div>
                            </div>

                            <!-- Header Actions -->
                            <div class="flex flex-wrap items-center gap-2">
                              {#if connBills.length > 0 && due > 0}
                                <button
                                  type="button"
                                  onclick={() => handleOpenRetailPayment(connBills[0])}
                                  class="inline-flex items-center space-x-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-semibold transition shadow-xs"
                                >
                                  <CreditCard class="h-3.5 w-3.5" />
                                  <span>{$language === "vi" ? `Thu tiền tại quầy ($${due.toFixed(2)})` : `Pay at Counter ($${due.toFixed(2)})`}</span>
                                </button>
                              {/if}

                              <button
                                onclick={() => copyToClipboard(conn.accountId, "Account ID")}
                                class="inline-flex items-center space-x-1 text-xs border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition font-medium"
                              >
                                <Copy class="h-3.5 w-3.5" />
                                <span>{$language === "vi" ? "Sao chép Account ID" : "Copy Account ID"}</span>
                              </button>

                              <button
                                onclick={() => (expandedConnAccountId = null)}
                                class="inline-flex items-center space-x-1 text-xs border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                title={$language === "vi" ? "Đóng hộp chi tiết" : "Close details"}
                              >
                                <X class="h-3.5 w-3.5" />
                                <span>{$language === "vi" ? "Đóng" : "Close"}</span>
                              </button>
                            </div>
                          </div>

                          <!-- 4 Detail Blocks (Spec §9) -->
                          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                            <!-- Block 1: Service Parameters -->
                            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                              <div class="text-slate-400 font-bold uppercase tracking-wider flex items-center space-x-1.5">
                                <FileText class="h-3.5 w-3.5 text-emerald-600" />
                                <span>{$language === "vi" ? "Thông số dịch vụ" : "Service Parameters"}</span>
                              </div>
                              <div class="pt-1">
                                <span class="text-slate-500">{$language === "vi" ? "Gói cước:" : "Plan:"}</span>
                                <strong class="text-slate-900 dark:text-white ml-1">{getPlanName({ name: conn.planName }, $language)}</strong>
                              </div>
                              <div>
                                <span class="text-slate-500">{$language === "vi" ? "Loại kết nối:" : "Connection:"}</span>
                                <span class="font-semibold text-slate-800 dark:text-slate-200 ml-1">
                                  {$language === "vi"
                                    ? conn.connectionType === "Broadband"
                                      ? "Cáp quang (Broadband)"
                                      : conn.connectionType === "Dial-Up"
                                        ? "Quay số (Dial-Up)"
                                        : "Cố định (Landline)"
                                    : conn.connectionType}
                                </span>
                              </div>
                              <div>
                                <span class="text-slate-500">{$language === "vi" ? "Cước thuê tháng:" : "Monthly Rental:"}</span>
                                <span class="font-mono font-bold text-slate-900 dark:text-white ml-1">${conn.monthlyRental.toFixed(2)}</span>
                              </div>
                              <div>
                                <span class="text-slate-500">{$language === "vi" ? "Tiền đặt cọc:" : "Security Deposit:"}</span>
                                <span class="font-mono text-slate-800 dark:text-slate-200 ml-1">${conn.securityDeposit.toFixed(2)}</span>
                              </div>
                            </div>

                            <!-- Block 2: Physical & Circuit Data -->
                            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                              <div class="text-slate-400 font-bold uppercase tracking-wider flex items-center space-x-1.5">
                                <HardDrive class="h-3.5 w-3.5 text-emerald-600" />
                                <span>{$language === "vi" ? "Dữ liệu vật lý & Tuyến cáp" : "Physical & Circuit Data"}</span>
                              </div>
                              <div class="pt-1">
                                <span class="text-slate-500">{$language === "vi" ? "Địa chỉ IP cấp:" : "Assigned IP:"}</span>
                                <span class="font-mono font-semibold text-slate-800 dark:text-slate-200 ml-1">{conn.ipAddress || "Dynamic DHCP"}</span>
                              </div>
                              <div>
                                <span class="text-slate-500">{$language === "vi" ? "Cổng Switch/NOC:" : "Switch Port:"}</span>
                                <span class="font-mono font-semibold text-slate-800 dark:text-slate-200 ml-1">{conn.portNumber || "PON-01"}</span>
                              </div>
                              <div>
                                <span class="text-slate-500">{$language === "vi" ? "Thiết bị cấp:" : "Assigned Device:"}</span>
                                <span class="text-slate-800 dark:text-slate-200 ml-1">{conn.assignedDeviceModel || "Standard CPE"}</span>
                              </div>
                              <div class="font-mono">
                                <span class="text-slate-500">{$language === "vi" ? "Số sê-ri CPE:" : "Serial:"}</span>
                                <span class="text-slate-800 dark:text-slate-200 ml-1">{conn.assignedDeviceSerial || "NX-AUTO-GEN"}</span>
                              </div>
                            </div>

                            <!-- Block 3: Contact & Address -->
                            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                              <div class="text-slate-400 font-bold uppercase tracking-wider flex items-center space-x-1.5">
                                <User class="h-3.5 w-3.5 text-emerald-600" />
                                <span>{$language === "vi" ? "Liên hệ & Địa chỉ" : "Contact & Address"}</span>
                              </div>
                              <div class="pt-1">
                                <span class="text-slate-500">{$language === "vi" ? "Điện thoại:" : "Phone:"}</span>
                                <span class="font-mono font-semibold text-slate-800 dark:text-slate-200 ml-1">{conn.customerPhone}</span>
                              </div>
                              <div>
                                <span class="text-slate-500">{$language === "vi" ? "Email:" : "Email:"}</span>
                                <span class="text-slate-800 dark:text-slate-200 ml-1">{conn.customerEmail}</span>
                              </div>
                              <div>
                                <span class="text-slate-500">{$language === "vi" ? "Địa chỉ lắp đặt:" : "Installation:"}</span>
                                <span class="text-slate-800 dark:text-slate-200 ml-1">{conn.installationAddress}</span>
                              </div>
                              {#if conn.lastStatusReason}
                                <div class="text-amber-500 pt-1">
                                  <span class="font-semibold">{$language === "vi" ? "Lý do trạng thái:" : "Reason:"}</span>
                                  <p class="text-[11px] mt-0.5">{conn.lastStatusReason}</p>
                                </div>
                              {/if}
                            </div>

                            <!-- Block 4: Financial & Due Status -->
                            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                              <div class="text-slate-400 font-bold uppercase tracking-wider flex items-center space-x-1.5">
                                <Receipt class="h-3.5 w-3.5 text-emerald-600" />
                                <span>{$language === "vi" ? "Tài chính & Nợ cước" : "Billing & Due Status"}</span>
                              </div>
                              <div class="pt-1">
                                <span class="block text-[11px] text-slate-500">{$language === "vi" ? "Số tiền còn nợ:" : "Outstanding Due:"}</span>
                                <span class="text-lg font-bold font-mono {due > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}">
                                  ${due.toFixed(2)}
                                </span>
                              </div>
                              <div>
                                <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold {due === 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300'}">
                                  {due === 0 ? ($language === "vi" ? "Đã quyết toán đủ" : "Paid in Full") : ($language === "vi" ? "Chưa thanh toán" : "Balance Outstanding")}
                                </span>
                              </div>
                              <div class="text-[11px] text-slate-500 pt-1">
                                {$language === "vi" ? `Tổng số hóa đơn: ${connBills.length}` : `Invoices on file: ${connBills.length}`}
                              </div>
                              {#if connBills.length > 0 && due > 0}
                                <button
                                  type="button"
                                  onclick={() => handleOpenRetailPayment(connBills[0])}
                                  class="w-full mt-2 py-1.5 px-2.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center justify-center space-x-1 shadow-sm"
                                >
                                  <CreditCard class="h-3.5 w-3.5" />
                                  <span>{$language === "vi" ? "Thu tiền tại quầy" : "Pay at Counter"}</span>
                                </button>
                              {/if}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  {/if}
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <!-- TAB 4: PAYMENT RECORDS -->
  {#if activeTab === "payment-records"}
    <div class="space-y-6">
      <div
        class="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3"
      >
        <div class="relative w-full sm:w-80">
          <Search class="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={$language === "vi"
              ? "Lọc theo mã tài khoản hoặc họ tên..."
              : "Filter by Account ID or Name..."}
            bind:value={paymentAccountQuery}
            class="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
          />
        </div>

        <div class="text-xs text-slate-500">
          {$language === "vi"
            ? "Hiển thị sổ cái giao dịch của tất cả khách hàng bán lẻ"
            : "Showing transaction ledgers across all retail customers"}
        </div>
      </div>

      <!-- Invoices & Payments Table -->
      <div
        class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm"
      >
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead
              class="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800"
            >
              <tr>
                <th class="px-4 py-3"
                  >{$language === "vi" ? "Mã hóa đơn" : "Invoice Number"}</th
                >
                <th class="px-4 py-3"
                  >{$language === "vi"
                    ? "Mã tài khoản 16 ký tự"
                    : "16-character Account ID"}</th
                >
                <th class="px-4 py-3"
                  >{$language === "vi" ? "Tên thuê bao" : "Subscriber Name"}</th
                >
                <th class="px-4 py-3"
                  >{$language === "vi" ? "Kỳ cước" : "Billing Cycle"}</th
                >
                <th class="px-4 py-3"
                  >{$language === "vi"
                    ? "Tổng tiền ($)"
                    : "Total Amount ($)"}</th
                >
                <th class="px-4 py-3"
                  >{$language === "vi"
                    ? "Đã thanh toán ($)"
                    : "Amount Paid ($)"}</th
                >
                <th class="px-4 py-3"
                  >{$language === "vi" ? "Còn nợ ($)" : "Due Balance ($)"}</th
                >
                <th class="px-4 py-3"
                  >{$language === "vi" ? "Trạng thái" : "Payment Status"}</th
                >
                <th class="px-4 py-3 text-right"
                  >{$language === "vi" ? "Thao tác" : "Actions"}</th
                >
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              {#each $bills.filter((b) => b.accountId
                    .toLowerCase()
                    .includes(paymentAccountQuery.toLowerCase()) || b.customerName
                    .toLowerCase()
                    .includes(paymentAccountQuery.toLowerCase())) as bill (bill.id)}
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td
                    class="px-4 py-3 font-mono font-medium text-slate-900 dark:text-slate-100"
                    >{bill.invoiceNumber}</td
                  >
                  <td
                    class="px-4 py-3 font-mono text-xs text-emerald-600 dark:text-emerald-400"
                    >{bill.accountId}</td
                  >
                  <td
                    class="px-4 py-3 font-semibold text-slate-900 dark:text-white"
                    >{bill.customerName}</td
                  >
                  <td class="px-4 py-3 text-xs text-slate-500"
                    >{bill.billingMonth}</td
                  >
                  <td class="px-4 py-3 font-mono tabular-nums font-medium"
                    >${bill.totalAmount.toFixed(2)}</td
                  >
                  <td
                    class="px-4 py-3 font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold"
                    >${bill.amountPaid.toFixed(2)}</td
                  >
                  <td
                    class="px-4 py-3 font-mono tabular-nums text-rose-600 dark:text-rose-400 font-semibold"
                    >${bill.dueAmount.toFixed(2)}</td
                  >
                  <td class="px-4 py-3">
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold {bill.status ===
                      'Paid'
                        ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                        : bill.status === 'Partially Paid'
                          ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                          : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'}"
                    >
                      {$language === "vi"
                        ? bill.status === "Paid"
                          ? "Đã thanh toán"
                          : bill.status === "Partially Paid"
                            ? "Một phần"
                            : "Chưa thanh toán"
                        : bill.status}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    {#if bill.status !== "Paid"}
                      <button
                        onclick={() => handleOpenRetailPayment(bill)}
                        class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs flex items-center space-x-1 ml-auto"
                        title={$language === "vi"
                          ? "Thu tiền & Cập nhật thanh toán vào hệ thống"
                          : "Collect payment & update ledger"}
                      >
                        <CreditCard class="h-3 w-3" />
                        <span
                          >{$language === "vi" ? "Thu tiền" : "Collect"}</span
                        >
                      </button>
                    {:else}
                      <span
                        class="text-xs text-emerald-600 dark:text-emerald-400 font-medium"
                        >✓ {$language === "vi"
                          ? "Đã thanh toán"
                          : "Settled"}</span
                      >
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  {/if}

  <!-- ORDER CREATED SUCCESS MODAL (With 11-character Order ID) -->
  {#if placedOrder}
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
    >
      <div
        class="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4 text-center"
      >
        <div
          class="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center"
        >
          <CheckCircle2 class="h-6 w-6" />
        </div>

        <div>
          <h3 class="text-lg font-bold text-slate-900 dark:text-white">
            {$language === "vi"
              ? "Đã tạo đơn hàng mới thành công!"
              : "New Order Successfully Booked!"}
          </h3>
          <p class="text-xs text-slate-500 mt-1">
            {$language === "vi"
              ? "Đơn hàng đã được chuyển thẳng tới hàng đợi thẩm định kỹ thuật hiện trường."
              : "Order routed directly to the Technical Staff Feasibility Queue."}
          </p>
        </div>

        <!-- Highlighted 11-character Order ID -->
        <div
          class="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1"
        >
          <div class="text-xs text-slate-400 font-semibold uppercase">
            {$language === "vi"
              ? "Mã đơn hàng 11 ký tự chính thức"
              : "Official 11-Digit Order ID"}
          </div>
          <div
            class="text-2xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400 tracking-wider"
          >
            {placedOrder.id}
          </div>
          <div class="text-[11px] text-slate-500">
            {$language === "vi" ? "Khách hàng:" : "Customer:"}
            {placedOrder.customerName} • {getPlanName(
              { name: placedOrder.planName },
              $language,
            )}
          </div>
        </div>

        <!-- The 16-character Account ID is issued later, on feasibility confirmation -->
        <div
          class="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 space-y-1"
        >
          <div
            class="text-xs text-sky-600 dark:text-sky-400 font-semibold uppercase"
          >
            {$language === "vi"
              ? "Đang chờ cấp mã tài khoản"
              : "Account ID pending"}
          </div>
          <div class="text-[11px] text-slate-500">
            {$language === "vi"
              ? "Mã tài khoản 16 ký tự của khách hàng (thông tin đăng nhập duy nhất) sẽ được cấp sau khi bộ phận kỹ thuật xác nhận tuyến cáp khả thi. Trong thời gian này, khách hàng sử dụng mã đơn này để tra cứu."
              : "The customer's 16-character Account ID — their only sign-in credential — is issued once technical confirms the line is feasible. Until then they track this order code."}
          </div>
        </div>

        <div class="flex gap-2 justify-center">
          <button
            onclick={() => copyToClipboard(placedOrder!.id, "Order ID")}
            class="px-4 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-1.5"
          >
            <Copy class="h-3.5 w-3.5" />
            <span
              >{$language === "vi" ? "Sao chép mã đơn" : "Copy Order ID"}</span
            >
          </button>
          <button
            onclick={trackThisOrder}
            class="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center space-x-1.5"
          >
            <span
              >{$language === "vi"
                ? "Theo dõi đơn này"
                : "Track This Order"}</span
            >
            <ArrowRight class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- RETAIL STORE PAYMENT MODAL (Cập nhật lịch sử thanh toán vào hệ thống) -->
  {#if isPaymentModalOpen && targetBillForPayment}
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4"
    >
      <div
        class="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-5"
      >
        <div
          class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3"
        >
          <div class="flex items-center space-x-2">
            <div
              class="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"
            >
              <CreditCard class="h-4 w-4" />
            </div>
            <div>
              <h3 class="font-bold text-slate-900 dark:text-white text-sm">
                {$language === "vi"
                  ? "Thu tiền tại quầy & Cập nhật thanh toán"
                  : "Counter Payment & Settlement"}
              </h3>
              <p class="text-[11px] text-slate-500 font-mono">
                {targetBillForPayment.invoiceNumber}
              </p>
            </div>
          </div>
          <button
            onclick={() => (isPaymentModalOpen = false)}
            class="text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <div
          class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 font-mono"
        >
          <div class="flex justify-between font-sans">
            <span class="text-slate-500"
              >{$language === "vi" ? "Khách hàng:" : "Customer:"}</span
            >
            <strong class="text-slate-900 dark:text-white"
              >{targetBillForPayment.customerName}</strong
            >
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500"
              >{$language === "vi" ? "Mã tài khoản:" : "Account ID:"}</span
            >
            <span class="text-emerald-600 dark:text-emerald-400 font-bold"
              >{targetBillForPayment.accountId}</span
            >
          </div>
          <div
            class="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-1.5"
          >
            <span class="text-slate-500"
              >{$language === "vi" ? "Tổng hóa đơn:" : "Total Bill:"}</span
            >
            <span class="text-slate-900 dark:text-white font-bold"
              >${targetBillForPayment.totalAmount.toFixed(2)}</span
            >
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500"
              >{$language === "vi" ? "Đã thanh toán:" : "Paid:"}</span
            >
            <span class="text-emerald-600 dark:text-emerald-400"
              >${targetBillForPayment.amountPaid.toFixed(2)}</span
            >
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500 font-bold"
              >{$language === "vi" ? "Công nợ còn lại:" : "Due Balance:"}</span
            >
            <span class="text-rose-600 dark:text-rose-400 font-bold"
              >${targetBillForPayment.dueAmount.toFixed(2)}</span
            >
          </div>
        </div>

        <form onsubmit={handleConfirmRetailPayment} class="space-y-4 text-xs">
          <div>
            <label
              class="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              {$language === "vi"
                ? "Số tiền thanh toán ($) *"
                : "Payment Amount ($) *"}
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              bind:value={retailPaymentAmount}
              class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono font-bold text-sm text-slate-900 dark:text-white"
            />
            <button
              type="button"
              onclick={() =>
                (retailPaymentAmount = targetBillForPayment?.dueAmount || 0)}
              class="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline mt-1 font-medium"
            >
              {$language === "vi" ? "Thanh toán toàn bộ số nợ" : "Pay full due"}
              (${(targetBillForPayment?.dueAmount ?? 0).toFixed(2)})
            </button>
          </div>

          <div>
            <label
              class="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              {$language === "vi"
                ? "Hình thức thanh toán tại quầy"
                : "Payment Tender Mode"}
            </label>
            <select
              bind:value={retailPaymentMode}
              class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="Cash"
                >{$language === "vi"
                  ? "Tiền mặt (Tại quầy)"
                  : "Cash (Counter Tender)"}</option
              >
              <option value="Credit/Debit Card"
                >{$language === "vi"
                  ? "Thẻ tín dụng / Ghi nợ (POS)"
                  : "Credit/Debit Card (POS)"}</option
              >
              <option value="UPI/Digital Wallet"
                >{$language === "vi"
                  ? "Ví điện tử / QR Code"
                  : "UPI / Digital Wallet"}</option
              >
              <option value="Cheque"
                >{$language === "vi"
                  ? "Séc ngân hàng"
                  : "Cheque / Draft"}</option
              >
              <option value="Bank Transfer/NEFT"
                >{$language === "vi"
                  ? "Chuyển khoản trực tiếp"
                  : "Bank Transfer"}</option
              >
            </select>
          </div>

          <div>
            <label
              class="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              {$language === "vi"
                ? "Mã tham chiếu biên lai / Giao dịch"
                : "Receipt / Reference #"}
            </label>
            <input
              type="text"
              bind:value={retailPaymentRef}
              class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-slate-900 dark:text-white"
            />
          </div>

          <div
            class="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800"
          >
            <button
              type="button"
              onclick={() => (isPaymentModalOpen = false)}
              class="px-4 py-2 rounded-lg font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
            >
              {$language === "vi" ? "Hủy" : "Cancel"}
            </button>
            <button
              type="submit"
              class="px-5 py-2 rounded-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow"
            >
              {$language === "vi" ? "Ghi nhận thanh toán" : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  <!-- SETTINGS TAB -->
  {#if activeTab === "settings"}
    <SettingsView />
  {/if}

  <!-- PROFILE TAB -->
  {#if activeTab === "profile"}
    <ProfileView />
  {/if}
</DashboardLayout>

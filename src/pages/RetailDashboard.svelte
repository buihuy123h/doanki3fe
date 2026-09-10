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
  } from "lucide-svelte";
  import type {
    ConnectionType,
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
  // Bulk / corporate scheme + Dial-Up existing landline
  let bulkConnectionsCount = $state(1);
  let hasExistingLandline = $state(false);
  let existingLandlineAccountId = $state("");
  const bulkDiscountPercent = $derived(
    getBulkDiscountPercent(bulkConnectionsCount),
  );

  // Success Modal for newly generated Order
  let placedOrder = $state<Order | null>(null);

  // STATE: ORDER TRACKING (11-char Order ID) — advanced search fields
  let trackingSearchQuery = $state("D0000000001");
  let advOrderName = $state("");
  let advOrderType = $state<"All" | ConnectionType>("All");
  let advOrderPhone = $state("");
  let advOrderFrom = $state("");
  let advOrderTo = $state("");
  let trackedOrder = $state<Order | null>(
    $orders.find((o) => o.id === "D0000000001") || $orders[0] || null,
  );

  // STATE: CONNECTION DETAILS (16-char Account ID) — advanced search fields
  let accountSearchQuery = $state("T064-000000000001");
  let advConnName = $state("");
  let advConnType = $state<"All" | ConnectionType>("All");
  let advConnPhone = $state("");
  let advConnFrom = $state("");
  let advConnTo = $state("");
  let trackedConnection = $state(
    $connections.find((c) => c.accountId === "T064-000000000001") ||
      $connections[0] ||
      null,
  );

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

  // Advanced search results
  const advOrderResults = $derived(
    $orders.filter((o) => {
      const q = trackingSearchQuery.trim().toUpperCase();
      if (q && !o.id.toUpperCase().includes(q)) return false;
      if (
        advOrderName.trim() &&
        !o.customerName
          .toLowerCase()
          .includes(advOrderName.trim().toLowerCase())
      )
        return false;
      if (advOrderType !== "All" && o.connectionType !== advOrderType)
        return false;
      if (
        advOrderPhone.trim() &&
        !o.customerPhone
          .replace(/\D/g, "")
          .includes(advOrderPhone.replace(/\D/g, ""))
      )
        return false;
      const day = o.createdAt.slice(0, 10);
      if (advOrderFrom && day < advOrderFrom) return false;
      if (advOrderTo && day > advOrderTo) return false;
      return true;
    }),
  );

  const advConnResults = $derived(
    $connections.filter((c) => {
      const q = accountSearchQuery.trim().replace(/-/g, "").toUpperCase();
      if (q && !c.accountId.replace(/-/g, "").toUpperCase().includes(q))
        return false;
      if (
        advConnName.trim() &&
        !c.customerName.toLowerCase().includes(advConnName.trim().toLowerCase())
      )
        return false;
      if (advConnType !== "All" && c.connectionType !== advConnType)
        return false;
      if (
        advConnPhone.trim() &&
        !c.customerPhone
          .replace(/\D/g, "")
          .includes(advConnPhone.replace(/\D/g, ""))
      )
        return false;
      const day = (c.installedDate || "").slice(0, 10);
      if (advConnFrom && day < advConnFrom) return false;
      if (advConnTo && day > advConnTo) return false;
      return true;
    }),
  );

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
      bulkConnectionsCount: Math.max(1, bulkConnectionsCount || 1),
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
    bulkConnectionsCount = 1;
    hasExistingLandline = false;
    existingLandlineAccountId = "";
  };

  // ORDER TRACKING SEARCH HANDLER
  const handleSearchOrder = (idToSearch?: string) => {
    const targetId = (idToSearch || trackingSearchQuery).trim().toUpperCase();
    const found = $orders.find((o) => o.id.toUpperCase() === targetId);
    if (found) {
      trackedOrder = found;
      toast.success(`Found Order ${found.id}`);
    } else {
      toast.error(
        `No order found matching ID "${targetId}". Must be an 11-character ID (e.g. D0000000001)`,
      );
    }
  };

  // CONNECTION DETAILS SEARCH HANDLER
  const handleSearchConnection = (idToSearch?: string) => {
    const targetId = (idToSearch || accountSearchQuery).trim();
    const found = $connections.find(
      (c) => c.accountId.replace(/-/g, "") === targetId.replace(/-/g, ""),
    );
    if (found) {
      trackedConnection = found;
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
    trackingSearchQuery = id;
    handleSearchOrder(id);
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
                  ? "Số lượng kết nối (gói doanh nghiệp)"
                  : "Number of connections (bulk)"}
              </label>
              <input
                type="number"
                min="1"
                bind:value={bulkConnectionsCount}
                class="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p class="text-[11px] text-slate-500 mt-1">
                {bulkDiscountPercent > 0
                  ? `${$language === "vi" ? "Chiết khấu" : "Scheme discount"}: −${bulkDiscountPercent}% ${$language === "vi" ? "(cước ứng trước + tiền cọc)" : "(advance + deposit)"}`
                  : $language === "vi"
                    ? "Từ 10 kết nối trở lên được hưởng chiết khấu."
                    : "Discount applies from 10 connections upward."}
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

        <!-- Retail Quick Fill Demo Helper -->
        <div
          class="rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/5 p-4 text-xs space-y-2"
        >
          <div
            class="flex items-center space-x-2 font-semibold text-emerald-700 dark:text-emerald-400"
          >
            <Sparkles class="h-4 w-4" />
            <span
              >{$language === "vi"
                ? "Điền mẫu nhanh thử nghiệm"
                : "Retail Fast-Fill Demo"}</span
            >
          </div>
          <p class="text-slate-600 dark:text-slate-400">
            {$language === "vi"
              ? "Tự động điền thông tin khách hàng mẫu để kiểm thử nhanh quy trình bán lẻ:"
              : "Quickly populate walk-in customer details to speed up retail testing:"}
          </p>
          <button
            type="button"
            onclick={fillDemoCustomer}
            class="w-full py-1.5 px-3 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-700 dark:text-emerald-300 font-medium transition text-center"
          >
            {$language === "vi"
              ? "Điền dữ liệu khách hàng mẫu"
              : "Fill Sample Customer Data"}
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- TAB 2: ORDER TRACKING -->
  {#if activeTab === "order-tracking"}
    <div class="space-y-6">
      <!-- Advanced search: ID / name / type / date period / contact number -->
      <div
        class="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
      >
        <label
          class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
        >
          {$language === "vi"
            ? "Tra cứu đơn hàng nâng cao — Mã đơn 11 ký tự (D/B/T + sê-ri), tên khách hàng, loại kết nối, khoảng thời gian, số điện thoại"
            : "Advanced order search — 11-char Order ID (D/B/T + serial), name, type, date period, phone"}
        </label>

        <div class="flex gap-2">
          <div class="relative flex-1">
            <Search class="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              maxlength="11"
              placeholder={$language === "vi"
                ? "Mã đơn ví dụ D0000000001"
                : "Order ID e.g. D0000000001"}
              bind:value={trackingSearchQuery}
              oninput={(e) =>
                (trackingSearchQuery = (
                  e.currentTarget as HTMLInputElement
                ).value.toUpperCase())}
              onkeydown={(e) => e.key === "Enter" && handleSearchOrder()}
              class="w-full pl-9 pr-4 py-2.5 text-base font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase tracking-widest"
            />
          </div>
          <button
            onclick={() => handleSearchOrder()}
            class="px-5 py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow"
          >
            {$language === "vi" ? "Tra cứu đơn" : "Track Order"}
          </button>
        </div>

        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs"
        >
          <input
            type="text"
            placeholder={$language === "vi"
              ? "Tên trên đơn hàng"
              : "Name on order"}
            bind:value={advOrderName}
            class="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <select
            bind:value={advOrderType}
            class="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="All"
              >{$language === "vi" ? "Tất cả loại kết nối" : "Any type"}</option
            >
            <option value="Broadband"
              >{$language === "vi"
                ? "Cáp quang (Broadband)"
                : "Broadband"}</option
            >
            <option value="Dial-Up"
              >{$language === "vi" ? "Quay số (Dial-Up)" : "Dial-Up"}</option
            >
            <option value="Landline"
              >{$language === "vi"
                ? "Cố định (Landline)"
                : "Landline (Telephone)"}</option
            >
          </select>
          <input
            type="text"
            placeholder={$language === "vi"
              ? "Số điện thoại"
              : "Contact number"}
            bind:value={advOrderPhone}
            class="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <input
            type="date"
            bind:value={advOrderFrom}
            title={$language === "vi" ? "Đăng ký từ ngày" : "Applied from"}
            class="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <input
            type="date"
            bind:value={advOrderTo}
            title={$language === "vi" ? "Đến ngày" : "Applied to"}
            class="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div
          class="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500"
        >
          <span
            >{$language === "vi"
              ? `Kết quả (${advOrderResults.length}):`
              : `Results (${advOrderResults.length}):`}</span
          >
          {#each advOrderResults.slice(0, 12) as o (o.id)}
            <button
              onclick={() => (trackedOrder = o)}
              class="font-mono text-emerald-600 dark:text-emerald-400 hover:underline bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40"
            >
              {o.id} · {o.customerName.split(" ")[0]} ({$language === "vi"
                ? o.status === "Connection Provided"
                  ? "Đã cấp kết nối"
                  : o.status === "Feasible"
                    ? "Khả thi"
                    : o.status === "Not Feasible"
                      ? "Không khả thi"
                      : "Chờ xử lý"
                : o.status})
            </button>
          {:else}
            <span class="italic"
              >{$language === "vi"
                ? "Không có đơn hàng phù hợp."
                : "No matching orders."}</span
            >
          {/each}
        </div>
      </div>

      <!-- Visual Tracking Timeline & Details -->
      {#if trackedOrder}
        <div
          class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6"
        >
          <!-- Header with status badge -->
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4"
          >
            <div>
              <div class="flex items-center space-x-3">
                <h2
                  class="text-xl font-bold font-mono text-slate-900 dark:text-white"
                >
                  {$language === "vi"
                    ? "Đơn hàng #"
                    : "Order #"}{trackedOrder.id}
                </h2>
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold {trackedOrder.status ===
                  'Connection Provided'
                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                    : trackedOrder.status === 'Feasible'
                      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                      : trackedOrder.status === 'Not Feasible'
                        ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
                        : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'}"
                >
                  {$language === "vi"
                    ? trackedOrder.status === "Connection Provided"
                      ? "Đã cấp kết nối"
                      : trackedOrder.status === "Feasible"
                        ? "Khả thi"
                        : trackedOrder.status === "Not Feasible"
                          ? "Không khả thi"
                          : "Chờ xử lý"
                    : trackedOrder.status}
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-1">
                {$language === "vi"
                  ? `Đăng ký lúc ${trackedOrder.createdAt} bởi ${trackedOrder.retailEmployeeName} (${trackedOrder.retailOutletCode})`
                  : `Submitted at ${trackedOrder.createdAt} by ${trackedOrder.retailEmployeeName} (${trackedOrder.retailOutletCode})`}
              </p>
            </div>

            <button
              onclick={() => copyToClipboard(trackedOrder!.id, "Order ID")}
              class="inline-flex items-center space-x-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg"
            >
              <Copy class="h-3.5 w-3.5" />
              <span>{$language === "vi" ? "Sao chép mã đơn" : "Copy ID"}</span>
            </button>
          </div>

          <!-- 4-Stage Visual Progress Stepper -->
          <div class="py-4">
            <div
              class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-6"
            >
              {$language === "vi"
                ? "Quy trình xử lý đơn hàng"
                : "Fulfillment Lifecycle Stepper"}
            </div>

            <div class="grid grid-cols-4 gap-2 relative">
              {#each stepperStages as st (st.step)}
                {@const stageIdx = getStageIndex(trackedOrder!.status)}
                {@const isComplete = stageIdx >= st.step}
                {@const isFailed =
                  trackedOrder!.status === "Not Feasible" && st.step >= 2}
                <div class="text-center space-y-2">
                  <div
                    class="h-10 w-10 mx-auto rounded-full flex items-center justify-center font-bold text-xs transition-colors {isFailed
                      ? 'bg-rose-500 text-white'
                      : isComplete
                        ? 'bg-emerald-600 text-white'
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
                    <div
                      class="text-xs font-bold text-slate-900 dark:text-white"
                    >
                      {$language === "vi" ? st.labelVi : st.label}
                    </div>
                    <div class="text-[11px] text-slate-500">
                      {$language === "vi" ? st.subVi : st.sub}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <!-- Order Details Grid -->
          <div
            class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-sm"
          >
            <div
              class="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
            >
              <h4 class="font-semibold text-xs text-slate-500 uppercase">
                {$language === "vi" ? "Hồ sơ khách hàng" : "Customer Profile"}
              </h4>
              <div class="space-y-1.5 text-xs">
                <div>
                  <strong>{$language === "vi" ? "Họ tên:" : "Name:"}</strong>
                  {trackedOrder.customerName}
                </div>
                <div>
                  <strong
                    >{$language === "vi" ? "Điện thoại:" : "Phone:"}</strong
                  >
                  {trackedOrder.customerPhone}
                </div>
                <div>
                  <strong>{$language === "vi" ? "Email:" : "Email:"}</strong>
                  {trackedOrder.customerEmail}
                </div>
                <div>
                  <strong
                    >{$language === "vi"
                      ? "Xác minh:"
                      : "Verification:"}</strong
                  >
                  {trackedOrder.idProofType} ({trackedOrder.idProofNumber})
                </div>
                <div>
                  <strong>{$language === "vi" ? "Địa chỉ:" : "Address:"}</strong
                  >
                  {trackedOrder.installationAddress}
                </div>
              </div>
            </div>

            <div
              class="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
            >
              <h4 class="font-semibold text-xs text-slate-500 uppercase">
                {$language === "vi"
                  ? "Dữ liệu dịch vụ & Kỹ thuật"
                  : "Service & Technical Data"}
              </h4>
              <div class="space-y-1.5 text-xs">
                <div>
                  <strong>{$language === "vi" ? "Gói cước:" : "Plan:"}</strong>
                  {getPlanName({ name: trackedOrder.planName }, $language)} ({$language ===
                  "vi"
                    ? trackedOrder.connectionType === "Broadband"
                      ? "Cáp quang"
                      : trackedOrder.connectionType === "Dial-Up"
                        ? "Quay số"
                        : "Cố định"
                    : trackedOrder.connectionType})
                </div>
                <div>
                  <strong
                    >{$language === "vi"
                      ? "Khoảng cách cáp:"
                      : "Cable Distance:"}</strong
                  >
                  {trackedOrder.cableDistanceMeters || 120}
                  {$language === "vi" ? "mét" : "meters"}
                </div>
                <div>
                  <strong
                    >{$language === "vi"
                      ? "Trạng thái hộp DP:"
                      : "DP Box Status:"}</strong
                  >
                  {trackedOrder.dpBoxCapacity ||
                    ($language === "vi"
                      ? "Còn cổng khả dụng"
                      : "Port Available")}
                </div>
                {#if trackedOrder.feasibilityNotes}
                  <div class="text-amber-600 dark:text-amber-400 pt-1">
                    <strong
                      >{$language === "vi"
                        ? "Ghi chú hiện trường:"
                        : "Field Notes:"}</strong
                    >
                    {trackedOrder.feasibilityNotes}
                  </div>
                {/if}
                {#if trackedOrder.assignedAccountId}
                  <div class="pt-2">
                    <span class="text-xs text-emerald-600 font-semibold block">
                      {$language === "vi"
                        ? "Mã tài khoản 16 ký tự đã cấp:"
                        : "Issued 16-character Account ID:"}
                    </span>
                    <span
                      class="font-mono text-base font-bold text-slate-900 dark:text-white"
                      >{trackedOrder.assignedAccountId}</span
                    >
                  </div>
                {/if}
              </div>
            </div>
          </div>
        </div>
      {:else}
        <div class="text-center py-12 text-slate-400">
          {$language === "vi"
            ? "Nhập Mã đơn hàng 11 ký tự phía trên để tra cứu tiến độ."
            : "Enter an 11-character Order ID above to inspect tracking status."}
        </div>
      {/if}
    </div>
  {/if}

  <!-- TAB 3: CONNECTION DETAILS -->
  {#if activeTab === "connection-details"}
    <div class="space-y-6">
      <!-- Advanced search: Account ID / name / type / date period / contact number -->
      <div
        class="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
      >
        <label
          class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
        >
          {$language === "vi"
            ? "Tra cứu đường truyền nâng cao — Mã tài khoản 16 ký tự (T064-000000000001), tên thuê bao, loại dịch vụ, ngày lắp đặt, số điện thoại"
            : "Advanced connection search — 16-char Account ID (T064-000000000001), name, type, install date, phone"}
        </label>

        <div class="flex gap-2">
          <div class="relative flex-1">
            <Search class="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={$language === "vi"
                ? "Mã tài khoản ví dụ T064-000000000001"
                : "Account ID e.g. T064-000000000001"}
              bind:value={accountSearchQuery}
              onkeydown={(e) => e.key === "Enter" && handleSearchConnection()}
              class="w-full pl-9 pr-4 py-2.5 text-base font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 tracking-widest"
            />
          </div>
          <button
            onclick={() => handleSearchConnection()}
            class="px-5 py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow"
          >
            {$language === "vi" ? "Tải hồ sơ" : "Retrieve Profile"}
          </button>
        </div>

        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs"
        >
          <input
            type="text"
            placeholder={$language === "vi"
              ? "Tên thuê bao"
              : "Subscriber name"}
            bind:value={advConnName}
            class="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <select
            bind:value={advConnType}
            class="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="All"
              >{$language === "vi" ? "Tất cả loại kết nối" : "Any type"}</option
            >
            <option value="Broadband"
              >{$language === "vi"
                ? "Cáp quang (Broadband)"
                : "Broadband"}</option
            >
            <option value="Dial-Up"
              >{$language === "vi" ? "Quay số (Dial-Up)" : "Dial-Up"}</option
            >
            <option value="Landline"
              >{$language === "vi"
                ? "Cố định (Landline)"
                : "Landline (Telephone)"}</option
            >
          </select>
          <input
            type="text"
            placeholder={$language === "vi"
              ? "Số điện thoại"
              : "Contact number"}
            bind:value={advConnPhone}
            class="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <input
            type="date"
            bind:value={advConnFrom}
            title={$language === "vi" ? "Lắp đặt từ ngày" : "Installed from"}
            class="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <input
            type="date"
            bind:value={advConnTo}
            title={$language === "vi" ? "Đến ngày" : "Installed to"}
            class="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div
          class="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500"
        >
          <span
            >{$language === "vi"
              ? `Kết quả (${advConnResults.length}):`
              : `Results (${advConnResults.length}):`}</span
          >
          {#each advConnResults.slice(0, 12) as c (c.accountId)}
            <button
              onclick={() => (trackedConnection = c)}
              class="font-mono text-emerald-600 dark:text-emerald-400 hover:underline bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40"
            >
              {c.accountId} · {c.customerName.split(" ")[0]} ({$language ===
              "vi"
                ? c.status === "Active"
                  ? "Hoạt động"
                  : c.status === "Temporarily Inactive"
                    ? "Tạm khóa"
                    : c.status
                : c.status})
            </button>
          {:else}
            <span class="italic"
              >{$language === "vi"
                ? "Không tìm thấy đường truyền phù hợp."
                : "No matching connections."}</span
            >
          {/each}
        </div>
      </div>

      <!-- Connection Profile Card -->
      {#if trackedConnection}
        <div
          class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6"
        >
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4"
          >
            <div>
              <div class="flex items-center space-x-3">
                <h2
                  class="text-xl font-bold font-mono text-slate-900 dark:text-white"
                >
                  {$language === "vi"
                    ? "Tài khoản #"
                    : "Account #"}{trackedConnection.accountId}
                </h2>
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold {trackedConnection.status ===
                  'Active'
                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                    : trackedConnection.status === 'Temporarily Inactive'
                      ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                      : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'}"
                >
                  {$language === "vi"
                    ? trackedConnection.status === "Active"
                      ? "Hoạt động"
                      : trackedConnection.status === "Temporarily Inactive"
                        ? "Tạm ngưng"
                        : trackedConnection.status
                    : trackedConnection.status}
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-1">
                {$language === "vi" ? "Thuê bao:" : "Subscriber:"}
                <strong class="text-slate-700 dark:text-slate-300"
                  >{trackedConnection.customerName}</strong
                >
                • {$language === "vi" ? "Kích hoạt ngày" : "Activated on"}
                {trackedConnection.installedDate}
              </p>
            </div>

            <div class="flex items-center space-x-2">
              <button
                onclick={() =>
                  copyToClipboard(trackedConnection!.accountId, "Account ID")}
                class="inline-flex items-center space-x-1 text-xs border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-white"
              >
                <Copy class="h-3.5 w-3.5" />
                <span
                  >{$language === "vi"
                    ? "Sao chép mã tài khoản"
                    : "Copy Account ID"}</span
                >
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div
              class="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2"
            >
              <div class="text-slate-400 font-semibold uppercase">
                {$language === "vi" ? "Thông số dịch vụ" : "Service Parameters"}
              </div>
              <div>
                <strong>{$language === "vi" ? "Gói cước:" : "Plan:"}</strong>
                {getPlanName({ name: trackedConnection.planName }, $language)}
              </div>
              <div>
                <strong
                  >{$language === "vi"
                    ? "Loại kết nối:"
                    : "Connection:"}</strong
                >
                {$language === "vi"
                  ? trackedConnection.connectionType === "Broadband"
                    ? "Cáp quang (Broadband)"
                    : trackedConnection.connectionType === "Dial-Up"
                      ? "Quay số (Dial-Up)"
                      : "Cố định (Landline)"
                  : trackedConnection.connectionType}
              </div>
              <div>
                <strong
                  >{$language === "vi"
                    ? "Cước thuê tháng:"
                    : "Monthly Rental:"}</strong
                >
                ${trackedConnection.monthlyRental.toFixed(2)}
              </div>
              <div>
                <strong
                  >{$language === "vi"
                    ? "Tiền đặt cọc:"
                    : "Security Deposit:"}</strong
                >
                ${trackedConnection.securityDeposit.toFixed(2)}
              </div>
            </div>

            <div
              class="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2"
            >
              <div class="text-slate-400 font-semibold uppercase">
                {$language === "vi"
                  ? "Dữ liệu vật lý & Tuyến cáp"
                  : "Physical & Circuit Data"}
              </div>
              <div>
                <strong
                  >{$language === "vi"
                    ? "Địa chỉ IP cấp:"
                    : "Assigned IP:"}</strong
                >
                {trackedConnection.ipAddress || "Dynamic DHCP"}
              </div>
              <div>
                <strong
                  >{$language === "vi"
                    ? "Cổng Switch:"
                    : "Switch Port:"}</strong
                >
                {trackedConnection.portNumber || "PON-01"}
              </div>
              <div>
                <strong
                  >{$language === "vi"
                    ? "Thiết bị cấp:"
                    : "Assigned Device:"}</strong
                >
                {trackedConnection.assignedDeviceModel || "Standard CPE"}
              </div>
              <div class="font-mono">
                <strong>{$language === "vi" ? "Số sê-ri:" : "Serial:"}</strong>
                {trackedConnection.assignedDeviceSerial || "NX-AUTO-GEN"}
              </div>
            </div>

            <div
              class="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2"
            >
              <div class="text-slate-400 font-semibold uppercase">
                {$language === "vi" ? "Liên hệ & Địa chỉ" : "Contact & Address"}
              </div>
              <div>
                <strong>{$language === "vi" ? "Điện thoại:" : "Phone:"}</strong>
                {trackedConnection.customerPhone}
              </div>
              <div>
                <strong>{$language === "vi" ? "Email:" : "Email:"}</strong>
                {trackedConnection.customerEmail}
              </div>
              <div>
                <strong
                  >{$language === "vi"
                    ? "Địa chỉ lắp đặt:"
                    : "Installation:"}</strong
                >
                {trackedConnection.installationAddress}
              </div>
              {#if trackedConnection.lastStatusReason}
                <div class="text-amber-500 pt-1">
                  <strong>{$language === "vi" ? "Lý do:" : "Reason:"}</strong>
                  {trackedConnection.lastStatusReason}
                </div>
              {/if}
            </div>
          </div>
        </div>
      {:else}
        <div class="text-center py-12 text-slate-400">
          {$language === "vi"
            ? "Nhập mã tài khoản 16 ký tự phía trên để tra cứu hồ sơ đường truyền."
            : "Enter a 16-character Account ID above to retrieve connection details."}
        </div>
      {/if}
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

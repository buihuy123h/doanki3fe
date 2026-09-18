<script lang="ts">
  // Mirrors pages/RetailDashboard.tsx of the React original.
  // NOTE: the React source declares duplicate navItems (hardcoded VI + i18n);
  // here we keep only the i18n entries (intended behavior).
  import { nexusStore } from "../context/NexusContext";
  import { authStore } from "../context/AuthContext";
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
    RotateCcw,
    ArrowDownUp,
    Wrench,
    UserPlus,
    UserCheck,
    HardHat,
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
  import { orderStatusLabel, orderStatusTone } from "../types/nexus";
  import { toast } from "svelte-sonner";
  import { queryParam, activeTabOverride } from "../lib/router";
  import {
    getPlanName,
    getPlanDescription,
    getPlanSpeedOrBandwidth,
  } from "../lib/planI18n";

  type RetailTab =
    | "new-order"
    | "approval-queue"
    | "order-tracking"
    | "connection-details"
    | "payment-records"
    | "settings"
    | "profile";

  const {
    plans,
    placeOrder,
    assignTechnicianToOrder,
    approveOrderByRetail,
    rejectOrderByRetail,
    resubmitOrderToRetail,
    orders,
    connections,
    bills,
    recordPayment,
    employees,
    retailShops,
  } = nexusStore;
  const { currentUser } = authStore;
  const { t, language } = languageStore;

  // Active navigation tab
  let activeTab = $state<RetailTab>("new-order");

  // Reactively respond to tab overrides from router / notifications
  $effect(() => {
    const override = $activeTabOverride;
    const validTabs: RetailTab[] = [
      "new-order",
      "approval-queue",
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
  // Bulk / corporate scheme + Dial-Up existing landline (default 1 connection, adjustable for corporate)
  let bulkConnectionsCount = $state(1);
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
  let orderBranchFilter = $state<"All" | string>("All");
  let orderSortOrder = $state<string>("newest");
  let expandedOrderId = $state<string | null>(null);

  // ---- STAGE 1: RETAIL APPROVAL QUEUE (xét duyệt hồ sơ tại chi nhánh) ----
  type ApprovalFilter = "Awaiting" | "Approved" | "Rejected" | "All";
  let approvalFilter = $state<ApprovalFilter>("All");
  let approvalSearch = $state("");
  let viewAllBranchesScope = $state(false);

  // Rejection modal (a reason is mandatory before an application can be bounced).
  let isRejectModalOpen = $state(false);
  let orderToReject = $state<Order | null>(null);
  let rejectReason = $state("");

  // Manager/admin roles are not tied to one outlet and may see every branch.
  const canSeeAllBranches = $derived(
    $currentUser?.role === "admin" || $currentUser?.role === "technical",
  );

  // Extracts a shop code like "SH-01" out of free text such as
  // "Downtown Flagship (SH-01)" or "Retail Outlets (SH-01 Flagship)".
  const shopCodeFrom = (text?: string): string | null => {
    const m = (text ?? "").toUpperCase().match(/\b(SH-\d+)\b/);
    return m ? m[1] : null;
  };

  // Which branch does the signed-in staff belong to? Backend logins carry the real
  // EmployeeID (emp-02) but no store code, so resolve it from the employee directory
  // first and fall back to the demo session's department string.
  const activeBranchCode = $derived.by(() => {
    const user = $currentUser;
    if (!user || canSeeAllBranches) return null;
    if (user.branchCode)
      return shopCodeFrom(user.branchCode) ?? user.branchCode;

    const byId = $employees.find(
      (e) => e.id.toLowerCase() === (user.id ?? "").toLowerCase(),
    );
    const byEmail = byId
      ? undefined
      : $employees.find(
          (e) => e.email.toLowerCase() === (user.email ?? "").toLowerCase(),
        );
    const record = byId ?? byEmail;
    if (record) {
      const fromShop = shopCodeFrom(record.retailShopAssigned);
      if (fromShop) return fromShop;
    }
    return shopCodeFrom(user.department) ?? shopCodeFrom(user.title);
  });

  const activeBranchShop = $derived(
    activeBranchCode
      ? ($retailShops.find((s) => s.shopCode === activeBranchCode) ?? null)
      : null,
  );

  // Every application that belongs to this desk: matched by the routed employee id,
  // by branch code, or (for self-service sign-ups) by the branch the customer picked.
  // When an employee searches for a customer name or order ID, allow matching across all branches.
  const branchScopedOrders = $derived(
    $orders.filter((o) => {
      if (canSeeAllBranches || viewAllBranchesScope || !activeBranchCode)
        return true;
      const q = (orderSearchQuery || approvalSearch).trim().toLowerCase();
      if (
        q &&
        (o.id.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.includes(q))
      ) {
        return true;
      }
      const routed = o.assignedEmployeeId
        ? o.assignedEmployeeId.toLowerCase() ===
          ($currentUser?.id ?? "").toLowerCase()
        : false;
      return routed || o.retailOutletCode?.toUpperCase() === activeBranchCode;
    }),
  );

  const approvalQueueOrders = $derived(
    branchScopedOrders.filter((o) => {
      const q = approvalSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
        o.installationAddress.toLowerCase().includes(q) ||
        o.idProofNumber.toLowerCase().includes(q);

      const bucket =
        o.status === "PendingRetail"
          ? "Awaiting"
          : o.status === "Not Approved"
            ? "Rejected"
            : "Approved";
      const matchesFilter =
        approvalFilter === "All" || approvalFilter === bucket;
      return matchesSearch && matchesFilter;
    }),
  );

  const awaitingApprovalCount = $derived(
    branchScopedOrders.filter((o) => o.status === "PendingRetail").length,
  );
  const approvedByBranchCount = $derived(
    branchScopedOrders.filter(
      (o) => o.retailApprovedBy && o.status !== "Not Approved",
    ).length,
  );
  const rejectedByBranchCount = $derived(
    branchScopedOrders.filter((o) => o.status === "Not Approved").length,
  );

  const handleApproveOrder = (order: Order) => {
    const who = $currentUser?.name || order.retailEmployeeName || "Retail Desk";
    const updated = approveOrderByRetail(order.id, who);
    if (!updated) {
      toast.error(
        $language === "vi"
          ? "Đơn này không còn ở hàng đợi chờ duyệt."
          : "This order is no longer in the approval queue.",
      );
      return;
    }
    toast.success(
      $language === "vi"
        ? `Đã duyệt hồ sơ ${order.id} — chuyển sang hàng đợi khảo sát kỹ thuật.`
        : `Approved ${order.id} — released to the technical feasibility queue.`,
    );
  };

  const handleOpenRejectModal = (order: Order) => {
    orderToReject = order;
    rejectReason = "";
    isRejectModalOpen = true;
  };

  const handleConfirmReject = (e: SubmitEvent) => {
    e.preventDefault();
    if (!orderToReject) return;
    if (!rejectReason.trim()) {
      toast.error(
        $language === "vi"
          ? "Vui lòng nhập lý do trả hồ sơ."
          : "A reason is required when bouncing an application.",
      );
      return;
    }
    const who =
      $currentUser?.name || orderToReject.retailEmployeeName || "Retail Desk";
    const rejected = rejectOrderByRetail(orderToReject.id, who, rejectReason);
    if (!rejected) {
      toast.error(
        $language === "vi"
          ? "Đơn này không còn ở hàng đợi chờ duyệt."
          : "This order is no longer in the approval queue.",
      );
    } else {
      toast.error(
        $language === "vi"
          ? `Đã trả hồ sơ ${orderToReject.id} cho khách hàng.`
          : `Returned ${orderToReject.id} to the customer.`,
      );
    }
    isRejectModalOpen = false;
    orderToReject = null;
    rejectReason = "";
  };

  const handleResubmitOrder = (order: Order) => {
    const updated = resubmitOrderToRetail(order.id);
    if (updated) {
      toast.success(
        $language === "vi"
          ? `Đã ghi nhận lại hồ sơ ${order.id} vào hàng đợi chờ duyệt.`
          : `Re-queued ${order.id} for approval.`,
      );
    }
  };

  // Pill colours read straight from the template (no {@const} needed inside <td>).
  const statusChip = (s: Order["status"]) => orderStatusTone(s).chip;
  const statusDot = (s: Order["status"]) => orderStatusTone(s).dot;

  // Source orders for Order Tracking: respects branch scope filter or shows all branches by default
  const trackingSourceOrders = $derived(
    orderBranchFilter === "All"
      ? $orders
      : $orders.filter(
          (o) =>
            o.retailOutletCode?.toUpperCase() ===
              orderBranchFilter.toUpperCase() ||
            (activeBranchCode &&
              o.retailOutletCode?.toUpperCase() ===
                activeBranchCode.toUpperCase()),
        ),
  );

  // Latest orders for quick-pick tags: ALWAYS computed from all orders, sorted newest first!
  const latestOrderTags = $derived(
    [...$orders]
      .sort((a, b) => {
        const timeA = a.createdAt || "";
        const timeB = b.createdAt || "";
        return timeB.localeCompare(timeA) || b.id.localeCompare(a.id);
      })
      .slice(0, 10),
  );

  // Dynamic counts for Connection Types (computed from trackingSourceOrders)
  const connectionTypeCounts = $derived({
    All: trackingSourceOrders.length,
    Broadband: trackingSourceOrders.filter(
      (o) =>
        o.connectionType === "Broadband" ||
        o.id.toUpperCase().startsWith("B") ||
        o.connectionType?.toLowerCase().includes("broadband"),
    ).length,
    Landline: trackingSourceOrders.filter(
      (o) =>
        o.connectionType === "Landline" ||
        o.id.toUpperCase().startsWith("T") ||
        o.connectionType?.toLowerCase().includes("landline") ||
        o.connectionType?.toLowerCase().includes("phone"),
    ).length,
    "Dial-Up": trackingSourceOrders.filter(
      (o) =>
        o.connectionType === "Dial-Up" ||
        o.id.toUpperCase().startsWith("D") ||
        o.connectionType?.toLowerCase().includes("dial"),
    ).length,
  });

  // Reset all filters in Order Tracking (used when clicking "Tất cả" / "Làm mới")
  const handleResetAllOrderFilters = () => {
    orderSearchQuery = "";
    orderStatusFilter = "All";
    orderTypeFilter = "All";
    orderBranchFilter = "All";
    orderSortOrder = "newest";
    expandedOrderId = null;
    toast.info(
      $language === "vi"
        ? "Đã hiển thị toàn bộ danh sách đơn hàng"
        : "Showing all orders in registry",
    );
  };

  // Handle change of sort/status select dropdown
  const handleOrderSortChange = (value: string) => {
    orderSortOrder = value;
    if (value === "newest" || value === "oldest") {
      orderStatusFilter = "All";
    } else {
      orderStatusFilter = value as Order["status"];
    }
  };

  // Toggle or select a quick-pick latest order tag
  const handleToggleOrderTag = (orderId: string) => {
    if (orderSearchQuery.trim().toUpperCase() === orderId.toUpperCase()) {
      // Toggle off -> show all
      orderSearchQuery = "";
      expandedOrderId = null;
      toast.info(
        $language === "vi"
          ? "Đã bỏ chọn mã đơn, hiển thị tất cả"
          : "Deselected order tag, showing all",
      );
    } else {
      // Set to clicked order and expand it
      orderSearchQuery = orderId;
      expandedOrderId = orderId;
      // Clear status/type filters that could hide this order
      orderStatusFilter = "All";
      orderTypeFilter = "All";
      orderBranchFilter = "All";
    }
  };

  // When connection type filter changes, if search query was an exact order ID of another type, clear it
  const handleConnectionTypeChange = (newType: "All" | ConnectionType) => {
    orderTypeFilter = newType;
    if (orderSearchQuery) {
      const qUpper = orderSearchQuery.trim().toUpperCase();
      if (
        (newType === "Broadband" && !qUpper.startsWith("B")) ||
        (newType === "Dial-Up" && !qUpper.startsWith("D")) ||
        (newType === "Landline" && !qUpper.startsWith("T"))
      ) {
        orderSearchQuery = "";
      }
    }
  };

  const filteredTrackedOrders = $derived(
    trackingSourceOrders
      .filter((o) => {
        const q = orderSearchQuery.trim().toLowerCase();
        const matchesSearch =
          !q ||
          o.id.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
          o.customerEmail.toLowerCase().includes(q) ||
          o.installationAddress.toLowerCase().includes(q) ||
          (o.assignedAccountId &&
            o.assignedAccountId.toLowerCase().includes(q));

        const matchesStatus =
          orderStatusFilter === "All" || o.status === orderStatusFilter;

        const matchesType =
          orderTypeFilter === "All" ||
          o.connectionType === orderTypeFilter ||
          (orderTypeFilter === "Broadband" &&
            (o.id.toUpperCase().startsWith("B") ||
              o.connectionType?.toLowerCase().includes("broadband"))) ||
          (orderTypeFilter === "Dial-Up" &&
            (o.id.toUpperCase().startsWith("D") ||
              o.connectionType?.toLowerCase().includes("dial"))) ||
          (orderTypeFilter === "Landline" &&
            (o.id.toUpperCase().startsWith("T") ||
              o.connectionType?.toLowerCase().includes("landline") ||
              o.connectionType?.toLowerCase().includes("phone")));

        return matchesSearch && matchesStatus && matchesType;
      })
      .sort((a, b) => {
        const timeA = a.createdAt || "";
        const timeB = b.createdAt || "";
        if (orderSortOrder === "oldest") {
          return timeA.localeCompare(timeB) || a.id.localeCompare(b.id);
        } else {
          return timeB.localeCompare(timeA) || b.id.localeCompare(a.id);
        }
      }),
  );

  const toggleOrderDropdown = (orderId: string) => {
    if (expandedOrderId === orderId) {
      expandedOrderId = null;
    } else {
      expandedOrderId = orderId;
    }
  };

  // ==================== PHÂN CÔNG KỸ THUẬT VIÊN KHẢO SÁT ====================
  let isAssignTechModalOpen = $state(false);
  let targetOrderForTechAssign = $state<Order | null>(null);
  let selectedTechnicianId = $state("");
  let assignSurveyNotes = $state("");
  let techSearchQuery = $state("");

  // Danh sách kỹ thuật viên hiện trường khả dụng (Lọc từ $employees)
  const availableTechnicians = $derived(
    $employees.filter(
      (e) =>
        (e.role === "Field Engineer" ||
          e.department === "Technical Operations") &&
        e.status === "Active",
    ),
  );

  const filteredAvailableTechnicians = $derived(
    availableTechnicians.filter((tech) => {
      if (!techSearchQuery.trim()) return true;
      const q = techSearchQuery.toLowerCase();
      return (
        tech.name.toLowerCase().includes(q) ||
        tech.employeeCode.toLowerCase().includes(q) ||
        (tech.retailShopAssigned &&
          tech.retailShopAssigned.toLowerCase().includes(q))
      );
    }),
  );

  const getTechnicianPendingCount = (techName: string): number => {
    return $orders.filter(
      (o) =>
        o.assignedTechnician === techName &&
        (o.status === "Pending" || o.status === "PendingRetail"),
    ).length;
  };

  const openAssignTechnicianModal = (order: Order) => {
    targetOrderForTechAssign = order;
    if (order.assignedTechnicianId) {
      selectedTechnicianId = order.assignedTechnicianId;
    } else if (order.assignedTechnician) {
      const matched = availableTechnicians.find(
        (t) => t.name === order.assignedTechnician,
      );
      selectedTechnicianId = matched
        ? matched.id
        : availableTechnicians[0]?.id || "";
    } else {
      // Ưu tiên chọn KTV thuộc chi nhánh của đơn hàng nếu có
      const branchTech = availableTechnicians.find(
        (t) =>
          t.retailShopAssigned &&
          t.retailShopAssigned.includes(order.retailOutletCode),
      );
      selectedTechnicianId = branchTech
        ? branchTech.id
        : availableTechnicians[0]?.id || "";
    }
    assignSurveyNotes = "";
    techSearchQuery = "";
    isAssignTechModalOpen = true;
  };

  const handleConfirmAssignTechnician = () => {
    if (!targetOrderForTechAssign || !selectedTechnicianId) {
      toast.error(
        $language === "vi"
          ? "Vui lòng chọn kỹ thuật viên khảo sát!"
          : "Please select a survey technician!",
      );
      return;
    }
    const tech = availableTechnicians.find(
      (t) => t.id === selectedTechnicianId,
    );
    if (!tech) return;

    const res = assignTechnicianToOrder(
      targetOrderForTechAssign.id,
      tech.name,
      tech.id,
      tech.phone,
      assignSurveyNotes.trim() || undefined,
    );

    if (res) {
      toast.success(
        $language === "vi"
          ? `Đã phân công kỹ thuật viên ${tech.name} (${tech.employeeCode}) đảm nhiệm khảo sát đơn ${targetOrderForTechAssign.id}!`
          : `Assigned technician ${tech.name} (${tech.employeeCode}) for order ${targetOrderForTechAssign.id}!`,
      );
      isAssignTechModalOpen = false;
      targetOrderForTechAssign = null;
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
        (c.assignedDeviceSerial &&
          c.assignedDeviceSerial.toLowerCase().includes(q)) ||
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
        c.customerName
          .toLowerCase()
          .includes(connSearchQuery.trim().toLowerCase()),
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
      // Route to the desk the clerk actually works at; fall back to the flagship.
      retailOutletCode: activeBranchCode ?? "SH-01",
      retailEmployeeName: $currentUser?.name || "David Chen",
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

  // Calculate order progress index across the two-stage pipeline. The value is the
  // highest stepper step that is COMPLETE (1-based, see stepperStages).
  //   PendingRetail -> 1 (logged, waiting on the branch desk)
  //   Pending       -> 2 (retail approved, waiting on Technical)
  //   Feasible      -> 3 (surveyed feasible)
  //   Conn. Provided-> 5 (dispatched + live)
  // Rejected at either stage returns -1.
  const getStageIndex = (status: Order["status"]) => {
    switch (status) {
      case "PendingRetail":
        return 1;
      case "Not Approved":
        return -1;
      case "Pending":
        return 2;
      case "Feasible":
        return 3;
      case "Connection Provided":
        return 5;
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
      label: "Retail Approved",
      labelVi: "Bán hàng duyệt hồ sơ",
      sub: "Branch Desk",
      subVi: "Chi nhánh phụ trách",
    },
    {
      step: 3,
      label: "Feasibility Checked",
      labelVi: "Kỹ thuật khảo sát khả thi",
      sub: "Field Telemetry",
      subVi: "Đo lường hiện trường",
    },
    {
      step: 4,
      label: "Tech Dispatch",
      labelVi: "Điều phối kỹ thuật",
      sub: "CPE & Port Bind",
      subVi: "Gắn cổng & CPE",
    },
    {
      step: 5,
      label: "Connection Live",
      labelVi: "Đường truyền hoạt động",
      sub: "16-char Account",
      subVi: "Mã tài khoản 16 ký tự",
    },
  ];

  const retailNavItems: NavItem[] = $derived([
    { id: "new-order", label: $t.retailNav.newOrder, icon: ShoppingBag },
    {
      id: "approval-queue",
      label:
        $language === "vi" ? "Duyệt hồ sơ chi nhánh" : "Branch Approval Queue",
      icon: FileText,
      badge: awaitingApprovalCount,
      badgeColor: "bg-amber-100 text-amber-900",
    },
    {
      id: "order-tracking",
      label: $t.retailNav.orderTracking,
      icon: Clock,
      badge: branchScopedOrders.length,
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

  <!-- TAB 1.5: BRANCH RETAIL APPROVAL QUEUE (tầng 1 - bán hàng xét duyệt hồ sơ) -->
  {#if activeTab === "approval-queue"}
    <div class="space-y-5">
      <!-- Desk identity banner -->
      <div
        class="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/20 p-5"
      >
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div class="flex items-start gap-3">
            <div
              class="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
            >
              <FileText class="h-5 w-5" />
            </div>
            <div>
              <h2 class="text-base font-bold text-slate-900 dark:text-white">
                {$language === "vi"
                  ? "Hàng đợi xét duyệt hồ sơ"
                  : "Application Approval Queue"}
              </h2>
              <p class="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {#if activeBranchShop}
                  {$language === "vi" ? "Chi nhánh" : "Branch"}: {activeBranchShop.name}
                  ({activeBranchShop.shopCode}) · {activeBranchShop.address}
                {:else}
                  {$language === "vi"
                    ? "Toàn bộ chi nhánh (vai trò quản lý — xem mọi đơn của mọi cửa hàng)."
                    : "All branches (manager scope — viewing every outlet's applications)."}
                {/if}
              </p>
            </div>
          </div>
          <div class="text-left sm:text-right">
            <div
              class="text-[11px] font-mono uppercase tracking-wider text-amber-700 dark:text-amber-400"
            >
              {$language === "vi" ? "Trạng thái phiên" : "Session"}
            </div>
            <div class="text-sm font-bold text-slate-900 dark:text-white">
              {$currentUser?.name ?? "—"}
            </div>
            <div
              class="text-[11px] text-slate-500 dark:text-slate-400 font-mono"
            >
              {$currentUser?.email ?? ""}
            </div>
          </div>
        </div>
        <p
          class="text-[11px] text-amber-800 dark:text-amber-300 mt-3 leading-relaxed"
        >
          {$language === "vi"
            ? "Đơn chỉ được chuyển sang bộ phận Kỹ thuật sau khi bàn này duyệt. Từ chối sẽ trả hồ sơ về khách hàng và đơn không bao giờ xuất hiện ở hàng đợi khảo sát."
            : "An order only reaches Technical once this desk approves it. Rejecting returns the paperwork to the customer and the order never appears in the survey queue."}
        </p>
      </div>

      <!-- KPI mini cards -->
      <div class="grid grid-cols-3 gap-3">
        <div
          class="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 shadow-sm"
        >
          <div
            class="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400"
          >
            {$language === "vi" ? "Chờ duyệt" : "Awaiting"}
          </div>
          <div
            class="text-2xl font-bold font-mono text-amber-700 dark:text-amber-400 mt-1"
          >
            {awaitingApprovalCount}
          </div>
        </div>
        <div
          class="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/40 shadow-sm"
        >
          <div
            class="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400"
          >
            {$language === "vi" ? "Đã chuyển kỹ thuật" : "Released"}
          </div>
          <div
            class="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1"
          >
            {approvedByBranchCount}
          </div>
        </div>
        <div
          class="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 shadow-sm"
        >
          <div
            class="text-[10px] font-mono uppercase tracking-wider text-rose-600 dark:text-rose-400"
          >
            {$language === "vi" ? "Đã trả hồ sơ" : "Returned"}
          </div>
          <div
            class="text-2xl font-bold font-mono text-rose-700 dark:text-rose-400 mt-1"
          >
            {rejectedByBranchCount}
          </div>
        </div>
      </div>

      <!-- Search + bucket filter -->
      <div
        class="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 md:items-center"
      >
        <div class="relative flex-1">
          <Search class="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={$language === "vi"
              ? "Tìm theo mã đơn, tên khách, SĐT, địa chỉ, số giấy tờ..."
              : "Search by order ID, customer, phone, address, ID number..."}
            bind:value={approvalSearch}
            class="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
          />
        </div>
        <div
          class="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap"
        >
          {#each [["Awaiting", "Chờ duyệt"], ["Approved", "Đã duyệt"], ["Rejected", "Đã trả"], ["All", "Tất cả"]] as [key, labelVi] (key)}
            <button
              onclick={() => (approvalFilter = key as ApprovalFilter)}
              class="px-2.5 py-1 text-xs font-medium rounded-lg transition {approvalFilter ===
              key
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}"
            >
              {$language === "vi" ? labelVi : key}
            </button>
          {/each}
        </div>
      </div>

      <!-- Queue table -->
      <div
        class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
      >
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead
              class="bg-slate-50 dark:bg-slate-950/80 text-[11px] font-mono text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800"
            >
              <tr>
                <th class="px-4 py-3"
                  >{$language === "vi" ? "Mã đơn" : "Order ID"}</th
                >
                <th class="px-4 py-3"
                  >{$language === "vi"
                    ? "Khách hàng & Địa chỉ"
                    : "Customer & Address"}</th
                >
                <th class="px-4 py-3"
                  >{$language === "vi" ? "Giấy tờ tùy thân" : "ID Document"}</th
                >
                <th class="px-4 py-3"
                  >{$language === "vi" ? "Gói cước" : "Plan"}</th
                >
                <th class="px-4 py-3"
                  >{$language === "vi" ? "Trạng thái" : "Status"}</th
                >
                <th class="px-4 py-3 text-right"
                  >{$language === "vi" ? "Thao tác" : "Actions"}</th
                >
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
              {#if approvalQueueOrders.length === 0}
                <tr>
                  <td colspan="6" class="px-4 py-14 text-center">
                    <CheckCircle2
                      class="h-9 w-9 mx-auto text-slate-300 dark:text-slate-700 mb-2"
                    />
                    <div
                      class="text-sm font-semibold text-slate-600 dark:text-slate-400"
                    >
                      {$language === "vi"
                        ? "Không có hồ sơ nào ở trạng thái này."
                        : "No applications in this state."}
                    </div>
                  </td>
                </tr>
              {:else}
                {#each approvalQueueOrders as o (o.id)}
                  <tr
                    class="hover:bg-amber-50/40 dark:hover:bg-amber-950/10 transition-colors"
                  >
                    <td class="px-4 py-3.5 align-top">
                      <div
                        class="font-mono font-bold text-emerald-600 dark:text-emerald-400"
                      >
                        {o.id}
                      </div>
                      <div
                        class="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5"
                      >
                        {o.createdAt}
                      </div>
                    </td>
                    <td class="px-4 py-3.5 align-top">
                      <div class="font-semibold text-slate-900 dark:text-white">
                        {o.customerName}
                      </div>
                      <div
                        class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1"
                      >
                        {o.installationAddress}
                      </div>
                      <div
                        class="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5"
                      >
                        {o.customerPhone}
                      </div>
                    </td>
                    <td class="px-4 py-3.5 align-top">
                      <div class="text-xs text-slate-700 dark:text-slate-300">
                        {o.idProofType}
                      </div>
                      <div
                        class="text-[11px] font-mono text-slate-500 dark:text-slate-400"
                      >
                        {o.idProofNumber}
                      </div>
                    </td>
                    <td class="px-4 py-3.5 align-top">
                      <div
                        class="text-xs font-medium text-slate-800 dark:text-slate-200"
                      >
                        {getPlanName({ name: o.planName }, $language)}
                      </div>
                      <div
                        class="text-[11px] text-slate-500 dark:text-slate-400"
                      >
                        {o.connectionType} · {o.retailOutletCode}
                      </div>
                    </td>
                    <td class="px-4 py-3.5 align-top">
                      {#if o.status === "PendingRetail"}
                        <span
                          class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                        >
                          {$language === "vi" ? "Chờ duyệt" : "Awaiting"}
                        </span>
                      {:else if o.status === "Not Approved"}
                        <span
                          class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                        >
                          {$language === "vi" ? "Đã trả hồ sơ" : "Returned"}
                        </span>
                        {#if o.retailRejectionReason}
                          <div
                            class="text-[10px] text-rose-600 dark:text-rose-400 mt-1 max-w-[220px] leading-snug"
                          >
                            {o.retailRejectionReason}
                          </div>
                        {/if}
                      {:else}
                        <span
                          class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                        >
                          {$language === "vi"
                            ? "Đã chuyển kỹ thuật"
                            : "Released"}
                        </span>
                        {#if o.retailApprovedBy}
                          <div
                            class="text-[10px] text-slate-500 dark:text-slate-400 mt-1"
                          >
                            {o.retailApprovedBy} · {o.retailApprovedAt}
                          </div>
                        {/if}
                      {/if}
                    </td>
                    <td
                      class="px-4 py-3.5 align-top text-right whitespace-nowrap"
                    >
                      {#if o.status === "PendingRetail"}
                        <button
                          onclick={() => handleApproveOrder(o)}
                          class="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs"
                        >
                          {$language === "vi"
                            ? "Duyệt & chuyển kỹ thuật"
                            : "Approve & Release"}
                        </button>
                        <button
                          onclick={() => handleOpenRejectModal(o)}
                          class="ml-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 transition"
                        >
                          {$language === "vi" ? "Từ chối" : "Reject"}
                        </button>
                      {:else if o.status === "Not Approved"}
                        <button
                          onclick={() => handleResubmitOrder(o)}
                          class="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
                        >
                          {$language === "vi"
                            ? "Đưa lại vào hàng đợi"
                            : "Re-queue"}
                        </button>
                      {:else}
                        <button
                          onclick={() => {
                            activeTab = "order-tracking";
                            orderSearchQuery = o.id;
                            expandedOrderId = o.id;
                          }}
                          class="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
                        >
                          {$language === "vi" ? "Xem tiến độ" : "View Progress"}
                        </button>
                      {/if}
                    </td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  {/if}

  <!-- Rejection reason modal (STAGE 1) -->
  {#if isRejectModalOpen && orderToReject}
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
    >
      <form
        onsubmit={handleConfirmReject}
        class="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-rose-300 dark:border-rose-800 shadow-2xl p-6 space-y-4"
      >
        <div class="flex items-start gap-3">
          <div
            class="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 shrink-0"
          >
            <XCircle class="h-5 w-5" />
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white">
              {$language === "vi" ? "Trả hồ sơ" : "Return application"}
              {orderToReject.id}
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {$language === "vi"
                ? "Nêu rõ lý do để khách hàng bổ sung giấy tờ. Đơn sẽ không được chuyển sang Kỹ thuật."
                : "Give a clear reason so the customer can fix the paperwork. The order will not reach Technical."}
            </p>
          </div>
        </div>

        <div>
          <label
            class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
          >
            {$language === "vi" ? "Lý do trả hồ sơ *" : "Rejection reason *"}
          </label>
          <textarea
            bind:value={rejectReason}
            rows="4"
            required
            placeholder={$language === "vi"
              ? "VD: Giấy tờ tùy thân hết hạn, thiếu giấy tờ chứng minh quyền sử dụng địa chỉ lắp đặt..."
              : "e.g. ID document expired; proof of tenure at the installation address missing..."}
            class="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
          ></textarea>
        </div>

        <div class="flex items-center justify-end gap-2">
          <button
            type="button"
            onclick={() => {
              isRejectModalOpen = false;
              orderToReject = null;
            }}
            class="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {$language === "vi" ? "Hủy" : "Cancel"}
          </button>
          <button
            type="submit"
            class="px-4 py-2 rounded-lg text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white transition shadow"
          >
            {$language === "vi" ? "Xác nhận trả hồ sơ" : "Confirm Rejection"}
          </button>
        </div>
      </form>
    </div>
  {/if}

  <!-- TAB 2: ORDER TRACKING -->
  {#if activeTab === "order-tracking"}
    <div class="space-y-6">
      <!-- 1. KPI Summary Cards (6 tiles: one per pipeline stage) -->
      <div
        class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4"
      >
        <!-- Total Orders -->
        <div
          class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div
            class="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between"
          >
            <span
              >{$language === "vi" ? "Tổng số đơn hàng" : "Total Orders"}</span
            >
            <ShoppingBag class="h-3.5 w-3.5 text-slate-400" />
          </div>
          <div
            class="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1.5"
          >
            {trackingSourceOrders.length}
            <span class="text-xs font-normal text-slate-400 ml-1"
              >{$language === "vi" ? "đơn" : "orders"}</span
            >
          </div>
          <div class="text-[10px] text-slate-500 mt-1">
            {$language === "vi" ? "Cập nhật thời gian thực" : "Real-time sync"}
          </div>
        </div>

        <!-- Connection Provided -->
        <div
          class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/40 shadow-sm"
        >
          <div
            class="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center justify-between"
          >
            <span>{$language === "vi" ? "Đã cấp kết nối" : "Provided"}</span>
            <CheckCircle2 class="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <div
            class="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1.5"
          >
            {trackingSourceOrders.filter(
              (o) => o.status === "Connection Provided",
            ).length}
            <span class="text-xs font-normal text-emerald-600/70 ml-1"
              >{$language === "vi" ? "hoàn tất" : "active"}</span
            >
          </div>
          <div
            class="text-[10px] text-emerald-600/80 dark:text-emerald-500 mt-1"
          >
            {$language === "vi"
              ? "Đã phát hành Account ID"
              : "Account ID issued"}
          </div>
        </div>

        <!-- Feasible -->
        <div
          class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-900/40 shadow-sm"
        >
          <div
            class="text-[11px] font-mono text-sky-600 dark:text-sky-400 uppercase tracking-wider flex items-center justify-between"
          >
            <span>{$language === "vi" ? "Khảo sát khả thi" : "Feasible"}</span>
            <Activity class="h-3.5 w-3.5 text-sky-500" />
          </div>
          <div
            class="text-2xl font-bold font-mono text-sky-600 dark:text-sky-400 mt-1.5"
          >
            {trackingSourceOrders.filter((o) => o.status === "Feasible").length}
            <span class="text-xs font-normal text-sky-600/70 ml-1"
              >{$language === "vi" ? "khả thi" : "ready"}</span
            >
          </div>
          <div class="text-[10px] text-sky-600/80 dark:text-sky-500 mt-1">
            {$language === "vi" ? "Chờ kỹ thuật đấu nối" : "Ready for dispatch"}
          </div>
        </div>

        <!-- Awaiting retail approval (STAGE 1) -->
        <div
          class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 shadow-sm"
        >
          <div
            class="text-[11px] font-mono text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center justify-between"
          >
            <span
              >{$language === "vi"
                ? "Chờ bán hàng duyệt"
                : "Awaiting Retail"}</span
            >
            <FileText class="h-3.5 w-3.5 text-amber-500" />
          </div>
          <div
            class="text-2xl font-bold font-mono text-amber-700 dark:text-amber-400 mt-1.5"
          >
            {trackingSourceOrders.filter((o) => o.status === "PendingRetail")
              .length}
            <span class="text-xs font-normal text-amber-600/70 ml-1"
              >{$language === "vi" ? "hồ sơ" : "apps"}</span
            >
          </div>
          <div class="text-[10px] text-amber-600/80 dark:text-amber-500 mt-1">
            {$language === "vi"
              ? "Bàn chi nhánh kiểm tra hồ sơ"
              : "Branch desk paperwork check"}
          </div>
        </div>

        <!-- Cleared by retail, awaiting Technical (STAGE 2) -->
        <div
          class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-900/40 shadow-sm"
        >
          <div
            class="text-[11px] font-mono text-violet-600 dark:text-violet-400 uppercase tracking-wider flex items-center justify-between"
          >
            <span>{$language === "vi" ? "Chờ kỹ thuật" : "Pending Survey"}</span
            >
            <Clock class="h-3.5 w-3.5 text-violet-500" />
          </div>
          <div
            class="text-2xl font-bold font-mono text-violet-700 dark:text-violet-400 mt-1.5"
          >
            {trackingSourceOrders.filter((o) => o.status === "Pending").length}
            <span class="text-xs font-normal text-violet-600/70 ml-1"
              >{$language === "vi" ? "chờ duyệt" : "queued"}</span
            >
          </div>
          <div class="text-[10px] text-violet-600/80 dark:text-violet-500 mt-1">
            {$language === "vi"
              ? "Đã duyệt — chờ đo kiểm"
              : "Approved — awaiting telemetry"}
          </div>
        </div>

        <!-- Not Feasible -->
        <div
          class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 shadow-sm col-span-2 sm:col-span-1"
        >
          <div
            class="text-[11px] font-mono text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center justify-between"
          >
            <span>{$language === "vi" ? "Không khả thi" : "Not Feasible"}</span>
            <XCircle class="h-3.5 w-3.5 text-rose-500" />
          </div>
          <div
            class="text-2xl font-bold font-mono text-rose-700 dark:text-rose-400 mt-1.5"
          >
            {trackingSourceOrders.filter((o) => o.status === "Not Feasible")
              .length}
            <span class="text-xs font-normal text-rose-600/70 ml-1"
              >{$language === "vi" ? "từ chối" : "rejected"}</span
            >
          </div>
          <div class="text-[10px] text-rose-600/80 dark:text-rose-500 mt-1">
            {$language === "vi"
              ? "Vượt cự ly / Hết cổng"
              : "Distance / Out of ports"}
          </div>
        </div>
      </div>

      <!-- 2. Search, Filter & Orders Table List (Unified Box) -->
      <div
        class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
      >
        <!-- Top: Search & Filter Toolbar -->
        <div
          class="p-5 border-b border-slate-200 dark:border-slate-800 space-y-4 bg-slate-50/40 dark:bg-slate-950/30"
        >
          <div
            class="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between"
          >
            <!-- Search input -->
            <div class="relative flex-1">
              <Search
                class="absolute left-3.5 top-3 h-4 w-4 text-slate-400 dark:text-slate-500"
              />
              <input
                type="text"
                placeholder={$language === "vi"
                  ? "Tra cứu theo Mã đơn hàng (11 ký tự), tên khách hàng, SĐT, email, địa chỉ..."
                  : "Search by 11-char Order ID, customer name, phone, email, address..."}
                bind:value={orderSearchQuery}
                class="w-full pl-10 pr-10 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 font-mono"
              />
              {#if orderSearchQuery}
                <button
                  type="button"
                  onclick={() => (orderSearchQuery = "")}
                  class="absolute right-3 top-2.5 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X class="h-4 w-4" />
                </button>
              {/if}
            </div>

            <div class="flex items-center gap-2">
              <button
                onclick={handleQuickTrackOrder}
                class="px-4 py-2.5 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow flex items-center justify-center space-x-1.5 whitespace-nowrap cursor-pointer"
              >
                <ShoppingBag class="h-4 w-4" />
                <span
                  >{$language === "vi"
                    ? "Tra cứu & Mở chi tiết"
                    : "Track & Open Details"}</span
                >
              </button>
              <button
                onclick={handleResetAllOrderFilters}
                class="px-3 py-2.5 rounded-lg text-sm font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                title={$language === "vi"
                  ? "Xem tất cả danh sách đơn hàng và xóa bộ lọc"
                  : "View all orders and reset filters"}
              >
                <RotateCcw class="h-4 w-4 text-emerald-600" />
                <span>{$language === "vi" ? "Làm mới" : "Refresh"}</span>
              </button>
            </div>
          </div>

          <!-- Filter rows: Status & Connection Type & Branch Scope -->
          <div
            class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800/80 pt-3"
          >
            <!-- Status Filter Pills (Horizontal row) -->
            <div
              class="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap pb-1 max-w-full"
            >
              <button
                onclick={handleResetAllOrderFilters}
                class="px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer {orderStatusFilter ===
                  'All' &&
                !orderSearchQuery &&
                orderTypeFilter === 'All'
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/40'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}"
                title={$language === "vi"
                  ? "Xem toàn bộ đơn hàng (xóa lọc)"
                  : "View all orders"}
              >
                {$language === "vi" ? "Tất cả" : "All"} ({trackingSourceOrders.length})
              </button>
              <button
                onclick={() => {
                  orderStatusFilter = "Connection Provided";
                  orderSortOrder = "Connection Provided";
                  orderSearchQuery = "";
                }}
                class="px-2.5 py-1 text-xs font-medium rounded-lg transition cursor-pointer {orderStatusFilter ===
                'Connection Provided'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}"
              >
                {$language === "vi" ? "Đã cấp kết nối" : "Provided"} ({trackingSourceOrders.filter(
                  (o) => o.status === "Connection Provided",
                ).length})
              </button>
              <button
                onclick={() => {
                  orderStatusFilter = "Feasible";
                  orderSortOrder = "Feasible";
                  orderSearchQuery = "";
                }}
                class="px-2.5 py-1 text-xs font-medium rounded-lg transition cursor-pointer {orderStatusFilter ===
                'Feasible'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}"
              >
                {$language === "vi" ? "Khảo sát khả thi" : "Feasible"} ({trackingSourceOrders.filter(
                  (o) => o.status === "Feasible",
                ).length})
              </button>
              <button
                onclick={() => {
                  orderStatusFilter = "Pending";
                  orderSortOrder = "Pending";
                  orderSearchQuery = "";
                }}
                class="px-2.5 py-1 text-xs font-medium rounded-lg transition cursor-pointer {orderStatusFilter ===
                'Pending'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}"
              >
                {$language === "vi" ? "Chờ kỹ thuật" : "Pending Survey"} ({trackingSourceOrders.filter(
                  (o) => o.status === "Pending",
                ).length})
              </button>
              <button
                onclick={() => {
                  orderStatusFilter = "PendingRetail";
                  orderSortOrder = "newest";
                  orderSearchQuery = "";
                }}
                class="px-2.5 py-1 text-xs font-medium rounded-lg transition cursor-pointer {orderStatusFilter ===
                'PendingRetail'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}"
              >
                {$language === "vi" ? "Chờ bán hàng duyệt" : "Awaiting Retail"} ({trackingSourceOrders.filter(
                  (o) => o.status === "PendingRetail",
                ).length})
              </button>
              <button
                onclick={() => {
                  orderStatusFilter = "Not Approved";
                  orderSortOrder = "newest";
                  orderSearchQuery = "";
                }}
                class="px-2.5 py-1 text-xs font-medium rounded-lg transition cursor-pointer {orderStatusFilter ===
                'Not Approved'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}"
              >
                {$language === "vi" ? "Hồ sơ bị trả lại" : "Returned"} ({trackingSourceOrders.filter(
                  (o) => o.status === "Not Approved",
                ).length})
              </button>
              <button
                onclick={() => {
                  orderStatusFilter = "Not Feasible";
                  orderSortOrder = "Not Feasible";
                  orderSearchQuery = "";
                }}
                class="px-2.5 py-1 text-xs font-medium rounded-lg transition cursor-pointer {orderStatusFilter ===
                'Not Feasible'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}"
              >
                {$language === "vi" ? "Không khả thi" : "Not Feasible"} ({trackingSourceOrders.filter(
                  (o) => o.status === "Not Feasible",
                ).length})
              </button>
            </div>

            <!-- Connection Type & Scope Dropdowns -->
            <div class="flex flex-wrap items-center gap-2.5 text-xs">
              <!-- Connection Type Filter -->
              <div class="flex items-center space-x-1.5 text-xs">
                <span
                  class="text-slate-500 dark:text-slate-400 whitespace-nowrap"
                >
                  {$language === "vi" ? "Loại kết nối:" : "Connection Type:"}
                </span>
                <select
                  value={orderTypeFilter}
                  onchange={(e) =>
                    handleConnectionTypeChange(
                      e.currentTarget.value as "All" | ConnectionType,
                    )}
                  class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs cursor-pointer"
                >
                  <option value="All"
                    >{$language === "vi" ? "Tất cả loại kết nối" : "All Types"} ({connectionTypeCounts.All})</option
                  >
                  <option value="Broadband"
                    >Broadband (Cáp quang) ({connectionTypeCounts.Broadband})</option
                  >
                  <option value="Landline"
                    >Landline (Cố định) ({connectionTypeCounts.Landline})</option
                  >
                  <option value="Dial-Up"
                    >Dial-Up (Quay số) ({connectionTypeCounts["Dial-Up"]})</option
                  >
                </select>
              </div>

              <!-- Branch Scope Filter -->
              <div class="flex items-center space-x-1.5 text-xs">
                <span
                  class="text-slate-500 dark:text-slate-400 whitespace-nowrap"
                >
                  {$language === "vi" ? "Phạm vi:" : "Scope:"}
                </span>
                <select
                  bind:value={orderBranchFilter}
                  class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs cursor-pointer"
                >
                  <option value="All"
                    >{$language === "vi"
                      ? "Toàn bộ hệ thống (Tất cả)"
                      : "All Outlets & Online"}</option
                  >
                  {#each $retailShops as shop}
                    <option value={shop.shopCode}
                      >{shop.name} ({shop.shopCode})</option
                    >
                  {/each}
                </select>
              </div>
            </div>
          </div>

          <!-- Fast Pick Tags & Sort Order -->
          <div
            class="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80 pt-3 text-xs text-slate-500 dark:text-slate-400 font-mono"
          >
            <div class="flex flex-wrap items-center gap-1.5">
              <span
                class="text-[11px] font-semibold text-slate-700 dark:text-slate-300"
              >
                {$language === "vi" ? "Mã đơn hàng mới nhất:" : "Latest Orders:"}
              </span>
              {#each latestOrderTags as o (o.id)}
                {@const isActive =
                  orderSearchQuery.trim().toUpperCase() === o.id.toUpperCase()}
                <button
                  type="button"
                  onclick={() => handleToggleOrderTag(o.id)}
                  class="px-2 py-0.5 rounded border transition font-semibold text-[11px] flex items-center gap-1 cursor-pointer {isActive
                    ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-400/40 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-400 hover:text-emerald-600'}"
                  title={$language === "vi"
                    ? isActive
                      ? "Bấm lại để bỏ chọn và xem tất cả"
                      : `Lọc mã đơn ${o.id}`
                    : isActive
                      ? "Click again to deselect"
                      : `Filter order ${o.id}`}
                >
                  <span>{o.id}</span>
                  {#if isActive}
                    <X class="h-3 w-3" />
                  {/if}
                </button>
              {/each}
            </div>

            <div class="flex items-center gap-2 ml-auto shrink-0">
              {#if expandedOrderId}
                <button
                  type="button"
                  onclick={() => (expandedOrderId = null)}
                  class="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition flex items-center gap-1 cursor-pointer"
                  title={$language === "vi"
                    ? "Thu gọn chi tiết đơn đang mở"
                    : "Collapse expanded order"}
                >
                  <X class="h-3.5 w-3.5 text-slate-400" />
                  <span
                    >{$language === "vi"
                      ? "Thu gọn chi tiết"
                      : "Collapse Details"}</span
                  >
                </button>
              {/if}

              <!-- Sort / Status Option Select Dropdown -->
              <div class="flex items-center gap-1.5 shrink-0">
                <ArrowDownUp class="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <select
                  value={orderSortOrder}
                  onchange={(e) => handleOrderSortChange(e.currentTarget.value)}
                  class="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  title={$language === "vi"
                    ? "Tùy chọn sắp xếp & lọc theo trạng thái"
                    : "Sort and status filter options"}
                >
                  <option value="newest"
                    >{$language === "vi"
                      ? "Sắp xếp: Mới nhất trước"
                      : "Sort: Newest First"}</option
                  >
                  <option value="oldest"
                    >{$language === "vi"
                      ? "Sắp xếp: Cũ nhất trước"
                      : "Sort: Oldest First"}</option
                  >
                  <option value="Feasible"
                    >{$language === "vi"
                      ? "Khảo sát khả thi"
                      : "Feasible"}</option
                  >
                  <option value="Pending"
                    >{$language === "vi"
                      ? "Chờ kĩ thuật khảo sát"
                      : "Pending Survey"}</option
                  >
                  <option value="Not Feasible"
                    >{$language === "vi"
                      ? "Không khả thi"
                      : "Not Feasible"}</option
                  >
                  <option value="Connection Provided"
                    >{$language === "vi"
                      ? "Đã cấp kết nối"
                      : "Connection Provided"}</option
                  >
                </select>
              </div>
            </div>
          </div>
        </div>

        {#if filteredTrackedOrders.length === 0}
          <div class="py-16 text-center space-y-3">
            <ShoppingBag class="h-10 w-10 text-slate-400 mx-auto opacity-50" />
            <div
              class="text-sm font-semibold text-slate-700 dark:text-slate-300 font-mono"
            >
              {$language === "vi"
                ? "Không tìm thấy đơn hàng nào khớp với bộ lọc."
                : "No orders match the current filter criteria."}
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
              <thead
                class="bg-slate-50 dark:bg-slate-950/80 text-[11px] font-mono text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800"
              >
                <tr>
                  <th class="px-4 py-3.5"
                    >{$language === "vi" ? "MÃ ĐƠN HÀNG" : "ORDER ID"}</th
                  >
                  <th class="px-4 py-3.5"
                    >{$language === "vi"
                      ? "KHÁCH HÀNG & ĐỊA CHỈ"
                      : "CUSTOMER & ADDRESS"}</th
                  >
                  <th class="px-4 py-3.5"
                    >{$language === "vi"
                      ? "LOẠI KẾT NỐI & GÓI CƯỚC"
                      : "CONNECTION & PLAN"}</th
                  >
                  <th class="px-4 py-3.5"
                    >{$language === "vi"
                      ? "ĐIỆN THOẠI & XÁC MINH"
                      : "PHONE & ID PROOF"}</th
                  >
                  <th class="px-4 py-3.5"
                    >{$language === "vi"
                      ? "TRẠNG THÁI TIẾN ĐỘ"
                      : "FULFILLMENT STATUS"}</th
                  >
                  <th class="px-4 py-3.5 text-right"
                    >{$language === "vi" ? "THAO TÁC" : "ACTIONS"}</th
                  >
                </tr>
              </thead>
              <tbody
                class="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans"
              >
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
                        <span
                          class="font-mono font-bold text-emerald-600 dark:text-emerald-400 tracking-wider"
                        >
                          {o.id}
                        </span>
                        <button
                          onclick={() => copyToClipboard(o.id, "Order ID")}
                          class="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                          title={$language === "vi"
                            ? "Sao chép mã đơn"
                            : "Copy Order ID"}
                        >
                          <Copy class="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div
                        class="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1"
                      >
                        {o.createdAt}
                      </div>
                    </td>

                    <!-- Col 2: Customer & Address -->
                    <td class="px-4 py-4 align-top">
                      <div class="font-semibold text-slate-900 dark:text-white">
                        {o.customerName}
                      </div>
                      <div
                        class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1"
                      >
                        {o.installationAddress}
                      </div>
                    </td>

                    <!-- Col 3: Connection & Plan -->
                    <td class="px-4 py-4 align-top">
                      <div class="flex items-center space-x-1.5">
                        {#if o.connectionType === "Broadband"}
                          <span
                            class="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                          >
                            <Wifi class="h-3 w-3" />
                            <span>Broadband</span>
                          </span>
                        {:else if o.connectionType === "Landline"}
                          <span
                            class="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                          >
                            <Phone class="h-3 w-3" />
                            <span>Landline</span>
                          </span>
                        {:else}
                          <span
                            class="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                          >
                            <Radio class="h-3 w-3" />
                            <span>Dial-Up</span>
                          </span>
                        {/if}
                      </div>
                      <div
                        class="text-xs font-medium text-slate-800 dark:text-slate-200 mt-1"
                      >
                        {getPlanName({ name: o.planName }, $language)}
                      </div>
                    </td>

                    <!-- Col 4: Phone & ID Proof -->
                    <td class="px-4 py-4 align-top">
                      <div
                        class="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200"
                      >
                        {o.customerPhone}
                      </div>
                      <div
                        class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[170px]"
                      >
                        {o.customerEmail}
                      </div>
                      <div class="text-[10px] text-slate-400 font-mono mt-0.5">
                        {o.idProofType}: {o.idProofNumber}
                      </div>
                    </td>

                    <!-- Col 5: Fulfillment Status & Assigned Technician -->
                    <td class="px-4 py-4 align-top">
                      <div class="space-y-1.5">
                        <span
                          class="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider {statusChip(
                            o.status,
                          )}"
                        >
                          <span
                            class="h-2 w-2 rounded-full {statusDot(o.status)}"
                          ></span>
                          <span>{orderStatusLabel(o.status, $language)}</span>
                        </span>

                        <!-- Technician Assignment Indicator / Fast Button -->
                        <div class="pt-0.5">
                          {#if o.assignedTechnician}
                            <button
                              type="button"
                              onclick={(e) => {
                                e.stopPropagation();
                                openAssignTechnicianModal(o);
                              }}
                              class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 transition"
                              title={$language === "vi"
                                ? "Bấm để đổi kỹ thuật viên khảo sát"
                                : "Click to change survey technician"}
                            >
                              <Wrench
                                class="h-3 w-3 text-emerald-600 dark:text-emerald-400"
                              />
                              <span
                                class="text-slate-500 dark:text-slate-400 font-normal"
                                >{$language === "vi" ? "KTV:" : "Tech:"}</span
                              >
                              <span class="truncate max-w-[110px] font-semibold"
                                >{o.assignedTechnician}</span
                              >
                            </button>
                          {:else}
                            <button
                              type="button"
                              onclick={(e) => {
                                e.stopPropagation();
                                openAssignTechnicianModal(o);
                              }}
                              class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700/60 transition shadow-2xs"
                              title={$language === "vi"
                                ? "Bấm để phân công kỹ thuật viên khảo sát"
                                : "Click to assign survey technician"}
                            >
                              <UserPlus class="h-3 w-3" />
                              <span
                                >{$language === "vi"
                                  ? "+ Phân công KTV"
                                  : "+ Assign Tech"}</span
                              >
                            </button>
                          {/if}
                        </div>

                        {#if o.status === "PendingRetail"}
                          <button
                            onclick={() => (activeTab = "approval-queue")}
                            class="block text-[10px] font-semibold text-amber-700 dark:text-amber-400 hover:underline mt-0.5"
                          >
                            {$language === "vi"
                              ? "Mở hàng đợi duyệt →"
                              : "Open approval queue →"}
                          </button>
                        {/if}
                      </div>
                    </td>

                    <!-- Col 6: Action Button -->
                    <td
                      class="px-4 py-4 align-top text-right whitespace-nowrap"
                    >
                      <div class="flex items-center justify-end space-x-2">
                        <button
                          onclick={() => toggleOrderDropdown(o.id)}
                          class="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs {isExpanded
                            ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-950 hover:text-emerald-800 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700'}"
                        >
                          <span
                            >{$language === "vi"
                              ? isExpanded
                                ? "Thu gọn"
                                : "Chi tiết"
                              : isExpanded
                                ? "Collapse"
                                : "Details"}</span
                          >
                          <ChevronDown
                            class="h-4 w-4 transition-transform duration-200 {isExpanded
                              ? 'rotate-180'
                              : ''}"
                          />
                        </button>
                      </div>
                    </td>
                  </tr>

                  <!-- DROPDOWN BOX CHI TIẾT TIẾN ĐỘ ĐƠN HÀNG -->
                  {#if isExpanded}
                    <tr
                      class="bg-gradient-to-b from-emerald-50/50 to-slate-50 dark:from-emerald-950/20 dark:to-slate-950/40 border-b-2 border-emerald-400 dark:border-emerald-600/60"
                    >
                      <td colspan="6" class="p-4 sm:p-6">
                        <div
                          class="space-y-6 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-md"
                        >
                          <!-- Box Header -->
                          <div
                            class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4"
                          >
                            <div
                              class="flex items-start sm:items-center space-x-3"
                            >
                              <div
                                class="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800"
                              >
                                <ShoppingBag class="h-6 w-6" />
                              </div>
                              <div>
                                <div class="flex items-center space-x-3">
                                  <h4
                                    class="text-lg font-bold font-mono text-slate-900 dark:text-white"
                                  >
                                    {$language === "vi"
                                      ? "Mã đơn hàng:"
                                      : "Order ID:"}
                                    <span
                                      class="text-emerald-600 dark:text-emerald-400 font-extrabold"
                                      >{o.id}</span
                                    >
                                  </h4>
                                  <span
                                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider {statusChip(
                                      o.status,
                                    )}"
                                  >
                                    {orderStatusLabel(o.status, $language)}
                                  </span>
                                </div>
                                <p
                                  class="text-xs text-slate-500 dark:text-slate-400 mt-1"
                                >
                                  {$language === "vi"
                                    ? `Đăng ký lúc ${o.createdAt} bởi ${o.retailEmployeeName} (${o.retailOutletCode})`
                                    : `Submitted at ${o.createdAt} by ${o.retailEmployeeName} (${o.retailOutletCode})`}
                                </p>
                                {#if o.retailApprovedBy && o.status !== "Not Approved"}
                                  <p
                                    class="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5"
                                  >
                                    {$language === "vi"
                                      ? "Bán hàng duyệt:"
                                      : "Retail approved:"}
                                    {o.retailApprovedBy}
                                    · {o.retailApprovedAt}
                                    {#if o.retailApprovalNotes}— {o.retailApprovalNotes}{/if}
                                  </p>
                                {:else if o.status === "Not Approved" && o.retailRejectionReason}
                                  <p
                                    class="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5"
                                  >
                                    {$language === "vi"
                                      ? "Lý do trả hồ sơ:"
                                      : "Returned because:"}
                                    {o.retailRejectionReason}
                                  </p>
                                {/if}
                              </div>
                            </div>

                            <!-- Header Actions -->
                            <div class="flex flex-wrap items-center gap-2">
                              <button
                                onclick={() =>
                                  copyToClipboard(o.id, "Order ID")}
                                class="inline-flex items-center space-x-1 text-xs border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition font-medium"
                              >
                                <Copy class="h-3.5 w-3.5" />
                                <span
                                  >{$language === "vi"
                                    ? "Sao chép mã đơn"
                                    : "Copy Order ID"}</span
                                >
                              </button>

                              {#if o.assignedAccountId}
                                <button
                                  onclick={() => {
                                    activeTab = "connection-details";
                                    connSearchQuery = o.assignedAccountId!;
                                    expandedConnAccountId =
                                      o.assignedAccountId!;
                                  }}
                                  class="inline-flex items-center space-x-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-semibold transition shadow-xs"
                                >
                                  <Wifi class="h-3.5 w-3.5" />
                                  <span
                                    >{$language === "vi"
                                      ? "Mở chi tiết thuê bao"
                                      : "View Connection"}</span
                                  >
                                </button>
                              {/if}

                              <button
                                onclick={() => (expandedOrderId = null)}
                                class="inline-flex items-center space-x-1 text-xs border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                title={$language === "vi"
                                  ? "Đóng hộp chi tiết"
                                  : "Close details"}
                              >
                                <X class="h-3.5 w-3.5" />
                                <span
                                  >{$language === "vi" ? "Đóng" : "Close"}</span
                                >
                              </button>
                            </div>
                          </div>

                          <!-- 5-Stage Visual Progress Stepper (2 tầng xét duyệt) -->
                          <div class="py-2">
                            <div
                              class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-5 flex items-center space-x-2"
                            >
                              <Clock class="h-3.5 w-3.5 text-emerald-600" />
                              <span
                                >{$language === "vi"
                                  ? "Quy trình xử lý đơn hàng"
                                  : "Fulfillment Lifecycle Stepper"}</span
                              >
                            </div>

                            <div
                              class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 relative"
                            >
                              {#each stepperStages as st (st.step)}
                                {@const stageIdx = getStageIndex(o.status)}
                                {@const isComplete = stageIdx >= st.step}
                                {@const isFailedRetail =
                                  o.status === "Not Approved" && st.step >= 2}
                                {@const isFailedTech =
                                  o.status === "Not Feasible" && st.step >= 3}
                                {@const isFailed =
                                  isFailedRetail || isFailedTech}
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
                                    <div
                                      class="text-xs font-bold text-slate-900 dark:text-white"
                                    >
                                      {$language === "vi"
                                        ? st.labelVi
                                        : st.label}
                                    </div>
                                    <div
                                      class="text-[11px] text-slate-500 dark:text-slate-400"
                                    >
                                      {$language === "vi" ? st.subVi : st.sub}
                                    </div>
                                  </div>
                                </div>
                              {/each}
                            </div>

                            {#if o.status === "PendingRetail"}
                              <div
                                class="mt-4 flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50"
                              >
                                <FileText
                                  class="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
                                />
                                <span
                                  class="text-[11px] text-amber-800 dark:text-amber-300"
                                >
                                  {$language === "vi"
                                    ? `Chờ ${o.retailEmployeeName} tại chi nhánh ${o.retailOutletCode} duyệt hồ sơ trước khi kỹ thuật khảo sát.`
                                    : `Waiting for ${o.retailEmployeeName} at branch ${o.retailOutletCode} to approve the paperwork before Technical surveys it.`}
                                </span>
                              </div>
                            {/if}
                          </div>

                          <!-- Details Grid (3 Sections) -->
                          <div
                            class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800"
                          >
                            <!-- Box 1: Customer Profile -->
                            <div
                              class="space-y-2.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                            >
                              <h5
                                class="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5"
                              >
                                <User class="h-3.5 w-3.5 text-emerald-600" />
                                <span
                                  >{$language === "vi"
                                    ? "Hồ sơ khách hàng"
                                    : "Customer Profile"}</span
                                >
                              </h5>
                              <div class="space-y-1.5 text-xs">
                                <div>
                                  <span class="text-slate-500"
                                    >{$language === "vi"
                                      ? "Họ tên:"
                                      : "Name:"}</span
                                  >
                                  <strong
                                    class="text-slate-900 dark:text-white ml-1"
                                    >{o.customerName}</strong
                                  >
                                </div>
                                <div>
                                  <span class="text-slate-500"
                                    >{$language === "vi"
                                      ? "Điện thoại:"
                                      : "Phone:"}</span
                                  >
                                  <span
                                    class="font-mono font-semibold text-slate-800 dark:text-slate-200 ml-1"
                                    >{o.customerPhone}</span
                                  >
                                </div>
                                <div>
                                  <span class="text-slate-500"
                                    >{$language === "vi"
                                      ? "Email:"
                                      : "Email:"}</span
                                  >
                                  <span
                                    class="text-slate-800 dark:text-slate-200 ml-1"
                                    >{o.customerEmail}</span
                                  >
                                </div>
                                <div>
                                  <span class="text-slate-500"
                                    >{$language === "vi"
                                      ? "Xác minh ID:"
                                      : "ID Proof:"}</span
                                  >
                                  <span
                                    class="font-mono text-slate-700 dark:text-slate-300 ml-1"
                                    >{o.idProofType} ({o.idProofNumber})</span
                                  >
                                </div>
                                <div>
                                  <span class="text-slate-500"
                                    >{$language === "vi"
                                      ? "Địa chỉ:"
                                      : "Address:"}</span
                                  >
                                  <span
                                    class="text-slate-800 dark:text-slate-200 ml-1"
                                    >{o.installationAddress}</span
                                  >
                                </div>
                              </div>
                            </div>

                            <!-- Box 2: Service & Technical Data -->
                            <div
                              class="space-y-2.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                            >
                              <h5
                                class="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5"
                              >
                                <Server class="h-3.5 w-3.5 text-emerald-600" />
                                <span
                                  >{$language === "vi"
                                    ? "Dữ liệu dịch vụ & Kỹ thuật"
                                    : "Service & Technical"}</span
                                >
                              </h5>
                              <div class="space-y-1.5 text-xs">
                                <div>
                                  <span class="text-slate-500"
                                    >{$language === "vi"
                                      ? "Gói cước:"
                                      : "Plan:"}</span
                                  >
                                  <strong
                                    class="text-slate-900 dark:text-white ml-1"
                                    >{getPlanName(
                                      { name: o.planName },
                                      $language,
                                    )}</strong
                                  >
                                </div>
                                <div>
                                  <span class="text-slate-500"
                                    >{$language === "vi"
                                      ? "Loại kết nối:"
                                      : "Type:"}</span
                                  >
                                  <span
                                    class="font-semibold text-slate-800 dark:text-slate-200 ml-1"
                                    >{o.connectionType}</span
                                  >
                                </div>
                                <div>
                                  <span class="text-slate-500"
                                    >{$language === "vi"
                                      ? "Khoảng cách cáp:"
                                      : "Cable Distance:"}</span
                                  >
                                  <span
                                    class="font-mono font-semibold text-slate-800 dark:text-slate-200 ml-1"
                                    >{o.cableDistanceMeters || 120} m</span
                                  >
                                </div>
                                <div>
                                  <span class="text-slate-500"
                                    >{$language === "vi"
                                      ? "Hộp chia DP:"
                                      : "DP Box:"}</span
                                  >
                                  <span
                                    class="text-slate-800 dark:text-slate-200 ml-1"
                                    >{o.dpBoxCapacity ||
                                      ($language === "vi"
                                        ? "Còn cổng khả dụng"
                                        : "Port Available")}</span
                                  >
                                </div>

                                <!-- Kỹ thuật viên đảm nhiệm khảo sát -->
                                <div
                                  class="mt-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-800"
                                >
                                  <div
                                    class="flex items-center justify-between mb-1.5"
                                  >
                                    <span
                                      class="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1"
                                    >
                                      <Wrench
                                        class="h-3 w-3 text-emerald-600"
                                      />
                                      {$language === "vi"
                                        ? "Kỹ thuật viên khảo sát:"
                                        : "Survey Technician:"}
                                    </span>
                                    <button
                                      type="button"
                                      onclick={() =>
                                        openAssignTechnicianModal(o)}
                                      class="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                                    >
                                      <UserCheck class="h-3 w-3" />
                                      <span
                                        >{$language === "vi"
                                          ? o.assignedTechnician
                                            ? "Đổi KTV"
                                            : "Phân công"
                                          : o.assignedTechnician
                                            ? "Change"
                                            : "Assign"}</span
                                      >
                                    </button>
                                  </div>

                                  {#if o.assignedTechnician}
                                    <div
                                      class="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800"
                                    >
                                      <div
                                        class="flex items-center justify-between"
                                      >
                                        <span
                                          class="font-bold text-slate-900 dark:text-white text-xs"
                                        >
                                          {o.assignedTechnician}
                                        </span>
                                        {#if o.assignedTechnicianId}
                                          <span
                                            class="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded font-semibold"
                                          >
                                            {o.assignedTechnicianId}
                                          </span>
                                        {/if}
                                      </div>
                                      {#if o.assignedTechnicianPhone}
                                        <div
                                          class="font-mono text-[11px] text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1"
                                        >
                                          <Phone
                                            class="h-3 w-3 text-emerald-600"
                                          />
                                          <span
                                            >{o.assignedTechnicianPhone}</span
                                          >
                                        </div>
                                      {/if}
                                      {#if o.assignedTechnicianDate}
                                        <div
                                          class="text-[10px] text-slate-400 mt-0.5"
                                        >
                                          {$language === "vi"
                                            ? "Thời điểm phân công:"
                                            : "Assigned at:"}
                                          {o.assignedTechnicianDate}
                                        </div>
                                      {/if}
                                    </div>
                                  {:else}
                                    <div
                                      class="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 flex items-center justify-between"
                                    >
                                      <span class="text-xs">
                                        {$language === "vi"
                                          ? "Chưa phân công kỹ thuật viên"
                                          : "No technician assigned"}
                                      </span>
                                      <button
                                        type="button"
                                        onclick={() =>
                                          openAssignTechnicianModal(o)}
                                        class="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-semibold transition shadow-xs flex items-center gap-1"
                                      >
                                        <UserPlus class="h-3 w-3" />
                                        <span
                                          >{$language === "vi"
                                            ? "Chọn người khảo sát"
                                            : "Select Tech"}</span
                                        >
                                      </button>
                                    </div>
                                  {/if}
                                </div>

                                {#if o.feasibilityNotes}
                                  <div
                                    class="text-amber-600 dark:text-amber-400 pt-1"
                                  >
                                    <span class="font-semibold"
                                      >{$language === "vi"
                                        ? "Ghi chú kỹ thuật:"
                                        : "Tech Notes:"}</span
                                    >
                                    <p class="text-[11px] mt-0.5">
                                      {o.feasibilityNotes}
                                    </p>
                                  </div>
                                {/if}
                              </div>
                            </div>

                            <!-- Box 3: Fulfillment & Issued Account -->
                            <div
                              class="space-y-2.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                            >
                              <h5
                                class="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5"
                              >
                                <CheckCircle2
                                  class="h-3.5 w-3.5 text-emerald-600"
                                />
                                <span
                                  >{$language === "vi"
                                    ? "Cấp phát tài khoản & Điểm giao dịch"
                                    : "Issued Account & Retail Outlet"}</span
                                >
                              </h5>
                              <div class="space-y-2 text-xs">
                                {#if o.assignedAccountId}
                                  <div
                                    class="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800"
                                  >
                                    <span
                                      class="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold block"
                                    >
                                      {$language === "vi"
                                        ? "Mã tài khoản 16 ký tự đã cấp:"
                                        : "Issued 16-char Account ID:"}
                                    </span>
                                    <div
                                      class="flex items-center justify-between mt-1"
                                    >
                                      <span
                                        class="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-300"
                                      >
                                        {o.assignedAccountId}
                                      </span>
                                      <button
                                        onclick={() =>
                                          copyToClipboard(
                                            o.assignedAccountId!,
                                            "Account ID",
                                          )}
                                        class="p-1 rounded hover:bg-emerald-200 dark:hover:bg-emerald-800 text-emerald-600 dark:text-emerald-400 transition"
                                        title={$language === "vi"
                                          ? "Sao chép mã tài khoản"
                                          : "Copy Account ID"}
                                      >
                                        <Copy class="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                {:else}
                                  <div
                                    class="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
                                  >
                                    <span class="text-xs font-medium">
                                      {$language === "vi"
                                        ? "Chưa cấp Account ID (Đang chờ kỹ thuật phê duyệt hoặc khảo sát)"
                                        : "Awaiting technician provisioning to generate Account ID."}
                                    </span>
                                  </div>
                                {/if}

                                <div>
                                  <span class="text-slate-500"
                                    >{$language === "vi"
                                      ? "Điểm quầy bán lẻ:"
                                      : "Retail Outlet:"}</span
                                  >
                                  <span
                                    class="font-mono font-semibold text-slate-800 dark:text-slate-200 ml-1"
                                    >{o.retailOutletCode}</span
                                  >
                                </div>
                                <div>
                                  <span class="text-slate-500"
                                    >{$language === "vi"
                                      ? "Nhân viên tiếp nhận:"
                                      : "Staff:"}</span
                                  >
                                  <span
                                    class="text-slate-800 dark:text-slate-200 ml-1"
                                    >{o.retailEmployeeName}</span
                                  >
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
      <div
        class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4"
      >
        <!-- Managed Accounts -->
        <div
          class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div
            class="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between"
          >
            <span
              >{$language === "vi"
                ? "Thuê bao quản lý"
                : "Managed Accounts"}</span
            >
            <Wifi class="h-3.5 w-3.5 text-slate-400" />
          </div>
          <div
            class="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1.5"
          >
            {$connections.length}
            <span class="text-xs font-normal text-slate-400 ml-1"
              >{$language === "vi" ? "tài khoản" : "circuits"}</span
            >
          </div>
          <div class="text-[10px] text-slate-500 mt-1">
            {$language === "vi" ? "16 ký tự chuẩn ISO" : "16-char ISO standard"}
          </div>
        </div>

        <!-- Active -->
        <div
          class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/40 shadow-sm"
        >
          <div
            class="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center justify-between"
          >
            <span
              >{$language === "vi" ? "Đang hoạt động" : "Active Circuits"}</span
            >
            <CheckCircle2 class="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <div
            class="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1.5"
          >
            {$connections.filter((c) => c.status === "Active").length}
            <span class="text-xs font-normal text-emerald-600/70 ml-1"
              >{$language === "vi" ? "trực tuyến" : "online"}</span
            >
          </div>
          <div
            class="text-[10px] text-emerald-600/80 dark:text-emerald-500 mt-1"
          >
            {$language === "vi"
              ? "Đường truyền thông suốt"
              : "Stable traffic flow"}
          </div>
        </div>

        <!-- Temporarily Inactive -->
        <div
          class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 shadow-sm"
        >
          <div
            class="text-[11px] font-mono text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center justify-between"
          >
            <span
              >{$language === "vi"
                ? "Tạm khóa dịch vụ"
                : "Temporarily Inactive"}</span
            >
            <AlertTriangle class="h-3.5 w-3.5 text-amber-500" />
          </div>
          <div
            class="text-2xl font-bold font-mono text-amber-700 dark:text-amber-400 mt-1.5"
          >
            {$connections.filter((c) => c.status === "Temporarily Inactive")
              .length}
            <span class="text-xs font-normal text-amber-600/70 ml-1"
              >{$language === "vi" ? "tạm khóa" : "on hold"}</span
            >
          </div>
          <div class="text-[10px] text-amber-600/80 dark:text-amber-500 mt-1">
            {$language === "vi" ? "Nợ cước / Tạm ngưng" : "Overdue / Suspended"}
          </div>
        </div>

        <!-- Permanently Inactive -->
        <div
          class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 shadow-sm"
        >
          <div
            class="text-[11px] font-mono text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center justify-between"
          >
            <span>{$language === "vi" ? "Khóa vĩnh viễn" : "Cut Off"}</span>
            <XCircle class="h-3.5 w-3.5 text-rose-500" />
          </div>
          <div
            class="text-2xl font-bold font-mono text-rose-700 dark:text-rose-400 mt-1.5"
          >
            {$connections.filter((c) => c.status === "Permanently Inactive")
              .length}
            <span class="text-xs font-normal text-rose-600/70 ml-1"
              >{$language === "vi" ? "đã cắt" : "terminated"}</span
            >
          </div>
          <div class="text-[10px] text-rose-600/80 dark:text-rose-500 mt-1">
            {$language === "vi"
              ? "Đã thu hồi cổng CPE"
              : "CPE & Port reclaimed"}
          </div>
        </div>

        <!-- Total Outstanding Due Balance -->
        <div
          class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/40 shadow-sm col-span-2 sm:col-span-1"
        >
          <div
            class="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center justify-between"
          >
            <span
              >{$language === "vi"
                ? "Tổng nợ cước"
                : "Outstanding Balance"}</span
            >
            <Receipt class="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <div
            class="text-2xl font-bold font-mono {totalDueAmountAllConnections >
            0
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-emerald-600 dark:text-emerald-400'} mt-1.5"
          >
            ${totalDueAmountAllConnections.toFixed(2)}
          </div>
          <div class="text-[10px] text-slate-500 mt-1">
            {$language === "vi"
              ? "Hỗ trợ thu ngân tại quầy"
              : "Payable at counter POS"}
          </div>
        </div>
      </div>

      <!-- 2. Search, Filter & Connections Table List (Unified Box) -->
      <div
        class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
      >
        <!-- Top: Search & Filter Toolbar -->
        <div
          class="p-5 border-b border-slate-200 dark:border-slate-800 space-y-4 bg-slate-50/40 dark:bg-slate-950/30"
        >
          <div
            class="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between"
          >
            <!-- Search input -->
            <div class="relative flex-1">
              <Search
                class="absolute left-3.5 top-3 h-4 w-4 text-slate-400 dark:text-slate-500"
              />
              <input
                type="text"
                placeholder={$language === "vi"
                  ? "Tra cứu theo Mã tài khoản (16 ký tự), tên thuê bao, địa chỉ, SĐT, cổng NOC, IP..."
                  : "Search by 16-char Account ID, subscriber name, address, phone, NOC port, IP..."}
                bind:value={connSearchQuery}
                class="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 font-mono"
              />
            </div>

            <div class="flex items-center gap-2">
              <button
                onclick={handleQuickTrackConnection}
                class="px-4 py-2.5 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow flex items-center justify-center space-x-1.5 whitespace-nowrap"
              >
                <Wifi class="h-4 w-4" />
                <span
                  >{$language === "vi"
                    ? "Tải hồ sơ & Mở chi tiết"
                    : "Retrieve & Open Details"}</span
                >
              </button>
            </div>
          </div>

          <!-- Filter rows: Status & Connection Type -->
          <div
            class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1"
          >
            <!-- Status Filter Pills (Horizontal row) -->
            <div
              class="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap pb-1 max-w-full"
            >
              <button
                onclick={() => (connStatusFilter = "All")}
                class="px-2.5 py-1 text-xs font-medium rounded-lg transition {connStatusFilter ===
                'All'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'}"
              >
                {$language === "vi" ? "Tất cả" : "All"} ({$connections.length})
              </button>
              <button
                onclick={() => (connStatusFilter = "Active")}
                class="px-2.5 py-1 text-xs font-medium rounded-lg transition {connStatusFilter ===
                'Active'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'}"
              >
                {$language === "vi" ? "Hoạt động" : "Active"} ({$connections.filter(
                  (c) => c.status === "Active",
                ).length})
              </button>
              <button
                onclick={() => (connStatusFilter = "Temporarily Inactive")}
                class="px-2.5 py-1 text-xs font-medium rounded-lg transition {connStatusFilter ===
                'Temporarily Inactive'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'}"
              >
                {$language === "vi" ? "Tạm khóa" : "Inactive"} ({$connections.filter(
                  (c) => c.status === "Temporarily Inactive",
                ).length})
              </button>
              <button
                onclick={() => (connStatusFilter = "Permanently Inactive")}
                class="px-2.5 py-1 text-xs font-medium rounded-lg transition {connStatusFilter ===
                'Permanently Inactive'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'}"
              >
                {$language === "vi" ? "Khóa vĩnh viễn" : "Cut Off"} ({$connections.filter(
                  (c) => c.status === "Permanently Inactive",
                ).length})
              </button>
            </div>

            <!-- Connection Type Filter & Collapse Details Button -->
            <div class="flex items-center space-x-2 text-xs">
              <span
                class="text-slate-500 dark:text-slate-400 whitespace-nowrap"
              >
                {$language === "vi" ? "Loại dịch vụ:" : "Service Type:"}
              </span>
              <select
                bind:value={connTypeFilter}
                class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
              >
                <option value="All"
                  >{$language === "vi"
                    ? "Tất cả loại dịch vụ"
                    : "All Types"}</option
                >
                <option value="Broadband">Broadband (Cáp quang)</option>
                <option value="Landline">Landline (Cố định)</option>
                <option value="Dial-Up">Dial-Up (Quay số)</option>
              </select>
            </div>
          </div>
        </div>

        {#if filteredTrackedConnections.length === 0}
          <div class="py-16 text-center space-y-3">
            <Wifi class="h-10 w-10 text-slate-400 mx-auto opacity-50" />
            <div
              class="text-sm font-semibold text-slate-700 dark:text-slate-300 font-mono"
            >
              {$language === "vi"
                ? "Không tìm thấy thuê bao nào khớp với bộ lọc."
                : "No accounts match the current filter criteria."}
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
              <thead
                class="bg-slate-50 dark:bg-slate-950/80 text-[11px] font-mono text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800"
              >
                <tr>
                  <th class="px-4 py-3.5"
                    >{$language === "vi"
                      ? "MÃ TÀI KHOẢN (16 KÝ TỰ)"
                      : "ACCOUNT ID (16-CHAR)"}</th
                  >
                  <th class="px-4 py-3.5"
                    >{$language === "vi"
                      ? "THUÊ BAO & ĐỊA CHỈ"
                      : "SUBSCRIBER & LOCATION"}</th
                  >
                  <th class="px-4 py-3.5"
                    >{$language === "vi"
                      ? "LOẠI DỊCH VỤ & GÓI CƯỚC"
                      : "SERVICE & PLAN"}</th
                  >
                  <th class="px-4 py-3.5"
                    >{$language === "vi"
                      ? "CỔNG NOC & IP"
                      : "NOC PORT & IP"}</th
                  >
                  <th class="px-4 py-3.5"
                    >{$language === "vi"
                      ? "DƯ NỢ CƯỚC ($)"
                      : "OUTSTANDING DUE ($)"}</th
                  >
                  <th class="px-4 py-3.5"
                    >{$language === "vi" ? "TRẠNG THÁI" : "STATUS"}</th
                  >
                  <th class="px-4 py-3.5 text-right"
                    >{$language === "vi" ? "THAO TÁC" : "ACTIONS"}</th
                  >
                </tr>
              </thead>
              <tbody
                class="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans"
              >
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
                        <span
                          class="font-mono font-bold text-emerald-600 dark:text-emerald-400 tracking-wider"
                        >
                          {conn.accountId}
                        </span>
                        <button
                          onclick={() =>
                            copyToClipboard(conn.accountId, "Account ID")}
                          class="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                          title={$language === "vi"
                            ? "Sao chép mã tài khoản"
                            : "Copy Account ID"}
                        >
                          <Copy class="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div
                        class="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1 flex items-center space-x-1"
                      >
                        <span>{$language === "vi" ? "Đơn gốc:" : "Order:"}</span
                        >
                        <span class="text-slate-700 dark:text-slate-300"
                          >#{conn.orderId}</span
                        >
                      </div>
                    </td>

                    <!-- Col 2: Subscriber & Location -->
                    <td class="px-4 py-4 align-top">
                      <div class="font-semibold text-slate-900 dark:text-white">
                        {conn.customerName}
                      </div>
                      <div
                        class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1"
                      >
                        {conn.installationAddress}
                      </div>
                      <div
                        class="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5"
                      >
                        {conn.customerPhone}
                      </div>
                    </td>

                    <!-- Col 3: Service Type & Plan -->
                    <td class="px-4 py-4 align-top">
                      <div class="flex items-center space-x-1.5">
                        {#if conn.connectionType === "Broadband"}
                          <span
                            class="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                          >
                            <Wifi class="h-3 w-3" />
                            <span>Broadband</span>
                          </span>
                        {:else if conn.connectionType === "Landline"}
                          <span
                            class="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                          >
                            <Phone class="h-3 w-3" />
                            <span>Landline</span>
                          </span>
                        {:else}
                          <span
                            class="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                          >
                            <Radio class="h-3 w-3" />
                            <span>Dial-Up</span>
                          </span>
                        {/if}
                      </div>
                      <div
                        class="text-xs font-medium text-slate-800 dark:text-slate-200 mt-1"
                      >
                        {conn.planName}
                      </div>
                      <div class="text-[11px] font-mono text-slate-500">
                        ${conn.monthlyRental.toFixed(2)}/{$language === "vi"
                          ? "tháng"
                          : "mo"}
                      </div>
                    </td>

                    <!-- Col 4: NOC Port & IP -->
                    <td class="px-4 py-4 align-top font-mono text-xs">
                      <div class="font-bold text-slate-800 dark:text-slate-200">
                        {conn.portNumber || "PON-01/04"}
                      </div>
                      <div
                        class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5"
                      >
                        IP: {conn.ipAddress || "198.51.100.42"}
                      </div>
                      <div
                        class="text-[10px] text-slate-400 truncate max-w-[140px] mt-0.5"
                      >
                        CPE: {conn.assignedDeviceSerial || "Chưa gán"}
                      </div>
                    </td>

                    <!-- Col 5: Outstanding Due -->
                    <td class="px-4 py-4 align-top">
                      <div
                        class="font-mono text-base font-bold {due > 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-600 dark:text-emerald-400'}"
                      >
                        ${due.toFixed(2)}
                      </div>
                      <span
                        class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold mt-1 {due ===
                        0
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'}"
                      >
                        {due === 0
                          ? $language === "vi"
                            ? "Đã quyết toán"
                            : "Paid in Full"
                          : $language === "vi"
                            ? "Còn dư nợ"
                            : "Unpaid Balance"}
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
                    <td
                      class="px-4 py-4 align-top text-right whitespace-nowrap"
                    >
                      <button
                        onclick={() => toggleConnDropdown(conn.accountId)}
                        class="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs {isExpanded
                          ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-950 hover:text-emerald-800 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700'}"
                      >
                        <span
                          >{$language === "vi"
                            ? isExpanded
                              ? "Thu gọn"
                              : "Chi tiết"
                            : isExpanded
                              ? "Collapse"
                              : "Details"}</span
                        >
                        <ChevronDown
                          class="h-4 w-4 transition-transform duration-200 {isExpanded
                            ? 'rotate-180'
                            : ''}"
                        />
                      </button>
                    </td>
                  </tr>

                  <!-- DROPDOWN BOX CHI TIẾT CỦA MÃ TÀI KHOẢN -->
                  {#if isExpanded}
                    {@const connBills = getBillsForConnection(conn.accountId)}
                    <tr
                      class="bg-gradient-to-b from-emerald-50/50 to-slate-50 dark:from-emerald-950/20 dark:to-slate-950/40 border-b-2 border-emerald-400 dark:border-emerald-600/60"
                    >
                      <td colspan="7" class="p-4 sm:p-6">
                        <div
                          class="space-y-6 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-md"
                        >
                          <!-- Box Header -->
                          <div
                            class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4"
                          >
                            <div
                              class="flex items-start sm:items-center space-x-3"
                            >
                              <div
                                class="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800"
                              >
                                <Wifi class="h-6 w-6" />
                              </div>
                              <div>
                                <div class="flex items-center space-x-3">
                                  <h4
                                    class="text-lg font-bold font-mono text-slate-900 dark:text-white"
                                  >
                                    {$language === "vi"
                                      ? "Mã tài khoản:"
                                      : "Account ID:"}
                                    <span
                                      class="text-emerald-600 dark:text-emerald-400 font-extrabold"
                                      >{conn.accountId}</span
                                    >
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
                                <p
                                  class="text-xs text-slate-500 dark:text-slate-400 mt-1"
                                >
                                  {$language === "vi"
                                    ? "Thuê bao:"
                                    : "Subscriber:"}
                                  <strong
                                    class="text-slate-700 dark:text-slate-300"
                                    >{conn.customerName}</strong
                                  >
                                  • {$language === "vi"
                                    ? "Kích hoạt ngày"
                                    : "Activated on"}
                                  {conn.installedDate}
                                  • {$language === "vi"
                                    ? "Điện thoại:"
                                    : "Phone:"}
                                  {conn.customerPhone}
                                </p>
                              </div>
                            </div>

                            <!-- Header Actions -->
                            <div class="flex flex-wrap items-center gap-2">
                              {#if connBills.length > 0 && due > 0}
                                <button
                                  type="button"
                                  onclick={() =>
                                    handleOpenRetailPayment(connBills[0])}
                                  class="inline-flex items-center space-x-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-semibold transition shadow-xs"
                                >
                                  <CreditCard class="h-3.5 w-3.5" />
                                  <span
                                    >{$language === "vi"
                                      ? `Thu tiền ($${due.toFixed(2)})`
                                      : `Pay ($${due.toFixed(2)})`}</span
                                  >
                                </button>
                              {/if}

                              <button
                                onclick={() =>
                                  copyToClipboard(conn.accountId, "Account ID")}
                                class="inline-flex items-center space-x-1 text-xs border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition font-medium"
                              >
                                <Copy class="h-3.5 w-3.5" />
                                <span
                                  >{$language === "vi"
                                    ? "Sao chép Account ID"
                                    : "Copy Account ID"}</span
                                >
                              </button>

                              <button
                                onclick={() => (expandedConnAccountId = null)}
                                class="inline-flex items-center space-x-1 text-xs border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                title={$language === "vi"
                                  ? "Đóng hộp chi tiết"
                                  : "Close details"}
                              >
                                <X class="h-3.5 w-3.5" />
                                <span
                                  >{$language === "vi" ? "Đóng" : "Close"}</span
                                >
                              </button>
                            </div>
                          </div>

                          <!-- 4 Detail Blocks (Spec §9) -->
                          <div
                            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs"
                          >
                            <!-- Block 1: Service Parameters -->
                            <div
                              class="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2"
                            >
                              <div
                                class="text-slate-400 font-bold uppercase tracking-wider flex items-center space-x-1.5"
                              >
                                <FileText
                                  class="h-3.5 w-3.5 text-emerald-600"
                                />
                                <span
                                  >{$language === "vi"
                                    ? "Thông số dịch vụ"
                                    : "Service Parameters"}</span
                                >
                              </div>
                              <div class="pt-1">
                                <span class="text-slate-500"
                                  >{$language === "vi"
                                    ? "Gói cước:"
                                    : "Plan:"}</span
                                >
                                <strong
                                  class="text-slate-900 dark:text-white ml-1"
                                  >{getPlanName(
                                    { name: conn.planName },
                                    $language,
                                  )}</strong
                                >
                              </div>
                              <div>
                                <span class="text-slate-500"
                                  >{$language === "vi"
                                    ? "Loại kết nối:"
                                    : "Connection:"}</span
                                >
                                <span
                                  class="font-semibold text-slate-800 dark:text-slate-200 ml-1"
                                >
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
                                <span class="text-slate-500"
                                  >{$language === "vi"
                                    ? "Cước thuê tháng:"
                                    : "Monthly Rental:"}</span
                                >
                                <span
                                  class="font-mono font-bold text-slate-900 dark:text-white ml-1"
                                  >${conn.monthlyRental.toFixed(2)}</span
                                >
                              </div>
                              <div>
                                <span class="text-slate-500"
                                  >{$language === "vi"
                                    ? "Tiền đặt cọc:"
                                    : "Security Deposit:"}</span
                                >
                                <span
                                  class="font-mono text-slate-800 dark:text-slate-200 ml-1"
                                  >${conn.securityDeposit.toFixed(2)}</span
                                >
                              </div>
                            </div>

                            <!-- Block 2: Physical & Circuit Data -->
                            <div
                              class="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2"
                            >
                              <div
                                class="text-slate-400 font-bold uppercase tracking-wider flex items-center space-x-1.5"
                              >
                                <HardDrive
                                  class="h-3.5 w-3.5 text-emerald-600"
                                />
                                <span
                                  >{$language === "vi"
                                    ? "Dữ liệu vật lý & Tuyến cáp"
                                    : "Physical & Circuit Data"}</span
                                >
                              </div>
                              <div class="pt-1">
                                <span class="text-slate-500"
                                  >{$language === "vi"
                                    ? "Địa chỉ IP cấp:"
                                    : "Assigned IP:"}</span
                                >
                                <span
                                  class="font-mono font-semibold text-slate-800 dark:text-slate-200 ml-1"
                                  >{conn.ipAddress || "Dynamic DHCP"}</span
                                >
                              </div>
                              <div>
                                <span class="text-slate-500"
                                  >{$language === "vi"
                                    ? "Cổng Switch/NOC:"
                                    : "Switch Port:"}</span
                                >
                                <span
                                  class="font-mono font-semibold text-slate-800 dark:text-slate-200 ml-1"
                                  >{conn.portNumber || "PON-01"}</span
                                >
                              </div>
                              <div>
                                <span class="text-slate-500"
                                  >{$language === "vi"
                                    ? "Thiết bị cấp:"
                                    : "Assigned Device:"}</span
                                >
                                <span
                                  class="text-slate-800 dark:text-slate-200 ml-1"
                                  >{conn.assignedDeviceModel ||
                                    "Standard CPE"}</span
                                >
                              </div>
                              <div class="font-mono">
                                <span class="text-slate-500"
                                  >{$language === "vi"
                                    ? "Số sê-ri CPE:"
                                    : "Serial:"}</span
                                >
                                <span
                                  class="text-slate-800 dark:text-slate-200 ml-1"
                                  >{conn.assignedDeviceSerial ||
                                    "NX-AUTO-GEN"}</span
                                >
                              </div>
                            </div>

                            <!-- Block 3: Contact & Address -->
                            <div
                              class="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2"
                            >
                              <div
                                class="text-slate-400 font-bold uppercase tracking-wider flex items-center space-x-1.5"
                              >
                                <User class="h-3.5 w-3.5 text-emerald-600" />
                                <span
                                  >{$language === "vi"
                                    ? "Liên hệ & Địa chỉ"
                                    : "Contact & Address"}</span
                                >
                              </div>
                              <div class="pt-1">
                                <span class="text-slate-500"
                                  >{$language === "vi"
                                    ? "Điện thoại:"
                                    : "Phone:"}</span
                                >
                                <span
                                  class="font-mono font-semibold text-slate-800 dark:text-slate-200 ml-1"
                                  >{conn.customerPhone}</span
                                >
                              </div>
                              <div>
                                <span class="text-slate-500"
                                  >{$language === "vi"
                                    ? "Email:"
                                    : "Email:"}</span
                                >
                                <span
                                  class="text-slate-800 dark:text-slate-200 ml-1"
                                  >{conn.customerEmail}</span
                                >
                              </div>
                              <div>
                                <span class="text-slate-500"
                                  >{$language === "vi"
                                    ? "Địa chỉ lắp đặt:"
                                    : "Installation:"}</span
                                >
                                <span
                                  class="text-slate-800 dark:text-slate-200 ml-1"
                                  >{conn.installationAddress}</span
                                >
                              </div>
                              {#if conn.lastStatusReason}
                                <div class="text-amber-500 pt-1">
                                  <span class="font-semibold"
                                    >{$language === "vi"
                                      ? "Lý do trạng thái:"
                                      : "Reason:"}</span
                                  >
                                  <p class="text-[11px] mt-0.5">
                                    {conn.lastStatusReason}
                                  </p>
                                </div>
                              {/if}
                            </div>

                            <!-- Block 4: Financial & Due Status -->
                            <div
                              class="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2"
                            >
                              <div
                                class="text-slate-400 font-bold uppercase tracking-wider flex items-center space-x-1.5"
                              >
                                <Receipt class="h-3.5 w-3.5 text-emerald-600" />
                                <span
                                  >{$language === "vi"
                                    ? "Tài chính & Nợ cước"
                                    : "Billing & Due Status"}</span
                                >
                              </div>
                              <div class="pt-1">
                                <span class="block text-[11px] text-slate-500"
                                  >{$language === "vi"
                                    ? "Số tiền còn nợ:"
                                    : "Outstanding Due:"}</span
                                >
                                <span
                                  class="text-lg font-bold font-mono {due > 0
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-emerald-600 dark:text-emerald-400'}"
                                >
                                  ${due.toFixed(2)}
                                </span>
                              </div>
                              <div>
                                <span
                                  class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold {due ===
                                  0
                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300'}"
                                >
                                  {due === 0
                                    ? $language === "vi"
                                      ? "Đã quyết toán đủ"
                                      : "Paid in Full"
                                    : $language === "vi"
                                      ? "Chưa thanh toán"
                                      : "Balance Outstanding"}
                                </span>
                              </div>
                              <div class="text-[11px] text-slate-500 pt-1">
                                {$language === "vi"
                                  ? `Tổng số hóa đơn: ${connBills.length}`
                                  : `Invoices on file: ${connBills.length}`}
                              </div>
                              {#if connBills.length > 0 && due > 0}
                                <button
                                  type="button"
                                  onclick={() =>
                                    handleOpenRetailPayment(connBills[0])}
                                  class="w-full mt-2 py-1.5 px-2.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center justify-center space-x-1 shadow-sm"
                                >
                                  <CreditCard class="h-3.5 w-3.5" />
                                  <span
                                    >{$language === "vi"
                                      ? "Thu tiền tại quầy"
                                      : "Pay at Counter"}</span
                                  >
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

  <!-- ==================== MODAL PHÂN CÔNG KỸ THUẬT VIÊN KHẢO SÁT ==================== -->
  {#if isAssignTechModalOpen && targetOrderForTechAssign}
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in overflow-y-auto"
    >
      <div
        class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-8"
      >
        <!-- Modal Header -->
        <div
          class="p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between"
        >
          <div class="flex items-center space-x-3">
            <div
              class="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20"
            >
              <Wrench class="h-6 w-6 text-white" />
            </div>
            <div>
              <h3
                class="font-bold text-lg leading-tight flex items-center gap-2"
              >
                <span
                  >{$language === "vi"
                    ? "Phân công kỹ thuật viên khảo sát"
                    : "Assign Survey Field Engineer"}</span
                >
                <span
                  class="px-2 py-0.5 rounded-md text-xs font-mono bg-white/20 font-bold"
                >
                  {targetOrderForTechAssign.id}
                </span>
              </h3>
              <p class="text-xs text-emerald-100 mt-0.5">
                {$language === "vi"
                  ? "Chỉ định kỹ thuật viên hiện trường chịu trách nhiệm đo kiểm cáp & hộp chia DP"
                  : "Designate a field engineer to perform line feasibility and DP box testing"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onclick={() => (isAssignTechModalOpen = false)}
            class="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <div class="p-6 space-y-5">
          <!-- Order Summary Card -->
          <div
            class="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            <div>
              <span class="text-slate-500 block"
                >{$language === "vi" ? "Khách hàng:" : "Customer:"}</span
              >
              <strong class="text-slate-900 dark:text-white text-sm"
                >{targetOrderForTechAssign.customerName}</strong
              >
              <span class="font-mono text-slate-500 block"
                >{targetOrderForTechAssign.customerPhone}</span
              >
            </div>
            <div>
              <span class="text-slate-500 block"
                >{$language === "vi"
                  ? "Địa chỉ lắp đặt:"
                  : "Installation Address:"}</span
              >
              <span class="text-slate-800 dark:text-slate-200 font-medium"
                >{targetOrderForTechAssign.installationAddress}</span
              >
            </div>
            <div>
              <span class="text-slate-500 block"
                >{$language === "vi"
                  ? "Dịch vụ & Gói cước:"
                  : "Plan & Service:"}</span
              >
              <div class="flex items-center gap-2 mt-0.5">
                <span
                  class="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                >
                  {targetOrderForTechAssign.connectionType}
                </span>
                <strong class="text-slate-900 dark:text-white"
                  >{targetOrderForTechAssign.planName}</strong
                >
              </div>
            </div>
            <div>
              <span class="text-slate-500 block"
                >{$language === "vi"
                  ? "Điểm quầy phụ trách:"
                  : "Branch Desk:"}</span
              >
              <span
                class="font-mono text-slate-800 dark:text-slate-200 font-semibold"
                >{targetOrderForTechAssign.retailOutletCode}</span
              >
              <span class="text-slate-500 text-[11px]">
                ({targetOrderForTechAssign.retailEmployeeName})</span
              >
            </div>
          </div>

          <!-- Section: Select Technician -->
          <div class="space-y-3">
            <div
              class="flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <label
                class="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
              >
                <UserCheck class="h-4 w-4 text-emerald-600" />
                <span
                  >{$language === "vi"
                    ? "Chọn kỹ thuật viên đảm nhiệm (*)"
                    : "Select Field Engineer (*)"}</span
                >
              </label>

              <!-- Search tech -->
              <div class="relative max-w-xs w-full">
                <Search
                  class="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  bind:value={techSearchQuery}
                  placeholder={$language === "vi"
                    ? "Tìm kỹ thuật viên..."
                    : "Search tech..."}
                  class="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <!-- Technicians Grid -->
            <div
              class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1"
            >
              {#each filteredAvailableTechnicians as tech (tech.id)}
                {@const isSelected = selectedTechnicianId === tech.id}
                {@const pendingCount = getTechnicianPendingCount(tech.name)}
                <button
                  type="button"
                  onclick={() => (selectedTechnicianId = tech.id)}
                  class="p-3 rounded-xl border text-left transition-all flex flex-col justify-between {isSelected
                    ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-500/30 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'}"
                >
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex items-center space-x-2.5">
                      <div
                        class="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-300 dark:border-emerald-800"
                      >
                        {tech.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div>
                        <div
                          class="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5"
                        >
                          <span>{tech.name}</span>
                          <span class="font-mono text-[10px] text-slate-400"
                            >({tech.employeeCode})</span
                          >
                        </div>
                        <div
                          class="text-[11px] text-slate-500 dark:text-slate-400 font-mono"
                        >
                          {tech.phone}
                        </div>
                      </div>
                    </div>
                    <div
                      class="h-4 w-4 rounded-full border flex items-center justify-center {isSelected
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-700'}"
                    >
                      {#if isSelected}
                        <div class="h-1.5 w-1.5 rounded-full bg-white"></div>
                      {/if}
                    </div>
                  </div>

                  <div
                    class="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]"
                  >
                    <span class="text-slate-500 truncate max-w-[130px]">
                      {tech.retailShopAssigned || tech.department}
                    </span>
                    <span
                      class="px-2 py-0.5 rounded-full font-medium text-[10px] {pendingCount ===
                      0
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : pendingCount <= 2
                          ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'}"
                    >
                      {pendingCount === 0
                        ? $language === "vi"
                          ? "Sẵn sàng (0 việc)"
                          : "Free (0 tasks)"
                        : $language === "vi"
                          ? `${pendingCount} việc đang chờ`
                          : `${pendingCount} active`}
                    </span>
                  </div>
                </button>
              {/each}
            </div>
          </div>

          <!-- Section: Optional Notes -->
          <div>
            <label
              class="block font-semibold text-xs text-slate-700 dark:text-slate-300 mb-1"
            >
              {$language === "vi"
                ? "Ghi chú khảo sát / Hướng dẫn thêm (Tùy chọn):"
                : "Survey Instructions / Notes (Optional):"}
            </label>
            <textarea
              bind:value={assignSurveyNotes}
              rows="2"
              placeholder={$language === "vi"
                ? "Ví dụ: Khách yêu cầu đo kiểm cáp trước 11h trưa, kiểm tra hộp chia DP tầng 3..."
                : "e.g., Customer requested morning appointment, inspect DP box on 3rd floor..."}
              class="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            ></textarea>
          </div>

          <!-- Modal Actions -->
          <div
            class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800"
          >
            <button
              type="button"
              onclick={() => (isAssignTechModalOpen = false)}
              class="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            >
              {$language === "vi" ? "Hủy bỏ" : "Cancel"}
            </button>
            <button
              type="button"
              onclick={handleConfirmAssignTechnician}
              class="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition shadow-md flex items-center gap-1.5"
            >
              <CheckCircle2 class="h-4 w-4" />
              <span
                >{$language === "vi"
                  ? "Xác nhận phân công"
                  : "Confirm Assignment"}</span
              >
            </button>
          </div>
        </div>
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

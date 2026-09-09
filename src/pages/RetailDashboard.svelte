<script lang="ts">
  // Mirrors pages/RetailDashboard.tsx of the React original.
  // NOTE: the React source declares duplicate navItems (hardcoded VI + i18n);
  // here we keep only the i18n entries (intended behavior).
  import { nexusStore } from '../context/NexusContext';
  import { languageStore } from '../context/LanguageContext';
  import DashboardLayout from '../components/layout/DashboardLayout.svelte';
  import type { NavItem } from '../components/layout/DashboardLayout.svelte';
  import {
    ShoppingBag, Search, CheckCircle2, Clock, Wifi, Radio, Phone, FileText,
    CreditCard, User, Copy, Receipt, ArrowRight, Sparkles, Plus, Settings,
  } from 'lucide-svelte';
  import type { ConnectionType, Order } from '../types/nexus';
  import { getBulkDiscountPercent } from '../context/NexusContext';
  import { toast } from 'svelte-sonner';

  type RetailTab = 'new-order' | 'order-tracking' | 'connection-details' | 'payment-records' | 'settings';

  const { plans, placeOrder, orders, connections, bills } = nexusStore;
  const { t, language } = languageStore;

  // Active navigation tab
  let activeTab = $state<RetailTab>('new-order');

  // FORM STATE: PLACE ORDER
  let customerName = $state('');
  let customerPhone = $state('');
  let customerEmail = $state('');
  let installationAddress = $state('');
  let idProofType = $state<Order['idProofType']>('National ID Card');
  let idProofNumber = $state('');
  let connectionType = $state<ConnectionType>('Broadband');
  let selectedPlanId = $state('');
  // Bulk / corporate scheme + Dial-Up existing landline
  let bulkConnectionsCount = $state(1);
  let hasExistingLandline = $state(false);
  let existingLandlineAccountId = $state('');
  const bulkDiscountPercent = $derived(getBulkDiscountPercent(bulkConnectionsCount));

  // Success Modal for newly generated Order
  let placedOrder = $state<Order | null>(null);

  // STATE: ORDER TRACKING (11-char Order ID) — advanced search fields
  let trackingSearchQuery = $state('D0000000001');
  let advOrderName = $state('');
  let advOrderType = $state<'All' | ConnectionType>('All');
  let advOrderPhone = $state('');
  let advOrderFrom = $state('');
  let advOrderTo = $state('');
  let trackedOrder = $state<Order | null>(
    $orders.find((o) => o.id === 'D0000000001') || $orders[0] || null
  );

  // STATE: CONNECTION DETAILS (16-char Account ID) — advanced search fields
  let accountSearchQuery = $state('T064-000000000001');
  let advConnName = $state('');
  let advConnType = $state<'All' | ConnectionType>('All');
  let advConnPhone = $state('');
  let advConnFrom = $state('');
  let advConnTo = $state('');
  let trackedConnection = $state(
    $connections.find((c) => c.accountId === 'T064-000000000001') || $connections[0] || null
  );

  // STATE: PAYMENT RECORDS SEARCH
  let paymentAccountQuery = $state('');

  // Advanced search results
  const advOrderResults = $derived(
    $orders.filter((o) => {
      const q = trackingSearchQuery.trim().toUpperCase();
      if (q && !o.id.toUpperCase().includes(q)) return false;
      if (advOrderName.trim() && !o.customerName.toLowerCase().includes(advOrderName.trim().toLowerCase())) return false;
      if (advOrderType !== 'All' && o.connectionType !== advOrderType) return false;
      if (advOrderPhone.trim() && !o.customerPhone.replace(/\D/g, '').includes(advOrderPhone.replace(/\D/g, ''))) return false;
      const day = o.createdAt.slice(0, 10);
      if (advOrderFrom && day < advOrderFrom) return false;
      if (advOrderTo && day > advOrderTo) return false;
      return true;
    })
  );

  const advConnResults = $derived(
    $connections.filter((c) => {
      const q = accountSearchQuery.trim().replace(/-/g, '').toUpperCase();
      if (q && !c.accountId.replace(/-/g, '').toUpperCase().includes(q)) return false;
      if (advConnName.trim() && !c.customerName.toLowerCase().includes(advConnName.trim().toLowerCase())) return false;
      if (advConnType !== 'All' && c.connectionType !== advConnType) return false;
      if (advConnPhone.trim() && !c.customerPhone.replace(/\D/g, '').includes(advConnPhone.replace(/\D/g, ''))) return false;
      const day = (c.installedDate || '').slice(0, 10);
      if (advConnFrom && day < advConnFrom) return false;
      if (advConnTo && day > advConnTo) return false;
      return true;
    })
  );

  // Filter available plans according to selected Connection Type
  const availablePlans = $derived($plans.filter((p) => p.type === connectionType && p.status === 'Active'));
  const currentPlan = $derived($plans.find((p) => p.id === selectedPlanId) || availablePlans[0]);

  // Default the plan to the first one available for the chosen connection type.
  $effect(() => {
    if (!availablePlans.some((p) => p.id === selectedPlanId)) {
      selectedPlanId = availablePlans[0]?.id ?? '';
    }
  });

  // FORM SUBMISSION LOGIC: PLACE ORDER
  const handlePlaceOrderSubmit = (e: SubmitEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !customerPhone.trim() || !installationAddress.trim()) {
      toast.error('Please enter all required customer information.');
      return;
    }

    if (!idProofNumber.trim()) {
      toast.error('Please enter customer ID proof verification number.');
      return;
    }

    if (!currentPlan) {
      toast.error('Please select an active service plan.');
      return;
    }

    const newOrder = placeOrder({
      customerName,
      customerPhone,
      customerEmail: customerEmail || `${customerName.toLowerCase().replace(/\s+/g, '.')}@client.nexus`,
      installationAddress,
      idProofType,
      idProofNumber,
      connectionType,
      planId: currentPlan.id,
      planName: currentPlan.name,
      retailOutletCode: 'SH-01',
      retailEmployeeName: 'David Chen',
      bulkConnectionsCount: Math.max(1, bulkConnectionsCount || 1),
      ...(connectionType === 'Dial-Up' && hasExistingLandline && existingLandlineAccountId.trim()
        ? { existingLandlineAccountId: existingLandlineAccountId.trim() }
        : {}),
    });

    placedOrder = newOrder;
    toast.success(`Order ${newOrder.id} successfully created!`);

    // Reset Form for next retail customer
    customerName = '';
    customerPhone = '';
    customerEmail = '';
    installationAddress = '';
    idProofNumber = '';
    bulkConnectionsCount = 1;
    hasExistingLandline = false;
    existingLandlineAccountId = '';
  };

  // ORDER TRACKING SEARCH HANDLER
  const handleSearchOrder = (idToSearch?: string) => {
    const targetId = (idToSearch || trackingSearchQuery).trim().toUpperCase();
    const found = $orders.find((o) => o.id.toUpperCase() === targetId);
    if (found) {
      trackedOrder = found;
      toast.success(`Found Order ${found.id}`);
    } else {
      toast.error(`No order found matching ID "${targetId}". Must be an 11-character ID (e.g. D0000000001)`);
    }
  };

  // CONNECTION DETAILS SEARCH HANDLER
  const handleSearchConnection = (idToSearch?: string) => {
    const targetId = (idToSearch || accountSearchQuery).trim();
    const found = $connections.find(
      (c) => c.accountId.replace(/-/g, '') === targetId.replace(/-/g, '')
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
  const getStageIndex = (status: Order['status']) => {
    switch (status) {
      case 'Pending':
        return 1;
      case 'Feasible':
        return 2;
      case 'Connection Provided':
        return 4;
      case 'Not Feasible':
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
    customerName = 'Eleanor Vance';
    customerPhone = '+1 (555) 712-4490';
    customerEmail = 'eleanor.vance@brooklynart.org';
    installationAddress = '240 Bedford Ave, Apt 3A, Williamsburg, NY 11211';
    idProofType = 'National ID Card';
    idProofNumber = 'ID-NY-9920194';
    connectionType = 'Broadband';
    selectedPlanId = $plans.find((p) => p.type === 'Broadband' && p.status === 'Active')?.id ?? '';
    toast.info('Form pre-filled with demo walk-in customer data');
  };

  const trackThisOrder = () => {
    const id = placedOrder!.id;
    placedOrder = null;
    activeTab = 'order-tracking';
    trackingSearchQuery = id;
    handleSearchOrder(id);
  };

  const connectionTypeCards: { type: ConnectionType; icon: typeof Wifi; desc: string }[] = [
    { type: 'Broadband', icon: Wifi, desc: 'High-Speed Fiber FTTH' },
    { type: 'Dial-Up', icon: Radio, desc: '56k Analog PSTN Modem' },
    { type: 'Landline', icon: Phone, desc: 'Fixed Voice / VoIP Phone' },
  ];

  const stepperStages = [
    { step: 1, label: 'Order Logged', sub: 'Retail Counter' },
    { step: 2, label: 'Feasibility Checked', sub: 'Field Telemetry' },
    { step: 3, label: 'Tech Dispatch', sub: 'CPE & Port Bind' },
    { step: 4, label: 'Connection Live', sub: '16-char Account' },
  ];

  const retailNavItems: NavItem[] = $derived([
    { id: 'new-order', label: $t.retailNav.newOrder, icon: ShoppingBag },
    { id: 'order-tracking', label: $t.retailNav.orderTracking, icon: Clock, badge: $orders.length },
    { id: 'connection-details', label: $t.retailNav.connectionDetails, icon: Wifi, badge: $connections.length },
    { id: 'payment-records', label: $t.retailNav.paymentRecords, icon: CreditCard, badge: $bills.length },
    { id: 'settings', label: $t.retailNav.settings, icon: Settings },
  ]);
</script>

<DashboardLayout
  activeTab={activeTab}
  onTabChange={(tab) => (activeTab = tab as RetailTab)}
  navItems={retailNavItems}
  roleBadgeTitle={$t.roles.retail}
  pageTitle={retailNavItems.find((n) => n.id === activeTab)?.label}
  primaryAction={{
    label: $t.actions.newOrder,
    onClick: () => (activeTab = 'new-order'),
    icon: Plus,
  }}
>
  <!-- TAB 1: PLACE ORDER FORM -->
  {#if activeTab === 'new-order'}
    <div class="tab-content-animate grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Place Order Form -->
      <form
        onsubmit={handlePlaceOrderSubmit}
        class="lg:col-span-2 space-y-6 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
      >
        <!-- SECTION A: Customer Personal Details -->
        <div>
          <div class="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">
            <User class="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 class="font-semibold text-sm uppercase tracking-wider text-slate-900 dark:text-white">
              Step 1: Customer Personal Details
            </h3>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Legal Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Julian Thorne"
                bind:value={customerName}
                class="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Phone *</label>
              <input
                type="tel"
                required
                placeholder="+1 (555) 000-0000"
                bind:value={customerPhone}
                class="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address (Optional)</label>
              <input
                type="email"
                placeholder="julian.t@example.com"
                bind:value={customerEmail}
                class="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Identity Proof Document *</label>
              <div class="grid grid-cols-2 gap-2">
                <select
                  bind:value={idProofType}
                  class="px-2 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="National ID Card">National ID</option>
                  <option value="Passport">Passport</option>
                  <option value="Driver's License">Driver's Lic.</option>
                </select>
                <input
                  type="text"
                  required
                  placeholder="Document #"
                  bind:value={idProofNumber}
                  class="px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div class="sm:col-span-2">
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Physical Installation Address *</label>
              <input
                type="text"
                required
                placeholder="Street address, Apt/Suite, City, Postal Code"
                bind:value={installationAddress}
                class="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        <!-- SECTION B: Connection Type Selection -->
        <div>
          <div class="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">
            <Wifi class="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 class="font-semibold text-sm uppercase tracking-wider text-slate-900 dark:text-white">
              Step 2: Connection Type
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
                  <item.icon class="h-5 w-5 {isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}" />
                  {#if isSelected}
                    <CheckCircle2 class="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  {/if}
                </div>
                <div>
                  <div class="font-bold text-sm">{item.type}</div>
                  <div class="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</div>
                </div>
              </button>
            {/each}
          </div>
        </div>

        <!-- SECTION C: Plan Selection -->
        <div>
          <div class="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">
            <FileText class="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 class="font-semibold text-sm uppercase tracking-wider text-slate-900 dark:text-white">
              Step 3: Plan Selection ({connectionType})
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
                    <span class="font-semibold text-sm text-slate-900 dark:text-white">{plan.name}</span>
                    <span class="text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                      {plan.speedOrBandwidth}
                    </span>
                  </div>
                  <p class="text-xs text-slate-500 dark:text-slate-400">{plan.description}</p>
                </div>

                <div class="text-right shrink-0 pl-4">
                  <div class="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    ${plan.monthlyRental.toFixed(2)}<span class="text-xs font-normal text-slate-400">/mo</span>
                  </div>
                  <div class="text-[11px] text-slate-400 font-mono">Deposit: ${plan.securityDeposit.toFixed(2)}</div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- SECTION D: Bulk scheme & Dial-Up existing landline -->
        <div>
          <div class="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">
            <FileText class="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 class="font-semibold text-sm uppercase tracking-wider text-slate-900 dark:text-white">
              Step 4: Bulk Scheme{connectionType === 'Dial-Up' ? ' & Landline' : ''}
            </h3>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {$language === 'vi' ? 'Số lượng kết nối (gói doanh nghiệp)' : 'Number of connections (bulk)'}
              </label>
              <input
                type="number"
                min="1"
                bind:value={bulkConnectionsCount}
                class="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p class="text-[11px] text-slate-500 mt-1">
                {bulkDiscountPercent > 0
                  ? `${$language === 'vi' ? 'Chiết khấu' : 'Scheme discount'}: −${bulkDiscountPercent}% ${$language === 'vi' ? '(cước ứng trước + tiền cọc)' : '(advance + deposit)'}`
                  : $language === 'vi' ? 'Từ 10 kết nối trở lên được hưởng chiết khấu.' : 'Discount applies from 10 connections upward.'}
              </p>
            </div>
            {#if connectionType === 'Dial-Up'}
              <div>
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {$language === 'vi' ? 'Đã có landline Nexus?' : 'Existing Nexus landline?'}
                </label>
                <label class="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-300 py-1.5">
                  <input type="checkbox" bind:checked={hasExistingLandline} class="h-4 w-4 rounded" />
                  <span>{$language === 'vi' ? 'Chỉ kiểm tra khả thi phần internet' : 'Only the internet leg needs a feasibility check'}</span>
                </label>
                {#if hasExistingLandline}
                  <input
                    type="text"
                    placeholder={$language === 'vi' ? 'Mã tài khoản landline (nếu có)' : 'Landline Account ID (optional)'}
                    bind:value={existingLandlineAccountId}
                    class="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                {/if}
              </div>
            {/if}
          </div>
        </div>

        <!-- Submit Action -->
        <div class="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div class="text-xs text-slate-500">
            Submitting generates an official <strong class="text-slate-700 dark:text-slate-300">11-character Order ID</strong> (D/B/T + serial) and routes to Tech Feasibility.
          </div>
          <button
            type="submit"
            class="px-6 py-2.5 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-md flex items-center space-x-2"
          >
            <span>Place Order & Generate ID</span>
            <ArrowRight class="h-4 w-4" />
          </button>
        </div>
      </form>

      <!-- Order Summary & Fast Entry Assist -->
      <div class="space-y-4">
        <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
          <h3 class="font-semibold text-sm uppercase tracking-wider text-slate-900 dark:text-white flex items-center space-x-2">
            <Receipt class="h-4 w-4 text-emerald-500" />
            <span>Order Cost Summary</span>
          </h3>

          {#if currentPlan}
            {@const base = currentPlan.monthlyRental + currentPlan.securityDeposit}
            {@const disc = (base * bulkDiscountPercent) / 100}
            {@const taxed = (base - disc) * 1.1224}
            <div class="space-y-3 text-xs">
              <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div class="flex justify-between">
                  <span class="text-slate-500">Selected Plan:</span>
                  <span class="font-semibold text-slate-900 dark:text-white text-right">{currentPlan.name}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">Bandwidth:</span>
                  <span class="font-mono text-slate-700 dark:text-slate-300">{currentPlan.speedOrBandwidth}</span>
                </div>
              </div>

              <div class="space-y-1.5 pt-1">
                <div class="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>First Month Rental:</span>
                  <span class="font-mono tabular-nums">${currentPlan.monthlyRental.toFixed(2)}</span>
                </div>
                <div class="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Refundable Security Deposit:</span>
                  <span class="font-mono tabular-nums">${currentPlan.securityDeposit.toFixed(2)}</span>
                </div>
                {#if bulkDiscountPercent > 0}
                  <div class="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Bulk scheme ({bulkConnectionsCount} conns) −{bulkDiscountPercent}%:</span>
                    <span class="font-mono tabular-nums">−${disc.toFixed(2)}</span>
                  </div>
                {/if}
                <div class="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Est. Service Tax (12.24%):</span>
                  <span class="font-mono tabular-nums">${(((base - disc) * 12.24) / 100).toFixed(2)}</span>
                </div>
                <div class="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between font-bold text-sm text-slate-900 dark:text-white">
                  <span>Initial Due at Counter:</span>
                  <span class="font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                    ${taxed.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          {:else}
            <div class="text-xs text-slate-400">Please select a plan to view cost breakdown.</div>
          {/if}
        </div>

        <!-- Retail Quick Fill Demo Helper -->
        <div class="rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/5 p-4 text-xs space-y-2">
          <div class="flex items-center space-x-2 font-semibold text-emerald-700 dark:text-emerald-400">
            <Sparkles class="h-4 w-4" />
            <span>Retail Fast-Fill Demo</span>
          </div>
          <p class="text-slate-600 dark:text-slate-400">
            Quickly populate walk-in customer details to speed up retail testing:
          </p>
          <button
            type="button"
            onclick={fillDemoCustomer}
            class="w-full py-1.5 px-3 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-700 dark:text-emerald-300 font-medium transition text-center"
          >
            Fill Sample Customer Data
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- TAB 2: ORDER TRACKING -->
  {#if activeTab === 'order-tracking'}
    <div class="space-y-6">
      <!-- Advanced search: ID / name / type / date period / contact number -->
      <div class="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Advanced order search — 11-char Order ID (D/B/T + serial), name, type, date period, phone
        </label>

        <div class="flex gap-2">
          <div class="relative flex-1">
            <Search class="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              maxlength="11"
              placeholder="Order ID e.g. D0000000001"
              bind:value={trackingSearchQuery}
              oninput={(e) => (trackingSearchQuery = (e.currentTarget as HTMLInputElement).value.toUpperCase())}
              onkeydown={(e) => e.key === 'Enter' && handleSearchOrder()}
              class="w-full pl-9 pr-4 py-2.5 text-base font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase tracking-widest"
            />
          </div>
          <button
            onclick={() => handleSearchOrder()}
            class="px-5 py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow"
          >
            Track Order
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
          <input type="text" placeholder="Name on order" bind:value={advOrderName}
            class="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          <select bind:value={advOrderType}
            class="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="All">Any type</option>
            <option value="Broadband">Broadband</option>
            <option value="Dial-Up">Dial-Up</option>
            <option value="Landline">Landline (Telephone)</option>
          </select>
          <input type="text" placeholder="Contact number" bind:value={advOrderPhone}
            class="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          <input type="date" bind:value={advOrderFrom} title="Applied from"
            class="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          <input type="date" bind:value={advOrderTo} title="Applied to"
            class="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>

        <div class="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
          <span>Results ({advOrderResults.length}):</span>
          {#each advOrderResults.slice(0, 12) as o (o.id)}
            <button
              onclick={() => (trackedOrder = o)}
              class="font-mono text-emerald-600 dark:text-emerald-400 hover:underline bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40"
            >
              {o.id} · {o.customerName.split(' ')[0]} ({o.status})
            </button>
          {:else}
            <span class="italic">No matching orders.</span>
          {/each}
        </div>
      </div>

      <!-- Visual Tracking Timeline & Details -->
      {#if trackedOrder}
        <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
          <!-- Header with status badge -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <div class="flex items-center space-x-3">
                <h2 class="text-xl font-bold font-mono text-slate-900 dark:text-white">Order #{trackedOrder.id}</h2>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold {trackedOrder.status === 'Connection Provided'
                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                  : trackedOrder.status === 'Feasible'
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                    : trackedOrder.status === 'Not Feasible'
                      ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
                      : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'}">
                  {trackedOrder.status}
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-1">
                Submitted at {trackedOrder.createdAt} by {trackedOrder.retailEmployeeName} ({trackedOrder.retailOutletCode})
              </p>
            </div>

            <button
              onclick={() => copyToClipboard(trackedOrder!.id, 'Order ID')}
              class="inline-flex items-center space-x-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg"
            >
              <Copy class="h-3.5 w-3.5" />
              <span>Copy ID</span>
            </button>
          </div>

          <!-- 4-Stage Visual Progress Stepper -->
          <div class="py-4">
            <div class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-6">Fulfillment Lifecycle Stepper</div>

            <div class="grid grid-cols-4 gap-2 relative">
              {#each stepperStages as st (st.step)}
                {@const stageIdx = getStageIndex(trackedOrder!.status)}
                {@const isComplete = stageIdx >= st.step}
                {@const isFailed = trackedOrder!.status === 'Not Feasible' && st.step >= 2}
                <div class="text-center space-y-2">
                  <div class="h-10 w-10 mx-auto rounded-full flex items-center justify-center font-bold text-xs transition-colors {isFailed
                    ? 'bg-rose-500 text-white'
                    : isComplete
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}">
                    {#if isFailed}
                      !
                    {:else if isComplete}
                      <CheckCircle2 class="h-5 w-5" />
                    {:else}
                      {st.step}
                    {/if}
                  </div>
                  <div>
                    <div class="text-xs font-bold text-slate-900 dark:text-white">{st.label}</div>
                    <div class="text-[11px] text-slate-500">{st.sub}</div>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <!-- Order Details Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-sm">
            <div class="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <h4 class="font-semibold text-xs text-slate-500 uppercase">Customer Profile</h4>
              <div class="space-y-1.5 text-xs">
                <div><strong>Name:</strong> {trackedOrder.customerName}</div>
                <div><strong>Phone:</strong> {trackedOrder.customerPhone}</div>
                <div><strong>Email:</strong> {trackedOrder.customerEmail}</div>
                <div><strong>Verification:</strong> {trackedOrder.idProofType} ({trackedOrder.idProofNumber})</div>
                <div><strong>Address:</strong> {trackedOrder.installationAddress}</div>
              </div>
            </div>

            <div class="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <h4 class="font-semibold text-xs text-slate-500 uppercase">Service & Technical Data</h4>
              <div class="space-y-1.5 text-xs">
                <div><strong>Plan:</strong> {trackedOrder.planName} ({trackedOrder.connectionType})</div>
                <div><strong>Cable Distance:</strong> {trackedOrder.cableDistanceMeters || 120} meters</div>
                <div><strong>DP Box Status:</strong> {trackedOrder.dpBoxCapacity || 'Port Available'}</div>
                {#if trackedOrder.feasibilityNotes}
                  <div class="text-amber-600 dark:text-amber-400 pt-1"><strong>Field Notes:</strong> {trackedOrder.feasibilityNotes}</div>
                {/if}
                {#if trackedOrder.assignedAccountId}
                  <div class="pt-2">
                    <span class="text-xs text-emerald-600 font-semibold block">Issued 16-character Account ID:</span>
                    <span class="font-mono text-base font-bold text-slate-900 dark:text-white">{trackedOrder.assignedAccountId}</span>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        </div>
      {:else}
        <div class="text-center py-12 text-slate-400">
          Enter an 11-character Order ID above to inspect tracking status.
        </div>
      {/if}
    </div>
  {/if}

  <!-- TAB 3: CONNECTION DETAILS -->
  {#if activeTab === 'connection-details'}
    <div class="space-y-6">
      <!-- Advanced search: Account ID / name / type / date period / contact number -->
      <div class="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Advanced connection search — 16-char Account ID (T064-000000000001), name, type, install date, phone
        </label>

        <div class="flex gap-2">
          <div class="relative flex-1">
            <Search class="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Account ID e.g. T064-000000000001"
              bind:value={accountSearchQuery}
              onkeydown={(e) => e.key === 'Enter' && handleSearchConnection()}
              class="w-full pl-9 pr-4 py-2.5 text-base font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 tracking-widest"
            />
          </div>
          <button
            onclick={() => handleSearchConnection()}
            class="px-5 py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow"
          >
            Retrieve Profile
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
          <input type="text" placeholder="Subscriber name" bind:value={advConnName}
            class="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          <select bind:value={advConnType}
            class="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="All">Any type</option>
            <option value="Broadband">Broadband</option>
            <option value="Dial-Up">Dial-Up</option>
            <option value="Landline">Landline (Telephone)</option>
          </select>
          <input type="text" placeholder="Contact number" bind:value={advConnPhone}
            class="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          <input type="date" bind:value={advConnFrom} title="Installed from"
            class="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          <input type="date" bind:value={advConnTo} title="Installed to"
            class="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>

        <div class="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
          <span>Results ({advConnResults.length}):</span>
          {#each advConnResults.slice(0, 12) as c (c.accountId)}
            <button
              onclick={() => (trackedConnection = c)}
              class="font-mono text-emerald-600 dark:text-emerald-400 hover:underline bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40"
            >
              {c.accountId} · {c.customerName.split(' ')[0]} ({c.status})
            </button>
          {:else}
            <span class="italic">No matching connections.</span>
          {/each}
        </div>
      </div>

      <!-- Connection Profile Card -->
      {#if trackedConnection}
        <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <div class="flex items-center space-x-3">
                <h2 class="text-xl font-bold font-mono text-slate-900 dark:text-white">Account #{trackedConnection.accountId}</h2>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold {trackedConnection.status === 'Active'
                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                  : trackedConnection.status === 'Temporarily Inactive'
                    ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                    : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'}">
                  {trackedConnection.status}
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-1">
                Subscriber: <strong class="text-slate-700 dark:text-slate-300">{trackedConnection.customerName}</strong> • Activated on {trackedConnection.installedDate}
              </p>
            </div>

            <div class="flex items-center space-x-2">
              <button
                onclick={() => copyToClipboard(trackedConnection!.accountId, 'Account ID')}
                class="inline-flex items-center space-x-1 text-xs border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-white"
              >
                <Copy class="h-3.5 w-3.5" />
                <span>Copy Account ID</span>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div class="text-slate-400 font-semibold uppercase">Service Parameters</div>
              <div><strong>Plan:</strong> {trackedConnection.planName}</div>
              <div><strong>Connection:</strong> {trackedConnection.connectionType}</div>
              <div><strong>Monthly Rental:</strong> ${trackedConnection.monthlyRental.toFixed(2)}</div>
              <div><strong>Security Deposit:</strong> ${trackedConnection.securityDeposit.toFixed(2)}</div>
            </div>

            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div class="text-slate-400 font-semibold uppercase">Physical & Circuit Data</div>
              <div><strong>Assigned IP:</strong> {trackedConnection.ipAddress || 'Dynamic DHCP'}</div>
              <div><strong>Switch Port:</strong> {trackedConnection.portNumber || 'PON-01'}</div>
              <div><strong>Assigned Device:</strong> {trackedConnection.assignedDeviceModel || 'Standard CPE'}</div>
              <div class="font-mono"><strong>Serial:</strong> {trackedConnection.assignedDeviceSerial || 'NX-AUTO-GEN'}</div>
            </div>

            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div class="text-slate-400 font-semibold uppercase">Contact & Address</div>
              <div><strong>Phone:</strong> {trackedConnection.customerPhone}</div>
              <div><strong>Email:</strong> {trackedConnection.customerEmail}</div>
              <div><strong>Installation:</strong> {trackedConnection.installationAddress}</div>
              {#if trackedConnection.lastStatusReason}
                <div class="text-amber-500 pt-1"><strong>Reason:</strong> {trackedConnection.lastStatusReason}</div>
              {/if}
            </div>
          </div>
        </div>
      {:else}
        <div class="text-center py-12 text-slate-400">
          Enter a 16-character Account ID above to retrieve connection details.
        </div>
      {/if}
    </div>
  {/if}

  <!-- TAB 4: PAYMENT RECORDS -->
  {#if activeTab === 'payment-records'}
    <div class="space-y-6">
      <div class="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div class="relative w-full sm:w-80">
          <Search class="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by Account ID or Name..."
            bind:value={paymentAccountQuery}
            class="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
          />
        </div>

        <div class="text-xs text-slate-500">Showing transaction ledgers across all retail customers</div>
      </div>

      <!-- Invoices & Payments Table -->
      <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th class="px-4 py-3">Invoice Number</th>
                <th class="px-4 py-3">16-character Account ID</th>
                <th class="px-4 py-3">Subscriber Name</th>
                <th class="px-4 py-3">Billing Cycle</th>
                <th class="px-4 py-3">Total Amount ($)</th>
                <th class="px-4 py-3">Amount Paid ($)</th>
                <th class="px-4 py-3">Due Balance ($)</th>
                <th class="px-4 py-3">Payment Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              {#each $bills.filter((b) => b.accountId.toLowerCase().includes(paymentAccountQuery.toLowerCase()) || b.customerName.toLowerCase().includes(paymentAccountQuery.toLowerCase())) as bill (bill.id)}
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td class="px-4 py-3 font-mono font-medium text-slate-900 dark:text-slate-100">{bill.invoiceNumber}</td>
                  <td class="px-4 py-3 font-mono text-xs text-emerald-600 dark:text-emerald-400">{bill.accountId}</td>
                  <td class="px-4 py-3 font-semibold text-slate-900 dark:text-white">{bill.customerName}</td>
                  <td class="px-4 py-3 text-xs text-slate-500">{bill.billingMonth}</td>
                  <td class="px-4 py-3 font-mono tabular-nums font-medium">${bill.totalAmount.toFixed(2)}</td>
                  <td class="px-4 py-3 font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">${bill.amountPaid.toFixed(2)}</td>
                  <td class="px-4 py-3 font-mono tabular-nums text-rose-600 dark:text-rose-400 font-semibold">${bill.dueAmount.toFixed(2)}</td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold {bill.status === 'Paid'
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                      : bill.status === 'Partially Paid'
                        ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                        : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'}">
                      {bill.status}
                    </span>
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
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div class="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4 text-center">
        <div class="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
          <CheckCircle2 class="h-6 w-6" />
        </div>

        <div>
          <h3 class="text-lg font-bold text-slate-900 dark:text-white">New Order Successfully Booked!</h3>
          <p class="text-xs text-slate-500 mt-1">Order routed directly to the Technical Staff Feasibility Queue.</p>
        </div>

        <!-- Highlighted 11-character Order ID -->
        <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
          <div class="text-xs text-slate-400 font-semibold uppercase">Official 11-Digit Order ID</div>
          <div class="text-2xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400 tracking-wider">{placedOrder.id}</div>
          <div class="text-[11px] text-slate-500">Customer: {placedOrder.customerName} • {placedOrder.planName}</div>
        </div>

        <!-- The 16-character Account ID is issued later, on feasibility confirmation -->
        <div class="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 space-y-1">
          <div class="text-xs text-sky-600 dark:text-sky-400 font-semibold uppercase">Account ID pending</div>
          <div class="text-[11px] text-slate-500">
            The customer's 16-character Account ID — their only sign-in credential — is issued once technical
            confirms the line is feasible. Until then they track this order code.
          </div>
        </div>

        <div class="flex gap-2 justify-center">
          <button
            onclick={() => copyToClipboard(placedOrder!.id, 'Order ID')}
            class="px-4 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-1.5"
          >
            <Copy class="h-3.5 w-3.5" />
            <span>Copy Order ID</span>
          </button>
          <button
            onclick={trackThisOrder}
            class="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center space-x-1.5"
          >
            <span>Track This Order</span>
            <ArrowRight class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- SETTINGS TAB -->
  {#if activeTab === 'settings'}
    <div class="rounded-xl bg-white dark:bg-[#1E3349] p-8 text-center shadow-sm border border-[#CCE4F7] dark:border-[#253D56]">
      <Settings class="h-12 w-12 mx-auto text-[#7899B8] dark:text-[#5E7F9F] mb-4" />
      <h3 class="text-lg font-bold text-[#0F1D2B] dark:text-white mb-2">{$t.dashboard.settingsTitle}</h3>
      <p class="text-[#537292] dark:text-[#8DB0D4]">{$t.dashboard.settingsDesc}</p>
    </div>
  {/if}
</DashboardLayout>


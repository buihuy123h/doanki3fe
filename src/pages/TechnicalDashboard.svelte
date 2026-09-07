<script lang="ts">
  // Mirrors pages/TechnicalDashboard.tsx of the React original.
  import { nexusStore } from '../context/NexusContext';
  import { languageStore } from '../context/LanguageContext';
  import DashboardLayout from '../components/layout/DashboardLayout.svelte';
  import type { NavItem } from '../components/layout/DashboardLayout.svelte';
  import {
    Search, Zap, Activity, Radio, HardDrive, Plus, Power, ShieldAlert, X, Copy, Settings,
  } from 'lucide-svelte';
  import type { Order, ConnectionStatus, Equipment, OrderStatus } from '../types/nexus';
  import { toast } from 'svelte-sonner';

  type TechTab = 'feasibility-queue' | 'connection-manager' | 'equipment-tracker' | 'settings';

  const {
    orders, updateOrderStatus, provisionConnectionForOrder,
    connections, updateConnectionStatus, equipments, addEquipment,
  } = nexusStore;
  const { t, language } = languageStore;

  // Active technical sidebar tab
  let activeTab = $state<TechTab>('feasibility-queue');

  // Filter for Feasibility Queue
  let queueStatusFilter = $state<'All' | OrderStatus>('All');
  let queueSearch = $state('');

  // PROVISIONING MODAL STATE ("Connection Provided")
  let isProvisionModalOpen = $state(false);
  let targetOrderForProvision = $state<Order | null>(null);
  let selectedDeviceSerial = $state('');

  // NOT FEASIBLE MODAL STATE
  let isNotFeasibleModalOpen = $state(false);
  let targetOrderForRejection = $state<Order | null>(null);
  let rejectionReason = $state(
    'Distance to DP box exceeds standard copper/fiber specifications (> 850m). Excessive attenuation.'
  );

  // CONNECTION MANAGER STATE (16-Digit Account ID Search & Toggle)
  let techAccountSearch = $state('8820-4102-9931-1001');
  let selectedConnection = $state(
    $connections.find((c) => c.accountId === '8820-4102-9931-1001') || $connections[0] || null
  );
  let statusChangeReason = $state('');

  // EQUIPMENT TRACKER STATE (Log new modems/routers)
  let isAddEquipmentModalOpen = $state(false);
  let newEquipmentForm = $state({
    serialNumber: '',
    macAddress: '',
    deviceModel: 'Nexus Wi-Fi 6 AX3000 Dual-Band Router',
    deviceType: 'Gigabit Router' as Equipment['deviceType'],
    firmwareVersion: 'v3.4.1-BUILD-88',
    status: 'In Stock' as Equipment['status'],
  });

  // Available in-stock equipments for assignment
  const inStockEquipments = $derived($equipments.filter((eq) => eq.status === 'In Stock'));

  // ACTION HANDLERS: ORDER FEASIBILITY QUEUE
  const handleMarkFeasible = (order: Order) => {
    updateOrderStatus(
      order.id,
      'Feasible',
      'Field inspection verified: Line loop within 250m, attenuation -16.5 dBm. DP Box capacity confirmed OK.'
    );
    toast.success(`Order ${order.id} marked as FEASIBLE. Ready for dispatch.`);
  };

  const handleOpenNotFeasibleModal = (order: Order) => {
    targetOrderForRejection = order;
    isNotFeasibleModalOpen = true;
  };

  const handleConfirmNotFeasible = (e: SubmitEvent) => {
    e.preventDefault();
    if (!targetOrderForRejection) return;

    updateOrderStatus(targetOrderForRejection.id, 'Not Feasible', rejectionReason);
    toast.error(`Order ${targetOrderForRejection.id} flagged as NOT FEASIBLE.`);
    isNotFeasibleModalOpen = false;
    targetOrderForRejection = null;
  };

  const handleOpenProvisionModal = (order: Order) => {
    targetOrderForProvision = order;
    if (inStockEquipments.length > 0) {
      selectedDeviceSerial = inStockEquipments[0].serialNumber;
    }
    isProvisionModalOpen = true;
  };

  const handleConfirmConnectionProvided = (e: SubmitEvent) => {
    e.preventDefault();
    if (!targetOrderForProvision) return;

    if (!selectedDeviceSerial) {
      toast.error('Please assign a modem or router serial number from inventory.');
      return;
    }

    const createdConn = provisionConnectionForOrder(targetOrderForProvision.id, selectedDeviceSerial);
    if (createdConn) {
      toast.success(
        `Connection Provided! Issued 16-digit Account ID: ${createdConn.accountId} with device ${selectedDeviceSerial}`
      );
      // Auto focus Connection Manager to this new account
      selectedConnection = createdConn;
      techAccountSearch = createdConn.accountId;
    }

    isProvisionModalOpen = false;
    targetOrderForProvision = null;
  };

  // ACTION HANDLER: CONNECTION STATUS 3-WAY TOGGLE
  const handleToggleConnectionStatus = (newStatus: ConnectionStatus) => {
    if (!selectedConnection) return;

    const reason =
      statusChangeReason.trim() ||
      `Manual technician override to ${newStatus} via Technical Command Console.`;

    updateConnectionStatus(selectedConnection.accountId, newStatus, reason);

    selectedConnection = {
      ...selectedConnection,
      status: newStatus,
      lastStatusReason: reason,
    };

    toast.success(`Account ${selectedConnection.accountId} status updated to ${newStatus}`);
    statusChangeReason = '';
  };

  // ACTION HANDLER: REGISTER NEW EQUIPMENT
  const handleSaveEquipment = (e: SubmitEvent) => {
    e.preventDefault();
    if (!newEquipmentForm.serialNumber || !newEquipmentForm.macAddress) {
      toast.error('Serial number and MAC address are required.');
      return;
    }

    addEquipment({ ...newEquipmentForm });

    toast.success(`Equipment ${newEquipmentForm.serialNumber} registered in stock.`);
    isAddEquipmentModalOpen = false;
    newEquipmentForm = {
      serialNumber: '',
      macAddress: '',
      deviceModel: 'Nexus Wi-Fi 6 AX3000 Dual-Band Router',
      deviceType: 'Gigabit Router',
      firmwareVersion: 'v3.4.1-BUILD-88',
      status: 'In Stock',
    };
  };

  const openAddEquipmentModal = () => {
    newEquipmentForm = {
      serialNumber: `NX-HW-${Math.floor(100000 + Math.random() * 900000)}`,
      macAddress: `${Math.floor(10 + Math.random() * 89).toString(16).toUpperCase()}:${Math.floor(10 + Math.random() * 89).toString(16).toUpperCase()}:${Math.floor(10 + Math.random() * 89).toString(16).toUpperCase()}:44:8E:01`,
      deviceModel: 'Nexus Wi-Fi 6 AX3000 Dual-Band Router',
      deviceType: 'Gigabit Router',
      firmwareVersion: 'v3.4.1-BUILD-88',
      status: 'In Stock',
    };
    isAddEquipmentModalOpen = true;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label}: ${text}`);
  };

  const queryTelemetry = () => {
    const found = $connections.find(
      (c) => c.accountId.replace(/-/g, '') === techAccountSearch.trim().replace(/-/g, '')
    );
    if (found) {
      selectedConnection = found;
      toast.success(`Connected to circuit #${found.accountId}`);
    } else {
      toast.error('Account ID not found in connection telemetry registry.');
    }
  };

  const filteredOrders = $derived(
    $orders.filter((o) => {
      const matchesStatus = queueStatusFilter === 'All' || o.status === queueStatusFilter;
      const matchesSearch =
        o.id.toLowerCase().includes(queueSearch.toLowerCase()) ||
        o.customerName.toLowerCase().includes(queueSearch.toLowerCase()) ||
        o.installationAddress.toLowerCase().includes(queueSearch.toLowerCase());
      return matchesStatus && matchesSearch;
    })
  );

  const technicalNavItems: NavItem[] = $derived([
    {
      id: 'feasibility-queue',
      label: $t.techNav.feasibilityQueue,
      icon: Activity,
      badge: $orders.filter((o) => o.status === 'Pending').length,
      badgeColor: 'bg-amber-100 text-amber-900',
    },
    {
      id: 'connection-manager',
      label: $t.techNav.connectionManager,
      icon: Radio,
      badge: $connections.length,
    },
    {
      id: 'equipment-tracker',
      label: $t.techNav.equipmentTracker,
      icon: HardDrive,
      badge: $equipments.length,
    },
    { id: 'settings', label: $t.techNav.settings, icon: Settings },
  ]);
</script>

<DashboardLayout
  activeTab={activeTab}
  onTabChange={(tab) => (activeTab = tab as TechTab)}
  navItems={technicalNavItems}
  roleBadgeTitle={$t.roles.technical}
  pageTitle={technicalNavItems.find((n) => n.id === activeTab)?.label}
  primaryAction={
    activeTab === 'equipment-tracker'
      ? { label: $language === 'vi' ? 'Đăng ký thiết bị' : 'Register Hardware', onClick: openAddEquipmentModal, icon: Plus }
      : undefined
  }
>
  <!-- TAB 1: ORDER FEASIBILITY QUEUE -->
  {#if activeTab === 'feasibility-queue'}
    <div class="tab-content-animate space-y-4">
      <!-- Filter Bar -->
      <div class="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-800 shadow">
        <div class="relative w-full sm:w-80">
          <Search class="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by Order ID, subscriber, or location..."
            bind:value={queueSearch}
            class="w-full pl-9 pr-4 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-slate-200"
          />
        </div>

        <div class="flex items-center space-x-2 w-full sm:w-auto">
          <span class="text-xs text-slate-400 whitespace-nowrap">Filter Status:</span>
          <select
            bind:value={queueStatusFilter}
            class="text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending Assessment</option>
            <option value="Feasible">Feasible (Ready for Provision)</option>
            <option value="Not Feasible">Not Feasible (Declined)</option>
            <option value="Connection Provided">Connection Provided (Active)</option>
          </select>
        </div>
      </div>

      <!-- Orders Queue Table -->
      <div class="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-950/80 text-xs font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th class="px-4 py-3">Order ID (11-Char)</th>
                <th class="px-4 py-3">Customer & Location</th>
                <th class="px-4 py-3">Plan & Type</th>
                <th class="px-4 py-3">Loop Distance</th>
                <th class="px-4 py-3">Signal Loss</th>
                <th class="px-4 py-3">Feasibility Status</th>
                <th class="px-4 py-3 text-right">Actions Required</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 font-sans">
              {#each filteredOrders as order (order.id)}
                <tr class="hover:bg-slate-800/40 transition">
                  <td class="px-4 py-3">
                    <span class="font-mono font-bold text-amber-400 text-sm">{order.id}</span>
                    <div class="text-[11px] text-slate-500">{order.createdAt}</div>
                  </td>
                  <td class="px-4 py-3">
                    <div class="font-semibold text-white">{order.customerName}</div>
                    <div class="text-xs text-slate-400 truncate max-w-xs">{order.installationAddress}</div>
                    <div class="text-[11px] text-slate-500">{order.customerPhone}</div>
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200">{order.connectionType}</span>
                    <div class="text-xs text-slate-400 mt-1">{order.planName}</div>
                  </td>
                  <td class="px-4 py-3 font-mono text-xs tabular-nums text-slate-300">
                    {order.cableDistanceMeters || 120} m
                    <div class="text-[10px] text-slate-500">{order.dpBoxCapacity || 'DP Box Port OK'}</div>
                  </td>
                  <td class="px-4 py-3 font-mono text-xs tabular-nums">
                    <span class={(order.signalLossDbm || -18) < -30 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                      {(order.signalLossDbm || -18).toFixed(1)} dBm
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold {order.status === 'Connection Provided'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                      : order.status === 'Feasible'
                        ? 'bg-blue-950 text-blue-300 border border-blue-800/60'
                        : order.status === 'Not Feasible'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                          : 'bg-amber-950 text-amber-300 border border-amber-800/60'}">
                      {order.status}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      {#if order.status !== 'Connection Provided'}
                        <button
                          onclick={() => handleMarkFeasible(order)}
                          class="px-2 py-1 rounded text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-600/30 transition"
                          title="Mark order as technically feasible"
                        >
                          Feasible
                        </button>
                        <button
                          onclick={() => handleOpenNotFeasibleModal(order)}
                          class="px-2 py-1 rounded text-xs font-semibold bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-600/30 transition"
                          title="Flag technical infeasibility"
                        >
                          Not Feasible
                        </button>
                        <button
                          onclick={() => handleOpenProvisionModal(order)}
                          class="px-2.5 py-1 rounded text-xs font-bold bg-amber-600 hover:bg-amber-700 text-slate-950 transition shadow"
                          title="Assign modem/router and provision connection"
                        >
                          Connection Provided
                        </button>
                      {:else}
                        <span class="text-xs text-slate-500 font-mono">Account: {order.assignedAccountId}</span>
                      {/if}
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  {/if}

  <!-- TAB 2: CONNECTION MANAGER -->
  {#if activeTab === 'connection-manager'}
    <div class="space-y-6">
      <!-- Search 16-digit Account ID -->
      <div class="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow space-y-3">
        <label class="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
          Lookup Subscriber Connection by 16-Digit Account ID
        </label>

        <div class="flex gap-2">
          <div class="relative flex-1">
            <Search class="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              bind:value={techAccountSearch}
              class="w-full pl-9 pr-4 py-2.5 text-base font-mono bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-amber-300 tracking-widest"
            />
          </div>
          <button
            onclick={queryTelemetry}
            class="px-5 py-2.5 rounded-lg text-sm font-bold bg-amber-600 hover:bg-amber-700 text-slate-950 transition shadow"
          >
            Query Telemetry
          </button>
        </div>

        <!-- Fast Pick Samples -->
        <div class="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400 font-mono">
          <span>Direct Access:</span>
          {#each $connections as c (c.accountId)}
            <button
              onclick={() => {
                techAccountSearch = c.accountId;
                selectedConnection = c;
              }}
              class="text-amber-400 hover:underline bg-slate-950 px-2 py-0.5 rounded border border-slate-800"
            >
              {c.accountId} ({c.status})
            </button>
          {/each}
        </div>
      </div>

      <!-- Connection Telemetry & 3-Way State Toggle -->
      {#if selectedConnection}
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div class="flex items-center space-x-3">
                <h2 class="text-xl font-bold font-mono text-white">Account {selectedConnection.accountId}</h2>
                <span class="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider {selectedConnection.status === 'Active'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                  : selectedConnection.status === 'Temporarily Inactive'
                    ? 'bg-amber-950 text-amber-400 border border-amber-700'
                    : 'bg-rose-950 text-rose-400 border border-rose-700'}">
                  {selectedConnection.status}
                </span>
              </div>
              <p class="text-xs text-slate-400 mt-1">
                Subscriber: {selectedConnection.customerName} • {selectedConnection.installationAddress}
              </p>
            </div>

            <div class="flex items-center space-x-2">
              <button
                onclick={() => copyToClipboard(selectedConnection!.accountId, 'Account ID')}
                class="inline-flex items-center space-x-1 text-xs border border-slate-800 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <Copy class="h-3.5 w-3.5" />
                <span>Copy Account ID</span>
              </button>
            </div>
          </div>

          <!-- 3-WAY STATUS TOGGLE -->
          <div class="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <div>
              <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Power class="h-4 w-4 text-amber-400" />
                <span>Line Operational Status Toggle</span>
              </h3>
              <p class="text-xs text-slate-400 mt-0.5">
                Toggle subscriber circuit condition in real-time across the telecommunications network.
              </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <!-- State 1: Active -->
              <button
                onclick={() => handleToggleConnectionStatus('Active')}
                class="p-4 rounded-xl border text-left transition flex flex-col justify-between {selectedConnection.status === 'Active'
                  ? 'border-emerald-500 bg-emerald-950/40 ring-1 ring-emerald-500'
                  : 'border-slate-800 bg-slate-900 hover:border-slate-700 opacity-70'}"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="h-3 w-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
                  <span class="text-[10px] font-mono text-emerald-400 font-semibold uppercase">State 01</span>
                </div>
                <div>
                  <div class="font-bold text-sm text-emerald-400">Active</div>
                  <div class="text-xs text-slate-400">Line online, packets passing, full speed</div>
                </div>
              </button>

              <!-- State 2: Temporarily Inactive -->
              <button
                onclick={() => handleToggleConnectionStatus('Temporarily Inactive')}
                class="p-4 rounded-xl border text-left transition flex flex-col justify-between {selectedConnection.status === 'Temporarily Inactive'
                  ? 'border-amber-500 bg-amber-950/40 ring-1 ring-amber-500'
                  : 'border-slate-800 bg-slate-900 hover:border-slate-700 opacity-70'}"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="h-3 w-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></span>
                  <span class="text-[10px] font-mono text-amber-400 font-semibold uppercase">State 02</span>
                </div>
                <div>
                  <div class="font-bold text-sm text-amber-400">Temporarily Inactive</div>
                  <div class="text-xs text-slate-400">Soft suspension, maintenance hold, unpaid</div>
                </div>
              </button>

              <!-- State 3: Permanently Inactive -->
              <button
                onclick={() => handleToggleConnectionStatus('Permanently Inactive')}
                class="p-4 rounded-xl border text-left transition flex flex-col justify-between {selectedConnection.status === 'Permanently Inactive'
                  ? 'border-rose-500 bg-rose-950/40 ring-1 ring-rose-500'
                  : 'border-slate-800 bg-slate-900 hover:border-slate-700 opacity-70'}"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="h-3 w-3 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50"></span>
                  <span class="text-[10px] font-mono text-rose-400 font-semibold uppercase">State 03</span>
                </div>
                <div>
                  <div class="font-bold text-sm text-rose-400">Permanently Inactive</div>
                  <div class="text-xs text-slate-400">Port disconnected, CPE reclaimed</div>
                </div>
              </button>
            </div>

            <!-- Audit Note for Status Override -->
            <div class="pt-2">
              <label class="block text-xs font-mono text-slate-400 mb-1">
                Technician Reason / NOC Incident Log (Optional):
              </label>
              <input
                type="text"
                placeholder="e.g. Fiber loop repair complete, re-enabled downstream port"
                bind:value={statusChangeReason}
                class="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <!-- Telemetry Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div class="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div class="text-slate-500">PING / LATENCY</div>
              <div class="text-base font-bold text-emerald-400 mt-1">4.2 ms</div>
              <div class="text-[10px] text-slate-500">Jitter: 0.3 ms</div>
            </div>
            <div class="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div class="text-slate-500">PACKET LOSS</div>
              <div class="text-base font-bold text-emerald-400 mt-1">0.00 %</div>
              <div class="text-[10px] text-slate-500">10,000 frames OK</div>
            </div>
            <div class="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div class="text-slate-500">OPTICAL POWER Rx</div>
              <div class="text-base font-bold text-amber-400 mt-1">-16.8 dBm</div>
              <div class="text-[10px] text-slate-500">Tx: +2.1 dBm</div>
            </div>
            <div class="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div class="text-slate-500">PORT MAPPING</div>
              <div class="text-base font-bold text-slate-200 mt-1">{selectedConnection.portNumber || 'PON-01/04'}</div>
              <div class="text-[10px] text-slate-500 truncate">{selectedConnection.ipAddress || '198.51.100.42'}</div>
            </div>
          </div>
        </div>
      {:else}
        <div class="text-center py-12 text-slate-500 font-mono">
          Select or query a 16-digit Account ID to inspect circuit telemetry.
        </div>
      {/if}
    </div>
  {/if}

  <!-- TAB 3: EQUIPMENT TRACKER -->
  {#if activeTab === 'equipment-tracker'}
    <div class="space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div class="text-xs font-mono text-slate-400 uppercase">Total Logged CPE Units</div>
          <div class="text-2xl font-bold font-mono text-white mt-1">{$equipments.length} Units</div>
        </div>
        <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div class="text-xs font-mono text-slate-400 uppercase">Deployed / In Service</div>
          <div class="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {$equipments.filter((e) => e.status === 'In Service').length} Online
          </div>
        </div>
        <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div class="text-xs font-mono text-slate-400 uppercase">Available In Stock</div>
          <div class="text-2xl font-bold font-mono text-amber-400 mt-1">
            {$equipments.filter((e) => e.status === 'In Stock').length} Units
          </div>
        </div>
      </div>

      <!-- Equipment Grid / Table -->
      <div class="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm font-sans">
            <thead class="bg-slate-950/80 text-xs font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th class="px-4 py-3">Hardware Serial</th>
                <th class="px-4 py-3">MAC Address</th>
                <th class="px-4 py-3">Device Model & Type</th>
                <th class="px-4 py-3">Firmware Build</th>
                <th class="px-4 py-3">Assigned 16-Digit Account</th>
                <th class="px-4 py-3">Subscriber</th>
                <th class="px-4 py-3">Hardware Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 text-xs font-mono">
              {#each $equipments as eq (eq.id)}
                <tr class="hover:bg-slate-800/40 transition">
                  <td class="px-4 py-3 font-bold text-amber-400">{eq.serialNumber}</td>
                  <td class="px-4 py-3 text-slate-300">{eq.macAddress}</td>
                  <td class="px-4 py-3 font-sans">
                    <div class="font-semibold text-white">{eq.deviceModel}</div>
                    <div class="text-[11px] text-slate-400">{eq.deviceType}</div>
                  </td>
                  <td class="px-4 py-3 text-slate-400">{eq.firmwareVersion}</td>
                  <td class="px-4 py-3 text-emerald-400 font-bold">
                    {#if eq.assignedAccountId}
                      {eq.assignedAccountId}
                    {:else}
                      <span class="text-slate-600 font-normal">UNASSIGNED</span>
                    {/if}
                  </td>
                  <td class="px-4 py-3 font-sans text-slate-300">{eq.assignedCustomerName || '—'}</td>
                  <td class="px-4 py-3 font-sans">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold {eq.status === 'In Service'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : eq.status === 'In Stock'
                        ? 'bg-blue-950 text-blue-400 border border-blue-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'}">
                      {eq.status}
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

  <!-- PROVISIONING MODAL ("Connection Provided") -->
  {#if isProvisionModalOpen && targetOrderForProvision}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4">
      <div class="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <span class="text-xs font-mono text-amber-400 uppercase">Field Engineer Provisioning</span>
            <h3 class="text-lg font-bold text-white">Provide Connection for Order #{targetOrderForProvision.id}</h3>
          </div>
          <button
            onclick={() => (isProvisionModalOpen = false)}
            class="text-slate-400 hover:text-white"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <form onsubmit={handleConfirmConnectionProvided} class="space-y-4 text-sm">
          <div class="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
            <div class="text-slate-400">Subscriber: <strong class="text-white">{targetOrderForProvision.customerName}</strong></div>
            <div class="text-slate-400">Address: <strong class="text-white">{targetOrderForProvision.installationAddress}</strong></div>
            <div class="text-slate-400">Service Plan: <strong class="text-amber-400">{targetOrderForProvision.planName} ({targetOrderForProvision.connectionType})</strong></div>
          </div>

          <div>
            <label class="block text-xs font-mono font-semibold text-slate-300 mb-1">
              Assign Modem / Router from Stock *
            </label>
            {#if inStockEquipments.length > 0}
              <select
                bind:value={selectedDeviceSerial}
                class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {#each inStockEquipments as eq (eq.id)}
                  <option value={eq.serialNumber}>{eq.serialNumber} — {eq.deviceModel} ({eq.macAddress})</option>
                {/each}
              </select>
            {:else}
              <div class="p-3 rounded bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
                No hardware units currently marked as 'In Stock'. Please register or return equipment.
              </div>
            {/if}
          </div>

          <div class="p-3 rounded bg-amber-950/30 border border-amber-800/50 text-xs text-amber-300 space-y-1">
            <div class="font-bold flex items-center space-x-1.5">
              <Zap class="h-4 w-4 text-amber-400" />
              <span>Automated System Action:</span>
            </div>
            <p>
              Confirming will update status to <strong>Connection Provided</strong>, bind hardware serial, and generate an official <strong>16-digit Account ID</strong> for billing.
            </p>
          </div>

          <div class="flex justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onclick={() => (isProvisionModalOpen = false)}
              class="px-4 py-2 rounded-lg text-xs border border-slate-800 text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedDeviceSerial}
              class="px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-slate-950 transition shadow"
            >
              Confirm Provisioning & Activate
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  <!-- NOT FEASIBLE REJECTION MODAL -->
  {#if isNotFeasibleModalOpen && targetOrderForRejection}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4">
      <div class="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 class="text-base font-bold text-rose-400 flex items-center space-x-2">
            <ShieldAlert class="h-5 w-5" />
            <span>Flag Technical Infeasibility</span>
          </h3>
          <button
            onclick={() => (isNotFeasibleModalOpen = false)}
            class="text-slate-400 hover:text-white"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <form onsubmit={handleConfirmNotFeasible} class="space-y-4 text-sm">
          <div class="text-xs text-slate-400">
            Record engineering rationale for declining Order <strong>#{targetOrderForRejection.id}</strong>:
          </div>

          <textarea
            rows="3"
            required
            bind:value={rejectionReason}
            class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
          ></textarea>

          <div class="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onclick={() => (isNotFeasibleModalOpen = false)}
              class="px-4 py-2 rounded-lg text-xs border border-slate-800 text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition shadow"
            >
              Submit Infeasibility Flag
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  <!-- REGISTER NEW EQUIPMENT MODAL -->
  {#if isAddEquipmentModalOpen}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4">
      <div class="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 class="text-base font-bold text-white">Log Hardware into Equipment Stock</h3>
          <button
            onclick={() => (isAddEquipmentModalOpen = false)}
            class="text-slate-400 hover:text-white"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <form onsubmit={handleSaveEquipment} class="space-y-3 text-xs font-mono">
          <div>
            <label class="block text-slate-400 mb-1">Serial Number *</label>
            <input
              type="text"
              required
              bind:value={newEquipmentForm.serialNumber}
              class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-amber-300"
            />
          </div>

          <div>
            <label class="block text-slate-400 mb-1">MAC Address *</label>
            <input
              type="text"
              required
              bind:value={newEquipmentForm.macAddress}
              class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
            />
          </div>

          <div>
            <label class="block text-slate-400 mb-1 font-sans">Device Model Name</label>
            <input
              type="text"
              required
              bind:value={newEquipmentForm.deviceModel}
              class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-sans"
            />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-slate-400 mb-1 font-sans">Device Type</label>
              <select
                bind:value={newEquipmentForm.deviceType}
                class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-sans"
              >
                <option value="Gigabit Router">Gigabit Router</option>
                <option value="Fiber ONT Modem">Fiber ONT Modem</option>
                <option value="VDSL2/ADSL Modem">VDSL2/ADSL Modem</option>
                <option value="Analog Telephone Adapter">Analog Telephone Adapter</option>
              </select>
            </div>
            <div>
              <label class="block text-slate-400 mb-1">Firmware Version</label>
              <input
                type="text"
                bind:value={newEquipmentForm.firmwareVersion}
                class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
              />
            </div>
          </div>

          <div class="flex justify-end space-x-3 pt-3 border-t border-slate-800 font-sans">
            <button
              type="button"
              onclick={() => (isAddEquipmentModalOpen = false)}
              class="px-4 py-2 rounded-lg text-xs border border-slate-800 text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-slate-950 transition shadow"
            >
              Confirm & Save
            </button>
          </div>
        </form>
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


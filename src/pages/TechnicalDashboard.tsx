import React, { useState } from 'react';
import { useNexus } from '../context/NexusContext';
import { useLanguage } from '../context/LanguageContext';
import { DashboardLayout, type NavItem } from '../components/layout/DashboardLayout';
import {
  Search,
  Zap,
  Activity,
  Radio,
  HardDrive,
  Plus,
  Power,
  ShieldAlert,
  X,
  Copy,
  Settings,
} from 'lucide-react';
import type { Order, ConnectionStatus, Equipment, OrderStatus } from '../types/nexus';
import { toast } from 'sonner';

type TechTab = 'feasibility-queue' | 'connection-manager' | 'equipment-tracker' | 'settings';

export const TechnicalDashboard: React.FC = () => {
  const {
    orders,
    updateOrderStatus,
    provisionConnectionForOrder,
    connections,
    updateConnectionStatus,
    equipments,
    addEquipment,
  } = useNexus();
  const { t, language } = useLanguage();

  // Active technical sidebar tab
  const [activeTab, setActiveTab] = useState<TechTab>('feasibility-queue');

  // Filter for Feasibility Queue
  const [queueStatusFilter, setQueueStatusFilter] = useState<'All' | OrderStatus>('All');
  const [queueSearch, setQueueSearch] = useState('');

  // -------------------------------------------------------------
  // PROVISIONING MODAL STATE ("Connection Provided")
  // -------------------------------------------------------------
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [targetOrderForProvision, setTargetOrderForProvision] = useState<Order | null>(null);
  const [selectedDeviceSerial, setSelectedDeviceSerial] = useState('');

  // -------------------------------------------------------------
  // NOT FEASIBLE MODAL STATE
  // -------------------------------------------------------------
  const [isNotFeasibleModalOpen, setIsNotFeasibleModalOpen] = useState(false);
  const [targetOrderForRejection, setTargetOrderForRejection] = useState<Order | null>(null);
  const [rejectionReason, setRejectionReason] = useState(
    'Distance to DP box exceeds standard copper/fiber specifications (> 850m). Excessive attenuation.'
  );

  // -------------------------------------------------------------
  // CONNECTION MANAGER STATE (16-Digit Account ID Search & Toggle)
  // -------------------------------------------------------------
  const [techAccountSearch, setTechAccountSearch] = useState('8820-4102-9931-1001');
  const [selectedConnection, setSelectedConnection] = useState(() => {
    return connections.find((c) => c.accountId === '8820-4102-9931-1001') || connections[0] || null;
  });
  const [statusChangeReason, setStatusChangeReason] = useState('');

  // -------------------------------------------------------------
  // EQUIPMENT TRACKER STATE (Log new modems/routers)
  // -------------------------------------------------------------
  const [isAddEquipmentModalOpen, setIsAddEquipmentModalOpen] = useState(false);
  const [newEquipmentForm, setNewEquipmentForm] = useState({
    serialNumber: '',
    macAddress: '',
    deviceModel: 'Nexus Wi-Fi 6 AX3000 Dual-Band Router',
    deviceType: 'Gigabit Router' as Equipment['deviceType'],
    firmwareVersion: 'v3.4.1-BUILD-88',
    status: 'In Stock' as Equipment['status'],
  });

  // Available in-stock equipments for assignment
  const inStockEquipments = equipments.filter((eq) => eq.status === 'In Stock');

  // -------------------------------------------------------------
  // ACTION HANDLERS: ORDER FEASIBILITY QUEUE
  // -------------------------------------------------------------
  const handleMarkFeasible = (order: Order) => {
    updateOrderStatus(
      order.id,
      'Feasible',
      'Field inspection verified: Line loop within 250m, attenuation -16.5 dBm. DP Box capacity confirmed OK.'
    );
    toast.success(`Order ${order.id} marked as FEASIBLE. Ready for dispatch.`);
  };

  const handleOpenNotFeasibleModal = (order: Order) => {
    setTargetOrderForRejection(order);
    setIsNotFeasibleModalOpen(true);
  };

  const handleConfirmNotFeasible = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetOrderForRejection) return;

    updateOrderStatus(targetOrderForRejection.id, 'Not Feasible', rejectionReason);
    toast.error(`Order ${targetOrderForRejection.id} flagged as NOT FEASIBLE.`);
    setIsNotFeasibleModalOpen(false);
    setTargetOrderForRejection(null);
  };

  const handleOpenProvisionModal = (order: Order) => {
    setTargetOrderForProvision(order);
    if (inStockEquipments.length > 0) {
      setSelectedDeviceSerial(inStockEquipments[0].serialNumber);
    }
    setIsProvisionModalOpen(true);
  };

  const handleConfirmConnectionProvided = (e: React.FormEvent) => {
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
      setSelectedConnection(createdConn);
      setTechAccountSearch(createdConn.accountId);
    }

    setIsProvisionModalOpen(false);
    setTargetOrderForProvision(null);
  };

  // -------------------------------------------------------------
  // ACTION HANDLER: CONNECTION STATUS 3-WAY TOGGLE
  // Active, Temporarily Inactive, Permanently Inactive
  // -------------------------------------------------------------
  const handleToggleConnectionStatus = (newStatus: ConnectionStatus) => {
    if (!selectedConnection) return;

    const reason =
      statusChangeReason.trim() ||
      `Manual technician override to ${newStatus} via Technical Command Console.`;

    updateConnectionStatus(selectedConnection.accountId, newStatus, reason);

    setSelectedConnection({
      ...selectedConnection,
      status: newStatus,
      lastStatusReason: reason,
    });

    toast.success(`Account ${selectedConnection.accountId} status updated to ${newStatus}`);
    setStatusChangeReason('');
  };

  // -------------------------------------------------------------
  // ACTION HANDLER: REGISTER NEW EQUIPMENT
  // -------------------------------------------------------------
  const handleSaveEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEquipmentForm.serialNumber || !newEquipmentForm.macAddress) {
      toast.error('Serial number and MAC address are required.');
      return;
    }

    addEquipment({
      ...newEquipmentForm,
    });

    toast.success(`Equipment ${newEquipmentForm.serialNumber} registered in stock.`);
    setIsAddEquipmentModalOpen(false);
    setNewEquipmentForm({
      serialNumber: '',
      macAddress: '',
      deviceModel: 'Nexus Wi-Fi 6 AX3000 Dual-Band Router',
      deviceType: 'Gigabit Router',
      firmwareVersion: 'v3.4.1-BUILD-88',
      status: 'In Stock',
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label}: ${text}`);
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = queueStatusFilter === 'All' || o.status === queueStatusFilter;
    const matchesSearch =
      o.id.toLowerCase().includes(queueSearch.toLowerCase()) ||
      o.customerName.toLowerCase().includes(queueSearch.toLowerCase()) ||
      o.installationAddress.toLowerCase().includes(queueSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const technicalNavItems: NavItem[] = [
    {
      id: 'feasibility-queue',
      label: t.techNav.feasibilityQueue,
      icon: Activity,
      badge: orders.filter((o) => o.status === 'Pending').length,
      badgeColor: 'bg-amber-100 text-amber-900',
    },
    {
      id: 'connection-manager',
      label: t.techNav.connectionManager,
      icon: Radio,
      badge: connections.length,
    },
    {
      id: 'equipment-tracker',
      label: t.techNav.equipmentTracker,
      icon: HardDrive,
      badge: equipments.length,
    },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'settings', label: t.techNav.settings, icon: Settings },
  ];

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as TechTab)}
      navItems={technicalNavItems}
      roleBadgeTitle={t.roles.technical}
      pageTitle={technicalNavItems.find((t) => t.id === activeTab)?.label}
      primaryAction={
        activeTab === 'equipment-tracker'
          ? {
              label: language === 'vi' ? 'Đăng ký thiết bị' : 'Register Hardware',
              onClick: () => {
                setNewEquipmentForm({
                  serialNumber: `NX-HW-${Math.floor(100000 + Math.random() * 900000)}`,
                  macAddress: `${Math.floor(10 + Math.random() * 89).toString(16).toUpperCase()}:${Math.floor(10 + Math.random() * 89).toString(16).toUpperCase()}:${Math.floor(10 + Math.random() * 89).toString(16).toUpperCase()}:44:8E:01`,
                  deviceModel: 'Nexus Wi-Fi 6 AX3000 Dual-Band Router',
                  deviceType: 'Gigabit Router',
                  firmwareVersion: 'v3.4.1-BUILD-88',
                  status: 'In Stock',
                });
                setIsAddEquipmentModalOpen(true);
              },
              icon: Plus,
            }
          : undefined
      }
    >
      {/* ------------------------------------------------------------- */}
      {/* TAB 1: ORDER FEASIBILITY QUEUE (Required by Prompt #3)        */}
      {/* Data table displaying pending orders. Action buttons:         */}
      {/* "Feasible", "Not Feasible", "Connection Provided"             */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'feasibility-queue' && (
        <div key={activeTab} className="tab-content-animate space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-800 shadow">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by Order ID, subscriber, or location..."
                  value={queueSearch}
                  onChange={(e) => setQueueSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-slate-200"
                />
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <span className="text-xs text-slate-400 whitespace-nowrap">Filter Status:</span>
                <select
                  value={queueStatusFilter}
                  onChange={(e) => setQueueStatusFilter(e.target.value as OrderStatus | 'All')}
                  className="text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending Assessment</option>
                  <option value="Feasible">Feasible (Ready for Provision)</option>
                  <option value="Not Feasible">Not Feasible (Declined)</option>
                  <option value="Connection Provided">Connection Provided (Active)</option>
                </select>
              </div>
            </div>

            {/* Orders Queue Table */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950/80 text-xs font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Order ID (11-Char)</th>
                      <th className="px-4 py-3">Customer & Location</th>
                      <th className="px-4 py-3">Plan & Type</th>
                      <th className="px-4 py-3">Loop Distance</th>
                      <th className="px-4 py-3">Signal Loss</th>
                      <th className="px-4 py-3">Feasibility Status</th>
                      <th className="px-4 py-3 text-right">Actions Required</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-amber-400 text-sm">
                            {order.id}
                          </span>
                          <div className="text-[11px] text-slate-500">{order.createdAt}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">{order.customerName}</div>
                          <div className="text-xs text-slate-400 truncate max-w-xs">
                            {order.installationAddress}
                          </div>
                          <div className="text-[11px] text-slate-500">{order.customerPhone}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200">
                            {order.connectionType}
                          </span>
                          <div className="text-xs text-slate-400 mt-1">{order.planName}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs tabular-nums text-slate-300">
                          {order.cableDistanceMeters || 120} m
                          <div className="text-[10px] text-slate-500">
                            {order.dpBoxCapacity || 'DP Box Port OK'}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs tabular-nums">
                          <span
                            className={
                              (order.signalLossDbm || -18) < -30
                                ? 'text-rose-400 font-bold'
                                : 'text-emerald-400'
                            }
                          >
                            {(order.signalLossDbm || -18).toFixed(1)} dBm
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              order.status === 'Connection Provided'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                                : order.status === 'Feasible'
                                ? 'bg-blue-950 text-blue-300 border border-blue-800/60'
                                : order.status === 'Not Feasible'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                                : 'bg-amber-950 text-amber-300 border border-amber-800/60'
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {order.status !== 'Connection Provided' && (
                              <>
                                <button
                                  onClick={() => handleMarkFeasible(order)}
                                  className="px-2 py-1 rounded text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-600/30 transition"
                                  title="Mark order as technically feasible"
                                >
                                  Feasible
                                </button>
                                <button
                                  onClick={() => handleOpenNotFeasibleModal(order)}
                                  className="px-2 py-1 rounded text-xs font-semibold bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-600/30 transition"
                                  title="Flag technical infeasibility"
                                >
                                  Not Feasible
                                </button>
                                <button
                                  onClick={() => handleOpenProvisionModal(order)}
                                  className="px-2.5 py-1 rounded text-xs font-bold bg-amber-600 hover:bg-amber-700 text-slate-950 transition shadow"
                                  title="Assign modem/router and provision connection"
                                >
                                  Connection Provided
                                </button>
                              </>
                            )}

                            {order.status === 'Connection Provided' && (
                              <span className="text-xs text-slate-500 font-mono">
                                Account: {order.assignedAccountId}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: CONNECTION MANAGER (Required by Prompt #3)             */}
        {/* Search 16-digit Account ID & toggle connection status         */}
        {/* (Active, Temporarily Inactive, Permanently Inactive)          */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'connection-manager' && (
          <div className="space-y-6">
            {/* Search 16-digit Account ID */}
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow space-y-3">
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                Lookup Subscriber Connection by 16-Digit Account ID
              </label>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    value={techAccountSearch}
                    onChange={(e) => setTechAccountSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-base font-mono bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-amber-300 tracking-widest"
                  />
                </div>
                <button
                  onClick={() => {
                    const found = connections.find(
                      (c) =>
                        c.accountId.replace(/-/g, '') === techAccountSearch.trim().replace(/-/g, '')
                    );
                    if (found) {
                      setSelectedConnection(found);
                      toast.success(`Connected to circuit #${found.accountId}`);
                    } else {
                      toast.error('Account ID not found in connection telemetry registry.');
                    }
                  }}
                  className="px-5 py-2.5 rounded-lg text-sm font-bold bg-amber-600 hover:bg-amber-700 text-slate-950 transition shadow"
                >
                  Query Telemetry
                </button>
              </div>

              {/* Fast Pick Samples */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400 font-mono">
                <span>Direct Access:</span>
                {connections.map((c) => (
                  <button
                    key={c.accountId}
                    onClick={() => {
                      setTechAccountSearch(c.accountId);
                      setSelectedConnection(c);
                    }}
                    className="text-amber-400 hover:underline bg-slate-950 px-2 py-0.5 rounded border border-slate-800"
                  >
                    {c.accountId} ({c.status})
                  </button>
                ))}
              </div>
            </div>

            {/* Connection Telemetry & 3-Way State Toggle */}
            {selectedConnection ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center space-x-3">
                      <h2 className="text-xl font-bold font-mono text-white">
                        Account {selectedConnection.accountId}
                      </h2>
                      <span
                        className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          selectedConnection.status === 'Active'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                            : selectedConnection.status === 'Temporarily Inactive'
                            ? 'bg-amber-950 text-amber-400 border border-amber-700'
                            : 'bg-rose-950 text-rose-400 border border-rose-700'
                        }`}
                      >
                        {selectedConnection.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Subscriber: {selectedConnection.customerName} • {selectedConnection.installationAddress}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => copyToClipboard(selectedConnection.accountId, 'Account ID')}
                      className="inline-flex items-center space-x-1 text-xs border border-slate-800 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Account ID</span>
                    </button>
                  </div>
                </div>

                {/* 3-WAY STATUS TOGGLE (Active, Temporarily Inactive, Permanently Inactive) */}
                <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                      <Power className="h-4 w-4 text-amber-400" />
                      <span>Line Operational Status Toggle</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Toggle subscriber circuit condition in real-time across the telecommunications network.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* State 1: Active */}
                    <button
                      onClick={() => handleToggleConnectionStatus('Active')}
                      className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
                        selectedConnection.status === 'Active'
                          ? 'border-emerald-500 bg-emerald-950/40 ring-1 ring-emerald-500'
                          : 'border-slate-800 bg-slate-900 hover:border-slate-700 opacity-70'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                        <span className="text-[10px] font-mono text-emerald-400 font-semibold uppercase">
                          State 01
                        </span>
                      </div>
                      <div>
                        <div className="font-bold text-sm text-emerald-400">Active</div>
                        <div className="text-xs text-slate-400">Line online, packets passing, full speed</div>
                      </div>
                    </button>

                    {/* State 2: Temporarily Inactive */}
                    <button
                      onClick={() => handleToggleConnectionStatus('Temporarily Inactive')}
                      className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
                        selectedConnection.status === 'Temporarily Inactive'
                          ? 'border-amber-500 bg-amber-950/40 ring-1 ring-amber-500'
                          : 'border-slate-800 bg-slate-900 hover:border-slate-700 opacity-70'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="h-3 w-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
                        <span className="text-[10px] font-mono text-amber-400 font-semibold uppercase">
                          State 02
                        </span>
                      </div>
                      <div>
                        <div className="font-bold text-sm text-amber-400">Temporarily Inactive</div>
                        <div className="text-xs text-slate-400">Soft suspension, maintenance hold, unpaid</div>
                      </div>
                    </button>

                    {/* State 3: Permanently Inactive */}
                    <button
                      onClick={() => handleToggleConnectionStatus('Permanently Inactive')}
                      className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
                        selectedConnection.status === 'Permanently Inactive'
                          ? 'border-rose-500 bg-rose-950/40 ring-1 ring-rose-500'
                          : 'border-slate-800 bg-slate-900 hover:border-slate-700 opacity-70'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="h-3 w-3 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
                        <span className="text-[10px] font-mono text-rose-400 font-semibold uppercase">
                          State 03
                        </span>
                      </div>
                      <div>
                        <div className="font-bold text-sm text-rose-400">Permanently Inactive</div>
                        <div className="text-xs text-slate-400">Port disconnected, CPE reclaimed</div>
                      </div>
                    </button>
                  </div>

                  {/* Audit Note for Status Override */}
                  <div className="pt-2">
                    <label className="block text-xs font-mono text-slate-400 mb-1">
                      Technician Reason / NOC Incident Log (Optional):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Fiber loop repair complete, re-enabled downstream port"
                      value={statusChangeReason}
                      onChange={(e) => setStatusChangeReason(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Telemetry Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-slate-500">PING / LATENCY</div>
                    <div className="text-base font-bold text-emerald-400 mt-1">4.2 ms</div>
                    <div className="text-[10px] text-slate-500">Jitter: 0.3 ms</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-slate-500">PACKET LOSS</div>
                    <div className="text-base font-bold text-emerald-400 mt-1">0.00 %</div>
                    <div className="text-[10px] text-slate-500">10,000 frames OK</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-slate-500">OPTICAL POWER Rx</div>
                    <div className="text-base font-bold text-amber-400 mt-1">-16.8 dBm</div>
                    <div className="text-[10px] text-slate-500">Tx: +2.1 dBm</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-slate-500">PORT MAPPING</div>
                    <div className="text-base font-bold text-slate-200 mt-1">
                      {selectedConnection.portNumber || 'PON-01/04'}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {selectedConnection.ipAddress || '198.51.100.42'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 font-mono">
                Select or query a 16-digit Account ID to inspect circuit telemetry.
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: EQUIPMENT TRACKER (Required by Prompt #3)              */}
        {/* Log modems and routers assigned to specific connections       */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'equipment-tracker' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-xs font-mono text-slate-400 uppercase">Total Logged CPE Units</div>
                <div className="text-2xl font-bold font-mono text-white mt-1">{equipments.length} Units</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-xs font-mono text-slate-400 uppercase">Deployed / In Service</div>
                <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                  {equipments.filter((e) => e.status === 'In Service').length} Online
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-xs font-mono text-slate-400 uppercase">Available In Stock</div>
                <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                  {equipments.filter((e) => e.status === 'In Stock').length} Units
                </div>
              </div>
            </div>

            {/* Equipment Grid / Table */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm font-sans">
                  <thead className="bg-slate-950/80 text-xs font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Hardware Serial</th>
                      <th className="px-4 py-3">MAC Address</th>
                      <th className="px-4 py-3">Device Model & Type</th>
                      <th className="px-4 py-3">Firmware Build</th>
                      <th className="px-4 py-3">Assigned 16-Digit Account</th>
                      <th className="px-4 py-3">Subscriber</th>
                      <th className="px-4 py-3">Hardware Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
                    {equipments.map((eq) => (
                      <tr key={eq.id} className="hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3 font-bold text-amber-400">{eq.serialNumber}</td>
                        <td className="px-4 py-3 text-slate-300">{eq.macAddress}</td>
                        <td className="px-4 py-3 font-sans">
                          <div className="font-semibold text-white">{eq.deviceModel}</div>
                          <div className="text-[11px] text-slate-400">{eq.deviceType}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-400">{eq.firmwareVersion}</td>
                        <td className="px-4 py-3 text-emerald-400 font-bold">
                          {eq.assignedAccountId || <span className="text-slate-600 font-normal">UNASSIGNED</span>}
                        </td>
                        <td className="px-4 py-3 font-sans text-slate-300">
                          {eq.assignedCustomerName || '—'}
                        </td>
                        <td className="px-4 py-3 font-sans">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                              eq.status === 'In Service'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : eq.status === 'In Stock'
                                ? 'bg-blue-950 text-blue-400 border border-blue-800'
                                : 'bg-rose-950 text-rose-400 border border-rose-800'
                            }`}
                          >
                            {eq.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      {/* ------------------------------------------------------------- */}
      {/* 3. PROVISIONING MODAL ("Connection Provided")                 */}
      {/* Assigns modem/router serial and generates 16-digit Account ID */}
      {/* ------------------------------------------------------------- */}
      {isProvisionModalOpen && targetOrderForProvision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono text-amber-400 uppercase">Field Engineer Provisioning</span>
                <h3 className="text-lg font-bold text-white">
                  Provide Connection for Order #{targetOrderForProvision.id}
                </h3>
              </div>
              <button
                onClick={() => setIsProvisionModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmConnectionProvided} className="space-y-4 text-sm">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                <div className="text-slate-400">Subscriber: <strong className="text-white">{targetOrderForProvision.customerName}</strong></div>
                <div className="text-slate-400">Address: <strong className="text-white">{targetOrderForProvision.installationAddress}</strong></div>
                <div className="text-slate-400">Service Plan: <strong className="text-amber-400">{targetOrderForProvision.planName} ({targetOrderForProvision.connectionType})</strong></div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                  Assign Modem / Router from Stock *
                </label>
                {inStockEquipments.length > 0 ? (
                  <select
                    value={selectedDeviceSerial}
                    onChange={(e) => setSelectedDeviceSerial(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    {inStockEquipments.map((eq) => (
                      <option key={eq.id} value={eq.serialNumber}>
                        {eq.serialNumber} — {eq.deviceModel} ({eq.macAddress})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 rounded bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
                    No hardware units currently marked as 'In Stock'. Please register or return equipment.
                  </div>
                )}
              </div>

              <div className="p-3 rounded bg-amber-950/30 border border-amber-800/50 text-xs text-amber-300 space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <Zap className="h-4 w-4 text-amber-400" />
                  <span>Automated System Action:</span>
                </div>
                <p>
                  Confirming will update status to <strong>Connection Provided</strong>, bind hardware serial, and generate an official <strong>16-digit Account ID</strong> for billing.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProvisionModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs border border-slate-800 text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedDeviceSerial}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-slate-950 transition shadow"
                >
                  Confirm Provisioning & Activate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. NOT FEASIBLE REJECTION MODAL                               */}
      {/* ------------------------------------------------------------- */}
      {isNotFeasibleModalOpen && targetOrderForRejection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-rose-400 flex items-center space-x-2">
                <ShieldAlert className="h-5 w-5" />
                <span>Flag Technical Infeasibility</span>
              </h3>
              <button
                onClick={() => setIsNotFeasibleModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmNotFeasible} className="space-y-4 text-sm">
              <div className="text-xs text-slate-400">
                Record engineering rationale for declining Order <strong>#{targetOrderForRejection.id}</strong>:
              </div>

              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
              />

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNotFeasibleModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs border border-slate-800 text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition shadow"
                >
                  Submit Infeasibility Flag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. REGISTER NEW EQUIPMENT MODAL                               */}
      {/* ------------------------------------------------------------- */}
      {isAddEquipmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Log Hardware into Equipment Stock</h3>
              <button
                onClick={() => setIsAddEquipmentModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEquipment} className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">Serial Number *</label>
                <input
                  type="text"
                  required
                  value={newEquipmentForm.serialNumber}
                  onChange={(e) =>
                    setNewEquipmentForm({ ...newEquipmentForm, serialNumber: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-amber-300"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">MAC Address *</label>
                <input
                  type="text"
                  required
                  value={newEquipmentForm.macAddress}
                  onChange={(e) =>
                    setNewEquipmentForm({ ...newEquipmentForm, macAddress: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-sans">Device Model Name</label>
                <input
                  type="text"
                  required
                  value={newEquipmentForm.deviceModel}
                  onChange={(e) =>
                    setNewEquipmentForm({ ...newEquipmentForm, deviceModel: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-sans">Device Type</label>
                  <select
                    value={newEquipmentForm.deviceType}
                    onChange={(e) =>
                      setNewEquipmentForm({
                        ...newEquipmentForm,
                        deviceType: e.target.value as Equipment['deviceType'],
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-sans"
                  >
                    <option value="Gigabit Router">Gigabit Router</option>
                    <option value="Fiber ONT Modem">Fiber ONT Modem</option>
                    <option value="VDSL2/ADSL Modem">VDSL2/ADSL Modem</option>
                    <option value="Analog Telephone Adapter">Analog Telephone Adapter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Firmware Version</label>
                  <input
                    type="text"
                    value={newEquipmentForm.firmwareVersion}
                    onChange={(e) =>
                      setNewEquipmentForm({ ...newEquipmentForm, firmwareVersion: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800 font-sans">
                <button
                  type="button"
                  onClick={() => setIsAddEquipmentModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs border border-slate-800 text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-slate-950 transition shadow"
                >
                  Confirm & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    
            {activeTab === 'settings' && (
              <div className="rounded-xl bg-white dark:bg-[#1E3349] p-8 text-center shadow-sm border border-[#CCE4F7] dark:border-[#253D56]">
                <Settings className="h-12 w-12 mx-auto text-[#7899B8] dark:text-[#5E7F9F] mb-4" />
                <h3 className="text-lg font-bold text-[#0F1D2B] dark:text-white mb-2">System Settings</h3>
                <p className="text-[#537292] dark:text-[#8DB0D4]">Configuration preferences and system settings are under active maintenance...</p>
                <h3 className="text-lg font-bold text-[#0F1D2B] dark:text-white mb-2">{t.dashboard.settingsTitle}</h3>
                <p className="text-[#537292] dark:text-[#8DB0D4]">{t.dashboard.settingsDesc}</p>
              </div>
            )}
          </DashboardLayout>
  );
};

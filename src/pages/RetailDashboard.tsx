/**
 * =======================================================================
 * NEXUS SERVICE MARKETING SYSTEM - RETAIL OUTLET EMPLOYEE DASHBOARD
 * =======================================================================
 * 
 * ROLE: Retail Outlet Staff / Store Representative
 * PURPOSE: High-velocity customer service and point-of-sale terminal for
 *          onboarding subscribers, placing new orders (generating 11-digit IDs),
 *          tracking order fulfillment stages, inspecting connection health (16-digit Account IDs),
 *          and looking up billing / payment records.
 * 
 * LAYOUT STRUCTURE:
 * 1. RetailHeader: Current retail branch identifier (SH-01 Downtown Flagship),
 *                  on-duty employee profile, fast order placement hotkeys.
 * 2. RetailSidebar:
 *    - New Order ("Place Order" rapid data entry form)
 *    - Order Tracking (11-digit alphanumeric Order ID search & visual timeline)
 *    - Connection Details (16-digit Account ID lookup & circuit status)
 *    - Payment Records (Receipts, ledger & customer transaction history)
 * 3. MainContent: Dedicated high-productivity workspaces.
 * =======================================================================
 */

import React, { useState } from 'react';
import { useNexus } from '../context/NexusContext';
import { DashboardLayout, type NavItem } from '../components/layout/DashboardLayout';
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
} from 'lucide-react';
import type { ConnectionType, Order } from '../types/nexus';
import { toast } from 'sonner';

type RetailTab = 'new-order' | 'order-tracking' | 'connection-details' | 'payment-records';

export const RetailDashboard: React.FC = () => {
  const { plans, placeOrder, orders, connections, bills } = useNexus();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<RetailTab>('new-order');

  // -------------------------------------------------------------
  // FORM STATE: PLACE ORDER (Required by Prompt #2)
  // Fields: Customer Personal Details, Connection Type, Plan Selection
  // -------------------------------------------------------------
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [installationAddress, setInstallationAddress] = useState('');
  const [idProofType, setIdProofType] = useState<Order['idProofType']>('National ID Card');
  const [idProofNumber, setIdProofNumber] = useState('');
  const [connectionType, setConnectionType] = useState<ConnectionType>('Broadband');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('plan-bb-01');

  // Success Modal for newly generated Order
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  // -------------------------------------------------------------
  // STATE: ORDER TRACKING (11-digit Alphanumeric Order ID)
  // -------------------------------------------------------------
  const [trackingSearchQuery, setTrackingSearchQuery] = useState('D0000000001');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(() => {
    return orders.find((o) => o.id === 'D0000000001') || orders[0] || null;
  });

  // -------------------------------------------------------------
  // STATE: CONNECTION DETAILS (16-digit Account ID)
  // -------------------------------------------------------------
  const [accountSearchQuery, setAccountSearchQuery] = useState('8820-4102-9931-1001');
  const [trackedConnection, setTrackedConnection] = useState(() => {
    return connections.find((c) => c.accountId === '8820-4102-9931-1001') || connections[0] || null;
  });

  // -------------------------------------------------------------
  // STATE: PAYMENT RECORDS SEARCH
  // -------------------------------------------------------------
  const [paymentAccountQuery, setPaymentAccountQuery] = useState('');

  // Filter available plans according to selected Connection Type
  const availablePlans = plans.filter((p) => p.type === connectionType && p.status === 'Active');
  const currentPlan = plans.find((p) => p.id === selectedPlanId) || availablePlans[0];

  // -------------------------------------------------------------
  // FORM SUBMISSION LOGIC: PLACE ORDER
  // 1. Validates phone, email, and identity credentials
  // 2. Calls context `placeOrder` which auto-formats an 11-digit ID
  // 3. Displays instant confirmation receipt with copyable Order ID
  // -------------------------------------------------------------
  const handlePlaceOrderSubmit = (e: React.FormEvent) => {
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
    });

    setPlacedOrder(newOrder);
    toast.success(`Order ${newOrder.id} successfully created!`);

    // Reset Form for next retail customer
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setInstallationAddress('');
    setIdProofNumber('');
  };

  // -------------------------------------------------------------
  // ORDER TRACKING SEARCH HANDLER
  // -------------------------------------------------------------
  const handleSearchOrder = (idToSearch?: string) => {
    const targetId = (idToSearch || trackingSearchQuery).trim().toUpperCase();
    const found = orders.find((o) => o.id.toUpperCase() === targetId);
    if (found) {
      setTrackedOrder(found);
      toast.success(`Found Order ${found.id}`);
    } else {
      toast.error(`No order found matching ID "${targetId}". Must be an 11-character ID (e.g. D0000000001)`);
    }
  };

  // -------------------------------------------------------------
  // CONNECTION DETAILS SEARCH HANDLER
  // -------------------------------------------------------------
  const handleSearchConnection = (idToSearch?: string) => {
    const targetId = (idToSearch || accountSearchQuery).trim();
    const found = connections.find(
      (c) => c.accountId.replace(/-/g, '') === targetId.replace(/-/g, '')
    );
    if (found) {
      setTrackedConnection(found);
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

  const retailNavItems: NavItem[] = [
    { id: 'new-order', label: 'Tạo đơn hàng mới', icon: ShoppingBag },
    { id: 'order-tracking', label: 'Theo dõi đơn hàng', icon: Clock, badge: orders.length },
    { id: 'connection-details', label: 'Chi tiết thuê bao', icon: Wifi, badge: connections.length },
    { id: 'payment-records', label: 'Hồ sơ thanh toán', icon: CreditCard, badge: bills.length },
  ];

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as RetailTab)}
      navItems={retailNavItems}
      roleBadgeTitle="Retail Outlet (Store Counter)"
      pageTitle={retailNavItems.find((t) => t.id === activeTab)?.label}
      primaryAction={{
        label: '+ New Order',
        onClick: () => setActiveTab('new-order'),
        icon: Plus,
      }}
    >
      {/* ------------------------------------------------------------- */}
      {/* TAB 1: PLACE ORDER FORM (Fast data entry for retail)          */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'new-order' && (
        <div key={activeTab} className="tab-content-animate grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Place Order Form */}
          <form
            onSubmit={handlePlaceOrderSubmit}
            className="lg:col-span-2 space-y-6 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
          >
              {/* SECTION A: Customer Personal Details */}
              <div>
                <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">
                  <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                    Step 1: Customer Personal Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Full Legal Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Julian Thorne"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Contact Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+1 (555) 000-0000"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="julian.t@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Identity Proof Document *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={idProofType}
                        onChange={(e) => setIdProofType(e.target.value as Order['idProofType'])}
                        className="px-2 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="National ID Card">National ID</option>
                        <option value="Passport">Passport</option>
                        <option value="Driver's License">Driver's Lic.</option>
                      </select>
                      <input
                        type="text"
                        required
                        placeholder="Document #"
                        value={idProofNumber}
                        onChange={(e) => setIdProofNumber(e.target.value)}
                        className="px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Physical Installation Address *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Street address, Apt/Suite, City, Postal Code"
                      value={installationAddress}
                      onChange={(e) => setInstallationAddress(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION B: Connection Type Selection */}
              <div>
                <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">
                  <Wifi className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                    Step 2: Connection Type
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { type: 'Broadband' as ConnectionType, icon: Wifi, desc: 'High-Speed Fiber FTTH' },
                    { type: 'Dial-Up' as ConnectionType, icon: Radio, desc: '56k Analog PSTN Modem' },
                    { type: 'Landline' as ConnectionType, icon: Phone, desc: 'Fixed Voice / VoIP Phone' },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = connectionType === item.type;
                    return (
                      <button
                        type="button"
                        key={item.type}
                        onClick={() => {
                          setConnectionType(item.type);
                          // Auto select first plan of this type
                          const firstPlan = plans.find((p) => p.type === item.type);
                          if (firstPlan) setSelectedPlanId(firstPlan.id);
                        }}
                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-slate-900 dark:text-white ring-2 ring-emerald-500/20'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Icon className={`h-5 w-5 ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                        </div>
                        <div>
                          <div className="font-bold text-sm">{item.type}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION C: Plan Selection */}
              <div>
                <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">
                  <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                    Step 3: Plan Selection ({connectionType})
                  </h3>
                </div>

                <div className="space-y-2">
                  {availablePlans.map((plan) => {
                    const isSelected = selectedPlanId === plan.id;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-1 ring-emerald-500'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-sm text-slate-900 dark:text-white">
                              {plan.name}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                              {plan.speedOrBandwidth}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{plan.description}</p>
                        </div>

                        <div className="text-right shrink-0 pl-4">
                          <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                            ${plan.monthlyRental.toFixed(2)}
                            <span className="text-xs font-normal text-slate-400">/mo</span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            Deposit: ${plan.securityDeposit.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Action */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  Submitting generates an official <strong className="text-slate-700 dark:text-slate-300">11-digit Order ID</strong> and routes to Tech Feasibility.
                </div>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-md flex items-center space-x-2"
                >
                  <span>Place Order & Generate ID</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>

            {/* Order Summary & Fast Entry Assist */}
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-900 dark:text-white flex items-center space-x-2">
                  <Receipt className="h-4 w-4 text-emerald-500" />
                  <span>Order Cost Summary</span>
                </h3>

                {currentPlan ? (
                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Selected Plan:</span>
                        <span className="font-semibold text-slate-900 dark:text-white text-right">
                          {currentPlan.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Bandwidth:</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">
                          {currentPlan.speedOrBandwidth}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>First Month Rental:</span>
                        <span className="font-mono tabular-nums">${currentPlan.monthlyRental.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Refundable Security Deposit:</span>
                        <span className="font-mono tabular-nums">${currentPlan.securityDeposit.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Est. Service Tax (12.24%):</span>
                        <span className="font-mono tabular-nums">
                          ${(((currentPlan.monthlyRental + currentPlan.securityDeposit) * 12.24) / 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between font-bold text-sm text-slate-900 dark:text-white">
                        <span>Initial Due at Counter:</span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                          $
                          {(
                            (currentPlan.monthlyRental + currentPlan.securityDeposit) *
                            1.1224
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">Please select a plan to view cost breakdown.</div>
                )}
              </div>

              {/* Retail Quick Fill Demo Helper */}
              <div className="rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/5 p-4 text-xs space-y-2">
                <div className="flex items-center space-x-2 font-semibold text-emerald-700 dark:text-emerald-400">
                  <Sparkles className="h-4 w-4" />
                  <span>Retail Fast-Fill Demo</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  Quickly populate walk-in customer details to speed up retail testing:
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCustomerName('Eleanor Vance');
                    setCustomerPhone('+1 (555) 712-4490');
                    setCustomerEmail('eleanor.vance@brooklynart.org');
                    setInstallationAddress('240 Bedford Ave, Apt 3A, Williamsburg, NY 11211');
                    setIdProofType('National ID Card');
                    setIdProofNumber('ID-NY-9920194');
                    setConnectionType('Broadband');
                    setSelectedPlanId('plan-bb-01');
                    toast.info('Form pre-filled with demo walk-in customer data');
                  }}
                  className="w-full py-1.5 px-3 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-700 dark:text-emerald-300 font-medium transition text-center"
                >
                  Fill Sample Customer Data
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: ORDER TRACKING (Required by Prompt #2)                 */}
        {/* Search & view status of order using 11-digit alphanumeric ID  */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'order-tracking' && (
          <div className="space-y-6">
            {/* Search Bar for 11-digit Alphanumeric ID */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Search Order by 11-Digit Alphanumeric ID (e.g., D0000000001, B0000000002)
              </label>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    maxLength={11}
                    placeholder="Enter 11-digit Order ID..."
                    value={trackingSearchQuery}
                    onChange={(e) => setTrackingSearchQuery(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchOrder()}
                    className="w-full pl-9 pr-4 py-2.5 text-base font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase tracking-widest"
                  />
                </div>
                <button
                  onClick={() => handleSearchOrder()}
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow"
                >
                  Track Order
                </button>
              </div>

              {/* Fast Pick Samples */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
                <span>Recent orders:</span>
                {orders.slice(0, 4).map((o) => (
                  <button
                    key={o.id}
                    onClick={() => {
                      setTrackingSearchQuery(o.id);
                      handleSearchOrder(o.id);
                    }}
                    className="font-mono text-emerald-600 dark:text-emerald-400 hover:underline bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40"
                  >
                    {o.id} ({o.status})
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Tracking Timeline & Details */}
            {trackedOrder ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
                {/* Header with status badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center space-x-3">
                      <h2 className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                        Order #{trackedOrder.id}
                      </h2>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          trackedOrder.status === 'Connection Provided'
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                            : trackedOrder.status === 'Feasible'
                            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                            : trackedOrder.status === 'Not Feasible'
                            ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
                            : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {trackedOrder.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Submitted at {trackedOrder.createdAt} by {trackedOrder.retailEmployeeName} ({trackedOrder.retailOutletCode})
                    </p>
                  </div>

                  <button
                    onClick={() => copyToClipboard(trackedOrder.id, 'Order ID')}
                    className="inline-flex items-center space-x-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Order ID</span>
                  </button>
                </div>

                {/* 4-Stage Visual Progress Stepper */}
                <div className="py-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-6">
                    Fulfillment Lifecycle Stepper
                  </div>

                  <div className="grid grid-cols-4 gap-2 relative">
                    {[
                      { step: 1, label: 'Order Logged', sub: 'Retail Counter' },
                      { step: 2, label: 'Feasibility Checked', sub: 'Field Telemetry' },
                      { step: 3, label: 'Tech Dispatch', sub: 'CPE & Port Bind' },
                      { step: 4, label: 'Connection Live', sub: '16-Digit Account' },
                    ].map((st) => {
                      const stageIdx = getStageIndex(trackedOrder.status);
                      const isComplete = stageIdx >= st.step;
                      const isFailed = trackedOrder.status === 'Not Feasible' && st.step >= 2;

                      return (
                        <div key={st.step} className="text-center space-y-2">
                          <div
                            className={`h-10 w-10 mx-auto rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                              isFailed
                                ? 'bg-rose-500 text-white'
                                : isComplete
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                            }`}
                          >
                            {isFailed ? '!' : isComplete ? <CheckCircle2 className="h-5 w-5" /> : st.step}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">{st.label}</div>
                            <div className="text-[11px] text-slate-500">{st.sub}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Order Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-sm">
                  <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <h4 className="font-semibold text-xs text-slate-500 uppercase">Customer Profile</h4>
                    <div className="space-y-1.5 text-xs">
                      <div>
                        <strong>Name:</strong> {trackedOrder.customerName}
                      </div>
                      <div>
                        <strong>Phone:</strong> {trackedOrder.customerPhone}
                      </div>
                      <div>
                        <strong>Email:</strong> {trackedOrder.customerEmail}
                      </div>
                      <div>
                        <strong>Verification:</strong> {trackedOrder.idProofType} ({trackedOrder.idProofNumber})
                      </div>
                      <div>
                        <strong>Address:</strong> {trackedOrder.installationAddress}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <h4 className="font-semibold text-xs text-slate-500 uppercase">Service & Technical Data</h4>
                    <div className="space-y-1.5 text-xs">
                      <div>
                        <strong>Plan:</strong> {trackedOrder.planName} ({trackedOrder.connectionType})
                      </div>
                      <div>
                        <strong>Cable Distance:</strong> {trackedOrder.cableDistanceMeters || 120} meters
                      </div>
                      <div>
                        <strong>DP Box Status:</strong> {trackedOrder.dpBoxCapacity || 'Port Available'}
                      </div>
                      {trackedOrder.feasibilityNotes && (
                        <div className="text-amber-600 dark:text-amber-400 pt-1">
                          <strong>Field Notes:</strong> {trackedOrder.feasibilityNotes}
                        </div>
                      )}
                      {trackedOrder.assignedAccountId && (
                        <div className="pt-2">
                          <span className="text-xs text-emerald-600 font-semibold block">
                            Issued 16-Digit Account ID:
                          </span>
                          <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
                            {trackedOrder.assignedAccountId}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                Enter an 11-digit Order ID above to inspect tracking status.
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: CONNECTION DETAILS (Required by Prompt #2)             */}
        {/* View to display customer billing & connection details based  */}
        {/* on their 16-digit Account ID.                                */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'connection-details' && (
          <div className="space-y-6">
            {/* Search 16-digit Account ID */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Search Subscriber by 16-Digit Account ID (e.g., 8820-4102-9931-1001)
              </label>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    value={accountSearchQuery}
                    onChange={(e) => setAccountSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchConnection()}
                    className="w-full pl-9 pr-4 py-2.5 text-base font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 tracking-widest"
                  />
                </div>
                <button
                  onClick={() => handleSearchConnection()}
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow"
                >
                  Retrieve Profile
                </button>
              </div>

              {/* Fast Pick Samples */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
                <span>Active lines:</span>
                {connections.map((c) => (
                  <button
                    key={c.accountId}
                    onClick={() => {
                      setAccountSearchQuery(c.accountId);
                      handleSearchConnection(c.accountId);
                    }}
                    className="font-mono text-emerald-600 dark:text-emerald-400 hover:underline bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40"
                  >
                    {c.accountId} ({c.customerName.split(' ')[0]})
                  </button>
                ))}
              </div>
            </div>

            {/* Connection Profile Card */}
            {trackedConnection ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center space-x-3">
                      <h2 className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                        Account #{trackedConnection.accountId}
                      </h2>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          trackedConnection.status === 'Active'
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                            : trackedConnection.status === 'Temporarily Inactive'
                            ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                            : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {trackedConnection.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Subscriber: <strong className="text-slate-700 dark:text-slate-300">{trackedConnection.customerName}</strong> • Activated on {trackedConnection.installedDate}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => copyToClipboard(trackedConnection.accountId, 'Account ID')}
                      className="inline-flex items-center space-x-1 text-xs border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-white"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Account ID</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="text-slate-400 font-semibold uppercase">Service Parameters</div>
                    <div><strong>Plan:</strong> {trackedConnection.planName}</div>
                    <div><strong>Connection:</strong> {trackedConnection.connectionType}</div>
                    <div><strong>Monthly Rental:</strong> ${trackedConnection.monthlyRental.toFixed(2)}</div>
                    <div><strong>Security Deposit:</strong> ${trackedConnection.securityDeposit.toFixed(2)}</div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="text-slate-400 font-semibold uppercase">Physical & Circuit Data</div>
                    <div><strong>Assigned IP:</strong> {trackedConnection.ipAddress || 'Dynamic DHCP'}</div>
                    <div><strong>Switch Port:</strong> {trackedConnection.portNumber || 'PON-01'}</div>
                    <div><strong>Assigned Device:</strong> {trackedConnection.assignedDeviceModel || 'Standard CPE'}</div>
                    <div className="font-mono"><strong>Serial:</strong> {trackedConnection.assignedDeviceSerial || 'NX-AUTO-GEN'}</div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="text-slate-400 font-semibold uppercase">Contact & Address</div>
                    <div><strong>Phone:</strong> {trackedConnection.customerPhone}</div>
                    <div><strong>Email:</strong> {trackedConnection.customerEmail}</div>
                    <div><strong>Installation:</strong> {trackedConnection.installationAddress}</div>
                    {trackedConnection.lastStatusReason && (
                      <div className="text-amber-500 pt-1">
                        <strong>Reason:</strong> {trackedConnection.lastStatusReason}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                Enter a 16-digit Account ID above to retrieve connection details.
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: PAYMENT RECORDS (Required by Prompt #2)                */}
        {/* Customer billing and payment details based on 16-digit Acct   */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'payment-records' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by Account ID or Name..."
                  value={paymentAccountQuery}
                  onChange={(e) => setPaymentAccountQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="text-xs text-slate-500">
                Showing transaction ledgers across all retail customers
              </div>
            </div>

            {/* Invoices & Payments Table */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Invoice Number</th>
                      <th className="px-4 py-3">16-Digit Account ID</th>
                      <th className="px-4 py-3">Subscriber Name</th>
                      <th className="px-4 py-3">Billing Cycle</th>
                      <th className="px-4 py-3">Total Amount ($)</th>
                      <th className="px-4 py-3">Amount Paid ($)</th>
                      <th className="px-4 py-3">Due Balance ($)</th>
                      <th className="px-4 py-3">Payment Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {bills
                      .filter(
                        (b) =>
                          b.accountId.toLowerCase().includes(paymentAccountQuery.toLowerCase()) ||
                          b.customerName.toLowerCase().includes(paymentAccountQuery.toLowerCase())
                      )
                      .map((bill) => (
                        <tr key={bill.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-4 py-3 font-mono font-medium text-slate-900 dark:text-slate-100">
                            {bill.invoiceNumber}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-emerald-600 dark:text-emerald-400">
                            {bill.accountId}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                            {bill.customerName}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {bill.billingMonth}
                          </td>
                          <td className="px-4 py-3 font-mono tabular-nums font-medium">
                            ${bill.totalAmount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">
                            ${bill.amountPaid.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 font-mono tabular-nums text-rose-600 dark:text-rose-400 font-semibold">
                            ${bill.dueAmount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                bill.status === 'Paid'
                                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                                  : bill.status === 'Partially Paid'
                                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                                  : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
                              }`}
                            >
                              {bill.status}
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
      {/* 3. ORDER CREATED SUCCESS MODAL (With 11-digit Order ID)       */}
      {/* ------------------------------------------------------------- */}
      {placedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4 text-center">
            <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                New Order Successfully Booked!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Order routed directly to the Technical Staff Feasibility Queue.
              </p>
            </div>

            {/* Highlighted 11-digit Order ID */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="text-xs text-slate-400 font-semibold uppercase">Official 11-Digit Order ID</div>
              <div className="text-2xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400 tracking-wider">
                {placedOrder.id}
              </div>
              <div className="text-[11px] text-slate-500">
                Customer: {placedOrder.customerName} • {placedOrder.planName}
              </div>
            </div>

            <div className="flex gap-2 justify-center">
              <button
                onClick={() => copyToClipboard(placedOrder.id, 'Order ID')}
                className="px-4 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-1.5"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copy ID</span>
              </button>
              <button
                onClick={() => {
                  const id = placedOrder.id;
                  setPlacedOrder(null);
                  setActiveTab('order-tracking');
                  setTrackingSearchQuery(id);
                  handleSearchOrder(id);
                }}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center space-x-1.5"
              >
                <span>Track This Order</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

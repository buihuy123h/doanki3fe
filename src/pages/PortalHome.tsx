import React from 'react';
import { useNavigate } from 'react-router';
import { useNexus } from '../context/NexusContext';
import {
  ShieldCheck,
  ShoppingBag,
  Wrench,
  Calculator,
  ArrowRight,
  Zap,
  CheckCircle2,
  HelpCircle,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';

export const PortalHome: React.FC = () => {
  const navigate = useNavigate();
  const { employees, retailShops, orders, connections, setCurrentRole } = useNexus();

  const activeEmployees = employees.filter((e) => e.status === 'Active').length;
  const activeLines = connections.filter((c) => c.status === 'Active').length;
  const pendingOrders = orders.filter((o) => o.status === 'Pending').length;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label}: ${text}`);
  };

  const roles = [
    {
      id: 'admin' as const,
      path: '/admin',
      title: '1. Admin (Manager) Dashboard',
      badge: 'Executive Oversight',
      color: 'border-indigo-500/30 hover:border-indigo-500 bg-indigo-950/20 text-indigo-400',
      buttonColor: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      icon: ShieldCheck,
      desc: 'Central control room for organizational leadership. Manage active employees, vendors, retail shops, inventory levels, and plan tariffs.',
      features: [
        'Total retail shops & active staff KPI cards',
        'Plan Management: Broadband, Dial-Up, Landline charges',
        'Employee Management: Add/Edit/Delete with validation',
        'Vendor Management: Suppliers, categories & ratings',
        'Inventory tracking & low-stock alerts',
      ],
      quickAction: 'Open Admin Suite',
    },
    {
      id: 'retail' as const,
      path: '/retail',
      title: '2. Retail Outlet Employee Dashboard',
      badge: 'POS & Order Entry',
      color: 'border-emerald-500/30 hover:border-emerald-500 bg-emerald-950/20 text-emerald-400',
      buttonColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      icon: ShoppingBag,
      desc: 'Fast-paced customer service desk for walk-in clients. Rapid order placement generating 11-digit Order IDs, order tracking, and billing records.',
      features: [
        'Place Order form: Personal info & connection selection',
        'Instant generation of 11-digit Order ID (e.g., D0000000001)',
        'Order Tracking with 4-phase visual progress stepper',
        'Connection Details lookup via 16-digit Account ID',
        'Payment history and customer receipts ledger',
      ],
      quickAction: 'Launch Retail Counter',
    },
    {
      id: 'technical' as const,
      path: '/technical',
      title: '3. Technical Staff Dashboard',
      badge: 'Field & Engineering Grid',
      color: 'border-amber-500/30 hover:border-amber-500 bg-amber-950/20 text-amber-400',
      buttonColor: 'bg-amber-600 hover:bg-amber-700 text-white',
      icon: Wrench,
      desc: 'Technical operations hub with grid-focused telemetry. Feasibility assessments, service provisioning, 3-way connection toggles, and equipment logging.',
      features: [
        'Order Feasibility Queue: Feasible / Not Feasible actions',
        'Connection Provided: Account ID generation & router assignment',
        'Connection Manager: 3-way toggle (Active / Temp / Perm Inactive)',
        'Equipment Tracker: Modems, routers, MACs, firmware & serials',
        'Signal loss telemetry & DP box capacity monitor',
      ],
      quickAction: 'Access Tech Terminal',
    },
    {
      id: 'accounts' as const,
      path: '/accounts',
      title: '4. Accounts Department Dashboard',
      badge: 'Financial & Billing Suite',
      color: 'border-blue-500/30 hover:border-blue-500 bg-blue-950/20 text-blue-400',
      buttonColor: 'bg-blue-600 hover:bg-blue-700 text-white',
      icon: Calculator,
      desc: 'High-precision financial software interface. Generate itemized customer invoices, calculate automated 12.24% Service Tax, and record payment balances.',
      features: [
        'Bill Generation: Security deposit + Rentals + Hourly charges',
        'Automated Service Tax line item calculated at exact 12.24%',
        'Payment Update form: Amount Paid vs Due Amount calculation',
        'Charge Settings: Configure tax rates and deposit thresholds',
        'Printable Invoice statements with transaction audit trail',
      ],
      quickAction: 'Open Financial Desk',
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900/80 to-slate-950 py-12 sm:py-16">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center space-x-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
              <Zap className="h-3.5 w-3.5" />
              <span>Unified Multi-Role Telecommunications Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
              Nexus Service Marketing System
            </h1>

            <p className="text-base sm:text-lg text-slate-400">
              Select a specialized portal below to operate the system according to your organizational role.
              All data flows seamlessly across roles in real time.
            </p>

            {/* Quick Metrics Bar */}
            <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
              <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-3">
                <div className="text-2xl font-bold text-white">{retailShops.length}</div>
                <div className="text-xs text-slate-400">Retail Outlets</div>
              </div>
              <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-3">
                <div className="text-2xl font-bold text-white">{activeEmployees}</div>
                <div className="text-xs text-slate-400">Active Staff</div>
              </div>
              <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-3">
                <div className="text-2xl font-bold text-amber-400">{pendingOrders}</div>
                <div className="text-xs text-slate-400">Pending Orders</div>
              </div>
              <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-3">
                <div className="text-2xl font-bold text-emerald-400">{activeLines}</div>
                <div className="text-xs text-slate-400">Active Lines</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Role Cards Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">4 Role-Based Operational Portals</h2>
            <p className="text-sm text-slate-400">Click on any module to enter its dedicated dashboard workspace</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((r) => {
            const Icon = r.icon;
            return (
              <div
                key={r.id}
                className={`relative flex flex-col justify-between rounded-xl border p-6 transition-all duration-200 bg-slate-900/70 hover:shadow-xl hover:-translate-y-0.5 ${r.color}`}
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-800 border border-slate-700">
                        <Icon className="h-6 w-6 text-slate-200" />
                      </div>
                      <div>
                        <span className="inline-block rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider bg-slate-800/80 border border-slate-700 text-slate-300 mb-1">
                          {r.badge}
                        </span>
                        <h3 className="text-xl font-bold text-white">{r.title}</h3>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-300 mb-4 leading-relaxed">{r.desc}</p>

                  <div className="space-y-2 mb-6 border-t border-slate-800/80 pt-4">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Key Capabilities:
                    </div>
                    {r.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start text-xs text-slate-300 space-x-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setCurrentRole(r.id);
                    navigate(r.path);
                  }}
                  className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm flex items-center justify-center space-x-2 transition shadow-md ${r.buttonColor}`}
                >
                  <span>{r.quickAction}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Quick Testing Reference Card */}
        <div className="mt-12 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center space-x-2 text-white font-semibold mb-3">
            <HelpCircle className="h-5 w-5 text-blue-400" />
            <h3 className="text-base">Quick Testing & Verification Reference</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Use these pre-loaded IDs to test instant search and cross-role workflows across all 4 dashboards:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg bg-slate-950 p-4 border border-slate-800">
              <div className="text-xs font-semibold text-emerald-400 mb-2 flex items-center justify-between">
                <span>11-Digit Alphanumeric Order IDs (Retail & Tech):</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="font-mono text-slate-200">D0000000001 (Dial-Up, Pending)</span>
                  <button
                    onClick={() => copyToClipboard('D0000000001', 'Order ID')}
                    className="text-slate-400 hover:text-white p-1"
                    title="Copy Order ID"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="font-mono text-slate-200">B0000000002 (Broadband, Feasible)</span>
                  <button
                    onClick={() => copyToClipboard('B0000000002', 'Order ID')}
                    className="text-slate-400 hover:text-white p-1"
                    title="Copy Order ID"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-slate-950 p-4 border border-slate-800">
              <div className="text-xs font-semibold text-blue-400 mb-2 flex items-center justify-between">
                <span>16-Digit Account IDs (Retail, Tech & Accounts):</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="font-mono text-slate-200">8820-4102-9931-1001 (Active, Landline)</span>
                  <button
                    onClick={() => copyToClipboard('8820-4102-9931-1001', 'Account ID')}
                    className="text-slate-400 hover:text-white p-1"
                    title="Copy Account ID"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="font-mono text-slate-200">8820-4102-9931-1002 (Active, Broadband)</span>
                  <button
                    onClick={() => copyToClipboard('8820-4102-9931-1002', 'Account ID')}
                    className="text-slate-400 hover:text-white p-1"
                    title="Copy Account ID"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

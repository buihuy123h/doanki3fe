/**
 * =======================================================================
 * NEXUS SERVICE MARKETING SYSTEM - ACCOUNTS DEPARTMENT DASHBOARD
 * =======================================================================
 * 
 * ROLE: Senior Accountant & Billing Operations Executive
 * PURPOSE: Financial ledger management, customer billing calculations,
 *          automated statutory Service Tax (12.24%) assessments, payment
 *          recording (Amount Paid vs Due Amount), and tariff/charge adjustments.
 * 
 * DESIGN REQUIREMENTS:
 * - Professional financial software interface
 * - Clear typographic hierarchy for numbers and currency totals (`tabular-nums`)
 * - Itemized billing breakdown with line items:
 *    1. Security Deposit
 *    2. Monthly Rentals / Hourly charges
 *    3. Automated Service Tax (12.24%) row
 *    4. Subtotal & Grand Total
 * - Payment update form calculating remaining Due Amount
 * - Detailed comments explaining form submission & calculation logic
 * =======================================================================
 */

import React, { useState, useMemo } from 'react';
import { useNexus } from '../context/NexusContext';
import { DashboardLayout, type NavItem } from '../components/layout/DashboardLayout';
import {
  Receipt,
  CreditCard,
  Settings,
  Search,
  CheckCircle2,
  Printer,
  X,
  Building,
  Plus,
} from 'lucide-react';
import type { Bill, PaymentRecord } from '../types/nexus';
import { toast } from 'sonner';

type AccountsTab = 'bill-generation' | 'payment-updates' | 'charge-settings';

export const AccountsDashboard: React.FC = () => {
  const { connections, bills, generateBill, recordPayment, settings, updateSettings } = useNexus();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<AccountsTab>('bill-generation');

  // -------------------------------------------------------------
  // STATE: BILL GENERATION FORM (Required by Prompt #4)
  // Input: 16-digit Account ID
  // Line items: Security Deposit, Monthly Rentals/Hourly, Service Tax (12.24%)
  // -------------------------------------------------------------
  const [billAccountId, setBillAccountId] = useState('8820-4102-9931-1001');
  const [billingMonth, setBillingMonth] = useState('September 2026');
  const [customSecurityDeposit, setCustomSecurityDeposit] = useState<number>(30.0);
  const [customMonthlyRental, setCustomMonthlyRental] = useState<number>(19.99);
  const [customHourlyCharges, setCustomHourlyCharges] = useState<number>(0.0);

  // Selected Connection matching the Account ID
  const matchedConnection = useMemo(() => {
    return connections.find(
      (c) => c.accountId.replace(/-/g, '') === billAccountId.trim().replace(/-/g, '')
    );
  }, [connections, billAccountId]);

  // When connection changes, auto-load its plan rates
  const handleSelectConnectionForBilling = (accountId: string) => {
    setBillAccountId(accountId);
    const conn = connections.find((c) => c.accountId === accountId);
    if (conn) {
      setCustomSecurityDeposit(conn.securityDeposit || 50.0);
      setCustomMonthlyRental(conn.monthlyRental || 49.99);
      setCustomHourlyCharges(0.0);
      toast.info(`Loaded subscriber parameters for ${conn.customerName}`);
    }
  };

  // -------------------------------------------------------------
  // FINANCIAL CALCULATION ENGINE:
  // Subtotal = Security Deposit + Monthly Rental + Hourly Charges
  // Service Tax = Subtotal * (serviceTaxRate / 100) [Default: 12.24%]
  // Grand Total = Subtotal + Service Tax
  // -------------------------------------------------------------
  const subtotal = useMemo(() => {
    return Number(
      ((customSecurityDeposit || 0) + (customMonthlyRental || 0) + (customHourlyCharges || 0)).toFixed(2)
    );
  }, [customSecurityDeposit, customMonthlyRental, customHourlyCharges]);

  const serviceTaxAmount = useMemo(() => {
    return Number(((subtotal * settings.serviceTaxRate) / 100).toFixed(2));
  }, [subtotal, settings.serviceTaxRate]);

  const grandTotal = useMemo(() => {
    return Number((subtotal + serviceTaxAmount).toFixed(2));
  }, [subtotal, serviceTaxAmount]);

  // Invoice Preview Modal State
  const [generatedInvoiceModal, setGeneratedInvoiceModal] = useState<Bill | null>(null);

  // -------------------------------------------------------------
  // STATE: PAYMENT UPDATE FORM (Required by Prompt #4)
  // Input: Select Bill/Invoice, Amount Paid, auto-calculate Due Amount
  // -------------------------------------------------------------
  const [selectedInvoiceNumber, setSelectedInvoiceNumber] = useState<string>(
    bills[0]?.invoiceNumber || ''
  );
  const [paymentAmountInput, setPaymentAmountInput] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentRecord['paymentMode']>('Credit/Debit Card');
  const [paymentRefNumber, setPaymentRefNumber] = useState('');
  const [cashierName, setCashierName] = useState('Elena Rostova (Accounts)');

  // Selected Bill for Payment Updating
  const activeBillToPay = useMemo(() => {
    return bills.find((b) => b.invoiceNumber === selectedInvoiceNumber) || bills[0] || null;
  }, [bills, selectedInvoiceNumber]);

  // Projected Due Amount after Payment Input
  const projectedDueAmount = useMemo(() => {
    if (!activeBillToPay) return 0;
    const remaining = activeBillToPay.totalAmount - (activeBillToPay.amountPaid + (paymentAmountInput || 0));
    return Number(Math.max(0, remaining).toFixed(2));
  }, [activeBillToPay, paymentAmountInput]);

  // -------------------------------------------------------------
  // STATE: CHARGE SETTINGS
  // -------------------------------------------------------------
  const [taxRateSetting, setTaxRateSetting] = useState(settings.serviceTaxRate);
  const [lateFeeSetting, setLateFeeSetting] = useState(settings.latePaymentFeePercent);
  const [broadbandDeposit, setBroadbandDeposit] = useState(settings.defaultSecurityDeposits.Broadband);
  const [dialUpDeposit, setDialUpDeposit] = useState(settings.defaultSecurityDeposits['Dial-Up']);
  const [landlineDeposit, setLandlineDeposit] = useState(settings.defaultSecurityDeposits.Landline);

  // -------------------------------------------------------------
  // FORM SUBMISSION LOGIC: GENERATE BILL
  // 1. Validates that an Account ID is provided and resolved
  // 2. Invokes context `generateBill` which computes lines and adds to ledger
  // 3. Prompts the generated invoice printable statement modal
  // -------------------------------------------------------------
  const handleGenerateBillSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!billAccountId.trim()) {
      toast.error('Please input a valid 16-digit Account ID.');
      return;
    }

    const createdBill = generateBill(
      billAccountId,
      customSecurityDeposit,
      customMonthlyRental,
      customHourlyCharges,
      billingMonth
    );

    setGeneratedInvoiceModal(createdBill);
    toast.success(`Invoice ${createdBill.invoiceNumber} successfully generated!`);
  };

  // -------------------------------------------------------------
  // FORM SUBMISSION LOGIC: UPDATE PAYMENT STATUS
  // 1. Checks that amount paid is greater than zero
  // 2. Calls context `recordPayment` to update Amount Paid and Due Amount
  // 3. Immediately reflects paid status in the financial ledger
  // -------------------------------------------------------------
  const handlePaymentUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeBillToPay) {
      toast.error('No invoice selected.');
      return;
    }

    if (paymentAmountInput <= 0) {
      toast.error('Payment amount must be greater than zero.');
      return;
    }

    const ref = paymentRefNumber.trim() || `TXN-REC-${Date.now().toString().slice(-6)}`;

    const updated = recordPayment(
      activeBillToPay.invoiceNumber,
      paymentAmountInput,
      paymentMode,
      ref,
      cashierName
    );

    if (updated) {
      toast.success(
        `Payment of $${paymentAmountInput.toFixed(2)} recorded for ${updated.invoiceNumber}. Remaining Due: $${updated.dueAmount.toFixed(2)}`
      );
      setPaymentAmountInput(0);
      setPaymentRefNumber('');
    }
  };

  // -------------------------------------------------------------
  // SETTINGS FORM SUBMISSION HANDLER
  // -------------------------------------------------------------
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      serviceTaxRate: taxRateSetting,
      latePaymentFeePercent: lateFeeSetting,
      defaultSecurityDeposits: {
        Broadband: broadbandDeposit,
        'Dial-Up': dialUpDeposit,
        Landline: landlineDeposit,
      },
    });
    toast.success('Financial charge settings & tax rates updated successfully.');
  };

  const accountsNavItems: NavItem[] = [
    {
      id: 'bill-generation',
      label: 'Tạo hóa đơn cước',
      icon: Receipt,
      badge: '12.24%',
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'payment-updates',
      label: 'Cập nhật thanh toán',
      icon: CreditCard,
      badge: bills.filter((b) => b.status !== 'Paid').length,
    },
    {
      id: 'charge-settings',
      label: 'Cài đặt biểu cước & Thuế',
      icon: Settings,
    },
  ];

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as AccountsTab)}
      navItems={accountsNavItems}
      roleBadgeTitle="Finance & Billing (Accounts Dept)"
      pageTitle={accountsNavItems.find((t) => t.id === activeTab)?.label}
      primaryAction={{
        label: '+ New Invoice',
        onClick: () => setActiveTab('bill-generation'),
        icon: Plus,
      }}
    >
      <div key={activeTab} className="tab-content-animate space-y-6">
          {/* ------------------------------------------------------------- */}
          {/* TAB 1: BILL GENERATION (Required by Prompt #4)                */}
          {/* Input Account ID, calculate bill with line items:             */}
          {/* - Security Deposit                                            */}
          {/* - Monthly Rentals / Hourly charges                            */}
          {/* - Automated row for Service Tax (12.24%)                      */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'bill-generation' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bill Generator Form */}
            <form
              onSubmit={handleGenerateBillSubmit}
              className="lg:col-span-2 space-y-6 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              {/* Account ID Input Section */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  16-Digit Subscriber Account ID *
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="XXXX-XXXX-XXXX-XXXX"
                      value={billAccountId}
                      onChange={(e) => setBillAccountId(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-base font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-widest text-slate-900 dark:text-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectConnectionForBilling(billAccountId)}
                    className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
                  >
                    Fetch Parameters
                  </button>
                </div>

                {/* Quick Account Selection */}
                <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-slate-500">
                  <span>Quick Select Account:</span>
                  {connections.map((c) => (
                    <button
                      type="button"
                      key={c.accountId}
                      onClick={() => handleSelectConnectionForBilling(c.accountId)}
                      className="font-mono text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800/40"
                    >
                      {c.accountId} ({c.customerName.split(' ')[0]})
                    </button>
                  ))}
                </div>
              </div>

              {/* Matched Subscriber Banner */}
              {matchedConnection ? (
                <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Subscriber Name:</span>
                    <strong className="text-slate-900 dark:text-white text-sm">
                      {matchedConnection.customerName}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Connection & Plan:</span>
                    <strong className="text-slate-900 dark:text-white">
                      {matchedConnection.planName} ({matchedConnection.connectionType})
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Installation Address:</span>
                    <span className="text-slate-600 dark:text-slate-300 truncate block">
                      {matchedConnection.installationAddress}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-700 dark:text-amber-300">
                  Account ID not currently bound in memory. You may still input manual billing figures below.
                </div>
              )}

              {/* Billing Period Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Billing Period / Cycle
                </label>
                <select
                  value={billingMonth}
                  onChange={(e) => setBillingMonth(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
                >
                  <option value="September 2026">September 2026 (Current Cycle)</option>
                  <option value="August 2026">August 2026</option>
                  <option value="July 2026">July 2026</option>
                </select>
              </div>

              {/* ITEMIZED LINE ITEMS CALCULATION (Required by Prompt #4) */}
              <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Itemized Charges & Tax Breakdown Table
                </h3>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden text-sm">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-2.5">Line Item Description</th>
                        <th className="px-4 py-2.5 text-right w-44">Charge Amount ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {/* Line Item 1: Security Deposit */}
                      <tr>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            Security Deposit (Refundable)
                          </div>
                          <div className="text-slate-500">
                            Required refundable deposit for telecom equipment & circuit bond
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={customSecurityDeposit}
                            onChange={(e) => setCustomSecurityDeposit(parseFloat(e.target.value) || 0)}
                            className="w-32 px-2.5 py-1.5 text-right font-mono tabular-nums font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white"
                          />
                        </td>
                      </tr>

                      {/* Line Item 2: Monthly Rentals / Hourly Charges */}
                      <tr>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            Monthly Plan Rental Charge
                          </div>
                          <div className="text-slate-500">
                            Recurring monthly subscriber fee for unlimited/bandwidth tier
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={customMonthlyRental}
                            onChange={(e) => setCustomMonthlyRental(parseFloat(e.target.value) || 0)}
                            className="w-32 px-2.5 py-1.5 text-right font-mono tabular-nums font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white"
                          />
                        </td>
                      </tr>

                      {/* Line Item 3: Hourly / Metered Charges (for dial-up or excess calls) */}
                      <tr>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            Hourly / Usage Metered Charges
                          </div>
                          <div className="text-slate-500">
                            Metered dial-up access time or international voice talk minutes
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={customHourlyCharges}
                            onChange={(e) => setCustomHourlyCharges(parseFloat(e.target.value) || 0)}
                            className="w-32 px-2.5 py-1.5 text-right font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white"
                          />
                        </td>
                      </tr>

                      {/* Line Item 4: Subtotal Calculation */}
                      <tr className="bg-slate-50/70 dark:bg-slate-950 font-semibold">
                        <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                          Subtotal (Taxable Base)
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums text-sm text-slate-900 dark:text-white">
                          ${subtotal.toFixed(2)}
                        </td>
                      </tr>

                      {/* Line Item 5: AUTOMATED ROW FOR SERVICE TAX (12.24%) */}
                      <tr className="bg-blue-50/50 dark:bg-blue-950/40">
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-blue-700 dark:text-blue-300">
                              Service Tax ({settings.serviceTaxRate}%)
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-600 text-white font-semibold uppercase">
                              Automated Statutory
                            </span>
                          </div>
                          <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                            Automated computation: ${subtotal.toFixed(2)} × {settings.serviceTaxRate}%
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-sm text-blue-700 dark:text-blue-400">
                          +${serviceTaxAmount.toFixed(2)}
                        </td>
                      </tr>

                      {/* Grand Total Row */}
                      <tr className="bg-slate-900 text-white font-bold text-sm">
                        <td className="px-4 py-3 uppercase tracking-wider text-xs">
                          Grand Total Net Payable ($)
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-base tabular-nums text-emerald-400">
                          ${grandTotal.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition shadow-md flex items-center space-x-2"
                >
                  <Receipt className="h-4 w-4" />
                  <span>Generate Customer Bill</span>
                </button>
              </div>
            </form>

            {/* Financial Ledger Quick View */}
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-900 dark:text-white flex items-center space-x-2">
                  <Building className="h-4 w-4 text-blue-500" />
                  <span>Statutory Tax Compliance</span>
                </h3>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Under telecom marketing system regulations, all issued subscriptions apply a statutory
                  <strong> {settings.serviceTaxRate}% Service Tax</strong> across equipment deposit and rental
                  line items.
                </p>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tax Category:</span>
                    <span className="text-slate-900 dark:text-white">Telecommunication Services</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tax Identifier:</span>
                    <span className="text-slate-900 dark:text-white">ST-NEX-FED-1224</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Service Tax Rate:</span>
                    <span className="text-blue-600 font-bold">{settings.serviceTaxRate}%</span>
                  </div>
                </div>
              </div>

              {/* Recent Bills Created */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-500">
                    Recent Generated Invoices
                  </h3>
                  <button
                    onClick={() => setActiveTab('payment-updates')}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Payments →
                  </button>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {bills.slice(0, 3).map((b) => (
                    <div key={b.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          {b.invoiceNumber}
                        </div>
                        <div className="text-slate-500 truncate max-w-[140px]">{b.customerName}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                          ${b.totalAmount.toFixed(2)}
                        </div>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                            b.status === 'Paid'
                              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                              : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: PAYMENT UPDATES (Required by Prompt #4)                */}
        {/* Form to update payment status (Amount Paid, Due Amount) after */}
        {/* a bill is generated.                                          */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'payment-updates' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Payment Update Entry Form */}
            <form
              onSubmit={handlePaymentUpdateSubmit}
              className="lg:col-span-2 space-y-6 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Update Payment Status & Reconcile Balance
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record collected cash, cheque, or electronic payments against outstanding bills.
                </p>
              </div>

              {/* Select Invoice to Update */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Generated Invoice to Settle *
                </label>
                <select
                  value={selectedInvoiceNumber}
                  onChange={(e) => setSelectedInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                >
                  {bills.map((b) => (
                    <option key={b.id} value={b.invoiceNumber}>
                      {b.invoiceNumber} — {b.customerName} (Total: ${b.totalAmount.toFixed(2)}, Due: $
                      {b.dueAmount.toFixed(2)}) [{b.status}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Bill Financial Status Overview */}
              {activeBillToPay && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between border-b border-slate-200 dark:border-slate-800 pb-2 text-xs">
                    <div>
                      <span className="text-slate-500">Customer: </span>
                      <strong className="text-slate-900 dark:text-white">
                        {activeBillToPay.customerName}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Account ID: </span>
                      <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                        {activeBillToPay.accountId}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Status: </span>
                      <span
                        className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                          activeBillToPay.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {activeBillToPay.status}
                      </span>
                    </div>
                  </div>

                  {/* 3 Metric Cards for Amount Paid & Due Amount */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="text-[11px] text-slate-500 uppercase">Total Bill</div>
                      <div className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                        ${activeBillToPay.totalAmount.toFixed(2)}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="text-[11px] text-slate-500 uppercase">Currently Paid</div>
                      <div className="text-base font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                        ${activeBillToPay.amountPaid.toFixed(2)}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="text-[11px] text-slate-500 uppercase">Current Due</div>
                      <div className="text-base font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400 mt-0.5">
                        ${activeBillToPay.dueAmount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PAYMENT UPDATE FORM FIELDS (Prompt #4 Required) */}
              <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Amount Paid Field */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      New Payment Amount ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="0.00"
                      value={paymentAmountInput || ''}
                      onChange={(e) => setPaymentAmountInput(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-base font-mono tabular-nums font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                    />
                    <div className="flex gap-2 mt-1.5">
                      <button
                        type="button"
                        onClick={() => setPaymentAmountInput(activeBillToPay?.dueAmount || 0)}
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        Pay Full Due (${activeBillToPay?.dueAmount.toFixed(2)})
                      </button>
                    </div>
                  </div>

                  {/* Projected Remaining Due Amount (Automated Formula) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Calculated Remaining Due Amount ($)
                    </label>
                    <div className="w-full px-3 py-2 text-base font-mono tabular-nums font-bold bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-rose-600 dark:text-rose-400">
                      ${projectedDueAmount.toFixed(2)}
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Formula: Total Bill - (Prior Paid + New Payment)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={paymentMode}
                      onChange={(e) =>
                        setPaymentMode(e.target.value as PaymentRecord['paymentMode'])
                      }
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
                    >
                      <option value="Credit/Debit Card">Credit/Debit Card (POS)</option>
                      <option value="Cash">Cash (Counter Tender)</option>
                      <option value="Cheque">Cheque / Demand Draft</option>
                      <option value="Bank Transfer/NEFT">Bank Transfer / NEFT / ACH</option>
                      <option value="UPI/Digital Wallet">UPI / Digital Wallet</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Transaction / Cheque Ref #
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CHQ-991204 or TXN-VISA-8821"
                      value={paymentRefNumber}
                      onChange={(e) => setPaymentRefNumber(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Recording Cashier / Accountant Name
                  </label>
                  <input
                    type="text"
                    required
                    value={cashierName}
                    onChange={(e) => setCashierName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Submit Update */}
              <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition shadow-md flex items-center space-x-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Update Payment & Close Balance</span>
                </button>
              </div>
            </form>

            {/* Payment History Log for Active Bill */}
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                  Payment History Log
                </h3>

                {activeBillToPay && activeBillToPay.paymentHistory.length > 0 ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {activeBillToPay.paymentHistory.map((p) => (
                      <div key={p.paymentId} className="py-2.5 space-y-1">
                        <div className="flex justify-between font-semibold">
                          <span className="text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                            +${p.amountPaid.toFixed(2)}
                          </span>
                          <span className="text-slate-400">{p.paymentDate}</span>
                        </div>
                        <div className="text-slate-500">
                          {p.paymentMode} • Ref: {p.referenceNumber}
                        </div>
                        <div className="text-[10px] text-slate-400">Recorded by: {p.recordedBy}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 py-6 text-center">
                    No payment history recorded for this invoice yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: CHARGE SETTINGS (Required by Prompt #4)                */}
        {/* Configure Service Tax rate (12.24%), late fees, deposits      */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'charge-settings' && (
          <div className="max-w-2xl bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Tariff Policy & Statutory Tax Settings
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Set baseline parameters applied globally across bill generation formulas.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-sm">
              {/* Service Tax % */}
              <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-200">
                      Standard Service Tax Rate (%) *
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Statutory requirement as specified in system specifications: 12.24%
                    </p>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    value={taxRateSetting}
                    onChange={(e) => setTaxRateSetting(parseFloat(e.target.value) || 0)}
                    className="w-24 px-3 py-1.5 text-right font-mono tabular-nums font-bold bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-blue-600 dark:text-blue-400"
                  />
                </div>
              </div>

              {/* Late Payment Fee % */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Late Payment Surcharge (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={lateFeeSetting}
                  onChange={(e) => setLateFeeSetting(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono tabular-nums"
                />
              </div>

              {/* Default Security Deposits */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Default Security Deposit Benchmarks ($)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="text-xs text-slate-600 dark:text-slate-400 block mb-1">
                      Broadband ($)
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={broadbandDeposit}
                      onChange={(e) => setBroadbandDeposit(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono tabular-nums text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-slate-600 dark:text-slate-400 block mb-1">
                      Dial-Up ($)
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={dialUpDeposit}
                      onChange={(e) => setDialUpDeposit(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono tabular-nums text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-slate-600 dark:text-slate-400 block mb-1">
                      Landline ($)
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={landlineDeposit}
                      onChange={(e) => setLandlineDeposit(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono tabular-nums text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition shadow"
                >
                  Save Charge Settings
                </button>
              </div>
            </form>
          </div>
        )}
        </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. GENERATED INVOICE PRINTABLE PREVIEW MODAL                  */}
      {/* ------------------------------------------------------------- */}
      {generatedInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-6">
            {/* Invoice Header */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                  Nexus Service Marketing System
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  TAX INVOICE STATEMENT
                </h2>
                <p className="text-xs text-slate-500">Official Billing Receipt & Tax Breakdown</p>
              </div>
              <button
                onClick={() => setGeneratedInvoiceModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <div className="text-slate-400">Billed To:</div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  {generatedInvoiceModal.customerName}
                </div>
                <div className="font-mono text-blue-600 dark:text-blue-400">
                  Account ID: {generatedInvoiceModal.accountId}
                </div>
              </div>

              <div className="text-right space-y-1">
                <div className="font-mono font-bold text-slate-900 dark:text-white">
                  {generatedInvoiceModal.invoiceNumber}
                </div>
                <div className="text-slate-500">Billing Date: {generatedInvoiceModal.billingDate}</div>
                <div className="text-slate-500">Due Date: {generatedInvoiceModal.dueDate}</div>
              </div>
            </div>

            {/* Line Items Breakdown */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-3 py-2">Description</th>
                    <th className="px-3 py-2 text-right">Amount ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="px-3 py-2">Security Deposit (Refundable)</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">
                      ${generatedInvoiceModal.securityDeposit.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2">
                      Monthly Rental — {generatedInvoiceModal.planName}
                    </td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">
                      ${generatedInvoiceModal.monthlyRental.toFixed(2)}
                    </td>
                  </tr>
                  {generatedInvoiceModal.hourlyCharges > 0 && (
                    <tr>
                      <td className="px-3 py-2">Hourly / Usage Charges</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">
                        ${generatedInvoiceModal.hourlyCharges.toFixed(2)}
                      </td>
                    </tr>
                  )}
                  <tr className="bg-slate-50 dark:bg-slate-950 font-semibold">
                    <td className="px-3 py-2">Subtotal</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">
                      ${generatedInvoiceModal.subtotal.toFixed(2)}
                    </td>
                  </tr>
                  <tr className="bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-medium">
                    <td className="px-3 py-2">
                      Service Tax ({generatedInvoiceModal.serviceTaxRate}%)
                    </td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums font-bold">
                      +${generatedInvoiceModal.serviceTaxAmount.toFixed(2)}
                    </td>
                  </tr>
                  <tr className="bg-slate-900 text-white font-bold text-sm">
                    <td className="px-3 py-2.5">Grand Total Due ($)</td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums text-emerald-400">
                      ${generatedInvoiceModal.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-slate-400">
                Statutory invoice generated by Nexus Core Billing Engine
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-1.5"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Invoice</span>
                </button>
                <button
                  onClick={() => setGeneratedInvoiceModal(null)}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

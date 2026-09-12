<script lang="ts">
  // Mirrors pages/AccountsDashboard.tsx of the React original.
  import { nexusStore } from '../context/NexusContext';
  import { languageStore } from '../context/LanguageContext';
  import DashboardLayout from '../components/layout/DashboardLayout.svelte';
  import SettingsView from '../components/common/SettingsView.svelte';
  import ProfileView from '../components/common/ProfileView.svelte';
  import type { NavItem } from '../components/layout/DashboardLayout.svelte';
  import {
    Receipt, CreditCard, Settings, Search, CheckCircle2, Printer, X, Building, Plus,
  } from 'lucide-svelte';
  import type { Bill, PaymentRecord } from '../types/nexus';
  import { toast } from 'svelte-sonner';
  import { queryParam, activeTabOverride } from '../lib/router';

  type AccountsTab = 'bill-generation' | 'payment-updates' | 'charge-settings' | 'settings' | 'profile';

  const { connections, orders, bills, generateBill, recordPayment, settings, updateSettings } = nexusStore;
  const { t, language } = languageStore;

  // Active navigation tab
  let activeTab = $state<AccountsTab>('bill-generation');

  // Reactively respond to tab overrides from router / notifications
  $effect(() => {
    const override = $activeTabOverride;
    const validTabs: AccountsTab[] = ['bill-generation', 'payment-updates', 'charge-settings', 'settings', 'profile'];
    if (override && override.path === '/accounts') {
      if (validTabs.includes(override.tab as AccountsTab)) {
        activeTab = override.tab as AccountsTab;
      }
    } else {
      const qTab = queryParam('tab');
      if (qTab && validTabs.includes(qTab as AccountsTab)) {
        activeTab = qTab as AccountsTab;
      }
    }
  });

  // STATE: BILL GENERATION FORM
  let billAccountId = $state('T064-000000000001');
  let billingMonth = $state('September 2026');
  let customSecurityDeposit = $state(250);
  let customMonthlyRental = $state(125);
  let customHourlyCharges = $state(0.0);
  let discountPercent = $state(25); // bulk / corporate scheme discount
  let discountTouched = $state(false);

  // Selected Connection matching the Account ID
  const matchedConnection = $derived(
    $connections.find(
      (c) => c.accountId.replace(/-/g, '') === billAccountId.trim().replace(/-/g, '')
    )
  );

  // The order behind this connection carries the bulk scheme discount.
  const matchedOrder = $derived(
    matchedConnection
      ? $orders.find((o) => o.id === matchedConnection.orderId) ??
          $orders.find((o) => o.assignedAccountId === matchedConnection.accountId)
      : undefined
  );

  // Keep the discount in sync with the order's scheme unless the accountant overrode it.
  $effect(() => {
    if (!discountTouched) discountPercent = matchedOrder?.bulkDiscountPercent ?? 0;
  });

  // When connection changes, auto-load its plan rates
  const handleSelectConnectionForBilling = (accountId: string) => {
    billAccountId = accountId;
    discountTouched = false;
    const conn = $connections.find((c) => c.accountId === accountId);
    if (conn) {
      customSecurityDeposit = conn.securityDeposit || 250;
      customMonthlyRental = conn.monthlyRental || 100;
      customHourlyCharges = 0.0;
      toast.info($language === 'vi' ? `Đã tải thông số thuê bao cho ${conn.customerName}` : `Loaded subscriber parameters for ${conn.customerName}`);
    }
  };

  // FINANCIAL CALCULATION ENGINE:
  // Discount   = (Security Deposit + Monthly Rental) * discountPercent%
  // Subtotal   = Security Deposit + Monthly Rental + Hourly Charges - Discount
  // Service Tax = Subtotal * (serviceTaxRate / 100) [Default: 12.24%]
  // Grand Total = Subtotal + Service Tax
  const discountAmount = $derived(
    Number(
      (((customSecurityDeposit || 0) + (customMonthlyRental || 0)) * (discountPercent || 0) / 100).toFixed(2)
    )
  );
  const subtotal = $derived(
    Number(
      ((customSecurityDeposit || 0) + (customMonthlyRental || 0) + (customHourlyCharges || 0) - discountAmount).toFixed(2)
    )
  );
  const serviceTaxAmount = $derived(Number(((subtotal * $settings.serviceTaxRate) / 100).toFixed(2)));
  const grandTotal = $derived(Number((subtotal + serviceTaxAmount).toFixed(2)));

  // Invoice Preview Modal State
  let generatedInvoiceModal = $state<Bill | null>(null);

  // STATE: PAYMENT UPDATE FORM
  let selectedInvoiceNumber = $state($bills[0]?.invoiceNumber || '');
  let paymentAmountInput = $state(0);
  let paymentMode = $state<PaymentRecord['paymentMode']>('Credit/Debit Card');
  let paymentRefNumber = $state('');
  let cashierName = $state('Elena Rostova (Accounts)');

  // Selected Bill for Payment Updating
  const activeBillToPay = $derived(
    $bills.find((b) => b.invoiceNumber === selectedInvoiceNumber) || $bills[0] || null
  );

  // Projected Due Amount after Payment Input
  const projectedDueAmount = $derived.by(() => {
    if (!activeBillToPay) return 0;
    const remaining = activeBillToPay.totalAmount - (activeBillToPay.amountPaid + (paymentAmountInput || 0));
    return Number(Math.max(0, remaining).toFixed(2));
  });

  // STATE: CHARGE SETTINGS
  let taxRateSetting = $state($settings.serviceTaxRate);
  let lateFeeSetting = $state($settings.latePaymentFeePercent);
  let broadbandDeposit = $state($settings.defaultSecurityDeposits.Broadband);
  let dialUpDeposit = $state($settings.defaultSecurityDeposits['Dial-Up']);
  let landlineDeposit = $state($settings.defaultSecurityDeposits.Landline);

  // FORM SUBMISSION LOGIC: GENERATE BILL
  const handleGenerateBillSubmit = (e: SubmitEvent) => {
    e.preventDefault();

    if (!billAccountId.trim()) {
      toast.error($language === 'vi' ? 'Vui lòng nhập mã tài khoản 16 ký tự hợp lệ.' : 'Please input a valid 16-character Account ID.');
      return;
    }

    const createdBill = generateBill(
      billAccountId,
      customSecurityDeposit,
      customMonthlyRental,
      customHourlyCharges,
      billingMonth,
      discountPercent || 0
    );

    generatedInvoiceModal = createdBill;
    toast.success($language === 'vi' ? `Hóa đơn ${createdBill.invoiceNumber} đã phát hành thành công!` : `Invoice ${createdBill.invoiceNumber} successfully generated!`);
  };

  // FORM SUBMISSION LOGIC: UPDATE PAYMENT STATUS
  const handlePaymentUpdateSubmit = (e: SubmitEvent) => {
    e.preventDefault();

    if (!activeBillToPay) {
      toast.error($language === 'vi' ? 'Chưa chọn hóa đơn nào.' : 'No invoice selected.');
      return;
    }

    if (paymentAmountInput <= 0) {
      toast.error($language === 'vi' ? 'Số tiền thanh toán phải lớn hơn 0.' : 'Payment amount must be greater than zero.');
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
        $language === 'vi'
          ? `Đã ghi nhận thanh toán $${paymentAmountInput.toFixed(2)} cho ${updated.invoiceNumber}. Công nợ còn lại: $${updated.dueAmount.toFixed(2)}`
          : `Payment of $${paymentAmountInput.toFixed(2)} recorded for ${updated.invoiceNumber}. Remaining Due: $${updated.dueAmount.toFixed(2)}`
      );
      paymentAmountInput = 0;
      paymentRefNumber = '';
    }
  };

  // SETTINGS FORM SUBMISSION HANDLER
  const handleSaveSettings = (e: SubmitEvent) => {
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
    toast.success($language === 'vi' ? 'Đã cập nhật cấu hình biểu cước & thuế suất.' : 'Financial charge settings & tax rates updated successfully.');
  };

  const accountsNavItems: NavItem[] = $derived([
    {
      id: 'bill-generation',
      label: $t.accountsNav.billGeneration,
      icon: Receipt,
      badge: '12.24%',
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'payment-updates',
      label: $t.accountsNav.paymentUpdates,
      icon: CreditCard,
      badge: $bills.filter((b) => b.status !== 'Paid').length,
    },
    {
      id: 'charge-settings',
      label: $t.accountsNav.chargeSettings,
      icon: Settings,
    },
    { id: 'settings', label: $t.accountsNav.settings, icon: Settings },
  ]);
</script>

<DashboardLayout
  activeTab={activeTab}
  onTabChange={(tab) => (activeTab = tab as AccountsTab)}
  navItems={accountsNavItems}
  roleBadgeTitle={$t.roles.accounts}
  pageTitle={accountsNavItems.find((n) => n.id === activeTab)?.label}
  primaryAction={{
    label: $t.actions.newInvoice,
    onClick: () => (activeTab = 'bill-generation'),
    icon: Plus,
  }}
>
  <div class="tab-content-animate space-y-6">
    <!-- TAB 1: BILL GENERATION -->
    {#if activeTab === 'bill-generation'}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Bill Generator Form -->
        <form
          onsubmit={handleGenerateBillSubmit}
          class="lg:col-span-2 space-y-6 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <!-- Account ID Input Section -->
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              {$language === 'vi' ? 'Mã tài khoản thuê bao 16 ký tự *' : '16-character Subscriber Account ID *'}
            </label>
            <div class="flex gap-2">
              <div class="relative flex-1">
                <Search class="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="T064-000000000001"
                  bind:value={billAccountId}
                  class="w-full pl-9 pr-4 py-2.5 text-base font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-widest text-slate-900 dark:text-white"
                />
              </div>
              <button
                type="button"
                onclick={() => handleSelectConnectionForBilling(billAccountId)}
                class="px-4 py-2.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
              >
                {$language === 'vi' ? 'Tải thông số' : 'Fetch Parameters'}
              </button>
            </div>

            <!-- Quick Account Selection -->
            <div class="flex flex-wrap items-center gap-2 pt-2 text-xs text-slate-500">
              <span>{$language === 'vi' ? 'Chọn nhanh tài khoản:' : 'Quick Select Account:'}</span>
              {#each $connections as c (c.accountId)}
                <button
                  type="button"
                  onclick={() => handleSelectConnectionForBilling(c.accountId)}
                  class="font-mono text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800/40"
                >
                  {c.accountId} ({c.customerName.split(' ')[0]})
                </button>
              {/each}
            </div>
          </div>

          <!-- Matched Subscriber Banner -->
          {#if matchedConnection}
            <div class="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span class="text-slate-500 block">{$language === 'vi' ? 'Tên thuê bao:' : 'Subscriber Name:'}</span>
                <strong class="text-slate-900 dark:text-white text-sm">{matchedConnection.customerName}</strong>
              </div>
              <div>
                <span class="text-slate-500 block">{$language === 'vi' ? 'Gói cước & Kết nối:' : 'Connection & Plan:'}</span>
                <strong class="text-slate-900 dark:text-white">{matchedConnection.planName} ({matchedConnection.connectionType})</strong>
              </div>
              <div>
                <span class="text-slate-500 block">{$language === 'vi' ? 'Địa chỉ lắp đặt:' : 'Installation Address:'}</span>
                <span class="text-slate-600 dark:text-slate-300 truncate block">{matchedConnection.installationAddress}</span>
              </div>
            </div>
          {:else}
            <div class="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-700 dark:text-amber-300">
              {$language === 'vi'
                ? 'Mã tài khoản hiện chưa có trong bộ nhớ. Bạn vẫn có thể nhập các số liệu thanh toán thủ công bên dưới.'
                : 'Account ID not currently bound in memory. You may still input manual billing figures below.'}
            </div>
          {/if}

          <!-- Billing Period Selector -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {$language === 'vi' ? 'Kỳ tính cước / Chu kỳ' : 'Billing Period / Cycle'}
            </label>
            <select
              bind:value={billingMonth}
              class="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
            >
              <option value="September 2026">
                {$language === 'vi' ? 'Tháng 9/2026 (Kỳ hiện tại)' : 'September 2026 (Current Cycle)'}
              </option>
              <option value="August 2026">{$language === 'vi' ? 'Tháng 8/2026' : 'August 2026'}</option>
              <option value="July 2026">{$language === 'vi' ? 'Tháng 7/2026' : 'July 2026'}</option>
            </select>
          </div>

          <!-- ITEMIZED LINE ITEMS CALCULATION -->
          <div class="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500">
              {$language === 'vi' ? 'Bảng chi tiết các khoản phí & Thuế dịch vụ' : 'Itemized Charges & Tax Breakdown Table'}
            </h3>

            <div class="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden text-sm">
              <table class="w-full text-left">
                <thead class="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th class="px-4 py-2.5">{$language === 'vi' ? 'Nội dung khoản thu' : 'Line Item Description'}</th>
                    <th class="px-4 py-2.5 text-right w-44">{$language === 'vi' ? 'Số tiền ($)' : 'Charge Amount ($)'}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  <!-- Line Item 1: Security Deposit -->
                  <tr>
                    <td class="px-4 py-3">
                      <div class="font-semibold text-slate-900 dark:text-white">
                        {$language === 'vi' ? 'Tiền đặt cọc thiết bị (Hoàn lại)' : 'Security Deposit (Refundable)'}
                      </div>
                      <div class="text-slate-500">
                        {$language === 'vi'
                          ? 'Tiền cọc thiết bị viễn thông và bảo đảm đường truyền (hoàn lại khi chấm dứt)'
                          : 'Required refundable deposit for telecom equipment & circuit bond'}
                      </div>
                    </td>
                    <td class="px-4 py-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        bind:value={customSecurityDeposit}
                        class="w-32 px-2.5 py-1.5 text-right font-mono tabular-nums font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white"
                      />
                    </td>
                  </tr>

                  <!-- Line Item 2: Monthly Rentals -->
                  <tr>
                    <td class="px-4 py-3">
                      <div class="font-semibold text-slate-900 dark:text-white">
                        {$language === 'vi' ? 'Cước thuê bao gói dịch vụ hàng tháng' : 'Monthly Plan Rental Charge'}
                      </div>
                      <div class="text-slate-500">
                        {$language === 'vi'
                          ? 'Phí dịch vụ định kỳ hàng tháng cho gói tốc độ/băng thông'
                          : 'Recurring monthly subscriber fee for unlimited/bandwidth tier'}
                      </div>
                    </td>
                    <td class="px-4 py-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        bind:value={customMonthlyRental}
                        class="w-32 px-2.5 py-1.5 text-right font-mono tabular-nums font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white"
                      />
                    </td>
                  </tr>

                  <!-- Line Item 3: Hourly / Metered Charges -->
                  <tr>
                    <td class="px-4 py-3">
                      <div class="font-semibold text-slate-900 dark:text-white">
                        {$language === 'vi' ? 'Cước đo theo giờ / Lưu lượng sử dụng' : 'Hourly / Usage Metered Charges'}
                      </div>
                      <div class="text-slate-500">
                        {$language === 'vi'
                          ? 'Thời gian truy cập quay số hoặc phút gọi thoại quốc tế'
                          : 'Metered dial-up access time or international voice talk minutes'}
                      </div>
                    </td>
                    <td class="px-4 py-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        bind:value={customHourlyCharges}
                        class="w-32 px-2.5 py-1.5 text-right font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white"
                      />
                    </td>
                  </tr>

                  <!-- Line Item 3b: Bulk / corporate scheme discount -->
                  <tr class="bg-emerald-50/50 dark:bg-emerald-950/30">
                    <td class="px-4 py-3">
                      <div class="font-semibold text-emerald-700 dark:text-emerald-300">
                        {$language === 'vi' ? 'Chiết khấu gói Doanh nghiệp / Số lượng lớn' : 'Bulk / Corporate Scheme Discount'}
                        {#if matchedOrder}
                          <span class="text-[10px] text-slate-500">
                            ({matchedOrder.bulkConnectionsCount} {$language === 'vi' ? 'kết nối' : 'connections'})
                          </span>
                          {#if matchedOrder.orderGroupId}
                            <span class="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-400 border border-violet-300 dark:border-violet-700/50">
                              📦 {matchedOrder.orderGroupIndex}/{matchedOrder.bulkConnectionsCount}
                            </span>
                          {/if}
                        {/if}
                      </div>
                      <div class="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 flex items-center gap-1.5">
                        <input
                          type="number" step="1" min="0" max="100"
                          value={discountPercent}
                          oninput={(e) => { discountPercent = parseFloat((e.currentTarget as HTMLInputElement).value) || 0; discountTouched = true; }}
                          class="w-16 px-2 py-1 text-right font-mono bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded"
                        />
                        <span>{$language === 'vi' ? '% của (tiền cọc + cước thuê)' : '% of (deposit + rental)'}</span>
                      </div>
                    </td>
                    <td class="px-4 py-3 text-right font-mono tabular-nums font-bold text-sm text-emerald-700 dark:text-emerald-400">−${discountAmount.toFixed(2)}</td>
                  </tr>

                  <!-- Line Item 4: Subtotal -->
                  <tr class="bg-slate-50/70 dark:bg-slate-950 font-semibold">
                    <td class="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                      {$language === 'vi' ? 'Tổng phụ (Cơ sở tính thuế)' : 'Subtotal (Taxable Base)'}
                    </td>
                    <td class="px-4 py-2.5 text-right font-mono tabular-nums text-sm text-slate-900 dark:text-white">${subtotal.toFixed(2)}</td>
                  </tr>

                  <!-- Line Item 5: AUTOMATED ROW FOR SERVICE TAX (12.24%) -->
                  <tr class="bg-blue-50/50 dark:bg-blue-950/40">
                    <td class="px-4 py-3">
                      <div class="flex items-center space-x-2">
                        <span class="font-bold text-blue-700 dark:text-blue-300">
                          {$language === 'vi' ? `Thuế dịch vụ (${$settings.serviceTaxRate}%)` : `Service Tax (${$settings.serviceTaxRate}%)`}
                        </span>
                        <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-600 text-white font-semibold uppercase">
                          {$language === 'vi' ? 'Quy định tự động' : 'Automated Statutory'}
                        </span>
                      </div>
                      <div class="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                        {$language === 'vi'
                          ? `Tính tự động: $${subtotal.toFixed(2)} × ${$settings.serviceTaxRate}%`
                          : `Automated computation: $${subtotal.toFixed(2)} × ${$settings.serviceTaxRate}%`}
                      </div>
                    </td>
                    <td class="px-4 py-3 text-right font-mono tabular-nums font-bold text-sm text-blue-700 dark:text-blue-400">+${serviceTaxAmount.toFixed(2)}</td>
                  </tr>

                  <!-- Grand Total Row -->
                  <tr class="bg-slate-900 text-white font-bold text-sm">
                    <td class="px-4 py-3 uppercase tracking-wider text-xs">
                      {$language === 'vi' ? 'Tổng cộng thực thanh toán ($)' : 'Grand Total Net Payable ($)'}
                    </td>
                    <td class="px-4 py-3 text-right font-mono text-base tabular-nums text-emerald-400">${grandTotal.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Action Button -->
          <div class="flex justify-end pt-2">
            <button
              type="submit"
              class="px-6 py-2.5 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition shadow-md flex items-center space-x-2"
            >
              <Receipt class="h-4 w-4" />
              <span>{$language === 'vi' ? 'Lập hóa đơn khách hàng' : 'Generate Customer Bill'}</span>
            </button>
          </div>
        </form>

        <!-- Financial Ledger Quick View -->
        <div class="space-y-4">
          <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
            <h3 class="font-semibold text-sm uppercase tracking-wider text-slate-900 dark:text-white flex items-center space-x-2">
              <Building class="h-4 w-4 text-blue-500" />
              <span>{$language === 'vi' ? 'Tuân thủ thuế quy định' : 'Statutory Tax Compliance'}</span>
            </h3>

            <p class="text-xs text-slate-500 leading-relaxed">
              {$language === 'vi'
                ? `Theo quy định hệ thống dịch vụ viễn thông, mọi thuê bao phát hành đều áp dụng thuế suất dịch vụ bắt buộc ${$settings.serviceTaxRate}% trên tiền đặt cọc và cước thuê thiết bị.`
                : `Under telecom marketing system regulations, all issued subscriptions apply a statutory ${$settings.serviceTaxRate}% Service Tax across equipment deposit and rental line items.`}
            </p>

            <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs font-mono">
              <div class="flex justify-between">
                <span class="text-slate-500">{$language === 'vi' ? 'Danh mục thuế:' : 'Tax Category:'}</span>
                <span class="text-slate-900 dark:text-white">{$language === 'vi' ? 'Dịch vụ viễn thông' : 'Telecommunication Services'}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">{$language === 'vi' ? 'Mã số thuế:' : 'Tax Identifier:'}</span>
                <span class="text-slate-900 dark:text-white">ST-NEX-FED-1224</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">{$language === 'vi' ? 'Thuế suất dịch vụ:' : 'Service Tax Rate:'}</span>
                <span class="text-blue-600 font-bold">{$settings.serviceTaxRate}%</span>
              </div>
            </div>
          </div>

          <!-- Recent Bills Created -->
          <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-xs uppercase tracking-wider text-slate-500">
                {$language === 'vi' ? 'Hóa đơn vừa phát hành' : 'Recent Generated Invoices'}
              </h3>
              <button
                onclick={() => (activeTab = 'payment-updates')}
                class="text-xs text-blue-600 hover:underline"
              >
                {$language === 'vi' ? 'Thu tiền →' : 'Payments →'}
              </button>
            </div>

            <div class="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {#each $bills.slice(0, 3) as b (b.id)}
                <div class="py-2.5 flex items-center justify-between">
                  <div>
                    <div class="font-mono font-bold text-slate-900 dark:text-white">{b.invoiceNumber}</div>
                    <div class="text-slate-500 truncate max-w-[140px]">{b.customerName}</div>
                  </div>
                  <div class="text-right">
                    <div class="font-mono font-bold text-slate-900 dark:text-white tabular-nums">${b.totalAmount.toFixed(2)}</div>
                    <span class="text-[10px] px-1.5 py-0.5 rounded font-semibold {b.status === 'Paid'
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'}">
                      {$language === 'vi' ? (b.status === 'Paid' ? 'Đã thanh toán' : 'Chờ thanh toán') : b.status}
                    </span>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    {/if}
    <!-- TAB 2: PAYMENT UPDATES -->
    {#if activeTab === 'payment-updates'}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Payment Update Entry Form -->
        <form
          onsubmit={handlePaymentUpdateSubmit}
          class="lg:col-span-2 space-y-6 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white">
              {$language === 'vi' ? 'Cập nhật trạng thái thanh toán & Đối soát số dư' : 'Update Payment Status & Reconcile Balance'}
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">
              {$language === 'vi'
                ? 'Ghi nhận tiền mặt, séc hoặc thanh toán điện tử đã thu vào hóa đơn công nợ.'
                : 'Record collected cash, cheque, or electronic payments against outstanding bills.'}
            </p>
          </div>

          <!-- Select Invoice to Update -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {$language === 'vi' ? 'Chọn hóa đơn cần thanh toán *' : 'Select Generated Invoice to Settle *'}
            </label>
            <select
              bind:value={selectedInvoiceNumber}
              class="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
            >
              {#each $bills as b (b.id)}
                <option value={b.invoiceNumber}>
                  {b.invoiceNumber} — {b.customerName} ({$language === 'vi' ? 'Tổng:' : 'Total:'} ${b.totalAmount.toFixed(2)}, {$language === 'vi' ? 'Còn nợ:' : 'Due:'} ${b.dueAmount.toFixed(2)}) [{$language === 'vi' ? (b.status === 'Paid' ? 'Đã thanh toán' : 'Chờ thanh toán') : b.status}]
                </option>
              {/each}
            </select>
          </div>

          <!-- Bill Financial Status Overview -->
          {#if activeBillToPay}
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <div class="flex flex-col sm:flex-row justify-between border-b border-slate-200 dark:border-slate-800 pb-2 text-xs">
                <div>
                  <span class="text-slate-500">{$language === 'vi' ? 'Khách hàng:' : 'Customer:'} </span>
                  <strong class="text-slate-900 dark:text-white">{activeBillToPay.customerName}</strong>
                </div>
                <div>
                  <span class="text-slate-500">{$language === 'vi' ? 'Mã tài khoản:' : 'Account ID:'} </span>
                  <span class="font-mono text-blue-600 dark:text-blue-400 font-bold">{activeBillToPay.accountId}</span>
                </div>
                <div>
                  <span class="text-slate-500">{$language === 'vi' ? 'Trạng thái:' : 'Status:'} </span>
                  <span class="font-semibold px-2 py-0.5 rounded text-[11px] {activeBillToPay.status === 'Paid'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'}">
                    {$language === 'vi' ? (activeBillToPay.status === 'Paid' ? 'Đã thanh toán' : 'Chờ thanh toán') : activeBillToPay.status}
                  </span>
                </div>
              </div>

              <!-- 3 Metric Cards for Amount Paid & Due Amount -->
              <div class="grid grid-cols-3 gap-3 text-center">
                <div class="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div class="text-[11px] text-slate-500 uppercase">{$language === 'vi' ? 'Tổng hóa đơn' : 'Total Bill'}</div>
                  <div class="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">${activeBillToPay.totalAmount.toFixed(2)}</div>
                </div>

                <div class="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div class="text-[11px] text-slate-500 uppercase">{$language === 'vi' ? 'Đã thanh toán' : 'Currently Paid'}</div>
                  <div class="text-base font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">${activeBillToPay.amountPaid.toFixed(2)}</div>
                </div>

                <div class="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div class="text-[11px] text-slate-500 uppercase">{$language === 'vi' ? 'Công nợ còn lại' : 'Current Due'}</div>
                  <div class="text-base font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400 mt-0.5">${activeBillToPay.dueAmount.toFixed(2)}</div>
                </div>
              </div>
            </div>
          {/if}

          <!-- PAYMENT UPDATE FORM FIELDS -->
          <div class="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Amount Paid Field -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {$language === 'vi' ? 'Số tiền thanh toán mới ($) *' : 'New Payment Amount ($) *'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={paymentAmountInput || ''}
                  oninput={(e) => (paymentAmountInput = parseFloat((e.currentTarget as HTMLInputElement).value) || 0)}
                  class="w-full px-3 py-2 text-base font-mono tabular-nums font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
                <div class="flex gap-2 mt-1.5">
                  <button
                    type="button"
                    onclick={() => (paymentAmountInput = activeBillToPay?.dueAmount || 0)}
                    class="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    {$language === 'vi' ? `Thanh toán hết nợ ($${(activeBillToPay?.dueAmount ?? 0).toFixed(2)})` : `Pay Full Due ($${(activeBillToPay?.dueAmount ?? 0).toFixed(2)})`}
                  </button>
                </div>
              </div>

              <!-- Projected Remaining Due Amount -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {$language === 'vi' ? 'Dự tính nợ còn lại ($)' : 'Calculated Remaining Due Amount ($)'}
                </label>
                <div class="w-full px-3 py-2 text-base font-mono tabular-nums font-bold bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-rose-600 dark:text-rose-400">
                  ${projectedDueAmount.toFixed(2)}
                </div>
                <span class="text-[10px] text-slate-400 block mt-1">
                  {$language === 'vi' ? 'Công thức: Tổng bill - (Đã trả trước + Khoản trả mới)' : 'Formula: Total Bill - (Prior Paid + New Payment)'}
                </span>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {$language === 'vi' ? 'Hình thức thanh toán' : 'Payment Mode'}
                </label>
                <select
                  bind:value={paymentMode}
                  class="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="Credit/Debit Card">{$language === 'vi' ? 'Thẻ tín dụng / Ghi nợ (POS)' : 'Credit/Debit Card (POS)'}</option>
                  <option value="Cash">{$language === 'vi' ? 'Tiền mặt (Tại quầy)' : 'Cash (Counter Tender)'}</option>
                  <option value="Cheque">{$language === 'vi' ? 'Séc ngân hàng' : 'Cheque / Demand Draft'}</option>
                  <option value="Bank Transfer/NEFT">{$language === 'vi' ? 'Chuyển khoản / NEFT / ACH' : 'Bank Transfer / NEFT / ACH'}</option>
                  <option value="UPI/Digital Wallet">{$language === 'vi' ? 'Ví điện tử / UPI' : 'UPI / Digital Wallet'}</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {$language === 'vi' ? 'Mã tham chiếu GD / Số séc' : 'Transaction / Cheque Ref #'}
                </label>
                <input
                  type="text"
                  placeholder={$language === 'vi' ? 'VD: CHQ-991204 hoặc TXN-VISA-8821' : 'e.g. CHQ-991204 or TXN-VISA-8821'}
                  bind:value={paymentRefNumber}
                  class="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {$language === 'vi' ? 'Thu ngân / Kế toán phụ trách' : 'Recording Cashier / Accountant Name'}
              </label>
              <input
                type="text"
                required
                bind:value={cashierName}
                class="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <!-- Submit Update -->
          <div class="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              class="px-6 py-2.5 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition shadow-md flex items-center space-x-2"
            >
              <CheckCircle2 class="h-4 w-4" />
              <span>{$language === 'vi' ? 'Cập nhật thanh toán & Đóng công nợ' : 'Update Payment & Close Balance'}</span>
            </button>
          </div>
        </form>

        <!-- Payment History Log for Active Bill -->
        <div class="space-y-4">
          <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
            <h3 class="font-semibold text-sm uppercase tracking-wider text-slate-900 dark:text-white">
              {$language === 'vi' ? 'Lịch sử thanh toán' : 'Payment History Log'}
            </h3>

            {#if activeBillToPay && activeBillToPay.paymentHistory.length > 0}
              <div class="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {#each activeBillToPay.paymentHistory as p (p.paymentId)}
                  <div class="py-2.5 space-y-1">
                    <div class="flex justify-between font-semibold">
                      <span class="text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">+${p.amountPaid.toFixed(2)}</span>
                      <span class="text-slate-400">{p.paymentDate}</span>
                    </div>
                    <div class="text-slate-500">
                      {p.paymentMode} • {$language === 'vi' ? 'Mã:' : 'Ref:'} {p.referenceNumber}
                    </div>
                    <div class="text-[10px] text-slate-400">{$language === 'vi' ? 'Ghi nhận bởi:' : 'Recorded by:'} {p.recordedBy}</div>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="text-xs text-slate-400 py-6 text-center">
                {$language === 'vi' ? 'Chưa có lịch sử thanh toán cho hóa đơn này.' : 'No payment history recorded for this invoice yet.'}
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/if}

    <!-- TAB 3: CHARGE SETTINGS -->
    {#if activeTab === 'charge-settings'}
      <div class="max-w-2xl bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div>
          <h3 class="text-lg font-bold text-slate-900 dark:text-white">
            {$language === 'vi' ? 'Chính sách biểu cước & Cài đặt thuế suất' : 'Tariff Policy & Statutory Tax Settings'}
          </h3>
          <p class="text-xs text-slate-500 mt-0.5">
            {$language === 'vi'
              ? 'Thiết lập các thông số tiêu chuẩn áp dụng tự động vào công thức phát hành hóa đơn.'
              : 'Set baseline parameters applied globally across bill generation formulas.'}
          </p>
        </div>

        <form onsubmit={handleSaveSettings} class="space-y-4 text-sm">
          <!-- Service Tax % -->
          <div class="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 space-y-2">
            <div class="flex items-center justify-between">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-200">
                  {$language === 'vi' ? 'Thuế suất dịch vụ chuẩn (%) *' : 'Standard Service Tax Rate (%) *'}
                </label>
                <p class="text-[11px] text-slate-500">
                  {$language === 'vi' ? 'Quy định pháp lý theo đặc tả hệ thống: 12.24%' : 'Statutory requirement as specified in system specifications: 12.24%'}
                </p>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                required
                bind:value={taxRateSetting}
                class="w-24 px-3 py-1.5 text-right font-mono tabular-nums font-bold bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-blue-600 dark:text-blue-400"
              />
            </div>
          </div>

          <!-- Late Payment Fee % -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {$language === 'vi' ? 'Phí phạt quá hạn thanh toán (%)' : 'Late Payment Surcharge (%)'}
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              bind:value={lateFeeSetting}
              class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono tabular-nums text-slate-900 dark:text-white"
            />
          </div>

          <!-- Default Security Deposits -->
          <div class="space-y-3 pt-2">
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              {$language === 'vi' ? 'Định mức cọc bảo đảm mặc định ($)' : 'Default Security Deposit Benchmarks ($)'}
            </label>
            <div class="grid grid-cols-3 gap-3">
              <div>
                <span class="text-xs text-slate-600 dark:text-slate-400 block mb-1">Broadband ($)</span>
                <input
                  type="number"
                  step="0.01"
                  bind:value={broadbandDeposit}
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono tabular-nums text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <span class="text-xs text-slate-600 dark:text-slate-400 block mb-1">Dial-Up ($)</span>
                <input
                  type="number"
                  step="0.01"
                  bind:value={dialUpDeposit}
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono tabular-nums text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <span class="text-xs text-slate-600 dark:text-slate-400 block mb-1">Landline ($)</span>
                <input
                  type="number"
                  step="0.01"
                  bind:value={landlineDeposit}
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono tabular-nums text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div class="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              class="px-6 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition shadow"
            >
              {$language === 'vi' ? 'Lưu cấu hình biểu cước' : 'Save Charge Settings'}
            </button>
          </div>
        </form>
      </div>
    {/if}
  </div>

  <!-- GENERATED INVOICE PRINTABLE PREVIEW MODAL -->
  {#if generatedInvoiceModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4">
      <div class="w-full max-w-xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-6">
        <!-- Invoice Header -->
        <div class="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div class="text-xs font-bold text-blue-600 uppercase tracking-widest">Nexus Service Marketing System</div>
            <h2 class="text-xl font-extrabold text-slate-900 dark:text-white">
              {$language === 'vi' ? 'HÓA ĐƠN THUẾ DỊCH VỤ' : 'TAX INVOICE STATEMENT'}
            </h2>
            <p class="text-xs text-slate-500">
              {$language === 'vi' ? 'Biên lai cước chính thức & Chi tiết thuế GTGT' : 'Official Billing Receipt & Tax Breakdown'}
            </p>
          </div>
          <button
            onclick={() => (generatedInvoiceModal = null)}
            class="text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <!-- Invoice Details -->
        <div class="grid grid-cols-2 gap-4 text-xs">
          <div class="space-y-1">
            <div class="text-slate-400">{$language === 'vi' ? 'Khách hàng:' : 'Billed To:'}</div>
            <div class="font-bold text-sm text-slate-900 dark:text-white">{generatedInvoiceModal.customerName}</div>
            <div class="font-mono text-blue-600 dark:text-blue-400">
              {$language === 'vi' ? 'Mã TK:' : 'Account ID:'} {generatedInvoiceModal.accountId}
            </div>
          </div>

          <div class="text-right space-y-1">
            <div class="font-mono font-bold text-slate-900 dark:text-white">{generatedInvoiceModal.invoiceNumber}</div>
            <div class="text-slate-500">{$language === 'vi' ? 'Ngày lập:' : 'Billing Date:'} {generatedInvoiceModal.billingDate}</div>
            <div class="text-slate-500">{$language === 'vi' ? 'Hạn nộp:' : 'Due Date:'} {generatedInvoiceModal.dueDate}</div>
          </div>
        </div>

        <!-- Line Items Breakdown -->
        <div class="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs">
          <table class="w-full text-left">
            <thead class="bg-slate-50 dark:bg-slate-800/60 uppercase font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th class="px-3 py-2">{$language === 'vi' ? 'Nội dung' : 'Description'}</th>
                <th class="px-3 py-2 text-right">{$language === 'vi' ? 'Số tiền ($)' : 'Amount ($)'}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr>
                <td class="px-3 py-2">{$language === 'vi' ? 'Tiền đặt cọc (Hoàn lại)' : 'Security Deposit (Refundable)'}</td>
                <td class="px-3 py-2 text-right font-mono tabular-nums">${generatedInvoiceModal.securityDeposit.toFixed(2)}</td>
              </tr>
              <tr>
                <td class="px-3 py-2">{$language === 'vi' ? 'Cước thuê bao gói' : 'Monthly Rental'} — {generatedInvoiceModal.planName}</td>
                <td class="px-3 py-2 text-right font-mono tabular-nums">${generatedInvoiceModal.monthlyRental.toFixed(2)}</td>
              </tr>
              {#if generatedInvoiceModal.hourlyCharges > 0}
                <tr>
                  <td class="px-3 py-2">{$language === 'vi' ? 'Cước theo giờ / Cước sử dụng' : 'Hourly / Usage Charges'}</td>
                  <td class="px-3 py-2 text-right font-mono tabular-nums">${generatedInvoiceModal.hourlyCharges.toFixed(2)}</td>
                </tr>
              {/if}
              {#if generatedInvoiceModal.discountAmount > 0}
                <tr class="text-emerald-700 dark:text-emerald-400">
                  <td class="px-3 py-2">{$language === 'vi' ? `Chiết khấu số lượng / Doanh nghiệp (${generatedInvoiceModal.discountPercent}%)` : `Bulk / Corporate Scheme Discount (${generatedInvoiceModal.discountPercent}%)`}</td>
                  <td class="px-3 py-2 text-right font-mono tabular-nums font-bold">−${generatedInvoiceModal.discountAmount.toFixed(2)}</td>
                </tr>
              {/if}
              <tr class="bg-slate-50 dark:bg-slate-950 font-semibold">
                <td class="px-3 py-2">{$language === 'vi' ? 'Tổng tiền trước thuế' : 'Subtotal'}</td>
                <td class="px-3 py-2 text-right font-mono tabular-nums">${generatedInvoiceModal.subtotal.toFixed(2)}</td>
              </tr>
              <tr class="bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-medium">
                <td class="px-3 py-2">{$language === 'vi' ? `Thuế dịch vụ (${generatedInvoiceModal.serviceTaxRate}%)` : `Service Tax (${generatedInvoiceModal.serviceTaxRate}%)`}</td>
                <td class="px-3 py-2 text-right font-mono tabular-nums font-bold">+${generatedInvoiceModal.serviceTaxAmount.toFixed(2)}</td>
              </tr>
              <tr class="bg-slate-900 text-white font-bold text-sm">
                <td class="px-3 py-2.5">{$language === 'vi' ? 'Tổng cộng phải trả ($)' : 'Grand Total Due ($)'}</td>
                <td class="px-3 py-2.5 text-right font-mono tabular-nums text-emerald-400">${generatedInvoiceModal.totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Actions -->
        <div class="flex justify-between items-center pt-2">
          <span class="text-[11px] text-slate-400">
            {$language === 'vi' ? 'Hóa đơn được phát hành tự động bởi Nexus Core Billing Engine' : 'Statutory invoice generated by Nexus Core Billing Engine'}
          </span>
          <div class="flex gap-2">
            <button
              onclick={() => window.print()}
              class="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-1.5"
            >
              <Printer class="h-3.5 w-3.5" />
              <span>{$language === 'vi' ? 'In hóa đơn' : 'Print Invoice'}</span>
            </button>
            <button
              onclick={() => (generatedInvoiceModal = null)}
              class="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow"
            >
              {$language === 'vi' ? 'Hoàn tất' : 'Done'}
            </button>
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- SETTINGS TAB -->
    {#if activeTab === 'settings'}
      <SettingsView />
    {/if}

    <!-- PROFILE TAB -->
    {#if activeTab === 'profile'}
      <ProfileView />
    {/if}
</DashboardLayout>


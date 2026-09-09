<script lang="ts">
  // Subscriber portal: everything is keyed off the Account ID used to sign in.
  import { authStore } from '../context/AuthContext';
  import { nexusStore } from '../context/NexusContext';
  import { languageStore } from '../context/LanguageContext';
  import DashboardLayout from '../components/layout/DashboardLayout.svelte';
  import type { NavItem } from '../components/layout/DashboardLayout.svelte';
  import { User, Activity, Settings, CreditCard, LayoutDashboard, Store, MapPin, KeyRound, MessageSquare, Star } from 'lucide-svelte';
  import type { FeedbackCategory } from '../types/nexus';
  import { toast } from 'svelte-sonner';

  const { currentUser } = authStore;
  const { connections, orders, bills, retailShops, feedbacks, addFeedback } = nexusStore;
  const { t, language } = languageStore;

  let activeTab = $state('overview');

  // Feedback form (functional requirement #2)
  let fbRating = $state(5);
  let fbCategory = $state<FeedbackCategory>('Service Quality');
  let fbMessage = $state('');

  const accountId = $derived($currentUser?.accountId ?? '');
  const connection = $derived($connections.find((c) => c.accountId === accountId) ?? null);
  const order = $derived($orders.find((o) => o.assignedAccountId === accountId) ?? null);
  const shop = $derived($retailShops.find((s) => s.shopCode === order?.retailOutletCode) ?? null);
  const myBills = $derived($bills.filter((b) => b.accountId === accountId));
  const latestBill = $derived(myBills[0] ?? null);

  const myFeedbacks = $derived(
    $feedbacks.filter((f) => (accountId && f.accountId === accountId) || (order && f.orderId === order.id))
  );

  const submitFeedback = (e: SubmitEvent) => {
    e.preventDefault();
    if (!fbMessage.trim()) {
      toast.error($language === 'vi' ? 'Vui lòng nhập nội dung phản hồi.' : 'Please enter your feedback.');
      return;
    }
    addFeedback({
      accountId: accountId || undefined,
      orderId: order?.id,
      customerName: $currentUser?.name || 'Customer',
      rating: fbRating,
      category: fbCategory,
      message: fbMessage.trim(),
    });
    fbMessage = '';
    toast.success($language === 'vi' ? 'Đã gửi phản hồi. Cảm ơn bạn!' : 'Feedback submitted. Thank you!');
  };

  // The connection is live once technical provisions it; until then the order
  // status is what the customer tracks.
  const serviceStatus = $derived.by(() => {
    if (connection) {
      const map: Record<string, { vi: string; en: string; tone: string }> = {
        'Active': { vi: '● Đang hoạt động', en: '● Online & Provisioned', tone: 'text-emerald-500' },
        'Temporarily Inactive': { vi: '● Tạm ngưng dịch vụ', en: '● Temporarily Suspended', tone: 'text-amber-500' },
        'Permanently Inactive': { vi: '● Đã ngừng vĩnh viễn', en: '● Permanently Closed', tone: 'text-rose-500' },
      };
      return map[connection.status] ?? map['Active'];
    }
    const map: Record<string, { vi: string; en: string; tone: string }> = {
      'Pending': { vi: '● Chờ khảo sát khả thi', en: '● Awaiting feasibility survey', tone: 'text-amber-500' },
      'Feasible': { vi: '● Khả thi, chờ lắp đặt', en: '● Feasible, awaiting installation', tone: 'text-sky-500' },
      'Not Feasible': { vi: '● Chưa thể triển khai tại địa chỉ này', en: '● Not feasible at this address', tone: 'text-rose-500' },
      'Connection Provided': { vi: '● Đã cấp kết nối', en: '● Connection provided', tone: 'text-emerald-500' },
    };
    return map[order?.status ?? 'Pending'] ?? map['Pending'];
  });

  const navItems: NavItem[] = $derived([
    { id: 'overview', label: $t.userNav.overview, icon: LayoutDashboard },
    { id: 'billing', label: $t.userNav.billing, icon: CreditCard },
    { id: 'feedback', label: $language === 'vi' ? 'Phản hồi' : 'Feedback', icon: MessageSquare, badge: myFeedbacks.length || undefined },
    { id: 'settings', label: $t.userNav.settings, icon: Settings },
  ]);
</script>

<DashboardLayout
  activeTab={activeTab}
  onTabChange={(id) => (activeTab = id)}
  navItems={navItems}
  pageTitle={activeTab === 'overview' ? $t.userNav.overview : navItems.find((n) => n.id === activeTab)?.label}
  roleBadgeTitle={$t.roles.user}
>
  {#if activeTab === 'overview'}
    <div class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Account ID Card -->
        <div class="p-6 bg-white dark:bg-[#152434] border border-[#CCE4F7] dark:border-[#253D56] rounded-xl shadow-sm">
          <div class="flex items-center space-x-3 text-purple-600 dark:text-purple-400 mb-2">
            <User class="h-5 w-5" />
            <h3 class="font-semibold text-base">{$language === 'vi' ? 'Thông tin tài khoản' : 'Account Profile'}</h3>
          </div>
          <p class="text-sm font-bold text-[#0F1D2B] dark:text-white">
            {$currentUser?.name || 'Customer'}
          </p>
          <p class="text-xs text-slate-500 mt-1 font-mono flex items-center space-x-1">
            <KeyRound class="h-3 w-3 shrink-0" />
            <span>{accountId || '—'}</span>
          </p>
          {#if order}
            <p class="text-[11px] text-slate-500 mt-1 font-mono">
              {$language === 'vi' ? 'Mã đơn' : 'Order'}: {order.id}
            </p>
          {/if}
        </div>

        <!-- Subscription Card -->
        <div class="p-6 bg-white dark:bg-[#152434] border border-[#CCE4F7] dark:border-[#253D56] rounded-xl shadow-sm">
          <div class="flex items-center space-x-3 text-sky-600 dark:text-sky-400 mb-2">
            <Activity class="h-5 w-5" />
            <h3 class="font-semibold text-base">{$language === 'vi' ? 'Dịch vụ đang dùng' : 'Active Subscription'}</h3>
          </div>
          <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {connection?.planName || order?.planName || ($language === 'vi' ? 'Chưa có gói cước' : 'No plan yet')}
          </p>
          <p class="text-xs mt-1 font-semibold {serviceStatus.tone}">
            {$language === 'vi' ? serviceStatus.vi : serviceStatus.en}
          </p>
        </div>

        <!-- Billing Card -->
        <div class="p-6 bg-white dark:bg-[#152434] border border-[#CCE4F7] dark:border-[#253D56] rounded-xl shadow-sm">
          <div class="flex items-center space-x-3 text-amber-600 dark:text-amber-400 mb-2">
            <CreditCard class="h-5 w-5" />
            <h3 class="font-semibold text-base">{$language === 'vi' ? 'Hóa đơn gần nhất' : 'Latest Invoice'}</h3>
          </div>
          {#if latestBill}
            <p class="text-sm font-bold text-slate-700 dark:text-slate-200">
              ${latestBill.totalAmount.toFixed(2)}
            </p>
            <p class="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
              {$language === 'vi' ? 'Hạn chót' : 'Due Date'}: {latestBill.dueDate}
            </p>
          {:else}
            <p class="text-sm font-bold text-slate-700 dark:text-slate-200">
              {connection ? `$${connection.monthlyRental.toFixed(2)}` : '—'}
            </p>
            <p class="text-xs text-slate-500 mt-1">
              {$language === 'vi' ? 'Chưa phát sinh hóa đơn.' : 'No invoice issued yet.'}
            </p>
          {/if}
        </div>

        <!-- Serving Branch Card -->
        <div class="p-6 bg-white dark:bg-[#152434] border border-[#CCE4F7] dark:border-[#253D56] rounded-xl shadow-sm">
          <div class="flex items-center space-x-3 text-slate-600 dark:text-slate-400 mb-2">
            <Store class="h-5 w-5" />
            <h3 class="font-semibold text-base">{$language === 'vi' ? 'Chi nhánh phục vụ' : 'Serving Branch'}</h3>
          </div>
          {#if shop}
            <p class="text-sm font-bold text-slate-700 dark:text-slate-200">{shop.name}</p>
            <p class="text-xs text-slate-500 mt-1">{shop.shopCode} · {shop.phone}</p>
          {:else}
            <p class="text-xs text-slate-600 dark:text-slate-300">
              {$language === 'vi' ? 'Hotline hỗ trợ 24/7: 1900 6868' : '24/7 support hotline: 1900 6868'}
            </p>
          {/if}
        </div>
      </div>

      <!-- Connection / installation details -->
      <div class="p-6 bg-white dark:bg-[#152434] border border-[#CCE4F7] dark:border-[#253D56] rounded-xl shadow-sm">
        <h3 class="font-bold text-base text-[#0F1D2B] dark:text-white mb-4 flex items-center space-x-2">
          <MapPin class="h-4 w-4 text-sky-600 dark:text-sky-400" />
          <span>{$language === 'vi' ? 'Chi tiết thuê bao' : 'Subscription Details'}</span>
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <div class="text-[#537292] dark:text-[#8DB0D4]">{$language === 'vi' ? 'Địa chỉ lắp đặt' : 'Installation address'}</div>
            <div class="font-semibold text-[#0F1D2B] dark:text-white mt-0.5">
              {connection?.installationAddress || order?.installationAddress || '—'}
            </div>
          </div>
          <div>
            <div class="text-[#537292] dark:text-[#8DB0D4]">{$language === 'vi' ? 'Loại kết nối' : 'Connection type'}</div>
            <div class="font-semibold text-[#0F1D2B] dark:text-white mt-0.5">
              {connection?.connectionType || order?.connectionType || '—'}
            </div>
          </div>
          <div>
            <div class="text-[#537292] dark:text-[#8DB0D4]">{$language === 'vi' ? 'Cước hàng tháng' : 'Monthly rental'}</div>
            <div class="font-semibold text-[#0F1D2B] dark:text-white mt-0.5">
              {connection ? `$${connection.monthlyRental.toFixed(2)}` : '—'}
            </div>
          </div>
          <div>
            <div class="text-[#537292] dark:text-[#8DB0D4]">{$language === 'vi' ? 'Thiết bị đầu cuối' : 'CPE device'}</div>
            <div class="font-semibold text-[#0F1D2B] dark:text-white mt-0.5">
              {connection?.assignedDeviceModel || ($language === 'vi' ? 'Chưa lắp đặt' : 'Not installed yet')}
            </div>
          </div>
          <div>
            <div class="text-[#537292] dark:text-[#8DB0D4]">{$language === 'vi' ? 'Địa chỉ IP' : 'IP address'}</div>
            <div class="font-mono font-semibold text-[#0F1D2B] dark:text-white mt-0.5">
              {connection?.ipAddress || '—'}
            </div>
          </div>
          <div>
            <div class="text-[#537292] dark:text-[#8DB0D4]">{$language === 'vi' ? 'Ngày lắp đặt' : 'Installed date'}</div>
            <div class="font-semibold text-[#0F1D2B] dark:text-white mt-0.5">
              {connection?.installedDate || ($language === 'vi' ? 'Đang chờ xử lý' : 'Pending')}
            </div>
          </div>
        </div>
      </div>
    </div>
  {:else if activeTab === 'billing'}
    <div class="rounded-xl bg-white dark:bg-[#152434] border border-[#CCE4F7] dark:border-[#253D56] shadow-sm overflow-hidden">
      {#if myBills.length > 0}
        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead class="bg-[#EDF6FF] dark:bg-[#101C29] text-[#305070] dark:text-slate-300 uppercase tracking-wider">
              <tr>
                <th class="text-left font-semibold px-4 py-3">{$language === 'vi' ? 'Số hóa đơn' : 'Invoice'}</th>
                <th class="text-left font-semibold px-4 py-3">{$language === 'vi' ? 'Kỳ cước' : 'Billing month'}</th>
                <th class="text-right font-semibold px-4 py-3">{$language === 'vi' ? 'Tổng tiền' : 'Total'}</th>
                <th class="text-right font-semibold px-4 py-3">{$language === 'vi' ? 'Còn nợ' : 'Due'}</th>
                <th class="text-left font-semibold px-4 py-3">{$language === 'vi' ? 'Hạn thanh toán' : 'Due date'}</th>
                <th class="text-left font-semibold px-4 py-3">{$language === 'vi' ? 'Trạng thái' : 'Status'}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#CCE4F7] dark:divide-[#253D56]">
              {#each myBills as bill (bill.id)}
                <tr class="text-[#1B2D40] dark:text-[#E0F1FF]">
                  <td class="px-4 py-3 font-mono">{bill.invoiceNumber}</td>
                  <td class="px-4 py-3">{bill.billingMonth}</td>
                  <td class="px-4 py-3 text-right font-semibold">${bill.totalAmount.toFixed(2)}</td>
                  <td class="px-4 py-3 text-right font-semibold">${bill.dueAmount.toFixed(2)}</td>
                  <td class="px-4 py-3">{bill.dueDate}</td>
                  <td class="px-4 py-3">
                    <span class="px-2 py-0.5 rounded-full text-[11px] font-bold {bill.status === 'Paid'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : bill.status === 'Partially Paid'
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'}">
                      {bill.status}
                    </span>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <div class="p-8 text-center">
          <CreditCard class="h-12 w-12 mx-auto text-sky-600 dark:text-sky-400 mb-4" />
          <h3 class="text-lg font-bold text-[#0F1D2B] dark:text-white mb-2">
            {$language === 'vi' ? 'Lịch sử hóa đơn & cước phí' : 'Billing & Payment History'}
          </h3>
          <p class="text-[#537292] dark:text-[#8DB0D4] max-w-md mx-auto text-xs">
            {$language === 'vi'
              ? 'Chưa có hóa đơn nào cho mã tài khoản này. Hóa đơn đầu tiên được phát hành sau khi kết nối được kích hoạt.'
              : 'No invoices for this Account ID yet. The first bill is issued once the connection is activated.'}
          </p>
        </div>
      {/if}
    </div>
  {:else if activeTab === 'feedback'}
    <div class="space-y-6">
      <form onsubmit={submitFeedback} class="rounded-xl bg-white dark:bg-[#152434] border border-[#CCE4F7] dark:border-[#253D56] shadow-sm p-6 space-y-4">
        <h3 class="font-bold text-base text-[#0F1D2B] dark:text-white flex items-center space-x-2">
          <MessageSquare class="h-4 w-4 text-sky-600 dark:text-sky-400" />
          <span>{$language === 'vi' ? 'Gửi phản hồi về dịch vụ' : 'Send service feedback'}</span>
        </h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div class="text-xs font-semibold text-[#305070] dark:text-slate-300 uppercase tracking-wider mb-1.5">
              {$language === 'vi' ? 'Đánh giá' : 'Rating'}
            </div>
            <div class="flex items-center space-x-1">
              {#each [1, 2, 3, 4, 5] as n (n)}
                <button type="button" onclick={() => (fbRating = n)} class="p-1" aria-label={`${n} star`}>
                  <Star class="h-6 w-6 {n <= fbRating ? 'text-amber-500 fill-amber-500' : 'text-slate-300 dark:text-slate-600'}" />
                </button>
              {/each}
            </div>
          </div>
          <div>
            <label for="fbCat" class="block text-xs font-semibold text-[#305070] dark:text-slate-300 uppercase tracking-wider mb-1.5">
              {$language === 'vi' ? 'Hạng mục' : 'Category'}
            </label>
            <select
              id="fbCat"
              bind:value={fbCategory}
              class="w-full px-3.5 py-2.5 text-sm bg-[#EDF6FF] dark:bg-[#101C29] border border-[#CCE4F7] dark:border-[#253D56] rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-[#0F1D2B] dark:text-white"
            >
              <option value="Service Quality">{$language === 'vi' ? 'Chất lượng dịch vụ' : 'Service Quality'}</option>
              <option value="Installation">{$language === 'vi' ? 'Lắp đặt' : 'Installation'}</option>
              <option value="Billing">{$language === 'vi' ? 'Hóa đơn / Cước' : 'Billing'}</option>
              <option value="Support">{$language === 'vi' ? 'Hỗ trợ' : 'Support'}</option>
              <option value="Other">{$language === 'vi' ? 'Khác' : 'Other'}</option>
            </select>
          </div>
        </div>

        <div>
          <label for="fbMsg" class="block text-xs font-semibold text-[#305070] dark:text-slate-300 uppercase tracking-wider mb-1.5">
            {$language === 'vi' ? 'Nội dung' : 'Message'}
          </label>
          <textarea
            id="fbMsg"
            rows="3"
            bind:value={fbMessage}
            class="w-full px-3.5 py-2.5 text-sm bg-[#EDF6FF] dark:bg-[#101C29] border border-[#CCE4F7] dark:border-[#253D56] rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-[#0F1D2B] dark:text-white"
          ></textarea>
        </div>

        <button type="submit" class="px-5 py-2.5 rounded-xl text-sm font-bold bg-sky-600 hover:bg-sky-700 text-white transition shadow">
          {$language === 'vi' ? 'Gửi phản hồi' : 'Submit feedback'}
        </button>
      </form>

      <div class="rounded-xl bg-white dark:bg-[#152434] border border-[#CCE4F7] dark:border-[#253D56] shadow-sm p-6">
        <h3 class="font-bold text-sm text-[#0F1D2B] dark:text-white mb-3">
          {$language === 'vi' ? 'Phản hồi đã gửi' : 'Your feedback history'}
        </h3>
        {#if myFeedbacks.length > 0}
          <div class="divide-y divide-[#CCE4F7] dark:divide-[#253D56] text-xs">
            {#each myFeedbacks as f (f.id)}
              <div class="py-3 space-y-1">
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-[#0F1D2B] dark:text-white">
                    {f.category} · {'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}
                  </span>
                  <span class="text-slate-400">{f.createdAt}</span>
                </div>
                <p class="text-[#537292] dark:text-[#8DB0D4]">{f.message}</p>
                {#if f.response}
                  <p class="mt-1 pl-3 border-l-2 border-sky-400 text-sky-700 dark:text-sky-300">
                    <strong>{$language === 'vi' ? 'Phản hồi từ Nexus' : 'Nexus response'}:</strong> {f.response}
                    <span class="text-slate-400"> — {f.respondedBy}</span>
                  </p>
                {/if}
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-xs text-[#537292] dark:text-[#8DB0D4]">
            {$language === 'vi' ? 'Bạn chưa gửi phản hồi nào.' : 'You have not submitted any feedback yet.'}
          </p>
        {/if}
      </div>
    </div>
  {:else if activeTab === 'settings'}
    <div class="rounded-xl bg-white dark:bg-[#1E3349] p-8 text-center shadow-sm border border-[#CCE4F7] dark:border-[#253D56]">
      <Settings class="h-12 w-12 mx-auto text-[#7899B8] dark:text-[#5E7F9F] mb-4" />
      <h3 class="text-lg font-bold text-[#0F1D2B] dark:text-white mb-2">{$t.dashboard.settingsTitle}</h3>
      <p class="text-[#537292] dark:text-[#8DB0D4]">{$t.dashboard.settingsDesc}</p>
    </div>
  {/if}
</DashboardLayout>

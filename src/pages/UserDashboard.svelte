<script lang="ts">
  // Mirrors pages/UserDashboard.tsx of the React original.
  import { authStore } from '../context/AuthContext';
  import { languageStore } from '../context/LanguageContext';
  import DashboardLayout from '../components/layout/DashboardLayout.svelte';
  import type { NavItem } from '../components/layout/DashboardLayout.svelte';
  import { User, Activity, Settings, CreditCard, LayoutDashboard, ArrowRight } from 'lucide-svelte';

  const { currentUser } = authStore;
  const { t, language } = languageStore;

  let activeTab = $state('overview');

  const navItems: NavItem[] = $derived([
    { id: 'overview', label: $t.userNav.overview, icon: LayoutDashboard },
    { id: 'billing', label: $t.userNav.billing, icon: CreditCard },
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
        <!-- Info Card -->
        <div class="p-6 bg-white dark:bg-[#152434] border border-[#CCE4F7] dark:border-[#253D56] rounded-xl shadow-sm">
          <div class="flex items-center space-x-3 text-purple-600 dark:text-purple-400 mb-2">
            <User class="h-5 w-5" />
            <h3 class="font-semibold text-base">{$language === 'vi' ? 'Thông tin tài khoản' : 'Account Profile'}</h3>
          </div>
          <p class="text-sm font-bold text-[#0F1D2B] dark:text-white">
            {$currentUser?.name || 'Customer'}
          </p>
          <p class="text-xs text-slate-500 mt-1 font-mono">ID: {$currentUser?.id}</p>
        </div>

        <!-- Activity Card -->
        <div class="p-6 bg-white dark:bg-[#152434] border border-[#CCE4F7] dark:border-[#253D56] rounded-xl shadow-sm">
          <div class="flex items-center space-x-3 text-sky-600 dark:text-sky-400 mb-2">
            <Activity class="h-5 w-5" />
            <h3 class="font-semibold text-base">{$language === 'vi' ? 'Dịch vụ đang dùng' : 'Active Subscription'}</h3>
          </div>
          <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {$language === 'vi' ? 'Internet Cáp quang 1Gbps' : 'Broadband Fiber Ultra 1Gbps'}
          </p>
          <p class="text-xs text-emerald-500 mt-1 font-semibold">
            {$language === 'vi' ? '● Đang hoạt động tốt' : '● Online & Provisioned'}
          </p>
        </div>

        <!-- Billing Card -->
        <div class="p-6 bg-white dark:bg-[#152434] border border-[#CCE4F7] dark:border-[#253D56] rounded-xl shadow-sm">
          <div class="flex items-center space-x-3 text-amber-600 dark:text-amber-400 mb-2">
            <CreditCard class="h-5 w-5" />
            <h3 class="font-semibold text-base">{$language === 'vi' ? 'Hóa đơn tháng này' : 'Current Invoice'}</h3>
          </div>
          <p class="text-sm font-bold text-slate-700 dark:text-slate-200">
            {$language === 'vi' ? '250,000 VND' : '$79.99 USD'}
          </p>
          <p class="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
            {$language === 'vi' ? 'Hạn chót: 15/09/2026' : 'Due Date: 15/10/2026'}
          </p>
        </div>

        <!-- Support Card -->
        <div class="p-6 bg-white dark:bg-[#152434] border border-[#CCE4F7] dark:border-[#253D56] rounded-xl shadow-sm">
          <div class="flex items-center space-x-3 text-slate-600 dark:text-slate-400 mb-2">
            <Settings class="h-5 w-5" />
            <h3 class="font-semibold text-base">{$language === 'vi' ? 'Hỗ trợ kỹ thuật' : 'Technical Support'}</h3>
          </div>
          <p class="text-xs text-slate-600 dark:text-slate-300">
            {$language === 'vi' ? 'Cần hỗ trợ hoặc sự cố đường truyền?' : 'Need technical help or report outage?'}
          </p>
          <button
            type="button"
            onclick={() => (activeTab = 'settings')}
            class="mt-2 text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 flex items-center space-x-1"
          >
            <span>{$language === 'vi' ? 'Gửi yêu cầu hỗ trợ' : 'Submit Ticket'}</span>
            <ArrowRight class="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  {:else if activeTab === 'billing'}
    <div class="rounded-xl bg-white dark:bg-[#1E3349] p-8 text-center shadow-sm border border-[#CCE4F7] dark:border-[#253D56]">
      <CreditCard class="h-12 w-12 mx-auto text-sky-600 dark:text-sky-400 mb-4" />
      <h3 class="text-lg font-bold text-[#0F1D2B] dark:text-white mb-2">
        {$language === 'vi' ? 'Lịch sử hóa đơn & cước phí' : 'Billing & Payment History'}
      </h3>
      <p class="text-[#537292] dark:text-[#8DB0D4] max-w-md mx-auto text-xs">
        {$language === 'vi' ? 'Tất cả hóa đơn cước đã được thanh toán đầy đủ. Không có khoản nợ cước quá hạn.' : 'All monthly invoices have been settled. No outstanding telecom balances.'}
      </p>
    </div>
  {:else if activeTab === 'settings'}
    <div class="rounded-xl bg-white dark:bg-[#1E3349] p-8 text-center shadow-sm border border-[#CCE4F7] dark:border-[#253D56]">
      <Settings class="h-12 w-12 mx-auto text-[#7899B8] dark:text-[#5E7F9F] mb-4" />
      <h3 class="text-lg font-bold text-[#0F1D2B] dark:text-white mb-2">{$t.dashboard.settingsTitle}</h3>
      <p class="text-[#537292] dark:text-[#8DB0D4]">{$t.dashboard.settingsDesc}</p>
    </div>
  {/if}
</DashboardLayout>

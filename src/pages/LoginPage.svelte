<script lang="ts">
  // Customer sign-in is Account ID only (issued at purchase); staff enter by role.
  import { authStore, normalizeAccountId } from '../context/AuthContext';
  import { nexusStore } from '../context/NexusContext';
  import { themeStore } from '../context/ThemeContext';
  import { languageStore } from '../context/LanguageContext';
  import LanguageToggle from '../components/layout/LanguageToggle.svelte';
  import { dashboardPathForRole, navigate, queryParam } from '../lib/router';
  import type { Order, RoleType } from '../types/nexus';
  import {
    Layers, KeyRound, ShieldCheck, ShoppingBag, Wrench, Calculator,
    ArrowRight, ArrowLeft, Sparkles, Sun, Moon, ShoppingCart, Search,
    User, Lock,
  } from 'lucide-svelte';
  import { toast } from 'svelte-sonner';

  const { loginWithAccountId, loginAsStaff, currentUser } = authStore;
  const { connections, orders } = nexusStore;
  const { theme, toggleTheme } = themeStore;
  const { t, language } = languageStore;

  let accountId = $state('');
  let errorMessage = $state('');

  // Order lookup: until technical confirms feasibility there is no Account ID,
  // so a fresh customer follows the order by its code.
  let orderQuery = $state(queryParam('order') ?? '');
  let trackedOrder = $state<Order | null>(null);
  let trackError = $state('');

  // A real subscriber ID from the seeded data, offered as a demo shortcut.
  const demoAccountId = $derived($connections[0]?.accountId ?? '');

  // If already logged in, redirect immediately to their dashboard
  $effect(() => {
    if ($currentUser) {
      navigate(dashboardPathForRole($currentUser.role));
    }
  });

  // Arriving from the purchase receipt (#/login?order=...) looks the order up.
  $effect(() => {
    const fromUrl = queryParam('order');
    if (fromUrl && !trackedOrder && !trackError) {
      lookUpOrder(fromUrl);
    }
  });

  const lookUpOrder = (rawId: string) => {
    const id = rawId.trim().toUpperCase();
    trackError = '';
    const found = $orders.find((o) => o.id.toUpperCase() === id) ?? null;
    trackedOrder = found;
    if (!found) trackError = $t.auth.trackNotFound;
  };

  const handleTrackSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    if (!orderQuery.trim()) return;
    lookUpOrder(orderQuery);
  };

  // Keep the field formatted as T064-000000000001 while typing.
  const handleAccountIdInput = (e: Event) => {
    accountId = normalizeAccountId((e.currentTarget as HTMLInputElement).value);
  };

  const signIn = (rawId: string) => {
    errorMessage = '';
    const result = loginWithAccountId(rawId);
    if (result.success) {
      toast.success(`${$t.auth.loginSuccess} ${result.user.name}`);
      navigate('/user');
    } else {
      errorMessage = result.error;
      toast.error($t.auth.loginFailed);
    }
  };

  const handleLoginSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    if (!accountId.trim()) {
      errorMessage = $t.auth.accountIdRequired;
      return;
    }
    signIn(accountId);
  };

  const handleStaffLogin = (role: Exclude<RoleType, 'user'>) => {
    const user = loginAsStaff(role);
    toast.success(
      $language === 'vi'
        ? `Đã truy cập với vai trò: ${user.title} (${user.name})`
        : `Signed in as: ${user.title} (${user.name})`
    );
    navigate(dashboardPathForRole(user.role));
  };

  interface StaffRole {
    role: Exclude<RoleType, 'user'>;
    labelVi: string;
    labelEn: string;
    name: string;
    titleVi: string;
    titleEn: string;
    descVi: string;
    descEn: string;
    Icon: typeof ShieldCheck;
    badgeStyle: string;
    cardStyle: string;
    iconBg: string;
    accentColor: string;
  }

  const staffRoles: StaffRole[] = [
    {
      role: 'admin',
      labelVi: '1. Admin / Ban Giám Đốc',
      labelEn: '1. Admin / Operations Lead',
      name: 'Sarah Jenkins',
      titleVi: 'Giám đốc Quản trị Hệ thống',
      titleEn: 'System Administrator & Security Lead',
      descVi: 'Quản trị toàn hệ thống, nhân sự, kho thiết bị CPE, điểm giao dịch, đối tác & danh mục gói cước.',
      descEn: 'Full control over personnel, CPE inventory, branch shops, vendors & telecom plan catalog.',
      Icon: ShieldCheck,
      badgeStyle: 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      cardStyle: 'bg-indigo-50/50 hover:bg-indigo-50/90 dark:bg-indigo-950/25 dark:hover:bg-indigo-950/50 border-indigo-200/70 dark:border-indigo-800/50 hover:border-indigo-400 dark:hover:border-indigo-700',
      iconBg: 'bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/25',
      accentColor: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      role: 'retail',
      labelVi: '2. Retail / Điểm Giao Dịch',
      labelEn: '2. Retail / Sales & Counter',
      name: 'David Chen',
      titleVi: 'Giao dịch viên & Hỗ trợ Khách hàng',
      titleEn: 'Retail Service & Front Counter',
      descVi: 'Tạo đơn hàng mới, theo dõi tiến độ khảo sát, tra cứu thuê bao & quản lý hồ sơ thanh toán.',
      descEn: 'Register new orders, monitor feasibility, inspect subscribers & process counter payments.',
      Icon: ShoppingBag,
      badgeStyle: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      cardStyle: 'bg-emerald-50/50 hover:bg-emerald-50/90 dark:bg-emerald-950/25 dark:hover:bg-emerald-950/50 border-emerald-200/70 dark:border-emerald-800/50 hover:border-emerald-400 dark:hover:border-emerald-700',
      iconBg: 'bg-gradient-to-tr from-emerald-600 to-emerald-500 text-white shadow-md shadow-emerald-500/25',
      accentColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      role: 'technical',
      labelVi: '3. Technical / NOC & Hiện Trường',
      labelEn: '3. Technical / Field & NOC',
      name: 'Marcus Ramirez',
      titleVi: 'Kỹ sư Đo kiểm & Hạ tầng Mạng',
      titleEn: 'Field NOC & Circuit Engineer',
      descVi: 'Khảo sát khả thi hạ tầng cáp quang, cấu hình OLT/ONT, đấu nối mạch & kiểm tra suy hao quang.',
      descEn: 'Survey network feasibility, configure OLT/ONT, assign subscriber circuits & test optical dBm.',
      Icon: Wrench,
      badgeStyle: 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      cardStyle: 'bg-amber-50/50 hover:bg-amber-50/90 dark:bg-amber-950/25 dark:hover:bg-amber-950/50 border-amber-200/70 dark:border-amber-800/50 hover:border-amber-400 dark:hover:border-amber-700',
      iconBg: 'bg-gradient-to-tr from-amber-600 to-amber-500 text-white shadow-md shadow-amber-500/25',
      accentColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      role: 'accounts',
      labelVi: '4. Accounts / Kế Toán & Cước',
      labelEn: '4. Accounts / Billing & Tax',
      name: 'Elena Rostova',
      titleVi: 'Chuyên viên Kế toán & Quản lý Cước',
      titleEn: 'Billing & Financial Accountant',
      descVi: 'Tạo hóa đơn cước chu kỳ, đối soát giao dịch ngân hàng, cập nhật thanh toán & cấu hình thuế.',
      descEn: 'Generate monthly billing cycles, reconcile bank transactions, update settlements & tax rates.',
      Icon: Calculator,
      badgeStyle: 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      cardStyle: 'bg-blue-50/50 hover:bg-blue-50/90 dark:bg-blue-950/25 dark:hover:bg-blue-950/50 border-blue-200/70 dark:border-blue-800/50 hover:border-blue-400 dark:hover:border-blue-700',
      iconBg: 'bg-gradient-to-tr from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/25',
      accentColor: 'text-blue-600 dark:text-blue-400',
    },
  ];
</script>

<div class="h-full w-full overflow-y-auto bg-[#E0F1FF] dark:bg-[#1B2D40] text-[#1B2D40] dark:text-[#E0F1FF] flex flex-col justify-start py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative transition-colors duration-300">
  <!-- Top left Back to Home Button -->
  <div class="fixed top-4 left-4 z-50">
    <button
      type="button"
      onclick={() => navigate('/')}
      class="h-10 px-3.5 rounded-full bg-white/85 dark:bg-[#152434]/85 hover:bg-white dark:hover:bg-[#1E3349] text-[#1B2D40] dark:text-[#E0F1FF] border border-[#CCE4F7] dark:border-[#253D56] flex items-center space-x-1.5 transition shadow-md hover:scale-105 active:scale-95 text-xs font-semibold backdrop-blur-md cursor-pointer"
      title={$t.common.home}
    >
      <ArrowLeft class="h-4 w-4" />
      <span class="hidden sm:inline">{$t.common.home}</span>
    </button>
  </div>

  <!-- Top right Controls: Language Toggle & Theme Toggle -->
  <div class="fixed top-4 right-4 z-50 flex items-center space-x-2">
    <LanguageToggle />
    <button
      type="button"
      onclick={toggleTheme}
      class="h-10 w-10 rounded-full bg-white/85 dark:bg-[#152434]/85 hover:bg-white dark:hover:bg-[#1E3349] text-[#1B2D40] dark:text-[#E0F1FF] border border-[#CCE4F7] dark:border-[#253D56] flex items-center justify-center transition shadow-md hover:scale-105 active:scale-95 group backdrop-blur-md cursor-pointer"
      title={$theme === 'dark' ? $t.common.themeLight : $t.common.themeDark}
    >
      {#if $theme === 'dark'}
        <Sun class="h-5 w-5 text-amber-400 group-hover:rotate-45 transition-transform" />
      {:else}
        <Moon class="h-5 w-5 text-sky-700 group-hover:-rotate-12 transition-transform" />
      {/if}
    </button>
  </div>

  <!-- Background ambient lighting -->
  <div class="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-200/40 via-[#E0F1FF] to-[#E0F1FF] dark:from-blue-900/20 dark:via-[#1B2D40] dark:to-[#1B2D40]"></div>
  <div class="fixed inset-0 pointer-events-none bg-[linear-gradient(to_right,#0284c70d_1px,transparent_1px),linear-gradient(to_bottom,#0284c70d_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:3rem_3rem]"></div>

  <div class="relative mx-auto w-full max-w-6xl px-2 sm:px-4 my-auto">
    <!-- Brand Header -->
    <div class="text-center space-y-2 mb-8">
      <div class="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-xl shadow-blue-500/25 mb-1">
        <Layers class="h-8 w-8" />
      </div>
      <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F1D2B] dark:text-white">NEXUS SYSTEM</h1>
      <p class="text-xs uppercase font-bold tracking-widest text-sky-600 dark:text-blue-400">
        {$t.auth.loginSubtitle}
      </p>
      <p class="text-sm text-[#537292] dark:text-slate-300 max-w-xl mx-auto">
        {$t.auth.loginDescription}
      </p>
    </div>

    <!-- 2 Dedicated Login Boxes Side-by-Side -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
      <!-- LEFT BOX: CUSTOMER & SUBSCRIBER PORTAL -->
      <div class="bg-white/95 dark:bg-[#152434]/95 border border-[#CCE4F7] dark:border-[#253D56] rounded-2xl p-6 sm:p-8 shadow-xl dark:shadow-2xl backdrop-blur-xl flex flex-col justify-between transition-all duration-300 relative overflow-hidden">
        <div>
          <!-- Header -->
          <div class="flex items-center space-x-3 pb-5 border-b border-[#CCE4F7] dark:border-[#253D56]/80">
            <div class="h-12 w-12 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/20 shrink-0">
              <User class="h-6 w-6" />
            </div>
            <div class="min-w-0">
              <div class="flex items-center space-x-2 flex-wrap gap-y-1">
                <h2 class="text-base sm:text-lg font-extrabold text-[#0F1D2B] dark:text-white truncate">
                  {$t.auth.userPortalTitle}
                </h2>
                <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  {$t.auth.userPortalBadge}
                </span>
              </div>
              <p class="text-xs text-[#537292] dark:text-slate-400 mt-0.5">
                {$t.auth.userPortalSubtitle}
              </p>
            </div>
          </div>

          <!-- Error Alert if any -->
          {#if errorMessage}
            <div class="mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
              <span class="h-2 w-2 rounded-full bg-rose-500 animate-ping shrink-0"></span>
              <span>{errorMessage}</span>
            </div>
          {/if}

          <!-- Account ID Login Form -->
          <form onsubmit={handleLoginSubmit} class="mt-5 space-y-4">
            <div>
              <label for="accountId" class="block text-xs font-semibold text-[#305070] dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {$t.auth.accountIdLabel}
              </label>
              <div class="relative">
                <KeyRound class="absolute left-3.5 top-3 h-4 w-4 text-[#7899B8] dark:text-slate-500" />
                <input
                  id="accountId"
                  type="text"
                  autocomplete="off"
                  maxlength="17"
                  required
                  placeholder={$t.auth.accountIdPlaceholder}
                  value={accountId}
                  oninput={handleAccountIdInput}
                  class="w-full pl-10 pr-4 py-2.5 text-sm bg-[#EDF6FF] dark:bg-[#101C29] border border-[#CCE4F7] dark:border-[#253D56] rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-blue-500 text-[#0F1D2B] dark:text-white placeholder-[#7899B8] dark:placeholder-slate-500 transition font-mono tracking-wider"
                />
              </div>
            </div>

            <!-- Submit Button -->
            <div class="pt-1">
              <button
                type="submit"
                class="w-full py-2.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.99]"
              >
                <span>{$t.auth.loginButton}</span>
                <ArrowRight class="h-4 w-4" />
              </button>
            </div>
          </form>

          <!-- Demo subscriber shortcut -->
          {#if demoAccountId}
            <div class="mt-4 p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 flex items-center justify-between gap-3">
              <div class="min-w-0">
                <div class="text-[11px] font-bold text-purple-700 dark:text-purple-300 flex items-center space-x-1.5">
                  <Sparkles class="h-3 w-3 text-purple-500" />
                  <span>{$t.auth.demoAccountTitle}</span>
                </div>
                <div class="font-mono text-xs text-[#0F1D2B] dark:text-white truncate font-bold mt-0.5">{demoAccountId}</div>
              </div>
              <button
                type="button"
                onclick={() => { accountId = demoAccountId; signIn(demoAccountId); }}
                class="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-purple-600 hover:bg-purple-700 text-white transition active:scale-95 cursor-pointer shadow-sm shadow-purple-600/20"
              >
                {$t.common.login}
              </button>
            </div>
          {/if}

          <!-- Order Lookup Section -->
          <div class="mt-6 pt-5 border-t border-[#CCE4F7] dark:border-[#253D56]/80">
            <div class="flex items-center space-x-1.5 text-xs font-semibold text-[#537292] dark:text-slate-400 mb-1">
              <Search class="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
              <span>{$t.auth.trackTitle}</span>
            </div>
            <p class="text-[11px] text-[#537292] dark:text-slate-400 mb-2.5">{$t.auth.trackHint}</p>

            <form onsubmit={handleTrackSubmit} class="flex items-center gap-2">
              <input
                type="text"
                autocomplete="off"
                placeholder={$t.auth.trackPlaceholder}
                bind:value={orderQuery}
                class="flex-1 min-w-0 px-3.5 py-2 text-sm bg-[#EDF6FF] dark:bg-[#101C29] border border-[#CCE4F7] dark:border-[#253D56] rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-blue-500 text-[#0F1D2B] dark:text-white placeholder-[#7899B8] dark:placeholder-slate-500 transition font-mono"
              />
              <button
                type="submit"
                class="shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#EDF6FF] dark:bg-[#1E3349] hover:bg-[#D8ECFC] dark:hover:bg-[#253E58] text-[#1B2D40] dark:text-white border border-[#CCE4F7] dark:border-[#253D56] transition active:scale-95 cursor-pointer"
              >
                {$t.auth.trackButton}
              </button>
            </form>

            {#if trackError}
              <p class="mt-2 text-[11px] text-rose-600 dark:text-rose-400">{trackError}</p>
            {:else if trackedOrder}
              <div class="mt-3 p-3 rounded-xl bg-[#EDF6FF] dark:bg-[#101C29] border border-[#CCE4F7] dark:border-[#253D56] text-xs">
                <div class="flex items-center justify-between gap-2">
                  <span class="font-mono font-bold text-[#0F1D2B] dark:text-white">{trackedOrder.id}</span>
                  <span class="text-[11px] font-semibold text-sky-700 dark:text-sky-300">
                    {$t.auth.trackStatusLabel}: {trackedOrder.status}
                  </span>
                </div>

                {#if trackedOrder.assignedAccountId}
                  <p class="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    {$t.auth.trackAccountIssued}
                  </p>
                  <div class="mt-1 flex items-center justify-between gap-2">
                    <span class="font-mono font-bold text-[#0F1D2B] dark:text-white break-all">
                      {trackedOrder.assignedAccountId}
                    </span>
                    <button
                      type="button"
                      onclick={() => { accountId = trackedOrder!.assignedAccountId!; signIn(accountId); }}
                      class="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-sky-600 hover:bg-sky-700 text-white transition active:scale-95 cursor-pointer"
                    >
                      {$t.common.login}
                    </button>
                  </div>
                {:else if trackedOrder.status === 'Not Feasible'}
                  <p class="mt-2 text-[11px] text-rose-600 dark:text-rose-400">{$t.auth.trackRejected}</p>
                {:else}
                  <p class="mt-2 text-[11px] text-amber-600 dark:text-amber-400">{$t.auth.trackPending}</p>
                {/if}
              </div>
            {/if}
          </div>
        </div>

        <!-- Purchase flow footer -->
        <div class="mt-6 pt-4 border-t border-[#CCE4F7] dark:border-[#253D56]/80 text-center text-xs text-[#537292] dark:text-slate-400 flex items-center justify-center space-x-1.5">
          <span>{$t.auth.noAccount}</span>
          <button
            type="button"
            onclick={() => navigate('/register')}
            class="font-bold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center space-x-1 cursor-pointer"
          >
            <ShoppingCart class="h-3.5 w-3.5" />
            <span>{$t.auth.registerLink}</span>
            <ArrowRight class="h-3 w-3" />
          </button>
        </div>
      </div>

      <!-- RIGHT BOX: INTERNAL STAFF & ROLES PORTAL -->
      <div class="bg-white/95 dark:bg-[#152434]/95 border border-[#CCE4F7] dark:border-[#253D56] rounded-2xl p-6 sm:p-8 shadow-xl dark:shadow-2xl backdrop-blur-xl flex flex-col justify-between transition-all duration-300 relative overflow-hidden">
        <div>
          <!-- Header -->
          <div class="flex items-center space-x-3 pb-5 border-b border-[#CCE4F7] dark:border-[#253D56]/80">
            <div class="h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
              <ShieldCheck class="h-6 w-6" />
            </div>
            <div class="min-w-0">
              <div class="flex items-center space-x-2 flex-wrap gap-y-1">
                <h2 class="text-base sm:text-lg font-extrabold text-[#0F1D2B] dark:text-white truncate">
                  {$t.auth.staffPortalTitle}
                </h2>
                <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {$t.auth.staffPortalBadge}
                </span>
              </div>
              <p class="text-xs text-[#537292] dark:text-slate-400 mt-0.5">
                {$t.auth.staffPortalSubtitle}
              </p>
            </div>
          </div>

          <!-- Instruction Subtitle -->
          <div class="mt-4 mb-3 flex items-center justify-between text-xs text-[#537292] dark:text-slate-400">
            <span class="flex items-center space-x-1.5 font-semibold text-[#305070] dark:text-slate-300">
              <Sparkles class="h-3.5 w-3.5 text-amber-500" />
              <span>{$t.auth.staffLoginTitle}</span>
            </span>
            <span class="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">4 Roles</span>
          </div>

          <!-- 4 Interactive Staff Role Cards -->
          <div class="space-y-2.5">
            {#each staffRoles as sr (sr.role)}
              <button
                type="button"
                onclick={() => handleStaffLogin(sr.role)}
                class="w-full text-left p-3 rounded-xl border transition-all duration-200 group flex items-start space-x-3.5 cursor-pointer shadow-sm hover:shadow-md active:scale-[0.99] {sr.cardStyle}"
              >
                <div class="h-10 w-10 rounded-xl {sr.iconBg} flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  <sr.Icon class="h-5 w-5" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center space-x-2 min-w-0">
                      <span class="font-extrabold text-xs sm:text-sm text-[#0F1D2B] dark:text-white truncate group-hover:{sr.accentColor}">
                        {$language === 'vi' ? sr.labelVi : sr.labelEn}
                      </span>
                    </div>
                    <span class="shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-md border {sr.badgeStyle}">
                      {sr.name}
                    </span>
                  </div>
                  <div class="text-[11px] font-semibold text-[#305070] dark:text-slate-300 mt-0.5">
                    {$language === 'vi' ? sr.titleVi : sr.titleEn}
                  </div>
                  <div class="text-[10px] text-[#537292] dark:text-slate-400 line-clamp-1 mt-0.5">
                    {$language === 'vi' ? sr.descVi : sr.descEn}
                  </div>
                </div>
                <div class="shrink-0 self-center pl-1 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                  <ArrowRight class="h-4 w-4 {sr.accentColor}" />
                </div>
              </button>
            {/each}
          </div>
        </div>

        <!-- Security & Audit Note Footer -->
        <div class="mt-6 pt-4 border-t border-[#CCE4F7] dark:border-[#253D56]/80 flex items-center justify-between text-[11px] text-[#537292] dark:text-slate-400">
          <div class="flex items-center space-x-1.5">
            <Lock class="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span class="truncate">{$t.auth.staffSecurityNotice}</span>
          </div>
          <span class="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-bold shrink-0 ml-2">v2.4 Enterprise</span>
        </div>
      </div>
    </div>
  </div>
</div>

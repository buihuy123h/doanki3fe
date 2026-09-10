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
    label: string;
    name: string;
    Icon: typeof ShieldCheck;
    chip: string;
    iconColor: string;
    hoverText: string;
    sub: string;
  }

  const staffRoles: StaffRole[] = [
    {
      role: 'admin', label: '1. Admin', name: 'Sarah Jenkins', Icon: ShieldCheck,
      chip: 'bg-indigo-50/80 hover:bg-indigo-100/90 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      hoverText: 'group-hover:text-indigo-600 dark:group-hover:text-indigo-200',
      sub: 'text-[#537292] dark:text-indigo-300/70',
    },
    {
      role: 'retail', label: '2. Retail Staff', name: 'David Chen', Icon: ShoppingBag,
      chip: 'bg-emerald-50/80 hover:bg-emerald-100/90 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      hoverText: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-200',
      sub: 'text-[#537292] dark:text-emerald-300/70',
    },
    {
      role: 'technical', label: '3. Technical', name: 'Marcus Ramirez', Icon: Wrench,
      chip: 'bg-amber-50/80 hover:bg-amber-100/90 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300',
      iconColor: 'text-amber-600 dark:text-amber-400',
      hoverText: 'group-hover:text-amber-600 dark:group-hover:text-amber-200',
      sub: 'text-[#537292] dark:text-amber-300/70',
    },
    {
      role: 'accounts', label: '4. Accounts', name: 'Elena Rostova', Icon: Calculator,
      chip: 'bg-blue-50/80 hover:bg-blue-100/90 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-300',
      iconColor: 'text-blue-600 dark:text-blue-400',
      hoverText: 'group-hover:text-blue-600 dark:group-hover:text-blue-200',
      sub: 'text-[#537292] dark:text-blue-300/70',
    },
  ];
</script>

<div class="h-full w-full overflow-y-scroll bg-[#E0F1FF] dark:bg-[#1B2D40] text-[#1B2D40] dark:text-[#E0F1FF] flex flex-col justify-start sm:justify-center py-10 sm:py-16 px-4 sm:px-6 lg:px-8 relative transition-colors duration-300">
  <!-- Top left Back to Home Button -->
  <div class="fixed top-4 left-4 z-50">
    <button
      type="button"
      onclick={() => navigate('/')}
      class="h-10 px-3.5 rounded-full bg-white/85 dark:bg-[#152434]/85 hover:bg-white dark:hover:bg-[#1E3349] text-[#1B2D40] dark:text-[#E0F1FF] border border-[#CCE4F7] dark:border-[#253D56] flex items-center space-x-1.5 transition shadow-md hover:scale-105 active:scale-95 text-xs font-semibold backdrop-blur-md"
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
      class="h-10 w-10 rounded-full bg-white/85 dark:bg-[#152434]/85 hover:bg-white dark:hover:bg-[#1E3349] text-[#1B2D40] dark:text-[#E0F1FF] border border-[#CCE4F7] dark:border-[#253D56] flex items-center justify-center transition shadow-md hover:scale-105 active:scale-95 group backdrop-blur-md"
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

  <div class="relative sm:mx-auto sm:w-full sm:max-w-md px-4 my-auto">
    <!-- Brand Header -->
    <div class="text-center space-y-2">
      <div class="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-xl shadow-blue-500/25 mb-2">
        <Layers class="h-8 w-8" />
      </div>
      <h1 class="text-3xl font-extrabold tracking-tight text-[#0F1D2B] dark:text-white">NEXUS SYSTEM</h1>
      <p class="text-xs uppercase font-semibold tracking-wider text-sky-600 dark:text-blue-400">
        {$t.auth.loginSubtitle}
      </p>
      <p class="text-sm text-[#537292] dark:text-slate-300 max-w-sm mx-auto">
        {$t.auth.loginDescription}
      </p>
    </div>

    <!-- Login Card -->
    <div class="mt-8 bg-white/95 dark:bg-[#152434]/95 border border-[#CCE4F7] dark:border-[#253D56] rounded-2xl p-6 sm:p-8 shadow-xl dark:shadow-2xl backdrop-blur-xl transition-colors duration-300">
      {#if errorMessage}
        <div class="mb-5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
          <span class="h-2 w-2 rounded-full bg-rose-500 animate-ping shrink-0"></span>
          <span>{errorMessage}</span>
        </div>
      {/if}

      <form onsubmit={handleLoginSubmit} class="space-y-4">
        <!-- Account ID Field -->
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
          <p class="mt-1.5 text-[11px] text-[#537292] dark:text-slate-400">{$t.auth.accountIdHint}</p>
        </div>

        <!-- Submit Button -->
        <div class="pt-2">
          <button
            type="submit"
            class="w-full py-2.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2"
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
            <div class="text-[11px] font-bold text-purple-700 dark:text-purple-300">{$t.auth.demoAccountTitle}</div>
            <div class="font-mono text-xs text-[#0F1D2B] dark:text-white truncate">{demoAccountId}</div>
          </div>
          <button
            type="button"
            onclick={() => { accountId = demoAccountId; signIn(demoAccountId); }}
            class="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-purple-600 hover:bg-purple-700 text-white transition active:scale-95"
          >
            {$t.common.login}
          </button>
        </div>
      {/if}

      <!-- Order lookup for customers whose Account ID has not been issued yet -->
      <div class="mt-6 pt-6 border-t border-[#CCE4F7] dark:border-slate-800/80">
        <div class="flex items-center space-x-1.5 text-xs font-semibold text-[#537292] dark:text-slate-400 mb-1.5">
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
            class="shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#EDF6FF] dark:bg-[#1E3349] hover:bg-[#D8ECFC] dark:hover:bg-[#253E58] text-[#1B2D40] dark:text-white border border-[#CCE4F7] dark:border-[#253D56] transition active:scale-95"
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
                  class="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-sky-600 hover:bg-sky-700 text-white transition active:scale-95"
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

      <!-- Link to the purchase flow: the only way to get an Account ID -->
      <div class="mt-5 text-center text-xs text-[#537292] dark:text-slate-400">
        <span>{$t.auth.noAccount} </span>
        <button
          type="button"
          onclick={() => navigate('/register')}
          class="font-bold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center space-x-1"
        >
          <ShoppingCart class="h-3 w-3" />
          <span>{$t.auth.registerLink}</span>
          <ArrowRight class="h-3 w-3" />
        </button>
      </div>

      <!-- Internal staff access by role -->
      <div class="mt-6 pt-6 border-t border-[#CCE4F7] dark:border-slate-800/80">
        <div class="flex items-center justify-between text-xs font-semibold text-[#537292] dark:text-slate-400 mb-3">
          <span class="flex items-center space-x-1.5">
            <Sparkles class="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
            <span>{$t.auth.staffLoginTitle}</span>
          </span>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs">
          {#each staffRoles as sr (sr.role)}
            <button
              type="button"
              onclick={() => handleStaffLogin(sr.role)}
              class="p-2.5 rounded-lg {sr.chip} font-medium text-left transition flex items-center space-x-2 group"
            >
              <sr.Icon class="h-4 w-4 {sr.iconColor} shrink-0" />
              <div class="truncate">
                <div class="font-bold text-[#0F1D2B] dark:text-white {sr.hoverText}">{sr.label}</div>
                <div class="text-[10px] {sr.sub} truncate">{sr.name}</div>
              </div>
            </button>
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>

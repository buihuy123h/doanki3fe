<script lang="ts">
  // Mirrors pages/LoginPage.tsx of the React original.
  import { authStore } from '../context/AuthContext';
  import { themeStore } from '../context/ThemeContext';
  import { languageStore } from '../context/LanguageContext';
  import LanguageToggle from '../components/layout/LanguageToggle.svelte';
  import { dashboardPathForRole, navigate } from '../lib/router';
  import type { RoleType } from '../types/nexus';
  import {
    Layers, Lock, Mail, ShieldCheck, ShoppingBag, Wrench, Calculator,
    ArrowRight, ArrowLeft, Eye, EyeOff, Sparkles, Sun, Moon, User,
  } from 'lucide-svelte';
  import { toast } from 'svelte-sonner';

  const { login, quickLoginAsRole, currentUser } = authStore;
  const { theme, toggleTheme } = themeStore;
  const { t } = languageStore;

  let email = $state('');
  let password = $state('');
  let showPassword = $state(false);
  let errorMessage = $state('');

  // If already logged in, redirect immediately to their dashboard
  $effect(() => {
    if ($currentUser) {
      navigate(dashboardPathForRole($currentUser.role));
    }
  });

  const handleLoginSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    errorMessage = '';

    if (!email.trim() || !password.trim()) {
      errorMessage = 'Vui lòng nhập đầy đủ email và mật khẩu.';
      return;
    }

    const result = login(email, password);
    if (result.success && result.user) {
      toast.success(`Đăng nhập thành công! Xin chào ${result.user.name} (${result.user.title})`);
      // React original restores the "from" path from router state;
      // the hash router always lands on the role dashboard instead.
      navigate(dashboardPathForRole(result.user.role));
    } else {
      errorMessage = result.error || 'Thông tin đăng nhập không hợp lệ.';
      toast.error('Đăng nhập thất bại.');
    }
  };

  const handleQuickLogin = (role: RoleType) => {
    const user = quickLoginAsRole(role);
    toast.success(`Đã đăng nhập nhanh với vai trò: ${user.title} (${user.name})`);
    navigate(dashboardPathForRole(user.role));
  };

  interface QuickRole {
    role: RoleType;
    label: string;
    name: string;
    Icon: typeof ShieldCheck;
    chip: string;
    iconColor: string;
    hoverText: string;
    sub: string;
    extraClass?: string;
  }

  const quickRoles: QuickRole[] = [
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
    {
      role: 'user', label: '5. Customer', name: 'Nguyễn Văn A', Icon: User,
      chip: 'bg-purple-50/80 hover:bg-purple-100/90 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800/50 text-purple-700 dark:text-purple-300',
      iconColor: 'text-purple-600 dark:text-purple-400',
      hoverText: 'group-hover:text-purple-600 dark:group-hover:text-purple-200',
      sub: 'text-[#537292] dark:text-purple-300/70',
      extraClass: 'col-span-2 sm:col-span-1',
    },
  ];
</script>

<div class="h-full w-full overflow-y-auto bg-[#E0F1FF] dark:bg-[#1B2D40] text-[#1B2D40] dark:text-[#E0F1FF] flex flex-col justify-start sm:justify-center py-10 sm:py-16 px-4 sm:px-6 lg:px-8 relative transition-colors duration-300">
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
          <span class="h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
          <span>{errorMessage}</span>
        </div>
      {/if}

      <form onsubmit={handleLoginSubmit} class="space-y-4">
        <!-- Email Field -->
        <div>
          <label class="block text-xs font-semibold text-[#305070] dark:text-slate-300 uppercase tracking-wider mb-1.5">
            {$t.auth.emailLabel}
          </label>
          <div class="relative">
            <Mail class="absolute left-3.5 top-3 h-4 w-4 text-[#7899B8] dark:text-slate-500" />
            <input
              type="email"
              required
              placeholder="admin@nexus.telecom"
              bind:value={email}
              class="w-full pl-10 pr-4 py-2.5 text-sm bg-[#EDF6FF] dark:bg-[#101C29] border border-[#CCE4F7] dark:border-[#253D56] rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-blue-500 text-[#0F1D2B] dark:text-white placeholder-[#7899B8] dark:placeholder-slate-500 transition"
            />
          </div>
        </div>

        <!-- Password Field -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="block text-xs font-semibold text-[#305070] dark:text-slate-300 uppercase tracking-wider">
              {$t.auth.passwordLabel}
            </label>
          </div>
          <div class="relative">
            <Lock class="absolute left-3.5 top-3 h-4 w-4 text-[#7899B8] dark:text-slate-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="••••••••"
              bind:value={password}
              class="w-full pl-10 pr-10 py-2.5 text-sm bg-[#EDF6FF] dark:bg-[#101C29] border border-[#CCE4F7] dark:border-[#253D56] rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-blue-500 text-[#0F1D2B] dark:text-white placeholder-[#7899B8] dark:placeholder-slate-500 transition font-mono"
            />
            <button
              type="button"
              onclick={() => (showPassword = !showPassword)}
              class="absolute right-3 top-2.5 text-[#7899B8] hover:text-[#0F1D2B] dark:text-slate-500 dark:hover:text-slate-300"
            >
              {#if showPassword}
                <EyeOff class="h-4 w-4" />
              {:else}
                <Eye class="h-4 w-4" />
              {/if}
            </button>
          </div>
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

      <!-- Link to Register -->
      <div class="mt-5 text-center text-xs text-[#537292] dark:text-slate-400">
        <span>{$t.auth.noAccount} </span>
        <button
          type="button"
          onclick={() => navigate('/register')}
          class="font-bold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center space-x-1"
        >
          <span>{$t.auth.registerLink}</span>
          <ArrowRight class="h-3 w-3" />
        </button>
      </div>
        <!-- Quick 1-Click Role Login Chips -->
        <div class="mt-6 pt-6 border-t border-[#CCE4F7] dark:border-slate-800/80">
          <div class="flex items-center justify-between text-xs font-semibold text-[#537292] dark:text-slate-400 mb-3">
            <span class="flex items-center space-x-1.5">
              <Sparkles class="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
              <span>{$t.auth.quickLoginTitle}</span>
            </span>
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs">
            {#each quickRoles as qr (qr.role)}
              <button
                type="button"
                onclick={() => handleQuickLogin(qr.role)}
                class="p-2.5 rounded-lg {qr.chip} font-medium text-left transition flex items-center space-x-2 group {qr.extraClass || ''}"
              >
                <qr.Icon class="h-4 w-4 {qr.iconColor} shrink-0" />
                <div class="truncate">
                  <div class="font-bold text-[#0F1D2B] dark:text-white {qr.hoverText}">{qr.label}</div>
                  <div class="text-[10px] {qr.sub} truncate">{qr.name}</div>
                </div>
              </button>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>


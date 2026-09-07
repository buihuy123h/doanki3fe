<script module lang="ts">
  // Mirrors components/layout/DashboardLayout.tsx of the React original.
  import type { Component, Snippet } from 'svelte';

  export interface NavItem {
    id: string;
    label: string;
    // lucide-svelte icons are typed as LegacyComponentType; use a permissive type here
    icon: any;
    badge?: string | number;
    badgeColor?: string;
  }
</script>

<script lang="ts">
  import {
    Menu, Search, Settings, Bell, LogOut, Download, Plus, Sparkles,
    ShieldCheck, ShoppingBag, Wrench, Calculator, User, Sun, Moon,
  } from 'lucide-svelte';
  import { toast } from 'svelte-sonner';
  import { authStore } from '../../context/AuthContext';
  import { themeStore } from '../../context/ThemeContext';
  import { languageStore } from '../../context/LanguageContext';
  import LanguageToggle from './LanguageToggle.svelte';
  import { navigate } from '../../lib/router';

  let {
    activeTab,
    onTabChange,
    navItems,
    pageTitle,
    roleBadgeTitle,
    children,
    exportAction,
    primaryAction,
    customHeaderActions,
  }: {
    activeTab: string;
    onTabChange: (tabId: string) => void;
    navItems: NavItem[];
    pageTitle?: string;
    roleBadgeTitle?: string;
    children: Snippet;
    exportAction?: { label?: string; onClick: () => void };
    primaryAction?: { label: string; onClick: () => void; icon?: any };
    customHeaderActions?: Snippet;
  } = $props();

  const { currentUser, logout } = authStore;
  const { theme, toggleTheme } = themeStore;
  const { t, language } = languageStore;

  // Search expanding state
  let isSearchExpanded = $state(false);
  let searchQuery = $state('');

  // Sidebar open/closed state with 0.3s transition (persisted in localStorage)
  let isSidebarOpen = $state(
    (() => {
      const saved = localStorage.getItem('nexus_sidebar_open');
      return saved !== null ? saved === 'true' : true;
    })()
  );

  $effect(() => {
    localStorage.setItem('nexus_sidebar_open', String(isSidebarOpen));
  });

  const toggleSidebar = () => {
    isSidebarOpen = !isSidebarOpen;
  };

  // Tự động giấu sidebar khi bấm ra vùng main (chỉ áp dụng trên thiết bị di động / tablet)
  const handleMainClick = () => {
    if (isSidebarOpen && window.innerWidth <= 768) {
      isSidebarOpen = false;
    }
  };

  // Live ticking date and time for the greeting banner
  let currentTime = $state(new Date());

  $effect(() => {
    const timer = setInterval(() => {
      currentTime = new Date();
    }, 1000);
    return () => clearInterval(timer);
  });

  // Format greeting based on hour
  const greeting = $derived.by(() => {
    const hour = currentTime.getHours();
    if (hour < 12) return $t.greetings.morning;
    if (hour < 18) return $t.greetings.afternoon;
    return $t.greetings.evening;
  });

  // Format date and time matching screenshot style: localized for EN/VI
  const formattedDateTime = $derived(
    currentTime.toLocaleDateString($language === 'vi' ? 'vi-VN' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }) +
      ($language === 'vi' ? ' lúc ' : ' at ') +
      currentTime.toLocaleTimeString($language === 'vi' ? 'vi-VN' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      })
  );

  const handleLogout = () => {
    logout();
    toast.info($language === 'vi' ? 'Đã đăng xuất khỏi phiên làm việc.' : 'Signed out successfully.');
    navigate('/login');
  };

  // Resolve current active item for page title fallback
  const currentTitle = $derived(
    pageTitle || navItems.find((item) => item.id === activeTab)?.label || $t.common.dashboard
  );

  // Sidebar footer role icon (derived, not {@const}: must live in script scope)
  const SidebarRoleIcon = $derived(
    $currentUser?.role === 'admin' ? ShieldCheck :
    $currentUser?.role === 'retail' ? ShoppingBag :
    $currentUser?.role === 'technical' ? Wrench :
    $currentUser?.role === 'accounts' ? Calculator : User
  );
</script>

<div class="flex h-screen w-full bg-[#E0F1FF] dark:bg-[#1B2D40] text-[#1B2D40] dark:text-[#E0F1FF] font-sans antialiased overflow-hidden transition-colors duration-300">
  <!-- 1. LEFT SIDEBAR (Unscrollable, 0.3s animated toggle) -->
  <aside
    class="transition-all duration-300 ease-in-out shrink-0 bg-[#EDF6FF] dark:bg-[#152434] border-r border-[#CCE4F7] dark:border-[#253D56] flex flex-col justify-between z-30 h-full select-none overflow-hidden {isSidebarOpen
      ? 'w-64 min-w-[16rem] opacity-100 shadow-sm'
      : 'w-0 min-w-0 opacity-0 overflow-hidden border-r-0'}"
  >
    <div class="flex flex-col h-full overflow-hidden">
      <!-- Top Brand Bar -->
      <div class="h-16 border-b border-[#CCE4F7] dark:border-[#253D56] flex items-center px-5 space-x-3 shrink-0">
        <div class="h-9 w-9 rounded-full bg-[#D8ECFC] dark:bg-[#1E3349] border border-[#BBDDF5] dark:border-[#2A4460] flex items-center justify-center text-sky-700 dark:text-sky-300 shadow-xs shrink-0">
          <Sparkles class="h-4 w-4" />
        </div>
        <div class="min-w-0 flex-1 truncate">
          <div class="font-bold text-base tracking-tight text-sky-900 dark:text-sky-300 leading-tight flex items-center gap-1">
            <span>Nexus</span>
            <span class="text-[10px] uppercase tracking-wider text-sky-800 dark:text-sky-200 font-semibold bg-sky-500/15 px-1 rounded">
              {$currentUser?.role || 'SMS'}
            </span>
          </div>
          <div class="text-[11px] text-[#537292] dark:text-[#8DB0D4] truncate">Nexus Marketing System</div>
        </div>
      </div>

      <!-- Navigation Items List - strictly unscrollable -->
      <nav class="flex-1 py-4 overflow-hidden space-y-0.5">
        {#each navItems as item (item.id)}
          {@const Icon = item.icon}
          {@const isActive = activeTab === item.id}
          <button
            onclick={() => onTabChange(item.id)}
            class="w-full flex items-center justify-between py-3 px-4 text-sm font-medium transition-all duration-200 group text-left {isActive
              ? 'border-l-4 border-sky-600 dark:border-sky-400 bg-white/90 dark:bg-[#1E3349] text-sky-700 dark:text-sky-300 font-semibold shadow-xs'
              : 'border-l-4 border-transparent text-[#2C4764] dark:text-[#94B5D6] hover:text-[#0F1D2B] dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#1E3349]/50'}"
          >
            <div class="flex items-center space-x-3.5 min-w-0 truncate">
              <Icon
                class="h-4 w-4 shrink-0 transition-colors {isActive
                  ? 'text-sky-600 dark:text-sky-400'
                  : 'text-[#537292] dark:text-[#7A9BBF] group-hover:text-[#0F1D2B] dark:group-hover:text-white'}"
              />
              <span class="truncate">{item.label}</span>
            </div>

            {#if item.badge !== undefined}
              <span
                class="text-xs px-2 py-0.5 rounded-full shrink-0 font-medium {item.badgeColor ||
                  (isActive
                    ? 'bg-sky-600 dark:bg-sky-500 text-white'
                    : 'bg-sky-100 dark:bg-[#1E3349] text-sky-800 dark:text-sky-200 border border-[#CCE4F7] dark:border-[#253D56]')}"
              >
                {item.badge}
              </span>
            {/if}
          </button>
        {/each}
      </nav>

      <!-- Sidebar Footer / Current User Badge -->
      <div class="p-3.5 border-t border-[#CCE4F7] dark:border-[#253D56] bg-[#E5F2FC]/70 dark:bg-[#111E2C]/70 text-xs text-[#537292] dark:text-[#88A9CB] space-y-1.5 shrink-0">
        <div class="flex items-center space-x-2 text-[#1B2D40] dark:text-[#E0F1FF] font-semibold truncate">
          <SidebarRoleIcon class="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
          <span class="truncate">{roleBadgeTitle || ($currentUser?.role && $t.roles[$currentUser.role]) || $currentUser?.title || 'Nexus User'}</span>
        </div>
        <div class="text-[10px] text-[#6B8FB5] dark:text-[#5E7F9F] flex items-center justify-between pt-0.5">
          <span>{$t.common.stationReady}</span>
          <span>v2.4</span>
        </div>
      </div>
    </div>
  </aside>

  <!-- 2. RIGHT COLUMN: FIXED HEADER + SCROLLABLE MAIN -->
  <div class="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
    <!-- Mobile & Tablet Backdrop Overlay when sidebar is open -->
    {#if isSidebarOpen}
      <div
        onclick={() => (isSidebarOpen = false)}
        class="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-25 md:hidden transition-opacity duration-300"
        title="Bấm vào đây để giấu sidebar"
      />
    {/if}
    <!-- Top Header Bar - Fixed height, never scrolls -->
    <header class="shrink-0 h-16 bg-white/95 dark:bg-[#172738]/95 border-b border-[#CCE4F7] dark:border-[#253D56] flex items-center justify-between px-4 sm:px-6 shadow-xs z-20 backdrop-blur-md transition-colors duration-300">
      <!-- Left: 3-Stripes Hamburger Toggle + Current Page Title -->
      <div class="flex items-center space-x-3 sm:space-x-4 min-w-0">
        <button
          onclick={toggleSidebar}
          class="flex items-center justify-center h-9 w-9 rounded-lg text-[#1B2D40] dark:text-[#E0F1FF] hover:bg-[#EDF6FF] dark:hover:bg-[#1E3349] transition active:scale-95 shrink-0"
          title={isSidebarOpen ? 'Đóng sidebar (0.3s)' : 'Mở sidebar (0.3s)'}
        >
          <Menu class="h-5 w-5" />
        </button>

        <h1 class="text-base sm:text-lg font-bold text-[#0F1D2B] dark:text-white tracking-tight truncate">
          {currentTitle}
        </h1>
      </div>

      <!-- Right: Circular Action Buttons & User Profile / Logout -->
      <div class="flex items-center space-x-2 sm:space-x-3">
        <!-- Custom Header Actions if passed -->
        {#if customHeaderActions}{@render customHeaderActions()}{/if}

        <!-- Expandable Search Input -->
        <div
          class="flex items-center h-9 rounded-full transition-all duration-300 overflow-hidden shadow-xs border {isSearchExpanded
            ? 'w-48 sm:w-64 bg-white dark:bg-[#101C29] border-[#CCE4F7] dark:border-[#253D56] px-1'
            : 'w-9 bg-[#EDF6FF] dark:bg-[#1E3349] border-[#CCE4F7] dark:border-[#253D56] hover:bg-[#DCEEFE] dark:hover:bg-[#253E58]'}"
        >
          <button
            onclick={() => {
              if (isSearchExpanded && searchQuery) {
                toast.info(`Tìm kiếm: ${searchQuery}`);
              } else {
                isSearchExpanded = !isSearchExpanded;
              }
            }}
            class="shrink-0 rounded-full flex items-center justify-center text-[#1B2D40] dark:text-[#E0F1FF] transition-colors {isSearchExpanded
              ? 'h-7 w-7 hover:bg-[#EDF6FF] dark:hover:bg-[#253E58] ml-1'
              : 'h-full w-full'}"
            title={$t.common.search}
          >
            <Search class="h-4 w-4" />
          </button>
          {#if isSearchExpanded}
            <input
              type="text"
              placeholder={$t.common.searchPlaceholder}
              bind:value={searchQuery}
              onkeydown={(e) => {
                if (e.key === 'Enter' && searchQuery) {
                  toast.info(`${$t.common.search}: ${searchQuery}`);
                } else if (e.key === 'Escape') {
                  isSearchExpanded = false;
                }
              }}
              onblur={() => {
                if (!searchQuery) isSearchExpanded = false;
              }}
              class="bg-transparent border-none outline-none text-sm text-[#0F1D2B] dark:text-white placeholder-[#7899B8] dark:placeholder-slate-500 transition-all duration-300 w-full opacity-100 px-2"
            />
          {/if}
        </div>

        <!-- Circular Settings Button -->
        <button
          onclick={() => onTabChange('settings')}
          class="h-9 w-9 rounded-full bg-[#EDF6FF] dark:bg-[#1E3349] hover:bg-[#DCEEFE] dark:hover:bg-[#253E58] text-[#1B2D40] dark:text-[#E0F1FF] border border-[#CCE4F7] dark:border-[#253D56] flex items-center justify-center transition shadow-xs"
          title={$t.common.settings}
        >
          <Settings class="h-4 w-4" />
        </button>

        <!-- Language Switcher Button (EN / VI) -->
        <LanguageToggle />

        <!-- Circular Theme Toggle Button (Light/Dark Mode) -->
        <button
          onclick={toggleTheme}
          class="h-9 w-9 rounded-full bg-[#EDF6FF] dark:bg-[#1E3349] hover:bg-[#DCEEFE] dark:hover:bg-[#253E58] text-[#1B2D40] dark:text-[#E0F1FF] border border-[#CCE4F7] dark:border-[#253D56] flex items-center justify-center transition-all duration-200 shadow-xs hover:scale-105 active:scale-95 group"
          title={$theme === 'dark' ? $t.common.themeLight : $t.common.themeDark}
        >
          {#if $theme === 'dark'}
            <Sun class="h-4 w-4 text-amber-400 group-hover:rotate-45 transition-transform" />
          {:else}
            <Moon class="h-4 w-4 text-sky-700 group-hover:-rotate-12 transition-transform" />
          {/if}
        </button>
        <!-- Circular Notification Bell with Badge Count 8 -->
        <button
          onclick={() => toast.info(`${$t.common.notifications}: 8 unread alerts`)}
          class="h-9 w-9 rounded-full bg-[#EDF6FF] dark:bg-[#1E3349] hover:bg-[#DCEEFE] dark:hover:bg-[#253E58] text-[#1B2D40] dark:text-[#E0F1FF] border border-[#CCE4F7] dark:border-[#253D56] flex items-center justify-center transition shadow-xs relative"
          title="{$t.common.notifications} (8)"
        >
          <Bell class="h-4 w-4" />
          <span class="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
            8
          </span>
        </button>

        <!-- User Profile & Logout Box -->
        {#if $currentUser}
          <div class="flex items-center p-1 pl-2 pr-1.5 bg-[#EDF6FF]/90 dark:bg-[#1E3349]/90 border border-[#CCE4F7] dark:border-[#253D56] rounded-full shadow-xs space-x-2">
            <div class="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-sky-600 to-blue-600 text-white font-bold text-xs shadow-inner">
              {$currentUser.name.charAt(0)}
            </div>
            <div class="text-right hidden md:block pr-1">
              <div class="text-xs font-bold text-[#0F1D2B] dark:text-white leading-none">{$currentUser.name}</div>
              <div class="text-[10px] text-[#537292] dark:text-[#8DB0D4] leading-none mt-0.5">{$currentUser.title}</div>
            </div>
            <button
              onclick={handleLogout}
              class="flex items-center justify-center h-7 w-7 rounded-full bg-rose-500/10 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 transition active:scale-95"
              title={$t.common.logout}
            >
              <LogOut class="h-3.5 w-3.5" />
            </button>
          </div>
        {/if}
      </div>
    </header>

    <!-- 3. MAIN DASHBOARD CONTENT AREA - THE ONLY SCROLLABLE AREA -->
    <main
      onclick={handleMainClick}
      class="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-[#E0F1FF] dark:bg-[#1B2D40] transition-colors duration-300"
    >
      <!-- Greeting Banner -->
      <div class="pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl sm:text-2xl font-bold text-[#0F1D2B] dark:text-white tracking-tight flex items-center gap-2">
            <span>
              {greeting}, {$currentUser?.name ? $currentUser.name.split(' ')[0] : 'Admin'}
            </span>
            <span class="text-xl">👋</span>
          </h2>
          <p class="text-xs text-[#537292] dark:text-[#8DB0D4] mt-1 font-medium">{formattedDateTime}</p>
        </div>

        <!-- Action buttons (Export + Primary Action) -->
        <div class="flex items-center space-x-2.5">
          <button
            onclick={exportAction?.onClick || (() => toast.success($language === 'vi' ? 'Đang xuất báo cáo tổng quan...' : 'Exporting overview report...'))}
            class="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-[#1E3349] hover:bg-sky-50 dark:hover:bg-[#253E58] border border-[#CCE4F7] dark:border-[#253D56] text-[#1B2D40] dark:text-[#E0F1FF] shadow-xs transition active:scale-95"
          >
            <Download class="h-3.5 w-3.5 text-[#537292] dark:text-[#8DB0D4]" />
            <span>{exportAction?.label || $t.actions.export}</span>
          </button>

          {#if primaryAction}
            <button
              onclick={primaryAction.onClick}
              class="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition active:scale-95"
            >
              {#if primaryAction.icon}
                {@const PrimaryIcon = primaryAction.icon}
                <PrimaryIcon class="h-3.5 w-3.5" />
              {:else}
                <Plus class="h-3.5 w-3.5" />
              {/if}
              <span>{primaryAction.label}</span>
            </button>
          {:else}
            <button
              onclick={() => toast.info($t.actions.newReport)}
              class="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition active:scale-95"
            >
              <Plus class="h-3.5 w-3.5" />
              <span>{$t.actions.newReport}</span>
            </button>
          {/if}
        </div>
      </div>

      <!-- Page Tab Children -->
      {@render children()}
    </main>
  </div>
</div>

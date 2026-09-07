<script lang="ts">
  // Mirrors pages/IndexPage.tsx of the React original.
  import { authStore } from '../context/AuthContext';
  import { nexusStore } from '../context/NexusContext';
  import { themeStore } from '../context/ThemeContext';
  import { languageStore } from '../context/LanguageContext';
  import LanguageToggle from '../components/layout/LanguageToggle.svelte';
  import { dashboardPathForRole, navigate } from '../lib/router';
  import {
    Layers, Sparkles, Wifi, Radio, Phone, ShieldCheck, Zap, Server,
    CheckCircle2, ArrowRight, Sun, Moon, LogOut, User, MapPin, Clock,
    ChevronRight, PhoneCall, HardDrive,
  } from 'lucide-svelte';

  const { currentUser, logout } = authStore;
  const { theme, toggleTheme } = themeStore;
  const { t, language } = languageStore;
  const { plans, inventory, retailShops } = nexusStore;
  import { toast } from 'svelte-sonner';

  // Filter tab for plans
  type Category = 'all' | 'Broadband' | 'Landline' | 'Dial-Up';
  let activeCategory = $state<Category>('all');

  const handleGoToDashboard = () => {
    if (!$currentUser) return;
    navigate(dashboardPathForRole($currentUser.role));
  };

  const handleOpenRegister = (_planName?: string) => {
    navigate('/register');
  };

  const handleLogout = () => {
    logout();
    toast.info($language === 'vi' ? 'Đã đăng xuất.' : 'Signed out.');
    navigate('/');
  };

  // Filter plans by selected category tab
  const filteredPlans = $derived(
    activeCategory === 'all' ? $plans : $plans.filter((p) => p.type === activeCategory)
  );

  const formatPrice = (price: number) =>
    $language === 'vi' ? `${price.toLocaleString('vi-VN')}₫/tháng` : `$${price.toFixed(2)}/mo`;
</script>

<div class="h-full w-full overflow-y-auto overflow-x-hidden bg-[#E0F1FF] dark:bg-[#1B2D40] text-[#1B2D40] dark:text-[#E0F1FF] font-sans antialiased selection:bg-sky-500 selection:text-white transition-colors duration-300">
  <!-- 1. TOP NAVBAR -->
  <header class="sticky top-0 z-40 w-full backdrop-blur-md bg-white/85 dark:bg-[#152434]/85 border-b border-[#CCE4F7] dark:border-[#253D56] transition-colors duration-300">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <!-- Brand Logo -->
      <button
        type="button"
        onclick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        class="flex items-center space-x-3 cursor-pointer group"
      >
        <div class="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
          <Layers class="h-5 w-5" />
        </div>
        <div class="text-left">
          <div class="font-extrabold text-lg text-sky-950 dark:text-white tracking-tight flex items-center gap-1.5">
            <span>{$t.common.brandName}</span>
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-700 dark:text-sky-300 tracking-wider">
              {$t.common.brandTag}
            </span>
          </div>
          <p class="text-[10px] text-[#537292] dark:text-[#8DB0D4] font-medium leading-none">
            {$t.common.brandSubtitle}
          </p>
        </div>
      </button>

      <!-- Nav Links -->
      <nav class="hidden md:flex items-center space-x-6 text-sm font-semibold text-[#3A5B7E] dark:text-[#94B5D6]">
        <a href="#intro" class="hover:text-sky-600 dark:hover:text-white transition-colors">{$t.nav.about}</a>
        <a href="#plans" class="hover:text-sky-600 dark:hover:text-white transition-colors">{$t.nav.plans}</a>
        <a href="#hardware" class="hover:text-sky-600 dark:hover:text-white transition-colors">{$t.nav.hardware}</a>
        <a href="#shops" class="hover:text-sky-600 dark:hover:text-white transition-colors">{$t.nav.shops}</a>
      </nav>

      <!-- Right Action Buttons -->
      <div class="flex items-center space-x-2.5">
        <!-- Language Switcher (EN / VI) -->
        <LanguageToggle />

        <!-- Theme Toggle -->
        <button
          onclick={toggleTheme}
          class="h-9 w-9 rounded-full bg-[#EDF6FF] dark:bg-[#1E3349] hover:bg-[#DCEEFE] dark:hover:bg-[#253E58] text-[#1B2D40] dark:text-[#E0F1FF] border border-[#CCE4F7] dark:border-[#253D56] flex items-center justify-center transition shadow-xs"
          title={$theme === 'dark' ? $t.common.themeLight : $t.common.themeDark}
        >
          {#if $theme === 'dark'}
            <Sun class="h-4 w-4 text-amber-400" />
          {:else}
            <Moon class="h-4 w-4 text-sky-700" />
          {/if}
        </button>

        <!-- Authenticated State vs Guest State -->
        {#if $currentUser}
          <div class="flex items-center space-x-2">
            <button
              onclick={handleGoToDashboard}
              class="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition flex items-center space-x-1.5"
            >
              <User class="h-3.5 w-3.5" />
              <span class="hidden sm:inline">{$t.common.dashboard} ({$currentUser.name.split(' ')[0]})</span>
              <span class="sm:hidden">{$t.common.dashboard}</span>
            </button>
            <button
              onclick={handleLogout}
              class="h-9 w-9 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center transition"
              title={$t.common.logout}
            >
              <LogOut class="h-4 w-4" />
            </button>
          </div>
        {:else}
          <div class="flex items-center space-x-2">
            <button
              onclick={() => navigate('/login')}
              class="px-3.5 py-2 rounded-xl text-xs font-bold text-[#1B2D40] dark:text-white bg-[#EDF6FF] dark:bg-[#1E3349] hover:bg-[#D8ECFC] dark:hover:bg-[#253E58] border border-[#CCE4F7] dark:border-[#253D56] transition shadow-xs"
            >
              {$t.common.login}
            </button>
            <button
              onclick={() => handleOpenRegister()}
              class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 shadow-md shadow-sky-600/20 transition active:scale-95 flex items-center space-x-1"
            >
              <Sparkles class="h-3.5 w-3.5" />
              <span>{$t.common.register}</span>
            </button>
          </div>
        {/if}
      </div>
    </div>
  </header>

  <!-- 2. HERO BANNER -->
  <section class="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
    <!-- Background decorative glows -->
    <div class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-sky-400/20 dark:bg-sky-600/10 blur-[120px] rounded-full pointer-events-none"></div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
      <!-- Badge -->
      <div class="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/25 text-sky-700 dark:text-sky-300 text-xs font-semibold mb-6">
        <Sparkles class="h-3.5 w-3.5" />
        <span>{$t.hero.badge}</span>
      </div>

      <!-- Main Title -->
      <h1 class="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight sm:leading-none">
        {$t.hero.titleLine1} <br class="hidden sm:block" />
        <span class="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
          {$t.hero.titleLine2}
        </span>
      </h1>

      <!-- Subtitle -->
      <p class="mt-6 text-base sm:text-lg text-[#537292] dark:text-[#94B5D6] max-w-2xl mx-auto font-normal">
        {$t.hero.subtitle}
      </p>

      <!-- Call to Actions -->
      <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
        <a
          href="#plans"
          class="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-lg shadow-sky-600/25 transition active:scale-95 flex items-center justify-center space-x-2"
        >
          <span>{$t.hero.explorePlans}</span>
          <ArrowRight class="h-4 w-4" />
        </a>
        <button
          onclick={() => handleOpenRegister()}
          class="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm bg-white dark:bg-[#1E3349] hover:bg-sky-50 dark:hover:bg-[#253E58] text-[#1B2D40] dark:text-white border border-[#CCE4F7] dark:border-[#253D56] shadow-sm transition active:scale-95 flex items-center justify-center space-x-2"
        >
          <span>{$t.hero.registerFree}</span>
        </button>
      </div>

      <!-- Key Metrics Stats Ticker -->
      <div class="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
        <div class="p-4 rounded-2xl bg-white/70 dark:bg-[#152434]/70 border border-[#CCE4F7] dark:border-[#253D56] backdrop-blur-sm shadow-xs">
          <div class="text-2xl sm:text-3xl font-extrabold text-sky-600 dark:text-sky-400">99.99%</div>
          <div class="text-xs font-medium text-[#537292] dark:text-[#8DB0D4] mt-1">{$t.hero.statUptime}</div>
        </div>
        <div class="p-4 rounded-2xl bg-white/70 dark:bg-[#152434]/70 border border-[#CCE4F7] dark:border-[#253D56] backdrop-blur-sm shadow-xs">
          <div class="text-2xl sm:text-3xl font-extrabold text-sky-600 dark:text-sky-400">300+ Mbps</div>
          <div class="text-xs font-medium text-[#537292] dark:text-[#8DB0D4] mt-1">{$t.hero.statSpeed}</div>
        </div>
        <div class="p-4 rounded-2xl bg-white/70 dark:bg-[#152434]/70 border border-[#CCE4F7] dark:border-[#253D56] backdrop-blur-sm shadow-xs">
          <div class="text-2xl sm:text-3xl font-extrabold text-sky-600 dark:text-sky-400">50,000+</div>
          <div class="text-xs font-medium text-[#537292] dark:text-[#8DB0D4] mt-1">{$t.hero.statUsers}</div>
        </div>
        <div class="p-4 rounded-2xl bg-white/70 dark:bg-[#152434]/70 border border-[#CCE4F7] dark:border-[#253D56] backdrop-blur-sm shadow-xs">
          <div class="text-2xl sm:text-3xl font-extrabold text-sky-600 dark:text-sky-400">24/7/365</div>
          <div class="text-xs font-medium text-[#537292] dark:text-[#8DB0D4] mt-1">{$t.hero.statSupport}</div>
        </div>
      </div>
    </div>
  </section>

  <!-- 3. SECTION: PRODUCT INTRODUCTION & TECHNOLOGY -->
  <section id="intro" class="py-16 bg-white/60 dark:bg-[#152434]/60 border-y border-[#CCE4F7] dark:border-[#253D56]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center max-w-3xl mx-auto mb-12">
        <span class="text-xs uppercase font-bold tracking-wider text-sky-600 dark:text-sky-400">
          {$t.intro.badge}
        </span>
        <h2 class="text-2xl sm:text-3xl font-bold text-[#0F1D2B] dark:text-white mt-2">
          {$t.intro.title}
        </h2>
        <p class="text-sm text-[#537292] dark:text-[#8DB0D4] mt-3">
          {$t.intro.subtitle}
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Card 1 -->
        <div class="p-6 rounded-2xl bg-white dark:bg-[#1E3349] border border-[#CCE4F7] dark:border-[#253D56] shadow-xs hover:shadow-md transition-shadow">
          <div class="h-12 w-12 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-4">
            <Wifi class="h-6 w-6" />
          </div>
          <h3 class="font-bold text-base text-[#0F1D2B] dark:text-white mb-2">{$t.intro.card1Title}</h3>
          <p class="text-xs text-[#537292] dark:text-[#8DB0D4] leading-relaxed">{$t.intro.card1Desc}</p>
        </div>

        <!-- Card 2 -->
        <div class="p-6 rounded-2xl bg-white dark:bg-[#1E3349] border border-[#CCE4F7] dark:border-[#253D56] shadow-xs hover:shadow-md transition-shadow">
          <div class="h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
            <Server class="h-6 w-6" />
          </div>
          <h3 class="font-bold text-base text-[#0F1D2B] dark:text-white mb-2">{$t.intro.card2Title}</h3>
          <p class="text-xs text-[#537292] dark:text-[#8DB0D4] leading-relaxed">{$t.intro.card2Desc}</p>
        </div>

        <!-- Card 3 -->
        <div class="p-6 rounded-2xl bg-white dark:bg-[#1E3349] border border-[#CCE4F7] dark:border-[#253D56] shadow-xs hover:shadow-md transition-shadow">
          <div class="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
            <Phone class="h-6 w-6" />
          </div>
          <h3 class="font-bold text-base text-[#0F1D2B] dark:text-white mb-2">{$t.intro.card3Title}</h3>
          <p class="text-xs text-[#537292] dark:text-[#8DB0D4] leading-relaxed">{$t.intro.card3Desc}</p>
        </div>

        <!-- Card 4 -->
        <div class="p-6 rounded-2xl bg-white dark:bg-[#1E3349] border border-[#CCE4F7] dark:border-[#253D56] shadow-xs hover:shadow-md transition-shadow">
          <div class="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
            <Radio class="h-6 w-6" />
          </div>
          <h3 class="font-bold text-base text-[#0F1D2B] dark:text-white mb-2">{$t.intro.card4Title}</h3>
          <p class="text-xs text-[#537292] dark:text-[#8DB0D4] leading-relaxed">{$t.intro.card4Desc}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- 4. SECTION: PLANS & SERVICES DIRECTORY -->
  <section id="plans" class="py-16 sm:py-20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center max-w-3xl mx-auto mb-10">
        <span class="text-xs uppercase font-bold tracking-wider text-sky-600 dark:text-sky-400">
          {$t.plans.badge}
        </span>
        <h2 class="text-3xl font-bold text-[#0F1D2B] dark:text-white mt-1">{$t.plans.title}</h2>
        <p class="text-sm text-[#537292] dark:text-[#8DB0D4] mt-2">{$t.plans.subtitle}</p>

        <!-- Category Filter Pills -->
        <div class="mt-8 inline-flex p-1 bg-white/80 dark:bg-[#152434]/80 border border-[#CCE4F7] dark:border-[#253D56] rounded-xl shadow-xs">
          <button
            onclick={() => (activeCategory = 'all')}
            class="px-4 py-2 rounded-lg text-xs font-bold transition-all {activeCategory === 'all'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-[#537292] dark:text-[#8DB0D4] hover:text-[#0F1D2B] dark:hover:text-white'}"
          >
            {$t.plans.tabAll} ({$plans.length})
          </button>
          <button
            onclick={() => (activeCategory = 'Broadband')}
            class="px-4 py-2 rounded-lg text-xs font-bold transition-all {activeCategory === 'Broadband'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-[#537292] dark:text-[#8DB0D4] hover:text-[#0F1D2B] dark:hover:text-white'}"
          >
            {$t.plans.tabBroadband}
          </button>
          <button
            onclick={() => (activeCategory = 'Landline')}
            class="px-4 py-2 rounded-lg text-xs font-bold transition-all {activeCategory === 'Landline'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-[#537292] dark:text-[#8DB0D4] hover:text-[#0F1D2B] dark:hover:text-white'}"
          >
            {$t.plans.tabLandline}
          </button>
          <button
            onclick={() => (activeCategory = 'Dial-Up')}
            class="px-4 py-2 rounded-lg text-xs font-bold transition-all {activeCategory === 'Dial-Up'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-[#537292] dark:text-[#8DB0D4] hover:text-[#0F1D2B] dark:hover:text-white'}"
          >
            {$t.plans.tabDialup}
          </button>
        </div>
      </div>

      <!-- Plan Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each filteredPlans as plan (plan.id)}
          {@const isHighlight = plan.name.includes('Ultra') || plan.name.includes('Prime')}
          <div
            class="rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 relative {isHighlight
              ? 'bg-gradient-to-b from-white to-sky-50/50 dark:from-[#1A2C3F] dark:to-[#152434] border-2 border-sky-500 dark:border-sky-400 shadow-lg shadow-sky-500/10 scale-102'
              : 'bg-white dark:bg-[#152434] border border-[#CCE4F7] dark:border-[#253D56] shadow-sm hover:shadow-md'}"
          >
            {#if isHighlight}
              <div class="absolute -top-3 right-6 px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-sky-600 text-white shadow-sm">
                {$t.plans.popular}
              </div>
            {/if}

            <div>
              <!-- Header -->
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold px-2.5 py-1 rounded-md bg-sky-100 dark:bg-[#1E3349] text-sky-700 dark:text-sky-300">
                  {plan.type}
                </span>
                <span class="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 class="h-3.5 w-3.5" />
                  {$t.plans.readyToInstall}
                </span>
              </div>

              <h3 class="font-bold text-lg text-[#0F1D2B] dark:text-white mt-3">{plan.name}</h3>
              <p class="text-xs text-[#537292] dark:text-[#8DB0D4] mt-1 line-clamp-2">{plan.description}</p>

              <!-- Price Tag -->
              <div class="mt-4 pt-4 border-t border-[#CCE4F7]/60 dark:border-[#253D56]/60 flex items-baseline gap-1">
                <span class="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                  ${plan.monthlyRental}
                </span>
                <span class="text-xs text-[#537292] dark:text-[#8DB0D4] font-medium">{$t.plans.perMonth}</span>
              </div>

              <!-- Highlights -->
              <div class="mt-5 space-y-2.5 text-xs text-[#2C4764] dark:text-[#94B5D6]">
                <div class="flex items-center space-x-2">
                  <Zap class="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
                  <span><strong>{$t.plans.speed}</strong> {plan.speedOrBandwidth}</span>
                </div>
                <div class="flex items-center space-x-2">
                  <HardDrive class="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
                  <span><strong>{$t.plans.dataLimit}</strong> {plan.dataLimit}</span>
                </div>
                <div class="flex items-center space-x-2">
                  <ShieldCheck class="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
                  <span><strong>{$t.plans.securityDeposit}</strong> ${plan.securityDeposit}</span>
                </div>
                {#if plan.hourlyCharge !== undefined && plan.hourlyCharge > 0}
                  <div class="flex items-center space-x-2">
                    <Clock class="h-4 w-4 text-amber-500 shrink-0" />
                    <span><strong>{$t.plans.hourlyCharge}</strong> ${plan.hourlyCharge}/hr</span>
                  </div>
                {/if}
              </div>
            </div>

            <!-- Subscribe CTA -->
            <div class="mt-6">
              <button
                onclick={() => handleOpenRegister(plan.name)}
                class="w-full py-2.5 rounded-xl font-bold text-xs transition active:scale-95 flex items-center justify-center space-x-1.5 {isHighlight
                  ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-sm'
                  : 'bg-[#EDF6FF] dark:bg-[#1E3349] hover:bg-sky-100 dark:hover:bg-[#253E58] text-sky-800 dark:text-sky-200 border border-[#CCE4F7] dark:border-[#253D56]'}"
              >
                <span>{$t.plans.subscribeBtn}</span>
                <ChevronRight class="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- 5. SECTION: HARDWARE & CPE CATALOG -->
  <section id="hardware" class="py-16 bg-white/60 dark:bg-[#152434]/60 border-t border-[#CCE4F7] dark:border-[#253D56]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
        <div>
          <span class="text-xs uppercase font-bold tracking-wider text-sky-600 dark:text-sky-400">{$t.hardware.badge}</span>
          <h2 class="text-2xl sm:text-3xl font-bold text-[#0F1D2B] dark:text-white mt-1">{$t.hardware.title}</h2>
          <p class="text-sm text-[#537292] dark:text-[#8DB0D4] mt-1">{$t.hardware.subtitle}</p>
        </div>
        <button
          onclick={() => handleOpenRegister('Hardware inquiry')}
          class="inline-flex items-center space-x-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline shrink-0"
        >
          <span>{$t.hardware.bulkQuote}</span>
          <ArrowRight class="h-3.5 w-3.5" />
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {#each $inventory.slice(0, 4) as item (item.id)}
          <div class="p-5 rounded-2xl bg-white dark:bg-[#1E3349] border border-[#CCE4F7] dark:border-[#253D56] shadow-xs hover:shadow-md transition flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between text-xs mb-3">
                <span class="font-mono text-[10px] text-[#537292] dark:text-[#8DB0D4] bg-[#EDF6FF] dark:bg-[#152434] px-2 py-0.5 rounded border border-[#CCE4F7] dark:border-[#253D56]">
                  {item.itemCode}
                </span>
                <span class="font-semibold text-emerald-600 dark:text-emerald-400 text-[11px]">
                  {item.stockQuantity} {$t.hardware.inStock}
                </span>
              </div>

              <div class="h-10 w-10 rounded-xl bg-sky-50 dark:bg-[#152434] border border-[#CCE4F7] dark:border-[#253D56] flex items-center justify-center text-sky-600 dark:text-sky-400 mb-3">
                <Server class="h-5 w-5" />
              </div>

              <h4 class="font-bold text-sm text-[#0F1D2B] dark:text-white line-clamp-2">{item.name}</h4>
              <p class="text-xs text-[#537292] dark:text-[#8DB0D4] mt-1">{$t.hardware.supplier} {item.supplier}</p>
            </div>

            <div class="mt-5 pt-3 border-t border-[#CCE4F7]/60 dark:border-[#253D56]/60 flex items-center justify-between">
              <div>
                <div class="text-[10px] text-[#537292] dark:text-[#8DB0D4]">{$t.hardware.listPrice}</div>
                <div class="font-bold text-base text-slate-900 dark:text-white">${item.unitCost}</div>
              </div>
              <button
                onclick={() => handleOpenRegister(item.name)}
                class="px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition active:scale-95"
              >
                {$t.hardware.orderBtn}
              </button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- 6. SECTION: RETAIL OUTLETS & COVERAGE NETWORK -->
  <section id="shops" class="py-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center max-w-3xl mx-auto mb-12">
        <span class="text-xs uppercase font-bold tracking-wider text-sky-600 dark:text-sky-400">{$t.shops.badge}</span>
        <h2 class="text-3xl font-bold text-[#0F1D2B] dark:text-white mt-1">{$t.shops.title}</h2>
        <p class="text-sm text-[#537292] dark:text-[#8DB0D4] mt-2">{$t.shops.subtitle}</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {#each $retailShops as shop (shop.id)}
          <div class="p-5 rounded-2xl bg-white dark:bg-[#152434] border border-[#CCE4F7] dark:border-[#253D56] shadow-xs hover:shadow-md transition">
            <div class="flex items-center space-x-2 text-sky-600 dark:text-sky-400 mb-2">
              <MapPin class="h-4 w-4 shrink-0" />
              <span class="font-mono text-xs font-bold">{shop.shopCode}</span>
            </div>
            <h4 class="font-bold text-sm text-[#0F1D2B] dark:text-white">{shop.name}</h4>
            <p class="text-xs text-[#537292] dark:text-[#8DB0D4] mt-2">{shop.address}</p>

            <div class="mt-4 pt-3 border-t border-[#CCE4F7]/60 dark:border-[#253D56]/60 text-xs space-y-1.5 text-[#3A5B7E] dark:text-[#8DB0D4]">
              <div class="flex items-center space-x-1.5">
                <Clock class="h-3.5 w-3.5 text-[#537292] dark:text-[#8DB0D4] shrink-0" />
                <span class="truncate">{shop.operatingHours}</span>
              </div>
              <div class="flex items-center space-x-1.5">
                <PhoneCall class="h-3.5 w-3.5 text-[#537292] dark:text-[#8DB0D4] shrink-0" />
                <span>{shop.phone}</span>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- 7. FOOTER -->
  <footer class="bg-white/80 dark:bg-[#111E2C] border-t border-[#CCE4F7] dark:border-[#253D56] py-12 transition-colors">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div class="space-y-3">
          <div class="flex items-center space-x-2">
            <div class="h-8 w-8 rounded-lg bg-sky-600 text-white flex items-center justify-center">
              <Layers class="h-4 w-4" />
            </div>
            <span class="font-extrabold text-base tracking-tight text-[#0F1D2B] dark:text-white">
              {$t.common.brandName} {$t.common.brandTag}
            </span>
          </div>
          <p class="text-xs text-[#537292] dark:text-[#8DB0D4] leading-relaxed">
            {$t.footer.aboutText}
          </p>
        </div>

        <div>
          <h4 class="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white mb-3">
            {$t.footer.productsCol}
          </h4>
          <ul class="text-xs space-y-2 text-[#537292] dark:text-[#8DB0D4]">
            <li><a href="#plans" class="hover:underline">Broadband Fiber Ultra Giga</a></li>
            <li><a href="#plans" class="hover:underline">Enterprise VoIP & Landline</a></li>
            <li><a href="#plans" class="hover:underline">Dial-Up Telemetry Channels</a></li>
            <li><a href="#hardware" class="hover:underline">Wi-Fi 6 AX3000 Routers</a></li>
          </ul>
        </div>

        <div>
          <h4 class="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white mb-3">
            {$t.footer.rolesCol}
          </h4>
          <ul class="text-xs space-y-2 text-[#537292] dark:text-[#8DB0D4]">
            <li><button onclick={() => navigate('/login')} class="hover:underline">1. Executive Admin (Manager)</button></li>
            <li><button onclick={() => navigate('/login')} class="hover:underline">2. Retail Staff (Outlets)</button></li>
            <li><button onclick={() => navigate('/login')} class="hover:underline">3. Technical NOC (Field Ops)</button></li>
            <li><button onclick={() => navigate('/login')} class="hover:underline">4. Billing & Accounts (Finance)</button></li>
            <li><button onclick={() => navigate('/login')} class="hover:underline">5. Subscriber Portal (Customer)</button></li>
          </ul>
        </div>

        <div>
          <h4 class="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white mb-3">
            {$t.footer.supportCol}
          </h4>
          <div class="text-xs space-y-2 text-[#537292] dark:text-[#8DB0D4]">
            <p>NOC Hotline: <strong>1900 6868</strong> (24/7)</p>
            <p>Enterprise Support: <strong>+1 (800) 555-NEXUS</strong></p>
            <p>Email: <strong>support@nexus.telecom</strong></p>
            <p>Corporate HQ: 452 Broadway, Manhattan, NY</p>
          </div>
        </div>
      </div>

      <div class="pt-8 border-t border-[#CCE4F7]/60 dark:border-[#253D56]/60 text-center text-xs text-[#537292] dark:text-[#8DB0D4] flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>
          © 2026 {$t.footer.rights}
        </div>
        <div class="flex items-center space-x-4">
          <span class="hover:underline cursor-pointer">{$t.footer.terms}</span>
          <span class="hover:underline cursor-pointer">{$t.footer.privacy}</span>
          <span class="hover:underline cursor-pointer">{$t.footer.sla}</span>
        </div>
      </div>
    </div>
  </footer>
</div>


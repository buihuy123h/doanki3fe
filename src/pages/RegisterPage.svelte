<script lang="ts">
  // Mirrors pages/RegisterPage.tsx of the React original.
  import { authStore } from '../context/AuthContext';
  import { themeStore } from '../context/ThemeContext';
  import { languageStore } from '../context/LanguageContext';
  import LanguageToggle from '../components/layout/LanguageToggle.svelte';
  import { dashboardPathForRole, navigate } from '../lib/router';
  import {
    Layers, Lock, Mail, User, Phone, ArrowRight, ArrowLeft, Eye, EyeOff,
    Sun, Moon, Sparkles, CheckCircle2, Wifi, HardDrive, ShieldCheck, Receipt,
    MapPin, Building2, Star,
  } from 'lucide-svelte';
  import { toast } from 'svelte-sonner';

  const { register, currentUser } = authStore;
  const { theme, toggleTheme } = themeStore;
  const { t, language } = languageStore;

  // Form State
  let customerType = $state<'personal' | 'business'>('personal');
  let name = $state('');
  let email = $state('');
  let phone = $state('');
  let address = $state('');
  let serviceInterest = $state<'broadband' | 'landline' | 'dialup' | 'combo'>('broadband');
  let password = $state('');
  let confirmPassword = $state('');
  let agreeTerms = $state(true);
  let showPassword = $state(false);
  let errorMessage = $state('');

  // If already logged in, redirect immediately to their dashboard
  $effect(() => {
    if ($currentUser) {
      navigate(dashboardPathForRole($currentUser.role));
    }
  });

  const handleRegisterSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    errorMessage = '';

    if (!name.trim()) {
      errorMessage = $t.auth.fillAll;
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      errorMessage = $t.auth.invalidEmail;
      return;
    }

    if (password.length < 6) {
      errorMessage = $t.auth.passwordLength;
      return;
    }

    if (password !== confirmPassword) {
      errorMessage = $t.auth.passwordMismatch;
      return;
    }

    if (!agreeTerms) {
      errorMessage = $language === 'vi' ? 'Vui lòng đồng ý với Điều khoản dịch vụ để tiếp tục.' : 'Please accept the Terms of Service to proceed.';
      return;
    }

    const result = register({
      name: name.trim(),
      email: email.trim(),
      password,
      phone: phone.trim(),
    });

    if (result.success && result.user) {
      toast.success(`${$t.auth.registerSuccess} ${result.user.name}`);
      navigate('/user');
    } else {
      errorMessage = result.error || $t.auth.registerFailed;
      toast.error($t.auth.registerFailed);
    }
  };
</script>

<div class="min-h-screen w-full bg-[#E0F1FF] dark:bg-[#1B2D40] text-[#1B2D40] dark:text-[#E0F1FF] font-sans antialiased transition-colors duration-300 flex flex-col relative overflow-y-auto">
  <!-- Background ambient lighting -->
  <div class="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 opacity-0 dark:opacity-100 transition-opacity"></div>
  <div class="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-200/40 via-[#E0F1FF] to-[#E0F1FF] opacity-100 dark:opacity-0 transition-opacity"></div>
  <div class="fixed inset-0 pointer-events-none bg-[linear-gradient(to_right,#0284c70d_1px,transparent_1px),linear-gradient(to_bottom,#0284c70d_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:3rem_3rem]"></div>

  <!-- TOP NAVIGATION BAR -->
  <header class="sticky top-0 z-40 w-full backdrop-blur-md bg-white/85 dark:bg-[#152434]/85 border-b border-[#CCE4F7] dark:border-[#253D56] transition-colors duration-300">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <!-- Brand Logo & Back to Home -->
      <div class="flex items-center space-x-3">
        <button
          type="button"
          onclick={() => navigate('/')}
          class="h-9 px-3 rounded-full bg-[#EDF6FF] dark:bg-[#1E3349] hover:bg-[#DCEEFE] dark:hover:bg-[#253E58] text-[#1B2D40] dark:text-[#E0F1FF] border border-[#CCE4F7] dark:border-[#253D56] flex items-center space-x-1.5 transition text-xs font-semibold"
          title={$t.common.home}
        >
          <ArrowLeft class="h-3.5 w-3.5" />
          <span class="hidden sm:inline">{$t.common.home}</span>
        </button>

        <button
          type="button"
          onclick={() => navigate('/')}
          class="flex items-center space-x-2.5 cursor-pointer group"
        >
          <div class="h-9 w-9 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <Layers class="h-5 w-5" />
          </div>
          <div class="font-extrabold text-base text-sky-950 dark:text-white tracking-tight flex items-center gap-1.5 hidden sm:flex">
            <span>{$t.common.brandName}</span>
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-700 dark:text-sky-300 tracking-wider">
              {$t.common.brandTag}
            </span>
          </div>
        </button>
      </div>

      <!-- Right Action Controls -->
      <div class="flex items-center space-x-2.5">
        <LanguageToggle />
        <button
          type="button"
          onclick={toggleTheme}
          class="h-9 w-9 rounded-full bg-[#EDF6FF] dark:bg-[#1E3349] hover:bg-[#DCEEFE] dark:hover:bg-[#253E58] text-[#1B2D40] dark:text-[#E0F1FF] border border-[#CCE4F7] dark:border-[#253D56] flex items-center justify-center transition shadow-xs group"
          title={$theme === 'dark' ? $t.common.themeLight : $t.common.themeDark}
        >
          {#if $theme === 'dark'}
            <Sun class="h-4 w-4 text-amber-400 group-hover:rotate-45 transition-transform" />
          {:else}
            <Moon class="h-4 w-4 text-sky-700 group-hover:-rotate-12 transition-transform" />
          {/if}
        </button>
        <button
          type="button"
          onclick={() => navigate('/login')}
          class="px-3.5 py-1.5 rounded-lg text-xs font-bold text-sky-700 dark:text-sky-300 hover:bg-sky-100/50 dark:hover:bg-slate-800 transition"
        >
          {$t.common.login}
        </button>
      </div>
    </div>
  </header>
  <!-- MAIN TWO-COLUMN REGISTRATION WORKSPACE -->
  <main class="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
      <!-- LEFT COLUMN: BRAND VALUE PROPOSITION & TESTIMONIALS (5 cols) -->
      <div class="lg:col-span-5 space-y-6">
        <div>
          <span class="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/10 dark:bg-sky-400/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
            <span class="h-1.5 w-1.5 rounded-full bg-sky-500 animate-ping" />
            <span>NEXUS TELECOM ONBOARDING</span>
          </span>
          <h1 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#0F1D2B] dark:text-white mt-3">
            {$t.registrationPage.title}
          </h1>
          <p class="text-sm text-[#537292] dark:text-[#8DB0D4] mt-2 leading-relaxed">
            {$t.registrationPage.subtitle}
          </p>
        </div>

        <!-- 4 Benefits Grid -->
        <div class="space-y-3 pt-2">
          <div class="p-4 rounded-xl bg-white/80 dark:bg-[#152434]/80 border border-[#CCE4F7] dark:border-[#253D56] shadow-xs flex items-start space-x-3.5 backdrop-blur-xs transition">
            <div class="h-9 w-9 rounded-lg bg-sky-500/10 dark:bg-sky-400/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
              <Wifi class="h-5 w-5" />
            </div>
            <div>
              <h4 class="text-sm font-bold text-[#0F1D2B] dark:text-white">{$t.registrationPage.benefit1Title}</h4>
              <p class="text-xs text-[#537292] dark:text-[#8DB0D4] mt-0.5">{$t.registrationPage.benefit1Desc}</p>
            </div>
          </div>

          <div class="p-4 rounded-xl bg-white/80 dark:bg-[#152434]/80 border border-[#CCE4F7] dark:border-[#253D56] shadow-xs flex items-start space-x-3.5 backdrop-blur-xs transition">
            <div class="h-9 w-9 rounded-lg bg-emerald-500/10 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <HardDrive class="h-5 w-5" />
            </div>
            <div>
              <h4 class="text-sm font-bold text-[#0F1D2B] dark:text-white">{$t.registrationPage.benefit2Title}</h4>
              <p class="text-xs text-[#537292] dark:text-[#8DB0D4] mt-0.5">{$t.registrationPage.benefit2Desc}</p>
            </div>
          </div>

          <div class="p-4 rounded-xl bg-white/80 dark:bg-[#152434]/80 border border-[#CCE4F7] dark:border-[#253D56] shadow-xs flex items-start space-x-3.5 backdrop-blur-xs transition">
            <div class="h-9 w-9 rounded-lg bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck class="h-5 w-5" />
            </div>
            <div>
              <h4 class="text-sm font-bold text-[#0F1D2B] dark:text-white">{$t.registrationPage.benefit3Title}</h4>
              <p class="text-xs text-[#537292] dark:text-[#8DB0D4] mt-0.5">{$t.registrationPage.benefit3Desc}</p>
            </div>
          </div>

          <div class="p-4 rounded-xl bg-white/80 dark:bg-[#152434]/80 border border-[#CCE4F7] dark:border-[#253D56] shadow-xs flex items-start space-x-3.5 backdrop-blur-xs transition">
            <div class="h-9 w-9 rounded-lg bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
              <Receipt class="h-5 w-5" />
            </div>
            <div>
              <h4 class="text-sm font-bold text-[#0F1D2B] dark:text-white">{$t.registrationPage.benefit4Title}</h4>
              <p class="text-xs text-[#537292] dark:text-[#8DB0D4] mt-0.5">{$t.registrationPage.benefit4Desc}</p>
            </div>
          </div>
        </div>

        <!-- Social Proof Box -->
        <div class="p-4 rounded-xl bg-gradient-to-br from-sky-500/10 via-blue-500/5 to-transparent border border-sky-500/20 flex items-center space-x-3">
          <div class="flex -space-x-1.5 overflow-hidden">
            <div class="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-[#152434] bg-sky-600 text-white font-bold text-xs flex items-center justify-center">A</div>
            <div class="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-[#152434] bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">T</div>
            <div class="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-[#152434] bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">M</div>
          </div>
          <div class="text-xs">
            <div class="flex items-center space-x-1 text-amber-500">
              <Star class="h-3 w-3 fill-current" />
              <Star class="h-3 w-3 fill-current" />
              <Star class="h-3 w-3 fill-current" />
              <Star class="h-3 w-3 fill-current" />
              <Star class="h-3 w-3 fill-current" />
              <span class="font-bold text-slate-800 dark:text-slate-200 ml-1">4.9/5.0</span>
            </div>
            <p class="text-[#537292] dark:text-[#8DB0D4] mt-0.5">
              {$language === 'vi' ? 'Được tin dùng bởi hơn 10.000+ hộ gia đình và doanh nghiệp.' : 'Trusted by 10,000+ households and enterprises.'}
            </p>
          </div>
        </div>
      </div>
      <!-- RIGHT COLUMN: REGISTRATION FORM CARD (7 cols) -->
      <div class="lg:col-span-7">
        <div class="bg-white/95 dark:bg-[#152434]/95 border border-[#CCE4F7] dark:border-[#253D56] rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-md transition-colors duration-300">
          <!-- Account Type Selector -->
          <div class="flex rounded-xl bg-[#EDF6FF] dark:bg-[#101C29] p-1 border border-[#CCE4F7] dark:border-[#253D56] mb-6">
            <button
              type="button"
              onclick={() => (customerType = 'personal')}
              class="flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 {customerType === 'personal'
                ? 'bg-white dark:bg-[#1E3349] text-sky-600 dark:text-white shadow-xs'
                : 'text-[#537292] dark:text-slate-400 hover:text-[#0F1D2B] dark:hover:text-white'}"
            >
              <User class="h-4 w-4" />
              <span>{$t.registrationPage.personalType}</span>
            </button>
            <button
              type="button"
              onclick={() => (customerType = 'business')}
              class="flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 {customerType === 'business'
                ? 'bg-white dark:bg-[#1E3349] text-sky-600 dark:text-white shadow-xs'
                : 'text-[#537292] dark:text-slate-400 hover:text-[#0F1D2B] dark:hover:text-white'}"
            >
              <Building2 class="h-4 w-4" />
              <span>{$t.registrationPage.businessType}</span>
            </button>
          </div>

          <!-- Error Message Alert -->
          {#if errorMessage}
            <div class="mb-5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
              <span class="h-2 w-2 rounded-full bg-rose-500 animate-ping shrink-0" />
              <span>{errorMessage}</span>
            </div>
          {/if}

          <!-- Form Body -->
          <form onsubmit={handleRegisterSubmit} class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Full Name -->
              <div>
                <label class="block text-xs font-semibold text-[#305070] dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {customerType === 'business' ? ($language === 'vi' ? 'Tên Doanh Nghiệp / Đại Diện' : 'Company / Representative Name') : $t.auth.nameLabel}
                  <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <User class="absolute left-3.5 top-3 h-4 w-4 text-[#7899B8] dark:text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder={customerType === 'business' ? 'Nexus Technologies Corp' : 'Nguyen Van A'}
                    bind:value={name}
                    class="w-full pl-10 pr-4 py-2.5 text-sm bg-[#EDF6FF] dark:bg-[#101C29] border border-[#CCE4F7] dark:border-[#253D56] rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-blue-500 text-[#0F1D2B] dark:text-white placeholder-[#7899B8] dark:placeholder-slate-500 transition"
                  />
                </div>
              </div>

              <!-- Email -->
              <div>
                <label class="block text-xs font-semibold text-[#305070] dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {$t.auth.emailLabel} <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <Mail class="absolute left-3.5 top-3 h-4 w-4 text-[#7899B8] dark:text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="subscriber@nexus.telecom"
                    bind:value={email}
                    class="w-full pl-10 pr-4 py-2.5 text-sm bg-[#EDF6FF] dark:bg-[#101C29] border border-[#CCE4F7] dark:border-[#253D56] rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-blue-500 text-[#0F1D2B] dark:text-white placeholder-[#7899B8] dark:placeholder-slate-500 transition"
                  />
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Phone -->
              <div>
                <label class="block text-xs font-semibold text-[#305070] dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {$t.auth.phoneLabel} <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <Phone class="absolute left-3.5 top-3 h-4 w-4 text-[#7899B8] dark:text-slate-500" />
                  <input
                    type="tel"
                    required
                    placeholder="0912 345 678"
                    bind:value={phone}
                    class="w-full pl-10 pr-4 py-2.5 text-sm bg-[#EDF6FF] dark:bg-[#101C29] border border-[#CCE4F7] dark:border-[#253D56] rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-blue-500 text-[#0F1D2B] dark:text-white placeholder-[#7899B8] dark:placeholder-slate-500 transition"
                  />
                </div>
              </div>

              <!-- Interested Service -->
              <div>
                <label class="block text-xs font-semibold text-[#305070] dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {$t.registrationPage.serviceInterest}
                </label>
                <div class="relative">
                  <select
                    bind:value={serviceInterest}
                    class="w-full px-3.5 py-2.5 text-sm bg-[#EDF6FF] dark:bg-[#101C29] border border-[#CCE4F7] dark:border-[#253D56] rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-blue-500 text-[#0F1D2B] dark:text-white transition cursor-pointer"
                  >
                    <option value="broadband">{$t.registrationPage.serviceBroadband}</option>
                    <option value="landline">{$t.registrationPage.serviceLandline}</option>
                    <option value="dialup">{$t.registrationPage.serviceDialup}</option>
                    <option value="combo">{$t.registrationPage.serviceCombo}</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Installation Address -->
            <div>
              <label class="block text-xs font-semibold text-[#305070] dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {$t.registrationPage.addressLabel}
              </label>
              <div class="relative">
                <MapPin class="absolute left-3.5 top-3 h-4 w-4 text-[#7899B8] dark:text-slate-500" />
                <input
                  type="text"
                  placeholder={$t.registrationPage.addressPlaceholder}
                  bind:value={address}
                  class="w-full pl-10 pr-4 py-2.5 text-sm bg-[#EDF6FF] dark:bg-[#101C29] border border-[#CCE4F7] dark:border-[#253D56] rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-blue-500 text-[#0F1D2B] dark:text-white placeholder-[#7899B8] dark:placeholder-slate-500 transition"
                />
              </div>
            </div>

            <!-- Password Fields -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-[#305070] dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {$t.auth.passwordLabel} <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <Lock class="absolute left-3.5 top-3 h-4 w-4 text-[#7899B8] dark:text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder={$t.auth.minPassword}
                    bind:value={password}
                    class="w-full pl-10 pr-10 py-2.5 text-sm bg-[#EDF6FF] dark:bg-[#101C29] border border-[#CCE4F7] dark:border-[#253D56] rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-blue-500 text-[#0F1D2B] dark:text-white placeholder-[#7899B8] dark:placeholder-slate-500 transition font-mono"
                  />
                  <button
                    type="button"
                    onclick={() => (showPassword = !showPassword)}
                    class="absolute right-3 top-2.5 text-[#7899B8] hover:text-[#0F1D2B] dark:text-slate-500 dark:hover:text-slate-300"
                  >
                    {#if showPassword}<EyeOff class="h-4 w-4" />{:else}<Eye class="h-4 w-4" />{/if}
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-[#305070] dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {$t.auth.confirmPasswordLabel} <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <Lock class="absolute left-3.5 top-3 h-4 w-4 text-[#7899B8] dark:text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder={$t.auth.confirmPasswordLabel}
                    bind:value={confirmPassword}
                    class="w-full pl-10 pr-4 py-2.5 text-sm bg-[#EDF6FF] dark:bg-[#101C29] border border-[#CCE4F7] dark:border-[#253D56] rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-blue-500 text-[#0F1D2B] dark:text-white placeholder-[#7899B8] dark:placeholder-slate-500 transition font-mono"
                  />
                </div>
              </div>
            </div>

            <!-- Terms Agreement Checkbox -->
            <div class="pt-2">
              <label class="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  bind:checked={agreeTerms}
                  class="mt-0.5 h-4 w-4 rounded border-[#CCE4F7] dark:border-[#253D56] text-sky-600 focus:ring-sky-500"
                />
                <span class="text-xs text-[#537292] dark:text-slate-400">
                  {$t.registrationPage.agreeTerms}
                </span>
              </label>
            </div>

            <!-- Primary Submit Button -->
            <div class="pt-3">
              <button
                type="submit"
                class="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white transition shadow-lg shadow-sky-600/30 flex items-center justify-center space-x-2 active:scale-95"
              >
                <span>{$t.auth.registerButton}</span>
                <ArrowRight class="h-4 w-4" />
              </button>
            </div>
          </form>

          <!-- Login Redirection Link -->
          <div class="mt-6 pt-5 border-t border-[#CCE4F7] dark:border-slate-800/80 text-center text-xs text-[#537292] dark:text-slate-400 flex items-center justify-center space-x-1.5">
            <span>{$t.auth.haveAccount}</span>
            <button
              type="button"
              onclick={() => navigate('/login')}
              class="font-bold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center space-x-1"
            >
              <span>{$t.auth.loginLink}</span>
              <ArrowRight class="h-3 w-3" />
            </button>
          </div>

          <!-- Assurance Badges -->
          <div class="mt-4 pt-4 border-t border-[#CCE4F7]/60 dark:border-slate-800/60 grid grid-cols-2 gap-2 text-[11px] text-[#537292] dark:text-slate-400">
            <div class="flex items-center space-x-1.5">
              <CheckCircle2 class="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>{$t.auth.freeRegister}</span>
            </div>
            <div class="flex items-center space-x-1.5">
              <Sparkles class="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span>{$t.auth.instantActive}</span>
            </div>
          </div>
        </div>

        <!-- Note at bottom -->
        <div class="mt-4 text-center text-xs text-[#537292] dark:text-slate-400">
          <span>{$t.auth.securityNotice}</span>
        </div>
      </div>
    </div>
  </main>
</div>

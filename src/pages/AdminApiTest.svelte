<script lang="ts">
  import {
    planApi,
    employeeApi,
    retailShopApi,
    vendorApi,
    inventoryApi,
  } from '../api/admin';
  import {
    Play,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Copy,
    Trash2,
    Clock,
    Database,
    ArrowLeft,
  } from 'lucide-svelte';
  import { toast } from 'svelte-sonner';
  import { navigate } from '../lib/router';

  type ModuleName = 'plan' | 'employee' | 'retail' | 'vendor' | 'inventory';

  let activeModule = $state<ModuleName>('plan');
  let isExecuting = $state(false);
  let lastResponse = $state<any>(null);
  let executionStatus = $state<'idle' | 'success' | 'error'>('idle');
  let executionTimeMs = $state<number | null>(null);
  let lastEndpoint = $state<string>('');
  let lastMethod = $state<string>('GET');
  let countResult = $state<number | null>(null);

  // Input params for testing
  let testIdInput = $state('');
  let testSearchInput = $state('');

  async function runApiCall(methodName: string, callFn: () => Promise<any>, httpMethod = 'GET', endpoint = '') {
    isExecuting = true;
    executionStatus = 'idle';
    lastEndpoint = endpoint;
    lastMethod = httpMethod;
    const startTime = performance.now();

    try {
      const data = await callFn();
      executionTimeMs = Math.round(performance.now() - startTime);
      lastResponse = data;
      executionStatus = 'success';
      if (Array.isArray(data)) {
        countResult = data.length;
        toast.success(`${methodName} thành công: Nhận được ${data.length} bản ghi (${executionTimeMs}ms)`);
      } else {
        countResult = data ? 1 : 0;
        toast.success(`${methodName} thành công (${executionTimeMs}ms)`);
      }
    } catch (err: any) {
      executionTimeMs = Math.round(performance.now() - startTime);
      executionStatus = 'error';
      lastResponse = {
        error: true,
        message: err.message,
        status: err.status || 0,
        detail: err.data || null,
      };
      countResult = null;
      toast.error(`${methodName} thất bại: ${err.message}`);
    } finally {
      isExecuting = false;
    }
  }

  function copyJson() {
    if (!lastResponse) return;
    navigator.clipboard.writeText(JSON.stringify(lastResponse, null, 2));
    toast.success('Đã sao chép JSON kết quả!');
  }

  function clearResult() {
    lastResponse = null;
    executionStatus = 'idle';
    executionTimeMs = null;
    countResult = null;
  }
</script>

<div class="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col">
  <!-- Header -->
  <header class="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between shadow-sm">
    <div class="flex items-center space-x-3">
      <button
        onclick={() => navigate('/admin')}
        class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
        title="Quay lại Admin"
      >
        <ArrowLeft class="w-5 h-5" />
      </button>
      <div>
        <h1 class="text-xl font-bold flex items-center gap-2">
          <Database class="w-6 h-6 text-sky-500" />
          <span>Nexus API Test Bench (Admin Backend API)</span>
        </h1>
        <p class="text-xs text-slate-500 dark:text-slate-400">
          Kiểm thử trực tiếp các REST Controller ASP.NET Core: <code class="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-sky-600 dark:text-sky-400">http://localhost:5105/api/admin/*</code>
        </p>
      </div>
    </div>

    <!-- Quick Status Badge -->
    <div class="flex items-center space-x-2">
      <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        Ready to Test
      </span>
    </div>
  </header>

  <!-- Module Switcher Tabs -->
  <div class="bg-white dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 px-6">
    <nav class="flex space-x-6">
      <button
        class="py-3 px-1 border-b-2 font-medium text-sm transition-colors {activeModule === 'plan' ? 'border-sky-500 text-sky-600 dark:text-sky-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}"
        onclick={() => { activeModule = 'plan'; clearResult(); }}
      >
        1. Plan API (Gói cước)
      </button>
      <button
        class="py-3 px-1 border-b-2 font-medium text-sm transition-colors {activeModule === 'employee' ? 'border-sky-500 text-sky-600 dark:text-sky-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}"
        onclick={() => { activeModule = 'employee'; clearResult(); }}
      >
        2. Employee API (Nhân viên)
      </button>
      <button
        class="py-3 px-1 border-b-2 font-medium text-sm transition-colors {activeModule === 'retail' ? 'border-sky-500 text-sky-600 dark:text-sky-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}"
        onclick={() => { activeModule = 'retail'; clearResult(); }}
      >
        3. Retail Shop API (Điểm bán lẻ)
      </button>
      <button
        class="py-3 px-1 border-b-2 font-medium text-sm transition-colors {activeModule === 'vendor' ? 'border-sky-500 text-sky-600 dark:text-sky-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}"
        onclick={() => { activeModule = 'vendor'; clearResult(); }}
      >
        4. Vendor API (Nhà cung cấp)
      </button>
      <button
        class="py-3 px-1 border-b-2 font-medium text-sm transition-colors {activeModule === 'inventory' ? 'border-sky-500 text-sky-600 dark:text-sky-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}"
        onclick={() => { activeModule = 'inventory'; clearResult(); }}
      >
        5. Inventory API (Kho vật tư)
      </button>
    </nav>
  </div>

  <!-- Main Body: 2 Columns (Actions Left, Response View Right) -->
  <main class="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
    <!-- Left Column: Test Actions -->
    <div class="lg:col-span-5 flex flex-col gap-4 overflow-y-auto pr-1">
      <!-- Parameters Box -->
      <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Tham số kiểm thử nhanh</h3>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-xs text-slate-500 mb-1">Mã ID cần test:</label>
            <input
              type="text"
              bind:value={testIdInput}
              placeholder="VD: plan-bb-512 hoặc 1"
              class="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">Từ khóa tìm kiếm:</label>
            <input
              type="text"
              bind:value={testSearchInput}
              placeholder="VD: Fiber, Manager..."
              class="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </div>

      <!-- Action Buttons Accordion by Active Module -->
      <div class="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
        <h3 class="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-200">
          <Play class="w-4 h-4 text-sky-500" />
          <span>Danh sách Hàm API cần chạy thử:</span>
        </h3>

        {#if activeModule === 'plan'}
          <div class="space-y-2">
            <button
              disabled={isExecuting}
              onclick={() => runApiCall('planApi.getAll()', () => planApi.getAll(), 'GET', '/api/admin/plan')}
              class="w-full text-left px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:border-sky-300 transition flex items-center justify-between text-xs"
            >
              <div>
                <span class="font-bold text-sky-600 dark:text-sky-400">planApi.getAll()</span>
                <p class="text-slate-500">GET /api/admin/plan (Lấy toàn bộ gói cước)</p>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">GET</span>
            </button>

            <button
              disabled={isExecuting}
              onclick={() => runApiCall('planApi.getStats()', () => planApi.getStats(), 'GET', '/api/admin/plan/stats')}
              class="w-full text-left px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:border-sky-300 transition flex items-center justify-between text-xs"
            >
              <div>
                <span class="font-bold text-sky-600 dark:text-sky-400">planApi.getStats()</span>
                <p class="text-slate-500">GET /api/admin/plan/stats (Thống kê số gói Broadband, Dial-up, Landline)</p>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">GET</span>
            </button>

            <button
              disabled={isExecuting}
              onclick={() => runApiCall('planApi.getBroadband()', () => planApi.getBroadband(), 'GET', '/api/admin/plan/broadband')}
              class="w-full text-left px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:border-sky-300 transition flex items-center justify-between text-xs"
            >
              <div>
                <span class="font-bold text-sky-600 dark:text-sky-400">planApi.getBroadband()</span>
                <p class="text-slate-500">GET /api/admin/plan/broadband (Lọc riêng gói Cáp quang)</p>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">GET</span>
            </button>

            <button
              disabled={isExecuting}
              onclick={() => runApiCall('planApi.getDialUp()', () => planApi.getDialUp(), 'GET', '/api/admin/plan/dial-up')}
              class="w-full text-left px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:border-sky-300 transition flex items-center justify-between text-xs"
            >
              <div>
                <span class="font-bold text-sky-600 dark:text-sky-400">planApi.getDialUp()</span>
                <p class="text-slate-500">GET /api/admin/plan/dial-up (Lọc riêng gói Quay số)</p>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">GET</span>
            </button>

            <button
              disabled={isExecuting}
              onclick={() => runApiCall('planApi.getLandline()', () => planApi.getLandline(), 'GET', '/api/admin/plan/landline')}
              class="w-full text-left px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:border-sky-300 transition flex items-center justify-between text-xs"
            >
              <div>
                <span class="font-bold text-sky-600 dark:text-sky-400">planApi.getLandline()</span>
                <p class="text-slate-500">GET /api/admin/plan/landline (Lọc riêng gói Cố định)</p>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">GET</span>
            </button>

            {#if testIdInput}
              <button
                disabled={isExecuting}
                onclick={() => runApiCall(`planApi.getById('${testIdInput}')`, () => planApi.getById(testIdInput), 'GET', `/api/admin/plan/${testIdInput}`)}
                class="w-full text-left px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100 transition flex items-center justify-between text-xs"
              >
                <div>
                  <span class="font-bold text-amber-700 dark:text-amber-400">planApi.getById('{testIdInput}')</span>
                  <p class="text-slate-500">GET /api/admin/plan/{testIdInput} (Chi tiết gói theo ID)</p>
                </div>
                <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">GET</span>
              </button>
            {/if}
          </div>
        {:else if activeModule === 'employee'}
          <div class="space-y-2">
            <button
              disabled={isExecuting}
              onclick={() => runApiCall('employeeApi.getAll()', () => employeeApi.getAll(), 'GET', '/api/admin/employee')}
              class="w-full text-left px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:border-sky-300 transition flex items-center justify-between text-xs"
            >
              <div>
                <span class="font-bold text-sky-600 dark:text-sky-400">employeeApi.getAll()</span>
                <p class="text-slate-500">GET /api/admin/employee (Danh sách tất cả nhân viên)</p>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">GET</span>
            </button>

            {#if testSearchInput}
              <button
                disabled={isExecuting}
                onclick={() => runApiCall(`employeeApi.search('${testSearchInput}')`, () => employeeApi.search(testSearchInput), 'GET', `/api/admin/employee/search?search=${testSearchInput}`)}
                class="w-full text-left px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:border-sky-300 transition flex items-center justify-between text-xs"
              >
                <div>
                  <span class="font-bold text-sky-600 dark:text-sky-400">employeeApi.search('{testSearchInput}')</span>
                  <p class="text-slate-500">GET /api/admin/employee/search</p>
                </div>
                <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">GET</span>
              </button>
            {/if}

            {#if testIdInput}
              <button
                disabled={isExecuting}
                onclick={() => runApiCall(`employeeApi.getById('${testIdInput}')`, () => employeeApi.getById(testIdInput), 'GET', `/api/admin/employee/${testIdInput}`)}
                class="w-full text-left px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 hover:bg-amber-100 transition flex items-center justify-between text-xs"
              >
                <div>
                  <span class="font-bold text-amber-700 dark:text-amber-400">employeeApi.getById('{testIdInput}')</span>
                  <p class="text-slate-500">GET /api/admin/employee/{testIdInput}</p>
                </div>
                <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">GET</span>
              </button>
            {/if}
          </div>
        {:else if activeModule === 'retail'}
          <div class="space-y-2">
            <button
              disabled={isExecuting}
              onclick={() => runApiCall('retailShopApi.getAll()', () => retailShopApi.getAll(), 'GET', '/api/admin/retailshop')}
              class="w-full text-left px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:border-sky-300 transition flex items-center justify-between text-xs"
            >
              <div>
                <span class="font-bold text-sky-600 dark:text-sky-400">retailShopApi.getAll()</span>
                <p class="text-slate-500">GET /api/admin/retailshop (Danh sách chi nhánh cửa hàng)</p>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">GET</span>
            </button>

            <button
              disabled={isExecuting}
              onclick={() => runApiCall('retailShopApi.getStats()', () => retailShopApi.getStats(), 'GET', '/api/admin/retailshop/stats')}
              class="w-full text-left px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:border-sky-300 transition flex items-center justify-between text-xs"
            >
              <div>
                <span class="font-bold text-sky-600 dark:text-sky-400">retailShopApi.getStats()</span>
                <p class="text-slate-500">GET /api/admin/retailshop/stats (Thống kê mạng lưới chi nhánh)</p>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">GET</span>
            </button>

            {#if testIdInput}
              <button
                disabled={isExecuting}
                onclick={() => runApiCall(`retailShopApi.getById('${testIdInput}')`, () => retailShopApi.getById(testIdInput), 'GET', `/api/admin/retailshop/${testIdInput}`)}
                class="w-full text-left px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 hover:bg-amber-100 transition flex items-center justify-between text-xs"
              >
                <div>
                  <span class="font-bold text-amber-700 dark:text-amber-400">retailShopApi.getById('{testIdInput}')</span>
                  <p class="text-slate-500">GET /api/admin/retailshop/{testIdInput}</p>
                </div>
                <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">GET</span>
              </button>
            {/if}
          </div>
        {:else if activeModule === 'vendor'}
          <div class="space-y-2">
            <button
              disabled={isExecuting}
              onclick={() => runApiCall('vendorApi.getAll()', () => vendorApi.getAll(), 'GET', '/api/admin/vendor')}
              class="w-full text-left px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:border-sky-300 transition flex items-center justify-between text-xs"
            >
              <div>
                <span class="font-bold text-sky-600 dark:text-sky-400">vendorApi.getAll()</span>
                <p class="text-slate-500">GET /api/admin/vendor (Danh sách đối tác & nhà cung cấp)</p>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">GET</span>
            </button>

            <button
              disabled={isExecuting}
              onclick={() => runApiCall('vendorApi.getStats()', () => vendorApi.getStats(), 'GET', '/api/admin/vendor/stats')}
              class="w-full text-left px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:border-sky-300 transition flex items-center justify-between text-xs"
            >
              <div>
                <span class="font-bold text-sky-600 dark:text-sky-400">vendorApi.getStats()</span>
                <p class="text-slate-500">GET /api/admin/vendor/stats (Thống kê số lượng NCC active/pending)</p>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">GET</span>
            </button>

            {#if testIdInput}
              <button
                disabled={isExecuting}
                onclick={() => runApiCall(`vendorApi.getById('${testIdInput}')`, () => vendorApi.getById(testIdInput), 'GET', `/api/admin/vendor/${testIdInput}`)}
                class="w-full text-left px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 hover:bg-amber-100 transition flex items-center justify-between text-xs"
              >
                <div>
                  <span class="font-bold text-amber-700 dark:text-amber-400">vendorApi.getById('{testIdInput}')</span>
                  <p class="text-slate-500">GET /api/admin/vendor/{testIdInput}</p>
                </div>
                <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">GET</span>
              </button>
            {/if}
          </div>
        {:else if activeModule === 'inventory'}
          <div class="space-y-2">
            <button
              disabled={isExecuting}
              onclick={() => runApiCall('inventoryApi.getAll()', () => inventoryApi.getAll(), 'GET', '/api/admin/inventory')}
              class="w-full text-left px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:border-sky-300 transition flex items-center justify-between text-xs"
            >
              <div>
                <span class="font-bold text-sky-600 dark:text-sky-400">inventoryApi.getAll()</span>
                <p class="text-slate-500">GET /api/admin/inventory (Toàn bộ trang thiết bị & vật tư kho)</p>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">GET</span>
            </button>

            <button
              disabled={isExecuting}
              onclick={() => runApiCall('inventoryApi.getLowStock()', () => inventoryApi.getLowStock(), 'GET', '/api/admin/inventory/low-stock')}
              class="w-full text-left px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:border-sky-300 transition flex items-center justify-between text-xs"
            >
              <div>
                <span class="font-bold text-sky-600 dark:text-sky-400">inventoryApi.getLowStock()</span>
                <p class="text-slate-500">GET /api/admin/inventory/low-stock (Cảnh báo thiết bị dưới ngưỡng)</p>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">GET</span>
            </button>

            <button
              disabled={isExecuting}
              onclick={() => runApiCall('inventoryApi.getStats()', () => inventoryApi.getStats(), 'GET', '/api/admin/inventory/stats')}
              class="w-full text-left px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:border-sky-300 transition flex items-center justify-between text-xs"
            >
              <div>
                <span class="font-bold text-sky-600 dark:text-sky-400">inventoryApi.getStats()</span>
                <p class="text-slate-500">GET /api/admin/inventory/stats (Thống kê định giá & số lượng kho)</p>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">GET</span>
            </button>
          </div>
        {/if}
      </div>
    </div>

    <!-- Right Column: API Execution Result Terminal -->
    <div class="lg:col-span-7 flex flex-col bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <!-- Terminal Header -->
      <div class="px-4 py-3 bg-slate-100 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="flex space-x-1.5">
            <span class="w-3 h-3 rounded-full bg-red-400 inline-block"></span>
            <span class="w-3 h-3 rounded-full bg-amber-400 inline-block"></span>
            <span class="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span>
          </div>
          <span class="text-xs font-mono font-medium text-slate-600 dark:text-slate-400">
            {lastMethod} {lastEndpoint || 'Chờ gửi request...'}
          </span>
        </div>

        <div class="flex items-center space-x-2">
          {#if executionTimeMs !== null}
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <Clock class="w-3 h-3" />
              {executionTimeMs} ms
            </span>
          {/if}

          {#if countResult !== null}
            <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
              {countResult} item(s)
            </span>
          {/if}

          {#if executionStatus === 'success'}
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 class="w-3.5 h-3.5" />
              200 OK
            </span>
          {:else if executionStatus === 'error'}
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
              <XCircle class="w-3.5 h-3.5" />
              Failed
            </span>
          {/if}

          {#if lastResponse}
            <button
              onclick={copyJson}
              class="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition"
              title="Sao chép JSON"
            >
              <Copy class="w-4 h-4" />
            </button>
            <button
              onclick={clearResult}
              class="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition"
              title="Xóa kết quả"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          {/if}
        </div>
      </div>

      <!-- Terminal Body -->
      <div class="flex-1 p-4 bg-slate-950 text-emerald-400 font-mono text-xs overflow-auto max-h-[calc(100vh-230px)]">
        {#if isExecuting}
          <div class="flex items-center gap-2 text-sky-400 py-4">
            <RefreshCw class="w-4 h-4 animate-spin" />
            <span>Đang gửi request tới Backend ASP.NET Core ({lastEndpoint})...</span>
          </div>
        {:else if lastResponse !== null}
          <pre class="whitespace-pre-wrap leading-relaxed">{JSON.stringify(lastResponse, null, 2)}</pre>
        {:else}
          <div class="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 py-12">
            <Play class="w-8 h-8 opacity-40" />
            <p>Chọn một hàm API bên cột trái để gửi request kiểm thử tới Backend.</p>
            <p class="text-[11px] text-slate-600">Đảm bảo dự án backend <code>doanki3API</code> đang chạy tại port 5105.</p>
          </div>
        {/if}
      </div>
    </div>
  </main>
</div>

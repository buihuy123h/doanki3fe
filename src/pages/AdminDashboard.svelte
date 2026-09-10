<script lang="ts">
  // Mirrors pages/AdminDashboard.tsx of the React original.
  import { nexusStore } from '../context/NexusContext';
  import { languageStore } from '../context/LanguageContext';
  import DashboardLayout from '../components/layout/DashboardLayout.svelte';
  import SettingsView from '../components/common/SettingsView.svelte';
  import ProfileView from '../components/common/ProfileView.svelte';
  import type { NavItem } from '../components/layout/DashboardLayout.svelte';
  import {
    Users, Store, Truck, Layers, Package, Plus, Search, Edit2, Trash2,
    TrendingUp, CheckCircle2, Phone, MapPin, Wifi, Radio, X, Settings, MessageSquare,
  } from 'lucide-svelte';
  import type { Employee, Vendor, Plan } from '../types/nexus';
  import { toast } from 'svelte-sonner';
  import { queryParam, activeTabOverride } from '../lib/router';
  import { getPlanName, getPlanDescription, getPlanSpeedOrBandwidth, getPlanBillingCycle } from '../lib/planI18n';

  type AdminTab = 'overview' | 'employees' | 'stock' | 'vendors' | 'shops' | 'plans' | 'feedback' | 'settings' | 'profile';

  const {
    employees, addEmployee, updateEmployee, deleteEmployee,
    vendors, addVendor, updateVendor, deleteVendor,
    retailShops, plans, addPlan, updatePlan, deletePlan, inventory,
    feedbacks, respondFeedback,
  } = nexusStore;
  const { t, language } = languageStore;

  // Active navigation tab
  let activeTab = $state<AdminTab>('overview');

  // Reactively respond to tab overrides from router / notifications
  $effect(() => {
    const override = $activeTabOverride;
    const validTabs: AdminTab[] = ['overview', 'employees', 'stock', 'vendors', 'shops', 'plans', 'feedback', 'settings', 'profile'];
    if (override && override.path === '/admin') {
      if (validTabs.includes(override.tab as AdminTab)) {
        activeTab = override.tab as AdminTab;
      }
    } else {
      const qTab = queryParam('tab');
      if (qTab && validTabs.includes(qTab as AdminTab)) {
        activeTab = qTab as AdminTab;
      }
    }
  });

  // Employee Search and Filter
  let employeeSearch = $state('');
  let employeeRoleFilter = $state('All');

  // Employee Modal State
  let isEmployeeModalOpen = $state(false);
  let editingEmployee = $state<Employee | null>(null);
  let employeeFormData = $state({
    employeeCode: '',
    name: '',
    email: '',
    phone: '',
    role: 'Retail Staff' as Employee['role'],
    department: 'Retail Outlets' as Employee['department'],
    retailShopAssigned: 'Downtown Flagship (SH-01)',
    status: 'Active' as Employee['status'],
    dateOfJoining: new Date().toISOString().slice(0, 10),
  });

  // Vendor Modal State
  let isVendorModalOpen = $state(false);
  let editingVendor = $state<Vendor | null>(null);
  let vendorFormData = $state({
    vendorCode: '',
    companyName: '',
    contactPerson: '',
    category: 'Modems & Routers' as Vendor['category'],
    phone: '',
    email: '',
    address: '',
    rating: 5,
    status: 'Active' as Vendor['status'],
  });

  // Plan Modal State
  let isPlanModalOpen = $state(false);
  let editingPlan = $state<Plan | null>(null);
  let planFormData = $state({
    name: '',
    type: 'Broadband' as Plan['type'],
    speedOrBandwidth: '',
    monthlyRental: 225,
    hourlyCharge: 0,
    securityDeposit: 500,
    dataLimit: 'Unlimited',
    status: 'Active' as Plan['status'],
    description: '',
    billingCycle: 'Monthly' as NonNullable<Plan['billingCycle']>,
    validity: '1 Month',
    callRates: '',
  });

  // Respond-to-feedback state
  let respondingId = $state<string | null>(null);
  let responseText = $state('');
  const submitResponse = (id: string) => {
    if (!responseText.trim()) return;
    respondFeedback(id, responseText.trim(), 'Sarah Jenkins (Admin)');
    responseText = '';
    respondingId = null;
    toast.success('Response sent to the customer.');
  };

  // Employee Form Submission Handlers
  const handleOpenEmployeeModal = (emp?: Employee) => {
    if (emp) {
      editingEmployee = emp;
      employeeFormData = {
        employeeCode: emp.employeeCode,
        name: emp.name,
        email: emp.email,
        phone: emp.phone,
        role: emp.role,
        department: emp.department,
        retailShopAssigned: emp.retailShopAssigned || 'Downtown Flagship (SH-01)',
        status: emp.status,
        dateOfJoining: emp.dateOfJoining,
      };
    } else {
      editingEmployee = null;
      employeeFormData = {
        employeeCode: `EMP-${1000 + $employees.length + 1}`,
        name: '',
        email: '',
        phone: '',
        role: 'Retail Staff',
        department: 'Retail Outlets',
        retailShopAssigned: 'Downtown Flagship (SH-01)',
        status: 'Active',
        dateOfJoining: new Date().toISOString().slice(0, 10),
      };
    }
    isEmployeeModalOpen = true;
  };

  const handleSaveEmployee = (e: SubmitEvent) => {
    e.preventDefault();
    if (!employeeFormData.name || !employeeFormData.email || !employeeFormData.phone) {
      toast.error('Please complete all required fields.');
      return;
    }

    if (editingEmployee) {
      updateEmployee(editingEmployee.id, employeeFormData);
      toast.success(`Updated employee ${employeeFormData.name}`);
    } else {
      addEmployee(employeeFormData);
      toast.success(`Added new employee ${employeeFormData.name}`);
    }
    isEmployeeModalOpen = false;
  };

  const handleDeleteEmployee = (emp: Employee) => {
    if (window.confirm(`Are you sure you want to remove employee "${emp.name}" (${emp.employeeCode})?`)) {
      deleteEmployee(emp.id);
      toast.success(`Employee ${emp.name} removed.`);
    }
  };

  // Vendor Form Submission Handlers
  const handleOpenVendorModal = (vnd?: Vendor) => {
    if (vnd) {
      editingVendor = vnd;
      vendorFormData = {
        vendorCode: vnd.vendorCode,
        companyName: vnd.companyName,
        contactPerson: vnd.contactPerson,
        category: vnd.category,
        phone: vnd.phone,
        email: vnd.email,
        address: vnd.address,
        rating: vnd.rating,
        status: vnd.status,
      };
    } else {
      editingVendor = null;
      vendorFormData = {
        vendorCode: `VND-${400 + $vendors.length + 1}`,
        companyName: '',
        contactPerson: '',
        category: 'Modems & Routers',
        phone: '',
        email: '',
        address: '',
        rating: 5,
        status: 'Active',
      };
    }
    isVendorModalOpen = true;
  };

  const handleSaveVendor = (e: SubmitEvent) => {
    e.preventDefault();
    if (!vendorFormData.companyName || !vendorFormData.contactPerson) {
      toast.error('Please enter company name and primary contact.');
      return;
    }

    if (editingVendor) {
      updateVendor(editingVendor.id, vendorFormData);
      toast.success(`Updated vendor ${vendorFormData.companyName}`);
    } else {
      addVendor(vendorFormData);
      toast.success(`Registered vendor ${vendorFormData.companyName}`);
    }
    isVendorModalOpen = false;
  };

  const handleDeleteVendor = (vnd: Vendor) => {
    if (window.confirm(`Confirm termination of supplier "${vnd.companyName}"?`)) {
      deleteVendor(vnd.id);
      toast.success(`Vendor ${vnd.companyName} removed.`);
    }
  };

  // Plan Form Submission Handlers
  const handleOpenPlanModal = (plan?: Plan) => {
    if (plan) {
      editingPlan = plan;
      planFormData = {
        name: plan.name,
        type: plan.type,
        speedOrBandwidth: plan.speedOrBandwidth,
        monthlyRental: plan.monthlyRental,
        hourlyCharge: plan.hourlyCharge || 0,
        securityDeposit: plan.securityDeposit,
        dataLimit: plan.dataLimit || 'Unlimited',
        status: plan.status,
        description: plan.description,
        billingCycle: plan.billingCycle || 'Monthly',
        validity: plan.validity || '1 Month',
        callRates: plan.callRates || '',
      };
    } else {
      editingPlan = null;
      planFormData = {
        name: '',
        type: 'Broadband',
        speedOrBandwidth: '64 Kbps',
        monthlyRental: 225,
        hourlyCharge: 0,
        securityDeposit: 500,
        dataLimit: 'Unlimited',
        status: 'Active',
        description: 'Unlimited broadband package designed for reliable connectivity.',
        billingCycle: 'Monthly',
        validity: '1 Month',
        callRates: '',
      };
    }
    isPlanModalOpen = true;
  };

  const handleSavePlan = (e: SubmitEvent) => {
    e.preventDefault();
    if (!planFormData.name || !planFormData.speedOrBandwidth) {
      toast.error('Please enter plan name and speed specifications.');
      return;
    }

    if (editingPlan) {
      updatePlan(editingPlan.id, planFormData);
      toast.success(`Updated plan ${planFormData.name}`);
    } else {
      addPlan(planFormData);
      toast.success(`Created plan ${planFormData.name}`);
    }
    isPlanModalOpen = false;
  };


  // Calculations for Summary Area
  const totalRetailShops = $derived($retailShops.length);
  const activeEmployees = $derived($employees.filter((e) => e.status === 'Active').length);
  const totalSubscribers = $derived($retailShops.reduce((sum, s) => sum + s.totalSubscribersServed, 0));
  const lowStockItems = $derived($inventory.filter((item) => item.stockQuantity <= item.reorderLevel));

  // Filtering Employees
  const filteredEmployees = $derived(
    $employees.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        emp.employeeCode.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        emp.email.toLowerCase().includes(employeeSearch.toLowerCase());
      const matchesRole = employeeRoleFilter === 'All' || emp.role === employeeRoleFilter;
      return matchesSearch && matchesRole;
    })
  );

  const adminNavItems: NavItem[] = $derived([
    { id: 'overview', label: $t.adminNav.overview, icon: TrendingUp },
    { id: 'employees', label: $t.adminNav.employees, icon: Users, badge: $employees.length },
    {
      id: 'stock',
      label: $t.adminNav.stock,
      icon: Package,
      badge: lowStockItems.length > 0 ? ($language === 'vi' ? `${lowStockItems.length} sắp hết` : `${lowStockItems.length} low`) : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    { id: 'vendors', label: $t.adminNav.vendors, icon: Truck, badge: $vendors.length },
    { id: 'shops', label: $t.adminNav.shops, icon: Store, badge: $retailShops.length },
    { id: 'plans', label: $t.adminNav.plans, icon: Layers, badge: $plans.length },
    {
      id: 'feedback',
      label: $language === 'vi' ? 'Phản hồi KH' : 'Customer Feedback',
      icon: MessageSquare,
      badge: $feedbacks.filter((f) => !f.response).length || undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    { id: 'settings', label: $t.adminNav.settings, icon: Settings },
  ]);
</script>

<DashboardLayout
  activeTab={activeTab}
  onTabChange={(tab) => (activeTab = tab as AdminTab)}
  navItems={adminNavItems}
  roleBadgeTitle={$t.roles.admin}
  pageTitle={activeTab === 'overview' ? $t.adminNav.overview : adminNavItems.find((n) => n.id === activeTab)?.label}
  primaryAction={
    activeTab === 'employees'
      ? { label: $t.actions.addEmployee, onClick: () => handleOpenEmployeeModal() }
      : activeTab === 'vendors'
        ? { label: $t.actions.addVendor, onClick: () => handleOpenVendorModal() }
        : activeTab === 'plans'
          ? { label: $t.actions.addPlan, onClick: () => handleOpenPlanModal() }
          : { label: $t.actions.newReport, onClick: () => toast.success($language === 'vi' ? 'Đang tạo báo cáo tổng hợp mới...' : 'Creating summary report...') }
  }
>
  <!-- TAB 1: OVERVIEW & SUMMARY -->
  {#if activeTab === 'overview'}
    <div class="tab-content-animate space-y-6">
      <!-- Primary Required KPI Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <!-- Total Retail Shops Card -->
        <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {$language === 'vi' ? 'Điểm giao dịch bán lẻ' : 'Total Retail Shops'}
            </span>
            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <Store class="h-5 w-5" />
            </div>
          </div>
          <div class="mt-3 flex items-baseline space-x-2">
            <span class="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">{totalRetailShops}</span>
            <span class="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              {$language === 'vi' ? '100% Hoạt động' : '100% Operational'}
            </span>
          </div>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {$language === 'vi' ? 'Phủ khắp các quận đô thị' : 'Across New York metro regions'}
          </p>
        </div>

        <!-- Active Employees Card -->
        <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {$language === 'vi' ? 'Nhân sự đang làm việc' : 'Active Employees'}
            </span>
            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
              <Users class="h-5 w-5" />
            </div>
          </div>
          <div class="mt-3 flex items-baseline space-x-2">
            <span class="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">{activeEmployees}</span>
            <span class="text-xs text-slate-500 dark:text-slate-400">
              / {$employees.length} {$language === 'vi' ? 'Tổng nhân sự' : 'Total Staff'}
            </span>
          </div>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {$language === 'vi' ? 'Khối Bán lẻ, Kỹ thuật & Kế toán' : 'Retail, Technical & Operations teams'}
          </p>
        </div>

        <!-- Subscribers Served Card -->
        <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {$language === 'vi' ? 'Tổng thuê bao phục vụ' : 'Subscribers Served'}
            </span>
            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 class="h-5 w-5" />
            </div>
          </div>
          <div class="mt-3 flex items-baseline space-x-2">
            <span class="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">{totalSubscribers.toLocaleString()}</span>
            <span class="text-xs text-emerald-600 dark:text-emerald-400 font-medium">+14% YoY</span>
          </div>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {$language === 'vi' ? 'Băng rộng, Quay số & Điện thoại cố định' : 'Broadband, Dial-Up & Landlines'}
          </p>
        </div>

        <!-- Registered Vendors Card -->
        <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {$language === 'vi' ? 'Nhà cung ứng thiết bị' : 'Registered Vendors'}
            </span>
            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
              <Truck class="h-5 w-5" />
            </div>
          </div>
          <div class="mt-3 flex items-baseline space-x-2">
            <span class="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">{$vendors.length}</span>
            <span class="text-xs text-slate-500 dark:text-slate-400">
              {$language === 'vi' ? 'Đối tác chính thức' : 'Approved Suppliers'}
            </span>
          </div>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Corning, Cisco, Zyxel, Amphenol</p>
        </div>
      </div>

      <!-- Quick Actions & Department Snapshot -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Retail Outlet Network Highlights -->
        <div class="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-base text-slate-900 dark:text-white">
              {$language === 'vi' ? 'Mạng lưới điểm giao dịch' : 'Retail Shop Footprint'}
            </h3>
            <button
              onclick={() => (activeTab = 'shops')}
              class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              {$language === 'vi' ? 'Xem tất cả chi nhánh →' : 'View All Outlets →'}
            </button>
          </div>

          <div class="divide-y divide-slate-100 dark:divide-slate-800">
            {#each $retailShops as shop (shop.id)}
              <div class="py-3 flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs">
                    {shop.shopCode}
                  </div>
                  <div>
                    <div class="font-medium text-sm text-slate-900 dark:text-white">{shop.name}</div>
                    <div class="text-xs text-slate-500 dark:text-slate-400">
                      {$language === 'vi' ? 'Quản lý:' : 'Manager:'} {shop.managerName} • {shop.city}
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-sm font-semibold text-slate-900 dark:text-white">
                    {shop.totalSubscribersServed.toLocaleString()} {$language === 'vi' ? 'thuê bao' : 'subs'}
                  </div>
                  <div class="text-xs text-emerald-600 dark:text-emerald-400">
                    {shop.activeEmployeesCount} {$language === 'vi' ? 'nhân sự trực' : 'on-duty staff'}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Administrative Quick Actions -->
        <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
          <h3 class="font-semibold text-base text-slate-900 dark:text-white">
            {$language === 'vi' ? 'Thao tác quản trị nhanh' : 'Quick Administration'}
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            {$language === 'vi'
              ? 'Phím tắt thao tác nhanh để quản lý nhân sự, đối tác và danh mục gói cước.'
              : 'Fast management shortcuts to maintain staff and catalog records.'}
          </p>

          <div class="space-y-2">
            <button
              onclick={() => handleOpenEmployeeModal()}
              class="w-full text-left p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition flex items-center justify-between text-sm"
            >
              <span class="font-medium">{$language === 'vi' ? '+ Thêm nhân viên mới' : 'Onboard New Employee'}</span>
              <Plus class="h-4 w-4 text-indigo-500" />
            </button>
            <button
              onclick={() => handleOpenVendorModal()}
              class="w-full text-left p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition flex items-center justify-between text-sm"
            >
              <span class="font-medium">{$language === 'vi' ? '+ Đăng ký nhà cung cấp' : 'Register New Supplier'}</span>
              <Plus class="h-4 w-4 text-indigo-500" />
            </button>
            <button
              onclick={() => handleOpenPlanModal()}
              class="w-full text-left p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition flex items-center justify-between text-sm"
            >
              <span class="font-medium">{$language === 'vi' ? '+ Cấu hình gói cước' : 'Configure Service Plan'}</span>
              <Plus class="h-4 w-4 text-indigo-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- TAB 2: EMPLOYEE MANAGEMENT -->
  {#if activeTab === 'employees'}
    <div class="space-y-4">
      <!-- Search and Filters toolbar -->
      <div class="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div class="relative w-full sm:w-80">
          <Search class="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={$language === 'vi' ? 'Tìm theo tên, mã NV, email...' : 'Search by name, ID, or email...'}
            bind:value={employeeSearch}
            class="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div class="flex items-center space-x-2 w-full sm:w-auto">
          <span class="text-xs text-slate-500 whitespace-nowrap">
            {$language === 'vi' ? 'Lọc vai trò:' : 'Filter Role:'}
          </span>
          <select
            bind:value={employeeRoleFilter}
            class="text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">{$language === 'vi' ? 'Tất cả vai trò' : 'All Roles'}</option>
            <option value="Manager">{$language === 'vi' ? 'Quản lý' : 'Manager'}</option>
            <option value="Retail Staff">{$language === 'vi' ? 'Nhân viên bán lẻ' : 'Retail Staff'}</option>
            <option value="Field Engineer">{$language === 'vi' ? 'Kỹ sư hiện trường' : 'Field Engineer'}</option>
            <option value="Senior Accountant">{$language === 'vi' ? 'Kế toán trưởng' : 'Senior Accountant'}</option>
          </select>
        </div>
      </div>

      <!-- Employee Data Table -->
      <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th class="px-4 py-3">{$language === 'vi' ? 'Mã NV' : 'Code / ID'}</th>
                <th class="px-4 py-3">{$language === 'vi' ? 'Họ và tên' : 'Full Name'}</th>
                <th class="px-4 py-3">{$language === 'vi' ? 'Liên hệ & Email' : 'Contact & Email'}</th>
                <th class="px-4 py-3">{$language === 'vi' ? 'Vai trò & Bộ phận' : 'Role & Dept'}</th>
                <th class="px-4 py-3">{$language === 'vi' ? 'Chi nhánh phân công' : 'Assigned Shop'}</th>
                <th class="px-4 py-3">{$language === 'vi' ? 'Trạng thái' : 'Status'}</th>
                <th class="px-4 py-3 text-right">{$language === 'vi' ? 'Thao tác' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              {#each filteredEmployees as emp (emp.id)}
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td class="px-4 py-3 font-mono font-medium text-slate-900 dark:text-slate-100">{emp.employeeCode}</td>
                  <td class="px-4 py-3">
                    <div class="font-semibold text-slate-900 dark:text-white">{emp.name}</div>
                    <div class="text-xs text-slate-400">
                      {$language === 'vi' ? 'Ngày vào:' : 'Joined:'} {emp.dateOfJoining}
                    </div>
                  </td>
                  <td class="px-4 py-3 text-xs space-y-0.5">
                    <div class="text-slate-600 dark:text-slate-300">{emp.email}</div>
                    <div class="text-slate-400">{emp.phone}</div>
                  </td>
                  <td class="px-4 py-3">
                    <span class="inline-block px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{emp.role}</span>
                    <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{emp.department}</div>
                  </td>
                  <td class="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{emp.retailShopAssigned || ($language === 'vi' ? 'Trụ sở chính' : 'Headquarters')}</td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {emp.status === 'Active'
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}">
                      {$language === 'vi' ? (emp.status === 'Active' ? 'Hoạt động' : 'Tạm nghỉ') : emp.status}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <div class="flex items-center justify-end space-x-1">
                      <button
                        onclick={() => handleOpenEmployeeModal(emp)}
                        class="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition"
                        title={$language === 'vi' ? 'Chỉnh sửa nhân viên' : 'Edit Employee'}
                      >
                        <Edit2 class="h-4 w-4" />
                      </button>
                      <button
                        onclick={() => handleDeleteEmployee(emp)}
                        class="p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition"
                        title={$language === 'vi' ? 'Xóa nhân viên' : 'Delete Employee'}
                      >
                        <Trash2 class="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  {/if}

  <!-- TAB 3: STOCK / INVENTORY -->
  {#if activeTab === 'stock'}
    <div class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div class="text-xs font-semibold text-slate-500 uppercase">
            {$language === 'vi' ? 'Tổng thiết bị tồn kho' : 'Total Equipment Stock'}
          </div>
          <div class="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {$inventory.reduce((sum, item) => sum + item.stockQuantity, 0)} {$language === 'vi' ? 'thiết bị' : 'Units'}
          </div>
        </div>
        <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div class="text-xs font-semibold text-slate-500 uppercase">
            {$language === 'vi' ? 'Cảnh báo sắp hết hàng' : 'Low Stock Alerts'}
          </div>
          <div class="text-2xl font-bold text-amber-500 mt-1">
            {lowStockItems.length} {$language === 'vi' ? 'mặt hàng dưới mức tối thiểu' : 'Items Below Reorder'}
          </div>
        </div>
        <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div class="text-xs font-semibold text-slate-500 uppercase">
            {$language === 'vi' ? 'Ước tính giá trị kho' : 'Valuation (Est.)'}
          </div>
          <div class="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            ${$inventory.reduce((sum, item) => sum + item.stockQuantity * item.unitCost, 0).toLocaleString()}
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th class="px-4 py-3">{$language === 'vi' ? 'Mã VT' : 'Item Code'}</th>
                <th class="px-4 py-3">{$language === 'vi' ? 'Tên thiết bị / Vật tư' : 'Device / Equipment Name'}</th>
                <th class="px-4 py-3">{$language === 'vi' ? 'Danh mục' : 'Category'}</th>
                <th class="px-4 py-3">{$language === 'vi' ? 'Vị trí kho' : 'Depot Location'}</th>
                <th class="px-4 py-3">{$language === 'vi' ? 'Số lượng tồn' : 'Stock Units'}</th>
                <th class="px-4 py-3">{$language === 'vi' ? 'Ngưỡng đặt lại' : 'Reorder Threshold'}</th>
                <th class="px-4 py-3">{$language === 'vi' ? 'Đơn giá' : 'Unit Cost'}</th>
                <th class="px-4 py-3">{$language === 'vi' ? 'Nhà cung cấp' : 'Supplier'}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              {#each $inventory as item (item.id)}
                {@const isLow = item.stockQuantity <= item.reorderLevel}
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td class="px-4 py-3 font-mono font-medium text-slate-900 dark:text-slate-100">{item.itemCode}</td>
                  <td class="px-4 py-3 font-medium text-slate-900 dark:text-white">{item.name}</td>
                  <td class="px-4 py-3">
                    <span class="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{item.category}</span>
                  </td>
                  <td class="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{item.location}</td>
                  <td class="px-4 py-3">
                    <span class="font-semibold tabular-nums {isLow ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'}">
                      {item.stockQuantity}
                    </span>
                    {#if isLow}
                      <span class="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 uppercase">
                        {$language === 'vi' ? 'Sắp hết' : 'Low'}
                      </span>
                    {/if}
                  </td>
                  <td class="px-4 py-3 text-xs text-slate-500 tabular-nums">{item.reorderLevel}</td>
                  <td class="px-4 py-3 font-mono tabular-nums text-xs">${item.unitCost.toFixed(2)}</td>
                  <td class="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{item.supplier}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  {/if}

  <!-- TAB 4: VENDOR MANAGEMENT -->
  {#if activeTab === 'vendors'}
    <div class="space-y-4">
      <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th class="px-4 py-3">{$language === 'vi' ? 'Mã NCC' : 'Vendor Code'}</th>
                <th class="px-4 py-3">{$language === 'vi' ? 'Tên công ty' : 'Company Name'}</th>
                <th class="px-4 py-3">{$language === 'vi' ? 'Người đại diện' : 'Contact Person'}</th>
                <th class="px-4 py-3">{$language === 'vi' ? 'Danh mục cung cấp' : 'Supply Category'}</th>
                <th class="px-4 py-3">{$language === 'vi' ? 'Số điện thoại & Email' : 'Direct Phone & Email'}</th>
                <th class="px-4 py-3">{$language === 'vi' ? 'Địa chỉ' : 'Facility Address'}</th>
                <th class="px-4 py-3">{$language === 'vi' ? 'Trạng thái' : 'Status'}</th>
                <th class="px-4 py-3 text-right">{$language === 'vi' ? 'Thao tác' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              {#each $vendors as vnd (vnd.id)}
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td class="px-4 py-3 font-mono font-medium text-slate-900 dark:text-slate-100">{vnd.vendorCode}</td>
                  <td class="px-4 py-3 font-semibold text-slate-900 dark:text-white">{vnd.companyName}</td>
                  <td class="px-4 py-3 text-slate-700 dark:text-slate-300">{vnd.contactPerson}</td>
                  <td class="px-4 py-3">
                    <span class="px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">{vnd.category}</span>
                  </td>
                  <td class="px-4 py-3 text-xs space-y-0.5">
                    <div class="text-slate-600 dark:text-slate-300">{vnd.phone}</div>
                    <div class="text-slate-400">{vnd.email}</div>
                  </td>
                  <td class="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">{vnd.address}</td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                      {$language === 'vi' ? 'Đang hợp tác' : vnd.status}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <div class="flex items-center justify-end space-x-1">
                      <button
                        onclick={() => handleOpenVendorModal(vnd)}
                        class="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition"
                        title={$language === 'vi' ? 'Chỉnh sửa nhà cung cấp' : 'Edit Vendor'}
                      >
                        <Edit2 class="h-4 w-4" />
                      </button>
                      <button
                        onclick={() => handleDeleteVendor(vnd)}
                        class="p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition"
                        title={$language === 'vi' ? 'Xóa nhà cung cấp' : 'Delete Vendor'}
                      >
                        <Trash2 class="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  {/if}

  <!-- TAB 5: RETAIL SHOPS -->
  {#if activeTab === 'shops'}
    <div class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        {#each $retailShops as shop (shop.id)}
          <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
            <div class="flex items-start justify-between">
              <div class="flex items-center space-x-3">
                <div class="h-10 w-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  {shop.shopCode}
                </div>
                <div>
                  <h3 class="font-bold text-base text-slate-900 dark:text-white">{shop.name}</h3>
                  <p class="text-xs text-slate-500 dark:text-slate-400">
                    {$language === 'vi' ? `Trung tâm khu vực ${shop.city}` : `${shop.city} Regional Center`}
                  </p>
                </div>
              </div>
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                {$language === 'vi' ? 'Đang hoạt động' : 'Active Outlet'}
              </span>
            </div>

            <div class="text-xs space-y-1.5 text-slate-600 dark:text-slate-300 border-t border-b border-slate-100 dark:border-slate-800 py-3">
              <div class="flex items-center space-x-2">
                <MapPin class="h-3.5 w-3.5 text-slate-400" />
                <span>{shop.address}</span>
              </div>
              <div class="flex items-center space-x-2">
                <Phone class="h-3.5 w-3.5 text-slate-400" />
                <span>{shop.phone}</span>
              </div>
              <div class="flex items-center space-x-2">
                <Users class="h-3.5 w-3.5 text-slate-400" />
                <span>{$language === 'vi' ? 'Quản lý chi nhánh:' : 'Store Manager:'} <strong class="text-slate-900 dark:text-white">{shop.managerName}</strong></span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 pt-1 text-center">
              <div class="p-2 rounded bg-slate-50 dark:bg-slate-800/60">
                <div class="text-xs text-slate-400">{$language === 'vi' ? 'Nhân viên trực' : 'On-Duty Employees'}</div>
                <div class="text-lg font-bold text-slate-900 dark:text-white">
                  {shop.activeEmployeesCount} {$language === 'vi' ? 'người' : 'Staff'}
                </div>
              </div>
              <div class="p-2 rounded bg-slate-50 dark:bg-slate-800/60">
                <div class="text-xs text-slate-400">{$language === 'vi' ? 'Tổng thuê bao' : 'Total Subscribers'}</div>
                <div class="text-lg font-bold text-slate-900 dark:text-white">{shop.totalSubscribersServed.toLocaleString()}</div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- TAB 6: PLAN MANAGEMENT -->
  {#if activeTab === 'plans'}
    <div class="space-y-6">
      <div class="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 class="font-semibold text-slate-900 dark:text-white">
            {$language === 'vi' ? 'Bảng giá cước & Gói dịch vụ viễn thông' : 'Telecommunications Plan Tariffs & Offerings'}
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            {$language === 'vi'
              ? 'Quản lý giá cước thương mại, tiền thuê hàng tháng, cước giờ và tiền đặt cọc thiết bị.'
              : 'Manage commercial pricing, monthly rentals, hourly tariffs, and refundable security deposits.'}
          </p>
        </div>

        <div class="flex items-center space-x-2">
          <span class="inline-flex items-center px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
            <Wifi class="h-3.5 w-3.5 mr-1" /> {$language === 'vi' ? 'Băng rộng' : 'Broadband'}
          </span>
          <span class="inline-flex items-center px-2 py-1 rounded bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium">
            <Radio class="h-3.5 w-3.5 mr-1" /> {$language === 'vi' ? 'Quay số' : 'Dial-Up'}
          </span>
          <span class="inline-flex items-center px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
            <Phone class="h-3.5 w-3.5 mr-1" /> {$language === 'vi' ? 'Điện thoại cố định' : 'Landline'}
          </span>
        </div>
      </div>

      <!-- Plans Table -->
      <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th class="px-4 py-3">{$language === 'vi' ? 'Tên gói & Chi tiết' : 'Plan Name & Details'}</th>
                <th class="px-4 py-3">{$language === 'vi' ? 'Loại kết nối' : 'Connection Type'}</th>
                <th class="px-4 py-3">{$language === 'vi' ? 'Tốc độ / Băng thông' : 'Speed / Bandwidth'}</th>
                <th class="px-4 py-3">{$language === 'vi' ? 'Tiền cọc ($)' : 'Security Deposit ($)'}</th>
                <th class="px-4 py-3">{$language === 'vi' ? 'Cước thuê tháng ($)' : 'Monthly Rental ($)'}</th>
                <th class="px-4 py-3">{$language === 'vi' ? 'Cước theo giờ ($)' : 'Hourly Charge ($)'}</th>
                <th class="px-4 py-3">{$language === 'vi' ? 'Giới hạn dữ liệu' : 'Data Limit'}</th>
                <th class="px-4 py-3">{$language === 'vi' ? 'Trạng thái' : 'Status'}</th>
                <th class="px-4 py-3 text-right">{$language === 'vi' ? 'Thao tác' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              {#each $plans as plan (plan.id)}
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td class="px-4 py-3 max-w-xs">
                    <div class="font-semibold text-slate-900 dark:text-white">{getPlanName(plan, $language)}</div>
                    <div class="text-[11px] text-slate-500">
                      {getPlanBillingCycle(plan.billingCycle, $language)}{plan.validity ? ` · ${plan.validity}` : ''}
                    </div>
                    <div class="text-xs text-slate-500 truncate">{getPlanDescription(plan, $language)}</div>
                  </td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold {plan.type === 'Broadband'
                      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300'
                      : plan.type === 'Dial-Up'
                        ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300'
                        : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300'}">
                      {$language === 'vi' ? (plan.type === 'Broadband' ? 'Cáp quang' : plan.type === 'Dial-Up' ? 'Quay số' : 'Cố định') : plan.type}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-xs font-mono text-slate-700 dark:text-slate-300">{getPlanSpeedOrBandwidth(plan.speedOrBandwidth, $language)}</td>
                  <td class="px-4 py-3 font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">${plan.securityDeposit.toFixed(2)}</td>
                  <td class="px-4 py-3 font-mono tabular-nums font-bold text-indigo-600 dark:text-indigo-400">
                    ${plan.monthlyRental.toFixed(2)}<span class="text-xs font-normal text-slate-400">/{$language === 'vi' ? 'th' : 'mo'}</span>
                  </td>
                  <td class="px-4 py-3 font-mono tabular-nums text-xs text-slate-600 dark:text-slate-400">
                    {plan.hourlyCharge ? `$${plan.hourlyCharge.toFixed(2)}/${$language === 'vi' ? 'giờ' : 'hr'}` : '—'}
                  </td>
                  <td class="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{plan.dataLimit || ($language === 'vi' ? 'Không giới hạn' : 'Unlimited')}</td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                      {$language === 'vi' ? 'Hoạt động' : plan.status}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <div class="flex items-center justify-end space-x-1">
                      <button
                        onclick={() => handleOpenPlanModal(plan)}
                        class="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition"
                        title={$language === 'vi' ? 'Sửa gói cước' : 'Edit Plan'}
                      >
                        <Edit2 class="h-4 w-4" />
                      </button>
                      <button
                        onclick={() => {
                          if (window.confirm($language === 'vi' ? `Xóa gói cước "${plan.name}"?` : `Delete plan "${plan.name}"?`)) {
                            deletePlan(plan.id);
                            toast.success($language === 'vi' ? `Đã xóa gói ${plan.name}.` : `Plan ${plan.name} removed.`);
                          }
                        }}
                        class="p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition"
                        title={$language === 'vi' ? 'Xóa gói cước' : 'Delete Plan'}
                      >
                        <Trash2 class="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  {/if}

  <!-- TAB: CUSTOMER FEEDBACK -->
  {#if activeTab === 'feedback'}
    <div class="space-y-3">
      {#if $feedbacks.length === 0}
        <div class="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-400">
          {$language === 'vi' ? 'Chưa có phản hồi nào từ khách hàng.' : 'No customer feedback collected yet.'}
        </div>
      {/if}
      {#each $feedbacks as f (f.id)}
        <div class="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-2">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="font-semibold text-sm text-slate-900 dark:text-white">
                {f.customerName}
                <span class="text-amber-500 ml-1">{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</span>
              </div>
              <div class="text-[11px] text-slate-500 font-mono">
                {f.category} · {f.accountId || f.orderId || '—'} · {f.createdAt}
              </div>
            </div>
            {#if !f.response}
              <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 uppercase">
                {$language === 'vi' ? 'Chờ phản hồi' : 'Awaiting reply'}
              </span>
            {/if}
          </div>
          <p class="text-sm text-slate-700 dark:text-slate-300">{f.message}</p>

          {#if f.response}
            <p class="text-xs pl-3 border-l-2 border-indigo-400 text-indigo-700 dark:text-indigo-300">
              <strong>{$language === 'vi' ? 'Đã phản hồi' : 'Responded'}:</strong> {f.response}
              <span class="text-slate-400"> — {f.respondedBy} · {f.respondedAt}</span>
            </p>
          {:else if respondingId === f.id}
            <div class="flex gap-2">
              <input
                type="text"
                bind:value={responseText}
                placeholder={$language === 'vi' ? 'Nhập phản hồi cho khách hàng…' : 'Type a reply to the customer…'}
                class="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button onclick={() => submitResponse(f.id)} class="px-3 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white">
                {$language === 'vi' ? 'Gửi' : 'Send'}
              </button>
              <button onclick={() => { respondingId = null; responseText = ''; }} class="px-3 py-2 rounded-lg text-xs border border-slate-200 dark:border-slate-800 text-slate-500">
                {$language === 'vi' ? 'Hủy' : 'Cancel'}
              </button>
            </div>
          {:else}
            <button
              onclick={() => { respondingId = f.id; responseText = ''; }}
              class="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {$language === 'vi' ? 'Phản hồi khách hàng' : 'Respond to customer'}
            </button>
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  <!-- TAB 7: SETTINGS -->
  {#if activeTab === 'settings'}
    <SettingsView />
  {/if}

  <!-- TAB: PROFILE -->
  {#if activeTab === 'profile'}
    <ProfileView />
  {/if}

  <!-- Employee Modal -->
  {#if isEmployeeModalOpen}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div class="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 class="text-lg font-bold text-slate-900 dark:text-white">
            {editingEmployee
              ? ($language === 'vi' ? 'Chỉnh sửa thông tin nhân viên' : 'Edit Employee Details')
              : ($language === 'vi' ? 'Tiếp nhận nhân viên mới' : 'Onboard New Employee')}
          </h3>
          <button
            onclick={() => (isEmployeeModalOpen = false)}
            class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <form onsubmit={handleSaveEmployee} class="space-y-4 text-sm">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {$language === 'vi' ? 'Mã nhân viên *' : 'Employee Code *'}
              </label>
              <input
                type="text"
                required
                bind:value={employeeFormData.employeeCode}
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-mono"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {$language === 'vi' ? 'Họ và tên *' : 'Full Name *'}
              </label>
              <input
                type="text"
                required
                placeholder={$language === 'vi' ? 'Ví dụ: Nguyễn Văn A' : 'e.g. John Doe'}
                bind:value={employeeFormData.name}
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {$language === 'vi' ? 'Địa chỉ Email *' : 'Email Address *'}
              </label>
              <input
                type="email"
                required
                placeholder="name@nexus.telecom"
                bind:value={employeeFormData.email}
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {$language === 'vi' ? 'Số điện thoại *' : 'Phone Number *'}
              </label>
              <input
                type="tel"
                required
                placeholder="+84 901 234 567"
                bind:value={employeeFormData.phone}
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {$language === 'vi' ? 'Chức vụ / Vai trò' : 'Designation Role'}
              </label>
              <select bind:value={employeeFormData.role} class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm">
                <option value="Manager">{$language === 'vi' ? 'Quản lý' : 'Manager'}</option>
                <option value="Retail Staff">{$language === 'vi' ? 'Nhân viên bán lẻ' : 'Retail Staff'}</option>
                <option value="Field Engineer">{$language === 'vi' ? 'Kỹ sư hiện trường' : 'Field Engineer'}</option>
                <option value="Senior Accountant">{$language === 'vi' ? 'Kế toán trưởng' : 'Senior Accountant'}</option>
                <option value="Support Agent">{$language === 'vi' ? 'Nhân viên hỗ trợ' : 'Support Agent'}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {$language === 'vi' ? 'Phòng ban' : 'Department'}
              </label>
              <select bind:value={employeeFormData.department} class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm">
                <option value="Administration">{$language === 'vi' ? 'Hành chính / Quản trị' : 'Administration'}</option>
                <option value="Retail Outlets">{$language === 'vi' ? 'Cửa hàng bán lẻ' : 'Retail Outlets'}</option>
                <option value="Technical Operations">{$language === 'vi' ? 'Kỹ thuật vận hành' : 'Technical Operations'}</option>
                <option value="Finance & Accounts">{$language === 'vi' ? 'Tài chính & Kế toán' : 'Finance & Accounts'}</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {$language === 'vi' ? 'Chi nhánh phân công' : 'Assigned Retail Shop'}
              </label>
              <select bind:value={employeeFormData.retailShopAssigned} class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm">
                <option value="Headquarters (General)">
                  {$language === 'vi' ? 'Trụ sở chính (Tổng bộ)' : 'Headquarters (General)'}
                </option>
                {#each $retailShops as s (s.id)}
                  <option value="{s.name} ({s.shopCode})">{s.name} ({s.shopCode})</option>
                {/each}
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {$language === 'vi' ? 'Tình trạng làm việc' : 'Employment Status'}
              </label>
              <select bind:value={employeeFormData.status} class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm">
                <option value="Active">{$language === 'vi' ? 'Đang làm việc' : 'Active'}</option>
                <option value="Inactive">{$language === 'vi' ? 'Tạm nghỉ việc' : 'Inactive'}</option>
              </select>
            </div>
          </div>

          <div class="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onclick={() => (isEmployeeModalOpen = false)}
              class="px-4 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {$language === 'vi' ? 'Hủy' : 'Cancel'}
            </button>
            <button
              type="submit"
              class="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow"
            >
              {editingEmployee
                ? ($language === 'vi' ? 'Lưu thay đổi' : 'Save Changes')
                : ($language === 'vi' ? 'Xác nhận tiếp nhận' : 'Confirm & Onboard')}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  <!-- Vendor Modal -->
  {#if isVendorModalOpen}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div class="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 class="text-lg font-bold text-slate-900 dark:text-white">
            {editingVendor
              ? ($language === 'vi' ? 'Chỉnh sửa nhà cung cấp' : 'Edit Supplier Details')
              : ($language === 'vi' ? 'Đăng ký nhà cung cấp mới' : 'Register New Vendor')}
          </h3>
          <button
            onclick={() => (isVendorModalOpen = false)}
            class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <form onsubmit={handleSaveVendor} class="space-y-4 text-sm">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {$language === 'vi' ? 'Mã nhà cung cấp *' : 'Vendor Code *'}
              </label>
              <input
                type="text"
                required
                bind:value={vendorFormData.vendorCode}
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-mono"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {$language === 'vi' ? 'Tên công ty *' : 'Company Name *'}
              </label>
              <input
                type="text"
                required
                placeholder={$language === 'vi' ? 'Ví dụ: Thiết bị mạng Cisco' : 'e.g. Cisco Hardware'}
                bind:value={vendorFormData.companyName}
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {$language === 'vi' ? 'Người đại diện liên hệ *' : 'Contact Person *'}
              </label>
              <input
                type="text"
                required
                placeholder={$language === 'vi' ? 'Ví dụ: Trần Minh Hoàng' : 'e.g. John Miller'}
                bind:value={vendorFormData.contactPerson}
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {$language === 'vi' ? 'Danh mục cung ứng' : 'Supply Category'}
              </label>
              <select bind:value={vendorFormData.category} class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm">
                <option value="Fiber Optics & Cabling">{$language === 'vi' ? 'Cáp & Thiết bị quang' : 'Fiber Optics & Cabling'}</option>
                <option value="Modems & Routers">{$language === 'vi' ? 'Modem & Router' : 'Modems & Routers'}</option>
                <option value="Telecom Switches">{$language === 'vi' ? 'Thiết bị chuyển mạch Switch' : 'Telecom Switches'}</option>
                <option value="Field Tooling">{$language === 'vi' ? 'Công cụ kỹ thuật hiện trường' : 'Field Tooling'}</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {$language === 'vi' ? 'Điện thoại liên hệ *' : 'Phone *'}
              </label>
              <input
                type="tel"
                required
                bind:value={vendorFormData.phone}
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {$language === 'vi' ? 'Địa chỉ Email *' : 'Email Address *'}
              </label>
              <input
                type="email"
                required
                bind:value={vendorFormData.email}
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {$language === 'vi' ? 'Địa chỉ trụ sở' : 'Physical Address'}
            </label>
            <input
              type="text"
              bind:value={vendorFormData.address}
              class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
            />
          </div>

          <div class="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onclick={() => (isVendorModalOpen = false)}
              class="px-4 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {$language === 'vi' ? 'Hủy' : 'Cancel'}
            </button>
            <button
              type="submit"
              class="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow"
            >
              {editingVendor
                ? ($language === 'vi' ? 'Lưu thay đổi' : 'Save Changes')
                : ($language === 'vi' ? 'Xác nhận nhà cung cấp' : 'Confirm Vendor')}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  <!-- Plan Modal -->
  {#if isPlanModalOpen}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div class="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 class="text-lg font-bold text-slate-900 dark:text-white">
            {editingPlan
              ? ($language === 'vi' ? 'Chỉnh sửa biểu cước gói dịch vụ' : 'Edit Plan Tariff')
              : ($language === 'vi' ? 'Tạo gói dịch vụ mới' : 'Create New Service Plan')}
          </h3>
          <button
            onclick={() => (isPlanModalOpen = false)}
            class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <form onsubmit={handleSavePlan} class="space-y-4 text-sm">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {$language === 'vi' ? 'Tên gói dịch vụ *' : 'Plan Name *'}
              </label>
              <input
                type="text"
                required
                placeholder="Broadband Giga 500"
                bind:value={planFormData.name}
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {$language === 'vi' ? 'Loại kết nối *' : 'Connection Type *'}
              </label>
              <select bind:value={planFormData.type} class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm">
                <option value="Broadband">{$language === 'vi' ? 'Băng rộng (Broadband)' : 'Broadband'}</option>
                <option value="Dial-Up">{$language === 'vi' ? 'Quay số (Dial-Up)' : 'Dial-Up'}</option>
                <option value="Landline">{$language === 'vi' ? 'Cố định (Landline)' : 'Landline'}</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {$language === 'vi' ? 'Thông số tốc độ / Băng thông *' : 'Speed / Bandwidth Specification *'}
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 500 Mbps Fiber Symmetrical"
              bind:value={planFormData.speedOrBandwidth}
              class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
            />
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {$language === 'vi' ? 'Tiền cọc ($)' : 'Security Deposit ($)'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                bind:value={planFormData.securityDeposit}
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-mono"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {$language === 'vi' ? 'Cước thuê tháng ($)' : 'Monthly Rental ($)'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                bind:value={planFormData.monthlyRental}
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-mono"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {$language === 'vi' ? 'Cước giờ ($)' : 'Hourly Charge ($)'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                bind:value={planFormData.hourlyCharge}
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-mono"
              />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {$language === 'vi' ? 'Kỳ thanh toán' : 'Billing Cycle'}
              </label>
              <select bind:value={planFormData.billingCycle} class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm">
                <option value="Hourly Pack">{$language === 'vi' ? 'Gói theo giờ' : 'Hourly Pack'}</option>
                <option value="Monthly">{$language === 'vi' ? 'Hàng tháng' : 'Monthly'}</option>
                <option value="Quarterly">{$language === 'vi' ? 'Hàng quý (3 tháng)' : 'Quarterly'}</option>
                <option value="Half-Yearly">{$language === 'vi' ? 'Nửa năm (6 tháng)' : 'Half-Yearly'}</option>
                <option value="Yearly">{$language === 'vi' ? 'Hàng năm' : 'Yearly'}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {$language === 'vi' ? 'Thời hạn hiệu lực' : 'Validity'}
              </label>
              <input type="text" placeholder="e.g. 6 Months" bind:value={planFormData.validity}
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {$language === 'vi' ? 'Giới hạn dung lượng' : 'Data Limit'}
              </label>
              <input type="text" bind:value={planFormData.dataLimit}
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm" />
            </div>
          </div>

          {#if planFormData.type === 'Landline'}
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {$language === 'vi' ? 'Biểu phí gọi thoại (Cố định)' : 'Call Charges (Landline)'}
              </label>
              <input type="text" placeholder="Local: 70¢/min · STD: $2.25/min · SMS: $1.00/min" bind:value={planFormData.callRates}
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm" />
            </div>
          {/if}

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {$language === 'vi' ? 'Mô tả gói & Tính năng' : 'Plan Description & Features'}
            </label>
            <textarea
              rows="2"
              bind:value={planFormData.description}
              class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
            ></textarea>
          </div>

          <div class="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onclick={() => (isPlanModalOpen = false)}
              class="px-4 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {$language === 'vi' ? 'Hủy' : 'Cancel'}
            </button>
            <button
              type="submit"
              class="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow"
            >
              {editingPlan
                ? ($language === 'vi' ? 'Lưu thay đổi' : 'Save Changes')
                : ($language === 'vi' ? 'Xác nhận gói cước' : 'Confirm Plan')}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</DashboardLayout>


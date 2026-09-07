<script lang="ts">
  // Mirrors pages/AdminDashboard.tsx of the React original.
  import { nexusStore } from '../context/NexusContext';
  import { languageStore } from '../context/LanguageContext';
  import DashboardLayout from '../components/layout/DashboardLayout.svelte';
  import type { NavItem } from '../components/layout/DashboardLayout.svelte';
  import {
    Users, Store, Truck, Layers, Package, Plus, Search, Edit2, Trash2,
    TrendingUp, CheckCircle2, Phone, MapPin, Wifi, Radio, X, Settings,
  } from 'lucide-svelte';
  import type { Employee, Vendor, Plan } from '../types/nexus';
  import { toast } from 'svelte-sonner';

  type AdminTab = 'overview' | 'employees' | 'stock' | 'vendors' | 'shops' | 'plans' | 'settings';

  const {
    employees, addEmployee, updateEmployee, deleteEmployee,
    vendors, addVendor, updateVendor, deleteVendor,
    retailShops, plans, addPlan, updatePlan, deletePlan, inventory,
  } = nexusStore;
  const { t, language } = languageStore;

  // Active navigation tab
  let activeTab = $state<AdminTab>('overview');

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
    monthlyRental: 49.99,
    hourlyCharge: 0,
    securityDeposit: 50,
    dataLimit: 'Unlimited',
    status: 'Active' as Plan['status'],
    description: '',
  });

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
      };
    } else {
      editingPlan = null;
      planFormData = {
        name: '',
        type: 'Broadband',
        speedOrBandwidth: '150 Mbps Fiber',
        monthlyRental: 59.99,
        hourlyCharge: 0,
        securityDeposit: 60.0,
        dataLimit: 'Unlimited',
        status: 'Active',
        description: 'High-speed broadband package designed for reliable connectivity.',
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
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Retail Shops</span>
            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <Store class="h-5 w-5" />
            </div>
          </div>
          <div class="mt-3 flex items-baseline space-x-2">
            <span class="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">{totalRetailShops}</span>
            <span class="text-xs text-emerald-600 dark:text-emerald-400 font-medium">100% Operational</span>
          </div>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Across New York metro regions</p>
        </div>

        <!-- Active Employees Card -->
        <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Employees</span>
            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
              <Users class="h-5 w-5" />
            </div>
          </div>
          <div class="mt-3 flex items-baseline space-x-2">
            <span class="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">{activeEmployees}</span>
            <span class="text-xs text-slate-500 dark:text-slate-400">/ {$employees.length} Total Staff</span>
          </div>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Retail, Technical & Operations teams</p>
        </div>

        <!-- Subscribers Served Card -->
        <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Subscribers Served</span>
            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 class="h-5 w-5" />
            </div>
          </div>
          <div class="mt-3 flex items-baseline space-x-2">
            <span class="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">{totalSubscribers.toLocaleString()}</span>
            <span class="text-xs text-emerald-600 dark:text-emerald-400 font-medium">+14% YoY</span>
          </div>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Broadband, Dial-Up & Landlines</p>
        </div>

        <!-- Registered Vendors Card -->
        <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Registered Vendors</span>
            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
              <Truck class="h-5 w-5" />
            </div>
          </div>
          <div class="mt-3 flex items-baseline space-x-2">
            <span class="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">{$vendors.length}</span>
            <span class="text-xs text-slate-500 dark:text-slate-400">Approved Suppliers</span>
          </div>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Corning, Cisco, Zyxel, Amphenol</p>
        </div>
      </div>

      <!-- Quick Actions & Department Snapshot -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Retail Outlet Network Highlights -->
        <div class="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-base text-slate-900 dark:text-white">Retail Shop Footprint</h3>
            <button
              onclick={() => (activeTab = 'shops')}
              class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              View All Outlets →
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
                    <div class="text-xs text-slate-500 dark:text-slate-400">Manager: {shop.managerName} • {shop.city}</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-sm font-semibold text-slate-900 dark:text-white">{shop.totalSubscribersServed.toLocaleString()} subs</div>
                  <div class="text-xs text-emerald-600 dark:text-emerald-400">{shop.activeEmployeesCount} on-duty staff</div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Administrative Quick Actions -->
        <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
          <h3 class="font-semibold text-base text-slate-900 dark:text-white">Quick Administration</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Fast management shortcuts to maintain staff and catalog records.
          </p>

          <div class="space-y-2">
            <button
              onclick={() => handleOpenEmployeeModal()}
              class="w-full text-left p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition flex items-center justify-between text-sm"
            >
              <span class="font-medium">Onboard New Employee</span>
              <Plus class="h-4 w-4 text-indigo-500" />
            </button>
            <button
              onclick={() => handleOpenVendorModal()}
              class="w-full text-left p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition flex items-center justify-between text-sm"
            >
              <span class="font-medium">Register New Supplier</span>
              <Plus class="h-4 w-4 text-indigo-500" />
            </button>
            <button
              onclick={() => handleOpenPlanModal()}
              class="w-full text-left p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition flex items-center justify-between text-sm"
            >
              <span class="font-medium">Configure Service Plan</span>
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
            placeholder="Search by name, ID, or email..."
            bind:value={employeeSearch}
            class="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div class="flex items-center space-x-2 w-full sm:w-auto">
          <span class="text-xs text-slate-500 whitespace-nowrap">Filter Role:</span>
          <select
            bind:value={employeeRoleFilter}
            class="text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Roles</option>
            <option value="Manager">Manager</option>
            <option value="Retail Staff">Retail Staff</option>
            <option value="Field Engineer">Field Engineer</option>
            <option value="Senior Accountant">Senior Accountant</option>
          </select>
        </div>
      </div>

      <!-- Employee Data Table -->
      <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th class="px-4 py-3">Code / ID</th>
                <th class="px-4 py-3">Full Name</th>
                <th class="px-4 py-3">Contact & Email</th>
                <th class="px-4 py-3">Role & Dept</th>
                <th class="px-4 py-3">Assigned Shop</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              {#each filteredEmployees as emp (emp.id)}
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td class="px-4 py-3 font-mono font-medium text-slate-900 dark:text-slate-100">{emp.employeeCode}</td>
                  <td class="px-4 py-3">
                    <div class="font-semibold text-slate-900 dark:text-white">{emp.name}</div>
                    <div class="text-xs text-slate-400">Joined: {emp.dateOfJoining}</div>
                  </td>
                  <td class="px-4 py-3 text-xs space-y-0.5">
                    <div class="text-slate-600 dark:text-slate-300">{emp.email}</div>
                    <div class="text-slate-400">{emp.phone}</div>
                  </td>
                  <td class="px-4 py-3">
                    <span class="inline-block px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{emp.role}</span>
                    <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{emp.department}</div>
                  </td>
                  <td class="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{emp.retailShopAssigned || 'Headquarters'}</td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {emp.status === 'Active'
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}">
                      {emp.status}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <div class="flex items-center justify-end space-x-1">
                      <button
                        onclick={() => handleOpenEmployeeModal(emp)}
                        class="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition"
                        title="Edit Employee"
                      >
                        <Edit2 class="h-4 w-4" />
                      </button>
                      <button
                        onclick={() => handleDeleteEmployee(emp)}
                        class="p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition"
                        title="Delete Employee"
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
          <div class="text-xs font-semibold text-slate-500 uppercase">Total Equipment Stock</div>
          <div class="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {$inventory.reduce((sum, item) => sum + item.stockQuantity, 0)} Units
          </div>
        </div>
        <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div class="text-xs font-semibold text-slate-500 uppercase">Low Stock Alerts</div>
          <div class="text-2xl font-bold text-amber-500 mt-1">{lowStockItems.length} Items Below Reorder</div>
        </div>
        <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div class="text-xs font-semibold text-slate-500 uppercase">Valuation (Est.)</div>
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
                <th class="px-4 py-3">Item Code</th>
                <th class="px-4 py-3">Device / Equipment Name</th>
                <th class="px-4 py-3">Category</th>
                <th class="px-4 py-3">Depot Location</th>
                <th class="px-4 py-3">Stock Units</th>
                <th class="px-4 py-3">Reorder Threshold</th>
                <th class="px-4 py-3">Unit Cost</th>
                <th class="px-4 py-3">Supplier</th>
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
                      <span class="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 uppercase">Low</span>
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
                <th class="px-4 py-3">Vendor Code</th>
                <th class="px-4 py-3">Company Name</th>
                <th class="px-4 py-3">Contact Person</th>
                <th class="px-4 py-3">Supply Category</th>
                <th class="px-4 py-3">Direct Phone & Email</th>
                <th class="px-4 py-3">Facility Address</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3 text-right">Actions</th>
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
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">{vnd.status}</span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <div class="flex items-center justify-end space-x-1">
                      <button
                        onclick={() => handleOpenVendorModal(vnd)}
                        class="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition"
                        title="Edit Vendor"
                      >
                        <Edit2 class="h-4 w-4" />
                      </button>
                      <button
                        onclick={() => handleDeleteVendor(vnd)}
                        class="p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition"
                        title="Delete Vendor"
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
                  <p class="text-xs text-slate-500 dark:text-slate-400">{shop.city} Regional Center</p>
                </div>
              </div>
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                Active Outlet
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
                <span>Store Manager: <strong class="text-slate-900 dark:text-white">{shop.managerName}</strong></span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 pt-1 text-center">
              <div class="p-2 rounded bg-slate-50 dark:bg-slate-800/60">
                <div class="text-xs text-slate-400">On-Duty Employees</div>
                <div class="text-lg font-bold text-slate-900 dark:text-white">{shop.activeEmployeesCount} Staff</div>
              </div>
              <div class="p-2 rounded bg-slate-50 dark:bg-slate-800/60">
                <div class="text-xs text-slate-400">Total Subscribers</div>
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
          <h3 class="font-semibold text-slate-900 dark:text-white">Telecommunications Plan Tariffs & Offerings</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Manage commercial pricing, monthly rentals, hourly tariffs, and refundable security deposits.
          </p>
        </div>

        <div class="flex items-center space-x-2">
          <span class="inline-flex items-center px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
            <Wifi class="h-3.5 w-3.5 mr-1" /> Broadband
          </span>
          <span class="inline-flex items-center px-2 py-1 rounded bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium">
            <Radio class="h-3.5 w-3.5 mr-1" /> Dial-Up
          </span>
          <span class="inline-flex items-center px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
            <Phone class="h-3.5 w-3.5 mr-1" /> Landline
          </span>
        </div>
      </div>

      <!-- Plans Table (UI required by prompt) -->
      <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th class="px-4 py-3">Plan Name & Details</th>
                <th class="px-4 py-3">Connection Type</th>
                <th class="px-4 py-3">Speed / Bandwidth</th>
                <th class="px-4 py-3">Security Deposit ($)</th>
                <th class="px-4 py-3">Monthly Rental ($)</th>
                <th class="px-4 py-3">Hourly Charge ($)</th>
                <th class="px-4 py-3">Data Limit</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              {#each $plans as plan (plan.id)}
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td class="px-4 py-3 max-w-xs">
                    <div class="font-semibold text-slate-900 dark:text-white">{plan.name}</div>
                    <div class="text-xs text-slate-500 truncate">{plan.description}</div>
                  </td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold {plan.type === 'Broadband'
                      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300'
                      : plan.type === 'Dial-Up'
                        ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300'
                        : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300'}">
                      {plan.type}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-xs font-mono text-slate-700 dark:text-slate-300">{plan.speedOrBandwidth}</td>
                  <td class="px-4 py-3 font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">${plan.securityDeposit.toFixed(2)}</td>
                  <td class="px-4 py-3 font-mono tabular-nums font-bold text-indigo-600 dark:text-indigo-400">
                    ${plan.monthlyRental.toFixed(2)}<span class="text-xs font-normal text-slate-400">/mo</span>
                  </td>
                  <td class="px-4 py-3 font-mono tabular-nums text-xs text-slate-600 dark:text-slate-400">
                    {plan.hourlyCharge ? `$${plan.hourlyCharge.toFixed(2)}/hr` : '—'}
                  </td>
                  <td class="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{plan.dataLimit || 'Unlimited'}</td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">{plan.status}</span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <div class="flex items-center justify-end space-x-1">
                      <button
                        onclick={() => handleOpenPlanModal(plan)}
                        class="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition"
                        title="Edit Plan"
                      >
                        <Edit2 class="h-4 w-4" />
                      </button>
                      <button
                        onclick={() => {
                          if (window.confirm(`Delete plan "${plan.name}"?`)) {
                            deletePlan(plan.id);
                            toast.success(`Plan ${plan.name} removed.`);
                          }
                        }}
                        class="p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition"
                        title="Delete Plan"
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

  <!-- TAB 7: SETTINGS -->
  {#if activeTab === 'settings'}
    <div class="rounded-xl bg-white dark:bg-[#1E3349] p-8 text-center shadow-sm border border-[#CCE4F7] dark:border-[#253D56]">
      <Settings class="h-12 w-12 mx-auto text-[#7899B8] dark:text-[#5E7F9F] mb-4" />
      <h3 class="text-lg font-bold text-[#0F1D2B] dark:text-white mb-2">{$t.dashboard.settingsTitle}</h3>
      <p class="text-[#537292] dark:text-[#8DB0D4]">{$t.dashboard.settingsDesc}</p>
    </div>
  {/if}

  <!-- Employee Modal -->
  {#if isEmployeeModalOpen}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div class="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 class="text-lg font-bold text-slate-900 dark:text-white">
            {editingEmployee ? 'Edit Employee Details' : 'Onboard New Employee'}
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
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Employee Code</label>
              <input
                type="text"
                required
                bind:value={employeeFormData.employeeCode}
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-mono"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                bind:value={employeeFormData.name}
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder="name@nexus.telecom"
                bind:value={employeeFormData.email}
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                placeholder="+1 (555) 000-0000"
                bind:value={employeeFormData.phone}
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Designation Role</label>
              <select bind:value={employeeFormData.role} class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm">
                <option value="Manager">Manager</option>
                <option value="Retail Staff">Retail Staff</option>
                <option value="Field Engineer">Field Engineer</option>
                <option value="Senior Accountant">Senior Accountant</option>
                <option value="Support Agent">Support Agent</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Department</label>
              <select bind:value={employeeFormData.department} class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm">
                <option value="Administration">Administration</option>
                <option value="Retail Outlets">Retail Outlets</option>
                <option value="Technical Operations">Technical Operations</option>
                <option value="Finance & Accounts">Finance & Accounts</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Assigned Retail Shop</label>
              <select bind:value={employeeFormData.retailShopAssigned} class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm">
                <option value="Headquarters (General)">Headquarters (General)</option>
                {#each $retailShops as s (s.id)}
                  <option value="{s.name} ({s.shopCode})">{s.name} ({s.shopCode})</option>
                {/each}
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Employment Status</label>
              <select bind:value={employeeFormData.status} class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div class="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onclick={() => (isEmployeeModalOpen = false)}
              class="px-4 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow"
            >
              {editingEmployee ? 'Save Changes' : 'Confirm & Onboard'}
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
            {editingVendor ? 'Edit Supplier Details' : 'Register New Vendor'}
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
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Vendor Code</label>
              <input
                type="text"
                required
                bind:value={vendorFormData.vendorCode}
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-mono"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Company Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Cisco Hardware"
                bind:value={vendorFormData.companyName}
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Person *</label>
              <input
                type="text"
                required
                placeholder="e.g. John Miller"
                bind:value={vendorFormData.contactPerson}
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Supply Category</label>
              <select bind:value={vendorFormData.category} class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm">
                <option value="Fiber Optics & Cabling">Fiber Optics & Cabling</option>
                <option value="Modems & Routers">Modems & Routers</option>
                <option value="Telecom Switches">Telecom Switches</option>
                <option value="Field Tooling">Field Tooling</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone</label>
              <input
                type="tel"
                required
                bind:value={vendorFormData.phone}
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                bind:value={vendorFormData.email}
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Physical Address</label>
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
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow"
            >
              {editingVendor ? 'Save Changes' : 'Confirm Vendor'}
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
            {editingPlan ? 'Edit Plan Tariff' : 'Create New Service Plan'}
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
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Plan Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Broadband Giga 500"
                bind:value={planFormData.name}
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Connection Type *</label>
              <select bind:value={planFormData.type} class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm">
                <option value="Broadband">Broadband</option>
                <option value="Dial-Up">Dial-Up</option>
                <option value="Landline">Landline</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Speed / Bandwidth Specification *</label>
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
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Security Deposit ($)</label>
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
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Monthly Rental ($)</label>
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
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Hourly Charge ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                bind:value={planFormData.hourlyCharge}
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-mono"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Plan Description & Features</label>
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
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow"
            >
              {editingPlan ? 'Save Changes' : 'Confirm Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</DashboardLayout>


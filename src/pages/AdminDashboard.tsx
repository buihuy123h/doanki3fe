/**
 * =======================================================================
 * NEXUS SERVICE MARKETING SYSTEM - ADMIN (MANAGER) DASHBOARD
 * =======================================================================
 * 
 * ROLE: Admin / General Manager
 * PURPOSE: Executive oversight and management of human resources, suppliers,
 *          retail store branches, stock inventories, and service plan tariffs.
 * 
 * LAYOUT STRUCTURE:
 * 1. AdminHeader: Breadcrumb indicator, active manager profile badge, date/time.
 * 2. AdminSidebar: Tabbed vertical navigation for:
 *    - Overview (Summary KPIs: Total Retail Shops, Active Employees, Revenue)
 *    - Employee Management (Add/Edit/Delete Employee modals & datatable)
 *    - Stock / Inventory (Hardware supplies, reorder indicators)
 *    - Vendor Management (Add/Edit/Delete Vendor modals & contact directory)
 *    - Retail Shops (Outlets, locations, managers & connection stats)
 *    - Plan Management (Broadband, Dial-Up, Landline tariffs & pricing)
 * 3. MainContentArea: Dynamic section rendered based on the active sidebar selection.
 * 4. Modals / Dialogs: Clean administrative forms for creating & modifying records.
 * =======================================================================
 */

import React, { useState } from 'react';
import { useNexus } from '../context/NexusContext';
import { DashboardLayout, type NavItem } from '../components/layout/DashboardLayout';
import {
  Users,
  Store,
  Truck,
  Layers,
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  TrendingUp,
  CheckCircle2,
  Phone,
  MapPin,
  Wifi,
  Radio,
  X,
} from 'lucide-react';
import type { Employee, Vendor, Plan } from '../types/nexus';
import { toast } from 'sonner';

type AdminTab = 'overview' | 'employees' | 'stock' | 'vendors' | 'shops' | 'plans';

export const AdminDashboard: React.FC = () => {
  const {
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    vendors,
    addVendor,
    updateVendor,
    deleteVendor,
    retailShops,
    plans,
    addPlan,
    updatePlan,
    deletePlan,
    inventory,
  } = useNexus();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Employee Search and Filter
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeRoleFilter, setEmployeeRoleFilter] = useState('All');

  // Employee Modal State
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [employeeFormData, setEmployeeFormData] = useState({
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
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [vendorFormData, setVendorFormData] = useState({
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
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planFormData, setPlanFormData] = useState({
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

  // -------------------------------------------------------------
  // Calculations for Summary Area
  // -------------------------------------------------------------
  const totalRetailShops = retailShops.length;
  const activeEmployees = employees.filter((e) => e.status === 'Active').length;
  const totalSubscribers = retailShops.reduce((sum, s) => sum + s.totalSubscribersServed, 0);
  const lowStockItems = inventory.filter((item) => item.stockQuantity <= item.reorderLevel);

  // -------------------------------------------------------------
  // Employee Form Submission Handlers
  // -------------------------------------------------------------
  const handleOpenEmployeeModal = (emp?: Employee) => {
    if (emp) {
      setEditingEmployee(emp);
      setEmployeeFormData({
        employeeCode: emp.employeeCode,
        name: emp.name,
        email: emp.email,
        phone: emp.phone,
        role: emp.role,
        department: emp.department,
        retailShopAssigned: emp.retailShopAssigned || 'Downtown Flagship (SH-01)',
        status: emp.status,
        dateOfJoining: emp.dateOfJoining,
      });
    } else {
      setEditingEmployee(null);
      setEmployeeFormData({
        employeeCode: `EMP-${1000 + employees.length + 1}`,
        name: '',
        email: '',
        phone: '',
        role: 'Retail Staff',
        department: 'Retail Outlets',
        retailShopAssigned: 'Downtown Flagship (SH-01)',
        status: 'Active',
        dateOfJoining: new Date().toISOString().slice(0, 10),
      });
    }
    setIsEmployeeModalOpen(true);
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
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
    setIsEmployeeModalOpen(false);
  };

  const handleDeleteEmployee = (emp: Employee) => {
    if (window.confirm(`Are you sure you want to remove employee "${emp.name}" (${emp.employeeCode})?`)) {
      deleteEmployee(emp.id);
      toast.success(`Employee ${emp.name} removed.`);
    }
  };

  // -------------------------------------------------------------
  // Vendor Form Submission Handlers
  // -------------------------------------------------------------
  const handleOpenVendorModal = (vnd?: Vendor) => {
    if (vnd) {
      setEditingVendor(vnd);
      setVendorFormData({
        vendorCode: vnd.vendorCode,
        companyName: vnd.companyName,
        contactPerson: vnd.contactPerson,
        category: vnd.category,
        phone: vnd.phone,
        email: vnd.email,
        address: vnd.address,
        rating: vnd.rating,
        status: vnd.status,
      });
    } else {
      setEditingVendor(null);
      setVendorFormData({
        vendorCode: `VND-${400 + vendors.length + 1}`,
        companyName: '',
        contactPerson: '',
        category: 'Modems & Routers',
        phone: '',
        email: '',
        address: '',
        rating: 5,
        status: 'Active',
      });
    }
    setIsVendorModalOpen(true);
  };

  const handleSaveVendor = (e: React.FormEvent) => {
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
    setIsVendorModalOpen(false);
  };

  const handleDeleteVendor = (vnd: Vendor) => {
    if (window.confirm(`Confirm termination of supplier "${vnd.companyName}"?`)) {
      deleteVendor(vnd.id);
      toast.success(`Vendor ${vnd.companyName} removed.`);
    }
  };

  // -------------------------------------------------------------
  // Plan Form Submission Handlers
  // -------------------------------------------------------------
  const handleOpenPlanModal = (plan?: Plan) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanFormData({
        name: plan.name,
        type: plan.type,
        speedOrBandwidth: plan.speedOrBandwidth,
        monthlyRental: plan.monthlyRental,
        hourlyCharge: plan.hourlyCharge || 0,
        securityDeposit: plan.securityDeposit,
        dataLimit: plan.dataLimit || 'Unlimited',
        status: plan.status,
        description: plan.description,
      });
    } else {
      setEditingPlan(null);
      setPlanFormData({
        name: '',
        type: 'Broadband',
        speedOrBandwidth: '150 Mbps Fiber',
        monthlyRental: 59.99,
        hourlyCharge: 0,
        securityDeposit: 60.0,
        dataLimit: 'Unlimited',
        status: 'Active',
        description: 'High-speed broadband package designed for reliable connectivity.',
      });
    }
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = (e: React.FormEvent) => {
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
    setIsPlanModalOpen(false);
  };

  // -------------------------------------------------------------
  // Filtering Employees
  // -------------------------------------------------------------
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      emp.email.toLowerCase().includes(employeeSearch.toLowerCase());
    const matchesRole = employeeRoleFilter === 'All' || emp.role === employeeRoleFilter;
    return matchesSearch && matchesRole;
  });

  const adminNavItems: NavItem[] = [
    { id: 'overview', label: 'Dashboard', icon: TrendingUp },
    { id: 'employees', label: 'Employee Management', icon: Users, badge: employees.length },
    {
      id: 'stock',
      label: 'Stock / Inventory',
      icon: Package,
      badge: lowStockItems.length > 0 ? `${lowStockItems.length} low` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    { id: 'vendors', label: 'Vendor Management', icon: Truck, badge: vendors.length },
    { id: 'shops', label: 'Retail Shops', icon: Store, badge: retailShops.length },
    { id: 'plans', label: 'Plan Management', icon: Layers, badge: plans.length },
  ];

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as AdminTab)}
      navItems={adminNavItems}
      roleBadgeTitle="Manager Workspace (Admin)"
      pageTitle={
        activeTab === 'overview'
          ? 'Dashboard'
          : adminNavItems.find((t) => t.id === activeTab)?.label
      }
      primaryAction={
        activeTab === 'employees'
          ? { label: 'Add Employee', onClick: () => handleOpenEmployeeModal() }
          : activeTab === 'vendors'
          ? { label: 'Add Vendor', onClick: () => handleOpenVendorModal() }
          : activeTab === 'plans'
          ? { label: 'Add Plan', onClick: () => handleOpenPlanModal() }
          : { label: '+ New Report', onClick: () => toast.success('Đang tạo báo cáo tổng hợp mới...') }
      }
    >
      {/* ------------------------------------------------------------- */}
      {/* TAB 1: OVERVIEW & SUMMARY (Required by Codex Prompt #1)        */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'overview' && (
        <div key={activeTab} className="tab-content-animate space-y-6">
          {/* Primary Required KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Total Retail Shops Card */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Total Retail Shops
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                    <Store className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
                    {totalRetailShops}
                  </span>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">100% Operational</span>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Across New York metro regions
                </p>
              </div>

              {/* Active Employees Card */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Active Employees
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
                    {activeEmployees}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    / {employees.length} Total Staff
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Retail, Technical & Operations teams
                </p>
              </div>

              {/* Active Network Connections */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Subscribers Served
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
                    {totalSubscribers.toLocaleString()}
                  </span>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">+14% YoY</span>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Broadband, Dial-Up & Landlines
                </p>
              </div>

              {/* Hardware Inventory Health */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Registered Vendors
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
                    <Truck className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
                    {vendors.length}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Approved Suppliers</span>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Corning, Cisco, Zyxel, Amphenol
                </p>
              </div>
            </div>

            {/* Quick Actions & Department Snapshot */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Retail Outlet Network Highlights */}
              <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-base text-slate-900 dark:text-white">
                    Retail Shop Footprint
                  </h3>
                  <button
                    onClick={() => setActiveTab('shops')}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    View All Outlets →
                  </button>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {retailShops.map((shop) => (
                    <div key={shop.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs">
                          {shop.shopCode}
                        </div>
                        <div>
                          <div className="font-medium text-sm text-slate-900 dark:text-white">
                            {shop.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Manager: {shop.managerName} • {shop.city}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">
                          {shop.totalSubscribersServed.toLocaleString()} subs
                        </div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400">
                          {shop.activeEmployeesCount} on-duty staff
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Administrative Quick Actions */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
                <h3 className="font-semibold text-base text-slate-900 dark:text-white">
                  Quick Administration
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Fast management shortcuts to maintain staff and catalog records.
                </p>

                <div className="space-y-2">
                  <button
                    onClick={() => handleOpenEmployeeModal()}
                    className="w-full text-left p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition flex items-center justify-between text-sm"
                  >
                    <span className="font-medium">Onboard New Employee</span>
                    <Plus className="h-4 w-4 text-indigo-500" />
                  </button>
                  <button
                    onClick={() => handleOpenVendorModal()}
                    className="w-full text-left p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition flex items-center justify-between text-sm"
                  >
                    <span className="font-medium">Register New Supplier</span>
                    <Plus className="h-4 w-4 text-indigo-500" />
                  </button>
                  <button
                    onClick={() => handleOpenPlanModal()}
                    className="w-full text-left p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition flex items-center justify-between text-sm"
                  >
                    <span className="font-medium">Configure Service Plan</span>
                    <Plus className="h-4 w-4 text-indigo-500" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: EMPLOYEE MANAGEMENT (Required by Codex Prompt #1)      */}
        {/* Forms or modals to Add/Edit/Delete employee details           */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'employees' && (
          <div className="space-y-4">
            {/* Search and Filters toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, ID, or email..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <span className="text-xs text-slate-500 whitespace-nowrap">Filter Role:</span>
                <select
                  value={employeeRoleFilter}
                  onChange={(e) => setEmployeeRoleFilter(e.target.value)}
                  className="text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="All">All Roles</option>
                  <option value="Manager">Manager</option>
                  <option value="Retail Staff">Retail Staff</option>
                  <option value="Field Engineer">Field Engineer</option>
                  <option value="Senior Accountant">Senior Accountant</option>
                </select>
              </div>
            </div>

            {/* Employee Data Table */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Code / ID</th>
                      <th className="px-4 py-3">Full Name</th>
                      <th className="px-4 py-3">Contact & Email</th>
                      <th className="px-4 py-3">Role & Dept</th>
                      <th className="px-4 py-3">Assigned Shop</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredEmployees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3 font-mono font-medium text-slate-900 dark:text-slate-100">
                          {emp.employeeCode}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900 dark:text-white">{emp.name}</div>
                          <div className="text-xs text-slate-400">Joined: {emp.dateOfJoining}</div>
                        </td>
                        <td className="px-4 py-3 text-xs space-y-0.5">
                          <div className="text-slate-600 dark:text-slate-300">{emp.email}</div>
                          <div className="text-slate-400">{emp.phone}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {emp.role}
                          </span>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {emp.department}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                          {emp.retailShopAssigned || 'Headquarters'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              emp.status === 'Active'
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            {emp.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => handleOpenEmployeeModal(emp)}
                              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition"
                              title="Edit Employee"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(emp)}
                              className="p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition"
                              title="Delete Employee"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: STOCK / INVENTORY (Required by Codex Prompt #1)        */}
        {/* Hardware supplies, stock levels, reorder threshold alerts     */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'stock' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                <div className="text-xs font-semibold text-slate-500 uppercase">Total Equipment Stock</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {inventory.reduce((sum, item) => sum + item.stockQuantity, 0)} Units
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                <div className="text-xs font-semibold text-slate-500 uppercase">Low Stock Alerts</div>
                <div className="text-2xl font-bold text-amber-500 mt-1">
                  {lowStockItems.length} Items Below Reorder
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                <div className="text-xs font-semibold text-slate-500 uppercase">Valuation (Est.)</div>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  ${inventory.reduce((sum, item) => sum + item.stockQuantity * item.unitCost, 0).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Item Code</th>
                      <th className="px-4 py-3">Device / Equipment Name</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Depot Location</th>
                      <th className="px-4 py-3">Stock Units</th>
                      <th className="px-4 py-3">Reorder Threshold</th>
                      <th className="px-4 py-3">Unit Cost</th>
                      <th className="px-4 py-3">Supplier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {inventory.map((item) => {
                      const isLow = item.stockQuantity <= item.reorderLevel;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-4 py-3 font-mono font-medium text-slate-900 dark:text-slate-100">
                            {item.itemCode}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                            {item.name}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {item.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                            {item.location}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`font-semibold tabular-nums ${
                                isLow ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'
                              }`}
                            >
                              {item.stockQuantity}
                            </span>
                            {isLow && (
                              <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 uppercase">
                                Low
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 tabular-nums">
                            {item.reorderLevel}
                          </td>
                          <td className="px-4 py-3 font-mono tabular-nums text-xs">
                            ${item.unitCost.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                            {item.supplier}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: VENDOR MANAGEMENT (Required by Codex Prompt #1)        */}
        {/* Forms or modals to Add/Edit/Delete vendor details             */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'vendors' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Vendor Code</th>
                      <th className="px-4 py-3">Company Name</th>
                      <th className="px-4 py-3">Contact Person</th>
                      <th className="px-4 py-3">Supply Category</th>
                      <th className="px-4 py-3">Direct Phone & Email</th>
                      <th className="px-4 py-3">Facility Address</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {vendors.map((vnd) => (
                      <tr key={vnd.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-mono font-medium text-slate-900 dark:text-slate-100">
                          {vnd.vendorCode}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          {vnd.companyName}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                          {vnd.contactPerson}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                            {vnd.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs space-y-0.5">
                          <div className="text-slate-600 dark:text-slate-300">{vnd.phone}</div>
                          <div className="text-slate-400">{vnd.email}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">
                          {vnd.address}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                            {vnd.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => handleOpenVendorModal(vnd)}
                              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition"
                              title="Edit Vendor"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteVendor(vnd)}
                              className="p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition"
                              title="Delete Vendor"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 5: RETAIL SHOPS (Required by Codex Prompt #1)             */}
        {/* Summary of total retail shops, managers, locations, counts   */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'shops' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {retailShops.map((shop) => (
                <div
                  key={shop.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                        {shop.shopCode}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">
                          {shop.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{shop.city} Regional Center</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                      Active Outlet
                    </span>
                  </div>

                  <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300 border-t border-b border-slate-100 dark:border-slate-800 py-3">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>{shop.address}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span>{shop.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      <span>Store Manager: <strong className="text-slate-900 dark:text-white">{shop.managerName}</strong></span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 text-center">
                    <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/60">
                      <div className="text-xs text-slate-400">On-Duty Employees</div>
                      <div className="text-lg font-bold text-slate-900 dark:text-white">
                        {shop.activeEmployeesCount} Staff
                      </div>
                    </div>
                    <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/60">
                      <div className="text-xs text-slate-400">Total Subscribers</div>
                      <div className="text-lg font-bold text-slate-900 dark:text-white">
                        {shop.totalSubscribersServed.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 6: PLAN MANAGEMENT (Required by Codex Prompt #1)          */}
        {/* "A 'Plan Management' section (UI only) with a table listing   */}
        {/* current plans (e.g., Broadband, Dial-Up, Landline) and their  */}
        {/* charges."                                                     */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Telecommunications Plan Tariffs & Offerings
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage commercial pricing, monthly rentals, hourly tariffs, and refundable security deposits.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
                  <Wifi className="h-3.5 w-3.5 mr-1" /> Broadband
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium">
                  <Radio className="h-3.5 w-3.5 mr-1" /> Dial-Up
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                  <Phone className="h-3.5 w-3.5 mr-1" /> Landline
                </span>
              </div>
            </div>

            {/* Plans Table (UI required by prompt) */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Plan Name & Details</th>
                      <th className="px-4 py-3">Connection Type</th>
                      <th className="px-4 py-3">Speed / Bandwidth</th>
                      <th className="px-4 py-3">Security Deposit ($)</th>
                      <th className="px-4 py-3">Monthly Rental ($)</th>
                      <th className="px-4 py-3">Hourly Charge ($)</th>
                      <th className="px-4 py-3">Data Limit</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {plans.map((plan) => (
                      <tr key={plan.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3 max-w-xs">
                          <div className="font-semibold text-slate-900 dark:text-white">{plan.name}</div>
                          <div className="text-xs text-slate-500 truncate">{plan.description}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                              plan.type === 'Broadband'
                                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300'
                                : plan.type === 'Dial-Up'
                                ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300'
                                : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300'
                            }`}
                          >
                            {plan.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-slate-700 dark:text-slate-300">
                          {plan.speedOrBandwidth}
                        </td>
                        <td className="px-4 py-3 font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">
                          ${plan.securityDeposit.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 font-mono tabular-nums font-bold text-indigo-600 dark:text-indigo-400">
                          ${plan.monthlyRental.toFixed(2)}
                          <span className="text-xs font-normal text-slate-400">/mo</span>
                        </td>
                        <td className="px-4 py-3 font-mono tabular-nums text-xs text-slate-600 dark:text-slate-400">
                          {plan.hourlyCharge ? `$${plan.hourlyCharge.toFixed(2)}/hr` : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                          {plan.dataLimit || 'Unlimited'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                            {plan.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => handleOpenPlanModal(plan)}
                              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition"
                              title="Edit Plan"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete plan "${plan.name}"?`)) {
                                  deletePlan(plan.id);
                                  toast.success(`Plan ${plan.name} removed.`);
                                }
                              }}
                              className="p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition"
                              title="Delete Plan"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      {/* ------------------------------------------------------------- */}
      {/* 3. MODALS (Add / Edit Employee, Vendor, Plan)                 */}
      {/* ------------------------------------------------------------- */}

      {/* Employee Modal */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingEmployee ? 'Edit Employee Details' : 'Onboard New Employee'}
              </h3>
              <button
                onClick={() => setIsEmployeeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Employee Code
                  </label>
                  <input
                    type="text"
                    required
                    value={employeeFormData.employeeCode}
                    onChange={(e) =>
                      setEmployeeFormData({ ...employeeFormData, employeeCode: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={employeeFormData.name}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@nexus.telecom"
                    value={employeeFormData.email}
                    onChange={(e) =>
                      setEmployeeFormData({ ...employeeFormData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+1 (555) 000-0000"
                    value={employeeFormData.phone}
                    onChange={(e) =>
                      setEmployeeFormData({ ...employeeFormData, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Designation Role
                  </label>
                  <select
                    value={employeeFormData.role}
                    onChange={(e) =>
                      setEmployeeFormData({
                        ...employeeFormData,
                        role: e.target.value as Employee['role'],
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
                  >
                    <option value="Manager">Manager</option>
                    <option value="Retail Staff">Retail Staff</option>
                    <option value="Field Engineer">Field Engineer</option>
                    <option value="Senior Accountant">Senior Accountant</option>
                    <option value="Support Agent">Support Agent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={employeeFormData.department}
                    onChange={(e) =>
                      setEmployeeFormData({
                        ...employeeFormData,
                        department: e.target.value as Employee['department'],
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
                  >
                    <option value="Administration">Administration</option>
                    <option value="Retail Outlets">Retail Outlets</option>
                    <option value="Technical Operations">Technical Operations</option>
                    <option value="Finance & Accounts">Finance & Accounts</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Retail Shop
                  </label>
                  <select
                    value={employeeFormData.retailShopAssigned}
                    onChange={(e) =>
                      setEmployeeFormData({
                        ...employeeFormData,
                        retailShopAssigned: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
                  >
                    <option value="Headquarters (General)">Headquarters (General)</option>
                    {retailShops.map((s) => (
                      <option key={s.id} value={`${s.name} (${s.shopCode})`}>
                        {s.name} ({s.shopCode})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Employment Status
                  </label>
                  <select
                    value={employeeFormData.status}
                    onChange={(e) =>
                      setEmployeeFormData({
                        ...employeeFormData,
                        status: e.target.value as Employee['status'],
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEmployeeModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow"
                >
                  {editingEmployee ? 'Save Changes' : 'Confirm & Onboard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vendor Modal */}
      {isVendorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingVendor ? 'Edit Supplier Details' : 'Register New Vendor'}
              </h3>
              <button
                onClick={() => setIsVendorModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVendor} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vendor Code
                  </label>
                  <input
                    type="text"
                    required
                    value={vendorFormData.vendorCode}
                    onChange={(e) =>
                      setVendorFormData({ ...vendorFormData, vendorCode: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cisco Hardware"
                    value={vendorFormData.companyName}
                    onChange={(e) =>
                      setVendorFormData({ ...vendorFormData, companyName: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Miller"
                    value={vendorFormData.contactPerson}
                    onChange={(e) =>
                      setVendorFormData({ ...vendorFormData, contactPerson: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Supply Category
                  </label>
                  <select
                    value={vendorFormData.category}
                    onChange={(e) =>
                      setVendorFormData({
                        ...vendorFormData,
                        category: e.target.value as Vendor['category'],
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
                  >
                    <option value="Fiber Optics & Cabling">Fiber Optics & Cabling</option>
                    <option value="Modems & Routers">Modems & Routers</option>
                    <option value="Telecom Switches">Telecom Switches</option>
                    <option value="Field Tooling">Field Tooling</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={vendorFormData.phone}
                    onChange={(e) =>
                      setVendorFormData({ ...vendorFormData, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={vendorFormData.email}
                    onChange={(e) =>
                      setVendorFormData({ ...vendorFormData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Physical Address
                </label>
                <input
                  type="text"
                  value={vendorFormData.address}
                  onChange={(e) =>
                    setVendorFormData({ ...vendorFormData, address: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsVendorModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow"
                >
                  {editingVendor ? 'Save Changes' : 'Confirm Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plan Modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingPlan ? 'Edit Plan Tariff' : 'Create New Service Plan'}
              </h3>
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Broadband Giga 500"
                    value={planFormData.name}
                    onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Connection Type *
                  </label>
                  <select
                    value={planFormData.type}
                    onChange={(e) =>
                      setPlanFormData({
                        ...planFormData,
                        type: e.target.value as Plan['type'],
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
                  >
                    <option value="Broadband">Broadband</option>
                    <option value="Dial-Up">Dial-Up</option>
                    <option value="Landline">Landline</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Speed / Bandwidth Specification *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 500 Mbps Fiber Symmetrical"
                  value={planFormData.speedOrBandwidth}
                  onChange={(e) =>
                    setPlanFormData({ ...planFormData, speedOrBandwidth: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Security Deposit ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={planFormData.securityDeposit}
                    onChange={(e) =>
                      setPlanFormData({
                        ...planFormData,
                        securityDeposit: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Monthly Rental ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={planFormData.monthlyRental}
                    onChange={(e) =>
                      setPlanFormData({
                        ...planFormData,
                        monthlyRental: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hourly Charge ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={planFormData.hourlyCharge}
                    onChange={(e) =>
                      setPlanFormData({
                        ...planFormData,
                        hourlyCharge: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Plan Description & Features
                </label>
                <textarea
                  rows={2}
                  value={planFormData.description}
                  onChange={(e) =>
                    setPlanFormData({ ...planFormData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow"
                >
                  {editingPlan ? 'Save Changes' : 'Confirm Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

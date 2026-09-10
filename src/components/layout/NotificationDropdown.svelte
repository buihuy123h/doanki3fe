<script lang="ts">
  import { languageStore } from '../../context/LanguageContext';
  import { authStore } from '../../context/AuthContext';
  import { navigateTo } from '../../lib/router';
  import type { RoleType } from '../../types/nexus';
  import {
    Bell, CheckCheck, Sparkles, Receipt, AlertTriangle,
    HardDrive, RefreshCw, Check, ArrowRight, X, ExternalLink, ChevronRight
  } from 'lucide-svelte';
  import { toast } from 'svelte-sonner';

  const { language, t } = languageStore;
  const { currentUser } = authStore;

  interface NotificationItem {
    id: string;
    titleVi: string;
    titleEn: string;
    descVi: string;
    descEn: string;
    timeVi: string;
    timeEn: string;
    type: 'order' | 'billing' | 'alert' | 'hardware' | 'system';
    read: boolean;
    targetPath: string;
    targetTab: string;
    targetRole?: RoleType;
    sectionVi: string;
    sectionEn: string;
  }

  let isOpen = $state(false);
  let activeFilter = $state<'all' | 'unread'>('all');

  let notifications = $state<NotificationItem[]>([
    {
      id: 'notif-1',
      titleVi: 'Đơn hàng mới cần khảo sát',
      titleEn: 'New Order Pending Assessment',
      descVi: 'Đơn #ORD-2026-9042 (Gói Fiber 500Mbps) đang chờ kỹ thuật nghiệm thu khả thi.',
      descEn: 'Order #ORD-2026-9042 (Fiber 500Mbps) awaiting technical feasibility review.',
      timeVi: '5 phút trước',
      timeEn: '5 mins ago',
      type: 'order',
      read: false,
      targetPath: '/technical',
      targetTab: 'feasibility-queue',
      targetRole: 'technical',
      sectionVi: 'Kỹ thuật • Hàng đợi khảo sát',
      sectionEn: 'Technical • Feasibility Queue',
    },
    {
      id: 'notif-2',
      titleVi: 'Thanh toán cước thành công',
      titleEn: 'Invoice Payment Received',
      descVi: 'Khách hàng Cty Cổ phần Alpha đã thanh toán $145.00 cho HĐ #INV-8821.',
      descEn: 'Subscriber Alpha Corp settled $145.00 for invoice #INV-8821.',
      timeVi: '15 phút trước',
      timeEn: '15 mins ago',
      type: 'billing',
      read: false,
      targetPath: '/accounts',
      targetTab: 'payment-updates',
      targetRole: 'accounts',
      sectionVi: 'Kế toán • Cập nhật thanh toán',
      sectionEn: 'Accounts • Payment Updates',
    },
    {
      id: 'notif-3',
      titleVi: 'Cảnh báo suy hao quang NOC',
      titleEn: 'Optical Signal Loss Warning',
      descVi: 'Cổng quang PON-01/04 suy hao chạm ngưỡng báo động -28.5 dBm.',
      descEn: 'Port PON-01/04 optical attenuation reached alert threshold -28.5 dBm.',
      timeVi: '1 giờ trước',
      timeEn: '1 hour ago',
      type: 'alert',
      read: false,
      targetPath: '/technical',
      targetTab: 'connection-manager',
      targetRole: 'technical',
      sectionVi: 'Kỹ thuật • Quản lý kết nối',
      sectionEn: 'Technical • Connection Manager',
    },
    {
      id: 'notif-4',
      titleVi: 'Bàn giao thiết bị nhập kho',
      titleEn: 'Hardware Stock Restocked',
      descVi: 'Đã nhập kho 10 Router Wi-Fi 6 AX3000 tại chi nhánh Downtown Flagship.',
      descEn: '10 Wi-Fi 6 AX3000 Routers restocked at Downtown Flagship branch.',
      timeVi: '2 giờ trước',
      timeEn: '2 hours ago',
      type: 'hardware',
      read: false,
      targetPath: '/admin',
      targetTab: 'stock',
      targetRole: 'admin',
      sectionVi: 'Quản trị • Kho thiết bị',
      sectionEn: 'Admin • Stock Inventory',
    },
    {
      id: 'notif-5',
      titleVi: 'Thuê bao yêu cầu nâng cấp gói',
      titleEn: 'Subscriber Plan Upgrade Request',
      descVi: 'Tài khoản T064-000000000001 yêu cầu chuyển sang gói cước Giga Fast.',
      descEn: 'Account T064-000000000001 requested upgrade to Giga Fast plan.',
      timeVi: '3 giờ trước',
      timeEn: '3 hours ago',
      type: 'order',
      read: true,
      targetPath: '/retail',
      targetTab: 'connection-details',
      targetRole: 'retail',
      sectionVi: 'Bán lẻ • Chi tiết thuê bao',
      sectionEn: 'Retail • Connection Details',
    },
    {
      id: 'notif-6',
      titleVi: 'Hoàn tất nghiệm thu đường dây',
      titleEn: 'Circuit Provisioning Cleared',
      descVi: 'Kỹ sư hiện trường đã bàn giao thiết bị CPE và cấp Account ID thành công.',
      descEn: 'Field engineer completed physical loop and issued Account ID.',
      timeVi: '5 giờ trước',
      timeEn: '5 hours ago',
      type: 'order',
      read: true,
      targetPath: '/retail',
      targetTab: 'order-tracking',
      targetRole: 'retail',
      sectionVi: 'Bán lẻ • Tra cứu đơn hàng',
      sectionEn: 'Retail • Order Tracking',
    },
    {
      id: 'notif-7',
      titleVi: 'Hợp đồng điện tử ký số thành công',
      titleEn: 'E-Contract Signed Successfully',
      descVi: 'Khách hàng Lê Hoàng Nam đã xác thực OTP và ký biên bản điện tử.',
      descEn: 'Customer Le Hoang Nam completed OTP authorization and signed agreement.',
      timeVi: 'Hôm qua',
      timeEn: 'Yesterday',
      type: 'billing',
      read: true,
      targetPath: '/retail',
      targetTab: 'connection-details',
      targetRole: 'retail',
      sectionVi: 'Bán lẻ • Chi tiết thuê bao',
      sectionEn: 'Retail • Connection Details',
    },
    {
      id: 'notif-8',
      titleVi: 'Sao lưu hệ thống định kỳ NOC',
      titleEn: 'Scheduled Routine NOC Backup',
      descVi: 'Sao lưu cơ sở dữ liệu cước và cấu hình phân tuyến hoàn tất 100%. Nexus OS v2.4.1',
      descEn: 'Billing database snapshot and NOC routing table backed up successfully. Nexus OS v2.4.1',
      timeVi: 'Hôm qua',
      timeEn: 'Yesterday',
      type: 'system',
      read: true,
      targetPath: '/admin',
      targetTab: 'settings',
      targetRole: 'admin',
      sectionVi: 'Cài đặt hệ thống',
      sectionEn: 'System Settings',
    },
  ]);

  const unreadCount = $derived(notifications.filter((n) => !n.read).length);

  const displayedNotifications = $derived(
    activeFilter === 'unread' ? notifications.filter((n) => !n.read) : notifications
  );

  const toggleDropdown = () => {
    isOpen = !isOpen;
  };

  const closeDropdown = () => {
    isOpen = false;
  };

  const markAllAsRead = () => {
    notifications = notifications.map((n) => ({ ...n, read: true }));
    toast.success(
      $language === 'vi'
        ? 'Đã đánh dấu tất cả thông báo là đã đọc'
        : 'Marked all notifications as read'
    );
  };

  const handleClickItem = (item: NotificationItem) => {
    // 1. Mark as read
    if (!item.read) {
      notifications = notifications.map((n) => (n.id === item.id ? { ...n, read: true } : n));
    }

    // 2. Close dropdown
    closeDropdown();

    // 3. Switch role if needed so ProtectedRoute permits access
    if (item.targetRole && $currentUser?.role !== item.targetRole) {
      if (item.targetRole !== 'user') {
        authStore.loginAsStaff(item.targetRole);
      }
    }

    // 4. Navigate immediately to target path and tab
    navigateTo(item.targetPath, item.targetTab);

    // 5. Toast feedback (Sonner displays for 1.5s)
    toast.success(
      $language === 'vi'
        ? `Đã chuyển tới: ${item.sectionVi}`
        : `Navigated to: ${item.sectionEn}`
    );
  };

  // Click outside listener
  const handleWindowClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (isOpen && target && !target.closest('.notification-container')) {
      isOpen = false;
    }
  };

  // Escape key listener
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      isOpen = false;
    }
  };
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleKeydown} />

<div class="relative notification-container">
  <!-- Bell Button Trigger -->
  <button
    type="button"
    onclick={toggleDropdown}
    class="h-9 w-9 rounded-full bg-[#EDF6FF] dark:bg-[#1E3349] hover:bg-[#DCEEFE] dark:hover:bg-[#253E58] text-[#1B2D40] dark:text-[#E0F1FF] border border-[#CCE4F7] dark:border-[#253D56] flex items-center justify-center transition shadow-xs relative cursor-pointer"
    title={$language === 'vi' ? `Thông báo (${unreadCount} chưa đọc)` : `Notifications (${unreadCount} unread)`}
    aria-expanded={isOpen}
  >
    <Bell class="h-4 w-4" />
    {#if unreadCount > 0}
      <span class="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-[#1E3349] animate-pulse">
        {unreadCount}
      </span>
    {/if}
  </button>

  <!-- Droplist Popup Menu -->
  {#if isOpen}
    <div
      class="dropdown-popover absolute right-0 top-11 mt-1 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#152434] border border-[#CCE4F7] dark:border-[#253D56] shadow-2xl z-50 overflow-hidden flex flex-col backdrop-blur-md"
    >
      <!-- Droplist Header -->
      <div class="px-4 py-3.5 border-b border-[#CCE4F7] dark:border-[#253D56] bg-slate-50/70 dark:bg-[#1B2D40]/50 flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <h3 class="font-bold text-sm text-[#0F1D2B] dark:text-white">
            {$language === 'vi' ? 'Thông báo hệ thống' : 'System Notifications'}
          </h3>
          {#if unreadCount > 0}
            <span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
              {unreadCount} {$language === 'vi' ? 'mới' : 'new'}
            </span>
          {/if}
        </div>

        {#if unreadCount > 0}
          <button
            type="button"
            onclick={markAllAsRead}
            class="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 flex items-center space-x-1 transition active:scale-95 cursor-pointer"
          >
            <CheckCheck class="h-3.5 w-3.5" />
            <span>{$language === 'vi' ? 'Đã đọc tất cả' : 'Mark all read'}</span>
          </button>
        {/if}
      </div>

      <!-- Filter Tabs -->
      <div class="flex border-b border-[#CCE4F7] dark:border-[#253D56] bg-white dark:bg-[#152434] text-xs font-semibold px-4 pt-2">
        <button
          type="button"
          onclick={() => (activeFilter = 'all')}
          class="pb-2 mr-4 border-b-2 transition cursor-pointer {activeFilter === 'all'
            ? 'border-sky-600 text-sky-600 dark:text-sky-400'
            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}"
        >
          {$language === 'vi' ? 'Tất cả' : 'All'} ({notifications.length})
        </button>
        <button
          type="button"
          onclick={() => (activeFilter = 'unread')}
          class="pb-2 border-b-2 transition cursor-pointer {activeFilter === 'unread'
            ? 'border-sky-600 text-sky-600 dark:text-sky-400'
            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}"
        >
          {$language === 'vi' ? 'Chưa đọc' : 'Unread'} ({unreadCount})
        </button>
      </div>

      <!-- Notification Items List (Scrollable) -->
      <div class="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 notification-scroll">
        {#if displayedNotifications.length === 0}
          <div class="py-10 text-center px-4 space-y-2">
            <Bell class="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600" />
            <p class="text-xs text-slate-500 dark:text-slate-400">
              {$language === 'vi' ? 'Không có thông báo nào cần hiển thị.' : 'No notifications to display.'}
            </p>
          </div>
        {:else}
          {#each displayedNotifications as item (item.id)}
            <button
              type="button"
              onclick={() => handleClickItem(item)}
              class="w-full text-left p-3.5 hover:bg-sky-50/50 dark:hover:bg-slate-800/50 transition flex items-start space-x-3 group relative cursor-pointer {!item.read
                ? 'bg-sky-50/20 dark:bg-sky-950/10'
                : ''}"
            >
              <!-- Icon by Type -->
              <div class="shrink-0 mt-0.5">
                {#if item.type === 'order'}
                  <div class="h-8 w-8 rounded-lg bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shadow-xs">
                    <Sparkles class="h-4 w-4" />
                  </div>
                {:else if item.type === 'billing'}
                  <div class="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                    <Receipt class="h-4 w-4" />
                  </div>
                {:else if item.type === 'alert'}
                  <div class="h-8 w-8 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs">
                    <AlertTriangle class="h-4 w-4" />
                  </div>
                {:else if item.type === 'hardware'}
                  <div class="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
                    <HardDrive class="h-4 w-4" />
                  </div>
                {:else}
                  <div class="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs">
                    <RefreshCw class="h-4 w-4" />
                  </div>
                {/if}
              </div>

              <!-- Text Content -->
              <div class="flex-1 min-w-0 pr-4">
                <div class="flex items-center justify-between">
                  <h4 class="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    {$language === 'vi' ? item.titleVi : item.titleEn}
                  </h4>
                  <span class="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                    {$language === 'vi' ? item.timeVi : item.timeEn}
                  </span>
                </div>
                <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                  {$language === 'vi' ? item.descVi : item.descEn}
                </p>

                <!-- Target section link preview -->
                <div class="mt-2 flex items-center justify-between">
                  <span class="inline-flex items-center text-[10px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-100/70 dark:bg-sky-950/60 px-2 py-0.5 rounded-md border border-sky-200 dark:border-sky-800/60">
                    {$language === 'vi' ? item.sectionVi : item.sectionEn}
                  </span>
                  <span class="text-[10px] font-semibold text-sky-600 dark:text-sky-400 flex items-center group-hover:translate-x-0.5 transition-transform">
                    <span>{$language === 'vi' ? 'Xem mục này' : 'View section'}</span>
                    <ChevronRight class="h-3 w-3 ml-0.5" />
                  </span>
                </div>
              </div>

              <!-- Unread Blue Dot -->
              {#if !item.read}
                <span class="absolute right-3 top-4 h-2 w-2 rounded-full bg-sky-500 ring-2 ring-sky-200 dark:ring-sky-900"></span>
              {/if}
            </button>
          {/each}
        {/if}
      </div>

      <!-- Droplist Footer -->
      <div class="px-4 py-2.5 bg-slate-50 dark:bg-[#1B2D40]/70 border-t border-[#CCE4F7] dark:border-[#253D56] text-center">
        <button
          type="button"
          onclick={() => {
            closeDropdown();
            toast.info($language === 'vi' ? 'Đã tải toàn bộ danh sách thông báo hệ thống' : 'Loaded complete system notification log');
          }}
          class="text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 inline-flex items-center space-x-1.5 transition cursor-pointer"
        >
          <span>{$language === 'vi' ? 'Xem tất cả thông báo' : 'View all notifications'}</span>
          <ArrowRight class="h-3 w-3" />
        </button>
      </div>
    </div>
  {/if}
</div>

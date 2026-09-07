import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageToggle } from './LanguageToggle';
import {
  Menu,
  Search,
  Settings,
  Bell,
  LogOut,
  Download,
  Plus,
  Sparkles,
  ShieldCheck,
  ShoppingBag,
  Wrench,
  Calculator,
  User,
  Sun,
  Moon,
} from 'lucide-react';
import { toast } from 'sonner';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeColor?: string;
}

export interface DashboardLayoutProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  navItems: NavItem[];
  pageTitle?: string;
  roleBadgeTitle?: string;
  children: React.ReactNode;
  exportAction?: {
    label?: string;
    onClick: () => void;
  };
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<{ className?: string }>;
  };
  customHeaderActions?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  activeTab,
  onTabChange,
  navItems,
  pageTitle,
  roleBadgeTitle,
  children,
  exportAction,
  primaryAction,
  customHeaderActions,
}) => {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  // Search expanding state
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Sidebar open/closed state with 0.3s transition (persisted in localStorage)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('nexus_sidebar_open');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('nexus_sidebar_open', String(isSidebarOpen));
  }, [isSidebarOpen]);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  // Tự động giấu sidebar khi bấm ra vùng main (chỉ áp dụng trên thiết bị di động / tablet)
  const handleMainClick = () => {
    if (isSidebarOpen && window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  // Live ticking date and time for the greeting banner
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format greeting based on hour (e.g. Good morning, Good afternoon, Good evening)
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return t.greetings.morning;
    if (hour < 18) return t.greetings.afternoon;
    return t.greetings.evening;
  };

  // Format date and time matching screenshot style: localized for EN/VI
  const formattedDateTime =
    currentTime.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }) +
    (language === 'vi' ? ' lúc ' : ' at ') +
    currentTime.toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

  const handleLogout = () => {
    logout();
    toast.info(language === 'vi' ? 'Đã đăng xuất khỏi phiên làm việc.' : 'Signed out successfully.');
    navigate('/login', { replace: true });
  };

  // Resolve current active item for page title fallback
  const activeNavItem = navItems.find((item) => item.id === activeTab);
  const currentTitle = pageTitle || activeNavItem?.label || t.common.dashboard;

  const renderRoleIcon = (className: string) => {
    if (!currentUser) return <User className={className} />;
    switch (currentUser.role) {
      case 'admin':
        return <ShieldCheck className={className} />;
      case 'retail':
        return <ShoppingBag className={className} />;
      case 'technical':
        return <Wrench className={className} />;
      case 'accounts':
        return <Calculator className={className} />;
      default:
        return <User className={className} />;
    }
  };
  return (
    <div className="flex h-screen w-full bg-[#E0F1FF] dark:bg-[#1B2D40] text-[#1B2D40] dark:text-[#E0F1FF] font-sans antialiased overflow-hidden transition-colors duration-300">
      {/* ------------------------------------------------------------- */}
      {/* 1. LEFT SIDEBAR (Unscrollable, 0.3s animated toggle)         */}
      {/* ------------------------------------------------------------- */}
      <aside
        className={`transition-all duration-300 ease-in-out shrink-0 bg-[#EDF6FF] dark:bg-[#152434] border-r border-[#CCE4F7] dark:border-[#253D56] flex flex-col justify-between z-30 h-full select-none overflow-hidden ${
          isSidebarOpen
            ? 'w-64 min-w-[16rem] opacity-100 shadow-sm'
            : 'w-0 min-w-0 opacity-0 overflow-hidden border-r-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Top Brand Bar (matches "Nexus" logo style) */}
          <div className="h-16 border-b border-[#CCE4F7] dark:border-[#253D56] flex items-center px-5 space-x-3 shrink-0">
            {/* Circular warm badge logo */}
            <div className="h-9 w-9 rounded-full bg-[#D8ECFC] dark:bg-[#1E3349] border border-[#BBDDF5] dark:border-[#2A4460] flex items-center justify-center text-sky-700 dark:text-sky-300 shadow-xs shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            {/* Brand Title */}
            <div className="min-w-0 flex-1 truncate">
              <div className="font-bold text-base tracking-tight text-sky-900 dark:text-sky-300 leading-tight flex items-center gap-1">
                <span>Nexus</span>
                <span className="text-[10px] uppercase tracking-wider text-sky-800 dark:text-sky-200 font-semibold bg-sky-500/15 px-1 rounded">
                  {currentUser?.role || 'SMS'}
                </span>
              </div>
              <div className="text-[11px] text-[#537292] dark:text-[#8DB0D4] truncate">Nexus Marketing System</div>
            </div>
          </div>

          {/* Navigation Items List - strictly unscrollable */}
          <nav className="flex-1 py-4 overflow-hidden space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between py-3 px-4 text-sm font-medium transition-all duration-200 group text-left ${
                    isActive
                      ? 'border-l-4 border-sky-600 dark:border-sky-400 bg-white/90 dark:bg-[#1E3349] text-sky-700 dark:text-sky-300 font-semibold shadow-xs'
                      : 'border-l-4 border-transparent text-[#2C4764] dark:text-[#94B5D6] hover:text-[#0F1D2B] dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#1E3349]/50'
                  }`}
                >
                  <div className="flex items-center space-x-3.5 min-w-0 truncate">
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        isActive ? 'text-sky-600 dark:text-sky-400' : 'text-[#537292] dark:text-[#7A9BBF] group-hover:text-[#0F1D2B] dark:group-hover:text-white'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full shrink-0 font-medium ${
                        item.badgeColor ||
                        (isActive
                          ? 'bg-sky-600 dark:bg-sky-500 text-white'
                          : 'bg-sky-100 dark:bg-[#1E3349] text-sky-800 dark:text-sky-200 border border-[#CCE4F7] dark:border-[#253D56]')
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer / Current User Badge */}
          <div className="p-3.5 border-t border-[#CCE4F7] dark:border-[#253D56] bg-[#E5F2FC]/70 dark:bg-[#111E2C]/70 text-xs text-[#537292] dark:text-[#88A9CB] space-y-1.5 shrink-0">
            <div className="flex items-center space-x-2 text-[#1B2D40] dark:text-[#E0F1FF] font-semibold truncate">
              {renderRoleIcon("h-3.5 w-3.5 text-sky-600 dark:text-sky-400")}
              <span className="truncate">{roleBadgeTitle || (currentUser?.role && t.roles[currentUser.role]) || currentUser?.title || 'Nexus User'}</span>
            </div>
            <div className="text-[10px] text-[#6B8FB5] dark:text-[#5E7F9F] flex items-center justify-between pt-0.5">
              <span>{t.common.stationReady}</span>
              <span>v2.4</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* 2. RIGHT COLUMN: FIXED HEADER + SCROLLABLE MAIN               */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Mobile & Tablet Backdrop Overlay when sidebar is open */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-25 md:hidden transition-opacity duration-300"
            title="Bấm vào đây để giấu sidebar"
          />
        )}
        {/* Top Header Bar - Fixed height, never scrolls */}
        <header className="shrink-0 h-16 bg-white/95 dark:bg-[#172738]/95 border-b border-[#CCE4F7] dark:border-[#253D56] flex items-center justify-between px-4 sm:px-6 shadow-xs z-20 backdrop-blur-md transition-colors duration-300">
          {/* Left: 3-Stripes Hamburger Toggle + Current Page Title */}
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
            <button
              onClick={toggleSidebar}
              className="flex items-center justify-center h-9 w-9 rounded-lg text-[#1B2D40] dark:text-[#E0F1FF] hover:bg-[#EDF6FF] dark:hover:bg-[#1E3349] transition active:scale-95 shrink-0"
              title={isSidebarOpen ? 'Đóng sidebar (0.3s)' : 'Mở sidebar (0.3s)'}
            >
              <Menu className="h-5 w-5" />
            </button>

            <h1 className="text-base sm:text-lg font-bold text-[#0F1D2B] dark:text-white tracking-tight truncate">
              {currentTitle}
            </h1>
          </div>

          {/* Right: Circular Action Buttons & User Profile / Logout */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Custom Header Actions if passed */}
            {customHeaderActions}

            {/* Expandable Search Input */}
            <div
              className={`flex items-center h-9 rounded-full transition-all duration-300 overflow-hidden shadow-xs border ${
                isSearchExpanded
                  ? 'w-48 sm:w-64 bg-white dark:bg-[#101C29] border-[#CCE4F7] dark:border-[#253D56] px-1'
                  : 'w-9 bg-[#EDF6FF] dark:bg-[#1E3349] border-[#CCE4F7] dark:border-[#253D56] hover:bg-[#DCEEFE] dark:hover:bg-[#253E58]'
              }`}
            >
              <button
                onClick={() => {
                  if (isSearchExpanded && searchQuery) {
                    toast.info(`Tìm kiếm: ${searchQuery}`);
                  } else {
                    setIsSearchExpanded(!isSearchExpanded);
                  }
                }}
                className={`shrink-0 rounded-full flex items-center justify-center text-[#1B2D40] dark:text-[#E0F1FF] transition-colors ${
                  isSearchExpanded ? 'h-7 w-7 hover:bg-[#EDF6FF] dark:hover:bg-[#253E58] ml-1' : 'h-full w-full'
                }`}
                title={t.common.search}
              >
                <Search className="h-4 w-4" />
              </button>
              <input
                type="text"
                placeholder={t.common.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery) {
                    toast.info(`${t.common.search}: ${searchQuery}`);
                  } else if (e.key === 'Escape') {
                    setIsSearchExpanded(false);
                  }
                }}
                onBlur={() => {
                  if (!searchQuery) setIsSearchExpanded(false);
                }}
                className={`bg-transparent border-none outline-none text-sm text-[#0F1D2B] dark:text-white placeholder-[#7899B8] dark:placeholder-slate-500 transition-all duration-300 ${
                  isSearchExpanded ? 'w-full opacity-100 px-2' : 'w-0 opacity-0 px-0'
                }`}
              />
            </div>

            {/* Circular Settings Button */}
            <button
              onClick={() => onTabChange('settings')}
              className="h-9 w-9 rounded-full bg-[#EDF6FF] dark:bg-[#1E3349] hover:bg-[#DCEEFE] dark:hover:bg-[#253E58] text-[#1B2D40] dark:text-[#E0F1FF] border border-[#CCE4F7] dark:border-[#253D56] flex items-center justify-center transition shadow-xs"
              title={t.common.settings}
            >
              <Settings className="h-4 w-4" />
            </button>

            {/* Language Switcher Button (EN / VI) */}
            <LanguageToggle />

            {/* Circular Theme Toggle Button (Light/Dark Mode) */}
            <button
              onClick={toggleTheme}
              className="h-9 w-9 rounded-full bg-[#EDF6FF] dark:bg-[#1E3349] hover:bg-[#DCEEFE] dark:hover:bg-[#253E58] text-[#1B2D40] dark:text-[#E0F1FF] border border-[#CCE4F7] dark:border-[#253D56] flex items-center justify-center transition-all duration-200 shadow-xs hover:scale-105 active:scale-95 group"
              title={theme === 'dark' ? t.common.themeLight : t.common.themeDark}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400 group-hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="h-4 w-4 text-sky-700 group-hover:-rotate-12 transition-transform" />
              )}
            </button>

            {/* Circular Notification Bell with Badge Count 8 */}
            <button
              onClick={() => toast.info(`${t.common.notifications}: 8 unread alerts`)}
              className="h-9 w-9 rounded-full bg-[#EDF6FF] dark:bg-[#1E3349] hover:bg-[#DCEEFE] dark:hover:bg-[#253E58] text-[#1B2D40] dark:text-[#E0F1FF] border border-[#CCE4F7] dark:border-[#253D56] flex items-center justify-center transition shadow-xs relative"
              title={`${t.common.notifications} (8)`}
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
                8
              </span>
            </button>

            {/* User Profile & Logout Box */}
            {currentUser && (
              <div className="flex items-center p-1 pl-2 pr-1.5 bg-[#EDF6FF]/90 dark:bg-[#1E3349]/90 border border-[#CCE4F7] dark:border-[#253D56] rounded-full shadow-xs space-x-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-sky-600 to-blue-600 text-white font-bold text-xs shadow-inner">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="text-right hidden md:block pr-1">
                  <div className="text-xs font-bold text-[#0F1D2B] dark:text-white leading-none">{currentUser.name}</div>
                  <div className="text-[10px] text-[#537292] dark:text-[#8DB0D4] leading-none mt-0.5">{currentUser.title}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center h-7 w-7 rounded-full bg-rose-500/10 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 transition active:scale-95"
                  title={t.common.logout}
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* ------------------------------------------------------------- */}
        {/* 3. MAIN DASHBOARD CONTENT AREA - THE ONLY SCROLLABLE AREA     */}
        {/* ------------------------------------------------------------- */}
        <main
          onClick={handleMainClick}
          className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-[#E0F1FF] dark:bg-[#1B2D40] transition-colors duration-300"
        >
          {/* Greeting Banner (matches "Good afternoon, Admin" layout in image) */}
          <div className="pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#0F1D2B] dark:text-white tracking-tight flex items-center gap-2">
                <span>
                  {getGreeting()}, {currentUser?.name ? currentUser.name.split(' ')[0] : 'Admin'}
                </span>
                <span className="text-xl">👋</span>
              </h2>
              <p className="text-xs text-[#537292] dark:text-[#8DB0D4] mt-1 font-medium">{formattedDateTime}</p>
            </div>

            {/* Action buttons (matches "Export" and "+ New Report" buttons in screenshot) */}
            <div className="flex items-center space-x-2.5">
              <button
                onClick={exportAction?.onClick || (() => toast.success(language === 'vi' ? 'Đang xuất báo cáo tổng quan...' : 'Exporting overview report...'))}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-[#1E3349] hover:bg-sky-50 dark:hover:bg-[#253E58] border border-[#CCE4F7] dark:border-[#253D56] text-[#1B2D40] dark:text-[#E0F1FF] shadow-xs transition active:scale-95"
              >
                <Download className="h-3.5 w-3.5 text-[#537292] dark:text-[#8DB0D4]" />
                <span>{exportAction?.label || t.actions.export}</span>
              </button>

              {primaryAction ? (
                <button
                  onClick={primaryAction.onClick}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition active:scale-95"
                >
                  {primaryAction.icon ? (
                    <primaryAction.icon className="h-3.5 w-3.5" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  <span>{primaryAction.label}</span>
                </button>
              ) : (
                <button
                  onClick={() => toast.info(t.actions.newReport)}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{t.actions.newReport}</span>
                </button>
              )}
            </div>
          </div>

          {/* Page Tab Children */}
          {children}
        </main>
      </div>
    </div>
  );
};


import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { User, Activity, Settings, CreditCard, LayoutDashboard, ArrowRight } from 'lucide-react';
import type { NavItem } from '../components/layout/DashboardLayout';

export const UserDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = React.useState('overview');

  const navItems: NavItem[] = [
    { id: 'overview', label: t.userNav.overview, icon: LayoutDashboard },
    { id: 'billing', label: t.userNav.billing, icon: CreditCard },
    { id: 'settings', label: t.userNav.settings, icon: Settings },
  ];

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      navItems={navItems}
      pageTitle={activeTab === 'overview' ? t.userNav.overview : navItems.find((n) => n.id === activeTab)?.label}
      roleBadgeTitle={t.roles.user}
    >
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Info Card */}
            <div className="p-6 bg-white dark:bg-[#152434] border border-[#CCE4F7] dark:border-[#253D56] rounded-xl shadow-sm">
              <div className="flex items-center space-x-3 text-purple-600 dark:text-purple-400 mb-2">
                <User className="h-5 w-5" />
                <h3 className="font-semibold text-base">{language === 'vi' ? 'Thông tin tài khoản' : 'Account Profile'}</h3>
              </div>
              <p className="text-sm font-bold text-[#0F1D2B] dark:text-white">
                {currentUser?.name || 'Customer'}
              </p>
              <p className="text-xs text-slate-500 mt-1 font-mono">ID: {currentUser?.id}</p>
            </div>

            {/* Activity Card */}
            <div className="p-6 bg-white dark:bg-[#152434] border border-[#CCE4F7] dark:border-[#253D56] rounded-xl shadow-sm">
              <div className="flex items-center space-x-3 text-sky-600 dark:text-sky-400 mb-2">
                <Activity className="h-5 w-5" />
                <h3 className="font-semibold text-base">{language === 'vi' ? 'Dịch vụ đang dùng' : 'Active Subscription'}</h3>
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {language === 'vi' ? 'Internet Cáp quang 1Gbps' : 'Broadband Fiber Ultra 1Gbps'}
              </p>
              <p className="text-xs text-emerald-500 mt-1 font-semibold">
                {language === 'vi' ? '● Đang hoạt động tốt' : '● Online & Provisioned'}
              </p>
            </div>

            {/* Billing Card */}
            <div className="p-6 bg-white dark:bg-[#152434] border border-[#CCE4F7] dark:border-[#253D56] rounded-xl shadow-sm">
              <div className="flex items-center space-x-3 text-amber-600 dark:text-amber-400 mb-2">
                <CreditCard className="h-5 w-5" />
                <h3 className="font-semibold text-base">{language === 'vi' ? 'Hóa đơn tháng này' : 'Current Invoice'}</h3>
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {language === 'vi' ? '250,000 VND' : '$79.99 USD'}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
                {language === 'vi' ? 'Hạn chót: 15/09/2026' : 'Due Date: 15/10/2026'}
              </p>
            </div>

            {/* Support Card */}
            <div className="p-6 bg-white dark:bg-[#152434] border border-[#CCE4F7] dark:border-[#253D56] rounded-xl shadow-sm">
              <div className="flex items-center space-x-3 text-slate-600 dark:text-slate-400 mb-2">
                <Settings className="h-5 w-5" />
                <h3 className="font-semibold text-base">{language === 'vi' ? 'Hỗ trợ kỹ thuật' : 'Technical Support'}</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {language === 'vi' ? 'Cần hỗ trợ hoặc sự cố đường truyền?' : 'Need technical help or report outage?'}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className="mt-2 text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 flex items-center space-x-1"
              >
                <span>{language === 'vi' ? 'Gửi yêu cầu hỗ trợ' : 'Submit Ticket'}</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="rounded-xl bg-white dark:bg-[#1E3349] p-8 text-center shadow-sm border border-[#CCE4F7] dark:border-[#253D56]">
          <CreditCard className="h-12 w-12 mx-auto text-sky-600 dark:text-sky-400 mb-4" />
          <h3 className="text-lg font-bold text-[#0F1D2B] dark:text-white mb-2">
            {language === 'vi' ? 'Lịch sử hóa đơn & cước phí' : 'Billing & Payment History'}
          </h3>
          <p className="text-[#537292] dark:text-[#8DB0D4] max-w-md mx-auto text-xs">
            {language === 'vi' ? 'Tất cả hóa đơn cước đã được thanh toán đầy đủ. Không có khoản nợ cước quá hạn.' : 'All monthly invoices have been settled. No outstanding telecom balances.'}
          </p>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="rounded-xl bg-white dark:bg-[#1E3349] p-8 text-center shadow-sm border border-[#CCE4F7] dark:border-[#253D56]">
          <Settings className="h-12 w-12 mx-auto text-[#7899B8] dark:text-[#5E7F9F] mb-4" />
          <h3 className="text-lg font-bold text-[#0F1D2B] dark:text-white mb-2">{t.dashboard.settingsTitle}</h3>
          <p className="text-[#537292] dark:text-[#8DB0D4]">{t.dashboard.settingsDesc}</p>
        </div>
      )}
    </DashboardLayout>
  );
};

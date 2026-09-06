import React from 'react';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { User, Activity, Settings, CreditCard } from 'lucide-react';

export const UserDashboard: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Info Card */}
          <div className="p-6 bg-white dark:bg-[#152434] border border-[#CCE4F7] dark:border-[#253D56] rounded-xl shadow-sm">
            <div className="flex items-center space-x-3 text-purple-600 dark:text-purple-400 mb-2">
              <User className="h-5 w-5" />
              <h3 className="font-semibold text-lg">Thông tin tài khoản</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {currentUser?.name || 'Customer'}
            </p>
            <p className="text-xs text-slate-500 mt-1">ID: {currentUser?.id}</p>
          </div>

          {/* Activity Card */}
          <div className="p-6 bg-white dark:bg-[#152434] border border-[#CCE4F7] dark:border-[#253D56] rounded-xl shadow-sm">
            <div className="flex items-center space-x-3 text-sky-600 dark:text-sky-400 mb-2">
              <Activity className="h-5 w-5" />
              <h3 className="font-semibold text-lg">Dịch vụ đang dùng</h3>
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Internet Cáp quang 1Gbps
            </p>
            <p className="text-xs text-emerald-500 mt-1 font-semibold">Đang hoạt động tốt</p>
          </div>

          {/* Billing Card */}
          <div className="p-6 bg-white dark:bg-[#152434] border border-[#CCE4F7] dark:border-[#253D56] rounded-xl shadow-sm">
            <div className="flex items-center space-x-3 text-amber-600 dark:text-amber-400 mb-2">
              <CreditCard className="h-5 w-5" />
              <h3 className="font-semibold text-lg">Hóa đơn tháng này</h3>
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              250,000 VND
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">Hạn chót: 15/09/2026</p>
          </div>

          {/* Settings Card */}
          <div className="p-6 bg-white dark:bg-[#152434] border border-[#CCE4F7] dark:border-[#253D56] rounded-xl shadow-sm">
            <div className="flex items-center space-x-3 text-slate-600 dark:text-slate-400 mb-2">
              <Settings className="h-5 w-5" />
              <h3 className="font-semibold text-lg">Hỗ trợ kỹ thuật</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Có sự cố mạng?
            </p>
            <button className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              Gửi yêu cầu hỗ trợ &rarr;
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

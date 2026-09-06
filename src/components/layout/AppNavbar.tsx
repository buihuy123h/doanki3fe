import React from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import {
  Layers,
  LogOut,
  ShieldCheck,
  ShoppingBag,
  Wrench,
  Calculator,
  User,
  Menu,
} from 'lucide-react';
import { toast } from 'sonner';

interface AppNavbarProps {
  isHeaderVisible?: boolean;
  onToggleHeader?: () => void;
}

export const AppNavbar: React.FC<AppNavbarProps> = ({
  isHeaderVisible = true,
  onToggleHeader,
}) => {
  const { currentUser, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If on login page, don't render navbar
  if (location.pathname === '/login') {
    return null;
  }

  const handleLogout = () => {
    logout();
    toast.info('Đã đăng xuất thành công khỏi hệ thống Nexus.');
    navigate('/login', { replace: true });
  };

  const getRoleBadge = () => {
    if (!currentUser) return null;
    switch (currentUser.role) {
      case 'admin':
        return {
          label: 'Admin (Manager)',
          icon: ShieldCheck,
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
        };
      case 'retail':
        return {
          label: 'Retail Outlet Staff',
          icon: ShoppingBag,
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        };
      case 'technical':
        return {
          label: 'Technical Operations',
          icon: Wrench,
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        };
      case 'accounts':
        return {
          label: 'Accounts Department',
          icon: Calculator,
          badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        };
      default:
        return null;
    }
  };

  const roleMeta = getRoleBadge();
  const RoleIcon = roleMeta?.icon || User;

  // When header is hidden, render floating 3-stripes hamburger button
  if (!isHeaderVisible) {
    return (
      <button
        onClick={onToggleHeader}
        className="fixed top-3 left-4 z-50 flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 shadow-2xl backdrop-blur-md transition-all hover:scale-105 active:scale-95 group"
        title="Hiển thị thanh tiêu đề (Show Header)"
      >
        <Menu className="h-5 w-5 text-blue-400 group-hover:scale-110 transition-transform" />
        <span className="text-xs font-semibold hidden sm:inline">Hiện Header</span>
      </button>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-slate-900 text-slate-100 shadow-md transition-all duration-300">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Hamburger 3-stripes toggle button + Brand */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Hamburger button with 3 horizontal stripes to toggle header visibility */}
          <button
            onClick={onToggleHeader}
            className="flex items-center justify-center h-9 w-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition active:scale-95"
            title="Giấu thanh tiêu đề (Hide Header)"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Logo & System Title */}
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">NEXUS</span>
                <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-blue-300 uppercase tracking-wider border border-blue-500/30">
                  SMS Enterprise
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Service Marketing & Operations Portal</p>
            </div>
          </div>
        </div>

        {/* Right: User Identity & Logout Button */}
        <div className="flex items-center space-x-4">
          {isAuthenticated && currentUser ? (
            <div className="flex items-center space-x-3">
              {/* Role Badge */}
              <div
                className={`hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                  roleMeta?.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                <RoleIcon className="h-3.5 w-3.5" />
                <span>{roleMeta?.label}</span>
              </div>

              {/* User Profile Info */}
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-white">{currentUser.name}</div>
                <div className="text-[11px] text-slate-400">{currentUser.title}</div>
              {/* User Profile Info & Avatar Box */}
              <div className="flex items-center p-1.5 pr-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-full transition shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-sm mr-3 shadow-inner ring-2 ring-slate-800">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="text-right hidden sm:block mr-4">
                  <div className="text-xs font-bold text-white leading-none mb-1">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-400 leading-none">{currentUser.title}</div>
                </div>
                <div className="h-6 w-[1px] bg-slate-700 mr-2 hidden sm:block"></div>
                {/* Prominent Logout Button inside Avatar Box */}
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center h-8 w-8 rounded-full bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 hover:text-rose-300 transition active:scale-95"
                  title="Đăng xuất khỏi phiên làm việc để chuyển role"
                >
                  <LogOut className="h-4 w-4 ml-0.5" />
                </button>
              </div>

              {/* Prominent Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 transition shadow-sm active:scale-95"
                title="Đăng xuất khỏi phiên làm việc để chuyển role"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Đăng xuất</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
            >
              Đăng nhập
            </button>
          )}
        </div>
        </div>
      </div>
    </header>
  );
};

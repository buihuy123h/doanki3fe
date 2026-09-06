import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import type { RoleType } from '../types/nexus';
import {
  Layers,
  Lock,
  Mail,
  ShieldCheck,
  ShoppingBag,
  Wrench,
  Calculator,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  Sun,
  Moon,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

export const LoginPage = () => {
  const { login, quickLoginAsRole, isAuthenticated, currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // If already logged in, redirect immediately to their dashboard
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      const routes: Record<RoleType, string> = {
        admin: '/admin',
        retail: '/retail',
        technical: '/technical',
        accounts: '/accounts',
        user: '/user',
      };
      navigate(routes[currentUser.role], { replace: true });
    }
  }, [isAuthenticated, currentUser, navigate]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    const result = login(email, password);
    if (result.success && result.user) {
      toast.success(`Đăng nhập thành công! Xin chào ${result.user.name} (${result.user.title})`);
      const routes: Record<RoleType, string> = {
        admin: '/admin',
        retail: '/retail',
        technical: '/technical',
        accounts: '/accounts',
        user: '/user',
      };
      const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      const targetRoute = fromPath || routes[result.user.role];
      navigate(targetRoute, { replace: true });
    } else {
      setErrorMessage(result.error || 'Thông tin đăng nhập không hợp lệ.');
      toast.error('Đăng nhập thất bại.');
    }
  };

  const handleQuickLogin = (role: RoleType) => {
    const user = quickLoginAsRole(role);
    toast.success(`Đã đăng nhập nhanh với vai trò: ${user.title} (${user.name})`);
    const routes: Record<RoleType, string> = {
      admin: '/admin',
      retail: '/retail',
      technical: '/technical',
      accounts: '/accounts',
      user: '/user',
    };
    navigate(routes[user.role], { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#E0F1FF] dark:bg-[#1B2D40] text-[#1B2D40] dark:text-[#E0F1FF] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      {/* Top right Theme Toggle Button */}
      <div className="absolute top-4 right-4 z-50">
        <button
          type="button"
          onClick={toggleTheme}
          className="h-10 w-10 rounded-full bg-white/85 dark:bg-[#152434]/85 hover:bg-white dark:hover:bg-[#1E3349] text-[#1B2D40] dark:text-[#E0F1FF] border border-[#CCE4F7] dark:border-[#253D56] flex items-center justify-center transition shadow-md hover:scale-105 active:scale-95 group backdrop-blur-md"
          title={theme === 'dark' ? 'Chuyển sang giao diện Sáng (#E0F1FF)' : 'Chuyển sang giao diện Tối (#1B2D40)'}
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 text-amber-400 group-hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="h-5 w-5 text-sky-700 group-hover:-rotate-12 transition-transform" />
          )}
        </button>
      </div>

      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:3rem_3rem]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-200/40 via-[#E0F1FF] to-[#E0F1FF] dark:from-blue-900/20 dark:via-[#1B2D40] dark:to-[#1B2D40]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0284c70d_1px,transparent_1px),linear-gradient(to_bottom,#0284c70d_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:3rem_3rem]" />

      <div className="relative sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-xl shadow-blue-500/25 mb-2">
            <Layers className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">NEXUS SYSTEM</h1>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0F1D2B] dark:text-white">NEXUS SYSTEM</h1>
          <p className="text-xs uppercase font-semibold tracking-wider text-sky-600 dark:text-blue-400">
            Telecom Marketing & Operations Portal
          </p>
          <p className="text-sm text-[#537292] dark:text-slate-300 max-w-sm mx-auto">
            Hệ thống quản lý dịch vụ viễn thông nội bộ. Vui lòng đăng nhập bằng tài khoản được cấp.
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-8 bg-white/95 dark:bg-[#152434]/95 border border-[#CCE4F7] dark:border-[#253D56] rounded-2xl p-6 sm:p-8 shadow-xl dark:shadow-2xl backdrop-blur-xl transition-colors duration-300">
          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-[#305070] dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Email nhân viên / Tên đăng nhập
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#7899B8] dark:text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="admin@nexus.telecom"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#EDF6FF] dark:bg-[#101C29] border border-[#CCE4F7] dark:border-[#253D56] rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-blue-500 text-[#0F1D2B] dark:text-white placeholder-[#7899B8] dark:placeholder-slate-500 transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#305070] dark:text-slate-300 uppercase tracking-wider">
                  Mật khẩu
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#7899B8] dark:text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-[#EDF6FF] dark:bg-[#101C29] border border-[#CCE4F7] dark:border-[#253D56] rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-blue-500 text-[#0F1D2B] dark:text-white placeholder-[#7899B8] dark:placeholder-slate-500 transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#7899B8] hover:text-[#0F1D2B] dark:text-slate-500 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2"
              >
                <span>Đăng nhập hệ thống</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Quick 1-Click Role Login Chips (For testing convenience without signup) */}
          <div className="mt-6 pt-6 border-t border-[#CCE4F7] dark:border-slate-800/80">
            <div className="flex items-center justify-between text-xs font-semibold text-[#537292] dark:text-slate-400 mb-3">
              <span className="flex items-center space-x-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                <span>Đăng nhập nhanh theo Role (Demo):</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="p-2.5 rounded-lg bg-indigo-50/80 hover:bg-indigo-100/90 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300 font-medium text-left transition flex items-center space-x-2 group"
              >
                <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <div className="truncate">
                  <div className="font-bold text-[#0F1D2B] dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-200">1. Admin</div>
                  <div className="text-[10px] text-[#537292] dark:text-indigo-300/70 truncate">Sarah Jenkins</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('retail')}
                className="p-2.5 rounded-lg bg-emerald-50/80 hover:bg-emerald-100/90 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 font-medium text-left transition flex items-center space-x-2 group"
              >
                <ShoppingBag className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="truncate">
                  <div className="font-bold text-[#0F1D2B] dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-200">2. Retail Staff</div>
                  <div className="text-[10px] text-[#537292] dark:text-emerald-300/70 truncate">David Chen</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('technical')}
                className="p-2.5 rounded-lg bg-amber-50/80 hover:bg-amber-100/90 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300 font-medium text-left transition flex items-center space-x-2 group"
              >
                <Wrench className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <div className="truncate">
                  <div className="font-bold text-[#0F1D2B] dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-200">3. Technical</div>
                  <div className="text-[10px] text-[#537292] dark:text-amber-300/70 truncate">Marcus Ramirez</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('accounts')}
                className="p-2.5 rounded-lg bg-blue-50/80 hover:bg-blue-100/90 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-300 font-medium text-left transition flex items-center space-x-2 group"
              >
                <Calculator className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <div className="truncate">
                  <div className="font-bold text-[#0F1D2B] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-200">4. Accounts</div>
                  <div className="text-[10px] text-[#537292] dark:text-blue-300/70 truncate">Elena Rostova</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('user')}
                className="p-2.5 rounded-lg bg-purple-50/80 hover:bg-purple-100/90 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800/50 text-purple-700 dark:text-purple-300 font-medium text-left transition flex items-center space-x-2 group col-span-2 sm:col-span-1"
              >
                <User className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <div className="truncate">
                  <div className="font-bold text-[#0F1D2B] dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-200">5. Customer</div>
                  <div className="text-[10px] text-[#537292] dark:text-purple-300/70 truncate">Nguyễn Văn A</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Credentials cheat-sheet */}
        <div className="mt-4 text-center text-xs text-[#537292] dark:text-slate-400">
          <span>Mật khẩu mặc định cho các tài khoản: </span>
          <span className="font-mono text-[#305070] dark:text-slate-300 font-semibold">[role]123</span> (VD:{' '}
          <code className="text-[#305070] dark:text-slate-300 font-semibold">admin123</code>, <code className="text-[#305070] dark:text-slate-300 font-semibold">user123</code>)
        </div>
      </div>
    </div>
  );
};

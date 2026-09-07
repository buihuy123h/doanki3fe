/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { RoleType } from '../types/nexus';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  title: string;
  department: string;
}

export interface PredefinedAccount {
  email: string;
  password: string;
  user: AuthUser;
}

export const PREDEFINED_ACCOUNTS: PredefinedAccount[] = [
  {
    email: 'admin@nexus.telecom',
    password: 'admin123',
    user: {
      id: 'usr-admin-01',
      name: 'Sarah Jenkins',
      email: 'admin@nexus.telecom',
      role: 'admin',
      title: 'General Manager',
      department: 'Executive Administration',
    },
  },
  {
    email: 'retail@nexus.telecom',
    password: 'retail123',
    user: {
      id: 'usr-retail-02',
      name: 'David Chen',
      email: 'retail@nexus.telecom',
      role: 'retail',
      title: 'Store Representative',
      department: 'Retail Outlets (SH-01 Flagship)',
    },
  },
  {
    email: 'tech@nexus.telecom',
    password: 'tech123',
    user: {
      id: 'usr-tech-03',
      name: 'Marcus Ramirez',
      email: 'tech@nexus.telecom',
      role: 'technical',
      title: 'Field Operations Engineer',
      department: 'Technical NOC & Field Ops',
    },
  },
  {
    email: 'accounts@nexus.telecom',
    password: 'accounts123',
    user: {
      id: 'usr-accounts-04',
      name: 'Elena Rostova',
      email: 'accounts@nexus.telecom',
      role: 'accounts',
      title: 'Senior Accountant',
      department: 'Finance & Billing Division',
    },
  },
  {
    email: 'user@nexus.telecom',
    password: 'user123',
    user: {
      id: 'usr-customer-05',
      name: 'Nguyễn Văn A',
      email: 'user@nexus.telecom',
      role: 'user',
      title: 'Customer',
      department: 'Subscribers',
    },
  },
];

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

interface AuthContextType {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string; user?: AuthUser };
  register: (data: RegisterData) => { success: boolean; error?: string; user?: AuthUser };
  quickLoginAsRole: (role: RoleType) => AuthUser;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('nexus_auth_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [registeredAccounts, setRegisteredAccounts] = useState<PredefinedAccount[]>(() => {
    const saved = localStorage.getItem('nexus_registered_users');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('nexus_auth_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('nexus_auth_user');
    }
  }, [currentUser]);

  const login = (email: string, password: string) => {
    const allAccounts = [...PREDEFINED_ACCOUNTS, ...registeredAccounts];
    const account = allAccounts.find(
      (acc) =>
        acc.email.toLowerCase() === email.trim().toLowerCase() && acc.password === password
    );

    if (account) {
      setCurrentUser(account.user);
      return { success: true, user: account.user };
    }

    return { success: false, error: 'Tài khoản hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.' };
  };

  const register = (data: RegisterData) => {
    const emailNorm = data.email.trim().toLowerCase();
    const allAccounts = [...PREDEFINED_ACCOUNTS, ...registeredAccounts];
    const existing = allAccounts.find((a) => a.email.toLowerCase() === emailNorm);
    if (existing) {
      return { success: false, error: 'Email này đã được đăng ký trên hệ thống. Vui lòng đăng nhập hoặc dùng email khác.' };
    }

    const newUser: AuthUser = {
      id: `usr-${Date.now()}`,
      name: data.name.trim(),
      email: emailNorm,
      role: 'user',
      title: 'Customer',
      department: 'Subscribers',
    };

    const newAccount: PredefinedAccount = {
      email: emailNorm,
      password: data.password,
      user: newUser,
    };

    const updated = [...registeredAccounts, newAccount];
    setRegisteredAccounts(updated);
    localStorage.setItem('nexus_registered_users', JSON.stringify(updated));
    setCurrentUser(newUser);

    return { success: true, user: newUser };
  };

  const quickLoginAsRole = (role: RoleType): AuthUser => {
    const account = PREDEFINED_ACCOUNTS.find((acc) => acc.user.role === role)!;
    setCurrentUser(account.user);
    return account.user;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('nexus_auth_user');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        login,
        register,
        quickLoginAsRole,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


import { writable, derived, get } from 'svelte/store';
import type { RoleType } from '../types/nexus';
import { nexusStore, accountIdKey } from './NexusContext';
import { languageStore } from './LanguageContext';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  title: string;
  department: string;
  // Customer-only fields (populated when signing in with an Account ID)
  accountId?: string;
  orderId?: string;
  branchCode?: string;
  planName?: string;
}

// Staff accounts are internal: they are picked by role, no email/password prompt.
export interface StaffAccount {
  user: AuthUser;
}

export const STAFF_ACCOUNTS: StaffAccount[] = [
  {
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
    user: {
      id: 'usr-accounts-04',
      name: 'Elena Rostova',
      email: 'accounts@nexus.telecom',
      role: 'accounts',
      title: 'Senior Accountant',
      department: 'Finance & Billing Division',
    },
  },
];

// ---- Account ID helpers ----
// Customers sign in with the 16-char Account ID issued once the line is feasible.
// Layout per spec: [type letter D/B/T][3-digit city code][12-digit serial].
export function normalizeAccountId(raw: string): string {
  const s = (raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
  return s.length > 4 ? `${s.slice(0, 4)}-${s.slice(4)}` : s;
}

export function isCompleteAccountId(raw: string): boolean {
  return (raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '').length === 16;
}

// ---- Stores ----
function createAuthStore() {
  const savedUser = (() => {
    try {
      const s = localStorage.getItem('nexus_auth_user');
      const parsed = s ? (JSON.parse(s) as AuthUser) : null;
      // Sessions saved by the old email/password flow have no Account ID:
      // drop them so the customer signs in the new way.
      if (parsed?.role === 'user' && !parsed.accountId) return null;
      return parsed;
    } catch {
      return null;
    }
  })();

  const currentUser = writable<AuthUser | null>(savedUser);

  // Persist current user
  currentUser.subscribe((u) => {
    if (u) localStorage.setItem('nexus_auth_user', JSON.stringify(u));
    else localStorage.removeItem('nexus_auth_user');
  });

  const isAuthenticated = derived(currentUser, (u) => !!u);

  // Builds the customer session from whatever the Account ID is attached to:
  // a provisioned connection first, otherwise the order that reserved the ID.
  const buildCustomerUser = (accountId: string): AuthUser | null => {
    const key = accountIdKey(accountId);
    const connection = get(nexusStore.connections).find((c) => accountIdKey(c.accountId) === key);
    const order = get(nexusStore.orders).find(
      (o) => o.assignedAccountId && accountIdKey(o.assignedAccountId) === key
    );
    if (!connection && !order) return null;

    const shopCode = order?.retailOutletCode;
    const shop = get(nexusStore.retailShops).find((s) => s.shopCode === shopCode);

    return {
      id: accountId,
      name: connection?.customerName || order!.customerName,
      email: connection?.customerEmail || order!.customerEmail,
      role: 'user',
      title: 'Customer',
      department: shop ? `${shop.name} (${shop.shopCode})` : 'Subscribers',
      accountId,
      orderId: connection?.orderId || order?.id,
      branchCode: shopCode,
      planName: connection?.planName || order?.planName,
    };
  };

  // Customer sign-in: Account ID only, issued at purchase time.
  const loginWithAccountId = (rawAccountId: string) => {
    const accountId = normalizeAccountId(rawAccountId);

    const t = get(languageStore.t);

    if (!isCompleteAccountId(rawAccountId)) {
      return { success: false as const, error: t.auth.accountIdRequired };
    }

    const user = buildCustomerUser(accountId);
    if (!user) {
      return { success: false as const, error: t.auth.accountNotFound };
    }

    currentUser.set(user);
    return { success: true as const, user };
  };

  // Called right after a purchase so the customer lands in their portal.
  const loginAfterPurchase = (accountId: string) => loginWithAccountId(accountId);

  // Internal staff entry point (demo): pick a role, no credentials.
  const loginAsStaff = (role: Exclude<RoleType, 'user'>): AuthUser => {
    const account = STAFF_ACCOUNTS.find((acc) => acc.user.role === role)!;
    currentUser.set(account.user);
    return account.user;
  };

  const logout = () => {
    currentUser.set(null);
    localStorage.removeItem('nexus_auth_user');
  };

  return {
    currentUser,
    isAuthenticated,
    loginWithAccountId,
    loginAfterPurchase,
    loginAsStaff,
    logout,
  };
}

export const authStore = createAuthStore();

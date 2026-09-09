// Minimal hash-based SPA router for Svelte 5 (replaces react-router v7).
// Routes mirror App.tsx of the React original: '/', '/home', '/login', '/register',
// '/admin', '/retail', '/technical', '/accounts', '/user' + fallback to '/'.
import { writable } from 'svelte/store';

export function parsePath(): string {
  const h = window.location.hash.replace(/^#/, '');
  const p = h.split('?')[0];
  return p === '' ? '/' : p;
}

export const route = writable<string>(parsePath());

window.addEventListener('hashchange', () => route.set(parsePath()));

export function navigate(to: string) {
  window.location.hash = to;
}

// Reads a query param from the hash (e.g. '#/register?plan=plan-bb-01').
export function queryParam(name: string): string | null {
  const h = window.location.hash.replace(/^#/, '');
  const q = h.split('?')[1];
  return q ? new URLSearchParams(q).get(name) : null;
}

// Build a role-isolated dashboard path (mirrors ProtectedRoute's roleRoutes map)
export function dashboardPathForRole(role: string): string {
  const map: Record<string, string> = {
    admin: '/admin',
    retail: '/retail',
    technical: '/technical',
    accounts: '/accounts',
    user: '/user',
  };
  return map[role] ?? '/user';
}

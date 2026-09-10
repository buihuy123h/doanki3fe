<script lang="ts">
  // App.svelte — mirrors React App.tsx: providers become stores (already module-level),
  // Routes become a hash-router switch. Toaster mounts once globally.
  import { route } from './lib/router';
  import ProtectedRoute from './components/auth/ProtectedRoute.svelte';
  import IndexPage from './pages/IndexPage.svelte';
  import LoginPage from './pages/LoginPage.svelte';
  import RegisterPage from './pages/RegisterPage.svelte';
  import AdminDashboard from './pages/AdminDashboard.svelte';
  import RetailDashboard from './pages/RetailDashboard.svelte';
  import TechnicalDashboard from './pages/TechnicalDashboard.svelte';
  import AccountsDashboard from './pages/AccountsDashboard.svelte';
  import UserDashboard from './pages/UserDashboard.svelte';
  import { authStore } from './context/AuthContext';
  import { navigateTo, dashboardPathForRole, navigate } from './lib/router';
  import { Toaster } from 'svelte-sonner';

  const { currentUser } = authStore;

  // Seamless redirect for /profile route
  $effect(() => {
    if ($route === '/profile') {
      const user = $currentUser;
      if (user) {
        navigateTo(dashboardPathForRole(user.role), 'profile');
      } else {
        navigate('/login');
      }
    }
  });
</script>

<div class="h-screen w-screen overflow-hidden flex flex-col bg-[#E0F1FF] dark:bg-[#1B2D40] text-[#1B2D40] dark:text-[#E0F1FF] antialiased selection:bg-sky-500 selection:text-white transition-colors duration-300">
  <div class="flex-1 h-full overflow-hidden">
    {#if $route === '/' || $route === '/home'}
      <IndexPage />
    {:else if $route === '/login'}
      <LoginPage />
    {:else if $route === '/register'}
      <RegisterPage />
    {:else if $route === '/admin'}
      <ProtectedRoute requiredRole="admin">
        <AdminDashboard />
      </ProtectedRoute>
    {:else if $route === '/retail'}
      <ProtectedRoute requiredRole="retail">
        <RetailDashboard />
      </ProtectedRoute>
    {:else if $route === '/technical'}
      <ProtectedRoute requiredRole="technical">
        <TechnicalDashboard />
      </ProtectedRoute>
    {:else if $route === '/accounts'}
      <ProtectedRoute requiredRole="accounts">
        <AccountsDashboard />
      </ProtectedRoute>
    {:else if $route === '/user'}
      <ProtectedRoute requiredRole="user">
        <UserDashboard />
      </ProtectedRoute>
    {:else if $route === '/profile'}
      {#if $currentUser}
        {#if $currentUser.role === 'admin'}
          <ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>
        {:else if $currentUser.role === 'retail'}
          <ProtectedRoute requiredRole="retail"><RetailDashboard /></ProtectedRoute>
        {:else if $currentUser.role === 'technical'}
          <ProtectedRoute requiredRole="technical"><TechnicalDashboard /></ProtectedRoute>
        {:else if $currentUser.role === 'accounts'}
          <ProtectedRoute requiredRole="accounts"><AccountsDashboard /></ProtectedRoute>
        {:else}
          <ProtectedRoute requiredRole="user"><UserDashboard /></ProtectedRoute>
        {/if}
      {:else}
        <LoginPage />
      {/if}
    {:else}
      <!-- Fallback to Root (Navigate to="/" replace) -->
      <IndexPage />
    {/if}
  </div>

  <!-- Global Toast Notifications (1.5s auto dismiss) -->
  <Toaster position="top-right" offset="76px" richColors duration={1500} />
</div>

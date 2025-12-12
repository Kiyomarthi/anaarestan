import { useUserStore } from "~/stores/user";

/**
 * Admin gate: allow only logged-in admin users to continue.
 * Redirects others to the admin login page.
 * If already logged in as admin and visiting /admin/login, redirect to /admin.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const userStore = useUserStore();

  // No token or expired session -> send to login (unless already there)
  if (!userStore.isLoggedIn) {
    if (to.path !== "/admin/login") {
      return navigateTo("/admin/login");
    }
    return;
  }

  // Ensure we have fresh user info when entering admin routes
  if (!userStore.user) {
    await userStore.fetchCurrentUser();
  }

  const user = userStore.user;
  const isAdmin = !!user && (user as any).role === "admin";

  // If admin hits login page, send them to dashboard
  if (to.path === "/admin/login" && isAdmin) {
    return navigateTo("/admin");
  }

  // Non-admins cannot access admin routes
  if (!isAdmin) {
    return navigateTo("/admin/login");
  }
});

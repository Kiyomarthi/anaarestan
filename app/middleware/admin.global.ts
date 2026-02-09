import { useUserStore } from "~/stores/user";

/**
 * Admin global middleware:
 * Automatically applies to all routes starting with /admin/
 * Checks authentication and admin role for all admin pages
 *
 * - Redirects to /admin/login if not authenticated or not admin
 * - Redirects to /admin if admin tries to access /admin/login
 * - If logged in but not admin and tries to access /admin, redirects to /admin/login
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const userStore = useUserStore();
  const isAdminLogin = to.path === "/admin/login";
  const isAdminRoute = to.path === "/admin" || to.path.startsWith("/admin/");

  // Only apply to admin routes
  if (!isAdminRoute) {
    return;
  }

  // Fetch user data if logged in but user data is not available
  if (userStore.isLoggedIn && !userStore.user) {
    try {
      await userStore.fetchCurrentUser();
    } catch {
      userStore.logOut();
      return navigateTo("/admin/login");
    }
  }

  const isAdmin = userStore.user?.role === "admin";

  // If accessing admin login page
  if (isAdminLogin) {
    // If logged in and is admin, redirect to admin dashboard
    if (userStore.isLoggedIn && isAdmin) {
      return navigateTo("/admin");
    }
    // Otherwise allow access to login page
    return;
  }

  // For /admin route specifically
  if (to.path === "/admin") {
    // If logged in but not admin, redirect to admin login
    if (userStore.isLoggedIn && !isAdmin) {
      return navigateTo("/admin/login");
    }
    // If not logged in, redirect to admin login
    if (!userStore.isLoggedIn) {
      return navigateTo("/admin/login");
    }
    // If logged in and is admin, allow access
    return;
  }

  // For other admin routes, require authentication and admin role
  if (!userStore.isLoggedIn) {
    return navigateTo("/admin/login");
  }

  // If logged in but not admin, redirect to admin login
  if (!isAdmin) {
    return navigateTo("/admin/login");
  }
});

import { useUserStore } from "~/stores/user";

/**
 * Unified authentication middleware for both admin and regular users:
 * - Admin routes: require admin role, redirect to /admin/login if not authenticated
 * - Regular routes: require authentication, redirect to /login if not authenticated
 * - Public pages: /login, /admin/login, / (home page)
 * - If logged in and visiting login page, redirect to appropriate dashboard
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const userStore = useUserStore();
  const isAdminRoute = to.path.startsWith("/admin");
  const isAdminLogin = to.path === "/admin/login";
  const isUserLogin = to.path === "/login";
  const isHomePage = to.path === "/";

  // Public pages that don't require authentication
  const publicPages = ["/login", "/admin/login", "/"];
  const isPublicPage = publicPages.includes(to.path);

  // If user is logged in, fetch user data if not available
  if (userStore.isLoggedIn && !userStore.user) {
    try {
      await userStore.fetchCurrentUser();
    } catch (error) {
      // If fetch fails, user might not be valid anymore
      // Continue with checks below
    }
  }

  const user = userStore.user;
  const isAdmin = !!user && (user as any).role === "admin";

  // Handle admin routes
  if (isAdminRoute) {
    // Allow access to admin login page without authentication
    if (isAdminLogin) {
      // If logged in and admin, redirect to dashboard
      if (userStore.isLoggedIn && isAdmin) {
        return navigateTo("/admin");
      }
      // Otherwise allow access to login page
      return;
    }

    // For other admin routes, require authentication
    if (!userStore.isLoggedIn) {
      return navigateTo("/admin/login");
    }

    // Check if user is admin
    if (!isAdmin) {
      return navigateTo("/admin/login");
    }

    // Admin can access admin routes
    return;
  }

  // Handle regular user routes
  // If user is logged in and trying to access login page, redirect to home
  if (userStore.isLoggedIn && isUserLogin) {
    return navigateTo("/");
  }

  // If user is not logged in and trying to access protected page, redirect to login
  if (!userStore.isLoggedIn && !isPublicPage) {
    return navigateTo("/login");
  }
});

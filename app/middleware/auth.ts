import { useUserStore } from "~/stores/user";

/**
 * Authentication middleware (non-global):
 * Use this middleware explicitly in pages that require authentication
 * by adding: definePageMeta({ middleware: 'auth' })
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const userStore = useUserStore();
  const isUserLogin = to.path === "/login";

  // If user is logged in and trying to access login page, redirect to home
  if (userStore.isLoggedIn && isUserLogin) {
    return navigateTo("/");
  }

  // If user is not logged in and trying to access protected page, redirect to login
  if (!userStore.isLoggedIn && !["/", "/login"].includes(to.path)) {
    return navigateTo("/login");
  }
});

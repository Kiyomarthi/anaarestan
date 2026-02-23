export default defineNuxtRouteMiddleware((to) => {
  const user = useUserStore();
  const router = useRouter();

  if (user.isLoggedIn) {
    user.modal = false;
    return;
  }

  if (to.hash === "#auth") {
    return;
  }

  user.modal = true;
  user.isRequired = true;
  return;
});

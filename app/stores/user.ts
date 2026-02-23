import { useCartStore } from "./cart";

type UserPayload = Record<string, any>;
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const useUserStore = defineStore(
  "user",
  () => {
    const user = ref<UserPayload | null>(null);
    const createdAt = ref<number | null>(null);
    const alert = ref<string>("");
    const route = useRoute();
    const router = useRouter();
    const isRequired = ref<boolean>(false);
    const doAfterLogin = ref<(() => void | Promise<void>) | null>(null);
    const cartStore = useCartStore();

    const modal = computed<boolean>({
      get() {
        return route.hash === "#auth";
      },
      set(value) {
        if (value) {
          if (route.hash !== "#auth") {
            router.push({
              path: route.path,
              query: route.query,
              hash: "#auth",
            });
          }
        } else {
          if (route.hash === "#auth") {
            router.replace({
              path: route.path,
              query: route.query,
              hash: "",
            });
          }
        }
      },
    });

    const tokenCookie = useCookie<string | null>("auth_token");

    const isExpired = computed(
      () => !!createdAt.value && Date.now() - createdAt.value > TTL_MS,
    );

    function logOut() {
      tokenCookie.value = null;
      user.value = null;
      createdAt.value = null;
      cartStore?.clearCart();
    }

    const isLoggedIn = computed(() => {
      if (!tokenCookie.value) return false;
      if (isExpired.value) return false;
      return true;
    });

    const token = computed(() => {
      return tokenCookie.value;
    });

    const isAdmin = computed(() => isLoggedIn && user.value?.role === "admin");

    function setUser(userData: UserPayload | null) {
      user.value = userData;
      createdAt.value = userData ? Date.now() : null;
    }

    function setAuth(newToken: string | null, userData?: UserPayload | null) {
      tokenCookie.value = newToken;
      if (userData !== undefined) {
        setUser(userData);
      }
      isRequired.value = false;
    }

    async function fetchCurrentUser() {
      if (!token.value || isExpired.value) {
        logOut();
        return null;
      }

      try {
        const result = await $fetch<{ success: boolean; user: UserPayload }>(
          "/api/users/me",
          {
            headers: {
              Authorization: `Bearer ${token.value}`,
            },
          },
        );

        setUser(result?.user ?? null);
        return user.value;
      } catch (_err) {
        logOut();
        return null;
      }
    }

    return {
      user,
      createdAt,
      token,
      isExpired,
      isAdmin,
      isLoggedIn,
      setUser,
      setAuth,
      fetchCurrentUser,
      logOut,
      modal,
      doAfterLogin,
      alert,
      isRequired,
    };
  },
  {
    persist: {
      key: "user",
      storage: "local",
      paths: ["user", "createdAt"],
      encrypt: true,
    },
  },
);

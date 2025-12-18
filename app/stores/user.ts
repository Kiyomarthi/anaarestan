type UserPayload = Record<string, any>;
const TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

export const useUserStore = defineStore(
  "user",
  () => {
    const user = ref<UserPayload | null>(null);
    const createdAt = ref<number | null>(null);

    const token = computed<string | null>(() => {
      const tokenCookie = useCookie<string | null>("auth_token", {
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
      return tokenCookie.value ?? null;
    });

    const isExpired = computed(
      () => !!createdAt.value && Date.now() - createdAt.value > TTL_MS
    );

    const isLoggedIn = computed(() => {
      if (createdAt.value && Date.now() - createdAt.value > TTL_MS) {
        nextTick(() => {
          logOut();
        });
        return false;
      }
      return Boolean(token.value) && !isExpired.value;
    });

    const isAdmin = computed(
      () => isLoggedIn.value && user.value?.role === "admin"
    );

    function setUser(userData: UserPayload | null) {
      user.value = userData;
      createdAt.value = userData ? Date.now() : null;
    }

    function setAuth(newToken: string | null, userData?: UserPayload | null) {
      const tokenCookie = useCookie<string | null>("auth_token", {
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
      tokenCookie.value = newToken;
      if (userData !== undefined) {
        setUser(userData);
      }
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
          }
        );

        setUser(result?.user ?? null);
        return user.value;
      } catch (_err) {
        logOut();
        return null;
      }
    }

    function logOut() {
      const tokenCookie = useCookie<string | null>("auth_token", {
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
      tokenCookie.value = null;
      user.value = null;
      createdAt.value = null;
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
    };
  },
  {
    persist: {
      key: "user",
      storage: "local",
      paths: ["user", "createdAt"],
      encrypt: true,
    },
  }
);

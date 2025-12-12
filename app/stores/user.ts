type UserPayload = Record<string, any>;

const STORAGE_KEY = "user_cache";
const TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

export const useUserStore = defineStore("user", () => {
  const tokenCookie = useCookie<string | null>("auth_token", {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  const user = ref<UserPayload | null>(null);
  const createdAt = ref<number | null>(null);

  const token = computed(() => tokenCookie.value ?? null);
  const isExpired = computed(
    () => !!createdAt.value && Date.now() - createdAt.value > TTL_MS
  );
  const isLoggedIn = computed(() => Boolean(token.value) && !isExpired.value);

  const clearStorage = () => {
    if (process.client) {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const persistUser = () => {
    if (!process.client || !user.value || !createdAt.value) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        user: user.value,
        createdAt: createdAt.value,
      })
    );
  };

  const restoreFromStorage = () => {
    if (!process.client) return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as {
        user?: UserPayload;
        createdAt?: number;
      };
      if (!parsed?.createdAt || Date.now() - parsed.createdAt > TTL_MS) {
        logOut();
        return;
      }
      user.value = parsed.user ?? null;
      createdAt.value = parsed.createdAt;
    } catch (_err) {
      clearStorage();
    }
  };

  const setUser = (userData: UserPayload | null) => {
    user.value = userData;
    createdAt.value = userData ? Date.now() : null;
    persistUser();
  };

  const setAuth = (newToken: string | null, userData?: UserPayload | null) => {
    tokenCookie.value = newToken;
    if (userData !== undefined) {
      setUser(userData);
    } else {
      persistUser();
    }
  };

  const fetchCurrentUser = async () => {
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
  };

  const logOut = () => {
    tokenCookie.value = null;
    user.value = null;
    createdAt.value = null;
    clearStorage();
  };

  restoreFromStorage();

  return {
    user,
    token,
    isLoggedIn,
    setAuth,
    fetchCurrentUser,
    logOut,
  };
});

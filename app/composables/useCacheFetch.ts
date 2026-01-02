import type { Options } from "~~/shared/types/api";
import { useRuntimeConfig } from "nuxt/app";

export function useCacheFetch<T>() {
  const loading = ref(false);
  const data = ref<T | null>(null);
  const error = ref<any>(null);

  const fetch = async (url: string, options: Options = {}): Promise<void> => {
    const key = JSON.stringify({ url, ...options });
    const state = useState<T | null>(`cache-${key}`, () => null);

    error.value = null;
    data.value = null;

    if (!url || !url.trim().startsWith("/")) {
      console.warn(`[useCacheFetch] Invalid URL: "${url}"`);
      error.value = { message: "Invalid URL" };
      return;
    }

    if (import.meta.client && state.value) {
      data.value = state.value;
      return;
    }

    try {
      loading.value = true;
      const { data: fetchedData, error: fetchError } = await useFetch<T>(url, {
        ...options,
        server: true,
      });

      if (fetchError.value) {
        error.value = fetchError.value;
        throw showError({
          statusCode: fetchError.value.statusCode || 500,
          statusMessage: fetchError.value.statusMessage || "Error",
          fatal: true,
        });
      }

      if (fetchedData.value && !error.value) {
        state.value = fetchedData.value as T;
        data.value = fetchedData.value as T;
      }
      loading.value = false;
    } catch (err: unknown) {
      loading.value = false;
      console.error(`[useCacheFetch] Exception during fetch:`, err);
      error.value =
        err instanceof Error ? err : { message: "Unknown fetch error" };
    }
  };

  return { fetch, loading, data, error };
}

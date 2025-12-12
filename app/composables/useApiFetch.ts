import { computed, shallowRef, unref, watch } from "vue";
import type { UseFetchOptions } from "#app";

type MaybeRef<T> = T | Ref<T> | ComputedRef<T>;

export interface ApiFetchOptions<T> extends UseFetchOptions<T> {
  /**
   * Optional cache key to mirror server-side redis caching.
   * When provided, the response will also be stored in a shared state with
   * the same key to avoid refetching on re-open.
   */
  cacheKey?: MaybeRef<string | null | undefined>;
}

export function useApiFetch<T = any>(
  url: Parameters<typeof useFetch<T>>[0],
  options: ApiFetchOptions<T> = {}
) {
  const cacheKeyInput = options.cacheKey;
  const cacheKey = computed(() => {
    const key = unref(cacheKeyInput);
    return key || null;
  });

  const cacheState = shallowRef<ReturnType<typeof useState<T | null>> | null>(
    null
  );

  watch(
    cacheKey,
    (key) => {
      cacheState.value = key
        ? useState<T | null>(`api-cache:${key}`, () => null)
        : null;
    },
    { immediate: true }
  );

  const mergedHeaders = computed(() => {
    const base =
      typeof options.headers === "function"
        ? (options.headers as any)()
        : options.headers || {};

    const key = cacheKey.value;
    return key ? { ...base, "cache-key": key } : base;
  });

  const fetchOptions: UseFetchOptions<T> = {
    ...options,
    cacheKey: undefined,
    headers: mergedHeaders,
    immediate: options.immediate ?? true,
    default: () => {
      const cached = cacheState.value?.value;
      if (cached !== null && cached !== undefined) return cached as any;
      if (typeof options.default === "function") {
        return (options.default as any)();
      }
      return undefined as any;
    },
    onResponse: (ctx) => {
      if (cacheState.value) {
        cacheState.value.value = (ctx.response._data as any) ?? null;
      }
      options.onResponse?.(ctx);
    },
    onResponseError: (ctx) => {
      options.onResponseError?.(ctx);
    },
  };

  const result = useFetch<T>(url as any, fetchOptions);

  const data = computed(() => {
    if (
      cacheState.value &&
      cacheState.value.value !== null &&
      cacheState.value.value !== undefined
    ) {
      return cacheState.value.value as any;
    }
    return result.data.value as any;
  });

  return {
    ...result,
    data,
    cacheState,
  };
}

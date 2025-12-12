import type { FetchOptions } from "ofetch";

type Method =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS"
  | "TRACE"
  | Lowercase<
      "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS" | "TRACE"
    >;

export type ApiRequestOptions<TBody = any> = Omit<
  FetchOptions<"json">,
  "body" | "method"
> & {
  method?: Method;
  body?: TBody;
  errorTitle?: string;
  errorDescription?: string;
};

export function useApiRequest<TResponse = any>() {
  const toast = useToast();
  const loading = ref(false);
  const response = ref<TResponse | null>(null);
  const error = ref<any>(null);

  const fetch = async (
    url: string,
    options: ApiRequestOptions = {}
  ): Promise<TResponse> => {
    const { errorTitle, errorDescription, ...fetchOptions } = options;
    loading.value = true;
    error.value = null;

    try {
      const result = await $fetch<any>(url, fetchOptions as any);
      response.value = result as TResponse;
      return result as TResponse;
    } catch (err: any) {
      error.value = err;
      const message =
        errorDescription ??
        err?.data?.message ??
        "مشکلی پیش آمد، لطفا دوباره تلاش کنید";

      toast.add({
        title: errorTitle ?? "خطا",
        description: message,
        color: "error",
      });

      throw err;
    } finally {
      loading.value = false;
    }
  };

  return { loading, response, error, fetch };
}

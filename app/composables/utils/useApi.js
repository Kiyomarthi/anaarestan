export const useApi = () => {
  const config = useRuntimeConfig();

  const apiKey = config.binanceApiKey;
  const apiBaseUrl = config.public.binanceApiBaseUrl;
  const loading = ref(false);
  const error = ref(null);
  const response = ref(null);

  const getHeaders = (isSigned) => {
    const headers = {
      "Content-Type": "application/json",
    };

    if (isSigned && apiKey) {
      headers["X-MBX-APIKEY"] = apiKey;
    }

    return headers;
  };

  const get = async (url, params, isSigned = false) => {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await useFetch(
        `${apiBaseUrl}${url}`,
        {
          method: "GET",
          params,
          headers: getHeaders(isSigned),
        }
      );

      response.value = data.value;
      error.value = fetchError.value;
    } catch (err) {
      error.value = err;
    } finally {
      loading.value = false;
    }

    return { data: response, error, loading };
  };

  const post = async (url, body, isSigned = false) => {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await useFetch(
        `${apiBaseUrl}${url}`,
        {
          method: "POST",
          body,
          headers: getHeaders(isSigned),
        }
      );

      response.value = data.value;
      error.value = fetchError.value;
    } catch (err) {
      error.value = err;
    } finally {
      loading.value = false;
    }

    return { data: response, error, loading };
  };

  const destroy = async (url, params, isSigned = false) => {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await useFetch(
        `${apiBaseUrl}${url}`,
        {
          method: "DELETE",
          params,
          headers: getHeaders(isSigned),
        }
      );

      response.value = data.value;
      error.value = fetchError.value;
    } catch (err) {
      error.value = err;
    } finally {
      loading.value = false;
    }

    return { data: response, error, loading };
  };

  return { get, post, destroy };
};

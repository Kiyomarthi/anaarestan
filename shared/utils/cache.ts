const runtime = useRuntimeConfig();
const BASE = runtime.public?.siteNameEn || "anarestan";

export const CACHE_KEY = {
  page: `${BASE}:page`,
  category: `${BASE}:category`,
} as const;

export const makeCache = (eightHours: number = 30 * 60) => {
  const now = Math.floor(Date.now() / 1000);
  return now + eightHours;
};

export const isCacheValid = (cacheTime: number | null): boolean => {
  if (!cacheTime) return false;

  const now = Math.floor(Date.now() / 1000);
  return cacheTime > now;
};

export const CACHE_TIME = {};

const runtime = useRuntimeConfig();
const BASE = runtime.public?.siteNameEn || "anarestan";

export const CACHE_KEY = {
  PAGE: (canonical: string) => `${BASE}:page:${canonical}`,
  category: (canonical: string) => `${BASE}:category:${canonical}`,
  attribute: (canonical: string) => `${BASE}:attribute:${canonical}`,
  //   BLOG: (posts: string) => `${BASE}:blog:${posts}`,
  //   USER: (userId: string) => `${BASE}:user:${userId}`,
  //   CITY: (service: string) => `${BASE}:city:${service}`,
  SETTINGS: `${BASE}:settings`,
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

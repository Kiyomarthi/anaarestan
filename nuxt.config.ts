// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  modules: [
    "@nuxt/eslint",
    "@nuxt/ui",
    "@nuxt/image",
    "@nuxt/scripts",
    "@nuxt/test-utils",
    "@nuxtjs/sitemap",
    "@pinia/nuxt",
    "@nuxt/hints",
    "@vite-pwa/nuxt",
    "nuxt-schema-org",
  ],

  ui: {
    fonts: true,
    colorMode: false,
    theme: {
      colors: ["primary"],
    },
  },

  css: ["~~/public/css/main.css"],

  runtimeConfig: {
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL,
      siteNameFa: process.env.NUXT_PUBLIC_SITE_NAME_FA,
      siteNameEn: process.env.NUXT_PUBLIC_SITE_NAME_EN,
      phones: {
        mashhad: process.env.NUXT_PUBLIC_MASHHAD_PHONE,
      },
    },

    redis: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD,
    },

    db: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    },
    jwtSecret: process.env.JWT_SECRET,
  },

  nitro: {
    storage: {
      redis: {
        driver: "redis",
        port: process.env.REDIS_PORT,
        host: process.env.REDIS_HOST,
        // username: "",
        // password: process.env.REDIS_PASSWORD,
        // tls: {},
        db: 0,
      },
    },
  },
});

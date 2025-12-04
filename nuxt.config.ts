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
    db: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    },
    jwtSecret: process.env.JWT_SECRET,
  },
});

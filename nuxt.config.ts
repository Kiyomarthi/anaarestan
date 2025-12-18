// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: process.env.NODE_ENV !== "production" },

  modules: [
    "@nuxt/eslint",
    "@nuxt/ui",
    "@nuxt/image",
    "@nuxt/scripts",
    "@nuxt/test-utils",
    "@pinia/nuxt",
    "@nuxt/hints",
    "@vite-pwa/nuxt",
    "nuxt-schema-org",
  ],

  experimental: {
    defaults: {
      nuxtLink: {
        trailingSlash: "remove",
        // TODO: enable prefetching when needed
        // prefetchOn: {
        //   visibility: false,
        //   interaction: true,
        // },
      },
    },
  },

  app: {
    layoutTransition: { name: "layout", mode: "out-in" },
    head: {
      title: "انارستان",
      titleTemplate: "%s | انارستان",
      meta: [
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1,  maximum-scale=5",
        },
        {
          name: "google",
          content: "notranslate",
        },
        {
          name: "robots",
          content: "noindex,nofollow",
        },
        {
          name: "application-name",
          content: "انارستان",
        },
      ],
      link: [
        {
          rel: "icon",
          type: "image/x-icon",
          href: process.env.NUXT_PUBLIC_FAVICON,
        },
      ],
      htmlAttrs: {
        dir: "rtl",
        lang: "fa",
      },
    },
    rootAttrs: {
      "data-vaul-drawer-wrapper": "",
      class: "bg-default",
    },
  },

  ui: {
    fonts: true,
    colorMode: false,
    theme: {
      colors: ["primary", "white", "info", "success", "warning", "error"],
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
      social: {
        fb: process.env.NUXT_PUBLIC_FB,
        x: process.env.NUXT_PUBLIC_X,
        ig: process.env.NUXT_PUBLIC_IG,
        yt: process.env.NUXT_PUBLIC_YT,
      },
      favicon: process.env.NUXT_PUBLIC_FAVICON,
      logo: process.env.NUXT_PUBLIC_LOGO,
      ogImage: process.env.NUXT_PUBLIC_OG_IMAGE,
      desc: process.env.NUXT_PUBLIC_DESC,
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
    uploadDir: process.env.UPLOAD_DIR || "/home/anaarest/uploads",
    uploadUrl: process.env.UPLOAD_URL || "/uploads",
    persistSecret: process.env.PERSIST_SECRET,
  },

  nitro: {
    preset: "node-server",
    externals: {
      inline: [],
    },
    storage: {
      redis: {
        driver: "redis",
        port: Number(process.env.REDIS_PORT),
        host: process.env.REDIS_HOST,
        // username: "",
        password: process.env.REDIS_PASSWORD || undefined,
        // tls: {},
        db: 0,
      },
    },
  },

  vite: {
    optimizeDeps: {
      include: ["vue", "pinia", "vue-router"],
    },
    ssr: {
      noExternal: ["vue", "pinia", "vue-router"],
      resolve: {
        conditions: ["import", "module", "default"],
      },
    },
  },

  fonts: {
    provider: "local",
    families: [
      {
        name: "YekanBakh",
        src: ["/fonts/yekan-bakh-normal.woff2"],
        weight: "400",
        style: "normal",
        global: true,
        display: "swap",
      },
      {
        name: "YekanBakh",
        src: ["/fonts/yekan-bakh-light.woff2"],
        weight: "300",
        style: "normal",
        global: true,
      },
      {
        name: "YekanBakh",
        src: ["/fonts/yekan-bakh-semibold.woff2"],
        weight: "500",
        style: "normal",
        global: true,
        display: "swap",
      },
      {
        name: "YekanBakh",
        src: ["/fonts/yekan-bakh-bold.woff2"],
        weight: "700",
        style: "normal",
        global: true,
        display: "swap",
      },
    ],
  },
});

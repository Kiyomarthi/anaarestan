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
    "nuxt-cron",
  ],

  routeRules: {
    "/admin/**": { ssr: false },
    "/login": { ssr: false },
  },

  experimental: {
    defaults: {
      nuxtLink: {
        trailingSlash: "remove",
        prefetchOn: {
          visibility: true,
          interaction: true,
        },
      },
    },
  },

  image: {
    provider: "none",
    // provider: "imagekit",
    // imagekit: {
    //   baseURL: process.env.IMAGEKIT_URL,
    // },

    // screens: {
    //   sm: 320,
    //   md: 640,
    //   lg: 1024,
    //   xl: 1280,
    //   "2xl": 1536,
    // },

    // format: ["avif", "webp", "jpg"],
    // quality: 75,

    // presets: {
    //   product: {
    //     modifiers: {
    //       format: "auto",
    //       quality: 75,
    //       fit: "cover",
    //     },
    //     sizes: "(max-width: 768px) 100vw, 400px",
    //   },

    //   thumbnail: {
    //     modifiers: {
    //       format: "auto",
    //       quality: 60,
    //       width: 150,
    //       height: 150,
    //       fit: "cover",
    //     },
    //     sizes: "48px",
    //   },

    //   banner: {
    //     modifiers: {
    //       format: "auto",
    //       quality: 80,
    //       fit: "cover",
    //     },
    //     sizes: "(max-width: 768px) 100vw, 1200px",
    //   },
    // },

    // providers: {
    //   none: {
    //     provider: "none",
    //   },
    // },
  },

  cron: {
    runOnInit: true,
    timeZone: "Asia/Tehran",
    jobsDir: "cron",
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
        {
          name: "theme-color",
          content: "#e63a33",
        },
      ],
      link: [
        {
          rel: "icon",
          type: "image/x-icon",
          href: process.env.NUXT_PUBLIC_FAVICON,
        },
        {
          rel: "preload",
          as: "font",
          href: "/fonts/yekan-bakh-normal-subset.woff2",
          type: "font/woff2",
          crossorigin: "anonymous",
        },
        {
          rel: "preload",
          as: "font",
          href: "/fonts/yekan-bakh-bold-subset.woff2",
          type: "font/woff2",
          crossorigin: "anonymous",
        },
        {
          rel: "preload",
          as: "font",
          href: "/fonts/yekan-bakh-semibold-subset.woff2",
          type: "font/woff2",
          crossorigin: "anonymous",
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
      colors: [
        "primary",
        "info",
        "success",
        "warning",
        "error",
        "default",
        "gray",
      ],
    },
  },

  css: ["~~/public/css/main.css", "~~/public/css/custom.css"],

  runtimeConfig: {
    public: {
      arvanBucketEndpoint: process.env.NUXT_PUBLIC_ARVAN_BUCKET_ENDPOINT,
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL,
      siteNameFa: process.env.NUXT_PUBLIC_SITE_NAME_FA,
      siteNameEn: process.env.NUXT_PUBLIC_SITE_NAME_EN,
      persistSecret: process.env.NUXT_PUBLIC_PERSIST_SECRET,
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
    imagekitUrl: process.env.IMAGEKIT_URL,
    imagekitPublicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    imagekitPrivateKey: process.env.IMAGEKIT_PRIVATE_KEY,

    arvanEndpoint: process.env.ARVAN_ENDPOINT,
    arvanAccessKey: process.env.ARVAN_ACCESS_KEY,
    arvanSecretKey: process.env.ARVAN_SECRET_KEY,
    arvanBucket: process.env.ARVAN_BUCKET,
  },

  nitro: {
    preset: "node-server",
    externals: {
      external: ["mysql2", "bcryptjs", "jsonwebtoken", "serve-static"],
      inline: [],
    },
    minify: true,
    compressPublicAssets: {
      brotli: true,
      gzip: true,
    },
    compression: {
      gzip: true,
      // Optional: Configure compression level (1-9, higher is more compression)
      gzipLevel: 6, // Default is 6, balance between speed and compression
    },
    // esbuild: {
    //   options: {
    //     drop: ["console", "debugger"],
    //   },
    // },
    storage: {
      cache: { driver: "memory" },
      // Filesystem-based cache storage (no external dependencies required)
      db: {
        driver: "memory",
        base: ".cache",
      },
      // Redis configuration (commented out for shared hosting compatibility)
      // Uncomment below if you want to use Redis again:
      // redis: {
      //   driver: "redis",
      //   port: Number(process.env.REDIS_PORT),
      //   host: process.env.REDIS_HOST,
      //   // username: "",
      //   password: process.env.REDIS_PASSWORD || undefined,
      //   // tls: {},
      //   db: 0,
      // },
      // redis: {
      //   driver: "redis",
      //   path: "/home/anaarest/redis/redis.sock",
      //   db: 0,
      // },
    },

    // TODO: check this service worker cache control
    routeRules: {
      "/_nuxt/**": {
        cache: { maxAge: 60 * 60 * 24 * 365 },
        headers: {
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      },
    },

    "/_ipx/**": {
      cache: { maxAge: 60 * 60 * 24 * 30 },
      headers: {
        "Cache-Control":
          "public, max-age=31536000, stale-while-revalidate=86400, immutable",
      },
    },

    "/images/**": {
      cache: { maxAge: 60 * 60 * 24 * 365 },
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    },

    "/icons/**": {
      cache: { maxAge: 60 * 60 * 24 * 365 },
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    },

    "/fonts/**": {
      cache: { maxAge: 60 * 60 * 24 * 365 },
      headers: {
        "Cache-Control":
          "public, max-age=31536000, stale-while-revalidate=86400",
      },
    },

    "/**/*.(png|jpg|jpeg|webp|avif|svg|ico|woff|woff2|ttf|otf)": {
      cache: { maxAge: 60 * 60 * 24 * 365 },
      headers: {
        "Cache-Control":
          "public, max-age=31536000, stale-while-revalidate=86400, immutable",
      },
    },

    // TODO: complete this
    "/api/page/**": {
      cache: { maxAge: 60 * 60, swr: 60 * 10 },
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
      },
    },

    // TODO: complete this
    "/api/**": { headers: { "Cache-Control": "no-store" } },
    "/cart/**": { headers: { "Cache-Control": "no-store" } },

    // TODO: complete this
    "/admin/**": {
      ssr: false,
      delayHydration: false,
      headers: { "Cache-Control": "no-store" },
    },
    "/login": {
      ssr: false,
      delayHydration: false,
      headers: { "Cache-Control": "no-store" },
    },

    "/**": {
      cache: { maxAge: 60 * 60, swr: 60 * 10 },
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
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
    build: {
      minify: "terser",
      cssMinify: "lightningcss",
    },
  },

  fonts: {
    provider: "local",
    families: [
      {
        name: "YekanBakh",
        src: ["/fonts/yekan-bakh-normal-subset.woff2"],
        weight: "400",
        style: "normal",
        preload: true,
        global: true,
        display: "swap",
        unicodeRange: "U+0600-06FF,U+06F0-06F9",
      },
      {
        name: "YekanBakh",
        src: ["/fonts/yekan-bakh-semibold-subset.woff2"],
        weight: "500",
        style: "normal",
        preload: true,
        global: true,
        display: "swap",
        unicodeRange: "U+0600-06FF,U+06F0-06F9",
      },
      {
        name: "YekanBakh",
        src: ["/fonts/yekan-bakh-bold-subset.woff2"],
        weight: "700",
        style: "normal",
        preload: true,
        global: true,
        display: "swap",
        unicodeRange: "U+0600-06FF,U+06F0-06F9",
      },
    ],
  },
});

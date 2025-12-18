import { computed } from "vue";
import type { SeoItem } from "~~/shared/types/seo";

export const useConfigSeo = () => {
  const siteConfig = computed(() => useRuntimeConfig());
  const route = useRoute();

  const buildMeta = (seo: SeoItem) => {
    useSeoMeta({
      title: seo?.title || `انارستان | فروشگاه آنلاین خرید کالاهای متنوع`,
      titleTemplate: (title) => {
        if (route.path === "/") {
          return `انارستان | فروشگاه آنلاین خرید کالاهای متنوع`;
        } else {
          return `${title} | انارستان`;
        }
      },
      description: seo?.description || siteConfig.value?.public?.desc,
      robots: {
        index: true,
        follow: true,
        noimageindex: false,
        nosnippet: false,
        maxSnippet: -1,
        maxImagePreview: "large",
        maxVideoPreview: -1,
      },
      publisher: siteConfig.value?.public?.siteNameFa,
      charset: "utf-8",
      applicationName: siteConfig.value.public?.siteNameFa,
      mobileWebAppCapable: "yes",
      appleMobileWebAppCapable: "yes",
      ogSiteName: siteConfig.value.public.siteNameFa,
      appleMobileWebAppTitle: siteConfig.value.public.siteNameFa,
      ogImage:
        seo?.image || `${siteConfig.value.public.siteUrl}/images/logo-og.png`,
      ogImageAlt: seo?.title || "فروشگاه آنلاین خرید کالاهای متنوع",
      ogImageHeight: "630",
      ogImageWidth: "1200",
      themeColor: "#e63a33",
      referrer: "strict-origin-when-cross-origin",
      ogImageType: "image/png",
      ogLocale: "fa_IR",
      ogTitle: seo?.title || "فروشگاه آنلاین خرید کالاهای متنوع",
      ogDescription: seo?.description || siteConfig.value?.public?.desc,
      ogUrl: `${siteConfig.value.public.siteUrl}/${seo?.canonical ?? ""}`,
      ogType: seo?.ogType || "website",
      twitterTitle: seo?.title || "فروشگاه آنلاین خرید کالاهای متنوع",
      twitterDescription: seo?.description || siteConfig.value?.public?.desc,
      twitterImageAlt: seo?.title || "فروشگاه آنلاین خرید کالاهای متنوع",
      twitterImage:
        seo?.image || `${siteConfig.value.public.siteUrl}/images/logo-og.png`,
      twitterCard: "summary_large_image",
    });

    useHead({
      link: [
        {
          rel: "canonical",
          href: seo?.canonical
            ? `${
                siteConfig.value.public.siteUrl
              }/${seo?.canonical.toLowerCase()}`
            : siteConfig.value.public.siteUrl.toLowerCase(),
        },
      ],
    });
  };

  const organizationSchema = () =>
    defineOrganization({
      name: "انارستان",
      alternateName: "Anaarestan",
      url: siteConfig.value.public.siteUrl,
      logo: `${siteConfig.value.public.siteUrl}/favicon.png`,
      contactPoint: {
        "@type": "ContactPoint",
        telephone: siteConfig.value.public.phones.mashhad,
        contactType: "sales",
        areaServed: "IR",
        availableLanguage: "Persian",
      },
      sameAs: [
        "https://www.facebook.com/anaarestan",
        "https://x.com/anaarestan",
        "https://www.instagram.com/anaarestan/",
        "https://www.youtube.com/@anaarestan",
      ],
    });

  const websiteSchema = () =>
    defineWebSite({
      url: siteConfig.value.public.siteUrl,
      name: siteConfig.value.public.siteNameFa,
      alternateName: siteConfig.value.public.siteNameEn,
      description:
        siteConfig.value?.public?.desc ||
        "انارستان یک فروشگاه آنلاین برای خرید کالاهای متنوع است؛ از خوراک و پوشاک گرفته تا اسباب‌بازی و لوازم خانه، با امکان بررسی محصولات و ثبت سفارش آنلاین.",
      publisher: {
        "@type": "Organization",
        name: "انارستان",
        url: siteConfig.value.public.siteUrl,
        logo: {
          "@type": "ImageObject",
          url: `${siteConfig.value.public.siteUrl}/images/logo.png`,
          width: "360",
          height: "100",
          caption: "لوگوی انارستان",
        },
      },
      inLanguage: "fa-IR",
    });

  const webpageSchema = (seo: SeoItem) =>
    defineWebPage({
      name: seo?.title || "فروشگاه آنلاین خرید کالاهای متنوع",
      description:
        seo?.description ||
        siteConfig.value?.public?.desc ||
        "انارستان، فروشگاه آنلاین انواع محصولات",
      url: seo?.canonical || siteConfig.value.public.siteUrl,
      inLanguage: "fa-IR",
    });

  return { buildMeta, organizationSchema, websiteSchema, webpageSchema };
};

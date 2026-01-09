<script setup lang="ts">
///// imports /////
import { useConfigSeo } from "~/composables/utils/useConfigSeo";
import type { ApiResponse, PageResponse } from "~~/shared/types/api";

///// page meta /////
definePageMeta({
  noMargin: true,
});

///// props/emits /////

///// refs /////

///// composables/stores /////
const { buildMeta, organizationSchema, websiteSchema, webpageSchema } =
  useConfigSeo();

const { fetch, loading, data } = useCacheFetch<ApiResponse<PageResponse>>();

const {
  fetch: fetchCategory,
  loading: loadingCategory,
  data: dataCategory,
} = useCacheFetch<ApiResponse<PageResponse>>();

await Promise.all([
  fetch("/api/page/home", {
    headers: {
      cache: "true",
    },
  }),
  fetchCategory("/api/categories", {
    headers: {
      cache: "true",
    },
    params: {
      noPaginate: "true",
    },
  }),
]);

buildMeta(data.value?.data as PageResponse);
organizationSchema();
websiteSchema();
webpageSchema(data.value?.data as PageResponse);

///// computed /////

///// functions /////

///// watchers /////
const mods = {
  blur: 5,
  raw: "l-text,i-SALE%2030%25,fs-50,co-FF0000,bg-FFFFFF80,pa-20,l-end",
};

///// lifecycle /////
</script>

<template>
  <div>
    <section>
      <widget-slider :items="Array.from({ length: 10 }).fill('hello')" />
    </section>

    <!-- Discounts Section -->
    <!-- <WidgetSectionsDiscountsSection /> -->

    <!-- New Products Section -->
    <!-- <WidgetSectionsNewProductsSection /> -->

    <!-- <WidgetSectionsImageTextSection
      title="چرا انارستان؟"
      text="انارستان با سال‌ها تجربه در زمینه فروش آنلاین، بهترین محصولات را با کیفیت بالا و قیمت مناسب به شما ارائه می‌دهد. ما به کیفیت و رضایت مشتریان متعهد هستیم."
    /> -->

    <!-- Best Selling Section -->
    <!-- <WidgetSectionsBestSellingSection /> -->

    <!-- Category Products Sections -->
    <!-- <WidgetSectionsCategoryProductsSection
      v-for="category in selectedCategories"
      :key="category.id"
      :category="category"
    /> -->

    <!-- SEO Content Section -->
    <!-- <WidgetSectionsSeoContentSection
      title="درباره انارستان"
      content="انارستان یک فروشگاه آنلاین معتبر است که با ارائه بهترین محصولات و خدمات، رضایت مشتریان را در اولویت قرار داده است. ما با سال‌ها تجربه در زمینه فروش آنلاین، تلاش می‌کنیم تا بهترین تجربه خرید را برای شما فراهم کنیم.

محصولات ما شامل طیف گسترده‌ای از کالاهای مختلف است که با کیفیت بالا و قیمت مناسب ارائه می‌شوند. تیم پشتیبانی ما همیشه آماده پاسخگویی به سوالات و حل مشکلات شماست.

ما به کیفیت محصولات و رضایت مشتریان متعهد هستیم و همواره در تلاشیم تا خدمات بهتری ارائه دهیم. با خرید از انارستان، می‌توانید از اطمینان و اعتماد کامل بهره‌مند شوید."
    /> -->

    <!-- FAQ Section -->
    <!-- <WidgetSectionsFaqSection /> -->

    <!-- Quick Access Section -->
    <!-- <WidgetSectionsQuickAccessSection /> -->
  </div>
</template>

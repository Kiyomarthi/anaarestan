<script setup lang="ts">
import { useConfigSeo } from "~/composables/utils/useConfigSeo";

const { buildMeta, organizationSchema, websiteSchema, webpageSchema } =
  useConfigSeo();

buildMeta();
organizationSchema();
websiteSchema();
webpageSchema();
</script>

<template>
  <div>
    <base-editor />

    <!-- نمایش خروجی HTML -->
    <!-- <div v-html="value" class="border p-2 mt-2" /> -->

    <!-- ----------------------------------------------------------------------------------------------- -->
    <!-- Hero Slider -->
    <!-- <WidgetSectionsHeroSlider /> -->

    <!-- Categories Section -->
    <!-- <WidgetSectionsCategoriesSection /> -->

    <!-- Discounts Section -->
    <!-- <WidgetSectionsDiscountsSection /> -->

    <!-- Banner Grid -->
    <!-- <WidgetSectionsBannerGrid /> -->

    <!-- New Products Section -->
    <!-- <WidgetSectionsNewProductsSection /> -->

    <!-- Image Text Section -->
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

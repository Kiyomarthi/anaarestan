<script setup lang="ts">
///// imports /////
import Category from "~/components/widget/list/category.vue";
import { useBreakpoints } from "~/composables/utils/useBreakpoints";
import { useConfigSeo } from "~/composables/utils/useConfigSeo";
import type {
  ApiResponse,
  MediaBlock,
  PageResponse,
} from "~~/shared/types/api";

///// page meta /////
definePageMeta({
  noMargin: true,
});

///// props/emits /////

///// refs /////

///// composables/stores /////
const { buildMeta, organizationSchema, websiteSchema, webpageSchema } =
  useConfigSeo();

const { lgAndUp } = useBreakpoints();

const { fetch, loading, data } = useCacheFetch<ApiResponse<PageResponse>>();

const {
  fetch: fetchDiscountProduct,
  loading: discountProductLoading,
  data: discountProductData,
} = useCacheFetch<ApiResponse<PageResponse>>();

// TODO: refactor product api for discount
const {
  fetch: fetchCategory,
  loading: loadingCategory,
  data: dataCategory,
} = useCacheFetch<ApiResponse<PageResponse>>();

const {
  fetch: fetchNewProduct,
  loading: newProductLoading,
  data: newProductData,
} = useCacheFetch<ApiResponse<PageResponse>>();

fetchCategory("/api/categories", {
  headers: {
    cache: "true",
  },
  params: {
    noPaginate: "true",
  },
});

fetchDiscountProduct("/api/products", {
  params: {
    stock_status: "available",
    noPaginate: "true",
    limit: "10",
  },
});

fetchNewProduct("/api/products", {
  params: {
    stock_status: "available",
    noPaginate: "true",
    limit: "10",
    sort: "newest",
  },
});

const discountedProducts = computed(() => {
  if (!discountProductData.value?.data) return [];
  return discountProductData.value?.data
    ?.filter?.(
      (p: any) => p.discount_price && Number(p.discount_price) < Number(p.price)
    )
    ?.slice(0, 10);
});

await fetch("/api/page/home", {
  headers: {
    cache: "true",
  },
});

buildMeta(data.value?.data as PageResponse);
organizationSchema();
websiteSchema();
webpageSchema(data.value?.data as PageResponse);

///// computed /////
const endTime = computed(() => {
  const date = new Date();
  date.setHours(date.getHours() + 24);
  return date;
});

const faqs = computed(() =>
  data.value?.data?.faqs?.map((q) => ({
    label: q?.question,
    content: q?.answer,
  }))
);
///// functions /////

const media = computed(() =>
  getBannerAndSlider((data.value?.data?.media_blocks as MediaBlock[]) || [])
);

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
      <widgetSlider :items="media.sliders?.[0]" />
    </section>

    <div class="max-w-(--ui-container) mx-auto">
      <h1 class="text-h1 text-primary mt-6 lg:mt-8 px-4">
        {{ data?.data?.page?.title }}
      </h1>

      <WidgetListProduct
        :items="discountedProducts"
        :loading="discountProductLoading"
        title="تخفیف‌های ویژه"
        subtitle=" فرصت محدود برای خرید با تخفیف"
        class="mt-2"
        moreLink="/products/list"
      >
        <template #header-item>
          <WidgetTimer :end-time="endTime" />
        </template>
      </WidgetListProduct>

      <widgetListCategory
        title="خرید براساس دسته‌بندی"
        :items="dataCategory?.data"
        :loading="loadingCategory"
        class="mt-4 lg:mt-16"
      >
        <template #desktop="{ item }">
          <WidgetCategoryCard
            :name="item.name"
            :slug="item.slug"
            :code="item.code"
            image="/tmp/category.png"
            class="w-fit"
          />
        </template>
        <template #mobile>
          <li
            v-for="(category, index) in dataCategory?.data"
            :key="index"
            role="listitem"
          >
            <WidgetCategoryCard
              :name="category.name"
              :slug="category.slug"
              :code="category.code"
              image="/tmp/category.png"
              class="w-fit mx-auto"
            />
          </li>
        </template>
      </widgetListCategory>

      <!-- New Products Section -->
      <WidgetListProduct
        :items="newProductData?.data"
        :loading="newProductLoading"
        title="محصولات جدید"
        class="mt-10 from-success-100"
        moreLink="/products/list?sort=newest"
      >
        <template #header-item>
          <UButton
            color="primary"
            variant="ghost"
            to="/products/list?sort=newest"
            :ui="{
              base: 'py-1',
            }"
          >
            مشاهده همه
            <template #trailing>
              <UIcon name="i-lucide-arrow-left" />
            </template>
          </UButton>
        </template>
      </WidgetListProduct>

      <WidgetInfo
        title="چرا انارستان؟"
        text="انارستان با سال‌ها تجربه در زمینه فروش آنلاین، بهترین محصولات را با کیفیت بالا و قیمت مناسب به شما ارائه می‌دهد. ما به کیفیت و رضایت مشتریان متعهد هستیم."
        class="mt-6 lg:mt-10 lg:px-6"
      />

      <!-- Best Selling Section -->
      <!-- <WidgetSectionsBestSellingSection /> -->

      <!-- Category Products Sections -->
      <WidgetListCategoriesProduct
        v-for="category in dataCategory?.data"
        :key="category.id"
        :category="category"
      />

      <WidgetListBannerGrid4
        :banners="media.banners"
        :loading="loading"
        class="my-5 px-4"
      />

      <!-- SEO Content Section -->
      <section class="mb-10 lg:mb-14 mt-2">
        <WidgetTextMore
          :content="data?.data?.contents?.[0]?.body"
          class="px-4"
        />
      </section>

      <WidgetListBannerGrid2
        :banners="media.banners?.splice(6, 2)"
        :loading="loading"
        class="mt-5 mb-10 lg:mb-16 px-4"
      />

      <WidgetListService class="px-4 mt-10 lg:mt-14" />

      <section class="mt-10">
        <h3 class="text-h3 text-center mb-2">سوالات متداول</h3>

        <UAccordion
          :items="faqs"
          :ui="{
            label: 'font-bold',
          }"
          class="px-4 lg:px-10 lg:max-w-200 mx-auto"
        >
          <template #content="{ item }">
            <div class="text-container" v-html="item?.content" />
          </template>
        </UAccordion>
      </section>

      <section class="px-4 mt-10 lg:mt-14">
        <h3 class="text-h3 mb-2 lg:mb-4 text-center">دسترسی سریع</h3>
        <UCarousel
          arrows
          drag-free
          :ui="{
            root: 'rounded-2xl w-full',
            item: 'basis-1/2 lg:basis-auto py-1 h-fill',
            prev: 'lg:start-8 disabled:opacity-0 with-transition',
            next: 'lg:end-8 disabled:opacity-0 with-transition',
            viewport: 'px-1',
          }"
          prev-icon="i-lucide-chevron-right"
          next-icon="i-lucide-chevron-left"
          :items="dataCategory?.data"
          v-slot="{ item }"
        >
          <WidgetCategoryCardAction :category="item" />
        </UCarousel>
      </section>
    </div>
  </div>
</template>
`

<script setup lang="ts">
///// imports /////
import { useBreakpoints } from "~/composables/utils/useBreakpoints";
import { useConfigSeo } from "~/composables/utils/useConfigSeo";
import type {
  ApiResponse,
  Category,
  MediaBlock,
  PageResponse,
} from "~~/shared/types/api";

import { toDeep2Length, toDeep3Length } from "~~/shared/utils/array";

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
} = useCacheFetch<ApiResponse<CanvasText[]>>();

const {
  fetch: fetchNewProduct,
  loading: newProductLoading,
  data: newProductData,
} = useCacheFetch<ApiResponse<PageResponse>>();

const {
  fetch: fetchBestProduct,
  loading: bestProductLoading,
  data: bestProductData,
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
    limit: "20",
  },
  headers: {
    cache: "true",
  },
});

fetchNewProduct("/api/products", {
  params: {
    stock_status: "available",
    limit: "20",
    sort: "newest",
  },
  headers: {
    cache: "true",
  },
});

fetchBestProduct("/api/products", {
  params: {
    stock_status: "available",
    limit: "20",
    sort: "best-selling",
  },
  headers: {
    cache: "true",
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

///// functions /////

const media = computed(() =>
  getBannerAndSlider((data.value?.data?.media_blocks as MediaBlock[]) || [])
);

///// watchers /////

///// lifecycle /////
</script>

<template>
  <div>
    <section>
      <widgetSlider :items="media.sliders?.[0]" />
    </section>

    <div class="max-w-(--ui-container) mx-auto px-4">
      <h1 class="text-h1 text-primary mt-6 lg:mt-8">
        {{ data?.data?.page?.title }}
      </h1>

      <WidgetListProduct
        :items="discountedProducts"
        :loading="discountProductLoading"
        title="تخفیف‌های ویژه"
        subtitle=" فرصت محدود برای خرید با تخفیف"
        class="mt-2 -mx-4"
        moreLink="/products/list"
      >
        <template #header-item>
          <WidgetTimer :end-time="endTime" />
        </template>
      </WidgetListProduct>

      <widgetListCategory
        title="خرید براساس دسته‌بندی"
        :items="toDeep2Length(dataCategory?.data as Category[] ?? [])"
        :loading="loadingCategory"
        class="mt-4 lg:mt-8"
      >
        <template #desktop="{ item }">
          <div class="flex flex-col gap-3 items-center justify-center">
            <WidgetCategoryCard
              :name="item?.[0]?.name"
              :slug="item?.[0]?.slug"
              :id="item?.[0]?.id"
              image="/tmp/category.png"
              class="w-fit"
              label-class="h-10"
            />
            <WidgetCategoryCard
              :name="item?.[1]?.name"
              :slug="item?.[1]?.slug"
              :id="item?.[1]?.id"
              image="/tmp/category.png"
              class="w-fit"
              label-class="h-10"
            />
          </div>
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
              :id="category.id"
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
        class="mt-10 from-success-100 -mx-4"
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
        class="mt-6 lg:mt-10 lg:px-3"
      />

      <WidgetListProduct2
        :items="toDeep3Length(bestProductData?.data)"
        :loading="bestProductLoading"
        title="پرفروش‌‌ترین‌ها"
        class="my-10 from-success-100"
        moreLink="/products/list?sort=best-selling"
      >
        <template #header-item>
          <UButton
            color="primary"
            variant="ghost"
            to="/products/list?sort=best-selling"
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
      </WidgetListProduct2>

      <!-- Category Products Sections -->
      <WidgetListCategoriesProduct
        v-for="category in dataCategory?.data"
        :key="category.id"
        :category="category"
        class="-mx-4"
      />

      <WidgetListBannerGrid4
        :banners="media.banners"
        :loading="loading"
        class="my-5"
      />

      <!-- SEO Content Section -->
      <section class="mb-10 lg:mb-14 mt-2">
        <WidgetTextMore
          :loading="loading"
          :content="data?.data?.contents?.[0]?.body"
        />
      </section>

      <WidgetListBannerGrid2
        :banners="media.banners?.splice(6, 2)"
        :loading="loading"
        class="mt-5 mb-10 lg:mb-16"
      />

      <WidgetListService class="mt-10" />

      <WidgetListCategoryAction
        :items="dataCategory?.data"
        :loading="loadingCategory"
        class="mt-10"
      />

      <WidgetListFaq
        :loading="loading"
        :items="data?.data?.faqs"
        class="mt-10"
      />
    </div>
  </div>
</template>
`

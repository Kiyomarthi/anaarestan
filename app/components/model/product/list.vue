<script setup lang="ts">
import { useBreakpoints } from "~/composables/utils/useBreakpoints";
import { useConfigSeo } from "~/composables/utils/useConfigSeo";
import { useViewCounter } from "~/composables/utils/useViewCounter";
import { randomColor } from "~/constants/common";
import type { ProductRes } from "~~/shared/types/api";
import type { ItemType } from "~~/shared/types/common";
import { debounce } from "~~/shared/utils/common";

///// imports /////

///// page meta /////

///// props/emits /////
const props = defineProps<{
  noCategory?: boolean;
}>();

///// refs /////
const route = useRoute();
const mobileFilterModal = ref<boolean>();
const router = useRouter();
const filters = ref({
  rangePrice: [0, 100000000],
  onlyAvailable: false,
});

const filterField = ref<string | null>(null);

const sortItems = [
  {
    label: "جدیدترین",
    key: "newest",
  },
  {
    label: "پرفروش‌ترین",
    key: "best-selling",
  },
  {
    label: "ارزان‌ترین",
    key: "cheapest",
  },

  {
    label: "گران‌ترین",
    key: "most-expensive",
  },
];

const sortModel = ref<ItemType>(
  route.query?.sort
    ? (sortItems?.find((item) => item.key === route.query?.sort) as ItemType)
    : {
        label: "جدیدترین",
        key: "newest",
      }
);

const mobileFilterFields = [
  {
    label: "فیلترها",
    value: "all",
    icon: "i-lucide-filter",
  },
  {
    label: "مرتب سازی",
    value: "sort",
    icon: "i-lucide-list",
  },
];

///// composables/stores /////
const { hidden, scrollY } = useHideScroll(5);

const { buildMeta, organizationSchema, websiteSchema, webpageSchema } =
  useConfigSeo();

const { lgAndUp } = useBreakpoints();

const { fetch, loading, data } = useCacheFetch<ApiResponse<PageResponse>>();

const {
  fetch: fetchCategory,
  loading: categoryLoading,
  data: categoryData,
} = useCacheFetch<ApiResponse<Category>>();

const categoryURL = computed(() => !props.noCategory && route.params?.id);

await fetchCategory(
  `/api/categories${!!categoryURL.value ? `/${route.params?.id}` : ""}`,
  {
    headers: {
      cache: "true",
    },
    params: {
      noPaginate: "true",
      search: route.query?.search,
    },
  }
);

// TODO: check this => 301, ...
// TODO: if code X not exsist if error api
if (categoryData.value?.data?.slug !== route.params?.slug && !props.noCategory)
  await navigateTo(
    `/products/list/${categoryData.value?.data?.id}/${categoryData.value?.data?.slug}`,
    {
      redirectCode: 301,
      replace: true,
    }
  );

const {
  fetch: fetchProduct,
  loading: productLoading,
  data: productData,
} = useCacheFetch<ApiResponse<ProductRes[]>>();

const pageURL = computed(() =>
  !props.noCategory && route.params?.id ? route.params?.id : "list"
);

await fetch(`/api/page/${pageURL.value}`, {
  headers: {
    cache: "true",
  },
});

// TODO: add faqs, breadcrumbs, ... search nuxt seo
buildMeta(data.value?.data as PageResponse);
organizationSchema();
websiteSchema();
webpageSchema(data.value?.data as PageResponse);
///// computed /////
const breadCrumbs = computed(() => {
  return data?.value?.data?.breadcrumbs?.map((item) => {
    return {
      label: item?.title,
      to: item?.target,
    };
  });
});

const productTotalPage = computed(() => productData.value?.meta?.totalPages);

const {
  target: scrollTarget,
  count,
  items,
  load,
} = useViewCounter<ProductRes[]>(
  { current: 1, max: productTotalPage },
  {
    threshold: 0.1,
    rootMargin: "100px",
  },
  fetchProductRes
);

const media = computed(() =>
  getBannerAndSlider((data.value?.data?.media_blocks as MediaBlock[]) || [])
);

const hasFilter = computed(() => {
  const isChangedMinPrice = filters.value?.rangePrice?.[0] != 0;
  const isChangedMaxPrice = filters.value?.rangePrice?.[1] != 100000000;
  const isChangedOnlyAvailable = !!filters.value?.onlyAvailable;

  return !!(isChangedMinPrice || isChangedMaxPrice || isChangedOnlyAvailable);
});

///// functions /////
async function fetchProductRes() {
  await fetchProduct("/api/products", {
    params: {
      limit: "30",
      sort: sortModel.value?.key,
      page: count.value,
      category_id: categoryURL.value ?? "",
      stock_status: filters.value?.onlyAvailable && "available",
      min_price: filters.value?.rangePrice?.[0] ?? 0,
      max_price: filters.value?.rangePrice?.[1] ?? 100000000,
      search: route.query?.search,
    },
  });

  return productData.value;
}
load();

const debouncedFetch = debounce(async () => {
  count.value = 1;
  items.value = [];
  items.value = await fetchProductRes().then((res) => res.data);

  if (lgAndUp.value && scrollY.value > 600) scrollToTop();
}, 400);

const resetFilters = () => {
  filters.value = {
    rangePrice: [0, 100000000],
    onlyAvailable: false,
  };

  sortModel.value = {
    label: "جدیدترین",
    key: "newest",
  };

  mobileFilterModal.value = false;

  if (scrollY.value > 600) scrollToTop();
};

const setFilter = () => {
  mobileFilterModal.value = false;
  if (scrollY.value > 600) scrollToTop();
};

const clearSearch = () => {
  router.push({ path: route.path, query: {} });
};

///// watchers /////

///// lifecycle /////
watch(
  [sortModel, filters],
  () => {
    debouncedFetch();
    router.push({ path: route.path, query: { sort: sortModel.value?.key } });
  },
  { deep: true }
);
watch(
  () => route.query?.search,
  async () => {
    count.value = 1;
    items.value = [];

    fetchCategory(
      `/api/categories${!!categoryURL.value ? `/${route.params?.id}` : ""}`,
      {
        headers: {
          cache: "true",
        },
        params: {
          noPaginate: "true",
          search: route.query?.search,
        },
      }
    );
    items.value = await fetchProductRes().then((res) => res.data);
  }
);


</script>

<template>
  <div>
    <UBreadcrumb
      v-if="breadCrumbs?.length"
      :items="breadCrumbs"
      class="pb-3 pt-3 lg:pt-1"
    />
    <div class="lg:flex gap-4 justify-between items-center mb-3">
      <h1 class="text-h1 w-max text-nowrap whitespace-nowrap">
        {{ data?.data?.page?.title }}
      </h1>
      <div
        v-if="noCategory && route.query?.search"
        class="text-lg flex items-center gap-3 mx-auto lg:mx-0 my-3 flex-1"
      >
        <div class="line-clamp-2">
          جستجو برای
          <span class="font-bold"> "{{ route.query?.search }}" </span>
        </div>
        <div>
          <UButton
            icon="i-lucide-trash"
            label="پاک کردن"
            variant="soft"
            size="xs"
            color="neutral"
            :ui="{
              base: 'flex-col',
            }"
            @click="clearSearch"
          />
        </div>
      </div>
    </div>
    <WidgetListCategory
      :items="
        categoryURL && !noCategory
          ? categoryData?.data?.children
          : categoryData?.data
      "
      :loading="categoryLoading"
    >
      <template #desktop="{ item }">
        <WidgetCategoryCard
          :name="item?.name"
          :slug="item?.slug"
          :id="item?.id"
          image="/tmp/category.png"
          class="w-fit"
          label-class="h-10"
        />
      </template>
    </WidgetListCategory>
    <div class="lg:grid grid-cols-4 mt-2 lg:mt-6 gap-3">
      <aside
        class="col-span-1 sticky bg-default/75 backdrop-blur z-1 lg:z-1 top-0 lg:top-3 border-b -mx-4 lg:mx-0 lg:border border-default lg:rounded-2xl py-3 lg:p-4 h-fit with-transition mb-2 lg:mb-0"
        :class="{
          'translate-y-16.75 lg:translate-y-28': !hidden && scrollY > 520,
        }"
      >
        <template v-if="lgAndUp">
          <div class="flex justify-between items-center mb-5">
            <div class="text-sm lg:text-lg font-bold">فیلترها</div>
            <UTooltip v-if="hasFilter" text="لغو فیلترهای اعمال شده">
              <UButton
                label="حذف فیلترها"
                color="neutral"
                variant="soft"
                size="xs"
                @click="resetFilters"
              />
            </UTooltip>
          </div>
          <WidgetFilterProduct v-model="filters" />
        </template>
        <u-slideover
          v-else
          v-model:open="mobileFilterModal"
          side="bottom"
          :ui="{
            overlay: 'bg-black/35 backdrop-blur-xs',
            header: 'hidden!',
            body: 'relative',
            content: 'rounded-t-[10px]',
          }"
        >
          <div class="px-4 flex gap-2 overflow-auto scroll-hidden w-fit">
            <u-button
              v-for="(filed, index) in mobileFilterFields"
              :key="index"
              :variant="
                (hasFilter && filed.value === 'all') ||
                (sortModel.key !== 'newest' && filed.value === 'sort')
                  ? 'soft'
                  : 'outline'
              "
              :color="
                (hasFilter && filed.value === 'all') ||
                (sortModel.key !== 'newest' && filed.value === 'sort')
                  ? 'primary'
                  : 'neutral'
              "
              :icon="filed.icon"
              :label="
                filed.value === 'sort'
                  ? sortItems?.find?.((item) => item.key === sortModel.key)
                      ?.label
                  : filed.label
              "
              :ui="{
                label: 'text-[12px]',
              }"
              @click="filterField = filed.value"
            />
          </div>
          <template #body>
            <template v-if="filterField === 'all'">
              <div class="text-sm lg:text-lg font-bold mb-5">فیلترها</div>
              <WidgetFilterProduct v-model="filters" />
            </template>
            <WidgetBoxSort
              v-else-if="filterField === 'sort' && !lgAndUp"
              v-model="sortModel"
              :items="sortItems"
            />
            <div class="flex gap-3 items-center justify-stretch my-5">
              <UButton
                label="اعمال فیلتر"
                :loading="productLoading"
                :ui="{
                  base: 'flex-1 h-12.5',
                  label: 'text-center justify-center w-full',
                }"
                @click="setFilter"
              />
              <UButton
                :loading="productLoading"
                label="لغو فیلتر"
                variant="outline"
                :ui="{
                  base: 'flex-1 h-12.5',
                  label: 'text-center justify-center w-full',
                }"
                @click="resetFilters"
              />
            </div>
          </template>
        </u-slideover>
      </aside>
      <div class="col-span-3">
        <WidgetBoxSort
          v-if="lgAndUp"
          v-model="sortModel"
          :items="sortItems"
          class="mb-4"
        />
        <div
          v-if="productLoading && !items?.length"
          class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          <USkeleton
            v-for="i in 20"
            :key="i"
            class="w-full h-62.5 rounded-2xl bg-gray-200"
          />
        </div>
        <div
          v-else-if="items?.length"
          class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          <WidgetProductCard
            v-for="(item, index) in items"
            :key="index"
            :product="item"
            :image-color="randomColor[index % randomColor.length]"
          />
          <template v-if="productLoading">
            <USkeleton
              v-for="i in 20"
              :key="i"
              class="w-full h-62.5 rounded-2xl"
            />
          </template>
          <div
            v-else-if="items?.length"
            ref="scrollTarget"
            class="h-20 w-full flex items-center justify-center py-4"
          />
        </div>
        <div v-else>
          <UEmpty
            title="کالایی با این مشخصات پیدا نکردیم"
            description="پیشنهاد می‌کنیم فیلترها را تغییر دهید"
            icon="i-lucide-search-x"
            :ui="{
              avatar:
                'size-20 lg:size-28 [&_.iconify]:size-10 lg:[&_.iconify]:size-16',
            }"
            :actions="[
              {
                label: 'پاک کردن فیلترها',
                onClick: () => {
                  resetFilters();
                  clearSearch();
                },
                loading: productLoading,
              },
            ]"
          />
        </div>
      </div>
    </div>
    <WidgetListBannerGrid4
      :banners="media.banners"
      :loading="loading"
      class="mb-5 mt-10"
    />

    <!-- SEO Content Section -->
    <section class="mb-10 lg:mb-14 mt-2">
      <WidgetTextMore
        :loading="loading"
        :content="data?.data?.contents?.[0]?.body"
        :max-lines="20"
      />
    </section>

    <WidgetListBannerGrid2
      :banners="media.banners?.slice(6, 8)"
      :loading="loading"
      class="mt-5 mb-10 lg:mb-16"
    />

    <WidgetListService class="mt-10" />

    <WidgetListCategoryAction
      :items="
        categoryURL && !noCategory
          ? categoryData?.data?.children
          : categoryData?.data
      "
      :loading="categoryLoading"
      class="mt-10"
    />

    <WidgetListFaq :loading="loading" :items="data?.data?.faqs" class="mt-10" />
  </div>
</template>

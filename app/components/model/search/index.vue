<script setup lang="ts">
import { useHistoryStore } from "~/stores/useHistory";
type Product = {
  id: number;
  title: string;
  slug: string;
  price: string | number;
  discount_price?: string | number | null;
  image: string;
  code: string;
  stock?: number;
};

type Category = {
  id: number;
  name: string;
  slug: string;
  image?: string | null;
};

type ProductsResponse = {
  success: boolean;
  data: Product[];
  meta?: {
    total: number;
  };
};

type CategoriesResponse = {
  success: boolean;
  data: Category[];
  meta?: {
    total: number;
  };
};

const open = ref(false);
const searchQuery = ref("");
const inputEl = ref(null);
const isAfterOpen = ref<boolean>(false);

const historyStore = useHistoryStore();
const router = useRouter();
const route = useRoute();

const {
  fetch: fetchProducts,
  loading: productsLoading,
  data: productsData,
} = useCacheFetch<ProductsResponse>();

const {
  fetch: fetchCategories,
  loading: categoriesLoading,
  data: categoriesData,
} = useCacheFetch<CategoriesResponse>();

const products = computed(() => productsData.value?.data || []);
const categories = computed(() => categoriesData.value?.data || []);

const hasResults = computed(
  () => products.value.length > 0 || categories.value.length > 0
);
const isLoading = computed(
  () => productsLoading.value || categoriesLoading.value
);

const performSearch = async (query: string) => {
  if (!query || query.trim().length < 2) {
    return;
  }

  const trimmedQuery = query.trim();

  await Promise.all([
    fetchProducts("/api/products", {
      params: {
        search: trimmedQuery,
        limit: "5",
        noPaginate: "false",
      },
      headers: {
        cache: "true",
      },
    }),
    fetchCategories("/api/categories", {
      params: {
        search: trimmedQuery,
        limit: "5",
        noPaginate: "false",
      },
      headers: {
        cache: "true",
      },
    }),
  ]);
};

const {
  fetch: fetchDiscountProduct,
  loading: discountProductLoading,
  data: discountProductData,
} = useCacheFetch<ApiResponse<PageResponse>>();

fetchDiscountProduct("/api/products", {
  params: {
    stock_status: "available",
    limit: "3",
  },
});

const handleSearch = () => {
  const trimmedQuery = searchQuery.value.trim();
  open.value = false;
  historyStore.addSearch(trimmedQuery);
  router.push(`/products/list?search=${trimmedQuery}`);
  inputEl.value?.inputRef?.blur();
};

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

const debouncedSearch = (query: string) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    performSearch(query);
  }, 300);
};

const toCategory = (category: Category) => {
  router.push(`/products/list/${category.id}/${category.slug}`);
  open.value = false;
};

const toProduct = (product: Product) => {
  router.push(`/products/${product.code}/${product.slug}`);
  open.value = false;
};

const searchHistory = (query: string) => {
  searchQuery.value = query;
  open.value = false;
  router.push(`/products/list?search=${query}`);
  inputEl.value?.inputRef?.blur();
};

const clearSearch = () => {
  searchQuery.value = "";
  router.push({ path: route.path, query: {} });
};

watch(searchQuery, (newQuery) => {
  if (newQuery && newQuery.trim().length >= 2) {
    debouncedSearch(newQuery);
  } else {
    // Clear results when query is too short
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    productsData.value = null;
    categoriesData.value = null;
  }
});

onUnmounted(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
});

const debouncedAfterOpen = debounce((isAfter: boolean) => {
  isAfterOpen.value = isAfter;
}, 500);

watch(open, async (isOpen) => {
  if (isOpen) {
    debouncedAfterOpen(true);
  } else debouncedAfterOpen(false);
});

watch(
  () => route.query?.search,
  (val) => {
    searchQuery.value = val as string;
  },
  { immediate: true }
);
</script>

<template>
  <UPopover
    v-model:open="open"
    :ui="{
      content:
        'md:w-(--reka-popper-anchor-width) p-4 max-h-[60dvh] overflow-auto pretty-scroll w-[calc(100dvw-20px)]',
    }"
  >
    <template #anchor>
      <!-- <div class="relative"> -->
      <UInput
        v-model="searchQuery"
        ref="inputEl"
        placeholder="جستجو..."
        icon="i-lucide-search"
        :ui="{
          base: 'h-11 max-w-125 lg:min-w-100 w-full relative pl-12',
        }"
        @click="open = true"
        @keyup.enter="handleSearch"
      >
        <UButton
          v-if="searchQuery?.length"
          icon="i-lucide-x"
          variant="soft"
          :autofocus="false"
          color="gray"
          :ui="{
            base: 'p-1 rounded-full h-fit w-fit absolute z-3 left-2 top-1/2 -translate-y-1/2',
          }"
          aria-label="پاک کردن جستجو"
          @click="clearSearch"
        />
      </UInput>
      <!-- </div> -->
    </template>

    <template #content>
      <div v-if="isLoading" class="flex items-center justify-center py-8">
        <UIcon
          name="i-lucide-loader-2"
          class="w-6 h-6 animate-spin text-gray-400"
        />
      </div>

      <div
        v-else-if="!hasResults && searchQuery?.trim?.().length >= 2"
        class="py-8 text-center text-gray-500"
      >
        نتیجه‌ای یافت نشد
      </div>

      <div v-else-if="hasResults" class="space-y-4">
        <!-- Categories Section -->
        <div v-if="categories.length > 0">
          <h4 class="text-sm font-semibold text-gray-700 mb-2">دسته‌بندی‌ها</h4>
          <div class="space-y-1">
            <WidgetCategoryCardSearch
              v-for="category in categories"
              :key="category.id"
              :category="category"
              @click="() => toCategory(category)"
            />
          </div>
        </div>

        <!-- Products Section -->
        <div v-if="products.length > 0">
          <h4 class="text-sm font-semibold text-gray-700 mb-2">محصولات</h4>
          <div class="space-y-1">
            <WidgetProductCardSearch
              v-for="product in products"
              :key="product.id"
              :product="product"
              @click="() => toProduct(product)"
            />
          </div>
        </div>
      </div>

      <div
        v-else-if="!searchQuery?.trim() && historyStore.searches?.length > 0"
        class="space-y-3"
      >
        <div>
          <div class="pb-2">
            <div v-if="discountProductLoading">
              <BaseLoader variant="spinner" />
            </div>
            <div v-else-if="discountProductData?.data?.length">
              <h4 class="text-sm font-semibold text-gray-700 mb-2">
                جدیدترین محصولات
              </h4>
              <WidgetProductCardSearch
                v-for="product in discountProductData?.data"
                :key="product.id"
                :product="product"
                @click="() => toProduct(product)"
              />
            </div>
          </div>
          <div
            class="flex items-center gap-3 justify-between mb-3 border-t border-default pt-2"
          >
            <h4 class="text-sm font-semibold text-gray-700">جستجوهای اخیر</h4>
            <UTooltip text="پاک کردن جستجوهای اخیر" :delay-duration="0">
              <button
                icon="i-lucide-trash"
                variant="soft"
                class="p-2 bg-neutral-100 hover:bg-neutral-200 inline-flex rounded-lg"
                color="neutral"
                :autofocus="false"
                watch-focus="false"
                type="button"
                :disabled="!isAfterOpen"
                aria-label="پاک کردن جستجوهای اخیر"
                @click="historyStore.deleteAllSearch()"
              >
                <UIcon name="i-lucide-trash" />
              </button>
            </UTooltip>
          </div>
          <div class="px-5 md:px-10">
            <UCarousel
              v-slot="{ item }"
              arrows
              tabindex="-1"
              :watch-focus="false"
              :prev="{ variant: 'outline', icon: 'i-lucide-chevron-right' }"
              :next="{ variant: 'outline', icon: 'i-lucide-chevron-left' }"
              :items="historyStore.searches"
              containScroll="keepSnaps"
              :ui="{
                item: 'basis-auto',
                prev: '-start-8 md:-start-10 focus:outline-none focus:ring-0',
                next: '-end-8 md:-end-10 focus:outline-none focus:ring-0',
                container: 'ms-0',
                root: '',
              }"
              @mousedown.prevent
              @mousedown.capture.prevent
            >
              <UButton
                variant="outline"
                color="default"
                :autofocus="false"
                class="cursor-pointer w-max p-2 border border-default rounded-2xl text-center hover:bg-gray-200"
                :to="`/products/list?search=${item}`"
                @click="() => searchHistory(item)"
              >
                {{ item }}
              </UButton>
            </UCarousel>
          </div>
        </div>
      </div>

      <div v-else class="text-gray-400">
        <div v-if="discountProductLoading">
          <BaseLoader variant="spinner" />
        </div>
        <div v-else-if="discountProductData?.data?.length">
          <h4 class="text-sm font-semibold text-gray-700 mb-2">
            جدیدترین محصولات
          </h4>
          <WidgetProductCardSearch
            v-for="product in discountProductData?.data"
            :key="product.id"
            :product="product"
            @click="() => toProduct(product)"
          />
        </div>
        <div class="text-center border-t border-default pt-2">
          برای جستجو حداقل 2 کاراکتر وارد کنید
        </div>
      </div>
    </template>
  </UPopover>
</template>

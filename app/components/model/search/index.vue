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

const historyStore = useHistoryStore();
const router = useRouter();

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

const handleSearch = () => {
  const trimmedQuery = searchQuery.value.trim();
  historyStore.addSearch(trimmedQuery);

  router.push(`/products?search=${trimmedQuery}`);
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

watch(open, (isOpen) => {
  if (!isOpen) {
    // Clear search when popover closes
    searchQuery.value = "";
  }
});
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
      <UInput
        v-model="searchQuery"
        placeholder="جستجو در محصولات و دسته‌بندی‌ها..."
        icon="i-lucide-search"
        :ui="{
          base: 'h-11 max-w-150',
        }"
        @click="open = true"
        @keyup.enter="handleSearch"
      />
    </template>

    <template #content>
      <div v-if="isLoading" class="flex items-center justify-center py-8">
        <UIcon
          name="i-lucide-loader-2"
          class="w-6 h-6 animate-spin text-gray-400"
        />
      </div>

      <div
        v-else-if="!hasResults && searchQuery.trim().length >= 2"
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
            />
          </div>
        </div>
      </div>

      <div
        v-else-if="!searchQuery?.trim() && historyStore.searches?.length > 0"
      >
        <div>
          <h4 class="text-sm font-semibold text-gray-700 mb-2">
            جستجوهای اخیر
          </h4>
          <div class="px-5 md:px-10">
            <UCarousel
              v-slot="{ item }"
              arrows
              tabindex="-1"
              :watch-focus="false"
              :prev="{ variant: 'outline', icon: 'i-lucide-chevron-right' }"
              :next="{ variant: 'outline', icon: 'i-lucide-chevron-left' }"
              :items="historyStore.searches"
              :ui="{
                item: 'basis-auto px-px',
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
                class="cursor-pointer focus:outline-none focus:ring-0 w-max p-2 border border-default rounded-2xl text-center hover:bg-gray-200"
                :to="`/products?search=${item}`"
              >
                {{ item }}
              </UButton>
            </UCarousel>
          </div>
        </div>
      </div>

      <div v-else class="py-8 text-center text-gray-400">
        برای جستجو حداقل 2 کاراکتر وارد کنید
      </div>
    </template>
  </UPopover>
</template>

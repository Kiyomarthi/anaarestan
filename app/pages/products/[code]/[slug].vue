<script setup lang="ts">
import { useBreakpoints } from "~/composables/utils/useBreakpoints";
import type { Variant } from "~~/shared/utils/variant";
import { useCartStore } from "~/stores/cart";

///// imports /////

///// page meta /////
definePageMeta({
  noBottomNavigation: true,
});

///// props/emits /////

///// refs /////
const router = useRouter();
const route = useRoute();
const selectedVariant = ref<Variant | null>(null);
const selectedVariantId = ref<number | null>(null);
const quantity = ref(1);
const showCartModal = ref(false);

///// composables/stores /////
const { fetch, loading, data } = useCacheFetch<ApiResponse<any>>();
const { lgAndUp } = useBreakpoints();
const cartStore = useCartStore();
const userStore = useUserStore();
const { hidden, scrollY } = useHideScroll(5);

await fetch(`/api/products/${route?.params?.code}`, {
  headers: {
    cache: "true",
  },
});

// Initialize cart when user is logged in
if (userStore.isLoggedIn) {
  await cartStore.initializeCart();
}

// TODO: if code X not exsist if error api
if (data.value?.data?.slug !== route.params?.slug)
  await navigateTo(
    `/products/${data.value?.data?.code}/${data.value?.data?.slug}`,
    {
      redirectCode: 301,
      replace: true,
    },
  );

///// computed /////
const breadCrumbs = computed(() => {
  const crumbs = [
    {
      id: 47,
      page_id: 7,
      label: "فروشگاه انارستان",
      to: "/",
      position: 1,
      is_active: 1,
      created_at: "2026-01-16T08:55:40.000Z",
      updated_at: "2026-01-16T08:55:40.000Z",
    },
  ];

  if (data.value?.data?.breadcrumbs) {
    data.value.data.breadcrumbs.forEach((crumb: any, index: number) => {
      crumbs.push({
        id: 48 + index,
        page_id: 7,
        label: crumb.title,
        to: `/categories/${data.value?.data?.code}/${crumb.slug}`,
        position: index + 2,
        is_active: 1,
        created_at: "2026-01-16T08:55:40.000Z",
        updated_at: "2026-01-16T08:55:40.000Z",
      });
    });
  }

  return crumbs;
});

const currentPrice = computed(() => {
  if (selectedVariant.value) {
    return selectedVariant.value.discount_price || selectedVariant.value.price;
  }
  return data.value?.data?.discount_price || data.value?.data?.price || "0";
});

const currentStock = computed(() => {
  if (selectedVariant.value) {
    return selectedVariant.value.stock;
  }
  return data.value?.data?.stock || 0;
});

const maxQuantity = computed(() => {
  return currentStock.value;
});

///// functions /////

const handleVariantChange = (variant: Variant | null) => {
  selectedVariant.value = variant;
  if (variant) {
    selectedVariantId.value = variant.id;
    // Reset quantity if exceeds stock
    if (quantity.value > variant.stock) {
      quantity.value = Math.min(1, variant.stock);
    }
  }
};

const openCartModal = () => {
  // Allow opening cart modal even without variant selection
  // The cart model will use product price/stock if no variant selected
  showCartModal.value = true;
};

///// watchers /////
watch(
  () => data.value?.data?.main_variant_id,
  (mainId) => {
    if (mainId && data.value?.data?.variant_attribute) {
      const variant = data.value.data.variant_attribute.find(
        (v: Variant) => v.id === mainId,
      );
      if (variant) {
        selectedVariant.value = variant;
        selectedVariantId.value = variant.id;
      }
    }
  },
  { immediate: true },
);

///// lifecycle /////
onMounted(() => {
  // Sync cart when user logs in
  if (userStore.isLoggedIn) {
    cartStore.syncCartWithUser();
  }
});
</script>

<template>
  <div>
    <UBreadcrumb
      v-if="breadCrumbs?.length"
      :items="breadCrumbs"
      class="pb-3 pt-3 lg:pt-1"
    />

    <div class="grid grid-cols-7 lg:mt-5 gap-4">
      <!-- Main Content -->
      <!-- Product Images and Details -->
      <div class="col-span-5 gap-4 lg:gap-6">
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-3">
          <!-- Images -->
          <div class="col-span-2 -mx-4 lg:mx-0">
            <BaseCursorTooltip v-if="lgAndUp" class="sticky top-3">
              <WidgetSliderProduct
                :items="data?.data?.gallery || []"
                class="max-h-100 lg:max-h-none"
              />
              <template #content>
                <span> برای مشاهده کلیک کنید </span>
              </template>
            </BaseCursorTooltip>
            <WidgetSliderProduct
              v-else
              no-timeline
              :items="data?.data?.gallery || []"
              class="max-h-100 lg:max-h-none"
            />
          </div>

          <!-- Product Details -->
          <div class="col-span-3 space-y-4">
            <div class="">
              <WidgetProductDetails
                :title="data?.data?.title"
                :price="currentPrice"
                :discount-price="
                  selectedVariant?.discount_price ||
                  data?.data?.discount_price ||
                  null
                "
                :attributes="data?.data?.products_attribute || []"
                :rating="data?.data?.avg_rating"
                :rating-count="data?.data?.rating_count"
                :comments-count="data?.data?.comments_count"
                :stock="currentStock"
                :product-id="data?.data?.id"
                :is-favorite="data?.data?.is_favorite"
              />
            </div>

            <!-- Variant Selector -->
            <div
              v-if="data?.data?.variant_attribute?.length > 0"
              class="border-t border-gray-200 pt-4"
            >
              <WidgetProductVariantSelector
                :variants="data?.data?.variant_attribute"
                :selected-variant-id="selectedVariantId"
                :main-variant-id="data?.data?.main_variant_id"
                @variant-change="handleVariantChange"
                @update:selected-variant-id="selectedVariantId = $event"
              />
            </div>
          </div>
        </div>

        <!-- Product Description -->
        <div
          v-if="data?.data?.description"
          class="border-t border-gray-200 pt-6"
        >
          <WidgetProductDescription
            :description="data?.data?.description"
            :short-description="data?.data?.short_description"
          />
        </div>

        <!-- Product Attributes -->
        <div
          v-if="data?.data?.products_attribute?.length > 0"
          class="border-t border-gray-200 pt-6"
        >
          <WidgetProductAttributes
            :attributes="data?.data?.products_attribute"
          />
        </div>

        <!-- Comments -->
        <div v-if="data?.data?.id" class="border-t border-gray-200 pt-6">
          <WidgetProductComments
            :product-id="data?.data?.id"
            :comments-count="data?.data?.comments_count"
          />
        </div>
      </div>

      <!-- Cart Sidebar (Desktop) -->
      <div v-if="lgAndUp" class="col-span-2">
        <ModelProductCart
          v-model:open="showCartModal"
          :product-id="data?.data?.id"
          :product-code="data?.data?.code"
          :selected-variant="selectedVariant"
          :quantity="quantity"
          :product-price="currentPrice"
          :product-stock="currentStock"
          class="sticky top-3 with-transition"
          :class="{
            'translate-y-16.75 lg:translate-y-28': !hidden && scrollY > 130,
          }"
          @close="showCartModal = false"
        />
      </div>
    </div>

    <!-- Similar Products -->
    <div v-if="data?.data?.category?.id" class="border-t border-gray-200 pt-6">
      <WidgetProductSimilarProducts
        :category-id="data?.data?.category?.id"
        :product-id="data?.data?.id"
        :limit="8"
      />
    </div>

    <!-- Cart Modal (Mobile) -->
    <ModelProductCart
      v-if="!lgAndUp"
      v-model:open="showCartModal"
      :product-id="data?.data?.id"
      :product-code="data?.data?.code"
      :selected-variant="selectedVariant"
      :quantity="quantity"
      :product-price="currentPrice"
      :product-stock="currentStock"
      @close="showCartModal = false"
    />
  </div>
</template>

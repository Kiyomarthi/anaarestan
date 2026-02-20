<script setup lang="ts">
import { useBreakpoints } from "~/composables/utils/useBreakpoints";
import type { Variant } from "~~/shared/utils/variant";
import { useCartStore } from "~/stores/cart";
import { useConfigSeo } from "~/composables/utils/useConfigSeo";

///// imports /////

///// page meta /////
definePageMeta({
  hideBottomNavigationByScroll: true,
  noMargin: true,
  navHideTopScrollMobile: 400,
});

///// props/emits /////

///// refs /////
const router = useRouter();
const route = useRoute();
const selectedVariant = ref<Variant | null>(null);
const selectedVariantId = ref<number | null>(null);
const quantity = ref(0);
const showCartModal = ref(false);

///// composables/stores /////
const { fetch, loading, data } = useCacheFetch<ApiResponse<any>>();
const { lgAndUp } = useBreakpoints();
const cartStore = useCartStore();
const userStore = useUserStore();
const { hidden, scrollY } = useHideScroll(5);
const { buildMeta, organizationSchema, websiteSchema, webpageSchema } =
  useConfigSeo();

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
      label: "انارستان",
      to: "/",
      position: 1,
      is_active: 1,
      created_at: "2026-01-16T08:55:40.000Z",
      updated_at: "2026-01-16T08:55:40.000Z",
    },
  ];

  if (data.value?.data?.breadcrumbs) {
    data.value.data.breadcrumbs.forEach((crumb: any, index: number) => {
      return crumbs.push({
        id: 48 + index,
        page_id: 7,
        label: crumb.title,
        to: `/categories/${data.value?.data?.code}/${crumb.slug}`,
        position: index + 2,
        is_active: 1,
        created_at: "",
        updated_at: "",
      });
    });
  }

  return crumbs;
});

const currentOriginalPrice = computed(() => {
  if (selectedVariant.value) {
    return selectedVariant.value.price;
  }
  return data.value?.data?.price || "0";
});

const seoMeta = computed(() => {
  return {
    page: {
      seo_title: data.value?.data?.title,
      seo_description: data.value?.data?.short_description,
      seo_index: true,
      seo_image: data.value?.data?.gallery?.[0]?.url,
      seo_canonical: `/products/${data?.value?.data?.code}/${data?.value?.data?.slug}`,
    },
  };
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

const isPageLoading = computed(() => loading.value && !data.value?.data);

///// functions /////

const handleVariantChange = (variant: Variant | null) => {
  selectedVariant.value = variant;
  if (variant) {
    selectedVariantId.value = variant.id;
    quantity.value = cartStore.getCartItem(
      selectedVariantId.value as number,
      data.value?.data?.id,
    )?.quantity;

    // Reset quantity if exceeds stock
    // if (quantity.value > variant.stock) {
    //   quantity.value = Math.min(1, variant.stock);
    // }
  }
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
onMounted(async () => {
  // Sync cart when user logs in
  if (userStore.isLoggedIn) {
    cartStore.syncCartWithUser();
  }

  watch(
    () => cartStore.cart?.items,
    (val, old) => {
      if (!old?.length)
        quantity.value =
          cartStore.cart?.items?.find(
            (item) =>
              item?.product_variant_id == selectedVariantId.value &&
              item?.product_id == data.value?.data?.id,
          )?.quantity ?? 0;
    },
  );
});

buildMeta(seoMeta.value as unknown as PageResponse);
organizationSchema();
websiteSchema();
webpageSchema(seoMeta.value as unknown as PageResponse);
</script>

<template>
  <div class="max-w-(--ui-container) mx-auto lg:px-4 lg:pt-0">
    <WidgetSkeletonLoaderProductSingle v-if="isPageLoading" />

    <template v-else>
      <div class="fixed top-17 left-0 lg:block lg:static">
        <UBreadcrumb
          v-if="breadCrumbs?.length"
          :items="breadCrumbs"
          class="pt-3 lg:pt-1 px-4"
        />
        <WidgetSliderProduct
          v-if="!lgAndUp"
          no-timeline
          :items="data?.data?.gallery || []"
          class="max-h-100 lg:max-h-none mt-3"
        />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-7 lg:mt-5 lg:gap-4">
        <!-- Main Content -->
        <!-- Product Images and Details -->
        <div class="col-span-5 gap-4 lg:gap-6">
          <div class="grid grid-cols-1 lg:grid-cols-5 gap-y-3 lg:gap-3">
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
            </div>

            <!-- Product Details -->
            <div
              class="col-span-3 space-y-4 mt-82.5 lg:mt-0 bg-white px-4 lg:px-0 pt-3 lg:pt-0 rounded-t-lg border-t-4 border-primary z-10 lg:rounded-none lg:border-0"
            >
              <div>
                <WidgetProductDetails
                  :title="data?.data?.title"
                  :discount-price="
                    selectedVariant?.discount_price ||
                    data?.data?.discount_price ||
                    null
                  "
                  :attributes="data?.data?.products_attribute || []"
                  :rating="data?.data?.avg_rating"
                  :rating-count="data?.data?.rating_count"
                  :comments-count="data?.data?.comments_count"
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
              <!-- Key Attributes -->
              <div
                v-if="data?.data?.products_attribute?.length > 0"
                class="grid grid-cols-2 lg:grid-cols-3 gap-3 py-4 border-t border-gray-200"
              >
                <div
                  v-for="attr in data?.data?.products_attribute?.slice(0, 6) ||
                  []"
                  :key="attr.id"
                  class="flex flex-col bg-neutral-200 rounded-md p-2"
                >
                  <span class="text-xs text-gray-500">{{ attr.name }}</span>
                  <span class="text-sm font-medium text-gray-900">
                    {{ attr.value }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="px-4 bg-white z-10 relative">
            <!-- Product Description -->
            <div
              v-if="data?.data?.description"
              class="border-t border-gray-200 pt-6 lg:mt-3"
            >
              <h2 class="text-xl font-bold text-gray-900">معرفی</h2>
              <WidgetTextMore
                :loading="loading"
                :content="data?.data?.description"
                :max-lines="5"
              />
            </div>

            <!-- Product Attributes -->
            <div
              v-if="data?.data?.products_attribute?.length > 0"
              class="border-t border-gray-200 mt-6 py-6"
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
        </div>

        <!-- Cart Sidebar (Desktop) -->
        <div v-if="lgAndUp" class="col-span-2">
          <ModelProductCart
            v-model:quantity="quantity"
            :product-id="data?.data?.id"
            :product-code="data?.data?.code"
            :selected-variant="selectedVariant"
            :product-price="currentOriginalPrice"
            :stock="currentStock"
            :product-stock="currentStock"
            class="sticky top-3 with-transition"
            :class="{
              'translate-y-16.75 lg:translate-y-28': !hidden && scrollY > 130,
            }"
            :discount-price="
              selectedVariant?.discount_price ||
              data?.data?.discount_price ||
              null
            "
            @close="showCartModal = false"
          />
        </div>
      </div>
      <!-- Similar Products -->
      <div
        v-if="data?.data?.category?.id"
        class="border-t mt-6 border-gray-200 pt-6 px-4 bg-white z-10 relative lg:block"
      >
        <WidgetProductSimilarProducts
          :category-id="data?.data?.category?.id"
          :product-id="data?.data?.id"
          :limit="8"
        />
      </div>

      <!-- Cart Modal (Mobile) -->
      <WidgetGlass
        v-if="!lgAndUp"
        :ui="{
          base: 'p-0',
          container: `
          fixed bottom-22.5 left-4 right-4 z-100 with-transition ${hidden ? 'translate-y-18.75' : ''}`,
        }"
      >
        <ModelProductCart
          v-model:quantity="quantity"
          :product-id="data?.data?.id"
          :product-code="data?.data?.code"
          :selected-variant="selectedVariant"
          :stock="currentStock"
          :product-price="currentOriginalPrice"
          :product-stock="currentStock"
          :discount-price="
            selectedVariant?.discount_price ||
            data?.data?.discount_price ||
            null
          "
          @close="showCartModal = false"
        />
      </WidgetGlass>
    </template>
  </div>
</template>

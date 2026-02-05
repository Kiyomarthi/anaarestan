<script setup lang="ts">
///// imports /////

///// props/emits /////
const props = defineProps<{
  categoryId?: number;
  productId?: number;
  limit?: number;
}>();

///// refs /////
const products = ref<any[]>([]);
const loading = ref(false);

///// composables/stores /////
const { fetch, data, loading: fetchLoading } = useCacheFetch<{
  success: boolean;
  data: any[];
  meta?: any;
}>();

///// computed /////
const similarProducts = computed(() => {
  if (!data.value?.data) return [];
  // Filter out current product if productId is provided
  if (props.productId) {
    return data.value.data.filter((p: any) => p.id !== props.productId);
  }
  return data.value.data;
});

///// functions /////
const loadSimilarProducts = async () => {
  if (!props.categoryId) return;

  loading.value = true;
  try {
    await fetch("/api/products", {
      headers: {
        cache: "true",
      },
      params: {
        category_id: props.categoryId.toString(),
        limit: ((props.limit || 8) + 1).toString(), // +1 to account for filtering current product
      },
    });
  } catch (error) {
    console.error("Error loading similar products:", error);
  } finally {
    loading.value = false;
  }
};

///// watchers /////
watch(
  () => props.categoryId,
  () => {
    loadSimilarProducts();
  },
  { immediate: true },
);

///// lifecycle /////
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-xl font-bold text-gray-900">محصولات مشابه</h2>
    <div
      v-if="loading || fetchLoading"
      class="flex justify-center py-8"
    >
      <BaseLoader variant="spinner" />
    </div>
    <div
      v-else-if="similarProducts.length === 0"
      class="text-center py-8 text-gray-500"
    >
      محصول مشابهی یافت نشد
    </div>
    <div
      v-else
      class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      <WidgetProductCard
        v-for="product in similarProducts"
        :key="product.id"
        :product="product"
      />
    </div>
  </div>
</template>


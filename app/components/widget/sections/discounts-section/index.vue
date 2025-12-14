<script setup lang="ts">
const router = useRouter();

// Calculate end time (24 hours from now)
const endTime = computed(() => {
  const date = new Date();
  date.setHours(date.getHours() + 24);
  return date;
});

const { data, pending } = useApiFetch<{
  success: boolean;
  data: any[];
}>("/api/products", {
  query: {
    stock_status: "available",
    noPaginate: true,
    limit: 20,
  },
});

const discountedProducts = computed(() => {
  if (!data.value?.data) return [];
  return data.value.data
    .filter((p: any) => p.discount_price && Number(p.discount_price) < Number(p.price))
    .slice(0, 10);
});

function handleProductClick(product: any) {
  router.push(`/product/${product.slug}`);
}
</script>

<template>
  <section
    v-if="!pending && discountedProducts.length > 0"
    class="mb-12 bg-gradient-to-l from-primary-50 to-white py-8"
  >
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-2xl font-bold mb-2">تخفیف‌های ویژه</h2>
          <p class="text-gray-600">فرصت محدود برای خرید با تخفیف</p>
        </div>
        <WidgetTimer :end-time="endTime" />
      </div>

      <div v-if="pending" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin text-4xl text-primary-500" />
      </div>

      <div v-else class="overflow-x-auto">
        <div class="flex gap-4 pb-4" style="scroll-snap-type: x mandatory;">
          <div
            v-for="(product, index) in discountedProducts"
            :key="product.id"
            class="flex-shrink-0 w-[200px] sm:w-[250px]"
            style="scroll-snap-align: start;"
          >
            <WidgetProductCard
              :product="product"
              @click="handleProductClick"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>


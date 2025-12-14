<script setup lang="ts">
const router = useRouter();

const { data, pending } = useApiFetch<{
  success: boolean;
  data: any[];
}>("/api/products", {
  query: {
    sort: "newest",
    stock_status: "available",
    limit: 15,
  },
});

function handleProductClick(product: any) {
  router.push(`/product/${product.slug}`);
}
</script>

<template>
  <section v-if="!pending && data?.data && data.data.length > 0" class="mb-12">
    <div class="container mx-auto px-4">
      <h2 class="text-2xl font-bold mb-6">محصولات جدید</h2>

      <div v-if="pending" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin text-4xl text-primary-500" />
      </div>

      <div v-else class="overflow-x-auto">
        <div class="flex gap-4 pb-4" style="scroll-snap-type: x mandatory;">
          <div
            v-for="product in data.data"
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


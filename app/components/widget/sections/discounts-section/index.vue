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
    .filter(
      (p: any) => p.discount_price && Number(p.discount_price) < Number(p.price)
    )
    .slice(0, 10);
});
</script>

<template>
  <section
    v-if="!pending && discountedProducts.length > 0"
    class="bg-linear-to-l from-primary-50 to-white py-6"
  >
    <div class="px-4">
      <div
        class="flex flex-col lg:flex-row items-center justify-between mb-6 px-4"
      >
        <div class="mb-3 lg:mb-0 text-center lg:text-start">
          <h3 class="text-h3 mb-1">تخفیف‌های ویژه</h3>
          <p class="text-gray-600">فرصت محدود برای خرید با تخفیف</p>
        </div>
        <WidgetTimer :end-time="endTime" />
      </div>

      <div v-if="pending" class="flex justify-center py-12">
        <UIcon
          name="i-heroicons-arrow-path"
          class="animate-spin text-4xl text-primary-500"
        />
      </div>

      <div v-else class="overflow-x-hidden">
        <div class="flex gap-4 pb-4">
          <UCarousel
            drag-fre
            :ui="{
              root: 'bg-white p-4 rounded-2xl w-full',
              item: 'basis-1/2 lg:basis-auto py-1',
            }"
            :items="discountedProducts"
            v-slot="{ item }"
          >
            <WidgetProductCard :product="item" />
          </UCarousel>
        </div>
      </div>
    </div>
  </section>
</template>

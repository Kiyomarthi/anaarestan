<script setup lang="ts">
defineProps<{
  loading?: boolean;
  items: unknown[];
}>();

const router = useRouter();

// Calculate end time (24 hours from now)
const endTime = computed(() => {
  const date = new Date();
  date.setHours(date.getHours() + 24);
  return date;
});
</script>

<template>
  <div v-if="loading">
    <UCarousel
      drag-fre
      :ui="{
        root: 'bg-white p-4 rounded-2xl w-full',
        item: 'basis-1/2 lg:basis-auto py-1',
      }"
      :items="10"
    >
      <USkeleton class="w-full lg:w-50 h-62.5 rounded-2xl" />
    </UCarousel>
  </div>
  <section
    v-else-if="items.length > 0"
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

      <div class="overflow-x-hidden">
        <div class="flex gap-4 pb-4">
          <UCarousel
            drag-fre
            :ui="{
              root: 'bg-white p-4 rounded-2xl w-full',
              item: 'basis-1/2 lg:basis-auto py-1',
            }"
            :items="items"
            v-slot="{ item }"
          >
            <WidgetProductCard :product="item" />
          </UCarousel>
        </div>
      </div>
    </div>
  </section>
</template>

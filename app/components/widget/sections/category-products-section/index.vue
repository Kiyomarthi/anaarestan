<script setup lang="ts">
const props = defineProps<{
  category: {
    id: number;
    name: string;
    slug: string;
  };
}>();

const router = useRouter();

const { data, pending } = useApiFetch<{
  success: boolean;
  data: any[];
}>("/api/products", {
  query: computed(() => ({
    category_id: props.category.id,
    stock_status: "available",
    limit: 15,
  })),
});

function handleProductClick(product: any) {
  router.push(`/product/${product.slug}`);
}

function handleViewAll() {
  router.push(`/category/${props.category.slug}`);
}
</script>

<template>
  <section v-if="!pending && data?.data && data.data.length > 0" class="mb-12">
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold">{{ category.name }}</h2>
        <UButton
          color="primary"
          variant="ghost"
          @click="handleViewAll"
        >
          مشاهده همه
          <template #trailing>
            <UIcon name="i-heroicons-arrow-left" />
          </template>
        </UButton>
      </div>

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


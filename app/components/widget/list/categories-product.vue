<script setup lang="ts">
const props = defineProps<{
  category: {
    id: number;
    name: string;
    slug: string;
    code: string;
  };
}>();

const router = useRouter();

// const { data, pending } = useApiFetch<{
//   success: boolean;
//   data: any[];
// }>("/api/products", {
//   query: computed(() => ({
//     category_id: props.category.id,
//     stock_status: "available",
//     limit: 15,
//   })),
// });

const { fetch, loading, data } = useCacheFetch<ApiResponse<PageResponse>>();

fetch("/api/products", {
  params: {
    category_id: String(props.category.id),
    stock_status: "available",
    limit: "15",
  },
});

function handleProductClick(product: any) {
  router.push(`/product/${product.slug}`);
}

function handleViewAll() {
  router.push(`/category/${props.category.slug}`);
}
</script>

<template>
  <!-- <section v-if="!pending && data?.data && data.data.length > 0" class="mb-12">
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold">{{ category.name }}</h2>
        <UButton
          color="primary"
          variant="ghost"
          :to="`/products/${category.code}/${category.slug}`"
        >
          مشاهده همه
          <template #trailing>
            <UIcon name="i-heroicons-arrow-left" />
          </template>
        </UButton>
      </div>

      <div class="overflow-x-auto">
        <div class="flex gap-4 pb-4" style="scroll-snap-type: x mandatory">
          <div
            v-for="product in data.data"
            :key="product.id"
            class="flex-shrink-0 w-[200px] sm:w-[250px]"
            style="scroll-snap-align: start"
          >
            <WidgetProductCard :product="product" @click="handleProductClick" />
          </div>
        </div>
      </div>
    </div>
  </section> -->
  <WidgetListProduct
    :title="category?.name"
    :items="data?.data"
    :loading="loading"
    :moreLink="`/products/${category.code}/${category.slug}`"
  >
    <template #header-item>
      <UButton
        color="primary"
        variant="ghost"
        :to="`/products/${category.code}/${category.slug}`"
        :ui="{
          base: 'py-1',
        }"
      >
        مشاهده همه
        <template #trailing>
          <UIcon name="i-heroicons-arrow-left" />
        </template>
      </UButton>
    </template>
  </WidgetListProduct>
</template>

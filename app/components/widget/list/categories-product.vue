<script setup lang="ts">
const props = defineProps<{
  category: {
    id: number;
    name: string;
    slug: string;
    code: string;
  };
}>();

const { fetch, loading, data } = useCacheFetch<ApiResponse<PageResponse>>();

fetch("/api/products", {
  params: {
    category_id: String(props.category.id),
    stock_status: "available",
    limit: "15",
  },
});
</script>

<template>
  <WidgetListProduct
    :title="category?.name"
    :items="data?.data"
    :loading="loading"
    :moreLink="`/products/list/${category.code}/${category.slug}`"
  >
    <template #header-item>
      <UButton
        color="primary"
        variant="ghost"
        :to="`/products/list/${category.code}/${category.slug}`"
        :ui="{
          base: 'py-1',
        }"
      >
        مشاهده همه
        <template #trailing>
          <UIcon name="i-lucide-arrow-left" />
        </template>
      </UButton>
    </template>
  </WidgetListProduct>
</template>

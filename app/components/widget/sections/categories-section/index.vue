<script setup lang="ts">
const { data, pending } = useApiFetch<{
  success: boolean;
  data: any[];
}>("/api/categories", {
  query: { noPaginate: true },
});

const router = useRouter();

function handleCategoryClick(category: any) {
  router.push(`/category/${category.slug}`);
}
</script>

<template>
  <section v-if="!pending && data?.data && data.data.length > 0" class="mb-12">
    <div class="container mx-auto px-4">
      <h2 class="text-2xl font-bold mb-6">دسته‌بندی‌ها</h2>
      <div
        v-if="pending"
        class="flex justify-center py-12"
      >
        <UIcon name="i-heroicons-arrow-path" class="animate-spin text-4xl text-primary-500" />
      </div>
      <div
        v-else
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4"
      >
        <WidgetCategoryCard
          v-for="category in data.data.slice(0, 8)"
          :key="category.id"
          :category="category"
          @click="handleCategoryClick"
        />
      </div>
    </div>
  </section>
</template>


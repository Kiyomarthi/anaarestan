<script setup lang="ts">
const { data: categories } = useApiFetch<{
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
  <section v-if="categories?.data && categories.data.length > 0" class="mb-12">
    <div class="container mx-auto px-4">
      <h2 class="text-2xl font-bold mb-6">دسترسی سریع</h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div
          v-for="category in categories.data"
          :key="category.id"
          class="p-4 bg-white rounded-lg border border-gray-300 hover:border-primary-500 hover:shadow-md transition-all cursor-pointer"
          @click="handleCategoryClick(category)"
        >
          <div class="flex flex-col items-center text-center">
            <BaseImage
              v-if="category.image"
              :src="category.image"
              :alt="category.name"
              class="w-16 h-16 rounded-lg mb-2"
              :loading="'lazy'"
            />
            <span class="text-sm font-medium text-gray-700">{{ category.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>


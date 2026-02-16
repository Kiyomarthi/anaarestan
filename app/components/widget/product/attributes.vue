<script setup lang="ts">
///// imports /////

///// props/emits /////
interface ProductAttribute {
  id: number;
  attribute_id: number;
  name: string;
  value: string;
}

const props = defineProps<{
  attributes: ProductAttribute[];
}>();

///// refs /////

///// composables/stores /////

///// computed /////

///// functions /////

///// watchers /////

///// lifecycle /////
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-xl font-bold text-gray-900">ویژگی‌های محصول</h2>
    <div class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="attr in attributes"
          :key="attr.id"
          class="flex justify-between items-start rounded-md border border-neutral-300 p-3"
        >
          <span class="text-sm text-gray-600 font-medium"
            >{{ attr.name }}:</span
          >
          <span class="text-sm text-gray-900 text-right">{{ attr.value }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

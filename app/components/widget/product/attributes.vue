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
const groupedAttributes = computed(() => {
  const groups = new Map<number, { name: string; items: ProductAttribute[] }>();

  props.attributes.forEach((attr) => {
    if (!groups.has(attr.attribute_id)) {
      groups.set(attr.attribute_id, {
        name: attr.name,
        items: [],
      });
    }
    groups.get(attr.attribute_id)!.items.push(attr);
  });

  return Array.from(groups.values());
});

///// functions /////

///// watchers /////

///// lifecycle /////
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-xl font-bold text-gray-900">ویژگی‌های محصول</h2>
    <div class="space-y-4">
      <div
        v-for="group in groupedAttributes"
        :key="group.name"
        class="border-b border-gray-200 pb-3 last:border-b-0"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            v-for="attr in group.items"
            :key="attr.id"
            class="flex justify-between items-start"
          >
            <span class="text-sm text-gray-600 font-medium">{{ attr.name }}:</span>
            <span class="text-sm text-gray-900 text-right">{{ attr.value }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


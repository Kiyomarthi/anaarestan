<script setup lang="ts">
import type { Category } from "~~/shared/types/api";

const props = withDefaults(
  defineProps<{
    categories: Category[];
    maxColumnHeight?: number;
  }>(),
  { maxColumnHeight: 300 }
);

const activeMain = ref<Category | null>(props.categories?.[0] ?? null);

const setActive = (item: Category) => {
  activeMain.value = item;
};

const columns = computed(() => {
  const cols: Category[][] = [[]];
  let currentHeight = 0;

  if (!activeMain.value?.children) return cols;

  for (const child of activeMain.value.children) {
    const childHeight = 30 + (child.children?.length ?? 0) * 20;

    if (currentHeight + childHeight > props.maxColumnHeight) {
      cols.push([]);
      currentHeight = 0;
    }

    const lastCol = cols[cols.length - 1] ?? (cols[cols.length - 1] = []);
    lastCol.push(child);

    currentHeight += childHeight;
  }
  return cols;
});
</script>

<template>
  <div class="flex border-2 bg-white rounded-xl overflow-hidden">
    <ul class="border-l-2 border-default">
      <li
        v-for="(item, i) in categories"
        :key="i"
        @mouseenter="setActive(item)"
        class="p-3 cursor-pointer"
        :class="activeMain?.name === item.name ? 'bg-default-100' : ''"
      >
        <UButton
          :to="`/categories/${item.code}/${item?.slug}`"
          variant="ghost"
          color="default"
          class="size-full text-start p-2"
          containerClass="justify-start"
        >
          {{ item.name }}
        </UButton>
      </li>
    </ul>

    <div class="p-4 max-h-125 overflow-y-auto flex gap-6">
      <template v-if="activeMain?.children">
        <div
          v-for="(column, colIndex) in columns"
          :key="colIndex"
          class="flex flex-col gap-4"
        >
          <div v-for="child in column" :key="child.name" class="w-48">
            <h3 class="font-semibold mb-3">
              <UButton
                :to="`/categories/${child.code}/${child?.slug}`"
                variant="ghost"
                class="size-full text-start p-0"
                containerClass="justify-end"
                icon="mdi:chevron-left"
                reverse
              >
                {{ child.name }}
              </UButton>
            </h3>
            <ul class="space-y-1.5">
              <li
                v-for="sub in child.children ?? []"
                :key="sub.name"
                class="text-gray-600 hover:text-black cursor-pointer"
              >
                <UButton
                  :to="`/categories/${sub.code}/${sub?.slug}`"
                  variant="ghost"
                  class="size-full text-start p-0"
                  containerClass="justify-start"
                >
                  {{ sub.name }}
                </UButton>
              </li>
            </ul>
          </div>
        </div>
      </template>

      <p v-else class="text-gray-400 text-center mt-20">
        زیرمنویی برای "{{ activeMain?.name }}" وجود ندارد
      </p>
    </div>
  </div>
</template>

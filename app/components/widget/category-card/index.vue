<script setup lang="ts">
import { twMerge } from "tailwind-merge";

type Category = {
  id: number;
  name: string;
  slug: string;
  image?: string | null;
};

const props = withDefaults(
  defineProps<{
    category: Category;
    class?: string;
  }>(),
  {
    class: "",
  }
);

const emit = defineEmits<{
  click: [category: Category];
}>();

function handleClick() {
  emit("click", props.category);
}
</script>

<template>
  <div
    :class="twMerge('group cursor-pointer', props.class)"
    @click="handleClick"
  >
    <BaseCard class="text-center" :hover="true" :padding="true">
      <div class="relative aspect-square mb-3">
        <BaseImage
          v-if="category.image"
          :src="category.image"
          :alt="category.name"
          class="rounded-lg"
          :loading="'lazy'"
        />
        <div
          v-else
          class="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center"
        >
          <svg
            class="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </div>
      </div>
      <h3 class="text-sm font-medium text-gray-700 line-clamp-2">
        {{ category.name }}
      </h3>
    </BaseCard>
  </div>
</template>


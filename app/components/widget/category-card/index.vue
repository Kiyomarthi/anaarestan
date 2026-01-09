<script setup lang="ts">
import { twMerge } from "tailwind-merge";

type Category = {};

const props = withDefaults(
  defineProps<{
    code?: number;
    name: string;
    slug?: string;
    image?: string | null;
    class?: string;
  }>(),
  {
    class: "",
  }
);
</script>

<template>
  <ULink
    :class="twMerge('group cursor-pointer', props.class)"
    :to="`/categories/${code}/${slug}`"
  >
    <BaseImage
      :src="image"
      :alt="name"
      class="rounded-lg w-max"
      image-class="size-30 md:size-40"
      :loading="'lazy'"
      :width="160"
      :height="160"
      sizes="160px"
    />
    <h4 class="text-h4 text-center font-medium text-gray-700 line-clamp-2">
      {{ name }}
    </h4>
  </ULink>
</template>

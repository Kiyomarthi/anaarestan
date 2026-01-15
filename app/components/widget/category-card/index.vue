<script setup lang="ts">
import { twMerge } from "tailwind-merge";

const props = withDefaults(
  defineProps<{
    id: string;
    name: string;
    slug: string;
    image: string | null;
    class?: string;
    imageClass?: string;
    labelClass?: string;
  }>(),
  {
    class: "",
  }
);
</script>

<template>
  <ULink
    :class="twMerge('group cursor-pointer', props.class)"
    :to="`/products/list/${id}/${slug}`"
  >
    <BaseImage
      :src="image"
      :alt="name"
      class="rounded-lg w-max mx-auto"
      :image-class="`size-[70px] md:size-[100px] ${imageClass}`"
      :loading="'lazy'"
      :width="100"
      :height="100"
      sizes="100px"
    />
    <h4
      class="text-h4 text-center font-medium text-gray-700 line-clamp-2"
      :class="labelClass"
    >
      {{ name }}
    </h4>
  </ULink>
</template>

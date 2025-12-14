<script setup lang="ts">
import { twMerge } from "tailwind-merge";

const props = withDefaults(
  defineProps<{
    class?: string;
    padding?: boolean;
    shadow?: boolean;
    rounded?: boolean;
    hover?: boolean;
  }>(),
  {
    class: "",
    padding: true,
    shadow: false,
    rounded: true,
    hover: false,
  }
);

const cardClass = computed(() =>
  twMerge(
    "bg-white",
    props.padding && "p-4",
    props.shadow && "shadow-md",
    props.rounded && "rounded-lg",
    props.hover && "transition-shadow hover:shadow-lg",
    props.class
  )
);
</script>

<template>
  <div :class="cardClass">
    <slot />
  </div>
</template>


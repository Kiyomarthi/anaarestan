<script setup lang="ts">
import { twMerge } from "tailwind-merge";
import { ref, computed, watch } from "vue";

const props = withDefaults(
  defineProps<{
    src: string;
    alt: string;
    aspect?: string;
    wrapperClass?: string;
    imageClass?: string;
    placeholder?: boolean | string | number[];
    format?: string;
    loading?: "lazy" | "eager";
    fetchPriority?: "low" | "high";
    showLoadingOverlay?: boolean;
    width?: number;
    height?: number;
    class?: string;
    preload?: boolean;
  }>(),
  {
    aspect: "",
    wrapperClass: "relative w-full overflow-hidden",
    imageClass: "w-full h-full object-cover",
    placeholder: [10, 10, 10, 10],
    format: "avif",
    loading: "lazy",
    fetchPriority: "low",
    showLoadingOverlay: true,
    class: "",
  }
);

const emit = defineEmits<{
  (e: "load", event?: Event): void;
  (e: "loaded"): void;
  (e: "error", event?: Event): void;
}>();

const isLoading = ref(true);

function handleImageLoad(e?: Event) {
  isLoading.value = false;
  emit("load", e);
  emit("loaded");
}

function handleImageError(e?: Event) {
  isLoading.value = false;
  emit("error", e);
}

const wrapperClasses = computed(() =>
  twMerge(props.wrapperClass, props.aspect, props.class)
);

const imageClasses = computed(() => twMerge(props.imageClass));

watch(
  () => props.src,
  () => {
    isLoading.value = true;
  }
);
</script>

<template>
  <div :class="wrapperClasses">
    <!-- TODO: fix this -->
    <!-- <div
      v-if="isLoading && props.showLoadingOverlay"
      class="absolute inset-0 z-10 bg-gray-300 animate-pulse"
    /> -->
    <nuxt-picture
      v-bind="$attrs"
      :src="props.src"
      :alt="props.alt"
      :format="props.format"
      :width="props.width"
      :height="props.height"
      :imgAttrs="{
        preload: props.preload,
        fetchPriority: props.fetchPriority,
        loading: props.loading,
        class: props.imageClass,
      }"
      :preload="props.preload"
      :loading="props.loading"
      :fetch-priority="props.fetchPriority"
      @load="handleImageLoad"
      @error="handleImageError"
    />
  </div>
</template>

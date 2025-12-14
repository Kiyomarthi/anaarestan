<script setup lang="ts">
import { twMerge } from "tailwind-merge";

const props = withDefaults(
  defineProps<{
    src: string;
    alt?: string;
    aspect?: string;
    wrapperClass?: string;
    imageClass?: string;
    placeholder?: boolean | Array<number> | string;
    format?: string;
    loading?: "lazy" | "eager";
    fetchPriority?: "high" | "low" | "auto";
    showLoadingOverlay?: boolean;
    width?: string | number;
    height?: string | number;
    class?: string;
    sizes?: string;
    quality?: number;
    preload?: boolean;
  }>(),
  {
    alt: "",
    aspect: "",
    wrapperClass: "",
    imageClass: "size-full object-cover",
    placeholder: () => [10, 10, 10, 10],
    format: "webp",
    loading: "lazy",
    fetchPriority: "low",
    showLoadingOverlay: true,
    width: undefined,
    height: undefined,
    class: "",
    sizes: undefined,
    quality: 80,
    preload: false,
  }
);

const emit = defineEmits(["load", "error", "loaded"]);

const isLoading = ref(true);
const hasError = ref(false);

function handleImageLoad(e?: unknown) {
  isLoading.value = false;
  hasError.value = false;
  emit("load", e);
  emit("loaded");
}

function handleImageError(e?: unknown) {
  isLoading.value = false;
  hasError.value = true;
  emit("error", e);
}

const wrapperClassMerged = computed(() =>
  twMerge("relative w-full overflow-hidden", props.wrapperClass, props.class)
);

const imageClassMerged = computed(() =>
  twMerge("relative z-2", props.imageClass)
);

watch(
  () => props.src,
  () => {
    isLoading.value = true;
    hasError.value = false;
  }
);

const imageWidth = computed(() => {
  if (typeof props.width === "number") return props.width;
  if (typeof props.width === "string" && props.width !== "100%") {
    return parseInt(props.width) || undefined;
  }
  return undefined;
});

const imageHeight = computed(() => {
  if (typeof props.height === "number") return props.height;
  if (typeof props.height === "string" && props.height !== "100%") {
    return parseInt(props.height) || undefined;
  }
  return undefined;
});
</script>

<template>
  <div :class="wrapperClassMerged">
    <div
      v-if="isLoading && props.showLoadingOverlay"
      class="absolute inset-0 z-1 bg-gray-200 dark:bg-gray-800 animate-pulse rounded"
      aria-hidden="true"
    />

    <nuxt-img
      v-if="!hasError"
      :src="props.src"
      :format="props.format"
      :width="imageWidth"
      :height="imageHeight"
      :loading="props.loading"
      :fetch-priority="props.fetchPriority"
      :placeholder="props.placeholder"
      :alt="props.alt || 'تصویر'"
      :sizes="props.sizes"
      :quality="props.quality"
      :preload="props.preload"
      :class="imageClassMerged"
      v-bind="$attrs"
      @load="handleImageLoad"
      @error="handleImageError"
    />

    <div
      v-else
      class="absolute inset-0 z-2 flex items-center justify-center bg-gray-100 dark:bg-gray-900"
      role="img"
      :aria-label="props.alt || 'خطا در بارگذاری تصویر'"
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
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    </div>
  </div>
</template>

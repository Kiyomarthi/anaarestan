<template>
  <div
    class="inline-flex items-center justify-center"
    :class="[size === 'full' && 'h-full w-full']"
  >
    <span
      class="loading"
      :class="[sizeClasses, colorClasses, loaderClasses, props.class]"
    />
  </div>
</template>

<script setup>
const props = defineProps({
  color: {
    type: String,
    default: "primary",
    validator: (value) =>
      ["primary", "secondary", "success", "error", "warning", "info"].includes(
        value
      ),
  },
  size: {
    type: String,
    default: "md",
    validator: (value) => ["sm", "md", "lg", "full"].includes(value),
  },
  variant: {
    type: String,
    default: "ring",
    validator: (value) =>
      ["spinner", "dots", "ring", "ball", "bars"].includes(value),
  },
  class: "",
});

const sizeClasses = computed(
  () =>
    ({
      sm: "loading-sm",
      md: "loading-md",
      lg: "loading-lg",
      full: "loading-lg",
    }[props.size])
);

const colorClasses = computed(
  () =>
    ({
      primary: "text-primary",
      secondary: "text-gray-600",
      success: "text-success",
      error: "text-error",
      warning: "text-warning",
      info: "text-info",
    }[props.color])
);

const loaderClasses = computed(
  () =>
    ({
      spinner: "loading-spinner",
      dots: "loading-dots",
      ring: "loading-ring",
      ball: "loading-ball",
      bars: "loading-bars",
    }[props.variant])
);
</script>

<script setup lang="ts">
///// imports /////

///// props/emits /////
const props = withDefaults(
  defineProps<{
    modelValue: number;
    min?: number;
    max?: number;
    disabled?: boolean;
    size?: "sm" | "md" | "lg";
  }>(),
  {
    min: 1,
    max: 999,
    disabled: false,
    size: "md",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: number];
}>();

///// refs /////

///// composables/stores /////

///// computed /////
const sizeClasses = computed(() => {
  const sizes = {
    sm: "size-7 text-sm",
    md: "size-9 text-base",
    lg: "size-11 text-lg",
  };
  return sizes[props.size];
});

const canDecrease = computed(
  () => !props.disabled && props.modelValue > props.min,
);
const canIncrease = computed(
  () => !props.disabled && props.modelValue < props.max,
);

///// functions /////
const decrease = () => {
  if (canDecrease.value) {
    emit("update:modelValue", props.modelValue - 1);
  }
};

const increase = () => {
  if (canIncrease.value) {
    emit("update:modelValue", props.modelValue + 1);
  }
};

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const value = parseInt(target.value) || props.min;
  const clampedValue = Math.max(props.min, Math.min(props.max, value));
  emit("update:modelValue", clampedValue);
};

///// watchers /////

///// lifecycle /////
</script>

<template>
  <div class="flex items-center border border-primary p-1 rounded-md gap-0.5">
    <UButton
      :disabled="!canDecrease"
      :size="size"
      variant="ghost"
      :icon="modelValue > 1 ? 'i-lucide-minus' : 'i-lucide-trash'"
      :ui="{
        base: 'size-8',
      }"
      @click="decrease"
    />
    <div
      class="size-8 text-center rounded-md disabled:cursor-not-allowed flex items-center justify-center"
    >
      <span v-if="!disabled">
        {{ modelValue }}
      </span>
      <BaseLoader v-else />
    </div>
    <UButton
      :disabled="!canIncrease"
      :size="size"
      variant="ghost"
      icon="i-lucide-plus"
      :ui="{
        base: 'size-8',
      }"
      @click="increase"
    />
  </div>
</template>

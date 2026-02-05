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
  <div class="flex items-center gap-2">
    <UButton
      :disabled="!canDecrease"
      :size="size"
      variant="outline"
      icon="i-lucide-minus"
      @click="decrease"
    />
    <input
      :value="modelValue"
      :disabled="disabled"
      type="number"
      :min="min"
      :max="max"
      class="w-16 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      :class="sizeClasses"
      @input="handleInput"
    />
    <UButton
      :disabled="!canIncrease"
      :size="size"
      variant="outline"
      icon="i-lucide-plus"
      @click="increase"
    />
  </div>
</template>


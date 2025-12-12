<script setup lang="ts">
interface Props {
  title: string;
  value: string | number;
  icon?: string;
  color?: "primary" | "success" | "warning" | "error" | "info" | "neutral";
  trend?: {
    value: number;
    label: string;
    direction: "up" | "down";
  };
  description?: string;
  to?: string;
}

const props = withDefaults(defineProps<Props>(), {
  color: "primary",
  icon: "i-lucide-trending-up",
});

const router = useRouter();

const handleClick = () => {
  if (props.to) {
    router.push(props.to);
  }
};
</script>

<template>
  <UCard
    :class="[
      'cursor-pointer transition-all hover:shadow-lg',
      to ? 'hover:scale-[1.02]' : '',
    ]"
    @click="handleClick"
  >
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-2">
          <UIcon
            :name="icon"
            :class="[
              'text-lg',
              {
                'text-primary-500': color === 'primary',
                'text-success-500': color === 'success',
                'text-warning-500': color === 'warning',
                'text-error-500': color === 'error',
                'text-info-500': color === 'info',
                'text-gray-500': color === 'neutral',
              },
            ]"
          />
          <span
            class="text-sm font-medium text-gray-600"
            :class="{
              'text-primary-600': color === 'primary',
              'text-success-600': color === 'success',
              'text-warning-600': color === 'warning',
              'text-error-600': color === 'error',
              'text-info-600': color === 'info',
            }"
          >
            {{ title }}
          </span>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-2xl font-bold text-gray-900">{{ value }}</span>
          <span v-if="trend" class="text-xs flex items-center gap-1">
            <UIcon
              :name="
                trend.direction === 'up'
                  ? 'i-lucide-arrow-up'
                  : 'i-lucide-arrow-down'
              "
              :class="[
                'text-xs',
                trend.direction === 'up'
                  ? 'text-success-500'
                  : 'text-error-500',
              ]"
            />
            <span
              :class="[
                trend.direction === 'up'
                  ? 'text-success-600'
                  : 'text-error-600',
              ]"
            >
              {{ trend.value }}%
            </span>
            <span class="text-gray-500">{{ trend.label }}</span>
          </span>
        </div>
        <p v-if="description" class="text-xs text-gray-500 mt-2">
          {{ description }}
        </p>
      </div>
    </div>
  </UCard>
</template>


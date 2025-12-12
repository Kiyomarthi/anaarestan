<script setup lang="ts">
interface QuickAction {
  label: string;
  icon: string;
  to: string;
  color?: "primary" | "success" | "warning" | "error" | "info" | "neutral";
  description?: string;
}

interface Props {
  actions: QuickAction[];
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: "دسترسی سریع",
});
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-zap" class="text-lg text-primary-500" />
        <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
      </div>
    </template>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <UButton
        v-for="action in actions"
        :key="action.to"
        :to="action.to"
        :icon="action.icon"
        :color="action.color || 'primary'"
        variant="outline"
        block
        class="justify-start h-auto py-3"
      >
        <div class="flex flex-col items-start gap-1">
          <span class="font-medium">{{ action.label }}</span>
          <span
            v-if="action.description"
            class="text-xs text-gray-500 text-right"
          >
            {{ action.description }}
          </span>
        </div>
      </UButton>
    </div>
  </UCard>
</template>


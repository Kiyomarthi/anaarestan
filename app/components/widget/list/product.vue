<script setup lang="ts">
import { twMerge } from "tailwind-merge";

const props = defineProps<{
  loading?: boolean;
  items: unknown[];
  subtitle?: string;
  title: string;
  class?: string;
}>();

const router = useRouter();

const wrapperClasses = computed(() =>
  twMerge("bg-linear-to-l from-primary-50 to-white py-5", props.class)
);

// Calculate end time (24 hours from now)
</script>

<template>
  <div v-if="loading">
    <UCarousel
      drag-fre
      :ui="{
        root: 'bg-white p-4 rounded-2xl w-full',
        item: 'basis-1/2 lg:basis-auto py-1',
      }"
      :items="10"
    >
      <USkeleton class="w-full lg:w-50 h-62.5 rounded-2xl" />
    </UCarousel>
  </div>
  <section v-else-if="items.length > 0" class="" :class="wrapperClasses">
    <div class="px-4">
      <div
        class="flex flex-col lg:flex-row items-center justify-between mb-4 px-4"
      >
        <div
          class="lg:mb-0 text-center lg:text-start"
          :class="{ 'mb-2': subtitle }"
        >
          <h3 class="text-h3">{{ title }}</h3>
          <p v-if="subtitle" class="text-gray-600 mt-1">
            {{ subtitle }}
          </p>
        </div>
        <slot name="header-item" />
      </div>

      <div class="overflow-x-hidden">
        <div class="flex gap-4 pb-4">
          <UCarousel
            drag-fre
            :ui="{
              root: 'bg-white p-4 rounded-2xl w-full',
              item: 'basis-1/2 lg:basis-auto py-1',
            }"
            :items="items"
            v-slot="{ item }"
          >
            <WidgetProductCard :product="item" />
          </UCarousel>
        </div>
      </div>
    </div>
  </section>
</template>

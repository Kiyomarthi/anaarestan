<script setup lang="ts">
import { twMerge } from "tailwind-merge";

const props = defineProps<{
  loading?: boolean;
  items: unknown[];
  subtitle?: string;
  title: string;
  class?: string;
  moreLink?: string;
}>();

const router = useRouter();

const wrapperClasses = computed(() => twMerge("", props.class));

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
  <section v-else-if="items.length" :class="wrapperClasses">
    <div class="border border-default rounded-2xl p-4">
      <div
        class="flex flex-col lg:flex-row items-center justify-between mb-2 lg:mb-4 px-4"
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

      <div class="overflow-x-hidden pb-3">
        <div class="flex gap-4">
          <UCarousel
            arrows
            as="ul"
            :ui="{
              root: 'bg-white rounded-2xl w-full',
              item: 'basis-1/1 lg:basis-auto py-1 h-fill',
              prev: 'start-0 lg:start-1 disabled:opacity-0 with-transition',
              next: 'end-0 lg:end-1 disabled:opacity-0 with-transition',
              dots: '-bottom-2',
              dot: 'w-6 h-2 data-[state=active]:bg-primary cursor-default',
            }"
            dots
            prev-icon="i-lucide-chevron-right"
            next-icon="i-lucide-chevron-left"
            :items="items"
            v-slot="{ item, index }"
            role="list"
          >
            <div class="h-full">
              <li role="listitem">
                <WidgetProductCardSearch
                  :product="item?.[0]"
                  :image-color="randomColor[index % randomColor.length]"
                />
              </li>

              <li v-if="item?.[1]" role="listitem">
                <WidgetProductCardSearch
                  :product="item?.[1]"
                  :image-color="randomColor[index % randomColor.length]"
                />
              </li>
              <li v-if="item?.[2]" role="listitem">
                <WidgetProductCardSearch
                  :product="item?.[2]"
                  :image-color="randomColor[index % randomColor.length]"
                />
              </li>
            </div>
          </UCarousel>
        </div>
      </div>
    </div>
  </section>
</template>

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

const wrapperClasses = computed(() =>
  twMerge("bg-linear-to-l from-primary-50 to-white py-3", props.class)
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
  <section v-else-if="items.length" :class="wrapperClasses">
    <div class="px-4">
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

      <div class="overflow-x-hidden">
        <div class="flex gap-4 pb-2">
          <UCarousel
            arrows
            drag-free
            as="ul"
            :ui="{
              root: 'bg-white p-4 rounded-2xl w-full',
              item: 'basis-1/2 lg:basis-auto py-1 h-fill',
              prev: 'lg:start-8 disabled:opacity-0 with-transition',
              next: 'lg:end-8 disabled:opacity-0 with-transition',
            }"
            prev-icon="i-lucide-chevron-right"
            next-icon="i-lucide-chevron-left"
            :items="[...items, 'مشاهده همه']"
            v-slot="{ item, index }"
            role="list"
          >
            <li v-if="index != items.length" role="listitem" class="h-full">
              <WidgetProductCard
                :product="item"
                :image-color="randomColor[index % randomColor.length]"
              />
            </li>
            <UButton
              v-else
              label=""
              variant="soft"
              icon=""
              :ui="{
                base: 'borde border-primary lg:border-0 rounded-lg size-37.5 lg:size-62.5 h-fill flex justify-center items-center',
              }"
              :to="moreLink"
            >
              <div class="space-y-1 text-center">
                <div
                  class="w-fit rounded-full border border-primary p-1 flex mx-auto"
                >
                  <UIcon name="i-lucide-arrow-left" class="size-5" />
                </div>
                <div class="text-lg lg:text-2xl">مشاهده همه</div>
                <div class="text-xs font-light">
                  برای مشاهده موارد بیشتر کلیک کنید.
                </div>
              </div>
            </UButton>
          </UCarousel>
        </div>
      </div>
    </div>
  </section>
</template>

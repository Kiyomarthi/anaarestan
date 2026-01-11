<script setup lang="ts">
///// imports /////

///// page meta /////

///// props/emits /////
withDefaults(
  defineProps<{
    title?: string;
    items: Category[];
    loading?: boolean;
  }>(),
  {
    title: "دسترسی سریع",
  }
);

///// refs /////

///// composables/stores /////

///// computed /////

///// functions /////

///// watchers /////

///// lifecycle /////
</script>

<template>
  <div v-if="loading">
    <UCarousel
      drag-fre
      :ui="{
        root: 'bg-white p-4 rounded-2xl w-full',
        item: 'basis-1/3 lg:basis-1/5 py-1',
      }"
      :items="10"
    >
      <USkeleton class="size-24 rounded-2xl mx-auto" />
    </UCarousel>
  </div>
  <section v-else-if="items?.length">
    <h3 class="text-h3 mb-2 lg:mb-4 text-center">{{ title }}</h3>
    <UCarousel
      arrows
      drag-free
      :ui="{
        root: 'rounded-2xl w-full',
        item: 'basis-1/2 lg:basis-auto py-1 h-fill',
        prev: 'lg:start-8 disabled:opacity-0 with-transition',
        next: 'lg:end-8 disabled:opacity-0 with-transition',
        viewport: 'px-1',
      }"
      prev-icon="i-lucide-chevron-right"
      next-icon="i-lucide-chevron-left"
      :items="items"
      v-slot="{ item }"
    >
      <WidgetCategoryCardAction :category="item" />
    </UCarousel>
  </section>
</template>

<script setup lang="ts">
import { useBreakpoints } from "~/composables/utils/useBreakpoints";

///// imports /////

///// page meta /////

///// props/emits /////
defineProps<{
  title: string;
  items: unknown[];
  loading?: boolean;
}>();

///// refs /////

///// composables/stores /////
const { lgAndUp } = useBreakpoints();

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
      <USkeleton class="size-24 rounded-full mx-auto" />
    </UCarousel>
  </div>
  <section v-else-if="items?.length">
    <h3 class="text-h3 text-center lg:text-right lg:pr-8 mb-1">{{ title }}</h3>
    <u-carousel
      align="center"
      drag-free
      :ui="{
        root: 'bg-white',
        item: 'basis-1/4 lg:basis-1/6 py-1 justify-center flex',
      }"
      as="ul"
      role="list"
      :items="items"
      v-slot="{ item, index }"
    >
      <li role="listitem">
        <slot name="desktop" :item :index />
      </li>
    </u-carousel>
    <!-- <ul
      v-else
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 justify-center"
      role="list"
    >
      <slot name="mobile" />
    </ul> -->
  </section>
</template>

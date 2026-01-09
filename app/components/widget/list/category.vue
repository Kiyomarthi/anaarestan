<script setup lang="ts">
import { useBreakpoints } from "~/composables/utils/useBreakpoints";

///// imports /////

///// page meta /////

///// props/emits /////
defineProps<{
  title: string;
  items: unknown[];
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
  <section>
    <h3 class="text-center text-h3 mb-1">{{ title }}</h3>
    <div v-if="lgAndUp">
      <u-carousel
        align="center"
        drag-free
        :ui="{
          root: 'bg-white',
          item: 'basis-1/5 py-1 justify-center flex',
        }"
        :items="items"
        v-slot="{ item }"
      >
        <slot name="desktop" :item />
      </u-carousel>
    </div>
    <div
      v-else
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 justify-center"
    >
      <slot name="mobile" />
    </div>
  </section>
</template>

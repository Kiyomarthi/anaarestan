<script setup lang="ts">
import type { Item } from "~~/shared/types/common";

///// imports /////

///// page meta /////

///// props/emits /////
withDefaults(
  defineProps<{
    items: Item[];
    title: string;
    hasMark?: boolean;
    titleTag?: string;
  }>(),
  {
    hasMark: false,
    titleTag: "div",
  }
);

///// refs /////
const NuxtLink = resolveComponent("NuxtLink");

///// composables/stores /////

///// computed /////

///// watchers /////

///// functions /////

///// lifecycle /////
</script>

<template>
  <div class="text-center md:text-start">
    <component
      :is="titleTag"
      class="md:text-[17px]/[33px] font-bold text-gray-extra-dark flex gap-2 justify-center md:justify-start items-center mb-1"
    >
      <div v-if="hasMark" class="bg-secondary size-3" />
      {{ title }}
    </component>
    <ul>
      <li v-for="(item, index) in items" :key="index" class="group">
        <component
          :is="item.to ? NuxtLink : 'span'"
          :to="item?.to"
          class="text-gray-dark text-[15px]/[30px] with-transition"
          :class="{ 'group-hover:text-primary hover:text-primary': item?.to }"
        >
          {{ item.label }}
        </component>
      </li>
    </ul>
  </div>
</template>

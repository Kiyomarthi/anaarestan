<script setup lang="ts">
///// imports /////
import { randomColor } from "~/constants/common";


///// page meta /////

///// props/emits /////
defineProps<{
  items: unknown[];
}>();

///// refs /////

///// composables/stores /////

///// computed /////

///// functions /////

///// watchers /////

///// lifecycle /////
</script>

<template>
  <div>
    <UCarousel
      arrows
      dots
      :items
      loop
      v-slot="{ item, index }"
      :autoplay="{ delay: 3000 }"
      next-icon="i-lucide-chevron-left"
      prev-icon="i-lucide-chevron-right"
      :ui="{
        dot: 'w-6 h-2 data-[state=active]:bg-primary cursor-default',
        dots: '-bottom-4',
        prev: 'sm:start-10 lg:-start-10',
        next: 'sm:end-10 lg:-end-10',
        arrows:
          'lg:absolute lg:bottom-6 lg:w-5 lg:right-1/2 lg:translate-x-1/2',
      }"
    >
      <NuxtLink
        class="w-full"
        to="/"
        :aria-label="item?.alt"
        target="_blank"
        prefetch-on="interaction"
      >
        <baseImage
          src="/tmp/slider.avif"
          :image-class="`w-full h-50 lg:h-[400px] object-cover ${
            randomColor[index % randomColor.length]
          }`"
          alt="slider-item"
          :height="400"
          width="100dvw"
          sizes="100dvw"
          :preload="index == 0"
          :loading="index == 0 ? 'eager' : 'lazy'"
          :fetch-priority="index == 0 ? 'high' : 'low'"
        />
      </NuxtLink>
    </UCarousel>
  </div>
</template>

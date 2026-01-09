<script setup lang="ts">
///// imports /////

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
      v-slot="{ item }"
      :autoplay="{ delay: 3000 }"
      next-icon="i-lucide-chevron-left"
      prev-icon="i-lucide-chevron-right"
      :ui="{
        dot: 'w-6 h-2 data-[state=active]:bg-primary cursor-default',
        prev: 'md:star-[500px] md:ottom-0',
        next: 'md:en-[500px]',
        arrows:
          'md:absolute md:bottom-6 md:w-5 md:right-1/2 md:translate-x-1/2',
      }"
    >
      <ULink
        class="w-full"
        to="/"
        :aria-label="item?.alt"
        target="_blank"
        prefetch-on="interaction"
      >
        <baseImage
          src="/tmp/slider.avif"
          image-class="w-full h-50 md:h-[350px] object-cover"
          alt="slider-item"
          :height="200"
          width="100dvw"
          sizes="100dvw"
        />
      </ULink>
    </UCarousel>
  </div>
</template>

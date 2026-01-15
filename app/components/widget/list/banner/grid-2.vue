<script setup lang="ts">
import Index from "../../timer/index.vue";

///// imports /////

///// page meta /////

///// props/emits /////
defineProps<{
  banners: MediaBlock[];
  loading?: boolean;
}>();

///// refs /////

///// composables/stores /////

///// computed /////

///// functions /////

///// watchers /////

///// lifecycle /////
</script>

<template>
  <div
    v-if="loading"
    class="grid grid-cols-2 gap-2 items-stretch justify-stretch mb-2"
  >
    <h3 class="sr-only">بنرهای سایت</h3>
    <USkeleton
      v-for="i in 2"
      :key="i"
      class="w-full h-auto max-h-50 aspect-square rounded-2xl"
    />
  </div>
  <section v-else-if="banners?.length >= 2">
    <div class="grid grid-cols-2 gap-2 items-stretch justify-stretch mb-2">
      <ULink
        v-for="(banner, index) in banners"
        :key="index"
        :to="banner.link"
        :aria-label="banner.title"
        class="w-full flex-1"
      >
        <BaseImage
          src="/tmp/banner.webp"
          alt="slider"
          sizes="(max-width: 600px) 100dvw, 40dvw"
          image-class="w-full max-h-50"
          class="rounded-lg overflow-hidden"
        />
      </ULink>
    </div>
  </section>
</template>

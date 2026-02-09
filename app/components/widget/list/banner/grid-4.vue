<script setup lang="ts">
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
    class="grid grid-cols-2 lg:grid-cols-4 gap-2 items-stretch justify-stretch mb-2"
  >
    <USkeleton
      v-for="i in 4"
      :key="i"
      class="w-full h-auto aspect-square rounded-2xl"
    />
  </div>
  <section v-else-if="banners?.length >= 4">
    <h3 class="sr-only">بنر</h3>

    <div
      class="grid grid-cols-2 lg:grid-cols-4 gap-2 items-stretch justify-stretch mb-2"
    >
      <NuxtLink
        v-for="(banner, index) in banners.slice(0, 4)"
        :key="index"
        :to="banner.link"
        :aria-label="banner.title"
        class="w-full flex-1"
      >
        <BaseImage
          src="/tmp/banner.webp"
          alt="slider"
          sizes="(max-width: 600px) 100dvw, 40dvw"
          image-class="w-full"
          class="rounded-lg overflow-hidden"
        />
      </NuxtLink>
    </div>
    <NuxtLink
      v-if="banners?.[5]"
      :aria-label="banners?.[5]?.title"
      :to="banners?.[5]?.link"
      class="w-full flex-1"
    >
      <BaseImage
        src="/tmp/slider.avif"
        alt="slider"
        sizes="100dvw"
        :height="80"
        image-class="w-full w-full max-h-20"
        class="rounded-lg overflow-hidden"
      />
    </NuxtLink>
  </section>
</template>

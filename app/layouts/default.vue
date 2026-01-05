<script setup lang="ts">
const route = useRoute();
const noHeader = computed(() => route.meta?.noHeader);
const noFooter = computed(() => route.meta?.noFooter);
const noBottomNavigation = computed(() => route.meta?.noFooter);
const noMargin = computed(() => route.meta?.noMargin);

const { hidden } = useHideScroll();
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <WidgetHeader
      v-if="!noHeader"
      class="with-transition fixed top-0 w-full bg-white"
      :class="{ '-translate-y-full': hidden }"
    />
    <main
      class="w-full lg:px-8"
      :class="{
        'max-w-(--ui-container) mx-auto': !noMargin,
        'pt-21.75 md:pt-34.5': !noHeader,
      }"
    >
      <slot />
    </main>
    <WidgetFooter v-if="!noFooter" />
    <WidgetBottomNavigation
      class="with-transition"
      :class="{ 'translate-y-[calc(100%+20px)]': hidden }"
      v-if="!noBottomNavigation"
    />
  </div>
</template>

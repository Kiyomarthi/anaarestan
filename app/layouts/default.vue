<script setup lang="ts">
const route = useRoute();
const noHeader = computed(() => route.meta?.noHeader);
const noFooter = computed(() => route.meta?.noFooter);
const noBottomNavigation = computed(() => route.meta?.noFooter);
const noMargin = computed(() => route.meta?.noMargin);

const { hidden } = useHideScroll(5);
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <WidgetHeader
      v-if="!noHeader"
      class="with-transition fixed top-0 w-full lg:bg-white z-100"
      :class="{ '-translate-y-full': hidden }"
    />
    <main
      class="w-full"
      :class="{
        'max-w-(--ui-container) mx-auto lg:px-8': !noMargin,
        'pt-16.75 lg:pt-30': !noHeader,
      }"
    >
      <slot />
    </main>
    <div v-if="!noFooter" class="border-t border-neutral-300 mt-10">
      <WidgetFooter
        class="max-w-(--ui-container) mx-auto px-4"
        :class="{ 'mb-32 lg:mb-2 pt-4': !noBottomNavigation }"
      />
    </div>

    <WidgetBottomNavigation v-if="!noBottomNavigation" />
  </div>
</template>

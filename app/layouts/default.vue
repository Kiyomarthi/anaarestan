<script setup lang="ts">
const route = useRoute();
const noHeader = computed(() => route.meta?.noHeader);
const noFooter = computed(() => route.meta?.noFooter);
const noBottomNavigation = computed(() => route.meta?.noBottomNavigation);
const hideBottomNavigationByScroll = computed(
  () => route.meta?.hideBottomNavigationByScroll,
);
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
        'max-w-(--ui-container) mx-auto px-4': !noMargin,
        'pt-16.25 lg:pt-30.5': !noHeader,
      }"
    >
      <slot />
    </main>
    <div v-if="!noFooter" class="border-t border-neutral-300 mt-10">
      <WidgetFooter
        class="max-w-(--ui-container) mx-auto px-4 pt-4"
        :class="{ 'mb-32 lg:mb-2': !noBottomNavigation }"
      />
    </div>

    {{ hidden && hideBottomNavigationByScroll }}
    <WidgetBottomNavigation
      v-if="!noBottomNavigation"
      class="with-transition"
      :class="{ 'translate-y-18.75': hidden && hideBottomNavigationByScroll }"
    />
  </div>
</template>

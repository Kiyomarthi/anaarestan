<script setup lang="ts">
import { useBreakpoints } from "~/composables/utils/useBreakpoints";

const route = useRoute();
const noHeader = computed(() => route.meta?.noHeader);
const noFooter = computed(() => route.meta?.noFooter);
const navHideTopScroll = computed(() => route.meta?.navHideTopScroll);
const navHideTopScrollMobile = computed(
  () => route.meta?.navHideTopScrollMobile,
);
const noBottomNavigation = computed(() => route.meta?.noBottomNavigation);
const hideBottomNavigationByScroll = computed(
  () => route.meta?.hideBottomNavigationByScroll,
);
const noMargin = computed(() => route.meta?.noMargin);
const { mdAndDown } = useBreakpoints();

const { hidden, scrollY } = useHideScroll(5);
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <WidgetHeader
      v-if="!noHeader"
      class="with-transition fixed top-0 w-full lg:bg-white z-100"
      :class="{
        '-translate-y-full':
          hidden &&
          (navHideTopScroll ? scrollY > (navHideTopScroll as number) : true) &&
          (navHideTopScrollMobile && mdAndDown
            ? scrollY > (navHideTopScrollMobile as number)
            : true),
      }"
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
    <div v-if="!noFooter" class="pt-10 z-10 bg-white">
      <div class="border-t border-neutral-300">
        <WidgetFooter
          class="max-w-(--ui-container) mx-auto px-4 pt-4"
          :class="{ 'mb-32 lg:mb-2': !noBottomNavigation }"
        />
      </div>
    </div>
    <WidgetBottomNavigation
      v-if="!noBottomNavigation"
      class="with-transition"
      :class="{ 'translate-y-18.75': hidden && hideBottomNavigationByScroll }"
    />
  </div>
</template>

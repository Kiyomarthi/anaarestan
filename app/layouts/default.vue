<script setup lang="ts">
const route = useRoute();
const noHeader = computed(() => route.meta?.noHeader);
const noFooter = computed(() => route.meta?.noFooter);
const noBottomNavigation = computed(() => route.meta?.noFooter);
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <WidgetHeader v-if="!noHeader" />
    <main class="flex-1">
      <slot />
    </main>
    <!-- <WidgetFooter v-if="!noFooter" /> -->
    <WidgetBottomNavigation v-if="!noBottomNavigation"  />
  </div>
</template>

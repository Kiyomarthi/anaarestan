<script setup lang="ts">
const route = useRoute();
const noHeader = route.meta?.noHeader;
const noFooter = route.meta?.noFooter;
</script>

<template>
  <div>
    <header v-if="!noHeader">header</header>
    <main>
      <slot />
    </main>
    <footer v-if="!noFooter">footer</footer>
  </div>
</template>

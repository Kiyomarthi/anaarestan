<script setup lang="ts">
///// imports /////

///// page meta /////
definePageMeta({
  ssr: false,
  pageTransition: { name: "fade", mode: "out-in" },
});

///// props/emits /////

///// refs /////

///// composables/stores /////

///// computed /////

///// functions /////

///// watchers /////

///// lifecycle /////
</script>

<template>
  <div class="max-w-(--ui-container) mx-auto px-4 py-4 lg:py-6">
    <h1 class="text-h1 mb-4 lg:mb-6">سبد خرید</h1>
    <ModelCheckoutCart />
  </div>
</template>

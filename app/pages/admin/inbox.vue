<script setup lang="ts">
///// imports /////

///// page meta /////
definePageMeta({
  layout: "admin",
});
///// props/emits /////

///// refs /////
const file = ref(null);

///// composables/stores /////

///// computed /////

///// watchers /////

///// functions /////

///// lifecycle /////
</script>

<template>
  <div>
    <BaseUploader v-model="file" class="p-5 max-w-100" />
  </div>
</template>

<script setup lang="ts">
///// imports /////

///// page meta /////
definePageMeta({
  noHeader: true,
  noFooter: true,
  noBottomNavigation: true,
});

///// props/emits /////

///// refs /////
const router = useRouter();

///// composables/stores /////

///// computed /////

///// watchers /////

///// functions /////
const redirect = () => {
  router.replace("/admin");
};

///// lifecycle /////
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4 w-dvw h-dvh">
    <UPageCard class="w-full max-w-md">
      <modelAuthPass noOtp @on:login="redirect" />
    </UPageCard>
  </div>
</template>

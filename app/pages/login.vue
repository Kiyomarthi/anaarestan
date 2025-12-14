<script setup lang="ts">
definePageMeta({
  noHeader: true,
  noFooter: true,
  noBottomNavigation: true,
  middleware: "auth",
});

const router = useRouter();

const handleLogin = () => {
  router.replace("/");
};
</script>

<template>
  <div
    class="flex flex-col items-center justify-center gap-4 p-4 h-dvh overflow-hidden"
  >
    <UPageCard class="w-full max-w-md">
      <modelAuthLoginFlow @on:login="handleLogin" />
    </UPageCard>
  </div>
</template>

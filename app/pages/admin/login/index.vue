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
const user = useUserStore();

///// composables/stores /////

///// computed /////

///// watchers /////

///// functions /////
const redirect = () => {
  if (user.isAdmin) router.replace("/admin");
  else router.replace("/");
};

///// lifecycle /////
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4 w-dvw h-dvh">
    <UPageCard class="w-full max-w-md">
      <template #header>
        <UButton
          variant="ghost"
          color="neutral"
          icon="i-lucide-arrow-right"
          :ui="{
            base: 'absolute right-3 top-3',
          }"
          @click="$router.back()"
        />
      </template>
      <modelAuthPass noOtp @on:login="redirect" />
    </UPageCard>
  </div>
</template>

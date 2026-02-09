<template>
  <u-app :locale="fa_ir" :toaster="toaster">
    <nuxt-pwa-manifest />
    <div class="bg-default" data-vaul-drawer-wrapper>
      <NuxtLoadingIndicator color="#cc2d33" :height="4" />
      <nuxt-layout>
        <nuxt-page />
      </nuxt-layout>
    </div>
  </u-app>
</template>
<script setup lang="ts">
import { fa_ir } from "@nuxt/ui/locale";
import { useBreakpoints } from "./composables/utils/useBreakpoints";
const route = useRoute();
const router = useRouter();
const user = useUserStore();

const { lgAndUp } = useBreakpoints();

const toaster = {
  position: lgAndUp.value ? "bottom-right" : "top-center",
};

watch(
  () => user.modal,
  (open) => {
    if (!open && route.hash === "#auth") {
      router.replace({ hash: "", path: route.path, query: route.query });
    }
    if (open && route.hash !== "#auth") {
      router.push({ hash: "#auth", path: route.path, query: route.query });
    }
  },
);

watch(
  () => route.hash,
  (hash) => {
    if (user.isLoggedIn()) {
      user.modal = false;
      router.replace({ hash: "", path: route.path, query: route.query });
    }

    user.modal = hash === "#auth";
  },
  { immediate: true },
);
</script>

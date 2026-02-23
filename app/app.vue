<template>
  <u-app :locale="fa_ir" :toaster="toaster">
    <nuxt-pwa-manifest />
    <div class="bg-default" data-vaul-drawer-wrapper>
      <NuxtLoadingIndicator color="#cc2d33" :height="4" />
      <nuxt-layout>
        <nuxt-page />
        <WidgetResponseModal
          v-model:open="user.modal"
          :header-class="!user.alert ? 'hidden!' : ''"
          :noClose="user.isRequired"
        >
          <template v-if="user.alert" #title>
            <div class="px-8">
              <UAlert
                :title="user.alert"
                icon="i-lucide-info"
                color="info"
                variant="subtle"
              />
            </div>
          </template>
          <ModelAuthLoginFlow />
        </WidgetResponseModal>
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
</script>

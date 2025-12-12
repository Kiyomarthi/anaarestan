<template>
  <u-app :locale="fa_ir">
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
</script>

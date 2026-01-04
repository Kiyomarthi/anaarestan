<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const items: NavigationMenuItem[] = [
  {
    label: "Figma Kit",
    to: "https://go.nuxt.com/figma-ui",
    target: "_blank",
  },
  {
    label: "Playground",
    to: "https://stackblitz.com/edit/nuxt-ui",
    target: "_blank",
  },
  {
    label: "Releases",
    to: "https://github.com/nuxt/ui/releases",
    target: "_blank",
  },
];
</script>

<template>
  <UFooter>
    <template #left>
      <p class="text-muted text-sm">
        Copyright © {{ new Date().getFullYear() }}
      </p>
    </template>

    <UNavigationMenu :items="items" variant="link" />

    <template #right>
      <a
        referrerpolicy="origin"
        target="_blank"
        href="https://trustseal.enamad.ir/?id=689420&Code=TYwmi73C2FCMfKGzrnyFyy4dZ35kJLZd"
        ><img
          referrerpolicy="origin"
          src="https://trustseal.enamad.ir/logo.aspx?id=689420&Code=TYwmi73C2FCMfKGzrnyFyy4dZ35kJLZd"
          alt=""
          style="cursor: pointer"
          code="TYwmi73C2FCMfKGzrnyFyy4dZ35kJLZd"
          loading="lazy"
          fetchPriority="low"
      /></a>
      <UButton
        icon="i-simple-icons-discord"
        color="neutral"
        variant="ghost"
        to="https://go.nuxt.com/discord"
        target="_blank"
        aria-label="Discord"
      />
      <UButton
        icon="i-simple-icons-x"
        color="neutral"
        variant="ghost"
        to="https://go.nuxt.com/x"
        target="_blank"
        aria-label="X"
      />
      <UButton
        icon="i-simple-icons-github"
        color="neutral"
        variant="ghost"
        to="https://github.com/nuxt/nuxt"
        target="_blank"
        aria-label="GitHub"
      />
    </template>
  </UFooter>
</template>

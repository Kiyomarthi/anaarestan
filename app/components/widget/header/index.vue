<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import { useBreakpoints } from "~/composables/utils/useBreakpoints";

///// imports /////

///// page meta /////

///// props/emits /////

///// refs /////
const route = useRoute();
const userStore = useUserStore();
const isAdmin = !!userStore.user && (userStore.user as any).role === "admin";
const { smAndDown } = useBreakpoints();

const items = computed<NavigationMenuItem[]>(() => [
  userStore.isLoggedIn
    ? {
        label: "پنل کاربری",
        to: "/docs/getting-started",
        icon: "i-lucide-layout-dashboard",
        active: route.path.startsWith("/docs/getting-started"),
      }
    : {},
  isAdmin
    ? {
        label: "پنل ادمین",
        to: "/admin",
        icon: "i-lucide-user-star",
        active: route.path.startsWith("/admin"),
      }
    : {},
]);

///// composables/stores /////

///// computed /////

///// watchers /////

///// functions /////

///// lifecycle /////
</script>

<template>
  <UHeader>
    <template #title> انارستان </template>

    <UNavigationMenu :items="items" />

    <template #right>
      <UButton
        v-if="userStore.isLoggedIn"
        color="neutral"
        variant="ghost"
        to="/panel"
        class="flex items-center gap-2"
        icon="i-lucide-user"
      >
      </UButton>
      <UButton
        v-else
        color="neutral"
        variant="outline"
        to="/login"
        class="flex items-center gap-2"
      >
        <span>ورود</span>
        <span class="text-gray-400">|</span>
        <span>ثبت‌نام</span>
      </UButton>
    </template>

    <template #body>
      <UNavigationMenu
        :items="items"
        orientation="vertical"
        toggleSide="right"
        class="-mx-2.5"
      />
    </template>
    <template #toggle="{ open }">
      <UDrawer
        v-if="smAndDown"
        direction="left"
        should-scale-background
        set-background-color-on-scale
        :ui="{
          content: 'min-w-[80%] p-3',
          handle: 'hidden!',
        }"
      >
        <UButton
          color="neutral"
          variant="link"
          :trailing-icon="open ? 'i-lucide-x' : 'i-lucide-menu'"
        />

        <template #content>
          <div class="w-full">
            <UNavigationMenu
              :items="items"
              orientation="vertical"
              :ui="{
                list: 'space-y-2',
                item: 'rounded-xl border border-gray-200 hover:bg-gray-100 with-transition px-4 py-3',
                link: 'flex items-center gap-3 font-medium',
              }"
            />
          </div>
        </template>
      </UDrawer>
    </template>
  </UHeader>
</template>

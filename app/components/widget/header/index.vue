<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import { useBreakpoints } from "~/composables/utils/useBreakpoints";

///// imports /////

///// page meta /////

///// props/emits /////

///// refs /////
const route = useRoute();
const userStore = useUserStore();
const config = useRuntimeConfig();

const { smAndDown, mdAndUp } = useBreakpoints();

const items = computed<NavigationMenuItem[]>(() =>
  [
    userStore.isLoggedIn && {
      label: "پنل کاربری",
      to: "/docs/getting-started",
      icon: "i-lucide-layout-dashboard",
      active: route.path.startsWith("/docs/getting-started"),
    },
    userStore.isAdmin && {
      label: "پنل ادمین",
      to: "/admin",
      icon: "i-lucide-user-star",
      active: route.path.startsWith("/admin"),
    },
  ].filter(Boolean)
);

///// composables/stores /////

///// computed /////

///// watchers /////

///// functions /////

///// lifecycle /////
</script>

<template>
  <UHeader
    :ui="{
      root: 'h-max max-h-none py-2',
      center: 'flex-1',
    }"
  >
    <template #title>
      <base-image
        src="/images/logo.avif"
        :width="70"
        preload
        loading="eager"
        fetchPriority="high"
        :alt="config.public.siteNameFa || 'انارستان'"
        sizes="70px"
        class="size-17.5 aspect-auto"
      />
    </template>

    <ModelSearch />

    <template #right>
      <div class="flex items-center gap-3">
        <UPopover v-if="userStore.isLoggedIn" mode="hover">
          <UButton
            color="neutral"
            variant="ghost"
            to="/panel"
            class="flex items-center gap-2"
            icon="i-lucide-user"
          >
          </UButton>

          <template #content>
            <div v-if="mdAndUp" class="p-3">
              <UNavigationMenu
                :items="items"
                orientation="vertical"
                :ui="{
                  list: 'space-y-2',
                  item: 'rounded-xl border border-gray-300 hover:bg-gray-100 with-transition min-w-[200px]',
                  link: 'flex items-center gap-3 font-medium px-4 py-3',
                }"
              />
            </div>
          </template>
        </UPopover>
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
      </div>
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
                item: 'rounded-xl border border-gray-300 hover:bg-gray-100 with-transition px-4 py-3',
                link: 'flex items-center gap-3 font-medium',
              }"
            />
          </div>
        </template>
      </UDrawer>
    </template>
  </UHeader>
</template>

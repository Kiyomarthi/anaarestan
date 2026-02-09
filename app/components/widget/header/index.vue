<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import { useBreakpoints } from "~/composables/utils/useBreakpoints";
import type { ApiResponse, Category } from "~~/shared/types/api";

///// imports /////

///// page meta /////

///// props/emits /////

///// refs /////
const route = useRoute();
const userStore = useUserStore();
const config = useRuntimeConfig();

const { smAndDown, lgAndUp } = useBreakpoints();

const items = computed<NavigationMenuItem[]>(() =>
  [
    !userStore.isLoggedIn && {
      label: "ورد یا ثبت نام",
      to: "/login",
      icon: "i-lucide-log-in",
      active: route.path.startsWith("/docs/getting-started"),
    },
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
    userStore.isAdmin && {
      label: "خروج",
      icon: "i-lucide-log-out",
      active: route.path.startsWith("/admin"),
      action: userStore.logOut,
    },
  ].filter(Boolean),
);

///// composables/stores /////
const {
  fetch: fetchCategory,
  loading: loadingCategory,
  data: dataCategory,
} = useCacheFetch<ApiResponse<Category>>();

await fetchCategory("/api/categories", {
  headers: {
    cache: "true",
  },
  params: {
    noPaginate: "true",
  },
});

///// computed /////

///// watchers /////

///// functions /////

///// lifecycle /////
</script>

<template>
  <div>
    <UHeader
      :ui="{
        root: 'h-max max-h-none py-2 static!',
        center: 'flex-1 block',
      }"
    >
      <template #title>
        <base-image
          src="/images/logo.avif"
          :width="50"
          preload
          provider="none"
          loading="eager"
          fetchPriority="high"
          :alt="config.public.siteNameFa || 'انارستان'"
          sizes="50px"
          class="size-12.5 aspect-auto"
        />
      </template>

      <ModelSearch />

      <template #right>
        <div v-if="lgAndUp" class="flex items-center gap-3">
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
              <div v-if="lgAndUp" class="p-3">
                <UNavigationMenu
                  :items="items"
                  orientation="vertical"
                  :ui="{
                    list: 'space-y-2',
                    item: 'rounded-xl border border-gray-300 hover:bg-gray-100 with-transition min-w-50',
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
            icon="i-lucide-log-in"
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
    <div>
      <nav
        v-if="lgAndUp"
        class="py-2 max-w-(--ui-container) w-full mx-auto border-b border-gray-300"
      >
        <UPopover
          v-for="(item, index) in (dataCategory?.data as Category[]) ?? []"
          :key="index"
          arrow
          :items="dataCategory?.data"
          labelKey="name"
          mode="hover"
          :open-delay="0"
          :close-delay="0"
          :ui="{
            content: [!item?.children?.length && 'hidden'],
          }"
        >
          <UButton
            :label="item?.name ?? ''"
            color="default"
            variant="ghost"
            :to="`/products/list/${item.id}/${item.slug}`"
          />
          <template v-if="item?.children?.length" #content>
            <div class="w-max p-2 px-4">
              <widget-category-children :categories="item?.children" />
            </div>
          </template>
        </UPopover>
      </nav>
    </div>
  </div>
</template>

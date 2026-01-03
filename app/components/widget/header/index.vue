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

const { smAndDown, mdAndUp } = useBreakpoints();

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
  ].filter(Boolean)
);

const categoryItems = ref([
  {
    label: "Guide",
    icon: "i-lucide-book-open",
    to: "/docs/getting-started",
    children: [
      {
        label: "Introduction",
        description: "Fully styled and customizable components for Nuxt.",
        icon: "i-lucide-house",
      },
      {
        label: "Installation",
        description:
          "Learn how to install and configure Nuxt UI in your application.",
        icon: "i-lucide-cloud-download",
      },
      {
        label: "Icons",
        icon: "i-lucide-smile",
        description:
          "You have nothing to do, @nuxt/icon will handle it automatically.",
      },
      {
        label: "Colors",
        icon: "i-lucide-swatch-book",
        description:
          "Choose a primary and a neutral color from your Tailwind CSS theme.",
      },
      {
        label: "Theme",
        icon: "i-lucide-cog",
        description:
          "You can customize components by using the `class` / `ui` props or in your app.config.ts.",
      },
    ],
  },
  {
    label: "Composables",
    icon: "i-lucide-database",
    to: "/docs/composables",
    children: [
      {
        label: "defineShortcuts",
        icon: "i-lucide-file-text",
        description: "Define shortcuts for your application.",
        to: "/docs/composables/define-shortcuts",
      },
      {
        label: "useOverlay",
        icon: "i-lucide-file-text",
        description: "Display a modal/slideover within your application.",
        to: "/docs/composables/use-overlay",
      },
      {
        label: "useToast",
        icon: "i-lucide-file-text",
        description: "Display a toast within your application.",
        to: "/docs/composables/use-toast",
      },
    ],
  },
  {
    label: "Components",
    icon: "i-lucide-box",
    to: "/docs/components",
    children: [
      {
        label: "Link",
        icon: "i-lucide-file-text",
        description: "Use NuxtLink with superpowers.",
        to: "/docs/components/link",
      },
      {
        label: "Modal",
        icon: "i-lucide-file-text",
        description: "Display a modal within your application.",
        to: "/docs/components/modal",
      },
      {
        label: "NavigationMenu",
        icon: "i-lucide-file-text",
        description: "Display a list of links.",
        to: "/docs/components/navigation-menu",
      },
      {
        label: "Pagination",
        icon: "i-lucide-file-text",
        description: "Display a list of pages.",
        to: "/docs/components/pagination",
      },
      {
        label: "Popover",
        icon: "i-lucide-file-text",
        description:
          "Display a non-modal dialog that floats around a trigger element.",
        to: "/docs/components/popover",
      },
      {
        label: "Progress",
        icon: "i-lucide-file-text",
        description: "Show a horizontal bar to indicate task progression.",
        to: "/docs/components/progress",
      },
    ],
  },
  {
    label: "GitHub",
    icon: "i-simple-icons-github",
    badge: "3.8k",
    to: "https://github.com/nuxt/ui",
    target: "_blank",
  },
  {
    label: "Help",
    icon: "i-lucide-circle-help",
    disabled: true,
  },
]);

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
  <UHeader
    :ui="{
      root: 'h-max max-h-none py-2',
      center: 'flex-1 block',
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
      <div v-if="mdAndUp" class="flex items-center gap-3">
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
  <div v-if="mdAndUp" class="py-2 border-b border-default">
    <UPopover
      v-for="(item, index) in dataCategory?.data as Category[] ?? []"
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
        :to="`/categories/${item.code}/${item.slug}`"
      />
      <template v-if="item?.children?.length" #content>
        <div class="w-max p-4 px-6">
          <widget-category-children :categories="item?.children" />
        </div>
      </template>
    </UPopover>
  </div>
</template>

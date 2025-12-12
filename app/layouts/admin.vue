<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import { routerKey } from "vue-router";
import { useBreakpoints } from "~/composables/utils/useBreakpoints";

const { mdAndDown } = useBreakpoints();
const userStore = useUserStore();
const router = useRouter();

const logout = () => {
  userStore.logOut();
  router.replace("/");
};

const items: NavigationMenuItem[][] = [
  [
    {
      label: "خانه",
      icon: "i-lucide-house",
      to: "/admin",
    },
    {
      label: "اعلان‌ها",
      icon: "i-lucide-inbox",
      badge: "4",
      to: "/admin/inbox",
    },
    {
      label: "کاربران",
      icon: "i-lucide-users",
      to: "/admin/users",
    },
    {
      label: "داده‌ها",
      icon: "i-lucide-box",
      defaultOpen: true,
      children: [
        {
          label: "محصولات",
          to: "/admin/products",
        },
        {
          label: "دسته بندی‌ها",
          to: "/admin/categories",
        },
        {
          label: "ویژگی‌ها",
          to: "/admin/attributes",
        },
      ],
    },
    {
      label: "محتوا",
      icon: "i-lucide-letter-text",
      children: [
        {
          label: "صفحه خانه",
          to: "/admin/seo/home",
        },
      ],
    },
    {
      label: "تنظیمات",
      icon: "i-lucide-settings",
      children: [
        {
          label: "عمومی",
          to: "/admin/settings/general",
        },
      ],
    },
  ],
  [
    {
      label: "خروج از حساب کاربری",
      icon: "i-lucide-log-out",
      slot: "logout",
    },
  ],
];
</script>

<template>
  <div>
    <!-- <header>header</header> -->
    <main>
      <UDashboardGroup>
        <UDashboardSidebar
          collapsible
          :ui="{
            root: 'min-w-[250px]',
          }"
          open
          :toggle="{
            color: 'primary',
            variant: 'subtle',
            class: 'rounded-full',
          }"
        >
          <template #header="{ collapsed }">
            <UButton
              icon="i-lucide-user"
              :label="
                userStore.user?.full_name ??
                userStore.user?.phone ??
                'پنل ادمین'
              "
              color="neutral"
              variant="ghost"
              class="w-full"
              :block="collapsed"
            />
          </template>

          <template #default="{ collapsed }">
            <UNavigationMenu
              :collapsed="collapsed"
              :items="items[0]"
              orientation="vertical"
            />

            <UNavigationMenu
              :collapsed="collapsed"
              :items="items[1]"
              orientation="vertical"
              class="mt-auto"
            >
              <template #logout>
                <UButton
                  icon="i-lucide-log-out"
                  label="خروج از حساب کاربری"
                  variant="ghost"
                  @click="logout"
                />
              </template>
            </UNavigationMenu>
          </template>
        </UDashboardSidebar>

        <UDashboardPanel v-if="mdAndDown">
          <template #header>
            <UDashboardNavbar title="پنل ادمین" />
          </template>
          <template #body>
            <div class="md:overflow-auto">
              <slot />
            </div>
          </template>
        </UDashboardPanel>
        <div v-else class="flex-1 md:overflow-auto">
          <slot />
        </div>
      </UDashboardGroup>
    </main>
  </div>
</template>

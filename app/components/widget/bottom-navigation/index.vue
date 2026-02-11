<script setup lang="ts">
const route = useRoute();

const user = useUserStore();

const navItems = [
  {
    label: "خانه",
    icon: "i-lucide-home",
    href: "/",
  },
  {
    label: "دسته‌بندی",
    icon: "i-lucide-layout-grid",
    href: "/categories",
  },
  {
    label: "سبد خرید",
    icon: "i-lucide-shopping-cart",
    href: "/cart",
  },
  {
    label: "پروفایل",
    icon: "i-lucide-user",
    href: user.isLoggedIn ? "/panel" : "/login",
  },
];

const isActive = (href: string) => {
  return route.path === href;
};
</script>

<template>
  <WidgetGlass
    :ui="{
      container:
        'fixed bottom-4 left-4 right-4 z-50 rounded-[30px] lg:hidden bg-white/50',
    }"
  >
    <nav class="flex items-center gap-1 justify-around">
      <NuxtLink
        v-for="item in navItems"
        :key="item.href"
        :to="item.href"
        :class="[
          'flex flex-col flex-1 items-center justify-center gap-1 px-4 py-2 rounded-[30px] transition-colors',
          isActive(item.href)
            ? 'text-primary-500 bg-primary-100/50'
            : 'text-black hover:text-primary-500',
        ]"
      >
        <UIcon :name="item.icon" class="text-xl" />
        <span class="text-xs font-medium text-center">{{ item.label }}</span>
      </NuxtLink>
    </nav>
  </WidgetGlass>
</template>

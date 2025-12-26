<script setup lang="ts">
const route = useRoute();

const navItems = [
  {
    label: "خانه",
    icon: "i-heroicons-home",
    href: "/",
  },
  {
    label: "دسته‌بندی",
    icon: "i-heroicons-squares-2x2",
    href: "/categories",
  },
  {
    label: "سبد خرید",
    icon: "i-heroicons-shopping-cart",
    href: "/cart",
  },
  {
    label: "پروفایل",
    icon: "i-heroicons-user",
    href: "/profile",
  },
];

const isActive = (href: string) => {
  return route.path === href;
};
</script>

<template>
  <nav
    class="fixed bottom-4 left-4 right-4 z-50 md:hidden"
    style="backdrop-filter: blur(10px); background: rgba(255, 255, 255, 0.9);"
  >
    <div class="flex items-center justify-around rounded-2xl shadow-lg border border-gray-300 p-2">
      <NuxtLink
        v-for="item in navItems"
        :key="item.href"
        :to="item.href"
        :class="[
          'flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-colors',
          isActive(item.href)
            ? 'text-primary-500 bg-primary-50'
            : 'text-gray-600 hover:text-primary-500',
        ]"
      >
        <UIcon :name="item.icon" class="text-xl" />
        <span class="text-xs font-medium">{{ item.label }}</span>
      </NuxtLink>
    </div>
  </nav>
</template>


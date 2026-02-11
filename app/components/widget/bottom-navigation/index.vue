<script setup lang="ts">
const route = useRoute();

const user = useUserStore();
const model = ref<string>(route.path);

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

watch(
  () => route.path,
  (val) => {
    model.value = val;
  },
);
</script>

<template>
  <WidgetGlass
    :ui="{
      container:
        'fixed bottom-4 left-4 right-4 z-50 rounded-[30px] lg:hidden bg-white/50',
    }"
  >
    <nav class="flex items-center gap-1 justify-around">
      <UButton
        v-for="item in navItems"
        :key="item.href"
        :to="item.href"
        variant="link"
        :ui="{
          base: [
            'flex flex-col flex-1 items-center justify-center gap-1 px-4 py-2 rounded-[30px]',
            'transition-all duration-300 ease-out relative z-2',
            model === item.href
              ? 'text-primary-500'
              : 'text-black hover:text-primary-500 scale-95',
          ],
        }"
        @click="model = item.href"
      >
        <UIcon
          :name="item.icon"
          class="text-xl transition-all relative z-2 duration-300"
        />
        <span
          class="text-xs font-medium text-center transition-all relative z-2 duration-300"
        >
          {{ item.label }}
        </span>
        <div
          :class="[
            'absolute top-0 left-0 rounded-[30px] size-full transition-all duration-300 ease-out',
            model === item.href
              ? 'text-primary-500 bg-primary-100/50 scale-100 opacity-100'
              : 'text-black hover:text-primary-500 scale-30 opacity-0',
          ]"
        />
      </UButton>
    </nav>
  </WidgetGlass>
</template>

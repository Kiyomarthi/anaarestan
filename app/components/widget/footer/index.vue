<script setup lang="ts">
const { data: categories } = useApiFetch<{
  success: boolean;
  data: any[];
}>("/api/categories", {
  query: { noPaginate: true },
});

const footerLinks = [
  {
    title: "دسترسی سریع",
    links: [
      { label: "صفحه اصلی", href: "/" },
      { label: "درباره ما", href: "/about" },
      { label: "تماس با ما", href: "/contact" },
      { label: "سوالات متداول", href: "/faq" },
    ],
  },
  {
    title: "خدمات مشتریان",
    links: [
      { label: "راهنمای خرید", href: "/help" },
      { label: "روش‌های پرداخت", href: "/payment" },
      { label: "شرایط بازگشت", href: "/return" },
      { label: "حریم خصوصی", href: "/privacy" },
    ],
  },
];
</script>

<template>
  <footer class="bg-gray-900 text-white mt-16">
    <div class="container mx-auto px-4 py-12">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <!-- About -->
        <div>
          <h3 class="text-xl font-bold mb-4">انارستان</h3>
          <p class="text-gray-400 text-sm">
            فروشگاه آنلاین انارستان، ارائه کننده بهترین محصولات با کیفیت
            عالی و قیمت مناسب
          </p>
        </div>

        <!-- Quick Links -->
        <div v-for="section in footerLinks" :key="section.title">
          <h4 class="text-lg font-semibold mb-4">{{ section.title }}</h4>
          <ul class="space-y-2">
            <li v-for="link in section.links" :key="link.href">
              <NuxtLink
                :to="link.href"
                class="text-gray-400 hover:text-white text-sm transition-colors"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Categories -->
        <div v-if="categories?.data">
          <h4 class="text-lg font-semibold mb-4">دسته‌بندی‌ها</h4>
          <ul class="space-y-2">
            <li
              v-for="category in categories.data.slice(0, 6)"
              :key="category.id"
            >
              <NuxtLink
                :to="`/category/${category.slug}`"
                class="text-gray-400 hover:text-white text-sm transition-colors"
              >
                {{ category.name }}
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="border-t border-gray-800 mt-8 pt-8">
        <div class="flex flex-col md:flex-row items-center justify-between gap-4">
          <p class="text-gray-400 text-sm text-center">
            © {{ new Date().getFullYear() }} انارستان. تمامی حقوق محفوظ است.
          </p>
          <div class="flex items-center gap-4">
            <a
              href="#"
              class="text-gray-400 hover:text-white transition-colors"
              aria-label="اینستاگرام"
            >
              <UIcon name="i-simple-icons-instagram" class="text-xl" />
            </a>
            <a
              href="#"
              class="text-gray-400 hover:text-white transition-colors"
              aria-label="تلگرام"
            >
              <UIcon name="i-simple-icons-telegram" class="text-xl" />
            </a>
            <a
              href="#"
              class="text-gray-400 hover:text-white transition-colors"
              aria-label="واتساپ"
            >
              <UIcon name="i-simple-icons-whatsapp" class="text-xl" />
            </a>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>


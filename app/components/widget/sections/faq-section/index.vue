<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    faqs?: Array<{
      id: number;
      question: string;
      answer: string;
    }>;
  }>(),
  {
    faqs: () => [
      {
        id: 1,
        question: "چگونه می‌توانم سفارش خود را ثبت کنم؟",
        answer:
          "شما می‌توانید با انتخاب محصول مورد نظر و افزودن آن به سبد خرید، سفارش خود را ثبت کنید.",
      },
      {
        id: 2,
        question: "روش‌های پرداخت چیست؟",
        answer:
          "ما روش‌های مختلف پرداخت از جمله پرداخت آنلاین، کارت به کارت و پرداخت در محل را پشتیبانی می‌کنیم.",
      },
      {
        id: 3,
        question: "زمان ارسال چقدر است؟",
        answer:
          "زمان ارسال بسته به شهر مقصد متفاوت است و معمولاً بین 2 تا 5 روز کاری است.",
      },
      {
        id: 4,
        question: "آیا امکان بازگشت کالا وجود دارد؟",
        answer: "بله، در صورت وجود مشکل در کالا، می‌توانید آن را بازگردانید.",
      },
    ],
  }
);

const openItems = ref<number[]>([]);

function toggleItem(id: number) {
  const index = openItems.value.indexOf(id);
  if (index > -1) {
    openItems.value.splice(index, 1);
  } else {
    openItems.value.push(id);
  }
}

const isOpen = (id: number) => openItems.value.includes(id);
</script>

<template>
  <section class="mb-12">
    <div class="container mx-auto px-4">
      <h2 class="text-2xl font-bold mb-6">سوالات متداول</h2>
      <div class="space-y-2">
        <BaseCard v-for="faq in faqs" :key="faq.id" class="p-4" :hover="false">
          <UButton
            :variant="'ghost'"
            color="neutral"
            class="w-full justify-between p-0 h-auto"
            @click="toggleItem(faq.id)"
          >
            <h3 class="font-semibold text-right">{{ faq.question }}</h3>
            <UIcon
              :name="
                isOpen(faq.id)
                  ? 'i-heroicons-chevron-up'
                  : 'i-heroicons-chevron-down'
              "
              class="text-gray-400"
            />
          </UButton>
          <div
            v-show="isOpen(faq.id)"
            class="mt-3 pt-3 border-t border-gray-200"
          >
            <p class="text-gray-600 text-sm leading-relaxed">
              {{ faq.answer }}
            </p>
          </div>
        </BaseCard>
      </div>
    </div>
  </section>
</template>

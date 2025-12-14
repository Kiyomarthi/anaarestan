<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title?: string;
    content?: string;
  }>(),
  {
    title: "درباره انارستان",
    content: `انارستان یک فروشگاه آنلاین معتبر است که با ارائه بهترین محصولات و خدمات، رضایت مشتریان را در اولویت قرار داده است. ما با سال‌ها تجربه در زمینه فروش آنلاین، تلاش می‌کنیم تا بهترین تجربه خرید را برای شما فراهم کنیم.

محصولات ما شامل طیف گسترده‌ای از کالاهای مختلف است که با کیفیت بالا و قیمت مناسب ارائه می‌شوند. تیم پشتیبانی ما همیشه آماده پاسخگویی به سوالات و حل مشکلات شماست.

ما به کیفیت محصولات و رضایت مشتریان متعهد هستیم و همواره در تلاشیم تا خدمات بهتری ارائه دهیم.`,
  }
);

const isExpanded = ref(false);
const maxLength = 200;

const displayContent = computed(() => {
  if (isExpanded.value || props.content.length <= maxLength) {
    return props.content;
  }
  return props.content.substring(0, maxLength) + "...";
});
</script>

<template>
  <section class="mb-12">
    <div class="container mx-auto px-4">
      <BaseCard class="p-6">
        <h2 class="text-2xl font-bold mb-4">{{ title }}</h2>
        <div class="text-gray-700 leading-relaxed whitespace-pre-line">
          {{ displayContent }}
        </div>
        <UButton
          v-if="props.content.length > maxLength"
          color="primary"
          variant="ghost"
          class="mt-4"
          @click="isExpanded = !isExpanded"
        >
          {{ isExpanded ? "کمتر" : "بیشتر" }}
          <template #trailing>
            <UIcon
              :name="
                isExpanded
                  ? 'i-heroicons-chevron-up'
                  : 'i-heroicons-chevron-down'
              "
            />
          </template>
        </UButton>
      </BaseCard>
    </div>
  </section>
</template>

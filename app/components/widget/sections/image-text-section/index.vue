<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    image?: string;
    title?: string;
    text?: string;
    reverse?: boolean;
  }>(),
  {
    image: "/images/about.jpg",
    title: "درباره انارستان",
    text: "انارستان یک فروشگاه آنلاین معتبر است که با ارائه بهترین محصولات و خدمات، رضایت مشتریان را در اولویت قرار داده است.",
    reverse: false,
  }
);
</script>

<template>
  <section class="mb-12">
    <div class="container mx-auto px-4">
      <div
        :class="[
          'grid grid-cols-1 md:grid-cols-2 gap-8 items-center',
          reverse ? 'md:flex-row-reverse' : '',
        ]"
      >
        <div :class="[reverse ? 'md:order-2' : 'md:order-1']">
          <BaseImage
            :src="image"
            :alt="title"
            class="rounded-lg"
            :loading="'lazy'"
          />
        </div>
        <div :class="[reverse ? 'md:order-1' : 'md:order-2']">
          <h2 class="text-3xl font-bold mb-4">{{ title }}</h2>
          <p class="text-gray-600 leading-relaxed">{{ text }}</p>
        </div>
      </div>
    </div>
  </section>
</template>


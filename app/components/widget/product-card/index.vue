<script setup lang="ts">
import { twMerge } from "tailwind-merge";

type Product = {
  id: number;
  title: string;
  slug: string;
  price: string | number;
  discount_price?: string | number | null;
  image: string;
  code: string;
  stock?: number;
};

const props = withDefaults(
  defineProps<{
    product: Product;
    class?: string;
    showDiscount?: boolean;
  }>(),
  {
    class: "",
    showDiscount: true,
  }
);

const emit = defineEmits<{
  click: [product: Product];
}>();

const price = computed(() => Number(props.product.price));
const discountPrice = computed(() =>
  props.product.discount_price ? Number(props.product.discount_price) : null
);

const finalPrice = computed(() => discountPrice.value || price.value);

const discountPercent = computed(() => {
  if (!discountPrice.value) return 0;
  return Math.round(((price.value - discountPrice.value) / price.value) * 100);
});

const formattedPrice = (value: number) => {
  return new Intl.NumberFormat("fa-IR").format(value);
};

function handleClick() {
  emit("click", props.product);
}
</script>

<template>
  <div
    :class="twMerge('group cursor-pointer', props.class)"
    @click="handleClick"
  >
    <BaseCard
      class="h-full flex flex-col"
      :hover="true"
      :padding="false"
      :rounded="true"
    >
      <div class="relative aspect-square overflow-hidden rounded-t-lg">
        <BaseImage
          :src="product.image"
          :alt="product.title"
          class="transition-transform duration-300 group-hover:scale-105"
          :loading="'lazy'"
        />
        <div
          v-if="showDiscount && discountPercent > 0"
          class="absolute top-2 left-2 bg-primary-500 text-white text-xs font-bold px-2 py-1 rounded"
        >
          {{ discountPercent }}%
        </div>
      </div>

      <div class="p-3 flex-1 flex flex-col">
        <h3
          class="text-sm font-medium text-gray-800 line-clamp-2 mb-2 min-h-[2.5rem]"
        >
          {{ product.title }}
        </h3>

        <div class="mt-auto flex items-center gap-2">
          <div class="flex flex-col">
            <span
              v-if="discountPrice"
              class="text-xs text-gray-400 line-through"
            >
              {{ formattedPrice(price) }} تومان
            </span>
            <span class="text-base font-bold text-primary-600">
              {{ formattedPrice(finalPrice) }} تومان
            </span>
          </div>
        </div>
      </div>
    </BaseCard>
  </div>
</template>


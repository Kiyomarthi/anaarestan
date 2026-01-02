<script setup lang="ts">
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

const props = defineProps<{
  product: Product;
}>();

const router = useRouter();

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
</script>

<template>
  <ULink
    class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
    :to="`/products/${props.product.code}/${props.product.slug}`"
  >
    <div class="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden">
      <BaseImage
        :src="product.image"
        :alt="product.title"
        image-class="size-16 object-cover"
        class="w-16"
        :width="64"
        sizes="64px"
        :loading="'lazy'"
      />
      <div
        v-if="discountPercent > 0"
        class="absolute top-1 left-1 bg-primary-500 text-white text-xs font-bold px-1.5 py-0.5 rounded"
      >
        {{ discountPercent }}%
      </div>
    </div>

    <div class="flex-1 min-w-0">
      <h3 class="text-sm font-medium text-gray-800 line-clamp-1 mb-1">
        {{ product.title }}
      </h3>
      <div class="flex items-center gap-2">
        <span v-if="discountPrice" class="text-xs text-gray-400 line-through">
          {{ formattedPrice(price) }}
        </span>
        <span class="text-sm font-bold text-primary-600">
          {{ formattedPrice(finalPrice) }} تومان
        </span>
      </div>
    </div>
  </ULink>
</template>

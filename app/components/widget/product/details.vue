<script setup lang="ts">
///// imports /////

///// props/emits /////
interface ProductAttribute {
  id: number;
  attribute_id: number;
  name: string;
  value: string;
}

const props = defineProps<{
  title: string;
  price: string;
  discountPrice?: string | null;
  attributes?: ProductAttribute[];
  rating?: number;
  ratingCount?: number;
  commentsCount?: number;
  stock?: number;
  isFavorite?: boolean;
  productId?: number;
}>();

///// refs /////

///// composables/stores /////

///// computed /////
const finalPrice = computed(() => {
  const discount = props.discountPrice ? Number(props.discountPrice) : null;
  const price = Number(props.price);
  return discount || price;
});

const originalPrice = computed(() => {
  if (props.discountPrice) {
    return Number(props.price);
  }
  return Number(props.price);
});

const discountPercent = computed(() => {
  if (!props.discountPrice) return 0;
  return Math.round(
    ((originalPrice.value - finalPrice.value) / originalPrice.value) * 100,
  );
});

const formattedPrice = (value: number) => {
  return new Intl.NumberFormat("fa-IR").format(value);
};

const displayAttributes = computed(() => {
  return props.attributes?.slice(0, 4) || [];
});

const isInStock = computed(() => {
  return (props.stock || 0) > 0;
});

///// functions /////
const share = async () => {
  if (navigator.share) {
    await navigator.share({
      title: document.title,
      url: window.location.href,
    });
  } else {
    navigator.clipboard.writeText(window.location.href);
    const toast = useToast();
    toast.add({
      title: "کپی شد",
      description: "آدرس صفحه در کلیپ‌بورد کپی شد",
      color: "success",
    });
  }
};

///// watchers /////

///// lifecycle /////
</script>

<template>
  <div class="space-y-4">
    <div>
      <h1 class="text-h4 font-bold mb-4">
        {{ title }}
      </h1>

      <!-- Rating and Comments -->
      <div v-if="rating || commentsCount" class="flex items-center gap-4 mb-4">
        <div v-if="rating" class="flex items-center gap-1">
          <UIcon name="i-ph-star-fill" class="text-yellow-500 size-5" />
          <span class="text-sm font-medium">{{ rating.toFixed(1) }}</span>
          <span v-if="ratingCount" class="text-sm text-gray-500">
            ({{ ratingCount }})
          </span>
        </div>
        <div
          v-if="commentsCount"
          class="flex items-center gap-1 text-sm text-gray-600"
        >
          <UIcon name="i-lucide-message-circle" class="size-4" />
          <span>{{ commentsCount }} نظر</span>
        </div>
        <UButton
          icon="i-lucide-share-2"
          color="gray"
          variant="ghost"
          @click="share"
        />
        <WidgetProductFavoriteButton
          v-if="productId"
          :product-id
          :is-favorite
        />
      </div>

      <!-- Price -->
      <div class="flex items-center gap-3 mb-4">
        <div class="flex flex-col">
          <div v-if="discountPrice" class="text-sm text-gray-400 line-through">
            {{ formattedPrice(originalPrice) }} تومان
          </div>
          <div class="text-2xl lg:text-3xl font-bold text-primary-600">
            {{ formattedPrice(finalPrice) }} تومان
          </div>
        </div>
        <div
          v-if="discountPercent > 0"
          class="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded"
        >
          {{ discountPercent }}%
        </div>
      </div>

      <!-- Stock Status -->
      <div class="mb-4">
        <div v-if="isInStock" class="flex items-center gap-2 text-green-600">
          <UIcon name="i-lucide-check-circle" class="size-5" />
          <span class="text-sm font-medium">موجود در انبار</span>
          <span v-if="stock" class="text-sm text-gray-600">
            ({{ stock }} عدد)
          </span>
        </div>
        <div v-else class="flex items-center gap-2 text-red-600">
          <UIcon name="i-lucide-x-circle" class="size-5" />
          <span class="text-sm font-medium">ناموجود</span>
        </div>
      </div>

      <!-- Key Attributes -->
      <div
        v-if="displayAttributes.length > 0"
        class="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200"
      >
        <div
          v-for="attr in displayAttributes"
          :key="attr.id"
          class="flex flex-col"
        >
          <span class="text-xs text-gray-500">{{ attr.name }}</span>
          <span class="text-sm font-medium text-gray-900">{{
            attr.value
          }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

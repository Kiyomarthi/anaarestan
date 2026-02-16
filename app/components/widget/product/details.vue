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
  discountPrice?: string | null;
  attributes?: ProductAttribute[];
  rating?: number;
  ratingCount?: number;
  commentsCount?: number;
  isFavorite?: boolean;
  productId?: number;
}>();

///// refs /////

///// composables/stores /////

///// computed /////

const displayAttributes = computed(() => {
  return props.attributes?.slice(0, 4) || [];
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
      <h1 class="text-h3 font-bold mb-4">
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
    </div>
  </div>
</template>

<script setup lang="ts">
type Category = {
  id: number;
  name: string;
  slug: string;
  image?: string | null;
  code?: string;
};

const props = defineProps<{
  category: Category;
}>();

const router = useRouter();
</script>

<template>
  <ULink
    class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
    :to="`/categories/${props.category.code}/${props.category.slug}`"
  >
    <div
      class="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-100"
    >
      <BaseImage
        v-if="category.image"
        :src="category.image"
        :alt="category.name"
        image-class="size-16 object-cover"
        class="w-16"
        :width="64"
        sizes="64px"
        :loading="'lazy'"
      />
      <div v-else class="w-full h-full flex items-center justify-center">
        <svg
          class="w-8 h-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </div>
    </div>

    <div class="flex-1 min-w-0">
      <h3 class="text-sm font-medium text-gray-800 line-clamp-1">
        {{ category.name }}
      </h3>
    </div>
  </ULink>
</template>

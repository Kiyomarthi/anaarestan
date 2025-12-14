<script setup lang="ts">
const props = defineProps<{
  banners?: Array<{
    id: number;
    image: string;
    title?: string;
    link?: string;
  }>;
}>();

const router = useRouter();

// Static banners for now
const staticBanners = [
  {
    id: 1,
    image: "/images/banner-grid-1.jpg",
    link: "/category/electronics",
  },
  {
    id: 2,
    image: "/images/banner-grid-2.jpg",
    link: "/category/clothing",
  },
  {
    id: 3,
    image: "/images/banner-grid-3.jpg",
    link: "/category/home",
  },
  {
    id: 4,
    image: "/images/banner-grid-4.jpg",
    link: "/category/sports",
  },
];

const banners = computed(() => props.banners || staticBanners);

function handleBannerClick(banner: any) {
  if (banner.link) {
    router.push(banner.link);
  }
}
</script>

<template>
  <section v-if="banners.length > 0" class="mb-12">
    <div class="container mx-auto px-4">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          v-for="banner in banners"
          :key="banner.id"
          class="relative aspect-[4/3] rounded-lg overflow-hidden cursor-pointer group"
          @click="handleBannerClick(banner)"
        >
          <BaseImage
            :src="banner.image"
            :alt="banner.title || 'بنر'"
            class="transition-transform duration-300 group-hover:scale-105"
            :loading="'lazy'"
          />
        </div>
      </div>
    </div>
  </section>
</template>


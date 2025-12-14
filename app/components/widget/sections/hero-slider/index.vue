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
    image: "/images/banner-1.jpg",
    title: "تخفیف ویژه",
    link: "/products?sort=cheapest",
  },
  {
    id: 2,
    image: "/images/banner-2.jpg",
    title: "محصولات جدید",
    link: "/products?sort=newest",
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
  <section v-if="banners.length > 0" class="mb-8">
    <BaseCarousel
      :items="banners"
      :autoplay="true"
      :interval="5000"
      class="rounded-lg overflow-hidden"
    >
      <template #default="{ item }">
        <div
          class="relative h-[300px] md:h-[400px] lg:h-[500px] cursor-pointer"
          @click="handleBannerClick(item)"
        >
          <BaseImage
            :src="item.image"
            :alt="item.title || 'بنر'"
            class="w-full h-full"
            :loading="'eager'"
            :fetch-priority="'high'"
          />
          <div
            v-if="item.title"
            class="absolute inset-0 flex items-center justify-center bg-black/20"
          >
            <h2 class="text-3xl md:text-5xl font-bold text-white">
              {{ item.title }}
            </h2>
          </div>
        </div>
      </template>
    </BaseCarousel>
  </section>
</template>


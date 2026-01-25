<script setup lang="ts">
///// imports /////
import { randomColor } from "~/constants/common";

///// page meta /////

///// props/emits /////
defineProps<{
  items: unknown[];
  noTimeline?: boolean;
}>();

///// refs /////
const modal = ref<boolean>(false);
const carousel = useTemplateRef("carousel");
const carouselTimeline = useTemplateRef("carouselTimeline");
const galleryCarousel = useTemplateRef("galleryCarousel");
const galleryCarouselTimeline = useTemplateRef("galleryCarouselTimeline");
const activeIndex = ref(0);
const router = useRouter();
const route = useRoute();

function onClickPrev() {
  activeIndex.value--;
}
function onClickNext() {
  activeIndex.value++;
}
function onSelect(index: number) {
  activeIndex.value = index;
}

function select(index: number) {
  activeIndex.value = index;

  galleryCarouselTimeline.value?.emblaApi?.scrollTo(index);
  galleryCarousel.value?.emblaApi?.scrollTo(index);
  carouselTimeline.value?.emblaApi?.scrollTo(index);
}

const showGallery = () => {
  modal.value = true;
  router.push({ hash: "#gallery" });
};

const closeGallery = () => {
  modal.value = false;
  router.push({ hash: "" });
};

///// composables/stores /////

///// computed /////

///// functions /////

///// watchers /////
watch(
  () => route.hash,
  (val) => {
    if (val === "#gallery") {
      modal.value = true;
    } else {
      modal.value = false;
    }
  }
);

///// lifecycle /////
</script>

<template>
  <div>
    <UCarousel
      ref="carousel"
      :items
      loop
      v-slot="{ item, index }"
      next-icon="i-lucide-chevron-left"
      prev-icon="i-lucide-chevron-right"
      :prev="{ onClick: onClickPrev }"
      :next="{ onClick: onClickNext }"
      :ui="{
        prev: 'sm:start-10 lg:-start-10',
        next: 'sm:end-10 lg:-end-10',
        item: 'cursor-pointer h-fill flex bg-neutral-100 lg:bg-transparent',
        arrows:
          'lg:absolute lg:bottom-6 lg:w-5 lg:right-1/2 lg:translate-x-1/2',
      }"
      @select="select($event)"
    >
      <baseImage
        :src="index % 2 ? '/tmp/slider.avif' : '/tmp/product.jpg'"
        image-class="max-h-[300px] lg:max-h-[400px] object-contain aspect-auto"
        class="aspect-auto"
        alt="slider-item"
        :height="400"
        width="300px"
        sizes="200px"
        :preload="index == 0"
        :loading="index == 0 ? 'eager' : 'lazy'"
        :fetch-priority="index == 0 ? 'high' : 'low'"
        @click="showGallery"
      />
    </UCarousel>
    <div v-if="!noTimeline" class="pt-4 lg:pt-8">
      <UCarousel
        ref="carouselTimeline"
        :items
        loop
        v-slot="{ item, index }"
        next-icon="i-lucide-chevron-left"
        prev-icon="i-lucide-chevron-right"
        :ui="{
          prev: 'sm:start-10 lg:-start-10',
          next: 'sm:end-10 lg:-end-10',
          item: 'basis-auto cursor-pointer',
        }"
      >
        <baseImage
          :src="index % 2 ? '/tmp/slider.avif' : '/tmp/product.jpg'"
          image-class="size-12 object-cover aspect-square"
          class="aspect-square rounded-md overflow-hidden"
          alt="slider-item"
          :height="48"
          width="48px"
          sizes="48px"
          :preload="index == 0"
          :loading="index == 0 ? 'eager' : 'lazy'"
          :fetch-priority="index == 0 ? 'high' : 'low'"
          @click="showGallery"
        />
      </UCarousel>
    </div>
    <!-- TODO: connect this carusel index -->
    <UModal
      v-model:open="modal"
      fullscreen
      :ui="{
        content: 'bg-black',
      }"
    >
      <template #content>
        <div
          class="size-full flex flex-col justify-between relative pt-10 lg:pt-5"
        >
          <UTooltip text="بستن" :delay-duration="0">
            <UButton
              trailing-icon="i-lucide-x"
              label="بستن"
              variant="link"
              color="white"
              size="xl"
              :ui="{
                base: 'absolute top-2 left-3 text-white',
              }"
              @click="closeGallery"
            />
          </UTooltip>
          <div class="flex items-center justify-center border-none">
            <div
              class="w-[90dvw] h-[80dvh] sm:size-20 lg:w-[40dvw] lg:h-[70dvh]"
            >
              <UCarousel
                ref="galleryCarousel"
                :items
                arrows
                v-slot="{ item, index }"
                :prev="{ onClick: onClickPrev }"
                :next="{ onClick: onClickNext }"
                next-icon="i-lucide-chevron-left"
                prev-icon="i-lucide-chevron-right"
                :ui="{
                  prev: '-start-2 sm:-start-8 size-10 flex justify-center items-center disabled:hidden with-transition',
                  next: '-end-2 sm:-end-8 size-10 flex justify-center items-center disabled:hidden with-transition',
                }"
                @select="select($event)"
              >
                <nuxt-img
                  :src="index % 2 ? '/tmp/slider.avif' : '/tmp/product.jpg'"
                  class="object-contain aspect-auto w-[90dvw] h-[70dvh] sm:size-20 lg:w-[50dvw] lg:h-[70dvh]"
                  alt="slider-item"
                  :loading="index == 0 ? 'eager' : 'lazy'"
                  :fetch-priority="index == 0 ? 'high' : 'low'"
                />
              </UCarousel>
            </div>
          </div>
          <div class="max-w-dvw sm:max-w-100 lg:max-w-200 mx-auto mt-auto pb-4">
            <UCarousel
              ref="galleryCarouselTimeline"
              drag-free
              :items
              align="center"
              v-slot="{ item, index }"
              next-icon="i-lucide-chevron-left"
              prev-icon="i-lucide-chevron-right"
              :ui="{
                prev: 'sm:start-10 lg:-start-10',
                next: 'sm:end-10 lg:-end-10',
                item: 'basis-auto with-transition ps-1',
              }"
            >
              <div
                class="p-1 border-2 border-transparent"
                :class="
                  index == activeIndex
                    ? 'border-primary! rounded-lg'
                    : 'opacity-60'
                "
              >
                <BaseImage
                  :src="index % 2 ? '/tmp/slider.avif' : '/tmp/product.jpg'"
                  image-class="size-18 object-cover aspect-square"
                  class="aspect-square rounded-md overflow-hidden with-transition"
                  alt="slider-item"
                  loading="lazy"
                  sizes="72px"
                  fetch-priority="low"
                  @click="select(index)"
                />
              </div>
            </UCarousel>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

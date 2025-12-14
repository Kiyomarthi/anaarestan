<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    items: any[];
    class?: string;
    itemClass?: string;
    autoplay?: boolean;
    interval?: number;
  }>(),
  {
    class: "",
    itemClass: "",
    autoplay: false,
    interval: 5000,
  }
);

const currentIndex = ref(0);
const containerRef = ref<HTMLElement>();

function next() {
  currentIndex.value = (currentIndex.value + 1) % props.items.length;
}

function prev() {
  currentIndex.value =
    currentIndex.value === 0 ? props.items.length - 1 : currentIndex.value - 1;
}

function goTo(index: number) {
  currentIndex.value = index;
}

onMounted(() => {
  if (props.autoplay) {
    const interval = setInterval(next, props.interval);
    onUnmounted(() => clearInterval(interval));
  }
});
</script>

<template>
  <div :class="['relative', props.class]">
    <div
      ref="containerRef"
      class="overflow-hidden relative"
    >
      <div
        class="flex transition-transform duration-500 ease-in-out"
        :style="{
          transform: `translateX(-${currentIndex * 100}%)`,
        }"
      >
        <div
          v-for="(item, index) in items"
          :key="index"
          :class="['flex-shrink-0 w-full', props.itemClass]"
        >
          <slot :item="item" :index="index" />
        </div>
      </div>
    </div>

    <!-- Navigation Buttons -->
    <UButton
      v-if="items.length > 1"
      icon="i-heroicons-chevron-right"
      color="gray"
      variant="solid"
      class="absolute left-4 top-1/2 -translate-y-1/2 z-10"
      :padded="false"
      size="sm"
      @click="prev"
    />
    <UButton
      v-if="items.length > 1"
      icon="i-heroicons-chevron-left"
      color="gray"
      variant="solid"
      class="absolute right-4 top-1/2 -translate-y-1/2 z-10"
      :padded="false"
      size="sm"
      @click="next"
    />

    <!-- Dots Indicator -->
    <div
      v-if="items.length > 1"
      class="flex justify-center gap-2 mt-4"
    >
      <button
        v-for="(item, index) in items"
        :key="index"
        :class="[
          'w-2 h-2 rounded-full transition-all',
          currentIndex === index ? 'bg-primary-500 w-6' : 'bg-gray-300',
        ]"
        @click="goTo(index)"
      />
    </div>
  </div>
</template>


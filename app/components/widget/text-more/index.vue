<script setup lang="ts">
interface Props {
  maxLines?: number;
  content: string;
}

const props = withDefaults(defineProps<Props>(), {
  maxLines: 8,
});

const expanded = ref(false);
const isOverflowing = ref(false);
const contentEl = ref<HTMLElement | null>(null);
let ro: ResizeObserver | null = null;

const checkOverflow = () => {
  if (!contentEl.value) return;
  const el = contentEl.value;
  isOverflowing.value = el.scrollHeight > el.clientHeight + 1;
};

const toggle = () => {
  expanded.value = !expanded.value;
  nextTick(() => checkOverflow());
};

onMounted(() => {
  nextTick(checkOverflow);
  if (window.ResizeObserver && contentEl.value) {
    ro = new ResizeObserver(() => {
      const prev = expanded.value;
      expanded.value = false;
      nextTick(() => {
        checkOverflow();
        expanded.value = prev;
      });
    });
    ro.observe(contentEl.value);
  }
});

onBeforeUnmount(() => {
  if (ro && contentEl.value) ro.unobserve(contentEl.value);
});
</script>

<template>
  <div class="space-y-2">
    <div
      ref="contentEl"
      :style="
        expanded
          ? ''
          : `display: -webkit-box; -webkit-line-clamp: ${props.maxLines}; -webkit-box-orient: vertical; overflow: hidden;`
      "
      class="text-container"
      v-html="content"
    />

    <div class="w-fit">
      <u-button
        v-if="isOverflowing"
        variant="soft"
        :icon="expanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
        color="primary"
        :ui="{
          base: '',
        }"
        @click="toggle"
      >
        {{ expanded ? "نمایش کمتر" : "نمایش بیشتر" }}
      </u-button>
    </div>
  </div>
</template>

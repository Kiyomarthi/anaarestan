<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from "vue";

/**
 * Props:
 * - side: placement of the tooltip relative to the virtual cursor
 * - sideOffset: distance from cursor
 * - updatePositionStrategy: forwarded to UTooltip content config
 * - interactive: if true, tooltip content can receive pointer events (WARNING: may cause flicker)
 */
const props = withDefaults(
  defineProps<{
    side?: "top" | "right" | "bottom" | "left";
    sideOffset?: number;
    updatePositionStrategy?: "always" | "auto" | "initial" | string;
    interactive?: boolean;
    contentClass?: string;
  }>(),
  {
    side: "top",
    sideOffset: 16,
    updatePositionStrategy: "always",
    interactive: false,
    contentClass: "",
  }
);

// open state & virtual anchor
const open = ref(false);
const anchor = ref({ x: 0, y: 0 });

/* ======= RAF-throttled updates (smooth) ======= */
let rafId: number | null = null;
let pendingX = 0;
let pendingY = 0;

function scheduleAnchorUpdate(x: number, y: number) {
  pendingX = x;
  pendingY = y;
  if (rafId !== null) return;
  rafId = requestAnimationFrame(() => {
    anchor.value.x = pendingX;
    anchor.value.y = pendingY;
    rafId = null;
  });
}

/* pointer handlers used on the target element */
function onPointerEnter(e: PointerEvent) {
  open.value = true;
  scheduleAnchorUpdate(e.clientX, e.clientY);
}
function onPointerMove(e: PointerEvent) {
  scheduleAnchorUpdate(e.clientX, e.clientY);
}
function onPointerLeave() {
  open.value = false;
}

/* cleanup */
onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId);
});

/* virtual reference for UTooltip (Floating UI virtual element) */
const reference = computed(() => ({
  getBoundingClientRect() {
    return {
      width: 0,
      height: 0,
      left: anchor.value.x,
      right: anchor.value.x,
      top: anchor.value.y,
      bottom: anchor.value.y,
      x: anchor.value.x,
      y: anchor.value.y,
      toJSON() {},
    } as DOMRect;
  },
}));
</script>

<template>
  <UTooltip
    :open="open"
    :reference="reference"
    :content="{
      side: props.side,
      sideOffset: props.sideOffset,
      updatePositionStrategy: props.updatePositionStrategy,
    }"
  >
    <div
      @pointerenter="onPointerEnter"
      @pointermove="onPointerMove"
      @pointerleave="onPointerLeave"
      style="display: inline-block"
    >
      <slot />
    </div>

    <template #content>
      <div
        :class="[
          props.interactive ? '' : 'pointer-events-none',
          props.contentClass,
        ]"
      >
        <slot name="content" />
      </div>
    </template>
  </UTooltip>
</template>

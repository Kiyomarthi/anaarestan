<script setup lang="ts">
import { useBreakpoints } from "~/composables/utils/useBreakpoints";

///// imports /////

///// page meta /////

///// props/emits /////
const open = defineModel<boolean>({
  default: false,
});

defineProps<{
  title?: string;
  subtitle?: string;
  headerClass?: string;
  noClose?: boolean;
}>();

///// refs /////

///// composables/stores /////
const { lgAndUp } = useBreakpoints();

///// computed /////

///// functions /////

///// watchers /////

///// lifecycle /////
</script>

<template>
  <u-modal
    v-if="lgAndUp"
    v-model:open="open"
    :title="title"
    :close="!noClose"
    :dismissible="!noClose"
    :description="subtitle"
    :ui="{
      content: 'w-112.5 max-w-none p-4',
      overlay: 'bg-black/35 backdrop-blur-xs',
      header: ['p-4 min-h-max', headerClass],
    }"
  >
    <template #title>
      <slot name="title">
        {{ title }}
      </slot>
    </template>

    <template #body>
      <slot />
    </template>
  </u-modal>
  <u-slideover
    v-else
    v-model:open="open"
    :dismissible="!noClose"
    :close="!noClose"
    side="bottom"
    :title="title"
    :description="subtitle"
    :ui="{
      overlay: 'bg-black/35 backdrop-blur-xs',
      content: 'rounded-t-[10px]',
    }"
  >
    <template #title>
      <slot name="title">
        {{ title }}
      </slot>
    </template>

    <template #body>
      <slot />
    </template>
  </u-slideover>
</template>

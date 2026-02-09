<script setup lang="ts">
///// imports /////

///// page meta /////

///// props/emits /////
const open = defineModel<boolean>({
  default: false,
});

defineProps<{
  title: string;
  subtitle?: string;
}>();

///// refs /////

///// composables/stores /////
const { isDesktop } = useDevice();

///// computed /////

///// functions /////

///// watchers /////

///// lifecycle /////
</script>

<template>
  <u-modal
    v-if="isDesktop"
    v-model:open="open"
    :title="title"
    :description="subtitle"
    :ui="{
      content: 'w-150 max-w-none p-4',
      overlay: 'bg-black/35 backdrop-blur-xs',
      header: 'p-3 min-h-max',
    }"
  >
    <template #body>
      <slot />
    </template>
  </u-modal>
  <u-slideover
    v-else
    v-model:open="open"
    side="bottom"
    :title="title"
    :description="subtitle"
    :ui="{
      overlay: 'bg-black/35 backdrop-blur-xs',
      content: 'rounded-t-[10px]',
    }"
  >
    <template #body>
      <slot />
    </template>
  </u-slideover>
</template>

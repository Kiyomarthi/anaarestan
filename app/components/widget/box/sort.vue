<script setup lang="ts">
///// imports /////
import { useBreakpoints } from "~/composables/utils/useBreakpoints";
import type { ItemType } from "~~/shared/types/common";

///// page meta /////

///// props/emits /////
const props = defineProps<{
  items: ItemType[];
}>();

const model = defineModel<ItemType>({
  default: {
    label: "جدیدترین",
    key: "newest",
  },
});
///// refs /////

///// composables/stores /////
const { lgAndUp } = useBreakpoints();

///// computed /////

///// functions /////

///// watchers /////

///// lifecycle /////
</script>

<template>
  <div class="text-sm lg:flex items-center gap-2">
    <span
      class="flex items-center gap-1 text-lg font-bold lg:text-sm lg:font-light"
    >
      <UIcon name="i-lucide-list-ordered" class="text-gray-800" />
      <span class="text-gray-800 w-max">مرتب سازی:</span>
    </span>
    <template v-if="lgAndUp">
      <UButton
        v-for="(item, index) in items"
        :key="index"
        class=""
        :label="item.label"
        :variant="item?.key == model?.key ? 'soft' : 'ghost'"
        :color="item?.key == model?.key ? 'primary' : 'gray'"
        @click="model = item"
      />
    </template>
    <URadioGroup
      v-else
      v-model="model.key"
      :items="items"
      valueKey="key"
      :ui="{
        fieldset: 'space-y-4',
        base: 'size-5',
        label: 'text-sm',
        root: 'mt-4',
      }"
    />
  </div>
</template>

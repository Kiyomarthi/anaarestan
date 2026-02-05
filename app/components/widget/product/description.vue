<script setup lang="ts">
///// imports /////

///// props/emits /////
const props = defineProps<{
  description: string;
  shortDescription?: string;
}>();

///// refs /////
const showFull = ref(false);

///// composables/stores /////

///// computed /////
const displayText = computed(() => {
  if (showFull.value) {
    return props.description;
  }
  return props.shortDescription || props.description?.substring(0, 200) || "";
});

const canExpand = computed(() => {
  return (
    props.description &&
    props.description.length > 200 &&
    (!props.shortDescription || props.description !== props.shortDescription)
  );
});

///// functions /////

///// watchers /////

///// lifecycle /////
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-xl font-bold text-gray-900">توضیحات محصول</h2>
    <div
      class="text-gray-700 leading-relaxed"
      :class="{ 'line-clamp-4': !showFull && canExpand }"
    >
      <div
        v-if="description"
        v-html="displayText"
      />
      <p v-else>توضیحاتی برای این محصول ثبت نشده است.</p>
    </div>
    <UButton
      v-if="canExpand"
      variant="ghost"
      size="sm"
      :label="showFull ? 'بستن' : 'مشاهده بیشتر'"
      @click="showFull = !showFull"
    />
  </div>
</template>


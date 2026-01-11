<script setup lang="ts">
///// imports /////

///// page meta /////
const props = withDefaults(
  defineProps<{
    title?: string;
    items: FAQ[];
    loading?: boolean;
  }>(),
  {
    title: "سوالات متداول",
  }
);

///// props/emits /////

///// refs /////

///// composables/stores /////

///// computed /////
const faqs = computed(() =>
  props.items?.map((q) => ({
    label: q?.question,
    content: q?.answer,
  }))
);

///// functions /////

///// watchers /////

///// lifecycle /////
</script>

<template>
  <div v-if="loading" class="space-y-3">
    <USkeleton
      v-for="i in 5"
      class="w-full lg:w-[50%] h-10 rounded-2xl mx-auto"
    />
  </div>
  <section v-else-if="items?.length">
    <h3 class="text-h3 text-center mb-2">سوالات متداول</h3>

    <UAccordion
      :items="faqs"
      :ui="{
        label: 'font-bold',
      }"
      class="lg:px-10 lg:max-w-200 mx-auto"
    >
      <template #content="{ item }">
        <div class="text-container" v-html="item?.content" />
      </template>
    </UAccordion>
  </section>
</template>

<script setup lang="ts">
///// imports /////

///// page meta /////

///// props/emits /////
const props = withDefaults(
  defineProps<{
    category?: Category;
    class?: string;
    imageClass?: string;
  }>(),
  {
    class: "",
  }
);

///// refs /////

///// composables/stores /////

///// computed /////

///// functions /////

///// watchers /////

///// lifecycle /////
</script>

<template>
  <UCard
    :ui="{
      root: 'h-full!',
    }"
  >
    <template #header>
      <WidgetCategoryCard
        :id="category?.id"
        :name="category?.name"
        :slug="category?.slug"
        image="/tmp/category.png"
        class="mx-auto"
      />
    </template>
    <ul v-if="category?.children?.length" class="space-y-1" role="list">
      <li
        v-for="(item, index) in category?.children?.slice(0, 5)"
        :key="index"
        role="listitem"
      >
        <NuxtLink :to="`/products/list/${item.id}/${item.slug}`">
          <h5 class="text-h5 flex items-center gap-1">
            <UIcon name="i-lucide-link" />
            {{ item?.name }}
          </h5>
        </NuxtLink>
      </li>
    </ul>
  </UCard>
</template>

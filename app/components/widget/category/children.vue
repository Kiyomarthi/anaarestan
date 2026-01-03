<script setup lang="ts">
///// imports /////

///// page meta /////
const props = defineProps<{
  categories: Category[];
}>();

///// props/emits /////

///// refs /////

///// composables/stores /////

///// computed /////

///// functions /////

///// watchers /////

///// lifecycle /////
</script>

<template>
  <div class="space-y-1 px-2">
    <template v-if="categories">
      <div v-for="child in categories" :key="child.name" class="w-full">
        <h3 class="font-semibold">
          <UButton
            :to="`/categories/${child.code}/${child?.slug}`"
            variant="ghost"
            color="default"
            class="size-full text-start px-0 py-1.5"
            reverse
            :ui="{
              base: [
                child.children?.length && 'font-bold text-[16px]',
                'hover:text-primary',
              ],
            }"
          >
            {{ child.name }}
          </UButton>
        </h3>
        <ul class="space-y-1.5">
          <template v-if="child.children && child.children.length > 0">
            <widget-category-children :categories="child.children" />
          </template>
        </ul>
      </div>
    </template>
  </div>
</template>

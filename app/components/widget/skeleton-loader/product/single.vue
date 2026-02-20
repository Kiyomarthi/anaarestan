<script setup lang="ts">
import { useBreakpoints } from "~/composables/utils/useBreakpoints";

///// imports /////

///// page meta /////

///// props/emits /////

///// refs /////
const { lgAndUp } = useBreakpoints();

///// composables/stores /////

///// computed /////

///// functions /////

///// watchers /////

///// lifecycle /////
</script>

<template>
  <div>
    <div class="fixed top-17 left-0 lg:block lg:static w-full">
      <div class="pt-3 lg:pt-1 px-4">
        <USkeleton class="h-6 w-56 rounded-md" />
      </div>
      <div v-if="!lgAndUp" class="mt-3 px-4">
        <USkeleton class="h-100 w-full rounded-xl" />
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-7 lg:mt-5 lg:gap-4">
      <div class="col-span-5 gap-4 lg:gap-6">
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-y-3 lg:gap-3">
          <div class="col-span-2 -mx-4 lg:mx-0">
            <div v-if="lgAndUp" class="sticky top-3">
              <USkeleton class="h-100 lg:h-[520px] w-full rounded-xl" />
            </div>
          </div>

          <div
            class="col-span-3 space-y-4 mt-82.5 lg:mt-0 bg-white px-4 lg:px-0 pt-3 lg:pt-0 rounded-t-lg border-t-4 border-primary z-10 lg:rounded-none lg:border-0"
          >
            <div class="space-y-3">
              <USkeleton class="h-8 w-4/5 rounded-md" />
              <USkeleton class="h-6 w-2/5 rounded-md" />
              <USkeleton class="h-4 w-3/5 rounded-md" />
            </div>

            <div class="border-t border-gray-200 pt-4 space-y-3">
              <USkeleton class="h-5 w-32 rounded-md" />
              <div class="flex flex-wrap gap-2">
                <USkeleton class="h-9 w-20 rounded-lg" />
                <USkeleton class="h-9 w-24 rounded-lg" />
                <USkeleton class="h-9 w-20 rounded-lg" />
              </div>
            </div>

            <div
              class="grid grid-cols-2 lg:grid-cols-3 gap-3 py-4 border-t border-gray-200"
            >
              <USkeleton class="h-16 w-full rounded-md" />
              <USkeleton class="h-16 w-full rounded-md" />
              <USkeleton class="h-16 w-full rounded-md" />
              <USkeleton class="h-16 w-full rounded-md" />
              <USkeleton class="h-16 w-full rounded-md" />
              <USkeleton class="h-16 w-full rounded-md" />
            </div>
          </div>
        </div>

        <div class="px-4 bg-white z-10 relative space-y-6">
          <div class="border-t border-gray-200 pt-6 lg:mt-3 space-y-3">
            <USkeleton class="h-7 w-40 rounded-md" />
            <USkeleton class="h-5 w-full rounded-md" />
            <USkeleton class="h-5 w-11/12 rounded-md" />
            <USkeleton class="h-5 w-10/12 rounded-md" />
          </div>

          <div class="border-t border-gray-200 mt-6 py-6 space-y-3">
            <USkeleton class="h-7 w-56 rounded-md" />
            <USkeleton class="h-12 w-full rounded-md" />
            <USkeleton class="h-12 w-full rounded-md" />
            <USkeleton class="h-12 w-full rounded-md" />
          </div>

          <div class="border-t border-gray-200 pt-6 pb-6 space-y-3">
            <USkeleton class="h-7 w-44 rounded-md" />
            <USkeleton class="h-20 w-full rounded-md" />
            <USkeleton class="h-20 w-full rounded-md" />
          </div>
        </div>
      </div>

      <div v-if="lgAndUp" class="col-span-2">
        <div class="sticky top-3 space-y-3">
          <USkeleton class="h-10 w-2/3 rounded-md" />
          <USkeleton class="h-12 w-full rounded-lg" />
          <USkeleton class="h-12 w-full rounded-lg" />
          <USkeleton class="h-40 w-full rounded-xl" />
        </div>
      </div>
    </div>

    <div
      class="border-t border-gray-200 pt-6 px-4 bg-white z-10 relative lg:block"
    >
      <USkeleton class="h-7 w-52 rounded-md mb-4" />
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <USkeleton class="h-50 w-full rounded-xl" />
        <USkeleton class="h-50 w-full rounded-xl" />
        <USkeleton class="h-50 w-full rounded-xl" />
        <USkeleton class="h-50 w-full rounded-xl" />
      </div>
    </div>

    <div
      v-if="!lgAndUp"
      class="fixed bottom-22.5 left-4 right-4 z-100 with-transition"
    >
      <USkeleton class="h-28 w-full rounded-xl" />
    </div>
  </div>
</template>

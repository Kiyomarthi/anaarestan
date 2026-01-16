<script setup lang="ts">
///// imports /////

///// page meta /////
const model = defineModel({
  default: {
    rangePrice: [0, 100000000],
    onlyAvailable: false,
  },
});

///// props/emits /////

///// refs /////

///// composables/stores /////

///// computed /////

///// functions /////

///// watchers /////

///// lifecycle /////
</script>

<template>
  <div>
    <div>
      <div class="text-sm font-bold">محدوده قیمت</div>
      <div class="px-3">
        <div
          class="flex justify-between items-center gap-3 py-3 border-b border-default"
        >
          از
          <div class="">
            <span class="font-bold text-2xl"
              >{{ formatNumber(model.rangePrice?.[0]) }}
            </span>
            تومان
          </div>
        </div>
        <div class="flex justify-between items-center gap-3 py-3">
          تا
          <div>
            <span class="font-bold text-2xl">{{
              formatNumber(model.rangePrice?.[1])
            }}</span>
            تومان
          </div>
        </div>
        <USlider v-model="model.rangePrice" :min="0" :max="100000000" tooltip />
      </div>
    </div>
    <div class="-mx-4 border-t border-default my-6" />
    <USwitch
      v-model="model.onlyAvailable"
      label="فقط کالاهای موجود"
      :ui="{
        root: 'flex-row-reverse gap-2 justify-end items-center',
      }"
    />
  </div>
</template>

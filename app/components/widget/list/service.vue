<script setup lang="ts">
///// imports /////

///// page meta /////

///// props/emits /////

///// refs /////
const services = [
  {
    icon: "i-lucide-fast-forward",
    label: "پست پیشتاز",
  },
  {
    icon: "i-lucide-banknote",
    label: "پرداخت قسطی",
  },
  {
    icon: "i-lucide-hand-coins",
    label: "پرداخت در محل",
  },
  {
    icon: "i-lucide-phone-call",
    label: "پشتیبانی 24 ساعته",
  },
  { icon: "i-lucide-refresh-cw", label: "هفت روز ضمانت بازگشت کالا" },
  {
    icon: "i-lucide-hand-coins",
    label: "پرداخت در محل",
  },
];

///// composables/stores /////

///// computed /////

///// functions /////

///// watchers /////

///// lifecycle /////
</script>

<template>
  <section>
    <h3 class="text-h3 mb-2 lg:mb-4 text-center">خدمات فروشگاه</h3>
    <ul
      role="list"
      class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2"
    >
      <li
        v-for="(service, index) in services"
        :key="index"
        role="listitem"
        class="p-4 border border-default rounded-lg flex flex-col items-center justify-center gap-2"
      >
        <UIcon :name="service.icon" class="text-primary size-6" />
        <h4 class="text-h5 text-center">
          {{ service.label }}
        </h4>
      </li>
    </ul>
  </section>
</template>

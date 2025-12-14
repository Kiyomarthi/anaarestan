<script setup lang="ts">
const props = defineProps<{
  endTime: Date | string | number;
}>();

const timeLeft = ref({
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
});

const isExpired = ref(false);

const endTimeDate = computed(() => {
  if (typeof props.endTime === "string" || typeof props.endTime === "number") {
    return new Date(props.endTime);
  }
  return props.endTime;
});

function updateTimer() {
  const now = new Date().getTime();
  const end = endTimeDate.value.getTime();
  const difference = end - now;

  if (difference <= 0) {
    isExpired.value = true;
    timeLeft.value = { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return;
  }

  isExpired.value = false;
  timeLeft.value = {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((difference % (1000 * 60)) / 1000),
  };
}

onMounted(() => {
  updateTimer();
  const interval = setInterval(updateTimer, 1000);

  onUnmounted(() => {
    clearInterval(interval);
  });
});

const formatNumber = (num: number) => String(num).padStart(2, "0");
</script>

<template>
  <div v-if="!isExpired" class="flex items-center gap-2">
    <div class="flex flex-col items-center bg-primary-500 text-white px-3 py-2 rounded">
      <span class="text-lg font-bold">{{ formatNumber(timeLeft.days) }}</span>
      <span class="text-xs">روز</span>
    </div>
    <span class="text-primary-500 font-bold">:</span>
    <div class="flex flex-col items-center bg-primary-500 text-white px-3 py-2 rounded">
      <span class="text-lg font-bold">{{ formatNumber(timeLeft.hours) }}</span>
      <span class="text-xs">ساعت</span>
    </div>
    <span class="text-primary-500 font-bold">:</span>
    <div class="flex flex-col items-center bg-primary-500 text-white px-3 py-2 rounded">
      <span class="text-lg font-bold">{{ formatNumber(timeLeft.minutes) }}</span>
      <span class="text-xs">دقیقه</span>
    </div>
    <span class="text-primary-500 font-bold">:</span>
    <div class="flex flex-col items-center bg-primary-500 text-white px-3 py-2 rounded">
      <span class="text-lg font-bold">{{ formatNumber(timeLeft.seconds) }}</span>
      <span class="text-xs">ثانیه</span>
    </div>
  </div>
  <div v-else class="text-error-500 font-bold">تخفیف به پایان رسید</div>
</template>


<script setup lang="ts">
import { formatPrice } from "~~/shared/utils/format";

const props = defineProps<{
  subtotalAmount: number;
  discountAmount: number;
  shippingAmount: number;
  walletAmount: number;
  payableAmount: number;
  canProceed: boolean;
  creatingOrder: boolean;
}>();

const emit = defineEmits<{
  confirm: [];
}>();
</script>

<template>
  <div class="lg:sticky lg:top-6 self-start col-span-2 mt-5 lg:mt-0">
    <aside>
      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold">خلاصه سفارش</h2>
        </template>

        <div class="space-y-3">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-500">مجموع سبد</span>
            <span class="font-medium">
              {{ formatPrice(props.subtotalAmount) }} تومان
            </span>
          </div>

          <div
            v-if="props.discountAmount > 0"
            class="flex items-center justify-between text-sm"
          >
            <span class="text-gray-500">تخفیف</span>
            <span class="font-medium text-emerald-600">
              -{{ formatPrice(props.discountAmount) }} تومان
            </span>
          </div>

          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-500">هزینه ارسال</span>
            <span class="font-medium">
              {{ formatPrice(props.shippingAmount) }} تومان
            </span>
          </div>

          <div
            v-if="props.walletAmount > 0"
            class="flex items-center justify-between text-sm"
          >
            <span class="text-gray-500">استفاده از کیف پول</span>
            <span class="font-medium text-blue-600">
              -{{ formatPrice(props.walletAmount) }} تومان
            </span>
          </div>

          <UDivider />

          <div class="flex items-center justify-between text-base">
            <span class="font-semibold">مبلغ قابل پرداخت</span>
            <span class="font-bold text-primary">
              {{ formatPrice(props.payableAmount) }} تومان
            </span>
          </div>

          <UButton
            block
            size="lg"
            color="primary"
            :disabled="!props.canProceed"
            :loading="props.creatingOrder"
            @click="emit('confirm')"
          >
            تایید و پرداخت
          </UButton>
        </div>
      </UCard>
    </aside>
  </div>
</template>

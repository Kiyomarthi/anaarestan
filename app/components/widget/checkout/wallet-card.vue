<script setup lang="ts">
import { formatPrice } from "~~/shared/utils/format";

const props = defineProps<{
  walletBalance: number;
  walletAmountUsed: number;
  maxWalletUsage: number;
  disabled: boolean;
}>();

const emit = defineEmits<{
  "update:walletAmountUsed": [value: number];
  "use-max": [];
}>();

const onAmountChange = (value: string | number) => {
  const amount = Number(value);
  emit("update:walletAmountUsed", Number.isFinite(amount) ? amount : 0);
};
</script>

<template>
  <UCard v-if="walletBalance > 0">
    <template #header>
      <h3 class="text-base font-semibold">کیف پول</h3>
    </template>

    <div class="space-y-3">
      <div
        class="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200"
      >
        <div>
          <p class="text-sm font-medium text-blue-800">موجودی کیف پول</p>
          <p class="text-xs text-blue-600">{{ formatPrice(walletBalance) }} تومان</p>
        </div>
      </div>

      <UInput
        :model-value="walletAmountUsed"
        type="number"
        :min="0"
        :max="maxWalletUsage"
        placeholder="مبلغ استفاده از کیف پول"
        :disabled="disabled"
        @update:model-value="onAmountChange"
      />

      <UButton
        block
        variant="outline"
        size="sm"
        :disabled="disabled"
        @click="emit('use-max')"
      >
        استفاده از کل موجودی
      </UButton>
    </div>
  </UCard>
</template>

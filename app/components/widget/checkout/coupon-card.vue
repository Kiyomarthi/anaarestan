<script setup lang="ts">
import { formatPrice } from "~~/shared/utils/format";

const props = defineProps<{
  couponCode: string;
  couponValid: boolean;
  couponDiscount: number;
  disabled: boolean;
}>();

const emit = defineEmits<{
  "update:couponCode": [value: string];
  apply: [];
  remove: [];
}>();
</script>

<template>
  <UCard>
    <template #header>
      <h3 class="text-base font-semibold">کد تخفیف</h3>
    </template>

    <div class="space-y-3">
      <div
        v-if="couponValid"
        class="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200"
      >
        <div>
          <p class="text-sm font-medium text-emerald-800">
            {{ couponCode }}
          </p>
          <p class="text-xs text-emerald-600">
            تخفیف: {{ formatPrice(couponDiscount) }} تومان
          </p>
        </div>
        <UButton
          icon="i-lucide-x"
          color="emerald"
          variant="ghost"
          size="sm"
          @click="emit('remove')"
        />
      </div>

      <UInput
        v-else
        :model-value="couponCode"
        placeholder="کد تخفیف را وارد کنید"
        :disabled="disabled"
        @update:model-value="emit('update:couponCode', $event)"
      />

      <UButton
        v-if="!couponValid"
        block
        variant="outline"
        :disabled="!couponCode.trim() || disabled"
        @click="emit('apply')"
      >
        اعمال کوپن
      </UButton>
    </div>
  </UCard>
</template>

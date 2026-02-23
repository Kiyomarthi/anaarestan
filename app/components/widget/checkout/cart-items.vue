<script setup lang="ts">
import { formatPrice } from "~~/shared/utils/format";

type CartAttribute = {
  id: number;
  name: string;
  value: string;
};

type CartItem = {
  id: number;
  product_id: number;
  product_title?: string;
  product_image?: string;
  price: number | string;
  quantity: number;
  variant_attributes?: CartAttribute[];
};

const props = defineProps<{
  isInitialLoading: boolean;
  hasItems: boolean;
  items: CartItem[];
  loading: boolean;
}>();

const emit = defineEmits<{
  "update-quantity": [payload: { itemId: number; quantity: number }];
  "go-back": [];
}>();
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold">سبد خرید</h2>
    </template>

    <template v-if="isInitialLoading">
      <USkeleton v-for="i in 3" :key="i" class="w-full h-28 rounded-xl mb-3" />
    </template>

    <template v-else-if="hasItems">
      <div class="space-y-3">
        <div
          v-for="item in props.items"
          :key="item.id"
          class="flex gap-3 p-3 rounded-xl border border-gray-100 bg-white"
        >
          <div class="w-20 h-20 rounded-lg overflow-hidden bg-neutral-100">
            <NuxtImg
              v-if="item.product_image"
              :src="item.product_image"
              alt=""
              class="w-full h-full object-cover"
            />
          </div>
          <div class="flex-1 flex flex-col justify-between gap-2">
            <div class="space-y-1">
              <p class="text-sm font-semibold line-clamp-2">
                {{ item.product_title || `محصول ${item.product_id}` }}
              </p>

              <p
                v-if="item.variant_attributes?.length"
                class="text-xs text-gray-500 flex flex-wrap gap-1"
              >
                <template v-for="attr in item.variant_attributes" :key="attr.id">
                  <span class="inline-flex items-center gap-0.5">
                    <span class="font-medium">{{ attr.name }}:</span>
                    <span>{{ attr.value }}</span>
                  </span>
                </template>
              </p>

              <p class="text-xs text-gray-500">
                قیمت واحد:
                <span class="font-medium">
                  {{ formatPrice(Number(item.price)) }} تومان
                </span>
              </p>
            </div>
            <div class="flex items-center justify-between gap-3">
              <p class="text-xs text-gray-500">
                مجموع:
                <span class="font-semibold text-primary">
                  {{ formatPrice(Number(item.price) * Number(item.quantity)) }} تومان
                </span>
              </p>
              <WidgetCounter
                :model-value="item.quantity"
                :min="0"
                :max="99"
                :disabled="props.loading"
                size="sm"
                @update:model-value="
                  emit('update-quantity', { itemId: item.id, quantity: $event })
                "
              />
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <UEmpty
        title="سبد خرید شما خالی است"
        description="برای شروع خرید، به فروشگاه برگردید."
        icon="i-lucide-shopping-bag"
      >
        <template #actions>
          <UButton color="primary" @click="emit('go-back')">
            بازگشت به سبد خرید
          </UButton>
        </template>
      </UEmpty>
    </template>
  </UCard>
</template>

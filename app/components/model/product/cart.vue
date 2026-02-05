<script setup lang="ts">
import { useCartStore } from "~/stores/cart";
import type { Variant } from "~~/shared/utils/variant";

///// imports /////

///// props/emits /////
const props = defineProps<{
  productId: number;
  productCode: string;
  selectedVariant: Variant | null;
  quantity?: number;
  open?: boolean;
  productPrice?: string;
  productStock?: number;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  close: [];
}>();

const isOpen = computed({
  get: () => props.open || false,
  set: (value) => emit("update:open", value),
});

///// refs /////
const quantity = ref(props.quantity || 1);
const adding = ref(false);

///// composables/stores /////
const cartStore = useCartStore();
const toast = useToast();

///// computed /////
const variantPrice = computed(() => {
  if (props.selectedVariant) {
    return props.selectedVariant.discount_price || props.selectedVariant.price || "0";
  }
  // If no variant selected, use product price
  return props.productPrice || "0";
});

const variantStock = computed(() => {
  if (props.selectedVariant) {
    return props.selectedVariant.stock || 0;
  }
  // If no variant selected, use product stock
  return props.productStock || 0;
});

const canAddToCart = computed(() => {
  return variantStock.value > 0 && quantity.value > 0 && quantity.value <= variantStock.value;
});

///// functions /////
const addToCart = async () => {
  if (!canAddToCart.value) {
    toast.add({
      title: "خطا",
      description: "تعداد انتخابی معتبر نیست",
      color: "error",
    });
    return;
  }

  adding.value = true;
  try {
    await cartStore.addItem(
      props.productId,
      quantity.value,
      variantPrice.value,
    );

    toast.add({
      title: "موفق",
      description: "محصول به سبد خرید اضافه شد",
      color: "success",
    });

    isOpen.value = false;
    emit("close");
  } catch (error: any) {
    toast.add({
      title: "خطا",
      description: error?.message || "خطا در افزودن به سبد خرید",
      color: "error",
    });
  } finally {
    adding.value = false;
  }
};

const formattedPrice = (value: number) => {
  return new Intl.NumberFormat("fa-IR").format(value);
};

///// watchers /////

///// lifecycle /////
</script>

<template>
  <UModal v-model="isOpen">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold">افزودن به سبد خرید</h3>
          <UButton
            variant="ghost"
            icon="i-lucide-x"
            @click="isOpen = false"
          />
        </div>
      </template>

      <div class="space-y-4">
        <div>
          <div class="text-sm text-gray-600 mb-2">قیمت:</div>
          <div class="text-xl font-bold text-primary-600">
            {{ formattedPrice(Number(variantPrice)) }} تومان
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">تعداد:</label>
          <WidgetCounter
            v-model="quantity"
            :min="1"
            :max="variantStock"
            :disabled="!canAddToCart"
          />
          <div
            v-if="variantStock > 0"
            class="text-xs text-gray-500 mt-1"
          >
            موجود: {{ variantStock }} عدد
          </div>
          <div
            v-else
            class="text-xs text-red-500 mt-1"
          >
            ناموجود
          </div>
        </div>

        <div class="flex gap-2 pt-4">
          <UButton
            :loading="adding"
            :disabled="!canAddToCart"
            label="افزودن به سبد خرید"
            class="flex-1"
            @click="addToCart"
          />
          <UButton
            variant="ghost"
            label="انصراف"
            @click="isOpen = false"
          />
        </div>
      </div>
    </UCard>
  </UModal>
</template>


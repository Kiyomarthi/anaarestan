<script setup lang="ts">
import { useBreakpoints } from "~/composables/utils/useBreakpoints";
import { useCartStore } from "~/stores/cart";
import { calculatePrice } from "~~/shared/utils/format";
import type { Variant } from "~~/shared/utils/variant";

///// imports /////

///// props/emits /////
const props = defineProps<{
  productId: number;
  productCode: string;
  selectedVariant: Variant | null;
  open?: boolean;
  productPrice?: string;
  discountPrice?: string;
  productStock?: number;
  stock?: number;
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
const quantity = defineModel<number>("quantity", {
  default: 0,
});

const adding = ref(false);
const router = useRouter();

///// composables/stores /////
const cartStore = useCartStore();
const toast = useToast();
const { lgAndUp } = useBreakpoints();

///// computed /////
const variantPrice = computed(() => {
  if (props.selectedVariant) {
    return (
      props.selectedVariant.discount_price || props.selectedVariant.price || "0"
    );
  }
  // If no variant selected, use product price
  return props.productPrice || "0";
});

const priceData = computed(() =>
  calculatePrice(
    Number(props.productPrice),
    props.discountPrice ? Number(props.discountPrice) : null,
  ),
);

const variantStock = computed(() => {
  if (props.selectedVariant) {
    return props.selectedVariant.stock || 0;
  }
  // If no variant selected, use product stock
  return props.productStock || 0;
});

const canAddToCart = computed(() => {
  return variantStock.value > 0 && quantity.value <= variantStock.value;
});

const isInStock = computed(() => {
  return (props.stock || 0) > 0;
});

///// functions /////
const addToCart = async (quantityParams?: number) => {
  if (!canAddToCart.value) {
    toast.add({
      title: "خطا",
      description: "تعداد انتخابی معتبر نیست",
      color: "error",
    });
    return;
  }

  adding.value = true;
  quantity.value = quantityParams ?? quantity.value;
  try {
    await cartStore.addItem(
      props.productId,
      quantityParams ?? quantity.value,
      variantPrice.value,
      props.selectedVariant ? Number(props.selectedVariant.id) : null,
    );

    toast.add({
      title: "موفق",
      description: "محصول به سبد خرید اضافه شد",
      color: "success",
    });

    isOpen.value = false;
    if (props.selectedVariant?.id)
      quantity.value =
        cartStore.getCartItem(props.selectedVariant?.id, props.productId)
          ?.quantity ?? 0;

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

const removeCartItem = async () => {
  const item = cartStore.getCartItem(
    props.selectedVariant?.id as number,
    props.productId,
  );

  await cartStore.removeItem(item?.id as number);
  await cartStore.loadCart();

  quantity.value =
    cartStore.getCartItem(props.selectedVariant?.id, props.productId)
      ?.quantity ?? 0;
};

const updateCartItem = async (val: number) => {
  if (val == 0) {
    removeCartItem();
    return;
  }

  addToCart(val);
};

const goToCheckout = () => {
  router.push("/checkout/cart");
};

///// watchers /////

///// lifecycle /////
</script>

<template>
  <UCard
    :ui="{
      body: 'p-4 sm:p-4',
      root: 'bg-transparent lg:bg-white ring-0 lg:ring z-10',
    }"
  >
    <!-- <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold">افزودن به سبد خرید</h3>
          <UButton variant="ghost" icon="i-lucide-x" @click="isOpen = false" />
        </div>
      </template> -->

    <div
      class="flex gap-3 flex-row-reverse justify-between lg:block lg:space-y-4"
    >
      <div class="flex items-center lg:block">
        <!-- Stock Status -->
        <div v-if="lgAndUp" class="mb-4">
          <div v-if="isInStock" class="flex items-end gap-1 text-green-600">
            <UIcon name="i-lucide-check-circle" class="size-5" />
            <span class="text-sm font-medium">موجود در انبار</span>
            <span v-if="stock" class="text-xs text-gray-600">
              ({{ stock }} عدد)
            </span>
          </div>
          <div v-else class="flex items-center gap-2 text-red-600">
            <UIcon name="i-lucide-x-circle" class="size-5" />
            <span class="text-sm font-medium">ناموجود</span>
          </div>
        </div>
        <!-- Price -->
        <div class="flex justify-between">
          <div v-if="lgAndUp" class="text-xs text-gray-600 mb-2">
            جزئیات قیمت:
          </div>
          <div class="lg:flex items-center gap-3 lg:mb-4">
            <div class="flex flex-col">
              <div
                v-if="discountPrice"
                class="text-sm text-gray-400 line-through space-x-0.5"
              >
                <span> {{ formatPrice(priceData?.originalPrice) }} تومان </span>
                <UBadge
                  v-if="priceData?.hasDiscount"
                  color="primary"
                  class="text-white text-xs font-bold p-0.5"
                >
                  {{ priceData?.discountPercent }}%
                </UBadge>
              </div>
              <div class="text-xl text-end font-bold text-primary-600">
                {{ formatPrice(priceData?.finalPrice) }} تومان
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="flex flex-col lg:flex-row items-center lg:items-start flex-1 gap-2 lg:pt-4"
      >
        <WidgetCounter
          v-if="quantity"
          v-model="quantity"
          :min="0"
          :max="variantStock"
          :disabled="!canAddToCart || adding"
          @update:model-value="(val) => updateCartItem(val)"
        />
        <UButton
          :loading="adding"
          :disabled="!canAddToCart"
          :label="quantity ? 'مشاهده سبد خرید' : 'افزودن به سبد خرید'"
          icon="i-lucide-shopping-cart"
          class="flex-1"
          :ui="{
            base: 'py-3 justify-center w-full',
            label: 'text-[12px] whitespace-normal! text-start!',
            leadingIcon: 'size-4',
          }"
          @click="quantity ? goToCheckout() : addToCart()"
        />
      </div>
    </div>
  </UCard>
</template>

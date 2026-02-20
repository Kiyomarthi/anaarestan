<script setup lang="ts">
///// imports /////
import { useCartStore } from "~/stores/cart";
import { formatPrice } from "~~/shared/utils/format";

///// props/emits /////

///// refs /////
const router = useRouter();

///// composables/stores /////
const cartStore = useCartStore();

///// computed /////
const cart = computed(() => cartStore.cart);
const loading = computed(() => cartStore.loading);

const hasItems = computed(() => (cart.value?.items?.length || 0) > 0);

const totalPrice = computed(() => cartStore.totalPrice);

// در صورت نیاز می‌توان اینها را بعدا دقیق‌تر کرد (مثلا مالیات، سود، ...)
const totalDiscount = computed(() => 0);
const payableAmount = computed(() => totalPrice.value);

const isInitialLoading = computed(() => !cart.value && loading.value);

///// functions /////
const goToShop = () => {
  router.push("/");
};

const goToNextStep = () => {
  router.push("/checkout/shipping");
};

///// lifecycle /////
onMounted(async () => {
  if (!cart.value) {
    await cartStore.loadCart();
  }
});
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
    <!-- Cart Items -->
    <div class="lg:col-span-2 space-y-4">
      <template v-if="isInitialLoading">
        <USkeleton v-for="i in 3" :key="i" class="w-full h-28 rounded-2xl" />
      </template>

      <template v-else-if="hasItems">
        <div
          v-for="item in cart?.items"
          :key="item.id"
          class="flex gap-3 p-3 rounded-2xl border border-gray-100 bg-white"
        >
          <div class="w-24 h-24 rounded-xl overflow-hidden bg-neutral-100">
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

              <!-- نمایش ویژگی‌های وریانت انتخاب‌شده (مثلا رنگ، وزن و ...) -->
              <p
                v-if="item.variant_attributes?.length"
                class="text-xs text-gray-500 flex flex-wrap gap-1"
              >
                <template
                  v-for="attr in item.variant_attributes"
                  :key="attr.id"
                >
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
                  {{ formatPrice(Number(item.price) * Number(item.quantity)) }}
                  تومان
                </span>
              </p>
              <WidgetCounter
                :model-value="item.quantity"
                :min="0"
                :max="99"
                :disabled="cartStore.loading"
                size="sm"
                @update:model-value="
                  async (val) => {
                    if (val === 0) {
                      await cartStore.removeItem(item.id);
                    } else {
                      await cartStore.updateItemQuantity(item.id, val);
                    }
                  }
                "
              />
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <UEmpty
          title="سبد خرید شما خالی است"
          description="برای شروع خرید، به فروشگاه برگردید."
          icon="i-lucide-shopping-bag"
          :ui="{
            avatar:
              'size-20 lg:size-28 [&_.iconify]:size-10 lg:[&_.iconify]:size-16',
          }"
          :actions="[
            {
              label: 'بازگشت به فروشگاه',
              onClick: goToShop,
            },
          ]"
        />
      </template>
    </div>

    <!-- Summary -->
    <aside class="lg:col-span-1">
      <UCard
        class="sticky top-4"
        :ui="{
          body: 'space-y-4',
        }"
      >
        <h2 class="text-base font-semibold">خلاصه سفارش</h2>

        <div class="space-y-2 text-sm">
          <div class="flex items-center justify-between">
            <span class="text-gray-500">مجموع سبد</span>
            <span class="font-medium">
              {{ formatPrice(totalPrice) }} تومان
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-gray-500">سود شما از خرید</span>
            <span class="font-medium text-emerald-600">
              {{ formatPrice(totalDiscount) }} تومان
            </span>
          </div>
          <UDivider />
          <div class="flex items-center justify-between text-base">
            <span class="font-semibold">مبلغ قابل پرداخت</span>
            <span class="font-bold text-primary">
              {{ formatPrice(payableAmount) }} تومان
            </span>
          </div>
        </div>

        <UButton
          block
          size="lg"
          color="primary"
          :disabled="!hasItems || loading"
          :loading="loading"
          label="ادامه فرآیند خرید"
          class="mt-4"
          @click="goToNextStep"
        />
      </UCard>
    </aside>
  </div>
</template>

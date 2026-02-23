<script setup lang="ts">
///// imports /////
import { useCartStore } from "~/stores/cart";
import { formatPrice } from "~~/shared/utils/format";

///// props/emits /////

///// refs /////
const router = useRouter();
const toast = useToast();
const user = useUserStore();
const selectedAddressId = ref<number | null>(null);
const couponCode = ref("");
const walletAmountUsed = ref(0);
const showAddressModal = ref(false);
const validating = ref(false);
const creatingOrder = ref(false);

type Address = {
  id: number;
  is_default: number;
  province_name: string;
  city_name: string;
  full_address: string;
  postal_code: string;
  shipping_cost?: number;
};

type Wallet = {
  id: number;
  balance: number;
};

///// composables/stores /////
const cartStore = useCartStore();
const { fetch: apiFetch } = useApiRequest<any>();

///// computed /////
const cart = computed(() => cartStore.cart);
const loading = computed(() => cartStore.loading);

const hasItems = computed(() => (cart.value?.items?.length || 0) > 0);

// Addresses
const {
  fetch: fetchAddresses,
  loading: addressesLoading,
  response: addressesData,
} = useApiRequest<{ success: boolean; data: any[] }>();

const addresses = computed<Address[]>(() => addressesData.value?.data || []);

const selectedAddress = computed(() => {
  if (!selectedAddressId.value) return null;
  return addresses.value.find((a) => a.id === selectedAddressId.value) || null;
});

const shippingCost = computed(() => {
  return selectedAddress.value?.shipping_cost || 0;
});

// Wallet
const {
  fetch: fetchWallet,
  loading: walletLoading,
  response: walletData,
} = useApiRequest<{ success: boolean; data: any }>();

const wallet = computed<Wallet | null>(() => walletData.value?.data || null);
const walletBalance = computed(() => wallet?.value?.balance || 0);

const maxWalletUsage = computed(() => {
  const subtotal = cartStore.totalPrice;
  return Math.min(walletBalance.value, subtotal);
});

// Coupon
const couponDiscount = ref(0);
const couponValid = ref(false);

// Totals
const subtotalAmount = computed(() => cartStore.totalPrice);
const discountAmount = computed(() => couponDiscount.value);
const shippingAmount = computed(() => shippingCost.value);
const walletAmount = computed(() => walletAmountUsed.value);
const payableAmount = computed(() => {
  const total =
    subtotalAmount.value -
    discountAmount.value +
    shippingAmount.value -
    walletAmount.value;
  return Math.max(0, total);
});

const isInitialLoading = computed(() => !cart.value && loading.value);

const canProceed = computed(() => {
  return (
    hasItems.value &&
    selectedAddressId.value !== null &&
    !validating.value &&
    !creatingOrder.value
  );
});

///// functions /////
const loadAddresses = async () => {
  try {
    await fetchAddresses("/api/addresses");
    if (addresses.value.length > 0 && !selectedAddressId.value) {
      const defaultAddress =
        addresses.value.find((a) => a.is_default === 1) || addresses.value[0];
      selectedAddressId.value = defaultAddress.id;
    }
  } catch (error) {
    console.error("Error loading addresses:", error);
  }
};

const loadWallet = async () => {
  try {
    // Try to get user's wallet list
    const walletListResponse = (await apiFetch("/api/wallets", {
      params: { noPaginate: "true" },
    })) as { success: boolean; data: Wallet[] };

    // Get first wallet if exists
    if (
      walletListResponse?.success &&
      walletListResponse.data &&
      walletListResponse.data.length > 0
    ) {
      const walletId = walletListResponse.data[0].id;
      await fetchWallet(`/api/wallets/${walletId}`);
    }
  } catch (error) {
    // Wallet might not exist yet, that's ok
    console.log("Wallet not found, user can still proceed");
  }
};

const applyCoupon = async () => {
  if (!couponCode.value.trim()) {
    toast.add({
      title: "خطا",
      description: "لطفا کد کوپن را وارد کنید",
      color: "error",
    });
    return;
  }

  try {
    const response = (await apiFetch("/api/coupons/validate", {
      method: "POST",
      body: {
        code: couponCode.value.trim(),
        subtotal_amount: subtotalAmount.value,
      },
    })) as {
      success: boolean;
      valid: boolean;
      message?: string;
      data?: { discount_amount?: number };
    };

    if (response?.success && response.valid && response.data) {
      couponValid.value = true;
      couponDiscount.value = response.data.discount_amount || 0;

      toast.add({
        title: "موفق",
        description: "کوپن اعمال شد",
        color: "success",
      });
    } else {
      toast.add({
        title: "خطا",
        description: response?.message || "کوپن معتبر نیست",
        color: "error",
      });
    }
  } catch (error: any) {
    toast.add({
      title: "خطا",
      description:
        error?.data?.message || "خطا در اعمال کوپن، لطفا دوباره تلاش کنید",
      color: "error",
    });
  }
};

const removeCoupon = () => {
  couponCode.value = "";
  couponDiscount.value = 0;
  couponValid.value = false;
};

const updateWalletUsage = (amount: number) => {
  walletAmountUsed.value = Math.max(0, Math.min(amount, maxWalletUsage.value));
};

const validateBeforePayment = async () => {
  if (!cart.value || !selectedAddressId.value) return false;

  validating.value = true;
  try {
    const response = (await apiFetch("/api/orders/validate-before-payment", {
      method: "POST",
      body: {
        cart_id: cart.value.id,
        address_id: selectedAddressId.value,
        coupon_code: couponCode.value.trim() || null,
        wallet_amount_used: walletAmount.value,
      },
    })) as {
      success: boolean;
      valid: boolean;
      data?: { discount_amount?: number };
      errors?: string[];
    };

    if (response?.success && response.valid) {
      // Update coupon discount from validation response
      if (response.data?.discount_amount !== undefined) {
        couponDiscount.value = response.data.discount_amount;
      }

      return true;
    } else {
      const errors = response?.errors || ["خطا در اعتبارسنجی"];
      toast.add({
        title: "خطا",
        description: errors.join(", "),
        color: "error",
      });
      return false;
    }
  } catch (error: any) {
    toast.add({
      title: "خطا",
      description:
        error?.data?.message || "خطا در اعتبارسنجی، لطفا دوباره تلاش کنید",
      color: "error",
    });
    return false;
  } finally {
    validating.value = false;
  }
};

const createOrder = async () => {
  if (!cart.value || !selectedAddressId.value) return;

  const isValid = await validateBeforePayment();
  if (!isValid) return;

  creatingOrder.value = true;
  try {
    const response = (await apiFetch("/api/orders", {
      method: "POST",
      body: {
        cart_id: cart.value.id,
        address_id: selectedAddressId.value,
        coupon_code: couponCode.value.trim() || null,
        wallet_amount_used: walletAmount.value,
        payment_method: null, // Will be set after payment gateway
      },
    })) as { success: boolean; data?: { id: number } };

    if (response?.success && response.data) {
      toast.add({
        title: "موفق",
        description: "سفارش شما با موفقیت ثبت شد",
        color: "success",
      });

      // Redirect to payment or order confirmation
      router.push(`/orders/${response.data.id}`);
    }
  } catch (error: any) {
    toast.add({
      title: "خطا",
      description:
        error?.data?.message || "خطا در ثبت سفارش، لطفا دوباره تلاش کنید",
      color: "error",
    });
  } finally {
    creatingOrder.value = false;
  }
};

const goBack = () => {
  router.push("/checkout/cart");
};

const onAddressCreated = async (address: Address) => {
  try {
    await loadAddresses();
    selectedAddressId.value = address.id;
    showAddressModal.value = false;
  } catch (error) {
    console.error("Error refreshing addresses:", error);
  }
};

///// lifecycle /////
onMounted(async () => {
  if (!cart.value) {
    await cartStore.loadCart();
  }

  if (hasItems.value) {
    if (user.isLoggedIn) {
      await Promise.all([loadAddresses(), loadWallet()]);
    } else {
      user.modal = true;
      user.alert = "جهت ثبت سفارش ابتدا وارد حساب کاربری خود شوید";
      user.isRequired = true;
      user.doAfterLogin = async () => {
        await nextTick();
        await Promise.all([loadAddresses(), loadWallet()]);
      };
    }
  } else {
    await navigateTo("/");
  }
});
</script>

<template>
  <div>
    <div class="lg:grid grid-cols-1 lg:grid-cols-7 gap-6">
      <section class="col-span-5 space-y-6">
        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold">انتخاب آدرس</h2>
          </template>

          <template v-if="addressesLoading">
            <USkeleton class="w-full h-32 rounded-xl" />
          </template>

          <template v-else-if="addresses.length > 0">
            <div class="space-y-3">
              <URadioGroup
                v-model="selectedAddressId"
                :items="
                  addresses.map((addr) => ({
                    value: addr.id,
                    label: `${addr.province_name}، ${addr.city_name} - ${addr.full_address}`,
                    description: `کدپستی: ${addr.postal_code}`,
                  }))
                "
                value-key="value"
                :ui="{
                  fieldset: 'space-y-3',
                }"
              />

              <UButton
                variant="outline"
                color="primary"
                block
                @click="showAddressModal = true"
              >
                افزودن آدرس جدید
              </UButton>
            </div>
          </template>

          <template v-else>
            <UEmpty
              title="آدرسی ثبت نشده است"
              description="لطفا آدرس خود را اضافه کنید"
              icon="i-lucide-map-pin"
            >
              <template #actions>
                <UButton color="primary" @click="showAddressModal = true">
                  افزودن آدرس
                </UButton>
              </template>
            </UEmpty>
          </template>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold">سبد خرید</h2>
          </template>

          <template v-if="isInitialLoading">
            <USkeleton
              v-for="i in 3"
              :key="i"
              class="w-full h-28 rounded-xl mb-3"
            />
          </template>

          <template v-else-if="hasItems">
            <div class="space-y-3">
              <div
                v-for="item in cart?.items"
                :key="item.id"
                class="flex gap-3 p-3 rounded-xl border border-gray-100 bg-white"
              >
                <div
                  class="w-20 h-20 rounded-lg overflow-hidden bg-neutral-100"
                >
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
                        {{
                          formatPrice(
                            Number(item.price) * Number(item.quantity),
                          )
                        }}
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
            </div>
          </template>

          <template v-else>
            <UEmpty
              title="سبد خرید شما خالی است"
              description="برای شروع خرید، به فروشگاه برگردید."
              icon="i-lucide-shopping-bag"
            >
              <template #actions>
                <UButton color="primary" @click="goBack">
                  بازگشت به سبد خرید
                </UButton>
              </template>
            </UEmpty>
          </template>
        </UCard>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  @click="removeCoupon"
                />
              </div>

              <UInput
                v-else
                v-model="couponCode"
                placeholder="کد تخفیف را وارد کنید"
                :disabled="validating || creatingOrder"
              />

              <UButton
                v-if="!couponValid"
                block
                variant="outline"
                :disabled="!couponCode.trim() || validating || creatingOrder"
                @click="applyCoupon"
              >
                اعمال کوپن
              </UButton>
            </div>
          </UCard>

          <UCard v-if="walletBalance > 0">
            <template #header>
              <h3 class="text-base font-semibold">کیف پول</h3>
            </template>

            <div class="space-y-3">
              <div
                class="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200"
              >
                <div>
                  <p class="text-sm font-medium text-blue-800">
                    موجودی کیف پول
                  </p>
                  <p class="text-xs text-blue-600">
                    {{ formatPrice(walletBalance) }} تومان
                  </p>
                </div>
              </div>

              <UInput
                v-model.number="walletAmountUsed"
                type="number"
                :min="0"
                :max="maxWalletUsage"
                placeholder="مبلغ استفاده از کیف پول"
                :disabled="validating || creatingOrder"
              />

              <UButton
                block
                variant="outline"
                size="sm"
                :disabled="validating || creatingOrder"
                @click="updateWalletUsage(maxWalletUsage)"
              >
                استفاده از کل موجودی
              </UButton>
            </div>
          </UCard>
        </div>
      </section>

      <div class="lg:sticky lg:top-6 self-start col-span-2">
        <aside>
          <UCard>
            <template #header>
              <h2 class="text-lg font-semibold">خلاصه سفارش</h2>
            </template>

            <div class="space-y-3">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500">مجموع سبد</span>
                <span class="font-medium">
                  {{ formatPrice(subtotalAmount) }} تومان
                </span>
              </div>

              <div
                v-if="discountAmount > 0"
                class="flex items-center justify-between text-sm"
              >
                <span class="text-gray-500">تخفیف</span>
                <span class="font-medium text-emerald-600">
                  -{{ formatPrice(discountAmount) }} تومان
                </span>
              </div>

              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500">هزینه ارسال</span>
                <span class="font-medium">
                  {{ formatPrice(shippingAmount) }} تومان
                </span>
              </div>

              <div
                v-if="walletAmount > 0"
                class="flex items-center justify-between text-sm"
              >
                <span class="text-gray-500">استفاده از کیف پول</span>
                <span class="font-medium text-blue-600">
                  -{{ formatPrice(walletAmount) }} تومان
                </span>
              </div>

              <UDivider />

              <div class="flex items-center justify-between text-base">
                <span class="font-semibold">مبلغ قابل پرداخت</span>
                <span class="font-bold text-primary">
                  {{ formatPrice(payableAmount) }} تومان
                </span>
              </div>

              <div class="flex gap-3 pt-2">
                <UButton
                  variant="outline"
                  block
                  :disabled="creatingOrder"
                  @click="goBack"
                >
                  بازگشت
                </UButton>

                <UButton
                  block
                  size="lg"
                  color="primary"
                  :disabled="!canProceed"
                  :loading="creatingOrder"
                  @click="createOrder"
                >
                  ادامه به پرداخت
                </UButton>
              </div>
            </div>
          </UCard>
        </aside>
      </div>
    </div>
    <WidgetResponseModal
      v-model:open="showAddressModal"
      title="افزودن آدرس جدید"
    >
      <ModelAddreessCreateForm
        :open="showAddressModal"
        :default-is-default="addresses.length === 0"
        @created="onAddressCreated"
        @cancel="showAddressModal = false"
      />
    </WidgetResponseModal>
  </div>
</template>

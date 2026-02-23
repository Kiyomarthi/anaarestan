<script setup lang="ts">
///// imports /////
import { useCartStore } from "~/stores/cart";

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

const onWalletAmountUsedChange = (amount: number) => {
  updateWalletUsage(amount);
};

const onCartItemQuantityChange = async (payload: {
  itemId: number;
  quantity: number;
}) => {
  if (payload.quantity === 0) {
    await cartStore.removeItem(payload.itemId);
    return;
  }

  await cartStore.updateItemQuantity(payload.itemId, payload.quantity);
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
        <WidgetCheckoutShippingAddress
          :addresses-loading="addressesLoading"
          :addresses="addresses"
          :selected-address-id="selectedAddressId"
          @update:selected-address-id="selectedAddressId = $event"
          @add-address="showAddressModal = true"
        />

        <WidgetCheckoutCartItems
          :is-initial-loading="isInitialLoading"
          :has-items="hasItems"
          :items="cart?.items || []"
          :loading="cartStore.loading"
          @update-quantity="onCartItemQuantityChange"
          @go-back="goBack"
        />

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <WidgetCheckoutCouponCard
            :coupon-code="couponCode"
            :coupon-valid="couponValid"
            :coupon-discount="couponDiscount"
            :disabled="validating || creatingOrder"
            @update:coupon-code="couponCode = $event"
            @apply="applyCoupon"
            @remove="removeCoupon"
          />

          <WidgetCheckoutWalletCard
            :wallet-balance="walletBalance"
            :wallet-amount-used="walletAmountUsed"
            :max-wallet-usage="maxWalletUsage"
            :disabled="validating || creatingOrder"
            @update:wallet-amount-used="onWalletAmountUsedChange"
            @use-max="updateWalletUsage(maxWalletUsage)"
          />
        </div>
      </section>

      <WidgetCheckoutOrderSummary
        :subtotal-amount="subtotalAmount"
        :discount-amount="discountAmount"
        :shipping-amount="shippingAmount"
        :wallet-amount="walletAmount"
        :payable-amount="payableAmount"
        :can-proceed="canProceed"
        :creating-order="creatingOrder"
        @confirm="createOrder"
      />
    </div>
    <WidgetResponseModal
      v-model:open="showAddressModal"
      title="افزودن آدرس جدید"
      content-class="w-[600px]"
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

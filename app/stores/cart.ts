import type { ApiResponse } from "~~/shared/types/api";

export interface CartItem {
  id: number;
  cart_id: number;
  product_id: number;
  product_variant_id?: number | null;
  quantity: number;
  price: string;
  created_at: string;
  updated_at: string;
}

export interface Cart {
  id: number;
  user_id: number | null;
  status: "active" | "converted" | "abandoned";
  created_at: string;
  updated_at: string;
  items?: CartItem[];
}

export const useCartStore = defineStore(
  "cart",
  () => {
    const cart = ref<Cart | null>(null);
    const loading = ref(false);
    const userStore = useUserStore();
    const { fetch: apiFetch } = useApiRequest();
    const toast = useToast();

    // Get or create cart ID from cookie
    const getCartId = (): number | null => {
      const cartIdCookie = useCookie<number | null>("cart_id");
      return cartIdCookie.value;
    };

    const setCartId = (id: number | null) => {
      const cartIdCookie = useCookie<number | null>("cart_id", {
        maxAge: 60 * 60 * 24 * 2, // 2 days
      });

      cartIdCookie.value = id;
    };

    const getCartItem = (variant_id: number, product_id: number) => {
      if (!cart.value?.items?.length) return null;
      return cart.value?.items?.find(
        (item) =>
          item?.product_variant_id == variant_id &&
          item?.product_id == product_id,
      );
    };

    // Initialize cart - fetch existing or create new
    const initializeCart = async () => {
      if (loading.value) return;

      loading.value = true;
      try {
        const cartId = getCartId();

        if (cartId) {
          // Try to fetch existing cart
          try {
            const response = await $fetch<ApiResponse<Cart>>(
              `/api/carts/${cartId}`,
              {
                headers: userStore.token
                  ? { Authorization: `Bearer ${userStore.token}` }
                  : {},
              },
            );

            if (response.success && response.data) {
              cart.value = response.data;
              setCartId(response.data.id);

              // If user is logged in and cart has no user_id, update it
              if (userStore.isLoggedIn && !response.data.user_id) {
                await syncCartWithUser();
              }
              return;
            }
          } catch (error: any) {
            // Cart not found or error, create new one
            if (error.statusCode === 404) {
              setCartId(null);
            }
          }
        }

        // Create new cart
      } catch (error) {
        console.error("Error initializing cart:", error);
      } finally {
        loading.value = false;
      }
    };

    // Create new cart
    const createCart = async () => {
      try {
        const response = await apiFetch<ApiResponse<Cart>>("/api/carts", {
          method: "POST",
          body: {
            user_id: userStore.isLoggedIn ? userStore.user?.id : null,
            status: "active",
          },
        });

        if (response?.success && response.data) {
          cart.value = response.data;
          setCartId(response.data.id);
        }
      } catch (error) {
        console.error("Error creating cart:", error);
      }
    };

    // Sync cart with user when user logs in
    const syncCartWithUser = async () => {
      if (
        !userStore.isLoggedIn ||
        !cart.value ||
        cart.value?.user_id == userStore.user?.id
      )
        return;

      try {
        await apiFetch<ApiResponse<Cart>>(`/api/carts/${cart.value.id}`, {
          method: "PATCH",
          body: {
            user_id: userStore.user?.id,
          },
        });

        // Reload cart
        await loadCart();
      } catch (error) {
        console.error("Error syncing cart with user:", error);
      }
    };

    // Load cart by ID
    const loadCart = async (cartId?: number) => {
      const id = cartId || getCartId();
      if (!id) {
        await initializeCart();
        return;
      }

      loading.value = true;
      try {
        const response = await $fetch<ApiResponse<Cart>>(`/api/carts/${id}`, {
          headers: userStore.token
            ? { Authorization: `Bearer ${userStore.token}` }
            : {},
        });

        if (response.success && response.data) {
          cart.value = response.data;
          setCartId(response.data.id);
        }
      } catch (error: any) {
        if (error.statusCode === 404) {
          // Cart not found, create new one
          setCartId(null);
          await createCart();
        }
      } finally {
        loading.value = false;
      }
    };

    // Add item to cart
    const addItem = async (
      productId: number,
      quantity: number,
      price: string,
      productVariantId?: number | null,
    ) => {
      if (!cart.value) {
        await initializeCart();
      }

      if (!cart.value) {
        await createCart();
      }

      if (!cart.value) {
        throw new Error("سبد خرید ایجاد نشد");
      }

      loading.value = true;
      quantity = quantity <= 0 ? 1 : quantity;
      try {
        const response = await apiFetch<ApiResponse<CartItem>>(
          "/api/cart-items",
          {
            method: "POST",
            body: {
              cart_id: cart.value.id,
              product_id: productId,
              product_variant_id: productVariantId ?? null,
              quantity,
              price,
            },
          },
        );

        if (response?.success) {
          // Reload cart to get updated items
          await loadCart();
        }

        return response;
      } catch (error) {
        throw error;
      } finally {
        loading.value = false;
      }
    };

    // Update item quantity
    const updateItemQuantity = async (itemId: number, quantity: number) => {
      if (!cart.value) return;

      loading.value = true;
      try {
        await apiFetch(`/api/cart-items/${itemId}`, {
          method: "PATCH",
          body: {
            quantity,
          },
        });

        // Reload cart
        await loadCart();
      } catch (error) {
        throw error;
      } finally {
        loading.value = false;
      }
    };

    // Remove item from cart
    const removeItem = async (itemId: number) => {
      if (!cart.value) return;

      loading.value = true;
      try {
        await apiFetch(`/api/cart-items/${itemId}`, {
          method: "DELETE",
        });

        toast.add({
          title: "موفق",
          description: "محصول از سبد خرید شما حذف شد",
          color: "success",
        });

        // Reload cart
        await loadCart();
      } catch (error) {
        throw error;
      } finally {
        loading.value = false;
      }
    };

    // Get total items count
    const totalItems = computed(() => {
      if (!cart.value?.items) return 0;
      return cart.value.items.reduce((sum, item) => sum + item.quantity, 0);
    });

    // Get total price
    const totalPrice = computed(() => {
      if (!cart.value?.items) return 0;
      return cart.value.items.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0,
      );
    });

    // Check if product is in cart
    const isProductInCart = (productId: number): boolean => {
      if (!cart.value?.items) return false;
      return cart.value.items.some((item) => item.product_id === productId);
    };

    // Get product quantity in cart
    const getProductQuantity = (productId: number): number => {
      if (!cart.value?.items) return 0;
      const item = cart.value.items.find(
        (item) => item.product_id === productId,
      );
      return item?.quantity || 0;
    };

    // Clear cart
    const clearCart = () => {
      cart.value = null;
      setCartId(null);
    };

    return {
      cart,
      loading,
      totalItems,
      totalPrice,
      initializeCart,
      loadCart,
      addItem,
      updateItemQuantity,
      removeItem,
      isProductInCart,
      getProductQuantity,
      clearCart,
      syncCartWithUser,
      getCartItem,
    };
  },
  {
    persist: {
      key: "cart",
      storage: "local",
      paths: [],
      encrypt: true,
    },
  },
);

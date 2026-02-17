<script setup lang="ts">
// @ts-nocheck
import type { FormSubmitEvent } from "#ui/types";
import { computed, reactive, watch, ref } from "vue";
import { formatPrice } from "~~/shared/utils/format";

const props = defineProps<{
  mode: "create" | "edit";
  initialData?: any;
  saving?: boolean;
}>();

const emit = defineEmits<{
  submit: [payload: any];
}>();

const toast = useToast();
const route = useRoute();

const isEdit = computed(() => props.mode === "edit");

type FormState = {
  user_id: number | null;
  status: "active" | "converted" | "abandoned";
};

const formState = reactive<FormState>({
  user_id: null,
  status: "active",
});

const items = ref<any[]>([]);

const itemForm = reactive({
  product_id: null as number | null,
  product_variant_id: null as number | null,
  quantity: 1,
  price: 0,
});

const editItemModal = ref(false);
const deleteItemModal = ref(false);
const editingItem = ref<any>(null);
const deletingItem = ref<any>(null);

const {
  loading: usersLoading,
  response: usersResponse,
  fetch: fetchUsers,
} = useApiRequest<any>();

const {
  loading: productsLoading,
  response: productsResponse,
  fetch: fetchProducts,
} = useApiRequest<any>();

const { loading: itemLoading, fetch: sendItemRequest } = useApiRequest<any>();

const userSearch = ref("");
const user = useUserStore();
const productSearch = ref("");

const loadUsers = async () => {
  await fetchUsers("/api/users", {
    method: "GET",
    query: {
      search: userSearch.value || undefined,
      page: 1,
      perPage: 20,
    },
  });
};

const loadProducts = async () => {
  await fetchProducts("/api/products", {
    method: "GET",
    query: {
      search: productSearch.value || undefined,
      page: 1,
      limit: 20,
    },
  });
};

const ensureUsersLoaded = async () => {
  if (!(usersResponse.value as any)?.data?.length) {
    await loadUsers();
  }
};

const ensureProductsLoaded = async () => {
  if (!(productsResponse.value as any)?.data?.length) {
    await loadProducts();
  }
};

const debouncedLoadUser = debounce(() => {
  loadUsers();
}, 400);

const debouncedLoadProduct = debounce(() => {
  loadProducts();
}, 400);

watch(userSearch, () => {
  debouncedLoadUser();
});

watch(productSearch, () => {
  debouncedLoadProduct();
});

const userOptions = computed(() =>
  ((usersResponse.value as any)?.data || []).map((u: any) => ({
    label: `${u.full_name || u.phone || "کاربر"}`,
    phone: u.phone,
    id: u.id,
    value: u.id,
  })),
);

const productOptions = computed(() =>
  ((productsResponse.value as any)?.data || []).map((p: any) => ({
    label: `${p.title || "محصول"}`,
    code: p.code,
    slug: p.slug,
    value: p.id,
  })),
);

const cartId = computed(() =>
  Number(
    (props.initialData as any)?.data?.id ?? (props.initialData as any)?.id,
  ),
);

watch(
  () => props.initialData,
  (val) => {
    if (!val) return;
    const data = val.data || val;
    if (!data) return;

    formState.user_id = data.user_id ?? null;
    formState.status = data.status ?? "active";
    items.value = Array.isArray(data.items) ? data.items : [];
  },
  { immediate: true },
);

onMounted(() => {
  if (props.mode !== "create") return;
  const qUser = route.query.user_id as string | undefined;
  if (qUser && !formState.user_id) {
    formState.user_id = Number(qUser);
  }
});

function validateForm(state: FormState) {
  const errors: any[] = [];
  if (!state.status) {
    errors.push({ name: "status", message: "انتخاب وضعیت الزامی است" });
  }
  return errors;
}

const onError = () => {
  toast.add({ title: "فیلدها را بررسی کنید", color: "error" });
};

const onSubmit = (e: FormSubmitEvent<FormState>) => {
  const payload: any = {
    user_id: formState.user_id,
    status: formState.status,
  };

  if (props.mode === "create") {
    payload.items = items.value.map((item) => ({
      product_id: Number(item.product_id),
      quantity: Number(item.quantity),
      price: Number(item.price),
    }));
  }

  emit("submit", payload);
};

const pageTitle = computed(() =>
  props.mode === "create" ? "ایجاد سبد خرید" : "ویرایش سبد خرید",
);
const pageDescription = computed(() =>
  props.mode === "create" ? "فرم ثبت سبد خرید جدید" : "مدیریت اطلاعات سبد خرید",
);

const itemsTotal = computed(() =>
  (items.value || []).reduce(
    (sum: number, item: any) =>
      sum + Number(item.quantity) * Number(item.price),
    0,
  ),
);

const resetItemForm = () => {
  itemForm.product_id = null;
  itemForm.product_variant_id = null;
  itemForm.quantity = 1;
  itemForm.price = 0;
};

const addItemToList = () => {
  if (!itemForm.product_id) {
    toast.add({ title: "محصول را انتخاب کنید", color: "error" });
    return;
  }
  if (!itemForm.quantity || Number(itemForm.quantity) <= 0) {
    toast.add({ title: "تعداد معتبر نیست", color: "error" });
    return;
  }
  if (Number(itemForm.price) < 0) {
    toast.add({ title: "قیمت معتبر نیست", color: "error" });
    return;
  }

  const existing = items.value.find(
    (i) =>
      Number(i.product_id) === Number(itemForm.product_id) &&
      Number(i.product_variant_id || 0) ===
        Number(itemForm.product_variant_id || 0),
  );

  if (existing) {
    existing.quantity = Number(existing.quantity) + Number(itemForm.quantity);
    existing.price = Number(itemForm.price);
  } else {
    items.value.push({
      product_id: Number(itemForm.product_id),
      product_variant_id: itemForm.product_variant_id
        ? Number(itemForm.product_variant_id)
        : null,
      quantity: Number(itemForm.quantity),
      price: Number(itemForm.price),
    });
  }

  resetItemForm();
};

const addItemApi = async () => {
  if (!cartId.value) {
    toast.add({ title: "شناسه سبد خرید یافت نشد", color: "error" });
    return;
  }

  if (!itemForm.product_id) {
    toast.add({ title: "محصول را انتخاب کنید", color: "error" });
    return;
  }
  if (!itemForm.quantity || Number(itemForm.quantity) <= 0) {
    toast.add({ title: "تعداد معتبر نیست", color: "error" });
    return;
  }
  if (Number(itemForm.price) < 0) {
    toast.add({ title: "قیمت معتبر نیست", color: "error" });
    return;
  }

  const result = await sendItemRequest("/api/cart-items", {
    method: "POST",
    body: {
      cart_id: user.isLoggedIn ? cartId.value : null,
      product_id: Number(itemForm.product_id),
      product_variant_id: itemForm.product_variant_id
        ? Number(itemForm.product_variant_id)
        : null,
      quantity: Number(itemForm.quantity),
      price: Number(itemForm.price),
    },
    errorTitle: "خطا در افزودن آیتم",
  });

  const existingIndex = items.value.findIndex(
    (i) => Number(i.id) === Number(result?.data?.id),
  );

  if (existingIndex >= 0) {
    items.value[existingIndex] = result.data;
  } else {
    const sameProductIndex = items.value.findIndex(
      (i) =>
        Number(i.product_id) === Number(result?.data?.product_id) &&
        Number(i.product_variant_id || 0) ===
          Number(result?.data?.product_variant_id || 0),
    );
    if (sameProductIndex >= 0) {
      items.value[sameProductIndex] = result.data;
    } else {
      items.value.push(result.data);
    }
  }

  resetItemForm();
  toast.add({ title: "آیتم اضافه شد", color: "success" });
};

const openEditItem = (item: any) => {
  editingItem.value = { ...item };
  editItemModal.value = true;
};

const saveEditItem = async () => {
  if (!editingItem.value) return;

  if (!editingItem.value.quantity || Number(editingItem.value.quantity) <= 0) {
    toast.add({ title: "تعداد معتبر نیست", color: "error" });
    return;
  }
  if (Number(editingItem.value.price) < 0) {
    toast.add({ title: "قیمت معتبر نیست", color: "error" });
    return;
  }

  const result = await sendItemRequest(
    `/api/cart-items/${editingItem.value.id}`,
    {
      method: "PATCH",
      body: {
        quantity: Number(editingItem.value.quantity),
        price: Number(editingItem.value.price),
      },
      errorTitle: "خطا در بروزرسانی آیتم",
    },
  );

  const index = items.value.findIndex(
    (i) => Number(i.id) === Number(editingItem.value.id),
  );
  if (index >= 0) items.value[index] = result.data;

  editItemModal.value = false;
  toast.add({ title: "آیتم بروزرسانی شد", color: "success" });
};

const confirmDeleteItem = (item: any) => {
  deletingItem.value = item;
  deleteItemModal.value = true;
};

const deleteItem = async () => {
  if (!deletingItem.value) return;
  await sendItemRequest(`/api/cart-items/${deletingItem.value.id}`, {
    method: "DELETE",
    errorTitle: "خطا در حذف آیتم",
  });

  items.value = items.value.filter(
    (i) => Number(i.id) !== Number(deletingItem.value.id),
  );

  deleteItemModal.value = false;
  toast.add({ title: "آیتم حذف شد", color: "success" });
};

const removeLocalItemByRow = (item: any) => {
  const index = items.value.findIndex(
    (i) =>
      Number(i.product_id) === Number(item.product_id) &&
      Number(i.product_variant_id || 0) ===
        Number(item.product_variant_id || 0) &&
      Number(i.quantity) === Number(item.quantity) &&
      Number(i.price) === Number(item.price),
  );
  if (index >= 0) items.value.splice(index, 1);
};

const itemColumns = computed(() => [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "product_id", header: "محصول" },
  { accessorKey: "product_variant_id", header: "تنوع محصول" },
  { accessorKey: "quantity", header: "تعداد" },
  { accessorKey: "price", header: "قیمت" },
  { accessorKey: "created_at", header: "تاریخ" },
  { accessorKey: "actions", header: "عملیات" },
]);

const statusOptions = [
  { label: "فعال", value: "active" },
  { label: "تبدیل شده", value: "converted" },
  { label: "رها شده", value: "abandoned" },
];
</script>

<template>
  <div class="md:p-4">
    <UPage>
      <UPageHeader
        :title="pageTitle"
        :description="pageDescription"
        :ui="{ root: 'pt-0 pb-4' }"
      />

      <UPageBody>
        <UCard>
          <UForm
            :state="formState"
            :validate="validateForm"
            @submit="onSubmit"
            @error="onError"
          >
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UFormField label="کاربر" name="user_id">
                <USelectMenu
                  v-model="formState.user_id"
                  v-model:search-term="userSearch"
                  :items="userOptions"
                  value-key="value"
                  searchable
                  clear
                  placeholder="انتخاب کاربر (اختیاری)"
                  :loading="usersLoading"
                  @focus="ensureUsersLoaded"
                >
                  <template #item-label="{ item }">
                    <div class="flex flex-col">
                      <span>نام: {{ item.label }}</span>
                      <span class="text-xs text-gray-500">
                        تلفن:{{ item.phone }}
                      </span>
                      <span class="text-xs text-gray-500">
                        آیدی:{{ item.id }}
                      </span>
                    </div>
                  </template>
                </USelectMenu>
              </UFormField>

              <UFormField label="وضعیت" name="status" required>
                <USelectMenu
                  v-model="formState.status"
                  :items="statusOptions"
                  value-key="value"
                />
              </UFormField>
            </div>

            <div class="mt-6 flex justify-end gap-3">
              <UButton
                color="neutral"
                variant="ghost"
                label="انصراف"
                @click="$router.back()"
              />
              <UButton
                type="submit"
                color="primary"
                :loading="saving"
                icon="i-lucide-save"
              >
                ذخیره
              </UButton>
            </div>
          </UForm>
        </UCard>

        <UCard class="mt-6">
          <div class="flex items-center justify-between mb-3">
            <div class="font-medium">آیتم‌های سبد خرید</div>
            <div class="text-sm text-gray-500">
              تعداد: {{ items.length }} | جمع کل:
              {{ formatPrice(itemsTotal) || "0" }}
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <UFormField label="محصول">
              <USelectMenu
                v-model="itemForm.product_id"
                v-model:search-term="productSearch"
                :items="productOptions"
                value-key="value"
                searchable
                placeholder="انتخاب محصول"
                :loading="productsLoading"
                @focus="ensureProductsLoaded"
              >
                <template #item-label="{ item }">
                  <div class="flex flex-col">
                    <span>نام: {{ item.label }}</span>
                    <span class="text-xs text-gray-500"
                      >کد:{{ item.code }}</span
                    >
                    <span class="text-xs text-gray-500">
                      اسلاگ:{{ item.slug }}
                    </span>
                  </div>
                </template>
              </USelectMenu>
            </UFormField>

            <UFormField label="شناسه تنوع محصول">
              <UInput
                v-model="itemForm.product_variant_id"
                type="number"
                min="1"
                inputmode="numeric"
              />
            </UFormField>

            <UFormField label="تعداد">
              <UInput
                v-model="itemForm.quantity"
                type="number"
                min="1"
                inputmode="numeric"
              />
            </UFormField>

            <UFormField label="قیمت">
              <UInput v-model="itemForm.price" type="number" min="0" />
            </UFormField>

            <div class="flex items-end">
              <UButton
                icon="i-lucide-plus"
                color="primary"
                class="w-full"
                :loading="itemLoading"
                @click="isEdit ? addItemApi() : addItemToList()"
              >
                افزودن آیتم
              </UButton>
            </div>
          </div>

          <UTable
            :data="items"
            :columns="itemColumns"
            empty-state-icon="i-lucide-shopping-basket"
            empty-state-title="آیتمی ثبت نشده است"
          >
            <template #price-cell="{ row }">
              <span class="text-xs text-gray-700">
                {{ formatPrice(row.original.price) || "0" }}
              </span>
            </template>

            <template #created_at-cell="{ row }">
              <span class="text-xs text-gray-600">
                {{
                  row.original.created_at
                    ? new Date(row.original.created_at).toLocaleDateString(
                        "fa-IR",
                      )
                    : "-"
                }}
              </span>
            </template>

            <template #actions-cell="{ row }">
              <div class="flex items-center gap-2">
                <UButton
                  v-if="isEdit"
                  size="xs"
                  color="warning"
                  variant="ghost"
                  icon="i-lucide-pencil"
                  :disabled="itemLoading"
                  @click="openEditItem(row.original)"
                >
                  ویرایش
                </UButton>
                <UButton
                  size="xs"
                  color="primary"
                  variant="ghost"
                  icon="i-lucide-trash"
                  :disabled="itemLoading"
                  @click="
                    isEdit
                      ? confirmDeleteItem(row.original)
                      : removeLocalItemByRow(row.original)
                  "
                >
                  حذف
                </UButton>
              </div>
            </template>
          </UTable>
        </UCard>
      </UPageBody>
    </UPage>

    <UModal
      v-model:open="editItemModal"
      title="ویرایش آیتم"
      :ui="{ footer: 'justify-end' }"
    >
      <template #body>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormField label="تعداد">
            <UInput
              v-model="editingItem.quantity"
              type="number"
              min="1"
              inputmode="numeric"
            />
          </UFormField>
          <UFormField label="قیمت">
            <UInput v-model="editingItem.price" type="number" min="0" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <UButton
          color="primary"
          variant="subtle"
          label="ذخیره"
          :loading="itemLoading"
          @click="saveEditItem"
        />
        <UButton
          label="انصراف"
          color="neutral"
          variant="outline"
          @click="editItemModal = false"
        />
      </template>
    </UModal>

    <UModal
      v-model:open="deleteItemModal"
      title="تایید عملیات"
      description="آیا از حذف آیتم مطمئن هستید؟"
      :ui="{ footer: 'justify-end' }"
    >
      <template #footer>
        <UButton
          color="primary"
          variant="subtle"
          label="تایید حذف"
          :loading="itemLoading"
          @click="deleteItem"
        />
        <UButton
          label="انصراف"
          color="neutral"
          variant="outline"
          @click="deleteItemModal = false"
        />
      </template>
    </UModal>
  </div>
</template>

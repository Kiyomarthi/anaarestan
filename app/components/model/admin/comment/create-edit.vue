<script setup lang="ts">
// @ts-nocheck
import type { FormSubmitEvent } from "#ui/types";
import { computed, reactive, watch, ref } from "vue";
import { useApiFetch } from "~/composables/useApiFetch";

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

type FormState = {
  user_id: number | null;
  product_id: number | null;
  rating: number | null;
  comment: string;
  status: number;
};

const formState = reactive<FormState>({
  user_id: null,
  product_id: null,
  rating: 5,
  comment: "",
  status: 0,
});

const {
  loading: usersLoading,
  response: usersResponse,
  fetch: fetchUsers,
} = useApiRequest<any>();

// محصولات برای فیلتر
const {
  loading: productsLoading,
  response: productsResponse,
  fetch: fetchProducts,
} = useApiRequest<any>();

const userStore = useUserStore();
const token = userStore.token;

const userSearch = ref("");
const productSearch = ref("");

const loadUsers = async () => {
  await fetchUsers("/api/users", {
    method: "GET",
    headers: { Authorization: token },
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

watch(
  () => props.initialData,
  (val) => {
    if (!val) return;
    const data = val.data || val;
    if (!data) return;

    formState.user_id = data.user_id ?? null;
    formState.product_id = data.product_id ?? null;
    formState.rating = data.rating ?? 5;
    formState.comment = data.comment ?? "";
    formState.status = data.status ?? 0;
  },
  { immediate: true },
);

// Prefill from query (when coming from user/product pages)
onMounted(() => {
  const qUser = route.query.user_id as string | undefined;
  const qProduct = route.query.product_id as string | undefined;
  if (qUser && !formState.user_id) {
    formState.user_id = Number(qUser);
  }
  if (qProduct && !formState.product_id) {
    formState.product_id = Number(qProduct);
  }
});

function validateForm(state: FormState) {
  const errors: any[] = [];
  if (!state.user_id) {
    errors.push({ name: "user_id", message: "انتخاب کاربر الزامی است" });
  }
  if (!state.product_id) {
    errors.push({ name: "product_id", message: "انتخاب محصول الزامی است" });
  }
  if (!state.rating || state.rating < 1 || state.rating > 5) {
    errors.push({ name: "rating", message: "امتیاز بین 1 تا 5" });
  }
  return errors;
}

const onError = () => {
  toast.add({ title: "فیلدها را بررسی کنید", color: "error" });
};

const onSubmit = (e: FormSubmitEvent<FormState>) => {
  emit("submit", {
    user_id: formState.user_id,
    product_id: formState.product_id,
    rating: formState.rating,
    comment: formState.comment || null,
    status: formState.status,
  });
};

const pageTitle = computed(() =>
  props.mode === "create" ? "ایجاد نظر" : "ویرایش نظر",
);
const pageDescription = computed(() =>
  props.mode === "create"
    ? "فرم ثبت نظر و امتیاز برای محصول"
    : "ویرایش اطلاعات نظر",
);
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
              <UFormField label="کاربر" name="user_id" required>
                <USelectMenu
                  v-model="formState.user_id"
                  v-model:search-term="userSearch"
                  :items="userOptions"
                  value-key="value"
                  searchable
                  placeholder="انتخاب کاربر"
                  :loading="usersPending"
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

              <UFormField label="محصول" name="product_id" required>
                <USelectMenu
                  v-model="formState.product_id"
                  v-model:search-term="productSearch"
                  :items="productOptions"
                  value-key="value"
                  searchable
                  placeholder="انتخاب محصول"
                  :loading="productsPending"
                  @focus="ensureProductsLoaded"
                >
                  <template #item-label="{ item }">
                    <div class="flex flex-col">
                      <span>نام: {{ item.label }}</span>
                      <span class="text-xs text-gray-500">
                        کد:{{ item.code }}
                      </span>
                      <span class="text-xs text-gray-500">
                        اسلاگ:{{ item.slug }}
                      </span>
                    </div>
                  </template>
                </USelectMenu>
              </UFormField>

              <UFormField label="امتیاز" name="rating" required>
                <UInput
                  v-model="formState.rating"
                  type="number"
                  min="1"
                  max="5"
                  inputmode="numeric"
                />
              </UFormField>

              <UFormField label="وضعیت" name="status">
                <USelectMenu
                  v-model="formState.status"
                  :items="[
                    { label: 'در انتظار', value: 0 },
                    { label: 'تایید شده', value: 1 },
                    { label: 'رد شده', value: 2 },
                  ]"
                  value-key="value"
                />
              </UFormField>
            </div>

            <UFormField label="متن نظر" name="comment" class="mt-4">
              <UTextarea
                v-model="formState.comment"
                :rows="4"
                placeholder="متن نظر (اختیاری)"
              />
            </UFormField>

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
      </UPageBody>
    </UPage>
  </div>
</template>

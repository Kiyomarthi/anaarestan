<script setup lang="ts">
// @ts-nocheck
import { computed, ref } from "vue";
import { useApiFetch } from "~/composables/useApiFetch";
import { useApiRequest } from "~/composables/useApiRequest";

definePageMeta({
  layout: "admin",
  ssr: false,
});

const toast = useToast();
const userStore = useUserStore();
const token = userStore.token;

const page = ref(1);
const perPage = ref(20);
const userId = ref<string>("");
const productId = ref<string>("");
const openModal = ref<boolean>(false);
const itemClicked = ref<number | null>(null);

const perPageOptions = [
  { label: "10", value: 10 },
  { label: "20", value: 20 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
];

const { fetch: sendRequest, loading } = useApiRequest();

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

const { data, pending, error, refresh } = useApiFetch<any>("/api/favorites", {
  headers: { Authorization: token },
  query: computed(() => ({
    page: page.value,
    limit: perPage.value,
    user_id: userId.value || undefined,
    product_id: productId.value || undefined,
  })),
});

const rows = computed(() => data.value?.data ?? []);
const meta = computed(() => data.value?.meta ?? {});

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

const columns = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "product_title", header: "محصول" },
  { accessorKey: "user_full_name", header: "کاربر" },
  { accessorKey: "created_at", header: "تاریخ" },
  { accessorKey: "edit", header: "ویرایش" },
  { accessorKey: "delete", header: "حذف" },
];

const deleteItem = async () => {
  await sendRequest(`/api/favorites/${itemClicked.value}`, {
    method: "DELETE",
    headers: { Authorization: token },
    errorTitle: "خطای حذف علاقه‌مندی",
  });
  toast.add({ title: "حذف شد", color: "success" });
  openModal.value = false;
  refresh();
};

const confirmDelete = (id: number) => {
  openModal.value = true;
  itemClicked.value = id;
};
</script>

<template>
  <div class="md:p-4">
    <UPage>
      <UPageHeader
        title="علاقه‌مندی‌ها"
        description="مدیریت علاقه‌مندی‌های کاربران"
        :ui="{ root: 'pt-0 pb-4' }"
      >
        <template #links>
          <UButton
            icon="i-lucide-plus"
            color="primary"
            variant="solid"
            label="ایجاد علاقه‌مندی"
            @click="$router.push('/admin/favorites/create')"
          />
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="outline"
            label="تازه سازی"
            :loading="pending"
            @click="refresh"
          />
        </template>
      </UPageHeader>

      <UPageBody>
        <UAlert
          v-if="error"
          icon="i-lucide-alert-triangle"
          color="error"
          variant="subtle"
          :title="error?.statusMessage || 'خطا در دریافت علاقه‌مندی‌ها'"
          class="mb-4"
        />

        <UCard>
          <div
            class="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 min-w-75 mb-3"
          >
            <UFormField label="تعداد در صفحه">
              <USelectMenu
                v-model="perPage"
                :items="perPageOptions"
                value-key="value"
                :searchInput="false"
              />
            </UFormField>

            <UFormField label="کاربر" name="user_id">
              <USelectMenu
                v-model="userId"
                v-model:search-term="userSearch"
                :items="userOptions"
                value-key="value"
                searchable
                clear
                placeholder="انتخاب کاربر"
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

            <UFormField label="محصول">
              <USelectMenu
                v-model="productId"
                :items="productOptions"
                value-key="value"
                searchable
                clear
                v-model:search-term="productSearch"
                placeholder="انتخاب محصول"
                :loading="productsLoading"
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

            <div class="ms-auto flex items-center gap-3">
              <span class="text-sm text-gray-500">
                {{ meta?.total ? `تعداد کل: ${meta.total}` : rows.length }}
              </span>
            </div>
          </div>

          <UTable
            :data="rows"
            :columns="columns"
            :loading="pending"
            empty-state-icon="i-lucide-heart-off"
            empty-state-title="موردی یافت نشد"
            empty-state-description="فیلترها را تغییر دهید یا بعدا تلاش کنید."
          >
            <template #created_at-cell="{ row }">
              <span class="text-xs text-gray-600">
                {{
                  new Date(row.original.created_at).toLocaleDateString("fa-IR")
                }}
              </span>
            </template>

            <template #edit-cell="{ row }">
              <UButton
                size="xs"
                color="warning"
                variant="ghost"
                icon="i-lucide-pencil"
                :disabled="loading"
                @click="$router.push(`/admin/favorites/${row.original.id}`)"
              >
                ویرایش
              </UButton>
            </template>

            <template #delete-cell="{ row }">
              <UButton
                size="xs"
                color="primary"
                variant="ghost"
                icon="i-lucide-trash"
                :disabled="loading"
                @click="confirmDelete(row?.original?.id)"
              >
                حذف
              </UButton>
            </template>
          </UTable>

          <div
            v-if="meta?.totalPages || rows.length > 0"
            class="mt-6 flex items-center justify-center"
          >
            <UPagination
              v-model:page="page"
              :items-per-page="perPage"
              :total="data?.meta?.total || rows.length"
              :disabled="pending"
            />
          </div>
        </UCard>
      </UPageBody>
    </UPage>
    <UModal
      v-model:open="openModal"
      title="تایید عملیات"
      description="آیا از حذف علاقه‌مندی مطمئن هستید؟"
      :ui="{ footer: 'justify-end' }"
    >
      <template #footer>
        <UButton
          color="primary"
          variant="subtle"
          label="تایید حذف"
          :loading="loading"
          @click="deleteItem"
        />
        <UButton
          label="انصراف"
          color="neutral"
          variant="outline"
          @click="openModal = false"
        />
      </template>
    </UModal>
  </div>
</template>

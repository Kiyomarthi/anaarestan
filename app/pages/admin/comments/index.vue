<script setup lang="ts">
// @ts-nocheck
import { computed, ref, watch, onMounted } from "vue";
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
const status = ref<"approved" | "pending" | "rejected" | "all">("all");
const productId = ref<string>("");
const userId = ref<string>("");

const newCommentUserId = ref<string>("");
const newCommentProductId = ref<string>("");
const newCommentRating = ref<number | null>(5);
const newCommentText = ref<string>("");
const openModal = ref<boolean>(false);
const itemClicked = ref<number | null>(null);

const perPageOptions = [
  { label: "10", value: 10 },
  { label: "20", value: 20 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
];

const statusOptions = [
  { label: "همه", value: "all" },
  { label: "تایید شده", value: "approved" },
  { label: "در انتظار", value: "pending" },
  { label: "رد شده", value: "rejected" },
];

// --- درخواست‌ها ---
// لیست اصلی نظرات
const {
  loading: listLoading,
  response: listResponse,
  error: listError,
  fetch: fetchComments,
} = useApiRequest<any>();

// اکشن‌ها (تغییر وضعیت، حذف، ایجاد)
const { loading: actionLoading, fetch: sendRequest } = useApiRequest<any>();

// کاربران برای فیلتر
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

const loadComments = async () => {
  await fetchComments("/api/comments", {
    method: "GET",
    headers: {
      Authorization: token,
    },
    query: {
      page: page.value,
      limit: perPage.value,
      status: status.value,
      product_id: productId.value || undefined,
      user_id: userId.value || undefined,
    },
  });
};

onMounted(loadComments);

watch([page, perPage, status, productId, userId], () => {
  loadComments();
});

const rows = computed(() => (listResponse.value as any)?.data ?? []);
const meta = computed(() => (listResponse.value as any)?.meta ?? {});
const error = listError;

// ---- لود تنبل کاربران و محصولات برای فیلترها ----
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
  { accessorKey: "rating", header: "امتیاز" },
  { accessorKey: "status", header: "وضعیت" },
  { accessorKey: "created_at", header: "تاریخ" },
  { accessorKey: "actions", header: "وضعیت" },
  { accessorKey: "edit", header: "ویرایش" },
  { accessorKey: "delete", header: "حذف" },
];

const statusLabel = (s: number) => {
  if (s === 1) return "تایید شده";
  if (s === 2) return "رد شده";
  return "در انتظار";
};

const statusColor = (s: number) => {
  if (s === 1) return "success";
  if (s === 2) return "error";
  return "warning";
};

const updateStatus = async (id: number, nextStatus: number) => {
  await sendRequest(`/api/comments/${id}`, {
    method: "PATCH",
    body: { status: nextStatus },
    headers: { Authorization: token },
    errorTitle: "خطای تغییر وضعیت نظر",
  });
  toast.add({ title: "وضعیت بروزرسانی شد", color: "success" });
  loadComments();
};

const deleteItem = async () => {
  await sendRequest(`/api/comments/${itemClicked.value}`, {
    method: "DELETE",
    headers: { Authorization: token },
    errorTitle: "خطای حذف نظر",
  });
  toast.add({ title: "حذف شد", color: "success" });
  openModal.value = false;
  loadComments();
};

const confirmDelete = (id: number) => {
  openModal.value = true;
  itemClicked.value = id;
};

const createComment = async () => {
  if (
    !newCommentUserId.value ||
    !newCommentProductId.value ||
    !newCommentRating.value
  ) {
    toast.add({
      title: "user_id، product_id و امتیاز الزامی است",
      color: "error",
    });
    return;
  }

  await sendRequest("/api/comments", {
    method: "POST",
    headers: { Authorization: token },
    errorTitle: "خطای ایجاد نظر",
    body: {
      user_id: Number(newCommentUserId.value),
      product_id: Number(newCommentProductId.value),
      rating: Number(newCommentRating.value),
      comment: newCommentText.value || null,
    },
  });

  toast.add({ title: "نظر ایجاد شد", color: "success" });
  newCommentText.value = "";
  loadComments();
};
</script>

<template>
  <div class="md:p-4">
    <UPage>
      <UPageHeader
        title="نظرات و امتیازها"
        description="مدیریت نظرات ثبت شده کاربران"
        :ui="{ root: 'pt-0 pb-4' }"
      >
        <template #links>
          <div class="ms-auto flex items-center gap-3">
            <span class="text-sm text-gray-500">
              {{ meta?.total ? `تعداد کل: ${meta.total}` : rows.length }}
            </span>
            <UButton
              icon="i-lucide-plus"
              color="primary"
              variant="solid"
              label="ایجاد نظر"
              @click="$router.push('/admin/comments/create')"
            />
            <UButton
              icon="i-lucide-refresh-cw"
              color="neutral"
              variant="outline"
              label="تازه سازی"
              :loading="pending"
              @click="loadComments"
            />
          </div>
        </template>
      </UPageHeader>

      <UPageBody>
        <UAlert
          v-if="error"
          icon="i-lucide-alert-triangle"
          color="error"
          variant="subtle"
          :title="error?.statusMessage || 'خطا در دریافت نظرات'"
          class="mb-4"
        />

        <UCard>
          <div class="mb-4">
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

              <UFormField label="وضعیت">
                <USelectMenu
                  v-model="status"
                  :items="statusOptions"
                  value-key="value"
                />
              </UFormField>

              <UFormField label="کاربر" name="user_id">
                <USelectMenu
                  v-model="userId"
                  v-model:search-term="userSearch"
                  :items="userOptions"
                  value-key="value"
                  searchable
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
            </div>
          </div>

          <UTable
            :data="rows"
            :columns="columns"
            :loading="pending"
            empty-state-icon="i-lucide-message-circle-off"
            empty-state-title="نظری یافت نشد"
            empty-state-description="فیلترها را تغییر دهید یا بعدا تلاش کنید."
          >
            <template #status-cell="{ row }">
              <UBadge
                :color="statusColor(row.original.status)"
                variant="soft"
                :label="statusLabel(row.original.status)"
              />
            </template>

            <template #created_at-cell="{ row }">
              <span class="text-xs text-gray-600">
                {{
                  new Date(row.original.created_at).toLocaleDateString("fa-IR")
                }}
              </span>
            </template>

            <template #actions-cell="{ row }">
              <div class="flex items-center gap-2">
                <UButton
                  size="xs"
                  color="success"
                  variant="ghost"
                  icon="i-lucide-check"
                  :disabled="loading"
                  @click="updateStatus(row.original.id, 1)"
                >
                  تایید
                </UButton>
                <UButton
                  size="xs"
                  color="error"
                  variant="ghost"
                  icon="i-lucide-x"
                  :disabled="loading"
                  @click="updateStatus(row.original.id, 2)"
                >
                  رد
                </UButton>
                <UButton
                  size="xs"
                  color="warning"
                  variant="ghost"
                  icon="i-lucide-clock"
                  :disabled="loading"
                  @click="updateStatus(row.original.id, 0)"
                >
                  انتظار
                </UButton>
              </div>
            </template>

            <template #edit-cell="{ row }">
              <UButton
                size="xs"
                color="warning"
                variant="ghost"
                icon="i-lucide-pencil"
                :disabled="loading"
                @click="$router.push(`/admin/comments/${row.original.id}`)"
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
                @click="confirmDelete(row.original.id)"
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
      description="آیا از حذف نظر مطمئن هستید؟"
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

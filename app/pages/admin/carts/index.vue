<script setup lang="ts">
// @ts-nocheck
import { computed, ref, watch, onMounted } from "vue";
import { useApiRequest } from "~/composables/useApiRequest";
import { formatPrice } from "~~/shared/utils/format";

definePageMeta({
  layout: "admin",
  ssr: false,
});

const toast = useToast();

const page = ref(1);
const perPage = ref(20);
const status = ref<string>("all");
const userId = ref<string>("");
const openModal = ref(false);
const itemClicked = ref<number | null>(null);

const perPageOptions = [
  { label: "10", value: 10 },
  { label: "20", value: 20 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
];

const statusOptions = [
  { label: "همه", value: "all" },
  { label: "فعال", value: "active" },
  { label: "تبدیل شده - سفارش", value: "converted" },
  { label: "رها شده", value: "abandoned" },
];

const {
  loading: listLoading,
  response: listResponse,
  error: listError,
  fetch: fetchCarts,
} = useApiRequest<any>();

const { loading: actionLoading, fetch: sendRequest } = useApiRequest<any>();

const {
  loading: usersLoading,
  response: usersResponse,
  fetch: fetchUsers,
} = useApiRequest<any>();

const loadCarts = async () => {
  await fetchCarts("/api/carts", {
    method: "GET",
    query: {
      page: page.value,
      limit: perPage.value,
      status: status.value || undefined,
      user_id: userId.value || undefined,
    },
  });
};

onMounted(loadCarts);

watch([page, perPage, status, userId], () => {
  loadCarts();
});

const rows = computed(() => (listResponse.value as any)?.data ?? []);
const meta = computed(() => (listResponse.value as any)?.meta ?? {});
const error = listError;

const userSearch = ref("");

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

const ensureUsersLoaded = async () => {
  if (!(usersResponse.value as any)?.data?.length) {
    await loadUsers();
  }
};

const debouncedLoadUser = debounce(() => {
  loadUsers();
}, 400);

watch(userSearch, () => {
  debouncedLoadUser();
});

const userOptions = computed(() =>
  ((usersResponse.value as any)?.data || []).map((u: any) => ({
    label: `${u.full_name || u.phone || "کاربر"}`,
    phone: u.phone,
    id: u.id,
    value: u.id,
  })),
);

const columns = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "user_id", header: "کاربر" },
  { accessorKey: "status", header: "وضعیت" },
  { accessorKey: "items_count", header: "تعداد آیتم" },
  { accessorKey: "total_price", header: "جمع کل" },
  { accessorKey: "created_at", header: "تاریخ ایجاد" },
  { accessorKey: "updated_at", header: "آخرین بروزرسانی" },
  { accessorKey: "edit", header: "ویرایش" },
  { accessorKey: "delete", header: "حذف" },
];

const statusLabel = (s: string) => {
  if (s === "converted") return "تبدیل شده";
  if (s === "abandoned") return "رها شده";
  return "فعال";
};

const statusColor = (s: string) => {
  if (s === "converted") return "success";
  if (s === "abandoned") return "error";
  return "warning";
};

const deleteItem = async () => {
  await sendRequest(`/api/carts/${itemClicked.value}`, {
    method: "DELETE",
    errorTitle: "خطای حذف سبد خرید",
  });
  toast.add({ title: "حذف شد", color: "success" });
  openModal.value = false;
  loadCarts();
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
        title="سبد خرید"
        description="مدیریت سبدهای خرید کاربران"
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
              label="ایجاد سبد خرید"
              @click="$router.push('/admin/carts/create')"
            />
            <UButton
              icon="i-lucide-refresh-cw"
              color="neutral"
              variant="outline"
              label="تازه سازی"
              :loading="listLoading"
              @click="loadCarts"
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
          :title="error?.statusMessage || 'خطا در دریافت سبدها'"
          class="mb-4"
        />

        <UCard>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
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
          </div>

          <UTable
            :data="rows"
            :columns="columns"
            :loading="listLoading"
            empty-state-icon="i-lucide-shopping-basket"
            empty-state-title="سبدی یافت نشد"
            empty-state-description="فیلترها را تغییر دهید یا بعدا تلاش کنید."
          >
            <template #user_id-cell="{ row }">
              <span class="text-xs text-gray-600">
                {{ row.original.user_id || "مهمان" }}
              </span>
            </template>

            <template #status-cell="{ row }">
              <UBadge
                :color="statusColor(row.original.status)"
                variant="soft"
                :label="statusLabel(row.original.status)"
              />
            </template>

            <template #total_price-cell="{ row }">
              <span class="text-xs text-gray-700">
                {{ formatPrice(row.original.total_price) || "0" }}
              </span>
            </template>

            <template #created_at-cell="{ row }">
              <span class="text-xs text-gray-600">
                {{
                  new Date(row.original.created_at).toLocaleDateString("fa-IR")
                }}
              </span>
            </template>

            <template #updated_at-cell="{ row }">
              <span class="text-xs text-gray-600">
                {{
                  new Date(row.original.updated_at).toLocaleDateString("fa-IR")
                }}
              </span>
            </template>

            <template #edit-cell="{ row }">
              <UButton
                size="xs"
                color="warning"
                variant="ghost"
                icon="i-lucide-pencil"
                :disabled="actionLoading"
                @click="$router.push(`/admin/carts/${row.original.id}`)"
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
                :disabled="actionLoading"
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
              :total="meta?.total || rows.length"
              :disabled="listLoading"
            />
          </div>
        </UCard>
      </UPageBody>
    </UPage>

    <UModal
      v-model:open="openModal"
      title="تایید عملیات"
      description="آیا از حذف سبد خرید مطمئن هستید؟"
      :ui="{ footer: 'justify-end' }"
    >
      <template #footer>
        <UButton
          color="primary"
          variant="subtle"
          label="تایید حذف"
          :loading="actionLoading"
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

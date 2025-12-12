<script setup lang="ts">
// @ts-nocheck
import { computed, ref, watch } from "vue";
import { useApiFetch } from "~/composables/useApiFetch";
import { formatPrice } from "~~/shared/utils/format";

definePageMeta({
  layout: "admin",
  middleware: "admin",
});

type Product = {
  id: number;
  title: string;
  code: string;
  price: number;
  discount_price?: number | null;
  stock: number;
  status: number;
  created_at: string;
};

type ProductListResponse = {
  success: boolean;
  data: Product[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
};

const router = useRouter();
const toast = useToast();
const globalFilter = ref("");
const page = ref(1);
const perPage = ref(10);
const openModal = ref<boolean>(false);
const itemClicked = ref<number | null>(null);
const userStore = useUserStore();
const token = userStore.token;

const { loading, fetch } = useApiRequest();

const { data, pending, execute, error, refresh } =
  useApiFetch<ProductListResponse>("/api/products", {
    query: computed(() => ({
      page: page.value,
      search: globalFilter.value,
      limit: perPage.value,
    })),
  });

const rows = computed<Product[]>(() => data.value?.data ?? []);
const meta = computed(() => data.value?.meta ?? {});

const columns = [
  {
    accessorKey: "title",
    header: "عنوان",
  },
  {
    accessorKey: "code",
    header: "کد",
  },
  {
    accessorKey: "price",
    header: "قیمت",
  },
  {
    accessorKey: "stock",
    header: "موجودی",
  },
  {
    accessorKey: "status",
    header: "وضعیت",
  },
  {
    accessorKey: "created_at",
    header: "تاریخ ایجاد",
    cell: ({ row }) => {
      const value = row.getValue("created_at");
      return new Date(value).toLocaleDateString("fa-IR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    },
  },
  {
    accessorKey: "actions",
    header: "مشاهده",
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "delete",
    header: "حذف",
    enableSorting: false,
    enableHiding: false,
  },
];

const perPageOptions = [
  { label: "10", value: 10 },
  { label: "20", value: 20 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
  { label: "500", value: 500 },
];

const goCreate = async () => {
  await router.push("/admin/products/create");
};

const goEdit = async (code: string) => {
  await router.push(`/admin/products/${code}`);
};

const handleRefresh = async () => {
  await refresh();
  toast.add({ title: "لیست بروزرسانی شد", color: "success" });
};

const confirmDelete = (code) => {
  openModal.value = true;
  itemClicked.value = code;
};

const deleteItem = async () => {
  const res = await fetch(`/api/products/${itemClicked.value}`, {
    method: "delete",
    headers: {
      Authorization: token,
    },
  });
  if (!res.success) return;
  toast.add({ title: res.message ?? "با موفقیت حذف شد", color: "success" });
  openModal.value = false;
  handleRefresh();
};
</script>

<template>
  <div class="md:p-4">
    <UPage>
      <UPageHeader
        title="محصولات"
        description="مدیریت و مشاهده لیست محصولات فروشگاه"
        :ui="{
          root: 'pt-0 pb-4',
        }"
      >
        <template #links>
          <UButton
            icon="i-lucide-plus"
            color="primary"
            variant="solid"
            label="ایجاد محصول"
            @click="goCreate"
          />
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="outline"
            label="تازه سازی"
            :loading="pending"
            @click="handleRefresh"
          />
        </template>
      </UPageHeader>

      <UPageBody>
        <UAlert
          v-if="error"
          icon="i-lucide-alert-triangle"
          color="error"
          variant="subtle"
          :title="error?.statusMessage || 'خطا در دریافت محصولات'"
          class="mb-4"
        />

        <UCard>
          <div class="flex flex-wrap items-center gap-3 mb-4">
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-500">تعداد در صفحه</span>
              <USelectMenu
                v-model="perPage"
                :items="perPageOptions"
                value-key="value"
                class="w-24"
              />
            </div>
            <div class="flex px-4">
              <UInput
                v-model.lazy="globalFilter"
                class="max-w-sm"
                placeholder="جستجو"
              />
            </div>
            <div class="ms-auto text-sm text-gray-500">
              {{ meta?.total ? `تعداد کل: ${meta.total}` : rows.length }}
            </div>
          </div>

          <UTable
            :data="rows as any"
            :columns="columns as any"
            :loading="pending"
            empty-state-icon="i-lucide-package-open"
            empty-state-title="محصولی یافت نشد"
            empty-state-description="محصول جدیدی ثبت کنید یا فیلترها را بررسی کنید."
          >
            <template #title-cell="{ row }: { row: any }">
              <span class="text-xs bg-gray-100 px-2 py-1 rounded">
                {{ row?.original?.title }}
              </span>
            </template>

            <template #code-cell="{ row }: { row: any }">
              <span class="text-xs bg-gray-100 px-2 py-1 rounded">{{
                row?.original?.code
              }}</span>
            </template>

            <template #price-cell="{ row }: { row: any }">
              <div class="flex flex-col">
                <span class="font-medium">
                  {{
                    formatPrice(
                      row?.original?.discount_price ?? row?.original?.price
                    )
                  }}
                </span>
                <span
                  v-if="row?.original?.discount_price"
                  class="text-xs text-gray-500 line-through"
                  >{{ formatPrice(row?.original?.price) }}</span
                >
              </div>
            </template>

            <template #status-cell="{ row }: { row: any }">
              <UBadge
                :color="row?.original?.status === 1 ? 'success' : 'warning'"
                :label="row?.original?.status === 1 ? 'فعال' : 'غیرفعال'"
                variant="soft"
              />
            </template>

            <template #created_at-cell="{ row }: { row: any }">
              <span class="text-xs text-gray-600">
                {{
                  new Date(row?.original?.created_at).toLocaleDateString(
                    "fa-IR"
                  )
                }}
              </span>
            </template>

            <template #actions-cell="{ row }: { row: any }">
              <div class="flex items-center gap-2">
                <UButton
                  color="warning"
                  variant="ghost"
                  icon="i-lucide-pencil"
                  size="xs"
                  @click="goEdit(row?.original?.code)"
                >
                  ویرایش
                </UButton>
              </div>
            </template>
            <template #delete-cell="{ row }: { row: any }">
              <div class="flex items-center gap-2">
                <UButton
                  color="primary"
                  variant="ghost"
                  icon="i-lucide-trash"
                  size="xs"
                  @click="confirmDelete(row?.original?.code)"
                >
                  حذف
                </UButton>
              </div>
            </template>
          </UTable>

          <div
            v-if="meta?.totalPages || rows.length > 0"
            class="mt-6 flex items-center justify-center"
          >
            <UPagination
              v-model:page="page"
              :items-per-page="perPage"
              :total="data.meta.total || rows.length"
              :disabled="pending"
            />
          </div>
        </UCard>
      </UPageBody>
    </UPage>

    <UModal
      v-model:open="openModal"
      title="تایید عملیات"
      description="آیا از حذف محصول مطمئن هستید"
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

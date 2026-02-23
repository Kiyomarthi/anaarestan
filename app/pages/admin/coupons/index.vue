<script setup lang="ts">
// @ts-nocheck
import { computed, ref } from "vue";
import { useApiRequest } from "~/composables/useApiRequest";

definePageMeta({
  layout: "admin",
  ssr: false,
});

type Coupon = {
  id: number;
  code: string;
  type: "percent" | "fixed_amount";
  value: number;
  max_discount_amount?: number | null;
  min_order_amount?: number | null;
  usage_limit?: number | null;
  usage_limit_per_user?: number | null;
  valid_from?: string | null;
  valid_to?: string | null;
  is_active: number;
  created_at?: string;
};

const router = useRouter();
const toast = useToast();
const globalFilter = ref("");
const page = ref(1);
const perPage = ref(20);
const statusFilter = ref<string>("all");
const openModal = ref<boolean>(false);
const itemClicked = ref<number | null>(null);

const { loading, response, fetch } = useApiRequest();

const loadCoupons = async () => {
  await fetch("/api/coupons", {
    method: "GET",
    query: {
      code: globalFilter.value || undefined,
      is_active: statusFilter.value === "active" ? 1 : statusFilter.value === "inactive" ? 0 : undefined,
      page: page.value,
      limit: perPage.value,
    },
  });
};

onMounted(loadCoupons);

watch([page, perPage, statusFilter, globalFilter], () => {
  loadCoupons();
});

const rows = computed<Coupon[]>(() => (response.value as any)?.data || []);
const meta = computed(() => (response.value as any)?.meta || {});

const columns = [
  {
    accessorKey: "code",
    header: "کد کوپن",
  },
  {
    accessorKey: "type",
    header: "نوع",
  },
  {
    accessorKey: "value",
    header: "مقدار",
  },
  {
    accessorKey: "is_active",
    header: "وضعیت",
  },
  {
    accessorKey: "valid_to",
    header: "تاریخ انقضا",
  },
  {
    accessorKey: "actions",
    header: "عملیات",
    enableSorting: false,
  },
];

const goCreate = async () => {
  await router.push("/admin/coupons/create");
};

const goEdit = async (id: number) => {
  await router.push(`/admin/coupons/${id}`);
};

const deleteItem = async (id: number) => {
  if (!confirm("آیا از حذف این کوپن مطمئن هستید؟")) return;

  try {
    await fetch(`/api/coupons/${id}`, {
      method: "DELETE",
    });

    toast.add({
      title: "موفق",
      description: "کوپن با موفقیت حذف شد",
      color: "success",
    });

    await loadCoupons();
  } catch (error: any) {
    toast.add({
      title: "خطا",
      description: error?.data?.message || "خطا در حذف کوپن",
      color: "error",
    });
  }
};
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">مدیریت کوپن‌ها</h1>
      <UButton
        color="primary"
        @click="goCreate"
      >
        افزودن کوپن جدید
      </UButton>
    </div>

    <UCard>
      <template #header>
        <div class="flex items-center gap-4">
          <UInput
            v-model="globalFilter"
            placeholder="جستجو بر اساس کد..."
            icon="i-lucide-search"
            class="flex-1"
          />
          <USelect
            v-model="statusFilter"
            :options="[
              { label: 'همه', value: 'all' },
              { label: 'فعال', value: 'active' },
              { label: 'غیرفعال', value: 'inactive' },
            ]"
            class="w-40"
          />
        </div>
      </template>

      <UTable
        :rows="rows"
        :columns="columns"
        :loading="loading"
        :empty-state="{
          icon: 'i-lucide-ticket',
          label: 'کوپنی یافت نشد',
        }"
      >
        <template #type-cell="{ row }: { row: any }">
          <span class="text-sm text-gray-700">
            {{ row?.original?.type === "percent" ? "درصدی" : "مبلغ ثابت" }}
          </span>
        </template>

        <template #value-cell="{ row }: { row: any }">
          <span class="text-sm text-gray-700">
            {{
              row?.original?.type === "percent"
                ? `${row.original.value}%`
                : `${Number(row.original.value).toLocaleString()} تومان`
            }}
          </span>
        </template>

        <template #is_active-cell="{ row }: { row: any }">
          <UBadge
            :color="row?.original?.is_active === 1 ? 'emerald' : 'gray'"
            :label="row?.original?.is_active === 1 ? 'فعال' : 'غیرفعال'"
            variant="soft"
          />
        </template>

        <template #valid_to-cell="{ row }: { row: any }">
          <span class="text-sm text-gray-700">
            {{
              row?.original?.valid_to
                ? new Date(row.original.valid_to).toLocaleDateString("fa-IR")
                : "بدون محدودیت"
            }}
          </span>
        </template>

        <template #actions-data="{ row }">
          <UButton
            icon="i-lucide-edit"
            color="primary"
            variant="ghost"
            size="sm"
            @click="goEdit(row.id)"
          />
        </template>
      </UTable>

      <template #footer>
        <div class="flex items-center justify-between">
          <p class="text-sm text-gray-500">
            نمایش {{ rows.length }} از {{ meta.total || 0 }} کوپن
          </p>
          <UPagination
            v-model="page"
            :total="meta.totalPages || 1"
            :per-page="perPage"
          />
        </div>
      </template>
    </UCard>
  </div>
</template>


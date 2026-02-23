<script setup lang="ts">
// @ts-nocheck
import { computed, ref } from "vue";
import { useApiRequest } from "~/composables/useApiRequest";
import { formatPrice } from "~~/shared/utils/format";

definePageMeta({
  layout: "admin",
  ssr: false,
});

const router = useRouter();
const toast = useToast();
const page = ref(1);
const perPage = ref(20);
const statusFilter = ref<string>("all");
const userIdFilter = ref<string>("");
const openModal = ref<boolean>(false);
const itemClicked = ref<number | null>(null);

const { loading, response, fetch } = useApiRequest();

const loadOrders = async () => {
  await fetch("/api/orders", {
    method: "GET",
    query: {
      status: statusFilter.value === "all" ? undefined : statusFilter.value,
      user_id: userIdFilter.value || undefined,
      page: page.value,
      limit: perPage.value,
    },
  });
};

onMounted(loadOrders);

watch([page, perPage, statusFilter, userIdFilter], () => {
  loadOrders();
});

const rows = computed(() => (response.value as any)?.data || []);
const meta = computed(() => (response.value as any)?.meta || {});

const statusBadge = (status: string) => {
  const badges: Record<string, any> = {
    pending_payment: { color: "yellow", label: "در انتظار پرداخت" },
    paid: { color: "blue", label: "پرداخت شده" },
    processing: { color: "purple", label: "در حال پردازش" },
    shipped: { color: "indigo", label: "ارسال شده" },
    delivered: { color: "emerald", label: "تحویل داده شده" },
    canceled: { color: "red", label: "لغو شده" },
    failed: { color: "gray", label: "ناموفق" },
  };
  return badges[status] || { color: "gray", label: status };
};

const columns = [
  {
    accessorKey: "id",
    header: "شناسه",
  },
  {
    accessorKey: "user_full_name",
    header: "کاربر",
  },
  {
    accessorKey: "status",
    header: "وضعیت",
  },
  {
    accessorKey: "payable_amount",
    header: "مبلغ قابل پرداخت",
  },
  {
    accessorKey: "created_at",
    header: "تاریخ ایجاد",
  },
  {
    accessorKey: "actions",
    header: "مشاهده",
    enableSorting: false,
  },
];

const goView = async (id: number) => {
  await router.push(`/admin/orders/${id}`);
};
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">مدیریت سفارش‌ها</h1>
    </div>

    <UCard>
      <template #header>
        <div class="flex items-center gap-4">
          <UInput
            v-model="userIdFilter"
            placeholder="فیلتر بر اساس شناسه کاربر..."
            icon="i-lucide-user"
            type="number"
            class="flex-1"
          />
          <USelect
            v-model="statusFilter"
            :options="[
              { label: 'همه', value: 'all' },
              { label: 'در انتظار پرداخت', value: 'pending_payment' },
              { label: 'پرداخت شده', value: 'paid' },
              { label: 'در حال پردازش', value: 'processing' },
              { label: 'ارسال شده', value: 'shipped' },
              { label: 'تحویل داده شده', value: 'delivered' },
              { label: 'لغو شده', value: 'canceled' },
              { label: 'ناموفق', value: 'failed' },
            ]"
            class="w-48"
          />
        </div>
      </template>

      <UTable
        :rows="rows"
        :columns="columns"
        :loading="loading"
        :empty-state="{
          icon: 'i-lucide-shopping-cart',
          label: 'سفارشی یافت نشد',
        }"
      >
        <template #user_full_name-cell="{ row }: { row: any }">
          <span class="text-sm text-gray-700">
            {{ row?.original?.user_full_name || `کاربر ${row?.original?.user_id}` }}
          </span>
        </template>

        <template #status-cell="{ row }: { row: any }">
          <UBadge
            :color="statusBadge(row?.original?.status)?.color || 'gray'"
            :label="statusBadge(row?.original?.status)?.label || row?.original?.status"
            variant="soft"
          />
        </template>

        <template #payable_amount-cell="{ row }: { row: any }">
          <span class="text-sm text-gray-700">
            {{ formatPrice(row?.original?.payable_amount) }}
          </span>
        </template>

        <template #created_at-cell="{ row }: { row: any }">
          <span class="text-sm text-gray-700">
            {{
              row?.original?.created_at
                ? new Date(row.original.created_at).toLocaleDateString("fa-IR")
                : "-"
            }}
          </span>
        </template>

        <template #actions-data="{ row }">
          <UButton
            icon="i-lucide-eye"
            color="primary"
            variant="ghost"
            size="sm"
            @click="goView(row.id)"
          />
        </template>
      </UTable>

      <template #footer>
        <div class="flex items-center justify-between">
          <p class="text-sm text-gray-500">
            نمایش {{ rows.length }} از {{ meta.total || 0 }} سفارش
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


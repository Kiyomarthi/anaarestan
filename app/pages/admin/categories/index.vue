<script setup lang="ts">
// @ts-nocheck
import { computed, ref } from "vue";
import { useApiFetch } from "~/composables/useApiFetch";
import { useApiRequest } from "~/composables/useApiRequest";

definePageMeta({
  layout: "admin",
  middleware: "admin",
});

type Category = {
  id: number;
  name: string;
  slug: string;
  code: string;
  parent_id?: number | null;
  status: number;
  image?: string | null;
  created_at?: string;
  children?: Category[];
};

type CategoryListResponse = {
  success: boolean;
  data: Category[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
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

const { data, pending, error, refresh } = useApiFetch<CategoryListResponse>(
  "/api/categories",
  {
    query: computed(() => ({
      search: globalFilter.value || undefined,
      noPaginate: true, // Get all data, we'll paginate in frontend
    })),
  }
);

type CategoryRow = Category & { level: number };

// Flatten tree structure and add level property
const flattenCategories = (
  items: Category[] = [],
  level = 0
): CategoryRow[] => {
  return items.flatMap((cat) => {
    const current: CategoryRow = { ...cat, level };
    const children = flattenCategories(cat.children ?? [], level + 1);
    return [current, ...children];
  });
};

// Flatten and paginate data in frontend
const allRows = computed<CategoryRow[]>(() => {
  const apiData = data.value?.data || [];
  return flattenCategories(apiData);
});

const rows = computed<CategoryRow[]>(() => {
  const start = (page.value - 1) * perPage.value;
  const end = start + perPage.value;
  return allRows.value.slice(start, end);
});

const totalRows = computed(() => allRows.value.length);

const columns = [
  {
    accessorKey: "name",
    header: "نام",
  },
  {
    accessorKey: "slug",
    header: "اسلاگ",
  },
  {
    accessorKey: "code",
    header: "کد",
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
      if (!value) return "-";
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

const goCreate = async () => {
  await router.push("/admin/categories/create");
};

watch(
  () => globalFilter.value,
  () => {
    page.value = 1;
  }
);

watch(
  () => perPage.value,
  () => {
    page.value = 1;
  }
);

const goEdit = async (id: number) => {
  await router.push(`/admin/categories/${id}`);
};

const handleRefresh = async () => {
  await refresh();
  toast.add({ title: "لیست دسته بندی بروزرسانی شد", color: "success" });
};

const confirmDelete = (id: number) => {
  openModal.value = true;
  itemClicked.value = id;
};

const deleteItem = async () => {
  const res = await fetch(`/api/categories/${itemClicked.value}`, {
    method: "delete",
    headers: {
      Authorization: token,
    },
  });
  if (!res.success) {
    toast.add({ title: res.message ?? "خطا", color: "error" });

    return;
  }
  toast.add({ title: res.message ?? "دسته بندی حذف شد", color: "success" });
  openModal.value = false;
  handleRefresh();
};
</script>

<template>
  <div class="md:p-4">
    <UPage>
      <UPageHeader
        title="دسته‌بندی‌ها"
        description="مدیریت و مشاهده دسته‌بندی‌های فروشگاه"
        :ui="{
          root: 'pt-0 pb-4',
        }"
      >
        <template #links>
          <UButton
            icon="i-lucide-plus"
            color="primary"
            variant="solid"
            label="ایجاد دسته‌بندی"
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
          :title="error?.statusMessage || 'خطا در دریافت دسته‌بندی‌ها'"
          class="mb-4"
        />

        <UCard>
          <div class="flex flex-wrap items-center gap-3 mb-4">
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-500">تعداد در صفحه</span>
              <USelectMenu
                v-model="perPage"
                :items="[
                  { label: '10', value: 10 },
                  { label: '20', value: 20 },
                  { label: '50', value: 50 },
                  { label: '100', value: 100 },
                ]"
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
              {{ totalRows > 0 ? `تعداد: ${totalRows}` : "بدون داده" }}
            </div>
          </div>

          <UTable
            :data="rows as any"
            :columns="columns as any"
            :loading="pending"
            empty-state-icon="i-lucide-package-open"
            empty-state-title="دسته‌بندی یافت نشد"
            empty-state-description="دسته‌بندی جدیدی ثبت کنید یا فیلترها را بررسی کنید."
          >
            <template #name-cell="{ row }: { row: any }">
              <div
                class="flex items-center gap-2"
                :style="{
                  paddingInlineStart: `${row?.original?.level * 16}px`,
                }"
              >
                <span
                  v-if="row?.original?.level > 0"
                  class="text-gray-400 text-lg leading-none"
                >
                  └
                </span>
                <span class="text-sm font-medium text-gray-900">
                  {{ row?.original?.name }}
                </span>
              </div>
            </template>

            <template #code-cell="{ row }: { row: any }">
              <span class="text-xs bg-gray-100 px-2 py-1 rounded">{{
                row?.original?.code
              }}</span>
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
                  row?.original?.created_at
                    ? new Date(row?.original?.created_at).toLocaleDateString(
                        "fa-IR"
                      )
                    : "-"
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
                  @click="goEdit(row?.original?.id)"
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
                  @click="confirmDelete(row?.original?.id)"
                >
                  حذف
                </UButton>
              </div>
            </template>
          </UTable>
          <div
            v-if="totalRows > 0"
            class="mt-6 flex items-center justify-center"
          >
            <UPagination
              v-model:page="page"
              :items-per-page="perPage"
              :total="totalRows"
              :disabled="pending"
            />
          </div>
        </UCard>
      </UPageBody>
    </UPage>

    <UModal
      v-model:open="openModal"
      title="تایید عملیات"
      description="آیا از حذف دسته‌بندی مطمئن هستید؟"
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

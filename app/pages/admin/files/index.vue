<script setup lang="ts">
// @ts-nocheck
import { computed, ref } from "vue";
import { useApiFetch } from "~/composables/useApiFetch";
import { useApiRequest } from "~/composables/useApiRequest";
import { formatFileSize } from "~~/shared/utils/format";

definePageMeta({
  layout: "admin",
});

type ImageKitListResponse = {
  success: boolean;
  data: unknown[];
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
const itemClicked = ref<string | null>(null);
const config = useRuntimeConfig();
const userStore = useUserStore();
const token = userStore.token;

const { loading, fetch } = useApiRequest();
// const { loading: loadingFiles, fetch: fetchFiles } = useApiRequest();

const { data, pending, error, refresh } = useApiFetch<ImageKitListResponse>(
  "/api/upload/arvan",
  {
    headers: {
      Authorization: token,
    },
  }
);

const rows = computed<unknown[]>(() => {
  return data.value?.Contents || [];
});

const meta = computed(() => data.value?.meta);

const columns = [
  {
    accessorKey: "thumbnail",
    header: "پیش‌نمایش",
  },
  {
    accessorKey: "name",
    header: "نام فایل",
  },
  {
    accessorKey: "filePath",
    header: "مسیر",
  },
  {
    accessorKey: "size",
    header: "حجم",
  },
  {
    accessorKey: "fileType",
    header: "نوع",
  },
  {
    accessorKey: "createdAt",
    header: "تاریخ ایجاد",
  },
  {
    accessorKey: "actions",
    header: "عملیات",
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

const handleRefresh = async () => {
  await refresh();
  toast.add({ title: "لیست فایل‌ها بروزرسانی شد", color: "success" });
};

const confirmDelete = (fileId: string) => {
  openModal.value = true;
  itemClicked.value = fileId;
};

const deleteItem = async () => {
  const res = await fetch(`/api/upload/arvan`, {
    method: "delete",
    body: {
      key: itemClicked.value,
    },
    headers: {
      Authorization: token,
    },
  });
  if (!res.success) {
    toast.add({ title: res.message ?? "خطا", color: "error" });
    return;
  }
  toast.add({ title: res.message ?? "فایل حذف شد", color: "success" });
  openModal.value = false;
  handleRefresh();
};

const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("fa-IR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const copyPath = (path: string, message?: string) => {
  copyText(path);
  toast.add({
    title: message ?? "آدرس تصویر کپی شد",
    color: "success",
  });
};
</script>

<template>
  <div class="md:p-4">
    <UPage>
      <UPageHeader
        title="مدیریت فایل‌ها"
        description="مدیریت و مشاهده فایل‌های آپلود شده در  آروان"
        :ui="{
          root: 'pt-0 pb-4',
        }"
      >
        <template #links>
          <UButton
            icon="i-lucide-upload"
            color="primary"
            variant="solid"
            label="آپلود فایل"
            @click="router.push('/admin/files/upload')"
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
          :title="error?.statusMessage || 'خطا در دریافت فایل‌ها'"
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
                placeholder="جستجو در نام یا مسیر فایل"
              />
            </div>
            <div class="ms-auto text-sm text-gray-500">
              {{
                meta?.total
                  ? `تعداد کل: ${meta.total}`
                  : rows.length > 0
                  ? `تعداد: ${rows.length}`
                  : "بدون داده"
              }}
            </div>
          </div>

          <UTable
            :data="rows as any"
            :columns="columns as any"
            :loading="pending"
            empty-state-icon="i-lucide-image"
            empty-state-title="فایلی یافت نشد"
            empty-state-description="فایل جدیدی آپلود کنید یا فیلترها را بررسی کنید."
          >
            <template #thumbnail-cell="{ row }: { row: any }">
              <div class="flex items-center justify-center">
                <nuxt-img
                  v-if="row.original?.Key"
                  :src="`${config.public?.arvanBucketEndpoint}/${row.original?.Key}`"
                  :alt="row.original?.Key"
                  class="w-16 h-16 object-cover rounded"
                />
                <div
                  v-else
                  class="w-16 h-16 bg-gray-100 rounded flex items-center justify-center"
                >
                  <UIcon name="i-lucide-file" class="w-8 h-8 text-gray-400" />
                </div>
              </div>
            </template>

            <template #name-cell="{ row }: { row: any }">
              <div class="flex flex-col">
                <span class="text-sm font-medium text-gray-900">
                  {{ row.original?.Key || "-" }}
                </span>
              </div>
            </template>

            <template #filePath-cell="{ row }: { row: any }">
              <div class="text-xs flex flex-col gap-2 text-gray-600">
                <UTooltip text="برای استفاده در سایت از این استفاده شود">
                  <UButton
                    label="کپی نام"
                    icon="i-lucide-copy"
                    variant="subtle"
                    color="success"
                    @click="
                      () =>
                        copyPath(`${row.original?.Key}`, 'نام با موفقیت کپی شد')
                    "
                  />
                </UTooltip>
                <UTooltip
                  text="صرفا جهت دانلود، مشاهده از این استفاده شود نه برای استفاده در سایت"
                >
                  <UButton
                    label="کپی آدرس کامل"
                    icon="i-lucide-copy"
                    variant="soft"
                    color="warning"
                    @click="
                      () =>
                        copyPath(
                          `${config.public?.arvanBucketEndpoint}/${row.original?.Key}`
                        )
                    "
                  />
                </UTooltip>
              </div>
            </template>

            <template #size-cell="{ row }: { row: any }">
              <span class="text-xs text-gray-600">
                {{ formatFileSize(row.original?.Size || 0) }}
              </span>
            </template>

            <template #fileType-cell="{ row }: { row: any }">
              <UBadge
                :label="row?.original?.fileType || 'unknown'"
                variant="soft"
                color="neutral"
              />
            </template>

            <template #createdAt-cell="{ row }: { row: any }">
              <span class="text-xs text-gray-600">
                {{ formatDate(row.original?.LastModified) }}
              </span>
            </template>

            <template #actions-cell="{ row }: { row: any }">
              <div class="flex items-center gap-2">
                <UButton
                  color="primary"
                  variant="ghost"
                  icon="i-lucide-external-link"
                  size="xs"
                  :to="`${config.public?.arvanBucketEndpoint}/${row.original?.Key}`"
                  target="_blank"
                >
                  مشاهده
                </UButton>
              </div>
            </template>

            <template #delete-cell="{ row }: { row: any }">
              <div class="flex items-center gap-2">
                <UButton
                  color="error"
                  variant="ghost"
                  icon="i-lucide-trash"
                  size="xs"
                  @click="confirmDelete(row?.original?.Key)"
                >
                  حذف
                </UButton>
              </div>
            </template>
          </UTable>

          <div
            v-if="meta && meta.totalPages > 1"
            class="mt-6 flex items-center justify-center"
          >
            <UPagination
              v-model:page="page"
              :items-per-page="perPage"
              :total="meta.total"
              :disabled="pending"
            />
          </div>
        </UCard>
      </UPageBody>
    </UPage>

    <UModal
      v-model:open="openModal"
      title="تایید عملیات"
      description="آیا از حذف فایل مطمئن هستید؟ این عمل قابل بازگشت نیست."
      :ui="{ footer: 'justify-end' }"
    >
      <template #footer>
        <UButton
          color="error"
          variant="solid"
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

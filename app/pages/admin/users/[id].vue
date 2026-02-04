<script setup lang="ts">
// @ts-nocheck
import { computed, ref, watch } from "vue";
import { useApiFetch } from "~/composables/useApiFetch";
import { useApiRequest } from "~/composables/useApiRequest";
import { formatPrice } from "~~/shared/utils/format";

definePageMeta({
  layout: "admin",
});

const toast = useToast();
const router = useRouter();
const route = useRoute();
const id = computed(() => route.params.id as string);
const { fetch: sendRequest } = useApiRequest();
const submitting = ref(false);
const userStore = useUserStore();
const token = userStore.token;

const activeTab = ref<"edit" | "comments" | "favorites" | "carts">("edit");
const tabs = [
  { label: "ویرایش", value: "edit", slot: "edit" },
  { label: "نظرات", value: "comments", slot: "comments" },
  { label: "علاقه‌مندی‌ها", value: "favorites", slot: "favorites" },
  { label: "سبد خرید", value: "carts", slot: "carts" },
];

const { data: userRes, pending: userPending } = useApiFetch<any>(
  computed(() => `/api/users/${id.value}`),
  {
    headers: {
      Authorization: token,
    },
  },
);

const {
  data: userCommentsRes,
  pending: userCommentsPending,
  refresh: refreshUserComments,
} = useApiFetch<any>("/api/comments", {
  headers: { Authorization: token },
  query: computed(() => ({
    page: 1,
    limit: 50,
    user_id: id.value,
    status: "all",
  })),
});

const {
  data: userFavoritesRes,
  pending: userFavoritesPending,
  refresh: refreshUserFavorites,
} = useApiFetch<any>("/api/favorites", {
  headers: { Authorization: token },
  query: computed(() => ({
    page: 1,
    limit: 50,
    user_id: id.value,
  })),
});

const {
  loading: userCartsLoading,
  response: userCartsRes,
  fetch: fetchUserCarts,
} = useApiRequest<any>();

const loadUserCarts = async () => {
  await fetchUserCarts("/api/carts", {
    method: "GET",
    query: {
      page: 1,
      limit: 50,
      user_id: id.value,
    },
  });
};

watch(
  () => activeTab.value,
  (val) => {
    if (val === "carts") loadUserCarts();
  },
);

const handleSubmit = async (payload: any) => {
  submitting.value = true;
  try {
    await sendRequest(`/api/users/${id.value}`, {
      method: "PATCH",
      body: payload,
      errorTitle: "خطای بروزرسانی کاربر",
      headers: {
        Authorization: token,
      },
    });

    toast.add({ title: "کاربر بروزرسانی شد", color: "success" });
    router.push("/admin/users");
  } finally {
    submitting.value = false;
  }
};

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
</script>

<template>
  <div class="md:p-4 space-y-4">
    <UTabs v-model="activeTab" :items="tabs">
      <template #edit>
        <ModelAdminUserCreateEdit
          mode="edit"
          :name="userRes?.data?.full_name"
          :initial-data="userRes"
          :user-pending="userPending"
          :saving="submitting"
          @submit="handleSubmit"
        />
      </template>

      <template #comments>
        <UCard>
          <div class="flex items-center justify-between mb-3">
            <div class="font-medium">نظرات این کاربر</div>
            <div class="flex items-center gap-2">
              <UButton
                icon="i-lucide-plus"
                size="xs"
                color="primary"
                variant="solid"
                @click="router.push(`/admin/comments/create?user_id=${id}`)"
              >
                ایجاد نظر
              </UButton>
              <UButton
                icon="i-lucide-refresh-cw"
                size="xs"
                variant="outline"
                :loading="userCommentsPending"
                @click="refreshUserComments"
              >
                تازه سازی
              </UButton>
            </div>
          </div>

          <UTable
            :data="userCommentsRes?.data || []"
            :loading="userCommentsPending"
            :columns="[
              { accessorKey: 'id', header: 'ID' },
              { accessorKey: 'product_title', header: 'محصول' },
              { accessorKey: 'rating', header: 'امتیاز' },
              { accessorKey: 'status', header: 'وضعیت' },
              { accessorKey: 'created_at', header: 'تاریخ' },
              { accessorKey: 'edit', header: 'ویرایش' },
            ]"
            empty-state-icon="i-lucide-message-circle-off"
            empty-state-title="نظری یافت نشد"
          >
            <template #edit-cell="{ row }">
              <UButton
                size="xs"
                color="warning"
                variant="ghost"
                icon="i-lucide-pencil"
                @click="router.push(`/admin/comments/${row.original.id}`)"
              >
                ویرایش
              </UButton>
            </template>
          </UTable>
        </UCard>
      </template>

      <template #favorites>
        <UCard>
          <div class="flex items-center justify-between mb-3">
            <div class="font-medium">علاقه‌مندی‌های این کاربر</div>
            <div class="flex items-center gap-2">
              <UButton
                icon="i-lucide-plus"
                size="xs"
                color="primary"
                variant="solid"
                @click="router.push(`/admin/favorites/create?user_id=${id}`)"
              >
                ایجاد علاقه‌مندی
              </UButton>
              <UButton
                icon="i-lucide-refresh-cw"
                size="xs"
                variant="outline"
                :loading="userFavoritesPending"
                @click="refreshUserFavorites"
              >
                تازه سازی
              </UButton>
            </div>
          </div>

          <UTable
            :data="userFavoritesRes?.data || []"
            :loading="userFavoritesPending"
            :columns="[
              { accessorKey: 'id', header: 'ID' },
              { accessorKey: 'product_title', header: 'محصول' },
              { accessorKey: 'created_at', header: 'تاریخ' },
              { accessorKey: 'edit', header: 'ویرایش' },
            ]"
            empty-state-icon="i-lucide-heart-off"
            empty-state-title="موردی یافت نشد"
          >
            <template #edit-cell="{ row }">
              <UButton
                size="xs"
                color="warning"
                variant="ghost"
                icon="i-lucide-pencil"
                @click="router.push(`/admin/favorites/${row.original.id}`)"
              >
                ویرایش
              </UButton>
            </template>
          </UTable>
        </UCard>
      </template>

      <template #carts>
        <UCard>
          <div class="flex items-center justify-between mb-3">
            <div class="font-medium">سبد خرید این کاربر</div>
            <div class="flex items-center gap-2">
              <UButton
                icon="i-lucide-plus"
                size="xs"
                color="primary"
                variant="solid"
                @click="router.push(`/admin/carts/create?user_id=${id}`)"
              >
                ایجاد سبد خرید
              </UButton>
              <UButton
                icon="i-lucide-refresh-cw"
                size="xs"
                variant="outline"
                :loading="userCartsLoading"
                @click="loadUserCarts"
              >
                تازه سازی
              </UButton>
            </div>
          </div>

          <UTable
            :data="userCartsRes?.data || []"
            :loading="userCartsLoading"
            :columns="[
              { accessorKey: 'id', header: 'ID' },
              { accessorKey: 'status', header: 'وضعیت' },
              { accessorKey: 'items_count', header: 'تعداد آیتم' },
              { accessorKey: 'total_price', header: 'جمع کل' },
              { accessorKey: 'created_at', header: 'تاریخ' },
              { accessorKey: 'edit', header: 'ویرایش' },
            ]"
            empty-state-icon="i-lucide-shopping-basket"
            empty-state-title="سبدی یافت نشد"
          >
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

            <template #edit-cell="{ row }">
              <UButton
                size="xs"
                color="warning"
                variant="ghost"
                icon="i-lucide-pencil"
                @click="router.push(`/admin/carts/${row.original.id}`)"
              >
                ویرایش
              </UButton>
            </template>
          </UTable>
        </UCard>
      </template>
    </UTabs>
  </div>
</template>

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
const router = useRouter();
const route = useRoute();
const code = computed(() => route.params.code as string);
const { fetch: sendRequest, loading } = useApiRequest();
const activeTab = ref<"edit" | "comments" | "favorites">("edit");
const tabs = [
  { label: "ویرایش", value: "edit", slot: "edit" },
  { label: "نظرات", value: "comments", slot: "comments" },
  { label: "علاقه‌مندی‌ها", value: "favorites", slot: "favorites" },
];

const { data: productRes, pending: productPending } = useApiFetch<any>(
  computed(() => `/api/products/${code.value}`),
  { cacheKey: computed(() => `product-${code.value}`) },
);
const userStore = useUserStore();
const token = userStore.token;

const productId = computed(() => productRes?.value?.data?.id);

const {
  data: productCommentsRes,
  pending: productCommentsPending,
  refresh: refreshProductComments,
} = useApiFetch<any>("/api/comments", {
  headers: { Authorization: token },
  query: computed(() => ({
    page: 1,
    limit: 50,
    product_code: code.value,
    status: "all",
  })),
});

const {
  data: productFavoritesRes,
  pending: productFavoritesPending,
  refresh: refreshProductFavorites,
} = useApiFetch<any>("/api/favorites", {
  headers: { Authorization: token },
  query: computed(() => ({
    page: 1,
    limit: 50,
    product_id: productId.value ?? -1,
  })),
});

const handleSubmit = async (payload: any) => {
  await sendRequest(`/api/products/${code.value}`, {
    method: "PATCH",
    body: payload,
    errorTitle: "خطای بروزرسانی محصول",
    headers: {
      Authorization: token,
    },
  });

  toast.add({ title: "محصول بروزرسانی شد", color: "success" });
  router.push("/admin/products");
};
</script>

<template>
  <div class="md:p-4 space-y-4">
    <UTabs v-model="activeTab" :items="tabs">
      <template #edit>
        <ModelAdminProductCreateEdit
          mode="edit"
          :name="productRes?.data?.title"
          :product-code="code"
          :initial-data="productRes"
          :product-pending="productPending"
          :saving="loading"
          @submit="handleSubmit"
        />
      </template>

      <template #comments>
        <UCard>
          <div class="flex items-center justify-between mb-3">
            <div class="font-medium">نظرات این محصول</div>
            <div class="flex items-center gap-2">
              <UButton
                icon="i-lucide-plus"
                size="xs"
                color="primary"
                variant="solid"
                @click="
                  router.push(`/admin/comments/create?product_code=${code}`)
                "
              >
                ایجاد نظر
              </UButton>
              <UButton
                icon="i-lucide-refresh-cw"
                size="xs"
                variant="outline"
                :loading="productCommentsPending"
                @click="refreshProductComments"
              >
                تازه سازی
              </UButton>
            </div>
          </div>

          <UTable
            :data="productCommentsRes?.data || []"
            :loading="productCommentsPending"
            :columns="[
              { accessorKey: 'id', header: 'ID' },
              { accessorKey: 'user_full_name', header: 'کاربر' },
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
            <div class="font-medium">افرادی که این محصول را پسندیده‌اند</div>
            <div class="flex items-center gap-2">
              <UButton
                icon="i-lucide-plus"
                size="xs"
                color="primary"
                variant="solid"
                @click="
                  router.push(`/admin/favorites/create?product_id=${productId}`)
                "
              >
                ایجاد علاقه‌مندی
              </UButton>
              <UButton
                icon="i-lucide-refresh-cw"
                size="xs"
                variant="outline"
                :loading="productFavoritesPending"
                @click="refreshProductFavorites"
              >
                تازه سازی
              </UButton>
            </div>
          </div>

          <UTable
            :data="productFavoritesRes?.data || []"
            :loading="productFavoritesPending"
            :columns="[
              { accessorKey: 'id', header: 'ID' },
              { accessorKey: 'user_full_name', header: 'کاربر' },
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
    </UTabs>
  </div>
</template>

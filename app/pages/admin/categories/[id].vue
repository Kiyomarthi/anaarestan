<script setup lang="ts">
// @ts-nocheck
import { computed, ref } from "vue";
import { useApiFetch } from "~/composables/useApiFetch";
import { useApiRequest } from "~/composables/useApiRequest";

definePageMeta({
  layout: "admin",
  middleware: "admin",
});

const toast = useToast();
const router = useRouter();
const route = useRoute();
const id = computed(() => route.params.id as string);
const { fetch: sendRequest } = useApiRequest();
const submitting = ref(false);

const { data: categoryRes, pending: categoryPending } = useApiFetch<any>(
  computed(() => `/api/categories/${id.value}`),
  { cacheKey: computed(() => `category-${id.value}`) }
);
const userStore = useUserStore();
const token = userStore.token;

const handleSubmit = async (payload: any) => {
  submitting.value = true;
  try {
    await sendRequest(`/api/categories/${id.value}`, {
      method: "PATCH",
      body: payload,
      errorTitle: "خطای بروزرسانی دسته‌بندی",
      headers: {
        Authorization: token,
      },
    });

    toast.add({ title: "دسته‌بندی بروزرسانی شد", color: "success" });
    router.push("/admin/categories");
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <ModelAdminCategoryCreateEdit
    mode="edit"
    :name="categoryRes?.data?.name"
    :category-id="id"
    :initial-data="categoryRes"
    :category-pending="categoryPending"
    :saving="submitting"
    @submit="handleSubmit"
  />
</template>

<script setup lang="ts">
// @ts-nocheck
import { useApiRequest } from "~/composables/useApiRequest";

definePageMeta({
  layout: "admin",
});

const toast = useToast();
const router = useRouter();
const { fetch: sendRequest, loading } = useApiRequest();
const userStore = useUserStore();
const token = userStore.token;

const handleSubmit = async (payload: any) => {
  await sendRequest("/api/products", {
    method: "POST",
    body: payload,
    errorTitle: "خطای ایجاد محصول",
    headers: {
      Authorization: token,
    },
  });

  toast.add({ title: "محصول با موفقیت ایجاد شد", color: "success" });
  router.push("/admin/products");
};
</script>

<template>
  <ModelAdminProductCreateEdit
    mode="create"
    :saving="loading"
    @submit="handleSubmit"
  />
</template>

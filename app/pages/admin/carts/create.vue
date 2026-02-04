<script setup lang="ts">
// @ts-nocheck
import { useApiRequest } from "~/composables/useApiRequest";

definePageMeta({
  layout: "admin",
});

const { fetch: sendRequest, loading } = useApiRequest();
const toast = useToast();
const router = useRouter();

const handleSubmit = async (payload: any) => {
  await sendRequest("/api/carts", {
    method: "POST",
    body: payload,
    errorTitle: "خطای ایجاد سبد خرید",
  });

  toast.add({ title: "سبد خرید ایجاد شد", color: "success" });
  router.push("/admin/carts");
};
</script>

<template>
  <ModelAdminCartCreateEdit
    mode="create"
    :saving="loading"
    @submit="handleSubmit"
  />
</template>

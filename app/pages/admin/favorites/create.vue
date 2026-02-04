<script setup lang="ts">
// @ts-nocheck
import { useApiRequest } from "~/composables/useApiRequest";

definePageMeta({
  layout: "admin",
});

const { fetch: sendRequest, loading } = useApiRequest();
const toast = useToast();
const router = useRouter();
const userStore = useUserStore();
const token = userStore.token;

const handleSubmit = async (payload: any) => {
  await sendRequest("/api/favorites", {
    method: "POST",
    body: payload,
    headers: { Authorization: token },
    errorTitle: "خطای ایجاد علاقه‌مندی",
  });

  toast.add({ title: "علاقه‌مندی ایجاد شد", color: "success" });
  router.push("/admin/favorites");
};
</script>

<template>
  <ModelAdminFavoriteCreateEdit
    mode="create"
    :saving="loading"
    @submit="handleSubmit"
  />
</template>



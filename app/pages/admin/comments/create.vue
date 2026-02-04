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
  await sendRequest("/api/comments", {
    method: "POST",
    body: payload,
    headers: { Authorization: token },
    errorTitle: "خطای ایجاد نظر",
  });

  toast.add({ title: "نظر ایجاد شد", color: "success" });
  router.push("/admin/comments");
};
</script>

<template>
  <ModelAdminCommentCreateEdit
    mode="create"
    :saving="loading"
    @submit="handleSubmit"
  />
</template>



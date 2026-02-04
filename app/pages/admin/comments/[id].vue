<script setup lang="ts">
// @ts-nocheck
import { computed } from "vue";
import { useApiFetch } from "~/composables/useApiFetch";
import { useApiRequest } from "~/composables/useApiRequest";

definePageMeta({
  layout: "admin",
});

const route = useRoute();
const id = computed(() => route.params.id as string);
const toast = useToast();
const router = useRouter();
const { fetch: sendRequest, loading } = useApiRequest();
const userStore = useUserStore();
const token = userStore.token;

const { data: commentRes, pending } = useApiFetch<any>(
  computed(() => `/api/comments/${id.value}`),
  {
    headers: { Authorization: token },
  }
);

const handleSubmit = async (payload: any) => {
  await sendRequest(`/api/comments/${id.value}`, {
    method: "PATCH",
    body: payload,
    headers: { Authorization: token },
    errorTitle: "خطای بروزرسانی نظر",
  });

  toast.add({ title: "نظر بروزرسانی شد", color: "success" });
  router.push("/admin/comments");
};
</script>

<template>
  <ModelAdminCommentCreateEdit
    mode="edit"
    :initial-data="commentRes"
    :saving="loading"
  />
</template>



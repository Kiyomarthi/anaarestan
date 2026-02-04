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

const { data: favoriteRes, pending } = useApiFetch<any>(
  computed(() => `/api/favorites/${id.value}`),
  {
    headers: { Authorization: token },
  }
);

const handleSubmit = async (payload: any) => {
  await sendRequest(`/api/favorites/${id.value}`, {
    method: "PATCH",
    body: payload,
    headers: { Authorization: token },
    errorTitle: "خطای بروزرسانی علاقه‌مندی",
  });

  toast.add({ title: "علاقه‌مندی بروزرسانی شد", color: "success" });
  router.push("/admin/favorites");
};
</script>

<template>
  <ModelAdminFavoriteCreateEdit
    mode="edit"
    :initial-data="favoriteRes"
    :saving="loading"
  />
</template>



<script setup lang="ts">
// @ts-nocheck
import { computed } from "vue";
import { useApiFetch } from "~/composables/useApiFetch";
import { useApiRequest } from "~/composables/useApiRequest";

definePageMeta({
  layout: "admin",
});

const toast = useToast();
const router = useRouter();
const route = useRoute();
const slug = computed(() => route.params.slug as string);
const { fetch: sendRequest } = useApiRequest();

const { data: pageRes, pending: pagePending } = useApiFetch<any>(
  computed(() => `/api/page/${slug.value}`),
  { cacheKey: computed(() => `page-${slug.value}`) }
);
const userStore = useUserStore();
const token = userStore.token;

const handleSubmit = async (payload: any) => {
  const id = pageRes.value?.data?.page?.id;
  if (!id) {
    toast.add({ title: "شناسه صفحه یافت نشد", color: "error" });
    return;
  }
  await sendRequest(`/api/page/${id}`, {
    method: "PATCH",
    body: payload,
    errorTitle: "خطای بروزرسانی صفحه",
    headers: {
      Authorization: token,
    },
  });

  toast.add({ title: "صفحه بروزرسانی شد", color: "success" });
  router.push("/admin/seo");
};
</script>

<template>
  <ModelAdminPageCreateEdit
    mode="edit"
    :name="pageRes?.data?.page?.title"
    :page-slug="slug"
    :initial-data="pageRes"
    :page-pending="pagePending"
    @submit="handleSubmit"
  />
</template>
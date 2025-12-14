<script setup lang="ts">
// @ts-nocheck
import { computed, ref } from "vue";
import { useApiFetch } from "~/composables/useApiFetch";
import { useApiRequest } from "~/composables/useApiRequest";

definePageMeta({
  layout: "admin",
});

const toast = useToast();
const router = useRouter();
const route = useRoute();
const id = computed(() => route.params.id as string);
const { fetch: sendRequest } = useApiRequest();
const submitting = ref(false);

const { data: attributeRes, pending: attributePending } = useApiFetch<any>(
  computed(() => `/api/attributes/${id.value}`)
);
const userStore = useUserStore();
const token = userStore.token;

const handleSubmit = async (payload: any) => {
  submitting.value = true;
  try {
    await sendRequest(`/api/attributes/${id.value}`, {
      method: "PATCH",
      body: payload,
      errorTitle: "خطای بروزرسانی ویژگی",
      headers: {
        Authorization: token,
      },
    });

    toast.add({ title: "ویژگی بروزرسانی شد", color: "success" });
    router.push("/admin/attributes");
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <ModelAdminAttributeCreateEdit
    mode="edit"
    :name="attributeRes?.data?.name"
    :initial-data="attributeRes"
    :attribute-pending="attributePending"
    :saving="submitting"
    @submit="handleSubmit"
  />
</template>

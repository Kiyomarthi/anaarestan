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
const userStore = useUserStore();
const token = userStore.token;

const { data: userRes, pending: userPending } = useApiFetch<any>(
  computed(() => `/api/users/${id.value}`),
  {
    headers: {
      Authorization: token,
    },
  }
);

const handleSubmit = async (payload: any) => {
  submitting.value = true;
  try {
    await sendRequest(`/api/users/${id.value}`, {
      method: "PATCH",
      body: payload,
      errorTitle: "خطای بروزرسانی کاربر",
      headers: {
        Authorization: token,
      },
    });

    toast.add({ title: "کاربر بروزرسانی شد", color: "success" });
    router.push("/admin/users");
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <ModelAdminUserCreateEdit
    mode="edit"
    :name="userRes?.data?.full_name"
    :initial-data="userRes"
    :user-pending="userPending"
    :saving="submitting"
    @submit="handleSubmit"
  />
</template>

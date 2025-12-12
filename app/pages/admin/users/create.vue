<script setup lang="ts">
// @ts-nocheck
import { ref } from "vue";
import { useApiRequest } from "~/composables/useApiRequest";

definePageMeta({
  layout: "admin",
  middleware: "admin",
});

const toast = useToast();
const router = useRouter();
const { fetch: sendRequest } = useApiRequest();
const userStore = useUserStore();
const token = userStore.token;
const submitting = ref(false);

const handleSubmit = async (payload: any) => {
  submitting.value = true;
  try {
    await sendRequest("/api/users", {
      method: "POST",
      body: payload,
      errorTitle: "خطای ایجاد کاربر",
      headers: {
        Authorization: token,
      },
    });

    toast.add({ title: "کاربر با موفقیت ایجاد شد", color: "success" });
    router.push("/admin/users");
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <ModelAdminUserCreateEdit
    mode="create"
    :saving="submitting"
    @submit="handleSubmit"
  />
</template>

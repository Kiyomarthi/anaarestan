<script setup lang="ts">
// @ts-nocheck
import { ref } from "vue";
import { useApiRequest } from "~/composables/useApiRequest";

definePageMeta({
  layout: "admin",
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
    await sendRequest("/api/attributes", {
      method: "POST",
      body: payload,
      errorTitle: "خطای ایجاد ویژگی",
      headers: {
        Authorization: token,
      },
    });

    toast.add({ title: "ویژگی با موفقیت ایجاد شد", color: "success" });
    router.push("/admin/attributes");
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <ModelAdminAttributeCreateEdit
    mode="create"
    :saving="submitting"
    @submit="handleSubmit"
  />
</template>

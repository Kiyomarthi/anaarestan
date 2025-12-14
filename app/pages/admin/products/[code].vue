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
const code = computed(() => route.params.code as string);
const { fetch: sendRequest } = useApiRequest();

const { data: productRes, pending: productPending } = useApiFetch<any>(
  computed(() => `/api/products/${code.value}`),
  { cacheKey: computed(() => `product-${code.value}`) }
);
const userStore = useUserStore();
const token = userStore.token;

const handleSubmit = async (payload: any) => {
  await sendRequest(`/api/products/${code.value}`, {
    method: "PATCH",
    body: payload,
    errorTitle: "خطای بروزرسانی محصول",
    headers: {
      Authorization: token,
    },
  });

  toast.add({ title: "محصول بروزرسانی شد", color: "success" });
  router.push("/admin/products");
};
</script>

<template>
  <ModelAdminProductCreateEdit
    mode="edit"
    :name="productRes?.data?.title"
    :product-code="code"
    :initial-data="productRes"
    :product-pending="productPending"
    @submit="handleSubmit"
  />
</template>

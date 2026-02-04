<script setup lang="ts">
// @ts-nocheck
import { computed, onMounted } from "vue";
import { useApiRequest } from "~/composables/useApiRequest";

definePageMeta({
  layout: "admin",
});

const route = useRoute();
const id = computed(() => route.params.id as string);
const toast = useToast();
const router = useRouter();

const {
  loading: fetchLoading,
  response: cartRes,
  fetch: fetchCart,
} = useApiRequest<any>();

const { fetch: sendRequest, loading: saving } = useApiRequest();

const loadCart = async () => {
  await fetchCart(`/api/carts/${id.value}`, {
    method: "GET",
    errorTitle: "خطا در دریافت سبد خرید",
  });
};

onMounted(loadCart);

const handleSubmit = async (payload: any) => {
  await sendRequest(`/api/carts/${id.value}`, {
    method: "PATCH",
    body: payload,
    errorTitle: "خطای بروزرسانی سبد خرید",
  });

  toast.add({ title: "سبد خرید بروزرسانی شد", color: "success" });
  router.push("/admin/carts");
};
</script>

<template>
  <ModelAdminCartCreateEdit
    mode="edit"
    :initial-data="cartRes"
    :saving="saving"
    @submit="handleSubmit"
  />
</template>

<script setup lang="ts">
import type { FormSubmitEvent, AuthFormField } from "@nuxt/ui";
import { validate } from "~~/shared/validation";
import { useApiRequest } from "~/composables/useApiRequest";
import { useUserStore } from "~/stores/user";

const emit = defineEmits(["on:login"]);

const toast = useToast();
const authStore = useUserStore();
const { loading, fetch } = useApiRequest<{
  success: boolean;
  data: { token: string; user: any };
}>();

const fields: AuthFormField[] = [
  {
    name: "phone",
    type: "text",
    label: "شماره همراه",
    placeholder: "09151111111",
    required: true,
  },
  {
    name: "password",
    label: "رمزعبور",
    type: "password",
    placeholder: "حداقل 6 رقمی باشد",
    required: true,
  },
  {
    name: "remember",
    label: "مرا به خاطر بسپار",
    type: "checkbox",
  },
];

function validateForm(state: Partial<any>) {
  const errors: Error[] = [];
  validate(state.phone).required().phone().pushError("phone", errors);
  validate(state.password).required().password().pushError("password", errors);
  return errors;
}

const onSubmit = async (payload: FormSubmitEvent<any>) => {
  const { phone, password } = payload.data ?? {};

  const result = await fetch("/api/auth/login", {
    method: "POST",
    body: {
      phone,
      password,
    },
    errorTitle: "خطای ورود",
  });

  if (result?.data?.token) {
    authStore.setAuth(result.data.token, result.data.user);
  }

  toast.add({
    title: "با موفقیت وارد شدید",
    color: "success",
  });

  emit("on:login");
};
</script>

<template>
  <UAuthForm
    :validate="validateForm"
    title="ورود"
    description="شماره تلفن و رمز عبور خود را جهت ورود به حساب کاربری وارد کنید."
    icon="i-lucide-user"
    :fields="fields"
    :loading="loading"
    @submit="onSubmit"
  />
</template>

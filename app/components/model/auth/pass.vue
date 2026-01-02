<script setup lang="ts">
import type { FormSubmitEvent, AuthFormField } from "@nuxt/ui";
import { validate } from "~~/shared/validation";
import { useApiRequest } from "~/composables/useApiRequest";
import { useUserStore } from "~/stores/user";

const emit = defineEmits<{
  "on:login": [];
  "on:switch-to-otp": [];
}>();

withDefaults(
  defineProps<{
    noOtp?: boolean;
  }>(),
  {
    noOtp: false,
  }
);

const toast = useToast();
const authStore = useUserStore();
const { loading, fetch } = useApiRequest<{
  success: boolean;
  data: { token: string; user: any };
}>();

const fields: AuthFormField[] = [
  {
    name: "phone",
    type: "tel",
    label: "شماره همراه",
    class: "rtl",
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

    toast.add({
      title: "با موفقیت وارد شدید",
      color: "success",
    });

    emit("on:login");
  }
};

const switchToOtp = () => {
  emit("on:switch-to-otp");
};
</script>

<template>
  <div>
    <UAuthForm
      :validate="validateForm"
      title="ورود با رمز عبور به انارستان"
      description="شماره تلفن و رمز عبور خود را جهت ورود به حساب کاربری وارد کنید."
      :fields="fields"
      :loading="loading"
      :ui="{
        header: 'items-center',
      }"
      dir="rlt"
      @submit="onSubmit"
    >
      <template #header>
        <ULink to="/" class="w-fit">
          <base-image
            src="/images/logo.avif"
            class="aspect-square h-17.5 w-auto"
            :height="70"
            preload
            loading="eager"
            fetchPriority="high"
            alt="انارستان"
          />
        </ULink>
        <div class="text-xl text-pretty font-semibold text-highlighted mt-2">
          ورود با رمز عبور به انارستان
        </div>
      </template>
    </UAuthForm>
    <div v-if="!noOtp" class="flex flex-col gap-2 mt-4">
      <UButton variant="ghost" color="neutral" block @click="switchToOtp">
        ورود با کد تایید
      </UButton>
    </div>
  </div>
</template>

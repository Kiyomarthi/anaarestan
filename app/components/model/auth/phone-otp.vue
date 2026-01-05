<script setup lang="ts">
import type { FormSubmitEvent, AuthFormField } from "@nuxt/ui";
import { validate } from "~~/shared/validation";
import { useApiRequest } from "~/composables/useApiRequest";

const props = defineProps<{
  initialPhone?: string;
}>();

const emit = defineEmits<{
  "on:otp-sent": [phone: string];
  "on:switch-to-password": [];
}>();

const toast = useToast();
const { loading, fetch } = useApiRequest<{
  success: boolean;
  data: { expiresAt: string; code?: string; remaining?: number };
}>();

const fields: AuthFormField[] = [
  {
    name: "phone",
    type: "tel",
    class: "rtl",
    label: "شماره همراه",
    placeholder: "09151111111",
    required: true,
  },
];

function validateForm(state: Partial<any>) {
  const errors: Error[] = [];
  validate(state.phone).required().phone().pushError("phone", errors);
  return errors;
}

const onSubmit = async (payload: FormSubmitEvent<any>) => {
  const { phone } = payload.data ?? {};

  const result = await fetch("/api/auth/send-otp", {
    method: "POST",
    body: {
      phone,
    },
    errorTitle: "خطای ارسال کد",
  });

  if (result?.success) {
    toast.add({
      title: "کد تایید ارسال شد",
      description: "کد تایید به شماره شما ارسال شد",
      color: "success",
    });

    emit("on:otp-sent", phone);
  } else if (result?.data?.remaining) {
    toast.add({
      title: "لطفا صبر کنید",
      description: `کد قبلی هنوز معتبر است. ${result.data.remaining} ثانیه دیگر تلاش کنید`,
      color: "warning",
    });
  }
};

const switchToPassword = () => {
  emit("on:switch-to-password");
};
</script>

<template>
  <div>
    <UAuthForm
      :validate="validateForm"
      title="ورود یا ثبت‌نام در انارستان"
      description="شماره تلفن خود را وارد کنید تا کد تایید برای شما ارسال شود."
      icon="i-lucide-phone"
      :fields="fields"
      :loading="loading"
      :submit="{ label: 'ارسال رمز یکبار مصرف', block: true }"
      :ui="{
        header: 'items-center',
      }"
      @submit="onSubmit"
    >
      <template #header>
        <ULink to="/" class="w-fit">
          <base-image
            src="/images/logo.avif"
            :width="70"
            sizes="70px"
            preload
            class="w-17.5"
            loading="eager"
            fetchPriority="high"
            alt="انارستان"
          />
        </ULink>
        <div class="text-xl text-pretty font-semibold text-highlighted mt-2">
          ورود یا ثبت‌نام در انارستان
        </div>
      </template>
    </UAuthForm>
    <div class="flex flex-col gap-2 mt-4">
      <UButton variant="ghost" color="neutral" block @click="switchToPassword">
        ورود با رمز عبور
      </UButton>
    </div>
  </div>
</template>

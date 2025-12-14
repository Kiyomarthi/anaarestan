<script setup lang="ts">
import { validate } from "~~/shared/validation";
import { useApiRequest } from "~/composables/useApiRequest";
import { useUserStore } from "~/stores/user";

const props = defineProps<{
  phone: string;
  timerSeconds?: number; // Default: 100 seconds
}>();

const emit = defineEmits<{
  "on:login": [];
  "on:back": [];
  "on:resend": [];
}>();

const toast = useToast();
const authStore = useUserStore();
const { loading, fetch } = useApiRequest<{
  success: boolean;
  data: { token: string; user: any };
}>();

const otpCode = ref<number[]>([]);
const timer = ref(props.timerSeconds ?? 100);
const canResend = ref(false);
const otpError = ref<string | null>(null);
const isSubmitted = ref(false);
let timerInterval: ReturnType<typeof setInterval> | null = null;

// Convert number array to string
const otpCodeString = computed(() => {
  return otpCode.value.join("");
});

// Validate OTP code
const validateOtp = () => {
  const codeString = otpCodeString.value;
  const validationResult = validate(codeString).required().equal(4).run();

  if (validationResult !== true) {
    otpError.value = validationResult;
    return false;
  }

  otpError.value = null;
  return true;
};

// Start timer on mount
onMounted(() => {
  startTimer();
});

// Cleanup timer on unmount
onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
});

const startTimer = () => {
  timer.value = props.timerSeconds ?? 60 * 2 + 2;
  canResend.value = false;

  if (timerInterval) {
    clearInterval(timerInterval);
  }

  timerInterval = setInterval(() => {
    timer.value--;
    if (timer.value <= 0) {
      canResend.value = true;
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    }
  }, 1000);
};

const formatTimer = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const onSubmit = async () => {
  isSubmitted.value = true;

  // Validate OTP code
  if (!validateOtp()) {
    return;
  }

  const codeString = otpCodeString.value;

  const result = await fetch("/api/auth/verify-otp", {
    method: "POST",
    body: {
      phone: props.phone,
      code: codeString,
    },
    errorTitle: "خطای تایید کد",
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

const goBack = () => {
  emit("on:back");
};

const resendCode = async () => {
  if (!canResend.value) return;

  emit("on:resend");
  // Reset timer after resend
  const result = await fetch("/api/auth/send-otp", {
    method: "POST",
    body: {
      phone: props.phone,
    },
    errorTitle: "خطای ارسال کد",
  });

  if (result?.success) {
    toast.add({
      title: "کد تایید ارسال شد",
      description: "رمز عبور مجددا ارسال شد",
      color: "success",
    });
    startTimer();
  }
};

// Auto submit when OTP is complete
watch(otpCode, (newValue) => {
  // Clear error when user types
  if (otpError.value) {
    otpError.value = null;
  }

  // Validate if already submitted
  if (isSubmitted.value) {
    validateOtp();
  }

  // Auto submit when complete
  if (
    newValue.length === 4 &&
    newValue.every((v) => v !== undefined && v !== null)
  ) {
    onSubmit();
  }
});
</script>

<template>
  <div>
    <div class="text-center mb-6">
      <div class="flex justify-center mb-4">
        <UIcon name="i-lucide-shield-check" class="w-12 h-12 text-success" />
      </div>
      <h2 class="text-2xl font-bold mb-2">تایید کد</h2>
      <p class="text-gray-600">
        کد تایید ارسال شده به شماره {{ phone }} را وارد کنید
      </p>
    </div>

    <div class="space-y-4">
      <UFormField
        label="کد تایید"
        :error="otpError || undefined"
        :required="true"
        :ui="{ root: 'w-full', label: 'block text-sm font-medium mb-2' }"
      >
        <div class="flex justify-center">
          <UPinInput
            v-model="otpCode"
            :length="4"
            type="number"
            size="lg"
            :disabled="loading"
            dir="ltr"
            otp
            autofocus
            :color="otpError ? 'error' : 'primary'"
            :ui="{
              base: otpError
                ? 'ring-2 ring-red-500 dark:ring-red-400 border-red-500 dark:border-red-400'
                : '',
            }"
          />
        </div>
      </UFormField>

      <UButton block size="lg" :loading="loading" @click="onSubmit">
        تایید کد
      </UButton>
    </div>

    <div class="flex flex-col gap-2 mt-6">
      <UButton
        variant="ghost"
        color="neutral"
        block
        :disabled="loading || !canResend"
        :icon="canResend ? 'i-lucide-check' : 'i-lucide-loader'"
        @click="resendCode"
      >
        <span v-if="!canResend">
          ارسال مجدد کد ({{ formatTimer(timer) }})
        </span>
        <span v-else> ارسال مجدد کد </span>
      </UButton>
      <UButton
        variant="ghost"
        color="neutral"
        block
        :disabled="loading"
        @click="goBack"
      >
        تغییر شماره تلفن
      </UButton>
    </div>
  </div>
</template>

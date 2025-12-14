<script setup lang="ts">
type LoginMode = "otp" | "password" | "confirm-otp";

const props = withDefaults(
  defineProps<{
    initialMode?: LoginMode;
    timerSeconds?: number;
    onLogin?: () => void;
  }>(),
  {
    initialMode: "otp",
    timerSeconds: 100,
  }
);

const emit = defineEmits<{
  "on:login": [];
}>();

const mode = ref<LoginMode>(props.initialMode);
const phone = ref<string>("");
const resendTrigger = ref(0);

const handleOtpSent = (phoneNumber: string) => {
  phone.value = phoneNumber;
  mode.value = "confirm-otp";
};

const handleSwitchToPassword = () => {
  mode.value = "password";
  phone.value = "";
};

const handleSwitchToOtp = () => {
  mode.value = "otp";
  phone.value = "";
};

const handleBack = () => {
  mode.value = "otp";
  phone.value = "";
};

const handleResend = () => {
  // Trigger resend by incrementing the key to force re-render
  resendTrigger.value++;
};

const handleLogin = () => {
  if (props.onLogin) {
    props.onLogin();
  }
  emit("on:login");
};

// Expose methods if needed
defineExpose({
  mode,
  phone,
  reset: () => {
    mode.value = props.initialMode;
    phone.value = "";
    resendTrigger.value = 0;
  },
});
</script>

<template>
  <div>
    <modelAuthPhoneOtp
      v-if="mode === 'otp'"
      :key="`otp-${resendTrigger}-${phone}`"
      :initial-phone="phone"
      @on:otp-sent="handleOtpSent"
      @on:switch-to-password="handleSwitchToPassword"
    />
    <modelAuthConfirmOtp
      v-else-if="mode === 'confirm-otp'"
      :phone="phone"
      :timer-seconds="timerSeconds"
      @on:login="handleLogin"
      @on:back="handleBack"
      @on:resend="handleResend"
    />
    <modelAuthPass
      v-else-if="mode === 'password'"
      @on:login="handleLogin"
      @on:switch-to-otp="handleSwitchToOtp"
    />
  </div>
</template>


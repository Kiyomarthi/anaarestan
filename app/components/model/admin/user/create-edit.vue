<script setup lang="ts">
// @ts-nocheck
import type { FormSubmitEvent } from "#ui/types";
import { computed, reactive, watch } from "vue";
import { validate } from "~~/shared/validation";

const props = defineProps<{
  mode: "create" | "edit";
  initialData?: any;
  userPending?: boolean;
  name?: string;
  saving?: boolean;
}>();

const emit = defineEmits<{
  submit: [payload: any];
}>();

const toast = useToast();
const isSaving = computed(() => props.saving === true);
const router = useRouter();

type FormState = {
  full_name: string;
  phone: string;
  role: "admin" | "user";
  password: string;
};

const formState = reactive<FormState>({
  full_name: "",
  phone: "",
  role: "user",
  password: "",
});

watch(
  () => props.initialData,
  (user) => {
    if (!user || props.mode !== "edit") return;
    const data = user?.data || user;
    if (!data) return;
    formState.full_name = data.full_name ?? "";
    formState.phone = data.phone ?? "";
    formState.role = data.role === "admin" ? "admin" : "user";
    formState.password = ""; // Don't populate password field
  },
  { immediate: true }
);

function validateForm(state: FormState) {
  const errors: any[] = [];
  validate(state.full_name)
    .required()
    .min(3)
    .max(100)
    .pushError("full_name", errors);
  validate(state.phone).required().phone().pushError("phone", errors);
  validate(state.role)
    .required()
    .checkMatch(["admin", "user"])
    .pushError("role", errors);
  
  // Password is required in create mode, optional in edit mode
  if (props.mode === "create") {
    validate(state.password).required().password().pushError("password", errors);
  } else if (state.password && state.password.trim()) {
    // Only validate if password is provided in edit mode
    validate(state.password).password().pushError("password", errors);
  }

  return errors;
}

const error = (errors) => {
  toast.add({ title: "تمامی فیلد ها را پر کنید", color: "error" });
};

const onSubmit = async (event: FormSubmitEvent<FormState>) => {
  const payload: any = {
    full_name: formState.full_name.trim(),
    phone: formState.phone.trim(),
    role: formState.role,
  };

  // Only include password if it's provided (required in create, optional in edit)
  if (props.mode === "create" || (formState.password && formState.password.trim())) {
    payload.password = formState.password.trim();
  }

  emit("submit", payload);
};

const pageTitle = computed(() => {
  if (props.mode === "create") {
    return "ایجاد کاربر";
  }
  return `ویرایش کاربر ${props.name || ""}`;
});

const pageDescription = computed(() => {
  if (props.mode === "create") {
    return "فرم ثبت کاربر جدید";
  }
  return "اطلاعات کاربر را بروزرسانی کنید";
});

const submitButtonLabel = computed(() => {
  if (props.mode === "create") {
    return "ذخیره کاربر";
  }
  return "ذخیره تغییرات";
});
</script>

<template>
  <div class="md:p-4">
    <UPage>
      <UPageHeader
        :title="pageTitle"
        :description="pageDescription"
        :ui="{
          root: 'pt-0 pb-4',
        }"
      />

      <UPageBody>
        <UAlert
          v-if="mode === 'edit' && userPending"
          icon="i-lucide-loader"
          title="در حال بارگذاری"
          description="لطفا منتظر بمانید"
          color="warning"
          variant="subtle"
        />

        <UCard v-else>
          <UForm
            :state="formState"
            :validate="validateForm"
            @submit="onSubmit"
            @error="error"
          >
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div class="space-y-4">
                <UFormField label="نام و نام خانوادگی" name="full_name" required>
                  <UInput
                    v-model="formState.full_name"
                    placeholder="نام و نام خانوادگی"
                    :ui="{ root: 'w-full' }"
                  />
                </UFormField>

                <UFormField label="شماره تلفن" name="phone" required>
                  <UInput
                    v-model="formState.phone"
                    placeholder="09123456789"
                    :ui="{ root: 'w-full' }"
                  />
                </UFormField>

                <UFormField label="نقش" name="role" required>
                  <USelectMenu
                    v-model="formState.role"
                    :items="[
                      { label: 'کاربر عادی', value: 'user' },
                      { label: 'مدیر', value: 'admin' },
                    ]"
                    value-key="value"
                    :ui="{ base: 'w-full' }"
                  />
                </UFormField>

                <UFormField
                  :label="mode === 'create' ? 'رمز عبور' : 'رمز عبور (اختیاری)'"
                  :name="'password'"
                  :required="mode === 'create'"
                >
                  <UInput
                    v-model="formState.password"
                    type="password"
                    :placeholder="
                      mode === 'create'
                        ? 'رمز عبور را وارد کنید'
                        : 'برای تغییر رمز عبور، رمز جدید را وارد کنید'
                    "
                    :ui="{ root: 'w-full' }"
                  />
                  <template v-if="mode === 'edit'" #description>
                    <span class="text-xs text-gray-500"
                      >در صورت خالی بودن، رمز عبور تغییر نخواهد کرد</span
                    >
                  </template>
                </UFormField>
              </div>
            </div>

            <div class="mt-8 flex items-center gap-3 justify-end">
              <UButton
                color="neutral"
                variant="ghost"
                label="انصراف"
                @click="router.back()"
              />
              <UButton
                type="submit"
                color="primary"
                :loading="isSaving"
                icon="i-lucide-save"
              >
                {{ submitButtonLabel }}
              </UButton>
            </div>
          </UForm>
        </UCard>
      </UPageBody>
    </UPage>
  </div>
</template>

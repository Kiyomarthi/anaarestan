<script setup lang="ts">
// @ts-nocheck
import type { FormSubmitEvent } from "#ui/types";
import { computed, reactive } from "vue";
import { validate } from "~~/shared/validation";

const props = defineProps<{
  mode: "create" | "edit";
  initialData?: any;
  attributePending?: boolean;
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
  name: string;
  type: "product" | "variant";
  values: string[];
};

const formState = reactive<FormState>({
  name: "",
  type: "product",
  values: [""],
});

watch(
  () => props.initialData,
  (attr) => {
    if (!attr || props.mode !== "edit") return;
    const data = attr?.data || attr;
    if (!data) return;
    formState.name = data.name ?? "";
    formState.type = data.type === "variant" ? "variant" : "product";
    formState.values = (data.values || [])
      .map((v: any) => v.value || "")
      .filter(Boolean);
    if (!formState.values.length) formState.values = [""];
  },
  { immediate: true }
);

function validateForm(state: FormState) {
  const errors: any[] = [];
  validate(state.name).required().min(2).max(50).pushError("name", errors);
  validate(state.type)
    .required()
    .checkMatch(["product", "variant"])
    .pushError("type", errors);
  const trimmedValues = state.values
    .map((v) => String(v || "").trim())
    .filter(Boolean);
  if (!trimmedValues.length) {
    errors.push({ name: "values", message: "حداقل یک مقدار وارد کنید" });
  }

  return errors;
}

const addValue = () => {
  formState.values.push("");
};

const removeValue = (idx: number) => {
  if (formState.values.length === 1) return;
  formState.values.splice(idx, 1);
};

const error = (errors) => {
  toast.add({ title: "تمامی فیلد ها را پر کنید", color: "error" });
};

const onSubmit = async (event: FormSubmitEvent<FormState>) => {
  const payload: any = {
    name: formState.name,
    type: formState.type,
    values: formState.values.map((v) => String(v || "").trim()).filter(Boolean),
  };

  emit("submit", payload);
};

const pageTitle = computed(() => {
  if (props.mode === "create") {
    return "ایجاد ویژگی";
  }
  return `ویرایش ویژگی ${props.name || ""}`;
});

const pageDescription = computed(() => {
  if (props.mode === "create") {
    return "فرم ثبت ویژگی جدید";
  }
  return "اطلاعات ویژگی را بروزرسانی کنید";
});

const submitButtonLabel = computed(() => {
  if (props.mode === "create") {
    return "ذخیره ویژگی";
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
          v-if="mode === 'edit' && attributePending"
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
                <UFormField label="نام" name="name" required>
                  <UInput
                    v-model="formState.name"
                    placeholder="نام ویژگی"
                    :ui="{ root: 'w-full' }"
                  />
                </UFormField>

                <UFormField label="نوع" name="type" required>
                  <USelectMenu
                    v-model="formState.type"
                    :items="[
                      { label: 'محصول', value: 'product' },
                      { label: 'تنوع', value: 'variant' },
                    ]"
                    value-key="value"
                    :ui="{ base: 'w-full' }"
                  />
                </UFormField>

                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-gray-700"
                      >مقادیر</span
                    >
                    <UButton
                      size="xs"
                      color="primary"
                      variant="soft"
                      icon="i-lucide-plus"
                      @click="addValue"
                    >
                      افزودن مقدار
                    </UButton>
                  </div>
                  <div class="space-y-3">
                    <UCard
                      v-for="(val, idx) in formState.values"
                      :key="idx"
                      class="border border-dashed"
                    >
                      <div class="flex items-center gap-3">
                        <UInput
                          v-model="formState.values[idx]"
                          :placeholder="`مقدار ${idx + 1}`"
                          :ui="{ root: 'w-full' }"
                        />
                        <UButton
                          v-if="formState.values.length > 1"
                          size="xs"
                          color="error"
                          variant="ghost"
                          icon="i-lucide-trash"
                          @click="removeValue(idx)"
                        />
                      </div>
                    </UCard>
                  </div>
                </div>
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

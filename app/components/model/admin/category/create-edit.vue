<script setup lang="ts">
// @ts-nocheck
import type { FormSubmitEvent } from "#ui/types";
import { computed, reactive, ref, watch } from "vue";
import { validate } from "~~/shared/validation";
import { useApiFetch } from "~/composables/useApiFetch";
import { useApiRequest } from "~/composables/useApiRequest";
import { urlToFile } from "~~/shared/utils/format";

type CategoryNode = {
  id: number;
  name: string;
  children?: CategoryNode[];
};

type FormState = {
  name: string;
  slug: string;
  parent_id: number | null;
  status: boolean;
  image: string;
};

const props = defineProps<{
  mode: "create" | "edit";
  categoryId?: string | number;
  initialData?: any;
  categoryPending?: boolean;
  name?: string;
  saving?: boolean;
}>();

const emit = defineEmits<{
  submit: [payload: any];
}>();

const toast = useToast();
const router = useRouter();
const userStore = useUserStore();
const token = userStore.token;
const { fetch: sendRequest, loading: uploading } = useApiRequest();
const isSaving = computed(() => props.saving === true);

const formState = reactive<FormState>({
  name: "",
  slug: "",
  parent_id: null,
  status: true,
  image: "",
});

const {
  data: categoriesRes,
  pending: categoriesPending,
  execute: loadCategories,
} = useApiFetch<{ data: CategoryNode[] }>("/api/categories", {
  immediate: false,
  query: computed(() => ({ noPaginate: true })),
});

const categoriesLoaded = ref(false);

const flattenCategories = (nodes: CategoryNode[] = [], level = 0): any[] =>
  nodes.flatMap((node) => [
    { label: `${"— ".repeat(level)}${node.name}`, value: node.id },
    ...(node.children ? flattenCategories(node.children, level + 1) : []),
  ]);

const categoryOptions = computed(() => {
  const all = flattenCategories(categoriesRes.value?.data ?? []);
  // در حالت ویرایش، دسته فعلی را از لیست حذف می‌کنیم تا نتواند خودش را والد خودش کند
  if (props.mode === "edit" && props.categoryId) {
    return all.filter((cat) => cat.value !== Number(props.categoryId));
  }
  return all;
});

const ensureCategories = () => {
  if (categoriesLoaded.value) return;
  categoriesLoaded.value = true;
  loadCategories();
};

const MAX_IMAGE_SIZE = 300 * 1024; // 300KB
const imageFile = ref<File[]>([]);

watch(
  () => props.initialData,
  async (category) => {
    if (!category || props.mode !== "edit") return;
    const data = category?.data || category;
    if (!data) return;

    formState.name = data.name ?? "";
    formState.slug = data.slug ?? "";
    formState.parent_id = data.parent_id ?? null;
    formState.status = data.status === 1;
    formState.image = data.image ?? "";

    // اگر عکس از URL آمده، آن را دانلود و نمایش بده
    if (data.image) {
      try {
        const file = await urlToFile(data.image, "image");
        imageFile.value = [file];
      } catch (err: any) {
        console.error("خطا در دانلود عکس:", err);
        imageFile.value = [];
      }
    }
  },
  { immediate: true }
);

function validateForm(state: FormState) {
  const errors: any[] = [];
  validate(state.name).required().min(2).max(50).pushError("name", errors);

  if (props.mode === "create") {
    validate(state.slug).required().slug().pushError("slug", errors);
  }

  validate(state.image).required().max(100).pushError("image", errors);

  return errors;
}

const uploadImage = async (files: File | File[] | null) => {
  // UFileUpload ممکن است فایل یا آرایه فایل برگرداند
  const file = Array.isArray(files) ? files[0] : files;
  if (!file || !file.name) return;

  if (file.size > MAX_IMAGE_SIZE) {
    toast.add({
      title: "حجم فایل بیش از 300 کیلوبایت است",
      color: "error",
    });
    imageFile.value = [];
    formState.image = "";
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await sendRequest("/api/upload", {
      method: "POST",
      body: formData,
      errorTitle: "خطای آپلود تصویر",
    });

    // بک‌اند مقدار `files` را به صورت آرایه مسیر برمی‌گرداند
    const uploadedUrl =
      res?.files?.[0] ||
      res?.files?.[0]?.url ||
      res?.data?.url ||
      res?.url ||
      res?.file?.url ||
      "";

    if (!uploadedUrl) {
      throw new Error("آدرس فایل دریافت نشد");
    }

    formState.image = uploadedUrl;
  } catch (err: any) {
    imageFile.value = [];
    formState.image = "";
    toast.add({
      title: err?.message || "آپلود تصویر ناموفق بود",
      color: "error",
    });
  }
};

const error = (errors) => {
  toast.add({ title: "تمامی فیلد ها را پر کنید", color: "error" });
};

const onSubmit = async (event: FormSubmitEvent<FormState>) => {
  const payload: any = {
    name: formState.name,
    parent_id: formState.parent_id || null,
    status: formState.status ? 1 : 0,
    image: formState.image || null,
  };

  if (props.mode === "create") {
    payload.slug = formState.slug;
  }

  emit("submit", payload);
};

const pageTitle = computed(() => {
  if (props.mode === "create") {
    return "ایجاد دسته‌بندی";
  }
  return `ویرایش دسته‌بندی ${props.name || props.categoryId || ""}`;
});

const pageDescription = computed(() => {
  if (props.mode === "create") {
    return "فرم ثبت دسته‌بندی جدید";
  }
  return "اطلاعات دسته‌بندی را بروزرسانی کنید";
});

const submitButtonLabel = computed(() => {
  if (props.mode === "create") {
    return "ذخیره دسته‌بندی";
  }
  return "ذخیره تغییرات";
});

const isSlugDisabled = computed(() => props.mode === "edit");
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
          v-if="mode === 'edit' && categoryPending"
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
                    placeholder="نام دسته‌بندی"
                    :ui="{ root: 'w-full' }"
                  />
                </UFormField>

                <UFormField
                  label="اسلاگ"
                  name="slug"
                  :required="mode === 'create'"
                >
                  <UInput
                    v-model="formState.slug"
                    placeholder="category-slug"
                    :disabled="isSlugDisabled"
                    :ui="{ root: 'w-full' }"
                  />
                </UFormField>

                <UFormField label="دسته والد" name="parent_id">
                  <USelectMenu
                    v-model="formState.parent_id"
                    :items="categoryOptions"
                    value-key="value"
                    placeholder="انتخاب دسته والد (اختیاری)"
                    :loading="categoriesPending"
                    :ui="{ base: 'w-full' }"
                    @focus="ensureCategories"
                  />
                </UFormField>

                <UFormField label="وضعیت" name="status">
                  <UCheckbox
                    v-model="formState.status"
                    name="status"
                    label="فعال"
                  />
                </UFormField>
              </div>

              <div class="space-y-4">
                <UFormField label="عکس" name="image" required>
                  <div class="relative">
                    <UFileUpload
                      v-model="imageFile"
                      accept="image/*"
                      :max-files="1"
                      label="عکس دسته‌بندی"
                      description="عکس خود را با فرمت webp، و در حداقلی ترین حجم آپلود کنید"
                      class="w-full min-h-48"
                      interactive
                      :ui="{
                        base: 'data-[dragging=true]:bg-primary-200 with-transition',
                      }"
                      @update:model-value="(files) => uploadImage(files)"
                    />
                  </div>
                  <p class="text-xs text-gray-500 mt-1">
                    حداکثر حجم: 300KB – پس از آپلود، آدرس در فیلد ذخیره می‌شود.
                  </p>
                  <p v-if="formState.image" class="text-xs text-green-600 mt-1">
                    آپلود شد
                  </p>
                  <UInput
                    v-if="formState.image"
                    v-model="formState.image"
                    readonly
                    placeholder="آدرس عکس"
                    class="mt-2"
                    :ui="{ root: 'w-full' }"
                  />
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
                :loading="isSaving || uploading"
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

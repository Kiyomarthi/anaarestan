<script setup lang="ts">
// @ts-nocheck
import { computed, ref } from "vue";
import { useApiFetch } from "~/composables/useApiFetch";
import { useApiRequest } from "~/composables/useApiRequest";

definePageMeta({
  layout: "admin",
});

const toast = useToast();
const router = useRouter();
const route = useRoute();
const fileId = computed(() => route.params.fileId as string);
const { fetch: sendRequest } = useApiRequest();
const submitting = ref(false);
const userStore = useUserStore();
const token = userStore.token;

const {
  data: fileRes,
  pending: filePending,
  refresh,
} = useApiFetch<any>(
  computed(() => `/api/imagekit/${fileId.value}`),
  {
    // No cache for admin panel
    cacheKey: null,
    server: false,
    headers: {
      Authorization: token,
    },
  }
);

const formState = ref({
  tags: [] as string[],
  customMetadata: {} as Record<string, any>,
});

watch(
  () => fileRes.value,
  (file) => {
    if (!file || !file.data) return;
    const data = file.data;
    formState.value.tags = data.tags || [];
    formState.value.customMetadata = data.customMetadata || {};
  },
  { immediate: true }
);

const handleSubmit = async () => {
  submitting.value = true;
  try {
    await sendRequest(`/api/imagekit/${fileId.value}`, {
      method: "PATCH",
      body: {
        tags: formState.value.tags,
        customMetadata: formState.value.customMetadata,
      },
      errorTitle: "خطای بروزرسانی فایل",
      headers: {
        Authorization: token,
      },
    });

    toast.add({ title: "فایل بروزرسانی شد", color: "success" });
    await refresh();
  } finally {
    submitting.value = false;
  }
};

const addTag = () => {
  const tagInput = document.getElementById("tagInput") as HTMLInputElement;
  if (tagInput && tagInput.value.trim()) {
    if (!formState.value.tags.includes(tagInput.value.trim())) {
      formState.value.tags.push(tagInput.value.trim());
    }
    tagInput.value = "";
  }
};

const removeTag = (tag: string) => {
  formState.value.tags = formState.value.tags.filter((t) => t !== tag);
};

const addMetadata = () => {
  const keyInput = document.getElementById("metaKeyInput") as HTMLInputElement;
  const valueInput = document.getElementById(
    "metaValueInput"
  ) as HTMLInputElement;
  if (keyInput && valueInput && keyInput.value.trim()) {
    formState.value.customMetadata[keyInput.value.trim()] =
      valueInput.value.trim();
    keyInput.value = "";
    valueInput.value = "";
  }
};

const removeMetadata = (key: string) => {
  const newMeta = { ...formState.value.customMetadata };
  delete newMeta[key];
  formState.value.customMetadata = newMeta;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("fa-IR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
</script>

<template>
  <div class="md:p-4">
    <UPage>
      <UPageHeader
        :title="`ویرایش فایل ${fileRes?.data?.name || fileId}`"
        description="ویرایش جزئیات و متادیتای فایل"
        :ui="{
          root: 'pt-0 pb-4',
        }"
      >
        <template #links>
          <UButton
            color="neutral"
            variant="ghost"
            label="بازگشت"
            icon="i-lucide-arrow-right"
            @click="router.push('/admin/imagekit')"
          />
        </template>
      </UPageHeader>

      <UPageBody>
        <UAlert
          v-if="filePending"
          icon="i-lucide-loader"
          title="در حال بارگذاری"
          description="لطفا منتظر بمانید"
          color="warning"
          variant="subtle"
          class="mb-4"
        />

        <div
          v-else-if="fileRes?.data"
          class="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <!-- Preview Section -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">پیش‌نمایش فایل</h3>
            </template>
            <div class="space-y-4">
              <div class="flex justify-center">
                <img
                  v-if="fileRes.data.url"
                  :src="fileRes.data.url"
                  :alt="fileRes.data.name"
                  class="max-w-full h-auto rounded-lg"
                />
              </div>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500">نام فایل:</span>
                  <span class="font-medium">{{ fileRes.data.name }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">مسیر:</span>
                  <span class="font-mono text-xs">{{
                    fileRes.data.filePath
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">حجم:</span>
                  <span>{{ formatFileSize(fileRes.data.size || 0) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">نوع:</span>
                  <UBadge :label="fileRes.data.fileType" variant="soft" />
                </div>
                <div
                  v-if="fileRes.data.width && fileRes.data.height"
                  class="flex justify-between"
                >
                  <span class="text-gray-500">ابعاد:</span>
                  <span
                    >{{ fileRes.data.width }} × {{ fileRes.data.height }}</span
                  >
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">تاریخ ایجاد:</span>
                  <span>{{ formatDate(fileRes.data.createdAt) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">آخرین بروزرسانی:</span>
                  <span>{{ formatDate(fileRes.data.updatedAt) }}</span>
                </div>
                <div class="pt-2">
                  <UButton
                    :to="fileRes.data.url"
                    target="_blank"
                    color="primary"
                    variant="outline"
                    icon="i-lucide-external-link"
                    block
                  >
                    مشاهده فایل اصلی
                  </UButton>
                </div>
              </div>
            </div>
          </UCard>

          <!-- Edit Section -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">ویرایش اطلاعات</h3>
            </template>
            <div class="space-y-6">
              <!-- Tags -->
              <div>
                <label class="block text-sm font-medium mb-2">تگ‌ها</label>
                <div class="flex gap-2 mb-2">
                  <UInput
                    id="tagInput"
                    placeholder="افزودن تگ"
                    class="flex-1"
                    @keyup.enter="addTag"
                  />
                  <UButton @click="addTag" icon="i-lucide-plus">افزودن</UButton>
                </div>
                <div
                  v-if="formState.tags.length > 0"
                  class="flex flex-wrap gap-2 mt-2"
                >
                  <UBadge
                    v-for="tag in formState.tags"
                    :key="tag"
                    :label="tag"
                    color="primary"
                    variant="soft"
                  >
                    <template #trailing>
                      <button
                        @click="removeTag(tag)"
                        class="ml-1 hover:text-error"
                      >
                        <UIcon name="i-lucide-x" class="w-3 h-3" />
                      </button>
                    </template>
                  </UBadge>
                </div>
                <p v-else class="text-xs text-gray-500 mt-1">تگی اضافه نشده</p>
              </div>

              <!-- Custom Metadata -->
              <div>
                <label class="block text-sm font-medium mb-2"
                  >متادیتای سفارشی</label
                >
                <div class="flex gap-2 mb-2">
                  <UInput id="metaKeyInput" placeholder="کلید" class="flex-1" />
                  <UInput
                    id="metaValueInput"
                    placeholder="مقدار"
                    class="flex-1"
                    @keyup.enter="addMetadata"
                  />
                  <UButton @click="addMetadata" icon="i-lucide-plus"
                    >افزودن</UButton
                  >
                </div>
                <div
                  v-if="Object.keys(formState.customMetadata).length > 0"
                  class="space-y-2 mt-2"
                >
                  <div
                    v-for="(value, key) in formState.customMetadata"
                    :key="key"
                    class="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div class="flex-1">
                      <span class="text-sm font-medium">{{ key }}:</span>
                      <span class="text-sm text-gray-600 ms-2">{{
                        value
                      }}</span>
                    </div>
                    <UButton
                      @click="removeMetadata(key)"
                      color="error"
                      variant="ghost"
                      size="xs"
                      icon="i-lucide-trash"
                    />
                  </div>
                </div>
                <p v-else class="text-xs text-gray-500 mt-1">
                  متادیتای سفارشی اضافه نشده
                </p>
              </div>

              <!-- Submit Button -->
              <div class="pt-4 border-t">
                <UButton
                  @click="handleSubmit"
                  :loading="submitting"
                  color="primary"
                  icon="i-lucide-save"
                  block
                >
                  ذخیره تغییرات
                </UButton>
              </div>
            </div>
          </UCard>
        </div>

        <UAlert
          v-else
          icon="i-lucide-alert-triangle"
          color="error"
          variant="subtle"
          title="فایل یافت نشد"
          description="فایل مورد نظر وجود ندارد یا حذف شده است."
        />
      </UPageBody>
    </UPage>
  </div>
</template>

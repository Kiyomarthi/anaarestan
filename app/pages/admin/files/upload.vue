<script setup lang="ts">
// @ts-nocheck
import { ref } from "vue";
import { useApiRequest } from "~/composables/useApiRequest";

definePageMeta({
  layout: "admin",
});

const toast = useToast();
const router = useRouter();
const { fetch: sendRequest, loading: uploading } = useApiRequest();
const userStore = useUserStore();
const token = userStore.token;

const imageFile = ref<File[]>([]);
const folder = ref("/");
const fileName = ref("");
const tags = ref("");
const useUniqueFileName = ref(true);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const uploadImage = async (files: File | File[] | null) => {
  const file = Array.isArray(files) ? files[0] : files;
  if (!file || !file.name) {
    imageFile.value = [];
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    toast.add({
      title: `حجم فایل بیش از ${MAX_FILE_SIZE / 1024 / 1024} مگابایت است`,
      color: "error",
    });
    imageFile.value = [];
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  if (folder.value) {
    formData.append("folder", folder.value);
  }
  if (fileName.value) {
    formData.append("fileName", fileName.value);
  }
  if (tags.value) {
    formData.append("tags", tags.value);
  }
  formData.append("useUniqueFileName", useUniqueFileName.value.toString());

  try {
    const res = await sendRequest("/api/upload/arvan", {
      method: "POST",
      body: formData,
      errorTitle: "خطای آپلود فایل",
      headers: {
        Authorization: token,
      },
    });

    if (res.success) {
      toast.add({
        title: "فایل با موفقیت آپلود شد",
        color: "success",
      });
      // Reset form
      folder.value = "/";
      fileName.value = "";
      tags.value = "";
      useUniqueFileName.value = true;

      // Redirect to file list or edit page

      router.push("/admin/files");
    }
  } catch (err: any) {
    imageFile.value = [];
    toast.add({
      title: err?.message || "آپلود فایل ناموفق بود",
      color: "error",
    });
  }
};
</script>

<template>
  <div class="md:p-4">
    <UPage>
      <UPageHeader
        title="آپلود فایل"
        description="آپلود فایل جدید به ImageKit"
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
            @click="router.push('/admin/files')"
          />
        </template>
      </UPageHeader>

      <UPageBody>
        <UCard>
          <div class="space-y-6">
            <!-- File Upload -->
            <div>
              <label class="block text-sm font-medium mb-2">فایل</label>
              <UFileUpload
                v-model="imageFile"
                accept="image/*"
                :max-files="1"
                label="فایل را انتخاب کنید"
                description="حداکثر حجم: 10MB"
                class="w-full min-h-48"
                interactive
                :ui="{
                  base: 'data-[dragging=true]:bg-primary-200 with-transition',
                }"
                @update:model-value="(files) => uploadImage(files)"
              />
              <p v-if="uploading" class="text-xs text-primary-600 mt-2">
                در حال آپلود...
              </p>
            </div>

            <!-- Folder -->
            <div>
              <label class="block text-sm font-medium mb-2"
                >پوشه (اختیاری)</label
              >
              <UInput
                v-model="folder"
                placeholder="/"
                disabled
                description="مسیر پوشه در ImageKit (مثال: /products)"
              />
            </div>

            <!-- File Name -->
            <div>
              <label class="block text-sm font-medium mb-2">
                نام فایل (اختیاری)
              </label>
              <UInput
                v-model="fileName"
                disabled
                placeholder="نام فایل سفارشی"
                description="اگر خالی باشد، از نام اصلی فایل استفاده می‌شود"
              />
            </div>

            <!-- Tags -->
            <div>
              <label class="block text-sm font-medium mb-2"
                >تگ‌ها (اختیاری)</label
              >
              <UInput
                v-model="tags"
                disabled
                placeholder="تگ1, تگ2, تگ3"
                description="تگ‌ها را با کاما جدا کنید"
              />
            </div>

            <!-- Use Unique File Name -->
            <div>
              <UCheckbox
                v-model="useUniqueFileName"
                disabled
                label="استفاده از نام یکتا برای فایل"
                description="اگر فعال باشد،  نام یکتایی برای فایل ایجاد می‌کند"
              />
            </div>
          </div>
        </UCard>
      </UPageBody>
    </UPage>
    <UModal
      v-model:open="uploading"
      :ui="{ content: 'w-max' }"
      :dismissible="false"
    >
      <template #content>
        <div class="p-8 text-center space-y-3">
          <BaseLoader size="lg" />
          <div class="font-bold">در حال بارگزاری عکس</div>
          <div>لطفا شکیبا باشید</div>
        </div>
      </template>
    </UModal>
  </div>
</template>

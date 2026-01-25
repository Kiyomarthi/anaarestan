<script setup lang="ts">
///// imports /////

///// page meta /////
const imageFile = defineModel<File | null>({
  default: null,
});

///// props/emits /////
const props = defineProps<{
  filedAttrs: object;
  fileAttrs: object;
}>();

///// refs /////
const MAX_IMAGE_SIZE = 300 * 1024; // 300KB
const toast = useToast();
const userStore = useUserStore();
const token = userStore.token;

///// composables/stores /////
const { fetch, loading, data } = useApiRequest();

///// computed /////

///// functions /////
const uploadImage = async (files: File | File[] | null) => {
  const file = Array.isArray(files) ? files[0] : files;
  if (!file || !file.name) {
    imageFile.value = null;
    return;
  }

  if (file.size > MAX_IMAGE_SIZE) {
    toast.add({
      title: `حجم فایل بیش از ${MAX_IMAGE_SIZE / 1024 / 1024} مگابایت است`,
      color: "error",
    });
    imageFile.value = null;
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("/api/upload/arvan", {
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

      // Redirect to file list or edit page
    }
  } catch (err: any) {
    imageFile.value = null;
    toast.add({
      title: err?.message || "آپلود فایل ناموفق بود",
      color: "error",
    });
  }
};

///// watchers /////

///// lifecycle /////
</script>

<template>
  <div>
    <UFormField v-bind="filedAttrs">
      <div class="relative">
        <UFileUpload
          v-model="imageFile"
          v-bind="fileAttrs"
          accept="image/*"
          :max-files="1"
          :ui="{
            base: 'data-[dragging=true]:bg-primary-200 with-transition',
          }"
          @update:model-value="(files) => uploadImage(files)"
        />
      </div>
      <p class="text-xs text-gray-500 mt-1">
        حداکثر حجم: 300KB – پس از آپلود، آدرس در فیلد ذخیره می‌شود.
      </p>
      <p v-if="data?.success" class="text-xs text-green-600 mt-1">آپلود شد</p>
    </UFormField>
    <UModal
      v-model:open="loading"
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

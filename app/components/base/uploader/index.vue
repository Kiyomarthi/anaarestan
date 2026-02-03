<script setup lang="ts">
import { useBreakpoints } from "~/composables/utils/useBreakpoints";
import { buildAbsoluteUrlArvan } from "~~/shared/utils/format";

///// imports /////
// TODO: add paginate and search for list of files

///// page meta /////
const imageFile = defineModel<File | null>({
  default: null,
});

const url = defineModel("url", {
  default: null,
});

const emit = defineEmits(["on:error:size"]);

///// props/emits /////
const props = defineProps<{
  filedAttrs?: object;
  fileAttrs?: object;
}>();

///// refs /////
const MAX_IMAGE_SIZE = 300 * 1024; // 300KB
const toast = useToast();
const userStore = useUserStore();
const token = userStore.token;
const galleryModal = ref<boolean>(false);

///// composables/stores /////
const { fetch, loading, data } = useApiRequest();

const {
  fetch: getGallery,
  loading: galleryLoading,
  response: galleryData,
} = useApiRequest();

const { lgAndUp } = useBreakpoints();

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
    emit("on:error:size");
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
      url.value = res?.key ?? res?.data?.key;

      // Redirect to file list or edit page
    }
  } catch (err: any) {
    imageFile.value = null;
    url.value = nul;
    toast.add({
      title: err?.message || "آپلود فایل ناموفق بود",
      color: "error",
    });
  }
};

const showGallery = async () => {
  galleryModal.value = true;

  await getGallery("/api/upload/arvan", {
    headers: {
      Authorization: token,
    },
  });
};

const selectFromGallery = async (key: string) => {
  url.value = key;
  galleryModal.value = false;

  // imageFile.value = key;
};

const clear = () => {
  url.value = null;
  imageFile.value = null;
};

///// watchers /////

///// lifecycle /////
</script>

<template>
  <div>
    <UFormField v-bind="filedAttrs">
      <div class="relative">
        <UFileUpload
          v-if="!url?.length"
          v-model="imageFile"
          v-bind="fileAttrs"
          accept="image/*"
          :max-files="1"
          :ui="{
            base: 'data-[dragging=true]:bg-primary-200 with-transition',
            root: 'h-75',
          }"
          @update:model-value="(files) => uploadImage(files)"
        />
        <div v-else class="relative">
          <UButton
            icon="i-lucide-x"
            color="neutral"
            :ui="{
              trailingIcon: 'text-white',
              base: 'rounded-full absolute -left-1 -top-1 p-0.5',
            }"
            @click="clear"
          />
          <nuxt-img
            :src="buildAbsoluteUrlArvan(url)"
            class="h-75 object-cover w-full"
          />
        </div>
      </div>
      <p class="text-xs text-gray-500 mt-1">حداکثر حجم: 300KB</p>
      <p v-if="data?.success" class="text-xs text-green-600 mt-1">آپلود شد</p>
    </UFormField>
    <UFormField label="آدرس تصویر">
      <UInput v-model="url" dir="ltr" />
      <template #hint>
        <UButton
          icon="i-lucide-image"
          label="انتخاب از گالری"
          variant="soft"
          @click="showGallery"
        />
      </template>
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

    <UModal
      v-if="lgAndUp"
      v-model:open="galleryModal"
      :ui="{ content: 'min-w-150 min-h-100 h-[90dvh] w-[90dvw] max-w-none' }"
      title="گالری"
    >
      <template #body>
        <div
          v-if="galleryLoading"
          class="size-full flex items-center justify-center"
        >
          <BaseLoader size="lg" class="w-28!" />
          <div class="text-xl font-bold">در حال دریافت تصاویر</div>
        </div>
        <div v-else class="grid gap-3 grid-cols-1 lg:grid-cols-3">
          <div
            v-for="(item, index) in galleryData?.Contents"
            :key="index"
            class="size-full flex items-center justify-center p-2 border border-neutral-200 rounded-lg hover:border-primary with-transition cursor-pointer relative"
            :class="url === item?.Key && 'bg-primary-200'"
            @click="selectFromGallery(item?.Key)"
          >
            <UBadge
              v-if="url === item?.Key"
              icon="i-lucide-check"
              color="success"
              class="absolute top-2 right-2"
            />
            <nuxt-img
              :src="buildAbsoluteUrlArvan(item?.Key ?? '')"
              class="h-50 self-center object-contain"
            />
          </div>
        </div>
      </template>
    </UModal>
    <USlideover
      v-else
      v-model:open="galleryModal"
      side="right"
      :ui="{ content: '' }"
      title="گالری"
    >
      <template #body>
        <div
          v-if="galleryLoading"
          class="size-full flex items-center justify-center"
        >
          <BaseLoader size="lg" class="w-28!" />
          <div class="text-xl font-bold">در حال دریافت تصاویر</div>
        </div>
        <div v-else class="grid gap-3 grid-cols-1 lg:grid-cols-3">
          <div
            v-for="(item, index) in galleryData?.Contents"
            :key="index"
            class="size-full flex items-center justify-center p-2 border border-neutral-200 rounded-lg hover:border-primary with-transition cursor-pointer relative"
            :class="url === item?.Key && 'bg-primary-200'"
            @click="selectFromGallery(item?.Key)"
          >
            <UBadge
              v-if="url === item?.Key"
              icon="i-lucide-check"
              color="success"
              class="absolute top-2 right-2"
            />
            <nuxt-img
              :src="buildAbsoluteUrlArvan(item?.Key ?? '')"
              class="h-50 self-center object-contain"
            />
          </div>
        </div>
      </template>
    </USlideover>
  </div>
</template>

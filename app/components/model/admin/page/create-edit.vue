<script setup lang="ts">
// @ts-nocheck
import type { FormSubmitEvent } from "#ui/types";
import { computed, reactive, ref, watch } from "vue";
import { validate } from "~~/shared/validation";
import { useApiFetch } from "~/composables/useApiFetch";
import { useApiRequest } from "~/composables/useApiRequest";

type MediaBlock = {
  type: "banner" | "slider";
  position: number;
  group_index: number;
  item_order: number;
  title: string;
  image: string;
  link?: string;
  is_active: number;
};

type FAQ = {
  question: string;
  answer: string;
  sort_order: number;
  is_active: number;
};

type Content = {
  type: "text" | "html" | "title" | "subtitle" | "quote";
  title?: string;
  body: string;
  is_active: number;
};

type Link = {
  title: string;
  target: string;
  is_active: number;
};

type Breadcrumb = {
  title: string;
  target: string;
  position: number;
  is_active: number;
};

type FormState = {
  slug: string;
  title: string;
  seo_title: string;
  seo_description: string;
  seo_index: number;
  seo_canonical: string;
  seo_og_type: string;
  seo_image: string;
  is_active: number;
  type: string;
  media_blocks: MediaBlock[];
  faqs: FAQ[];
  contents: Content[];
  links: Link[];
  breadcrumbs: Breadcrumb[];
};

const props = defineProps<{
  mode: "create" | "edit";
  pageSlug?: string;
  initialData?: any;
  pagePending?: boolean;
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
const MAX_IMAGE_SIZE = 300 * 1024; // 300KB
const imageFiles = ref<File[][]>([]);

const formState = reactive<FormState>({
  slug: "",
  title: "",
  seo_title: "",
  seo_description: "",
  seo_index: 1,
  seo_canonical: "",
  seo_og_type: "",
  seo_image: "",
  is_active: 1,
  type: "",
  media_blocks: [],
  faqs: [],
  contents: [],
  links: [],
  breadcrumbs: [],
});

const typeOptions = [
  { label: "لندینگ", value: "Landing" },
  { label: "بلاگ", value: "blog" },
  { label: "دسته بندی", value: "category" },
];

const mediaBlockTypes = [
  { label: "بنر", id: "banner" },
  { label: "اسلایدر", id: "slider" },
];

const contentTypes = [
  { label: "Text", id: "text" },
  { label: "HTML", id: "html" },
  { label: "Title", id: "title" },
  { label: "Subtitle", id: "subtitle" },
  { label: "Quote", id: "quote" },
];

// Watch for initial data in edit mode
watch(
  () => props.initialData,
  (newData) => {
    if (props.mode === "edit" && newData?.data) {
      const page = newData.data.page;
      formState.slug = page.slug || "";
      formState.title = page.title || "";
      formState.seo_title = page.seo_title || "";
      formState.seo_description = page.seo_description || "";
      formState.seo_index = page.seo_index || 1;
      formState.seo_canonical = page.seo_canonical || "";
      formState.seo_og_type = page.seo_og_type || "";
      formState.seo_image = page.seo_image || "";
      formState.is_active = page.is_active || 1;
      formState.type = page.type || "";
      formState.media_blocks = newData.data.media_blocks || [];
      formState.faqs = newData.data.faqs || [];
      formState.contents = newData.data.contents || [];
      formState.links = newData.data.links || [];
      formState.breadcrumbs = newData.data.breadcrumbs || [];
    }
  },
  { immediate: true }
);

const addMediaBlock = () => {
  formState.media_blocks.push({
    type: "banner",
    position: formState.media_blocks.length + 1,
    group_index: 1,
    item_order: 1,
    title: "",
    image: "",
    link: "",
    is_active: 1,
  });
};

const removeMediaBlock = (index: number) => {
  formState.media_blocks.splice(index, 1);
};

const addFAQ = () => {
  formState.faqs.push({
    question: "",
    answer: "",
    sort_order: formState.faqs.length + 1,
    is_active: 1,
  });
};

const removeFAQ = (index: number) => {
  formState.faqs.splice(index, 1);
};

const addContent = () => {
  formState.contents.push({
    type: "text",
    title: "",
    body: "",
    is_active: 1,
  });
};

const removeContent = (index: number) => {
  formState.contents.splice(index, 1);
};

const addLink = () => {
  formState.links.push({
    title: "",
    target: "",
    is_active: 1,
  });
};

const removeLink = (index: number) => {
  formState.links.splice(index, 1);
};

const addBreadcrumb = () => {
  formState.breadcrumbs.push({
    title: "",
    target: "",
    position: formState.breadcrumbs.length + 1,
    is_active: 1,
  });
};

const removeBreadcrumb = (index: number) => {
  formState.breadcrumbs.splice(index, 1);
};

const handleUpload = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await sendRequest("/api/upload", {
    method: "POST",
    body: formData,
    headers: {
      Authorization: token,
    },
  });
  if (res.success) {
    return res.data.url;
  }
  return null;
};

const onSubmit = async (event: FormSubmitEvent<any>) => {
  // Basic validation
  if (!formState.slug || !formState.title || !formState.type) {
    toast.add({ title: "لطفا فیلدهای ضروری را پر کنید", color: "error" });
    return;
  }

  // Validate media_blocks
  for (const block of formState?.media_blocks) {
    if (!block.title || !block.image) {
      toast.add({
        title: "لطفا عنوان و تصویر برای media blocks را پر کنید",
        color: "error",
      });
      return;
    }
  }

  // Validate faqs
  for (const faq of formState.faqs) {
    if (!faq.question || !faq.answer) {
      toast.add({
        title: "لطفا سوال و پاسخ برای FAQs را پر کنید",
        color: "error",
      });
      return;
    }
  }

  // Validate contents
  for (const content of formState.contents) {
    if (!content.body) {
      toast.add({ title: "لطفا بدنه محتوا را پر کنید", color: "error" });
      return;
    }
  }

  // Validate links
  for (const link of formState.links) {
    if (!link.title || !link.target) {
      toast.add({ title: "لطفا عنوان و هدف لینک را پر کنید", color: "error" });
      return;
    }
  }

  // Validate breadcrumbs
  for (const breadcrumb of formState.breadcrumbs) {
    if (!breadcrumb.title || !breadcrumb.target) {
      toast.add({
        title: "لطفا عنوان و هدف breadcrumb را پر کنید",
        color: "error",
      });
      return;
    }
  }

  emit("submit", {
    slug: formState.slug,
    title: formState.title,
    seo_title: formState.seo_title,
    seo_description: formState.seo_description,
    seo_index: formState.seo_index,
    seo_canonical: formState.seo_canonical,
    seo_og_type: formState.seo_og_type,
    seo_image: formState.seo_image,
    is_active: formState.is_active,
    type: formState.type,
    media_blocks: formState.media_blocks,
    faqs: formState.faqs,
    contents: formState.contents,
    links: formState.links,
    breadcrumbs: formState.breadcrumbs,
  });
};

const uploadImage = async (idx: number, file: File) => {
  if (!file || !file.name) return;

  if (file.size > MAX_IMAGE_SIZE) {
    toast.add({
      title: "حجم فایل بیش از 300 کیلوبایت است",
      color: "error",
    });
    imageFiles.value[idx] = [];
    formState.media_blocks[idx].image = "";
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

    formState.media_blocks[idx].image = uploadedUrl;
  } catch (err: any) {
    imageFiles.value[idx] = [];
    formState.media_blocks[idx].image = "";
    toast.add({
      title: err?.message || "آپلود تصویر ناموفق بود",
      color: "error",
    });
  }
};
</script>

<template>
  <div class="md:p-4">
    <UPage>
      <UPageHeader
        :title="
          mode === 'create' ? 'ایجاد صفحه جدید' : `ویرایش صفحه: ${name || ''}`
        "
        :description="
          mode === 'create' ? 'صفحه جدیدی ایجاد کنید' : 'صفحه را ویرایش کنید'
        "
        :ui="{ root: 'pt-0 pb-4' }"
      />
      <UPageBody>
        <UForm :state="formState" @submit="onSubmit">
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">اطلاعات پایه</h3>
            </template>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UFormField label="Slug" required>
                <UInput
                  v-model="formState.slug"
                  placeholder="about-us"
                  :ui="{ root: 'w-full' }"
                />
              </UFormField>
              <UFormField label="عنوان" required>
                <UInput
                  v-model="formState.title"
                  placeholder="درباره ما"
                  :ui="{ root: 'w-full' }"
                />
              </UFormField>
              <UFormField label="نوع صفحه" required>
                <USelectMenu
                  v-model="formState.type"
                  value-key="value"
                  :items="typeOptions"
                  :searchInput="false"
                  :ui="{ base: 'w-full' }"
                />
              </UFormField>

              <UFormField label="وضعیت">
                <USelectMenu
                  v-model="formState.is_active"
                  value-key="value"
                  :items="[
                    { label: 'فعال', value: 1 },
                    { label: 'غیرفعال', value: 0 },
                  ]"
                  :searchInput="false"
                  :ui="{ base: 'w-full' }"
                />
              </UFormField>
            </div>
          </UCard>

          <UCard class="mt-4">
            <template #header>
              <h3 class="text-lg font-semibold">تنظیمات سئو</h3>
            </template>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <UFormField label="عنوان سئو">
                <UInput
                  v-model="formState.seo_title"
                  :ui="{ root: 'w-full' }"
                />
              </UFormField>
              <UFormField label="توضیح سئو">
                <UTextarea
                  v-model="formState.seo_description"
                  rows="3"
                  :ui="{ root: 'w-full' }"
                />
              </UFormField>
              <UFormField label="ایندکس">
                <USelectMenu
                  v-model="formState.seo_index"
                  value-key="value"
                  :searchInput="false"
                  :items="[
                    { label: 'فعال', value: 1 },
                    { label: 'غیرفعال', value: 0 },
                  ]"
                  :ui="{ base: 'w-full' }"
                />
              </UFormField>
              <UFormField label="Canonical URL">
                <UInput
                  v-model="formState.seo_canonical"
                  :ui="{ root: 'w-full' }"
                />
              </UFormField>
              <UFormField label="OG Type">
                <UInput
                  v-model="formState.seo_og_type"
                  placeholder="website"
                  :ui="{ root: 'w-full' }"
                />
              </UFormField>
              <UFormField label="SEO Image">
                <UInput
                  v-model="formState.seo_image"
                  disabled
                  :ui="{ root: 'w-full' }"
                />
              </UFormField>
            </div>
          </UCard>

          <UCard class="mt-4">
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold">تصاویر</h3>
                <UButton icon="i-lucide-plus" @click="addMediaBlock"
                  >افزودن</UButton
                >
              </div>
            </template>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="(block, index) in formState.media_blocks"
                :key="index"
                class="border border-gray-400 rounded-xl border-dashed mb-4 p-3"
              >
                <div>
                  <UFormField
                    :name="`image-${index}-url`"
                    label="آدرس عکس"
                    required
                  >
                    <div class="relative">
                      <UFileUpload
                        v-model="imageFiles[index]"
                        accept="image/*"
                        :max-files="1"
                        :label="`عکس ${index + 1}`"
                        description="عکس خود را با فرمت webp، و در حداقلی ترین حجم آپلود کنید"
                        class="w-full min-h-48"
                        interactive
                        :ui="{
                          base: 'data-[dragging=true]:bg-primary-200 with-transition',
                        }"
                        @update:model-value="
                          (files) => uploadImage(index, files)
                        "
                      />
                    </div>
                    <p class="text-xs text-gray-500 mt-1">
                      حداکثر حجم: 300KB – پس از آپلود، آدرس در فیلد ذخیره
                      می‌شود.
                    </p>
                    <p v-if="block?.image" class="text-xs text-green-600 mt-1">
                      آپلود شد
                    </p>
                  </UFormField>
                  <UFormField label="تصویر" required>
                    <UInput v-model="block.image" disabled />
                  </UFormField>
                </div>
                <UFormField label="نوع">
                  <USelectMenu
                    v-model="block.type"
                    :search-input="false"
                    :items="mediaBlockTypes"
                    value-key="id"
                    :ui="{ base: 'w-full' }"
                  />
                </UFormField>
                <UFormField label="متن جایگزین (alt)" required>
                  <UInput v-model="block.title" />
                </UFormField>

                <UFormField label="لینک">
                  <UInput v-model="block.link" />
                </UFormField>
                <UFormField label="موقعیت">
                  <UInput v-model.number="block.position" type="number" />
                </UFormField>
                <UFormField label="گروه">
                  <UInput
                    v-model.number="block.group_index"
                    type="number"
                    :disabled="block.type === 'banner'"
                  />
                </UFormField>
                <UFormField label="ترتیب">
                  <UInput
                    v-model.number="block.item_order"
                    type="number"
                    disabled
                  />
                </UFormField>
                <UFormField label="وضعیت">
                  <USelectMenu
                    v-model="block.is_active"
                    :search-input="false"
                    value-key="id"
                    :items="[
                      { label: 'فعال', id: 1 },
                      { label: 'غیرفعال', id: 0 },
                    ]"
                  />
                </UFormField>
                <UButton
                  color="error"
                  variant="ghost"
                  @click="removeMediaBlock(index)"
                  class="mt-2"
                  >حذف</UButton
                >
              </div>
            </div>
          </UCard>

          <UCard class="mt-4">
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold">سوالات متداول</h3>
                <UButton icon="i-lucide-plus" @click="addFAQ">افزودن</UButton>
              </div>
            </template>
            <div
              v-for="(faq, index) in formState.faqs"
              :key="index"
              class="border border-gray-400 rounded-xl border-dashed mb-4 p-3"
            >
              <div class="grid grid-cols-1 gap-4">
                <UFormField label="سوال" required>
                  <UInput v-model="faq.question" />
                </UFormField>
                <UFormField label="پاسخ" required>
                  <UTextarea v-model="faq.answer" rows="3" />
                </UFormField>
                <div class="grid grid-cols-2 gap-4">
                  <UFormField label="ترتیب">
                    <UInput v-model.number="faq.sort_order" type="number" />
                  </UFormField>
                  <UFormField label="وضعیت">
                    <USelectMenu
                      v-model="faq.is_active"
                      :search-input="false"
                      value-key="id"
                      :items="[
                        { label: 'فعال', id: 1 },
                        { label: 'غیرفعال', id: 0 },
                      ]"
                    />
                  </UFormField>
                </div>
              </div>
              <UButton
                color="error"
                variant="ghost"
                @click="removeFAQ(index)"
                class="mt-2"
                >حذف</UButton
              >
            </div>
          </UCard>

          <UCard class="mt-4">
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold">محتواها</h3>
                <UButton icon="i-lucide-plus" @click="addContent"
                  >افزودن</UButton
                >
              </div>
            </template>
            <div
              v-for="(content, index) in formState.contents"
              :key="index"
              class="border border-gray-400 rounded-xl border-dashed mb-4 p-3"
            >
              <div class="grid grid-cols-1 gap-4">
                <UFormField label="نوع">
                  <USelectMenu
                    v-model="content.type"
                    value-key="id"
                    :items="contentTypes"
                    :search-input="false"
                  />
                </UFormField>
                <UFormField label="عنوان">
                  <UInput v-model="content.title" />
                </UFormField>
                <UFormField label="بدنه" required>
                  <UTextarea v-model="content.body" rows="4" />
                </UFormField>
                <UFormField label="وضعیت">
                  <USelectMenu
                    v-model="content.is_active"
                    :search-input="false"
                    value-key="id"
                    :items="[
                      { label: 'فعال', id: 1 },
                      { label: 'غیرفعال', id: 0 },
                    ]"
                  />
                </UFormField>
              </div>
              <UButton
                color="error"
                variant="ghost"
                @click="removeContent(index)"
                class="mt-2"
                >حذف</UButton
              >
            </div>
          </UCard>

          <UCard class="mt-4">
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold">لینک‌ها</h3>
                <UButton icon="i-lucide-plus" @click="addLink">افزودن</UButton>
              </div>
            </template>
            <div
              v-for="(link, index) in formState.links"
              :key="index"
              class="border border-gray-400 rounded-xl border-dashed mb-4 p-3"
            >
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UFormField label="عنوان" required>
                  <UInput v-model="link.title" />
                </UFormField>
                <UFormField label="هدف" required>
                  <UInput v-model="link.target" />
                </UFormField>
                <UFormField label="وضعیت">
                  <USelectMenu
                    v-model="link.is_active"
                    :search-input="false"
                    value-key="id"
                    :items="[
                      { label: 'فعال', id: 1 },
                      { label: 'غیرفعال', id: 0 },
                    ]"
                  />
                </UFormField>
              </div>
              <UButton
                color="error"
                variant="ghost"
                @click="removeLink(index)"
                class="mt-2"
                >حذف</UButton
              >
            </div>
          </UCard>

          <UCard class="mt-4">
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold">Breadcrumbs</h3>
                <UButton icon="i-lucide-plus" @click="addBreadcrumb"
                  >افزودن</UButton
                >
              </div>
            </template>
            <div
              v-for="(breadcrumb, index) in formState.breadcrumbs"
              :key="index"
              class="border border-gray-400 rounded-xl border-dashed mb-4 p-3"
            >
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UFormField label="عنوان" required>
                  <UInput v-model="breadcrumb.title" />
                </UFormField>
                <UFormField label="هدف" required>
                  <UInput v-model="breadcrumb.target" />
                </UFormField>
                <UFormField label="موقعیت">
                  <UInput v-model.number="breadcrumb.position" type="number" />
                </UFormField>
                <UFormField label="وضعیت">
                  <USelectMenu
                    v-model="breadcrumb.is_active"
                    :search-input="false"
                    value-key="id"
                    :items="[
                      { label: 'فعال', id: 1 },
                      { label: 'غیرفعال', id: 0 },
                    ]"
                  />
                </UFormField>
              </div>
              <UButton
                color="error"
                variant="ghost"
                @click="removeBreadcrumb(index)"
                class="mt-2"
                >حذف</UButton
              >
            </div>
          </UCard>

          <div class="flex justify-end mt-6">
            <UButton type="submit" :loading="saving" color="primary">
              {{ mode === "create" ? "ایجاد صفحه" : "بروزرسانی صفحه" }}
            </UButton>
          </div>
        </UForm>
      </UPageBody>
    </UPage>
  </div>
</template>

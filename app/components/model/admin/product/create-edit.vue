<script setup lang="ts">
// @ts-nocheck
import type { FormSubmitEvent } from "#ui/types";
import { computed, reactive, ref, watch } from "vue";
import { validate } from "~~/shared/validation";
import { useApiFetch } from "~/composables/useApiFetch";
import { useApiRequest } from "~/composables/useApiRequest";

type AttributeValueOption = {
  label: string;
  value: number;
  attributeId: number;
  attributeName: string;
};

type CategoryNode = {
  id: number;
  name: string;
  children?: CategoryNode[];
};

type Variant = {
  sku: string;
  price: number | null;
  discount_price: number | null;
  stock: number | null;
  status: boolean;
};

type Image = {
  url: string;
  alt_text: string;
  position: number;
};

type FormState = {
  category_id: number | null;
  title: string;
  slug: string;
  short_description: string;
  description: string;
  status: boolean;
  product_attributes: number[];
  variants: Variant[];
  variant_attributes: number[][];
  images: Image[];
};

const props = defineProps<{
  mode: "create" | "edit";
  productCode?: string;
  initialData?: any;
  productPending?: boolean;
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

const formState = reactive<FormState>({
  category_id: null,
  title: "",
  slug: "",
  short_description: "",
  description: "",
  status: true,
  product_attributes: [],
  variants: [
    {
      sku: "",
      price: null,
      discount_price: null,
      stock: null,
      status: true,
    },
  ],
  variant_attributes: [[]],
  images: [{ url: "", alt_text: "", position: 1 }],
});

const {
  data: categoriesRes,
  pending: categoriesPending,
  execute: loadCategories,
} = useApiFetch<{ data: CategoryNode[] }>("/api/categories", {
  immediate: false,
});

const {
  data: attributesRes,
  pending: attributesPending,
  execute: loadAttributes,
} = useApiFetch<{ data: any[] }>("/api/attributes", {
  immediate: false,
});

const categoriesLoaded = ref(false);
const attributesLoaded = ref(false);

const flattenCategories = (nodes: CategoryNode[] = [], level = 0): any[] =>
  nodes.flatMap((node) => [
    { label: `${"— ".repeat(level)}${node.name}`, value: node.id },
    ...(node.children ? flattenCategories(node.children, level + 1) : []),
  ]);

const categoryOptions = computed(() =>
  flattenCategories(categoriesRes.value?.data ?? [])
);

const productAttributeOptions = computed<AttributeValueOption[]>(() => {
  const list = attributesRes.value?.data ?? [];
  return list
    .filter((attr: any) => attr.type === "product")
    .flatMap((attr: any) =>
      (attr.values || []).map((val: any) => ({
        label: `${attr.name} - ${val.value}`,
        value: val.id,
        attributeId: val.attribute_id,
        attributeName: attr.name,
      }))
    );
});

const variantAttributeOptions = computed<AttributeValueOption[]>(() => {
  const list = attributesRes.value?.data ?? [];
  return list
    .filter((attr: any) => attr.type === "variant")
    .flatMap((attr: any) =>
      (attr.values || []).map((val: any) => ({
        label: `${attr.name} - ${val.value}`,
        value: val.id,
        attributeId: val.attribute_id,
        attributeName: attr.name,
      }))
    );
});

const ensureCategories = () => {
  if (categoriesLoaded.value) return;
  categoriesLoaded.value = true;
  loadCategories();
};

const ensureAttributes = () => {
  if (attributesLoaded.value) return;
  attributesLoaded.value = true;
  loadAttributes();
};

const MAX_IMAGE_SIZE = 300 * 1024; // 300KB
const imageFiles = ref<File[][]>([]);

watch(
  () => props.initialData,
  async (product) => {
    if (!product || props.mode !== "edit") return;
    const data = product?.data || product;
    if (!data) return;

    formState.category_id = data.category?.id ?? null;
    formState.title = data.title ?? "";
    formState.slug = data.slug ?? "";
    formState.short_description = data.short_description ?? "";
    formState.description = data.description ?? "";
    formState.status = data.status === 1;
    formState.product_attributes = (data.products_attribute || []).map(
      (attr: any) => attr.id
    );

    formState.variants =
      (data.variant_attribute || []).map((v: any) => ({
        sku: v.sku ?? "",
        price: v.price ? Number(v.price) : null,
        discount_price: v.discount_price ? Number(v.discount_price) : null,
        stock: v.stock ? Number(v.stock) : null,
        status: v.status === 1,
      })) || [];

    formState.variant_attributes =
      (data.variant_attribute || []).map((v: any) =>
        (v.variant_attributes || []).map((attr: any) => attr.id)
      ) || [];

    formState.images = [];
    (data.gallery || []).forEach((img: any) => {
      if (img.url) {
        formState.images.push({
          url: img.url,
          alt_text: img.alt_text,
          position: img.position,
        });
      }
    });

    if (formState.variants.length === 0) {
      formState.variants = [
        {
          sku: "",
          price: null,
          discount_price: null,
          stock: null,
          status: true,
        },
      ];
      formState.variant_attributes = [[]];
    }

    if (formState.images.length === 0) {
      formState.images = [{ url: data.image || "", alt_text: "", position: 1 }];
    }

    imageFiles.value = await Promise.all(
      data.gallery.map(async (img) => {
        return await urlToFile(img.url, "image");
      })
    );
  },
  { immediate: true }
);

const addVariant = () => {
  formState.variants.push({
    sku: "",
    price: null,
    discount_price: null,
    stock: null,
    status: true,
  });
  formState.variant_attributes.push([]);
};

const removeVariant = (idx: number) => {
  if (formState.variants.length === 1) return;
  formState.variants.splice(idx, 1);
  formState.variant_attributes.splice(idx, 1);
};

const addImage = () => {
  const nextPosition = (formState.images?.length || 0) + 1;
  formState.images.push({ url: "", alt_text: "", position: nextPosition });
  imageFiles.value.push([]);
};

const removeImage = (idx: number) => {
  if (formState.images.length === 1) return;
  formState.images.splice(idx, 1);
  imageFiles.value.splice(idx, 1);
};

function validateForm(state: FormState) {
  const errors: any[] = [];
  validate(state.category_id).required().pushError("category_id", errors);
  validate(state.title).required().min(2).max(150).pushError("title", errors);
  validate(state.short_description)
    .required()
    .min(2)
    .max(150)
    .pushError("short_description", errors);

  validate(state.description)
    .required()
    .min(1000)
    .max(10000)
    .pushError("description", errors);

  if (props.mode === "create") {
    validate(state.slug).required().slug().pushError("slug", errors);
  }

  validate(state.variants).array().pushError("variants", errors);
  validate(state.images).array().pushError("images", errors);
  state.images.forEach((variant, index) => {
    validate(variant.url).required().pushError(`image-${index}-url`, errors);
    validate(variant.alt_text)
      .required()
      .pushError(`image-${index}-alt`, errors);
  });

  if (state.images.length > 0) {
    const hasMain = state.images.some((img: any) => img.position === 1);
    if (!hasMain) {
      errors.push({
        name: `image-0-position`,
        message: "عکس با اولویت=1 الزامی است",
      });
    }
  }

  state.variants.forEach((variant, index) => {
    const base = `variant-${index}`;
    validate(variant.sku).required().pushError(`${base}-sku`, errors);
    validate(variant.price).required().pushError(`${base}-price`, errors);
    validate(variant.stock).required().pushError(`${base}-stock`, errors);
  });

  return errors;
}

const uploadImage = async (idx: number, file: File) => {
  if (!file || !file.name) return;

  if (file.size > MAX_IMAGE_SIZE) {
    toast.add({
      title: "حجم فایل بیش از 300 کیلوبایت است",
      color: "error",
    });
    imageFiles.value[idx] = [];
    formState.images[idx].url = "";
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

    formState.images[idx].url = uploadedUrl;
  } catch (err: any) {
    imageFiles.value[idx] = [];
    formState.images[idx].url = "";
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
    category_id: formState.category_id,
    title: formState.title,
    short_description: formState.short_description || null,
    description: formState.description || null,
    status: formState.status ? 1 : 0,
    product_attributes: formState.product_attributes,
    variants: formState.variants.map((v) => ({
      sku: v.sku,
      price: Number(v.price) || 0,
      discount_price:
        v.discount_price !== null && v.discount_price !== undefined
          ? Number(v.discount_price) || null
          : null,
      stock: Number(v.stock) || 0,
      status: v.status ? 1 : 0,
    })),
    variant_attributes: formState.variant_attributes,
    images: formState.images.map((img) => ({
      url: img.url,
      alt_text: img.alt_text || null,
      position: Number(img.position) || 0,
    })),
  };

  if (props.mode === "create") {
    payload.slug = formState.slug;
  }

  emit("submit", payload);
};

const pageTitle = computed(() => {
  if (props.mode === "create") {
    return "ایجاد محصول";
  }
  return `ویرایش محصول ${props.name || props.productCode || ""}`;
});

const pageDescription = computed(() => {
  if (props.mode === "create") {
    return "فرم ثبت محصول جدید";
  }
  return "اطلاعات محصول را بروزرسانی کنید";
});

const submitButtonLabel = computed(() => {
  if (props.mode === "create") {
    return "ذخیره محصول";
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
          v-if="mode === 'edit' && productPending"
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
                <UFormField label="دسته‌بندی" name="category_id" required>
                  <USelectMenu
                    v-model="formState.category_id"
                    :items="categoryOptions"
                    value-key="value"
                    placeholder="انتخاب دسته"
                    :loading="categoriesPending"
                    :ui="{ base: 'w-full' }"
                    @focus="ensureCategories"
                  />
                </UFormField>

                <UFormField label="عنوان" name="title" required>
                  <UInput
                    v-model="formState.title"
                    placeholder="عنوان محصول"
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
                    placeholder="product-slug"
                    :disabled="isSlugDisabled"
                    :ui="{ root: 'w-full' }"
                  />
                </UFormField>

                <UFormField label="توضیح کوتاه" name="short_description">
                  <UTextarea
                    v-model="formState.short_description"
                    :rows="3"
                    placeholder="توضیح کوتاه محصول"
                    :ui="{ root: 'w-full' }"
                  />
                </UFormField>

                <UFormField label="وضعیت" name="status">
                  <UCheckbox
                    v-model="formState.status"
                    name="status"
                    label="فعال"
                  />
                </UFormField>
                <UFormField
                  label="ویژگی‌های محصول"
                  name="product_attributes"
                  :ui="{ root: 'w-full' }"
                >
                  <USelectMenu
                    v-model="formState.product_attributes"
                    :multiple="true"
                    :items="productAttributeOptions"
                    value-key="value"
                    placeholder="انتخاب ویژگی"
                    :loading="attributesPending"
                    :ui="{ base: 'w-full' }"
                    @focus="ensureAttributes"
                  />
                </UFormField>
              </div>

              <div class="space-y-4">
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="font-medium">تنوع‌ها</span>
                    <UButton
                      size="xs"
                      color="primary"
                      variant="soft"
                      icon="i-lucide-plus"
                      @click="addVariant"
                    >
                      افزودن تنوع
                    </UButton>
                  </div>

                  <UCard
                    v-for="(variant, idx) in formState.variants"
                    :key="idx"
                    class="border border-dashed"
                  >
                    <div class="flex items-center justify-between mb-3">
                      <span class="text-sm text-gray-600"
                        >تنوع {{ idx + 1 }}</span
                      >
                      <UButton
                        v-if="formState.variants.length > 1"
                        size="xs"
                        color="error"
                        variant="ghost"
                        icon="i-lucide-trash"
                        @click="removeVariant(idx)"
                      />
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <UFormField
                        :name="`variant-${idx}-sku`"
                        label="SKU"
                        required
                      >
                        <UInput
                          v-model="variant.sku"
                          placeholder="کد SKU"
                          :ui="{ root: 'w-full' }"
                        />
                      </UFormField>

                      <UFormField
                        :name="`variant-${idx}-price`"
                        label="قیمت"
                        required
                        :ui="{ root: 'w-full' }"
                      >
                        <UInput
                          v-model="variant.price"
                          type="number"
                          inputmode="decimal"
                          placeholder="قیمت"
                          :ui="{ root: 'w-full' }"
                        />
                      </UFormField>

                      <UFormField
                        :name="`variant-${idx}-discount_price`"
                        label="قیمت با تخفیف"
                      >
                        <UInput
                          v-model="variant.discount_price"
                          type="number"
                          inputmode="decimal"
                          placeholder="مثال: 120000"
                          :ui="{ root: 'w-full' }"
                        />
                      </UFormField>

                      <UFormField
                        :name="`variant-${idx}-stock`"
                        label="موجودی"
                        required
                      >
                        <UInput
                          v-model="variant.stock"
                          type="number"
                          inputmode="numeric"
                          placeholder="مثال: 10"
                          :ui="{ root: 'w-full' }"
                        />
                      </UFormField>

                      <UFormField label="وضعیت" :name="`variant-${idx}-status`">
                        <UCheckbox
                          v-model="variant.status"
                          :name="`variant-${idx}-status`"
                          label="فعال"
                        />
                      </UFormField>
                    </div>

                    <UFormField
                      class="mt-3"
                      label="ویژگی‌های تنوع"
                      :name="`variant-${idx}-attributes`"
                    >
                      <USelectMenu
                        v-model="formState.variant_attributes[idx]"
                        :multiple="true"
                        :items="variantAttributeOptions"
                        value-key="value"
                        placeholder="انتخاب ویژگی تنوع"
                        :loading="attributesPending"
                        :ui="{ base: 'w-full' }"
                        @focus="ensureAttributes"
                      />
                    </UFormField>
                  </UCard>
                </div>
              </div>
            </div>

            <div class="mt-6 space-y-3">
              <div class="flex items-center justify-between">
                <span class="font-medium">عکس‌ها</span>
                <UButton
                  size="xs"
                  color="primary"
                  variant="soft"
                  icon="i-lucide-plus"
                  @click="addImage"
                >
                  افزودن عکس
                </UButton>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <UCard
                  v-for="(img, idx) in formState.images"
                  :key="idx"
                  class="border border-dashed"
                >
                  <div class="flex items-center justify-between mb-3">
                    <span class="text-sm text-gray-600">عکس {{ idx + 1 }}</span>
                    <UButton
                      v-if="formState.images.length > 1"
                      size="xs"
                      color="error"
                      variant="ghost"
                      icon="i-lucide-trash"
                      @click="removeImage(idx)"
                    />
                  </div>

                  <div class="grid grid-cols-1 gap-3">
                    <UFormField
                      :name="`image-${idx}-url`"
                      label="آدرس عکس"
                      required
                    >
                      <div class="relative">
                        <UFileUpload
                          v-model="imageFiles[idx]"
                          accept="image/*"
                          :max-files="1"
                          :label="`عکس ${idx + 1}`"
                          description="عکس خود را با فرمت .avif و در حداقلی ترین حجم آپلود کنید"
                          class="w-full min-h-48"
                          interactive
                          :ui="{
                            base: 'data-[dragging=true]:bg-primary-200 with-transition',
                          }"
                          @update:model-value="
                            (files) => uploadImage(idx, files)
                          "
                        />
                      </div>
                      <p class="text-xs text-gray-500 mt-1">
                        حداکثر حجم: 300KB – پس از آپلود، آدرس در فیلد ذخیره
                        می‌شود.
                      </p>
                      <p
                        v-if="formState.images[idx].url"
                        class="text-xs text-green-600 mt-1"
                      >
                        آپلود شد
                      </p>
                    </UFormField>

                    <UFormField
                      :name="`image-${idx}-alt`"
                      label="متن جایگزین"
                      required
                    >
                      <UInput
                        v-model="img.alt_text"
                        placeholder="Alt"
                        :ui="{ root: 'w-full' }"
                      />
                    </UFormField>

                    <UFormField
                      :name="`image-${idx}-position`"
                      label="اولویت (position)"
                      hint="الزما باید اولویت یکی از عکس ها 1 باشد."
                      required
                    >
                      <UInput
                        v-model="img.position"
                        type="number"
                        inputmode="numeric"
                        placeholder="1"
                        :ui="{ root: 'w-full' }"
                      />
                    </UFormField>
                  </div>
                </UCard>
              </div>
            </div>

            <div class="border border-gray-300 rounded-xl p-2 mt-4">
              <UFormField label="توضیحات" name="description">
                <clientOnly>
                  <template #placeholder>
                    <div class="border border-gray-300 rounded p-4">
                      در حال بارگذاری ویرایشگر...
                    </div>
                  </template>
                  <BaseEditor
                    v-model="formState.description"
                    :ui="{ root: 'w-full' }"
                  />
                </clientOnly>
              </UFormField>
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
                :loading="saving || uploading"
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

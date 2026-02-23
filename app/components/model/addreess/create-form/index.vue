<script setup lang="ts">
import type { FormSubmitEvent } from "#ui/types";
import { validate } from "~~/shared/validation";

type Address = {
  id: number;
  is_default: number;
  province_name: string;
  city_name: string;
  full_address: string;
  postal_code: string;
  shipping_cost?: number;
};

type Province = {
  id: number;
  name: string;
  title?: string;
};

type City = {
  id: number;
  province_id: number;
  name: string;
  title?: string;
};

type AddressFormState = {
  province_id: number | null;
  city_id: number | null;
  full_address: string;
  plate: string;
  unit: string;
  postal_code: string;
  is_default: boolean;
};

const props = withDefaults(
  defineProps<{
    open: boolean;
    defaultIsDefault?: boolean;
  }>(),
  {
    defaultIsDefault: false,
  },
);

const emit = defineEmits<{
  created: [address: Address];
  cancel: [];
}>();

const toast = useToast();
const { fetch: createAddress, loading: creatingAddress } = useApiRequest<{
  success: boolean;
  message?: string;
  data: Address;
}>();
const { fetch: fetchProvinces, loading: provincesLoading } = useApiRequest<{
  success: boolean;
  data: Province[];
}>();
const { fetch: fetchCities, loading: citiesLoading } = useApiRequest<{
  success: boolean;
  data: City[];
}>();

const getInitialAddressFormState = (): AddressFormState => ({
  province_id: null,
  city_id: null,
  full_address: "",
  plate: "",
  unit: "",
  postal_code: "",
  is_default: props.defaultIsDefault,
});

const addressFormState = reactive<AddressFormState>(
  getInitialAddressFormState(),
);
const provincesResponse = ref<{ success: boolean; data: Province[] }>({
  success: true,
  data: [],
});
const citiesResponse = ref<{ success: boolean; data: City[] }>({
  success: true,
  data: [],
});

const provinces = computed(() =>
  (provincesResponse.value?.data || []).map((province) => ({
    id: Number(province.id),
    name: province.name || province.title || "",
  })),
);

const cities = computed(() =>
  (citiesResponse.value?.data || []).map((city) => ({
    id: Number(city.id),
    province_id: Number(city.province_id),
    name: city.name || city.title || "",
  })),
);

const provinceItems = computed(() =>
  provinces.value.map((province) => ({
    label: province.name,
    value: province.id,
  })),
);

const cityItems = computed(() =>
  cities.value.map((city) => ({
    label: city.name,
    value: city.id,
  })),
);

const resetAddressForm = () => {
  Object.assign(addressFormState, getInitialAddressFormState());
};

const loadProvinces = async () => {
  try {
    provincesResponse.value = await fetchProvinces("/api/provinces", {
      method: "GET",
      errorTitle: "خطا در دریافت استان‌ها",
      key: "provinces",
    });
  } catch {
    provincesResponse.value = { success: true, data: [] };
  }
};

const loadCities = async () => {
  const provinceId = addressFormState.province_id;
  if (!provinceId) {
    citiesResponse.value = { success: true, data: [] };
    return;
  }

  try {
    citiesResponse.value = await fetchCities("/api/cities", {
      method: "GET",
      query: { province_id: provinceId },
      errorTitle: "خطا در دریافت شهرها",
      key: "cities",
    });
  } catch {
    citiesResponse.value = { success: true, data: [] };
  }
};

const validateAddressForm = (state: AddressFormState) => {
  const errors: any[] = [];

  validate(state.province_id)
    .required("استان را انتخاب کنید")
    .pushError("province_id", errors);
  validate(state.city_id)
    .required("شهر را انتخاب کنید")
    .pushError("city_id", errors);
  validate(state.full_address?.trim())
    .required("آدرس کامل را وارد کنید")
    .min(5, "آدرس باید حداقل ۵ کاراکتر باشد")
    .pushError("full_address", errors);
  validate(state.postal_code?.trim())
    .required("کدپستی را وارد کنید")
    .min(10, "کدپستی باید 10 رقم باشد")
    .pushError("postal_code", errors);

  return errors;
};

const submitAddressForm = async (event: FormSubmitEvent<AddressFormState>) => {
  const payload = {
    province_id: Number(event.data.province_id),
    city_id: Number(event.data.city_id),
    full_address: event.data.full_address.trim(),
    plate: event.data.plate.trim() || null,
    unit: event.data.unit.trim() || null,
    postal_code: event.data.postal_code.trim(),
    is_default: event.data.is_default ? 1 : 0,
  };

  try {
    const response = await createAddress("/api/addresses", {
      method: "POST",
      body: payload,
      errorDescription: "ثبت آدرس جدید انجام نشد",
    });

    toast.add({
      title: "موفق",
      description: response?.message || "آدرس جدید با موفقیت ثبت شد",
      color: "success",
    });
    emit("created", response.data);
    resetAddressForm();
  } catch {
    // Handled by useApiRequest toast
  }
};

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      resetAddressForm();
    }
  },
);

watch(
  () => props.defaultIsDefault,
  (value) => {
    if (!props.open) {
      addressFormState.is_default = value;
    }
  },
);

watch(
  () => addressFormState.province_id,
  (provinceId, previousProvinceId) => {
    if (provinceId !== previousProvinceId) {
      addressFormState.city_id = null;
    }
  },
);

const handleCancel = () => {
  resetAddressForm();
  emit("cancel");
};
</script>

<template>
  <UForm
    :state="addressFormState"
    :validate="validateAddressForm"
    class="space-y-4"
    @submit="submitAddressForm"
  >
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UFormField label="استان" name="province_id" required>
        <USelectMenu
          v-model="addressFormState.province_id"
          :items="provinceItems"
          value-key="value"
          :loading="provincesLoading"
          placeholder="انتخاب استان"
          @click="loadProvinces"
        />
      </UFormField>

      <UFormField label="شهر" name="city_id" required>
        <USelectMenu
          v-model="addressFormState.city_id"
          :items="cityItems"
          value-key="value"
          :loading="citiesLoading"
          :disabled="!addressFormState.province_id"
          placeholder="انتخاب شهر"
          @click="loadCities"
        />
      </UFormField>
    </div>

    <UFormField label="آدرس کامل" name="full_address" required>
      <UTextarea
        v-model="addressFormState.full_address"
        :rows="3"
        placeholder="آدرس کامل را وارد کنید"
      />
    </UFormField>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <UFormField label="پلاک" name="plate">
        <UInput v-model="addressFormState.plate" placeholder="مثال: ۱۲" />
      </UFormField>

      <UFormField label="واحد" name="unit">
        <UInput v-model="addressFormState.unit" placeholder="مثال: ۵" />
      </UFormField>

      <UFormField label="کدپستی" name="postal_code" required>
        <UInput v-model="addressFormState.postal_code" placeholder="کدپستی" />
      </UFormField>
    </div>

    <UCheckbox
      v-model="addressFormState.is_default"
      label="به عنوان آدرس پیش‌فرض ثبت شود"
    />

    <div class="flex items-center justify-end gap-3 pt-2">
      <UButton
        color="neutral"
        variant="ghost"
        :disabled="creatingAddress"
        @click="handleCancel"
      >
        انصراف
      </UButton>
      <UButton type="submit" color="primary" :loading="creatingAddress">
        ثبت آدرس
      </UButton>
    </div>
  </UForm>
</template>

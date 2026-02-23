<script setup lang="ts">
type Address = {
  id: number;
  province_name: string;
  city_name: string;
  full_address: string;
  postal_code: string;
};

const props = defineProps<{
  addressesLoading: boolean;
  addresses: Address[];
  selectedAddressId: number | null;
}>();

const emit = defineEmits<{
  "update:selectedAddressId": [value: number | null];
  "add-address": [];
}>();

const addressItems = computed(() =>
  props.addresses.map((addr) => ({
    value: addr.id,
    label: `${addr.province_name}، ${addr.city_name} - ${addr.full_address}`,
    description: `کدپستی: ${addr.postal_code}`,
  })),
);
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold">انتخاب آدرس</h2>
    </template>

    <template v-if="addressesLoading">
      <USkeleton class="w-full h-32 rounded-xl" />
    </template>

    <template v-else-if="addresses.length > 0">
      <div class="space-y-3">
        <URadioGroup
          :model-value="selectedAddressId"
          :items="addressItems"
          value-key="value"
          :ui="{
            fieldset: 'space-y-3',
          }"
          @update:model-value="emit('update:selectedAddressId', $event)"
        />

        <UButton variant="outline" color="primary" block @click="emit('add-address')">
          افزودن آدرس جدید
        </UButton>
      </div>
    </template>

    <template v-else>
      <UEmpty
        title="آدرسی ثبت نشده است"
        description="لطفا آدرس خود را اضافه کنید"
        icon="i-lucide-map-pin"
      >
        <template #actions>
          <UButton color="primary" @click="emit('add-address')">
            افزودن آدرس
          </UButton>
        </template>
      </UEmpty>
    </template>
  </UCard>
</template>

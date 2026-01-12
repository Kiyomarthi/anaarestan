<script setup lang="ts">
import { validate } from "~~/shared/validation";

///// imports /////

///// page meta /////

///// props/emits /////
defineProps<{
  items: { label: string; to: string; icon: string }[];
}>();

const value = defineModel<string>({ default: "" });

///// refs /////

///// composables/stores /////

///// computed /////

///// functions /////

function validateForm(state: FormState) {
  const errors: any[] = [];
  validate(value.value).required().min(4).max(100).pushError("value", errors);

  return errors;
}

///// watchers /////

///// lifecycle /////
</script>

<template>
  <div class="space-y-3">
    <div class="text-sm">همراه ما باشید.</div>
    <div class="flex items-center justify-center lg:justify-start gap-5">
      <UButton
        v-for="(item, index) in items"
        :key="index"
        :aria-label="item.label"
        :to="item?.to"
        variant="soft"
        color="gray"
        :icon="item?.icon"
        :ui="{
          leadingIcon: 'size-8',
        }"
      />
    </div>
    <div class="text-xs">
      با ثبت ایمیل، و یا شماره تلفن از جدید‌ترین تخفیف‌ها با‌خبر شوید
    </div>
    <UForm :validate="validateForm" v-slot="{ errors }">
      <div
        class="flex gap-2"
        :class="errors.length ? 'items-center' : 'items-end'"
      >
        <UFormField
          label="ایمیل یا شماره تلفن"
          name="value"
          :ui="{ root: 'flex-1' }"
        >
          <UInput v-model="value" />
        </UFormField>
        <UButton label="ارسال" :disabled="errors.length || !value?.length" />
      </div>
    </UForm>
  </div>
</template>

<script setup lang="ts">
import type { VariantGroup, Variant } from "~~/shared/utils/variant";
import {
  groupVariantsByAttribute,
  findVariantByAttributes,
} from "~~/shared/utils/variant";

///// imports /////

///// props/emits /////
const props = defineProps<{
  variants: Variant[];
  selectedVariantId?: number | null;
  mainVariantId?: number | null;
}>();

const emit = defineEmits<{
  "update:selectedVariantId": [id: number | null];
  "variant-change": [variant: Variant | null];
}>();

///// refs /////
const selectedAttributes = ref<Map<number, number>>(new Map());

///// composables/stores /////

///// computed /////
const variantGroups = computed<VariantGroup[]>(() => {
  return groupVariantsByAttribute(props.variants);
});

const selectedVariant = computed<Variant | null>(() => {
  if (selectedAttributes.value.size === 0) {
    // Return main variant or first variant
    if (props.mainVariantId) {
      return (
        props.variants.find((v) => v.id === props.mainVariantId) ||
        props.variants[0] ||
        null
      );
    }
    return props.variants[0] || null;
  }

  return findVariantByAttributes(props.variants, selectedAttributes.value);
});

const isVariantAvailable = (variant: Variant): boolean => {
  return variant.stock > 0 && variant.status === 1;
};

///// functions /////
const selectAttribute = (attributeId: number, valueId: number) => {
  const newMap = new Map<number, number>();

  newMap.set(attributeId, valueId);

  for (const [attrId, valId] of selectedAttributes.value.entries()) {
    if (attrId !== attributeId) {
      newMap.set(attrId, valId);
    }
  }

  selectedAttributes.value = newMap;

  const variant = findVariantByAttributes(props.variants, newMap);
  emit("update:selectedVariantId", variant?.id || null);
  emit("variant-change", variant);
};

const isAttributeSelected = (attributeId: number, valueId: number): boolean => {
  return selectedAttributes.value.get(attributeId) === valueId;
};

///// watchers /////
watch(
  () => props.selectedVariantId,
  (newId) => {
    if (newId) {
      const variant = props.variants.find((v) => v.id === newId);
      if (variant && variant.variant_attributes) {
        const newMap = new Map<number, number>();
        variant.variant_attributes.forEach((attr) => {
          newMap.set(attr.attribute_id, attr.id);
        });
        selectedAttributes.value = newMap;
      }
    }
  },
  { immediate: true },
);

watch(
  () => props.mainVariantId,
  (mainId) => {
    if (mainId && selectedAttributes.value.size === 0) {
      const variant = props.variants.find((v) => v.id === mainId);
      if (variant) {
        emit("update:selectedVariantId", variant.id);
        emit("variant-change", variant);
      }
    }
  },
  { immediate: true },
);

///// lifecycle /////
onMounted(() => {
  // Initialize with main variant or first variant
  if (props.mainVariantId) {
    const variant = props.variants.find((v) => v.id === props.mainVariantId);
    if (variant && variant.variant_attributes) {
      const newMap = new Map<number, number>();
      variant.variant_attributes.forEach((attr) => {
        newMap.set(attr.attribute_id, attr.id);
      });
      selectedAttributes.value = newMap;
      emit("update:selectedVariantId", variant.id);
      emit("variant-change", variant);
    }
  } else if (props.variants.length > 0) {
    const firstVariant = props.variants[0];
    if (firstVariant && firstVariant.variant_attributes) {
      const newMap = new Map<number, number>();
      firstVariant.variant_attributes.forEach((attr) => {
        newMap.set(attr.attribute_id, attr.id);
      });
      selectedAttributes.value = newMap;
      emit("update:selectedVariantId", firstVariant.id);
      emit("variant-change", firstVariant);
    }
  }
});
</script>

<template>
  <div class="space-y-4">
    <div
      v-for="group in variantGroups"
      :key="group.attribute_id"
      class="space-y-2"
    >
      <div class="flex items-center gap-2">
        <span class="font-medium text-gray-700">{{ group.name }}:</span>
        <span v-if="selectedVariant" class="text-sm text-gray-600">
          {{
            selectedVariant.variant_attributes.find(
              (a) => a.attribute_id === group.attribute_id,
            )?.value
          }}
        </span>
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton
          v-for="value in group.values"
          :key="value.attribute.id"
          variant="outline"
          :color="
            isAttributeSelected(group.attribute_id, value.attribute.id)
              ? 'primary'
              : 'gray'
          "
          :disabled="!isVariantAvailable(value.variant)"
          size="sm"
          :icon="
            isAttributeSelected(group.attribute_id, value.attribute.id)
              ? 'i-lucide-check'
              : undefined
          "
          @click="selectAttribute(group.attribute_id, value.attribute.id)"
        >
          {{ value.attribute.value }}
        </UButton>
      </div>
    </div>
  </div>
</template>

/**
 * Group variants by attribute_id
 * Groups variants into attribute groups where each group contains variants with the same attribute_id
 */

export interface VariantAttribute {
  id: number;
  attribute_id: number;
  name: string;
  value: string;
}

export interface Variant {
  id: number;
  product_id: number;
  sku: string;
  price: string;
  discount_price: string | null;
  stock: number;
  status: number;
  created_at: string;
  updated_at: string;
  variant_attributes: VariantAttribute[];
}

export interface VariantGroup {
  attribute_id: number;
  name: string;
  values: Array<{
    variant: Variant;
    attribute: VariantAttribute;
  }>;
}

/**
 * Groups variants by their attribute_id
 * @param variants Array of variants with variant_attributes
 * @returns Array of variant groups, each containing variants with the same attribute_id
 */
export function groupVariantsByAttribute(
  variants: Variant[],
): VariantGroup[] {
  if (!variants || variants.length === 0) {
    return [];
  }

  // Map to store groups by attribute_id
  const groupsMap = new Map<number, VariantGroup>();

  variants.forEach((variant) => {
    if (!variant.variant_attributes || variant.variant_attributes.length === 0) {
      return;
    }

    variant.variant_attributes.forEach((attr) => {
      const attrId = attr.attribute_id;

      if (!groupsMap.has(attrId)) {
        groupsMap.set(attrId, {
          attribute_id: attrId,
          name: attr.name,
          values: [],
        });
      }

      const group = groupsMap.get(attrId)!;
      // Check if this value already exists in the group
      const existingValue = group.values.find(
        (v) => v.attribute.id === attr.id,
      );

      if (!existingValue) {
        group.values.push({
          variant,
          attribute: attr,
        });
      }
    });
  });

  return Array.from(groupsMap.values());
}

/**
 * Find variant by selected attribute values
 * @param variants All variants
 * @param selectedAttributes Map of attribute_id to attribute_value_id
 * @returns Matching variant or null
 */
export function findVariantByAttributes(
  variants: Variant[],
  selectedAttributes: Map<number, number>,
): Variant | null {
  if (!variants || variants.length === 0) {
    return null;
  }

  if (selectedAttributes.size === 0) {
    return variants[0];
  }

  const found = variants.find((variant) => {
    if (!variant.variant_attributes || variant.variant_attributes.length === 0) {
      return false;
    }

    // Check if all selected attributes match this variant
    for (const [attrId, valueId] of selectedAttributes.entries()) {
      const hasMatchingAttr = variant.variant_attributes.some(
        (attr) => attr.attribute_id === attrId && attr.id === valueId,
      );

      if (!hasMatchingAttr) {
        return false;
      }
    }

    return true;
  });

  return found || null;
}


<script setup lang="ts">
interface ActivityItem {
  id: string | number;
  title: string;
  description?: string;
  icon?: string;
  time: string;
  type: "user" | "product" | "category" | "attribute" | "other";
  to?: string;
}

interface Props {
  items: ActivityItem[];
  title?: string;
  emptyMessage?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: "فعالیت‌های اخیر",
  emptyMessage: "هیچ فعالیتی ثبت نشده است",
});

const getTypeColor = (type: ActivityItem["type"]) => {
  const colors = {
    user: "primary",
    product: "success",
    category: "info",
    attribute: "warning",
    other: "neutral",
  };
  return colors[type] || "neutral";
};

const getTypeIcon = (type: ActivityItem["type"]) => {
  const icons = {
    user: "i-lucide-user",
    product: "i-lucide-package",
    category: "i-lucide-folder",
    attribute: "i-lucide-tag",
    other: "i-lucide-circle",
  };
  return icons[type] || "i-lucide-circle";
};

const router = useRouter();

const handleClick = (item: ActivityItem) => {
  if (item.to) {
    router.push(item.to);
  }
};
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-activity" class="text-lg text-primary-500" />
        <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
      </div>
    </template>

    <div v-if="items.length === 0" class="text-center py-8">
      <UIcon name="i-lucide-inbox" class="text-4xl text-gray-400 mb-2" />
      <p class="text-sm text-gray-500">{{ emptyMessage }}</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="item in items"
        :key="item.id"
        class="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
        @click="handleClick(item)"
      >
        <div
          class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
          :class="{
            'bg-primary-100': item.type === 'user',
            'bg-success-100': item.type === 'product',
            'bg-info-100': item.type === 'category',
            'bg-warning-100': item.type === 'attribute',
            'bg-gray-100': item.type === 'other',
          }"
        >
          <UIcon
            :name="item.icon || getTypeIcon(item.type)"
            :class="[
              'text-lg',
              {
                'text-primary-600': item.type === 'user',
                'text-success-600': item.type === 'product',
                'text-info-600': item.type === 'category',
                'text-warning-600': item.type === 'attribute',
                'text-gray-600': item.type === 'other',
              },
            ]"
          />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900">{{ item.title }}</p>
          <p
            v-if="item.description"
            class="text-xs text-gray-500 mt-1"
          >
            {{ item.description }}
          </p>
          <p class="text-xs text-gray-400 mt-1">{{ item.time }}</p>
        </div>
      </div>
    </div>
  </UCard>
</template>


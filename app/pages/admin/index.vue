<script setup lang="ts">
// @ts-nocheck
import { computed } from "vue";
import { useApiFetch } from "~/composables/useApiFetch";
import { formatNumber } from "~~/shared/utils/format";
import StatsCard from "~/components/widget/admin/stats-card.vue";
import QuickActions from "~/components/widget/admin/quick-actions.vue";
import RecentActivity from "~/components/widget/admin/recent-activity.vue";

definePageMeta({
  layout: "admin",
});

type StatsData = {
  users: {
    total: number;
    admins: number;
    regular: number;
    recent: number;
  };
  products: {
    total: number;
    available: number;
    unavailable: number;
    active: number;
    recent: number;
  };
  categories: {
    total: number;
    active: number;
  };
  attributes: {
    total: number;
  };
};

type StatsResponse = {
  success: boolean;
  data: StatsData;
};

const userStore = useUserStore();
const token = userStore.token;
const router = useRouter();
const toast = useToast();

const { data, pending, error, refresh } = useApiFetch<StatsResponse>(
  "/api/stats",
  {
    headers: {
      Authorization: token,
    },
  }
);

const stats = computed(() => data.value?.data);

const handleRefresh = async () => {
  await refresh();
  toast.add({ title: "آمار بروزرسانی شد", color: "success" });
};

// Quick actions configuration
const quickActions = [
  {
    label: "ایجاد کاربر",
    icon: "i-lucide-user-plus",
    to: "/admin/users/create",
    color: "primary" as const,
    description: "افزودن کاربر جدید",
  },
  {
    label: "ایجاد محصول",
    icon: "i-lucide-package-plus",
    to: "/admin/products/create",
    color: "success" as const,
    description: "افزودن محصول جدید",
  },
  {
    label: "ایجاد دسته‌بندی",
    icon: "i-lucide-folder-plus",
    to: "/admin/categories/create",
    color: "info" as const,
    description: "افزودن دسته‌بندی جدید",
  },
  {
    label: "ایجاد ویژگی",
    icon: "i-lucide-tag-plus",
    to: "/admin/attributes/create",
    color: "warning" as const,
    description: "افزودن ویژگی جدید",
  },
  {
    label: "مشاهده کاربران",
    icon: "i-lucide-users",
    to: "/admin/users",
    color: "primary" as const,
    description: "لیست تمام کاربران",
  },
  {
    label: "مشاهده محصولات",
    icon: "i-lucide-package",
    to: "/admin/products",
    color: "success" as const,
    description: "لیست تمام محصولات",
  },
];

// Recent activities - This would ideally come from an API
// For now, we'll create a placeholder based on stats
const recentActivities = computed(() => {
  const activities: any[] = [];

  if (stats.value?.users.recent > 0) {
    activities.push({
      id: "users-recent",
      title: `${stats.value.users.recent} کاربر جدید`,
      description: "در ۷ روز گذشته",
      icon: "i-lucide-user-plus",
      time: "۷ روز گذشته",
      type: "user" as const,
      to: "/admin/users",
    });
  }

  if (stats.value?.products.recent > 0) {
    activities.push({
      id: "products-recent",
      title: `${stats.value.products.recent} محصول جدید`,
      description: "در ۷ روز گذشته",
      icon: "i-lucide-package-plus",
      time: "۷ روز گذشته",
      type: "product" as const,
      to: "/admin/products",
    });
  }

  return activities;
});
</script>

<template>
  <div class="md:p-4">
    <UPage>
      <UPageHeader
        title="داشبورد"
        description="نمای کلی از تمام فرآیندها و آمار سیستم"
        :ui="{
          root: 'pt-0 pb-4',
        }"
      >
        <template #links>
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="outline"
            label="تازه سازی"
            :loading="pending"
            @click="handleRefresh"
          />
        </template>
      </UPageHeader>

      <UPageBody>
        <UAlert
          v-if="error"
          icon="i-lucide-alert-triangle"
          color="error"
          variant="subtle"
          :title="error?.statusMessage || 'خطا در دریافت آمار'"
          class="mb-4"
        />

        <!-- Statistics Cards -->
        <div
          v-if="stats"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          <StatsCard
            title="کل کاربران"
            :value="formatNumber(stats.users.total)"
            icon="i-lucide-users"
            color="primary"
            :to="'/admin/users'"
            :trend="{
              value: stats.users.recent,
              label: 'کاربر جدید',
              direction: 'up',
            }"
            description="شامل مدیران و کاربران عادی"
          />

          <StatsCard
            title="کل محصولات"
            :value="formatNumber(stats.products.total)"
            icon="i-lucide-package"
            color="success"
            :to="'/admin/products'"
            :trend="{
              value: stats.products.recent,
              label: 'محصول جدید',
              direction: 'up',
            }"
            :description="`${formatNumber(
              stats.products.available
            )} موجود، ${formatNumber(stats.products.unavailable)} ناموجود`"
          />

          <StatsCard
            title="دسته‌بندی‌ها"
            :value="formatNumber(stats.categories.total)"
            icon="i-lucide-folder"
            color="info"
            :to="'/admin/categories'"
            :description="`${formatNumber(stats.categories.active)} فعال`"
          />

          <StatsCard
            title="ویژگی‌ها"
            :value="formatNumber(stats.attributes.total)"
            icon="i-lucide-tag"
            color="warning"
            :to="'/admin/attributes'"
            description="ویژگی‌های تعریف شده"
          />
        </div>

        <!-- Detailed Statistics -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <!-- Users Details -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-users" class="text-lg text-primary-500" />
                <h3 class="text-lg font-semibold text-gray-900">
                  آمار کاربران
                </h3>
              </div>
            </template>
            <div v-if="stats" class="space-y-4">
              <div
                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-user-check" class="text-primary-500" />
                  <span class="text-sm text-gray-700">مدیران</span>
                </div>
                <span class="text-lg font-semibold text-gray-900">
                  {{ formatNumber(stats.users.admins) }}
                </span>
              </div>
              <div
                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-user" class="text-gray-500" />
                  <span class="text-sm text-gray-700">کاربران عادی</span>
                </div>
                <span class="text-lg font-semibold text-gray-900">
                  {{ formatNumber(stats.users.regular) }}
                </span>
              </div>
              <div
                class="flex items-center justify-between p-3 bg-success-50 rounded-lg"
              >
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-user-plus" class="text-success-500" />
                  <span class="text-sm text-success-700"
                    >کاربران جدید (۷ روز)</span
                  >
                </div>
                <span class="text-lg font-semibold text-success-900">
                  {{ formatNumber(stats.users.recent) }}
                </span>
              </div>
            </div>
          </UCard>

          <!-- Products Details -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-lucide-package"
                  class="text-lg text-success-500"
                />
                <h3 class="text-lg font-semibold text-gray-900">
                  آمار محصولات
                </h3>
              </div>
            </template>
            <div v-if="stats" class="space-y-4">
              <div
                class="flex items-center justify-between p-3 bg-success-50 rounded-lg"
              >
                <div class="flex items-center gap-2">
                  <UIcon
                    name="i-lucide-check-circle"
                    class="text-success-500"
                  />
                  <span class="text-sm text-success-700">موجود</span>
                </div>
                <span class="text-lg font-semibold text-success-900">
                  {{ formatNumber(stats.products.available) }}
                </span>
              </div>
              <div
                class="flex items-center justify-between p-3 bg-warning-50 rounded-lg"
              >
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-x-circle" class="text-warning-500" />
                  <span class="text-sm text-warning-700">ناموجود</span>
                </div>
                <span class="text-lg font-semibold text-warning-900">
                  {{ formatNumber(stats.products.unavailable) }}
                </span>
              </div>
              <div
                class="flex items-center justify-between p-3 bg-primary-50 rounded-lg"
              >
                <div class="flex items-center gap-2">
                  <UIcon
                    name="i-lucide-package-plus"
                    class="text-primary-500"
                  />
                  <span class="text-sm text-primary-700"
                    >محصولات جدید (۷ روز)</span
                  >
                </div>
                <span class="text-lg font-semibold text-primary-900">
                  {{ formatNumber(stats.products.recent) }}
                </span>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Quick Actions and Recent Activity -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QuickActions :actions="quickActions" />
          <RecentActivity
            :items="recentActivities"
            empty-message="هیچ فعالیت اخیری ثبت نشده است"
          />
        </div>
      </UPageBody>
    </UPage>
  </div>
</template>

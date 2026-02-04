<script setup lang="ts">
import { useBreakpoints } from "~/composables/utils/useBreakpoints";

///// imports /////

///// page meta /////
definePageMeta({
  noBottomNavigation: true,
});

///// props/emits /////

///// refs /////
const router = useRouter();
const route = useRoute();
const breadCrumbs = [
  {
    id: 47,
    page_id: 7,
    label: "فروشگاه انارستان",
    to: "/",
    position: 1,
    is_active: 1,
    created_at: "2026-01-16T08:55:40.000Z",
    updated_at: "2026-01-16T08:55:40.000Z",
  },
  {
    id: 48,
    page_id: 7,
    label: "غذا",
    to: "/products/list/16/خوردنی-متن",
    position: 2,
    is_active: 1,
    created_at: "2026-01-16T08:55:40.000Z",
    updated_at: "2026-01-16T08:55:40.000Z",
  },
];

///// composables/stores /////
const { fetch, loading, data } = useCacheFetch<ApiResponse<ProductRes>>();
const { lgAndUp } = useBreakpoints();

await fetch(`/api/products/${route?.params?.code}`, {
  headers: {
    cache: "true",
  },
});

// TODO: if code X not exsist if error api
if (data.value?.data?.slug !== route.params?.slug)
  await navigateTo(
    `/products/${data.value?.data?.code}/${data.value?.data?.slug}`,
    {
      redirectCode: 301,
      replace: true,
    },
  );

///// computed /////

///// functions /////
const share = async () => {
  if (navigator.share) {
    await navigator.share({
      title: document.title,
      url: window.location.href,
    });
  } else {
    navigator.clipboard.writeText(window.location.href);
    alert("اشتراک‌گذاری در این مرورگر پشتیبانی نمی‌شود | آدرس صفحه کپی شد");
  }
};

///// watchers /////
</script>

<template>
  <div>
    <UBreadcrumb
      v-if="breadCrumbs?.length"
      :items="breadCrumbs"
      class="pb-3 pt-3 lg:pt-1"
    />
    <div class="lg:flex lg:mt-5">
      <div class="flex-1">
        <div class="grid grid-cols-1 lg:grid-cols-5">
          <div class="col-span-2 -mx-4 lg:mx-0">
            <BaseCursorTooltip v-if="lgAndUp">
              <WidgetSliderProduct
                :items="data?.data?.gallery"
                class="max-h-100 lg:max-h-none"
              />
              <template #content>
                <span> برای مشاهده کلیک کنید </span>
              </template>
            </BaseCursorTooltip>
            <WidgetSliderProduct
              v-else
              no-timeline
              :items="20"
              class="max-h-100 lg:max-h-none"
            />
          </div>
          <div class="col-span-3">
            <h1 class="text-h1">
              {{ data?.data?.title }}
            </h1>
            <UButton icon="i-lucide-share-2" @click="share" />
          </div>
        </div>
        <div>نظرات</div>
      </div>
      <div>سبد خرید</div>
    </div>
  </div>
</template>

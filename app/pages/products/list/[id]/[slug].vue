<script setup lang="ts">
import { useBreakpoints } from "~/composables/utils/useBreakpoints";
import { useConfigSeo } from "~/composables/utils/useConfigSeo";
import type { ProductRes } from "~~/shared/types/api";

///// imports /////

///// page meta /////

///// props/emits /////

///// refs /////
const route = useRoute();

///// composables/stores /////
const { buildMeta, organizationSchema, websiteSchema, webpageSchema } =
  useConfigSeo();

const { lgAndUp } = useBreakpoints();

const { fetch, loading, data } = useCacheFetch<ApiResponse<PageResponse>>();

const {
  fetch: fetchCategory,
  loading: categoryLoading,
  data: categoryData,
} = useCacheFetch<ApiResponse<Category>>();

fetchCategory(`/api/categories/${route.params?.id}`, {
  headers: {
    cache: "true",
  },
});

const {
  fetch: fetchProduct,
  loading: productLoading,
  data: productData,
} = useCacheFetch<ApiResponse<ProductRes[]>>();

fetchProduct("/api/products", {
  params: {
    limit: "50",
    sort: "newest",
    category_id: route.params?.id,
  },
});

await fetch("/api/page/16", {
  headers: {
    cache: "true",
  },
});

buildMeta(data.value?.data as PageResponse);
organizationSchema();
websiteSchema();
webpageSchema(data.value?.data as PageResponse);
///// computed /////
const breadCrumbs = computed(() => {
  return data?.value?.data?.breadcrumbs?.map((item) => {
    return {
      label: item?.title,
      to: item?.target,
    };
  });
});

///// functions /////

///// watchers /////

///// lifecycle /////
</script>

<template>
  <div>
    <UBreadcrumb :items="breadCrumbs" class="py-5" />
    <h1 class="text-h1 mb-2">
      {{ data?.data?.page?.title }}
    </h1>
    <WidgetListCategory
      :items="categoryData?.data?.children"
      :loading="categoryLoading"
    >
      <template #desktop="{ item }">
        <WidgetCategoryCard
          :name="item?.name"
          :slug="item?.slug"
          :id="item?.id"
          image="/tmp/category.png"
          class="w-fit"
          label-class="h-10"
        />
      </template>
    </WidgetListCategory>
    <div class="lg:grid grid-cols-4 mt-6">
      <div class="col-span-1"></div>
      <div
        class="col-span-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        <WidgetProductCard
          v-for="(item, index) in productData?.data"
          :key="index"
          :product="item"
          :image-color="randomColor[index % randomColor.length]"
        />
      </div>
    </div>
  </div>
</template>

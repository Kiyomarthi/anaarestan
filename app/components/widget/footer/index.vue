<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import { useBreakpoints } from "~/composables/utils/useBreakpoints";
import { scrollToTop } from "~~/shared/utils/common";
import { footerContent } from "~~/shared/utils/constant";

const config = useRuntimeConfig();
const { lgAndUp } = useBreakpoints();
const toast = useToast();

const items: NavigationMenuItem[] = [
  {
    label: `با ${config.public.siteNameFa}`,
    children: [
      {
        label: `اتاق خبر ${config.public.siteNameFa}`,
        to: "/",
      },
      {
        label: `اتاق خبر ${config.public.siteNameFa}`,
        to: "/",
      },
      {
        label: `اتاق خبر ${config.public.siteNameFa}`,
        to: "/",
      },
      {
        label: `اتاق خبر ${config.public.siteNameFa}`,
        to: "/",
      },
    ],
  },

  {
    label: `با ${config.public.siteNameFa}`,
    children: [
      {
        label: `اتاق خبر ${config.public.siteNameFa}`,
        to: "/",
      },
      {
        label: `اتاق خبر ${config.public.siteNameFa}`,
        to: "/",
      },
      {
        label: `اتاق خبر ${config.public.siteNameFa}`,
        to: "/",
      },
      {
        label: `اتاق خبر ${config.public.siteNameFa}`,
        to: "/",
      },
    ],
  },
  {
    label: `با ${config.public.siteNameFa}`,
    children: [
      {
        label: `اتاق خبر ${config.public.siteNameFa}`,
        to: "/",
      },
      {
        label: `اتاق خبر ${config.public.siteNameFa}`,
        to: "/",
      },
      {
        label: `اتاق خبر ${config.public.siteNameFa}`,
        to: "/",
      },
      {
        label: `اتاق خبر ${config.public.siteNameFa}`,
        to: "/",
      },
    ],
  },
];

const social = [
  {
    label: "",
    icon: "i-lucide-instagram",
    to: "/",
  },
  {
    label: "",
    icon: "i-lucide-instagram",
    to: "/",
  },
  {
    label: "",
    icon: "i-lucide-instagram",
    to: "/",
  },
  {
    label: "",
    icon: "i-lucide-instagram",
    to: "/",
  },
];

const handleCopy = () => {
  copyText(config.public.phones?.mashhad);
  toast.add({
    title: "شماره تلفن کپی شد.",
    color: "info",
  });
};
</script>

<template>
  <footer>
    <div class="w-max mx-auto mb-2">
      <UButton
        label="رفتن به بالا"
        trailing-icon="i-lucide-chevron-up"
        variant="soft"
        color="neutral"
        :ui="{
          base: 'rounded-2xl',
        }"
        @click="() => scrollToTop()"
      />
    </div>
    <div class="flex items-center gap-2 font-bold text-primary mb-3">
      <BaseImage
        :src="config.public?.logo"
        :alt="`لوگوی ${config.public?.siteNameFa}`"
        sizes="50px"
        image-class="size-[50px]"
        width="50"
        height="50"
        class="w-max"
      />
      <div class="text-xl lg:text-2xl">
        {{ config.public?.siteNameFa }}
      </div>
    </div>
    <div v-if="lgAndUp" class="flex items-center lg:divide-x-2 lg:divide-gray">
      <UButton
        variant="ghost"
        icon="i-lucide-copy"
        class="pl-2"
        color="neutral"
        :ui="{
          base: 'rounded-none',
        }"
        @click="handleCopy"
      >
        تلفن پشتیبانی {{ config.public.phones?.mashhad }}
      </UButton>
      <div class="pr-2">۷ روز هفته، ۲۴ ساعته پاسخگوی شما هستیم</div>
    </div>
    <div v-else class="flex justify-between items-center">
      <div class="flex-1 flex items-center gap-2">
        <div
          class="bg-neutral-100 flex justify-center items-center p-3 w-fit rounded-full"
        >
          <UIcon name="i-lucide-headset" class="size-5 text-neutral" />
        </div>
        <div class="flex flex-col justify-between">
          <div class="text-gray-800 text-sm">تماس با پشتیبانی</div>
          <div class="text-xs font-light">
            ۷ روز هفته، ۲۴ ساعته پاسخگوی شما هستیم
          </div>
        </div>
      </div>
      <NuxtLink
        class="bg-neutral-100 flex justify-center items-center p-2 w-fit rounded-full text-xs"
        :to="`tel:${config.public?.phones?.mashhad}`"
      >
        تماس
      </NuxtLink>
    </div>

    <div v-if="lgAndUp" class="grid grid-cols-4 my-5">
      <widget-text-list
        v-for="(item, index) in items"
        :key="index"
        :title="item.label"
        :items="item.children"
        class="min-w-45 w-fit lg:max-w-122.5"
        :class="item.class"
      />
      <WidgetFooterSocial :items="social" />
    </div>

    <UNavigationMenu
      v-else
      collapse
      :items="items"
      orientation="vertical"
      color="default"
      type="single"
      variant="link"
      :ui="{
        root: 'my-4',
        childList: 'space-y-2',
        list: ' divide-y divide-neutral-400',
        item: 'py-2',
        linkLabel: 'text-sm lg:text-lg text-gray-600',
      }"
    />

    <WidgetFooterSocial v-if="!lgAndUp" :items="social" />

    <div
      class="flex flex-col-reverse lg:flex-row items-start gap-5 justify-between my-8"
    >
      <div class="flex-1">
        <WidgetTextMore
          :content="footerContent"
          :max-lines="3"
          class="grayscale! [&_h2]:text-gray! [&_h2]:mt-0! [&_h3]:text-gray! [&_h4]:text-gray! [&_p]:text-gray! [&_li]:text-gray!"
        />
      </div>
      <div
        class="flex items-center w-full lg:w-max justify-between sm:justify-center lg:justify-between gap-2"
      >
        <ClientOnly class="flex-1">
          <template #fallback>
            <NuxtLink
              to="/"
              class="p-1.5 lg:p-4 border border-neutral-200 rounded-md w-max block flex-1 max-w-30"
            >
              <BaseImage
                src="/tmp/enamad.png"
                alt="لوگوی اینماد"
                sizes="75px"
                :width="75"
                :height="75"
                class="lg:size-18.75"
              />
            </NuxtLink>
          </template>
          <a
            referrerpolicy="origin"
            target="_blank"
            href="https://trustseal.enamad.ir/?id=689420&Code=TYwmi73C2FCMfKGzrnyFyy4dZ35kJLZd"
            class="p-1.5 lg:p-4 border border-neutral-200 rounded-md w-max block aspect-square max-w-30"
            ><img
              referrerpolicy="origin"
              src="https://trustseal.enamad.ir/logo.aspx?id=689420&Code=TYwmi73C2FCMfKGzrnyFyy4dZ35kJLZd"
              alt="لوگوی اینماد"
              style="cursor: pointer"
              code="TYwmi73C2FCMfKGzrnyFyy4dZ35kJLZd"
              loading="lazy"
              fetchPriority="low"
              sizes="75px"
              :width="75"
              :height="75"
              class="w-full lg:size-18.75"
          /></a>
        </ClientOnly>

        <NuxtLink
          to="/"
          v-for="i in 3"
          :key="i"
          class="p-1.5 lg:p-4 border max-w-30 aspect-square border-neutral-200 rounded-md w-max block flex-1"
        >
          <BaseImage
            src="/tmp/enamad.png"
            alt="لوگوی اینماد"
            sizes="75px"
            :width="75"
            :height="75"
            class="lg:size-18.75"
          />
        </NuxtLink>
      </div>
    </div>

    <div class="space-y-2 mt-5">
      <p class="text-sm">
        برای استفاده از مطالب {{ config.public?.siteNameFa }}، داشتن «هدف
        غیرتجاری» و ذکر «منبع» کافیست. تمام حقوق اين وب‌سايت نیز برای شرکت
        {{ config.public?.siteNameFa }}
        است.
      </p>
      <p class="text-muted text-sm text-center">
        Copyright © {{ new Date().getFullYear() }}
      </p>
    </div>
  </footer>
</template>

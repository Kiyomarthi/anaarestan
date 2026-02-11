<script setup lang="ts">
import { twMerge } from "tailwind-merge";

interface Ui {
  base?: string;
  rounded?: string;
  container?: string;
}

const props = withDefaults(
  defineProps<{
    ui?: Ui;
    roundedClass?: string;
  }>(),
  {
    ui: () => ({
      rounded: "rounded-[30px]",
    }),

    roundedClass: "rounded-[30px]",
  },
);

const baseClassMerged = computed(() =>
  twMerge("z-3 p-1 w-full", props.roundedClass, props.ui?.base),
);
const containerClassMerged = computed(() =>
  twMerge(
    "flex flex-col gap-[25px] bg-white/50 justify-center overflow-hidden shadow-[0_0_1px_1px_#d3d3d3]",
    props.roundedClass,
    props.ui?.container,
  ),
);
</script>

<template>
  <div :class="containerClassMerged">
    <div
      class="flex font-semibold overflow-hidden text-black cursor-pointer transition-all duration-[400ms] ease-[cubic-bezier(0.175,0.885,0.32,2.2)]"
      :class="roundedClass"
    >
      <div
        class="absolute z-0 inset-0 backdrop-blur-[5px] [filter:url(#glass-distortion)] overflow-hidden isolate"
        :class="roundedClass"
      ></div>
      <div
        class="z-[1] absolute inset-0 bg-[rgba(255,255,255,0.25)]"
        :class="roundedClass"
      ></div>
      <div
        class="absolute inset-0 z-[2] overflow-hidden shadow-[inset_2px_2px_1px_0_rgba(255,255,255,0.5),inset_-1px_-1px_1px_1px_rgba(255,255,255,0.5)]"
        :class="roundedClass"
      ></div>
      <div :class="baseClassMerged">
        <slot />
      </div>
    </div>
  </div>

  <svg style="display: none">
    <filter
      id="glass-distortion"
      x="0%"
      y="0%"
      width="100%"
      height="100%"
      filterUnits="objectBoundingBox"
    >
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.001 0.01"
        numOctaves="1"
        seed="3"
        result="turbulence"
      />
      <feComponentTransfer in="turbulence" result="mapped">
        <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
        <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
        <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
      </feComponentTransfer>
      <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
      <feSpecularLighting
        in="softMap"
        surfaceScale="5"
        specularConstant="1"
        specularExponent="100"
        lighting-color="white"
        result="specLight"
      >
        <fePointLight x="-200" y="-200" z="300" />
      </feSpecularLighting>
      <feComposite
        in="specLight"
        operator="arithmetic"
        k1="0"
        k2="1"
        k3="1"
        k4="0"
        result="litImage"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="softMap"
        scale="80"
        xChannelSelector="R"
        yChannelSelector="G"
      />
    </filter>
  </svg>
</template>

import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRequestHeaders } from "#app";

export function useBreakpoints() {
  const breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536,
  };

  const width = ref<number>(0);
  const current = ref<"xs" | "sm" | "md" | "lg" | "xl" | "2xl">("md");

  if (import.meta.client) {
    if (width.value === 0) width.value = window.innerWidth;

    const updateWidth = () => {
      width.value = window.innerWidth;
      updateCurrent();
    };

    const updateCurrent = () => {
      if (width.value < breakpoints.sm) current.value = "xs";
      else if (width.value < breakpoints.md) current.value = "sm";
      else if (width.value < breakpoints.lg) current.value = "md";
      else if (width.value < breakpoints.xl) current.value = "lg";
      else if (width.value < breakpoints["2xl"]) current.value = "xl";
      else current.value = "2xl";
    };

    onMounted(() => {
      updateCurrent();
      window.addEventListener("resize", updateWidth, { passive: true });
    });

    onBeforeUnmount(() => {
      window.removeEventListener("resize", updateWidth);
    });
  }

  if (import.meta.server) {
    const headers = useRequestHeaders(["user-agent"]);
    const ua = headers["user-agent"] || "";

    const isMobile = /Mobi|Android|iPhone|iPod/i.test(ua);
    const isTablet = /Tablet|iPad/i.test(ua);

    if (isMobile) {
      width.value = 480;
      current.value = "xs";
    } else if (isTablet) {
      width.value = 768;
      current.value = "md";
    } else {
      width.value = 1366;
      current.value = "lg";
    }
  }

  const smAndDown = computed(() => width.value < breakpoints.md);
  const smAndUp = computed(() => width.value >= breakpoints.sm);
  const mdAndDown = computed(() => width.value < breakpoints.lg);
  const mdAndUp = computed(() => width.value >= breakpoints.md);
  const lgAndDown = computed(() => width.value < breakpoints.xl);
  const lgAndUp = computed(() => width.value >= breakpoints.lg);
  const xlAndDown = computed(() => width.value < breakpoints["2xl"]);
  const xlAndUp = computed(() => width.value >= breakpoints.xl);
  const xxlAndUp = computed(() => width.value >= breakpoints["2xl"]);

  return {
    width,
    current,
    smAndDown,
    smAndUp,
    mdAndDown,
    mdAndUp,
    lgAndDown,
    lgAndUp,
    xlAndDown,
    xlAndUp,
    xxlAndUp,
  };
}

import { useBreakpoints } from "~/composables/utils/useBreakpoints";

export default defineNuxtRouteMiddleware(() => {
  const { mdAndDown } = useBreakpoints();

  if (!mdAndDown.value) {
    return navigateTo("/");
  }
});

export const useHideScroll = (threshold = 0) => {
  const hidden = ref(false);
  const scrollY = ref(0);
  let lastScroll = 0;

  const handleScroll = () => {
    const currentScroll = window.pageYOffset;
    scrollY.value = currentScroll;

    if (
      currentScroll > lastScroll &&
      currentScroll - lastScroll > threshold &&
      currentScroll > 50
    ) {
      hidden.value = true;
    } else if (
      currentScroll < lastScroll &&
      lastScroll - currentScroll > threshold
    ) {
      hidden.value = false;
    }

    lastScroll = currentScroll;
  };

  onMounted(() => {
    window.addEventListener("scroll", handleScroll);
  });

  onUnmounted(() => {
    window.removeEventListener("scroll", handleScroll);
  });

  return { hidden, scrollY };
};

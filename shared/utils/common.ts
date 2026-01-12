export const scrollToTop = (behavior: ScrollBehavior = "smooth"): void => {
  if (!window) return;
  window?.scrollTo({
    top: 0,
    behavior,
  });
};

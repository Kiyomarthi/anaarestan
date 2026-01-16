export const scrollToTop = (behavior: ScrollBehavior = "smooth"): void => {
  if (!window) return;
  window?.scrollTo({
    top: 0,
    behavior,
  });
};

export const debounce = (fn: () => {}, delay: number) => {
  let timeoutId: unknown;

  return (...args: unknown[]) => {
    clearTimeout(timeoutId as number);
    timeoutId = setTimeout(() => fn.apply(null, args), delay);
  };
};

export const copyText = (text: string) => {
  navigator.clipboard.writeText(text);
};

export interface ScrollToIdParams {
  offset?: number;
  behavior?: ScrollBehavior;
}

export const scrollToId = (
  elementId: string,
  params?: ScrollToIdParams,
): void => {
  const { offset = 100, behavior = "smooth" } = params || {};
  const element: HTMLElement | null = document.getElementById(elementId);

  if (!element) return;

  const elementPosition: number =
    element.getBoundingClientRect().top + window.scrollY - offset;

  window.scrollTo({
    top: elementPosition,
    behavior,
  });
};

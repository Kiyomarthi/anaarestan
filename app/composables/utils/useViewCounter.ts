import { ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue";

export function useViewCounter<T = any>(
  { current = 1, max = null }: { current?: number; max?: number | null },
  options?: IntersectionObserverInit,
  fn?: () => void | Promise<void>
) {
  const target = ref<HTMLElement | null>(null);
  const count = ref<number>(current ?? 1);
  const items = ref<T | unknown[]>([]);
  let isProcessing = false;

  let observer: IntersectionObserver | null = null;

  const load = async () => {
    if (!fn) return;
    const res: ApiResponse<T> = await fn();
    items.value = [...items.value, ...res?.data];
  };

  const setupObserver = async () => {
    // Disconnect existing observer
    if (observer) {
      observer.disconnect();
      observer = null;
    }

    // Wait for next tick to ensure element is in DOM
    await nextTick();

    if (!target.value) return;

    observer = new IntersectionObserver((entries) => {
      entries.forEach(async (entry) => {
        if (entry.isIntersecting && !isProcessing) {
          if (toValue(max) && toValue(max) <= count.value) {
            observer?.disconnect();
            return;
          }
          isProcessing = true;
          count.value++;
          await load();

          // Re-observe after a short delay to prevent multiple triggers
          setTimeout(() => {
            isProcessing = false;
            if (target.value && observer) {
              observer.observe(target.value);
            }
          }, 100);
        }
      });
    }, options);

    observer.observe(target.value);
  };

  // Watch for target changes to handle dynamic elements
  watch(target, async (newTarget, oldTarget) => {
    if (newTarget && newTarget !== oldTarget) {
      await setupObserver();
    }
  });

  onMounted(async () => {
    await setupObserver();
  });

  onBeforeUnmount(() => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  });

  return {
    target,
    count,
    load,
    items,
  };
}

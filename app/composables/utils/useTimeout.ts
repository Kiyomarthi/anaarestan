import { onBeforeUnmount, ref } from "vue";

export function useTimeout() {
  const timeoutId = ref<ReturnType<typeof setTimeout> | null>(null);
  let stopped = false;

  const start = (cb: () => void, delay = 0, repeat = false) => {
    clear();
    stopped = false;

    const run = () => {
      timeoutId.value = setTimeout(() => {
        cb();
        if (repeat && !stopped) {
          run();
        } else {
          timeoutId.value = null;
        }
      }, delay);
    };

    run();
  };

  const clear = () => {
    stopped = true;
    if (timeoutId.value) {
      clearTimeout(timeoutId.value);
      timeoutId.value = null;
    }
  };

  onBeforeUnmount(clear);

  return {
    start,
    clear,
  };
}

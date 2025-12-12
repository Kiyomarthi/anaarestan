export function useClickOutside(ref, fn, model = null) {
  function handleClickOutside(event) {
    if (!ref.value) return;
    if (!ref.value.contains(event.target)) {
      if (model) model.value = false;
      if (typeof fn === "function") fn(event);
    }
  }

  onMounted(() => {
    document.addEventListener("click", handleClickOutside);
  });

  onUnmounted(() => {
    document.removeEventListener("click", handleClickOutside);
  });
}

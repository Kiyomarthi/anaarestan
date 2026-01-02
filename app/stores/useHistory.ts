export const useHistoryStore = defineStore(
  "history",
  () => {
    const searches = ref<string[]>([]);

    function addSearch(query: string) {
      const q = query.trim();
      if (!q) return;

      searches.value = searches.value.filter((s) => s !== q);

      searches.value.unshift(q);

      if (searches.value.length > 10) {
        searches.value.pop();
      }
    }

    return {
      searches,
      addSearch,
    };
  },
  {
    persist: {
      key: "history",
      storage: "local",
      paths: ["searches"],
    },
  }
);

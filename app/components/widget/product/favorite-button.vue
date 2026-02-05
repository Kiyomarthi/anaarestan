<script setup lang="ts">
///// imports /////

///// props/emits /////
const props = defineProps<{
  productId: number;
  isFavorite?: boolean;
}>();

const emit = defineEmits<{
  "update:isFavorite": [value: boolean];
}>();

///// refs /////
const loading = ref(false);
const isFavorite = ref(props.isFavorite || false);

///// composables/stores /////
const userStore = useUserStore();
const { fetch } = useApiRequest();

///// computed /////

///// functions /////
const toggleFavorite = async () => {
  if (!userStore.isLoggedIn) {
    // Redirect to login or show modal
    navigateTo("/login");
    return;
  }

  loading.value = true;
  try {
    if (isFavorite.value) {
      // Remove from favorites - need to find favorite ID first
      const favoritesRes = await $fetch<{ success: boolean; data: any[] }>(
        "/api/favorites",
        {
          headers: userStore.token
            ? { Authorization: `Bearer ${userStore.token}` }
            : {},
          params: {
            product_id: props.productId.toString(),
          },
        },
      );

      if (favoritesRes.data && favoritesRes.data.length > 0) {
        await fetch(`/api/favorites/${favoritesRes.data[0].id}`, {
          method: "DELETE",
        });
        isFavorite.value = false;
        emit("update:isFavorite", false);
      }
    } else {
      // Add to favorites
      await fetch("/api/favorites", {
        method: "POST",
        body: {
          product_id: props.productId,
        },
      });
      isFavorite.value = true;
      emit("update:isFavorite", true);
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
  } finally {
    loading.value = false;
  }
};

///// watchers /////
watch(
  () => props.isFavorite,
  (val) => {
    isFavorite.value = val || false;
  },
  { immediate: true },
);

///// lifecycle /////
</script>

<template>
  <UButton
    :loading="loading"
    variant="ghost"
    :color="isFavorite ? 'primary' : 'gray'"
    :icon="isFavorite ? 'i-ph-heart-fill' : 'i-ph-heart'"
    @click="toggleFavorite"
  />
</template>

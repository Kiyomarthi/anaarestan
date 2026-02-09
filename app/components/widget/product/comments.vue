<script setup lang="ts">
///// imports /////

///// props/emits /////
const props = defineProps<{
  productId: number;
  commentsCount?: number;
}>();

///// refs /////
const comments = ref<any[]>([]);
const loading = ref(false);
const submitting = ref(false);
const showCommentForm = ref(false);
const commentForm = reactive({
  rating: 5,
  comment: "",
});

const { fetch: apiFetch } = useApiRequest();
const userStore = useUserStore();

///// composables/stores /////

///// computed /////

///// functions /////
const loadComments = async () => {
  loading.value = true;
  try {
    const response = await $fetch<{
      success: boolean;
      data: any[];
      meta?: any;
    }>(`/api/comments`, {
      params: {
        product_id: props.productId,
        status: "approved",
        limit: 10,
      },
    });

    if (response.success) {
      comments.value = response.data || [];
    }
  } catch (error) {
    console.error("Error loading comments:", error);
  } finally {
    loading.value = false;
  }
};

const submitComment = async () => {
  if (!userStore.isLoggedIn()) {
    navigateTo("/login");
    return;
  }

  submitting.value = true;
  try {
    await apiFetch("/api/comments", {
      method: "POST",
      body: {
        product_id: props.productId,
        rating: commentForm.rating,
        comment: commentForm.comment || null,
      },
    });

    commentForm.rating = 5;
    commentForm.comment = "";
    showCommentForm.value = false;
    await loadComments();
  } catch (error) {
    console.error("Error submitting comment:", error);
  } finally {
    submitting.value = false;
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("fa-IR");
};

///// watchers /////

///// lifecycle /////
onMounted(() => {
  loadComments();
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold text-gray-900">
        نظرات و امتیازات
        <span
          v-if="commentsCount"
          class="text-sm font-normal text-gray-500"
        >
          ({{ commentsCount }})
        </span>
      </h2>
      <UButton
        v-if="userStore.isLoggedIn() && !showCommentForm"
        variant="outline"
        label="ثبت نظر"
        @click="showCommentForm = true"
      />
    </div>

    <!-- Comment Form -->
    <div
      v-if="showCommentForm"
      class="border border-gray-200 rounded-lg p-4 space-y-4"
    >
      <div class="flex items-center justify-between">
        <h3 class="font-medium">ثبت نظر جدید</h3>
        <UButton
          variant="ghost"
          icon="i-lucide-x"
          size="sm"
          @click="showCommentForm = false"
        />
      </div>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">امتیاز</label>
          <div class="flex gap-1">
            <UButton
              v-for="i in 5"
              :key="i"
              :variant="commentForm.rating >= i ? 'solid' : 'outline'"
              :color="commentForm.rating >= i ? 'yellow' : 'gray'"
              size="sm"
              icon="i-lucide-star"
              @click="commentForm.rating = i"
            />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">نظر شما</label>
          <UTextarea
            v-model="commentForm.comment"
            placeholder="نظر خود را بنویسید..."
            rows="4"
          />
        </div>
        <div class="flex gap-2">
          <UButton
            :loading="submitting"
            label="ثبت نظر"
            @click="submitComment"
          />
          <UButton
            variant="ghost"
            label="انصراف"
            @click="showCommentForm = false"
          />
        </div>
      </div>
    </div>

    <!-- Comments List -->
    <div
      v-if="loading"
      class="flex justify-center py-8"
    >
      <BaseLoader variant="spinner" />
    </div>
    <div
      v-else-if="comments.length === 0"
      class="text-center py-8 text-gray-500"
    >
      هنوز نظری ثبت نشده است
    </div>
    <div
      v-else
      class="space-y-4"
    >
      <div
        v-for="comment in comments"
        :key="comment.id"
        class="border-b border-gray-200 pb-4 last:border-b-0"
      >
        <div class="flex items-start gap-3">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <span class="font-medium">{{ comment.user_full_name || "کاربر" }}</span>
              <div class="flex items-center gap-1">
                <UIcon
                  v-for="i in 5"
                  :key="i"
                  name="i-lucide-star"
                  :class="i <= comment.rating ? 'text-yellow-500' : 'text-gray-300'"
                  class="size-4"
                />
              </div>
              <span class="text-xs text-gray-500">{{ formatDate(comment.created_at) }}</span>
            </div>
            <p
              v-if="comment.comment"
              class="text-gray-700"
            >
              {{ comment.comment }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


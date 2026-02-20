<script setup lang="ts">
import { useTimeout } from "~/composables/utils/useTimeout";

///// imports /////

///// props/emits /////
const props = defineProps<{
  productId: number;
  commentsCount?: number;
}>();

///// refs /////
const comments = ref<any[]>([]);
const page = ref(1);
const perPage = ref(10);
const commentsMeta = ref<{
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
} | null>(null);
const submitting = ref(false);
const showCommentForm = ref(false);
const commentForm = reactive({
  rating: 5,
  comment: "",
});

const { fetch: apiFetch } = useApiRequest();
const userStore = useUserStore();

///// composables/stores /////
const { start } = useTimeout();
const {
  fetch: fetchComments,
  loading,
  data: commentsResponse,
} = useCacheFetch<{
  success: boolean;
  data: any[];
  meta?: any;
}>();

///// computed /////

///// functions /////
const loadComments = async () => {
  await fetchComments(`/api/comments`, {
    params: {
      product_id: props.productId,
      status: "approved",
      page: page.value,
      perPage: perPage.value,
    },
  });

  if (commentsResponse.value?.success) {
    comments.value = commentsResponse.value.data || [];
    commentsMeta.value = commentsResponse.value.meta || null;
    return;
  }

  comments.value = [];
  commentsMeta.value = null;
};

const submitComment = async () => {
  if (!userStore.isLoggedIn) {
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

const handleShowCommentForm = () => {
  if (!userStore.isLoggedIn) {
    userStore.modal = true;
    userStore.alert = "برای ثبت نظر ابتدا وارد حساب کاربری خود شود.";
    userStore.doAfterLogin = async () => {
      showCommentForm.value = true;
      start(() => {
        scrollToId("comments");
      }, 200);
    };

    return;
  }

  showCommentForm.value = true;
};

///// watchers /////
watch(
  () => props.productId,
  () => {
    if (page.value !== 1) {
      page.value = 1;
      return;
    }
    loadComments();
  }
);

watch([page, perPage], () => {
  loadComments();
});

///// lifecycle /////
loadComments();
</script>

<template>
  <div id="comments" class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="text-xl font-bold text-gray-900">
        نظرات و امتیازات
        <span v-if="commentsCount" class="text-sm font-normal text-gray-500">
          ({{ commentsCount }})
        </span>
      </div>
      <UButton
        v-if="!showCommentForm"
        variant="outline"
        label="ثبت نظر"
        @click="handleShowCommentForm"
      />
    </div>

    <!-- Comment Form -->
    <div
      v-if="showCommentForm"
      class="border border-gray-200 rounded-lg p-4 space-y-4"
    >
      <div class="flex items-center justify-between">
        <div class="font-bold text-lg">ثبت نظر جدید</div>
        <UButton
          variant="ghost"
          icon="i-lucide-x"
          size="sm"
          @click="showCommentForm = false"
        />
      </div>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2"
            >امتیاز: {{ commentForm.rating }}</label
          >
          <div class="flex gap-1">
            <UButton
              v-for="i in 5"
              :key="i"
              variant="link"
              :color="commentForm.rating >= i ? 'yellow' : 'gray'"
              size="lg"
              :icon="commentForm.rating >= i ? 'i-ph-star-fill' : 'i-ph-star'"
              :ui="{
                leadingIcon: [
                  commentForm.rating >= i ? 'text-yellow-500' : 'text-gray-500',
                  'size-7',
                ],
                base: 'p-1',
              }"
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
        <div class="flex gap-2 justify-end">
          <UButton
            variant="ghost"
            label="انصراف"
            @click="showCommentForm = false"
          />
          <UButton
            :loading="submitting"
            label="ثبت نظر"
            @click="submitComment"
          />
        </div>
      </div>
    </div>

    <!-- Comments List -->
    <div v-if="loading" class="flex justify-center py-8">
      <BaseLoader variant="spinner" />
    </div>
    <div
      v-else-if="comments.length === 0"
      class="text-center py-8 text-gray-500"
    >
      هنوز نظری ثبت نشده است
    </div>
    <div v-else class="space-y-4">
      <div
        v-for="comment in comments"
        :key="comment.id"
        class="border-b border-gray-200 pb-4 last:border-b-0"
      >
        <div class="flex items-start gap-3">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <span class="font-medium">{{
                comment.user_full_name || "کاربر"
              }}</span>
              <div class="flex items-center gap-1">
                <UIcon
                  v-for="i in 5"
                  :key="i"
                  :name="i <= comment.rating ? 'i-ph-star-fill' : 'i-ph-star'"
                  :class="
                    i <= comment.rating ? 'text-yellow-500' : 'text-gray-300'
                  "
                  class="size-4"
                />
              </div>
              <span class="text-xs text-gray-500">{{
                formatDate(comment.created_at)
              }}</span>
            </div>
            <p v-if="comment.comment" class="text-gray-700">
              {{ comment.comment }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="commentsMeta?.total && commentsMeta.total > 0"
      class="mt-6 flex items-center justify-center"
    >
      <UPagination
        v-model:page="page"
        :items-per-page="perPage"
        :total="commentsMeta.total"
        :disabled="loading"
      />
    </div>
  </div>
</template>

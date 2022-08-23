<template>
  <div class="post-container">
    <div class="title">
      <h1>
        {{ post.title }}
      </h1>
      <div class="author">
        <account-profile-image-button class="author-profile-image" :simple-account="post.author" />
        <div class="author-name">
          {{ post.author?.name }}
        </div>
        <div class="created-at">
          {{ longCreateAt }}
          <span class="modify-actions" v-if="isMyPost">
            <a @click="modifyPost">수정</a>
            <span>&#183;</span>
            <a @click="deletePost">삭제</a>
          </span>
        </div>
      </div>
    </div>
    <div class="content">
      <post-viewer :content="post.content" />
    </div>
    <div v-if="isLoggedIn" class="write-comment">
      댓글 남기기
      <textarea v-model="newComment" placeholder="댓글 내용을 입력하세요." />
      <button :disabled="!isValidNewComment" @click="writeComment">댓글 작성</button>
    </div>
    <div class="comments">
      <div class="counts">
        <span>{{ post?.comments?.length ?? 0 }} 개의 댓글</span>
        <span>&#183;</span>
        <span>{{ likeCount }} 개의 좋아요</span>
        <div v-if="isLoggedIn">
          <button v-if="!this.isLike" @click="likePost">좋아요 하기</button>
          <button v-else @click="unlikePost">좋아요 취소</button>
        </div>
      </div>

      <div class="empty-comment-message" v-if="post?.comments?.length == 0">
        댓글이 없습니다.
      </div>
      <simple-comment-item
          v-for="comment in comments" :key="comment.id"
          :simple-comment="comment"
          @deleted="commentDeleted" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { PostDto, SimpleCommentDto } from "@/api/models/blog.dtos";
import { createComment, deletePost, getPost, isLikePost, likePost, unlikePost } from '@/api/blog';
import { HttpApiError } from "@/api/common/httpApiClient";
import AccountProfileImageButton from '@/components/accounts/AccountProfileImageButton.vue';
import store from "@/store";
import SimpleCommentItem from "@/components/comments/SimpleCommentItem.vue";
import PostViewer from '@/components/posts/PostViewer.vue';

export default defineComponent({
  name: 'PostView',
  components: { PostViewer, SimpleCommentItem, AccountProfileImageButton },
  props: {
    blogId: {
      type: String,
      required: true,
    },
    postUrl: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      post: {} as PostDto,
      comments: {} as Array<SimpleCommentDto>,
      likeCount: 0,
      isLike: false,
      newComment: '',
    };
  },
  computed: {
    longCreateAt() {
      if(!this.post?.createdAt) {
        return null;
      }
      const date = new Date(this.post.createdAt);
      const hours = `${date.getHours()}`.padStart(2, '0');
      const minutes = `${date.getMinutes()}`.padStart(2, '0');
      return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}. ${hours}:${minutes}`;
    },
    isMyPost() {
      return this.post?.blogId === store.state.accountStore.blogId;
    },
    isLoggedIn(): boolean {
      return store.getters['accountStore/isLoggedIn'] ?? false;
    },
    isValidNewComment() {
      return this.newComment.length > 0;
    },
  },
  watch: {
    postUrl() {
      this.loadPost();
    }
  },
  methods: {
    async loadPost() {
      if (!this.blogId || !this.postUrl)
        return;

      await getPost(this.blogId, this.postUrl)
      .then((post) => {
        this.post = post;
        this.likeCount = post.likeCount;
        this.comments = post.comments;
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
        this.$router.push(`/main`);
      });

      if(this.isLoggedIn) {
        await isLikePost(this.blogId, this.postUrl)
        .then((isLike) => {
          this.isLike = isLike;
        })
        .catch((error: HttpApiError) => {
          alert(error.getErrorMessage());
          this.$router.push(`/main`);
        });
      }
    },
    async writeComment() {
      await createComment(this.blogId, this.postUrl, {
        content: this.newComment,
      })
      .then((comment) => {
        this.newComment = '';
        this.comments.push(Object.assign(comment, {
          childrenCount: comment.children.length
        }));
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      });
    },
    commentDeleted(commentId: string) {
      this.comments = this.comments.filter((x) => x.id !== commentId);
    },
    async likePost() {
      await likePost(this.blogId, this.postUrl)
      .then(async () => {
        this.likeCount++;
        this.isLike = true;
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      });
    },
    async unlikePost() {
      await unlikePost(this.blogId, this.postUrl)
      .then(async () => {
        this.likeCount--;
        this.isLike = false;
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      });
    },
    async modifyPost() {
      this.$router.push(`/write?post=${this.postUrl}`);
    },
    async deletePost() {
      if(confirm('게시글을 삭제하시겠습니까?') != true) {
        return;
      }

      await deletePost(this.postUrl)
      .then(() => {
        alert("게시글을 삭제했습니다.");
        this.$router.push(`/main`);
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      });
    },
  },
  created() {
    this.loadPost();
  }
});
</script>

<style scoped>

.post-container {
  display: grid;

  grid-template-columns: 750px;
  grid-auto-rows: auto;

  justify-content: center;

  padding: var(--base-gap);
  box-sizing: border-box;
}

@media (max-width: 800px) {
  .post-container {
    grid-template-columns: minmax(0, auto);
    justify-content: stretch;
  }
}

.title {
  border-bottom: 6px double var(--border-color);
  padding-bottom: 1em;
}

.author {
  display: grid;

  grid-template-columns: auto auto 1fr;
  grid-template-rows: auto auto;

  margin-top: 2em;
}

.author-profile-image {
  width: 50px;
  height: 50px;

  justify-self: center;

  grid-column: 1 / span 1;
  grid-row: 1 / span 2;

  margin-right: 0.5em;
}

.author-name {
  align-self: end;

  grid-column: 2 / span 1;
  grid-row: 1 / span 1;

  font-size: 0.75em;
  font-weight: 300;
}

.created-at {
  align-self: start;

  grid-column: 2 / span 1;
  grid-row: 2 / span 1;

  font-size: 0.75em;
  font-weight: 300;
}

.modify-actions {
  padding-left: 5px;
}

.modify-actions a {
  color: var(--base-color);
  margin: 0 3px;
}

.content {
  border-bottom: 6px double var(--border-color);
  padding: 2em 0;
  min-height: 400px;
}

.write-comment {
  padding: 1em 0;
  display: grid;

  grid-auto-rows: auto;
  grid-row-gap: 0.5em;
}

.write-comment textarea {
  font-size: 14px;
  padding: 12px;
  width: 100%;
  box-sizing: border-box;
  border-radius: var(--base-border-radius);
  border: 1px solid var(--border-color);
  resize: none;
  outline: none;
}

.write-comment button {
  justify-self: end;
}

.comments {
  padding: 2em 0;
  display: grid;
  grid-auto-rows: auto;
}

.comments .counts {
  display: grid;

  grid-template-columns: auto auto auto 1fr;
  grid-template-rows: auto;

  grid-column-gap: 10px;
  align-items: center;

  min-height: 40px;
}

.counts button {
  justify-self: start;
  margin-right: 10px;
}

.comments .empty-comment-message {
  padding: 4em 0;
  justify-self: center;
}

</style>
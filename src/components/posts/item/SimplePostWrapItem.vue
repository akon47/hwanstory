<template>
  <article class="post-card">
    <router-link class="thumb" :to="postPath" tabindex="-1" aria-hidden="true">
      <div class="thumb-image" :style="thumbnail">
        <span v-if="!simplePost?.thumbnailImageUrl" class="thumb-title">{{ simplePost?.title }}</span>
      </div>
      <span v-if="openTypeLabel" class="badge badge-warning open-type">{{ openTypeLabel }}</span>
    </router-link>
    <div class="body">
      <h3 class="title">
        <router-link :to="postPath">{{ simplePost?.title }}</router-link>
      </h3>
      <p class="summary">{{ simplePost?.summary }}</p>
    </div>
    <div class="foot">
      <router-link class="author" :to="`/${simplePost?.author?.blogId}`">
        <account-profile-image class="author-avatar" :simple-account="simplePost?.author"/>
        <span class="author-name">{{ simplePost?.author?.name }}</span>
      </router-link>
      <span class="dot" aria-hidden="true">·</span>
      <time class="date" :datetime="isoDate" :title="fullDate">{{ relativeDate }}</time>
      <span class="stats">
        <post-viewer-count :post-id="simplePost?.id"/>
        <span class="stat" :title="`좋아요 ${simplePost?.likeCount}`">
          <app-icon name="heart" :size="14"/>{{ simplePost?.likeCount }}
        </span>
        <span class="stat" :title="`댓글 ${simplePost?.commentCount}`">
          <app-icon name="comment" :size="14"/>{{ simplePost?.commentCount }}
        </span>
      </span>
    </div>
  </article>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { SimplePostDto } from '@/api/models/blog.dtos';
import AccountProfileImage from '@/components/accounts/AccountProfileImage.vue';
import PostViewerCount from '@/components/posts/PostViewerCount.vue';
import AppIcon from '@/components/common/AppIcon.vue';
import { formatDateTime, formatRelativeDate } from '@/utils/format';
import { thumbnailStyle } from '@/utils/thumbnail';

const OPEN_TYPE_LABELS: Record<string, string> = {
  PRIVATE: '비공개',
  DRAFT: '임시저장',
  SCHEDULED: '예약 발행',
};

export default defineComponent({
  name: 'SimplePostWrapItem',
  components: { AppIcon, AccountProfileImage, PostViewerCount },
  props: {
    simplePost: Object as PropType<SimplePostDto>,
  },
  computed: {
    postPath(): string {
      return `/${this.simplePost?.author?.blogId}/posts/${this.simplePost?.postUrl}`;
    },
    relativeDate(): string {
      return formatRelativeDate(this.simplePost?.createdAt);
    },
    fullDate(): string {
      return formatDateTime(this.simplePost?.createdAt);
    },
    isoDate(): string {
      return this.simplePost?.createdAt ? new Date(this.simplePost.createdAt).toISOString() : '';
    },
    openTypeLabel(): string {
      return OPEN_TYPE_LABELS[this.simplePost?.openType ?? ''] ?? '';
    },
    thumbnail() {
      return thumbnailStyle(this.simplePost?.thumbnailImageUrl, this.simplePost?.createdAt);
    },
  },
});
</script>

<style scoped>
.post-card {
  position: relative;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  min-width: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: transform var(--ease), box-shadow var(--ease), border-color var(--ease);
}

@media (hover: hover) and (pointer: fine) {
  .post-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    border-color: var(--border-strong);
  }
}

.thumb {
  position: relative;
  display: block;
}

.thumb-image {
  aspect-ratio: 16 / 9;
  background-color: var(--surface-2);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: grid;
  place-items: center;
  padding: var(--s-4);
}

.thumb-title {
  color: rgba(255, 255, 255, 0.92);
  font-size: var(--text-lg);
  font-weight: 700;
  line-height: 1.35;
  text-align: center;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.35);
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  word-break: keep-all;
}

.open-type {
  position: absolute;
  top: 10px;
  left: 10px;
}

.body {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: var(--s-2);
  padding: var(--s-4) var(--s-5) var(--s-3);
  min-width: 0;
}

.title {
  font-size: var(--text-lg);
  line-height: 1.4;
  letter-spacing: -0.01em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  word-break: keep-all;
  overflow-wrap: anywhere;
}

.title a {
  color: var(--text);
  text-decoration: none;
}

/* 카드 전체를 클릭 영역으로 넓힌다 (작성자 링크는 그 위에 올린다) */
.title a::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
}

.summary {
  color: var(--text-2);
  font-size: var(--text-sm);
  line-height: 1.6;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  word-break: keep-all;
  overflow-wrap: anywhere;
}

.foot {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: var(--s-3) var(--s-5) var(--s-4);
  border-top: 1px solid var(--border);
  color: var(--text-3);
  font-size: var(--text-xs);
  min-width: 0;
}

.author {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-2);
  font-weight: 600;
  min-width: 0;
}

.author:hover {
  color: var(--text);
  text-decoration: none;
}

.author-avatar {
  width: 22px;
  height: 22px;
}

.author-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 120px;
}

.date {
  white-space: nowrap;
}

.stats {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
}

.stat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>

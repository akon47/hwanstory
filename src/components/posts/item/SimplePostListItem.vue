<template>
  <article class="post-row">
    <div class="body">
      <div v-if="openTypeLabel || hasTags" class="top-row">
        <span v-if="openTypeLabel" class="badge badge-warning">{{ openTypeLabel }}</span>
        <router-link v-for="tag in simplePost?.tags" :key="tag.name" class="chip chip-neutral"
                     :to="{ path: `/${simplePost?.author?.blogId}/posts`, query: { tag: tag.name } }">
          {{ tag.name }}
        </router-link>
      </div>
      <h3 class="title">
        <router-link :to="postPath">{{ simplePost?.title }}</router-link>
      </h3>
      <p class="summary">{{ simplePost?.summary }}</p>
      <div class="meta-row">
        <time :datetime="isoDate" :title="fullDate">{{ relativeDate }}</time>
        <span class="dot"/>
        <span>조회 {{ hits }}</span>
        <span class="dot"/>
        <span class="stat"><app-icon name="heart" :size="14"/>{{ simplePost?.likeCount }}</span>
        <span class="stat"><app-icon name="comment" :size="14"/>{{ simplePost?.commentCount }}</span>
        <post-viewer-count :post-id="simplePost?.id"/>
      </div>
    </div>
    <router-link class="thumb" :to="postPath" tabindex="-1" aria-hidden="true">
      <div class="thumb-image" :style="thumbnail"/>
    </router-link>
  </article>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { SimplePostDto } from '@/api/models/blog.dtos';
import PostViewerCount from '@/components/posts/PostViewerCount.vue';
import AppIcon from '@/components/common/AppIcon.vue';
import { formatCount, formatDateTime, formatRelativeDate } from '@/utils/format';
import { thumbnailStyle } from '@/utils/thumbnail';

const OPEN_TYPE_LABELS: Record<string, string> = {
  PRIVATE: '비공개',
  DRAFT: '임시저장',
  SCHEDULED: '예약 발행',
};

export default defineComponent({
  name: 'SimplePostListItem',
  components: { AppIcon, PostViewerCount },
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
    hits(): string {
      return formatCount(this.simplePost?.hits);
    },
    hasTags(): boolean {
      return (this.simplePost?.tags?.length ?? 0) > 0;
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
.post-row {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 180px;
  gap: var(--s-6);
  padding: var(--s-6) 0;
  border-bottom: 1px solid var(--border);
}

.post-row:first-child {
  padding-top: var(--s-2);
}

.body {
  display: grid;
  gap: var(--s-2);
  align-content: start;
  min-width: 0;
}

.top-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  position: relative;
  z-index: 2;
}

.title {
  font-size: var(--text-xl);
  line-height: 1.4;
  letter-spacing: -0.01em;
  word-break: keep-all;
  overflow-wrap: anywhere;
}

.title a {
  color: var(--text);
  text-decoration: none;
}

.title a::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
}

.post-row:hover .title a {
  color: var(--accent-text);
}

.summary {
  color: var(--text-2);
  line-height: 1.65;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  word-break: keep-all;
  overflow-wrap: anywhere;
}

.meta-row {
  margin-top: var(--s-1);
}

.stat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.thumb {
  display: block;
  align-self: start;
}

.thumb-image {
  aspect-ratio: 3 / 2;
  border-radius: var(--radius);
  background-color: var(--surface-2);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

@media (max-width: 640px) {
  .post-row {
    grid-template-columns: minmax(0, 1fr) 88px;
    gap: var(--s-4);
    padding: var(--s-5) 0;
  }

  .title {
    font-size: var(--text-md);
  }

  .summary {
    font-size: var(--text-sm);
  }

  .thumb-image {
    aspect-ratio: 1 / 1;
    border-radius: var(--radius-sm);
  }
}
</style>

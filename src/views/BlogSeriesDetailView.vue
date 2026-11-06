<template>
  <div class="series-detail">
    <router-link class="back small" :to="`/${blogId}/series`">
      <app-icon name="arrow-left" :size="14"/>시리즈 목록
    </router-link>
    <div v-if="series" class="series-head">
      <div class="series-title-row">
        <span class="series-icon"><app-icon name="layers" :size="20"/></span>
        <div class="series-text">
          <h2 class="series-title">{{ series.title }}</h2>
          <span class="subtle small">글 {{ posts.length }}개 · 먼저 쓴 글부터</span>
        </div>
      </div>
      <div v-if="isMyBlog" class="owner-actions">
        <button class="btn btn-secondary btn-sm" type="button" @click="rename"><app-icon name="pen" :size="14"/>이름 바꾸기</button>
        <button class="btn btn-danger-ghost btn-sm" type="button" @click="remove"><app-icon name="trash" :size="14"/>시리즈 삭제</button>
      </div>
    </div>
    <ol v-if="posts.length > 0" class="series-posts">
      <li v-for="(post, index) in posts" :key="post.postUrl">
        <router-link class="series-post" :to="`/${blogId}/posts/${post.postUrl}`">
          <span class="series-no num">{{ index + 1 }}</span>
          <span class="series-post-body">
            <span class="series-post-title">{{ post.title }}</span>
            <span class="series-post-meta subtle small">{{ formatDate(post.createdAt) }} · 조회 {{ post.hits }}</span>
          </span>
          <app-icon class="chevron" name="chevron-right" :size="18"/>
        </router-link>
      </li>
    </ol>
    <div v-else-if="!isLoading && series" class="empty-state">
      <div class="empty-title">이 시리즈에 아직 글이 없습니다</div>
      <div v-if="isMyBlog">글을 쓸 때 시리즈를 고르면 여기에 모입니다.</div>
    </div>
    <div v-if="isLoading" class="loading"><loading-spinner/></div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { deleteSeries, getBlogSeriesDetail, modifySeries } from '@/api/blog';
import { HttpApiError } from '@/api/common/httpApiClient';
import { PostDto, SeriesDto } from '@/api/models/blog.dtos';
import AppIcon from '@/components/common/AppIcon.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import store from '@/store';
import { confirmDialog, promptDialog, toast } from '@/utils/dialog';
import { formatDate } from '@/utils/format';

export default defineComponent({
  name: 'BlogSeriesDetailView',
  components: { AppIcon, LoadingSpinner },
  props: {
    blogId: {
      type: String,
      required: true,
    },
    seriesUrl: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      series: null as SeriesDto | null,
      isLoading: false,
    };
  },
  computed: {
    isMyBlog(): boolean {
      return this.blogId === store.state.accountStore.blogId;
    },
    posts(): Array<PostDto> {
      return this.series?.posts ?? [];
    },
  },
  watch: {
    seriesUrl() {
      this.load();
    },
  },
  methods: {
    formatDate,
    async load() {
      this.isLoading = true;
      await getBlogSeriesDetail(this.blogId, this.seriesUrl)
      .then((series) => {
        this.series = series;
        document.title = `${series.title} | Hwan'Story`;
      })
      .catch((error: HttpApiError) => {
        if (error.isNotFound()) {
          this.$router.replace(`/${this.blogId}/series`);
        } else {
          toast.error(error.getErrorMessage());
        }
      })
      .finally(() => {
        this.isLoading = false;
      });
    },
    async rename() {
      if (!this.series) {
        return;
      }
      const title = await promptDialog({
        title: '시리즈 이름 바꾸기',
        message: '글 상단과 시리즈 목록에 보이는 이름입니다.',
        placeholder: '시리즈 제목',
        defaultValue: this.series.title,
        confirmLabel: '저장',
      });
      if (!title || title.trim() === this.series.title) {
        return;
      }
      await modifySeries(this.seriesUrl, { seriesUrl: this.seriesUrl, title: title.trim() })
      .then((series) => {
        this.series = series;
        toast.success('시리즈 이름을 바꿨습니다.');
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
      });
    },
    async remove() {
      if (!this.series) {
        return;
      }
      const ok = await confirmDialog({
        title: '시리즈를 삭제할까요?',
        message: `'${this.series.title}' 묶음만 없어지고 글은 그대로 남습니다.`,
        confirmLabel: '삭제',
        danger: true,
      });
      if (!ok) {
        return;
      }
      await deleteSeries(this.seriesUrl)
      .then(() => {
        toast.success('시리즈를 삭제했습니다.');
        this.$router.replace(`/${this.blogId}/series`);
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
      });
    },
  },
  mounted() {
    this.load();
  },
});
</script>

<style scoped>
.series-detail {
  display: grid;
  gap: var(--s-4);
}

.back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-3);
  justify-self: start;
}

.series-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-4);
  flex-wrap: wrap;
}

.series-title-row {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  min-width: 0;
}

.series-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
  display: grid;
  place-items: center;
  background: var(--accent-soft);
  color: var(--accent-text);
  flex-shrink: 0;
}

.series-text {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.series-title {
  font-size: var(--text-xl);
}

.owner-actions {
  display: flex;
  gap: var(--s-2);
}

.series-posts {
  display: grid;
  gap: var(--s-2);
}

.series-post {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-3) var(--s-4);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--text);
  transition: border-color var(--ease);
}

.series-post:hover {
  border-color: var(--accent);
  text-decoration: none;
}

.series-no {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--surface-2);
  color: var(--text-2);
  font-size: var(--text-xs);
  font-weight: 700;
}

.series-post-body {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.series-post-title {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chevron {
  color: var(--text-3);
}

.loading {
  display: flex;
  justify-content: center;
  height: 64px;
}
</style>

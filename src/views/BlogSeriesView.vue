<template>
  <div class="series-list">
    <div v-if="!isLoading && seriesList.length === 0" class="empty-state">
      <div class="empty-icon"><app-icon name="layers" :size="26"/></div>
      <div class="empty-title">아직 시리즈가 없습니다</div>
      <div v-if="isMyBlog">글을 쓸 때 아래 바에서 <b>+</b> 로 시리즈를 만들고 글을 묶어 보세요.</div>
      <div v-else>이어지는 글을 시리즈로 묶으면 여기에 보입니다.</div>
    </div>
    <router-link v-for="series in seriesList" :key="series.seriesUrl" class="series-card" :to="`/${blogId}/series/${series.seriesUrl}`">
      <span class="series-icon"><app-icon name="layers" :size="20"/></span>
      <span class="series-body">
        <span class="series-title">{{ series.title }}</span>
        <span class="series-meta subtle small">글 {{ series.postCount }}개 · /series/{{ series.seriesUrl }}</span>
      </span>
      <app-icon class="chevron" name="chevron-right" :size="18"/>
    </router-link>
    <div v-if="isLoading" class="loading"><loading-spinner/></div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { getBlogSeries } from '@/api/blog';
import { HttpApiError } from '@/api/common/httpApiClient';
import { SimpleSeriesDto } from '@/api/models/blog.dtos';
import AppIcon from '@/components/common/AppIcon.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import store from '@/store';
import { toast } from '@/utils/dialog';

export default defineComponent({
  name: 'BlogSeriesView',
  components: { AppIcon, LoadingSpinner },
  props: {
    blogId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      seriesList: Array<SimpleSeriesDto>(),
      isLoading: false,
    };
  },
  computed: {
    isMyBlog(): boolean {
      return this.blogId === store.state.accountStore.blogId;
    },
  },
  watch: {
    blogId() {
      this.load();
    },
  },
  methods: {
    async load() {
      this.isLoading = true;
      await getBlogSeries(this.blogId)
      .then((seriesList) => {
        this.seriesList = seriesList;
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
      })
      .finally(() => {
        this.isLoading = false;
      });
    },
  },
  mounted() {
    this.load();
  },
});
</script>

<style scoped>
.series-list {
  display: grid;
  gap: var(--s-3);
}

.series-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--s-4);
  padding: var(--s-4) var(--s-5);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--text);
  transition: border-color var(--ease), box-shadow var(--ease);
}

.series-card:hover {
  border-color: var(--accent);
  box-shadow: var(--shadow-sm);
  text-decoration: none;
}

.series-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  display: grid;
  place-items: center;
  background: var(--accent-soft);
  color: var(--accent-text);
}

.series-body {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.series-title {
  font-weight: 700;
  font-size: var(--text-md);
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

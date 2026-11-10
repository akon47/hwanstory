<template>
  <div class="container container-narrow page stats-page">
    <div class="page-head">
      <div>
        <h1>글 통계</h1>
        <p class="lead">내 글이 얼마나 읽혔는지 봅니다. 날짜별 조회수는 2026년 11월 10일부터 쌓이기 시작했습니다.</p>
      </div>
      <div class="periods" role="tablist" aria-label="기간">
        <button v-for="period in periods" :key="period" class="chip period-chip" :class="{ selected: days === period }" type="button"
                role="tab" :aria-selected="days === period" @click="setDays(period)">{{ period }}일</button>
      </div>
    </div>

    <div v-if="stats" class="summary">
      <div class="card stat"><div class="stat-label subtle small">최근 {{ stats.days }}일 조회</div><div class="stat-value num">{{ n(periodViews) }}</div></div>
      <div class="card stat"><div class="stat-label subtle small">전체 조회</div><div class="stat-value num">{{ n(totalHits) }}</div></div>
      <div class="card stat"><div class="stat-label subtle small">좋아요</div><div class="stat-value num">{{ n(totalLikes) }}</div></div>
      <div class="card stat"><div class="stat-label subtle small">댓글</div><div class="stat-value num">{{ n(totalComments) }}</div></div>
    </div>

    <section v-if="stats" class="card">
      <div class="card-head"><h2>날짜별 조회수</h2></div>
      <div class="card-body">
        <views-chart :daily="stats.daily"/>
      </div>
    </section>

    <section v-if="stats" class="card flush">
      <div class="card-head"><h2>글별 통계</h2><span class="subtle small">{{ stats.posts.length }}개</span></div>
      <div class="table-wrapper">
        <table class="table">
          <thead>
          <tr>
            <th>글</th>
            <th class="right">최근 {{ stats.days }}일</th>
            <th class="right">전체 조회</th>
            <th class="right">좋아요</th>
            <th class="right">댓글</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="item in stats.posts" :key="item.post.id">
            <td class="title-cell">
              <router-link :to="`/${item.post.author.blogId}/posts/${item.post.postUrl}`">{{ item.post.title || '(제목 없음)' }}</router-link>
              <span v-if="item.post.openType !== 'PUBLIC'" class="badge">{{ openTypeLabel(item.post.openType) }}</span>
            </td>
            <td class="right num"><b>{{ n(item.recentViews) }}</b></td>
            <td class="right num">{{ n(item.post.hits) }}</td>
            <td class="right num">{{ n(item.post.likeCount) }}</td>
            <td class="right num">{{ n(item.post.commentCount) }}</td>
          </tr>
          <tr v-if="stats.posts.length === 0">
            <td colspan="5" class="empty">아직 쓴 글이 없습니다.</td>
          </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="isLoading && !stats" class="loading"><loading-spinner/></div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { MyPostStatsDto } from '@/api/models/stats.dtos';
import { getMyPostStatistics } from '@/api/blog';
import { HttpApiError } from '@/api/common/httpApiClient';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import ViewsChart from '@/components/common/ViewsChart.vue';
import { toast } from '@/utils/dialog';
import { formatCount } from '@/utils/format';

export default defineComponent({
  name: 'StatsView',
  components: { LoadingSpinner, ViewsChart },
  data() {
    return {
      stats: null as MyPostStatsDto | null,
      days: 30,
      periods: [7, 30, 90],
      isLoading: false,
    };
  },
  computed: {
    periodViews(): number {
      return (this.stats?.daily ?? []).reduce((sum, day) => sum + day.views, 0);
    },
    totalHits(): number {
      return (this.stats?.posts ?? []).reduce((sum, item) => sum + (item.post.hits ?? 0), 0);
    },
    totalLikes(): number {
      return (this.stats?.posts ?? []).reduce((sum, item) => sum + (item.post.likeCount ?? 0), 0);
    },
    totalComments(): number {
      return (this.stats?.posts ?? []).reduce((sum, item) => sum + (item.post.commentCount ?? 0), 0);
    },
  },
  methods: {
    n: formatCount,
    openTypeLabel(openType: string): string {
      return openType === 'PRIVATE' ? '비공개' : openType === 'DRAFT' ? '임시저장' : openType === 'SCHEDULED' ? '예약' : openType;
    },
    async load() {
      this.isLoading = true;
      await getMyPostStatistics(this.days)
      .then((stats) => {
        this.stats = stats;
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
      })
      .finally(() => {
        this.isLoading = false;
      });
    },
    setDays(days: number) {
      this.days = days;
      this.load();
    },
  },
  mounted() {
    this.load();
  },
});
</script>

<style scoped>
.stats-page {
  display: grid;
  gap: var(--s-5);
  align-content: start;
}

.periods {
  display: flex;
  gap: var(--s-2);
}

.period-chip {
  cursor: pointer;
  background: var(--surface-2);
  color: var(--text-2);
  border: 1px solid var(--border);
}

.period-chip.selected {
  background: var(--accent);
  color: var(--on-accent);
  border-color: var(--accent);
}

.summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--s-3);
}

.stat {
  padding: var(--s-4);
  display: grid;
  gap: 4px;
}

.stat-value {
  font-size: var(--text-2xl);
  font-weight: 800;
}

.right {
  text-align: right;
}

.table-wrapper {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.table th,
.table td {
  padding: 10px var(--s-4);
  border-bottom: 1px solid var(--border);
  text-align: left;
  white-space: nowrap;
}

.table th.right,
.table td.right {
  text-align: right;
}

.table th {
  color: var(--text-3);
  font-size: var(--text-xs);
  font-weight: 700;
}

.table tbody tr:last-child td {
  border-bottom: none;
}

/* 제목 칸이 남는 폭을 모두 쓰고, 길면 말줄임한다 */
.table td.title-cell {
  width: 100%;
  max-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.title-cell a {
  font-weight: 600;
}

.title-cell .badge {
  margin-left: 6px;
}

.empty {
  text-align: center;
  color: var(--text-3);
  padding: var(--s-10);
}

.loading {
  display: flex;
  justify-content: center;
  padding: var(--s-10);
}

@media (max-width: 600px) {
  .summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>

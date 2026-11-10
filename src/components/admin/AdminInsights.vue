<template>
  <div v-if="insights" class="insights">
    <section class="card">
      <div class="card-head">
        <h2>조회수 추이</h2>
        <span class="subtle small">최근 {{ insights.days }}일 · {{ n(periodViews) }}회</span>
      </div>
      <div class="card-body">
        <views-chart :daily="insights.daily"/>
      </div>
    </section>

    <div class="insight-grid">
      <section class="card flush">
        <div class="card-head"><h2>많이 읽힌 글</h2><span class="subtle small">최근 {{ insights.days }}일</span></div>
        <ol class="rank-list">
          <li v-for="(item, index) in insights.topPosts" :key="item.post.id" class="rank-row">
            <span class="rank num">{{ index + 1 }}</span>
            <router-link class="rank-title" :to="`/${item.post.author.blogId}/posts/${item.post.postUrl}`">{{ item.post.title || '(제목 없음)' }}</router-link>
            <span class="subtle small num">{{ n(item.recentViews) }}회</span>
          </li>
          <li v-if="insights.topPosts.length === 0" class="empty">아직 쌓인 조회 기록이 없습니다.</li>
        </ol>
      </section>

      <section class="card flush">
        <div class="card-head"><h2>많이 찾는 검색어</h2><span class="subtle small">누적</span></div>
        <ol class="rank-list">
          <li v-for="(keyword, index) in insights.topKeywords" :key="keyword.keyword" class="rank-row">
            <span class="rank num">{{ index + 1 }}</span>
            <router-link class="rank-title" :to="{ path: '/search', query: { q: keyword.keyword } }">{{ keyword.keyword }}</router-link>
            <span class="subtle small num">{{ n(keyword.count) }}회</span>
          </li>
          <li v-if="insights.topKeywords.length === 0" class="empty">아직 검색 기록이 없습니다.</li>
        </ol>
      </section>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { InsightsDto } from '@/api/models/stats.dtos';
import { getInsights } from '@/api/admin';
import ViewsChart from '@/components/common/ViewsChart.vue';
import { formatCount } from '@/utils/format';

// 관리자 대시보드의 인사이트: 날짜별 조회수, 많이 읽힌 글, 많이 찾는 검색어.
// 대시보드의 다른 수치와 따로 받아, 이 부분을 못 받아도 대시보드는 그대로 보인다.
export default defineComponent({
  name: 'AdminInsights',
  components: { ViewsChart },
  data() {
    return {
      insights: null as InsightsDto | null,
    };
  },
  computed: {
    periodViews(): number {
      return (this.insights?.daily ?? []).reduce((sum, day) => sum + day.views, 0);
    },
  },
  methods: {
    n: formatCount,
  },
  async mounted() {
    this.insights = await getInsights(30).catch(() => null);
  },
});
</script>

<style scoped>
.insights {
  display: grid;
  gap: var(--s-5);
}

.insight-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--s-5);
}

.rank-list {
  display: grid;
}

.rank-row {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) auto;
  gap: var(--s-2);
  align-items: center;
  padding: 10px var(--s-5);
  border-bottom: 1px solid var(--border);
}

.rank-row:last-child {
  border-bottom: none;
}

.rank {
  color: var(--text-3);
  font-weight: 700;
}

.rank-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}

.empty {
  text-align: center;
  color: var(--text-3);
  padding: var(--s-8);
}

@media (max-width: 860px) {
  .insight-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>

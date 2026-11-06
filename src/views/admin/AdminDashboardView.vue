<template>
  <div class="dashboard">
    <div class="page-head">
      <div>
        <h1>대시보드</h1>
        <p class="lead">서비스가 어떻게 돌아가는지 한눈에 봅니다.</p>
      </div>
      <button class="btn btn-secondary btn-sm" type="button" :disabled="isLoading" @click="load">새로고침</button>
    </div>

    <div v-if="dashboard" class="kpis">
      <div class="kpi">
        <div class="kpi-label">회원</div>
        <div class="kpi-value num">{{ n(dashboard.memberCount) }}</div>
        <div class="kpi-sub" :class="{ up: dashboard.todayMembers > 0 }">오늘 +{{ dashboard.todayMembers }}</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">글</div>
        <div class="kpi-value num">{{ n(dashboard.postCount) }}</div>
        <div class="kpi-sub">공개 {{ n(dashboard.publicPostCount) }} · 오늘 +{{ dashboard.todayPosts }}</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">댓글</div>
        <div class="kpi-value num">{{ n(dashboard.commentCount) }}</div>
        <div class="kpi-sub" :class="{ up: dashboard.todayComments > 0 }">오늘 +{{ dashboard.todayComments }}</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">누적 조회</div>
        <div class="kpi-value num">{{ n(dashboard.totalHits) }}</div>
        <div class="kpi-sub">모든 글의 조회수 합</div>
      </div>
      <div class="kpi live">
        <div class="kpi-label"><span class="live-dot"/>지금 접속</div>
        <div class="kpi-value num">{{ n(dashboard.sessionCount) }}</div>
        <div class="kpi-sub">글 읽는 중 {{ dashboard.viewingCount }} · <router-link to="/admin/live">자세히</router-link></div>
      </div>
    </div>

    <section v-if="dashboard" class="card">
      <div class="card-head">
        <h2>최근 30일</h2>
        <div class="legend">
          <span><i class="swatch members"/>가입</span>
          <span><i class="swatch posts"/>글</span>
          <span><i class="swatch comments"/>댓글</span>
        </div>
      </div>
      <div class="card-body">
        <div class="chart" role="img" :aria-label="`최근 30일 가입·글·댓글 추이`">
          <div v-for="day in dashboard.daily" :key="day.date" class="chart-day"
               :title="`${day.date} · 가입 ${day.members} · 글 ${day.posts} · 댓글 ${day.comments}`">
            <div class="bars">
              <div class="bar members" :style="{ height: barHeight(day.members) }"/>
              <div class="bar posts" :style="{ height: barHeight(day.posts) }"/>
              <div class="bar comments" :style="{ height: barHeight(day.comments) }"/>
            </div>
            <div class="day-label">{{ dayLabel(day.date) }}</div>
          </div>
        </div>
      </div>
    </section>

    <div v-if="dashboard" class="recent-grid">
      <section class="card">
        <div class="card-head">
          <h2>최근 글</h2>
          <router-link class="small" to="/admin/posts">모두 보기</router-link>
        </div>
        <ul class="recent-list">
          <li v-for="post in dashboard.recentPosts" :key="post.id">
            <router-link class="recent-title" :to="`/${post.author.blogId}/posts/${post.postUrl}`">{{ post.title }}</router-link>
            <span class="recent-meta">
              <span v-if="post.openType !== 'PUBLIC'" class="badge badge-warning">{{ openTypeLabel(post.openType) }}</span>
              {{ post.author.name }} · {{ ago(post.createdAt) }}
            </span>
          </li>
          <li v-if="dashboard.recentPosts.length === 0" class="empty">아직 글이 없습니다.</li>
        </ul>
      </section>
      <section class="card">
        <div class="card-head">
          <h2>최근 댓글</h2>
          <router-link class="small" to="/admin/comments">모두 보기</router-link>
        </div>
        <ul class="recent-list">
          <li v-for="comment in dashboard.recentComments" :key="comment.id">
            <router-link class="recent-title" :to="comment.postBlogId && comment.postUrl ? `/${comment.postBlogId}/posts/${comment.postUrl}` : '/admin/comments'">
              {{ comment.content }}
            </router-link>
            <span class="recent-meta">{{ comment.author?.name }} · {{ comment.postTitle }} · {{ ago(comment.createdAt) }}</span>
          </li>
          <li v-if="dashboard.recentComments.length === 0" class="empty">아직 댓글이 없습니다.</li>
        </ul>
      </section>
      <section class="card">
        <div class="card-head">
          <h2>최근 가입</h2>
          <router-link class="small" to="/admin/members">모두 보기</router-link>
        </div>
        <ul class="recent-list">
          <li v-for="member in dashboard.recentMembers" :key="member.id">
            <router-link class="recent-title" :to="`/${member.blogId}`">{{ member.name }} <span class="subtle">{{ member.blogId }}</span></router-link>
            <span class="recent-meta">{{ member.email }} · {{ ago(member.createdAt) }}</span>
          </li>
          <li v-if="dashboard.recentMembers.length === 0" class="empty">아직 회원이 없습니다.</li>
        </ul>
      </section>
    </div>

    <div v-if="isLoading && !dashboard" class="loading"><loading-spinner/></div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { AdminDashboardDto } from '@/api/models/admin.dtos';
import { getDashboard } from '@/api/admin';
import { HttpApiError } from '@/api/common/httpApiClient';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import { toast } from '@/utils/dialog';
import { formatCount, formatRelativeDate } from '@/utils/format';

const OPEN_TYPE_LABELS: Record<string, string> = { PUBLIC: '공개', PRIVATE: '비공개', DRAFT: '임시저장', SCHEDULED: '예약' };

export default defineComponent({
  name: 'AdminDashboardView',
  components: { LoadingSpinner },
  data() {
    return {
      dashboard: null as AdminDashboardDto | null,
      isLoading: false,
    };
  },
  computed: {
    maxDaily(): number {
      const values = (this.dashboard?.daily ?? []).flatMap((d) => [d.members, d.posts, d.comments]);
      return Math.max(1, ...values);
    },
  },
  methods: {
    n: formatCount,
    ago: formatRelativeDate,
    openTypeLabel(type: string): string {
      return OPEN_TYPE_LABELS[type] ?? type;
    },
    barHeight(value: number): string {
      return `${Math.round((value / this.maxDaily) * 100)}%`;
    },
    dayLabel(date: string): string {
      const d = new Date(date);
      return d.getDate() === 1 || d.getDay() === 1 ? `${d.getMonth() + 1}/${d.getDate()}` : '';
    },
    async load() {
      this.isLoading = true;
      await getDashboard()
      .then((dashboard) => {
        this.dashboard = dashboard;
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
.dashboard {
  display: grid;
  gap: var(--s-6);
}

.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--s-3);
}

.kpi {
  padding: var(--s-4);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  display: grid;
  gap: 2px;
}

.kpi.live {
  border-color: var(--accent);
}

.kpi-label {
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 6px;
}

.kpi-value {
  font-size: var(--text-2xl);
  font-weight: 800;
  letter-spacing: -0.02em;
}

.kpi-sub {
  font-size: var(--text-xs);
  color: var(--text-3);
}

.kpi-sub.up {
  color: var(--success);
  font-weight: 600;
}

.live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--success);
}

.legend {
  display: flex;
  gap: var(--s-3);
  font-size: var(--text-xs);
  color: var(--text-2);
}

.legend span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.swatch {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  display: inline-block;
}

.swatch.members, .bar.members { background: var(--accent); }
.swatch.posts, .bar.posts { background: var(--success); }
.swatch.comments, .bar.comments { background: var(--warning); }

.chart {
  display: grid;
  grid-template-columns: repeat(30, minmax(0, 1fr));
  gap: 3px;
  height: 160px;
  align-items: end;
}

.chart-day {
  display: grid;
  grid-template-rows: minmax(0, 1fr) 14px;
  height: 100%;
  min-width: 0;
}

.bars {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  align-items: end;
  height: 100%;
  border-bottom: 1px solid var(--border);
}

.bar {
  min-height: 2px;
  border-radius: 2px 2px 0 0;
  opacity: 0.9;
}

.day-label {
  font-size: 10px;
  color: var(--text-3);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
}

.recent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--s-4);
}

.recent-list {
  display: grid;
  padding: var(--s-2) var(--s-5);
}

.recent-list li {
  display: grid;
  gap: 2px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
  min-width: 0;
}

.recent-list li:last-child {
  border-bottom: none;
}

.recent-title {
  color: var(--text);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-meta {
  font-size: var(--text-xs);
  color: var(--text-3);
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-list .empty {
  color: var(--text-3);
  text-align: center;
  padding: var(--s-6) 0;
}

.loading {
  display: flex;
  justify-content: center;
  padding: var(--s-10);
}
</style>

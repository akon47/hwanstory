<template>
  <div class="views-chart">
    <div class="chart" role="img" :aria-label="`최근 ${daily.length}일 조회수 추이`">
      <div v-for="day in daily" :key="day.date" class="chart-day" :title="`${label(day.date)} · ${n(day.views)}회`">
        <div class="bar" :class="{ empty: day.views === 0 }" :style="{ height: barHeight(day.views) }"/>
      </div>
    </div>
    <div class="axis subtle small">
      <span>{{ daily.length > 0 ? label(daily[0].date) : '' }}</span>
      <span>{{ daily.length > 0 ? label(daily[daily.length - 1].date) : '' }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { DailyViewsDto } from '@/api/models/stats.dtos';
import { formatCount } from '@/utils/format';

// 날짜별 조회수를 막대로 그린다. (가장 높은 날을 꽉 찬 높이로 삼는다. 막대에 마우스를 올리면 날짜와 수가 보인다)
export default defineComponent({
  name: 'ViewsChart',
  props: {
    daily: {
      type: Array as PropType<Array<DailyViewsDto>>,
      default: () => [],
    },
  },
  computed: {
    max(): number {
      return Math.max(1, ...this.daily.map((day) => day.views));
    },
  },
  methods: {
    n: formatCount,
    barHeight(views: number): string {
      // 조회가 있는 날은 아주 적어도 보이도록 최소 높이를 준다.
      return views === 0 ? '2px' : `${Math.max(4, Math.round((views / this.max) * 100))}%`;
    },
    label(date: string): string {
      const [, month, day] = date.split('-');
      return `${Number(month)}월 ${Number(day)}일`;
    },
  },
});
</script>

<style scoped>
.views-chart {
  display: grid;
  gap: var(--s-2);
}

.chart {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 140px;
}

.chart-day {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  align-items: flex-end;
}

.bar {
  width: 100%;
  border-radius: 3px 3px 0 0;
  background: var(--accent);
  transition: height var(--ease);
}

.bar.empty {
  background: var(--border);
}

.chart-day:hover .bar {
  opacity: 0.75;
}

.axis {
  display: flex;
  justify-content: space-between;
}
</style>

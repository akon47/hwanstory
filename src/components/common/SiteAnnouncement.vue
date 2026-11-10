<template>
  <div v-if="isVisible && announcement" class="site-announcement" :class="`level-${announcement.level ?? 'info'}`" role="status">
    <div class="container announcement-inner">
      <app-icon :name="iconName" :size="18"/>
      <span class="announcement-message">{{ announcement.message }}</span>
      <template v-if="announcement.linkUrl">
        <router-link v-if="announcement.linkUrl.startsWith('/')" class="announcement-link" :to="announcement.linkUrl">자세히 보기</router-link>
        <a v-else class="announcement-link" :href="announcement.linkUrl" target="_blank" rel="noopener noreferrer">자세히 보기</a>
      </template>
      <button class="announcement-close" type="button" aria-label="공지 닫기" @click="dismiss">
        <app-icon name="x" :size="16"/>
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import AppIcon from '@/components/common/AppIcon.vue';
import { AnnouncementDto } from '@/api/models/site.dtos';
import { getAnnouncement } from '@/api/site';

// 관리자가 켜 둔 사이트 공지를 화면 맨 위(헤더 아래)에 띠로 보여준다.
// 닫으면 그 공지(고친 시각 기준)는 이 브라우저에서 다시 보이지 않고, 관리자가 공지를 고치면 다시 나타난다.
const DISMISSED_KEY = 'hwanstory.announcement.dismissed';

export default defineComponent({
  name: 'SiteAnnouncement',
  components: { AppIcon },
  data() {
    return {
      announcement: null as AnnouncementDto | null,
      dismissedAt: null as string | null,
    };
  },
  computed: {
    isVisible(): boolean {
      const announcement = this.announcement;
      return !!announcement && announcement.enabled && !!announcement.message
        && (announcement.updatedAt ?? '') !== this.dismissedAt;
    },
    iconName(): string {
      const level = this.announcement?.level;
      return level === 'warning' ? 'alert' : level === 'success' ? 'check-circle' : 'info';
    },
  },
  methods: {
    dismiss() {
      this.dismissedAt = this.announcement?.updatedAt ?? '';
      try {
        localStorage.setItem(DISMISSED_KEY, this.dismissedAt);
      } catch (e) {
        // 저장소를 못 쓰면 이번 방문 동안만 닫아 둔다.
      }
    },
  },
  async mounted() {
    try {
      this.dismissedAt = localStorage.getItem(DISMISSED_KEY);
    } catch (e) {
      this.dismissedAt = null;
    }
    // 공지를 못 받아도 화면에는 영향이 없도록 조용히 넘어간다.
    this.announcement = await getAnnouncement().catch(() => null);
  },
});
</script>

<style scoped>
.site-announcement {
  border-bottom: 1px solid var(--border);
  background: var(--accent-soft);
  color: var(--accent-text);
  font-size: var(--text-sm);
}

.site-announcement.level-success {
  background: var(--success-soft);
  color: var(--success);
}

.site-announcement.level-warning {
  background: var(--warning-soft);
  color: var(--warning);
}

.announcement-inner {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  padding-block: 10px;
}

.announcement-inner > .app-icon {
  flex: none;
}

.announcement-message {
  flex: 1;
  min-width: 0;
  font-weight: 600;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.announcement-link {
  flex: none;
  color: inherit;
  font-weight: 700;
  text-decoration: underline;
}

.announcement-close {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: inherit;
  opacity: 0.7;
}

.announcement-close:hover {
  opacity: 1;
  background: var(--hover-color);
}
</style>

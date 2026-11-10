<template>
  <div class="site">
    <div class="page-head">
      <div>
        <h1>사이트 공지</h1>
        <p class="lead">모든 화면 맨 위에 띠 모양으로 보이는 공지입니다. 점검 안내나 새 기능 소식을 알릴 때 씁니다.</p>
      </div>
    </div>

    <form class="card" @submit.prevent="save">
      <div class="card-body form">
        <label class="switch-row">
          <input v-model="form.enabled" type="checkbox"/>
          <span>
            <b>공지 보이기</b>
            <span class="subtle small">끄면 내용은 남겨 두고 방문자에게만 숨깁니다.</span>
          </span>
        </label>

        <div class="field">
          <label for="announcement-message">내용</label>
          <textarea id="announcement-message" v-model="form.message" class="textarea" rows="3" maxlength="300"
                    placeholder="예) 11월 12일 02:00~03:00 서버 점검으로 접속이 잠시 끊길 수 있습니다."/>
          <span class="hint">{{ form.message.length }} / 300</span>
        </div>

        <div class="field">
          <span class="label">종류</span>
          <div class="levels">
            <label v-for="level in levels" :key="level.value" class="chip level-chip" :class="{ selected: form.level === level.value }">
              <input v-model="form.level" type="radio" name="announcement-level" :value="level.value"/>
              {{ level.label }}
            </label>
          </div>
        </div>

        <div class="field">
          <label for="announcement-link">자세히 보기 링크 (선택)</label>
          <input id="announcement-link" v-model="form.linkUrl" class="input" type="text" maxlength="500"
                 placeholder="/@blog/posts/글-주소 또는 https://…"/>
          <span v-if="!isLinkValid" class="error-text">사이트 안 경로(/로 시작)나 https:// 주소만 넣을 수 있습니다.</span>
          <span v-else class="hint">비워 두면 링크 없이 내용만 보입니다.</span>
        </div>

        <div class="field">
          <span class="label">미리 보기</span>
          <div class="preview" :class="`level-${form.level}`">
            <app-icon :name="previewIcon" :size="18"/>
            <span class="preview-message">{{ form.message.trim() || '공지 내용이 여기에 보입니다.' }}</span>
            <span v-if="form.linkUrl.trim()" class="preview-link">자세히 보기</span>
          </div>
        </div>
      </div>
      <div class="card-foot foot">
        <span class="subtle small">
          <template v-if="updatedAt">마지막 저장 {{ fullDate(updatedAt) }}</template>
          <template v-else>아직 저장한 공지가 없습니다.</template>
        </span>
        <button class="btn" type="submit" :disabled="isSaving || isLoading || !isLinkValid || (form.enabled && !form.message.trim())">저장</button>
      </div>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { AnnouncementLevel } from '@/api/models/site.dtos';
import { getAdminAnnouncement, setAnnouncement } from '@/api/admin';
import { HttpApiError } from '@/api/common/httpApiClient';
import AppIcon from '@/components/common/AppIcon.vue';
import { toast } from '@/utils/dialog';
import { formatDateTime } from '@/utils/format';

export default defineComponent({
  name: 'AdminSiteView',
  components: { AppIcon },
  data() {
    return {
      form: {
        enabled: false,
        message: '',
        level: 'info' as AnnouncementLevel,
        linkUrl: '',
      },
      updatedAt: null as string | null,
      levels: [
        { value: 'info', label: '안내' },
        { value: 'success', label: '좋은 소식' },
        { value: 'warning', label: '주의' },
      ] as Array<{ value: AnnouncementLevel; label: string }>,
      isLoading: false,
      isSaving: false,
    };
  },
  computed: {
    isLinkValid(): boolean {
      const link = this.form.linkUrl.trim();
      return link.length === 0 || /^\/[^/]/.test(link) || /^https:\/\/.+/.test(link);
    },
    previewIcon(): string {
      return this.form.level === 'warning' ? 'alert' : this.form.level === 'success' ? 'check-circle' : 'info';
    },
  },
  methods: {
    fullDate: formatDateTime,
    async load() {
      this.isLoading = true;
      await getAdminAnnouncement()
      .then((announcement) => {
        this.form.enabled = announcement.enabled;
        this.form.message = announcement.message ?? '';
        this.form.level = announcement.level ?? 'info';
        this.form.linkUrl = announcement.linkUrl ?? '';
        this.updatedAt = announcement.updatedAt;
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
      })
      .finally(() => {
        this.isLoading = false;
      });
    },
    async save() {
      this.isSaving = true;
      await setAnnouncement({
        enabled: this.form.enabled,
        message: this.form.message.trim(),
        level: this.form.level,
        linkUrl: this.form.linkUrl.trim(),
      })
      .then((announcement) => {
        this.form.enabled = announcement.enabled;
        this.updatedAt = announcement.updatedAt;
        toast.success(announcement.enabled ? '공지를 저장했습니다. 지금부터 방문자에게 보입니다.' : '공지를 저장했습니다. (숨김 상태)');
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
      })
      .finally(() => {
        this.isSaving = false;
      });
    },
  },
  mounted() {
    this.load();
  },
});
</script>

<style scoped>
.site {
  display: grid;
  gap: var(--s-5);
}

.form {
  display: grid;
  gap: var(--s-5);
}

.switch-row {
  display: flex;
  align-items: flex-start;
  gap: var(--s-3);
  cursor: pointer;
}

.switch-row input {
  margin-top: 4px;
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
}

.switch-row > span {
  display: grid;
  gap: 2px;
}

.levels {
  display: flex;
  gap: var(--s-2);
  flex-wrap: wrap;
}

/* 고르지 않은 것은 차분하게, 고른 것만 강조색으로 채워 한눈에 구분되게 한다 */
.level-chip {
  cursor: pointer;
  background: var(--surface-2);
  color: var(--text-2);
  border: 1px solid var(--border);
}

.level-chip input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.level-chip.selected {
  background: var(--accent);
  color: var(--on-accent);
  border-color: var(--accent);
}

.preview {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  padding: 10px var(--s-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--accent-soft);
  color: var(--accent-text);
  font-size: var(--text-sm);
}

.preview.level-success {
  background: var(--success-soft);
  color: var(--success);
}

.preview.level-warning {
  background: var(--warning-soft);
  color: var(--warning);
}

.preview-message {
  flex: 1;
  min-width: 0;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.preview-link {
  flex: none;
  font-weight: 700;
  text-decoration: underline;
}

.foot {
  justify-content: space-between;
  align-items: center;
}
</style>

<template>
  <div class="blocks">
    <div class="page-head">
      <div>
        <h1>차단</h1>
        <p class="lead">스팸을 막는 두 가지 장치입니다. 차단한 IP 는 손님 댓글과 신고를 할 수 없고, 금칙어가 든 댓글은 등록되지 않습니다.</p>
      </div>
    </div>

    <section class="card flush">
      <div class="card-head"><h2>IP 차단</h2><span class="subtle small">{{ blockedIps.length }}개</span></div>
      <form class="add-form" @submit.prevent="addIp">
        <input v-model="newIp" class="input mono" type="text" placeholder="IP 주소 (예: 203.0.113.7)" maxlength="64" aria-label="차단할 IP"/>
        <input v-model="newReason" class="input" type="text" placeholder="사유 (선택)" maxlength="200" aria-label="사유"/>
        <button class="btn" type="submit" :disabled="!isIpValid || isBusy">차단</button>
      </form>
      <ul class="ip-list">
        <li v-for="blocked in blockedIps" :key="blocked.id" class="ip-row">
          <div class="ip-body">
            <span class="mono ip">{{ blocked.ip }}</span>
            <span v-if="blocked.reason" class="reason">{{ blocked.reason }}</span>
            <span class="subtle small">{{ blocked.createdBy || '알 수 없음' }} · {{ ago(blocked.createdAt) }}</span>
          </div>
          <button class="btn btn-ghost btn-sm" type="button" :disabled="isBusy" @click="removeIp(blocked)">해제</button>
        </li>
        <li v-if="!isLoading && blockedIps.length === 0" class="empty">차단한 IP 가 없습니다.</li>
      </ul>
    </section>

    <form class="card" @submit.prevent="saveWords">
      <div class="card-head"><h2>금칙어</h2><span class="subtle small">{{ parsedWords.length }}개</span></div>
      <div class="card-body words-body">
        <textarea v-model="wordsText" class="textarea" rows="8" placeholder="한 줄에 하나씩 적습니다."/>
        <span class="hint">댓글 내용과 손님 이름에 이 표현이 들어 있으면 등록을 막습니다. 대소문자와 띄어쓰기는 무시합니다. 한 단어는 30자까지.</span>
      </div>
      <div class="card-foot foot">
        <span v-if="hasTooLongWord" class="error-text">30자를 넘는 줄이 있습니다.</span>
        <span v-else/>
        <button class="btn" type="submit" :disabled="isBusy || hasTooLongWord">저장</button>
      </div>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { AdminBlockedIpDto } from '@/api/models/admin.dtos';
import { blockIp, getBannedWords, getBlockedIps, setBannedWords, unblockIp } from '@/api/admin';
import { HttpApiError } from '@/api/common/httpApiClient';
import { confirmDialog, toast } from '@/utils/dialog';
import { formatRelativeDate } from '@/utils/format';

export default defineComponent({
  name: 'AdminBlocksView',
  data() {
    return {
      blockedIps: [] as Array<AdminBlockedIpDto>,
      // 신고 화면의 "IP 차단"에서 넘어오면 ?ip= 로 미리 채워진다.
      newIp: (this.$route.query.ip as string | undefined) ?? '',
      newReason: (this.$route.query.reason as string | undefined) ?? '',
      wordsText: '',
      isLoading: false,
      isBusy: false,
    };
  },
  computed: {
    isIpValid(): boolean {
      return /^[0-9a-fA-F:.]{3,64}$/.test(this.newIp.trim());
    },
    parsedWords(): Array<string> {
      return Array.from(new Set(this.wordsText.split('\n').map((word) => word.trim()).filter((word) => word.length > 0)));
    },
    hasTooLongWord(): boolean {
      return this.parsedWords.some((word) => word.length > 30);
    },
  },
  methods: {
    ago: formatRelativeDate,
    async load() {
      this.isLoading = true;
      await Promise.all([getBlockedIps(), getBannedWords()])
      .then(([ips, words]) => {
        this.blockedIps = ips;
        this.wordsText = words.words.join('\n');
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
      })
      .finally(() => {
        this.isLoading = false;
      });
    },
    async addIp() {
      this.isBusy = true;
      await blockIp(this.newIp.trim(), this.newReason.trim() || null)
      .then(async () => {
        toast.success('IP 를 차단했습니다.');
        this.newIp = '';
        this.newReason = '';
        this.blockedIps = await getBlockedIps();
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
      })
      .finally(() => {
        this.isBusy = false;
      });
    },
    async removeIp(blocked: AdminBlockedIpDto) {
      const ok = await confirmDialog({ title: '차단을 해제할까요?', message: blocked.ip, confirmLabel: '해제' });
      if (!ok) {
        return;
      }
      this.isBusy = true;
      await unblockIp(blocked.id)
      .then(() => {
        toast.success('차단을 해제했습니다.');
        this.blockedIps = this.blockedIps.filter((item) => item.id !== blocked.id);
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
      })
      .finally(() => {
        this.isBusy = false;
      });
    },
    async saveWords() {
      this.isBusy = true;
      await setBannedWords(this.parsedWords)
      .then((saved) => {
        this.wordsText = saved.words.join('\n');
        toast.success(`금칙어 ${saved.words.length}개를 저장했습니다.`);
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
      })
      .finally(() => {
        this.isBusy = false;
      });
    },
  },
  mounted() {
    this.load();
  },
});
</script>

<style scoped>
.blocks {
  display: grid;
  gap: var(--s-5);
}

.add-form {
  display: grid;
  grid-template-columns: minmax(0, 220px) minmax(0, 1fr) auto;
  gap: var(--s-2);
  padding: var(--s-4) var(--s-5);
  border-bottom: 1px solid var(--border);
}

.ip-list {
  display: grid;
}

.ip-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--s-3);
  align-items: center;
  padding: var(--s-3) var(--s-5);
  border-bottom: 1px solid var(--border);
}

.ip-row:last-child {
  border-bottom: none;
}

.ip-body {
  display: flex;
  align-items: baseline;
  gap: var(--s-3);
  flex-wrap: wrap;
  min-width: 0;
}

.ip {
  font-weight: 700;
}

.reason {
  color: var(--text-2);
  overflow-wrap: anywhere;
}

.words-body {
  display: grid;
  gap: var(--s-2);
}

.foot {
  justify-content: space-between;
  align-items: center;
}

.empty {
  text-align: center;
  color: var(--text-3);
  padding: var(--s-8);
}

@media (max-width: 700px) {
  .add-form {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>

<template>
  <div class="container container-narrow page settings">
    <div class="page-head">
      <div>
        <h1>설정</h1>
        <p class="lead">프로필과 계정을 관리합니다.</p>
      </div>
    </div>

    <section class="card">
      <div class="card-head">
        <h2>프로필</h2>
        <span class="subtle small">{{ account.blogId }}</span>
      </div>
      <div class="card-body profile-grid">
        <div class="avatar-column">
          <account-profile-image class="avatar-large" :simple-account="account"/>
          <button class="btn btn-secondary btn-sm" type="button" @click="selectProfileImageFile">
            <app-icon name="image" :size="14"/>사진 바꾸기
          </button>
        </div>
        <div class="fields">
          <div class="field">
            <label for="name">이름</label>
            <input id="name" class="input" :class="{ invalid: !isNameValid }" type="text" v-model="name"
                   placeholder="글에 표시될 이름" maxlength="32"/>
          </div>
          <div class="field">
            <label for="biography">소개</label>
            <textarea id="biography" class="textarea" :class="{ invalid: !isBiographyValid }" v-model="biography"
                      placeholder="블로그 상단에 보이는 짧은 소개" maxlength="255" rows="3"/>
            <span class="hint">{{ (biography ?? '').length }} / 255</span>
          </div>
          <div class="field-row">
            <div class="field">
              <label for="company">회사</label>
              <input id="company" class="input" :class="{ invalid: !isCompanyValid }" type="text" v-model="company"
                     placeholder="회사" maxlength="64"/>
            </div>
            <div class="field">
              <label for="location">위치</label>
              <input id="location" class="input" :class="{ invalid: !isLocationValid }" type="text" v-model="location"
                     placeholder="예: 서울" maxlength="64"/>
            </div>
          </div>
          <div class="field">
            <label for="homepage">홈페이지</label>
            <input id="homepage" class="input" :class="{ invalid: !isHomepageValid }" type="url" v-model="homepage"
                   placeholder="https://" maxlength="255" inputmode="url"/>
          </div>
        </div>
      </div>
      <div class="card-foot">
        <span v-if="isDirty" class="subtle small unsaved">저장하지 않은 변경이 있어요</span>
        <button class="btn" type="button" :disabled="!isDirty || !isFormValid || isLoading" @click="modifyAccount">
          저장
        </button>
      </div>
    </section>

    <section v-if="statistics" class="card">
      <div class="card-head">
        <h2>내 블로그 통계</h2>
        <router-link class="small" :to="`/${account.blogId}/posts`">내 글 보기</router-link>
      </div>
      <div class="card-body">
        <div class="stat-grid">
          <div class="stat">
            <div class="stat-value num">{{ formatCount(statistics.totalPosts) }}</div>
            <div class="stat-label">전체 글</div>
          </div>
          <div class="stat">
            <div class="stat-value num">{{ formatCount(statistics.publicPosts) }}</div>
            <div class="stat-label">공개 글</div>
          </div>
          <div class="stat">
            <div class="stat-value num">{{ formatCount(statistics.totalHits) }}</div>
            <div class="stat-label">조회</div>
          </div>
          <div class="stat">
            <div class="stat-value num">{{ formatCount(statistics.totalLikes) }}</div>
            <div class="stat-label">좋아요</div>
          </div>
          <div class="stat">
            <div class="stat-value num">{{ formatCount(statistics.totalComments) }}</div>
            <div class="stat-label">댓글</div>
          </div>
        </div>
        <div v-if="statistics.popularPosts && statistics.popularPosts.length > 0" class="popular">
          <div class="popular-title">많이 읽은 글</div>
          <ol class="popular-list">
            <li v-for="(popularPost, index) in statistics.popularPosts" :key="popularPost.id">
              <span class="rank num">{{ index + 1 }}</span>
              <router-link class="popular-link" :to="`/${popularPost.author.blogId}/posts/${popularPost.postUrl}`">
                {{ popularPost.title }}
              </router-link>
              <span class="popular-hits subtle small num">조회 {{ formatCount(popularPost.hits) }}</span>
            </li>
          </ol>
        </div>
      </div>
    </section>

    <section class="card">
      <div class="card-head">
        <h2>AI 에이전트에게 맡기기</h2>
      </div>
      <div class="card-body agent">
        <div class="agent-icon"><app-icon name="bot" :size="22"/></div>
        <div>
          <p>
            Claude Code 같은 코딩 에이전트에게 글쓰기나 기존 글 검토를 맡길 수 있습니다. 에이전트는 <b>기기 로그인</b>으로
            내 권한 안에서만 쓸 수 있는 액세스 토큰을 받아 가고, 토큰은 언제든 폐기할 수 있습니다.
          </p>
          <div class="agent-actions">
            <router-link class="btn btn-secondary btn-sm" to="/agents">가이드 보기</router-link>
            <router-link class="btn btn-sm" to="/tokens">액세스 토큰 관리</router-link>
          </div>
        </div>
      </div>
    </section>

    <section class="card">
      <div class="card-head">
        <h2>계정</h2>
      </div>
      <div class="card-body account-rows">
        <div class="account-row">
          <div>
            <div class="row-title">이메일</div>
            <div class="muted small">{{ account.email }}</div>
          </div>
        </div>
        <div class="account-row">
          <div>
            <div class="row-title">비밀번호</div>
            <div class="muted small">가입 이메일로 재설정 링크를 보내 드립니다.</div>
          </div>
          <button class="btn btn-secondary btn-sm" type="button" :disabled="isLoading" @click="sendResetPasswordUrlToEmail">
            재설정 메일 보내기
          </button>
        </div>
        <div class="account-row danger-row">
          <div>
            <div class="row-title">회원 탈퇴</div>
            <div class="muted small">모든 글과 댓글이 완전히 삭제되며 되돌릴 수 없습니다.</div>
          </div>
          <button class="btn btn-danger-ghost btn-sm" type="button" :disabled="isLoading" @click="deleteAccount">
            탈퇴하기
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { AccountDto } from '@/api/models/account.dtos';
import { BlogStatisticsDto } from '@/api/models/blog.dtos';
import { HttpApiError } from '@/api/common/httpApiClient';
import {
  deleteCurrentAccount,
  getCurrentAccount,
  modifyAccountInfo,
  sendResetPasswordUrlToEmail,
  setCurrentProfileImage,
} from '@/api/accounts';
import { getMyStatistics } from '@/api/blog';
import AccountProfileImage from '@/components/accounts/AccountProfileImage.vue';
import AppIcon from '@/components/common/AppIcon.vue';
import store from '@/store';
import { confirmDialog, toast } from '@/utils/dialog';
import { formatCount } from '@/utils/format';

export default defineComponent({
  name: 'SettingView',
  components: { AppIcon, AccountProfileImage },
  data() {
    return {
      account: {} as AccountDto,
      statistics: null as BlogStatisticsDto | null,
      isLoading: false,
      name: '',
      biography: '',
      company: '',
      location: '',
      homepage: '',
    };
  },
  computed: {
    isDirty(): boolean {
      if (!this.account) {
        return false;
      }
      return this.account.name !== this.name
          || (this.account.biography ?? '') !== (this.biography ?? '')
          || (this.account.company ?? '') !== (this.company ?? '')
          || (this.account.location ?? '') !== (this.location ?? '')
          || (this.account.homepage ?? '') !== (this.homepage ?? '');
    },
    isNameValid(): boolean {
      return this.name.length > 0 && this.name.length <= 32;
    },
    isBiographyValid(): boolean {
      return !this.biography || this.biography.length <= 255;
    },
    isCompanyValid(): boolean {
      return !this.company || this.company.length <= 64;
    },
    isLocationValid(): boolean {
      return !this.location || this.location.length <= 64;
    },
    isHomepageValid(): boolean {
      return !this.homepage || this.homepage.length <= 255;
    },
    isFormValid(): boolean {
      return this.isNameValid && this.isBiographyValid && this.isCompanyValid && this.isLocationValid && this.isHomepageValid;
    },
  },
  methods: {
    formatCount,
    updateAccount(account: AccountDto) {
      this.account = account;
      this.name = account.name;
      this.biography = account.biography ?? '';
      this.company = account.company ?? '';
      this.location = account.location ?? '';
      this.homepage = account.homepage ?? '';
    },
    async loadAccount() {
      await getCurrentAccount()
      .then((account) => {
        this.updateAccount(account);
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
        this.$router.push('/');
      });
    },
    async modifyAccount() {
      this.isLoading = true;
      await modifyAccountInfo({
        name: this.name,
        biography: this.biography ? this.biography : null,
        company: this.company ? this.company : null,
        location: this.location ? this.location : null,
        homepage: this.homepage ? this.homepage : null,
      })
      .then((account) => {
        this.updateAccount(account);
        store.dispatch('accountStore/updateCurrentAccountInfo');
        toast.success('프로필을 저장했습니다.');
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
      })
      .finally(() => {
        this.isLoading = false;
      });
    },
    async deleteAccount() {
      const ok = await confirmDialog({
        title: '정말 탈퇴할까요?',
        message: '모든 글과 댓글이 완전히 삭제되며 복구할 수 없습니다.',
        confirmLabel: '탈퇴',
        danger: true,
      });
      if (!ok) {
        return;
      }

      this.isLoading = true;
      await deleteCurrentAccount()
      .then(async () => {
        toast.info('탈퇴를 마쳤습니다. 그동안 고마웠어요.');
        await store.dispatch('accountStore/signOut', true);
        await store.dispatch('cacheStore/clearMainPosts');
        this.$router.push('/');
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
      })
      .finally(() => {
        this.isLoading = false;
      });
    },
    selectProfileImageFile() {
      const input = document.createElement('input') as HTMLInputElement;
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (!target.files?.length) {
          return;
        }
        const file = target.files[0];
        if (!file.type.startsWith('image')) {
          toast.error('이미지 파일을 선택해 주세요.');
          return;
        }

        await setCurrentProfileImage(file)
        .then((account) => {
          this.account = account;
          store.dispatch('accountStore/updateCurrentAccountInfo');
          toast.success('프로필 사진을 바꿨습니다.');
        })
        .catch((error: HttpApiError) => {
          toast.error(error.getErrorMessage());
        });
      };
      input.click();
    },
    async sendResetPasswordUrlToEmail() {
      this.isLoading = true;
      await sendResetPasswordUrlToEmail(this.account.email)
      .then(() => {
        toast.success(`${this.account.email} 로 비밀번호 재설정 방법을 보냈습니다.`);
      }).catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
      })
      .finally(() => {
        this.isLoading = false;
      });
    },
    async loadStatistics() {
      await getMyStatistics()
      .then((statistics) => {
        this.statistics = statistics;
      })
      .catch(() => {
        // 통계 조회 실패는 설정 화면 노출에 영향을 주지 않으므로 조용히 무시한다.
      });
    },
  },
  created() {
    this.loadAccount();
    this.loadStatistics();
  },
});
</script>

<style scoped>
.settings {
  display: grid;
  gap: var(--s-6);
  align-content: start;
}

.profile-grid {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--s-8);
}

.avatar-column {
  display: grid;
  justify-items: center;
  gap: var(--s-3);
  align-content: start;
}

.avatar-large {
  width: 120px;
  height: 120px;
}

.fields {
  display: grid;
  gap: var(--s-4);
  min-width: 0;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s-4);
}

.unsaved {
  margin-right: auto;
  align-self: center;
}

.card-foot {
  align-items: center;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: var(--s-3);
}

.stat {
  padding: var(--s-4);
  border-radius: var(--radius);
  background: var(--surface-2);
  text-align: center;
}

.stat-value {
  font-size: var(--text-2xl);
  font-weight: 800;
  letter-spacing: -0.02em;
}

.stat-label {
  font-size: var(--text-xs);
  color: var(--text-2);
  margin-top: 2px;
}

.popular {
  margin-top: var(--s-6);
}

.popular-title {
  font-weight: 700;
  margin-bottom: var(--s-2);
}

.popular-list {
  display: grid;
}

.popular-list li {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--s-3);
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}

.popular-list li:last-child {
  border-bottom: none;
}

.rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent-text);
  display: grid;
  place-items: center;
  font-size: var(--text-xs);
  font-weight: 700;
}

.popular-link {
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.agent {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--s-4);
  color: var(--text-2);
  line-height: 1.65;
}

.agent-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent-text);
  display: grid;
  place-items: center;
}

.agent-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
  margin-top: var(--s-3);
}

.account-rows {
  display: grid;
  padding-block: var(--s-2);
}

.account-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--s-4);
  padding: var(--s-4) 0;
  border-bottom: 1px solid var(--border);
}

.account-row:last-child {
  border-bottom: none;
}

.row-title {
  font-weight: 600;
}

@media (max-width: 640px) {
  .profile-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--s-5);
  }

  .field-row {
    grid-template-columns: minmax(0, 1fr);
  }

  .account-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

<template>
  <div class="setting-container">
    <div class="scroll-area">
    <div class="account-info-container form-wrapper">
      <div class="title">
        내 정보 수정
      </div>
      <div class="profile-container">
        <div class="profile-image">
          <account-profile-image-button :simple-account="account"/>
          <button class="modify-profile-image-button" @click="selectProfileImageFile">🖼️</button>
        </div>
        <div class="bio">
          <label for="name">이름</label>
          <input id="name" class="name" :class="{'invalid': !isNameValid}" type="text" v-model="name"
                 placeholder="이름" maxlength="32"/>
          <label for="biography">간단한 자기소개</label>
          <textarea id="biography" class="biography" :class="{'invalid': !isBiographyValid}" type="text"
                    v-model="biography"
                    placeholder="간단한 자기소개" maxlength="255"/>
          <label for="company">회사</label>
          <input id="company" :class="{'invalid': !isCompanyValid}" type="text" v-model="company"
                 placeholder="회사" maxlength="64"/>
          <label for="location">위치</label>
          <input id="location" :class="{'invalid': !isLocationValid}" type="text" v-model="location"
                 placeholder="위치" maxlength="64"/>
          <label for="homepage">홈페이지</label>
          <input id="homepage" :class="{'invalid': !isHomepageValid}" type="text" v-model="homepage"
                 placeholder="홈페이지" maxlength="255"/>
        </div>
      </div>
      <div class="etc-container">
        <button class="form-button"
                :disabled="isLoading"
                @click="sendResetPasswordUrlToEmail">비밀번호 재설정
        </button>
      </div>
    </div>
    <div class="statistics-container form-wrapper" v-if="statistics">
      <div class="title">내 블로그 통계</div>
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-value">{{ statistics.totalPosts }}</div>
          <div class="stat-label">전체 게시글</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ statistics.publicPosts }}</div>
          <div class="stat-label">공개 게시글</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ statistics.totalHits }}</div>
          <div class="stat-label">총 조회수</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ statistics.totalLikes }}</div>
          <div class="stat-label">총 좋아요</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ statistics.totalComments }}</div>
          <div class="stat-label">총 댓글</div>
        </div>
      </div>
      <div v-if="statistics.popularPosts && statistics.popularPosts.length > 0" class="popular-posts">
        <div class="popular-title">인기 게시글 (조회수 순)</div>
        <ol>
          <li v-for="popularPost in statistics.popularPosts" :key="popularPost.id">
            <router-link :to="`/${popularPost.author.blogId}/posts/${popularPost.postUrl}`">
              {{ popularPost.title }}
            </router-link>
            <span class="popular-hits">{{ popularPost.hits }} 회</span>
          </li>
        </ol>
      </div>
    </div>
    </div>
    <div class="footer">
      <button class="form-button red-button"
              @click="deleteAccount">
        탈퇴하기
      </button>
      <button class="form-button"
              :disabled="!isDirty || isLoading"
              @click="modifyAccount">
        수정하기
      </button>
    </div>
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
import AccountProfileImageButton from '@/components/accounts/AccountProfileImageButton.vue';
import store from '@/store';

export default defineComponent({
  name: 'SettingView',
  components: { AccountProfileImageButton },
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
      return !this.biography || (this.biography.length >= 0 && this.biography.length <= 255);
    },
    isCompanyValid(): boolean {
      return !this.company || (this.company.length >= 0 && this.company.length <= 64);
    },
    isLocationValid(): boolean {
      return !this.location || (this.location.length >= 0 && this.location.length <= 64);
    },
    isHomepageValid(): boolean {
      return !this.homepage || (this.homepage.length >= 0 && this.homepage.length <= 255);
    },
  },
  methods: {
    updateAccount(account: AccountDto) {
      this.account = account;

      this.name = account.name;
      this.biography = account.biography;
      this.company = account.company;
      this.location = account.location;
      this.homepage = account.homepage;
    },
    async loadAccount() {
      await getCurrentAccount()
      .then((account) => {
        this.updateAccount(account);
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
        this.$router.push(`/`);
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
        alert('수정되었습니다.');
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      })
      .finally(() => {
        this.isLoading = false;
      });
    },
    async deleteAccount() {
      if (!confirm('탈퇴 시 모든 게시글과 댓글이 완전히 삭제되며 복구할 수 없습니다.\n탈퇴 하시겠습니까?')) {
        return;
      }

      this.isLoading = true;
      await deleteCurrentAccount()
      .then(async () => {
        alert('탈퇴되었습니다.');
        await store.dispatch('accountStore/signOut', true);
        await store.dispatch('cacheStore/clearMainPosts');
        this.$router.push(`/`);
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
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
          alert('이미지 파일을 선택해주세요.');
          return;
        }

        await setCurrentProfileImage(file)
        .then((account) => {
          this.account = account;
          store.dispatch('accountStore/updateCurrentAccountInfo');
          alert('프로필 이미지를 변경하였습니다.');
        })
        .catch((error: HttpApiError) => {
          alert(error.getErrorMessage());
        });
      };
      input.click();
    },
    async sendResetPasswordUrlToEmail() {
      this.isLoading = true;
      await sendResetPasswordUrlToEmail(this.account.email)
      .then(() => {
        alert(`계정 비밀번호 재설정에 대한 방법을 ${this.account.email} 이메일로 보냈습니다.`);
      }).catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
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

.setting-container {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: minmax(0, 1fr) 50px;

  width: 100%;
  height: 100%;

  box-sizing: border-box;
}

.scroll-area {
  overflow-y: auto;
  min-height: 0;
}

.account-info-container,
.statistics-container {
  display: grid;
  grid-template-columns: 750px;
  grid-template-rows: auto;

  align-content: start;
  justify-content: center;
  padding: var(--base-gap);
  box-sizing: border-box;
}

@media (max-width: 800px) {
  .account-info-container,
  .statistics-container {
    grid-template-columns: minmax(0, auto);
    justify-content: stretch;
  }
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  grid-gap: 10px;
  padding: var(--base-gap) 0;
}

.stat-card {
  border: 1px solid var(--border-color);
  border-radius: var(--base-border-radius);
  padding: 1em;
  text-align: center;
}

.stat-value {
  font-size: 1.8em;
  font-weight: bold;
}

.stat-label {
  font-size: 0.85em;
  font-weight: 300;
  margin-top: 0.25em;
}

.popular-posts {
  padding-top: var(--base-gap);
}

.popular-title {
  font-weight: bold;
  margin-bottom: 0.5em;
}

.popular-posts ol {
  list-style: decimal;
  margin-left: 1.5em;
  line-height: 1.9;
}

.popular-posts a {
  color: var(--base-color);
}

.popular-posts a:hover {
  color: var(--link-accent-color);
}

.popular-hits {
  font-size: 0.8em;
  font-weight: 300;
  margin-left: 0.5em;
  color: var(--link-accent-color);
}

.title {
  text-align: center;
  font-size: 2em;
  font-weight: bold;
  margin-top: var(--base-gap);
  padding-bottom: var(--base-gap);
  border-bottom: 1px solid var(--border-color);
  box-sizing: border-box;
}

.profile-container {
  display: grid;

  grid-template-columns: minmax(150px, 1fr) 3fr;
  grid-template-rows: auto;

  padding: 2em 0;

  box-sizing: border-box;
  border-bottom: 1px solid var(--border-color);
}

.profile-image {
  align-self: start;
  position: relative;
}

.modify-profile-image-button {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 25%;
  height: auto;
  aspect-ratio: 1;
  border-radius: 100%;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-size: 1.25em;
}

.bio {
  display: grid;

  grid-template-columns: 1fr;
  grid-auto-rows: auto;

  margin-left: 2em;

  grid-row-gap: 0.5em;
}

.bio label {
  margin-bottom: -0.25em;
}

.bio .name {
  font-size: 2.5em;
}

.bio .biography {
  font-size: 1em;
  min-height: 100px;
  height: 100%;
}

.footer {
  display: flex;

  justify-content: space-between;
  align-items: center;

  background: var(--footer-background-color);
  padding: 0 var(--base-gap)
}

.setting-container .form-button {
  min-width: 100px;
}

.etc-container {
  display: grid;

  justify-content: end;

  padding: var(--base-gap) 0;
}

.etc-container button {
  min-height: 0;
  font-size: 13px;
}

</style>

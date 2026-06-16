<template>
  <div class="follow-list-container">
    <div class="header">
      {{ mode === 'followers' ? '팔로워' : '팔로잉' }}
    </div>
    <div class="empty-message" v-if="!isLoading && isEmpty">
      {{ mode === 'followers' ? '아직 팔로워가 없습니다.' : '아직 팔로우하는 사용자가 없습니다.' }}
    </div>
    <div class="account-list">
      <router-link v-for="account in accounts" :key="account.blogId"
                   class="account-item" :to="{path: `/${account.blogId}`}">
        <div class="profile-image">
          <account-profile-image-button :simple-account="account"/>
        </div>
        <div class="name">{{ account.name }}</div>
      </router-link>
    </div>
    <observer-trigger
        v-if="!isNoMorePage && !isLoading"
        class="observer-trigger-enable"
        v-on:trigger="loadMore"/>
    <div class="loading" v-if="isLoading">
      <loading-spinner/>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { SimpleAccountDto } from '@/api/models/account.dtos';
import { getFollowers, getFollowings } from '@/api/follow';
import { HttpApiError } from '@/api/common/httpApiClient';
import AccountProfileImageButton from '@/components/accounts/AccountProfileImageButton.vue';
import ObserverTrigger from '@/components/common/ObserverTrigger.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';

export default defineComponent({
  name: 'FollowListView',
  components: { LoadingSpinner, ObserverTrigger, AccountProfileImageButton },
  props: {
    blogId: {
      type: String,
      required: true,
    },
    mode: {
      type: String as PropType<'followers' | 'followings'>,
      required: true,
    },
  },
  data() {
    return {
      accounts: Array<SimpleAccountDto>(),
      cursorId: '',
      isNoMorePage: true,
      isLoading: false,
      isEmpty: false,
    };
  },
  watch: {
    blogId() {
      this.fetch();
    },
    mode() {
      this.fetch();
    },
  },
  methods: {
    async fetch(cursorId: string | null = null) {
      try {
        this.isLoading = true;
        const request = this.mode === 'followers'
            ? getFollowers(this.blogId, 20, cursorId)
            : getFollowings(this.blogId, 20, cursorId);
        await request
        .then((accounts) => {
          if (accounts.first) {
            this.accounts = accounts.data;
          } else {
            accounts.data.forEach((account) => {
              this.accounts.push(account);
            });
          }
          this.cursorId = (!accounts.last && accounts.cursorId) ? accounts.cursorId : '';
          this.isNoMorePage = accounts.last;
          this.isEmpty = accounts.last && this.accounts.length === 0;
        })
        .catch((error: HttpApiError) => {
          alert(error.getErrorMessage());
        });
      } finally {
        this.isLoading = false;
      }
    },
    async loadMore() {
      if (this.cursorId) {
        await this.fetch(this.cursorId);
      }
    },
  },
  mounted() {
    this.fetch();
  },
});
</script>

<style scoped>

.header {
  font-size: 1.25em;
  font-weight: bold;
  padding-bottom: var(--half-base-gab);
  border-bottom: 1px solid var(--border-color);
  margin-bottom: var(--base-gap);
}

.account-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--base-gap);
}

.account-item {
  display: flex;
  align-items: center;
  gap: 1em;
  color: var(--base-color);
}

.account-item .profile-image {
  width: 48px;
  height: 48px;
}

.account-item .name {
  font-size: 1.1em;
}

@media (hover: hover) and (pointer: fine) {
  .account-item:hover {
    text-decoration: none;
    opacity: 0.8;
  }
}

.empty-message {
  text-align: center;
  font-size: 1.25em;
  font-weight: bold;
  padding-top: 2em;
}

.observer-trigger-enable {
  height: 680px;
  position: relative;
  margin-top: -600px;
}

.loading {
  display: flex;
  justify-content: center;
  box-sizing: border-box;
  height: 80px;
}

</style>

<template>
  <div class="follow-list">
    <nav class="tabs" aria-label="팔로우 목록">
      <router-link :to="`/${blogId}/followers`">팔로워</router-link>
      <router-link :to="`/${blogId}/followings`">팔로잉</router-link>
    </nav>
    <div v-if="!isLoading && isEmpty" class="empty-state">
      <div class="empty-icon"><app-icon name="users" :size="26"/></div>
      <div class="empty-title">{{ mode === 'followers' ? '아직 팔로워가 없습니다' : '아직 팔로우하는 사람이 없습니다' }}</div>
    </div>
    <div class="account-list">
      <router-link v-for="account in accounts" :key="account.blogId" class="account-item" :to="`/${account.blogId}`">
        <account-profile-image class="account-avatar" :simple-account="account"/>
        <span class="account-text">
          <span class="account-name">{{ account.name }}</span>
          <span class="account-id subtle small">{{ account.blogId }}</span>
        </span>
        <app-icon class="chevron" name="chevron-right" :size="18"/>
      </router-link>
    </div>
    <observer-trigger v-if="!isNoMorePage && !isLoading" @trigger="loadMore"/>
    <div v-if="isLoading" class="loading">
      <loading-spinner/>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { SimpleAccountDto } from '@/api/models/account.dtos';
import { getFollowers, getFollowings } from '@/api/follow';
import { HttpApiError } from '@/api/common/httpApiClient';
import AccountProfileImage from '@/components/accounts/AccountProfileImage.vue';
import ObserverTrigger from '@/components/common/ObserverTrigger.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import AppIcon from '@/components/common/AppIcon.vue';
import { toast } from '@/utils/dialog';

export default defineComponent({
  name: 'FollowListView',
  components: { AppIcon, LoadingSpinner, ObserverTrigger, AccountProfileImage },
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
          toast.error(error.getErrorMessage());
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
.follow-list {
  display: grid;
  gap: var(--s-4);
}

.account-list {
  display: grid;
}

.account-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-3) var(--s-2);
  border-radius: var(--radius);
  color: var(--text);
}

.account-item:hover {
  background: var(--hover-color);
  text-decoration: none;
}

.account-avatar {
  width: 44px;
  height: 44px;
}

.account-text {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.account-name {
  font-weight: 700;
}

.chevron {
  color: var(--text-3);
}

.loading {
  display: flex;
  justify-content: center;
  height: 64px;
}
</style>

<template>
  <div class="members">
    <div class="page-head">
      <div>
        <h1>회원</h1>
        <p class="lead">가입한 회원을 찾고, 정지하거나 관리자 권한을 줍니다.</p>
      </div>
    </div>

    <form class="toolbar" @submit.prevent="applySearch">
      <div class="search-box">
        <app-icon class="search-icon" name="search" :size="18"/>
        <input v-model="search" class="input" type="search" placeholder="이메일 · 이름 · 블로그 주소로 찾기"/>
      </div>
      <select v-model="filter" class="select filter" aria-label="상태 필터">
        <option value="all">전체</option>
        <option value="active">활성</option>
        <option value="disabled">정지</option>
        <option value="admin">관리자</option>
      </select>
      <button class="btn" type="submit">검색</button>
    </form>

    <div class="card flush">
      <div class="table-wrapper">
        <table class="table">
          <thead>
          <tr>
            <th>회원</th>
            <th>이메일</th>
            <th>역할</th>
            <th>가입일</th>
            <th>상태</th>
            <th class="right">관리</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="account in filteredAccounts" :key="account.id" :class="{ muted: account.deleted }">
            <td>
              <router-link class="member" :to="`/${account.blogId}`">
                <span class="avatar member-avatar" :style="avatarStyle(account)"/>
                <span class="member-text">
                  <span class="member-name">{{ account.name }}</span>
                  <span class="member-id subtle">{{ account.blogId }}</span>
                </span>
              </router-link>
              <router-link class="small" :to="`/admin/members/${account.id}`">활동 보기</router-link>
            </td>
            <td class="mono small">{{ account.email }}</td>
            <td>
              <span v-for="role in displayRoles(account.roles)" :key="role" class="badge" :class="{ 'badge-accent': role === 'ADMIN' }">{{ role }}</span>
            </td>
            <td class="small num">{{ formatDate(account.createdAt) }}</td>
            <td>
              <span class="badge" :class="account.deleted ? 'badge-danger' : 'badge-success'">{{ account.deleted ? '정지' : '활성' }}</span>
            </td>
            <td class="right actions">
              <button v-if="!account.deleted && !isAdminRole(account)" class="btn btn-danger-ghost btn-sm" type="button"
                      :disabled="isLoading" @click="disable(account)">정지</button>
              <button v-else-if="account.deleted" class="btn btn-secondary btn-sm" type="button"
                      :disabled="isLoading" @click="restore(account)">정지 해제</button>
              <button v-if="!account.deleted && !isAdminRole(account)" class="btn btn-ghost btn-sm" type="button"
                      :disabled="isLoading" @click="setAdmin(account, true)">관리자 지정</button>
              <button v-else-if="isAdminRole(account) && !isMe(account)" class="btn btn-ghost btn-sm" type="button"
                      :disabled="isLoading" @click="setAdmin(account, false)">관리자 해제</button>
              <span v-else-if="isMe(account)" class="subtle small">나</span>
            </td>
          </tr>
          <tr v-if="!isLoading && filteredAccounts.length === 0">
            <td colspan="6" class="empty">회원이 없습니다.</td>
          </tr>
          </tbody>
        </table>
      </div>
      <div class="card-foot">
        <span class="subtle small">{{ accounts.length }}명 표시</span>
        <button v-if="!isNoMorePage && !isLoading" class="btn btn-secondary btn-sm" type="button" @click="loadMore">더 보기</button>
        <span v-if="isLoading" class="loading-inline"><loading-spinner :size="18"/></span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { AdminAccountDto } from '@/api/models/admin.dtos';
import { disableAccount, getAccounts, restoreAccount, setAdminRole } from '@/api/admin';
import { attachmentFileBaseUrl, HttpApiError } from '@/api/common/httpApiClient';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import AppIcon from '@/components/common/AppIcon.vue';
import store from '@/store';
import { confirmDialog, toast } from '@/utils/dialog';
import { formatDate } from '@/utils/format';

export default defineComponent({
  name: 'AdminMembersView',
  components: { AppIcon, LoadingSpinner },
  data() {
    return {
      accounts: Array<AdminAccountDto>(),
      search: '',
      appliedSearch: '',
      filter: 'all' as 'all' | 'active' | 'disabled' | 'admin',
      cursorId: '',
      isNoMorePage: true,
      isLoading: false,
    };
  },
  computed: {
    filteredAccounts(): Array<AdminAccountDto> {
      return this.accounts.filter((account) => {
        if (this.filter === 'active') return !account.deleted;
        if (this.filter === 'disabled') return account.deleted;
        if (this.filter === 'admin') return this.isAdminRole(account);
        return true;
      });
    },
  },
  methods: {
    formatDate,
    isAdminRole(account: AdminAccountDto): boolean {
      return account.roles.includes('ROLE_ADMIN');
    },
    isMe(account: AdminAccountDto): boolean {
      return account.blogId === store.state.accountStore.blogId;
    },
    displayRoles(roles: Array<string>): Array<string> {
      return roles.map((r) => r.replace('ROLE_', '')).filter((r) => r !== 'USER' || roles.length === 1);
    },
    avatarStyle(account: AdminAccountDto) {
      const url = account.profileImageUrl ? `${attachmentFileBaseUrl}${account.profileImageUrl}` : require('@/assets/profile.svg');
      return { backgroundImage: `url(${url})` };
    },
    async fetchAccounts(cursorId: string | null = null) {
      try {
        this.isLoading = true;
        await getAccounts(30, this.appliedSearch || null, cursorId)
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
        await this.fetchAccounts(this.cursorId);
      }
    },
    applySearch() {
      this.appliedSearch = this.search.trim();
      this.fetchAccounts();
    },
    async disable(account: AdminAccountDto) {
      const ok = await confirmDialog({
        title: `${account.name} 회원을 정지할까요?`,
        message: '정지된 회원은 로그인할 수 없고, 글과 댓글은 그대로 남습니다. 언제든 해제할 수 있습니다.',
        confirmLabel: '정지',
        danger: true,
      });
      if (!ok) {
        return;
      }
      this.isLoading = true;
      await disableAccount(account.id)
      .then(() => {
        toast.success(`${account.name} 회원을 정지했습니다.`);
        this.fetchAccounts();
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
        this.isLoading = false;
      });
    },
    async restore(account: AdminAccountDto) {
      this.isLoading = true;
      await restoreAccount(account.id)
      .then(() => {
        toast.success(`${account.name} 회원의 정지를 해제했습니다.`);
        this.fetchAccounts();
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
        this.isLoading = false;
      });
    },
    async setAdmin(account: AdminAccountDto, admin: boolean) {
      const ok = await confirmDialog({
        title: admin ? `${account.name} 님을 관리자로 지정할까요?` : `${account.name} 님의 관리자 권한을 뺄까요?`,
        message: admin ? '관리자는 모든 회원·글·댓글을 관리할 수 있습니다.' : '일반 회원으로 돌아갑니다.',
        confirmLabel: admin ? '지정' : '해제',
        danger: !admin,
      });
      if (!ok) {
        return;
      }
      this.isLoading = true;
      await setAdminRole(account.id, admin)
      .then((updated) => {
        this.accounts.splice(this.accounts.findIndex((x) => x.id === updated.id), 1, updated);
        toast.success(admin ? '관리자로 지정했습니다.' : '관리자 권한을 뺐습니다.');
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
    this.fetchAccounts();
  },
});
</script>

<style scoped>
.members {
  display: grid;
  gap: var(--s-5);
}

.toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: var(--s-2);
}

.search-box {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-3);
  pointer-events: none;
}

.search-box .input {
  padding-left: 38px;
}

.filter {
  width: 130px;
}

.card.flush {
  overflow: hidden;
}

.table-wrapper {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.table th,
.table td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  text-align: left;
  vertical-align: middle;
  white-space: nowrap;
}

.table th {
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: var(--surface-2);
}

.table tr.muted td {
  opacity: 0.55;
}

.table .right {
  text-align: right;
}

.member {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--text);
}

.member-avatar {
  width: 32px;
  height: 32px;
}

.member-text {
  display: grid;
  line-height: 1.3;
}

.member-name {
  font-weight: 700;
}

.member-id {
  font-size: var(--text-xs);
}

.badge + .badge {
  margin-left: 4px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}

.empty {
  text-align: center;
  color: var(--text-3);
  padding: var(--s-10) !important;
}

.card-foot {
  justify-content: space-between;
  align-items: center;
}

.loading-inline {
  display: inline-flex;
}

@media (max-width: 640px) {
  .toolbar {
    grid-template-columns: minmax(0, 1fr);
  }

  .filter {
    width: 100%;
  }
}
</style>

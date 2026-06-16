<template>
  <div class="admin-container">
    <h1>관리자</h1>

    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-label">회원 수</div>
        <div class="stat-value">{{ statistics.memberCount }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">게시글 수</div>
        <div class="stat-value">{{ statistics.postCount }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">댓글 수</div>
        <div class="stat-value">{{ statistics.commentCount }}</div>
      </div>
    </div>

    <div class="toolbar">
      <input v-model="search" class="search-input" type="text" placeholder="이메일 / 이름 / 블로그 Id 검색"
             @keyup.enter="applySearch"/>
      <button class="search-button" @click="applySearch">검색</button>
    </div>

    <div class="table-wrapper">
      <table class="member-table">
        <thead>
        <tr>
          <th>이름</th>
          <th>이메일</th>
          <th>블로그 Id</th>
          <th>역할</th>
          <th>가입일</th>
          <th>상태</th>
          <th>관리</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="account in accounts" :key="account.id" :class="{ disabled: account.deleted }">
          <td>{{ account.name }}</td>
          <td>{{ account.email }}</td>
          <td>
            <router-link :to="{path: `/${account.blogId}`}">{{ account.blogId }}</router-link>
          </td>
          <td class="roles">{{ displayRoles(account.roles) }}</td>
          <td>{{ formatDate(account.createdAt) }}</td>
          <td>
            <span :class="account.deleted ? 'badge-disabled' : 'badge-active'">
              {{ account.deleted ? '정지' : '활성' }}
            </span>
          </td>
          <td>
            <button v-if="!account.deleted && !isAdminRole(account)"
                    class="action danger" :disabled="isLoading" @click="disable(account)">정지
            </button>
            <button v-else-if="account.deleted"
                    class="action" :disabled="isLoading" @click="restore(account)">해제
            </button>
            <span v-else>-</span>
          </td>
        </tr>
        <tr v-if="!isLoading && accounts.length === 0">
          <td colspan="7" class="empty">회원이 없습니다.</td>
        </tr>
        </tbody>
      </table>
    </div>

    <div class="footer">
      <button v-if="!isNoMorePage && !isLoading" class="more-button" @click="loadMore">더 보기</button>
      <div v-if="isLoading" class="loading">
        <loading-spinner/>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { AdminAccountDto, AdminStatisticsDto } from '@/api/models/admin.dtos';
import { disableAccount, getAccounts, getStatistics, restoreAccount } from '@/api/admin';
import { HttpApiError } from '@/api/common/httpApiClient';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';

export default defineComponent({
  name: 'AdminView',
  components: { LoadingSpinner },
  data() {
    return {
      statistics: { memberCount: 0, postCount: 0, commentCount: 0 } as AdminStatisticsDto,
      accounts: Array<AdminAccountDto>(),
      search: '',
      appliedSearch: '',
      cursorId: '',
      isNoMorePage: true,
      isLoading: false,
    };
  },
  methods: {
    isAdminRole(account: AdminAccountDto): boolean {
      return account.roles.includes('ROLE_ADMIN');
    },
    displayRoles(roles: Array<string>): string {
      return roles.map((r) => r.replace('ROLE_', '')).join(', ');
    },
    formatDate(value: Date): string {
      if (!value) {
        return '';
      }
      const date = new Date(value);
      return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}.`;
    },
    async loadStatistics() {
      await getStatistics()
      .then((statistics) => {
        this.statistics = statistics;
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      });
    },
    async fetchAccounts(cursorId: string | null = null) {
      try {
        this.isLoading = true;
        await getAccounts(20, this.appliedSearch || null, cursorId)
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
          alert(error.getErrorMessage());
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
      if (!confirm(`'${account.name}' 회원을 정지하시겠습니까?`)) {
        return;
      }
      this.isLoading = true;
      await disableAccount(account.id)
      .then(() => {
        this.fetchAccounts();
        this.loadStatistics();
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
        this.isLoading = false;
      });
    },
    async restore(account: AdminAccountDto) {
      this.isLoading = true;
      await restoreAccount(account.id)
      .then(() => {
        this.fetchAccounts();
        this.loadStatistics();
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
        this.isLoading = false;
      });
    },
  },
  mounted() {
    this.loadStatistics();
    this.fetchAccounts();
  },
});
</script>

<style scoped>

.admin-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: var(--base-gap);
  box-sizing: border-box;
}

h1 {
  margin-bottom: var(--base-gap);
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--base-gap);
  margin-bottom: calc(var(--base-gap) * 1.5);
}

@media (max-width: 650px) {
  .stat-cards {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  border: 1px solid var(--border-color);
  border-radius: var(--base-border-radius);
  padding: var(--base-gap);
  text-align: center;
}

.stat-label {
  font-size: 0.9em;
  opacity: 0.7;
  margin-bottom: 0.5em;
}

.stat-value {
  font-size: 2em;
  font-weight: bold;
}

.toolbar {
  display: flex;
  gap: var(--half-base-gab);
  margin-bottom: var(--base-gap);
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--base-border-radius);
  background: var(--background-color);
  color: var(--base-color);
}

.search-button,
.more-button {
  padding: 8px 18px;
  border-radius: var(--base-border-radius);
  border: 1px solid var(--button-color);
  background: var(--button-color);
  color: white;
  cursor: pointer;
}

.table-wrapper {
  overflow-x: auto;
}

.member-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9em;
}

.member-table th,
.member-table td {
  border-bottom: 1px solid var(--border-color);
  padding: 10px 8px;
  text-align: left;
  white-space: nowrap;
}

.member-table a {
  color: var(--link-accent-color);
}

.member-table tr.disabled {
  opacity: 0.5;
}

.roles {
  font-size: 0.85em;
}

.badge-active {
  color: #2e7d32;
  font-weight: bold;
}

.badge-disabled {
  color: #c62828;
  font-weight: bold;
}

.action {
  padding: 4px 12px;
  border-radius: var(--base-border-radius);
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--base-color);
  cursor: pointer;
}

.action.danger {
  border-color: #c62828;
  color: #c62828;
}

.action:disabled {
  opacity: 0.5;
  cursor: default;
}

.empty {
  text-align: center;
  padding: 2em 0;
  opacity: 0.6;
}

.footer {
  display: flex;
  justify-content: center;
  margin-top: var(--base-gap);
  min-height: 50px;
}

.loading {
  display: flex;
  justify-content: center;
  height: 50px;
}

</style>

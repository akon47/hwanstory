<template>
  <div class="account-summary-container">
    <div class="dropdown-container" :style="profileImageUrl">
      <details>
        <summary/>
        <div class="dropdown-content">
          <a @click="goToMyBlog">내 블로그</a>
          <a @click="goToSetting">내 정보 수정</a>
          <a @click="signOut">로그아웃</a>
        </div>
      </details>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { HttpApiError, attachmentFileBaseUrl } from '@/api/common/httpApiClient';
import store from '@/store';

export default defineComponent({
  name: 'AccountSummaryMenuButton',
  computed: {
    profileImageUrl() {
      const profileImageUrl = store.state.accountStore.profileImageUrl;
      if (profileImageUrl) {
        return {
          backgroundImage: `url(${attachmentFileBaseUrl}${profileImageUrl})`,
        };
      } else {
        return {
          backgroundImage: `url(${require('@/assets/profile.svg')})`,
        };
      }
    },
  },
  methods: {
    async signOut() {
      await store.dispatch('accountStore/signOut')
      .then(() => {
        alert('로그아웃 되었습니다.');
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      });
    },
    goToMyBlog() {
      this.$router.push(`/${store.state.accountStore.blogId}`);
    },
    goToSetting() {
      this.$router.push('/setting');
    },
  },
});
</script>

<style scoped>

.account-summary-container {
  width: 50px;
  height: 50px;
  cursor: default;

  border-radius: 100%;
}

.dropdown-container {
  display: inline-block;

  width: 100% !important;
  height: 100% !important;
  max-width: 150px !important; /* any size */
  max-height: 150px !important; /* any size */
  margin: auto;

  border-radius: 100%;
  position: relative;

  background-color: #6eafd4;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  z-index: 1;
}

@media (hover: hover) and (pointer: fine) {
  .dropdown-container:hover {
    box-shadow: 0 0 12px var(--base-shadow-color);
  }
}

.dropdown-container details {
  width: 100%;
  height: 100%;
}

.dropdown-container summary {
  list-style: none;
  cursor: pointer;
  width: 100%;
  height: 100%;
}

.dropdown-container summary::-webkit-details-marker {
  display: none;
}

.dropdown-container .dropdown-content {
  position: absolute;
  min-inline-size: max-content;
  background-color: var(--background-color);
  right: 0px;
}

.dropdown-container details[open] summary::before {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  content: "";
  cursor: default;
  height: 100vh;
}

.dropdown-container .dropdown-content {
  display: grid;

  grid-template-columns: 100px;
  grid-auto-rows: auto;

  grid-row-gap: var(--half-base-gab);

  margin-top: calc(var(--half-base-gab) / 2);
  border: 1px solid var(--border-color);
  border-radius: var(--base-border-radius);

  padding: var(--half-base-gab) 0px;

  font-size: 12px;
}

.dropdown-content a {
  padding: 0px var(--half-base-gab);
}

</style>
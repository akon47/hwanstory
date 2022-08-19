<template>
  <div class="account-summary-container">
    <div class="dropdown-container" :style="profileImageUrl">
      <details>
        <summary/>
        <div class="dropdown-content">
          <a @click="goToMyBlog">내 블로그</a>
          <a @click="showCurrentAccountInfo">내 프로필</a>
          <a @click="selectProfileImageFile">이미지 변경</a>
          <a @click="signOut">로그아웃</a>
        </div>
      </details>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { getCurrentAccount, setCurrentProfileImage } from '@/api/accounts';
import { serverUrl, HttpApiError } from '@/api/common/httpApiClient';
import store from '@/store';

export default defineComponent({
  name: 'AccountSummaryMenuButton',
  computed: {
    profileImageUrl() {
      const profileImageUrl = store.state.accountStore.profileImageUrl;
      if (profileImageUrl) {
        return {
          backgroundImage: `url(${serverUrl}${profileImageUrl})`
        };
      } else {
        return { };
      }
    },
  },
  methods: {
    async showCurrentAccountInfo() {
      await getCurrentAccount()
      .then((response) => {
        alert(JSON.stringify(response, null, 2));
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      });
    },
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
    selectProfileImageFile() {
      const input = document.createElement('input') as HTMLInputElement;
      input.type = 'file';
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
        .then(() => {
          store.dispatch('accountStore/updateCurrentAccountInfo');
          alert('프로필 이미지를 변경하였습니다.');
        })
        .catch((error: HttpApiError) => {
          alert(error.getErrorMessage());
        });
      };
      input.click();
    },
  },
});
</script>

<style scoped>

.account-summary-container {
  width: 50px;
  height: 50px;
  cursor: pointer;

  background-color: #6eafd4;
  border-radius: 100%;
}

.dropdown-container {
  display: inline-block;

  width: 100% !important;
  height: 100% !important;
  max-width: 150px !important; /* any size */
  max-height: 150px !important; /* any size */
  margin: auto;
  background-color: #6eafd4;
  border-radius: 100%;
  position: relative;

  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  z-index: 1;
}

.dropdown-container:hover {
  box-shadow: 0 0 12px var(--base-shadow-color);
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
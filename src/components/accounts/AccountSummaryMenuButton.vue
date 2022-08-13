<template>
  <div class="account-summary-container">
    <div class="dropdown-container">
      <details>
        <summary/>
        <div class="dropdown-content">
          <a @click="showCurrentAccountInfo">내 정보</a>
          <a @click="signOut">로그아웃</a>
        </div>
      </details>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { getCurrentAccount } from "@/api/accounts";
import { HttpApiError } from "@/api/common/httpApiClient";
import store from "@/store";

export default defineComponent({
  name: "AccountSummaryMenuButton",
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
  }
});
</script>

<style scoped>

.account-summary-container {
  width: 50px;
  height: 50px;
  cursor: pointer;
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
}

.dropdown-container:hover {
  background-color: #5555ff;
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
  background-color: white;
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

  grid-template-columns: 80px;
  grid-auto-rows: auto;

  row-gap: 10px;

  margin-top: 5px;
  border: 1px solid #e0e0e0;
  border-radius: 3px;

  padding: 10px 0px;

  font-size: 12px;
}

.dropdown-content a {
  padding: 0px 10px;
}

.dropdown-content a:hover {
  text-decoration: underline;
}

</style>
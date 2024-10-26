<template>
  <div class="header">
    <app-header></app-header>
  </div>
  <div class="content">
    <app-content></app-content>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import AppHeader from './components/common/AppHeader.vue';
import AppContent from './components/common/AppContent.vue';
import store from "@/store";
import blogWebSocketClient from "@/utils/websocket";

export default defineComponent({
  name: 'App',
  components: {
    AppHeader,
    AppContent,
  },
  computed: {
    theme() {
      return store.getters["commonStore/getTheme"];
    },
  },
  watch: {
    theme(value) {
      document.documentElement.className = value;
    }
  },
  methods: {
    getMediaPreference() {
      const hasDarkPreference = window.matchMedia(
          "(prefers-color-scheme: dark)"
      ).matches;
      if (hasDarkPreference) {
        return "dark-theme";
      } else {
        return "light-theme";
      }
    },
  },
  created() {
    document.documentElement.className = this.theme;
    if(store.getters['accountStore/isLoggedIn']) {
      store.dispatch('accountStore/updateCurrentAccountInfo');
    }
    blogWebSocketClient.onsessioncountchanged = () => {
      store.dispatch('commonStore/updateSessionCount');
    };
  },
});
</script>

<style>
@import './css/reset.css';
@import './css/common.css';
</style>

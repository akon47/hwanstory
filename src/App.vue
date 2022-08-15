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

export default defineComponent({
  name: 'App',
  components: {
    AppHeader,
    AppContent,
  },
  computed: {
    theme() {
      return store.getters["accountStore/getTheme"];
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
    store.dispatch('accountStore/updateCurrentAccountInfo');
  },
});
</script>

<style>
@import './css/reset.css';
@import './css/common.css';
</style>

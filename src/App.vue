<template>
  <div class="header">
    <app-header></app-header>
  </div>
  <div class="content">
    <app-content></app-content>
  </div>
  <div class="footer">
    <app-footer></app-footer>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import AppHeader from "./components/common/AppHeader.vue";
import AppContent from "./components/common/AppContent.vue";
import AppFooter from "./components/common/AppFooter.vue";

export default defineComponent({
  name: "App",
  components: {
    AppHeader,
    AppContent,
    AppFooter,
  },
});
</script>

<style>
@import "./css/reset.css";
@import "./css/common.css";
</style>

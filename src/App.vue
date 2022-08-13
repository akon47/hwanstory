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

export default defineComponent({
  name: 'App',
  components: {
    AppHeader,
    AppContent,
  },
});
</script>

<style>
@import './css/reset.css';
@import './css/common.css';
</style>

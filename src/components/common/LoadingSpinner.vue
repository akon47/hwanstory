<template>
  <div class="loading-spinner-container" role="status" aria-label="불러오는 중">
    <span class="spinner" :style="{ width: `${size}px`, height: `${size}px` }"/>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'LoadingSpinner',
  props: {
    size: {
      type: Number,
      default: 28,
    },
  },
});
</script>

<style scoped>
.loading-spinner-container {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
}

.spinner {
  display: inline-block;
  border-radius: 50%;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

<template>
  <div class="container not-found">
    <div class="code">404</div>
    <h1>페이지를 찾을 수 없습니다</h1>
    <p class="muted">주소가 잘못되었거나, 글이 삭제되었거나 비공개로 바뀌었을 수 있어요.</p>
    <div class="actions">
      <router-link class="btn" to="/">
        <app-icon name="home" :size="16"/>홈으로
      </router-link>
      <button class="btn btn-secondary" type="button" @click="$router.back()">
        <app-icon name="arrow-left" :size="16"/>이전 화면
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import AppIcon from '@/components/common/AppIcon.vue';

export default defineComponent({
  name: 'NotFoundView',
  components: { AppIcon },
});
</script>

<style scoped>
.not-found {
  display: grid;
  justify-items: center;
  align-content: center;
  text-align: center;
  gap: var(--s-3);
  min-height: 60vh;
  padding-block: var(--s-16);
}

.code {
  font-size: 72px;
  font-weight: 800;
  letter-spacing: -0.04em;
  color: var(--accent);
  line-height: 1;
}

h1 {
  font-size: var(--text-2xl);
}

.actions {
  display: flex;
  gap: var(--s-2);
  margin-top: var(--s-3);
}
</style>

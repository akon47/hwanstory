<template>
  <div class="content-container">
    <router-view v-slot="{ Component }">
      <transition name="component-fade" mode="out-in">
        <component :is="Component"/>
      </transition>
    </router-view>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'AppContent',
});
</script>

<style scoped>
.content-container {
}

.component-fade-enter-active,
.component-fade-leave-active {
  transition: all 0.3s ease;
}

.component-fade-enter,
.component-fade-leave-to {
  opacity: 0;
}
</style>

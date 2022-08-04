<template>
  <div class="content-container">
    <transition name="component-fade" mode="out-in">
      <router-view />
    </transition>
  </div>
</template>

<script lang="ts">
import {defineComponent} from "vue";

export default defineComponent({
  name: "AppContent",
});
</script>

<style scoped>
.content-container {

}
.component-fade-enter-active,
.component-fade-leave-active {
  transition: all 0.15s ease;
}
.component-fade-enter,
.component-fade-leave-to {
  opacity: 0;
  transform: translateY(-50px);
}
</style>
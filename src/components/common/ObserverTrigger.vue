<template>
  <div ref="trigger-element" class="observer-trigger" aria-hidden="true"/>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

// 화면 끝에 두면 사용자가 가까이 스크롤했을 때 `trigger` 를 보낸다. (무한 스크롤용)
export default defineComponent({
  name: 'ObserverTrigger',
  props: {
    // 실제로 보이기 얼마나 전에 미리 발동할지
    rootMargin: {
      type: String,
      default: '600px 0px',
    },
  },
  emits: ['trigger'],
  data() {
    return {
      observer: null as IntersectionObserver | null,
    };
  },
  mounted() {
    this.observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        this.$emit('trigger');
      }
    }, { root: null, rootMargin: this.rootMargin, threshold: 0 });
    this.observer.observe(this.$refs['trigger-element'] as Element);
  },
  beforeUnmount() {
    this.observer?.disconnect();
  },
});
</script>

<style scoped>
.observer-trigger {
  width: 100%;
  height: 1px;
}
</style>

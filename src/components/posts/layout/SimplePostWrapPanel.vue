<template>
  <div class="post-grid">
    <simple-post-wrap-item v-for="post in simplePosts" :key="post.id" :simple-post="post"/>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { SimplePostDto } from '@/api/models/blog.dtos';
import SimplePostWrapItem from '@/components/posts/item/SimplePostWrapItem.vue';

export default defineComponent({
  name: 'SimplePostWrapPanel',
  components: { SimplePostWrapItem },
  props: {
    simplePosts: Object as PropType<Array<SimplePostDto>>,
  },
});
</script>

<style scoped>
.post-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--s-6);
}

.post-grid:empty {
  display: none;
}

@media (max-width: 640px) {
  .post-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--s-5);
  }
}
</style>

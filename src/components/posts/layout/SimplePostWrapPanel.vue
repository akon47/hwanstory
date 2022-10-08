<template>
  <div class="wrap-panel-container">
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

.wrap-panel-container {
  display: grid;

  grid-template-columns: repeat(auto-fill, 320px);
  grid-auto-rows: auto;

  justify-content: center;

  gap: calc(var(--base-gap) * 2);
  margin: calc(var(--base-gap) * 2);
}

@media (max-width: 1080px) {
  .wrap-panel-container {
    grid-template-columns: repeat(2, 1fr);
    justify-content: center;

    gap: var(--base-gap);
    margin: var(--base-gap);
  }
}

@media (max-width: 650px) {
  .wrap-panel-container {
    grid-template-columns: repeat(1, 1fr);
    justify-content: stretch;
  }
}

</style>
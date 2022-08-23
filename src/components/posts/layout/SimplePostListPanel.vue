<template>
  <div class="list-panel-container">
    <simple-post-list-item v-for="post in simplePosts" :key="post.id" :simple-post="post"/>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { SimplePostDto } from '@/api/models/blog.dtos';
import SimplePostListItem from '@/components/posts/item/SimplePostListItem.vue';

export default defineComponent({
  name: 'SimplePostListPanel',
  components: { SimplePostListItem },
  props: {
    simplePosts: Object as PropType<Array<SimplePostDto>>,
  },
});
</script>

<style scoped>

.list-panel-container {
  display: grid;

  grid-template-columns: minmax(0, 1fr);
  grid-auto-rows: auto;
}

</style>
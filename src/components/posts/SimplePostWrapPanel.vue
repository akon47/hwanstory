<template>
  <div class="wrap-panel-container">
    <simple-post-item v-for="post in simplePosts" :key="post.id" :simple-post="post"/>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { SimplePostDto } from "@/api/models/blog.dtos";
import SimplePostItem from "@/components/posts/SimplePostItem.vue";

export default defineComponent({
  name: 'SimplePostWrapPanel',
  components: { SimplePostItem },
  props: {
    simplePosts: Object as PropType<Array<SimplePostDto>>,
  }
});
</script>

<style scoped>

.wrap-panel-container {
  display: grid;

  grid-template-columns: repeat(auto-fill, 300px);
  grid-template-rows: 1fr;

  justify-content: center;

  gap: 40px;
  margin: 40px;
}

</style>
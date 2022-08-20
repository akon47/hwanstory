<template>
  <div class="write-post-container">
    <write-post-form :post-url="postUrl"></write-post-form>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import WritePostForm from '@/components/posts/WritePostForm.vue';

export default defineComponent({
  name: 'WriteView',
  components: {
    WritePostForm,
  },
  props: {
    postUrl: {
      type: String,
      required: true,
    },
  },
});
</script>

<style scoped>

.write-post-container {
  display: grid;

  width: 100%;
  height: 100%;
}

</style>

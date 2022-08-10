<template>
  <div>
    <write-post-form></write-post-form>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import WritePostForm from '@/components/WritePostForm.vue';

export default defineComponent({
  name: 'WriteView',
  components: {
    WritePostForm,
  },
});
</script>

<style scoped></style>

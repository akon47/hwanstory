<template>
  <div class="tag-item">
    {{ name }}
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'TagItem',
  props: {
    name: {
      type: String,
      required: true,
    },
  },
});
</script>

<style scoped>

.tag-item {
  color: white;
  background-color: var(--button-color);
  margin: 2px;
  border-radius: 5px;
  padding: 1px 5px;
  box-sizing: border-box;
  font-size: 0.85em;

  -ms-user-select: none;
  -khtml-user-select: none;
  -webkit-user-select: none;
  user-select: none;
}

</style>
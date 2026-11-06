<template>
  <span class="chip">{{ name }}</span>
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

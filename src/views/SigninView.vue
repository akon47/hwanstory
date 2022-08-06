<template>
  <div>
    <signin-form></signin-form>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import SigninForm from '@/components/SigninForm.vue';

export default defineComponent({
  name: 'SigninView',
  components: {
    SigninForm,
  },
});
</script>

<style scoped></style>

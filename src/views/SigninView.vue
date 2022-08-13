<template>
  <div class="sign-in-container">
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

<style scoped>

.sign-in-container {
  display: grid;

  align-items: center;
  justify-content: center;

  width: 100%;
  height: 100%;
}

</style>

<template>
  <div class="sign-up-container">
    <signup-form></signup-form>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import SignupForm from '@/components/SignupForm.vue';

export default defineComponent({
  name: 'SignupView',
  components: {
    SignupForm,
  },
});
</script>

<style scoped>

.sign-up-container {
  display: grid;

  width: 100%;
  height: 100%;
}

</style>

<template>
  <div>
    <signup-form></signup-form>
  </div>
</template>

<script lang="ts">
import {defineComponent} from "vue";
import SignupForm from "@/components/SignupForm.vue";

export default defineComponent({
  name: "SignupView",
  components: {
    SignupForm
  },
});
</script>

<style scoped>

</style>
<template>
  <div class="header-container">
    <router-link to="/main">main</router-link>
    <router-link to="/signup">signup</router-link>
    <router-link to="/signin">signin</router-link>
  </div>
</template>

<script lang="ts">
import {defineComponent} from "vue";

export default defineComponent({
  name: "AppHeader",
});
</script>

<style scoped>
.header-container {

}
</style>
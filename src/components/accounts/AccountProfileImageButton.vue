<template>
  <div class="account-profile-image-container" @click="moveToBlog">
    <div class="profile" :style="profileImageUrl"/>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { SimpleAccountDto } from '@/api/models/account.dtos';
import { serverUrl } from '@/api/common/httpApiClient';

export default defineComponent({
  name: 'AccountProfileImageButton',
  props: {
    simpleAccount: Object as PropType<SimpleAccountDto>,
  },
  computed: {
    profileImageUrl() {
      if (this.simpleAccount?.profileImageUrl) {
        return {
          backgroundImage: `url(${serverUrl}${this.simpleAccount?.profileImageUrl})`,
        };
      } else {
        return {};
      }
    },
  },
  methods: {
    async moveToBlog() {
      this.$router.push(`/${this.simpleAccount?.blogId}`);
    },
  },
});
</script>

<style scoped>

.account-profile-image-container {
  width: 100%;
  height: 100%;
  aspect-ratio: 1 / 1;
  cursor: pointer;

  background-color: #6eafd4;
  border-radius: 100%;
}

.profile {
  width: 100%;
  height: 100%;
  aspect-ratio: 1 / 1;
  background-color: #6eafd4;
  border-radius: 100%;
  position: relative;

  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.profile:hover {
  box-shadow: 0 0 12px var(--base-shadow-color);
}

</style>
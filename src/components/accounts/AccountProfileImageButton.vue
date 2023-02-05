<template>
  <div class="account-profile-image-container" @click="moveToBlog">
    <div class="profile" :style="profileImageUrl"/>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { SimpleAccountDto } from '@/api/models/account.dtos';
import { attachmentFileBaseUrl } from '@/api/common/httpApiClient';

export default defineComponent({
  name: 'AccountProfileImageButton',
  props: {
    simpleAccount: Object as PropType<SimpleAccountDto>,
  },
  computed: {
    profileImageUrl() {
      if (this.simpleAccount?.profileImageUrl) {
        return {
          backgroundImage: `url(${attachmentFileBaseUrl}${this.simpleAccount?.profileImageUrl})`,
        };
      } else {
        return {
          backgroundImage: `url(${require('@/assets/profile.svg')})`,
        };
      }
    },
  },
  methods: {
    async moveToBlog() {
      if (!this.simpleAccount?.guest) {
        this.$router.push(`/${this.simpleAccount?.blogId}`);
      }
    },
  },
});
</script>

<style scoped>

.account-profile-image-container {
  aspect-ratio: 1 / 1;
  cursor: pointer;

  background-color: #6eafd4;
  border-radius: 100%;

  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
}

.profile {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: inherit;
}

.profile:hover {
  box-shadow: 0 0 12px var(--base-shadow-color);
  transition: 0.2s;
}

</style>
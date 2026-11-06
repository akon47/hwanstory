<template>
  <span class="avatar account-profile-image" :style="profileImageStyle" role="img" :aria-label="simpleAccount?.name"/>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { SimpleAccountDto } from '@/api/models/account.dtos';
import { attachmentFileBaseUrl } from '@/api/common/httpApiClient';

export default defineComponent({
  name: 'AccountProfileImage',
  props: {
    simpleAccount: Object as PropType<SimpleAccountDto>,
  },
  computed: {
    profileImageStyle() {
      const url = this.simpleAccount?.profileImageUrl
          ? `${attachmentFileBaseUrl}${this.simpleAccount.profileImageUrl}`
          : require('@/assets/profile.svg');
      return { backgroundImage: `url(${url})` };
    },
  },
});
</script>

<style scoped>
.account-profile-image {
  width: 100%;
  height: 100%;
  aspect-ratio: 1 / 1;
}
</style>

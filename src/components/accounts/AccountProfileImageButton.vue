<template>
  <component :is="isLinkable ? 'router-link' : 'span'" class="avatar account-profile-image-button"
             :class="{ linkable: isLinkable }" :to="isLinkable ? `/${simpleAccount?.blogId}` : undefined"
             :style="profileImageStyle" :aria-label="simpleAccount?.name" :title="simpleAccount?.name"/>
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
    isLinkable(): boolean {
      return !!this.simpleAccount?.blogId && !this.simpleAccount?.guest;
    },
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
.account-profile-image-button {
  display: block;
  width: 100%;
  height: 100%;
  aspect-ratio: 1 / 1;
  transition: box-shadow var(--ease);
}

.account-profile-image-button.linkable:hover {
  box-shadow: 0 0 0 3px var(--accent-soft);
}
</style>

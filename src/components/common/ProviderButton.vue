<template>
  <span class="provider-button" :style="{ backgroundColor: backgroundColor, borderColor: borderColor }">
    <img :src="providerLogoSrc" alt=""/>
  </span>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ProviderButton',
  props: {
    provider: {
      type: String,
      require: true,
      default: 'google',
    },
  },
  computed: {
    providerLogoSrc() {
      return require(`@/assets/provider-logos/${this.provider}.svg`);
    },
    backgroundColor() {
      switch (this.provider) {
        case 'google':
          return '#ffffff';
        case 'github':
          return '#24292f';
        case 'facebook':
          return '#1877f2';
        case 'naver':
          return '#03c75a';
        case 'kakao':
          return '#fee500';
        case 'discord':
          return '#5865f2';
        case 'microsoft':
          return '#ffffff';
        default:
          return '#ffffff';
      }
    },
    borderColor() {
      switch (this.provider) {
        case 'google':
        case 'microsoft':
          return 'var(--border-strong)';
        default:
          return 'transparent';
      }
    },
  },
});
</script>

<style scoped>
.provider-button {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  border: 1px solid;
  border-radius: 50%;
  transition: transform var(--ease), box-shadow var(--ease);
}

.provider-button:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.provider-button img {
  width: 56%;
  height: 56%;
}
</style>

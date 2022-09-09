<template>
  <button class="provider-button" :style="{ backgroundColor: backgroundColor, borderColor: borderColor }">
    <img :src="providerLogoSrc" />
  </button>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ProviderButton',
  props: {
    provider: {
      type: String,
      require: true,
      default: 'google'
    }
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
          return '#272e33';
        case 'facebook':
          return '#3C5A99';
        case 'naver':
          return '#1ec800';
        case 'kakao':
          return '#fee500';
        default:
          return 'ffffff'
      }
    },
    borderColor() {
      switch (this.provider) {
        case 'google':
          return 'var(--border-color)';
        default:
          return 'transparent'
      }
    }
  }
});
</script>

<style scoped>

.provider-button {
  width: 100%;
  height: 100%;

  display: grid;
  background: white;
  border: 1px solid;
}

.provider-button:hover:not([disabled]) {
  box-shadow: 0 0 10px var(--base-shadow-color);
  cursor: pointer;
}

.provider-button img {
  width: 150%;
  height: 150%;

  align-self: center;
  justify-self: center;
}

</style>
<template>
  <div class="viewer-container" :class="{ 'toastui-editor-dark': isDarkTheme }" ref="ref-viewer"/>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Editor, { Viewer } from '@toast-ui/editor';
import store from '@/store';
import '@toast-ui/editor/dist/i18n/ko-kr';
import colorSyntax from '@toast-ui/editor-plugin-color-syntax';

const codeSyntaxHighlight = require('@toast-ui/editor-plugin-code-syntax-highlight/dist/toastui-editor-plugin-code-syntax-highlight-all');

let viewer: Viewer;

export default defineComponent({
  name: 'PostViewer',
  props: {
    content: {
      type: String,
    },
  },
  computed: {
    isDarkTheme() {
      return store.getters['accountStore/isDarkTheme'];
    },
  },
  watch: {
    content(newValue, preValue) {
      if (newValue !== preValue) {
        viewer.setMarkdown(newValue);
      }
    },
  },
  mounted() {
    const refViewer = this.$refs['ref-viewer'] as HTMLElement;

    viewer = Editor.factory({
      el: refViewer,
      initialValue: this.content,
      extendedAutolinks: true,
      plugins: [codeSyntaxHighlight, colorSyntax],
      viewer: true,
    });
  },
});
</script>

<style>

@import '@toast-ui/editor/dist/toastui-editor.css';
@import '@toast-ui/editor/dist/theme/toastui-editor-dark.css';
@import '@/css/toastui-editor-common.css';
@import 'prismjs/themes/prism.css';
@import '@toast-ui/editor-plugin-code-syntax-highlight/dist/toastui-editor-plugin-code-syntax-highlight.css';
@import 'tui-color-picker/dist/tui-color-picker.css';
@import '@toast-ui/editor-plugin-color-syntax/dist/toastui-editor-plugin-color-syntax.css';

</style>
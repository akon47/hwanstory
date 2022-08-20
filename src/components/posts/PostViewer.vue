<template>
  <div class="viewer-container" ref="ref-viewer"/>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import Editor, { Viewer } from '@toast-ui/editor';
import store from '@/store';
import '@toast-ui/editor/dist/i18n/ko-kr';
import Prism from 'prismjs';
import codeSyntaxHighlight from '@toast-ui/editor-plugin-code-syntax-highlight';
import colorSyntax from '@toast-ui/editor-plugin-color-syntax';

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
    isDarkTheme(newValue, preValue) {
      if (newValue === preValue) {
        return;
      }

      const element = document.getElementsByClassName('viewer-container')[0];
      if (element.classList.contains('toastui-editor-dark')) {
        if (!newValue) {
          element.classList.remove('toastui-editor-dark');
        }
      } else {
        if (newValue) {
          element.classList.add('toastui-editor-dark');
        }
      }
    },
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
      theme: this.isDarkTheme ? 'dark' : 'light',
      plugins: [[codeSyntaxHighlight, { highlighter: Prism }], colorSyntax],
      viewer: true,
    });
  },
});
</script>

<style>

@import '@toast-ui/editor/dist/toastui-editor.css';
@import '@toast-ui/editor/dist/theme/toastui-editor-dark.css';
@import 'prismjs/themes/prism.css';
@import '@toast-ui/editor-plugin-code-syntax-highlight/dist/toastui-editor-plugin-code-syntax-highlight.css';
@import 'tui-color-picker/dist/tui-color-picker.css';
@import '@toast-ui/editor-plugin-color-syntax/dist/toastui-editor-plugin-color-syntax.css';

.editor-container {
  max-width: 100%;
}

</style>
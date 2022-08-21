<template>
  <div class="editor-container" :class="{ 'toastui-editor-dark': isDarkTheme }" ref="ref-editor"/>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import Editor from '@toast-ui/editor';
import store from '@/store';
import { EditorCore, HookCallback } from '@toast-ui/editor/types/editor';
import '@toast-ui/editor/dist/i18n/ko-kr';
import Prism from 'prismjs';
import codeSyntaxHighlight from '@toast-ui/editor-plugin-code-syntax-highlight';
import colorSyntax from '@toast-ui/editor-plugin-color-syntax';
import { uploadImageFile } from '@/api/attachments';
import { attachmentFileBaseUrl, HttpApiError } from '@/api/common/httpApiClient';

let editor: EditorCore;

export default defineComponent({
  name: 'PostEditor',
  props: {
    modelValue: {
      type: String,
    },
  },
  data() {
    return {
      previewStyle: {} as 'tab' | 'vertical',
    };
  },
  computed: {
    isDarkTheme() {
      return store.getters['accountStore/isDarkTheme'];
    },
  },
  watch: {
    previewStyle(newValue, preValue) {
      if (newValue !== preValue && editor) {
        editor.changePreviewStyle(newValue);
      }
    },
    modelValue(newValue, preValue) {
      if (newValue !== preValue && newValue !== editor.getMarkdown()) {
        editor.setMarkdown(newValue, true);
      }
    },
  },
  methods: {
    onEditorSizeChanged(rect: DOMRectReadOnly) {
      if (rect.width < 650) {
        this.previewStyle = 'tab';
      } else {
        this.previewStyle = 'vertical';
      }
    },
  },
  mounted() {
    const refEditor = this.$refs['ref-editor'] as HTMLElement;
    this.onEditorSizeChanged(refEditor.getBoundingClientRect());

    editor = new Editor({
      el: refEditor,
      previewStyle: this.previewStyle,
      initialValue: this.modelValue,
      extendedAutolinks: true,
      height: '100%',
      placeholder: '내용을 입력하세요.',
      plugins: [[codeSyntaxHighlight, { highlighter: Prism }], colorSyntax],
      language: 'ko-KR',
    });
    editor.on('change', () => {
      this.$emit('update:modelValue', editor.getMarkdown());
    });
    editor.addHook('addImageBlobHook', async (blob: Blob | File, callback: HookCallback) => {
      await uploadImageFile(blob)
      .then((file) => {
        callback(`${attachmentFileBaseUrl}${file.url}`, file.fileName ?? 'image');
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      });
    });
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry.contentRect) {
        this.onEditorSizeChanged(entry.contentRect);
      }
    });
    resizeObserver.observe(refEditor);
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
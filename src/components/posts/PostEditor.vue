<template>
  <div class="editor-container" ref="ref-editor"/>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import Editor from "@toast-ui/editor";
import store from "@/store";
import { EditorCore } from "@toast-ui/editor/types/editor";
import Prism from "prismjs"
import codeSyntaxHighlight from '@toast-ui/editor-plugin-code-syntax-highlight';
import colorSyntax from '@toast-ui/editor-plugin-color-syntax';

export default defineComponent({
  name: "PostEditor",
  props: {
    value: {
      type: String
    },
  },
  data() {
    return {
      editor: {} as EditorCore,
      previewStyle: {} as 'tab' | 'vertical',
    }
  },
  computed: {
    isDarkTheme() {
      return store.getters["accountStore/isDarkTheme"];
    },
  },
  watch: {
    isDarkTheme(newValue, preValue) {
      if (newValue === preValue) {
        return;
      }

      const element = document.getElementsByClassName("toastui-editor-defaultUI")[0];
      if (element.classList.contains("toastui-editor-dark")) {
        if (!newValue) {
          element.classList.remove("toastui-editor-dark");
        }
      } else {
        if (newValue) {
          element.classList.add("toastui-editor-dark");
        }
      }
    },
    previewStyle(newValue, preValue) {
      if (newValue !== preValue && this.editor) {
        this.editor.changePreviewStyle(newValue);
      }
    },
    value(newValue, preValue) {
      if(newValue !== preValue && newValue !== this.editor.getMarkdown()) {
        //this.editor.setMarkdown(newValue, true);
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
    }
  },
  mounted() {
    const refEditor = this.$refs["ref-editor"] as HTMLElement;
    this.onEditorSizeChanged(refEditor.getBoundingClientRect());

    this.editor = new Editor({
      el: refEditor,
      previewStyle: this.previewStyle,
      initialValue: this.value,
      height: '100%',
      theme: this.isDarkTheme ? 'dark' : '',
      placeholder: '내용을 입력하세요.',
      plugins: [[codeSyntaxHighlight, { highlighter: Prism }], colorSyntax]
    });
    this.editor.on('change', () => {
      this.$emit('input', this.editor.getMarkdown());
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
@import 'prismjs/themes/prism.css';
@import '@toast-ui/editor-plugin-code-syntax-highlight/dist/toastui-editor-plugin-code-syntax-highlight.css';
@import 'tui-color-picker/dist/tui-color-picker.css';
@import '@toast-ui/editor-plugin-color-syntax/dist/toastui-editor-plugin-color-syntax.css';

.editor-container {
  max-width: 100%;
}

</style>
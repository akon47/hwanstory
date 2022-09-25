<template>
  <div class="editor-container" :class="{ 'toastui-editor-dark': isDarkTheme }" ref="ref-editor"/>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import Editor from '@toast-ui/editor';
import store from '@/store';
import { EditorCore, HookCallback } from '@toast-ui/editor/types/editor';
import '@toast-ui/editor/dist/i18n/ko-kr';
import colorSyntax from '@toast-ui/editor-plugin-color-syntax';
import { uploadFile } from '@/api/attachments';
import { attachmentFileBaseUrl, HttpApiError } from '@/api/common/httpApiClient';

const codeSyntaxHighlight = require('@toast-ui/editor-plugin-code-syntax-highlight/dist/toastui-editor-plugin-code-syntax-highlight-all');

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
      return store.getters['commonStore/isDarkTheme'];
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
      plugins: [codeSyntaxHighlight, colorSyntax],
      language: 'ko-KR',
      toolbarItems: [
        ['heading', 'bold', 'italic', 'strike'],
        ['hr', 'quote'],
        ['ul', 'ol', 'task', 'indent', 'outdent'],
        ['table', 'image', {
          name: 'video',
          command: 'video',
          tooltip: '동영상 삽입',
          className: 'toastui-editor-toolbar-icons video',
        }, 'link'],
        ['code', 'codeblock'],
        ['scrollSync'],
      ],
    });
    editor.addCommand('markdown', 'video', () => {
      const input = document.createElement('input') as HTMLInputElement;
      input.type = 'file';
      input.accept = 'video/mp4';
      input.onchange = async (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (!target.files?.length) {
          return;
        }
        const file = target.files[0];
        if (!file.type.startsWith('video')) {
          alert('비디오 파일을 선택해주세요.');
          return;
        }

        await uploadFile(file)
        .then((file) => {
          const src = `${attachmentFileBaseUrl}${file.url}`;
          editor.insertText(`<video src="${src}" controls><a href="${src}">${file.fileName ?? 'download'}</a></video>`);
        })
        .catch((error: HttpApiError) => {
          alert(error.getErrorMessage());
        });
      };
      input.click();

      return true;
    });
    editor.addCommand('wysiwyg', 'video', () => {
      alert('위지윅 모드에서는 지원되지 않습니다.');
      return false;
    });
    editor.on('change', () => {
      this.$emit('update:modelValue', editor.getMarkdown());
    });
    editor.addHook('addImageBlobHook', async (blob: Blob | File, callback: HookCallback) => {
      await uploadFile(blob)
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

.toastui-editor-toolbar-icons.video::before,
.toastui-editor-toolbar-icons.video::after {
  content: '';
  mask: url('@/assets/video.svg') no-repeat center;
  width: 100%;
  height: 100%;
  display: block;
  transition: 0.2s ease;
}

.toastui-editor-toolbar-icons.video::before {
  background: #555555;
}

.toastui-editor-toolbar-icons.video::after {
  background: #eeeeee;
}

.toastui-editor-dark .video::before,
.toastui-editor-dark .video::after{
  transform: translateY(-100%);
}

.toastui-editor-toolbar-icons.video {
  overflow: hidden;
  background: transparent;
}

</style>
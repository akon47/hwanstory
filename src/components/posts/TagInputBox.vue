<template>
  <div class="tag-input" @click="focusInput">
    <button v-for="tag in modelValue" :key="String(tag)" class="chip tag-chip" type="button" :title="`'${tag}' 태그 빼기`"
            @click.stop="removeTag(String(tag))">
      {{ tag }}<app-icon name="x" :size="12"/>
    </button>
    <input
        ref="input"
        type="text"
        :placeholder="modelValue && modelValue.length > 0 ? '태그 추가' : '태그를 입력하고 Enter (예: Vue, 회고)'"
        v-model="inputTag"
        maxlength="30"
        autocomplete="off"
        @keydown="onKeydown"
        @blur="addTag(inputTag)"/>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import AppIcon from '@/components/common/AppIcon.vue';

// 태그 입력. Enter 또는 쉼표(,) 로 추가하고, 칩을 누르거나 Backspace 로 뺀다.
export default defineComponent({
  name: 'TagInputBox',
  components: { AppIcon },
  props: {
    modelValue: {
      type: Array,
      required: false,
    },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      inputTag: '',
    };
  },
  methods: {
    onKeydown(event: KeyboardEvent) {
      if (event.key === 'Enter' || event.key === ',') {
        event.preventDefault();
        this.addTag(this.inputTag);
      } else if (event.key === 'Backspace') {
        this.removeLastTag();
      }
    },
    focusInput() {
      (this.$refs['input'] as HTMLInputElement | undefined)?.focus();
    },
    addTag(raw: string) {
      const tag = raw.replace(/,/g, '').trim();
      if (!tag) {
        this.inputTag = '';
        return;
      }
      if (this.modelValue?.includes(tag)) {
        this.inputTag = '';
        return;
      }
      this.$emit('update:modelValue', (this.modelValue ?? []).concat(tag));
      this.inputTag = '';
    },
    removeTag(tag: string) {
      this.$emit('update:modelValue', this.modelValue?.filter((x) => x !== tag));
    },
    removeLastTag() {
      if (!this.inputTag && this.modelValue && this.modelValue.length > 0) {
        this.$emit('update:modelValue', this.modelValue.slice(0, this.modelValue.length - 1));
      }
    },
  },
});
</script>

<style scoped>
.tag-input {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  cursor: text;
}

.tag-chip {
  cursor: pointer;
}

.tag-chip:hover {
  background: var(--danger-soft);
  color: var(--danger);
}

.tag-input input {
  flex: 1 0 160px;
  min-width: 0;
  height: 30px;
  background: none;
  border: none;
  outline: none;
  color: var(--text);
  font-size: var(--text-base);
}

.tag-input input::placeholder {
  color: var(--text-3);
}
</style>

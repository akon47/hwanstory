<template>
  <div class="tag-input-box-container">
    <div v-for="tag in modelValue" :key="tag">
      <div class="tag-item" @click="removeTag(tag)">
        {{ tag }}
      </div>
    </div>
    <input
        type="text"
        placeholder="태그 입력"
        v-model="inputTag"
        @keydown.prevent.enter="addTag(inputTag)"
        @keydown.delete="removeLastTag"/>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'TagInputBox',
  props: {
    modelValue: {
      type: Array,
      required: false,
    },
  },
  data() {
    return {
      inputTag: '',
    };
  },
  methods: {
    addTag(tag: string) {
      if (!tag || this.modelValue?.includes(tag))
        return;

      this.$emit('update:modelValue', this.modelValue?.concat(tag));
      this.inputTag = '';
    },
    removeTag(tag: string) {
      this.$emit('update:modelValue', this.modelValue?.filter(x => x !== tag));
    },
    removeLastTag() {
      if(!this.inputTag) {
        this.$emit('update:modelValue', this.modelValue?.slice(0, this.modelValue?.length - 1));
      }
    },
  },
});
</script>

<style scoped>

.tag-input-box-container {
  display: flex;

  align-items: center;
  justify-items: flex-start;

  flex-wrap: wrap;
}

.tag-input-box-container input {
  background: none;
  outline: none;
  border: none;
  box-sizing: border-box;

  width: 80px;
  flex-grow: 1;
}

.tag-item {
  cursor: pointer;

  color: white;
  background-color: var(--button-color);
  margin: 2px;
  border-radius: 5px;
  padding: 1px 5px;
  box-sizing: border-box;
  font-size: 14px;

  -ms-user-select: none;
  -khtml-user-select: none;
  -webkit-user-select: none;
  user-select: none;
}

</style>
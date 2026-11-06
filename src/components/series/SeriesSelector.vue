<template>
  <select class="select series-select" v-model="selectedValue" aria-label="시리즈" @change="changeSelect">
    <option value="">시리즈 없음</option>
    <option v-for="series in seriesList" :key="series.seriesUrl" :value="series.seriesUrl">
      {{ series.title }}
    </option>
  </select>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { getBlogSeries } from '@/api/blog';
import { HttpApiError } from '@/api/common/httpApiClient';
import { SimpleSeriesDto } from '@/api/models/blog.dtos';
import { toast } from '@/utils/dialog';

export default defineComponent({
  name: 'SeriesSelector',
  props: {
    blogId: {
      type: String,
      required: true,
    },
    modelValue: {
      type: String,
      default: '',
    },
    // 값이 바뀌면 목록을 다시 불러온다 (새 시리즈를 만든 뒤 등)
    refreshKey: {
      type: Number,
      default: 0,
    },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      selectedValue: this.modelValue,
      seriesList: Array<SimpleSeriesDto>(),
      isLoading: false,
    };
  },
  watch: {
    blogId() {
      this.loadSeries();
    },
    refreshKey() {
      this.loadSeries();
    },
    modelValue() {
      this.selectedValue = this.modelValue;
    },
  },
  methods: {
    async loadSeries() {
      if (!this.blogId) {
        return;
      }
      this.isLoading = true;
      await getBlogSeries(this.blogId)
      .then((seriesList) => {
        this.seriesList = seriesList;
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
      })
      .finally(() => {
        this.isLoading = false;
      });
    },
    changeSelect() {
      this.$emit('update:modelValue', this.selectedValue);
    },
  },
  created() {
    this.loadSeries();
  },
});
</script>

<style scoped>
.series-select {
  min-height: 38px;
  padding-block: 6px;
  font-size: var(--text-sm);
  max-width: 220px;
}
</style>

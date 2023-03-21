<template>
  <div class="series-selector-container">
    <select v-model="selectedValue" @change="changeSelect">
      <option value=''>없음</option>
      <option v-for="series in seriesList"
              :key="series.seriesUrl"
              :value="series.seriesUrl">
        {{ series.title }}
      </option>
    </select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { getBlogSeries } from "@/api/blog";
import { HttpApiError } from "@/api/common/httpApiClient";
import { SimpleSeriesDto } from "@/api/models/blog.dtos";

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
  },
  data() {
    return {
      selectedValue: '',
      seriesList: Array<SimpleSeriesDto>(),
      isLoading: false,
    };
  },
  watch: {
    blogId() {
      this.loadSeries();
    },
    modelValue() {
      this.selectedValue = this.modelValue;
    },
  },
  methods: {
    async loadSeries() {
      this.isLoading = true;
      await getBlogSeries(this.blogId)
      .then((seriesList) => {
        this.seriesList = seriesList;
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
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

.series-selector-container {

}

</style>
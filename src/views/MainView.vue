<template>
  <div class="main-container">
    <simple-post-wrap-panel :simple-posts="simplePosts"></simple-post-wrap-panel>
    <observer-trigger
        v-if="!this.isNoMorePage && !isLoading"
        class="observer-trigger-enable"
        v-on:trigger="loadMorePosts"/>
    <div class="loading" v-if="isLoading">
      <loading-spinner/>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { SimplePostDto } from '@/api/models/blog.dtos';
import { getAllPosts } from '@/api/blog';
import { HttpApiError } from '@/api/common/httpApiClient';
import SimplePostWrapPanel from '@/components/posts/layout/SimplePostWrapPanel.vue';
import ObserverTrigger from '@/components/common/ObserverTrigger.vue';
import store from '@/store';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';

export default defineComponent({
  name: 'MainView',
  components: { LoadingSpinner, ObserverTrigger, SimplePostWrapPanel },
  data() {
    return {
      simplePosts: Array<SimplePostDto>(),
      cursorId: '',
      isNoMorePage: true,
      isLoading: false,
    };
  },
  computed: {
    cachedMainPosts() {
      return store.getters['cacheStore/getCachedMainPosts'];
    },
  },
  watch: {
    cachedMainPosts(value) {
      if (value === null) {
        this.refresh();
      }
    },
  },
  methods: {
    async refresh() {
      await this.fetchPosts();
    },
    async fetchPosts(cursorId: string | null = null) {
      try {
        this.isLoading = true;
        await getAllPosts(20, cursorId)
        .then(async (posts) => {
          if (posts.first) {
            this.simplePosts = posts.data;
          } else {
            posts.data.forEach((post) => {
              this.simplePosts.push(post);
            });
          }
          this.cursorId = (!posts.last && posts.cursorId) ? posts.cursorId : '';
          this.isNoMorePage = posts.last;

          await store.dispatch('cacheStore/setMainPosts', {
            simplePosts: this.simplePosts,
            cursorId: this.cursorId,
            isNoMorePage: this.isNoMorePage,
          });
        })
        .catch((error: HttpApiError) => {
          alert(error.getErrorMessage());
        });
      } finally {
        this.isLoading = false;
      }
    },
    async loadMorePosts() {
      if (this.cursorId) {
        await this.fetchPosts(this.cursorId);
      }
    },
  },
  mounted() {
    const cachedMainPosts = store.getters['cacheStore/getCachedMainPosts'];
    if (cachedMainPosts == null) {
      this.fetchPosts();
    } else {
      this.simplePosts = cachedMainPosts.simplePosts;
      this.cursorId = cachedMainPosts.cursorId;
      this.isNoMorePage = cachedMainPosts.isNoMorePage;
    }
  },
});
</script>

<style scoped>

.main-container {
  min-height: 100vh;
}

.observer-trigger-enable {
  height: 720px;
  position: relative;
  margin-top: -600px;
}

.loading {
  display: flex;
  justify-content: center;
  margin-bottom: calc(var(--base-gap) * 2);
  box-sizing: border-box;
  height: 80px;
}

</style>
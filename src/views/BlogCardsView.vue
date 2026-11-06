<template>
  <div class="cards-page" :class="{ embed: isEmbed }">
    <div class="container cards-inner">
      <header v-if="owner" class="cards-head">
        <router-link class="owner" :to="`/${blogId}`" :target="isEmbed ? '_blank' : undefined">
          <account-profile-image class="owner-avatar" :simple-account="owner"/>
          <span class="owner-text">
            <span class="owner-name">{{ owner.name }}의 글</span>
            <span class="owner-sub subtle small">{{ tag ? `#${tag} · ` : '' }}{{ postCount }}개 · hwanstory.kr/{{ blogId }}</span>
          </span>
        </router-link>
        <div v-if="!isEmbed" class="head-actions">
          <router-link class="btn btn-secondary btn-sm" :to="`/${blogId}`">블로그 홈</router-link>
        </div>
      </header>

      <div v-if="tagCounts.length > 0" class="tag-strip">
        <router-link class="chip" :class="{ 'chip-neutral': !!tag }" :to="cardsPath()">전체</router-link>
        <router-link v-for="tagCount in tagCounts" :key="tagCount.name" class="chip" :class="{ 'chip-neutral': tag !== tagCount.name }"
                     :to="cardsPath(tagCount.name)">{{ tagCount.name }}</router-link>
      </div>

      <simple-post-wrap-panel :simple-posts="simplePosts"/>
      <div v-if="!isLoading && isEmpty" class="empty-state">
        <div class="empty-icon"><app-icon name="file-text" :size="26"/></div>
        <div class="empty-title">아직 글이 없습니다</div>
      </div>
      <observer-trigger v-if="!isNoMorePage && !isLoading" @trigger="loadMore"/>
      <div v-if="isLoading" class="loading"><loading-spinner/></div>

      <footer v-if="isEmbed" class="embed-foot subtle small">
        <a :href="`${siteBaseUrl}/${blogId}`" target="_blank" rel="noopener">Hwan'Story 에서 보기</a>
      </footer>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { getBlogAllPosts, getBlogDetails } from '@/api/blog';
import { HttpApiError } from '@/api/common/httpApiClient';
import { AccountDto } from '@/api/models/account.dtos';
import { SimplePostDto, TagCountDto } from '@/api/models/blog.dtos';
import SimplePostWrapPanel from '@/components/posts/layout/SimplePostWrapPanel.vue';
import AccountProfileImage from '@/components/accounts/AccountProfileImage.vue';
import ObserverTrigger from '@/components/common/ObserverTrigger.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import AppIcon from '@/components/common/AppIcon.vue';
import { siteBaseUrl } from '@/utils/seo';
import { toast } from '@/utils/dialog';

// 한 사람의 글만 메인 화면처럼 카드로 보여주는 화면. 다른 사이트에 iframe 으로 넣을 수 있게 ?embed=1 이면 헤더·바닥글을 숨긴다.
export default defineComponent({
  name: 'BlogCardsView',
  components: { AppIcon, LoadingSpinner, ObserverTrigger, AccountProfileImage, SimplePostWrapPanel },
  props: {
    blogId: {
      type: String,
      required: true,
    },
    tag: {
      type: String,
      required: false,
    },
  },
  data() {
    return {
      owner: null as AccountDto | null,
      postCount: 0,
      tagCounts: Array<TagCountDto>(),
      simplePosts: Array<SimplePostDto>(),
      cursorId: '',
      isNoMorePage: true,
      isLoading: false,
      isEmpty: false,
      siteBaseUrl,
    };
  },
  computed: {
    isEmbed(): boolean {
      return this.$route.query.embed === '1' || this.$route.query.embed === 'true';
    },
  },
  watch: {
    blogId() {
      this.loadBlog();
      this.fetchPosts();
    },
    tag() {
      this.fetchPosts();
    },
  },
  methods: {
    cardsPath(tag?: string) {
      return { path: `/${this.blogId}/cards`, query: { ...(tag ? { tag } : {}), ...(this.isEmbed ? { embed: '1' } : {}) } };
    },
    async loadBlog() {
      await getBlogDetails(this.blogId)
      .then((details) => {
        this.owner = details.owner;
        this.postCount = details.postCount;
        this.tagCounts = details.tagCounts;
        document.title = `${details.owner.name}의 글 | Hwan'Story`;
      })
      .catch((error: HttpApiError) => {
        if (error.isNotFound()) {
          this.$router.replace('/not-found');
        } else {
          toast.error(error.getErrorMessage());
        }
      });
    },
    async fetchPosts(cursorId: string | null = null) {
      try {
        this.isLoading = true;
        await getBlogAllPosts(this.blogId, this.tag ?? null, 24, cursorId)
        .then((posts) => {
          if (posts.first) {
            this.simplePosts = posts.data;
          } else {
            posts.data.forEach((post) => this.simplePosts.push(post));
          }
          this.cursorId = (!posts.last && posts.cursorId) ? posts.cursorId : '';
          this.isNoMorePage = posts.last;
          this.isEmpty = posts.last && this.simplePosts.length === 0;
        })
        .catch((error: HttpApiError) => {
          toast.error(error.getErrorMessage());
        });
      } finally {
        this.isLoading = false;
      }
    },
    async loadMore() {
      if (this.cursorId) {
        await this.fetchPosts(this.cursorId);
      }
    },
  },
  mounted() {
    this.loadBlog();
    this.fetchPosts();
  },
});
</script>

<style scoped>
.cards-page {
  padding-block: var(--s-6) var(--s-16);
}

.cards-page.embed {
  padding-block: var(--s-4) var(--s-6);
}

.cards-inner {
  display: grid;
  gap: var(--s-5);
}

.cards-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-4);
}

.owner {
  display: inline-flex;
  align-items: center;
  gap: var(--s-3);
  color: var(--text);
  min-width: 0;
}

.owner:hover {
  text-decoration: none;
}

.owner-avatar {
  width: 44px;
  height: 44px;
}

.owner-text {
  display: grid;
  min-width: 0;
}

.owner-name {
  font-size: var(--text-lg);
  font-weight: 800;
  letter-spacing: -0.01em;
}

.owner-sub {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-strip {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
  padding-bottom: 2px;
}

.tag-strip::-webkit-scrollbar {
  display: none;
}

.tag-strip .chip {
  flex-shrink: 0;
  height: 30px;
  padding: 0 12px;
}

.loading {
  display: flex;
  justify-content: center;
  height: 64px;
}

.embed-foot {
  text-align: center;
}
</style>

<template>
  <div v-if="isLoaded" class="blog-page">
    <section class="profile-band">
      <div class="container profile">
        <account-profile-image-button class="profile-avatar" :simple-account="blogOwner"/>
        <div class="profile-body">
          <div class="profile-head">
            <h1 class="profile-name">{{ blogOwner.name }}</h1>
            <span class="profile-id subtle">{{ blogOwner.blogId }}</span>
          </div>
          <p v-if="blogOwner.biography" class="profile-bio">{{ blogOwner.biography }}</p>
          <div class="profile-facts">
            <span v-if="blogOwner.company" class="fact"><app-icon name="briefcase" :size="15"/>{{ blogOwner.company }}</span>
            <span v-if="blogOwner.location" class="fact"><app-icon name="map-pin" :size="15"/>{{ blogOwner.location }}</span>
            <a v-if="blogOwner.homepage" class="fact" :href="homepageHref" target="_blank" rel="noopener">
              <app-icon name="link" :size="15"/>{{ homepageLabel }}
            </a>
            <a v-if="blogOwner.email" class="fact" :href="`mailto:${blogOwner.email}`">
              <app-icon name="mail" :size="15"/>{{ blogOwner.email }}
            </a>
          </div>
          <div class="profile-counts">
            <router-link :to="`/${blogId}/followers`"><b class="num">{{ followerCount }}</b> 팔로워</router-link>
            <router-link :to="`/${blogId}/followings`"><b class="num">{{ followingCount }}</b> 팔로잉</router-link>
            <span><b class="num">{{ postCount }}</b> 글</span>
          </div>
        </div>
        <div class="profile-actions">
          <button v-if="canFollow" class="btn" :class="{ 'btn-secondary': isFollowingOwner }" type="button"
                  :disabled="followLoading" @click="toggleFollow">
            <app-icon v-if="isFollowingOwner" name="check" :size="16"/>
            {{ isFollowingOwner ? '팔로잉' : '팔로우' }}
          </button>
          <router-link v-else-if="isMyBlog" class="btn btn-secondary" to="/setting">
            <app-icon name="settings" :size="16"/>프로필 수정
          </router-link>
        </div>
      </div>
      <div class="container">
        <nav class="tabs blog-tabs" aria-label="블로그 메뉴">
          <router-link :to="`/${blogId}`">소개</router-link>
          <router-link :to="`/${blogId}/posts`" :class="{ 'router-link-exact-active': isPostsTab }">
            글 <span class="count num">{{ postCount }}</span>
          </router-link>
          <router-link :to="`/${blogId}/likes`">좋아요 한 글</router-link>
        </nav>
      </div>
    </section>

    <div class="container blog-content" :class="{ 'with-sidebar': showTagSidebar }">
      <aside v-if="showTagSidebar" class="tag-sidebar">
        <div class="tag-title">태그</div>
        <div class="tag-list">
          <router-link :to="`/${blogId}/posts`" class="tag-link" :class="{ active: !activeTag }">
            전체 <span class="num">{{ postCount }}</span>
          </router-link>
          <router-link v-for="tagCount in tagCounts" :key="tagCount.name"
                       :to="{ path: `/${blogId}/posts`, query: { tag: tagCount.name } }"
                       class="tag-link" :class="{ active: activeTag === tagCount.name }">
            {{ tagCount.name }} <span class="num">{{ tagCount.count }}</span>
          </router-link>
        </div>
      </aside>
      <div class="blog-main">
        <router-view/>
      </div>
    </div>
  </div>
  <div v-else class="container page loading">
    <loading-spinner/>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { getBlogDetails } from '@/api/blog';
import { follow, isFollowing, unfollow } from '@/api/follow';
import { HttpApiError } from '@/api/common/httpApiClient';
import { AccountDto } from '@/api/models/account.dtos';
import AccountProfileImageButton from '@/components/accounts/AccountProfileImageButton.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import AppIcon from '@/components/common/AppIcon.vue';
import { TagCountDto } from '@/api/models/blog.dtos';
import store from '@/store';
import { toast } from '@/utils/dialog';

export default defineComponent({
  name: 'BlogView',
  components: { AppIcon, LoadingSpinner, AccountProfileImageButton },
  props: {
    blogId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      blogOwner: {} as AccountDto,
      postCount: 0,
      followerCount: 0,
      followingCount: 0,
      tagCounts: Array<TagCountDto>(),
      isLoaded: false,
      isFollowingOwner: false,
      followLoading: false,
    };
  },
  computed: {
    isLoggedIn(): boolean {
      return store.getters['accountStore/isLoggedIn'] ?? false;
    },
    isMyBlog(): boolean {
      return this.blogId === store.state.accountStore.blogId;
    },
    // 로그인 했고 내 블로그가 아닐 때만 팔로우 버튼을 노출한다.
    canFollow(): boolean {
      return this.isLoggedIn && !this.isMyBlog && this.isLoaded;
    },
    isPostsTab(): boolean {
      return this.$route.path === `/${this.blogId}/posts`;
    },
    activeTag(): string {
      return (this.$route.query.tag as string) ?? '';
    },
    showTagSidebar(): boolean {
      return this.isPostsTab && this.tagCounts.length > 0;
    },
    homepageHref(): string {
      const homepage = this.blogOwner.homepage ?? '';
      return /^https?:\/\//i.test(homepage) ? homepage : `https://${homepage}`;
    },
    homepageLabel(): string {
      return (this.blogOwner.homepage ?? '').replace(/^https?:\/\//i, '').replace(/\/$/, '');
    },
  },
  watch: {
    blogId() {
      this.isLoaded = false;
      this.loadBlog();
    },
  },
  methods: {
    async loadBlog() {
      await getBlogDetails(this.blogId)
      .then((blogDetails) => {
        this.blogOwner = blogDetails.owner;
        this.postCount = blogDetails.postCount;
        this.followerCount = blogDetails.followerCount;
        this.followingCount = blogDetails.followingCount;
        this.tagCounts = blogDetails.tagCounts;
        this.isLoaded = true;
        this.loadFollowingState();
      })
      .catch((error: HttpApiError) => {
        if (error.isNotFound()) {
          this.$router.replace('/not-found');
        } else {
          toast.error(error.getErrorMessage());
          this.$router.push('/');
        }
      });
    },
    async loadFollowingState() {
      // 로그인 상태이고 내 블로그가 아닐 때만 팔로우 여부를 확인한다.
      if (!this.isLoggedIn || this.isMyBlog) {
        this.isFollowingOwner = false;
        return;
      }
      await isFollowing(this.blogId)
      .then(() => {
        this.isFollowingOwner = true;
      })
      .catch(() => {
        // 404 = 팔로우하고 있지 않음
        this.isFollowingOwner = false;
      });
    },
    async toggleFollow() {
      if (this.followLoading) {
        return;
      }
      this.followLoading = true;
      const action = this.isFollowingOwner ? unfollow(this.blogId) : follow(this.blogId);
      await action
      .then(() => {
        if (this.isFollowingOwner) {
          this.isFollowingOwner = false;
          this.followerCount = Math.max(0, this.followerCount - 1);
          toast.info('팔로우를 취소했습니다.');
        } else {
          this.isFollowingOwner = true;
          this.followerCount += 1;
          toast.success(`${this.blogOwner.name}님을 팔로우합니다. 새 글이 팔로잉 피드에 보여요.`);
        }
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
      })
      .finally(() => {
        this.followLoading = false;
      });
    },
  },
  created() {
    this.loadBlog();
  },
});
</script>

<style scoped>
.loading {
  display: grid;
  place-items: center;
  min-height: 40vh;
}

.profile-band {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

.profile {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: var(--s-6);
  align-items: start;
  padding-block: var(--s-10) var(--s-6);
}

.profile-avatar {
  width: 104px;
  height: 104px;
}

.profile-body {
  display: grid;
  gap: var(--s-3);
  min-width: 0;
}

.profile-head {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: var(--s-2) var(--s-3);
}

.profile-name {
  font-size: var(--text-3xl);
  letter-spacing: -0.02em;
}

.profile-bio {
  color: var(--text-2);
  max-width: 60ch;
  line-height: 1.6;
  word-break: keep-all;
}

.profile-facts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2) var(--s-4);
  font-size: var(--text-sm);
  color: var(--text-2);
}

.fact {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-2);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

a.fact:hover {
  color: var(--accent-text);
  text-decoration: none;
}

.profile-counts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-4);
  font-size: var(--text-sm);
  color: var(--text-2);
}

.profile-counts a {
  color: var(--text-2);
}

.profile-counts a:hover {
  color: var(--text);
  text-decoration: none;
}

.profile-counts b {
  color: var(--text);
  font-weight: 700;
}

.profile-actions {
  display: flex;
  gap: var(--s-2);
}

.blog-tabs {
  margin-top: var(--s-2);
  border-bottom: none;
}

.blog-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-10);
  padding-block: var(--s-6) var(--s-16);
}

.blog-content.with-sidebar {
  grid-template-columns: 200px minmax(0, 1fr);
}

.blog-main {
  min-width: 0;
  max-width: var(--narrow-max);
}

.tag-sidebar {
  position: sticky;
  top: calc(var(--header-height) + var(--s-6));
  align-self: start;
}

.tag-title {
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: var(--s-2);
}

.tag-list {
  display: grid;
  gap: 2px;
}

.tag-link {
  display: flex;
  justify-content: space-between;
  gap: var(--s-2);
  padding: 7px 10px;
  border-radius: var(--radius-sm);
  color: var(--text-2);
  font-size: var(--text-sm);
  min-width: 0;
}

.tag-link span {
  color: var(--text-3);
}

.tag-link:hover {
  background: var(--hover-color);
  color: var(--text);
  text-decoration: none;
}

.tag-link.active {
  background: var(--accent-soft);
  color: var(--accent-text);
  font-weight: 700;
}

@media (max-width: 900px) {
  .blog-content.with-sidebar {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--s-4);
  }

  .tag-sidebar {
    position: static;
  }

  .tag-title {
    display: none;
  }

  .tag-list {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: none;
  }

  .tag-list::-webkit-scrollbar {
    display: none;
  }

  .tag-link {
    flex-shrink: 0;
    height: 30px;
    padding: 0 12px;
    border-radius: var(--radius-pill);
    background: var(--surface-2);
    align-items: center;
    gap: 6px;
  }
}

@media (max-width: 640px) {
  .profile {
    grid-template-columns: auto minmax(0, 1fr);
    gap: var(--s-4);
    padding-block: var(--s-6) var(--s-4);
  }

  .profile-avatar {
    width: 72px;
    height: 72px;
  }

  .profile-name {
    font-size: var(--text-2xl);
  }

  .profile-actions {
    grid-column: 1 / -1;
  }

  .profile-actions .btn {
    width: 100%;
  }
}
</style>

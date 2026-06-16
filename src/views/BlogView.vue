<template>
  <div v-show="isLoaded" class="blog-container">
    <div class="profile-container">
      <div class="profile-image">
        <account-profile-image-button :simple-account="blogOwner"/>
      </div>
      <div class="bio">
        <div class="name">
          {{ blogOwner.name }}
        </div>
        <div class="contact">
          <a :href="`mailto:${blogOwner.email}}`">{{ blogOwner.email }}</a>
        </div>
        <div class="homepage" v-if="blogOwner.homepage">
          <a :href="`${blogOwner.homepage}`">{{ blogOwner.homepage }}</a>
        </div>
        <div class="content">
          {{ blogOwner.biography }}
        </div>
        <div class="follow-row">
          <div class="follow-counts">
            <router-link :to="{path: `/${blogId}/followers`}">
              팔로워 <strong>{{ followerCount }}</strong>
            </router-link>
            <span class="dot">&#183;</span>
            <router-link :to="{path: `/${blogId}/followings`}">
              팔로잉 <strong>{{ followingCount }}</strong>
            </router-link>
          </div>
          <button v-if="canFollow" class="follow-button" :class="{ following: isFollowingOwner }"
                  :disabled="followLoading" @click="toggleFollow">
            {{ isFollowingOwner ? '팔로잉' : '팔로우' }}
          </button>
        </div>
      </div>
    </div>
    <div class="blog-tabs-container">
      <div class="tabs">
        <router-link :to="{path: `/${blogId}`}">
          소개
        </router-link>
        <router-link :to="{path: `/${blogId}/posts`}">
          게시글
        </router-link>
        <router-link :to="{path: `/${blogId}/likes`}">
          좋아요 한 글
        </router-link>
      </div>
      <div class="content-container">
        <div class="content-sidebar">
          <router-link :to="{path: `/${blogId}/posts`}" v-slot="{ isActive }" custom>
            <div v-if="isActive && postCount > 0" class="tag-container">
              <div class="tag-title">
                태그 목록
              </div>
              <div class="tag-list">
                <router-link :to="{path: `/${blogId}/posts`}" v-slot="{ route, href, navigate }" custom>
                  <div :style="{ marginBottom: '10px' }"
                       :class="$route.fullPath === route.fullPath ? 'tag-active' : null"
                       @click="navigate">
                    <a :href="href">전체보기</a><span>&nbsp;({{ postCount }})</span>
                  </div>
                </router-link>
                <router-link v-for="tagCount in tagCounts" :key="tagCount.name"
                             :to="{path: `/${blogId}/posts`, query: {tag: tagCount.name}}"
                             v-slot="{ route, href, navigate }" custom>
                  <div :class="$route.fullPath === route.fullPath ? 'tag-active' : null" @click="navigate">
                    <a :href="href">{{ tagCount.name }}</a><span>&nbsp;({{ tagCount.count }})</span>
                  </div>
                </router-link>
              </div>
            </div>
          </router-link>
        </div>
        <router-view/>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { getBlogDetails } from '@/api/blog';
import { follow, isFollowing, unfollow } from '@/api/follow';
import { HttpApiError } from '@/api/common/httpApiClient';
import { AccountDto } from '@/api/models/account.dtos';
import AccountProfileImageButton from '@/components/accounts/AccountProfileImageButton.vue';
import { TagCountDto } from "@/api/models/blog.dtos";
import store from '@/store';

export default defineComponent({
  name: 'BlogView',
  components: { AccountProfileImageButton },
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
  },
  watch: {
    blogId() {
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
          this.$router.push(`/not-found`);
        } else {
          alert(error.getErrorMessage());
          this.$router.push(`/`);
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
        } else {
          this.isFollowingOwner = true;
          this.followerCount += 1;
        }
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
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

.blog-container {
  display: grid;

  grid-template-columns: 750px;
  grid-template-rows: auto 1fr;

  justify-content: center;
  padding: var(--base-gap);

  box-sizing: border-box;
}

@media (max-width: 800px) {
  .blog-container {
    grid-template-columns: minmax(0, auto);
    justify-content: stretch;
  }
}

.profile-container {
  display: grid;

  grid-template-columns: minmax(150px, 1fr) 3fr;
  grid-template-rows: auto;

  padding: 2em 0;

  box-sizing: border-box;
  border-bottom: 1px solid var(--border-color);
}

.profile-image {
  align-self: center;
}

.bio {
  display: grid;

  grid-template-columns: 1fr;
  grid-template-rows: auto auto auto 1fr;

  margin-left: 4em;
}

.bio .name {
  font-size: 2.5em;
}

.bio .contact {
  font-size: 0.75em;
  color: var(--link-accent-color);
}

.bio .homepage {
  font-size: 0.75em;
  color: var(--link-accent-color);
}

.bio .content {
  font-size: 1em;
  margin-top: 1em;;
}

.follow-row {
  display: flex;
  align-items: center;
  gap: 1em;
  margin-top: 1em;
  flex-wrap: wrap;
}

.follow-counts {
  font-size: 0.9em;
}

.follow-counts a {
  color: var(--base-color);
}

@media (hover: hover) and (pointer: fine) {
  .follow-counts a:hover {
    text-decoration: underline;
  }
}

.follow-counts .dot {
  margin: 0 0.5em;
  color: grey;
}

.follow-button {
  padding: 6px 18px;
  border-radius: var(--base-border-radius);
  border: 1px solid var(--button-color);
  background: var(--button-color);
  color: white;
  cursor: pointer;
  transition: 0.2s;
}

.follow-button.following {
  background: transparent;
  color: var(--base-color);
  border: 1px solid var(--border-color);
}

.follow-button:disabled {
  opacity: 0.6;
  cursor: default;
}

.tabs {
  border-bottom: 1px solid var(--border-color);

  display: grid;

  margin-bottom: var(--base-gap);

  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto;
  box-sizing: border-box;
}

.tabs a {
  color: var(--base-color);
  box-sizing: border-box;
  text-align: center;
  align-self: stretch;
  padding: 15px;
  border-bottom: 4px solid transparent;

  transition: 0.2s;
}

@media (hover: hover) and (pointer: fine) {
  .tabs a:hover {
    background-color: var(--border-color);
    text-decoration: none;
  }
}

.tabs a.router-link-exact-active {
  font-weight: bold;
  background-color: var(--border-color);
  border-bottom: 4px solid var(--button-color);
}

.content-sidebar {
  position: absolute;
  width: calc((100% - 750px) / 2);
  left: 0;

  display: flex;
  justify-content: right;
}

@media (max-width: 1250px) {
  .content-sidebar {
    display: none;
  }
}

.tag-container {
  width: 200px;
  margin-right: 20px;
}

.tag-title {
  border-bottom: solid 1px var(--border-color);
  padding-bottom: 10px;
  margin-bottom: 10px;
  font-size: 1.15em;
}

.tag-list {
  font-size: 0.9em;
  line-height: 1.75;
  white-space: nowrap;
}

.tag-list a {
  color: var(--base-color);
}

@media (hover: hover) and (pointer: fine) {
  .tag-list a:hover {
    text-decoration: underline;
  }
}

.tag-active a {
  color: var(--link-accent-color);
}

.tag-list span {
  color: grey;
}

</style>
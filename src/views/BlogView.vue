<template>
  <div v-show="isLoaded" class="blog-simple-post-container">
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
        <div class="content">
          {{ blogOwner.biography }}
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
      <router-view/>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { getBlogDetails } from '@/api/blog';
import { HttpApiError } from '@/api/common/httpApiClient';
import { AccountDto } from '@/api/models/account.dtos';
import AccountProfileImageButton from '@/components/accounts/AccountProfileImageButton.vue';

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
      isLoaded: false,
    };
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
        this.isLoaded = true;
      })
      .catch((error: HttpApiError) => {
        if (error.isNotFound()) {
          this.$router.push(`/not-found`);
        } else {
          alert(error.getErrorMessage());
          this.$router.push(`/main`);
        }
      });
    },
  },
  created() {
    this.loadBlog();
  },
});
</script>

<style scoped>

.blog-simple-post-container {
  display: grid;

  grid-template-columns: 750px;
  grid-template-rows: auto 1fr;

  justify-content: center;
  padding: var(--base-gap);

  box-sizing: border-box;
}

@media (max-width: 800px) {
  .blog-simple-post-container {
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
  grid-template-rows: auto auto 1fr;

  margin-left: 4em;
}

.bio .name {
  font-size: 2.5em;
}

.bio .contact {
  font-size: 0.75em;
  color: var(--link-accent-color)
}

.bio .content {
  font-size: 1em;
  margin-top: 1em;;
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

.tabs a:hover {
  background-color: var(--border-color);
  text-decoration: none;
}

.tabs a.router-link-exact-active {
  font-weight: bold;
  background-color: var(--border-color);
  border-bottom: 4px solid var(--button-color);
}

</style>
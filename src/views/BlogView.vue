<template>
  <div class="blog-simple-post-container">
    <div class="profile-container">
      <div class="profile-image">
        <account-profile-image-button :simple-account="blogOwner" />
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
    <div>

    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { SimplePostDto } from "@/api/models/blog.dtos";
import { getBlogDetails, getBlogPosts } from '@/api/blog';
import { HttpApiError } from "@/api/common/httpApiClient";
import { AccountDto } from "@/api/models/account.dtos";
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
      simplePosts: Array<SimplePostDto>(),
      cursorId: '',
      isNoMorePage: false,
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
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      });
      await this.fetchBlogPosts();
    },
    async fetchBlogPosts(cursorId: string | null = null) {
      if (!this.blogId)
        return;

      await getBlogPosts(this.blogId, 10, cursorId)
      .then((posts) => {
        if (posts.first) {
          this.simplePosts = posts.data;
        } else {
          posts.data.forEach((post) => {
            this.simplePosts.push(post);
          });
        }
        this.cursorId = (!posts.last && posts.cursorId) ? posts.cursorId : '';
        this.isNoMorePage = posts.last;
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      });
    },
    async loadMorePosts() {
      if (this.cursorId) {
        await this.fetchBlogPosts(this.cursorId);
      }
    },
  },
  created() {
    this.loadBlog();
  }
});
</script>

<style scoped>

.blog-simple-post-container {
  display: grid;

  grid-template-columns: 650px;
  grid-auto-rows: auto;

  justify-content: center;
  padding: var(--base-gap);
}

@media (max-width: 800px) {
  .blog-simple-post-container {
    grid-template-columns: auto;
    justify-content: stretch;
  }
}

.profile-container {
  display: grid;

  grid-template-columns: 1fr 3fr;
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

</style>
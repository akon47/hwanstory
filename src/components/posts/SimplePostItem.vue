<template>
  <div class="simple-post-item-container">
    <div class="thumbnail" @click="moveToPost" :style="gradient"/>
    <div class="title" @click="moveToPost">
      {{ simplePost.title }}
    </div>
    <div class="content" @click="moveToPost">
      {{ simplePost.content }}
    </div>
    <div class="footer">
      <div class="footer-content">
        <div class="author">
          <account-profile-image-button :simple-account="simplePost.author"/>
          <div class="name">
            by&nbsp;<a @click="moveToBlog"><b>{{ simplePost.author?.name }}</b></a>
          </div>
        </div>
        <div>

        </div>
        <div class="comments">
          💬{{ simplePost.commentCount }}
        </div>
        <div class="likes">
          ❤️{{ likeCount }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { SimplePostDto } from '@/api/models/blog.dtos';
import { defineComponent, PropType } from 'vue';
import store from '@/store';
import AccountProfileImageButton from '@/components/accounts/AccountProfileImageButton.vue';

export default defineComponent({
  name: 'SimplePostItem',
  components: { AccountProfileImageButton },
  props: {
    simplePost: Object as PropType<SimplePostDto>,
  },
  data() {
    return {
      likeCount: 0,
    };
  },
  computed: {
    isMyPost() {
      return this.simplePost?.blogId === store.state.accountStore.blogId;
    },
    gradient() {
      let date = new Date(this.simplePost?.createdAt ?? 0).getTime() ?? 1;
      const random = () => {
        const x = Math.sin(date++) * 10000;
        return x - Math.floor(x);
      };

      const direction = Math.round(Math.random() * 360); //To output a volue between 0 and 360 in degrees to be given to the linear-gradient.

      const r1 = Math.round(random() * 255);
      const g1 = Math.round(random() * 255);
      const b1 = Math.round(random() * 255);
      const a1 = 1;

      const r2 = Math.round(random() * 255);
      const g2 = Math.round(random() * 255);
      const b2 = Math.round(random() * 255);
      const a2 = 1;

      return {
        background: `linear-gradient(${direction}deg, rgba(${r1},${g1},${b1},${a1}), rgba(${r2},${g2},${b2},${a2}))`,
      };
    },
  },
  methods: {
    moveToPost() {
      this.$router.push(`/${this.simplePost?.blogId}/${this.simplePost?.postUrl}`);
    },
    moveToBlog() {
      this.$router.push(`/${this.simplePost?.blogId}`);
    },
  },
});
</script>

<style scoped>

.simple-post-item-container {
  display: grid;

  grid-template-columns: 1fr;
  grid-template-rows: auto auto 1fr 40px;

  width: 100%;
  aspect-ratio: 10 / 12;

  border: 1px solid var(--border-color);
  border-radius: var(--base-border-radius);

  background: var(--content-item-background-color);
  transition: box-shadow .2s;
}

.simple-post-item-container:hover {
  box-shadow: 0 0 11px var(--base-shadow-color);
  cursor: pointer;
}

.simple-post-item-container .thumbnail {
  aspect-ratio: 16 / 9;
  border-bottom: 1px solid var(--border-color);
  box-sizing: border-box;

  border-top-left-radius: var(--base-border-radius);
  border-top-right-radius: var(--base-border-radius);

  background-size: cover;
  background: white no-repeat;
}

.simple-post-item-container .title {
  font-size: 16px;
  font-weight: 500;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  margin: var(--half-base-gab);
}

.simple-post-item-container .content {
  font-size: 14px;
  font-weight: normal;

  overflow: hidden;
  text-overflow: ellipsis;

  margin: 0 var(--half-base-gab) var(--half-base-gab) var(--half-base-gab)
}

.simple-post-item-container .footer {
  display: grid;
  border-top: 1px solid var(--border-color);

  align-items: center;
}

.footer {
  cursor: auto;
}

.footer .footer-content {
  display: grid;

  grid-template-columns: auto 1fr auto auto;
  grid-template-rows: 1fr;

  column-gap: 5px;

  font-size: 12px;
  font-weight: normal;
  margin: 0 var(--half-base-gab);

  align-items: center;
}

.footer-content .author {
  display: grid;

  grid-template-columns: 30px auto;
  grid-template-rows: auto;

  align-items: center;
  gap: 5px;
}


</style>
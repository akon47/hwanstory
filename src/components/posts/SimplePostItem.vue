<template>
  <div class="simple-post-item-container">
    <div class="main" @click="moveToPost">
      <div class="thumbnail" :style="gradient">
        <div class="thumbnail-title">
          {{ simplePost.title }}
        </div>
        <div class="author-profile-image">
          <account-profile-image :simple-account="simplePost.author"/>
        </div>
      </div>
      <div class="title">
        {{ simplePost.title }}
      </div>
      <div class="content">
        {{ simplePost.content }}
      </div>
      <div class="counts">
        {{ simplePost.likeCount }} 개의 좋아요
        <span>&#183;</span>
        {{ simplePost.commentCount }} 개의 댓글
      </div>
    </div>
    <div class="footer">
      <div class="footer-content">
        <div>
          {{ createdAt }}
        </div>
        <div class="author" @click="moveToBlog">
          by&nbsp;{{ simplePost.author?.name }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { SimplePostDto } from '@/api/models/blog.dtos';
import { defineComponent, PropType } from 'vue';
import AccountProfileImage from '@/components/accounts/AccountProfileImage.vue';
import dayjs from 'dayjs';

export default defineComponent({
  name: 'SimplePostItem',
  components: { AccountProfileImage },
  props: {
    simplePost: Object as PropType<SimplePostDto>,
  },
  computed: {
    createdAt() {
      return dayjs(this.simplePost?.createdAt).format('YYYY.MM.DD hh:mm');
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

  grid-template-columns: auto;
  grid-template-rows: auto 40px;

  width: 100%;
  aspect-ratio: 10 / 13;

  border: 1px solid var(--border-color);
  border-radius: var(--base-border-radius);

  background: var(--content-item-background-color);
  transition: box-shadow .2s;
}

.simple-post-item-container:hover {
  box-shadow: 0 0 11px var(--base-shadow-color);
  cursor: pointer;
}

@media (max-width: 1080px) {
  .simple-post-item-container {
    aspect-ratio: auto;
  }
}

.main {
  display: grid;

  grid-template-columns: 1fr;
  grid-template-rows: auto auto 1fr auto;
}


.main .thumbnail {
  display: grid;
  aspect-ratio: 16 / 9;
  border-bottom: 1px solid var(--border-color);
  box-sizing: border-box;

  border-top-left-radius: var(--base-border-radius);
  border-top-right-radius: var(--base-border-radius);

  background-size: cover;
  background: white no-repeat;

  position: relative;

  margin-bottom: 25px;
}

.thumbnail .author-profile-image {
  width: 50px;
  height: 50px;

  position: absolute;

  margin-left: var(--base-gap);
  bottom: -25px;
}

.thumbnail-title {
  font-size: 1.75em;
  font-weight: bold;
  color: #e5e5e5;
  text-shadow: 0 0 12px #000;
  align-self: center;
  justify-self: stretch;

  text-align: center;

  overflow: hidden;
  text-overflow: ellipsis;

  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;

  margin: 0 1em;
}

.main .title {
  font-size: 18px;
  font-weight: 500;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  margin: 10px var(--half-base-gab);

  align-self: start;
}

.main .content {
  font-size: 14px;
  font-weight: 400;

  overflow: hidden;
  text-overflow: ellipsis;

  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
  align-self: start;

  margin-left: var(--half-base-gab);
  margin-right: var(--half-base-gab);
  margin-bottom: var(--half-base-gab);
}

.main .counts {
  font-size: 12px;

  justify-self: right;

  margin-right: var(--half-base-gab);
  margin-bottom: var(--half-base-gab);
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

  grid-template-columns: 1fr auto;
  grid-template-rows: 1fr;

  font-size: 12px;
  font-weight: normal;
  margin: 0 var(--half-base-gab);

  align-items: center;
}

.footer-content .author {
  cursor: pointer;
}

.footer-content .author:hover {
  text-decoration: underline;
}

</style>
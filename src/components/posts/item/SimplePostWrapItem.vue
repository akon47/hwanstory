<template>
  <div class="simple-post-item-container">
    <router-link :to="`/${this.simplePost?.blogId}/posts/${this.simplePost?.postUrl}`">
      <div class="main">
        <div class="thumbnail" :style="thumbnailStyle">
          <div v-if="!simplePost?.thumbnailImageUrl" class="thumbnail-title">
            {{ simplePost?.title }}
          </div>
          <div class="author-profile-image">
            <account-profile-image :simple-account="simplePost?.author"/>
          </div>
        </div>
        <div class="title">
          {{ simplePost?.title }}
        </div>
        <div class="content">
          {{ simplePost?.summary }}
        </div>
        <div class="counts">
          {{ simplePost?.likeCount }} 개의 좋아요
          <span>&#183;</span>
          {{ simplePost?.commentCount }} 개의 댓글
        </div>
      </div>
    </router-link>
    <div class="footer">
      <div class="footer-content">
        <div>
          {{ createdAt }}
          <span>&#183;</span>
          {{ simplePost?.hits }} 조회됨
        </div>
        <router-link :to="`/${this.simplePost?.blogId}`">
          <div class="author">
            by&nbsp;{{ simplePost?.author?.name }}
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { SimplePostDto } from '@/api/models/blog.dtos';
import { defineComponent, PropType } from 'vue';
import AccountProfileImage from '@/components/accounts/AccountProfileImage.vue';
import dayjs from 'dayjs';
import { attachmentFileBaseUrl } from '@/api/common/httpApiClient';

export default defineComponent({
  name: 'SimplePostWrapItem',
  components: { AccountProfileImage },
  props: {
    simplePost: Object as PropType<SimplePostDto>,
  },
  computed: {
    createdAt() {
      return dayjs(this.simplePost?.createdAt).format('YYYY.MM.DD H:mm');
    },
    thumbnailStyle() {
      if (this.simplePost?.thumbnailImageUrl) {
        return {
          backgroundImage: `url(${attachmentFileBaseUrl}${this.simplePost?.thumbnailImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        };
      }

      let date = new Date(this.simplePost?.createdAt ?? 0).getTime() ?? 1;
      const random = () => {
        const x = Math.sin(date++) * 10000;
        return x - Math.floor(x);
      };

      const direction = Math.round(random() * 360);

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
});
</script>

<style scoped>

.simple-post-item-container {
  display: grid;

  grid-template-columns: auto;
  grid-template-rows: auto 40px;

  width: 100%;
  aspect-ratio: 10 / 13;

  border-radius: var(--base-border-radius);

  background: var(--content-item-background-color);
  transition: all .2s;
}

@media (hover: hover) and (pointer: fine) {
  .simple-post-item-container:hover {
    box-shadow: 0 0 11px var(--base-shadow-color);
    cursor: pointer;
  }
}

.simple-post-item-container a {
  color: var(--base-color);
  text-decoration: none;
}

@media (max-width: 1080px) {
  .simple-post-item-container {
    aspect-ratio: auto;
  }
}

.simple-post-item-container > a {
  display: grid;
}

.main {
  display: grid;

  grid-template-columns: 1fr;
  grid-template-rows: auto auto 1fr auto;
}


.main .thumbnail {
  display: grid;
  aspect-ratio: 16 / 9;
  box-sizing: border-box;

  border-top-left-radius: var(--base-border-radius);
  border-top-right-radius: var(--base-border-radius);
  background-color: white;

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
  text-shadow: 0 0 12px #000000;
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
<template>
  <div class="simple-post-item-container">
    <router-link :to="`/${this.simplePost?.blogId}/posts/${this.simplePost?.postUrl}`">
      <div class="inner-container">
        <div class="thumbnail" :style="thumbnailStyle">
          <div v-if="!simplePost.thumbnailImageUrl" class="thumbnail-title">
            {{ simplePost.title }}
          </div>
        </div>
        <div class="contents">
          <div class="title">
            {{ simplePost.title }}
          </div>
          <div class="summary">
            {{ simplePost.summary }}
          </div>
        </div>
      </div>
    </router-link>
    <div class="tags">
      <tag-item v-for="tag in simplePost.tags" :key="tag.name" :name="tag.name" />
    </div>
    <div class="footer">
      <div>
        {{ createdAt }}
        <span>&#183;</span>
        {{ simplePost.hits }} 조회됨
        <span class="badge" v-if="simplePost.openType == 'PRIVATE'">
          비공개 게시글
        </span>
      </div>
      <div>
        {{ simplePost.likeCount }} 개의 좋아요
        <span>&#183;</span>
        {{ simplePost.commentCount }} 개의 댓글
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { SimplePostDto } from '@/api/models/blog.dtos';
import { defineComponent, PropType } from 'vue';
import dayjs from 'dayjs';
import { attachmentFileBaseUrl } from '@/api/common/httpApiClient';
import TagItem from "@/components/posts/TagItem.vue";

export default defineComponent({
  name: 'SimplePostListItem',
  components: { TagItem },
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

  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(auto, 1fr) auto auto;

  width: 100%;

  aspect-ratio: 4 / 1;

  padding-bottom: var(--base-gap);
  margin-bottom: var(--base-gap);

  border-bottom: 1px solid var(--border-color);
  box-sizing: border-box;
}

.simple-post-item-container a {
  color: var(--base-color);
  text-decoration: none;
}

.inner-container {
  display: grid;

  grid-template-columns: minmax(0, 1fr) 2fr;
  grid-template-rows: auto;

  transition: box-shadow .2s;
}

.inner-container:hover {
  box-shadow: 0 0 11px var(--base-shadow-color);
  cursor: pointer;
}

.thumbnail {
  width: 100%;
  height: 100%;

  aspect-ratio: 16 / 9;
  box-sizing: border-box;

  background-size: cover;
  background: white no-repeat;

  transition: 0.2s;

  overflow: hidden;

  display: grid;
  align-items: center;
}

.thumbnail-title {
  font-size: 1.75em;
  font-weight: bold;
  color: #e5e5e5;
  text-shadow: 0 0 12px #000000;

  text-align: center;

  overflow: hidden;
  text-overflow: ellipsis;

  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;

  margin: 0 1em;
}

@media (max-width: 650px) {
  .thumbnail {
    aspect-ratio: 1;
  }

  .thumbnail-title {
    font-size: 1.25em;
  }
}

@media (max-width: 550px) {
  .thumbnail-title {
    font-size: 1em;
  }
}

@media (max-width: 450px) {
  .thumbnail-title {
    font-size: 0.8em;
    font-weight: normal;
  }
}

.contents {
  flex-grow: 1;

  display: grid;

  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, auto) minmax(0, 1fr);

  box-sizing: border-box;
  padding: 0.2em 0.8em;
}

.title {
  font-size: 1.5em;
  font-weight: 500;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  align-self: start;
}

.summary {
  font-size: 1em;
  font-weight: 400;

  overflow: hidden;
  text-overflow: ellipsis;

  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
  align-self: start;
}

@media (max-width: 600px) {
  .summary {
    -webkit-line-clamp: 3;
  }
}

@media (max-width: 500px) {
  .summary {
    -webkit-line-clamp: 2;
  }
}

.tags {
  display: flex;
  flex-wrap: wrap;

  align-self: end;
  justify-self: end;

  margin-top: 10px;
}

.footer {
  display: flex;
  font-size: 0.75em;
  justify-self: right;

  width: 100%;

  justify-content: space-between;
  padding: 0.3em 0.3em 0 0.3em;
}


</style>
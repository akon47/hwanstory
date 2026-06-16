<template>
  <div class="post-container">
    <div class="reading-progress">
      <div class="reading-progress-bar" :style="{ width: readingProgress + '%' }"/>
    </div>
    <div class="title">
      <h1>
        {{ post.title }}
      </h1>
      <div class="hits">
        <span>조회수 {{ post.hits }} 회 &#183; 읽는 시간 약 {{ readingTime }}분<span v-if="currentViewerCount > 0" class="now-viewing">&#183; 지금 {{ currentViewerCount }}명 보는 중</span></span>
        <span class="modified-at" v-if="longCreateAt !== longLastModifiedAt">
          {{ longLastModifiedAt }}
          마지막으로 수정됨
        </span>
      </div>
      <div class="author">
        <account-profile-image-button class="author-profile-image" :simple-account="post.author"/>
        <div class="author-name">
          {{ post.author?.name }}
        </div>
        <div class="created-at">
          {{ longCreateAt }}
          <span class="modify-actions" v-if="isMyPost">
            <a @click="modifyPost">수정</a>
            <span>&#183;</span>
            <a @click="deletePost">삭제</a>
          </span>
        </div>
        <div class="tags">
          <div class="tag-item" v-for="tag in tags" :key="tag">
            {{ tag }}
          </div>
        </div>
      </div>
    </div>
    <div class="content">
      <div v-if="series" class="series-container">
        <div class="series-title">{{ series.title }}</div>
        <div class="series-list">
          <ol>
            <router-link v-for="seriesPost in series.posts"
                         :key="seriesPost.postUrl"
                         :to="{path: `/${blogId}/posts/${seriesPost.postUrl}`}"
                         v-slot="{ route, href, navigate }" custom>
              <li>
                <div :class="$route.fullPath === route.fullPath ? 'series-active' : null" @click="navigate">
                  <a :href="href">{{ seriesPost.title }}</a>
                </div>
              </li>
            </router-link>
          </ol>
        </div>
      </div>
      <div v-if="toc.length > 0" class="toc">
        <div class="toc-title">목차</div>
        <ul>
          <li v-for="item in toc" :key="item.id" :class="`toc-level-${item.level}`">
            <a @click="scrollToHeading(item.id)">{{ item.text }}</a>
          </li>
        </ul>
      </div>
      <post-viewer :content="post.content" @rendered="buildToc"/>
    </div>
    <div class="reactions">
      <button v-for="reaction in displayReactions" :key="reaction.emoji"
              class="reaction-chip" :class="{ reacted: reaction.reacted }"
              @click="toggleReaction(reaction)">
        <span class="reaction-emoji">{{ reaction.emoji }}</span>
        <span v-if="reaction.count > 0" class="reaction-count">{{ reaction.count }}</span>
      </button>
    </div>
    <div v-if="seriesNav.prev || seriesNav.next" class="series-nav">
      <router-link v-if="seriesNav.prev" class="series-nav-item prev"
                   :to="`/${blogId}/posts/${seriesNav.prev.postUrl}`">
        <span class="series-nav-dir">&#8592; 이전 글</span>
        <span class="series-nav-title">{{ seriesNav.prev.title }}</span>
      </router-link>
      <span v-else class="series-nav-item-empty"/>
      <router-link v-if="seriesNav.next" class="series-nav-item next"
                   :to="`/${blogId}/posts/${seriesNav.next.postUrl}`">
        <span class="series-nav-dir">다음 글 &#8594;</span>
        <span class="series-nav-title">{{ seriesNav.next.title }}</span>
      </router-link>
      <span v-else class="series-nav-item-empty"/>
    </div>
    <div v-if="relatedPosts.length > 0" class="related-posts">
      <div class="related-title">관련 게시글</div>
      <div class="related-list">
        <router-link v-for="relatedPost in relatedPosts"
                     :key="relatedPost.id"
                     :to="`/${relatedPost.author.blogId}/posts/${relatedPost.postUrl}`"
                     class="related-item">
          <div class="related-item-title">{{ relatedPost.title }}</div>
          <div class="related-item-summary">{{ relatedPost.summary }}</div>
        </router-link>
      </div>
    </div>
    <div class="write-comment">
      댓글 남기기
      <textarea v-model="newComment" placeholder="댓글 내용을 입력하세요."/>
      <div v-if="!isLoggedIn" class="guest-comment-info">
        <input v-model="guestCommentName" placeholder="이름"/>
        <input v-model="guestCommentPassword" placeholder="비밀번호" type="password" autocomplete="off"/>
        <div class="login-guide">
          <span>이름과 비밀번호 없이 댓글을 달기 위해서는 <router-link to="/signin">로그인</router-link>이 필요합니다.</span>
        </div>
      </div>
      <button :disabled="!isValidNewComment" @click="writeComment">댓글 작성</button>
    </div>
    <div class="comments">
      <div class="counts">
        <span>{{ allCommentCount }} 개의 댓글</span>
        <span>&#183;</span>
        <span>{{ likeCount }} 개의 좋아요</span>
        <div v-if="isLoggedIn" class="action-buttons">
          <button v-if="!this.isLike" @click="likePost">좋아요 하기</button>
          <button v-else @click="unlikePost">좋아요 취소</button>
          <button v-if="!this.isBookmarkedPost" @click="bookmark">북마크</button>
          <button v-else @click="unbookmark">북마크 취소</button>
        </div>
      </div>

      <div class="empty-comment-message" v-if="comments?.length == 0">
        댓글이 없습니다.
      </div>
      <simple-comment-item
          v-for="comment in comments" :key="comment.id"
          :simple-comment="comment"
          :post="post"
          @deleted="commentDeleted"
          @changed="commentChanged"/>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { PostDto, ReactionDto, SeriesDto, SimpleCommentDto, SimplePostDto } from '@/api/models/blog.dtos';
import {
  addReaction,
  bookmarkPost,
  createComment,
  createGuestComment,
  deletePost,
  getBlogSeriesDetail,
  getPost,
  getReactions,
  getRelatedPosts,
  isBookmarked,
  isLikePost,
  likePost,
  removeReaction,
  unbookmarkPost,
  unlikePost
} from '@/api/blog';
import { HttpApiError, attachmentFileBaseUrl } from '@/api/common/httpApiClient';

// 게시글에 사용할 수 있는 이모지 반응 목록 (백엔드 허용 목록과 일치해야 한다)
const ALLOWED_REACTIONS = ['👍', '❤️', '😄', '🎉', '🤔', '👏', '🚀', '👀'];
import AccountProfileImageButton from '@/components/accounts/AccountProfileImageButton.vue';
import store from '@/store';
import SimpleCommentItem from '@/components/comments/SimpleCommentItem.vue';
import PostViewer from '@/components/posts/PostViewer.vue';
import blogWebSocketClient from '@/utils/websocket';

export default defineComponent({
  name: 'PostView',
  components: { PostViewer, SimpleCommentItem, AccountProfileImageButton },
  props: {
    blogId: {
      type: String,
      required: true,
    },
    postUrl: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      post: {} as PostDto,
      comments: {} as Array<SimpleCommentDto>,
      tags: {} as Array<string>,
      likeCount: 0,
      isLike: false,
      isBookmarkedPost: false,
      reactions: [] as Array<ReactionDto>,
      newComment: '',
      guestCommentName: '',
      guestCommentPassword: '',
      series: {} as SeriesDto | null,
      toc: [] as Array<{ id: string; text: string; level: number }>,
      readingProgress: 0,
      relatedPosts: [] as Array<SimplePostDto>,
    };
  },
  computed: {
    longCreateAt() {
      if (!this.post?.createdAt) {
        return null;
      }
      const date = new Date(this.post.createdAt);
      const hours = `${date.getHours()}`.padStart(2, '0');
      const minutes = `${date.getMinutes()}`.padStart(2, '0');
      return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}. ${hours}:${minutes}`;
    },
    longLastModifiedAt() {
      if (!this.post?.lastModifiedAt) {
        return null;
      }
      const date = new Date(this.post.lastModifiedAt);
      const hours = `${date.getHours()}`.padStart(2, '0');
      const minutes = `${date.getMinutes()}`.padStart(2, '0');
      return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}. ${hours}:${minutes}`;
    },
    isMyPost() {
      return this.post?.author?.blogId === store.state.accountStore.blogId;
    },
    isLoggedIn(): boolean {
      return store.getters['accountStore/isLoggedIn'] ?? false;
    },
    isValidNewComment() {
      return this.newComment.length > 0 && (this.isLoggedIn || (this.guestCommentName.length > 0 && this.guestCommentPassword.length > 0));
    },
    allCommentCount() {
      return this.comments?.reduce?.((previous, current) => previous + 1 + current.childrenCount, 0) ?? 0;
    },
    // 허용된 모든 이모지를 표시하되, 서버 집계값(개수/내 반응 여부)을 합쳐서 보여준다.
    displayReactions(): Array<ReactionDto> {
      return ALLOWED_REACTIONS.map((emoji) => {
        const found = this.reactions.find((r) => r.emoji === emoji);
        return found ?? { emoji, count: 0, reacted: false } as ReactionDto;
      });
    },
    // 같은 시리즈 안에서의 이전/다음 게시글
    seriesNav(): { prev: SimplePostDto | null; next: SimplePostDto | null } {
      const posts = this.series?.posts;
      if (!posts || posts.length === 0) {
        return { prev: null, next: null };
      }
      const index = posts.findIndex((p) => p.postUrl === this.postUrl);
      if (index < 0) {
        return { prev: null, next: null };
      }
      return {
        prev: index > 0 ? (posts[index - 1] as unknown as SimplePostDto) : null,
        next: index < posts.length - 1 ? (posts[index + 1] as unknown as SimplePostDto) : null,
      };
    },
    // 현재 이 게시글을 함께 보고 있는 사람 수 (자신 포함)
    currentViewerCount(): number {
      return store.getters['commonStore/postViewerCount'](this.post?.id);
    },
    // 본문 글자 수를 기반으로 예상 읽기 시간(분)을 계산한다. (한글 약 500자/분, 영어 약 200단어/분)
    readingTime(): number {
      const text = (this.post?.content ?? '')
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`[^`]*`/g, '')
        .replace(/!\[[^\]]*]\([^)]*\)/g, '')
        .replace(/\[[^\]]*]\([^)]*\)/g, '')
        .replace(/[#>*_~\->|]/g, ' ');
      const cjkCount = (text.match(/[ㄱ-힝一-鿿]/g) ?? []).length;
      const wordCount = (text.replace(/[ㄱ-힝一-鿿]/g, ' ').match(/[A-Za-z0-9]+/g) ?? []).length;
      return Math.max(1, Math.ceil(cjkCount / 500 + wordCount / 200));
    },
  },
  watch: {
    postUrl() {
      this.loadPost();
    },
  },
  methods: {
    async loadPost() {
      if (!this.blogId || !this.postUrl)
        return;

      await getPost(this.blogId, this.postUrl)
      .then(async (post) => {
        this.post = post;
        this.likeCount = post.likeCount;
        this.comments = post.comments;
        this.tags = post.tags?.map(tag => tag.name) ?? [];
        document.title = this.post.title;

        // 현재 이 게시글을 보고 있다고 서버에 알린다. (실시간 시청자 수 집계)
        blogWebSocketClient.viewPost(post.id);

        if (post.seriesUrl) {
          this.series = await getBlogSeriesDetail(this.blogId, post.seriesUrl);
        } else {
          this.series = null;
        }

        this.applyOpenGraph(post);
        this.loadReactions();
        this.loadRelatedPosts();
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
        this.$router.push(`/`);
      });

      if (this.isLoggedIn) {
        await isLikePost(this.blogId, this.postUrl)
        .then((isLike) => {
          this.isLike = isLike;
        })
        .catch((error: HttpApiError) => {
          alert(error.getErrorMessage());
          this.$router.push(`/`);
        });

        isBookmarked(this.blogId, this.postUrl)
        .then((bookmarked) => {
          this.isBookmarkedPost = bookmarked;
        })
        .catch(() => {
          // 북마크 여부 조회 실패는 본문 노출에 영향을 주지 않으므로 조용히 무시한다.
        });
      }
    },
    async writeComment() {
      if (this.isLoggedIn) {
        await createComment(this.blogId, this.postUrl, {
          content: this.newComment,
        })
        .then((comment) => {
          this.newComment = '';
          this.comments.push(Object.assign(comment, {
            childrenCount: comment.children.length,
          }));
        })
        .catch((error: HttpApiError) => {
          alert(error.getErrorMessage());
        });
      } else {
        await createGuestComment(this.blogId, this.postUrl, {
          content: this.newComment,
          name: this.guestCommentName,
          password: this.guestCommentPassword
        })
        .then((comment) => {
          this.newComment = '';
          this.guestCommentPassword = '';
          this.comments.push(Object.assign(comment, {
            childrenCount: comment.children.length,
          }));
        })
        .catch((error: HttpApiError) => {
          alert(error.getErrorMessage());
        });
      }
    },
    commentDeleted(commentId: string) {
      this.comments = this.comments.filter((x) => x.id !== commentId);
    },
    commentChanged(comment: SimpleCommentDto) {
      this.comments.splice(this.comments.findIndex(x => x.id === comment.id), 1, comment);
    },
    async likePost() {
      await likePost(this.blogId, this.postUrl)
      .then(async () => {
        this.likeCount++;
        this.isLike = true;
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      });
    },
    async unlikePost() {
      await unlikePost(this.blogId, this.postUrl)
      .then(async () => {
        this.likeCount--;
        this.isLike = false;
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      });
    },
    async bookmark() {
      await bookmarkPost(this.blogId, this.postUrl)
      .then(() => {
        this.isBookmarkedPost = true;
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      });
    },
    async unbookmark() {
      await unbookmarkPost(this.blogId, this.postUrl)
      .then(() => {
        this.isBookmarkedPost = false;
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      });
    },
    async loadReactions() {
      await getReactions(this.blogId, this.postUrl)
      .then((reactions) => {
        this.reactions = reactions;
      })
      .catch(() => {
        // 반응 조회 실패는 본문 노출에 영향을 주지 않으므로 조용히 무시한다.
      });
    },
    async toggleReaction(reaction: ReactionDto) {
      if (!this.isLoggedIn) {
        alert('이모지 반응을 남기려면 로그인이 필요합니다.');
        return;
      }
      const action = reaction.reacted
        ? removeReaction(this.blogId, this.postUrl, reaction.emoji)
        : addReaction(this.blogId, this.postUrl, reaction.emoji);
      await action
      .then(() => this.loadReactions())
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      });
    },
    // 게시글 정보로 Open Graph / Twitter Card 메타 태그를 갱신한다. (공유 시 미리보기용)
    applyOpenGraph(post: PostDto) {
      const url = `${window.location.origin}/${post.author?.blogId}/posts/${post.postUrl}`;
      const description = post.summary ?? '';
      const image = post.thumbnailImageUrl ? `${attachmentFileBaseUrl}${post.thumbnailImageUrl}` : '';
      this.setMetaTag('name', 'description', description);
      this.setMetaTag('property', 'og:title', post.title);
      this.setMetaTag('property', 'og:description', description);
      this.setMetaTag('property', 'og:type', 'article');
      this.setMetaTag('property', 'og:url', url);
      this.setMetaTag('name', 'twitter:title', post.title);
      this.setMetaTag('name', 'twitter:description', description);
      this.setMetaTag('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
      if (image) {
        this.setMetaTag('property', 'og:image', image);
        this.setMetaTag('name', 'twitter:image', image);
      }
    },
    setMetaTag(attr: 'name' | 'property', key: string, content: string) {
      let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    },
    async modifyPost() {
      this.$router.push(`/write?post=${this.postUrl}`);
    },
    async deletePost() {
      if (confirm('게시글을 삭제하시겠습니까?') != true) {
        return;
      }

      await deletePost(this.postUrl)
      .then(() => {
        alert('게시글을 삭제했습니다.');
        this.$router.push(`/`);
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      });
    },
    async loadRelatedPosts() {
      this.relatedPosts = [];
      await getRelatedPosts(this.blogId, this.postUrl, 5)
      .then((posts) => {
        this.relatedPosts = posts;
      })
      .catch(() => {
        // 관련 게시글 조회 실패는 본문 노출에 영향을 주지 않으므로 조용히 무시한다.
      });
    },
    // 뷰어 렌더링 완료 시 본문 제목(h1~h3)으로부터 목차를 생성한다.
    buildToc(viewerRoot: HTMLElement) {
      if (!viewerRoot) {
        this.toc = [];
        return;
      }
      const contents = viewerRoot.querySelector('.toastui-editor-contents') ?? viewerRoot;
      const headings = Array.from(contents.querySelectorAll('h1, h2, h3')) as Array<HTMLElement>;
      this.toc = headings.map((heading, index) => {
        if (!heading.id) {
          heading.id = `post-heading-${index}`;
        }
        return {
          id: heading.id,
          text: heading.textContent?.trim() ?? '',
          level: Number(heading.tagName.substring(1)),
        };
      }).filter((item) => item.text.length > 0);
    },
    scrollToHeading(id: string) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    // 페이지 스크롤 진행률(0~100)을 계산하여 상단 진행률 바에 반영한다.
    updateReadingProgress() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollableHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      this.readingProgress = scrollableHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / scrollableHeight) * 100)) : 0;
    },
  },
  created() {
    this.loadPost();
  },
  mounted() {
    window.addEventListener('scroll', this.updateReadingProgress, { passive: true });
    this.updateReadingProgress();
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.updateReadingProgress);
    // 게시글을 떠나므로 더 이상 보고 있지 않음을 알린다.
    blogWebSocketClient.viewPost(null);
  },
});
</script>

<style scoped>

.post-container {
  display: grid;

  grid-template-columns: 750px;
  grid-auto-rows: auto;

  justify-content: center;

  padding: var(--base-gap);
  box-sizing: border-box;
}

@media (max-width: 800px) {
  .post-container {
    grid-template-columns: minmax(0, auto);
    justify-content: stretch;
  }
}

.title {
  border-bottom: 6px double var(--border-color);
  padding-bottom: 1em;
}

.hits {
  font-size: 0.75em;

  display: flex;
  justify-content: space-between;
}

.now-viewing {
  color: var(--link-accent-color);
  margin-left: 0.2em;
}

.tags {
  display: flex;

  flex-wrap: wrap;

  align-items: center;
  justify-items: start;

  grid-column: 3 / span 1;
  grid-row: 1 / span 2;

  align-self: end;
  justify-self: end;

  margin-left: 10px;
}

.tag-item {
  color: white;
  background-color: var(--button-color);
  margin: 2px;
  border-radius: 5px;
  padding: 1px 5px;
  box-sizing: border-box;
  font-size: 14px;

  -ms-user-select: none;
  -khtml-user-select: none;
  -webkit-user-select: none;
  user-select: none;
}

.author {
  display: grid;

  grid-template-columns: auto auto 1fr;
  grid-template-rows: auto auto;

  margin-top: 1.5em;
}

.author-profile-image {
  width: 50px;
  height: 50px;

  justify-self: center;

  grid-column: 1 / span 1;
  grid-row: 1 / span 2;

  margin-right: 0.5em;
}

.author-name {
  align-self: end;

  grid-column: 2 / span 1;
  grid-row: 1 / span 1;

  font-size: 0.75em;
  font-weight: 300;
}

.created-at {
  align-self: start;

  white-space: nowrap;

  grid-column: 2 / span 1;
  grid-row: 2 / span 1;

  font-size: 0.75em;
  font-weight: 300;
}

.modified-at {
  white-space: nowrap;

  font-size: 1em;
  font-weight: 300;
}

.modify-actions {
  padding-left: 5px;
}

.modify-actions a {
  color: var(--base-color);
  margin: 0 3px;
}

.content {
  border-bottom: 6px double var(--border-color);
  padding: 2em 0;
  min-height: 400px;
}

.write-comment {
  padding: 1em 0;
  display: grid;

  grid-auto-rows: auto;
  grid-row-gap: 0.5em;
}

.write-comment textarea {
  font-size: 14px;
  padding: 12px;
  width: 100%;
  box-sizing: border-box;
  border-radius: var(--base-border-radius);
  border: 1px solid var(--border-color);
  resize: none;
  outline: none;
}

.write-comment button {
  justify-self: end;
}

.guest-comment-info {
  justify-self: start;

  display: grid;

  grid-auto-flow: column;

  grid-auto-columns: auto;
  grid-column-gap: 0.5em;
}

.guest-comment-info input {
  width: 100px;
  padding: 4px 8px;
  box-sizing: border-box;
  border-radius: var(--base-border-radius);
  border: 1px solid var(--border-color);
  outline: none;

  align-self: start;
}

.comments {
  padding: 2em 0;
  display: grid;
  grid-auto-rows: auto;
}

.comments .counts {
  display: grid;

  grid-template-columns: auto auto auto 1fr;
  grid-template-rows: auto;

  grid-column-gap: 10px;
  align-items: center;

  min-height: 40px;
}

.counts button {
  justify-self: start;
  margin-right: 10px;
}

.comments .empty-comment-message {
  padding: 4em 0;
  justify-self: center;
}

.login-guide {
  font-size: 0.9em;
  align-self: center;
}

.series-container {
  border-radius: var(--base-border-radius);
  border: 1px solid var(--series-background-color);
  background: var(--series-background-color);
  padding: var(--base-gap);
}

.series-title {
  font-size: 1.5em;
  font-weight: bold;
  margin-bottom: var(--base-gap);
}

.series-list {
  line-height: 1.75;
}

.series-container a {
  color: var(--base-color);
  font-weight: normal;
}

.series-active a {
  color: var(--link-accent-color);
  font-weight: bold;
}

.series-list ol {
  list-style-type: decimal;
  margin-left: var(--base-gap);
}

.reading-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: transparent;
  z-index: 1000;
}

.reading-progress-bar {
  height: 100%;
  background: var(--link-accent-color);
  transition: width 0.1s linear;
}

.toc {
  border: 1px solid var(--series-background-color);
  background: var(--series-background-color);
  border-radius: var(--base-border-radius);
  padding: var(--base-gap);
  margin-bottom: 2em;
}

.toc-title {
  font-size: 1.1em;
  font-weight: bold;
  margin-bottom: 0.5em;
}

.toc ul {
  list-style: none;
  line-height: 1.8;
}

.toc li a {
  color: var(--base-color);
  cursor: pointer;
  font-weight: normal;
}

.toc li a:hover {
  color: var(--link-accent-color);
  text-decoration: underline;
}

.toc-level-2 {
  margin-left: 1em;
}

.toc-level-3 {
  margin-left: 2em;
  font-size: 0.95em;
}

.related-posts {
  border-bottom: 6px double var(--border-color);
  padding: 2em 0;
}

.related-title {
  font-size: 1.3em;
  font-weight: bold;
  margin-bottom: var(--base-gap);
}

.related-list {
  display: grid;
  grid-auto-rows: auto;
  grid-row-gap: 0.75em;
}

.related-item {
  display: block;
  border: 1px solid var(--border-color);
  border-radius: var(--base-border-radius);
  padding: 0.75em 1em;
  color: var(--base-color);
  text-decoration: none;
  transition: border-color 0.15s ease;
}

.related-item:hover {
  border-color: var(--link-accent-color);
}

.related-item-title {
  font-weight: bold;
  margin-bottom: 0.25em;
}

.related-item-summary {
  font-size: 0.85em;
  font-weight: 300;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reactions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 1.5em 0 0.5em;
}

.reaction-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid var(--border-color);
  border-radius: 16px;
  background: transparent;
  cursor: pointer;
  font-size: 1em;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.reaction-chip:hover {
  border-color: var(--link-accent-color);
}

.reaction-chip.reacted {
  border-color: var(--link-accent-color);
  background: var(--series-background-color);
}

.reaction-count {
  font-size: 0.85em;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.series-nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-column-gap: 10px;
  padding: 1.5em 0;
}

.series-nav-item {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color);
  border-radius: var(--base-border-radius);
  padding: 0.75em 1em;
  color: var(--base-color);
  text-decoration: none;
  transition: border-color 0.15s ease;
}

.series-nav-item:hover {
  border-color: var(--link-accent-color);
}

.series-nav-item.next {
  text-align: right;
}

.series-nav-dir {
  font-size: 0.8em;
  font-weight: 300;
  color: var(--link-accent-color);
  margin-bottom: 0.25em;
}

.series-nav-title {
  font-weight: bold;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

</style>
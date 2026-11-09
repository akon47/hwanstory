<template>
  <div class="post-page">
    <div class="reading-progress" aria-hidden="true">
      <div class="reading-progress-bar" :style="{ width: readingProgress + '%' }"/>
    </div>

    <div class="container post-layout" :class="{ 'has-toc': toc.length > 0 }">
      <article class="post-main" ref="post-main">
        <live-cursors v-if="post.id" :post-id="post.id" :container="postMainElement"/>
        <header class="post-header">
          <div v-if="tags.length > 0" class="post-tags">
            <router-link v-for="tag in tags" :key="tag" class="chip"
                         :to="{ path: `/${blogId}/posts`, query: { tag } }">{{ tag }}</router-link>
          </div>
          <h1 class="post-title">{{ post.title }}</h1>
          <div class="post-meta">
            <account-profile-image-button class="author-avatar" :simple-account="post.author"/>
            <div class="meta-text">
              <router-link class="author-name" :to="`/${post.author?.blogId}`">{{ post.author?.name }}</router-link>
              <div class="meta-row">
                <time :datetime="createdAtIso" :title="createdAtFull">{{ createdAtLabel }}</time>
                <span class="dot"/>
                <span>{{ readingTime }}분 읽기</span>
                <span class="dot"/>
                <span>조회 {{ hits }}</span>
                <span v-if="isModified" class="modified" :title="lastModifiedAtFull">· 수정됨</span>
              </div>
            </div>
            <div v-if="isMyPost" class="owner-actions">
              <router-link class="btn btn-secondary btn-sm" :to="`/write?post=${postUrl}`">
                <app-icon name="pen" :size="14"/>수정
              </router-link>
              <button class="btn btn-danger-ghost btn-sm" type="button" @click="deletePost">
                <app-icon name="trash" :size="14"/>삭제
              </button>
            </div>
          </div>
          <div v-if="currentViewerCount > 1" class="now-viewing">
            <span class="live-dot" aria-hidden="true"/>지금 {{ currentViewerCount }}명이 함께 읽고 있어요
            <span class="now-viewing-hint">· 서로의 마우스가 보여요. <kbd>/</kbd> 를 누르면 한마디 남길 수 있어요</span>
          </div>
          <div v-if="openTypeNote" class="open-type-note">
            <app-icon name="lock" :size="16"/>{{ openTypeNote }}
          </div>
        </header>

        <section v-if="series" class="series-box">
          <button class="series-head" type="button" :aria-expanded="isSeriesOpen" @click="isSeriesOpen = !isSeriesOpen">
            <app-icon name="layers" :size="18"/>
            <span class="series-label">시리즈</span>
            <span class="series-title">{{ series.title }}</span>
            <span class="series-pos num">{{ seriesIndex + 1 }} / {{ series.posts.length }}</span>
            <app-icon :name="isSeriesOpen ? 'chevron-up' : 'chevron-down'" :size="18"/>
          </button>
          <ol v-if="isSeriesOpen" class="series-list">
            <li v-for="(seriesPost, index) in series.posts" :key="seriesPost.postUrl"
                :class="{ active: seriesPost.postUrl === postUrl }">
              <router-link :to="`/${blogId}/posts/${seriesPost.postUrl}`">
                <span class="series-no num">{{ index + 1 }}</span>{{ seriesPost.title }}
              </router-link>
            </li>
          </ol>
        </section>

        <details v-if="toc.length > 0" class="toc-inline">
          <summary><app-icon name="list" :size="18"/>목차</summary>
          <ul>
            <li v-for="item in toc" :key="item.id" :class="`toc-level-${item.level}`">
              <a :href="`#${item.id}`" @click.prevent="scrollToHeading(item.id)">{{ item.text }}</a>
            </li>
          </ul>
        </details>

        <div class="post-content">
          <post-viewer :content="post.content" @rendered="buildToc"/>
        </div>

        <section class="post-actions">
          <div class="reactions" aria-label="이모지 반응">
            <button v-for="reaction in displayReactions" :key="reaction.emoji" type="button"
                    class="reaction-chip" :class="{ reacted: reaction.reacted }" :aria-pressed="reaction.reacted"
                    @click="toggleReaction(reaction)">
              <span class="reaction-emoji">{{ reaction.emoji }}</span>
              <span v-if="reaction.count > 0" class="reaction-count num">{{ reaction.count }}</span>
            </button>
          </div>
          <div class="action-buttons">
            <button class="action-btn" :class="{ active: isLike }" type="button" :aria-pressed="isLike" @click="toggleLike">
              <app-icon name="heart" :size="18"/>좋아요<span v-if="likeCount > 0" class="num">{{ likeCount }}</span>
            </button>
            <button class="action-btn" :class="{ active: isBookmarkedPost }" type="button" :aria-pressed="isBookmarkedPost"
                    @click="toggleBookmark">
              <app-icon name="bookmark" :size="18"/>{{ isBookmarkedPost ? '북마크됨' : '북마크' }}
            </button>
            <button class="action-btn" type="button" @click="share">
              <app-icon name="share" :size="18"/>공유
            </button>
          </div>
        </section>

        <nav v-if="seriesNav.prev || seriesNav.next" class="series-nav" aria-label="시리즈 이전·다음 글">
          <router-link v-if="seriesNav.prev" class="series-nav-item prev" :to="`/${blogId}/posts/${seriesNav.prev.postUrl}`">
            <span class="series-nav-dir"><app-icon name="arrow-left" :size="14"/>이전 글</span>
            <span class="series-nav-title">{{ seriesNav.prev.title }}</span>
          </router-link>
          <span v-else/>
          <router-link v-if="seriesNav.next" class="series-nav-item next" :to="`/${blogId}/posts/${seriesNav.next.postUrl}`">
            <span class="series-nav-dir">다음 글<app-icon name="arrow-right" :size="14"/></span>
            <span class="series-nav-title">{{ seriesNav.next.title }}</span>
          </router-link>
          <span v-else/>
        </nav>

        <section v-if="post.author" class="author-card">
          <account-profile-image-button class="author-card-avatar" :simple-account="post.author"/>
          <div class="author-card-body">
            <div class="author-card-name">{{ post.author.name }}</div>
            <div class="author-card-id subtle small">{{ post.author.blogId }}</div>
            <router-link class="author-card-link small" :to="`/${post.author.blogId}/posts`">이 블로그의 글 더 보기</router-link>
          </div>
          <button v-if="canFollow" class="btn btn-sm" :class="{ 'btn-secondary': isFollowingAuthor }" type="button"
                  :disabled="followLoading" @click="toggleFollow">
            {{ isFollowingAuthor ? '팔로잉' : '팔로우' }}
          </button>
        </section>

        <section v-if="relatedPosts.length > 0" class="related">
          <h2 class="section-title">관련 글</h2>
          <div class="related-list">
            <router-link v-for="relatedPost in relatedPosts" :key="relatedPost.id"
                         :to="`/${relatedPost.author.blogId}/posts/${relatedPost.postUrl}`" class="related-item">
              <div class="related-thumb" :style="relatedThumbnail(relatedPost)"/>
              <div class="related-body">
                <div class="related-item-title">{{ relatedPost.title }}</div>
                <div class="related-item-summary">{{ relatedPost.summary }}</div>
              </div>
            </router-link>
          </div>
        </section>

        <section class="comments" id="comments">
          <h2 class="section-title">댓글 <span class="count num">{{ allCommentCount }}</span></h2>
          <comment-composer @submit="writeComment"/>
          <div v-if="comments?.length === 0" class="empty-comments subtle">아직 댓글이 없어요. 첫 댓글을 남겨보세요.</div>
          <simple-comment-item
              v-for="comment in comments" :key="comment.id"
              :simple-comment="comment"
              :post="post"
              @deleted="commentDeleted"
              @changed="commentChanged"/>
        </section>
      </article>

      <aside class="post-side" aria-label="글 도구">
        <div class="side-sticky">
          <div class="side-actions">
            <button class="side-btn" :class="{ active: isLike }" type="button" title="좋아요" @click="toggleLike">
              <app-icon name="heart" :size="20"/>
              <span class="num">{{ likeCount }}</span>
            </button>
            <button class="side-btn" :class="{ active: isBookmarkedPost }" type="button" title="북마크" @click="toggleBookmark">
              <app-icon name="bookmark" :size="20"/>
            </button>
            <button class="side-btn" type="button" title="링크 복사" @click="share">
              <app-icon name="share" :size="20"/>
            </button>
          </div>
          <nav v-if="toc.length > 0" class="toc-side" aria-label="목차">
            <div class="toc-title">목차</div>
            <ul>
              <li v-for="item in toc" :key="item.id" :class="[`toc-level-${item.level}`, { active: item.id === activeTocId }]">
                <a :href="`#${item.id}`" @click.prevent="scrollToHeading(item.id)">{{ item.text }}</a>
              </li>
            </ul>
          </nav>
          <post-viewers v-if="post.id" :post-id="post.id"/>
        </div>
      </aside>
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
  unlikePost,
} from '@/api/blog';
import { follow, isFollowing, unfollow } from '@/api/follow';
import { attachmentFileBaseUrl, HttpApiError } from '@/api/common/httpApiClient';
import { setJsonLd, setRobotsMeta, siteBaseUrl } from '@/utils/seo';
import AccountProfileImageButton from '@/components/accounts/AccountProfileImageButton.vue';
import store from '@/store';
import SimpleCommentItem from '@/components/comments/SimpleCommentItem.vue';
import CommentComposer, { CommentDoneCallback, CommentSubmission } from '@/components/comments/CommentComposer.vue';
import PostViewer from '@/components/posts/PostViewer.vue';
import AppIcon from '@/components/common/AppIcon.vue';
import LiveCursors from '@/components/posts/LiveCursors.vue';
import PostViewers from '@/components/posts/PostViewers.vue';
import { getCursorIdentity } from '@/utils/cursorIdentity';
import blogWebSocketClient from '@/utils/websocket';
import { confirmDialog, toast } from '@/utils/dialog';
import { formatCount, formatDate, formatDateTime } from '@/utils/format';
import { thumbnailStyle } from '@/utils/thumbnail';

// 게시글에 사용할 수 있는 이모지 반응 목록 (백엔드 허용 목록과 일치해야 한다)
const ALLOWED_REACTIONS = ['👍', '❤️', '😄', '🎉', '🤔', '👏', '🚀', '👀'];

const OPEN_TYPE_NOTES: Record<string, string> = {
  PRIVATE: '비공개 글입니다. 나에게만 보입니다.',
  DRAFT: '임시저장한 글입니다. 아직 발행되지 않았습니다.',
  SCHEDULED: '예약 발행 글입니다. 예약한 시각에 공개됩니다.',
};

export default defineComponent({
  name: 'PostView',
  components: { AppIcon, LiveCursors, PostViewers, PostViewer, SimpleCommentItem, CommentComposer, AccountProfileImageButton },
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
      comments: [] as Array<SimpleCommentDto>,
      tags: [] as Array<string>,
      likeCount: 0,
      isLike: false,
      isBookmarkedPost: false,
      reactions: [] as Array<ReactionDto>,
      series: null as SeriesDto | null,
      isSeriesOpen: false,
      toc: [] as Array<{ id: string; text: string; level: number }>,
      activeTocId: '',
      readingProgress: 0,
      relatedPosts: [] as Array<SimplePostDto>,
      isFollowingAuthor: false,
      followLoading: false,
      postMainElement: null as HTMLElement | null,
    };
  },
  computed: {
    createdAtLabel(): string {
      return formatDate(this.post?.createdAt);
    },
    createdAtFull(): string {
      return formatDateTime(this.post?.createdAt);
    },
    createdAtIso(): string {
      return this.post?.createdAt ? new Date(this.post.createdAt).toISOString() : '';
    },
    lastModifiedAtFull(): string {
      return `${formatDateTime(this.post?.lastModifiedAt)} 마지막으로 수정`;
    },
    isModified(): boolean {
      if (!this.post?.createdAt || !this.post?.lastModifiedAt) {
        return false;
      }
      return new Date(this.post.lastModifiedAt).getTime() - new Date(this.post.createdAt).getTime() > 60_000;
    },
    hits(): string {
      return formatCount(this.post?.hits);
    },
    openTypeNote(): string {
      return OPEN_TYPE_NOTES[this.post?.openType ?? ''] ?? '';
    },
    isMyPost(): boolean {
      return !!this.post?.author?.blogId && this.post.author.blogId === store.state.accountStore.blogId;
    },
    isLoggedIn(): boolean {
      return store.getters['accountStore/isLoggedIn'] ?? false;
    },
    canFollow(): boolean {
      return this.isLoggedIn && !this.isMyPost && !!this.post?.author?.blogId;
    },
    allCommentCount(): number {
      return this.comments?.reduce?.((previous, current) => previous + 1 + current.childrenCount, 0) ?? 0;
    },
    // 허용된 모든 이모지를 표시하되, 서버 집계값(개수/내 반응 여부)을 합쳐서 보여준다.
    displayReactions(): Array<ReactionDto> {
      return ALLOWED_REACTIONS.map((emoji) => {
        const found = this.reactions.find((r) => r.emoji === emoji);
        return found ?? { emoji, count: 0, reacted: false } as ReactionDto;
      });
    },
    seriesIndex(): number {
      return this.series?.posts?.findIndex((p) => p.postUrl === this.postUrl) ?? -1;
    },
    // 같은 시리즈 안에서의 이전/다음 게시글
    seriesNav(): { prev: SimplePostDto | null; next: SimplePostDto | null } {
      const posts = this.series?.posts;
      const index = this.seriesIndex;
      if (!posts || posts.length === 0 || index < 0) {
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
    relatedThumbnail(post: SimplePostDto) {
      return thumbnailStyle(post.thumbnailImageUrl, post.createdAt);
    },
    async loadPost() {
      if (!this.blogId || !this.postUrl) {
        return;
      }

      await getPost(this.blogId, this.postUrl)
      .then(async (post) => {
        this.post = post;
        this.likeCount = post.likeCount;
        this.comments = post.comments;
        this.tags = post.tags?.map((tag) => tag.name) ?? [];
        document.title = this.post.title;

        // 현재 이 게시글을 보고 있다고 서버에 알린다. (실시간 시청자 수 집계 + 함께 읽는 사람 목록에 보일 이름·색)
        blogWebSocketClient.viewPost(post.id, getCursorIdentity());

        if (post.seriesUrl) {
          this.series = await getBlogSeriesDetail(this.blogId, post.seriesUrl).catch(() => null);
        } else {
          this.series = null;
        }

        this.applyOpenGraph(post);
        this.loadReactions();
        this.loadRelatedPosts();
        this.loadFollowingState();
      })
      .catch((error: HttpApiError) => {
        if (error.isNotFound()) {
          this.$router.replace('/not-found');
          return;
        }
        toast.error(error.getErrorMessage());
        this.$router.push('/');
      });

      if (this.isLoggedIn) {
        isLikePost(this.blogId, this.postUrl)
        .then((isLike) => {
          this.isLike = isLike;
        })
        .catch(() => {
          // 좋아요 여부 조회 실패는 본문 노출에 영향을 주지 않으므로 조용히 무시한다.
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
    async loadFollowingState() {
      if (!this.canFollow) {
        this.isFollowingAuthor = false;
        return;
      }
      await isFollowing(this.post.author.blogId)
      .then(() => {
        this.isFollowingAuthor = true;
      })
      .catch(() => {
        this.isFollowingAuthor = false;
      });
    },
    async toggleFollow() {
      if (this.followLoading || !this.post?.author?.blogId) {
        return;
      }
      this.followLoading = true;
      const action = this.isFollowingAuthor ? unfollow(this.post.author.blogId) : follow(this.post.author.blogId);
      await action
      .then(() => {
        this.isFollowingAuthor = !this.isFollowingAuthor;
        toast.success(this.isFollowingAuthor ? `${this.post.author.name}님을 팔로우합니다.` : '팔로우를 취소했습니다.');
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
      })
      .finally(() => {
        this.followLoading = false;
      });
    },
    // 로그인이 필요한 동작을 눌렀을 때: 로그인 화면으로 보낼지 묻는다.
    async requireLogin(what: string): Promise<boolean> {
      if (this.isLoggedIn) {
        return true;
      }
      const ok = await confirmDialog({
        title: '로그인이 필요합니다',
        message: `${what}하려면 로그인하세요. 로그인 뒤 이 글로 돌아옵니다.`,
        confirmLabel: '로그인',
      });
      if (ok) {
        this.$router.push({ path: '/signin', query: { redirect: this.$route.fullPath } });
      }
      return false;
    },
    async writeComment(submission: CommentSubmission, done: CommentDoneCallback) {
      const request = this.isLoggedIn
          ? createComment(this.blogId, this.postUrl, { content: submission.content })
          : createGuestComment(this.blogId, this.postUrl, {
            content: submission.content,
            name: submission.name,
            password: submission.password,
          });
      await request
      .then((comment) => {
        this.comments.push(Object.assign(comment, {
          childrenCount: comment.children.length,
        }));
        toast.success('댓글을 남겼습니다.');
        done(true);
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
        done(false);
      });
    },
    commentDeleted(commentId: string) {
      this.comments = this.comments.filter((x) => x.id !== commentId);
    },
    commentChanged(comment: SimpleCommentDto) {
      this.comments.splice(this.comments.findIndex((x) => x.id === comment.id), 1, comment);
    },
    async toggleLike() {
      if (!await this.requireLogin('좋아요를 누르')) {
        return;
      }
      const request = this.isLike ? unlikePost(this.blogId, this.postUrl) : likePost(this.blogId, this.postUrl);
      await request
      .then(() => {
        this.isLike = !this.isLike;
        this.likeCount = Math.max(0, this.likeCount + (this.isLike ? 1 : -1));
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
      });
    },
    async toggleBookmark() {
      if (!await this.requireLogin('북마크')) {
        return;
      }
      const request = this.isBookmarkedPost ? unbookmarkPost(this.blogId, this.postUrl) : bookmarkPost(this.blogId, this.postUrl);
      await request
      .then(() => {
        this.isBookmarkedPost = !this.isBookmarkedPost;
        toast.success(this.isBookmarkedPost ? '북마크에 저장했습니다.' : '북마크에서 뺐습니다.');
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
      });
    },
    async share() {
      const url = `${siteBaseUrl}/${this.post.author?.blogId}/posts/${this.post.postUrl}`;
      if (typeof navigator.share === 'function' && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
        try {
          await navigator.share({ title: this.post.title, text: this.post.summary ?? '', url });
          return;
        } catch (e) {
          // 공유 창을 닫은 경우 등: 아래 링크 복사로 이어간다.
        }
      }
      try {
        await navigator.clipboard.writeText(url);
        toast.success('링크를 복사했습니다.');
      } catch (e) {
        toast.error('링크를 복사하지 못했습니다. 주소창의 주소를 직접 복사하세요.');
      }
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
      if (!await this.requireLogin('이모지 반응을 남기')) {
        return;
      }
      const action = reaction.reacted
        ? removeReaction(this.blogId, this.postUrl, reaction.emoji)
        : addReaction(this.blogId, this.postUrl, reaction.emoji);
      await action
      .then(() => this.loadReactions())
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
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
      this.setMetaTag('property', 'og:locale', 'ko_KR');
      if (post.createdAt) {
        this.setMetaTag('property', 'article:published_time', new Date(post.createdAt).toISOString());
      }
      if (post.lastModifiedAt) {
        this.setMetaTag('property', 'article:modified_time', new Date(post.lastModifiedAt).toISOString());
      }

      // 검색엔진: 비공개·임시저장·예약 글은 색인하지 않고, 공개 글에는 BlogPosting 구조화 데이터를 넣는다.
      const isPublic = post.openType === 'PUBLIC';
      setRobotsMeta(!isPublic);
      const canonical = `${siteBaseUrl}/${post.author?.blogId}/posts/${post.postUrl}`;
      setJsonLd(isPublic ? {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: description,
        image: image ? [image] : undefined,
        datePublished: post.createdAt ? new Date(post.createdAt).toISOString() : undefined,
        dateModified: post.lastModifiedAt ? new Date(post.lastModifiedAt).toISOString() : undefined,
        author: {
          '@type': 'Person',
          name: post.author?.name,
          url: `${siteBaseUrl}/${post.author?.blogId}`,
        },
        publisher: {
          '@type': 'Organization',
          name: 'Hwan\'Story',
          logo: { '@type': 'ImageObject', url: `${siteBaseUrl}/logo-symbol.png` },
        },
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
        url: canonical,
        keywords: (post.tags ?? []).map((tag) => tag.name).join(', ') || undefined,
        inLanguage: 'ko',
      } : null);
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
    async deletePost() {
      const ok = await confirmDialog({
        title: '글을 삭제할까요?',
        message: `'${this.post.title}' 글과 댓글이 모두 지워지며 되돌릴 수 없습니다.`,
        confirmLabel: '삭제',
        danger: true,
      });
      if (!ok) {
        return;
      }

      await deletePost(this.postUrl)
      .then(() => {
        toast.success('글을 삭제했습니다.');
        store.dispatch('cacheStore/clearMainPosts');
        this.$router.push(`/${this.blogId}/posts`);
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
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
      this.updateActiveToc();
    },
    scrollToHeading(id: string) {
      const element = document.getElementById(id);
      if (!element) {
        return;
      }
      const top = element.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    },
    // 페이지 스크롤 진행률(0~100)을 계산하여 상단 진행률 바에 반영한다.
    updateReadingProgress() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollableHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      this.readingProgress = scrollableHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / scrollableHeight) * 100)) : 0;
      this.updateActiveToc();
    },
    // 화면 위쪽을 지난 마지막 제목을 현재 위치로 표시한다.
    updateActiveToc() {
      if (this.toc.length === 0) {
        this.activeTocId = '';
        return;
      }
      let active = this.toc[0].id;
      for (const item of this.toc) {
        const element = document.getElementById(item.id);
        if (element && element.getBoundingClientRect().top <= 96) {
          active = item.id;
        } else {
          break;
        }
      }
      this.activeTocId = active;
    },
  },
  created() {
    this.loadPost();
  },
  mounted() {
    window.addEventListener('scroll', this.updateReadingProgress, { passive: true });
    this.updateReadingProgress();
    this.postMainElement = (this.$refs['post-main'] as HTMLElement | undefined) ?? null;
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.updateReadingProgress);
    // 게시글을 떠나므로 더 이상 보고 있지 않음을 알린다.
    blogWebSocketClient.viewPost(null);
  },
});
</script>

<style scoped>
.post-page {
  padding-block: var(--s-8) var(--s-16);
}

.reading-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  z-index: 110;
  pointer-events: none;
}

.reading-progress-bar {
  height: 100%;
  background: var(--accent);
  transition: width 0.1s linear;
}

.post-layout {
  display: grid;
  grid-template-columns: minmax(0, var(--reading-max));
  justify-content: center;
  gap: var(--s-12);
}

@media (min-width: 1100px) {
  .post-layout {
    grid-template-columns: minmax(0, var(--reading-max)) 220px;
  }
}

.post-main {
  position: relative;
  display: grid;
  gap: var(--s-8);
  min-width: 0;
}

/* 긴 코드·표·URL 이 있어도 본문이 옆 칸(목차)으로 넘치지 않게 한다 */
.post-main > *,
.post-side {
  min-width: 0;
  max-width: 100%;
}

/* ---------- 머리 ---------- */
.post-header {
  display: grid;
  gap: var(--s-4);
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.post-title {
  font-size: clamp(28px, 4.5vw, var(--text-4xl));
  line-height: 1.25;
  letter-spacing: -0.02em;
  word-break: keep-all;
  overflow-wrap: anywhere;
}

.post-meta {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--s-3);
  padding-top: var(--s-2);
}

.author-avatar {
  width: 44px;
  height: 44px;
}

.meta-text {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.author-name {
  font-weight: 700;
  color: var(--text);
}

.modified {
  color: var(--text-3);
}

.owner-actions {
  display: flex;
  gap: var(--s-1);
}

.now-viewing {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--accent-text);
  font-size: var(--text-sm);
  font-weight: 600;
}

.now-viewing-hint {
  color: var(--text-3);
  font-weight: 500;
}

.now-viewing-hint kbd {
  display: inline-block;
  padding: 0 5px;
  border: 1px solid var(--border-strong);
  border-bottom-width: 2px;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 11px;
  background: var(--surface);
}

.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--success);
  animation: pulse 1.6s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

.open-type-note {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  background: var(--warning-soft);
  color: var(--warning);
  font-size: var(--text-sm);
  font-weight: 600;
}

/* ---------- 시리즈 ---------- */
.series-box {
  background: var(--surface-2);
  border-radius: var(--radius);
  overflow: hidden;
}

.series-head {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 14px 16px;
  color: var(--text);
  text-align: left;
}

.series-head:hover {
  background: var(--hover-color);
}

.series-label {
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--accent-text);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.series-title {
  font-weight: 700;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.series-pos {
  color: var(--text-3);
  font-size: var(--text-sm);
}

.series-list {
  padding: 4px 16px 14px;
  display: grid;
  gap: 2px;
}

.series-list li a {
  display: flex;
  gap: 10px;
  padding: 7px 10px;
  border-radius: var(--radius-sm);
  color: var(--text-2);
}

.series-list li a:hover {
  background: var(--hover-color);
  text-decoration: none;
  color: var(--text);
}

.series-list li.active a {
  color: var(--accent-text);
  font-weight: 700;
  background: var(--accent-soft);
}

.series-no {
  color: var(--text-3);
  min-width: 1.5em;
}

/* ---------- 목차 (본문 위, 좁은 화면) ---------- */
.toc-inline {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
}

.toc-inline summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  font-weight: 700;
  cursor: pointer;
  list-style: none;
}

.toc-inline summary::-webkit-details-marker {
  display: none;
}

.toc-inline ul {
  padding: 0 16px 14px;
  display: grid;
  gap: 4px;
}

.toc-inline li a,
.toc-side li a {
  color: var(--text-2);
  font-size: var(--text-sm);
  line-height: 1.5;
  display: block;
}

.toc-inline li a:hover,
.toc-side li a:hover {
  color: var(--accent-text);
  text-decoration: none;
}

.toc-level-2 {
  padding-left: 12px;
}

.toc-level-3 {
  padding-left: 24px;
}

@media (min-width: 1100px) {
  .toc-inline {
    display: none;
  }
}

/* ---------- 본문 ---------- */
.post-content {
  min-height: 200px;
  min-width: 0;
  max-width: 100%;
  overflow-x: hidden;
}

/* ---------- 반응·동작 ---------- */
.post-actions {
  display: grid;
  gap: var(--s-4);
  padding-top: var(--s-4);
  border-top: 1px solid var(--border);
}

.reactions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.reaction-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 34px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  background: var(--surface);
  font-size: var(--text-md);
  transition: border-color var(--ease), background-color var(--ease), transform var(--ease);
}

.reaction-chip:hover {
  border-color: var(--border-strong);
  transform: translateY(-1px);
}

.reaction-chip.reacted {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.reaction-count {
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--text-2);
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 16px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-pill);
  background: var(--surface);
  color: var(--text);
  font-weight: 600;
  font-size: var(--text-sm);
  transition: border-color var(--ease), background-color var(--ease), color var(--ease);
}

.action-btn:hover {
  background: var(--surface-2);
}

.action-btn.active {
  color: var(--accent-text);
  border-color: var(--accent);
  background: var(--accent-soft);
}

.action-btn.active .app-icon {
  fill: currentColor;
}

/* ---------- 시리즈 이전·다음 ---------- */
.series-nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s-3);
}

.series-nav-item {
  display: grid;
  gap: 4px;
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  background: var(--surface);
  transition: border-color var(--ease), box-shadow var(--ease);
  min-width: 0;
}

.series-nav-item:hover {
  border-color: var(--accent);
  text-decoration: none;
  box-shadow: var(--shadow-sm);
}

.series-nav-item.next {
  text-align: right;
}

.series-nav-dir {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--text-3);
}

.series-nav-item.next .series-nav-dir {
  justify-content: flex-end;
}

.series-nav-title {
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 500px) {
  .series-nav {
    grid-template-columns: 1fr;
  }

  .series-nav > span {
    display: none;
  }
}

/* ---------- 작성자 ---------- */
.author-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--s-4);
  padding: var(--s-5);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
}

.author-card-avatar {
  width: 60px;
  height: 60px;
}

.author-card-body {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.author-card-name {
  font-size: var(--text-lg);
  font-weight: 700;
}

.author-card-link {
  margin-top: 4px;
}

/* ---------- 관련 글 ---------- */
.section-title {
  font-size: var(--text-xl);
  margin-bottom: var(--s-4);
}

.section-title .count {
  color: var(--text-3);
  font-weight: 600;
  margin-left: 4px;
}

.related-list {
  display: grid;
  gap: var(--s-2);
}

.related-item {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: var(--s-3);
  align-items: center;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--text);
  transition: border-color var(--ease), box-shadow var(--ease);
}

.related-item:hover {
  border-color: var(--accent);
  text-decoration: none;
  box-shadow: var(--shadow-sm);
}

.related-thumb {
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-sm);
  background: var(--surface-2) center / cover no-repeat;
}

.related-body {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.related-item-title {
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.related-item-summary {
  font-size: var(--text-sm);
  color: var(--text-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ---------- 댓글 ---------- */
.comments {
  padding-top: var(--s-6);
  border-top: 1px solid var(--border);
}

.comments .composer {
  margin-bottom: var(--s-4);
}

.empty-comments {
  padding: var(--s-8) 0;
  text-align: center;
}

/* ---------- 오른쪽 사이드 ---------- */
.post-side {
  display: none;
}

@media (min-width: 1100px) {
  .post-side {
    display: block;
  }
}

.side-sticky {
  position: sticky;
  top: calc(var(--header-height) + var(--s-6));
  display: grid;
  gap: var(--s-6);
}

.side-actions {
  display: flex;
  gap: var(--s-2);
}

.side-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  min-width: 40px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  background: var(--surface);
  color: var(--text-2);
  font-size: var(--text-sm);
  font-weight: 600;
  transition: border-color var(--ease), color var(--ease), background-color var(--ease);
}

.side-btn:hover {
  color: var(--text);
  border-color: var(--border-strong);
}

.side-btn.active {
  color: var(--accent-text);
  border-color: var(--accent);
  background: var(--accent-soft);
}

.side-btn.active .app-icon {
  fill: currentColor;
}

.toc-side {
  border-left: 2px solid var(--border);
  padding-left: var(--s-4);
  max-height: calc(100vh - var(--header-height) - 140px);
  overflow-y: auto;
}

.toc-title {
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: var(--s-2);
}

.toc-side ul {
  display: grid;
  gap: 6px;
}

.toc-side li.active a {
  color: var(--accent-text);
  font-weight: 700;
}
</style>

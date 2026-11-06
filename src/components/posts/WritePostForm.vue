<template>
  <div class="write-form">
    <div class="editor-area">
      <div class="container-reading write-head">
        <textarea id="title" ref="title" class="title-input" v-model="title" placeholder="제목을 입력하세요" rows="1"
                  maxlength="200" @input="autoGrowTitle" @keydown.enter.prevent/>
        <div class="url-row" :class="{ invalid: !isPostUrlValid }">
          <span class="url-prefix">hwanstory.kr/{{ blogId }}/posts/</span>
          <input id="postUrl" class="url-input" type="text" v-model.trim="newPostUrl" placeholder="글-주소 (비우면 자동 생성)"
                 spellcheck="false" autocomplete="off"/>
        </div>
        <span v-if="!isPostUrlValid" class="error-text">글 주소는 영문·숫자·하이픈(-)·밑줄(_)만 쓸 수 있어요.</span>
        <tag-input-box id="tags" class="tags-row" v-model="tags"/>
      </div>
      <post-editor id="editor" class="editor" v-model="content"/>
    </div>

    <div class="write-bar">
      <div class="container write-bar-inner">
        <div class="bar-left">
          <button class="btn btn-ghost" type="button" @click="exit">
            <app-icon name="arrow-left" :size="16"/>나가기
          </button>
          <span v-if="draftSavedAt" class="draft-note subtle small">
            <app-icon name="check" :size="14"/>이 브라우저에 임시 보관됨 {{ draftSavedAt }}
          </span>
        </div>
        <div class="bar-right">
          <div class="series-group">
            <series-selector :blog-id="blogId" v-model="seriesUrl" :refresh-key="seriesRefreshKey"/>
            <button class="btn btn-icon" type="button" title="새 시리즈 만들기" aria-label="새 시리즈 만들기"
                    @click="createSeries">
              <app-icon name="plus" :size="18"/>
            </button>
          </div>
          <select id="open-type" class="select open-type" v-model="openType" aria-label="공개 설정">
            <option value="PUBLIC">공개</option>
            <option value="PRIVATE">비공개</option>
            <option value="DRAFT">임시저장</option>
            <option value="SCHEDULED">예약 발행</option>
          </select>
          <input v-if="openType === 'SCHEDULED'" class="input scheduled-at" type="datetime-local" v-model="scheduledAt"
                 aria-label="발행 시각"/>
          <button class="btn publish" type="button" :disabled="!canSubmit" @click="isNewPost ? writePost() : modifyPost()">
            <span v-if="isLoading">저장 중…</span>
            <span v-else>{{ submitLabel }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { HttpApiError } from '@/api/common/httpApiClient';
import { createPost, createSeries, getPost, modifyPost } from '@/api/blog';
import store from '@/store';
import { OpenType, TagDto } from '@/api/models/blog.dtos';
import PostEditor from '@/components/posts/PostEditor.vue';
import { uploadFileFromUrl } from '@/api/attachments';
import TagInputBox from '@/components/posts/TagInputBox.vue';
import SeriesSelector from '@/components/series/SeriesSelector.vue';
import AppIcon from '@/components/common/AppIcon.vue';
import { marked } from 'marked';
import { confirmDialog, promptDialog, toast } from '@/utils/dialog';
import dayjs from 'dayjs';

// 작성 중인 글을 브라우저에 임시 보관하는 키 (새 글만; 수정은 서버 글이 원본이므로 보관하지 않는다)
const DRAFT_STORAGE_KEY = 'hwanstory.write.draft';

interface LocalDraft {
  title: string;
  content: string;
  tags: Array<string>;
  postUrl: string;
  savedAt: number;
}

export default defineComponent({
  name: 'WritePostForm',
  components: { AppIcon, SeriesSelector, TagInputBox, PostEditor },
  props: {
    postUrl: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      title: '',
      content: '',
      newPostUrl: '',
      seriesUrl: '',
      seriesRefreshKey: 0,
      isLoading: false,
      tags: Array<string>(),
      openType: 'PUBLIC' as OpenType,
      // datetime-local 입력값 (yyyy-MM-ddTHH:mm)
      scheduledAt: '',
      draftSavedAt: '',
      draftTimer: null as ReturnType<typeof setTimeout> | null,
      isDraftRestoredOrDeclined: false,
    };
  },
  computed: {
    isTitleValid(): boolean {
      return this.title.trim().length > 0;
    },
    // 예약 발행을 선택한 경우 발행 시각이 입력되어 있어야 한다.
    isScheduleValid(): boolean {
      return this.openType !== 'SCHEDULED' || this.scheduledAt.length > 0;
    },
    submitLabel(): string {
      if (this.openType === 'DRAFT') return '임시저장';
      if (this.openType === 'SCHEDULED') return '예약 발행';
      if (this.openType === 'PRIVATE') return this.isNewPost ? '비공개로 저장' : '수정 완료';
      return this.isNewPost ? '발행하기' : '수정 완료';
    },
    isContentValid(): boolean {
      return this.content.trim().length > 0;
    },
    isPostUrlValid(): boolean {
      if (this.newPostUrl.length == 0) {
        return true;
      }
      const regex = /^[-a-zA-Z\d_]+$/;
      return regex.test(this.newPostUrl);
    },
    canSubmit(): boolean {
      return this.isTitleValid && this.isContentValid && this.isPostUrlValid && this.isScheduleValid && !this.isLoading;
    },
    isNewPost(): boolean {
      return !this.postUrl;
    },
    blogId(): string {
      return store.state.accountStore.blogId;
    },
  },
  watch: {
    newPostUrl() {
      this.newPostUrl = this.newPostUrl.replace(/(\r\n|\n|\r)/gm, '');
    },
    title() {
      this.scheduleDraftSave();
    },
    content() {
      this.scheduleDraftSave();
    },
    tags() {
      this.scheduleDraftSave();
    },
  },
  methods: {
    autoGrowTitle() {
      const title = this.$refs['title'] as HTMLTextAreaElement | undefined;
      if (!title) {
        return;
      }
      title.style.height = 'auto';
      title.style.height = `${title.scrollHeight}px`;
    },
    async exit() {
      const hasContent = this.isTitleValid || this.isContentValid;
      if (hasContent) {
        const ok = await confirmDialog({
          title: '글쓰기를 나갈까요?',
          message: this.isNewPost
              ? '작성 중인 내용은 이 브라우저에 임시 보관되어 다음에 이어 쓸 수 있습니다.'
              : '저장하지 않은 수정 내용은 사라집니다.',
          confirmLabel: '나가기',
        });
        if (!ok) {
          return;
        }
      }
      if (window.history.length > 1) {
        this.$router.back();
      } else {
        this.$router.push('/');
      }
    },
    async createSeries() {
      const seriesTitle = await promptDialog({
        title: '새 시리즈',
        message: '시리즈 제목을 입력하세요. 같은 시리즈의 글은 글 상단에 묶여서 보입니다.',
        placeholder: '예: Vue 3 입문',
        confirmLabel: '다음',
      });
      if (!seriesTitle) {
        return;
      }
      const suggested = seriesTitle.trim().toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/^-|-$/g, '');
      const seriesUrl = await promptDialog({
        title: '시리즈 주소',
        message: `${this.blogId}/series/ 뒤에 붙을 주소입니다. 영문·숫자·하이픈(-)을 쓰세요.`,
        placeholder: 'vue3-basics',
        defaultValue: /^[-a-z0-9_]+$/.test(suggested) ? suggested : '',
        confirmLabel: '만들기',
      });
      if (!seriesUrl) {
        return;
      }

      await createSeries({
        seriesUrl: seriesUrl.trim(),
        title: seriesTitle.trim(),
      })
      .then((series) => {
        toast.success(`'${series.title}' 시리즈를 만들었습니다.`);
        this.seriesRefreshKey += 1;
        this.seriesUrl = series.seriesUrl;
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
      });
    },
    buildRequest() {
      return {
        title: this.title.trim(),
        content: this.content,
        summary: this.createSummaryFromContent(this.content),
        openType: this.openType,
        scheduledAt: this.openType === 'SCHEDULED' ? this.scheduledAt : null,
        postUrl: this.newPostUrl ? this.newPostUrl : null,
        tags: this.tags?.map((name) => ({ name } as TagDto)),
        seriesUrl: this.seriesUrl ? this.seriesUrl : null,
      };
    },
    async writePost() {
      if (!this.canSubmit) {
        return;
      }
      this.isLoading = true;
      await createPost({
        ...this.buildRequest(),
        thumbnailFileId: await this.getThumbnailFileId(),
      })
      .then((post) => {
        this.clearDraft();
        store.dispatch('cacheStore/clearMainPosts');
        toast.success(this.openType === 'DRAFT' ? '임시저장했습니다.' : this.openType === 'SCHEDULED' ? '예약 발행을 걸어 두었습니다.' : '글을 발행했습니다.');
        this.$router.push(`/${post.author.blogId}/posts/${post.postUrl}`);
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
      })
      .finally(() => {
        this.isLoading = false;
      });
    },
    async modifyPost() {
      if (!this.canSubmit) {
        return;
      }
      this.isLoading = true;
      await modifyPost(this.postUrl, {
        ...this.buildRequest(),
        thumbnailFileId: await this.getThumbnailFileId(),
      })
      .then((post) => {
        store.dispatch('cacheStore/clearMainPosts');
        toast.success('글을 수정했습니다.');
        this.$router.push(`/${post.author.blogId}/posts/${post.postUrl}`);
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
      })
      .finally(() => {
        this.isLoading = false;
      });
    },
    async loadPost() {
      if (this.postUrl) {
        await getPost(store.state.accountStore.blogId, this.postUrl)
        .then((post) => {
          this.title = post.title;
          this.newPostUrl = post.postUrl;
          this.content = post.content;
          this.tags = post.tags?.map((x) => x.name) ?? [];
          this.openType = post.openType;
          this.scheduledAt = post.scheduledAt ? post.scheduledAt.substring(0, 16) : '';
          this.seriesUrl = post.seriesUrl ? post.seriesUrl : '';
          this.$nextTick(() => this.autoGrowTitle());
        })
        .catch((error: HttpApiError) => {
          toast.error(error.getErrorMessage());
          this.$router.push('/');
        });
      }
    },
    async getThumbnailFileId() {
      const urls = /!\[.*?\]\((.*?)\)/.exec(this.content);
      if (urls) {
        try {
          const imageUrl = new URL(urls[1]);
          return await uploadFileFromUrl(imageUrl)
          .then((file) => file.id)
          .catch(() => undefined);
        } catch (e) {
          return undefined;
        }
      }
      return undefined;
    },
    createSummaryFromContent(content: string) {
      const renderer = new marked.Renderer();
      renderer.code = () => '\n';
      renderer.blockquote = () => '\n';
      renderer.html = () => '\n';
      renderer.heading = () => '\n';
      renderer.hr = () => '\n';
      renderer.list = () => '\n';
      renderer.listitem = () => '\n';
      renderer.checkbox = () => '\n';
      renderer.table = () => '\n';
      renderer.tablerow = () => '\n';
      renderer.tablecell = () => '\n';
      renderer.strong = (text) => text.trim();
      renderer.em = (text) => text.trim();
      renderer.codespan = (code) => code.trim();
      renderer.br = () => '\n';
      renderer.del = () => '\n';
      renderer.link = (href, title, text) => text.trim();
      renderer.image = () => '\n';
      renderer.paragraph = (text) => text.trim();

      let summary = marked(content, {
        renderer: renderer,
      }).split('\n').filter(Boolean)[0];
      if (!summary) {
        return '내용없음';
      }

      const doc = new DOMParser().parseFromString(summary, 'text/html');
      summary = doc.documentElement.textContent ?? '';

      return summary.length > 255 ? summary.substring(0, 255) : summary;
    },
    // ---- 브라우저 임시 보관 (새 글만) ----
    scheduleDraftSave() {
      if (!this.isNewPost || !this.isDraftRestoredOrDeclined) {
        return;
      }
      if (this.draftTimer) {
        clearTimeout(this.draftTimer);
      }
      this.draftTimer = setTimeout(() => this.saveDraft(), 1500);
    },
    saveDraft() {
      if (!this.isNewPost) {
        return;
      }
      if (!this.isTitleValid && !this.isContentValid) {
        this.clearDraft();
        return;
      }
      const draft: LocalDraft = {
        title: this.title,
        content: this.content,
        tags: this.tags ?? [],
        postUrl: this.newPostUrl,
        savedAt: Date.now(),
      };
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
        this.draftSavedAt = dayjs(draft.savedAt).format('HH:mm');
      } catch (e) {
        // 저장 공간이 없으면 임시 보관을 건너뛴다.
      }
    },
    clearDraft() {
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch (e) {
        // 무시
      }
      this.draftSavedAt = '';
    },
    async restoreDraftIfAny() {
      if (!this.isNewPost) {
        return;
      }
      let draft: LocalDraft | null = null;
      try {
        const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
        draft = raw ? JSON.parse(raw) as LocalDraft : null;
      } catch (e) {
        draft = null;
      }
      if (draft && (draft.title || draft.content)) {
        const ok = await confirmDialog({
          title: '이어서 쓸까요?',
          message: `${dayjs(draft.savedAt).format('M월 D일 HH:mm')}에 쓰다 만 글이 이 브라우저에 남아 있어요.\n제목: ${draft.title || '(제목 없음)'}`,
          confirmLabel: '이어 쓰기',
          cancelLabel: '새로 쓰기',
        });
        if (ok) {
          this.title = draft.title;
          this.content = draft.content;
          this.tags = draft.tags ?? [];
          this.newPostUrl = draft.postUrl ?? '';
          this.draftSavedAt = dayjs(draft.savedAt).format('HH:mm');
          this.$nextTick(() => this.autoGrowTitle());
        } else {
          this.clearDraft();
        }
      }
      this.isDraftRestoredOrDeclined = true;
    },
  },
  created() {
    this.loadPost();
  },
  mounted() {
    this.restoreDraftIfAny();
    (this.$refs['title'] as HTMLTextAreaElement | undefined)?.focus();
  },
  beforeUnmount() {
    if (this.draftTimer) {
      clearTimeout(this.draftTimer);
      this.saveDraft();
    }
  },
});
</script>

<style scoped>
.write-form {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  height: 100%;
  min-height: 0;
  background: var(--surface);
}

.editor-area {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-height: 0;
  overflow: hidden;
}

.write-head {
  width: 100%;
  max-width: 100%;
  display: grid;
  gap: var(--s-2);
  padding: var(--s-5) var(--gutter) var(--s-3);
  box-sizing: border-box;
}

.title-input {
  width: 100%;
  resize: none;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text);
  font-size: var(--text-3xl);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.3;
  overflow: hidden;
  padding: 0;
}

.title-input::placeholder {
  color: var(--text-3);
}

.url-row {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: var(--text-sm);
  color: var(--text-3);
  border-bottom: 1px solid var(--border);
  padding: 6px 0;
}

.url-row.invalid {
  border-bottom-color: var(--danger);
}

.url-prefix {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 50%;
}

.url-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
}

.url-input::placeholder {
  color: var(--text-3);
  font-family: var(--font-sans);
}

.tags-row {
  border-bottom: 1px solid var(--border);
  padding: 4px 0;
  min-height: 38px;
}

.editor {
  min-height: 0;
  padding: 0 var(--gutter) var(--s-4);
}

.write-bar {
  border-top: 1px solid var(--border);
  background: var(--surface);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.write-bar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3);
  min-height: 60px;
  padding-block: var(--s-2);
}

.bar-left,
.bar-right {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  flex-wrap: wrap;
}

.bar-right {
  justify-content: flex-end;
}

.draft-note {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.series-group {
  display: flex;
  align-items: center;
  gap: 2px;
}

.open-type {
  width: auto;
  min-height: 38px;
  padding-block: 6px;
  font-size: var(--text-sm);
}

.scheduled-at {
  width: auto;
  min-height: 38px;
  padding-block: 6px;
  font-size: var(--text-sm);
}

.publish {
  min-width: 110px;
}

@media (max-width: 760px) {
  .title-input {
    font-size: var(--text-2xl);
  }

  .draft-note {
    display: none;
  }

  .bar-left .btn span {
    display: none;
  }

  .series-group :deep(.series-select) {
    max-width: 130px;
  }
}
</style>

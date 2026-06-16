# hwanstory

Hwan'Story 블로그 서비스의 프론트엔드. (백엔드는 별도 저장소 `hwans-api-server`)

## 기술 스택
- Vue 3 + TypeScript, vue-cli 5, Vuex, Vue Router
- Toast UI Editor(글 작성/뷰어), axios, dayjs, sockjs-client(WebSocket)

## 커밋 규칙
- 커밋 작성자는 반드시 `Kim, Hwan <akon47@naver.com>` 로 한다.
  (기본 git 설정과 다를 수 있으니 `git commit --author="Kim, Hwan <akon47@naver.com>"` 또는 repo-local `git config user.name/user.email` 로 지정)

## 빌드 / 실행
- 의존성 설치: `npm install`
- 개발 서버: `npm run serve`
- 운영 빌드: `npm run build` (eslint 포함, 푸시 전 통과 확인)

## 환경 / URL
- 환경변수는 `.env`에 있고 `public/index.html`은 `<%= VUE_APP_* %>` 템플릿으로 주입한다.
- 프론트: `https://hwanstory.kr` / API: `https://api.hwanstory.kr`
- 게시글 URL 형태: `/{blogId}/posts/{postUrl}`

## 배포 (중요)
- **`master` 브랜치 푸시 = 운영 자동 배포.** Jenkins가 푸시를 감지해 빌드 → Docker(nginx) 이미지 → 운영 서버에 자동 배포한다.
- 문서(이 파일 포함)만 바꿔 푸시해도 운영 재배포가 트리거되니, 가급적 실제 변경과 함께 푸시한다.

## 구조 메모
- API 호출은 `src/api/`의 모듈을 통하며, 공통 클라이언트는 `src/api/common/httpApiClient.ts`(토큰 자동 첨부 + 401 시 토큰 재발급 인터셉터). 첨부 이미지 절대경로는 `attachmentFileBaseUrl + url`.
- 게시글 화면(`src/views/PostView.vue`)은 목차(TOC)/읽기 진행률/읽기 시간/관련 게시글 + 북마크/이모지 반응/같은 시리즈 이전·다음 글 네비게이션/Open Graph·Twitter 메타태그를 포함한다. 뷰어(`PostViewer.vue`)는 렌더 완료 시 `rendered` 이벤트로 루트 엘리먼트를 전달한다(목차 생성용).
- 댓글(`SimpleCommentItem.vue`)은 마크다운 렌더링(좋아요 포함). `v-html` 사용 전 `<>&` 이스케이프 + 링크/이미지 위험 프로토콜(javascript:/data:) 제거로 XSS를 방지한다.
- 글 작성(`WritePostForm.vue`)의 공개유형 select: 공개/비공개/임시저장(DRAFT)/예약 발행(SCHEDULED, datetime-local로 `scheduledAt` 전송).
- 내 북마크는 `/bookmarks`(`BookmarksView.vue`, 헤더 드롭다운 링크). 작성자 통계는 `SettingView.vue`에 패널로 표시(`getMyStatistics`).
- 이모지 반응 허용 목록(`PostView.vue`의 `ALLOWED_REACTIONS`)은 백엔드 `EMOJI_TO_KEY`와 **반드시 동일**해야 한다.

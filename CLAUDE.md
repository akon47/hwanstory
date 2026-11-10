# hwanstory

Hwan'Story 블로그 서비스의 프론트엔드. (백엔드는 별도 저장소 `hwans-api-server`)

## 기술 스택
- Vue 3.5 + TypeScript 4.9, vue-cli 5(webpack), Vuex 4.1, Vue Router 4.6 (2026-11-06 에 마이너 버전 전부 올림. Vite·Pinia 전환은 아직 안 함)
- Toast UI Editor(글 작성/뷰어), axios 1.x(요청 인터셉터는 `InternalAxiosRequestConfig`·`headers.set()` 사용), dayjs, marked 4(5+ 는 ESM 전용이라 보류), sockjs-client(WebSocket)
- 글꼴은 Pretendard(jsDelivr CDN, `public/index.html`) → Noto Sans KR 순서로 폴백. 아이콘은 외부 폰트 없이 `AppIcon.vue` 의 인라인 SVG(Lucide 스타일)만 쓴다.
- `playwright` 는 화면 확인용 devDependency(운영 번들과 무관). 브라우저는 `npx playwright install chromium` 으로 받는다.
- Docker 빌드 이미지는 `node:24-alpine` 으로 고정

## 커밋 규칙
- 커밋 작성자는 반드시 `Kim, Hwan <akon47@naver.com>` 로 한다.
  (기본 git 설정과 다를 수 있으니 `git commit --author="Kim, Hwan <akon47@naver.com>"` 또는 repo-local `git config user.name/user.email` 로 지정)

## 빌드 / 실행
- 의존성 설치: `npm install`
- 개발 서버: `npm run serve` (기본은 운영 API 를 보는데 CORS 로 막히므로, 로컬 API 를 띄우고 `.env.development.local`(gitignore) 에 `VUE_APP_API_BASE_URI=http://localhost:8080/`, `VUE_APP_WEBSOCKET_URI=http://localhost:8080/ws`, `VUE_APP_BASE_URI=http://localhost:8081/` 를 두면 된다. 로컬 API 의 `allowedOrigins` 는 `http://localhost:8081`)
- 화면 스크린샷: `node scripts/screenshots.js http://localhost:8081 .shots light all [--login]` (라이트/다크, 데스크톱/모바일 폭으로 주요 화면을 `.shots/` 에 저장. UI 를 바꾸면 커밋 전에 찍어서 눈으로 확인한다)
- 운영 빌드: `npm run build` (eslint 포함, 푸시 전 통과 확인)

## 환경 / URL
- 환경변수는 `.env`에 있고 `public/index.html`은 `<%= VUE_APP_* %>` 템플릿으로 주입한다.
- 프론트: `https://hwanstory.kr` / API: `https://api.hwanstory.kr`
- 게시글 URL 형태: `/{blogId}/posts/{postUrl}`

## 배포 (중요)
- **`master` 브랜치 푸시 = 운영 자동 배포.** Jenkins가 푸시를 감지해 빌드 → Docker(nginx) 이미지 → 운영 서버에 자동 배포한다.
- 문서(이 파일 포함)만 바꿔 푸시해도 운영 재배포가 트리거되니, 가급적 실제 변경과 함께 푸시한다.

## 디자인 시스템 (2026-11-06 전면 개편)
- 모든 색·글꼴·간격·모서리·그림자는 `src/css/common.css` 의 `:root` 토큰(`--bg/--surface/--surface-2/--border/--text/--text-2/--text-3/--accent/--accent-soft/--danger/...`, `--text-xs..4xl`, `--s-1..16`, `--radius*`, `--shadow-*`)으로만 쓴다. 다크 테마는 `:root.dark-theme` 에서 같은 토큰을 다시 정의한다(`commonStore` 가 `<html>` 의 class 를 바꾼다). 컴포넌트 CSS 에 색 리터럴을 쓰지 않는다.
- 공통 클래스: `.btn`(+`-secondary/-ghost/-soft/-danger/-danger-ghost/-sm/-lg/-block/-icon/-pill`), `.input/.textarea/.select/.field/.hint/.error-text`, `.card/.card-head/.card-body/.card-foot`, `.chip/.badge(-accent/-success/-warning/-danger)`, `.tabs`, `.avatar`, `.menu/.menu-item/.menu-sep`, `.empty-state`, `.skeleton`, `.meta-row`, `.container(-reading|-narrow)`, `.page/.page-head`. 새 화면은 이 클래스를 먼저 쓰고 부족한 것만 scoped 로 보탠다.
- 기본 `button` 은 스타일이 없다(리셋됨). 버튼에는 반드시 `.btn` 계열 클래스를 붙인다. 클래스 없는 `select/input/textarea` 도 테마 색을 따르도록 안전망 규칙이 있지만, 되도록 `.select/.input` 을 붙인다.
- 레이아웃 폭: 피드 `--content-max 1200px`, 글 읽기 `--reading-max 720px`(1100px 이상에서는 오른쪽 220px 사이드에 좋아요·북마크·공유와 목차), 설정·북마크 등 `--narrow-max 880px`. 헤더는 sticky 64px(`--header-height`).
- 브라우저 기본 `alert/confirm/prompt` 는 쓰지 않는다. `src/utils/dialog.ts` 의 `toast.info/success/error`, `await confirmDialog({...})`, `await promptDialog({...})` 를 쓰고, 렌더링은 `App.vue` 의 `AppDialogHost.vue` 가 한다. 오류는 `toast.error(error.getErrorMessage())`.
- 날짜·숫자는 `src/utils/format.ts`(`formatRelativeDate`: 방금/n분 전/…, `formatDateTime`, `formatCount`), 썸네일 없는 글의 배경은 `src/utils/thumbnail.ts`(작성 시각 기반 결정적 그라데이션).
- scoped 스타일에서 `:global(.dark-theme)` 를 쓰지 않는다(컴파일 결과가 전체 화면에 필터를 먹여 다크 모드가 빈 화면이 된 적이 있다). 테마별 규칙은 `common.css` 에 `.dark-theme ...` 전역 규칙으로 둔다.

## 구조 메모
- 헤더(`AppHeader.vue`): 로고·검색창(`/search?q=`, `MainView.vue` 가 `isSearchMode` 로 재사용)·테마 토글·(로그인 시) 알림 패널·새 글 작성·아바타 메뉴(`AccountSummaryMenuButton.vue`, 이름은 `accountStore.name`). 바닥글은 `AppFooter.vue`, `/write` 에서는 숨긴다.
- 피드 탭(`FeedTabs.vue`: 최근/인기/지금 보는 중/팔로잉)은 `MainView.vue` 와 `FollowingFeedView.vue` 가 공유. 카드는 `SimplePostWrapItem.vue`(피드), 행은 `SimplePostListItem.vue`(블로그 글 목록·북마크·좋아요). 카드 전체가 링크(stretched link)이고 작성자 링크만 위에 떠 있다.
- 댓글 입력은 `CommentComposer.vue`(로그인 여부에 따라 이름·비밀번호 칸, Ctrl+Enter, `submit(submission, done)` 콜백) 로 글·답글이 공유하고, `SimpleCommentItem.vue` 는 인라인 수정·답글 펼치기·좋아요를 담당한다.
- 글쓰기(`WritePostForm.vue`): 새 글은 1.5초 디바운스로 `localStorage(hwanstory.write.draft)` 에 임시 보관하고, 다시 들어오면 이어 쓸지 묻는다. 시리즈 생성은 `promptDialog` 두 번(제목→주소). 나가기 버튼은 내용이 있으면 확인한다.
- API 호출은 `src/api/`의 모듈을 통하며, 공통 클라이언트는 `src/api/common/httpApiClient.ts`(토큰 자동 첨부 + 401 시 토큰 재발급 인터셉터). 첨부 이미지 절대경로는 `attachmentFileBaseUrl + url`.
- 게시글 화면(`src/views/PostView.vue`)은 목차(TOC)/읽기 진행률/읽기 시간/관련 게시글 + 북마크/이모지 반응/같은 시리즈 이전·다음 글 네비게이션/Open Graph·Twitter 메타태그를 포함한다. 뷰어(`PostViewer.vue`)는 렌더 완료 시 `rendered` 이벤트로 루트 엘리먼트를 전달한다(목차 생성용).
- 댓글(`SimpleCommentItem.vue`)은 마크다운 렌더링(좋아요 포함). `v-html` 사용 전 `<>&` 이스케이프 + 링크/이미지 위험 프로토콜(javascript:/data:) 제거로 XSS를 방지한다.
- 글 작성(`WritePostForm.vue`)의 공개유형 select: 공개/비공개/임시저장(DRAFT)/예약 발행(SCHEDULED, datetime-local로 `scheduledAt` 전송).
- 내 북마크는 `/bookmarks`(`BookmarksView.vue`, 헤더 드롭다운 링크). 작성자 통계는 `SettingView.vue`에 패널로 표시(`getMyStatistics`).
- 이모지 반응 허용 목록(`PostView.vue`의 `ALLOWED_REACTIONS`)은 백엔드 `EMOJI_TO_KEY`와 **반드시 동일**해야 한다.
- **AI 에이전트 위임**: `/tokens`(`TokensView.vue`: 개인 액세스 토큰 목록·발급·폐기, 에이전트 프롬프트), `/device?code=XXXX-XXXX`(`DeviceView.vue`: 에이전트의 기기 로그인 요청을 확인·승인/거부), `/agents`(`AgentGuideView.vue`: API의 `/agents.md`를 `marked`로 렌더). API 모듈은 `src/api/tokens.ts`, DTO는 `token.dtos.ts`. 두 화면은 로그인 필요 가드(`routeToSigninWhenIsNotLoggedIn`)가 `/signin?redirect=`로 보내고, `SigninForm.vue`가 로그인 뒤 사이트 내부 경로로만 돌려보낸다. 헤더 드롭다운과 설정 화면에서 진입.
- **SEO**: `src/utils/seo.ts`(canonical/robots/JSON-LD 설정)를 라우터 `afterEach`가 경로마다 호출(`NOINDEX_PATHS`는 noindex)하고, `PostView.vue`가 글 로드 후 BlogPosting JSON-LD·`article:*` 메타·비공개 글 noindex를 추가한다. 크롤러(검색엔진·SNS·AI 봇 UA)는 `nginx.default.conf`의 `map`으로 판별해 페이지 라우트만 API의 `/prerender/<경로>`로 프록시한다(사람은 SPA 그대로, API 장애 시 SPA로 폴백). `/sitemap.xml`·`/rss`도 API로 프록시. `nginx.default.conf`는 **템플릿**(`/etc/nginx/templates/`)이라 컨테이너 시작 시 `${PRERENDER_UPSTREAM}`(Dockerfile 기본 `https://api.hwanstory.kr`, `docker run -e`로 변경 가능)만 치환된다. 예전 VM cron이 만들던 `/static/*.html` 스냅샷과 정적 sitemap은 더 이상 쓰지 않는다. `robots.txt`는 개인 화면을 Disallow.
- **관리자 콘솔**(`isAdmin` 가드, `src/views/admin/`): `AdminLayout.vue`(왼쪽 메뉴, 모바일은 칩) 아래 `/admin`(대시보드: KPI·최근 30일 막대 차트·최근 글/댓글/가입), `/admin/members`(검색·상태 필터·정지/해제·관리자 지정/해제, 자기 자신은 해제 불가), `/admin/posts`(비공개·임시저장 포함 전체 글, 공개 유형 즉시 변경·삭제, 페이지 번호), `/admin/comments`(전체 댓글 검색·삭제), `/admin/tokens`(모든 회원의 PAT 목록·폐기), `/admin/live`(3초 폴링 실시간 접속), `/admin/system`(버전·가동 시간·힙·DB/Redis·첨부 디스크·대기 작업). API 는 `src/api/admin.ts`, 페이지 응답은 `PageDto`(common.dtos).
- **운영 기능(2026-11-10)**: ① 신고 — 글 화면의 "신고" 버튼과 남의 댓글의 "신고"가 `openReportDialog(targetType, targetId)`(`utils/dialog.ts`, 창은 `AppDialogHost.vue`)를 열고 `POST /v1/site/reports` 로 접수(손님 가능). 관리자는 `/admin/reports`(`AdminReportsView.vue`: 상태 필터, 대상 삭제·처리 완료·기각·다시 열기, 메뉴에 대기 건수 배지). ② 사이트 공지 — `/admin/site`(`AdminSiteView.vue`)에서 저장하면 `SiteAnnouncement.vue`(헤더 아래 띠, `App.vue`)가 `GET /v1/site/announcement` 로 받아 보여주고, 닫으면 그 공지의 `updatedAt` 을 localStorage 에 적어 다시 안 띄운다. ③ 활동 기록 — `/admin/audit`(`AdminAuditView.vue`, 행동 이름표는 `ACTION_LABELS`). 사유 이름은 `site.dtos.ts` 의 `REPORT_REASONS`.
- **카드형 글 목록·임베드**: `/:blogId/cards[?tag=]`(`BlogCardsView.vue`)는 한 사람의 글만 메인처럼 카드로 보여주는 독립 화면. `?embed=1` 이면 `App.vue` 가 헤더·바닥글을 숨겨 다른 사이트에 iframe 으로 넣을 수 있다. 블로그 홈의 공유 버튼(`BlogView.vue`)이 블로그 링크·카드 링크·iframe 코드·RSS 를 복사해 준다.
- **시리즈**: 블로그 홈 탭 `/:blogId/series`(`BlogSeriesView.vue`)와 `/:blogId/series/:seriesUrl`(`BlogSeriesDetailView.vue`: 글 순서 목록, 주인은 이름 바꾸기·삭제).
- **함께 읽는 사람 커서**(`LiveCursors.vue`, 글 화면): 같은 글을 읽는 사람들의 마우스가 서로 보이고 `/` 키로 커서 옆에 한마디를 띄운다(Figma 커서 챗). 손님도 참여(`utils/cursorIdentity.ts` 가 탭별 랜덤 별명·색을 sessionStorage 에 둔다). 좌표는 `.post-main` 기준 비율(0~1)로 `CURSOR_MOVE`(50ms 쓰로틀)·`CURSOR_CHAT` 을 보내고, 서버가 `CURSOR_BATCH`(약 100ms 묶음, 커서 최대 40개, 읽는 사람이 120명을 넘으면 `disabled`)로 돌려준다. 마우스가 없는 기기(터치)에서는 꺼진다.
- **함께 읽는 사람 동그라미**(`PostViewers.vue`, 글 화면 오른쪽 사이드의 목차 아래, 1100px 이상에서만): 같은 글을 읽는 사람이 2명 이상이면 색 동그라미를 나란히 보여준다(손님은 별명의 동물 그림, 회원은 이름 첫 글자 — `cursorIdentity.ts` 의 `avatarGlyph`, 나는 테두리로 표시, 7개를 넘으면 `+N`). `PostView.vue` 가 `viewPost(post.id, getCursorIdentity())` 로 이름·색을 함께 보내고, 서버가 그 글을 읽는 세션들에게 `POST_VIEWERS {postId, viewers, total}` 를 누가 들어오거나 나갈 때마다 보낸다. 백엔드가 먼저 배포돼 있어야 한다(예전 서버는 객체 payload 의 `VIEW_POST` 를 글 Id 로 잘못 읽는다).
- **읽는 위치**(`ReadPositionRail.vue` + `PostView.vue`): 화면 위 96px 기준선이 `.post-content` 의 어디쯤인지(0~1)를 스크롤할 때 400ms 간격으로 `READ_POSITION` 으로 보내고, 서버가 묶어 주는 `READ_POSITIONS {postId, positions[{id, progress}]}` 를 받아 ① 화면 오른쪽 가장자리 세로 줄의 색 점(위=본문 시작, 아래=끝, 누르면 그곳으로 이동) ② 목차 항목 옆 색 점(사이드 목차만) ③ 동그라미를 가리키면 "이름 · n% 읽는 중", 누르면 이동 으로 보여준다. 함께 읽는 사람 목록·위치 구독은 `PostView.vue` 가 맡고(`onpostviewerschanged`/`onreadpositionschanged`) `PostViewers.vue`·`ReadPositionRail.vue` 는 props 만 받는다.
- **읽는 중 / 자리 비움**(`PostView.vue`): 탭이 숨겨진 채 3분이 지나거나(visibilitychange) 보이는 탭이라도 30분 동안 조작이 없으면 `viewPost(null)` 로 읽는 중에서 빠지고, 탭으로 돌아오거나 조작하면 다시 들어간다(15초마다 확인). 탭만 열어 둔 사람이 하루 종일 "지금 보는 중"으로 남지 않게 하려는 것.

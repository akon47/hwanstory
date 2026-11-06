// 검색엔진 색인에 영향을 주는 <head> 요소(canonical, robots, JSON-LD)를 다루는 도우미.
// SPA 라우팅마다 라우터(afterEach)와 게시글 화면에서 호출한다. (크롤러용 서버 렌더 HTML 은 API 서버의 /prerender 가 따로 만든다)

const CANONICAL_ID = 'seo-canonical';
const ROBOTS_ID = 'seo-robots';
const JSON_LD_ID = 'seo-json-ld';

// 사이트 기본 주소 (끝의 / 제거)
export const siteBaseUrl: string = ((process.env.VUE_APP_BASE_URI as string) ?? 'https://hwanstory.kr/').replace(/\/+$/, '');

// 경로(또는 null)로 canonical 링크를 설정한다. 쿼리는 포함하지 않는다.
export function setCanonical(path: string | null) {
  let link = document.head.querySelector(`link#${CANONICAL_ID}`) as HTMLLinkElement | null;
  if (!path) {
    link?.remove();
    return;
  }
  if (!link) {
    link = document.createElement('link');
    link.id = CANONICAL_ID;
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  // 끝의 / 는 제거해 /a/b 와 /a/b/ 가 같은 canonical 을 갖게 한다.
  const normalized = (path.startsWith('/') ? path : `/${path}`).replace(/\/+$/, '') || '/';
  link.href = `${siteBaseUrl}${normalized}`;
}

// 색인 제외(noindex) 여부를 설정한다. 설정·글쓰기·관리자 화면과 비공개 글에 쓴다.
export function setRobotsMeta(noindex: boolean) {
  let meta = document.head.querySelector(`meta#${ROBOTS_ID}`) as HTMLMetaElement | null;
  if (!noindex) {
    meta?.remove();
    return;
  }
  if (!meta) {
    meta = document.createElement('meta');
    meta.id = ROBOTS_ID;
    meta.name = 'robots';
    document.head.appendChild(meta);
  }
  meta.content = 'noindex, nofollow';
}

// 구조화 데이터(JSON-LD)를 설정한다. null 이면 제거.
export function setJsonLd(data: Record<string, unknown> | null) {
  let script = document.head.querySelector(`script#${JSON_LD_ID}`) as HTMLScriptElement | null;
  if (!data) {
    script?.remove();
    return;
  }
  if (!script) {
    script = document.createElement('script');
    script.id = JSON_LD_ID;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  // </script> 로 스크립트가 닫히지 않도록 이스케이프
  script.text = JSON.stringify(data).replace(/</g, '\\u003c');
}

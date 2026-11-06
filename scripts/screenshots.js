// 화면 확인용 스크린샷 도구. 개발 서버(npm run serve, 8081)와 로컬 API(hwans-api-server, profile local)를 띄운 뒤 실행한다.
// 사용법: node scripts/screenshots.js <baseUrl> <outDir> <light|dark> [pages=all|a,b,c] [--login] [--desktop-only]
//   예) node scripts/screenshots.js http://localhost:8081 .shots light all --login
// --login 은 로컬 시드 계정(data.sql 의 akon47@naver.com / 12345)으로 로그인한다. playwright 는 devDependency 로 들어 있고,
// 브라우저는 `npx playwright install chromium` 으로 한 번 받아 둔다.
const { chromium } = require('playwright');
const fs = require('fs');
const args = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith('--'));
const [base, out, theme = 'light', only = ''] = args.filter((a) => !a.startsWith('--'));
const login = flags.includes('--login');
const desktopOnly = flags.includes('--desktop-only');

const PAGES = [
  ['home', '/'],
  ['top', '/top'],
  ['post', '/@kim-hwan/posts/introducing-hwan-screen-share'],
  ['post-series', '/@kim-hwan/posts/vue3-blog-2-router'],
  ['blog', '/@kim-hwan'],
  ['blog-posts', '/@kim-hwan/posts'],
  ['blog-likes', '/@kim-hwan/likes'],
  ['followers', '/@kim-hwan/followers'],
  ['signin', '/signin'],
  ['signup', '/signup'],
  ['agents', '/agents'],
  ['notfound', '/no-such-page'],
  ['search', '/search?q=Vue'],
  ['privacy', '/privacy-policy'],
  // 로그인 필요
  ['feed', '/feed'],
  ['write', '/write'],
  ['write-edit', '/write?post=introducing-hwan-screen-share'],
  ['setting', '/setting'],
  ['tokens', '/tokens'],
  ['bookmarks', '/bookmarks'],
  ['device', '/device'],
  ['admin', '/admin'],
];
const LOGIN_ONLY = new Set(['feed', 'write', 'write-edit', 'setting', 'tokens', 'bookmarks', 'device', 'admin']);
let wanted = only && only !== 'all' ? PAGES.filter(([k]) => only.split(',').includes(k)) : PAGES;
if (!login) wanted = wanted.filter(([k]) => !LOGIN_ONLY.has(k));
if (login) wanted = wanted.filter(([k]) => !['signin', 'signup'].includes(k));
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const sizes = desktopOnly ? [['desktop', 1280, 900]] : [['desktop', 1280, 900], ['mobile', 390, 844]];
  for (const [name, width, height] of sizes) {
    const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, locale: 'ko-KR', colorScheme: theme === 'dark' ? 'dark' : 'light' });
    await ctx.addInitScript((t) => { try { localStorage.setItem('theme', t === 'dark' ? 'dark-theme' : 'light-theme'); } catch (e) { /* ignore */ } }, theme);
    const page = await ctx.newPage();
    page.on('pageerror', (e) => console.log(`[${name}] pageerror:`, e.message));
    page.on('console', (m) => { if (m.type() === 'error') console.log(`[${name}] console.error:`, m.text().slice(0, 160)); });
    if (login) {
      await page.goto(base + '/signin', { waitUntil: 'networkidle' });
      await page.fill('#email', 'akon47@naver.com');
      await page.fill('#password', '12345');
      await page.click('button[type="submit"]');
      await page.waitForURL((u) => !u.pathname.startsWith('/signin'), { timeout: 20000 }).catch(() => console.log(`[${name}] login did not redirect`));
      await page.waitForTimeout(800);
    }
    const suffix = `${name}-${theme}${login ? '-in' : ''}`;
    for (const [key, path] of wanted) {
      try {
        await page.goto(base + path, { waitUntil: 'networkidle', timeout: 60000 });
      } catch (e) {
        console.log(`[${name}] ${key}: goto ${e.message.split('\n')[0]}`);
      }
      await page.waitForTimeout(1200);
      const full = !['home', 'top', 'blog-posts', 'write', 'write-edit', 'feed'].includes(key);
      await page.screenshot({ path: `${out}/${key}-${suffix}.png`, fullPage: full });
      console.log(`[${name}] ${key} ok`);
      // 로그인 상태의 열린 메뉴·알림 패널도 한 장씩
      if (login && key === 'home') {
        await page.click('.avatar-button');
        await page.waitForTimeout(300);
        await page.screenshot({ path: `${out}/menu-${suffix}.png` });
        await page.keyboard.press('Escape');
        const bell = await page.$('.bell');
        if (bell) {
          await bell.click();
          await page.waitForTimeout(600);
          await page.screenshot({ path: `${out}/notifications-${suffix}.png` });
          await page.keyboard.press('Escape');
        }
      }
      if (key === 'post' && name === 'desktop') {
        // 댓글 영역만 따로
        const comments = await page.$('#comments');
        if (comments) await comments.screenshot({ path: `${out}/comments-${suffix}.png` });
      }
    }
    await ctx.close();
  }
  await browser.close();
})();

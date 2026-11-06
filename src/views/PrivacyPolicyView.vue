<template>
  <div class="container container-reading page policy">
    <header class="policy-head">
      <h1>개인정보처리방침</h1>
      <p class="muted">
        Hwan'Story(hwanstory.kr, 이하 "이 서비스")는 개인이 취미로 만들어 운영하는 블로그 서비스입니다.
        「개인정보 보호법」 제30조에 따라 어떤 정보를 왜 모으고 어떻게 지키는지 아래와 같이 알려 드립니다.
      </p>
      <p class="subtle small">2022년 9월 9일 시행 · 2026년 11월 6일 개정</p>
    </header>

    <section>
      <h2>1. 모으는 정보와 쓰는 이유</h2>
      <p>회원가입과 서비스 이용에 꼭 필요한 정보만 모읍니다.</p>
      <table class="policy-table">
        <thead>
        <tr>
          <th>언제</th>
          <th>어떤 정보</th>
          <th>왜</th>
        </tr>
        </thead>
        <tbody>
        <tr>
          <td>회원가입</td>
          <td>이메일, 이름(필명), 비밀번호(암호화 저장), 블로그 주소</td>
          <td>본인 확인, 로그인, 내 블로그 운영</td>
        </tr>
        <tr>
          <td>소셜 로그인</td>
          <td>해당 서비스가 제공하는 이메일·이름·프로필 사진</td>
          <td>비밀번호 없이 가입·로그인</td>
        </tr>
        <tr>
          <td>프로필 수정(선택)</td>
          <td>소개, 회사, 위치, 홈페이지, 프로필 사진</td>
          <td>블로그 상단에 표시</td>
        </tr>
        <tr>
          <td>비회원 댓글</td>
          <td>이름, 비밀번호(암호화 저장)</td>
          <td>댓글 작성자 표시, 본인만 수정·삭제</td>
        </tr>
        <tr>
          <td>서비스 이용 중 자동 수집</td>
          <td>접속 IP, 브라우저 종류(User-Agent), 접속 시각, 쿠키</td>
          <td>오류 추적, 부정 이용 방지, 실시간 접속자 수 표시</td>
        </tr>
        </tbody>
      </table>
    </section>

    <section>
      <h2>2. 얼마나 보관하나</h2>
      <ul>
        <li>회원 정보는 <b>탈퇴할 때까지</b> 보관하고, 탈퇴하면 글·댓글과 함께 지체 없이 삭제합니다.</li>
        <li>접속 기록(IP, 브라우저, 시각)은 오류 추적을 위해 최대 <b>3개월</b> 보관한 뒤 자동으로 지웁니다.</li>
        <li>법령이 보관을 요구하는 경우에는 그 기간만큼만 따로 보관합니다.</li>
      </ul>
    </section>

    <section>
      <h2>3. 다른 곳에 주는지</h2>
      <p>개인정보를 팔거나 광고 목적으로 다른 사람에게 주지 않습니다. 다만 서비스를 돌리기 위해 아래 외부 서비스를 거칩니다.</p>
      <ul>
        <li><b>소셜 로그인</b> 제공자(Google, GitHub, Facebook, 네이버, 카카오, Discord, Microsoft): 로그인할 때 해당 서비스와 이메일·이름을 주고받습니다.</li>
        <li><b>Cloudflare</b>: 접속을 중계하고 공격을 막는 과정에서 IP 등 접속 정보가 지나갑니다.</li>
        <li><b>Google Analytics</b>: 방문 통계를 위해 쿠키 기반의 익명 이용 정보를 수집합니다. 브라우저의 쿠키 설정으로 거부할 수 있습니다.</li>
      </ul>
    </section>

    <section>
      <h2>4. 어떻게 지키나</h2>
      <ul>
        <li>비밀번호는 복원할 수 없는 방식(단방향 해시)으로 저장합니다.</li>
        <li>모든 통신은 HTTPS 로 암호화하고, 로그인 토큰은 만료 시간이 있습니다.</li>
        <li>서버는 운영자만 접근할 수 있고, 접속 기록을 남깁니다.</li>
        <li>AI 에이전트용 액세스 토큰은 회원이 직접 발급·폐기하며, 토큰 원문은 저장하지 않습니다.</li>
      </ul>
    </section>

    <section>
      <h2>5. 내 권리</h2>
      <p>
        언제든 내 정보를 보고, 고치고, 지우고, 처리를 멈추라고 요구할 수 있습니다. 프로필과 글·댓글은
        <router-link to="/setting">설정</router-link>에서 직접 고치거나 지울 수 있고, 회원 탈퇴도 설정에서 바로 할 수 있습니다.
        직접 하기 어려운 요청은 아래 이메일로 보내 주시면 지체 없이 처리합니다.
      </p>
    </section>

    <section>
      <h2>6. 쿠키</h2>
      <p>
        로그인 유지와 테마(밝게/어둡게) 기억에 브라우저 저장소와 쿠키를 씁니다. 브라우저 설정에서 쿠키를 거부할 수 있지만, 그러면 로그인이 풀릴 수 있습니다.
        맞춤형 광고를 위한 행태정보는 수집하지 않습니다.
      </p>
    </section>

    <section>
      <h2>7. 문의</h2>
      <p>이 서비스는 개인이 운영하므로 별도의 부서 없이 운영자가 직접 개인정보 보호 책임을 맡습니다.</p>
      <ul>
        <li>운영자: 김환</li>
        <li>이메일: <a href="mailto:akon47@naver.com">akon47@naver.com</a></li>
      </ul>
      <p>
        운영자와 해결되지 않으면 개인정보분쟁조정위원회(1833-6972, www.kopico.go.kr), 개인정보침해신고센터(118, privacy.kisa.or.kr)에
        도움을 청할 수 있습니다.
      </p>
    </section>

    <section>
      <h2>8. 바뀌면</h2>
      <p>이 방침이 바뀌면 이 페이지에 바뀐 날짜와 내용을 적어 알립니다.</p>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'PrivacyPolicyView',
});
</script>

<style scoped>
.policy {
  display: grid;
  gap: var(--s-8);
  line-height: 1.75;
  word-break: keep-all;
}

.policy-head {
  display: grid;
  gap: var(--s-3);
}

.policy-head h1 {
  font-size: var(--text-3xl);
}

section {
  display: grid;
  gap: var(--s-3);
}

section h2 {
  font-size: var(--text-xl);
  padding-bottom: var(--s-2);
  border-bottom: 1px solid var(--border);
}

section p,
section li {
  color: var(--text-2);
}

section b {
  color: var(--text);
  font-weight: 700;
}

section ul {
  display: grid;
  gap: 6px;
  padding-left: 1.2em;
  list-style: disc;
}

.policy-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.policy-table th,
.policy-table td {
  text-align: left;
  vertical-align: top;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  color: var(--text-2);
}

.policy-table th {
  color: var(--text);
  font-weight: 700;
  background: var(--surface-2);
}

@media (max-width: 600px) {
  .policy-table,
  .policy-table thead,
  .policy-table tbody,
  .policy-table tr,
  .policy-table th,
  .policy-table td {
    display: block;
  }

  .policy-table thead {
    display: none;
  }

  .policy-table tr {
    padding: var(--s-2) 0;
    border-bottom: 1px solid var(--border);
  }

  .policy-table td {
    border: none;
    padding: 4px 0;
  }

  .policy-table td:first-child {
    color: var(--text);
    font-weight: 700;
  }
}
</style>

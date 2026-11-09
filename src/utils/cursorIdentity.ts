import store from '@/store';

// 함께 읽는 사람 커서에 쓸 이름·색. 로그인했으면 내 이름, 아니면 이 탭에서만 유지되는 랜덤 별명.
const STORAGE_KEY = 'hwanstory.cursor.identity';

const ADJECTIVES = ['호기심 많은', '느긋한', '재빠른', '수줍은', '용감한', '졸린', '엉뚱한', '다정한', '차분한', '명랑한', '부지런한', '장난기 많은'];
const ANIMALS = ['수달', '고양이', '펭귄', '여우', '판다', '돌고래', '올빼미', '토끼', '너구리', '고슴도치', '알파카', '물범'];
// 손님 별명의 동물에 대응하는 그림 (읽는 사람 동그라미에 쓴다)
const ANIMAL_EMOJI: Record<string, string> = {
  수달: '🦦', 고양이: '🐱', 펭귄: '🐧', 여우: '🦊', 판다: '🐼', 돌고래: '🐬',
  올빼미: '🦉', 토끼: '🐰', 너구리: '🦝', 고슴도치: '🦔', 알파카: '🦙', 물범: '🦭',
};
const COLORS = ['#e8590c', '#2f9e44', '#1971c2', '#9c36b5', '#e03131', '#0c8599', '#f08c00', '#5f3dc4', '#c2255c', '#2b8a3e', '#1098ad', '#862e9c'];

export interface CursorIdentity {
  name: string;
  color: string;
}

// 동그라미 안에 넣을 한 글자: 동물 별명이면 그 동물 그림, 아니면 이름의 첫 글자
export function avatarGlyph(name: string): string {
  const trimmed = (name ?? '').trim();
  const lastWord = trimmed.split(/\s+/).pop() ?? '';
  return ANIMAL_EMOJI[lastWord] ?? (Array.from(trimmed)[0] ?? '?').toUpperCase();
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function randomGuestIdentity(): CursorIdentity {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  return { name: `${adjective} ${animal}`, color };
}

export function getCursorIdentity(): CursorIdentity {
  const name = store.state.accountStore.name;
  const blogId = store.state.accountStore.blogId;
  if (store.getters['accountStore/isLoggedIn'] && name) {
    return { name, color: COLORS[hashString(blogId || name) % COLORS.length] };
  }
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as CursorIdentity;
      if (parsed.name && parsed.color) {
        return parsed;
      }
    }
  } catch (e) {
    // 저장소를 못 쓰면 매번 새 별명을 쓴다.
  }
  const identity = randomGuestIdentity();
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  } catch (e) {
    // 무시
  }
  return identity;
}

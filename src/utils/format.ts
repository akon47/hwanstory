import dayjs from 'dayjs';

// 날짜를 "방금 / n분 전 / n시간 전 / n일 전 / 2026.11.06" 처럼 사람이 읽기 쉬운 형태로 바꾼다.
export function formatRelativeDate(value: Date | string | number | null | undefined): string {
  if (!value) {
    return '';
  }
  const date = dayjs(value);
  const diffMinutes = dayjs().diff(date, 'minute');
  if (diffMinutes < 1) {
    return '방금';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}시간 전`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}일 전`;
  }
  return date.format(date.year() === dayjs().year() ? 'M월 D일' : 'YYYY.MM.DD');
}

// 긴 날짜 (글 상세·댓글 툴팁용)
export function formatDateTime(value: Date | string | number | null | undefined): string {
  if (!value) {
    return '';
  }
  return dayjs(value).format('YYYY년 M월 D일 HH:mm');
}

export function formatDate(value: Date | string | number | null | undefined): string {
  if (!value) {
    return '';
  }
  return dayjs(value).format('YYYY년 M월 D일');
}

// 1234 -> "1,234"
export function formatCount(value: number | null | undefined): string {
  return (value ?? 0).toLocaleString('ko-KR');
}

// 본문 글자 수 기준 대략의 읽는 시간(분)
export function estimateReadingMinutes(content: string | null | undefined): number {
  const length = (content ?? '').replace(/\s+/g, '').length;
  return Math.max(1, Math.round(length / 500));
}

// 목적격 조사: 마지막 글자에 받침이 있으면 '을', 없으면 '를' ("제목을", "주소를")
export function withObjectParticle(word: string): string {
  const last = word.charCodeAt(word.length - 1);
  if (last >= 0xac00 && last <= 0xd7a3) {
    return `${word}${(last - 0xac00) % 28 === 0 ? '를' : '을'}`;
  }
  return `${word}을(를)`;
}

// 달러 금액 (AI 사용 비용·한도). 0.01 미만은 "$0.01 미만", 그 밖은 소수 둘째 자리까지 ("$1.23", "$10")
export function formatUsd(value: number | null | undefined): string {
  const amount = value ?? 0;
  if (amount > 0 && amount < 0.01) {
    return '$0.01 미만';
  }
  const fixed = amount.toFixed(2);
  return `$${fixed.endsWith('.00') ? fixed.slice(0, -3) : fixed}`;
}

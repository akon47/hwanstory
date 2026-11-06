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

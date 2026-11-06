import { attachmentFileBaseUrl } from '@/api/common/httpApiClient';

// 썸네일이 없는 글에 쓸 배경. 작성 시각을 씨앗으로 써서 같은 글은 늘 같은 색이 나온다.
export function placeholderGradient(seed: Date | string | number | null | undefined): string {
  let value = new Date(seed ?? 0).getTime() || 1;
  const random = () => {
    const x = Math.sin(value++) * 10000;
    return x - Math.floor(x);
  };
  const hue1 = Math.round(random() * 360);
  const hue2 = (hue1 + 30 + Math.round(random() * 60)) % 360;
  const direction = 120 + Math.round(random() * 60);
  return `linear-gradient(${direction}deg, hsl(${hue1} 52% 46%), hsl(${hue2} 58% 32%))`;
}

export function thumbnailStyle(thumbnailImageUrl: string | null | undefined, seed: Date | string | number | null | undefined) {
  if (thumbnailImageUrl) {
    return {
      backgroundImage: `url(${attachmentFileBaseUrl}${thumbnailImageUrl})`,
    };
  }
  return {
    backgroundImage: placeholderGradient(seed),
  };
}

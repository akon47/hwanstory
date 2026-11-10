import DataTransferObject from '@/api/models/common.dtos';
import { SimplePostDto } from '@/api/models/blog.dtos';

// 날짜별 조회수
export interface DailyViewsDto {
  // yyyy-MM-dd
  readonly date: string;
  readonly views: number;
}

// 글 하나의 통계 (post 에 전체 조회수·좋아요·댓글 수가 들어 있다)
export interface PostViewsDto {
  readonly post: SimplePostDto;
  // 조회 기간 동안의 조회수
  readonly recentViews: number;
}

// 내 글 통계
export interface MyPostStatsDto extends DataTransferObject {
  readonly days: number;
  // 오래된 날부터, 빈 날은 0
  readonly daily: Array<DailyViewsDto>;
  // 기간 조회수 많은 순
  readonly posts: Array<PostViewsDto>;
}

// 검색어와 검색 횟수
export interface SearchKeywordDto {
  readonly keyword: string;
  readonly count: number;
  readonly lastSearchedAt: string | null;
}

// 사이트 인사이트 (관리자용)
export interface InsightsDto extends DataTransferObject {
  readonly days: number;
  readonly daily: Array<DailyViewsDto>;
  readonly topPosts: Array<PostViewsDto>;
  readonly topKeywords: Array<SearchKeywordDto>;
}

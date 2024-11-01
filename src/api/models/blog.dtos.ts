import DataTransferObject from '@/api/models/common.dtos';
import { AccountDto, SimpleAccountDto } from '@/api/models/account.dtos';

// 블로그 상세 Dto
export interface BlogDetailsDto extends DataTransferObject {
  // 블로그 주인
  readonly owner: AccountDto;
  // 총 게시굴 수
  readonly postCount: number;
  // 태그 개수 목록
  readonly tagCounts: Array<TagCountDto>;
}

// 게시글 공개 유형
export type OpenType = 'PUBLIC' | 'PRIVATE'

// 게시글 작성/수정 Dto
export interface PostRequestDto extends DataTransferObject {
  // 게시글 URL
  readonly postUrl: string | null;
  // 제목
  readonly title: string;
  // 내용
  readonly content: string;
  // 공개 유형
  readonly openType: OpenType;
  // 요약 내용
  readonly summary?: string;
  // 썸네일 이미지 파일 Id
  readonly thumbnailFileId?: string;
  // 태그
  readonly tags: Array<TagDto>;
  // 시리즈 URL
  readonly seriesUrl: string | null;
}

// 게시글 Dto
export interface PostDto extends DataTransferObject {
  // 게시글 Id
  readonly id: string;
  // 게시글 URL
  readonly postUrl: string;
  // 제목
  readonly title: string;
  // 내용
  readonly content: string;
  // 공개 유형
  readonly openType: OpenType;
  // 요약 내용
  readonly summary?: string;
  // 썸네일 이미지 URL
  readonly thumbnailImageUrl?: string;
  // 작성자
  readonly author: SimpleAccountDto;
  // 태그
  readonly tags: Array<TagDto>;
  // 댓글
  readonly comments: Array<SimpleCommentDto>;
  // 좋아요 수
  readonly likeCount: number;
  // 조회수
  readonly hits: number;
  // 작성 시간
  readonly createdAt: Date;
  // 마지막 수정 시간
  readonly lastModifiedAt: Date;
  // 시리즈 URL
  readonly seriesUrl: string | null;
}

// 게시글 리스트 조회용 Dto
export interface SimplePostDto extends DataTransferObject {
  // 게시글 Id
  readonly id: string;
  // 게시글 URL
  readonly postUrl: string;
  // 제목
  readonly title: string;
  // 요약 내용
  readonly summary: string;
  // 공개 유형
  readonly openType: OpenType;
  // 썸네일 이미지 URL
  readonly thumbnailImageUrl: string;
  // 작성자
  readonly author: SimpleAccountDto;
  // 태그
  readonly tags: Array<TagDto>;
  // 댓글 수
  readonly commentCount: number;
  // 좋아요 수
  readonly likeCount: number;
  // 조회수
  readonly hits: number;
  // 작성 시간
  readonly createdAt: Date;
  // 마지막 수정 시간
  readonly lastModifiedAt: Date;
  // 시리즈 URL
  readonly seriesUrl: string | null;
}

// 댓글 작성/수정 Dto
export interface CommentRequestDto extends DataTransferObject {
  // 내용
  readonly content: string;
}

// 비회원 댓글 작성/수정 Dto
export interface GuestCommentRequestDto extends DataTransferObject {
  // 내용
  readonly content: string;
  // 이름
  readonly name: string;
  // 비밀번호
  readonly password: string;
}

// 댓글 Dto
export interface CommentDto extends DataTransferObject {
  // 댓글 Id
  readonly id: string;
  // 내용
  readonly content: string;
  // 부모 댓글 Id
  readonly parentId: string;
  // 대댓글
  readonly children: Array<SimpleCommentDto>;
  // 댓글이 달려있는 게시글
  readonly post: SimplePostDto;
  // 댓글을 단 사용자
  readonly author: SimpleAccountDto;
  // 작성 시간
  readonly createdAt: Date;
}

// 댓글 리스트 조회용 Dto
export interface SimpleCommentDto extends DataTransferObject {
  // 댓글 Id
  readonly id: string;
  // 내용
  readonly content: string;
  // 부모 댓글 Id
  readonly parentId: string;
  // 대댓글 개수
  readonly childrenCount: number;
  // 댓글을 단 사용자
  readonly author: SimpleAccountDto;
  // 작성 시간
  readonly createdAt: Date;
}

// 태그 Dto
export interface TagDto extends DataTransferObject {
  // 태그 이름
  readonly name: string;
}

// 태그 개수 Dto
export interface TagCountDto extends DataTransferObject {
  // 태그 이름
  readonly name: string;
  // 태그 개수
  readonly count: number;
}

// 시리즈 Dto
export interface SeriesDto extends DataTransferObject {
  // 시리즈 URL
  readonly seriesUrl: string;
  // 제목
  readonly title: string;
  // 게시글 목록
  readonly posts: Array<PostDto>;
}

// 시리즈 생성/수정 Dto
export interface SeriesRequestDto extends DataTransferObject {
  // 시리즈 URL
  readonly seriesUrl: string;
  // 제목
  readonly title: string;
}

// 시리즈 리스트 조회용 Dto
export interface SimpleSeriesDto extends DataTransferObject {
  // 시리즈 URL
  readonly seriesUrl: string;
  // 제목
  readonly title: string;
  // 게시글 수
  readonly postCount: number;
}

// 웹소켓 메시지 유형
export type MessageType = 'SESSION_COUNT_CHANGED' | null

// 웹소켓 메시지 Dto
export interface MessageDto extends DataTransferObject {
  readonly type: MessageType;
  readonly payload: unknown;
}
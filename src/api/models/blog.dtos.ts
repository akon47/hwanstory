import DataTransferObject from '@/api/models/common.dtos';
import { SimpleAccountDto } from '@/api/models/account.dtos';

// 게시글 작성/수정 Dto
export interface PostRequestDto extends DataTransferObject {
  // 게시글 URL
  readonly postUrl: string;
  // 제목
  readonly title: string;
  // 내용
  readonly content: string;
  // 태그
  readonly tags: Array<TagDto>;
}

// 게시글 Dto
export interface PostDto extends DataTransferObject {
  // 게시글 Id
  readonly id: string;
  // 게시글이 작성되어진 블로그 Id
  readonly blogId: string;
  // 게시글 URL
  readonly postUrl: string;
  // 제목
  readonly title: string;
  // 내용
  readonly content: string;
  // 태그
  readonly tags: Array<TagDto>;
  // 댓글
  readonly comments: Array<SimpleCommentDto>;
  // 좋아요 수
  readonly likeCount: number;
}

// 게시글 리스트 조회용 Dto
export interface SimplePostDto extends DataTransferObject {
  // 게시글 Id
  readonly id: string;
  // 게시글이 작성되어진 블로그 Id
  readonly blogId: string;
  // 게시글 URL
  readonly postUrl: string;
  // 제목
  readonly title: string;
  // 내용
  readonly content: string;
  // 태그
  readonly tags: Array<TagDto>;
  // 댓글 수
  readonly commentCount: number;
  // 좋아요 수
  readonly likeCount: number;
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
  readonly account: SimpleAccountDto;
}

// 태그 Dto
export interface TagDto extends DataTransferObject {
  // 태그 이름
  readonly name: string;
}
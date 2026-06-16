import { blogV1 } from './index';
import { SliceDto } from '@/api/models/common.dtos';
import {
  BlogDetailsDto,
  BlogStatisticsDto,
  CommentDto,
  CommentRequestDto,
  GuestCommentRequestDto,
  PostDto,
  PostRequestDto,
  ReactionDto,
  SeriesDto,
  SeriesRequestDto,
  SimplePostDto,
  SimpleSeriesDto
} from '@/api/models/blog.dtos';
import { HttpApiError } from '@/api/common/httpApiClient';

// 블로그 정보 조회
function getBlogDetails(blogId: string) {
  return blogV1.getRequest<BlogDetailsDto>(`/${blogId}`);
}

// 게시글 작성
function createPost(postRequestDto: PostRequestDto) {
  return blogV1.postRequest<PostDto>('/posts', null, postRequestDto);
}

// 게시글 수정
function modifyPost(postUrl: string, postRequestDto: PostRequestDto) {
  return blogV1.putRequest<PostDto>(`/posts/${postUrl}`, null, postRequestDto);
}

// 게시글 삭제
function deletePost(postUrl: string) {
  return blogV1.deleteRequest(`/posts/${postUrl}`);
}

// 게시글 조회
function getPost(blogId: string, postUrl: string) {
  return blogV1.getRequest<PostDto>(`/${blogId}/posts/${postUrl}`);
}

// 특정 블로그 전체 게시글 조회
function getBlogAllPosts(blogId: string, tag: string | null, size: number, cursorId: string | null = null) {
  return blogV1.getRequest<SliceDto<SimplePostDto>>(`/${blogId}/posts`, {
    cursorId: cursorId,
    size: size,
    ...tag && { tag: tag }
  });
}

// 특정 블로그 주인이 좋아요 한 전체 게시글 조회
function getBloggerLikePosts(blogId: string, size: number, cursorId: string | null = null) {
  return blogV1.getRequest<SliceDto<SimplePostDto>>(`/${blogId}/likes`, {
    cursorId: cursorId,
    size: size,
  });
}

// 전체 게시글 조회
function getAllPosts(size: number, cursorId: string | null = null, sortBy: string | null = null, search: string | null = null) {
  return blogV1.getRequest<SliceDto<SimplePostDto>>('/posts', {
    cursorId: cursorId,
    size: size,
    search: search,
    sortBy: sortBy
  });
}

// 댓글 작성
function createComment(blogId: string, postUrl: string, commentRequestDto: CommentRequestDto) {
  return blogV1.postRequest<CommentDto>(`/${blogId}/posts/${postUrl}/comments`, null, commentRequestDto);
}

// 비회원 댓글 작성
function createGuestComment(blogId: string, postUrl: string, guestCommentRequestDto: GuestCommentRequestDto) {
  return blogV1.postRequest<CommentDto>(`/${blogId}/posts/${postUrl}/comments/guest`, null, guestCommentRequestDto);
}

// 댓글 조회
function getComment(commentId: string) {
  return blogV1.getRequest<CommentDto>(`/comments/${commentId}`);
}

// 대댓글 작성
function createCommentToComment(commentId: string, commentRequestDto: CommentRequestDto) {
  return blogV1.postRequest<CommentDto>(`/comments/${commentId}`, null, commentRequestDto);
}

// 비회원 대댓글 작성
function createGuestCommentToComment(commentId: string, guestCommentRequestDto: GuestCommentRequestDto) {
  return blogV1.postRequest<CommentDto>(`/comments/${commentId}/guest`, null, guestCommentRequestDto);
}

// 댓글 수정
function modifyComment(commentId: string, commentRequestDto: CommentRequestDto, password: string | null = null) {
  return blogV1.putRequest<CommentDto>(`/comments/${commentId}`, password ? { password: password } : null, commentRequestDto);
}

// 댓글 삭제
function deleteComment(commentId: string, password: string | null = null) {
  return blogV1.deleteRequest(`/comments/${commentId}`, password ? { password: password } : null);
}

// 게시글 좋아요
function likePost(blogId: string, postUrl: string) {
  return blogV1.postRequest(`/${blogId}/posts/${postUrl}/likes`);
}

// 게시글 좋아요 취소
function unlikePost(blogId: string, postUrl: string) {
  return blogV1.deleteRequest(`/${blogId}/posts/${postUrl}/likes`);
}

// 게시글 좋아요 여부
async function isLikePost(blogId: string, postUrl: string): Promise<boolean> {
  try {
    await blogV1.getRequest(`/${blogId}/posts/${postUrl}/likes`);
    return true;
  } catch (error) {
    if ((error as HttpApiError).isNotFound()) {
      return false;
    }
    throw error;
  }
}

// 게시글 북마크 추가
function bookmarkPost(blogId: string, postUrl: string) {
  return blogV1.postRequest(`/${blogId}/posts/${postUrl}/bookmarks`);
}

// 게시글 북마크 취소
function unbookmarkPost(blogId: string, postUrl: string) {
  return blogV1.deleteRequest(`/${blogId}/posts/${postUrl}/bookmarks`);
}

// 게시글 북마크 여부
async function isBookmarked(blogId: string, postUrl: string): Promise<boolean> {
  try {
    await blogV1.getRequest(`/${blogId}/posts/${postUrl}/bookmarks`);
    return true;
  } catch (error) {
    if ((error as HttpApiError).isNotFound()) {
      return false;
    }
    throw error;
  }
}

// 내가 북마크 한 게시글 목록 조회
function getMyBookmarks(size: number, cursorId: string | null = null) {
  return blogV1.getRequest<SliceDto<SimplePostDto>>('/me/bookmarks', {
    cursorId: cursorId,
    size: size,
  });
}

// 게시글 이모지 반응 집계 조회
function getReactions(blogId: string, postUrl: string) {
  return blogV1.getRequest<Array<ReactionDto>>(`/${blogId}/posts/${postUrl}/reactions`);
}

// 게시글 이모지 반응 추가
function addReaction(blogId: string, postUrl: string, emoji: string) {
  return blogV1.postRequest(`/${blogId}/posts/${postUrl}/reactions`, null, { emoji });
}

// 게시글 이모지 반응 취소
function removeReaction(blogId: string, postUrl: string, emoji: string) {
  return blogV1.deleteRequest(`/${blogId}/posts/${postUrl}/reactions`, { emoji });
}

// 댓글 좋아요
function likeComment(commentId: string) {
  return blogV1.postRequest(`/comments/${commentId}/likes`);
}

// 댓글 좋아요 취소
function unlikeComment(commentId: string) {
  return blogV1.deleteRequest(`/comments/${commentId}/likes`);
}

// 댓글 좋아요 여부
async function isCommentLiked(commentId: string): Promise<boolean> {
  try {
    await blogV1.getRequest(`/comments/${commentId}/likes`);
    return true;
  } catch (error) {
    if ((error as HttpApiError).isNotFound()) {
      return false;
    }
    throw error;
  }
}

// 내 블로그 통계 조회
function getMyStatistics() {
  return blogV1.getRequest<BlogStatisticsDto>('/me/statistics');
}

// 관련 게시글 조회 (태그가 겹치는 공개 게시글)
function getRelatedPosts(blogId: string, postUrl: string, size = 5) {
  return blogV1.getRequest<Array<SimplePostDto>>(`/${blogId}/posts/${postUrl}/related`, {
    size: size,
  });
}

// 현재 한 명 이상이 보고 있는 공개 게시글 조회 (시청자 수 내림차순)
function getViewingPosts() {
  return blogV1.getRequest<Array<SimplePostDto>>('/posts/viewing');
}

// 특정 블로그 시리즈 게시글 조회
function getBlogSeriesPosts(blogId: string, seriesUrl: string) {
  return blogV1.getRequest<Array<SimplePostDto>>(`/${blogId}/series/${seriesUrl}/posts`);
}

// 시리즈 생성
function createSeries(seriesRequestDto: SeriesRequestDto) {
  return blogV1.postRequest<SeriesDto>(`/series`, null, seriesRequestDto);
}

// 시리즈 수정
function modifySeries(seriesUrl: string, seriesRequestDto: SeriesRequestDto) {
  return blogV1.putRequest<SeriesDto>(`/series/${seriesUrl}`, null, seriesRequestDto);
}

// 시리즈 삭제
function deleteSeries(seriesUrl: string) {
  return blogV1.deleteRequest(`/series/${seriesUrl}`);
}

// 특정 블로그 시리즈 상세 조회
function getBlogSeriesDetail(blogId: string, seriesUrl: string) {
  return blogV1.getRequest<SeriesDto>(`/${blogId}/series/${seriesUrl}`);
}

// 특정 블로그 시리즈 목록 조회
function getBlogSeries(blogId: string) {
  return blogV1.getRequest<Array<SimpleSeriesDto>>(`/${blogId}/series`);
}

export {
  getBlogDetails,
  createPost,
  modifyPost,
  deletePost,
  createComment,
  createGuestComment,
  modifyComment,
  deleteComment,
  getComment,
  createCommentToComment,
  createGuestCommentToComment,
  getPost,
  getBlogAllPosts,
  getBloggerLikePosts,
  getAllPosts,
  getRelatedPosts,
  getViewingPosts,
  likePost,
  unlikePost,
  isLikePost,
  bookmarkPost,
  unbookmarkPost,
  isBookmarked,
  getMyBookmarks,
  getReactions,
  addReaction,
  removeReaction,
  likeComment,
  unlikeComment,
  isCommentLiked,
  getMyStatistics,
  getBlogSeriesPosts,
  createSeries,
  modifySeries,
  deleteSeries,
  getBlogSeriesDetail,
  getBlogSeries,
};

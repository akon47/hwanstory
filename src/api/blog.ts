import { blogV1 } from './index';
import { SliceDto } from '@/api/models/common.dtos';
import {
  BlogDetailsDto,
  CommentDto,
  CommentRequestDto,
  GuestCommentRequestDto,
  PostDto,
  PostRequestDto,
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
function getAllPosts(size: number, cursorId: string | null = null, search: string | null = null) {
  return blogV1.getRequest<SliceDto<SimplePostDto>>('/posts', {
    cursorId: cursorId,
    size: size,
    search: search
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
function isLikePost(blogId: string, postUrl: string): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    blogV1.getRequest(`/${blogId}/posts/${postUrl}/likes`)
    .then(() => {
      resolve(true);
    })
    .catch((error: HttpApiError) => {
      if(error.isNotFound()) {
        resolve(false);
      } else {
        reject(error);
      }
    });
  });
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
  likePost,
  unlikePost,
  isLikePost,
  getBlogSeriesPosts,
  createSeries,
  modifySeries,
  deleteSeries,
  getBlogSeriesDetail,
  getBlogSeries,
};

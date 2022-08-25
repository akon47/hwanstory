import { blogV1 } from './index';
import DataTransferObject, { SliceDto } from '@/api/models/common.dtos';
import {
  BlogDetailsDto, CommentDto,
  CommentRequestDto,
  PostDto,
  PostRequestDto,
  SimplePostDto
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
function getBlogAllPosts(blogId: string, size: number, cursorId: string | null = null) {
  return blogV1.getRequest<SliceDto<SimplePostDto>>(`/${blogId}/posts`, {
    cursorId: cursorId,
    size: size,
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
function getAllPosts(size: number, cursorId: string | null = null) {
  return blogV1.getRequest<SliceDto<SimplePostDto>>('/posts', {
    cursorId: cursorId,
    size: size,
  });
}

// 댓글 작성
function createComment(blogId: string, postUrl: string, commentRequestDto: CommentRequestDto) {
  return blogV1.postRequest<CommentDto>(`/${blogId}/posts/${postUrl}/comments`, null, commentRequestDto);
}

// 댓글 조회
function getComment(commentId: string) {
  return blogV1.getRequest<CommentDto>(`/comments/${commentId}`);
}

// 대댓글 작성
function createCommentToComment(commentId: string, commentRequestDto: CommentRequestDto) {
  return blogV1.postRequest<CommentDto>(`/comments/${commentId}`, null, commentRequestDto);
}

// 게시글 수정
function modifyComment(commentId: string, commentRequestDto: CommentRequestDto) {
  return blogV1.putRequest<CommentDto>(`/comments/${commentId}`, null, commentRequestDto);
}

// 게시글 삭제
function deleteComment(commentId: string) {
  return blogV1.deleteRequest(`/comments/${commentId}`);
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

export {
  getBlogDetails,
  createPost,
  modifyPost,
  deletePost,
  createComment,
  modifyComment,
  deleteComment,
  getComment,
  createCommentToComment,
  getPost,
  getBlogAllPosts,
  getBloggerLikePosts,
  getAllPosts,
  likePost,
  unlikePost,
  isLikePost,
};
